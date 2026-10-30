/**
 * MiniMe promo — Working Panel geometry (single source of truth, like shellLayout.ts for the shell).
 *
 * Everything is in the UI's logical 1440x810 space with the panel FULLY open (x 960..1440, y 48..810).
 * The panel stacks, top to bottom: header (40) / trace link / task excerpt / routing card / "Save as template" /
 * the graph slot (fixed height) / the step-card list (fills the rest, clipped; scroll it with `stepsScrollY`).
 * All heights are fixed so cursor targets and callouts can be derived without measuring the DOM.
 */
import {SHELL, type Rect} from './shellLayout';
import {UI} from '../config/timeline';

export const PANEL = {
  w: SHELL.panelMaxW,
  headerH: SHELL.paneHeaderH,
  pad: 12,
  linkH: 16,
  excerptH: 16,
  routingH: 30,
  saveH: 24,
  saveW: 132,
  graphH: 288,
  /** Height of a collapsed step card: py8 + 16 line + 2 border. */
  stepH: 34,
  stepGap: 6,
  gapAfterLink: 6,
  gapAfterExcerpt: 8,
  gapAfterRouting: 8,
  gapAfterSave: 10,
  gapAfterGraph: 10,
} as const;

export type PanelLayout = {
  header: Rect;
  collapseButton: Rect;
  traceLink: Rect;
  excerpt: Rect;
  routingCard: Rect;
  saveTemplate: Rect;
  graph: Rect;
  steps: Rect;
};

/** Rectangles of the panel parts (panel fully open). Step card i of a collapsed list starts at steps.y + i * (stepH + stepGap). */
export const panelLayout = (): PanelLayout => {
  const x0 = UI.width - PANEL.w;
  const top = SHELL.headerH;
  const x = x0 + PANEL.pad;
  const w = PANEL.w - PANEL.pad * 2;
  let y = top + PANEL.headerH + PANEL.pad;
  const traceLink = {x, y, w: 150, h: PANEL.linkH};
  y += PANEL.linkH + PANEL.gapAfterLink;
  const excerpt = {x, y, w, h: PANEL.excerptH};
  y += PANEL.excerptH + PANEL.gapAfterExcerpt;
  const routingCard = {x, y, w, h: PANEL.routingH};
  y += PANEL.routingH + PANEL.gapAfterRouting;
  const saveTemplate = {x, y, w: PANEL.saveW, h: PANEL.saveH};
  y += PANEL.saveH + PANEL.gapAfterSave;
  const graph = {x, y, w, h: PANEL.graphH};
  y += PANEL.graphH + PANEL.gapAfterGraph;
  const bottom = UI.height - PANEL.pad;
  return {
    header: {x: x0, y: top, w: PANEL.w, h: PANEL.headerH},
    collapseButton: {x: UI.width - 16 - 22, y: top + (PANEL.headerH - 22) / 2, w: 22, h: 22},
    traceLink,
    excerpt,
    routingCard,
    saveTemplate,
    graph,
    steps: {x, y, w, h: bottom - y},
  };
};

/** Absolute rectangle of collapsed step card `index` (0-based) in the list, ignoring expanded cards above it. */
export const stepCardRect = (index: number): Rect => {
  const steps = panelLayout().steps;
  return {x: steps.x, y: steps.y + index * (PANEL.stepH + PANEL.stepGap), w: steps.w, h: PANEL.stepH};
};
