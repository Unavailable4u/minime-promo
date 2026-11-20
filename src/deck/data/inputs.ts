/**
 * MiniMe pitch deck — the open items only the founders can fill (guide section 2: U1 .. U12).
 * Every field starts as `null` except what the founders have already supplied.
 * A slide that needs a `null` item uses the default described in the guide; a placeholder string never reaches the PDF.
 * PURE DATA (no imports besides types): loaded by scripts/lib/deck-data.mjs.
 */

export type Founder = {
  name: string;
  role: string;
  /** U1: one line, "why us". `null` = the line is left out of slide 11. */
  whyUs: string | null;
  /** U1: full URL. `null` = the link is left out of slides 11 and 15. */
  linkedin: string | null;
  /** File in public/deck/people/ (JPEG). Shown as a circular crop, 280 px. */
  photo: string;
  /** Same picture as WebP (kept for the website; the deck itself uses `photo`). */
  webp: string;
};

export type MarketNumber = {label: string; value: string; source: string};
export type Advisor = {name: string; line: string};
export type Competitor = {name: string; sentence: string};

export type DeckInputs = {
  /** U1. Slide 9 (team) cannot be built without both founders (name, role, photo). */
  founders: readonly Founder[] | null;
  /** U2. Left out of slide 15 when null. */
  contactEmail: string | null;
  /** U3. Only when somebody outside your machine can use the app today. MiniMe is NOT deployed yet, so null. */
  liveUrl: string | null;
  /**
   * U4, changed in D0: the public website printed and QR-coded on slides 1, 12 and 15.
   * It is the COMPANY website. The MiniMe Atlas (minimebook) is deliberately not linked anywhere in the deck.
   */
  companyUrl: string;
  /** U5. null = slide 10 shows the three rings without numbers. */
  market: readonly MarketNumber[] | null;
  /** U6. null = "Seeking: product and pricing mentors". */
  advisors: readonly Advisor[] | null;
  /** U7. Real testers, quotes, waitlist count: anything a user actually did. null = omitted. */
  traction: readonly string[] | null;
  /** U8. Awards, grants, hackathons, publications. null = omitted. */
  recognition: readonly string[] | null;
  /** U9. Equity split between the founders, e.g. "60 / 40". null = "100% founders" only. */
  split: string | null;
  /** U10. Name of the seed fund. null = "Grant / seed-fund pilot (application Apr 2027)". */
  seedFundName: string | null;
  /** U11. Competitors you personally verified. null = category dots only. */
  competitors: readonly Competitor[] | null;
  /** U12. What you want from the Sprint. null = Mentors, Pilot users, Pricing feedback. */
  sprintAsk: readonly string[] | null;
  /** U13 (added in D1 v2). One short line per routing tier, in tier order (Instant, Direct, Fixed, Adaptive). null = tier names only. */
  tierNotes: readonly string[] | null;
};

export const inputs: DeckInputs = {
  founders: [
    {
      name: 'S. M. Shuaib Islam Sayad',
      role: 'Co-Founder & CEO',
      whyUs: null,
      linkedin: 'https://www.linkedin.com/in/unavailable4u/',
      photo: 'shuaib-islam.jpg',
      webp: 'shuaib-islam.webp',
    },
    {
      name: 'Shaikh Md Abu Ahad',
      role: 'Co-Founder & CTO',
      whyUs: null,
      linkedin: 'https://www.linkedin.com/in/shaikh-md-abu-ahad-a79101442/',
      photo: 'shaikh-muhammad.jpg',
      webp: 'shaikh-muhammad.webp',
    },
  ],
  contactEmail: null,
  liveUrl: null,
  companyUrl: 'https://www.wearenext.tech/',
  market: null,
  advisors: null,
  traction: null,
  recognition: null,
  split: null,
  seedFundName: null,
  competitors: null,
  sprintAsk: null,
  tierNotes: null,
};
