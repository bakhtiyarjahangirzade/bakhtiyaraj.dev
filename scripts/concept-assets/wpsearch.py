"""Search the WordPress Photo Directory (all photos CC0) directly and cache results in the Openverse-shaped format
used by scripts/concept-assets (so sheet.py / process.py work unchanged).
Usage: python3 -I wpsearch.py <cache_dir> <cache_name> "<query>" [per_page=30]"""
import json, sys, os, re, html, urllib.parse, urllib.request
cache, name, query = sys.argv[1], sys.argv[2], sys.argv[3]
per = int(sys.argv[4]) if len(sys.argv) > 4 else 30
path = os.path.join(cache, name + '.json')
data = json.load(open(path)) if os.path.exists(path) else {}
url = 'https://wordpress.org/photos/wp-json/wp/v2/photos?' + urllib.parse.urlencode({'search': query, 'per_page': per, '_embed': 'author,wp:featuredmedia'})
req = urllib.request.Request(url, headers={'User-Agent': 'BAKHY-concept-assets/1.0 (+https://www.bakhtiyaraj.dev)'})
res = json.load(urllib.request.urlopen(req, timeout=90))
n = 0
for x in res:
    emb = x.get('_embedded', {})
    media = (emb.get('wp:featuredmedia') or [{}])[0]
    md = media.get('media_details') or {}
    sizes = md.get('sizes') or {}
    big = sizes.get('2048x2048') or sizes.get('1536x1536') or sizes.get('full') or {}
    src = big.get('source_url') or media.get('source_url')
    if not src: continue
    author = (emb.get('author') or [{}])[0]
    key = 'wp-%d' % x['id']
    desc = html.unescape(re.sub('<[^>]+>', '', x.get('content', {}).get('rendered', ''))).strip()
    if key in data:
        data[key]['queries'] = sorted(set(data[key]['queries'] + [query])); continue
    data[key] = {'id': key, 'title': desc[:160] or 'Photo', 'creator': author.get('name') or '', 'creator_url': author.get('link'),
                 'license': 'cc0', 'license_version': '1.0', 'license_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
                 'provider': 'wordpress', 'source': 'wordpress', 'foreign_landing_url': x['link'], 'url': src,
                 'width': big.get('width') or md.get('width'), 'height': big.get('height') or md.get('height'),
                 'thumbnail': x.get('photo-thumbnail-url'), 'queries': [query]}
    n += 1
tmp = path + '.tmp'
json.dump(data, open(tmp, 'w'), indent=1, ensure_ascii=False)
os.replace(tmp, path)
print(f'{name} "{query}": {len(res)} results, {n} new (total {len(data)})')
