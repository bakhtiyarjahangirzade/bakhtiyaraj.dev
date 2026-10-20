// Yapay zekâ kabileleri (kişilikli: savaşçı, tüccar, inşaatçı) ve oyuncular için Vali (idle otomasyon).
// Vali: inşaat kuyruğu, yapı kurma/yükseltme, ticaret yolları, savunma ve haydut temizliği.
import { CBS, G, GOODS, IMP, NG, UNIT, UNITS, WONDERS, type CbId, type ImpId, type UnitId } from './defs.ts';
import { hexDist, within } from './hexgrid.ts';
import { checkQuests } from './quests.ts';
import {
  applyAction, atWar, BARB, canBuildImp, canCityBuild, canFound, canRoute, canTrain, canWonder, cityMarket, getMap, personaOf,
  priceAt, rand, realmCities, relOf, routeSlots, unitStr, type GameState, type Realm,
} from './sim.ts';

const CHAIN: ImpId[] = [
  'lumber', 'quarry', 'pasture', 'claypit', 'kiln', 'weaver', 'coppermine', 'bronzeworks', 'ironmine', 'smithy', 'armory',
  'sawmill', 'toolmaker', 'papermill', 'coalmine', 'sugarfarm', 'cottonfarm', 'powdermill', 'steelmill', 'machineworks', 'railworks',
  'textile', 'oilwell', 'refinery', 'chemplant', 'carfactory', 'electronics', 'robotics',
];
const CITY_ORDER: CbId[] = ['granary', 'library', 'market', 'harbor', 'walls', 'barracks', 'caravanserai', 'university', 'bank', 'station', 'powerplant', 'lab', 'spaceport'];

const foodProd = (s: GameState, r: number) => s.imps.filter((i) => i.realm === r && i.left === 0)
  .reduce((t, i) => t + (IMP[i.type].outputs.food ?? 0) * i.level * Math.max(0.3, i.eff), 0) + realmCities(s, r).length * 2;

function siteScore(s: GameState, hex: number) {
  const map = getMap(s.seed);
  let v = map.hexes[hex].coast ? 1.2 : 0;
  if (map.hexes[hex].river) v += 1.5;
  for (const i of within(map, hex, 2)) {
    const h = map.hexes[i]; if (!h.land) { v += 0.15; continue; }
    v += h.res.fertility + h.res.forest * 0.4 + h.res.stone * 0.3 + h.res.copper * 0.3 + h.res.ore * 0.3 + h.res.pasture * 0.3;
  }
  return v;
}

function settle(s: GameState, R: Realm) {
  const map = getMap(s.seed);
  for (const u of s.units.filter((x) => x.realm === R.id && x.type === 'settler' && x.task !== 'found')) {
    const first = !s.cities.some((c) => c.realm === R.id);
    if (first && !canFound(s, R.id, u.hex) && siteScore(s, u.hex) > 6) { applyAction(s, R.id, { t: 'found', unit: u.id }); continue; }
    let best = -1, bv = -1;
    for (const i of within(map, u.hex, first ? 3 : 9)) {
      if (canFound(s, R.id, i)) continue;
      if (s.camps.some((c) => hexDist(map, c.hex, i) < 3)) continue;
      const v = siteScore(s, i) - hexDist(map, u.hex, i) * 0.35;
      if (v > bv) { bv = v; best = i; }
    }
    if (best < 0) { u.task = 'explore'; continue; }
    if (best === u.hex) applyAction(s, R.id, { t: 'found', unit: u.id });
    else { const r = applyAction(s, R.id, { t: 'move', unit: u.id, to: best }); u.task = r.ok ? 'found' : 'explore'; }
  }
}

function bestHex(s: GameState, R: Realm, type: ImpId) {
  const d = IMP[type];
  let best = -1, bv = -1;
  for (const [k, v] of Object.entries(s.own)) {
    if (v !== R.id) continue;
    const i = +k;
    if (canBuildImp(s, R.id, i, type)) continue;
    const h = getMap(s.seed).hexes[i];
    const sc = (d.needs ? h.res[d.needs.res] : 0.5) + (type === 'farm' && h.river ? 0.4 : 0) + rand(s) * 0.05;
    if (sc > bv) { bv = sc; best = i; }
  }
  return best;
}

/** Boş işgücüne yapı kur, iyi çalışanları yükselt. */
function improve(s: GameState, R: Realm, reserve = 0) {
  const free = R.stats.labor - R.stats.laborNeed;
  const cities = realmCities(s, R.id);
  if (!cities.length) return;
  if (free >= 0.8 && R.gold > reserve) {
    const fp = foodProd(s, R.id);
    let want: ImpId[] = [];
    if (fp < R.stats.foodNeed + 2 + cities.length) want = ['farm', 'fishery', 'hunt'];
    else {
      for (const t of CHAIN) {
        const n = s.imps.filter((i) => i.realm === R.id && i.type === t).length;
        if (n < 1 + Math.floor(cities.length / 3) && (!IMP[t].tech || R.techs.includes(IMP[t].tech!))) want.push(t);
      }
      want.push('farm');
    }
    for (const t of want.slice(0, 6)) {
      const h = bestHex(s, R, t);
      if (h >= 0) { applyAction(s, R.id, { t: 'build', hex: h, type: t }); break; }
    }
  }
  const lim = Math.max(reserve, 200 + R.era * 150);
  if (R.gold > lim) {
    const ims = s.imps.filter((i) => i.realm === R.id && i.left === 0 && i.level < 5 && i.status === 'Çalışıyor').sort((a, b) => b.out - a.out);
    for (const im of ims.slice(0, 3)) if (R.gold > lim) applyAction(s, R.id, { t: 'upgrade', imp: im.id });
  }
}

/** Şehir inşaatları: kuyruk boşsa sıradaki faydalı yapı; kişiliğe göre harika. */
function cityWorks(s: GameState, R: Realm, reserve = 0) {
  const p = personaOf(R);
  for (const c of realmCities(s, R.id)) {
    if (c.building || c.queue.length || R.gold < reserve) continue;
    const wonderChance = p === 'insaatci' ? 0.5 : p === 'tuccar' ? 0.3 : 0.15;
    if (c.capital && rand(s) < wonderChance) {
      const w = WONDERS.find((x) => !canWonder(s, R.id, c, x.id));
      if (w) { applyAction(s, R.id, { t: 'wonder', city: c.id, id: w.id }); continue; }
    }
    for (const id of CITY_ORDER) {
      if (c.cbs.includes(id)) continue;
      if (!canCityBuild(s, R.id, c, id)) { applyAction(s, R.id, { t: 'cityBuild', city: c.id, cb: id }); break; }
    }
  }
  void CBS;
}

/** Ordu: savunma birlikleri, haydut temizliği; offense=true ise savaş ve genişleme. */
function military(s: GameState, R: Realm, offense: boolean) {
  const map = getMap(s.seed);
  const cities = realmCities(s, R.id);
  if (!cities.length) return;
  const mil = s.units.filter((u) => u.realm === R.id && !UNIT[u.type].civil);
  const camps = s.camps.filter((c) => cities.some((x) => hexDist(map, x.hex, c.hex) <= 7));
  const barbs = s.units.filter((u) => u.realm === BARB && cities.some((x) => hexDist(map, x.hex, u.hex) <= 4));
  const want = Math.ceil(cities.length * (offense && personaOf(R) === 'savasci' ? 1.2 : 0.8)) + R.wars.length * 3 + (camps.length || barbs.length ? 1 : 0) + (offense ? 1 : 0);
  if (mil.length < want && R.gold > 60) {
    const ranged = (camps.length || barbs.length) && rand(s) < 0.4;
    const best = [...UNITS].reverse().find((u) => !u.civil && (!ranged || u.range) && !canTrain(s, R.id, cities[0], u.id as UnitId))
      ?? [...UNITS].reverse().find((u) => !u.civil && !canTrain(s, R.id, cities[0], u.id as UnitId));
    if (best) {
      const threatened = cities.find((c) => barbs.some((b) => hexDist(map, b.hex, c.hex) <= 4)) ?? cities[Math.floor(rand(s) * cities.length)];
      applyAction(s, R.id, { t: 'train', city: threatened.id, unit: best.id });
    }
  }
  if (offense) {
    const target = Math.min(14, 3 + Math.floor(R.era * 1.6));
    const pending = s.units.some((u) => u.realm === R.id && u.type === 'settler');
    if (cities.length < target && !pending && R.inv[G.food] > 40) {
      const c = [...cities].sort((a, b) => b.pop - a.pop)[0];
      if (c.pop >= 3 && !canTrain(s, R.id, c, 'settler')) applyAction(s, R.id, { t: 'train', city: c.id, unit: 'settler' });
    }
  }
  const enemyCities = offense ? s.cities.filter((c) => atWar(s, R.id, c.realm)) : [];
  for (const u of mil) {
    if (u.path.length) continue;
    // şehre yaklaşan haydut varsa ona yönel
    const threat = barbs.filter((b) => hexDist(map, b.hex, u.hex) <= 6).sort((a, b) => hexDist(map, a.hex, u.hex) - hexDist(map, b.hex, u.hex))[0];
    if (threat && u.hp > 40) { applyAction(s, R.id, { t: 'move', unit: u.id, to: threat.hex }); continue; }
    const inCity = cities.find((c) => c.hex === u.hex);
    const guards = inCity ? mil.filter((x) => x.hex === inCity.hex).length : 0;
    if (inCity && guards <= 1 && !R.wars.length) { u.task = 'fortify'; continue; }
    if (u.hp < 50) continue;
    if (enemyCities.length && unitStr(s, u) > 10) {
      const t = enemyCities.reduce((b, c) => (hexDist(map, u.hex, c.hex) < hexDist(map, u.hex, b.hex) ? c : b));
      if (hexDist(map, u.hex, t.hex) < 30) { applyAction(s, R.id, { t: 'move', unit: u.id, to: t.hex }); continue; }
    }
    const camp = camps.filter((c) => c.str < unitStr(s, u) * 1.4).sort((a, b) => hexDist(map, u.hex, a.hex) - hexDist(map, u.hex, b.hex))[0];
    if (camp) { applyAction(s, R.id, { t: 'move', unit: u.id, to: camp.hex }); continue; }
    const empty = cities.find((c) => !s.units.some((x) => x.realm === R.id && x.hex === c.hex && !UNIT[x.type].civil));
    if (empty && empty.hex !== u.hex) applyAction(s, R.id, { t: 'move', unit: u.id, to: empty.hex });
  }
}

/** Vali genişlemesi: nüfus ve yiyecek yeterliyse göçmen yetiştirir (yerleşimi settle yapar). */
function expand(s: GameState, R: Realm) {
  const cities = realmCities(s, R.id);
  if (!cities.length || cities.length >= 2 + R.era * 1.3 || s.units.some((u) => u.realm === R.id && u.type === 'settler') || R.inv[G.food] < 40) return;
  const c = [...cities].sort((a, b) => b.pop - a.pop)[0];
  if (c.pop >= 3 && !canTrain(s, R.id, c, 'settler')) applyAction(s, R.id, { t: 'train', city: c.id, unit: 'settler' });
}

function power(s: GameState, r: number) {
  return s.units.filter((u) => u.realm === r && !UNIT[u.type].civil).reduce((t, u) => t + unitStr(s, u), 0) + realmCities(s, r).length * 8;
}

function diplomacy(s: GameState, R: Realm) {
  const map = getMap(s.seed);
  const p = personaOf(R);
  if (R.wars.length) {
    for (const w of R.wars) if (rand(s) < (p === 'savasci' ? 0.015 : 0.04)) applyAction(s, R.id, { t: 'peace', realm: w });
  }
  // anlaşma ve ittifak (botlar arası doğrudan; oyunculara teklif bırakır)
  if (s.turn % 7 === R.id % 7) {
    for (const o of s.realms) {
      if (!o.alive || o.id === R.id || atWar(s, R.id, o.id)) continue;
      const rel = relOf(s, R.id, o.id);
      if (rel >= 20 && !R.pacts.includes(o.id) && !R.pactOff.includes(o.id)) applyAction(s, R.id, { t: 'pact', realm: o.id });
      if (rel >= 50 && !R.allies.includes(o.id) && !R.allyOff.includes(o.id) && p !== 'savasci') applyAction(s, R.id, { t: 'ally', realm: o.id });
    }
  }
  if (R.wars.length || s.turn < 40) return;
  const chance = p === 'savasci' ? 0.03 : p === 'tuccar' ? 0.006 : 0.012;
  if (rand(s) > chance) return;
  const cap = realmCities(s, R.id)[0];
  if (!cap) return;
  const my = power(s, R.id);
  const prey = s.realms.filter((o) => o.alive && o.id !== R.id && !R.allies.includes(o.id) && relOf(s, R.id, o.id) < (p === 'savasci' ? 5 : -25)
    && realmCities(s, o.id).some((c) => hexDist(map, c.hex, cap.hex) < 14))
    .filter((o) => power(s, o.id) * 1.25 < my)[0];
  if (prey) applyAction(s, R.id, { t: 'war', realm: prey.id });
}

function sellSurplus(s: GameState, R: Realm) {
  const cities = realmCities(s, R.id);
  if (!cities.length) return;
  const inputs = new Set<number>();
  for (const im of s.imps) if (im.realm === R.id) for (const g of Object.keys(IMP[im.type].inputs)) inputs.add(G[g as keyof typeof G]);
  for (let g = 0; g < NG; g++) {
    const reserve = g === G.food ? R.stats.foodNeed * 4 + 30 : inputs.has(g) ? 40 : 12;
    const extra = Math.floor(R.inv[g] - reserve);
    if (extra < 3 || GOODS[g].era > R.era + 1) continue;
    const c = cities.reduce((b, x) => (priceAt(s, x, g) > priceAt(s, b, g) ? x : b));
    if (c.market[g] > cityMarket(s, c).target[g] * 1.6) continue;
    applyAction(s, R.id, { t: 'sell', city: c.id, good: g, qty: Math.ceil(extra * 0.5) });
  }
}

function routes(s: GameState, R: Realm) {
  const map = getMap(s.seed);
  const mine = s.routes.filter((r) => r.realm === R.id);
  if (mine.length >= routeSlots(s, R.id)) return;
  const cities = realmCities(s, R.id);
  if (!cities.length) return;
  const from = cities[Math.floor(rand(s) * cities.length)];
  const cands = s.cities.filter((c) => c.id !== from.id && !atWar(s, R.id, c.realm) && hexDist(map, c.hex, from.hex) <= 22
    && !mine.some((r) => r.from === from.id && r.to === c.id))
    .map((c) => ({ c, v: c.pop * (c.realm !== R.id ? 1.5 + (R.pacts.includes(c.realm) ? 0.5 : 0) : 1) + hexDist(map, c.hex, from.hex) * 0.2 }))
    .sort((a, b) => b.v - a.v).slice(0, 3);
  for (const { c } of cands) {
    if (canRoute(s, R.id, from.id, c.id)) continue;
    applyAction(s, R.id, { t: 'route', from: from.id, to: c.id });
    break;
  }
}

export function actBots(s: GameState) {
  for (const R of s.realms) {
    if (!R.alive) continue;
    const k = (s.turn + R.id);
    if (R.kind === 'player') {
      // Vali: oyuncu açtıysa ya da çevrimdışıyken vekil açıksa
      const away = R.away && R.steward;
      const A = { build: R.auto.build || away, imps: R.auto.imps || away, routes: R.auto.routes || away, army: R.auto.army || away };
      const reserve = 40 + R.era * 60; // vali kasayı tamamen boşaltmaz
      if (A.build) settle(s, R);
      if (A.imps && k % 2 === 0) improve(s, R, reserve);
      if (A.build && k % 2 === 1) cityWorks(s, R, reserve);
      if (A.army && k % 3 === 0) military(s, R, false);
      if (A.routes && k % 5 === 0) routes(s, R);
      if ((away || A.imps || A.routes) && k % 3 === 0) sellSurplus(s, R);
      if (A.build && k % 6 === 0) expand(s, R);
      const extra = R.gold - (600 + R.era * 500);
      if ((A.build || away) && extra > 300) applyAction(s, R.id, { t: 'fund', amount: extra * 0.4 });
      continue;
    }
    settle(s, R);
    if (k % 2 === 0) { improve(s, R); cityWorks(s, R); }
    if (k % 3 === 0) military(s, R, true);
    if (k % 4 === 0) sellSurplus(s, R);
    if (k % 5 === 0) routes(s, R);
    diplomacy(s, R);
    const reserve = 300 + R.era * 400;
    if (R.gold > reserve * 1.5) applyAction(s, R.id, { t: 'fund', amount: (R.gold - reserve) * 0.5 });
  }
  checkQuests(s);
}
