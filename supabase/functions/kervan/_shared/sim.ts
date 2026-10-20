// KERVAN v0.4 simülasyonu — MÖ 4000'den 2100'e: göçebe kabileden uzay çağına.
// Saf TypeScript; tarayıcıda yerel sunucu, Supabase Edge Function'da online oda olarak çalışır.
import {
  C, CB, END_TURN, ERAS, G, GOODS, IMP, IMPS, NG, PALETTE, TECH, TECHS, UNIT, VEHICLES, WONDER, WONDERS,
  techCost, yearOfTurn, fmtYear,
  type CbId, type GoodId, type ImpId, type TechId, type UnitId, type VehicleDef, type WonderFx, type WonderId,
} from './defs.ts';
import { CULTURES, T } from './cultures.ts';
import { matchOrder, quoteBuy, quoteSell, unitPrice, type Order, type TownMarket } from './economy.ts';
import { astar, bitGet, bitSet, bitsDecode, bitsEncode, bitsNew, hexDist, moveCost, within } from './hexgrid.ts';
import { generateWorld, lonLatToHex, type WorldMap } from './world.ts';

export const BARB = -1; // haydutlar (Civ'deki barbarlar): herkesle savaştadır

export type RealmKind = 'player' | 'bot';
export interface Ledger { tax: number; sales: number; routes: number; upkeep: number; buy: number; build: number; other: number }
const emptyLedger = (): Ledger => ({ tax: 0, sales: 0, routes: 0, upkeep: 0, buy: 0, build: 0, other: 0 });

export interface RealmStats { pop: number; sci: number; gold: number; food: number; foodNeed: number; labor: number; laborNeed: number; happy: number; prod: number }
export interface Auto { build: boolean; imps: boolean; routes: boolean; army: boolean }
export interface Realm {
  id: number; name: string; culture: number; kind: RealmKind; user?: string; color: string;
  alive: boolean; away: boolean; steward: boolean;
  gold: number; science: number; research: TechId | null; techs: TechId[]; era: number;
  inv: number[]; explored: string; tax: number;
  ledger: Ledger; last: Ledger; stats: RealmStats;
  hist: { gold: number[]; score: number[]; pop: number[]; sci: number[] };
  wars: number[]; peace: number[]; // barış teklifleri (kime)
  rel: Record<number, number>; allies: number[]; pacts: number[]; allyOff: number[]; pactOff: number[];
  auto: Auto; quest: number; qdone: string[];
  score: number; named: number;
}
export type BuildKind = 'cb' | 'wonder';
export interface City {
  id: number; realm: number; name: string; hex: number; pop: number; grow: number; founded: number;
  cbs: CbId[]; building: { kind?: BuildKind; id: string; left: number } | null; queue: { kind: BuildKind; id: string }[];
  market: number[]; hp: number; capital: boolean; radius: number; wonders: WonderId[];
}
export interface Unit { id: number; realm: number; type: UnitId; hex: number; path: number[]; hp: number; vet: number; task: 'none' | 'found' | 'explore' | 'fortify'; camp?: number }
export interface Imp { id: number; realm: number; hex: number; type: ImpId; level: number; left: number; eff: number; status: string; out: number; pillaged?: number }
export interface Route {
  id: number; realm: number; from: number; to: number; sea: boolean; path: number[]; vehicle: string;
  pos: number; cargo: { good: number; qty: number } | null; income: number; trips: number; pref?: number | null;
}
export interface Camp { id: number; hex: number; str: number; hp: number; timer: number }
export interface LogEntry { turn: number; text: string; kind: 'info' | 'trade' | 'war' | 'build' | 'tech' | 'warn' | 'news'; realm?: number }
export interface TradeRec { turn: number; good: number; price: number; qty: number; buyer: number; seller: number }
export interface ChatMsg { turn: number; realm: number; text: string; at: number }

export interface GameState {
  version: 4;
  seed: number; roomName: string; mode: 'local' | 'public' | 'coop'; maxPlayers: number;
  turn: number;
  own: Record<number, number>;
  realms: Realm[]; cities: City[]; units: Unit[]; imps: Imp[]; routes: Route[]; camps: Camp[];
  orders: Order[]; trades: TradeRec[]; history: number[][]; log: LogEntry[];
  wonders: Partial<Record<WonderId, { realm: number; city: number; turn: number }>>;
  chat: ChatMsg[];
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

/** Eski kayıtları (v3) güncel yapıya taşır. */
export function migrate(s: GameState): GameState {
  const x = s as unknown as { version: number };
  if (x.version >= 4 && s.chat) return s;
  s.wonders ??= {}; s.chat ??= [];
  for (const R of s.realms) {
    R.rel ??= {}; R.allies ??= []; R.pacts ??= []; R.allyOff ??= []; R.pactOff ??= [];
    R.auto ??= { build: false, imps: false, routes: false, army: false }; R.quest ??= 0; R.qdone ??= [];
  }
  for (const c of s.cities) { c.queue ??= []; c.wonders ??= []; if (c.building && !c.building.kind) c.building.kind = 'cb'; }
  for (const c of s.camps) c.timer ??= 0;
  x.version = 4;
  return s;
}

export const hasTech = (r: Realm, t: TechId | null) => !t || r.techs.includes(t);
export function atWar(s: GameState, a: number, b: number) {
  if (a === b) return false;
  if (a === BARB || b === BARB) return a >= BARB && b >= BARB;
  return a >= 0 && b >= 0 && !!s.realms[a]?.wars.includes(b);
}
export const ownerOf = (s: GameState, hex: number) => s.own[hex] ?? -1;
export const cityAt = (s: GameState, hex: number) => s.cities.find((c) => c.hex === hex);
export const realmCities = (s: GameState, r: number) => s.cities.filter((c) => c.realm === r);
export const capitalOf = (s: GameState, r: number) => s.cities.find((c) => c.realm === r && c.capital) ?? s.cities.find((c) => c.realm === r);
export const popCap = (r: Realm) => 4 + r.era * 3 + (r.techs.includes('insaat') ? 1 : 0);
const cityRadius = (pop: number) => 1 + (pop >= 5 ? 1 : 0) + (pop >= 12 ? 1 : 0);
export const buildInfo = (b: { kind?: BuildKind; id: string }) => ((b.kind ?? 'cb') === 'cb' ? CB[b.id as CbId] : WONDER[b.id as WonderId]);
export const relOf = (s: GameState, a: number, b: number) => Math.round(s.realms[a]?.rel[b] ?? 0);

/** Krallığın sahip olduğu harikaların toplam etkisi. */
export function wonderFx(s: GameState, r: number): Required<WonderFx> {
  const fx: Required<WonderFx> = { build: 1, growth: 1, science: 1, defense: 1, happy: 0, route: 1, routeSlot: 0, prod: 1, gold: 1, seaSpeed: 1, noBarb: 0 };
  for (const c of s.cities) if (c.realm === r) for (const w of c.wonders ?? []) {
    const f = WONDER[w].fx;
    for (const k of ['build', 'growth', 'science', 'defense', 'route', 'prod', 'gold', 'seaSpeed'] as const) if (f[k]) fx[k] *= f[k]!;
    if (f.happy) fx.happy += f.happy;
    if (f.routeSlot) fx.routeSlot += f.routeSlot;
    if (f.noBarb) fx.noBarb = 1;
  }
  return fx;
}

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
  return 1 + Math.floor(R.era / 2) + realmCities(s, r).reduce((a, c) => a + (c.cbs.includes('market') ? 1 : 0) + (c.cbs.includes('caravanserai') ? 1 : 0), 0)
    + (R.techs.includes('internet') ? 1 : 0) + wonderFx(s, r).routeSlot;
}

// ---------- yeni oyun ----------
export interface NewGameOpts { seed?: number; roomName?: string; mode?: GameState['mode']; bots?: number; player?: { name: string; culture: number; user?: string } }

export function newGame(opts: NewGameOpts = {}): GameState {
  const seed = opts.seed ?? ((Math.random() * 1e9) >>> 0);
  getMap(seed);
  const s: GameState = {
    version: 4, seed, roomName: opts.roomName ?? 'Yerel dünya', mode: opts.mode ?? 'local', maxPlayers: C.MAX_PLAYERS,
    turn: 0, own: {}, realms: [], cities: [], units: [], imps: [], routes: [], camps: [],
    orders: [], trades: [], history: GOODS.map((g) => [g.price]), log: [], wonders: {}, chat: [], ended: null,
    nextId: 1, rng: seed ^ 0x9e3779b9, seq: 0,
  };
  if (opts.player) addRealm(s, { ...opts.player, kind: 'player' });
  const used = new Set(s.realms.map((r) => r.culture));
  const free = CULTURES.map((c) => c.id).filter((c) => !used.has(c)).sort(() => rand(s) - 0.5);
  for (let k = 0; k < (opts.bots ?? 7); k++) {
    const cu = free[k % free.length];
    addRealm(s, { name: CULTURES[cu].name, culture: cu, kind: 'bot' });
  }
  spawnCamps(s, 6 + Math.round(s.realms.length * 0.8));
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
      && ownerOf(s, i) < 0 && taken.every((t) => hexDist(map, t, i) >= 7) && !s.camps.some((c) => hexDist(map, c.hex, i) < 5);
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
    hist: { gold: [], score: [], pop: [], sci: [] }, wars: [], peace: [],
    rel: {}, allies: [], pacts: [], allyOff: [], pactOff: [],
    auto: { build: false, imps: false, routes: false, army: false }, quest: 0, qdone: [], score: 0, named: 0,
  };
  R.inv[G.food] = 30; R.inv[G.wood] = 12;
  s.realms.push(R);
  for (const t of ['settler', 'scout', 'warrior'] as UnitId[]) {
    s.units.push({ id: nid(s), realm: id, type: t, hex: t === 'settler' ? hex : map.hexes[hex].nb.find((j) => map.hexes[j].land) ?? hex, path: [], hp: 100, vet: 1, task: t === 'scout' ? 'explore' : 'none' });
  }
  if (o.kind === 'player') log(s, `${o.name} (${cu.adj} kabilesi) tarih sahnesine çıktı.`, 'news');
  return id;
}

// ---------- haydutlar (Civ tarzı) ----------
export const avgEra = (s: GameState) => { const a = s.realms.filter((r) => r.alive); return a.length ? Math.round(a.reduce((t, r) => t + r.era, 0) / a.length) : 0; };
const BARB_UNITS: UnitId[] = ['warrior', 'archer', 'swordsman', 'knight', 'musketeer', 'infantry', 'tank', 'mech', 'robotarmy'];
export const campStr = (s: GameState) => 6 + avgEra(s) * 12;

function spawnCamps(s: GameState, n: number) {
  const map = getMap(s.seed);
  const seen = new Set<number>();
  for (const R of s.realms) if (R.alive) for (const i of visibleSet(s, R.id)) seen.add(i);
  const walled = s.realms.filter((R) => R.alive && wonderFx(s, R.id).noBarb).flatMap((R) => realmCities(s, R.id).map((c) => c.hex));
  const land = map.hexes.filter((h) => h.land && h.terrain !== 'snow');
  for (let k = 0; k < n * 6 && n > 0; k++) {
    const h = land[Math.floor(rand(s) * land.length)];
    if (ownerOf(s, h.i) >= 0 || seen.has(h.i)) continue; // Civ: kamplar yalnız sisli yerlerde doğar
    if (s.cities.some((c) => hexDist(map, c.hex, h.i) < 5) || s.units.some((u) => u.realm >= 0 && hexDist(map, u.hex, h.i) < 4)) continue;
    if (s.camps.some((c) => hexDist(map, c.hex, h.i) < 7)) continue;
    if (walled.some((w) => hexDist(map, w, h.i) < 8)) continue;
    s.camps.push({ id: nid(s), hex: h.i, str: campStr(s), hp: 100, timer: 0 });
    n--;
  }
}

function barbTick(s: GameState) {
  const map = getMap(s.seed);
  const cap = Math.min(30, 6 + Math.round(s.realms.filter((r) => r.alive).length * 1.5));
  if (s.turn % 5 === 0 && s.camps.length < cap) spawnCamps(s, 1);
  const era = avgEra(s);
  for (const camp of s.camps) {
    camp.hp = Math.min(100, camp.hp + 8);
    camp.str = Math.max(camp.str, campStr(s));
    camp.timer++;
    const near = s.cities.some((c) => hexDist(map, c.hex, camp.hex) <= 10);
    const mine = s.units.filter((u) => u.realm === BARB && u.camp === camp.id).length;
    const maxU = 1 + Math.min(2, Math.floor(era / 3));
    if (camp.timer >= (near ? 10 : 16) && mine < maxU) {
      camp.timer = 0;
      // haydutlar en yakın uygarlığın çağına ayak uydurur (geride kalan oyuncu ezilmez)
      const nc = s.cities.filter((c) => hexDist(map, c.hex, camp.hex) <= 14).sort((a, b) => hexDist(map, a.hex, camp.hex) - hexDist(map, b.hex, camp.hex))[0];
      const localEra = nc ? Math.min(era, s.realms[nc.realm]?.era ?? era) : era;
      const type = BARB_UNITS[Math.min(BARB_UNITS.length - 1, localEra)];
      s.units.push({ id: nid(s), realm: BARB, type, hex: camp.hex, path: [], hp: 100, vet: 0.9, task: 'none', camp: camp.id });
    }
  }
  // kampı yok olan birlikler dağılır
  s.units = s.units.filter((u) => u.realm !== BARB || s.camps.some((c) => c.id === u.camp));
}

/** Haydut biriminin hedefi: yağmalanacak yapı, zayıf birlik ya da yakındaki şehir. */
function barbPlan(s: GameState, u: Unit) {
  const map = getMap(s.seed);
  const camp = s.camps.find((c) => c.id === u.camp);
  if (!camp) return;
  if (u.hp < 40) { const p = unitPath(s, u, camp.hex); if (p) u.path = p; return; }
  let best = -1, bv = -Infinity;
  const consider = (hex: number, v: number) => {
    const d = hexDist(map, u.hex, hex);
    if (d > 8 || hexDist(map, camp.hex, hex) > 11) return;
    const score = v - d * 1.2;
    if (score > bv) { bv = score; best = hex; }
  };
  for (const im of s.imps) if (!im.pillaged && im.left === 0) consider(im.hex, 6);
  for (const x of s.units) if (x.realm !== BARB && (UNIT[x.type].civil || unitStr(s, x) < unitStr(s, u))) consider(x.hex, 8);
  for (const c of s.cities) consider(c.hex, cityStr(s, c) < unitStr(s, u) * 1.5 ? 5 : -2);
  if (best < 0) {
    if (u.hex !== camp.hex && rand(s) < 0.3) { const p = unitPath(s, u, camp.hex); if (p) u.path = p; }
    return;
  }
  const p = unitPath(s, u, best);
  if (p) u.path = p.slice(0, 10);
}

function pillage(s: GameState, u: Unit, hex: number) {
  const im = s.imps.find((b) => b.hex === hex && b.realm !== u.realm && !b.pillaged && b.left === 0);
  if (!im || (u.realm !== BARB && !atWar(s, u.realm, im.realm))) return;
  const R = s.realms[im.realm];
  im.pillaged = 5; im.status = 'Yağmalandı';
  const era = avgEra(s);
  const loot = Math.min(Math.max(0, R.gold) * 0.1, 4 * (era + 1));
  R.gold -= loot;
  log(s, `${u.realm === BARB ? 'Haydutlar' : s.realms[u.realm].name} ${IMP[im.type].name} yapını yağmaladı${loot ? ` (−${fmt(loot)} altın)` : ''}. Onarım 5 tur.`, 'warn', im.realm);
}

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
    id: nid(s), realm: u.realm, name, hex: u.hex, pop: first ? 2 : 1, grow: 0, founded: s.turn, cbs: [], building: null, queue: [],
    market: [], hp: 100, capital: first, radius: 1, wonders: [],
  };
  c.market = cityMarket(s, c).target.map((t) => t * 0.8);
  s.cities.push(c);
  claim(s, c);
  s.units = s.units.filter((x) => x.id !== u.id);
  log(s, first ? `${R.name}, göçebeliği bırakıp ${name} şehrini kurdu.` : `${R.name} yeni bir şehir kurdu: ${name}.`, first ? 'news' : 'build', first ? undefined : u.realm);
  return null;
}

// ---------- yapılar ----------
export const buildCostMult = (s: GameState, r: number) => T(s.realms[r].culture, 'build') * (s.realms[r].techs.includes('insaat') ? 0.9 : 1) * wonderFx(s, r).build;
const scaled = (gold: number, mat: Partial<Record<GoodId, number>>, m: number) =>
  ({ gold: Math.round(gold * m), mat: Object.fromEntries(Object.entries(mat).map(([g, q]) => [g, Math.ceil((q as number) * m)])) as Partial<Record<GoodId, number>> });
export const impCost = (s: GameState, r: number, type: ImpId) => scaled(IMP[type].gold, IMP[type].mat, buildCostMult(s, r));
export const upgradeCost = (s: GameState, im: Imp) => scaled(IMP[im.type].gold, IMP[im.type].mat, buildCostMult(s, im.realm) * (1 + im.level * 0.8));
export const cbCost = (s: GameState, r: number, id: CbId) => scaled(CB[id].gold, CB[id].mat, buildCostMult(s, r));
export const wonderCost = (s: GameState, r: number, id: WonderId) => scaled(WONDER[id].gold, WONDER[id].mat, buildCostMult(s, r));
const hasMat = (R: Realm, mat: Partial<Record<GoodId, number>>) => Object.entries(mat).every(([g, q]) => R.inv[G[g as GoodId]] >= (q as number) - 1e-9);
const payMat = (R: Realm, mat: Partial<Record<GoodId, number>>) => { for (const [g, q] of Object.entries(mat)) R.inv[G[g as GoodId]] -= q as number; };
export const matText = (mat: Partial<Record<GoodId, number>>) => Object.entries(mat).map(([g, q]) => `${q} ${GOODS[G[g as GoodId]].name}`).join(', ');

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
/** Şehir yapısı kurulabilir mi? (inşaat sürüyorsa kuyruğa eklenebilir) */
export function canCityBuild(s: GameState, r: number, city: City, id: CbId, forQueue = false): string | null {
  const map = getMap(s.seed);
  const R = s.realms[r], d = CB[id];
  if (city.realm !== r) return 'Senin şehrin değil';
  if (!hasTech(R, d.tech)) return `${TECH[d.tech!].name} araştırılmalı`;
  if (city.cbs.includes(id) || city.building?.id === id || city.queue.some((q) => q.id === id)) return 'Zaten var ya da sırada';
  if (d.coast && !map.hexes[city.hex].coast) return 'Kıyı şehri gerekir';
  if (forQueue) return city.queue.length >= 5 ? 'Kuyruk dolu (5)' : null;
  const c = cbCost(s, r, id);
  if (R.gold < c.gold) return `${c.gold} altın gerekir`;
  if (!hasMat(R, c.mat)) return `Malzeme: ${matText(c.mat)}`;
  return null;
}
export function canWonder(s: GameState, r: number, city: City, id: WonderId, forQueue = false): string | null {
  const R = s.realms[r], d = WONDER[id];
  if (city.realm !== r) return 'Senin şehrin değil';
  if (!hasTech(R, d.tech)) return `${TECH[d.tech].name} araştırılmalı`;
  if (s.wonders[id]) return `${s.realms[s.wonders[id]!.realm]?.name ?? 'Biri'} bunu zaten yaptı`;
  if (s.cities.some((c) => c.realm === r && (c.building?.id === id || c.queue.some((q) => q.id === id)))) return 'Zaten yapılıyor ya da sırada';
  if (forQueue) return city.queue.length >= 5 ? 'Kuyruk dolu (5)' : null;
  const c = wonderCost(s, r, id);
  if (R.gold < c.gold) return `${c.gold} altın gerekir`;
  if (!hasMat(R, c.mat)) return `Malzeme: ${matText(c.mat)}`;
  return null;
}
export function canTrain(s: GameState, r: number, city: City, type: UnitId): string | null {
  const R = s.realms[r], d = UNIT[type];
  if (city.realm !== r) return 'Senin şehrin değil';
  if (!hasTech(R, d.tech)) return `${TECH[d.tech!].name} araştırılmalı`;
  if (type === 'settler' && city.pop < 2) return 'Şehir nüfusu en az 2 olmalı';
  if (type === 'settler' && !hasTech(R, 'tarim') && s.cities.some((c) => c.realm === r)) return 'Tarım araştırılmalı';
  if (R.gold < d.gold) return `${d.gold} altın gerekir`;
  if (!hasMat(R, d.cost)) return `Gerekli: ${matText(d.cost)}`;
  return null;
}
function startBuild(s: GameState, c: City, kind: BuildKind, id: string): string | null {
  const R = s.realms[c.realm];
  if (kind === 'cb') {
    const err = canCityBuild(s, c.realm, c, id as CbId); if (err) return err;
    const k = cbCost(s, c.realm, id as CbId); R.gold -= k.gold; payMat(R, k.mat); R.ledger.build += k.gold;
    c.building = { kind, id, left: CB[id as CbId].turns };
  } else {
    const err = canWonder(s, c.realm, c, id as WonderId); if (err) return err;
    const k = wonderCost(s, c.realm, id as WonderId); R.gold -= k.gold; payMat(R, k.mat); R.ledger.build += k.gold;
    c.building = { kind, id, left: WONDER[id as WonderId].turns };
  }
  return null;
}

// ---------- ticaret yolu ----------
export function routePath(s: GameState, from: City, to: City): { sea: boolean; path: number[] } | null {
  const map = getMap(s.seed);
  const land = astar(map, from.hex, to.hex, (h) => (h.land ? (h.river ? 0.7 : h.terrain === 'mountain' ? 3 : h.terrain === 'hills' || h.feature ? 1.6 : 1) : Infinity), 5000);
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
const defBonus = (s: GameState, hex: number) => { const h = getMap(s.seed).hexes[hex]; return h.terrain === 'hills' ? 1.25 : h.feature ? 1.2 : h.terrain === 'mountain' ? 1.4 : h.river ? 1.1 : 1; };
export function unitStr(s: GameState, u: Unit) {
  const d = UNIT[u.type];
  const cult = u.realm >= 0 ? T(s.realms[u.realm]?.culture ?? 0, 'military') : 1;
  return d.str * u.vet * cult * (0.55 + 0.45 * u.hp / 100);
}
export function cityStr(s: GameState, c: City) {
  const R = s.realms[c.realm];
  const garrison = s.units.filter((u) => u.hex === c.hex && u.realm === c.realm && !UNIT[u.type].civil);
  const g = garrison.reduce((m, u) => Math.max(m, unitStr(s, u)), 0);
  return (8 + c.pop * 1.5 + R.era * 9 + (c.cbs.includes('walls') ? 15 + R.era * 4 : 0) + g * 0.6) * (0.5 + 0.5 * c.hp / 100) * wonderFx(s, c.realm).defense;
}
function dmg(s: GameState, a: number, d: number) { return 30 * Math.exp((a - d) / 25) * (0.8 + rand(s) * 0.4); }
const realmName = (s: GameState, r: number) => (r === BARB ? 'Haydutlar' : s.realms[r]?.name ?? '?');
const kill = (s: GameState, u: Unit) => { s.units = s.units.filter((x) => x.id !== u.id); };

function campCleared(s: GameState, camp: { id: number; hex: number }, by: number) {
  s.camps = s.camps.filter((c) => c.id !== camp.id);
  s.units = s.units.filter((u) => !(u.realm === BARB && u.camp === camp.id));
  if (by < 0) return;
  const R = s.realms[by];
  const loot = 30 * (avgEra(s) + 1);
  R.gold += loot; R.ledger.other += loot;
  log(s, `${R.name} bir haydut kampını dağıttı (+${loot} altın).`, 'war', by);
}

/** Yakın dövüş. true: saldıran hedef hex'e girebilir. */
function attack(s: GameState, u: Unit, hex: number): boolean {
  const camp = s.camps.find((c) => c.hex === hex);
  if (camp && u.realm !== BARB) {
    const defenders = s.units.filter((x) => x.hex === hex && x.realm === BARB);
    if (defenders.length) return fight(s, u, defenders[0], hex);
    const A = unitStr(s, u), D = camp.str * defBonus(s, hex) * (0.55 + 0.45 * camp.hp / 100);
    camp.hp -= dmg(s, A, D); u.hp -= dmg(s, D, A);
    if (u.hp <= 0) { kill(s, u); log(s, `${UNIT[u.type].name} birliğin haydutlara yenildi.`, 'war', u.realm); return false; }
    if (camp.hp <= 0) { campCleared(s, camp, u.realm); return true; }
    return false;
  }
  const city = cityAt(s, hex);
  const enemies = s.units.filter((x) => x.hex === hex && atWar(s, u.realm, x.realm) && !UNIT[x.type].civil);
  if (enemies.length) return fight(s, u, enemies.reduce((b, x) => (unitStr(s, x) > unitStr(s, b) ? x : b)), hex);
  if (city && atWar(s, u.realm, city.realm)) {
    const A = unitStr(s, u) * (u.type === 'artillery' ? 1.6 : 1), D = cityStr(s, city);
    city.hp -= dmg(s, A, D); u.hp -= dmg(s, D, A) * 0.8;
    if (u.hp <= 0) { kill(s, u); log(s, `${city.name} surları önünde ${realmName(s, u.realm)} birliği düştü.`, 'war', city.realm); return false; }
    if (city.hp <= 0) {
      if (u.realm === BARB) { sack(s, city, u); return false; }
      capture(s, city, u.realm); return true;
    }
    return false;
  }
  const civ = s.units.filter((x) => x.hex === hex && atWar(s, u.realm, x.realm));
  if (civ.length) { s.units = s.units.filter((x) => !civ.includes(x)); log(s, `${realmName(s, u.realm)} ${civ.map((c) => UNIT[c.type].name).join(', ')} birliğini dağıttı.`, 'war', civ[0].realm >= 0 ? civ[0].realm : undefined); }
  return true;
}

function fight(s: GameState, u: Unit, tgt: Unit, hex: number): boolean {
  const city = cityAt(s, hex);
  const A = unitStr(s, u), D = unitStr(s, tgt) * defBonus(s, hex) * (city ? 1.2 : 1) * (tgt.task === 'fortify' ? 1.15 : 1);
  tgt.hp -= dmg(s, A, D); u.hp -= dmg(s, D, A);
  if (tgt.hp <= 0) { kill(s, tgt); log(s, `${realmName(s, tgt.realm)} ${UNIT[tgt.type].name} birliğini kaybetti.`, 'war', tgt.realm >= 0 ? tgt.realm : u.realm >= 0 ? u.realm : undefined); }
  if (u.hp <= 0) { kill(s, u); log(s, `${realmName(s, u.realm)} ${UNIT[u.type].name} birliğini kaybetti.`, 'war', u.realm >= 0 ? u.realm : tgt.realm >= 0 ? tgt.realm : undefined); return false; }
  return tgt.hp <= 0 && !s.units.some((x) => x.hex === hex && atWar(s, u.realm, x.realm));
}

/** Menzilli saldırı (okçu, topçu, şehir): karşılık yok. */
function ranged(s: GameState, A: number, hex: number, by: number, label: string): boolean {
  const camp = s.camps.find((c) => c.hex === hex);
  const enemies = s.units.filter((x) => x.hex === hex && atWar(s, by, x.realm) && !UNIT[x.type].civil);
  if (enemies.length) {
    const t = enemies[0];
    t.hp -= dmg(s, A, unitStr(s, t) * defBonus(s, hex));
    if (t.hp <= 0) { kill(s, t); log(s, `${label} ${realmName(s, t.realm)} ${UNIT[t.type].name} birliğini yok etti.`, 'war', by >= 0 ? by : t.realm >= 0 ? t.realm : undefined); }
    return true;
  }
  if (camp && by !== BARB) {
    camp.hp -= dmg(s, A, camp.str * defBonus(s, hex));
    if (camp.hp <= 0 && by >= 0) campCleared(s, camp, by);
    return true;
  }
  const city = cityAt(s, hex);
  if (city && atWar(s, by, city.realm)) { city.hp = Math.max(1, city.hp - dmg(s, A, cityStr(s, city))); return true; }
  return false;
}

function sack(s: GameState, c: City, u: Unit) {
  const R = s.realms[c.realm];
  const loot = Math.min(Math.max(0, R.gold) * 0.25, 15 * (R.era + 1));
  R.gold -= loot; c.hp = 60;
  log(s, `☠ Haydutlar ${c.name}'i yağmaladı: −${fmt(loot)} altın. Surlar ve garnizon şehri korur.`, 'warn', c.realm);
  const camp = s.camps.find((x) => x.id === u.camp);
  if (camp) { const p = unitPath(s, u, camp.hex); if (p) u.path = p; }
}

function capture(s: GameState, c: City, by: number) {
  const map = getMap(s.seed);
  const old = c.realm;
  const oldR = s.realms[old], R = s.realms[by];
  c.realm = by; c.hp = 50; c.capital = false; c.pop = Math.max(1, c.pop - 1); c.building = null; c.queue = [];
  for (const i of within(map, c.hex, c.radius)) if (ownerOf(s, i) === old) s.own[i] = by;
  for (const im of s.imps) if (s.own[im.hex] === by && im.realm === old) im.realm = by;
  s.routes = s.routes.filter((r) => !(r.from === c.id && r.realm === old));
  s.units = s.units.filter((u) => !(u.hex === c.hex && u.realm === old));
  log(s, `⚔ ${R.name}, ${oldR.name} şehri ${c.name}'i ele geçirdi!${c.wonders.length ? ` ${c.wonders.map((w) => WONDER[w].name).join(', ')} artık onun.` : ''}`, 'news');
  for (const w of c.wonders) if (s.wonders[w]) s.wonders[w]!.realm = by;
  if (!s.cities.some((x) => x.realm === old)) {
    if (!s.units.some((u) => u.realm === old && u.type === 'settler')) {
      oldR.alive = false;
      s.units = s.units.filter((u) => u.realm !== old);
      s.routes = s.routes.filter((r) => r.realm !== old);
      for (const im of s.imps) if (im.realm === old) im.realm = by;
      log(s, `${oldR.name} tarih sahnesinden silindi.`, 'news');
      for (const r of s.realms) { r.wars = r.wars.filter((w) => w !== old); r.allies = r.allies.filter((w) => w !== old); r.pacts = r.pacts.filter((w) => w !== old); }
    }
  } else if (!s.cities.some((x) => x.realm === old && x.capital)) {
    const nc = s.cities.find((x) => x.realm === old); if (nc) nc.capital = true;
  }
}

// ---------- diplomasi ----------
const addRel = (s: GameState, a: number, b: number, d: number) => {
  for (const [x, y] of [[a, b], [b, a]]) { const R = s.realms[x]; if (R) R.rel[y] = Math.max(-100, Math.min(100, (R.rel[y] ?? 0) + d)); }
};
export function declareWar(s: GameState, r: number, target: number, why = '') {
  const R = s.realms[r], o = s.realms[target];
  if (!R || !o || atWar(s, r, target)) return;
  R.wars.push(target); o.wars.push(r);
  R.peace = R.peace.filter((x) => x !== target); o.peace = o.peace.filter((x) => x !== r);
  R.allies = R.allies.filter((x) => x !== target); o.allies = o.allies.filter((x) => x !== r);
  R.pacts = R.pacts.filter((x) => x !== target); o.pacts = o.pacts.filter((x) => x !== r);
  addRel(s, r, target, -60);
  s.routes = s.routes.filter((rt) => !((rt.realm === r && s.cities.find((c) => c.id === rt.to)?.realm === target) || (rt.realm === target && s.cities.find((c) => c.id === rt.to)?.realm === r)));
  log(s, `⚔ ${R.name}, ${o.name}'a savaş ilan etti!${why}`, 'news');
  // ittifak çağrısı: saldırıya uğrayanın müttefikleri saldırana savaş açar
  for (const a of o.allies) if (a !== r && s.realms[a]?.alive && !s.realms[a].allies.includes(r)) declareWar(s, a, r, ` (${o.name} ile ittifak gereği)`);
}
export function makePeace(s: GameState, a: number, b: number) {
  const A = s.realms[a], B = s.realms[b];
  A.wars = A.wars.filter((x) => x !== b); B.wars = B.wars.filter((x) => x !== a);
  A.peace = A.peace.filter((x) => x !== b); B.peace = B.peace.filter((x) => x !== a);
  addRel(s, a, b, 25);
  log(s, `🕊 ${A.name} ile ${B.name} barış yaptı.`, 'news');
}
export type Persona = 'savasci' | 'tuccar' | 'insaatci';
export function personaOf(R: Realm): Persona {
  const k = CULTURES[R.culture]?.key;
  return ['hitit', 'roma', 'turk', 'viking', 'japon'].includes(k) ? 'savasci' : ['pers', 'arap', 'mali', 'yunan'].includes(k) ? 'tuccar' : 'insaatci';
}
export function botWantsPeace(s: GameState, bot: number, other: number) {
  const pw = (r: number) => s.units.filter((u) => u.realm === r && !UNIT[u.type].civil).reduce((t, u) => t + unitStr(s, u), 0) + realmCities(s, r).length * 10;
  return pw(bot) < pw(other) * 1.1 || rand(s) < (personaOf(s.realms[bot]) === 'savasci' ? 0.08 : 0.2);
}
const botAccepts = (s: GameState, bot: number, other: number, need: number) => relOf(s, bot, other) >= need - (personaOf(s.realms[bot]) === 'tuccar' ? 10 : 0);

function diploTick(s: GameState) {
  if (s.turn % 3 !== 0) return;
  const map = getMap(s.seed);
  const alive = s.realms.filter((r) => r.alive);
  const routePairs = new Map<string, number>();
  for (const rt of s.routes) { const b = s.cities.find((c) => c.id === rt.to)?.realm; if (b !== undefined && b !== rt.realm) { const k = [rt.realm, b].sort().join('-'); routePairs.set(k, (routePairs.get(k) ?? 0) + 1); } }
  const caps = new Map(alive.map((R) => [R.id, capitalOf(s, R.id)?.hex]));
  for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
    const a = alive[i].id, b = alive[j].id;
    let d = 0;
    d += (routePairs.get([a, b].sort().join('-')) ?? 0) * 1.2;
    if (atWar(s, a, b)) d -= 1.5;
    if (alive[i].allies.includes(b)) d += 1;
    if (alive[i].pacts.includes(b)) d += 0.6;
    const ca = caps.get(a), cb = caps.get(b);
    if (ca !== undefined && cb !== undefined && hexDist(map, ca, cb) < 12) d -= 0.4; // sınır gerginliği
    const cur = alive[i].rel[b] ?? 0;
    addRel(s, a, b, d - cur * 0.02);
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
  | { t: 'wonder'; city: number; id: WonderId }
  | { t: 'unqueue'; city: number; index: number }
  | { t: 'train'; city: number; unit: UnitId }
  | { t: 'route'; from: number; to: number }
  | { t: 'cancelRoute'; route: number }
  | { t: 'routeGood'; route: number; good: number | null }
  | { t: 'sell'; city: number; good: number; qty: number }
  | { t: 'buy'; city: number; good: number; qty: number }
  | { t: 'order'; good: number; side: 'buy' | 'sell'; price: number; qty: number }
  | { t: 'cancel'; order: number }
  | { t: 'tax'; rate: number }
  | { t: 'war'; realm: number }
  | { t: 'peace'; realm: number }
  | { t: 'ally'; realm: number }
  | { t: 'pact'; realm: number }
  | { t: 'breakAlly'; realm: number }
  | { t: 'auto'; key: keyof Auto | 'all'; on: boolean }
  | { t: 'steward'; on: boolean }
  | { t: 'fund'; amount: number }
  | { t: 'chat'; text: string }
  | { t: 'mars'; city: number };
export type ActionResult = { ok: true; msg?: string } | { ok: false; err: string };
const ok = (msg?: string): ActionResult => ({ ok: true, msg });
const no = (err: string): ActionResult => ({ ok: false, err });

export function unitPath(s: GameState, u: Unit, to: number) {
  const map = getMap(s.seed);
  return astar(map, u.hex, to, (h, goal) => {
    const c = moveCost(h);
    if (!isFinite(c)) return c;
    if (!goal && u.realm !== BARB && s.camps.some((x) => x.hex === h.i)) return Infinity;
    return c;
  }, 6000);
}

function queueOrStart(s: GameState, c: City, kind: BuildKind, id: string, name: string): ActionResult {
  if (c.building) {
    const err = kind === 'cb' ? canCityBuild(s, c.realm, c, id as CbId, true) : canWonder(s, c.realm, c, id as WonderId, true);
    if (err) return no(err);
    c.queue.push({ kind, id });
    return ok(`${name} sıraya eklendi (${c.queue.length}. sırada)`);
  }
  const err = startBuild(s, c, kind, id);
  return err ? no(err) : ok(`${name} inşa ediliyor`);
}

export function applyAction(s: GameState, r: number, a: Action): ActionResult {
  const R = s.realms[r];
  if (!R || !R.alive) return no('Krallığın yok');
  if (s.ended && a.t !== 'chat') return no('Oyun bitti');
  const map = getMap(s.seed);
  const myUnit = (id: number) => s.units.find((u) => u.id === id && u.realm === r);
  const myCity = (id: number) => s.cities.find((c) => c.id === id && c.realm === r);
  switch (a.t) {
    case 'research': {
      const d = TECH[a.tech];
      if (!d) return no('Bilinmeyen teknoloji');
      if (R.techs.includes(a.tech)) return no('Zaten biliniyor');
      if (!d.req.every((q) => R.techs.includes(q))) return no(`Önce: ${d.req.filter((q) => !R.techs.includes(q)).map((q) => TECH[q].name).join(', ')}`);
      R.research = a.tech;
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
      const rng = UNIT[u.type].range;
      return ok(rng && hexDist(map, u.hex, a.to) <= rng ? 'Menzilde: bir sonraki turda ateş eder' : `${p.length} hex · ~${Math.ceil(p.reduce((t, i) => t + moveCost(map.hexes[i]), 0) / UNIT[u.type].moves)} tur`);
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
      kill(s, u);
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
      im.left = Math.ceil(IMP[im.type].turns / 2); im.level++; im.pillaged = 0;
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
      return queueOrStart(s, c, 'cb', a.cb, CB[a.cb].name);
    }
    case 'wonder': {
      const c = myCity(a.city);
      if (!c) return no('Şehir bulunamadı');
      return queueOrStart(s, c, 'wonder', a.id, WONDER[a.id].name);
    }
    case 'unqueue': {
      const c = myCity(a.city);
      if (!c) return no('Şehir bulunamadı');
      c.queue.splice(a.index, 1);
      return ok('Kuyruktan çıkarıldı');
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
      const rt: Route = { id: nid(s), realm: r, from: A.id, to: Bc.id, sea: p.sea, path: p.path, vehicle: '', pos: 0, cargo: null, income: 0, trips: 0, pref: null };
      rt.vehicle = bestVehicle(s, rt).id;
      loadCargo(s, rt);
      s.routes.push(rt);
      if (Bc.realm !== r) addRel(s, r, Bc.realm, 3);
      return ok(`${A.name} → ${Bc.name} ${p.sea ? 'deniz' : 'kara'} yolu açıldı (${p.path.length} hex)`);
    }
    case 'cancelRoute': {
      const rt = s.routes.find((x) => x.id === a.route && x.realm === r);
      if (!rt) return no('Yol bulunamadı');
      if (rt.cargo) R.inv[rt.cargo.good] += rt.cargo.qty;
      s.routes = s.routes.filter((x) => x.id !== rt.id);
      return ok('Ticaret yolu kapatıldı');
    }
    case 'routeGood': {
      const rt = s.routes.find((x) => x.id === a.route && x.realm === r);
      if (!rt) return no('Yol bulunamadı');
      rt.pref = a.good;
      return ok(a.good == null ? 'Yük: otomatik (en kârlı mal)' : `Yük: ${GOODS[a.good].name}`);
    }
    case 'sell': {
      const c = myCity(a.city);
      if (!c) return no('Yalnızca kendi şehirlerinin pazarında satabilirsin (diğerlerine ticaret yolu aç)');
      const q = Math.floor(Math.min(a.qty, R.inv[a.good]));
      if (q <= 0) return no('Stokta yok');
      const got = quoteSell(cityMarket(s, c), a.good, q, 0);
      c.market[a.good] += q; R.inv[a.good] -= q; R.gold += got; R.ledger.sales += got;
      return ok(`${q} ${GOODS[a.good].name} satıldı: +${fmt(got)} altın`);
    }
    case 'buy': {
      const c = myCity(a.city);
      if (!c) return no('Yalnızca kendi şehirlerinin pazarından alabilirsin');
      const q = Math.floor(a.qty);
      const cost = quoteBuy(cityMarket(s, c), a.good, q, 0);
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
        if (a.side === 'buy') buyer.gold += f.qty * (price - f.price);
        buyer.ledger.buy += val;
        addRel(s, f.buyer, f.seller, 0.5);
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
      declareWar(s, r, a.realm);
      return ok('Savaş ilan edildi');
    }
    case 'peace': {
      const o = s.realms[a.realm];
      if (!o || !atWar(s, r, a.realm)) return no('Savaşta değilsiniz');
      if (o.peace.includes(r) || (o.kind === 'bot' && botWantsPeace(s, a.realm, r))) { makePeace(s, r, a.realm); return ok('Barış imzalandı'); }
      if (!R.peace.includes(a.realm)) R.peace.push(a.realm);
      return ok(o.kind === 'bot' ? `${o.name} şimdilik barışa yanaşmıyor` : 'Barış teklifi gönderildi');
    }
    case 'ally': case 'pact': {
      const o = s.realms[a.realm];
      if (!o || !o.alive || a.realm === r) return no('Geçersiz hedef');
      if (atWar(s, r, a.realm)) return no('Önce barış yapmalısınız');
      const ally = a.t === 'ally';
      const list = ally ? R.allies : R.pacts;
      if (list.includes(a.realm)) return no('Zaten var');
      const need = ally ? 40 : 15;
      if (relOf(s, r, a.realm) < need) return no(`İlişki en az ${need} olmalı (şu an ${relOf(s, r, a.realm)}). Ticaret yolları ilişkiyi artırır.`);
      const offers = ally ? o.allyOff : o.pactOff;
      if (offers.includes(r) || (o.kind === 'bot' && botAccepts(s, a.realm, r, need + 5))) {
        (ally ? R.allies : R.pacts).push(a.realm); (ally ? o.allies : o.pacts).push(r);
        if (ally) { R.allyOff = R.allyOff.filter((x) => x !== a.realm); o.allyOff = o.allyOff.filter((x) => x !== r); }
        else { R.pactOff = R.pactOff.filter((x) => x !== a.realm); o.pactOff = o.pactOff.filter((x) => x !== r); }
        addRel(s, r, a.realm, 10);
        log(s, ally ? `🤝 ${R.name} ile ${o.name} ittifak kurdu.` : `📜 ${R.name} ile ${o.name} ticaret anlaşması imzaladı.`, 'news');
        return ok(ally ? 'İttifak kuruldu' : 'Ticaret anlaşması imzalandı');
      }
      const mine = ally ? R.allyOff : R.pactOff;
      if (!mine.includes(a.realm)) mine.push(a.realm);
      return ok(o.kind === 'bot' ? `${o.name} henüz hazır değil` : 'Teklif gönderildi');
    }
    case 'breakAlly': {
      R.allies = R.allies.filter((x) => x !== a.realm); s.realms[a.realm].allies = s.realms[a.realm].allies.filter((x) => x !== r);
      addRel(s, r, a.realm, -30);
      return ok('İttifak bozuldu');
    }
    case 'auto': {
      if (a.key === 'all') R.auto = { build: a.on, imps: a.on, routes: a.on, army: a.on };
      else R.auto[a.key] = a.on;
      return ok(a.on ? 'Vali devrede' : 'Vali kapandı');
    }
    case 'steward': R.steward = a.on; return ok(a.on ? 'Vekil açık' : 'Vekil kapalı');
    case 'fund': {
      const amt = Math.floor(Math.min(a.amount, R.gold));
      if (amt <= 0) return no('Altın yok');
      R.gold -= amt; R.science += amt * C.FUND_RATE; R.ledger.other += amt;
      return ok(`Akademiye ${amt} altın: +${fmt(amt * C.FUND_RATE)} bilim`);
    }
    case 'chat': {
      const text = String(a.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
      if (!text) return no('Boş mesaj');
      s.chat.push({ turn: s.turn, realm: r, text, at: Date.now() });
      if (s.chat.length > 60) s.chat.splice(0, s.chat.length - 60);
      return ok();
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

// ---------- ticaret yolu yükleme ----------
function loadCargo(s: GameState, rt: Route) {
  const R = s.realms[rt.realm];
  const A = s.cities.find((c) => c.id === rt.from), B = s.cities.find((c) => c.id === rt.to);
  if (!A || !B) return;
  const v = VEHICLES.find((x) => x.id === rt.vehicle)!;
  const ma = cityMarket(s, A), mb = cityMarket(s, B);
  const reserveOf = (g: number) => (g === G.food ? R.stats.foodNeed * 3 + 10 : 2);
  let best = -1;
  if (rt.pref != null && R.inv[rt.pref] - reserveOf(rt.pref) >= 1) best = rt.pref;
  else {
    let bm = 0;
    for (let g = 0; g < NG; g++) {
      if (R.inv[g] - reserveOf(g) < 1) continue;
      const margin = unitPrice(mb, g) * C.SELL_SPREAD - unitPrice(ma, g) * 0.8;
      if (margin > bm) { bm = margin; best = g; }
    }
  }
  if (best < 0) { rt.cargo = null; return; }
  const qty = Math.floor(Math.min(v.cap, R.inv[best] - reserveOf(best)));
  if (qty <= 0) { rt.cargo = null; return; }
  R.inv[best] -= qty;
  rt.cargo = { good: best, qty };
}

// ---------- tur ----------
export function tick(s: GameState, botHook?: (s: GameState) => void) {
  migrate(s);
  if (s.ended) return;
  const map = getMap(s.seed);
  for (const R of s.realms) { R.last = R.ledger; R.ledger = emptyLedger(); }
  const alive = s.realms.filter((R) => R.alive);
  const fx = new Map(alive.map((R) => [R.id, wonderFx(s, R.id)]));

  // 1) üretim
  const labor = new Map<number, number>(), need = new Map<number, number>();
  for (const R of alive) labor.set(R.id, laborOf(s, R.id) * (0.8 + 0.2 * R.stats.happy));
  for (const im of s.imps) if (im.left === 0 && !im.pillaged) need.set(im.realm, (need.get(im.realm) ?? 0) + IMP[im.type].workers * im.level);
  const prodBonus = new Map<number, number>();
  for (const R of alive) {
    let b = T(R.culture, 'prod') * fx.get(R.id)!.prod;
    if (R.techs.includes('lonca')) b *= 1.1;
    if (R.techs.includes('nukleer')) b *= 1.15;
    if (R.techs.includes('fuzyon')) b *= 1.25;
    b *= 1 + 0.03 * realmCities(s, R.id).filter((c) => c.cbs.includes('powerplant')).length;
    prodBonus.set(R.id, b);
  }
  const byOrder = [...s.imps].sort((a, b) => IMPS.findIndex((d) => d.id === a.type) - IMPS.findIndex((d) => d.id === b.type));
  for (const im of byOrder) {
    const R = s.realms[im.realm];
    if (!R?.alive) continue;
    if (im.left > 0) { im.left--; im.status = im.left > 0 ? `İnşaat: ${im.left} tur` : 'Hazır'; im.out = 0; continue; }
    if (im.pillaged) { im.pillaged--; im.status = im.pillaged ? `Yağmalandı: ${im.pillaged} tur` : 'Onarıldı'; im.out = 0; im.eff = 0; continue; }
    const d = IMP[im.type], h = map.hexes[im.hex];
    const laborEff = Math.min(1, (labor.get(R.id) ?? 0) / Math.max(1, need.get(R.id) ?? 1));
    let k = im.level * laborEff * (prodBonus.get(R.id) ?? 1);
    if (d.needs) k *= Math.min(1.3, 0.45 + h.res[d.needs.res]);
    if (im.type === 'farm' || im.type === 'fishery' || im.type === 'hunt') k *= T(R.culture, 'farm') * (h.river && im.type === 'farm' ? 1.25 : 1);
    if (im.type === 'pasture' && R.culture === 8) k *= 1.3;
    if (/mine|quarry|oilwell/.test(im.type)) k *= T(R.culture, 'mine');
    for (const [g, q] of Object.entries(d.inputs)) { const have = R.inv[G[g as GoodId]]; k = Math.min(k, have / (q as number)); }
    k = Math.max(0, k);
    for (const [g, q] of Object.entries(d.inputs)) R.inv[G[g as GoodId]] -= (q as number) * k;
    let val = 0;
    for (const [g, q] of Object.entries(d.outputs)) { const n = (q as number) * k; R.inv[G[g as GoodId]] += n; val += n * GOODS[G[g as GoodId]].price; }
    im.eff = im.level ? k / im.level : 0; im.out = val;
    im.status = laborEff < 0.99 ? 'İşçi yetersiz' : k < im.level * 0.5 && Object.keys(d.inputs).length ? 'Girdi yetersiz' : 'Çalışıyor';
  }

  // 2) şehirler: yiyecek, büyüme, bilim, vergi, yapılar
  for (const R of alive) {
    const cs = realmCities(s, R.id);
    const F = fx.get(R.id)!;
    let pop = 0, sci = 0, gold = 0;
    for (const c of cs) {
      pop += c.pop;
      R.inv[G.food] += 2 + R.era + (c.cbs.includes('harbor') ? 2 : 0) + (c.capital ? 1 : 0) + (map.hexes[c.hex].river ? 2 : 0);
      R.inv[G.wood] += 0.5;
      sci += 1 + c.pop * 0.5 + (c.cbs.includes('library') ? 3 : 0) + (c.cbs.includes('university') ? 7 : 0) + (c.cbs.includes('lab') ? 16 : 0);
      let g = c.pop * (0.12 + R.tax * 1.6) + (c.capital ? 2 : 0);
      if (c.cbs.includes('market')) g *= 1.2;
      if (c.cbs.includes('bank')) g *= 1.3;
      gold += g;
      if (c.building) {
        c.building.left--;
        if (c.building.left <= 0) {
          const b = c.building; c.building = null;
          if ((b.kind ?? 'cb') === 'cb') { c.cbs.push(b.id as CbId); log(s, `${c.name}: ${CB[b.id as CbId].name} tamamlandı.`, 'build', R.id); }
          else {
            const w = b.id as WonderId;
            if (s.wonders[w]) {
              const back = Math.round(wonderCost(s, R.id, w).gold * 0.5); R.gold += back;
              log(s, `${WONDER[w].name} yarışını ${s.realms[s.wonders[w]!.realm]?.name} kazandı. ${c.name} işçilerine ${back} altın geri ödendi.`, 'warn', R.id);
            } else {
              s.wonders[w] = { realm: R.id, city: c.id, turn: s.turn }; c.wonders.push(w);
              log(s, `🏛 ${R.name}, ${c.name}'de ${WONDER[w].name} harikasını tamamladı! ${WONDER[w].desc}`, 'news');
            }
          }
        }
      }
      if (!c.building && c.queue.length) {
        const q = c.queue[0];
        const err = q.kind === 'cb' ? canCityBuild(s, R.id, c, q.id as CbId) : canWonder(s, R.id, c, q.id as WonderId);
        if (!err) { c.queue.shift(); startBuild(s, c, q.kind, q.id); }
        else if (/zaten|yaptı|araştırılmalı/i.test(err)) c.queue.shift();
      }
      c.hp = Math.min(100, c.hp + 12);
    }
    sci *= T(R.culture, 'science') * F.science * (R.techs.includes('matematik') ? 1.1 : 1) * (R.techs.includes('felsefe') ? 1.1 : 1) * (R.techs.includes('yapayzeka') ? 1.25 : 1);
    gold *= T(R.culture, 'gold') * F.gold;
    const foodNeed = pop;
    R.inv[G.food] -= foodNeed;
    if (R.inv[G.food] < 0) {
      R.inv[G.food] = 0;
      const big = cs.filter((c) => c.pop > 1).sort((a, b) => b.pop - a.pop)[0];
      if (big && rand(s) < 0.5) { big.pop--; log(s, `${big.name}'de kıtlık: nüfus azaldı.`, 'warn', R.id); }
    }
    const lux = GOODS.map((g, i) => ({ g, i })).filter(({ g }) => g.luxury && g.era <= R.era);
    let met = 0;
    for (const { i } of lux) {
      const ok2 = cs.filter((c) => c.market[i] > cityMarket(s, c).target[i] * 0.3).length;
      met += cs.length ? ok2 / cs.length : 0;
    }
    R.stats.happy = Math.max(0.1, Math.min(1, 0.55 + F.happy + (lux.length ? 0.45 * met / lux.length : 0.25) - Math.max(0, R.tax - 0.2) * 1.5 - R.wars.length * 0.05));
    const cap = popCap(R);
    for (const c of cs) {
      if (c.pop >= cap) { c.grow = 0; continue; }
      if (R.inv[G.food] <= c.pop * 2) continue;
      c.grow += T(R.culture, 'growth') * F.growth * (c.cbs.includes('granary') ? 1.25 : 1) * (0.5 + R.stats.happy);
      const th = 3 + c.pop * 1.4;
      if (c.grow >= th && R.inv[G.food] >= c.pop * 3) {
        R.inv[G.food] -= c.pop * 3; c.grow = 0; c.pop++;
        const nr = Math.min(3, cityRadius(c.pop) + (R.techs.includes('felsefe') && c.pop >= 4 ? 1 : 0));
        if (nr > c.radius) { c.radius = nr; claim(s, c); }
      }
    }
    let upkeep = 0;
    for (const u of s.units) if (u.realm === R.id) upkeep += UNIT[u.type].upkeep;
    for (const im of s.imps) if (im.realm === R.id) upkeep += 0.15 * im.level * (1 + IMP[im.type].era * 0.25);
    for (const c of cs) upkeep += c.cbs.length * 0.4;
    upkeep *= T(R.culture, 'upkeep');
    R.gold += gold - upkeep;
    R.ledger.tax += gold; R.ledger.upkeep += upkeep;
    if (R.gold < -50) {
      const mil = s.units.filter((u) => u.realm === R.id && !UNIT[u.type].civil);
      if (mil.length) { kill(s, mil[0]); log(s, `Hazine boş: ${UNIT[mil[0].type].name} birliği dağıldı.`, 'warn', R.id); }
      R.gold = -50;
    }
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

  // 3) şehir pazarları
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
    rt.pos += v.speed * T(R.culture, v.sea ? 'seaSpeed' : 'landSpeed') * (v.sea ? fx.get(R.id)!.seaSpeed : 1);
    if (before < L && rt.pos >= L) {
      const pact = B.realm !== rt.realm && R.pacts.includes(B.realm) ? 1.25 : 1;
      let income = (1 + L * 0.08) * (1 + R.era * 0.2) * T(R.culture, 'route') * fx.get(R.id)!.route * pact * (A.cbs.includes('caravanserai') ? 1.2 : 1);
      if (rt.cargo) {
        income += quoteSell(cityMarket(s, B), rt.cargo.good, rt.cargo.qty, 0);
        B.market[rt.cargo.good] += rt.cargo.qty;
        rt.cargo = null;
      }
      if (B.realm !== rt.realm) {
        const o = s.realms[B.realm];
        const bonus = (1 + L * 0.06) * pact; o.gold += bonus; o.ledger.routes += bonus;
        R.science += 0.5 + L * 0.03;
      }
      R.gold += income; R.ledger.routes += income; rt.income = income; rt.trips++;
      const bits = bitsDecode(R.explored, map.hexes.length);
      for (const i of rt.path) bitSet(bits, i);
      R.explored = bitsEncode(bits);
    }
    if (rt.pos >= 2 * L) { rt.pos = 0; rt.vehicle = bestVehicle(s, rt).id; loadCargo(s, rt); }
  }

  // 5) birimler (oyuncular, botlar ve haydutlar)
  for (const u of [...s.units]) {
    if (!s.units.includes(u)) continue;
    const barb = u.realm === BARB;
    const R = barb ? null : s.realms[u.realm];
    if (barb && !u.path.length) barbPlan(s, u);
    if (!barb && u.task === 'explore' && !u.path.length) autoExplore(s, u);
    const d = UNIT[u.type];
    // menzilli saldırı: hedef menzildeyse yerinden ateş et
    if (d.range && u.path.length) {
      const t = u.path[u.path.length - 1];
      if (hexDist(map, u.hex, t) <= d.range && ranged(s, unitStr(s, u) * (u.type === 'artillery' && cityAt(s, t) ? 1.5 : 1), t, u.realm, `${realmName(s, u.realm)} ${d.name}`)) {
        if (!s.units.some((x) => x.hex === t && atWar(s, u.realm, x.realm)) && !s.camps.some((c) => c.hex === t) && !(cityAt(s, t) && atWar(s, u.realm, cityAt(s, t)!.realm))) u.path = [];
        continue;
      }
    }
    let mp = d.moves * (R ? T(R.culture, 'landSpeed') : 1);
    const moved = u.path.length > 0;
    while (u.path.length && mp > 0) {
      const nx = u.path[0];
      const c = moveCost(map.hexes[nx]);
      if (c > mp && mp < d.moves) break;
      const hostile = (!barb && s.camps.some((x) => x.hex === nx)) || s.units.some((x) => x.hex === nx && atWar(s, u.realm, x.realm))
        || (cityAt(s, nx) && atWar(s, u.realm, cityAt(s, nx)!.realm));
      if (hostile) {
        if (d.civil) { u.path = []; break; }
        const enter = attack(s, u, nx);
        if (!s.units.includes(u)) break;
        if (!enter) { mp = 0; if (barb) u.path = []; break; }
      }
      u.hex = nx; u.path.shift(); mp -= c;
      if (!d.civil) pillage(s, u, nx);
    }
    if (!s.units.includes(u)) continue;
    if (u.task === 'found' && !u.path.length && u.type === 'settler') {
      const err = foundCity(s, u);
      if (err) { u.task = 'none'; log(s, `Göçmenler şehir kuramadı: ${err}`, 'warn', u.realm); }
    }
    if (!moved) u.hp = Math.min(100, u.hp + (barb ? (s.camps.some((c) => c.hex === u.hex) ? 20 : 5) : ownerOf(s, u.hex) === u.realm ? 15 : 8));
  }
  // şehirler kendini savunur: yakındaki düşmana ok/top atar (sen yokken de)
  for (const c of s.cities) {
    const R = s.realms[c.realm]; if (!R?.alive) continue;
    const rng = c.cbs.includes('walls') || R.era >= 1 ? 2 : 1;
    const tgt = s.units.find((u) => atWar(s, c.realm, u.realm) && hexDist(map, u.hex, c.hex) <= rng);
    if (tgt) ranged(s, cityStr(s, c) * (c.cbs.includes('walls') ? 1.1 : 0.9), tgt.hex, c.realm, `${c.name} savunması`);
  }
  for (const R of alive) {
    const bits = bitsDecode(R.explored, map.hexes.length);
    for (const c of s.cities) if (c.realm === R.id) reveal(map, bits, c.hex, C.CITY_SIGHT);
    for (const u of s.units) if (u.realm === R.id) reveal(map, bits, u.hex, UNIT[u.type].sight);
    R.explored = bitsEncode(bits);
  }

  // 6) haydutlar ve diplomasi
  barbTick(s);
  diploTick(s);

  // 7) botlar, valiler, görevler
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
      + s.imps.filter((i) => i.realm === R.id).reduce((t, i) => t + i.level, 0) + cs.reduce((t, c) => t + c.wonders.length, 0) * 40);
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

export { WONDERS, yearOfTurn };
