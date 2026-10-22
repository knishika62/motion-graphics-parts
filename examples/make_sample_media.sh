#!/bin/sh
# サンプル用の素材(色のグラデーションの写真3枚と、テスト映像の動画1本)を、ffmpeg で作る。他人の画像・動画は、使っていない。
#   使い方: sh examples/make_sample_media.sh   → assets/sample/ に作る
set -e
D="$(dirname "$0")/../assets/sample"; mkdir -p "$D"
ffmpeg -v error -y -f lavfi -i "gradients=s=1600x1000:d=1:c0=#ff7a1a:c1=#2a0f3d:x0=0:y0=0:x1=1600:y1=1000" -frames:v 1 "$D/C01.jpg"
ffmpeg -v error -y -f lavfi -i "gradients=s=1000x1400:d=1:c0=#9bff3d:c1=#0e0a1a:x0=0:y0=0:x1=1000:y1=1400" -frames:v 1 "$D/C02.jpg"
ffmpeg -v error -y -f lavfi -i "gradients=s=1400x1000:d=1:c0=#e0409b:c1=#1b0b2e" -frames:v 1 "$D/C03.jpg"
ffmpeg -v error -y -f lavfi -i "testsrc2=s=1280x720:d=6:r=30" -pix_fmt yuv420p "$D/M01.mp4"
echo "作った: $D"
