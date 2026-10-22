// テーマ動画の書き出し。台本(runs/<名前>/scenario.json。AIが PARTS.md を読んで書く)と、お題のmd、素材から、MP4を作る。
//   node scripts/render.mjs <お題.md> --name <名前> [--mood 型] [--bgm-file 曲.mp3] [--no-bgm] [--opener 型] [--bundled-fonts]
// 台本の検査(行数・文字数・部品の名前・素材の番号)に通らないと、理由を示して止まる。LLM・ネットワーク(書体の初回ダウンロード以外)・TTSは使わない。
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, readJson, run, tail, writeJson} from './common.mjs';
import {ensureFonts} from './fonts.mjs';
import {mixBgm} from './bgm.mjs';
import {normalize} from './loudness.mjs';
import {measureVideo} from './measure.mjs';
import {MOODS, buildStyle} from './moods.mjs';
import {parseTheme, publishMedia, resolveThemeMedia, silentNarration, validateTheme} from './theme.mjs';

const args = process.argv.slice(2), mdPath = args.find(a => !a.startsWith('--') && a.endsWith('.md'));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (!mdPath) { console.error('使い方: node scripts/render.mjs <お題.md> --name <名前> [--mood 型] [--bgm-file 曲.mp3] [--no-bgm]'); process.exit(1); }
const name = opt('--name', path.basename(mdPath, '.md').replace(/[^\w.-]+/g, '_'));
const work = path.join(ROOT, 'runs', name); fs.mkdirSync(work, {recursive: true});
const t0 = Date.now(), logf = path.join(work, 'render.log'); fs.writeFileSync(logf, '');
const log = s => { const l = `[${String(Math.round((Date.now() - t0) / 1000)).padStart(4)}s] ${s}`; console.log(l); fs.appendFileSync(logf, l + '\n'); };

(async () => {
  const md = fs.readFileSync(path.resolve(mdPath), 'utf-8'), theme = parseTheme(md);
  log(`お題: ${mdPath}(${theme.title}) name=${name}`);
  const saved = path.join(work, 'scenario.json');
  if (!fs.existsSync(saved)) throw new Error(`台本がない: ${saved}\n  AI(エージェント)に PARTS.md を読ませて、お題から台本を書かせ、この場所に置く(見本: examples/scenario_sample.json)`);
  const media = resolveThemeMedia({theme, mdPath, name, log});
  const scenario = readJson(saved);
  const errs = validateTheme(scenario, media, theme); if (errs.length) throw new Error('台本の検査に失敗:\n  ' + errs.join('\n  '));
  log('台本の検査OK');
  const moodId = opt('--mood', null) || theme.mood || 'pop';
  if (!MOODS[moodId]) throw new Error(`雰囲気「${moodId}」は無い。使える雰囲気: ${Object.keys(MOODS).join(', ')}`);
  await ensureFonts(log);                                                          // 同梱の書体(OFL)。初回だけダウンロード(public/fonts/)
  scenario.scenes.forEach(s => { s.fs = 1; });
  scenario.mood = moodId; scenario.style = buildStyle(moodId, scenario.scenes.length);
  if (opt('--opener', null)) scenario.style.opener = opt('--opener', null);
  if (args.includes('--bundled-fonts')) scenario.style.bundledFonts = true;        // 同梱の書体を優先(OSによらず同じ見た目)。既定は、Macのヒラギノを優先
  const lp = publishMedia(media.lp); if (lp) scenario.style.lp = lp;
  log(`雰囲気: ${moodId} / 冒頭の演出: ${scenario.style.opener} / 素材: ${lp ? `写真${lp.photos?.length || 0}枚・動画${lp.videos?.length || 0}本` : 'なし'}`);
  writeJson(saved, scenario);

  // 場面の長さ: 台本の sec(秒)→ お題の「場面の長さ」→「尺」を場面数で割った秒数。1拍(約0.48秒)の単位に切り上げられ、最短は2秒
  const secs = scenario.scenes.map(s => s.sec || theme.sceneSec || (theme.total || 20) / scenario.scenes.length);
  const {beats, beat, seconds} = silentNarration(scenario, secs, log, scenario.bpm || 124); log(`  合計 約${(seconds - 0.5 + (scenario.hold ?? 0.5)).toFixed(2)}秒(余韻 ${scenario.hold ?? 0.5}秒を含む。1拍 ${beat.toFixed(3)}秒 = ${scenario.bpm || 124}BPM)`);
  writeJson(path.join(ROOT, 'src', 'scenario.json'), scenario); writeJson(path.join(ROOT, 'src', 'timeline.json'), {beats, beat, hold: scenario.hold ?? 0.5});
  run('node', ['scripts/gen-sources.mjs']);

  log('書き出し(Remotion)');
  fs.mkdirSync(path.join(ROOT, 'out'), {recursive: true});
  const mp4 = path.join(ROOT, 'out', `${name}.mp4`);
  const r = run('npx', ['remotion', 'render', 'src/index.ts', 'Reel', mp4]); if (r.status !== 0) throw new Error('書き出し失敗: ' + tail(r.stdout + r.stderr));
  const wantBgm = !args.includes('--no-bgm') && (opt('--bgm-file', null) || (theme.bgm ?? true));        // BGM(既定はあり)。曲を持ち込むなら --bgm-file
  if (wantBgm) { mixBgm(mp4, {moodId, track: opt('--bgm-file', null), log, loud: true}); normalize(mp4, log); }
  const dur = +run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).stdout;
  log(`  ${mp4} ${dur.toFixed(1)}秒`);
  let meas = null; try { meas = measureVideo(mp4, beats, log); } catch (e) { log('  計測に失敗: ' + e.message); }      // 黒・点滅・端へのはみ出し(報告のみ)
  const rows = scenario.scenes.map((s, i) => `| ${i + 1} | ${s.lines.join(' / ')} | ${s.layers.layout} | ${s.layers.bg} | ${(beats[i] * beat).toFixed(2)}秒 |`);
  fs.writeFileSync(path.join(work, 'report.md'), `# ${name} レポート\n\n- お題: ${mdPath}\n- 動画: ${mp4}(${dur.toFixed(1)}秒)\n- 雰囲気: ${moodId}\n- 計測(黒・点滅・端へのはみ出し): ${meas ? (meas.ok ? 'すべて問題なし' : `要確認(黒 ${meas.black.length}件、点滅 最大${meas.flicker}回/秒、端へのはみ出し 場面 ${meas.edgeNg.join(',')})`) : '未計測'}\n\n| # | 言葉 | 配置 | 背景 | 長さ |\n|---|---|---|---|---|\n${rows.join('\n')}\n`);
  log(`完了 総${Math.round((Date.now() - t0) / 1000)}秒 レポート: runs/${name}/report.md`);
})().catch(e => { log('Error ' + e.message); process.exit(1); });
