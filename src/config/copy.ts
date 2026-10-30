/**
 * MiniMe promo — ALL on-screen text lives here.
 * Edit this file to change wording; nothing else needs to change.
 * Everything is fictional. The signed-in user is "Maya Chen".
 */

// ---------------------------------------------------------------- marketing
export const BRAND = {
  mini: 'Mini',
  me: 'Me',
  name: 'MiniMe',
} as const;

export const HEADLINE = {
  line1: 'Describe a task.',
  line2: 'Get a team.',
  /** The word(s) in line 2 that turn crimson and get the underline draw. */
  highlight: 'team.',
  full: 'Describe a task. Get a team.',
} as const;

/** One caption per scene. `highlight` is the key word shown in crimson. */
export const CAPTIONS = {
  instant: {text: 'Simple asks? Instant.', highlight: 'Instant.'},
  team: {
    text: 'Big asks? A whole team.',
    highlight: 'team.',
    sub: 'Specialists staffed automatically.',
  },
  control: {text: 'You stay in control.', highlight: 'control.'},
  organized: {text: 'Every chat, organized.', highlight: 'organized.'},
  outro: {text: 'Chat is just the beginning.', highlight: 'beginning.'},
} as const;

/** Callout chips: 4 words max each. */
export const CALLOUTS = {
  answeredInstantly: 'Answered instantly',
  inspectorReads: 'Inspector reads the task',
  tier3Team: 'Tier 3 → specialist team',
  verifierSendsBack: 'Verifier sends work back',
  everyStepTraced: 'Every step traced',
  modes: 'Auto · Simple · Fast · Expert · Beast',
  approveFirst: 'Approve the team first',
  pauseAnytime: 'Pause anytime',
  searchEverything: 'Search everything',
  newChat: 'New chat, one click',
  dropFiles: 'Drop in files',
} as const;

export const STAT_CHIP = {
  text: '7 specialists · 1 recheck · 41.2s',
  specialists: 7,
  rechecks: 1,
  seconds: 41.2,
} as const;

export const CTA = {
  label: 'Try MiniMe',
  url: 'minime.app', // placeholder: edit before publishing
} as const;

// ------------------------------------------------------------------ app shell
export const USER = {
  name: 'Maya Chen',
  initial: 'M',
} as const;

/** Top nav, left to right. Only "Chat" is ever active; no other tab's content is ever shown. */
export const NAV_TABS = [
  'Chat',
  'Notebooks',
  'Research',
  'Plan',
  'Build',
  'Test',
  'Growth',
  'Role Library',
  'Workflow Templates',
  'Token Usage',
  'Settings',
] as const;
export const ACTIVE_TAB = 'Chat';

export type SidebarChat = {readonly id: string; readonly title: string};
export type SidebarProject = {
  readonly id: string;
  readonly name: string;
  readonly chats: readonly SidebarChat[];
};

/**
 * Sidebar content, top to bottom:
 *   1. activeChat (ungrouped, at the very top; its title types itself in scene S2)
 *   2. projects (COFFEE CLUB, STUDIO) with their chats
 *   3. ungrouped chats
 */
export const SIDEBAR = {
  activeChat: {id: 'new-chat', title: 'New Chat'} as SidebarChat,
  /** Title the active chat ends up with after scene S2. */
  activeChatAutoTitle: 'Explain debounce vs throttle…',
  projects: [
    {
      id: 'coffee-club',
      name: 'COFFEE CLUB',
      chats: [
        {id: 'supplier-outreach', title: 'Supplier outreach email'},
        {id: 'pricing-teardown', title: 'Subscription pricing teardown'},
        {id: 'roast-naming', title: 'Roast-level naming ideas'},
      ],
    },
    {
      id: 'studio',
      name: 'STUDIO',
      chats: [
        {id: 'brand-voice', title: 'Brand voice guidelines'},
        {id: 'landing-copy', title: 'Landing page copy v2'},
      ],
    },
  ] as readonly SidebarProject[],
  ungrouped: [
    {id: 'onboarding-emails', title: 'Onboarding email sequence'},
    {id: 'flaky-checkout', title: 'Fix flaky checkout test'},
    {id: 'q3-churn', title: 'Summarize Q3 churn report'},
    {id: 'pitch-deck', title: 'Pitch deck outline (seed)'},
  ] as readonly SidebarChat[],
} as const;

/** Small UI strings used by the faithful MiniMe components. */
export const UI_TEXT = {
  chatsTitle: 'Chats',
  searchPlaceholder: 'Search chats, batches, projects…',
  chatBoxTitle: 'Chat Box',
  reviewHires: 'Review hires',
  workingPanelTitle: 'Working Panel',
  composerPlaceholder: 'Describe a task... (Shift+Enter for a new line)',
  send: 'Send',
  pause: 'Pause',
  resume: 'Resume',
  working: 'Working…',
  routing: 'routing…',
  paused: 'Paused',
  error: 'Error',
  ok: 'ok',
  newChatTitle: 'New Chat',
  traceLink: 'View trace in Langfuse',
  saveTemplate: 'Save as template',
  toastSavedTemplate: 'Saved as workflow template',
  routingTier3: 'Tier 3 · adaptive',
  routingTrace: 'routing trace',
  routingInstant: 'Instant response — no pipeline',
  inspectorStep: 'Inspector — classifying task',
  hireReviewTitle: 'Review staffed roles',
  hireReviewSubtitle: '5 roles · est. 18k tokens',
  hireEdit: 'Edit',
  hireApprove: 'Approve & run',
  attachmentName: 'competitors.pdf',
} as const;

/** Tier labels exactly as shown in the message meta row. Index = tier number. */
export const TIER_LABELS = [
  'Tier 0 · Instant',
  'Tier 1 · Direct',
  'Tier 2 · Fixed',
  'Tier 3 · Ultimate Structure',
] as const;

/** Tier text exactly as shown on step cards. */
export const TIER_STEP_LABELS = {
  instant: 'Tier 0 · instant',
  direct: 'Tier 1 · direct',
  fixed: 'Tier 2 · fixed',
  adaptive: 'Tier 3 · adaptive',
} as const;

export type ModeId = 'auto' | 'simple' | 'fast' | 'expert' | 'beast';

/** Composer mode picker options, exactly as in the app. `icon` is a lucide-react icon name. */
export const MODE_OPTIONS: readonly {
  readonly id: ModeId;
  readonly label: string;
  readonly hint: string;
  readonly icon: 'Sparkles' | 'Feather' | 'Zap' | 'Brain' | 'Flame';
}[] = [
  {id: 'auto', label: 'Auto', hint: 'Let the Inspector decide', icon: 'Sparkles'},
  {id: 'simple', label: 'Simple', hint: 'Cheapest capable tier only', icon: 'Feather'},
  {id: 'fast', label: 'Fast', hint: 'Favor speed over headcount', icon: 'Zap'},
  {id: 'expert', label: 'Expert', hint: 'Allow the full staffed ceiling', icon: 'Brain'},
  {id: 'beast', label: 'Beast', hint: 'Force the full pipeline, skip SGA/cache', icon: 'Flame'},
];

/** The short things the user types in the film. (Long streamed answers live with the script, patch 07.) */
export const PROMPTS = {
  instant: 'Explain debounce vs throttle in one line each.',
  team: 'Launch a coffee subscription app: 4-week plan, pricing table, and the signup endpoint in Node.',
  /** What the Working Panel shows as the task excerpt (single line, ellipsis). */
  teamExcerpt: 'Launch a coffee subscription app: 4-week plan, pricing table, and the sig…',
  control: 'Audit that endpoint for security issues.',
  search: 'coffee',
} as const;

/**
 * Long streamed answers (patch 04 dev sheet; the script in patch 07 reuses them).
 * `team` is the Tier 3 answer to PROMPTS.team: heading, plan, pricing table, quote and a code block.
 */
export const ANSWERS = {
  team: [
    '## Coffee Club — Launch Pack',
    '',
    '**Goal:** ship a subscription app that *pays for itself* in the first month.',
    '',
    '### 4-week plan',
    '1. **Week 1 — Validate.** Interview 15 coffee lovers and sketch the signup flow.',
    '2. **Week 2 — Build.** Ship signup, billing and the delivery calendar.',
    '3. **Week 3 — Beta.** Invite 50 testers and track churn and `time-to-first-box`.',
    '4. **Week 4 — Launch.** Open the waitlist, publish pricing, go live.',
    '',
    '### Pricing',
    '| Plan | Bags / month | Price |',
    '| :--- | :---: | ---: |',
    '| Starter | 1 | $14 |',
    '| Regular | 2 | $26 |',
    '| Pro | 4 | $48 |',
    '',
    '> Annual billing saves 15% — worth highlighting at checkout.',
    '',
    '### Signup endpoint',
    '```js',
    '// POST /signup',
    "app.post('/signup', async (req, res) => {",
    '  const {email, plan} = req.body;',
    '  if (!/^\\S+@\\S+\\.\\S+$/.test(email)) {',
    "    return res.status(400).json({error: 'Invalid email'});",
    '  }',
    '  const user = await db.users.create({email, plan});',
    '  res.status(201).json({id: user.id});',
    '});',
    '```',
  ].join('\n'),
} as const;

/**
 * The five staffed roles of the "Review hires" card (patch 05, brief Appendix D4): the Audit task of scene S4.
 * `tokens` sum to the 18k of UI_TEXT.hireReviewSubtitle.
 */
export const HIRE_ROLES = [
  {name: 'security_auditor', purpose: 'Scans the endpoint for injection, auth and rate-limit gaps', tokens: '4.2k'},
  {name: 'code_reviewer', purpose: 'Reads the handler for bugs, unsafe patterns and style', tokens: '3.6k'},
  {name: 'fixer', purpose: 'Patches every issue the audit and the review find', tokens: '4.4k'},
  {name: 'report_writer', purpose: 'Turns findings and fixes into a clear report', tokens: '3.4k'},
  {name: 'responder', purpose: 'Writes the final answer back into the chat', tokens: '2.4k'},
] as const;

/**
 * Text of the routing graph (patch 06, brief §6.4 item 6 and Appendix D3).
 * `decisionLabel` is the label of the dashed worker-pool decision node; `legend` is the strip under the graph.
 */
export const GRAPH_TEXT = {
  decisionLabel: 'Worker pool: code_writer (3/5 picked)',
  legend: {
    done: 'done',
    running: 'running',
    error: 'error',
    awaiting: 'awaiting approval',
    pending: 'pending',
    requested: 'requested',
    decision: 'decision',
  },
} as const;
