#!/usr/bin/env node
/**
 * MiniMe promo — key-frame stills for visual QA (patch 17).
 *
 *   npm run check                              15 stills of MiniMePromo -> out/stills/frame-0060.png ...
 *   npm run check -- --frames=60,330,1830      only these frames
 *   npm run check -- --scale=0.5               half-size stills (faster, smaller)
 *
 * The project is bundled ONCE (out/.bundle) and every still is rendered from that bundle, so 15 stills take about as
 * long as one render start-up plus a few seconds per frame. Afterwards ffmpeg (if installed) builds
 * out/stills/contact-sheet.png: a single image with every still (reading order = the frame order printed in the log), for a quick look.
 *
 * Open the PNGs and LOOK at them before you render the film. The list below is the one from the build brief (§12).
 *
 * Options: --concurrency=N, --browser-executable=PATH, --gl=swangle (same meaning as in `npm run render`),
 *          --composition=ID (default MiniMePromo), --keep-bundle (keep out/.bundle for the next run).
 */
import {readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {
  ENTRY,
  OUT_DIR,
  checkInstalled,
  checkNode,
  ensureDir,
  fail,
  ffmpegVersion,
  fileSize,
  formatBytes,
  formatSeconds,
  log,
  parseArgs,
  rel,
  remotionHints,
  remotionRuntimeArgs,
  removePath,
  runFfmpeg,
  runRemotion,
} from './lib/pipeline.mjs';

const SCRIPT = 'check-stills';
const STILLS_DIR = path.join(OUT_DIR, 'stills');
const BUNDLE_DIR = path.join(OUT_DIR, '.bundle');
const DEFAULT_FRAMES = [60, 200, 330, 420, 640, 700, 860, 990, 1070, 1140, 1260, 1400, 1480, 1600, 1700];

const {flags} = parseArgs(process.argv.slice(2));
const known = new Set(['frames', 'scale', 'concurrency', 'browser-executable', 'gl', 'composition', 'keep-bundle', 'help']);
for (const name of Object.keys(flags)) {
  if (!known.has(name)) {
    fail(SCRIPT, `Unknown option --${name}.`, [`Valid options: ${[...known].map((n) => `--${n}`).join(', ')}`]);
  }
}
if (flags.help) {
  console.log('Usage: npm run check [-- --frames=60,330,1830] [--scale=0.5] [--composition=ID] [--concurrency=N] [--browser-executable=PATH] [--keep-bundle]');
  process.exit(0);
}

const composition = typeof flags.composition === 'string' ? flags.composition : 'MiniMePromo';

const parseFrames = () => {
  if (typeof flags.frames !== 'string') {
    return DEFAULT_FRAMES;
  }
  const list = flags.frames.split(',').map((item) => item.trim()).filter(Boolean);
  const frames = list.map(Number);
  if (frames.length === 0 || frames.some((n) => !Number.isInteger(n) || n < 0)) {
    fail(SCRIPT, `--frames needs comma-separated frame numbers, got "${flags.frames}".`, ['Example: npm run check -- --frames=60,330,1830']);
  }
  return [...new Set(frames)];
};

let scale = 1;
if (typeof flags.scale === 'string') {
  scale = Number(flags.scale);
  if (!(scale > 0 && scale <= 4)) {
    fail(SCRIPT, `--scale needs a number between 0 and 4, got "${flags.scale}".`);
  }
}

const frames = parseFrames();
const runtimeArgs = remotionRuntimeArgs(flags);
const frameName = (frame) => `frame-${String(frame).padStart(4, '0')}.png`;

const remotionOrFail = async (label, args) => {
  const result = await runRemotion(args);
  if (result.code !== 0) {
    fail(SCRIPT, `${label} failed (Remotion exit code ${result.code}).`, remotionHints(result.stderrTail, result));
  }
  return result;
};

/** One image with every still, 5 per row, in the order of `files` (skipped when ffmpeg is missing). */
const makeContactSheet = async (files) => {
  if (!ffmpegVersion()) {
    log.warn('ffmpeg not found: skipping the contact sheet (the stills themselves are fine).');
    return;
  }
  const columns = Math.min(5, files.length);
  const rows = Math.ceil(files.length / columns);
  const listFile = path.join(STILLS_DIR, '.contact-list.txt');
  const quote = (file) => `file '${file.split(path.sep).join('/').replace(/'/g, "'\\''")}'\nduration 1`;
  writeFileSync(listFile, `${files.map((entry) => quote(entry.file)).join('\n')}\n`);
  const sheet = path.join(STILLS_DIR, 'contact-sheet.png');
  const result = await runFfmpeg(
    [
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-vf',
      `scale=480:-1,tile=${columns}x${rows}:padding=6:color=0x0a0a0a`,
      '-frames:v',
      '1',
      sheet,
    ],
    {loglevel: 'error'},
  );
  removePath(listFile);
  if (result.code !== 0 || fileSize(sheet) === 0) {
    log.warn('Could not build the contact sheet (not important). Open the stills one by one instead.');
    return;
  }
  log.ok(`${rel(sheet)} (${formatBytes(fileSize(sheet))}), frames in reading order: ${files.map((entry) => entry.frame).join(', ')}`);
};

const main = async () => {
  checkNode(SCRIPT);
  checkInstalled(SCRIPT);
  log.title('MiniMe chat promo — key-frame stills');
  log.info(`composition ${composition}, ${frames.length} frames: ${frames.join(', ')}${scale !== 1 ? `, scale ${scale}` : ''}`);
  ensureDir(STILLS_DIR);
  // stills of an earlier run with a different frame list would otherwise sit next to the new ones
  for (const name of readdirSync(STILLS_DIR)) {
    if (/^frame-\d+\.png$/.test(name) || name === 'contact-sheet.png') {
      removePath(path.join(STILLS_DIR, name));
    }
  }

  const startedAt = Date.now();
  log.step('Bundling the project once (out/.bundle)');
  removePath(BUNDLE_DIR);
  await remotionOrFail('Bundling', ['bundle', ENTRY, `--out-dir=${BUNDLE_DIR}`, '--quiet']);
  log.ok('bundle ready');

  const written = [];
  for (const [index, frame] of frames.entries()) {
    const file = path.join(STILLS_DIR, frameName(frame));
    log.step(`Still ${index + 1}/${frames.length}: frame ${frame}`);
    const args = ['still', BUNDLE_DIR, composition, file, `--frame=${frame}`, '--image-format=png', '--overwrite', '--log=warn', ...runtimeArgs];
    if (scale !== 1) {
      args.push(`--scale=${scale}`);
    }
    const result = await runRemotion(args);
    if (result.code !== 0) {
      const outOfRange = result.stderrTail.toLowerCase().includes('frame') && result.stderrTail.toLowerCase().includes('range');
      fail(
        SCRIPT,
        `Rendering frame ${frame} failed (Remotion exit code ${result.code}).`,
        [...(outOfRange ? [`Frame ${frame} may be outside the film. Check TOTAL_FRAMES in src/config/timeline.ts (frames count from 0).`] : []), ...remotionHints(result.stderrTail, result)],
      );
    }
    if (fileSize(file) === 0) {
      fail(SCRIPT, `Remotion reported success but ${rel(file)} is empty.`, ['Check free disk space and try again.']);
    }
    written.push({frame, file});
    log.ok(`${rel(file)} (${formatBytes(fileSize(file))})`);
  }

  if (!flags['keep-bundle']) {
    removePath(BUNDLE_DIR);
  }

  log.step('Contact sheet');
  await makeContactSheet(written);

  log.title(`Done in ${formatSeconds(Date.now() - startedAt)}`);
  log.ok(`${written.length} stills in ${rel(STILLS_DIR)}/ — open them and look at every one before rendering the film.`);
  console.log('');
};

main().catch((error) => {
  fail(SCRIPT, `Unexpected error: ${error instanceof Error ? error.message : String(error)}`, ['Run the same command again; if it repeats, copy the message above when asking for help.']);
});
