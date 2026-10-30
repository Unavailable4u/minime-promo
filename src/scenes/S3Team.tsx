import React from 'react';
import type {CameraKeyframe, CursorWaypoint} from '../config/camera';
import type {SceneOverlayProps} from './sceneTypes';
import {S3A_CAMERA, S3A_CURSOR, S3a} from './s3/S3a';
import {S3B_CAMERA, S3B_CURSOR, S3b} from './s3/S3b';
import {S3C_CAMERA, S3C_CURSOR, S3c} from './s3/S3c';

/**
 * S3 — THE TEAM (f480-1079). Real wrapper (patch 08): it only concatenates the three parts.
 * Patches 10, 11 and 12 replace s3/S3a.tsx, s3/S3b.tsx and s3/S3c.tsx; this file does not change.
 */
export const S3_CAMERA: CameraKeyframe[] = [...S3A_CAMERA, ...S3B_CAMERA, ...S3C_CAMERA];
export const S3_CURSOR: CursorWaypoint[] = [...S3A_CURSOR, ...S3B_CURSOR, ...S3C_CURSOR];

export const S3Team: React.FC<SceneOverlayProps> = ({frame}) => (
  <>
    <S3a frame={frame} />
    <S3b frame={frame} />
    <S3c frame={frame} />
  </>
);
