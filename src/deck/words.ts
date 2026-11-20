/**
 * MiniMe pitch deck — every string a slide shows, per slide, plus the speaker notes (guide section 6).
 * Slides never contain a typed sentence: they read from here. Numbers are NOT typed here either: write a token such as
 * `{funnel.registered.0}` and it is looked up in facts.ts (see resolve()). The check script fails on a digit written
 * directly in these strings.
 *
 * Fields per slide:
 *   headline  12 words or fewer (R9 v2), serif 80 px, two lines at most
 *   lines     running text (sub line, captions, one-liners)
 *   labels    short labels that belong to the visual and are part of the slide's word budget
 *   graphic   section tags (drawn as "§ NN · tag") and names inside a diagram or chart (axes, ring names, plan names,
 *             units). NOT counted in the budget but still drawn at 22 px or larger.
 *   notes     the line the founder says aloud. Never drawn on the slide.
 *
 * Counting rules (wordCount): a word is a whitespace-separated token with a letter in it; numerals ("59", "$4.2k",
 * "1,200", "100%"), symbols ("+", "/") and a month followed by a year ("Apr 2027") do not count.
 * PURE DATA (imports only ./facts): loaded by scripts/lib/deck-data.mjs.
 */
import {facts, formatNumber, formatShort, formatUsd, type FactId} from './facts';

export type SlideWords = {
  readonly headline: string;
  readonly lines: readonly string[];
  readonly labels: readonly string[];
  readonly graphic: readonly string[];
  readonly notes: string;
};

export const WORDS: Readonly<Record<number, SlideWords>> = {
  // 1. Cover (ink). The wordmark, the printed URL and the founders' names are not counted.
  1: {
    headline: 'From a rough idea to a finished build.',
    lines: ['One AI workspace, start to finish.'],
    labels: ['{company.name} · {company.stage} · {company.city}, {company.country}', 'workspace tabs', 'specialist agents', 'agent roles', 'routing tiers', 'Pre-launch', 'Scan to visit'],
    graphic: [],
    notes: 'We are building the AI that does not forget your project halfway through.',
  },
  // 2. Problem, the story. Section tags are drawn by kit.tsx as "§ NN · tag".
  2: {
    headline: 'A chat answers once. A project takes months.',
    lines: ['A real prompt from our own product. The answer is good. The project is not done.', 'Each step needs the context again.'],
    labels: [
      'Real prompt',
      'Real answer',
      'What the project still needs',
      'Research the parts and prior art',
      'Plan the architecture and the parts list',
      'Build the code',
      'Test it with real users',
      'Launch it and grow',
      'Then what?',
    ],
    graphic: ['The problem'],
    notes:
      'This is a real prompt from our own product. The answer is good. The project is not done. Research, plan, build, test, launch: each needs the context again.',
  },
  // 3. Solution, the promise. The first four labels are the legend of the pins on the nav strip ("Name: what it does", split at
  // the colon by splitLabel()); the next three are the captions of the two shots and of the numerals (11 tabs, 7 stages come from facts).
  3: {
    headline: 'One AI carries it start to finish.',
    lines: ['Same project, same workspace, every stage.'],
    labels: [
      'Chat: describe the idea in plain words',
      'Notebooks: mind maps and quizzes',
      'Research and Plan: understand it, design it',
      'Build, Test and Growth: make it, ship it',
      'Our landing page',
      'workspace tabs',
      'lifecycle stages',
    ],
    graphic: ['The solution'],
    notes: 'One workspace holds the whole project, so the idea carries from the first chat to the last stage.',
  },
  // 4. Product, idea to plan (one real project, three real screens plus research). The chevron path uses graphic[1..4].
  4: {
    headline: 'One prompt becomes a PRD, an architecture and a 3D blueprint.',
    lines: ['One real project: a battery-powered plant soil-moisture monitor.'],
    labels: ['The generated PRD', 'The architecture diagram', 'The 3D blueprint and parts list', 'Research sources, searchable'],
    graphic: ['Idea to plan', 'Prompt', 'PRD', 'Architecture', 'Blueprint'],
    notes: 'One real project, end to end: a plant soil-moisture monitor, from a single prompt to a plan, a diagram and a 3D layout of the parts.',
  },
  // 5. Product, build test grow. Do not imply the Build shot is the plant monitor (it is a small snippet).
  // The first three labels are "Name: caption": the name is the column head, the caption sits under the shot (splitLabel()).
  // The next three are one short detail line per column, each read off the screenshot itself (file tree and editor; the persona
  // cards enthusiast, skeptic and critic; "write the core message once, pick the platforms").
  5: {
    headline: 'Then build it, test it with personas, and grow it.',
    lines: ['A code editor, simulated customers and content fan-out sit in the same workspace.'],
    labels: [
      'Build: a code editor',
      'Test: simulated customer personas',
      'Growth: one post, many platforms',
      'File tree and editor.',
      'Enthusiast, skeptic and critic.',
      'Write once, pick the platforms.',
    ],
    graphic: ['Build, test, grow'],
    notes: 'The same workspace goes on to code, simulated customers and content for launch. The editor shown holds a small demo file.',
  },
  // 6. Process, how one task flows. Tier names come from facts.routing; tier notes from inputs.tierNotes (U13) when set.
  6: {
    headline: 'We route by effort, so hard tasks get a team.',
    lines: ['Simple questions stay instant and cheap. Hard ones get specialists that work and recheck.'],
    labels: ['Ask', 'Route: the tier is chosen', 'Specialists work and recheck', 'Saved to the workspace', 'specialist agents', 'roles in the Role Library', 'Live routing graph from a real task'],
    graphic: ['How it works', 'Tier'],
    notes: 'We route by effort so simple questions stay instant and cheap, and hard ones get a team.',
  },
  // 7. Business model and pricing. Plan names and prices come from facts.plans. Everything here is status A: say "plan".
  7: {
    headline: 'Free to start, four plans, priced in BDT.',
    lines: [
      'Launch plan, not live yet. Figures are assumptions, not results.',
      'Plan: about {margin.typicalGrossMarginPct}% gross margin on paid plans.',
      'Plan: about {breakeven.basicUsers} Basic users cover lean infrastructure and the free tier.',
      'A free user costs about ${free_cost.usdPerActiveFreeUserPerMonth} a month.',
      'Annual costs {plans.annualMonths} times monthly.',
      'Free plan: {plans.freeTokensPerMonth} tokens a month.',
    ],
    labels: [],
    graphic: ['Business model', 'per month'],
    notes: '',
  },
  // 8. Competition, why now, market. Axis names, categories and ring names are graphic.
  8: {
    headline: 'Not another chat box: a workspace that carries the project.',
    lines: [
      'Secret sauce: memory + routing + the full lifecycle.',
      'Models improve. We route to them. The workspace is the product.',
      'Models are cheap enough that a free tier is affordable.',
    ],
    labels: ['MiniMe', 'Our view.'],
    graphic: [
      'Why us, why now',
      'one answer',
      'whole project',
      'forgets',
      'remembers',
      'chat assistants',
      'code agents',
      'app builders',
      'note and research tools',
      'Student and indie builders, paying in BDT.',
      'South Asia',
      'World',
    ],
    notes:
      'Honest note for the founders: the moat is early. The defensible part is the persistent workspace and routing, not any one model.',
  },
  // 9. Team. Names, roles, why-us lines, LinkedIn and photos come from data/inputs.ts (U1). Product names come from facts.products.
  9: {
    headline: 'Two builders, three products, one account.',
    lines: ['Cap table: {cap_table.foundersPct}% founders.', 'Seeking: product and pricing mentors.'],
    labels: [],
    graphic: ['The team'],
    notes: '',
  },
  // 10. Traction (honest) and projection (targets)
  10: {
    headline: 'Built before we sell, with targets we can test.',
    lines: ['Pre-launch: nothing here is a user count.', 'Targets, not forecasts.'],
    labels: ['What exists today', 'tabs', 'specialist agents', 'products', 'Targets, unvalidated', 'paid users', 'registered builders'],
    graphic: ['Where we are, where we aim', 'Month'],
    notes: '',
  },
  // 11. Ask and close (ink): the story ends where it began.
  11: {
    headline: 'Idea in, build plan out. Help us reach launch.',
    lines: [
      'From the Sprint:',
      'Mentors. Pilot users. Pricing feedback.',
      'Plan A self-funds after about ${external.planAUsd:k}. Grant / seed-fund pilot planned for {timeline.grantApplication}.',
      'Goal: {funnel.registered.0} builders in {funnel.months.0} months.',
    ],
    labels: ['Scan to visit'],
    graphic: ['The ask', 'Pre-launch capital'],
    notes: 'The Sprint is free and takes no equity. This is not a funding ask to INSEAD. The capital is the cost of getting to launch.',
  },
};

// ------------------------------------------------------------------------------------------------ tokens

const TOKEN = /\{([a-z_]+(?:\.[A-Za-z0-9_]+)*)(?::(k|usd))?\}/g;

/** `{funnel.registered.0}` -> "1,200"; `{external.planAUsd:k}` -> "4.2k"; `{x:usd}` -> "$3,628". Unknown path throws. */
export const resolve = (text: string): string =>
  text.replace(TOKEN, (_match, path: string, format: string | undefined) => {
    const [id, ...rest] = path.split('.');
    let value: unknown = (facts as Record<string, {value: unknown}>)[id as FactId]?.value;
    if (value === undefined) {
      throw new Error(`words.ts: token {${path}} does not start with a fact id from facts.ts.`);
    }
    for (const key of rest) {
      value = (value as Record<string, unknown>)?.[key];
    }
    if (typeof value === 'number') {
      return format === 'k' ? formatShort(value) : format === 'usd' ? formatUsd(value) : formatNumber(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    throw new Error(`words.ts: token {${path}} does not point at a number or a string in facts.ts.`);
  });

// ------------------------------------------------------------------------------------------------ counting

const NUMERAL = /^[$€£]?\d[\d.,]*[kKmM%]?[.,:;!?]*$/;
const MONTH = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;
const YEAR = /^\d{4}[.,;:]?$/;

/** Words in one string after tokens are resolved (see the counting rules at the top of this file). */
export const countWords = (text: string): number => {
  const tokens = resolve(text).split(/\s+/).filter(Boolean);
  let count = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!/[A-Za-z]/.test(token) || NUMERAL.test(token)) {
      continue; // numeral or symbol
    }
    if (MONTH.test(token.replace(/[.,;:]$/, '')) && YEAR.test(tokens[i + 1] ?? '')) {
      i += 1; // "Apr 2027" is a date, i.e. numerals
      continue;
    }
    count += 1;
  }
  return count;
};

/** Visible words of a slide that count against its budget: headline + lines + labels (+ `extra`, e.g. founder lines). */
export const wordCount = (slide: number | SlideWords, extra: readonly string[] = []): number => {
  const words = typeof slide === 'number' ? WORDS[slide] : slide;
  if (!words) {
    throw new Error(`words.ts: no words for slide ${String(slide)}.`);
  }
  return [words.headline, ...words.lines, ...words.labels, ...extra].reduce((sum, text) => sum + countWords(text), 0);
};

/** Words of the headline alone (R9: 8 or fewer). */
export const headlineWords = (slide: number): number => countWords(WORDS[slide].headline);

/** Every string in a slide, resolved. Used by the check script for banned words and stray digits. */
export const allStrings = (slide: number): string[] => {
  const w = WORDS[slide];
  return [w.headline, ...w.lines, ...w.labels, ...w.graphic, w.notes].filter(Boolean).map(resolve);
};

/** Slide text, resolved, ready to draw. `text(3).lines` etc. */
export const text = (slide: number): SlideWords => {
  const w = WORDS[slide];
  if (!w) {
    throw new Error(`words.ts: no words for slide ${slide}.`);
  }
  return {
    headline: resolve(w.headline),
    lines: w.lines.map(resolve),
    labels: w.labels.map(resolve),
    graphic: w.graphic.map(resolve),
    notes: w.notes,
  };
};
