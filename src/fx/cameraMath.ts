/**
 * MiniMe promo — camera math (pure functions, no React, fully deterministic).
 *
 * Pipeline
 *   1. resolveKeyframes():  each CameraKeyframe -> a POSE (what the camera looks at, zoom, tilt, focus rect).
 *   2. solveCameraAt():     pose at a frame = first pose + the sum of one spring STEP per later keyframe.
 *   3. cameraTransform():   the CSS transform string for the camera's world layer.
 *   4. project*():          where a stage/UI point lands on screen (used by callouts, glow, cursor sizing).
 *
 * Why a sum of steps: pose(t) = pose0 + sum_k (pose_k - pose_{k-1}) * step(t - frame_k). Every step starts
 * at exactly 0 with zero velocity, so when a new keyframe begins while the previous spring is still
 * settling, value AND velocity stay continuous. That is what makes handoffs jitter-free.
 * Zoom is blended in log space so a zoom feels constant-speed instead of rushing at the end.
 */
import {
  CAMERA_DRIFT,
  CAMERA_LIMITS,
  CAMERA_PERSPECTIVE,
  type CameraKeyframe,
} from '../config/camera';
import {FOCUS_RECTS, type FocusName, type FocusRect} from '../config/focus';
import {FPS, STAGE, UI_OFFSET, sceneAt} from '../config/timeline';
import {clamp01} from '../lib/ease';
import {spr, sprDuration} from '../lib/spring';

export type FocusRectMap = Readonly<Record<FocusName, FocusRect>>;
export type StageRect = {x: number; y: number; w: number; h: number};

/** Everything that defines a camera shot. All positions are in STAGE pixels (1920x1080). */
export type CameraPose = {
  /** Stage point the camera looks at; it lands on the center of the screen. */
  cx: number;
  cy: number;
  /** Natural log of the zoom factor. */
  logScale: number;
  /** Tilt in degrees. */
  rotX: number;
  rotY: number;
  rotZ: number;
  /** The focus rectangle (stage px, before the camera transform) used for the depth-of-field mask. */
  fx: number;
  fy: number;
  fw: number;
  fh: number;
};

/** A pose at one frame plus the derived zoom and the micro-drift. */
export type CameraState = CameraPose & {
  scale: number;
  driftX: number;
  driftY: number;
  frame: number;
};

export type ResolvedKeyframe = {
  frame: number;
  pose: CameraPose;
  ease?: (t: number) => number;
};

const POSE_CHANNELS = [
  'cx',
  'cy',
  'logScale',
  'rotX',
  'rotY',
  'rotZ',
  'fx',
  'fy',
  'fw',
  'fh',
] as const satisfies readonly (keyof CameraPose)[];

/** The neutral camera: zoom 1, no tilt, looking at the stage center. */
export const IDENTITY_POSE: CameraPose = {
  cx: STAGE.width / 2,
  cy: STAGE.height / 2,
  logScale: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  fx: 0,
  fy: 0,
  fw: STAGE.width,
  fh: STAGE.height,
};

/** Frames the camera spring needs to settle (use it to schedule a move so it lands on a beat). */
export const CAMERA_SETTLE_FRAMES = sprDuration(FPS, 'camera');

/** After this many frames a step is treated as complete (residual < 1e-8, invisible). */
const STEP_COMPLETE_FRAMES = CAMERA_SETTLE_FRAMES * 4;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toRad = (deg: number): number => (deg * Math.PI) / 180;

// ------------------------------------------------------------------- resolving
/** UI-logical rectangle -> stage rectangle. */
export const uiRectToStage = (rect: FocusRect): StageRect => ({
  x: rect.x + UI_OFFSET.x,
  y: rect.y + UI_OFFSET.y,
  w: rect.w,
  h: rect.h,
});

const tiltLimits = (frame: number) =>
  CAMERA_LIMITS.extendedScenes.includes(sceneAt(frame))
    ? CAMERA_LIMITS.extended
    : CAMERA_LIMITS.normal;

/** Solve one keyframe into a pose: fit the target into the stage minus padding, apply bias and limits. */
export const poseForKeyframe = (
  keyframe: CameraKeyframe,
  rects: FocusRectMap = FOCUS_RECTS,
): CameraPose => {
  const target = uiRectToStage(rects[keyframe.target]);
  const fitWidth = Math.max(1, STAGE.width - 2 * keyframe.padding);
  const fitHeight = Math.max(1, STAGE.height - 2 * keyframe.padding);
  const fit = Math.min(fitWidth / target.w, fitHeight / target.h);
  const scale = clamp(fit * keyframe.scaleBias, CAMERA_LIMITS.minScale, CAMERA_LIMITS.maxScale);
  const limits = tiltLimits(keyframe.frame);

  return {
    cx: target.x + target.w / 2,
    cy: target.y + target.h / 2,
    logScale: Math.log(scale),
    rotX: clamp(keyframe.rotateX, -limits.rotateX, limits.rotateX),
    rotY: clamp(keyframe.rotateY, -limits.rotateY, limits.rotateY),
    rotZ: clamp(keyframe.rotateZ, -limits.rotateZ, limits.rotateZ),
    fx: target.x,
    fy: target.y,
    fw: target.w,
    fh: target.h,
  };
};

/** Sort (stable) and solve every keyframe. An empty list gives the neutral camera. */
export const resolveKeyframes = (
  keyframes: readonly CameraKeyframe[],
  rects: FocusRectMap = FOCUS_RECTS,
): ResolvedKeyframe[] => {
  if (keyframes.length === 0) {
    return [{frame: 0, pose: IDENTITY_POSE}];
  }
  return keyframes
    .map((keyframe, index) => ({keyframe, index}))
    .sort((a, b) => a.keyframe.frame - b.keyframe.frame || a.index - b.index)
    .map(({keyframe}) => ({
      frame: keyframe.frame,
      pose: poseForKeyframe(keyframe, rects),
      ease: keyframe.ease,
    }));
};

// --------------------------------------------------------------------- solving
/** 0..1 progress of one camera step that started at `startFrame` (spring, or the keyframe's own ease). */
const stepProgress = (
  frame: number,
  startFrame: number,
  ease?: (t: number) => number,
): number => {
  const local = frame - startFrame;
  if (local <= 0) {
    return 0;
  }
  if (ease) {
    return ease(clamp01(local / CAMERA_SETTLE_FRAMES));
  }
  if (local >= STEP_COMPLETE_FRAMES) {
    return 1;
  }
  return spr(frame, FPS, startFrame, 'camera');
};

/** Micro-drift in stage px at a frame. */
export const cameraDrift = (frame: number): {x: number; y: number} => {
  const seconds = frame / FPS;
  return {
    x: CAMERA_DRIFT.px * Math.sin((2 * Math.PI * seconds) / CAMERA_DRIFT.periodSecondsX + CAMERA_DRIFT.phaseX),
    y: CAMERA_DRIFT.px * Math.sin((2 * Math.PI * seconds) / CAMERA_DRIFT.periodSecondsY + CAMERA_DRIFT.phaseY),
  };
};

/** The full camera state at `frame`. `resolved` must come from resolveKeyframes() (it is sorted). */
export const solveCameraAt = (
  frame: number,
  resolved: readonly ResolvedKeyframe[],
  options: {drift?: boolean} = {},
): CameraState => {
  const pose: CameraPose = {...resolved[0].pose};

  for (let k = 1; k < resolved.length; k++) {
    const weight = stepProgress(frame, resolved[k].frame, resolved[k].ease);
    if (weight === 0) {
      break; // sorted by frame: every later step has not started either
    }
    for (const channel of POSE_CHANNELS) {
      pose[channel] += (resolved[k].pose[channel] - resolved[k - 1].pose[channel]) * weight;
    }
  }

  const drift = options.drift === false ? {x: 0, y: 0} : cameraDrift(frame);
  return {
    ...pose,
    scale: Math.exp(pose.logScale),
    driftX: drift.x,
    driftY: drift.y,
    frame,
  };
};

/** The neutral state (zoom 1, centered, no tilt, no drift). Default for components outside a <Camera>. */
export const IDENTITY_STATE: CameraState = solveCameraAt(0, resolveKeyframes([]), {drift: false});

// ------------------------------------------------------------------- transform
const fmt = (value: number): string => value.toFixed(5);

/**
 * CSS transform for the world layer (transform-origin must be the stage center, 50% 50%).
 * Applied right to left: scale, translate (puts the looked-at point on the stage center), then the
 * tilt about that point, then perspective. So the camera orbits the thing it is looking at.
 */
export const cameraTransform = (state: CameraState): string => {
  const tx = -state.scale * (state.cx - STAGE.width / 2) + state.driftX;
  const ty = -state.scale * (state.cy - STAGE.height / 2) + state.driftY;
  return [
    `perspective(${CAMERA_PERSPECTIVE}px)`,
    `rotateX(${fmt(state.rotX)}deg)`,
    `rotateY(${fmt(state.rotY)}deg)`,
    `rotateZ(${fmt(state.rotZ)}deg)`,
    `translate3d(${fmt(tx)}px, ${fmt(ty)}px, 0)`,
    `scale(${fmt(state.scale)})`,
  ].join(' ');
};

// ------------------------------------------------------------------ projection
/**
 * Where a STAGE point (px, before the camera) ends up on screen. Same matrix order as the CSS
 * transform in cameraTransform(), including tilt and perspective, so overlays line up with the UI.
 */
export const projectStagePoint = (
  state: CameraState,
  x: number,
  y: number,
): {x: number; y: number} => {
  let vx = state.scale * (x - state.cx) + state.driftX;
  let vy = state.scale * (y - state.cy) + state.driftY;
  let vz = 0;

  // rotateZ
  const cz = Math.cos(toRad(state.rotZ));
  const sz = Math.sin(toRad(state.rotZ));
  [vx, vy] = [vx * cz - vy * sz, vx * sz + vy * cz];

  // rotateY
  const cy = Math.cos(toRad(state.rotY));
  const sy = Math.sin(toRad(state.rotY));
  [vx, vz] = [vx * cy + vz * sy, -vx * sy + vz * cy];

  // rotateX
  const cxr = Math.cos(toRad(state.rotX));
  const sx = Math.sin(toRad(state.rotX));
  [vy, vz] = [vy * cxr - vz * sx, vy * sx + vz * cxr];

  const w = Math.max(0.1, 1 - vz / CAMERA_PERSPECTIVE);
  return {x: STAGE.width / 2 + vx / w, y: STAGE.height / 2 + vy / w};
};

/** A point in the UI's logical 1440x810 space -> screen. */
export const projectUiPoint = (
  state: CameraState,
  x: number,
  y: number,
): {x: number; y: number} => projectStagePoint(state, x + UI_OFFSET.x, y + UI_OFFSET.y);

/** Bounding box on screen of a STAGE rectangle (all four corners projected). */
export const projectStageRect = (state: CameraState, rect: StageRect): StageRect => {
  const corners = [
    projectStagePoint(state, rect.x, rect.y),
    projectStagePoint(state, rect.x + rect.w, rect.y),
    projectStagePoint(state, rect.x, rect.y + rect.h),
    projectStagePoint(state, rect.x + rect.w, rect.y + rect.h),
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
};

/** Bounding box on screen of a rectangle given in the UI's logical space. */
export const projectUiRect = (state: CameraState, rect: FocusRect): StageRect =>
  projectStageRect(state, uiRectToStage(rect));
