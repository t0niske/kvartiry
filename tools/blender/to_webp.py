# Convert generated PNGs to WebP 1600/800 for the site (exec'd in Blender, needs SRC/DST_* in globals)
import bpy, os, glob

def convert(src_dir, dst_renders, dst_interior, names=None):
    done = []
    for p in sorted(glob.glob(os.path.join(src_dir, '*.png'))):
        name = os.path.splitext(os.path.basename(p))[0]
        if names and name not in names: continue
        if name.startswith('apt_'):
            dst, base = dst_interior, name[4:]
        else:
            dst, base = dst_renders, name
        os.makedirs(dst, exist_ok=True)
        for w in (1600, 800):
            im = bpy.data.images.load(p, check_existing=False)
            W, H = im.size
            h = round(H * w / W)
            im.scale(w, h)
            im.file_format = 'WEBP'
            out = os.path.join(dst, '%s-%d.webp' % (base, w))
            im.save(filepath=out, quality=74 if w == 1600 else 72)
            bpy.data.images.remove(im)
            done.append((os.path.basename(out), os.path.getsize(out) // 1024))
    return done
