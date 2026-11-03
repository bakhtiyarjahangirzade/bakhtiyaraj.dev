#!/usr/bin/env python3
"""Download cached candidates (originals kept in <cache>/orig) and build numbered contact sheets for review.
Usage: python3 -I sheet.py <cache_dir> <concept> [cols=5]"""
import json, sys, os, urllib.request, concurrent.futures as cf
from PIL import Image, ImageDraw
cache, concept = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
data = json.load(open(os.path.join(cache, concept + '.json')))
od = os.path.join(cache, 'orig'); os.makedirs(od, exist_ok=True)
def get(item):
    p = os.path.join(od, item['id'] + '.jpg')
    if not os.path.exists(p):
        try:
            req = urllib.request.Request(item['url'], headers={'User-Agent': 'BAKHY-concept-assets/1.0 (+https://www.bakhtiyaraj.dev)'})
            with urllib.request.urlopen(req, timeout=60) as r: b = r.read()
            open(p, 'wb').write(b)
        except Exception as e:
            return None
    return p
items = list(data.values())
with cf.ThreadPoolExecutor(6) as ex: paths = list(ex.map(get, items))
cell = 300; rows_per = 4
ok = [(i, it, p) for i, (it, p) in enumerate(zip(items, paths)) if p]
for s in range(0, len(ok), cols * rows_per):
    chunk = ok[s:s + cols * rows_per]
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, rows * (cell + 22)), 'white'); d = ImageDraw.Draw(sheet)
    for j, (i, it, p) in enumerate(chunk):
        try:
            im = Image.open(p).convert('RGB'); im.thumbnail((cell - 6, cell - 6))
        except Exception: continue
        x, y = (j % cols) * cell, (j // cols) * (cell + 22)
        sheet.paste(im, (x + 3, y + 3)); d.text((x + 4, y + cell + 4), f"#{i} {it['width']}x{it['height']} {it['title'][:34]}", fill='black')
    out = os.path.join(cache, f'sheet-{concept}-{s // (cols * rows_per)}.jpg'); sheet.save(out, quality=80); print(out)
