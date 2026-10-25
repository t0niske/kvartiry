# ЖК «РИДЗ» (DOGMA, ул. Пригородная, у Кубани) — разноцветные кирпичные башни, светлый каменный цоколь
import math, random
from dg_core import MB, Mats, new_scene, sky, cam, coll, PI
from dg_facade import Building, chamfer, rect, bays, window, rail, balcony, roof_basic, edge_frame
import dg_land as LD
from dg_city import city_bg, plaza, card_shrub, hedge, flowerbed

BRICKS = {  # name: (color, color2, mortar)
    'burgundy': ('#6d2a2b', '#561f21', '#8a6a66'), 'graphite': ('#3b3735', '#2b2827', '#5a5653'),
    'sand': ('#c6b294', '#b19c7e', '#ddd2c0'), 'rust': ('#83402f', '#6b3326', '#a88a7c'),
    'brown': ('#7b5b49', '#664a3b', '#a8988a'), 'taupe': ('#8d8073', '#776a5e', '#b3a99e'), 'beige': ('#b8a48b', '#a28f77', '#d6cbbb'),
}

def mats():
    M = Mats(); LD.land_mats(M)
    for k, (c1, c2, mo) in BRICKS.items(): M.define('brick_' + k, kind='brick', color=c1, color2=c2, mortar=mo, rough=.85)
    M.define('stone', kind='stone', color='#d9d5cd', scale=2.5, rough=.55, var=.06)
    M.define('frame', color='#232426', rough=.32, metal=.7)
    M.define('glass', kind='window', color='#262e35', color2='#5d6f7d', rough=.02, ior=1.52)
    M.define('interior', kind='interior', rough=.8); M.define('reveal_in', color='#3a3735', rough=.8)
    M.define('railbars', kind='bars', color='#202123', rough=.4, metal=.7, scale=.11)
    M.define('fence', kind='bars', color='#2a2c2e', rough=.4, metal=.6, scale=.15)
    M.define('slab', color='#2d2e30', rough=.5, metal=.3)
    M.define('roof', kind='noise', color='#5a5c5e', scale=2, rough=.85, var=.1)
    M.define('coping', color='#2b2d30', rough=.35, metal=.7); M.define('machine', color='#68696b', rough=.6)
    M.define('ac', color='#c8cacb', rough=.4, metal=.3); M.define('old_roof', color='#5b5f62', rough=.6, metal=.4)
    M.define('reed', kind='leafcard', color='#8a8a4a', color2='#c2b46a', scale=14, rough=.8)
    M.define('river', color='#3d5c62', rough=.04, ior=1.33, coat=1.0)
    M.define('sand_bank', kind='noise', color='#a8987a', scale=3, rough=.95)
    return M

def style(rng, brick, tower=True):
    S = dict(t=.42, FH=3.0, GH=6.4, parapet=1.3, glass='glass', frame='frame', pane=.95, rail='railbars', sillm='coping', fw=.06)
    bm = 'brick_' + brick
    def wall(ctx, f, a, b): return 'stone' if f == 0 else bm
    def openings(ctx, f, z0, zt):
        L = ctx['L']; ops = []
        if f == 0:
            for (a, b) in bays(L, 3.6, 1.2): ops.append(dict(u0=a + .55, u1=b - .55, zs=z0 + .1, zh=zt - .5, kind='shop'))
            return ops
        B = bays(L, 2.7, 1.0)
        for i, (a, b) in enumerate(B):
            c = (a + b) / 2
            if tower and i % 4 == 2 and f > 1:
                ops.append(dict(u0=a + .25, u1=b - .25, zs=z0, zh=zt - .3, kind='loggia'))
            elif (not tower) and i % 3 == 1:
                ops.append(dict(u0=c - .8, u1=c + .8, zs=z0 + .06, zh=zt - .35, kind='french'))
            else:
                w = .55 if (i % 2) else .75
                ops.append(dict(u0=c - w, u1=c + w, zs=z0 + .8, zh=zt - .35, kind='win'))
        return ops
    def fill(ctx, f, o):
        mb = ctx['b'].mb; t = S['t']; k = o['kind']
        if k == 'shop':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='shop', rng=rng, panes=2, transom=1.4)
        elif k == 'loggia':   # deep recessed loggia with glass rail
            deep = 1.3
            mb.box(o['u0'], -deep, o['zs'] - .05, o['u1'], 0, o['zs'] + .02, 'slab')
            window(mb, o['u0'] + .1, o['u1'] - .1, o['zs'] + .02, o['zh'], deep + .2, S, kind='french', rng=rng, panes=2, transom=False, sill=False)
            for u in (o['u0'], o['u1'] - .05): mb.box(u, -deep, o['zs'], u + .05, 0, o['zh'], bm)
            mb.box(o['u0'], -deep, o['zh'], o['u1'], 0, o['zh'] + .02, 'slab')
            rail(mb, o['u0'], o['u1'], -.06, o['zs'], S, h=1.05)
        elif k == 'french':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.5)
            rail(mb, o['u0'] + .02, o['u1'] - .02, .07, o['zs'], S, h=1.05)
        else:
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='win', rng=rng, panes=1 if o['u1'] - o['u0'] < 1.2 else 2, transom=False)
    def decor(ctx):
        b = ctx['b']; mb = b.mb; L = ctx['L']; H = b.H; nf = b.nf
        z1 = b.z(1)
        mb.box(-.2, 0, z1 - .35, L + .2, .18, z1 + .05, 'stone')              # stone podium cornice
        B = bays(L, 2.7, 1.0)
        if tower:   # pilasters every two bays running to the top and above the parapet
            for i in range(0, len(B) + 1, 2):
                u = B[0][0] + (B[-1][1] - B[0][0]) * i / len(B) if B else 0
                u = min(max(u, .25), L - .25)
                mb.box(u - .22, 0, z1, u + .22, .2, H + 2.0, bm)
            for ff in range(5, nf, 5):
                z = b.z(ff); mb.box(0, 0, z - .06, L, .12, z + .12, bm)
        else:       # horizontal string course every 2 floors
            for ff in range(2, nf, 2):
                z = b.z(ff); mb.box(-.05, 0, z - .1, L + .05, .14, z + .12, bm)
            mb.box(-.1, 0, H - .1, L + .1, .2, H + .3, bm)
    def roof(b): roof_basic(b, S, machine=True, rng=rng, ac=8)
    S.update(wall=wall, openings=openings, fill=fill, decor=decor, roof=roof)
    return S

BLD = [  # poly, floors, brick, tower?
    (rect(-11, -40, 11, -18), 25, 'burgundy', True),
    (rect(-72, -18, -50, 4), 20, 'brown', True), (rect(-74, -52, -26, -38), 12, 'beige', False),
    (rect(50, -18, 72, 4), 20, 'sand', True), (rect(26, -52, 74, -38), 12, 'sand', False),
    (rect(92, -8, 112, 12), 22, 'rust', True), (rect(-20, 30, 2, 52), 23, 'graphite', True),
    (rect(-62, 30, -26, 44), 10, 'brown', False), (rect(20, 30, 62, 44), 11, 'taupe', False),
    (rect(-110, -30, -92, 20), 18, 'graphite', True),
]

def build(out_blend=None, quick=False):
    rng = random.Random(42)
    s = new_scene('DOGMA_reed', samples=48 if quick else 128)
    M = mats(); cb = coll(s, 'buildings'); cl = coll(s, 'landscape')
    for i, (poly, nf, br, tw) in enumerate(BLD):
        mb = MB('reeds_%d' % (i + 1)); Building(mb, poly, nf, style(random.Random(400 + i), br, tw), rng=random.Random(i)).run(); mb.build(cb, M)
    land(cl, M, rng)
    sky(s, sun_el=38, sun_az=200)
    c1 = cam(s, 'cam_aerial', (-170, -390, 175), (0, -40, 5), 30)
    c2 = cam(s, 'cam_yard', (-6, 22, 1.7), (-2, -40, 34), 18)
    c3 = cam(s, 'cam_street', (2, -165, 1.75), (2, -30, 34), 24)
    s.camera = c1
    return s

def land(cl, M, rng):
    g = MB('reeds_ground')
    g.box(-700, -700, -.3, 700, 700, -.05, 'grass')
    LD.road(g, (-600, -90), (600, -90), 14, lanes=2, walk=4)          # ул. Пригородная
    LD.road(g, (-135, -300), (-135, 300), 12, walk=4); LD.road(g, (135, -300), (135, 300), 12, walk=4)
    LD.road(g, (-135, 80), (135, 80), 9, walk=3); LD.road(g, (-135, 14), (135, 14), 7, walk=2.5, mark=False)
    for (poly, nf, br, tw) in BLD: plaza(g, poly, 8, 'paving_dark')
    # courtyards
    for (x0, y0, x1, y1) in ((-46, -34, -16, 8), (18, -34, 46, 8), (-20, 54, 40, 74)):
        g.box(x0, y0, .03, x1, y1, .1, 'paving_warm')
        g.box(x0 + 2, y0 + 2, .05, (x0 + x1) / 2 - 1, y1 - 2, .16, 'grass_lush')
    LD.playground(g, -24, -10, 12, 10, rng, z=.1, surf='rubber_blue')
    LD.playground(g, 36, -24, 12, 10, rng, z=.1, surf='rubber_orange')
    LD.court(g, 10, 64, 14, 22, 'court_green', ang=PI / 2, z=.1)
    for k in range(6): LD.bench(g, -44 + k * 15, 10, PI, z=.1)
    for (x, y) in ((-40, 0), (-20, -30), (24, 0), (40, -30), (-10, 60), (30, 70)): LD.lamp(g, x, y, 4.0, z=.1)
    # park strip and the Kuban river with reeds to the south
    g.box(-700, -260, -.04, 700, -120, .0, 'grass_lush')
    g.box(-700, -420, -1.2, 700, -268, -.9, 'river')
    g.box(-700, -272, -1.0, 700, -258, -.05, 'sand_bank')
    for i in range(160):
        x = rng.uniform(-600, 600); y = rng.uniform(-272, -262)
        for k in range(12):
            a = rng.uniform(0, 2 * PI); px, py = x + math.cos(a) * rng.uniform(0, 1.5), y + math.sin(a) * rng.uniform(0, 1.5); h = rng.uniform(1.4, 2.4)
            g.face([(px - .12, py, -.9), (px + .12, py, -.9), (px + .03, py + rng.uniform(-.3, .3), -.9 + h), (px - .03, py, -.9 + h)], 'reed')
    for k in range(9): g.box(-180 + k * 40, -150, 0, -176 + k * 40 + 30, -146, .08, 'paving')
    LD.parking(g, -128, -80, -40, -74, rng); LD.parking(g, 40, -80, 128, -74, rng)
    for k in range(30): LD.car(g, -540 + k * 37, -90 + (-3 if k % 2 else 3), 0 if k % 2 else PI, rng)
    t = MB('reeds_trees')
    for x in range(-590, 600, 13): LD.tree(t, x + rng.uniform(-2, 2), -100, rng.uniform(6, 9), rng)
    LD.scatter_trees(t, rng, (-500, -255, 500, -125), 220, 7, 15, kind_p=.05)
    LD.scatter_trees(t, rng, (-46, -34, 46, 8), 16, 4, 7, avoid=[(-31, -16, -17, -4), (29, -30, 43, -18), (-11, -42, 11, -16)], z=.1)
    LD.scatter_trees(t, rng, (-330, 100, 330, 330), 160, 8, 14, kind_p=.15)
    t.build(cl, M)
    sh = MB('reeds_shrubs')
    for (x0, y0, x1, y1) in ((-44, -32, -32, 6), (20, -32, 31, 6)):
        for k in range(int((x1 - x0) * (y1 - y0) / 12)): card_shrub(sh, rng.uniform(x0, x1), rng.uniform(y0, y1), rng.uniform(.4, .8), rng, z=.16)
    for (x0, y0, x1, y1) in ((-30, 0, -20, 4), (24, -6, 34, -2)): flowerbed(sh, x0, y0, x1, y1, rng, z=.1)
    for x0 in range(-120, 130, 26): hedge(sh, x0, -66, x0 + 18, -66, rng, h=.8)
    sh.build(cl, M)
    bg = MB('reeds_city')
    city_bg(bg, rng, 650, [(-150, -300, 150, 100), (-700, -440, 700, -110)], n=130)
    bg.build(cl, M)
    g.build(cl, M)
