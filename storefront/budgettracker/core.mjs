// Shared, side-effect-free rules used by both the web app and the bundled APK.
export const cents = value => Math.round((Number(value) + Number.EPSILON) * 100);
export function currentRouteSpeed(points, now=Date.now()/1000) {
  if(points.length<2)return null;
  const a=points.at(-2),b=points.at(-1),seconds=b[2]-a[2];
  if(seconds<=0||now-b[2]>30)return null;
  const rad=n=>n*Math.PI/180,lat=rad(b[0]-a[0]),lng=rad(b[1]-a[1]);
  const h=Math.sin(lat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(lng/2)**2;
  const kmh=6371000*2*Math.asin(Math.min(1,Math.sqrt(h)))/seconds*3.6;
  return kmh<162?kmh:null;
}
export const BALANCE_NOTE='kuryebro:day-balance:v1';
export function legacyTotalDates(entries) {
  const live=entries.filter(e=>!e.deleted_at);
  return [...new Set(live.filter(e=>e.category==='daily'&&e.note!==BALANCE_NOTE&&live.some(d=>d.date===e.date&&d.kind===e.kind&&d.category!=='daily')).map(e=>e.date))].sort().reverse();
}
export const total = (entries, kind) => entries.filter(e => !e.deleted_at && e.kind === kind).reduce((sum, e) => sum + cents(e.amount), 0) / 100;
export function decimal(value) {
  const text = String(value ?? '').trim().replace(',', '.');
  return /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text) ? Number(text) : NaN;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(+date) && `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` === value;
}
// Daily amounts are the remainder after itemised entries, preserving receipts and categories.
export function dayAdjustment(entries, date, earned, spent) {
  if (!validDate(date) || ![earned, spent].every(n => Number.isFinite(n) && n >= 0 && n < 1e9)) throw new Error('invalid');
  const details = entries.filter(e => !e.deleted_at && e.date === date && e.category !== 'daily');
  const sale = cents(earned) - cents(total(details, 'sale'));
  const expense = cents(spent) - cents(total(details, 'expense'));
  if (sale < 0 || expense < 0) throw new Error('below-details');
  return {sale:sale/100, expense:expense/100};
}
export function dayMetrics(entries, days, sessions, date) {
  const en = entries.filter(e => !e.deleted_at && e.date === date), manual = days[date];
  const gps = sessions.filter(s => s.ended_at && localDay(s.started_at) === date);
  // An explicit zero is a valid manual value, not a request to use GPS instead.
  const km = manual ? Number(manual.km) : gps.reduce((n,s) => n+(s.distance_m||0)/1000,0);
  const h = manual ? Number(manual.hours) : gps.reduce((n,s) => n+(s.duration_s||0)/3600,0);
  return {earn:total(en,'sale'), spent:total(en,'expense'), km, h};
}
export function localDay(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function fuelRate(entries, days, sessions, month, end) {
  const dates = new Set(entries.filter(e => !e.deleted_at && e.date.startsWith(month) && e.date<=end).map(e=>e.date));
  let fuel = 0, km = 0;
  for (const date of dates) {
    const n = dayMetrics(entries,days,sessions,date);
    if (n.km>0) {km+=n.km;fuel+=total(entries.filter(e=>e.date===date&&e.category==='fuel'),'expense');}
  }
  return km>=5 && fuel>0 ? fuel/km : null;
}
export function monthProjection(entries, daily, workDays, now = new Date()) {
  const day = now.getDate(), dim = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const end = localDay(now), totalDays = Math.max(1,Math.round(workDays*dim/7));
  const target = cents(daily*totalDays)/100;
  const earn = total(entries.filter(e=>e.date.startsWith(end.slice(0,7))&&e.date<=end),'sale');
  const remaining = Math.max(0,Math.round((dim-day)*workDays/7));
  return {target,earn,forecast:earn/day*dim,need:remaining>0?Math.max(0,target-earn)/remaining:0,total:totalDays,units:daily>0?earn/daily:0};
}
