/**
 * MiniMe promo — the sound design as DATA (patch 16).
 *
 *   SFX_CUES              every sound effect of the film: { frame, file, volume, durationFrames, note }
 *   MUSIC                 settings of the optional music slot (public/audio/music.mp3)
 *   musicVolumeAt(frame)  the music gain at a global frame (fade in, auto-duck under impacts, fade out)
 *   MUSIC_ENABLED         true when music.mp3 existed the last time `npm run sfx` ran
 *
 * Nothing here is hand-timed twice: every cue is derived from the same data that animates the picture.
 *   - key ticks      keystrokeFrames() of the typed prompts in script.ts (the exact frame each character appears)
 *   - clicks         the `click: true` waypoints of the cursor (src/scenes), so a sound never drifts from a click
 *   - step pings     the end frames of the step runs in script.ts (S3_STEPS), the pitch steps up the scale
 *   - recheck blip   the verifier's `flash` frame
 *   - device scene   DEVICE_TIMES / MOBILE_TIMES / OUTRO
 * Retime the film in script.ts / intro.ts / outro.ts / devices.ts and the audio follows.
 *
 * `volume` is a 0..1 multiplier of the level baked into the WAV (see scripts/make-sfx.mjs for the baked levels:
 * keys -24 dBFS, most SFX -12 dBFS), so the mix can only get quieter than the files, never louder.
 * Pure data and pure functions of the frame: nothing random, nothing that reads the clock.
 */
import {createRng} from '../lib/prng';
import {keystrokeFrames} from '../lib/typing';
import {AUDIO_MANIFEST} from './audioManifest';
import {DEVICE_TIMES} from './devices';
import {INTRO} from './intro';
import {MOBILE_TIMES} from './mobileScript';
import {OUTRO} from './outro';
import {S2, S3, S3_STEPS, S4, S5, type TypingScript} from './script';
import {FPS, SCENES, TOTAL_FRAMES, f} from './timeline';
import {ALL_CURSOR} from '../scenes';

// ------------------------------------------------------------------ types
export type SfxFile = keyof typeof AUDIO_MANIFEST.files;

export type SfxCue = {
  /** Global frame on which the file starts playing. */
  frame: number;
  file: SfxFile;
  /** 0..1, multiplies the level baked into the file. */
  volume: number;
  /** Length of the file in frames (the <Sequence> is exactly this long). */
  durationFrames: number;
  /** Why the cue exists (shows in the Studio timeline and in `npm run mix`). */
  note: string;
};

export const MUSIC_ENABLED: boolean = AUDIO_MANIFEST.hasMusic;

// ------------------------------------------------------------------ builders
const framesOf = (file: SfxFile): number => Math.max(1, Math.ceil(AUDIO_MANIFEST.files[file].seconds * FPS));

const cues: SfxCue[] = [];

const add = (frame: number, file: SfxFile, volume: number, note: string): void => {
  cues.push({frame: Math.max(0, Math.round(frame)), file, volume, durationFrames: framesOf(file), note});
};

/** Start the file early so that its climax (riser, swell) lands exactly on `peakFrame`. */
const addPeakOn = (peakFrame: number, file: SfxFile, volume: number, note: string): void => {
  add(peakFrame - Math.round(AUDIO_MANIFEST.files[file].peakAt * FPS), file, volume, note);
};

/** One key tick per typed character, on the frame the character appears. Pitch variant and level are seeded. */
const addTyping = (script: TypingScript, seed: number, volume: number, note: string): void => {
  const rng = createRng(seed);
  const used = new Set<number>();
  const frames = keystrokeFrames(script.text, script.start, script.options);
  frames.forEach((frame, i) => {
    // Draw first, test second: the sequence of random values never depends on which characters share a frame.
    const variant = 1 + Math.floor(rng() * 3);
    const level = 0.8 + 0.2 * rng();
    if (used.has(frame)) {
      return;
    }
    used.add(frame);
    const space = script.text[i] === ' ' ? 0.85 : 1;
    add(frame, `key-${variant}` as SfxFile, volume * level * space, note);
  });
};

const ensureNumber = (value: number | undefined, fallback: number): number => (value === undefined ? fallback : value);

// ------------------------------------------------------------------ S0 / S1: logo and reveal
add(INTRO.impact, 'sub-impact', 1, 'S0 logo impact (beat 4)');
add(INTRO.impact, 'shimmer', 0.7, 'S0 logo shimmer');
add(INTRO.headlineLine1, 'whoosh', 0.8, 'S1 headline line 1');
add(INTRO.headlineLine2, 'whoosh', 0.8, 'S1 headline line 2');
add(INTRO.windowRise, 'swish', 0.45, 'S1 window rises');

// ------------------------------------------------------------------ S2: instant
addTyping(S2.prompt, 21, 1, 'S2 typing');
add(S2.enter, 'key-3', 1, 'S2 Enter key');
add(S2.userIn, 'send-pop', 0.9, 'S2 send');
add(S2.working.end, 'ui-tick', 0.7, 'S2 Tier 0 badge');
add(S2.answer.end, 'ping-3', 0.45, 'S2 answer complete');

// ------------------------------------------------------------------ S3: the team
addTyping(S3.prompt, 31, 1, 'S3 typing');
add(S3.enter, 'key-3', 1, 'S3 Enter key');
add(S3.userIn, 'send-pop', 0.9, 'S3 send');
add(S3.panel.open, 'swish', 0.55, 'S3 Working Panel opens');
add(ensureNumber(S3_STEPS[0]?.appear, f(625)), 'ui-tick', 0.55, 'S3 Input node / Inspector card');
addPeakOn(S3.reveal.morphStart, 'swell', 0.8, 'S3 tier reveal swell');
add(S3.reveal.morphStart, 'chime', 0.8, 'S3 tier reveal chime');

// Step completions: a soft ping that climbs the 6-note scale; the verifier's first run (the flag) is the low blip.
type Completion = {frame: number; flag: boolean};
const completions: Completion[] = [];
for (const step of S3_STEPS) {
  for (const run of step.runs) {
    if (run.end === null) {
      continue;
    }
    completions.push({frame: run.end, flag: step.flash !== undefined && run.end === step.flash});
  }
}
completions.sort((a, b) => a.frame - b.frame);
let pingStep = 0;
let lastPingFrame = -1;
for (const completion of completions) {
  if (completion.flag) {
    add(completion.frame, 'blip-low', 1, 'S3 verifier sends work back');
    continue;
  }
  if (completion.frame === lastPingFrame) {
    continue; // two steps finishing on the same frame share one ping
  }
  lastPingFrame = completion.frame;
  add(completion.frame, `ping-${Math.min(5, pingStep)}` as SfxFile, 0.6, `S3 step done #${pingStep + 1}`);
  pingStep += 1;
}

add(S3.answer.start, 'success', 0.8, 'S3 Output node lights');
add(S3.stat.from, 'ui-tick', 0.5, 'S3 stat chip');
add(S3.save.toast, 'ping-4', 0.4, 'S3 toast');

// ------------------------------------------------------------------ S4: control
S4.mode.hovers.forEach((hover) => add(hover.frame, 'ui-tick', 0.15, 'S4 mode menu hover'));
for (let row = 0; row < 5; row++) {
  add(S4.mode.menuOpen + 2 + row * 3, 'ui-tick', 0.22, 'S4 mode menu row');
}
addTyping(S4.prompt, 41, 1, 'S4 typing');
add(S4.enter, 'key-3', 1, 'S4 Enter key');
add(S4.userIn, 'send-pop', 0.9, 'S4 send');
add(S4.hire.start, 'swish', 0.45, 'S4 Review card appears');

// ------------------------------------------------------------------ S5: organized
add(f(1320), 'whoosh', 0.7, 'S5 whip-pan to the sidebar');
addTyping(S5.search.typing, 51, 1, 'S5 search typing');
add(S5.newChat.rowIn, 'swish', 0.35, 'S5 new chat row');
add(f(1408), 'swish', 0.35, 'S5 camera down to the composer');
add(S5.attach.appear, 'ui-tick', 0.6, 'S5 attachment chip');
add(S5.attach.doneFrom, 'ping-4', 0.35, 'S5 upload done');

// ------------------------------------------------------------------ every cursor click
const FIRMER_CLICKS = new Set<number>([S4.hire.approveClick]);
for (const waypoint of ALL_CURSOR) {
  if (!waypoint.click) {
    continue;
  }
  if (FIRMER_CLICKS.has(waypoint.frame)) {
    add(waypoint.frame, 'send-pop', 0.85, 'click: Approve & run');
  } else {
    add(waypoint.frame, 'ui-tick', 0.9, 'click');
  }
}

// ------------------------------------------------------------------ S6: outro and devices
add(SCENES.S6.start, 'riser', 0.8, 'S6 riser (climax lands on the laptop build)');
add(DEVICE_TIMES.laptopTraceStart, 'whoosh', 0.55, 'S6 laptop edge trace');
add(DEVICE_TIMES.baseStart, 'swish', 0.5, 'S6 laptop base slides out');
add(DEVICE_TIMES.wakeStart, 'swish', 0.45, 'S6 wake wipe');
add(DEVICE_TIMES.wakeSwap, 'ping-2', 0.4, 'S6 screen wake blip');
add(DEVICE_TIMES.tabletStart, 'whoosh', 0.6, 'S6 tablet arrives');
add(DEVICE_TIMES.tabletWake, 'chime', 0.35, 'S6 tablet power-on');
add(DEVICE_TIMES.phoneStart, 'whoosh', 0.7, 'S6 phone arrives');
add(DEVICE_TIMES.impact, 'sub-impact', 0.85, 'S6 phone impact');

const BOOT_STEPS = 20; // one tick per 5 %
const bootSpan = MOBILE_TIMES.bootEnd - MOBILE_TIMES.bootStart;
const bootFrames = new Set<number>();
for (let i = 0; i < BOOT_STEPS; i++) {
  const frame = MOBILE_TIMES.bootStart + Math.round(((i + 1) / BOOT_STEPS) * bootSpan);
  if (bootFrames.has(frame)) {
    continue;
  }
  bootFrames.add(frame);
  add(frame, 'ui-tick', 0.15 + 0.25 * (i / (BOOT_STEPS - 1)), 'S6 phone boot tick');
}

// Offsets keep the three pings clear of the phone taps (f1695, f1725) and their drawer swishes.
[3, 11, 25].forEach((offset, i) => {
  add(DEVICE_TIMES.connectStart + offset, `ping-${[1, 3, 5][i]}` as SfxFile, 0.35, 'S6 connector ping');
});

add(MOBILE_TIMES.hamburgerTap, 'ui-tick', 0.8, 'S6 phone tap: sidebar');
add(MOBILE_TIMES.hamburgerTap + 2, 'swish', 0.4, 'S6 phone sidebar drawer opens');
add(MOBILE_TIMES.chevronTap, 'ui-tick', 0.8, 'S6 phone tap: close');
add(MOBILE_TIMES.chevronTap + 2, 'swish', 0.4, 'S6 phone sidebar drawer closes');
add(MOBILE_TIMES.panelTap, 'ui-tick', 0.8, 'S6 phone tap: Working Panel');
add(MOBILE_TIMES.panelTap + 2, 'swish', 0.4, 'S6 phone panel drawer opens');
add(MOBILE_TIMES.graphTap, 'ui-tick', 0.8, 'S6 phone tap: routing graph');
add(MOBILE_TIMES.graphTap + 2, 'swish', 0.3, 'S6 phone graph sheet rises');
add(MOBILE_TIMES.swipeStart, 'swish', 0.35, 'S6 phone swipe down');
add(MOBILE_TIMES.swipeEnd - 2, 'swish', 0.4, 'S6 phone panel drawer closes');

add(DEVICE_TIMES.finalStart, 'whoosh', 0.7, 'S6 cluster slides right');
add(OUTRO.impact, 'sub-impact', 1, 'S6 end card impact (beat 120)');
add(OUTRO.impact, 'shimmer', 0.7, 'S6 end card shimmer');
add(OUTRO.fadeStart, 'tail', 0.9, 'S6 tail');

/** Every cue, sorted by frame (stable for equal frames). Cues past the end of the film are dropped. */
export const SFX_CUES: readonly SfxCue[] = cues
  .map((cue, index) => ({cue, index}))
  .filter(({cue}) => cue.frame < TOTAL_FRAMES)
  .sort((a, b) => a.cue.frame - b.cue.frame || a.index - b.index)
  .map(({cue}) => cue);

// ------------------------------------------------------------------ the music slot
export const MUSIC = {
  /** Path inside public/ (used with staticFile). */
  src: 'audio/music.mp3',
  /** Base level relative to the file: -18 dB. */
  gainDb: -18,
  fadeInSeconds: 1.5,
  fadeOutSeconds: 2,
  /** The music dips by this much under an impact. */
  duckDb: -6,
  /** Frames to reach the full dip BEFORE the impact, how long it holds after it, and the release. */
  duckAttackFrames: 3,
  duckHoldFrames: 18,
  duckReleaseFrames: 30,
} as const;

/** The big hits the music ducks under: logo, tier reveal, Output node, phone impact, end card. */
export const IMPACT_FRAMES: readonly number[] = [
  INTRO.impact,
  S3.reveal.morphStart,
  S3.answer.start,
  DEVICE_TIMES.impact,
  OUTRO.impact,
];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** 0..1 amount of ducking at a frame (the strongest of all impacts). */
const duckAmount = (frame: number): number => {
  let amount = 0;
  for (const impact of IMPACT_FRAMES) {
    const d = frame - impact;
    let a = 0;
    if (d >= -MUSIC.duckAttackFrames && d < 0) {
      a = (d + MUSIC.duckAttackFrames) / MUSIC.duckAttackFrames;
    } else if (d >= 0 && d < MUSIC.duckHoldFrames) {
      a = 1;
    } else if (d >= MUSIC.duckHoldFrames && d < MUSIC.duckHoldFrames + MUSIC.duckReleaseFrames) {
      a = 1 - (d - MUSIC.duckHoldFrames) / MUSIC.duckReleaseFrames;
    }
    amount = Math.max(amount, a);
  }
  return amount;
};

/**
 * Music gain (0..1, linear) at a global frame: -18 dB, 1.5 s fade-in, -6 dB dip under impacts, 2 s fade-out.
 * Pass it straight to <Html5Audio volume={...}>; the music track is mounted at frame 0, so its frame is the global frame.
 */
export const musicVolumeAt = (frame: number): number => {
  const base = 10 ** (MUSIC.gainDb / 20);
  const fadeIn = Math.sin((clamp01(frame / (MUSIC.fadeInSeconds * FPS)) * Math.PI) / 2);
  const fadeOut = Math.sin((clamp01((TOTAL_FRAMES - 1 - frame) / (MUSIC.fadeOutSeconds * FPS)) * Math.PI) / 2);
  const duck = 10 ** ((MUSIC.duckDb * duckAmount(frame)) / 20);
  return base * fadeIn * fadeOut * duck;
};
