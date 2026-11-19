# MiniMe pitch deck: build guide and patch plan

Drop this file into `docs/guide/PITCH_DECK_PATCHES.md` of `minime-promo`.

Goal: a 15-slide, 16:9 PDF, 10 MB or less, for the INSEAD AI Founder Sprint form (field "Pitch Deck": PDF or PPTX, max 10 MB). Applications close 1 Dec 2026, 11:59 pm GMT+8.

The deck is built as code inside this repo, the same way `minilocker-film` built its deck: one Remotion composition, `MiniMeDeck`, where frame N-1 is slide N. A script renders the stills and joins them into one PDF.

---

## 0. How to use this file

1. Read sections 1 to 3 once. They are the rules, the open items only you can fill, and the facts sheet.
2. Fill the open items in section 2 (the deck will not export while a built slide still shows a placeholder).
3. Apply patches D0 to D5 in order (section 8). Every patch leaves a valid, exportable deck, so a partial deck is always shippable.
4. To get a patch, paste its prompt from section 9 into Claude Code or Copilot in this repo, or ask Claude: "generate patch D1".
5. After each patch, append an entry to `docs/PATCH_NOTES.md` (same format as the film patches) and update the status column in section 8.

If time runs out, the 9-slide cut is: 1, 2, 3, 4, 8, 11, 12, 13, 15.

---

## 1. Rules

These come from three sources: the SSTTAPI framework (Adnan Dewan), your own verdicts on the MiniLocker deck, and the form limits.

### 1.1 Hard rules (the export script enforces most of them)

| # | Rule | Source |
|---|---|---|
| R1 | 15 slides maximum. This deck has exactly 15. | SSTTAPI |
| R2 | Minimum text size 30 px on the 1920x1080 canvas. Text inside a real screenshot is exempt (it is a picture). | SSTTAPI |
| R3 | Two typefaces: Sora (headings, numerals), Inter (everything else). No third face. | SSTTAPI |
| R4 | Two colours: crimson `ACCENT.base` (#FF2052) plus the neutral ramp (near-black ground, white and grey text). Status colours appear only inside screenshots. | SSTTAPI |
| R5 | Image first. Each slide's main area is a real screenshot or one clean graphic. Text is key words only. | SSTTAPI + you |
| R6 | Not an icon gallery. At most 3 icons in the whole deck. No emoji art. | SSTTAPI |
| R7 | No web images, no stock, no "foreign" images. Only your own screenshots and your own photos. | SSTTAPI |
| R8 | Start with a story and end with it. Slide 2 opens it, slide 15 closes it. | SSTTAPI |
| R9 | Word budget per slide (section 6), counted by `scripts/check-deck.mjs` from `src/deck/words.ts`. Headline 8 words or fewer. | your verdict 1 |
| R10 | Problem about 20 percent, solution about 60 percent, process about 20 percent of the Secret Sauce block (slides 2 to 7): 1 problem slide, 4 solution slides (3 to 6), 1 process slide (7). | your verdicts 2 and 3 |
| R11 | Links are QR codes plus a short printed URL (30 px or larger). Nobody will type a long link. QR on slides 1, 12 and 15. | your verdict 4 |
| R12 | The PDF is 10 MB or less. Target 7 MB. The script embeds JPEG pages and steps quality down until it fits. | form |

### 1.2 Honesty rules

These exist because a reviewer can click, ask, or compare. A smaller true deck beats a bigger one that cracks in the interview.

- **H1. Every number lives in `src/deck/facts.ts` with a `source` string and a `status`:** `V` (verified in the repo or the book), `T` (target, unvalidated), `A` (assumption). A slide shows a `T` or `A` number only with a word beside it that says so ("target", "plan"). Slides never type numbers directly.
- **H2. No invented numbers.** Market size, user counts, testimonials, revenue, waitlist numbers: only if you supply them with a source (section 2). Otherwise the slide drops that element.
- **H3. Only real screenshots.** No mock-ups, no re-drawn UI. The promo film is a fictional animation, so nothing from it goes in this deck, including its stat chip "7 specialists, 1 recheck, 41.2 s" (scripted, not measured).
- **H4. State plainly: pre-revenue, pre-launch.** Traction shows what exists (the built product), not users or revenue you do not have.
- **H5. Competitors by category only,** unless you have personally verified a named product's claim (section 2, U11). The map is labelled "our view".
- **H6. Never write:** "revolutionary", "first ever", "10x", "guaranteed", "unlimited", "secure", "unhackable", "AI-proof". The AI-proof question gets an honest answer (slide 9), not a boast.
- **H7. Two founders.** The financial book was written for a solo founder. Anything that says "1 (you)" in the book becomes "2 founders" on the deck.
- **H8. Privacy.** Do not use screenshots that show API key names or account credentials (see `image copy 14.png`, section 5). Crop out any personal name in the top bar if you want it private.

### 1.3 Known corrections (apply to the form too)

- **"73 specialized agents" is wrong.** The feature guide says 73 Python modules in `backend/agents/`, of which **59 are specialist agent modules** and 14 are package or support modules, mapped across **46 router roles**. Say "59 specialist agents, 46 roles". If you pasted "73 agents" into the application form (elevator pitch or product description), change it to 59 before you submit.
- The form's tech-stack answer mentions eight LLM providers. The rulebook describes eight providers in the planned production stack, and part of that is not yet paid or in production. Say "multi-provider routing" on the deck, not a provider count.

---

## 2. Open items only you can fill

Put the answers in `src/deck/data/inputs.ts` (created in D0, every field starts as `null`). A slide that needs a `null` item uses the default in the last column. A placeholder string never reaches the PDF.

| Id | What | Used on | If left empty |
|---|---|---|---|
| U1 | Both founders: name, role, one-line "why us", LinkedIn, **your own photo** | 11, 15 | Slide 11 cannot be built. The export script stops. |
| U2 | Contact email | 15 | Omitted |
| U3 | Live app URL, if anyone outside your machine can use it today | 1, 12 | QR points to the Atlas instead, and slide 12 says "pre-launch" |
| U4 | Atlas URL. Known: `https://minimebook.vercel.app/` | 1, 12, 15 | Uses the known URL |
| U5 | Market numbers, each with a source you can name (for example the number of students, developers or startups in Bangladesh, and in South Asia) | 10 | Slide 10 shows the beachhead and expansion path without numbers |
| U6 | Advisors or mentors, if any | 11 | "Seeking: product and pricing mentors" |
| U7 | Real testers, quotes, waitlist count, anything a user actually did | 12 | Omitted |
| U8 | Awards, grants, hackathons, publications (the FBEBC preprint is planned, not published) | 12 | Omitted |
| U9 | Equity split between the two founders | 11 | Shows "100% founders" only |
| U10 | The name of the "Seed Fund" in the rulebook (it is unnamed there) | 14 | "Grant / seed-fund pilot (application Apr 2027)" |
| U11 | Competitors you have personally verified, with one true sentence each | 9 | Category dots only |
| U12 | What you want from the Sprint (mentorship, pilot users, pricing validation) | 14 | Those three, as written in slide 14 |

---

## 3. Facts sheet (becomes `src/deck/facts.ts`)

Sources are files in the `minime_book` repo (the Atlas) unless noted. `V` = verified there, `T` = target, `A` = assumption.

| Id | Value | Source | Status |
|---|---|---|---|
| company | Next Inc, founded 2026, Rajshahi, Bangladesh, stage Pre-Seed | your application form | V |
| tabs | 11 workspace tabs: Chat, Notebooks, Research, Plan, Build, Test, Growth, Role Library, Workflow Templates, Token Usage, Settings | `src/config/copy.ts` NAV_TABS | V |
| stages | Seven lifecycle stages: Research, Plan, Build, Test, Growth, plus Chat and Notebooks around them | `data/docs/minime_feature_guide.md` | V |
| routing | Four routing tiers: Tier 0 Instant, Tier 1 Direct, Tier 2 Fixed, Tier 3 Adaptive | `src/config/copy.ts` TIER_LABELS | V |
| agents | 59 specialist agent modules (73 modules in `backend/agents/` including 14 support modules), 46 router roles, 25 subsystems | `minime_feature_guide.md` line 312, `data/summary.md` line 22 | V |
| products | Three products on one account and plan: MiniMe (web workspace), M2C (coding agent for terminal and editor), Menux (personal automation agent) | `data/summary.md` | V |
| plans | Free $0, Basic $9, Moderate $29, Ultimate $79 per month. BDT 899, 2,999, 8,499. Annual is 10 times monthly. Free window: 300K tokens a month | `MiniMe_Financial_Strategy_Rulebook.md` section 7.1 | A (launch-ready, usage assumptions unconfirmed) |
| margin | Typical-use gross margin about 75 percent per paid plan; COGS at full use 37.6 to 43.0 percent of local price (rule: 45 percent or less) | rulebook section 8.3 | A |
| gp | Blended gross profit per paid user per month: Basic $5.79, Moderate $18.50, Ultimate $52.44 | rulebook section 8.3 | A |
| breakeven | About 36 Basic users cover lean infrastructure plus the Free budget ($210 a month) | rulebook section 8.4 | A |
| free_cost | $0.13 a month per active Free user at 60 percent of cap | rulebook section 7.4 | A |
| funnel | Registered free users 1,200 / 6,500 / 28,000 / 95,000 at month 6 / 12 / 24 / 36. Paid users 40 / 120 / 595 / 2,720 | rulebook section 9.2 | T (unvalidated) |
| mrr | MRR $307 / $920 / $8,235 / $44,700 at month 6 / 12 / 24 / 36. ARR at month 36 $536.4k | rulebook section 9.2 | T |
| pnl | Revenue year 1 / 2 / 3: $5,058 / $53,304 / $335,840. Year 3 gross margin 64.0 percent. Gross margin month 6 / 12 / 36: 43 / 31 / 65 percent | rulebook sections 9.2 to 9.3 | T |
| ebitda | Plan A (governed spend) EBITDA: year 1 -$97, year 2 +$12,824, year 3 +$127,900 | rulebook section 9.3 | T |
| capital | Pre-launch capital $3,628 = Foundation $225 + Pilot and launch prep $2,553 + Launch $850. Working buffer $1,500 | rulebook section 11.2, 9.5 | A |
| external | Outside money needed: Plan A about $4.2k (deepest gap, month 6). Plan B (accelerated hiring) about $27.9k | rulebook section 9.5 | T |
| timeline | Foundation Sep 2026 to Jun 2027, pilot Jul to Dec 2027, public launch month 1 = Jan 2028 (illustrative dates; launch is demand-gated) | rulebook section 11.1 | A |
| promise | Landing headline: "From a rough idea to a finished build, carried by one AI, start to finish." | screenshot `image.png` | V |

Never on the deck: "73 agents", any user count, any revenue, any named-competitor claim you have not verified, the promo film's stat chip.

---

## 4. Design system

Reuse `src/config/theme.ts` and the fonts already vendored in `public/fonts` (Sora, Inter). Do not retype colours. The deck is dark so it matches the real screenshots (do not mix light and dark).

| Token | Value |
|---|---|
| Canvas | 1920 x 1080. Content box starts at (96, 72), size 1728 x 920 |
| Ground | `NEUTRAL[950]` |
| Surface | `NEUTRAL[900]`, 1 px border `NEUTRAL[800]` |
| Text | `NEUTRAL[100]` primary, `NEUTRAL[400]` secondary |
| Accent | `ACCENT.base`, used for one thing per slide: the key word or the key number |
| Display numeral | Sora 800, 160 to 220 px |
| Headline | Sora 800, 76 px, 2 lines maximum |
| Subline | Inter 500, 40 px |
| Body and labels | Inter 500, 32 px (30 px is the floor) |
| Screenshot frame | 1 px `NEUTRAL[800]`, radius 16, shadow `0 24px 80px rgba(0,0,0,0.5)`, never stretched, never upscaled past 1.0 |
| Footer | Logo 40 px at left, "n / 15" at right, 30 px, `NEUTRAL[500]` |
| QR | White tile with 4-module quiet zone, 280 px square or larger, URL printed under it at 30 px |

Enforcement: a `Txt` component takes `size: "display" | "headline" | "sub" | "body"` only (no free `fontSize`), so nothing can go below 30 px by accident. `scripts/check-deck.mjs` also fails on any `fontSize` literal under 30 inside `src/deck/` (the `Shot` internals are exempt).

---

## 5. Screenshot catalogue

All files are in `public/screenshots/`. Do not edit or rename them. `src/deck/shots.ts` maps a semantic id to a file, its natural size and a crop box `{x, y, w, h}` in source pixels. Crops are code, so they can be re-tuned in the Studio with a grid overlay (`<Shot grid />`).

### 5.1 The 1920 x 1080 captures

The unnamed 1920 x 1080 captures (`image.png` excepted) show the Windows taskbar down the right edge and the browser bar across the top. A pixel scan on three of them found the browser bar ends at about y = 114 and the taskbar starts at about x = 1850. So the **safe base crop for every 1920 x 1080 capture is `{x: 0, y: 116, w: 1838, h: 964}`**. Verify it once in the Studio on each file you use. `image copy 10.png` is 1536 x 864 and has the browser bar but no taskbar: measure its top bar in the Studio.

### 5.2 Catalogue

| Id | File | What it shows | Use on | Notes |
|---|---|---|---|---|
| landing | `image.png` (1856 x 973) | Landing hero: "From a rough idea to a finished build, carried by one AI, start to finish." | 1, 3 | Clean, no crop. The real promise line. |
| splash | `image copy.png` | Logo glow loading screen | 1 | Crop to the logo and darken. It has tiny "initializing" text, so crop it out. |
| chat | `01-chat.png` (1857 x 971) | Tier 3 answer to the drone prompt, plus the Working Panel with the live routing graph | 2, 3, 7 | Crop the user prompt bubble for slide 2. Crop the routing graph for slide 7. Sidebar shows throwaway project names: exclude it. |
| chat_nav | `image copy 2.png` | Same chat with the full top nav (all 11 tabs) | 3 | Base crop, then use only the nav strip |
| notebooks | `02-notebooks.png` | Mind map plus generated workflows | 4 | |
| quiz | `image copy 4.png` | Notebook study mode: quiz | optional 4 | |
| research | `03-research.png` | Research sources list with search | 4 | |
| citations | `image copy 6.png` | Citation graph | optional 4 | |
| prd | `image copy 7.png` | The plant-monitor prompt and the generated PRD | 15 | The prompt text is the closing story |
| arch | `04-plan-architecture.png` | Architecture diagram (battery, converter, regulator, ESP32, sensors) | 4, 15 | |
| blueprint | `05-plan-blueprint.png` | 3D blueprint with the parts list | 4, 15 | Strongest Plan visual |
| build | `06-build.png` | Code editor | 5 | Do not imply this project is the plant monitor: it is a small `k.py` snippet |
| test | `image copy 11.png` | Test tab: personas | 5 | **Visible raw `<br>` text in the table on the right.** Use only the left persona list, or fix the bug and re-capture |
| growth | `image copy 12.png` | Growth: content fan-out to platforms | 5 | Clean |
| roles | `image copy 13.png` | Role Library with auto-generated role cards | 6 | Backs "59 agents, 46 roles" |
| tokens | `image copy 14.png` | Token Usage | **never** | Shows API key names and a zero-credit Free plan (rule H8) |
| research_chat | `image copy 5.png` | Research tab with chat | skip | Duplicate of `research` |

### 5.3 Optional re-capture pass (20 minutes, strongly recommended before D2)

The sidebars show throwaway project names ("rgjn", "sdfjk", "hjkl"), which look unprofessional at deck size. If you do not want to crop around them, re-capture in Chrome at 1600 x 900, dark theme, with a clean account whose projects are named "Plant monitor", "Drone", "Research notes". Capture: Chat (Tier 3 answer with the routing graph), Plan (blueprint), Research (sources), Build, Growth, Role Library. Keep the same file ids. Do not stage data: capture what the product really did.

---

## 6. Slide specs

Format: SSTTAPI part, headline (8 words or fewer), visual, word budget (all visible words except numerals and the footer), facts used, the line the founder says aloud (goes in speaker notes in `words.ts`, not on the slide).

**1. Cover** (opening)
- Headline: "From a rough idea to a finished build."
- Sub: "One AI workspace, start to finish."
- Visual: `splash` logo glow as the ground, MiniMe wordmark, QR (U3 if present, else Atlas) with the printed short URL.
- Small line (30 px): "Next Inc. Two founders. Rajshahi, Bangladesh."
- Words: 20. Facts: promise, company.
- Say: "We are building the AI that does not forget your project halfway through."

**2. Problem, the story** (Secret Sauce 1)
- Headline: "A chat answers once. A project takes months."
- Visual: the real drone prompt bubble from `chat`, very large, centred. A single line under it: "Then what?"
- Words: 14. Facts: none.
- Say: "This is a real prompt from our own product. The answer is good. The project is not done. Research, plan, build, test, launch: each needs the context again."
- This slide replaces the old text-heavy slide 2. No bullet list.

**3. Solution, the promise** (Secret Sauce 2, solution 1 of 4)
- Headline: "One AI carries it start to finish."
- Visual: `landing` or `chat` as the hero, with the nav strip from `chat_nav` above it, the seven lifecycle stage names in the strip marked in accent.
- Words: 12. Facts: promise, tabs.

**4. Solution, understand and plan** (solution 2 of 4)
- Headline: "Understand it. Plan it."
- Visual: two framed shots side by side: `research` (left), `blueprint` (right, larger). One arrow drawn as SVG between them. Two labels, 30 px: "Research", "Plan".
- Words: 10.

**5. Solution, build, test, grow** (solution 3 of 4)
- Headline: "Build it. Test it. Grow it."
- Visual: three framed shots in a row: `build`, `test` (left persona list only), `growth`. Three labels.
- Words: 10.

**6. Solution, the team inside** (solution 4 of 4)
- Headline: "A whole team, routed by effort."
- Visual: `roles` large on the left. On the right two display numerals: "59" agents, "46" roles. Beneath, four small labels: Instant, Direct, Fixed, Adaptive.
- Words: 14. Facts: agents, routing.

**7. Process, how one task flows** (Secret Sauce, process)
- Headline: "Ask. Route. Work. Remember."
- Visual: the routing graph crop from `chat` (Working Panel), very large, with four numbered pins using `mapPoint`: 1 Ask, 2 Route (tier chosen), 3 Specialists work and recheck, 4 Saved to the workspace.
- Words: 18. Facts: routing.
- Say: "We route by effort so simple questions stay instant and cheap, and hard ones get a team."

**8. Business model and pricing** (Secret Sauce 3 and 4)
- Headline: "Free to start. Four plans."
- Visual: four columns, each with a display numeral: $0, $9, $29, $79 per month, and below it the BDT price (899, 2,999, 8,499). One accent line: "Local BDT pricing."
- Label (30 px): "Launch plan, not live yet." Facts: plans (status A).
- Words: 14.

**9. Competition, secret sauce and AI-proof** (Secret Sauce 5, 6, 7)
- Headline: "Not another chat box."
- Visual: a two-axis map drawn in SVG. X axis: "one answer" to "whole project". Y axis: "forgets" to "remembers". Category dots only (chat assistants, code agents, app builders, note and research tools) unless U11 supplies verified names. MiniMe sits top right. Corner label: "Our view."
- Under it, two lines: "Secret sauce: memory + routing + the full lifecycle." "Models improve. We route to them. The workspace is the product."
- Words: 25. Honest note for the founders: the moat is early. The defensible part is the persistent workspace and routing, not any one model.

**10. Scalability, market and why now** (Scalability 1)
- Headline: "Start in Bangladesh. Then everywhere."
- Visual: three nested rings (beachhead, region, world). Beachhead label: "Student and indie builders, paying in BDT." Numbers only from U5.
- Why now, one line: "Models are cheap enough that a free tier is affordable." Fact: free_cost (status A).
- If U5 is empty: drop the numbers and the "why now" figure, keep the three rings and labels.
- Words: 20.

**11. Team** (Team)
- Headline: "Two builders. One product."
- Visual: two photos (U1, your own), name, role and one-line why-us each. A strip below: "Cap table: 100% founders." and advisors (U6) or "Seeking: product and pricing mentors."
- Words: 25. Slide 11 cannot export without U1.

**12. Traction, honest** (Traction)
- Headline: "Built before we sell."
- Visual: a mosaic of three small real shots (`chat`, `blueprint`, `build`) and a row of display numerals: "11" tabs, "59" agents, "3" products. Badge: "Pre-launch". QR to the live app (U3) or the Atlas, with the printed URL.
- Add U7 and U8 items only if you supplied them.
- Words: 16. Facts: tabs, agents, products.

**13. Projection** (Projection, financial and impact)
- Headline: "A small start, then compounding."
- Visual: SVG bars for monthly revenue at month 6, 12, 36 ($307, $920, $44,700), with the month 24 value as a smaller bar ($8,235). Under each bar: paid users (40, 120, 2,720) and registered builders (1,200, 6,500, 95,000). Label in 30 px: "Targets, not forecasts."
- Words: 14. Facts: mrr, funnel (status T). Do not show an exit slide: the repo has no exit plan.

**14. Ask** (Ask)
- Headline: "What we need now."
- Visual, left: a stacked bar of the $3,628 pre-launch capital (Foundation $225, Pilot and launch prep $2,553, Launch $850). Right: "From the Sprint:" then three words, "Mentors. Pilot users. Pricing feedback." (U12 if you changed them). Bottom line: "Plan A self-funds after about $4.2k. Grant / seed-fund pilot planned for Apr 2027."
- Words: 22. Facts: capital, external, timeline.
- Note: the Sprint is free and takes no equity. This is not a funding ask to INSEAD. The capital is the cost of getting to launch.

**15. Impact and close, the story ends** (Impact)
- Headline: "Idea in. Build plan out."
- Visual: a three-step strip of real shots from the same plant-monitor project: the prompt (`prd`), the architecture (`arch`), the 3D blueprint (`blueprint`). Below: QR codes with printed URLs for the Atlas and the live app (if U3), plus the contact email (U2) and founder LinkedIns (U1).
- Goal line (target, not achieved): "Goal: 1,200 builders in 6 months."
- Words: 20. Do not claim impact that has not happened.

---

## 7. Code conventions

Carry over everything in `docs/PATCH_NOTES.md` (frame math, `STAGE`, no `Math.random`, no `Date`, no network at render, colours from `theme.ts`). Deck-specific:

```
src/deck/theme.ts        deck tokens and sizes from section 4
src/deck/Txt.tsx         typography components (size presets only)
src/deck/kit.tsx         Slide shell, Footer, Pin, Numeral, Badge
src/deck/Shot.tsx        framed, cropped screenshot (+ grid overlay)
src/deck/shots.ts        id -> file, natural size, crop box (section 5)
src/deck/Qr.tsx          QR drawn as SVG rects from the `qrcode` package
src/deck/facts.ts        every number, with source and status (section 3)
src/deck/words.ts        every string, per slide, plus speaker notes
src/deck/data/inputs.ts  the open items U1..U12 (section 2)
src/deck/slides/S01.tsx .. S15.tsx
src/deck/Deck.tsx        picks the slide for the current frame (BUILT map)
scripts/make-deck.mjs    renders out/deck/NN.jpg and out/deck/MiniMe-deck.pdf
scripts/check-deck.mjs   the checks in section 10
```

- **Slide N is frame N-1.** `Deck.tsx` has a `BUILT` map. An unbuilt slide shows a `Pending` frame in the Studio and is skipped by the export, so it never reaches the PDF.
- **Numbers** are read from `facts.ts`, **text** from `words.ts`. Slides never contain a typed number or sentence.
- **Pins** use `mapPoint(appPoint, shot)` from `Shot.tsx`, so they follow the picture if it is re-cropped.
- **A slide that needs an open item** (section 2) and does not have it is skipped by the export with a line naming the item, the same way the MiniLocker script skipped slide 9 without its screenshot.
- `package.json` scripts: `"deck": "node scripts/make-deck.mjs"`, `"deck:check": "node scripts/check-deck.mjs"`. New dependencies: `@remotion/bundler`, `@remotion/renderer` (same version as `remotion`, 4.0.539), `pdf-lib`, `qrcode`. Pin exact versions.
- Register the composition in `src/Root.tsx` next to the film: `<Composition id="MiniMeDeck" component={Deck} durationInFrames={15} fps={30} width={1920} height={1080} />`. Leave the two film compositions untouched.

---

## 8. Patch plan

| Patch | Slides | New code | Needs from you | Status |
|---|---|---|---|---|
| D0 | none (scaffold) | theme, `Txt`, kit, `Shot`, `shots.ts`, `Qr`, `facts.ts`, `words.ts`, `inputs.ts`, `Deck.tsx` with all 15 pending, `make-deck.mjs`, `check-deck.mjs`, composition | Nothing. Fill section 2 any time | |
| D1 | 1 cover, 2 problem | `Qr` proof, hero text layout | U3/U4 (QR target) | |
| D2 | 3, 4, 5, 6, 7 | multi-shot layouts, `Pin` routing slide, numerals | Optional re-capture (5.3) | |
| D3 | 8, 9, 10 | pricing columns, positioning map, ring diagram | U5, U11 (optional) | |
| D4 | 11, 12, 13 | team layout, traction mosaic, bar chart | **U1 (required)**, U6 to U8 | |
| D5 | 14, 15, then QA and export | stacked bar, closing strip, PDF size guard, link annotations | U2, U10, U12 | |

---

## 9. Patch prompts (paste into Claude Code or Copilot in the repo)

Start every prompt with: "Read `docs/PATCH_NOTES.md` and `docs/guide/PITCH_DECK_PATCHES.md` first. Follow both. Append an entry to `docs/PATCH_NOTES.md` when done."

### D0 prompt: scaffold

> Create the deck scaffold described in sections 4, 5, 7 and 3 of the guide. Add `src/deck/theme.ts` (tokens from section 4, importing colours from `src/config/theme.ts`), `Txt.tsx` (sizes `display`, `headline`, `sub`, `body` only; no free font size; body is 32 px), `kit.tsx` (Slide shell on a 1728x920 content box at (96,72), Footer with the logo and "n / 15", Pin, Numeral, Badge), `Shot.tsx` (framed screenshot using `staticFile` with `encodeURI` for filenames that contain spaces; props `id`, `width`, optional `crop` override, optional `grid`; applies the crop from `shots.ts` with CSS only; exposes `mapPoint`), `shots.ts` (the catalogue in 5.2 with the base crop `{x:0,y:116,w:1838,h:964}` for the 1920x1080 captures; set the natural sizes by reading the files), `Qr.tsx` (use `qrcode` `QRCode.create(text).modules`, draw white tile plus dark modules as SVG rects, 4-module quiet zone, error correction M), `facts.ts` (every row of section 3 as `{id, value, source, status}` with typed accessors; a missing id throws), `words.ts` (per slide: headline, lines, notes; export a `wordCount(slide)` helper), `data/inputs.ts` (U1..U12, all `null`). Add `Deck.tsx` with a `BUILT` map (empty) and a `Pending` frame, and register `MiniMeDeck` (15 frames, 1920x1080, 30 fps) in `Root.tsx`. Write `scripts/make-deck.mjs` modelled on `minilocker-film/scripts/make-deck.mjs` but: render JPEG stills (`imageFormat: "jpeg"`, `jpegQuality: 90`), embed with `pdf.embedJpg`, step quality 90 to 82 to 75 until the PDF is 9.0 MB or less, print the size, skip unbuilt slides and slides whose open item (section 2) is missing, support `--only=3,5`, `--scale=2`, `--png`. Write `scripts/check-deck.mjs` with the checks in section 10. Add the two npm scripts. Do not build any slide yet. Show a screenshot-grid still of `chat_nav` and `chat` proving the base crop removes the taskbar and browser bar.

### D1 prompt: slides 1 and 2

> Build slides 1 and 2 per section 6. Slide 1: `splash` as the ground (crop to the logo, darken to 35 percent), wordmark, the headline and sub from `words.ts`, a 280 px QR with its printed URL (use `inputs.liveUrl ?? facts.atlasUrl`), and the small company line. Slide 2: the drone prompt bubble from `chat` cropped and enlarged as the whole slide, "Then what?" in accent under it. No bullets, 14 words at most. Add both to `BUILT`. Run `npm run deck:check` and `npm run deck`. Report the PDF size and the word counts.

### D2 prompt: slides 3 to 7

> Build slides 3 to 7 per section 6. Use the shot ids from section 5.2 and tune crops in the Studio grid so no sidebar with throwaway project names is visible unless I have re-captured. Slide 6 numerals come from `facts.agents`. Slide 7 uses `mapPoint` pins 1 to 4 on the routing-graph crop; place the pins by reading coordinates off the grid. Slide 5's `test` shot must use only the left persona list (the right-hand table shows raw `<br>` text). Keep every slide at or under its word budget and above 30 px text. Add to `BUILT`, run check and deck.

### D3 prompt: slides 8 to 10

> Build slides 8, 9 and 10 per section 6. Slide 8: four columns from `facts.plans`, with the label "Launch plan, not live yet." in 30 px. Slide 9: an SVG two-axis map with category dots only, corner label "Our view", the two lines under it from `words.ts`; if `inputs.competitors` (U11) is set, label the dots with those names. Slide 10: three-ring SVG; if `inputs.market` (U5) is null, omit every number and the "why now" figure, otherwise show each number with its source in 30 px. Add to `BUILT`.

### D4 prompt: slides 11 to 13

> Build slides 11, 12 and 13 per section 6. Slide 11 requires `inputs.founders` (U1); if it is null the slide must be skipped by the export with a message. Use the founders' own photos from `public/deck/people/` (I will add them), circular crop, 280 px. Show "Cap table: 100% founders" unless `inputs.split` (U9) is set. Slide 12: mosaic of three small shots, numerals "11", "59", "3" from `facts`, a "Pre-launch" badge, QR as on slide 1; add U7 and U8 items only if present. Slide 13: SVG bars from `facts.mrr` at month 6, 12, 36 plus a smaller month-24 bar, paid users and registered users under each bar from `facts.funnel`, the label "Targets, not forecasts." in 30 px. No exit slide.

### D5 prompt: slides 14, 15 and export

> Build slides 14 and 15 per section 6. Slide 14: stacked bar of `facts.capital` parts (225, 2,553, 850) with a total of $3,628, the three "From the Sprint" words from `inputs.sprintAsk ?? defaults`, the bottom line from `words.ts`. Slide 15: three-step strip of `prd`, `arch`, `blueprint`; QR codes for the Atlas and (if set) the live app; contact email and founder LinkedIns from `inputs`; the goal line labelled as a goal. Then finish the export: add pdf-lib link annotations over each QR and printed URL (a `LINKS` map of slide, rect, url) so the links are also clickable in a PDF viewer, keep the flat JPEG pages. Run `npm run deck:check` and `npm run deck`, then fix anything that fails. Output the final PDF size, page count, and the word count per slide.

---

## 10. Checks (`npm run deck:check`) and final QA

The script fails (non-zero exit) on any of these:

- More than 15 slides, or a built slide missing from the composition.
- Any `fontSize` literal below 30 inside `src/deck/` outside `Shot.tsx`.
- Any slide over its word budget from section 6, or a headline over 8 words.
- Any number rendered by a slide that is not read from `facts.ts` (grep for digits in `slides/*.tsx` outside imports and layout constants).
- Any `facts.ts` row without a `source` or a `status`.
- A banned word (rule H6) anywhere in `words.ts`.
- Any built slide that references `tokens` (`image copy 14.png`) or the promo film's stat chip.
- A `null` open item used by a built slide (the slide must be skipped, never rendered with a hole).
- After `npm run deck`: PDF larger than 9.0 MB, page count not equal to the built count, page size not 1920 x 1080.

Final human QA, in this order:

- [ ] Open the PDF at 100 percent and page through it once without reading: can you say what each slide is about in two seconds?
- [ ] Slide 2 is a picture and one line, not a paragraph.
- [ ] Every number matches `facts.ts` and is labelled target or plan where it is one.
- [ ] No "73 agents" anywhere, and the form's elevator pitch and product description say 59 too.
- [ ] No sidebar with throwaway project names, no personal name in the top bar unless you want it there, no API key names.
- [ ] Scan each QR with a phone, off the screen and off a printout.
- [ ] Both founders have read every slide and can answer a question about any number on it.
- [ ] Upload the PDF to the form and wait for the success message (the form already failed once on submit; if it fails again use the HubSpot direct form, or email aiventurelab@insead.edu).
