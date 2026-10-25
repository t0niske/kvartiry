# blender -b --factory-startup -P refs_to_jpg.py -- <папка со скачанными референсами> refs   (Codex принимает JPG/PNG, не WebP)
import bpy, os, sys
argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
pairs = [('record2/Фасады_1.webp', 'rekord_facade.jpg'), ('record2/Фасады_2.webp', 'rekord_yard.jpg'), ('record2/genplan.jpg', 'rekord_aerial.jpg'),
         ('samolet7/Фасады_3.webp', 'samolet_facade.jpg'), ('samolet7/Общий_вид_1.webp', 'samolet_street.jpg'), ('samolet7/genplan.jpg', 'samolet_aerial.jpg'),
         ('samolet7/Благоустройство_1.webp', 'samolet_yard.jpg'),
         ('reeds/Архитектура_5.webp', 'reeds_street.jpg'), ('reeds/genplan.jpg', 'reeds_aerial.jpg'), ('reeds/Благоустройство_1.webp', 'reeds_yard.jpg'),
         ('park-pobedy3/Фасады_1.webp', 'park3_street.jpg'), ('park-pobedy3/genplan.jpg', 'park3_aerial.jpg'), ('park-pobedy3/Благоустройство_1.webp', 'park3_yard.jpg'),
         ('park-pobedy3/Фасады_3.webp', 'park3_facade.jpg'), ('record2/Благоустройство_1.webp', 'rekord_yard2.jpg')]
s = bpy.context.scene; s.render.image_settings.file_format = 'JPEG'; s.render.image_settings.quality = 90
for a, b in pairs:
    p = os.path.join(src, a)
    if not os.path.exists(p): print('MISSING', a); continue
    im = bpy.data.images.load(p); w, h = im.size
    if w > 1600: im.scale(1600, int(h * 1600 / w))
    im.file_format = 'JPEG'; im.save(filepath=os.path.join(dst, b), quality=90); print('OK', b, im.size[:])
