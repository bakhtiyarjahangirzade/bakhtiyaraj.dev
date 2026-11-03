// Direct, authenticated uploads from the editor's browser to Supabase Storage (never through a Vercel function,
// whose request body limit is a few MB). Storage row level security decides what an upload may write:
// only editors, only into a revision that is still importing, never over a published object.
//  - prepared pages and covers (≤ 15 MB, usually < 1 MB): one POST each, upsert so a retry overwrites;
//  - the original PDF/CBZ (≤ 50 MB): TUS resumable upload in 6 MB chunks (Supabase's required chunk size),
//    with byte progress, cancellation and resume from the server's offset after a network failure.
import { SB_URL, SB_KEY } from './config.js';

const CHUNK = 6 * 1024 * 1024;
const enc = s => btoa(unescape(encodeURIComponent(s)));
const objectUrl = (bucket, path) => `${SB_URL}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;

export class UploadError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
async function failure(r, what) {
  const body = await r.json().catch(() => ({}));
  const msg = body.message || body.error || `HTTP ${r.status}`;
  if (r.status === 401 || r.status === 403 || /row-level security|unauthori[sz]ed|permission/i.test(msg)) return new UploadError(`${what}: icazə verilmədi (redaktor hüququ və ya sessiya yoxlanılmadı).`, r.status);
  if (r.status === 413 || /too large|exceeded the maximum/i.test(msg)) return new UploadError(`${what}: fayl Storage limitindən böyükdür.`, r.status);
  return new UploadError(`${what}: yüklənmədi (${msg}).`, r.status);
}

export async function uploadObject(bucket, path, blob, { token, signal, contentType = blob.type } = {}) {
  const r = await fetch(objectUrl(bucket, path), {
    method: 'POST', signal, body: blob,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': contentType, 'x-upsert': 'true', 'cache-control': 'max-age=31536000' },
  });
  if (!r.ok) throw await failure(r, path.split('/').pop());
  return path;
}

export async function removeObjects(bucket, paths, { token } = {}) {
  if (!paths.length) return [];
  const r = await fetch(`${SB_URL}/storage/v1/object/${bucket}`, {
    method: 'DELETE', headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: paths }),
  });
  if (!r.ok) throw await failure(r, 'Silinmə');
  return r.json().catch(() => []);
}

// Resumable upload. `state` (an object kept by the caller) remembers the upload URL between retries.
export async function tusUpload(bucket, path, file, { getToken, signal, onProgress = () => {}, state = {}, contentType }) {
  const base = `${SB_URL}/storage/v1/upload/resumable`;
  const hdr = async extra => ({ apikey: SB_KEY, Authorization: `Bearer ${await getToken()}`, 'Tus-Resumable': '1.0.0', ...extra });
  let offset = 0;
  if (state.url) {
    const r = await fetch(state.url, { method: 'HEAD', headers: await hdr({}), signal });
    if (r.ok) offset = Number(r.headers.get('Upload-Offset')) || 0; else state.url = null;
  }
  if (!state.url) {
    const meta = [['bucketName', bucket], ['objectName', path], ['contentType', contentType || file.type || 'application/octet-stream'], ['cacheControl', '3600']].map(([k, v]) => `${k} ${enc(v)}`).join(',');
    const r = await fetch(base, { method: 'POST', signal, headers: await hdr({ 'Upload-Length': String(file.size), 'Upload-Metadata': meta, 'x-upsert': 'true' }) });
    if (r.status !== 201) throw await failure(r, file.name);
    const loc = r.headers.get('Location');
    if (!loc) throw new UploadError(`${file.name}: Storage yükləmə ünvanını qaytarmadı.`, r.status);
    state.url = new URL(loc, base).href;
    offset = 0;
  }
  onProgress(offset, file.size);
  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(file.size, offset + CHUNK));
    const r = await fetch(state.url, { method: 'PATCH', signal, body: chunk, headers: await hdr({ 'Upload-Offset': String(offset), 'Content-Type': 'application/offset+octet-stream' }) });
    if (r.status === 409) { // offset mismatch: ask the server where it is
      const h = await fetch(state.url, { method: 'HEAD', headers: await hdr({}), signal });
      offset = Number(h.headers.get('Upload-Offset')) || 0; continue;
    }
    if (r.status !== 204) { if (r.status === 404 || r.status === 410) state.url = null; throw await failure(r, file.name); }
    offset = Number(r.headers.get('Upload-Offset')) || offset + chunk.size;
    onProgress(offset, file.size);
  }
  state.url = null;
  return path;
}
