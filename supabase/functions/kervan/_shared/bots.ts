// Yapay zekâ kabileleri: yerleşir, araştırır, üretir, ticaret yolu açar, haydut temizler, bazen savaşır.
// Vekil: çevrimdışı oyuncular için yalnızca fazla malı satar.
import { CBS, G, GOODS, IMP, NG, UNIT, UNITS, type CbId, type ImpId, type UnitId } from './defs.ts';
import { hexDist, within } from './hexgrid.ts';
import {
  applyAction, atWar, canBuildImp, canCityBuild, canFound, canRoute, canTrain, cityMarket, getMap, ownerOf,
  priceAt, rand, realmCities, routeSlots, unitStr, type GameState, type Realm,
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
    else { const r = applyAction(s, R.id, { t: 'move', unit: u.id, to: best }); if (r.ok) u.task = 'found'; else u.task = 'explore'; }
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
    const sc = (d.needs ? h.res[d.needs.res] : 0.5) + rand(s) * 0.05;
    if (sc > bv) { bv = sc; best = i; }
  }
  return best;
}

function develop(s: GameState, R: Realm) {
  const free = R.stats.labor - R.stats.laborNeed;
  const cities = realmCities(s, R.id);
  if (!cities.length) return;
  if (free >= 0.8) {
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
  if (R.gold > 200 + R.era * 150) {
    const ims = s.imps.filter((i) => i.realm === R.id && i.left === 0 && i.level < 5 && i.status === 'Çalışıyor').sort((a, b) => b.out - a.out);
    for (const im of ims.slice(0, 3)) if (R.gold > 200 + R.era * 150) applyAction(s, R.id, { t: 'upgrade', imp: im.id });
  }
  // şehir yapıları
  for (const c of cities) {
    if (c.building) continue;
    for (const id of CITY_ORDER) {
      if (c.cbs.includes(id)) continue;
      if (!canCityBuild(s, R.id, c, id)) { applyAction(s, R.id, { t: 'cityBuild', city: c.id, cb: id }); break; }
    }
  }
  void CBS;
}

function military(s: GameState, R: Realm) {
  const map = getMap(s.seed);
  const cities = realmCities(s, R.id);
  if (!cities.length) return;
  const mil = s.units.filter((u) => u.realm === R.id && !UNIT[u.type].civil);
  const want = Math.ceil(cities.length * 0.8) + R.wars.length * 3 + 1;
  if (mil.length < want && R.gold > 60) {
    const best = [...UNITS].reverse().find((u) => !u.civil && !canTrain(s, R.id, cities[0], u.id as UnitId));
    if (best) {
      const c = cities[Math.floor(rand(s) * cities.length)];
      applyAction(s, R.id, { t: 'train', city: c.id, unit: best.id });
    }
  }
  // genişleme: göçmen
  const target = Math.min(14, 3 + Math.floor(R.era * 1.6));
  const pending = s.units.some((u) => u.realm === R.id && u.type === 'settler');
  if (cities.length < target && !pending && R.inv[G.food] > 40) {
    const c = [...cities].sort((a, b) => b.pop - a.pop)[0];
    if (c.pop >= 3 && !canTrain(s, R.id, c, 'settler')) applyAction(s, R.id, { t: 'train', city: c.id, unit: 'settler' });
  }
  // birlik görevleri
  const enemyCities = s.cities.filter((c) => atWar(s, R.id, c.realm));
  for (const u of mil) {
    if (u.path.length) continue;
    const inCity = cities.find((c) => c.hex === u.hex);
    const guards = inCity ? mil.filter((x) => x.hex === inCity.hex).length : 0;
    if (inCity && guards <= 1 && !R.wars.length) { u.task = 'fortify'; continue; }
    if (u.hp < 50) continue;
    // savaş: en yakın düşman şehir
    if (enemyCities.length && unitStr(s, u) > 10) {
      const t = enemyCities.reduce((b, c) => (hexDist(map, u.hex, c.hex) < hexDist(map, u.hex, b.hex) ? c : b));
      if (hexDist(map, u.hex, t.hex) < 30) { applyAction(s, R.id, { t: 'move', unit: u.id, to: t.hex }); continue; }
    }
    // haydut temizliği
    const camp = s.camps.filter((c) => cities.some((x) => hexDist(map, x.hex, c.hex) <= 6) && c.str < unitStr(s, u) * 1.4)
      .sort((a, b) => hexDist(map, u.hex, a.hex) - hexDist(map, u.hex, b.hex))[0];
    if (camp) { applyAction(s, R.id, { t: 'move', unit: u.id, to: camp.hex }); continue; }
    // boş şehre dön
    const empty = cities.find((c) => !s.units.some((x) => x.realm === R.id && x.hex === c.hex && !UNIT[x.type].civil));
    if (empty && empty.hex !== u.hex) applyAction(s, R.id, { t: 'move', unit: u.id, to: empty.hex });
  }
}

function power(s: GameState, r: number) {
  return s.units.filter((u) => u.realm === r && !UNIT[u.type].civil).reduce((t, u) => t + unitStr(s, u), 0) + realmCities(s, r).length * 8;
}

function diplomacy(s: GameState, R: Realm) {
  const map = getMap(s.seed);
  if (R.wars.length) {
    for (const w of R.wars) if (rand(s) < 0.03) applyAction(s, R.id, { t: 'peace', realm: w });
    return;
  }
  if (s.turn < 40 || rand(s) > 0.025) return;
  const cap = realmCities(s, R.id)[0];
  if (!cap) return;
  const my = power(s, R.id);
  const prey = s.realms.filter((o) => o.alive && o.id !== R.id && realmCities(s, o.id).some((c) => hexDist(map, c.hex, cap.hex) < 14))
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
    const m = cityMarket(s, c);
    if (c.market[g] > m.target[g] * 1.6) continue;
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
    .map((c) => ({ c, v: c.pop * (c.realm !== R.id ? 1.5 : 1) + hexDist(map, c.hex, from.hex) * 0.2 }))
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
    if (R.kind === 'player') {
      if (R.away && R.steward && s.turn % 3 === 0) sellSurplus(s, R);
      continue;
    }
    settle(s, R);
    if ((s.turn + R.id) % 2 === 0) develop(s, R);
    if ((s.turn + R.id) % 3 === 0) military(s, R);
    if ((s.turn + R.id) % 4 === 0) sellSurplus(s, R);
    if ((s.turn + R.id) % 5 === 0) routes(s, R);
    diplomacy(s, R);
    const reserve = 300 + R.era * 400;
    if (R.gold > reserve * 1.5) applyAction(s, R.id, { t: 'fund', amount: (R.gold - reserve) * 0.5 });
    void ownerOf;
  }
}
