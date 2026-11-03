#!/usr/bin/env python3
"""Turn selected, openly licensed originals into optimised local WebP files and record their provenance.

Usage: python3 -I process.py <cache_dir> <concept> [<concept> ...]
Reads   scripts/concept-assets/selections/<concept>.json  [{"key":"hall","id":"<openverse id>","crop":[x0,y0,x1,y1]?,"widths":[640,1280]?}]
Writes  storefront/public/assets/k/<concept>/<key>-<w>.webp
Writes  storefront/src/k/<concept>/assets.json (full provenance; read by k/kit.js at build time).
Run credits.py afterwards to refresh docs/concept-asset-credits.md.
crop values are fractions of the original (0-1). Widths larger than the cropped original are skipped.
"""
import json, sys, os
from PIL import Image, ImageOps
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))
cache = sys.argv[1]
SOURCES = {'wordpress': 'WordPress Photo Directory', 'met': 'The Met Open Access', 'clevelandmuseum': 'Cleveland Museum of Art', 'rijksmuseum': 'Rijksmuseum', 'smk': 'SMK Open', 'wikimedia': 'Wikimedia Commons', 'flickr': 'Flickr', 'nasa': 'NASA'}
LIC = {'cc0': 'CC0 1.0', 'pdm': 'Public Domain Mark 1.0', 'by': 'CC BY', 'by-sa': 'CC BY-SA'}
for concept in sys.argv[2:]:
    manifest = {}
    sel = json.load(open(os.path.join(HERE, 'selections', concept + '.json')))
    meta = {}
    for f in os.listdir(cache):
        if f.endswith('.json'):
            try: meta.update(json.load(open(os.path.join(cache, f))))
            except ValueError: pass  # another search is writing it
    outdir = os.path.join(ROOT, 'storefront', 'public', 'assets', 'k', concept); os.makedirs(outdir, exist_ok=True)
    for item in sel:
        m = meta.get(item['id'])
        if not m: raise SystemExit(f'{concept}/{item["key"]}: id {item["id"]} not in cache')
        im = ImageOps.exif_transpose(Image.open(os.path.join(cache, 'orig', item['id'] + '.jpg'))).convert('RGB')
        if item.get('crop'):
            x0, y0, x1, y1 = item['crop']; W, H = im.size
            im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
        widths = [w for w in item.get('widths', [640, 1280, 1920]) if w <= im.width] or [im.width]
        for w in widths:
            h = round(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(os.path.join(outdir, f'{item["key"]}-{w}.webp'), 'WEBP', quality=item.get('q', 74), method=6)
        big = widths[-1]
        manifest[f'{concept}/{item["key"]}'] = {'w': big, 'h': round(im.height * big / im.width), 'widths': widths,
            'title': m['title'], 'creator': m.get('creator') or '', 'license': LIC.get(m['license'], m['license']) + ('' if m['license'] in ('cc0', 'pdm') else ' ' + (m.get('license_version') or '')),
            'licenseUrl': m.get('license_url'), 'page': m['foreign_landing_url'], 'original': m['url'], 'source': m['source'], 'sourceName': SOURCES.get(m['source'], m['source']), 'openverse': m['id']}
        print(concept, item['key'], widths)
    # remove stale files
    keys = {i['key'] for i in sel}
    for f in os.listdir(outdir):
        if f.rsplit('-', 1)[0] not in keys: os.remove(os.path.join(outdir, f))
    json.dump(dict(sorted(manifest.items())), open(os.path.join(ROOT, 'storefront', 'src', 'k', concept, 'assets.json'), 'w'), indent=1, ensure_ascii=False)
