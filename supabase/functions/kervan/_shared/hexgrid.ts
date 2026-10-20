// Hex ızgara yardımcıları: mesafe, halka, A* yol bulma, keşif bit haritası.
import type { Hex, WorldMap } from './world.ts';

export function cube(h: { c: number; r: number }) {
  const x = h.c - (h.r - (h.r & 1)) / 2, z = h.r;
  return { x, y: -x - z, z };
}
export function hexDist(map: WorldMap, a: number, b: number) {
  const A = cube(map.hexes[a]), B = cube(map.hexes[b]);
  return Math.max(Math.abs(A.x - B.x), Math.abs(A.y - B.y), Math.abs(A.z - B.z));
}

/** Merkezden en fazla r adım uzaklıktaki hex'ler (merkez dahil). */
export function within(map: WorldMap, center: number, r: number): number[] {
  const out = [center], seen = new Set(out);
  let front = [center];
  for (let d = 0; d < r; d++) {
    const next: number[] = [];
    for (const i of front) for (const j of map.hexes[i].nb) if (!seen.has(j)) { seen.add(j); next.push(j); out.push(j); }
    front = next;
  }
  return out;
}

export const moveCost = (h: Hex) => (!h.land ? Infinity : h.terrain === 'mountain' ? 3 : h.terrain === 'hills' || h.feature ? 2 : h.terrain === 'snow' ? 3 : 1);

/** Genel A*: geçilebilirlik ve adım maliyeti dışarıdan. Yol başlangıç hariç, hedef dahil. */
export function astar(map: WorldMap, from: number, to: number, cost: (h: Hex, isGoal: boolean) => number, limit = 6000): number[] | null {
  if (from === to) return [];
  const g = new Map<number, number>([[from, 0]]);
  const came = new Map<number, number>();
  const heap: [number, number][] = [[0, from]];
  const push = (f: number, i: number) => {
    heap.push([f, i]); let k = heap.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
  };
  const pop = () => {
    const top = heap[0]; const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last; let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1; let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m;
      }
    }
    return top;
  };
  let n = 0;
  while (heap.length && n++ < limit) {
    const [, u] = pop();
    if (u === to) {
      const path = [u]; let k = u;
      while (came.has(k)) { k = came.get(k)!; if (k !== from) path.push(k); }
      return path.reverse();
    }
    const gu = g.get(u)!;
    for (const v of map.hexes[u].nb) {
      const c = cost(map.hexes[v], v === to);
      if (!isFinite(c)) continue;
      const nv = gu + c;
      if (nv < (g.get(v) ?? Infinity)) { g.set(v, nv); came.set(v, u); push(nv + hexDist(map, v, to), v); }
    }
  }
  return null;
}

// ---------- keşif bit haritası (base64, Deno/Tarayıcı uyumlu) ----------
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64I = new Int16Array(128).fill(-1);
for (let i = 0; i < 64; i++) B64I[B64.charCodeAt(i)] = i;

export function bitsNew(n: number) { return new Uint8Array(Math.ceil(n / 8)); }
export function bitsEncode(b: Uint8Array) {
  let s = '';
  for (let i = 0; i < b.length; i += 3) {
    const v = (b[i] << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    s += B64[(v >> 18) & 63] + B64[(v >> 12) & 63] + B64[(v >> 6) & 63] + B64[v & 63];
  }
  return s;
}
export function bitsDecode(s: string, n: number) {
  const b = bitsNew(n);
  for (let i = 0, j = 0; i < s.length; i += 4) {
    const v = (B64I[s.charCodeAt(i)] << 18) | (B64I[s.charCodeAt(i + 1)] << 12) | (B64I[s.charCodeAt(i + 2)] << 6) | B64I[s.charCodeAt(i + 3)];
    if (j < b.length) b[j++] = (v >> 16) & 255;
    if (j < b.length) b[j++] = (v >> 8) & 255;
    if (j < b.length) b[j++] = v & 255;
  }
  return b;
}
export const bitGet = (b: Uint8Array, i: number) => (b[i >> 3] >> (i & 7)) & 1;
export const bitSet = (b: Uint8Array, i: number) => { b[i >> 3] |= 1 << (i & 7); };
