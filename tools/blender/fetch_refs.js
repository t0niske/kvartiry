// Скачивает официальные визуализации и генпланы со страниц dogma.ru (сначала сохраните HTML страниц: record2.html, samolet7.html, reeds.html, park-pobedy3.html)
// node fetch_refs.js  →  папки record2/, samolet7/, reeds/, park-pobedy3/; затем refs_to_jpg.py в Blender кладёт JPG в refs/
const fs = require('fs'), https = require('https');
const want = {record2: ['Общий вид', 'Фасады', 'Благоустройство', 'Лобби'], samolet7: ['Общий вид', 'Фасады', 'Благоустройство'], reeds: ['Архитектура', 'Благоустройство'], 'park-pobedy3': ['Фасады', 'Благоустройство']};
const get = (u, f) => new Promise(r => https.get(u, {headers: {'User-Agent': 'Mozilla/5.0'}}, res => { if (res.statusCode !== 200){ res.resume(); return r(res.statusCode) } const w = fs.createWriteStream(f); res.pipe(w); w.on('finish', () => r(200)) }).on('error', e => r(e.message)));
(async () => {
  for (const p in want){
    const h = fs.readFileSync(p + '.html', 'utf8').replace(/\\"/g, '"'); let i = h.indexOf('"galleryData":'), s = h.indexOf('{', i), d = 0, j = s;
    for (; j < h.length; j++){ if (h[j] === '{') d++; else if (h[j] === '}'){ d--; if (!d) break } }
    const g = JSON.parse(h.slice(s, j + 1)); fs.mkdirSync(p, {recursive: true});
    for (const e of g.elements) if (want[p].includes(e.button_text)) { let n = 0;
      for (const im of e.images){ const f = p + '/' + e.button_text.replace(/ /g, '_') + '_' + (++n) + '.webp';
        const st = await get('https://storage.yandexcloud.net/t2v-storage/images/' + im.imageKey + '/w1200.webp', f);
        if (st !== 200){ const st2 = await get('https://storage.yandexcloud.net/t2v-storage/images/' + im.imageKey + '/w800.webp', f); console.log(f, 'w1200', st, 'w800', st2) } else console.log(f, 'ok') } } }
  const gp = {record2: 'Генплан%20Рекорд.jpg', samolet7: 'Генплан%20Самолет-бизнес12.jpg'};
  for (const p in gp) console.log('genplan', p, await get('https://minio-selectel.tap2v.com/dogma-public/Генпланы%2F' + gp[p], p + '/genplan.jpg'));
})();
