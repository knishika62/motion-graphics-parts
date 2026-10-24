#!/usr/bin/env node
// 書き出した動画から、一定の間隔でコマを取り出し、「文字が顔にかかっていないか」を調べる(macOS 専用。Vision を使う)。
//   node tools/check_face_text.mjs out/名前.mp4 [--every 1.5] [--threshold 0.06] [--keep]
//   --every: 何秒ごとにコマを取るか(既定 1.5秒)。--threshold: かぶりのしきい値(顔の面積の割合。既定 0.06)。--keep: 取り出したコマを残す(runs/ の check_faces/ へ)
// 結果は、顔にかかっている時刻と文字を表示する。検出は完全ではない(小さい顔・横顔・飾り文字は、見逃す・誤検出する)。最終的には、画像を見て判断する。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const video = args.find(a => !a.startsWith('--') && /\.(mp4|mov|webm)$/i.test(a));
if (!video) { console.error('使い方: node tools/check_face_text.mjs out/名前.mp4 [--every 1.5] [--threshold 0.06] [--keep]'); process.exit(1); }
if (process.platform !== 'darwin') { console.error('このツールは macOS 専用です(Vision を使う)'); process.exit(1); }
const every = +opt('--every', 1.5), dur = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], {encoding: 'utf-8'}).stdout;
if (!(dur > 0)) { console.error('動画の長さを読めない: ' + video); process.exit(1); }
const dir = args.includes('--keep') ? path.resolve(path.dirname(path.resolve(video)), '..', 'runs', path.basename(video, path.extname(video)), 'check_faces') : fs.mkdtempSync(path.join(os.tmpdir(), 'face_text_'));
fs.mkdirSync(dir, {recursive: true});
const cleanup = () => { if (!args.includes('--keep')) fs.rmSync(dir, {recursive: true, force: true}); };     // 途中で止まっても、一時ディレクトリを残さない
const files = [];
for (let t = every / 2; t < dur; t += every) {
  const f = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`);
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf', 'scale=1280:-2', f]);
  if (r.status === 0) files.push(f);
}
const r = spawnSync('swift', [path.join(import.meta.dirname, 'check_face_text.swift'), ...files], {encoding: 'utf-8', env: {...process.env, FACE_TEXT_THRESHOLD: opt('--threshold', '0.06')}, maxBuffer: 1 << 26});
if (r.status !== 0) { console.error('swift の実行に失敗(Xcode のコマンドラインツールが必要):\n' + (r.stderr || '').slice(-400)); cleanup(); process.exit(1); }
let ng = 0, noFace = 0;
for (const line of r.stdout.trim().split('\n')) {
  const [name, faces, texts, res] = line.split('\t'), t = parseFloat(name.slice(1, -4));
  if (faces === '顔0') noFace++;
  if (res !== 'OK') { ng++; console.log(`${t.toFixed(1)}秒  ${faces}  ${texts}  ${res}`); }
}
console.log(`${files.length}コマを確認(${every}秒ごと)。顔にかかっている文字: ${ng}コマ / 顔が見つからなかったコマ: ${noFace}コマ${ng ? '' : '(問題なし)'}`);
if (args.includes('--keep')) console.log('取り出したコマ: ' + dir); else cleanup();
process.exit(ng ? 2 : 0);
