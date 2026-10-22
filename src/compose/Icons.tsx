import React, {useContext, useMemo} from 'react';
import {Icon} from './Icon';
import {SceneCtx, cl, eo, W, H} from '../lib';

// アイコンの飾り(layers.icons): 場面に、題材の絵を、いくつも出す。
// layers.icon(1つ)は、配置が決めた位置の丸バッジ(compose.tsx が出す)。layers.icons(配列)は、ここが出す。
//   layers.iconsStyle: "pop"(既定。拍に合わせて、弾ける。24個まで。位置は、乱数)/ "float"(画面のまわりを、ふわふわ漂う。9個まで)
// 置き場所は、丸バッジ(layers.icon)・場面の文字・右側の絵(スマホや写真など)・layers.iconsAvoid の領域と、重ならない場所だけを使う。
// 使える場所が、書いた数より少ないときは、出る絵の数が減る(重ねない)。
const SPOTS: [number, number][] = [             // float 用(16か所。丸バッジから遠い順に使う)
  [0.13, 0.22], [0.39, 0.10], [0.66, 0.10], [0.83, 0.10],
  [0.27, 0.34], [0.75, 0.34], [0.94, 0.34],
  [0.06, 0.54], [0.25, 0.61], [0.73, 0.62], [0.90, 0.62],
  [0.06, 0.89], [0.27, 0.90], [0.44, 0.90], [0.63, 0.90], [0.94, 0.90],
];
const ICON_R = 108;      // float: 丸バッジを避ける距離(いちばん大きい絵(164px)の半径82 + 揺れ16 + 余白10)
const TEXT_R = 96;       // float: 文字・右側の絵を避ける距離(絵の半径82 + 揺れ14)
// pop 用: 置き場所は、乱数(場面ごとに決まる値。何度書き出しても同じ)。形・大きさ・拍のずれも、ばらばら
const POP_GAP = 178;     // pop の絵どうしの間隔(中心から中心。いちばん大きい絵(118px)が、拍で1.3倍に弾んで、跳ねても、ぶつからない)
const POP_R = 100;       // pop の絵(最大118px、拍で1.3倍、跳ね30px)が、文字・丸バッジ・避ける領域から離れる距離
const COLORS = ['', '', '#FF6AA8', '#FFD23D', '#7AF0FF', '#B6FF3D', '#B07CFF'];      // pop の色(空は、場面の文字色・強調色)
export type Rect = {x0: number; y0: number; x1: number; y1: number};
const distToRect = (px: number, py: number, r: Rect) => Math.hypot(Math.max(r.x0 - px, 0, px - r.x1), Math.max(r.y0 - py, 0, py - r.y1));
const easeBack = (x: number) => { const c = 2.4, v = cl(x) - 1; return 1 + (c + 1) * v ** 3 + c * v ** 2; };       // 行き過ぎて戻る(ぽんっと出る)
const rng = (seed: number) => { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
const strHash = (t: string) => { let h = 2166136261; for (const c of t) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
type Pt = {x: number; y: number; size: number; off: number; sgn: number; col: number};

export const Icons: React.FC<{names?: string[]; accent: string; ink: string; b: number; badge?: {x: number; y: number; size: number}; avoid?: Rect[]; style?: string}> = ({names = [], accent, ink, b, badge, avoid = [], style = 'pop'}) => {
  const {beats} = useContext(SceneCtx);
  const pop = style !== 'float', maxN = pop ? 24 : 9, want = Math.min(names.length, maxN), key = names.join(',');
  // 置き場所を決める。pop: 乱数で、ばらばらに(間隔 POP_GAP 以上)。float: 丸バッジから遠い順
  const pts = useMemo<Pt[]>(() => {
    if (!pop) {
      const gap = ([sx, sy]: [number, number]) => badge ? Math.hypot(sx * W - badge.x, sy * H - badge.y) - (badge.size * .75 + ICON_R) : 0;
      const sorted = SPOTS.filter(s => gap(s) >= 0 && avoid.every(r => distToRect(s[0] * W, s[1] * H, r) >= TEXT_R)).sort((a, c) => gap(c) - gap(a));
      const rot = sorted.length ? (want * 3) % sorted.length : 0;      // 場面ごとに、少し違う場所を使う
      return sorted.map((_, i) => sorted[(i + rot) % sorted.length]).slice(0, want).map(([sx, sy], k) => ({x: sx * W, y: sy * H, size: 96 + (k % 3) * 34, off: 0, sgn: 1, col: 0}));
    }
    const r = rng(strHash(key) ^ (want * 2654435761)), out: Pt[] = [];
    for (let t = 0; t < 8000 && out.length < want; t++) {
      const x = 90 + r() * (W - 180), y = 90 + r() * (H - 180);
      if (badge && Math.hypot(x - badge.x, y - badge.y) < badge.size * .75 + POP_R) continue;
      if (avoid.some(rc => distToRect(x, y, rc) < POP_R)) continue;
      if (out.some(p => Math.hypot(p.x - x, p.y - y) < POP_GAP)) continue;
      out.push({x, y, size: Math.round(68 + r() * 50), off: [0, .25, .5, .75][Math.floor(r() * 4)], sgn: r() < .5 ? -1 : 1, col: Math.floor(r() * COLORS.length)});
    }
    return out;
  }, [badge, want, avoid, pop, key]);
  const list = names.slice(0, pts.length);
  if (!list.length) return null;
  const beat = b * beats / 4;                                          // 場面の頭からの、拍の数(場面の頭は、曲の拍の上にある)
  const step = Math.min(0.4, beats * 0.6 / list.length);               // 1つずつ出る間隔(拍)。全部が、場面の6割までに出そろう
  return (
    <>
      {list.map((n, k) => {
        const p = pts[k];
        if (!pop) {                                                      // float: ふわふわ漂う
          const t = eo(cl((b - .7 - k * .18) / .8));
          if (t <= 0) return null;
          const dx = 16 * Math.sin(b * 1.5 + k * 1.7), dy = 13 * Math.cos(b * 1.2 + k * 2.1), wob = 10 * Math.sin(b * 1.8 + k * 2.6);
          return (
            <div key={k} style={{position: 'absolute', left: p.x - p.size / 2 + dx, top: p.y - p.size / 2 + dy, width: p.size, height: p.size, opacity: t * .82, transform: `scale(${.6 + .4 * t}) rotate(${wob}deg)`}}>
              <Icon name={n} size={p.size} color={k % 2 ? accent : ink} stroke={1.6} />
            </div>);
        }
        // pop: ぽんっと出て、拍ごとに、跳ねて・膨らんで・傾く(拍のずれは、絵ごとにばらばら)
        const at = (0.4 + k * step) * 4 / beats, inT = (b - at) / (0.7 * 4 / beats);         // 出る時刻(b)と、出る途中の進み
        if (inT <= 0) return null;
        const appear = easeBack(inT), f = (((beat + p.off) % 1) + 1) % 1, hit = Math.exp(-7 * f), col = COLORS[p.col] || (k % 2 ? accent : ink);
        const hop = (20 + (p.size % 9)) * hit, sc = appear * (1 + .3 * hit), rot = p.sgn * (13 * hit) + 6 * Math.sin(b * 1.1 + k * 1.9) + (1 - cl(inT)) * p.sgn * 90;
        return (
          <div key={k} style={{position: 'absolute', left: p.x - p.size / 2 + 7 * Math.sin(b * 2 + k * 2.3), top: p.y - p.size / 2 - hop, width: p.size, height: p.size, opacity: cl(inT * 3) * .95,
            transform: `scale(${sc}) rotate(${rot}deg)`, filter: `drop-shadow(0 0 ${6 + 10 * hit}px ${col})`}}>
            <Icon name={n} size={p.size} color={col} stroke={2.3} />
          </div>);
      })}
    </>
  );
};
