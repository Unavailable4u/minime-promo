import React from 'react';
import {ACCENT} from '../../config/theme';
import {clamp01, signatureEase} from '../../lib/ease';

export type EdgeTraceProps = {
  /** Outline box in the parent's px (the SVG is placed at 0,0 of the parent). */
  width: number;
  height: number;
  radius: number;
  /** 0..1 LINEAR progress of the highlight around the outline (this component applies the signature ease). */
  progress: number;
  /** 0..1 opacity of the whole trace. */
  alpha: number;
  /** Length of the comet tail as a fraction of the outline. Default 0.2. */
  tail?: number;
  /** Stroke width of the head in px. Default 3. */
  stroke?: number;
};

/**
 * The edge-light trace: a white-to-crimson highlight (a comet with a tail) that travels ONCE around a rounded-rect
 * outline. The outline is an SVG <rect pathLength=1>, so the dash maths is 0..1 and identical on every render worker.
 * A leaf element: it has no filter or mask, so it never flattens a 3D context.
 */
export const EdgeTrace: React.FC<EdgeTraceProps> = ({width, height, radius, progress, alpha, tail = 0.2, stroke = 3}) => {
  const a = clamp01(alpha);
  const p = clamp01(progress);
  if (a <= 0.001 || p <= 0.0005) {
    return null;
  }
  // the comet head runs from 0 to 1 + tail so the tail leaves the path at the end
  const head = signatureEase(p) * (1 + tail);
  const end = Math.min(1, head);
  const start = Math.max(0, head - tail);
  if (end <= start) {
    return null;
  }
  const inset = stroke / 2;
  const w = width - stroke;
  const h = height - stroke;
  const segment = (from: number, to: number, color: string, strokeWidth: number, opacity: number) =>
    to - from > 0.0005 ? (
      <rect
        x={inset}
        y={inset}
        width={w}
        height={h}
        rx={Math.max(0, radius - inset)}
        ry={Math.max(0, radius - inset)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity * a}
        strokeLinecap="butt"
        pathLength={1}
        strokeDasharray={`0 ${from.toFixed(5)} ${(to - from).toFixed(5)} 2`}
      />
    ) : null;

  const mid = start + (end - start) * 0.55;
  const near = start + (end - start) * 0.85;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible'}}>
      {/* soft crimson bloom under the whole comet */}
      {segment(start, end, ACCENT.base, stroke * 3.4, 0.22)}
      {/* the tail: crimson, brightening toward the head */}
      {segment(start, mid, ACCENT.base, stroke * 0.9, 0.55)}
      {segment(mid, near, '#ff6b88', stroke * 1.1, 0.85)}
      {/* the head: white */}
      {segment(near, end, '#ffffff', stroke * 1.25, 1)}
    </svg>
  );
};
