import React from 'react';
import {ACCENT} from '../config/theme';
import {STAGE} from '../config/timeline';
import {clamp01} from '../lib/ease';

export type SyncPoint = {x: number; y: number};

export type SyncLine = {
  from: SyncPoint;
  to: SyncPoint;
  /** Vertical lift of the curve's control points in px (positive = the curve arcs upward). */
  bend: number;
};

export type SyncLinesProps = {
  lines: readonly SyncLine[];
  /** 0..1 draw-on of the curves (eased by the caller). 0 draws nothing. */
  progress: number;
  /** Frames since the connectors started: drives the travelling particles (linear motion). */
  clock: number;
  /** Particles per line. Default 3. */
  particles?: number;
  /** Frames one particle needs to travel a whole line. Default 150 (slow). */
  period?: number;
  /** Overall alpha of the lines (0.35-0.6 reads as decorative). Default 0.5. */
  alpha?: number;
};

type Cubic = {p0: SyncPoint; p1: SyncPoint; p2: SyncPoint; p3: SyncPoint};

const curveOf = (line: SyncLine): Cubic => {
  const dx = line.to.x - line.from.x;
  return {
    p0: line.from,
    p1: {x: line.from.x + dx * 0.45, y: line.from.y - line.bend},
    p2: {x: line.to.x - dx * 0.45, y: line.to.y - line.bend},
    p3: line.to,
  };
};

const pointAt = (c: Cubic, u: number): SyncPoint => {
  const k = 1 - u;
  const a = k * k * k;
  const b = 3 * k * k * u;
  const d = 3 * k * u * u;
  const e = u * u * u;
  return {x: a * c.p0.x + b * c.p1.x + d * c.p2.x + e * c.p3.x, y: a * c.p0.y + b * c.p1.y + d * c.p2.y + e * c.p3.y};
};

/**
 * Decorative connector curves between device edges (stage px, flat layer): a draw-on line, a node dot at each end and a few
 * slow particles travelling along the drawn part. It says nothing about the product (no data flows, no sync):
 * it only ties the three screens into one picture. Pure: props in, pixels out. Put it BEHIND the devices.
 */
export const SyncLines: React.FC<SyncLinesProps> = ({lines, progress, clock, particles = 3, period = 150, alpha = 0.5}) => {
  const p = clamp01(progress);
  if (p <= 0.001) {
    return null;
  }
  return (
    <svg
      width={STAGE.width}
      height={STAGE.height}
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible'}}
    >
      {lines.map((line, index) => {
        const c = curveOf(line);
        const d = `M ${c.p0.x.toFixed(2)} ${c.p0.y.toFixed(2)} C ${c.p1.x.toFixed(2)} ${c.p1.y.toFixed(2)}, ${c.p2.x.toFixed(2)} ${c.p2.y.toFixed(2)}, ${c.p3.x.toFixed(2)} ${c.p3.y.toFixed(2)}`;
        const dots: React.ReactNode[] = [];
        for (let i = 0; i < particles; i++) {
          // linear travel; each line has its own phase so the particles never march in step
          const u = (((clock + index * 37) / period + i / particles) % 1 + 1) % 1;
          if (u > p) {
            continue;
          }
          const at = pointAt(c, u);
          const edge = Math.min(u, p - u, 0.12) / 0.12;
          dots.push(<circle key={i} cx={at.x} cy={at.y} r={3.2} fill="#ffd1da" opacity={alpha * 1.4 * clamp01(edge)} />);
        }
        return (
          <g key={index}>
            <path d={d} fill="none" stroke={ACCENT.base} strokeOpacity={alpha * 0.45} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
            <path d={d} fill="none" stroke={ACCENT.base} strokeOpacity={alpha} strokeWidth={1.6} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
            <circle cx={c.p0.x} cy={c.p0.y} r={4.5} fill={ACCENT.base} opacity={alpha * clamp01(p * 6)} />
            <circle cx={c.p0.x} cy={c.p0.y} r={9} fill="none" stroke={ACCENT.base} strokeOpacity={alpha * 0.5 * clamp01(p * 6)} strokeWidth={1} />
            {p > 0.96 ? (
              <>
                <circle cx={c.p3.x} cy={c.p3.y} r={4.5} fill={ACCENT.base} opacity={alpha} />
                <circle cx={c.p3.x} cy={c.p3.y} r={9} fill="none" stroke={ACCENT.base} strokeOpacity={alpha * 0.5} strokeWidth={1} />
              </>
            ) : null}
            {dots}
          </g>
        );
      })}
    </svg>
  );
};
