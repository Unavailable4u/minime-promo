/**
 * MiniMe pitch deck — the hard limits (guide sections 1, 2, 6 and 10).
 * PURE DATA: no React, no imports from outside src/deck/, so scripts/lib/deck-data.mjs can load it in plain Node.
 */
import type {DeckInputs} from './data/inputs';

/** R1 (v2): the deck has exactly this many slides, fewer than twelve. Slide N is frame N-1 of the `MiniMeDeck` composition. */
export const TOTAL_SLIDES = 11;

/** R12: the form allows 10 MB; the export steps JPEG quality down until the PDF is at most this big (bytes). */
export const PDF_MAX_BYTES = 9_000_000;
/** JPEG quality ladder for the PDF pages (guide section 9, D0 prompt). */
export const JPEG_QUALITY_STEPS = [90, 82, 75] as const;

/** R2 (v2): nothing on the canvas is smaller than this (px). Body text is 32; mono captions are 22. (v1 said 30 and made the slides empty.) */
export const MIN_TEXT_PX = 22;

/** R9 (v2): a headline has at most this many words. Headlines may be a full sentence, as in the MiniLocker deck. */
export const HEADLINE_MAX_WORDS = 12;

/**
 * R9 (v2): word budget per slide (guide section 6). Counted by wordCount() in words.ts over headline + lines + labels.
 * `graphic` text (axis names, plan names, tier names, ring names ...) is not counted, see words.ts.
 */
export const WORD_BUDGET: Readonly<Record<number, number>> = {
  1: 40,
  2: 70,
  3: 60,
  4: 60,
  5: 60,
  6: 75,
  7: 75,
  8: 80,
  9: 65,
  10: 75,
  11: 85,
};

/** H6: never written anywhere in words.ts (matched case-insensitively, whole words). */
export const BANNED_WORDS: readonly string[] = [
  'revolutionary',
  'first ever',
  '10x',
  'guaranteed',
  'unlimited',
  'secure',
  'unhackable',
  'AI-proof',
];

/** Things a built slide must never reference (H3, H8): the Token Usage capture and the promo film's stat chip. */
export const FORBIDDEN_IN_SLIDES: readonly string[] = ['image copy 14', "'tokens'", 'STAT_CHIP', '41.2'];

/**
 * Open items (guide section 2) that make a slide impossible to build.
 * A slide listed here is SKIPPED by the export, with a line that names the item, until the item is filled.
 * Items that only change a default (U3, U5, U6 ...) are not "needs": see SLIDE_OPTIONAL.
 */
export const SLIDE_NEEDS: Readonly<Record<number, readonly (keyof DeckInputs)[]>> = {
  9: ['founders'],
};

/** Open items a slide may read when present and replaces by a default when null (guide section 2, last column). */
export const SLIDE_OPTIONAL: Readonly<Record<number, readonly (keyof DeckInputs)[]>> = {
  1: ['founders'],
  6: ['tierNotes'],
  8: ['competitors', 'market'],
  9: ['advisors', 'split', 'founders'],
  10: ['liveUrl', 'traction', 'recognition'],
  11: ['liveUrl', 'contactEmail', 'sprintAsk', 'founders'],
};

/** Which open items (by guide id) each input key stands for, used in skip messages. */
export const INPUT_LABELS: Readonly<Record<keyof DeckInputs, string>> = {
  founders: 'U1 founders (name, role, photo)',
  contactEmail: 'U2 contact email',
  liveUrl: 'U3 live app URL',
  companyUrl: 'U4 public website URL',
  market: 'U5 market numbers with sources',
  advisors: 'U6 advisors / mentors',
  traction: 'U7 real testers, quotes, waitlist',
  recognition: 'U8 awards, grants, hackathons, publications',
  split: 'U9 equity split',
  seedFundName: 'U10 seed fund name',
  competitors: 'U11 verified competitors',
  sprintAsk: 'U12 what we want from the Sprint',
  tierNotes: 'U13 one line per routing tier (what each tier does)',
};

/** Missing hard needs of a slide, as readable messages (empty = the slide can be built). */
export const missingNeeds = (slide: number, inputs: DeckInputs): string[] => {
  const needs = SLIDE_NEEDS[slide] ?? [];
  const missing: string[] = [];
  for (const key of needs) {
    const value = inputs[key];
    if (value === null || value === undefined) {
      missing.push(INPUT_LABELS[key]);
      continue;
    }
    if (key === 'founders') {
      const founders = value as NonNullable<DeckInputs['founders']>;
      const incomplete = founders.length < 2 || founders.some((x) => !x.name || !x.role || !x.photo);
      if (incomplete) {
        missing.push(`${INPUT_LABELS[key]}: both founders need name, role and photo`);
      }
    }
  }
  return missing;
};
