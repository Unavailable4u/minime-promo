import React from 'react';
import type {CameraKeyframe, CursorWaypoint} from '../config/camera';
import type {SceneOverlayProps} from './sceneTypes';

/**
 * STUB (patch 08). Patch 13 REPLACES this file with the real S4 Control scene (f1080-1319).
 * Keep the three exports: S4Control (overlay), S4_CAMERA, S4_CURSOR.
 */
export const S4_CAMERA: CameraKeyframe[] = [];
export const S4_CURSOR: CursorWaypoint[] = [];

export const S4Control: React.FC<SceneOverlayProps> = () => null;
