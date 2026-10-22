# motion-graphics-parts

**部品を組み合わせて、モーショングラフィックスの動画を作る**ツール。文字・写真・動画・アイコンを動かして見せる動画を、[Remotion](https://www.remotion.dev/)(Reactで動画を作るツール)で、1コマずつ描いて書き出す。

何をどの部品でどう見せるかは、**AI(エージェント)が考える**。AIに [`PARTS.md`](PARTS.md)(部品と使い方)と「お題」を渡すと、AIが台本(`scenario.json`)を書く。このツールは、その台本を、決めたとおりに描く。毎回同じ結果になり、文字や数字は崩れない(生成AI動画との違い)。

- 部品: 配置30種、文字の動き20種、背景28種、強調18種、アイコン約490個、雰囲気11種(配色・書体・場面転換・BGMの曲調)
- 素材: 写真・動画を、場面ごとに指定して使える(大きく敷く・傾いたカード・スマホの枠・コラージュ)。文字の縦位置を選べる(顔に文字がかからない)
- 曲に合わせる: 場面の長さは、秒数のまま(曲の拍に合わせられる)。**歌詞**を、時刻つきで重ねられる(1文字ずつ、7種類の踊り方で、拍に合わせて踊る)。曲の BPM・拍は、`tools/analyze_song.py` で調べられる。黒からの入りと、黒への出(フェード)も指定できる
- BGM: 雰囲気に合う曲を、コードで合成する。自分の曲も使える(`--bgm-file`)
- LLM・クラウド・APIキーは、いらない(書体の初回ダウンロードだけ、ネットワークを使う)

## 使い方

必要なもの: Node.js(v20以上)、ffmpeg(`ffprobe` も)。

```bash
npm install
sh examples/make_sample_media.sh                              # サンプルの素材を作る(assets/sample/)
mkdir -p runs/sample && cp examples/scenario_sample.json runs/sample/scenario.json
node scripts/render.mjs examples/theme_sample.md --name sample   # → out/sample.mp4(約30秒)
```

### AIに作らせる
1. お題のmdを作る(`examples/theme_sample.md` が見本。題名と、使う素材(写真・動画のファイル名)を書く)。
2. 素材を `assets/<名前>/` に置く。
3. **AIに `PARTS.md` を読ませて、お題から、台本 `runs/<名前>/scenario.json` を書かせる**(見本: `examples/scenario_sample.json`)。ファイル操作とシェルが使えるAIなら、2〜4を、AIが行える。
4. `node scripts/render.mjs <お題.md> --name <名前>` で書き出す。
5. 台本の検査(行数・文字数・部品の名前・素材の番号)に通らないと、理由を示して止まる。AIが直して、もう一度実行する。
6. 書き出した動画の一覧画像を見て、直すなら3へ(`PARTS.md` §7)。

**曲に合わせる見本**(歌詞・`bpm`・文字なしの場面・文字の縦位置・`hold`): お題 `examples/music_sample.md`、台本 `examples/scenario_music_sample.json`。
```bash
sh examples/make_sample_media.sh && mkdir -p assets/music runs/music && cp assets/sample/* assets/music/
cp examples/scenario_music_sample.json runs/music/scenario.json
node scripts/render.mjs examples/music_sample.md --name music            # 曲を重ねるなら、--bgm-file 曲.mp3
```

### 実行のオプション
```
node scripts/render.mjs <お題.md> --name <名前> [--mood 型] [--bgm-file 曲.mp3] [--no-bgm] [--opener 型] [--bundled-fonts]
```
- `--mood`: 雰囲気(pop・calm・tech・warm・elegant・fresh・candy・night・party・halloween・bold)。お題のmdの「雰囲気」でも指定できる。
- `--bgm-file`: 自分の曲を使う。曲の BPM と拍を調べて(`python3 tools/analyze_song.py 曲.mp3`)、台本の `bpm`・場面の `sec`・歌詞(`lyrics`)に合わせると、曲に合わせた動画になる(`PARTS.md` §5.9)。
- `--no-bgm`: BGMなし(無音)。
- `--bundled-fonts`: 同梱の書体を優先する(OSによらず、同じ見た目)。

プレビュー(再生しながら確認): `npm run studio`(初回は、仮の台本で起動する)。

### 素材の画像を ComfyUI で作る(任意)
画像を ComfyUI で作るなら、`tools/comfy_generate.mjs` が使える。接続先とワークフローは、決め打ちしない(環境変数と引数で渡す)。ワークフローは、ComfyUI の「Save (API Format)」で保存した JSON で、プロンプト・大きさ・シードのノードは、自動で見つける。
```bash
export COMFYUI_URL=http://ホスト:8188
node tools/comfy_generate.mjs --workflow ワークフロー.json --prompt "..." --out assets/名前/01.jpg            # 1枚
node tools/comfy_generate.mjs --workflow ワークフロー.json --jobs jobs.json --outdir assets/名前           # まとめて(jobs.json: [{"file":"01.jpg","prompt":"...","seed":1}, ...])
```
- 人物を作るときは、プロンプトに `Japanese` など、人種・年齢を明記する。意味のない文字(看板・透かし)が出たら、`no text` を足す。手の指が崩れたら、手の形が単純なポーズ(帽子のつばを持つ、腰に手を当てる、など)にして、ネガティブに `bad hands` などを足す。

### 文字が顔にかかっていないか、自動で調べる(任意。macOS 専用)
```bash
node tools/check_face_text.mjs out/名前.mp4 --every 1.5      # 1.5秒ごとにコマを取り出して、顔と文字の重なりを調べる
```
顔にかかっている時刻と、その文字(「…」かぶり○%)を表示する。かぶり = 顔の面積のうち、文字の枠に隠れている割合(既定のしきい値は 6%)。検出は完全ではない(小さい顔・横顔・飾り文字は、見逃す・誤検出する)ので、最終的には、画像を見て判断する。直すときは、文字の縦位置(`valign`)や歌詞の位置(`pos`)を変える。

## 構成
| 場所 | 内容 |
|---|---|
| `PARTS.md` | 部品と使い方(AI向け)。`npm run parts`(部品の定義から自動生成。部品を足したら作り直す) |
| `scripts/render.mjs` | 書き出しの本体(台本の検査 → 素材 → 描画 → BGM → 音量 → 計測) |
| `scripts/theme.mjs` | お題mdの読み取り、素材の探索、台本の検査 |
| `scripts/layers.mjs`・`icons.mjs`・`moods.mjs` | 部品の定義(配置・動き・背景・強調・歌詞の踊り / アイコン / 雰囲気) |
| `tools/analyze_song.py` | 曲の BPM・拍・歌詞の時刻を調べる(任意。librosa、歌詞は mlx-whisper) |
| `tools/comfy_generate.mjs` | ComfyUI で素材の画像を作る(任意。接続先・ワークフローは、引数・環境変数) |
| `tools/face_boxes.swift` | 画像から、顔の位置を出す(任意。macOS 専用。`layers.iconsAvoid` に使う) |
| `tools/check_face_text.mjs`(+`.swift`) | 書き出した動画で、文字が顔にかかっていないかを調べる(任意。macOS 専用。Vision で、顔と文字を検出) |
| `src/` | Remotion の部品(`compose/`)と、場面の並べ方・場面転換(`Root.tsx`) |
| `examples/` | お題のmdと台本の見本(`theme_sample`・`music_sample`)、サンプル素材の作成スクリプト |
| `assets/<名前>/` | 素材(写真・動画)を置く(git 管理外) |
| `runs/<名前>/` | 台本・ログ・レポート(git 管理外) |
| `out/` | 書き出した動画(git 管理外) |

## 注意
- **Remotion のライセンスは、このリポジトリのMITとは別です。** このツールは Remotion を使います。利用条件は、[Remotion のライセンスのページ](https://www.remotion.pro/license)を参照してください。
- ライセンス: このリポジトリは MIT ライセンスです([LICENSE](LICENSE))。
- 書体は、初回の書き出しで、Google Fonts(OFL ライセンス)の Noto Sans JP・Noto Serif JP・Zen Maru Gothic を、`public/fonts/` にダウンロードします。Mac では、ヒラギノを優先して使います。
- アイコンは [Lucide](https://lucide.dev/)(ISC ライセンス)です。
- このリポジトリには、第三者の画像・動画・音楽は、含めていません(サンプル素材は、`ffmpeg` で作る色のグラデーションとテスト映像)。
- 動作は、macOS で確認しています。Windows・Linux は、未確認です。
- 画像や動画を素材にするときは、その権利に注意してください(他人の画像・動画は、許可なく使わない)。
