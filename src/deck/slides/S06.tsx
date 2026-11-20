import React from 'react';
import {Card, Pin, PinDot, Slide, Stat, splitLabel} from '../kit';
import {Txt} from '../Txt';
import {Shot, mapPoint, shotLayout, type ShotRef} from '../Shot';
import {CROPS, ROUTING_PINS} from '../shots';
import {PALETTE} from '../theme';
import {text} from '../words';
import {facts} from '../facts';
import {inputs} from '../data/inputs';

/**
 * Slide 6, Process: how one task flows (paper). Left: the real live routing graph from the Working Panel of the Tier 3 answer
 * on slide 2, with four numbered pins (Ask, Route, Specialists, Saved) joined by a thin leader line to the node each one marks.
 * The pins sit in blank graph area and carry only their number: the legend is on the right, as on slide 3. Right: that legend,
 * the four routing tiers (names from facts.routing; one line each from inputs.tierNotes when U13 is set, otherwise the names
 * alone) with a small effort meter, the Adaptive tier outlined because it is the tier the screenshot shows, and the two
 * verified numerals (59 specialist agents, 46 roles) beside a small Role Library shot. No sentence and no number is typed here.
 */
const GRAPH_WIDTH = 640;
/**
 * The graph is the picture of the slide and its labels are not meant to be read, so it is shown at 1.31x. The guide says never
 * upscale past 1.0 unless maxScale is raised on purpose: this is on purpose.
 */
const GRAPH: ShotRef = {id: 'chat', width: GRAPH_WIDTH, crop: CROPS.routingGraph, maxScale: 1.4};
const ROLES: ShotRef = {id: 'roles', width: 400, crop: CROPS.roleCards};

/** Ring around a marked node and the width of the leader line (display px). */
const NODE_RING = 17;
const LEADER = 3;

/** A row of segments, `filled` of `total` lit: the effort of a tier. Pictorial only (the order of the tiers, not a measurement). */
const EffortMeter: React.FC<{filled: number; total: number; lit: string}> = ({filled, total, lit}) => (
  <div style={{display: 'flex', gap: 6}}>
    {Array.from({length: total}, (_, i) => (
      <div key={i} style={{width: 34, height: 10, borderRadius: 5, backgroundColor: i < filled ? lit : PALETTE.paperLine}} />
    ))}
  </div>
);

export const S06: React.FC = () => {
  const w = text(6);
  const legend = w.labels.slice(0, 4).map((label) => splitLabel(label));
  const [agentsCaption, rolesCaption, graphCaption] = w.labels.slice(4);
  const graph = shotLayout(GRAPH);
  const tiers = facts.routing.value.tiers;
  const last = tiers.length - 1;

  return (
    <Slide n={6} tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>
      <Txt size="sub" tone="secondary" style={{marginTop: 16}}>
        {w.lines[0]}
      </Txt>

      <div style={{display: 'flex', gap: 56, marginTop: 36, flex: 1, minHeight: 0}}>
        <div style={{width: GRAPH_WIDTH, flexShrink: 0}}>
          <Shot {...GRAPH}>
            <svg width={graph.width} height={graph.height} style={{position: 'absolute', left: 0, top: 0}}>
              {ROUTING_PINS.map(({pin, node}, i) => {
                const from = mapPoint(pin, GRAPH);
                const to = mapPoint(node, GRAPH);
                return (
                  <g key={i}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={PALETTE.accent} strokeWidth={LEADER} />
                    <circle cx={to.x} cy={to.y} r={NODE_RING} fill="none" stroke={PALETTE.accent} strokeWidth={LEADER} />
                  </g>
                );
              })}
            </svg>
            {ROUTING_PINS.map(({pin}, i) => {
              const at = mapPoint(pin, GRAPH);
              return <Pin key={i} n={i + 1} x={at.x} y={at.y} />;
            })}
          </Shot>
          <Txt size="caption" tone="muted" style={{marginTop: 10}}>
            {graphCaption}
          </Txt>
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px'}}>
            {legend.map(([name, what], i) => (
              <Card key={name} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '12px 20px'}}>
                <PinDot n={i + 1} size={48} />
                <div style={{minWidth: 0}}>
                  <Txt size="body" strong>
                    {name}
                  </Txt>
                  <Txt size="caption" tone="secondary" style={{marginTop: 2}}>
                    {what}
                  </Txt>
                </div>
              </Card>
            ))}
          </div>

          <div style={{display: 'flex', gap: 16}}>
            {tiers.map((tier, i) => {
              const note = inputs.tierNotes?.[i] ?? null;
              const hard = i === last;
              return (
                <Card key={tier.tier} accent={hard} style={{flex: 1, minWidth: 0, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10}}>
                  <Txt size="label" tone={hard ? 'accent' : 'muted'}>
                    {w.graphic[1]} {tier.tier}
                  </Txt>
                  <Txt size="body" strong>
                    {tier.name}
                  </Txt>
                  <EffortMeter filled={i + 1} total={tiers.length} lit={hard ? PALETTE.accent : PALETTE.ink} />
                  {note ? (
                    <Txt size="caption" tone="secondary">
                      {note}
                    </Txt>
                  ) : null}
                </Card>
              );
            })}
          </div>

          <div style={{display: 'flex', alignItems: 'flex-end', gap: 48}}>
            <Stat value={facts.agents.value.specialist} caption={agentsCaption} tone="data" />
            <div style={{maxWidth: 260}}>
              <Stat value={facts.agents.value.roles} caption={rolesCaption} tone="data" />
            </div>
            <div style={{flex: 1}} />
            <Shot {...ROLES} />
          </div>
        </div>
      </div>
    </Slide>
  );
};
