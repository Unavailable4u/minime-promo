import React from 'react';
import {PinDot, Slide, splitLabel} from '../kit';
import {Txt} from '../Txt';
import {Shot, type ShotRef} from '../Shot';
import {CROPS} from '../shots';
import {text} from '../words';

/**
 * Slide 5, Solution 3 of 3: build, test, grow (paper). Three columns, one framed shot each: the code editor (a small demo
 * file, so nothing here says it is the plant monitor), the simulated-customer personas (the persona cards only: the result
 * table with the raw `<br>` text is cropped away) and the content fan-out to platforms. Each column has a numbered pin with a
 * mono head ("Build", "Test", "Growth"), a caption under the shot and one detail line read off the screenshot.
 */
const COLUMNS = 3;
const GAP = 40;
const WIDTH = (1728 - GAP * (COLUMNS - 1)) / COLUMNS;
/** The three crops share one aspect ratio, so every shot is this tall at this width. */
const STAGE = 431;

const SHOTS: readonly ShotRef[] = [
  {id: 'build', width: WIDTH, crop: CROPS.buildEditor},
  {id: 'test', width: WIDTH, crop: CROPS.testPersonas},
  {id: 'growth', width: WIDTH, crop: CROPS.growthFanout},
];

export const S05: React.FC = () => {
  const w = text(5);
  const [buildLabel, testLabel, growthLabel, buildDetail, testDetail, growthDetail] = w.labels;
  const columns = [
    {label: buildLabel, detail: buildDetail, shot: SHOTS[0]},
    {label: testLabel, detail: testDetail, shot: SHOTS[1]},
    {label: growthLabel, detail: growthDetail, shot: SHOTS[2]},
  ];
  return (
    <Slide n={5} tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>
      <Txt size="sub" tone="secondary" style={{marginTop: 16}}>
        {w.lines[0]}
      </Txt>

      <div style={{display: 'flex', gap: GAP, marginTop: 'auto'}}>
        {columns.map(({label, detail, shot}, i) => {
          const [head, caption] = splitLabel(label, true);
          return (
            <div key={shot.id} style={{width: WIDTH, display: 'flex', flexDirection: 'column', gap: 18}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <PinDot n={i + 1} />
                <Txt size="label" tone="muted">
                  {head}
                </Txt>
              </div>
              <div style={{height: STAGE}}>
                <Shot {...shot} />
              </div>
              <div>
                <Txt size="body" strong>
                  {caption}
                </Txt>
                <Txt size="caption" tone="secondary" style={{marginTop: 6}}>
                  {detail}
                </Txt>
              </div>
            </div>
          );
        })}
      </div>
    </Slide>
  );
};
