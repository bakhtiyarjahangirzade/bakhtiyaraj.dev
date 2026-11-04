#!/usr/bin/env python3
"""Turn selected, openly licensed originals into optimised local WebP files and record their provenance.

Usage: python3 -I process.py <cache_dir> <concept> [<concept> ...]
Reads   scripts/concept-assets/selections/<concept>.json  [{"key":"hall","id":"<openverse id>","crop":[x0,y0,x1,y1]?,"widths":[640,1280]?}]
Writes  storefront/public/assets/k/<concept>/<key>-<w>.webp
Writes  storefront/src/k/<concept>/assets.json (full provenance; read by k/kit.js at build time).
Run credits.py afterwards to refresh docs/concept-asset-credits.md.
crop values are fractions of the original (0-1); "grade":"mono" converts to a contrast-normalised black-and-white print; "grade":"set" applies the shared product-shot correction (set_grade); "fit":[w,h] extends a too-wide crop upwards to that aspect (fit_top); "q" sets WebP quality (default 74). Widths larger than the cropped original are skipped.
"""
import json, sys, os
from PIL import Image, ImageOps
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))
cache = sys.argv[1]
SOURCES = {'wordpress': 'WordPress Photo Directory', 'met': 'The Met Open Access', 'clevelandmuseum': 'Cleveland Museum of Art', 'rijksmuseum': 'Rijksmuseum', 'smk': 'SMK Open', 'wikimedia': 'Wikimedia Commons', 'flickr': 'Flickr', 'nasa': 'NASA'}
LIC = {'cc0': 'CC0 1.0', 'pdm': 'Public Domain Mark 1.0', 'by': 'CC BY', 'by-sa': 'CC BY-SA'}

def fit_top(im, rw, rh):
    """Extend a too-wide crop upwards to the aspect rw:rh by repeating the colour of its top rows (a plain wall or
    backdrop), so a wide object fits a portrait tile without cropping its sides."""
    W, H = im.size
    need = round(W * rh / rw)
    if need <= H: return im
    from PIL import ImageFilter
    band = im.crop((0, 0, W, max(4, H // 50))).resize((W, 1), Image.BOX).resize((W, need - H), Image.BILINEAR)
    out = Image.new('RGB', (W, need)); out.paste(band.filter(ImageFilter.GaussianBlur(40)), (0, 0)); out.paste(im, (0, need - H))
    return out

def set_grade(im):
    """grade "set": one product-shot look for photos from different sources: neutralise the colour cast of the
    brightest quarter (usually the background), lift exposure so the light background sits near paper white, and
    soften saturation slightly. Gains are clamped so a dark set is lightened, not blown out."""
    import numpy as np
    a = np.asarray(im, dtype=np.float32)
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    hi = a[lum >= np.percentile(lum, 75)].mean(axis=0)
    gain = np.clip((hi.mean() / hi) ** 0.8, 0.85, 1.2)
    a = a * gain
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    a = a * min(1.35, max(1.0, 236 / max(1.0, float(np.percentile(lum, 92)))))
    lum = (a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    a = lum + (a - lum) * 0.86
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
for concept in sys.argv[2:]:
    manifest = {}
    sel = json.load(open(os.path.join(HERE, 'selections', concept + '.json')))
    meta = {}
    for f in (os.listdir(cache) if os.path.isdir(cache) else []):
        if f.endswith('.json'):
            try: meta.update(json.load(open(os.path.join(cache, f))))
            except ValueError: pass  # another search is writing it
    # Reproducible without the search cache: previously processed files keep their provenance in assets.json.
    prev = os.path.join(ROOT, 'storefront', 'src', 'k', concept, 'assets.json')
    if os.path.exists(prev):
        for v in json.load(open(prev)).values():
            meta.setdefault(v['openverse'], {'id': v['openverse'], 'title': v['title'], 'creator': v['creator'], 'license': 'cc0' if v['license'].startswith('CC0') else ('pdm' if v['license'].startswith('Public') else v['license']), 'license_version': None, 'license_url': v.get('licenseUrl'), 'foreign_landing_url': v['page'], 'url': v['original'], 'source': v['source']})
    outdir = os.path.join(ROOT, 'storefront', 'public', 'assets', 'k', concept); os.makedirs(outdir, exist_ok=True)
    produced = set()
    for item in sel:
        m = meta.get(item['id'])
        if not m: raise SystemExit(f'{concept}/{item["key"]}: id {item["id"]} not in cache')
        orig = os.path.join(cache, 'orig', item['id'] + '.jpg')
        if not os.path.exists(orig):
            import urllib.request
            os.makedirs(os.path.dirname(orig), exist_ok=True)
            req = urllib.request.Request(m['url'], headers={'User-Agent': 'BAKHY-concept-assets/1.0 (+https://www.bakhtiyaraj.dev)'})
            open(orig, 'wb').write(urllib.request.urlopen(req, timeout=90).read())
        im = ImageOps.exif_transpose(Image.open(orig)).convert('RGB')
        if item.get('crop'):
            x0, y0, x1, y1 = item['crop']; W, H = im.size
            im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
        if item.get('fit'):
            im = fit_top(im, *item['fit'])
        if item.get('grade') == 'mono':
            im = ImageOps.autocontrast(im.convert('L'), cutoff=0.4).convert('RGB')
        elif item.get('grade') == 'set':
            im = set_grade(im)
        widths = [w for w in item.get('widths', [640, 1280, 1920]) if w <= im.width] or [im.width]
        for w in widths:
            h = round(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(os.path.join(outdir, f'{item["key"]}-{w}.webp'), 'WEBP', quality=item.get('q', 74), method=6)
            produced.add(f'{item["key"]}-{w}.webp')
        big = widths[-1]
        manifest[f'{concept}/{item["key"]}'] = {'w': big, 'h': round(im.height * big / im.width), 'widths': widths,
            'title': m['title'], 'creator': m.get('creator') or '', 'license': LIC.get(m['license'], m['license']) + ('' if m['license'] in ('cc0', 'pdm') else ' ' + (m.get('license_version') or '')),
            'licenseUrl': m.get('license_url'), 'page': m['foreign_landing_url'], 'original': m['url'], 'source': m['source'], 'sourceName': SOURCES.get(m['source'], m['source']), 'openverse': m['id']}
        print(concept, item['key'], widths)
    # remove stale files
    for f in os.listdir(outdir):
        if f not in produced: os.remove(os.path.join(outdir, f))
    json.dump(dict(sorted(manifest.items())), open(os.path.join(ROOT, 'storefront', 'src', 'k', concept, 'assets.json'), 'w'), indent=1, ensure_ascii=False)
