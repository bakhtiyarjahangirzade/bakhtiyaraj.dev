# Converts generated PNG artwork (ChatGPT image generation, see README) into small WebP files under public/assets/game.
import sys, os
from PIL import Image
src, dst = sys.argv[1], os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'game')
os.makedirs(dst, exist_ok=True)
plan = {'felt-green': (512, 512), 'felt-red': (512, 512), 'wood-rail': (512, 512), 'card-back': (300, 420)}
for i in range(1, 8): plan[f'avatar-{i}'] = (192, 192)
for name, size in plan.items():
    p = os.path.join(src, name + '.png')
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGBA').resize(size, Image.LANCZOS)
    im.save(os.path.join(dst, name + '.webp'), quality=82, method=6)
    print(name, os.path.getsize(os.path.join(dst, name + '.webp')))
