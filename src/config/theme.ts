/**
 * MiniMe promo — theme constants.
 * Every color used anywhere in the film comes from here (single source of truth).
 * The matching CSS variables live in src/ui/theme.css and are mirrored in CSS_VARS below.
 */

// ---------------------------------------------------------------- brand accent
export const ACCENT = {
  base: '#FF2052', // THE single accent: crimson
  hover: '#e0134a',
  active: '#b80f3a',
  text: '#ffffff', // text on top of the accent
  wordmarkMe: '#ff5168', // the "Me" in the MiniMe wordmark
} as const;

// -------------------------------------------------------------------- neutrals
export const NEUTRAL = {
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
} as const;

/** Translucent neutrals used by cards and bubbles. */
export const NEUTRAL_ALPHA = {
  n950a50: 'rgba(10, 10, 10, 0.5)',
  n900a50: 'rgba(23, 23, 23, 0.5)',
  n800a70: 'rgba(38, 38, 38, 0.7)',
  white08: 'rgba(255, 255, 255, 0.08)',
  white05: 'rgba(255, 255, 255, 0.05)',
  white04: 'rgba(255, 255, 255, 0.04)',
  black30: 'rgba(0, 0, 0, 0.3)',
  black50: 'rgba(0, 0, 0, 0.5)',
} as const;

// -------------------------------------------------------------------- surfaces
export const SURFACE = {
  appBody: '#151515', // app body background
  stageTop: '#0a0a0a', // stage gradient, top
  stageBottom: '#151515', // stage gradient, bottom
  logoStage: '#050505', // pure dark used by the logo opener (S0)
  activeRow: '#1a1a1a', // active chat row in the sidebar
  glowRing: '0 0 0 1px rgba(255, 255, 255, 0.08)',
  /** The stage gradient as a ready-to-use CSS value. */
  stageGradient: 'linear-gradient(180deg, #0a0a0a 0%, #151515 100%)',
  /** Soft crimson light that drifts behind the window (use alpha .10 to .18). */
  crimsonGlow: (alpha: number) => `rgba(255, 32, 82, ${alpha})`,
} as const;

// ---------------------------------------------------------------------- status
export const STATUS = {
  done: '#22c55e',
  running: '#f59e0b',
  error: '#ef4444',
  paused: '#eab308',
  pending: '#525252',
  /** "awaiting approval" shares the paused amber ring (dashed, pulsing). */
  awaiting: '#eab308',
} as const;
export type StatusKey = keyof typeof STATUS;

/**
 * Step-card chrome per status (exact values from the real app).
 * `pending` is not specified in the reference; it reuses the `done` chrome.
 */
export const STEP_CARD = {
  done: {border: '#262626', bg: 'rgba(10, 10, 10, 0.5)'},
  running: {border: '#404040', bg: 'rgba(23, 23, 23, 0.5)'},
  error: {border: '#7f1d1d', bg: 'rgba(69, 10, 10, 0.3)'},
  awaiting: {border: '#b45309', bg: 'rgba(69, 26, 3, 0.2)'},
  pending: {border: '#262626', bg: 'rgba(10, 10, 10, 0.5)'},
} as const;

// ----------------------------------------------------------------------- tiers
/** Index = tier number (0..3). */
export const TIER_COLORS = ['#34d399', '#38bdf8', '#a78bfa', '#fbbf24'] as const;
export const TIER_COLOR_BY_KEY = {
  instant: TIER_COLORS[0],
  direct: TIER_COLORS[1],
  fixed: TIER_COLORS[2],
  adaptive: TIER_COLORS[3],
} as const;
export type TierKey = keyof typeof TIER_COLOR_BY_KEY;

/**
 * Colors of the assistant message meta row that are not tier colors.
 * paused = amber-300, error = red-400 (both from the reference), routing = the neutral "routing…" state.
 */
export const META_COLORS = {
  paused: '#fcd34d',
  error: '#f87171',
  routing: '#a3a3a3', // neutral-400 label while the Inspector has not picked a tier yet
  routingDot: '#737373', // neutral-500
  separator: '#525252', // neutral-600: the "· ok" and "· 41s" parts
} as const;

// ----------------------------------------------------------------------- edges
export const EDGE_COLORS = {
  plan: '#6b7280',
  recheck: '#f59e0b',
  escalate: '#ec4899',
  requested: '#22d3ee',
  decision: '#64748b', // drawn dashed
  error: '#ef4444',
} as const;
export type EdgeReason = keyof typeof EDGE_COLORS;
/** Edge reasons that are drawn dashed. */
export const EDGE_DASHED: ReadonlySet<EdgeReason> = new Set<EdgeReason>(['decision']);

// ----------------------------------------------------------------- code colors
/** VS Code Dark+ token colors for fenced code blocks. */
export const TOKEN_COLORS = {
  comment: '#6a9955',
  string: '#ce9178',
  number: '#b5cea8',
  keyword: '#c586c0',
  decl: '#569cd6',
  const: '#569cd6',
  func: '#dcdcaa',
  type: '#4ec9b0',
  prop: '#9cdcfe',
  plain: '#d4d4d4',
  inlineCode: '#fcd34d', // amber-300, used for inline `code`
} as const;

// ----------------------------------------------------------------------- fonts
export const FONTS = {
  heading: "'Sora', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
} as const;

// ------------------------------------------------------------------- CSS vars
/** Same tokens as src/ui/theme.css, for places that want them as an inline style object. */
export const CSS_VARS = {
  '--accent': ACCENT.base,
  '--accent-text': ACCENT.text,
  '--accent-hover': ACCENT.hover,
  '--accent-active': ACCENT.active,
  '--neutral-100': NEUTRAL[100],
  '--neutral-200': NEUTRAL[200],
  '--neutral-300': NEUTRAL[300],
  '--neutral-400': NEUTRAL[400],
  '--neutral-500': NEUTRAL[500],
  '--neutral-600': NEUTRAL[600],
  '--neutral-700': NEUTRAL[700],
  '--neutral-800': NEUTRAL[800],
  '--neutral-900': NEUTRAL[900],
  '--neutral-950': NEUTRAL[950],
  '--neutral-950-a50': NEUTRAL_ALPHA.n950a50,
  '--neutral-900-a50': NEUTRAL_ALPHA.n900a50,
  '--neutral-800-a70': NEUTRAL_ALPHA.n800a70,
  '--body-bg': SURFACE.appBody,
  '--glow-ring': SURFACE.glowRing,
  '--density-bubble-px': '0.75rem',
  '--density-bubble-py': '0.5rem',
  '--density-line-height': '1.625',
  '--density-card-gap': '0.5rem',
} as const;
