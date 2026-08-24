import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { CATALOG } from './catalog.js';
const NOW=2026,H0=67.4;
const qO=a=>Math.min(.95,Math.max(.01,.045*a**-.35+.28*a**1.2));
const Hz=a=>H0*Math.sqrt(.31*a**-3+9e-5*a**-4+.69+qO(a)*a**-1.2);
const lb=a=>13.8*(1-a**1.35);
const left=ly=>ly>5e4?'deep time':String(Math.round(NOW-ly));
const fmt=ly=>ly<100?ly.toFixed(1)+' ly':ly<1e3?~~ly+' ly':(ly/1e3).toFixed(2)+' kly';

const c=document.getElementById('c');
const leftList=document.getElementById('leftList');
const leftTitle=document.getElementById('leftTitle');
const leftHint=document.getElementById('leftHint');
const rightHint=document.getElementById('rightHint');
const chrono=document.getElementById('chrono');
const chronoTrack=document.getElementById('chronoTrack');
const mMode=document.getElementById('mMode');
const mTarget=document.getElementById('mTarget');
const mDist=document.getElementById('mDist');
const mLight=document.getElementById('mLight');
const mLeft=document.getElementById('mLeft');
const mScale=document.getElementById('mScale');
const mLook=document.getElementById('mLook');
const mH=document.getElementById('mH');
const mQ=document.getElementById('mQ');
const ageSlider=document.getElementById('ageSlider');
const playBtn=document.getElementById('playBtn');
const vol=document.getElementById('vol');
const scoreBtn=document.getElementById('scoreBtn');
const scorePanel=document.getElementById('scorePanel');
const trackTitle=document.getElementById('trackTitle');
const trackSub=document.getElementById('trackSub');
let mode='sky',sel=-1,playing=false,typeId=0,ctx,gain,timer,step=0,oscs=[];
const SCORE=[{l:'Baroque',s:'Bach',b:130.81,p:[0,2,4,7,9,12,7,4]},{l:'Classical',s:'Mozart',b:174.61,p:[0,4,7,12,7,4,0,7]},{l:'Nocturne',s:'Chopin',b:116.54,p:[0,3,7,10,7,3,0,5]},{l:'Pastoral',s:'Grieg',b:146.83,p:[0,5,7,12,9,5,2,0]},{l:'Meditation',s:'Suk',b:98,p:[0,5,7,12,19,12,7,5]}];
function audio(){if(ctx)return;ctx=new(AudioContext||webkitAudioContext);gain=ctx.createGain();gain.gain.value=+vol.value;gain.connect(ctx.destination)}
function stop(){clearInterval(timer);timer=null;oscs.forEach(o=>{try{o.stop()}catch{}});oscs=[]}
function note(f,d,t='sine',g=.05){if(!ctx||!playing)return;const o=ctx.createOscillator(),x=ctx.createGain();o.type=t;o.frequency.value=f;const t0=ctx.currentTime;x.gain.setValueAtTime(1e-4,t0);x.gain.exponentialRampToValueAtTime(g,t0+.03);x.gain.exponentialRampToValueAtTime(1e-4,t0+d);o.connect(x);x.connect(gain);o.start(t0);o.stop(t0+d+.02);oscs.push(o)}
function start(){audio();if(ctx.state==='suspended')ctx.resume();stop();playing=true;step=0;const p=SCORE[typeId];timer=setInterval(()=>{const s=p.p[step%p.p.length],f=p.b*2**(s/12);note(f,.55,step%2?'triangle':'sine',.04);note(f*.5,.8,'sine',.02);step++},400);playBtn.textContent='❚❚'}
function toggle(){if(playing){playing=false;stop();playBtn.textContent='▶'}else start()}
const scene=new THREE.Scene();scene.background=new THREE.Color(0x09090b);scene.fog=new THREE.FogExp2(0x09090b,.012);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,500);camera.position.set(0,3,18);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);c.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.autoRotate=true;controls.autoRotateSpeed=.25;
scene.add(new THREE.AmbientLight(0x8899aa,.4));const pl=new THREE.PointLight(0x22d3ee,1.2,80);pl.position.set(10,8,6);scene.add(pl);
const sg=new THREE.BufferGeometry(),sp=new Float32Array(12000);for(let i=0;i<12000;i++)sp[i]=(Math.random()-.5)*200;sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:.09,transparent:true,opacity:.9}));scene.add(stars);
const R=26,radec=(ra,dec,r=R)=>{const th=THREE.MathUtils.degToRad(ra),ph=THREE.MathUtils.degToRad(dec);return new THREE.Vector3(r*Math.cos(ph)*Math.cos(th),r*Math.sin(ph),r*Math.cos(ph)*Math.sin(th))};
const skyG=new THREE.Group(),cosG=new THREE.Group(),lenG=new THREE.Group(),labG=new THREE.Group();scene.add(skyG,cosG,lenG,labG);
const meshes=[];CATALOG.forEach((p,i)=>{const v=radec(p.ra,p.dec),sz=.2+.3/Math.log10(10+p.dist_ly);const m=new THREE.Mesh(new THREE.SphereGeometry(sz,10,10),new THREE.MeshStandardMaterial({color:0x22d3ee,emissive:0x0e7490,emissiveIntensity:.85}));m.position.copy(v);const h=new THREE.Mesh(new THREE.SphereGeometry(sz*1.6,8,8),new THREE.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.12}));h.position.copy(v);skyG.add(m,h);meshes.push({m,h})});
const csg=new THREE.BufferGeometry(),csp=new Float32Array(6000);for(let i=0;i<6000;i++)csp[i]=(Math.random()-.5)*40;csg.setAttribute('position',new THREE.BufferAttribute(csp,3));
const cpts=new THREE.Points(csg,new THREE.PointsMaterial({color:0xc4b5fd,size:.1,transparent:true,opacity:.9}));cosG.add(cpts);
const hub=new THREE.Mesh(new THREE.SphereGeometry(.5,12,12),new THREE.MeshStandardMaterial({color:0xfbbf24,emissive:0xf59e0b,emissiveIntensity:.9}));cosG.add(hub);
{const ang=THREE.MathUtils.degToRad(35),h=14,r=Math.tan(ang)*h;const cone=new THREE.Mesh(new THREE.ConeGeometry(r,h,20,1,true),new THREE.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.08,side:THREE.DoubleSide}));cone.position.y=h/2;cone.rotation.x=Math.PI;lenG.add(cone);for(let k=1;k<=4;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(r/4*k,.02,8,24),new THREE.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.25}));ring.rotation.x=Math.PI/2;ring.position.y=h/4*k*.85;lenG.add(ring)}}
labG.add(new THREE.GridHelper(24,24,0x1e293b,0x111827));
labG.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0x22d3ee,emissive:0x0891b2,emissiveIntensity:.7,wireframe:true})));
const toast=msg=>{const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)};
function upd(p){if(!p){['mTarget','mDist','mLight','mLeft'].forEach(id=>document.getElementById(id).textContent='—');return}mTarget.textContent=p.name;mDist.textContent=fmt(p.dist_ly)+' · '+p.dist_pc.toFixed(2)+' pc';mLight.textContent=p.dist_ly.toFixed(1)+' yr of light';mLeft.textContent=left(p.dist_ly)}
function chrono(){chronoTrack.innerHTML='';CATALOG.forEach((p,i)=>{const b=document.createElement('button');b.className='chrono-pill'+(sel===i?' on':'');b.innerHTML='<b>'+p.name+'</b> · '+fmt(p.dist_ly);b.onclick=()=>{setMode('sky');pick(i)};chronoTrack.appendChild(b)})}
function list(){leftList.innerHTML='';if(mode==='sky')CATALOG.forEach((p,i)=>{const d=document.createElement('div');d.className='item'+(sel===i?' on':'');d.innerHTML=p.name+'<small>'+fmt(p.dist_ly)+' · light left ~'+left(p.dist_ly)+' · '+(p.method||'NASA')+'</small>';d.onclick=()=>pick(i);leftList.appendChild(d)});else if(mode==='cosmos')[[1,'Today'],[.5,'a=0.5'],[.3,'a=0.3'],[.1,'a=0.1']].forEach(([a,l])=>{const d=document.createElement('div');d.className='item';d.innerHTML=l+'<small>lookback '+lb(a).toFixed(2)+' Gyr</small>';d.onclick=()=>{ageSlider.value=a;scale(a)};leftList.appendChild(d)});else[['35 cone','TAFA'],['Spiral','winding'],['NASA','light-years']].forEach(([t,s])=>{const d=document.createElement('div');d.className='item';d.innerHTML=t+'<small>'+s+'</small>';leftList.appendChild(d)})}
function pick(i){sel=i;const p=CATALOG[i];upd(p);list();chrono();const v=radec(p.ra,p.dec,R*.7);controls.target.copy(v.clone().multiplyScalar(.15));toast(p.name+' · '+fmt(p.dist_ly)+' of light')}
function scale(a){cpts.scale.setScalar(.6+a*1.4);mScale.textContent=a.toFixed(3);mH.textContent=Hz(a).toFixed(1);mQ.textContent=qO(a).toFixed(3);const L=lb(a);mLook.textContent=L.toFixed(2)+' Gyr';if(mode==='cosmos'){mLight.textContent='~'+L.toFixed(2)+' Gly path';mLeft.textContent=L>.01?L.toFixed(2)+' Gyr ago':'now';mDist.textContent='a='+a.toFixed(3);mTarget.textContent='Expansion slice'}}
function setMode(m){mode=m;document.querySelectorAll('.modes [data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));mMode.textContent=m[0].toUpperCase()+m.slice(1);skyG.visible=m==='sky';cosG.visible=m==='cosmos';lenG.visible=m==='lens';labG.visible=m==='lab';chrono.style.display=(m==='sky'||m==='cosmos')?'block':'none';leftTitle.textContent=m==='sky'?'NASA sky catalog':m==='cosmos'?'Expansion chronology':m==='lens'?'Quadratic lens':'Lab';leftHint.textContent=m==='sky'?'NASA Exoplanet Archive · light left years ago':m==='cosmos'?'Scrub a(t) + lookback':'TAFA geometry';rightHint.textContent=m==='sky'?'Light-year chronology · what you see is the past':m==='cosmos'?'Kawastony dual a(t)/lookback':'Observatory';camera.position.set(0,m==='cosmos'?6:3,m==='lens'?16:18);controls.target.set(0,m==='lens'?4:0,0);list();toast(m[0].toUpperCase()+m.slice(1)+' mode')}
document.querySelectorAll('.modes [data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
ageSlider.oninput=e=>scale(+e.target.value);playBtn.onclick=toggle;vol.oninput=e=>{if(gain)gain.gain.value=+e.target.value};
scoreBtn.onclick=()=>scorePanel.classList.toggle('open');
document.querySelectorAll('.score-panel .type').forEach(el=>el.onclick=()=>{typeId=+el.dataset.type;document.querySelectorAll('.score-panel .type').forEach(x=>x.classList.toggle('on',x===el));trackTitle.textContent=SCORE[typeId].l;trackSub.textContent=SCORE[typeId].s;scorePanel.classList.remove('open');playing?start():toggle()});
const clock=new THREE.Clock();
(function f(){requestAnimationFrame(f);const t=clock.getElapsedTime();controls.update();stars.rotation.y+=1e-4;if(lenG.visible)lenG.rotation.y+=.001;meshes.forEach(({m,h},i)=>{h.scale.setScalar(1+.08*Math.sin(t*2+i)*(sel===i?1.5:1));m.material.emissiveIntensity=sel===i?1.3:.8});if(cosG.visible){hub.rotation.y+=.01;cpts.rotation.y+=8e-4}renderer.render(scene,camera)})();
onresize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)};
chrono();setMode('sky');scale(1);pick(0);
