import React from 'react';
import {LAPTOP, type LaptopState} from '../../config/devices';
import {ACCENT, FONTS} from '../../config/theme';
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
 * A full-size keyboard WITH numpad (Samsung / Asus references: the key block runs almost edge to edge of the deck, the
 * numpad sits right of the main block, the trackpad is centred under the MAIN block). Main block = 15 units wide,
 * a 0.5 unit gap, numpad = 4 units. Each entry is [width in units, legend]; a legend is a string or [shifted, base].
 * Deterministic, pure SVG (no filters, no masks); the legends are plain text in the vendored UI font.
 */
type Legend = string | readonly [string, string] | null;
type KeySpec = readonly [number, Legend];
const WIN = '@win';
const L = (...labels: Legend[]): Legend[] => labels;
const row = (widths: readonly number[], labels: readonly Legend[]): KeySpec[] => widths.map((w, i) => [w, labels[i] ?? null] as KeySpec);

const KEY_ROWS: readonly (readonly KeySpec[])[] = [
  row([1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], L('esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'del')),
  row([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], L(['~', '`'], ['!', '1'], ['@', '2'], ['#', '3'], ['$', '4'], ['%', '5'], ['^', '6'], ['&', '7'], ['*', '8'], ['(', '9'], [')', '0'], ['_', '-'], ['+', '='], 'backspace')),
  row([1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], L('tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', ['{', '['], ['}', ']'], ['|', '\\'])),
  row([1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], L('caps lock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', [':', ';'], ['"', "'"], 'enter')),
  row([2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], L('shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ['<', ','], ['>', '.'], ['?', '/'], 'shift')),
  row([1.25, 1.25, 1.25, 1.25, 5, 1.25, 1.25], L('ctrl', 'fn', WIN, 'alt', null, 'alt', 'ctrl')), // + the arrow cluster (3 units)
];
/** Numpad: rows 0..5 line up with the main rows; `rows` > 1 is a tall key (+ and enter). */
const NUMPAD: readonly {row: number; col: number; w: number; rows: number; label: Legend}[] = [
  {row: 0, col: 0, w: 1, rows: 1, label: 'home'}, {row: 0, col: 1, w: 1, rows: 1, label: 'end'}, {row: 0, col: 2, w: 1, rows: 1, label: 'ins'}, {row: 0, col: 3, w: 1, rows: 1, label: 'del'},
  {row: 1, col: 0, w: 1, rows: 1, label: 'num'}, {row: 1, col: 1, w: 1, rows: 1, label: '/'}, {row: 1, col: 2, w: 1, rows: 1, label: '*'}, {row: 1, col: 3, w: 1, rows: 1, label: '-'},
  {row: 2, col: 0, w: 1, rows: 1, label: '7'}, {row: 2, col: 1, w: 1, rows: 1, label: '8'}, {row: 2, col: 2, w: 1, rows: 1, label: '9'}, {row: 2, col: 3, w: 1, rows: 2, label: '+'},
  {row: 3, col: 0, w: 1, rows: 1, label: '4'}, {row: 3, col: 1, w: 1, rows: 1, label: '5'}, {row: 3, col: 2, w: 1, rows: 1, label: '6'},
  {row: 4, col: 0, w: 1, rows: 1, label: '1'}, {row: 4, col: 1, w: 1, rows: 1, label: '2'}, {row: 4, col: 2, w: 1, rows: 1, label: '3'}, {row: 4, col: 3, w: 1, rows: 2, label: 'enter'},
  {row: 5, col: 0, w: 2, rows: 1, label: '0'}, {row: 5, col: 2, w: 1, rows: 1, label: '.'},
];
const MAIN_UNITS = 15;
const PAD_GAP_UNITS = 0.5;
const PAD_UNITS = 4;
/** 19.5 units * 72 px = 1404 px of keys on a 1472 px deck: the key block takes 95 % of the deck width (it was 71 %). */
const KEY_PITCH = 72;
const KEY_GAP = 8;
const FN_ROW_H = 44;
const ROW_H = KEY_PITCH - KEY_GAP;
const KB_W = (MAIN_UNITS + PAD_GAP_UNITS + PAD_UNITS) * KEY_PITCH;
const KB_H = FN_ROW_H + 5 * (ROW_H + KEY_GAP) - KEY_GAP;
/** Where the main block ends (px) and its centre: the trackpad centres under the main block, like the references. */
const MAIN_CENTER_X = (MAIN_UNITS * KEY_PITCH) / 2;
const KEY_TOP = 50;
const LEGEND = 'rgba(232, 233, 240, 0.70)';
const LEGEND_DIM = 'rgba(232, 233, 240, 0.46)';

/** y and height of keyboard row r (the function row is slimmer). */
const rowY = (r: number): number => (r === 0 ? 0 : FN_ROW_H + (r - 1) * (ROW_H + KEY_GAP));
const rowH = (r: number): number => (r === 0 ? FN_ROW_H - KEY_GAP : ROW_H);

const KeyLegend: React.FC<{x: number; y: number; w: number; h: number; label: Legend}> = ({x, y, w, h, label}) => {
  if (label === null) {
    return null;
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  const font = {fontFamily: FONTS.body, fontWeight: 500} as const;
  if (label === WIN) {
    // the four-pane window mark, drawn (no glyph needed)
    const q = 7;
    return (
      <g fill={LEGEND} opacity={0.9}>
        <rect x={cx - q - 1} y={cy - q - 1} width={q} height={q} rx={1} />
        <rect x={cx + 1} y={cy - q - 1} width={q} height={q} rx={1} />
        <rect x={cx - q - 1} y={cy + 1} width={q} height={q} rx={1} />
        <rect x={cx + 1} y={cy + 1} width={q} height={q} rx={1} />
      </g>
    );
  }
  if (typeof label !== 'string') {
    // two legends: the shifted symbol above, the base character below (number row, punctuation)
    return (
      <g {...font} textAnchor="middle" fill={LEGEND}>
        <text x={cx} y={cy - 6} fontSize={16} fill={LEGEND_DIM}>
          {label[0]}
        </text>
        <text x={cx} y={cy + 17} fontSize={17}>
          {label[1]}
        </text>
      </g>
    );
  }
  const isWord = label.length > 1 && /^[a-zA-Z0-9 ]+$/.test(label) && !/^[A-Z]$/.test(label);
  const isFn = /^F\d+$/.test(label);
  const size = label.length === 1 ? 24 : isFn ? 14 : 15;
  const dy = label.length === 1 ? size * 0.35 : 5;
  const alignLeft = isWord && !isFn && (label === 'tab' || label === 'caps lock' || label === 'shift' || label === 'backspace' || label === 'enter') && w > 90;
  return (
    <text x={alignLeft ? (label === 'backspace' || label === 'enter' || (label === 'shift' && x > 700) ? x + w - 12 : x + 12) : cx} y={cy + dy} fontSize={size} textAnchor={alignLeft ? (label === 'backspace' || label === 'enter' || (label === 'shift' && x > 700) ? 'end' : 'start') : 'middle'} fill={isFn || label === 'esc' ? LEGEND_DIM : LEGEND} {...font}>
      {label}
    </text>
  );
};

const Keyboard: React.FC = () => {
  const caps: React.ReactNode[] = [];
  const legends: React.ReactNode[] = [];
  const cap = (id: string, x: number, y: number, w: number, h: number, label: Legend, r = 8) => {
    caps.push(<rect key={`k${id}`} x={x} y={y} width={w} height={h} rx={r} fill="url(#kbKey)" />);
    // a 1 px lit top edge on every cap (the chiclet's bevel), then the legend
    caps.push(<rect key={`h${id}`} x={x + 0.75} y={y + 0.75} width={w - 1.5} height={h - 1.5} rx={r - 0.75} fill="none" stroke="url(#kbEdge)" strokeWidth={1.5} />);
    legends.push(<KeyLegend key={`l${id}`} x={x} y={y} w={w} h={h} label={label} />);
  };

  // ---- main block
  KEY_ROWS.forEach((keys, r) => {
    let x = 0;
    keys.forEach(([units, label], i) => {
      cap(`${r}-${i}`, x + KEY_GAP / 2, rowY(r), units * KEY_PITCH - KEY_GAP, rowH(r), label);
      x += units * KEY_PITCH;
    });
    if (r === KEY_ROWS.length - 1) {
      // arrow cluster: left and right full height, up / down half height each (triangles drawn as shapes)
      const h = rowH(r);
      const half = (h - 4) / 2;
      const arrow = (id: string, ax: number, ay: number, ah: number, dir: 'l' | 'r' | 'u' | 'd') => {
        cap(id, ax, ay, KEY_PITCH - KEY_GAP, ah, null, dir === 'l' || dir === 'r' ? 8 : 6);
        const cx = ax + (KEY_PITCH - KEY_GAP) / 2;
        const cy = ay + ah / 2;
        const t = dir === 'u' || dir === 'd' ? 7 : 8;
        const pts = dir === 'l' ? `${cx + t / 1.4},${cy - t} ${cx + t / 1.4},${cy + t} ${cx - t},${cy}` : dir === 'r' ? `${cx - t / 1.4},${cy - t} ${cx - t / 1.4},${cy + t} ${cx + t},${cy}` : dir === 'u' ? `${cx - t},${cy + t / 2.2} ${cx + t},${cy + t / 2.2} ${cx},${cy - t / 1.6}` : `${cx - t},${cy - t / 2.2} ${cx + t},${cy - t / 2.2} ${cx},${cy + t / 1.6}`;
        legends.push(<polygon key={`a${id}`} points={pts} fill={LEGEND} opacity={0.85} />);
      };
      arrow('al', x + KEY_GAP / 2, rowY(r), h, 'l');
      arrow('au', x + KEY_PITCH + KEY_GAP / 2, rowY(r), half, 'u');
      arrow('ad', x + KEY_PITCH + KEY_GAP / 2, rowY(r) + half + 4, half, 'd');
      arrow('ar', x + 2 * KEY_PITCH + KEY_GAP / 2, rowY(r), h, 'r');
    }
  });

  // ---- numpad
  const padX = (MAIN_UNITS + PAD_GAP_UNITS) * KEY_PITCH;
  NUMPAD.forEach((k, i) => {
    const y = rowY(k.row);
    const h = k.rows === 1 ? rowH(k.row) : rowH(k.row) + KEY_GAP + rowH(k.row + 1);
    cap(`p${i}`, padX + k.col * KEY_PITCH + KEY_GAP / 2, y, k.w * KEY_PITCH - KEY_GAP, h, k.label);
  });

  return (
    <svg width={KB_W} height={KB_H} viewBox={`0 0 ${KB_W} ${KB_H}`} style={{display: 'block', overflow: 'visible'}}>
      <defs>
        <linearGradient id="kbKey" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2d33" />
          <stop offset="0.14" stopColor="#17181c" />
          <stop offset="1" stopColor="#0c0c0f" />
        </linearGradient>
        <linearGradient id="kbEdge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="0.35" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* the key well: a recessed black tray around the whole key block, with a hairline lit edge */}
      <rect x={-14} y={-14} width={KB_W + 28} height={KB_H + 28} rx={16} fill="#09090b" stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />
      {caps}
      {legends}
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
  // The deck is exactly as wide as the lid AT ANY MOMENT: it follows the growing bezel (final: 1440 + 2 * 16 = 1472 = LAPTOP.baseW).
  const deckW = W + 2 * state.bezel;
  const baseLeft = -state.bezel;
  const depth = LAPTOP.baseDepth;
  // lid and deck share the same corner radius where they meet, and the front corners of deck and lip match
  const HINGE_CORNER = 3;
  const FRONT_CORNER = 22;

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
              width: deckW,
              height: depth,
              transformOrigin: '50% 0%',
              transform: `rotateX(90deg) scaleY(${base.toFixed(4)})`,
              borderRadius: `${HINGE_CORNER}px ${HINGE_CORNER}px ${FRONT_CORNER}px ${FRONT_CORNER}px`,
              // graphite aluminium: the SAME colour family as the lid shell (Samsung / Asus references: deck and lid match)
              background: 'linear-gradient(180deg, #1c1c20 0%, #3b3c43 7%, #54555d 50%, #46474e 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 -2px 0 rgba(255,255,255,0.16)',
            }}
          >
            {/* hinge shadow */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 34, background: 'linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0))'}} />
            {/* keys: the block (main + numpad) is centred on the deck and takes about 95 % of its width */}
            <div style={{position: 'absolute', left: (deckW - KB_W) / 2, top: KEY_TOP}}>
              <Keyboard />
            </div>
            {/* trackpad: centred under the MAIN key block (not under the numpad), as on the references */}
            <div
              style={{
                position: 'absolute',
                left: (deckW - KB_W) / 2 + MAIN_CENTER_X,
                top: KEY_TOP + KB_H + 40,
                width: 660,
                height: 126,
                marginLeft: -330,
                borderRadius: 14,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.02))',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.13), 0 1px 0 rgba(0,0,0,0.5)',
              }}
            />
          </div>
          {/* the front lip: a vertical strip of brushed metal under the deck's front edge, the same width as the deck, with the finger notch */}
          <div
            style={{
              position: 'absolute',
              left: baseLeft + 3,
              top: hingeY,
              width: deckW - 6,
              height: LAPTOP.baseThickness,
              transform: `translateZ(${(depth * base).toFixed(2)}px)`,
              borderRadius: `0 0 ${FRONT_CORNER - 4}px ${FRONT_CORNER - 4}px`,
              background: 'linear-gradient(180deg, #8c8d96 0%, #4a4b52 22%, #2f3036 60%, #1b1b1f 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.40) inset',
            }}
          >
            <div style={{position: 'absolute', left: '50%', top: 0, width: 190, height: 5, marginLeft: -95, borderRadius: '0 0 10px 10px', background: 'rgba(0,0,0,0.6)'}} />
          </div>
          {/* the hinge: ONE strip across the full width of lid and deck (flush with both edges), a dark seam under the lid, and a metal barrel on top, so the two parts read as ONE machine */}
          <div
            style={{
              position: 'absolute',
              left: baseLeft,
              top: hingeY - 3,
              width: deckW,
              height: 6,
              transform: 'translateZ(3px)',
              borderRadius: HINGE_CORNER,
              background: 'linear-gradient(180deg, #050506, #0e0e11)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: baseLeft,
              top: hingeY + 1,
              width: deckW,
              height: 12,
              transform: 'translateZ(4px)',
              borderRadius: `${HINGE_CORNER}px ${HINGE_CORNER}px 6px 6px`,
              background: 'linear-gradient(180deg, #6f7079 0%, #4a4b52 34%, #25262b 78%, #2c2d33 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30), inset 1px 0 0 rgba(255,255,255,0.10), inset -1px 0 0 rgba(255,255,255,0.10)',
            }}
          />
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
            borderRadius: `${plateRadius}px ${plateRadius}px ${(LAPTOP.screenRadius + (HINGE_CORNER - LAPTOP.screenRadius) * k).toFixed(2)}px ${(LAPTOP.screenRadius + (HINGE_CORNER - LAPTOP.screenRadius) * k).toFixed(2)}px`,
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
