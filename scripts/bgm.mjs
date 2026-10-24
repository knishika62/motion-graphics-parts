// BGM。曲を用意してあればそれを使い、無ければ雰囲気ごとの簡単な曲をコードで合成する(外部のモデル・素材は使わない)。
// 長さは、動画に合わせて切り、最後にフェードアウトする。
//   用意する曲: assets/bgm/<雰囲気>.(mp3|wav|m4a|flac)、または assets/bgm/default.*  /  --bgm-file <ファイル> で直接指定
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, probeDuration, run} from './common.mjs';

const PROJECT = ROOT;                                                         // このリポジトリの直下(assets/ はこの中)
const SR = 48000;
// 雰囲気ごとの曲の設計: bpm、コード進行(根音のMIDI番号とコードの種類)、使う楽器
const NOTE = m => 440 * 2 ** ((m - 69) / 12);
const CH = {maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], maj: [0, 4, 7], m: [0, 3, 7], sus: [0, 5, 7], dom: [0, 4, 7, 10]};
const SONGS = {
  pop:     {bpm: 124, prog: [[60, 'maj'], [67, 'maj'], [69, 'm'], [65, 'maj']], pad: .5, bass: 'eighth', arp: 'sixteenth', hat: true,  kick: true},
  calm:    {bpm: 72,  prog: [[60, 'maj7'], [69, 'm7'], [65, 'maj7'], [67, 'dom']], pad: 1, bass: 'whole', arp: 'eighth', hat: false, kick: false},
  tech:    {bpm: 110, prog: [[57, 'm7'], [53, 'maj7'], [60, 'maj'], [55, 'dom']], pad: .6, bass: 'eighth', arp: 'sixteenth', hat: true, kick: true},
  warm:    {bpm: 88,  prog: [[65, 'maj'], [62, 'm'], [67, 'sus'], [60, 'maj']], pad: .9, bass: 'quarter', arp: 'eighth', hat: false, kick: false},
  elegant: {bpm: 66,  prog: [[62, 'm7'], [67, 'dom'], [60, 'maj7'], [57, 'm7']], pad: 1, bass: 'whole', arp: 'quarter', hat: false, kick: false},
  fresh:   {bpm: 118, prog: [[62, 'maj'], [69, 'maj'], [71, 'm'], [67, 'maj']], pad: .5, bass: 'eighth', arp: 'eighth', hat: true, kick: true},
  candy:   {bpm: 132, prog: [[60, 'maj'], [65, 'maj'], [67, 'maj'], [60, 'maj']], pad: .4, bass: 'quarter', arp: 'sixteenth', hat: true, kick: true},
  halloween: {bpm: 104, prog: [[57, 'm'], [53, 'maj'], [50, 'm'], [52, 'dom']], pad: .7, bass: 'quarter', arp: 'eighth', hat: true, kick: true},
  bold:    {bpm: 128, prog: [[57, 'm'], [53, 'maj'], [60, 'maj'], [55, 'maj']], pad: .6, bass: 'eighth', arp: 'eighth', hat: true, kick: true},
};

export function synth(moodId, seconds, file) {
  const S = SONGS[moodId] || SONGS.pop, spb = 60 / S.bpm, n = Math.ceil((seconds + 1) * SR), L = new Float32Array(n), R = new Float32Array(n);
  const add = (t0, dur, f, amp, shape = 'tri', pan = 0, a = .01, r = .15) => {
    const i0 = Math.floor(t0 * SR), len = Math.floor((dur + r) * SR);
    for (let k = 0; k < len && i0 + k < n; k++) {
      const t = k / SR, env = Math.min(1, t / a) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / r));
      const ph = 2 * Math.PI * f * t;
      const v = shape === 'sine' ? Math.sin(ph) : shape === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph) + .3 * Math.sin(2 * ph) + .12 * Math.sin(3 * ph);
      const x = v * env * amp; L[i0 + k] += x * (1 - Math.max(0, pan)); R[i0 + k] += x * (1 + Math.min(0, pan));
    }
  };
  let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const bars = Math.ceil((seconds + 1) / (spb * 4));
  for (let bar = 0; bar < bars; bar++) {
    const [root, kind] = S.prog[bar % S.prog.length], t0 = bar * spb * 4, notes = CH[kind].map(x => root + x);
    for (const [j, m] of notes.entries()) add(t0, spb * 4 * .98, NOTE(m), .05 * S.pad, 'sine', (j - 1.5) * .3, spb * 1.2, spb);        // パッド(長い和音)
    const bn = {whole: [0], quarter: [0, 1, 2, 3], eighth: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5]}[S.bass];
    for (const bt of bn) add(t0 + bt * spb, spb * (S.bass === 'whole' ? 3.6 : .4), NOTE(root - 24), .16, 'tri', 0, .01, .08);              // ベース
    const step = {quarter: 1, eighth: .5, sixteenth: .25}[S.arp];
    for (let q = 0; q < 4 / step; q++) { const m = notes[(q * (step < .5 ? 1 : 2) + (bar % 2)) % notes.length] + 12 + (q % 8 > 4 ? 12 : 0); add(t0 + q * step * spb, step * spb * .8, NOTE(m), .055, 'pluck', (q % 2 ? .4 : -.4), .004, step * spb * .6); }   // アルペジオ
    for (let q = 0; q < 4; q++) {
      const tb = t0 + q * spb;
      if (S.kick) { const i0 = Math.floor(tb * SR); for (let k = 0; k < SR * .18 && i0 + k < n; k++) { const t = k / SR, f = 120 * Math.exp(-t * 28) + 42, x = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 14) * .38; L[i0 + k] += x; R[i0 + k] += x; } }
      if (S.hat) { const i0 = Math.floor((tb + .5 * spb) * SR); for (let k = 0; k < SR * .04 && i0 + k < n; k++) { const x = (rnd() - .5) * Math.exp(-k / SR * 90) * .1; L[i0 + k] += x; R[i0 + k] += x; } }
    }
  }
  let pk = 1e-6; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const g = .8 / pk, buf = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2); }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, buf]));
}

const EXTS = ['mp3', 'wav', 'm4a', 'flac'];
const findTrack = base => EXTS.map(e => `${base}.${e}`).find(f => fs.existsSync(f)) || null;
// 動画に、BGM(用意した曲、またはコード合成の曲)を混ぜる。mp4 をその場で置き換える
export function mixBgm(mp4, {moodId, track, log, loud = false}) {      // loud: BGMが主役のとき(このリポジトリは、いつも)は、大きめにする
  let dur; try { dur = probeDuration(mp4); } catch (e) { log('  BGMの混合に失敗: ' + e.message); return false; }
  const dir = path.join(PROJECT, 'assets', 'bgm');
  let src = track && fs.existsSync(path.resolve(track)) ? path.resolve(track) : findTrack(path.join(dir, moodId)) || findTrack(path.join(dir, 'default')), how = src ? `用意した曲(${path.basename(src)})` : '';
  const synthesized = !src;                                                    // 消してよいのは、ここで合成した一時ファイルだけ(用意した曲は、名前が何であれ、消さない)
  if (synthesized) { src = mp4.replace(/\.mp4$/, '.synth-bgm.wav'); synth(moodId, dur, src); how = `コードで合成(${moodId})`; }
  const tmp = mp4.replace(/\.mp4$/, '.bgm.mp4');
  // 曲が短いときは、入力側で繰り返す(-stream_loop)。繰り返しの長さを、動画に合わせて切る(atrim)
  const fl = `[1:a]atrim=0:${dur.toFixed(2)},afade=t=in:d=1.2,afade=t=out:st=${Math.max(0, dur - 2.5).toFixed(2)}:d=2.5,volume=${loud ? -8 : -20}dB[bgm];` +
    `[0:a]asplit=2[nar][key];[bgm][key]sidechaincompress=threshold=0.015:ratio=10:attack=15:release=450[duck];[nar][duck]amix=inputs=2:duration=first:normalize=0[a]`;
  const r = run('ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-stream_loop', '-1', '-i', src, '-filter_complex', fl, '-map', '0:v', '-map', '[a]', '-t', dur.toFixed(3), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', tmp]);
  if (synthesized) fs.rmSync(src, {force: true});
  if (r.status !== 0) { log('  BGMの混合に失敗: ' + (r.stderr || '').slice(-300)); fs.rmSync(tmp, {force: true}); return false; }
  fs.renameSync(tmp, mp4); log(`  BGM: ${how}`); return true;
}
