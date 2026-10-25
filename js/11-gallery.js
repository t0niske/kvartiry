/* =========================================================
   Фотореалистичные визуализации: секция на главной, фото отделок, лайтбокс
   Картинки: модель в Blender (tools/blender) + доводка нейросетью, WebP 800/1600 px
   ========================================================= */
const SHOTS = {aerial: 'Квартал с высоты', yard: 'Двор без машин', street: 'Вид с улицы'};
const ROOMS = {living: 'Кухня-гостиная', bed: 'Спальня', bath: 'Санузел', hall: 'Прихожая'};
const IMG = window.IMG_BASE || 'img/';   // в офлайн-файле dist/dogma.html — адрес GitHub Pages
const imgSrc = (dir, name, big) => IMG + dir + '/' + name + '-' + (big && !LITE ? 1600 : 800) + '.webp';
const imgSet = (dir, name) => LITE ? '' : ' srcset="' + IMG + dir + '/' + name + '-800.webp 800w, ' + IMG + dir + '/' + name + '-1600.webp 1600w"';
const complexShots = c => Object.keys(SHOTS).map(k => ({dir: 'renders', name: c.id + '_' + k, cap: 'ЖК «' + c.name + '» · ' + SHOTS[k]}));
const finishShots = f => Object.keys(ROOMS).map(k => ({dir: 'interior', name: f.id + '_' + k, cap: ROOMS[k] + ' · отделка «' + f.name + '»'}));

/* ---------- лайтбокс ---------- */
const LB = {tabs: [], tab: 0, i: 0};
function openLB(tabs, tab = 0, i = 0){
  Object.assign(LB, {tabs, tab, i});
  $('#lbTabs').innerHTML = tabs.length > 1 ? tabs.map((t, k) => '<button class="chip' + (k === tab ? ' on' : '') + '" data-t="' + k + '">' + t.label + '</button>').join('') : '';
  showLB(); openModal('lbM');
}
function showLB(){
  const items = LB.tabs[LB.tab].items; LB.i = (LB.i + items.length) % items.length;
  const it = items[LB.i], img = $('#lbImg');
  img.classList.add('ld'); img.onload = () => img.classList.remove('ld');
  img.src = imgSrc(it.dir, it.name, true); img.alt = it.cap;
  $('#lbCap').textContent = it.cap;
  $('#lbThumbs').innerHTML = items.map((x, k) => '<button class="' + (k === LB.i ? 'on' : '') + '" data-i="' + k + '"><img src="' + imgSrc(x.dir, x.name) + '" alt="" loading="lazy"></button>').join('');
  $$('#lbTabs .chip').forEach(b => b.classList.toggle('on', +b.dataset.t === LB.tab));
}
const lbStep = d => { LB.i += d; showLB() };

/* ---------- главная ---------- */
function galShow(i){
  const c = COMPLEXES[i];
  $$('#galTabs .chip').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  $('#gal').innerHTML = complexShots(c).map((s, k) => '<button class="gal-f' + (k === 0 ? ' big' : '') + '" data-k="' + k + '"><img src="' + imgSrc(s.dir, s.name) + '"' + imgSet(s.dir, s.name) +
    ' sizes="(max-width:1100px) 100vw, ' + (k === 0 ? '62vw' : '34vw') + '" alt="' + s.cap + '" loading="lazy"><span class="gal-cap">' + SHOTS[Object.keys(SHOTS)[k]] + '</span><span class="gal-z">⤢</span></button>').join('');
  $('#gal').dataset.i = i;
}
const complexTabs = () => COMPLEXES.map(c => ({label: c.name, items: complexShots(c)}));
const finishTabs = () => FINISHES.map(f => ({label: f.name, items: finishShots(f)}));

function initGallery(){
  $('#galTabs').innerHTML = COMPLEXES.map((c, i) => '<button class="chip' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' + c.name + '</button>').join('');
  $('#galTabs').onclick = e => { const b = e.target.closest('.chip'); if (b) galShow(+b.dataset.i) };
  $('#gal').onclick = e => { const b = e.target.closest('.gal-f'); if (b) openLB(complexTabs(), +$('#gal').dataset.i, +b.dataset.k) };
  galShow(0);
  // карточки отделок — фото кухни-гостиной
  $$('#fgrid .fc').forEach((el, i) => { const f = FINISHES[i], sw = el.querySelector('.fc-sw');
    sw.classList.add('photo'); sw.style.backgroundImage = 'url(' + imgSrc('interior', f.id + '_living') + ')';
    sw.innerHTML = '<span class="gal-z">⤢</span>'; sw.title = 'Смотреть фото: ' + f.name;
    sw.onclick = () => openLB(finishTabs(), i, 0) });
  // ЖК и квартира
  $('#cpRenders').onclick = () => openLB(complexTabs(), Math.max(0, COMPLEXES.indexOf(state.cs.c)));
  $('#finPhoto').onclick = () => openLB(finishTabs(), Math.max(0, FINISHES.findIndex(f => f.id === state.finish)));
  // лайтбокс
  $('#lbTabs').onclick = e => { const b = e.target.closest('.chip'); if (b){ LB.tab = +b.dataset.t; showLB() } };
  $('#lbThumbs').onclick = e => { const b = e.target.closest('button'); if (b){ LB.i = +b.dataset.i; showLB() } };
  $('#lbPrev').onclick = () => lbStep(-1); $('#lbNext').onclick = () => lbStep(1);
  addEventListener('keydown', e => { if ($('#lbM').classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') lbStep(-1); else if (e.key === 'ArrowRight') lbStep(1) });
  let sx = null; const st = $('#lbStage');
  st.addEventListener('touchstart', e => { sx = e.touches[0].clientX }, {passive: true});
  st.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) lbStep(dx < 0 ? 1 : -1) });
}
function updateFinPhoto(id){ const el = $('#finPhoto'); if (!el) return; const f = FIN[id];
  el.querySelector('i').style.backgroundImage = 'url(' + imgSrc('interior', id + '_living') + ')';
  el.querySelector('b').textContent = 'Фото: ' + f.name.toLowerCase() }
