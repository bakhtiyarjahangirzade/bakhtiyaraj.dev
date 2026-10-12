// Accounts and the play-chip wallet. Signed-in players keep chips in Supabase (profiles.chips);
// guests keep a local wallet in this browser. Chips are play money only.
import { getClient } from '/games/shared/net.js';

const GUEST_KEY = 'bakhy.guestChips', GUEST_START = 5000;
const listeners = new Set();
let state = { ready: false, user: null, profile: null };
const emit = () => listeners.forEach(f => f(state));

function guestChips() { try { const v = +localStorage.getItem(GUEST_KEY); return Number.isFinite(v) && localStorage.getItem(GUEST_KEY) != null ? v : GUEST_START; } catch { return GUEST_START; } }
function setGuestChips(v) { try { localStorage.setItem(GUEST_KEY, String(Math.max(0, Math.floor(v)))); } catch {} }

async function loadProfile() {
  const sb = await getClient();
  if (!state.user) { state.profile = null; return; }
  const { data } = await sb.from('profiles').select('id,username,chips,role,banned,last_bonus,games_played').eq('id', state.user.id).maybeSingle();
  state.profile = data || null;
}
let initP = null;
export function init() {
  if (initP) return initP;
  initP = (async () => {
    try {
      const sb = await getClient();
      const { data } = await sb.auth.getSession();
      state.user = data.session?.user || null;
      await loadProfile();
      sb.auth.onAuthStateChange(async (_e, session) => { state.user = session?.user || null; await loadProfile(); emit(); });
    } catch (e) { console.warn('account offline', e); }
    state.ready = true; emit();
    return state;
  })();
  return initP;
}
export function onChange(fn) { listeners.add(fn); if (state.ready) fn(state); return () => listeners.delete(fn); }
export const current = () => state;
export function balance() { return state.profile ? state.profile.chips : guestChips(); }
export function displayName() { return state.profile?.username || null; }
export const isAdmin = () => state.profile?.role === 'admin';

let syncT = null, pendingBal = null;
// Set the wallet to an absolute balance (games report the table stack after each round).
export function setBalance(v, reason = 'game') {
  v = Math.max(0, Math.floor(v));
  if (!state.profile) { setGuestChips(v); emit(); return; }
  state.profile.chips = v; emit();
  pendingBal = v; clearTimeout(syncT);
  syncT = setTimeout(async () => {
    const sb = await getClient(); const b = pendingBal;
    const { error } = await sb.rpc('set_chips', { new_balance: b, reason });
    if (error) { console.warn('chip sync failed', error.message); await loadProfile(); emit(); }
  }, 800);
}
export async function claimBonus() {
  if (!state.profile) throw new Error('Sign in to claim the daily bonus.');
  const sb = await getClient(); const { data, error } = await sb.rpc('claim_bonus');
  if (error) throw new Error(error.message.includes('already') ? 'You already claimed today’s bonus.' : error.message);
  state.profile.chips = data; state.profile.last_bonus = new Date().toISOString().slice(0, 10); emit(); return data;
}
export async function signUp(email, password, username) {
  const sb = await getClient();
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: location.origin + '/' } });
  if (error) throw new Error(error.message);
  return { needsConfirm: !data.session };
}
export async function signIn(email, password) {
  const sb = await getClient(); const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
}
export async function resetPassword(email) { const sb = await getClient(); const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/account/' }); if (error) throw new Error(error.message); }
export async function signOut() { const sb = await getClient(); await sb.auth.signOut(); }
export async function rename(name) { const sb = await getClient(); const { error } = await sb.rpc('set_username', { new_name: name }); if (error) throw new Error(error.message.includes('duplicate') ? 'That name is taken.' : 'Use 3–20 letters, numbers, dot, dash or underscore.'); state.profile.username = name; emit(); }
