// KERVAN v0.3 — MÖ 4000'den MS 2100'e: çağlar, araştırma ağacı, mallar, yapılar, birlikler, taşıtlar.
// Hem istemci (yerel sim) hem sunucu (Supabase Edge Function) bu dosyayı kullanır.

// ---------- takvim ----------
/** [başlangıç yılı, tur başına yıl] — son bölüm 2100'de biter. */
const SEGMENTS: [number, number][] = [[-4000, 50], [-1000, 25], [500, 20], [1300, 10], [1600, 5], [1800, 2], [1900, 1]];
export const END_YEAR = 2100;
const SEG_TURNS = SEGMENTS.map(([y, s], i) => ((SEGMENTS[i + 1]?.[0] ?? END_YEAR) - y) / s);
export const END_TURN = SEG_TURNS.reduce((a, b) => a + b, 0); // 480

export function yearOfTurn(turn: number) {
  let t = Math.max(0, turn);
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (t < SEG_TURNS[i] || i === SEGMENTS.length - 1) return Math.min(END_YEAR, SEGMENTS[i][0] + t * SEGMENTS[i][1]);
    t -= SEG_TURNS[i];
  }
  return END_YEAR;
}
export const yearsPerTurn = (turn: number) => yearOfTurn(turn + 1) - yearOfTurn(turn);
export function fmtYear(y: number) {
  const r = Math.round(y);
  return r < 0 ? `MÖ ${-r}` : r < 1000 ? `MS ${r}` : `${r}`;
}

// ---------- çağlar ----------
export interface EraDef { id: number; name: string; color: string; motto: string }
export const ERAS: EraDef[] = [
  { id: 0, name: 'Taş Çağı', color: '#8a7a62', motto: 'Avcı toplayıcı kabileler' },
  { id: 1, name: 'Tunç Çağı', color: '#b07a3a', motto: 'İlk şehirler, yazı ve tekerlek' },
  { id: 2, name: 'Demir Çağı', color: '#6d6a68', motto: 'İmparatorluklar ve felsefe' },
  { id: 3, name: 'Orta Çağ', color: '#7a4a2a', motto: 'Kervansaraylar ve loncalar' },
  { id: 4, name: 'Rönesans', color: '#9a3b2a', motto: 'Barut, matbaa ve keşifler' },
  { id: 5, name: 'Sanayi Çağı', color: '#4a4038', motto: 'Buhar, çelik ve demiryolu' },
  { id: 6, name: 'Modern Çağ', color: '#2f4a5a', motto: 'Elektrik, petrol ve otomobil' },
  { id: 7, name: 'Bilgi Çağı', color: '#2a5a7a', motto: 'Bilgisayar ve küresel ticaret' },
  { id: 8, name: 'Gelecek Çağı', color: '#5a3a8a', motto: 'Robotlar, füzyon ve uzay' },
];

// ---------- hex kaynakları ----------
export type ResKey = 'fertility' | 'forest' | 'stone' | 'ore' | 'copper' | 'coal' | 'pasture' | 'cotton' | 'sugar' | 'oil';
export const RES_KEYS: ResKey[] = ['fertility', 'forest', 'stone', 'ore', 'copper', 'coal', 'pasture', 'cotton', 'sugar', 'oil'];
export const RES_NAMES: Record<ResKey, string> = {
  fertility: 'Verim', forest: 'Orman', stone: 'Taş', ore: 'Demir', copper: 'Bakır', coal: 'Kömür', pasture: 'Mera',
  cotton: 'Pamuk', sugar: 'Şeker kamışı', oil: 'Petrol',
};

// ---------- mallar ----------
export type GoodId =
  | 'food' | 'wood' | 'stone' | 'clay' | 'copper' | 'wool' | 'pottery' | 'bronze' | 'cloth'
  | 'ore' | 'iron' | 'weapons' | 'planks' | 'tools' | 'paper' | 'sugar' | 'cotton' | 'gunpowder'
  | 'coal' | 'clothes' | 'steel' | 'machinery' | 'rails' | 'oil' | 'fuel' | 'plastics' | 'cars'
  | 'electronics' | 'robots';

export interface GoodDef {
  id: GoodId; name: string; icon: string;
  price: number; // taban fiyat (altın)
  era: number; // halkın talep etmeye başladığı çağ
  demand: number; // nüfus başına tur talebi (pazar hedef stoğu için)
  luxury?: boolean; // mutluluk verir
}

export const GOODS: GoodDef[] = [
  { id: 'food', name: 'Yiyecek', icon: '🌾', price: 2, era: 0, demand: 0.6 },
  { id: 'wood', name: 'Odun', icon: '🪵', price: 2, era: 0, demand: 0.3 },
  { id: 'stone', name: 'Taş', icon: '🪨', price: 3, era: 0, demand: 0.2 },
  { id: 'clay', name: 'Kil', icon: '🟫', price: 2, era: 1, demand: 0.1 },
  { id: 'copper', name: 'Bakır', icon: '🟠', price: 6, era: 1, demand: 0.05 },
  { id: 'wool', name: 'Yün', icon: '🐑', price: 4, era: 1, demand: 0.1 },
  { id: 'pottery', name: 'Çömlek', icon: '🏺', price: 6, era: 1, demand: 0.15, luxury: true },
  { id: 'bronze', name: 'Tunç', icon: '🥉', price: 14, era: 1, demand: 0.05 },
  { id: 'cloth', name: 'Dokuma', icon: '🧵', price: 9, era: 1, demand: 0.15, luxury: true },
  { id: 'ore', name: 'Demir cevheri', icon: '⛏️', price: 6, era: 2, demand: 0.03 },
  { id: 'iron', name: 'Demir', icon: '⛓️', price: 16, era: 2, demand: 0.06 },
  { id: 'weapons', name: 'Silah', icon: '🗡️', price: 30, era: 2, demand: 0.03 },
  { id: 'planks', name: 'Kereste', icon: '🪚', price: 6, era: 3, demand: 0.12 },
  { id: 'tools', name: 'Alet', icon: '🔨', price: 22, era: 3, demand: 0.06 },
  { id: 'paper', name: 'Kâğıt', icon: '📜', price: 10, era: 3, demand: 0.08, luxury: true },
  { id: 'sugar', name: 'Şeker', icon: '🍬', price: 12, era: 4, demand: 0.12, luxury: true },
  { id: 'cotton', name: 'Pamuk', icon: '☁️', price: 8, era: 4, demand: 0.06 },
  { id: 'gunpowder', name: 'Barut', icon: '💥', price: 28, era: 4, demand: 0.03 },
  { id: 'coal', name: 'Kömür', icon: '⚫', price: 6, era: 5, demand: 0.15 },
  { id: 'clothes', name: 'Giysi', icon: '👔', price: 20, era: 5, demand: 0.12, luxury: true },
  { id: 'steel', name: 'Çelik', icon: '🔩', price: 34, era: 5, demand: 0.05 },
  { id: 'machinery', name: 'Makine', icon: '⚙️', price: 120, era: 5, demand: 0.02 },
  { id: 'rails', name: 'Ray', icon: '🛤️', price: 60, era: 5, demand: 0.02 },
  { id: 'oil', name: 'Ham petrol', icon: '🛢️', price: 14, era: 6, demand: 0.05 },
  { id: 'fuel', name: 'Yakıt', icon: '⛽', price: 26, era: 6, demand: 0.12 },
  { id: 'plastics', name: 'Plastik', icon: '🧴', price: 24, era: 6, demand: 0.06 },
  { id: 'cars', name: 'Otomobil', icon: '🚗', price: 400, era: 6, demand: 0.01, luxury: true },
  { id: 'electronics', name: 'Elektronik', icon: '💻', price: 180, era: 7, demand: 0.03, luxury: true },
  { id: 'robots', name: 'Robot', icon: '🤖', price: 700, era: 8, demand: 0.008 },
];
export const G: Record<GoodId, number> = Object.fromEntries(GOODS.map((g, i) => [g.id, i])) as Record<GoodId, number>;
export const NG = GOODS.length;

// ---------- araştırma ağacı ----------
export type TechId =
  | 'tarim' | 'tascilik' | 'balikcilik' | 'hayvancilik'
  | 'comlekcilik' | 'madencilik' | 'tunc' | 'tekerlek' | 'yazi' | 'dokuma' | 'denizcilik'
  | 'demir' | 'para' | 'matematik' | 'insaat' | 'felsefe' | 'silahcilik'
  | 'degirmen' | 'kagit' | 'lonca' | 'feodalite' | 'kervansaray' | 'pusula'
  | 'barut' | 'matbaa' | 'bankacilik' | 'kartografya' | 'plantasyon' | 'komur'
  | 'buhar' | 'demiryolu' | 'celik' | 'tekstil' | 'tufek'
  | 'elektrik' | 'petrol' | 'otomobil' | 'kimya' | 'motorlu'
  | 'bilgisayar' | 'nukleer' | 'konteyner' | 'internet'
  | 'robotik' | 'yapayzeka' | 'maglev' | 'fuzyon' | 'uzay';

export interface TechDef { id: TechId; name: string; era: number; req: TechId[]; desc: string; icon: string }
export const ERA_COST = [15, 35, 140, 600, 900, 1700, 2600, 3800, 5000];
export const TECHS: TechDef[] = [
  { id: 'tarim', name: 'Tarım', era: 0, req: [], icon: '🌱', desc: 'Tarla. Göçmen yetiştirme.' },
  { id: 'tascilik', name: 'Taşçılık', era: 0, req: [], icon: '🪨', desc: 'Taş ocağı.' },
  { id: 'balikcilik', name: 'Balıkçılık', era: 0, req: [], icon: '🎣', desc: 'Balıkçı köyü, sal ile deniz ticareti.' },
  { id: 'hayvancilik', name: 'Hayvancılık', era: 0, req: ['tarim'], icon: '🐐', desc: 'Ağıl (yün), eşek kervanları.' },
  { id: 'comlekcilik', name: 'Çömlekçilik', era: 1, req: ['tarim'], icon: '🏺', desc: 'Kil ocağı, çömlekçi, ambar.' },
  { id: 'madencilik', name: 'Madencilik', era: 1, req: ['tascilik'], icon: '⛏️', desc: 'Bakır madeni.' },
  { id: 'tunc', name: 'Tunç İşleme', era: 1, req: ['madencilik'], icon: '🥉', desc: 'Tunç dökümhanesi, mızrakçı.' },
  { id: 'tekerlek', name: 'Tekerlek', era: 1, req: ['hayvancilik'], icon: '☸️', desc: 'Öküz arabaları: daha hızlı ve dolu kervan.' },
  { id: 'yazi', name: 'Yazı', era: 1, req: ['comlekcilik'], icon: '𒀭', desc: 'Kütüphane.' },
  { id: 'dokuma', name: 'Dokumacılık', era: 1, req: ['hayvancilik'], icon: '🧵', desc: 'Dokumacı: yünden kumaş.' },
  { id: 'denizcilik', name: 'Denizcilik', era: 1, req: ['balikcilik'], icon: '⛵', desc: 'Liman ve kadırga: uzak deniz ticareti.' },
  { id: 'demir', name: 'Demir İşleme', era: 2, req: ['tunc'], icon: '⛓️', desc: 'Demir madeni ve demirci.' },
  { id: 'para', name: 'Para', era: 2, req: ['yazi'], icon: '🪙', desc: 'Pazar yeri: +%20 altın, +1 ticaret yolu.' },
  { id: 'matematik', name: 'Matematik', era: 2, req: ['yazi'], icon: '📐', desc: 'Bilim +%10.' },
  { id: 'insaat', name: 'İnşaat', era: 2, req: ['tascilik', 'matematik'], icon: '🏛️', desc: 'Surlar; yapılar %10 ucuz.' },
  { id: 'felsefe', name: 'Felsefe', era: 2, req: ['matematik'], icon: '🦉', desc: 'Bilim +%10, şehir sınırı +1 hızlı.' },
  { id: 'silahcilik', name: 'Silahçılık', era: 2, req: ['demir'], icon: '🗡️', desc: 'Silahhane, kılıçlı piyade, kışla.' },
  { id: 'degirmen', name: 'Değirmen', era: 3, req: ['insaat'], icon: '🌬️', desc: 'Hızar: kereste.' },
  { id: 'kagit', name: 'Kâğıt', era: 3, req: ['felsefe'], icon: '📜', desc: 'Kâğıthane.' },
  { id: 'lonca', name: 'Loncalar', era: 3, req: ['para', 'demir'], icon: '🔨', desc: 'Alet yapımcısı; üretim +%10.' },
  { id: 'feodalite', name: 'Feodalite', era: 3, req: ['silahcilik'], icon: '🐎', desc: 'Şövalye.' },
  { id: 'kervansaray', name: 'Kervansaray', era: 3, req: ['para', 'tekerlek'], icon: '🐫', desc: 'Kervansaray ve atlı kervanlar.' },
  { id: 'pusula', name: 'Pusula', era: 3, req: ['denizcilik', 'matematik'], icon: '🧭', desc: 'Yelkenli gemiler.' },
  { id: 'barut', name: 'Barut', era: 4, req: ['feodalite', 'kagit'], icon: '💥', desc: 'Baruthane, tüfekli asker.' },
  { id: 'matbaa', name: 'Matbaa', era: 4, req: ['kagit'], icon: '📖', desc: 'Üniversite.' },
  { id: 'bankacilik', name: 'Bankacılık', era: 4, req: ['lonca'], icon: '🏦', desc: 'Banka: +%30 altın; kredi.' },
  { id: 'kartografya', name: 'Kartografya', era: 4, req: ['pusula'], icon: '🗺️', desc: 'Kalyonlar, okyanus aşırı yollar.' },
  { id: 'plantasyon', name: 'Plantasyon', era: 4, req: ['kartografya'], icon: '🌴', desc: 'Şeker ve pamuk tarlaları.' },
  { id: 'komur', name: 'Kömür Madenciliği', era: 4, req: ['lonca'], icon: '⚫', desc: 'Kömür ocağı.' },
  { id: 'buhar', name: 'Buhar Gücü', era: 5, req: ['komur', 'matbaa'], icon: '♨️', desc: 'Makine fabrikası, buharlı gemi.' },
  { id: 'demiryolu', name: 'Demiryolu', era: 5, req: ['buhar'], icon: '🚂', desc: 'Ray fabrikası, istasyon, trenler.' },
  { id: 'celik', name: 'Çelik', era: 5, req: ['buhar'], icon: '🔩', desc: 'Çelikhane, topçu.' },
  { id: 'tekstil', name: 'Tekstil Fabrikası', era: 5, req: ['buhar', 'plantasyon'], icon: '🏭', desc: 'Pamuktan giysi.' },
  { id: 'tufek', name: 'Yivli Tüfek', era: 5, req: ['barut', 'celik'], icon: '🎖️', desc: 'Modern piyade.' },
  { id: 'elektrik', name: 'Elektrik', era: 6, req: ['celik', 'demiryolu'], icon: '⚡', desc: 'Santral: üretim +%20.' },
  { id: 'petrol', name: 'Petrol', era: 6, req: ['elektrik'], icon: '🛢️', desc: 'Petrol kuyusu ve rafineri.' },
  { id: 'otomobil', name: 'Otomobil', era: 6, req: ['petrol'], icon: '🚗', desc: 'Otomobil fabrikası, kamyonlar.' },
  { id: 'kimya', name: 'Kimya', era: 6, req: ['petrol'], icon: '⚗️', desc: 'Plastik fabrikası.' },
  { id: 'motorlu', name: 'Motorlu Savaş', era: 6, req: ['otomobil', 'tufek'], icon: '🛡️', desc: 'Tank.' },
  { id: 'bilgisayar', name: 'Bilgisayar', era: 7, req: ['elektrik', 'kimya'], icon: '💻', desc: 'Elektronik fabrikası.' },
  { id: 'nukleer', name: 'Nükleer Enerji', era: 7, req: ['elektrik'], icon: '☢️', desc: 'Üretim +%15.' },
  { id: 'konteyner', name: 'Konteyner', era: 7, req: ['otomobil'], icon: '📦', desc: 'Konteyner gemileri.' },
  { id: 'internet', name: 'İnternet', era: 7, req: ['bilgisayar'], icon: '🌐', desc: 'Araştırma laboratuvarı, +1 ticaret yolu.' },
  { id: 'robotik', name: 'Robotik', era: 8, req: ['internet', 'nukleer'], icon: '🤖', desc: 'Robot fabrikası, robot ordusu.' },
  { id: 'yapayzeka', name: 'Yapay Zekâ', era: 8, req: ['internet'], icon: '🧠', desc: 'Bilim +%25, otonom gemiler.' },
  { id: 'maglev', name: 'Maglev', era: 8, req: ['robotik'], icon: '🚄', desc: 'Manyetik trenler.' },
  { id: 'fuzyon', name: 'Füzyon', era: 8, req: ['nukleer', 'yapayzeka'], icon: '🔆', desc: 'Üretim +%25.' },
  { id: 'uzay', name: 'Uzay Kolonizasyonu', era: 8, req: ['fuzyon', 'robotik'], icon: '🚀', desc: 'Uzay limanı ve Mars Kolonisi projesi.' },
];
export const TECH: Record<TechId, TechDef> = Object.fromEntries(TECHS.map((t) => [t.id, t])) as Record<TechId, TechDef>;
export const techCost = (t: TechId, known: number) => Math.round(ERA_COST[TECH[t].era] * (1 + known * 0.012));

// ---------- hex yapıları (üretim) ----------
export type ImpId =
  | 'hunt' | 'lumber' | 'farm' | 'quarry' | 'fishery' | 'pasture' | 'claypit' | 'kiln' | 'coppermine' | 'bronzeworks' | 'weaver'
  | 'ironmine' | 'smithy' | 'armory' | 'sawmill' | 'toolmaker' | 'papermill' | 'sugarfarm' | 'cottonfarm' | 'powdermill'
  | 'coalmine' | 'textile' | 'steelmill' | 'machineworks' | 'railworks' | 'oilwell' | 'refinery' | 'chemplant' | 'carfactory'
  | 'electronics' | 'robotics';

type Q = Partial<Record<GoodId, number>>;
export interface ImpDef {
  id: ImpId; name: string; icon: string; tech: TechId | null; era: number;
  inputs: Q; outputs: Q; workers: number; gold: number; mat: Q; turns: number;
  needs?: { res: ResKey; min: number }; coast?: boolean; industrial?: boolean; desc: string;
}
export const IMPS: ImpDef[] = [
  { id: 'hunt', name: 'Av kampı', icon: '🏹', tech: null, era: 0, inputs: {}, outputs: { food: 2 }, workers: 1, gold: 10, mat: {}, turns: 1, desc: 'Avcılar ve toplayıcılar.' },
  { id: 'lumber', name: 'Oduncu', icon: '🪓', tech: null, era: 0, inputs: {}, outputs: { wood: 3 }, workers: 1, gold: 10, mat: {}, turns: 1, needs: { res: 'forest', min: 0.3 }, desc: 'Ormandan odun.' },
  { id: 'farm', name: 'Tarla', icon: '🌾', tech: 'tarim', era: 0, inputs: {}, outputs: { food: 4 }, workers: 1, gold: 20, mat: { wood: 4 }, turns: 2, needs: { res: 'fertility', min: 0.3 }, desc: 'Verimli toprakta tahıl.' },
  { id: 'quarry', name: 'Taş ocağı', icon: '🪨', tech: 'tascilik', era: 0, inputs: {}, outputs: { stone: 2 }, workers: 1, gold: 20, mat: { wood: 4 }, turns: 2, needs: { res: 'stone', min: 0.35 }, desc: 'Tepelerde ve dağlarda.' },
  { id: 'fishery', name: 'Balıkçı köyü', icon: '🎣', tech: 'balikcilik', era: 0, inputs: {}, outputs: { food: 3 }, workers: 1, gold: 20, mat: { wood: 5 }, turns: 2, coast: true, desc: 'Kıyı hex\'inde.' },
  { id: 'pasture', name: 'Ağıl', icon: '🐑', tech: 'hayvancilik', era: 0, inputs: {}, outputs: { wool: 2, food: 1 }, workers: 1, gold: 25, mat: { wood: 6 }, turns: 2, needs: { res: 'pasture', min: 0.35 }, desc: 'Koyun ve keçi.' },
  { id: 'claypit', name: 'Kil ocağı', icon: '🟫', tech: 'comlekcilik', era: 1, inputs: {}, outputs: { clay: 3 }, workers: 1, gold: 25, mat: { wood: 4 }, turns: 2, needs: { res: 'fertility', min: 0.25 }, desc: 'Nehir kıyısı kili.' },
  { id: 'kiln', name: 'Çömlekçi', icon: '🏺', tech: 'comlekcilik', era: 1, inputs: { clay: 2, wood: 1 }, outputs: { pottery: 2 }, workers: 1, gold: 40, mat: { stone: 6 }, turns: 3, desc: 'Fırında çömlek.' },
  { id: 'coppermine', name: 'Bakır madeni', icon: '🟠', tech: 'madencilik', era: 1, inputs: {}, outputs: { copper: 2 }, workers: 2, gold: 50, mat: { wood: 8 }, turns: 3, needs: { res: 'copper', min: 0.3 }, desc: 'Tepelerde bakır.' },
  { id: 'bronzeworks', name: 'Tunç dökümhanesi', icon: '🔥', tech: 'tunc', era: 1, inputs: { copper: 2, wood: 2 }, outputs: { bronze: 1 }, workers: 2, gold: 70, mat: { stone: 10 }, turns: 3, industrial: true, desc: 'Bakır + kalay = tunç.' },
  { id: 'weaver', name: 'Dokumacı', icon: '🧶', tech: 'dokuma', era: 1, inputs: { wool: 2 }, outputs: { cloth: 2 }, workers: 1, gold: 45, mat: { wood: 6 }, turns: 2, desc: 'Tezgâhta kumaş.' },
  { id: 'ironmine', name: 'Demir madeni', icon: '⛏️', tech: 'demir', era: 2, inputs: {}, outputs: { ore: 3 }, workers: 2, gold: 70, mat: { wood: 8, bronze: 1 }, turns: 3, needs: { res: 'ore', min: 0.3 }, desc: 'Demir cevheri.' },
  { id: 'smithy', name: 'Demirci', icon: '⚒️', tech: 'demir', era: 2, inputs: { ore: 2, wood: 2 }, outputs: { iron: 1 }, workers: 2, gold: 90, mat: { stone: 12 }, turns: 3, industrial: true, desc: 'Cevherden demir.' },
  { id: 'armory', name: 'Silahhane', icon: '🗡️', tech: 'silahcilik', era: 2, inputs: { iron: 1, wood: 1 }, outputs: { weapons: 1 }, workers: 2, gold: 120, mat: { stone: 12 }, turns: 3, industrial: true, desc: 'Kılıç ve mızrak.' },
  { id: 'sawmill', name: 'Hızar', icon: '🪚', tech: 'degirmen', era: 3, inputs: { wood: 3 }, outputs: { planks: 3 }, workers: 1, gold: 90, mat: { stone: 10, iron: 1 }, turns: 3, desc: 'Su değirmeniyle kereste.' },
  { id: 'toolmaker', name: 'Alet ustası', icon: '🔨', tech: 'lonca', era: 3, inputs: { iron: 1, planks: 1 }, outputs: { tools: 2 }, workers: 2, gold: 140, mat: { stone: 12, planks: 6 }, turns: 3, desc: 'Lonca atölyesi.' },
  { id: 'papermill', name: 'Kâğıthane', icon: '📜', tech: 'kagit', era: 3, inputs: { wood: 2, cloth: 1 }, outputs: { paper: 3 }, workers: 1, gold: 110, mat: { planks: 6 }, turns: 3, desc: 'Paçavradan kâğıt.' },
  { id: 'sugarfarm', name: 'Şeker plantasyonu', icon: '🍬', tech: 'plantasyon', era: 4, inputs: {}, outputs: { sugar: 3 }, workers: 2, gold: 150, mat: { planks: 8 }, turns: 3, needs: { res: 'sugar', min: 0.35 }, desc: 'Sıcak ve nemli.' },
  { id: 'cottonfarm', name: 'Pamuk tarlası', icon: '☁️', tech: 'plantasyon', era: 4, inputs: {}, outputs: { cotton: 3 }, workers: 2, gold: 150, mat: { planks: 8 }, turns: 3, needs: { res: 'cotton', min: 0.35 }, desc: 'Sıcak ovalar.' },
  { id: 'powdermill', name: 'Baruthane', icon: '💥', tech: 'barut', era: 4, inputs: { wood: 2, stone: 1 }, outputs: { gunpowder: 1 }, workers: 2, gold: 220, mat: { stone: 16, tools: 2 }, turns: 4, industrial: true, desc: 'Güherçile ve kükürt.' },
  { id: 'coalmine', name: 'Kömür ocağı', icon: '⚫', tech: 'komur', era: 4, inputs: {}, outputs: { coal: 3 }, workers: 2, gold: 200, mat: { planks: 10, tools: 2 }, turns: 4, needs: { res: 'coal', min: 0.3 }, desc: 'Yeraltı damarları.' },
  { id: 'textile', name: 'Tekstil fabrikası', icon: '🏭', tech: 'tekstil', era: 5, inputs: { cotton: 3, coal: 1 }, outputs: { clothes: 3 }, workers: 3, gold: 400, mat: { planks: 10, machinery: 1 }, turns: 4, industrial: true, desc: 'Buharlı dokuma tezgâhları.' },
  { id: 'steelmill', name: 'Çelikhane', icon: '🔩', tech: 'celik', era: 5, inputs: { iron: 2, coal: 2 }, outputs: { steel: 2 }, workers: 3, gold: 500, mat: { stone: 20, tools: 4 }, turns: 5, industrial: true, desc: 'Bessemer fırını.' },
  { id: 'machineworks', name: 'Makine fabrikası', icon: '⚙️', tech: 'buhar', era: 5, inputs: { iron: 2, tools: 1, coal: 1 }, outputs: { machinery: 1 }, workers: 3, gold: 600, mat: { planks: 12, tools: 4 }, turns: 5, industrial: true, desc: 'Buhar makineleri.' },
  { id: 'railworks', name: 'Ray fabrikası', icon: '🛤️', tech: 'demiryolu', era: 5, inputs: { steel: 2 }, outputs: { rails: 2 }, workers: 2, gold: 600, mat: { machinery: 1, stone: 10 }, turns: 5, industrial: true, desc: 'Ray ve lokomotif parçası.' },
  { id: 'oilwell', name: 'Petrol kuyusu', icon: '🛢️', tech: 'petrol', era: 6, inputs: {}, outputs: { oil: 4 }, workers: 2, gold: 900, mat: { steel: 6, machinery: 1 }, turns: 5, needs: { res: 'oil', min: 0.3 }, desc: 'Sondaj kulesi.' },
  { id: 'refinery', name: 'Rafineri', icon: '⛽', tech: 'petrol', era: 6, inputs: { oil: 3 }, outputs: { fuel: 3 }, workers: 3, gold: 1200, mat: { steel: 10, machinery: 2 }, turns: 6, industrial: true, desc: 'Ham petrolden yakıt.' },
  { id: 'chemplant', name: 'Plastik fabrikası', icon: '🧴', tech: 'kimya', era: 6, inputs: { oil: 2 }, outputs: { plastics: 2 }, workers: 3, gold: 1300, mat: { steel: 10, machinery: 2 }, turns: 6, industrial: true, desc: 'Petrokimya.' },
  { id: 'carfactory', name: 'Otomobil fabrikası', icon: '🚗', tech: 'otomobil', era: 6, inputs: { steel: 3, plastics: 1, fuel: 1 }, outputs: { cars: 1 }, workers: 4, gold: 2000, mat: { steel: 20, machinery: 4 }, turns: 6, industrial: true, desc: 'Montaj hattı.' },
  { id: 'electronics', name: 'Elektronik fabrikası', icon: '💻', tech: 'bilgisayar', era: 7, inputs: { plastics: 1, copper: 2 }, outputs: { electronics: 1 }, workers: 3, gold: 2800, mat: { steel: 16, machinery: 4 }, turns: 6, industrial: true, desc: 'Çip ve devre.' },
  { id: 'robotics', name: 'Robot fabrikası', icon: '🤖', tech: 'robotik', era: 8, inputs: { electronics: 2, steel: 2 }, outputs: { robots: 1 }, workers: 3, gold: 4000, mat: { steel: 20, electronics: 6 }, turns: 6, industrial: true, desc: 'Otonom üretim.' },
];
export const IMP: Record<ImpId, ImpDef> = Object.fromEntries(IMPS.map((b) => [b.id, b])) as Record<ImpId, ImpDef>;

// ---------- şehir yapıları ----------
export type CbId = 'granary' | 'harbor' | 'market' | 'library' | 'walls' | 'barracks' | 'caravanserai' | 'university' | 'bank' | 'station' | 'powerplant' | 'lab' | 'spaceport';
export interface CbDef { id: CbId; name: string; icon: string; tech: TechId | null; gold: number; mat: Q; turns: number; coast?: boolean; desc: string }
export const CBS: CbDef[] = [
  { id: 'granary', name: 'Ambar', icon: '🏚️', tech: 'comlekcilik', gold: 40, mat: { wood: 10 }, turns: 3, desc: 'Nüfus %25 hızlı büyür.' },
  { id: 'harbor', name: 'Liman', icon: '⚓', tech: 'denizcilik', gold: 60, mat: { wood: 16, stone: 6 }, turns: 4, coast: true, desc: 'Deniz ticaret yolları; +2 yiyecek.' },
  { id: 'market', name: 'Pazar yeri', icon: '🏪', tech: 'para', gold: 80, mat: { stone: 10, wood: 8 }, turns: 4, desc: '+%20 altın, +1 ticaret yolu.' },
  { id: 'library', name: 'Kütüphane', icon: '📚', tech: 'yazi', gold: 70, mat: { stone: 10 }, turns: 4, desc: '+3 bilim.' },
  { id: 'walls', name: 'Surlar', icon: '🧱', tech: 'insaat', gold: 90, mat: { stone: 30 }, turns: 5, desc: 'Şehir savunması +15.' },
  { id: 'barracks', name: 'Kışla', icon: '⛺', tech: 'silahcilik', gold: 90, mat: { wood: 12, stone: 10 }, turns: 4, desc: 'Birlikler +%15 güçlü doğar.' },
  { id: 'caravanserai', name: 'Kervansaray', icon: '🐫', tech: 'kervansaray', gold: 140, mat: { stone: 20, planks: 6 }, turns: 4, desc: '+1 ticaret yolu, yollara +%20 gelir.' },
  { id: 'university', name: 'Üniversite', icon: '🎓', tech: 'matbaa', gold: 260, mat: { stone: 24, paper: 10 }, turns: 5, desc: '+7 bilim.' },
  { id: 'bank', name: 'Banka', icon: '🏦', tech: 'bankacilik', gold: 320, mat: { stone: 24, tools: 4 }, turns: 5, desc: '+%30 altın.' },
  { id: 'station', name: 'Tren istasyonu', icon: '🚉', tech: 'demiryolu', gold: 500, mat: { rails: 8, planks: 10 }, turns: 5, desc: 'Tren yolları; iki ucu istasyonlu yollarda tren.' },
  { id: 'powerplant', name: 'Santral', icon: '⚡', tech: 'elektrik', gold: 900, mat: { steel: 16, machinery: 3 }, turns: 6, desc: 'Şehir üretimi +%20 (krallık geneli +%3).' },
  { id: 'lab', name: 'Araştırma laboratuvarı', icon: '🔬', tech: 'internet', gold: 1600, mat: { electronics: 6, steel: 10 }, turns: 6, desc: '+16 bilim.' },
  { id: 'spaceport', name: 'Uzay limanı', icon: '🚀', tech: 'uzay', gold: 6000, mat: { steel: 60, electronics: 40, robots: 10 }, turns: 10, desc: 'Mars Kolonisi projesini başlatır: kazanan sen olursun.' },
];
export const CB: Record<CbId, CbDef> = Object.fromEntries(CBS.map((b) => [b.id, b])) as Record<CbId, CbDef>;

// ---------- birlikler ----------
export type UnitId = 'settler' | 'scout' | 'warrior' | 'archer' | 'spearman' | 'swordsman' | 'knight' | 'musketeer' | 'infantry' | 'artillery' | 'tank' | 'mech' | 'robotarmy';
export interface UnitDef {
  id: UnitId; name: string; icon: string; tech: TechId | null; era: number;
  str: number; moves: number; gold: number; cost: Q; upkeep: number; civil?: boolean; sight: number; desc: string;
}
export const UNITS: UnitDef[] = [
  { id: 'settler', name: 'Göçmenler', icon: '🏕️', tech: null, era: 0, str: 0, moves: 2, gold: 30, cost: { food: 25 }, upkeep: 0, civil: true, sight: 2, desc: 'Yeni şehir kurar (şehirden 1 nüfus alır).' },
  { id: 'scout', name: 'Öncü', icon: '🧭', tech: null, era: 0, str: 2, moves: 3, gold: 15, cost: { food: 4 }, upkeep: 0.2, civil: true, sight: 3, desc: 'Keşif yapar; savaşmaz.' },
  { id: 'warrior', name: 'Savaşçı', icon: '🪓', tech: null, era: 0, str: 8, moves: 2, gold: 20, cost: { food: 5 }, upkeep: 0.5, sight: 2, desc: 'Taş baltalı kabile savaşçısı.' },
  { id: 'archer', name: 'Okçu', icon: '🏹', tech: 'hayvancilik', era: 0, str: 11, moves: 2, gold: 30, cost: { wood: 4, food: 4 }, upkeep: 0.6, sight: 2, desc: 'Uzaktan saldırır.' },
  { id: 'spearman', name: 'Tunç mızrakçı', icon: '🔱', tech: 'tunc', era: 1, str: 16, moves: 2, gold: 45, cost: { bronze: 1, food: 5 }, upkeep: 0.8, sight: 2, desc: 'Tunç uçlu mızrak ve kalkan.' },
  { id: 'swordsman', name: 'Kılıçlı piyade', icon: '⚔️', tech: 'silahcilik', era: 2, str: 24, moves: 2, gold: 70, cost: { weapons: 1, food: 6 }, upkeep: 1, sight: 2, desc: 'Demir kılıç, lejyon düzeni.' },
  { id: 'knight', name: 'Şövalye', icon: '🐎', tech: 'feodalite', era: 3, str: 34, moves: 4, gold: 110, cost: { weapons: 2, food: 8 }, upkeep: 1.4, sight: 2, desc: 'Ağır zırhlı atlı.' },
  { id: 'musketeer', name: 'Tüfekli', icon: '🔫', tech: 'barut', era: 4, str: 46, moves: 2, gold: 150, cost: { gunpowder: 1, weapons: 1 }, upkeep: 1.8, sight: 2, desc: 'Barutlu tüfek.' },
  { id: 'infantry', name: 'Piyade', icon: '🎖️', tech: 'tufek', era: 5, str: 62, moves: 2, gold: 220, cost: { gunpowder: 2, steel: 1 }, upkeep: 2.4, sight: 2, desc: 'Yivli tüfek, siper.' },
  { id: 'artillery', name: 'Topçu', icon: '💣', tech: 'celik', era: 5, str: 70, moves: 2, gold: 300, cost: { steel: 3, gunpowder: 2 }, upkeep: 3, sight: 2, desc: 'Şehirlere karşı çok güçlü.' },
  { id: 'tank', name: 'Tank', icon: '🛡️', tech: 'motorlu', era: 6, str: 92, moves: 4, gold: 600, cost: { steel: 4, fuel: 3 }, upkeep: 4, sight: 2, desc: 'Zırhlı paletli araç.' },
  { id: 'mech', name: 'Mekanize piyade', icon: '🚙', tech: 'bilgisayar', era: 7, str: 116, moves: 4, gold: 900, cost: { steel: 3, electronics: 1, fuel: 2 }, upkeep: 5, sight: 3, desc: 'Zırhlı araç ve dronlar.' },
  { id: 'robotarmy', name: 'Robot birliği', icon: '🤖', tech: 'robotik', era: 8, str: 150, moves: 4, gold: 1500, cost: { robots: 2, fuel: 2 }, upkeep: 6, sight: 3, desc: 'Otonom savaş makineleri.' },
];
export const UNIT: Record<UnitId, UnitDef> = Object.fromEntries(UNITS.map((u) => [u.id, u])) as Record<UnitId, UnitDef>;

// ---------- taşıtlar (ticaret yolları) ----------
export interface VehicleDef { id: string; name: string; icon: string; tech: TechId | null; sea: boolean; speed: number; cap: number; station?: boolean }
export const VEHICLES: VehicleDef[] = [
  { id: 'hamal', name: 'Hamallar', icon: '🚶', tech: null, sea: false, speed: 2, cap: 6 },
  { id: 'esek', name: 'Eşek kervanı', icon: '🫏', tech: 'hayvancilik', sea: false, speed: 2, cap: 12 },
  { id: 'araba', name: 'Öküz arabası', icon: '🛒', tech: 'tekerlek', sea: false, speed: 3, cap: 22 },
  { id: 'kervan', name: 'Atlı kervan', icon: '🐫', tech: 'kervansaray', sea: false, speed: 4, cap: 36 },
  { id: 'tren', name: 'Buharlı tren', icon: '🚂', tech: 'demiryolu', sea: false, speed: 10, cap: 160, station: true },
  { id: 'kamyon', name: 'Kamyon', icon: '🚚', tech: 'otomobil', sea: false, speed: 9, cap: 110 },
  { id: 'maglev', name: 'Maglev', icon: '🚄', tech: 'maglev', sea: false, speed: 28, cap: 400, station: true },
  { id: 'sal', name: 'Sal', icon: '🛶', tech: 'balikcilik', sea: true, speed: 2, cap: 8 },
  { id: 'kadirga', name: 'Kadırga', icon: '⛵', tech: 'denizcilik', sea: true, speed: 4, cap: 30 },
  { id: 'yelkenli', name: 'Yelkenli', icon: '⛵', tech: 'pusula', sea: true, speed: 6, cap: 60 },
  { id: 'kalyon', name: 'Kalyon', icon: '🚢', tech: 'kartografya', sea: true, speed: 7, cap: 120 },
  { id: 'buharli', name: 'Buharlı gemi', icon: '🛳️', tech: 'buhar', sea: true, speed: 11, cap: 260 },
  { id: 'konteyner', name: 'Konteyner gemisi', icon: '🚢', tech: 'konteyner', sea: true, speed: 14, cap: 900 },
  { id: 'otonom', name: 'Otonom gemi', icon: '🛰️', tech: 'yapayzeka', sea: true, speed: 18, cap: 1400 },
];

// ---------- sabitler ----------
export const C = {
  MAX_PLAYERS: 32,
  TURN_MS: 8000, // yerel 1× hız
  CITY_MIN_DIST: 3,
  ORDER_FEE: 0.03,
  SELL_SPREAD: 0.9,
  BUY_SPREAD: 1.1,
  PRICE_EXP: 0.6,
  PRICE_MIN: 0.35,
  PRICE_MAX: 3,
  ORDER_EXPIRE_TURNS: 20,
  HIST_LEN: 60,
  CITY_SIGHT: 3,
  FUND_RATE: 0.3, // 1 altın → 0.3 bilim (akademi bağışı)
  MARS_COST: { gold: 8000, robots: 30, electronics: 60, fuel: 120 } as Record<string, number>,
};

export const PALETTE = ['#2b6cb0', '#c05621', '#2f855a', '#b83280', '#6b46c1', '#c53030', '#2c7a7b', '#b7791f', '#4a5568', '#d53f8c', '#38a169', '#dd6b20', '#3182ce', '#805ad5', '#e53e3e', '#319795'];
