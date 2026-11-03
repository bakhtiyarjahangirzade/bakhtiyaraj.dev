// The shared BAKHY Supabase project (same project and publishable key as /budgettracker). The publishable key is
// public by design: every table, function and bucket Luna uses is protected by row level security.
export const SB_URL = 'https://yxiedrrahclzqukfnqrn.supabase.co';
export const SB_KEY = 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2';
export const PAGES_BUCKET = 'luna-pages';
export const SOURCES_BUCKET = 'luna-sources';
// Signed page URLs live 3 hours; the reader re-signs automatically when one expires or fails to load.
export const SIGN_SECONDS = 3 * 3600;
