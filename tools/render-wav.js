#!/usr/bin/env node
// 멜로딕 하우스 루프를 WAV 파일로 렌더링한다.
// 외부 라이브러리 없음 — Node 기본 모듈만 사용.
//
//   node render-wav.js
//   node render-wav.js --bpm 126 --bars 16 --out loop.wav
//   node render-wav.js --no-drums --no-lead

const fs = require('fs');

// ── 원문의 핵심 함수 ──────────────────────────────────────
const midiToFreq = (n) => 440 * 2 ** ((n - 69) / 12);
const build = (root, p) => p.reduce((n, s) => [...n, n.at(-1) + s], [root]);

const key = 57;                                               // A
const scale = build(key, [2, 1, 2, 2, 1, 2, 2]).slice(0, 7);  // A 자연단조
const chord = (degree) =>
  [0, 2, 4].map((step) => {
    const i = degree - 1 + step;
    return scale[i % 7] + Math.floor(i / 7) * 12;
  });

const progression = [1, 6, 3, 7];                                 // Am – F – C – G
const melody = [0, 2, 4, 2, 3, 2, 1, 0, 4, 3, 2, 1, 0, 2, 1, 0];  // 음도 인덱스
const noteAt = (d, oct = 1) => scale[d % 7] + Math.floor(d / 7) * 12 + oct * 12;

// ── 인자 ────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? def : argv[i + 1];
};
const bpm     = +flag('bpm', 126);
const bars    = +flag('bars', 8);
const outPath = flag('out', 'loop.wav');
const useLead  = !argv.includes('--no-lead');
const useDrums = !argv.includes('--no-drums');

const SR = 44100;
const beat = 60 / bpm;                        // ← 원문 공식
const tail = 1.5;                             // 릴리즈 여유
const total = Math.ceil((bars * 4 * beat + tail) * SR);

const L = new Float64Array(total);
const R = new Float64Array(total);

// ── 파형: 배음렬로 직접 합성 (원문 §배음) ──────────────────
// 톱니 = 모든 배음(1/n), 사각 = 홀수 배음만, 삼각 = 홀수 배음 1/n² 교대부호
const nyq = SR / 2;
const harmCount = (f, cap) => Math.max(1, Math.min(cap, Math.floor(nyq / f) - 1));

function sawSample(phase, f, cap) {
  let s = 0;
  const N = harmCount(f, cap);
  for (let n = 1; n <= N; n++) s += Math.sin(n * phase) / n;
  return s * (2 / Math.PI);
}
function triSample(phase, f, cap) {
  let s = 0, sign = 1;
  const N = harmCount(f, cap);
  for (let n = 1; n <= N; n += 2) { s += sign * Math.sin(n * phase) / (n * n); sign = -sign; }
  return s * (8 / (Math.PI ** 2));
}

// ── ADSR (원문 §엔벨로프) ────────────────────────────────
function adsr(t, dur, a, d, s, r) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur) return s;
  if (t < dur + r) return s * (1 - (t - dur) / r);
  return 0;
}

// ── 믹서: 한 보이스를 버퍼에 더한다 ────────────────────────
function mix(start, len, pan, fn) {
  const i0 = Math.max(0, Math.floor(start * SR));
  const i1 = Math.min(total, Math.ceil((start + len) * SR));
  const gl = Math.cos((pan + 1) * Math.PI / 4);   // 등파워 패닝
  const gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = i0; i < i1; i++) {
    const v = fn((i - start * SR) / SR);
    L[i] += v * gl;
    R[i] += v * gr;
  }
}

// 1차 로우패스 (브라우저판의 biquad 대용)
function lowpass(cutoff) {
  const a = 1 - Math.exp(-2 * Math.PI * cutoff / SR);
  let y = 0;
  return (x) => (y += a * (x - y));
}
function highpass(cutoff) {
  const a = Math.exp(-2 * Math.PI * cutoff / SR);
  let yp = 0, xp = 0;
  return (x) => { const y = a * (yp + x - xp); xp = x; yp = y; return y; };
}

// ── 악기 ────────────────────────────────────────────────
// 패드: 톱니 3겹 디튠 + 로우패스, 좌우로 벌림
function pad(midis, t0, dur) {
  const spread = [-6, 0, 6];
  midis.forEach((m) => {
    spread.forEach((cents, k) => {
      const f = midiToFreq(m) * 2 ** (cents / 1200);
      const lp = lowpass(1400);
      const w = 2 * Math.PI * f;
      mix(t0, dur + 0.6, (k - 1) * 0.6, (t) =>
        lp(sawSample(w * t, f, 24)) * adsr(t, dur, 0.25, 0.2, 0.85, 0.5) * 0.055);
    });
  });
}

// 리드: 톱니 5겹 슈퍼소, 어택 8ms 플럭
function pluck(m, t0, dur) {
  const detune = [-14, -5, 0, 5, 14];
  detune.forEach((cents, k) => {
    const f = midiToFreq(m) * 2 ** (cents / 1200);
    const lp = lowpass(3800);
    const w = 2 * Math.PI * f;
    mix(t0, dur + 0.3, (k - 2) * 0.28, (t) =>
      lp(sawSample(w * t, f, 32)) * adsr(t, dur * 0.9, 0.008, 0.12, 0.35, 0.15) * 0.075);
  });
}

// 베이스: 삼각파 — 배음이 적어 킥과 부딪히지 않는다
function bass(m, t0, dur) {
  const f = midiToFreq(m);
  const w = 2 * Math.PI * f;
  mix(t0, dur + 0.2, 0, (t) =>
    triSample(w * t, f, 12) * adsr(t, dur * 0.85, 0.01, 0.08, 0.7, 0.08) * 0.34);
}

// 킥: 150Hz → 45Hz 피치 스윕 사인
function kick(t0) {
  let phase = 0;
  mix(t0, 0.3, 0, (t) => {
    const f = 45 + (150 - 45) * Math.exp(-t / 0.035);
    phase += 2 * Math.PI * f / SR;
    return Math.sin(phase) * Math.exp(-t / 0.09) * 0.85;
  });
}

// 하이햇: 노이즈 + 하이패스
function hat(t0) {
  const hp = highpass(7000);
  mix(t0, 0.05, 0, (t) =>
    hp((Math.random() * 2 - 1)) * (1 - t / 0.05) * 0.13);
}

// ── 스케줄링 ────────────────────────────────────────────
for (let barI = 0; barI < bars; barI++) {
  const t0 = barI * 4 * beat;
  const deg = progression[barI % 4];
  const notes = chord(deg);

  pad(notes, t0, beat * 4);                     // 코드 1마디 유지
  bass(notes[0] - 24, t0, beat * 4);            // 루트 2옥타브 아래

  if (useLead)
    for (let b = 0; b < 4; b++)                 // 마디당 4음
      pluck(noteAt(melody[(barI % 4) * 4 + b], 1), t0 + b * beat, beat);

  if (useDrums)
    for (let b = 0; b < 4; b++) {               // 강박마다 킥
      kick(t0 + b * beat);
      hat(t0 + b * beat + beat / 2);
    }
}

// ── 노멀라이즈 + 소프트 클립 ─────────────────────────────
let peak = 0;
for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = peak > 0 ? 0.89 / peak : 1;
const soft = (x) => Math.tanh(x * 1.05);

// ── WAV(16-bit PCM 스테레오) 직접 기록 ────────────────────
const bytesPerSample = 2, channels = 2;
const dataSize = total * channels * bytesPerSample;
const buf = Buffer.alloc(44 + dataSize);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);                                   // fmt 청크 크기
buf.writeUInt16LE(1, 20);                                    // PCM
buf.writeUInt16LE(channels, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * channels * bytesPerSample, 28);       // byte rate
buf.writeUInt16LE(channels * bytesPerSample, 32);            // block align
buf.writeUInt16LE(8 * bytesPerSample, 34);                   // bit depth
buf.write('data', 36);
buf.writeUInt32LE(dataSize, 40);

let o = 44;
for (let i = 0; i < total; i++) {
  buf.writeInt16LE(Math.round(soft(L[i] * g) * 32767), o); o += 2;
  buf.writeInt16LE(Math.round(soft(R[i] * g) * 32767), o); o += 2;
}
fs.writeFileSync(outPath, buf);

const secs = total / SR;
console.log(`${outPath} 저장 완료`);
console.log(`  ${bpm} BPM / ${bars}마디 / ${secs.toFixed(2)}초 / ${SR}Hz 16bit 스테레오`);
console.log(`  진행: ${progression.map((d) => `[${chord(d)}]`).join(' → ')}`);
console.log(`  리드 ${useLead ? 'on' : 'off'} · 드럼 ${useDrums ? 'on' : 'off'}`);
