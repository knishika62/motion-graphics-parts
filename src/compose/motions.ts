import {Fk, O, G, amp, calmOf, cl, eb, hash} from '../lib';

export const MOTION_NAMES = ['wave', 'bounce', 'flip', 'shake', 'spin', 'scramble', 'drop', 'float', 'rise', 'elastic', 'swing', 'slide', 'pulse', 'glitch', 'wobble', 'zoomout', 'stagger', 'tilt', 'dance', 'beatbounce'];
const FK: Fk[] = ['g', 'm', 'r', 'k'];

// 文字の動き。t0: 動き出す時刻(組み上がったあと、または、最初から文字が出る演出では、すぐ)。入ってくる動き(bounce/flip/spin/drop)は、t0から1文字ずつ順に
export function motionFn(kind: string, b: number, p: number, t0: number): (g: G, i: number) => O | undefined {
  const t = b - t0, bell = (u: number) => Math.sin(Math.PI * cl(u));
  switch (kind) {
    case 'bounce': return (g, i) => { const u = (t - i * .06) / .5; return {s: 1 + .32 * bell(u) * amp(1), dy: -48 * amp(1) * bell(u)}; };
    case 'flip': return (g, i) => { const u = cl((t - i * .06) / .7); return {sx: Math.cos(u * Math.PI * 2) * (u > 0 && u < 1 ? 1 : 1)}; };
    case 'shake': return (g, i) => { const d = Math.exp(-Math.max(0, t) * 1.8); return {dx: (hash(Math.floor(b * 20) + i) - .5) * amp(18) * d, dy: (hash(Math.floor(b * 20) + i * 3.1) - .5) * amp(12) * d, s: 1 + .08 * d}; };
    case 'spin': return (g, i) => { const u = eb((t - i * .06) / .8); return {r: (1 - u) * -2.2, s: .2 + .8 * u, a: t - i * .06 > 0 ? 1 : 0}; };
    case 'scramble': return (g, i) => { const u = b - (t0 + .1 + i * .13), q = Math.floor(b * 10); return u >= 0 ? {s: 1 + .25 * Math.exp(-u * 7)} : {f: FK[(q + i * 3) % 4], s: .8 + .4 * hash(q + i * 3.1), r: (hash(q * 2 + i) - .5) * .35}; };
    case 'drop': return (g, i) => { const u = eb((t - i * .07) / .65); return {dy: -460 * (1 - u), a: cl(u * 4)}; };
    case 'rise': return (g, i) => { const u = eb((t - i * .05) / .6); return {dy: 150 * (1 - u), a: cl(u * 3)}; };
    case 'elastic': return (g, i) => { const u = cl((t - i * .05) / .9); return {s: u <= 0 ? .001 : 1 + Math.exp(-u * 6) * Math.cos(u * 16) * .9 * (1 - u * .2) - .0 }; };
    case 'swing': return (g, i) => { const u = Math.max(0, t - i * .04); return {r: .22 * Math.exp(-u * 1.6) * Math.sin(u * 7 + i * .5), a: t - i * .04 > -.05 ? 1 : 0}; };
    case 'slide': return (g, i) => { const u = eb((t - i * .05) / .55); return {dx: -520 * (1 - u), a: cl(u * 3)}; };
    case 'pulse': return (g, i) => ({s: 1 + .06 * amp(1) * Math.sin(b * 3.2 - i * .35)});
    case 'glitch': return (g, i) => { const u = Math.max(0, t - i * .03), d = Math.exp(-u * 2.2), q = Math.floor(b * 24); return {dx: (hash(q + i) - .5) * 60 * d * amp(1), sx: 1 + (hash(q * 3 + i) - .5) * .5 * d, a: t - i * .03 > -.05 ? 1 : 0, f: u < .35 ? FK[(q + i) % 4] : undefined}; };
    case 'wobble': return (g, i) => ({r: .06 * Math.sin(b * 3 + i * .8) * amp(1), dy: amp(8) * Math.sin(b * 2.4 + i)});
    case 'zoomout': return (g, i) => { const u = eb((t - i * .05) / .7); return {s: 1 + 2.2 * (1 - u), a: cl(u * 3)}; };
    case 'stagger': return (g, i) => { const u = eb((t - i * .08) / .45); return {dy: 40 * (1 - u), a: cl(u * 2.5)}; };
    case 'tilt': return (g, i) => { const u = eb((t - i * .05) / .6); return {sl: -.5 * (1 - u), dx: -60 * (1 - u), a: cl(u * 3)}; };
    case 'dance': return (g, i) => { const ph = b * 2 * Math.PI + i * .7; return {r: .09 * Math.sin(ph) * calmOf(b), dy: -16 * Math.abs(Math.sin(ph)) * amp(1), dx: 8 * Math.sin(ph * .5) * calmOf(b)}; };      // 1拍ごとに跳ねて、ゆらゆら踊る
    case 'beatbounce': return (g, i) => { const x = ((b * 2 + i * .08) % 1); return {s: 1 + .16 * Math.exp(-x * 6) * amp(1), dy: -10 * Math.exp(-x * 6) * amp(1)}; };    // 拍ごとに、ぽんと膨らむ
    case 'float': return (g, i) => ({dy: amp(11) * Math.sin(b * 2.2 + i * 1.3), dx: amp(6) * Math.cos(b * 1.7 + i), r: .025 * Math.sin(b * 2 + i) * calmOf(b)});
    default: return (g, i) => ({dy: amp(18) * Math.sin(b * 5 - i * .6)});    // wave
  }
}
