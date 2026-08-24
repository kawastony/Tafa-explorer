import pako from 'https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm';
const b64 = await (await fetch('./app.b64')).text();
const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const code = pako.inflate(bin, { to: 'string' });
const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
await import(url);
