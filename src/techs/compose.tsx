import React, {useMemo} from 'react';
import {STYLE, SceneProps, Stage, Sub, Text, eb, makeFit, onAccent, ss, useB, useK, usePulse} from '../lib';
import {Bg} from '../compose/bg';
import {Decor} from '../compose/decors';
import {Icon} from '../compose/Icon';
import {Icons} from '../compose/Icons';
import {Device} from '../compose/Device';
import {boxOf, layout} from '../compose/layouts';
import {motionFn} from '../compose/motions';

// 層の組み合わせで描く場面: 背景 × 文字の配置 × 文字の動き × 強調 × 題材の絵(アイコン)。組み合わせは、シナリオ(layers)が決める
export const compose: React.FC<SceneProps> = ({lines, caption, bg, ink: inkIn, accent, seed, fs, layers}) => {
  const full = layers?.bg === 'photofull' || layers?.bg === 'videofull', ink = full ? '#ffffff' : inkIn;      // 写真・動画を大きく敷く場面は、文字を白にする
  const f = makeFit(fs), b = useB(), K = useK(), p = usePulse(), L = layers ?? {};
  const lay00 = useMemo(() => layout(L.layout ?? 'center', lines, f), [L.layout, lines, fs]);
  // 文字全体を崩す(layers.tilt: 傾き(度)/ scale: 拡大 / shift: [右へ, 下へ](px))。文字の枠の中心を基準にする。場面ごとに変えて、整った感じを崩す
  const lay0 = useMemo(() => {
    if (!lay00.G.length || (!L.tilt && (L.scale ?? 1) === 1 && !L.shift)) return lay00;
    const bx = boxOf(lay00.G), cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2, th = (L.tilt ?? 0) * Math.PI / 180, sc = L.scale ?? 1, [dx, dy] = L.shift ?? [0, 0];
    return {...lay00, G: lay00.G.map(g => ({...g, x: cx + ((g.x - cx) * Math.cos(th) - (g.y - cy) * Math.sin(th)) * sc + dx, y: cy + ((g.x - cx) * Math.sin(th) + (g.y - cy) * Math.cos(th)) * sc + dy, size: g.size * sc, rot: (g.rot ?? 0) + th}))};
  }, [lay00, L.tilt, L.scale, L.shift]);
  // 文字の縦位置(layers.valign: top / bottom。省略は、配置のまま)。顔などの主役に、文字がかからないようにする。上に置くときは、アイコンの台を、下の歌詞の帯より上の、下寄りへ
  const lay = useMemo(() => {
    if (!lay0.G.length || (L.valign !== 'top' && L.valign !== 'bottom')) return lay0;
    const bx = boxOf(lay0.G), dy = L.valign === 'top' ? 100 - bx.y : 1080 - 100 - (bx.y + bx.h);
    return {...lay0, G: lay0.G.map(g => ({...g, y: g.y + dy})), badge: L.valign === 'top' ? {...lay0.badge, x: lay0.badge.x > 400 && lay0.badge.x < 1500 ? 1790 : lay0.badge.x, y: Math.max(lay0.badge.y, 720)} : lay0.badge};
  }, [lay0, L.valign]);
  const box = useMemo(() => boxOf(lay.G), [lay]);
  // アイコンの飾り(icons)が避ける枠: 文字(1文字ずつの枠)と、右側の絵(スマホ・写真など)
  const avoid = useMemo(() => [...lay.G.map(g => ({x0: g.x - g.size * .5, x1: g.x + g.size * .5, y0: g.y - g.size * .5, y1: g.y + g.size * .5})),
    ...(lay.device ? [{x0: lay.device.x - lay.device.w * .5, x1: lay.device.x + lay.device.w * .5, y0: lay.device.y - lay.device.w * (lay.device.kind === 'phone' ? .98 : .5), y1: lay.device.y + lay.device.w * (lay.device.kind === 'phone' ? .98 : .5)}] : [])], [lay]);
  const last = useMemo(() => { const y = Math.max(...lay.G.map(g => g.y)); return boxOf(lay.G.filter(g => Math.abs(g.y - y) < 1)); }, [lay]);          // 最後の行
  const stamp = useMemo(() => ({x: Math.min(1740, Math.max(170, lay.badge.x > 960 ? box.x + 30 : box.x + box.w - 30)), y: L.layout === 'corner' ? 820 : Math.min(900, Math.max(160, box.y - 30))}), [lay, box, L.layout]);   // 判子は、アイコンの台の反対側
  const t0 = ['rise', 'zoom', 'wipe'].includes(STYLE.opener) ? .35 : 1.7, fn = motionFn(L.motion ?? 'wave', b, p, t0);
  const ch = [...(lines[0] ?? '')].find(c => /[぀-ヿ一-鿿]/.test(c)) ?? [...(lines[0] ?? '？')][0];
  const pop = eb((b - .5) / .6);
  // アイコンに、空けておいてもらう領域(layers.iconsAvoid: [[x0,y0,x1,y1], ...]。0〜1。写真の顔のあたり)を、文字・右側の絵に足す
  const iconsAvoid = useMemo(() => [...avoid, ...(L.iconsAvoid ?? []).map(([x0, y0, x1, y1]) => ({x0: x0 * 1920, y0: y0 * 1080, x1: x1 * 1920, y1: y1 * 1080}))], [avoid, L.iconsAvoid]);
  const ICONS = (L.icons ?? []).filter(n => n);                     // まわりに出る、追加のアイコン(layers.icons。iconsStyle: pop=拍で弾ける(既定)/ float=漂う)
  return (
    <Stage bg={bg} ink={ink} src="compose" G={lay.G} seed={seed}>
      <Bg kind={L.bg} pick={L.pick} pmotion={L.pmotion} ink={ink} accent={accent} bg={bg} />
      {L.icon && <Icon name={L.icon} size={lay.water.size} color={accent} stroke={1} style={{position: 'absolute', left: lay.water.x - lay.water.size / 2, top: lay.water.y - lay.water.size / 2, opacity: .13 * ss(b, .2, .8), transform: `rotate(${-8 + b * 2}deg)`}} />}
      <Icons names={ICONS} accent={accent} ink={ink} b={b} badge={lay.badge} avoid={iconsAvoid} style={L.iconsStyle} />
      {lay.device && <Device {...lay.device} data={L.data} count={L.count} pick={L.pick} seed={seed} b={b} ink={ink} accent={accent} />}
      <Decor kind={L.decor} layer="back" box={box} last={last} stamp={stamp} b={b} ink={ink} accent={accent} ch={ch} />
      <Text G={lay.G} K={K} ink={ink} fn={fn} />
      <Decor kind={L.decor} layer="front" box={box} last={last} stamp={stamp} b={b} ink={ink} accent={accent} ch={ch} />
      {L.icon && <div style={{position: 'absolute', left: lay.badge.x - lay.badge.size * .75, top: lay.badge.y - lay.badge.size * .75, width: lay.badge.size * 1.5, height: lay.badge.size * 1.5, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pop > 0 ? 1 : 0, transform: `scale(${Math.max(0, pop)}) translateY(${Math.sin(b * 2.4) * 8}px)`, boxShadow: '0 10px 30px rgba(0,0,0,.18)'}}>
        <Icon name={L.icon} size={lay.badge.size * .85} color={onAccent(accent)} stroke={1.8} /></div>}
      {caption && <Sub text={caption} cx={960} cy={L.valign === 'bottom' ? 110 : 965} size={56} t0={2.6} col={ink} />}
    </Stage>
  );
};
