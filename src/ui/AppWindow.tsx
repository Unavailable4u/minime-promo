import React from 'react';
import {FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {UI} from '../config/timeline';
import {SHELL} from './shellLayout';

export type AppWindowProps = {
  /** Top navigation (render <TopNav/>). Occupies the first 48 px. */
  header: React.ReactNode;
  /** Left sidebar (render <ChatSidebar/>). 256 px wide. */
  sidebar: React.ReactNode;
  /** The Chat Box (render <ChatBox/>). Fills the remaining width and reflows when the panel opens. */
  children: React.ReactNode;
  /** Right Working Panel content (patch 05). Rendered at its full 480 px width and clipped by `panelWidth`. */
  panel?: React.ReactNode;
  /** Visible Working Panel width, 0..480. The Chat Box width is 1440 - 256 - panelWidth. Default 0. */
  panelWidth?: number;
  /** Rim light: angle (deg) of the bright arc travelling around the border. Default 0. */
  rimAngle?: number;
  /** Rim light strength 0..1 (0 = off). Default 0. */
  rimIntensity?: number;
  /** Extra styles for the outer box (the film applies opacity / filter / transform here). */
  style?: React.CSSProperties;
};

const RADIUS = 14;

/** A 1 px ring made from a conic gradient, masked so only the border shows. */
const ringStyle = (angle: number, alpha: number, thickness: number): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  borderRadius: RADIUS,
  padding: thickness,
  background: `conic-gradient(from ${angle}deg at 50% 50%, rgba(255,32,82,0) 0deg, rgba(255,32,82,${alpha}) 50deg, rgba(255,32,82,0) 120deg, rgba(255,32,82,0) 360deg)`,
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
  pointerEvents: 'none',
});

/**
 * The floating app window: 1440x810 logical px, rounded 14, 1 px hairline border, deep shadow, optional
 * moving crimson rim light. NO browser chrome and no title bar.
 *
 * Geometry note: the hairline border is an overlay, not a real CSS border, so the content boxes keep the
 * exact sizes in `shellLayout()`.
 * Position it on the stage yourself (`left: UI_OFFSET.x, top: UI_OFFSET.y`) or inside <Camera> world space.
 */
export const AppWindow: React.FC<AppWindowProps> = ({
  header,
  sidebar,
  children,
  panel,
  panelWidth = 0,
  rimAngle = 0,
  rimIntensity = 0,
  style,
}) => {
  const pw = Math.min(SHELL.panelMaxW, Math.max(0, panelWidth));
  const rim = Math.min(1, Math.max(0, rimIntensity));

  return (
    <div
      style={{
        position: 'relative',
        width: UI.width,
        height: UI.height,
        borderRadius: RADIUS,
        background: SURFACE.appBody,
        color: NEUTRAL[100],
        fontFamily: FONTS.body,
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div style={{height: SHELL.headerH, flexShrink: 0}}>{header}</div>

      <div style={{display: 'flex', flex: 1, minHeight: 0}}>
        <div style={{width: SHELL.sidebarW, flexShrink: 0, height: '100%'}}>{sidebar}</div>

        <div style={{flex: 1, minWidth: 0, height: '100%', position: 'relative'}}>{children}</div>

        <div
          style={{
            position: 'relative',
            width: pw,
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden',
            boxShadow: pw > 0.5 ? 'inset 1px 0 0 #262626' : undefined,
          }}
        >
          {/* Anchored to the RIGHT edge so the panel reveals like a drawer instead of squashing its content. */}
          <div style={{position: 'absolute', right: 0, top: 0, width: SHELL.panelMaxW, height: '100%'}}>
            {panel}
          </div>
        </div>
      </div>

      {/* hairline border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: RADIUS,
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none',
        }}
      />

      {/* crimson rim light */}
      {rim > 0 ? (
        <>
          <div style={{...ringStyle(rimAngle, 0.5 * rim, 6), filter: 'blur(7px)', opacity: 0.8}} />
          <div style={ringStyle(rimAngle, 0.85 * rim, 1)} />
        </>
      ) : null}
    </div>
  );
};