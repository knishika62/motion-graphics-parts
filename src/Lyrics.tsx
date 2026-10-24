import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import scenario from './scenario.json';
import {FPS} from './timeline';
import type {Style} from './lib';

// 歌詞(台本の lyrics): 場面とは別に、時刻つきで重ねる。1文字ずつ、行ごとに違う踊り方(fx)で入り、拍に合わせて踊る。拍は、台本の bpm(と beatOffset)から。
type Cue = {start: number; end: number; text: string; fx?: string; big?: boolean; pos?: 'top' | 'middle' | 'bottom'};
const S = scenario as unknown as {lyrics?: Cue[]; bpm?: number; beatOffset?: number; lyricKeywords?: string[]; lyricColor?: string; style?: Style};
const CUES: Cue[] = S.lyrics ?? [], BPM = S.bpm ?? 124, OFFSET = S.beatOffset ?? 0, PERIOD = 60 / BPM;
const ACCENT = S.lyricColor ?? S.style?.palette?.[0]?.accent ?? '#FFA53A';
const COLORS = [ACCENT, '#FF6AA8', '#B07CFF', '#B6FF3D', '#7AF0FF'];
const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif';
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const KEY = S.lyricKeywords?.length ? new RegExp(`(${S.lyricKeywords.map(esc).join('|')})`) : null;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - (1 - clamp(x)) ** 3;
const easeBack = (x: number) => { const c = 2.2, v = clamp(x) - 1; return 1 + (c + 1) * v ** 3 + c * v ** 2; };       // 行き過ぎて戻る
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const sinceBeat = (t: number) => { const d = (t - OFFSET) % PERIOD; return d < 0 ? d + PERIOD : d; };
const beatEnergy = (t: number) => Math.exp(-sinceBeat(t) * 7);                                                       // 拍の直後ほど1に近い(すぐ減る)
const phase = (t: number) => ((t - OFFSET) / PERIOD) * Math.PI * 2;
const width = (s: string) => [...s].reduce((n, c) => n + (/[\u0000-ÿ]/.test(c) ? 0.56 : 1), 0);

const Line: React.FC<{cue: Cue; t: number}> = ({cue, t}) => {
  if (t < cue.start || t > cue.end + 0.3) return null;
  const o = 1 - clamp((t - (cue.end - 0.1)) / 0.3), size = Math.min(cue.big ? 170 : 84, 1760 / width(cue.text)), be = beatEnergy(t), ph = phase(t), fx = cue.fx ?? 'bounce';
  const chars = (KEY ? cue.text.split(KEY).filter(Boolean) : [cue.text]).flatMap(seg => [...seg].map(c => ({c, key: !!KEY && KEY.test(seg)})));
  const amp = cue.big ? 1.5 : 1, stag = cue.big ? 0.05 : 0.04, pos = cue.pos ?? (cue.big ? 'middle' : 'bottom');
  return (
    <div style={{position: 'absolute', left: 0, right: 0, ...(pos === 'middle' ? {top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'} : pos === 'top' ? {top: 110, textAlign: 'center'} : {bottom: 120, textAlign: 'center'}), opacity: o}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, whiteSpace: 'nowrap', letterSpacing: cue.big ? 4 : 2}}>
        {chars.map(({c, key}, k) => {
          const a = (t - cue.start - k * stag) / 0.4, e = easeBack(a), ea = easeOut(a), sgn = k % 2 ? 1 : -1;
          let x = 0, y = 0, r = 0, s = 1, op = clamp(a * 3);
          switch (fx) {
            case 'bounce': y = (1 - e) * 110 - be * 16 * amp; s = 1 + be * 0.1; break;                                  // 下から跳ね上がる。拍で跳ねる
            case 'drop': y = -(1 - e) * 170 - be * 8 * amp; r = sgn * (1 - ea) * 25; break;                              // 上から落ちてくる
            case 'spin': r = (1 - e) * 360; s = e; y = -be * 12 * amp; break;                                             // 回りながら現れる
            case 'wave': y = (1 - ea) * 70 + Math.sin(ph / 2 + k * 0.7) * 13 * amp; r = Math.sin(ph / 2 + k * 0.7 + 1) * 2.5; break;      // 波のように揺れ続ける
            case 'swing': y = (1 - ea) * 50; r = Math.sin(ph / 2 + k * 0.9) * 8 * amp + sgn * (1 - ea) * 40; break;       // 振り子のように揺れる
            case 'slide': x = sgn * (1 - ea) * 420; y = -be * 14 * amp; break;                                            // 左右から滑り込む
            case 'scale': s = lerp(3.2, 1, e) * (1 + be * 0.09); op = clamp(a * 2.5); break;                              // 大きく現れて縮む。拍で脈打つ
          }
          const col = key ? (cue.big ? COLORS[k % COLORS.length] : ACCENT) : '#fff';
          return <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', opacity: op, transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`, color: col,
            textShadow: cue.big ? `0 0 36px ${COLORS[k % COLORS.length]}, 0 0 80px rgba(255,120,0,.5), 0 4px 14px rgba(0,0,0,.85)` : '0 0 16px rgba(0,0,0,.85), 0 3px 8px rgba(0,0,0,.95)'}}>{c}</span>;
        })}
      </div>
    </div>);
};

export const Lyrics: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (!CUES.length) return null;
  // 下に歌詞が出ている間は、下を少し暗くして、読みやすくする。大きな文字の間は、全体を少し暗くする
  const act = (f: (c: Cue) => boolean) => CUES.reduce((m, c) => (f(c) ? Math.max(m, clamp((t - c.start) / 0.25) * (1 - clamp((t - c.end) / 0.3))) : m), 0);
  const bottom = act(c => !c.big && (c.pos ?? 'bottom') === 'bottom'), big = act(c => !!c.big);       // 大きな文字は、pos(top / middle / bottom)で位置を選べる。省略は中央
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,.6) 100%)', opacity: bottom}} />
      <AbsoluteFill style={{background: 'rgba(10,0,20,.42)', opacity: big}} />
      {CUES.map((c, k) => <Line key={k} cue={c} t={t} />)}
    </AbsoluteFill>);
};
