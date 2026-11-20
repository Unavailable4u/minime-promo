import React from 'react';
import {Card, Slide} from '../kit';
import {Txt} from '../Txt';
import {PALETTE} from '../theme';
import {text} from '../words';
import {facts, formatNumber, formatUsd, formatUsdCents} from '../facts';

/**
 * Slide 7, Business model and pricing (paper). Row 1: the four plans, each a card with the USD price as a serif numeral, the BDT
 * price under it and the word "plan" in its heading (the Free card is outlined: "free to start"). Row 2, left: gross profit per
 * paid user per month as three bars drawn with divs (no chart library), titled with the word "plan". Row 2, right: three tiles
 * (gross margin, Basic users to cover lean infrastructure and the free tier, what one free user costs). Foot: the small print and
 * the footnote "Launch plan, not live yet. Figures are assumptions, not results."
 *
 * Every number on this slide has status A in facts.ts, so the word "plan" stands beside every one of them (H1): in the card
 * headings, the chart title and the three tile captions, which all come from words.ts. No sentence and no number is typed here.
 */
const CHART_WIDTH = 860;
const BAR_TRACK = 410;
const BAR_HEIGHT = 36;

export const S07: React.FC = () => {
  const w = text(7);
  const [footnote, freeNote, annualNote] = w.lines;
  const [chartTitle, marginCaption, breakevenCaption, freeUserCaption] = w.labels;
  const [, perMonth, currency, about, planWord] = w.graphic;

  const plans = facts.plans.value.tiers;
  const gp = facts.gp.value;
  const bars = [
    {name: plans[1].name, usd: gp.basicUsd},
    {name: plans[2].name, usd: gp.moderateUsd},
    {name: plans[3].name, usd: gp.ultimateUsd},
  ];
  const top = Math.max(...bars.map((bar) => bar.usd));

  const tiles = [
    {figure: `${facts.margin.value.typicalGrossMarginPct}%`, caption: marginCaption},
    {figure: String(facts.breakeven.value.basicUsers), caption: breakevenCaption},
    {figure: formatUsdCents(facts.free_cost.value.usdPerActiveFreeUserPerMonth), caption: freeUserCaption},
  ];

  return (
    <Slide n={7} tag={w.graphic[0]}>
      <Txt size="headline" as="h1">
        {w.headline}
      </Txt>

      <div style={{display: 'flex', gap: 24, marginTop: 34}}>
        {plans.map((plan, i) => {
          const free = i === 0;
          return (
            <Card key={plan.name} accent={free} style={{flex: 1, minWidth: 0, padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 10}}>
              <Txt size="label" tone={free ? 'accent' : 'muted'} style={{marginBottom: 8}}>
                {plan.name} {planWord}
              </Txt>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
                <Txt size="display">{formatUsd(plan.usd)}</Txt>
                <Txt size="caption" tone="muted">
                  {perMonth}
                </Txt>
              </div>
              <Txt size="code" tone="secondary">
                {currency} {formatNumber(plan.bdt)}
              </Txt>
              {free ? (
                <Txt size="caption" tone="secondary" style={{marginTop: 4}}>
                  {freeNote}
                </Txt>
              ) : null}
            </Card>
          );
        })}
      </div>

      <div style={{display: 'flex', gap: 24, marginTop: 24, flex: 1, minHeight: 0}}>
        <Card style={{width: CHART_WIDTH, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 30px'}}>
          <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
            <Txt size="label" tone="muted">
              {chartTitle}
            </Txt>
            <Txt size="caption" tone="muted">
              {perMonth}
            </Txt>
          </div>
          {bars.map((bar) => (
            <div key={bar.name} style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <Txt size="body" strong style={{width: 150}}>
                {bar.name}
              </Txt>
              <div style={{width: BAR_TRACK, height: BAR_HEIGHT, borderRadius: 8, backgroundColor: PALETTE.paperLine, position: 'relative'}}>
                <div style={{position: 'absolute', left: 0, top: 0, height: BAR_HEIGHT, width: (bar.usd / top) * BAR_TRACK, borderRadius: 8, backgroundColor: PALETTE.cobalt}} />
              </div>
              <Txt size="body" strong tone="data" align="right" style={{flex: 1}}>
                {formatUsdCents(bar.usd)}
              </Txt>
            </div>
          ))}
        </Card>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12, minWidth: 0}}>
          {tiles.map(({figure, caption}) => (
            <Card key={caption} style={{flex: 1, display: 'flex', alignItems: 'center', gap: 20, padding: '10px 26px'}}>
              <div style={{width: 300, display: 'flex', alignItems: 'baseline', gap: 12, flexShrink: 0}}>
                <Txt size="caption" tone="muted">
                  {about}
                </Txt>
                <Txt size="headline" tone="data">
                  {figure}
                </Txt>
              </div>
              <Txt size="body" tone="secondary" style={{flex: 1}}>
                {caption}
              </Txt>
            </Card>
          ))}
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 14}}>
        <Txt size="caption" tone="secondary">
          {annualNote}
        </Txt>
        <Txt size="caption" tone="muted">
          {footnote}
        </Txt>
      </div>
    </Slide>
  );
};
