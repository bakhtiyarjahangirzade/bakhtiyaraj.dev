// Library and reading progress. Two honest backends:
//  - device: localStorage on this browser only (anonymous readers, or when account sync is not installed);
//  - account: Supabase tables luna_library / luna_progress protected by row level security (supabase/luna.sql).
// Account data is kept in memory only and is dropped on sign-out, so a shared device never shows
// another member's library. Nothing here grants access to paid content: there are no entitlements.
import { normalizeProgress } from './core.js';

const KEY = 'luna.device.v1';
const listeners = new Set();
let backend = 'device';           // 'device' | 'account'
let remote = null;                // adapter from account.js when backend === 'account'
let data = readDevice();

function readDevice() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && d.v === 1 && typeof d.library === 'object' && typeof d.progress === 'object') return { library: d.library || {}, progress: d.progress || {} };
  } catch { /* storage blocked or corrupt: start empty */ }
  return { library: {}, progress: {} };
}
function writeDevice() {
  if (backend !== 'device') return;
  try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ...data })); } catch { /* private mode: keep in memory */ }
}
const emit = () => listeners.forEach(f => f());

export const onStoreChange = f => (listeners.add(f), () => listeners.delete(f));
export const storageMode = () => backend;
export const isSaved = slug => !!data.library[slug];
export const savedSlugs = () => Object.entries(data.library).sort((a, b) => String(b[1]).localeCompare(String(a[1]))).map(([s]) => s);
export const progressSlugs = () => Object.entries(data.progress).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at))).map(([s]) => s);
export function getProgress(slug, leafCount) { return normalizeProgress(data.progress[slug], leafCount); }

export async function setSaved(slug, on) {
  const before = data.library[slug];
  if (on) data.library[slug] = new Date().toISOString(); else delete data.library[slug];
  writeDevice(); emit();
  if (backend === 'account') {
    try { await (on ? remote.save(slug) : remote.remove(slug)); }
    catch (e) { if (before) data.library[slug] = before; else delete data.library[slug]; emit(); throw e; }
  }
}

let pending = new Map(), timer = 0;
export function setProgress(slug, i, n) {
  const p = { i, n, at: new Date().toISOString() };
  data.progress[slug] = p; writeDevice(); emit();
  if (backend === 'account') {
    pending.set(slug, p); clearTimeout(timer);
    timer = setTimeout(flush, 1200);
  }
}
export async function flush() {
  if (backend !== 'account' || !pending.size) return;
  const batch = [...pending.entries()]; pending = new Map();
  try { await remote.progress(batch); } catch (e) { console.warn('Luna: progress sync failed', e); }
}

// Switch to the signed-in member's synced data. Device items are moved into the account, then cleared locally.
export async function useAccount(adapter) {
  const device = readDevice();
  const loaded = await adapter.load();
  backend = 'account'; remote = adapter; data = loaded;
  const moveLib = Object.keys(device.library).filter(s => !data.library[s]);
  const moveProg = Object.entries(device.progress).filter(([s, p]) => !data.progress[s] || String(p.at) > String(data.progress[s].at));
  if (moveLib.length || moveProg.length) {
    await adapter.merge(moveLib, moveProg);
    moveLib.forEach(s => { data.library[s] = device.library[s]; });
    moveProg.forEach(([s, p]) => { data.progress[s] = p; });
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }
  emit();
  return { moved: new Set([...moveLib, ...moveProg.map(([s]) => s)]).size };
}
// Back to this device's own storage (after sign-out, session expiry or when sync is not installed).
export function useDevice() {
  clearTimeout(timer); pending = new Map();
  backend = 'device'; remote = null; data = readDevice(); emit();
}
