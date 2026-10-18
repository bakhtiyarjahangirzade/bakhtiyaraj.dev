// Serpent skins. Free skins are open to everyone; premium skins are bought once with play chips
// (the game server checks the wallet and records the purchase).
export const SKINS = [
  { id: 'ember', name: 'Ember', price: 0, base: 28 },
  { id: 'mint', name: 'Mint', price: 0, base: 150 },
  { id: 'royal', name: 'Royal', price: 0, base: 255 },
  { id: 'sunset', name: 'Sunset', price: 0, stripes: [18, 330] },
  { id: 'zebra', name: 'Zebra', price: 0, stripes: [0, 0], mono: true },
  { id: 'candy', name: 'Candy', price: 0, stripes: [345, 190] },
  { id: 'neon', name: 'Neon Tube', price: 2500, neon: 175 },
  { id: 'tiger', name: 'Tiger', price: 3000, tiger: true },
  { id: 'lava', name: 'Lava', price: 4000, lava: true },
  { id: 'galaxy', name: 'Galaxy', price: 6000, galaxy: true },
  { id: 'rainbow', name: 'Rainbow', price: 8000, rainbow: true },
  { id: 'gold', name: 'Solid Gold', price: 12000, gold: true }
];
export const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];

// Colour for body segment i of n (i = 0 is the head). k = i / n.
export function segColor(skin, i, n, now, hue) {
  const k = i / Math.max(1, n);
  const wave = Math.sin(i * .6 - now / 120);
  if (skin.base != null) return `hsl(${skin.base} 85% ${55 + 12 * wave - k * 18}%)`;
  if (skin.stripes) {
    const band = Math.floor(i / 4) % 2;
    if (skin.mono) return band ? `hsl(0 0% ${88 - k * 20}%)` : `hsl(0 0% ${16 + k * 6}%)`;
    return `hsl(${skin.stripes[band]} 85% ${58 + 8 * wave - k * 14}%)`;
  }
  if (skin.neon != null) return i % 6 < 3 ? `hsl(${skin.neon} 100% ${62 + 10 * wave}%)` : `hsl(${(skin.neon + 140) % 360} 100% ${58 + 10 * wave}%)`;
  if (skin.tiger) return Math.floor(i / 3) % 3 === 0 ? '#1a120b' : `hsl(28 95% ${52 + 8 * wave - k * 10}%)`;
  if (skin.lava) { const t = (Math.sin(i * .35 + now / 260) + 1) / 2; return `hsl(${8 + t * 32} 100% ${30 + t * 30}%)`; }
  if (skin.galaxy) return (i * 7919) % 11 === 0 ? '#fff' : `hsl(${255 + 30 * Math.sin(i * .2 + now / 900)} 70% ${14 + 10 * (1 + wave) / 2}%)`;
  if (skin.rainbow) return `hsl(${(i * 9 + now / 12) % 360} 90% 60%)`;
  if (skin.gold) { const t = (Math.sin(i * .5 - now / 200) + 1) / 2; return `hsl(44 ${70 + t * 25}% ${38 + t * 30}%)`; }
  return `hsl(${hue} 85% 55%)`;
}
export const glowOf = skin => skin.neon != null ? `hsl(${skin.neon} 100% 60%)` : skin.lava ? '#ff5a1a' : skin.gold ? '#ffd24a' : skin.galaxy ? '#9a7bff' : null;
export function headColor(skin, now) { return segColor(skin, 0, 100, now, 30); }

// Small preview used in the skin picker.
export function drawPreview(canvas, skin, now = performance.now()) {
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  g.clearRect(0, 0, w, h);
  const n = 26;
  for (let i = n - 1; i >= 0; i--) {
    const x = 14 + (w - 28) * (1 - i / n), y = h / 2 + Math.sin(i * .45 + now / 400) * h * .22;
    g.fillStyle = segColor(skin, i, n, now, 30);
    g.beginPath(); g.arc(x, y, 9 - i * .12, 0, 7); g.fill();
  }
  const hx = w - 14, hy = h / 2 + Math.sin(now / 400) * h * .22;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(hx + 2, hy - 4, 3.2, 0, 7); g.arc(hx + 2, hy + 4, 3.2, 0, 7); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(hx + 3.5, hy - 4, 1.6, 0, 7); g.arc(hx + 3.5, hy + 4, 1.6, 0, 7); g.fill();
}
