# MiniMe — Chat Tab Promo Film

A code-driven, deterministic **Remotion 4 + React 18 + TypeScript** project that renders the MiniMe "Chat tab" promo:
**1920x1080, 30 fps, 1860 frames (62 s)**, H.264 + AAC. Everything on screen is React / SVG / CSS, animated from the
frame number alone, so the same frame always renders to the same pixels. No screenshots, no recordings, no network at
render time.

Message of the film: **"Describe a task. Get a team."**

---

## Requirements

- **Node 20 LTS or newer** (`node -v`)
- **ffmpeg on your PATH** (`ffmpeg -version`). Needed for the loudness pass, the poster and the GIF.
  Windows: `winget install Gyan.FFmpeg`, then open a new terminal.
- About 4 GB of free RAM and a few GB of free disk space (4K and the PNG sequence need the most)
- Internet **once**, so Remotion can download its own Chrome (or use `--browser-executable`, see Troubleshooting)

Fonts (Sora, Inter, JetBrains Mono) and the emoji icons (Twemoji SVG) are already vendored in `public/`, so rendering
itself works offline.

---

## The three commands

```bash
npm install
npm run sfx
npm run render
```

`npm run render` also runs `npm run sfx` for you, so the audio always matches the film; running it separately is only
useful to look at the generated sounds in `public/audio/`.

Result in `out/`:

| File | What |
|---|---|
| `minime-chat-promo-1080p30.mp4` | H.264 crf 16, yuv420p, `+faststart`, AAC 192 kbps, loudness-normalised to -16 LUFS (true peak <= -1.5 dBTP) |
| `poster.png` | Hero frame (frame 1830: the finished end card), for thumbnails |
| `preview.gif` | 720 px wide, 15 fps, at most 8 MB (the script lowers fps / colours step by step if the film is too long for that) |

---

## Preview and edit

```bash
npm run studio          # Remotion Studio: scrub the timeline, play, tweak
npm run check           # 15 key-frame stills + a contact sheet in out/stills/
npm run typecheck       # TypeScript strict
```

Compositions in the Studio:

- **MiniMePromo** — the film (1920x1080)
- **MiniMePromo-Preview** — same timeline at 960x540 for quick scrubbing
- `Dev*` — test sheets for single components. They are not part of the film (see the comment in `src/Root.tsx`).

**Always look at the stills before a long render:** `npm run check`, then open `out/stills/` (or
`out/stills/contact-sheet.png`).

---

## Where to change things

| You want to change | Edit |
|---|---|
| Any on-screen text (captions, callouts, prompts, answers, sidebar, CTA label and URL) | `src/config/copy.ts` |
| The choreography (what is typed when, step timings, graph, scroll) | `src/config/script.ts` |
| Scene lengths, beat grid, total length | `src/config/timeline.ts` (use `f()`, `sec()`, `beat()`, `bar()`; never raw frame numbers) |
| Colors (crimson accent, status, tier, edge colors) | `src/config/theme.ts` |
| Camera moves | `src/scenes/S*.tsx` (`S2_CAMERA`, `S3A_CAMERA`, ...), `src/config/camera.ts` (limits, drift), `src/config/focus.ts` (named focus rectangles) |
| Outro and device scene | `src/config/outro.ts`, `src/config/devices.ts`, `src/config/mobileScript.ts` |
| Sound cues, volumes, music level | `src/config/sfx.ts` (cues are derived from the film data, so they follow retiming) |
| Graph layout | `src/config/graphLayout.ts` |

After you change prompts or answers, check the auto-scroll with `npm run check`; `docs/PATCH_NOTES.md` explains the
height estimates (`measureRows` in `DevApp`).

---

## Render commands

### `npm run render` (recommended)

| Command | Output |
|---|---|
| `npm run render` | 1080p master + poster + GIF |
| `npm run render:4k` | `out/minime-chat-promo-4k.mp4` (3840x2160, Remotion `--scale=2`) |
| `npm run render:frames` | `out/frames/element-0000.png ...` + `out/audio-mix.wav` + `out/minime-chat-promo-frames.mp4` (the ffmpeg route below) |
| `npm run render:all` | master, 4K and PNG sequence |
| `npm run render:preview` | 960x540 draft, no poster / GIF (fast) |

Options go after `--`, for example `npm run render -- --concurrency=2`:

| Option | Meaning |
|---|---|
| `--concurrency=N` | Parallel browser tabs. Lower it if you run out of memory. |
| `--browser-executable=PATH` | Use this Chrome / Chromium instead of the download |
| `--gl=swangle` | Software GL, only for machines without a usable GPU |
| `--poster-frame=N` | Frame for `poster.png` (default 1830) |
| `--range=A-B` | Render only frames A to B (quick pipeline test; `--poster-frame` then counts inside that clip) |
| `--skip-sfx`, `--skip-poster`, `--skip-gif` | Leave a step out |
| `--keep-raw` | Keep the un-normalised render (`out/.raw-*.mp4`) |

The master uses **PNG frames** (not JPEG) on purpose: JPEG frames make ffmpeg tag the video `yuvj420p` (full range),
PNG frames give a normal `yuv420p`. The price is a somewhat slower render.

### The exact Remotion command (without the script)

```bash
npx remotion render src/index.ts MiniMePromo out/video.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p --image-format=png --audio-codec=aac --audio-bitrate=192k
```

This skips the loudness pass, the poster and the GIF.

### Pure-ffmpeg route (PNG sequence)

Useful when you want to assemble the video yourself or on another machine:

```bash
npm run sfx
npx remotion render src/index.ts MiniMePromo out/frames --sequence --image-format=png
npm run mix            # writes out/audio-mix.wav (the SFX bed, 48 kHz 16-bit)
ffmpeg -framerate 30 -i out/frames/element-%04d.png -i out/audio-mix.wav -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out.mp4
```

`npm run render:frames` does all of this for you (and applies the loudness normalisation in the same step).

### Loudness pass on any mp4

```bash
ffmpeg -i in.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:v copy out.mp4
```

(`render.mjs` does this in two passes: it measures first, then applies the measured values with `linear=true`, which
is more accurate than the one-line version above.)

---

## Music (optional)

The film works with sound effects only. To add music:

1. Pick a **royalty-free track at 120 BPM** (one beat = 15 frames = 0.5 s, so cuts and hits stay on the beat). Search a
   royalty-free library for "120 BPM", "tech", "minimal" or "cinematic pulse". Check the licence allows use in a
   commercial promo, and keep the licence text.
2. Save it as **`public/audio/music.mp3`**.
3. Run `npm run sfx` once more (it records in `src/config/audioManifest.ts` that the file exists), then `npm run render`.

The film plays it at -18 dB, with a 1.5 s fade-in, a 6 dB dip under the big hits and a 2 s fade-out
(`musicVolumeAt` in `src/config/sfx.ts`). Remove the file and run `npm run sfx` again to go back to SFX only.

The PNG-sequence route does not contain the music; add it with
`ffmpeg -i out/audio-mix.wav -i public/audio/music.mp3 -filter_complex "[1:a]volume=-18dB,afade=t=in:d=1.5,afade=t=out:st=60:d=2[m];[0:a][m]amix=inputs=2:duration=first:normalize=0" out/audio-full.wav`
(fade-out at second 60 for the 62 s film; no ducking in that version).

---

## Troubleshooting

**Chrome download fails / "Could not find a browser"**
Run `npx remotion browser ensure` with internet access. Behind a firewall or offline, use a Chrome you already have:
`npm run render -- --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"`
(or set the `REMOTION_BROWSER_EXECUTABLE` environment variable). The same flag works for `npm run check`.

**Fonts look wrong**
The fonts are bundled in `public/fonts/` and listed in `src/lib/vendoredFonts.ts`. If you deleted them, run
`npm run assets` (needs internet once) and keep the regenerated `vendoredFonts.ts`.

**"ffmpeg was not found on your PATH" (Windows)**
Install it (`winget install Gyan.FFmpeg`) and open a **new** terminal. Without admin rights, unzip an ffmpeg build
anywhere and add its `bin` folder to the PATH of the current PowerShell window:
`$env:Path += ";C:\tools\ffmpeg\bin"`. Check with `ffmpeg -version`.

**Out of memory / the browser crashes during the render**
Use fewer parallel tabs: `npm run render -- --concurrency=2` (or `1`). Close other programs. 4K needs more memory than
1080p.

**The render is slow**
The film is 1860 frames with heavy effects (film grain, 3D device scene). Use `npm run render:preview` while
you work and render the master once. Remotion already defaults to about half of your CPU cores for `--concurrency`; raise it only if you have
spare memory. On a machine without a GPU try `--gl=swangle`.

**A step in `npm run render` failed**
The script prints the first likely causes. For the full message run the failing part alone, for example
`node scripts/make-sfx.mjs` or `npx remotion render src/index.ts MiniMePromo out/test.mp4`.

---

## Licensing

- **Remotion** is free for individuals and small companies, but **requires a company license** beyond that. Check
  <https://www.remotion.dev/license> before you use this project commercially in a larger company.
- **Emoji icons** are [Twemoji](https://github.com/twitter/twemoji) graphics, licensed **CC-BY 4.0**. Credit them when
  you publish the film or the project ("Emoji graphics: Twemoji, CC-BY 4.0").
- **Fonts** Sora, Inter and JetBrains Mono are open-source (SIL Open Font License).
- **Sound effects** are generated by `scripts/make-sfx.mjs` and contain no third-party material. A music track you add
  has its own licence.
- The MiniMe logo and the product name belong to the MiniMe project. All people, chats and data in the film are fictional.

---

## Known limitations

- The motion has been checked frame by frame in stills and numerically, but a human should scrub the whole timeline in
  the Studio once (camera hand-offs and the device scene are the places to watch). The sound has been measured
  (levels, clipping) but not judged by ear.
- The film is 62 s (1860 frames), longer than the 58 s in the original brief, because of the laptop / tablet / phone
  end scene. A GIF of the whole film at 720 px / 15 fps may exceed 8 MB; `render.mjs` then steps down to a lighter
  setting and tells you which one it used (this was not measured on the full film yet).
- There is no vertical (1080x1920) version. The UI is built for 16:9 and an unverified crop was not shipped.
- The video uses PNG frames, so it renders more slowly than a JPEG render would.

---

## Extending the series

The project is built so the next films reuse most of it:

1. **A new tab film (Notebooks, Research, Plan, ...)**: copy the structure of `src/config/script.ts` and
   `src/ui/ChatApp.tsx` into a new app component that is driven by one function of the global frame, reuse
   `src/ui/` building blocks (`AppWindow`, `TopNav`, `ChatSidebar`, `StepCard`, `RoutingGraph`, `Markdown`, `CodeBlock`) and
   `src/fx/`, and write new scene files that only export a camera array, a cursor array and an overlay.
2. **Cut-downs (15 s / 30 s) of this film**: every scene is a frame range in `src/config/timeline.ts` and every
   overlay is time-gated, so a shorter film is a new `MiniMePromo-Short` composition in `src/Root.tsx` that wraps the same
   timeline with a different scene selection (or use `--range=A-B` for a quick scene export).
3. **Other formats**: `src/config/focus.ts` holds the named camera targets in logical UI coordinates. A new aspect ratio
   (vertical, square) is a new composition size plus new camera keyframes; verify every shot with `npm run check`
   before shipping it.

More detail on every file, its exports and the conventions to follow is in `docs/PATCH_NOTES.md`.
