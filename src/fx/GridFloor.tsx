import React from 'react';
import {STAGE} from '../config/timeline';
import {useFxFrame} from './fxUtils';

export type GridFloorProps = {
  /** Distance between grid lines in px on the floor plane (default 32). */
  spacing?: number;
  /** Alpha of the 1 px white lines (default 0.04). */
  lineAlpha?: number;
  /** Where the horizon sits, as a fraction of the stage height (default 0.46). */
  horizon?: number;
  /** Floor tilt in degrees (default 68; larger = flatter floor). */
  tilt?: number;
  /** Floor scroll toward the viewer in px per frame (default 0.3; 0 = static). Linear, deterministic. */
  speed?: number;
  /** Whole-layer multiplier on top of lineAlpha (default 1). */
  opacity?: number;
  frame?: number;
};

const PERSPECTIVE = 900;
const PLANE_WIDTH = 3600;
// Deep enough to fill the lower half of the stage, shallow enough that no point passes the eye
// (z = height * sin(tilt) has to stay below PERSPECTIVE).
const PLANE_HEIGHT = 780;

/**
 * A faint perspective floor grid for the stage background (intro and outro). Pure CSS: two 1 px
 * repeating gradients on a plane tilted with rotateX, faded out toward the horizon so the far lines
 * never moire. Put it BEHIND the <Camera> (it is part of the stage, not of the world).
 */
export const GridFloor: React.FC<GridFloorProps> = ({
  spacing = 32,
  lineAlpha = 0.04,
  horizon = 0.46,
  tilt = 68,
  speed = 0.3,
  opacity = 1,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const line = `rgba(255, 255, 255, ${lineAlpha})`;
  const offset = (((frame * speed) % spacing) + spacing) % spacing;
  const fade = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 14%, #000 40%, #000 100%)';

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: STAGE.width,
        height: STAGE.height,
        overflow: 'hidden',
        pointerEvents: 'none',
        perspective: PERSPECTIVE,
        perspectiveOrigin: `50% ${(horizon * 100).toFixed(1)}%`,
        opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: STAGE.width / 2 - PLANE_WIDTH / 2,
          top: STAGE.height * horizon,
          width: PLANE_WIDTH,
          height: PLANE_HEIGHT,
          transformOrigin: '50% 0%',
          transform: `rotateX(${tilt}deg)`,
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: `0px ${offset.toFixed(3)}px`,
          maskImage: fade,
          WebkitMaskImage: fade,
        }}
      />
    </div>
  );
};
