import React from 'react';
import {ACCENT} from '../config/theme';
import {clamp01} from '../lib/ease';
import {MiniMeLogo} from '../ui/MiniMeLogo';

export type ScreenWakeProps = {
  /** Screen size in the device's logical px. */
  width: number;
  height: number;
  /** Corner radius of the screen (the overlay clips itself to it). */
  radius: number;
  /** 0 = the screen is off (black + the glowing mark), 1 = fully awake. Linear: this component draws the scanline wipe. */
  wake: number;
  /** 0..1 strength of the glow on the power-on mark. */
  markGlow: number;
  /** Specular sweep position 0..1 (a bright diagonal band travelling left to right), or null = off. */
  sweep?: number | null;
  /** 0..1 brightness blip (a quick white lift of the whole screen). It peaks at `blipStrength` of white. */
  blip?: number;
  /** Peak opacity of the white lift at blip = 1. Default 0.55 (strong enough to hide a content swap beneath it). */
  blipStrength?: number;
  /** Size of the power-on mark in px. Default 22 % of the shorter side. */
  markSize?: number;
};

/**
 * The "device powers on" layer (reference image 1): black screen, only the glowing crimson mark. The wake is a
 * top-down scanline wipe (the black pulls DOWN and off, a thin bright line rides its edge), optionally followed by a
 * specular sweep and a brightness blip. It is an overlay: put it as the last child of the screen box.
 * Everything is a plain div / gradient (no filter, no mask) and a pure function of its props.
 */
export const ScreenWake: React.FC<ScreenWakeProps> = ({
  width,
  height,
  radius,
  wake,
  markGlow,
  sweep = null,
  blip = 0,
  blipStrength = 0.55,
  markSize,
}) => {
  const w = clamp01(wake);
  const size = markSize ?? Math.round(Math.min(width, height) * 0.22);
  const edgeY = w * height;
  const showCover = w < 0.999;
  const glow = clamp01(markGlow);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, borderRadius: radius, overflow: 'hidden', pointerEvents: 'none'}}>
      {showCover ? (
        <>
          {/* the black that remains below the scanline */}
          <div style={{position: 'absolute', left: 0, top: edgeY, width, height: height - edgeY, background: '#000', overflow: 'hidden'}}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: -edgeY,
                width,
                height,
                background: `radial-gradient(ellipse ${width * 0.5}px ${height * 0.42}px at 50% 50%, rgba(255, 32, 82, ${0.16 * glow}) 0%, rgba(255, 32, 82, 0) 100%)`,
              }}
            />
            <div style={{position: 'absolute', left: (width - size) / 2, top: (height - (size * 844) / 1024) / 2 - edgeY, width: size}}>
              <MiniMeLogo progress={1} fill={1} size={size} glow={glow} />
            </div>
          </div>
          {/* the bright scanline and the soft light it leaves above itself */}
          {w > 0.001 ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: edgeY - 46,
                  width,
                  height: 46,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,120,150,0.20) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: edgeY - 1.5,
                  width,
                  height: 3,
                  background: `linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 30%, ${ACCENT.base} 70%, rgba(255,255,255,0) 100%)`,
                  boxShadow: '0 0 14px rgba(255, 32, 82, 0.8)',
                }}
              />
            </>
          ) : null}
        </>
      ) : null}

      {/* specular sweep: a soft diagonal band */}
      {sweep !== null && sweep > 0 && sweep < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: -width * 0.6 + sweep * width * 2.2,
            top: -height * 0.2,
            width: width * 0.6,
            height: height * 1.4,
            transform: 'skewX(-18deg)',
            background:
              'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 36%, rgba(255,255,255,0.42) 50%, rgba(255,120,150,0.18) 64%, rgba(255,255,255,0) 100%)',
          }}
        />
      ) : null}

      {/* brightness blip: a warm white lift of the whole screen */}
      {blip > 0.001 ? (
        <div style={{position: 'absolute', inset: 0, background: `rgba(255, 238, 242, ${(blipStrength * clamp01(blip)).toFixed(3)})`}} />
      ) : null}
    </div>
  );
};
