import React from 'react';
import {ChevronPath, PinDot, Slide} from '../kit';
import {Txt} from '../Txt';
import {Shot, type ShotRef} from '../Shot';
import {CROPS} from '../shots';
import {text} from '../words';

/**
 * Slide 4, Solution 2 of 3: idea to plan (paper). One real project, the battery-powered plant soil-moisture monitor, in four
 * framed shots: the generated PRD (`prd`), the architecture diagram (`arch`), the 3D blueprint with its parts list
 * (`blueprint`) and the research sources (`research`). A chevron path "Prompt, PRD, Architecture, Blueprint" runs along the top.
 * Each shot has a numbered pin and a mono caption under it; the shots are cropped to the main panel (no sidebar, no account name).
 */
const COLUMNS = 4;
const GAP = 32;
const WIDTH = (1728 - GAP * (COLUMNS - 1)) / COLUMNS;
/** The shots are top-aligned in a stage this tall, so the captions line up. */
const STAGE = 412;

const SHOTS: readonly ShotRef[] = [
  {id: 'prd', width: WIDTH, crop: CROPS.planPrd},
  {id: 'arch', width: WIDTH, crop: CROPS.planArch},
  {id: 'blueprint', width: WIDTH, crop: CROPS.planBlueprint},
  {id: 'research', width: WIDTH, crop: CROPS.researchSources},
];

export const S04: React.FC = () => {
  const w = text(4);
  const [, ...steps] = w.graphic;
  return (
    <Slide n={4} tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>
      <Txt size="sub" tone="secondary" style={{marginTop: 16}}>
        {w.lines[0]}
      </Txt>
      <div style={{marginTop: 26}}>
        <ChevronPath steps={steps} />
      </div>

      <div style={{display: 'flex', gap: GAP, marginTop: 'auto'}}>
        {SHOTS.map((shot, i) => (
          <div key={shot.id} style={{width: WIDTH, display: 'flex', flexDirection: 'column', gap: 18}}>
            <div style={{height: STAGE}}>
              <Shot {...shot} />
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <PinDot n={i + 1} />
              <Txt size="caption" tone="secondary" style={{flex: 1}}>
                {w.labels[i]}
              </Txt>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
};
