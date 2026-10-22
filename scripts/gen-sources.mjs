// 各「技」のソースコード(src/techs/*.tsx のコンポーネント本体)を取り出して src/sources.ts に書き出す。
// 本番ビルドでは関数名が潰れるため、Function.toString() ではなく、実際のファイルから取り込む。
import fs from 'node:fs';
import path from 'node:path';
const dir = path.join(import.meta.dirname, '..', 'src', 'techs');
const out = {};
for (const f of fs.readdirSync(dir).filter(f => /\.tsx$/.test(f)).sort()) {
  const src = fs.readFileSync(path.join(dir, f), 'utf-8');
  const i = src.indexOf('export const ');
  out[f.replace('.tsx', '')] = (i >= 0 ? src.slice(i) : src).replace('export const ', 'const ');
}
fs.writeFileSync(path.join(import.meta.dirname, '..', 'src', 'sources.ts'),
  '// 自動生成(npm run gen)。直接編集しない\nexport const SRC: Record<string, string> = ' + JSON.stringify(out, null, 1) + ';\n');
console.log('sources.ts:', Object.keys(out).join(', '));
