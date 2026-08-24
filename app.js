import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const H0 = 67.4;
function quantumOmega(a) {
const q = 0.045 * Math.pow(a, -0.35) + 0.28 * Math.pow(a, 1.2);
return Math.min(0.95, Math.max(0.01, q));
}
function Ez(a, Om = 0.31) {
const Oq = quantumOmega(a);
const Or = 9e-5;
const Ol = Math.max(0.01, 1 - Om - Or - 0.04);
return Math.sqrt(Om * Math.pow(a, -3) + Or * Math.pow(a, -4) + Ol + Oq * Math.pow(a, -1.2));
}
function Hz(a) { return H0 * Ez(a); }
const CATALOG = [
{ name: 'Proxima Cen b', ra: 217.4, dec: -62.7, dist: 1.3, note: 'Nearest temperate' },
{ name: 'TRAPPIST-1 e', ra: 346.6, dec: -5.0, dist: 12.4, note: 'Ultra-cool dwarf system' },
{ name: 'Kepler-452 b', ra: 296.0, dec: 44.3, dist: 430, note: 'Earth-analog candidate' },
{ name: 'HD 209458 b', ra: 330.8, dec: 18.9, dist: 48, note: 'First transiting hot Jupiter' },
{ name: '55 Cnc e', ra: 133.1, dec: 28.3, dist: 12.6, note: 'Super-Earth lava world' },
{ name: 'WASP-12 b', ra: 94.3, dec: 29.7, dist: 427, note: 'Inflated hot Jupiter' },
{ name: 'K2-18 b', ra: 172.9, dec: 7.6, dist: 38, note: 'Hycean candidate' },
{ name: 'TOI-700 d', ra: 97.0, dec: -65.0, dist: 31, note: 'Habitable-zone Earth-size' },
{ name: 'GJ 1214 b', ra: 258.8, dec: 4.7, dist: 14.6, note: 'Mini-Neptune archetype' },
{ name: 'HR 8799 c', ra: 348.0, dec: 21.2, dist: 41, note: 'Direct-imaged giant' },
{ name: 'Kepler-22 b', ra: 290.1, dec: 47.9, dist: 190, note: 'First Kepler HZ planet' },
{ name: 'LHS 1140 b', ra: 11.2, dec: -15.3, dist: 15, note: 'Rocky super-Earth' },
];
const SCORE = [
{ id: 'baroque', label: 'Baroque', sub: 'Bach · Prelude geometry', base: 130.81, pattern: [0,2,4,7,9,12,7,4] },
{ id: 'classical', label: 'Classical', sub: 'Mozart · ordered motion', base: 174.61, pattern: [0,4,7,12,7,4,0,7] },
{ id: 'nocturne', label: 'Nocturne', sub: 'Chopin · deep field quiet', base: 116.54, pattern: [0,3,7,10,7,3,0,5] },
{ id: 'pastoral', label: 'Pastoral', sub: 'Grieg · horizon dawn', base: 146.83, pattern: [0,5,7,12,9,5,2,0] },
{ id: 'meditation', label: 'Meditation', sub: 'Suk · long baseline', base: 98.00, pattern: [0,5,7,12,19,12,7,5] },
];
let audioCtx = null, master = null, playing = false, typeId = 0, nodes = [], stepTimer = null, step = 0;
function ensureAudio() {
if (audioCtx) return;
audioCtx = new (window.AudioContext || window.webkitAudioContext)();
master = audioCtx.createGain();
master.gain.value = parseFloat(document.getElementById('vol').value);
master.connect(audioCtx.destination);
}
function stopScore() {
if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
nodes.forEach(n => { try { n.stop(); } catch {} });
nodes = [];
}
function pulseNote(freq, dur, type = 'sine', gain = 0.05) {
if (!audioCtx || !playing) return;
const o = audioCtx.createOscillator();
const g = audioCtx.createGain();
o.type = type;
o.frequency.value = freq;
const t0 = audioCtx.currentTime;
g.gain.setValueAtTime(0.0001, t0);
g.gain.exponentialRampToValueAtTime(gain, t0 + 0.03);
g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
o.connect(g); g.connect(master);
o.start(t0); o.stop(t0 + dur + 0.02);
nodes.push(o);
}
function startScore() {
ensureAudio();
if (audioCtx.state === 'suspended') audioCtx.resume();
stopScore();
playing = true;
step = 0;
const piece = SCORE[typeId];
stepTimer = setInterval(() => {
const semi = piece.pattern[step % piece.pattern.length];
const f = piece.base * Math.pow(2, semi / 12);
pulseNote(f, 0.55, step % 2 ? 'triangle' : 'sine', 0.045);
pulseNote(f * 0.5, 0.8, 'sine', 0.025);
if (step % 4 === 0) pulseNote(f * 2, 0.35, 'sine', 0.02);
step++;
}, typeId === 2 || typeId === 4 ? 520 : 380);
document.getElementById('playBtn').textContent = '❚❚';
}
function togglePlay() {
if (playing) { playing = false; stopScore(); document.getElementById('playBtn').textContent = '▶'; }
else startScore();
}
const root = document.getElementById('c');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09090b);
scene.fog = new THREE.FogExp2(0x09090b, 0.012);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 2.5, 18);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
root.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;
controls.minDistance = 4;
controls.maxDistance = 80;
scene.add(new THREE.AmbientLight(0x8899aa, 0.35));
const key = new THREE.PointLight(0x22d3ee, 1.3, 80);
key.position.set(12, 10, 8); scene.add(key);
const fill = new THREE.PointLight(0xa78bfa, 0.55, 60);
fill.position.set(-10, -4, -6); scene.add(fill);
function makeStars(n, spread, size, color) {
const g = new THREE.BufferGeometry();
const p = new Float32Array(n * 3);
for (let i = 0; i < n * 3; i++) p[i] = (Math.random() - 0.5) * spread;
g.setAttribute('position', new THREE.BufferAttribute(p, 3));
return new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: 0.9 }));
}
const starsFar = makeStars(6000, 220, 0.08, 0xffffff);
const starsNear = makeStars(1200, 90, 0.12, 0xb6e3ff);
scene.add(starsFar, starsNear);
const SKY_R = 28;
function radecToVec(ra, dec, r = SKY_R) {
const th = THREE.MathUtils.degToRad(ra);
const ph = THREE.MathUtils.degToRad(dec);
const x = r * Math.cos(ph) * Math.cos(th);
const y = r * Math.sin(ph);
const z = r * Math.cos(ph) * Math.sin(th);
return new THREE.Vector3(x, y, z);
}
const skyGroup = new THREE.Group();
const cosmosGroup = new THREE.Group();
const lensGroup = new THREE.Group();
const labGroup = new THREE.Group();
scene.add(skyGroup, cosmosGroup, lensGroup, labGroup);
{
const eq = new THREE.LineLoop(
new THREE.BufferGeometry().setFromPoints(
Array.from({ length: 128 }, (_, i) => {
const a = (i / 128) * Math.PI * 2;
return new THREE.Vector3(Math.cos(a) * SKY_R, 0, Math.sin(a) * SKY_R);
})
),
new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25 })
);
skyGroup.add(eq);
}
const planetMeshes = [];
CATALOG.forEach((p, i) => {
const v = radecToVec(p.ra, p.dec);
const m = new THREE.Mesh(
new THREE.SphereGeometry(0.22 + Math.min(0.25, 2 / Math.sqrt(p.dist)), 16, 16),
new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7490, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.35 })
);
m.position.copy(v);
m.userData = { idx: i, catalog: p };
const halo = new THREE.Mesh(
new THREE.SphereGeometry(0.45, 12, 12),
new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.12 })
);
halo.position.copy(v);
skyGroup.add(m, halo);
planetMeshes.push({ mesh: m, halo, data: p });
});
const cosmosPts = makeStars(3500, 40, 0.1, 0xc4b5fd);
cosmosGroup.add(cosmosPts);
for (let i = 1; i <= 4; i++) {
const ring = new THREE.Mesh(
new THREE.TorusGeometry(4 * i, 0.02, 8, 96),
new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.2 })
);
ring.rotation.x = Math.PI / 2;
cosmosGroup.add(ring);
}
const hub = new THREE.Mesh(
new THREE.SphereGeometry(0.6, 24, 24),
new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
);
cosmosGroup.add(hub);
{
const angle = THREE.MathUtils.degToRad(35);
const h = 16;
const r = Math.tan(angle) * h;
const cone = new THREE.Mesh(
new THREE.ConeGeometry(r, h, 48, 1, true),
new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
);
cone.position.y = h / 2;
cone.rotation.x = Math.PI;
lensGroup.add(cone);
for (let k = 1; k <= 5; k++) {
const rr = (r / 5) * k;
const ring = new THREE.Mesh(
new THREE.TorusGeometry(rr, 0.025, 8, 64),
new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.28 - k * 0.03 })
);
ring.rotation.x = Math.PI / 2;
ring.position.y = (h / 5) * k * 0.85;
lensGroup.add(ring);
}
const spiralPts = [];
for (let i = 0; i < 400; i++) {
const t = i / 40;
const rad = 0.4 * Math.exp(0.22 * t);
spiralPts.push(new THREE.Vector3(rad * Math.cos(t), 0.15 * Math.sin(t * 3), rad * Math.sin(t)));
}
lensGroup.add(new THREE.Line(
new THREE.BufferGeometry().setFromPoints(spiralPts),
new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.7 })
));
const spiralPts2 = spiralPts.map(p => new THREE.Vector3(-p.x, p.y, -p.z));
lensGroup.add(new THREE.Line(
new THREE.BufferGeometry().setFromPoints(spiralPts2),
new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 })
));
for (let i = 0; i < 12; i++) {
const a = (i / 12) * Math.PI * 2;
lensGroup.add(new THREE.Line(
new THREE.BufferGeometry().setFromPoints([
new THREE.Vector3(0, 0, 0),
new THREE.Vector3(Math.cos(a) * r * 0.95, h * 0.9, Math.sin(a) * r * 0.95)
]),
new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.15 })
));
}
}
{
const grid = new THREE.GridHelper(30, 30, 0x1e293b, 0x111827);
labGroup.add(grid);
for (let i = 0; i < 3; i++) {
const torus = new THREE.Mesh(
new THREE.TorusGeometry(3 + i * 2.2, 0.04, 8, 80),
new THREE.MeshBasicMaterial({ color: i === 1 ? 0xfbbf24 : 0x22d3ee, transparent: true, opacity: 0.35 })
);
torus.rotation.x = Math.PI / 2 + i * 0.2;
labGroup.add(torus);
}
const core = new THREE.Mesh(
new THREE.IcosahedronGeometry(1.1, 1),
new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.7, wireframe: true })
);
labGroup.add(core);
}
let mode = 'sky';
let selected = -1;
let aScale = 1;
function setMode(m) {
mode = m;
document.querySelectorAll('.modes [data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
document.getElementById('mMode').textContent = m[0].toUpperCase() + m.slice(1);
skyGroup.visible = m === 'sky';
cosmosGroup.visible = m === 'cosmos';
lensGroup.visible = m === 'lens';
labGroup.visible = m === 'lab';
starsNear.visible = m === 'sky' || m === 'cosmos';
starsFar.material.opacity = m === 'lab' ? 0.35 : 0.9;
controls.autoRotateSpeed = m === 'cosmos' ? 0.55 : m === 'lab' ? 0.4 : 0.22;
scene.fog.density = m === 'cosmos' ? 0.018 : m === 'lens' ? 0.01 : 0.012;
const leftTitle = document.getElementById('leftTitle');
const leftHint = document.getElementById('leftHint');
const rightHint = document.getElementById('rightHint');
if (m === 'sky') {
leftTitle.textContent = 'Sky catalog';
leftHint.textContent = 'Confirmed exoplanets on the celestial sphere · RA/Dec anchors';
rightHint.textContent = 'NASA-inspired sky · TAFA geometric overlay ready';
camera.position.set(0, 4, 22);
} else if (m === 'cosmos') {
leftTitle.textContent = 'Expansion';
leftHint.textContent = 'Scrub a(t). Kawastony quantumΩ couples into H(z).';
rightHint.textContent = 'Modified Friedmann visualization · not ΛCDM-only';
camera.position.set(0, 6, 28);
} else if (m === 'lens') {
leftTitle.textContent = 'Quadratic lens';
leftHint.textContent = '35° cone · spiral arms · sightline geometry (TAFA / QML)';
rightHint.textContent = 'Cone winding + F_eff-style radial structure';
camera.position.set(8, 10, 18);
} else {
leftTitle.textContent = 'Lab controls';
leftHint.textContent = 'H₀, Ω_q, and coherence readouts from the live a(t) path';
rightHint.textContent = 'Sandbox metrics · export-ready observatory panel';
camera.position.set(0, 8, 16);
}
controls.target.set(0, m === 'lens' ? 4 : 0, 0);
buildLeftList();
toast(m[0].toUpperCase() + m.slice(1) + ' mode');
}
function buildLeftList() {
const el = document.getElementById('leftList');
el.innerHTML = '';
if (mode === 'sky') {
CATALOG.forEach((p, i) => {
const d = document.createElement('div');
d.className = 'item' + (selected === i ? ' on' : '');
d.innerHTML = p.name + '<small>' + p.note + ' · ' + p.dist + ' ly</small>';
d.onclick = () => selectPlanet(i);
el.appendChild(d);
});
} else if (mode === 'cosmos') {
[['Today a=1', 'Observer now'], ['Matter era', 'a ~ 0.3'], ['Recombination', 'a ~ 0.001'], ['TAFA Ω_q', 'quantum coupling term']].forEach((row, i) => {
const d = document.createElement('div');
d.className = 'item';
d.innerHTML = row[0] + '<small>' + row[1] + '</small>';
d.onclick = () => {
if (i < 3) {
const map = [1, 0.3, 0.05];
document.getElementById('ageSlider').value = map[i];
applyScale(map[i]);
}
};
el.appendChild(d);
});
} else if (mode === 'lens') {
[['35° parent cone', 'TAFA geometric prior'], ['Spiral arm A', 'Quadratic winding'], ['Spiral arm B', 'Counter-winding'], ['Sightline spokes', 'Observer projection']].forEach(row => {
const d = document.createElement('div');
d.className = 'item';
d.innerHTML = row[0] + '<small>' + row[1] + '</small>';
el.appendChild(d);
});
} else {
[['H₀ = 67.4', 'km/s/Mpc anchor'], ['Ω_m = 0.31', 'matter density'], ['quantumΩ(a)', 'TAFA coupling'], ['Blind SPARC path', 'rotation-curve lineage']].forEach(row => {
const d = document.createElement('div');
d.className = 'item';
d.innerHTML = row[0] + '<small>' + row[1] + '</small>';
el.appendChild(d);
});
}
}
function selectPlanet(i) {
selected = i;
const p = CATALOG[i];
document.getElementById('mTarget').textContent = p.name;
buildLeftList();
const v = radecToVec(p.ra, p.dec, SKY_R * 0.7);
controls.target.copy(v.clone().multiplyScalar(0.15));
toast(p.name);
}
function applyScale(a) {
aScale = a;
cosmosPts.scale.setScalar(0.6 + a * 1.4);
document.getElementById('mScale').textContent = a.toFixed(3);
document.getElementById('mH').textContent = Hz(a).toFixed(1);
document.getElementById('mQ').textContent = quantumOmega(a).toFixed(3);
const age = (13.8 * Math.pow(a, 1.5)).toFixed(2);
document.getElementById('mAge').textContent = age + ' Gyr';
}
function toast(msg) {
const t = document.getElementById('toast');
t.textContent = msg;
t.classList.add('show');
setTimeout(() => t.classList.remove('show'), 1400);
}
document.querySelectorAll('.modes [data-mode]').forEach(btn => {
btn.addEventListener('click', () => setMode(btn.dataset.mode));
});
document.getElementById('ageSlider').addEventListener('input', e => applyScale(parseFloat(e.target.value)));
document.getElementById('playBtn').addEventListener('click', togglePlay);
document.getElementById('vol').addEventListener('input', e => {
if (master) master.gain.value = parseFloat(e.target.value);
});
const scorePanel = document.getElementById('scorePanel');
document.getElementById('scoreBtn').addEventListener('click', () => {
scorePanel.classList.toggle('open');
});
document.querySelectorAll('.score-panel .type').forEach(el => {
el.addEventListener('click', () => {
typeId = parseInt(el.dataset.type, 10);
document.querySelectorAll('.score-panel .type').forEach(x => x.classList.toggle('on', x === el));
document.getElementById('trackTitle').textContent = SCORE[typeId].label;
document.getElementById('trackSub').textContent = SCORE[typeId].sub;
scorePanel.classList.remove('open');
if (playing) startScore();
else togglePlay();
toast(SCORE[typeId].label);
});
});
const clock = new THREE.Clock();
function frame() {
requestAnimationFrame(frame);
const t = clock.getElapsedTime();
controls.update();
starsFar.rotation.y += 0.0001;
starsNear.rotation.y -= 0.00015;
if (lensGroup.visible) lensGroup.rotation.y += 0.0012;
if (labGroup.visible) labGroup.children.forEach((c, i) => {
if (c.rotation) c.rotation.z += 0.002 * (i + 1);
});
planetMeshes.forEach(({ mesh, halo }, i) => {
const pulse = 1 + 0.08 * Math.sin(t * 2 + i);
halo.scale.setScalar(pulse * (selected === i ? 1.6 : 1));
mesh.material.emissiveIntensity = selected === i ? 1.4 : 0.8;
});
if (cosmosGroup.visible) {
hub.rotation.y += 0.01;
cosmosPts.rotation.y += 0.0008;
}
renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
camera.aspect = innerWidth / innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(innerWidth, innerHeight);
});
setMode('sky');
applyScale(1);
frame();
