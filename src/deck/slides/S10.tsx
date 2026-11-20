import React from 'react';
import {Card, Pill, Slide, Stat} from '../kit';
import {Txt} from '../Txt';
import {Shot, type ShotRef} from '../Shot';
import {CROPS} from '../shots';
import {PALETTE} from '../theme';
import {text} from '../words';
import {facts, formatNumber, formatUsd} from '../facts';
import {inputs} from '../data/inputs';

/**
 * Slide 10, Traction and projection (paper). Left, "What exists today": three real screenshots of the built product (blueprint,
 * code editor, Role Library), two verified numerals (11 tabs, 59 specialist agents), the "Pre-launch" pill and the
 * line that says nothing here is a user count (H4). U7 (testers, quotes) and U8 (awards, grants) are listed under the numerals
 * only when the founders supplied them. Right, "Targets, unvalidated": MRR at months 6, 12, 24 and 36 as bars on one linear
 * scale (so the early months are honestly tiny), with the paid users and the registered builders of each month under them.
 * Every number on the right has status T in facts.ts: the head says "targets" and the foot says "not forecasts" (H1).
 * No sentence and no number is typed here.
 */
const LEFT_WIDTH = 760;
const BAR_AREA = 270;
const LABEL_COLUMN = 250;

const BLUEPRINT: ShotRef = {id: 'blueprint', width: 440, crop: CROPS.planBlueprint};
const EDITOR: ShotRef = {id: 'build', width: 290, crop: CROPS.buildEditor};
const ROLES: ShotRef = {id: 'roles', width: 290, crop: CROPS.roleCards};

export const S10: React.FC = () => {
  const w = text(10);
  const [noUsers, notForecasts] = w.lines;
  const [existsHead, tabsCaption, agentsCaption, targetsHead, paidName, registeredName] = w.labels;
  const [, month, preLaunch, mrrName] = w.graphic;

  const {months, usd} = facts.mrr.value;
  const {paid, registered} = facts.funnel.value;
  const top = Math.max(...usd);
  const columns = `${LABEL_COLUMN}px repeat(${months.length}, 1fr)`;
  const notes = [...(inputs.traction ?? []), ...(inputs.recognition ?? [])];

  return (
    <Slide n={10} tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>

      <div style={{display: 'flex', gap: 40, marginTop: 36, flex: 1, minHeight: 0}}>
        <div style={{width: LEFT_WIDTH, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Txt size="label" tone="muted">
              {existsHead}
            </Txt>
            <Pill>{preLaunch}</Pill>
          </div>

          <div style={{display: 'flex', gap: 20, alignItems: 'flex-start'}}>
            <Shot {...BLUEPRINT} />
            <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
              <Shot {...EDITOR} />
              <Shot {...ROLES} />
            </div>
          </div>

          <div style={{display: 'flex', gap: 48}}>
            <Stat value={facts.tabs.value.count} caption={tabsCaption} tone="data" />
            <Stat value={facts.agents.value.specialist} caption={agentsCaption} tone="data" />
          </div>

          {notes.length ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              {notes.map((note) => (
                <Txt key={note} size="caption" tone="secondary">
                  {note}
                </Txt>
              ))}
            </div>
          ) : null}
          <Txt size="caption" tone="muted">
            {noUsers}
          </Txt>
        </div>

        <Card style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px 32px'}}>
          <Txt size="label" tone="muted">
            {targetsHead}
          </Txt>

          <div style={{display: 'grid', gridTemplateColumns: columns, alignItems: 'end', columnGap: 18, marginTop: 20}}>
            <Txt size="caption" tone="muted" style={{paddingBottom: 6}}>
              {mrrName}
            </Txt>
            {usd.map((value, i) => (
              <div key={months[i]} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                <Txt size="body" strong tone="data">
                  {formatUsd(value)}
                </Txt>
                <div style={{alignSelf: 'stretch', height: Math.max(6, (value / top) * BAR_AREA), borderRadius: 8, backgroundColor: PALETTE.cobalt, opacity: 0.55}} />
              </div>
            ))}
          </div>

          <div style={{height: 2, backgroundColor: PALETTE.paperLine, marginBlock: 14}} />

          <div style={{display: 'grid', gridTemplateColumns: columns, alignItems: 'center', columnGap: 18, rowGap: 18}}>
            <div />
            {months.map((m) => (
              <Txt key={m} size="label" tone="muted" align="center">
                {month} {m}
              </Txt>
            ))}
            <Txt size="caption" tone="secondary">
              {paidName}
            </Txt>
            {paid.map((value, i) => (
              <Txt key={months[i]} size="body" align="center">
                {formatNumber(value)}
              </Txt>
            ))}
            <Txt size="caption" tone="secondary">
              {registeredName}
            </Txt>
            {registered.map((value, i) => (
              <Txt key={months[i]} size="body" align="center">
                {formatNumber(value)}
              </Txt>
            ))}
          </div>

          <Txt size="caption" tone="muted" align="right" style={{marginTop: 20}}>
            {notForecasts}
          </Txt>
        </Card>
      </div>
    </Slide>
  );
};