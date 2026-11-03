// Luna membership on the shared BAKHY Supabase project (same project and publishable key as /budgettracker).
// Real e-mail + password auth handled by Supabase: passwords never touch Luna's storage.
// The Supabase client is loaded on demand so anonymous readers never download it.
import * as store from './store.js';

const SB_URL = 'https://yxiedrrahclzqukfnqrn.supabase.co';
const SB_KEY = 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2'; // public, RLS-protected publishable key
const AUTH_KEY = 'luna.auth';
const MISSING = new Set(['PGRST205', '42P01', 'PGRST202']);

const listeners = new Set();
// status: idle (never contacted) | loading | signed-out | signed-in | unavailable
// sync:   none | checking | ready | missing (tables not installed) | error
let state = { status: 'idle', user: null, sync: 'none', message: '' };
const set = patch => { state = { ...state, ...patch }; listeners.forEach(f => f(state)); };
export const onAccount = f => (listeners.add(f), f(state), () => listeners.delete(f));
export const account = () => state;

let clientP = null, signingOut = false;
function client() {
  clientP ||= import('@supabase/supabase-js').then(({ createClient }) => {
    const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: AUTH_KEY } });
    sb.auth.onAuthStateChange((event, session) => {
      const user = session?.user && !session.user.is_anonymous ? session.user : null;
      if (event === 'SIGNED_OUT' && state.user && !signingOut) {
        set({ status: 'signed-out', user: null, sync: 'none', message: 'Sessiyanın müddəti bitdi. Kitabxananızı görmək üçün yenidən daxil olun.' });
        store.useDevice();
      } else if (user && user.id !== state.user?.id) {
        connect(user);
      }
    });
    return sb;
  }).catch(e => { clientP = null; throw e; });
  return clientP;
}

const hasStoredSession = () => { try { return !!localStorage.getItem(AUTH_KEY); } catch { return false; } };
const authRedirectInUrl = () => /(access_token|error_description|type=signup)/.test(location.hash);

// Only contact Supabase when this browser already has a Luna session or is returning from a confirmation link.
export async function init() {
  if (!hasStoredSession() && !authRedirectInUrl()) { set({ status: 'signed-out' }); return state; }
  return check();
}
export async function check() {
  set({ status: 'loading' });
  try {
    const sb = await client();
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    const user = data.session?.user && !data.session.user.is_anonymous ? data.session.user : null;
    if (authRedirectInUrl()) history.replaceState(history.state, '', location.pathname + location.search);
    if (user) await connect(user); else set({ status: 'signed-out', user: null });
  } catch (e) {
    console.warn('Luna account offline', e);
    set({ status: 'unavailable', user: null, message: 'Hesab xidmətinə qoşulmaq alınmadı. Pulsuz oxu və bu cihazdakı kitabxana işləməyə davam edir.' });
  }
  return state;
}

let connecting = null;
function connect(user) {
  if (connecting?.id === user.id) return connecting.p;
  connecting = { id: user.id, p: doConnect(user).finally(() => { connecting = null; }) };
  return connecting.p;
}
async function doConnect(user) {
  set({ status: 'signed-in', user: { id: user.id, email: user.email }, sync: 'checking', message: '' });
  const sb = await client();
  try {
    const r = await store.useAccount(adapter(sb, user.id));
    set({ sync: 'ready', message: r.moved ? `Bu cihazdakı ${r.moved} əsər hesabınıza köçürüldü.` : '' });
  } catch (e) {
    store.useDevice();
    set({ sync: MISSING.has(e?.code) ? 'missing' : 'error' });
  }
}

function adapter(sb, uid) {
  const fail = error => { if (error) { const e = new Error(error.message); e.code = error.code; throw e; } };
  return {
    async load() {
      const lib = await sb.from('luna_library').select('comic_slug,added_at');
      fail(lib.error);
      const prog = await sb.from('luna_progress').select('comic_slug,leaf,leaf_count,updated_at');
      fail(prog.error);
      return {
        library: Object.fromEntries(lib.data.map(r => [r.comic_slug, r.added_at])),
        progress: Object.fromEntries(prog.data.map(r => [r.comic_slug, { i: r.leaf, n: r.leaf_count, at: r.updated_at }])),
      };
    },
    async save(slug) { fail((await sb.from('luna_library').upsert({ user_id: uid, comic_slug: slug }, { onConflict: 'user_id,comic_slug' })).error); },
    async remove(slug) { fail((await sb.from('luna_library').delete().eq('comic_slug', slug)).error); },
    async progress(batch) {
      fail((await sb.from('luna_progress').upsert(batch.map(([slug, p]) => ({ user_id: uid, comic_slug: slug, leaf: p.i, leaf_count: p.n, updated_at: p.at })), { onConflict: 'user_id,comic_slug' })).error);
    },
    async merge(slugs, progress) {
      if (slugs.length) fail((await sb.from('luna_library').upsert(slugs.map(s => ({ user_id: uid, comic_slug: s })), { onConflict: 'user_id,comic_slug' })).error);
      if (progress.length) await this.progress(progress);
    },
  };
}

// ---------- Forms ----------
export const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
export function validate({ email, password }, mode) {
  const errors = {};
  if (!validEmail(email)) errors.email = 'Düzgün e-poçt ünvanı yazın, məsələn ad@nümunə.az.';
  if (!password) errors.password = 'Parolu yazın.';
  else if (mode === 'register' && password.length < 8) errors.password = 'Parol ən azı 8 simvol olmalıdır.';
  return errors;
}
function humanError(e) {
  const m = String(e?.message || '');
  if (/Invalid login credentials/i.test(m)) return 'E-poçt və ya parol yanlışdır.';
  if (/Email not confirmed/i.test(m)) return 'E-poçt ünvanı hələ təsdiqlənməyib. Qeydiyyatdan sonra gələn məktubdakı linki açın.';
  if (/rate limit|too many/i.test(m)) return 'Çox sayda cəhd edildi. Bir neçə dəqiqə sonra yenidən yoxlayın.';
  if (/password/i.test(m) && /(weak|short|least)/i.test(m)) return 'Parol çox zəifdir. Daha uzun və fərqli simvollu parol seçin.';
  if (/already registered/i.test(m)) return 'Bu e-poçtla hesab artıq var. Daxil ol bölməsindən istifadə edin.';
  if (/fetch|network|Failed to load/i.test(m)) return 'Hesab xidmətinə qoşulmaq alınmadı. İnternet bağlantısını yoxlayıb yenidən cəhd edin.';
  return 'Əməliyyat alınmadı: ' + m;
}
export async function signIn(email, password) {
  try {
    const sb = await client();
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    await connect(data.user);
    return { ok: true };
  } catch (e) { return { ok: false, error: humanError(e) }; }
}
export async function register(email, password) {
  try {
    const sb = await client();
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: location.origin + '/Luna' } });
    if (error) throw error;
    if (data.session) { await connect(data.user); return { ok: true, confirmed: true }; }
    return { ok: true, confirmed: false };
  } catch (e) { return { ok: false, error: humanError(e) }; }
}
export async function signOut() {
  signingOut = true;
  try { await store.flush(); const sb = await client(); await sb.auth.signOut(); }
  catch (e) { console.warn('Luna sign-out', e); try { localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ } }
  finally { signingOut = false; }
  store.useDevice();
  set({ status: 'signed-out', user: null, sync: 'none', message: 'Hesabdan çıxdınız.' });
}
