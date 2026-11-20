#!/usr/bin/env node
/**
 * MiniMe pitch deck — export (patch D0).
 *
 *   npm run deck                          every built slide -> out/deck/NN.jpg  +  out/deck/MiniMe-deck.pdf
 *   npm run deck -- --only=3,5            only these slides  -> out/deck/NN.jpg  +  out/deck/MiniMe-deck.partial.pdf
 *   npm run deck -- --scale=2             render the stills at 2x (3840 x 2160); the PDF pages stay 1920 x 1080 pt
 *   npm run deck -- --png                 lossless out/deck/NN.png stills only (visual QA), no PDF
 *
 * Slide N is frame N-1 of the `MiniMeDeck` composition. The export SKIPS (never renders, never puts in the PDF):
 *   - slides that are not in the BUILT map of src/deck/Deck.tsx yet,
 *   - built slides whose open item is missing (guide section 2; today only slide 9 needs U1), with a line naming the item.
 *
 * The PDF embeds JPEG pages (pdf-lib embedJpg). JPEG quality steps 90 -> 82 -> 75 until the file is at most
 * PDF_MAX_BYTES (9.0 MB, src/deck/rules.ts); the size is printed. Run `npm run deck:check` afterwards.
 *
 * Other options: --browser-executable=PATH (or env REMOTION_BROWSER_EXECUTABLE), --gl=swangle (or env REMOTION_GL),
 * --keep-bundle (keep out/.deck-bundle), --help.
 */
import {mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {loadDeckData, planExport} from './lib/deck-data.mjs';
import {
  ENTRY,
  OUT_DIR,
  ROOT,
  checkInstalled,
  checkNode,
  fail,
  formatBytes,
  formatSeconds,
  log,
  parseArgs,
  rel,
  remotionHints,
} from './lib/pipeline.mjs';

const SCRIPT = 'make-deck';
const COMPOSITION = 'MiniMeDeck';
const DECK_DIR = path.join(OUT_DIR, 'deck');
const BUNDLE_DIR = path.join(OUT_DIR, '.deck-bundle');
const PDF_FULL = path.join(DECK_DIR, 'MiniMe-deck.pdf');
const PDF_PARTIAL = path.join(DECK_DIR, 'MiniMe-deck.partial.pdf');

const {flags} = parseArgs(process.argv.slice(2));
const known = new Set(['only', 'scale', 'png', 'browser-executable', 'gl', 'keep-bundle', 'help']);
for (const name of Object.keys(flags)) {
  if (!known.has(name)) {
    fail(SCRIPT, `Unknown option --${name}.`, [`Valid options: ${[...known].map((n) => `--${n}`).join(', ')}`]);
  }
}
if (flags.help) {
  console.log('Usage: npm run deck [-- --only=3,5] [--scale=2] [--png] [--browser-executable=PATH] [--gl=swangle] [--keep-bundle]');
  process.exit(0);
}

const num = (value, label) => {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    fail(SCRIPT, `${label} needs whole numbers, got "${value}".`);
  }
  return n;
};
let only = null;
if (flags.only !== undefined) {
  if (typeof flags.only !== 'string' || !/^\d+(,\d+)*$/.test(flags.only)) {
    fail(SCRIPT, `--only needs slide numbers like 3,5, got "${flags.only}".`, ['Example: npm run deck -- --only=3,5']);
  }
  only = [...new Set(flags.only.split(',').map((x) => num(x, '--only')))].sort((a, b) => a - b);
}
let scale = 1;
if (flags.scale !== undefined) {
  scale = Number(flags.scale);
  if (!(scale >= 1 && scale <= 4)) {
    fail(SCRIPT, `--scale needs a number from 1 to 4, got "${flags.scale}".`);
  }
}
const png = flags.png === true;
const browserExecutable =
  (typeof flags['browser-executable'] === 'string' ? flags['browser-executable'] : process.env.REMOTION_BROWSER_EXECUTABLE) || null;
const gl = (typeof flags.gl === 'string' ? flags.gl : process.env.REMOTION_GL) || null;

const slideName = (n) => String(n).padStart(2, '0');

const main = async () => {
  checkNode(SCRIPT);
  checkInstalled(SCRIPT);
  const {rules} = await loadDeckData();
  const plan = await planExport();

  log.title('MiniMe pitch deck export');
  const notBuilt = [];
  for (let n = 1; n <= rules.TOTAL_SLIDES; n += 1) {
    if (!plan.built.includes(n)) {
      notBuilt.push(n);
    }
  }
  if (notBuilt.length > 0) {
    log.info(`not built yet (skipped): ${notBuilt.join(', ')}`);
  }
  for (const s of plan.skipped) {
    log.warn(`skip slide ${s.slide}: ${s.reason}. Fill it in src/deck/data/inputs.ts.`);
  }

  let todo = plan.export;
  if (only) {
    for (const n of only) {
      if (!plan.export.includes(n)) {
        const why = plan.skipped.find((s) => s.slide === n)?.reason ?? 'not built yet';
        log.warn(`--only: slide ${n} cannot be exported (${why}).`);
      }
    }
    todo = plan.export.filter((n) => only.includes(n));
  }
  if (todo.length === 0) {
    log.warn('Nothing to export: no built slide is ready. (Build slides with patches D1 to D5; the scaffold alone has none.)');
    return;
  }
  log.info(`exporting slide${todo.length === 1 ? '' : 's'}: ${todo.join(', ')}${scale !== 1 ? `, scale ${scale}` : ''}${png ? ', PNG stills only' : ''}`);

  mkdirSync(DECK_DIR, {recursive: true});
  const ext = png ? 'png' : 'jpg';
  for (const name of readdirSync(DECK_DIR)) {
    const isStill = /^\d\d\.(jpg|png)$/.test(name);
    const stale = only ? isStill && todo.some((n) => name.startsWith(slideName(n))) : isStill || name.startsWith('MiniMe-deck');
    if (stale) {
      rmSync(path.join(DECK_DIR, name), {force: true});
    }
  }

  const startedAt = Date.now();
  log.step('Bundling (out/.deck-bundle)');
  rmSync(BUNDLE_DIR, {recursive: true, force: true});
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, ENTRY),
    outDir: BUNDLE_DIR,
    publicDir: path.join(ROOT, 'public'),
  });
  log.ok('bundle ready');

  const chromiumOptions = gl ? {gl} : {};
  const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions, logLevel: 'warn'});
  try {
    const composition = await selectComposition({
      serveUrl,
      id: COMPOSITION,
      puppeteerInstance: browser,
      browserExecutable,
      chromiumOptions,
      logLevel: 'warn',
    });
    if (composition.durationInFrames !== rules.TOTAL_SLIDES) {
      fail(SCRIPT, `${COMPOSITION} has ${composition.durationInFrames} frames, expected ${rules.TOTAL_SLIDES}.`);
    }

    const renderAll = async (quality) => {
      const files = [];
      for (const n of todo) {
        const output = path.join(DECK_DIR, `${slideName(n)}.${ext}`);
        await renderStill({
          composition,
          serveUrl,
          output,
          frame: n - 1,
          imageFormat: png ? 'png' : 'jpeg',
          ...(png ? {} : {jpegQuality: quality}),
          scale,
          overwrite: true,
          puppeteerInstance: browser,
          browserExecutable,
          chromiumOptions,
          logLevel: 'warn',
        });
        files.push({slide: n, file: output});
      }
      return files;
    };

    if (png) {
      log.step('Rendering PNG stills');
      const files = await renderAll(0);
      files.forEach((x) => log.ok(`${rel(x.file)} (${formatBytes(readFileSync(x.file).length)})`));
      log.title(`Done in ${formatSeconds(Date.now() - startedAt)}`);
      log.info('PNG stills only: no PDF was written (use `npm run deck` for the PDF).');
      return;
    }

    const pdfPath = only ? PDF_PARTIAL : PDF_FULL;
    let finalSize = 0;
    let finalQuality = 0;
    for (const [index, quality] of rules.JPEG_QUALITY_STEPS.entries()) {
      log.step(`Rendering JPEG stills, quality ${quality}`);
      const files = await renderAll(quality);
      const pdf = await PDFDocument.create();
      pdf.setTitle('MiniMe pitch deck');
      pdf.setAuthor('Next Inc');
      pdf.setProducer('MiniMe deck export (Remotion + pdf-lib)');
      for (const {file} of files) {
        const image = await pdf.embedJpg(readFileSync(file));
        const page = pdf.addPage([1920, 1080]);
        page.drawImage(image, {x: 0, y: 0, width: 1920, height: 1080});
      }
      const bytes = await pdf.save();
      writeFileSync(pdfPath, bytes);
      finalSize = bytes.length;
      finalQuality = quality;
      log.info(`PDF at quality ${quality}: ${formatBytes(finalSize)}`);
      if (finalSize <= rules.PDF_MAX_BYTES) {
        break;
      }
      if (index < rules.JPEG_QUALITY_STEPS.length - 1) {
        log.warn(`over ${formatBytes(rules.PDF_MAX_BYTES)}: stepping the quality down.`);
      }
    }
    log.title(`Done in ${formatSeconds(Date.now() - startedAt)}`);
    log.ok(`${rel(pdfPath)}: ${todo.length} page${todo.length === 1 ? '' : 's'}, ${formatBytes(finalSize)} (JPEG quality ${finalQuality})`);
    if (finalSize > rules.PDF_MAX_BYTES) {
      fail(SCRIPT, `The PDF is ${formatBytes(finalSize)} even at JPEG quality ${finalQuality} (limit ${formatBytes(rules.PDF_MAX_BYTES)}).`, [
        'Use fewer or smaller screenshots (crop tighter in src/deck/shots.ts).',
        'Render without --scale.',
      ]);
    }
    if (only) {
      log.warn('This is a PARTIAL pdf (--only). Do not upload it; run `npm run deck` for the full deck.');
    }
    log.info('Next: npm run deck:check');
  } finally {
    await browser.close({silent: true});
    if (!flags['keep-bundle']) {
      rmSync(BUNDLE_DIR, {recursive: true, force: true});
    }
  }
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(SCRIPT, `Unexpected error: ${message}`, remotionHints(message));
});
