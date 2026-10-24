# Визуализации DOGMA: Blender + Codex

Как получены картинки в `img/renders` (фасады и дворы) и `img/interior` (отделки).

1. **Модели в Blender 5.2** (через Blender MCP или вставкой в консоль Python):
   - `dogma_lib.py` — корпуса всех ЖК по координатам и стилям из `js/01-config.js` (кирпич/штукатурка, ленточное/вертикальное/французское остекление, лоджии, подиумы с витринами, двор с дорожками, площадкой и деревьями). `shoot('rekord')` строит сцену `DOGMA_rekord` и рендерит `aerial` + `yard` (EEVEE, 1600×900).
   - `dogma_apt.py` (исполнять после `dogma_lib.py`) — евродвушка из планировки `TPL[2]`: кухня-гостиная и спальня, три отделки (`rough`, `dev`, `turn`). `shoot_apt('turn')` рендерит `living` + `bedroom` с одинаковых камер.
   - Перед запуском задайте `OUT_DIR` в глобальных переменных, например:
     ```python
     g = {'OUT_DIR': r'C:\work\renders\base'}
     exec(open('dogma_lib.py', encoding='utf8').read(), g); exec(open('dogma_apt.py', encoding='utf8').read(), g)
     g['shoot']('reed'); g['shoot_apt']('dev')
     ```
2. **Фотореализм через Codex** (подписка ChatGPT, без API-ключа): `codex_photoreal.ps1 -Key rekord_aerial` берёт базовый рендер из `renders\base` и с сохранением ракурса, этажности и ритма окон превращает его в фото (`renders\photo`). Промпты для всех 14 кадров — в этом же файле. `gen_codex.ps1` — копия скрипта скилла codex-image с исправлением для PowerShell 5.1 (codex пишет в stderr при `-i`).
3. **WebP для сайта**: `to_webp.py` в Blender — `convert(photo_dir, 'img/renders', 'img/interior')` сохраняет версии 1600 и 800 px. В режиме `?lite` сайт грузит только 800 px.

Картинки демонстрационные: геометрия повторяет упрощённую модель квартала, это не официальные рендеры застройщика.
