import test from 'node:test';
import assert from 'node:assert/strict';
import {MOODS, buildStyle, contrast} from '../scripts/moods.mjs';

// 保証するのは、文字と背景(7以上。中間の明るさの背景では、白か黒の高い方)・強調色の上に載せる文字(白か黒の、読みやすい方が4以上。src/lib.tsx の onAccent が選ぶ)。強調色を、装飾として背景の上に使う場合は、保証の外(レビュー B4。設計の課題として残している)
for (const id of Object.keys(MOODS)) test(`雰囲気 ${id}: 配色のコントラスト`, () => {
  const st = buildStyle(id, 14);
  for (const [i, c] of (st.palette || []).entries()) {
    const bestInk = Math.max(contrast('#ffffff', c.bg), contrast('#111111', c.bg));           // 中間の明るさの背景は、白でも黒でも7に届かない。そのときは、高い方を使っていること
    assert.ok(contrast(c.ink, c.bg) >= Math.min(7, bestInk) - 0.01, `場面${i + 1}: 文字と背景 ${contrast(c.ink, c.bg).toFixed(2)}(白か黒なら ${bestInk.toFixed(2)})`);
    const best = Math.max(contrast('#ffffff', c.accent), contrast('#111111', c.accent));
    assert.ok(best >= 4, `場面${i + 1}: 強調色の上の文字(白か黒)の、いちばん良いコントラスト ${best.toFixed(2)}`);
  }
});
