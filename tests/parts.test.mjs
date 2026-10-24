import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('PARTS.md が、部品の定義から作った内容と同じ(部品を足したら、npm run parts)', () => {
  const r = spawnSync('node', ['scripts/parts_doc.mjs', '--check'], {cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf-8'});
  assert.equal(r.status, 0, r.stderr);
});
