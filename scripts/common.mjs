// 共通: 場所、コマンド実行、JSON、場面の長さ(フレーム)の計算。設定ファイル(.env)や、ネットワークの接続先は、いらない
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export const ROOT = path.join(import.meta.dirname, '..');                       // このリポジトリの直下
export const cfg = {fps: 60, beat: 60 / 124};                                    // 場面の長さは、1拍(約0.48秒)の単位

export const run = (cmd, args, opt = {}) => spawnSync(cmd, args, {cwd: ROOT, encoding: 'utf-8', maxBuffer: 1 << 26, timeout: 600000, ...opt});
export const tail = (s, n = 15) => s.split('\n').filter(l => l.trim()).slice(-n).join('\n').slice(-1800);

const beatOf = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'timeline.json'), 'utf-8')).beat || cfg.beat; } catch { return cfg.beat; } };
export const frames = (beats, beat = beatOf()) => {            // 場面の開始フレームと長さ(src/timeline.ts と同じ計算)
  const starts = []; let acc = 0;
  for (const b of beats) { starts.push(Math.round(acc * cfg.fps)); acc += b * beat; }
  const lens = beats.map((_, i) => (i < beats.length - 1 ? starts[i + 1] : Math.round(acc * cfg.fps)) - starts[i]);
  return {starts, lens, total: Math.round(acc * cfg.fps) + 30};
};
export const readJson = f => JSON.parse(fs.readFileSync(f, 'utf-8'));
export const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 1));
