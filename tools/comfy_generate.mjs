#!/usr/bin/env node
// ComfyUI で、画像を作る道具(任意。素材を、AIで作りたいときに使う)。接続先も、ワークフローも、決め打ちしない。
//
//   1枚:   COMFYUI_URL=http://ホスト:8188 node tools/comfy_generate.mjs --workflow ワークフロー.json --prompt "..." --out 出力.jpg
//   まとめて: COMFYUI_URL=http://ホスト:8188 node tools/comfy_generate.mjs --workflow ワークフロー.json --jobs jobs.json --outdir assets/名前
//             jobs.json: [{"file": "01.jpg", "prompt": "...", "seed": 123, "negative": "...(任意)", "width": 1536, "height": 864}, ...]
//
// ワークフロー: ComfyUI の「API形式」で保存したJSON(メニューの「Save (API Format)」)。
//   プロンプト・ネガティブ・画像の大きさ・シード・保存名のノードは、KSampler の接続をたどって、自動で見つける(ノード番号は、いらない)。
//   見つからない・違うノードを使いたいときは、--prompt-node / --negative-node / --size-node / --seed-node / --save-node でノード番号を指定する。
//   --prefix は、保存ノード(SaveImage)があるときだけ効く(ComfyUI 側の保存名)。出力の場所と名前は、--out / --outdir と jobs の file が決める。
//   --timeout 秒: 1枚あたりの待ち時間(既定600秒)。
// 出力: 拡張子が .jpg / .jpeg / .webp なら、ffmpeg で変換して保存。.png ならそのまま。
// 環境変数: COMFYUI_URL(必須。--url でも指定できる)。
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; }, has = k => args.includes(k);
if (has('--help') || has('-h') || !opt('--workflow')) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf-8').split('\n').filter(l => l.startsWith('//')).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(opt('--workflow') ? 0 : 1); }
const URL_ = (opt('--url', process.env.COMFYUI_URL) || '').replace(/\/$/, '');
if (!URL_) { console.error('COMFYUI_URL が未設定です(例: COMFYUI_URL=http://localhost:8188)。--url でも指定できます'); process.exit(1); }

const TIMEOUT_S = Math.max(1, Math.round(+opt('--timeout', 600)) || 600);
const wf0 = JSON.parse(fs.readFileSync(path.resolve(opt('--workflow')), 'utf-8'));
if (wf0.nodes && wf0.links) { console.error('このワークフローは、画面用の形式です。ComfyUI の「Save (API Format)」で保存した、API形式のJSONを指定してください'); process.exit(1); }

// ノードの自動検出(KSampler の接続をたどる)
function detect(wf) {
  const ks = Object.entries(wf).find(([, n]) => /^KSampler/.test(n.class_type));
  if (!ks) throw new Error('KSampler が見つからない(--seed-node などで、ノード番号を指定してください)');
  const [ksId, k] = ks, link = x => (Array.isArray(x) ? String(x[0]) : null);
  const nodes = {
    positive: opt('--prompt-node') || link(k.inputs.positive), negative: opt('--negative-node') || link(k.inputs.negative),
    size: opt('--size-node') || link(k.inputs.latent_image), seed: opt('--seed-node') || ksId,
    save: opt('--save-node') || Object.entries(wf).find(([, n]) => n.class_type === 'SaveImage')?.[0],
  };
  // ネガティブ・ポジティブが、途中のノード(ConditioningXxx)を経由していたら、その先の CLIPTextEncode まで、さかのぼる
  const toText = id => { for (let i = 0; i < 6 && id && wf[id] && !('text' in (wf[id].inputs || {})); i++) id = link(Object.values(wf[id].inputs).find(v => Array.isArray(v) && wf[String(v[0])] && /Conditioning|CLIPTextEncode/.test(wf[String(v[0])].class_type))); return id; };
  nodes.positive = toText(nodes.positive); nodes.negative = toText(nodes.negative);
  const FLAG = {positive: '--prompt-node', negative: '--negative-node', size: '--size-node', seed: '--seed-node', save: '--save-node'};
  for (const [name, id] of Object.entries(nodes)) if (!id || !wf[id]) throw new Error(`ノード「${name}」を自動で見つけられない(${FLAG[name]} でノード番号を指定)`);
  return nodes;
}

async function generate(job) {
  const wf = JSON.parse(JSON.stringify(wf0)), n = detect(wf);
  wf[n.positive].inputs.text = job.prompt;
  if (job.negative !== undefined) wf[n.negative].inputs.text = job.negative;
  if (job.width) wf[n.size].inputs.width = +job.width; if (job.height) wf[n.size].inputs.height = +job.height;
  const si = wf[n.seed].inputs, seed = job.seed ?? Math.floor(Math.random() * 1e15); if ('seed' in si) si.seed = seed; else si.noise_seed = seed;
  if (wf[n.save]) wf[n.save].inputs.filename_prefix = job.prefix || 'comfy-generate';
  const r = await fetch(URL_ + '/prompt', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({prompt: wf})});
  if (!r.ok) throw new Error(`ComfyUI ${r.status}: ${(await r.text()).slice(0, 400)}`);
  const id = (await r.json()).prompt_id;
  for (let i = 0; i < TIMEOUT_S; i++) {                                            // 1枚あたりの待ち時間(既定10分。--timeout 秒)
    await new Promise(res => setTimeout(res, 1000));
    const h = (await (await fetch(`${URL_}/history/${id}`)).json())[id]; if (!h) continue;
    if (h.status?.status_str === 'error') throw new Error('生成エラー: ' + JSON.stringify(h.status.messages).slice(0, 400));
    const im = Object.values(h.outputs || {}).flatMap(o => o.images || [])[0];
    if (im) {
      const buf = Buffer.from(await (await fetch(`${URL_}/view?filename=${encodeURIComponent(im.filename)}&subfolder=${encodeURIComponent(im.subfolder || '')}&type=${im.type}`)).arrayBuffer());
      fs.mkdirSync(path.dirname(path.resolve(job.out)), {recursive: true});
      if (/\.(jpe?g|webp)$/i.test(job.out)) {
        const tmp = job.out + '.tmp.png'; fs.writeFileSync(tmp, buf);
        const c = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-q:v', '2', job.out]); fs.rmSync(tmp, {force: true});
        if (c.status !== 0) throw new Error('ffmpeg での変換に失敗: ' + String(c.stderr).slice(-200));
      } else fs.writeFileSync(job.out, buf);
      return {out: job.out, seed, server: im.filename};
    }
  }
  throw new Error('時間切れ');
}

const common = {width: opt('--width'), height: opt('--height'), negative: opt('--negative'), prefix: opt('--prefix')};
const jobs = opt('--jobs') ? JSON.parse(fs.readFileSync(path.resolve(opt('--jobs')), 'utf-8')).map(j => ({...common, ...j, out: path.join(opt('--outdir', '.'), j.file)}))
  : [{...common, prompt: opt('--prompt'), seed: opt('--seed') ? +opt('--seed') : undefined, out: opt('--out', 'out.jpg')}];
if (jobs.some(j => !j.prompt)) { console.error('--prompt(または jobs の各 prompt)が必要です'); process.exit(1); }
console.log('検出したノード:', JSON.stringify(detect(JSON.parse(JSON.stringify(wf0)))));
let ng = 0;
for (const j of jobs) {
  const t = Date.now();
  try { const r = await generate(j); console.log(`OK  ${r.out}  seed=${r.seed}  ${((Date.now() - t) / 1000).toFixed(1)}s  (${r.server})`); }
  catch (e) { ng++; console.log(`NG  ${j.out}  ${e.message}`); }
}
process.exit(ng ? 1 : 0);
