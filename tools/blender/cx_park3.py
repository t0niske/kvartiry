# ЖК «Парк Победы 3» (DOGMA, Западный обход) — замкнутый квартал: 2 башни с бронзовой короной + крылья, сад с аркой
import math, random
from dg_core import MB, Mats, new_scene, sky, cam, coll, PI
from dg_facade import Building, chamfer, rect, bays, window, rail, balcony, roof_basic, edge_frame
import dg_land as LD
from dg_city import city_bg, plaza, card_shrub, hedge, flowerbed

def mats():
    M = Mats(); LD.land_mats(M)
    M.define('brick_grey', kind='brick', color='#bdb7af', color2='#8f8a84', mortar='#d9d4cc', rough=.85)
    M.define('brick_brown', kind='brick', color='#4e3c33', color2='#3d2f28', mortar='#6e6158', rough=.85)
    M.define('brick_beige', kind='brick', color='#cdb99c', color2='#b9a385', mortar='#e2d8c8', rough=.85)
    M.define('ground_dark', kind='stone', color='#2f2a27', scale=3, rough=.5, var=.06)
    M.define('bronze', color='#a8875f', rough=.35, metal=.85)
    M.define('cream', kind='plaster', color='#e8e2d6', scale=5, rough=.7, var=.04)
    M.define('frame', color='#2a2b2d', rough=.32, metal=.7)
    M.define('glass', kind='window', color='#28313a', color2='#63768a', rough=.02, ior=1.52)
    M.define('interior', kind='interior', rough=.8); M.define('reveal_in', color='#3a3735', rough=.8)
    M.define('railbars', kind='bars', color='#232426', rough=.4, metal=.7, scale=.11)
    M.define('fence', kind='bars', color='#2a2c2e', rough=.4, metal=.6, scale=.15)
    M.define('slab', color='#d7d1c6', rough=.6)
    M.define('roof', kind='noise', color='#8d8f91', scale=2, rough=.85, var=.1)
    M.define('coping', color='#e3ddd2', rough=.5); M.define('machine', color='#c9c5bd', rough=.6)
    M.define('ac', color='#d6d8d9', rough=.4, metal=.3); M.define('old_roof', color='#5b5f62', rough=.6, metal=.4)
    return M

def tower_style(rng, crown_n=4):
    S = dict(t=.42, FH=3.05, GH=6.0, parapet=.6, glass='glass', frame='frame', pane=.95, rail='railbars', sillm='coping', fw=.06)
    def wall(ctx, f, a, b):
        if f == 0: return 'ground_dark'
        if f >= ctx['b'].nf - crown_n: return 'brick_beige'
        L = ctx['L']; c = (a + b) / 2
        if ctx['ei'] % 2 == 0: return 'brick_brown' if (c < 3.2 or c > L - 3.2) else 'brick_grey'
        return 'brick_brown'
    def openings(ctx, f, z0, zt):
        L = ctx['L']; ops = []; nf = ctx['b'].nf
        if f == 0:
            for (a, b) in bays(L, 3.0, 1.0): ops.append(dict(u0=a + .55, u1=b - .55, zs=z0 + .1, zh=zt - .55, kind='shop'))
            return ops
        if f >= nf - crown_n:
            for (a, b) in bays(L, 3.0, 1.0): ops.append(dict(u0=a + .5, u1=b - .5, zs=z0 + .05, zh=zt - .2, kind='crown'))
            return ops
        for i, (a, b) in enumerate(bays(L, 2.8, 1.2)):
            c = (a + b) / 2
            if (i + f) % 3 == 0: ops.append(dict(u0=c - .75, u1=c + .75, zs=z0 + .06, zh=zt - .4, kind='balc'))
            else: ops.append(dict(u0=c - .7, u1=c + .7, zs=z0 + .82, zh=zt - .4, kind='win'))
        return ops
    def fill(ctx, f, o):
        mb = ctx['b'].mb; t = S['t']; k = o['kind']
        if k == 'shop':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='shop', rng=rng, panes=2, transom=1.3)
        elif k == 'crown':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='curtain', rng=rng, panes=2, transom=False, sill=False)
            mb.box(o['u0'], -t * .55 - .04, o['zs'], o['u1'], -t * .55 + .05, o['zs'] + .5, 'bronze')
        elif k == 'balc':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.5)
            balcony(mb, o['u0'] - .25, o['u1'] + .25, o['zs'], .95, S)
        else:
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='win', rng=rng, panes=2, transom=False)
    def decor(ctx):
        b = ctx['b']; mb = b.mb; L = ctx['L']; H = b.H; nf = b.nf
        z1 = b.z(1); zc = b.z(nf - crown_n)
        for (a, c) in bays(L, 3.0, 1.0):       # ground pilasters
            for u in (a, c): mb.box(u - .3, 0, b.base, u + .3, .25, z1, 'ground_dark')
        mb.box(-.2, 0, z1 - .4, L + .2, .3, z1, 'ground_dark')
        mb.box(-.35, 0, zc - .5, L + .35, .45, zc + .05, 'cream')           # white band under the crown
        for (a, c) in bays(L, 3.0, 1.0):       # bronze/beige crown pilasters
            for u in (a, c): mb.box(u - .45, 0, zc, u + .45, .35, H, 'brick_beige')
        mb.box(-1.4, -.4, H + .1, L + 1.4, 1.5, H + .9, 'bronze')            # projecting frame cornice
        mb.box(-1.4, 1.2, H - 3.2, -1.1, 1.5, H + .1, 'bronze'); mb.box(L + 1.1, 1.2, H - 3.2, L + 1.4, 1.5, H + .1, 'bronze')
    def roof(b): roof_basic(b, S, machine=True, rng=rng, ac=14)
    S.update(wall=wall, openings=openings, fill=fill, decor=decor, roof=roof)
    return S

def wing_style(rng, gold=False, sec=24.0):
    S = dict(t=.4, FH=3.05, GH=6.0, parapet=1.0, glass='glass', frame='frame', pane=.95, rail='railbars', sillm='coping', fw=.06)
    def wall(ctx, f, a, b):
        if f == 0: return 'ground_dark'
        if gold: return 'cream'
        c = (a + b) / 2; return 'brick_grey' if (int(c // sec) + ctx['ei']) % 2 == 0 else 'brick_brown'
    def openings(ctx, f, z0, zt):
        L = ctx['L']; ops = []
        if f == 0:
            for (a, b) in bays(L, 3.2, .8): ops.append(dict(u0=a + .55, u1=b - .55, zs=z0 + .1, zh=zt - .5, kind='shop'))
            return ops
        for i, (a, b) in enumerate(bays(L, 2.75, 1.0)):
            c = (a + b) / 2
            if (i + 2 * f) % 4 == 0: ops.append(dict(u0=c - .75, u1=c + .75, zs=z0 + .06, zh=zt - .4, kind='balc'))
            else: ops.append(dict(u0=c - .7, u1=c + .7, zs=z0 + .82, zh=zt - .4, kind='win'))
        return ops
    def fill(ctx, f, o):
        mb = ctx['b'].mb; t = S['t']; k = o['kind']
        if k == 'shop': window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='shop', rng=rng, panes=2, transom=1.3)
        elif k == 'balc':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.5)
            balcony(mb, o['u0'] - .25, o['u1'] + .25, o['zs'], .95, S)
        else:
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='win', rng=rng, panes=2, transom=False)
            if gold: mb.box(o['u0'] - .35, 0, o['zs'] - .8, o['u0'] - .1, .12, o['zh'] + .2, 'bronze'); mb.box(o['u1'] + .1, 0, o['zs'] - .8, o['u1'] + .35, .12, o['zh'] + .2, 'bronze')
    def decor(ctx):
        b = ctx['b']; mb = b.mb; L = ctx['L']; H = b.H
        z1 = b.z(1)
        for (a, c) in bays(L, 3.2, .8):
            for u in (a, c): mb.box(u - .3, 0, b.base, u + .3, .25, z1, 'ground_dark')
        mb.box(-.2, 0, z1 - .4, L + .2, .3, z1, 'ground_dark')
        mb.box(-.3, 0, H - .2, L + .3, .4, H + .5, 'coping')
        k = sec
        while k < L - 1 and not gold:          # thin vertical joints between colour sections
            mb.box(k - .12, 0, z1, k + .12, .1, H, 'coping'); k += sec
    def roof(b): roof_basic(b, S, machine=False, rng=rng, ac=16)
    S.update(wall=wall, openings=openings, fill=fill, decor=decor, roof=roof)
    return S

TOWERS = [(rect(-74, -20, -50, 24), 21), (rect(48, -30, 72, 26), 21)]
WINGS = [(rect(-50, 10, 48, 26), 13, False), (rect(-30, -30, 48, -16), 12, False), (rect(-50, -30, -30, -12), 9, True)]

def arch(mb, x0, x1, y, w, h, n=24, mat='canvas'):
    """white tensile canopy arch spanning x0..x1"""
    pts = []
    for i in range(n + 1):
        t = i / n; x = x0 + (x1 - x0) * t; z = h * math.sin(PI * t) ** .85
        pts.append((x, z))
    for i in range(n):
        (xa, za), (xb, zb) = pts[i], pts[i + 1]
        mb.face([(xa, y - w / 2, za), (xb, y - w / 2, zb), (xb, y + w / 2, zb), (xa, y + w / 2, za)], mat)
        mb.face([(xa, y + w / 2, za - .08), (xb, y + w / 2, zb - .08), (xb, y - w / 2, zb - .08), (xa, y - w / 2, za - .08)], mat)

def build(out_blend=None, quick=False):
    rng = random.Random(55)
    s = new_scene('DOGMA_park3', samples=48 if quick else 128)
    M = mats(); cb = coll(s, 'buildings'); cl = coll(s, 'landscape')
    for i, (poly, nf) in enumerate(TOWERS):
        mb = MB('park3_tower_%d' % (i + 1)); Building(mb, poly, nf, tower_style(random.Random(500 + i)), rng=random.Random(i)).run(); mb.build(cb, M)
    for i, (poly, nf, gold) in enumerate(WINGS):
        mb = MB('park3_wing_%d' % (i + 1)); Building(mb, poly, nf, wing_style(random.Random(600 + i), gold), rng=random.Random(20 + i)).run(); mb.build(cb, M)
    land(cl, M, rng)
    sky(s, sun_el=20, sun_az=255, sun_str=1.1)
    c1 = cam(s, 'cam_aerial', (-150, -230, 190), (0, 0, 8), 32)
    c2 = cam(s, 'cam_yard', (34, -12, 1.7), (-24, 18, 26), 18)
    c3 = cam(s, 'cam_street', (-30, -76, 1.7), (2, 0, 26), 22)
    s.camera = c1
    return s

def land(cl, M, rng):
    g = MB('park3_ground')
    g.box(-700, -700, -.3, 700, 700, -.05, 'grass')
    LD.road(g, (-600, -62), (600, -62), 20, lanes=4, walk=5)       # Западный обход
    LD.road(g, (-105, -300), (-105, 300), 12, walk=4); LD.road(g, (100, -300), (100, 300), 12, walk=4)
    LD.road(g, (-105, 62), (100, 62), 9, walk=3)
    for (poly, nf) in TOWERS: plaza(g, poly, 8, 'paving_dark')
    for (poly, nf, gd) in WINGS: plaza(g, poly, 8, 'paving_dark')
    # garden courtyard
    g.box(-50, -16, .03, 48, 10, .12, 'paving_warm')
    for (x0, y0, x1, y1) in ((-46, -2, -18, 8), (-12, 0, 18, 8), (22, -14, 46, -2), (-26, -14, 6, -6)): g.box(x0, y0, .05, x1, y1, .2, 'grass_lush')
    arch(g, -44, -24, -8, 3.2, 7.5)
    LD.playground(g, 30, 3, 14, 9, rng, z=.12, surf='rubber_blue')
    LD.pergola(g, 6, -14, 18, -10, z=.12)
    for k in range(7): LD.bench(g, -40 + k * 12, -4, 0, z=.12)
    for (x, y) in ((-40, 6), (-20, -2), (0, 8), (20, -8), (40, -12), (12, 0)): LD.lamp(g, x, y, 4.0, z=.12)
    LD.parking(g, -95, -50, -10, -44, rng); LD.parking(g, 10, -50, 92, -44, rng)
    LD.parking(g, 78, -30, 92, 40, rng, ang=0, fill=.6)
    for k in range(36): LD.car(g, -560 + k * 31 + rng.uniform(-5, 5), -62 + (-5 if k % 2 else 5), 0 if k % 2 else PI, rng)
    t = MB('park3_trees')
    for x in range(-590, 600, 12): LD.tree(t, x + rng.uniform(-2, 2), -76, rng.uniform(6, 9), rng); LD.tree(t, x + rng.uniform(-2, 2), -48.5, rng.uniform(5, 7), rng)
    LD.scatter_trees(t, rng, (-330, -330, 330, -85), 220, 8, 14, kind_p=.15)
    LD.scatter_trees(t, rng, (-330, 75, 330, 330), 200, 8, 14, kind_p=.15)
    LD.scatter_trees(t, rng, (-46, -14, 46, 8), 18, 4, 7, avoid=[(-45, -10, -23, -6), (23, -2, 37, 8), (5, -15, 19, -9)], z=.12)
    t.build(cl, M)
    sh = MB('park3_shrubs')
    for (x0, y0, x1, y1) in ((-46, -2, -18, 8), (-12, 0, 18, 8), (22, -14, 46, -2), (-26, -14, 6, -6)):
        for k in range(int((x1 - x0) * (y1 - y0) / 10)): card_shrub(sh, rng.uniform(x0, x1), rng.uniform(y0, y1), rng.uniform(.4, .85), rng, z=.2, flowers=rng.random() < .3)
    for (x0, y0, x1, y1) in ((-16, -4, -6, 0), (8, 4, 16, 8), (-40, 2, -32, 6)): flowerbed(sh, x0, y0, x1, y1, rng, z=.12)
    sh.build(cl, M)
    bg = MB('park3_city')
    city_bg(bg, rng, 650, [(-125, -90, 120, 80)], n=170)
    bg.build(cl, M)
    g.build(cl, M)
