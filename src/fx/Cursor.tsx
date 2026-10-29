import React from 'react';
import type {CursorWaypoint} from '../config/camera';
import {ACCENT, SURFACE} from '../config/theme';
import {UI_OFFSET} from '../config/timeline';
import {useCameraState} from './Camera';
import {getCursorState} from './cursorMath';
import {useFxFrame} from './fxUtils';

export {getCursorState} from './cursorMath';
export type {CursorRipple, CursorState} from './cursorMath';

export type CursorProps = {
  /** All waypoints of the film (scene arrays concatenated). Coordinates are UI logical (1440x810). */
  waypoints: readonly CursorWaypoint[];
  /** Arrow height in px at zoom 1 (default 26). */
  size?: number;
  /**
   * How much the cursor resists the camera zoom. 0 = it scales with the UI like everything else,
   * 1 = constant size on screen. 0.55 keeps it readable when zoomed in without looking pasted on.
   */
  compensate?: number;
  frame?: number;
};

// Classic pointer: tip at (0, 0), 14.4 x 23 units.
const ARROW_PATH = 'M0 0 L0 20 L4.6 15.8 L7.6 23 L11 21.6 L8 14.6 L14.4 14.6 Z';
const ARROW_W = 14.4;
const ARROW_H = 23;

/**
 * The cursor. Render it INSIDE <Camera> (as a child, a sibling of the app window) so it moves, zooms and
 * tilts with the UI. It positions itself with UI_OFFSET, so just pass waypoints in UI logical coordinates.
 */
export const Cursor: React.FC<CursorProps> = ({waypoints, size = 26, compensate = 0.55, frame}) => {
  const f = useFxFrame(frame);
  const camera = useCameraState();
  const state = getCursorState(f, waypoints);

  if (state.opacity <= 0) {
    return null;
  }

  // Shrink by the zoom (partly) so a 2.4x close-up does not give a 60 px arrow.
  const comp = Math.pow(camera.scale, -compensate);
  const arrowScale = (size / ARROW_H) * comp * state.scale;
  const originX = UI_OFFSET.x + state.x;
  const originY = UI_OFFSET.y + state.y;

  return (
    <>
      {state.ripples.map((ripple) => {
        const radius = ripple.radius * comp;
        return (
          <div
            key={ripple.age}
            style={{
              position: 'absolute',
              left: UI_OFFSET.x + ripple.x - radius,
              top: UI_OFFSET.y + ripple.y - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: '50%',
              border: `${2 * comp}px solid ${ACCENT.base}`,
              background: SURFACE.crimsonGlow(0.2),
              opacity: ripple.opacity, // 0.5 at the click, 0 after 14 frames (ring and faint fill together)
              boxSizing: 'border-box',
              pointerEvents: 'none',
              zIndex: 9000,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: originX,
          top: originY,
          width: 0,
          height: 0,
          transform: `scale(${arrowScale})`,
          transformOrigin: '0 0', // the tip never moves when the cursor scales
          opacity: state.opacity,
          pointerEvents: 'none',
          zIndex: 9001,
        }}
      >
        <svg
          width={ARROW_W}
          height={ARROW_H}
          viewBox={`0 0 ${ARROW_W} ${ARROW_H}`}
          style={{
            display: 'block',
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.5)) drop-shadow(0px 0px 1px rgba(0,0,0,0.6))',
          }}
        >
          <path
            d={ARROW_PATH}
            fill="#ffffff"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};
