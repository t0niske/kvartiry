/* ---------- приложение ---------- */
let renderer, camera, controls, clock;
const state = {mode: 'home', view: 'orbit', cview: '3d', homeIdx: 0, finish: 'turn', busy: true, hover: null, cs: null, as: null, apt: null, ret: null,
  filter: {rooms: -1, max: Infinity, floor: 2}, statusOn: true, tagsOn: true, sort: 'price', corp: 1, touring: false};
const CS = [], O = {};
let homeAngle = .6;
const corpWord = a => 'корпус ' + a.corp;

/* ===== общие переходы ===== */
function showScreen(id){
  ['home', 'complexUI', 'aptUI'].forEach(s => $('#' + s).classList.toggle('hidden', s !== id));
  if (id !== 'home') gsap.fromTo('#' + id + ' .pe:not(.hidden)', {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: .7, stagger: .05, ease: 'power3.out', clearProps: 'transform'});
}
function curtain(show, t = '', s = ''){
  const el = $('#curtain');
  if (show){ $('#curT').textContent = t; $('#curS').textContent = s;
    gsap.fromTo('#curT', {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: .7, delay: .1, ease: 'power3.out'});
    gsap.fromTo('.cur-line', {scaleX: 0}, {scaleX: 1, duration: .9, delay: .2, ease: 'power3.out'});
    return gsap.to(el, {autoAlpha: 1, duration: .55, ease: 'power2.inOut'}) }
  return gsap.to(el, {autoAlpha: 0, duration: .7, delay: .15, ease: 'power2.inOut'});
}
const fade = (o, d = .25) => gsap.to('#fade', {opacity: o, duration: d});
function homePose(cs, a){ const R = Math.max(cs.size, cs.maxH) * 1.05 + 40;
  return {pos: new THREE.Vector3(cs.center.x + Math.sin(a) * R, cs.maxH * .45 + R * .22, cs.center.z + Math.cos(a) * R), tgt: new THREE.Vector3(cs.center.x, cs.maxH * .35, cs.center.z)} }
function complexPose(cs){ const R = Math.max(cs.size, cs.maxH) * 1.18 + 40;
  return {pos: new THREE.Vector3(cs.center.x + R * .42, cs.maxH * .38 + R * .3, cs.center.z + R * .9), tgt: new THREE.Vector3(cs.center.x, cs.maxH * .3, cs.center.z)} }
function applyHomeOffset(){ camera.clearViewOffset(); if (innerWidth > 900) camera.setViewOffset(innerWidth, innerHeight, -innerWidth * .2, innerHeight * .04, innerWidth, innerHeight) }
function complexControls(cs){ Object.assign(controls, {minDistance: 14, maxDistance: Math.max(cs.size, cs.maxH) * 2.6 + 80, maxPolarAngle: 1.47, autoRotate: false}); $('#orbitBtn').classList.remove('on') }

/* ===== главная ===== */
function buildHome(){
  const free = cs => cs.apts.filter(a => a.status === 'free');
  $('#pgrid').innerHTML = CS.map((cs, i) => { const f = free(cs);
    return '<button class="pc" data-i="' + i + '"><div class="pc-img"><img src="' + (cs.c.photo || cs.thumb) + '" data-fb="' + i + '" alt="ЖК ' + cs.c.name + '"><span class="pc-tag">' + cs.c.cls + '</span></div>' +
      '<div class="pc-body"><div class="pc-name">' + cs.c.name + '</div><div class="pc-dist">' + cs.c.district + '</div>' +
      '<div class="pc-row"><div>Цена от<b>' + mln(Math.min(...f.map(a => a.price))) + '</b></div><div>В продаже<b>' + f.length + ' кв.</b></div><div>Заселение до<b>' + cs.c.deadline + '</b></div></div>' +
      '<div class="pc-go">→</div></div></button>' }).join('');
  $$('.pc-img img').forEach(img => img.onerror = () => { img.onerror = null; img.src = thumbOf(CS[+img.dataset.fb]) });
  $$('.pc').forEach(el => { el.onclick = () => goComplex(+el.dataset.i); el.onmouseenter = () => setHomeIdx(+el.dataset.i) });
  $('#heroPick').innerHTML = CS.map((cs, i) => '<button class="hp glass' + (i === 0 ? ' on' : '') + '" data-i="' + i + '"><i></i>' + cs.c.name + '</button>').join('');
  $$('.hp').forEach(el => { el.onclick = () => { if (+el.dataset.i === state.homeIdx) goComplex(state.homeIdx); else setHomeIdx(+el.dataset.i) } });
  const sw = {rough: TEX.concrete, dev: TEX.laminate, turn: TEX.herring};
  $('#fgrid').innerHTML = FINISHES.map(f => '<div class="fc' + (f.id === 'turn' ? ' hi' : '') + '"><div class="fc-sw" style="background-image:url(' + sw[f.id].image.toDataURL('image/jpeg', .7) + ')"></div>' +
    '<div class="fc-b">' + f.badge + '</div><h3>' + f.name + '</h3><p>' + f.desc + '</p><ul>' + f.inc.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
    '<div class="fc-p">' + (f.ppm ? '+ ' + fmt(f.ppm) + ' ' + CUR + '<small>за м²</small>' : 'Включено<small>в цену квартиры</small>') + '</div></div>').join('');
  $('#cSel').innerHTML = '<option value="">Любой жилой комплекс</option>' + CS.map(cs => '<option>ЖК «' + cs.c.name + '»</option>').join('');
  $('#cform').onsubmit = e => { e.preventDefault(); e.target.reset(); toast('Заявка сохранена (демо): форма никуда не отправляется') };
  const home = $('#home'); home.addEventListener('scroll', () => $('#hdr').classList.toggle('solid', home.scrollTop > 40));
  $('#mProg').innerHTML = MORT_PROGS.map((p, i) => '<button class="chip' + (i === 0 ? ' on' : '') + '" data-r="' + p.rate * 100 + '">' + p.name + ' · ' + String(p.rate * 100).replace('.', ',') + '%</button>').join('') + '<button class="chip" data-r="">Своя ставка</button>';
  $$('#mProg .chip').forEach(b => b.onclick = () => { $$('#mProg .chip').forEach(x => x.classList.toggle('on', x === b)); if (b.dataset.r){ $('#mRate').value = b.dataset.r; calc() } });
  const calc = () => { const p = +$('#mPrice').value, dp = +$('#mDown').value / 100, y = +$('#mYears').value, r = +$('#mRate').value / 100;
    const loan = p * (1 - dp), m = annuity(loan, r, y);
    $('#mPriceV').textContent = money(p); $('#mDownV').textContent = Math.round(dp * 100) + '% · ' + money(p * dp); $('#mYearsV').textContent = y + ' лет'; $('#mRateV').textContent = String(r * 100).replace('.', ',') + '%';
    O.mPay.set(money(m)); $('#mLoan').textContent = money(loan); $('#mDownS').textContent = money(p * dp); $('#mOver').textContent = money(m * y * 12 - loan) };
  ['mPrice', 'mDown', 'mYears'].forEach(id => $('#' + id).oninput = calc);
  $('#mRate').oninput = () => { $$('#mProg .chip').forEach(x => x.classList.toggle('on', !x.dataset.r)); calc() };
  calc();
}
function setHomeIdx(i){ if (i === state.homeIdx) return; $$('.hp').forEach(c => c.classList.toggle('on', +c.dataset.i === i));
  const cv = $('#c'); cv.style.opacity = 0; clearTimeout(cv._t); cv._t = setTimeout(() => { state.homeIdx = i; cv.style.opacity = 1 }, 330) }

/* ===== ЖК ===== */
const matchF = a => (state.filter.rooms < 0 || a.rooms === state.filter.rooms) && a.price <= state.filter.max && a.floor >= state.filter.floor;
function applyLooks(){ const cs = state.cs; if (!cs) return;
  const col = new THREE.Color();
  for (let i = 0; i < cs.instApt.length; i++){ const a = cs.apts[cs.instApt[i]], m = matchF(a);
    cs.aptMesh.setColorAt(i, !m ? ST_COL.dim : state.statusOn ? ST_COL[a.status] : a.glass);
    if (cs.night){ if (!m) col.set('#0d1118'); else if (state.statusOn) col.copy(ST_COL[a.status]).multiplyScalar(a.status === 'sold' ? .6 : 1.25); else col.copy(cs.glowBase[i]); cs.glow.setColorAt(i, col) } }
  cs.aptMesh.instanceColor.needsUpdate = true; if (cs.night) cs.glow.instanceColor.needsUpdate = true;
  if (state.cview === 'chess') renderChess() }
function highlight(a){ const cs = state.cs; if (!cs) return; if (!a){ cs.hl.visible = false; return }
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); a.m.decompose(p, q, s);
  cs.hl.position.copy(p); cs.hl.quaternion.copy(q); cs.hl.scale.set(s.x + .2, s.y + .2, .32); cs.hl.visible = true }
function fillComplexUI(){
  const cs = state.cs, c = cs.c, free = cs.apts.filter(a => a.status === 'free');
  $('#crumbC').textContent = 'ЖК «' + c.name + '»'; $('#cpClass').textContent = c.cls; $('#cpName').textContent = 'ЖК «' + c.name + '»'; $('#cpDist').textContent = c.district; $('#cpDead').textContent = c.deadline;
  O.free.set(String(free.length)); O.from.set(money(Math.min(...free.map(a => a.price))));
  $('#cpPeek').textContent = free.length + ' ' + plural(free.length, 'квартира', 'квартиры', 'квартир') + ' в продаже · от ' + mln(Math.min(...free.map(a => a.price))) + ' · потяните вверх';
  const types = [...new Set(cs.apts.map(a => a.rooms))].sort();
  $('#chips').innerHTML = [-1, ...types].map(r => '<button class="chip' + (r === state.filter.rooms ? ' on' : '') + '" data-r="' + r + '">' + (r < 0 ? 'Все' : r === 0 ? 'Студии' : r + '-комн.') + '<small>' + cs.apts.filter(a => a.status === 'free' && (r < 0 || a.rooms === r)).length + '</small></button>').join('');
  const prices = cs.apts.map(a => a.price), bud = $('#bud');
  bud.min = Math.floor(Math.min(...prices) / 1e5) * 1e5; bud.max = Math.ceil(Math.max(...prices) / 1e5) * 1e5; bud.step = 100000;
  if (!isFinite(state.filter.max)) bud.value = bud.max; $('#budV').textContent = isFinite(state.filter.max) ? mln(state.filter.max) : 'любой';
  const fl = $('#flMin'); fl.min = 2; fl.max = Math.max(...cs.corps.map(k => k.floors)); fl.step = 1; fl.value = state.filter.floor; $('#flV').textContent = state.filter.floor > 2 ? state.filter.floor : 'любой';
  $('#swStatus').classList.toggle('on', state.statusOn); $('#swNight').classList.toggle('on', !!cs.night); $('#swTags').classList.toggle('on', state.tagsOn);
  $('#tags').innerHTML = cs.tags.map(t => '<div class="tag"><b>' + t.name + (t.sub ? '<small>' + t.sub + '</small>' : '') + '</b></div>').join('');
  cs.tagEls = $$('#tags .tag');
  $('#corpChips').innerHTML = cs.corps.map(k => '<button class="chip' + (k.n === state.corp ? ' on' : '') + '" data-k="' + k.n + '">Корпус ' + k.n + '<small>' + cs.apts.filter(a => a.corp === k.n && a.status === 'free').length + '</small></button>').join('');
  renderList(); if (state.cview === 'chess') renderChess();
}
function renderList(){
  const cs = state.cs, key = state.sort;
  const list = cs.apts.filter(a => a.status !== 'sold' && matchF(a)).sort((a, b) => key === 'price' ? a.price - b.price : key === 'area' ? b.area - a.area : key === 'ppm' ? a.price / a.area - b.price / b.area : b.floor - a.floor);
  $('#listH').textContent = 'В продаже · ' + list.length;
  $('#alist').innerHTML = list.length ? list.slice(0, 150).map(a => '<button class="ai" data-i="' + a.i + '"><div class="ai-r ' + a.status + '">' + roomShort(a.rooms) + '</div><div><div class="ai-t">№ ' + a.num + ' · ' + sqm(a.area) + (isFav(a) ? ' <span style="color:#e05a4f">♥</span>' : '') + '</div><div class="ai-m">' + a.floor + ' этаж · ' + corpWord(a) + (a.status === 'booked' ? ' · бронь' : '') + '</div></div><div class="ai-p">' + mln(a.price) + '</div></button>').join('') +
    (list.length > 150 ? '<div class="ai-m" style="padding:10px">Показаны 150 из ' + list.length + '. Уточните фильтры.</div>' : '')
    : '<div class="ai-m" style="padding:14px 10px">Под эти фильтры квартир нет. Увеличьте бюджет или выберите другую комнатность.</div>';
}
function renderChess(){
  const cs = state.cs, k = cs.corps.find(x => x.n === state.corp) || cs.corps[0];
  $('#chessT').textContent = 'Корпус ' + k.n + ' · ' + k.floors + ' этажей';
  const grid = {}; cs.apts.forEach(a => { if (a.corp === k.n) grid[a.floor + ':' + a.col] = a });
  let h = '<div class="cg" style="grid-template-columns:34px repeat(' + k.cols + ',52px)">';
  for (let f = k.floors; f >= 2; f--){
    h += '<div class="fl">' + f + '</div>';
    for (let c = 0; c < k.cols; c++){ const a = grid[f + ':' + c];
      if (!a){ h += '<div></div>'; continue }
      h += '<button class="cell ' + a.status + (matchF(a) ? '' : ' dim') + (isFav(a) ? ' fav' : '') + '" data-i="' + a.i + '" title="№ ' + a.num + '">' + (a.status === 'sold' ? '—' : roomShort(a.rooms) + '<small>' + Math.round(a.area) + ' м²</small>') + '</button>' } }
  $('#chessB').innerHTML = h + '</div>';
}
function setCView(v){
  state.cview = v; $$('#cViews button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('#chess').classList.toggle('hidden', v !== 'chess'); $('#chint').classList.toggle('hidden', v === 'chess'); $('#complexUI').classList.toggle('chessOn', v === 'chess');
  if (v === 'chess'){ renderChess(); gsap.fromTo('#chess', {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: .5, ease: 'power3.out'}) }
}
function showTip(a, x, y){
  const tip = $('#tip'); if (!a){ tip.classList.remove('show'); return }
  const stx = {free: 'Свободна', booked: 'Бронь', sold: 'Продана'}[a.status], ins = insolation(Math.atan2(a.n.x, a.n.z));
  tip.innerHTML = '<div class="tt-top"><span class="tt-num">№ ' + a.num + '</span><span class="st ' + a.status + '">' + stx + '</span></div><div class="tt-title">' + roomWord(a.rooms) + ' · ' + sqm(a.area) + '</div><div class="tt-meta">' + a.floor + ' этаж · ' + corpWord(a) + ' · окна на ' + ins.side + '</div>' +
    (a.status === 'sold' ? '' : '<div class="tt-price">' + money(a.price) + '</div><div class="tt-hint">Нажмите, чтобы войти в 3D →</div>');
  tip.classList.add('show'); tip.style.left = Math.min(x + 20, innerWidth - 272) + 'px'; tip.style.top = Math.min(y + 20, innerHeight - tip.offsetHeight - 12) + 'px';
}
function setHover(a, e){ if (a && !matchF(a)) a = null; state.hover = a; highlight(a && a.status !== 'sold' ? a : null); $('#c').style.cursor = a ? 'pointer' : 'grab'; showTip(a, e ? e.clientX : 0, e ? e.clientY : 0) }

async function goComplex(i){
  if (state.busy) return; state.busy = true; const cs = CS[i];
  await curtain(true, 'ЖК «' + cs.c.name + '»', cs.c.cls + ' · ' + cs.c.district);
  state.cs = cs; state.mode = 'complex'; state.filter = {rooms: -1, max: Infinity, floor: 2}; state.corp = cs.corps[0].n; state.hover = null; cs.hl.visible = false;
  camera.clearViewOffset(); camera.fov = 45; camera.updateProjectionMatrix(); renderer.toneMappingExposure = cs.night ? 1.1 : 1;
  setCView('3d'); fillComplexUI(); applyLooks(); $('#cpanel').classList.toggle('min', isPhone()); showScreen('complexUI');
  const p = complexPose(cs); controls.target.copy(p.tgt); camera.position.copy(p.pos).sub(p.tgt).multiplyScalar(2.1).add(p.tgt); camera.position.y += 40; camera.lookAt(p.tgt);
  complexControls(cs); controls.enabled = false;
  curtain(false);
  await gsap.to(camera.position, {x: p.pos.x, y: p.pos.y, z: p.pos.z, duration: 2.4, ease: 'power3.inOut'});
  controls.enabled = true; state.busy = false;
}
async function goHome(){
  if (state.busy) return; state.busy = true; setHover(null);
  await curtain(true, BRAND, 'Все жилые комплексы');
  if (state.mode === 'apt'){ stopTour(); disposeApt(); state.apt = null }
  state.mode = 'home'; controls.enabled = false; controls.autoRotate = false; camera.fov = 40; camera.updateProjectionMatrix(); applyHomeOffset(); renderer.toneMappingExposure = 1;
  showScreen('home'); curtain(false); state.busy = false;
}
async function openApt(a){
  if (state.busy || a.status === 'sold') return; state.busy = true; controls.enabled = false; controls.autoRotate = false; showTip(null);
  if (state.cview === 'chess') setCView('3d');
  state.ret = {pos: camera.position.clone(), tgt: controls.target.clone()};
  highlight(a); const p = a.pos, n = a.n;
  const side = new THREE.Vector3(-n.z, 0, n.x).multiplyScalar(4);
  const tl = gsap.timeline();
  tl.to(controls.target, {x: p.x, y: p.y, z: p.z, duration: 1.4, ease: 'power2.inOut'}, 0)
    .to(camera.position, {x: p.x + n.x * 18 + side.x, y: p.y + 2.5, z: p.z + n.z * 18 + side.z, duration: 1.4, ease: 'power2.inOut'}, 0)
    .to(camera.position, {x: p.x + n.x * .6, y: p.y, z: p.z + n.z * .6, duration: .9, ease: 'power3.in'})
    .to(camera, {fov: 28, duration: .9, ease: 'power3.in', onUpdate: () => camera.updateProjectionMatrix()}, '<');
  await new Promise(r => tl.call(r, null, '-=.45'));
  await curtain(true, 'Квартира № ' + a.num, roomWord(a.rooms) + ' · ' + sqm(a.area) + ' · ' + a.floor + ' этаж');
  state.cs.hl.visible = false; enterApt(a);
}
async function jumpToApt(a){ // из подборки: в любой ЖК и квартиру
  if (state.busy) return; closeDrawer(); $$('.modal').forEach(m => m.classList.add('hidden'));
  state.busy = true; await curtain(true, 'Квартира № ' + a.num, 'ЖК «' + a.c.name + '» · ' + roomWord(a.rooms) + ' · ' + sqm(a.area));
  if (state.mode === 'apt'){ stopTour(); disposeApt() }
  const cs = CS.find(x => x.c === a.c); state.cs = cs; state.filter = {rooms: -1, max: Infinity, floor: 2}; state.corp = a.corp;
  const p = complexPose(cs); state.ret = {pos: p.pos.clone(), tgt: p.tgt.clone()};
  camera.clearViewOffset(); enterApt(a);
}
function enterApt(a){
  state.apt = a; const A = buildApartment(a); state.as = A; state.mode = 'apt'; state.view = 'orbit';
  $('#aptUI').classList.remove('plan', 'walking'); $('#apanel').classList.toggle('min', isPhone());
  $('#apKicker').textContent = 'ЖК «' + a.c.name + '» · ' + corpWord(a);
  $('#apTitle').textContent = a.rooms === 0 ? 'Квартира-студия' : roomWord(a.rooms) + ' квартира';
  $('#apMeta').textContent = '№ ' + a.num + ' · ' + sqm(a.area) + (a.status === 'booked' ? ' · сейчас в брони' : '');
  $('#crumbA').innerHTML = 'ЖК «' + a.c.name + '» / <b>Квартира № ' + a.num + '</b>';
  const corp = a.c && state.cs.corps.find(k => k.n === a.corp), ins = A.insol;
  $('#facts').innerHTML = [['Этаж', a.floor + ' из ' + (corp ? corp.floors : '')], ['Окна', 'на ' + ins.side], ['Солнце', ins.hours ? '≈ ' + Math.round(ins.hours) + ' ч в день' : 'рассеянное'],
    ['Потолки', '2,75 м'], ['Корпус', String(a.corp)], ['Ключи', 'до ' + a.c.deadline]].map(([k, v]) => '<div><small>' + k + '</small><b>' + v + '</b></div>').join('');
  $('#sunIns').textContent = ins.from ? 'Солнце в окнах ' + ins.from + '–' + ins.to : 'Окна на север: мягкий рассеянный свет';
  $('#sunR').value = A.hour; $('#sunT').textContent = hhmm(A.hour);
  $$('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === 'orbit'));
  $('#whud').classList.add('hidden'); $('#wview').classList.add('hidden'); $('#ahint').classList.remove('hidden'); $('#labels').classList.remove('hidden'); $('#sunbar').classList.remove('hidden');
  updateFavUI();
  const target = state.finish; setFinish('rough', false);
  showScreen('aptUI'); renderer.toneMappingExposure = .88;
  camera.fov = 42; aptOffset(); camera.updateProjectionMatrix(); const S = Math.max(A.W, A.D);
  controls.target.set(0, 0, 0); camera.position.set(0, S * 3.4, .01); camera.lookAt(0, 0, 0);
  Object.assign(controls, {minDistance: 4, maxDistance: 32, maxPolarAngle: 1.3, autoRotate: false});
  A.walls.scale.y = .001; curtain(false);
  gsap.to(camera.position, {x: S * .42, y: S * 1.22, z: S * 1.22, duration: 2.3, ease: 'power3.out', onComplete: () => { state.busy = false; controls.enabled = true }});
  gsap.to(A.walls.scale, {y: 1, duration: 1.5, delay: .45, ease: 'power3.out'});
  gsap.delayedCall(1.7, () => { if (state.as === A) setFinish(target) });
}
async function backToComplex(){
  if (state.busy) return; state.busy = true; controls.enabled = false; stopTour(); WALK.keys = {}; if (WALK.auto) WALK.auto.kill();
  await curtain(true, 'ЖК «' + state.cs.c.name + '»', 'Возвращаемся к дому');
  disposeApt(); state.mode = 'complex'; state.view = 'orbit'; state.apt = null; renderer.toneMappingExposure = state.cs.night ? 1.1 : 1;
  camera.clearViewOffset(); camera.fov = 45; camera.updateProjectionMatrix(); controls.target.copy(state.ret.tgt); camera.position.copy(state.ret.pos);
  complexControls(state.cs); setCView('3d'); fillComplexUI(); applyLooks(); showScreen('complexUI'); await curtain(false);
  controls.enabled = true; state.busy = false;
}
const hhmm = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round(h % 1 * 60)).padStart(2, '0');

/* ===== режимы просмотра квартиры ===== */
function startYaw(A){ // смотрим из прихожей в сторону главной комнаты
  const e = A.tp.entry, ds = A.doors.filter(d => d.a === e || d.b === e).map(d => ({d, r: A.rooms[d.a === e ? d.b : d.a]}));
  const best = ds.sort((p, q) => q.r.w * q.r.d - p.r.w * p.r.d)[0];
  return best ? yawTo(A.entry.x, A.entry.z, {x: best.d.x, z: best.d.z + .8}) : PI }
function aptOffset(){ camera.clearViewOffset(); if (innerWidth > 760 && state.mode === 'apt') camera.setViewOffset(innerWidth, innerHeight, 209, 0, innerWidth, innerHeight) }
const WIN = {dy: 0, dp: -.06, yaw0: 0, pos: new THREE.Vector3()};
async function setView(v){
  const A = state.as; if (state.busy || state.view === v || !A) return;
  if (state.touring && v !== 'walk') stopTour();
  state.busy = true; controls.enabled = false; const from = state.view;
  $$('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('#aptUI').classList.toggle('plan', v === 'top'); $('#aptUI').classList.toggle('walking', v === 'walk');
  const checkInside = () => { const p = camera.position, ins = p.y < WH - .1 && Math.abs(p.x) < A.W / 2 && Math.abs(p.z) < A.D / 2; if (ins !== !!A.inside) setInterior(A, ins) };
  if (from === 'window'){ await fade(1); $('#wview').classList.add('hidden'); state.view = 'orbit'; camera.fov = 42; camera.updateProjectionMatrix(); renderer.toneMappingExposure = .88;
    const S = Math.max(A.W, A.D); controls.target.set(0, 0, 0); camera.position.set(S * .42, S * 1.22, S * 1.22); camera.lookAt(0, 0, 0); $('#sunbar').classList.remove('hidden'); fade(0, .4) }
  if (v === 'window'){
    if (from === 'walk') setInterior(A, false);
    $('#labels').classList.add('hidden'); $('#ahint').classList.add('hidden'); $('#whud').classList.add('hidden'); $('#sunbar').classList.add('hidden');
    await fade(1);
    const a = state.apt, cs = state.cs; WIN.yaw0 = Math.atan2(-a.n.x, -a.n.z); WIN.dy = 0; WIN.dp = -.08;
    WIN.pos.copy(a.pos).addScaledVector(a.n, 1.8); WIN.pos.y += .15; cs.hl.visible = false;
    renderer.toneMappingExposure = cs.night ? 1.1 : 1; camera.fov = 62; camera.updateProjectionMatrix();
    const h = (a.floor - 1) * FH + PH - FH + 1.6;
    $('#wvCap').innerHTML = 'Вид из окна · <b>' + a.floor + ' этаж</b> · около <b>' + Math.round(h) + ' м</b> над землёй · окна на ' + A.insol.side + ' · тяните, чтобы осмотреться';
    $('#wview').classList.remove('hidden'); state.view = 'window'; fade(0, .5);
  } else if (v === 'walk'){
    $('#labels').classList.add('hidden'); $('#ahint').classList.add('hidden');
    const eye = new THREE.Vector3(A.entry.x, EYE, A.entry.z), sy = startYaw(A), look = eye.clone().add(new THREE.Vector3(-Math.sin(sy) * 2, -.05, -Math.cos(sy) * 2));
    const tl = gsap.timeline();
    tl.to(controls.target, {x: look.x, y: look.y, z: look.z, duration: 2.1, ease: 'power2.inOut'}, 0)
      .to(camera.position, {x: eye.x, y: eye.y, z: eye.z, duration: 2.1, ease: 'power2.inOut', onUpdate: checkInside}, 0)
      .to(camera, {fov: 66, duration: 2.1, ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix()}, 0);
    await tl;
    WALK.pos.set(eye.x, 0, eye.z); WALK.yaw = startYaw(A); WALK.pitch = -.02; setInterior(A, true); state.view = 'walk';
    $('#whint').innerHTML = isTouch ? '<b>Джойстик</b> — идти · <b>палец</b> — осмотреться · <b>двойной тап</b> — перейти' : '<b>W A S D</b> — идти · <b>мышь</b> — осмотреться · <b>двойной клик</b> — перейти · <b>Shift</b> — быстрее';
    $('#whud').classList.remove('hidden'); drawMini();
  } else {
    if (from === 'walk'){ WALK.keys = {}; if (WALK.auto) WALK.auto.kill(); WALK.auto = null; controls.target.copy(camera.position).add(new THREE.Vector3(-Math.sin(WALK.yaw), 0, -Math.cos(WALK.yaw)).multiplyScalar(2)) }
    state.view = v; $('#whud').classList.add('hidden');
    const S = Math.max(A.W, A.D), pos = v === 'top' ? new THREE.Vector3(0, S * 1.75, .01) : new THREE.Vector3(S * .42, S * 1.22, S * 1.22);
    const tl = gsap.timeline();
    tl.to(controls.target, {x: 0, y: 0, z: 0, duration: 1.7, ease: 'power2.inOut'}, 0)
      .to(camera.position, {x: pos.x, y: pos.y, z: pos.z, duration: 1.7, ease: 'power2.inOut', onUpdate: checkInside}, 0)
      .to(camera, {fov: 42, duration: 1.7, ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix()}, 0);
    await tl; setInterior(A, false);
    $('#labels').classList.remove('hidden'); $('#ahint').classList.remove('hidden'); controls.enabled = true;
  }
  state.busy = false;
}

/* ===== ипотека в карточке ===== */
function renderMort(){
  $('#mortProg').innerHTML = MORT_PROGS.map((p, i) => '<button class="chip' + (i === MORT.prog ? ' on' : '') + '" data-i="' + i + '">' + p.name + '<small>' + String(p.rate * 100).replace('.', ',') + '%</small></button>').join('');
  $('#dpV').textContent = Math.round(MORT.down * 100) + '%'; $('#dpR').value = Math.round(MORT.down * 100);
  $('#mortFine').textContent = MORT_PROGS[MORT.prog].name + ': ' + String(MORT.rate * 100).replace('.', ',') + '% на ' + MORT.years + ' лет, взнос ' + Math.round(MORT.down * 100) + '%. Ставки и цены примерные, не оферта.';
}

function openModal(id){ const m = $('#' + id); m.classList.remove('hidden'); gsap.fromTo('#' + id + ' .box', {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: .5, ease: 'power3.out'}) }
function openBooking(){ const a = state.apt, f = FIN[state.finish];
  $('#mTitle').textContent = 'Бронирование';
  $('#mText').textContent = 'ЖК «' + a.c.name + '», квартира № ' + a.num + ', ' + roomWord(a.rooms).toLowerCase() + ', ' + sqm(a.area) + ', ' + a.floor + ' этаж · ' + f.name + ' · итого ' + money(a.price + a.area * f.ppm) + '.';
  openModal('modal') }
function toggleFullscreen(){
  const d = document;
  if (!d.fullscreenElement){ (d.documentElement.requestFullscreen ? d.documentElement.requestFullscreen() : Promise.reject()).then(() => d.body.classList.add('fs')).catch(() => toast('Браузер не разрешил полноэкранный режим')) }
  else d.exitFullscreen().then(() => d.body.classList.remove('fs')).catch(() => {});
}

/* ===== цикл отрисовки ===== */
const vtmp = new THREE.Vector3();
function project(pos){ vtmp.copy(pos).project(camera); return {x: (vtmp.x * .5 + .5) * innerWidth, y: (-vtmp.y * .5 + .5) * innerHeight, ok: vtmp.z < 1} }
function loop(){
  requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (state.mode === 'home'){ if (!CS.length || $('#home').scrollTop > innerHeight * 1.05) return;
    homeAngle += dt * .045; const cs = CS[state.homeIdx], p = homePose(cs, homeAngle); camera.position.copy(p.pos); camera.lookAt(p.tgt); renderer.render(cs.scene, camera); return }
  if (state.mode === 'apt' && state.view === 'window'){
    camera.position.copy(WIN.pos); camera.rotation.set(WIN.dp, WIN.yaw0 + WIN.dy, 0, 'YXZ'); renderer.render(state.cs.scene, camera); return }
  if (state.mode === 'apt' && state.view === 'walk' && !state.busy) walkUpdate(dt);
  else if (state.busy || !controls.enabled) camera.lookAt(controls.target); else controls.update();
  if (state.mode === 'complex'){ const cs = state.cs; cs.hl.material.opacity = .4 + .25 * Math.sin(t * 5);
    if (cs.tagEls) cs.tags.forEach((tg, i) => { const el = cs.tagEls[i], p = project(tg.pos); el.style.transform = 'translate(-50%,-100%) translate(' + p.x + 'px,' + p.y + 'px)'; el.style.opacity = state.tagsOn && p.ok && state.cview === '3d' && !state.busy ? 1 : 0 });
    renderer.render(cs.scene, camera) }
  else if (state.mode === 'apt' && state.as){
    if (state.view !== 'walk') state.as.labels.forEach(l => { const p = project(l.pos); l.el.style.transform = 'translate(-50%,-50%) translate(' + p.x + 'px,' + p.y + 'px)'; l.el.style.opacity = p.ok ? 1 : 0 });
    renderer.render(state.as.scene, camera) }
}

/* ===== запуск ===== */
function fatal(msg, gpuHelp, reload){
  const l = $('#loader'); gsap ? gsap.set(l, {autoAlpha: 1}) : (l.style.opacity = 1, l.style.visibility = 'visible');
  $('#lText').innerHTML = '<div style="max-width:520px;line-height:1.6;font-size:14px;color:var(--text)">' + msg + '</div>' +
    (gpuHelp ? '<div style="max-width:540px;margin-top:14px;line-height:1.65;font-size:13px;text-align:left">1. Скопируйте в адресную строку Chrome <b style="color:var(--accent2)">chrome://restart</b> и нажмите Enter — Chrome полностью перезапустится (простое закрытие окон не помогает, если Chrome работает в фоне).<br>2. Откройте этот файл снова.<br>3. Если не помогло — откройте файл в Microsoft Edge или добавьте в конец адреса <b>?lite</b> для облегчённой графики.</div>' : '') +
    '<button class="btn" style="margin-top:20px" onclick="location.reload()">Обновить страницу</button>';
}
const tick = () => new Promise(r => setTimeout(r, 20));
const LITE = /lite/.test(location.search) || (() => { try { return localStorage.getItem('dogma.lite') === 'true' } catch (e){ return false } })();
function thumbOf(cs){ if (cs.thumb) return cs.thumb; try { const cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 2500), p = homePose(cs, .55);
  cam.position.copy(p.pos); cam.lookAt(p.tgt); renderer.render(cs.scene, cam); cs.thumb = renderer.domElement.toDataURL('image/jpeg', .8) } catch (e){} return cs.thumb }
async function init(){
  const canvas = $('#c'), prog = (p, t) => { $('#lBar').style.width = p + '%'; $('#lText').textContent = t };
  if (typeof THREE === 'undefined' || typeof gsap === 'undefined'){ fatal('Не загрузился 3D-движок. Обновите страницу (Ctrl+F5).'); return }
  const opts = LITE ? [{antialias: false}, {antialias: false, powerPreference: 'low-power'}] : [{antialias: true, powerPreference: 'high-performance'}, {antialias: true}, {antialias: false}];
  for (const o of opts){ try { renderer = new THREE.WebGLRenderer(Object.assign({canvas}, o)); break } catch (e){ console.warn('WebGL', o, e) } }
  if (!renderer){ fatal('Chrome сейчас блокирует 3D-графику (WebGL) — обычно после сбоя видеодрайвера.', true); return }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); store.set('lite', true); fatal('Видеокарта не справилась со сценой. Нажмите «Обновить» — сайт включит облегчённую графику.') });
  renderer.setPixelRatio(LITE ? 1 : Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  MAXANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (THREE.RectAreaLightUniformsLib) THREE.RectAreaLightUniformsLib.init();
  camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 2500);
  controls = new THREE.OrbitControls(camera, canvas); Object.assign(controls, {enableDamping: true, dampingFactor: .08, enablePan: false, enabled: false, rotateSpeed: .6, autoRotateSpeed: .5});
  clock = new THREE.Clock();
  prog(8, 'Материалы'); await tick(); makeTextures(); initMaterials();
  prog(18, 'Освещение'); await tick(); makeEnvs();
  ['apt', 'fin', 'total', 'month', 'm2', 'free', 'from'].forEach(k => O[k] = new Odo($('#o' + k[0].toUpperCase() + k.slice(1))));
  O.hs = new Odo($('#hsF')); O.mPay = new Odo($('#mPay'));
  for (let i = 0; i < COMPLEXES.length; i++){
    prog(22 + i * 18, 'ЖК «' + COMPLEXES[i].name + '»'); await tick();
    const cs = buildComplex(COMPLEXES[i]); CS.push(cs);
    camera.aspect = innerWidth / innerHeight; camera.clearViewOffset(); camera.fov = 40; camera.updateProjectionMatrix();
    cs.thumb = '';
  }
  applyHomeOffset(); prog(100, 'Готово');
  loadFavs();

  buildHome();
  $('#finishes').innerHTML = FINISHES.map(f => '<button class="fin" data-f="' + f.id + '"><div class="fin-top"><span class="fin-name">' + f.name + '</span><span class="fin-badge">' + f.badge + '</span></div>' +
    '<div class="fin-more"><div class="fin-desc">' + f.desc + '</div><ul>' + f.inc.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
    '<div class="fin-price">' + (f.ppm ? '+ ' + fmt(f.ppm) + ' ' + CUR + '/м² · ' + f.term : 'Включено в стоимость') + '</div></button>').join('');
  $('#finishes').onclick = e => { const b = e.target.closest('.fin'); if (b && b.dataset.f !== state.finish) setFinish(b.dataset.f) };
  renderMort();
  $('#mortProg').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; MORT.prog = +b.dataset.i; MORT.rate = MORT_PROGS[MORT.prog].rate; renderMort(); updatePrices() };
  $('#dpR').oninput = e => { MORT.down = +e.target.value / 100; $('#dpV').textContent = e.target.value + '%'; renderMort(); updatePrices() };
  // ЖК: фильтры
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; state.filter.rooms = +b.dataset.r; $$('#chips .chip').forEach(c => c.classList.toggle('on', c === b)); applyLooks(); renderList() };
  $('#bud').oninput = e => { const v = +e.target.value; state.filter.max = v >= +e.target.max ? Infinity : v; $('#budV').textContent = isFinite(state.filter.max) ? mln(v) : 'любой'; applyLooks(); renderList() };
  $('#flMin').oninput = e => { state.filter.floor = +e.target.value; $('#flV').textContent = state.filter.floor > 2 ? state.filter.floor : 'любой'; applyLooks(); renderList() };
  $('#swNight').onclick = () => { const on = !state.cs.night; setNight(state.cs, on); $('#swNight').classList.toggle('on', on); applyLooks() };
  $('#swStatus').onclick = () => { state.statusOn = !state.statusOn; $('#swStatus').classList.toggle('on', state.statusOn); applyLooks() };
  $('#swTags').onclick = () => { state.tagsOn = !state.tagsOn; $('#swTags').classList.toggle('on', state.tagsOn) };
  $('#sort').onchange = e => { state.sort = e.target.value; renderList() };
  $('#alist').onclick = e => { const b = e.target.closest('.ai'); if (b) openApt(state.cs.apts[+b.dataset.i]) };
  $('#alist').onmouseover = e => { const b = e.target.closest('.ai'); if (b && !state.busy) highlight(state.cs.apts[+b.dataset.i]) };
  $('#alist').onmouseleave = () => { if (!state.busy) highlight(null) };
  $('#cViews').onclick = e => { const b = e.target.closest('button'); if (b) setCView(b.dataset.v) };
  $('#corpChips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; state.corp = +b.dataset.k; $$('#corpChips .chip').forEach(c => c.classList.toggle('on', c === b)); renderChess() };
  $('#chessB').onclick = e => { const b = e.target.closest('.cell'); if (!b) return; const a = state.cs.apts[+b.dataset.i]; if (a.status === 'sold'){ toast('Квартира № ' + a.num + ' продана'); return } openApt(a) };
  $('#chessB').onmouseover = e => { const b = e.target.closest('.cell'); if (!b){ showTip(null); return } const a = state.cs.apts[+b.dataset.i]; const r = b.getBoundingClientRect(); showTip(a, r.right - 10, r.top - 10) };
  $('#chessB').onmouseleave = () => showTip(null);
  $('#orbitBtn').onclick = () => { controls.autoRotate = !controls.autoRotate; $('#orbitBtn').classList.toggle('on', controls.autoRotate) };
  $('#toHome').onclick = goHome; $('#toComplex').onclick = backToComplex;
  // квартира
  $('#views').onclick = e => { const b = e.target.closest('button'); if (b) setView(b.dataset.v) };
  $('#sunR').oninput = e => { const h = +e.target.value; $('#sunT').textContent = hhmm(h); if (state.as) setSun(state.as, h) };
  $('#tourBtn').onclick = () => state.touring ? stopTour() : startTour();
  $('#tcX').onclick = stopTour;
  $('#bookBtn').onclick = openBooking; $('#kpBtn').onclick = openKP; $('#aptFav').onclick = () => toggleFav(state.apt);
  $('#cmpBtn').onclick = () => { if (!isFav(state.apt)) toggleFav(state.apt); openCompare() };
  $('#mForm').onsubmit = e => { e.preventDefault(); $('#modal').classList.add('hidden'); e.target.reset(); toast('Бронь записана (демо): подключите отправку в CRM') };
  initSheets();
  // общие
  $$('.favBtn').forEach(b => b.onclick = openDrawer); $$('.fsBtn').forEach(b => b.onclick = toggleFullscreen);
  document.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target.classList.contains('modal')) e.target.closest('.modal').classList.add('hidden') });
  initFavUI(); initKP();

  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const pick = e => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObject(state.cs.aptMesh, false); for (const h of hits){ const a = state.cs.apts[state.cs.instApt[h.instanceId]]; if (a && matchF(a)) return a } return null };
  let down = null;
  canvas.addEventListener('pointermove', e => {
    if (state.mode === 'complex' && !state.busy && state.cview === '3d' && !(down && e.buttons)) setHover(pick(e), e);
    if (state.mode === 'apt' && state.view === 'window' && down && e.buttons){ WIN.dy = clamp(WIN.dy + (e.clientX - down.lx) * .004, -1.3, 1.3); WIN.dp = clamp(WIN.dp + (e.clientY - down.ly) * .004, -.7, .5); down.lx = e.clientX; down.ly = e.clientY }
  });
  canvas.addEventListener('pointerdown', e => { down = {x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY}; if (state.mode === 'complex' && controls.autoRotate){ controls.autoRotate = false; $('#orbitBtn').classList.remove('on') } });
  canvas.addEventListener('pointerup', e => { if (!down) return; const mv = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (mv > 6 || state.mode !== 'complex' || state.busy) return; const a = pick(e); if (!a) return; setHover(a, e);
    if (a.status === 'sold'){ toast('Квартира № ' + a.num + ' уже продана'); return } openApt(a) });
  initWalkInput();
  addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey){ toggleFullscreen(); return }
    if (e.key !== 'Escape') return;
    const open = $$('.modal').find(m => !m.classList.contains('hidden')); if (open){ open.classList.add('hidden'); return }
    if (!$('#drawer').classList.contains('hidden')){ closeDrawer(); return }
    if (state.touring){ stopTour(); return }
    if (state.mode === 'apt'){ if (state.view !== 'orbit') setView('orbit'); else backToComplex() }
    else if (state.mode === 'complex'){ if (state.cview === 'chess') setCView('3d'); else goHome() } });
  document.addEventListener('fullscreenchange', () => document.body.classList.toggle('fs', !!document.fullscreenElement));
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; if (state.mode === 'home') applyHomeOffset(); else if (state.mode === 'apt') aptOffset(); else camera.clearViewOffset(); camera.updateProjectionMatrix() });

  loop();
  const totalFree = CS.reduce((s, cs) => s + cs.apts.filter(a => a.status === 'free').length, 0);
  $('#hsC').textContent = CS.length;
  gsap.to('#loader', {autoAlpha: 0, duration: .8, delay: .1, onComplete: () => { state.busy = false }});
  gsap.fromTo('.hero-in>*', {y: 34, opacity: 0}, {y: 0, opacity: 1, duration: 1, stagger: .1, delay: .3, ease: 'power3.out'});
  gsap.fromTo('.hp', {x: 30, opacity: 0}, {x: 0, opacity: 1, duration: .8, stagger: .08, delay: .7, ease: 'power3.out'});
  setTimeout(() => O.hs.set(String(totalFree)), 700);
  window.__app = {state, CS, setView, openApt, jumpToApt, startTour, goComplex, setCView, openKP, openCompare};
}
document.addEventListener('DOMContentLoaded', () => init().catch(e => { console.error(e); $('#lText').textContent = 'Ошибка загрузки: ' + e.message }));
