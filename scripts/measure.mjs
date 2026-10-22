// 書き出した動画の、機械的な品質計測(LLMもVisionも使わない)。結果は報告のみで、動画は変えない。
//   黒: 真っ黒に近い画面が0.3秒以上続く(書き出しの失敗の検出)
//   点滅: 1秒の間に、画面全体の明るさが大きく変わる回数(3回/秒を超えると、見る人に負担。WCAGの目安)
//   はみ出し: 文字の色の画素が、画面の端(安全な範囲の外)にあるか。場面ごとに数コマ見る
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, frames, run} from './common.mjs';

const W = 1920, H = 1080, MX = Math.round(W * .025), MY = Math.round(H * .025);          // 画面の端から2.5%より外側を、はみ出しとみなす
const lum = (r, g, b) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const contrast = (a, b) => { const [x, y] = [lum(...a), lum(...b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

function frameRaw(mp4, t) {                                          // t秒のコマを RGB で取り出す(1920x1080)
  const r = run('ffmpeg', ['-v', 'error', '-ss', t.toFixed(3), '-i', mp4, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {encoding: 'buffer'});
  return r.stdout?.length === W * H * 3 ? r.stdout : null;
}
// 背景(いちばん多い色)と、文字の色(背景と十分に差があり、多い色)を推定し、端の帯にある文字色の画素数を数える
function edgeInk(buf) {
  const q = (r, g, b) => (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3), hist = new Map();
  for (let i = 0; i < buf.length; i += 12) { const k = q(buf[i], buf[i + 1], buf[i + 2]); hist.set(k, (hist.get(k) || 0) + 1); }
  const col = k => [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4], top = [...hist.entries()].sort((a, b) => b[1] - a[1]);
  const bg = col(top[0][0]); const ink = top.slice(1, 60).map(([k, n]) => ({c: col(k), n})).find(x => contrast(x.c, bg) >= 6 && x.n > 400)?.c;
  if (!ink) return {n: 0, ink: null};
  let n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x >= MX && x < W - MX && y >= MY && y < H - MY) { x = W - MX - 1; continue; }        // 中の部分は飛ばす
    if (x < 340 && y < 140) continue;                                                       // 左上のロゴ
    const i = (y * W + x) * 3; if (Math.abs(buf[i] - ink[0]) + Math.abs(buf[i + 1] - ink[1]) + Math.abs(buf[i + 2] - ink[2]) < 40) n++;
  }
  return {n, ink};
}
export function measureVideo(mp4, beats, log) {
  const out = {black: [], flicker: 0, edge: []}, dur = +run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).stdout;
  // 黒
  const bd = run('ffmpeg', ['-hide_banner', '-i', mp4, '-vf', 'blackdetect=d=0.3:pic_th=0.98:pix_th=0.04', '-an', '-f', 'null', '-']).stderr.match(/black_start:[\d.]+/g) || [];
  out.black = bd.map(s => +s.split(':')[1]);
  // 点滅: 1コマごとの平均の明るさ(0〜255)を取り、前のコマとの差が 20 以上になった回数を、1秒の窓で数える
  const ys = run('ffprobe', ['-v', 'error', '-f', 'lavfi', '-i', `movie=${mp4.replace(/[:\\']/g, '\\$&')},signalstats`, '-show_entries', 'frame_tags=lavfi.signalstats.YAVG', '-of', 'csv=p=0'], {maxBuffer: 1 << 26}).stdout.trim().split('\n').map(Number).filter(x => !isNaN(x));
  const fps = ys.length / dur, jumps = ys.map((y, i) => (i && Math.abs(y - ys[i - 1]) >= 20 ? i : -1)).filter(i => i >= 0);
  for (const j of jumps) out.flicker = Math.max(out.flicker, jumps.filter(k => k >= j && k < j + fps).length);
  // はみ出し: 場面ごとに、40%・70%・92%のコマ
  const {starts, lens} = frames(beats);
  starts.forEach((s, i) => { let worst = 0; for (const p of [.4, .7, .92]) { const b = frameRaw(mp4, Math.min(dur - .1, (s + lens[i] * p) / 60)); if (b) worst = Math.max(worst, edgeInk(b).n); } out.edge.push(worst); });
  const edgeNg = out.edge.map((n, i) => (n > 120 ? i + 1 : 0)).filter(Boolean);
  log(`  計測: 黒 ${out.black.length ? out.black.map(t => t.toFixed(1) + 's').join(',') : 'なし'} / 点滅 最大${out.flicker}回/秒${out.flicker > 3 ? '(3回/秒を超える)' : ''} / 画面の端への文字のはみ出し ${edgeNg.length ? '場面 ' + edgeNg.join(',') : 'なし'}`);
  return {...out, edgeNg, ok: !out.black.length && out.flicker <= 3 && !edgeNg.length};
}
