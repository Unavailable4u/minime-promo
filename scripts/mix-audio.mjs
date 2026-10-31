#!/usr/bin/env node
/**
 * MiniMe promo — offline SFX mixdown and level check (patch 16).
 *
 *   npm run mix
 *
 * Reads the cue list of src/config/sfx.ts (the same data the film plays), lays every WAV of public/audio/ on a
 * timeline and writes out/audio-mix.wav (48 kHz, 16-bit stereo). Use it to
 *   1. check that the SFX never clip (the report prints the peak and warns above -1 dBFS), and
 *   2. feed the pure-ffmpeg route of the README (out/audio-mix.wav + the PNG sequence).
 *
 * The music slot is NOT part of this file: ffmpeg cannot be replaced by pure Node for decoding an mp3. When music is
 * enabled, Remotion mixes it into the normal render; for the ffmpeg route add it with the command printed at the end.
 *
 * Needs `npm install` (it uses the esbuild that Remotion already installs) and `npm run sfx` (the WAV files).
 */
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');
const TMP_ENTRY = path.join(OUT_DIR, '.mix-entry.ts');
const TMP_BUNDLE = path.join(OUT_DIR, '.mix-bundle.mjs');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const SR = 48000;

const fail = (message, hint) => {
  console.error(`\nmix-audio: ${message}`);
  if (hint) {
    console.error(`Fix hint: ${hint}`);
  }
  process.exit(1);
};

const readWav = (file) => {
  const buffer = readFileSync(file);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${file} is not a WAV file`);
  }
  let offset = 12;
  let channels = 1;
  let rate = SR;
  let bits = 16;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = buffer.readUInt16LE(body + 2);
      rate = buffer.readUInt32LE(body + 4);
      bits = buffer.readUInt16LE(body + 14);
    } else if (id === 'data') {
      if (bits !== 16 || rate !== SR) {
        throw new Error(`${file}: expected 48 kHz 16-bit, got ${rate} Hz ${bits}-bit (run npm run sfx again)`);
      }
      const frames = Math.floor(size / (channels * 2));
      const left = new Float32Array(frames);
      const right = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        const l = buffer.readInt16LE(body + i * channels * 2) / 32768;
        const r = channels === 2 ? buffer.readInt16LE(body + i * channels * 2 + 2) / 32768 : l;
        left[i] = l;
        right[i] = r;
      }
      return {left, right};
    }
    offset = body + size + (size % 2);
  }
  throw new Error(`${file} has no data chunk`);
};

const wavBytes = (left, right) => {
  const n = left.length;
  const dataSize = n * 4;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), o);
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), o + 2);
    o += 4;
  }
  return buffer;
};

const db = (value) => 20 * Math.log10(Math.max(value, 1e-9));

const main = async () => {
  if (!existsSync(path.join(AUDIO_DIR, 'ping-0.wav'))) {
    fail('public/audio/*.wav not found.', 'run `npm run sfx` first.');
  }
  let esbuild;
  try {
    esbuild = await import('esbuild');
  } catch {
    fail('esbuild is not installed.', 'run `npm install` (Remotion installs esbuild as a dependency).');
  }

  mkdirSync(OUT_DIR, {recursive: true});
  writeFileSync(
    TMP_ENTRY,
    [
      "export * from '../src/config/sfx';",
      "export {FPS, TOTAL_FRAMES} from '../src/config/timeline';",
      '',
    ].join('\n'),
  );
  try {
    await esbuild.build({
      entryPoints: [TMP_ENTRY],
      outfile: TMP_BUNDLE,
      bundle: true,
      platform: 'node',
      format: 'esm',
      jsx: 'automatic',
      logLevel: 'error',
      external: ['remotion', 'react', 'react-dom', 'lucide-react', '@remotion/*'],
      loader: {'.woff2': 'dataurl', '.woff': 'dataurl', '.ttf': 'dataurl', '.svg': 'dataurl', '.png': 'dataurl'},
    });
  } catch (error) {
    fail(`could not read src/config/sfx.ts (${error instanceof Error ? error.message : error}).`, 'run `npx tsc --noEmit` and fix the first error.');
  }

  const sfx = await import(`${pathToFileURL(TMP_BUNDLE).href}?t=${Date.now()}`);
  const {SFX_CUES, FPS, TOTAL_FRAMES, MUSIC_ENABLED} = sfx;

  const total = Math.round((TOTAL_FRAMES / FPS) * SR);
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  const cache = new Map();

  for (const cue of SFX_CUES) {
    let wav = cache.get(cue.file);
    if (!wav) {
      wav = readWav(path.join(AUDIO_DIR, `${cue.file}.wav`));
      cache.set(cue.file, wav);
    }
    const start = Math.round((cue.frame / FPS) * SR);
    for (let i = 0; i < wav.left.length; i++) {
      const at = start + i;
      if (at >= total) {
        break;
      }
      left[at] += wav.left[i] * cue.volume;
      right[at] += wav.right[i] * cue.volume;
    }
  }

  let peak = 0;
  let clipped = 0;
  let sum = 0;
  for (let i = 0; i < total; i++) {
    const a = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    peak = Math.max(peak, a);
    if (a >= 0.999) {
      clipped += 1;
    }
    sum += left[i] * left[i] + right[i] * right[i];
  }
  const rms = Math.sqrt(sum / (total * 2));

  // busiest seconds (1 s windows, RMS)
  const windows = [];
  for (let s = 0; s + 1 <= total / SR; s++) {
    let acc = 0;
    for (let i = s * SR; i < (s + 1) * SR; i++) {
      acc += left[i] * left[i] + right[i] * right[i];
    }
    windows.push({second: s, rmsDb: db(Math.sqrt(acc / (SR * 2)))});
  }
  windows.sort((a, b) => b.rmsDb - a.rmsDb);

  const outFile = path.join(OUT_DIR, 'audio-mix.wav');
  writeFileSync(outFile, wavBytes(left, right));

  const perScene = {};
  for (const cue of SFX_CUES) {
    perScene[cue.file] = (perScene[cue.file] ?? 0) + 1;
  }

  console.log(`\nMiniMe SFX mix: ${SFX_CUES.length} cues, ${(TOTAL_FRAMES / FPS).toFixed(1)} s -> out/audio-mix.wav\n`);
  console.log('Cues per file:');
  console.log(
    Object.entries(perScene)
      .sort((a, b) => b[1] - a[1])
      .map(([file, n]) => `  ${file.padEnd(11)} x${n}`)
      .join('\n'),
  );
  console.log(`\nPeak: ${db(peak).toFixed(1)} dBFS    RMS: ${db(rms).toFixed(1)} dBFS    clipped samples: ${clipped}`);
  console.log(
    `Loudest seconds (RMS): ${windows
      .slice(0, 4)
      .map((w) => `${w.second}s ${w.rmsDb.toFixed(1)} dB`)
      .join(' | ')}`,
  );
  if (peak >= 0.891) {
    console.log('\nWARNING: the SFX mix peaks above -1 dBFS. Lower the `volume` of the loudest overlapping cues in src/config/sfx.ts.');
  } else {
    console.log('\nNo clipping: the SFX mix peaks below -1 dBFS.');
  }
  if (MUSIC_ENABLED) {
    console.log(
      '\nMusic is enabled. This file holds the SFX only; Remotion mixes the music into the normal render.\n' +
        'For the pure-ffmpeg route add it yourself, e.g. (music -18 dB, 1.5 s fade-in, 2 s fade-out, no ducking):\n' +
        '  ffmpeg -i out/audio-mix.wav -i public/audio/music.mp3 -filter_complex "[1:a]volume=-18dB,afade=t=in:d=1.5,afade=t=out:st=60:d=2[m];[0:a][m]amix=inputs=2:duration=first:normalize=0" out/audio-full.wav',
    );
  }
  console.log('');

  rmSync(TMP_ENTRY, {force: true});
  rmSync(TMP_BUNDLE, {force: true});
};

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
