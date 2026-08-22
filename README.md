# Writing Music with LLM

***한국어** · [English](README.en.md)*

음악 이론을 **코드로** 다뤄서 실제로 들리는 음악을 만든 기록입니다.
[Music Theory for Programmers](https://runjs.app/blog/music-theory-for-programmers) 한 편을 출발점으로,
글에 나온 배열·공식·비율만 가지고 브라우저에서 소리를 냅니다.
라이브러리 없이 Web Audio API만 씁니다.

**만든 사람 — [빵형의 개발도상국](https://youtube.com/@bbanghyong)**

🎧 **완성곡 — [In The Sink (feat. Lil Woodie Wood)](https://soundcloud.com/taehee-lee-671090884/in-the-sink-feat-lil-woodie)** (SoundCloud)

🔊 **[브라우저에서 미리보기](https://kairess.github.io/writing-music-with-llm/)**

---

## 무엇이 들어 있나

### 1. EDM Lab — `docs/index.html`

원문에서 요소를 하나씩 꺼내 만든 **10개 트랙**. 조성·BPM·진행·음색이 전부 다르고,
각각 한 가지 기법을 중심에 둡니다. 화면에서 원문의 어느 문장에서 나온 것인지와
실제 계산값(센트, 주파수, 비율)을 함께 보여 줍니다. 한국어/영어 전환 가능.

| | 트랙 | 조성 · BPM | 중심 기법 |
|---|---|---|---|
| 1 | 7/8 박자 | E단조 · 140 | 마디를 8분음표 7개로. 4-on-the-floor가 성립하지 않는다 |
| 2 | 블루스 하프타임 | C단조 · 86 | 블루스 `[3,2,1,1,3,2]`의 "의도적으로 어색한 음" |
| 3 | ii–V–I 스윙 | C장조 · 96 | 7화음, 마디당 코드 2개, 8분음표 2:1 |
| 4 | 배음렬 드론 | A1 기음 · 92 | 코드 진행 없음. 몇 번째 배음을 켜느냐만 움직인다 |
| 5 | 이끔음 | A단조 · 126 | 8마디마다 V7. 곡에서 유일하게 스케일 밖으로 나가는 순간 |
| 6 | 점8분 3:4 | C♯단조 · 124 | 점8분(0.75박)이 4/4 격자와 12마디마다 정렬 |
| 7 | 모드 회전 | D 루트 · 122 | 루트·진행·멜로디 고정, 스케일 배열만 회전 |
| 8 | 순정률 | F단조 · 118 | 패드를 10:12:15로. 평균율 3도는 15.6센트 어긋나 있다 |
| 9 | 배음 모프 | G단조 · 128 | 필터가 아니라 배음을 하나씩 켠다 |
| 10 | 19-EDO | 19분할 · 110 | 12만 답은 아니다. 19분할은 단3도가 0.15센트 오차 |

### 2. 아카펠라 비트 — `beat/`

받아 온 랩 아카펠라를 **측정**해서 거기에 맞는 비트를 설계한 작업입니다.
템포·구조·음역 점유·조성을 ffmpeg + numpy로 재고, 그 수치를 그대로 편곡 제약으로 삼았습니다.

- `beat/beat.html` — D단조 90 BPM 56마디. 하프타임, 보컬 밀도의 역으로 움직이는 편곡.
  이 작업의 결과물이 **[In The Sink (feat. Lil Woodie Wood)](https://soundcloud.com/taehee-lee-671090884/in-the-sink-feat-lil-woodie)** 입니다
- `beat/prayers-beat.html` — C 으뜸음 87.42 BPM 119마디. 아카펠라 분석값으로 고정

핵심 측정과 그로부터 나온 판단은 [`notes/acapella-beat-strategy.md`](notes/acapella-beat-strategy.md)에 정리했습니다.

### 3. 노트 — `notes/`

| 파일 | 내용 |
|---|---|
| [`edm-core-elements.md`](notes/edm-core-elements.md) | 원문에서 발췌·번역한 핵심 요소 |
| [`fresh-ideas.md`](notes/fresh-ideas.md) | 원문에서 아직 안 쓴 요소와 활용 방법 |
| [`acapella-beat-strategy.md`](notes/acapella-beat-strategy.md) | 아카펠라 측정 결과와 비트 제작 전략 |

### 4. 렌더러 — `tools/`

- `tools/render-beat.js` — `beat/beat.html`의 스크립트를 **그대로** 실행해 WAV로 렌더링.
  합성 코드를 옮겨 적지 않고 `OfflineAudioContext`에 물리므로 브라우저에서 듣는 것과 같은 결과가 나옵니다.
- `tools/render-wav.js` — 외부 의존성 없이 배음렬로 직접 합성하는 독립 렌더러

---

## 실행

EDM Lab은 그냥 열면 됩니다.

```bash
open docs/index.html          # 또는 위의 GitHub Pages 링크
```

비트 랩은 아카펠라 파일이 `audio/`에 있어야 합니다.

```bash
open beat/beat.html
```

WAV로 렌더링:

```bash
npm install
node tools/render-beat.js              # → audio/beat.wav
```

---

## 아카펠라 출처

비트 작업에 쓴 두 아카펠라는 [Looperman](https://www.looperman.com/)에서 받았습니다.

| 트랙 | 아티스트 | 표기 BPM | 실측 |
|---|---|---|---|
| [lil woodie wood — this is revolution](https://www.looperman.com/acapellas/detail/24093/lil-woodie-wood-this-is-revolution-by-lilwoodiewood-90bpm-hip-hop-acapella) | lilwoodiewood | 90 | 89.88 (자기상관 179.75 = 2×) |
| [bando prayers](https://www.looperman.com/acapellas/detail/24110/bando-prayers-by-edekali-87bpm-hip-hop-acapella) | edekali | 87 | 87.42 (7구간 독립 추정, σ 0.055) |

이용 조건은 각 Looperman 페이지를 따릅니다.

## 오디오 파일은 레포에 없습니다

`.gitignore`로 모든 오디오를 제외했습니다. 두 가지 이유입니다.

1. **아카펠라 원본은 다른 사람의 녹음입니다.** 레포에 넣으면 그 녹음을 재배포하게 됩니다.
   위 링크에서 직접 받으세요.
2. **렌더 결과물은 수십 MB입니다.** git에 넣을 물건이 아니고, `tools/`로 언제든 다시 만들 수 있습니다.

비트 랩을 돌리려면 `audio/` 폴더를 만들고 아카펠라를 직접 넣으세요.
파일 이름은 각 HTML의 `<audio src>`와 맞추면 됩니다.

```
audio/lil-woodie-wood-this-is-revolution.mp3
audio/bando-prayers.mp3
```

---

## 출처

- 이론 — [Music Theory for Programmers](https://runjs.app/blog/music-theory-for-programmers) (runjs.app)
- 아카펠라 — [lilwoodiewood](https://www.looperman.com/acapellas/detail/24093/lil-woodie-wood-this-is-revolution-by-lilwoodiewood-90bpm-hip-hop-acapella) · [edekali](https://www.looperman.com/acapellas/detail/24110/bando-prayers-by-edekali-87bpm-hip-hop-acapella) (Looperman)
- 완성곡 — [In The Sink (feat. Lil Woodie Wood)](https://soundcloud.com/taehee-lee-671090884/in-the-sink-feat-lil-woodie)
- 제작 — [빵형의 개발도상국](https://youtube.com/@bbanghyong)

곡의 모든 숫자 — 스케일 배열, 코드 공식, 센트, 주파수 비율 — 는 원문에서 유도한 값입니다.
