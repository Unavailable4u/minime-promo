import React, {createContext, useContext, useMemo} from 'react';
import {CAMERA_DOF, type CameraKeyframe} from '../config/camera';
import type {FocusName, FocusRect} from '../config/focus';
import {STAGE} from '../config/timeline';
import {
  IDENTITY_STATE,
  cameraTransform,
  projectStageRect,
  resolveKeyframes,
  solveCameraAt,
  type CameraState,
} from './cameraMath';
import {useFxFrame} from './fxUtils';

/**
 * The camera state of the nearest <Camera>. Overlays (Callout, Glow, Cursor ...) read it to follow the
 * UI. Outside a <Camera> it is the neutral state (zoom 1, centered), so components still work standalone.
 */
export const CameraContext = createContext<CameraState>(IDENTITY_STATE);

export const useCameraState = (): CameraState => useContext(CameraContext);

export type CameraProps = {
  /** All keyframes of the film (scene arrays concatenated; order does not matter, frames do). */
  keyframes: readonly CameraKeyframe[];
  /**
   * The WORLD: laid out in STAGE coordinates (1920x1080). Put the app window at UI_OFFSET and the
   * <Cursor/> in here; everything in here is zoomed, panned and tilted by the camera.
   */
  children?: React.ReactNode;
  /**
   * The SCREEN layer: drawn above the world and the depth-of-field, never transformed, but it can read
   * the camera (Callout, Glow ...). Captions, callouts, the stat chip, toast and key caps go here.
   */
  screen?: React.ReactNode;
  /** Depth-of-field illusion (light blur + 12% dim outside the focus). Default true. */
  dof?: boolean;
  /** Override the focus rectangles (defaults to FOCUS_RECTS). */
  focus?: Readonly<Record<FocusName, FocusRect>>;
  /** Frame override (default: useCurrentFrame()). */
  frame?: number;
};

const px = (value: number): string => `${value.toFixed(2)}px`;

/**
 * Light blur and dim everywhere EXCEPT the (projected) focus rectangle, with a soft edge.
 * The blur is a backdrop-filter, the hole is a mask made of four linear gradients (one per side),
 * which overlap into a union, so the area outside the rectangle is affected and the inside is clear.
 */
const DepthOfField: React.FC<{state: CameraState}> = ({state}) => {
  const rect = projectStageRect(state, {x: state.fx, y: state.fy, w: state.fw, h: state.fh});
  const feather = CAMERA_DOF.feather;
  const x0 = rect.x;
  const x1 = rect.x + rect.w;
  const y0 = rect.y;
  const y1 = rect.y + rect.h;

  const mask = [
    `linear-gradient(to right, #000 ${px(x0 - feather)}, transparent ${px(x0)})`,
    `linear-gradient(to left, #000 ${px(STAGE.width - x1 - feather)}, transparent ${px(STAGE.width - x1)})`,
    `linear-gradient(to bottom, #000 ${px(y0 - feather)}, transparent ${px(y0)})`,
    `linear-gradient(to top, #000 ${px(STAGE.height - y1 - feather)}, transparent ${px(STAGE.height - y1)})`,
  ].join(', ');

  const blur = `blur(${CAMERA_DOF.blurPx}px)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: STAGE.width,
        height: STAGE.height,
        pointerEvents: 'none',
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        background: `rgba(0, 0, 0, ${CAMERA_DOF.dim})`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
};

/**
 * The virtual camera. Does ALL zooming, panning and tilting of the film (the UI itself is always laid
 * out at its logical 1440x810, so text stays vector sharp). See src/fx/cameraMath.ts for the math and
 * src/config/camera.ts for the keyframe contract and the tunables.
 *
 * Put the stage background BEHIND this component (not inside), so tilting never exposes an edge.
 */
export const Camera: React.FC<CameraProps> = ({
  keyframes,
  children,
  screen,
  dof = true,
  focus,
  frame: frameOverride,
}) => {
  const frame = useFxFrame(frameOverride);
  const resolved = useMemo(() => resolveKeyframes(keyframes, focus), [keyframes, focus]);
  const state = solveCameraAt(frame, resolved);

  return (
    <CameraContext.Provider value={state}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: STAGE.width,
          height: STAGE.height,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: STAGE.width,
            height: STAGE.height,
            transformOrigin: '50% 50%',
            transform: cameraTransform(state),
          }}
        >
          {children}
        </div>
        {dof ? <DepthOfField state={state} /> : null}
        {screen}
      </div>
    </CameraContext.Provider>
  );
};
