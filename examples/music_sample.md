# 曲に合わせる見本
> 種類: テーマ動画
> 雰囲気: halloween
> BGM: なし

<!--
  曲(BGM)に合わせて、場面の切り替えと歌詞を出す見本。BGM は、ここでは「なし」にして、書き出したあとに、曲を重ねる(--bgm-file 曲.mp3)か、BGMありにする。
  実行: node scripts/render.mjs examples/music_sample.md --name music --bgm-file 曲.mp3
  台本: examples/scenario_music_sample.json を、runs/music/scenario.json に置く。素材は assets/music/ に置く(make_sample_media.sh で作れる)。
-->

## 概要
曲(112BPM)に合わせた、ハロウィンの短い動画。歌詞を、場面とは別に、時刻つきで出す。

## 素材
- C01.jpg
- C02.jpg
- C03.jpg
- M01.mp4
