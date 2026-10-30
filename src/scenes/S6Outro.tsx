import React from 'react';
import type {CameraKeyframe, CursorWaypoint} from '../config/camera';
import type {GridOpacityFn, SceneOverlayProps, WindowStyleFn} from './sceneTypes';

/**
 * STUB (patch 08). Patch 15 REPLACES this file with the real S6 Outro scene (f1500-1739).
 * Keep the exports: S6Outro (overlay), S6_CAMERA, S6_CURSOR, plus the two optional hooks below.
 */
export const S6_CAMERA: CameraKeyframe[] = [];
export const S6_CURSOR: CursorWaypoint[] = [];

/** Grid floor opacity during the outro (patch 15 fades it in behind the floating window). The stub keeps it off. */
export const S6_GRID: GridOpacityFn = () => 0;

/**
 * Window style override for S6 (the 3/4 hero view, then the defocus). `null` = no override: the S1 identity style
 * keeps applying. Patch 15 replaces this with a real WindowStyleFn.
 */
export const S6_WINDOW: WindowStyleFn | null = null;

export const S6Outro: React.FC<SceneOverlayProps> = () => null;
