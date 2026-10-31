import React from 'react';
import {clamp01} from '../../lib/ease';

export type GlassSheenProps = {
  width: number;
  height: number;
  radius: number;
  /** Direction of the soft reflection in degrees; the stage passes an angle that follows the device's rotation. */
  angle: number;
  /** 0..1 strength of the static reflection (it fades in with the bezel). */
  strength: number;
  /** 0..1 position of a travelling rim-light sweep across the glass, or null = none. */
  sweep?: number | null;
};

/**
 * Glass over a screen: a soft diagonal reflection whose angle follows the device's rotation, plus an optional thin
 * travelling sweep (the idle "rim-light sweep" of the final hold). Plain gradients on a leaf element.
 */
export const GlassSheen: React.FC<GlassSheenProps> = ({width, height, radius, angle, strength, sweep = null}) => {
  const k = clamp01(strength);
  if (k <= 0.001) {
    return null;
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, borderRadius: radius, overflow: 'hidden', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${angle.toFixed(2)}deg, rgba(255,255,255,${(0.075 * k).toFixed(4)}) 0%, rgba(255,255,255,${(0.02 * k).toFixed(4)}) 30%, rgba(255,255,255,0) 46%, rgba(255,255,255,0) 66%, rgba(255,255,255,${(0.035 * k).toFixed(4)}) 100%)`,
        }}
      />
      {sweep !== null && sweep > 0 && sweep < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: -width * 0.3 + sweep * width * 1.6,
            top: -height * 0.3,
            width: width * 0.16,
            height: height * 1.6,
            transform: 'skewX(-20deg)',
            background: `linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,${(0.1 * k).toFixed(4)}) 50%, rgba(255,255,255,0) 100%)`,
          }}
        />
      ) : null}
    </div>
  );
};
