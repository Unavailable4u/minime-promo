import React from 'react';
import {Card, Portrait, Slide} from '../kit';
import {Txt} from '../Txt';
import {shortUrl} from '../Qr';
import {text} from '../words';
import {inputs} from '../data/inputs';

/**
 * Slide 9, Team (paper). Needs U1 (both founders with name, role and photo): the export skips the slide until they are set.
 * Row 1: two founder cards (own photo as a head-and-shoulders circle, name, role, the "why us" line when U1 has one, and the
 * printed LinkedIn path when U1 has one). Foot: one strip with the
 * cap table (U9 split, else "100% founders") and what we seek (U6 advisors, else "product and pricing mentors").
 * No sentence and no number is typed here.
 */
export const S09: React.FC = () => {
  const w = text(9);
  const [capDefault, seekingDefault] = w.lines;
  const [, capLabel, advisorsLabel] = w.graphic;
  const founders = inputs.founders ?? [];

  const cap = inputs.split ? `${capLabel} ${inputs.split}` : capDefault;
  const seeking = inputs.advisors ? `${advisorsLabel} ${inputs.advisors.map((a) => `${a.name}, ${a.line}`).join('; ')}` : seekingDefault;

  return (
    <Slide n={9} tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>

      <div style={{display: 'flex', gap: 24, marginTop: 40, flex: 1, minHeight: 0}}>
        {founders.map((founder) => (
          <Card key={founder.name} style={{flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 36, padding: '30px 36px'}}>
            <Portrait photo={founder.photo} size={310} />
            <div style={{minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14}}>
              <Txt size="sub">{founder.name}</Txt>
              <Txt size="label" tone="muted">
                {founder.role}
              </Txt>
              {founder.whyUs ? (
                <Txt size="body" tone="secondary">
                  {founder.whyUs}
                </Txt>
              ) : null}
              {founder.linkedin ? (
                <Txt size="caption" tone="secondary" style={{overflowWrap: 'anywhere'}}>
                  {shortUrl(founder.linkedin)}
                </Txt>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <Card style={{marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, padding: '18px 36px'}}>
        <Txt size="body" strong>
          {cap}
        </Txt>
        <Txt size="body" tone="secondary">
          {seeking}
        </Txt>
      </Card>
    </Slide>
  );
};
