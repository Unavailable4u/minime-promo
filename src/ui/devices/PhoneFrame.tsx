import React from 'react';
import {PHONE, type DeviceCommon} from '../../config/devices';
import {FONTS} from '../../config/theme';
import {EdgeTrace} from './EdgeTrace';
import {GlassSheen} from './GlassSheen';
import {ScreenWake} from '../../fx/ScreenWake';

export type PhoneFrameProps = {
  state: DeviceCommon;
  glassAngle: number;
  sheen: number | null;
  /** The 390x844 screen content (<MobileApp/>). */
  children: React.ReactNode;
};

const B = PHONE.bezel;
/** Width of the metal frame band in px (the black glass bezel is the rest of B). */
const FRAME = 5;
/** Brushed titanium (shared with the tablet): light on the lit edges, dark in between. */
export const METAL_BAND = 'linear-gradient(145deg, #e2e2e8 0%, #a9a8b1 20%, #6d6c75 50%, #9c9ba4 78%, #d6d6dc 100%)';
const METAL_BUTTON_L = 'linear-gradient(90deg, #4d4c54 0%, #c9c8d0 55%, #7a7981 100%)';
const METAL_BUTTON_R = 'linear-gradient(90deg, #7a7981 0%, #c9c8d0 45%, #4d4c54 100%)';
const W = PHONE.screenW + 2 * B;
const H = PHONE.screenH + 2 * B;

const ICON = '#f5f5f5';

/** iOS-style cellular bars: four rounded bars, rising, bottom-aligned. */
const SignalIcon: React.FC = () => (
  <svg width={18} height={12} viewBox="0 0 18 12" style={{display: 'block'}}>
    {[4, 6.5, 9, 11.5].map((h, i) => (
      <rect key={i} x={i * 4.7} y={12 - h} width={3.2} height={h} rx={1} fill={ICON} />
    ))}
  </svg>
);

/** iOS-style Wi-Fi: two arcs and a wedge, all pointing up from one apex. */
const WifiIcon: React.FC = () => (
  <svg width={17} height={12} viewBox="0 0 17 12" style={{display: 'block'}}>
    <path d="M2.1 3.7 A9.6 9.6 0 0 1 14.9 3.7" fill="none" stroke={ICON} strokeWidth={2.1} strokeLinecap="round" />
    <path d="M4.4 6.3 A6.2 6.2 0 0 1 12.6 6.3" fill="none" stroke={ICON} strokeWidth={2.1} strokeLinecap="round" />
    <path d="M8.5 11.6 L6.6 9.4 A2.9 2.9 0 0 1 10.4 9.4 Z" fill={ICON} stroke={ICON} strokeWidth={0.6} strokeLinejoin="round" />
  </svg>
);

/** iOS-style battery: a translucent outline, a solid level fill, and the terminal nub on the right (the reference phone shows this, no bolt). */
const BatteryIcon: React.FC = () => (
  <svg width={27} height={13} viewBox="0 0 27 13" style={{display: 'block'}}>
    <rect x={0.5} y={0.5} width={23} height={12} rx={3.7} fill="none" stroke={ICON} strokeOpacity={0.4} />
    <rect x={2} y={2} width={20} height={9} rx={2.3} fill={ICON} />
    <path d="M25.1 4.5 V8.5 C26.1 8.15 26.8 7.4 26.8 6.5 C26.8 5.6 26.1 4.85 25.1 4.5 Z" fill={ICON} fillOpacity={0.5} />
  </svg>
);

/** Generic phone: r 60 body, pill cutout, side buttons, rim highlight, a minimal status bar (fictional 9:41) and a home bar. No brand. */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({state, glassAngle, sheen, children}) => (
  <div style={{position: 'absolute', left: -B, top: -B, width: W, height: H}}>
    {/* side buttons: metal, protruding 4 px, with a bright edge (reference 5) */}
    {[
      {top: 128, h: 30},
      {top: 188, h: 62},
      {top: 262, h: 62},
    ].map((b) => (
      <div key={b.top} style={{position: 'absolute', left: -4, top: b.top, width: 6, height: b.h, borderRadius: '3px 0 0 3px', background: METAL_BUTTON_L, boxShadow: '0 0 0 0.75px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.45)'}} />
    ))}
    <div style={{position: 'absolute', right: -4, top: 214, width: 6, height: 96, borderRadius: '0 3px 3px 0', background: METAL_BUTTON_R, boxShadow: '0 0 0 0.75px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.45)'}} />
    {/* the metal frame (brushed titanium band with a specular streak), then the black glass bezel inside it */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: PHONE.bodyRadius,
        background: `linear-gradient(115deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 16%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.35) 100%), ${METAL_BAND}`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.38), inset 0 0 0 2px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.85)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: FRAME,
        borderRadius: PHONE.bodyRadius - FRAME,
        background: '#050506',
        boxShadow: '0 0 0 0.75px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(255,255,255,0.07)',
      }}
    />
    <div style={{position: 'absolute', left: B, top: B, width: PHONE.screenW, height: PHONE.screenH, borderRadius: PHONE.screenRadius, overflow: 'hidden', background: '#000'}}>
      {state.wake > 0.001 ? children : null}
      {/* status bar + pill + home bar */}
      <div style={{position: 'absolute', left: 0, top: 0, width: PHONE.screenW, height: 56, pointerEvents: 'none'}}>
        <span style={{position: 'absolute', left: 34, top: 11, height: 34, lineHeight: '34px', fontFamily: FONTS.body, fontWeight: 600, fontSize: 16, letterSpacing: -0.2, color: '#f5f5f5'}}>9:41</span>
        <div style={{position: 'absolute', left: (PHONE.screenW - 118) / 2, top: 11, width: 118, height: 34, borderRadius: 17, background: '#000'}} />
        <div style={{position: 'absolute', right: 28, top: 11, height: 34, display: 'flex', gap: 6, alignItems: 'center'}}>
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </div>
      </div>
      <div style={{position: 'absolute', left: (PHONE.screenW - 134) / 2, top: PHONE.screenH - 14, width: 134, height: 5, borderRadius: 3, background: 'rgba(245,245,245,0.85)', pointerEvents: 'none'}} />
      <GlassSheen width={PHONE.screenW} height={PHONE.screenH} radius={PHONE.screenRadius} angle={glassAngle} strength={1} sweep={sheen} />
      <ScreenWake width={PHONE.screenW} height={PHONE.screenH} radius={PHONE.screenRadius} wake={state.wake} markGlow={state.markGlow} />
    </div>
    <EdgeTrace width={W} height={H} radius={PHONE.bodyRadius} progress={state.trace} alpha={state.traceAlpha} />
  </div>
);
