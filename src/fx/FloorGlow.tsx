import React from 'react';
import {STAGE_CENTER} from '../config/devices';
import {SURFACE} from '../config/theme';
import {clamp01} from '../lib/ease';

export type FloorPlaneProps = {
  /** Centre of the plane in WORLD px relative to the stage centre (+x right, +z toward the viewer). */
  x: number;
  z: number;
  /** Height of the plane: world y relative to the stage centre (+y is DOWN). */
  y: number;
  /** Width (along x) and depth (along z) in px. */
  width: number;
  depth: number;
  /** CSS background (a radial gradient). */
  background: string;
};

/**
 * A flat plane lying on the floor inside the DeviceStage's 3D context (it sorts in depth with the devices).
 * No filter, no mask, no overflow: soft edges come from the gradient itself, so it never flattens preserve-3d.
 */
export const FloorPlane: React.FC<FloorPlaneProps> = ({x, z, y, width, depth, background}) => (
  <div
    style={{
      position: 'absolute',
      left: STAGE_CENTER.x + x - width / 2,
      top: STAGE_CENTER.y + y,
      width,
      height: depth,
      transformOrigin: '50% 0%',
      transform: `translateZ(${(z - depth / 2).toFixed(2)}px) rotateX(90deg)`,
      background,
      pointerEvents: 'none',
    }}
  />
);

export type FloorGlowProps = {
  /** 0..1 strength. */
  strength: number;
  x: number;
  z: number;
  y: number;
  width: number;
  depth: number;
};

/** The faint crimson light on the floor under the cluster (the grid floor of the stage stays on behind it). */
export const FloorGlow: React.FC<FloorGlowProps> = ({strength, x, z, y, width, depth}) => {
  const k = clamp01(strength);
  if (k <= 0.001) {
    return null;
  }
  return (
    <FloorPlane
      x={x}
      z={z}
      y={y}
      width={width}
      depth={depth}
      background={`radial-gradient(ellipse closest-side, ${SURFACE.crimsonGlow(0.30 * k)} 0%, ${SURFACE.crimsonGlow(0.12 * k)} 45%, ${SURFACE.crimsonGlow(0)} 100%)`}
    />
  );
};
