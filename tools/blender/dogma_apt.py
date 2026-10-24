# ---------------- interiors (exec'd after dogma_lib.py) ----------------
CH = 2.85

def wall_with_openings(bm, axis, c, a0, a1, th, holes, mi):
    """wall along axis ('x' or 'y') at coordinate c, spanning a0..a1; holes: (h0, h1, z0, z1)"""
    def box(u0, u1, z0, z1):
        if u1 - u0 < 1e-3 or z1 - z0 < 1e-3: return
        if axis == 'x': add_box(bm, (u0+u1)/2, c, (z0+z1)/2, u1-u0, th, z1-z0, mi)
        else: add_box(bm, c, (u0+u1)/2, (z0+z1)/2, th, u1-u0, z1-z0, mi)
    u = a0
    for (h0, h1, z0, z1) in sorted(holes):
        box(u, h0, 0, CH); box(h0, h1, 0, z0); box(h0, h1, z1, CH); u = h1
    box(u, a1, 0, CH)

FINISH = {
  'rough': dict(wall=('#a9a7a2', 'concrete', 3), floor=('#8f8c86', 'concrete', 1.5), ceil=('#b5b3ae', 'concrete', 3), furn=False, lamp='bulb'),
  'dev':   dict(wall=('#ece9e3', 'noise', 40), floor=('#c9ab84', 'wood', 1.0), ceil=('#f6f5f2', None, 1), furn=False, lamp='plafond'),
  'turn':  dict(wall=('#e9e2d6', 'noise', 25), floor=('#a77a4d', 'herring', 1.0), ceil=('#f7f5f1', None, 1), furn=True, lamp='pendant'),
}

def herring_mat(name, color):
    m = bpy.data.materials.get(name)
    if m: return m
    m = mat(name, color, .45)
    nt = m.node_tree; b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (0, 0, math.radians(45))
    br = nt.nodes.new('ShaderNodeTexBrick'); br.offset = .5; br.offset_frequency = 1
    br.inputs['Scale'].default_value = 1; br.inputs['Brick Width'].default_value = .6; br.inputs['Row Height'].default_value = .1
    br.inputs['Mortar Size'].default_value = .002
    c = hexc(color); br.inputs['Color1'].default_value = c; br.inputs['Color2'].default_value = (c[0]*.8, c[1]*.78, c[2]*.75, 1)
    br.inputs['Mortar'].default_value = (c[0]*.5, c[1]*.5, c[2]*.5, 1)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    return m

def build_apartment(fin):
    F = FINISH[fin]
    s = new_scene('DOGMA_apt_' + fin)
    coll = s.collection
    W, D = 9.6, 7.0
    def surf(key):
        c, kind, sc = F[key]
        if kind == 'herring': return herring_mat('apt_%s_%s' % (fin, key), c)
        return mat('apt_%s_%s' % (fin, key), c, .9 if key != 'floor' else (.5 if fin != 'rough' else .85), kind=kind, scale=sc)
    M = [surf('wall'), surf('floor'), surf('ceil'), mat('pvc', '#f2f2f0', .35), mat('glass_win', '#dfe8ee', .02, 0, transm=1.0),
         mat('door_' + fin, '#d9d4cc' if fin != 'turn' else '#6b5a48', .5), mat('skirt', '#f1efea', .5), mat('radiator', '#f4f4f2', .4)]
    bm = bmesh.new()
    add_box(bm, W/2, D/2 - .5, -.05, W + 1, D + 1, .1, 1)
    add_box(bm, W/2, D/2, CH + .1, W + 1, D + 1, .2, 2)
    wins_kl = [(.7, 2.5), (2.9, 4.7)]; wins_bed = [(6.2, 8.4)]
    wall_with_openings(bm, 'x', D + .2, -.2, W + .2, .4, [(a, b, .45, 2.55) for a, b in wins_kl + wins_bed], 0)
    wall_with_openings(bm, 'x', -.06, -.2, W + .2, .12, [], 0)
    wall_with_openings(bm, 'y', -.06, -.2, D + .2, .12, [], 0)
    wall_with_openings(bm, 'y', W + .06, -.2, D + .2, .12, [], 0)
    wall_with_openings(bm, 'x', 2.6, 0, W, .12, [(1.2, 2.1, 0, 2.1), (6.5, 7.4, 0, 2.1)], 0)
    wall_with_openings(bm, 'y', 5.2, 2.6, D, .12, [(3.0, 3.9, 0, 2.1)], 0)
    for a, b in wins_kl + wins_bed:
        add_box(bm, (a+b)/2, D + .05, 1.5, b - a, .02, 2.1, 4)
        for x in (a, (a+b)/2, b): add_box(bm, x, D + .05, 1.5, .07, .1, 2.1, 3)
        for z in (.45, 2.55): add_box(bm, (a+b)/2, D + .05, z, b - a, .1, .07, 3)
        add_box(bm, (a+b)/2, D - .02, .44, b - a + .2, .3, .04, 3)
        add_box(bm, (a+b)/2, D - .12, .25, (b - a)*.7, .08, .4, 7)
    if fin != 'rough':
        add_box(bm, 5.2, 3.45, 1.05, .04, .9, 2.1, 5)
        for x0 in (1.65, 6.95): add_box(bm, x0, 2.6, 1.05, .9, .04, 2.1, 5)
        for (x, y, sx, sy) in ((W/2, D - .03, W, .02), (2.6, 2.67, 5.2, .02), (7.4, 2.67, 4.4, .02), (.03, 4.8, .02, 4.4), (W - .03, 4.8, .02, 4.4)):
            add_box(bm, x, y, .04, sx, sy, .08, 6)
    mesh_obj('apt_shell', bm, M, coll)
    fm = bmesh.new()
    FM = [mat('f_white', '#efece6', .35), mat('f_oak', '#a07a52', .5, kind='wood', scale=6), mat('f_sofa', '#8b8378', .9, kind='noise', scale=30),
          mat('f_black', '#222222', .4, .6), mat('f_stone', '#d8d4cc', .25, kind='noise', scale=8), mat('f_rug', '#c9bba4', 1.0, kind='noise', scale=60),
          mat('f_green', '#3f6a33', .7), mat('f_linen', '#e7e1d6', .9), mat('f_bed', '#9fa6a0', .9)]
    if F['furn']:
        add_box(fm, 1.95, 2.96, .45, 3.3, .6, .9, 0); add_box(fm, 1.95, 2.96, .915, 3.34, .64, .03, 4)
        add_box(fm, 1.95, 2.84, 1.95, 3.3, .35, .7, 0)
        add_box(fm, .3, 2.96, 1.1, .6, .6, 2.2, 1)
        add_box(fm, 1.6, 4.1, .45, 2.0, .9, .9, 1); add_box(fm, 1.6, 4.1, .915, 2.1, 1.0, .03, 4)
        for i in range(3):
            add_box(fm, .95 + i*.65, 4.75, .65, .4, .4, .05, 3); add_box(fm, .95 + i*.65, 4.75, .32, .05, .05, .64, 3)
        add_box(fm, 3.6, 5.6, .01, 2.2, 2.4, .02, 5)
        add_box(fm, 4.65, 5.6, .22, .95, 2.4, .44, 2); add_box(fm, 5.0, 5.6, .55, .25, 2.4, .5, 2)
        for dy in (-1.1, 1.1): add_box(fm, 4.65, 5.6 + dy, .33, .95, .2, .66, 2)
        add_box(fm, 3.5, 5.6, .2, .9, .9, .4, 1)
        add_box(fm, .07, 5.4, 1.3, .05, 1.7, .95, 3); add_box(fm, .25, 5.4, .25, .45, 2.2, .5, 1)
        add_box(fm, .6, 6.6, .3, .45, .45, .6, 6)
        r = bmesh.ops.create_icosphere(fm, subdivisions=2, radius=.45)
        for v in r['verts']: v.co += Vector((.6, 6.6, 1.05))
        for f in {f for v in r['verts'] for f in v.link_faces}: f.material_index = 6
        add_box(fm, W - 1.05, 4.9, .25, 2.0, 1.9, .5, 8); add_box(fm, W - 1.05, 4.9, .52, 1.95, 1.85, .06, 7)
        add_box(fm, W - .05, 4.9, .9, .08, 2.2, 1.0, 1)
        for dy in (-1.3, 1.3): add_box(fm, W - .3, 4.9 + dy, .25, .5, .45, .5, 1)
        add_box(fm, 8.4, 2.96, 1.2, 2.0, .6, 2.4, 0)
        add_box(fm, 7.6, 4.9, .01, 2.4, 2.6, .02, 5)
    if len(fm.verts): mesh_obj('apt_furn', fm, FM, coll)
    else: fm.free()
    lt = bmesh.new(); LM = [mat('lamp_' + fin, '#fff2dc', .3, emit=('#ffe7c2', 12)), mat('cord', '#202020', .5)]
    for (x, y) in ((2.6, 4.8), (7.4, 4.8)):
        if F['lamp'] == 'bulb':
            add_box(lt, x, y, CH - .25, .01, .01, .5, 1)
            r = bmesh.ops.create_icosphere(lt, subdivisions=2, radius=.05)
            for v in r['verts']: v.co += Vector((x, y, CH - .52))
        elif F['lamp'] == 'plafond':
            add_box(lt, x, y, CH - .03, .45, .45, .06, 0)
        else:
            if x < 5:
                for dx in (-.5, 0, .5):
                    add_box(lt, 1.6 + dx, 4.1, CH - .45, .01, .01, .9, 1); add_box(lt, 1.6 + dx, 4.1, CH - .95, .22, .22, .12, 0)
            for (lx, ly) in ((x-1.4, y-1.2), (x+1.4, y-1.2), (x-1.4, y+1.2), (x+1.4, y+1.2)):
                add_box(lt, lx, ly, CH - .01, .09, .09, .02, 0)
    mesh_obj('apt_lights', lt, LM, coll)
    for (x, y) in ((2.6, 4.8), (7.4, 4.8)):
        ld = bpy.data.lights.new('pt', 'POINT'); ld.energy = 60 if fin == 'rough' else 90; ld.color = (1, .88, .72); ld.shadow_soft_size = .3
        o = bpy.data.objects.new('pt', ld); coll.objects.link(o); o.location = (x, y, CH - .6)
    ex = bmesh.new(); EM = [mat('ext_ground', '#6c7a55', .95, kind='noise', scale=.05), mat('ext_bld', '#b9aa98', .8), mat('ext_bld2', '#8f5a45', .8)]
    add_box(ex, W/2, D + 300, -30, 900, 600, .2, 0)
    rnd = random.Random(3)
    for i in range(26):
        add_box(ex, rnd.uniform(-180, 190), D + rnd.uniform(70, 420), -30, rnd.uniform(15, 35), rnd.uniform(14, 22), rnd.uniform(40, 150), i % 2 + 1)
    mesh_obj('apt_exterior', ex, EM, coll)
    world_sky(s, 1.0, sun_el=28, sun_rot=200)
    sun = [o for o in s.objects if o.type == 'LIGHT' and o.data.type == 'SUN'][0]
    sun.rotation_euler = (math.radians(62), 0, math.radians(165))
    s.eevee.use_fast_gi = True
    return s

def shoot_apt(fin, pct=100, samples=64):
    import os
    s = build_apartment(fin)
    a = cam(s, 'cam_living', (5.0, 3.45, 1.55), (0.6, 5.9, 0.95), 15)
    b = cam(s, 'cam_bed', (5.55, 3.0, 1.5), (9.0, 6.4, 1.0), 15)
    s.render.resolution_percentage = pct; s.eevee.taa_render_samples = samples
    out = []
    for c, nm in ((a, 'living'), (b, 'bedroom')):
        s.camera = c
        s.render.filepath = os.path.join(OUT, f'apt_{fin}_{nm}.png')
        bpy.ops.render.render(write_still=True, scene=s.name)
        out.append(s.render.filepath)
    return out
