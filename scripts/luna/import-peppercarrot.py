#!/usr/bin/env python3
"""Reproducible import of the Luna starter collection from Pepper&Carrot (David Revoy, CC BY 4.0).

Downloads the official low-res exports (1200 px wide JPEG) from www.peppercarrot.com/0_sources/,
re-encodes them to WebP without cropping or retouching, and writes them to
storefront/public/Luna/comics/<slug>/. Sample paid titles only receive their preview pages:
the remaining pages are never bundled, so nothing can be "unlocked" in the browser.

Usage:  python3 scripts/luna/import-peppercarrot.py [--cache DIR]
Rights evidence and the exact source URLs are recorded in docs/luna-content-credits.md.
"""
import argparse, hashlib, json, os, sys, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'storefront/public/Luna/comics'
BASE = 'https://www.peppercarrot.com/0_sources'
# slug, source folder, episode number, language prefix, pages bundled (None = every story page)
EPISODES = [
    ('pepper-carrot-01', 'ep01_Potion-of-Flight', 1, 'en', 3, None),
    ('pepper-carrot-02', 'ep02_Rainbow-potions', 2, 'en', 5, None),
    ('pepper-carrot-03', 'ep03_The-secret-ingredients', 3, 'en', 7, None),
    ('pepper-carrot-05', 'ep05_Special-holiday-episode', 5, 'en', 4, None),
    ('pepper-carrot-06-ru', 'ep06_The-Potion-Contest', 6, 'ru', 9, None),
    ('pepper-carrot-08', 'ep08_Pepper-s-Birthday-Party', 8, 'en', 6, 2),
    ('pepper-carrot-11', 'ep11_The-Witches-of-Chaosah', 11, 'en', 6, 2),
    ('pepper-carrot-15', 'ep15_The-Crystal-Ball', 15, 'en', 8, 3),
]
UA = {'User-Agent': 'LunaComicsImporter/1.0 (+https://www.bakhtiyaraj.dev/Luna)'}

def fetch(url, cache):
    target = cache / url.rsplit('/', 1)[1]
    if not target.exists():
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
            target.write_bytes(r.read())
    return target

def webp(src, dst, width=None, quality=80):
    im = Image.open(src).convert('RGB')
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=quality, method=6)
    return im.size

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default=str(ROOT / '.cache/luna-sources'))
    a = ap.parse_args()
    cache = Path(a.cache); cache.mkdir(parents=True, exist_ok=True)
    report = []
    for slug, folder, ep, lang, total, preview in EPISODES:
        dest = OUT / slug; dest.mkdir(parents=True, exist_ok=True)
        name = f'{lang}_Pepper-and-Carrot_by-David-Revoy_E{ep:02d}'
        files = []
        cover_url = f'{BASE}/{folder}/low-res/{name}.jpg'
        c = fetch(cover_url, cache)
        files.append({'role': 'cover', 'url': cover_url, 'sha256': hashlib.sha256(c.read_bytes()).hexdigest(),
                      'out': [f'{slug}/cover.webp', f'{slug}/cover-sm.webp'], 'size': webp(c, dest / 'cover.webp', 1100, 82)})
        webp(c, dest / 'cover-sm.webp', 560, 78)
        for p in range(1, (preview or total) + 1):
            url = f'{BASE}/{folder}/low-res/{name}P{p:02d}.jpg'
            s = fetch(url, cache)
            size = webp(s, dest / f'p{p:02d}.webp', 1200, 80)
            files.append({'role': f'page {p}', 'url': url, 'sha256': hashlib.sha256(s.read_bytes()).hexdigest(), 'out': [f'{slug}/p{p:02d}.webp'], 'size': size})
        report.append({'slug': slug, 'episode': ep, 'lang': lang, 'story_pages': total, 'bundled_pages': preview or total, 'files': files})
        print(f'{slug}: cover + {preview or total}/{total} pages', file=sys.stderr)
    (ROOT / 'scripts/luna/import-report.json').write_text(json.dumps(report, indent=1) + '\n')

if __name__ == '__main__':
    main()
