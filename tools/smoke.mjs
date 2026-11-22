// smoke.mjs — load shot 0 (free play), assert: no JS exceptions, zero network
// requests, HUD present, then exercise W/E/F keys. Exit 1 on failure.
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = await (await fetch('http://127.0.0.1:9223/json/version')).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let seq = 0; const pending = new Map(); const errors = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description || 'exception');
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error');
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}, sessionId) => {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise(r => pending.set(id, r));
};
const t = (await send('Target.createTarget', { url: 'about:blank' })).result.targetId;
const s = (await send('Target.attachToTarget', { targetId: t, flatten: true })).result.sessionId;
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false }, s);
await send('Runtime.enable', {}, s);
await send('Page.enable', {}, s);
await send('Page.navigate', { url: `http://127.0.0.1:8931/game/index.html` }, s);
await new Promise(r => setTimeout(r, 2500));
const check = await send('Runtime.evaluate', {
  expression: `({ready: window.__shotReady===true,
    hud: !!document.querySelector('.map-wrap') && !!document.querySelector('#speed'),
    nets: performance.getEntriesByType('resource').filter(x=>/^https?:/.test(x.name) && !x.name.includes('127.0.0.1')).length,
    canvas: !!document.querySelector('#world')})`,
  returnByValue: true,
}, s);
const v = check.result.result.value;
for (const k of ['w', 'e', 'f']) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: `Key${k.toUpperCase()}` }, s);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: `Key${k.toUpperCase()}` }, s);
}
await new Promise(r => setTimeout(r, 400));
await send('Target.closeTarget', { targetId: t });
ws.close();
const ok = errors.length === 0 && v.ready && v.hud && v.nets === 0 && v.canvas;
console.log(`${ok ? 'PASS' : 'FAIL'} smoke: ready=${v.ready} hud=${v.hud} network=${v.nets} canvas=${v.canvas} errors=${errors.length}${errors.length ? ' ' + errors.slice(0, 3).join(' | ') : ''}`);
if (!ok) process.exitCode = 1;
