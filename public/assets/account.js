// Accounts and the play-chip wallet. The wallet lives only in Supabase (profiles.chips) and only the game
// server changes it. Visitors without an account get a guest (anonymous) account so they can play too;
// registering later keeps the same account and chips. Chips are play money only.
import { getClient, devServer } from '/games/shared/net.js';

const listeners = new Set();
let state = { ready: false, user: null, profile: null, guestBlocked: false };
const emit = () => listeners.forEach(f => f(state));

async function loadProfile() {
  if (await devServer()) { state.profile = await (await fetch('/__profile')).json(); state.user ||= { id: state.profile.id, is_anonymous: false }; return; }
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
      if (await devServer()) { await loadProfile(); state.ready = true; emit(); return state; }
      const sb = await getClient();
      const { data } = await sb.auth.getSession();
      state.user = data.session?.user || null;
      await loadProfile();
      sb.auth.onAuthStateChange((_e, session) => {
        const changed = (session?.user?.id || null) !== (state.user?.id || null);
        state.user = session?.user || null;
        if (changed) loadProfile().then(emit);
      });
    } catch (e) { console.warn('account offline', e); }
    state.ready = true; emit();
    return state;
  })();
  return initP;
}
export function onChange(fn) { listeners.add(fn); if (state.ready) fn(state); return () => listeners.delete(fn); }
export const current = () => state;
export const isGuest = () => !!state.user?.is_anonymous;
export function balance() { return state.profile ? Number(state.profile.chips) : 0; }
// Chips currently sitting on a casino table (still yours, shown next to the wallet).
let tableChips = 0;
export function setTableChips(n) { n = Math.max(0, Math.floor(+n || 0)); if (n !== tableChips) { tableChips = n; emit(); } }
export const onTable = () => tableChips;
export function displayName() { return state.profile?.username || null; }
export const isAdmin = () => state.profile?.role === 'admin';

// Make sure there is an account to play with: the signed-in one, or a fresh guest account.
export async function ensurePlayer() {
  await init();
  if (state.user && state.profile) return state;
  const sb = await getClient();
  if (!state.user) {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) { state.guestBlocked = true; emit(); const e = new Error('Sign in or create a free account to play.'); e.needLogin = true; throw e; }
    state.user = data.user;
  }
  for (let i = 0; i < 6 && !state.profile; i++) { await loadProfile(); if (!state.profile) await new Promise(r => setTimeout(r, 400)); }
  emit();
  if (!state.profile) throw new Error('Your account is still being set up. Try again in a moment.');
  return state;
}
// The server reports the new wallet balance after chip movements; reload when unsure.
export function setKnownBalance(v) { if (state.profile && Number.isFinite(+v)) { state.profile.chips = +v; emit(); } }
export async function refresh() { await loadProfile(); emit(); }

export async function claimBonus() {
  if (!state.profile) throw new Error('Sign in to claim the daily bonus.');
  const sb = await getClient(); const { data, error } = await sb.rpc('claim_bonus');
  if (error) throw new Error(error.message.includes('already') ? 'You already claimed today’s bonus.' : error.message);
  state.profile.chips = data; state.profile.last_bonus = new Date().toISOString().slice(0, 10); emit(); return data;
}
export async function signUp(email, password, username) {
  const sb = await getClient();
  if (isGuest()) { // keep the guest's account and chips: attach an email and password to it
    const { error } = await sb.auth.updateUser({ email, password, data: { username } }, { emailRedirectTo: location.origin + '/' });
    if (error) throw new Error(error.message);
    if (username) { try { await rename(username); } catch {} }
    return { needsConfirm: true, upgraded: true };
  }
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: location.origin + '/' } });
  if (error) throw new Error(error.message);
  return { needsConfirm: !data.session };
}
export async function signIn(email, password) {
  const sb = await getClient();
  if (isGuest()) await sb.auth.signOut();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
  state.user = (await sb.auth.getUser()).data.user; await loadProfile(); emit();
}
export async function resetPassword(email) { const sb = await getClient(); const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' }); if (error) throw new Error(error.message); }
export async function signOut() { const sb = await getClient(); await sb.auth.signOut(); state.user = null; state.profile = null; emit(); }
export async function rename(name) { const sb = await getClient(); const { error } = await sb.rpc('set_username', { new_name: name }); if (error) throw new Error(error.message.includes('duplicate') ? 'That name is taken.' : 'Use 3–20 letters, numbers, dot, dash or underscore.'); state.profile.username = name; emit(); }
