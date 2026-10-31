/**
 * MiniMe promo — shared helpers for scripts/render.mjs and scripts/check-stills.mjs (patch 17).
 *
 * Pure Node (>= 20), no dependencies, Windows friendly: child processes are started WITHOUT a shell, the Remotion CLI
 * is run through `process.execPath` (node) instead of `npx`, and every path is built with node:path.
 */
import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, rmSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT_DIR = path.join(ROOT, 'out');
export const ENTRY = 'src/index.ts';
export const REMOTION_CLI = path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');

// ---------------------------------------------------------------------------------------------------------------------
// Console output
// ---------------------------------------------------------------------------------------------------------------------

const tty = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const paint = (code, text) => (tty ? `\u001b[${code}m${text}\u001b[0m` : text);

export const log = {
  title: (text) => console.log(`\n${paint('1;35', `== ${text} ==`)}`),
  step: (text) => console.log(`\n${paint('1;36', `> ${text}`)}`),
  info: (text) => console.log(`  ${text}`),
  ok: (text) => console.log(`  ${paint('32', 'OK')}  ${text}`),
  warn: (text) => console.warn(`  ${paint('33', 'WARN')}  ${text}`),
};

/** Print what went wrong plus a numbered list of fixes, then exit with a failing code. Never returns. */
export const fail = (script, message, hints = []) => {
  console.error(`\n${paint('1;31', `${script}: ${message}`)}`);
  if (hints.length > 0) {
    console.error('\nHow to fix it:');
    hints.forEach((hint, index) => console.error(`  ${index + 1}. ${hint}`));
  }
  console.error('');
  process.exit(1);
};

export const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export const formatSeconds = (ms) => {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`;
};

export const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

// ---------------------------------------------------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Tiny argv parser. `--flag` -> true, `--key=value` -> 'value'. Anything without `--` is collected in `_`.
 * `npm run render -- --4k` and `npm run render:4k` both end up here.
 */
export const parseArgs = (argv) => {
  const flags = {};
  const rest = [];
  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      rest.push(arg);
      continue;
    }
    const body = arg.slice(2);
    const eq = body.indexOf('=');
    if (eq === -1) {
      flags[body] = true;
    } else {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
    }
  }
  return {flags, rest};
};

/** Read an integer flag; exits with a clear message when the value is not a positive integer. */
export const intFlag = (script, flags, name, fallback) => {
  const raw = flags[name];
  if (raw === undefined || raw === true) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    fail(script, `--${name} needs a whole number, got "${raw}".`);
  }
  return value;
};

// ---------------------------------------------------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------------------------------------------------

export const checkNode = (script) => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) {
    fail(script, `Node ${process.versions.node} is too old (needs Node 20 or newer).`, [
      'Install the Node 20 LTS (or newer) from https://nodejs.org and open a new terminal.',
      'Check with: node -v',
    ]);
  }
};

export const checkInstalled = (script) => {
  if (!existsSync(REMOTION_CLI)) {
    fail(script, 'Remotion is not installed in this folder (node_modules is missing).', [
      'Run: npm install',
      'Then run this command again.',
    ]);
  }
};

/** Returns the first line of `ffmpeg -version`, or null when ffmpeg cannot be started. */
export const ffmpegVersion = () => {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-version'], {encoding: 'utf8'});
  if (result.error || result.status !== 0) {
    return null;
  }
  return (result.stdout.split(/\r?\n/)[0] ?? 'ffmpeg').trim();
};

export const ffmpegMissingHints = () => [
  'Install ffmpeg: Windows -> `winget install Gyan.FFmpeg` (or download a build from https://www.gyan.dev/ffmpeg/builds/); macOS -> `brew install ffmpeg`; Linux -> `sudo apt install ffmpeg`.',
  'Open a NEW terminal afterwards so the updated PATH is picked up.',
  'Windows without admin rights: unzip ffmpeg anywhere and add its `bin` folder to PATH for this session: `$env:Path += ";C:\\path\\to\\ffmpeg\\bin"` (PowerShell).',
  'Check with: ffmpeg -version',
];

export const requireFfmpeg = (script) => {
  const version = ffmpegVersion();
  if (!version) {
    fail(script, 'ffmpeg was not found on your PATH.', ffmpegMissingHints());
  }
  return version;
};

// ---------------------------------------------------------------------------------------------------------------------
// Files and folders
// ---------------------------------------------------------------------------------------------------------------------

export const ensureDir = (dir) => mkdirSync(dir, {recursive: true});
export const removePath = (target) => rmSync(target, {recursive: true, force: true});
export const fileSize = (file) => (existsSync(file) ? statSync(file).size : 0);

// ---------------------------------------------------------------------------------------------------------------------
// Child processes
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Run a command and resolve with {code, stderrTail}. stdout goes straight to the console (Remotion's progress bar and
 * ffmpeg's stats use it); stderr is copied to the console AND kept (last 16 KB) so callers can match known errors.
 */
export const runStreaming = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? ROOT,
      stdio: ['ignore', 'inherit', 'pipe'],
      windowsHide: true,
      env: {...process.env, FORCE_COLOR: tty ? '1' : '0'},
    });
    let tail = '';
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      tail = (tail + chunk.toString('utf8')).slice(-16384);
    });
    child.on('error', (error) => {
      resolve({code: -1, stderrTail: `${tail}\n${error.message}`, spawnError: error});
    });
    child.on('close', (code) => resolve({code: code ?? -1, stderrTail: tail}));
  });

/** Run a command quietly and resolve with {code, stdout, stderr} (both fully captured). */
export const runCaptured = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {cwd: options.cwd ?? ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (error) => resolve({code: -1, stdout, stderr: `${stderr}\n${error.message}`}));
    child.on('close', (code) => resolve({code: code ?? -1, stdout, stderr}));
  });

/** ffmpeg with the flags every call here wants. `args` must not contain the leading `-hide_banner`. */
export const runFfmpeg = (args, options = {}) =>
  runStreaming('ffmpeg', ['-hide_banner', '-loglevel', options.loglevel ?? 'warning', '-stats', '-y', ...args], options);

// ---------------------------------------------------------------------------------------------------------------------
// Remotion
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Flags that choose HOW Remotion runs (browser, concurrency, GL), shared by every render. They come from the command
 * line or from environment variables, so a user behind a firewall can point at a Chrome they already have.
 */
export const remotionRuntimeArgs = (flags) => {
  const args = [];
  const browser = typeof flags['browser-executable'] === 'string' ? flags['browser-executable'] : process.env.REMOTION_BROWSER_EXECUTABLE;
  if (browser) {
    args.push(`--browser-executable=${browser}`);
  }
  if (typeof flags.concurrency === 'string') {
    args.push(`--concurrency=${flags.concurrency}`);
  }
  const gl = typeof flags.gl === 'string' ? flags.gl : process.env.REMOTION_GL;
  if (gl) {
    args.push(`--gl=${gl}`);
  }
  return args;
};

export const runRemotion = (args) => runStreaming(process.execPath, [REMOTION_CLI, ...args]);

/** Turn the tail of a failed Remotion run into concrete advice. */
export const remotionHints = (stderrTail, {spawnError} = {}) => {
  const text = stderrTail.toLowerCase();
  const hints = [];
  if (spawnError) {
    hints.push('Node could not start the Remotion CLI. Run `npm install` again and check `node -v` (needs 20+).');
  }
  if (
    text.includes('remotion.media') ||
    text.includes('enotfound') ||
    text.includes('could not find a browser') ||
    text.includes('chrome-headless-shell') ||
    text.includes('failed to download') ||
    text.includes('browserexecutable') ||
    text.includes('failed to launch')
  ) {
    hints.push('Chrome could not be downloaded or started. Run once with internet: `npx remotion browser ensure`.');
    hints.push(
      'Offline or behind a firewall? Point to a Chrome / Chromium you already have: `npm run render -- --browser-executable="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"` (or set REMOTION_BROWSER_EXECUTABLE).',
    );
  }
  if (
    text.includes('out of memory') ||
    text.includes('enomem') ||
    text.includes('heap') ||
    text.includes('target closed') ||
    text.includes('crashed') ||
    text.includes('sigkill') ||
    text.includes('killed')
  ) {
    hints.push('The machine ran out of memory. Use fewer parallel browser tabs: `npm run render -- --concurrency=2` (try 1 on 8 GB laptops).');
    hints.push('Close other heavy programs (browsers, games, video editors) while rendering.');
  }
  if (text.includes('timeout') || text.includes('delayrender') || text.includes('timed out')) {
    hints.push('A frame took too long to render. Re-run with fewer tabs (`--concurrency=2`); on a very slow machine also try `--gl=swangle`.');
  }
  if (text.includes('composition') && text.includes('could not find')) {
    hints.push('The composition id was not found. The film is registered as "MiniMePromo" in src/Root.tsx.');
  }
  if (text.includes('cannot find module') || text.includes('err_module_not_found')) {
    hints.push('A dependency is missing. Run: `npm install`.');
  }
  hints.push('Scroll up: the first red error above this message is the real cause.');
  hints.push('Preview the film in the editor to see if it renders there: `npm run studio`.');
  return hints;
};

// ---------------------------------------------------------------------------------------------------------------------
// Loudness (EBU R128 via ffmpeg loudnorm, two-pass)
// ---------------------------------------------------------------------------------------------------------------------

export const LOUDNESS = {I: -16, TP: -1.5, LRA: 11};
const LOUDNORM_BASE = `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}`;

/** True when `file` has at least one audio stream (a render of a silent frame range has none). */
export const hasAudioStream = async (file) => {
  const result = await runCaptured('ffmpeg', ['-hide_banner', '-i', file]);
  return /Stream #\d+:\d+.*: Audio:/.test(result.stderr);
};

/**
 * Pass 1: measure the integrated loudness of `input` (a video with audio, or a wav). Returns the filter string for
 * pass 2 (measured values + linear gain), or the plain single-pass filter when the measurement cannot be used.
 */
export const measureLoudnorm = async (input) => {
  const result = await runCaptured('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    input,
    '-vn',
    '-af',
    `${LOUDNORM_BASE}:print_format=json`,
    '-f',
    'null',
    '-',
  ]);
  const start = result.stderr.lastIndexOf('{');
  const end = result.stderr.lastIndexOf('}');
  if (result.code !== 0 || start === -1 || end < start) {
    log.warn('Could not measure loudness (no audio track?). Falling back to single-pass loudnorm.');
    return {filter: LOUDNORM_BASE, measured: null};
  }
  try {
    const data = JSON.parse(result.stderr.slice(start, end + 1));
    const numbers = ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset'].map((key) => Number(data[key]));
    if (numbers.some((value) => !Number.isFinite(value))) {
      log.warn('The clip is silent or too short to measure. Falling back to single-pass loudnorm.');
      return {filter: LOUDNORM_BASE, measured: null};
    }
    const [i, tp, lra, thresh, offset] = numbers;
    const filter =
      `${LOUDNORM_BASE}:measured_I=${i}:measured_TP=${tp}:measured_LRA=${lra}:measured_thresh=${thresh}:offset=${offset}:linear=true`;
    return {filter, measured: {i, tp, lra}};
  } catch {
    log.warn('Could not read the loudness report. Falling back to single-pass loudnorm.');
    return {filter: LOUDNORM_BASE, measured: null};
  }
};

/** The measured loudness AFTER normalisation, for the final report. Returns null when it cannot be read. */
export const verifyLoudness = async (input) => {
  const result = await runCaptured('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    input,
    '-vn',
    '-af',
    `${LOUDNORM_BASE}:print_format=json`,
    '-f',
    'null',
    '-',
  ]);
  const start = result.stderr.lastIndexOf('{');
  const end = result.stderr.lastIndexOf('}');
  if (start === -1 || end < start) {
    return null;
  }
  try {
    const data = JSON.parse(result.stderr.slice(start, end + 1));
    const i = Number(data.input_i);
    const tp = Number(data.input_tp);
    return Number.isFinite(i) && Number.isFinite(tp) ? {i, tp} : null;
  } catch {
    return null;
  }
};
