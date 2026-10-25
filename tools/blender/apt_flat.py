# Евродвушка DOGMA (планировка TPL[2] сайта, 9,6 × 7,0 м) в трёх отделках — детальная модель интерьера
# x: 0..9.6 (вдоль фасада), y: 0..7.0 (y = 7.0 — фасад с окнами), z: пол 0, потолок CH
import math, random
import bpy
from mathutils import Vector, Matrix
from dg_core import MB, Mats, new_scene, sky, cam, coll, PI
import dg_land as LD
from dg_city import city_bg

W, D, CH = 9.6, 7.0, 2.8
EXT = .45          # exterior wall thickness (outside y = D .. D+EXT)
IW = .1            # interior partition thickness
ROOMS = dict(hall=(0, 0, 3.0, 2.6), bath=(3.0, 0, 5.2, 2.6), ward=(5.2, 0, 9.6, 2.6), living=(0, 2.6, 5.2, 7.0), bed=(5.2, 2.6, 9.6, 7.0))
WINS = [(.55, 2.45, 'living'), (2.85, 4.75, 'living'), (6.35, 8.45, 'bed')]   # x-ranges of window openings
SILL, HEAD = .55, 2.55

def mats(fin):
    M = Mats(); LD.land_mats(M)
    M.define('citywall', kind='citywall', color='#d8d2c6', rough=.85); M.define('old_roof', color='#5b5f62', rough=.6, metal=.4)
    # shell
    if fin == 'rough':
        M.define('wall', kind='plaster', color='#bcb7ae', color2='#a9a49b', scale=3, rough=.95, bump=.25, var=.06)
        M.define('wall_bath', kind='plaster', color='#b5b0a7', scale=3, rough=.95, bump=.25)
        M.define('floor', kind='concrete', color='#9e9a93', color2='#8c8881', scale=4, rough=.9, bump=.15, var=.08)
        M.define('ceil', kind='concrete', color='#b3afa7', color2='#a29e96', scale=2, rough=.95, bump=.1, var=.06)
    elif fin == 'dev':
        M.define('wall', kind='plaster', color='#eeebe5', scale=8, rough=.9, var=.02)
        M.define('wall_bath', kind='walltiles', color='#ebe8e3', mortar='#d9d5ce', brick=(.3, .6), rough=.15)
        M.define('floor', color='#c3a47e', rough=.6)
        M.define('ceil', color='#f5f4f1', rough=.95)
    else:
        M.define('wall', kind='plaster', color='#e6ddd0', color2='#d9cdbd', scale=2.5, rough=.85, bump=.12, var=.05)
        M.define('wall_bath', kind='marble', color='#ece8e2', mortar='#b9b1a6', brick=(.6, 1.2), rough=.12)
        M.define('floor', color='#a87c52', rough=.5)
        M.define('ceil', color='#f6f4f0', rough=.95)
    M.define('accent_wall', kind='plaster', color='#c7b49b', color2='#b9a48a', scale=2, rough=.85, bump=.15)
    M.define('bath_floor', kind='marble' if fin == 'turn' else 'walltiles', color='#d9d4cc' if fin == 'turn' else '#c3bdb4', color2='floor', mortar='#a39b90', brick=(.6, .6), rough=.2)
    M.define('laminate', kind='plank', color='#cdb08a', color2='#b18f68', scale=1.0, rough=.45)
    M.define('parquet', kind='plank', color='#b98a5c', color2='#8e6440', scale=1.0, rough=.4, coat=.3)
    M.define('skirting', color='#f2f0eb', rough=.4)
    M.define('pvc', color='#f3f3f1', rough=.3); M.define('handle', color='#d9d9d9', rough=.2, metal=1.0)
    M.define('glass_win', color='#e9f1f4', rough=0.0, transm=1.0, ior=1.45)
    M.define('sill', color='#f4f3f0', rough=.25)
    M.define('radiator', color='#f3f3f1', rough=.3, metal=.2)
    M.define('socket', color='#f4f4f2', rough=.35); M.define('socket_hole', color='#2a2a2a', rough=.6)
    M.define('ebox', color='#3a4a7a', rough=.6)
    M.define('door_white', color='#f1efea', rough=.35); M.define('door_grey', color='#cdc8c0', rough=.4)
    M.define('door_oak', kind='plank', color='#a57a50', color2='#87603c', scale=1.0, rough=.45)
    M.define('door_metal', color='#3e3a37', rough=.45, metal=.6)
    M.define('chrome', color='#e3e5e8', rough=.06, metal=1.0); M.define('black_metal', color='#1d1d1f', rough=.35, metal=.85)
    M.define('brass', color='#c79a5a', rough=.22, metal=1.0)
    M.define('ceramic', color='#f7f7f5', rough=.08, coat=.5); M.define('mirror', color='#e8eaec', rough=0.0, metal=1.0)
    M.define('shower_glass', color='#eef4f5', rough=0.0, transm=1.0, ior=1.5)
    M.define('bitumen', kind='noise', color='#2e2b28', scale=20, rough=.8)
    M.define('pvc_pipe', color='#9aa0a4', rough=.4); M.define('steel_pipe', color='#7d8084', rough=.35, metal=.9)
    M.define('copper', color='#b87333', rough=.3, metal=1.0); M.define('wire', color='#1a1a1a', rough=.6)
    M.define('bulb', color='#fff6e6', emit='#ffd9a0', emit_str=25.0)
    M.define('lamp_emit', color='#fff4e2', emit='#ffe2b8', emit_str=8.0)
    M.define('led', color='#fff4e2', emit='#ffdcae', emit_str=6.0)
    # furniture (turn)
    M.define('cab_white', color='#efede8', rough=.28); M.define('cab_oak', kind='plank', color='#b38a5f', color2='#94704c', rough=.4)
    M.define('stone_top', kind='marble', color='#eeeae4', mortar='#b8b0a4', color2='floor', brick=(3.2, 3.2), rough=.1)
    M.define('hob', color='#0f0f10', rough=.05, coat=1.0); M.define('steel', color='#b5b8bb', rough=.25, metal=1.0)
    M.define('oven_glass', color='#151617', rough=.03, metal=.3)
    M.define('sofa', kind='fabric', color='#b8b0a3', scale=60, rough=.95); M.define('cushion1', kind='fabric', color='#d9cfbf', scale=60, rough=.95)
    M.define('cushion2', kind='fabric', color='#8f7a63', scale=60, rough=.95); M.define('cushion3', kind='fabric', color='#5f6b5a', scale=60, rough=.95)
    M.define('linen', kind='fabric', color='#eee9df', scale=50, rough=.95); M.define('duvet', kind='fabric', color='#e6dfd2', scale=40, rough=.95)
    M.define('throw', kind='fabric', color='#8c6e55', scale=25, rough=.95); M.define('headboard', kind='fabric', color='#b9ab98', scale=50, rough=.95)
    M.define('rug', kind='fabric', color='#d2c6b3', scale=14, rough=1.0); M.define('rug2', kind='fabric', color='#b9ad9a', scale=12, rough=1.0)
    M.define('curtain', kind='fabric', color='#f1ede4', scale=40, rough=.95, transm=.35); M.define('curtain2', kind='fabric', color='#b8a891', scale=40, rough=.95)
    M.define('tv', color='#0c0c0d', rough=.05, coat=1.0)
    M.define('pot', kind='noise', color='#d9d2c6', scale=10, rough=.7); M.define('pot2', color='#3b3836', rough=.6)
    M.define('plantleaf', kind='leafcard', color='#2e4d22', color2='#5d8436', scale=3.0, rough=.45)
    M.define('soil', kind='noise', color='#3d2f24', scale=8, rough=.95)
    for i, c in enumerate(('#7a3b2e', '#2f4b5e', '#c9b48e', '#3e5a45', '#e5ddcf', '#262626', '#9c6b3f')): M.define('book%d' % i, color=c, rough=.7)
    M.define('art1', kind='art', color='#1f1d1b', color2='#ede6d8', mortar='#b5895e', scale=2.2, rough=.8)
    M.define('art2', kind='art', color='#6f7f72', color2='#e8e1d3', mortar='#c9a27a', scale=1.5, rough=.8)
    M.define('frame_black', color='#1a1a1a', rough=.4)
    M.define('vase', color='#e9e4da', rough=.15, coat=.6); M.define('vase2', color='#8b5e3c', rough=.4)
    M.define('lampshade', kind='fabric', color='#f0e9dc', scale=40, rough=.9, emit='#ffe6c4', emit_str=1.5)
    M.define('towel', kind='fabric', color='#e8e3d9', scale=30, rough=1.0); M.define('towel2', kind='fabric', color='#9c8873', scale=30, rough=1.0)
    M.define('shelf', kind='plank', color='#b38a5f', color2='#94704c', rough=.4)
    return M

# ------------------------------------------------------------------ shell
def wall_x(mb, y, x0, x1, th, mat, holes=(), z0=0.0, z1=CH):
    """wall along x at y (centre), holes: (a, b, zs, zh)"""
    u = x0
    for (a, b, zs, zh) in sorted(holes):
        mb.box(u, y - th / 2, z0, a, y + th / 2, z1, mat)
        mb.box(a, y - th / 2, z0, b, y + th / 2, zs, mat); mb.box(a, y - th / 2, zh, b, y + th / 2, z1, mat); u = b
    mb.box(u, y - th / 2, z0, x1, y + th / 2, z1, mat)

def wall_y(mb, x, y0, y1, th, mat, holes=(), z0=0.0, z1=CH):
    u = y0
    for (a, b, zs, zh) in sorted(holes):
        mb.box(x - th / 2, u, z0, x + th / 2, a, z1, mat)
        mb.box(x - th / 2, a, z0, x + th / 2, b, zs, mat); mb.box(x - th / 2, a, zh, x + th / 2, b, z1, mat); u = b
    mb.box(x - th / 2, u, z0, x + th / 2, y1, z1, mat)

DOORS = dict(  # name: (axis, fixed coord, a, b) — openings 0.9 × 2.1
    entry=('x', 0.0, 1.1, 2.0), bath=('y', 3.0, .85, 1.65), living=('x', 2.6, .95, 1.85), bed=('y', 5.2, 3.15, 4.05), ward=('x', 2.6, 6.4, 7.3))
DH = 2.1
SOFT = [None]      # builder for upholstered / textile items (gets a soft bevel)

def shell(mb, fin):
    wm = 'wall'
    # floor slab and ceiling slab
    mb.box(-.5, -.5, -.25, W + .5, D + EXT + .5, 0, 'floor')
    mb.box(-.5, -.5, CH, W + .5, D + EXT + .5, CH + .25, 'ceil')
    # exterior wall with window openings
    wall_x(mb, D + EXT / 2, -.25, W + .25, EXT, wm, [(a, b, SILL, HEAD) for (a, b, r) in WINS])
    # perimeter walls (to neighbours / stair core)
    wall_x(mb, -.1, -.25, W + .25, .2, wm, [(1.1, 2.0, 0, DH)])
    wall_y(mb, -.1, -.2, D + .1, .2, wm); wall_y(mb, W + .1, -.2, D + .1, .2, wm)
    # partitions
    wall_x(mb, 2.6, 0, W, IW, wm, [(.95, 1.85, 0, DH), (6.4, 7.3, 0, DH)])
    wall_y(mb, 3.0, 0, 2.6, IW, wm, [(.85, 1.65, 0, DH)])
    wall_y(mb, 5.2, 0, 2.6, IW, wm)
    wall_y(mb, 5.2, 2.6, D, IW, wm, [(3.15, 4.05, 0, DH)])
    # bathroom wall finish (tiles / plaster) on inner faces
    x0, y0, x1, y1 = ROOMS['bath']; e = .002
    if fin != 'rough':
        da, db = DOORS['bath'][2], DOORS['bath'][3]
        xw = x0 + IW / 2     # west wall has the door opening
        mb.box(xw, y0, 0, xw + e, da, CH, 'wall_bath'); mb.box(xw, db, 0, xw + e, y1 - IW / 2, CH, 'wall_bath'); mb.box(xw, da, DH, xw + e, db, CH, 'wall_bath')
        for (a, b, c, d_) in ((x1 - IW / 2 - e, y0, x1 - IW / 2, y1 - IW / 2), (x0, y1 - IW / 2 - e, x1, y1 - IW / 2), (x0, y0, x1, y0 + e)):
            mb.box(a, b, 0, c, d_, CH, 'wall_bath')
        mb.box(x0, y0, .001, x1, y1, .004, 'bath_floor')
    else:
        # waterproofing (bitumen) on the lower part of bathroom walls
        da, db = DOORS['bath'][2], DOORS['bath'][3]
        for (a, b, c, d_) in ((x0 + IW / 2, y0, x0 + IW / 2 + e, da), (x0 + IW / 2, db, x0 + IW / 2 + e, y1 - IW / 2), (x1 - IW / 2 - e, y0, x1 - IW / 2, y1 - IW / 2), (x0, y1 - IW / 2 - e, x1, y1 - IW / 2)):
            mb.box(a, b, 0, c, d_, .3, 'bitumen')
        mb.box(x0, y0, .001, x1, y1, .006, 'bitumen')

def window_unit(mb, a, b, fin, rng):
    """PVC window in the exterior wall: frame, two sashes, glazing, handles, slopes, sill, external drip"""
    y_in = D; y_f = D + .16; t = .07
    # slopes (откосы)
    sm = 'wall' if fin == 'rough' else 'sill'
    mb.box(a - .002, y_in, SILL, a + .02, y_f, HEAD - .02, sm); mb.box(b - .02, y_in, SILL, b + .002, y_f, HEAD - .02, sm)
    mb.box(a, y_in, HEAD - .02, b, y_f, HEAD, sm)
    # frame
    for (x0, x1, z0, z1) in ((a, a + t, SILL + t, HEAD - t), (b - t, b, SILL + t, HEAD - t), (a, b, SILL, SILL + t), (a, b, HEAD - t, HEAD)):
        mb.box(x0, y_f, z0, x1, y_f + .07, z1, 'pvc')
    m = (a + b) / 2
    mb.box(m - .04, y_f, SILL + t, m + .04, y_f + .07, HEAD - t, 'pvc')                # impost
    for (x0, x1) in ((a + t, m - .04), (m + .04, b - t)):                               # sashes
        st = .06
        for (p, q, r, s) in ((x0, x0 + st, SILL + t + st, HEAD - t - st), (x1 - st, x1, SILL + t + st, HEAD - t - st), (x0, x1, SILL + t, SILL + t + st), (x0, x1, HEAD - t - st, HEAD - t)):
            mb.box(p, y_f - .015, r, q, y_f + .05, s, 'pvc')
        mb.box(x0 + st, y_f + .02, SILL + t + st, x1 - st, y_f + .028, HEAD - t - st, 'glass_win')
    # handles on the inner side of each sash
    for hx in (m - .1, m + .1):
        mb.box(hx - .015, y_f - .05, 1.45, hx + .015, y_f - .015, 1.55, 'handle'); mb.box(hx - .012, y_f - .06, 1.38, hx + .012, y_f - .045, 1.5, 'handle')
    # sill (подоконник) and outside drip
    if fin != 'rough':
        mb.box(a - .08, D - .05, SILL - .04, b + .08, y_f + .01, SILL, 'sill')
    mb.box(a - .03, D + EXT - .02, SILL - .06, b + .03, D + EXT + .06, SILL - .04, 'steel')

def radiator(mb, x0, x1, y, fin):
    """sectional radiator under the window with valves"""
    n = int((x1 - x0) / .08)
    for i in range(n):
        x = x0 + i * .08; mb.box(x, y - .08, .12, x + .065, y, .62, 'radiator')
    mb.box(x0, y - .075, .14, x0 + n * .08, y - .005, .19, 'radiator'); mb.box(x0, y - .075, .56, x0 + n * .08, y - .005, .61, 'radiator')
    mb.cyl(x0 - .06, y - .03, .02, .6, .012, 'steel_pipe', seg=8); mb.cyl(x0 - .12, y - .03, .02, .6, .012, 'steel_pipe', seg=8)
    mb.box(x0 - .1, y - .07, .54, x0 - .02, y - .02, .6, 'chrome' if fin != 'rough' else 'steel')

def socket(mb, x, y, z, normal, fin, kind='socket', n=1):
    """wall socket / switch; normal: '+x','-x','+y','-y'"""
    s = .085
    for k in range(n):
        o = (k - (n - 1) / 2) * s
        if fin == 'rough':     # empty electric box in plaster + wire
            mat = 'ebox'
            if normal in ('+y', '-y'): mb.box(x + o - .035, y - .004, z - .035, x + o + .035, y + .004, z + .035, mat)
            else: mb.box(x - .004, y + o - .035, z - .035, x + .004, y + o + .035, z + .035, mat)
            continue
        sign = 1 if normal[0] == '+' else -1
        if normal[1] == 'y':
            mb.box(x + o - s / 2, y, z - s / 2, x + o + s / 2, y + sign * .012, z + s / 2, 'socket')
            if kind == 'socket':
                for dx in (-.01, .01): mb.cyl(x + o + dx, y + sign * .0125, z - .004, z + .004, .0035, 'socket_hole', seg=6)
            else: mb.box(x + o - .025, y + sign * .012, z - .03, x + o + .025, y + sign * .016, z + .03, 'socket')
        else:
            mb.box(x, y + o - s / 2, z - s / 2, x + sign * .012, y + o + s / 2, z + s / 2, 'socket')
            if kind != 'socket': mb.box(x + sign * .012, y + o - .025, z - .03, x + sign * .016, y + o + .025, z + .03, 'socket')

def door(mb, name, fin, mat):
    """interior door leaf + casings + handle; left closed or ajar"""
    ax, c, a, b = DOORS[name]; t = .04
    if ax == 'x':
        for s in (-1, 1):     # casings both sides
            yy = c + s * (IW / 2 + .006)
            mb.box(a - .07, yy - .006, 0, a, yy + .006, DH + .07, mat); mb.box(b, yy - .006, 0, b + .07, yy + .006, DH + .07, mat)
            mb.box(a - .07, yy - .006, DH, b + .07, yy + .006, DH + .07, mat)
        # leaf open ~70°, hinged at a
        ang = math.radians(72); L = b - a - .01
        M = Matrix.Rotation(ang, 4, 'Z'); M.translation = (a + .005, c + IW / 2, 0); mb.push(M)
        mb.box(0, -t / 2, .01, L, t / 2, DH - .005, mat)
        mb.cyl(L - .07, -t / 2 - .03, 1.0, 1.0, .02, 'chrome', seg=8)
        mb.box(L - .08, -t / 2 - .06, .99, L - .06, -t / 2, 1.01, 'black_metal' if fin == 'turn' else 'chrome')
        mb.box(L - .2, -t / 2 - .07, .99, L - .06, -t / 2 - .05, 1.015, 'black_metal' if fin == 'turn' else 'chrome')
        mb.pop()
    else:
        for s in (-1, 1):
            xx = c + s * (IW / 2 + .006)
            mb.box(xx - .006, a - .07, 0, xx + .006, a, DH + .07, mat); mb.box(xx - .006, b, 0, xx + .006, b + .07, DH + .07, mat)
            mb.box(xx - .006, a - .07, DH, xx + .006, b + .07, DH + .07, mat)
        ang = math.radians(70 if name == 'bath' else -70); L = b - a - .01
        if name == 'bath':   # opens outward 90° and rests against the hall wall
            M = Matrix.Rotation(PI / 2, 4, 'Z'); M.translation = (c - IW / 2 - .03, b - .005, 0)
        else:
            M = Matrix.Rotation(PI / 2 + ang, 4, 'Z'); M.translation = (c + IW / 2, a + .005, 0)
        mb.push(M)
        mb.box(0, -t / 2, .01, L, t / 2, DH - .005, mat)
        mb.box(L - .2, -t / 2 - .07, .99, L - .06, -t / 2 - .05, 1.015, 'black_metal' if fin == 'turn' else 'chrome')
        mb.box(L - .2, t / 2 + .05, .99, L - .06, t / 2 + .07, 1.015, 'black_metal' if fin == 'turn' else 'chrome')
        mb.pop()

def skirting(mb, fin):
    if fin == 'rough': return
    h = .08 if fin == 'dev' else .12; d = .015; mat = 'skirting'
    for (x0, y0, x1, y1) in (ROOMS['living'], ROOMS['bed'], ROOMS['hall'], ROOMS['ward']):
        a, b, c, e = x0 + IW / 2, y0 + IW / 2, x1 - IW / 2, y1 - IW / 2
        if y1 >= D - .01: e = D
        if x0 <= .01: a = 0
        if y0 <= .01: b = 0
        if x1 >= W - .01: c = W
        mb.box(a, b, 0, c, b + d, h, mat); mb.box(a, e - d, 0, c, e, h, mat)
        mb.box(a, b, 0, a + d, e, h, mat); mb.box(c - d, b, 0, c, e, h, mat)

# ------------------------------------------------------------------ floors (real planks)
def plank_floor(mb, rect, fin, rng, herring=False):
    x0, y0, x1, y1 = rect; z = .0
    if not herring:     # laminate 1380 × 193, random stagger
        pw, pl = .193, 1.38; y = y0 - .05
        while y < y1 + .05:
            off = rng.uniform(0, pl); x = x0 - off
            while x < x1:
                mb.rnd = rng.random()
                a, b = max(x, x0 - .05), min(x + pl - .002, x1 + .05)
                if b > a: mb.box(a, y, z, b, y + pw - .0015, z + .006, 'laminate')
                x += pl
            y += pw
    else:               # herringbone 600 × 100 oak: lattice T1=(w,w), T2=(L,-L), H+V plank per cell, pattern rotated 45°
        L, w, g = .6, .1, .0015
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; ca = sa = math.sqrt(.5)
        R = math.hypot(x1 - x0, y1 - y0) / 2 + .8
        def put(rx0, ry0, rx1, ry1):
            P = []
            for (p, q) in ((rx0 + g, ry0 + g), (rx1 - g, ry0 + g), (rx1 - g, ry1 - g), (rx0 + g, ry1 - g)):
                P.append((cx + p * ca - q * sa, cy + p * sa + q * ca))
            if all(not (x0 - .06 <= a <= x1 + .06 and y0 - .06 <= b <= y1 + .06) for (a, b) in P): return
            P = [(min(max(a, x0 - .06), x1 + .06), min(max(b, y0 - .06), y1 + .06)) for (a, b) in P]
            mb.rnd = rng.random(); mb.prism(P, z, z + .008, 'parquet')
        nmax = int(R / (w * 1.4142)) + 8; mmax = int(R / (L * 1.4142)) + 3
        for n in range(-nmax, nmax):
            for m in range(-mmax, mmax):
                ox = n * w + m * L; oy = n * w - m * L
                if abs(ox) > R + L or abs(oy) > R + L: continue
                put(ox, oy, ox + L, oy + w)                       # horizontal plank
                put(ox + L, oy + 2 * w - L, ox + L + w, oy + w)    # vertical plank
    mb.rnd = 0

# ------------------------------------------------------------------ bathroom
def bathroom(mb, fin, rng):
    x0, y0, x1, y1 = ROOMS['bath']; xi0, xi1, yi1 = x0 + IW / 2, x1 - IW / 2, y1 - IW / 2
    if fin == 'rough':
        # risers in the corner: steel water pipes with valves and meters, grey sewer stack with outlet
        cx, cy = xi1 - .25, .25
        mb.cyl(cx, cy, 0, CH, .055, 'pvc_pipe', seg=14); mb.cyl(cx, cy, .3, .45, .07, 'pvc_pipe', seg=14)
        mb.seg_cyl((cx - .05, cy, .38), (cx - .45, cy, .36), .05, 'pvc_pipe', seg=12)
        for k, col in enumerate(('steel_pipe', 'copper')):
            px = cx - .3 - k * .12
            mb.cyl(px, .08, 0, CH, .016, 'steel_pipe', seg=8)
            mb.seg_cyl((px, .08, 1.0), (px, .3, 1.0), .012, 'steel_pipe', seg=8)
            mb.box(px - .04, .26, .95, px + .04, .34, 1.05, 'steel'); mb.cyl(px, .3, 1.05, 1.1, .025, 'socket', seg=10)   # meter
            mb.box(px - .03, .28, .88, px + .03, .32, .92, 'brass')                                                 # valve
        return
    # bathtub / walk-in shower, toilet, vanity + mirror, towel rail, niche
    if fin == 'dev':
        tx0, tx1 = xi0 + .01, xi1 - .01
        mb.box(tx0, yi1 - .72, 0, tx1, yi1 - .01, .58, 'ceramic')                     # tub body
        mb.box(tx0 + .06, yi1 - .66, .2, tx1 - .06, yi1 - .07, .585, 'ceramic')
        mb.box(tx0 + .08, yi1 - .64, .2, tx1 - .08, yi1 - .09, .25, 'chrome')        # inner (water-less) reflection
        mb.cyl(xi0 + .9, yi1 - .02, 1.0, 1.08, .025, 'chrome', seg=10); mb.seg_cyl((xi0 + .9, yi1 - .02, 1.04), (xi0 + .9, yi1 - .18, 1.04), .015, 'chrome')
        mb.cyl(xi0 + .4, yi1 - .02, 1.0, 1.95, .012, 'chrome', seg=8); mb.cyl(xi0 + .4, yi1 - .05, 1.85, 2.0, .045, 'chrome', seg=12)
    else:
        sx0 = xi0 + .01
        mb.box(sx0, yi1 - 1.0, 0, xi1 - .01, yi1 - .01, .006, 'bath_floor')
        mb.box(sx0 + .9, yi1 - 1.0, 0, sx0 + .91, yi1 - .01, 2.0, 'shower_glass')                # glass partition
        mb.box(sx0 + .9, yi1 - 1.0, 1.98, sx0 + .91, yi1 - .01, 2.0, 'black_metal')
        mb.cyl(sx0 + .45, yi1 - .4, 2.25, 2.27, .15, 'black_metal', seg=20)                       # rain shower
        mb.seg_cyl((sx0 + .45, yi1 - .4, 2.26), (sx0 + .45, yi1 - .02, 2.26), .012, 'black_metal')
        mb.box(sx0 + .3, yi1 - .02, 1.05, sx0 + .6, yi1, 1.2, 'black_metal')
        mb.box(sx0 + .2, yi1 - .12, 1.2, sx0 + .8, yi1 - .002, 1.55, 'wall_bath')                 # niche back
        mb.box(sx0 + .2, yi1 - .12, 1.2, sx0 + .8, yi1 - .002, 1.21, 'stone_top')
        mb.box(xi0 + .02, yi1 - .7, .002, xi0 + .5, yi1 - .65, .008, 'black_metal')             # drain line
    # toilet (wall-hung in turn, floor-standing in dev)
    tx, ty = xi1 - .01, 1.55
    if fin == 'turn':
        mb.box(tx - .22, ty - .4, 0, tx, ty + .4, 1.15, 'wall_bath')                              # installation box
        mb.box(tx - .24, ty - .12, .95, tx - .22, ty + .12, 1.1, 'black_metal')                    # flush plate
        bowl = [(tx - .22, ty - .18), (tx - .22, ty + .18), (tx - .58, ty + .14), (tx - .62, ty), (tx - .58, ty - .14)]
        mb.prism(bowl, .28, .42, 'ceramic')
    else:
        mb.box(tx - .2, ty - .2, .5, tx - .02, ty + .2, .85, 'ceramic')                           # cistern
        bowl = [(tx - .2, ty - .18), (tx - .2, ty + .18), (tx - .62, ty + .14), (tx - .66, ty), (tx - .62, ty - .14)]
        mb.prism([(x, y) for (x, y) in bowl], 0, .4, 'ceramic'); mb.prism(bowl, .4, .43, 'ceramic')
    # vanity + basin + faucet + mirror
    vx0, vx1, vy = xi0 + .05, xi0 + .85, .05
    mb.box(vx0, vy, .4 if fin == 'turn' else 0, vx1, vy + .48, .85, 'cab_oak' if fin == 'turn' else 'cab_white')
    if fin == 'turn':
        mb.box(vx0 - .02, vy, .85, vx1 + .02, vy + .5, .88, 'stone_top')
        mb.cyl((vx0 + vx1) / 2, vy + .25, .88, 1.0, .2, 'ceramic', seg=24)                         # vessel basin
        mb.seg_cyl(((vx0 + vx1) / 2, vy + .02, 1.25), ((vx0 + vx1) / 2, vy + .14, 1.22), .012, 'black_metal')
        mb.box(vx0 + .05, .0, 1.15, vx1 - .05, .02, 2.0, 'mirror'); mb.box(vx0 + .03, .02, 1.12, vx1 - .03, .025, 1.15, 'led')
    else:
        mb.box(vx0 - .01, vy, .85, vx1 + .01, vy + .5, .9, 'ceramic')
        mb.cyl((vx0 + vx1) / 2, vy + .32, 1.0, 1.08, .02, 'chrome', seg=10)
        mb.box(vx0 + .1, .0, 1.15, vx1 - .1, .015, 1.85, 'mirror')
    # heated towel rail + towels
    rx = xi0 + .02
    for k in range(6): mb.box(rx, 2.0 - .25, .9 + k * .12, rx + .03, 2.0 + .25, .92 + k * .12, 'black_metal' if fin == 'turn' else 'chrome')
    if fin == 'turn': mb.box(rx + .03, 1.8, 1.05, rx + .08, 2.2, 1.55, 'towel'); mb.box(rx + .03, 1.85, 1.2, rx + .085, 2.15, 1.5, 'towel2')
    mb.box(xi0 + .3, 1.2, CH - .02, xi0 + .6, 1.5, CH, 'lamp_emit')

# ------------------------------------------------------------------ kitchen + living (turnkey)
def kitchen(mb, fin, rng):
    if fin != 'turn':
        # utility outlets on the kitchen wall: water + sewer stubs, sockets
        if fin == 'rough':
            mb.cyl(.35, 2.65 + IW / 2 + .02, .25, .35, .025, 'pvc_pipe', seg=10)
        socket(mb, .9, 2.6 + IW / 2, 1.1, '+y', fin, n=3); socket(mb, 2.2, 2.6 + IW / 2, .3, '+y', fin, n=2)
        return
    y0 = 2.6 + IW / 2; d = .6
    # base cabinets x 0.05..3.0 with door gaps, plinth, countertop, backsplash
    mb.push(Matrix.Translation((.6, 0, 0)))          # run of cabinets .65..3.65, tall column at the left end
    xs = [.05, .65, 1.25, 1.85, 2.45, 3.05]
    mb.box(.05, y0 + .05, 0, 3.05, y0 + d - .05, .1, 'black_metal')
    for i in range(len(xs) - 1):
        a, b = xs[i] + .0015, xs[i + 1] - .0015
        if i == 2:   # oven
            mb.box(a, y0, .1, b, y0 + d, .86, 'cab_white')
            mb.box(a + .02, y0 + d, .25, b - .02, y0 + d + .01, .8, 'oven_glass'); mb.box(a + .05, y0 + d + .01, .74, b - .05, y0 + d + .035, .76, 'steel')
        else:
            mb.box(a, y0, .1, b, y0 + d, .86, 'cab_white')
            mb.box(a, y0 + d, .1, b, y0 + d + .002, .86, 'cab_white')
    mb.box(.03, y0, .86, 3.07, y0 + d + .02, .9, 'stone_top')
    mb.box(.05, y0, .9, 3.05, y0 + .015, 1.5, 'stone_top')
    mb.box(1.25, y0 + .07, .9, 1.85, y0 + .55, .905, 'hob')                                       # induction hob
    for (hx, hy, r) in ((1.4, y0 + .2, .1), (1.7, y0 + .2, .09), (1.4, y0 + .42, .08), (1.7, y0 + .42, .1)):
        mb.cyl(hx, hy, .905, .906, r, 'socket_hole', seg=24); mb.cyl(hx, hy, .9055, .9065, r - .006, 'hob', seg=24)
    mb.box(2.55, y0 + .1, .82, 2.95, y0 + .45, .9, 'steel')                                       # sink
    mb.box(2.57, y0 + .12, .82, 2.93, y0 + .43, .901, 'socket_hole')
    mb.cyl(2.75, y0 + .05, .9, 1.25, .015, 'black_metal', seg=10); mb.seg_cyl((2.75, y0 + .05, 1.25), (2.75, y0 + .25, 1.2), .012, 'black_metal')
    # wall cabinets + hood
    for i in range(5):
        a, b = .05 + i * .6 + .0015, .05 + (i + 1) * .6 - .0015
        mb.box(a, y0, 1.6, b, y0 + .35, 2.3, 'cab_white')
    mb.box(.05, y0, 1.58, 3.05, y0 + .3, 1.6, 'led')
    mb.box(1.25, y0, 1.55, 1.85, y0 + .33, 1.6, 'steel')
    mb.pop()
    # tall oak column with built-in fridge at the left end of the run
    mb.box(.03, y0, 0, .63, y0 + .62, 2.35, 'cab_oak'); mb.box(.03, y0 + .62, 1.05, .63, y0 + .625, 1.06, 'black_metal'); mb.box(.6, y0 + .625, .2, .62, y0 + .64, 2.0, 'black_metal')
    # island 2.0 × 0.95 oak with stone top, stools, pendants
    ix0, ix1, iy0, iy1 = .7, 2.7, 3.95, 4.9
    mb.box(ix0, iy0, 0, ix1, iy1, .87, 'cab_oak'); mb.box(ix0 - .05, iy0 - .05, .87, ix1 + .05, iy1 + .2, .91, 'stone_top')
    for k in range(3):
        sx = 1.05 + k * .65; sy = iy1 + .5
        mb.cyl(sx, sy, .64, .69, .2, 'black_metal', seg=20); mb.cyl(sx, sy, .66, .7, .19, 'sofa', seg=20)
        for (dx, dy) in ((-.13, -.13), (.13, -.13), (.13, .13), (-.13, .13)): mb.seg_cyl((sx + dx * 1.3, sy + dy * 1.3, 0), (sx + dx * .6, sy + dy * .6, .65), .012, 'black_metal')
        mb.box(sx - .2, sy - .02, .3, sx + .2, sy + .02, .32, 'black_metal')
    for k in range(3):
        px = 1.05 + k * .65
        mb.seg_cyl((px, 4.5, CH), (px, 4.5, 1.75), .003, 'wire', seg=4)
        mb.cyl(px, 4.5, 1.55, 1.75, .13, 'lampshade', seg=20, r1=.11)
    # living zone: sofa, cushions, coffee table, rug, TV wall, shelves, plant, floor lamp, curtains
    rug(mb, 2.4, 5.0, 4.6, 6.6)
    sofa(SOFT[0] or mb, 4.95, 4.75, 6.75, rng)
    mb.box(3.0, 5.35, 0, 3.9, 6.25, .38, 'cab_oak'); mb.box(2.98, 5.33, .38, 3.92, 6.27, .41, 'cab_oak')
    mb.cyl(3.25, 5.6, .41, .58, .06, 'vase', seg=14); mb.box(3.45, 5.8, .41, 3.75, 6.0, .46, 'book1'); mb.box(3.47, 5.82, .46, 3.73, 6.0, .49, 'book4')
    # TV wall on x = 0 (west): accent plaster, media console, TV, shelves with books
    mb.box(.0, 4.5, 0, .02, 7.0, CH, 'accent_wall')
    mb.box(.02, 4.8, .25, .45, 6.8, .7, 'cab_oak'); mb.box(.02, 4.8, .2, .43, 6.8, .25, 'black_metal')
    mb.box(.03, 5.1, 1.0, .07, 6.5, 1.8, 'tv')
    for k, z in enumerate((1.95, 2.3)):
        mb.box(.02, 4.85, z, .3, 6.75, z + .03, 'shelf')
        x = 4.9
        while x < 6.6:
            w = rng.uniform(.025, .05); h = rng.uniform(.18, .26)
            if rng.random() < .85: mb.box(.04, x, z + .03, .26, x + w, z + .03 + h, 'book%d' % rng.randrange(7))
            x += w + .004
    plant(mb, .45, 6.6, rng, h=1.7)
    floor_lamp(mb, 4.7, 4.6)
    art(mb, 'x', 2.6 + IW / 2 + .005, 3.8, 4.9, 1.3, 2.0, 'art1', facing='+y')
    curtains(mb, .3, 5.0, rng)

def rug(mb, x0, y0, x1, y1, mat='rug'):
    mb.box(x0, y0, 0, x1, y1, .012, mat)

def sofa(mb, x, y0, y1, rng):
    """sofa along y against x=5.2 partition (back at x), seat facing -x"""
    d = .95; xs = x - d
    mb.box(xs, y0, .06, x, y1, .42, 'sofa')                                    # base
    mb.box(x - .22, y0, .42, x, y1, .85, 'sofa')                               # back
    mb.box(xs, y0, .42, x - .22, y0 + .2, .66, 'sofa'); mb.box(xs, y1 - .2, .42, x - .22, y1, .66, 'sofa')   # arms
    n = 3; L = (y1 - y0 - .4) / n
    for i in range(n):
        a = y0 + .2 + i * L + .01
        mb.box(xs + .02, a, .42, x - .24, a + L - .02, .55, 'sofa')             # seat cushions
        mb.box(x - .42, a + .02, .55, x - .22, a + L - .04, 1.0, 'sofa')        # back cushions
    for i, (m, yy) in enumerate((('cushion1', y0 + .45), ('cushion2', y0 + .8), ('cushion3', y1 - .55), ('cushion1', y1 - .9))):
        M = Matrix.Rotation(rng.uniform(-.25, .25), 4, 'Y'); M.translation = (x - .52, yy, .82); mb.push(M)
        mb.box(-.07, -.22, -.22, .07, .22, .22, m); mb.pop()
    for (px, py) in ((xs + .05, y0 + .05), (xs + .05, y1 - .08), (x - .08, y0 + .05), (x - .08, y1 - .08)):
        mb.box(px, py, 0, px + .03, py + .03, .06, 'black_metal')
    mb.box(xs + .1, y1 - .7, .55, xs + .5, y1 - .25, .6, 'throw')

def floor_lamp(mb, x, y):
    mb.cyl(x, y, 0, .03, .15, 'black_metal', seg=16); mb.cyl(x, y, .03, 1.45, .012, 'black_metal', seg=8)
    mb.cyl(x, y, 1.4, 1.72, .2, 'lampshade', seg=20, r1=.16)

def plant(mb, x, y, rng, h=1.6):
    mb.cyl(x, y, 0, .45, .2, 'pot', seg=20, r1=.23); mb.cyl(x, y, .42, .44, .2, 'soil', seg=20)
    for k in range(3):
        top = Vector((x + rng.uniform(-.15, .15), y + rng.uniform(-.15, .15), h * rng.uniform(.7, 1.0)))
        mb.seg_cyl((x, y, .4), top, .012, 'bark', seg=5)
        for i in range(26):
            t = rng.uniform(.35, 1.0); p = Vector((x, y, .4)).lerp(top, t) + Vector((rng.uniform(-.25, .25), rng.uniform(-.25, .25), rng.uniform(-.05, .1)))
            q = rng.uniform(.18, .3)
            d1 = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-.3, .6))).normalized() * q
            d2 = Vector((-d1.y, d1.x, 0)).normalized() * q * .55
            mb.face([tuple(p - d2), tuple(p + d1 * .5), tuple(p + d2), tuple(p + d1 * 1.2)], 'plantleaf')

def art(mb, ax, c, a, b, z0, z1, mat, facing='+y'):
    s = 1 if facing[0] == '+' else -1
    if ax == 'x':
        mb.box(a, c, z0, b, c + s * .03, z1, 'frame_black'); mb.box(a + .04, c + s * .031, z0 + .04, b - .04, c + s * .033, z1 - .04, mat)
    else:
        mb.box(c, a, z0, c + s * .03, b, z1, 'frame_black'); mb.box(c + s * .031, a + .04, z0 + .04, c + s * .033, b - .04, z1 - .04, mat)

def curtains(mb, x0, x1, rng, mat='curtain', rail=True):
    """pleated sheer curtains hanging in front of the window wall (y ≈ D - 0.12)"""
    y = D - .14; zt = CH - .04
    if rail: mb.box(x0 - .05, y - .03, zt, x1 + .05, y + .03, zt + .03, 'black_metal')
    for (a, b) in ((x0, x0 + .7), (x1 - .7, x1)):    # gathered at both sides
        n = 48; amp = .06
        pts = [(a + (b - a) * i / n, y + amp * math.sin(i * 2 * PI / 6)) for i in range(n + 1)]
        for i in range(n):
            (xa, ya), (xb, yb) = pts[i], pts[i + 1]
            mb.face([(xa, ya, .01), (xb, yb, .01), (xb, yb, zt), (xa, ya, zt)], mat)

# ------------------------------------------------------------------ bedroom, hall, wardrobe
def bedroom(mb, fin, rng):
    x0, y0, x1, y1 = ROOMS['bed']
    socket(mb, x1 - .02 - IW, 4.0, .3, '-x', fin, n=2); socket(mb, x1 - .02 - IW, 5.9, .3, '-x', fin, n=2)
    socket(mb, 5.2 + IW / 2, 4.3, .9, '+x', fin, kind='switch')
    if fin != 'turn': return
    rug(mb, 6.2, 3.7, 9.0, 6.3, 'rug2')
    hard = mb; mb = SOFT[0] or mb
    bx1 = W - .02; by0, by1 = 4.05, 5.95       # bed 1.9 × 2.1 with headboard on the east wall
    mb.box(bx1 - .12, by0 - .1, 0, bx1, by1 + .1, 1.25, 'headboard')
    mb.box(bx1 - 2.15, by0, .08, bx1 - .12, by1, .38, 'headboard')
    mb.box(bx1 - 2.12, by0 + .03, .38, bx1 - .14, by1 - .03, .6, 'linen')     # mattress
    mb.box(bx1 - 1.75, by0 - .02, .58, bx1 - .14, by1 + .02, .66, 'duvet')     # duvet
    mb.box(bx1 - 2.14, by0 - .02, .42, bx1 - 1.75, by1 + .02, .64, 'duvet')
    mb.box(bx1 - 1.45, by0 - .03, .64, bx1 - 1.0, by1 + .03, .67, 'throw')
    for (yy, m) in ((by0 + .45, 'linen'), (by1 - .45, 'linen'), (by0 + .55, 'cushion2'), (by1 - .55, 'cushion1')):
        M = Matrix.Rotation(.35, 4, 'Y'); M.translation = (bx1 - .32 - (.12 if m != 'linen' else 0), yy, .78); mb.push(M)
        mb.box(-.08, -.32 if m == 'linen' else -.2, -.2 if m == 'linen' else -.17, .08, .32 if m == 'linen' else .2, .2 if m == 'linen' else .17, m); mb.pop()
    mb = hard
    for yy in (by0 - .62, by1 + .1):      # nightstands + lamps
        mb.box(bx1 - .45, yy, .15, bx1 - .02, yy + .5, .55, 'cab_oak')
        mb.cyl(bx1 - .23, yy + .25, .55, .58, .07, 'brass', seg=12); mb.cyl(bx1 - .23, yy + .25, .58, .9, .012, 'brass', seg=6)
        mb.cyl(bx1 - .23, yy + .25, .85, 1.08, .14, 'lampshade', seg=18, r1=.11)
    art(mb, 'y', bx1 - .12, by0 + .2, by1 - .2, 1.45, 2.15, 'art2', facing='-x')
    # built-in wardrobe along the north partition (y = 2.6)
    for (a, b) in ((5.3, 6.3), (7.4, 9.5)):
        k = a
        while k < b - .01:
            e = min(k + .5, b)
            mb.box(k + .0015, 2.6 + IW / 2, 0, e - .0015, 2.6 + IW / 2 + .6, 2.6, 'cab_white'); mb.box(e - .06, 2.6 + IW / 2 + .6, 1.0, e - .04, 2.6 + IW / 2 + .62, 1.4, 'black_metal')
            k = e
    plant(mb, 8.9, 6.6, rng, h=1.3)
    curtains(mb, 6.0, 8.8, rng, mat='curtain2')

def hall(mb, fin, rng):
    # entrance door (metal) with peephole & handle
    a, b = DOORS['entry'][2], DOORS['entry'][3]
    mb.box(a, -.06, 0, b, -.02, DH, 'door_metal'); mb.box(b - .15, -.02, .98, b - .05, .02, 1.02, 'chrome'); mb.cyl((a + b) / 2, -.02, 1.55, 1.55, .01, 'chrome', seg=8)
    for (p, q) in ((a - .08, a), (b, b + .08)): mb.box(p, -.02, 0, q, .0, DH + .08, 'door_metal')
    mb.box(a - .08, -.02, DH, b + .08, 0, DH + .08, 'door_metal')
    socket(mb, 2.2, 0.0, .9, '+y', fin, kind='switch'); socket(mb, .02, 1.8, .3, '+x', fin)
    mb.box(.05, .25, CH - .02, .4, .6, CH, 'lamp_emit')
    if fin != 'turn': return
    # wardrobe with mirror doors along west wall, bench, hooks, console
    mb.box(.0, .15, 0, .6, 1.0, 2.6, 'cab_white'); mb.box(.6, .2, .05, .605, .95, 2.55, 'mirror')
    mb.box(2.35, .3, .0, 2.95, .7, .45, 'cab_oak'); mb.box(2.33, .28, .45, 2.97, .72, .5, 'sofa')
    for k in range(4): mb.cyl(2.45 + k * .15, .02, 1.75, 1.75, .015, 'brass', seg=8)
    mb.box(2.35, 0.0, 1.6, 2.95, .03, 1.62, 'shelf')

def lights(mb, fin):
    """ceiling fixtures + real lamp objects"""
    pts = []
    if fin == 'rough':
        for (x, y) in ((2.6, 4.8), (7.4, 4.8), (1.5, 1.3), (4.1, 1.3), (7.4, 1.3)):
            mb.seg_cyl((x, y, CH), (x, y, CH - .35), .004, 'wire', seg=4); mb.cyl(x, y, CH - .42, CH - .35, .02, 'black_metal', seg=8)
            mb.blob(x, y, CH - .46, .045, 'bulb', random.Random(1), sub=1, jitter=0)
            pts.append((x, y, CH - .5, 20))
    elif fin == 'dev':
        for (x, y) in ((2.6, 4.8), (7.4, 4.8), (1.5, 1.3), (7.4, 1.3)):
            mb.cyl(x, y, CH - .07, CH, .2, 'socket', seg=24); mb.cyl(x, y, CH - .075, CH - .07, .18, 'lamp_emit', seg=24)
            pts.append((x, y, CH - .2, 35))
    else:
        for (x, y) in ((3.4, 3.4), (3.4, 6.2), (4.6, 4.8), (.8, 3.3), (2.2, 3.3), (6.2, 3.6), (8.6, 3.6), (6.2, 6.3), (8.6, 6.3), (1.0, .9), (2.0, .9), (4.1, 1.3)):
            mb.cyl(x, y, CH - .01, CH, .045, 'led', seg=12); pts.append((x, y, CH - .15, 8))
        for (a, b, c, d) in ((.1, 2.7, 5.1, 2.72), (.1, 6.85, 5.1, 6.87)):      # cove LED lines
            mb.box(a, b, CH - .03, c, d, CH - .01, 'led')
    return pts

# ------------------------------------------------------------------ outside: city seen from the 12th floor
def outside(cl, M, rng):
    g = MB('apt_city'); Z = -36.0
    g.box(-500, D + 3, Z - .3, 520, 700, Z, 'grass')
    g.push(Matrix.Translation((0, 0, Z)))
    LD.road(g, (-500, D + 45), (520, D + 45), 16, lanes=4, walk=4)
    for k in range(24): LD.car(g, -300 + k * 27, D + 45 + (-3 if k % 2 else 3), 0 if k % 2 else PI, rng)
    city_bg(g, rng, 500, [(-500, -500, 520, D + 60)], n=90)
    t = MB('apt_trees'); t.push(Matrix.Translation((0, 0, Z)))
    LD.scatter_trees(t, rng, (-260, D + 60, 280, 420), 260, 8, 14, kind_p=.1)
    for x in range(-300, 320, 11): LD.tree(t, x, D + 33, rng.uniform(7, 10), rng)
    t.pop(); t.build(cl, M)
    g.pop(); g.build(cl, M)

# ------------------------------------------------------------------ assembly
def finish_obj(o, bevel=0.0, seg=2, smooth=False):
    if bevel:
        m = o.modifiers.new('bevel', 'BEVEL'); m.width = bevel; m.segments = seg; m.limit_method = 'ANGLE'
        try: m.harden_normals = True
        except Exception: pass
    if smooth or bevel:
        o.data.polygons.foreach_set('use_smooth', [True] * len(o.data.polygons))

def build(out_blend=None, quick=False, variant='turn'):
    fin = variant or 'turn'
    rng = random.Random(9)
    s = new_scene('DOGMA_apt', samples=64 if quick else 384)
    s.cycles.max_bounces = 10; s.cycles.diffuse_bounces = 5; s.cycles.glossy_bounces = 4
    try: s.cycles.blur_glossy = 1.0; s.cycles.sample_clamp_indirect = 8
    except Exception: pass
    M = mats(fin); ci = coll(s, 'interior'); co = coll(s, 'outside')
    sh = MB('apt_shell'); shell(sh, fin)
    for (a, b, r) in WINS: window_unit(sh, a, b, fin, rng); radiator(sh, a + .25, b - .25, D - .03, fin)
    skirting(sh, fin)
    sh.build(ci, M)
    fl = MB('apt_floor')
    if fin == 'dev':
        for r in ('living', 'bed', 'hall', 'ward'): plank_floor(fl, ROOMS[r], fin, rng)
    elif fin == 'turn':
        for r in ('living', 'bed', 'hall', 'ward'): plank_floor(fl, ROOMS[r], fin, rng, herring=True)
    if fl.F: finish_obj(fl.build(ci, M), bevel=.0012, seg=1)
    fx = MB('apt_fixtures')
    if fin != 'rough':
        mat = 'door_oak' if fin == 'turn' else 'door_white'
        for dn in ('bath', 'living', 'bed', 'ward'): door(fx, dn, fin, mat)
    SOFT[0] = MB('apt_soft')
    hall(fx, fin, rng); bathroom(fx, fin, rng); kitchen(fx, fin, rng); bedroom(fx, fin, rng)
    if SOFT[0].F: finish_obj(SOFT[0].build(ci, M), bevel=.035, seg=4)
    SOFT[0] = None
    socket(fx, 5.2 - IW / 2, 5.3, .3, '-x', fin, n=2); socket(fx, .02, 3.2, .3, '+x', fin)
    pts = lights(fx, fin)
    finish_obj(fx.build(ci, M), bevel=.006, seg=2)
    for (x, y, z, e) in pts:
        ld = bpy.data.lights.new('lamp', 'SPOT' if fin == 'turn' else 'POINT'); ld.energy = e * (4.0 if fin == 'turn' else 1); ld.shadow_soft_size = .05; ld.color = (1, .86, .7)
        if fin == 'turn': ld.spot_size = math.radians(100); ld.spot_blend = .7
        o = bpy.data.objects.new('lamp', ld); ci.objects.link(o); o.location = (x, y, z)
    # window portals help Cycles sample the sky through the openings
    for (a, b, r) in WINS:
        ld = bpy.data.lights.new('portal', 'AREA'); ld.shape = 'RECTANGLE'; ld.size = b - a; ld.size_y = HEAD - SILL
        try: ld.cycles.is_portal = True
        except Exception: pass
        o = bpy.data.objects.new('portal', ld); ci.objects.link(o)
        o.location = ((a + b) / 2, D + EXT - .02, (SILL + HEAD) / 2); o.rotation_euler = (-PI / 2, 0, 0)
    outside(co, M, rng)
    sky(s, sun_el=26, sun_az=200, sun_str=1.0)
    s.view_settings.exposure = .6 if fin != 'rough' else 1.1
    # cameras (eye height 1.45, wide lens like real-estate photography)
    cam(s, 'cam_living', (4.95, 3.2, 1.45), (.6, 6.3, 1.0), 15)
    cam(s, 'cam_bed', (5.5, 3.45, 1.5), (9.3, 6.2, .9), 14)
    cam(s, 'cam_bath', (2.8, 1.25, 1.55), (4.9, 2.25, .95), 13)
    cam(s, 'cam_hall', (1.45, 2.35, 1.5), (1.6, -.2, 1.05), 14)
    s.camera = [o for o in s.objects if o.name.startswith('cam_living')][0]
    return s
