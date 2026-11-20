#!/usr/bin/env node
/**
 * MiniMe pitch deck — the checks of guide section 10 (patch D0).
 *
 *   npm run deck:check                 source checks, then the PDF checks if out/deck/MiniMe-deck.pdf exists
 *   npm run deck:check -- --no-pdf     source checks only
 *
 * Exits non-zero on any failure. No browser needed. It reads the same data the slides use (rules, facts, words, shots,
 * inputs; see scripts/lib/deck-data.mjs) and greps the source under src/deck/.
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {DECK_SRC, loadDeckData, readBuiltSlides} from './lib/deck-data.mjs';
import {OUT_DIR, ROOT, formatBytes, log, parseArgs, rel} from './lib/pipeline.mjs';

const SCRIPT = 'check-deck';
const {flags} = parseArgs(process.argv.slice(2));
if (flags.help) {
  console.log('Usage: npm run deck:check [-- --no-pdf]');
  process.exit(0);
}

const failures = [];
const notes = [];
const bad = (message) => failures.push(message);
const walk = (dir) =>
  readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const {rules, facts, words, shots, inputs} = await loadDeckData();
const built = readBuiltSlides();
const files = walk(DECK_SRC).filter((f) => /\.(ts|tsx)$/.test(f));
const slideFiles = files.filter((f) => /[\\/]slides[\\/]S\d{2}\.tsx$/.test(f));
const slideNo = (file) => Number(path.basename(file).slice(1, 3));

// ---- 1. slide count and registration ------------------------------------------------------------------------------
log.step('Slides and composition');
if (built.length > rules.TOTAL_SLIDES) {
  bad(`${built.length} slides are built, the limit is ${rules.TOTAL_SLIDES} (R1).`);
}
for (const n of built) {
  if (n < 1 || n > rules.TOTAL_SLIDES) {
    bad(`Deck.tsx BUILT has slide ${n}, outside 1..${rules.TOTAL_SLIDES}.`);
  }
  if (!slideFiles.some((f) => slideNo(f) === n)) {
    bad(`Slide ${n} is in BUILT but src/deck/slides/S${String(n).padStart(2, '0')}.tsx does not exist.`);
  }
}
for (const file of slideFiles) {
  const n = slideNo(file);
  if (n > rules.TOTAL_SLIDES) {
    bad(`${rel(file)}: more than ${rules.TOTAL_SLIDES} slides (R1).`);
  } else if (!built.includes(n)) {
    bad(`${rel(file)} exists but slide ${n} is not in the BUILT map of Deck.tsx (it would be missing from the composition).`);
  }
}
const deckSource = readFileSync(path.join(DECK_SRC, 'Deck.tsx'), 'utf8');
for (const n of built) {
  const name = `S${String(n).padStart(2, '0')}`;
  if (!new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"]\\./slides/${name}['"]`).test(deckSource)) {
    bad(`Deck.tsx does not import ${name} from './slides/${name}'.`);
  }
}
const rootSource = readFileSync(path.join(ROOT, 'src', 'Root.tsx'), 'utf8');
if (!/id="MiniMeDeck"[\s\S]*?durationInFrames=\{(TOTAL_SLIDES|15)\}/.test(rootSource)) {
  bad('src/Root.tsx does not register <Composition id="MiniMeDeck" durationInFrames={15} ...>.');
}
log.info(`built: ${built.length ? built.join(', ') : 'none yet'} (of ${rules.TOTAL_SLIDES})`);

// ---- 2. font sizes ------------------------------------------------------------------------------------------------
log.step(`Type size floor (${rules.MIN_TEXT_PX} px, R2)`);
for (const file of files) {
  if (path.basename(file) === 'Shot.tsx') {
    continue; // the Shot internals (grid labels) are exempt
  }
  const code = stripComments(readFileSync(file, 'utf8'));
  for (const m of code.matchAll(/fontSize\s*[:=]\s*\{?\s*['"]?(\d+(?:\.\d+)?)/g)) {
    if (Number(m[1]) < rules.MIN_TEXT_PX) {
      bad(`${rel(file)}: fontSize ${m[1]} is under ${rules.MIN_TEXT_PX} px. Use <Txt size="...">.`);
    }
  }
  for (const m of code.matchAll(/font\s*:\s*['"`][^'"`]*?(\d+(?:\.\d+)?)px/g)) {
    if (Number(m[1]) < rules.MIN_TEXT_PX) {
      bad(`${rel(file)}: font shorthand with ${m[1]}px is under ${rules.MIN_TEXT_PX} px.`);
    }
  }
}

// ---- 3. words: budgets, headlines, banned words, typed digits -----------------------------------------------------
log.step('Words (R9, H6)');
const extraWords = (slide) =>
  slide === 9 && inputs.founders ? inputs.founders.flatMap((x) => [x.role, x.whyUs ?? '']).filter(Boolean) : [];
for (let n = 1; n <= rules.TOTAL_SLIDES; n += 1) {
  if (!words.WORDS[n]) {
    bad(`words.ts has no entry for slide ${n}.`);
    continue;
  }
  const count = words.wordCount(n, extraWords(n));
  const budget = rules.WORD_BUDGET[n];
  const head = words.headlineWords(n);
  if (count > budget) {
    bad(`Slide ${n}: ${count} words, budget ${budget}.`);
  }
  if (head > rules.HEADLINE_MAX_WORDS) {
    bad(`Slide ${n}: headline has ${head} words, the limit is ${rules.HEADLINE_MAX_WORDS}.`);
  }
  const raw = words.WORDS[n];
  for (const s of [raw.headline, ...raw.lines, ...raw.labels, ...raw.graphic, raw.notes]) {
    const noTokens = s.replace(/\{[^}]*\}/g, '');
    // a standalone number: "1,200", "Month 6", "$4.2k". Product words such as "3D" are not numbers.
    if (/(?<![A-Za-z_-])\d[\d.,]*[kKmM%]?(?![A-Za-z0-9_])/.test(noTokens)) {
      bad(`words.ts slide ${n}: a number is typed in "${s}". Use a {fact.path} token so it comes from facts.ts (H1, H2).`);
    }
  }
  const resolved = words.allStrings(n).join('\n');
  for (const word of rules.BANNED_WORDS) {
    const re = new RegExp(`(^|[^\\w])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w])`, 'i');
    if (re.test(resolved)) {
      bad(`words.ts slide ${n}: banned word "${word}" (H6).`);
    }
  }
  if (/\b73\s+(specialist\s+)?agents?\b/i.test(resolved)) {
    bad(`words.ts slide ${n}: "73 agents" is wrong, it is 59 specialist agents (guide 1.3).`);
  }
  log.info(`slide ${String(n).padStart(2)}: ${String(count).padStart(2)} / ${budget} words, headline ${head}`);
}

// ---- 4. facts -----------------------------------------------------------------------------------------------------
log.step('Facts (H1, H2)');
for (const [key, row] of Object.entries(facts.FACTS)) {
  if (row.id !== key) {
    bad(`facts.ts: row "${key}" has id "${row.id}".`);
  }
  if (typeof row.source !== 'string' || row.source.trim() === '') {
    bad(`facts.ts: row "${key}" has no source.`);
  }
  if (!['V', 'T', 'A'].includes(row.status)) {
    bad(`facts.ts: row "${key}" has status "${row.status}", expected V, T or A.`);
  }
}
{
  const f = facts.FACTS;
  const sum = f.capital.value.parts.reduce((s, p) => s + p.usd, 0);
  if (sum !== f.capital.value.totalUsd) {
    bad(`facts.ts capital: parts add up to ${sum}, total says ${f.capital.value.totalUsd}.`);
  }
  if (f.agents.value.specialist + f.agents.value.support !== f.agents.value.modules) {
    bad('facts.ts agents: specialist + support modules must equal the 73 modules.');
  }
  for (const id of ['funnel', 'mrr']) {
    const v = f[id].value;
    for (const key of Object.keys(v)) {
      if (Array.isArray(v[key]) && v[key].length !== v.months.length) {
        bad(`facts.ts ${id}.${key} has ${v[key].length} values for ${v.months.length} months.`);
      }
    }
  }
  if (f.tabs.value.count !== f.tabs.value.names.length) {
    bad('facts.ts tabs: count does not match the names.');
  }
  const navTabs = readFileSync(path.join(ROOT, 'src', 'config', 'copy.ts'), 'utf8').match(/NAV_TABS = \[([\s\S]*?)\] as const/);
  if (navTabs) {
    const names = [...navTabs[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    if (names.join('|') !== f.tabs.value.names.join('|')) {
      bad(`facts.ts tabs differ from NAV_TABS in src/config/copy.ts (${names.join(', ')}).`);
    }
  }
}

// ---- 5. slide sources ---------------------------------------------------------------------------------------------
log.step('Slide sources (H3, H8, H1)');
const forbidden = [...rules.FORBIDDEN_IN_SLIDES, ...Object.values(shots.FORBIDDEN_SHOTS).map((x) => x.file)];
for (const file of slideFiles) {
  const n = slideNo(file);
  const code = stripComments(readFileSync(file, 'utf8')).replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  for (const token of forbidden) {
    if (code.includes(token)) {
      bad(`${rel(file)}: refers to "${token}" (forbidden: Token Usage capture or the promo film's stat chip).`);
    }
  }
  for (const m of code.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/g)) {
    // a standalone number inside a string: "1,200", "Month 6", "$4.2k". Not ids or css such as "h1", "S01", "1px solid".
    if (/(?<![A-Za-z_-])\d[\d.,]*[kKmM%]?(?![A-Za-z0-9_])/.test(m[2]) && !/^[\w./ -]+\.(png|jpg|webp)$/.test(m[2]) && !/^(#|rgba?\(|(radial|linear|conic)-gradient\(|(translate|scale|rotate|calc|blur|brightness)\w*\()/.test(m[2])) {
      bad(`${rel(file)}: a string with a number ("${m[2].slice(0, 40)}"). Numbers come from facts.ts, text from words.ts.`);
    }
  }
  // (?<!=) skips the `>` of an arrow function (`=> x`), which is code, not the end of a JSX tag.
  for (const m of code.matchAll(/(?<!=)>([^<>{}]*\d[^<>{}]*)</g)) {
    if (m[1].trim()) {
      bad(`${rel(file)}: a number is typed in JSX text ("${m[1].trim().slice(0, 40)}"). Read it from facts.ts.`);
    }
  }
  // open items: a null input read by a built slide must be declared as a need (slide is skipped) or as optional (has a default)
  for (const key of new Set([...code.matchAll(/\binputs\.(\w+)/g)].map((m) => m[1]))) {
    if (!(key in inputs)) {
      bad(`${rel(file)}: inputs.${key} does not exist in data/inputs.ts.`);
    } else if (inputs[key] === null) {
      if ((rules.SLIDE_NEEDS[n] ?? []).includes(key)) {
        notes.push(`slide ${n} reads inputs.${key} (null): the export will SKIP it until ${rules.INPUT_LABELS[key]} is filled.`);
      } else if (!(rules.SLIDE_OPTIONAL[n] ?? []).includes(key)) {
        bad(`${rel(file)}: inputs.${key} is null and slide ${n} neither needs nor treats it as optional (add it to SLIDE_NEEDS or SLIDE_OPTIONAL in rules.ts).`);
      }
    }
  }
}
for (const n of built) {
  const missing = rules.missingNeeds(n, inputs);
  if (missing.length > 0) {
    notes.push(`slide ${n} is built but blocked: missing ${missing.join('; ')}. The export skips it.`);
  }
}

// ---- 6. screenshots and photos ------------------------------------------------------------------------------------
log.step('Screenshots and photos');
const pngSize = (file) => {
  const b = readFileSync(file);
  return b.toString('ascii', 1, 4) === 'PNG' ? {w: b.readUInt32BE(16), h: b.readUInt32BE(20)} : null;
};
for (const [id, def] of Object.entries(shots.SHOTS)) {
  const file = path.join(ROOT, 'public', 'screenshots', def.file);
  if (!existsSync(file)) {
    bad(`shots.ts "${id}": public/screenshots/${def.file} is missing.`);
    continue;
  }
  const real = pngSize(file);
  if (!real || real.w !== def.natural.w || real.h !== def.natural.h) {
    bad(`shots.ts "${id}": natural size ${def.natural.w}x${def.natural.h} but ${def.file} is ${real ? `${real.w}x${real.h}` : 'not a PNG'}.`);
  }
  const c = def.crop;
  if (c.x < 0 || c.y < 0 || c.x + c.w > def.natural.w || c.y + c.h > def.natural.h) {
    bad(`shots.ts "${id}": crop ${JSON.stringify(c)} leaves the picture.`);
  }
}
for (const founder of inputs.founders ?? []) {
  for (const f of [founder.photo, founder.webp]) {
    if (!existsSync(path.join(ROOT, 'public', 'deck', 'people', f))) {
      bad(`inputs.ts: public/deck/people/${f} (photo of ${founder.name}) is missing.`);
    }
  }
}

// ---- 7. dependencies ----------------------------------------------------------------------------------------------
log.step('Dependencies');
{
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const dep = {...pkg.dependencies, ...pkg.devDependencies};
  for (const name of ['@remotion/bundler', '@remotion/renderer', 'pdf-lib', 'qrcode']) {
    if (!dep[name]) {
      bad(`package.json: ${name} is missing.`);
    } else if (!/^\d+\.\d+\.\d+$/.test(dep[name])) {
      bad(`package.json: ${name} is "${dep[name]}", pin an exact version.`);
    }
  }
  for (const name of ['@remotion/bundler', '@remotion/renderer']) {
    if (dep[name] && dep[name] !== dep.remotion) {
      bad(`package.json: ${name} ${dep[name]} must match remotion ${dep.remotion}.`);
    }
  }
}

// ---- 8. the PDF (after `npm run deck`) ----------------------------------------------------------------------------
const pdfPath = path.join(OUT_DIR, 'deck', 'MiniMe-deck.pdf');
if (flags['no-pdf']) {
  log.step('PDF');
  log.info('skipped (--no-pdf)');
} else if (!existsSync(pdfPath)) {
  log.step('PDF');
  log.info('out/deck/MiniMe-deck.pdf does not exist yet: run `npm run deck`, then `npm run deck:check` again.');
} else {
  log.step('PDF');
  const size = statSync(pdfPath).size;
  const pdf = await PDFDocument.load(readFileSync(pdfPath));
  const expected = built.filter((n) => rules.missingNeeds(n, inputs).length === 0);
  log.info(`${rel(pdfPath)}: ${formatBytes(size)}, ${pdf.getPageCount()} pages (expected ${expected.length})`);
  if (size > rules.PDF_MAX_BYTES) {
    bad(`PDF is ${formatBytes(size)}, the limit is ${formatBytes(rules.PDF_MAX_BYTES)} (R12).`);
  }
  if (pdf.getPageCount() !== expected.length) {
    bad(`PDF has ${pdf.getPageCount()} pages but ${expected.length} slides are built and unblocked. Run \`npm run deck\` again.`);
  }
  pdf.getPages().forEach((page, i) => {
    const {width, height} = page.getSize();
    if (Math.round(width) !== 1920 || Math.round(height) !== 1080) {
      bad(`PDF page ${i + 1} is ${Math.round(width)} x ${Math.round(height)}, expected 1920 x 1080.`);
    }
  });
}

// ---- result -------------------------------------------------------------------------------------------------------
for (const note of notes) {
  log.warn(note);
}
if (failures.length > 0) {
  console.error(`\n${SCRIPT}: ${failures.length} problem${failures.length === 1 ? '' : 's'}:`);
  failures.forEach((f) => console.error(`  - ${f}`));
  console.error('');
  process.exit(1);
}
log.title('Deck checks passed');
console.log('');
