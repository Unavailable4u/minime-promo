import React from 'react';
import {Pill, Slide, Stat, Wordmark} from '../kit';
import {Txt} from '../Txt';
import {Shot} from '../Shot';
import {CROPS} from '../shots';
import {QrBlock} from '../Qr';
import {text} from '../words';
import {facts} from '../facts';
import {inputs} from '../data/inputs';
import {CONTENT} from '../theme';

/**
 * Slide 1, Cover (ink, opening). The real splash screen is the ground on the right (logo and glow, `CROPS.splashLogo`);
 * the left carries the title, the subline and four verified numbers. Bottom right: a QR tile for the live app if it exists
 * (U3), else the company website. Founders' names come from inputs.ts (U1) when set.
 */
const Glow: React.FC = () => (
  <Shot
    id="splash"
    width={1360}
    crop={CROPS.splashLogo}
    maxScale={1.5}
    frame={false}
    style={{
      position: 'absolute',
      right: -120,
      top: -40,
      opacity: 0.8,
      WebkitMaskImage: 'radial-gradient(ellipse 52% 58% at 50% 50%, #000 28%, transparent 100%)',
      maskImage: 'radial-gradient(ellipse 52% 58% at 50% 50%, #000 28%, transparent 100%)',
    }}
  />
);

export const S01: React.FC = () => {
  const w = text(1);
  const [tagline, tabs, agents, roles, tiers, preLaunch, scan] = w.labels;
  const url = inputs.liveUrl ?? inputs.companyUrl;
  return (
    <Slide n={1} theme="ink" backdrop={<Glow />} contentStyle={{justifyContent: 'space-between'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <Wordmark />
        <Txt size="label" tone="muted">
          {tagline}
        </Txt>
      </div>

      <div style={{maxWidth: 1180}}>
        <Txt size="cover" as="h1">
          {w.headline}
        </Txt>
        <div style={{display: 'flex', alignItems: 'center', gap: 36, marginTop: 32}}>
          <Txt size="sub" tone="secondary">
            {w.lines[0]}
          </Txt>
          <Pill>{preLaunch}</Pill>
        </div>
      </div>

      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 44}}>
          <div style={{display: 'flex', gap: 72}}>
            <Stat value={facts.tabs.value.count} caption={tabs} />
            <Stat value={facts.agents.value.specialist} caption={agents} />
            <Stat value={facts.agents.value.roles} caption={roles} />
            <Stat value={facts.routing.value.count} caption={tiers} />
          </div>
          {inputs.founders ? (
            <div style={{display: 'flex', gap: 48, width: CONTENT.width - 560}}>
              {inputs.founders.map((f) => (
                <div key={f.name}>
                  <Txt size="body">{f.name}</Txt>
                  <Txt size="caption" tone="muted" style={{marginTop: 4}}>
                    {f.role}
                  </Txt>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
          <QrBlock text={url} />
          <Txt size="label" tone="muted">
            {scan}
          </Txt>
        </div>
      </div>
    </Slide>
  );
};
