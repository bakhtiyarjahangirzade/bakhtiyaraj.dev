// Maps a published (or, for editors, draft) comic record from Supabase into the same title shape the
// storefront and reader use for the bundled starter collection. Pure: shared by the browser and tests.
// Pages are storage paths; the browser turns them into short-lived signed URLs (remote.js).

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

// access: free | paid (real price, purchase inquiry) | sample (illustrative price, not on sale).
// `row.access` from luna_catalogue() is already mapped; editor rows carry access + is_sample.
export function publicAccess(row) {
  if (row.access === 'sample' || (row.access === 'paid' && row.is_sample)) return 'sample';
  return row.access === 'paid' ? 'paid' : 'free';
}

export function toTitle(row, revision = row.revision, { preview = false } = {}) {
  const pages = (revision?.pages || []).map(p => p.path);
  const sizes = (revision?.pages || []).map(p => [p.width, p.height]);
  const pageCount = revision?.page_count || pages.length;
  // The book box uses the most common (median) page ratio; other pages are fitted inside it uncropped.
  const ratio = sizes.length ? median(sizes.map(([w, h]) => w / h)) : 1200 / 1660;
  const access = publicAccess(row);
  const restricted = access !== 'free';
  const previewPages = restricted ? Math.min(row.preview_pages || 0, pageCount) : null;
  return {
    slug: row.slug,
    id: row.id,
    remote: true,
    preview,                                    // editor draft preview (not public)
    status: row.status || 'published',
    series: row.series || '',
    episode: row.episode ?? null,
    title: row.title || 'Adsız əsər',
    titleNote: row.title_note || '',
    creator: row.creator || '',
    credits: (row.credits || []).filter(c => Array.isArray(c) && c[0] && c[1]).map(([r, n]) => [String(r), String(n)]),
    language: row.language || 'az',
    languageNote: row.language_note || '',
    genres: row.genres || [],
    year: row.year || (row.published_at ? new Date(row.published_at).getFullYear() : new Date().getFullYear()),
    synopsis: row.synopsis || '',
    rights: row.rights || '',
    access,
    price: restricted && row.price ? Number(row.price) : null,
    storyPages: pageCount,
    previewPages,
    // Visitors only ever receive the pages they may read; an editor preview gets the full draft but is cut
    // to the preview length unless the editor asks to see every page.
    pages: restricted && !preview?.all ? pages.slice(0, previewPages) : pages,
    pageSizes: restricted && !preview?.all ? sizes.slice(0, previewPages) : sizes,
    pageSize: [1200, Math.round(1200 / ratio)],
    cover: revision?.cover || null,
    coverSize: revision?.cover ? [revision.cover.width, revision.cover.height] : [1100, 1520],
    tone: /^#[0-9a-f]{6}$/i.test(row.tone || '') ? row.tone : '#3a3550',
    featured: false,
    publishedAt: row.published_at || null,
  };
}

// The leaf the reader should close on, and the wording for paid vs sample titles.
export const isOwnWork = t => !!t.remote;
