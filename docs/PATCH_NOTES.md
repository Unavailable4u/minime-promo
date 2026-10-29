# PATCH NOTES (handoff log)

Every patch appends one entry here. A new AI session must read this file first.
It lists what exists, the public API of each file, and the conventions to follow.

Global conventions (apply to every patch):
- Frame numbers in config are authored at 30 fps. Wrap them in `f()`, `sec()`, `beat()`, `bar()` from `src/config/timeline.ts`.
- Lay out everything with `STAGE` (1920x1080) and `UI` (1440x810) constants. NEVER use `useVideoConfig().width/height` for layout (the Preview composition scales the 1920x1080 stage down).
- No CSS transitions/animations, no `Math.random`, no `Date`, no timers, no network at render time. Use `createRng` / `rand` from `src/lib/prng.ts`.
- Colors come from `src/config/theme.ts`, text from `src/config/copy.ts`.

---

## PATCH 00 — Scaffold, config, core math

### Files created
```
package.json  tsconfig.json  remotion.config.ts  .gitignore
src/index.ts  src/Root.tsx  src/MiniMePromo.tsx (TEMPORARY)  src/PreviewScale.tsx
src/config/theme.ts  src/config/timeline.ts  src/config/copy.ts
src/lib/ease.ts  src/lib/spring.ts  src/lib/prng.ts  src/lib/fonts.ts
src/ui/theme.css
docs/PATCH_NOTES.md
```

### Public API

**src/config/timeline.ts**
- `BASE_FPS = 30`, `FPS = 30`, `BPM = 120`, `BEAT = 15`, `BAR = 60`, `TOTAL_FRAMES = 1740`
- `f(authoredFrame)`, `sec(seconds)`, `beat(n)`, `bar(n)`: all return frame numbers (integers)
- `STAGE = {width: 1920, height: 1080}`; `UI = {width: 1440, height: 810}`; `UI_OFFSET = {x: 240, y: 135}` (top-left of the logical UI on the stage)
- `SCENES.S0..S6 = {start, end, duration}`: start and end are both INCLUSIVE (S0 0-119, S1 120-239, S2 240-479, S3 480-1079, S4 1080-1319, S5 1320-1499, S6 1500-1739)
- `type SceneId`, `SCENE_ORDER`, `SCENE_NAMES`, `sceneAt(frame): SceneId`, `sceneLocalFrame(frame, id)`

**src/config/theme.ts** (all `as const`)
- `ACCENT {base, hover, active, text, wordmarkMe}`
- `NEUTRAL[100..950]`, `NEUTRAL_ALPHA {n950a50, n900a50, n800a70, white08, white05, white04, black30, black50}`
- `SURFACE {appBody, stageTop, stageBottom, logoStage, activeRow, glowRing, stageGradient, crimsonGlow(alpha)}`
- `STATUS {done, running, error, paused, pending, awaiting}` + `type StatusKey`
- `STEP_CARD {done, running, error, awaiting, pending}` each `{border, bg}` (pending reuses done chrome; the reference does not specify it)
- `TIER_COLORS[0..3]`, `TIER_COLOR_BY_KEY {instant, direct, fixed, adaptive}`, `type TierKey`
- `EDGE_COLORS {plan, recheck, escalate, requested, decision, error}`, `type EdgeReason`, `EDGE_DASHED` (Set; contains `decision`)
- `TOKEN_COLORS {comment, string, number, keyword, decl, const, func, type, prop, plain, inlineCode}`
- `FONTS {heading, body, mono}` (CSS font-family stacks), `CSS_VARS` (Appendix C variables as an object)

**src/config/copy.ts**
- `BRAND`, `HEADLINE {line1, line2, highlight, full}`, `CAPTIONS {instant, team, control, organized, outro}` (each `{text, highlight, sub?}`), `CALLOUTS {...11 chips}`, `STAT_CHIP`, `CTA {label, url}`
- `USER {name, initial}`, `NAV_TABS` (11 names), `ACTIVE_TAB`
- `SIDEBAR {activeChat, activeChatAutoTitle, projects[], ungrouped[]}` with `SidebarChat {id, title}` and `SidebarProject {id, name, chats}`
- `UI_TEXT {...}` small UI strings (placeholder, "Review hires", "Save as template", toast text, routing card strings, hire review title/subtitle/buttons, attachment name)
- `TIER_LABELS[0..3]` ("Tier 0 · Instant" ...), `TIER_STEP_LABELS {instant, direct, fixed, adaptive}` ("Tier 0 · instant" ...)
- `MODE_OPTIONS[]` `{id, label, hint, icon}` (icon is a lucide-react icon name), `type ModeId`
- `PROMPTS {instant, team, teamExcerpt, control, search}` (the short user-typed strings; the long streamed answers belong to the script patch)

**src/lib/ease.ts**: `signatureEase`, `clamp01`, `mapRange(value, inMin, inMax, outMin, outMax, ease?)` (clamped), `ramp(frame, start, end, ease?)` (0..1, default signature ease), `easeInOut(t)`, `easeOutBack(t, strength?)`, `overshoot(t, amount?)`

**src/lib/spring.ts**: `SPRINGS {uiPop, panel, camera, settle}`, `type SpringPreset`, `spr(frame, fps, startFrame, preset='uiPop')` (returns 0 before start, may overshoot 1), `sprDuration(fps, preset)`

**src/lib/prng.ts**: `createRng(seed)`, `hashString(text)`, `rand(seed)`, `randRange(seed, min, max)`, `randInt(seed, min, max)`, `randSigned(seed, amount)`

**src/lib/fonts.ts**: `FONTS` (re-export), `FONT_FAMILIES`, `fontsReady` (Promise), `<FontsReady>` wrapper (holds the render until Sora/Inter/JetBrains Mono are loaded; wrap the whole film in it)

**Compositions (src/Root.tsx)**: `MiniMePromo` (1920x1080, 30 fps, 1740 f) and `MiniMePromo-Preview` (960x540, same timeline, scaled by `PreviewScale`).

### Decisions and conventions
- `src/index.ts` imports `./ui/theme.css` globally.
- Extra file `src/PreviewScale.tsx` (not in the original tree) scales the 1920x1080 stage for the Preview composition. Keep it.
- `package.json` scripts `sfx`, `check`, `render`, `render:4k`, `render:frames`, `render:all` point to scripts that do NOT exist yet (`make-sfx.mjs` patch 16, `render.mjs` and `check-stills.mjs` patch 17). They are not runnable until then. Patch 17 decides the exact flags (`--4k`, `--frames`, `--all` are placeholders).
- `src/MiniMePromo.tsx` is TEMPORARY; patch 08 replaces it.
- Caption highlight words in `CAPTIONS` are my choice of "key word" (Instant., team., control., organized., beginning.). Change freely.
- `roleIcons.ts` (patch 01) should import `TIER_LABELS` and `TIER_STEP_LABELS` from `copy.ts` instead of redefining them.
- Pinned versions: remotion, @remotion/cli, @remotion/google-fonts all `4.0.539`; react/react-dom `18.3.1`; typescript `~5.9.3`.

### Known issues
- Fonts load from Google Fonts at render time in this patch, so the first Studio/render run needs internet. Patch 01 vendors them into `public/fonts` for fully offline rendering.
- The latin font subsets do not contain some arrow/symbol glyphs (for example `→`, `↗`, `▸`, `▾`, `↵`, `✓`, `○`, `◌`). They can fall back to a system font. From patch 03 on, draw arrows, chevrons, checks and the enter symbol as inline SVG or lucide icons, not as text characters, so every machine renders identical pixels. The `→` inside callout text ("Tier 3 → specialist team") and the step-card note ("→ sent back to recheck ...") are the only text arrows; check them in the stills and swap to an SVG arrow if they look wrong.
- Verified in a sandbox without Google Fonts access: type-check passes, both compositions render at the right sizes, and scene/frame math was checked. The font load itself could not be tested there.

### Warnings for the next patch (01)
- `FontsReady` currently loads through `@remotion/google-fonts`. When vendoring, keep the exports `FONT_FAMILIES`, `fontsReady`, `FontsReady` unchanged.
- `Root.tsx` is resent in full by patches that add dev compositions; keep both final compositions registered exactly as here.
