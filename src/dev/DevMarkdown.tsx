import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ANSWERS, PROMPTS, SIDEBAR} from '../config/copy';
import {FONTS, NEUTRAL, SURFACE} from '../config/theme';
import {UI_OFFSET} from '../config/timeline';
import {FontsReady} from '../lib/fonts';
import {streamCount, streamedText} from '../lib/stream';
import {typedText, typingEndFrame} from '../lib/typing';
import {AppWindow} from '../ui/AppWindow';
import {AssistantMessage} from '../ui/AssistantMessage';
import {ChatBox} from '../ui/ChatBox';
import {ChatSidebar} from '../ui/ChatSidebar';
import {Markdown, estimateMarkdownHeight} from '../ui/Markdown';
import {TopNav} from '../ui/TopNav';
import {UserMessage} from '../ui/UserMessage';

/**
 * DEV ONLY (patch 04): the text engines.
 *   frames   0..149  the Tier 3 answer streams into the chat (frames 10..125), auto-scroll from the height estimate
 *   frames 150..209  static: complete answer in a plain column, estimate vs real (measured) height, plus the typing
 *                    engine typing PROMPTS.team into a box
 *   npx remotion still src/index.ts DevMarkdown out/qa/md-mid.png --frame=60
 */
export const STREAM_START = 10;
export const STREAM_END = 125;
export const DEV_MARKDOWN_STREAM_FRAMES = 150;
export const DEV_MARKDOWN_FRAMES = 210;

const ANSWER = ANSWERS.team;
/** Inner width of the bubble: list width 1184 - 32 padding, x 80 %, minus avatar (26) + gap (8), minus bubble padding + border. */
const BUBBLE_INNER = Math.round((1184 - 32) * 0.8) - 26 - 8 - 24 - 2;

const StreamingChat: React.FC<{frame: number}> = ({frame}) => {
  const visible = streamedText(ANSWER, frame, STREAM_START, STREAM_END, 4);
  const streaming = frame < STREAM_END + 6;
  const h = estimateMarkdownHeight(visible, BUBBLE_INNER);
  // user row (~56) + bubble chrome (meta 16 + gap 8 + padding/border 18) + body
  const contentBottom = 24 + 56 + 42 + h;
  const scrollY = Math.max(0, contentBottom - (648 - 120));
  return (
    <div style={{position: 'absolute', left: UI_OFFSET.x, top: UI_OFFSET.y}}>
      <AppWindow
        panelWidth={0}
        header={<TopNav />}
        sidebar={<ChatSidebar topRows={[{id: SIDEBAR.activeChat.id, title: SIDEBAR.activeChatAutoTitle, visible: 1}]} projects={[]} rows={[]} activeId={SIDEBAR.activeChat.id} />}
      >
        <ChatBox composer={{frame, draft: '', mode: 'auto'}} scrollY={scrollY}>
          <UserMessage text={PROMPTS.team} />
          <AssistantMessage frame={frame} meta={{kind: 'tier', tier: 3, ok: streaming ? undefined : true, elapsed: streaming ? undefined : '41s'}} caret={false}>
            <Markdown text={visible} caret={streaming} frame={frame} />
          </AssistantMessage>
        </ChatBox>
      </AppWindow>
    </div>
  );
};

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: FONTS.mono, fontSize: 12, color: NEUTRAL[400], marginBottom: 8}}>{children}</div>
);

const StaticSheet: React.FC<{local: number}> = ({local}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [real, setReal] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (ref.current) {
      setReal(Math.round(ref.current.getBoundingClientRect().height));
    }
  }, []);
  const estimate = estimateMarkdownHeight(ANSWER, 600);

  const typeStart = 0;
  const typed = typedText(PROMPTS.team, local, typeStart, {durationFrames: 55});
  const typeEnd = typingEndFrame(PROMPTS.team, typeStart, {durationFrames: 55});

  return (
    <AbsoluteFill style={{background: SURFACE.stageGradient, padding: 48, color: NEUTRAL[200], fontFamily: FONTS.body}}>
      <div style={{display: 'flex', gap: 48, alignItems: 'flex-start'}}>
        <div style={{width: 600}}>
          <Label>
            Markdown complete: estimate {estimate}px vs real {real ?? '…'}px
            {real ? ` (${(((estimate - real) / real) * 100).toFixed(1)}%)` : ''}
          </Label>
          <div ref={ref} style={{width: 600}}>
            <Markdown text={ANSWER} />
          </div>
        </div>
        <div style={{width: 700, display: 'flex', flexDirection: 'column', gap: 24}}>
          <div>
            <Label>
              typing engine: frame {local}, last character on frame {typeEnd}
            </Label>
            <div style={{background: NEUTRAL[900], border: `1px solid ${NEUTRAL[800]}`, borderRadius: 8, padding: 12, fontSize: 14, lineHeight: '22px', minHeight: 66}}>
              {typed}
              <span style={{display: 'inline-block', width: 2, height: 16, background: NEUTRAL[200], verticalAlign: '-3px', opacity: local % 16 < 8 ? 1 : 0}} />
            </div>
          </div>
          <div>
            <Label>stream: chars at frames 20/40/60/80/100/125 of 10..125 ({ANSWER.length} total)</Label>
            <div style={{fontFamily: FONTS.mono, fontSize: 12, color: NEUTRAL[300]}}>
              {[20, 40, 60, 80, 100, 125].map((fr) => `${fr}:${streamCount(ANSWER.length, fr, STREAM_START, STREAM_END, 4)}`).join('  ')}
            </div>
          </div>
          <div>
            <Label>partial inputs (each a stream cut-off)</Label>
            <div style={{background: NEUTRAL[900], border: `1px solid ${NEUTRAL[800]}`, borderRadius: 8, padding: 12, width: 520}}>
              <Markdown text={'Half **bold, a `code'} caret frame={local} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DevMarkdown: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <FontsReady>
      <AbsoluteFill style={{background: SURFACE.stageGradient}}>
        {frame < DEV_MARKDOWN_STREAM_FRAMES ? (
          <StreamingChat frame={frame} />
        ) : (
          <StaticSheet local={frame - DEV_MARKDOWN_STREAM_FRAMES} />
        )}
      </AbsoluteFill>
    </FontsReady>
  );
};
