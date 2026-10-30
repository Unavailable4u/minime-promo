import React from 'react';
import type {CameraKeyframe, CursorWaypoint} from '../config/camera';
import type {SceneOverlayProps} from './sceneTypes';

/**
 * STUB (patch 08). Patch 09 REPLACES this file with the real S2 Instant scene (f240-479).
 * Keep the three exports: S2Instant (overlay), S2_CAMERA, S2_CURSOR.
 */
export const S2_CAMERA: CameraKeyframe[] = [];
export const S2_CURSOR: CursorWaypoint[] = [];

export const S2Instant: React.FC<SceneOverlayProps> = () => null;
