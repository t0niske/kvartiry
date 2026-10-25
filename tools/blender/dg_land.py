# DOGMA v2 — landscape: roads, sidewalks, parking, cars, trees, shrubs, lamps, benches, playgrounds, courts, pools
import math, random
from mathutils import Vector, Matrix
PI = math.pi

def land_mats(M):
    M.define('grass', kind='grass', color='#5a6e3a', color2='#7d8c4c', scale=.35, rough=.95, bump=.3, var=.22)
    M.define('grass_lush', kind='grass', color='#4d7330', color2='#7aa047', scale=1.6, rough=.9, bump=.4, var=.3)
    M.define('asphalt', kind='asphalt', color='#3b3d40', scale=6, rough=.88, bump=.15, var=.12)
    M.define('marking', color='#e8e6df', rough=.6)
    M.define('curb', kind='concrete', color='#b8b4ac', scale=8, rough=.7)
    M.define('paving', kind='tiles', color='#b9b1a3', color2='#a69d8f', brick=(.3, .15), rough=.75, mortar='#8a837a')
    M.define('paving_dark', kind='tiles', color='#6f6a64', color2='#5d5954', brick=(.4, .2), rough=.75, mortar='#4a4643')
    M.define('paving_warm', kind='tiles', color='#c9b79b', color2='#b39f82', brick=(.6, .3), rough=.7, mortar='#8f8270')
    M.define('rubber_teal', color='#3f9c95', rough=.9); M.define('rubber_orange', color='#d97a3a', rough=.9)
    M.define('rubber_blue', color='#3d78b8', rough=.9); M.define('court_green', color='#4f8f5a', rough=.85)
    M.define('court_terra', color='#b5603d', rough=.9); M.define('court_line', color='#f2f0ea', rough=.6)
    M.define('water', color='#2f6f86', rough=.03, ior=1.33, transm=.6, coat=1.0)
    M.define('pool_tile', kind='tiles', color='#5fb7c6', color2='#4aa3b3', brick=(.12, .12), mortar='#dff3f5', rough=.3)
    M.define('bark', kind='noise', color='#4b3d31', scale=20, rough=.9, bump=.5)
    M.define('leaf', kind='leaf', color='#3f5f22', color2='#86a344', rough=.7)
    M.define('leaf_dark', kind='leaf', color='#2f4a1c', color2='#5f7f30', rough=.7)
    M.define('leafcard', kind='leafcard', color='#3d5a20', color2='#88a744', scale=7, rough=.6)
    M.define('leafcard2', kind='leafcard', color='#344f1d', color2='#6f8d34', scale=6, rough=.6)
    M.define('conifercard', kind='leafcard', color='#1e3520', color2='#3e5a35', scale=12, rough=.7)
    M.define('leaf_inner', kind='leaf', color='#33491f', color2='#4c6a2a', rough=.9)
    M.define('citywall', kind='citywall', color='#d8d2c6', rough=.85)
    M.define('citywall2', kind='citywall', color='#c9b9a2', rough=.85)
    M.define('citywall3', kind='citywall', color='#a8735b', rough=.85)
    M.define('citywall4', kind='citywall', color='#a19e98', rough=.85)
    M.define('citywall5', kind='citywall', color='#bfae94', rough=.85)
    M.define('house1', kind='plaster', color='#e6dccb', scale=4, rough=.85); M.define('house2', kind='plaster', color='#d9c7a8', scale=4, rough=.85)
    M.define('house3', kind='brick', color='#a65a3e', color2='#8a4630', mortar='#cfc3b2')
    M.define('roof_red', color='#8c3b2b', rough=.55, metal=.3); M.define('roof_brown', color='#5a4a3e', rough=.55, metal=.3)
    M.define('fence_wood', kind='stripes', color='#7a6a58', color2='#5e5244', scale=8, rough=.8)
    M.define('old_roof', color='#5b5f62', rough=.6, metal=.4)
    M.define('conifer', kind='leaf', color='#1f3a22', color2='#3d5c34', rough=.75)
    M.define('shrub', kind='leaf', color='#3a5a24', color2='#7c9a3e', rough=.8)
    M.define('flowers', kind='leaf', color='#b84a6a', color2='#e8c45a', rough=.7)
    M.define('soil', kind='noise', color='#4a3a2c', scale=4, rough=.95)
    M.define('wood', kind='wood', color='#9a6a40', color2='#b98557', scale=30, rough=.55, var=.2)
    M.define('metal_dark', color='#2b2d30', rough=.35, metal=.85)
    M.define('metal', color='#9aa0a6', rough=.3, metal=.9)
    M.define('lamp_glow', color='#fff4e0', emit='#ffe2b0', emit_str=3.0)
    M.define('car_glass', color='#16191c', rough=.05, metal=.2)
    M.define('tire', color='#151515', rough=.8)
    for i, c in enumerate(('#e9e9e7', '#1b1c1e', '#7b8086', '#23324a', '#8a1f1f', '#c9c6be', '#3c4a3e', '#b4b8bb')):
        M.define('car%d' % i, color=c, rough=.25, metal=.6, coat=1.0)
    M.define('play_red', color='#c8402e', rough=.5); M.define('play_yellow', color='#e6b22e', rough=.5)
    M.define('play_white', color='#efede8', rough=.35); M.define('play_wood', kind='wood', color='#b98a5c', scale=25, rough=.6)
    M.define('canvas', color='#f4f2ec', rough=.6)

# --------------------------------------------------------------- primitives
def road(mb, p0, p1, w, lanes=2, mark=True, curb=True, walk=3.0, walkmat='paving'):
    a = Vector((p0[0], p0[1], 0)); b = Vector((p1[0], p1[1], 0)); e = (b - a); L = e.length; e /= L
    M = Matrix(((e.x, -e.y, 0, a.x), (e.y, e.x, 0, a.y), (0, 0, 1, 0), (0, 0, 0, 1)))
    mb.push(M)
    mb.box(0, -w/2, -.05, L, w/2, .0, 'asphalt')
    if mark:
        if lanes >= 2:
            k = 0.0
            while k < L - 3: mb.box(k, -.07, 0, k + 3, .07, .006, 'marking'); k += 9
        mb.box(0, -w/2 + .3, 0, L, -w/2 + .42, .006, 'marking'); mb.box(0, w/2 - .42, 0, L, w/2 - .3, .006, 'marking')
    if curb:
        for s in (-1, 1):
            mb.box(0, s * w/2 - .1, 0, L, s * w/2 + .1, .15, 'curb')
            if walk: mb.box(0, s * (w/2 + .1), 0, L, s * (w/2 + .1 + walk), .12, walkmat)
    mb.pop()

def crosswalk(mb, x, y, ang, w, length=4.0):
    M = Matrix.Rotation(ang, 4, 'Z'); M.translation = (x, y, 0); mb.push(M)
    k = -w/2 + .3
    while k < w/2 - .3: mb.box(k, -length/2, 0, k + .5, length/2, .007, 'marking'); k += 1.0
    mb.pop()

def car(mb, x, y, ang, rng, color=None):
    M = Matrix.Rotation(ang, 4, 'Z'); M.translation = (x, y, 0); mb.push(M)
    cm = color or 'car%d' % rng.randrange(8)
    L, W = rng.uniform(4.3, 4.9), 1.85
    prof = [(-L/2, .35), (L/2, .35), (L/2, .75), (L/2 - .25, .95), (-L/2 + .2, .98), (-L/2, .8)]
    _side_prism(mb, prof, -W/2, W/2, cm)
    cab = [(-L/2 + .9, .95), (L/2 - 1.25, .95), (L/2 - 1.9, 1.42), (-L/2 + 1.35, 1.45)]
    _side_prism(mb, cab, -W/2 + .08, W/2 - .08, 'car_glass')
    for sx in (-L/2 + .8, L/2 - .85):
        for sy in (-W/2 + .12, W/2 - .12):
            mb.seg_cyl((sx, sy - .11, .34), (sx, sy + .11, .34), .34, 'tire', seg=10)
    mb.pop()

def _side_prism(mb, prof, y0, y1, mat):
    """profile in (x,z) extruded along y"""
    n = len(prof); b = len(mb.V)
    for (x, z) in prof: mb._v((x, y0, z))
    for (x, z) in prof: mb._v((x, y1, z))
    mi = mb.m(mat)
    for i in range(n):
        j = (i + 1) % n; mb.F.append([b + i, b + n + i, b + n + j, b + j]); mb.M.append(mi); mb.R.append(mb.rnd)
    mb.F.append([b + i for i in range(n)]); mb.M.append(mi); mb.R.append(mb.rnd)
    mb.F.append([b + n + i for i in reversed(range(n))]); mb.M.append(mi); mb.R.append(mb.rnd)

def tree(mb, x, y, h, rng, kind='deciduous', z=0.0):
    mb.rnd = rng.random()
    if kind == 'conifer':
        mb.cyl(x, y, z, z + h * .95, .12, 'bark', seg=6, r1=.03)
        R = h * .22
        mb.cyl(x, y, z + h * .2, z + h * .95, R * .55, 'leaf_inner', seg=8, r1=.05)
        for i in range(int(h * 45)):
            t = rng.uniform(.15, 1.0); zz = z + h * (.12 + .86 * t); rr = R * (1 - t) * rng.uniform(.6, 1.15) + .1
            a = rng.uniform(0, 2 * PI); p = Vector((x + math.cos(a) * rr, y + math.sin(a) * rr, zz))
            out = Vector((math.cos(a), math.sin(a), -.35)).normalized(); side = Vector((-math.sin(a), math.cos(a), 0))
            q = rng.uniform(.5, .9) * (1.1 - t * .5)
            mb.face([tuple(p - side * q / 2), tuple(p + side * q / 2), tuple(p + side * q / 2 + out * q), tuple(p - side * q / 2 + out * q)], 'conifercard')
        mb.rnd = 0; return
    tr = h * rng.uniform(.022, .032)
    lean = Vector((rng.uniform(-.25, .25), rng.uniform(-.25, .25), 0))
    top = Vector((x, y, z + h * .6)) + lean
    mb.push(Matrix.Identity(4)); mb.seg_cyl((x, y, z), top, tr, 'bark', seg=8); mb.pop()
    crown = Vector((x, y, z + h * .64)) + lean; R = h * rng.uniform(.26, .34); Rz = R * rng.uniform(.8, 1.05)
    nb = rng.randint(5, 8)
    tips = []
    for i in range(nb):
        a = 2 * PI * i / nb + rng.uniform(-.4, .4); zz = z + h * rng.uniform(.4, .58)
        base = Vector((x, y, zz)) + lean * (zz - z) / (h * .6)
        tip = crown + Vector((math.cos(a) * R * .75, math.sin(a) * R * .75, rng.uniform(-.1, .5) * Rz))
        mb.seg_cyl(base, tip, tr * .38, 'bark', seg=5); tips.append(tip)
    # inner volume so the crown is not see-through
    for i in range(4):
        a = rng.uniform(0, 2 * PI); rr = R * .3
        mb.blob(crown.x + math.cos(a) * rr, crown.y + math.sin(a) * rr, crown.z + rng.uniform(-.2, .25) * Rz, R * .45, 'leaf_inner', rng, sub=1, squash=Rz / R, jitter=.3)
    # leaf cards
    n = int(R * R * 26) + 160
    mat = 'leafcard' if rng.random() < .65 else 'leafcard2'
    for i in range(n):
        # point near ellipsoid surface, biased up/outward
        u = rng.uniform(-1, 1); a = rng.uniform(0, 2 * PI); s = math.sqrt(1 - u * u)
        k = rng.uniform(.72, 1.05)
        if i % 5 == 0:   # some clusters hug branch tips
            tp = tips[i % len(tips)]; p = tp + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-.6, .8))) * R * .3
        else:
            p = crown + Vector((s * math.cos(a) * R * k, s * math.sin(a) * R * k, u * Rz * k))
        q = rng.uniform(.6, 1.05)
        d1 = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))).normalized()
        d2 = d1.cross(Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))).normalized()
        d1 *= q / 2; d2 *= q / 2
        mb.face([tuple(p - d1 - d2), tuple(p + d1 - d2), tuple(p + d1 + d2), tuple(p - d1 + d2)], mat)
    mb.rnd = 0

def shrub(mb, x, y, r, rng, mat='shrub', z=0.0):
    mb.rnd = rng.random()
    for i in range(rng.randint(2, 4)):
        mb.blob(x + rng.uniform(-r, r) * .5, y + rng.uniform(-r, r) * .5, z + r * .45, r * rng.uniform(.55, .8), mat, rng, sub=1, squash=.7, jitter=.25)
    mb.rnd = 0

def lamp(mb, x, y, h=5.0, z=0.0):
    mb.cyl(x, y, z, z + h, .06, 'metal_dark', seg=8)
    mb.box(x - .35, y - .09, z + h - .05, x + .35, y + .09, z + h + .06, 'metal_dark')
    mb.box(x - .3, y - .07, z + h - .08, x + .3, y + .07, z + h - .05, 'lamp_glow')

def bollard(mb, x, y, z=0.0):
    mb.cyl(x, y, z, z + .8, .08, 'metal_dark', seg=8); mb.cyl(x, y, z + .62, z + .74, .085, 'lamp_glow', seg=8)

def bench(mb, x, y, ang, z=0.0, L=1.8):
    M = Matrix.Rotation(ang, 4, 'Z'); M.translation = (x, y, z); mb.push(M)
    for k in range(5): mb.box(-L/2, -.25 + k * .1, .42, L/2, -.25 + k * .1 + .08, .46, 'wood')
    for s in (-L/2 + .15, L/2 - .2): mb.box(s, -.25, 0, s + .06, .25, .42, 'metal_dark')
    for k in range(3): mb.box(-L/2, .27, .55 + k * .12, L/2, .31, .64 + k * .12, 'wood')
    mb.pop()

def playground(mb, cx, cy, w, d, rng, z=0.0, surf='rubber_teal'):
    mb.box(cx - w/2, cy - d/2, z, cx + w/2, cy + d/2, z + .05, surf)
    mb.box(cx - w/2, cy - d/2, z, cx + w/2, cy - d/2 + .12, z + .15, 'curb')
    # climbing tower + slide
    tx, ty = cx - w * .2, cy
    for sx in (-1, 1):
        for sy in (-1, 1): mb.box(tx + sx * 1.0 - .06, ty + sy * 1.0 - .06, z, tx + sx * 1.0 + .06, ty + sy * 1.0 + .06, z + 3.2, 'play_wood')
    mb.box(tx - 1.05, ty - 1.05, z + 1.4, tx + 1.05, ty + 1.05, z + 1.5, 'play_wood')
    mb.prism([(tx - 1.2, ty - 1.2), (tx + 1.2, ty - 1.2), (tx + 1.2, ty + 1.2), (tx - 1.2, ty + 1.2)], z + 3.2, z + 3.25, 'play_red')
    _ramp(mb, tx + 1.05, ty - .45, z + 1.5, tx + 4.2, ty - .45, z + .25, .8, 'play_yellow')
    # swings
    sx0 = cx + w * .2
    for k in (-1, 1): mb.seg_cyl((sx0 + k * 1.8, cy - 1.2, z), (sx0 + k * 1.8, cy, z + 2.6), .06, 'metal_dark'); mb.seg_cyl((sx0 + k * 1.8, cy + 1.2, z), (sx0 + k * 1.8, cy, z + 2.6), .06, 'metal_dark')
    mb.seg_cyl((sx0 - 1.8, cy, z + 2.6), (sx0 + 1.8, cy, z + 2.6), .06, 'metal_dark')
    for k in (-.8, .8):
        mb.seg_cyl((sx0 + k, cy, z + 2.6), (sx0 + k, cy, z + .55), .01, 'metal_dark', seg=4)
        mb.box(sx0 + k - .25, cy - .12, z + .5, sx0 + k + .25, cy + .12, z + .56, 'play_red')
    # spring riders / balance beam
    for i in range(3):
        px, py = cx + rng.uniform(-w * .4, w * .4), cy + d * .3
        mb.cyl(px, py, z, z + .55, .05, 'metal', seg=6); mb.box(px - .35, py - .12, z + .5, px + .35, py + .12, z + .75, ('play_red', 'play_yellow', 'rubber_blue')[i])

def _ramp(mb, x0, y0, z0, x1, y1, z1, w, mat):
    d = Vector((x1 - x0, y1 - y0, 0)).normalized(); n = Vector((-d.y, d.x, 0)) * w / 2
    p = [Vector((x0, y0, z0)) - n, Vector((x0, y0, z0)) + n, Vector((x1, y1, z1)) + n, Vector((x1, y1, z1)) - n]
    mb.face([tuple(v) for v in p], mat)
    mb.face([tuple(v + Vector((0, 0, -.06))) for v in reversed(p)], mat)

def court(mb, cx, cy, w, d, surf='court_terra', ang=0.0, z=0.0, fence=True, net=True):
    M = Matrix.Rotation(ang, 4, 'Z'); M.translation = (cx, cy, z); mb.push(M)
    mb.box(-w/2, -d/2, 0, w/2, d/2, .04, surf)
    lw = .07
    for (a, b) in ((-w/2 + 1, -w/2 + 1 + lw), (w/2 - 1 - lw, w/2 - 1)): mb.box(a, -d/2 + 1, .04, b, d/2 - 1, .046, 'court_line')
    for (a, b) in ((-d/2 + 1, -d/2 + 1 + lw), (d/2 - 1 - lw, d/2 - 1), (-lw/2, lw/2)): mb.box(-w/2 + 1, a, .04, w/2 - 1, b, .046, 'court_line')
    if net: mb.box(-w/2 + .8, -.02, 0, w/2 - .8, .02, 1.0, 'railbars')
    if fence:
        for (a0, b0, a1, b1) in ((-w/2, -d/2, w/2, -d/2 + .04), (-w/2, d/2 - .04, w/2, d/2), (-w/2, -d/2, -w/2 + .04, d/2), (w/2 - .04, -d/2, w/2, d/2)):
            mb.box(a0, b0, 0, a1, b1, 3.0, 'fence')
    mb.pop()

def pool(mb, poly, z, depth=.5, rim='paving_warm'):
    from dg_facade import offset_poly
    mb.prism(offset_poly(poly, .35), z, z + .12, rim)
    mb.prism(poly, z + .02, z + .1, 'water')

def pergola(mb, x0, y0, x1, y1, z=0.0, h=3.0, step=1.2):
    for (x, y) in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)): mb.box(x - .1, y - .1, z, x + .1, y + .1, z + h, 'metal_dark')
    mb.box(x0 - .1, y0 - .1, z + h, x1 + .1, y0 + .1, z + h + .2, 'metal_dark'); mb.box(x0 - .1, y1 - .1, z + h, x1 + .1, y1 + .1, z + h + .2, 'metal_dark')
    k = x0
    while k <= x1 + 1e-3: mb.box(k - .04, y0, z + h + .2, k + .04, y1, z + h + .32, 'wood'); k += step

def scatter_trees(mb, rng, area, n, hmin=6, hmax=11, avoid=None, kind_p=.1, z=0.0):
    x0, y0, x1, y1 = area; k = 0; tries = 0
    while k < n and tries < n * 30:
        tries += 1; x = rng.uniform(x0, x1); y = rng.uniform(y0, y1)
        if avoid and any(a[0] <= x <= a[2] and a[1] <= y <= a[3] for a in avoid): continue
        tree(mb, x, y, rng.uniform(hmin, hmax), rng, 'conifer' if rng.random() < kind_p else 'deciduous', z=z); k += 1

def parking(mb, x0, y0, x1, y1, rng, ang=0.0, fill=.75, z=0.0):
    """row of perpendicular spaces along x (local), cars facing y"""
    M = Matrix.Rotation(ang, 4, 'Z'); M.translation = (x0, y0, z); mb.push(M)
    L = x1 - x0; D = y1 - y0
    mb.box(0, 0, -.04, L, D, .005, 'asphalt')
    k = 0.0
    while k <= L + 1e-3:
        mb.box(k - .06, 0, 0, k + .06, D * .9, .008, 'marking'); k += 2.6
    k = 1.3
    while k < L:
        if rng.random() < fill: car(mb, k, D * .48, PI / 2 + (PI if rng.random() < .5 else 0), rng)
        k += 2.6
    mb.pop()
