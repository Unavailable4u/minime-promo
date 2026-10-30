import React from 'react';
import {ExternalLink, PanelRightClose} from 'lucide-react';
import {UI_TEXT} from '../config/copy';
import {NEUTRAL, NEUTRAL_ALPHA} from '../config/theme';
import {lerpColor} from '../lib/color';
import {clamp01, ramp, signatureEase} from '../lib/ease';
import {EXTRA_EMOJI} from '../lib/roleIcons';
import {Emoji} from './Emoji';
import {PANEL} from './panelLayout';
import {RoutingCard, type RoutingCardProps} from './RoutingCard';

/** Frames between two items of the cascade-in, and frames one item takes to settle. */
export const PANEL_CASCADE_STAGGER = 3;
export const PANEL_CASCADE_ITEM_FRAMES = 10;
/** Cascade items: 0 header, 1 trace link, 2 excerpt, 3 routing card, 4 save row, 5 graph. */
export const PANEL_CASCADE_ITEMS = 6;
/** Frames from the start of the cascade until the last item has settled. */
export const PANEL_CASCADE_FRAMES = (PANEL_CASCADE_ITEMS - 1) * PANEL_CASCADE_STAGGER + PANEL_CASCADE_ITEM_FRAMES;

export type WorkingPanelProps = {
  /**
   * Frames elapsed since the cascade started (item i fades in from `i * 3` over 10 frames). Default: finished.
   * The panel's WIDTH is not a prop here: AppWindow reveals this 480 px content by clipping (`panelWidth`).
   */
  cascade?: number;
  /** Task excerpt, one line with ellipsis (PROMPTS.teamExcerpt). */
  taskExcerpt: string;
  /** Props of the routing card (tier, morph, open...). `appear` is set by the panel. */
  routing?: Omit<RoutingCardProps, 'appear'>;
  /** Cursor hover flags for the panel's own controls. */
  hover?: {collapse?: boolean; trace?: boolean; save?: boolean};
  /** "Save as template" press 0..1 (pressed in, then back out). Default 0. */
  savePress?: number;
  /** The routing graph (patch 06). It gets a 456 x 288 slot. Omitted: an empty slot is kept. */
  graph?: React.ReactNode;
  /** Scroll offset of the step list in px (translateY(-stepsScrollY)). Default 0. */
  stepsScrollY?: number;
  /** The <StepCard/> list. */
  children?: React.ReactNode;
};

const item = (cascade: number, index: number): {opacity: number; transform: string} => {
  const p = signatureEase(ramp(cascade, index * PANEL_CASCADE_STAGGER, index * PANEL_CASCADE_STAGGER + PANEL_CASCADE_ITEM_FRAMES));
  return {opacity: p, transform: `translateY(${8 * (1 - p)}px)`};
};

/**
 * Working Panel content (480 px wide; AppWindow clips it while it opens). Left border #262626, 40 px header with
 * the collapse icon, then trace link, task excerpt, routing card, "Save as template", the graph slot and the
 * step cards (gap 6). Geometry lives in panelLayout.ts.
 */
export const WorkingPanel: React.FC<WorkingPanelProps> = ({
  cascade = 999,
  taskExcerpt,
  routing,
  hover,
  savePress = 0,
  graph,
  stepsScrollY = 0,
  children,
}) => {
  const press = signatureEase(clamp01(savePress));
  const saveHover = hover?.save === true || press > 0;
  return (
    <div
      style={{
        position: 'relative',
        width: PANEL.w,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* left border as an overlay so the content keeps the exact panelLayout() geometry */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: NEUTRAL[800]}} />
      <div
        style={{
          height: PANEL.headerH,
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '0 16px',
          borderBottom: `1px solid ${NEUTRAL[800]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...item(cascade, 0),
        }}
      >
        <div style={{fontSize: 12, lineHeight: '16px', fontWeight: 500, color: NEUTRAL[400]}}>{UI_TEXT.workingPanelTitle}</div>
        <div style={{width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <PanelRightClose size={14} strokeWidth={2} color={hover?.collapse ? NEUTRAL[300] : NEUTRAL[500]} />
        </div>
      </div>

      <div style={{flex: 1, minHeight: 0, boxSizing: 'border-box', padding: PANEL.pad, display: 'flex', flexDirection: 'column'}}>
        {/* trace link */}
        <div style={{height: PANEL.linkH, marginBottom: PANEL.gapAfterLink, flexShrink: 0, ...item(cascade, 1)}}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              lineHeight: '16px',
              color: hover?.trace ? NEUTRAL[300] : NEUTRAL[500],
              textDecoration: hover?.trace ? 'underline' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {UI_TEXT.traceLink}
            <ExternalLink size={10} strokeWidth={2} />
          </div>
        </div>

        {/* task excerpt */}
        <div
          style={{
            height: PANEL.excerptH,
            marginBottom: PANEL.gapAfterExcerpt,
            flexShrink: 0,
            fontSize: 12,
            lineHeight: '16px',
            color: NEUTRAL[500],
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...item(cascade, 2),
          }}
        >
          {taskExcerpt}
        </div>

        {/* routing card (its own entrance comes from the cascade) */}
        <div style={{marginBottom: PANEL.gapAfterRouting, flexShrink: 0}}>
          <RoutingCard {...routing} appear={ramp(cascade, 3 * PANEL_CASCADE_STAGGER, 3 * PANEL_CASCADE_STAGGER + PANEL_CASCADE_ITEM_FRAMES)} />
        </div>

        {/* save as template */}
        <div style={{height: PANEL.saveH, marginBottom: PANEL.gapAfterSave, flexShrink: 0, ...item(cascade, 4)}}>
          <div
            style={{
              width: PANEL.saveW,
              height: PANEL.saveH,
              boxSizing: 'border-box',
              padding: '0 8px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              lineHeight: '16px',
              color: lerpColor(saveHover ? NEUTRAL[300] : NEUTRAL[500], NEUTRAL[100], press),
              background: lerpColor('rgba(255, 255, 255, 0)', NEUTRAL_ALPHA.white08, saveHover ? Math.max(0.5, press) : 0),
              transform: `scale(${1 - 0.04 * press})`,
              whiteSpace: 'nowrap',
            }}
          >
            <Emoji emoji={EXTRA_EMOJI.bookmark} size={12} />
            {UI_TEXT.saveTemplate}
          </div>
        </div>

        {/* graph slot */}
        <div style={{height: PANEL.graphH, marginBottom: PANEL.gapAfterGraph, flexShrink: 0, position: 'relative', ...item(cascade, 5)}}>
          {graph}
        </div>

        {/* step cards */}
        <div style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: PANEL.stepGap, transform: `translateY(${-stepsScrollY}px)`}}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
