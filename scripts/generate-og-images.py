#!/usr/bin/env python3
"""Dev-only: renders branded 1200x630 Open Graph cards into public/og/. Outputs are committed."""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'og')
G = '/usr/share/fonts/truetype/sand-box/google'
SERIF = f'{G}/DM Serif Display/DMSerifDisplay-Regular.ttf'
BOLD = f'{G}/Poppins/Poppins-SemiBold.ttf'
REG = f'{G}/Poppins/Poppins-Medium.ttf'
PROMO = os.path.join(os.path.dirname(ROOT), 'DinnerFromFridge-promo-16x9.png')
FRIDGE = os.path.join(ROOT, 'public', 'sample-fridge.jpg')
ICON = os.path.join(ROOT, 'public', 'icon-512.png')
TERRA = (196, 92, 38)
CREAM = (255, 248, 241)
W, H = 1200, 630

CARDS = {
    'recipe': ('A dinner from what\'s', 'already in your fridge', 'Recipe · cook steps · ready tonight'),
    'share': ('Tonight\'s dinners,', 'picked from a real fridge', 'Open the ideas — then snap your own'),
    'challenge': ('Can you make dinner', 'from just these?', 'Take the fridge challenge'),
    'leftovers': ('Cook before you shop.', 'Save money tonight.', 'Leftover rescue · 2–4 ingredients'),
    'ramadan': ('Iftar & suhoor', 'from your fridge', 'Ramadan dinner ideas · halal · no pork'),
    'eid': ('Eid leftovers,', 'turned into dinner', 'Biryani, kebab & curry ideas'),
    'desi': ('Desi dinners', 'from your fridge', 'Karahi · dal · biryani · sabzi'),
    'arabic': ('Arabic dinners', 'from your fridge', 'Kabsa · mandi · shakshuka · hummus'),
    'streak': ('Home-cooked streak', 'money saved, dinner made', 'Track your home cooking'),
    'sample': ('See it work in', 'one tap — sample fridge', 'No sign-up · free to try'),
}


def cover(img, w, h):
    r = max(w / img.width, h / img.height)
    img = img.resize((int(img.width * r + 1), int(img.height * r + 1)), Image.LANCZOS)
    x = (img.width - w) // 2
    y = (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def rounded(im, rad):
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), rad, fill=255)
    out = Image.new('RGBA', im.size)
    out.paste(im, (0, 0), mask)
    return out


def card(slug, l1, l2, sub):
    bg = cover(Image.open(FRIDGE).convert('RGB'), W, H).filter(ImageFilter.GaussianBlur(2))
    base = bg.convert('RGBA')
    # left-to-right dark gradient for text legibility
    grad = Image.new('RGBA', (W, H))
    gd = ImageDraw.Draw(grad)
    for x in range(W):
        a = int(235 - 170 * (x / W))
        gd.line([(x, 0), (x, H)], fill=(30, 18, 10, max(40, a)))
    base = Image.alpha_composite(base, grad)
    d = ImageDraw.Draw(base)
    icon = rounded(Image.open(ICON).convert('RGB').resize((84, 84)), 20)
    base.alpha_composite(icon, (64, 56))
    d.text((166, 72), 'Dinner From Fridge', font=ImageFont.truetype(BOLD, 34), fill=CREAM)
    f1 = ImageFont.truetype(SERIF, 78)
    d.text((64, 196), l1, font=f1, fill=(255, 255, 255))
    d.text((64, 286), l2, font=f1, fill=(245, 164, 110))
    d.text((66, 398), sub, font=ImageFont.truetype(REG, 30), fill=(240, 228, 215))
    fu = ImageFont.truetype(BOLD, 32)
    label = 'dinnerfromfridge.com'
    tw = d.textlength(label, font=fu)
    d.rounded_rectangle((64, 488, 64 + tw + 64, 488 + 74), 37, fill=TERRA)
    d.text((96, 500), label, font=fu, fill=(255, 255, 255))
    base.convert('RGB').save(os.path.join(OUT, f'{slug}.jpg'), quality=86)


def main():
    os.makedirs(OUT, exist_ok=True)
    promo = cover(Image.open(PROMO).convert('RGB'), W, H)
    promo.save(os.path.join(OUT, 'default.jpg'), quality=86)
    for slug, (a, b, c) in CARDS.items():
        card(slug, a, b, c)
    print('wrote', sorted(os.listdir(OUT)))


if __name__ == '__main__':
    main()
