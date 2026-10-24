# DOGMA scene builder for Blender 5.2 (exec'd via MCP)
import bpy, bmesh, math, random
from mathutils import Vector, Matrix

PI = math.pi
OUT = globals().get("OUT_DIR", "")

STYLES = {
  'rekord': dict(wall='brick', color='#9e4a32', frame='#252628', band='#252628', glaze='ribbon', podium='#cfc2aa', cap='#2a2b2e', glass='#5d7283', balcony=3),
  'samT':   dict(wall='brick', color='#b8693f', frame='#2b2a29', band='#d6cbbb', glaze='tall', podium='#d3c4ab', cap='#2b2a29', glass='#5b6d7c'),
  'samW':   dict(wall='plaster', color='#ebe8e2', frame='#2f3134', band='#cbc5bb', glaze='punched', podium='#dad5cc', cap='#a3352c', glass='#5f7383'),
  'reeds':  dict(wall='brick', color='#6e2d2e', frame='#1d1d1f', band=None, glaze='grid', podium='#2b2b2d', cap='#1d1d1f', glass='#506372'),
  'park':   dict(wall='plaster', color='#dacdb6', frame='#8a6a46', band='#3b332c', glaze='french', podium='#3b332c', cap='#3b332c', glass='#55687a', lower=('#3d342d', 7)),
}

COMPLEXES = {
 'rekord': dict(b=[(-44,-38,0,28,18,24,'rekord',None),(-16,-37,0,28,18,22,'rekord',None),(20,-30,0,30,18,24,'rekord',None),(38,-6,PI/2,28,18,24,'rekord',None),
    (-62,-6,-PI/2,30,18,24,'rekord',None),(-46,20,0,20,20,24,'rekord',None),(-10,30,PI,28,18,24,'rekord',None),
    (78,-26,0,28,18,24,'rekord',None),(94,-2,-PI/2,24,18,22,'rekord',None),(82,34,PI,28,18,24,'rekord',None)],
    yards=[(-3,-1.5,58,37),(66,4,34,34)]),
 'samolet7': dict(b=[(-44,-28,0,22,18,20,'samT',None),(16,-30,0,22,18,22,'samT',None),(62,-2,-PI/2,22,18,20,'samT',None),(-58,26,PI/2,20,18,18,'samT',None),
    (-17,-30,0,28,15,12,'samW',None),(-58,-2,PI/2,26,15,10,'samW',None),(-26,30,PI,40,15,9,'samW',None),
    (2,0,PI/2,34,15,12,'samW',None),(42,-30,0,24,15,12,'samW',None),(34,28,PI,40,15,10,'samW',None)],
    yards=[(-28,2,38,34),(31,-1,36,36)]),
 'reed': dict(b=[(-40,-40,0,22,20,25,'reeds','#6e2d2e'),(0,-40,0,22,20,18,'reeds','#3b3634'),(40,-40,0,22,20,22,'reeds','#c8b193'),
    (-40,-2,PI/2,22,20,16,'reeds','#c8b193'),(40,-2,-PI/2,22,20,24,'reeds','#7f3a30'),
    (-40,36,PI,22,20,20,'reeds','#3b3634'),(0,36,PI,22,20,19,'reeds','#8a7c6e'),(40,36,PI,22,20,23,'reeds','#6e2d2e')],
    yards=[(0,-2,56,38)]),
 'park3': dict(b=[(-42,-6,0,24,20,21,'park',None),(42,-6,0,24,20,21,'park',None),(-15,-22,0,30,16,14,'park',None),(15,-22,0,30,16,12,'park',None),
    (-24,22,PI,24,16,9,'park',None),(24,22,PI,24,16,9,'park',None)],
    yards=[(0,0,56,24)]),
}

FH = 3.1   # floor height
GH = 4.6   # ground floor height

def hexc(h, a=1.0):
    h = h.lstrip('#'); return (int(h[0:2],16)/255)**2.2, (int(h[2:4],16)/255)**2.2, (int(h[4:6],16)/255)**2.2, a

def mat(name, color, rough=.7, metal=0., kind=None, scale=1.0, transm=0., emit=None):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = hexc(color) if isinstance(color, str) else color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if transm:
        b.inputs['Transmission Weight'].default_value = transm
    if emit:
        b.inputs['Emission Color'].default_value = hexc(emit[0]); b.inputs['Emission Strength'].default_value = emit[1]
    if kind == 'brick':
        tc = nt.nodes.new('ShaderNodeTexCoord'); br = nt.nodes.new('ShaderNodeTexBrick')
        mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale, scale, scale)
        nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
        c = hexc(color); br.inputs['Color1'].default_value = c
        br.inputs['Color2'].default_value = (c[0]*.78, c[1]*.74, c[2]*.72, 1)
        br.inputs['Mortar'].default_value = (min(1,c[0]*1.6+.25), min(1,c[1]*1.6+.22), min(1,c[2]*1.6+.2), 1)
        br.inputs['Scale'].default_value = 1.0; br.inputs['Mortar Size'].default_value = .012
        br.inputs['Brick Width'].default_value = .25; br.inputs['Row Height'].default_value = .075
        nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    if kind in ('noise', 'concrete', 'wood'):
        tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 8
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        c = hexc(color); mix.inputs[6].default_value = (c[0]*.82, c[1]*.82, c[2]*.82, 1); mix.inputs[7].default_value = c
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector']); nt.links.new(nz.outputs['Fac'], mix.inputs[0])
        nt.links.new(mix.outputs[2], b.inputs['Base Color'])
    return m

def add_box(bm, cx, cy, cz, sx, sy, sz, mi=0):
    """axis-aligned box centred at (cx,cy,cz) with full sizes"""
    r = bmesh.ops.create_cube(bm, size=1.0)
    vs = r['verts']
    for v in vs:
        v.co = Vector((cx + v.co.x*sx, cy + v.co.y*sy, cz + v.co.z*sz))
    for f in {f for v in vs for f in v.link_faces}:
        f.material_index = mi

def mesh_obj(name, bm, mats, coll, loc=(0,0,0), rot=0.):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new(name, me); coll.objects.link(o)
    o.location = loc; o.rotation_euler = (0, 0, rot)
    return o

def new_scene(name):
    s = bpy.data.scenes.get(name)
    if s:
        for o in list(s.objects): bpy.data.objects.remove(o, do_unlink=True)
    else:
        s = bpy.data.scenes.new(name)
    bpy.context.window.scene = s
    s.render.engine = 'BLENDER_EEVEE'
    s.render.resolution_x, s.render.resolution_y = 1600, 900
    s.render.resolution_percentage = 100
    s.render.image_settings.file_format = 'PNG'
    try: s.view_settings.view_transform = 'AgX'
    except TypeError: pass
    for lk in ('AgX - Punchy', 'Punchy'):
        try: s.view_settings.look = lk; break
        except TypeError: pass
    s.eevee.taa_render_samples = 64
    s.eevee.use_raytracing = True
    s.eevee.use_shadows = True
    return s

def world_sky(s, strength=1.0, sun_el=35, sun_rot=150):
    w = bpy.data.worlds.new(s.name + '_world'); s.world = w; w.use_nodes = True
    nt = w.node_tree; bg = next(n for n in nt.nodes if n.type == 'BACKGROUND')
    sky = nt.nodes.new('ShaderNodeTexSky')
    try: sky.sky_type = 'MULTIPLE_SCATTERING'
    except TypeError: pass
    try:
        sky.sun_elevation = math.radians(sun_el); sky.sun_rotation = math.radians(sun_rot)
    except Exception: pass
    nt.links.new(sky.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = strength * 1.1
    ld = bpy.data.lights.new('sun', 'SUN'); ld.energy = 4.0 * strength; ld.angle = math.radians(1.5)
    ld.color = (1, .96, .9)
    so = bpy.data.objects.new('sun', ld); s.collection.objects.link(so)
    so.rotation_euler = (math.radians(90 - sun_el), 0, math.radians(sun_rot + 90))
    return so

def building(coll, cx, cy, rot, W, D, F, st, color=None, seed=0):
    S = STYLES[st]; rnd = random.Random(seed)
    wallc = color or S['color']
    M = [mat('glass_'+st, S['glass'], .05, .1),
         mat('wall_'+(color or st), wallc, .85, kind='brick' if S['wall']=='brick' else 'noise', scale=1.0 if S['wall']=='brick' else 6),
         mat('frame_'+st, S['frame'], .45, .6),
         mat('band_'+st, S['band'] or S['frame'], .6),
         mat('podium_'+st, S['podium'], .55, kind='noise', scale=4),
         mat('cap_'+st, S['cap'], .5),
         mat('lower_'+st, S.get('lower', ('#333333', 0))[0], .85, kind='brick'),
         mat('shop_glass', '#2c3a44', .04, .2)]
    bm = bmesh.new()
    H = GH + (F-1)*FH
    t = .35          # facade depth
    # glass core
    add_box(bm, 0, 0, H/2, W-2*t+.02, D-2*t+.02, H, 0)
    # podium: solid corners, shop glazing
    add_box(bm, 0, 0, GH/2, W-2*t+.1, D-2*t+.1, GH, 7)
    glaze = S['glaze']
    bay = {'ribbon': 3.6, 'tall': 2.6, 'punched': 3.0, 'grid': 2.4, 'french': 2.2}[glaze]
    pier = {'ribbon': .45, 'tall': 1.0, 'punched': 1.4, 'grid': .55, 'french': .9}[glaze]
    sill = {'ribbon': .9, 'tall': .25, 'punched': .85, 'grid': .5, 'french': .1}[glaze]
    head = {'ribbon': .35, 'tall': .3, 'punched': .55, 'grid': .35, 'french': .35}[glaze]
    lowerF = S.get('lower', (None, 0))[1]
    for face in range(4):
        L = W if face % 2 == 0 else D
        n = max(2, round(L / bay)); b = L / n
        def put(u, z, su, sz, mi, out=0.0, dep=t):
            # u along facade from -L/2..L/2, face 0: -Y (front), 1:+X, 2:+Y, 3:-X
            off = (D/2 if face % 2 == 0 else W/2) - dep/2 + out
            if face == 0: add_box(bm, u, -off, z, su, dep, sz, mi)
            elif face == 2: add_box(bm, -u, off, z, su, dep, sz, mi)
            elif face == 1: add_box(bm, off, u, z, dep, su, sz, mi)
            else: add_box(bm, -off, -u, z, dep, su, sz, mi)
        # podium piers
        for i in range(n+1):
            put(-L/2 + i*b, GH/2, .6, GH, 4, .05)
        put(0, GH - .25, L, .5, 4, .06)
        # upper floors
        zb = GH
        for i in range(n+1):
            u = -L/2 + i*b
            pw = pier*1.6 if i in (0, n) else pier
            lo = max(0, min(F-1, lowerF-1))
            if lo: put(u, zb + lo*FH/2, pw, lo*FH, 6)
            put(u, zb + lo*FH + (F-1-lo)*FH/2, pw, (F-1-lo)*FH, 1)
        for k in range(F-1):
            z0 = zb + k*FH
            mi = 6 if (k < lowerF-1) else 1
            bandmi = 3 if S['band'] and glaze == 'tall' and k % 4 == 3 else mi
            put(0, z0 + sill/2, L, sill, mi)
            put(0, z0 + FH - head/2, L, head, bandmi)
            if glaze == 'ribbon': put(0, z0 + FH - .08, L, .16, 3, .03)
            # mullions + frames
            for i in range(n):
                u = -L/2 + (i+.5)*b
                put(u, z0 + FH/2, .06, FH, 2, -.12, .08)
            put(0, z0 + sill + .03, L, .06, 2, -.12, .08)
            # balconies / french balconies
            if glaze == 'ribbon' and face == 0 and k % 1 == 0:
                for i in range(n):
                    if (i + k) % 3 == 0:
                        u = -L/2 + (i+.5)*b
                        put(u, z0 + .08, b*.9, .16, 3, 1.25, 1.3)
                        put(u, z0 + .6, b*.9, 1.0, 0, 1.85, .04)
            if glaze == 'french':
                for i in range(n):
                    u = -L/2 + (i+.5)*b
                    put(u, z0 + .55, b - pier, .05, 2, .1, .04)
                    put(u, z0 + 1.0, b - pier, .05, 2, .1, .04)
            if glaze == 'tall' and face == 0 and k % 2 == 1:
                for i in range(1, n, 3):
                    u = -L/2 + (i+.5)*b
                    put(u, z0 + .08, b*1.8, .18, 3, 1.4, 1.5)
                    put(u, z0 + .6, b*1.8, 1.0, 0, 2.1, .04)
    # roof parapet + cap
    add_box(bm, 0, 0, H + .55, W + .1, D + .1, 1.1, 5)
    add_box(bm, 0, 0, H + 1.6, W*.3, D*.35, 2.2, 5)   # roof machine room
    # entrance canopies
    for i in (-1, 1):
        add_box(bm, i*W/4, -D/2 - 1.0, GH - .2, 3.5, 2.0, .2, 2)
    return mesh_obj('bld', bm, M, coll, (cx, cy, 0), rot)

def tree(bm, x, y, h, rnd, mi_trunk=0, mi_leaf=1):
    add_box(bm, x, y, h*.25, .25, .25, h*.5, mi_trunk)
    r = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=h*.32)
    sx = 1 + rnd.uniform(-.15, .15)
    for v in r['verts']:
        v.co = Vector((x + v.co.x*sx + rnd.uniform(-.25, .25), y + v.co.y*sx + rnd.uniform(-.25, .25), h*.66 + v.co.z*1.15 + rnd.uniform(-.2, .2)))
    for f in {f for v in r['verts'] for f in v.link_faces}:
        f.material_index = mi_leaf

def site(coll, key, seed=1):
    C = COMPLEXES[key]; rnd = random.Random(seed)
    xs = [b[0] for b in C['b']]; ys = [-b[1] for b in C['b']]
    cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    span = max(max(xs)-min(xs), max(ys)-min(ys)) + 160
    gspan = span + 900
    M = [mat('asphalt', '#3a3c3e', .9, kind='noise', scale=2), mat('grass', '#4b6a2a', .95, kind='noise', scale=.5),
         mat('paving', '#b9b2a6', .8, kind='noise', scale=3), mat('rubber', '#3f8f6a', .9), mat('curb', '#cfcac2', .7),
         mat('rubber2', '#d9783a', .9), mat('wood', '#8a6240', .6, kind='noise', scale=8)]
    bm = bmesh.new()
    add_box(bm, cx, cy, -.05, gspan, gspan, .1, 0)
    # sidewalks ring around each building
    for (x, z, r, w, d, f, s, c) in C['b']:
        ww, dd = (w, d) if abs(math.sin(r)) < .5 else (d, w)
        add_box(bm, x, -z, .04, ww + 8, dd + 8, .08, 2)
    tr = bmesh.new()
    for (x, z, w, d) in C['yards']:
        y = -z
        add_box(bm, x, y, .07, w, d, .14, 2)
        add_box(bm, x - w*.22, y, .09, w*.42, d*.7, .18, 1)
        add_box(bm, x + w*.22, y + d*.15, .09, w*.4, d*.38, .18, 1)
        # playground
        add_box(bm, x + w*.22, y - d*.22, .1, w*.32, d*.3, .2, 3)
        px, py = x + w*.22, y - d*.22
        for k in range(4):
            add_box(bm, px - 4 + k*2.6, py + rnd.uniform(-2, 2), 1.2, .7, .7, 2.4, 5 if k % 2 else 3)
        add_box(bm, px, py + 3, 2.4, 5, .25, .25, 6)
        for k in range(8):   # benches
            a = k/8*2*PI
            add_box(bm, x + math.cos(a)*w*.38, y + math.sin(a)*d*.38, .45, 1.8, .5, .45, 6)
        add_box(bm, x, y, .2, 4.5, d, .1, 2)
        for k in range(int(w*d/150)):
            tx = x + rnd.uniform(-w*.45, w*.45); ty = y + rnd.uniform(-d*.45, d*.45)
            if abs(tx - px) < w*.18 and abs(ty - py) < d*.18: continue
            if abs(tx - x) < 6: continue
            tree(tr, tx, ty, rnd.uniform(5, 9), rnd)
    # street trees
    for k in range(70):
        a = rnd.uniform(0, 2*PI); rr = span*.5*rnd.uniform(.62, .9)
        tree(tr, cx + math.cos(a)*rr, cy + math.sin(a)*rr, rnd.uniform(6, 11), rnd)
    mesh_obj('site', bm, M, coll)
    mesh_obj('trees', tr, [mat('bark', '#4a3a2c', .9), mat('leaf', '#3d5c22', .8, kind='noise', scale=2)], coll)
    return cx, cy, span

def build_complex(key):
    s = new_scene('DOGMA_' + key)
    coll = s.collection
    C = COMPLEXES[key]
    for i, (x, z, r, w, d, f, st, c) in enumerate(C['b']):
        building(coll, x, -z, r, w, d, f, st, c, seed=i)
    cx, cy, span = site(coll, key, seed=len(key))
    world_sky(s)
    return s, cx, cy

def cam(s, name, loc, target, lens=28):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_end = 3000
    co = bpy.data.objects.new(name, cd); s.collection.objects.link(co)
    co.location = loc
    d = Vector(target) - Vector(loc)
    co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    s.camera = co
    return co

def render(s, fname):
    import os
    os.makedirs(OUT, exist_ok=True)
    s.render.filepath = os.path.join(OUT, fname)
    bpy.ops.render.render(write_still=True, scene=s.name)
    return s.render.filepath

def shoot(key, pct=100, samples=48, yard_i=0, aer=(-.8, -1.25, .95), yard_look=(-8, 12, 14)):
    import os
    s, cx, cy = build_complex(key)
    C = COMPLEXES[key]
    xs = [b[0] for b in C['b']]; ext = max(xs) - min(xs) + 40
    k = ext / 160 * .62 + .18
    a = cam(s, 'cam_aerial', (cx + aer[0]*190*k, cy + aer[1]*190*k, aer[2]*180*k), (cx, cy, 12), 32)
    x, z, w, d = C['yards'][yard_i]; y = -z
    yc = cam(s, 'cam_yard', (x, y - d*.42, 1.65), (x + yard_look[0], y + d/2 + yard_look[1], yard_look[2]), 18)
    s.render.resolution_percentage = pct; s.eevee.taa_render_samples = samples
    out = []
    for c, nm in ((a, 'aerial'), (yc, 'yard')):
        s.camera = c
        s.render.filepath = os.path.join(OUT, f'{key}_{nm}.png')
        bpy.ops.render.render(write_still=True, scene=s.name)
        out.append(s.render.filepath)
    return out
