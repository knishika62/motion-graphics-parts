// テーマ動画の部品: お題mdの読み取り、素材(写真・動画)の探索と書き出し、台本の検査、場面の長さ。
//   お題から、何をどう使うかは、AI(エージェント)が考える。PARTS.md を読ませて、台本(runs/<名前>/scenario.json)を書かせる。
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, run} from './common.mjs';
import {BGS, CAPTION_MAX, DECORS, LAYOUTS, LYRIC_FX, LYRIC_POS, MEDIA_BGS, MOTIONS, PMOTIONS, TEXT_KNOBS, VALIGNS, limitsOfLayout} from './layers.mjs';
import {ICON_NAMES} from './icons.mjs';

const IMG = ['png', 'jpg', 'jpeg', 'webp'], VID = ['mp4', 'webm', 'mov'], MIN_SEC = 2;
const extOf = f => path.extname(f).slice(1).toLowerCase();
const kindOf = f => (IMG.includes(extOf(f)) ? 'photo' : VID.includes(extOf(f)) ? 'video' : null);

export const isTheme = md => /^>\s*種類\s*[:：]\s*テーマ/m.test(md);

// ---- mdの読み取り ----
export function parseTheme(md) {
  const meta = {}; for (const m of md.matchAll(/^>\s*([^:：\n]+?)\s*[:：]\s*(.+)$/gm)) meta[m[1].trim()] = m[2].trim();
  const title = md.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'テーマ動画';
  const sections = {}; let cur = null;
  for (const line of md.split('\n')) { const h = line.match(/^##\s+(.+)$/); if (h) { cur = h[1].trim(); sections[cur] = []; continue; } if (cur) sections[cur].push(line); }
  const sec = (...names) => { const k = Object.keys(sections).find(k => names.some(n => k.startsWith(n))); return k ? sections[k] : []; };
  const items = lines => lines.map(l => l.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/)?.[1]?.trim()).filter(Boolean);
  const yn = (v, d) => (v == null ? d : !/^(なし|無し|no|off|false|いいえ|不要)/i.test(v));
  const num = v => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };
  // 場面の指定: `言葉1 / 言葉2 | 素材: C01.jpg | 秒: 3 | 配置: hero`
  const scenes = items(sec('場面')).map(s => {
    const parts = s.split('|').map(x => x.trim()).filter(Boolean), sc = {lines: [], media: [], sec: null, layout: null};
    for (const p of parts) {
      const a = p.match(/^(素材|秒|配置)\s*[:：]\s*(.+)$/);
      if (!a) { if (!sc.lines.length) sc.lines = p.split(/\s*\/\s*/).filter(Boolean); continue; }
      if (a[1] === '素材') sc.media.push(...a[2].split(/[、,\s]+/).filter(Boolean)); else if (a[1] === '秒') sc.sec = num(a[2]); else sc.layout = a[2].trim();
    }
    return sc;
  });
  const mediaNames = items(sec('素材')).map(s => s.match(/^([^\s(（—:：]+)/)?.[1]).filter(Boolean);
  return {title, meta, mood: meta['雰囲気'] || null, bgm: meta['BGM'] == null ? null : yn(meta['BGM'], true),
    total: num(meta['尺']), sceneSec: num(meta['場面の長さ']), brief: sec('概要', '見せたいもの').join('\n').trim() || md.replace(/^[>#].*$/gm, '').trim().slice(0, 1200), scenes, mediaNames};
}

// ---- 素材(写真・動画)の置き場所を探す: assets/<名前>/ → mdと同じフォルダ → 絶対パス。素材の節が無ければ、assets/<名前>/ の画像・動画を、名前順にすべて使う ----
export function resolveThemeMedia({theme, mdPath, name, log}) {
  const dir = path.join(ROOT, 'assets', name); fs.mkdirSync(dir, {recursive: true});
  let names = [...theme.mediaNames, ...theme.scenes.flatMap(s => s.media)]; names = [...new Set(names)];
  const auto = !names.length;
  if (auto) names = fs.readdirSync(dir).filter(f => kindOf(f) && !/^(lp_|logo|company)/.test(f)).sort();
  const where = f => [path.join(dir, f), path.join(path.dirname(path.resolve(mdPath)), f), path.resolve(f)].find(p => fs.existsSync(p));
  const photos = [], videos = [], index = {}, missing = [];
  for (const n of names) {
    const p = where(n), k = kindOf(n);
    if (!p || !k) { missing.push(n); continue; }
    (k === 'photo' ? photos : videos).push(p); index[n] = {kind: k, n: (k === 'photo' ? photos : videos).length};
  }
  if (missing.length) log(`  ※ 見つからない・使えない素材: ${missing.join(', ')}(assets/${name}/ か、mdと同じフォルダに置く)`);
  log(`  素材: 写真${photos.length}枚・動画${videos.length}本${auto ? '(assets/' + name + '/ の中身をすべて使う)' : ''}`);
  return {lp: {pc: null, phone: null, photos, videos}, index, missing};
}

// 長い1行を、空白・読点・区切りの位置で、2行に分ける(1行の文字数の上限に収まるときだけ)
export function splitLine(text, max) {
  const t = String(text).trim(); if ([...t].length <= max) return [t];
  const c = [...t]; let best = null;
  for (let i = 1; i < c.length; i++) {
    if (!(c[i - 1] === ' ' || c[i] === ' ' || /[、。,!！?？・]/.test(c[i - 1]))) continue;
    const a = c.slice(0, i).join('').trim(), b = c.slice(i).join('').trim();
    if (!a || !b || [...a].length > max || [...b].length > max) continue;
    const d = Math.abs([...a].length - [...b].length); if (!best || d < best.d) best = {d, v: [a, b]};
  }
  return best ? best.v : [t];
}

// ---- AI(エージェント)が書いた台本(scenario.json)の検査: 配置ごとの行数・文字数、部品の名前、素材の番号 ----
export function validateTheme(sc, media, theme) {
  if (!sc || typeof sc !== 'object' || Array.isArray(sc)) return ['台本は、JSON の {…}(オブジェクト)にする'];
  const S = sc.scenes; if (!Array.isArray(S) || S.length < 3 || S.length > 14) return ['scenes は、3〜14個の配列にする'];
  const err = [], nP = Object.values(media.index).filter(m => m.kind === 'photo').length, nV = Object.values(media.index).filter(m => m.kind === 'video').length;
  const layouts = Object.keys(LAYOUTS), bgs = [...Object.keys(BGS), ...Object.keys(MEDIA_BGS)];
  S.forEach((s, i) => {
    const w = `場面${i + 1}`;
    if (!s || typeof s !== 'object') return err.push(`${w}: {…}(オブジェクト)にする`);
    if (s.layers !== undefined && (!s.layers || typeof s.layers !== 'object' || Array.isArray(s.layers))) return err.push(`${w}: layers は、{…}(オブジェクト)にする`);
    const L = s.layers || {};
    if (s.tech !== 'compose') err.push(`${w}: tech は "compose" にする(テーマ動画は compose だけ)`);
    if (!layouts.includes(L.layout)) err.push(`${w}: layers.layout 「${L.layout}」は使えない。使えるもの: ${layouts.join(', ')}`);
    else if (!Array.isArray(s.lines) || s.lines.some(l => typeof l !== 'string')) err.push(`${w}: lines は、文字列の配列にする`);
    else if (L.layout === 'none') { if (s.lines.length) err.push(`${w}: none(文字なし)の lines は、空の配列 [] にする`); }
    else {
      const lim = limitsOfLayout(L.layout);
      if (s.lines.length < lim[0][0] || s.lines.length > lim.length) err.push(`${w}: ${L.layout} の lines は${lim[0][0]}〜${lim.length}行(いま${s.lines.length}行)`);
      s.lines.forEach((l, k) => { const max = lim[Math.min(k, lim.length - 1)][1]; if (!String(l).trim() || [...String(l)].length > max) err.push(`${w}: lines[${k}] 「${l}」は1〜${max}文字(${L.layout})。長い言葉は、行を分ける`); });
    }
    if (L.motion && !(L.motion in MOTIONS)) err.push(`${w}: layers.motion 「${L.motion}」は使えない`);
    if (L.bg && !bgs.includes(L.bg)) err.push(`${w}: layers.bg 「${L.bg}」は使えない`);
    if (L.decor && !(L.decor in DECORS)) err.push(`${w}: layers.decor 「${L.decor}」は使えない`);
    if (L.icon && (typeof L.icon !== 'string' || !ICON_NAMES.has(L.icon))) err.push(`${w}: layers.icon 「${L.icon}」は、アイコンの一覧にない`);
    if (L.icons !== undefined) {
      if (!Array.isArray(L.icons) || L.icons.some(n => typeof n !== 'string' || !ICON_NAMES.has(n))) err.push(`${w}: layers.icons は、アイコンの名前の配列(例: ["Ghost","Candy","Moon"])。アイコンの一覧にある名前だけ`);
      else if (L.icons.length > (L.iconsStyle === 'float' ? 9 : 24)) err.push(`${w}: layers.icons は${L.iconsStyle === 'float' ? 9 : 24}個まで(いま${L.icons.length}個)`);
      if (L.iconsAvoid !== undefined && !(Array.isArray(L.iconsAvoid) && L.iconsAvoid.every(r => Array.isArray(r) && r.length === 4 && r.every(v => typeof v === 'number' && v >= 0 && v <= 1) && r[0] < r[2] && r[1] < r[3]))) err.push(`${w}: layers.iconsAvoid は、[[x0,y0,x1,y1], ...](0〜1。左上が原点。x0<x1、y0<y1)`);
      if (L.iconsStyle !== undefined && !['pop', 'float'].includes(L.iconsStyle)) err.push(`${w}: layers.iconsStyle は pop(弾ける。既定)か float(漂う)`);
    }
    if (L.pmotion && !(L.pmotion in PMOTIONS)) err.push(`${w}: layers.pmotion 「${L.pmotion}」は使えない。使えるもの: ${Object.keys(PMOTIONS).join(', ')}`);
    else if (L.pmotion && !['photofull', 'videofull'].includes(L.bg)) err.push(`${w}: layers.pmotion は、bg が photofull / videofull のときだけ使える`);
    const kind = ['pic', 'pics'].includes(L.layout) || ['photo', 'photofull'].includes(L.bg) ? 'photo' : ['clip', 'clips'].includes(L.layout) || ['video', 'videofull'].includes(L.bg) ? 'video' : null, cnt = kind === 'photo' ? nP : nV;
    if (kind && !cnt) err.push(`${w}: ${kind === 'photo' ? '写真' : '動画'}の素材が無いのに、${L.layout} / ${L.bg} を使っている`);
    if (L.pick !== undefined) { if (!Array.isArray(L.pick) || !L.pick.length || L.pick.some(k => !Number.isInteger(k) || k < 1 || k > cnt)) err.push(`${w}: layers.pick は、1〜${cnt}の整数の配列(${kind === 'video' ? '動画' : '写真'}の何番目か)`); else if (!kind) err.push(`${w}: layers.pick があるのに、素材を使う配置・背景ではない`); }
    if (s.caption !== undefined && typeof s.caption !== 'string') err.push(`${w}: caption は、文字列にする`);
    else if (s.caption && [...s.caption].length > CAPTION_MAX) err.push(`${w}: caption は${CAPTION_MAX}文字以内`);
    if (s.fs !== undefined && !(typeof s.fs === 'number' && s.fs >= 0.5 && s.fs <= 1.5)) err.push(`${w}: fs(文字サイズの倍率)は、0.5〜1.5(数。省略は1)`);
    if (L.tilt !== undefined && !(typeof L.tilt === 'number' && L.tilt >= TEXT_KNOBS.tilt[0] && L.tilt <= TEXT_KNOBS.tilt[1])) err.push(`${w}: layers.tilt は、${TEXT_KNOBS.tilt[0]}〜${TEXT_KNOBS.tilt[1]}(度。数)`);
    if (L.scale !== undefined && !(typeof L.scale === 'number' && L.scale >= TEXT_KNOBS.scale[0] && L.scale <= TEXT_KNOBS.scale[1])) err.push(`${w}: layers.scale は、${TEXT_KNOBS.scale[0]}〜${TEXT_KNOBS.scale[1]}(倍。数)`);
    if (L.shift !== undefined && !(Array.isArray(L.shift) && L.shift.length === 2 && L.shift.every(v => typeof v === 'number' && v >= TEXT_KNOBS.shift[0] && v <= TEXT_KNOBS.shift[1]))) err.push(`${w}: layers.shift は、[右へ, 下へ](px。それぞれ ${TEXT_KNOBS.shift[0]}〜${TEXT_KNOBS.shift[1]}。数の配列)`);
    if (L.valign !== undefined && !(L.valign in VALIGNS)) err.push(`${w}: layers.valign 「${L.valign}」は使えない。使えるもの: ${Object.keys(VALIGNS).join(', ')}`);
    if (s.sec !== undefined && !(typeof s.sec === 'number' && s.sec >= 2 && s.sec <= 60)) err.push(`${w}: sec は、2〜60(秒。数)`);
  });
  // 歌詞(lyrics): 場面とは別に、時刻つきで重ねる
  const num = v => typeof v === 'number' && Number.isFinite(v);
  if (sc.bpm !== undefined && !(num(sc.bpm) && sc.bpm >= 40 && sc.bpm <= 240)) err.push('bpm は、40〜240(数)');
  for (const k of ['fadeIn', 'fadeOut']) if (sc[k] !== undefined && !(num(sc[k]) && sc[k] >= 0 && sc[k] <= 5)) err.push(`${k} は、0〜5(秒。黒からの入り・黒への出。省略は、無し)`);
  if (sc.hold !== undefined && !(num(sc.hold) && sc.hold >= 0 && sc.hold <= 5)) err.push('hold は、0〜5(秒。最後の余韻。既定0.5。数)');
  if (sc.beatOffset !== undefined && !(num(sc.beatOffset) && sc.beatOffset >= 0 && sc.beatOffset < 10)) err.push('beatOffset は、0〜10(秒。最初の拍の時刻。数)');
  if (sc.lyrics !== undefined) {
    if (!Array.isArray(sc.lyrics)) err.push('lyrics は、配列にする');
    else {
      const total = S.reduce((a, s) => a + (s.sec || theme.sceneSec || (theme.total || 20) / S.length), 0) + (num(sc.hold) ? sc.hold : 0.5);      // 動画の長さ = 場面の秒数の合計 + 最後の余韻(hold)
      sc.lyrics.forEach((c, i) => {
        const w = `歌詞${i + 1}`;
        if (!c || typeof c.text !== 'string' || !c.text.trim()) return err.push(`${w}: text が空`);
        if ([...c.text].length > 40) err.push(`${w}: text は40文字以内(「${c.text.slice(0, 12)}…」)。行を分けて、別の歌詞にする`);
        if (!(num(c.start) && c.start >= 0) || !(num(c.end) && c.end > c.start)) err.push(`${w}: start と end(秒。start < end)が必要`);
        else if (c.end > total + 1) err.push(`${w}: end ${c.end} が、動画の長さ(約${total.toFixed(1)}秒)を超えている`);
        if (c.fx !== undefined && !(c.fx in LYRIC_FX)) err.push(`${w}: fx 「${c.fx}」は使えない。使えるもの: ${Object.keys(LYRIC_FX).join(', ')}`);
        if (c.pos !== undefined && !(c.pos in LYRIC_POS)) err.push(`${w}: pos 「${c.pos}」は使えない。使えるもの: ${Object.keys(LYRIC_POS).join(', ')}`);
      });
      const sorted = [...sc.lyrics].filter(c => c && c.end > c.start).sort((a, b) => a.start - b.start);
      sorted.forEach((c, i) => { if (i && c.start < sorted[i - 1].end - 0.05 && (c.pos ?? 'bottom') === (sorted[i - 1].pos ?? 'bottom') && !c.big && !sorted[i - 1].big) err.push(`歌詞「${c.text.slice(0, 10)}」が、前の歌詞(「${sorted[i - 1].text.slice(0, 10)}」)と、時刻が重なっている(同じ位置に重なる。pos を変えるか、時刻をずらす)`); });
    }
  }
  return err;
}

// ---- 無音の音声を作り、場面の長さ(拍)を、秒数から決める(無音の音声は、曲を重ねる前の土台) ----
export function silentNarration(scenario, secs, log, bpm = 124, hold = 0.5) {
  const pub = path.join(ROOT, 'public'); fs.mkdirSync(pub, {recursive: true});
  for (const f of fs.readdirSync(pub)) if (/^s\d+\.wav$/.test(f)) fs.rmSync(path.join(pub, f));
  const beat = 60 / bpm;                                                            // 1拍の長さ(秒)。曲のBPMに合わせると、拍ごとの動きが、曲と合う
  const beats = scenario.scenes.map((_, i) => Math.max(MIN_SEC, secs[i] || 3) / beat);       // 拍数は、小数でよい(sec が、そのまま、場面の長さになる)
  beats.forEach((b, i) => {
    const r = run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', (b * beat + .1).toFixed(3), '-c:a', 'pcm_s16le', path.join(pub, `s${i + 1}.wav`)]);
    if (r.status !== 0) throw new Error('無音の音声を作れなかった: ' + (r.stderr || '').slice(-200));
    log(`  場面${i + 1} ${JSON.stringify(scenario.scenes[i].lines)} → ${(b * beat).toFixed(2)}秒`);
  });
  return {beats, beat, seconds: +(beats.reduce((a, b) => a + b, 0) * beat + hold).toFixed(2)};          // seconds = 動画の長さ(場面の秒数の合計 + 最後の余韻)
}

// ---- 素材を、Remotion が読む場所(public/)へ書き出す。scenario.style.lp に渡す形にする ----
// 素材の縦横と長さ。スマホで縦に撮った動画は、回転(rotation)のメタデータで縦横が逆になるので、見た目の縦横に直す
const probe = f => {
  const r = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_side_data=rotation:stream_tags=rotate:format=duration', '-of', 'json', f]);
  try {
    const j = JSON.parse(r.stdout), st = j.streams?.[0]; if (!(st?.width && st?.height)) return null;
    const rot = Math.abs(Math.round(+(st.side_data_list?.find(d => d.rotation !== undefined)?.rotation ?? st.tags?.rotate ?? 0))) % 180, swap = rot === 90;
    return {w: swap ? st.height : st.width, h: swap ? st.width : st.height, dur: +j.format?.duration || 0};
  } catch { return null; }
};
export function publishMedia(lp) {
  const pub = path.join(ROOT, 'public'); fs.mkdirSync(pub, {recursive: true});
  for (const f of fs.readdirSync(pub)) if (/^lp_/.test(f)) fs.rmSync(path.join(pub, f));
  const put = (f, n) => { const to = n + path.extname(f); fs.copyFileSync(f, path.join(pub, to)); return {file: to, ...(probe(f) || {w: 0, h: 0, dur: 0})}; };
  const out = {};
  if (lp.photos?.length) out.photos = lp.photos.map((f, k) => put(f, `lp_photo${k + 1}`));
  if (lp.videos?.length) out.videos = lp.videos.map((f, k) => put(f, `lp_video${k + 1}`)).filter(v => v.w);
  return Object.keys(out).length ? out : null;
}
