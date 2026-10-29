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

---

## PATCH 01 — Brand, logo, role icons, emoji, asset fetch script

### Files created / changed
```
CREATED  public/brand/minime-logo.svg
CREATED  src/ui/MiniMeLogo.tsx        src/ui/AssistantAvatar.tsx      src/ui/Emoji.tsx
CREATED  src/lib/roleIcons.ts         src/lib/vendoredFonts.ts (GENERATED, see below)
CREATED  src/dev/DevBrandSheet.tsx    (dev-only composition)
CREATED  scripts/fetch-assets.mjs
CHANGED  src/lib/fonts.ts             (vendored files used when present; exports unchanged)
CHANGED  src/Root.tsx                 (registers DevBrandSheet; final compositions untouched)
CHANGED  package.json                 (new script "assets")
CHANGED  docs/PATCH_NOTES.md
```
`public/emoji/` and `public/fonts/` are NOT in the patch. `npm run assets` creates them (and rewrites `src/lib/vendoredFonts.ts`).

### Public API

**src/ui/MiniMeLogo.tsx**
- `LOGO_VIEWBOX`, `LOGO_WIDTH` (1024), `LOGO_HEIGHT` (844), `LOGO_TRANSFORM`, `LOGO_FILL` (#FF2052), `PATH1_D`, `PATH2_D` (exact Appendix A data)
- `LOGO_DRAW_FRAMES = f(42)`, `LOGO_PATH2_DELAY_FRAMES = f(4)`, `LOGO_PATH2_OFFSET` (= 4/46 = 0.087, path 2's start offset in progress terms), `LOGO_STROKE_PX = 2.5`
- `logoProgress(frame, startFrame, drawFrames = LOGO_DRAW_FRAMES): number`: linear 0..1 progress of the whole two-path draw
- `<MiniMeLogo progress fill? size glow? path2Offset? strokePx? style? />`
  - `progress` linear 0..1 (the component eases each path with `signatureEase`; path 1 finishes at `1 - offset`, path 2 at 1)
  - `size` = width in px (height = size * 844 / 1024)
  - `fill` optional 0..1 override of the fill opacity of BOTH paths (stroke opacity is always `1 - fill`). Undefined = natural: fill takes over from 80% of each path's eased draw while the stroke fades
  - `glow` 0..1 crimson drop-shadow glow

**src/ui/AssistantAvatar.tsx**
- `<AssistantAvatar mode="static"|"thinking" frame size?=26 style? />` (`frame` is local to the message)
- `thinkingState(frame): {progress, opacity}`, `AVATAR_LOOP` (seconds: draw .7, path2Delay .09, hold .48, fade .34, rest .14), `AVATAR_LOOP_FRAMES` (52.5 at 30 fps)

**src/ui/Emoji.tsx**
- `<Emoji emoji size?=16 style? />` (bundled Twemoji via `<Img>` + `staticFile`), `emojiFilename(emoji)`, `emojiSrc(emoji)`

**src/lib/roleIcons.ts**
- `ROLE_CATEGORIES` (99 entries, Appendix B, same order, first hit wins), `type RoleCategory {key, test, icon, color}`
- `DEFAULT_CATEGORY` (🧩 #e879f9), `INPUT_NODE`, `OUTPUT_NODE` ({key, label, icon, color}), `EXTRA_EMOJI.bookmark` (🔖)
- `getRoleCategory(name)`, `roleNameColor(name, {error?})`, `hashedRoleNameColor(name)`, `roleNameHash(name)`, `roleKey(name)`, `ROLE_NAME_PALETTE`, `ROLE_COLOR_OVERRIDES`, `ROLE_ERROR_COLOR` (#f87171)
- `tierText(key)` ("Tier 3 · adaptive"), `tierLabel(0..3)` ("Tier 3 · Ultimate Structure"), `tierColor(number | key)`, `TIER_NUMBER_BY_KEY`, `type TierNumber`
- TIER_LABELS / TIER_STEP_LABELS come from `copy.ts` (not redefined)

**src/lib/fonts.ts**: exports unchanged (`FONTS`, `FONT_FAMILIES`, `fontsReady`, `FontsReady`). `FONT_FAMILIES` is now the plain constants `{sora: 'Sora', inter: 'Inter', mono: 'JetBrains Mono'}`.

### Decisions and conventions
- Stroke width is converted to path units from `size` instead of `vector-effect: non-scaling-stroke` (Chrome measures dashes in screen space with that effect, which breaks `pathLength="1"`). Result: exactly `strokePx` px at the component's own size; the camera scales it like everything else.
- No `getTotalLength()`: both paths use `pathLength={1}` with `strokeDasharray="1 2"` and `strokeDashoffset = 1 - easedProgress`. Stroke is hidden (opacity 0) while a path's progress is exactly 0, so no start dot appears.
- Emoji icons in `roleIcons.ts` are written as `\u` escapes with the emoji in a trailing comment. `scripts/fetch-assets.mjs` parses those escapes to know which Twemoji files to fetch (101 files: every category icon, default, input, output, bookmark). Keep that format when adding icons.
- Twemoji file rule (same in Emoji.tsx and the script): hex code points joined by `-`, FE0F dropped unless the sequence contains a ZWJ (200D).
- Role name colors: `ROLE_COLOR_OVERRIDES` wins, otherwise the Appendix B hash. All 11 non-Inspector overrides were checked against the hash and agree. Inspector is the special `#ff5168`.
- `src/lib/vendoredFonts.ts` is GENERATED by `npm run assets`. Committed state = empty list = Google Fonts fallback (needs internet once). After `npm run assets` it lists 10 woff2 files and fonts load fully offline. Commit the regenerated file.
- Dev compositions live in `src/dev/` and are registered in `Root.tsx` under a "DEV-ONLY" comment. Patch 17 decides what stays registered.
- Emoji graphics are Twemoji (CC-BY 4.0). Mention attribution in the README (patch 17).

### Known issues
- Not verified in a browser in the authoring sandbox (no Chrome download possible): `DevBrandSheet` has not been rendered to a still. Verified instead: `tsc --noEmit` passes, `npx remotion bundle` succeeds, server-side render of `MiniMeLogo`/`AssistantAvatar` gives the expected attributes for progress 0 to 1, `ROLE_CATEGORIES` matches the Appendix B role table, and the Twemoji download of all 101 files works. The font download path was tested against mocked Google Fonts responses only.
- The 2.5 px stroke is relative to the logo's own `size`; a large hero logo (S0, S6) may want a bigger `strokePx` to read like a pen line.

### Warnings for the next patch
- Patch 03 (ChatSidebar/ChatBox etc.) and 05 (StepCard, RoutingGraph) should use `getRoleCategory(name).icon/.color` with `<Emoji/>`, and `roleNameColor(name, {error})` for the step-card name.
- Do not re-measure paths or use CSS transitions in the logo; drive everything from `progress`.

---

## PATCH 02 — FX toolkit (camera, cursor, overlays)

### Files created / changed
```
CREATED  src/config/camera.ts   src/config/focus.ts
CREATED  src/fx/cameraMath.ts   src/fx/fxUtils.ts    src/fx/cursorMath.ts
CREATED  src/fx/Camera.tsx      src/fx/Cursor.tsx
CREATED  src/fx/Caption.tsx     src/fx/KineticText.tsx   src/fx/Callout.tsx   src/fx/StatChip.tsx
CREATED  src/fx/Glow.tsx        src/fx/Grain.tsx         src/fx/Vignette.tsx  src/fx/Spotlight.tsx
CREATED  src/fx/GridFloor.tsx   src/fx/Toast.tsx         src/fx/KeyCap.tsx
CREATED  src/dev/DevFxSheet.tsx (dev-only composition, 300 f)
CHANGED  src/Root.tsx           (registers DevFxSheet under the DEV-ONLY comment; final compositions untouched)
CHANGED  docs/PATCH_NOTES.md
```

### Public API

**src/config/camera.ts**
- `type CameraKeyframe {frame, target: FocusName, padding, scaleBias, rotateX, rotateY, rotateZ, ease?}`; `type CursorWaypoint {frame, x, y, click?, hover?}` (x/y in the UI's logical 1440x810 space)
- `cameraKey(frame, target, options?: Partial<{padding, scaleBias, rotateX, rotateY, rotateZ, ease}>): CameraKeyframe` (defaults: `CAMERA_DEFAULTS` padding 72, bias 1, no tilt)
- Tunables: `CAMERA_PERSPECTIVE` 1800, `CAMERA_LIMITS {minScale .5, maxScale 2.4, normal {6,5,3}, extended {14,14,6}, extendedScenes S0 S1 S6}`, `CAMERA_DEFAULTS`, `CAMERA_DRIFT` (2 px), `CAMERA_DOF {blurPx 1.2, dim .12, feather 90}`

**src/config/focus.ts**: `FOCUS_RECTS` (nav, sidebar, composer, messageList, assistantBadge, workingPanel, graph, stepCards, modeMenu, hiresCard, fullWindow; logical UI coords), `type FocusName`, `type FocusRect`, `FOCUS_NAMES`, `focusRect(name)`. Panel-closed vs panel-open rule is documented in the file header.

**src/fx/cameraMath.ts** (pure): `CAMERA_SETTLE_FRAMES` (= 25 at 30 fps), `IDENTITY_POSE`, `IDENTITY_STATE`, `resolveKeyframes(keyframes, rects?)`, `solveCameraAt(frame, resolved, {drift?})`, `poseForKeyframe`, `cameraDrift(frame)`, `cameraTransform(state)`, `uiRectToStage`, `projectStagePoint`, `projectUiPoint`, `projectStageRect`, `projectUiRect`, types `CameraPose`, `CameraState`, `ResolvedKeyframe`, `StageRect`, `FocusRectMap`.

**src/fx/cursorMath.ts** (pure): `getCursorState(frame, waypoints): CursorState {x, y, pressed, hover, scale, opacity, traveling, ripples: CursorRipple[]}`, `CursorRipple {age, x, y, radius, opacity}`, tunables `CURSOR_TRAVEL_MIN/MAX` (14/36 f), `CURSOR_TRAVEL_FULL_DISTANCE`, `CURSOR_OVERSHOOT(_MAX_PX)`, `CURSOR_FADE_IN_FRAMES` 8, `CLICK_DIP_SCALE` .88, `CLICK_DOWN_FRAMES` 2, `CLICK_UP_FRAMES` 4, `RIPPLE_*` (14 f, radius 6 to 28, opacity .5 to 0).

**src/fx/fxUtils.ts**: `useFxFrame(override?)`, `FxPoint {x, y, space?: 'screen' | 'ui'}`, `FxRect`, `FxSpace`, `resolveFxPoint(state, point)`, `resolveFxRect(state, focusNameOrRect)`, `estimateTextWidth`, `GLASS`, `GLASS_SHADOW`, `LAYER`.

**Components** (every one takes `frame?` to override `useCurrentFrame()`; frames are GLOBAL frames)
- `<Camera keyframes screen? dof? focus? />`, `CameraContext`, `useCameraState()`. Children = WORLD (stage coords, put the app at `UI_OFFSET`, put `<Cursor/>` here). `screen` = never-transformed layer above the depth of field (captions, callouts, chips, toast, key caps, glow). Stage background goes BEHIND `<Camera>`.
- `<Cursor waypoints size?=26 compensate?=0.55 />` (inside the Camera world). Re-exports `getCursorState`, `CursorState`, `CursorRipple`.
- `<Caption text highlight? sub? startFrame endFrame fontSize?=68 bottom?=104 />`
- `<KineticText lines startFrame exitFrame? highlight? underline? stagger?=3 fontSize?=120 weight? color? highlightColor? align? lineHeight? letterSpacing? fontFamily? style? />`
- `<Callout text anchor side?='right' distance?=96 shift? inset?=14 startFrame endFrame fontSize?=24 />`, `anchor: FocusName | FxPoint`
- `<StatChip startFrame endFrame? specialists? rechecks? seconds? x? y?=120 countFrames?=34 fontSize?=30 />` (defaults from `STAT_CHIP`)
- `<Glow startFrame at?: FocusName | FxPoint size?=560 frames?=28 pulses?=1 gap?=10 intensity?=1 />` (scale .6 to 1.4, opacity .5 to 0, `mix-blend-mode: screen`)
- `<Toast startFrame life?=40 text?=UI_TEXT.toastSavedTemplate x? y? fontSize?=26 />` (rises with a spring, sinks out through a mask; green check is inline SVG)
- `<KeyCap startFrame at?: FxPoint hold?=6 label? size?=56 />`, `keyCapLife(hold)`, `KEYCAP_ENTER_FRAMES` (4); the key is pressed at `startFrame + 4`; total life = 4 + hold + 5 frames. Return arrow is inline SVG.
- `<Spotlight startFrame endFrame target?: FocusName | FxRect angle?=18 band?=0.3 intensity?=0.16 radius?=14 direction?='ltr' />` (one light sweep, clipped to the target)
- `<GridFloor spacing?=32 lineAlpha?=0.04 horizon?=0.46 tilt?=68 speed?=0.3 opacity?=1 />` (stage background, BEHIND `<Camera>`)
- `<Vignette strength?=0.12 inner?=0.58 />`, `<Grain opacity?=0.035 frequency?=0.8 seedOffset? blend? />` (top-most layers, OUTSIDE `<Camera>`)

### Decisions and conventions
- The camera, focus, caption, kinetic text, callout, stat chip, fxUtils and cursor component files were carried over exactly as authored in the first pass of this patch; `cursorMath.ts` and everything from Glow on were completed here.
- Cursor path: cubic Bezier per move, both control points pushed sideways by a seeded amount (seed from waypoint index, frame and position), travel 14 to 36 frames by distance, shortened to the gap to the previous waypoint when smaller. Progress uses `overshoot()` so the arrow reaches the target at about 70% of the travel, runs at most 8 px past it along the end tangent and settles back. It lands exactly on the waypoint frame (verified).
- Click: arrow scale 1 to 0.88 over the 2 frames before `frame`, 0.88 on `frame`, back to 1 over 4 frames; ripple 14 frames from `frame`.
- Cursor visibility: invisible before its first waypoint, fades in over 8 f so it is fully visible on that frame, then stays visible after the last waypoint. There is no hide flag in `CursorWaypoint` (the contract is unchanged). A scene that needs the cursor gone must simply not be in the cursor range, or patch 08 can wrap `<Cursor/>` in a frame check.
- `hover` is the `hover` of the waypoint the cursor RESTS at (undefined while it travels). The UI reads it via `getCursorState(frame, ALL_WAYPOINTS).hover`.
- Tilt limits are chosen by the scene a keyframe's `frame` falls in (S0, S1, S6 extended). In `DevFxSheet`, frames 0 to 239 count as S0/S1 and 240+ as S2.
- Layer order for the film (patch 08): stage background, `<GridFloor/>` (S0 and S6 only), `<Camera keyframes screen={overlays}>` with `<ChatApp/>` and `<Cursor/>` as world children, `<Vignette/>`, `<Grain/>`.
- Overlays have no CSS transitions or timers; reveals are mask wipes (clip-path or overflow) driven by `ramp()` and `spr()`; Grain seeds `feTurbulence` from the seeded PRNG with the frame as seed.
- Arrows and ticks drawn in FX components are inline SVG (no text glyphs), per the patch 00 warning. The `→` and `·` inside callout and chip TEXT still come from the font (see known issues).

### Verified
- `npx tsc --noEmit` passes.
- Numeric checks on `cursorMath` and `cameraMath`: deterministic output; the cursor path bows sideways (24 px on a 590 px move), overshoots by under 8 px and lands on the waypoint frame; click scale and ripple values match the contract; two overlapping camera moves change smoothly from frame to frame (largest step about 40 px on the longest pan); projection round-trips (the focus center lands on screen center).
- Rendered `DevFxSheet` stills at frames 20, 52, 100, 150, 215, 285 with a sandbox Chromium (131) and the vendored fonts: masked word reveal and underline, key cap, glow, ripple, hover label, caption, callout, stat chip, toast and tilted shots all look right. The same frame rendered twice is byte-identical; grain differs from frame to frame.

### Known issues
- Not checked: motion quality in the Studio (only stills were rendered), render time of the full-resolution `feTurbulence` grain over 1740 frames (if it is slow, lower `frequency` cost by dropping `numOctaves` in Grain.tsx or enable it for the final render only), and the `→` glyph in the "Tier 3 → specialist team" chip (check it in the stills; swap to an inline SVG arrow if it falls back to a system font).
- `Callout` and `Toast` size their chips from `estimateTextWidth` (0.55 to 0.56 em per character), so the chip's clamp to the safe margin is approximate; the real chip is `white-space: nowrap` and always draws correctly.
- `Vignette` at the guide's 12% is very subtle on the near-black stage; raise `strength` if it should read.
- `DevFxSheet` uses a stand-in window that outlines the focus rectangles; it does not render any real UI.

### Warnings for the next patches
- Patch 03 may refine `FOCUS_RECTS` to the real geometry; if it does it must edit `src/config/focus.ts` (the camera, callouts and spotlight all read from it).
- Scene patches: only export `SN_CAMERA`/`SN_CURSOR`; author frames with `f()`/`beat()`/`sec()`. A move that must LAND on a beat has to start `CAMERA_SETTLE_FRAMES` (25) frames earlier; leave room for callouts with extra `padding` on the chip's side.
- Keep `<Cursor/>` inside `<Camera>` and every other overlay in `screen`; do not render FX inside a `<Sequence>` without passing `frame=`.
