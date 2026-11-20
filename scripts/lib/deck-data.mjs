/**
 * MiniMe pitch deck — loads the deck's pure-data TypeScript modules into plain Node (patch D0).
 *
 * `scripts/make-deck.mjs` and `scripts/check-deck.mjs` need the same data the slides use (rules, facts, words, inputs).
 * Node 20 cannot import .ts, so the data modules are transpiled with the `typescript` package (already a devDependency)
 * into out/.deck-data/ and imported from there. Only src/deck/rules.ts, facts.ts, words.ts, shots.ts and data/inputs.ts (and what
 * they import inside src/deck/) are loaded: they must stay React-free and import nothing from outside src/deck/.
 *
 * It also reads which slides are BUILT by parsing the block between `// BUILT:START` and `// BUILT:END` in Deck.tsx
 * (one `N: SNN,` entry per line).
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {OUT_DIR, ROOT} from './pipeline.mjs';

export const DECK_SRC = path.join(ROOT, 'src', 'deck');
const DATA_OUT = path.join(OUT_DIR, '.deck-data');
const ENTRIES = ['rules.ts', 'facts.ts', 'words.ts', 'shots.ts', 'data/inputs.ts'];

const transpiled = new Set();

const transpile = (relFile) => {
  if (transpiled.has(relFile)) {
    return;
  }
  transpiled.add(relFile);
  const source = path.join(DECK_SRC, relFile);
  if (!existsSync(source)) {
    throw new Error(`deck-data: ${relFile} not found in src/deck/.`);
  }
  const output = ts.transpileModule(readFileSync(source, 'utf8'), {
    fileName: source,
    compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, isolatedModules: true},
  }).outputText;
  const dir = path.posix.dirname(relFile);
  const rewritten = output.replace(/(from\s+|import\s*\()(['"])(\.{1,2}\/[^'"]+)\2/g, (_m, lead, quote, spec) => {
    const target = path.posix.normalize(path.posix.join(dir, spec));
    if (target.startsWith('..')) {
      throw new Error(`deck-data: ${relFile} imports ${spec}, which is outside src/deck/. Data modules must stay self-contained.`);
    }
    transpile(`${target}.ts`);
    return `${lead}${quote}${spec}.mjs${quote}`;
  });
  const out = path.join(DATA_OUT, relFile.replace(/\.ts$/, '.mjs'));
  mkdirSync(path.dirname(out), {recursive: true});
  writeFileSync(out, rewritten);
};

let cached;

/** {rules, facts, words, shots, inputs}: the real modules, ready to use. */
export const loadDeckData = async () => {
  if (cached) {
    return cached;
  }
  transpiled.clear();
  for (const entry of ENTRIES) {
    transpile(entry);
  }
  const load = (file) => import(pathToFileURL(path.join(DATA_OUT, file)).href);
  const [rules, facts, words, shots, inputs] = await Promise.all([load('rules.mjs'), load('facts.mjs'), load('words.mjs'), load('shots.mjs'), load('data/inputs.mjs')]);
  cached = {rules, facts, words, shots, inputs: inputs.inputs};
  return cached;
};

/** Slide numbers listed in the BUILT map of src/deck/Deck.tsx (sorted). */
export const readBuiltSlides = () => {
  const text = readFileSync(path.join(DECK_SRC, 'Deck.tsx'), 'utf8');
  const match = text.match(/\/\/ BUILT:START([\s\S]*?)\/\/ BUILT:END/);
  if (!match) {
    throw new Error('deck-data: src/deck/Deck.tsx has no "// BUILT:START" ... "// BUILT:END" block.');
  }
  const slides = [];
  for (const line of match[1].split('\n')) {
    const entry = line.trim().match(/^(\d{1,2})\s*:\s*([A-Za-z_]\w*)\s*,?\s*(?:\/\/.*)?$/);
    if (entry) {
      slides.push(Number(entry[1]));
    } else if (line.trim() && !line.trim().startsWith('//')) {
      throw new Error(`deck-data: cannot read this BUILT entry: "${line.trim()}". Use one \`N: SNN,\` per line.`);
    }
  }
  return [...new Set(slides)].sort((a, b) => a - b);
};

/** Slides to export now: built, not blocked by a missing open item. Returns {export: number[], skipped: {slide, reason}[]}. */
export const planExport = async () => {
  const {rules, inputs} = await loadDeckData();
  const built = readBuiltSlides();
  const exportable = [];
  const skipped = [];
  for (const slide of built) {
    const missing = rules.missingNeeds(slide, inputs);
    if (missing.length > 0) {
      skipped.push({slide, reason: `missing ${missing.join('; ')}`});
    } else {
      exportable.push(slide);
    }
  }
  return {built, export: exportable, skipped};
};
