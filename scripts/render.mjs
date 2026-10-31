#!/usr/bin/env node
/**
 * MiniMe promo — render pipeline (patch 17).
 *
 *   npm run render              1080p master  -> out/minime-chat-promo-1080p30.mp4 + out/poster.png + out/preview.gif
 *   npm run render:4k           3840x2160     -> out/minime-chat-promo-4k.mp4          (Remotion --scale=2)
 *   npm run render:frames       PNG sequence  -> out/frames/element-0000.png ... + out/minime-chat-promo-frames.mp4
 *   npm run render:all          master + 4K + PNG sequence
 *   npm run render -- --preview 960x540 draft -> out/minime-chat-promo-preview.mp4 (fast, no poster / gif)
 *
 * Every mode first runs scripts/make-sfx.mjs (idempotent, a few seconds) so public/audio and the audio manifest always
 * match the current film, then renders with Remotion, then post-processes with ffmpeg:
 *   - H.264 crf 16, yuv420p, +faststart, AAC 192 kbps
 *   - two-pass loudness normalisation: I = -16 LUFS, true peak <= -1.5 dBTP, LRA 11
 *   - poster.png from the hero frame, preview.gif (720 px wide, 15 fps, <= 8 MB)
 *
 * Options (all optional):
 *   --concurrency=N            parallel browser tabs. Lower it (2, or 1) if the machine runs out of memory.
 *   --browser-executable=PATH  use this Chrome / Chromium instead of the one Remotion downloads
 *   --gl=swangle               software GL (only needed on machines without a usable GPU)
 *   --range=A-B                render only frames A..B (quick test of the pipeline; the audio is cut to match)
 *   --poster-frame=N           frame for poster.png (default 1830: the finished end card, before the fade to black)
 *   --skip-sfx                 do not regenerate the SFX first
 *   --skip-poster, --skip-gif  leave those out
 *   --keep-raw                 keep the un-normalised Remotion output (out/.raw-*.mp4) for debugging
 */
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {
  ENTRY,
  LOUDNESS,
  OUT_DIR,
  ROOT,
  checkInstalled,
  checkNode,
  ensureDir,
  fail,
  fileSize,
  formatBytes,
  formatSeconds,
  hasAudioStream,
  intFlag,
  log,
  measureLoudnorm,
  parseArgs,
  rel,
  remotionHints,
  remotionRuntimeArgs,
  removePath,
  requireFfmpeg,
  runFfmpeg,
  runRemotion,
  runStreaming,
  verifyLoudness,
} from './lib/pipeline.mjs';

const SCRIPT = 'render';
const COMPOSITION = 'MiniMePromo';
const PREVIEW_COMPOSITION = 'MiniMePromo-Preview';
const DEFAULT_POSTER_FRAME = 1830; // end card complete (see docs/PATCH_NOTES.md patch 15B), the fade to black starts at 1840
const GIF_MAX_BYTES = 8 * 1024 * 1024;
const FPS = 30; // the film's frame rate (src/config/timeline.ts); only used to assemble the PNG sequence

const FILES = {
  master: path.join(OUT_DIR, 'minime-chat-promo-1080p30.mp4'),
  uhd: path.join(OUT_DIR, 'minime-chat-promo-4k.mp4'),
  preview: path.join(OUT_DIR, 'minime-chat-promo-preview.mp4'),
  frames: path.join(OUT_DIR, 'minime-chat-promo-frames.mp4'),
  poster: path.join(OUT_DIR, 'poster.png'),
  gif: path.join(OUT_DIR, 'preview.gif'),
  framesDir: path.join(OUT_DIR, 'frames'),
  audioMix: path.join(OUT_DIR, 'audio-mix.wav'),
};

const {flags} = parseArgs(process.argv.slice(2));
const known = new Set([
  '4k',
  'frames',
  'all',
  'preview',
  'concurrency',
  'browser-executable',
  'gl',
  'poster-frame',
  'range',
  'skip-sfx',
  'skip-poster',
  'skip-gif',
  'keep-raw',
  'help',
]);
for (const name of Object.keys(flags)) {
  if (!known.has(name)) {
    fail(SCRIPT, `Unknown option --${name}.`, [`Valid options: ${[...known].map((n) => `--${n}`).join(', ')}`]);
  }
}
if (flags.help) {
  console.log('Usage: npm run render [-- --4k | --frames | --all | --preview] [--range=A-B] [--concurrency=N] [--browser-executable=PATH] [--poster-frame=N] [--skip-sfx] [--skip-poster] [--skip-gif] [--keep-raw]');
  process.exit(0);
}

const wants = {
  master: flags.all === true || (!flags['4k'] && !flags.frames && !flags.preview),
  uhd: flags.all === true || flags['4k'] === true,
  frames: flags.all === true || flags.frames === true,
  preview: flags.preview === true,
};
const posterFrame = intFlag(SCRIPT, flags, 'poster-frame', DEFAULT_POSTER_FRAME);
const runtimeArgs = remotionRuntimeArgs(flags);
if (flags.range !== undefined) {
  if (typeof flags.range !== 'string' || !/^\d+-\d+$/.test(flags.range)) {
    fail(SCRIPT, `--range needs two frame numbers like 0-90, got "${flags.range}".`);
  }
  runtimeArgs.push(`--frames=${flags.range}`);
}
const startedAt = Date.now();
const results = [];

// ---------------------------------------------------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------------------------------------------------

const runNodeScript = async (script, label) => {
  const result = await runStreaming(process.execPath, [path.join(ROOT, 'scripts', script)]);
  if (result.code !== 0) {
    fail(SCRIPT, `${label} failed (scripts/${script}, exit code ${result.code}).`, [
      `Run it on its own to see the full error: node scripts/${script}`,
      'Make sure `npm install` finished without errors.',
    ]);
  }
};

const remotionOrFail = async (label, args, extraHints = []) => {
  const result = await runRemotion(args);
  if (result.code !== 0) {
    fail(SCRIPT, `${label} failed (Remotion exit code ${result.code}).`, [...remotionHints(result.stderrTail, result), ...extraHints]);
  }
};

const ffmpegOrFail = async (label, args) => {
  const result = await runFfmpeg(args);
  if (result.code !== 0) {
    fail(SCRIPT, `${label} failed (ffmpeg exit code ${result.code}).`, [
      'Scroll up for the ffmpeg message.',
      'Check free disk space (a 4K render needs several GB in out/).',
      'Update ffmpeg: an old build can lack the libx264 or aac encoders (check: ffmpeg -encoders).',
    ]);
  }
};

/** Render one composition to an un-normalised mp4. */
const renderVideo = async ({composition, output, scale, label}) => {
  log.step(`Remotion: rendering ${label}`);
  const args = [
    'render',
    ENTRY,
    composition,
    output,
    '--codec=h264',
    '--crf=16',
    '--pixel-format=yuv420p',
    // PNG frames, not JPEG: JPEG frames make ffmpeg tag the video yuvj420p (full range), PNG gives real yuv420p (tv range).
    '--image-format=png',
    '--audio-codec=aac',
    '--audio-bitrate=192k',
    '--overwrite',
    ...runtimeArgs,
  ];
  if (scale && scale !== 1) {
    args.push(`--scale=${scale}`);
  }
  const t0 = Date.now();
  await remotionOrFail(`Rendering ${label}`, args);
  log.ok(`${label} rendered in ${formatSeconds(Date.now() - t0)} (${formatBytes(fileSize(output))} before loudness pass)`);
};

/** Pass 2 of loudnorm: copy the video untouched, normalise and re-encode only the audio, move the moov atom up front. */
const normalizeVideo = async (rawFile, finalFile, label) => {
  log.step(`ffmpeg: loudness pass for ${label} (I=${LOUDNESS.I} LUFS, TP=${LOUDNESS.TP} dB, LRA=${LOUDNESS.LRA})`);
  if (!(await hasAudioStream(rawFile))) {
    log.warn('The render has no audio track (a --range without any sound cue, or no audio at all). Skipping normalisation, only moving the index to the front of the file.');
    await ffmpegOrFail(`Remux for ${label}`, ['-i', rawFile, '-c', 'copy', '-movflags', '+faststart', finalFile]);
    log.ok(`${rel(finalFile)} written (${formatBytes(fileSize(finalFile))}, no audio)`);
    return;
  }
  const {filter, measured} = await measureLoudnorm(rawFile);
  if (measured) {
    log.info(`measured before: ${measured.i.toFixed(1)} LUFS, true peak ${measured.tp.toFixed(1)} dBTP`);
  }
  await ffmpegOrFail(`Loudness pass for ${label}`, [
    '-i',
    rawFile,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0',
    '-c:v',
    'copy',
    '-af',
    filter,
    '-ar',
    '48000',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    finalFile,
  ]);
  const after = await verifyLoudness(finalFile);
  if (after) {
    log.ok(`${rel(finalFile)}: ${after.i.toFixed(1)} LUFS, true peak ${after.tp.toFixed(1)} dBTP, ${formatBytes(fileSize(finalFile))}`);
    if (after.tp > LOUDNESS.TP + 0.3) {
      log.warn(`True peak is above ${LOUDNESS.TP} dBTP after normalisation (AAC re-encode overshoot). Lower the SFX volumes in src/config/sfx.ts if a platform complains.`);
    }
  } else {
    log.ok(`${rel(finalFile)} written (${formatBytes(fileSize(finalFile))})`);
  }
};

const makePoster = async (videoFile) => {
  log.step(`ffmpeg: poster from frame ${posterFrame}`);
  await ffmpegOrFail('Poster extraction', [
    '-i',
    videoFile,
    '-vf',
    `select=eq(n\\,${posterFrame})`,
    '-frames:v',
    '1',
    '-update',
    '1',
    FILES.poster,
  ]);
  if (fileSize(FILES.poster) === 0) {
    fail(SCRIPT, `Frame ${posterFrame} does not exist in the rendered video, so no poster was written.`, [
      `The film has fewer frames than ${posterFrame}. Pick one inside it: npm run render -- --poster-frame=1700`,
    ]);
  }
  log.ok(`${rel(FILES.poster)} (${formatBytes(fileSize(FILES.poster))})`);
};

/** Quality ladder: the first rung that fits in 8 MB wins. Width 720 and 15 fps are the target; later rungs trade them for size. */
const GIF_LADDER = [
  {fps: 15, width: 720, colors: 128, dither: 'bayer:bayer_scale=5'},
  {fps: 15, width: 720, colors: 64, dither: 'bayer:bayer_scale=5'},
  {fps: 12, width: 720, colors: 48, dither: 'bayer:bayer_scale=5'},
  {fps: 10, width: 720, colors: 32, dither: 'bayer:bayer_scale=5'},
  {fps: 10, width: 640, colors: 32, dither: 'none'},
  {fps: 8, width: 540, colors: 24, dither: 'none'},
  {fps: 6, width: 480, colors: 16, dither: 'none'},
];

const makeGif = async (videoFile) => {
  log.step('ffmpeg: preview.gif (target 720 px wide, 15 fps, <= 8 MB)');
  let written = false;
  for (const [index, rung] of GIF_LADDER.entries()) {
    const filter =
      `fps=${rung.fps},scale=${rung.width}:-1:flags=lanczos,split[a][b];` +
      `[a]palettegen=max_colors=${rung.colors}:stats_mode=diff[p];` +
      `[b][p]paletteuse=dither=${rung.dither}:diff_mode=rectangle`;
    const result = await runFfmpeg(['-i', videoFile, '-an', '-filter_complex', filter, '-loop', '0', FILES.gif]);
    if (result.code !== 0) {
      fail(SCRIPT, `GIF encoding failed (ffmpeg exit code ${result.code}).`, ['Scroll up for the ffmpeg message.', 'Skip the GIF with: npm run render -- --skip-gif']);
    }
    const size = fileSize(FILES.gif);
    log.info(`attempt ${index + 1}: ${rung.width}px, ${rung.fps} fps, ${rung.colors} colours -> ${formatBytes(size)}`);
    if (size <= GIF_MAX_BYTES) {
      written = true;
      if (index > 0) {
        log.warn(`Needed a lighter setting than 720 px / 15 fps to stay under 8 MB (the film is long). Result: ${rung.width}px at ${rung.fps} fps.`);
      }
      break;
    }
  }
  if (!written) {
    log.warn(`Even the lightest setting is above 8 MB (${formatBytes(fileSize(FILES.gif))}). Use out/poster.png or the mp4 for sharing, or trim the film range.`);
  } else {
    log.ok(`${rel(FILES.gif)} (${formatBytes(fileSize(FILES.gif))})`);
  }
};

// ---------------------------------------------------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------------------------------------------------

const renderMaster = async () => {
  log.title('1080p master');
  const raw = path.join(OUT_DIR, '.raw-1080p30.mp4');
  await renderVideo({composition: COMPOSITION, output: raw, scale: 1, label: '1920x1080 @ 30 fps'});
  await normalizeVideo(raw, FILES.master, 'the 1080p master');
  if (!flags['keep-raw']) {
    removePath(raw);
  }
  if (!flags['skip-poster']) {
    await makePoster(FILES.master);
  }
  if (!flags['skip-gif']) {
    await makeGif(FILES.master);
  }
  results.push(FILES.master);
  if (!flags['skip-poster']) {
    results.push(FILES.poster);
  }
  if (!flags['skip-gif']) {
    results.push(FILES.gif);
  }
};

const renderPreview = async () => {
  log.title('960x540 preview');
  const raw = path.join(OUT_DIR, '.raw-preview.mp4');
  await renderVideo({composition: PREVIEW_COMPOSITION, output: raw, scale: 1, label: '960x540 preview'});
  await normalizeVideo(raw, FILES.preview, 'the preview');
  if (!flags['keep-raw']) {
    removePath(raw);
  }
  results.push(FILES.preview);
};

const renderUhd = async () => {
  log.title('4K (3840x2160)');
  const raw = path.join(OUT_DIR, '.raw-4k.mp4');
  await renderVideo({composition: COMPOSITION, output: raw, scale: 2, label: '3840x2160 @ 30 fps (--scale=2)'});
  await normalizeVideo(raw, FILES.uhd, 'the 4K master');
  if (!flags['keep-raw']) {
    removePath(raw);
  }
  results.push(FILES.uhd);
};

const renderFrames = async () => {
  log.title('PNG sequence (ffmpeg-only route)');
  removePath(FILES.framesDir);
  ensureDir(FILES.framesDir);
  log.step('Remotion: rendering PNG frames');
  const t0 = Date.now();
  await remotionOrFail('Rendering the PNG sequence', [
    'render',
    ENTRY,
    COMPOSITION,
    FILES.framesDir,
    '--sequence',
    '--image-format=png',
    '--overwrite',
    ...runtimeArgs,
  ]);
  // Remotion pads the number to the width of the last frame (element-0000.png for the full 1860-frame film); read the
  // real pattern from the folder so a --range test render assembles too.
  const entries = readdirSync(FILES.framesDir)
    .map((name) => /^element-(\d+)\.png$/.exec(name))
    .filter(Boolean)
    .map((match) => ({digits: match[1].length, index: Number(match[1])}));
  if (entries.length === 0) {
    fail(SCRIPT, 'Remotion finished but out/frames/ contains no element-XXXX.png files.', ['Check that the folder is writable and that disk space is free.']);
  }
  const digits = entries[0].digits;
  const firstIndex = Math.min(...entries.map((entry) => entry.index));
  log.ok(`${entries.length} frames in ${rel(FILES.framesDir)} (${formatSeconds(Date.now() - t0)})`);

  log.step('Mixing the SFX bed (scripts/mix-audio.mjs)');
  await runNodeScript('mix-audio.mjs', 'The SFX mixdown');
  if (!existsSync(FILES.audioMix)) {
    fail(SCRIPT, 'out/audio-mix.wav was not written by the mixdown.', ['Run: npm run sfx && npm run mix']);
  }

  log.step('ffmpeg: assembling frames + audio-mix.wav');
  const {filter, measured} = await measureLoudnorm(FILES.audioMix);
  if (measured) {
    log.info(`audio bed measured: ${measured.i.toFixed(1)} LUFS, true peak ${measured.tp.toFixed(1)} dBTP`);
  }
  await ffmpegOrFail('Assembling the PNG sequence', [
    '-framerate',
    String(FPS),
    '-start_number',
    String(firstIndex),
    '-i',
    path.join(FILES.framesDir, `element-%0${digits}d.png`),
    // the audio bed always starts at film frame 0; skip ahead when only a --range was rendered
    '-ss',
    (firstIndex / FPS).toFixed(3),
    '-i',
    FILES.audioMix,
    '-c:v',
    'libx264',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    '-af',
    filter,
    '-ar',
    '48000',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    FILES.frames,
  ]);
  log.ok(`${rel(FILES.frames)} (${formatBytes(fileSize(FILES.frames))})`);
  if (existsSync(path.join(ROOT, 'public', 'audio', 'music.mp3'))) {
    log.warn('public/audio/music.mp3 exists but this route only contains the SFX bed. The README ("Music" section) has the ffmpeg line that adds the music.');
  }
  results.push(FILES.framesDir, FILES.frames);
};

// ---------------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------------

const main = async () => {
  checkNode(SCRIPT);
  checkInstalled(SCRIPT);
  log.title('MiniMe chat promo — render');
  const version = requireFfmpeg(SCRIPT);
  log.info(version);
  log.info(`modes: ${Object.entries(wants).filter(([, on]) => on).map(([name]) => name).join(', ')}`);
  if (runtimeArgs.length > 0) {
    log.info(`Remotion options: ${runtimeArgs.join(' ')}`);
  }
  ensureDir(OUT_DIR);

  if (!flags['skip-sfx']) {
    log.step('Generating the SFX (scripts/make-sfx.mjs)');
    await runNodeScript('make-sfx.mjs', 'The SFX synthesizer');
  }

  if (wants.preview) {
    await renderPreview();
  }
  if (wants.master) {
    await renderMaster();
  }
  if (wants.uhd) {
    await renderUhd();
  }
  if (wants.frames) {
    await renderFrames();
  }

  log.title(`Done in ${formatSeconds(Date.now() - startedAt)}`);
  for (const file of results) {
    log.ok(rel(file));
  }
  console.log('');
};

main().catch((error) => {
  fail(SCRIPT, `Unexpected error: ${error instanceof Error ? error.message : String(error)}`, ['Run the same command again; if it repeats, copy the message above when asking for help.']);
});
