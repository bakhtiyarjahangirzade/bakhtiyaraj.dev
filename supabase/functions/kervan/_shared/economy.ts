// Ekonomi formülleri: Frontier kasaba pazarı + SimCompanies borsası + muharebe.
import { C, GOODS } from './defs.ts';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

// ---------- Kasaba pazarı (Frontier: fiyat = taban × clamp((hedef/stok)^0.6, 0.35, 3)) ----------
export interface TownMarket { stock: number[]; target: number[]; idx?: number }


export function unitPrice(m: TownMarket, g: number, stock = m.stock[g], idx = m.idx ?? 1) {
  const s = Math.max(1, stock);
  return GOODS[g].price * idx * clamp((m.target[g] / s) ** C.PRICE_EXP, C.PRICE_MIN, C.PRICE_MAX);
}
export const bidPrice = (m: TownMarket, g: number, tax: number) => unitPrice(m, g) * C.SELL_SPREAD * (1 - tax);
export const askPrice = (m: TownMarket, g: number, tax: number) => unitPrice(m, g) * C.BUY_SPREAD * (1 + tax);

/** n birim satınca alınacak toplam (her birim stoku artırır, fiyatı düşürür). */
export function quoteSell(m: TownMarket, g: number, n: number, tax: number) {
  let t = 0;
  for (let i = 0; i < n; i++) t += unitPrice(m, g, m.stock[g] + i) * C.SELL_SPREAD * (1 - tax);
  return t;
}
/** n birim almanın toplam maliyeti; stok yetmezse Infinity. */
export function quoteBuy(m: TownMarket, g: number, n: number, tax: number) {
  if (n > Math.floor(m.stock[g])) return Infinity;
  let t = 0;
  for (let i = 0; i < n; i++) t += unitPrice(m, g, m.stock[g] - i) * C.BUY_SPREAD * (1 + tax);
  return t;
}

// ---------- Borsa (SimCompanies: fiyat → kalite → zaman önceliği) ----------
export interface Order {
  id: number;
  good: number;
  side: 'buy' | 'sell';
  price: number;
  qty: number;
  quality: number;
  house: number;
  day: number;
  seq: number;
}
export interface Fill { buyOrder?: number; sellOrder?: number; buyer: number; seller: number; good: number; qty: number; price: number }

export function sortBook(orders: Order[], good: number, side: 'buy' | 'sell') {
  return orders
    .filter((o) => o.good === good && o.side === side && o.qty > 0)
    .sort((a, b) =>
      side === 'sell'
        ? a.price - b.price || b.quality - a.quality || a.seq - b.seq
        : b.price - a.price || b.quality - a.quality || a.seq - b.seq,
    );
}

/** Yeni emri defterle eşleştirir. İşlem fiyatı = bekleyen emrin fiyatı. Kendi emriyle eşleşmez. */
export function matchOrder(book: Order[], incoming: Order, allow: (other: number) => boolean = () => true): Fill[] {
  const fills: Fill[] = [];
  const opp = sortBook(book, incoming.good, incoming.side === 'buy' ? 'sell' : 'buy');
  for (const o of opp) {
    if (incoming.qty <= 0) break;
    if (o.house === incoming.house || !allow(o.house)) continue;
    const ok = incoming.side === 'buy' ? o.price <= incoming.price + 1e-9 : o.price >= incoming.price - 1e-9;
    if (!ok) break;
    const q = Math.min(o.qty, incoming.qty);
    o.qty -= q; incoming.qty -= q;
    fills.push({
      buyOrder: incoming.side === 'buy' ? incoming.id : o.id,
      sellOrder: incoming.side === 'sell' ? incoming.id : o.id,
      buyer: incoming.side === 'buy' ? incoming.house : o.house,
      seller: incoming.side === 'sell' ? incoming.house : o.house,
      good: incoming.good, qty: q, price: o.price,
    });
  }
  return fills;
}

