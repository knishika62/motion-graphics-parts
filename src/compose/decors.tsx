import React from 'react';
import {Arrow, cl, eb, eo, hash, onAccent} from '../lib';
import {Eq, Note} from './music';

export const DECOR_NAMES = ['none', 'underline', 'marker', 'circle', 'arrow', 'stamp', 'checks', 'brackets', 'confetti', 'sparkle', 'burst', 'tape', 'wavy', 'speech', 'cursor', 'ribbon', 'notes', 'equalizer'];
type Box = {x: number; y: number; w: number; h: number};

// 強調。marker は文字の後ろ(back)、それ以外は文字の前(front)
export const Decor: React.FC<{kind?: string; layer: 'back' | 'front'; box: Box; last: Box; stamp: {x: number; y: number}; b: number; ink: string; accent: string; ch: string}> = ({kind = 'none', layer, box, last, stamp, b, ink, accent, ch}) => {
  const e = eo((b - 1.9) / .7), cx = box.x + box.w / 2, cy = box.y + box.h / 2, baseY = Math.min(1000, box.y + box.h);
  if (layer === 'back') return kind === 'marker'
    ? <div style={{position: 'absolute', left: last.x - 20, top: last.y + last.h * .5, width: (last.w + 40) * e, height: last.h * .42, background: accent, opacity: .4, borderRadius: 12}} /> : null;     // 最後の行だけに、蛍光ペン
  switch (kind) {
    case 'underline': return <div style={{position: 'absolute', left: box.x, top: Math.min(1010, baseY + 20), width: box.w * e, height: 18, background: accent, borderRadius: 9}} />;
    case 'circle': return (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} fill="none" stroke={accent} strokeWidth={12} strokeLinecap="round">
        <ellipse cx={cx} cy={cy} rx={box.w / 2 + 70} ry={box.h / 2 + 60} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - e} transform={`rotate(-3 ${cx} ${cy})`} />
      </svg>);
    case 'arrow': return <Arrow p={[Math.max(70, box.x - 150), Math.min(1010, baseY + 160), box.x + 20, Math.min(1040, baseY + 230), box.x + 110, baseY + 24]} t={e} col={accent} />;
    case 'stamp': { const t = cl((b - 2.2) / .2), sc = 2.3 - 1.3 * eo(t), x = stamp.x, y = stamp.y;
      return <div style={{position: 'absolute', left: x - 75, top: y - 75, width: 150, height: 150, background: '#e8364f', color: '#fff', opacity: t > 0 ? 1 : 0, transform: `rotate(-12deg) scale(${sc})`, fontFamily: '"Hiragino Mincho ProN",serif', fontWeight: 700, fontSize: 104, lineHeight: '150px', textAlign: 'center'}}>{ch}</div>; }
    case 'checks': return (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 5}, (_, k) => { const t = eb((b - 2 - k * .15) / .35); if (t <= 0) return null;
          return <g key={k} transform={`translate(${cx + (k - 2) * 96} ${Math.max(70, box.y - 66)}) scale(${t})`}><circle r={34} fill={accent} /><path d="M-14 1L-4 11L16 -10" stroke={onAccent(accent)} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" /></g>; })}
      </svg>);
    case 'brackets': { const o = (1 - e) * 70, L = 90, x0 = box.x - 50 - o, y0 = box.y - 40 - o, x1 = box.x + box.w + 50 + o, y1 = box.y + box.h + 40 + o;
      return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} fill="none" stroke={accent} strokeWidth={14} strokeLinecap="round" opacity={e}>
        <path d={`M${x0} ${y0 + L}V${y0}H${x0 + L}M${x1 - L} ${y0}H${x1}V${y0 + L}M${x1} ${y1 - L}V${y1}H${x1 - L}M${x0 + L} ${y1}H${x0}V${y1 - L}`} /></svg>; }
    case 'sparkle': return (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} fill={accent}>
        {[[box.x - 30, box.y - 20, 1], [box.x + box.w + 20, box.y + box.h * .2, .7], [box.x + box.w * .55, box.y - 60, .5], [box.x + 10, box.y + box.h + 30, .6]].map(([x, y, s], k) => { const t = eb((b - 1.9 - k * .2) / .4) * (.85 + .15 * Math.sin(b * 5 + k * 2));
          return t > 0 ? <path key={k} transform={`translate(${x} ${y}) scale(${t * s * 5}) rotate(${b * 20 * (k % 2 ? 1 : -1)})`} d="M0 -12 Q1.5 -1.5 12 0 Q1.5 1.5 0 12 Q-1.5 1.5 -12 0 Q-1.5 -1.5 0 -12Z" /> : null; })}
      </svg>);
    case 'burst': { const t = eo((b - 1.8) / .5);
      return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} stroke={accent} strokeWidth={9} strokeLinecap="round" opacity={t * (1 - cl((b - 3.6) / .6))}>
        {Array.from({length: 14}, (_, k) => { const a = (k / 14) * Math.PI * 2, r0 = Math.max(box.w, box.h * 1.6) * .5 + 60 + 20 * t, r1 = r0 + 60 + 50 * t;
          return <line key={k} x1={cx + Math.cos(a) * r0 * 1.15} y1={cy + Math.sin(a) * r0 * .7} x2={cx + Math.cos(a) * r1 * 1.15} y2={cy + Math.sin(a) * r1 * .7} />; })}
      </svg>; }
    case 'notes': return (                                                                 // 音符が、文字のまわりに弾けて、ふわふわ漂う
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {[[box.x - 40, box.y + box.h * .1, 0], [box.x + box.w * .3, box.y - 60, 1], [box.x + box.w + 30, box.y + box.h * .2, 2], [box.x + box.w * .75, box.y + box.h + 50, 0], [box.x + 20, box.y + box.h + 40, 1], [box.x + box.w * .55, box.y - 90, 2]].map(([x, y, v], k) => { const t = eb((b - 1.8 - k * .12) / .4); return t > 0 ? <Note key={k} x={x} y={y - 10 * Math.sin(b * 3 + k)} s={34 * t + 6} rot={14 * Math.sin(b * 2 + k * 2)} col={accent} v={v as number} op={.9} /> : null; })}
      </svg>);
    case 'equalizer': { const t = eb((b - 1.8) / .5); return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}><Eq x={box.x} y={Math.min(1010, baseY + 70)} w={Math.min(box.w, 640)} h={64} n={16} col={accent} op={t} b={t} /></svg>; }
    case 'tape': { const t = eb((b - 1.6) / .4); return <div style={{position: 'absolute', left: box.x - 60, top: box.y - 50, width: 190, height: 56, background: accent, opacity: .75 * t, transform: `rotate(-14deg) scaleX(${t})`, borderRadius: 6, boxShadow: '0 4px 10px rgba(0,0,0,.15)'}} />; }
    case 'wavy': return (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} fill="none" stroke={accent} strokeWidth={12} strokeLinecap="round">
        <path d={Array.from({length: 41}, (_, i) => `${i ? 'L' : 'M'}${box.x + box.w * i / 40} ${Math.min(1020, baseY + 28) + 12 * Math.sin(i * 1.1)}`).join('')} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - e} />
      </svg>);
    case 'speech': { const x0 = box.x - 70, y0 = box.y - 50, w = box.w + 140, h = box.h + 100;
      return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} fill="none" stroke={accent} strokeWidth={12} strokeLinejoin="round" opacity={e}>
        <path d={`M${x0 + 40} ${y0}H${x0 + w - 40}Q${x0 + w} ${y0} ${x0 + w} ${y0 + 40}V${y0 + h - 40}Q${x0 + w} ${y0 + h} ${x0 + w - 40} ${y0 + h}H${x0 + 150}L${x0 + 80} ${y0 + h + 60}L${x0 + 90} ${y0 + h}H${x0 + 40}Q${x0} ${y0 + h} ${x0} ${y0 + h - 40}V${y0 + 40}Q${x0} ${y0} ${x0 + 40} ${y0}Z`} />
      </svg>; }
    case 'cursor': { const t = eo((b - 1.7) / .7), px = last.x + last.w + 30 - (1 - t) * 260, py = last.y + last.h * .6 + (1 - t) * 160, press = cl(1 - Math.abs(b - 2.55) / .12);
      return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <circle cx={px} cy={py} r={14 + 60 * (1 - press) * (b > 2.5 ? 1 : 0)} fill="none" stroke={accent} strokeWidth={8} opacity={b > 2.5 ? cl(1 - (b - 2.5) / .6) : 0} />
        <path transform={`translate(${px} ${py}) scale(${1 - .12 * press})`} d="M0 0L0 70L19 53L32 84L46 78L33 48L58 48Z" fill="#fff" stroke="#111" strokeWidth={6} strokeLinejoin="round" />
      </svg>; }
    case 'ribbon': { const t = eb((b - 1.5) / .5); return <div style={{position: 'absolute', right: -90, top: 70, width: 420, height: 64, background: accent, color: '#fff', transform: `rotate(35deg) translateX(${(1 - t) * 300}px)`, opacity: t > 0 ? 1 : 0, boxShadow: '0 6px 14px rgba(0,0,0,.2)'}} />; }
    case 'confetti': { const t = Math.max(0, b - 1.9);
      return <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}} opacity={1 - cl((b - 3.4) / .5)}>
        {Array.from({length: 40}, (_, i) => { const a = hash(i * 1.7) * Math.PI * 2, d = 140 + 520 * hash(i * 2.3), s = eo(t / .9), x = cx + Math.cos(a) * d * s, y = cy + Math.sin(a) * d * s * .8 + 300 * t * t * .4;
          return <rect key={i} x={x} y={y} width={16} height={26} fill={i % 2 ? accent : ink} opacity={t > 0 ? .9 : 0} transform={`rotate(${hash(i) * 360 + t * 200} ${x} ${y})`} />; })}
      </svg>; }
    default: return null;
  }
};
