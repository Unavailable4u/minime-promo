import React from 'react';
import {Img, staticFile} from 'remotion';
import {SHOTS, shotFile, type Crop, type ShotId} from './shots';
import {FRAME} from './theme';

/**
 * A framed, cropped screenshot. The crop is applied with CSS only (the file is never edited): the image is positioned
 * inside an overflow-hidden box. Props:
 *   id        a key of SHOTS (shots.ts). "tokens" does not exist there on purpose.
 *   width     the displayed width of the CROPPED picture in px. The height follows the crop's aspect ratio.
 *   crop      optional override, merged over the catalogue crop (source pixels), e.g. {y: 300, h: 240}
 *   grid      overlay a coordinate grid in SOURCE pixels (labels every 100, dashes every 50): tune crops and pin points with it
 *   maxScale  never upscale past 1.0 (the guide's rule). Raise it only on purpose, e.g. for a single enlarged prompt bubble.
 *   children  drawn on top, in the displayed picture's pixel space: put <Pin>s here and place them with mapPoint()
 * Text inside the picture is exempt from the 30 px rule (it is a picture); the grid labels below are dev-only.
 */
export type ShotRef = {
  id: ShotId;
  width: number;
  crop?: Partial<Crop>;
  maxScale?: number;
};

export type ShotProps = ShotRef & {
  grid?: boolean;
  /** Draw the frame (1 px border, radius, shadow). Default true. */
  frame?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export type ShotLayout = {
  crop: Crop;
  /** Displayed pixels per source pixel (at most `maxScale`, default 1). */
  scale: number;
  width: number;
  height: number;
};

/** Resolve crop, scale and displayed size. Throws if the crop leaves the picture, so a typo cannot show a blank strip. */
export const shotLayout = (ref: ShotRef): ShotLayout => {
  const def = SHOTS[ref.id];
  const crop: Crop = {...def.crop, ...ref.crop};
  const {w: nw, h: nh} = def.natural;
  if (crop.w <= 0 || crop.h <= 0 || crop.x < 0 || crop.y < 0 || crop.x + crop.w > nw || crop.y + crop.h > nh) {
    throw new Error(
      `Shot "${ref.id}": crop ${JSON.stringify(crop)} is outside the ${nw}x${nh} picture (${def.file}).`,
    );
  }
  const scale = Math.min(ref.width / crop.w, ref.maxScale ?? 1);
  return {crop, scale, width: crop.w * scale, height: crop.h * scale};
};

/** A point in SOURCE pixels -> the same point in the displayed, cropped picture (px from its top-left corner). */
export const mapPoint = (point: {x: number; y: number}, ref: ShotRef): {x: number; y: number} => {
  const {crop, scale} = shotLayout(ref);
  return {x: (point.x - crop.x) * scale, y: (point.y - crop.y) * scale};
};

const GridOverlay: React.FC<{layout: ShotLayout}> = ({layout}) => {
  const {crop, scale, width, height} = layout;
  const lines: React.ReactNode[] = [];
  const first = (from: number, step: number) => Math.ceil(from / step) * step;
  for (let x = first(crop.x, 50); x <= crop.x + crop.w; x += 50) {
    const major = x % 100 === 0;
    const px = (x - crop.x) * scale;
    lines.push(
      <line key={`x${x}`} x1={px} y1={0} x2={px} y2={height} stroke="#00e5ff" strokeOpacity={major ? 0.4 : 0.12} strokeWidth={1} strokeDasharray={major ? undefined : '4 6'} />,
    );
    if (major) {
      lines.push(
        <text key={`xt${x}`} x={px + 4} y={14} fill="#00e5ff" fontSize={13} fontFamily="monospace" stroke="#000" strokeWidth={3} paintOrder="stroke">
          {x}
        </text>,
      );
    }
  }
  for (let y = first(crop.y, 50); y <= crop.y + crop.h; y += 50) {
    const major = y % 100 === 0;
    const py = (y - crop.y) * scale;
    lines.push(
      <line key={`y${y}`} x1={0} y1={py} x2={width} y2={py} stroke="#ffea00" strokeOpacity={major ? 0.4 : 0.12} strokeWidth={1} strokeDasharray={major ? undefined : '4 6'} />,
    );
    if (major) {
      lines.push(
        <text key={`yt${y}`} x={4} y={py - 3} fill="#ffea00" fontSize={13} fontFamily="monospace" stroke="#000" strokeWidth={3} paintOrder="stroke">
          {y}
        </text>,
      );
    }
  }
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {lines}
    </svg>
  );
};

export const Shot: React.FC<ShotProps> = ({id, width, crop, maxScale, grid = false, frame = true, style, children}) => {
  const layout = shotLayout({id, width, crop, maxScale});
  const {natural} = SHOTS[id];
  const radius = frame ? FRAME.radius : 0;
  return (
    <div
      style={{
        position: 'relative',
        width: layout.width,
        height: layout.height,
        overflow: 'hidden',
        borderRadius: radius,
        boxShadow: frame ? FRAME.shadow : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* staticFile() encodes the file name itself (spaces too): do not wrap the path in encodeURI(), that would double-encode it. */}
      <Img
        src={staticFile(shotFile(id))}
        style={{
          position: 'absolute',
          left: -layout.crop.x * layout.scale,
          top: -layout.crop.y * layout.scale,
          width: natural.w * layout.scale,
          height: natural.h * layout.scale,
          maxWidth: 'none',
        }}
      />
      {grid ? <GridOverlay layout={layout} /> : null}
      {children ? <div style={{position: 'absolute', inset: 0}}>{children}</div> : null}
      {frame ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            border: `1px solid ${FRAME.borderColor}`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
};
