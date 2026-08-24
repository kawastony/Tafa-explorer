const parts = [];
for (let i = 0; i < 5; i++) {
  parts.push(await (await fetch('./m' + i + '.txt')).text());
}
const code = parts.join('');
const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
await import(url);
