/**
 * MiniMe pitch deck — every string a slide shows, per slide, plus the speaker notes (guide section 6).
 * Slides never contain a typed sentence: they read from here. Numbers are NOT typed here either: write a token such as
 * `{funnel.registered.0}` and it is looked up in facts.ts (see resolve()). The check script fails on a digit written
 * directly in these strings.
 *
 * Fields per slide:
 *   headline  8 words or fewer (R9), Sora 76 px, two lines at most
 *   lines     running text (sub line, captions, one-liners)
 *   labels    short labels that belong to the visual and are part of the slide's word budget
 *   graphic   names inside a diagram or chart (axes, ring names, plan names, stage names, units). NOT counted in the
 *             budget (the guide's own counts leave them out) but still drawn at 30 px or larger.
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
  // 1. Cover (opening). Wordmark and the printed URL are brand marks, not counted.
  1: {
    headline: 'From a rough idea to a finished build.',
    lines: ['One AI workspace, start to finish.', '{company.name}. Two founders. {company.city}, {company.country}.'],
    labels: [],
    graphic: [],
    notes: 'We are building the AI that does not forget your project halfway through.',
  },
  // 2. Problem, the story (Secret Sauce 1). The drone prompt bubble is a screenshot.
  2: {
    headline: 'A chat answers once. A project takes months.',
    lines: ['Then what?'],
    labels: [],
    graphic: [],
    notes:
      'This is a real prompt from our own product. The answer is good. The project is not done. Research, plan, build, test, launch: each needs the context again.',
  },
  // 3. Solution, the promise (solution 1 of 4). The seven stage names are in the nav screenshot.
  3: {
    headline: 'One AI carries it start to finish.',
    lines: ['{tabs.count} tabs. One workspace.'],
    labels: [],
    graphic: [],
    notes: '',
  },
  // 4. Solution, understand and plan (solution 2 of 4)
  4: {
    headline: 'Understand it. Plan it.',
    lines: [],
    labels: ['Research', 'Plan'],
    graphic: [],
    notes: '',
  },
  // 5. Solution, build, test, grow (solution 3 of 4)
  5: {
    headline: 'Build it. Test it. Grow it.',
    lines: [],
    labels: ['Build', 'Test', 'Growth'],
    graphic: [],
    notes: '',
  },
  // 6. Solution, the team inside (solution 4 of 4). Tier names come from facts.routing.
  6: {
    headline: 'A whole team, routed by effort.',
    lines: [],
    labels: ['agents', 'roles'],
    graphic: [],
    notes: '',
  },
  // 7. Process, how one task flows. Pin numbers are numerals.
  7: {
    headline: 'Ask. Route. Work. Remember.',
    lines: [],
    labels: ['Ask', 'Route: tier chosen', 'Specialists work and recheck', 'Saved to the workspace'],
    graphic: [],
    notes: 'We route by effort so simple questions stay instant and cheap, and hard ones get a team.',
  },
  // 8. Business model and pricing. Plan names and prices come from facts.plans.
  8: {
    headline: 'Free to start. Four plans.',
    lines: ['Local BDT pricing.', 'Launch plan, not live yet.'],
    labels: [],
    graphic: ['per month'],
    notes: '',
  },
  // 9. Competition, secret sauce and AI-proof (the headline answers the AI-proof question without the banned phrase)
  9: {
    headline: 'Not another chat box.',
    lines: [
      'Secret sauce: memory + routing + the full lifecycle.',
      'Models improve. We route to them. The workspace is the product.',
    ],
    labels: ['MiniMe', 'Our view.'],
    graphic: [
      'one answer',
      'whole project',
      'forgets',
      'remembers',
      'chat assistants',
      'code agents',
      'app builders',
      'note and research tools',
    ],
    notes:
      'Honest note for the founders: the moat is early. The defensible part is the persistent workspace and routing, not any one model.',
  },
  // 10. Scalability, market and why now
  10: {
    headline: 'Start in Bangladesh. Then everywhere.',
    lines: ['Models are cheap enough that a free tier is affordable.'],
    labels: [],
    graphic: ['Student and indie builders, paying in BDT.', 'South Asia', 'World'],
    notes: '',
  },
  // 11. Team. Names, roles, why-us lines and links come from data/inputs.ts (U1).
  11: {
    headline: 'Two builders. One product.',
    lines: ['Cap table: {cap_table.foundersPct}% founders.', 'Seeking: product and pricing mentors.'],
    labels: [],
    graphic: [],
    notes: '',
  },
  // 12. Traction, honest
  12: {
    headline: 'Built before we sell.',
    lines: [],
    labels: ['Pre-launch', 'tabs', 'agents', 'products'],
    graphic: [],
    notes: '',
  },
  // 13. Projection
  13: {
    headline: 'A small start, then compounding.',
    lines: ['Targets, not forecasts.'],
    labels: ['paid users', 'registered builders'],
    graphic: ['Month'],
    notes: '',
  },
  // 14. Ask
  14: {
    headline: 'What we need now.',
    lines: [
      'From the Sprint:',
      'Mentors. Pilot users. Pricing feedback.',
      'Plan A self-funds after about ${external.planAUsd:k}. Grant / seed-fund pilot planned for {timeline.grantApplication}.',
    ],
    labels: [],
    graphic: ['Pre-launch capital'],
    notes: 'The Sprint is free and takes no equity. This is not a funding ask to INSEAD. The capital is the cost of getting to launch.',
  },
  // 15. Impact and close, the story ends
  15: {
    headline: 'Idea in. Build plan out.',
    lines: ['Goal: {funnel.registered.0} builders in {funnel.months.0} months.'],
    labels: ['Prompt', 'Architecture', 'Blueprint'],
    graphic: [],
    notes: '',
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
