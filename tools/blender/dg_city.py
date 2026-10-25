# DOGMA v2 — surroundings: background city blocks, plazas around buildings, card shrubs, hedges
import math, random
from mathutils import Vector
from dg_facade import offset_poly
PI = math.pi

def city_bg(mb, rng, extent, holes, n=120, hmin=9, hmax=60, kinds=('citywall', 'citywall2', 'citywall3', 'citywall4', 'citywall5', 'citywall4')):
    """scatter background residential blocks (panel/brick mid-rise) avoiding holes [(x0,y0,x1,y1)]"""
    placed = []; tries = 0
    while len(placed) < n and tries < n * 40:
        tries += 1
        x = rng.uniform(-extent, extent); y = rng.uniform(-extent, extent)
        w = rng.choice((14, 16, 60, 75, 90, 24, 30)); d = rng.uniform(12, 15)
        if rng.random() < .5: w, d = d, w
        r = (x, y, x + w, y + d)
        if any(not (r[2] < h[0] or r[0] > h[2] or r[3] < h[1] or r[1] > h[3]) for h in holes + placed): continue
        placed.append((x - 8, y - 8, x + w + 8, y + d + 8))
        fl = rng.choice((5, 9, 9, 10, 12, 16, 17, 17, 22)); h = fl * 2.9 + 1.0
        m = rng.choice(kinds)
        mb.box(x, y, 0, x + w, y + d, h, m)
        mb.box(x - .15, y - .15, h, x + w + .15, y + d + .15, h + .6, 'old_roof')
        mb.box(x + w * .4, y + d * .3, h, x + w * .6, y + d * .7, h + 2.4, 'old_roof')
        mb.box(x - 1, y - 1, -.02, x + w + 1, y + d + 1, .06, 'paving_dark')

def houses(mb, rng, area, n, holes=()):
    """private-sector low-rise: 1–2 storey houses with pitched roofs, fences, yard trees"""
    x0, y0, x1, y1 = area; k = 0; tries = 0
    while k < n and tries < n * 20:
        tries += 1; x = rng.uniform(x0, x1); y = rng.uniform(y0, y1)
        if any(h[0] <= x <= h[2] and h[1] <= y <= h[3] for h in holes): continue
        w = rng.uniform(8, 13); d = rng.uniform(8, 11); h = rng.choice((3.2, 3.2, 6.2))
        wall = rng.choice(('house1', 'house2', 'house3', 'citywall2'))
        mb.box(x, y, 0, x + w, y + d, h, wall)
        rf = rng.choice(('roof_red', 'roof_brown', 'old_roof'))
        mb.face([(x - .5, y - .5, h), (x + w + .5, y - .5, h), (x + w + .5, y + d / 2, h + 2.4), (x - .5, y + d / 2, h + 2.4)], rf)
        mb.face([(x + w + .5, y + d + .5, h), (x - .5, y + d + .5, h), (x - .5, y + d / 2, h + 2.4), (x + w + .5, y + d / 2, h + 2.4)], rf)
        mb.face([(x, y, h), (x, y + d / 2, h + 2.3), (x, y + d, h)], wall); mb.face([(x + w, y + d, h), (x + w, y + d / 2, h + 2.3), (x + w, y, h)], wall)
        for wx in (x + 1.5, x + w - 2.7):
            mb.box(wx, y - .03, 1.0, wx + 1.2, y + .02, 2.4, 'glass')
        mb.box(x - 3, y - 4, 0, x + w + 3, y - 3.95, 1.8, 'fence_wood')
        k += 1

def plaza(mb, poly, margin=6.0, mat='paving', z=0.0, h=.1):
    mb.prism(offset_poly(poly, margin), z - .02, z + h, mat)

def card_shrub(mb, x, y, r, rng, z=0.0, mat='leafcard', flowers=False):
    mb.rnd = rng.random()
    mb.blob(x, y, z + r * .4, r * .75, 'leaf_inner', rng, sub=1, squash=.6, jitter=.2)
    for i in range(int(40 * r * r) + 12):
        a = rng.uniform(0, 2 * PI); u = rng.uniform(-.1, 1); s = math.sqrt(max(0, 1 - u * u)); k = rng.uniform(.8, 1.05)
        p = Vector((x + s * math.cos(a) * r * k, y + s * math.sin(a) * r * k, z + r * .4 + u * r * .6 * k))
        q = rng.uniform(.25, .45)
        d1 = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))).normalized()
        d2 = d1.cross(Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))).normalized()
        d1 *= q / 2; d2 *= q / 2
        m = 'flowers' if (flowers and i % 3 == 0) else mat
        mb.face([tuple(p - d1 - d2), tuple(p + d1 - d2), tuple(p + d1 + d2), tuple(p - d1 + d2)], m)
    mb.rnd = 0

def hedge(mb, x0, y0, x1, y1, rng, h=.9, z=0.0):
    L = math.hypot(x1 - x0, y1 - y0); n = max(2, int(L / .7))
    for i in range(n + 1):
        t = i / n; card_shrub(mb, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, h * .6, rng, z=z)

def flowerbed(mb, x0, y0, x1, y1, rng, z=0.0):
    mb.box(x0, y0, z, x1, y1, z + .25, 'soil')
    for i in range(int((x1 - x0) * (y1 - y0) * 1.2)):
        card_shrub(mb, rng.uniform(x0, x1), rng.uniform(y0, y1), rng.uniform(.25, .45), rng, z=z + .2, flowers=True)
