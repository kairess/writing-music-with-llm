# Writing Music with LLM

*[한국어](README.md) · **English***

A record of treating music theory as **code** and getting actual sound out of it.
Everything starts from one article — [Music Theory for Programmers](https://runjs.app/blog/music-theory-for-programmers) —
and uses only the arrays, formulas and ratios it derives. No libraries, just the Web Audio API.

**Made by — [빵형의 개발도상국 (Bbanghyong)](https://youtube.com/@bbanghyong)**

🎧 **Finished track — [In The Sink (feat. Lil Woodie Wood)](https://soundcloud.com/taehee-lee-671090884/in-the-sink-feat-lil-woodie)** (SoundCloud)
🔊 **[Open EDM Lab](https://kairess.github.io/writing-music-with-llm/)**

---

## What's inside

### 1. EDM Lab — `docs/index.html`

**Ten tracks**, each built by pulling one element out of the article. Every track has a different
key, tempo, progression and timbre, and centers on a single technique. The page shows which
sentence in the article each idea comes from, alongside the actual computed numbers
(cents, frequencies, ratios). Korean/English toggle included.

| | Track | Key · BPM | Technique |
|---|---|---|---|
| 1 | 7/8 meter | E minor · 140 | Seven eighth notes per bar. Four-on-the-floor cannot exist |
| 2 | Blues half-time | C minor · 86 | The "deliberately awkward note" in blues `[3,2,1,1,3,2]` |
| 3 | ii–V–I swing | C major · 96 | Seventh chords, two per bar, eighths split 2:1 |
| 4 | Harmonic drone | A1 fundamental · 92 | No progression. Only *which harmonics are lit* moves |
| 5 | Leading tone | A minor · 126 | A V7 every eight bars — the one moment the track leaves the scale |
| 6 | Dotted-eighth 3:4 | C♯ minor · 124 | 0.75-beat grid realigns with 4/4 every twelve bars |
| 7 | Mode rotation | D root · 122 | Root, progression and melody fixed; only the scale array rotates |
| 8 | Just intonation | F minor · 118 | Pads tuned 10:12:15. Equal temperament's third is 15.6 cents off |
| 9 | Harmonic morph | G minor · 128 | Not a filter sweep — harmonics switched on one at a time |
| 10 | 19-EDO | 19 divisions · 110 | Twelve isn't the only answer. 19 gets the minor third to 0.15 cents |

### 2. Acapella beat — `beat/`

Taking a rap acapella, **measuring** it, and designing a beat around the numbers.
Tempo, structure, spectral occupancy and tonality were measured with ffmpeg + numpy,
and those measurements became the arrangement constraints directly.

- `beat/beat.html` — D minor, 90 BPM, 56 bars. Half-time, with the arrangement density
  moving *inversely* to the vocal's. This work became **[In The Sink (feat. Lil Woodie Wood)](https://soundcloud.com/taehee-lee-671090884/in-the-sink-feat-lil-woodie)**
- `beat/prayers-beat.html` — C tonic, 87.42 BPM, 119 bars. Locked to the acapella's measured values

The measurements and the decisions that came out of them are in
[`notes/acapella-beat-strategy.md`](notes/acapella-beat-strategy.md).

### 3. Notes — `notes/`

| File | Contents |
|---|---|
| [`edm-core-elements.md`](notes/edm-core-elements.md) | Core elements extracted from the article (Korean) |
| [`fresh-ideas.md`](notes/fresh-ideas.md) | Elements the article offers that hadn't been used yet |
| [`acapella-beat-strategy.md`](notes/acapella-beat-strategy.md) | Acapella measurements and the resulting beat strategy |

### 4. Renderers — `tools/`

- `tools/render-beat.js` — runs the script inside `beat/beat.html` **as-is** and renders it to WAV.
  Instead of porting the synthesis code by hand, it feeds the same code an `OfflineAudioContext`,
  so the file matches what you hear in the browser.
- `tools/render-wav.js` — a standalone renderer with no dependencies, synthesising
  waveforms additively from the harmonic series

---

## Running it

EDM Lab just opens.

```bash
open docs/index.html          # or use the GitHub Pages link above
```

The beat labs need the acapella files present in `audio/`.

```bash
open beat/beat.html
```

Render to WAV:

```bash
npm install
node tools/render-beat.js              # → audio/beat.wav
```

---

## Acapella credits

Both acapellas came from [Looperman](https://www.looperman.com/).

| Track | Artist | Stated BPM | Measured |
|---|---|---|---|
| [lil woodie wood — this is revolution](https://www.looperman.com/acapellas/detail/24093/lil-woodie-wood-this-is-revolution-by-lilwoodiewood-90bpm-hip-hop-acapella) | lilwoodiewood | 90 | 89.88 (autocorrelation peak 179.75 = 2×) |
| [bando prayers](https://www.looperman.com/acapellas/detail/24110/bando-prayers-by-edekali-87bpm-hip-hop-acapella) | edekali | 87 | 87.42 (seven independent section estimates, σ 0.055) |

Usage terms follow each Looperman page.

## The audio is not in this repo

All audio is excluded via `.gitignore`, for two reasons.

1. **The acapellas are someone else's recordings.** Committing them here would redistribute them.
   Download them from the links above.
2. **Rendered output runs to tens of megabytes.** That doesn't belong in git, and `tools/`
   can regenerate it at any time.

To run the beat labs, create an `audio/` folder and put the acapellas in it.
Filenames need to match each HTML file's `<audio src>`.

```
audio/lil-woodie-wood-this-is-revolution.mp3
audio/bando-prayers.mp3
```

---

## Sources

- Theory — [Music Theory for Programmers](https://runjs.app/blog/music-theory-for-programmers) (runjs.app)
- Acapellas — [lilwoodiewood](https://www.looperman.com/acapellas/detail/24093/lil-woodie-wood-this-is-revolution-by-lilwoodiewood-90bpm-hip-hop-acapella) · [edekali](https://www.looperman.com/acapellas/detail/24110/bando-prayers-by-edekali-87bpm-hip-hop-acapella) (Looperman)
- Finished track — [In The Sink (feat. Lil Woodie Wood)](https://soundcloud.com/taehee-lee-671090884/in-the-sink-feat-lil-woodie)
- Made by — [빵형의 개발도상국 (Bbanghyong)](https://youtube.com/@bbanghyong)

Every number in these tracks — scale arrays, chord formulas, cents, frequency ratios —
is derived from the article.
