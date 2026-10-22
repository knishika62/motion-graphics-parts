// 音量の正規化(2パス loudnorm)。映像はそのまま、音声だけ -14 LUFS / 真のピーク -1.5 dBTP にそろえる
import fs from 'node:fs';
import {run} from './common.mjs';

const TARGET = {I: -14, TP: -1.5, LRA: 11};
export function measure(file) {                                    // 現在の音量(LUFS・真のピーク)
  const e = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-']).stderr;
  const sum = e.slice(e.lastIndexOf('Summary:'));
  return {lufs: +sum.match(/I:\s+(-?[\d.]+) LUFS/)?.[1], tp: +sum.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]};
}
export function normalize(file, log) {
  const before = measure(file);
  const a = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`, '-vn', '-f', 'null', '-']).stderr;
  const m = JSON.parse(a.slice(a.lastIndexOf('{'), a.lastIndexOf('}') + 1));
  const tmp = file.replace(/\.mp4$/, '.norm.mp4');
  const f = `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const r = run('ffmpeg', ['-v', 'error', '-y', '-i', file, '-c:v', 'copy', '-af', f, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', tmp]);
  if (r.status !== 0) { log('  音量の正規化に失敗: ' + (r.stderr || '').slice(-200)); return null; }
  fs.renameSync(tmp, file);
  const after = measure(file); log(`  音量: ${before.lufs} LUFS(ピーク ${before.tp} dB) → ${after.lufs} LUFS(ピーク ${after.tp} dB)`); return {before, after};
}
