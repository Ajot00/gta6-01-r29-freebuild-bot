// world.js — Solmere: coastal city at golden-hour dusk. All geometry built fresh here.
import * as T from 'three';

// Gentle terrain: flat streets/promenade, soft dunes on the open beach.
export function groundHeight(x, z) {
  if (x >= 55 && z > -60 && x < 155) {
    return 0.22 * Math.sin(x * 0.09 + 1.7) * Math.cos(z * 0.05) + 0.1 * Math.sin((x + z) * 0.11);
  }
  return 0;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

function asphaltTexture() {
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#33363a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = Math.random() > 0.5 ? '#3d4045' : '#2b2e32';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // tire-track bands (two dark lanes)
    g.fillStyle = 'rgba(20,20,22,0.35)';
    g.fillRect(w * 0.18, 0, w * 0.16, h); g.fillRect(w * 0.66, 0, w * 0.16, h);
    // centre dashed line
    g.fillStyle = '#d8b96a';
    for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 3, y, 6, 34);
    // edge lines
    g.fillStyle = '#c9c2b2'; g.fillRect(6, 0, 3, h); g.fillRect(w - 9, 0, 3, h);
  });
}

function facadeTexture(base, litRatio) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // subtle vertical grime
    g.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 8; i++) g.fillRect(Math.random() * w, 0, 4 + Math.random() * 10, h);
    const cols = 4, rows = 6, cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const lit = Math.random() < litRatio;
      g.fillStyle = lit ? '#ffca7a' : '#20262e';
      g.fillRect(c * cw + 10, r * ch + 9, cw - 20, ch - 18);
      if (lit) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(c * cw + 10, r * ch + 9, cw - 20, 6); }
      else { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(c * cw + 10, r * ch + 9, cw - 20, 5); }
    }
    // floor separator lines
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let r = 0; r <= rows; r++) g.fillRect(0, r * ch - 1, w, 2);
  });
}

function stripeTexture(a, b) {
  const t = canvasTex(128, 64, (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 16, 0, 16, h); }
  });
  t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}

function neonTexture(text, color) {
  return canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#14101c'; g.fillRect(0, 0, w, h);
    g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = 18; g.fillStyle = color;
    g.fillText(text, w / 2, h / 2 + 1);
    g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.fillText(text, w / 2, h / 2 + 1);
  });
}

function woodTexture() {
  const t = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = y % 32 ? '#7d5f3f' : '#966f4b'; g.fillRect(0, y, w, 15);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y + 15, w, 1);
    }
  });
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, 24); return t;
}

const PALETTE = ['#c97a5e', '#a85a4e', '#c99a5e', '#4e7d7a', '#8a5f7a', '#b98a6e', '#7a6a8a', '#d8b078'];
const NEONS = [['HOTEL', '#ff5e7a'], ['BAR', '#4fd8c8'], ['TACOS', '#ffb84d'], ['SURF', '#6ec6ff'], ['PIER 9', '#ff8c42']];

export function buildWorld(scene) {
  const add = (mesh, x, y, z, cast = true, recv = true) => {
    mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = recv;
    scene.add(mesh); return mesh;
  };
  const std = (color, rough = 0.9, metal = 0) =>
    new T.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

  // ---------- sky dome (gradient + sun glow) ----------
  const sunDir = new T.Vector3(-0.78, 0.26, -0.42).normalize();
  const skyMat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new T.Color('#2c2158') },
      mid: { value: new T.Color('#d06a4e') },
      horizon: { value: new T.Color('#ffc06a') },
      sunDir: { value: sunDir },
      sunColor: { value: new T.Color('#ffd9a0') },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vDir; uniform vec3 top, mid, horizon, sunDir, sunColor;
      void main(){
        float h = clamp(vDir.y, -0.05, 1.0);
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.38, h));
        col = mix(col, top, smoothstep(0.3, 0.75, h));
        float g = pow(max(dot(normalize(vDir), sunDir), 0.0), 18.0);
        col += sunColor * g * 0.9;
        float g2 = pow(max(dot(normalize(vDir), sunDir), 0.0), 90.0);
        col += sunColor * g2 * 1.6;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new T.Mesh(new T.SphereGeometry(880, 32, 20), skyMat);
  scene.add(sky);

  // sun disc
  const disc = new T.Mesh(new T.CircleGeometry(40, 40),
    new T.MeshBasicMaterial({ color: '#ffe9b0', fog: false }));
  disc.position.copy(sunDir).multiplyScalar(820); disc.position.y = Math.max(disc.position.y, 60);
  disc.lookAt(0, 0, 0); scene.add(disc);

  // ---------- ground ----------
  const ground = new T.Mesh(new T.PlaneGeometry(900, 900, 96, 96),
    new T.MeshStandardMaterial({ color: '#b08a68', roughness: 1 }));
  {
    const pos = ground.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, groundHeight(x, -y)); // plane is rotated below; y maps to -z
    }
    ground.geometry.computeVertexNormals();
  }
  ground.rotation.x = -Math.PI / 2; ground.position.set(60, -0.55, 0);
  ground.receiveShadow = true; scene.add(ground);

  // ---------- road ----------
  const roadTex = asphaltTexture(); roadTex.wrapS = roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 18);
  const road = new T.Mesh(new T.PlaneGeometry(14, 430),
    new T.MeshStandardMaterial({ map: roadTex, roughness: 0.94 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, -50);
  road.receiveShadow = true; scene.add(road);

  // sidewalks + curbs
  for (const s of [-1, 1]) {
    const walk = add(new T.Mesh(new T.BoxGeometry(4.5, 0.14, 430), std('#a08b6d', 1)), s * 9.6, 0.07, -50, false, true);
    const curb = add(new T.Mesh(new T.BoxGeometry(0.45, 0.28, 430), std('#c9b18e', 0.9)), s * 7.2, 0.1, -50, false, true);
    void walk; void curb;
  }
  // crosswalks
  for (const cz of [-120, -30, 60]) for (let k = 0; k < 5; k++) {
    const stripe = new T.Mesh(new T.BoxGeometry(1.6, 0.02, 0.9),
      new T.MeshBasicMaterial({ color: '#e8e0cc' }));
    stripe.position.set(-5 + k * 2.5, 0.06, cz); scene.add(stripe);
  }
  // streetlights
  for (let i = 0; i < 12; i++) {
    const lz = -230 + i * 36, sx = i % 2 ? 1 : -1, lx = sx * 9.4;
    add(new T.Mesh(new T.CylinderGeometry(0.09, 0.13, 6.4, 6), std('#2f3a3c', 0.6)), lx, 3.2, lz);
    const arm = add(new T.Mesh(new T.BoxGeometry(1.9, 0.12, 0.12), std('#2f3a3c', 0.6)), lx - sx * 0.85, 6.3, lz);
    void arm;
    const head = new T.Mesh(new T.BoxGeometry(0.55, 0.18, 0.32),
      new T.MeshBasicMaterial({ color: '#ffd98a' }));
    head.position.set(lx - sx * 1.7, 6.22, lz); scene.add(head);
  }
  // boardwalk along the promenade edge
  const board = new T.Mesh(new T.PlaneGeometry(6, 220), new T.MeshStandardMaterial({ map: woodTexture(), roughness: 0.95 }));
  board.rotation.x = -Math.PI / 2; board.position.set(53, 0.05, 40); board.receiveShadow = true; scene.add(board);

  // ---------- buildings ----------
  const facadeTexs = PALETTE.map((c, i) => facadeTexture(c, 0.3 + (i % 3) * 0.12));
  function building(x, z, w, h, d, texIdx, face, neon) {
    const g = new T.Group();
    const tex = facadeTexs[texIdx % facadeTexs.length].clone();
    tex.needsUpdate = true;
    const body = new T.Mesh(new T.BoxGeometry(w, h, d),
      new T.MeshStandardMaterial({ map: tex, roughness: 0.92 }));
    body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true;
    body.userData.building = true; g.add(body);
    const roof = new T.Mesh(new T.BoxGeometry(w + 0.5, 0.5, d + 0.5), std('#6b4a3a', 1));
    roof.position.y = h + 0.25; roof.castShadow = true; g.add(roof);
    // rooftop clutter: AC box + water tank
    const ac = new T.Mesh(new T.BoxGeometry(1.6, 0.9, 1.2), std('#7a7a72', 0.8));
    ac.position.set(w * 0.22, h + 0.95, -d * 0.15); ac.castShadow = true; g.add(ac);
    const tank = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 1.8, 10), std('#8a6a4a', 0.9));
    tank.position.set(-w * 0.25, h + 1.4, d * 0.2); tank.castShadow = true; g.add(tank);
    // ground-floor glass + awning on the facing side
    const fw = face === 'x' ? d : w;
    const glass = new T.Mesh(new T.BoxGeometry(fw * 0.92, 2.6, 0.15),
      new T.MeshStandardMaterial({ color: '#1f2a30', roughness: 0.25, metalness: 0.4 }));
    const awn = new T.Mesh(new T.BoxGeometry(fw * 0.96, 0.25, 1.5),
      new T.MeshStandardMaterial({ map: stripeTexture('#d25249', '#f5ead6'), roughness: 0.8 }));
    if (face === 'px') { glass.position.set(w / 2 + 0.08, 1.5, 0); glass.rotation.y = Math.PI / 2; awn.position.set(w / 2 + 0.8, 3.0, 0); awn.rotation.y = Math.PI / 2; }
    else if (face === 'nx') { glass.position.set(-w / 2 - 0.08, 1.5, 0); glass.rotation.y = Math.PI / 2; awn.position.set(-w / 2 - 0.8, 3.0, 0); awn.rotation.y = Math.PI / 2; }
    else if (face === 'pz') { glass.position.set(0, 1.5, d / 2 + 0.08); awn.position.set(0, 3.0, d / 2 + 0.8); }
    else { glass.position.set(0, 1.5, -d / 2 - 0.08); awn.position.set(0, 3.0, -d / 2 - 0.8); }
    glass.castShadow = false; awn.castShadow = true; g.add(glass, awn);
    if (neon) {
      const [text, color] = NEONS[neon % NEONS.length];
      const sign = new T.Mesh(new T.PlaneGeometry(6, 1.5),
        new T.MeshBasicMaterial({ map: neonTexture(text, color) }));
      sign.position.set(0, h * 0.72, 0);
      if (face === 'px') { sign.position.x = w / 2 + 0.15; sign.rotation.y = Math.PI / 2; }
      else if (face === 'nx') { sign.position.x = -w / 2 - 0.15; sign.rotation.y = -Math.PI / 2; }
      else if (face === 'pz') { sign.position.z = d / 2 + 0.15; }
      else { sign.position.z = -d / 2 - 0.15; sign.rotation.y = Math.PI; }
      g.add(sign);
    }
    g.position.set(x, groundHeight(x, z), z);
    scene.add(g); return g;
  }

  // west downtown: two columns of blocks flanking the road
  let bi = 0;
  for (let z = -240; z <= 140; z += 36) {
    for (const x of [-24, -48]) {
      if (Math.abs(z % 72) < 1 && x === -48) continue; // occasional gap / plaza
      const h = 10 + ((bi * 7 + Math.abs(z)) % 18);
      building(x, z, 16, h, 22, bi, 'px', bi % 4 === 0 ? bi : 0);
      bi++;
    }
  }
  // east side: a few blocks behind the promenade (north half only)
  for (let z = -240; z <= -40; z += 40) {
    const h = 9 + ((bi * 5) % 12);
    building(30, z, 15, h, 20, bi + 2, 'nx', bi % 5 === 0 ? bi : 0);
    bi++;
  }
  // beachfront hotels: north edge of the beach, facing south onto the sand
  const hotelCols = ['#e8c9a0', '#d8a08a', '#9fc4c0', '#e0b8c8', '#c9d8a0'];
  for (let i = 0; i < 5; i++) {
    const x = 68 + i * 19, h = 8 + (i % 3) * 3;
    const g = building(x, -102, 15, h, 14, i + 1, 'pz', i);
    g.children[0].material = new T.MeshStandardMaterial({
      map: facadeTexture(hotelCols[i], 0.45), roughness: 0.9 });
  }
  // ---------- palms ----------
  function palm(x, z, s = 1) {
    const g = new T.Group();
    const trunkMat = std('#7a5a42', 0.95);
    let px = 0, py = 0;
    for (let i = 0; i < 3; i++) {
      const seg = new T.Mesh(new T.CylinderGeometry(0.22 - i * 0.03, 0.3 - i * 0.03, 2.6, 7), trunkMat);
      seg.position.set(px, py + 1.3, 0); seg.rotation.z = 0.05 * (i + 1); seg.castShadow = true;
      g.add(seg); px += 0.1; py += 2.5;
    }
    const frondMat = std('#2e6b4a', 0.9);
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * Math.PI * 2;
      const f = new T.Mesh(new T.BoxGeometry(0.5, 0.07, 5.4), frondMat);
      f.position.set(px + Math.cos(a) * 2.1, py + 0.45, Math.sin(a) * 2.1);
      f.rotation.y = -a; f.rotation.x = 0.85; f.castShadow = true; g.add(f);
    }
    for (let j = 0; j < 3; j++) {
      const nut = new T.Mesh(new T.SphereGeometry(0.22, 6, 5), std('#6b4a2a', 0.9));
      nut.position.set(px + (j - 1) * 0.3, py + 0.15, 0.25); g.add(nut);
    }
    g.position.set(x, groundHeight(x, z), z); g.scale.setScalar(s); scene.add(g);
  }
  // palms lining the marina boulevard (both sides) and the promenade
  for (const s of [-1, 1]) for (const pz of [-190, -150, -110, -70, -30, 10, 50, 90, 130]) palm(s * 13.5, pz, 1.05);
  for (const pz of [-40, 0, 40, 80, 120]) palm(48, pz, 1.15);
  // beach palms
  for (const [x, z] of [[70, -40], [88, 10], [120, -20], [140, 55], [80, 80], [130, 110], [100, -70]]) palm(x, z, 1.2);

  // ---------- sea (raised above the ground plane so it never z-fights) ----------
  const sea = new T.Mesh(new T.PlaneGeometry(460, 520),
    new T.MeshStandardMaterial({ color: '#1b9aa8', roughness: 0.4, metalness: 0.05 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(380, -0.32, 60); sea.receiveShadow = true; scene.add(sea);
  // sunset reflection bands on the water
  for (const [w, l, x, z, op] of [[420, 26, 230, 40, 0.9], [300, 14, 300, 110, 0.55], [200, 10, 260, -30, 0.45]]) {
    const band = new T.Mesh(new T.PlaneGeometry(w, l),
      new T.MeshBasicMaterial({ color: '#f2a45e', transparent: true, opacity: op }));
    band.rotation.x = -Math.PI / 2; band.position.set(x, -0.28, z); scene.add(band);
  }
  // wet sand strip at the waterline
  const wet = new T.Mesh(new T.PlaneGeometry(8, 260),
    new T.MeshStandardMaterial({ color: '#c9a67e', roughness: 0.4 }));
  wet.rotation.x = -Math.PI / 2; wet.position.set(152, groundHeight(152, 40) + 0.02, 40);
  wet.receiveShadow = true; scene.add(wet);

  // ---------- beach props ----------
  function umbrella(x, z, cA, cB) {
    const g = new T.Group();
    const pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.6, 6), std('#d8d0c0', 0.7));
    pole.position.y = 1.3; pole.castShadow = true; g.add(pole);
    const canopy = new T.Mesh(new T.SphereGeometry(2.4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshStandardMaterial({ map: stripeTexture(cA, cB), roughness: 0.7, side: T.DoubleSide }));
    canopy.position.y = 2.55; canopy.castShadow = true; g.add(canopy);
    g.position.set(x, groundHeight(x, z), z); scene.add(g);
  }
  umbrella(82, -18, '#e75e54', '#f5ead6'); umbrella(96, 22, '#4e9aa0', '#f5ead6');
  umbrella(118, -6, '#e7bf55', '#f5ead6'); umbrella(132, 48, '#e75e54', '#f5ead6');
  umbrella(74, 62, '#7a6ab0', '#f5ead6'); umbrella(110, 88, '#4e9aa0', '#f5ead6');
  // towels
  for (const [x, z, c] of [[84, -14, '#e75e54'], [98, 26, '#4e9aa0'], [120, -2, '#e7bf55'], [134, 52, '#ff8c42']]) {
    const t = new T.Mesh(new T.BoxGeometry(1.1, 0.05, 2.2), std(c, 0.95));
    t.position.set(x, groundHeight(x, z) + 0.06, z); t.rotation.y = 0.4; t.receiveShadow = true; scene.add(t);
  }
  // footprints: two trails — one to the water, one along the beach
  function footprints(x0, z0, x1, z1, n) {
    const m = new T.MeshStandardMaterial({ color: '#8a6a48', roughness: 1 });
    for (let k = 0; k < n; k++) {
      const t = k / n, x = x0 + (x1 - x0) * t + (k % 2 ? 0.22 : -0.22), z = z0 + (z1 - z0) * t;
      const fp = new T.Mesh(new T.CircleGeometry(0.16, 8), m);
      fp.rotation.x = -Math.PI / 2; fp.rotation.z = Math.atan2(x1 - x0, z1 - z0);
      fp.scale.set(1, 1.7, 1); fp.position.set(x, groundHeight(x, z) + 0.03, z); scene.add(fp);
    }
  }
  footprints(96, -30, 150, 30, 42); footprints(118, 60, 88, 108, 30);
  // lifeguard tower
  {
    const g = new T.Group();
    const legM = std('#e8e0cc', 0.9);
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const leg = new T.Mesh(new T.BoxGeometry(0.22, 3.4, 0.22), legM);
      leg.position.set(lx, 1.7, lz); leg.castShadow = true; g.add(leg);
    }
    const cab = new T.Mesh(new T.BoxGeometry(2.8, 1.6, 2.4), std('#f5ead6', 0.85));
    cab.position.y = 4.1; cab.castShadow = true; g.add(cab);
    const roof = new T.Mesh(new T.BoxGeometry(3.4, 0.18, 3), std('#e75e54', 0.8));
    roof.position.y = 5.1; roof.castShadow = true; g.add(roof);
    const win = new T.Mesh(new T.BoxGeometry(2.2, 0.7, 0.1),
      new T.MeshStandardMaterial({ color: '#1f2a30', roughness: 0.2, metalness: 0.4 }));
    win.position.set(0, 4.3, 1.25); g.add(win);
    g.position.set(124, groundHeight(124, 42), 42); scene.add(g);
  }
  // red beach stall
  {
    const g = new T.Group();
    const box = new T.Mesh(new T.BoxGeometry(3.4, 1.6, 2.2), std('#d25249', 0.85));
    box.position.y = 0.8; box.castShadow = true; g.add(box);
    const top = new T.Mesh(new T.BoxGeometry(4, 0.2, 2.8),
      new T.MeshStandardMaterial({ map: stripeTexture('#e7bd68', '#f5ead6'), roughness: 0.8 }));
    top.position.y = 1.8; top.castShadow = true; g.add(top);
    g.position.set(104, groundHeight(104, 8), 8); g.rotation.y = 0.3; scene.add(g);
  }
  // pebbles + shells scattered on the sand
  for (let i = 0; i < 26; i++) {
    const x = 62 + (i * 37) % 88, z = -50 + (i * 53) % 170;
    const p = new T.Mesh(new T.SphereGeometry(0.12, 5, 4), std(['#d8c8a6', '#b98a6e', '#e8e0cc'][i % 3], 1));
    p.scale.set(1, 0.35, 1.5); p.position.set(x, groundHeight(x, z) + 0.04, z); scene.add(p);
  }

  // ---------- clouds & birds ----------
  const cloudMat = new T.MeshBasicMaterial({ color: '#f7ddd2', fog: false });
  for (let i = 0; i < 9; i++) {
    const cl = new T.Group();
    for (let j = 0; j < 3; j++) {
      const part = new T.Mesh(new T.SphereGeometry(6 + j * 2, 7, 5), cloudMat);
      part.position.set(j * 6 - 6, 0, (j % 2) * 3); part.scale.set(1, 0.32, 1); cl.add(part);
    }
    cl.position.set(-240 + i * 70, 58 + (i * 7) % 26, -320 + (i * 53) % 260); scene.add(cl);
  }
  const birdMat = new T.MeshBasicMaterial({ color: '#3a2a2a', fog: false });
  for (let i = 0; i < 8; i++) {
    const b = new T.Group();
    for (const s of [-1, 1]) {
      const w = new T.Mesh(new T.BoxGeometry(1.3, 0.08, 0.08), birdMat);
      w.position.x = s * 0.6; w.rotation.z = s * 0.35; b.add(w);
    }
    b.position.set(-160 + i * 55, 34 + (i * 5) % 18, -200 + i * 55); scene.add(b);
  }

  return { sunDir, disc };
}
