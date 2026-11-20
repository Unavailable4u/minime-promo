# MiniMe pitch deck: build guide and patch plan (v2)

Drop this file into `docs/guide/PITCH_DECK_PATCHES.md` of `minime-promo`. **v2 replaces v1** (15 dark crimson slides, 30 px floor, five-word slides). v1 was reviewed and rejected: too little design, too little information.

Goal: an **11-slide**, 16:9 PDF, 10 MB or less, for the INSEAD AI Founder Sprint form (field "Pitch Deck": PDF or PPTX, max 10 MB). Applications close 1 Dec 2026, 11:59 pm GMT+8. Eleven is under twelve, the same length class as the MiniLocker deck.

The deck is built as code inside this repo: one Remotion composition, `MiniMeDeck`, where frame N-1 is slide N. A script renders the stills and joins them into one PDF.

---

## 0. How to use this file

1. Read sections 1 to 3 once: the rules, the open items only the founders can fill, and the facts sheet.
2. Fill the open items in section 2 (`src/deck/data/inputs.ts`). A `null` item has a default; a placeholder never reaches the PDF.
3. Apply patches D0 to D5 in order (section 8). Every patch leaves a valid, exportable deck.
4. To get a patch, paste its prompt from section 9 into Claude Code or Copilot in this repo, or ask Claude: "generate patch D2".
5. After each patch, append an entry to `docs/PATCH_NOTES.md` and update the status column in section 8.

If time runs out, the 8-slide cut is: 1, 2, 3, 4, 6, 7, 9, 11.

---

## 1. Rules

These come from the SSTTAPI framework (Adnan Dewan), the founders' verdicts on the MiniLocker deck, the five reference templates reviewed in D1 (a history project, a red and white corporate deck, a dark gold leadership deck, a law-firm deck, a business deck), and the form limits.

### 1.1 Hard rules (the scripts enforce most of them)

| # | Rule | Source |
|---|---|---|
| R1 | **11 slides**, fewer than twelve. `TOTAL_SLIDES` in `src/deck/rules.ts`. | founders (v2) |
| R2 | Minimum text size **22 px** on the 1920x1080 canvas: body 32, mono captions 22. Text inside a real screenshot is exempt (it is a picture). | v2 (v1 said 30 and made the slides empty) |
| R3 | Two typefaces: **Newsreader** (serif: headlines, body, numerals, italic sublines) and **JetBrains Mono** (labels, captions, code). No third face. | v2 |
| R4 | Neutral ink and paper, **one accent** (crimson) for the key word or number of a slide, **one data colour** (cobalt) for measured or positive numbers. Status colours appear only inside screenshots. The deck does not have to look like the MiniMe app: the screenshots bring that. | v2 |
| R5 | Image first, and **informative**: each slide's main area is a real screenshot or one clean data graphic, annotated with numbered pins and short captions, next to the facts that explain it (see the MiniLocker deck). Not five words on a black slide. | SSTTAPI + founders (v2) |
| R6 | Not an icon gallery. At most 3 icons in the whole deck. No emoji art. | SSTTAPI |
| R7 | No web images, no stock, no "foreign" images. Only the founders' own screenshots and photos. | SSTTAPI |
| R8 | Start with a story and end with it: slide 2 opens it, slide 11 closes it. Slides 1 and 11 are on ink, the rest on paper (bookends). | SSTTAPI |
| R9 | Word budget per slide (section 6), counted by `scripts/check-deck.mjs` from `src/deck/words.ts`. Headline 12 words or fewer, two lines at most. | founders |
| R10 | Secret Sauce block (slides 2 to 6): 1 problem slide, 3 solution slides (3 to 5), 1 process slide (6). Business model, competition and market, team, traction and projection, and the ask follow (7 to 11). | founders' verdicts 2 and 3 |
| R11 | Links are QR codes plus a short printed URL. QR on slides 1 and 11, pointing to the **company website**. | founders |
| R12 | The PDF is 10 MB or less. The script embeds JPEG pages and steps quality down until it is at most 9.0 MB. | form |

### 1.2 Honesty rules

These exist because a reviewer can click, ask, or compare. A smaller true deck beats a bigger one that cracks in the interview.

- **H1. Every number lives in `src/deck/facts.ts` with a `source` string and a `status`:** `V` (verified in the repo or the book), `T` (target, unvalidated), `A` (assumption). A slide shows a `T` or `A` number only with a word beside it that says so ("target", "plan"). Slides never type numbers directly.
- **H2. No invented numbers.** Market size, user counts, testimonials, revenue, waitlist numbers: only if you supply them with a source (section 2). Otherwise the slide drops that element.
- **H3. Only real screenshots.** No mock-ups, no re-drawn UI. The promo film is a fictional animation, so nothing from it goes in this deck, including its stat chip "7 specialists, 1 recheck, 41.2 s" (scripted, not measured).
- **H4. State plainly: pre-revenue, pre-launch.** Traction shows what exists (the built product), not users or revenue you do not have.
- **H5. Competitors by category only,** unless you have personally verified a named product's claim (section 2, U11). The map is labelled "our view".
- **H6. Never write:** "revolutionary", "first ever", "10x", "guaranteed", "unlimited", "secure", "unhackable", "AI-proof". The AI-proof question gets an honest answer (slide 8), not a boast.
- **H7. Two founders.** The financial book was written for a solo founder. Anything that says "1 (you)" in the book becomes "2 founders" on the deck.
- **H8. Privacy.** Do not use screenshots that show API key names or account credentials (see `image copy 14.png`, section 5). Crop out any personal name in the top bar if you want it private.

### 1.3 Known corrections (apply to the form too)

- **"73 specialized agents" is wrong.** The feature guide says 73 Python modules in `backend/agents/`, of which **59 are specialist agent modules** and 14 are package or support modules, mapped across **46 router roles**. Say "59 specialist agents, 46 roles". If you pasted "73 agents" into the application form (elevator pitch or product description), change it to 59 before you submit.
- The form's tech-stack answer mentions eight LLM providers. The rulebook describes eight providers in the planned production stack, and part of that is not yet paid or in production. Say "multi-provider routing" on the deck, not a provider count.


---

## 2. Open items only you can fill

Put the answers in `src/deck/data/inputs.ts`. A slide that needs a `null` item uses the default in the last column.

| Id | What | Used on | If left empty |
|---|---|---|---|
| U1 | Both founders: name, role, one-line "why us", LinkedIn, **own photo**. **Status: names, roles, photos and LinkedIn URLs are filled; "why us" is still `null`.** | 1, 9, 11 | Slide 9 cannot be built (the export skips it). A `null` "why us" is left out. |
| U2 | Contact email | 11 | Omitted |
| U3 | Live app URL, if anyone outside your machine can use it today. **MiniMe is not deployed yet: `null`.** | 1, 10, 11 | QR points to the company website, and slide 10 says "pre-launch" |
| U4 | The company website: `https://www.wearenext.tech/` (printed `wearenext.tech`). The MiniMe Atlas / `minimebook` site and repo are **not linked anywhere in the deck.** | 1, 11 | Known value |
| U5 | Market numbers, each with a source you can name (students, developers or startups in Bangladesh and South Asia) | 8 | The three rings show without numbers |
| U6 | Advisors or mentors, if any | 9 | "Seeking: product and pricing mentors" |
| U7 | Real testers, quotes, waitlist count, anything a user actually did | 10 | Omitted |
| U8 | Awards, grants, hackathons, publications (the FBEBC preprint is planned, not published) | 10 | Omitted |
| U9 | Equity split between the two founders | 9 | Shows "100% founders" only |
| U10 | The name of the "Seed Fund" in the rulebook (it is unnamed there) | 11 | "Grant / seed-fund pilot (application Apr 2027)" |
| U11 | Competitors you have personally verified, with one true sentence each | 8 | Category dots only |
| U12 | What you want from the Sprint | 11 | Mentors, pilot users, pricing feedback |
| U13 | **New in v2.** One short line per routing tier (what Instant, Direct, Fixed and Adaptive each do), confirmed by the founders | 6 | Tier names only |

---

## 3. Facts sheet (becomes `src/deck/facts.ts`)

Sources are files in the `minime_book` repo unless noted. (The Atlas site and repo are internal sources only: they are never linked on the deck.) `V` = verified there, `T` = target, `A` = assumption.

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

---

## 4. Design system (v2)

Colours, type and spacing live in `src/deck/theme.ts` (not in the film's theme). Slides never type a hex or a font size.

| Token | Value |
|---|---|
| Canvas | 1920 x 1080. Content box starts at (96, 72), size 1728 x 920. Footer rule at y = 1016. |
| Paper page | `#F2EFE8` with a 48 px grid at 4.5 percent and two soft washes (crimson top left, cobalt top right) |
| Ink page (cover and close) | `#0D0D11` |
| Card | `#FBF9F4` on paper (`#17171D` on ink), hairline `#DCD5C6`, radius 18, soft shadow |
| Text (paper) | ink `#15161B`, secondary `#4B4B53`, muted `#7C7B80` |
| Accent | crimson `#D4143F` on paper, `#FF4A6B` on ink: one thing per slide (the key word or number) |
| Data colour | cobalt `#2447D6` on paper, `#7C9BFF` on ink: measured or positive numbers |
| Cover title | Newsreader 124 px |
| Display numeral | Newsreader 132 px, light, with a smaller italic "of N" when needed |
| Headline | Newsreader 80 px, two lines at most |
| Subline | Newsreader italic 42 px |
| Body | Newsreader 32 px |
| Label | JetBrains Mono 500, 24 px, caps, letter-spaced (section tags, column heads) |
| Caption | JetBrains Mono 22 px (captions, units, short labels). 22 px is the floor. |
| Section tag | "§ NN · tag" in the accent, top left (NN = slide number minus 1) |
| Footer | hairline, "Next Inc · MiniMe · Pitch deck" left, "n / 11" right, mono 22 px |
| Screenshot frame | hairline, radius 14, soft shadow; never stretched; never upscaled past 1.0 unless `maxScale` is raised on purpose |
| Pin | 56 px crimson circle, white mono numeral, white ring; the label chip sits beside it in the blank area, never on top of screenshot text |
| QR | White tile, 4-module quiet zone, 280 px or larger, URL printed under it |

What was taken from the five reference templates: large light numerals and KPI tiles (red and white deck), dark bookend slides (gold leadership deck), image-led split layouts and numbered lists (law-firm and business decks), a warm paper ground with a classic serif (history deck). From the MiniLocker deck: section tags, italic sublines, annotated screenshots, pills, and slides that explain themselves.

Enforcement: `Txt` takes `size` from eight presets only (no free `fontSize`, family, weight or colour in `style`). `scripts/check-deck.mjs` also fails on any `fontSize` literal under 22 inside `src/deck/` (the `Shot` internals are exempt). Fonts: Newsreader is vendored in `public/fonts/` (SIL Open Font License, from the `@fontsource/newsreader` package) and loaded by `src/deck/deckFonts.tsx`; rendering stays offline.

---

## 5. Screenshot catalogue

All files are in `public/screenshots/`. Do not edit or rename them. `src/deck/shots.ts` maps a semantic id to a file, its natural size and a crop box `{x, y, w, h}` in source pixels; named crops used by slides are in `CROPS`. Crops are code, so they can be re-tuned in the Studio with a grid overlay (`<Shot grid />`).

### 5.1 The 1920 x 1080 captures

The unnamed 1920 x 1080 captures show the Windows taskbar down the right edge and the browser bar across the top. A pixel scan of all thirteen found the browser bar ends at y = 109 and the taskbar starts at x = 1860. The **safe base crop is `{x: 0, y: 116, w: 1838, h: 964}`**; `DeckDevCrop` (`npx remotion still src/index.ts DeckDevCrop out/deck-crop-proof.png`) shows it.

### 5.2 Catalogue

| Id | File | What it shows | Use on | Notes |
|---|---|---|---|---|
| landing | `image.png` (1856 x 973) | Landing hero: "From a rough idea to a finished build, carried by one AI, start to finish." | 3 | Clean, no crop. The real promise line. |
| splash | `image copy.png` | Logo glow loading screen | 1 | Slide 1 uses `CROPS.splashLogo` (logo and glow; the tiny "initializing" text is outside the crop) on the ink cover. |
| chat | `01-chat.png` (1857 x 971) | Tier 3 answer to the drone prompt, plus the Working Panel with the live routing graph | 2, 6 | Slide 2 uses `CROPS.chatExchange` (the prompt bubble and the top of the answer, at about 1.0x). Slide 6 crops the routing graph in the Working Panel. Sidebar shows throwaway project names: exclude it. |
| chat_nav | `image copy 2.png` | Same chat with the full top nav (all 11 tabs) | 3 | Base crop, then use only the nav strip |
| notebooks | `02-notebooks.png` | Mind map plus generated workflows | 3 | |
| quiz | `image copy 4.png` | Notebook study mode: quiz | optional 4 | |
| research | `03-research.png` | Research sources list with search | 4 | |
| citations | `image copy 6.png` | Citation graph | optional 4 | |
| prd | `image copy 7.png` | The plant-monitor prompt and the generated PRD | 4, 11 | The plant-monitor prompt and PRD (slides 4 and 11) |
| arch | `04-plan-architecture.png` | Architecture diagram (battery, converter, regulator, ESP32, sensors) | 4, 11 | |
| blueprint | `05-plan-blueprint.png` | 3D blueprint with the parts list | 4, 10, 11 | Strongest Plan visual |
| build | `06-build.png` | Code editor | 5 | Do not imply this project is the plant monitor: it is a small `k.py` snippet |
| test | `image copy 11.png` | Test tab: personas | 5 | **Visible raw `<br>` text in the table on the right.** Use only the left persona list, or fix the bug and re-capture |
| growth | `image copy 12.png` | Growth: content fan-out to platforms | 5 | Clean |
| roles | `image copy 13.png` | Role Library with auto-generated role cards | 6 | Backs "59 agents, 46 roles" |
| tokens | `image copy 14.png` | Token Usage | **never** | Shows API key names and a zero-credit Free plan (rule H8) |
| research_chat | `image copy 5.png` | Research tab with chat | skip | Duplicate of `research` |


### 5.3 Optional re-capture pass (20 minutes, strongly recommended before D2)

The sidebars show throwaway project names ("rgjn", "sdfjk", "hjkl"), which look unprofessional at deck size. If you do not want to crop around them, re-capture in Chrome at 1600 x 900, dark theme, with a clean account whose projects are named "Plant monitor", "Drone", "Research notes". Capture: Chat (Tier 3 answer with the routing graph), Plan (blueprint), Research (sources), Build, Growth, Role Library. Keep the same file ids. Do not stage data: capture what the product really did.

---

---

## 6. Slide specs (11 slides)

Format: section, headline (12 words or fewer), layout, what is on it, word budget (headline + lines + labels; section tags, axis and plan names do not count), facts used, the line the founder says aloud (speaker notes in `words.ts`, never on the slide). Every slide is dense on purpose: a real screenshot with pins and captions, plus the facts that explain it.

### Slide 1. Cover (ink) · built in D1
- **Headline:** "From a rough idea to a finished build." Subline (italic): "One AI workspace, start to finish." Pill: "Pre-launch".
- **Layout:** wordmark top left, "Next Inc · Pre-Seed · Rajshahi, Bangladesh" top right (mono); real splash logo glow on the right; four serif numerals (11 workspace tabs, 59 specialist agents, 46 agent roles, 4 routing tiers) with mono captions; founders' names and roles; QR tile bottom right with the printed URL (`inputs.liveUrl ?? inputs.companyUrl`).
- **Budget:** 40. **Facts:** company, tabs, agents, routing. **Say:** "We are building the AI that does not forget your project halfway through."

### Slide 2. Problem, the story (paper) · built in D1
- **Headline:** "A chat answers once. A project takes months." Italic subline: "A real prompt from our own product. The answer is good. The project is not done."
- **Layout:** left, the real drone prompt and the top of the real Tier 3 answer (`CROPS.chatExchange`, about 1.0x, fading out at the bottom) with pins 1 "Real prompt" and 2 "Real answer"; right, five cards (research, plan, build, test, launch) under "What the project still needs", the line "Each step needs the context again.", and "Then what?" in the accent.
- **Budget:** 70. **Say:** "This is a real prompt from our own product. The answer is good. The project is not done. Research, plan, build, test, launch: each needs the context again."

### Slide 3. Solution 1 of 3, the promise (paper) · D2
- **Headline:** "One AI carries it start to finish."
- **Layout:** left, the real landing hero (`landing`, with its own promise line); under it the nav strip of `chat_nav` cropped to the tab row with the seven stage names marked (facts.stages) and four pins (Chat; Notebooks; Research and Plan; Build, Test and Growth) explained by a legend on the right; numerals 11 tabs and 7 stages. The `notebooks` shot appears small next to pin 2.
- **Budget:** 60. **Facts:** tabs, stages, promise.

### Slide 4. Solution 2 of 3, idea to plan (paper) · D2
- **Headline:** "One prompt becomes a PRD, an architecture and a 3D blueprint."
- **Layout:** the same real project (battery-powered plant soil-moisture monitor) in four framed shots: `prd` (the generated PRD itself: the parts table in the Plan tab; the prompt is not in this shot), `arch` (architecture diagram), `blueprint` (3D blueprint and parts list), `research` (sources, searchable), each with a mono caption and one pin; a chevron path "Prompt, PRD, Architecture, Blueprint" along the top.
- **Budget:** 60.

### Slide 5. Solution 3 of 3, build, test, grow (paper) · D2
- **Headline:** "Then build it, test it with personas, and grow it."
- **Layout:** three columns, one framed shot each: `build` (code editor; do not imply it is the plant monitor), `test` (persona list only, crop away the table with raw `<br>`), `growth` (content fan-out to platforms), each with a mono column head, a caption and a pin.
- **Budget:** 60.

### Slide 6. Process, how one task flows (paper) · D3
- **Headline:** "We route by effort, so hard tasks get a team."
- **Layout:** left, the real live routing graph from the Working Panel of `chat` with pins 1 Ask, 2 Route (tier chosen), 3 Specialists work and recheck, 4 Saved to the workspace; right, four tier cards (facts.routing names, `inputs.tierNotes` lines when U13 is set), two serif numerals (59 specialist agents, 46 roles) and a small `roles` shot.
- **Budget:** 75. **Say:** "We route by effort so simple questions stay instant and cheap, and hard ones get a team."

### Slide 7. Business model and pricing (paper) · D3
- **Headline:** "Free to start, four plans, priced in BDT."
- **Layout:** four plan cards (Free, Basic, Moderate, Ultimate) with serif USD numerals and BDT prices (facts.plans); under them a bar chart of gross profit per paid user per month (facts.gp) with the word "plan"; three data tiles: about 75 percent gross margin, about 36 Basic users to cover lean infrastructure and the free tier, about $0.13 a month per free user; footnote "Launch plan, not live yet. Figures are assumptions, not results."
- **Budget:** 75. **H1:** every number here is status A: the word "plan" stays beside it.

### Slide 8. Competition, why now, market (paper) · D3
- **Headline:** "Not another chat box: a workspace that carries the project."
- **Layout:** left, a 2x2 positioning map (one answer to whole project; forgets to remembers) with four category dots (chat assistants, code agents, app builders, note and research tools) and MiniMe in the accent, captioned "Our view."; right, three nested rings (Student and indie builders paying in BDT; South Asia; World) with U5 numbers and sources only if supplied; bottom, the secret sauce (memory + routing + the full lifecycle), "Models improve. We route to them. The workspace is the product." and the why-now line.
- **Budget:** 80. **Honest note (speaker):** the moat is early; the defensible part is the persistent workspace and routing, not any one model.

### Slide 9. Team (paper) · D4 · needs U1
- **Headline:** "Two builders, three products, one account."
- **Layout:** two large founder cards (own photo, name in serif 48, role in mono, why-us line and printed LinkedIn path), then three product cards (MiniMe web workspace, M2C coding agent for terminal and editor, Menux personal automation agent); a strip with "Cap table: 100% founders." and "Seeking: product and pricing mentors." (or U6, U9).
- **Budget:** 65.

### Slide 10. Traction and projection (paper) · D4
- **Headline:** "Built before we sell, with targets we can test."
- **Layout:** left, "What exists today": a mosaic of real shots (`blueprint`, `roles`, `build`) and numerals (11 tabs, 59 specialist agents, 3 products) with the "Pre-launch" pill; U7 and U8 only if supplied. Right, "Targets, unvalidated": bars for MRR at months 6, 12, 24 and 36 (facts.mrr) with paid users and registered builders under each month (facts.funnel); "Targets, not forecasts."
- **Budget:** 75. **H4:** no user or revenue claim anywhere.

### Slide 11. Ask and close (ink) · D4
- **Headline:** "Idea in, build plan out. Help us reach launch."
- **Layout:** left, "From the Sprint:" mentors, pilot users, pricing feedback (U12); the pre-launch capital as a stacked bar (facts.capital: Foundation, Pilot and launch prep, Launch) with "Plan A self-funds after about $4.2k. Grant / seed-fund pilot planned for Apr 2027."; middle, the closing story: three small shots (`prd`, `arch`, `blueprint`) joined by arrows; the goal line "Goal: 1,200 builders in 6 months."; right, QR tile with the printed website URL, LinkedIn paths, email if U2.
- **Budget:** 85. **Say:** "The Sprint is free and takes no equity. This is not a funding ask to INSEAD. The capital is the cost of getting to launch."

---

## 7. Code conventions

- Everything lives in `src/deck/`. One slide per file in `src/deck/slides/SNN.tsx`, registered in the `BUILT` block of `Deck.tsx` (one `N: SNN,` per line between the marker comments).
- Text comes from `words.ts` (`text(n)`), numbers from `facts.ts` (`facts.x.value...`, or a `{fact.path}` token inside `words.ts`), people and links from `data/inputs.ts`, crops from `shots.ts`. No sentence and no number is typed in a slide file.
- `Slide` sets the theme (`paper` or `ink`), the ground, the section tag and the footer. `Txt` follows the theme. `Shot`, `Pin`, `Card`, `Stat`, `Pill`, `Qr` and `QrBlock` are the building blocks; add new ones to `kit.tsx`.
- Pins go in the blank area beside the thing they mark, placed with `mapPoint()` so they follow the crop.
- Data modules (`rules.ts`, `facts.ts`, `words.ts`, `shots.ts`, `data/inputs.ts`) stay React-free and import only each other, because the scripts load them in plain Node.

---

## 8. Patch plan

| Patch | Slides | What it adds | Needs from you | Status |
|---|---|---|---|---|
| D0 | none | scaffold, scripts, composition | nothing | **Done** |
| D1 | 1 cover, 2 problem | **v2 reset:** new design system (paper and ink, Newsreader and JetBrains Mono), 11-slide plan, this guide, rules and word budgets, slides 1 and 2 | nothing | **Done** |
| D2 | 3, 4, 5 (solution) | landing and nav annotation, idea-to-plan grid, build-test-grow columns | optional re-capture (5.3) | **Done** |
| D3 | 6, 7, 8 (process, business, competition and market) | routing graph with pins, plan cards and gross-profit bars, positioning map and rings | U13, U5, U11 (all optional) **Done** |
| D4 | 9, 10, 11 (team, traction and projection, ask and close) | founder cards, MRR bars, capital bar, closing QR | U1 why-us lines, U2, U6 to U10, U12 | |
| D5 | none | export polish, speaker notes check, final QA, PDF size | nothing | |

---

## 9. Patch prompts (paste into Claude Code or Copilot in the repo)

Common preamble for every prompt: "Read `docs/PATCH_NOTES.md` and `docs/guide/PITCH_DECK_PATCHES.md` (v2) first. Follow sections 1, 4, 6 and 7. Do not touch the film compositions. Slide files contain no typed sentence and no typed number. Keep every text at 22 px or larger (use `Txt`). Real screenshots only. Run `npx tsc --noEmit`, `npm run deck:check` and `npm run deck`, look at every rendered still, and fix anything that overlaps, is cut off or hides screenshot text. Append a PATCH_NOTES entry and update section 8. Report the PDF size and the word counts."

### D2 prompt: slides 3 to 5
Build slides 3, 4 and 5 per section 6. Add the crops they need to `CROPS` in `shots.ts` (nav strip of `chat_nav`, the persona list of `test`, and so on) and measure them with `<Shot grid />`. Add each slide to `BUILT`.

### D3 prompt: slides 6 to 8
Build slides 6, 7 and 8 per section 6. Slide 7 needs a small bar chart built from `facts.gp` (draw it with divs or SVG, no chart library). Slide 8 draws the map and rings as SVG. Honour U5, U11 and U13 when they are set; otherwise use the defaults.

### D4 prompt: slides 9 to 11
Build slides 9, 10 and 11 per section 6. Slide 9 is skipped by the export while U1 is incomplete. Use `inputs.founders` (photo from `public/deck/people/`), `inputs.split`, `inputs.advisors`. Slide 11 is on ink and closes the story of slide 2.

### D5 prompt: export and QA
Run the full export, check that the PDF is at most 9.0 MB, that every page is 1920 x 1080 and that all QR codes decode to the intended URLs. Re-read `words.ts` against the honesty rules H1 to H8. Fill the speaker notes that are still empty with one true line each, no invented claims.

---

## 10. Checks (`npm run deck:check`) and final QA

The script fails on: more or fewer than `TOTAL_SLIDES` slides, a built slide missing from the composition, any `fontSize` literal under 22 inside `src/deck/`, a slide over its word budget, a headline over 12 words, a banned word (H6), a typed number in `words.ts` or a slide, "73 agents", a facts row without a source or status, a reference to the Token Usage capture or the film's stat chip, a null open item that a built slide reads without declaring it, a screenshot whose natural size or crop does not match the file, a missing founder photo, unpinned new dependencies, and (after `npm run deck`) a PDF larger than 9.0 MB, with the wrong page count or with pages that are not 1920 x 1080.

Final QA by a human, 15 minutes:
1. Open the PDF full screen. Every slide: can you tell what it says in five seconds?
2. Scan each QR with a phone.
3. Read every number against `facts.ts` and its status.
4. Check the application form text against section 1.3 (59 agents, not 73).
5. Ask a friend who has not seen the product to explain it back after slide 6.
