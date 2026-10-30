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
