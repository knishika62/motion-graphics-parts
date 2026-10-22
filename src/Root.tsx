import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {compose} from './techs/compose';
import {Lyrics} from './Lyrics';
import scenario from './scenario.json';
import {PALETTES, STYLE, SceneCtx, SceneProps, Style, cl, eio, setStyle} from './lib';
import {BEATS, FPS, HOLD, LEAD, LEN_F, START_F, TOTAL_F, TR} from './timeline';

setStyle((scenario as {style?: Style}).style);   // お題ごとの雰囲気(動きの強さ・書体・配色・場面転換)。描画より前に1回だけ
// シナリオ(scenario.json)の各場面が使う「技」の部品。色は、雰囲気の配色を場面の順に割り当てる
const TECHS: Record<string, React.FC<SceneProps>> = {compose};
type Sc = {layers?: SceneProps['layers']; tech: string; lines: string[]; caption?: string; aside?: string; title?: string[]; narration?: string; fs?: number};
const SCENES = (scenario.scenes as Sc[]).map((s, i) => ({s, Comp: TECHS[s.tech], pal: (STYLE.palette ?? PALETTES)[i % (STYLE.palette ?? PALETTES).length]}));

// 場面転換: 場面ごとに形が違う(CSSのclip-path)
const rects = (a: number[][]) => 'path("' + a.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}z`).join('') + '")';
const clipFor = (i: number, p: number) => {
  const H = 1080, W = 1920;
  switch (STYLE.transitions[(i - 1) % STYLE.transitions.length]) {   // 場面転換の形は、雰囲気が決めた並びから選ぶ
    case 1: return `circle(${p * 1250}px at 960px 540px)`;
    case 2: return rects(Array.from({length: 8}, (_, k) => [k * 240, 0, 241, H * cl(p * 1.7 - k * .1)]));
    case 3: return rects([[0, H * (1 - p), W, H * p + 1]]);
    case 4: return `circle(${p * 2300}px at 0px 0px)`;
    case 5: return rects(Array.from({length: 6}, (_, k) => { const w = W * cl(p * 1.6 - k * .08); return k % 2 ? [W - w, k * 180, w, 181] : [0, k * 180, w, 181]; }));
    case 6: { const X = p * (W + 700); return `polygon(0px 0px, ${X}px 0px, ${X - 700}px ${H}px, 0px ${H}px)`; }
    case 7: { const a: number[][] = []; for (let x = 0; x < 16; x++) for (let y = 0; y < 9; y++) { const s = 120 * cl(p * 2 - (x + y) / 24); a.push([x * 120 + 60 - s / 2, y * 120 + 60 - s / 2, s, s]); } return rects(a); }
    case 9: return `polygon(${W / 2 - p * 1300}px ${H / 2 - p * 800}px, ${W / 2 + p * 1300}px ${H / 2 - p * 800}px, ${W / 2 + p * 1300}px ${H / 2 + p * 800}px, ${W / 2 - p * 1300}px ${H / 2 + p * 800}px)`;     // 中央から広がる四角
    case 10: return `polygon(0px ${H / 2 - p * 700}px, ${W}px ${H / 2 - p * 700}px, ${W}px ${H / 2 + p * 700}px, 0px ${H / 2 + p * 700}px)`;       // 横帯が広がる
    case 11: return `circle(${p * 1800}px at 1920px 0px)`;
    case 12: return rects(Array.from({length: 12}, (_, k) => [0, k * 90, W * cl(p * 1.8 - k * .07), 91]));                                 // 左から、横帯が順に
    case 13: { const a = p * Math.PI * 2.1; const pts = [`960px 540px`]; for (let i = 0; i <= 48; i++) { const t = (i / 48) * a - Math.PI / 2; pts.push(`${960 + Math.cos(t) * 1700}px ${540 + Math.sin(t) * 1700}px`); } return `polygon(${pts.join(',')})`; }   // 時計回り
    case 14: return rects(Array.from({length: 12}, (_, k) => [k * 160, k % 2 ? H * (1 - cl(p * 1.6 - k * .05)) : 0, 161, H * cl(p * 1.6 - k * .05)]));   // 縦帯が上下から
    case 15: { const X = p * (W + 700); return `polygon(${W}px 0px, ${W - X}px 0px, ${W - X + 700}px ${H}px, ${W}px ${H}px)`; }                 // 右から斜め
    case 16: { const a: number[][] = []; for (let x = 0; x < 8; x++) for (let y = 0; y < 5; y++) { const s = 240 * cl(p * 2.2 - ((x * 7 + y * 13) % 12) / 14); a.push([x * 240 + 120 - s / 2, y * 216 + 108 - s * .45, s, s * .9]); } return rects(a); }   // ばらばらに現れる四角
    case 17: { const r = p * 1500; return `polygon(960px ${540 - r}px, ${960 + r * 1.6}px 540px, 960px ${540 + r}px, ${960 - r * 1.6}px 540px)`; }                  // ひし形が広がる
    case 18: { const w = p * 980; return `polygon(${960 - w}px 0px, ${960 + w}px 0px, ${960 + w}px ${H}px, ${960 - w}px ${H}px)`; }                                   // 中央から左右へ、扉のように開く
    case 19: return rects(Array.from({length: 10}, (_, k) => { const h = 108 * cl(p * 1.6 - Math.abs(k - 4.5) * .07); return [0, k * 108 + 54 - h / 2, W, h]; }));            // 横のスリットが、中央から外へ
    case 20: { const pts: string[] = []; for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 - Math.PI / 2, r = (i % 2 ? .45 : 1) * p * 1900; pts.push(`${960 + Math.cos(a) * r}px ${540 + Math.sin(a) * r}px`); } return `polygon(${pts.join(',')})`; }   // 星形
    case 21: { const X = p * (W + 300), pts = [`0px 0px`]; for (let i = 0; i <= 18; i++) pts.push(`${X - 150 + 120 * Math.sin(i * .9)}px ${i * H / 18}px`); pts.push(`0px ${H}px`); return `polygon(${pts.join(',')})`; }   // 波打つ縁が、左から右へ
    case 22: return rects(Array.from({length: 2}, (_, k) => [k ? W - (W / 2) * cl(p * 1.2) : 0, 0, (W / 2) * cl(p * 1.2) + 1, H]));                                 // 両端から、中央へ閉じる
    case 23: return `circle(${p * 1900}px at 1920px 1080px)`;
    case 24: return rects(Array.from({length: 16}, (_, k) => [k * 120, 0, 121, H * cl(p * 2 - (k % 4) * .22 - Math.floor(k / 4) * .05)]));                           // 縦の帯が、ずれて伸びる
    default: return `circle(${p * 1700}px at 960px 1080px)`;
  }
};
const Trans: React.FC<{i: number; children: React.ReactNode}> = ({i, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={i > 0 && f < TR ? {clipPath: clipFor(i, eio(f / TR))} : undefined}>{children}</AbsoluteFill>;
};

const FADE = scenario as unknown as {fadeIn?: number; fadeOut?: number};
const FadeBlack: React.FC = () => {
  const f = useCurrentFrame(), fi = (FADE.fadeIn ?? 0) * FPS, fo = (FADE.fadeOut ?? 0) * FPS;
  const a = Math.max(fi > 0 ? 1 - f / fi : 0, fo > 0 ? (f - (TOTAL_F - fo)) / fo : 0);
  return a > 0 ? <AbsoluteFill style={{background: '#000', opacity: Math.min(1, a)}} /> : null;
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{background: '#fff'}}>
    {SCENES.map(({s, Comp, pal}, i) => (
      <Sequence key={i} from={START_F[i]} durationInFrames={LEN_F[i] + (i < SCENES.length - 1 ? TR : HOLD)} layout="none">
        <SceneCtx.Provider value={{frames: LEN_F[i], beats: BEATS[i], accent: pal.accent}}>
          <Trans i={i}><Comp lines={s.lines} caption={s.caption} aside={s.aside} title={s.title} layers={s.layers} fs={s.fs} {...pal} seed={i + 1} /></Trans>
        </SceneCtx.Provider>
      </Sequence>
    ))}
    {/* 無音の土台(場面ごと)。BGM・曲は、書き出したあとに重ねる */}
    {SCENES.map((_, i) => (
      <Sequence key={`a${i}`} from={START_F[i] + Math.round(LEAD * FPS)} layout="none"><Audio src={staticFile(`s${i + 1}.wav`)} /></Sequence>
    ))}
    <Lyrics />{/* 歌詞(台本の lyrics。場面とは別に、時刻つきで重ねる) */}
    <FadeBlack />{/* 最初と最後の、黒からの入り・黒への出(台本の fadeIn / fadeOut。秒。省略は、どちらも無し) */}
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} width={1920} height={1080} fps={FPS} durationInFrames={TOTAL_F} />
);
