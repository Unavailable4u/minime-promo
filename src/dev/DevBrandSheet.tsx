import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ACCENT, FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {FPS} from '../config/timeline';
import {ramp} from '../lib/ease';
import {FontsReady} from '../lib/fonts';
import {
  EXTRA_EMOJI,
  INPUT_NODE,
  OUTPUT_NODE,
  DEFAULT_CATEGORY,
  getRoleCategory,
  roleNameColor,
  tierColor,
  tierLabel,
  tierText,
} from '../lib/roleIcons';
import {AVATAR_LOOP_FRAMES, AssistantAvatar} from '../ui/AssistantAvatar';
import {Emoji} from '../ui/Emoji';
import {LOGO_DRAW_FRAMES, LOGO_PATH2_DELAY_FRAMES, MiniMeLogo, logoProgress} from '../ui/MiniMeLogo';

/**
 * DEV ONLY (patch 01): brand sheet. Not part of the film.
 *   npx remotion still src/index.ts DevBrandSheet out/qa/brand.png --frame=45
 * Shows: the logo at progress 0/25/50/75/100 (+ glow), a live pen-draw loop, the thinking avatar across one
 * loop, and every role used in the film with its emoji, category color and hashed name color.
 */

// Roles used in the film, in storyboard order (name, error state shown for the verifier's first run).
const FILM_ROLES = [
  'Inspector — classifying task',
  'strategist',
  'market_researcher',
  'code_writer',
  'test_writer',
  'verifier',
  'documentation_writer',
  'security_auditor',
  'code_reviewer',
  'fixer',
  'report_writer',
  'responder',
] as const;

const label: React.CSSProperties = {
  fontFamily: FONTS.mono,
  fontSize: 14,
  color: NEUTRAL[500],
  letterSpacing: '0.04em',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: FONTS.heading,
  fontWeight: 700,
  fontSize: 18,
  color: NEUTRAL[300],
  margin: '0 0 14px 0',
  letterSpacing: '0.02em',
};

const cell: React.CSSProperties = {
  border: `1px solid ${NEUTRAL[800]}`,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.02)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '14px 10px',
};

const LogoCell: React.FC<{caption: string; progress: number; glow?: number; fill?: number}> = ({
  caption,
  progress,
  glow,
  fill,
}) => (
  <div style={{...cell, width: 270, height: 215}}>
    <div style={{height: 140, display: 'flex', alignItems: 'center'}}>
      <MiniMeLogo progress={progress} size={150} glow={glow} fill={fill} />
    </div>
    <span style={label}>{caption}</span>
  </div>
);

export const DevBrandSheet: React.FC = () => {
  const frame = useCurrentFrame();

  // live pen-draw: draws over the film's timing, holds, then restarts
  const loopLength = LOGO_DRAW_FRAMES + LOGO_PATH2_DELAY_FRAMES + 30;
  const liveProgress = logoProgress(frame % loopLength, 0);

  // the thinking avatar sampled at 8 points across one loop
  const samples = Array.from({length: 8}, (_, i) => (i * AVATAR_LOOP_FRAMES) / 8);

  const pulse = ramp(frame, 0, 20);

  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient, padding: '36px 56px', opacity: 0.4 + 0.6 * pulse}}>
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18}}>
          <div style={{fontFamily: FONTS.heading, fontWeight: 800, fontSize: 30, letterSpacing: '-0.02em'}}>
            <span style={{color: NEUTRAL[200]}}>Mini</span>
            <span style={{color: ACCENT.wordmarkMe}}>Me</span>
            <span style={{color: NEUTRAL[500], fontWeight: 600, fontSize: 20, marginLeft: 14}}>
              brand sheet (patch 01, dev only)
            </span>
          </div>
          <span style={label}>
            frame {frame} · {FPS} fps
          </span>
        </div>

        {/* ------------------------------------------------ logo progress row */}
        <p style={sectionTitle}>MiniMeLogo: pen-draw progress</p>
        <div style={{display: 'flex', gap: 14, marginBottom: 26}}>
          <LogoCell caption="progress 0" progress={0} />
          <LogoCell caption="progress 0.25" progress={0.25} />
          <LogoCell caption="progress 0.50" progress={0.5} />
          <LogoCell caption="progress 0.75" progress={0.75} />
          <LogoCell caption="progress 1" progress={1} />
          <LogoCell caption="progress 1 · glow 0.7" progress={1} glow={0.7} />
          <LogoCell caption="live loop" progress={liveProgress} />
        </div>

        {/* ------------------------------------------------ avatar row */}
        <p style={sectionTitle}>AssistantAvatar: thinking loop sampled across one cycle (1.75 s), plus live and static</p>
        <div style={{display: 'flex', gap: 14, marginBottom: 26, alignItems: 'stretch'}}>
          {samples.map((sampleFrame, i) => (
            <div key={i} style={{...cell, width: 118, height: 120}}>
              <AssistantAvatar mode="thinking" frame={sampleFrame} size={52} />
              <span style={label}>f+{sampleFrame.toFixed(1)}</span>
            </div>
          ))}
          <div style={{...cell, width: 150, height: 120}}>
            <AssistantAvatar mode="thinking" frame={frame} size={26} />
            <span style={label}>live · 26 px</span>
          </div>
          <div style={{...cell, width: 150, height: 120}}>
            <AssistantAvatar mode="static" frame={frame} size={26} />
            <span style={label}>static · 26 px</span>
          </div>
        </div>

        {/* ------------------------------------------------ role grid */}
        <p style={sectionTitle}>Roles in the film: Twemoji + category color + hashed name color</p>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 18px'}}>
          {FILM_ROLES.map((role) => {
            const category = getRoleCategory(role);
            return (
              <div
                key={role}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '6px 12px',
                  border: `1px solid ${NEUTRAL[800]}`,
                  borderRadius: 8,
                  background: 'rgba(10,10,10,0.5)',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: category.color,
                    opacity: 0.92,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Emoji emoji={category.icon} size={20} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                  <span style={{fontFamily: FONTS.body, fontWeight: 500, fontSize: 15, color: roleNameColor(role)}}>
                    {role}
                  </span>
                  <span style={{...label, fontSize: 11}}>
                    {category.key} · {category.color} · {tierText('adaptive')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ------------------------------------------------ endpoints + tiers */}
        <div style={{display: 'flex', gap: 28, marginTop: 18, alignItems: 'center'}}>
          {[INPUT_NODE, OUTPUT_NODE, {key: DEFAULT_CATEGORY.key, label: 'Default role', icon: DEFAULT_CATEGORY.icon, color: DEFAULT_CATEGORY.color}].map((node) => (
            <div key={node.key} style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: node.color,
                  opacity: 0.92,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Emoji emoji={node.icon} size={18} />
              </div>
              <span style={{...label, color: NEUTRAL[300]}}>{node.label}</span>
            </div>
          ))}
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <Emoji emoji={EXTRA_EMOJI.bookmark} size={22} />
            <span style={{...label, color: NEUTRAL[300]}}>Save as template</span>
          </div>
          <div style={{display: 'flex', gap: 18, marginLeft: 'auto'}}>
            {([0, 1, 2, 3] as const).map((tier) => (
              <span key={tier} style={{fontFamily: FONTS.body, fontWeight: 500, fontSize: 14, color: tierColor(tier)}}>
                ● {tierLabel(tier)}
              </span>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </FontsReady>
  );
};
