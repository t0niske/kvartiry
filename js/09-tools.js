/* ---------- инструменты менеджера: подборка, сравнение, экскурсия, КП ---------- */
let FAV = [];
const favKey = a => a.c.id + ':' + a.num;
const store = {get(k, d){ try { const v = localStorage.getItem('dogma.' + k); return v ? JSON.parse(v) : d } catch (e){ return d } },
  set(k, v){ try { localStorage.setItem('dogma.' + k, JSON.stringify(v)) } catch (e){} }};
function aptByKey(cid, num){ const cs = CS.find(x => x.c.id === cid); return cs && cs.apts.find(a => a.num === num) }
function loadFavs(){ FAV = store.get('favs', []).filter(f => aptByKey(f.cid, f.num)) }
const isFav = a => !!a && FAV.some(f => f.cid === a.c.id && f.num === a.num);
function toggleFav(a){
  if (!a) return; const i = FAV.findIndex(f => f.cid === a.c.id && f.num === a.num);
  if (i >= 0){ FAV.splice(i, 1); toast('Убрано из подборки') }
  else { FAV.push({cid: a.c.id, num: a.num, fin: state.apt === a ? state.finish : 'turn', cmp: true}); toast('Добавлено в подборку · ' + FAV.length) }
  store.set('favs', FAV); updateFavUI();
}
function syncFavFinish(){ const a = state.apt; if (!a) return; const f = FAV.find(x => x.cid === a.c.id && x.num === a.num); if (f && f.fin !== state.finish){ f.fin = state.finish; store.set('favs', FAV) } }
function updateFavUI(){
  $$('.favN').forEach(el => el.textContent = FAV.length || '');
  const h = $('#aptFav'); if (h && state.apt){ const on = isFav(state.apt); h.classList.toggle('on', on); h.title = on ? 'Убрать из подборки' : 'Добавить в подборку' }
  if (state.mode === 'complex'){ renderList(); if (state.cview === 'chess') renderChess() }
  if (!$('#drawer').classList.contains('hidden')) renderDrawer();
}
function favRow(f){ const a = aptByKey(f.cid, f.num), fin = FIN[f.fin] || FIN.turn, tot = a.price + a.area * fin.ppm, ins = insolation(Math.atan2(a.n.x, a.n.z));
  return {a, fin, tot, ins, month: monthlyFor(tot)} }
function renderDrawer(){
  $('#drT').textContent = FAV.length ? FAV.length + ' ' + plural(FAV.length, 'квартира', 'квартиры', 'квартир') : 'Пока пусто';
  $('#drL').innerHTML = FAV.length ? FAV.map((f, i) => { const r = favRow(f), a = r.a;
    return '<div class="fv"><div><div class="fv-t">' + (a.rooms === 0 ? 'Студия' : roomWord(a.rooms)) + ' · ' + sqm(a.area) + '</div><div class="fv-m">ЖК «' + a.c.name + '» · ' + corpWord(a) + ' · ' + a.floor + ' этаж · № ' + a.num + '<br>' + r.fin.name + ' · окна на ' + r.ins.side + '</div><div class="fv-p">' + money(r.tot) + '</div></div>' +
      '<div class="fv-a"><button data-open="' + i + '">Открыть</button><button data-del="' + i + '">Убрать</button></div>' +
      '<label><input type="checkbox" data-cmp="' + i + '"' + (f.cmp !== false ? ' checked' : '') + '> В сравнение</label></div>' }).join('')
    : '<div class="dr-empty">Нажмите ♥ в карточке квартиры, чтобы собрать подборку для клиента. Подборку можно сравнить в таблице и скопировать текстом в мессенджер.</div>';
  $('#drCmp').disabled = FAV.length < 2; $('#drCmp').style.opacity = FAV.length < 2 ? .5 : 1;
}
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c };
function openDrawer(){ renderDrawer(); $('#drawer').classList.remove('hidden'); gsap.fromTo('#drawer', {x: 40, opacity: 0}, {x: 0, opacity: 1, duration: .45, ease: 'power3.out'}) }
function closeDrawer(){ $('#drawer').classList.add('hidden') }
function copyText(t){
  const fb = () => { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = 0; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy') } catch (e){} ta.remove(); toast(ok ? 'Текст скопирован' : 'Не удалось скопировать: выделите текст вручную') };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => toast('Текст скопирован'), fb); else fb();
}
function favText(){
  const mgr = store.get('mgr', {}), lines = ['Подборка квартир ' + BRAND, ''];
  FAV.forEach((f, i) => { const r = favRow(f), a = r.a;
    lines.push((i + 1) + '. ЖК «' + a.c.name + '», ' + (a.rooms === 0 ? 'студия' : roomWord(a.rooms).toLowerCase()) + ', ' + sqm(a.area) + ', ' + a.floor + ' этаж, окна на ' + r.ins.side);
    lines.push('   ' + r.fin.name + ': итого ' + money(r.tot) + ' · ипотека от ' + money(r.month) + '/мес'); });
  lines.push('', 'Цены предварительные, ставки ипотеки примерные.'); if (mgr.name || mgr.tel) lines.push((mgr.name || 'Менеджер') + (mgr.tel ? ', ' + mgr.tel : ''));
  return lines.join('\n');
}
function openCompare(){
  const rows = FAV.filter(f => f.cmp !== false).slice(0, 5).map(favRow);
  if (rows.length < 2){ toast('Добавьте в подборку хотя бы две квартиры'); openDrawer(); return }
  const best = (vals, mode) => { const v = mode === 'min' ? Math.min(...vals) : Math.max(...vals); return vals.map(x => x === v) };
  const R = [
    ['ЖК', r => 'ЖК «' + r.a.c.name + '»'], ['Корпус · этаж', r => r.a.corp + ' · ' + r.a.floor + ' этаж'], ['Комнат', r => r.a.rooms === 0 ? 'Студия' : r.a.rooms],
    ['Площадь', r => sqm(r.a.area), r => r.a.area, 'max'], ['Окна', r => 'на ' + r.ins.side], ['Прямое солнце', r => r.ins.hours ? '≈ ' + Math.round(r.ins.hours) + ' ч' : 'нет', r => r.ins.hours, 'max'],
    ['Цена квартиры', r => money(r.a.price), r => r.a.price, 'min'], ['Отделка', r => r.fin.name], ['Итого', r => money(r.tot), r => r.tot, 'min'],
    ['За м²', r => money(r.tot / r.a.area), r => r.tot / r.a.area, 'min'], ['Платёж в месяц', r => money(r.month), r => r.month, 'min'], ['Ключи', r => 'до ' + r.a.c.deadline]];
  let h = '<thead><tr><th></th>' + rows.map(r => '<th>№ ' + r.a.num + '</th>').join('') + '</tr></thead><tbody>';
  R.forEach(([name, fmtF, val, mode]) => { const b = val ? best(rows.map(val), mode) : rows.map(() => false);
    h += '<tr><th>' + name + '</th>' + rows.map((r, i) => '<td' + (b[i] && rows.length > 1 ? ' class="best"' : '') + '>' + fmtF(r) + '</td>').join('') + '</tr>' });
  h += '<tr><th></th>' + rows.map(r => '<td><button data-go="' + r.a.c.id + ':' + r.a.num + '">Открыть в 3D</button></td>').join('') + '</tr></tbody>';
  $('#cmpT').innerHTML = h; closeDrawer(); openModal('cmpM');
}
function initFavUI(){
  $('#drX').onclick = closeDrawer;
  $('#drL').onclick = e => { const o = e.target.closest('[data-open]'), d = e.target.closest('[data-del]');
    if (o){ const f = FAV[+o.dataset.open]; jumpToApt(aptByKey(f.cid, f.num)) }
    if (d){ FAV.splice(+d.dataset.del, 1); store.set('favs', FAV); updateFavUI() } };
  $('#drL').onchange = e => { const c = e.target.closest('[data-cmp]'); if (c){ FAV[+c.dataset.cmp].cmp = c.checked; store.set('favs', FAV) } };
  $('#drCmp').onclick = openCompare; $('#drCopy').onclick = () => FAV.length ? copyText(favText()) : toast('Подборка пуста');
  $('#drClear').onclick = () => { if (!FAV.length) return; if ($('#drClear').dataset.sure){ FAV = []; store.set('favs', FAV); updateFavUI(); $('#drClear').textContent = 'Очистить'; delete $('#drClear').dataset.sure }
    else { $('#drClear').dataset.sure = 1; $('#drClear').textContent = 'Нажмите ещё раз, чтобы очистить'; setTimeout(() => { delete $('#drClear').dataset.sure; $('#drClear').textContent = 'Очистить' }, 3000) } };
  $('#cmpT').onclick = e => { const b = e.target.closest('[data-go]'); if (!b) return; const [cid, num] = b.dataset.go.split(':'); jumpToApt(aptByKey(cid, +num)) };
  updateFavUI();
}

/* ===== экскурсия по квартире ===== */
function buildTour(A){
  const R = A.rooms, adj = R.map(() => []);
  A.doors.forEach(d => { adj[d.a].push({to: d.b, d}); adj[d.b].push({to: d.a, d}) });
  const rank = t => ({kitchen: 0, studio: 0, bedroom: 1, kids: 2, bath: 3, laundry: 5, storage: 4, hall: 6})[t] ?? 3;
  adj.forEach(l => l.sort((p, q) => rank(R[p.to].t) - rank(R[q.to].t)));
  const ctr = r => ({x: r.x + r.w / 2 - A.W / 2, z: r.z + r.d / 2 - A.D / 2});
  const front = r => Math.abs(r.z + r.d - A.D) < .05;
  const steps = [], seen = new Set();
  const small = r => r.t === 'laundry' || r.t === 'storage' && r.w * r.d < 6;
  const visit = (i, from) => { seen.add(i); const r = R[i], c = ctr(r), k = r.t === 'bath' ? Math.min(.45, .7 / Math.hypot(c.x - from.x, c.z - from.z)) : .72, s = {x: from.x + (c.x - from.x) * k, z: from.z + (c.z - from.z) * k};
    const look = front(r) ? {x: c.x, z: r.z + r.d - A.D / 2 + 2} : {x: c.x + (c.x - from.x), z: c.z + (c.z - from.z)};
    steps.push({type: 'room', r, x: s.x, z: s.z, look});
    for (const {to, d} of adj[i]) if (!seen.has(to) && !small(R[to])){ steps.push({type: 'move', x: d.x, z: d.z}); visit(to, d); steps.push({type: 'move', x: d.x, z: d.z}) } };
  visit(A.tp.entry, {x: A.entry.x, z: A.entry.z - .6});
  while (steps.length && steps[steps.length - 1].type === 'move') steps.pop();
  return steps;
}
const yawTo = (x, z, t) => Math.atan2(-(t.x - x), -(t.z - z));
const shortest = (from, to) => { let d = (to - from) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return from + d };
async function startTour(){
  const A = state.as; if (!A || state.busy || state.touring) return;
  if (state.view !== 'walk') await setView('walk');
  if (state.view !== 'walk' || state.as !== A) return;
  state.touring = true; WALK.keys = {};
  $('#tourBtn').classList.add('on'); $('#tourBtn').innerHTML = '■<span>Стоп</span>';
  $('#tourcap').classList.remove('hidden'); $('#whint').classList.add('hidden');
  const steps = buildTour(A), total = steps.filter(s => s.type === 'room').length; let k = 0;
  let px = WALK.pos.x, pz = WALK.pos.z, yaw = WALK.yaw;
  const tl = gsap.timeline({onComplete(){ gsap.delayedCall(1.5, () => { if (WALK.auto === tl) stopTour() }) }});
  WALK.auto = tl;
  const cap = (t, s, kk, p) => { $('#tcT').textContent = t; $('#tcS').textContent = s; $('#tcK').textContent = kk; gsap.to('#tcBar', {width: p * 100 + '%', duration: .6});
    gsap.fromTo('#tcT,#tcS', {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: .6, stagger: .08}) };
  cap(A.apt.rooms === 0 ? 'Квартира-студия' : roomWord(A.apt.rooms) + ' квартира', sqm(A.apt.area) + ' · ' + A.apt.floor + ' этаж', 'Экскурсия', 0);
  steps.forEach(s => {
    const dist = Math.hypot(s.x - px, s.z - pz), dur = Math.max(.6, dist / 1.25);
    let ty = s.type === 'room' && Math.hypot(s.look.x - s.x, s.look.z - s.z) > .3 ? yawTo(s.x, s.z, s.look) : dist > .2 ? yawTo(px, pz, s) : yaw;
    ty = shortest(yaw, ty);
    tl.to(WALK.pos, {x: s.x, z: s.z, duration: dur, ease: 'power1.inOut', onUpdate(){ WALK.bob += .09 }});
    tl.to(WALK, {yaw: ty, pitch: -.04, duration: Math.min(dur, 1.3), ease: 'sine.inOut'}, '<');
    yaw = ty; px = s.x; pz = s.z;
    if (s.type === 'room'){ const idx = ++k, r = s.r, big = !['storage', 'laundry', 'hall', 'bath'].includes(r.t), sw = big ? .5 : .25;
      tl.call(() => cap(r.n, (r.w * r.d).toFixed(1).replace('.', ',') + ' м² · ' + (r.w - 2 * T).toFixed(1).replace('.', ',') + ' × ' + (r.d - 2 * T).toFixed(1).replace('.', ',') + ' м', 'Помещение ' + idx + ' из ' + total, idx / total));
      tl.to(WALK, {yaw: ty + sw, duration: big ? 1.8 : 1, ease: 'sine.inOut'}).to(WALK, {yaw: ty - sw * .4, duration: big ? 1.8 : 1, ease: 'sine.inOut'});
      yaw = ty - sw * .4 }
  });
  // финал: возвращаемся в главную комнату, смотрим в окна
  const main = A.rooms.filter(r => ['kitchen', 'studio', 'bedroom'].includes(r.t)).sort((p, q) => q.w * q.d - p.w * p.d)[0];
  if (main){ const fx = main.x + main.w / 2 - A.W / 2, fz = main.z + main.d * .35 - A.D / 2, fy = yawTo(fx, fz, {x: fx, z: main.z + main.d - A.D / 2 + 3}), f = FIN[state.finish];
    tl.to('#fade', {opacity: 1, duration: .5}).call(() => { WALK.pos.set(fx, 0, fz); WALK.yaw = fy; WALK.pitch = -.03;
      cap(A.apt.rooms === 0 ? 'Студия ' + sqm(A.apt.area) : roomWord(A.apt.rooms) + ' · ' + sqm(A.apt.area), f.name + ' · итого ' + money(A.apt.price + A.apt.area * f.ppm), 'Экскурсия завершена', 1) })
      .to('#fade', {opacity: 0, duration: .7}).to(WALK, {yaw: fy + .35, duration: 3.5, ease: 'sine.inOut'}) }
}
function stopTour(){
  if (!state.touring) return; state.touring = false;
  if (WALK.auto){ WALK.auto.kill(); WALK.auto = null }
  $('#tourBtn').classList.remove('on'); $('#tourBtn').innerHTML = '▶<span>Экскурсия</span>';
  $('#tourcap').classList.add('hidden'); $('#whint').classList.remove('hidden');
}

/* ===== коммерческое предложение (картинка) ===== */
const KP = {shots: null};
function initKP(){
  const m = store.get('mgr', {}); $('#kpMgr').value = m.name || MANAGER.name; $('#kpTel').value = m.tel || MANAGER.phone;
  ['kpName', 'kpMgr', 'kpTel'].forEach(id => $('#' + id).oninput = () => { store.set('mgr', {name: $('#kpMgr').value, tel: $('#kpTel').value}); drawKP() });
  $('#kpSave').onclick = () => { const a = state.apt; $('#kpC').toBlob(b => { if (!b){ toast('Не удалось сохранить картинку'); return } const u = URL.createObjectURL(b), l = document.createElement('a');
    l.href = u; l.download = BRAND + '_kv' + a.num + '.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast('Картинка сохранена в загрузки') }, 'image/png') };
  $('#kpCopy').onclick = () => copyText(kpText());
  $('#kpPrint').onclick = () => { const w = window.open('', '_blank'); if (!w){ toast('Браузер заблокировал окно печати'); return }
    w.document.write('<title>' + BRAND + ' — квартира ' + state.apt.num + '</title><style>body{margin:0}img{width:100%}@page{size:landscape;margin:8mm}</style><img src="' + $('#kpC').toDataURL('image/png') + '">'); w.document.close(); setTimeout(() => { w.focus(); w.print() }, 400) };
}
function kpData(){ const a = state.apt, A = state.as, f = FIN[state.finish], fin = a.area * f.ppm, tot = a.price + fin, down = tot * MORT.down;
  return {a, A, f, fin, tot, down, month: monthlyFor(tot), prog: MORT_PROGS[MORT.prog], ins: A.insol} }
function kpText(){ const d = kpData(), a = d.a, name = $('#kpName').value.trim();
  return [(name ? name + ', подготовил' : 'Подготовил') + ' предложение по квартире:', '',
    'ЖК «' + a.c.name + '», ' + a.c.district, (a.rooms === 0 ? 'Студия' : roomWord(a.rooms)) + ' квартира № ' + a.num + ', ' + sqm(a.area) + ', ' + a.floor + ' этаж, корпус ' + a.corp,
    'Окна на ' + d.ins.side + (d.ins.from ? ', солнце ' + d.ins.from + '–' + d.ins.to : '') + ' · ключи до ' + a.c.deadline, '',
    'Квартира: ' + money(a.price), d.f.name + ': ' + (d.fin ? money(d.fin) : 'включено'), 'Итого: ' + money(d.tot), '',
    d.prog.name + ' ' + String(MORT.rate * 100).replace('.', ',') + '%: взнос ' + money(d.down) + ' (' + Math.round(MORT.down * 100) + '%), платёж ' + money(d.month) + '/мес на ' + MORT.years + ' лет', '',
    ($('#kpMgr').value || 'Менеджер') + ($('#kpTel').value ? ', ' + $('#kpTel').value : ''), 'Цены предварительные, не является офертой.'].join('\n') }
function shot(scene, cam, w, h){ // кадр из 3D: рендер и сразу копия в 2D-холст
  const prevA = camera.aspect; renderer.render(scene, cam);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), src = renderer.domElement;
  const sr = src.width / src.height, dr = w / h; let sw = src.width, sh = src.height, sx = 0, sy = 0;
  if (sr > dr){ sw = sh * dr; sx = (src.width - sw) / 2 } else { sh = sw / dr; sy = (src.height - sh) / 2 }
  g.drawImage(src, sx, sy, sw, sh, 0, 0, w, h); camera.aspect = prevA; return c }
function openKP(){
  const A = state.as, a = state.apt; if (!A) return;
  const wasInside = A.inside; if (wasInside) setInterior(A, false); const lv = A.sweep.visible; A.sweep.visible = false;
  const S = Math.max(A.W, A.D), cam = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .1, 500);
  cam.position.set(S * .45, S * .95, S * 1.05); cam.lookAt(0, -.4, 0); const hero = shot(A.scene, cam, 1000, 620);
  cam.fov = 38; cam.position.set(0, S * 1.32, .01); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  const plan = shot(A.scene, cam, 490, 360);
  const pg = plan.getContext('2d'); pg.font = '600 13px Manrope, Arial'; pg.textAlign = 'center'; cam.updateMatrixWorld();
  A.labels.forEach((l, i) => { const p = l.pos.clone().project(cam), r = A.rooms[i];
    const sr = (innerWidth / innerHeight) > 490 / 360 ? 360 / innerHeight : 490 / innerWidth, x = 245 + p.x * .5 * innerWidth * sr, y = 180 - p.y * .5 * innerHeight * sr;
    const t = r.n + ' ' + (r.w * r.d).toFixed(1).replace('.', ',') + ' м²', tw = pg.measureText(t).width + 14;
    pg.fillStyle = 'rgba(255,255,255,.9)'; rr(pg, x - tw / 2, y - 11, tw, 22, 11); pg.fill(); pg.fillStyle = '#1b1c1f'; pg.fillText(t, x, y + 4.5) });
  let view = null;
  if (state.cs){ const wc = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 2500), p = a.pos.clone().addScaledVector(a.n, 1.8); p.y += .15;
    wc.position.copy(p); wc.rotation.set(-.08, Math.atan2(-a.n.x, -a.n.z), 0, 'YXZ'); wc.updateMatrixWorld(); state.cs.hl.visible = false; view = shot(state.cs.scene, wc, 490, 360) }
  if (wasInside) setInterior(A, true); A.sweep.visible = lv;
  KP.shots = {hero, plan, view}; drawKP(); openModal('kpM');
}
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath() }
function drawKP(){
  if (!KP.shots) return; const c = $('#kpC'); c.width = 1600; c.height = 1040; const g = c.getContext('2d'), d = kpData(), a = d.a;
  g.fillStyle = '#f6f4ef'; g.fillRect(0, 0, 1600, 1040);
  const clipImg = (img, x, y, w, h, r = 18) => { g.save(); rr(g, x, y, w, h, r); g.clip(); g.drawImage(img, x, y, w, h); g.restore() };
  clipImg(KP.shots.hero, 40, 40, 1000, 620);
  clipImg(KP.shots.plan, 40, 680, 490, 320); if (KP.shots.view) clipImg(KP.shots.view, 550, 680, 490, 320);
  const tagT = (t, x, y) => { g.font = '700 15px Manrope, Arial'; const w = g.measureText(t).width + 26; g.fillStyle = 'rgba(17,18,22,.78)'; rr(g, x, y, w, 34, 17); g.fill(); g.fillStyle = '#fff'; g.fillText(t, x + 13, y + 22) };
  tagT('Планировка', 56, 696); if (KP.shots.view) tagT('Вид из окна · ' + a.floor + ' этаж', 566, 696); tagT(d.f.name, 56, 56);
  const X = 1080, W = 480; let y = 78; g.textAlign = 'left';
  g.fillStyle = '#b08b52'; g.font = '700 16px Manrope, Arial'; g.fillText(BRAND.split('').join(' ') + '   ·   ПРЕДЛОЖЕНИЕ ПО КВАРТИРЕ', X, y);
  const nm = $('#kpName').value.trim(); y += 52; g.fillStyle = '#1b1c1f'; g.font = '500 40px Unbounded, Arial';
  g.fillText(a.rooms === 0 ? 'Студия' : roomWord(a.rooms), X, y); y += 46; g.fillText(sqm(a.area), X, y);
  y += 36; g.fillStyle = '#6d6b66'; g.font = '500 19px Manrope, Arial'; g.fillText('ЖК «' + a.c.name + '» · корпус ' + a.corp + ' · ' + a.floor + ' этаж · № ' + a.num, X, y);
  if (nm){ y += 28; g.fillText('Для: ' + nm, X, y) }
  y += 30; const facts = [['Окна', 'на ' + d.ins.side], ['Солнце', d.ins.from ? d.ins.from + '–' + d.ins.to : 'рассеянное'], ['Потолки', '2,75 м'], ['Ключи', 'до ' + a.c.deadline]];
  facts.forEach(([k, v], i) => { const fx = X + (i % 2) * 240, fy = y + Math.floor(i / 2) * 74; g.fillStyle = '#ece8e0'; rr(g, fx, fy, 228, 62, 12); g.fill();
    g.fillStyle = '#8a877f'; g.font = '500 14px Manrope, Arial'; g.fillText(k, fx + 16, fy + 24); g.fillStyle = '#1b1c1f'; g.font = '700 18px Manrope, Arial'; g.fillText(v, fx + 16, fy + 48) });
  y += 170;
  const row = (k, v, bold) => { g.fillStyle = '#6d6b66'; g.font = '500 18px Manrope, Arial'; g.textAlign = 'left'; g.fillText(k, X, y); g.fillStyle = '#1b1c1f'; g.font = (bold ? '800 ' : '700 ') + '19px Manrope, Arial'; g.textAlign = 'right'; g.fillText(v, X + W, y); g.textAlign = 'left';
    g.fillStyle = '#e2ddd3'; g.fillRect(X, y + 16, W, 1); y += 46 };
  row('Квартира', money(a.price)); row(d.f.name, d.fin ? '+ ' + money(d.fin) : 'включено');
  y += 8; g.fillStyle = '#8a877f'; g.font = '600 14px Manrope, Arial'; g.fillText('ИТОГО', X, y); y += 50; g.fillStyle = '#9a7536'; g.font = '500 44px Unbounded, Arial'; g.fillText(money(d.tot), X, y);
  y += 30; g.fillStyle = '#6d6b66'; g.font = '500 17px Manrope, Arial'; g.fillText(money(d.tot / a.area) + ' за м² с отделкой', X, y);
  y += 30; g.fillStyle = '#1b1c1f'; rr(g, X, y, W, 112, 16); g.fill();
  g.fillStyle = '#c9a46a'; g.font = '600 14px Manrope, Arial'; g.fillText((d.prog.name + ' · ' + String(MORT.rate * 100).replace('.', ',') + '% · ' + MORT.years + ' лет').toUpperCase(), X + 22, y + 32);
  g.fillStyle = '#fff'; g.font = '500 30px Unbounded, Arial'; g.fillText(money(d.month) + ' / мес', X + 22, y + 72);
  g.fillStyle = '#b9b6ae'; g.font = '500 15px Manrope, Arial'; g.fillText('Первоначальный взнос ' + money(d.down) + ' (' + Math.round(MORT.down * 100) + '%)', X + 22, y + 98);
  y += 150; g.fillStyle = '#8a877f'; g.font = '600 14px Manrope, Arial'; g.fillText((d.f.id === 'rough' ? 'В ЦЕНУ ВХОДИТ' : 'В ОТДЕЛКУ ВХОДИТ'), X, y); y += 30;
  d.f.inc.forEach((it, i) => { const ix = X + (i % 2) * 240, iy = y + Math.floor(i / 2) * 30; g.fillStyle = '#b08b52'; g.font = '700 16px Manrope, Arial'; g.fillText('✓', ix, iy); g.fillStyle = '#1b1c1f'; g.font = '500 16px Manrope, Arial'; g.fillText(it, ix + 22, iy) });
  y = 966; g.fillStyle = '#1b1c1f'; g.font = '700 19px Manrope, Arial'; g.fillText(($('#kpMgr').value || 'Ваш менеджер') + ($('#kpTel').value ? '   ' + $('#kpTel').value : ''), X, y);
  g.fillStyle = '#8a877f'; g.font = '500 13px Manrope, Arial'; g.fillText(new Date().toLocaleDateString('ru-RU') + ' · Цены предварительные, ставки примерные, не является офертой', X, y + 30);
}
