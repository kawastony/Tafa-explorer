import pako from 'https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm';
const a = await (await fetch('./b64a.txt')).text();
const b = await (await fetch('./b64b.txt')).text();
const bin = Uint8Array.from(atob(a + b), c => c.charCodeAt(0));
const code = pako.inflate(bin, { to: 'string' });
const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
await import(url);
