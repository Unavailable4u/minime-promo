import React from 'react';
import {STAGE} from '../config/timeline';
import {randInt} from '../lib/prng';
import {useFxFrame} from './fxUtils';

export type GrainProps = {
  /** Opacity of the noise layer (default 0.035; the guide asks for 3 to 4%). */
  opacity?: number;
  /** Noise frequency: higher = finer grain (default 0.8, about 1 to 2 px at 1080p). */
  frequency?: number;
  /** Changes the whole noise sequence without changing its look. */
  seedOffset?: number;
  /** CSS blend mode of the layer (default 'normal'; the layer is plain gray noise). */
  blend?: React.CSSProperties['mixBlendMode'];
  frame?: number;
};

/**
 * Film grain on top of everything. Monochrome fractal noise from an SVG feTurbulence filter whose seed
 * is taken from the seeded PRNG with the frame as its seed, so the grain is different on every frame
 * (it "boils" like film) yet frame N always renders the same pixels. No canvas, no Math.random.
 * Render it as the LAST layer of the film, outside the <Camera>.
 */
export const Grain: React.FC<GrainProps> = ({
  opacity = 0.035,
  frequency = 0.8,
  seedOffset = 0,
  blend = 'normal',
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const seed = randInt(frame + seedOffset * 7919 + 1, 0, 9999);

  return (
    <svg
      width={STAGE.width}
      height={STAGE.height}
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: STAGE.width,
        height: STAGE.height,
        pointerEvents: 'none',
        opacity,
        mixBlendMode: blend,
      }}
    >
      <filter id="mm-grain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={frequency}
          numOctaves={2}
          seed={seed}
          stitchTiles="stitch"
        />
        {/* average the three channels into one gray value, full alpha */}
        <feColorMatrix
          type="matrix"
          values="0.333 0.333 0.333 0 0  0.333 0.333 0.333 0 0  0.333 0.333 0.333 0 0  0 0 0 0 1"
        />
      </filter>
      <rect width={STAGE.width} height={STAGE.height} filter="url(#mm-grain)" />
    </svg>
  );
};
