import React from 'react';
import {TABLET, type DeviceCommon} from '../../config/devices';
import {ScreenWake} from '../../fx/ScreenWake';
import {EdgeTrace} from './EdgeTrace';
import {GlassSheen} from './GlassSheen';
import {METAL_BAND} from './PhoneFrame';

export type TabletFrameProps = {
  state: DeviceCommon;
  glassAngle: number;
  sheen: number | null;
  /** The 1180x820 screen content (<TabletApp/>). */
  children: React.ReactNode;
};

const B = TABLET.bezel;
const W = TABLET.screenW + 2 * B;
const H = TABLET.screenH + 2 * B;

/** Landscape tablet: thin bezel, r 38, metallic rim, camera dot. The body is a flat leaf plane (overflow is allowed inside it). */
export const TabletFrame: React.FC<TabletFrameProps> = ({state, glassAngle, sheen, children}) => (
  <div style={{position: 'absolute', left: -B, top: -B, width: W, height: H}}>
    {/* metal frame (same brushed titanium as the phone), then the black glass bezel */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: TABLET.bodyRadius,
        background: `linear-gradient(115deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 14%, rgba(255,255,255,0) 82%, rgba(255,255,255,0.3) 100%), ${METAL_BAND}`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.36), inset 0 0 0 2px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.85)',
      }}
    />
    <div style={{position: 'absolute', inset: 6, borderRadius: TABLET.bodyRadius - 6, background: '#050506', boxShadow: '0 0 0 0.75px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(255,255,255,0.07)'}} />
    <div style={{position: 'absolute', left: 8, top: H / 2 - 4, width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #3b3f55 0%, #0b0b10 70%)'}} />
    <div style={{position: 'absolute', left: B, top: B, width: TABLET.screenW, height: TABLET.screenH, borderRadius: TABLET.screenRadius, overflow: 'hidden', background: '#000'}}>
      {state.wake > 0.001 ? children : null}
      <GlassSheen width={TABLET.screenW} height={TABLET.screenH} radius={TABLET.screenRadius} angle={glassAngle} strength={1} sweep={sheen} />
      <ScreenWake width={TABLET.screenW} height={TABLET.screenH} radius={TABLET.screenRadius} wake={state.wake} markGlow={state.markGlow} />
    </div>
    <EdgeTrace width={W} height={H} radius={TABLET.bodyRadius} progress={state.trace} alpha={state.traceAlpha} />
  </div>
);
