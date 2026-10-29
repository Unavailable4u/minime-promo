#!/usr/bin/env node
/**
 * MiniMe promo: vendor fonts and emoji so rendering never needs the internet.
 *
 *   npm run assets                 download everything that is missing
 *   npm run assets -- --force      re-download everything
 *   npm run assets -- --only=fonts (or --only=emoji)
 *
 * What it does
 *  1. Fonts: Sora, Inter, JetBrains Mono (latin woff2) from Google Fonts -> public/fonts/
 *     then rewrites src/lib/vendoredFonts.ts so src/lib/fonts.ts uses the local files.
 *  2. Emoji: Twemoji SVGs -> public/emoji/. The list is derived from src/lib/roleIcons.ts
 *     (every icon written there as \u escapes: all role categories, default, input, output, bookmark).
 *
 * Pure Node 20+ (global fetch), no dependencies, safe to run again (existing files are skipped).
 */
import {existsSync, mkdirSync, readFileSync, statSync, writeFileSync, copyFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = join(ROOT, 'public', 'fonts');
const EMOJI_DIR = join(ROOT, 'public', 'emoji');
const ROLE_ICONS_FILE = join(ROOT, 'src', 'lib', 'roleIcons.ts');
const VENDORED_FONTS_FILE = join(ROOT, 'src', 'lib', 'vendoredFonts.ts');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = (args.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length);

/** Same weights as src/lib/fonts.ts used to request. */
const FONT_REQUESTS = [
  {family: 'Sora', slug: 'Sora', weights: [600, 700, 800]},
  {family: 'Inter', slug: 'Inter', weights: [400, 500, 600, 700]},
  {family: 'JetBrains Mono', slug: 'JetBrainsMono', weights: [400, 500, 600]},
];

/** Twemoji mirrors, tried in order. */
const EMOJI_SOURCES = [
  'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/',
  'https://raw.githubusercontent.com/jdecked/twemoji/main/assets/svg/',
];

// A modern desktop UA makes Google Fonts answer with woff2 files.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const failures = [];

const log = (msg) => process.stdout.write(`${msg}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchWithRetry = async (url, init = {}, tries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const res = await fetch(url, {...init, headers: {'user-agent': USER_AGENT, ...(init.headers ?? {})}});
      if (res.ok) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
      if (res.status === 404) {
        break; // retrying a 404 never helps
      }
    } catch (err) {
      lastError = err;
    }
    if (attempt < tries) {
      await sleep(400 * attempt);
    }
  }
  throw lastError;
};

const hasFile = (path) => existsSync(path) && statSync(path).size > 0;

// ------------------------------------------------------------------------ fonts
/** Pick the "latin" @font-face block out of a Google Fonts css2 response and return its woff2 url. */
const latinWoff2Url = (css) => {
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)];
  const latin = blocks.find((m) => m[1] === 'latin');
  const body = latin ? latin[2] : blocks.length === 0 ? css : '';
  const url = /url\(([^)]+)\)\s*format\(['"]woff2['"]\)/.exec(body);
  return url ? url[1].replace(/['"]/g, '') : null;
};

const vendorFonts = async () => {
  mkdirSync(FONT_DIR, {recursive: true});
  const entries = [];
  const downloaded = new Map(); // url -> local path (variable fonts share one file for every weight)

  for (const req of FONT_REQUESTS) {
    for (const weight of req.weights) {
      const file = `${req.slug}-${weight}-latin.woff2`;
      const target = join(FONT_DIR, file);
      const label = `${req.family} ${weight}`.padEnd(20);
      try {
        if (hasFile(target) && !FORCE) {
          log(`  fonts  ${label} exists, skipped`);
        } else {
          const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(req.family).replace(/%20/g, '+')}:wght@${weight}&display=swap`;
          const css = await (await fetchWithRetry(cssUrl)).text();
          const url = latinWoff2Url(css);
          if (!url) {
            throw new Error('no latin woff2 url found in the Google Fonts response');
          }
          const known = downloaded.get(url);
          if (known) {
            copyFileSync(known, target);
          } else {
            const bytes = Buffer.from(await (await fetchWithRetry(url)).arrayBuffer());
            if (bytes.length < 1000) {
              throw new Error(`downloaded file is suspiciously small (${bytes.length} bytes)`);
            }
            writeFileSync(target, bytes);
            downloaded.set(url, target);
          }
          log(`  fonts  ${label} ok  -> public/fonts/${file}`);
        }
        entries.push({family: req.family, weight, file});
      } catch (err) {
        failures.push(`font ${req.family} ${weight}: ${err.message}`);
        log(`  fonts  ${label} FAILED (${err.message})`);
      }
    }
  }

  // Only switch fonts.ts to the local files when EVERY font is present, otherwise keep the Google fallback.
  const total = FONT_REQUESTS.reduce((n, r) => n + r.weights.length, 0);
  const complete = entries.length === total;
  const list = complete
    ? entries
        .map((e) => `  {family: '${e.family}', weight: ${e.weight}, file: '${e.file}'},`)
        .join('\n')
    : '';
  const source = `/**
 * GENERATED by scripts/fetch-assets.mjs (npm run assets). Do not edit by hand.
 * An empty list means the fonts have not been vendored yet, so src/lib/fonts.ts loads them through
 * @remotion/google-fonts (needs internet once). After \`npm run assets\` this lists the woff2 files in public/fonts/.
 */
export type VendoredFont = {
  family: string;
  weight: number;
  /** File name inside public/fonts/ */
  file: string;
};

export const VENDORED_FONTS: readonly VendoredFont[] = [${complete ? `\n${list}\n` : ''}];
`;
  writeFileSync(VENDORED_FONTS_FILE, source);
  log(
    complete
      ? `  fonts  src/lib/vendoredFonts.ts updated (${entries.length} files). Rendering is now offline for fonts.`
      : `  fonts  INCOMPLETE (${entries.length}/${total}); src/lib/vendoredFonts.ts left on the Google Fonts fallback.`,
  );
};

// ------------------------------------------------------------------------ emoji
/** Same rule as emojiFilename() in src/ui/Emoji.tsx. */
const emojiFilename = (emoji) => {
  const points = Array.from(emoji).map((ch) => ch.codePointAt(0));
  const hasZwj = points.includes(0x200d);
  return points
    .filter((cp) => hasZwj || cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join('-');
};

/** Decode a "\\u{1F46E}\\uFE0F" style escape string into real characters. */
const decodeEscapes = (escaped) =>
  escaped
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

/** Every string literal in roleIcons.ts that consists only of \\u escapes is an emoji we need. */
const emojiFromRoleIcons = () => {
  const text = readFileSync(ROLE_ICONS_FILE, 'utf8');
  const found = new Set();
  const re = /'((?:\\u\{[0-9a-fA-F]+\}|\\u[0-9a-fA-F]{4})+)'/g;
  for (const m of text.matchAll(re)) {
    found.add(decodeEscapes(m[1]));
  }
  return [...found];
};

const downloadEmoji = async (file) => {
  const target = join(EMOJI_DIR, `${file}.svg`);
  if (hasFile(target) && !FORCE) {
    return 'skipped';
  }
  let lastError;
  for (const base of EMOJI_SOURCES) {
    try {
      const text = await (await fetchWithRetry(`${base}${file}.svg`, {}, 2)).text();
      if (!text.trimStart().startsWith('<svg') && !text.trimStart().startsWith('<?xml')) {
        throw new Error('response is not an SVG');
      }
      writeFileSync(target, text);
      return 'ok';
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
};

const vendorEmoji = async () => {
  mkdirSync(EMOJI_DIR, {recursive: true});
  const files = [...new Set(emojiFromRoleIcons().map(emojiFilename))].sort();
  if (files.length === 0) {
    throw new Error('found no emoji in src/lib/roleIcons.ts (did the file change format?)');
  }
  log(`  emoji  ${files.length} Twemoji files needed`);

  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const file = files[next];
      next += 1;
      try {
        const state = await downloadEmoji(file);
        done += 1;
        if (state === 'ok') {
          log(`  emoji  [${done}/${files.length}] ${file}.svg ok`);
        }
      } catch (err) {
        done += 1;
        failures.push(`emoji ${file}.svg: ${err.message}`);
        log(`  emoji  [${done}/${files.length}] ${file}.svg FAILED (${err.message})`);
      }
    }
  };
  await Promise.all(Array.from({length: 6}, worker));
  log(`  emoji  done (${files.length - failures.filter((f) => f.startsWith('emoji')).length}/${files.length} present)`);
};

// ------------------------------------------------------------------------- main
const main = async () => {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 18 || typeof fetch !== 'function') {
    throw new Error(`Node 18+ with global fetch is required (you have ${process.version}). Install Node 20 LTS.`);
  }
  log('MiniMe assets: fonts + emoji');
  if (ONLY !== 'emoji') {
    await vendorFonts();
  }
  if (ONLY !== 'fonts') {
    await vendorEmoji();
  }

  if (failures.length > 0) {
    log('\nSome downloads failed:');
    failures.forEach((f) => log(`  - ${f}`));
    log('\nFix hints:');
    log('  * Check your internet connection. A VPN, firewall or proxy may be blocking these hosts; try another network.');
    log('  * Make sure fonts.googleapis.com, fonts.gstatic.com, raw.githubusercontent.com and cdn.jsdelivr.net are reachable.');
    log('  * Just run `npm run assets` again: finished files are skipped, only the missing ones are retried.');
    process.exitCode = 1;
    return;
  }
  log('\nAll assets are in place. Emoji graphics: Twemoji (c) Twitter, Inc and other contributors, CC-BY 4.0.');
};

main().catch((err) => {
  process.stderr.write(`\nassets failed: ${err.message}\n`);
  process.exit(1);
});
