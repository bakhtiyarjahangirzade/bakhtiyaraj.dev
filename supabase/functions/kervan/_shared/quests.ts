// Görev zinciri: oyunu adım adım öğretir, her adımda küçük ödül verir (idle ilerleme hissi).
import { IMP } from './defs.ts';
import { log, realmCities, routeSlots, type GameState, type Realm } from './sim.ts';

export interface QuestDef { id: string; title: string; hint: string; reward: { gold?: number; sci?: number }; done: (s: GameState, R: Realm) => boolean }

const imps = (s: GameState, R: Realm) => s.imps.filter((i) => i.realm === R.id);
export const QUESTS: QuestDef[] = [
  { id: 'kur', title: 'Yurt kur', hint: 'Göçmenleri seç, "Şehir kur" (B). Nehir ve kıyı kenarı iyidir.', reward: { gold: 30 }, done: (s, R) => realmCities(s, R.id).length >= 1 },
  { id: 'av', title: 'Avcıları gönder', hint: 'Toprağındaki bir hex\'i seç, Av kampı ya da Oduncu kur.', reward: { gold: 25 }, done: (s, R) => imps(s, R).length >= 2 },
  { id: 'tarim', title: 'Tarımı keşfet', hint: 'Araştırma (T): Tarım. Tarlalar çok daha fazla yiyecek verir.', reward: { sci: 10 }, done: (_s, R) => R.techs.includes('tarim') },
  { id: 'tarla', title: 'İlk tarla', hint: 'Verimli bir hex\'e Tarla kur. Nehir kenarı +%25.', reward: { gold: 40 }, done: (s, R) => imps(s, R).some((i) => i.type === 'farm') },
  { id: 'yol', title: 'İlk kervan', hint: 'Şehrini seç → Ticaret → bir şehre tıkla. Yabancı şehirler daha kârlı.', reward: { gold: 50 }, done: (s, R) => s.routes.some((r) => r.realm === R.id) },
  { id: 'nufus', title: 'Kalabalık köy', hint: 'Yiyecek fazlası şehri büyütür. Ambar büyümeyi hızlandırır.', reward: { gold: 60 }, done: (_s, R) => R.stats.pop >= 5 },
  { id: 'ikinci', title: 'İkinci şehir', hint: 'Şehirden Göçmenler yetiştir (nüfus 2+) ve yeni bir yurt kur.', reward: { gold: 80 }, done: (s, R) => realmCities(s, R.id).length >= 2 },
  { id: 'kamp', title: 'Haydutları dağıt', hint: 'Savaşçı ya da okçunu seç, kampa sağ tıkla. Ganimet verir.', reward: { gold: 60 }, done: (s, R) => s.log.some((l) => l.realm === R.id && l.text.includes('haydut kampını dağıttı')) },
  { id: 'tunc', title: 'Tunç Çağı', hint: 'Tunç Çağı\'nın iki buluşunu araştır.', reward: { gold: 100, sci: 20 }, done: (_s, R) => R.era >= 1 },
  { id: 'vali', title: 'Vali ata', hint: 'Krallık (K) → Vali: sen yokken şehirlerin kendi kendine gelişsin.', reward: { gold: 60 }, done: (_s, R) => R.auto.build || R.auto.imps },
  { id: 'atolye', title: 'İlk atölye', hint: 'Çömlekçi ya da Dokumacı kur: ham malı işle, değerini katla.', reward: { gold: 80 }, done: (s, R) => imps(s, R).some((i) => IMP[i.type].inputs && Object.keys(IMP[i.type].inputs).length > 0) },
  { id: 'uc', title: 'Üç şehir', hint: 'Toprağını genişlet: üç şehir.', reward: { gold: 150 }, done: (s, R) => realmCities(s, R.id).length >= 3 },
  { id: 'iki_yol', title: 'Ticaret ağı', hint: 'Tüm ticaret yolu yuvalarını doldur.', reward: { gold: 120 }, done: (s, R) => s.routes.filter((r) => r.realm === R.id).length >= Math.min(3, routeSlots(s, R.id)) },
  { id: 'demir', title: 'Demir Çağı', hint: 'Demir Çağı\'na gir.', reward: { gold: 200, sci: 40 }, done: (_s, R) => R.era >= 2 },
  { id: 'harika', title: 'Bir harika', hint: 'Şehrini seç → Harikalar. Dünyada ilk bitiren kazanır.', reward: { gold: 300 }, done: (s, R) => realmCities(s, R.id).some((c) => c.wonders.length > 0) },
  { id: 'anlasma', title: 'Komşuyla anlaş', hint: 'Diplomasi (D): ilişkin 15+ olan biriyle ticaret anlaşması yap.', reward: { gold: 200 }, done: (_s, R) => R.pacts.length > 0 || R.allies.length > 0 },
  { id: 'orta', title: 'Orta Çağ', hint: 'Orta Çağ\'a gir.', reward: { gold: 400, sci: 80 }, done: (_s, R) => R.era >= 3 },
  { id: 'bes', title: 'Beş şehir', hint: 'Beş şehirli bir krallık.', reward: { gold: 500 }, done: (s, R) => realmCities(s, R.id).length >= 5 },
  { id: 'ronesans', title: 'Rönesans', hint: 'Matbaa ve barut seni bekliyor.', reward: { gold: 800, sci: 150 }, done: (_s, R) => R.era >= 4 },
  { id: 'sanayi', title: 'Sanayi Devrimi', hint: 'Buhar gücüyle Sanayi Çağı\'na gir; trenler gelir.', reward: { gold: 1500, sci: 300 }, done: (_s, R) => R.era >= 5 },
  { id: 'modern', title: 'Modern Çağ', hint: 'Elektrik ve petrol.', reward: { gold: 2500, sci: 500 }, done: (_s, R) => R.era >= 6 },
  { id: 'bilgi', title: 'Bilgi Çağı', hint: 'Bilgisayar ve küresel ticaret.', reward: { gold: 4000, sci: 800 }, done: (_s, R) => R.era >= 7 },
  { id: 'gelecek', title: 'Gelecek Çağı', hint: 'Robotlar ve füzyon.', reward: { gold: 6000, sci: 1200 }, done: (_s, R) => R.era >= 8 },
  { id: 'mars', title: 'Mars Kolonisi', hint: 'Uzay limanı kur, Mars Kolonisi\'ni gönder.', reward: {}, done: (s, R) => s.ended?.winner === R.id },
];

/** Sıradaki üç görev (tamamlanmamış, sırayla). */
export function activeQuests(R: Realm) { return QUESTS.filter((q) => !(R.qdone ?? []).includes(q.id)).slice(0, 3); }

export function checkQuests(s: GameState) {
  for (const R of s.realms) {
    if (R.kind !== 'player' || !R.alive) continue;
    R.qdone ??= [];
    for (const q of activeQuests(R)) {
      if (!q.done(s, R)) continue;
      if (q.reward.gold) R.gold += q.reward.gold;
      if (q.reward.sci) R.science += q.reward.sci;
      R.qdone.push(q.id); R.quest = R.qdone.length;
      log(s, `🎯 Görev tamamlandı: ${q.title}${q.reward.gold ? ` · +${q.reward.gold} altın` : ''}${q.reward.sci ? ` · +${q.reward.sci} bilim` : ''}`, 'build', R.id);
    }
  }
}
