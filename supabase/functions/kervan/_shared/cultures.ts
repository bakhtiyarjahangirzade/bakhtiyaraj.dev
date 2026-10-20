// Kültürler: her biri kendi bölgesinde göçebe bir kabile olarak başlar; artıları ve eksileri vardır.
import type { CityStyle } from './world.ts';

export interface Traits {
  farm?: number; prod?: number; mine?: number; science?: number; gold?: number; route?: number;
  landSpeed?: number; seaSpeed?: number; growth?: number; military?: number; build?: number; upkeep?: number;
}
export interface CultureDef {
  id: number; key: string; name: string; adj: string; color: string; lon: number; lat: number;
  style: CityStyle; traits: Traits; pros: string[]; cons: string[]; cities: string[];
}

export const CULTURES: CultureDef[] = [
  { id: 0, key: 'sumer', name: 'Sümerler', adj: 'Sümer', color: '#c58b2a', lon: 45.5, lat: 31.3, style: 'islamic',
    traits: { farm: 1.25, science: 1.1, mine: 0.8 }, pros: ['Dicle–Fırat: tarla verimi +%25', 'Çivi yazısı: bilim +%10'], cons: ['Taş ve maden kıt: madenler −%20'],
    cities: ['Uruk', 'Ur', 'Lagaş', 'Kiş', 'Eridu', 'Nippur', 'Umma', 'Larsa', 'Akşak', 'Şuruppak', 'Isin', 'Sippar'] },
  { id: 1, key: 'misir', name: 'Mısırlılar', adj: 'Mısır', color: '#d9b84a', lon: 31.2, lat: 29.9, style: 'islamic',
    traits: { farm: 1.2, build: 0.85, military: 0.9 }, pros: ['Nil taşkınları: tarla +%20', 'Usta inşaatçılar: yapılar %15 ucuz'], cons: ['Ordu gücü −%10'],
    cities: ['Memfis', 'Teb', 'Abydos', 'Nekhen', 'Buto', 'Sais', 'Heliopolis', 'Elephantine', 'Tanis', 'Amarna', 'Edfu', 'Kom Ombo'] },
  { id: 2, key: 'hitit', name: 'Hititler', adj: 'Hitit', color: '#8a4b2f', lon: 34.6, lat: 40.0, style: 'islamic',
    traits: { mine: 1.25, military: 1.1, route: 0.85 }, pros: ['Demirin efendileri: madenler +%25', 'Savaş arabaları: ordu +%10'], cons: ['Dağlık yollar: ticaret geliri −%15'],
    cities: ['Hattuşa', 'Kaniş', 'Alacahöyük', 'Şapinuva', 'Tarsa', 'Kargamış', 'Nerik', 'Arinna', 'Zippalanda', 'Ankuva', 'Samuha', 'Kuşşara'] },
  { id: 3, key: 'cin', name: 'Çinliler', adj: 'Çin', color: '#c0392b', lon: 113.5, lat: 34.8, style: 'eastasia',
    traits: { science: 1.15, growth: 1.1, seaSpeed: 0.8 }, pros: ['Hanedan bürokrasisi: bilim +%15', 'Kalabalık ovalar: büyüme +%10'], cons: ['İçe dönük: deniz hızı −%20'],
    cities: ['Anyang', 'Haojing', 'Luoyang', 'Linzi', 'Handan', 'Xianyang', 'Changan', 'Ying', 'Jinyang', 'Kaifeng', 'Nanjing', 'Hangzhou'] },
  { id: 4, key: 'hint', name: 'İndus Halkı', adj: 'İndus', color: '#e67e22', lon: 72.0, lat: 29.5, style: 'southasia',
    traits: { prod: 1.1, growth: 1.1, military: 0.9 }, pros: ['Usta zanaatkârlar: üretim +%10', 'Bereketli muson: büyüme +%10'], cons: ['Barışçıl: ordu −%10'],
    cities: ['Harappa', 'Mohenjo-daro', 'Lothal', 'Kalibangan', 'Dholavira', 'Pataliputra', 'Taksila', 'Ujjain', 'Varanasi', 'Mathura', 'Kanauj', 'Madurai'] },
  { id: 5, key: 'yunan', name: 'Yunanlar', adj: 'Yunan', color: '#2e86c1', lon: 23.7, lat: 38.0, style: 'europe',
    traits: { science: 1.2, seaSpeed: 1.2, farm: 0.85 }, pros: ['Akademi: bilim +%20', 'Ege denizcileri: gemi hızı +%20'], cons: ['Kayalık toprak: tarla −%15'],
    cities: ['Atina', 'Sparta', 'Korint', 'Argos', 'Miletos', 'Delfi', 'Efes', 'Rodos', 'Siraküza', 'Olympia', 'Pella', 'Knossos'] },
  { id: 6, key: 'roma', name: 'Romalılar', adj: 'Roma', color: '#8e44ad', lon: 12.5, lat: 41.9, style: 'europe',
    traits: { build: 0.85, military: 1.1, upkeep: 1.15, landSpeed: 1.15 }, pros: ['Roma yolları: kara hızı +%15', 'Lejyonlar: ordu +%10, yapılar %15 ucuz'], cons: ['Büyük devlet: bakım +%15'],
    cities: ['Roma', 'Capua', 'Ostia', 'Pompei', 'Mediolanum', 'Ravenna', 'Neapolis', 'Aquileia', 'Verona', 'Brundisium', 'Florentia', 'Genua'] },
  { id: 7, key: 'pers', name: 'Persler', adj: 'Pers', color: '#16a085', lon: 52.9, lat: 30.0, style: 'islamic',
    traits: { route: 1.25, gold: 1.1, science: 0.9 }, pros: ['Kral yolu: ticaret geliri +%25', 'Satraplıklar: altın +%10'], cons: ['Bilim −%10'],
    cities: ['Persepolis', 'Pasargad', 'Susa', 'Ekbatana', 'Ray', 'İsfahan', 'Merv', 'Herat', 'Tus', 'Nişabur', 'Şiraz', 'Tebriz'] },
  { id: 8, key: 'turk', name: 'Türkler', adj: 'Türk', color: '#1abc9c', lon: 101.5, lat: 47.3, style: 'islamic',
    traits: { landSpeed: 1.3, military: 1.1, farm: 0.9, growth: 0.95 }, pros: ['Bozkır atlıları: kara hızı +%30', 'Ordu +%10, mera +%30'], cons: ['Göçebe gelenek: tarla −%10, büyüme −%5'],
    cities: ['Ötüken', 'Karabalgasun', 'Balasagun', 'Kaşgar', 'Otrar', 'Yesi', 'Taraz', 'Hoten', 'Beşbalık', 'Turfan', 'Semerkant', 'Buhara'] },
  { id: 9, key: 'arap', name: 'Araplar', adj: 'Arap', color: '#27ae60', lon: 39.8, lat: 21.4, style: 'islamic',
    traits: { route: 1.3, science: 1.05, farm: 0.8 }, pros: ['Baharat yolu: ticaret geliri +%30', 'Beytülhikme: bilim +%5'], cons: ['Çöl: tarla −%20'],
    cities: ['Mekke', 'Medine', 'Sana', 'Taif', 'Petra', 'Hicr', 'Necran', 'Ubulla', 'Dumat', 'Hayber', 'Maskat', 'Aden'] },
  { id: 10, key: 'viking', name: 'İskandinavlar', adj: 'İskandinav', color: '#7f8c8d', lon: 10.7, lat: 59.9, style: 'europe',
    traits: { seaSpeed: 1.35, military: 1.1, farm: 0.85, growth: 0.95 }, pros: ['Uzun gemiler: deniz hızı +%35', 'Akıncılar: ordu +%10'], cons: ['Soğuk toprak: tarla −%15'],
    cities: ['Kaupang', 'Birka', 'Hedeby', 'Uppsala', 'Nidaros', 'Ribe', 'Roskilde', 'Sigtuna', 'Bergen', 'Lund', 'Visby', 'Jelling'] },
  { id: 11, key: 'maya', name: 'Mayalar', adj: 'Maya', color: '#d35400', lon: -89.6, lat: 17.2, style: 'americas',
    traits: { science: 1.15, farm: 1.1, landSpeed: 0.85 }, pros: ['Takvim ustaları: bilim +%15', 'Mısır tarımı: tarla +%10'], cons: ['Yük hayvanı yok: kara hızı −%15'],
    cities: ['Tikal', 'Palenque', 'Copán', 'Calakmul', 'Chichén Itzá', 'Uxmal', 'Caracol', 'Mayapán', 'Cobá', 'Yaxchilán', 'Tulum', 'El Mirador'] },
  { id: 12, key: 'japon', name: 'Japonlar', adj: 'Japon', color: '#e84393', lon: 135.5, lat: 34.7, style: 'eastasia',
    traits: { prod: 1.12, military: 1.1, mine: 0.85 }, pros: ['Monozukuri: üretim +%12', 'Samuray: ordu +%10'], cons: ['Ada ülkesi: madenler −%15'],
    cities: ['Nara', 'Kyoto', 'Edo', 'Osaka', 'Kamakura', 'Nagoya', 'Sendai', 'Hiroşima', 'Kagoşima', 'Nagasaki', 'Kanazawa', 'Sapporo'] },
  { id: 13, key: 'mali', name: 'Mali Halkı', adj: 'Mali', color: '#f1c40f', lon: -4.0, lat: 14.5, style: 'africa',
    traits: { gold: 1.2, mine: 1.15, science: 0.9 }, pros: ['Altın yolları: altın +%20', 'Madenler +%15'], cons: ['Bilim −%10'],
    cities: ['Timbuktu', 'Gao', 'Cenne', 'Niani', 'Kumbi Saleh', 'Walata', 'Kangaba', 'Segu', 'Mopti', 'Bamako', 'Tadmekka', 'Kukiya'] },
];

export const T = (c: number, k: keyof Traits) => CULTURES[c]?.traits[k] ?? 1;
