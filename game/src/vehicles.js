// vehicles.js — cars for Solmere. Sports car uses a clearcoat physical material
// so the red reads glossy under the dusk sun + env map.
import * as T from 'three';

function wheel(r = 0.36) {
  const g = new T.Group();
  const tire = new T.Mesh(new T.CylinderGeometry(r, r, 0.26, 14),
    new T.MeshStandardMaterial({ color: '#141414', roughness: 0.9 }));
  tire.rotation.z = Math.PI / 2; tire.castShadow = true; g.add(tire);
  const hub = new T.Mesh(new T.CylinderGeometry(r * 0.55, r * 0.55, 0.28, 10),
    new T.MeshStandardMaterial({ color: '#c8ccd2', roughness: 0.3, metalness: 0.8 }));
  hub.rotation.z = Math.PI / 2; g.add(hub);
  return g;
}

function glowSprite(color, scale = 1.6) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, color); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const tex = new T.CanvasTexture(c);
  const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.setScalar(scale); return s;
}

export function makeSportsCar(color = 0xe03828) {
  const car = new T.Group();
  const paint = new T.MeshPhysicalMaterial({
    color, metalness: 0.35, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08,
  });
  const dark = new T.MeshStandardMaterial({ color: '#14161c', roughness: 0.4, metalness: 0.3 });
  // low wide body + sloped hood + cabin
  const body = new T.Mesh(new T.BoxGeometry(1.9, 0.42, 4.5), paint);
  body.position.y = 0.48; body.castShadow = true; car.add(body);
  const hood = new T.Mesh(new T.BoxGeometry(1.7, 0.22, 1.3), paint);
  hood.position.set(0, 0.68, 1.55); hood.rotation.x = 0.1; hood.castShadow = true; car.add(hood);
  const cabin = new T.Mesh(new T.BoxGeometry(1.6, 0.42, 2.1),
    new T.MeshStandardMaterial({ color: '#10141c', roughness: 0.12, metalness: 0.55 }));
  cabin.position.set(0, 0.85, -0.35); cabin.castShadow = true; car.add(cabin);
  // white racing stripes over the hood + roof
  for (const sx of [-0.32, 0.32]) {
    const st = new T.Mesh(new T.BoxGeometry(0.3, 0.03, 3.9),
      new T.MeshStandardMaterial({ color: '#f5ead6', roughness: 0.4 }));
    st.position.set(sx, 0.72, 0.4); st.rotation.x = 0.02; car.add(st);
  }
  // spoiler: black wing so it reads as a separate aero part, not a red shelf
  const wing = new T.Mesh(new T.BoxGeometry(1.8, 0.06, 0.4), dark);
  wing.position.set(0, 0.95, -2.15); wing.castShadow = true; car.add(wing);
  for (const sx of [-0.7, 0.7]) {
    const strut = new T.Mesh(new T.BoxGeometry(0.08, 0.3, 0.08), dark);
    strut.position.set(sx, 0.78, -2.15); car.add(strut);
  }
  // headlights: white emissive discs + glow
  for (const sx of [-0.62, 0.62]) {
    const hl = new T.Mesh(new T.CircleGeometry(0.14, 10),
      new T.MeshBasicMaterial({ color: '#fff6d8' }));
    hl.position.set(sx, 0.52, 2.26); car.add(hl);
    const glow = glowSprite('rgba(255,240,200,0.9)', 1.4);
    glow.position.set(sx, 0.52, 2.4); car.add(glow);
  }
  // taillight bar: taller, full-width red emissive strip + glow + diffuser + exhausts
  const tl = new T.Mesh(new T.BoxGeometry(1.7, 0.17, 0.05),
    new T.MeshBasicMaterial({ color: '#ff2a22' }));
  tl.position.set(0, 0.58, -2.26); car.add(tl);
  for (const sx of [-0.62, 0.62]) {
    const tg = glowSprite('rgba(255,50,40,0.85)', 0.65);
    tg.position.set(sx, 0.58, -2.4); car.add(tg);
  }
  const diffuser = new T.Mesh(new T.BoxGeometry(1.9, 0.2, 0.06), dark);
  diffuser.position.set(0, 0.3, -2.27); car.add(diffuser);
  for (const sx of [-0.55, 0.55]) {
    const ex = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.16, 8),
      new T.MeshStandardMaterial({ color: '#888e96', roughness: 0.3, metalness: 0.9 }));
    ex.rotation.x = Math.PI / 2; ex.position.set(sx, 0.28, -2.3); car.add(ex);
  }
  for (const [x, z] of [[-0.85, 1.45], [0.85, 1.45], [-0.85, -1.45], [0.85, -1.45]]) {
    const w = wheel(); w.position.set(x, 0.36, z); car.add(w);
  }
  car.userData.isCar = true;
  return car;
}

export function makePoliceCruiser() {
  const car = new T.Group();
  const white = new T.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.35, metalness: 0.25 });
  const navy = new T.MeshStandardMaterial({ color: '#1c2a44', roughness: 0.5, metalness: 0.2 });
  const body = new T.Mesh(new T.BoxGeometry(1.9, 0.55, 4.6), white);
  body.position.y = 0.55; body.castShadow = true; car.add(body);
  const stripe = new T.Mesh(new T.BoxGeometry(1.92, 0.18, 4.62), navy);
  stripe.position.y = 0.52; car.add(stripe);
  const cab = new T.Mesh(new T.BoxGeometry(1.65, 0.5, 2.3),
    new T.MeshStandardMaterial({ color: '#141c28', roughness: 0.2, metalness: 0.4 }));
  cab.position.set(0, 0.98, -0.3); cab.castShadow = true; car.add(cab);
  // push bar
  const bar = new T.Mesh(new T.BoxGeometry(1.5, 0.35, 0.12), navy);
  bar.position.set(0, 0.5, 2.36); car.add(bar);
  // light bar: red left, blue right, both emissive + glow
  const lightBar = new T.Group();
  const base = new T.Mesh(new T.BoxGeometry(1.3, 0.1, 0.4), navy);
  base.position.y = 1.28; lightBar.add(base);
  const red = new T.Mesh(new T.BoxGeometry(0.55, 0.22, 0.36), new T.MeshBasicMaterial({ color: '#ff2a22' }));
  red.position.set(-0.34, 1.42, 0); lightBar.add(red);
  const blue = new T.Mesh(new T.BoxGeometry(0.55, 0.22, 0.36), new T.MeshBasicMaterial({ color: '#2a6aff' }));
  blue.position.set(0.34, 1.42, 0); lightBar.add(blue);
  const gr = glowSprite('rgba(255,60,50,0.85)', 1.8); gr.position.set(-0.34, 1.45, 0); lightBar.add(gr);
  const gb = glowSprite('rgba(60,110,255,0.85)', 1.8); gb.position.set(0.34, 1.45, 0); lightBar.add(gb);
  car.add(lightBar);
  // headlights + taillights
  for (const sx of [-0.62, 0.62]) {
    const hl = new T.Mesh(new T.CircleGeometry(0.13, 10), new T.MeshBasicMaterial({ color: '#fff6d8' }));
    hl.position.set(sx, 0.55, 2.31); car.add(hl);
  }
  const tl = new T.Mesh(new T.BoxGeometry(1.6, 0.09, 0.05), new T.MeshBasicMaterial({ color: '#ff2a22' }));
  tl.position.set(0, 0.6, -2.31); car.add(tl);
  for (const [x, z] of [[-0.85, 1.5], [0.85, 1.5], [-0.85, -1.5], [0.85, -1.5]]) {
    const w = wheel(0.38); w.position.set(x, 0.38, z); car.add(w);
  }
  car.userData.isCar = true;
  return car;
}

export function makeTrafficCar(color) {
  const car = new T.Group();
  const paint = new T.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.3 });
  const body = new T.Mesh(new T.BoxGeometry(1.85, 0.5, 4.2), paint);
  body.position.y = 0.52; body.castShadow = true; car.add(body);
  const cab = new T.Mesh(new T.BoxGeometry(1.6, 0.45, 2.0),
    new T.MeshStandardMaterial({ color: '#18202c', roughness: 0.25, metalness: 0.35 }));
  cab.position.set(0, 0.92, -0.25); cab.castShadow = true; car.add(cab);
  for (const sx of [-0.6, 0.6]) {
    const hl = new T.Mesh(new T.CircleGeometry(0.12, 10), new T.MeshBasicMaterial({ color: '#fff2c8' }));
    hl.position.set(sx, 0.52, 2.11); car.add(hl);
    const glow = glowSprite('rgba(255,240,200,0.7)', 1.1);
    glow.position.set(sx, 0.52, 2.25); car.add(glow);
  }
  const tl = new T.Mesh(new T.BoxGeometry(1.5, 0.09, 0.05), new T.MeshBasicMaterial({ color: '#ff2a22' }));
  tl.position.set(0, 0.56, -2.11); car.add(tl);
  for (const [x, z] of [[-0.82, 1.4], [0.82, 1.4], [-0.82, -1.4], [0.82, -1.4]]) {
    const w = wheel(0.36); w.position.set(x, 0.36, z); car.add(w);
  }
  car.userData.isCar = true;
  return car;
}
