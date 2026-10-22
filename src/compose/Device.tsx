import React from 'react';
import {Img, OffthreadVideo, staticFile} from 'remotion';
import {ChartData, STYLE, cl, eb, onAccent} from '../lib';
import {Eq, Note} from './music';

// 端末・グラフの絵(中身は、文字のない図形だけ。読めない偽の文字は出さない)。b: 経過(拍)
type P = {pick?: number[]; count?: number; seed?: number; data?: ChartData; kind: string; x: number; y: number; w: number; b: number; ink: string; accent: string};
const rows = (n: number, w: number, b: number, accent: string, ink: string, y0: number, gap: number, x0: number, checks = true) =>
  Array.from({length: n}, (_, k) => {
    const t = eb((b - 1.0 - k * .28) / .4), y = y0 + k * gap, ck = checks && b > 1.9 + k * .32;
    return <g key={k} opacity={cl(t * 2)} transform={`translate(0 ${(1 - t) * 24})`}>
      <rect x={x0} y={y} width={w} height={gap - 16} rx={14} fill={ink} opacity={.07} />
      <circle cx={x0 + 34} cy={y + (gap - 16) / 2} r={18} fill={accent} opacity={.85} />
      <rect x={x0 + 70} y={y + (gap - 16) / 2 - 11} width={w * .5} height={10} rx={5} fill={ink} opacity={.35} />
      <rect x={x0 + 70} y={y + (gap - 16) / 2 + 6} width={w * .32} height={8} rx={4} fill={ink} opacity={.18} />
      {ck && <g transform={`translate(${x0 + w - 36} ${y + (gap - 16) / 2}) scale(${eb((b - 1.9 - k * .32) / .25)})`}><circle r={15} fill="#2e9e5b" /><path d="M-7 1L-2 6L8 -5" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
    </g>;
  });

export const Device: React.FC<P> = ({kind, x, y, w, b, ink, accent, data, seed = 0, count, pick}) => {
  const idx = (k: number, len: number) => (pick?.length ? (pick[k % pick.length] - 1 + len * 8) % len : (seed + k) % len);       // 素材の指定(pick: 1から数える)があれば、それを使う
  const pop = eb((b - .35) / .6), sc = .88 + .12 * pop;
  const wrap = (h: number, children: React.ReactNode) => (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: cl(pop * 2)}}>
      <g transform={`translate(${x} ${y}) scale(${sc}) translate(${-x} ${-y})`}>{children}</g>
      <rect width={0} height={h} fill="none" />
    </svg>);
  if ((kind === 'pic' || kind === 'pics') && STYLE.lp?.photos?.length) {         // サイトの写真を、傾いたカードで見せる(1枚 / 3枚のコラージュ)
    const ps = STYLE.lp.photos, n = kind === 'pic' ? 1 : Math.min(3, ps.length);
    const card = (k: number, cx: number, cy: number, cw: number, rot: number, delay: number, z: number) => {
      const im = ps[idx(k, ps.length)], ch = Math.min(cw * im.h / im.w, cw * 1.25), t = eb((b - .4 - delay) / .6);
      return (
        <div key={k} style={{position: 'absolute', left: cx - cw / 2, top: cy - ch / 2, width: cw, height: ch, opacity: cl(t * 2), transform: `translate(${(1 - t) * 120}px, ${(1 - t) * 20}px) rotate(${rot * (.4 + .6 * t)}deg)`, zIndex: z}}>
          <div style={{position: 'absolute', left: 14, top: 20, width: cw, height: ch, borderRadius: 18, background: ink, opacity: .18}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: 18, border: `10px solid #fff`, boxShadow: `0 0 0 4px ${ink}`, overflow: 'hidden', boxSizing: 'border-box', background: '#fff'}}>
            <Img src={staticFile(im.file)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + .03 * cl((b - .6) / 3)})`}} />
          </div>
        </div>);
    };
    return n === 1 ? <>{card(0, x, y, w, -3, 0, 1)}</> : <>{card(0, x - w * .38, y + 40, w * .62, -7, .15, 1)}{card(2 % n, x + w * .38, y + 40, w * .62, 6, .3, 1)}{card(1, x, y - 20, w * .7, 0, 0, 2)}</>;
  }
  if ((kind === 'clip' || kind === 'clips') && STYLE.lp?.videos?.length) {        // LPの動画(サンプルの作品など)を、スマホ・画面の枠の中で再生する(音は出さない)
    const vs = STYLE.lp.videos, n = kind === 'clip' ? 1 : Math.min(3, vs.length);
    const frameOf = (k: number, cx: number, cy: number, fw: number, rot: number, delay: number, z: number) => {
      const v = vs[idx(k, vs.length)], vh = fw * v.h / v.w, t = eb((b - .4 - delay) / .6), landscape = v.w > v.h;
      return (
        <div key={k} style={{position: 'absolute', left: cx - fw / 2, top: cy - vh / 2 - 22, width: fw, height: vh + 44, opacity: cl(t * 2), transform: `translateY(${(1 - t) * 90}px) rotate(${rot * (.4 + .6 * t)}deg)`, zIndex: z}}>
          <div style={{position: 'absolute', left: 14, top: 22, width: fw, height: vh + 44, borderRadius: fw * .1, background: ink, opacity: .18}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: fw * .1, border: `${landscape ? 8 : 10}px solid ${ink}`, background: '#000', overflow: 'hidden', boxSizing: 'border-box'}}>
            <OffthreadVideo src={staticFile(v.file)} muted startFrom={Math.round(k * 20)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        </div>);
    };
    return kind === 'clip' ? <>{frameOf(0, x, y, w, 3, 0, 1)}</> : <>{frameOf(0, x - w * .62, y + 30, w * .78, -6, .15, 1)}{frameOf(2, x + w * .62, y + 30, w * .78, 6, .3, 1)}{frameOf(1, x, y - 10, w * .9, 0, 0, 2)}</>;
  }
  if (kind === 'shot' && (STYLE.lp?.pc || STYLE.lp?.photos?.length)) {     // LPのスクリーンショットを、傾いたカードで見せる
    const im = STYLE.lp.pc ?? STYLE.lp.photos![0], cw = w, ch = cw * im.h / im.w, cap = Math.min(ch, w * .8), t = eb((b - .5) / .7), x0 = x - cw / 2, y0 = y - cap / 2;
    return (
      <div style={{position: 'absolute', inset: 0, opacity: cl(t * 2), transform: `translate(${(1 - t) * 160}px, ${(1 - t) * 20}px) rotate(${-4 + 2 * (1 - t)}deg)`, transformOrigin: `${x}px ${y}px`}}>
        <div style={{position: 'absolute', left: x0 + 16, top: y0 + 22, width: cw, height: cap, borderRadius: 22, background: ink, opacity: .16}} />
        <div style={{position: 'absolute', left: x0, top: y0, width: cw, height: cap, borderRadius: 22, overflow: 'hidden', background: '#fff', border: `8px solid ${ink}`, boxSizing: 'border-box'}}>
          <Img src={staticFile(im.file)} style={{width: '100%', display: 'block', transform: `translateY(${-(ch - cap) * cl((b - 1.2) / 3)}px)`}} />
        </div>
      </div>);
  }
  if (kind === 'phone' && STYLE.lp?.phone) {       // スマホの画面に、LPのスマホ表示
    const im = STYLE.lp.phone, h = w * 1.95, x0 = x - w / 2, y0 = y - h / 2, sw = w - 28, sh = h - 90, ih = sw * im.h / im.w, pop = eb((b - .35) / .6);
    return (
      <div style={{position: 'absolute', inset: 0, opacity: cl(pop * 2), transform: `scale(${.88 + .12 * pop})`, transformOrigin: `${x}px ${y}px`}}>
        <div style={{position: 'absolute', left: x0 + 14, top: y0 + 22, width: w, height: h, borderRadius: w * .16, background: ink, opacity: .14}} />
        <div style={{position: 'absolute', left: x0, top: y0, width: w, height: h, borderRadius: w * .16, background: '#fff', border: `10px solid ${ink}`, boxSizing: 'border-box'}}>
          <div style={{position: 'absolute', left: 4, top: 56, width: sw, height: sh, overflow: 'hidden', borderRadius: 14}}>
            <Img src={staticFile(im.file)} style={{width: '100%', display: 'block', transform: `translateY(${-Math.max(0, ih - sh) * cl((b - 1.2) / 3.2)}px)`}} />
          </div>
          <div style={{position: 'absolute', left: w / 2 - w * .17 - 10, top: 16, width: w * .34, height: 14, borderRadius: 7, background: ink}} />
        </div>
      </div>);
  }
  if (kind === 'pc' && STYLE.lp?.pc) {             // PCの画面に、LPのPC表示
    const im = STYLE.lp.pc, h = w * .62, x0 = x - w / 2, y0 = y - h / 2 - 30, sw = w - 20, sh = h - 64, ih = sw * im.h / im.w, pop = eb((b - .35) / .6);
    return (
      <div style={{position: 'absolute', inset: 0, opacity: cl(pop * 2), transform: `scale(${.88 + .12 * pop})`, transformOrigin: `${x}px ${y}px`}}>
        <div style={{position: 'absolute', left: x0 + 14, top: y0 + 18, width: w, height: h, borderRadius: 18, background: ink, opacity: .14}} />
        <div style={{position: 'absolute', left: x0, top: y0, width: w, height: h, borderRadius: 18, background: '#fff', border: `10px solid ${ink}`, boxSizing: 'border-box', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: w - 20, height: 44, background: accent}} />
          <div style={{position: 'absolute', left: 0, top: 44, width: sw, height: sh - 44 + 10, overflow: 'hidden'}}>
            <Img src={staticFile(im.file)} style={{width: '100%', display: 'block', transform: `translateY(${-Math.max(0, ih - (sh - 34)) * cl((b - 1.2) / 3.2)}px)`}} />
          </div>
        </div>
        <div style={{position: 'absolute', left: x - w * .08, top: y0 + h, width: w * .16, height: 34, background: ink, opacity: .8}} />
        <div style={{position: 'absolute', left: x - w * .22, top: y0 + h + 30, width: w * .44, height: 14, borderRadius: 7, background: ink}} />
      </div>);
  }
  if (kind === 'phone') {
    const h = w * 1.95, x0 = x - w / 2, y0 = y - h / 2;
    return wrap(h, <>
      <rect x={x0 + 14} y={y0 + 22} width={w} height={h} rx={w * .16} fill={ink} opacity={.14} />
      <rect x={x0} y={y0} width={w} height={h} rx={w * .16} fill="#fff" stroke={ink} strokeWidth={10} />
      <rect x={x - w * .17} y={y0 + 16} width={w * .34} height={14} rx={7} fill={ink} />
      <rect x={x0 + 22} y={y0 + 56} width={w - 44} height={64} rx={16} fill={accent} />
      <g>{rows(5, w - 44, b, accent, ink, y0 + 140, (h - 190) / 5, x0 + 22)}</g>
    </>);
  }
  if (kind === 'pc') {
    const h = w * .62, x0 = x - w / 2, y0 = y - h / 2 - 30;
    return wrap(h, <>
      <rect x={x0 + 14} y={y0 + 18} width={w} height={h} rx={18} fill={ink} opacity={.14} />
      <rect x={x0} y={y0} width={w} height={h} rx={18} fill="#fff" stroke={ink} strokeWidth={10} />
      <rect x={x0} y={y0} width={w} height={54} rx={18} fill={accent} />
      {[0, 1, 2].map(k => <circle key={k} cx={x0 + 34 + k * 30} cy={y0 + 27} r={9} fill="#fff" opacity={.8} />)}
      <g>{rows(4, w - 60, b, accent, ink, y0 + 76, (h - 90) / 4, x0 + 30)}</g>
      <rect x={x - w * .08} y={y0 + h} width={w * .16} height={34} fill={ink} opacity={.8} />
      <rect x={x - w * .22} y={y0 + h + 30} width={w * .44} height={14} rx={7} fill={ink} />
    </>);
  }
  if (kind === 'bars' && data) {               // 数字の棒グラフ(値の大きさに比例。資料にある数字だけ)
    const items = data.items.slice(0, 4), mx = Math.max(...items.map(i => i.value)), h = w * .8, x0 = x - w / 2, y0 = y - h / 2 + 30, bw = Math.min(150, (w - 40) / items.length - 40);
    return wrap(h, <>
      <line x1={x0} y1={y0 + h} x2={x0 + w} y2={y0 + h} stroke={ink} strokeWidth={8} strokeLinecap="round" />
      {items.map((it, k) => { const t = eb((b - .8 - k * .25) / .7), bh = Math.max(.12, it.value / mx) * (h - 120) * t, cx = x0 + (k + .5) * w / items.length, top = k === items.indexOf(items.reduce((a, c) => ((data.unit === '円') ? c.value < a.value : c.value > a.value) ? c : a)) && items.length > 1;      // 金額は、いちばん安いものを強調。そのほかは、いちばん大きいもの
        return <g key={k}>
          <rect x={cx - bw / 2} y={y0 + h - 6 - bh} width={bw} height={bh} rx={14} fill={top ? accent : ink} opacity={top ? 1 : .25} />
          <text x={cx} y={y0 + h - 22 - bh} textAnchor="middle" fontSize={52} fontWeight={900} fill={ink} opacity={cl(t * 2)} style={{fontFamily: 'sans-serif'}}>{it.value.toLocaleString('ja-JP')}{data.unit ?? ''}</text>
          <text x={cx} y={y0 + h + 54} textAnchor="middle" fontSize={40} fontWeight={700} fill={ink} opacity={cl(t * 2)} style={{fontFamily: 'sans-serif'}}>{it.label}</text>
        </g>; })}
    </>);
  }
  if (kind === 'ring' && data) {               // 割合のリング(0〜100%)
    const v = Math.max(0, Math.min(100, data.items[0].value)), r = w * .36, t = eb((b - .8) / 1.4), C = 2 * Math.PI * r;
    return wrap(w, <>
      <circle cx={x} cy={y} r={r} fill="none" stroke={ink} strokeWidth={46} opacity={.12} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={accent} strokeWidth={46} strokeLinecap="round" strokeDasharray={`${C * v / 100 * t} ${C}`} transform={`rotate(-90 ${x} ${y})`} />
      <text x={x} y={y + 30} textAnchor="middle" fontSize={w * .2} fontWeight={900} fill={ink} style={{fontFamily: 'sans-serif'}}>{Math.round(v * t)}<tspan fontSize={w * .1}>{data.unit ?? '%'}</tspan></text>
      {data.items[0].label && <text x={x} y={y + r + 90} textAnchor="middle" fontSize={44} fontWeight={700} fill={ink} style={{fontFamily: 'sans-serif'}}>{data.items[0].label}</text>}
    </>);
  }
  if (kind === 'disc') {                       // 回るレコード盤と、漂う音符
    const r = w * .38, rot = b * 90, pop = eb((b - .3) / .6);
    return wrap(w, <>
      <g transform={`translate(${x} ${y}) scale(${.85 + .15 * pop}) translate(${-x} ${-y})`}>
        <circle cx={x + 14} cy={y + 18} r={r} fill={ink} opacity={.16} />
        <g transform={`rotate(${rot} ${x} ${y})`}>
          <circle cx={x} cy={y} r={r} fill={ink} />
          {[.92, .8, .68, .56].map((q, k) => <circle key={k} cx={x} cy={y} r={r * q} fill="none" stroke="#fff" strokeWidth={2.5} opacity={.14} />)}
          <path d={`M${x} ${y - r * .96}A${r * .96} ${r * .96} 0 0 1 ${x + r * .96} ${y}`} fill="none" stroke="#fff" strokeWidth={10} opacity={.12} strokeLinecap="round" />
          <circle cx={x} cy={y} r={r * .3} fill={accent} /><circle cx={x} cy={y} r={r * .05} fill="#fff" />
        </g>
        {[[.7, -.85, 0], [1.05, -.2, 1], [.95, .6, 2], [-.9, -.8, 1]].map(([dx, dy, v], k) => { const t = eb((b - .9 - k * .25) / .5); return <Note key={k} x={x + dx * r + 14 * Math.sin(b * 3 + k)} y={y + dy * r - 20 * Math.sin(b * 2 + k)} s={t * (36 + k * 4)} rot={12 * Math.sin(b * 2 + k)} col={accent} v={v as number} />; })}
      </g>
    </>);
  }
  if (kind === 'eq') {                         // 大きなイコライザ
    return wrap(w, <>
      <Eq x={x - w / 2} y={y + w * .3} w={w} h={w * .7} n={14} col={accent} gap={.3} b={eb((b - .3) / .6)} />
      <rect x={x - w / 2 - 10} y={y + w * .3 + 8} width={w + 20} height={12} rx={6} fill={ink} opacity={.5} />
    </>);
  }
  if (kind === 'code') {                       // コードエディタ。行が順に打たれていく
    const h = w * .72, x0 = x - w / 2, y0 = y - h / 2, cols = [accent, '#7dd3fc', '#fcd34d', '#a7f3d0', '#fda4af'];
    return wrap(h, <>
      <rect x={x0 + 14} y={y0 + 18} width={w} height={h} rx={20} fill={ink} opacity={.16} />
      <rect x={x0} y={y0} width={w} height={h} rx={20} fill="#0f172a" stroke={ink} strokeWidth={8} />
      <rect x={x0} y={y0} width={w} height={50} rx={20} fill="#1e293b" />
      {['#f87171', '#fbbf24', '#4ade80'].map((c, k) => <circle key={k} cx={x0 + 34 + k * 28} cy={y0 + 25} r={8} fill={c} />)}
      {Array.from({length: 8}, (_, k) => { const t = cl((b - .9 - k * .3) / .5), ind = [0, 1, 1, 2, 2, 1, 0, 0][k], lw = (.2 + ((k * 37) % 5) * .1) * (w - 140) * t;
        return <g key={k}><text x={x0 + 24} y={y0 + 96 + k * 44} fontSize={24} fill="#64748b" style={{fontFamily: 'monospace'}}>{k + 1}</text><rect x={x0 + 66 + ind * 36} y={y0 + 78 + k * 44} width={lw} height={16} rx={8} fill={cols[k % cols.length]} opacity={.9} />{ind === 0 && k < 7 && <rect x={x0 + 66 + ind * 36 + lw + 14} y={y0 + 78 + k * 44} width={lw * .3} height={16} rx={8} fill="#e2e8f0" opacity={.55 * t} />}</g>; })}
      <rect x={x0 + 66 + 36 + (w - 140) * .25} y={y0 + 74 + Math.min(7, Math.floor(Math.max(0, b - .9) / .3)) * 44} width={10} height={24} fill="#fff" opacity={Math.floor(b * 3) % 2 ? 1 : 0} />
    </>);
  }
  if (kind === 'jobmatch') {                   // 求職者のカードと、仕事のカードが、近づいてつながり、マッチ成立のチェックが付く
    const cw = w * .36, ch = w * .56, t = eb((b - .5) / .9), gap = w * (.4 - .17 * t), cy = y, ok = eb((b - 1.7) / .4);
    const card = (cx: number, job: boolean) => (
      <g>
        <rect x={cx - cw / 2 + 10} y={cy - ch / 2 + 16} width={cw} height={ch} rx={22} fill={ink} opacity={.16} />
        <rect x={cx - cw / 2} y={cy - ch / 2} width={cw} height={ch} rx={22} fill="#fff" stroke={ink} strokeWidth={9} />
        {job ? <g transform={`translate(${cx} ${cy - ch * .2})`}><rect x={-52} y={-28} width={104} height={74} rx={12} fill={accent} /><path d="M-24 -28V-44H24V-28" fill="none" stroke={ink} strokeWidth={9} strokeLinejoin="round" /><rect x={-52} y={4} width={104} height={8} fill="#fff" opacity={.6} /></g>
          : <g transform={`translate(${cx} ${cy - ch * .2})`}><circle cy={-18} r={36} fill={accent} /><path d="M-62 56Q-62 14 0 14Q62 14 62 56Z" fill={accent} /></g>}
        {[0, 1, 2].map(k => <rect key={k} x={cx - cw * .36} y={cy + ch * .14 + k * 30} width={cw * (.72 - k * .14)} height={12} rx={6} fill={ink} opacity={.28} />)}
        {!job && [0, 1, 2, 3, 4].map(k => <path key={k} transform={`translate(${cx - 62 + k * 31} ${cy + ch * .38}) scale(.9)`} d="M0 -12 L4 -4 L13 -3 L6 3 L8 12 L0 7 L-8 12 L-6 3 L-13 -3 L-4 -4Z" fill="#facc15" />)}
      </g>);
    return wrap(w, <>
      {card(x - gap, false)}{card(x + gap, true)}
      <line x1={x - gap + cw / 2 + 6} y1={cy} x2={x + gap - cw / 2 - 6} y2={cy} stroke={accent} strokeWidth={10} strokeDasharray="6 18" strokeLinecap="round" opacity={t} />
      <g transform={`translate(${x} ${cy}) scale(${ok})`}><circle r={56} fill="#2e9e5b" stroke="#fff" strokeWidth={9} /><path d="M-24 2L-7 20L26 -16" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
    </>);
  }
  if (kind === 'match') {                      // 2人が、つながる(ハートでつなぐ)
    const t = eb((b - .6) / .8), d = w * .3 * (1 - .55 * t), cy = y + 20;
    const person = (cx: number, col: string) => <g><circle cx={cx} cy={cy - 56} r={46} fill={col} /><path d={`M${cx - 92} ${cy + 110}Q${cx - 92} ${cy + 6} ${cx} ${cy + 6}Q${cx + 92} ${cy + 6} ${cx + 92} ${cy + 110}Z`} fill={col} /></g>;
    return wrap(w, <>
      <g transform={`translate(${x} ${cy}) scale(1.55) translate(${-x} ${-cy})`}>
      {person(x - d, ink)}{person(x + d, accent)}
      <path d={`M${x} ${cy - 160 - 30 * t}C${x - 70} ${cy - 220 - 30 * t} ${x - 100} ${cy - 150 - 30 * t} ${x} ${cy - 80 - 30 * t}C${x + 100} ${cy - 150 - 30 * t} ${x + 70} ${cy - 220 - 30 * t} ${x} ${cy - 160 - 30 * t}Z`} fill="#ef4467" opacity={t} transform={`translate(0 ${-0}) scale(1)`} />
      <line x1={x - d + 100} y1={cy + 40} x2={x + d - 100} y2={cy + 40} stroke={accent} strokeWidth={8} strokeDasharray="4 16" strokeLinecap="round" opacity={t} />
      </g>
    </>);
  }
  if (kind === 'house') {                      // 家の窓に、順に明かりがつく
    const hw = w * .8, hh = w * .55, x0 = x - hw / 2, y0 = y - hh / 2 + 70, pop = eb((b - .3) / .6);
    return wrap(w, <>
      <g transform={`translate(${x} ${y0 + hh}) scale(1 ${.8 + .2 * pop}) translate(${-x} ${-(y0 + hh)})`}>
        <rect x={x0 + 12} y={y0 + 16} width={hw} height={hh} fill={ink} opacity={.16} />
        <rect x={x0} y={y0} width={hw} height={hh} rx={6} fill="#fff" stroke={ink} strokeWidth={10} />
        <path d={`M${x0 - 40} ${y0 + 6}L${x} ${y0 - hh * .55}L${x0 + hw + 40} ${y0 + 6}Z`} fill={accent} stroke={ink} strokeWidth={10} strokeLinejoin="round" />
        <rect x={x - 46} y={y0 + hh - 150} width={92} height={150} rx={10} fill={ink} opacity={.85} />
        {[[x0 + 50, y0 + 50], [x0 + hw - 50 - 100, y0 + 50]].map(([wx, wy], k) => { const on = b > 1.2 + k * .6; return <rect key={k} x={wx} y={wy} width={100} height={90} rx={8} fill={on ? '#fde047' : '#e2e8f0'} stroke={ink} strokeWidth={6} />; })}
      </g>
    </>);
  }
  if (kind === 'bottle') {                     // 化粧品のボトルと、きらめき
    const bw = w * .3, bh = w * .8, x0 = x - bw / 2, y0 = y - bh / 2 + 20, pop = eb((b - .3) / .6);
    return wrap(w, <>
      <g transform={`translate(0 ${(1 - pop) * 60})`} opacity={cl(pop * 2)}>
        <rect x={x0 + 14} y={y0 + 20} width={bw} height={bh * .72} rx={bw * .22} fill={ink} opacity={.16} />
        <rect x={x0} y={y0 + bh * .22} width={bw} height={bh * .72} rx={bw * .22} fill="#fff" stroke={ink} strokeWidth={10} />
        <rect x={x0 + bw * .1} y={y0 + bh * .42} width={bw * .8} height={bh * .3} rx={12} fill={accent} opacity={.9} />
        <rect x={x - bw * .16} y={y0 + bh * .1} width={bw * .32} height={bh * .14} fill={ink} />
        <path d={`M${x - bw * .2} ${y0 + bh * .1}H${x + bw * .5}V${y0 - bh * .02}`} fill="none" stroke={ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {[[-.75, -.35], [.85, -.1], [.6, .45], [-.8, .35]].map(([dx, dy], k) => { const t = eb((b - 1.1 - k * .2) / .4) * (.85 + .15 * Math.sin(b * 5 + k)); return t > 0 ? <path key={k} transform={`translate(${x + dx * w * .4} ${y + dy * w * .55}) scale(${t * (4 + k)}) rotate(${b * 25 * (k % 2 ? 1 : -1)})`} d="M0 -12 Q1.5 -1.5 12 0 Q1.5 1.5 0 12 Q-1.5 1.5 -12 0 Q-1.5 -1.5 0 -12Z" fill={accent} /> : null; })}
    </>);
  }
  if (kind === 'mail') {                       // 封筒が開き、手紙が出て、既読のチェックが付く
    const ew = w, eh = w * .66, x0 = x - ew / 2, y0 = y - eh / 2 + 40, open = eb((b - .7) / .7), rise = eb((b - 1.3) / .7), ck = eb((b - 2.2) / .35);
    return wrap(eh, <>
      <rect x={x0 + 14} y={y0 + 18} width={ew} height={eh} rx={20} fill={ink} opacity={.14} />
      <g transform={`translate(0 ${-rise * eh * .42})`}>
        <rect x={x0 + ew * .12} y={y0 + 8} width={ew * .76} height={eh * .8} rx={12} fill="#fff" stroke={ink} strokeWidth={6} />
        {[0, 1, 2].map(k => <rect key={k} x={x0 + ew * .2} y={y0 + 40 + k * 30} width={ew * (.5 - k * .08)} height={10} rx={5} fill={ink} opacity={.3} />)}
      </g>
      <rect x={x0} y={y0 + eh * .18} width={ew} height={eh * .82} rx={20} fill={accent} />
      <path d={`M${x0} ${y0 + eh * .24}L${x} ${y0 + eh * .66}L${x0 + ew} ${y0 + eh * .24}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinejoin="round" opacity={.55} />
      <g transform={`translate(${x} ${y0 + eh * .18}) scale(1 ${1 - 2 * open})`}><path d={`M${-ew / 2} 0L0 ${eh * .5}L${ew / 2} 0Z`} fill={ink} opacity={.28} /></g>
      <g transform={`translate(${x0 + ew - 30} ${y0 + 20}) scale(${ck})`}><circle r={44} fill="#2e9e5b" stroke="#fff" strokeWidth={8} /><path d="M-18 2L-5 15L20 -14" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
    </>);
  }
  if (kind === 'shield') {                     // 盾に、チェックが描かれる
    const h = w * 1.1, x0 = x - w / 2, y0 = y - h / 2, pop = eb((b - .4) / .6);
    const d = `M${x} ${y0}C${x + w * .3} ${y0 + h * .1} ${x + w * .45} ${y0 + h * .12} ${x0 + w} ${y0 + h * .14}C${x0 + w} ${y0 + h * .62} ${x + w * .25} ${y0 + h * .9} ${x} ${y0 + h}C${x - w * .25} ${y0 + h * .9} ${x0} ${y0 + h * .62} ${x0} ${y0 + h * .14}C${x - w * .45} ${y0 + h * .12} ${x - w * .3} ${y0 + h * .1} ${x} ${y0}Z`;
    return wrap(h, <>
      <path d={d} transform="translate(14 18)" fill={ink} opacity={.14} />
      <path d={d} fill={accent} stroke={ink} strokeWidth={10} strokeLinejoin="round" transform={`translate(${x} ${y}) scale(${.9 + .1 * pop}) translate(${-x} ${-y})`} />
      <path d={`M${x - w * .22} ${y + h * .02}L${x - w * .05} ${y + h * .2}L${x + w * .26} ${y - h * .14}`} fill="none" stroke="#fff" strokeWidth={w * .09} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cl((b - 1.2) / .7)} />
    </>);
  }
  if (kind === 'people') {                     // 中心から、人へ届き、1人ずつ既読になる
    const n = 5, R = w * .36, cx = x, cy = y - 10;
    return wrap(w, <>
      {Array.from({length: n}, (_, k) => { const a = Math.PI * (1.15 + .7 * k / (n - 1)), px = cx + Math.cos(a) * R * 1.25, py = cy + Math.sin(a) * R * .95 + R * .55; const t = eb((b - .9 - k * .28) / .4), c = eb((b - 1.6 - k * .3) / .3);
        return <g key={k}>
          <line x1={cx} y1={cy - R * .5} x2={px} y2={py + 30} stroke={accent} strokeWidth={8} strokeLinecap="round" strokeDasharray="4 14" opacity={.7 * t} />
          <g transform={`translate(${px} ${py + 30}) scale(${t * 1.5})`}><circle cy={-26} r={26} fill={ink} opacity={.85} /><path d="M-44 44Q-44 4 0 4Q44 4 44 44Z" fill={ink} opacity={.85} />
            <g transform={`translate(30 -44) scale(${c})`}><circle r={19} fill="#2e9e5b" stroke="#fff" strokeWidth={5} /><path d="M-8 1L-2 7L9 -6" stroke="#fff" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g></g>
        </g>; })}
      <g transform={`translate(${cx} ${cy - R * .5}) scale(${eb((b - .4) / .5) * 1.6})`}><circle r={58} fill={accent} stroke="#fff" strokeWidth={8} /><path d="M-24 -4L0 -22L24 -4V22H-24Z" fill="#fff" opacity={.95} /></g>
    </>);
  }
  if (kind === 'clock') {                      // 時計の針が回る
    const r = w * .42, t = b * .9;
    return wrap(w, <>
      <circle cx={x + 14} cy={y + 18} r={r} fill={ink} opacity={.14} />
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={ink} strokeWidth={12} />
      {Array.from({length: 12}, (_, k) => { const a = k * Math.PI / 6; return <line key={k} x1={x + Math.cos(a) * r * .8} y1={y + Math.sin(a) * r * .8} x2={x + Math.cos(a) * r * (k % 3 ? .9 : .86)} y2={y + Math.sin(a) * r * (k % 3 ? .9 : .86)} stroke={ink} strokeWidth={k % 3 ? 5 : 9} strokeLinecap="round" />; })}
      <line x1={x} y1={y} x2={x + Math.cos(t * 6 - 1.57) * r * .72} y2={y + Math.sin(t * 6 - 1.57) * r * .72} stroke={accent} strokeWidth={9} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + Math.cos(t * .5 - 1.57) * r * .48} y2={y + Math.sin(t * .5 - 1.57) * r * .48} stroke={ink} strokeWidth={13} strokeLinecap="round" />
      <circle cx={x} cy={y} r={14} fill={accent} />
    </>);
  }
  if (kind === 'steps') {                      // 1・2・3… と、順番に進む。手順の数(count)は、場面の言葉から(「6ステップ」なら6つ)
    const n = Math.max(2, Math.min(6, count ?? 3)), gap = Math.min(w * .36, (w * .78) / (n - 1)), y0 = y - 10 - gap * (n - 1) / 2, r = n > 4 ? 32 : 44, rh = Math.min(80, gap - 16), fs = n > 4 ? 40 : 50;
    return wrap(w, <>
      <line x1={x - w * .3} y1={y0} x2={x - w * .3} y2={y0 + gap * (n - 1)} stroke={ink} strokeWidth={8} opacity={.2} strokeLinecap="round" />
      <line x1={x - w * .3} y1={y0} x2={x - w * .3} y2={y0 + gap * (n - 1) * cl((b - 1.2) / (1.6 + .25 * n))} stroke={accent} strokeWidth={8} strokeLinecap="round" />
      {Array.from({length: n}, (_, k) => { const t = eb((b - .6 - k * (n > 4 ? .3 : .5)) / .4), on = b > 1.2 + k * (n > 4 ? .5 : .8);
        return <g key={k} transform={`translate(0 ${(1 - t) * 20})`} opacity={cl(t * 2)}>
          <circle cx={x - w * .3} cy={y0 + k * gap} r={r} fill={on ? accent : '#fff'} stroke={ink} strokeWidth={7} />
          <text x={x - w * .3} y={y0 + k * gap + fs * .34} textAnchor="middle" fontSize={fs} fontWeight={900} fill={on ? onAccent(accent) : ink} style={{fontFamily: 'sans-serif'}}>{k + 1}</text>
          <rect x={x - w * .18} y={y0 + k * gap - rh / 2} width={w * .66} height={rh} rx={18} fill={ink} opacity={.07} />
          <rect x={x - w * .12} y={y0 + k * gap - rh * .2} width={w * (.4 - (k % 3) * .06)} height={Math.min(12, rh * .16)} rx={6} fill={ink} opacity={.35} />
          <rect x={x - w * .12} y={y0 + k * gap + rh * .12} width={w * (.28 - (k % 3) * .04)} height={Math.min(9, rh * .12)} rx={4} fill={ink} opacity={.18} />
        </g>; })}
    </>);
  }
  // chart: 右上がりの棒と線
  const h = w * .8, x0 = x - w / 2, y0 = y - h / 2, n = 6;
  return wrap(h, <>
    <line x1={x0} y1={y0 + h} x2={x0 + w} y2={y0 + h} stroke={ink} strokeWidth={8} strokeLinecap="round" />
    <line x1={x0} y1={y0} x2={x0} y2={y0 + h} stroke={ink} strokeWidth={8} strokeLinecap="round" />
    {Array.from({length: n}, (_, k) => { const t = eb((b - .8 - k * .18) / .5), bh = h * (.22 + .13 * k) * t; return <rect key={k} x={x0 + 30 + k * (w - 50) / n} y={y0 + h - 6 - bh} width={(w - 50) / n - 22} height={bh} rx={10} fill={k === n - 1 ? accent : ink} opacity={k === n - 1 ? 1 : .22} />; })}
    <polyline points={Array.from({length: n}, (_, k) => `${x0 + 30 + k * (w - 50) / n + ((w - 50) / n - 22) / 2},${y0 + h - 6 - h * (.22 + .13 * k) - 26}`).join(' ')} fill="none" stroke={accent} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cl((b - 1.8) / 1)} />
  </>);
};
