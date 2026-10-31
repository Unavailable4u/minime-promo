import React from 'react';
import {
  ANCHORS,
  DEVICE_PERSPECTIVE,
  FLOOR_Y,
  LAPTOP,
  PHONE,
  REST_POSES,
  STAGE_CENTER,
  TABLET,
  deviceStateAt,
  projectDevicePoint,
  type DeviceName,
  type Pose,
} from '../../config/devices';
import {mobileStateAt} from '../../config/mobileScript';
import {OUTRO} from '../../config/outro';
import {STAGE, f} from '../../config/timeline';
import {FloorGlow, FloorPlane} from '../../fx/FloorGlow';
import {SyncLines, type SyncLine} from '../../fx/SyncLines';
import {clamp01, ramp} from '../../lib/ease';
import {ChatApp} from '../ChatApp';
import {MobileApp} from '../mobile/MobileApp';
import {TabletApp} from '../TabletApp';
import {LaptopFrame} from './LaptopFrame';
import {PhoneFrame} from './PhoneFrame';
import {TabletFrame} from './TabletFrame';

export type DeviceStageProps = {
  /** GLOBAL film frame. */
  frame: number;
  /** Rim light of the laptop window (the film animates it with the camera). */
  rimAngle: number;
  /** Nav sweep of the laptop window (f1515-1560). */
  navSweep: number | null;
};

const css = (p: Pose): string =>
  `translate3d(${p.x.toFixed(3)}px, ${p.y.toFixed(3)}px, ${p.z.toFixed(3)}px) rotateX(${p.rx.toFixed(4)}deg) rotateY(${p.ry.toFixed(4)}deg) rotateZ(${p.rz.toFixed(4)}deg) scale(${p.s.toFixed(5)})`;

/** The reflection angle follows the yaw of the device (the reflection slides as the device turns). */
const glassAngle = (pose: Pose): number => 118 + pose.ry * 1.6 - pose.rz;

/** Idle rim-light sweep position 0..1 or null, one pass every `period` frames, with a per-device phase. */
const sheenAt = (frame: number, period: number, phase: number): number | null => {
  if (frame < OUTRO.floatStart + 60) {
    return null;
  }
  const local = (((frame + phase) % period) + period) % period;
  const p = local / (period * 0.45);
  return p > 1 ? null : p;
};

const DeviceSlot: React.FC<{device: DeviceName; pose: Pose; children: React.ReactNode}> = ({device, pose, children}) => {
  const w = device === 'laptop' ? LAPTOP.screenW : device === 'tablet' ? TABLET.screenW : PHONE.screenW;
  const h = device === 'laptop' ? LAPTOP.screenH : device === 'tablet' ? TABLET.screenH : PHONE.screenH;
  return (
    <div
      style={{
        position: 'absolute',
        left: STAGE_CENTER.x - w / 2,
        top: STAGE_CENTER.y - h / 2,
        width: w,
        height: h,
        transformOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
        transform: css(pose),
      }}
    >
      {children}
    </div>
  );
};

/** Contact shadow on the floor under a device; it breathes inversely to the lift of the idle float. */
const ContactShadow: React.FC<{device: DeviceName; pose: Pose; strength: number}> = ({device, pose, strength}) => {
  const rest = REST_POSES[device];
  const lift = Math.max(0, rest.y - pose.y);
  const k = clamp01(strength) * (1 - Math.min(0.45, lift / 160));
  if (k <= 0.002) {
    return null;
  }
  const w = (device === 'laptop' ? LAPTOP.baseW : device === 'tablet' ? TABLET.screenW + 60 : PHONE.screenW + 70) * pose.s * 1.08;
  const d = (device === 'laptop' ? LAPTOP.baseDepth * 1.5 : 300) * (device === 'laptop' ? 1 : pose.s);
  const z = device === 'laptop' ? pose.z + LAPTOP.baseDepth * 0.5 : pose.z;
  return (
    <FloorPlane
      x={pose.x}
      z={z}
      y={FLOOR_Y + 1}
      width={w}
      depth={d}
      background={`radial-gradient(ellipse closest-side, rgba(0,0,0,${(0.62 * k).toFixed(3)}) 0%, rgba(0,0,0,${(0.3 * k).toFixed(3)}) 55%, rgba(0,0,0,0) 100%)`}
    />
  );
};

/**
 * The device cluster (patch 15B): laptop (the real window), tablet and phone in ONE preserve-3d group with its own
 * perspective (independent from the camera). Only deviceStateAt(frame) decides where things are; the frames are dumb.
 * IMPORTANT: no filter / backdrop-filter / mask / overflow:hidden / opacity < 1 on any ANCESTOR of a 3D child. The
 * perspective box, the cluster box and every DeviceSlot are plain transformed boxes; those effects live only inside the
 * flat frame planes below them.
 */
export const DeviceStage: React.FC<DeviceStageProps> = ({frame, rimAngle, navSweep}) => {
  const s = deviceStateAt(frame);
  const phoneScript = mobileStateAt(frame);

  const laptopK = clamp01(s.laptop.bezel / LAPTOP.bezel);
  const windowStyle: React.CSSProperties = {
    // the window keeps its drop shadow until the bezel takes over (a 120 px shadow inside the lid would draw over the bezel)
    boxShadow: laptopK < 0.999 ? `0 40px 120px rgba(0, 0, 0, ${(0.65 * (1 - laptopK)).toFixed(3)}), 0 0 0 1px rgba(255, 255, 255, 0.04)` : '0 0 0 1px rgba(255, 255, 255, 0.04)',
  };

  // connector lines: anchored to the projected device edges
  const pt = (device: DeviceName, local: {x: number; y: number; z: number}, pose: Pose) => {
    const p = projectDevicePoint(pose, local, s.cluster);
    return {x: p.x, y: p.y};
  };
  const lines: SyncLine[] = s.phone.visible
    ? [
        {from: pt('laptop', ANCHORS.laptopRight, s.laptop.pose), to: pt('tablet', ANCHORS.tabletLeft, s.tablet.pose), bend: 40},
        {from: pt('tablet', ANCHORS.tabletTop, s.tablet.pose), to: pt('phone', ANCHORS.phoneTop, s.phone.pose), bend: 60},
        {from: pt('laptop', ANCHORS.laptopBase, s.laptop.pose), to: pt('phone', ANCHORS.phoneLeft, s.phone.pose), bend: -40},
      ]
    : [];

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: STAGE.width, height: STAGE.height, perspective: DEVICE_PERSPECTIVE, perspectiveOrigin: '50% 50%'}}>
      {/* connectors: a flat layer in the stage plane, BEHIND the cluster, alpha-light (decorative); they fade out before the final composition (f1748-1770) so no loose arc is left over the tablet */}
      <div style={{position: 'absolute', left: 0, top: 0, width: STAGE.width, height: STAGE.height, pointerEvents: 'none'}}>
        <SyncLines lines={lines} progress={s.connect} clock={s.clock} alpha={0.5 * (1 - ramp(frame, f(1748), f(1770)))} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: STAGE.width, height: STAGE.height, transformOrigin: '50% 50%', transformStyle: 'preserve-3d', transform: css(s.cluster)}}>
        <FloorGlow strength={s.floorGlow} x={260} z={120} y={FLOOR_Y} width={2600} depth={1500} />
        <ContactShadow device="laptop" pose={s.laptop.pose} strength={s.laptop.shadow} />
        {s.tablet.visible ? <ContactShadow device="tablet" pose={s.tablet.pose} strength={s.tablet.shadow} /> : null}
        {s.phone.visible ? <ContactShadow device="phone" pose={s.phone.pose} strength={s.phone.shadow} /> : null}

        <DeviceSlot device="laptop" pose={s.laptop.pose}>
          <LaptopFrame state={s.laptop} glassAngle={glassAngle(s.laptop.pose)} sheen={sheenAt(frame, 150, 20)}>
            <ChatApp frame={s.laptop.contentFrame} rimAngle={rimAngle} rimIntensity={0.55} style={windowStyle} navSweep={navSweep} />
          </LaptopFrame>
        </DeviceSlot>

        {s.tablet.visible ? (
          <DeviceSlot device="tablet" pose={s.tablet.pose}>
            <TabletFrame state={s.tablet} glassAngle={glassAngle(s.tablet.pose)} sheen={sheenAt(frame, 170, 90)}>
              <TabletApp contentFrame={s.tablet.contentFrame} />
            </TabletFrame>
          </DeviceSlot>
        ) : null}

        {s.phone.visible ? (
          <DeviceSlot device="phone" pose={s.phone.pose}>
            <PhoneFrame state={s.phone} glassAngle={glassAngle(s.phone.pose)} sheen={sheenAt(frame, 130, 40)}>
              <MobileApp state={phoneScript} contentFrame={s.phone.contentFrame} />
            </PhoneFrame>
          </DeviceSlot>
        ) : null}
      </div>
    </div>
  );
};
