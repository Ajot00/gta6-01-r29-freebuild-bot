// capture.mjs — render shots 1-4 through the local Chrome CDP and save JPEGs.
// Usage: node tools/capture.mjs [shot...]  (default: all 4)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'screenshots');
mkdirSync(outDir, { recursive: true });
const names = ['1-cover.jpg', '2-busted.jpg', '3-beach.jpg', '4-promenade.jpg'];
const wanted = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 4);
const shots = wanted.length ? wanted : [1, 2, 3, 4];

const version = await (await fetch('http://127.0.0.1:9223/json/version')).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let id = 0; const pending = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function send(method, params = {}, sessionId) {
  const n = ++id;
  ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise(resolve => pending.set(n, resolve));
}

async function capture(n, file) {
  const made = await send('Target.createTarget', { url: 'about:blank' });
  const target = made.result.targetId;
  const attached = await send('Target.attachToTarget', { targetId: target, flatten: true });
  const session = attached.result.sessionId;
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false }, session);
  await send('Page.enable', {}, session);
  await send('Runtime.enable', {}, session);
  const errors = [];
  const errListener = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.text || 'exception');
  };
  ws.addEventListener('message', errListener);
  await send('Page.navigate', { url: `http://127.0.0.1:8931/game/index.html?shot=${n}` }, session);
  let ready = false;
  for (let i = 0; i < 75; i++) {
    await new Promise(r => setTimeout(r, 200));
    const v = await send('Runtime.evaluate', { expression: 'window.__shotReady===true', returnByValue: true }, session);
    if (v.result?.result?.value) { ready = true; break; }
  }
  if (!ready) throw new Error(`shot ${n} did not become ready`);
  await new Promise(r => setTimeout(r, 700)); // let the first frames settle
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90, fromSurface: true }, session);
  writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
  ws.removeEventListener('message', errListener);
  await send('Target.closeTarget', { targetId: target });
  return { file, errors };
}

for (const n of shots) {
  const { file, errors } = await capture(n, join(outDir, names[n - 1]));
  console.log(`shot ${n}: ${file} errors=${errors.length}${errors.length ? ' ' + errors.join(';') : ''}`);
}
ws.close();
