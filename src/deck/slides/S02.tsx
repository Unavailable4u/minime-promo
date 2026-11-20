import React from 'react';
import {Card, Pin, Slide} from '../kit';
import {Accent, Txt} from '../Txt';
import {Shot, mapPoint, type ShotRef} from '../Shot';
import {CROPS} from '../shots';
import {PALETTE} from '../theme';
import {text} from '../words';

/**
 * Slide 2, Problem (paper). Left: the real drone prompt and the top of the real Tier 3 answer, at about 1.0x so the text is
 * sharp, fading out at the bottom to say "and it goes on". The two numbered pins sit in the blank area right of the answer card
 * so they never cover the screenshot's text. Right: five cards, the rest of the project,
 * each of which needs the context again. Last line: "Then what?" in the accent. No number is typed here.
 */
const SHOT: ShotRef = {id: 'chat', width: 940, crop: CROPS.chatExchange};

export const S02: React.FC = () => {
  const w = text(2);
  const [realPrompt, realAnswer, needsHeading, ...steps] = w.labels;
  const thenWhat = steps.pop();
  const promptPin = mapPoint({x: 1030, y: 236}, SHOT);
  const answerPin = mapPoint({x: 1030, y: 390}, SHOT);
  return (
    <Slide n={2} tag={w.graphic[0]}>
      <Txt size="headline" as="h1" style={{maxWidth: 1500}}>
        {w.headline}
      </Txt>
      <Txt size="sub" tone="secondary" style={{marginTop: 16, maxWidth: 1700}}>
        {w.lines[0]}
      </Txt>

      <div style={{display: 'flex', gap: 56, marginTop: 40, flex: 1, minHeight: 0}}>
        <Shot {...SHOT}>
          <Pin n={1} x={promptPin.x} y={promptPin.y} label={realPrompt} />
          <Pin n={2} x={answerPin.x} y={answerPin.y} label={realAnswer} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 140,
              background: 'linear-gradient(to bottom, rgba(13, 13, 17, 0), #0D0D11)',
            }}
          />
        </Shot>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0}}>
          <Txt size="label" tone="muted">
            {needsHeading}
          </Txt>
          {steps.map((step, i) => (
            <Card key={step} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '16px 24px'}}>
              <Txt size="label" tone="accent">
                {i + 1}
              </Txt>
              <Txt size="body" style={{flex: 1}}>
                {step}
              </Txt>
            </Card>
          ))}
          <Txt size="caption" tone="secondary" style={{marginTop: 4}}>
            {w.lines[1]}
          </Txt>
          <div style={{flex: 1}} />
          <Txt size="headline" as="div">
            <Accent>{thenWhat}</Accent>
          </Txt>
        </div>
      </div>
      <div style={{height: 0, color: PALETTE.ink}} />
    </Slide>
  );
};
