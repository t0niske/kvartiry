# DOGMA v2 — core: fast mesh builder, PBR materials, sky, cameras, render settings (Blender 5.2)
import bpy, math, random
from mathutils import Vector, Matrix

PI = math.pi

# ---------------------------------------------------------------- mesh builder
class MB:
    """Accumulates geometry and writes one mesh via from_pydata (fast, thousands of parts)."""
    def __init__(self, name):
        self.name = name; self.V = []; self.F = []; self.M = []; self.R = []  # R: per-face random attr
        self.mat_names = []; self.mi = {}; self.T = Matrix.Identity(4); self.stack = []; self.rnd = 0.0
    # transform stack
    def push(self, m):
        self.stack.append(self.T.copy()); self.T = self.T @ m
    def pop(self):
        self.T = self.stack.pop()
    def m(self, name):
        if name not in self.mi:
            self.mi[name] = len(self.mat_names); self.mat_names.append(name)
        return self.mi[name]
    def _v(self, p):
        q = self.T @ Vector(p); self.V.append((q.x, q.y, q.z)); return len(self.V) - 1
    def face(self, pts, mat):
        idx = [self._v(p) for p in pts]; self.F.append(idx); self.M.append(self.m(mat)); self.R.append(self.rnd)
    def box(self, x0, y0, z0, x1, y1, z1, mat, faces='all'):
        if x1 < x0: x0, x1 = x1, x0
        if y1 < y0: y0, y1 = y1, y0
        if z1 < z0: z0, z1 = z1, z0
        if x1 - x0 < 1e-5 or y1 - y0 < 1e-5 or z1 - z0 < 1e-5: return
        b = len(self.V)
        for p in ((x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)):
            self._v(p)
        mi = self.m(mat)
        for f in ((0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)):
            self.F.append([b + i for i in f]); self.M.append(mi); self.R.append(self.rnd)
    def cbox(self, cx, cy, cz, sx, sy, sz, mat):
        self.box(cx - sx/2, cy - sy/2, cz - sz/2, cx + sx/2, cy + sy/2, cz + sz/2, mat)
    def prism(self, poly, z0, z1, mat, cap=True, side_mat=None):
        """extrude 2D polygon (ccw) between z0..z1"""
        n = len(poly); b = len(self.V)
        for (x, y) in poly: self._v((x, y, z0))
        for (x, y) in poly: self._v((x, y, z1))
        sm = self.m(side_mat or mat); cm = self.m(mat)
        for i in range(n):
            j = (i + 1) % n
            self.F.append([b + i, b + j, b + n + j, b + n + i]); self.M.append(sm); self.R.append(self.rnd)
        if cap:
            self.F.append([b + n + i for i in range(n)]); self.M.append(cm); self.R.append(self.rnd)
            self.F.append([b + i for i in reversed(range(n))]); self.M.append(cm); self.R.append(self.rnd)
    def cyl(self, cx, cy, z0, z1, r, mat, seg=12, r1=None):
        r1 = r if r1 is None else r1
        poly0 = [(cx + r*math.cos(2*PI*i/seg), cy + r*math.sin(2*PI*i/seg)) for i in range(seg)]
        b = len(self.V)
        for i in range(seg):
            a = 2*PI*i/seg; self._v((cx + r*math.cos(a), cy + r*math.sin(a), z0))
        for i in range(seg):
            a = 2*PI*i/seg; self._v((cx + r1*math.cos(a), cy + r1*math.sin(a), z1))
        mi = self.m(mat)
        for i in range(seg):
            j = (i + 1) % seg
            self.F.append([b + i, b + j, b + seg + j, b + seg + i]); self.M.append(mi); self.R.append(self.rnd)
        self.F.append([b + seg + i for i in range(seg)]); self.M.append(mi); self.R.append(self.rnd)
        self.F.append([b + i for i in reversed(range(seg))]); self.M.append(mi); self.R.append(self.rnd)
    def seg_cyl(self, p0, p1, r, mat, seg=6):
        """cylinder between two 3D points (local coords)"""
        p0 = Vector(p0); p1 = Vector(p1); d = p1 - p0; L = d.length
        if L < 1e-6: return
        q = d.to_track_quat('Z', 'Y').to_matrix().to_4x4(); q.translation = p0
        self.push(q); self.cyl(0, 0, 0, L, r, mat, seg); self.pop()
    def blob(self, cx, cy, cz, r, mat, rnd, sub=1, squash=1.0, jitter=.25):
        """noisy icosphere-ish blob (foliage, shrubs)"""
        t = (1 + 5 ** .5) / 2
        vs = [(-1,t,0),(1,t,0),(-1,-t,0),(1,-t,0),(0,-1,t),(0,1,t),(0,-1,-t),(0,1,-t),(t,0,-1),(t,0,1),(-t,0,-1),(-t,0,1)]
        fs = [(0,11,5),(0,5,1),(0,1,7),(0,7,10),(0,10,11),(1,5,9),(5,11,4),(11,10,2),(10,7,6),(7,1,8),(3,9,4),(3,4,2),(3,2,6),(3,6,8),(3,8,9),(4,9,5),(2,4,11),(6,2,10),(8,6,7),(9,8,1)]
        vs = [Vector(v).normalized() for v in vs]
        for _ in range(sub):
            cache = {}; nf = []
            def mid(a, b):
                k = (min(a, b), max(a, b))
                if k not in cache: vs.append(((vs[a] + vs[b]) / 2).normalized()); cache[k] = len(vs) - 1
                return cache[k]
            for (a, b, c) in fs:
                ab, bc, ca = mid(a, b), mid(b, c), mid(c, a); nf += [(a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)]
            fs = nf
        base = len(self.V); mi = self.m(mat)
        for v in vs:
            k = r * (1 + rnd.uniform(-jitter, jitter))
            self._v((cx + v.x*k, cy + v.y*k, cz + v.z*k*squash))
        for f in fs:
            self.F.append([base + i for i in f]); self.M.append(mi); self.R.append(self.rnd)
    def build(self, coll, mats, smooth=False):
        me = bpy.data.meshes.new(self.name)
        me.from_pydata(self.V, [], self.F)
        for n in self.mat_names: me.materials.append(mats[n] if isinstance(mats, dict) else mats(n))
        me.polygons.foreach_set('material_index', self.M)
        at = me.attributes.new('rnd', 'FLOAT', 'FACE'); at.data.foreach_set('value', self.R)
        if smooth: me.polygons.foreach_set('use_smooth', [True] * len(self.F))
        me.update()
        o = bpy.data.objects.new(self.name, me); coll.objects.link(o)
        return o

def rotz(a, tx=0, ty=0, tz=0):
    m = Matrix.Rotation(a, 4, 'Z'); m.translation = (tx, ty, tz); return m

# ---------------------------------------------------------------- materials
def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c) + (1.0,)

class Mats:
    def __init__(self): self.cache = {}; self.defs = {}
    def define(self, name, **kw): self.defs[name] = kw
    def __call__(self, name):
        if name in self.cache: return self.cache[name]
        kw = self.defs.get(name)
        if kw is None: raise KeyError('material not defined: ' + name)
        m = make_mat(name, **kw); self.cache[name] = m; return m

def _nodes(m):
    m.use_nodes = True; nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    return nt, b

def _vec_wall(nt):
    """vector for vertical-wall textures: (u along wall, v = z) chosen by geometry normal"""
    geo = nt.nodes.new('ShaderNodeNewGeometry'); tc = nt.nodes.new('ShaderNodeTexCoord')
    sp = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sp.inputs[0])
    ns = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Normal'], ns.inputs[0])
    ax = nt.nodes.new('ShaderNodeMath'); ax.operation = 'ABSOLUTE'; nt.links.new(ns.outputs[0], ax.inputs[0])
    ay = nt.nodes.new('ShaderNodeMath'); ay.operation = 'ABSOLUTE'; nt.links.new(ns.outputs[1], ay.inputs[0])
    gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; nt.links.new(ax.outputs[0], gt.inputs[0]); nt.links.new(ay.outputs[0], gt.inputs[1])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'FLOAT'
    nt.links.new(gt.outputs[0], mx.inputs[0]); nt.links.new(sp.outputs[0], mx.inputs[2]); nt.links.new(sp.outputs[1], mx.inputs[3])
    cb = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(mx.outputs[0], cb.inputs[0]); nt.links.new(sp.outputs[2], cb.inputs[1])
    return cb.outputs[0]

def _rnd_attr(nt):
    a = nt.nodes.new('ShaderNodeAttribute'); a.attribute_type = 'GEOMETRY'; a.attribute_name = 'rnd'; return a.outputs['Fac']

def make_mat(name, kind='plain', color='#808080', rough=.6, metal=0., color2=None, mortar=None, scale=1.0,
             emit=None, emit_str=0., transm=0., ior=1.45, coat=0., bump=.0, alpha=1.0, var=.0, brick=(.25, .075)):
    m = bpy.data.materials.new(name); nt, b = _nodes(m)
    c1 = srgb(color); b.inputs['Base Color'].default_value = c1
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    b.inputs['IOR'].default_value = ior
    if coat: b.inputs['Coat Weight'].default_value = coat
    if transm: b.inputs['Transmission Weight'].default_value = transm
    if emit:
        b.inputs['Emission Color'].default_value = srgb(emit); b.inputs['Emission Strength'].default_value = emit_str
    out_col = None
    if kind == 'brick':
        v = _vec_wall(nt); br = nt.nodes.new('ShaderNodeTexBrick')
        nt.links.new(v, br.inputs['Vector'])
        bw, bh = brick
        br.inputs['Scale'].default_value = 1.0; br.inputs['Brick Width'].default_value = bw; br.inputs['Row Height'].default_value = bh
        br.inputs['Mortar Size'].default_value = .009; br.inputs['Mortar Smooth'].default_value = .2; br.inputs['Bias'].default_value = 0
        c2 = srgb(color2) if color2 else tuple(x * .72 for x in c1[:3]) + (1,)
        br.inputs['Color1'].default_value = c1; br.inputs['Color2'].default_value = c2
        br.inputs['Mortar'].default_value = srgb(mortar or '#b9b2a8')
        # per-brick variation via noise
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nt.links.new(v, nz.inputs['Vector'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = .35
        nt.links.new(br.outputs['Color'], mx.inputs[6]); nt.links.new(nz.outputs['Color'], mx.inputs[7])
        nt.links.new(mx.outputs[2], b.inputs['Base Color'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .35; bp.inputs['Distance'].default_value = .004
        nt.links.new(br.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    elif kind in ('noise', 'stone', 'concrete', 'asphalt', 'grass', 'plaster', 'wood'):
        tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 10; nz.inputs['Roughness'].default_value = .6
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = tuple(x * (1 - (var or .18)) for x in c1[:3]) + (1,)
        cr.color_ramp.elements[1].color = srgb(color2) if color2 else tuple(min(1, x * (1 + (var or .18))) for x in c1[:3]) + (1,)
        nt.links.new(nz.outputs['Fac'], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
        if bump:
            bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
            nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    elif kind == 'tiles':   # paving / tiles grid
        tc = nt.nodes.new('ShaderNodeTexCoord'); br = nt.nodes.new('ShaderNodeTexBrick')
        nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
        br.inputs['Scale'].default_value = 1.0; br.inputs['Brick Width'].default_value = brick[0]; br.inputs['Row Height'].default_value = brick[1]
        br.inputs['Mortar Size'].default_value = .006; br.offset = .5
        br.inputs['Color1'].default_value = c1; br.inputs['Color2'].default_value = srgb(color2) if color2 else tuple(x * .85 for x in c1[:3]) + (1,)
        br.inputs['Mortar'].default_value = srgb(mortar or '#6d6a66')
        nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .25
        nt.links.new(br.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    elif kind == 'window':  # glass with per-window interior variation (rnd attribute)
        r = _rnd_attr(nt)
        cr = nt.nodes.new('ShaderNodeValToRGB')
        cr.color_ramp.elements[0].color = srgb('#1c2228'); cr.color_ramp.elements[1].color = srgb(color2 or '#4a5966')
        nt.links.new(r, cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
    elif kind == 'interior':  # backplate behind glass: curtains / warm interiors, optional night emission
        r = _rnd_attr(nt)
        cr = nt.nodes.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements
        e[0].color = srgb('#2a2622'); e[1].color = srgb('#d9cfc0'); e.new(.55).color = srgb('#6b5e50'); e.new(.8).color = srgb('#efe6d6')
        cr.color_ramp.interpolation = 'CONSTANT'
        nt.links.new(r, cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
        if emit_str:
            gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = .45
            nt.links.new(r, gt.inputs[0]); mu = nt.nodes.new('ShaderNodeMath'); mu.operation = 'MULTIPLY'; mu.inputs[1].default_value = emit_str
            nt.links.new(gt.outputs[0], mu.inputs[0]); nt.links.new(mu.outputs[0], b.inputs['Emission Strength'])
            b.inputs['Emission Color'].default_value = srgb('#ffcf8a')
    elif kind == 'leaf':
        r = _rnd_attr(nt); cr = nt.nodes.new('ShaderNodeValToRGB')
        cr.color_ramp.elements[0].color = c1; cr.color_ramp.elements[1].color = srgb(color2 or '#7d9a3c')
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 6
        tc = nt.nodes.new('ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        ad = nt.nodes.new('ShaderNodeMath'); ad.operation = 'MULTIPLY_ADD'; ad.inputs[1].default_value = .55
        nt.links.new(nz.outputs['Fac'], ad.inputs[0]); nt.links.new(r, ad.inputs[2])
        nt.links.new(ad.outputs[0], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
        b.inputs['Subsurface Weight'].default_value = .15
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .6
        nz2 = nt.nodes.new('ShaderNodeTexVoronoi'); nz2.inputs['Scale'].default_value = 40
        nt.links.new(tc.outputs['Object'], nz2.inputs['Vector']); nt.links.new(nz2.outputs['Distance'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    elif kind == 'bars':     # railing bars: alpha-cut vertical bars every `scale` metres
        v = _vec_wall(nt); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(v, sp.inputs[0])
        dv = nt.nodes.new('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[1].default_value = scale
        nt.links.new(sp.outputs[0], dv.inputs[0])
        fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'; nt.links.new(dv.outputs[0], fr.inputs[0])
        lt = nt.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .2
        nt.links.new(fr.outputs[0], lt.inputs[0]); nt.links.new(lt.outputs[0], b.inputs['Alpha'])
    elif kind == 'leafcard':  # alpha-cut leaf clusters on small cards
        tc = nt.nodes.new('ShaderNodeTexCoord'); vo = nt.nodes.new('ShaderNodeTexVoronoi')
        vo.inputs['Scale'].default_value = scale; nt.links.new(tc.outputs['Object'], vo.inputs['Vector'])
        lt = nt.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'; lt.inputs[1].default_value = .55
        nt.links.new(vo.outputs['Distance'], lt.inputs[0]); nt.links.new(lt.outputs[0], b.inputs['Alpha'])
        r = _rnd_attr(nt); cr = nt.nodes.new('ShaderNodeValToRGB')
        cr.color_ramp.elements[0].color = c1; cr.color_ramp.elements[1].color = srgb(color2 or '#8aa647')
        ad = nt.nodes.new('ShaderNodeMath'); ad.operation = 'MULTIPLY_ADD'; ad.inputs[1].default_value = .45
        nt.links.new(vo.outputs['Color'], ad.inputs[0]); nt.links.new(r, ad.inputs[2])
        nt.links.new(ad.outputs[0], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
        b.inputs['Subsurface Weight'].default_value = .2
        try: b.inputs['Transmission Weight'].default_value = .1
        except Exception: pass
    elif kind == 'citywall':  # distant buildings: facade with procedural window grid
        v = _vec_wall(nt); br = nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(v, br.inputs['Vector'])
        br.offset = 0.0; br.squash_frequency = 1
        br.inputs['Scale'].default_value = 1.0; br.inputs['Brick Width'].default_value = 3.0; br.inputs['Row Height'].default_value = 2.9
        br.inputs['Mortar Size'].default_value = .75; br.inputs['Mortar Smooth'].default_value = 0
        br.inputs['Color1'].default_value = srgb('#2a3138'); br.inputs['Color2'].default_value = srgb('#56636e')
        br.inputs['Mortar'].default_value = c1
        nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
        rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = .12; rr.inputs['To Max'].default_value = rough
        nt.links.new(br.outputs['Fac'], rr.inputs['Value']); nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])
    elif kind == 'plank':     # wood planks: per-face (per-plank) tone from rnd + stretched grain along local x of plank
        r = _rnd_attr(nt); tc = nt.nodes.new('ShaderNodeTexCoord')
        mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale * .6, scale * 12, scale * 12)
        nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.0; nz.inputs['Detail'].default_value = 6
        nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
        wv = nt.nodes.new('ShaderNodeTexWave'); wv.inputs['Scale'].default_value = 2.0; wv.inputs['Distortion'].default_value = 6
        nt.links.new(mp.outputs['Vector'], wv.inputs['Vector'])
        mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MULTIPLY_ADD'; mx.inputs[1].default_value = .35
        nt.links.new(wv.outputs['Fac'], mx.inputs[0]); nt.links.new(r, mx.inputs[2])
        cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = c1; cr.color_ramp.elements[1].color = srgb(color2 or '#9c7048')
        nt.links.new(mx.outputs[0], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .08
        nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    elif kind in ('walltiles', 'marble'):   # wall tiles / marble-look porcelain (grid on walls or floors)
        v = _vec_wall(nt) if kind == 'walltiles' or bump >= 0 else None
        tc = nt.nodes.new('ShaderNodeTexCoord')
        vec = v if (v is not None and color2 != 'floor') else tc.outputs['Object']
        br = nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(vec, br.inputs['Vector']); br.offset = 0.0
        br.inputs['Scale'].default_value = 1.0; br.inputs['Brick Width'].default_value = brick[0]; br.inputs['Row Height'].default_value = brick[1]
        br.inputs['Mortar Size'].default_value = .003; br.inputs['Bias'].default_value = 0
        base = c1
        if kind == 'marble':
            wv = nt.nodes.new('ShaderNodeTexWave'); wv.bands_direction = 'DIAGONAL'; wv.inputs['Scale'].default_value = .45; wv.inputs['Distortion'].default_value = 11
            wv.inputs['Detail'].default_value = 6; nt.links.new(vec, wv.inputs['Vector'])
            cr = nt.nodes.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements; e[0].color = srgb(mortar or '#b5aca0'); e[0].position = .0
            e[1].color = c1; e[1].position = .045
            nt.links.new(wv.outputs['Fac'], cr.inputs[0])
            mxc = nt.nodes.new('ShaderNodeMix'); mxc.data_type = 'RGBA'
            nt.links.new(br.outputs['Fac'], mxc.inputs[0]); nt.links.new(cr.outputs[0], mxc.inputs[6]); mxc.inputs[7].default_value = srgb('#d8d4cc')
            nt.links.new(mxc.outputs[2], b.inputs['Base Color'])
        else:
            br.inputs['Color1'].default_value = c1; br.inputs['Color2'].default_value = tuple(x * .97 for x in c1[:3]) + (1,)
            br.inputs['Mortar'].default_value = srgb(mortar or '#cfcac2'); nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .3; bp.invert = True
        nt.links.new(br.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    elif kind == 'fabric':    # woven fabric: fine noise + weave bump, per-object tone from rnd
        tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = tuple(x * .88 for x in c1[:3]) + (1,); cr.color_ramp.elements[1].color = c1
        nt.links.new(nz.outputs['Fac'], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
        b.inputs['Sheen Weight'].default_value = .6
        wv = nt.nodes.new('ShaderNodeTexWave'); wv.inputs['Scale'].default_value = scale * 18
        nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .15
        nt.links.new(wv.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    elif kind == 'art':       # abstract painting
        tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Distortion'].default_value = 2.5
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        cr = nt.nodes.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements; e[0].color = c1; e[1].color = srgb(color2 or '#e9e1d2')
        e.new(.5).color = srgb(mortar or '#b48a62'); cr.color_ramp.interpolation = 'CONSTANT'
        nt.links.new(nz.outputs['Fac'], cr.inputs[0]); nt.links.new(cr.outputs[0], b.inputs['Base Color'])
    elif kind == 'stripes':  # vertical stripes (e.g. ribbed metal / slatted panel)
        v = _vec_wall(nt); wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
        wv.inputs['Scale'].default_value = scale; nt.links.new(v, wv.inputs['Vector'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.inputs[6].default_value = c1
        mx.inputs[7].default_value = srgb(color2) if color2 else tuple(x * .7 for x in c1[:3]) + (1,)
        nt.links.new(wv.outputs['Fac'], mx.inputs[0]); nt.links.new(mx.outputs[2], b.inputs['Base Color'])
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
    return m

# ---------------------------------------------------------------- scene setup
def new_scene(name, engine='CYCLES', res=(1920, 1080), samples=96):
    s = bpy.data.scenes.get(name)
    if s:
        for o in list(s.objects): bpy.data.objects.remove(o, do_unlink=True)
    else:
        s = bpy.data.scenes.new(name)
    try: bpy.context.window.scene = s
    except Exception: pass
    try: s.render.engine = engine
    except TypeError: s.render.engine = 'BLENDER_EEVEE'
    s.render.resolution_x, s.render.resolution_y = res; s.render.resolution_percentage = 100
    s.render.image_settings.file_format = 'PNG'
    if s.render.engine == 'CYCLES':
        c = s.cycles; c.samples = samples; c.use_adaptive_sampling = True; c.adaptive_threshold = .02
        c.use_denoising = True
        try: c.denoiser = 'OPENIMAGEDENOISE'
        except TypeError: pass
        c.max_bounces = 8; c.diffuse_bounces = 3; c.glossy_bounces = 3; c.transmission_bounces = 6
        c.caustics_reflective = False; c.caustics_refractive = False
        c.device = 'CPU'
        try: s.render.use_persistent_data = True
        except Exception: pass
    try: s.view_settings.view_transform = 'AgX'
    except TypeError: pass
    for lk in ('AgX - Medium High Contrast', 'Medium High Contrast', 'AgX - Base Contrast', 'None'):
        try: s.view_settings.look = lk; break
        except TypeError: pass
    return s

def sky(s, sun_el=32, sun_az=215, strength=1.0, sun_str=1.0, haze=1.0):
    """physical sky + matching sun lamp; azimuth in degrees from +Y (north) clockwise"""
    w = bpy.data.worlds.new(s.name + '_world'); s.world = w; w.use_nodes = True
    nt = w.node_tree; bg = next(n for n in nt.nodes if n.type == 'BACKGROUND')
    sk = nt.nodes.new('ShaderNodeTexSky')
    for t in ('MULTIPLE_SCATTERING', 'NISHITA', 'HOSEK_WILKIE'):
        try: sk.sky_type = t; break
        except TypeError: pass
    try:
        sk.sun_elevation = math.radians(sun_el); sk.sun_rotation = math.radians(90 - sun_az + 180)
        sk.sun_disc = False
        sk.air_density = haze; sk.aerosol_density = 1.2 * haze if hasattr(sk, 'aerosol_density') else None
    except Exception: pass
    nt.links.new(sk.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = .22 * strength
    ld = bpy.data.lights.new('sun', 'SUN'); ld.energy = 4.2 * sun_str; ld.angle = math.radians(.6); ld.color = (1, .93, .84)
    so = bpy.data.objects.new('sun', ld); s.collection.objects.link(so)
    az = math.radians(sun_az); el = math.radians(sun_el)
    d = Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)))  # towards sun
    so.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    return so

def cam(s, name, loc, target, lens=35, shift=(0, 0)):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_start = .05; cd.clip_end = 6000
    cd.shift_x, cd.shift_y = shift
    co = bpy.data.objects.new(name, cd); s.collection.objects.link(co)
    co.location = loc; co.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return co

def coll(s, name):
    c = bpy.data.collections.new(name); s.collection.children.link(c); return c
