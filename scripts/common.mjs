// 共通: 場所、コマンド実行、JSON、場面の長さ(フレーム)の計算。設定ファイル(.env)や、ネットワークの接続先は、いらない
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export const ROOT = path.join(import.meta.dirname, '..');                       // このリポジトリの直下
export const cfg = {fps: 60};                                                    // 場面の長さは、台本の sec(秒)を、1拍(曲のBPMから決まる)で割った拍数

export const run = (cmd, args, opt = {}) => spawnSync(cmd, args, {cwd: ROOT, encoding: 'utf-8', maxBuffer: 1 << 26, timeout: 600000, ...opt});
export const tail = (s, n = 15) => s.split('\n').filter(l => l.trim()).slice(-n).join('\n').slice(-1800);
// 失敗(終了コードが0でない・タイムアウト・起動できない)なら、末尾のメッセージを付けて投げる
export function mustRun(cmd, args, opt = {}) {
  const r = run(cmd, args, opt);
  if (r.error || r.status !== 0) throw new Error(`${cmd} が失敗(${r.error ? r.error.message : r.signal ? '中断: ' + r.signal : '終了コード ' + r.status}): ${tail(String(r.stderr || '') + String(r.stdout || ''))}`);
  return r;
}
// 動画・音声の長さ(秒)。読めないときは、NaN にせず、投げる
export function probeDuration(file) {
  const r = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]), d = parseFloat(String(r.stdout).trim());
  if (!(d > 0)) throw new Error(`長さを読めない: ${file}(ffprobe: ${tail(String(r.stderr || '')) || '出力なし'})`);
  return d;
}

// 場面の開始フレーム・長さ・合計。台本の sec から決まる beats(拍数)・beat(1拍の秒)・hold(最後の余韻。秒)から作り、timeline.json に書く。
// 描画(src/timeline.ts)も、計測(measure.mjs)も、この結果だけを読む(計算は、ここの1か所)
export function makeTimeline(beats, beat, hold) {
  const starts = []; let acc = 0;
  for (const b of beats) { starts.push(Math.round(acc * cfg.fps)); acc += b * beat; }
  const lens = beats.map((_, i) => (i < beats.length - 1 ? starts[i + 1] : Math.round(acc * cfg.fps)) - starts[i]);
  return {beats, beat, hold, starts, lens, total: Math.round(acc * cfg.fps) + Math.round(hold * cfg.fps)};
}
export const readJson = f => JSON.parse(fs.readFileSync(f, 'utf-8'));
export const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 1));
