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
    note: 'Crop the user prompt bubble for slide 2 and the routing graph for slide 6. Sidebar shows throwaway project names: exclude it.',
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
    note: 'Backs "59 agents, 46 roles". Slide 6 uses CROPS.roleCards (the top bar shows a personal name: out, H8).',
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
 *
 * Added in D2 (slides 3 to 5). Every one of them leaves out the sidebar (throwaway project names, H8-adjacent polish), the
 * personal name in the top bar (H8) and the Windows taskbar:
 *  - navStrip (chat_nav): only the tab row, from "Chat" to "Settings" (x 410..1440, y 114..174). The browser bar ends at y = 109,
 *    the account name starts at x = 1724: both are outside. Tab centres in source px: Chat 463, Notebooks 561, Research 678,
 *    Plan 766, Build 838, Test 910, Growth 991. NAV_STAGES below marks the four groups of slide 3.
 *  - notebooksMap (notebooks): the mind map only (x 310..1010, y 130..510), shown small next to pin 2 on slide 3.
 *  - planPrd (prd): the generated PRD itself: the Plan tab's main panel (x 296..1306, y 228..1080) with the sub-tab row (PRD
 *    highlighted), the parts-list table, the cost line and the start of the block diagram. The chat panel with the prompt (x > 1336),
 *    the sidebar (x < 282) and the project header row (y < 226) are out.
 *  - planArch (arch): the diagram panel from the Save row down (y >= 196). Higher up, a half-cut line of the diagram's source text
 *    shows at y 168..182, so the sub-tab row is left out.
 *  - planBlueprint / researchSources: the main panel of 05 / 03, sub-tab row included, sidebar and chat panel out.
 *  - buildEditor (build): the whole file tree and the k.py editor (x 56..746, y 100..641). The header row above it (y < 98) carries
 *    the project name and buttons that would be cut mid-way, so it is left out, as is the chat panel.
 *  - testPersonas (test): the persona cards only (x 290..1145), ending at y 900, in the gap between two cards. The table with the
 *    raw <br> text sits at x > 1440: out of the crop.
 *  - growthFanout (growth): the Content Fan-out form (x 290..1180), tab row to the end of "Analytics (soon)"; sidebar and chat dock out.
 * The three crops of slide 5 share one aspect ratio, so the shots have the same height at the same width.
 *
 * Added in D3 (slide 6):
 *  - routingGraph (chat): the inside of the routing-graph card of the Working Panel (card border x 1359..1831, y 484..935; the
 *    crop stays 3 px inside it): the live graph of the Tier 3 drone answer shown on slide 2, with its status legend. The labels
 *    in the graph overlap and are not meant to be read; it is the picture of the task's route. The Working Panel's step cards
 *    above it, the chat and the sidebar are out. ROUTING_PINS below marks four nodes of it.
 *  - roleCards (roles): the "coding (5)" group header and its first two rows of role cards (x 462..1387, y 312..742). The top bar
 *    with the account name (y < 110) and the scrollbar (x > 1400) are out (H8).
 */
export const CROPS = {
  splashLogo: {x: 463, y: 200, w: 933, h: 525},
  chatPrompt: {x: 526, y: 141, w: 776, h: 86},
  chatExchange: {x: 376, y: 141, w: 940, h: 640},
  navStrip: {x: 410, y: 114, w: 1030, h: 60},
  notebooksMap: {x: 310, y: 130, w: 700, h: 380},
  planPrd: {x: 296, y: 228, w: 1010, h: 852},
  planArch: {x: 300, y: 196, w: 1000, h: 755},
  planBlueprint: {x: 300, y: 118, w: 1015, h: 853},
  researchSources: {x: 300, y: 118, w: 1000, h: 853},
  buildEditor: {x: 56, y: 100, w: 690, h: 541},
  testPersonas: {x: 290, y: 228, w: 855, h: 672},
  growthFanout: {x: 290, y: 176, w: 890, h: 698},
  routingGraph: {x: 1362, y: 488, w: 466, h: 444},
  roleCards: {x: 462, y: 312, w: 925, h: 430},
} as const satisfies Record<string, Crop>;

/**
 * The four groups of the seven lifecycle stages on the nav strip of `chat_nav` (slide 3), as x ranges in SOURCE pixels:
 * Chat | Notebooks | Research and Plan | Build, Test and Growth. The tabs Role Library, Workflow Templates, Token Usage and
 * Settings are the other four of the eleven; they stay unmarked.
 */
export const NAV_STAGES: readonly {x0: number; x1: number}[] = [
  {x0: 426, x1: 501},
  {x0: 509, x1: 614},
  {x0: 631, x1: 793},
  {x0: 808, x1: 1031},
];

/**
 * The four numbered pins of slide 6 on the routing graph (`chat`, source pixels): `node` is the node a pin marks (a ring is
 * drawn round it), `pin` is where the numbered disc sits, in blank graph area, joined to the node by a thin leader line.
 * Order = the legend: 1 Ask (the Input node), 2 Route (the classifier that chooses the tier), 3 Specialists work and recheck
 * (the cluster of worker nodes), 4 Saved to the workspace (the Output node). Re-tune with <Shot id="chat" crop={CROPS.routingGraph} grid />.
 */
export const ROUTING_PINS: readonly {pin: {x: number; y: number}; node: {x: number; y: number}}[] = [
  {pin: {x: 1790, y: 522}, node: {x: 1702, y: 592}},
  {pin: {x: 1625, y: 514}, node: {x: 1611, y: 566}},
  {pin: {x: 1790, y: 726}, node: {x: 1624, y: 668}},
  {pin: {x: 1405, y: 818}, node: {x: 1481, y: 857}},
];

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
