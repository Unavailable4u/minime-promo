import React from 'react';
import {Card, PinDot, Slide, viewBoxOf} from '../kit';
import {Txt} from '../Txt';
import {Shot, type ShotRef} from '../Shot';
import {CROPS} from '../shots';
import {QrBlock, shortUrl} from '../Qr';
import {PALETTE} from '../theme';
import {text} from '../words';
import {facts, formatUsd} from '../facts';
import {inputs} from '../data/inputs';

/**
 * Slide 11, Ask and close (ink). The story of slide 2 ends here: idea in, build plan out.
 * Left: what we want from the Sprint (U12, else mentors, pilot users, pricing feedback), then the pre-launch capital as one
 * stacked bar (facts.capital, rounded, status A: the head says "plan"). No funding route (self-funding, grants) is printed. Middle: three
 * small real shots joined by arrows (PRD, architecture, blueprint: the output of slide 4) and the target line. Right: the QR
 * tile with the printed website URL (U3 live app, else the company site, R11). Foot: the founders' LinkedIn paths (U1) and the
 * contact email (U2) when they are set. No sentence and no number is typed here.
 */
const LEFT_WIDTH = 650;
const SHOT_WIDTH = 330;
const BAR_HEIGHT = 40;

const STORY: readonly {shot: ShotRef; caption: number}[] = [
  {shot: {id: 'prd', width: SHOT_WIDTH, crop: CROPS.storyPrd}, caption: 2},
  {shot: {id: 'arch', width: SHOT_WIDTH, crop: CROPS.storyArch}, caption: 3},
  {shot: {id: 'blueprint', width: SHOT_WIDTH, crop: CROPS.storyBlueprint}, caption: 4},
];

/** A small arrow pointing down, drawn in the muted ink-slide tone, centred under a shot. */
const DownArrow: React.FC = () => (
  <svg width={SHOT_WIDTH} height={34} viewBox={viewBoxOf(SHOT_WIDTH, 34)} style={{display: 'block'}}>
    <line x1={SHOT_WIDTH / 2} y1={2} x2={SHOT_WIDTH / 2} y2={26} stroke={PALETTE.onNightMuted} strokeWidth={2.5} />
    <polyline points={[[SHOT_WIDTH / 2 - 9, 18], [SHOT_WIDTH / 2, 30], [SHOT_WIDTH / 2 + 9, 18]].map((point) => point.join(',')).join(' ')} fill="none" stroke={PALETTE.onNightMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const S11: React.FC = () => {
  const w = text(11);
  const [sprintHead, askDefault, targetLine] = w.lines;
  const [scan] = w.labels;
  const [, capitalHead] = w.graphic;
  const captions = w.graphic.slice(2, 5);

  const url = inputs.liveUrl ?? inputs.companyUrl;
  const asks = inputs.sprintAsk ? [...inputs.sprintAsk] : askDefault.split(/(?<=\.)\s+/).map((a) => a.replace(/\.$/, ''));

  const {totalUsd, parts} = facts.capital.value;
  const colours = [PALETTE.onNightMuted, PALETTE.cobaltOnInk, PALETTE.accentOnInk, PALETTE.onNight];
  const founders = (inputs.founders ?? []).filter((f) => f.linkedin);

  return (
    <Slide n={11} theme="ink" tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>

      <div style={{display: 'flex', gap: 64, marginTop: 36, flex: 1, minHeight: 0}}>
        <div style={{width: LEFT_WIDTH, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div>
            <Txt size="label" tone="muted">
              {sprintHead}
            </Txt>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14}}>
              {asks.map((ask, i) => (
                <Card key={ask} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '8px 22px'}}>
                  <PinDot n={i + 1} size={40} />
                  <Txt size="body">{ask}</Txt>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Txt size="label" tone="muted">
              {capitalHead}
            </Txt>
            <Txt size="headline" tone="data" style={{marginTop: 10}}>
              {formatUsd(totalUsd)}
            </Txt>
            <div style={{display: 'flex', height: BAR_HEIGHT, borderRadius: 10, overflow: 'hidden', gap: 3, marginTop: 14}}>
              {parts.map((part, i) => (
                <div key={part.name} style={{flexGrow: part.usd, flexBasis: 0, backgroundColor: colours[i]}} />
              ))}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14}}>
              {parts.map((part, i) => (
                <div key={part.name} style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <div style={{width: 18, height: 18, borderRadius: 5, backgroundColor: colours[i], flexShrink: 0}} />
                  <Txt size="caption" tone="secondary" style={{flex: 1}}>
                    {part.name}
                  </Txt>
                  <Txt size="caption">{formatUsd(part.usd)}</Txt>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between'}}>
          {STORY.map(({shot, caption}, i) => (
            <React.Fragment key={captions[caption - 2]}>
              {i !== 0 ? <DownArrow /> : null}
              <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
                <Shot {...shot} />
                <Txt size="caption" tone="secondary">
                  {captions[caption - 2]}
                </Txt>
              </div>
            </React.Fragment>
          ))}
          <Txt size="sub" tone="accent" style={{marginTop: 8}}>
            {targetLine}
          </Txt>
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
          <QrBlock text={url} />
          <Txt size="label" tone="muted">
            {scan}
          </Txt>
        </div>
      </div>

      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 40, marginTop: 20, minHeight: 34}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          {founders.map((f) => (
            <Txt key={f.name} size="caption" tone="secondary">
              {f.name} · {shortUrl(f.linkedin ?? '')}
            </Txt>
          ))}
        </div>
        {inputs.contactEmail ? (
          <Txt size="caption" tone="secondary">
            {inputs.contactEmail}
          </Txt>
        ) : null}
      </div>
    </Slide>
  );
};