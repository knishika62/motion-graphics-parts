import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {mixBgm} from '../scripts/bgm.mjs';

const have = spawnSync('ffmpeg', ['-version']).status === 0;
const ff = (...a) => spawnSync('ffmpeg', ['-v', 'error', '-y', ...a], {encoding: 'utf-8'});
const maxVol = (file, from) => +(spawnSync('ffmpeg', ['-hide_banner', '-ss', String(from), '-i', file, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], {encoding: 'utf-8'}).stderr.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1] ?? NaN);

test('用意した曲(名前が .bgm.wav で終わっても)は、混合のあとに消えない。短い曲は、繰り返して動画の長さを埋める', {skip: !have && 'ffmpeg が無い'}, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bgmtest-')), mp4 = path.join(dir, 'v.mp4'), track = path.join(dir, 'my.bgm.wav');
  try {
    assert.equal(ff('-f', 'lavfi', '-i', 'color=c=black:s=320x180:r=30:d=6', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '6', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', mp4).status, 0);
    assert.equal(ff('-f', 'lavfi', '-i', 'sine=frequency=440:duration=1.5:sample_rate=48000', track).status, 0);      // 動画(6秒)より短い曲(1.5秒)
    const logs = []; assert.equal(mixBgm(mp4, {moodId: 'pop', track, log: s => logs.push(s), loud: true}), true, logs.join('\n'));
    assert.ok(fs.existsSync(track), '用意した曲が消えた');
    assert.ok(maxVol(mp4, 4.5) > -45, '動画の後半に、曲が繰り返されていない(無音)');
    const d = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], {encoding: 'utf-8'}).stdout; assert.ok(Math.abs(d - 6) < 0.3, `長さ ${d}`);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
test('曲が壊れているときは、false を返し、動画は壊さない', {skip: !have && 'ffmpeg が無い'}, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bgmtest-')), mp4 = path.join(dir, 'v.mp4'), track = path.join(dir, 'broken.mp3');
  try {
    assert.equal(ff('-f', 'lavfi', '-i', 'color=c=black:s=320x180:r=30:d=3', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', mp4).status, 0);
    fs.writeFileSync(track, 'これは音声ではない'); const before = fs.statSync(mp4).size;
    assert.equal(mixBgm(mp4, {moodId: 'pop', track, log: () => {}}), false);
    assert.equal(fs.statSync(mp4).size, before); assert.ok(!fs.existsSync(mp4.replace(/\.mp4$/, '.bgm.mp4')), '一時ファイルが残っている');
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
