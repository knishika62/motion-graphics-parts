<!-- 自動生成: node scripts/parts_doc.mjs 。直接編集しない(部品を足したら作り直す) -->
# 部品と使い方(AIエージェント向け)

**作業するフォルダ**: このファイルがあるフォルダ(コマンドは、ここで実行する)。**見本**: `examples/theme_sample.md`(お題のmd)、`examples/scenario_sample.json`(台本)。**曲に合わせる見本**(歌詞・`bpm`・文字なしの場面・文字の縦位置・`hold`): `examples/music_sample.md`、`examples/scenario_music_sample.json`。

**`runs/`・`out/`・`assets/` の中身は、過去の実行の記録・素材。お題から自分で考えるときは、参考にしない**(中の台本を、見ない・真似しない)。見本は `examples/` だけ。

このファイルを読んだAI(エージェント)が、**お題から、どの部品を、どう組み合わせるかを自分で考え**、台本(`scenario.json`)を書く。描画・音・書き出しは、パイプラインが行う。
資料(LP・製品)の紹介ではなく、「お題(テーマ)」から作る動画(**テーマ動画**)の使い方。例: ハロウィン、季節の挨拶、イベントの告知、作品集。

## 1. 全体の流れ

1. お題のmdを作る(最小で、題名とメタ情報だけ。§2)。
2. 素材(写真・動画)があれば、置く(§3)。
3. **台本 `runs/<名前>/scenario.json` を書く**(§4。部品は§5から選ぶ)。
4. 実行: `node scripts/render.mjs <お題.md> --name <名前>`(§6)。
5. 出力の一覧画像を見て、直すなら3へ戻る(§7)。

**ファイルを作る・コマンドを実行できるAI**(ファイル操作とシェルが使えるエージェント)向け。LLM もネットワークの接続先も、いらない(書体の初回ダウンロードだけ、ネットワークを使う)。必要なのは、node・ffmpeg・Remotion(`npm install` 済み)だけ。ナレーションは付けない(曲・BGMだけ)。

## 2. お題のmd

```markdown
# ハロウィンの夜
> 種類: テーマ動画         ← 必須。これでテーマ動画になる
> 雰囲気: halloween        ← 任意(§5.5の名前。省略は --mood で指定)
> BGM: あり                ← あり(既定。雰囲気に合う曲を、コードで合成)/ なし。自分の曲を使うなら、実行時に --bgm-file 曲.mp3
> 尺: 約20秒               ← 任意(場面に sec が無いときの目安)

## 概要
どんな動画か(自由に。AIが読む)

## 素材
- C01.jpg(仮装した女性の写真)
- M01.mp4(ダンスの動画)
```

- 「素材」の節は、写真・動画の**実際のファイル名**を、使いたい順に書く(名前が違うと、「見つからない」とログに出て、使われない)。かっこの中は、メモ(読まれない)。
- 「素材」の節が無ければ、`assets/<名前>/` の中の画像・動画を、名前順にすべて使う。
- お題のmdは、どこに置いてもよい(例: `examples/`)。実行のコマンドには、そのパスを書く。
- 「## 場面」の節(`examples/テーマ動画_サンプル.md` にある)は、**AIが台本を自分で書くときは、いらない**(組み込みの台本づくりのための指定)。書かなくてよい。

## 3. 素材(写真・動画)

- 置き場所: `assets/<名前>/`(`<名前>` は `--name`)。mdと同じフォルダでも、絶対パスでもよい。
- 写真: png・jpg・jpeg・webp。動画: mp4・webm・mov(**音は消えて再生される**)。
- **番号の数え方(pick で使う)**: 写真は「素材の節に書いた写真の順(1から)」、動画は「動画の順(1から)」。写真と動画は、別々に数える。
  例: 素材が C01.jpg, M01.mp4, C02.jpg, C03.jpg → 写真1=C01、写真2=C02、写真3=C03 / 動画1=M01。
- **台本を書く前に、素材を確認する**: `ls assets/<名前>/` で、ファイル名と、画像か動画かを見る。写真と動画の番号は、上のルールで、自分で決める。
- 素材が一つも無いお題も作れる(文字と図形・アイコンだけ)。
- **素材の画像を、ComfyUI で作る場合**(任意): `tools/comfy_generate.mjs` が使える。接続先とワークフローは、決め打ちしない(環境変数 `COMFYUI_URL` と、引数 `--workflow`。ワークフローは、ComfyUI の「Save (API Format)」で保存した JSON。プロンプト・大きさ・シードのノードは、自動で見つける)。
  ```bash
  export COMFYUI_URL=http://ホスト:8188
  node tools/comfy_generate.mjs --workflow ワークフロー.json --prompt "..." --out assets/<名前>/01.jpg            # 1枚
  node tools/comfy_generate.mjs --workflow ワークフロー.json --jobs jobs.json --outdir assets/<名前>             # まとめて(jobs.json: [{"file":"01.jpg","prompt":"...","seed":1}, ...])
  ```
  - 画像の大きさは、画面(16:9)に合わせる(例: 1536×864)。人物は、プロンプトに、人種・年齢を明記する(例: `Japanese woman in her early 20s`。書かないと、意図しない顔立ちになることがある)。
  - 意味のない文字(看板・透かし)が出たら、`no text`・`no signs` を足して、作り直す。**作った画像は、一覧にして、見てから使う**(歌詞・題材と、色や物が合っているか、顔、手)。
  - 手の指が崩れたときは、手の形が単純なポーズ(帽子のつばを持つ、腰に手を当てる、スカートの端を持つ、など)にして、ネガティブに `bad hands`・`fused fingers` などを足す。腕を大きく広げたポーズは、崩れやすい。直す画像だけ、シードを変えて、作り直す。
- **素材は、ふんだんに使う。** 用意した写真・動画は、どれも、どこかの場面で使う。

## 4. 台本(scenario.json)の形

`runs/<名前>/scenario.json`(`runs/<名前>/` が無ければ作る)。

```json
{
  "title": "ハロウィンの夜",
  "scenes": [
    {
      "tech": "compose",
      "lines": ["Trick or", "Treat?"],
      "caption": "今夜だけ",
      "sec": 3,
      "layers": {"layout": "center", "motion": "elastic", "bg": "stars", "decor": "sparkle", "icon": "Ghost"}
    },
    {
      "tech": "compose",
      "lines": ["仮装で", "集まれ"],
      "sec": 4,
      "layers": {"layout": "left", "motion": "rise", "bg": "photofull", "decor": "none", "icon": null, "pick": [1]}
    }
  ]
}
```

| 項目 | 内容 |
|---|---|
| `tech` | **いつも `"compose"`**(テーマ動画は、これだけ) |
| `lines` | 画面に出す言葉。配置(layout)で、行数と1行の文字数の上限が決まる(§5.1)。**長い言葉は、行を分ける**(例: `["Trick or", "Treat?"]`) |
| `caption` | 画面の下に、小さく出る補足(任意。どの配置でも、同じ位置。16文字以内) |
| `sec` | その場面の秒数(2〜60。**小数でよい**。例: `4.272`)。省略すると、お題の「尺」を場面数で割った秒数。**書いた秒数が、そのまま、場面の長さ**になる(最短は2秒)。全体の長さは、**sec の合計 + 最後の余韻(`hold`。既定0.5秒)**。曲の長さにぴったり合わせたいなら、台本の最上位に `"hold": 0` を書き、sec の合計を曲の長さにする(§5.9) |
| `layers.layout` | 文字の配置・右に出る絵(§5.1)。`none` は、文字なし(`lines` は `[]`)。**`none` のときは、`motion`・`decor`・`valign` は、効かない**(書かなくてよい) |
| `layers.motion` | 文字の動き(§5.2) |
| `layers.bg` | 背景(§5.3) |
| `layers.decor` | 強調の飾り(§5.4) |
| `layers.icon` | 題材の絵(アイコン。§5.6)。無ければ `null` |
| `layers.icons` | アイコンの配列(§5.6)。画面のまわりに出る小さな絵。既定は、拍に合わせて**弾ける**(24個まで) |
| `layers.iconsAvoid` | アイコンに、空けておいてもらう領域 `[[x0,y0,x1,y1], ...]`(0〜1。左上が原点。**写真の顔のあたり**。§5.6) |
| `layers.iconsStyle` | `pop`(拍に合わせて弾ける。既定)/ `float`(ふわふわ漂う。9個まで) |
| `layers.pmotion` | 写真そのものの動き(§5.7.5)。`photofull` / `videofull` のときだけ |
| `layers.pick` | 素材の番号の配列(§3)。素材を使う配置・背景のときだけ(§5.7) |
| `layers.valign` | 文字の縦位置(§5.8): `top` / `bottom`。省略は、配置のまま |
| `layers.tilt` / `layers.scale` / `layers.shift` | 場面の文字全体を、**崩す**(§5.8.5): 傾き(度)・拡大(倍)・ずらし(`[右へ, 下へ]` px) |

場面は、**3〜14個**。音・雰囲気・場面転換は、パイプラインが雰囲気(mood)から決める。

台本の最上位(`scenes` と同じ階層)に、曲・歌詞のための項目を、任意で置ける(§5.9)。

| 項目 | 内容 |
|---|---|
| `bpm` | 曲のテンポ(40〜240)。拍ごとの動き(跳ねる・脈打つ)が、曲の拍に合う。省略は124 |
| `beatOffset` | 最初の拍の時刻(秒。0〜10)。省略は0 |
| `fadeIn` / `fadeOut` | 最初の**黒からの入り**・最後の**黒への出**(秒。0〜5。省略は、どちらも無し)。映像のフェード。曲が、フェードアウトで終わるなら、`fadeOut`(1.5秒ぐらい)も付けると、映像と音が、そろう。`fadeOut` は、動画の最後の部分(`hold` を含む)に、かかる |
| `hold` | 最後の場面の後の余韻(秒。0〜5)。省略は0.5。**曲の長さにぴったり合わせるなら 0** |
| `lyrics` | 歌詞の一覧(§5.9) |
| `lyricKeywords` | 歌詞の中で、色を付ける言葉の配列(例: `["Trick or Love", "仮面"]`) |
| `lyricColor` | その色(例: `"#FFA53A"`)。省略は、雰囲気の強調色 |

## 5. 部品

### 5.1 配置(layout)
文字の置き方と、右側に出る絵。行数・文字数の上限を超えると、検査で止まる。
| 名前 | 行・文字数 | 内容 |
|---|---|---|
| `scatter` | 2〜3行・各行7文字まで | 行ごとに、位置と傾きを変えて、画面に**散らす**(2〜3行・各7文字まで)。にぎやか・楽しい・ポップな話に向く。短い言葉で(読みにくくなる) |
| `wave` | 1〜2行・各行10文字まで | 文字が、**波のように上下に揺れて**並ぶ(1〜2行・各10文字まで)。音楽・リズム・楽しい話に向く |
| `zigzag` | 2〜3行・各行7文字まで | 行が、**左・右・左と交互に寄って**、大きさも変わる(2〜3行・各7文字まで)。動き・勢い・リズムのある話に向く |
| `none` | 0〜1行・各行0文字まで | **文字なし**(lines は空の配列 []。写真・動画だけを見せる場面。歌詞を重ねるときなど) |
| `center` | 1〜2行・各行9文字まで | 中央に大きく(1〜2行) |
| `left` | 2〜3行・各行9文字まで | 左寄せ(2〜3行) |
| `vertical` | 2〜3行・各行8文字まで | 縦組み(2〜3行。右の列から読む) |
| `diagonal` | 1〜2行・各行9文字まで | 少し斜めに(1〜2行) |
| `split` | 2〜2行・各行8文字まで | 左右に分けて(ちょうど2行。対になる2語・2文に向く) |
| `corner` | 2〜2行・1行目9・2行目6文字まで | 1行目は小さな前置き(9文字まで)、2行目は大きな主役(6文字まで) |
| `hero` | 2〜2行・1行目5・2行目12文字まで | 1行目が巨大な主役(5文字まで)、2行目は小さな補足(12文字まで) |
| `stairs` | 2〜3行・各行8文字まで | 階段のようにずらして(2〜3行) |
| `phone` | 1〜3行・各行6文字まで | 左に文字(1〜3行・各6文字まで)、右にスマホの絵(メッセージが届き、既読のチェックが付く)。スマホ・アプリ・通知・連絡の話に向く |
| `pc` | 1〜3行・各行6文字まで | 左に文字(1〜3行・各6文字まで)、右にパソコンの画面の絵(一覧にチェックが付く)。管理画面・設定・一覧・業務ツールの話に向く |
| `mail` | 1〜3行・各行6文字まで | 左に文字、右に封筒の絵(開いて手紙が出て、既読のチェックが付く)。メール・お知らせ・連絡・配信の話に向く |
| `shield` | 1〜3行・各行6文字まで | 左に文字、右に盾の絵(チェックが描かれる)。安全・セキュリティ・暗号化・守る・信頼の話に向く |
| `people` | 1〜3行・各行6文字まで | 左に文字、右に、中心から5人へ届いて1人ずつ既読になる絵。全員・一斉・複数人・社員・メンバー・配信の話に向く |
| `clock` | 1〜3行・各行6文字まで | 左に文字、右に回る時計の絵。すぐ・即日・短時間・時間・期限・自動で の話に向く |
| `steps` | 1〜3行・各行6文字まで | 左に文字、右に、1・2・3と順に進む手順の絵。導入手順・流れ・ステップ・かんたんの話に向く |
| `disc` | 1〜3行・各行6文字まで | 左に文字、右に回るレコード盤と漂う音符。音楽・ダンス・リズム・歌・曲・BGM・音の話に向く |
| `eq` | 1〜3行・各行6文字まで | 左に文字、右に大きなイコライザ(音の波が踊る)。音・サウンド・音楽・ライブ・盛り上がるの話に向く |
| `code` | 1〜3行・各行6文字まで | 左に文字、右にコードエディタ(コードが打たれていく)。プログラム・開発・API・自動化・システムの話に向く |
| `match` | 1〜3行・各行6文字まで | 左に文字、右に、2人がハートでつながる絵。出会い・恋愛・相性・人と人のつながり・紹介の話に向く |
| `jobmatch` | 1〜3行・各行6文字まで | 左に文字、右に、求職者のカードと仕事のカードが近づいてつながり、マッチ成立のチェックが付く絵。求人・採用・転職・人材・ジョブマッチング・仕事探しの話に向く |
| `house` | 1〜3行・各行6文字まで | 左に文字、右に、家の窓に明かりがつく絵。不動産・住まい・物件・暮らし・家の話に向く |
| `bottle` | 1〜3行・各行6文字まで | 左に文字、右に、化粧品のボトルときらめき。化粧品・美容・スキンケア・コスメ・香り・商品の話に向く |
| `pic` | 1〜3行・各行6文字まで | 左に文字、右に**用意した写真1枚**が、傾いたカードで現れる。人・商品・場所・雰囲気を見せたい場面に向く。写真の素材があるときだけ使える |
| `pics` | 1〜3行・各行6文字まで | 左に文字、右に**用意した写真3枚**のコラージュ(にぎやか・種類が多い・たくさん)。写真の素材があるときだけ使える |
| `clip` | 1〜3行・各行6文字まで | 左に文字、右に**用意した動画**がスマホの枠の中で再生される。作品・映像・ダンスなど、動きのあるものを見せたい場面に向く。動画の素材があるときだけ使える |
| `clips` | 1〜3行・各行6文字まで | 左に文字、右に**用意した動画3本**が、3つのスマホの枠で並んで再生される(にぎやか・作例がたくさん)。動画の素材があるときだけ使える |


### 5.2 文字の動き(motion)
| 名前 | 内容 |
|---|---|
| `wave` | 波打つ |
| `rise` | 下から浮かび上がる |
| `elastic` | ぷるんと弾んで現れる(楽しい) |
| `swing` | 振り子のように揺れて止まる |
| `slide` | 左からスライドして入る |
| `pulse` | 呼吸のようにゆっくり拡大縮小 |
| `glitch` | 乱れて整う(デジタル・システム) |
| `wobble` | ゆらゆら揺れる(やわらかい) |
| `zoomout` | 大きく現れて収まる(インパクト) |
| `stagger` | 1文字ずつ静かに現れる(上品) |
| `tilt` | 斜めに流れ込む(軽快) |
| `dance` | 1拍ごとに跳ねて、ゆらゆら踊る(音楽・ダンス・楽しい) |
| `beatbounce` | 拍ごとに、ぽんと膨らむ(リズム・音楽・元気) |
| `bounce` | 1文字ずつ跳ねる |
| `flip` | 1文字ずつ回って現れる |
| `shake` | ぶるっと揺れて止まる(衝撃・強調) |
| `spin` | 回りながら現れる |
| `scramble` | 書体が切り替わりながら確定する |
| `drop` | 上から落ちてくる |
| `float` | ふわふわ浮かぶ(穏やか) |

### 5.3 背景(bg)
| 名前 | 内容 |
|---|---|
| `plain` | 無地 |
| `dots` | ドット |
| `stripes` | 斜めの縞 |
| `grid` | 方眼 |
| `blobs` | ゆるい丸 |
| `rays` | 放射線 |
| `waves` | 波 |
| `checker` | 市松 |
| `gradient` | グラデーション |
| `hex` | 六角形(技術的) |
| `rings` | 広がる波紋 |
| `zigzag` | ジグザグ(にぎやか) |
| `plus` | プラスの模様 |
| `stars` | またたく星(華やか・夜) |
| `bubbles` | 浮かぶ泡(爽やか・やさしい) |
| `circuit` | 回路(IT・技術) |
| `lines` | ノートの罫線(学び・解説) |
| `spotlight` | スポットライト(注目・上品) |
| `sunburst` | 光の放射(祝福・主役) |
| `dotwave` | 波打つ点(やわらかい・動き) |
| `photo` | 用意した写真を、ぼかして敷く(写真の素材があるときだけ) |
| `video` | 用意した動画を、ぼかして敷く(動画の素材があるときだけ) |
| `notes` | 音符が昇る(音楽・ダンス・歌) |
| `equalizer` | イコライザの棒(音・音楽・ライブ) |
| `soundwave` | 音の波形(音声・音・録音) |
| `disco` | 回る色とりどりの光(ダンス・パーティー・ライブ・お祝い) |
| `photofull` | **写真を、ぼかさず大きく**画面いっぱいに敷く(文字は白)。写真が主役の場面に向く |
| `videofull` | **動画を、ぼかさず大きく**画面いっぱいに敷く(音なし。文字は白)。動画が主役の場面に向く |

### 5.4 強調の飾り(decor)
| 名前 | 内容 |
|---|---|
| `none` | なし |
| `underline` | 下線 |
| `marker` | 最後の行に蛍光ペン |
| `circle` | 丸で囲む |
| `arrow` | 矢印 |
| `stamp` | 判子 |
| `checks` | チェックの列 |
| `brackets` | かぎ括弧で囲む |
| `confetti` | 紙吹雪(お祝い・明るい話) |
| `sparkle` | きらめき(良い成果・おすすめ) |
| `burst` | 放射線(強調・注目) |
| `tape` | マスキングテープ(手作り感・メモ) |
| `wavy` | 波線の下線(親しみ) |
| `speech` | 吹き出しで囲む(会話・声) |
| `cursor` | クリックするカーソル(操作・申込・ボタン) |
| `ribbon` | 角のリボン(おすすめ・新着) |
| `notes` | 音符が文字のまわりに弾ける(音楽・ダンス・歌) |
| `equalizer` | 文字の下で踊るイコライザ(音・音楽) |

### 5.5 雰囲気(mood)
配色・書体・場面転換・動きの強さ・BGMの曲調が、まとまって決まる。お題のmdの「雰囲気」か、`--mood` で指定する。
| 名前 | 内容 |
|---|---|
| `pop` | 元気で楽しい。にぎやかな紹介・ニュース・新機能向き(標準の配色) |
| `calm` | 落ち着いて、やさしい。ていねいな解説・読み物・暮らしや健康向き |
| `tech` | クールで知的。**IT・開発・データ・AI の専門家向け**の技術解説向き(読み手がITに不慣れな一般の人・事務の人なら、選ばない) |
| `warm` | あたたかく親しみやすい。人・食・教育・地域・イベント向き |
| `elegant` | 上品で静か。ビジネス・ブランド・文化・歴史向き |
| `fresh` | 爽やかで軽い。新しいサービス・アプリ・若い人向け・健康や教育の明るい話 |
| `candy` | ポップでカラフル。子ども・イベント・食・エンタメ・キャンペーン向き |
| `night` | 暗い背景で、クールに見せる。夜・ゲーム・音楽・先端技術・映像のように、暗い画面が似合う題材向き(読み手が一般の人・事務の人でも、題材が夜や先端のイメージなら可) |
| `party` | 音楽・ダンス・ライブ・パーティー・エンタメ・映像制作・クリエイティブ・ファッション向け。暗い背景に、蛍光色のように鮮やか。音符が飛んで文字が決まる冒頭 |
| `halloween` | ハロウィン。暗い紫と黒の背景に、オレンジ・蛍光グリーン・赤紫が映える。仮装・パーティー・秋の夜・おばけ・お菓子のように、楽しく、少し不気味なテーマ動画向き(PR・資料の紹介には向かない) |
| `bold` | 力強く主張が強い。速報・広告・セール・スポーツ向き |

### 5.6 アイコン(icon)
次の名前から選ぶ(これ以外は、検査で止まる)。題材に合うものを、場面に1つ。
- **連絡・通知**: Mail MailOpen MailCheck MessageSquare MessageCircle MessagesSquare Phone PhoneCall Bell BellRing Send Inbox Megaphone Radio AtSign
- **人・組織**: User Users UserCheck UserPlus UserRound Building Landmark Store Factory Briefcase Handshake Contact
- **端末・IT**: Smartphone Monitor Laptop Tablet Server Cloud CloudUpload Wifi Globe QrCode Printer Keyboard HardDrive Cpu Database Code Terminal Bot Brain Zap Plug
- **データ・グラフ**: ChartBar ChartLine ChartPie ChartColumn ChartArea TrendingUp TrendingDown Activity Gauge Table Percent Hash Calculator
- **確認・状態**: Check CircleCheck CheckCheck SquareCheck Eye EyeOff Clock Timer Hourglass Calendar CalendarCheck TriangleAlert Info CircleQuestionMark Flag BadgeCheck ListChecks ClipboardCheck ScanEye
- **安全**: Lock LockKeyhole Shield ShieldCheck Key FingerprintPattern ScanFace
- **文書・メディア**: File FileText Files Folder FolderOpen Paperclip Download Upload Share2 Link BookOpen Book Notebook Newspaper Presentation Image Video Camera Mic Music
- **お金・買い物**: JapaneseYen Coins CreditCard Wallet Banknote Receipt Tag ShoppingCart Gift PiggyBank
- **目標・成長**: Target Rocket Trophy Medal Star Heart ThumbsUp Lightbulb Flame Sparkles Crown Award Mountain Compass Map MapPin
- **操作・道具**: Settings Wrench Hammer Pencil Scissors Search Funnel SlidersHorizontal RefreshCw RotateCcw Play Power ToggleRight MousePointerClick Hand Layers LayoutGrid
- **生活・自然**: House Car Plane TrainFront Bike Utensils Coffee Sun Moon Umbrella Leaf TreePine Droplet Wind
- **医療・福祉・教育**: Stethoscope Pill HeartPulse Syringe Accessibility Baby GraduationCap School Library Ruler
- **連絡・通知(追加)**: BellOff BellDot MailPlus MailQuestionMark MessageSquareText MessageSquareMore MessageCircleHeart Voicemail Rss Siren Speech Ear Headphones Headset
- **人・組織(追加)**: UserCog UserRoundCheck UsersRound CircleUser IdCard Network Workflow Waypoints Hospital Hotel Warehouse Castle Church Tent
- **端末・IT(追加)**: Smartphone SmartphoneNfc TabletSmartphone MonitorSmartphone MonitorCheck LaptopMinimal Watch Webcam Router Bluetooth Usb Binary Braces FileCode GitBranch Bug Blocks Boxes Component Container CloudCheck CloudDownload ServerCog Radar Satellite SatelliteDish
- **データ・グラフ(追加)**: ChartNoAxesColumn ChartNoAxesCombined ChartScatter ChartSpline ChartCandlestick ChartGantt ChartNetwork ChartBarBig ChartNoAxesGantt Sigma Binoculars ListOrdered ListTodo Scale Ratio
- **確認・状態(追加)**: CircleAlert CircleX ShieldAlert Ban Bookmark BookmarkCheck CalendarClock CalendarDays CalendarRange Hourglass Loader Milestone OctagonAlert Siren SquareCheckBig Stamp TimerReset BadgeAlert BadgeInfo ClockAlert
- **安全(追加)**: ShieldOff ShieldQuestionMark ShieldEllipsis KeyRound KeySquare LockOpen LockKeyholeOpen ScanLine Vault Eye Glasses Siren Shell
- **文書・メディア(追加)**: FileCheck FileSearch FileLock FilePlus FileClock FileSpreadsheet FileImage FileBadge FolderCheck FolderLock FolderSearch Archive ArchiveRestore BookCheck BookUser Clipboard ClipboardList ClipboardPen ScrollText StickyNote Sticker Film Clapperboard Tv Radio Presentation Signature
- **お金・買い物(追加)**: BadgeJapaneseYen BadgeDollarSign BadgePercent HandCoins HandHeart Handshake CircleDollarSign CirclePercent ReceiptText Store ShoppingBag ShoppingBasket Package PackageCheck PackageOpen Truck Container Barcode Ticket TicketCheck Gem
- **目標・成長(追加)**: Goal Flag FlagTriangleRight Telescope PartyPopper Cake Heart HeartHandshake ThumbsUp Rainbow Sprout Clover Cherry Shapes Wand BicepsFlexed Dumbbell Footprints Anchor Medal Podium
- **操作・道具(追加)**: MousePointer Pointer PointerOff Cog Wrench Drill Hammer Axe Pickaxe Shovel Paintbrush PaintBucket Palette Pipette Ruler PenTool PenLine Eraser Highlighter Type TextCursorInput Command Plus Minus X ArrowRight ArrowUpRight ArrowBigRight MoveRight Repeat Shuffle Undo2 Redo2 Maximize Expand
- **生活・自然(追加)**: Bed Sofa Lamp Shirt Bike Bus Ship Sailboat Fuel Tractor Wheat Apple Carrot Pizza Soup Salad Cookie Beer Wine Milk Egg Fish Beef Hamburger Croissant CupSoda Mountain MountainSnow Sunrise Sunset Cloudy CloudRain Snowflake Thermometer Flower Flower2 Cat Dog Bird PawPrint Bone
- **医療・福祉・教育(追加)**: Ambulance Bandage Cross Dna Microscope TestTube FlaskConical Atom Brain BrainCircuit Activity Baby Bath Hand HandHelping Heart HeartPulse Bean PencilRuler Backpack NotebookPen Languages Globe Earth
- **業種・サービス**: HardHat Construction Ruler Forklift Warehouse Truck Plane Hotel Utensils ChefHat Scissors Brush Dumbbell Trophy Clapperboard Drama Gamepad2 Joystick Puzzle Dices Banknote Scale Gavel Briefcase BriefcaseBusiness Library University Landmark Newspaper Radio
- **音楽・ダンス**: Music Music2 Music3 Music4 Disc Disc2 Disc3 Headphones Mic MicVocal Radio Speaker Volume2 AudioLines AudioWaveform Guitar Piano Drum ListMusic PersonStanding Footprints PartyPopper Sparkles Heart HeartPulse Drama Theater
- **AI・先端**: Bot BotMessageSquare Brain BrainCircuit Cpu Sparkles Wand WandSparkles Zap Atom Network Workflow Lightbulb Eye ScanFace MessageSquareText Orbit Rocket
- **映像・写真**: Video Videotape Film Clapperboard Camera Aperture Image Images ImagePlay Play Pause Tv MonitorPlay Projector Clapperboard ScanLine Focus Frame Crop Palette Layers SquarePlay
- **プログラム・制作**: Code CodeXml Terminal SquareTerminal FileCode GitBranch GitCommitHorizontal GitPullRequest Bug Braces Binary Blocks Boxes Component Cog Wrench Webhook Globe LayoutTemplate LayoutDashboard PanelsTopLeft Paintbrush PenTool Brush
- **マッチング・人材**: Handshake HeartHandshake Users UsersRound UserPlus UserCheck UserSearch Contact IdCard Briefcase BriefcaseBusiness Search Link Link2 Puzzle Magnet Target Heart MessageCircleHeart GraduationCap BadgeCheck
- **不動産・住まい**: House Building Warehouse Hotel Landmark Store Key KeyRound DoorOpen DoorClosed Bed Sofa Lamp Fence MapPin Map Ruler Hammer HardHat Construction Trees TreePine
- **季節・行事・ハロウィン**: Ghost Skull Candy CandyCane Lollipop Cookie Moon MoonStar Cat Bone Flame WandSparkles Castle Cloudy Biohazard Gift Cake PartyPopper Snowflake Leaf Flower Sun Sparkles Crown Gem Star Heart Drama
- **美容・製品**: Sparkles Sparkle Gem Crown Flower Flower2 Leaf Droplet Droplets Heart Star Palette Brush Scissors SprayCan Package PackageOpen Gift ShoppingBag ShoppingCart Tag Ticket Award Medal

**アイコンを、いくつも出す(`layers.icons`)**: `layers.icon`(1つ)に加えて、`layers.icons`(配列)を書くと、**画面のまわりに、小さな絵**が、1つずつ順に出る(場面ごとに、数・位置が変わる)。名前は、上の一覧から選ぶ(同じ名前を、何度書いてもよい)。動きは、`layers.iconsStyle` で選ぶ:
  - `pop`(既定): **ぽんっと出て、曲の拍に合わせて、跳ねる・膨らむ・傾く**(拍のずれは、絵ごとにばらばら)。**位置・大きさ・色は、ばらばら**(乱数。場面ごとに決まる値なので、何度書き出しても同じ。数や名前を変えると、配置が変わる。絵どうしは、一定の間隔を空ける)。**24個まで**。アップテンポ・ポップ・楽しい曲に向く。にぎやかにしたいときは、**10〜20個**。数は、場面ごとに変えて(静かな場面は少なく、サビは多く)、メリハリを付ける。
  - `float`: 画面のまわりを、ふわふわ漂う。**9個まで**(4〜5個が見やすい)。静かな曲・やさしい雰囲気に向く。
  - 拍に合わせるので、台本の `bpm` と、場面の頭が拍の上にあること(§5.9)が、前提。
  - **数を増やすと、写真の人物の顔に、アイコンがかかる**。アイコンは、文字・丸バッジ・右側の絵は避けるが、**写真の中身は、見ていない**。顔の位置を、`layers.iconsAvoid`(`[[x0,y0,x1,y1]]`。0〜1。左上が原点)で伝えると、その領域を空ける。顔の位置は、**`swift tools/face_boxes.swift assets/<名前>/*.jpg`**(macOS 専用。Vision)で、画像ごとに、`[x0,y0,x1,y1]` が出る。それを、顔より**一回り(1.6倍ぐらい)大きく**して(写真の動き `pmotion` で、顔が、少し動くため)、`iconsAvoid` に書く。顔が見つからない画像(物の写真など)は、指定しなくてよい。
```json
"layers": {"layout": "none", "bg": "photofull", "icon": "Ghost", "icons": ["Ghost", "Candy", "Moon", "Cat", "Sparkles"], "pick": [1]}
```
- **`layout: "none"`(文字なし)の場面でも、`icon` と `icons` は出せる**(写真だけの場面に、題材の絵を添えたいとき)。`icon` は、右の丸バッジとして出る。
- **まわりの絵は、丸バッジ(`icon`)・場面の文字・右側の絵(スマホ・写真など)に重ならない置き場所だけに、自動で置かれる**(`pop` は、乱数で置く。`float` は、置き場所が16箇所で、丸バッジから遠い順に使う。どちらも、絵どうしは、重ならない間隔)。**文字が大きい・行が多い配置では、使える場所が減るので、書いた数より少なく出ることがある**(足りないぶんは、出ない。重ねない)。
- 写真の主役(顔)が、画面の端にいるときは、まわりの絵が、顔にかかることがある(写真の中身は、見ていない)。そのときは、数を減らすか、`icon` だけにする。

### 5.7 素材を使う配置・背景
| 使い方 | layout / bg | pick |
|---|---|---|
| 写真を、画面いっぱいに(文字は白) | bg: `photofull` | `[写真の番号]` |
| 動画を、画面いっぱいに(文字は白) | bg: `videofull` | `[動画の番号]` |
| 写真を、傾いたカードで(右側) | layout: `pic`(1枚)/ `pics`(3枚) | `[番号]` / `[番号, 番号, 番号]` |
| 動画を、スマホの枠の中で(右側) | layout: `clip`(1本)/ `clips`(3本) | 同上(動画の番号) |
| 写真・動画を、ぼかして背景に | bg: `photo` / `video` | `[番号]` |

`pick` を省略すると、場面の番号に応じて、素材が自動で選ばれる(思った素材にならないので、**素材を使う場面は、pick を書く**)。`pic`/`clip` 系の場面の `bg` は、背景が主張しない(`plain`・`gradient` など)ものにすると、素材が引き立つ。

### 5.7.5 写真そのものの動き(layers.pmotion)
`bg` が `photofull` / `videofull`(素材を画面いっぱいに敷く場面)のとき、**写真そのものの動き**を選べる。省略は `zoom`。
| 名前 | 内容 |
|---|---|
| `zoom` | ゆっくり寄る(静か・既定) |
| `zoomout` | 寄った状態から引く(場面の終わり・余韻) |
| `pan` | 横に流れる(視線を誘導) |
| `tilt` | 縦に流れる(見上げる・見下ろす) |
| `kenburns` | 寄りながら斜めに流れる(映画的) |
| `sway` | ゆらりと傾く(ゆれて揺れる) |
| `beat` | 拍ごとに弾む(音楽・リズム) |
| `breathe` | 呼吸のように拡大縮小(穏やか) |
| `rise` | 下からせり上がる(登場・期待) |
| `punch` | ぐっと寄って落ち着く(衝撃・始まり) |
| `drift` | 斜めに漂う(ゆったり流れる) |

- **同じ動きが続くと、単調に見える。** 場面ごとに、違う動きを選ぶ(`zoom` → `pan` → `kenburns` → `beat` → `zoomout` のように)。
- 曲に合わせる動画なら、サビや盛り上がりの場面に `beat`(拍ごとに弾む)、最後の場面に `zoomout`(引いて余韻)が向く。
- 倍率は控えめ(1.0〜1.24倍)。文字が読めなくなるほど寄らない。

### 5.8 文字の縦位置(layers.valign)・文字のない場面
写真の顔や主役に、文字がかからないようにする。
| 値 | 内容 |
|---|---|
| `top` | 文字を、画面の上に寄せる(下の主役・顔を見せたいとき) |
| `middle` | 配置のまま(省略と同じ) |
| `bottom` | 文字を、画面の下に寄せる(上の主役・顔を見せたいとき。caption は、上に出る) |

- **`valign` は「場面の文字(lines)」の位置、`lyrics` の `pos` は「歌詞」の位置で、別のもの**(§5.9)。同じ場面で、場面の文字を `valign: "top"` にして、歌詞を `pos: "bottom"`(既定)にすると、上下に分かれて、重ならない。
- `valign` は、配置(layout)の文字だけを動かす。アイコンの台は、下の歌詞の帯と重ならない位置へ逃げる。`bottom` のとき、`caption` は上に出る。
- **文字のない場面**は、layout を `none` にして、`lines` を空の配列 `[]` にする(写真・動画だけを見せる。歌詞だけを重ねる場面に使う)。

### 5.8.5 配置を崩す(整った感じを、場面ごとに外す)
整った配置ばかりが続くと、単調に見える。次の2つで、崩せる。
1. **崩す配置**を選ぶ(§5.1): `scatter`(行ごとに位置と傾きを変えて散らす)、`wave`(文字が波のように上下に揺れる)、`zigzag`(行が左・右・左と交互に寄って、大きさも変わる)。ほかに、`diagonal`(斜め)、`stairs`(階段)、`corner`・`hero`(大小の差)も、崩れた感じが出る。
2. **場面の文字全体に、傾き・拡大・ずらし**を指定する(どの配置にも使える。文字の枠の中心が、基準):
| 項目 | 内容 | 範囲 |
|---|---|---|
| `layers.tilt` | 傾き(度)。右へ傾けるなら、正の数 | -25〜25 |
| `layers.scale` | 拡大・縮小(倍) | 0.5〜1.8 |
| `layers.shift` | ずらし `[右へ, 下へ]`(px。負の数は、左・上) | -600〜600 |

```json
"layers": {"layout": "left", "motion": "rise", "bg": "photofull", "pick": [2], "tilt": -6, "scale": 1.15, "shift": [60, -40]}
```
- **適用の順**: 拡大・傾き・ずらし(`shift`)が先、`valign`(上・下)が後。`valign` を指定すると、縦の位置は `valign` が決める(`shift` の下への値は、打ち消される。右への値は、効く)。
- **崩しすぎない**: 傾きは±8度ぐらいまで、拡大は0.8〜1.3倍ぐらいが、読みやすい。文字が画面の端からはみ出さないか、確認する(§7)。**隣り合う場面で、崩し方を変える**(全部の場面を崩さず、整った場面と、崩れた場面を混ぜる)。
- 歌詞(`lyrics`)は、別の層なので、この指定の影響を受けない。

### 5.9 曲に合わせる・歌詞(lyrics)
曲(BGM)があるときは、台本の最上位に `lyrics`(歌詞)を置ける。歌詞は、場面とは別に、**時刻つき**で重なる。動く見本: `examples/scenario_music_sample.json`(お題は `examples/music_sample.md`)。
```json
"bpm": 112, "beatOffset": 0.07,
"lyricKeywords": ["Trick or Love"],
"lyrics": [
  {"start": 0.1, "end": 3.0, "text": "鏡の前で仮面をつけて", "fx": "bounce"},
  {"start": 16.7, "end": 21.0, "text": "Trick or Love", "big": true, "fx": "wave"}
]
```
| 項目 | 内容 |
|---|---|
| `start` / `end` | 出る時刻・消える時刻(秒)。動画の先頭が0。同じ位置の歌詞は、時刻を重ねない |
| `text` | 歌詞(40文字以内。長いものは、行を分けて、別の歌詞にする) |
| `fx` | 文字の入り方・踊り方(下の表)。省略は `bounce` |
| `pos` | 位置(下の表)。省略は、ふつうの歌詞が `bottom`、`big` が `middle`。`big` でも、`pos` で、上・下に変えられる |
| `big` | `true` で、大きく(サビ・フックの言葉。1行・短く)。既定の位置は、画面の中央 |

歌詞の `fx`(1文字ずつ、順に入り、そのあとも、拍に合わせて踊る):
| 名前 | 内容 |
|---|---|
| `bounce` | 下から跳ね上がる。拍で跳ねる |
| `drop` | 上から落ちてくる |
| `spin` | 回りながら現れる |
| `wave` | 波のように揺れ続ける(サビ・盛り上がり) |
| `swing` | 振り子のように揺れる |
| `slide` | 左右から滑り込む |
| `scale` | 大きく現れて縮む。拍で脈打つ |

歌詞の `pos`:
| 名前 | 内容 |
|---|---|
| `bottom` | 画面の下(既定) |
| `middle` | 画面の中央 |
| `top` | 画面の上 |

**歌詞が、顔にかからないように**: 画面の中央(`big` の既定)・下(ふつうの歌詞の既定)・上、の3か所から選べる。顔が、画面の中央にある写真の場面で、`big` を使うなら、`pos` を `top` か `bottom` にするか、顔が高い位置にある写真の場面を選ぶ。

**場面の切り替えは、台本の時刻より、わずかに遅れて見える**(切り替えの効果が、約0.4秒かかるため)。歌詞の頭は、**場面の頭より0.2〜0.3秒遅らせる**と、新しい写真が見えてから、歌詞が出る。

**画像は、縦横比にかかわらず、画面いっぱいに敷かれ(`photofull`)、はみ出す部分は切れる**(中央を基準)。顔が端にある写真は、切れることがある。一覧画像で確かめる。

**曲に合わせる手順**
1. 曲の BPM と拍の時刻を調べる(`tools/analyze_song.py`。§6)。`bpm` と `beatOffset` に書く。
2. **場面の切り替えを、拍の位置に合わせる**: 場面の `sec` を、1拍(60÷bpm 秒)の整数倍にして、場面の頭が、拍の上に来るようにする。歌詞の内容に合わせた切り替えにしたいときは、その時刻に近い拍を選ぶ。**近い拍は、`python3 tools/analyze_song.py 曲.mp3 --snap 12.0 16.7 21.3` で探せる**(歌詞の頭の時刻を並べる)。例: 12.0秒の歌詞 → 24拍目(11.796秒)、16.7秒 → 33拍目(16.718秒)。**場面の頭を、これらの拍の時刻に置く**: 場面1の sec = 11.796、場面2の sec = 16.718 - 11.796 = 4.922、のように、拍の時刻の差を、sec にする(時刻は、小数のまま書いてよい)。
   - 曲の長さにぴったり合わせたいなら、sec の合計を曲の長さ(例: 60.0)にして、`"hold": 0` を書く。
3. 歌詞を、聞き取れた時刻に合わせて `lyrics` に書く。
   - **音声認識(`--lyrics`)の文字は、歌詞とは違う**(誤認識が多い)。時刻の目安として使い、`text` は、手元の歌詞から取る。認識した行と、歌詞の行は、**順番と、似た言葉**で対応づける(例: 認識「昔より君が欲しい」→ 歌詞「お菓子より君が欲しい」)。
   - 曲が、歌詞の一部しか歌っていないこともある。聞き取れなかった行は、前後の行の時刻の間に、画像の内容に合わせて、おおよその時刻に置く。
   - 曲の終わりの「ご視聴ありがとうございました」などは、認識の誤り(幻聴)。無視する。
4. 書き出しで、曲を重ねる: `--bgm-file 曲.mp3`(BGM の合成はしない)。

## 6. 実行

```bash
node scripts/render.mjs <お題.md> --name <名前> [--mood 型] [--bgm-file 曲.mp3] [--no-bgm]
```
- 上の `runs/<名前>/scenario.json` を使う。`--mood 型` で、雰囲気を上書きできる(お題のmdの「雰囲気」も、--mood も無ければ `pop`)。
- 場面の秒数(`sec`)で、尺が決まる。BGM(雰囲気に合う曲を、コードで合成)がつく。自分の曲(60秒など)を使うなら `--bgm-file`。曲に合わせて切り替えたいときは、曲の拍に合わせて、場面の `sec` を決める。
- ナレーションには、対応していない。
- **曲の分析(任意)**: `python3 tools/analyze_song.py 曲.mp3` で、BPM と拍の時刻(`beats`)を表示する。`pip install librosa` が必要。歌詞の時刻も調べたいときは、`--lyrics`(`pip install mlx-whisper`。Apple Silicon の Mac)を付ける。
- **道具(任意)**: 曲の分析 `tools/analyze_song.py`(上)、画像づくり `tools/comfy_generate.mjs`(§3)、文字が顔にかかっていないかの確認 `tools/check_face_text.mjs`(§7)。
- 台本の検査(§4・§5)に通らないと、**理由を示して止まる**。直して、同じコマンドをもう一度。
- 約1〜3分。出力: `out/<名前>.mp4`、`runs/<名前>/`。
- 実行中は、`src/` と `scripts/` を編集しない。

## 7. 確認(必ず、画像を見る)

```bash
ffmpeg -i out/<名前>.mp4 -vf "fps=16/<秒数>,scale=480:-2,tile=4x4" -frames:v 1 runs/<名前>/sheet.png
```
- 文字のはみ出し・重なり、素材の顔や主役が切れていないか、文字が読めるか(写真の上は白文字)。
- 隣の場面で、同じ配置・同じ動きが続いていないか。素材を使い切っているか。
- ログに `テーマ動画の台本の検査OK` が出ていること。
- **文字が顔にかかっていないかは、自動でも調べられる**(macOS 専用): `node tools/check_face_text.mjs out/<名前>.mp4 --every 1.5`。1.5秒ごとにコマを取り出して、顔と文字を検出し、重なっている時刻と、その文字(かぶり○%。顔の面積のうち、文字の枠に隠れている割合。既定のしきい値は6%)を表示する。人物のアップの場面では、下の歌詞(`pos: bottom`)が、あごにかかりやすい。かかっていたら、歌詞の `pos` を `top` にする、場面の文字の `valign` を変える、大きな文字(`big`)の `pos` を変える、写真を、顔が高い位置にあるものにする。検出は完全ではない(小さい顔・横顔・飾り文字は、見逃す・誤検出する)ので、最終的には、画像を見て判断する。
- 計測の「画面の端への文字のはみ出し」は、動画を大きく敷く場面(`videofull`)で、動画の中の物を数えて、誤検出することがある。画像を見て判断する。
- `pics`(写真3枚)は、文字の右端が、写真のカードに少し触れることがある。文字を短くするか、`pic`(1枚)にする。

## 8. 組み立てのコツ

- **1場面に、1つのメッセージ。** 言葉は短く、キャッチコピーのように。
- 最初の場面は、一目で何の動画か分かるつかみ。最後の場面は、明るい締め。
- **隣り合う場面で、配置(layout)・動き(motion)・背景(bg)を変える。** 同じ型を続けない。
- **お題に意味のある部品だけ**使う(題材と関係ない飾りは入れない)。雰囲気(mood)は、お題に合うものを1つ選ぶ。
- 文字は、出そろったら止まる(揺れ続けない)。読ませたい言葉に、長い動きを付けない。
- 素材が主役の場面は、文字を少なく。素材が多いときは、`pics`・`clips` や `photofull` を、場面ごとに使い分ける。
- 英語の長い言葉は、2行に分ける(例: `["Happy", "Halloween!"]`)。
- **長い行(7文字以上)は、アイコンのバッジとぶつかることがある。** 一覧画像で見て、ぶつかるなら、行を短くするか、`icon` を `null` にする。
- `videofull` は、暗めで動きの少ない動画に向く(明るい動画の上は、白い文字が読みにくい)。文字は少なく、短く。
- 場面の秒数は、短い言葉は3秒前後、写真・動画を見せる場面は4〜5秒。
- **写真に人物がいるときは、顔の位置を、画像を見て確かめ、文字がかからないように**`valign`(上・下)か、配置(`left`・`corner` など)を選ぶ。歌詞も、顔にかかるなら、`pos` を変える。
- 曲があるときは、歌詞は `lyrics` に書き、場面の文字(lines)は、少なくするか、`none` にする(歌詞と、場面の文字が、同じ位置で重ならないように)。
