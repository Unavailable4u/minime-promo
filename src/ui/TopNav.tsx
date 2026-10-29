import React from 'react';
import {Bell} from 'lucide-react';
import {ACTIVE_TAB, NAV_TABS, USER} from '../config/copy';
import {ACCENT, FONTS, NEUTRAL} from '../config/theme';
import {SHELL} from './shellLayout';
import {lerpColor, withAlpha} from '../lib/color';
import {mapRange} from '../lib/ease';
import {MiniMeLogo} from './MiniMeLogo';

export type TopNavProps = {
  /** Which tab is lit. Default "Chat". The film never lights any other tab. */
  activeTab?: string;
  /**
   * Outro teaser: a soft light travelling across the INACTIVE tab names. 0 = just before the first tab,
   * 1 = just past the last one. `undefined` or `null` = off. It only brightens the text; it never activates a tab.
   */
  sweep?: number | null;
  /** Peak brightness of the sweep 0..1. Default 1. */
  sweepStrength?: number;
  tabs?: readonly string[];
};

/** How many tab widths the sweep light reaches on each side. */
const SWEEP_RADIUS = 1.7;

/**
 * Top navigation bar, 48 px high (hairline bottom border inside it).
 * Left: mark + "Mini" "Me" wordmark. Centre (absolutely centered): the 11 tabs. Right: bell + avatar + name.
 * Only the Chat tab is ever active; no other tab's content exists anywhere in this project.
 */
export const TopNav: React.FC<TopNavProps> = ({
  activeTab = ACTIVE_TAB,
  sweep = null,
  sweepStrength = 1,
  tabs = NAV_TABS,
}) => {
  const sweepPos = sweep === null || sweep === undefined ? null : mapRange(sweep, 0, 1, -1.5, tabs.length + 0.5);

  return (
    <div
      style={{
        position: 'relative',
        height: SHELL.headerH,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${NEUTRAL[800]}`,
        boxSizing: 'border-box',
      }}
    >
      {/* left: logo + wordmark */}
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <div style={{width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <MiniMeLogo progress={1} fill={1} size={20} />
        </div>
        <div
          style={{
            fontFamily: FONTS.heading,
            fontWeight: 700,
            fontSize: 14,
            lineHeight: '20px',
            letterSpacing: '-0.025em',
            color: NEUTRAL[200],
          }}
        >
          Mini<span style={{color: ACCENT.wordmarkMe}}>Me</span>
        </div>
      </div>

      {/* centre: tabs, absolutely centered */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {tabs.map((name, index) => {
          const active = name === activeTab;
          let k = 0;
          if (!active && sweepPos !== null) {
            const d = Math.abs(index - sweepPos) / SWEEP_RADIUS;
            const falloff = Math.max(0, 1 - d);
            k = falloff * falloff * (3 - 2 * falloff) * Math.min(1, Math.max(0, sweepStrength));
          }
          return (
            <div
              key={name}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontFamily: FONTS.heading,
                fontSize: 12,
                lineHeight: '16px',
                letterSpacing: '0.02em',
                fontWeight: 500,
                color: active ? '#ffffff' : lerpColor(NEUTRAL[500], NEUTRAL[100], k),
                background: active ? ACCENT.base : k > 0 ? withAlpha('#ffffff', 0.06 * k) : 'transparent',
              }}
            >
              {name}
            </div>
          );
        })}
      </div>

      {/* right: bell + avatar + name */}
      <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14}}>
        <Bell size={16} color={NEUTRAL[400]} strokeWidth={2} />
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              background: NEUTRAL[700],
              color: NEUTRAL[100],
              fontFamily: FONTS.heading,
              fontWeight: 600,
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {USER.initial}
          </div>
          <div style={{fontSize: 12, lineHeight: '16px', color: NEUTRAL[300]}}>{USER.name}</div>
        </div>
      </div>
    </div>
  );
};