# ЖК «Самолёт 7» (DOGMA, Западный обход) — графитовые башни с золотом + светлые секции, два двора, река
import math, random
from dg_core import MB, Mats, new_scene, sky, cam, coll, PI
from dg_facade import Building, chamfer, rect, bays, window, rail, balcony, roof_basic, edge_frame
import dg_land as LD
from dg_city import city_bg, plaza, card_shrub, hedge, flowerbed

def mats():
    M = Mats(); LD.land_mats(M)
    M.define('brick_graph', kind='brick', color='#34302e', color2='#242120', mortar='#4a4542', rough=.8, brick=(.25, .075))
    M.define('brick_light', kind='brick', color='#c4bbae', color2='#ada395', mortar='#d9d3c9', rough=.85)
    M.define('plaster_w', kind='plaster', color='#eceae5', scale=6, rough=.8, var=.04)
    M.define('gold', color='#c79c52', rough=.28, metal=.95)
    M.define('orange', color='#d17a33', rough=.45, metal=.4)
    M.define('panel_brown', color='#6a5546', rough=.45, metal=.5)
    M.define('ground_dark', kind='stone', color='#3b322c', scale=3, rough=.55, var=.08)
    M.define('stone', kind='stone', color='#cfc6b8', scale=3, rough=.6, var=.07)
    M.define('frame', color='#2a2b2d', rough=.32, metal=.7)
    M.define('glass', kind='window', color='#2a333b', color2='#66798a', rough=.02, ior=1.52)
    M.define('interior', kind='interior', rough=.8); M.define('reveal_in', color='#3d3a37', rough=.8)
    M.define('spandrel', color='#1d2023', rough=.12, metal=.4)
    M.define('railbars', kind='bars', color='#232426', rough=.4, metal=.7, scale=.11)
    M.define('railgold', kind='bars', color='#c79c52', rough=.3, metal=.95, scale=.1)
    M.define('fence', kind='bars', color='#2a2c2e', rough=.4, metal=.6, scale=.15)
    M.define('slab', color='#2a2c2f', rough=.5, metal=.3)
    M.define('roof', kind='noise', color='#55585b', scale=2, rough=.85, var=.1)
    M.define('coping', color='#2b2d30', rough=.35, metal=.7); M.define('machine', color='#6b6d70', rough=.6)
    M.define('ac', color='#c8cacb', rough=.4, metal=.3); M.define('old_roof', color='#5b5f62', rough=.6, metal=.4)
    M.define('kg_white', kind='plaster', color='#f0eeea', scale=5, rough=.8); M.define('kg_red', color='#c8302f', rough=.5)
    return M

# ---------------------------------------------------------------- styles
def tower_style(rng):
    S = dict(t=.42, FH=3.1, GH=6.2, parapet=1.6, glass='glass', frame='frame', pane=1.0, rail='railgold', railtop='gold', sillm='gold', fw=.06)
    def wall(ctx, f, a, b): return 'ground_dark' if f == 0 else 'brick_graph'
    def openings(ctx, f, z0, zt):
        L = ctx['L']; ops = []; nf = ctx['b'].nf
        if f == 0:
            for (a, b) in bays(L, 4.6, 1.0): ops.append(dict(u0=a + .45, u1=b - .45, zs=z0 + .1, zh=zt - .7, kind='shop'))
            return ops
        B = bays(L, 3.1, 1.3); m = len(B) // 2
        crown = f >= nf - 2
        for i, (a, b) in enumerate(B):
            c = (a + b) / 2
            if crown: ops.append(dict(u0=a + .3, u1=b - .3, zs=z0 + .05, zh=zt - .25, kind='crown')); continue
            if i in (m - 1, m) and len(B) >= 5:
                ops.append(dict(u0=a + .35, u1=b - .35, zs=z0 + .05, zh=zt - .3, kind='goldbay'))
            elif (i + f) % 2 == 0:
                ops.append(dict(u0=c - .8, u1=c + .8, zs=z0 + .06, zh=zt - .35, kind='french'))
            else:
                ops.append(dict(u0=c - .8, u1=c + .8, zs=z0 + .75, zh=zt - .35, kind='win'))
        return ops
    def fill(ctx, f, o):
        mb = ctx['b'].mb; t = S['t']; k = o['kind']
        if k == 'shop':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='shop', rng=rng, panes=3, transom=1.2)
            mb.box(o['u0'] - .25, -.02, o['zs'], o['u0'], .18, o['zh'] + .3, 'gold'); mb.box(o['u1'], -.02, o['zs'], o['u1'] + .25, .18, o['zh'] + .3, 'gold')
            mb.box(o['u0'] - .25, -.02, o['zh'], o['u1'] + .25, .18, o['zh'] + .35, 'gold')
        elif k == 'goldbay':     # glazed bay with gold spandrel, projecting 0.5 m
            mb.box(o['u0'] - .1, -.05, o['zs'] - .1, o['u1'] + .1, .55, o['zs'] + .75, 'gold')
            window(mb, o['u0'], o['u1'], o['zs'] + .75, o['zh'], t, S, kind='curtain', rng=rng, panes=2, transom=False, sill=False)
            for u in (o['u0'] - .1, o['u1']): mb.box(u, -.05, o['zs'] + .75, u + .1, .55, o['zh'], 'gold')
        elif k == 'crown':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='curtain', rng=rng, panes=2, transom=False, sill=False)
            rail(mb, o['u0'], o['u1'], .05, o['zs'], S, h=1.0)
        elif k == 'french':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.5)
            mb.box(o['u0'] - .05, 0, o['zs'] - .15, o['u1'] + .05, .45, o['zs'] + .03, 'gold')
            rail(mb, o['u0'], o['u1'], .43, o['zs'], S, h=1.0); rail(mb, o['u0'] + .02, 0, .43, o['zs'], S, side=True); rail(mb, o['u1'] - .02, 0, .43, o['zs'], S, side=True)
        else:
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='win', rng=rng, panes=2, transom=False)
    def decor(ctx):
        b = ctx['b']; mb = b.mb; L = ctx['L']; H = b.H; nf = b.nf
        B = bays(L, 3.1, 1.3)
        z1 = b.z(1); zc = b.z(nf - 2)
        for (a, c) in B:     # double-height gold portals
            mb.box(a + .12, 0, z1, a + .3, .22, zc, 'gold'); mb.box(c - .3, 0, z1, c - .12, .22, zc, 'gold')
            for ff in range(1, nf - 2, 2):
                z = b.z(ff); mb.box(a + .12, 0, z - .1, c - .12, .22, z + .08, 'gold')
        mb.box(-.3, 0, z1 - .5, L + .3, .3, z1, 'gold')                    # ground-floor cornice
        mb.box(-.25, 0, zc - .35, L + .25, .35, zc, 'gold')                # crown base band
        for (a, c) in B: mb.box(a - .1, 0, zc, a + .1, .45, H + 1.6, 'gold')  # crown fins
        mb.box(-.4, -.2, H + .2, L + .4, .55, H + 1.8, 'gold')            # crown cornice
    def roof(b): roof_basic(b, S, machine=True, rng=rng, ac=8)
    S.update(wall=wall, openings=openings, fill=fill, decor=decor, roof=roof)
    return S

def mid_style(rng, kind='light'):
    S = dict(t=.4, FH=3.05, GH=5.6, parapet=1.2, glass='glass', frame='frame', pane=.9, rail='railbars', sillm='coping', fw=.06)
    wallm = 'brick_light' if kind == 'light' else 'plaster_w'
    def wall(ctx, f, a, b): return 'ground_dark' if f == 0 else wallm
    def openings(ctx, f, z0, zt):
        L = ctx['L']; ops = []
        if f == 0:
            for (a, b) in bays(L, 4.2, .8): ops.append(dict(u0=a + .4, u1=b - .4, zs=z0 + .1, zh=zt - .6, kind='shop'))
            return ops
        for i, (a, b) in enumerate(bays(L, 2.9, .9)):
            c = (a + b) / 2
            if kind == 'white' and i % 4 == 1:
                ops.append(dict(u0=c - .85, u1=c + .85, zs=z0 + .05, zh=zt - .35, kind='loggia'))
            elif kind == 'light' and (i + f) % 3 == 0:
                ops.append(dict(u0=c - .8, u1=c + .8, zs=z0 + .06, zh=zt - .4, kind='balc'))
            else:
                ops.append(dict(u0=c - .75, u1=c + .75, zs=z0 + .85, zh=zt - .4, kind='win'))
        return ops
    def fill(ctx, f, o):
        mb = ctx['b'].mb; t = S['t']; k = o['kind']
        if k == 'shop':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='shop', rng=rng, panes=3, transom=1.0)
        elif k == 'loggia':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.5)
            mb.box(o['u0'] - .35, 0, o['zs'] - .2, o['u1'] + .35, .5, o['zs'] + 1.0, 'orange')
            mb.box(o['u0'] - .35, 0, o['zs'] - .2, o['u0'] - .15, .5, o['zh'] + .35, 'orange'); mb.box(o['u1'] + .15, 0, o['zs'] - .2, o['u1'] + .35, .5, o['zh'] + .35, 'orange')
        elif k == 'balc':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.5)
            balcony(mb, o['u0'] - .2, o['u1'] + .2, o['zs'], .9, S)
        else:
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='win', rng=rng, panes=2, transom=False)
            if kind == 'light': mb.box(o['u0'], 0, o['zs'] - .75, o['u1'], .04, o['zs'] - .05, 'panel_brown')
    def decor(ctx):
        b = ctx['b']; mb = b.mb; L = ctx['L']; H = b.H
        z1 = b.z(1)
        mb.box(-.2, 0, z1 - .4, L + .2, .25, z1, 'panel_brown' if kind == 'light' else 'orange')
        mb.box(-.2, 0, H - .25, L + .2, .2, H + .05, 'coping')
    def roof(b): roof_basic(b, S, machine=True, rng=rng, ac=10)
    S.update(wall=wall, openings=openings, fill=fill, decor=decor, roof=roof)
    return S

# ---------------------------------------------------------------- layout
TOWERS = [(rect(-112, 18, -90, 38), 19), (rect(-48, -46, -26, -24), 21), (rect(-16, 34, 8, 56), 22), (rect(64, 6, 86, 52), 21)]
MIDS = [  # poly, floors, kind
    (rect(-90, 24, -30, 38), 10, 'white'), (rect(-112, -40, -98, 18), 9, 'light'), (rect(-98, -46, -48, -32), 12, 'light'),
    (rect(-30, -10, -16, 30), 12, 'light'), (rect(8, 40, 64, 54), 10, 'white'), (rect(-16, -24, 64, -10), 12, 'light'),
]

def build(out_blend=None, quick=False):
    import bpy
    rng = random.Random(21)
    s = new_scene('DOGMA_samolet7', samples=48 if quick else 128)
    M = mats(); cb = coll(s, 'buildings'); cl = coll(s, 'landscape')
    for i, (poly, nf) in enumerate(TOWERS):
        mb = MB('samolet_tower_%d' % (i + 1)); Building(mb, poly, nf, tower_style(random.Random(200 + i)), rng=random.Random(i)).run(); mb.build(cb, M)
    for i, (poly, nf, k) in enumerate(MIDS):
        mb = MB('samolet_sec_%d' % (i + 1)); Building(mb, poly, nf, mid_style(random.Random(300 + i), k), rng=random.Random(50 + i)).run(); mb.build(cb, M)
    land(cl, M, rng)
    sky(s, sun_el=22, sun_az=250, sun_str=1.05)
    c1 = cam(s, 'cam_aerial', (130, -250, 210), (-10, 4, 8), 32)
    c2 = cam(s, 'cam_yard', (30, -4, 1.7), (-4, 56, 30), 19)
    c3 = cam(s, 'cam_street', (-150, -95, 1.7), (-40, -30, 28), 26)
    s.camera = c1
    return s

def land(cl, M, rng):
    g = MB('samolet_ground')
    g.box(-700, -700, -.3, 700, 700, -.05, 'grass')
    LD.road(g, (-600, -70), (600, -70), 18, lanes=4, walk=5)          # Западный обход
    LD.road(g, (-135, -300), (-135, 300), 12, walk=4)
    LD.road(g, (110, -300), (110, 300), 12, walk=4)
    LD.road(g, (-135, 75), (110, 75), 9, walk=3)
    g.box(-130, -60, -.05, 105, 70, .02, 'grass_lush')
    for (poly, nf) in TOWERS: plaza(g, poly, 9, 'paving_dark')
    for (poly, nf, k) in MIDS: plaza(g, poly, 9, 'paving_dark')
    for (poly, nf) in TOWERS: plaza(g, poly, 5)
    for (poly, nf, k) in MIDS: plaza(g, poly, 5)
    # courtyard W
    g.box(-96, -30, .03, -32, 22, .1, 'paving_warm')
    for (x0, y0, x1, y1) in ((-94, -28, -70, -4), (-66, 2, -36, 20), (-94, 6, -74, 20)): g.box(x0, y0, .05, x1, y1, .16, 'grass_lush')
    LD.playground(g, -60, -18, 14, 12, rng, z=.1, surf='rubber_orange')
    LD.pergola(g, -88, 0, -76, 4, z=.1)
    # courtyard E with the "own river"
    g.box(-14, -8, .03, 62, 32, .1, 'paving_warm')
    for (x0, y0, x1, y1) in ((-12, 14, 14, 30), (36, -6, 60, 12), (40, 18, 60, 30)): g.box(x0, y0, .05, x1, y1, .16, 'grass_lush')
    pts = [(-12, 6), (0, 2), (12, 8), (22, 4), (34, 10), (44, 14), (58, 8)]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        g.prism([(x0, y0 - 1.6), (x1, y1 - 1.6), (x1, y1 + 1.6), (x0, y0 + 1.6)], .02, .12, 'water')
        g.prism([(x0, y0 - 2.1), (x1, y1 - 2.1), (x1, y1 - 1.6), (x0, y0 - 1.6)], .02, .3, 'stone')
        g.prism([(x0, y0 + 1.6), (x1, y1 + 1.6), (x1, y1 + 2.1), (x0, y0 + 2.1)], .02, .3, 'stone')
    LD.playground(g, 24, 22, 14, 10, rng, z=.1, surf='rubber_teal')
    LD.court(g, 50, -1, 12, 20, 'rubber_blue', z=.1, net=False)
    for k in range(8): LD.bench(g, -10 + k * 9, -4, 0, z=.1)
    for (x, y) in ((-10, 10), (6, 0), (20, 14), (32, 2), (46, 16), (-80, -10), (-50, 6), (-40, -24)): LD.lamp(g, x, y, 4.0, z=.1)
    # kindergarten (red/white) north of the west quarter
    kg = MB('samolet_kindergarten')
    kg.box(-70, 44, 0, -40, 62, 9, 'kg_white'); kg.box(-70, 44, 6, -62, 62, 9.2, 'kg_red'); kg.box(-46, 44, 0, -40, 62, 9.2, 'kg_red')
    for k in range(5): kg.box(-68 + k * 5, 43.9, 2, -66 + k * 5, 44.1, 7, 'glass')
    kg.build(cl, M)
    # parking + cars
    LD.parking(g, -128, -62, -40, -56, rng); LD.parking(g, 0, -62, 100, -56, rng)
    for k in range(36): LD.car(g, -560 + k * 31 + rng.uniform(-5, 5), -70 + (-4 if k % 2 else 4), 0 if k % 2 else PI, rng)
    # trees & greenery: young street trees, forest belt (the project borders a forest)
    t = MB('samolet_trees')
    for x in range(-590, 600, 12): LD.tree(t, x + rng.uniform(-2, 2), -82, rng.uniform(6, 9), rng)
    for x in range(-125, 100, 10): LD.tree(t, x + rng.uniform(-1, 1), -60.5, rng.uniform(5, 7), rng)
    LD.scatter_trees(t, rng, (-330, 85, 330, 330), 260, 10, 18, kind_p=.25)
    LD.scatter_trees(t, rng, (125, -60, 330, 85), 120, 9, 16, kind_p=.2)
    LD.scatter_trees(t, rng, (-330, -60, -150, 85), 100, 9, 16, kind_p=.2)
    LD.scatter_trees(t, rng, (-94, -28, -36, 20), 14, 4, 6, avoid=[(-68, -25, -52, -11), (-90, -2, -74, 6)], z=.1)
    LD.scatter_trees(t, rng, (-12, -6, 60, 30), 16, 4, 6, avoid=[(-14, 0, 60, 16), (16, 16, 32, 28), (43, -12, 57, 10)], z=.1)
    t.build(cl, M)
    sh = MB('samolet_shrubs')
    for (x0, y0, x1, y1) in ((-94, -28, -70, -4), (-66, 2, -36, 20), (-12, 14, 14, 30), (40, 18, 60, 30)):
        for k in range(int((x1 - x0) * (y1 - y0) / 14)): card_shrub(sh, rng.uniform(x0, x1), rng.uniform(y0, y1), rng.uniform(.4, .8), rng, z=.16)
    for (x0, y0, x1, y1) in ((-64, 8, -54, 12), (2, 18, 12, 22), (38, 2, 46, 6)): flowerbed(sh, x0, y0, x1, y1, rng, z=.1)
    hedge(sh, -128, -58, 100, -58, rng, h=.7)
    sh.build(cl, M)
    bg = MB('samolet_city')
    city_bg(bg, rng, 650, [(-340, -60, 340, 340), (-150, -340, 130, -40)], n=120)
    bg.build(cl, M)
    g.build(cl, M)
