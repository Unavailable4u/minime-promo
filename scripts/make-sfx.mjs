#!/usr/bin/env node
/**
 * MiniMe promo — SFX synthesizer (patch 16).
 *
 *   npm run sfx
 *
 * Pure Node, no dependencies, no copyrighted material. Every sound is built from sine / noise / filters with a
 * SEEDED noise source, so the same script always writes the same files.
 *
 * Writes (48 kHz, 16-bit PCM WAV):
 *   public/audio/<name>.wav          one file per sound (list below)
 *   src/config/audioManifest.ts      durations of every file + whether public/audio/music.mp3 exists
 *
 * Re-run it whenever you add or remove public/audio/music.mp3: the film reads the manifest (not the disk) to decide
 * whether to play music, so a missing music file can never break a render.
 *
 * Levels (peak, dBFS, baked into the files; src/config/sfx.ts only scales them down per cue):
 *   keys -24 | ui-tick -18 | swish -18 | tail -16 | whoosh, shimmer, swell, riser -14 | everything else -12
 */
import {existsSync, mkdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 48000;
const TAU = Math.PI * 2;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio');
const MANIFEST_PATH = path.join(ROOT, 'src', 'config', 'audioManifest.ts');
const MUSIC_PATH = path.join(OUT_DIR, 'music.mp3');

// ------------------------------------------------------------------ small DSP toolbox
/** Seeded generator (mulberry32). */
const createRng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const dbToGain = (db) => 10 ** (db / 20);
const midi = (note) => 440 * 2 ** ((note - 69) / 12);

const makeBuffer = (seconds) => new Float32Array(Math.round(seconds * SR));

/** White noise sample in [-1, 1). */
const white = (rng) => rng() * 2 - 1;

/** Zavalishin TPT state-variable filter: unconditionally stable, cutoff can change per sample. */
class Svf {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
  }

  /** @returns {{low: number, band: number, high: number}} */
  process(x, cutoffHz, q) {
    const fc = Math.min(cutoffHz, SR * 0.45);
    const g = Math.tan((Math.PI * fc) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    return {low: v2, band: v1, high: x - k * v1 - v2};
  }
}

/** Short linear fades so no file starts or ends with a click. */
const fadeEdges = (channels, inSeconds, outSeconds) => {
  for (const ch of channels) {
    const nIn = Math.max(1, Math.round(inSeconds * SR));
    const nOut = Math.max(1, Math.round(outSeconds * SR));
    for (let i = 0; i < nIn && i < ch.length; i++) {
      ch[i] *= i / nIn;
    }
    for (let i = 0; i < nOut && i < ch.length; i++) {
      ch[ch.length - 1 - i] *= i / nOut;
    }
  }
};

/** Scale so the loudest sample of all channels sits at `peakDb` dBFS. */
const normalize = (channels, peakDb) => {
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      peak = Math.max(peak, Math.abs(ch[i]));
    }
  }
  const k = peak > 0 ? dbToGain(peakDb) / peak : 1;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      ch[i] *= k;
    }
  }
};

/** Phase accumulator for a time-varying frequency. */
const makeOsc = () => {
  let phase = 0;
  return (freq) => {
    phase += (TAU * freq) / SR;
    if (phase > TAU) {
      phase -= TAU;
    }
    return Math.sin(phase);
  };
};

/** 16-bit PCM WAV writer (mono or stereo). */
const wavBytes = (channels) => {
  const n = channels[0].length;
  const numCh = channels.length;
  const dataSize = n * numCh * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numCh, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * numCh * 2, 28);
  buffer.writeUInt16LE(numCh * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < numCh; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      buffer.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  }
  return buffer;
};

// ------------------------------------------------------------------ the sounds
/**
 * Each entry: build() -> array of channels (Float32Array), peak (dBFS), fade [in, out] seconds, and `peakAt`, the time
 * in seconds of the musical climax (riser / swell) so src/config/sfx.ts can land that climax on a beat.
 */
const SOUNDS = {};

const define = (name, spec) => {
  SOUNDS[name] = spec;
};

// ---- keys: soft mechanical tick, three pitch variants (-24 dBFS)
const keyTick = (variant) => () => {
  const pitch = [1, 0.9, 1.13][variant];
  const rng = createRng(1000 + variant * 77);
  const out = makeBuffer(0.075);
  const hp = new Svf();
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const click = hp.process(white(rng), 2800 * pitch, 0.8).high * Math.exp(-t / 0.0035);
    const body =
      Math.sin(TAU * 210 * pitch * t) * Math.exp(-t / 0.012) * 0.7 +
      Math.sin(TAU * 420 * pitch * t) * Math.exp(-t / 0.007) * 0.25;
    out[i] = click * 0.9 + body;
  }
  return [out];
};
for (let v = 0; v < 3; v++) {
  define(`key-${v + 1}`, {build: keyTick(v), peak: -24, fade: [0.0005, 0.006], peakAt: 0});
}

// ---- send pop: a round "bloop" (-12)
define('send-pop', {
  peak: -12,
  fade: [0.0004, 0.012],
  peakAt: 0,
  build: () => {
    const rng = createRng(2001);
    const out = makeBuffer(0.24);
    const osc = makeOsc();
    const lp = new Svf();
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const freq = 170 + 430 * Math.exp(-t / 0.028);
      const env = Math.min(1, t / 0.001) * Math.exp(-t / 0.065);
      const tone = osc(freq) * env + Math.sin(TAU * freq * 2 * t) * env * 0.18;
      const click = lp.process(white(rng), 3200, 0.7).low * Math.exp(-t / 0.003) * 0.4;
      out[i] = tone + click;
    }
    return [out];
  },
});

// ---- ui tick: tiny glassy click (-18)
define('ui-tick', {
  peak: -18,
  fade: [0.0003, 0.01],
  peakAt: 0,
  build: () => {
    const rng = createRng(3001);
    const out = makeBuffer(0.1);
    const hp = new Svf();
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const tone =
        Math.sin(TAU * 1900 * t) * Math.exp(-t / 0.012) * 0.6 + Math.sin(TAU * 3800 * t) * Math.exp(-t / 0.006) * 0.2;
      const click = hp.process(white(rng), 4000, 0.9).high * Math.exp(-t / 0.002) * 0.3;
      out[i] = tone + click;
    }
    return [out];
  },
});

// ---- whoosh family: band-passed noise swept upward, stereo (decorrelated noise per side)
const sweepNoise = ({seconds, seedL, attack, decayTau, fromHz, toHz, sweepSeconds, q, bodyHz, bodyGain}) => {
  const channels = [makeBuffer(seconds), makeBuffer(seconds)];
  [seedL, seedL + 101].forEach((seed, c) => {
    const rng = createRng(seed);
    const band = new Svf();
    const body = new Svf();
    const out = channels[c];
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const env = t < attack ? smooth(t / attack) : Math.exp(-(t - attack) / decayTau);
      const s = smooth(t / sweepSeconds);
      const fc = fromHz * (toHz / fromHz) ** s;
      const n = white(rng);
      out[i] = (band.process(n, fc, q).band * 2.2 + body.process(n, bodyHz, 0.7).low * bodyGain) * env;
    }
  });
  return channels;
};

define('whoosh', {
  peak: -14,
  fade: [0.002, 0.04],
  peakAt: 0.25,
  build: () =>
    sweepNoise({
      seconds: 1.3,
      seedL: 4001,
      attack: 0.25,
      decayTau: 0.3,
      fromHz: 300,
      toHz: 5600,
      sweepSeconds: 0.9,
      q: 1.2,
      bodyHz: 900,
      bodyGain: 0.3,
    }),
});

define('swish', {
  peak: -18,
  fade: [0.002, 0.03],
  peakAt: 0.1,
  build: () =>
    sweepNoise({
      seconds: 0.5,
      seedL: 4501,
      attack: 0.1,
      decayTau: 0.12,
      fromHz: 600,
      toHz: 6000,
      sweepSeconds: 0.35,
      q: 1.4,
      bodyHz: 1200,
      bodyGain: 0.15,
    }),
});

// ---- sub impact: pitched-down sine + low thump (-12)
define('sub-impact', {
  peak: -12,
  fade: [0.0005, 0.05],
  peakAt: 0,
  build: () => {
    const rng = createRng(5001);
    const out = makeBuffer(2.2);
    const osc = makeOsc();
    const lowNoise = new Svf();
    const hp = new Svf();
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const freq = 40 + 70 * Math.exp(-t / 0.09);
      const env = Math.min(1, t / 0.002) * Math.exp(-t / 0.55);
      const tone = osc(freq) * env + Math.sin(TAU * freq * 2 * t) * Math.exp(-t / 0.15) * 0.25;
      const n = white(rng);
      const thump = lowNoise.process(n, 160, 0.7).low * Math.exp(-t / 0.06) * 1.2;
      const click = hp.process(n, 3000, 0.8).high * Math.exp(-t / 0.003) * 0.35;
      out[i] = Math.tanh((tone + thump + click) * 1.6);
    }
    return [out];
  },
});

// ---- shimmer: inharmonic glass partials with slow tremolo, stereo (-14)
define('shimmer', {
  peak: -14,
  fade: [0.003, 0.08],
  peakAt: 0.1,
  build: () => {
    const rng = createRng(6001);
    const freqs = [1318.5, 1760, 2093, 2637, 3520, 4186];
    const partials = freqs.map((hz, i) => ({
      hz: hz * (1 + (rng() - 0.5) * 0.008),
      amp: 1 / (1 + i * 0.45),
      trem: 4.5 + rng() * 3,
      phase: rng() * TAU,
      pan: i % 2 === 0 ? 0.35 : 0.65,
    }));
    const left = makeBuffer(2.6);
    const right = makeBuffer(2.6);
    const sparkleL = new Svf();
    const sparkleR = new Svf();
    for (let i = 0; i < left.length; i++) {
      const t = i / SR;
      const env = smooth(t / 0.08) * Math.exp(-t / 0.9);
      let l = 0;
      let r = 0;
      for (const p of partials) {
        const trem = 0.75 + 0.25 * Math.sin(TAU * p.trem * t + p.phase);
        const v = Math.sin(TAU * p.hz * t) * p.amp * trem;
        l += v * (1 - p.pan);
        r += v * p.pan;
      }
      const spark = env * 0.08;
      left[i] = l * env + sparkleL.process(white(rng), 7000, 0.7).high * spark;
      right[i] = r * env + sparkleR.process(white(rng), 7000, 0.7).high * spark;
    }
    return [left, right];
  },
});

// ---- bell-like tones: chime and success arpeggio (-12)
const bell = (out, startSeconds, hz, gain, decay = 1) => {
  const ratios = [1, 2.76, 5.4, 8.93];
  const amps = [1, 0.35, 0.18, 0.08];
  const taus = [0.9, 0.5, 0.3, 0.18];
  const start = Math.round(startSeconds * SR);
  for (let i = start; i < out.length; i++) {
    const t = (i - start) / SR;
    const att = Math.min(1, t / 0.001);
    let v = 0;
    for (let p = 0; p < ratios.length; p++) {
      v += Math.sin(TAU * hz * ratios[p] * t) * amps[p] * Math.exp(-t / (taus[p] * decay));
    }
    out[i] += v * att * gain;
  }
};

define('chime', {
  peak: -12,
  fade: [0.0005, 0.08],
  peakAt: 0,
  build: () => {
    const out = makeBuffer(2.0);
    bell(out, 0, 1046.5, 1);
    bell(out, 0.08, 1568, 0.6);
    return [out];
  },
});

define('success', {
  peak: -12,
  fade: [0.0005, 0.08],
  peakAt: 0,
  build: () => {
    const out = makeBuffer(1.9);
    [midi(72), midi(76), midi(79), midi(84)].forEach((hz, i) => bell(out, i * 0.07, hz, 0.8 + i * 0.1, 0.8));
    bell(out, 0.24, midi(88), 0.25, 0.9);
    bell(out, 0.24, midi(91), 0.18, 0.9);
    return [out];
  },
});

// ---- success pings: a pentatonic scale, C5 D5 E5 G5 A5 C6 (-12)
const PING_NOTES = [72, 74, 76, 79, 81, 84].map(midi);
PING_NOTES.forEach((hz, i) => {
  define(`ping-${i}`, {
    peak: -12,
    fade: [0.0015, 0.05],
    peakAt: 0,
    build: () => {
      const out = makeBuffer(1.1);
      for (let n = 0; n < out.length; n++) {
        const t = n / SR;
        const env = Math.min(1, t / 0.0015) * Math.exp(-t / 0.28);
        out[n] =
          (Math.sin(TAU * hz * t) +
            Math.sin(TAU * hz * 2 * t) * 0.28 * Math.exp(-t / 0.12) +
            Math.sin(TAU * hz * 3 * t) * 0.1 * Math.exp(-t / 0.07)) *
          env;
      }
      return [out];
    },
  });
});

// ---- low blip: two short descending notes, the "verifier sends work back" sound (-12)
define('blip-low', {
  peak: -12,
  fade: [0.001, 0.03],
  peakAt: 0,
  build: () => {
    const out = makeBuffer(0.46);
    const lp = new Svf();
    const note = (startSeconds, hz) => {
      const start = Math.round(startSeconds * SR);
      for (let i = start; i < out.length; i++) {
        const t = (i - start) / SR;
        const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.09);
        out[i] +=
          (Math.sin(TAU * hz * t) + Math.sin(TAU * hz * 2 * t) * 0.15 + Math.sin(TAU * hz * 3 * t) * 0.25) * env;
      }
    };
    note(0, 196);
    note(0.13, 146.8);
    for (let i = 0; i < out.length; i++) {
      out[i] = lp.process(out[i], 1200, 0.7).low;
    }
    return [out];
  },
});

// ---- riser and swell: noise + tone that climb to a peak (-14)
const climb = ({seconds, peakAt, seedL, fromHz, toHz, toneFrom, toneTo, tonePower, tail}) => {
  const channels = [makeBuffer(seconds), makeBuffer(seconds)];
  [seedL, seedL + 211].forEach((seed, c) => {
    const rng = createRng(seed);
    const band = new Svf();
    const osc = makeOsc();
    const osc2 = makeOsc();
    const out = channels[c];
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const u = clamp01(t / peakAt);
      const env = t <= peakAt ? u ** 2.2 : Math.exp(-(t - peakAt) / tail);
      const fc = fromHz * (toHz / fromHz) ** u;
      const q = 1.1 + 1.6 * u;
      const noise = band.process(white(rng), fc, q).band * 2 * env;
      const toneHz = toneFrom * (toneTo / toneFrom) ** u;
      const tone = (osc(toneHz) * 0.5 + osc2(toneHz * (c === 0 ? 1.004 : 0.996)) * 0.5) * env ** tonePower * 0.45;
      out[i] = noise + tone;
    }
  });
  return channels;
};

define('riser', {
  peak: -14,
  fade: [0.01, 0.02],
  peakAt: 1.96,
  build: () =>
    climb({
      seconds: 2.0,
      peakAt: 1.96,
      seedL: 7001,
      fromHz: 200,
      toHz: 9000,
      toneFrom: 110,
      toneTo: 880,
      tonePower: 1.5,
      tail: 0.02,
    }),
});

define('swell', {
  peak: -14,
  fade: [0.005, 0.03],
  peakAt: 0.84,
  build: () =>
    climb({
      seconds: 0.9,
      peakAt: 0.84,
      seedL: 7501,
      fromHz: 400,
      toHz: 6000,
      toneFrom: 330,
      toneTo: 660,
      tonePower: 1,
      tail: 0.03,
    }),
});

// ---- tail: soft chord wash for the last second of the film (-16)
define('tail', {
  peak: -16,
  fade: [0.004, 0.12],
  peakAt: 0,
  build: () => {
    const rng = createRng(8001);
    const notes = [45, 52, 57, 61, 64].map(midi);
    const channels = [makeBuffer(3.0), makeBuffer(3.0)];
    const wash = [new Svf(), new Svf()];
    channels.forEach((out, c) => {
      for (let i = 0; i < out.length; i++) {
        const t = i / SR;
        const env = smooth(t / 0.02) * Math.exp(-t / 1.0);
        let v = 0;
        notes.forEach((hz, n) => {
          const trem = 0.8 + 0.2 * Math.sin(TAU * (0.35 + n * 0.11) * t + n + c);
          v += Math.sin(TAU * hz * (c === 0 ? 1.0015 : 0.9985) * t) * trem * (1 / (1 + n * 0.3));
        });
        const noise = wash[c].process(white(rng), 1200, 0.7).low * Math.exp(-t / 0.6) * 0.5;
        out[i] = v * env * 0.4 + noise * 0.3;
      }
    });
    return channels;
  },
});

// ------------------------------------------------------------------ main
const measure = (channels) => {
  let peak = 0;
  let sum = 0;
  let count = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      peak = Math.max(peak, Math.abs(ch[i]));
      sum += ch[i] * ch[i];
      count++;
    }
  }
  const rms = Math.sqrt(sum / Math.max(1, count));
  return {peakDb: 20 * Math.log10(Math.max(peak, 1e-9)), rmsDb: 20 * Math.log10(Math.max(rms, 1e-9))};
};

const main = () => {
  mkdirSync(OUT_DIR, {recursive: true});
  const files = {};
  const rows = [];

  for (const [name, spec] of Object.entries(SOUNDS)) {
    const channels = spec.build();
    fadeEdges(channels, spec.fade[0], spec.fade[1]);
    normalize(channels, spec.peak);
    const file = path.join(OUT_DIR, `${name}.wav`);
    writeFileSync(file, wavBytes(channels));
    const seconds = channels[0].length / SR;
    files[name] = {seconds: Math.round(seconds * 10000) / 10000, peakAt: spec.peakAt};
    const m = measure(channels);
    rows.push(
      `  ${name.padEnd(10)} ${String(channels.length === 2 ? 'stereo' : 'mono').padEnd(7)} ${seconds
        .toFixed(2)
        .padStart(5)} s   peak ${m.peakDb.toFixed(1).padStart(6)} dBFS   rms ${m.rmsDb.toFixed(1).padStart(6)} dBFS`,
    );
  }

  const hasMusic = existsSync(MUSIC_PATH) && statSync(MUSIC_PATH).size > 1024;

  const names = Object.keys(files);
  const lines = [
    '/**',
    ' * AUTO-GENERATED by scripts/make-sfx.mjs. Do not edit by hand: run `npm run sfx` again.',
    ' *',
    ' * `hasMusic` is true when public/audio/music.mp3 existed the last time the script ran.',
    ' * `seconds` is the length of each WAV; `peakAt` is the time of its climax (riser, swell, whoosh, swish, shimmer), 0 for the rest.',
    ' */',
    'export const AUDIO_MANIFEST = {',
    `  hasMusic: ${hasMusic},`,
    '  files: {',
    ...names.map((name) => `    '${name}': {seconds: ${files[name].seconds}, peakAt: ${files[name].peakAt}},`),
    '  },',
    '} as const;',
    '',
  ];
  writeFileSync(MANIFEST_PATH, lines.join('\n'));

  console.log(`\nMiniMe SFX: wrote ${names.length} files to public/audio/ (48 kHz, 16-bit WAV)\n`);
  console.log(rows.join('\n'));
  console.log(`\nManifest: src/config/audioManifest.ts`);
  if (hasMusic) {
    console.log('Music:    public/audio/music.mp3 found. It plays at -18 dB, ducks under impacts, fades in 1.5 s / out 2 s.');
  } else {
    console.log('Music:    none (public/audio/music.mp3 not found). The film plays with SFX only.');
    console.log('          To add a track: drop a royalty-free 120 BPM mp3 at public/audio/music.mp3, then run `npm run sfx` again.');
  }
  console.log('');
};

try {
  main();
} catch (error) {
  console.error('\nSFX generation failed:', error instanceof Error ? error.message : error);
  console.error('Fix hint: use Node 20+ and run the command from the project root (the folder with package.json).');
  process.exit(1);
}
