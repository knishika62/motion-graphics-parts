import test from 'node:test';
import assert from 'node:assert/strict';
import {makeTimeline} from '../scripts/common.mjs';
import {silentNarration} from '../scripts/theme.mjs';
import {text} from './helpers.mjs';

test('makeTimeline: 開始・長さ・合計が、つじつまが合う', () => {
  const beat = 60 / 112.36, beats = [3.228, 4.551, 4.017, 4.922].map(s => s / beat), hold = 0;
  const T = makeTimeline(beats, beat, hold);
  T.starts.forEach((s, i) => { if (i) assert.equal(s, T.starts[i - 1] + T.lens[i - 1]); });
  assert.equal(T.starts.at(-1) + T.lens.at(-1) + Math.round(hold * 60), T.total);
  assert.equal(T.total, Math.round(16.718 * 60));                                   // hold 0 なら、sec の合計ちょうど
  assert.equal(makeTimeline(beats, beat, 0.5).total, T.total + 30);                 // 余韻 0.5秒 = 30フレーム
});
test('描画側(src/timeline.ts)は、計算せず、timeline.json の値だけを読む', () => {
  const ts = text('src/timeline.ts');
  assert.ok(/START_F[^=]*=\s*T\.starts/.test(ts) && /LEN_F[^=]*=\s*T\.lens/.test(ts) && /TOTAL_F[^=]*=\s*T\.total/.test(ts));
  assert.ok(!/acc\s*\+=/.test(ts), 'timeline.ts に、別の計算が残っている');
});
test('silentNarration の seconds は、場面の合計 + hold(最後の余韻)', () => {
  const sc = {scenes: [{lines: []}, {lines: []}, {lines: []}]};
  const r = silentNarration(sc, [3, 4, 5], () => {}, 120, 0);
  assert.equal(r.seconds, 12); assert.equal(silentNarration(sc, [3, 4, 5], () => {}, 120, 1).seconds, 13);
});
