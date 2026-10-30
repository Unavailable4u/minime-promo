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

---

## PATCH 03 — App shell UI (nav, sidebar, chat box, composer)

### Files created / changed
```
CREATED  src/ui/shellLayout.ts      src/ui/AppWindow.tsx     src/ui/TopNav.tsx       src/ui/ChatSidebar.tsx
CREATED  src/ui/ChatBox.tsx         src/ui/Composer.tsx      src/ui/ModeMenu.tsx
CREATED  src/ui/UserMessage.tsx     src/ui/AssistantMessage.tsx
CREATED  src/lib/color.ts
CREATED  src/dev/DevShell.tsx       (dev-only composition, 8 states x 60 f = 480 f)
CHANGED  src/config/focus.ts        (chat-box rectangles re-derived from the real geometry, see below)
CHANGED  src/config/copy.ts         (+ UI_TEXT.error = 'Error')
CHANGED  src/config/theme.ts        (+ META_COLORS)
CHANGED  src/Root.tsx               (registers DevShell under the DEV-ONLY comment; final compositions untouched)
CHANGED  docs/PATCH_NOTES.md
```

### Public API

**src/ui/shellLayout.ts** (single source of truth for sizes; all rectangles are in the UI's LOGICAL 1440x810 space, origin = top-left of the app window)
- `SHELL {headerH 48, sidebarW 256, panelMaxW 480, paneHeaderH 40, pad 16, gap 8, searchStripH 42, searchInputH 26, sidebarIconBox 22, sidebarIconGap 2, sidebarRowH 33, projectHeaderH 28, reviewW 108, reviewH 26, controlH 41, attachW 34, modeW 112, sendW 84, textareaLine 22.75, attachRowH 30, menuW 224, menuBorder 2, menuGap 8}`
- `type Rect {x, y, w, h}`, `rectCenter(rect): {x, y}`
- `shellLayout({panelWidth?, attachmentRow?, draftLines?}): ShellLayout` returns `window, header, sidebar, sidebarHeader, newChatButton, newFolderButton, collapseButton, searchField, searchClear, sidebarListTop, chatBox, chatHeader, reviewHires, messageList, composer, attachButton, modeButton, textarea, sendButton, attachmentRow, modeMenu, modeMenuRow(index), panel`. `attachmentRow` is the RAW 0..1 chip `appear` value (eased the same way as <Composer/>).
- `textareaHeight(lines)`, `MODE_MENU_ROW_HEIGHTS = [52, 52, 52, 52, 68]`, `MODE_MENU_HEIGHT` (278)

**src/ui/AppWindow.tsx** `<AppWindow header sidebar panel? panelWidth?=0 rimAngle?=0 rimIntensity?=0 style?>{chatBox}</AppWindow>`: 1440x810, radius 14, hairline border drawn as an OVERLAY (so content boxes keep exact sizes), deep shadow, optional moving crimson rim light. The Working Panel is rendered at its full 480 px, anchored to the right edge and clipped by `panelWidth` (drawer reveal, no squashing). Position it with `left: UI_OFFSET.x, top: UI_OFFSET.y` or inside Camera world space.

**src/ui/TopNav.tsx** `<TopNav activeTab?='Chat' sweep?: number | null sweepStrength?=1 tabs? />`. `sweep` 0..1 travels a soft light over the INACTIVE tab names (outro teaser). It never activates a tab.

**src/ui/ChatSidebar.tsx** `<ChatSidebar topRows projects rows activeId? searchText? searchFocus? searchCaret? hover? pressed? />`
- `SidebarRow {id, title, visible?=1, highlight?: {start, end}, hovered?, caret?}`, `SidebarProject {id, name, visible?, highlight?, rows}`, `SidebarHighlight`, `SidebarTarget = 'new-chat' | 'new-folder' | 'collapse' | 'search' | 'clear'`
- `visible` (0..1) collapses a row's height AND fades/slides it, so the live filter, the new-chat slide-in and the filter-clear all animate by driving `visible`. `title` takes the partially typed string; `caret` draws the typing caret.

**src/ui/ChatBox.tsx** `<ChatBox composer reviewHires?=0 reviewHover? reviewPressed? scrollY?=0 emptyState? >{rows}</ChatBox>`. Message list = px 16 py 24; `scrollY` shifts the column up (translateY(-scrollY)); `emptyState` shows a faint mark. Width is whatever AppWindow leaves (1184 px panel closed, 704 px panel open).

**src/ui/Composer.tsx** `<Composer frame draft draftLines? caretVisible? focus? mode menu? sendState? sendEnable? hover? pressed? attachments? placeholder? />`
- `ComposerTarget = 'attach' | 'mode' | 'textarea' | 'send'`, `SendState = 'send' | 'pause' | 'resume'`, `ComposerAttachment {id, name, appear, done}`, `ComposerProps`
- `menu: {openProgress, hoveredIndex?} | null` drives both the dropdown and the chevron rotation. Send is 40% opacity with an empty draft (`sendEnable` overrides); Pause and Resume are always 100%.
- Attachment chips: spinner (12 deg per frame) while `done < 1`, drawn-on SVG check when `done` reaches 1.

**src/ui/ModeMenu.tsx** `<ModeMenu openProgress hoveredIndex? selected />`, `ModeIcon`, `MODE_MENU_ROW_STAGGER` (3 f), `MODE_MENU_ROW_FRAMES` (10 f), `MODE_MENU_OPEN_FRAMES` (22 f). Drive `openProgress = clamp01((frame - openFrame) / MODE_MENU_OPEN_FRAMES)` (reverse for closing). Beast gets a crimson glow while hovered. Rendered by <Composer/>; do not mount it yourself.

**src/ui/UserMessage.tsx** `<UserMessage text progress?=1 chips? maxWidthPct?=80 />`

**src/ui/AssistantMessage.tsx** `<AssistantMessage frame? progress?=1 view?='message'|'working' avatar?='static'|'thinking' meta? badgeGlow?=0 workingElapsed? caret? maxWidthPct?=80>{body}</AssistantMessage>`
- `type AssistantMeta = {kind:'routing'} | {kind:'tier', tier: 0|1|2|3, ok?, elapsed?, morph?} | {kind:'paused', elapsed?} | {kind:'error', elapsed?}`
- `morph` 0..1 cross-masks "routing…" into the tier label and blends the dot from neutral to the tier color (Tier 3 reveal). `badgeGlow` 0..1 is a soft tier-colored bloom behind the badge. `elapsed` is a ready-made string; the script (patch 07) owns the counting.
- `view="working"` = avatar + dim "Working… · 3s", no bubble (avatar defaults to `thinking`).
- Exports `ASSISTANT_AVATAR_SIZE` (26).

**src/lib/color.ts**: `parseColor`, `lerpColor(from, to, t)`, `withAlpha(color, alpha)`, `type Rgba`. CSS transitions are forbidden, so every state blend (Review hires toggle, tier dot, search focus) goes through `lerpColor`.

**src/dev/DevShell.tsx**: `DevShell`, `DEV_SHELL_FRAMES` (480), `STATE_FRAMES` (60), `STATE_NAMES`. State = floor(frame / 60): 0 empty chat, 1 chat with messages, 2 mode menu open, 3 search filter, 4 Review hires ON, 5 thinking + panel open (stand-in panel), 6 meta variants, 7 anchors (layout rectangles over the real DOM).

**src/config/theme.ts** + `META_COLORS {paused #fcd34d, error #f87171, routing, routingDot, separator}`. **src/config/copy.ts** + `UI_TEXT.error`.

### Decisions and conventions
- Clickable controls have FIXED sizes (`SHELL`), so cursor targets never move when a label changes (Auto -> Expert, Send -> Pause). The text inside is centered/spaced to look natural. Patch 07 and the scene patches take cursor/callout anchors from `shellLayout()`, never from measured DOM.
- `focus.ts` was refined: the real chat box is full-width with a LEFT-aligned message column (content starts at x 272) and a full-width composer, so Patch 02's centered-column guesses changed: `composer {256,736,1184,74}`, `messageList {256,88,1184,648}`, `assistantBadge {268,164,380,40}` (first assistant message under a ONE-line user prompt; a wrapped two-line prompt pushes it down about 23 px), `modeMenu {314,467,224,327}` (menu + the button under it), `hiresCard {272,166,720,380}` (estimate until patch 05). `graph` and `stepCards` are unchanged estimates (patches 05/06 refine them). Verified: DevShell state 7 draws `shellLayout()` rectangles over the real DOM and every control lines up.
- Composer, mode menu and chips are all driven by props; nothing reads the frame to decide story. The only frame-reading pieces are the spinner rotation (Composer `frame`), the thinking avatar and the caret pulse (AssistantMessage `frame`).
- Attachment chip row height is `attachRowH * signatureEase(max appear)`. The composer grows upward as chips appear, which moves every composer anchor (`shellLayout({attachmentRow})` gives the new rectangles).
- Hairline window border and rim light are overlays; they never change content geometry.
- Mode menu row heights are hard-coded because Beast's hint wraps to two lines at w 224. If a hint in `copy.ts` changes, re-check state 2 in DevShell and update `MODE_MENU_ROW_HEIGHTS`.
- Arrows, chevrons, checks, pause/play are lucide icons or inline SVG, never text glyphs.

### Verified
- `npx tsc --noEmit` passes (strict).
- DevShell stills rendered with a sandbox Chromium for all 8 states (frames 30, 90, 150, 210, 270, 330, 390, 450) plus 335 and 355: empty chat, messages + Tier 0 meta row, mode menu (5 rows, Beast wraps), live search filter with highlight, Review hires ON, thinking avatar + Tier 3 morph + bloom + Pause button, all five meta variants + Working row, and the anchor overlay.

### Known issues
- The Working Panel in DevShell state 5 is a stand-in (header only); the real one is patch 05.
- The streaming caret is an inline-block after the body, so it drops to its own line under a block element such as a list. Patch 04's Markdown should draw its own caret at the end of the last token and pass `caret={false}`.
- Hover/press styling exists for sidebar icons, search, composer controls and Review hires; sidebar row hover is a prop (`hovered`). Patch 07's app state must set them from the cursor `hover` target.
- Not checked: motion in the Studio (stills only).

### Warnings for the next patches
- Patch 04 (Markdown) should render inside <AssistantMessage/>'s body and own the streaming caret.
- Patch 05 (WorkingPanel, StepCard, HireReview) renders inside the `panel` slot of <AppWindow/> at 480 px wide and refines `FOCUS_RECTS.hiresCard`, `graph`, `stepCards`.
- Patch 07: build `ComposerProps`, `SidebarRow[]` etc. from the script; use `MODE_MENU_OPEN_FRAMES` for the menu, `shellLayout()` for anchors, and `lerpColor` for any state blend.

---

## PATCH 04 — Text engines (typing, streaming, Markdown, code)

### Files
- `src/lib/typing.ts` (new), `src/lib/stream.ts` (new), `src/lib/tokenize.ts` (new)
- `src/ui/CodeBlock.tsx` (new), `src/ui/Markdown.tsx` (new)
- `src/dev/DevMarkdown.tsx` (new, dev only)
- `src/config/copy.ts` (+`ANSWERS.team`), `src/ui/AssistantMessage.tsx` (`Caret` is now exported), `src/Root.tsx` (+`DevMarkdown`)

### API

**src/lib/typing.ts** — deterministic typing, a pure function of the frame.
- `typedText(text, frame, startFrame, opts?)`, `typedCount(...)`: the first character appears ON `startFrame`.
- `typingEndFrame(text, startFrame, opts?)`: frame of the last character. `typingDuration`, `typingSchedule`, `keystrokeFrames(text, startFrame, opts?)` (one frame per character, for key-tick SFX).
- `TypingOptions {charsPerSec=30, jitter=0.4, seed=0, durationFrames?}`. `durationFrames` retimes the whole schedule so the last character lands exactly that many frames after the start (rhythm kept) — use it to land typing on a beat.
- Rhythm: +-40 % seeded gap jitter; pauses after a space (0.7 f), `, ; :` (2.5 f) and `. ! ?` (5 f). The schedule is seeded from the text, cached, and identical on every render worker.
- `caretVisible(frame, {period=16, lastKeystrokeFrame?, solidFrames=10})`: 16-frame blink, solid for 10 frames after a keystroke.

**src/lib/stream.ts** — "LLM streaming" reveal in bursts.
- `streamedText(text, frame, startFrame, endFrame, seed=0)`, `streamCount(length, frame, ...)` (= caret index), `streamProgress`, `isStreaming`.
- Burst weight 8..14 per frame with a 10 % chance of a short stall, normalised so the stream ends EXACTLY on `endFrame`. Monotonic. The 939 character `ANSWERS.team` over frames 10..125 gives about 8 chars/frame, max 11 in one frame.

**src/lib/tokenize.ts** — tolerant JS tokenizer (never throws; unterminated string/regex ends at the line end, block comment/template run to the end). `tokenizeJs(code)`, `tokenizeLines(code)`, `TOKEN_TYPE_COLOR`. Concatenating the token texts always gives back the input. Regex literals use the string color.

**src/ui/CodeBlock.tsx** — `<CodeBlock code lang? trailing? copied? />`; `CODE_BLOCK` (geometry), `codeBlockHeight(lines)`. Header strip (language + Copy icon; `copied` swaps to a green check + "Copied" for the copy-click beat), JetBrains Mono 12.5 / 20, ligatures OFF so `=>` stays two characters.

**src/ui/Markdown.tsx** — `<Markdown text caret? frame? />`, `parseMarkdown`, `parseInline`, `estimateMarkdownHeight(text, widthPx)`, `MD` (style numbers).
- Supports `#`/`##`/`###`, paragraphs, `**bold**`, `*italic*`, `` `code` ``, `[link](url)`, ordered/bullet lists (2-space indent = nested), `>` quote, `---`, pipe tables with `:---:` alignment, fenced code.
- Written for GROWING text: all 940 prefixes of `ANSWERS.team` parse and render without a throw and without flashing raw markers (a dangling `**`, `*`, backtick or `[` styles the rest of the line; a lone `#`, `-`, `>`, `1.` or backticks on the last line are held back; an unterminated fence streams as a code block; a table header is a table before its separator arrives).
- Owns the streaming caret: put it in `<AssistantMessage caret={false}>` and pass `caret` to `<Markdown>`. The caret sits at the end of the last inline run, the last code line or the last table cell, never on a line of its own.
- `estimateMarkdownHeight(text, innerWidthPx)` is a deterministic height for the auto-scroll (patch 07), no DOM measuring. Complete `ANSWERS.team` at 600 px: estimate 678 vs real 679 (-0.1 %). Wrapped paragraphs are counted from character counts, so expect a few percent on other texts; the bubble's inner width is `0.8 * (listWidth - 32) - 26 - 8 - 26`.

**src/config/copy.ts** + `ANSWERS.team`: the Tier 3 answer (heading, plan list, pricing table, quote, `js` code). The film's script (patch 07) streams this.

**src/dev/DevMarkdown.tsx** (`DevMarkdown`, `DEV_MARKDOWN_FRAMES` 210): frames 0..149 stream `ANSWERS.team` (frames 10..125) into the chat with an estimate-driven scroll; frames 150..209 are a static sheet (estimate vs real height, typing engine, stream counts, a partial-input sample).

### Decisions and conventions
- Typing and streaming return strings; the UI never reads time. The chat scene computes `visible = streamedText(...)` and hands it to `<Markdown>`.
- The text is revealed by character, not by token. Markdown is re-parsed every frame (cheap at this size).
- Emoji in streamed text are not supported by Markdown (Twemoji files are vendored only for the emoji the film uses, and `☕` is not one). Use `<Emoji/>` outside the Markdown body.
- Links are drawn sky-blue (`TIER_COLORS[1]`) and underlined; the url is never shown.

### Verified
- `npx tsc --noEmit` passes (strict).
- Logic checks (esbuild bundle run in node): typing monotonic, first char on the start frame, retime lands on the requested frame; stream monotonic, 0 at start, full at end; every prefix of the answer parses; code tokenizer round-trips every prefix of the code block; partial table, dangling marker, unterminated fence and `**`/backtick cases.
- DevMarkdown stills at frames 45, 75 (mid-table with caret in the cell), 100 (mid-code with caret), 140 (complete, scrolled), 170 (static sheet).

### Known issues
- The auto-scroll in DevMarkdown is a direct function of the estimate (it jumps with each new line); the real thing in patch 07 should smooth it with a spring.
- The table uses auto column widths, so columns reflow while cells fill in (like a real renderer). If that looks too busy in the film, give `<Markdown>` fixed column widths for the table in the answer.
- Not checked: motion in the Studio (stills only).

### Warnings for the next patches
- Patch 05 (Working Panel) does not need these engines, but its typed task excerpt can use `typedText`.
- Patch 07: type the prompts with `typedText(PROMPTS.x, frame, start, {durationFrames})` and place Enter at `typingEndFrame(...) + ~6`; stream answers with `streamedText`; derive the scroll from `estimateMarkdownHeight`.

---

## PATCH 05 — Working Panel, step cards, routing card, Hire Review

### Files
- `src/ui/panelLayout.ts` (new), `src/ui/StepCard.tsx` (new), `src/ui/RoutingCard.tsx` (new), `src/ui/WorkingPanel.tsx` (new), `src/ui/HireReview.tsx` (new)
- `src/dev/DevPanel.tsx` (new, dev only)
- `src/config/copy.ts` (+`HIRE_ROLES`), `src/config/focus.ts` (`graph`, `stepCards` refined), `src/Root.tsx` (+`DevPanel`)

### API

**src/ui/panelLayout.ts** — geometry of the panel (UI logical px, panel fully open: x 960..1440). `PANEL` (numbers), `panelLayout()` → `{header, collapseButton, traceLink, excerpt, routingCard, saveTemplate, graph, steps}` and `stepCardRect(i)` (collapsed card i of the list). Take cursor targets and callout anchors from here, never from the DOM. Values: traceLink {972,100,150,16}, excerpt {972,122,456,16}, routingCard {972,146,456,30}, saveTemplate {972,184,132,24}, graph {972,218,456,288}, steps {972,516,456,282}; step card 34 px high, gap 6 (7 collapsed cards = 274 px fit in the 282 px list). The layout assumes the routing card CLOSED; opening it pushes everything below down.

**src/ui/WorkingPanel.tsx** — `<WorkingPanel cascade? taskExcerpt routing? hover? savePress? graph? stepsScrollY?>{<StepCard/>...}</WorkingPanel>`. Pass it as `panel` of `<AppWindow panelWidth>`; it is always 480 px wide and AppWindow clips it while it opens. Left border is an overlay (content keeps the exact layout numbers).
- `cascade` = frames since the cascade started; item i (header, trace link, excerpt, routing card, save row, graph slot) fades in from `3 * i` over 10 frames. Constants `PANEL_CASCADE_STAGGER` (3), `PANEL_CASCADE_ITEM_FRAMES` (10), `PANEL_CASCADE_FRAMES` (25). Default: finished.
- `hover {collapse?, trace?, save?}`, `savePress` 0..1 (press in and out; the row dips to scale .96). `graph` is a node that fills the 456 x 288 slot (patch 06). `stepsScrollY` scrolls the clipped step list.
- Step cards are children; each carries its own entrance (`appear`), so the script decides when a card appears.

**src/ui/StepCard.tsx** — `<StepCard name status tier? ms? frame? appear? expand? summary? note? errorFlash? from? flip? hover? />`
- `status`: `done | running | error | awaiting | pending`; chrome from `STEP_CARD` in theme.ts (`awaiting` = dashed border, pulsing). Role emoji from `getRoleCategory(name)`, name color from `roleNameColor(name)` (error: red-400). `name` is printed as given: `"strategist"`, `"code_writer"`, `"Inspector — classifying task"`.
- Status text: `running` (amber, pulsing), `done · 6933ms` (green + neutral ms), `error · 4210ms`, `awaiting approval`, `pending`.
- `expand` 0..1 unfolds the body (summary neutral-300, `note` amber, e.g. "→ sent back to recheck code_writer") and turns the chevron. `stepBodyHeight()` / `stepCardHeight()` give the heights for scroll math.
- `errorFlash` 0..1 tints chrome and name toward error (drive it `1 - ramp(f, 0, STEP_ERROR_FLASH_FRAMES)` = 6 frames). `from` + `flip` 0..1 flips a card between statuses with a vertical text mask (re-run done → running; `STEP_FLIP_FRAMES` = 8).

**src/ui/RoutingCard.tsx** — `<RoutingCard tier? fromTier? morph? open? details? hover? appear? />`. "Tier 3 · adaptive" (neutral-300) + " · routing trace" (neutral-600) with a rotating chevron; `tier="instant"` reads "Instant response — no pipeline · routing trace". `fromTier` + `morph` cross-mask the text when the Inspector decides; `open` + `details` unfold trace lines. `routingCardHeight()` for the opened height.

**src/ui/HireReview.tsx** — `<HireReview reveal? collapse? hover? approvePress? miniStatus? frame? />`, 720 x 380 (= `FOCUS_RECTS.hiresCard`). Header (title + "5 roles · est. 18k tokens"), five role rows (emoji tile, role name in role color, purpose, `~4.2k tokens`), buttons "Edit" (ghost) and "Approve & run" (crimson; hover = `ACCENT.hover`, press = `ACCENT.active` + scale .96).
- `reveal` = frames since the reveal started: header 0, row i at `4 * (i + 1)`, buttons last (`HIRE_ROW_STAGGER` 4, `HIRE_ROW_FRAMES` 10, `HIRE_REVEAL_FRAMES` 34). Default: finished.
- `collapse` 0..1 morphs the card to the 720 x 168 mini-trace (five compact rows: dot, emoji, role, status). `miniStatus` sets each row `pending | running | done`.
- `hireReviewLayout()` returns card-local rects for `edit` {x 532, y 332, w 64, h 32}, `approve` {x 596, y 332, w 124, h 32} and the five rows. Add the card's absolute position (272, 166 in the chat box with a one-line prompt) for cursor targets.

**src/config/copy.ts** + `HIRE_ROLES` (security_auditor, code_reviewer, fixer, report_writer, responder; purposes and token estimates summing to 18k). **src/config/focus.ts**: `graph` {972,218,456,288}, `stepCards` {972,516,456,282}.

**src/dev/DevPanel.tsx** (`DevPanel`, `DEV_PANEL_FRAMES` 360, 60 frames per state): 0 panel opens + 7 steps in mixed statuses (done, awaiting, running, error, pending), 1 verifier flash + expand + note and a code_writer done → running flip, 2 routing card morph (instant → adaptive) + details, 3 Hire Review reveal + hover Edit + press Approve (with the `hiresCard` focus rect drawn over it: it matches), 4 collapse to the mini-trace, 5 anchors (every `panelLayout()` rect over the real DOM).

### Decisions and conventions
- The task brief sections the guide points at (MASTER §6.4/§6.5, Appendix D3/D4) were not available in this session, so the visual numbers come from the patch prompt plus the existing theme (`STEP_CARD`, role colors) and the 7 steps / 5 hires are authored: steps = Inspector, strategist, market_researcher, code_writer, test_writer, verifier, documentation_writer; hires = the Audit scene roles above. If your D3/D4 text differs (names, purposes, ms), edit `HIRE_ROLES` and the dev data; no component depends on them.
- Order inside the panel (top to bottom): header, trace link, excerpt, routing card, save row, graph slot, step cards. This follows the patch prompt for the top block and the old `focus.ts` (graph above the step list).
- Durations print as `Math.round(ms) + "ms"` ("done · 6933ms"). The script (patch 07) owns the numbers.
- Nothing here reads the frame to decide story: pulses (running text, awaiting border, mini running dot) are the only frame-driven bits.
- `→` in the recheck note renders with the vendored Inter; if a different font subset drops it, swap the note for an inline SVG arrow.

### Verified
- `npx tsc --noEmit` passes (strict).
- DevPanel stills at frames 55, 66, 92, 134, 170, 215, 270, 290, 330: panel cascade and 7 statuses, error flash, expanded verifier with the recheck note, done → running flip mid-mask, routing text morph and open details, Hire Review (reveal, hover, press), mini-trace, and the anchor overlay (all `panelLayout()` rects line up with the DOM).

### Known issues
- The routing graph slot is a placeholder (patch 06 fills it).
- `StepCard` body height is estimated from character counts (about 6.3 px per character at 12 px); a body whose text wraps differently from the estimate gets a few px of slack at full expand.
- The expanded verifier card pushes cards below it out of the clipped list; the script should scroll with `stepsScrollY` (DevPanel state 1 does it by hand).
- Not checked: motion in the Studio (stills only).

### Warnings for the next patches
- Patch 06: render the graph into the 456 x 288 slot (`graph` prop); its card chrome (rounded 8, #262626, bg #0a0a0a) is the graph's own business.
- Patch 07: build `StepCard` props from the script (status, ms, expand, flash, flip) and `routing` from the tier reveal; use `PANEL_CASCADE_FRAMES` and `HIRE_REVEAL_FRAMES` for scene timing, `panelLayout()` / `stepCardRect()` / `hireReviewLayout()` for cursor and callout anchors.

---

## PATCH 06 — Routing graph (SVG)

### Files created / changed
```
CREATED  src/config/graphLayout.ts   src/ui/RoutingGraph.tsx   src/ui/graphState.ts
CREATED  src/dev/DevGraph.tsx        (dev-only composition, 240 f)
CHANGED  src/config/copy.ts          (+ GRAPH_TEXT: decision label and legend labels)
CHANGED  src/Root.tsx                (registers DevGraph under the DEV-ONLY comment; final compositions untouched)
CHANGED  docs/PATCH_NOTES.md
```

### Public API

**src/config/graphLayout.ts**
- `GRAPH` (tunables): `box {440, 300}`, `viewBox {0, 50, 440, 236}` (the drawn crop), `legendH` 34, `nodeRadius` 11, `endpointRadius` 13, `decisionRadius` 7, `emojiScale` 1.65, `ringWidth` 2, `labelSize` 11, `wobbleAmplitude` 2.4, `particleSpeed` 1.9 (units/frame), `particlesPerEdge` 2, `arrowLength`, `arrowHalfWidth`, `fillAlpha {default .92, pending .22, running .60}`.
- `GraphNodeId` = `input | inspector | strategist | market_researcher | documentation_writer | code_writer | test_writer | verifier | output | pool`; `GRAPH_NODES: Record<GraphNodeId, GraphNodeDef {id, label, kind: endpoint|role|decision, x, y, radius, emoji?, color, labelSide: below|above|right}>`; `GRAPH_NODE_ORDER`.
- `GRAPH_EDGES: GraphEdgeDef[] {id: 'from>to', from, to, reason: EdgeReason, bend}`; edge ids: `input>inspector`, `inspector>strategist`, `strategist>market_researcher`, `strategist>code_writer`, `market_researcher>documentation_writer`, `code_writer>test_writer`, `test_writer>verifier`, `verifier>code_writer` (recheck, bend -34), `verifier>output`, `documentation_writer>output`, `pool>code_writer` (decision, dashed).
- `edgeColor(reason)`, `edgeIsDashed(reason)`, `edgeWidth(reason)`, `nodeParent(id)`.
- Curve math: `Pt`, `QuadCurve`, `edgeCurve(a, b, startInset, endInset, bend)`, `quadPoint`, `quadTangent`, `quadLength`, `quadPath`.

**src/ui/RoutingGraph.tsx** `<RoutingGraph frame? nodes edges legend? wobble? style? />` fills its parent (pass it as `graph` of `<WorkingPanel/>`, 456 x 288 slot).
- `nodes: Partial<Record<GraphNodeId, GraphNodeState>>`, `GraphNodeState {appear, status, ring?, fromStatus?, pulse?}`; `status` = `done | running | error | paused | pending | awaiting`. A node with no entry (or `appear` <= 0) is not drawn.
- `edges: Partial<Record<string, GraphEdgeState>>` keyed by edge id, `GraphEdgeState {appear, flow?, speed?, phase?}` (`flow` 0..1 particle visibility, `speed` constant multiplier, `phase` extra cycles).
- `frame` only drives decoration (running pulse, wobble, particle travel). Default: the current frame.
- Exports `graphFit(width, height)` and `graphNodeUiPoint(id)` (node center in the UI's logical 1440x810 space with the panel open, wobble ignored; use it for callout anchors and cursor targets).

**src/ui/graphState.ts** (schedule -> props, for the script in patch 07)
- `nodeStateAt(frame, {appear, phases: [{frame, status}...]})`, `edgeStateAt(frame, {start, drawFrames?, flowFrom?, flowTo?})`, `graphStateAt(frame, nodeSchedules, edgeSchedules)` returns `{nodes, edges}` for `<RoutingGraph/>`.
- Constants `GRAPH_RING_DRAW_FRAMES` (12), `GRAPH_RING_START_FRAMES` (8), `GRAPH_EDGE_DRAW_FRAMES` (14), `GRAPH_FLOW_FADE_FRAMES` (8). A status change draws the new ring over the old one (`fromStatus`), so a finishing node shows amber, then green drawing on. A status may repeat (code_writer re-run).

**src/config/copy.ts** + `GRAPH_TEXT {decisionLabel, legend {done, running, error, awaiting, pending, requested, decision}}`.

### Decisions and conventions
- SVG, not canvas. Layers: edges (+ particles), node glyphs, labels on top. Labels have a #0a0a0a halo (`paint-order: stroke`) so edges can run behind text.
- Emoji go through `<Emoji/>` inside a `foreignObject` (so Remotion waits for the image to load). Decision node has no emoji: a small fork glyph in SVG.
- Layout changes versus Appendix D3: `market_researcher`'s label is above its node (labels were 105 and 122 px wide on nodes 73 px apart); the decision label is to the right of its node (about 215 px wide). Node coordinates are exactly the brief's. The drawn crop is y 50..286 of the 440x300 box; scale in the slot is 1.036.
- Ring: 2 px at radius r + 1. done / error / running draw on with `pathLength` (butt caps, no start dot); pending is dashed `2 2`; paused and awaiting are dashed `3 2.2`, slowly rotating, pulsing. Fill alpha cross-fades with the ring progress.
- Node entry: position lerps from the parent node's position (`nodeParent`) with the raw spring value (overshoot visible), scale .5 -> 1. Wobble: two seeded sines per axis, amplitude 2.4 units (2.5 px in the slot, under the 3 px limit), half for the endpoints.
- Dashed edges (decision) draw on through an SVG mask; solid edges through `pathLength`. Arrowhead fades in over the last 20 % of the draw. Particles only run once the line has fully arrived. The recheck edge also gets a faint wide halo while its particles flow.
- Legend: two fixed rows (status rings, then pending / requested / decision), drawn with inline SVG swatches, 11 px Inter neutral-400.

### Verified
- `npx tsc --noEmit` passes (strict).
- DevGraph stills at frames 12, 60, 100, 150, 190, 205, 239 with the sandbox Chromium: growth from Input, parallel researcher / code_writer with glow and the dashed decision node, the red verifier ring, the amber recheck edge drawing back to code_writer with particles, code_writer re-run, final graph with Output. The same frame rendered twice is byte-identical.

### Known issues
- DevPanel (patch 05) still shows its graph placeholder; the real graph is wired in by the ChatApp in patch 07.
- Edge particles use the constant speed `GRAPH.particleSpeed` per frame, so a short edge cycles faster than a long one in time but not in pixels per frame. Pass `phase` for a different feel.
- Not checked: motion in the Studio (stills only), and the legend at other panel widths (the panel is always 480 px).

### Warnings for the next patch (07)
- Build `nodes` / `edges` with `graphStateAt(frame, NODE_SCHEDULES, EDGE_SCHEDULES)` from the script's step timings. Pass `frame` (global) so the particles stay continuous across scenes.
- Use `graphNodeUiPoint(id)` for the callout "Every step traced" and the Tier / Inspector callouts.
- `HIRE_ROLES` in copy.ts (patch 05) uses `responder` where Appendix D4 lists `test_writer`; if D4 is the source of truth, fix it in patch 07.

---

## PATCH 07 — The whole choreography as data, and the persistent ChatApp

### Files created / changed
```
CREATED  src/config/script.ts        (all frame numbers of S2..S5 as data)
CREATED  src/config/appState.ts      (appStateAt / useAppState, layoutAt, scrollAt, panelWidthAt)
CREATED  src/config/anchors.ts       (anchorsAt(frame): cursor / callout targets in logical UI px)
CREATED  src/config/anchorsMath.ts   (lerpFraction)
CREATED  src/ui/ChatApp.tsx          (<ChatApp/>, <ChatAppView/>)
CREATED  src/dev/DevApp.tsx          (dev-only composition, 1501 f, frame = global film frame)
CHANGED  src/Root.tsx                (registers DevApp under the DEV-ONLY comment)
CHANGED  src/config/copy.ts          (+ ANSWERS.instant / teamFinal, META_TEXT, STEP_TEXT; HIRE_ROLES = D4)
CHANGED  src/config/graphLayout.ts   (+ nodes security_auditor, code_reviewer and their two edges)
CHANGED  src/ui/RoutingCard.tsx      (fromTier may be 'routing': the "routing…" -> tier text morph)
CHANGED  src/ui/HireReview.tsx       (+ `width` prop, hireReviewLayout(width))
CHANGED  src/ui/ChatBox.tsx          (+ data-chat-column attribute on the message column, for DevApp measureRows)
CHANGED  src/ui/Markdown.tsx         (CHAR_W 7.3 -> 7.0, see Decisions)
CHANGED  docs/PATCH_NOTES.md
```

### Public API

**src/config/script.ts** — the choreography as data (every number authored with `f()` / `sec()` / `beat()`).
- Objects: `S2` (prompt typing, Enter, user bubble, working, answer stream, sidebar auto-title), `S3` (+ `S3.steps`, `S3.graph`, `S3.routing`, `S3.reveal`, `S3.panel`, `S3.answer`, `S3.save`, `S3.stepsScroll`), `S4` (mode menu, review hires, prompt, hire card, approve, pause / resume, `S4.steps`, `S4.graph`, `S4.panel`), `S5` (search, clear, new chat, panel close, attach, chip).
- Lists: `HOVER_WINDOWS`, `PRESS_EVENTS` (+ `PRESS_FRAMES`), `FOCUS_EVENTS` (+ `FOCUS_RAMP_FRAMES`: which control the camera / cursor focuses), `SCROLL {keepAbove 120, omega 0.28, topPadding 24}`, `CHAT_RANGE {from 240, to 1500}`, `ELAPSED_RATE` 2.8 (the "Working… 3s" counter runs 2.8x film time).
- Types: `TypingScript`, `StepRun`, `ExpandWindow`, `StepScript`, `HoverTarget`, `HoverWindow`, `PressTarget`.
- Key frames (global): S2 prompt typed 262-318, Enter 324, user bubble 326, working 334-352, answer 356-410, sidebar title typed 380-420. S3 prompt 496-586, Enter 590, panel opens 604, routing reveal morph 660-676, final answer 916-1030, save-template click 1056, toast 1060. S4 mode menu opens 1104, Expert 1140, Review hires click 1166, prompt 1183-1213, Enter 1217, hire card 1220, Approve click 1244, Pause 1262, Resume 1290. S5 search click 1334, typing 1340-1356, clear 1384, New chat 1398/1400, panel closes 1402, attach click 1434, chip 1436.

**src/config/appState.ts**
- `appStateAt(frame): AppState` (pure; `useAppState(frame)` is the same function under the guide's name, NOT a hook). `AppState {frame, sidebar, panelWidth, panel: PanelState | null, chat {rows, scrollY, reviewHires, reviewHover, reviewPressed, emptyState}, composer}`.
- Rows: `RowState = User | Working | Assistant | Hire` (`kind` discriminates). `StepViewState`, `PanelState`.
- `layoutAt(frame): ChatLayout {rows: {row, top, height}[], scrollY, panelWidth, chatW, colW, columnX}` — absolute row tops in logical UI px with the scroll applied (this is what anchors use).
- `scrollAt(frame)`, `panelWidthAt(frame)`, `HIRE_CARD_W` (672: the Hire Review card takes the message column width while the panel is open).
- Auto-scroll: critically damped follower (omega 0.28) towards "bottom of the content, keeping the newest row's top at least 120 px below the header". It is precomputed ONCE as a Float64Array over all frames, so any frame renders identically on any worker.
- Row heights are ESTIMATED (no DOM): user rows from char count, assistant rows from `estimateMarkdownHeight`, hire row from `HIRE`. The estimates were checked against the real DOM (see Verified).

**src/config/anchors.ts**
- `anchorsAt(frame): Anchors` (logical UI px; add `UI_OFFSET` for stage px): `textarea, sendButton, pauseButton, resumeButton, modeButton, modeMenu, modeMenuRow(i), reviewHires, hireCard, approveButton, editButton, saveTemplate, searchField, searchClear, newChatButton, attachButton, attachmentChip, instantBadge, tierBadge, pausedBadge, panelGraph, panelSteps`. `null` = the control does not exist at this frame. `anchorPoint(rect, fx?, fy?)`.

**src/ui/ChatApp.tsx** `<ChatApp frame? rimAngle? rimIntensity? style? />` — ONE persistent component, 1440 x 810 logical. Pass `frame` (global) explicitly when it sits inside a `<Sequence>`. `<ChatAppView state />` draws an already computed `AppState`. Scenes (patches 08+) only add camera, cursor and overlays; they never rebuild UI.

**src/dev/DevApp.tsx** `DevApp`, `DEV_APP_FRAMES` (1501), props `{showAnchors?: boolean, measureRows?: boolean}`. Local frame = global film frame, so the guide's `--frame=330 ... 1400` work as written. `showAnchors` draws every `anchorsAt` rectangle over the DOM; `measureRows` logs estimated vs real row heights to the console.

**src/ui/HireReview.tsx** + `width?: number` (default 720); `hireReviewLayout(width = 720)`.

### Decisions and conventions
- The persistent app is driven by ONE function of the global frame. No Sequence-local state, no CSS transitions, no timers, no Math.random / Date.
- D3 / D4 data: `HIRE_ROLES` now follows Appendix D4 (security_auditor, code_reviewer, test_writer, fixer, report_writer; the patch 06 note about `responder` is resolved). The S4 graph uses nodes `security_auditor` and `code_reviewer` (added to `GraphNodeId` / `GRAPH_NODE_ORDER`, both children of the inspector).
- Sidebar auto-title (S2) types with real keystroke frames (`TITLE_TYPING`), so its caret follows the keystrokes.
- Routing card: while the router "thinks" it shows "routing…" (`fromTier: 'routing'`), then morphs into the tier text; the Tier 0 answer shows the instant summary.
- Hire Review card: designed 720 px wide for the panel-closed layout, but it only exists while the panel is open (message column = 672 px), where it was clipped on the right. It now takes `HIRE_CARD_W` = 672. `FOCUS_RECTS.hiresCard` (w 720) is therefore the panel-closed design size only.
- `Markdown` `CHAR_W` 7.3 -> 7.0 (average real Inter 14 px advance in this text). With 7.3 a 72-char paragraph that really fits on one line was estimated as two lines. Assistant bubble inner width = `0.8 * colW - 26`. User rows still use 7.3 (they matched).

### Verified
- `npx tsc --noEmit` passes (strict).
- DevApp stills at 330, 420, 700, 860, 990, 1140, 1262, 1400 (+ 352, 640, 1060, 1235, 1290, 1430 with the anchors overlay) with the sandbox Chromium: Tier 0 answer + sidebar auto-title, panel opening with the graph growing, step cards (done / running / flip), final answer with table, code block and the ✓ recheck note, mode menu with Expert checked, Hire Review (fits the column) and its mini-trace statuses, Paused / Resume, S5 empty chat with the panel closing.
- Row heights, estimate vs real DOM (`measureRows`): every row within 0.5 px, including the streaming heights of the long answer at frames 930, 960, 980, 1000, 1020, 1040 (e.g. 850 vs 850.5 final).
- Anchors line up with the DOM (hire card, save template, graph, steps, composer controls).

### Known issues
- The static `FOCUS_RECTS` (`assistantBadge`, `hiresCard`, `messageList`) do NOT follow the scrolled chat in S3 / S4. For a camera focus on a chat row use `layoutAt(frame)` / `anchorsAt(frame)` (they include the scroll), not `focusRect(...)`.
- `→` and `✓` are outside the Latin font subset; they render through the fallback font (looks right in stills, but check the final render if the glyph weight matters).
- The mode menu's "Expert" description (`Allow the full staffed ceiling`) wraps to a third line that is clipped by the row (ChatBox menu from patch 03; shorten the copy or raise the row height there).
- Not checked: motion in the Studio (stills only).

### Warnings for the next patches (08+)
- Never rebuild UI in a scene: mount `<ChatApp frame={globalFrame} />` once and put camera / cursor / callouts around it. Inside a `<Sequence>` ALWAYS pass `frame`.
- Cursor / callout targets: `anchorsAt(frame)` (logical UI px, + `UI_OFFSET` on the stage). Panel anchors (`saveTemplate`, `panelGraph`, `panelSteps`) are only valid while the panel is open (about 610-1400). Reference positions: sendButton {1340,753,84,41}; saveTemplate at 1056 {972,184,132,24}; Approve at 1244 {804,538,124,32}; Resume at 1262 {860,753,84,41}; searchField {12,96,232,26}; searchClear {219,101,16,16}; newChatButton {174,57,22,22}; attachButton {272,753,34,41}.
- The chat scrolls: row tops move (e.g. the hire card top is 231 at f1235 and 206 at f1244). Always ask `layoutAt` for the frame you need.
- Graph node centers for callouts: `graphNodeUiPoint(id)` (patch 06) — `security_auditor` and `code_reviewer` are included.
- Adding or changing script text means re-running `DevApp` with `{"measureRows":true}` to check the height estimates (`npx remotion still src/index.ts DevApp out/qa/x.png --frame=1100 --props='{"measureRows":true}'` and read the browser console).

---

## PATCH 08 — Master timeline, S0 Logo, S1 Reveal, scene stubs

### Files created / changed
```
REPLACED src/MiniMePromo.tsx          (the real master timeline; the patch-00 placeholder is gone)
CREATED  src/config/intro.ts          (S0 / S1 tunables: INTRO, LOCKUP, LOGO_BOUNDS, HEADLINE_LAYOUT, WINDOW_RISE)
CREATED  src/scenes/sceneTypes.ts     src/scenes/index.ts (barrel)
CREATED  src/scenes/S0Logo.tsx        src/scenes/S1Reveal.tsx            (real scenes)
CREATED  src/scenes/S2Instant.tsx     src/scenes/S3Team.tsx              src/scenes/S4Control.tsx
CREATED  src/scenes/S5Organized.tsx   src/scenes/S6Outro.tsx             (stubs, except S3Team: see below)
CREATED  src/scenes/s3/S3a.tsx        src/scenes/s3/S3b.tsx              src/scenes/s3/S3c.tsx   (stubs)
CHANGED  docs/PATCH_NOTES.md
```
`src/Root.tsx` is NOT changed: `MiniMePromo` and `MiniMePromo-Preview` already point at `./MiniMePromo`.

### Public API

**src/scenes/sceneTypes.ts**: `SceneOverlayProps {frame}` (GLOBAL frame), `GridOpacityFn (frame) => 0..1`, `WindowStyleFn (frame) => CSSProperties`.

**src/scenes/index.ts** (the only thing `MiniMePromo.tsx` imports from scenes)
- `ALL_CAMERA: CameraKeyframe[]`, `ALL_CURSOR: CursorWaypoint[]` (every `SN_CAMERA` / `SN_CURSOR` concatenated; S3 via `S3_CAMERA` / `S3_CURSOR`)
- `SCENE_OVERLAYS: {id, from, to, Overlay}[]`: an overlay is mounted for global frames `from..to` and receives `frame`. S0 `0..INTRO.lockupExitEnd` (208), S1 `120..239`, S2-S5 scene range + 30 f tail, S6 `1500..TOTAL_FRAMES`. Overlays hide themselves outside their own timing, so wide ranges are harmless.
- `gridOpacityAt(frame) = max(S0_GRID, S6_GRID)`, `windowStyleAt(frame)` = `S6_WINDOW(frame)` from f1500 when S6 provides one, otherwise `S1_WINDOW(frame)`.
- Re-exports every scene export and `sceneTypes`.

**Contract for every scene file** (names fixed): overlay component (`S2Instant`, `S3Team`, `S4Control`, `S5Organized`, `S6Outro`), `SN_CAMERA`, `SN_CURSOR`. S3 parts export `S3a/S3b/S3c` + `S3A_CAMERA/S3A_CURSOR` etc.; `S3Team.tsx` is final (patch 08) and concatenates them. S6 additionally exports `S6_GRID: GridOpacityFn` (stub returns 0) and `S6_WINDOW: WindowStyleFn | null` (stub null). Each stub carries a "STUB ... REPLACED in patch NN" comment.

**src/config/intro.ts** (all frames through `f()`): `INTRO {blackHold, drawStart, impact 60, hitDecay, hitAmount .02, wordmarkStart 70, wordmarkEnd 100, lockupStart 100, lockupEnd 119, lockupExit 186, lockupExitEnd 208, gridInStart/End 100/119, gridOutStart/End 200/239, backdropFadeStart/End 96/140, stageGlowStart/End 110/170, headlineLine1 124, headlineLine2 150, headlineExit/End 200/232, windowRise 160, windowFadeFrames 14, windowSettleStart/End 196/236, windowDim .5, windowBrightenStart/End 196/236, cameraPush 212, dofOn 240}`; `LOCKUP {centerX, heroY 540, restY 112, restScale .55, markSizeAlone 560, markSizeLockup 250, wordmarkSize 120, gapEm .3, strokePx 4}`; `LOGO_BOUNDS {x0, x1, y0, y1, viewBoxWidth}`; `HEADLINE_LAYOUT {centerY, fontSize 116, scrimWidth, scrimHeight, scrimAlpha}`; `WINDOW_RISE {fromY 140, scaleFrom .86, scaleTo .94, rotateXFrom 18, rotateXTo 6}`.

**src/scenes/S0Logo.tsx**: `S0Logo`, `S0_CAMERA = []`, `S0_CURSOR = []`, `S0_GRID`. **src/scenes/S1Reveal.tsx**: `S1Reveal`, `S1_CAMERA` (opening pose `fullWindow` padding 135 = zoom 1.0 with rotateY -4, push to padding 43 = zoom 1.227 at `INTRO.cameraPush`), `S1_CURSOR = []`, `S1_WINDOW`.

### Decisions and conventions
- The master timeline mounts the app from f120 (`SCENES.S1.start`) and drives it with the GLOBAL frame; `S1_WINDOW` keeps it at opacity 0 until f160 and returns the bare `{opacity: 1}` from f236, so every later scene works on a flat window with no transform or filter.
- Overlays are NOT in `<Sequence>`s (a Sequence makes `useCurrentFrame()` local). They are filtered by `SCENE_OVERLAYS` ranges and get `frame` as a prop. This replaces the guide's "overlays in Sequences".
- Overlays live in the Camera's SCREEN layer (never transformed, above the depth of field). The S0 lockup and the S1 headline are therefore not moved by the camera.
- `LOGO_BOUNDS` is the painted bounding box of the exact Appendix A paths with the group transform applied (computed once with an SVG path bbox: x 157.105..840.75, y 141..651.414). `S0Logo` centers and spaces the lockup on that box, not on the empty viewBox margin.
- Hero mark: `strokePx` 4 (the app's 2.5 px reads thin at 560 px). `markSizeAlone` 560 / `markSizeLockup` 250: the mark shrinks while the wordmark slides out (f70-100).
- Camera push: the 'camera' spring is 99.5% settled 25 f after its keyframe, so the push starts at f212 (not f205): it is 90% done at f225, 97% at f230 and 99.8% at f240, i.e. it lands on the f240 beat. (Starting at f205 finished about 10 f early.) The comment in S1Reveal.tsx says f212.
- Depth of field is off until f240 (`INTRO.dofOn`). With it on, the 1.2 px blur and 12% dim sit in the 43 px margin of the push-in frame, which is invisible at that point.
- The `#050505` opener backdrop is a full-stage layer under the camera that dissolves f96-140 into the stage gradient. The crimson stage glow (alpha .10-.18, drifting) fades in f110-170.

### Verified
- `npx tsc --noEmit` passes (strict).
- Stills rendered with a sandbox Chromium (headless shell 153) at f10, 30, 45, 60, 62, 80, 95, 119 (S0), f126, 140, 156, 168, 185, 200, 218, 239, 240 (S1/push), f330 and f1700 (later frames still render the persistent app through the stubs), and `MiniMePromo-Preview` f150 / f239 at 960x540.
  - S0: pen-draw outline, fill takeover, impact bloom on f60, wordmark emerging from the mark's right edge, lockup resting at the top with the grid floor fading in.
  - S1: headline words rising, `team.` crimson with underline, window rising dimmed with only Chat lit, lockup and headline blurring out, push-in lands flat at 92%.
- Determinism: f200 rendered twice is byte-identical.
- Camera numbers (`solveCameraAt`, no drift): zoom 1.0 until f212, 1.0480 at f215, 1.1527 at f220, 1.2029 at f225, 1.2266 at f240 (target 1.2271); rotateY -4 -> -0.008 at f240.

### Known issues
- Motion quality was not checked in the Studio (stills only): the window spring overshoot, the wordmark slide and the camera push should be scrubbed once.
- The two tiny start dots visible at about f10 are the round pen caps at the first stroke; they are the pen touching down. If they read as noise, start the draw 1-2 f later or hide the stroke until progress > 0.02 in `MiniMeLogo`.
- The first S1 camera keyframe is at f120, so the camera holds the opening pose (zoom 1, rotateY -4) through all of S0; nothing in S0 is in the world layer, so this is invisible.
- Stubs: S2-S6 add no camera, cursor, captions or callouts yet. After f240 the camera stays on the push-in pose and the app plays its scripted states (f330 shows the Tier 0 flow, f1700 the S5 end state) until patches 09-15 land.

### Warnings for the next patches (09+)
- A scene's first camera keyframe must be later than `INTRO.cameraPush` (212); S2 starts its move to `composer` at f240.
- `S6_WINDOW`, when it is non-null, takes over the window style from f1500. At f1499 the window is the bare identity style (`{opacity: 1}`), so start the S6 transform from the identity pose to avoid a jump.
- `S6_GRID` is combined with `S0_GRID` by `max`. Patch 15 only needs to return its own 0..1 fade.
- To add an overlay that must outlive its scene by more than 30 f, edit its `to` in `SCENE_OVERLAYS` (src/scenes/index.ts).

---

## PATCH 09 — S2 Instant (f240-479)

### Files created / changed
```
REPLACED src/scenes/S2Instant.tsx   (the patch-08 stub is gone: real camera, cursor and overlay)
CHANGED  src/config/focus.ts        (+ FOCUS_RECTS instantComposer, instantChat, instantAnswer)
CHANGED  docs/PATCH_NOTES.md
```
`src/scenes/index.ts`, `src/MiniMePromo.tsx` and the app / fx files are NOT changed. The three exports keep their patch-08 names, so the barrel and the master timeline pick the scene up unchanged.

### Public API

**src/scenes/S2Instant.tsx**: `S2Instant` (overlay, `SceneOverlayProps`), `S2_CAMERA: CameraKeyframe[]`, `S2_CURSOR: CursorWaypoint[]`. Every number is authored through `f()` or taken from `S2` in `script.ts`.

Camera (frame = the frame the move STARTS; the camera spring settles about 25 f later):

| start | target | padding | scaleBias | rotX / rotY | zoom on the 1080p frame (14 px chat text) |
|---|---|---|---|---|---|
| f240 | `instantComposer` | 72 | 1.07 | 1.5 / -2 | 1.60 -> 22.5 px |
| f322 (`S2.userIn - 4`) | `messageList` | 72 | 1.06 | 0 / 1.5 | 1.53 -> 21 px |
| f368 | `instantChat` | 63 | - | 0 / 1 | 1.30 -> 18.2 px |
| f405 | `instantAnswer` | 110 | 0.66 | - / 1.5 | 1.55 |
| f420 | `instantAnswer` | 110 | 0.755 | - / 2.5 | 1.78 -> 25 px (the slow push) |
| f455 | `instantChat` | 63 | - | 0 / 0 | 1.30 (the pull-back; this is the pose S2 ends on) |

Cursor (logical UI px, `CursorWaypoint`): enters at f240 from below-right (1404, 838, off the window), clicks the textarea at `S2.focus` (f258) at 66% of its width / vertical center (hover `'textarea'`, focus ring + ripple come from the app), slides to (1118, 690) at f300 and to (900, 330) at f348 where it rests through f479.

Overlay (all inside the camera's SCREEN layer, global `frame` prop):
- `Caption` `CAPTIONS.instant` ("Simple asks? Instant.") from f300 to `SCENES.S2.end - f(5)`.
- `KeyCap` starts at `S2.enter - KEYCAP_ENTER_FRAMES` (f320) so the press lands on the Enter at f324 (6 f hold); anchored to the Send button's horizontal center, 36 px above its top edge, `space: 'ui'` (it follows the camera, so it stays attached while the composer slides away).
- `Callout` `CALLOUTS.answeredInstantly` from f410 to f455, anchored to `anchorsAt(frame).instantBadge` (x + `BADGE_TEXT_END` 182, vertical center, `space: 'ui'`), side `right`, distance 96, shift -30. It renders nothing while the badge anchor is null.

**src/config/focus.ts**: `instantComposer {256, 620, 1184, 160}`, `instantChat {10, 130, 1380, 460}`, `instantAnswer {250, 150, 720, 340}` (logical UI px).

### Decisions and conventions
- Camera targets can only be named `FOCUS_RECTS`, and none of the existing ones gave the S2 shots, hence the three new rects (measured from `layoutAt` / `anchorsAt` of the S2 frames).
- Deviations from the guide's prompt: (1) the tilt up to the chat starts at f322, not f326: the spring is only 34% done after 4 f, so starting at f326 slid the user bubble in off-screen. (2) The caption rises at f300 (a beat), into the empty stage below the composer while the prompt types. (3) `messageList` zoom is 1.53 (guide said about 1.35) so the bubble text is 21 px. (4) The key cap is anchored to the Send button in UI space instead of a fixed stage point.
- Legibility: typing (22.5 px) and the answer push (25 px) meet the 22 px bar. The wide shot (`instantChat`, 18.2 px) is deliberately below it: fitting the sidebar title and the right-aligned user bubble together forces about 1.30; at 1.4 the bubble is cropped mid-sentence. The 22 px text moments are the ones that matter (typing, answer, badge).
- The sidebar auto-title (f374-420) stays in view in the periphery of the wide shot; the depth of field softens it (it is driven by `ChatApp`, the scene does not touch it).

### Verified
- `npx tsc --noEmit` passes (strict).
- Stills rendered with the sandbox Chromium at f258, 290, 325, 333, 336, 352, 362, 395, 420, 432, 470: legible composer close-up with focus ring and click ripple, the key cap on the Send button, Tier 0 badge + streaming answer + caption, the wide shot with sidebar title typing, the callout wiping in from its dot after "1.2s", the pull-back. At f333 (worst point of the tilt) the composer clears the caption.
- The whole S2 range (f236-480) rendered at low resolution with no warnings or errors. f420 rendered twice is byte-identical (MD5).
- Camera numbers checked numerically: no jumps at the keyframe handoffs.

### Known issues
- Motion was not scrubbed in the Studio and no contact sheet was made (the ffmpeg filter step failed on quoting): stills and numbers only. Scrub f240-479 once.
- `BADGE_TEXT_END` (182) is a hard-coded offset into the badge rect to land the callout dot after "1.2s". If `META_TEXT.instantElapsed` or the badge layout changes, re-tune it.
- The new `instant*` rects are static. They were measured at the S2 layout; if the S2 prompt / answer text or row heights change, re-run `DevApp` (`measureRows`) and re-check the framing.

### Warnings for the next patches (10+)
- S2 ends on the `instantChat` pose (padding 63, rotX 0, rotY 0) from its last keyframe at f455, settled by f480. The first S3 keyframe is at f480 (the guide's move back to `composer`), so it starts from that pose.
- The cursor rests at (900, 330) (UI px) from f348. S3's first waypoint (the composer click at f496) travels from there.
- `S2.nudge` scrolls the chat up 20 px permanently over f455-479, so S3 row positions are shifted: use `layoutAt` / `anchorsAt`, not static rects, for chat rows.
- The caption ends at `SCENES.S2.end - f(5)` (f474); S3 owns its own caption from f480.

## PATCH 10 — S3a Team: prompt, panel opens, Inspector, tier reveal (f480-699)

### Files created / changed
```
REPLACED src/scenes/s3/S3a.tsx   (the patch-08 stub is gone: real camera, cursor and overlay)
CHANGED  src/config/focus.ts     (+ FOCUS_RECTS teamPanel, teamInspector, teamBadge, teamReveal)
CHANGED  docs/PATCH_NOTES.md
```
`src/scenes/S3Team.tsx` is NOT changed: patch 08 already made it the real wrapper that concatenates S3A/S3B/S3C cameras and cursors. S3b and S3c stubs are untouched.

### Public API
**src/scenes/s3/S3a.tsx**: `S3a` (overlay, `SceneOverlayProps`), `S3A_CAMERA: CameraKeyframe[]`, `S3A_CURSOR: CursorWaypoint[]`.

Camera (frame = the frame the move STARTS; the spring settles about 25 f later):

| start | target | padding | scaleBias | rotX / rotY | zoom (14 px chat, 12 px panel) |
|---|---|---|---|---|---|
| f480 | `instantComposer` | 72 | 1.07 | 1.5 / -2 | 1.60 -> 22.4 px |
| f536 | `instantComposer` | 72 | 1.07 | 0.6 / 1.6 | orbit only (no zoom change), keeps the typing shot alive |
| f588 (`S3.userIn - 4`) | `messageList` | 72 | 1.06 | 0 / 1.5 | 1.53 -> 21.4 px |
| f606 (`S3.panel.open + 2`) | `teamPanel` | 72 | 1 | 0 / -2.5 | 1.95 -> 23.4 px (panel springs open inside this shot) |
| f624 | `teamInspector` | 110 | 0.9 | 0.5 / -2 | 2.04 -> 24.5 px (panel text) |
| f654 | `teamBadge` | 90 | 0.62 | 0 / 2 | 2.08 -> 25 px (tier badge morph) |
| f682 | `teamReveal` | 63 | 1.06 | 0 / 0.5 | 1.61 -> 22.5 px (wide: badge left, routing card + graph right) |

Cursor (logical UI px): click on the textarea at f490 (66% of its width, hover `'textarea'`; the focus ring is already on from S2), slides to (1160, 690) at f520 (out of the way of the typed text), rests under the Inspector card at f636 (hover id `'inspector-step'`), moves down into the still-empty step list (1364, 644) at f670, where S3b should continue.

Overlay (SCREEN layer, global `frame`):
- `Caption` `CAPTIONS.team` ("Big asks? A whole team." + sub "Specialists staffed automatically.") f510 -> f604 (`S3.panel.open`). It must be gone before the panel opens: later shots put the step cards where the caption sits.
- `KeyCap` starts at `S3.enter - KEYCAP_ENTER_FRAMES` (f586), anchored to the Send button (UI space).
- `Callout` `CALLOUTS.inspectorReads` f625-660, dot on the bottom edge of `stepCardRect(0)`, chip BELOW the card (side `bottom`): the chip sits in the empty step list, never over the card text.
- `Glow` bloom on the tier badge from `S3.reveal.glowPeak - 2` (f668), 28 f.
- `Callout` `CALLOUTS.tier3Team` f668-700 on the tier badge (dot after the elapsed time, `BADGE_TEXT_END` 196), side `right`. Renders nothing while `anchorsAt(frame).tierBadge` is null (before f656).

**src/config/focus.ts**: `teamPanel {760, 48, 680, 480}`, `teamInspector {900, 200, 540, 380}`, `teamBadge {262, 300, 520, 180}`, `teamReveal {256, 100, 1184, 380}`.

### Decisions and conventions
- Deviations from the guide: (1) the composer click is f490, not f496: `S3.focus` is f484 and typing starts f496; f490 lets the ripple land before the first key without fighting the camera move (focus is already on, so nothing else depends on it). (2) The "Tier 3 → specialist team" callout starts f668, not f660: its dot is measured from the finished badge, and at f664 the badge still reads "routing…", so the dot floated 60 px past it. (3) The caption leaves at f604 instead of living through the reveal (see above). (4) The step-card callout sits below the card, not beside it, because a side chip would cover the card's name text at this zoom.
- The cursor leaves the Inspector card at f670 so it never covers the expanded summary (f652-696).
- The tier-badge morph is shot close (teamBadge) and the routing-card text change ("Tier 3 · adaptive") is only visible from the f682 wide shot on.

### Verified
- `npx tsc --noEmit` passes (strict).
- Stills rendered at f496, 510, 590, 606, 620, 640, 650, 664, 668, 672, 676, 680, 688, 696, 700 with the sandbox Chromium. Typing is 22 px, the caption clears the composer, the key cap lands on Send, the Inspector callout clears the card, the badge callout clears the user bubble.
- f680 rendered twice is byte-identical (MD5). No Math.random, Date, setTimeout or CSS transitions in the file.

### Known issues
- Motion was not scrubbed in the Studio and no contact sheet video was made: stills and numbers only. Scrub f480-700 once.
- `messageList` at f588 is 21.4 px chat text, a hair under the 22 px bar (same shot as S2, and the text there is a one-line bubble).
- The zoom column above was first written from estimates; patch 11 recomputed every scale with `poseForKeyframe` and corrected the table. It also raised the `teamInspector` bias from 0.8 to 0.9 (1.81 -> 2.04) so the 12 px panel text clears 22 px; `teamInspector` Inspector callout chip still ends 82 px above the bottom edge.
- `BADGE_TEXT_END` (196) is a hard-coded offset to land the dot after the elapsed time. If the tier label or `META_TEXT` changes, re-tune it.
- The new `team*` rects are static, measured at the S3 layout (two-line user bubble at y 300, badge at y 386). If the prompt wraps differently, re-check them with `anchorsAt`.

### Warnings for the next patches (11+)
- S3a's last camera key is `teamReveal` at f682 (settles about f707). S3b's first key (f690, `workingPanel`) adds a step on top of it, so the handoff is continuous.
- The cursor rests at about (1364, 644) from f670. The Inspector card is expanded f652-706 (closes f696-706), which shifts the cards below it; use `stepCardRect(i)` only for collapsed lists.
- The chat is a two-column layout from f640 (panel 480 px, chat box 704 px).

## PATCH 11 — S3b Team: the run and the recheck (f690-915)

### Files created / changed
```
REPLACED src/scenes/s3/S3b.tsx   (the patch-08 stub is gone: real camera, cursor and overlay)
CHANGED  src/config/focus.ts     (+ FOCUS_RECTS teamRun, teamGraph, teamRecheck, teamTwoColumn)
CHANGED  src/scenes/s3/S3a.tsx   (teamInspector scaleBias 0.8 -> 0.9, zoom comment corrected; nothing else)
CHANGED  docs/PATCH_NOTES.md     (also corrects the zoom table of patch 10)
```
`src/scenes/S3Team.tsx` is NOT changed (it already concatenates S3A/S3B/S3C). The S3c stub is untouched.

### Public API
**src/scenes/s3/S3b.tsx**: `S3b` (overlay, `SceneOverlayProps`), `S3B_CAMERA: CameraKeyframe[]`, `S3B_CURSOR: CursorWaypoint[]`.

Camera (frame = the frame the move STARTS; the spring settles about 25 f later):

| start | target | padding | scaleBias | rotX / rotY | zoom (panel text 12 px / graph labels 11.4 px) |
|---|---|---|---|---|---|
| f690 | `teamRun` | 72 | 1 | 0.5 / -2.5 | 2.23 -> 26.8 / 25.4 px (routing card, graph, first step cards, chat strip on the left) |
| f736 | `teamGraph` | 72 | 0.78 | 0 / 1.5 | 2.21 -> 26.5 / 25 px (graph grows: strategist -> researcher + code_writer + worker pool) |
| f786 | `teamGraph` | 72 | 0.86 | 0.8 / 0.2 | 2.4 (camera maximum) -> 28.8 / 27 px (slow push while test_writer arrives) |
| f830 | `teamRecheck` | 72 | 1.05 | 0 / 1.5 | 1.82 -> 21.8 / 20.7 px (whole graph + step list; lands on the flag at f856) |
| f888 | `teamTwoColumn` | 72 | 1 | 0 / 0.5 | 1.46 -> 17.5 px (pull-back: chat column left, panel right; settled by f913) |

Cursor (logical UI px): continues from S3a (rests near (1364, 644) from f670). It settles on the empty middle of the strategist card at f716 (hover id `'step-strategist'`) and follows the verifier card to f866 (hover id `'step-verifier'`, where the card sits after its scroll). Both targets are computed from the same app state the panel draws (`stepCardAt`), never typed in.

Overlay (SCREEN layer, global `frame`):
- `Callout` `CALLOUTS.verifierSendsBack` f862-f892, dot at the left edge of the verifier step card (follows the card as the list scrolls: `stepCardAt(frame, 'verifier')`), side `left`, so the chip sits over the empty lower part of the chat column and never over the card.
- `Glow` success bloom on the Output node (graph slot position, UI space) from f916, 30 f, intensity 0.75, crimson (the Glow component has no other color; the node's own ring turns green at f920 from the app state).
- The amber recheck edge, the error-tinted verifier card (6 f), the "-> sent back to recheck code_writer" note, the re-run flip and the converging particle streams all come from `ChatApp` / `script.ts`: this scene only frames them.

**src/config/focus.ts**: `teamRun {760, 150, 680, 420}`, `teamGraph {880, 200, 560, 330}`, `teamRecheck {760, 240, 680, 540}`, `teamTwoColumn {256, 88, 1184, 640}` (logical UI px).

### Decisions and conventions
- Graph node positions in UI space: slot `panelLayout().graph` + `graphFit()` offset + (node - viewBox) * scale (1.0364). `S3b.tsx` has a private `graphNodeUi(id)`; if S3c needs a graph point (the "Every step traced" callout), copy or lift it into `anchors.ts`.
- `stepCardAt(frame, key)` (private to S3b) sums `stepCardHeight()` of the cards above and subtracts `stepsScrollY`. It is exact for the S3 run (checked against stills).
- Deviations from the guide's prompt: (1) the recheck shot is a wide `teamRecheck` (graph + step list together, 21.8 px) instead of the step-card list alone: the amber edge and the verifier card have to be in one frame to make the point. (2) The callout is anchored to the verifier STEP CARD (chip over the chat) instead of the amber edge: every free spot near the graph edge is covered by nodes or the pool label. (3) The Output bloom is crimson, not green (see above).
- No frame holds still longer than about 1.5 s: the camera keys are 46, 50, 44 and 58 frames apart, with orbit / push between them.

### Verified
- `npx tsc --noEmit` passes (strict).
- Stills rendered with the sandbox Chromium at f640, 650, 700, 740, 800, 850, 866, 872, 878, 890, 905, 916, 924. Graph labels read at 25 px or more during the growth, the recheck shot shows the amber edge, the error ring on the verifier and the note together, the callout chip clears the card, the pull-back shows both columns.
- f878 rendered twice is byte-identical (MD5). No Math.random, Date, timers or CSS transitions in `src/scenes/s3/`.

### Known issues
- Motion was not scrubbed in the Studio: stills and numbers only. Scrub f690-916 once, especially the handoffs at f830 and f888.
- At f830-856 the top of the graph (market_researcher label) sits at the very edge of the frame; it is in the depth-of-field periphery.
- The pull-back (f888+) is a 17.5 px shot. Legibility of the final answer is S3c's job (it zooms back in at f916).
- The `team*` rects are static, measured at the S3 layout. If the graph layout or step text changes, re-check them.

### Warnings for the next patch (12)
- S3b ends settled on `teamTwoColumn` (padding 72, rotY 0.5). S3c's first key (about f916) starts from it.
- The cursor rests on the verifier card at about (1232, 685) from f866. S3c must travel it to "Save as template" (`anchorsAt(frame).saveTemplate`) for the f1056 click.
- From f916 the answer streams into the chat column (left); the bloom is a screen-layer overlay that ends at f946.
