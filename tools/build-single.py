"""Собирает весь сайт в один офлайн-файл dist/dogma.html (удобно отправить клиенту файлом)."""
import pathlib, re
R = pathlib.Path(__file__).resolve().parent.parent
html = (R / 'index.html').read_text()
html = re.sub(r'<link rel="preload"[^>]*>\n', '', html)
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + (R / 'css/style.css').read_text() + '\n</style>')
def inline(m):
    return '<script>' + (R / m.group(1)).read_text().replace('</script', '<\\/script') + '</script>'
html = re.sub(r'<script src="([^"]+)" defer></script>', inline, html)
# визуализации (≈4 МБ WebP) не встраиваем — офлайн-файл берёт их с GitHub Pages
html = html.replace('</head>', '<script>window.IMG_BASE = "https://t0niske.github.io/kvartiry/img/"</script>\n</head>', 1)
out = R / 'dist'; out.mkdir(exist_ok=True); (out / 'dogma.html').write_text(html)
print('dist/dogma.html', len(html) // 1024, 'KB')
