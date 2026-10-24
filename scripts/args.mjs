// コマンドラインの引数。値を取るオプションの次が、別のオプション(--で始まる)や無しなら、値の指定漏れとして止める。知らないオプションも止める(打ち間違いを、黙って無視しない)
export const VALUE_OPTS = ['--name', '--mood', '--bgm-file', '--opener'];
export const FLAG_OPTS = ['--no-bgm', '--bundled-fonts'];
export function parseArgs(argv) {
  const pos = [], opts = {}, flags = new Set();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (VALUE_OPTS.includes(a)) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} には、値が要る(例: ${a} 名前)`);
      opts[a] = v; i++;
    } else if (FLAG_OPTS.includes(a)) flags.add(a);
    else if (a.startsWith('--')) throw new Error(`知らないオプション: ${a}(使えるもの: ${[...VALUE_OPTS, ...FLAG_OPTS].join(' ')})`);
    else pos.push(a);
  }
  return {pos, opts, flags};
}
