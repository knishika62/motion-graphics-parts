import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs} from '../scripts/args.mjs';

test('位置引数・値つきオプション・フラグ', () => {
  const r = parseArgs(['お題.md', '--name', 'foo.md', '--mood', 'pop', '--no-bgm']);
  assert.deepEqual(r.pos, ['お題.md']); assert.equal(r.opts['--name'], 'foo.md'); assert.ok(r.flags.has('--no-bgm'));
});
test('値の指定漏れ(次がオプション・無し)は、止める', () => {
  assert.throws(() => parseArgs(['a.md', '--name', '--mood', 'tech']), /--name/);
  assert.throws(() => parseArgs(['a.md', '--bgm-file']), /--bgm-file/);
});
test('知らないオプション(打ち間違い)は、止める', () => assert.throws(() => parseArgs(['a.md', '--bgm', 'x.mp3']), /知らないオプション/));
