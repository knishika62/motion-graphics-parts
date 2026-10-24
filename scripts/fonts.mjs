// 同梱用の書体(OFL=商用利用・再配布可のオープンな書体)。リポジトリには入れず、初回の実行で public/fonts/ にダウンロードする。
// 書体が無くても動く(Macならヒラギノ、無ければ、ブラウザの既定の日本語書体になる)。ネットワークが無い環境では、手でこのファイル名で置く。
//   NotoSansJP.ttf(ゴシック) / NotoSerifJP.ttf(明朝) / ZenMaruGothic-Bold.ttf / ZenMaruGothic-Black.ttf(丸ゴ)
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './common.mjs';

const FETCH_TIMEOUT_MS = 60000;                                                     // 1つの書体のダウンロードの待ち時間。超えたら、その書体なしで続ける
const BASE = 'https://github.com/google/fonts/raw/main/ofl';
export const FONT_FILES = [
  ['NotoSansJP.ttf', `${BASE}/notosansjp/NotoSansJP%5Bwght%5D.ttf`],
  ['NotoSerifJP.ttf', `${BASE}/notoserifjp/NotoSerifJP%5Bwght%5D.ttf`],
  ['ZenMaruGothic-Bold.ttf', `${BASE}/zenmarugothic/ZenMaruGothic-Bold.ttf`],
  ['ZenMaruGothic-Black.ttf', `${BASE}/zenmarugothic/ZenMaruGothic-Black.ttf`],
];
export async function ensureFonts(log) {
  const dir = path.join(ROOT, 'public', 'fonts'); fs.mkdirSync(dir, {recursive: true});
  for (const [name, url] of FONT_FILES) {
    const f = path.join(dir, name); if (fs.existsSync(f) && fs.statSync(f).size > 1e6) continue;
    try {
      log(`  書体をダウンロード: ${name}`);
      const r = await fetch(url, {signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)}); if (!r.ok) throw new Error(`HTTP ${r.status}`);
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    } catch (e) { log(`  書体を取得できない(${name}): ${e.message}。この書体なしで続ける`); }
  }
}
