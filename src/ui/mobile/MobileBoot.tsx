import React from 'react';
import {ACCENT, FONTS, NEUTRAL} from '../../config/theme';
import {clamp01} from '../../lib/ease';
import {MiniMeLogo} from '../MiniMeLogo';

export type MobileBootProps = {
  width: number;
  height: number;
  /** 0..1 linear. */
  progress: number;
};

/** The phone boot screen (reference 5): crimson-tinted radial dark, scanlines, the mark, "initializing", striped bar, percent. */
export const MobileBoot: React.FC<MobileBootProps> = ({width, height, progress}) => {
  const p = clamp01(progress);
  const pct = String(Math.round(p * 100)).padStart(3, '0');
  const trackW = 230;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        // OPAQUE: a solid base under the glow, otherwise the chat text shows through the boot screen while it is pulled off
        backgroundColor: '#050304',
        backgroundImage: 'radial-gradient(ellipse 75% 45% at 50% 38%, rgba(120, 12, 40, 0.55) 0%, rgba(40, 4, 14, 0.7) 45%, rgba(5, 3, 4, 0) 100%)',
      }}
    >
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)'}} />
      <div style={{position: 'absolute', left: (width - 170) / 2, top: height * 0.355, width: 170}}>
        <MiniMeLogo progress={1} fill={1} size={170} glow={0.7} />
      </div>
      <div style={{position: 'absolute', left: 0, width, top: height * 0.6, textAlign: 'center', fontFamily: FONTS.body, fontSize: 11, letterSpacing: '0.22em', color: NEUTRAL[400]}}>initializing</div>
      <div style={{position: 'absolute', left: (width - trackW) / 2, top: height * 0.6 + 26, width: trackW, height: 8, border: '1px solid rgba(255,32,82,0.25)', boxSizing: 'border-box'}}>
        <div
          style={{
            width: `${p * 100}%`,
            height: '100%',
            background: `repeating-linear-gradient(135deg, ${ACCENT.base} 0px, ${ACCENT.base} 5px, #ff5a7c 5px, #ff5a7c 7px)`,
          }}
        />
      </div>
      <div style={{position: 'absolute', left: 0, width, top: height * 0.6 + 46, textAlign: 'center', fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '0.2em', color: ACCENT.base, fontVariantNumeric: 'tabular-nums'}}>{pct}%</div>
    </div>
  );
};
