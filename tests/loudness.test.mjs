import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLoudnorm} from '../scripts/loudness.mjs';

const ok = '[Parsed_loudnorm_0] \n{\n\t"input_i" : "-19.2",\n\t"input_tp" : "-8.1",\n\t"input_lra" : "3.0",\n\t"input_thresh" : "-29.5",\n\t"target_offset" : "0.4"\n}\n';
test('loudnorm の測定値を、取り出す', () => assert.equal(parseLoudnorm('ffmpeg log...\n' + ok).input_i, '-19.2'));
test('取れないときは、投げずに null', () => {
  for (const s of ['', undefined, 'no json here', '{ broken', '{"input_i": "-inf"}', ok.replace('-19.2', 'nan')]) assert.equal(parseLoudnorm(s), null, String(s));
});
