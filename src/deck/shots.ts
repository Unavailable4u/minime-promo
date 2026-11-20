/**
 * MiniMe pitch deck — the screenshot catalogue (guide section 5.2).
 * Maps a semantic id to a file in public/screenshots/, its natural size and a crop box {x, y, w, h} in SOURCE pixels.
 * Crops are code: re-tune them in the Studio with <Shot id="..." grid />. Never edit or rename the files.
 *
 * The 1920 x 1080 captures show the browser bar across the top (ends at about y = 114) and the Windows taskbar down the
 * right edge (starts at about x = 1850). Their safe base crop is BASE_CROP = {x: 0, y: 116, w: 1838, h: 964}; it was
 * checked on all thirteen 1920 x 1080 files in D0. Captures of any other size are already clean: their crop is the whole image.
 * `natural` is checked against the PNG header by `npm run deck:check`.
 */

export type Crop = {x: number; y: number; w: number; h: number};
export type Size = {w: number; h: number};

export const BASE_CROP: Crop = {x: 0, y: 116, w: 1838, h: 964};

export type ShotDef = {
  /** File name inside public/screenshots/ (may contain spaces; Shot.tsx hands it to staticFile). */
  file: string;
  natural: Size;
  crop: Crop;
  /** What it shows, one line. */
  shows: string;
  /** Slides it is meant for (guide v2, 5.2). Empty = not used. */
  use: readonly number[];
  note?: string;
};

const full = (natural: Size): Crop => ({x: 0, y: 0, w: natural.w, h: natural.h});
const captured1080 = (): {natural: Size; crop: Crop} => ({natural: {w: 1920, h: 1080}, crop: BASE_CROP});
const clean = (w: number, h: number): {natural: Size; crop: Crop} => ({natural: {w, h}, crop: full({w, h})});

export const SHOTS = {
  landing: {
    file: 'image.png',
    ...clean(1856, 973),
    shows: 'Landing hero: "From a rough idea to a finished build, carried by one AI, start to finish."',
    use: [3],
    note: 'Clean, no crop. The real promise line.',
  },
  splash: {
    file: 'image copy.png',
    ...captured1080(),
    shows: 'Logo glow loading screen',
    use: [1],
    note: 'Slide 1 uses CROPS.splashLogo (logo and glow; the tiny "initializing" text is outside it) on the ink cover.',
  },
  chat: {
    file: '01-chat.png',
    ...clean(1857, 971),
    shows: 'Tier 3 answer to the drone prompt, plus the Working Panel with the live routing graph',
    use: [2, 6],
    note: 'Crop the user prompt bubble for slide 2 and the routing graph for slide 7. Sidebar shows throwaway project names: exclude it.',
  },
  chat_nav: {
    file: 'image copy 2.png',
    ...captured1080(),
    shows: 'Same chat with the full top nav (all 11 tabs)',
    use: [3],
    note: 'Base crop, then use only the nav strip. The top bar shows a personal name: crop it out (H8).',
  },
  notebooks: {
    file: '02-notebooks.png',
    ...clean(1857, 971),
    shows: 'Mind map plus generated workflows',
    use: [4],
  },
  quiz: {
    file: 'image copy 4.png',
    ...captured1080(),
    shows: 'Notebook study mode: quiz',
    use: [],
    note: 'Optional for slide 4.',
  },
  research: {
    file: '03-research.png',
    ...clean(1857, 971),
    shows: 'Research sources list with search',
    use: [4],
  },
  citations: {
    file: 'image copy 6.png',
    ...captured1080(),
    shows: 'Citation graph',
    use: [],
    note: 'Optional for slide 4.',
  },
  prd: {
    file: 'image copy 7.png',
    ...captured1080(),
    shows: 'The plant-monitor prompt and the generated PRD',
    use: [4],
    note: 'The prompt text is the closing story.',
  },
  arch: {
    file: '04-plan-architecture.png',
    ...clean(1857, 971),
    shows: 'Architecture diagram (battery, converter, regulator, ESP32, sensors)',
    use: [4],
  },
  blueprint: {
    file: '05-plan-blueprint.png',
    ...clean(1857, 971),
    shows: '3D blueprint with the parts list',
    use: [4, 10],
    note: 'Strongest Plan visual.',
  },
  build: {
    file: '06-build.png',
    ...clean(1487, 776),
    shows: 'Code editor',
    use: [5],
    note: 'Do not imply this project is the plant monitor: it is a small k.py snippet.',
  },
  test: {
    file: 'image copy 11.png',
    ...captured1080(),
    shows: 'Test tab: personas',
    use: [5],
    note: 'The table on the right shows raw <br> text: use only the left persona list, or fix the bug and re-capture.',
  },
  growth: {
    file: 'image copy 12.png',
    ...captured1080(),
    shows: 'Growth: content fan-out to platforms',
    use: [5],
    note: 'Clean.',
  },
  roles: {
    file: 'image copy 13.png',
    ...captured1080(),
    shows: 'Role Library with auto-generated role cards',
    use: [6],
    note: 'Backs "59 agents, 46 roles".',
  },
  research_chat: {
    file: 'image copy 5.png',
    ...captured1080(),
    shows: 'Research tab with chat',
    use: [],
    note: 'Skip: duplicate of `research`.',
  },
} as const satisfies Record<string, ShotDef>;

export type ShotId = keyof typeof SHOTS;

/**
 * Named crops used by built slides (source pixels). Re-tune them here with <Shot id="..." grid /> in the Studio.
 *  - splashLogo: the logo and its glow, 16:9, ends at y = 725 so the tiny "initializing" text (y about 736) and the
 *    progress bar are outside it. The logo's centre is at about (930, 520).
 *  - chatPrompt: the drone prompt bubble of `chat` (01-chat.png): x 532..1300, y 147..222 plus a few px of margin (stops
 *    before the scrollbar at x 1305).
 *  - chatExchange: the bubble and the top of the Tier 3 answer (x 376..1316, y 141..781). Slide 2 shows it at about 1.0x.
 */
export const CROPS = {
  splashLogo: {x: 463, y: 200, w: 933, h: 525},
  chatPrompt: {x: 526, y: 141, w: 776, h: 86},
  chatExchange: {x: 376, y: 141, w: 940, h: 640},
} as const satisfies Record<string, Crop>;

/**
 * Captures that must never appear on a slide. They are NOT in SHOTS, so <Shot id="tokens" /> does not type-check,
 * and `npm run deck:check` fails if a slide mentions the file.
 */
export const FORBIDDEN_SHOTS = {
  tokens: {
    file: 'image copy 14.png',
    why: 'Token Usage: shows API key names and a zero-credit Free plan (rule H8).',
  },
} as const;

/** One more capture is in the folder for reference only (1536 x 864, browser bar, no taskbar): `image copy 10.png`. Not catalogued. */
export const shotFile = (id: ShotId): string => `screenshots/${SHOTS[id].file}`;
