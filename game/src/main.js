// main.js — Solmere bootstrap: renderer, low golden-hour sun with a shadow
// frustum recentered on each shot's focus (so the beach gets real cast shadows
// too), PMREM env map for glossy paint, per-shot staging, free-play driving.
import * as T from 'three';
import { buildWorld, groundHeight } from './world.js';
import { makeSportsCar, makePoliceCruiser, makeTrafficCar } from './vehicles.js';
import { makePerson, makeNiaBusted } from './people.js';
import { paintMinimap, applyHud } from './hud.js';

const params = new URLSearchParams(location.search);
const shot = Number(params.get('shot') || 0);

const canvas = document.querySelector('#world');
const renderer = new T.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new T.Scene();
scene.fog = new T.Fog(0xe8956a, 280, 900);

// dusk environment for glossy reflections (gradient sky baked to a PMREM)
{
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#241a4e'); grad.addColorStop(0.45, '#c65a52');
  grad.addColorStop(0.62, '#ffb35c'); grad.addColorStop(0.75, '#7a4a3a'); grad.addColorStop(1, '#241a1e');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#ffd9a0'; g.beginPath(); g.arc(150, 150, 26, 0, Math.PI * 2); g.fill();
  const tex = new T.CanvasTexture(c);
  tex.mapping = T.EquirectangularReflectionMapping; tex.colorSpace = T.SRGBColorSpace;
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  tex.dispose(); pmrem.dispose();
}

const { sunDir, disc } = buildWorld(scene);

// ---------- lights ----------
scene.add(new T.HemisphereLight(0xffd5ad, 0x30283b, 0.85));
const sun = new T.DirectionalLight(0xffc27a, 3.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.8;
sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);

// Shadow focus per shot: recenter the ortho frustum on what the camera sees,
// so shadows stay crisp everywhere (street AND beach) instead of one huge
// soft frustum for the whole map.
const SHADOW_FOCUS = {
  0: [0, -50], 1: [0, -115], 2: [0, -25], 3: [145, 5], 4: [0, -40],
};
function focusShadows(shotNo) {
  const [fx, fz] = SHADOW_FOCUS[shotNo] || [0, -50];
  const focus = new T.Vector3(fx, 0, fz);
  sun.position.copy(focus).addScaledVector(sunDir, 170);
  sun.target.position.copy(focus);
  const cam = sun.shadow.camera;
  cam.left = -60; cam.right = 60; cam.top = 60; cam.bottom = -60;
  cam.near = 20; cam.far = 420; cam.updateProjectionMatrix();
}
focusShadows(shot);

// ---------- actors ----------
const playerCar = makeSportsCar(0xe03828);
const police = [makePoliceCruiser(), makePoliceCruiser()];
const traffic = [
  makeTrafficCar(0x3a6a8a), makeTrafficCar(0xc9a24a), makeTrafficCar(0x7a7a72),
  makeTrafficCar(0x8a3a3a), makeTrafficCar(0x4a7a5a),
];
const nia = makeNiaBusted({ jacket: 0xbf303b, pants: 0x2c3242, hair: 0x1c1210 });
const niaStanding = makePerson({ jacket: 0xbf303b, pants: 0x2c3242, hair: 0x1c1210, nia: true });
const pedestrians = [];
const pedPalette = [0xdf804f, 0x34758a, 0xdfbd61, 0x80434d, 0xd4d2c3, 0xe58251, 0x326b7d];
for (let i = 0; i < 14; i++) {
  pedestrians.push(makePerson({ jacket: pedPalette[i % pedPalette.length] }));
}
for (const o of [playerCar, ...police, ...traffic, nia, niaStanding, ...pedestrians]) scene.add(o);
nia.visible = false; niaStanding.visible = false; playerCar.visible = false;

function place(obj, x, z, ry = 0) {
  obj.position.set(x, groundHeight(x, z), z);
  obj.rotation.y = ry;
}
function placeCar(obj, x, z, ry = 0) { place(obj, x, z, ry); }

const camera = new T.PerspectiveCamera(57, innerWidth / innerHeight, 0.1, 2000);
let driving = false;
let speedKmh = 0;

// ---------- staging ----------
if (shot === 1) {
  // SHOT 1 - "The Getaway": a low, close chase cam. The red sports car is the
  // hero - big in the lower centre, rear three-quarter - one cruiser tucked
  // beside it, one ahead left, sun sitting right above the vanishing point.
  placeCar(playerCar, -1.5, -109, Math.PI); playerCar.visible = true; driving = true; speedKmh = 84;
  placeCar(police[0], 4.5, -115, Math.PI - 0.15);
  placeCar(police[1], -5, -118, Math.PI + 0.12);
  placeCar(traffic[0], 5, -158, Math.PI); placeCar(traffic[1], -3.5, -185, Math.PI);
  placeCar(traffic[2], 2, -212, Math.PI);
  traffic[3].visible = false; traffic[4].visible = false; police.forEach(c => { c.visible = true; });
  camera.position.set(-1, 2.2, -102); camera.lookAt(-1.5, 1.0, -112); camera.fov = 60;
  disc.position.set(-30, 95, -720); disc.lookAt(camera.position);
} else if (shot === 2) {
  // SHOT 2 - "Nia": a character portrait. Nia fills the left third at ~45%
  // frame height, facing the camera, hands up; two cruisers closing in
  // behind her, pedestrians frozen on the sidewalks.
  playerCar.visible = false;
  nia.visible = true; place(nia, -2.6, -17.5, 0.5);
  placeCar(police[0], -10, -25, Math.PI - 0.9);
  placeCar(police[1], 6.5, -26, Math.PI + 0.7);
  placeCar(traffic[0], -3.5, -62, Math.PI); placeCar(traffic[1], 3.5, -78, Math.PI);
  traffic.slice(2).forEach(c => { c.visible = false; });
  place(pedestrians[0], -8.5, -13, 0.9); place(pedestrians[1], 3.5, -21, -2.4);
  place(pedestrians[2], 7, -15, 1.4);
  pedestrians.slice(3).forEach(p => { p.visible = false; });
  camera.position.set(3.0, 1.9, -9.0); camera.lookAt(0.5, 1.6, -18); camera.fov = 55;
  disc.position.set(-30, 95, -720); disc.lookAt(camera.position);
  const d1 = Math.hypot(camera.position.x - police[0].position.x, camera.position.z - police[0].position.z);
  const d2 = Math.hypot(camera.position.x - police[1].position.x, camera.position.z - police[1].position.z);
  applyHud(2, `HARBOR PATROL \u00b7 ${Math.round(d1)}m / ${Math.round(d2)}m`);
} else if (shot === 3) {
  // SHOT 3 - "Golden Hour Beach": low on the sand, looking east. Nia walks
  // the footprint trail toward the water (left-centre), the teal sea and a
  // low sun fill the right two-thirds. The beach is the subject, not a void.
  playerCar.visible = false; police.forEach(c => { c.visible = false; });
  traffic.forEach(c => { c.visible = false; });
  niaStanding.visible = true; place(niaStanding, 150, 8, 1.8);
  place(pedestrians[0], 156, -2, -1.2); // the contact, at the waterline
  place(pedestrians[1], 136, -4, 2.2);  // a beach walker
  pedestrians.slice(2).forEach(p => { p.visible = false; });
  camera.position.set(140, 4, 20); camera.lookAt(180, 1, -5); camera.fov = 58;
  disc.position.set(430, 55, -30); disc.lookAt(camera.position);
  applyHud(3);
} else if (shot === 4) {
  // SHOT 4 - "The City": an elevated dusk vista down the whole marina
  // boulevard. Road, traffic, two cruisers, palms, lit windows and neon on
  // both sides, sun above the vanishing point - one frame that says the
  // world is complete. Nia on the sidewalk, the red car on the road below.
  placeCar(playerCar, -3, -42, Math.PI); playerCar.visible = true;
  placeCar(police[0], -4.5, -22, Math.PI - 0.05);
  placeCar(police[1], 4.5, -32, Math.PI + 0.08);
  placeCar(traffic[0], 3, -60, Math.PI); placeCar(traffic[1], -4, -85, Math.PI);
  placeCar(traffic[2], 0.5, -110, Math.PI);
  traffic[3].visible = false; traffic[4].visible = false;
  niaStanding.visible = true; place(niaStanding, -12, -26, 0.6);
  place(pedestrians[0], 12.5, -45, 2.8);
  place(pedestrians[1], -12.5, -60, -2.9);
  place(pedestrians[2], 13, -22, 2.2);
  pedestrians.slice(3).forEach(p => { p.visible = false; });
  camera.position.set(0, 16, 2); camera.lookAt(0, 2, -130); camera.fov = 55;
  disc.position.set(-30, 95, -720); disc.lookAt(camera.position);
  applyHud(4);
} else {
  // shot 0 — free play overview: car + Nia in the marina, traffic cruising.
  placeCar(playerCar, 0, -60, Math.PI); playerCar.visible = true; driving = true;
  placeCar(police[0], 5, -40, Math.PI); placeCar(police[1], -5, -80, Math.PI);
  placeCar(traffic[0], -3.5, -100, Math.PI); placeCar(traffic[1], 3.5, -130, Math.PI);
  placeCar(traffic[2], -3.5, -160, Math.PI); placeCar(traffic[3], 3.5, -190, Math.PI);
  traffic[4].visible = false;
  niaStanding.visible = true; place(niaStanding, -12, -52, 0.4);
  pedestrians.slice(0, 10).forEach((p, i) => place(p, -14 + (i % 5) * 3, -30 - Math.floor(i / 5) * 6, Math.PI));
  pedestrians.slice(10).forEach(p => { p.visible = false; });
  camera.position.set(14, 9, -30); camera.lookAt(0, 1, -70); camera.fov = 57;
  // shot 0 HUD (free play): driving, 2 stars, hint visible
  document.getElementById('place').textContent = 'MARINA QUARTER';
  document.getElementById('clock').textContent = '19:42';
  document.getElementById('stars').textContent = '★★☆☆☆';
  document.getElementById('objective').textContent = 'Lose the Harbor Patrol';
  document.getElementById('speed').style.display = 'block';
  document.getElementById('speed-val').textContent = '000';
  document.getElementById('prompt').style.display = 'none';
  document.getElementById('busted').style.display = 'none';
  document.getElementById('patrol').style.display = 'none';
  document.getElementById('hint').style.display = 'block';
}

// minimap from the staged positions
if (shot === 1) applyHud(1);
paintMinimap(document.getElementById('minimap'), {
  player: playerCar.visible ? { x: playerCar.position.x, z: playerCar.position.z } : null,
  nia: (nia.visible || niaStanding.visible) ? { x: (nia.visible ? nia : niaStanding).position.x, z: (nia.visible ? nia : niaStanding).position.z } : null,
  police: police.filter(c => c.visible).map(c => ({ x: c.position.x, z: c.position.z })),
  traffic: traffic.filter(c => c.visible).map(c => ({ x: c.position.x, z: c.position.z })),
});

camera.updateProjectionMatrix();

// ---------- free-play driving (shot 0; also live in shot 1) ----------
const keys = new Set();
addEventListener('keydown', e => {
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'e') driving = true;
  if (e.key.toLowerCase() === 'f') driving = false;
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

const clock = new T.Clock();
let glowPhase = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  glowPhase += dt;
  // police light-bar glow pulse (free play only; staged shots stay deterministic)
  if (shot === 0) {
    for (const c of police) c.children.forEach(ch => {
      if (ch.isSprite) ch.material.opacity = 0.45 + 0.4 * Math.sin(glowPhase * 6 + c.position.z);
    });
    for (const c of traffic) {
      c.position.z -= dt * 6;
      if (c.position.z < -250) c.position.z = 140;
      c.position.y = groundHeight(c.position.x, c.position.z);
    }
  }
  if (shot === 0 || shot === 1) {
    const mover = driving ? playerCar : niaStanding;
    const sp = driving ? 14 : 3.2;
    let moved = false;
    if (keys.has('w')) { mover.position.z -= Math.cos(mover.rotation.y) * sp * dt; mover.position.x += Math.sin(mover.rotation.y) * sp * dt; moved = true; }
    if (keys.has('s')) { mover.position.z += Math.cos(mover.rotation.y) * sp * dt; mover.position.x -= Math.sin(mover.rotation.y) * sp * dt; moved = true; }
    if (keys.has('a')) mover.rotation.y += 1.9 * dt;
    if (keys.has('d')) mover.rotation.y -= 1.9 * dt;
    if (moved) {
      mover.position.x = T.MathUtils.clamp(mover.position.x, -60, 150);
      mover.position.z = T.MathUtils.clamp(mover.position.z, -250, 150);
      mover.position.y = groundHeight(mover.position.x, mover.position.z);
      speedKmh = driving ? 84 : 0;
      if (shot === 0) {
        document.getElementById('speed-val').textContent = String(speedKmh).padStart(3, '0');
        camera.position.set(mover.position.x + 8, 7, mover.position.z + 14);
        camera.lookAt(mover.position.x, 1, mover.position.z - 10);
      }
    }
  }
  renderer.render(scene, camera);
}
frame();
requestAnimationFrame(() => { window.__shotReady = true; });
