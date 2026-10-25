# blender -b --factory-startup -P run.py -- <module> <outdir> <preview|final> [cam,cam] [extra]
import sys, os, time, importlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import bpy
argv = sys.argv[sys.argv.index('--') + 1:]
mod, out, mode = argv[0], argv[1], argv[2]
cams = argv[3].split(',') if len(argv) > 3 and argv[3] else None
extra = argv[4] if len(argv) > 4 else ''
os.makedirs(out, exist_ok=True)
t = time.time()
m = importlib.import_module(mod)
s = m.build(quick=(mode == 'preview'), **({'variant': extra} if extra else {}))
print('BUILD %.1fs' % (time.time() - t), sum(len(o.data.polygons) for o in s.objects if o.type == 'MESH'), 'faces', flush=True)
for o in list(bpy.data.scenes):
    if o != s: bpy.data.scenes.remove(o)
key = s.name.replace('DOGMA_', '')
if mode == 'preview':
    s.render.resolution_percentage = 50
    if s.render.engine == 'CYCLES': s.cycles.samples = 24
else:   # final: 1600×900 (the site serves 1600/800 px), interiors need more samples than exteriors
    s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = 1600, 900, 100
    s.cycles.samples = 150 if mod.startswith('apt') else 96
blend = os.path.join(out, key + ('_' + extra if extra else '') + '.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend, compress=True)
print('SAVED', blend, flush=True)
for c in [o for o in s.objects if o.type == 'CAMERA']:
    nm = c.name.replace('cam_', '')
    if cams and nm not in cams: continue
    s.camera = c
    s.render.filepath = os.path.join(out, '%s%s_%s.png' % (key, '_' + extra if extra else '', nm))
    t = time.time(); bpy.ops.render.render(write_still=True, scene=s.name)
    print('RENDER', nm, '%.1fs' % (time.time() - t), flush=True)
