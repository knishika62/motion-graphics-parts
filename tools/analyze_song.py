#!/usr/bin/env python3
"""曲の BPM と拍の時刻を調べる(任意の道具)。台本の bpm・beatOffset・場面の sec・歌詞の時刻を決めるために使う。

  python3 tools/analyze_song.py 曲.mp3            # BPM と拍の時刻
  python3 tools/analyze_song.py 曲.mp3 --lyrics   # 歌詞の時刻も(音声認識。Apple Silicon の Mac で mlx-whisper)
  python3 tools/analyze_song.py 曲.mp3 --snap 12.0 16.7 21.3   # これらの時刻に、近い拍を探す

必要なもの: pip install librosa    (歌詞: pip install mlx-whisper)
注意: 歌の歌詞は、音声認識で、正確には取れない。時刻の目安として使い、歌詞のテキストは、自分で用意したものを使う。
"""
import argparse, json, sys

ap = argparse.ArgumentParser()
ap.add_argument('song'); ap.add_argument('--lyrics', action='store_true'); ap.add_argument('--snap', type=float, nargs='+', metavar='秒', help='これらの時刻(歌詞の頭など)に、いちばん近い拍の時刻と、拍の番号を表示する'); ap.add_argument('--json', help='結果を、このファイルにも保存する')
ap.add_argument('--model', default='mlx-community/whisper-large-v3-turbo'); ap.add_argument('--lang', default='ja')
a = ap.parse_args()

import librosa, numpy as np
y, sr = librosa.load(a.song, sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
bpm = float(np.atleast_1d(tempo)[0]); beats = [round(float(b), 3) for b in beats]
if not beats: sys.exit('拍を検出できなかった(無音・短すぎる・拍のない音源の可能性)。別の曲で試す')
period = float(np.median(np.diff(beats))) if len(beats) > 2 else 60 / bpm
out = {'duration': round(len(y) / sr, 2), 'bpm': round(bpm, 1), 'beatSeconds': round(60 / bpm, 4), 'medianBeatInterval': round(period, 4), 'beatOffset': beats[0] if beats else 0, 'beats': beats}
print(f"長さ {out['duration']}秒 / BPM {out['bpm']}(1拍 {out['beatSeconds']}秒。拍の間隔の中央値 {out['medianBeatInterval']}秒)/ 最初の拍 {out['beatOffset']}秒 / 拍の数 {len(beats)}")
pb = round(60 / period, 2)       # 拍の間隔の中央値から出した BPM(整数に丸めると、60秒で、0.2秒ほどずれる)
print('台本には: "bpm": %s, "beatOffset": %s   (小数のまま書く)' % (pb, out['beatOffset']))
print('場面の sec は、1拍(%.3f秒。拍の間隔の中央値)の整数倍にすると、切り替えが拍の上に来る。例: 4拍=%.3f秒, 8拍=%.3f秒, 16拍=%.3f秒' % (period, 4 * period, 8 * period, 16 * period))
if a.snap:
    print('--- 近い拍(場面の頭を、この時刻にすると、拍の上で切り替わる。場面の sec = 次の拍の時刻 - この拍の時刻)')
    for t in a.snap:
        if t < 0: print(f'  {t:7.2f}秒 → 負の時刻は使えない'); continue
        k = min(range(len(beats)), key=lambda i: abs(beats[i] - t))
        print(f"  {t:7.2f}秒 → {k + 1}拍目 {beats[k]:.3f}秒(差 {beats[k] - t:+.2f}秒)")
if a.lyrics:
    try:
        import mlx_whisper
    except ImportError:
        sys.exit('歌詞の時刻には mlx-whisper が必要(pip install mlx-whisper。Apple Silicon の Mac)')
    r = mlx_whisper.transcribe(a.song, path_or_hf_repo=a.model, language=a.lang, word_timestamps=True, condition_on_previous_text=False)
    out['lyrics'] = [{'start': round(s['start'], 2), 'end': round(s['end'], 2), 'text': s['text'].strip()} for s in r['segments']]
    print('--- 認識した歌詞(目安。誤認識あり。曲の終わりの「ご視聴ありがとうございました」などは、幻聴)')
    for l in out['lyrics']: print(f"{l['start']:6.2f} {l['end']:6.2f} {l['text']}")
if a.json:
    with open(a.json, 'w', encoding='utf-8') as fp: json.dump(out, fp, ensure_ascii=False, indent=1)
