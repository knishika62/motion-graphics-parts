import React from 'react';
import {Img, OffthreadVideo, staticFile} from 'remotion';
import {H, STYLE, W, cl, eo, useB} from '../lib';
import {Eq, Note, useBeat} from './music';

export const BG_KINDS = ['plain', 'dots', 'stripes', 'grid', 'blobs', 'rays', 'waves', 'checker', 'gradient', 'hex', 'rings', 'zigzag', 'plus', 'stars', 'bubbles', 'circuit', 'lines', 'spotlight', 'sunburst', 'dotwave', 'photo', 'photofull', 'videofull', 'video', 'notes', 'equalizer', 'soundwave', 'disco'];

// 写真・動画を大きく敷く場面(photofull / videofull)の、素材そのものの動き(layers.pmotion)。b は 0〜4(場面の長さ)
// 場面ごとに変えて、同じ寄せ方が続かないようにする。文字が読めるよう、倍率は控えめ(1.0〜1.24倍)に留める
const pTrans = (kind: string, b: number, hit: number) => {
  const k = cl(b / 4), back = eo(cl(b / 1.2));
  switch (kind) {
    case 'zoomout': return `scale(${1.15 - .13 * k})`;                                                  // 寄った状態から引く(余韻)
    case 'pan': return `scale(1.14) translateX(${(.5 - k) * 5}%)`;                                     // 横に流れる
    case 'tilt': return `scale(1.14) translateY(${(.5 - k) * 5}%)`;                                    // 縦に流れる
    case 'kenburns': return `scale(${1.05 + .09 * k}) translate(${(.5 - k) * 2.4}%, ${(k - .5) * 1.8}%)`;   // 寄りながら斜めに(映画的)
    case 'sway': return `scale(1.13) rotate(${1.2 * Math.sin(b * 1.1)}deg) translateX(${1.8 * Math.sin(b * .8)}%)`;   // ゆらりと傾く
    case 'beat': return `scale(${1.07 + .06 * hit})`;                                                  // 拍ごとに弾む
    case 'breathe': return `scale(${1.08 + .035 * Math.sin(b * 1.6)})`;                                // 呼吸のように
    case 'rise': return `scale(1.13) translateY(${(1 - back) * 7}%)`;                                  // 下からせり上がる
    case 'punch': return `scale(${1 + .24 * (1 - eo(cl(b / .9)))})`;                                   // ぐっと寄って落ち着く
    case 'drift': return `scale(1.12) translate(${1.7 * Math.sin(b * .7)}%, ${1.7 * Math.cos(b * .6)}%)`;   // 斜めに漂う
    default: return `scale(${1.02 + .035 * Math.min(1, b / 8)})`;                                       // zoom: ゆっくり寄る(既定)
  }
};

// 背景の模様(ゆっくり動く)。色は、場面の配色(文字色・強調色)を薄く使う
export const Bg: React.FC<{kind?: string; ink: string; accent: string; bg?: string; pick?: number[]; pmotion?: string}> = ({kind = 'plain', ink, accent, bg = '#ffffff', pick, pmotion = 'zoom'}) => {
  const b = useB(), beat = useBeat();
  const pat = (id: string, w: number, h: number, child: React.ReactNode, move: [number, number], rot = 0) => (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs><pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse" patternTransform={`translate(${b * move[0]} ${b * move[1]}) rotate(${rot})`}>{child}</pattern></defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
    </svg>
  );
  switch (kind) {
    case 'dots': return pat('bgd', 64, 64, <circle cx={32} cy={32} r={5} fill={ink} opacity={.15} />, [34, 18]);
    case 'stripes': return pat('bgs', 90, 90, <rect width={40} height={90} fill={accent} opacity={.12} />, [60, 0], 45);
    case 'grid': return pat('bgg', 120, 120, <path d="M120 0H0V120" fill="none" stroke={ink} strokeWidth={2} opacity={.13} />, [18, 12]);
    case 'checker': return pat('bgc', 240, 240, <><rect width={120} height={120} fill={ink} opacity={.06} /><rect x={120} y={120} width={120} height={120} fill={ink} opacity={.06} /></>, [30, 0]);
    case 'blobs': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 5}, (_, k) => <circle key={k} cx={W * (.15 + .18 * k) + 120 * Math.sin(b * .9 + k * 1.7)} cy={H * (.25 + .45 * ((k * 37) % 10) / 10) + 90 * Math.cos(b * .8 + k)} r={190 + 40 * k} fill={k % 2 ? accent : ink} opacity={.1} />)}
      </svg>);
    case 'rays': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 14}, (_, k) => { const a0 = (k / 14) * Math.PI * 2 + b * .12, a1 = a0 + Math.PI / 14, R = 2400; return <polygon key={k} points={`960,540 ${960 + R * Math.cos(a0)},${540 + R * Math.sin(a0)} ${960 + R * Math.cos(a1)},${540 + R * Math.sin(a1)}`} fill={accent} opacity={.1} />; })}
      </svg>);
    case 'waves': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {[0, 1, 2].map(k => { const y0 = 700 + k * 110; const d = Array.from({length: 49}, (_, i) => `${i ? 'L' : 'M'}${i * 40} ${y0 + 36 * Math.sin(i * .5 + b * 1.6 + k)}`).join(' ') + ` L${W} ${H} L0 ${H} Z`; return <path key={k} d={d} fill={accent} opacity={.1 + k * .03} />; })}
      </svg>);
    case 'hex': return pat('bgh', 104, 180, <path d="M52 0L104 30V90L52 120L0 90V30Z M52 120V180 M0 90L-52 120 M104 90L156 120" fill="none" stroke={ink} strokeWidth={2.5} opacity={.13} />, [12, 20]);
    case 'zigzag': return pat('bgz', 80, 60, <path d="M0 40L20 20L40 40L60 20L80 40" fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round" opacity={.22} />, [26, 8]);
    case 'plus': return pat('bgp', 90, 90, <path d="M45 33V57M33 45H57" stroke={ink} strokeWidth={5} strokeLinecap="round" opacity={.16} />, [-20, 14]);
    case 'rings': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}} fill="none" stroke={accent}>
        {Array.from({length: 7}, (_, k) => { const r = ((k * 150 + b * 70) % 1050) + 20; return <circle key={k} cx={W * .72} cy={H * .46} r={r} strokeWidth={5} opacity={.24 * (1 - r / 1100)} />; })}
      </svg>);
    case 'stars': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}} fill={accent}>
        {Array.from({length: 26}, (_, k) => { const x = (k * 733) % W, y = (k * 389) % H, s = 8 + (k % 5) * 5, tw = .5 + .5 * Math.sin(b * 2.4 + k * 1.9);
          return <path key={k} opacity={.12 + .28 * tw} transform={`translate(${x} ${y}) scale(${s / 10})`} d="M0 -12 Q1.5 -1.5 12 0 Q1.5 1.5 0 12 Q-1.5 1.5 -12 0 Q-1.5 -1.5 0 -12Z" />; })}
      </svg>);
    case 'notes': return (                                                                  // 音符が、ゆっくり上へ昇る
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 16}, (_, k) => { const sp = 28 + (k % 5) * 9, y = H + 120 - ((b * sp + k * 150) % (H + 280)), x = (k * 311) % W + 36 * Math.sin(b * .8 + k);
          return <Note key={k} x={x} y={y} s={22 + (k % 4) * 9} rot={10 * Math.sin(b + k)} col={k % 3 ? accent : ink} op={.2} v={k % 3} />; })}
      </svg>);
    case 'equalizer': return <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><Eq x={0} y={H} w={W} h={H * .5} n={56} col={accent} op={.2} gap={.4} /></svg>;
    case 'soundwave': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}} fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round">
        {[0, 1, 2].map(k => { const amp = 38 + 46 * beat.hit * (1 - k * .25), y0 = 740 + k * 80; return <path key={k} opacity={.28 - k * .06} d={Array.from({length: 97}, (_, i) => `${i ? 'L' : 'M'}${i * 20} ${y0 + amp * Math.sin(i * .38 + b * 2.4 + k) * Math.sin(i * .09 + k)}`).join('')} />; })}
      </svg>);
    case 'disco': return (                                                                    // 回る色とりどりの光と、ミラーボールの粒
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 10}, (_, k) => { const a = (k / 10) * Math.PI * 2 + b * .35, R = 2200, hue = (k * 36 + b * 20) % 360; return <polygon key={k} points={`960,-60 ${960 + Math.cos(a) * R},${-60 + Math.sin(a) * R} ${960 + Math.cos(a + .1) * R},${-60 + Math.sin(a + .1) * R}`} fill={`hsl(${hue} 90% 60%)`} opacity={.1 + .06 * beat.hit} />; })}
        {Array.from({length: 40}, (_, k) => <circle key={k} cx={(k * 487) % W} cy={(k * 233) % H} r={3 + 5 * (.5 + .5 * Math.sin(b * 3 + k))} fill={`hsl(${(k * 47) % 360} 90% 65%)`} opacity={.35} />)}
      </svg>);
    case 'video': { const v = STYLE.lp?.videos?.[(pick?.[0] ?? 1) - 1] ?? STYLE.lp?.videos?.[0]; if (!v) return null;            // LPの動画を、ぼかして敷く(音は出さない)。上に背景色を重ねて、文字を読みやすくする
      return <>
        <OffthreadVideo src={staticFile(v.file)} muted style={{position: 'absolute', inset: -40, width: W + 80, height: H + 80, objectFit: 'cover', filter: 'blur(26px) saturate(1.15)'}} />
        <div style={{position: 'absolute', inset: 0, backgroundColor: /^#[0-9a-fA-F]{6}$/.test(bg) ? bg + 'CC' : 'rgba(255,255,255,.8)'}} />
      </>; }
    case 'photo': { const im = STYLE.lp?.photos?.[(pick?.[0] ?? 1) - 1] ?? STYLE.lp?.photos?.[0] ?? STYLE.lp?.pc; if (!im) return null;      // LPの写真(無ければ画面)を、ぼかして敷く。上に背景色を重ねて、文字を読みやすくする
      return <>
        <Img src={staticFile(im.file)} style={{position: 'absolute', inset: -60, width: W + 120, height: H + 120, objectFit: 'cover', filter: 'blur(22px) saturate(1.1)', transform: `scale(${1.04 + .02 * Math.sin(b * .3)})`}} />
        <div style={{position: 'absolute', inset: 0, backgroundColor: /^#[0-9a-fA-F]{6}$/.test(bg) ? bg + 'D9' : 'rgba(255,255,255,.85)'}} />
      </>; }
    case 'photofull': { const im = STYLE.lp?.photos?.[(pick?.[0] ?? 1) - 1] ?? STYLE.lp?.photos?.[0]; if (!im) return null;      // 写真を、ぼかさず、大きく敷く(テーマ動画。文字は白で、暗い幕の上に重ねる)。動きは、場面ごとに layers.pmotion で選ぶ
      return <>
        <Img src={staticFile(im.file)} style={{position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover', transform: pTrans(pmotion, b, beat.hit)}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,.18) 40%, rgba(0,0,0,.55) 100%)'}} />
      </>; }
    case 'videofull': { const v = STYLE.lp?.videos?.[(pick?.[0] ?? 1) - 1] ?? STYLE.lp?.videos?.[0]; if (!v) return null;       // 動画を、ぼかさず、大きく敷く(音は出さない)
      return <>
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
          <OffthreadVideo src={staticFile(v.file)} muted style={{position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover', transform: pTrans(pmotion, b, beat.hit)}} />
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,.18) 40%, rgba(0,0,0,.55) 100%)'}} />
      </>; }
    case 'lines': return pat('bgl', 200, 70, <path d="M0 62H200" stroke={ink} strokeWidth={2.5} opacity={.14} />, [0, 10]);
    case 'circuit': return pat('bgu', 180, 180, <g fill="none" stroke={ink} strokeWidth={3} opacity={.14}><path d="M0 90H70L90 70H180M90 70V0M90 110V180M90 110L130 150H180" /><circle cx={70} cy={90} r={8} /><circle cx={130} cy={150} r={8} /><circle cx={90} cy={0} r={6} /></g>, [14, 8]);
    case 'bubbles': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}} fill="none" stroke={accent}>
        {Array.from({length: 16}, (_, k) => { const r = 24 + (k * 37) % 70, x = (k * 619) % W, y = H + 100 - ((b * (40 + (k % 5) * 14) + k * 170) % (H + 260)); return <circle key={k} cx={x + 20 * Math.sin(b + k)} cy={y} r={r} strokeWidth={4} opacity={.28} />; })}
      </svg>);
    case 'spotlight': return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 70% at ${50 + 10 * Math.sin(b * .4)}% 50%, ${accent}30 0%, transparent 70%)`}} />;
    case 'sunburst': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 24}, (_, k) => { const a0 = (k / 24) * Math.PI * 2 + b * .05, a1 = a0 + Math.PI / 24, R = 2400; return k % 2 ? null : <polygon key={k} points={`960,540 ${960 + Math.cos(a0) * R},${540 + Math.sin(a0) * R} ${960 + Math.cos(a1) * R},${540 + Math.sin(a1) * R}`} fill={accent} opacity={.09} />; })}
      </svg>);
    case 'dotwave': return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}} fill={ink}>
        {Array.from({length: 22 * 12}, (_, k) => { const i = k % 22, j = Math.floor(k / 22), x = 50 + i * 88, y = 50 + j * 92, s = 3 + 5 * (.5 + .5 * Math.sin(b * 1.6 + i * .5 + j * .4)); return <circle key={k} cx={x} cy={y} r={s} opacity={.14} />; })}
      </svg>);
    case 'gradient': return <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${120 + b * 22}deg, ${accent}40 0%, transparent 62%)`}} />;
    default: return null;
  }
};
