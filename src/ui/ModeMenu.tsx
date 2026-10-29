import React from 'react';
import {Brain, Check, Feather, Flame, Sparkles, Zap} from 'lucide-react';
import {MODE_OPTIONS, type ModeId} from '../config/copy';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {f} from '../config/timeline';
import {withAlpha} from '../lib/color';
import {clamp01, signatureEase} from '../lib/ease';
import {MODE_MENU_ROW_HEIGHTS, SHELL} from './shellLayout';

/** Row stagger and row duration, in frames (authored at 30 fps). */
export const MODE_MENU_ROW_STAGGER = f(3);
export const MODE_MENU_ROW_FRAMES = f(10);
/**
 * Length of the open animation in frames: the last row starts 4 stagger steps in and then runs one row duration.
 * Drive `openProgress` linearly from 0 to 1 over this many frames (and 1 to 0 to close):
 *   openProgress = clamp01((frame - openFrame) / MODE_MENU_OPEN_FRAMES)
 */
export const MODE_MENU_OPEN_FRAMES = MODE_MENU_ROW_STAGGER * 4 + MODE_MENU_ROW_FRAMES;

type ModeIconName = (typeof MODE_OPTIONS)[number]['icon'];

/** The lucide icon for a mode option (names come from copy.ts MODE_OPTIONS). */
export const ModeIcon: React.FC<{
  name: ModeIconName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({name, size = 15, color = NEUTRAL[300], style}) => {
  const props = {size, color, style, strokeWidth: 2};
  switch (name) {
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Feather':
      return <Feather {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'Brain':
      return <Brain {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    default:
      return null;
  }
};

export type ModeMenuProps = {
  /** 0..1 open animation (see MODE_MENU_OPEN_FRAMES). 0 renders nothing. */
  openProgress: number;
  /** Row under the mouse (0 = Auto ... 4 = Beast), or null. Beast gets a faint crimson glow while hovered. */
  hoveredIndex?: number | null;
  /** The currently chosen mode (shows a small check). */
  selected: ModeId;
};

/**
 * Mode picker dropdown: opens UPWARD, w 224, bg #171717, border #262626, rounded 8, shadow-xl.
 * It is absolutely positioned (left 0, 8 px above the bottom of its parent), so render it inside a
 * `position: relative` wrapper whose top edge is the mode button's top edge. <Composer/> already does this.
 */
export const ModeMenu: React.FC<ModeMenuProps> = ({openProgress, hoveredIndex = null, selected}) => {
  const open = clamp01(openProgress);
  if (open <= 0.001) {
    return null;
  }
  const age = open * MODE_MENU_OPEN_FRAMES; // frames since opening started
  const shell = signatureEase(clamp01(age / MODE_MENU_ROW_FRAMES));

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: `calc(100% + ${SHELL.menuGap}px)`,
        width: SHELL.menuW,
        boxSizing: 'border-box',
        background: NEUTRAL[900],
        border: `1px solid ${NEUTRAL[800]}`,
        borderRadius: 8,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        opacity: shell,
        transform: `translateY(${8 * (1 - shell)}px) scale(${0.97 + 0.03 * shell})`,
        transformOrigin: 'bottom left',
        zIndex: 20,
      }}
    >
      {MODE_OPTIONS.map((option, index) => {
        const p = signatureEase(clamp01((age - index * MODE_MENU_ROW_STAGGER) / MODE_MENU_ROW_FRAMES));
        const hovered = hoveredIndex === index;
        const beastHot = hovered && option.id === 'beast';
        const isSelected = option.id === selected;
        return (
          <div
            key={option.id}
            style={{
              position: 'relative',
              height: MODE_MENU_ROW_HEIGHTS[index],
              boxSizing: 'border-box',
              overflow: 'hidden',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontFamily: FONTS.heading, // rows are <button>s in the real app
              letterSpacing: '0.02em',
              background: beastHot
                ? `linear-gradient(90deg, ${withAlpha(ACCENT.base, 0.16)} 0%, ${NEUTRAL[800]} 70%)`
                : hovered
                  ? NEUTRAL[800]
                  : 'transparent',
              opacity: p,
              transform: `translateY(${6 * (1 - p)}px)`,
            }}
          >
            <div style={{position: 'relative', width: 15, height: 15, marginTop: 2, flexShrink: 0}}>
              {beastHot ? (
                <div
                  style={{
                    position: 'absolute',
                    left: -10,
                    top: -10,
                    width: 35,
                    height: 35,
                    borderRadius: 20,
                    background: `radial-gradient(circle, ${withAlpha(ACCENT.base, 0.5)} 0%, ${withAlpha(ACCENT.base, 0)} 70%)`,
                  }}
                />
              ) : null}
              <ModeIcon
                name={option.icon}
                size={15}
                color={beastHot ? ACCENT.base : NEUTRAL[300]}
                style={{position: 'relative'}}
              />
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 14, lineHeight: '20px', color: NEUTRAL[200]}}>{option.label}</div>
              <div style={{fontSize: 11, lineHeight: '16px', color: NEUTRAL[500]}}>{option.hint}</div>
            </div>
            {isSelected ? <Check size={13} color={NEUTRAL[400]} style={{marginTop: 4, flexShrink: 0}} /> : null}
          </div>
        );
      })}
    </div>
  );
};