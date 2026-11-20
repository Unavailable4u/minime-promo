import React from 'react';
import {Card, Slide, dashes, splitLabel, viewBoxOf} from '../kit';
import {Txt} from '../Txt';
import {PALETTE} from '../theme';
import {text} from '../words';
import {inputs} from '../data/inputs';

/**
 * Slide 8, Competition, why now, market (paper). Left: a 2x2 positioning map drawn as SVG (x: forgets to remembers, y: one answer
 * to the whole project) with four competitor CATEGORIES as grey dots and MiniMe in the accent, captioned "Our view." (H5: no
 * named competitor unless the founders verified it: inputs.competitors, U11, adds a "Verified" row under the map when set).
 * Right: three nested rings (students and indie builders paying in BDT, South Asia, the world) drawn as SVG, with the numbers and
 * sources the founders supply in inputs.market (U5) and none otherwise: the rings are NOT drawn to scale. Bottom: the secret sauce
 * (memory + routing + the full lifecycle), the closing line and the why-now line.
 *
 * The positions of the dots are the founders' opinion, not data. Labels are HTML (Txt) laid over the SVG so the type presets and
 * the 22 px floor still apply. No sentence and no number is typed here.
 */
const MAP_WIDTH = 900;
const RINGS_WIDTH = 1728 - MAP_WIDTH - 24;

/** Height of the two drawings: shorter when the "Verified" row needs the room (U11 set). */
const TOP_HEIGHT = inputs.competitors ? 330 : 396;

type Dot = {x: number; y: number; side: 'left' | 'right'};
/** The four categories, in the order of words.graphic[6..9]. x: 0 forgets .. 1 remembers; y: 0 one answer .. 1 whole project. */
const DOTS: readonly Dot[] = [
  {x: 0.1, y: 0.12, side: 'right'}, // chat assistants
  {x: 0.36, y: 0.44, side: 'right'}, // code agents (just under the midline so its label does not clip the MiniMe quadrant)
  {x: 0.2, y: 0.72, side: 'right'}, // app builders
  {x: 0.8, y: 0.3, side: 'left'}, // note and research tools
];
const MINIME: Dot = {x: 0.84, y: 0.84, side: 'left'};

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number}> = ({x1, y1, x2, y2}) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 12;
  const wing = (turn: number): string => [x2 - head * Math.cos(angle + turn), y2 - head * Math.sin(angle + turn)].join(',');
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PALETTE.inkMuted} strokeWidth={2} />
      <polygon points={[[x2, y2].join(','), wing(0.45), wing(-0.45)].join(' ')} fill={PALETTE.inkMuted} />
    </g>
  );
};

const PositioningMap: React.FC<{height: number; texts: {axes: string[]; categories: string[]; me: string; view: string}}> = ({height, texts}) => {
  const plot = {x: 232, y: 26, w: MAP_WIDTH - 232 - 28, h: height - 26 - 86};
  const bottom = plot.y + plot.h;
  const at = (dot: Dot) => ({x: plot.x + dot.x * plot.w, y: plot.y + (1 - dot.y) * plot.h});
  const [yLow, yHigh, xLow, xHigh] = texts.axes;
  /** A label beside its dot. `gap` is the distance from the dot's centre (MiniMe's dot has a halo, so its label sits further out). */
  const place = (label: string, dot: Dot, extra: React.ReactNode = null, gap = 24) => {
    const p = at(dot);
    const side = dot.side === 'right' ? {left: p.x + gap} : {right: MAP_WIDTH - p.x + gap};
    return (
      <div key={label} style={{position: 'absolute', top: p.y - 16, whiteSpace: 'nowrap', ...side}}>
        {extra ?? (
          // The paper fill knocks the dashed quadrant lines out from behind the words.
          <div style={{backgroundColor: PALETTE.paper, paddingInline: 6, marginInline: -6}}>
            <Txt size="caption" tone="secondary">
              {label}
            </Txt>
          </div>
        )}
      </div>
    );
  };
  const me = at(MINIME);
  return (
    <Card style={{position: 'relative', width: MAP_WIDTH, height, padding: 0, flexShrink: 0}}>
      <svg width={MAP_WIDTH} height={height} viewBox={viewBoxOf(MAP_WIDTH, height)} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} rx={14} fill={PALETTE.paper} stroke={PALETTE.paperLine} />
        <rect x={plot.x + plot.w / 2} y={plot.y} width={plot.w / 2} height={plot.h / 2} fill="rgba(212, 20, 63, 0.08)" />
        <line x1={plot.x + plot.w / 2} y1={plot.y} x2={plot.x + plot.w / 2} y2={bottom} stroke={PALETTE.paperLine} strokeWidth={2} strokeDasharray={dashes(8, 8)} />
        <line x1={plot.x} y1={plot.y + plot.h / 2} x2={plot.x + plot.w} y2={plot.y + plot.h / 2} stroke={PALETTE.paperLine} strokeWidth={2} strokeDasharray={dashes(8, 8)} />
        <Arrow x1={plot.x + 150} y1={bottom + 28} x2={plot.x + plot.w - 170} y2={bottom + 28} />
        <Arrow x1={plot.x - 16} y1={bottom - 70} x2={plot.x - 16} y2={plot.y + 70} />
        {DOTS.map((dot, i) => {
          const p = at(dot);
          return <circle key={i} cx={p.x} cy={p.y} r={11} fill={PALETTE.inkMuted} />;
        })}
        <circle cx={me.x} cy={me.y} r={34} fill="rgba(212, 20, 63, 0.16)" />
        <circle cx={me.x} cy={me.y} r={19} fill={PALETTE.accent} stroke={PALETTE.white} strokeWidth={4} />
      </svg>

      {DOTS.map((dot, i) => place(texts.categories[i], dot))}
      {place(
        texts.me,
        MINIME,
        <Txt size="body" strong tone="accent">
          {texts.me}
        </Txt>,
        46,
      )}

      <div style={{position: 'absolute', right: MAP_WIDTH - plot.x + 34, top: plot.y}}>
        <Txt size="caption" tone="muted" align="right">
          {yHigh}
        </Txt>
      </div>
      <div style={{position: 'absolute', right: MAP_WIDTH - plot.x + 34, top: bottom - 31}}>
        <Txt size="caption" tone="muted" align="right">
          {yLow}
        </Txt>
      </div>
      <div style={{position: 'absolute', left: plot.x, top: bottom + 44}}>
        <Txt size="caption" tone="muted">
          {xLow}
        </Txt>
      </div>
      <div style={{position: 'absolute', right: MAP_WIDTH - plot.x - plot.w, top: bottom + 44}}>
        <Txt size="caption" tone="muted">
          {xHigh}
        </Txt>
      </div>
      <div style={{position: 'absolute', left: plot.x + 20, top: plot.y + 14}}>
        <Txt size="caption" tone="muted">
          {texts.view}
        </Txt>
      </div>
    </Card>
  );
};

const MarketRings: React.FC<{height: number; names: string[]}> = ({height, names}) => {
  const outer = (height - 56) / 2;
  const radii = [outer * 0.36, outer * 0.68, outer]; // inside out
  const floor = height - 28;
  const cx = 36 + outer;
  const labelX = cx + outer + 64;
  const fills = ['rgba(212, 20, 63, 0.16)', 'rgba(36, 71, 214, 0.12)', 'rgba(36, 71, 214, 0.06)'];
  const strokes = [PALETTE.accent, PALETTE.cobalt, PALETTE.cobalt];
  const tops = radii.map((r) => floor - 2 * r);
  return (
    <Card style={{position: 'relative', width: RINGS_WIDTH, height, padding: 0, flexShrink: 0}}>
      <svg width={RINGS_WIDTH} height={height} viewBox={viewBoxOf(RINGS_WIDTH, height)} style={{position: 'absolute', left: 0, top: 0}}>
        {[2, 1, 0].map((i) => (
          <circle key={i} cx={cx} cy={floor - radii[i]} r={radii[i]} fill={fills[i]} stroke={strokes[i]} strokeWidth={2.5} />
        ))}
        {tops.map((top, i) => (
          <g key={i}>
            <line x1={cx} y1={top} x2={labelX - 16} y2={top} stroke={PALETTE.inkMuted} strokeWidth={1.5} />
            <circle cx={cx} cy={top} r={5} fill={strokes[i]} />
          </g>
        ))}
      </svg>
      {[2, 1, 0].map((i) => {
        const figure = inputs.market?.[i] ?? null;
        return (
          <div key={i} style={{position: 'absolute', left: labelX, top: tops[i] - 18, width: RINGS_WIDTH - labelX - 24}}>
            <Txt size="body" strong tone={i === 0 ? 'accent' : 'primary'}>
              {names[i]}
            </Txt>
            {figure ? (
              <>
                <Txt size="caption" tone="data" style={{marginTop: 4}}>
                  {figure.value} {figure.label}
                </Txt>
                <Txt size="caption" tone="muted">
                  {figure.source}
                </Txt>
              </>
            ) : null}
          </div>
        );
      })}
    </Card>
  );
};

const Chip: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{padding: '4px 22px', borderRadius: 999, border: `1px solid ${PALETTE.ink}`, backgroundColor: PALETTE.paperCard}}>
    <Txt size="body" strong>
      {children}
    </Txt>
  </div>
);

export const S08: React.FC = () => {
  const w = text(8);
  const [sauce, closing, whyNowLine] = w.lines;
  const [me, view] = w.labels;
  const [, whyNow, yLow, yHigh, xLow, xHigh, c1, c2, c3, c4, ringInner, ringMiddle, ringOuter, verified] = w.graphic;
  const [sauceName, sauceParts] = splitLabel(sauce);
  const parts = sauceParts.replace(/\.$/, '').split(' + ');

  return (
    <Slide n={8} tag={w.graphic[0]}>
      <Txt size="headline" as="h1" style={{maxWidth: 1300}}>
        {w.headline}
      </Txt>

      <div style={{display: 'flex', gap: 24, marginTop: 28}}>
        <PositioningMap height={TOP_HEIGHT} texts={{axes: [yLow, yHigh, xLow, xHigh], categories: [c1, c2, c3, c4], me, view}} />
        <MarketRings height={TOP_HEIGHT} names={[ringInner, ringMiddle, ringOuter]} />
      </div>

      <Card style={{marginTop: 22, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 30px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Txt size="label" tone="muted" style={{marginRight: 4}}>
            {sauceName}
          </Txt>
          {parts.map((part, i) => (
            <React.Fragment key={part}>
              {i !== 0 ? (
                <Txt size="body" tone="muted">
                  +
                </Txt>
              ) : null}
              <Chip>{part}</Chip>
            </React.Fragment>
          ))}
        </div>
        <Txt size="sub">{closing}</Txt>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
          <Txt size="label" tone="muted">
            {whyNow}
          </Txt>
          <Txt size="body" tone="secondary">
            {whyNowLine}
          </Txt>
        </div>
        {inputs.competitors ? (
          <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
            <Txt size="label" tone="muted">
              {verified}
            </Txt>
            <Txt size="caption" tone="secondary">
              {inputs.competitors.map((c) => `${c.name}: ${c.sentence}`).join('   ·   ')}
            </Txt>
          </div>
        ) : null}
      </Card>
    </Slide>
  );
};
