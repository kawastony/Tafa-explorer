import * as _preload from 'three';
const a = await fetch('./p1.txt').then(r => r.text());
const b = await fetch('./p2.txt').then(r => r.text());
const blob = new Blob([a + b], { type: 'text/javascript' });
await import(URL.createObjectURL(blob));
