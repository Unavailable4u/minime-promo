import React from 'react';
import {LAPTOP, type LaptopState} from '../../config/devices';
import {ACCENT} from '../../config/theme';
import {ScreenWake} from '../../fx/ScreenWake';
import {clamp01} from '../../lib/ease';
import {EdgeTrace} from './EdgeTrace';
import {GlassSheen} from './GlassSheen';

export type LaptopFrameProps = {
  state: LaptopState;
  /** Direction of the glass reflection in degrees (follows the device's rotation). */
  glassAngle: number;
  /** 0..1 position of the idle rim-light sweep or null. */
  sheen: number | null;
  /** The screen content: exactly the 1440x810 <ChatApp/> window. */
  children: React.ReactNode;
};

const W = LAPTOP.screenW;
const H = LAPTOP.screenH;
const BM = LAPTOP.bezel; // the lid box is laid out with the FINAL bezel; the plate inside it grows from 0
/**
 * A real keyboard layout (ANSI, 15 units wide): function row, number row, QWERTY row with a wide tab, a home row with
 * caps and a tall enter, a shift row, and the bottom row with a long space bar and the arrow cluster. Each entry is the
 * key width in units; `null` marks the half-height up / down arrows. Deterministic, pure SVG (no filters, no masks).
 */
const KEY_ROWS: readonly (readonly number[])[] = [
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], // esc, F1..F12, power
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], // ` 1 2 .. 0 - =, backspace
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], // tab, q .. ], backslash
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], // caps, a .. ', enter
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], // shift, z .. /, shift
  [1.25, 1.25, 1.25, 5.75, 1.25, 1.25], // ctrl, alt, cmd, SPACE, cmd, alt   (+ arrows below)
];
const KEY_PITCH = 70;
const KEY_GAP = 7;
const FN_ROW_H = 43;
const ROW_H = KEY_PITCH - KEY_GAP;
const KB_W = 15 * KEY_PITCH;
const KB_H = FN_ROW_H + 5 * (ROW_H + KEY_GAP) - KEY_GAP;

const Keyboard: React.FC = () => {
  const keys: React.ReactNode[] = [];
  let y = 0;
  KEY_ROWS.forEach((row, rowIndex) => {
    const h = rowIndex === 0 ? FN_ROW_H - KEY_GAP : ROW_H;
    let x = 0;
    row.forEach((units, keyIndex) => {
      const w = units * KEY_PITCH - KEY_GAP;
      keys.push(<rect key={`${rowIndex}-${keyIndex}`} x={x + KEY_GAP / 2} y={y} width={w} height={h} rx={7} fill="url(#kbKey)" />);
      x += units * KEY_PITCH;
    });
    if (rowIndex === KEY_ROWS.length - 1) {
      // arrow cluster: left and right full height, up / down half height each
      const half = (h - 4) / 2;
      keys.push(<rect key="al" x={x + KEY_GAP / 2} y={y} width={KEY_PITCH - KEY_GAP} height={h} rx={7} fill="url(#kbKey)" />);
      keys.push(<rect key="au" x={x + KEY_PITCH + KEY_GAP / 2} y={y} width={KEY_PITCH - KEY_GAP} height={half} rx={6} fill="url(#kbKey)" />);
      keys.push(<rect key="ad" x={x + KEY_PITCH + KEY_GAP / 2} y={y + half + 4} width={KEY_PITCH - KEY_GAP} height={half} rx={6} fill="url(#kbKey)" />);
      keys.push(<rect key="ar" x={x + 2 * KEY_PITCH + KEY_GAP / 2} y={y} width={KEY_PITCH - KEY_GAP} height={h} rx={7} fill="url(#kbKey)" />);
    }
    y += h + KEY_GAP;
  });
  return (
    <svg width={KB_W} height={KB_H} viewBox={`0 0 ${KB_W} ${KB_H}`} style={{display: 'block', overflow: 'visible'}}>
      <defs>
        <linearGradient id="kbKey" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2b30" />
          <stop offset="0.12" stopColor="#141518" />
          <stop offset="1" stopColor="#0b0b0d" />
        </linearGradient>
      </defs>
      {/* the key well: a darker recess behind the keys */}
      <rect x={0} y={-8} width={KB_W} height={KB_H + 8} rx={12} fill="#0a0a0c" opacity={0.55} />
      {keys}
    </svg>
  );
};

/**
 * The laptop: the existing 1440x810 window IS the screen. Around it: a black bezel that grows outward from the screen
 * edge, a camera dot, a rounded lid that tilts back on its hinge, a slim base that slides out from under the screen
 * with a keyboard deck, a trackpad and a front lip, and a metallic 1 px edge highlight.
 *
 * 3D: the root box is a 3D group (preserve-3d) holding two flat planes, the LID (tilting about its bottom edge) and the
 * BASE (lying on the floor, its back edge on the hinge). The lid and every plane are LEAF elements: filters, masks and
 * overflow:hidden live only inside them, never on an ancestor of a 3D child. The root box is laid out at the logical
 * screen size so the device pivot (the transform origin the stage uses) is the centre of the screen.
 */
export const LaptopFrame: React.FC<LaptopFrameProps> = ({state, glassAngle, sheen, children}) => {
  const k = clamp01(state.bezel / BM);
  const base = clamp01(state.base);
  const hingeY = H + BM; // y of the lid's bottom edge, in the root box
  const plateRadius = LAPTOP.screenRadius + (LAPTOP.lidRadius - LAPTOP.screenRadius) * k;
  const baseLeft = (W - LAPTOP.baseW) / 2;
  const depth = LAPTOP.baseDepth;

  return (
    <div style={{position: 'relative', width: W, height: H, transformStyle: 'preserve-3d'}}>
      {/* ------------------------------------------------------------ the base (deck on the floor, hinge at the lid) */}
      {base > 0.002 ? (
        <>
          {/* the keyboard deck: lies flat, its back edge on the hinge, growing toward the viewer */}
          <div
            style={{
              position: 'absolute',
              left: baseLeft,
              top: hingeY,
              width: LAPTOP.baseW,
              height: depth,
              transformOrigin: '50% 0%',
              transform: `rotateX(90deg) scaleY(${base.toFixed(4)})`,
              borderRadius: '2px 2px 26px 26px',
              // graphite aluminium: the SAME colour family as the lid shell (Samsung / Asus references: deck and lid match)
              background: 'linear-gradient(180deg, #1c1c20 0%, #3b3c43 7%, #54555d 50%, #46474e 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 -2px 0 rgba(255,255,255,0.16)',
            }}
          >
            {/* hinge shadow */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 34, background: 'linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0))'}} />
            {/* keys */}
            <div style={{position: 'absolute', left: (LAPTOP.baseW - KB_W) / 2, top: 40}}>
              <Keyboard />
            </div>
            {/* trackpad */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 40 + KB_H + 44,
                width: 540,
                height: 110,
                marginLeft: -270,
                borderRadius: 12,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.11), 0 1px 0 rgba(0,0,0,0.5)',
              }}
            />
          </div>
          {/* the front lip: a vertical strip of brushed metal under the deck's front edge, with the finger notch */}
          <div
            style={{
              position: 'absolute',
              left: baseLeft + 2,
              top: hingeY,
              width: LAPTOP.baseW - 4,
              height: LAPTOP.baseThickness,
              transform: `translateZ(${(depth * base).toFixed(2)}px)`,
              borderRadius: '0 0 18px 18px',
              background: 'linear-gradient(180deg, #8c8d96 0%, #4a4b52 22%, #2f3036 60%, #1b1b1f 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.40) inset',
            }}
          >
            <div style={{position: 'absolute', left: '50%', top: 0, width: 190, height: 5, marginLeft: -95, borderRadius: '0 0 10px 10px', background: 'rgba(0,0,0,0.6)'}} />
          </div>
          {/* the hinge: a barrel across the join of lid and deck, with a cap at each end, so the two parts read as ONE machine */}
          <div
            style={{
              position: 'absolute',
              left: baseLeft + 70,
              top: hingeY - 8,
              width: LAPTOP.baseW - 140,
              height: 18,
              transform: 'translateZ(5px)',
              borderRadius: 9,
              background: 'linear-gradient(180deg, #8a8b94 0%, #4a4b52 26%, #17171a 62%, #2c2d33 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 3px 6px rgba(0,0,0,0.55)',
            }}
          />
          <div style={{position: 'absolute', left: baseLeft + 40, top: hingeY - 6, width: 40, height: 14, transform: 'translateZ(4px)', borderRadius: '7px 0 0 7px', background: 'linear-gradient(180deg, #4a4b52, #1a1a1e)'}} />
          <div style={{position: 'absolute', left: baseLeft + LAPTOP.baseW - 80, top: hingeY - 6, width: 40, height: 14, transform: 'translateZ(4px)', borderRadius: '0 7px 7px 0', background: 'linear-gradient(180deg, #4a4b52, #1a1a1e)'}} />
        </>
      ) : null}

      {/* ------------------------------------------------------------ the lid (tilts back about its bottom edge) */}
      <div
        style={{
          position: 'absolute',
          left: -BM,
          top: -BM,
          width: W + 2 * BM,
          height: H + 2 * BM,
          transformOrigin: '50% 100%',
          transform: `rotateX(${state.lidTilt.toFixed(3)}deg)`,
        }}
      >
        {/* the housing + bezel plate: grows outward from the screen edge */}
        <div
          style={{
            position: 'absolute',
            left: BM - state.bezel,
            top: BM - state.bezel,
            width: W + 2 * state.bezel,
            height: H + 2 * state.bezel,
            borderRadius: `${plateRadius}px ${plateRadius}px ${(LAPTOP.screenRadius + (7 - LAPTOP.screenRadius) * k).toFixed(2)}px ${(LAPTOP.screenRadius + (7 - LAPTOP.screenRadius) * k).toFixed(2)}px`,
            background: 'linear-gradient(158deg, #3a3a41 0%, #1b1b1f 34%, #0b0b0d 100%)',
            boxShadow: `inset 0 0 0 ${Math.max(0, 1 * k).toFixed(2)}px rgba(255,255,255,0.20), inset 0 ${(2 * k).toFixed(2)}px 0 rgba(255,255,255,0.10), 0 0 0 ${(1 * k).toFixed(2)}px rgba(0,0,0,0.7)`,
          }}
        />
        {/* camera */}
        <div
          style={{
            position: 'absolute',
            left: (W + 2 * BM) / 2 - 3,
            top: BM / 2 - 3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #3b3f55 0%, #0b0b10 70%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
            opacity: k,
          }}
        />
        {/* the screen: the real 1440x810 window */}
        <div style={{position: 'absolute', left: BM, top: BM, width: W, height: H}}>{children}</div>
        <div style={{position: 'absolute', left: BM, top: BM, width: W, height: H}}>
          <GlassSheen width={W} height={H} radius={LAPTOP.screenRadius} angle={glassAngle} strength={k * 0.9} sweep={sheen} />
          <ScreenWake width={W} height={H} radius={LAPTOP.screenRadius} wake={1} markGlow={0} sweep={state.sweep} blip={state.blip} />
        </div>
        {/* the edge-light trace around the lid outline */}
        <EdgeTrace width={W + 2 * BM} height={H + 2 * BM} radius={LAPTOP.lidRadius} progress={state.trace} alpha={state.traceAlpha} stroke={3} />
        {/* a hairline crimson rim on the plate while it is being built (kept faint; the window has its own rim light) */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, color: ACCENT.base}} />
      </div>
    </div>
  );
};
