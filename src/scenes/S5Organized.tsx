import React from 'react';
import type {CameraKeyframe, CursorWaypoint} from '../config/camera';
import type {SceneOverlayProps} from './sceneTypes';

/**
 * STUB (patch 08). Patch 14 REPLACES this file with the real S5 Organized scene (f1320-1499).
 * Keep the three exports: S5Organized (overlay), S5_CAMERA, S5_CURSOR.
 */
export const S5_CAMERA: CameraKeyframe[] = [];
export const S5_CURSOR: CursorWaypoint[] = [];

export const S5Organized: React.FC<SceneOverlayProps> = () => null;
