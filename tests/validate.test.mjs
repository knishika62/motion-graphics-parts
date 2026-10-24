import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTheme, validateTheme} from '../scripts/theme.mjs';
import {json, text} from './helpers.mjs';

const theme = parseTheme(text('examples/theme_sample.md'));
const media = {index: {'C01.jpg': {kind: 'photo', n: 1}, 'C02.jpg': {kind: 'photo', n: 2}, 'C03.jpg': {kind: 'photo', n: 3}, 'M01.mp4': {kind: 'video', n: 1}}};
const sample = () => json('examples/scenario_sample.json');
const errs = sc => validateTheme(sc, media, theme);
const bad = (mutate, re) => { const sc = sample(); mutate(sc); const e = errs(sc); assert.ok(e.some(x => re.test(x)), `「${re}」に当たる指摘が無い: ${JSON.stringify(e)}`); };

test('見本の台本(examples/)は、検査に通る', () => assert.deepEqual(errs(sample()), []));
test('見本の音楽つき台本も、検査に通る(素材は写真3・動画1を使う)', () => {
  const m = parseTheme(text('examples/music_sample.md'));
  assert.deepEqual(validateTheme(json('examples/scenario_music_sample.json'), media, m), []);
});
test('台本が{…}でない・場面の数が範囲外', () => {
  assert.ok(errs(null).length); assert.ok(errs([]).length);
  bad(sc => { sc.scenes = sc.scenes.slice(0, 2); }, /3〜14/);
});
test('lines: 文字数の超過・数でない値・配列でない値', () => {
  bad(sc => { sc.scenes[0].lines = ['あいうえおかきくけこさしすせそ']; }, /文字/);
  bad(sc => { sc.scenes[0].lines = [123, 'x']; }, /文字列の配列/);
  bad(sc => { sc.scenes[0].lines = 'abc'; }, /文字列の配列/);
});
test('部品の名前: 存在しない配置・動き・背景・飾り・アイコン', () => {
  bad(sc => { sc.scenes[0].layers.layout = 'nope'; }, /layout/);
  bad(sc => { sc.scenes[0].layers.motion = 'nope'; }, /motion/);
  bad(sc => { sc.scenes[0].layers.bg = 'nope'; }, /bg/);
  bad(sc => { sc.scenes[0].layers.decor = 'nope'; }, /decor/);
  bad(sc => { sc.scenes[0].layers.icon = 'NoSuchIcon'; }, /icon/);
});
test('layers が{…}でない', () => bad(sc => { sc.scenes[0].layers = 'center'; }, /layers/));
test('素材の番号: 範囲外・素材を使わない配置での pick', () => {
  bad(sc => { sc.scenes[1].layers.pick = [9]; }, /pick/);
  bad(sc => { sc.scenes[0].layers.pick = [1]; }, /pick/);
});
test('数の型: 文字列の hold・bpm・sec・fs は通さない', () => {
  bad(sc => { sc.hold = '0.5'; }, /hold/);
  bad(sc => { sc.bpm = '120'; }, /bpm/);
  bad(sc => { sc.scenes[0].sec = '3'; }, /sec/);
  bad(sc => { sc.scenes[0].fs = 3; }, /fs/);
  bad(sc => { sc.fadeIn = 9; }, /fadeIn/);
});
test('caption は文字列で、16文字以内', () => {
  bad(sc => { sc.scenes[0].caption = 12345; }, /caption/);
  bad(sc => { sc.scenes[0].caption = 'あ'.repeat(17); }, /caption/);
});
test('歌詞: 時刻の型・長さ・重なり・動画の長さの超過', () => {
  bad(sc => { sc.lyrics = [{start: '1', end: 3, text: 'あ'}]; }, /start と end/);
  bad(sc => { sc.lyrics = [{start: 1, end: 3, text: 'あ'.repeat(41)}]; }, /40文字/);
  bad(sc => { sc.lyrics = [{start: 1, end: 5, text: 'あ'}, {start: 3, end: 7, text: 'い'}]; }, /重なっている/);
  bad(sc => { sc.lyrics = [{start: 1, end: 999, text: 'あ'}]; }, /超えている/);
});
test('歌詞の終わりは、動画の長さ(場面の合計 + 余韻 hold)を基準に、検査する', () => {
  const sc = sample(), total = sc.scenes.reduce((a, s) => a + (s.sec || 4), 0);
  sc.hold = 0; sc.lyrics = [{start: 0, end: total + 0.9, text: 'あ'}]; assert.deepEqual(errs(sc), []);
  sc.lyrics = [{start: 0, end: total + 1.1, text: 'あ'}]; assert.ok(errs(sc).length);
});
