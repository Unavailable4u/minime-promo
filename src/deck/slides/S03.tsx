import React from 'react';
import {Card, Pin, PinDot, Slide, Stat, splitLabel} from '../kit';
import {Txt} from '../Txt';
import {Shot, mapPoint, shotLayout, type ShotRef} from '../Shot';
import {CROPS, NAV_STAGES} from '../shots';
import {PALETTE} from '../theme';
import {text} from '../words';
import {facts} from '../facts';

/**
 * Slide 3, Solution 1 of 3: the promise (paper). Left: the real landing hero with its own promise line, and under it the tab
 * row of the real workspace (`CROPS.navStrip`, the account name is cropped out). Four crimson brackets under the strip mark the
 * seven lifecycle stages in four groups (`NAV_STAGES`), each with a numbered pin. Right: the legend of the four pins (pin 2 has
 * the notebook mind map next to it, small) and two verified numerals, read from facts.ts. No sentence and no number is typed here.
 */
const LEFT = 900;
const LANDING: ShotRef = {id: 'landing', width: LEFT};
const NAV: ShotRef = {id: 'chat_nav', width: LEFT, crop: CROPS.navStrip};
const MAP: ShotRef = {id: 'notebooks', width: 200, crop: CROPS.notebooksMap};

/** Space under the strip for the brackets, the ticks and the pins. */
const PIN_ZONE = 92;

/** `Array.map` hands the index as a second argument, which is not the `capitalise` flag of splitLabel. */
const splitPair = (label: string): [string, string] => splitLabel(label);

export const S03: React.FC = () => {
  const w = text(3);
  const [chat, notebooks, researchPlan, buildTestGrowth, landingCaption, tabsCaption, stagesCaption] = w.labels;
  const legend = [chat, notebooks, researchPlan, buildTestGrowth].map(splitPair);
  const navHeight = shotLayout(NAV).height;
  return (
    <Slide n={3} tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>
      <Txt size="sub" tone="secondary" style={{marginTop: 16}}>
        {w.lines[0]}
      </Txt>

      <div style={{display: 'flex', gap: 56, marginTop: 36, flex: 1, minHeight: 0}}>
        <div style={{width: LEFT, flexShrink: 0}}>
          <Shot {...LANDING} />
          <Txt size="caption" tone="muted" style={{marginTop: 10}}>
            {landingCaption}
          </Txt>
          <div style={{position: 'relative', width: LEFT, height: navHeight + PIN_ZONE, marginTop: 14}}>
            <Shot {...NAV} />
            {NAV_STAGES.map((group, i) => {
              const from = mapPoint({x: group.x0, y: 0}, NAV);
              const to = mapPoint({x: group.x1, y: 0}, NAV);
              const centre = (from.x + to.x) / 2;
              return (
                <React.Fragment key={group.x0}>
                  <div
                    style={{
                      position: 'absolute',
                      left: from.x,
                      width: to.x - from.x,
                      top: navHeight + 8,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: PALETTE.accent,
                    }}
                  />
                  <div style={{position: 'absolute', left: centre - 1, top: navHeight + 12, width: 2, height: 16, backgroundColor: PALETTE.accent}} />
                  <Pin n={i + 1} x={centre} y={navHeight + 56} />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0}}>
          {legend.map(([name, what], i) => (
            <Card key={name} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '12px 22px'}}>
              <PinDot n={i + 1} size={48} />
              <div style={{flex: 1, minWidth: 0}}>
                <Txt size="body" strong>
                  {name}
                </Txt>
                <Txt size="caption" tone="secondary" style={{marginTop: 2}}>
                  {what}
                </Txt>
              </div>
              {i === 1 ? <Shot {...MAP} /> : null}
            </Card>
          ))}
          <div style={{flex: 1}} />
          <div style={{display: 'flex', gap: 72}}>
            <Stat value={facts.tabs.value.count} caption={tabsCaption} tone="data" />
            <Stat value={facts.stages.value.count} caption={stagesCaption} tone="data" />
          </div>
        </div>
      </div>
    </Slide>
  );
};
