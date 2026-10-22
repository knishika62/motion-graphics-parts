import {G} from '../lib';

type Fit = {fitRow: (t: string, cx: number, cy: number, maxW: number, maxSize: number, fonts: string, o?: {left?: boolean; col?: string}) => G[]; fitCol: (t: string, cx: number, cy: number, maxH: number, maxSize: number, fonts: string) => G[]};
export type Lay = {device?: {kind: string; x: number; y: number; w: number}; G: G[]; badge: {x: number; y: number; size: number}; water: {x: number; y: number; size: number}};
export const LAYOUT_NAMES = ['center', 'left', 'vertical', 'diagonal', 'split', 'corner', 'hero', 'stairs', 'phone', 'pc', 'chart', 'mail', 'shield', 'people', 'clock', 'steps', 'bars', 'ring', 'shot', 'clip', 'clips', 'disc', 'eq', 'code', 'match', 'house', 'bottle', 'jobmatch', 'pic', 'pics', 'scatter', 'wave', 'zigzag'];

const bounds = (G: G[]) => ({l: Math.min(...G.map(g => g.x - g.size / 2)), r: Math.max(...G.map(g => g.x + g.size / 2))});
const shift = (G: G[], dx: number) => G.map(g => ({...g, x: g.x + dx}));
const rot = (G: G[], th: number, cx: number, cy: number) => G.map(g => ({...g, x: cx + (g.x - cx) * Math.cos(th) - (g.y - cy) * Math.sin(th), y: cy + (g.x - cx) * Math.sin(th) + (g.y - cy) * Math.cos(th), rot: (g.rot ?? 0) + th}));
const Y: Record<number, number[]> = {1: [540], 2: [400, 680], 3: [300, 540, 780]};

// 文字の配置。行の数が合わないときは、近い配置に落とす(center / left)
export function layout(name: string, lines: string[], f: Fit): Lay {
  const n = Math.min(3, lines.length), L = lines.slice(0, 3), F = ['g', 'm', 'g'];
  const mk = (G: G[], badge: Lay['badge'], water: Lay['water']): Lay => ({G, badge, water});
  const center = (): Lay => mk(n === 1 ? f.fitRow(L[0], 960, 520, 1700, 360, 'g') : [...f.fitRow(L[0], 960, 400, 1700, 300, 'g'), ...f.fitRow(L[1], 960, 680, 1600, 260, 'm')], {x: 960, y: 140, size: 130}, {x: 960, y: 540, size: 780});
  switch (name) {
    case 'none': return mk([], {x: 1660, y: 540, size: 190}, {x: 960, y: 540, size: 780});            // 文字のない場面(写真・動画だけを見せる。歌詞を重ねる場面など)。アイコン(layers.icon)は、右の丸バッジとして出せる
    case 'phone': case 'pc': case 'chart': case 'mail': case 'shield': case 'people': case 'clock': case 'steps': case 'bars': case 'ring': case 'shot': case 'clip': case 'clips': case 'disc': case 'eq': case 'code': case 'match': case 'house': case 'bottle': case 'jobmatch': case 'pic': case 'pics': {      // 左に文字、右に端末・グラフの絵
      const dev = name === 'phone' ? {kind: name, x: 1500, y: 540, w: 390} : name === 'pc' ? {kind: name, x: 1450, y: 520, w: 780} : name === 'shield' ? {kind: name, x: 1480, y: 540, w: 560} : name === 'clock' ? {kind: name, x: 1480, y: 540, w: 640} : name === 'steps' ? {kind: name, x: 1420, y: 540, w: 820} : name === 'pic' ? {kind: name, x: 1430, y: 520, w: 680} : name === 'pics' ? {kind: name, x: 1430, y: 520, w: 600} : name === 'jobmatch' ? {kind: name, x: 1450, y: 520, w: 780} : ['disc', 'match', 'house', 'bottle', 'eq'].includes(name) ? {kind: name, x: 1470, y: 520, w: 640} : name === 'code' ? {kind: name, x: 1440, y: 520, w: 800} : name === 'clip' ? {kind: name, x: 1500, y: 540, w: 470} : name === 'clips' ? {kind: name, x: 1470, y: 540, w: 350} : name === 'shot' ? {kind: name, x: 1440, y: 520, w: 820} : name === 'bars' ? {kind: name, x: 1440, y: 500, w: 760} : name === 'ring' ? {kind: name, x: 1450, y: 500, w: 640} : {kind: name, x: 1450, y: 520, w: 720};
      return {...mk(L.flatMap((t, k) => f.fitRow(t, 150, Y[Math.max(2, n)][k] - (n === 1 ? 140 : 0), 880, 190, F[k], {left: true})), {x: 1810, y: 105, size: 96}, {x: 520, y: 700, size: 520}), device: dev};
    }
    case 'left': return mk(L.flatMap((t, k) => f.fitRow(t, 160, Y[n][k], 1340, 230, F[k], {left: true})), {x: 1660, y: 540, size: 210}, {x: 1500, y: 540, size: 720});
    case 'vertical': { const xs = n === 3 ? [1540, 1150, 760] : [1400, 900]; return n < 2 ? center() : mk(L.flatMap((t, k) => f.fitCol(t, xs[k], 480, 820, 220, ['gm', 'mg', 'gm'][k])), {x: 340, y: 480, size: 210}, {x: 420, y: 540, size: 780}); }
    case 'diagonal': { const c = center(); return mk(rot(c.G, -0.09, 960, 540), {x: 1650, y: 230, size: 150}, {x: 1400, y: 700, size: 720}); }
    case 'split': return n < 2 ? center() : mk([...f.fitRow(L[0], 480, 440, 820, 240, 'g'), ...f.fitRow(L[1], 1440, 650, 820, 240, 'm')], {x: 960, y: 140, size: 120}, {x: 960, y: 540, size: 820});
    case 'corner': { if (n < 2) return center(); const big = f.fitRow(L[1], 960, 700, 1500, 320, 'g'); return mk([...f.fitRow(L[0], 160, 220, 900, 90, 'm', {left: true}), ...shift(big, 1760 - bounds(big).r)], {x: 1700, y: 240, size: 160}, {x: 700, y: 640, size: 720}); }
    case 'hero': return n < 2 ? center() : mk([...f.fitRow(L[0], 960, 450, 1700, 520, 'g'), ...f.fitRow(L[1], 960, 810, 1500, 110, 'm')], {x: 960, y: 120, size: 110}, {x: 960, y: 480, size: 820});
    case 'stairs': return mk(L.flatMap((t, k) => f.fitRow(t, 160 + k * 260, Y[Math.max(2, n)][k], 1500 - k * 260, 220, F[k], {left: true})), {x: 1700, y: 860, size: 160}, {x: 1500, y: 700, size: 720});
    // ---- 配置を崩す(整っていない配置) ----
    case 'scatter': {                                                                                // 行ごとに、位置と傾きを変えて、散らす(位置は、言葉から決まる。毎回同じ)
      const T = [[[700, 300, -.07], [1220, 560, .06], [760, 820, -.04]], [[1220, 300, .06], [700, 540, -.08], [1200, 820, .05]], [[760, 300, .05], [1240, 540, -.05], [840, 820, .07]]];
      const h = [...L.join('')].reduce((a, c) => a + c.charCodeAt(0), 0) % 3, sz = [250, 210, 230];
      return mk(L.flatMap((t, k) => { const [cx, cy, th] = T[h][k], g = f.fitRow(t, cx, cy, Math.min(1100, 2 * Math.min(cx - 90, 1830 - cx)), sz[k], F[k]); return rot(g, th, cx, cy); }), {x: 1790, y: 110, size: 100}, {x: 960, y: 540, size: 780});
    }
    case 'wave': {                                                                                   // 文字が、波のように上下に揺れて並ぶ
      const row = (t: string, cy: number, amp: number, ph: number, size: number) => f.fitRow(t, 960, cy, 1700, size, 'g').map((g, i) => ({...g, y: g.y + amp * Math.sin(i * .75 + ph), rot: -.2 * Math.cos(i * .75 + ph) * (amp / 70)}));
      return mk(n === 1 ? row(L[0], 540, 70, 0, 280) : [...row(L[0], 400, 60, 0, 250), ...row(L[1], 700, 50, 1.6, 230)], {x: 960, y: 120, size: 110}, {x: 960, y: 540, size: 780});
    }
    case 'zigzag': {                                                                                 // 行が、左・右・左と交互に寄って、大きさも変わる
      if (n < 2) return center();
      const sz = [250, 210, 240];
      return mk(L.flatMap((t, k) => { const g = f.fitRow(t, k % 2 ? 960 : 160, Y[Math.max(2, n)][k], 1250, sz[k], F[k], {left: !(k % 2)}); return k % 2 ? shift(g, 1770 - bounds(g).r) : g; }), {x: 1780, y: 120, size: 110}, {x: 960, y: 540, size: 780});
    }
    default: return center();
  }
}
export const boxOf = (G: G[]) => { if (!G.length) return {x: 960, y: 540, w: 1, h: 1}; const x0 = Math.min(...G.map(g => g.x - g.size * .5)), x1 = Math.max(...G.map(g => g.x + g.size * .5)), y0 = Math.min(...G.map(g => g.y - g.size * .5)), y1 = Math.max(...G.map(g => g.y + g.size * .5)); return {x: x0, y: y0, w: x1 - x0, h: y1 - y0}; };
