// 初回用: Remotion Studio(プレビュー)が動くように、無ければ、仮の台本(文字だけの2場面)と無音の音声と sources.ts を作る。書き出し(render.mjs)のたびに、本物に置き換わる。
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, makeTimeline, readJson, writeJson} from './common.mjs';
import {silentNarration} from './theme.mjs';
import {buildStyle} from './moods.mjs';

const f = path.join(ROOT, 'src', 'scenario.json'), tl = path.join(ROOT, 'src', 'timeline.json');
const stale = !fs.existsSync(tl) || !Array.isArray(readJson(tl).starts);          // 古い形(開始フレームが無い)の timeline.json は、作り直す
if (!fs.existsSync(f) || stale) {
  const scenario = {title: 'preview', mood: 'pop', scenes: [
    {tech: 'compose', lines: ['部品を、', '組み合わせる'], layers: {layout: 'center', motion: 'rise', bg: 'gradient', decor: 'underline', icon: 'Sparkles'}, fs: 1},
    {tech: 'compose', lines: ['お題から', '動画へ'], layers: {layout: 'left', motion: 'slide', bg: 'dots', decor: 'none', icon: 'Film'}, fs: 1}]};
  scenario.style = buildStyle('pop', 2);
  const {beats, beat} = silentNarration(scenario, [3, 3], () => {});
  writeJson(f, scenario); writeJson(tl, makeTimeline(beats, beat, 0.5));
  console.log('仮の台本を作った(src/scenario.json)。書き出し(node scripts/render.mjs)で、本物に置き換わる');
}
