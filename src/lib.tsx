import {Eq, Note} from './compose/shapes';
import React, {createContext, useContext, useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {SRC} from './sources';

export const W = 1920, H = 1080, TAU = Math.PI * 2;

// ===== 小道具(イージングなど) =====
export const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ss = (x: number, a: number, b: number) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const eio = (x: number) => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eb = (x: number) => { x = cl(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mulberry = (a: number) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ===== 場面の時間: 場面の長さ(フレーム)を4単位に割って b とする =====
export const SceneCtx = createContext({frames: 420, beats: 7, accent: '#ff3d6e'});
export const useB = () => { const f = useCurrentFrame(); const {frames} = useContext(SceneCtx); return f / (frames / 4); };
const EARLY = new Set(['rise', 'zoom', 'wipe', 'notes', 'beat']);                         // 粒が集まる演出(code/letters/dots)では、組み上がったあとに文字が出る。それ以外は、最初から出る
export const useK = () => { const b = useB(); return EARLY.has(STYLE.opener) ? ss(b, .15, .7) : ss(b, 1.25, 1.6); };   // 文字が出てくる度合い
// 落ち着き度: 文字が出そろって読める時期から、細かい揺れ(アイドルの動き)を止める。1=揺れる、0=止まる。入場の動きは、出そろう前なので、そのまま。
// 理由: 出そろったあとも、文字が細かく揺れ続けると、読みづらい(ユーザー指摘)
export const calmOf = (b: number) => { const s0 = EARLY.has(STYLE.opener) ? .95 : 1.9; return 1 - ss(b, s0, s0 + .25); };      // 入場の動き(せり上がり・出現)が終わったら、すぐに止める。遅いと、出てから1秒以上、文字が細かく揺れて見える
export const usePulse = () => { const b = useB(); const {beats} = useContext(SceneCtx); return STYLE.amp * calmOf(b) * Math.exp(-6 * ((b * beats / 4) % 1)); };  // 1拍ごとに弾む

// ===== お題ごとの雰囲気(scenario.json の style。無ければ、標準のpop) =====
//  amp: 動きの強さ(弾み・揺れの倍率) / palette: 場面ごとの配色 / transitions: 場面転換の形の並び / fonts: 書体の上書き
export type LogoInfo = {main: string; w: number; h: number; company?: {file: string; w: number; h: number}};
export type LpImg = {file: string; w: number; h: number};
export type LpVideo = LpImg & {dur: number};
export type LpInfo = {pc?: LpImg; phone?: LpImg; photos?: LpImg[]; videos?: LpVideo[]};
export type Style = {bundledFonts?: boolean; lp?: LpInfo; logo?: LogoInfo; opener?: string; amp?: number; palette?: {bg: string; ink: string; accent: string}[]; transitions?: number[]; fonts?: Partial<Record<'g' | 'm' | 'r' | 'k', {w?: number; fam?: string}>>};
export const STYLE: {lp: LpInfo | null; logo: LogoInfo | null; opener: string; amp: number; palette: {bg: string; ink: string; accent: string}[] | null; transitions: number[]} = {lp: null, logo: null, opener: 'code', amp: 1, palette: null, transitions: [1, 2, 3, 4, 5, 6, 7, 8]};
export const CALM = {v: 1};                                             // いまの場面の落ち着き度(Stage が、描画のたびに更新する)
export const amp = (v: number) => v * STYLE.amp * CALM.v;
// 強調色の上に載せる文字・絵の色。強調色が明るい(蛍光色など)ときは、黒に近い色にして、読めるようにする
const lumOf = (hex: string) => { const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => (x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const ratio = (a: string, b: string) => { const [x, y] = [lumOf(a), lumOf(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
// 強調色の上に載せる文字色: 白を基本に、白のコントラスト比が3未満(読みにくい)のときだけ、白より比の高い黒に切り替える
export const onAccent = (hex: string) => (/^#[0-9a-fA-F]{6}$/.test(hex) && ratio(hex, '#ffffff') < 3 && ratio(hex, '#111111') > ratio(hex, '#ffffff') ? '#111111' : '#ffffff');                       // 揺れ・弾みの大きさに掛ける
export const isLight = (hex: string) => { const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2] > .5; };   // 文字色が明るいか(縁取り・ブロックの色を切り替えるため)
// ===== 書体 =====
export type Fk = 'g' | 'm' | 'r' | 'k';
const FONTS: Record<Fk, {w: number; fam: string}> = {
  g: {w: 900, fam: '"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif'},
  m: {w: 700, fam: '"Hiragino Mincho ProN","Yu Mincho",serif'},
  r: {w: 700, fam: '"Hiragino Maru Gothic ProN",sans-serif'},
  k: {w: 700, fam: 'Menlo,monospace'},
};
const MONO = 'Menlo,monospace';
// 同梱の書体(public/fonts/。scripts/fonts.mjs が取得する)。無ければ読み込みに失敗するだけで、ほかの書体で描かれる。
// 文字の幅の計測にも書体を使うので、読み込みが終わるまで描画を待つ。
const FACES: [string, string, string][] = [['Noto Sans JP', 'fonts/NotoSansJP.ttf', '100 900'], ['Noto Serif JP', 'fonts/NotoSerifJP.ttf', '200 900'], ['Zen Maru Gothic', 'fonts/ZenMaruGothic-Bold.ttf', '700'], ['Zen Maru Gothic', 'fonts/ZenMaruGothic-Black.ttf', '900']];
if (typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
  const h = delayRender('fonts', {timeoutInMilliseconds: 60000});
  Promise.all(FACES.map(([fam, file, w]) => new FontFace(fam, `url(${staticFile(file)})`, {weight: w}).load().then(f => { document.fonts.add(f); }).catch(() => undefined))).finally(() => continueRender(h));
}
const BUNDLED: Record<Fk, string> = {g: '"Noto Sans JP"', m: '"Noto Serif JP"', r: '"Zen Maru Gothic"', k: ''};
// 指定の書体の後ろ(bundledFonts のときは前)に、同梱の書体を足す。Macのヒラギノが無い環境でも、同じ見た目に近づく
const withBundled = (k: Fk, fam: string, first: boolean) => { const b = BUNDLED[k]; if (!b || fam.includes(b)) return fam; const m = fam.match(/^(.*?),?\s*(sans-serif|serif|monospace)$/); const [head, gen] = m ? [m[1], m[2]] : [fam, 'sans-serif']; return first ? `${b},${head},${gen}` : `${head},${b},${gen}`; };
export function setStyle(st?: Style) {                                  // 描画の前に1回だけ呼ぶ(書体は文字の幅の計測にも使われるため)
  if (!st) return;
  STYLE.lp = st.lp ?? null; STYLE.logo = st.logo ?? null; STYLE.opener = st.opener ?? 'code'; STYLE.amp = st.amp ?? 1; STYLE.palette = st.palette ?? null; STYLE.transitions = st.transitions?.length ? st.transitions : STYLE.transitions;
  for (const k of ['g', 'm', 'r', 'k'] as const) { const f = st.fonts?.[k]; if (f) FONTS[k] = {w: f.w ?? FONTS[k].w, fam: f.fam ?? FONTS[k].fam}; FONTS[k].fam = withBundled(k, FONTS[k].fam, !!st.bundledFonts); }
}
export const fontStyle = (k: Fk): React.CSSProperties => ({fontFamily: FONTS[k].fam, fontWeight: FONTS[k].w});

// ===== 文字レイアウト(DOMの文字と、粒子の目標点の両方に使う) =====
export type G = {ch: string; f: Fk; size: number; x: number; y: number; rot?: number; col?: string};
let mc: CanvasRenderingContext2D | null = null;
const mctx = () => (mc ??= document.createElement('canvas').getContext('2d')!);
const measure = (ch: string, f: Fk, size: number) => { const c = mctx(); c.font = `${FONTS[f].w} ${size}px ${FONTS[f].fam}`; return c.measureText(ch).width; };
export function row(text: string, cx: number, cy: number, size: number, fonts: string, o: {left?: boolean; col?: string} = {}): G[] {
  const ch = [...text], ws = ch.map((s, i) => measure(s, fonts[i % fonts.length] as Fk, size)), tot = ws.reduce((a, b) => a + b, 0);
  let x = o.left ? cx : cx - tot / 2;
  return ch.map((s, i) => { const g: G = {ch: s, f: fonts[i % fonts.length] as Fk, size, x: x + ws[i] / 2, y: cy, col: o.col}; x += ws[i]; return g; });
}
export function colv(text: string, cx: number, cy: number, size: number, fonts: string): G[] {
  const ch = [...text], step = size * 1.06, y0 = cy - ch.length * step / 2;
  return ch.map((s, i) => { const p = '、。'.includes(s); return {ch: s, f: fonts[i % fonts.length] as Fk, size, x: cx + (p ? size * .5 : 0), y: y0 + (i + .5) * step - (p ? size * .45 : 0), rot: s === 'ー' ? Math.PI / 2 : 0}; });
}

// 長さに合わせて文字の大きさを自動で収める(シナリオの言葉が変わっても、はみ出さない)
const widthAt = (text: string, fonts: string) => [...text].reduce((w, ch, i) => w + measure(ch, fonts[i % fonts.length] as Fk, 100), 0);
export function fitRow(text: string, cx: number, cy: number, maxW: number, maxSize: number, fonts: string, o: {left?: boolean; col?: string} = {}): G[] {
  return row(text, cx, cy, Math.max(24, Math.min(maxSize, Math.floor(100 * maxW / Math.max(1, widthAt(text, fonts))))), fonts, o);
}
export function fitCol(text: string, cx: number, cy: number, maxH: number, maxSize: number, fonts: string): G[] {
  return colv(text, cx, cy, Math.max(24, Math.min(maxSize, Math.floor(maxH / (Math.max(1, [...text].length) * 1.06)))), fonts);
}
export const endX = (G: G[]) => G.reduce((m, g) => Math.max(m, g.x + g.size / 2), 0);

// 場面の部品が受け取るもの(scenario.json の1場面 + 自動で割り当てる色)
export type ChartData = {items: {label: string; value: number}[]; unit?: string};
export type Layers = {iconsAvoid?: number[][]; iconsStyle?: string; tilt?: number; scale?: number; shift?: [number, number]; valign?: string; pick?: number[]; count?: number; data?: ChartData; bg?: string; layout?: string; motion?: string; decor?: string; icon?: string | null; icons?: string[]; pmotion?: string};
export type SceneProps = {layers?: Layers; lines: string[]; caption?: string; aside?: string; title?: string[]; bg: string; ink: string; accent: string; seed: number; fs?: number};
// fs: 文字の大きさの倍率(1が標準)。画像確認ではみ出し・重なりが見つかった場面を、自動で小さくするために使う
export const makeFit = (fs = 1) => ({
  fitRow: (t: string, cx: number, cy: number, maxW: number, maxSize: number, fonts: string, o: {left?: boolean; col?: string} = {}) => fitRow(t, cx, cy, maxW * fs, maxSize * fs, fonts, o),
  fitCol: (t: string, cx: number, cy: number, maxH: number, maxSize: number, fonts: string) => fitCol(t, cx, cy, maxH * fs, maxSize * fs, fonts),
});
export const PALETTES = [
  {bg: '#FFE45E', ink: '#1b1b1b', accent: '#ff3d6e'}, {bg: '#7CF2C8', ink: '#0b3d2e', accent: '#ff5a36'}, {bg: '#8EDBFF', ink: '#08324f', accent: '#ff4f8b'},
  {bg: '#FF9D8F', ink: '#5a1a12', accent: '#ffd23f'}, {bg: '#C9B6FF', ink: '#3a1aa0', accent: '#ff5ca8'}, {bg: '#B6F36B', ink: '#12331a', accent: '#ff7ab8'},
  {bg: '#FFB347', ink: '#3a1500', accent: '#1fa36b'}, {bg: '#5EE6D3', ink: '#0f3d3a', accent: '#ff3d6e'}, {bg: '#FFF1D6', ink: '#1b1b1b', accent: '#ff5a4f'},
];

// ===== 文字を描く(1文字ずつ動かせる) =====
export type O = {dx?: number; dy?: number; s?: number; sx?: number; sy?: number; r?: number; a?: number; col?: string; f?: Fk;
  z?: number; zc?: string; ex?: number; ey?: number; st?: string; sw?: number; sl?: number; ph?: number};
export const Text: React.FC<{G: G[]; K?: number; ink?: string; fn?: (g: G, i: number) => O | undefined}> = ({G, K = 1, ink, fn}) => (
  <>{G.map((g, i) => {
    const o = fn?.(g, i) ?? {}, a = K * (o.a ?? 1); if (a < .004) return null;
    const s = o.s ?? 1, fk = o.f ?? g.f, ft = FONTS[fk];
    const slices = o.sl ? 10 : 1;
    return Array.from({length: slices}, (_, k) => {
      const css: React.CSSProperties = {
        position: 'absolute', left: g.x, top: g.y, fontFamily: ft.fam, fontWeight: ft.w, fontSize: g.size, lineHeight: 1, whiteSpace: 'nowrap',
        opacity: a, color: o.col ?? g.col ?? ink ?? '#000',
        transform: `translate(-50%,-50%) translate(${(o.dx ?? 0) + (o.sl ? o.sl * Math.sin(k * 2.1 + (o.ph ?? 0)) : 0)}px,${o.dy ?? 0}px) rotate(${(g.rot ?? 0) + (o.r ?? 0)}rad) scale(${s * (o.sx ?? 1)},${s * (o.sy ?? 1)})`,
      };
      if (o.sl) css.clipPath = `inset(${k * 10}% -50% ${(9 - k) * 10}% -50%)`;
      if (o.st) { css.WebkitTextStroke = `${o.sw ?? 14}px ${o.st}`; css.paintOrder = 'stroke fill'; }
      if (o.z) css.textShadow = Array.from({length: Math.floor(o.z / 2)}, (_, j) => `${(o.ex ?? 0) * (j + 1) * 2}px ${(o.ey ?? 0) * (j + 1) * 2}px 0 ${o.zc}`).join(',');
      return <span key={`${i}-${k}`} style={css}>{g.ch}</span>;
    });
  })}</>
);

// 1文字ずつ弾けて出る小さなテロップ
// ロゴ(製品・会社)。どの背景色の上でも見えるよう、白い角丸の台に載せる
export const LogoPill: React.FC<{file: string; w: number; h: number; height: number}> = ({file, w, h, height}) => (
  <div style={{display: 'inline-flex', background: 'rgba(255,255,255,.95)', borderRadius: height * .3, padding: height * .2, boxShadow: '0 6px 24px rgba(0,0,0,.14)'}}>
    <Img src={staticFile(file)} style={{height, width: w && h ? height * w / h : 'auto'}} />
  </div>
);
export const Sub: React.FC<{text: string; cx: number; cy: number; size: number; t0: number; col?: string; stk?: string}> = ({text, cx, cy, size, t0, col = '#1b1b1b', stk: stk0}) => {
  const stk = stk0 ?? (col.startsWith('#') && isLight(col) ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.9)');   // 縁取りは、文字の明暗の逆
  const b = useB(), G = useMemo(() => row(text, cx, cy, size, 'g'), [text, cx, cy, size]);
  const step = Math.min(.07, Math.max(.02, (3.6 - t0 - .3) / Math.max(1, G.length)));   // 長いテロップは、場面の終盤までに打ち終わるよう、1文字あたりの間隔を縮める
  return <Text G={G} fn={(g, i) => { const t = eb((b - t0 - i * step) / .3); return {a: t > 0 ? 1 : 0, s: t, dy: (1 - t) * 30, col, st: stk, sw: size * .2}; }} />;
};

export const Arrow: React.FC<{p: number[]; t: number; col: string}> = ({p, t, col}) => {
  const [x0, y0, qx, qy, x1, y1] = p;
  const pt = (u: number) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * qx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * qy + u * u * y1];
  if (t <= 0) return null;
  const [ax, ay] = pt(t), [bx, by] = pt(Math.max(0, t - .04)), an = Math.atan2(ay - by, ax - bx), h = 80 * ss(t, .6, 1);
  const d = Array.from({length: 41}, (_, k) => { const [x, y] = pt(k / 40 * t); return `${k ? 'L' : 'M'}${x} ${y}`; }).join(' ');
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}} fill="none" stroke={col} strokeWidth={24} strokeLinecap="round">
      <path d={d} />
      {t > .6 && <path d={`M${ax} ${ay}L${ax - h * Math.cos(an - .5)} ${ay - h * Math.sin(an - .5)}M${ax} ${ay}L${ax - h * Math.cos(an + .5)} ${ay - h * Math.sin(an + .5)}`} />}
    </svg>
  );
};

// ===== コードが形に組み上がる粒子 =====
type P = {ch: string; sx: number; sy: number; tx: number | null; ty: number; d: number; d2: number; cv: number; rot: number};
function buildParticles(code: string, G: G[], seed: number, mode: string): P[] {
  const c = mctx(); c.clearRect(0, 0, W, H); c.save(); c.canvas.width = W; c.canvas.height = H;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
  for (const g of G) { c.save(); c.translate(g.x, g.y); c.rotate(g.rot ?? 0); c.font = `${FONTS[g.f].w} ${g.size}px ${FONTS[g.f].fam}`; c.fillText(g.ch, 0, 0); c.restore(); }
  const d = c.getImageData(0, 0, W, H).data, pts: number[][] = [];
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  c.restore();
  const rng = mulberry(seed * 977 + 5), all: P[] = [];
  if (mode === 'code') {                                     // ソースコードの文字を、3列に敷き詰める
    const lines = code.replace(/\t/g, '  ').split('\n').map(l => l.slice(0, 50));
    c.font = `19px ${MONO}`; const cw = c.measureText('M').width;
    for (let col = 0; col < 3; col++) for (let r = 0; r < 43; r++) {
      const ln = lines[(r + col * 7) % lines.length];
      for (let k = 0; k < ln.length; k++) if (ln[k] !== ' ') all.push({ch: ln[k], sx: 40 + col * 620 + k * cw, sy: 34 + r * 25, tx: null, ty: 0, d: 0, d2: 0, cv: 0, rot: 0});
    }
  } else {                                                   // letters: 場面の言葉の文字 / dots: 色の粒。画面のあちこちから集まる
    const chars = G.map(g => g.ch).filter(ch => ch.trim()), n = mode === 'dots' ? 1800 : 1000;
    for (let i = 0; i < n; i++) all.push({ch: chars[i % Math.max(1, chars.length)] ?? '・', sx: rng() * W, sy: rng() * H, tx: null, ty: 0, d: 0, d2: 0, cv: 0, rot: 0});
  }
  const shuf = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const N = Math.min(all.length, pts.length, 2600); shuf(all); shuf(pts);
  const key = (x: number, y: number) => Math.floor(x / 70) * 2000 + y;
  const sel = all.slice(0, N).sort((a, b) => key(a.sx, a.sy) - key(b.sx, b.sy)), tgt = pts.slice(0, N).sort((a, b) => key(a[0], a[1]) - key(b[0], b[1]));
  sel.forEach((p, i) => { p.tx = tgt[i][0]; p.ty = tgt[i][1]; p.d = i / N; p.cv = (rng() - .5) * 240; p.rot = (rng() - .5) * 6; });
  all.slice(N).forEach(p => { p.d2 = rng(); p.cv = (rng() - .5) * 240; p.rot = (rng() - .5) * 6; });
  return all;
}
const CodeAssemble: React.FC<{code: string; G: G[]; ink: string; seed: number; mode: string}> = ({code, G, ink, seed, mode}) => {
  const b = useB(), ref = useRef<HTMLCanvasElement>(null), {accent} = useContext(SceneCtx);
  const P = useMemo(() => buildParticles(code, G, seed, mode), [code, G, seed, mode]);
  useLayoutEffect(() => {
    const c = ref.current!.getContext('2d')!; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    const fade = 1 - ss(b, 1.25, 1.6); if (fade <= 0 || b > 1.7) return;
    c.font = mode === 'letters' ? `${FONTS.m.w} 30px ${FONTS.m.fam}` : `19px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = ink;
    let pi = 0;
    for (const p of P) {
      let x, y, a, s, r;
      if (p.tx == null) { const u = cl((b - .2 - p.d2 * .3) / .6); x = p.sx + u * p.cv * .3; y = p.sy - b * 20 + u * u * 260; a = .55 * (1 - u); s = 1; r = u * p.rot * .3; }
      else { const u = cl((b - .3 - p.d * .4) / .6), e = eio(u);
        x = lerp(p.sx, p.tx, e) + Math.sin(Math.PI * u) * p.cv; y = lerp(p.sy - b * 20, p.ty, e) - Math.sin(Math.PI * u) * p.cv * .5;
        a = .55 + .45 * e; s = lerp(1, .8, e) + (u >= 1 ? .1 * Math.sin(b * 18 + p.rot * 7) : 0); r = Math.sin(Math.PI * u) * p.rot; }
      if (a * fade < .01) continue;
      c.globalAlpha = a * fade; const co = Math.cos(r) * s, si = Math.sin(r) * s; c.setTransform(co, si, -si, co, x, y);
      if (mode === 'dots') { c.fillStyle = pi++ % 3 === 0 ? accent : ink; c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); c.fill(); } else c.fillText(p.ch, 0, 0);
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
  });
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />;
};

// ===== 場面の台紙: 背景 + 中身 + 冒頭の演出 =====
// 冒頭の演出「notes」: 音符が、文字の位置へ飛んできて、弾けて消える(文字は、最初から見える)
const NoteFlight: React.FC<{G: G[]; accent: string; ink: string}> = ({G, accent, ink}) => {
  const b = useB(); if (b > 1.3) return null;
  const step = Math.max(1, Math.ceil(G.length / 40)), T = G.filter((_, i) => i % step === 0);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {T.map((g, i) => {
        const a = hash(i * 7.13) * TAU, sx = 960 + Math.cos(a) * 1100, sy = 540 + Math.sin(a) * 700, t0 = .0 + .55 * i / T.length, u = cl((b - t0) / .5), e = eio(u);
        if (b < t0) return null;
        const x = lerp(sx, g.x, e), y = lerp(sy, g.y, e) - Math.sin(Math.PI * u) * 90, done = b - t0 - .5;
        return <g key={i}>
          {u < 1 && <Note x={x} y={y} s={26 + 18 * hash(i * 3.7)} rot={(1 - u) * 50} col={i % 3 ? accent : ink} v={i % 3} op={.95} />}
          {done > 0 && done < .3 && <circle cx={g.x} cy={g.y} r={20 + 120 * done / .3} fill="none" stroke={accent} strokeWidth={6 * (1 - done / .3)} opacity={1 - done / .3} />}
        </g>;
      })}
    </svg>);
};
// 冒頭の演出「beat」: 拍に合わせて、場面全体がぽんと膨らみ、下からイコライザが立ち上がって消える
const BeatEq: React.FC<{accent: string}> = ({accent}) => {
  const b = useB(), f = useCurrentFrame(); if (b > 1.6) return null;
  const k = 1 - ss(b, 1.0, 1.6);
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}><Eq x={0} y={H} w={W} h={H * .42 * k} n={48} col={accent} op={.28 * k} gap={.4} frame={f} b={1} /></svg>;
};
export const Stage: React.FC<{bg: string; ink: string; src: keyof typeof SRC; G: G[]; seed: number; children?: React.ReactNode}> = ({bg, ink, src, G, seed, children}) => {
  const b = useB(), f0 = useCurrentFrame(), {accent} = useContext(SceneCtx), op = STYLE.opener;
  const glyphs = useMemo(() => G.map(g => ({...g, col: g.col ?? ink})), [G, ink]);
  CALM.v = calmOf(b);                                                  // 子の描画より前に、更新する
  const e = eo(cl((b - .1) / .9)), zs = EARLY.has(op) ? .7 : 1.6;     // ゆっくり拡大する動きの開始: 最初から文字が出る演出では、早く始める(止まって見える時間をなくす)
  // 冒頭の演出: code / letters / dots は粒が集まる(下のCodeAssemble)。rise / zoom / wipe は、場面全体の現れ方
  const intro: React.CSSProperties = op === 'rise' ? {transform: `translateY(${(1 - e) * 70}px)`, opacity: e}
    : op === 'zoom' ? {transform: `scale(${1.25 - .25 * e})`, opacity: e, filter: `blur(${(1 - e) * 10}px)`}
    : op === 'wipe' ? {clipPath: `inset(0 ${(1 - e) * 100}% 0 0)`}
    : op === 'beat' ? {transform: `scale(${1 + .07 * Math.exp(-((f0 / 60 * 2) % 1) * 6) * (1 - ss(b, 1.0, 1.6))})`, opacity: ss(b, .05, .3)} : {};
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={intro}>
        {/* 文字が出そろうまでは、ごくゆっくり拡大する。出そろったら、拡大も止める(拡大が続くと、文字の輪郭が毎コマ変わって、細かく揺れて見え、読みづらい) */}
        <AbsoluteFill style={{transform: `scale(${1 + (.02 + .015 * STYLE.amp) * cl((Math.min(b, EARLY.has(op) ? 1.0 : 2.0) - zs) / (4 - zs))})`}}>{children}</AbsoluteFill>
      </AbsoluteFill>
      {STYLE.logo && src !== 'finale' && <div style={{position: 'absolute', left: 48, top: 40, opacity: ss(b, .3, .9)}}><LogoPill file={STYLE.logo.main} w={STYLE.logo.w} h={STYLE.logo.h} height={52} /></div>}
      {op === 'notes' && <NoteFlight G={glyphs} accent={accent} ink={ink} />}
      {op === 'beat' && <BeatEq accent={accent} />}
      {op === 'wipe' && e < 1 && <div style={{position: 'absolute', left: e * W - 28, top: 0, width: 28, height: H, background: accent}} />}
      {(op === 'code' || op === 'letters' || op === 'dots') && <CodeAssemble code={SRC[src]} G={glyphs} ink={ink} seed={seed} mode={op} />}
    </AbsoluteFill>
  );
};
