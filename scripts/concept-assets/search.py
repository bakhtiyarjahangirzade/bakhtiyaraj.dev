#!/usr/bin/env python3
"""Search CC0 / public-domain photos through the public Openverse API and cache the results.

Usage: python3 -I search.py <cache_dir> <concept> "<query>" [source=wordpress] [pages=1]
Results go to <cache_dir>/<concept>.json (merged, de-duplicated by Openverse id).
Only openly licensed (CC0 / PDM by default) results are kept, with full provenance.
"""
import json, sys, os, time, urllib.parse, urllib.request
cache, concept, query = sys.argv[1], sys.argv[2], sys.argv[3]
source = sys.argv[4] if len(sys.argv) > 4 else 'wordpress'
pages = int(sys.argv[5]) if len(sys.argv) > 5 else 1
os.makedirs(cache, exist_ok=True)
path = os.path.join(cache, concept + '.json')
data = json.load(open(path)) if os.path.exists(path) else {}
for page in range(1, pages + 1):
    params = {'q': query, 'license': 'cc0,pdm', 'page_size': 20, 'page': page}
    if source != 'any':
        params['source'] = source
    url = 'https://api.openverse.org/v1/images/?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': 'BAKHY-concept-assets/1.0 (+https://www.bakhtiyaraj.dev)'})
    res = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                res = json.load(r)
            break
        except Exception as e:
            print('retry', attempt, e); time.sleep(5)
    if res is None:
        continue
    for x in res.get('results', []):
        if x['id'] in data:
            data[x['id']]['queries'] = sorted(set(data[x['id']].get('queries', []) + [query]))
            continue
        data[x['id']] = {k: x.get(k) for k in ('id', 'title', 'creator', 'creator_url', 'license', 'license_version', 'license_url', 'provider', 'source', 'foreign_landing_url', 'url', 'width', 'height', 'thumbnail')}
        data[x['id']]['queries'] = [query]
    print(f'{concept} "{query}" p{page}: {len(res.get("results", []))} results (total cached {len(data)})')
    time.sleep(1.2)
tmp = path + '.tmp'
json.dump(data, open(tmp, 'w'), indent=1, ensure_ascii=False)
os.replace(tmp, path)
