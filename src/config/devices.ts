/**
 * MiniMe promo — the multi-device outro (patch 15B): geometry, poses, timings and the pure state function.
 *
 *   deviceStateAt(frame): DeviceStageState      (pure; the components in src/ui/devices only draw it)
 *
 * Conventions
 *   - Every frame number is AUTHORED AT 30 fps and wrapped in f(). Beat = 15 f, bar = 60 f.
 *   - Poses are in WORLD px relative to the stage centre (960, 540); +x right, +y DOWN, +z toward the viewer.
 *     The CSS order is: translate3d(x, y, z) rotateX(rx) rotateY(ry) rotateZ(rz) scale(s), origin = the device pivot
 *     (the centre of its screen). The whole CLUSTER (all devices + the floor) sits inside one more such transform.
 *   - Each device is built at its LOGICAL screen size (laptop 1440x810, tablet 1180x820, phone 390x844) and scaled by
 *     `pose.s`, so the UI inside is always laid out in its own logical px.
 *   - A NEGATIVE cluster rx looks DOWN on the scene (the top of every upright device comes toward the viewer and the
 *     keyboard deck becomes visible). That is the "elevation" of the shot.
 *   - Nothing here reads the clock, a random source or the DOM.
 */
import {spring} from 'remotion';
import {clamp01, mapRange, ramp, signatureEase} from '../lib/ease';
import {FPS, f} from './timeline';
import {OUTRO_FLOAT} from './outro';

// ------------------------------------------------------------------ geometry
/** Perspective of the DeviceStage (independent from the camera's 1800 px). */
/** Long lens (product-shot look): a short lens magnifies the laptop's front edge far past the lid and makes the base look like a tray. */
export const DEVICE_PERSPECTIVE = 3400;
/** The stage centre = the perspective origin = the laptop pivot at f1500. */
export const STAGE_CENTER = {x: 960, y: 540} as const;

export const LAPTOP = {
  screenW: 1440,
  screenH: 810,
  /** Final bezel width (it grows from 0 at the cut). */
  bezel: 16,
  /** The AppWindow's own corner radius (the bezel plate starts with it and grows to lidRadius). */
  screenRadius: 14,
  lidRadius: 24,
  /**
   * Base (keyboard deck) width, depth toward the viewer and thickness. The deck is as wide as the lid (a real laptop),
   * and deep enough for a full keyboard + trackpad; the low camera elevation foreshortens it to a slim strip.
   */
  baseW: 1420,
  baseDepth: 620,
  baseThickness: 14,
  /** Lid tilt back in degrees, settled. */
  lidTilt: 8,
} as const;

export const TABLET = {screenW: 1180, screenH: 820, bezel: 22, bodyRadius: 38, screenRadius: 16} as const;
export const PHONE = {screenW: 390, screenH: 844, bezel: 13, bodyRadius: 60, screenRadius: 47} as const;

/** Y of the floor plane (under the laptop base), used by the contact shadows. */
export const FLOOR_Y = LAPTOP.screenH / 2 + LAPTOP.bezel + LAPTOP.baseThickness;

export type Pose = {x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number};
export type DeviceName = 'laptop' | 'tablet' | 'phone';

/** Half height of a device body in logical px (screen + bezel), before the pose scale. */
const halfBody = (device: DeviceName): number =>
  device === 'laptop' ? LAPTOP.screenH / 2 + LAPTOP.bezel : device === 'tablet' ? TABLET.screenH / 2 + TABLET.bezel : PHONE.screenH / 2 + PHONE.bezel;
const halfBodyW = (device: DeviceName): number =>
  device === 'laptop' ? LAPTOP.screenW / 2 + LAPTOP.bezel : device === 'tablet' ? TABLET.screenW / 2 + TABLET.bezel : PHONE.screenW / 2 + PHONE.bezel;

/** Tablet and phone stand on the floor with a small gap (the idle float lifts them a little more). */
const STAND_GAP = 20;
const standY = (device: DeviceName, s: number): number => FLOOR_Y - STAND_GAP - halfBody(device) * s;

/** The settled poses of the devices inside the cluster (the idle float rides on top of these). */
export const REST_POSES: Record<DeviceName, Pose> = {
  // Reference image 3: the laptop is the largest, the tablet stands BEHIND it on the right (about 75 % visible), the phone
  // stands in FRONT of the deck's right end (past the deck's front edge, so it never sits on the keys) and overlaps the
  // tablet's lower-left and only a sliver of the laptop screen.
  laptop: {x: 0, y: 0, z: 0, rx: 0, ry: -6, rz: 0, s: 1},
  tablet: {x: 1010, y: standY('tablet', 0.8), z: -230, rx: 0, ry: -18, rz: 0, s: 0.8},
  phone: {x: 840, y: standY('phone', 0.7), z: 470, rx: 0, ry: -12, rz: 0, s: 0.7},
};

/** The phone turns to the camera and comes forward while it is toured (f1672-1790). */
export const PHONE_TOUR_POSE: Pose = {x: 420, y: standY('phone', 0.92) - 18, z: 360, rx: 0, ry: -3, rz: 0, s: 0.92};

/** Where the tablet and the phone start their entrance (back-right on an arc, front-right). */
const TABLET_FROM: Pose = {x: 1750, y: -380, z: -900, rx: 8, ry: -62, rz: 6, s: 0.8};
const PHONE_FROM: Pose = {x: 1400, y: 520, z: 800, rx: -6, ry: -46, rz: 9, s: 0.7};

/** The cluster: identity until the laptop build, "build" (cluster shot), "final" (right 58 % of the frame). */
export const CLUSTER_IDENTITY: Pose = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1};
export const CLUSTER_BUILD: Pose = {x: -250, y: -20, z: 0, rx: -6, ry: 0, rz: 0, s: 0.8};

// ------------------------------------------------------------------ timings
export const DEVICE_TIMES = {
  // ----- laptop build (beat 104)
  laptopTraceStart: f(1560),
  traceFrames: f(18),
  traceFadeFrames: f(16),
  bezelStart: f(1560),
  bezelEnd: f(1584),
  yawStart: f(1560),
  yawEnd: f(1606),
  baseStart: f(1566),
  baseEnd: f(1596),
  lidSpringStart: f(1572),
  floorGlowStart: f(1566),
  floorGlowEnd: f(1604),
  /** The cluster pulls back and looks down (the cluster shot). */
  clusterStart: f(1560),
  clusterEnd: f(1608),
  /** Wake wipe: the content swap (S5 end state -> team state) happens at wakeSwap, under the blip. */
  wakeStart: f(1590),
  wakeSwap: f(1596),
  wakeEnd: f(1602),
  // ----- tablet (beat 108)
  tabletStart: f(1620),
  tabletTraceStart: f(1624),
  tabletWake: f(1638),
  wakeFrames: f(12),
  // ----- phone (beat 110)
  phoneStart: f(1650),
  phoneTraceStart: f(1654),
  impact: f(1650),
  hitDecay: f(6),
  hitAmount: 0.02,
  // ----- connectors
  connectStart: f(1680),
  connectEnd: f(1710),
  // ----- the phone tour pose (the camera follows it, see S6_CAMERA)
  tourIn: f(1672),
  tourInEnd: f(1696),
  tourOut: f(1762),
  tourOutEnd: f(1790),
  // ----- final composition (beat 118)
  finalStart: f(1770),
  // ----- idle float
  idleStart: f(1500),
  floatRamp: f(30),
} as const;

// ------------------------------------------------------------------ content-frame mapping
/** Laptop: S5 end state until the swap, then a compressed replay of the Tier 3 run (f690 -> f1040) at 1.7x. */
export const LAPTOP_CONTENT = {from: 690, to: 1040, rate: 1.7} as const;
/** Tablet: the same run, offset in time (starts later in the story and runs slower). */
export const TABLET_CONTENT = {from: 840, to: 1040, rate: 1.3} as const;
/** Phone panel drawer / chat read the finished run. */
export const PHONE_CONTENT_DONE = 1040;

export const laptopContentFrame = (frame: number): number =>
  frame < DEVICE_TIMES.wakeSwap
    ? frame
    : Math.min(LAPTOP_CONTENT.to, LAPTOP_CONTENT.from + (frame - DEVICE_TIMES.wakeSwap) * LAPTOP_CONTENT.rate);

export const tabletContentFrame = (frame: number): number =>
  Math.min(TABLET_CONTENT.to, TABLET_CONTENT.from + Math.max(0, frame - DEVICE_TIMES.tabletWake) * TABLET_CONTENT.rate);

// ------------------------------------------------------------------ small helpers
const TAU = Math.PI * 2;
const sine = (frame: number, period: number, phase: number): number => Math.sin((TAU * frame) / period + phase);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
  rz: lerp(a.rz, b.rz, t),
  s: lerp(a.s, b.s, t),
});

/** Spring with a visible overshoot, 0 before `start`, settles on exactly 1. */
const arcSpring = (frame: number, start: number): number =>
  frame <= start ? 0 : spring({frame: frame - start, fps: FPS, config: {damping: 13, stiffness: 92, mass: 1}});

/** The panel-preset spring (damping 22, stiffness 120): a decisive move with a soft settle (cluster slide). */
const panelSpring = (frame: number, start: number): number =>
  frame <= start ? 0 : spring({frame: frame - start, fps: FPS, config: {damping: 22, stiffness: 120, mass: 1}});

/** 0..1..0 impact pulse (up in 2 f, then an exponential decay). */
const impactHit = (frame: number): number => {
  const local = frame - DEVICE_TIMES.impact;
  if (local < -1) {
    return 0;
  }
  return clamp01((local + 2) / 2) * Math.exp(-Math.max(0, local) / DEVICE_TIMES.hitDecay);
};

/** Idle float amplitudes of one device: each device has its own period, phase and amplitude. */
type FloatSpec = {
  bob: number;
  bobPeriod: number;
  bobPhase: number;
  depth: number;
  depthPeriod: number;
  depthPhase: number;
  roll: number;
  rollPeriod: number;
  rollPhase: number;
  yaw: number;
  yawPeriod: number;
  yawPhase: number;
};

const FLOATS: Record<DeviceName, FloatSpec> = {
  laptop: {
    bob: OUTRO_FLOAT.bobPx,
    bobPeriod: OUTRO_FLOAT.bobPeriod,
    bobPhase: 0,
    depth: OUTRO_FLOAT.depthPx,
    depthPeriod: OUTRO_FLOAT.depthPeriod,
    depthPhase: OUTRO_FLOAT.depthPhase,
    roll: OUTRO_FLOAT.rollDeg,
    rollPeriod: OUTRO_FLOAT.rollPeriod,
    rollPhase: OUTRO_FLOAT.rollPhase,
    yaw: 0.6,
    yawPeriod: f(170),
    yawPhase: 0.3,
  },
  tablet: {bob: 11, bobPeriod: f(92), bobPhase: 1.7, depth: 30, depthPeriod: f(124), depthPhase: 2.4, roll: 0.45, rollPeriod: f(150), rollPhase: 1.1, yaw: 1.2, yawPeriod: f(190), yawPhase: 2.0},
  phone: {bob: 14, bobPeriod: f(70), bobPhase: 3.1, depth: 36, depthPeriod: f(98), depthPhase: 0.9, roll: 0.6, rollPeriod: f(116), rollPhase: 2.6, yaw: 1.6, yawPeriod: f(150), yawPhase: 1.2},
};

/** Bob is applied UPWARD only (a floating device lifts off its shadow, it never sinks into the floor). */
const floatOffset = (frame: number, spec: FloatSpec, amp: number): Pose => ({
  x: 0,
  y: -amp * spec.bob * (0.5 + 0.5 * sine(frame, spec.bobPeriod, spec.bobPhase)),
  z: amp * spec.depth * sine(frame, spec.depthPeriod, spec.depthPhase),
  rx: 0,
  ry: amp * spec.yaw * sine(frame, spec.yawPeriod, spec.yawPhase),
  rz: amp * spec.roll * sine(frame, spec.rollPeriod, spec.rollPhase),
  s: 0,
});

const addPose = (a: Pose, b: Pose): Pose => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z, rx: a.rx + b.rx, ry: a.ry + b.ry, rz: a.rz + b.rz, s: a.s + b.s});

// ------------------------------------------------------------------ projection (connectors, shadows, focus rectangles)
export type Vec3 = {x: number; y: number; z: number};

const rad = (d: number): number => (d * Math.PI) / 180;

/** One pose applied to a point (same order as the CSS: scale, rotateZ, rotateY, rotateX, translate). */
const applyPose = (pose: Pose, p: Vec3): Vec3 => {
  let x = p.x * pose.s;
  let y = p.y * pose.s;
  let z = p.z * pose.s;
  const cz = Math.cos(rad(pose.rz));
  const sz = Math.sin(rad(pose.rz));
  [x, y] = [x * cz - y * sz, x * sz + y * cz];
  const cy = Math.cos(rad(pose.ry));
  const sy = Math.sin(rad(pose.ry));
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cx = Math.cos(rad(pose.rx));
  const sx = Math.sin(rad(pose.rx));
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  return {x: x + pose.x, y: y + pose.y, z: z + pose.z};
};

/**
 * Local device point (px, relative to the device pivot, BEFORE the pose scale) -> stage screen px, through the device
 * pose, the cluster pose and the DeviceStage perspective. The result is where the point lands on the 1920x1080 stage
 * BEFORE the camera (the camera is a separate transform on top).
 */
export const projectDevicePoint = (pose: Pose, local: Vec3, cluster: Pose = CLUSTER_IDENTITY): {x: number; y: number; w: number} => {
  const world = applyPose(cluster, applyPose(pose, local));
  const w = Math.max(0.1, 1 - world.z / DEVICE_PERSPECTIVE);
  return {x: STAGE_CENTER.x + world.x / w, y: STAGE_CENTER.y + world.y / w, w};
};

/** Local outline points of a device body (corners of the body, plus the base corners for the laptop). */
export const devicePoints = (device: DeviceName): Vec3[] => {
  const hw = halfBodyW(device);
  const hh = halfBody(device);
  const body: Vec3[] = [
    {x: -hw, y: -hh, z: 0},
    {x: hw, y: -hh, z: 0},
    {x: hw, y: hh, z: 0},
    {x: -hw, y: hh, z: 0},
  ];
  if (device === 'laptop') {
    const y = LAPTOP.screenH / 2 + LAPTOP.bezel + LAPTOP.baseThickness;
    body.push({x: -LAPTOP.baseW / 2, y, z: LAPTOP.baseDepth}, {x: LAPTOP.baseW / 2, y, z: LAPTOP.baseDepth});
  }
  return body;
};

export type StageBox = {x: number; y: number; w: number; h: number};

const boxOf = (points: readonly {x: number; y: number}[]): StageBox => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
};

/** Bounding box on the stage of a device at a pose inside a cluster. */
export const deviceBox = (device: DeviceName, pose: Pose, cluster: Pose = CLUSTER_IDENTITY): StageBox =>
  boxOf(devicePoints(device).map((p) => projectDevicePoint(pose, p, cluster)));

/** Bounding box on the stage of the screen (without bezel and base) of a device. */
export const screenBox = (device: DeviceName, pose: Pose, cluster: Pose = CLUSTER_IDENTITY): StageBox => {
  const w = device === 'laptop' ? LAPTOP.screenW : device === 'tablet' ? TABLET.screenW : PHONE.screenW;
  const h = device === 'laptop' ? LAPTOP.screenH : device === 'tablet' ? TABLET.screenH : PHONE.screenH;
  const corners: Vec3[] = [
    {x: -w / 2, y: -h / 2, z: 0},
    {x: w / 2, y: -h / 2, z: 0},
    {x: w / 2, y: h / 2, z: 0},
    {x: -w / 2, y: h / 2, z: 0},
  ];
  return boxOf(corners.map((p) => projectDevicePoint(pose, p, cluster)));
};

const unionBox = (boxes: readonly StageBox[]): StageBox => {
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

/** Bounding box of all three devices at their rest poses inside a cluster pose. */
export const clusterBox = (cluster: Pose, phone: Pose = REST_POSES.phone): StageBox =>
  unionBox([deviceBox('laptop', REST_POSES.laptop, cluster), deviceBox('tablet', REST_POSES.tablet, cluster), deviceBox('phone', phone, cluster)]);

/**
 * Fit the cluster into a stage rectangle: keeps `base`'s rotations, solves the scale and the x / y shift so the
 * projected bounding box is centred in `target` and no larger than it (a few fixed-point steps; the perspective makes
 * the problem slightly non-linear, so one step is not enough).
 */
export const fitCluster = (base: Pose, target: StageBox): Pose => {
  let pose: Pose = {...base, x: 0, y: 0, s: 1};
  for (let i = 0; i < 8; i++) {
    const box = clusterBox(pose);
    const k = Math.min(target.w / box.w, target.h / box.h);
    pose = {...pose, s: pose.s * k};
    const moved = clusterBox(pose);
    pose = {
      ...pose,
      x: pose.x + (target.x + target.w / 2 - (moved.x + moved.w / 2)),
      y: pose.y + (target.y + target.h / 2 - (moved.y + moved.h / 2)),
    };
  }
  return pose;
};

/**
 * The final composition: the cluster on the right of the stage at a 3/4 angle, fitted into x 800-1850 / y 170-910. The box
 * keeps 70 px to the right edge of the frame so the idle float (tablet bob +-11 px, yaw) and the 2 % hit never touch it.
 */
export const CLUSTER_FINAL: Pose = fitCluster({...CLUSTER_IDENTITY, rx: -6, ry: -10}, {x: 800, y: 170, w: 1050, h: 740});

/**
 * Stage rectangles (BEFORE the camera) of the shots, for src/config/focus.ts. They use the rest poses inside
 * CLUSTER_BUILD (the idle float moves them by a few px only), and the phone tour pose for `phone`.
 */
export const DEVICE_SHOTS = {
  cluster: clusterBox(CLUSTER_BUILD),
  laptop: deviceBox('laptop', REST_POSES.laptop, CLUSTER_BUILD),
  tablet: deviceBox('tablet', REST_POSES.tablet, CLUSTER_BUILD),
  phone: screenBox('phone', PHONE_TOUR_POSE, CLUSTER_BUILD),
} as const;

// ------------------------------------------------------------------ state
export type DeviceCommon = {
  /** Mount the device at all (false before its entrance). */
  visible: boolean;
  /** Pose inside the cluster, including the idle float. */
  pose: Pose;
  /** Edge-light trace progress 0..1 (linear; the frame applies the signature ease) and its opacity 0..1. */
  trace: number;
  traceAlpha: number;
  /** 0 = the screen shows only the glowing mark, 1 = the real screen content. Linear; the frame draws the scan. */
  wake: number;
  /** Strength 0..1 of the glow on the power-on mark. */
  markGlow: number;
  /** The film frame the screen content is built from. */
  contentFrame: number;
  /** Contact-shadow strength 0..1. */
  shadow: number;
};

export type LaptopState = DeviceCommon & {
  /** Bezel width in px (0 .. LAPTOP.bezel). */
  bezel: number;
  /** 0..1 how far the base has slid out from under the screen. */
  base: number;
  /** Lid tilt back in degrees (overshoots, then settles on LAPTOP.lidTilt). */
  lidTilt: number;
  /** Wake wipe (content swap hidden under it): sweep 0..1 or null, brightness blip 0..1. */
  sweep: number | null;
  blip: number;
};

export type DeviceStageState = {
  /** The cluster pose (pull-back, elevation, the final slide) including the 2 % impact hit. */
  cluster: Pose;
  laptop: LaptopState;
  tablet: DeviceCommon;
  phone: DeviceCommon;
  /** 0..1 strength of the crimson floor glow. */
  floorGlow: number;
  /** 0..1..0 impact pulse (bloom + 2% hit). */
  hit: number;
  /** 0..1 draw-on of the connector lines; the particles travel while it is > 0. */
  connect: number;
  /** Frames since the connectors started (for the particles). */
  clock: number;
  /** 0..1 how far the phone is in its tour pose (the camera frames it). */
  tour: number;
};

export const deviceStateAt = (frame: number): DeviceStageState => {
  const T = DEVICE_TIMES;
  const floatAmp = ramp(frame, T.idleStart, T.idleStart + T.floatRamp);
  const t = frame - T.idleStart;

  // ---------------------------------------------------------------- cluster
  const build = ramp(frame, T.clusterStart, T.clusterEnd);
  const slide = Math.min(1, panelSpring(frame, T.finalStart));
  const clusterBase = lerpPose(lerpPose(CLUSTER_IDENTITY, CLUSTER_BUILD, build), CLUSTER_FINAL, slide);
  const hit = impactHit(frame);
  const cluster: Pose = {...clusterBase, s: clusterBase.s * (1 + T.hitAmount * hit)};

  // ---------------------------------------------------------------- laptop
  const yaw = ramp(frame, T.yawStart, T.yawEnd);
  const lidSpring = arcSpring(frame, T.lidSpringStart);
  const laptopRest = REST_POSES.laptop;
  // The laptop keeps the old S6 float (7 px bob / 24 px depth / 0.28 deg roll) and calms down once it has a base.
  const laptopAmp = floatAmp * lerp(1, 0.7, ramp(frame, T.baseStart, T.baseEnd));
  const laptopFloat = floatOffset(t, FLOATS.laptop, laptopAmp);
  // The laptop float is centred (+-bob) like the original window float, so the cut at f1500 stays seamless.
  const laptopPose = addPose(
    {...laptopRest, ry: laptopRest.ry * yaw},
    {...laptopFloat, y: laptopAmp * FLOATS.laptop.bob * sine(t, FLOATS.laptop.bobPeriod, FLOATS.laptop.bobPhase), ry: laptopFloat.ry * yaw},
  );
  const laptopTrace = clamp01((frame - T.laptopTraceStart) / T.traceFrames);
  const laptopTraceAlpha = 1 - ramp(frame, T.laptopTraceStart + T.traceFrames, T.laptopTraceStart + T.traceFrames + T.traceFadeFrames);

  // wake wipe: a specular sweep over wakeStart..wakeEnd and a 6 f brightness blip centred on the swap
  const sweepRaw = (frame - T.wakeStart) / Math.max(1, T.wakeEnd - T.wakeStart);
  const sweep = sweepRaw < 0 || sweepRaw > 1 ? null : signatureEase(sweepRaw);
  const blip = clamp01(1 - Math.abs(frame - T.wakeSwap) / f(3));

  const laptop: LaptopState = {
    visible: true,
    pose: laptopPose,
    trace: laptopTrace,
    traceAlpha: laptopTrace > 0 ? laptopTraceAlpha : 0,
    wake: 1,
    markGlow: 0,
    contentFrame: laptopContentFrame(frame),
    shadow: ramp(frame, T.baseStart - f(6), T.baseEnd),
    bezel: LAPTOP.bezel * ramp(frame, T.bezelStart, T.bezelEnd),
    base: ramp(frame, T.baseStart, T.baseEnd),
    lidTilt: LAPTOP.lidTilt * lidSpring,
    sweep,
    blip,
  };

  // ---------------------------------------------------------------- tablet
  const tabletArc = arcSpring(frame, T.tabletStart);
  const tabletArcRaw = clamp01((frame - T.tabletStart) / f(34));
  const tabletPose = addPose(
    lerpPose(TABLET_FROM, REST_POSES.tablet, tabletArc),
    // the arc: it swings up and over on its way in
    {x: 0, y: -170 * Math.sin(Math.PI * tabletArcRaw) * (1 - tabletArcRaw * 0.4), z: 0, rx: 0, ry: 0, rz: 0, s: 0},
  );
  const tabletFloat = floatOffset(Math.max(0, frame - T.tabletStart), FLOATS.tablet, ramp(frame, T.tabletStart + f(30), T.tabletStart + f(60)));
  const tabletWakeP = clamp01((frame - T.tabletWake) / T.wakeFrames);
  const tablet: DeviceCommon = {
    visible: frame >= T.tabletStart,
    pose: addPose(tabletPose, tabletFloat),
    trace: clamp01((frame - T.tabletTraceStart) / T.traceFrames),
    traceAlpha: frame > T.tabletTraceStart ? 1 - ramp(frame, T.tabletTraceStart + T.traceFrames, T.tabletTraceStart + T.traceFrames + T.traceFadeFrames) : 0,
    wake: tabletWakeP,
    markGlow: clamp01((frame - T.tabletStart - f(6)) / f(10)) * (1 - tabletWakeP),
    contentFrame: tabletContentFrame(frame),
    shadow: ramp(frame, T.tabletStart + f(8), T.tabletStart + f(36)),
  };

  // ---------------------------------------------------------------- phone
  const tour = ramp(frame, T.tourIn, T.tourInEnd) * (1 - ramp(frame, T.tourOut, T.tourOutEnd));
  const phoneArc = arcSpring(frame, T.phoneStart);
  const phoneArcRaw = clamp01((frame - T.phoneStart) / f(30));
  const phoneArrive = addPose(lerpPose(PHONE_FROM, REST_POSES.phone, phoneArc), {
    x: 0,
    y: 120 * Math.sin(Math.PI * phoneArcRaw) * (1 - phoneArcRaw * 0.3),
    z: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    s: 0,
  });
  const phoneFloatAmp = ramp(frame, T.phoneStart + f(26), T.phoneStart + f(56)) * (1 - 0.7 * tour);
  const phoneFloat = floatOffset(Math.max(0, frame - T.phoneStart), FLOATS.phone, phoneFloatAmp);
  const phone: DeviceCommon = {
    visible: frame >= T.phoneStart,
    pose: addPose(lerpPose(phoneArrive, PHONE_TOUR_POSE, tour), phoneFloat),
    trace: clamp01((frame - T.phoneTraceStart) / T.traceFrames),
    traceAlpha: frame > T.phoneTraceStart ? 1 - ramp(frame, T.phoneTraceStart + T.traceFrames, T.phoneTraceStart + T.traceFrames + T.traceFadeFrames) : 0,
    wake: 1,
    markGlow: 0,
    contentFrame: PHONE_CONTENT_DONE,
    shadow: ramp(frame, T.phoneStart + f(6), T.phoneStart + f(34)),
  };

  return {
    cluster,
    laptop,
    tablet,
    phone,
    floorGlow: ramp(frame, T.floorGlowStart, T.floorGlowEnd),
    hit,
    connect: ramp(frame, T.connectStart, T.connectEnd),
    clock: Math.max(0, frame - T.connectStart),
    tour,
  };
};

/** Edge anchors of each device (local px, before the scale), used by the connector lines. */
export const ANCHORS = {
  laptopRight: {x: LAPTOP.screenW / 2 + LAPTOP.bezel, y: -150, z: 0},
  laptopBase: {x: 560, y: LAPTOP.screenH / 2 + LAPTOP.bezel + 6, z: LAPTOP.baseDepth * 0.78},
  tabletTop: {x: 40, y: -(TABLET.screenH / 2 + TABLET.bezel), z: 0},
  tabletLeft: {x: -(TABLET.screenW / 2 + TABLET.bezel), y: -120, z: 0},
  phoneTop: {x: 0, y: -(PHONE.screenH / 2 + PHONE.bezel), z: 0},
  phoneLeft: {x: -(PHONE.screenW / 2 + PHONE.bezel), y: -200, z: 0},
} as const;

export const mapProgress = mapRange;
