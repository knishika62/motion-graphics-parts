import fs from 'node:fs';
export const ROOT = new URL('../', import.meta.url);
export const text = f => fs.readFileSync(new URL(f, ROOT), 'utf-8');
export const json = f => JSON.parse(text(f));
// TypeScript の「export const NAME = ['a', 'b', ...]」から、名前の一覧を取り出す
export const namesOf = (file, constName) => {
  const m = text(file).match(new RegExp(`export const ${constName}[^=]*=\\s*\\[([^\\]]*)\\]`));
  if (!m) throw new Error(`${file}: ${constName} が見つからない`);
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
};
// switch の case 'name' / case 12 を集める
export const casesOf = file => new Set([...text(file).matchAll(/case\s+(?:'([^']+)'|(\d+))\s*:/g)].map(m => m[1] ?? Number(m[2])));
