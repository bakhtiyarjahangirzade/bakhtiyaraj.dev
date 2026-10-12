# Generates the Windows icons for the game desktop builds (amber screen + glyph). Requires Pillow.
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os
S = 512
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def base():
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((20, 20, S - 20, S - 20), radius=100, fill=(42, 40, 37, 255), outline=(10, 9, 8, 255), width=6)
    d.rounded_rectangle((70, 70, S - 70, S - 70), radius=36, fill=(10, 9, 8, 255))
    d.rounded_rectangle((84, 84, S - 84, S - 84), radius=26, fill=(30, 18, 6, 255))
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]): d.ellipse((44 + i * 26, 36, 60 + i * 26, 52), fill=c + (255,))
    return im
def glow_draw(im, fn):
    g = Image.new('RGBA', (S, S), (0, 0, 0, 0)); fn(ImageDraw.Draw(g))
    im = Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(10))); return Image.alpha_composite(im, g)
AMBER = (255, 181, 63, 255)
def text(t, size, dy=0):
    def f(d):
        font = ImageFont.truetype(FONT, size); w = d.textbbox((0, 0), t, font=font)
        d.text(((S - (w[2] - w[0])) / 2 - w[0], (S - (w[3] - w[1])) / 2 - w[1] + dy), t, font=font, fill=AMBER)
    return f
def domino(d):
    x0, y0, w, h = 196, 120, 120, 272
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=18, outline=AMBER, width=10)
    d.line((x0 + 16, y0 + h / 2, x0 + w - 16, y0 + h / 2), fill=AMBER, width=8)
    for px, py in [(.3, .25), (.7, .75), (.5, .5)]: d.ellipse((x0 + px * w - 13, y0 + py * h / 2 - 13, x0 + px * w + 13, y0 + py * h / 2 + 13), fill=AMBER)
    for px, py in [(.3, .2), (.7, .2), (.3, .5), (.7, .5), (.3, .8), (.7, .8)]: d.ellipse((x0 + px * w - 12, y0 + h / 2 + py * h / 2 - 12, x0 + px * w + 12, y0 + h / 2 + py * h / 2 + 12), fill=AMBER)
games = {'chess': text('♞', 240, 6), 'last-one': text('1!', 210), 'durak': text('♠', 250, 10), 'domino': domino, 'serpent': text('S', 250), 'blackjack': text('21', 220), 'roulette': text('◎', 260, 6), 'poker': text('♥', 250, 10), 'slots': text('7', 270)}
os.makedirs('icons', exist_ok=True)
for k, fn in games.items():
    im = glow_draw(base(), fn)
    im.save(f'icons/{k}.ico', sizes=[(16, 16), (32, 32), (48, 48), (256, 256)])
print('icons ok')
