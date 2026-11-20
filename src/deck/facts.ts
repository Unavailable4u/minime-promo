/**
 * MiniMe pitch deck — the facts sheet (guide section 3). EVERY number on a slide is read from here.
 *
 * Each row is {id, value, source, status}:
 *   V = verified in the repo or the book      T = target, unvalidated      A = assumption
 * H1: a slide shows a T or A number only with a word beside it that says so ("target", "plan"): use qualifier().
 * H2: no invented numbers. Market size, user counts, testimonials, revenue, waitlist: only via data/inputs.ts with a source.
 *
 * Never on the deck: "73 agents", any user count, any revenue, any named-competitor claim you have not verified,
 * the promo film's stat chip "7 specialists, 1 recheck, 41.2 s" (scripted, not measured).
 *
 * PURE DATA (no imports): loaded by scripts/lib/deck-data.mjs.
 */

export type FactStatus = 'V' | 'T' | 'A';

export type Fact<T> = {
  readonly id: string;
  readonly value: T;
  /** A file and line, a rulebook section or "your application form". Never empty. */
  readonly source: string;
  readonly status: FactStatus;
};

const row = <T>(id: string, value: T, source: string, status: FactStatus): Fact<T> => ({id, value, source, status});

const MONTHS = [6, 12, 24, 36] as const;

export const FACTS = {
  company: row(
    'company',
    {name: 'Next Inc', founded: 2026, city: 'Rajshahi', country: 'Bangladesh', stage: 'Pre-Seed'},
    'your application form',
    'V',
  ),
  tabs: row(
    'tabs',
    {
      count: 11,
      names: ['Chat', 'Notebooks', 'Research', 'Plan', 'Build', 'Test', 'Growth', 'Role Library', 'Workflow Templates', 'Token Usage', 'Settings'],
    },
    'src/config/copy.ts NAV_TABS',
    'V',
  ),
  stages: row(
    'stages',
    {
      count: 7,
      // Research, Plan, Build, Test, Growth, plus Chat and Notebooks around them (nav order).
      names: ['Chat', 'Notebooks', 'Research', 'Plan', 'Build', 'Test', 'Growth'],
    },
    'data/docs/minime_feature_guide.md',
    'V',
  ),
  routing: row(
    'routing',
    {
      count: 4,
      tiers: [
        {tier: 0, name: 'Instant'},
        {tier: 1, name: 'Direct'},
        {tier: 2, name: 'Fixed'},
        {tier: 3, name: 'Adaptive'},
      ],
    },
    'src/config/copy.ts TIER_STEP_LABELS (guide: TIER_LABELS)',
    'V',
  ),
  agents: row(
    'agents',
    {
      /** What the deck says: "59 specialist agents, 46 roles". */
      specialist: 59,
      roles: 46,
      subsystems: 25,
      /** 73 Python modules in backend/agents/ INCLUDING 14 support modules. NEVER print this as "73 agents" (guide 1.3). */
      modules: 73,
      support: 14,
    },
    'minime_feature_guide.md line 312, data/summary.md line 22',
    'V',
  ),
  products: row(
    'products',
    {
      count: 3,
      items: [
        {name: 'MiniMe', what: 'web workspace'},
        {name: 'M2C', what: 'coding agent for terminal and editor'},
        {name: 'Menux', what: 'personal automation agent'},
      ],
    },
    'data/summary.md (three products on one account and plan)',
    'V',
  ),
  plans: row(
    'plans',
    {
      tiers: [
        {name: 'Free', usd: 0, bdt: 0},
        {name: 'Basic', usd: 9, bdt: 899},
        {name: 'Moderate', usd: 29, bdt: 2999},
        {name: 'Ultimate', usd: 79, bdt: 8499},
      ],
      annualMonths: 10, // annual is 10 times monthly
      freeTokensPerMonth: '300K',
    },
    'MiniMe_Financial_Strategy_Rulebook.md section 7.1 (launch-ready, usage assumptions unconfirmed)',
    'A',
  ),
  margin: row(
    'margin',
    {typicalGrossMarginPct: 75, cogsFullUsePct: {min: 37.6, max: 43.0}, cogsRulePctMax: 45},
    'rulebook section 8.3',
    'A',
  ),
  gp: row(
    'gp',
    {basicUsd: 5.79, moderateUsd: 18.5, ultimateUsd: 52.44},
    'rulebook section 8.3 (blended gross profit per paid user per month)',
    'A',
  ),
  breakeven: row(
    'breakeven',
    {basicUsers: 36, leanInfraPlusFreeBudgetUsdPerMonth: 210},
    'rulebook section 8.4',
    'A',
  ),
  free_cost: row(
    'free_cost',
    {usdPerActiveFreeUserPerMonth: 0.13, atCapPct: 60},
    'rulebook section 7.4',
    'A',
  ),
  funnel: row(
    'funnel',
    {
      months: MONTHS,
      registered: [1200, 6500, 28000, 95000],
      paid: [40, 120, 595, 2720],
    },
    'rulebook section 9.2 (unvalidated)',
    'T',
  ),
  mrr: row(
    'mrr',
    {months: MONTHS, usd: [307, 920, 8235, 44700], arrMonth36Usd: 536400},
    'rulebook section 9.2',
    'T',
  ),
  pnl: row(
    'pnl',
    {
      revenueUsd: {year1: 5058, year2: 53304, year3: 335840},
      year3GrossMarginPct: 64.0,
      grossMarginPct: {month6: 43, month12: 31, month36: 65},
    },
    'rulebook sections 9.2 to 9.3',
    'T',
  ),
  ebitda: row(
    'ebitda',
    {planAUsd: {year1: -97, year2: 12824, year3: 127900}},
    'rulebook section 9.3 (Plan A, governed spend)',
    'T',
  ),
  capital: row(
    'capital',
    {
      totalUsd: 7000,
      parts: [
        {name: 'Foundation', usd: 300},
        {name: 'Pilot and launch prep', usd: 3000},
        {name: 'Launch', usd: 1200},
        {name: 'Working buffer', usd: 2500},
      ],
    },
    'founders\' decision: plan for $7k, above their financial plan\'s best overall cost of about $5.5k, because costs may rise before launch. The rulebook (sections 11.2 and 9.5) gives 225 + 2,553 + 850 = 3,628 plus a 1,500 working buffer; the three parts are rounded up (about 24% headroom) and the buffer is enlarged',
    'A',
  ),
  external: row(
    'external',
    {planAUsd: 4200, planBUsd: 27900},
    'rulebook section 9.5 (Plan A deepest gap at month 6; Plan B = accelerated hiring)',
    'T',
  ),
  timeline: row(
    'timeline',
    {
      foundation: 'Sep 2026 to Jun 2027',
      pilot: 'Jul to Dec 2027',
      launch: 'Jan 2028',
      /** U10 default wording: "Grant / seed-fund pilot (application Apr 2027)". */
      grantApplication: 'Apr 2027',
    },
    'rulebook section 11.1 (illustrative dates; launch is demand-gated)',
    'A',
  ),
  cap_table: row(
    'cap_table',
    {foundersPct: 100},
    'guide U9 default: no outside equity assumed until the founders supply a split',
    'A',
  ),
  promise: row(
    'promise',
    {headline: 'From a rough idea to a finished build, carried by one AI, start to finish.'},
    'screenshot image.png (landing page)',
    'V',
  ),
} as const;

export type FactId = keyof typeof FACTS;

/** Typed accessor. A missing id throws (never returns undefined), so a typo cannot render a hole. */
export const fact = <K extends FactId>(id: K): (typeof FACTS)[K] => {
  const found = (FACTS as Record<string, unknown>)[id as string];
  if (found === undefined) {
    throw new Error(`facts.ts: unknown fact "${String(id)}". Add it to FACTS with a source and a status.`);
  }
  return found as (typeof FACTS)[K];
};

/** `facts.agents.value.specialist`: same as fact('agents'), but a missing id throws at runtime as well. */
export const facts: Readonly<typeof FACTS> = new Proxy(FACTS, {
  get(target, key) {
    if (typeof key === 'string' && !(key in target)) {
      throw new Error(`facts.ts: unknown fact "${key}". Add it to FACTS with a source and a status.`);
    }
    return Reflect.get(target, key);
  },
});

/** H1: the word that must stand beside a number whose status is not V. `null` = verified, no word needed. */
export const qualifier = (id: FactId): 'target' | 'plan' | null => {
  const {status} = fact(id);
  return status === 'T' ? 'target' : status === 'A' ? 'plan' : null;
};

/** 1200 -> "1,200"; 44700 -> "44,700". */
export const formatNumber = (n: number): string => n.toLocaleString('en-US');

/** 4200 -> "4.2k", 44700 -> "44.7k", 950 -> "950". */
export const formatShort = (n: number): string => {
  if (Math.abs(n) < 1000) {
    return String(n);
  }
  const k = Math.round((n / 1000) * 10) / 10;
  return `${k}k`;
};

/** 3628 -> "$3,628". */
export const formatUsd = (n: number): string => `${n < 0 ? '-' : ''}$${formatNumber(Math.abs(n))}`;

/** 5.79 -> "$5.79"; 18.5 -> "$18.50"; 0.13 -> "$0.13". Always two decimals (money with cents). */
export const formatUsdCents = (n: number): string => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
