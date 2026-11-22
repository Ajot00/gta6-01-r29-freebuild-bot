// people.js — Nia Vale + pedestrians. Nia gets bright trim separation so she
// reads at a glance: coral-red jacket, orange trim, dark hair, light boots.
import * as T from 'three';

function mat(color, rough = 0.85) {
  return new T.MeshStandardMaterial({ color, roughness: rough });
}

export function makePerson({ jacket = 0xd88951, pants = 0x3a3f4a, skin = 0xbc8266, hair = 0x2a1c12, nia = false } = {}) {
  const g = new T.Group();
  const add = (geo, m, x, y, z) => {
    const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o;
  };
  const jm = mat(jacket), pm = mat(pants), sm = mat(skin);
  const torso = add(new T.BoxGeometry(0.44, 0.7, 0.28), jm, 0, 1.04, 0);
  const head = add(new T.SphereGeometry(0.16, 10, 8), sm, 0, 1.56, 0);
  const hairM = add(new T.SphereGeometry(0.17, 10, 8), mat(hair, 0.95), 0, 1.6, -0.03);
  hairM.scale.set(1, 0.9, 1);
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    legs.push(add(new T.BoxGeometry(0.15, 0.64, 0.17), pm, s * 0.13, 0.34, 0));
    arms.push(add(new T.BoxGeometry(0.12, 0.58, 0.14), jm, s * 0.29, 1.02, 0));
  }
  if (nia) {
    // bright outline shell (BackSide) so she separates from the background
    for (const [o, geo] of [[torso, new T.BoxGeometry(0.44, 0.7, 0.28)], [head, new T.SphereGeometry(0.16, 10, 8)]]) {
      const shell = new T.Mesh(geo, new T.MeshBasicMaterial({ color: '#14100f', side: T.BackSide }));
      shell.scale.setScalar(1.09); shell.position.copy(o.position); g.add(shell);
    }
    // pale collar + coral piping + orange trim bands
    add(new T.BoxGeometry(0.46, 0.1, 0.3), mat(0xfff3dc), 0, 1.42, 0);
    const trim = new T.MeshBasicMaterial({ color: '#ff8c42' });
    add(new T.BoxGeometry(0.46, 0.07, 0.3), trim, 0, 1.28, 0);
    add(new T.BoxGeometry(0.46, 0.06, 0.3), trim, 0, 0.74, 0);
    for (const s of [-1, 1]) {
      add(new T.BoxGeometry(0.05, 0.52, 0.03), trim, s * 0.29, 1.02, 0.09);
      add(new T.BoxGeometry(0.05, 0.6, 0.03), trim, s * 0.13, 0.34, 0.1);
    }
    // light boots
    for (const s of [-1, 1]) add(new T.BoxGeometry(0.17, 0.1, 0.3), mat(0xe8dcc8), s * 0.13, 0.05, 0.04);
    g.scale.setScalar(1.12);
    g.userData.arms = arms;
  }
  g.userData.nia = nia;
  return g;
}

// Nia with both arms raised (busted pose).
export function makeNiaBusted(opts) {
  const nia = makePerson({ ...opts, nia: true });
  const [aL, aR] = nia.userData.arms;
  for (const a of [aL, aR]) { a.position.y = 1.32; a.rotation.z = (a === aL ? 1 : -1) * 0.9; }
  return nia;
}
