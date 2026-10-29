import React from 'react';
import {STAGE} from '../config/timeline';

export type VignetteProps = {
  /**
   * Black at the edge of the frame, 0..1 (default 0.12 = the 12% of the guide). It is full strength
   * from the middle of each edge outward (corners included) and fades to nothing at `inner`.
   */
  strength?: number;
  /** Where the clear center ends, as a fraction of the half-width/half-height (default 0.58). */
  inner?: number;
};

/**
 * A soft dark frame around the picture. Static (no frame dependency). Render it just under <Grain/>,
 * outside the <Camera>, so tilting and zooming never move it.
 */
export const Vignette: React.FC<VignetteProps> = ({strength = 0.12, inner = 0.58}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: STAGE.width,
      height: STAGE.height,
      pointerEvents: 'none',
      background: `radial-gradient(ellipse closest-side at 50% 50%, rgba(0,0,0,0) ${(inner * 100).toFixed(1)}%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);
