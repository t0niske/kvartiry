# DOGMA v2 — facade engine: walls with real openings, frames, sills, rails, balconies, bays, curtain glazing, roofs
import math, random
from mathutils import Vector, Matrix

def edge_frame(p0, p1, z=0.0):
    e = Vector((p1[0] - p0[0], p1[1] - p0[1], 0)); L = e.length; e /= L
    n = Vector((e.y, -e.x, 0))                       # outward for ccw polygons
    M = Matrix(((e.x, n.x, 0, p0[0]), (e.y, n.y, 0, p0[1]), (0, 0, 1, z), (0, 0, 0, 1)))
    return M, L

def chamfer(poly, c):
    """cut every corner of polygon by distance c (c can be list per vertex)"""
    out = []; n = len(poly)
    for i in range(n):
        a = Vector(poly[i - 1]); b = Vector(poly[i]); d = Vector(poly[(i + 1) % n])
        ci = c[i] if isinstance(c, (list, tuple)) else c
        if ci <= 0: out.append(tuple(b)); continue
        out.append(tuple(b + (a - b).normalized() * ci)); out.append(tuple(b + (d - b).normalized() * ci))
    return out

def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]

def offset_poly(poly, d):
    """inset (d<0) / outset (d>0) a convex-ish ccw polygon"""
    n = len(poly); out = []
    for i in range(n):
        p0 = Vector(poly[i - 1]); p1 = Vector(poly[i]); p2 = Vector(poly[(i + 1) % n])
        e1 = (p1 - p0).normalized(); e2 = (p2 - p1).normalized()
        n1 = Vector((e1.y, -e1.x)); n2 = Vector((e2.y, -e2.x))
        bis = (n1 + n2); k = bis.length
        if k < 1e-6: out.append(tuple(p1 + n1 * d)); continue
        bis /= k; cos = max(.3, bis.dot(n1))
        out.append(tuple(p1 + bis * (d / cos)))
    return out

# ------------------------------------------------------------------ opening pieces (local edge frame: u, d(out), z)
def window(mb, u0, u1, zs, zh, t, S, kind='win', rng=None, panes=None, transom=None, sill=True):
    rng = rng or random
    mb.rnd = rng.random()
    gd = -t * .55                                  # glass plane depth
    deep = -t - .7
    # recess box behind glass (interior impression)
    mb.face([(u0, deep, zs), (u1, deep, zs), (u1, deep, zh), (u0, deep, zh)], 'interior')
    mb.face([(u0, gd, zs), (u0, deep, zs), (u0, deep, zh), (u0, gd, zh)], 'reveal_in')
    mb.face([(u1, deep, zs), (u1, gd, zs), (u1, gd, zh), (u1, deep, zh)], 'reveal_in')
    mb.face([(u0, deep, zh), (u1, deep, zh), (u1, gd, zh), (u0, gd, zh)], 'reveal_in')
    mb.face([(u0, gd, zs), (u1, gd, zs), (u1, deep, zs), (u0, deep, zs)], 'reveal_in')
    # glass
    mb.face([(u0, gd, zs), (u1, gd, zs), (u1, gd, zh), (u0, gd, zh)], S.get('glass', 'glass'))
    fm = S.get('frame', 'frame'); fw = S.get('fw', .065); fd = .08
    mb.box(u0, gd - fd/2, zs, u1, gd + fd/2, zs + fw, fm); mb.box(u0, gd - fd/2, zh - fw, u1, gd + fd/2, zh, fm)
    mb.box(u0, gd - fd/2, zs + fw, u0 + fw, gd + fd/2, zh - fw, fm); mb.box(u1 - fw, gd - fd/2, zs + fw, u1, gd + fd/2, zh - fw, fm)
    w = u1 - u0; h = zh - zs
    np_ = panes or max(1, round(w / S.get('pane', 1.0)))
    for k in range(1, np_):
        u = u0 + w * k / np_; mb.box(u - fw/2, gd - fd/2, zs + fw, u + fw/2, gd + fd/2, zh - fw, fm)
    tr = transom if transom is not None else (h > 2.3 and S.get('transom', True))
    if tr:
        zt = zh - (.55 if tr is True else tr); mb.box(u0 + fw, gd - fd * .45, zt - fw/2, u1 - fw, gd + fd * .45, zt + fw/2, fm)
    if sill and zs > .08 and kind != 'curtain':
        mb.box(u0 - .04, gd, zs - .035, u1 + .04, .07, zs, S.get('sillm', fm))
    mb.rnd = 0.0

def rail(mb, u0, u1, d, z0, S, h=1.1, side=False, mat=None):
    """bar railing panel; side=True -> along d axis at u=u0 from d=0..d"""
    m = mat or S.get('rail', 'railbars'); tm = S.get('railtop', S.get('frame', 'frame'))
    if not side:
        mb.box(u0, d - .012, z0 + .06, u1, d + .012, z0 + h - .05, m)
        mb.box(u0 - .02, d - .025, z0 + h - .05, u1 + .02, d + .025, z0 + h, tm)
        mb.box(u0, d - .015, z0 + .03, u1, d + .015, z0 + .07, tm)
        for u in (u0, u1): mb.box(u - .02, d - .02, z0, u + .02, d + .02, z0 + h, tm)
    else:
        mb.box(u0 - .012, 0, z0 + .06, u0 + .012, d, z0 + h - .05, m)
        mb.box(u0 - .025, 0, z0 + h - .05, u0 + .025, d, z0 + h, tm)

def balcony(mb, u0, u1, z0, depth, S, slab='slab', railmat=None, sides=True):
    mb.box(u0, 0, z0 - .2, u1, depth, z0, S.get('slab', slab))
    rail(mb, u0 + .03, u1 - .03, depth - .04, z0, S, mat=railmat)
    if sides:
        rail(mb, u0 + .03, 0, depth - .04, z0, S, side=True, mat=railmat); rail(mb, u1 - .03, 0, depth - .04, z0, S, side=True, mat=railmat)

def wall_row(mb, L, z0, zt, t, openings, mat_fn):
    """solid wall pieces of one storey around openings; openings: list of dicts with u0,u1,zs,zh (absolute z)"""
    ops = sorted(openings, key=lambda o: o['u0']); u = 0.0
    for o in ops:
        if o['u0'] > u + 1e-4: mb.box(u, -t, z0, o['u0'], 0, zt, mat_fn(u, o['u0']))
        if o['zs'] > z0 + 1e-4: mb.box(o['u0'], -t, z0, o['u1'], 0, o['zs'], mat_fn(o['u0'], o['u1']))
        if o['zh'] < zt - 1e-4: mb.box(o['u0'], -t, o['zh'], o['u1'], 0, zt, mat_fn(o['u0'], o['u1']))
        u = max(u, o['u1'])
    if u < L - 1e-4: mb.box(u, -t, z0, L, 0, zt, mat_fn(u, L))

def bays(L, target, margin=0.0):
    n = max(1, round((L - 2 * margin) / target)); b = (L - 2 * margin) / n
    return [(margin + b * i, margin + b * (i + 1)) for i in range(n)]

# ------------------------------------------------------------------ building assembly
class Building:
    """poly ccw (world); style object S with: t, FH, GH, nf(total floors incl. ground), and callbacks"""
    def __init__(self, mb, poly, nf, S, base=0.0, rng=None, name='b'):
        self.mb = mb; self.poly = poly; self.nf = nf; self.S = S; self.base = base; self.rng = rng or random.Random(1)
        self.H = base + S['GH'] + (nf - 1) * S['FH']
    def z(self, f):   # floor f base height (f=0 ground)
        S = self.S; return self.base + (0 if f == 0 else S['GH'] + (f - 1) * S['FH'])
    def run(self):
        S = self.S; mb = self.mb; poly = self.poly; n = len(poly)
        for ei in range(n):
            M, L = edge_frame(poly[ei], poly[(ei + 1) % n])
            mb.push(M)
            ctx = dict(ei=ei, L=L, b=self, p0=poly[ei], p1=poly[(ei + 1) % n])
            for f in range(self.nf):
                z0 = self.z(f); zt = self.z(f + 1) if f < self.nf - 1 else self.H
                ops = S['openings'](ctx, f, z0, zt) if L > .3 else []
                wall_row(mb, L, z0, zt, S['t'], ops, lambda a, b_, f=f: S['wall'](ctx, f, a, b_))
                for o in ops: S['fill'](ctx, f, o)
            S['decor'](ctx)
            # parapet
            mb.box(0, -S['t'], self.H, L, 0, self.H + S.get('parapet', 1.2), S['wall'](ctx, self.nf, 0, L))
            mb.pop()
        S['roof'](self)

def roof_basic(b, S, machine=True, rng=None, ac=12, coping='coping'):
    mb = b.mb; rng = rng or b.rng; H = b.H; P = S.get('parapet', 1.2)
    inner = offset_poly(b.poly, -S['t'])
    mb.prism(inner, H - .3, H + .05, 'roof')
    # coping on parapet
    n = len(b.poly)
    for ei in range(n):
        M, L = edge_frame(b.poly[ei], b.poly[(ei + 1) % n]); mb.push(M)
        mb.box(-.05, -S['t'] - .05, H + P, L + .05, .06, H + P + .08, S.get('coping', coping))
        mb.pop()
    xs = [p[0] for p in inner]; ys = [p[1] for p in inner]
    cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
    w = (max(xs) - min(xs)); d = (max(ys) - min(ys))
    if machine:
        mx, my = min(7, w * .3), min(6, d * .3)
        mb.box(cx - mx/2, cy - my/2, H, cx + mx/2, cy + my/2, H + 3.4, S.get('machine', 'machine'))
        mb.box(cx - mx/2 - .1, cy - my/2 - .1, H + 3.4, cx + mx/2 + .1, cy + my/2 + .1, H + 3.6, S.get('coping', coping))
    for i in range(ac):   # AC units / vents / exhausts
        x = cx + rng.uniform(-.38, .38) * w; y = cy + rng.uniform(-.38, .38) * d
        if rng.random() < .55:
            mb.box(x - .45, y - .3, H, x + .45, y + .3, H + .75, 'ac')
        else:
            mb.cyl(x, y, H, H + rng.uniform(.6, 1.6), rng.uniform(.12, .25), 'metal', seg=10)
