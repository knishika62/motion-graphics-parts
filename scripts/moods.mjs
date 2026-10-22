// お題ごとの「雰囲気」。配色・場面転換・動きの強さ・書体をまとめて切り替える。
// 配色はコードで作り、文字の読みやすさ(コントラスト比)を機械的に保証する。雰囲気は、お題のmdの「雰囲気」か --mood で指定する(AIが決める)。

const MIN = '"Hiragino Mincho ProN","Yu Mincho",serif';

// transitions: 場面転換の形の並び(1=円(中央) 2=縦のスラット 3=下から 4=円(左上) 5=横帯 6=斜め 7=市松 8=円(下))
export const MOODS = {
  pop:     {opener: 'wipe', desc: '元気で楽しい。にぎやかな紹介・ニュース・新機能向き(標準の配色)', fixed: true, transitions: Array.from({length: 24}, (_, i) => i + 1), amp: 1},
  calm:    {opener: 'rise', avoid: ['typewriter'], desc: '落ち着いて、やさしい。ていねいな解説・読み物・暮らしや健康向き', gen: {h0: 170, step: 26, bgS: 42, bgL: 90, inkS: 45, inkL: 20, accOff: 150, accS: 55, accL: 44}, transitions: [1, 3, 8, 10, 13, 18, 22], amp: 0.5, fonts: {g: {w: 500}, m: {w: 400}}},
  tech:    {opener: 'code', desc: 'クールで知的。**IT・開発・データ・AI の専門家向け**の技術解説向き(読み手がITに不慣れな一般の人・事務の人なら、選ばない)', gen: {h0: 195, step: 30, bgS: 62, bgL: 92, inkS: 70, inkL: 14, accOff: 130, accS: 85, accL: 42}, transitions: [2, 7, 5, 6, 16, 14, 12, 19, 24], amp: 0.85, fonts: {g: {w: 800}, m: {w: 700, fam: 'Menlo,"Hiragino Sans",sans-serif'}}},
  warm:    {opener: 'rise', avoid: ['typewriter'], desc: 'あたたかく親しみやすい。人・食・教育・地域・イベント向き', gen: {h0: 12, step: 20, bgS: 75, bgL: 90, inkS: 55, inkL: 15, accOff: 175, accS: 70, accL: 38}, transitions: [1, 4, 8, 11, 9, 23, 21], amp: 0.7, fonts: {g: {fam: MIN, w: 700}, m: {fam: MIN, w: 700}}},
  elegant: {opener: 'zoom', avoid: ['typewriter', 'marquee'], desc: '上品で静か。ビジネス・ブランド・文化・歴史向き', gen: {h0: 35, step: 12, bgS: 18, bgL: 94, inkS: 25, inkL: 12, accOff: 20, accS: 50, accL: 32}, transitions: [3, 1, 10, 18, 22], amp: 0.35, fonts: {g: {fam: MIN, w: 700}, m: {fam: MIN, w: 400}}},
  fresh:   {opener: 'rise', desc: '爽やかで軽い。新しいサービス・アプリ・若い人向け・健康や教育の明るい話', gen: {h0: 168, step: 34, bgS: 70, bgL: 91, inkS: 60, inkL: 16, accOff: 160, accS: 80, accL: 40}, transitions: [9, 10, 13, 12, 1, 17, 21], amp: 0.9, fonts: {g: {fam: '"Hiragino Maru Gothic ProN","Hiragino Sans",sans-serif', w: 700}}},
  candy:   {opener: 'zoom', desc: 'ポップでカラフル。子ども・イベント・食・エンタメ・キャンペーン向き', palette: [
    {bg: '#FFE9F0', ink: '#3A1030', accent: '#E0307A'}, {bg: '#E8F7FF', ink: '#10304A', accent: '#F2641F'}, {bg: '#FFF6D6', ink: '#3B2A00', accent: '#7A35D6'},
    {bg: '#E9FBE4', ink: '#12361C', accent: '#E0307A'}, {bg: '#F0E9FF', ink: '#2A1050', accent: '#0A8F6A'}, {bg: '#FFEBDD', ink: '#40200E', accent: '#1F6FE0'}], transitions: [16, 1, 9, 4, 14, 2, 20, 24], amp: 1.15, fonts: {g: {fam: '"Hiragino Maru Gothic ProN","Hiragino Sans",sans-serif', w: 800}}},
  night:   {opener: 'zoom', desc: '暗い背景で、クールに見せる。夜・ゲーム・音楽・先端技術・映像のように、暗い画面が似合う題材向き(読み手が一般の人・事務の人でも、題材が夜や先端のイメージなら可)', palette: [
    {bg: '#0E1626', ink: '#EAF2FF', accent: '#38BDF8'}, {bg: '#150F26', ink: '#F3EEFF', accent: '#C084FC'}, {bg: '#0B1F1C', ink: '#E8FFF8', accent: '#34D399'},
    {bg: '#1A1020', ink: '#FFEFF6', accent: '#F472B6'}, {bg: '#101820', ink: '#EEF6FF', accent: '#FBBF24'}, {bg: '#0D0D14', ink: '#F5F5FA', accent: '#60A5FA'}], transitions: [2, 7, 5, 19, 24, 17, 20, 1], amp: 0.9, fonts: {g: {w: 800}}},
  party:   {opener: 'notes', avoid: ['typewriter'], desc: '音楽・ダンス・ライブ・パーティー・エンタメ・映像制作・クリエイティブ・ファッション向け。暗い背景に、蛍光色のように鮮やか。音符が飛んで文字が決まる冒頭', palette: [
    {bg: '#1A0B3B', ink: '#FFFFFF', accent: '#FF3DA6'}, {bg: '#0B1B3B', ink: '#F4FAFF', accent: '#27E0FF'}, {bg: '#240B33', ink: '#FFF4FF', accent: '#FFD23D'},
    {bg: '#0B2A33', ink: '#F2FFFC', accent: '#B6FF3D'}, {bg: '#2A0B1E', ink: '#FFF4F8', accent: '#3DB6FF'}, {bg: '#150B3B', ink: '#FFFFFF', accent: '#FF7A3D'}], transitions: [16, 20, 9, 4, 14, 2, 24, 1], amp: 1.25, fonts: {g: {fam: '"Hiragino Maru Gothic ProN","Hiragino Sans",sans-serif', w: 900}}},
  halloween: {themeOnly: true, opener: 'zoom', avoid: ['typewriter'], desc: 'ハロウィン。暗い紫と黒の背景に、オレンジ・蛍光グリーン・赤紫が映える。仮装・パーティー・秋の夜・おばけ・お菓子のように、楽しく、少し不気味なテーマ動画向き(PR・資料の紹介には向かない)', palette: [
    {bg: '#1B0B2E', ink: '#FFF4E6', accent: '#FF7A1A'}, {bg: '#0E0A1A', ink: '#F6F0FF', accent: '#9BFF3D'}, {bg: '#2A0F3D', ink: '#FFFFFF', accent: '#FFA31A'},
    {bg: '#14091F', ink: '#FFF1F7', accent: '#E0409B'}, {bg: '#221032', ink: '#FFF8EC', accent: '#FF5A1F'}, {bg: '#0B1020', ink: '#F2F7FF', accent: '#B07CFF'}], transitions: [16, 2, 9, 19, 4, 20, 24, 1], amp: 1.2, fonts: {g: {fam: '"Hiragino Maru Gothic ProN","Hiragino Sans",sans-serif', w: 900}}},
  bold:    {opener: 'wipe', avoid: ['typewriter'], desc: '力強く主張が強い。速報・広告・セール・スポーツ向き', palette: [
    {bg: '#FFD400', ink: '#111111', accent: '#C8102E'}, {bg: '#FFFFFF', ink: '#111111', accent: '#0047CC'}, {bg: '#FF3B30', ink: '#FFFFFF', accent: '#111111'},
    {bg: '#111111', ink: '#FFFFFF', accent: '#C8102E'}, {bg: '#F2F2F2', ink: '#111111', accent: '#007A3D'}, {bg: '#0047CC', ink: '#FFFFFF', accent: '#C8102E'}], transitions: [2, 5, 6, 7, 15, 12, 14, 17, 20], amp: 1.35, fonts: {g: {w: 900}}},
};

// ---- 色の計算(HSL → hex、コントラスト比) ----
const hex = (h, s, l) => { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
const lum = c => { const v = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(x => (x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

function generate(g, n) {                  // n場面ぶんの配色。色相を少しずつ回し、文字と背景のコントラストを保証する
  const out = [];
  for (let i = 0; i < n; i++) {
    const h = g.h0 + i * g.step;
    const bg = hex(h, g.bgS, g.bgL);
    let il = g.inkL; let ink = hex(h, g.inkS, il); while (contrast(ink, bg) < 7 && il > 2) ink = hex(h, g.inkS, il -= 2);
    let al = g.accL; let accent = hex(h + g.accOff, g.accS, al); while (contrast('#ffffff', accent) < 3.5 && al > 8) accent = hex(h + g.accOff, g.accS, al -= 2);   // 白い文字を載せる強調色は十分に濃く
    out.push({bg, ink, accent});
  }
  return out;
}
function guard(p) {                         // 固定の配色も、読みやすさを検査して必要なら補正する
  return p.map(c => { let {bg, ink, accent} = c; if (contrast(ink, bg) < 7) ink = lum(bg) > .4 ? '#111111' : '#ffffff'; if (contrast('#ffffff', accent) < 3.5) accent = '#C8102E'; return {bg, ink, accent}; });
}

export function buildStyle(moodId, n) {
  const m = MOODS[moodId] || MOODS.pop;
  const style = {mood: MOODS[moodId] ? moodId : 'pop', opener: m.opener || 'code', amp: m.amp, transitions: m.transitions};
  if (m.gen) style.palette = generate(m.gen, n);
  else if (m.palette) style.palette = Array.from({length: n}, (_, i) => m.palette[i % m.palette.length]);
  if (m.fonts) style.fonts = m.fonts;
  return style;                              // pop は palette なし(Remotion側の標準の配色を使う)
}
