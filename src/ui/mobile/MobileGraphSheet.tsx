import React from 'react';
import {appStateAt} from '../../config/appState';
import {MOBILE_LAYOUT as L} from '../../config/mobileScript';
import {FONTS, NEUTRAL} from '../../config/theme';
import {clamp01} from '../../lib/ease';
import {RoutingGraph} from '../RoutingGraph';

export type MobileGraphSheetProps = {
  open: number;
  /** Film content frame the graph is built from (grows while the sheet is open). */
  graphFrame: number;
};

/** The routing graph as a bottom sheet: rises from the bottom, a handle on top, the graph scaled to the sheet width. */
export const MobileGraphSheet: React.FC<MobileGraphSheetProps> = ({open, graphFrame}) => {
  const o = clamp01(open);
  if (o <= 0.001) {
    return null;
  }
  const state = appStateAt(graphFrame);
  const height = L.h - L.sheetTop;
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, background: `rgba(0,0,0,${(0.4 * o).toFixed(3)})`}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: L.h - height * o,
          width: L.w,
          height,
          background: '#101010',
          borderRadius: '22px 22px 0 0',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 -20px 60px rgba(0,0,0,0.6)',
          fontFamily: FONTS.body,
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: L.sheetHandle.x - 22, top: L.sheetHandle.y - (L.sheetTop) - 3, width: 44, height: 5, borderRadius: 3, background: NEUTRAL[600]}} />
        <div style={{position: 'absolute', left: 16, top: 34, fontSize: 12, fontWeight: 600, color: NEUTRAL[400]}}>Routing graph</div>
        <div style={{position: 'absolute', left: 16, right: 16, top: 62, height: 330}}>
          {state.panel ? <RoutingGraph frame={graphFrame} nodes={state.panel.graph.nodes} edges={state.panel.graph.edges} /> : null}
        </div>
      </div>
    </>
  );
};
