import test from 'node:test';
import assert from 'node:assert/strict';
import {BGS, DECORS, LAYOUTS, LYRIC_FX, MEDIA_BGS, MOTIONS, PMOTIONS} from '../scripts/layers.mjs';
import {MOODS} from '../scripts/moods.mjs';
import {casesOf, namesOf, text} from './helpers.mjs';

const missing = (keys, have) => keys.filter(k => !have.includes(k));
test('配置: カタログ(layers.mjs)の名前が、描画側に実装されている', () => {
  const impl = [...namesOf('src/compose/layouts.ts', 'LAYOUT_NAMES'), ...[...casesOf('src/compose/layouts.ts')].filter(x => typeof x === 'string')];
  assert.deepEqual(missing(Object.keys(LAYOUTS), impl), []);
});
test('動き・背景・飾りも、同じ', () => {
  assert.deepEqual(missing(Object.keys(MOTIONS), namesOf('src/compose/motions.ts', 'MOTION_NAMES')), []);
  assert.deepEqual(missing([...Object.keys(BGS), ...Object.keys(MEDIA_BGS)], namesOf('src/compose/bg.tsx', 'BG_KINDS')), []);
  assert.deepEqual(missing(Object.keys(DECORS), namesOf('src/compose/decors.tsx', 'DECOR_NAMES')), []);
});
test('歌詞の動き・写真の動きが、switch に実装されている', () => {
  const lyr = casesOf('src/Lyrics.tsx'), bg = casesOf('src/compose/bg.tsx');
  assert.deepEqual(Object.keys(LYRIC_FX).filter(k => !lyr.has(k)), []);
  assert.deepEqual(Object.keys(PMOTIONS).filter(k => k !== 'zoom' && !bg.has(k)), []);       // zoom は default の形
});
test('雰囲気の場面転換の番号が、Root.tsx の clipFor に実装されている(無い番号は、静かに既定の形になる)', () => {
  const impl = casesOf('src/Root.tsx');
  for (const [id, m] of Object.entries(MOODS)) assert.deepEqual((m.transitions || []).filter(n => !impl.has(n)), [], `${id}: 実装の無い場面転換の番号`);
});
test('README の部品の数が、カタログと合っている', () => {
  const r = text('README.md').match(/配置(\d+)種、文字の動き(\d+)種、背景(\d+)種、強調(\d+)種、アイコン約(\d+)個、雰囲気(\d+)種/);
  assert.ok(r, 'README に部品の数の行が無い');
  return import('../scripts/icons.mjs').then(({ICON_NAMES}) => {
    assert.equal(+r[1], Object.keys(LAYOUTS).length); assert.equal(+r[2], Object.keys(MOTIONS).length);
    assert.equal(+r[3], Object.keys(BGS).length + Object.keys(MEDIA_BGS).length); assert.equal(+r[4], Object.keys(DECORS).length);
    assert.ok(Math.abs(+r[5] - ICON_NAMES.size) <= 10, `アイコン ${ICON_NAMES.size}個(README は約${r[5]})`); assert.equal(+r[6], Object.keys(MOODS).length);
  });
});
