#!/usr/bin/env node
/**
 * MiniMe promo — the SHORT clip.
 *
 *   npm run short                    out/minime-chat-promo-1080p30.mp4  ->  out/minime-chat-promo-short.mp4
 *   npm run short -- --src=FILE      cut from another render of the film (it must be the full 62 s film, 30 fps)
 *   npm run short -- --out=FILE      write the clip somewhere else
 *
 * Cuts three of the best moments out of the film you ALREADY rendered and joins them into one silent clip under 8 s.
 * No logo, no reveal, no end card, no audio: only the product working. Nothing is re-rendered, it just runs ffmpeg on the
 * finished mp4, so it takes a few seconds.
 *
 * TO CHANGE THE CUT: edit SEGMENTS below. `from` is the first film frame, `to` is the first frame that is NOT in the clip
 * (30 fps, so 30 frames = 1 s). The script refuses a cut of 8 s or more. To look at frames before you pick them:
 *   npm run check -- --scale=0.5 --frames=1100,1400      (writes out/stills/)
 * Other strong moments: f860-960 (the answer streams in while the team works), f1400 (the sidebar search filters live).
 */
import {existsSync, statSync} from 'node:fs';
import path from 'node:path';
import {OUT_DIR, ensureDir, fail, formatBytes, log, parseArgs, rel, requireFfmpeg, runCaptured, runFfmpeg} from './lib/pipeline.mjs';

const SCRIPT = 'short';
const FPS = 30;
const FILM_FRAMES = 1860; // the whole film (src/config/timeline.ts TOTAL_FRAMES)
const MAX_SECONDS = 8; // the clip must stay strictly under this

// The cut, in film order. The frame numbers are the film's own (src/config/script.ts); each boundary was checked on a still.
const SEGMENTS = [
  {name: 'team', from: 704, to: 800, why: 'the routing graph builds the team: strategist, market_researcher, code_writer'},
  {name: 'control', from: 1240, to: 1300, why: 'Review staffed roles, "Approve & run", the team starts, Pause'},
  {name: 'devices', from: 1656, to: 1728, why: 'laptop and phone, "On every screen.", zoom into the phone'},
];

const {flags} = parseArgs(process.argv.slice(2));
const known = new Set(['src', 'out', 'help']);
const unknown = Object.keys(flags).filter((key) => !known.has(key));

if (flags.help) {
  console.log(`Usage: npm run short [-- --src=FILE] [-- --out=FILE]

  --src=FILE   the full film to cut from (default out/minime-chat-promo-1080p30.mp4)
  --out=FILE   where to write the clip (default out/minime-chat-promo-short.mp4)

The clip is ${SEGMENTS.length} cuts of the film already rendered, joined with hard cuts, no audio, under ${MAX_SECONDS} s.
Edit SEGMENTS at the top of scripts/make-short.mjs to change which moments it uses.`);
  process.exit(0);
}
if (unknown.length > 0) {
  fail(SCRIPT, `unknown option --${unknown[0]}.`, ['Run `npm run short -- --help` to see the options.']);
}
for (const key of ['src', 'out']) {
  if (flags[key] === true || flags[key] === '') {
    fail(SCRIPT, `--${key} needs a file path, for example --${key}="C:\\videos\\file.mp4".`);
  }
}

const SRC = path.resolve(typeof flags.src === 'string' ? flags.src : path.join(OUT_DIR, 'minime-chat-promo-1080p30.mp4'));
const DEST = path.resolve(typeof flags.out === 'string' ? flags.out : path.join(OUT_DIR, 'minime-chat-promo-short.mp4'));

const shown = (file) => (file.startsWith(path.resolve(OUT_DIR, '..')) ? rel(file) : file);
const seconds = (frames) => (frames / FPS).toFixed(1);

/** ffprobe the first video stream. Returns {width, height, fps, frames, hasAudio, pixFmt, codec, duration}. */
const probe = async (file) => {
  const result = await runCaptured('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]);
  if (result.code !== 0) {
    fail(SCRIPT, `ffprobe could not read ${shown(file)}.`, [
      'The file is not a valid video: render the film again with `npm run render`.',
      'ffprobe comes with ffmpeg; check that `ffprobe -version` works in this terminal.',
      result.stderr.trim().split(/\r?\n/).slice(-2).join(' '),
    ]);
  }
  const info = JSON.parse(result.stdout);
  const video = info.streams.find((stream) => stream.codec_type === 'video');
  const [num, den] = String(video?.avg_frame_rate ?? '0/1').split('/').map(Number);
  const duration = Number(video?.duration ?? info.format?.duration);
  const counted = Number(video?.nb_frames);
  return {
    video,
    width: video?.width,
    height: video?.height,
    fps: den ? num / den : NaN,
    frames: Number.isFinite(counted) && counted > 0 ? counted : Math.round(duration * (den ? num / den : FPS)),
    hasAudio: info.streams.some((stream) => stream.codec_type === 'audio'),
    pixFmt: video?.pix_fmt,
    codec: video?.codec_name,
    duration: Number(info.format?.duration),
  };
};

const checkSegments = () => {
  let total = 0;
  let previousEnd = -1;
  for (const segment of SEGMENTS) {
    const {name, from, to} = segment;
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to <= from || to > FILM_FRAMES) {
      fail(SCRIPT, `SEGMENTS "${name}" is not a valid frame range (${from} to ${to}; the film has frames 0 to ${FILM_FRAMES - 1}).`, [
        'Edit SEGMENTS at the top of scripts/make-short.mjs: from < to, both whole numbers inside the film.',
      ]);
    }
    if (from < previousEnd) {
      fail(SCRIPT, `SEGMENTS "${name}" starts before the cut before it ends.`, ['Keep the cuts in film order and not overlapping.']);
    }
    previousEnd = to;
    total += to - from;
  }
  if (total >= MAX_SECONDS * FPS) {
    fail(SCRIPT, `the cut is ${total} frames (${(total / FPS).toFixed(2)} s), not under ${MAX_SECONDS} s.`, [
      `Shorten SEGMENTS in scripts/make-short.mjs to under ${MAX_SECONDS * FPS} frames in total.`,
    ]);
  }
  return total;
};

const main = async () => {
  const total = checkSegments();
  requireFfmpeg(SCRIPT);

  log.title('MiniMe chat promo — short clip');
  if (!existsSync(SRC)) {
    fail(SCRIPT, `cannot find ${shown(SRC)}.`, [
      'Render the film first: `npm run render` (it writes out/minime-chat-promo-1080p30.mp4).',
      'Or point to the mp4 you already have: `npm run short -- --src="C:\\path\\to\\your-film.mp4"`.',
    ]);
  }
  if (path.resolve(DEST) === SRC) {
    fail(SCRIPT, '--out is the same file as the source.', ['Choose another --out.']);
  }

  const source = await probe(SRC);
  if (!source.video) {
    fail(SCRIPT, `${shown(SRC)} has no video stream.`, ['Pass the film as rendered by `npm run render` with --src=FILE.']);
  }
  if (!Number.isFinite(source.fps) || Math.abs(source.fps - FPS) > 0.01) {
    fail(SCRIPT, `${shown(SRC)} runs at ${source.fps.toFixed(2)} fps; the cuts are frame numbers of a ${FPS} fps film.`, [
      `Use the film as rendered (${FPS} fps), not a re-encode at another frame rate.`,
    ]);
  }
  const last = Math.max(...SEGMENTS.map((segment) => segment.to));
  if (!Number.isFinite(source.frames) || source.frames < last) {
    fail(SCRIPT, `${shown(SRC)} has only ${source.frames} frames; the cut needs ${last}.`, [
      `Pass the full film (${FILM_FRAMES} frames, 1:02) with --src=FILE, not a preview or a --range render.`,
    ]);
  }
  if (Math.abs(source.frames - FILM_FRAMES) > 2) {
    log.warn(`The video has ${source.frames} frames, the film has ${FILM_FRAMES}. The cuts assume the film's own timeline; if you re-timed the film, check the clip.`);
  }
  log.info(`${shown(SRC)}: ${source.width}x${source.height}, ${source.frames} frames${source.hasAudio ? ' (the audio is left out)' : ''}`);
  for (const segment of SEGMENTS) {
    log.info(`${segment.name.padEnd(8)} f${segment.from}-${segment.to - 1}  ${seconds(segment.to - segment.from)} s  ${segment.why}`);
  }

  // One input, one frame-exact trim per segment (`end_frame` is exclusive), joined by concat. No audio is mapped.
  const trims = SEGMENTS.map((segment, i) => `[0:v]trim=start_frame=${segment.from}:end_frame=${segment.to},setpts=PTS-STARTPTS[v${i}]`);
  const join = `${SEGMENTS.map((_, i) => `[v${i}]`).join('')}concat=n=${SEGMENTS.length}:v=1:a=0[v]`;
  ensureDir(path.dirname(DEST));
  log.step('Cutting');
  const run = await runFfmpeg([
    '-i', SRC,
    '-filter_complex', [...trims, join].join(';'),
    '-map', '[v]',
    '-an',
    '-r', String(FPS),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '16',
    '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-movflags', '+faststart',
    DEST,
  ]);
  if (run.code !== 0) {
    fail(SCRIPT, 'ffmpeg failed while cutting the clip.', [
      'Read the ffmpeg message above. If it mentions a missing filter or encoder, update ffmpeg to a recent full build.',
      run.spawnError ? 'ffmpeg could not be started: check `ffmpeg -version` in this terminal.' : 'Run the command again; if it repeats, try another --out folder.',
    ]);
  }

  const clip = await probe(DEST);
  const problems = [];
  if (clip.codec !== 'h264') problems.push(`video codec is ${clip.codec}, expected h264`);
  if (clip.pixFmt !== 'yuv420p') problems.push(`pixel format is ${clip.pixFmt}, expected yuv420p`);
  if (clip.width !== source.width || clip.height !== source.height) problems.push(`size is ${clip.width}x${clip.height}, expected ${source.width}x${source.height}`);
  if (clip.frames !== total) problems.push(`${clip.frames} frames, expected ${total}`);
  if (clip.hasAudio) problems.push('the clip has an audio stream');
  if (!Number.isFinite(clip.duration) || clip.duration >= MAX_SECONDS) problems.push(`duration ${clip.duration} s is not under ${MAX_SECONDS} s`);
  if (problems.length > 0) {
    fail(SCRIPT, `${shown(DEST)} failed verification: ${problems.join('; ')}.`, ['Run the command again; if it repeats, update ffmpeg.']);
  }
  log.ok(`${shown(DEST)}  ${clip.duration.toFixed(2)} s, ${total} frames, ${clip.width}x${clip.height}, no audio, ${formatBytes(statSync(DEST).size)}`);
};

main().catch((error) => fail(SCRIPT, error?.message ?? String(error), ['Run again; set the DEBUG environment variable to see the full error.']));
