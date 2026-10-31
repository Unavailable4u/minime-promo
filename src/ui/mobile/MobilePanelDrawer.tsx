import React from 'react';
import {ExternalLink, Maximize2, X} from 'lucide-react';
import {appStateAt} from '../../config/appState';
import {UI_TEXT} from '../../config/copy';
import {MOBILE_LAYOUT as L, MOBILE_TIMES} from '../../config/mobileScript';
import {ACCENT, FONTS, NEUTRAL} from '../../config/theme';
import {clamp01, signatureEase} from '../../lib/ease';
import {StepCard} from '../StepCard';

export type MobilePanelDrawerProps = {
  open: number;
  local: number;
  /** Film content frame the step cards are read from. */
  contentFrame: number;
  pressGraph: number;
};

/** The Working Panel as a right-side drawer (reference 6): header, trace link, step cards (names wrap), "Tap to view routing graph". */
export const MobilePanelDrawer: React.FC<MobilePanelDrawerProps> = ({open, local, contentFrame, pressGraph}) => {
  const o = clamp01(open);
  if (o <= 0.001) {
    return null;
  }
  const state = appStateAt(contentFrame);
  const steps = state.panel ? state.panel.steps : [];
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, background: `rgba(0,0,0,${(0.55 * o).toFixed(3)})`}} />
      <div
        style={{
          position: 'absolute',
          left: L.w - L.panelW * o,
          top: L.statusH,
          width: L.panelW,
          height: L.h - L.statusH - L.homeH,
          background: '#101010',
          boxShadow: 'inset 1px 0 0 #262626, -8px 0 30px rgba(0,0,0,0.5)',
          fontFamily: FONTS.body,
          overflow: 'hidden',
        }}
      >
        <div style={{height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${NEUTRAL[800]}`, boxSizing: 'border-box'}}>
          <span style={{fontSize: 12, fontWeight: 600, color: NEUTRAL[300]}}>{UI_TEXT.workingPanelTitle}</span>
          <X size={16} color={NEUTRAL[400]} />
        </div>
        <div style={{padding: '12px 16px 0', fontSize: 11, color: NEUTRAL[500], display: 'flex', alignItems: 'center', gap: 4}}>
          {UI_TEXT.traceLink}
          <ExternalLink size={10} />
        </div>
        <div style={{position: 'absolute', left: 16, right: 16, top: 54, bottom: 100, overflow: 'hidden'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            {steps.map((step, i) => (
              <div key={step.key} style={{opacity: signatureEase(clamp01((local - 4 - i * MOBILE_TIMES.rowStagger) / 8))}}>
                <StepCard name={step.name} status={step.status} tier={step.tier} ms={step.ms} frame={contentFrame} />
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: L.graphCard.y - L.graphCard.h / 2 - L.statusH,
            height: L.graphCard.h,
            boxSizing: 'border-box',
            borderRadius: 10,
            border: `1px dashed ${NEUTRAL[600]}`,
            background: `rgba(255, 255, 255, ${(0.03 + 0.08 * pressGraph).toFixed(3)})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
            color: pressGraph > 0.2 ? ACCENT.wordmarkMe : NEUTRAL[300],
            transform: `scale(${(1 - 0.04 * pressGraph).toFixed(3)})`,
          }}
        >
          <Maximize2 size={14} />
          Tap to view routing graph
        </div>
      </div>
    </>
  );
};
