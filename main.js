import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { CATALOG } from './catalog.js';

const NOW = 2026, H0 = 67.4;
const quantumOmega = a => Math.min(0.95, Math.max(0.01, 0.045 * a ** -0.35 + 0.28 * a ** 1.2));
const Hz = a => H0 * Math.sqrt(0.31 * a ** -3 + 9e-5 * a ** -4 + 0.69 + quantumOmega(a) * a ** -1.2);
const lookbackGyr = a => 13.8 * (1 - a ** 1.35);
const lightLeftYear = ly => ly > 5e4 ? 'deep time' : String(Math.round(NOW - ly));
const fmtLy = ly => ly < 100 ? ly.toFixed(1) + ' ly' : ly < 1e3 ? ~~ly + ' ly' : (ly / 1e3).toFixed(2) + ' kly';

const c = document.getElementById('c');
const leftListEl = document.getElementById('leftList');
const leftTitleEl = document.getElementById('leftTitle');
const leftHintEl = document.getElementById('leftHint');
const rightHintEl = document.getElementById('rightHint');
const chronoEl = document.getElementById('chrono');
const chronoTrackEl = document.getElementById('chronoTrack');
const mModeEl = document.getElementById('mMode');
const mTargetEl = document.getElementById('mTarget');
const mDistEl = document.getElementById('mDist');
const mLightEl = document.getElementById('mLight');
const mLeftEl = document.getElementById('mLeft');
const mScaleEl = document.getElementById('mScale');
const mLookEl = document.getElementById('mLook');
const mHEl = document.getElementById('mH');
const mQEl = document.getElementById('mQ');
const ageSliderEl = document.getElementById('ageSlider');
const playBtnEl = document.getElementById('playBtn');
const volEl = document.getElementById('vol');
const scoreBtnEl = document.getElementById('scoreBtn');
const scorePanelEl = document.getElementById('scorePanel');
const trackTitleEl = document.getElementById('trackTitle');
const trackSubEl = document.getElementById('trackSub');

let mode = 'sky', sel = -1, playing = false, typeId = 0, ctx, gain, timer, step = 0, oscs = [];
const SCORE = [
  { l: 'Baroque', s: 'Bach', b: 130.81, p: [0, 2, 4, 7, 9, 12, 7, 4] },
  { l: 'Classical', s: 'Mozart', b: 174.61, p: [0, 4, 7, 12, 7, 4, 0, 7] },
  { l: 'Nocturne', s: 'Chopin', b: 116.54, p: [0, 3, 7, 10, 7, 3, 0, 5] },
  { l: 'Pastoral', s: 'Grieg', b: 146.83, p: [0, 5, 7, 12, 9, 5, 2, 0] },
  { l: 'Meditation', s: 'Suk', b: 98, p: [0, 5, 7, 12, 19, 12, 7, 5] }
];

function audio() {
  if (ctx) return;
  ctx = new (AudioContext || webkitAudioContext)();
  gain = ctx.createGain();
  gain.gain.value = +volEl.value;
  gain.connect(ctx.destination);
}

function stop() {
  clearInterval(timer);
  timer = null;
  oscs.forEach(o => { try { o.stop(); } catch {} });
  oscs = [];
}

function note(f, d, t = 'sine', g = 0.05) {
  if (!ctx || !playing) return;
  const o = ctx.createOscillator(), x = ctx.createGain();
  o.type = t;
  o.frequency.value = f;
  const t0 = ctx.currentTime;
  x.gain.setValueAtTime(1e-4, t0);
  x.gain.exponentialRampToValueAtTime(g, t0 + 0.03);
  x.gain.exponentialRampToValueAtTime(1e-4, t0 + d);
  o.connect(x);
  x.connect(gain);
  o.start(t0);
  o.stop(t0 + d + 0.02);
  oscs.push(o);
}

function start() {
  audio();
  if (ctx.state === 'suspended') ctx.resume();
  stop();
  playing = true;
  step = 0;
  const p = SCORE[typeId];
  timer = setInterval(() => {
    const s = p.p[step % p.p.length], f = p.b * 2 ** (s / 12);
    note(f, 0.55, step % 2 ? 'triangle' : 'sine', 0.04);
    note(f * 0.5, 0.8, 'sine', 0.02);
    step++;
  }, 400);
  playBtnEl.textContent = '❚❚';
}

function toggle() {
  if (playing) {
    playing = false;
    stop();
    playBtnEl.textContent = '▶';
  } else start();
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09090b);
scene.fog = new THREE.FogExp2(0x09090b, 0.012);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 3, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
c.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;

scene.add(new THREE.AmbientLight(0x8899aa, 0.4));
const pl = new THREE.PointLight(0x22d3ee, 1.2, 80);
pl.position.set(10, 8, 6);
scene.add(pl);

const sg = new THREE.BufferGeometry(), sp = new Float32Array(12000);
for (let i = 0; i < 12000; i++) sp[i] = (Math.random() - 0.5) * 200;
sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const starsFar = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9 }));
scene.add(starsFar);

const SKY_R = 26;
const radecToVec = (ra, dec, r = SKY_R) => {
  const th = THREE.MathUtils.degToRad(ra), ph = THREE.MathUtils.degToRad(dec);
  return new THREE.Vector3(r * Math.cos(ph) * Math.cos(th), r * Math.sin(ph), r * Math.cos(ph) * Math.sin(th));
};

const skyGroup = new THREE.Group(), cosmosGroup = new THREE.Group(), lensGroup = new THREE.Group(), labGroup = new THREE.Group();
scene.add(skyGroup, cosmosGroup, lensGroup, labGroup);

const planetMeshes = [];
CATALOG.forEach((p, i) => {
  const v = radecToVec(p.ra, p.dec), sz = 0.2 + 0.3 / Math.log10(10 + p.dist_ly);
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(sz, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7490, emissiveIntensity: 0.85 })
  );
  m.position.copy(v);
  const h = new THREE.Mesh(
    new THREE.SphereGeometry(sz * 1.6, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.12 })
  );
  h.position.copy(v);
  skyGroup.add(m, h);
  planetMeshes.push({ mesh: m, halo: h });
});

const csg = new THREE.BufferGeometry(), csp = new Float32Array(6000);
for (let i = 0; i < 6000; i++) csp[i] = (Math.random() - 0.5) * 40;
csg.setAttribute('position', new THREE.BufferAttribute(csp, 3));
const cosmosPts = new THREE.Points(csg, new THREE.PointsMaterial({ color: 0xc4b5fd, size: 0.1, transparent: true, opacity: 0.9 }));
cosmosGroup.add(cosmosPts);

const hub = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
);
cosmosGroup.add(hub);

{
  const ang = THREE.MathUtils.degToRad(35), h = 14, r = Math.tan(ang) * h;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(r, h, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
  );
  cone.position.y = h / 2;
  cone.rotation.x = Math.PI;
  lensGroup.add(cone);
  for (let k = 1; k <= 4; k++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r / 4 * k, 0.02, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = h / 4 * k * 0.85;
    lensGroup.add(ring);
  }
}

labGroup.add(new THREE.GridHelper(24, 24, 0x1e293b, 0x111827));
labGroup.add(
  new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.7, wireframe: true })
  )
);

const starsNear = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3000), 3)),
  new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.05, transparent: true, opacity: 0.6 })
);
for (let i = 0; i < 1000; i++) {
  const pos = starsNear.geometry.attributes.position.array;
  pos[i * 3] = (Math.random() - 0.5) * 50;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
}
cosmosGroup.add(starsNear);

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1600);
}

function updateTargetReadout(p) {
  if (!p) {
    ['mTarget', 'mDist', 'mLight', 'mLeft'].forEach(id => document.getElementById(id).textContent = '—');
    return;
  }
  document.getElementById('mTarget').textContent = p.name;
  document.getElementById('mDist').textContent = fmtLy(p.dist_ly) + ' · ' + p.dist_pc.toFixed(2) + ' pc';
  document.getElementById('mLight').textContent = p.dist_ly.toFixed(1) + ' yr of light';
  document.getElementById('mLeft').textContent = lightLeftYear(p.dist_ly);
}

function buildChronology() {
  const track = document.getElementById('chronoTrack');
  track.innerHTML = '';
  CATALOG.forEach((p, i) => {
    const pill = document.createElement('button');
    pill.className = 'chrono-pill' + (sel === i ? ' on' : '');
    pill.innerHTML = '<b>' + p.name + '</b> · ' + fmtLy(p.dist_ly);
    pill.title = 'Light travel ' + p.dist_ly.toFixed(1) + ' yr · left ~' + lightLeftYear(p.dist_ly);
    pill.onclick = () => { setMode('sky'); selectPlanet(i); };
    track.appendChild(pill);
  });
}

function buildLeftList() {
  const el = document.getElementById('leftList');
  el.innerHTML = '';
  if (mode === 'sky') {
    CATALOG.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'item' + (sel === i ? ' on' : '');
      d.innerHTML = p.name + '<small>' + fmtLy(p.dist_ly) + ' · light left ~' + lightLeftYear(p.dist_ly) + ' · ' + (p.method || 'NASA') + '</small>';
      d.onclick = () => selectPlanet(i);
      el.appendChild(d);
    });
  } else if (mode === 'cosmos') {
    [[1, 'Today', 'a=1'], [0.5, 'a=0.5', 'mid expansion'], [0.3, 'a=0.3', 'matter-era'], [0.1, 'a=0.1', 'deep lookback']].forEach(([a, l, desc]) => {
      const d = document.createElement('div');
      d.className = 'item';
      d.innerHTML = l + '<small>' + desc + '</small>';
      d.onclick = () => { ageSliderEl.value = a; applyScale(a); };
      el.appendChild(d);
    });
  } else if (mode === 'lens') {
    [['35 parent cone', 'TAFA prior'], ['Spiral arms', 'Quadratic winding'], ['Sightlines', 'Observer projection']].forEach(row => {
      const d = document.createElement('div');
      d.className = 'item';
      d.innerHTML = row[0] + '<small>' + row[1] + '</small>';
      el.appendChild(d);
    });
  } else {
    [['H0 = 67.4', 'km/s/Mpc'], ['NASA archive', 'sy_dist to light-years'], ['quantumOmega(a)', 'TAFA'], ['Lookback', 'scrubber']].forEach(row => {
      const d = document.createElement('div');
      d.className = 'item';
      d.innerHTML = row[0] + '<small>' + row[1] + '</small>';
      el.appendChild(d);
    });
  }
}

function selectPlanet(i) {
  sel = i;
  const p = CATALOG[i];
  updateTargetReadout(p);
  buildLeftList();
  buildChronology();
  const v = radecToVec(p.ra, p.dec, SKY_R * 0.7);
  controls.target.copy(v.clone().multiplyScalar(0.15));
  toast(p.name + ' · ' + fmtLy(p.dist_ly) + ' of light');
}

function applyScale(a) {
  cosmosPts.scale.setScalar(0.6 + a * 1.4);
  document.getElementById('mScale').textContent = a.toFixed(3);
  document.getElementById('mH').textContent = Hz(a).toFixed(1);
  document.getElementById('mQ').textContent = quantumOmega(a).toFixed(3);
  const lb = lookbackGyr(a);
  document.getElementById('mLook').textContent = lb.toFixed(2) + ' Gyr';
  if (mode === 'cosmos') {
    document.getElementById('mLight').textContent = '~' + lb.toFixed(2) + ' Gly path';
    document.getElementById('mLeft').textContent = lb > 0.01 ? lb.toFixed(2) + ' Gyr ago' : 'now';
    document.getElementById('mDist').textContent = 'a=' + a.toFixed(3);
    document.getElementById('mTarget').textContent = 'Expansion slice';
  }
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.modes [data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  document.getElementById('mMode').textContent = m[0].toUpperCase() + m.slice(1);
  skyGroup.visible = m === 'sky';
  cosmosGroup.visible = m === 'cosmos';
  lensGroup.visible = m === 'lens';
  labGroup.visible = m === 'lab';
  starsFar.visible = m === 'sky' || m === 'cosmos';
  starsNear.visible = m === 'cosmos';
  starsFar.material.opacity = m === 'lab' ? 0.35 : 0.9;
  document.getElementById('chrono').style.display = (m === 'sky' || m === 'cosmos') ? 'block' : 'none';
  controls.autoRotateSpeed = m === 'cosmos' ? 0.55 : m === 'lab' ? 0.4 : 0.22;
  
  const leftTitle = document.getElementById('leftTitle');
  const leftHint = document.getElementById('leftHint');
  const rightHint = document.getElementById('rightHint');
  
  if (m === 'sky') {
    leftTitle.textContent = 'Stars + NASA systems';
    leftHint.textContent = 'Zodiac · bright stars · NASA · light left';
    rightHint.textContent = 'Light-year chronology · what you see is the past';
    camera.position.set(0, 4, 22);
  } else if (m === 'cosmos') {
    leftTitle.textContent = 'Expansion chronology';
    leftHint.textContent = 'Scrub a(t) + lookback together';
    rightHint.textContent = 'Kawastony dual a(t)/lookback';
    camera.position.set(0, 6, 28);
  } else if (m === 'lens') {
    leftTitle.textContent = 'Quadratic lens';
    leftHint.textContent = 'TAFA geometry';
    rightHint.textContent = 'Observatory';
    camera.position.set(8, 10, 18);
  } else {
    leftTitle.textContent = 'Lab';
    leftHint.textContent = 'H0, Omega_q, lookback';
    rightHint.textContent = 'Observatory metrics';
    camera.position.set(0, 8, 16);
  }
  
  controls.target.set(0, m === 'lens' ? 4 : 0, 0);
  buildLeftList();
  toast(m[0].toUpperCase() + m.slice(1) + ' mode');
}

document.querySelectorAll('.modes [data-mode]').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
document.getElementById('ageSlider').addEventListener('input', e => applyScale(parseFloat(e.target.value)));
document.getElementById('playBtn').addEventListener('click', toggle);
document.getElementById('vol').addEventListener('input', e => { if (gain) gain.gain.value = parseFloat(e.target.value); });
document.getElementById('scoreBtn').addEventListener('click', () => scorePanelEl.classList.toggle('open'));
document.querySelectorAll('.score-panel .type').forEach(el => el.addEventListener('click', () => {
  typeId = parseInt(el.dataset.type, 10);
  document.querySelectorAll('.score-panel .type').forEach(x => x.classList.toggle('on', x === el));
  document.getElementById('trackTitle').textContent = SCORE[typeId].l;
  document.getElementById('trackSub').textContent = SCORE[typeId].s;
  scorePanelEl.classList.remove('open');
  if (playing) start(); else toggle();
  toast(SCORE[typeId].l);
}));

const clock = new THREE.Clock();
(function frame() {
  requestAnimationFrame(frame);
  const t = clock.getElapsedTime();
  controls.update();
  starsFar.rotation.y += 1e-4;
  starsNear.rotation.y -= 1.5e-4;
  if (lensGroup.visible) lensGroup.rotation.y += 0.0012;
  if (labGroup.visible) labGroup.children.forEach((c, i) => { if (c.rotation) c.rotation.z += 0.002 * (i + 1); });
  planetMeshes.forEach(({ mesh, halo }, i) => {
    const pulse = 1 + 0.08 * Math.sin(t * 2 + i);
    halo.scale.setScalar(pulse * (sel === i ? 1.6 : 1));
    mesh.material.emissiveIntensity = sel === i ? 1.4 : 0.8;
  });
  if (cosmosGroup.visible) {
    hub.rotation.y += 0.01;
    cosmosPts.rotation.y += 8e-4;
  }
  renderer.render(scene, camera);
})();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Guided Tour / Visitation
let touring = false, tourIdx = 0, tourTimer = null;
const TOUR_SEQ = [12, 15, 26, 27, 0, 2, 116, 21, 19, 6, 4, 22, 120, 121];
const tourBtn = document.getElementById('tourBtn');

function stopTour() {
  touring = false;
  if (tourTimer) { clearTimeout(tourTimer); tourTimer = null; }
  controls.autoRotate = true;
  if (tourBtn) tourBtn.textContent = 'Tour';
}

function nextTourStop() {
  if (!touring) return;
  const i = TOUR_SEQ[tourIdx % TOUR_SEQ.length];
  setMode('sky');
  selectPlanet(i);
  controls.autoRotate = false;
  const p = CATALOG[i];
  toast('Tour · ' + p.name + ' · light left ~' + lightLeftYear(p.dist_ly));
  tourIdx++;
  tourTimer = setTimeout(nextTourStop, 5500);
}

if (tourBtn) tourBtn.onclick = () => {
  if (touring) { stopTour(); toast('Tour stopped'); return; }
  touring = true;
  tourIdx = 0;
  tourBtn.textContent = 'Stop';
  toast('Starting guided visitation…');
  nextTourStop();
};

buildChronology();
setMode('sky');
applyScale(1);
selectPlanet(0);
