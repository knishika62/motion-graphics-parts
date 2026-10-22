import React from 'react';

// 音符・イコライザの図形(lib.tsx に依存しない。lib.tsx からも使うため)
const cl = (x: number) => Math.max(0, Math.min(1, x));
export const beatX = (frame: number) => frame / 60 * 2;       // 120BPM(1秒に2拍)
// 音符(♪ ♫ ♬)。フォントによらないよう、図形で描く。s: 大きさ、v: 種類(0=♪ 1=♫ 2=♬)
export const Note: React.FC<{x: number; y: number; s: number; rot?: number; col: string; op?: number; v?: number}> = ({x, y, s, rot = 0, col, op = 1, v = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op} fill={col} stroke={col} strokeLinecap="round" strokeLinejoin="round">
    {v === 0 && <><ellipse cx={0} cy={0} rx={.62} ry={.44} transform="rotate(-22)" stroke="none" /><path d="M.52 -.18V-2.5C.9 -2 1.5 -1.7 1.6 -1" fill="none" strokeWidth={.17} /></>}
    {v === 1 && <><ellipse cx={0} cy={0} rx={.62} ry={.44} transform="rotate(-22)" stroke="none" /><ellipse cx={1.6} cy={-.25} rx={.62} ry={.44} transform="rotate(-22 1.6 -.25)" stroke="none" /><path d="M.52 -.18V-2.4L2.12 -2.7V-.43" fill="none" strokeWidth={.17} /><path d="M.52 -2.4L2.12 -2.7" strokeWidth={.4} /></>}
    {v === 2 && <><ellipse cx={0} cy={0} rx={.62} ry={.44} transform="rotate(-22)" stroke="none" /><ellipse cx={1.5} cy={-.2} rx={.62} ry={.44} transform="rotate(-22 1.5 -.2)" stroke="none" /><path d="M.52 -.18V-2.5L2.02 -2.8V-.43M.52 -1.7L2.02 -2" fill="none" strokeWidth={.17} /><path d="M.52 -2.5L2.02 -2.8" strokeWidth={.38} /></>}
  </g>
);
// イコライザの棒(n本。幅 w、最大の高さ h、基準の y は底)
export const Eq: React.FC<{x: number; y: number; w: number; h: number; n: number; col: string; op?: number; b?: number; gap?: number; frame?: number}> = ({x, y, w, h, n, col, op = 1, b = 0, gap = .35, frame = 0}) => {
  const beat = beatX(frame), bw = w / n * (1 - gap);
  return <g fill={col} opacity={op}>{Array.from({length: n}, (_, k) => { const v = .25 + .75 * Math.abs(Math.sin(beat * Math.PI * (1 + (k % 3) * .5) + k * 1.7)) * (.6 + .4 * Math.sin(k * 2.3 + beat)), bh = h * v * cl(b * 2 + 1); return <rect key={k} x={x + k * w / n} y={y - bh} width={bw} height={bh} rx={bw / 2} />; })}</g>;
};
