// KERVAN v0.3 simülasyonu — MÖ 4000'den 2100'e: göçebe kabileden uzay çağına.
// Saf TypeScript; tarayıcıda yerel sunucu, Supabase Edge Function'da online oda olarak çalışır.
import {
  C, CB, END_TURN, ERAS, G, GOODS, IMP, IMPS, NG, PALETTE, TECH, TECHS, UNIT, VEHICLES,
  techCost, yearOfTurn, fmtYear,
  type CbId, type GoodId, type ImpId, type TechId, type UnitId, type VehicleDef,
} from './defs.ts';
import { CULTURES, T } from './cultures.ts';
import { matchOrder, quoteBuy, quoteSell, unitPrice, type Order, type TownMarket } from './economy.ts';
import { astar, bitGet, bitSet, bitsDecode, bitsEncode, bitsNew, hexDist, moveCost, within } from './hexgrid.ts';
import { generateWorld, lonLatToHex, type WorldMap } from './world.ts';

export type RealmKind = 'player' | 'bot';
export interface Ledger { tax: number; sales: number; routes: number; upkeep: number; buy: number; build: number; other: number }
const emptyLedger = (): Ledger => ({ tax: 0, sales: 0, routes: 0, upkeep: 0, buy: 0, build: 0, other: 0 });

export interface RealmStats { pop: number; sci: number; gold: number; food: number; foodNeed: number; labor: number; laborNeed: number; happy: number; prod: number }
export interface Realm {
  id: number; name: string; culture: number; kind: RealmKind; user?: string; color: string;
  alive: boolean; away: boolean; steward: boolean;
  gold: number; science: number; research: TechId | null; techs: TechId[]; era: number;
  inv: number[]; explored: string; tax: number;
  ledger: Ledger; last: Ledger; stats: RealmStats;
  hist: { gold: number[]; score: number[]; pop: number[]; sci: number[] };
  wars: number[]; peace: number[]; // barış teklifleri (kime)
  score: number; named: number;
}
export interface City {
  id: number; realm: number; name: string; hex: number; pop: number; grow: number; founded: number;
  cbs: CbId[]; building: { id: CbId; left: number } | null; market: number[]; hp: number; capital: boolean; radius: number;
}
export interface Unit { id: number; realm: number; type: UnitId; hex: number; path: number[]; hp: number; vet: number; task: 'none' | 'found' | 'explore' | 'fortify' }
export interface Imp { id: number; realm: number; hex: number; type: ImpId; level: number; left: number; eff: number; status: string; out: number }
export interface Route {
  id: number; realm: number; from: number; to: number; sea: boolean; path: number[]; vehicle: string;
  pos: number; cargo: { good: number; qty: number } | null; income: number; trips: number;
}
export interface Camp { id: number; hex: number; str: number; hp: number }
export interface LogEntry { turn: number; text: string; kind: 'info' | 'trade' | 'war' | 'build' | 'tech' | 'warn' | 'news'; realm?: number }
export interface TradeRec { turn: number; good: number; price: number; qty: number; buyer: number; seller: number }

export interface GameState {
  version: 3;
  seed: number; roomName: string; mode: 'local' | 'public' | 'coop'; maxPlayers: number;
  turn: number;
  own: Record<number, number>;
  realms: Realm[]; cities: City[]; units: Unit[]; imps: Imp[]; routes: Route[]; camps: Camp[];
  orders: Order[]; trades: TradeRec[]; history: number[][]; log: LogEntry[];
  ended: { winner: number; reason: string } | null;
  nextId: number; rng: number; seq: number;
}

// ---------- yardımcılar ----------
export function rand(s: GameState) {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const nid = (s: GameState) => s.nextId++;
export function log(s: GameState, text: string, kind: LogEntry['kind'] = 'info', realm?: number) {
  s.log.push({ turn: s.turn, text, kind, realm });
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
}
export const fmt = (n: number) => (Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('tr-TR') : (Math.round(n * 10) / 10).toString());
export const yearOf = (turn: number) => yearOfTurn(turn);
export const fmtTurn = (turn: number) => fmtYear(yearOfTurn(turn));

const mapCache = new Map<number, WorldMap>();
export function getMap(seed: number): WorldMap {
  let m = mapCache.get(seed);
  if (!m) { m = generateWorld(seed); mapCache.set(seed, m); }
  return m;
}

export const hasTech = (r: Realm, t: TechId | null) => !t || r.techs.includes(t);
export const atWar = (s: GameState, a: number, b: number) => a !== b && a >= 0 && b >= 0 && !!s.realms[a]?.wars.includes(b);
export const ownerOf = (s: GameState, hex: number) => s.own[hex] ?? -1;
export const cityAt = (s: GameState, hex: number) => s.cities.find((c) => c.hex === hex);
export const realmCities = (s: GameState, r: number) => s.cities.filter((c) => c.realm === r);
export const capitalOf = (s: GameState, r: number) => s.cities.find((c) => c.realm === r && c.capital) ?? s.cities.find((c) => c.realm === r);
export const popCap = (r: Realm) => 4 + r.era * 3 + (r.techs.includes('insaat') ? 1 : 0);
const cityRadius = (pop: number) => 1 + (pop >= 5 ? 1 : 0) + (pop >= 12 ? 1 : 0);

/** Şehir pazarı (Frontier fiyat modeli): hedef stok nüfus ve çağa göre. */
export function cityMarket(s: GameState, c: City): TownMarket {
  const era = s.realms[c.realm]?.era ?? 0;
  const target = GOODS.map((g) => (g.era <= era ? Math.max(2, g.demand * (c.pop + 2) * 10) : 2));
  return { stock: c.market, target, idx: 1 };
}
export const priceAt = (s: GameState, c: City, g: number) => unitPrice(cityMarket(s, c), g);

export function exploredBits(s: GameState, r: number) { const map = getMap(s.seed); return bitsDecode(s.realms[r].explored, map.hexes.length); }
export function reveal(map: WorldMap, bits: Uint8Array, center: number, radius: number) { for (const i of within(map, center, radius)) bitSet(bits, i); }

/** Görünür hex'ler (birim ve şehir görüşü). */
export function visibleSet(s: GameState, r: number) {
  const map = getMap(s.seed);
  const v = new Set<number>();
  for (const c of s.cities) if (c.realm === r) for (const i of within(map, c.hex, C.CITY_SIGHT)) v.add(i);
  for (const u of s.units) if (u.realm === r) for (const i of within(map, u.hex, UNIT[u.type].sight)) v.add(i);
  return v;
}

export function laborOf(s: GameState, r: number) { return realmCities(s, r).reduce((a, c) => a + c.pop, 0); }
export function bestVehicle(s: GameState, rt: { realm: number; from: number; to: number; sea: boolean }): VehicleDef {
  const R = s.realms[rt.realm];
  const a = s.cities.find((c) => c.id === rt.from), b = s.cities.find((c) => c.id === rt.to);
  const st = !!a?.cbs.includes('station') && !!b?.cbs.includes('station');
  let best = VEHICLES.find((v) => v.sea === rt.sea)!;
  for (const v of VEHICLES) if (v.sea === rt.sea && hasTech(R, v.tech) && (!v.station || st) && v.cap * v.speed > best.cap * best.speed) best = v;
  return best;
}
export function routeSlots(s: GameState, r: number) {
  const R = s.realms[r];
  return 1 + Math.floor(R.era / 2) + realmCities(s, r).reduce((a, c) => a + (c.cbs.includes('market') ? 1 : 0) + (c.cbs.includes('caravanserai') ? 1 : 0), 0) + (R.techs.includes('internet') ? 1 : 0);
}

// ---------- yeni oyun ----------
export interface NewGameOpts { seed?: number; roomName?: string; mode?: GameState['mode']; bots?: number; player?: { name: string; culture: number; user?: string } }

export function newGame(opts: NewGameOpts = {}): GameState {
  const seed = opts.seed ?? ((Math.random() * 1e9) >>> 0);
  getMap(seed);
  const s: GameState = {
    version: 3, seed, roomName: opts.roomName ?? 'Yerel dünya', mode: opts.mode ?? 'local', maxPlayers: C.MAX_PLAYERS,
    turn: 0, own: {}, realms: [], cities: [], units: [], imps: [], routes: [], camps: [],
    orders: [], trades: [], history: GOODS.map((g) => [g.price]), log: [], ended: null,
    nextId: 1, rng: seed ^ 0x9e3779b9, seq: 0,
  };
  if (opts.player) addRealm(s, { ...opts.player, kind: 'player' });
  const used = new Set(s.realms.map((r) => r.culture));
  const free = CULTURES.map((c) => c.id).filter((c) => !used.has(c)).sort(() => rand(s) - 0.5);
  for (let k = 0; k < (opts.bots ?? 7); k++) {
    const cu = free[k % free.length];
    addRealm(s, { name: CULTURES[cu].name, culture: cu, kind: 'bot' });
  }
  spawnCamps(s, 28);
  log(s, `${fmtTurn(0)}: kabileler göç yollarında. Tarih yeniden yazılıyor.`, 'news');
  return s;
}

function startHex(s: GameState, culture: number) {
  const map = getMap(s.seed);
  const cu = CULTURES[culture];
  const home = lonLatToHex(cu.lon, cu.lat);
  const taken = [...s.units.filter((u) => u.type === 'settler').map((u) => u.hex), ...s.cities.map((c) => c.hex)];
  const good = (i: number) => {
    const h = map.hexes[i];
    return h.land && h.terrain !== 'mountain' && h.terrain !== 'snow' && h.terrain !== 'desert' && h.terrain !== 'tundra'
      && ownerOf(s, i) < 0 && taken.every((t) => hexDist(map, t, i) >= 7) && !s.camps.some((c) => hexDist(map, c.hex, i) < 4);
  };
  const q = [home], seen = new Set(q);
  while (q.length) {
    const k = q.shift()!;
    if (good(k)) return k;
    for (const j of map.hexes[k].nb) if (!seen.has(j)) { seen.add(j); q.push(j); }
    if (seen.size > 9000) break;
  }
  const land = map.hexes.filter((h) => good(h.i));
  return land.length ? land[Math.floor(rand(s) * land.length)].i : home;
}

export function addRealm(s: GameState, o: { name: string; culture: number; kind: RealmKind; user?: string }): number {
  const map = getMap(s.seed);
  const id = s.realms.length;
  const cu = CULTURES[o.culture];
  const sameCulture = s.realms.filter((r) => r.culture === o.culture).length;
  const color = sameCulture === 0 ? cu.color : PALETTE[(id * 7) % PALETTE.length];
  const bits = bitsNew(map.hexes.length);
  const hex = startHex(s, o.culture);
  reveal(map, bits, hex, 3);
  const R: Realm = {
    id, name: o.name, culture: o.culture, kind: o.kind, user: o.user, color, alive: true, away: false, steward: true,
    gold: 60, science: 0, research: null, techs: [], era: 0, inv: new Array(NG).fill(0), explored: bitsEncode(bits), tax: 0.2,
    ledger: emptyLedger(), last: emptyLedger(), stats: { pop: 0, sci: 0, gold: 0, food: 0, foodNeed: 0, labor: 0, laborNeed: 0, happy: 0.7, prod: 0 },
    hist: { gold: [], score: [], pop: [], sci: [] }, wars: [], peace: [], score: 0, named: 0,
  };
  R.inv[G.food] = 30; R.inv[G.wood] = 12;
  s.realms.push(R);
  for (const t of ['settler', 'scout', 'warrior'] as UnitId[]) {
    s.units.push({ id: nid(s), realm: id, type: t, hex: t === 'settler' ? hex : map.hexes[hex].nb.find((j) => map.hexes[j].land) ?? hex, path: [], hp: 100, vet: 1, task: t === 'scout' ? 'explore' : 'none' });
  }
  for (const r of s.realms) if (r.id !== id) { /* başlangıçta barış */ }
  if (o.kind === 'player') log(s, `${o.name} (${cu.adj} kabilesi) tarih sahnesine çıktı.`, 'news');
  return id;
}

function spawnCamps(s: GameState, n: number) {
  const map = getMap(s.seed);
  const land = map.hexes.filter((h) => h.land && h.terrain !== 'snow');
  for (let k = 0; k < n * 4 && n > 0; k++) {
    const h = land[Math.floor(rand(s) * land.length)];
    if (ownerOf(s, h.i) >= 0) continue;
    if (s.cities.some((c) => hexDist(map, c.hex, h.i) < 5) || s.units.some((u) => u.type === 'settler' && hexDist(map, u.hex, h.i) < 6)) continue;
    if (s.camps.some((c) => hexDist(map, c.hex, h.i) < 6)) continue;
    const era = avgEra(s);
    s.camps.push({ id: nid(s), hex: h.i, str: 7 + era * 13, hp: 100 });
    n--;
  }
}
const avgEra = (s: GameState) => { const a = s.realms.filter((r) => r.alive); return a.length ? Math.round(a.reduce((t, r) => t + r.era, 0) / a.length) : 0; };

// ---------- şehir ----------
function claim(s: GameState, c: City) {
  const map = getMap(s.seed);
  for (const i of within(map, c.hex, c.radius)) if (map.hexes[i].land && ownerOf(s, i) < 0) s.own[i] = c.realm;
}
export function canFound(s: GameState, realm: number, hex: number): string | null {
  const map = getMap(s.seed);
  const h = map.hexes[hex];
  if (!h.land) return 'Denizde şehir kurulamaz';
  if (h.terrain === 'mountain' || h.terrain === 'snow') return 'Dağa ya da buzula şehir kurulamaz';
  const o = ownerOf(s, hex);
  if (o >= 0 && o !== realm) return 'Başkasının toprağı';
  if (s.cities.some((c) => hexDist(map, c.hex, hex) < C.CITY_MIN_DIST)) return `Başka şehre çok yakın (en az ${C.CITY_MIN_DIST} hex)`;
  if (s.camps.some((c) => c.hex === hex)) return 'Haydut kampı var';
  return null;
}
function foundCity(s: GameState, u: Unit): string | null {
  const err = canFound(s, u.realm, u.hex);
  if (err) return err;
  const R = s.realms[u.realm];
  const cu = CULTURES[R.culture];
  const first = !s.cities.some((c) => c.realm === u.realm);
  const name = cu.cities[R.named] ?? `Yeni ${cu.cities[R.named % cu.cities.length]}`;
  R.named++;
  const c: City = {
    id: nid(s), realm: u.realm, name, hex: u.hex, pop: first ? 2 : 1, grow: 0, founded: s.turn, cbs: [], building: null,
    market: [], hp: 100, capital: first, radius: 1,
  };
  c.market = cityMarket(s, c).target.map((t) => t * 0.8);
  s.cities.push(c);
  claim(s, c);
  s.units = s.units.filter((x) => x.id !== u.id);
  log(s, first ? `${R.name}, göçebeliği bırakıp ${name} şehrini kurdu.` : `${R.name} yeni bir şehir kurdu: ${name}.`, first ? 'news' : 'build', first ? undefined : u.realm);
  return null;
}

// ---------- yapılar ----------
export const buildCostMult = (s: GameState, r: number) => T(s.realms[r].culture, 'build') * (s.realms[r].techs.includes('insaat') ? 0.9 : 1);
export function impCost(s: GameState, r: number, type: ImpId) {
  const d = IMP[type]; const m = buildCostMult(s, r);
  return { gold: Math.round(d.gold * m), mat: Object.fromEntries(Object.entries(d.mat).map(([g, q]) => [g, Math.ceil((q as number) * m)])) as Partial<Record<GoodId, number>> };
}
export function upgradeCost(s: GameState, im: Imp) {
  const d = IMP[im.type]; const m = buildCostMult(s, im.realm) * (1 + im.level * 0.8);
  return { gold: Math.round(d.gold * m), mat: Object.fromEntries(Object.entries(d.mat).map(([g, q]) => [g, Math.ceil((q as number) * m)])) as Partial<Record<GoodId, number>> };
}
export function cbCost(s: GameState, r: number, id: CbId) {
  const d = CB[id]; const m = buildCostMult(s, r);
  return { gold: Math.round(d.gold * m), mat: Object.fromEntries(Object.entries(d.mat).map(([g, q]) => [g, Math.ceil((q as number) * m)])) as Partial<Record<GoodId, number>> };
}
const hasMat = (R: Realm, mat: Partial<Record<GoodId, number>>) => Object.entries(mat).every(([g, q]) => R.inv[G[g as GoodId]] >= (q as number) - 1e-9);
const payMat = (R: Realm, mat: Partial<Record<GoodId, number>>) => { for (const [g, q] of Object.entries(mat)) R.inv[G[g as GoodId]] -= q as number; };
const matText = (mat: Partial<Record<GoodId, number>>) => Object.entries(mat).map(([g, q]) => `${q} ${GOODS[G[g as GoodId]].name}`).join(', ');

export function canBuildImp(s: GameState, r: number, hex: number, type: ImpId): string | null {
  const map = getMap(s.seed);
  const R = s.realms[r], d = IMP[type], h = map.hexes[hex];
  if (!hasTech(R, d.tech)) return `${TECH[d.tech!].name} araştırılmalı`;
  if (ownerOf(s, hex) !== r) return 'Yalnızca kendi toprağına kurabilirsin';
  if (cityAt(s, hex)) return 'Şehir merkezi';
  if (s.imps.some((b) => b.hex === hex)) return 'Bu hex dolu';
  if (d.coast && !h.coast) return 'Kıyı hex\'i gerekir';
  if (d.needs && h.res[d.needs.res] < d.needs.min) return `Yetersiz ${d.needs.res === 'fertility' ? 'verim' : d.needs.res}`;
  const c = impCost(s, r, type);
  if (R.gold < c.gold) return `${c.gold} altın gerekir`;
  if (!hasMat(R, c.mat)) return `Malzeme: ${matText(c.mat)}`;
  return null;
}
export function canCityBuild(s: GameState, r: number, city: City, id: CbId): string | null {
  const map = getMap(s.seed);
  const R = s.realms[r], d = CB[id];
  if (city.realm !== r) return 'Senin şehrin değil';
  if (!hasTech(R, d.tech)) return `${TECH[d.tech!].name} araştırılmalı`;
  if (city.cbs.includes(id)) return 'Zaten var';
  if (city.building) return 'Şehirde inşaat sürüyor';
  if (d.coast && !map.hexes[city.hex].coast) return 'Kıyı şehri gerekir';
  const c = cbCost(s, r, id);
  if (R.gold < c.gold) return `${c.gold} altın gerekir`;
  if (!hasMat(R, c.mat)) return `Malzeme: ${matText(c.mat)}`;
  return null;
}
export function canTrain(s: GameState, r: number, city: City, type: UnitId): string | null {
  const R = s.realms[r], d = UNIT[type];
  if (city.realm !== r) return 'Senin şehrin değil';
  if (!hasTech(R, d.tech)) return `${TECH[d.tech!].name} araştırılmalı`;
  if (type === 'settler' && city.pop < 2) return 'Şehir nüfusu en az 2 olmalı';
  if (type === 'settler' && type === 'settler' && !hasTech(R, 'tarim') && s.cities.some((c) => c.realm === r)) return 'Tarım araştırılmalı';
  if (R.gold < d.gold) return `${d.gold} altın gerekir`;
  if (!hasMat(R, d.cost)) return `Gerekli: ${matText(d.cost)}`;
  return null;
}

// ---------- ticaret yolu ----------
export function routePath(s: GameState, from: City, to: City): { sea: boolean; path: number[] } | null {
  const map = getMap(s.seed);
  const land = astar(map, from.hex, to.hex, (h) => (h.land ? (h.terrain === 'mountain' ? 3 : h.terrain === 'hills' || h.feature ? 1.6 : 1) : Infinity), 5000);
  const R = s.realms[from.realm];
  const harbors = from.cbs.includes('harbor') && to.cbs.includes('harbor');
  const canSea = (harbors || (R.techs.includes('balikcilik') && hexDist(map, from.hex, to.hex) <= 8)) && map.hexes[from.hex].coast && map.hexes[to.hex].coast;
  let sea: number[] | null = null;
  if (canSea) sea = astar(map, from.hex, to.hex, (h, goal) => (goal ? 1 : h.land ? Infinity : 1), 9000);
  const deep = sea && !harbors ? sea.filter((i) => map.hexes[i].terrain === 'deep').length > 2 : false; // sal: yalnız kıyı boyu
  if (deep) sea = null;
  if (!land && !sea) return null;
  if (land && (!sea || land.length <= sea.length * 1.6)) return { sea: false, path: land };
  return { sea: true, path: sea! };
}
export function canRoute(s: GameState, r: number, fromId: number, toId: number): string | null {
  const a = s.cities.find((c) => c.id === fromId), b = s.cities.find((c) => c.id === toId);
  if (!a || !b) return 'Şehir bulunamadı';
  if (a.realm !== r) return 'Yol kendi şehrinden başlamalı';
  if (a.id === b.id) return 'Aynı şehir';
  if (atWar(s, r, b.realm)) return 'Savaştaki bir ülkeye ticaret yolu açılamaz';
  if (s.routes.some((x) => x.realm === r && x.from === a.id && x.to === b.id)) return 'Bu yol zaten var';
  if (s.routes.filter((x) => x.realm === r).length >= routeSlots(s, r)) return `Ticaret yolu sınırı (${routeSlots(s, r)}). Pazar yeri ve kervansaray yuva açar.`;
  const bits = exploredBits(s, r);
  if (!bitGet(bits, b.hex)) return 'Hedef şehir keşfedilmemiş';
  const p = routePath(s, a, b);
  if (!p) return 'Yol bulunamadı (deniz yolu için iki şehirde de Liman gerekir)';
  if (p.path.length > 60) return 'Çok uzak (en fazla 60 hex)';
  return null;
}

// ---------- muharebe ----------
const defBonus = (s: GameState, hex: number) => { const h = getMap(s.seed).hexes[hex]; return h.terrain === 'hills' ? 1.25 : h.feature ? 1.2 : h.terrain === 'mountain' ? 1.4 : 1; };
export function unitStr(s: GameState, u: Unit) {
  const d = UNIT[u.type];
  return d.str * u.vet * T(s.realms[u.realm]?.culture ?? 0, 'military') * (0.55 + 0.45 * u.hp / 100);
}
export function cityStr(s: GameState, c: City) {
  const R = s.realms[c.realm];
  const garrison = s.units.filter((u) => u.hex === c.hex && u.realm === c.realm && !UNIT[u.type].civil);
  const g = garrison.reduce((m, u) => Math.max(m, unitStr(s, u)), 0);
  return (8 + c.pop * 1.5 + R.era * 9 + (c.cbs.includes('walls') ? 15 + R.era * 4 : 0) + g * 0.6) * (0.5 + 0.5 * c.hp / 100);
}
function dmg(s: GameState, a: number, d: number) { return 30 * Math.exp((a - d) / 25) * (0.8 + rand(s) * 0.4); }

/** a birimi hedef hex'e saldırır. true: saldıran hex'e girebilir. */
function attack(s: GameState, u: Unit, hex: number): boolean {
  const map = getMap(s.seed);
  const R = s.realms[u.realm];
  const camp = s.camps.find((c) => c.hex === hex);
  if (camp) {
    const A = unitStr(s, u), D = camp.str * defBonus(s, hex) * (0.55 + 0.45 * camp.hp / 100);
    camp.hp -= dmg(s, A, D); u.hp -= dmg(s, D, A);
    if (u.hp <= 0) { s.units = s.units.filter((x) => x.id !== u.id); log(s, `${UNIT[u.type].name} birliğin haydutlara yenildi.`, 'war', u.realm); return false; }
    if (camp.hp <= 0) {
      s.camps = s.camps.filter((c) => c.id !== camp.id);
      const loot = 25 * (R.era + 1);
      R.gold += loot; R.ledger.other += loot;
      log(s, `${R.name} bir haydut kampını dağıttı (+${loot} altın).`, 'war', u.realm);
      return true;
    }
    return false;
  }
  const city = cityAt(s, hex);
  const enemies = s.units.filter((x) => x.hex === hex && atWar(s, u.realm, x.realm) && !UNIT[x.type].civil);
  if (enemies.length) {
    const tgt = enemies.reduce((b, x) => (unitStr(s, x) > unitStr(s, b) ? x : b));
    const A = unitStr(s, u), D = unitStr(s, tgt) * defBonus(s, hex) * (city ? 1.2 : 1) * (tgt.task === 'fortify' ? 1.15 : 1);
    tgt.hp -= dmg(s, A, D); u.hp -= dmg(s, D, A) * (u.type === 'archer' ? 0.5 : 1);
    if (tgt.hp <= 0) { s.units = s.units.filter((x) => x.id !== tgt.id); log(s, `${s.realms[tgt.realm].name} ${UNIT[tgt.type].name} birliğini kaybetti.`, 'war'); }
    if (u.hp <= 0) { s.units = s.units.filter((x) => x.id !== u.id); log(s, `${R.name} ${UNIT[u.type].name} birliğini kaybetti.`, 'war'); return false; }
    return false;
  }
  if (city && atWar(s, u.realm, city.realm)) {
    const A = unitStr(s, u) * (u.type === 'artillery' ? 1.6 : 1), D = cityStr(s, city);
    city.hp -= dmg(s, A, D); u.hp -= dmg(s, D, A) * 0.8;
    if (u.hp <= 0) { s.units = s.units.filter((x) => x.id !== u.id); log(s, `${city.name} surları önünde ${R.name} birliği düştü.`, 'war'); return false; }
    if (city.hp <= 0) { capture(s, city, u.realm); return true; }
    return false;
  }
  // savaş dışı: sivil düşman birimi esir
  const civ = s.units.filter((x) => x.hex === hex && atWar(s, u.realm, x.realm));
  if (civ.length) { s.units = s.units.filter((x) => !civ.includes(x)); log(s, `${R.name} düşman sivillerini dağıttı.`, 'war'); }
  void map;
  return true;
}

function capture(s: GameState, c: City, by: number) {
  const map = getMap(s.seed);
  const old = c.realm;
  const oldR = s.realms[old], R = s.realms[by];
  c.realm = by; c.hp = 50; c.capital = false; c.pop = Math.max(1, c.pop - 1); c.building = null;
  for (const i of within(map, c.hex, c.radius)) if (ownerOf(s, i) === old) s.own[i] = by;
  for (const im of s.imps) if (s.own[im.hex] === by && im.realm === old) im.realm = by;
  s.routes = s.routes.filter((r) => !(r.from === c.id && r.realm === old));
  s.units = s.units.filter((u) => !(u.hex === c.hex && u.realm === old));
  log(s, `⚔ ${R.name}, ${oldR.name} şehri ${c.name}'i ele geçirdi!`, 'news');
  if (!s.cities.some((x) => x.realm === old)) {
    if (!s.units.some((u) => u.realm === old && u.type === 'settler')) {
      oldR.alive = false;
      s.units = s.units.filter((u) => u.realm !== old);
      s.routes = s.routes.filter((r) => r.realm !== old);
      for (const im of s.imps) if (im.realm === old) im.realm = by;
      log(s, `${oldR.name} tarih sahnesinden silindi.`, 'news');
      for (const r of s.realms) r.wars = r.wars.filter((w) => w !== old);
    }
  } else if (!s.cities.some((x) => x.realm === old && x.capital)) {
    const nc = s.cities.find((x) => x.realm === old); if (nc) nc.capital = true;
  }
}

// ---------- eylemler ----------
export type Action =
  | { t: 'research'; tech: TechId }
  | { t: 'found'; unit: number }
  | { t: 'move'; unit: number; to: number }
  | { t: 'task'; unit: number; task: Unit['task'] }
  | { t: 'disband'; unit: number }
  | { t: 'build'; hex: number; type: ImpId }
  | { t: 'upgrade'; imp: number }
  | { t: 'demolish'; imp: number }
  | { t: 'cityBuild'; city: number; cb: CbId }
  | { t: 'train'; city: number; unit: UnitId }
  | { t: 'route'; from: number; to: number }
  | { t: 'cancelRoute'; route: number }
  | { t: 'sell'; city: number; good: number; qty: number }
  | { t: 'buy'; city: number; good: number; qty: number }
  | { t: 'order'; good: number; side: 'buy' | 'sell'; price: number; qty: number }
  | { t: 'cancel'; order: number }
  | { t: 'tax'; rate: number }
  | { t: 'war'; realm: number }
  | { t: 'peace'; realm: number }
  | { t: 'steward'; on: boolean }
  | { t: 'fund'; amount: number }
  | { t: 'mars'; city: number };
export type ActionResult = { ok: true; msg?: string } | { ok: false; err: string };
const ok = (msg?: string): ActionResult => ({ ok: true, msg });
const no = (err: string): ActionResult => ({ ok: false, err });

export function unitPath(s: GameState, u: Unit, to: number) {
  const map = getMap(s.seed);
  return astar(map, u.hex, to, (h, goal) => {
    const c = moveCost(h);
    if (!isFinite(c)) return c;
    if (!goal && s.camps.some((x) => x.hex === h.i)) return Infinity;
    return c;
  }, 6000);
}

export function applyAction(s: GameState, r: number, a: Action): ActionResult {
  const R = s.realms[r];
  if (!R || !R.alive) return no('Krallığın yok');
  if (s.ended) return no('Oyun bitti');
  const map = getMap(s.seed);
  const myUnit = (id: number) => s.units.find((u) => u.id === id && u.realm === r);
  const myCity = (id: number) => s.cities.find((c) => c.id === id && c.realm === r);
  switch (a.t) {
    case 'research': {
      const d = TECH[a.tech];
      if (!d) return no('Bilinmeyen teknoloji');
      if (R.techs.includes(a.tech)) return no('Zaten biliniyor');
      if (!d.req.every((q) => R.techs.includes(q))) return no(`Önce: ${d.req.filter((q) => !R.techs.includes(q)).map((q) => TECH[q].name).join(', ')}`);
      if (R.research !== a.tech) { R.research = a.tech; }
      return ok(`Araştırılıyor: ${d.name}`);
    }
    case 'found': {
      const u = myUnit(a.unit);
      if (!u || u.type !== 'settler') return no('Göçmen birimi seç');
      const err = foundCity(s, u);
      return err ? no(err) : ok('Şehir kuruldu');
    }
    case 'move': {
      const u = myUnit(a.unit);
      if (!u) return no('Birim bulunamadı');
      if (a.to === u.hex) { u.path = []; return ok(); }
      if (!map.hexes[a.to]?.land) return no('Kara birimleri denize giremez');
      const p = unitPath(s, u, a.to);
      if (!p) return no('Yol bulunamadı');
      u.path = p; if (u.task === 'explore' || u.task === 'fortify') u.task = 'none';
      return ok(`${p.length} hex · ~${Math.ceil(p.reduce((t, i) => t + moveCost(map.hexes[i]), 0) / UNIT[u.type].moves)} tur`);
    }
    case 'task': {
      const u = myUnit(a.unit);
      if (!u) return no('Birim bulunamadı');
      u.task = a.task; if (a.task !== 'found') u.path = [];
      return ok();
    }
    case 'disband': {
      const u = myUnit(a.unit);
      if (!u) return no('Birim bulunamadı');
      s.units = s.units.filter((x) => x.id !== u.id);
      return ok('Birlik dağıtıldı');
    }
    case 'build': {
      const err = canBuildImp(s, r, a.hex, a.type);
      if (err) return no(err);
      const c = impCost(s, r, a.type);
      R.gold -= c.gold; payMat(R, c.mat); R.ledger.build += c.gold;
      s.imps.push({ id: nid(s), realm: r, hex: a.hex, type: a.type, level: 1, left: IMP[a.type].turns, eff: 0, status: 'İnşaat', out: 0 });
      return ok(`${IMP[a.type].name} inşa ediliyor`);
    }
    case 'upgrade': {
      const im = s.imps.find((b) => b.id === a.imp && b.realm === r);
      if (!im) return no('Yapı bulunamadı');
      if (im.left > 0) return no('İnşaat sürüyor');
      if (im.level >= 5) return no('En yüksek seviye');
      const c = upgradeCost(s, im);
      if (R.gold < c.gold) return no(`${c.gold} altın gerekir`);
      if (!hasMat(R, c.mat)) return no(`Malzeme: ${matText(c.mat)}`);
      R.gold -= c.gold; payMat(R, c.mat); R.ledger.build += c.gold;
      im.left = Math.ceil(IMP[im.type].turns / 2); im.level++;
      return ok(`Seviye ${im.level} için inşaat başladı`);
    }
    case 'demolish': {
      const im = s.imps.find((b) => b.id === a.imp && b.realm === r);
      if (!im) return no('Yapı bulunamadı');
      s.imps = s.imps.filter((b) => b.id !== im.id);
      return ok('Yıkıldı');
    }
    case 'cityBuild': {
      const c = myCity(a.city);
      if (!c) return no('Şehir bulunamadı');
      const err = canCityBuild(s, r, c, a.cb);
      if (err) return no(err);
      const k = cbCost(s, r, a.cb);
      R.gold -= k.gold; payMat(R, k.mat); R.ledger.build += k.gold;
      c.building = { id: a.cb, left: CB[a.cb].turns };
      return ok(`${CB[a.cb].name} inşa ediliyor`);
    }
    case 'train': {
      const c = myCity(a.city);
      if (!c) return no('Şehir bulunamadı');
      const err = canTrain(s, r, c, a.unit);
      if (err) return no(err);
      const d = UNIT[a.unit];
      R.gold -= d.gold; payMat(R, d.cost); R.ledger.build += d.gold;
      if (a.unit === 'settler') c.pop--;
      s.units.push({ id: nid(s), realm: r, type: a.unit, hex: c.hex, path: [], hp: 100, vet: c.cbs.includes('barracks') ? 1.15 : 1, task: a.unit === 'scout' ? 'explore' : 'none' });
      return ok(`${d.name} hazır`);
    }
    case 'route': {
      const err = canRoute(s, r, a.from, a.to);
      if (err) return no(err);
      const A = s.cities.find((c) => c.id === a.from)!, Bc = s.cities.find((c) => c.id === a.to)!;
      const p = routePath(s, A, Bc)!;
      const rt: Route = { id: nid(s), realm: r, from: A.id, to: Bc.id, sea: p.sea, path: p.path, vehicle: '', pos: 0, cargo: null, income: 0, trips: 0 };
      rt.vehicle = bestVehicle(s, rt).id;
      loadCargo(s, rt);
      s.routes.push(rt);
      return ok(`${A.name} → ${Bc.name} ${p.sea ? 'deniz' : 'kara'} yolu açıldı (${p.path.length} hex)`);
    }
    case 'cancelRoute': {
      const rt = s.routes.find((x) => x.id === a.route && x.realm === r);
      if (!rt) return no('Yol bulunamadı');
      if (rt.cargo) R.inv[rt.cargo.good] += rt.cargo.qty;
      s.routes = s.routes.filter((x) => x.id !== rt.id);
      return ok('Ticaret yolu kapatıldı');
    }
    case 'sell': {
      const c = myCity(a.city);
      if (!c) return no('Yalnızca kendi şehirlerinin pazarında satabilirsin (diğerlerine ticaret yolu aç)');
      const q = Math.floor(Math.min(a.qty, R.inv[a.good]));
      if (q <= 0) return no('Stokta yok');
      const m = cityMarket(s, c);
      const got = quoteSell(m, a.good, q, 0);
      c.market[a.good] += q; R.inv[a.good] -= q; R.gold += got; R.ledger.sales += got;
      return ok(`${q} ${GOODS[a.good].name} satıldı: +${fmt(got)} altın`);
    }
    case 'buy': {
      const c = myCity(a.city);
      if (!c) return no('Yalnızca kendi şehirlerinin pazarından alabilirsin');
      const m = cityMarket(s, c);
      const q = Math.floor(a.qty);
      const cost = quoteBuy(m, a.good, q, 0);
      if (!isFinite(cost)) return no('Pazarda yeterli stok yok');
      if (R.gold < cost) return no(`${fmt(cost)} altın gerekir`);
      c.market[a.good] -= q; R.inv[a.good] += q; R.gold -= cost; R.ledger.buy += cost;
      return ok(`${q} ${GOODS[a.good].name} alındı: −${fmt(cost)} altın`);
    }
    case 'order': {
      const qty = Math.floor(a.qty), price = Math.round(a.price * 100) / 100;
      if (qty <= 0 || price <= 0) return no('Geçersiz emir');
      if (a.side === 'sell') { if (R.inv[a.good] < qty) return no('Stok yetmiyor'); R.inv[a.good] -= qty; }
      else { if (R.gold < qty * price) return no('Altın yetmiyor'); R.gold -= qty * price; }
      const o: Order = { id: nid(s), good: a.good, side: a.side, price, qty, quality: 0, house: r, day: s.turn, seq: s.seq++ };
      const fills = matchOrder(s.orders, o, (other) => !atWar(s, r, other));
      for (const f of fills) {
        const seller = s.realms[f.seller], buyer = s.realms[f.buyer];
        const val = f.qty * f.price, fee = val * C.ORDER_FEE;
        seller.gold += val - fee; seller.ledger.sales += val - fee;
        buyer.inv[f.good] += f.qty;
        if (a.side === 'buy') { const refund = f.qty * (price - f.price); buyer.gold += refund; }
        buyer.ledger.buy += val;
        s.trades.push({ turn: s.turn, good: f.good, price: f.price, qty: f.qty, buyer: f.buyer, seller: f.seller });
      }
      if (s.trades.length > 400) s.trades.splice(0, s.trades.length - 400);
      if (o.qty > 0) s.orders.push(o);
      s.orders = s.orders.filter((x) => x.qty > 0);
      return ok(fills.length ? `${fills.reduce((t, f) => t + f.qty, 0)} birim eşleşti` : 'Emir deftere yazıldı');
    }
    case 'cancel': {
      const o = s.orders.find((x) => x.id === a.order && x.house === r);
      if (!o) return no('Emir yok');
      if (o.side === 'sell') R.inv[o.good] += o.qty; else R.gold += o.qty * o.price;
      s.orders = s.orders.filter((x) => x.id !== o.id);
      return ok('Emir iptal edildi');
    }
    case 'tax': R.tax = Math.max(0, Math.min(0.4, a.rate)); return ok(`Vergi %${Math.round(R.tax * 100)}`);
    case 'war': {
      const o = s.realms[a.realm];
      if (!o || !o.alive || a.realm === r) return no('Geçersiz hedef');
      if (atWar(s, r, a.realm)) return no('Zaten savaştasınız');
      R.wars.push(a.realm); o.wars.push(r);
      R.peace = R.peace.filter((x) => x !== a.realm); o.peace = o.peace.filter((x) => x !== r);
      s.routes = s.routes.filter((rt) => !((rt.realm === r && s.cities.find((c) => c.id === rt.to)?.realm === a.realm) || (rt.realm === a.realm && s.cities.find((c) => c.id === rt.to)?.realm === r)));
      log(s, `⚔ ${R.name}, ${o.name}'a savaş ilan etti!`, 'news');
      return ok('Savaş ilan edildi');
    }
    case 'peace': {
      const o = s.realms[a.realm];
      if (!o || !atWar(s, r, a.realm)) return no('Savaşta değilsiniz');
      if (o.peace.includes(r) || (o.kind === 'bot' && botWantsPeace(s, a.realm, r))) {
        R.wars = R.wars.filter((x) => x !== a.realm); o.wars = o.wars.filter((x) => x !== r);
        o.peace = o.peace.filter((x) => x !== r); R.peace = R.peace.filter((x) => x !== a.realm);
        log(s, `🕊 ${R.name} ile ${o.name} barış yaptı.`, 'news');
        return ok('Barış imzalandı');
      }
      if (!R.peace.includes(a.realm)) R.peace.push(a.realm);
      return ok(o.kind === 'bot' ? `${o.name} şimdilik barışa yanaşmıyor` : 'Barış teklifi gönderildi');
    }
    case 'steward': R.steward = a.on; return ok(a.on ? 'Vekil açık' : 'Vekil kapalı');
    case 'fund': {
      const amt = Math.floor(Math.min(a.amount, R.gold));
      if (amt <= 0) return no('Altın yok');
      R.gold -= amt; R.science += amt * C.FUND_RATE; R.ledger.other += amt;
      return ok(`Akademiye ${amt} altın: +${fmt(amt * C.FUND_RATE)} bilim`);
    }
    case 'mars': {
      const c = myCity(a.city);
      if (!c || !c.cbs.includes('spaceport')) return no('Uzay limanı olan bir şehir gerekir');
      const k = C.MARS_COST;
      if (R.gold < k.gold) return no(`${k.gold} altın gerekir`);
      const mat = { robots: k.robots, electronics: k.electronics, fuel: k.fuel } as Partial<Record<GoodId, number>>;
      if (!hasMat(R, mat)) return no(`Gerekli: ${matText(mat)}`);
      R.gold -= k.gold; payMat(R, mat);
      s.ended = { winner: r, reason: `${R.name}, ${c.name} uzay limanından Mars Kolonisi'ni kurdu!` };
      log(s, `🚀 ${s.ended.reason}`, 'news');
      return ok('Mars Kolonisi kuruldu!');
    }
  }
  return no('Bilinmeyen eylem');
}

export function botWantsPeace(s: GameState, bot: number, other: number) {
  const pw = (r: number) => s.units.filter((u) => u.realm === r && !UNIT[u.type].civil).reduce((t, u) => t + unitStr(s, u), 0) + realmCities(s, r).length * 10;
  return pw(bot) < pw(other) * 1.1 || rand(s) < 0.15;
}

// ---------- ticaret yolu yükleme ----------
function loadCargo(s: GameState, rt: Route) {
  const R = s.realms[rt.realm];
  const A = s.cities.find((c) => c.id === rt.from), B = s.cities.find((c) => c.id === rt.to);
  if (!A || !B) return;
  const v = VEHICLES.find((x) => x.id === rt.vehicle)!;
  const ma = cityMarket(s, A), mb = cityMarket(s, B);
  let best = -1, bm = 0;
  for (let g = 0; g < NG; g++) {
    const reserve = g === G.food ? R.stats.foodNeed * 3 + 10 : 2;
    if (R.inv[g] - reserve < 1) continue;
    const margin = unitPrice(mb, g) * C.SELL_SPREAD - unitPrice(ma, g) * 0.8;
    if (margin > bm) { bm = margin; best = g; }
  }
  if (best < 0) { rt.cargo = null; return; }
  const reserve = best === G.food ? R.stats.foodNeed * 3 + 10 : 2;
  const qty = Math.floor(Math.min(v.cap, R.inv[best] - reserve));
  if (qty <= 0) { rt.cargo = null; return; }
  R.inv[best] -= qty;
  rt.cargo = { good: best, qty };
}

// ---------- tur ----------
export function tick(s: GameState, botHook?: (s: GameState) => void) {
  if (s.ended) return;
  const map = getMap(s.seed);
  for (const R of s.realms) { R.last = R.ledger; R.ledger = emptyLedger(); }
  const alive = s.realms.filter((R) => R.alive);

  // 1) üretim
  const labor = new Map<number, number>(), need = new Map<number, number>();
  for (const R of alive) labor.set(R.id, laborOf(s, R.id) * (0.8 + 0.2 * R.stats.happy));
  for (const im of s.imps) if (im.left === 0) need.set(im.realm, (need.get(im.realm) ?? 0) + IMP[im.type].workers * im.level);
  const prodBonus = new Map<number, number>();
  for (const R of alive) {
    let b = T(R.culture, 'prod');
    if (R.techs.includes('lonca')) b *= 1.1;
    if (R.techs.includes('nukleer')) b *= 1.15;
    if (R.techs.includes('fuzyon')) b *= 1.25;
    b *= 1 + 0.03 * realmCities(s, R.id).filter((c) => c.cbs.includes('powerplant')).length;
    prodBonus.set(R.id, b);
  }
  const campNear = new Set<number>();
  for (const c of s.camps) for (const i of within(map, c.hex, 2)) campNear.add(i);
  const byOrder = [...s.imps].sort((a, b) => IMPS.findIndex((d) => d.id === a.type) - IMPS.findIndex((d) => d.id === b.type));
  for (const im of byOrder) {
    const R = s.realms[im.realm];
    if (!R?.alive) continue;
    if (im.left > 0) { im.left--; im.status = im.left > 0 ? `İnşaat: ${im.left} tur` : 'Hazır'; im.out = 0; continue; }
    const d = IMP[im.type], h = map.hexes[im.hex];
    const laborEff = Math.min(1, (labor.get(R.id) ?? 0) / Math.max(1, need.get(R.id) ?? 1));
    let k = im.level * laborEff * (prodBonus.get(R.id) ?? 1);
    if (d.needs) k *= Math.min(1.3, 0.45 + h.res[d.needs.res]);
    if (im.type === 'farm' || im.type === 'fishery' || im.type === 'hunt') k *= T(R.culture, 'farm');
    if (im.type === 'pasture' && R.culture === 8) k *= 1.3;
    if (/mine|quarry|oilwell/.test(im.type)) k *= T(R.culture, 'mine');
    if (campNear.has(im.hex)) k *= 0.5;
    for (const [g, q] of Object.entries(d.inputs)) { const have = R.inv[G[g as GoodId]]; k = Math.min(k, have / (q as number)); }
    k = Math.max(0, k);
    for (const [g, q] of Object.entries(d.inputs)) R.inv[G[g as GoodId]] -= (q as number) * k;
    let val = 0;
    for (const [g, q] of Object.entries(d.outputs)) { const n = (q as number) * k; R.inv[G[g as GoodId]] += n; val += n * GOODS[G[g as GoodId]].price; }
    im.eff = im.level ? k / im.level : 0; im.out = val;
    im.status = campNear.has(im.hex) ? 'Haydut baskısı' : laborEff < 0.99 ? 'İşçi yetersiz' : k < im.level * 0.5 && Object.keys(d.inputs).length ? 'Girdi yetersiz' : 'Çalışıyor';
  }

  // 2) şehirler: yiyecek, büyüme, bilim, vergi, yapılar
  for (const R of alive) {
    const cs = realmCities(s, R.id);
    let pop = 0, sci = 0, gold = 0;
    for (const c of cs) {
      pop += c.pop;
      R.inv[G.food] += 2 + R.era + (c.cbs.includes('harbor') ? 2 : 0) + (c.capital ? 1 : 0);
      R.inv[G.wood] += 0.5;
      sci += 1 + c.pop * 0.5 + (c.cbs.includes('library') ? 3 : 0) + (c.cbs.includes('university') ? 7 : 0) + (c.cbs.includes('lab') ? 16 : 0);
      let g = c.pop * (0.12 + R.tax * 1.6) + (c.capital ? 2 : 0);
      if (c.cbs.includes('market')) g *= 1.2;
      if (c.cbs.includes('bank')) g *= 1.3;
      gold += g;
      if (c.building) { c.building.left--; if (c.building.left <= 0) { c.cbs.push(c.building.id); log(s, `${c.name}: ${CB[c.building.id].name} tamamlandı.`, 'build', R.id); c.building = null; } }
      c.hp = Math.min(100, c.hp + 12);
    }
    sci *= T(R.culture, 'science') * (R.techs.includes('matematik') ? 1.1 : 1) * (R.techs.includes('felsefe') ? 1.1 : 1) * (R.techs.includes('yapayzeka') ? 1.25 : 1);
    gold *= T(R.culture, 'gold');
    const foodNeed = pop;
    R.inv[G.food] -= foodNeed;
    if (R.inv[G.food] < 0) {
      R.inv[G.food] = 0;
      const big = cs.filter((c) => c.pop > 1).sort((a, b) => b.pop - a.pop)[0];
      if (big && rand(s) < 0.5) { big.pop--; log(s, `${big.name}'de kıtlık: nüfus azaldı.`, 'warn', R.id); }
    }
    // mutluluk: lüks mallar şehir pazarlarında var mı + vergi + savaş
    const lux = GOODS.map((g, i) => ({ g, i })).filter(({ g }) => g.luxury && g.era <= R.era);
    let met = 0;
    for (const { i } of lux) {
      const ok2 = cs.filter((c) => c.market[i] > cityMarket(s, c).target[i] * 0.3).length;
      met += cs.length ? ok2 / cs.length : 0;
    }
    R.stats.happy = Math.max(0.1, Math.min(1, 0.55 + (lux.length ? 0.45 * met / lux.length : 0.25) - Math.max(0, R.tax - 0.2) * 1.5 - R.wars.length * 0.05));
    const cap = popCap(R);
    for (const c of cs) {
      if (c.pop >= cap) { c.grow = 0; continue; }
      const surplus = R.inv[G.food] > c.pop * 2;
      if (!surplus) continue;
      c.grow += T(R.culture, 'growth') * (c.cbs.includes('granary') ? 1.25 : 1) * (0.5 + R.stats.happy);
      const th = 3 + c.pop * 1.4;
      if (c.grow >= th && R.inv[G.food] >= c.pop * 3) {
        R.inv[G.food] -= c.pop * 3; c.grow = 0; c.pop++;
        const nr = Math.min(3, cityRadius(c.pop) + (R.techs.includes('felsefe') && c.pop >= 4 ? 1 : 0));
        if (nr > c.radius) { c.radius = nr; claim(s, c); }
      }
    }
    // gider
    let upkeep = 0;
    for (const u of s.units) if (u.realm === R.id) upkeep += UNIT[u.type].upkeep;
    for (const im of s.imps) if (im.realm === R.id) upkeep += 0.15 * im.level * (1 + IMP[im.type].era * 0.25);
    for (const c of cs) upkeep += c.cbs.length * 0.4;
    upkeep *= T(R.culture, 'upkeep');
    R.gold += gold - upkeep;
    R.ledger.tax += gold; R.ledger.upkeep += upkeep;
    if (R.gold < -50) {
      const mil = s.units.filter((u) => u.realm === R.id && !UNIT[u.type].civil);
      if (mil.length) { const u = mil[0]; s.units = s.units.filter((x) => x.id !== u.id); log(s, `Hazine boş: ${UNIT[u.type].name} birliği dağıldı.`, 'warn', R.id); }
      R.gold = -50;
    }
    // araştırma
    if (!R.research || R.techs.includes(R.research)) R.research = cheapestTech(R);
    if (R.research) {
      R.science += sci;
      const cost = techCost(R.research, R.techs.length);
      if (R.science >= cost) {
        R.science -= cost;
        R.techs.push(R.research);
        const d = TECH[R.research];
        log(s, `${d.icon} ${d.name} keşfedildi! ${d.desc}`, 'tech', R.id);
        const era = eraOf(R);
        if (era > R.era) { R.era = era; log(s, `${R.name} ${ERAS[era].name}'na girdi.`, 'news'); }
        R.research = null;
      }
    }
    R.stats = { ...R.stats, pop, sci, gold: gold - upkeep, food: R.inv[G.food], foodNeed, labor: labor.get(R.id) ?? 0, laborNeed: need.get(R.id) ?? 0, prod: 0 };
  }

  // 3) şehir pazarları: halk tüketir, köylüler ham mal getirir
  for (const c of s.cities) {
    const m = cityMarket(s, c);
    for (let g = 0; g < NG; g++) {
      const tg = m.target[g];
      c.market[g] = Math.max(0, c.market[g] - tg * 0.08 * (GOODS[g].era <= (s.realms[c.realm]?.era ?? 0) ? 1 : 0));
      if (g === G.food || g === G.wood || g === G.stone || g === G.clay) c.market[g] += tg * 0.05;
      c.market[g] += (tg - c.market[g]) * 0.01;
    }
  }

  // 4) ticaret yolları
  for (const rt of [...s.routes]) {
    const R = s.realms[rt.realm];
    const A = s.cities.find((c) => c.id === rt.from), B = s.cities.find((c) => c.id === rt.to);
    if (!R?.alive || !A || !B || A.realm !== rt.realm || atWar(s, rt.realm, B.realm)) {
      if (rt.cargo && R) R.inv[rt.cargo.good] += rt.cargo.qty;
      s.routes = s.routes.filter((x) => x.id !== rt.id); continue;
    }
    const v = VEHICLES.find((x) => x.id === rt.vehicle) ?? bestVehicle(s, rt);
    const L = rt.path.length;
    const before = rt.pos;
    rt.pos += v.speed * T(R.culture, v.sea ? 'seaSpeed' : 'landSpeed');
    if (before < L && rt.pos >= L) {
      // varış: sat + yol geliri
      let income = (1 + L * 0.08) * (1 + R.era * 0.2) * T(R.culture, 'route') * (A.cbs.includes('caravanserai') ? 1.2 : 1);
      if (rt.cargo) {
        const got = quoteSell(cityMarket(s, B), rt.cargo.good, rt.cargo.qty, 0);
        B.market[rt.cargo.good] += rt.cargo.qty;
        income += got;
        rt.cargo = null;
      }
      if (B.realm !== rt.realm) {
        const o = s.realms[B.realm];
        const bonus = 1 + L * 0.06; o.gold += bonus; o.ledger.routes += bonus;
        R.science += 0.5 + L * 0.03;
      }
      R.gold += income; R.ledger.routes += income; rt.income = income; rt.trips++;
      const bits = bitsDecode(R.explored, map.hexes.length);
      for (const i of rt.path) bitSet(bits, i);
      R.explored = bitsEncode(bits);
    }
    if (rt.pos >= 2 * L) {
      rt.pos = 0;
      rt.vehicle = bestVehicle(s, rt).id;
      loadCargo(s, rt);
    }
  }

  // 5) birimler
  for (const u of [...s.units]) {
    if (!s.units.includes(u)) continue;
    const R = s.realms[u.realm];
    if (u.task === 'explore' && !u.path.length) autoExplore(s, u);
    let mp = UNIT[u.type].moves * T(R.culture, 'landSpeed');
    const moved = u.path.length > 0;
    while (u.path.length && mp > 0) {
      const nx = u.path[0];
      const c = moveCost(map.hexes[nx]);
      if (c > mp && mp < UNIT[u.type].moves) break;
      const hostile = s.camps.some((x) => x.hex === nx) || s.units.some((x) => x.hex === nx && atWar(s, u.realm, x.realm))
        || (cityAt(s, nx) && atWar(s, u.realm, cityAt(s, nx)!.realm));
      if (hostile) {
        if (UNIT[u.type].civil) { u.path = []; break; }
        const enter = attack(s, u, nx);
        if (!s.units.includes(u)) break;
        if (!enter) { mp = 0; break; }
      }
      u.hex = nx; u.path.shift(); mp -= c;
    }
    if (!s.units.includes(u)) continue;
    if (u.task === 'found' && !u.path.length && u.type === 'settler') {
      const err = foundCity(s, u);
      if (err) { u.task = 'none'; log(s, `Göçmenler şehir kuramadı: ${err}`, 'warn', u.realm); }
    }
    if (!moved) u.hp = Math.min(100, u.hp + (ownerOf(s, u.hex) === u.realm ? 15 : 8));
  }
  // keşif
  for (const R of alive) {
    const bits = bitsDecode(R.explored, map.hexes.length);
    for (const c of s.cities) if (c.realm === R.id) reveal(map, bits, c.hex, C.CITY_SIGHT);
    for (const u of s.units) if (u.realm === R.id) reveal(map, bits, u.hex, UNIT[u.type].sight);
    R.explored = bitsEncode(bits);
  }

  // 6) haydutlar
  if (s.turn % 6 === 0 && s.camps.length < 22) spawnCamps(s, 2);
  for (const camp of s.camps) {
    camp.hp = Math.min(100, camp.hp + 5);
    if (s.turn % 50 === 0) camp.str = Math.max(camp.str, 7 + avgEra(s) * 13);
    if (rand(s) < 0.04) {
      const c = s.cities.find((x) => hexDist(map, x.hex, camp.hex) <= 3);
      if (c) {
        const guard = s.units.some((u) => u.realm === c.realm && !UNIT[u.type].civil && hexDist(map, u.hex, c.hex) <= 1);
        const R = s.realms[c.realm];
        if (!guard) { const loss = Math.min(Math.max(0, R.gold), 8 * (R.era + 1)); R.gold -= loss; log(s, `Haydutlar ${c.name} çevresini yağmaladı (−${fmt(loss)} altın). Bir birlik konuşlandır.`, 'warn', c.realm); }
      }
    }
  }

  // 7) botlar
  botHook?.(s);

  // 8) emir süresi, fiyat geçmişi, skor
  for (const o of [...s.orders]) if (s.turn - o.day > C.ORDER_EXPIRE_TURNS) {
    const R = s.realms[o.house];
    if (o.side === 'sell') R.inv[o.good] += o.qty; else R.gold += o.qty * o.price;
    s.orders = s.orders.filter((x) => x.id !== o.id);
  }
  for (let g = 0; g < NG; g++) {
    const ps = s.cities.map((c) => priceAt(s, c, g));
    const avg = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : GOODS[g].price;
    s.history[g].push(Math.round(avg * 100) / 100);
    if (s.history[g].length > C.HIST_LEN) s.history[g].shift();
  }
  for (const R of s.realms) {
    const cs = realmCities(s, R.id);
    R.score = Math.round(R.stats.pop * 3 + cs.length * 8 + R.techs.length * 6 + R.era * 25 + Math.max(0, R.gold) / 50
      + s.imps.filter((i) => i.realm === R.id).reduce((t, i) => t + i.level, 0));
    for (const [k, v] of [['gold', R.gold], ['score', R.score], ['pop', R.stats.pop], ['sci', R.stats.sci]] as const) {
      R.hist[k].push(Math.round(v)); if (R.hist[k].length > 60) R.hist[k].shift();
    }
  }
  s.turn++;
  if (s.turn >= END_TURN && !s.ended) {
    const w = [...s.realms].filter((r) => r.alive).sort((a, b) => b.score - a.score)[0];
    s.ended = { winner: w?.id ?? -1, reason: `2100 yılı geldi. En büyük medeniyet: ${w?.name} (${w?.score} puan).` };
    log(s, s.ended.reason, 'news');
  }
}

export function eraOf(R: Realm) {
  let e = 0;
  for (let k = 1; k < ERAS.length; k++) if (R.techs.filter((t) => TECH[t].era === k).length >= 2) e = k;
  return e;
}
export function availableTechs(R: Realm) { return TECHS.filter((t) => !R.techs.includes(t.id) && t.req.every((q) => R.techs.includes(q))); }
function cheapestTech(R: Realm): TechId | null {
  const av = availableTechs(R).sort((a, b) => a.era - b.era);
  return av[0]?.id ?? null;
}

function autoExplore(s: GameState, u: Unit) {
  const map = getMap(s.seed);
  const bits = exploredBits(s, u.realm);
  // en yakın keşfedilmemiş kara hex'i (BFS)
  const q = [u.hex], seen = new Set(q);
  while (q.length && seen.size < 2500) {
    const k = q.shift()!;
    if (!bitGet(bits, k) && map.hexes[k].land) {
      const p = unitPath(s, u, k);
      if (p) { u.path = p.slice(0, 8); return; }
    }
    for (const j of map.hexes[k].nb) if (!seen.has(j) && map.hexes[j].land && !s.camps.some((c) => c.hex === j)) { seen.add(j); q.push(j); }
  }
  u.task = 'none';
  log(s, 'Öncü keşfedecek yeni yer bulamadı.', 'info', u.realm);
}

export function realmValue(s: GameState, r: number) { return s.realms[r].score; }
export { yearOfTurn };
