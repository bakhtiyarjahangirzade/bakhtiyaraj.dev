// Gerçek Dünya üzerinde Civilization tarzı hex dünya.
// Kara/su ve ülkeler Natural Earth'ten (earthData.ts); yükselti, iklim ve kaynaklar koddan.
// Eyalet (bölge) = komşu hex'lerden oluşan grup; sahiplik eyalet bazında, binalar hex bazında.
import { RES_KEYS, type ResKey } from './defs.ts';
import { COUNTRY_NAMES, EARTH, EARTH_CELLS } from './earthData.ts';
import { fbm, mulberry32 } from './rng.ts';

export const HEX_R = 1;
export const SQ3 = Math.sqrt(3);

export type Terrain = 'deep' | 'shallow' | 'grass' | 'plains' | 'desert' | 'tundra' | 'snow' | 'hills' | 'mountain';
export type Feature = 'forest' | 'jungle' | 'taiga' | null;

export const TERRAIN_NAMES: Record<Terrain, string> = {
  deep: 'Açık deniz', shallow: 'Kıyı suyu', grass: 'Çayır', plains: 'Ova', desert: 'Çöl',
  tundra: 'Tundra', snow: 'Buzul', hills: 'Tepe', mountain: 'Dağ',
};
export const FEATURE_NAMES: Record<string, string> = { forest: 'Orman', jungle: 'Yağmur ormanı', taiga: 'Tayga' };

export interface Hex {
  i: number; c: number; r: number; x: number; z: number; lon: number; lat: number;
  land: boolean; country: number; terrain: Terrain; feature: Feature; elev: number; river: boolean;
  res: Record<ResKey, number>; prov: number; coast: boolean; nb: number[];
}

export interface RegionStatic {
  id: number; name: string; cx: number; cz: number; hex: number; // merkez hex
  cells: number; hexes: number[]; neighbors: number[]; sea: { to: number; d: number }[];
  res: Record<ResKey, number>; coast: boolean; height: number; country: string;
  nation0: number; lon: number; lat: number; // 1850 başlangıç ulusu
}

export interface TownStatic { id: number; region: number; name: string; size: 1 | 2 | 3; hex: number; style: CityStyle }
export type CityStyle = 'europe' | 'islamic' | 'eastasia' | 'southasia' | 'africa' | 'americas';

export interface WorldMap {
  seed: number; N: number; COLS: number; ROWS: number; W: number; H: number;
  hexes: Hex[];
  height: Float32Array; // hex yükseltisi (eski API ile uyum)
  regionOf: Int16Array;
  regions: RegionStatic[];
  towns: TownStatic[];
  rivers: number[][]; // kaynaktan denize hex dizileri
}

// ---------- Türkçe ülke adları (sık görülenler) ----------
const TR: Record<string, string> = {
  Turkey: 'Anadolu', Azerbaijan: 'Azerbaycan', Iran: 'İran', Iraq: 'Irak', Syria: 'Suriye', Egypt: 'Mısır', Greece: 'Yunanistan',
  Italy: 'İtalya', France: 'Fransa', Spain: 'İspanya', Portugal: 'Portekiz', Germany: 'Almanya', Poland: 'Lehistan', Russia: 'Rusya',
  Ukraine: 'Ukrayna', Kazakhstan: 'Kazak bozkırı', Uzbekistan: 'Maveraünnehir', Turkmenistan: 'Türkmen ili', Afghanistan: 'Horasan',
  Pakistan: 'Sind', India: 'Hindistan', China: 'Çin', Mongolia: 'Moğolistan', Japan: 'Japonya', Korea: 'Kore', 'South Korea': 'Kore',
  'North Korea': 'Kuzey Kore', 'Saudi Arabia': 'Arabistan', Yemen: 'Yemen', Oman: 'Umman', Libya: 'Libya', Algeria: 'Cezayir',
  Morocco: 'Fas', Tunisia: 'Tunus', Sudan: 'Sudan', Ethiopia: 'Habeşistan', Somalia: 'Somali', Kenya: 'Kenya', Tanzania: 'Tanzanya',
  'United Kingdom': 'Britanya', Ireland: 'İrlanda', Norway: 'Norveç', Sweden: 'İsveç', Finland: 'Finlandiya', Denmark: 'Danimarka',
  Austria: 'Avusturya', Hungary: 'Macaristan', Romania: 'Eflak', Bulgaria: 'Bulgaristan', Serbia: 'Sırbistan', Georgia: 'Gürcistan',
  Armenia: 'Ermenistan', Brazil: 'Brezilya', Argentina: 'Arjantin', Peru: 'Peru', Mexico: 'Meksika', 'United States of America': 'Kuzey Amerika',
  Canada: 'Kanada', Australia: 'Avustralya', Indonesia: 'Endonezya', Thailand: 'Siyam', Vietnam: 'Viet', Myanmar: 'Burma', Cambodia: 'Kmer',
  Malaysia: 'Malaya', Philippines: 'Filipinler', Chile: 'Şili', Colombia: 'Kolombiya', Venezuela: 'Venezuela', Bolivia: 'Bolivya',
  Mali: 'Mali', Niger: 'Nijer', Nigeria: 'Nijerya', Chad: 'Çad', 'Dem. Rep. Congo': 'Kongo', Angola: 'Angola', 'South Africa': 'Güney Afrika',
  Madagascar: 'Madagaskar', Mozambique: 'Mozambik', Zimbabwe: 'Zimbabve', Greenland: 'Grönland', Iceland: 'İzlanda', Belarus: 'Beyaz Rusya',
  Kyrgyzstan: 'Kırgız', Tajikistan: 'Tacik', Nepal: 'Nepal', Bangladesh: 'Bengal', 'Sri Lanka': 'Seylan', Jordan: 'Ürdün', Israel: 'Filistin',
  Lebanon: 'Lübnan', Kuwait: 'Kuveyt', Mauritania: 'Moritanya', 'W. Sahara': 'Batı Sahra', Namibia: 'Namibya', Botswana: 'Botsvana',
  Zambia: 'Zambiya', Cameroon: 'Kamerun', Gabon: 'Gabon', Ghana: 'Gana', Guinea: 'Gine', Senegal: 'Senegal', 'New Zealand': 'Yeni Zelanda',
  Netherlands: 'Felemenk', Belgium: 'Flandra', Switzerland: 'İsviçre', Czechia: 'Bohemya', Slovakia: 'Slovakya', Croatia: 'Hırvatistan',
  'Bosnia and Herz.': 'Bosna', Albania: 'Arnavutluk', Moldova: 'Boğdan', Lithuania: 'Litvanya', Latvia: 'Letonya', Estonia: 'Estonya',
};

// ---------- Gerçek şehirler (ticaret çağı) ----------
const CITIES: { name: string; lon: number; lat: number; size: 1 | 2 | 3 }[] = [
  { name: 'İstanbul', lon: 28.98, lat: 41.01, size: 3 }, { name: 'İzmir', lon: 27.14, lat: 38.42, size: 2 }, { name: 'Selanik', lon: 22.94, lat: 40.64, size: 2 },
  { name: 'Bakü', lon: 49.87, lat: 40.41, size: 2 }, { name: 'Tebriz', lon: 46.29, lat: 38.08, size: 2 }, { name: 'Tahran', lon: 51.39, lat: 35.69, size: 2 },
  { name: 'İsfahan', lon: 51.67, lat: 32.65, size: 2 }, { name: 'Bağdat', lon: 44.36, lat: 33.31, size: 2 }, { name: 'Şam', lon: 36.29, lat: 33.51, size: 2 },
  { name: 'Kahire', lon: 31.24, lat: 30.04, size: 3 }, { name: 'İskenderiye', lon: 29.92, lat: 31.2, size: 2 }, { name: 'Mekke', lon: 39.83, lat: 21.42, size: 2 },
  { name: 'Venedik', lon: 12.33, lat: 45.44, size: 2 }, { name: 'Ceneviz', lon: 8.93, lat: 44.41, size: 2 }, { name: 'Paris', lon: 2.35, lat: 48.86, size: 3 },
  { name: 'Londra', lon: -0.13, lat: 51.5, size: 3 }, { name: 'Manchester', lon: -2.24, lat: 53.48, size: 2 }, { name: 'Lizbon', lon: -9.14, lat: 38.72, size: 2 },
  { name: 'Madrid', lon: -3.7, lat: 40.42, size: 2 }, { name: 'Berlin', lon: 13.4, lat: 52.52, size: 2 }, { name: 'Viyana', lon: 16.37, lat: 48.21, size: 3 },
  { name: 'Amsterdam', lon: 4.9, lat: 52.37, size: 2 }, { name: 'Lübeck', lon: 10.69, lat: 53.87, size: 1 }, { name: 'Sankt-Peterburg', lon: 30.31, lat: 59.94, size: 3 },
  { name: 'Moskova', lon: 37.62, lat: 55.75, size: 2 }, { name: 'Kiev', lon: 30.52, lat: 50.45, size: 2 }, { name: 'Kazan', lon: 49.1, lat: 55.8, size: 1 },
  { name: 'Kefe', lon: 35.38, lat: 45.03, size: 1 }, { name: 'Semerkant', lon: 66.96, lat: 39.65, size: 2 }, { name: 'Buhara', lon: 64.42, lat: 39.77, size: 2 },
  { name: 'Herat', lon: 62.2, lat: 34.35, size: 1 }, { name: 'Delhi', lon: 77.2, lat: 28.6, size: 2 }, { name: 'Kalküta', lon: 88.36, lat: 22.57, size: 3 },
  { name: 'Bombay', lon: 72.88, lat: 19.08, size: 2 }, { name: 'Kalikut', lon: 75.78, lat: 11.25, size: 1 }, { name: 'Singapur', lon: 103.82, lat: 1.35, size: 2 },
  { name: 'Batavya', lon: 106.85, lat: -6.2, size: 2 }, { name: 'Kanton', lon: 113.26, lat: 23.13, size: 3 }, { name: 'Şanghay', lon: 121.47, lat: 31.23, size: 2 },
  { name: 'Pekin', lon: 116.4, lat: 39.9, size: 3 }, { name: 'Kaşgar', lon: 75.99, lat: 39.47, size: 1 }, { name: 'Edo', lon: 139.69, lat: 35.69, size: 3 },
  { name: 'Kyoto', lon: 135.77, lat: 35.01, size: 2 }, { name: 'Bangkok', lon: 100.5, lat: 13.75, size: 2 }, { name: 'Manila', lon: 120.98, lat: 14.6, size: 1 },
  { name: 'Timbuktu', lon: -3.0, lat: 16.77, size: 1 }, { name: 'Zanzibar', lon: 39.2, lat: -6.16, size: 1 }, { name: 'Aden', lon: 45.03, lat: 12.8, size: 1 },
  { name: 'Hürmüz', lon: 56.3, lat: 27.1, size: 1 }, { name: 'Tunus', lon: 10.18, lat: 36.8, size: 1 }, { name: 'Cezayir', lon: 3.06, lat: 36.75, size: 2 },
  { name: 'Lagos', lon: 3.39, lat: 6.45, size: 1 }, { name: 'Kap', lon: 18.42, lat: -33.92, size: 1 }, { name: 'Sidney', lon: 151.2, lat: -33.87, size: 1 },
  { name: 'Washington', lon: -77.04, lat: 38.9, size: 2 }, { name: 'New York', lon: -74.0, lat: 40.71, size: 3 }, { name: 'New Orleans', lon: -90.07, lat: 29.95, size: 2 },
  { name: 'St. Louis', lon: -90.2, lat: 38.63, size: 1 }, { name: 'San Francisco', lon: -122.42, lat: 37.77, size: 1 }, { name: 'Meksiko', lon: -99.13, lat: 19.43, size: 2 },
  { name: 'Havana', lon: -82.37, lat: 23.11, size: 2 }, { name: 'Rio de Janeiro', lon: -43.2, lat: -22.9, size: 2 }, { name: 'Buenos Aires', lon: -58.38, lat: -34.6, size: 1 },
  { name: 'Lima', lon: -77.04, lat: -12.05, size: 1 },
];
export const CITY_NAMES = CITIES.map((c) => c.name);

// ---------- Yükselti: dağ sıraları (boylam, enlem) ----------
const RANGES: { pts: [number, number][]; h: number; w: number }[] = [
  { pts: [[72, 35], [78, 32], [84, 28.6], [90, 28], [95, 29]], h: 1, w: 3 }, // Himalaya
  { pts: [[66, 35], [71, 36.5], [75, 38]], h: 0.95, w: 2.5 }, // Pamir/Hindukuş
  { pts: [[70, 41.5], [80, 42], [88, 43]], h: 0.8, w: 2.2 }, // Tanrı dağları
  { pts: [[84, 50], [92, 49], [98, 47]], h: 0.7, w: 2.2 }, // Altay
  { pts: [[45, 37], [49, 33], [53, 30], [57, 28]], h: 0.7, w: 2 }, // Zagros
  { pts: [[48, 37], [53, 36.4], [58, 37]], h: 0.7, w: 1.4 }, // Elburz
  { pts: [[38, 44], [44, 42.7], [49, 41]], h: 0.85, w: 1.4 }, // Kafkas
  { pts: [[29, 37], [33, 37], [37, 37.6], [42, 38.6]], h: 0.6, w: 1.5 }, // Toros
  { pts: [[6, 44.5], [8, 46], [11, 47], [15, 47]], h: 0.85, w: 1.4 }, // Alpler
  { pts: [[-1.5, 43], [3, 42.6]], h: 0.6, w: 1 }, // Pireneler
  { pts: [[18, 49], [23, 48.5], [25.5, 46], [22.5, 45]], h: 0.55, w: 1.3 }, // Karpatlar
  { pts: [[19, 43], [22, 42], [25, 42.5]], h: 0.5, w: 1.2 }, // Balkan
  { pts: [[6, 59], [10, 62], [14, 65], [18, 68], [22, 69.5]], h: 0.6, w: 1.8 }, // İskandinav
  { pts: [[59, 50], [59, 56], [60, 62], [64, 67]], h: 0.5, w: 1.6 }, // Ural
  { pts: [[-8, 31], [-2, 33], [4, 35], [9, 35.6]], h: 0.65, w: 1.6 }, // Atlas
  { pts: [[37, 7], [39, 10], [39, 14]], h: 0.7, w: 2.5 }, // Habeş yaylası
  { pts: [[30, -2], [35, -3], [35, -9]], h: 0.6, w: 2 }, // Doğu Afrika
  { pts: [[27, -31], [30, -28]], h: 0.55, w: 1.3 }, // Drakensberg
  { pts: [[-120, 60], [-121, 54], [-115, 48], [-110, 43], [-107, 38], [-106, 33]], h: 0.85, w: 3 }, // Rocky
  { pts: [[-122, 48], [-121, 42], [-118, 36]], h: 0.6, w: 1.4 }, // Sierra
  { pts: [[-106, 28], [-102, 22], [-98, 18]], h: 0.65, w: 2 }, // Sierra Madre
  { pts: [[-84, 34], [-80, 37], [-77, 40], [-73, 43]], h: 0.45, w: 1.8 }, // Appalaş
  { pts: [[-74, 10], [-77, 3], [-78.5, -2], [-76, -10], [-70, -16], [-68.5, -22], [-70, -30], [-71, -40], [-72.5, -48], [-73, -52]], h: 1, w: 2.4 }, // And
  { pts: [[146, -17], [148, -25], [150, -32], [147.5, -37]], h: 0.45, w: 1.8 }, // Büyük Set
  { pts: [[136, 35.5], [139, 37], [140, 39]], h: 0.6, w: 1.2 }, // Japon Alpleri
  { pts: [[98, 26], [100, 22], [101, 18]], h: 0.5, w: 2 }, // Yunnan
];
const PLATEAUS: { lon: [number, number]; lat: [number, number]; h: number }[] = [
  { lon: [78, 100], lat: [29, 37], h: 0.75 }, // Tibet
  { lon: [35, 44], lat: [38, 41], h: 0.4 }, // Anadolu yaylası
  { lon: [46, 60], lat: [29, 36], h: 0.35 }, // İran yaylası
  { lon: [90, 118], lat: [41, 49], h: 0.35 }, // Moğol yaylası
  { lon: [-70, -66], lat: [-24, -15], h: 0.8 }, // Altiplano
  { lon: [-50, -40], lat: [-22, -10], h: 0.25 }, // Brezilya yaylası
  { lon: [-112, -104], lat: [35, 44], h: 0.45 }, // Colorado
];
type Box = { lon: [number, number]; lat: [number, number] };
const DESERTS: Box[] = [
  { lon: [-16, 33], lat: [16, 31] }, { lon: [34, 58], lat: [15, 31] }, { lon: [55, 64], lat: [26, 33] }, { lon: [69, 75], lat: [24, 29] },
  { lon: [77, 112], lat: [37, 45] }, { lon: [52, 66], lat: [37, 45] }, { lon: [118, 143], lat: [-31, -19] }, { lon: [12, 25], lat: [-28, -17] },
  { lon: [-72, -68], lat: [-28, -16] }, { lon: [-118, -105], lat: [30, 37] }, { lon: [43, 50], lat: [-1, 10] },
];
const JUNGLES: Box[] = [
  { lon: [-76, -47], lat: [-12, 5] }, { lon: [9, 30], lat: [-5, 5] }, { lon: [95, 152], lat: [-9, 16] }, { lon: [-92, -77], lat: [7, 19] },
  { lon: [-6, 9], lat: [4, 8] }, { lon: [73, 78], lat: [8, 16] },
];
const COAL: Box[] = [
  { lon: [-5, 2], lat: [51, 56.5] }, { lon: [4, 9], lat: [49.5, 52] }, { lon: [16, 20.5], lat: [49.3, 51.2] }, { lon: [36.5, 40.5], lat: [47, 49.5] },
  { lon: [-83, -75], lat: [37, 42] }, { lon: [109, 115], lat: [34.5, 40.5] }, { lon: [84, 89], lat: [52.5, 56.5] }, { lon: [30.8, 33], lat: [40.9, 41.7] },
  { lon: [149.5, 152.5], lat: [-34, -31.5] }, { lon: [27.5, 31.5], lat: [-28.5, -24.5] }, { lon: [84.5, 87.5], lat: [22.5, 24.8] }, { lon: [-88, -84], lat: [36, 40] },
];
const COTTON: Box[] = [
  { lon: [29.5, 33], lat: [23.5, 31.6] }, { lon: [-97, -77], lat: [30, 36.5] }, { lon: [72, 80], lat: [15, 23.5] }, { lon: [59, 73], lat: [37.5, 42.5] },
  { lon: [-42, -34], lat: [-10, -4] }, { lon: [32, 37.5], lat: [36.5, 38] },
];
const SUGAR: Box[] = [
  { lon: [-86, -60], lat: [10, 24] }, { lon: [-50, -34], lat: [-24, -5] }, { lon: [105, 115], lat: [-9, -5.5] }, { lon: [86, 92], lat: [21, 26] },
  { lon: [-93.5, -89], lat: [28.8, 31] }, { lon: [119, 125], lat: [8, 17] }, { lon: [55, 58], lat: [-21.5, -19.5] }, { lon: [150, 154], lat: [-29, -17] },
];
const OIL: Box[] = [
  { lon: [44, 56], lat: [24, 32] }, { lon: [47, 51], lat: [38, 41] }, { lon: [-104, -93], lat: [26, 37] }, { lon: [-73, -60], lat: [5, 11] },
  { lon: [3, 9], lat: [4, 7] }, { lon: [64, 80], lat: [58, 66] }, { lon: [-120, -110], lat: [53, 59] }, { lon: [1, 8], lat: [56, 62] },
  { lon: [5, 11], lat: [27, 32] }, { lon: [16, 22], lat: [27, 31] }, { lon: [-152, -146], lat: [69, 71] }, { lon: [100, 118], lat: [-2, 4] },
];
const RIVERS: [number, number][][] = [
  [[33, -2], [32.5, 3], [31.5, 9], [32.5, 15.6], [33.5, 19], [32.9, 24], [31.2, 30], [31, 31.6]], // Nil
  [[42, 38], [43.1, 36.3], [44.4, 33.3], [46.5, 31], [48.2, 29.9]], // Dicle
  [[39, 39.5], [38.5, 36.8], [40.5, 35], [43, 33.7], [45.5, 31.5], [47, 30.5], [48.2, 29.9]], // Fırat
  [[80, 32], [77, 34.5], [74, 35.5], [72, 33.5], [71.5, 30], [68.5, 26], [67.5, 23.8]], // İndus
  [[79, 30.9], [80.3, 27], [83, 25.5], [86, 25.3], [88.5, 23.5], [89.5, 21.8]], // Ganj
  [[96, 35], [101.7, 36], [104, 37], [107, 40.5], [110.5, 39], [110.5, 35], [113, 34.8], [116, 36], [118.8, 37.7]], // Sarı Irmak
  [[92, 33], [98, 31], [102, 27], [104.6, 28.8], [107, 29.6], [111.3, 30.7], [114.3, 30.6], [117, 31], [121.8, 31.4]], // Yangtze
  [[8.5, 48], [11, 48.8], [16.4, 48.2], [19, 47.5], [20, 45.3], [22.5, 44.6], [25.5, 43.7], [28, 45], [29.8, 45.2]], // Tuna
  [[9.5, 46.9], [8, 47.6], [7.6, 48.6], [8.3, 49.9], [7, 50.9], [6.2, 51.8], [4.1, 51.9]], // Ren
  [[33, 57], [37, 57.5], [40, 57.7], [44, 56.3], [48.7, 55.8], [49.2, 53.2], [46, 51.5], [44.5, 48.7], [48, 46.3], [48.5, 45.8]], // Volga
  [[33, 55], [30.5, 53.9], [30.5, 50.5], [33, 49], [34.5, 47.5], [32.5, 46.5]], // Dinyeper
  [[38, 54], [39.2, 51.7], [41, 49.5], [39.4, 47.1]], // Don
  [[-95.2, 47.2], [-93.2, 45], [-91, 43], [-91, 40], [-90.2, 38.6], [-89.2, 37], [-90, 35], [-91.2, 32.3], [-90.1, 30], [-89.3, 29]], // Mississippi
  [[-73, -4.5], [-70, -4], [-65, -3.5], [-60, -3.1], [-55, -2.3], [-52, -1.5], [-49.5, -0.3]], // Amazon
  [[-10.5, 9.5], [-8, 12.6], [-4, 14.5], [-1, 16.5], [1.5, 13], [4.5, 11], [6.5, 7.5], [6.2, 4.2]], // Nijer
  [[27, -9], [26, -3], [25, 0.5], [22, 1.5], [18, -1], [16, -4.3], [12.4, -6]], // Kongo
  [[94, 33], [99, 26], [100.5, 21], [102.5, 17.9], [105.8, 15.1], [105.5, 11.5], [106.6, 9.5]], // Mekong
  [[86, 51], [83, 53.5], [82, 56], [76, 60.8], [69, 61], [66, 66.5], [66.5, 69]], // Obi
  [[95, 51], [92.5, 54.5], [92, 58], [89.5, 62], [87, 66], [83, 71]], // Yenisey
  [[107, 54], [113, 58], [123, 61], [129.7, 62], [127, 66], [126, 70], [127, 72.6]], // Lena
  [[118, 51.5], [124, 53], [127.5, 50.2], [132, 48], [135, 48.5], [137, 50.5], [140.6, 52.9]], // Amur
  [[-79.5, 43.3], [-76.5, 44.2], [-73.6, 45.5], [-71.2, 46.8], [-68, 48.6], [-64.5, 49.5]], // St. Lawrence
  [[-47.5, -20], [-51, -22], [-54.6, -25.6], [-58.8, -27.5], [-60.7, -32.9], [-58.4, -34.2]], // Parana
  [[24, -11.5], [23.5, -15.5], [25.8, -17.9], [28.5, -16.5], [32, -15.6], [35.5, -17.5], [36.6, -18.9]], // Zambezi
  [[4.7, 47.6], [3, 48.4], [2.3, 48.85], [1, 49.3], [0.1, 49.45]], // Sen
  [[7.2, 44.7], [9, 45.1], [11, 45], [12.5, 44.95]], // Po
  [[38.5, 39.7], [36, 39.2], [34, 39.6], [34.3, 41], [35.9, 41.8]], // Kızılırmak
  [[73, 37.3], [68, 37.2], [65, 38.5], [61, 40.5], [59.5, 43.6]], // Amuderya
  [[71, 41], [69, 40.8], [68, 42], [66, 43.7], [61.5, 46.1]], // Siriderya
  [[-63.5, 2.5], [-66, 4], [-67.5, 6.3], [-64, 8], [-60.8, 8.7]], // Orinoko
  [[97.5, 26], [96, 22], [95.5, 18], [95, 15.8]], // İravadi
];
const inBox = (lon: number, lat: number, b: Box) => lon >= b.lon[0] && lon <= b.lon[1] && lat >= b.lat[0] && lat <= b.lat[1];

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// odd-r komşuları (sivri tepeli hex, tek satırlar sağa kaymış)
const NB_EVEN = [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]];
const NB_ODD = [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]];

export function hexCenter(c: number, r: number, COLS: number, ROWS: number) {
  const W = COLS * SQ3 * HEX_R, H = ROWS * 1.5 * HEX_R;
  return { x: (c + 0.5 * (r & 1)) * SQ3 * HEX_R - W / 2 + SQ3 / 2, z: r * 1.5 * HEX_R - H / 2 + 1 };
}

export function lonLatToHex(lon: number, lat: number) {
  const r = Math.max(0, Math.min(EARTH.ROWS - 1, Math.round((EARTH.LAT_TOP - lat) / EARTH.DPR - 0.5)));
  const c = Math.max(0, Math.min(EARTH.COLS - 1, Math.round((lon + 180) / EARTH.DPC - 0.5 - (r & 1) * 0.5)));
  return r * EARTH.COLS + c;
}

export function generateWorld(seed: number): WorldMap {
  const { COLS, ROWS } = EARTH;
  const rng = mulberry32(seed);
  const n = COLS * ROWS;
  const hexes: Hex[] = new Array(n);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const country = parseInt(EARTH_CELLS.substr(i * 2, 2), 36);
      const lon = -180 + (c + (r & 1) * 0.5 + 0.5) * EARTH.DPC;
      const lat = EARTH.LAT_TOP - (r + 0.5) * EARTH.DPR;
      const { x, z } = hexCenter(c, r, COLS, ROWS);
      const nb: number[] = [];
      for (const [dc, dr] of (r & 1 ? NB_ODD : NB_EVEN)) {
        const cc = c + dc, rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) continue;
        nb.push(rr * COLS + cc);
      }
      hexes[i] = {
        i, c, r, x, z, lon, lat, land: country > 0, country, terrain: 'deep', feature: null, elev: 0,
        res: Object.fromEntries(RES_KEYS.map((k) => [k, 0])) as Record<ResKey, number>, prov: -1, coast: false, nb, river: false,
      };
    }
  }

  // yükselti + iklim
  for (const h of hexes) {
    if (!h.land) { h.terrain = h.nb.some((j) => hexes[j].land) ? 'shallow' : 'deep'; continue; }
    h.coast = h.nb.some((j) => !hexes[j].land) || h.nb.length < 6;
    let e = fbm(h.lon / 9, h.lat / 9, 17, 4) * 0.32 - 0.05;
    for (const R of RANGES) {
      for (let k = 0; k < R.pts.length - 1; k++) {
        const d = segDist(h.lon, h.lat, R.pts[k][0], R.pts[k][1], R.pts[k + 1][0], R.pts[k + 1][1]);
        if (d < R.w) e = Math.max(e, R.h * (1 - (d / R.w) ** 1.6) + fbm(h.lon, h.lat, 5, 2) * 0.15);
      }
    }
    for (const P of PLATEAUS) if (inBox(h.lon, h.lat, P)) e = Math.max(e, P.h * (0.85 + fbm(h.lon / 3, h.lat / 3, 9, 2) * 0.3));
    if (h.coast) e *= 0.75;
    h.elev = Math.max(0, Math.min(1, e));

    const alat = Math.abs(h.lat);
    const moist = fbm(h.lon / 6, h.lat / 6, 333, 3);
    const desert = DESERTS.some((b) => inBox(h.lon, h.lat, b)) && moist < 0.62;
    const jungle = JUNGLES.some((b) => inBox(h.lon, h.lat, b));
    const greenland = h.lon > -60 && h.lon < -18 && h.lat > 60;
    if (h.elev > 0.66) h.terrain = 'mountain';
    else if (greenland && !h.coast) h.terrain = 'snow';
    else if (alat > 66 || (alat > 60 && h.lon > 90)) h.terrain = h.elev > 0.45 ? 'hills' : 'tundra';
    else if (h.elev > 0.38) h.terrain = 'hills';
    else if (desert) h.terrain = 'desert';
    else h.terrain = moist > 0.5 || alat > 45 || jungle ? 'grass' : 'plains';

    if (h.terrain === 'grass' || h.terrain === 'plains' || h.terrain === 'hills') {
      if (jungle && h.elev < 0.5 && moist > 0.32) h.feature = 'jungle';
      else if (alat > 50 && alat < 66 && moist > 0.38) h.feature = 'taiga';
      else if (moist > 0.58 && h.terrain !== 'plains') h.feature = 'forest';
    }

    const jit = () => (rng() - 0.5) * 0.2;
    const clamp = (v: number) => Math.max(0.05, Math.min(1, v));
    const T = h.terrain, F = h.feature;
    const fert = { grass: 0.9, plains: 0.75, hills: 0.35, desert: 0.1, tundra: 0.15, snow: 0, mountain: 0.05, deep: 0, shallow: 0 }[T];
    h.res = {
      fertility: clamp(fert * (F ? 0.45 : 1) + (h.coast && T !== 'desert' ? 0.08 : 0) + jit()),
      forest: clamp((F === 'jungle' ? 0.95 : F ? 0.9 : T === 'grass' ? 0.3 : T === 'hills' ? 0.3 : 0.1) + jit()),
      stone: clamp((T === 'mountain' ? 0.9 : T === 'hills' ? 0.75 : T === 'desert' ? 0.4 : T === 'tundra' ? 0.3 : 0.15) + jit()),
      ore: clamp((T === 'mountain' ? 0.55 : T === 'hills' ? 0.4 : 0.08) + fbm(h.lon / 4, h.lat / 4, seed % 997, 2) * 0.55 - 0.2 + jit()),
      pasture: clamp((T === 'plains' ? 0.85 : T === 'grass' ? 0.6 : T === 'hills' ? 0.6 : T === 'tundra' ? 0.4 : T === 'desert' ? 0.2 : 0.1) * (F ? 0.5 : 1) + jit()),
      coal: clamp((COAL.some((b) => inBox(h.lon, h.lat, b)) ? 0.85 : 0) + (T === 'hills' ? 0.25 : T === 'mountain' ? 0.2 : 0.03) + fbm(h.lon / 3, h.lat / 3, 4242, 2) * 0.3 - 0.1 + jit()),
      cotton: clamp((COTTON.some((b) => inBox(h.lon, h.lat, b)) ? 0.75 : Math.abs(h.lat) > 8 && Math.abs(h.lat) < 37 ? 0.3 : 0.02) * (T === 'plains' || T === 'grass' ? 1 : T === 'desert' && h.coast ? 0.7 : 0.3) * (F ? 0.4 : 1) + jit()),
      copper: clamp((T === 'mountain' ? 0.45 : T === 'hills' ? 0.45 : T === 'desert' ? 0.15 : 0.04) + fbm(h.lon / 4, h.lat / 4, (seed + 51) % 997, 2) * 0.6 - 0.22 + jit()),
      oil: clamp((OIL.some((b) => inBox(h.lon, h.lat, b)) ? 0.8 : 0) + (T === 'desert' || T === 'tundra' ? 0.12 : 0.02) + fbm(h.lon / 3, h.lat / 3, 9191, 2) * 0.25 - 0.12 + jit() * 0.5),
      sugar: clamp((SUGAR.some((b) => inBox(h.lon, h.lat, b)) ? 0.75 : Math.abs(h.lat) < 23 ? 0.3 : 0.02) * (T === 'grass' || T === 'plains' ? 1 : 0.3) * (F === 'jungle' ? 0.6 : 1) + (h.coast ? 0.06 : 0) + jit()),
    };
  }

  // nehirler: gerçek büyük nehirlerin kabaca yatağı; nehir hex'leri daha verimli
  const rivers: number[][] = [];
  for (const pts of RIVERS) {
    const seq: number[] = [];
    const push = (i: number) => { if (seq[seq.length - 1] !== i) seq.push(i); };
    for (let k = 0; k < pts.length - 1; k++) {
      const [a1, b1] = pts[k], [a2, b2] = pts[k + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(a2 - a1, b2 - b1) / 0.6));
      for (let t = 0; t <= n; t++) push(lonLatToHex(a1 + ((a2 - a1) * t) / n, b1 + ((b2 - b1) * t) / n));
    }
    // ardışık hex'leri komşu yap (gerekirse BFS ile bağla)
    const path: number[] = [];
    for (const i of seq) {
      const last = path[path.length - 1];
      if (last === undefined || hexes[last].nb.includes(i)) { path.push(i); continue; }
      const prev = new Map<number, number>([[last, -1]]); const q = [last];
      while (q.length && !prev.has(i)) { const c = q.shift()!; for (const j of hexes[c].nb) if (!prev.has(j)) { prev.set(j, c); q.push(j); } }
      const mid: number[] = []; let c = prev.get(i);
      while (c !== undefined && c !== last && c >= 0) { mid.push(c); c = prev.get(c); }
      path.push(...mid.reverse(), i);
    }
    const land: number[] = [];
    for (const i of path) { if (!hexes[i].land) { if (land.length > 2) { land.push(i); break; } continue; } land.push(i); }
    if (land.length < 3) continue;
    for (const i of land) if (hexes[i].land) {
      const h = hexes[i]; h.river = true;
      h.res.fertility = Math.min(1, h.res.fertility + (h.terrain === 'desert' ? 0.55 : 0.3));
      if (h.terrain === 'desert') h.terrain = 'plains';
    }
    rivers.push(land);
  }

  // şehirler
  const townHexes = CITIES.map((ct) => {
    let i = lonLatToHex(ct.lon, ct.lat);
    if (!hexes[i].land) {
      const q = [i], seen = new Set(q);
      while (q.length) { const k = q.shift()!; if (hexes[k].land) { i = k; break; } for (const j of hexes[k].nb) if (!seen.has(j)) { seen.add(j); q.push(j); } }
    }
    return i;
  });
  // aynı hex'e düşen şehirleri ayır
  const usedTown = new Set<number>();
  townHexes.forEach((i, k) => {
    if (!usedTown.has(i)) { usedTown.add(i); return; }
    const q = [i], seen = new Set(q);
    while (q.length) { const c = q.shift()!; if (hexes[c].land && !usedTown.has(c)) { townHexes[k] = c; usedTown.add(c); return; } for (const j of hexes[c].nb) if (!seen.has(j)) { seen.add(j); q.push(j); } }
  });
  for (const i of townHexes) { const h = hexes[i]; if (h.terrain === 'mountain' || h.terrain === 'snow') h.terrain = 'hills'; h.feature = null; }

  // eyalet tohumları: şehirler + kara üzerinde aralıklı noktalar
  const landIdx = hexes.filter((h) => h.land).map((h) => h.i);
  const seeds: number[] = [...new Set(townHexes)];
  const minD = 6.2;
  const shuffled = [...landIdx].sort(() => rng() - 0.5);
  for (const i of shuffled) {
    const h = hexes[i];
    if (seeds.some((s) => Math.hypot(hexes[s].x - h.x, hexes[s].z - h.z) < minD * SQ3)) continue;
    seeds.push(i);
  }
  // çok kaynaklı, gürültülü BFS büyütme (Dijkstra)
  const prov = new Int32Array(n).fill(-1);
  const cost = new Float64Array(n).fill(Infinity);
  const heap: [number, number][] = [];
  const push = (d: number, i: number) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r2 = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r2 < heap.length && heap[r2][0] < heap[m][0]) m = r2; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  seeds.forEach((s, k) => { prov[s] = k; cost[s] = 0; push(0, s); });
  while (heap.length) {
    const [d, i] = pop();
    if (d > cost[i]) continue;
    for (const j of hexes[i].nb) {
      if (!hexes[j].land) continue;
      const step = 1 + (hexes[j].terrain === 'mountain' ? 2.5 : 0) + fbm(hexes[j].lon, hexes[j].lat, 77, 1) * 0.6;
      if (d + step < cost[j]) { cost[j] = d + step; prov[j] = prov[i]; push(d + step, j); }
    }
  }
  // tohumsuz adalar → kendi eyaleti
  let nextP = seeds.length;
  for (const i of landIdx) {
    if (prov[i] >= 0) continue;
    const q = [i]; prov[i] = nextP;
    while (q.length) { const k = q.shift()!; for (const j of hexes[k].nb) if (hexes[j].land && prov[j] < 0) { prov[j] = nextP; q.push(j); } }
    nextP++;
  }
  // çok küçük eyaletleri (≤2 hex, şehirsiz) komşuya kat
  const sizes = new Array(nextP).fill(0);
  for (const i of landIdx) sizes[prov[i]]++;
  for (const i of landIdx) {
    if (sizes[prov[i]] > 2 || townHexes.includes(i)) continue;
    const nbP = hexes[i].nb.map((j) => prov[j]).find((p) => p >= 0 && p !== prov[i] && sizes[p] > 2);
    if (nbP !== undefined) { sizes[prov[i]]--; prov[i] = nbP; sizes[nbP]++; }
  }
  // yeniden numarala
  const remap = new Map<number, number>();
  for (const i of landIdx) { if (!remap.has(prov[i])) remap.set(prov[i], remap.size); hexes[i].prov = remap.get(prov[i])!; }
  const P = remap.size;

  // eyalet nitelikleri
  const regions: RegionStatic[] = [];
  const byP: number[][] = Array.from({ length: P }, () => []);
  for (const i of landIdx) byP[hexes[i].prov].push(i);
  const nameCount = new Map<string, number>();
  for (let p = 0; p < P; p++) {
    const hs = byP[p];
    let sx = 0, sz = 0, el = 0;
    const res = Object.fromEntries(RES_KEYS.map((k) => [k, 0])) as Record<ResKey, number>;
    const nbs = new Set<number>();
    const countries = new Map<number, number>();
    let coast = false;
    for (const i of hs) {
      const h = hexes[i];
      sx += h.x; sz += h.z; el += h.elev;
      for (const k of RES_KEYS) res[k] = Math.max(res[k], h.res[k]); // eyaletteki en iyi hex
      for (const j of h.nb) if (hexes[j].land && hexes[j].prov !== p) nbs.add(hexes[j].prov);
      if (h.coast) coast = true;
      countries.set(h.country, (countries.get(h.country) ?? 0) + 1);
    }
    const cx = sx / hs.length, cz = sz / hs.length;
    const town = townHexes.findIndex((t) => hexes[t].prov === p);
    const center = town >= 0 ? townHexes[town] : hs.reduce((b, i) => (Math.hypot(hexes[i].x - cx, hexes[i].z - cz) < Math.hypot(hexes[b].x - cx, hexes[b].z - cz) ? i : b), hs[0]);
    const ctry = COUNTRY_NAMES[[...countries.entries()].sort((a, b) => b[1] - a[1])[0][0] - 1] ?? 'Ada';
    const base = TR[ctry] ?? ctry;
    regions.push({
      id: p, name: base, cx: hexes[center].x, cz: hexes[center].z, hex: center, cells: hs.length, hexes: hs,
      neighbors: [...nbs], sea: [], res, coast, height: el / hs.length, country: base,
      nation0: -1, lon: hexes[center].lon, lat: hexes[center].lat,
    });
    nameCount.set(base, (nameCount.get(base) ?? 0) + 1);
  }
  // aynı ülkede birden çok eyalet → yön eki
  const byCountry = new Map<string, RegionStatic[]>();
  for (const r of regions) { const l = byCountry.get(r.country) ?? []; l.push(r); byCountry.set(r.country, l); }
  const SYL1 = ['Kara', 'Ak', 'Göl', 'Yel', 'Taş', 'Demir', 'Kır', 'Yaz', 'Gün', 'Ay', 'Bal', 'Er', 'Kuz', 'Sarı', 'Gök', 'Al', 'Bur', 'Çam', 'Ilı', 'Kum', 'Boz', 'Kızıl', 'Tuz', 'Ulu'];
  const SYL2 = ['ova', 'tepe', 'dere', 'yurt', 'kaya', 'pınar', 'bük', 'yayla', 'su', 'bel', 'alan', 'orman', 'çay', 'dağ', 'göl', 'kır'];
  const usedNames = new Set<string>();
  for (const [, list] of byCountry) {
    if (list.length < 2) continue;
    if (list.length > 4) {
      for (const r of list) {
        let nm = '';
        for (let k = 0; k < 30; k++) { nm = SYL1[Math.floor(rng() * SYL1.length)] + SYL2[Math.floor(rng() * SYL2.length)]; if (!usedNames.has(nm)) break; }
        usedNames.add(nm); r.name = nm;
      }
      continue;
    }
    const mx = list.reduce((t, r) => t + r.cx, 0) / list.length, mz = list.reduce((t, r) => t + r.cz, 0) / list.length;
    const used = new Map<string, number>();
    for (const r of list) {
      const dx = r.cx - mx, dz = r.cz - mz;
      const dir = Math.hypot(dx, dz) < 4 ? 'Orta' : Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'Doğu' : 'Batı') : dz > 0 ? 'Güney' : 'Kuzey';
      const k = (used.get(dir) ?? 0) + 1; used.set(dir, k);
      r.name = `${dir} ${r.country}${k > 1 ? ` ${['', '', 'II', 'III', 'IV'][k] ?? k}` : ''}`;
    }
  }

  // kasabalar
  const styleOf = (lon: number, lat: number): CityStyle => {
    if (lon < -30 || lat < -25) return 'europe'; // 1850: Amerika ve güney kolonileri Avrupa üslubunda
    if (lon > 95) return 'eastasia';
    if (lon > 66 && lat < 32) return 'southasia';
    if (lat < 14 && lon > -20 && lon < 52) return 'africa';
    if ((lon > 25 && lat < 42 && lon < 75) || (lat < 37.5 && lon > -10 && lon < 25 && lat > 15) || (lon > 44 && lon < 75 && lat < 46)) return 'islamic';
    return 'europe';
  };
  const towns: TownStatic[] = CITIES.map((ct, k) => {
    const hx = townHexes[k];
    const reg = regions[hexes[hx].prov];
    if (reg.hex === hx) reg.name = ct.name;
    return { id: k, region: hexes[hx].prov, name: ct.name, size: ct.size, hex: hx, style: styleOf(ct.lon, ct.lat) };
  });

  const height = new Float32Array(n);
  const regionOf = new Int16Array(n);
  for (const h of hexes) { height[h.i] = h.land ? h.elev : -0.2; regionOf[h.i] = h.prov; }
  return {
    seed, N: COLS, COLS, ROWS, W: COLS * SQ3, H: ROWS * 1.5, hexes, height, regionOf, regions, towns, rivers,
  };
}

