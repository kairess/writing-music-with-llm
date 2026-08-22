#!/usr/bin/env node
// beat.html의 스크립트를 그대로 실행해 WAV로 렌더링한다.
// 손으로 옮기지 않는 이유: 옮기는 순간 beat.html과 어긋나기 시작한다.
//   node render-beat.js [출력파일] [--with-vocal]
const fs = require('fs');
const vm = require('vm');
const { OfflineAudioContext } = require('node-web-audio-api');

const SR   = 48000;
const ROOT = require('path').join(__dirname, '..');
const html = fs.readFileSync(require('path').join(ROOT, 'beat/beat.html'), 'utf8');
const src  = html.split('<script>')[1].split('</script>')[0];

// 마디 수·템포는 스크립트에서 읽어 온다
const BARS = eval(html.match(/const FORM = \[[\s\S]*?\n\];/)[0].replace('const FORM = ',''))
               .reduce((a, f) => a + f.bars, 0);
const BAR  = 60 / 90 * 4;
const DUR  = BARS * BAR + 3;                       // 꼬리 3초

const offline = new OfflineAudioContext(2, Math.ceil(DUR * SR), SR);

// ── DOM 스텁: 무엇을 읽든 자기 자신을 돌려주는 프록시
const NULLS = { error:null, firstChild:null, parentNode:null, files:null };
const ZEROS = { length:0, readyState:0, duration:0, currentTime:0, volume:1, code:0 };
const stub = new Proxy(function(){}, {
  get(t, k){
    if (k in NULLS) return NULLS[k];
    if (k in ZEROS) return ZEROS[k];
    if (k === 'paused') return true;
    if (k === 'checked') return false;
    if (k === 'dataset') return {};
    if (k === 'value' || k === 'textContent' || k === 'innerHTML' || k === 'src') return '';
    if (k === Symbol.toPrimitive) return () => '';
    if (k === 'toString' || k === 'valueOf') return () => '';
    if (k === Symbol.iterator) return function*(){};
    return stub;
  },
  set(){ return true; },
  has(){ return true; },
  apply(){ return stub; },
  construct(){ return stub; },
});
const sandbox = {
  console,
  Math, Date, JSON, Object, Array, Number, String, Boolean, Error,
  Float32Array, Int16Array, Uint8Array, ArrayBuffer,
  isFinite, isNaN, parseFloat, parseInt,
  setInterval: () => 0, clearInterval: () => {},
  setTimeout: () => 0, clearTimeout: () => {},
  requestAnimationFrame: () => 0,
  document: new Proxy({}, { get: () => stub }),
  navigator: { languages: ['ko'], language: 'ko' },
  localStorage: { getItem: () => null, setItem: () => {} },
  location: { search: '' },
  URL: { createObjectURL: () => '' },
  URLSearchParams: function(){ return { get: () => null }; },
  window: {},
};
sandbox.globalThis = sandbox;
// initAudio()가 만드는 컨텍스트를 오프라인 것으로 바꿔치기한다
sandbox.window.AudioContext = function(){ return offline; };

vm.createContext(sandbox);
// 스크립트 끝에 필요한 바인딩을 밖으로 내보내는 코드를 덧붙인다
vm.runInContext(src + `
;globalThis.__api = {
  initAudio, scheduleBar, BARS, BAR, BEAT,
  reset(){ vlPrev = null; arpN = 0; arpBeat = 0; filtPrime = true; LAYER = 2; }
};`, sandbox, { filename: 'beat.html' });

const api = sandbox.__api;
api.initAudio();
api.reset();
for (let bar = 0; bar < api.BARS; bar++) api.scheduleBar(bar, bar * api.BAR);

console.log(`렌더링 ${api.BARS}마디 / ${DUR.toFixed(2)}초 @ ${SR}Hz …`);
offline.startRendering().then((buf) => {
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  // 소프트 클리퍼는 1.0에서 포화하지만 oversample='4x' 보간이 약 0.1dB 오버슈트를 만든다.
  // 16비트로 쓰면 그 부분이 하드 클리핑되므로 살짝만 내린다 (들리지 않는 양).
  const TRIM = peak > 0.995 ? 0.995 / peak : 1;
  const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2]
            : require('path').join(ROOT, 'audio/beat.wav');
  const n = L.length, bytes = n * 4, b = Buffer.alloc(44 + bytes);
  b.write('RIFF',0); b.writeUInt32LE(36+bytes,4); b.write('WAVE',8);
  b.write('fmt ',12); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(2,22);
  b.writeUInt32LE(SR,24); b.writeUInt32LE(SR*4,28); b.writeUInt16LE(4,32); b.writeUInt16LE(16,34);
  b.write('data',36); b.writeUInt32LE(bytes,40);
  let o = 44;
  const cl = (x) => Math.max(-1, Math.min(1, x));
  for (let i = 0; i < n; i++){
    b.writeInt16LE(Math.round(cl(L[i]*TRIM)*32767), o); o += 2;
    b.writeInt16LE(Math.round(cl(R[i]*TRIM)*32767), o); o += 2;
  }
  fs.writeFileSync(out, b);
  console.log(`${out}  ${(bytes/1048576).toFixed(1)}MB`);
  console.log(`  렌더 피크 ${peak.toFixed(4)}  트림 ${(20*Math.log10(TRIM)).toFixed(2)}dB  최종 피크 ${(peak*TRIM).toFixed(4)}`);
});
