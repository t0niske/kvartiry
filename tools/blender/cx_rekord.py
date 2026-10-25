# ЖК «Рекорд 2» (DOGMA, ул. Новороссийская) — по генплану и фото застройщика
import math, random
from dg_core import MB, Mats, new_scene, sky, cam, coll, PI
from dg_facade import Building, chamfer, rect, bays, window, rail, balcony, roof_basic, edge_frame
import dg_land as LD
from dg_city import city_bg, plaza, card_shrub, hedge, flowerbed, houses

def mats():
    M = Mats(); LD.land_mats(M)
    M.define('brick', kind='brick', color='#b65a34', color2='#93432a', mortar='#cdbba7', rough=.85)
    M.define('brick_dark', kind='brick', color='#8a3c27', color2='#6e2e1f', mortar='#b9a796', rough=.85)
    M.define('stone', kind='stone', color='#cbbfac', scale=3, rough=.6, var=.08)
    M.define('frame', color='#26282b', rough=.32, metal=.7)
    M.define('glass', kind='window', color='#28323a', color2='#61727f', rough=.02, ior=1.52)
    M.define('interior', kind='interior', rough=.8)
    M.define('reveal_in', color='#3d3a37', rough=.8)
    M.define('spandrel', color='#1d2023', rough=.12, metal=.4)
    M.define('railbars', kind='bars', color='#1f2123', rough=.4, metal=.7, scale=.12)
    M.define('fence', kind='bars', color='#2a2c2e', rough=.4, metal=.6, scale=.15)
    M.define('slab', color='#2a2c2f', rough=.5, metal=.3)
    M.define('roof', kind='noise', color='#5f6163', scale=2, rough=.85, var=.1)
    M.define('coping', color='#2b2d30', rough=.35, metal=.7)
    M.define('machine', kind='brick', color='#b65a34', color2='#93432a', mortar='#cdbba7', rough=.85)
    M.define('ac', color='#c8cacb', rough=.4, metal=.3)
    M.define('church_brick', kind='brick', color='#a4472f', color2='#86382a', mortar='#d8c8b4')
    M.define('dome', color='#2f6b47', rough=.3, metal=.6); M.define('gold', color='#d9a84a', rough=.2, metal=1.0)
    M.define('school_wall', kind='plaster', color='#e9e6df', scale=5, rough=.8); M.define('school_accent', color='#6f9d3c', rough=.6)
    M.define('track', color='#a8473c', rough=.9)
    M.define('rail_ballast', kind='noise', color='#6b6660', scale=10, rough=.95)
    M.define('rail_steel', color='#8b8d90', rough=.3, metal=1.0)
    M.define('train_red', color='#b4272e', rough=.35, metal=.4); M.define('train_white', color='#e9e9e6', rough=.35, metal=.3)
    M.define('old_wall', kind='plaster', color='#d6cdbd', scale=4, rough=.85)
    M.define('old_roof', color='#5b5f62', rough=.6, metal=.4)
    return M

def style(rng, nf):
    S = dict(t=.4, FH=3.05, GH=5.0, parapet=1.4, glass='glass', frame='frame', pane=1.05, rail='railbars', sillm='coping', fw=.06)
    def wall(ctx, f, a, b):
        return 'stone' if f == 0 else 'brick'
    def openings(ctx, f, z0, zt):
        L = ctx['L']; ops = []
        if f == 0:
            for (a, b) in bays(L, 4.4, .9):
                ops.append(dict(u0=a + .35, u1=b - .35, zs=z0 + .15, zh=zt - .9, kind='shop'))
            return ops
        if L < 6.5:     # chamfered corner = glazed bay
            if L > 2: ops.append(dict(u0=.3, u1=L - .3, zs=z0, zh=zt, kind='curtain'))
            return ops
        B = bays(L, 3.35, 1.1); m = len(B) // 2
        slot = (m - 1, m) if (L > 19 and len(B) >= 5) else ()
        top = f == ctx['b'].nf - 1
        if slot:
            ops.append(dict(u0=B[slot[0]][0] + .25, u1=B[slot[1]][1] - .25, zs=z0, zh=zt, kind='curtain'))
        for i, (a, b) in enumerate(B):
            if i in slot: continue
            c = (a + b) / 2
            if L > 20 and f >= 2 and i in (0, len(B) - 1) and not top:
                ops.append(dict(u0=c - .85, u1=c + .85, zs=z0 + .06, zh=zt - .42, kind='balc'))
            elif (i + ctx['ei']) % 3 == 0 or top:
                ops.append(dict(u0=c - .8, u1=c + .8, zs=z0 + .06, zh=zt - .42, kind='french'))
            else:
                ops.append(dict(u0=c - 1.08, u1=c + 1.08, zs=z0 + .82, zh=zt - .42, kind='win'))
        return ops
    def fill(ctx, f, o):
        mb = ctx['b'].mb; t = S['t']
        k = o['kind']
        if k == 'shop':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='shop', rng=rng, panes=max(2, round((o['u1'] - o['u0']) / 1.4)), transom=.9)
        elif k == 'curtain':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='curtain', rng=rng, panes=max(1, round((o['u1'] - o['u0']) / 1.15)), transom=False, sill=False)
            mb.box(o['u0'], -t * .55 - .06, o['zs'] - .05, o['u1'], -t * .55 + .07, o['zs'] + .55, 'spandrel')
            mb.box(o['u0'] - .05, -.02, o['zs'] - .12, o['u1'] + .05, .1, o['zs'] + .12, 'frame')
            if ctx['L'] < 6.5:
                rail(mb, o['u0'], o['u1'], -t * .55 + .1, o['zs'] + .55, S, h=.5)
        elif k == 'balc':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.45)
            balcony(mb, o['u0'] - .7, o['u1'] + .7, o['zs'], 1.3, S)
        elif k == 'french':
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='french', rng=rng, panes=2, transom=.45)
            rail(mb, o['u0'] + .02, o['u1'] - .02, .07, o['zs'], S, h=1.1)
        else:
            window(mb, o['u0'], o['u1'], o['zs'], o['zh'], t, S, kind='win', rng=rng, panes=3, transom=False)
    def decor(ctx):
        b = ctx['b']; mb = b.mb; L = ctx['L']; H = b.H
        z1 = b.z(1)
        mb.box(-.25, 0, z1 - .45, L + .25, .22, z1 + .05, 'frame')                       # podium cornice
        mb.box(-.3, 0, H - .7, L + .3, .35, H + .1, 'frame')                              # top cornice
        mb.box(-.3, 0, H + 1.2, L + .3, .2, H + 1.55, 'coping')
        if L >= 6.5:
            for ff in range(6, b.nf - 2, 6):                                              # brick string courses
                z = b.z(ff); mb.box(0, 0, z - .08, L, .05, z + .12, 'brick_dark')
            B = bays(L, 3.35, 1.1); m = len(B) // 2
            if L > 19 and len(B) >= 5:                                                    # dark fins flanking glazing slot
                for u in (B[m - 1][0] + .08, B[m][1] - .08):
                    mb.box(u - .14, 0, z1, u + .14, .32, H + .4, 'frame')
        else:
            for ff in range(1, b.nf):                                                     # slab bands on glazed bays
                z = b.z(ff); mb.box(-.05, -.05, z - .14, L + .05, .14, z + .16, 'frame')
    def roof(b):
        roof_basic(b, S, machine=False, rng=rng, ac=10)
        mb = b.mb; P = b.poly; H = b.H
        n = len(P)
        # brick roof towers with dark caps at long-edge ends (as on Rekord roofs)
        for ei in range(n):
            M, L = edge_frame(P[ei], P[(ei + 1) % n])
            if L < 18: continue
            mb.push(M)
            for u in (3.2, L - 7.2) if L > 30 else (L / 2 - 2.5,):
                mb.box(u, -6.0, H, u + 4.0, -1.4, H + 3.6, 'machine')
                mb.box(u - .2, -6.2, H + 3.6, u + 4.2, -1.2, H + 3.95, 'coping')
            mb.pop()
    S.update(wall=wall, openings=openings, fill=fill, decor=decor, roof=roof)
    return S

# --------------------------------------------------------------- layout (m; x — восток, y — север)
BLOCKS = [  # polygon (ccw), floors, chamfer
    (rect(-98, 54, -34, 72), 27, 3.5),           # A — длинная секция у ж/д
    (rect(-128, -22, -106, 40), 25, 3.5),        # B — западный корпус
    (rect(-102, -48, -82, -24), 24, 3.0),        # C — башня
    ([(-80, -62), (-58, -62), (-58, -30), (-38, -30), (-38, -8), (-80, -8)], 25, 3.0),   # D — Г-образный
    (rect(-60, -96, -36, -66), 24, 3.0),         # E — фронтальный к школе
    ([(-22, -18), (2, -18), (2, 30), (12, 30), (12, 56), (-22, 56)], 26, 3.5),           # F — центральный
    ([(26, -12), (48, -12), (48, 24), (76, 24), (76, 46), (26, 46)], 25, 3.5),            # G — Г-образный восточный
    (rect(74, -40, 96, 8), 24, 3.0),             # H — дальний
]

def build(out_blend=None, cams=('aerial', 'yard', 'street'), quick=False):
    import bpy
    rng = random.Random(7)
    s = new_scene('DOGMA_rekord', samples=48 if quick else 128)
    M = mats(); cb = coll(s, 'buildings'); cl = coll(s, 'landscape')
    for i, (poly, nf, ch) in enumerate(BLOCKS):
        mb = MB('rekord_corp_%d' % (i + 1))
        p = chamfer(poly, ch)
        S = style(random.Random(100 + i), nf)
        Building(mb, p, nf, S, rng=random.Random(i)).run()
        mb.build(cb, M)
    land(cl, M, rng)
    sky(s, sun_el=34, sun_az=230)
    c1 = cam(s, 'cam_aerial', (-30, -300, 330), (-15, -10, 5), 30)
    c2 = cam(s, 'cam_yard', (-74, 6, 1.9), (-30, 62, 30), 18)
    c3 = cam(s, 'cam_street', (-150, -140, 1.7), (-40, -20, 38), 24)
    s.camera = c1
    if out_blend: bpy.ops.wm.save_as_mainfile(filepath=out_blend, compress=True)
    return s

def land(cl, M, rng):
    g = MB('rekord_ground')
    g.box(-700, -700, -.3, 700, 700, -.05, 'grass')
    # streets: Новороссийская (south), inner drives, railway (north)
    LD.road(g, (-600, -135), (600, -135), 21, lanes=4, walk=4)
    LD.road(g, (-150, -300), (-150, 300), 14, walk=3.5)
    LD.road(g, (110, -300), (110, 90), 12, walk=3.5)
    LD.road(g, (-150, 90), (110, 90), 10, walk=3)
    LD.road(g, (-150, -110), (110, -110), 9, walk=3, mark=False)
    LD.road(g, (14, -110), (14, 90), 8, walk=2.5, mark=False)
    for x in (-150, 110):
        LD.crosswalk(g, x, -135 + 14, 0, 12)
    # railway with commuter train
    g.box(-700, 108, -.05, 700, 126, .4, 'rail_ballast')
    for yy in (113, 114.5, 119.5, 121):
        g.box(-700, yy - .04, .4, 700, yy + .04, .55, 'rail_steel')
    for k in range(6):
        x0 = -260 + k * 26
        g.box(x0, 112.4, .7, x0 + 25, 115.6, 4.6, 'train_white'); g.box(x0, 112.35, .7, x0 + 25, 115.65, 1.8, 'train_red')
        g.box(x0 + 1, 112.3, 2.6, x0 + 24, 115.7, 3.6, 'car_glass')
    # inner territory: paved drives, sidewalks, guest parking (not a lawn)
    g.box(-146, -105, -.05, 106, 86, .03, 'paving_dark')
    for (x0, y0, x1, y1) in ((-146, 76, -100, 86), (-30, 60, 20, 86), (50, 50, 106, 70), (-146, -105, -110, -60), (100, -105, 106, 40)):
        g.box(x0, y0, -.05, x1, y1, .06, 'grass_lush')
    # inner courtyard (car-free, on podium) between A, B, D, F
    g.box(-104, -6, -.05, -24, 52, .25, 'paving_warm')
    LD.pool(g, [(-96, 24), (-80, 20), (-74, 32), (-90, 40)], .25)
    LD.pool(g, [(-60, 36), (-44, 36), (-44, 46), (-60, 46)], .25)
    LD.court(g, -50, 14, 15, 28, 'court_terra', z=.25)
    LD.court(g, -82, 2, 13, 22, 'rubber_teal', z=.25, net=False)
    LD.playground(g, -36, 8, 14, 12, rng, z=.25, surf='rubber_orange')
    LD.playground(g, -68, 18, 12, 10, rng, z=.25, surf='rubber_teal')
    LD.pergola(g, -100, 44, -86, 50, z=.25); LD.pergola(g, -40, 26, -28, 32, z=.25)
    for k in range(10): LD.bench(g, -96 + k * 7, 0, 0, z=.25)
    for (x, y) in ((-98, 10), (-84, 46), (-70, 48), (-30, 46), (-30, 20), (-56, -2)):
        LD.lamp(g, x, y, 4.2, z=.25)
    # lawns + shrubs on the podium
    for (x0, y0, x1, y1) in ((-102, 26, -96, 50), (-74, 40, -62, 50), (-36, 36, -26, 50), (-102, -4, -92, 10)):
        g.box(x0, y0, .25, x1, y1, .4, 'grass_lush')
    # church (красный кирпич, зелёные купола)
    c = MB('rekord_church')
    c.box(0, -66, 0, 18, -46, 11, 'church_brick'); c.box(4, -46, 0, 14, -40, 8, 'church_brick')
    c.prism([(0, -66), (18, -66), (18, -46), (0, -46)], 11, 11.4, 'church_brick')
    c.cyl(9, -56, 11, 17, 4.2, 'church_brick', seg=16); c.cyl(9, -56, 17, 21, 4.6, 'dome', seg=16, r1=1.0)
    c.cyl(9, -56, 21, 24, .12, 'gold', seg=6); c.box(8.2, -56.1, 23, 9.8, -55.9, 23.15, 'gold')
    c.box(6, -40, 0, 12, -34, 22, 'church_brick'); c.cyl(9, -37, 22, 26, 2.4, 'dome', seg=12, r1=.4)
    c.build(cl, M)
    # school + stadium (south-east)
    g.box(40, -210, -.02, 160, -150, .02, 'paving')
    LD.court(g, 70, -180, 28, 46, 'court_green', ang=0, fence=False, net=False)
    g.box(48, -210, 0, 92, -150, .03, 'track')
    g.box(56, -203, .03, 84, -157, .045, 'court_green')
    sch = MB('rekord_school')
    sch.box(100, -230, 0, 170, -170, 13, 'school_wall'); sch.box(100, -170, 0, 125, -150, 13, 'school_wall')
    for k in range(12): sch.box(100 + k * 5.6, -230.2, 2, 103 + k * 5.6, -229.9, 12, 'glass')
    sch.box(99, -231, 12.5, 171, -169, 13.2, 'school_accent')
    sch.build(cl, M)
    # parking along streets
    LD.parking(g, -140, -100, -60, -94, rng)
    LD.parking(g, -30, -100, 60, -94, rng)
    LD.parking(g, 60, 52, 100, 58, rng)
    for k in range(40):
        LD.car(g, -580 + k * 29 + rng.uniform(-5, 5), -135 + (-5 if k % 2 else 5), 0 if k % 2 else PI, rng)
    # trees: street rows + park in the NW + around
    t = MB('rekord_trees')
    for x in range(-590, 600, 14):
        LD.tree(t, x + rng.uniform(-2, 2), -146.5, rng.uniform(7, 11), rng); LD.tree(t, x + rng.uniform(-2, 2), -123.5, rng.uniform(6, 10), rng)
    for y in range(-280, 290, 13):
        LD.tree(t, -159, y + rng.uniform(-2, 2), rng.uniform(7, 10), rng); LD.tree(t, 119, y + rng.uniform(-2, 2), rng.uniform(7, 10), rng)
    LD.scatter_trees(t, rng, (-330, 10, -170, 100), 90, 8, 14)
    LD.scatter_trees(t, rng, (-330, -330, -170, -150), 70, 7, 13)
    LD.scatter_trees(t, rng, (-140, -128, 100, -112), 18, 6, 9)
    LD.scatter_trees(t, rng, (-100, -4, -26, 50), 20, 4, 7, avoid=[(-96, 18, -72, 42), (-62, 34, -42, 48), (-58, 0, -42, 28), (-90, -9, -74, 13), (-43, 2, -29, 14), (-74, 13, -62, 23)], z=.25)
    LD.scatter_trees(t, rng, (130, -300, 330, 80), 110, 7, 13)
    LD.scatter_trees(t, rng, (-330, 130, 330, 300), 120, 8, 14)
    t.build(cl, M)
    # background city: Черёмушки — panel & brick mid-rise, garages, old low-rise
    bg = MB('rekord_city')
    city_bg(bg, rng, 650, [(-175, -165, 135, 104), (-700, 104, 700, 130), (-340, -20, -165, 104)], n=190)
    houses(bg, rng, (-330, -330, -175, -170), 70)
    houses(bg, rng, (140, -320, 330, -40), 60)
    bg.build(cl, M)
    # plazas / sidewalks around every block, card shrubs, flower beds in the courtyard
    for (poly, nf, ch) in BLOCKS: plaza(g, chamfer(poly, ch), 7.0, 'paving')
    sh = MB('rekord_shrubs')
    for (x0, y0, x1, y1) in ((-102, 26, -96, 50), (-74, 40, -62, 50), (-36, 36, -26, 50), (-102, -4, -92, 10)):
        for k in range(int((x1 - x0) * (y1 - y0) / 8)): card_shrub(sh, rng.uniform(x0, x1), rng.uniform(y0, y1), rng.uniform(.5, .9), rng, z=.4)
    for (x0, y0, x1, y1) in ((-72, 24, -62, 30), (-46, -4, -30, 0), (-100, 14, -92, 20)): flowerbed(sh, x0, y0, x1, y1, rng, z=.25)
    for (poly, nf, ch) in BLOCKS:
        xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
        hedge(sh, min(xs) - 5, min(ys) - 7.5, max(xs) + 5, min(ys) - 7.5, rng)
    sh.build(cl, M)
    g.build(cl, M)
