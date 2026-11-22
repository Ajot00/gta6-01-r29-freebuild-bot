// hud.js — minimap (drawn from the real world layout) + per-shot HUD state.
// HUD values are honest per shot: the clock advances through the evening,
// stars and speed match what is on screen (0 / hidden on foot).
import * as T from 'three';

// World bounds mapped onto the 150x150 minimap.
const MAP = { x0: -90, x1: 190, z0: -260, z1: 180 };
function mx(x) { return ((x - MAP.x0) / (MAP.x1 - MAP.x0)) * 150; }
function mz(z) { return ((z - MAP.z0) / (MAP.z1 - MAP.z0)) * 150; }

export function paintMinimap(canvas, focus) {
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, 150, 150);
  // land
  g.fillStyle = '#8a7a5e'; g.fillRect(0, 0, 150, 150);
  // sea (east)
  g.fillStyle = '#1b8a96'; g.fillRect(mx(155), 0, 150 - mx(155), 150);
  // beach sand
  g.fillStyle = '#d8bd8a'; g.fillRect(mx(55), mz(-110), mx(155) - mx(55), mz(160) - mz(-110));
  // road
  g.fillStyle = '#33363a'; g.fillRect(mx(-7), mz(-260), mx(7) - mx(-7), mz(160) - mz(-260));
  g.fillStyle = '#d8b96a';
  for (let z = -250; z < 160; z += 16) g.fillRect(mx(-0.4), mz(z), 1, 5);
  // city blocks (west)
  g.fillStyle = '#6b5a4a';
  for (let z = -240; z <= 140; z += 36) for (const x of [-24, -48]) g.fillRect(mx(x - 8), mz(z - 11), 9, 12);
  // beachfront hotels (north edge of beach)
  g.fillStyle = '#7a6a5a';
  for (let i = 0; i < 5; i++) g.fillRect(mx(68 + i * 19 - 7), mz(-109), 8, 8);
  // promenade boardwalk
  g.fillStyle = '#8a6a48'; g.fillRect(mx(50), mz(-70), 3, mz(150) - mz(-70));
  // dots
  const dot = (x, z, color, r = 4) => {
    g.fillStyle = color; g.beginPath(); g.arc(mx(x), mz(z), r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1; g.stroke();
  };
  if (focus.player) dot(focus.player.x, focus.player.z, '#e03828', 4.5);
  if (focus.nia) dot(focus.nia.x, focus.nia.z, '#ffd23e', 4);
  for (const p of focus.police || []) dot(p.x, p.z, '#2a6aff', 3.5);
  for (const p of focus.traffic || []) dot(p.x, p.z, '#ffffff', 2.5);
  // north tick
  g.fillStyle = '#fff'; g.font = 'bold 10px Arial'; g.fillText('N', 72, 12);
}

export const SHOT_HUD = {
  1: { place: 'MARINA QUARTER', clock: '19:42', stars: 3, speed: '084', objective: 'Lose the Harbor Patrol', prompt: '', patrol: '' },
  2: { place: 'MARINA QUARTER', clock: '19:47', stars: 3, speed: null, objective: 'Talk your way out — or run', prompt: 'F · <b>TALK</b> / STEAL', patrol: '' },
  3: { place: 'SOLMERE WATERFRONT', clock: '19:51', stars: 0, speed: null, objective: 'Meet the contact at the waterline', prompt: 'F · <b>TALK</b>', patrol: '' },
  4: { place: 'EAST PROMENADE', clock: '19:58', stars: 2, speed: null, objective: 'Take the car and go', prompt: 'E · <b>STEAL VEHICLE</b>', patrol: '' },
};

export function applyHud(shot, patrolText = '') {
  const h = SHOT_HUD[shot];
  document.getElementById('place').textContent = h.place;
  document.getElementById('clock').textContent = h.clock;
  document.getElementById('stars').textContent = '★'.repeat(h.stars) + '☆'.repeat(5 - h.stars);
  document.getElementById('objective').textContent = h.objective;
  const speedEl = document.getElementById('speed');
  if (h.speed) { speedEl.style.display = 'block'; document.getElementById('speed-val').textContent = h.speed; }
  else speedEl.style.display = 'none';
  const promptEl = document.getElementById('prompt');
  if (h.prompt) { promptEl.style.display = 'block'; promptEl.innerHTML = h.prompt; }
  else promptEl.style.display = 'none';
  document.getElementById('busted').style.display = shot === 2 ? 'block' : 'none';
  const patrolEl = document.getElementById('patrol');
  if (patrolText) { patrolEl.style.display = 'block'; patrolEl.textContent = patrolText; }
  else patrolEl.style.display = 'none';
  document.getElementById('hint').style.display = shot === 0 ? 'block' : 'none';
}
