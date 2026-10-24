/* ---------- 3D-модель квартиры ---------- */
const T = .08, WH = 2.75, EYE = 1.62, H_SILL = .85, H_TOP = 2.4;

function addItem(A, r, o, tag, opt = {}){ A.root.add(o); r.items.push({o, tag, collide: !!opt.collide, anim: opt.anim !== false}) }

function addWindow(A, r, horiz, fixed, c, L, side){
  const th = horiz ? (side > 0 ? 0 : PI) : (side > 0 ? PI / 2 : -PI / 2);
  const mk = () => { const q = new THREE.Group(); q.position.set(horiz ? c : fixed, 0, horiz ? fixed : c); q.rotation.y = th; return q };
  const h = H_TOP - H_SILL, yc = H_SILL + h / 2, fw = .06, fd = .09;
  const g = mk();
  g.add(BM(L, fw, fd, FM.pvc, 0, H_SILL + fw / 2, 0), BM(L, fw, fd, FM.pvc, 0, H_TOP - fw / 2, 0), BM(fw, h, fd, FM.pvc, -L / 2 + fw / 2, yc, 0), BM(fw, h, fd, FM.pvc, L / 2 - fw / 2, yc, 0));
  if (L > 1.25) g.add(BM(fw * .8, h - 2 * fw, fd, FM.pvc, 0, yc, 0));
  g.add(BM(L - 2 * fw, h - 2 * fw, .012, FM.glass, 0, yc, 0, {cast: false}));
  A.root.add(g);
  const rad = mk(); rad.add(put(F.radiator(Math.min(L - .2, 1.2)), 0, T / 2 + .1)); A.root.add(rad);
  const sill = mk(); sill.add(BM(L + .12, .03, .25, FM.sill, 0, H_SILL + .015, T / 2 + .1)); addItem(A, r, sill, 'both');
  const cur = mk(); const ch = 2.62;
  cur.add(at(F.curtain(ch, .5), -(L / 2 + .3), .06 + ch / 2, T / 2 + .17), at(F.curtain(ch, .5), L / 2 + .3, .06 + ch / 2, T / 2 + .17), BM(L + 1.0, .02, .02, FM.brass, 0, 2.7, T / 2 + .17));
  addItem(A, r, cur, 'turn');
  const wc = new THREE.Vector3((horiz ? c : fixed) - A.W / 2, yc, (horiz ? fixed : c) - A.D / 2);
  A.windows.push({c: wc, n: horiz ? new THREE.Vector3(0, 0, side) : new THREE.Vector3(side, 0, 0), w: L, h});
}

function wallLine(A, r, horiz, fixed, from, len, ops, side){
  ops = ops.slice().sort((a, b) => a.t - b.t); let cur = 0;
  const piece = (a, b, y0, y1) => {
    const L = b - a; if (L < .015 || y1 - y0 < .01) return; const c = from + a + L / 2, h = y1 - y0;
    r.wallG.add(horiz ? BM(L, h, T, r.wallMat, c, y0 + h / 2, fixed) : BM(T, h, L, r.wallMat, fixed, y0 + h / 2, c));
    if (y0 < 1.2) A.colsLocal.push(horiz ? {x0: c - L / 2, x1: c + L / 2, z0: fixed - T / 2, z1: fixed + T / 2} : {x0: fixed - T / 2, x1: fixed + T / 2, z0: c - L / 2, z1: c + L / 2});
    if (y0 === 0){ const o = side * (T / 2 + .006);
      addItem(A, r, horiz ? BM(L, .08, .012, FM.base, c, .04, fixed + o, {cast: false}) : BM(.012, .08, L, FM.base, fixed + o, .04, c, {cast: false}), 'both', {anim: false}) }
  };
  for (const o of ops){
    const a = Math.max(cur, o.t - o.w / 2), b = Math.min(len, o.t + o.w / 2);
    piece(cur, a, 0, WH);
    if (o.k === 'door') piece(a, b, 2.1, WH);
    else { piece(a, b, 0, H_SILL); piece(a, b, H_TOP, WH); addWindow(A, r, horiz, fixed, from + (a + b) / 2, b - a, side) }
    cur = Math.max(cur, b);
  }
  piece(cur, len, 0, WH);
}

function plane(w, d, m, aoMap){
  const g = new THREE.PlaneGeometry(w, d); g.setAttribute('uv2', g.attributes.uv.clone());
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  return new THREE.Mesh(g, m);
}

function furnish(A, r){
  const {x, z, w, d} = r, ix = x + T, iz = z + T, add = (o, tag = 'turn', collide = true) => addItem(A, r, o, tag, {collide});
  switch (r.t){
    case 'studio':{
      const L = 2.0; add(put(F.kitchen(L), ix + .3, z + 1.25 + L / 2, PI / 2));
      add(put(F.dining(.9, .7, 2), x + 2.0, z + d - 1.0));
      add(put(F.globes(), x + 2.0, z + d - 1.0), 'turn', false);
      add(put(F.rug(2.0, 2.4), x + w - 1.3, z + d * .55), 'turn', false);
      add(put(F.bed(1.6), x + w - T - 1.06, z + d * .55, -PI / 2));
      add(put(F.nightstand(), x + w - T - .25, z + d * .55 - 1.15, -PI / 2));
      add(at(F.art(.7, .9, 1), x + w - T - .03, 1.65, z + d * .55, -PI / 2), 'turn', false);
      add(put(F.plantTall(), x + w - T - .35, z + d - T - .35));
      break }
    case 'kitchen':{
      const L = Math.max(1.4, Math.min(d - 2.2, 3.2)); add(put(F.kitchen(L), ix + .3, z + 1.3 + L / 2, PI / 2));
      const big = w >= 4.5, tx = x + 1.85, tz = z + d * .55;
      add(put(F.dining(big ? 1.5 : .9, big ? .85 : .7, big ? 4 : 2), tx, tz));
      add(put(big ? F.globes() : F.pendant(), tx, tz), 'turn', false);
      if (big){ const sx = x + w * .68;
        add(put(F.rug(2.7, 2.0), sx, z + d - 1.4), 'turn', false);
        add(put(F.sofa(2.3), sx, z + d - T - .55, PI));
        add(put(F.coffee(), sx, z + d - 1.75));
        add(put(F.tvWall(1.9), sx, iz + .22));
        add(put(F.plantBig(), x + 1.15, z + d - T - .42));
        add(at(F.art(.7, .9, 0), x + w - T - .03, 1.6, z + d * .55, -PI / 2), 'turn', false);
        add(put(F.floorLamp(), x + w - T - .3, z + d - T - .3), 'turn', false);
      } else add(put(F.plantTall(), x + w - T - .35, z + d - T - .35));
      break }
    case 'bedroom': case 'kids':{
      const kids = r.t === 'kids', bw = kids ? 1.0 : (w < 4.2 ? 1.6 : 1.8), bx = x + w * .58;
      add(put(F.rug(bw + 1.3, 1.8), bx, iz + 1.6), 'turn', false);
      add(put(F.bed(bw, kids ? FM.kidLinen : FM.linenW), bx, iz + 1.1));
      if (!kids){ add(put(F.nightstand(), bx - bw / 2 - .33, iz + .25)); add(put(F.nightstand(), bx + bw / 2 + .33, iz + .25));
        add(at(F.art(1.1, .7, 2), bx, 1.72, iz + .03), 'turn', false);
        add(put(F.armchair(), x + w - T - .55, z + d - T - .75, -PI * .8)); add(put(F.sideTable(), x + w - T - .35, z + d - T - 1.5)) }
      else { add(put(F.desk(), x + w * .5, z + d - T - .32)); add(put(F.toys(), x + w - T - .6, iz + 2.5), 'turn', false); add(at(F.art(.5, .62, 0), bx, 1.6, iz + .03), 'turn', false) }
      const wl = Math.min(1.8, d - 2.6); add(put(F.wardrobe(wl), ix + .3, z + d - T - .2 - wl / 2, PI / 2));
      add(put(F.pendant(), x + w * .55, z + d * .6), 'turn', false);
      break }
    case 'bath':{
      add(put(F.bathtub(), x + w - T - .87, z + d - T - .4), 'both');
      add(put(F.sinkDev(), x + w * .45, iz + .23), 'dev'); add(put(F.toiletDev(), x + w * .8, iz + .3), 'dev');
      add(put(F.vanity(), x + w * .45, iz + .25), 'turn'); add(put(F.toiletTurn(), x + w * .8, iz + .3), 'turn');
      add(put(F.towel(), ix + .05, z + d * .55, PI / 2), 'turn', false);
      break }
    case 'laundry': add(put(F.washer(), x + w - T - .32, z + d * .55, -PI / 2), 'turn'); break;
    case 'hall':{ const len = Math.min(1.6, d - .9); add(put(F.wardrobe(len), ix + .3, iz + .2 + len / 2, PI / 2));
      add(put(F.hall(), x + w * .6, z + d - T - .18, PI)); add(put(F.rug(1.5, .8), x + w * .6, z + d * .42), 'turn', false); break }
    case 'storage': add(put(F.shelves(w - .5), x + w / 2, iz + .22)); break;
  }
  // потолочный свет по отделке
  const cx = x + w / 2, cz = z + d / 2;
  addItem(A, r, put(F.bareBulb(), cx, cz), 'rough', {anim: false});
  addItem(A, r, put(F.ceilDev(), cx, cz), 'dev', {anim: false});
  if (['hall', 'bath', 'laundry', 'storage', 'studio', 'kitchen'].includes(r.t)) addItem(A, r, put(F.spots(w - 1, d - 1), cx, cz), 'turn', {anim: false});
}

function buildApartment(apt){
  const tp = TPL[apt.rooms], sx = apt.sx, W = tp.W * sx, D = tp.D;
  const scene = new THREE.Scene(); const studio = new THREE.Color('#e3ded6'); scene.background = studio; scene.fog = new THREE.Fog(studio, 45, 110);
  scene.environment = ENV.room;
  const hemi = new THREE.HemisphereLight(0xfaf7f2, 0xa59d90, .3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.1); sun.castShadow = true; sun.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {left: -10, right: 10, top: 10, bottom: -10, near: .5, far: 60}); sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0003; sun.shadow.normalBias = .03; sun.position.set(5, 14, 9); scene.add(sun, sun.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({color: '#d6d0c6', roughness: 1})); ground.rotation.x = -PI / 2; ground.position.y = -.42; ground.receiveShadow = true; scene.add(ground);
  const root = new THREE.Group(); root.position.set(-W / 2, 0, -D / 2); scene.add(root);
  const A = {apt, scene, root, W, D, tp, rooms: [], colsLocal: [], windows: [], labels: [], floors: [], doors: [], areaLights: [], token: 0, sun, hemi, ground, studio, hour: 15};
  root.add(BM(W + .8, .42, D + .8, FM.slab, W / 2, -.21, D / 2));
  const walls = new THREE.Group(); root.add(walls); A.walls = walls;
  const ceil = new THREE.Group(); ceil.visible = false; root.add(ceil); A.ceil = ceil;

  const rooms = tp.rooms.map((q, i) => ({i, n: q.n, t: q.t, x: q.r[0] * sx, z: q.r[1], w: q.r[2] * sx, d: q.r[3], ops: {back: [], front: [], left: [], right: []}, items: []}));
  A.rooms = rooms;
  const near = (a, b) => Math.abs(a - b) < .02;
  const leafs = [];
  const vert = (L, R) => { const lo = Math.max(L.z, R.z), hi = Math.min(L.z + L.d, R.z + R.d); if (hi - lo < 1) return; const c = hi - lo > 1.7 ? lo + .8 : (lo + hi) / 2;
    L.ops.right.push({t: c - (L.z + T), w: .9, k: 'door'}); R.ops.left.push({t: c - (R.z + T), w: .9, k: 'door'});
    leafs.push({r: R, x: R.x + T + .4, z: c - .42, ry: 0}); A.doors.push({a: L.i, b: R.i, x: R.x - W / 2, z: c - D / 2}) };
  const hor = (Bk, Fr) => { const lo = Math.max(Bk.x, Fr.x), hi = Math.min(Bk.x + Bk.w, Fr.x + Fr.w); if (hi - lo < 1) return; const c = hi - lo > 1.7 ? lo + .8 : (lo + hi) / 2;
    Bk.ops.front.push({t: c - Bk.x, w: .9, k: 'door'}); Fr.ops.back.push({t: c - Fr.x, w: .9, k: 'door'});
    leafs.push({r: Fr, x: c - .42, z: Fr.z + T + .4, ry: PI / 2}); A.doors.push({a: Bk.i, b: Fr.i, x: c - W / 2, z: Fr.z - D / 2}) };
  tp.doors.forEach(([i, j]) => { const a = rooms[i], b = rooms[j];
    if (near(a.x + a.w, b.x)) vert(a, b); else if (near(b.x + b.w, a.x)) vert(b, a); else if (near(a.z + a.d, b.z)) hor(a, b); else if (near(b.z + b.d, a.z)) hor(b, a) });
  const e = rooms[tp.entry], et = e.w * .6; e.ops.back.push({t: et, w: 1.0, k: 'door'});
  rooms.forEach(r => { if (near(r.z + r.d, D) && ['kitchen', 'bedroom', 'kids', 'studio'].includes(r.t)){ const n = r.w > 4.3 ? 2 : 1;
    for (let k = 0; k < n; k++) r.ops.front.push({t: r.w * (k + 1) / (n + 1), w: Math.min(1.75, r.w / (n + 1.15)), k: 'win'}) } });

  const labelBox = $('#labels'); labelBox.innerHTML = '';
  rooms.forEach(r => {
    r.wet = r.t === 'bath' || r.t === 'laundry';
    r.wallMat = new THREE.MeshStandardMaterial({color: '#fff', roughness: .92});
    r.floorMat = new THREE.MeshStandardMaterial({color: '#fff', roughness: .7, aoMap: TEX.ao, aoMapIntensity: 1});
    r.ceilMat = new THREE.MeshStandardMaterial({color: '#fff', roughness: .95, aoMap: TEX.ao, aoMapIntensity: .8});
    r.wallG = new THREE.Group(); walls.add(r.wallG);
    wallLine(A, r, true, r.z + T / 2, r.x, r.w, r.ops.back, 1);
    wallLine(A, r, true, r.z + r.d - T / 2, r.x, r.w, r.ops.front, -1);
    wallLine(A, r, false, r.x + T / 2, r.z + T, r.d - 2 * T, r.ops.left, 1);
    wallLine(A, r, false, r.x + r.w - T / 2, r.z + T, r.d - 2 * T, r.ops.right, -1);
    const fl = plane(r.w, r.d, r.floorMat); fl.rotation.x = -PI / 2; fl.position.set(r.x + r.w / 2, .004, r.z + r.d / 2); fl.receiveShadow = true; root.add(fl); A.floors.push(fl);
    const cl = plane(r.w, r.d, r.ceilMat); cl.rotation.x = PI / 2; cl.position.set(r.x + r.w / 2, WH, r.z + r.d / 2); cl.castShadow = true; cl.receiveShadow = true; ceil.add(cl);
    furnish(A, r);
    r.light = new THREE.PointLight(0xffd29a, 0, 7.5, 2); r.light.position.set(r.x + r.w / 2, WH - .45, r.z + r.d / 2); root.add(r.light);
    r.cxw = r.x + r.w / 2 - W / 2;
    const el = document.createElement('div'); el.className = 'rlabel'; el.innerHTML = '<b>' + r.n + '</b><span>' + (r.w * r.d).toFixed(1).replace('.', ',') + ' м²</span><em>' + (r.w - 2 * T).toFixed(1).replace('.', ',') + ' × ' + (r.d - 2 * T).toFixed(1).replace('.', ',') + ' м</em>';
    labelBox.appendChild(el); A.labels.push({el, pos: new THREE.Vector3(r.cxw, .05, r.z + r.d / 2 - D / 2)});
  });
  // двери
  leafs.forEach(l => { addItem(A, l.r, put(F.doorLeaf(FM.doorWhite), l.x, l.z, l.ry), 'dev', {collide: true}); addItem(A, l.r, put(F.doorLeaf(FM.doorOak), l.x, l.z, l.ry), 'turn', {collide: true}) });
  root.add(put(F.entryDoor(), e.x + et, T / 2));
  A.colsLocal.push({x0: e.x + et - .5, x1: e.x + et + .5, z0: 0, z1: T});
  A.entry = {x: e.x + et - W / 2, z: T + .75 - D / 2};

  // коллизии в мировых координатах
  scene.updateMatrixWorld(true);
  A.cols = A.colsLocal.map(b => ({x0: b.x0 - W / 2, x1: b.x1 - W / 2, z0: b.z0 - D / 2, z1: b.z1 - D / 2}));
  const bx = new THREE.Box3();
  rooms.forEach(r => r.items.forEach(it => {
    if (it.collide){ bx.setFromObject(it.o); if (bx.max.y > .3 && bx.min.y < 1.2) it.box = {x0: bx.min.x, x1: bx.max.x, z0: bx.min.z, z1: bx.max.z} }
    it.o.visible = false; it.o.scale.setScalar(.001);
  }));

  // солнечный свет через окна
  if (THREE.RectAreaLightUniformsLib) A.windows.slice(0, 5).forEach(wn => {
    const l = new THREE.RectAreaLight(0xe4edf7, 2.4, wn.w * .95, wn.h * .95); l.position.copy(wn.c).addScaledVector(wn.n, .06); l.lookAt(wn.c.clone().add(wn.n)); scene.add(l); A.areaLights.push(l) });
  A.theta = Math.atan2(apt.n.x, apt.n.z); A.insol = insolation(A.theta); A.hour = A.insol.fromH !== null ? Math.round((A.insol.fromH + A.insol.toH) / 2 * 4) / 4 : 13; setSun(A, A.hour);

  // панорама за окнами
  const pano = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 70, 64, 1, true), new THREE.MeshBasicMaterial({map: TEX.pano, side: THREE.BackSide, fog: false, color: new THREE.Color(1.15, 1.15, 1.15)}));
  pano.position.y = EYE + 5.6; pano.visible = false; scene.add(pano); A.pano = pano;

  // «волна» смены отделки
  const sweep = new THREE.Group();
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(D + 1.4, WH + .6), new THREE.MeshBasicMaterial({color: 0xc9a46a, transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false}));
  sp.rotation.y = PI / 2; sweep.add(sp, new THREE.Mesh(new THREE.BoxGeometry(.03, WH + .6, D + 1.4), new THREE.MeshBasicMaterial({color: 0xffe1a8})));
  sweep.position.y = (WH + .6) / 2 - .1; sweep.visible = false; scene.add(sweep); A.sweep = sweep;
  return A;
}

const itemVisibleIn = (tag, fid) => tag === 'all' || tag === fid || (tag === 'both' && fid !== 'rough');
function setMat(m, [col, map, rough]){ const t = map ? TEX[map] : null; if (m.map !== t){ m.map = t; m.needsUpdate = true } m.color.set(col); m.roughness = rough }
function itemVis(o, show, delay, anim){
  gsap.killTweensOf(o.scale);
  if (show){ if (o.visible && o.scale.x > .99) return; o.visible = true; if (!anim){ o.scale.setScalar(1); return }
    if (o.scale.x > .99) o.scale.setScalar(.001); gsap.to(o.scale, {x: 1, y: 1, z: 1, duration: .75, delay, ease: 'back.out(1.4)'}) }
  else { if (!o.visible) return; if (!anim){ o.visible = false; o.scale.setScalar(.001); return }
    gsap.to(o.scale, {x: .001, y: .001, z: .001, duration: .3, delay: delay * .3, ease: 'power2.in', onComplete: () => { o.visible = false }}) }
}
function applyRoom(r, fid, anim){
  const L = LOOK[fid]; setMat(r.wallMat, r.wet ? L.wet : L.wall); setMat(r.floorMat, r.wet ? L.wetFloor : L.floor); setMat(r.ceilMat, L.ceil);
  let k = 0; r.items.forEach(it => { const v = itemVisibleIn(it.tag, fid); itemVis(it.o, v, it.anim && v ? (k++) * .06 : 0, anim && it.anim) });
  const [col, inten] = LIGHT[fid]; r.light.color.setHex(col); gsap.to(r.light, {intensity: inten, duration: anim ? 1 : 0});
}
function setFinish(id, anim = true){
  state.finish = id; $$('.fin').forEach(b => b.classList.toggle('on', b.dataset.f === id)); updatePrices(); updateFinPhoto(id);
  const A = state.as; if (!A) return;
  if (!anim){ A.rooms.forEach(r => applyRoom(r, id, false)); return }
  const tok = ++A.token; A.rooms.forEach(r => r._done = false); A.sweep.visible = true;
  const o = {x: -A.W / 2 - 1};
  gsap.to(o, {x: A.W / 2 + 1, duration: 1.3, ease: 'power1.inOut',
    onUpdate(){ if (tok !== A.token) return; A.sweep.position.x = o.x; A.rooms.forEach(r => { if (!r._done && r.cxw <= o.x){ r._done = true; applyRoom(r, id, true) } }) },
    onComplete(){ if (tok === A.token) A.sweep.visible = false }});
}
function updatePrices(){
  const a = state.apt; if (!a) return; const f = FIN[state.finish];
  const fin = a.area * f.ppm, tot = a.price + fin;
  O.apt.set(money(a.price)); O.fin.set(money(fin)); O.total.set(money(tot)); O.month.set(money(monthlyFor(tot))); O.m2.set(money(tot / a.area));
  $('#bar1').style.width = (a.price / tot * 100) + '%'; $('#bar2').style.width = (fin / tot * 100) + '%';
  syncFavFinish();
  const t = $('#oTotal'); t.classList.add('pulse'); clearTimeout(t._p); t._p = setTimeout(() => t.classList.remove('pulse'), 900);
}
/* солнце: Краснодар ~45° с.ш., север = -z в модели квартала */
function sunWorld(h){ const A = (90 + (h - 6.6) / 12.2 * 180) * PI / 180, el = Math.max(-5, 46 * Math.sin(PI * (h - 6.6) / 12.2)) * PI / 180;
  return {dir: new THREE.Vector3(Math.sin(A) * Math.cos(el), Math.sin(el), -Math.cos(A) * Math.cos(el)), el: el * 180 / PI} }
function sunLocal(theta, h){ const s = sunWorld(h); s.dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -theta); return s }
function insolation(theta){ let first = null, last = null, n = 0;
  for (let h = 6; h <= 20; h += .25){ const s = sunLocal(theta, h); if (s.el > 5 && s.dir.z > .25){ n++; if (first === null) first = h; last = h } }
  const hh = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round(h % 1 * 60)).padStart(2, '0');
  const side = (() => { const a = ((theta * 180 / PI) % 360 + 360) % 360; return a < 45 || a >= 315 ? 'юг' : a < 135 ? 'восток' : a < 225 ? 'север' : 'запад' })();
  return {hours: n / 4, from: first === null ? null : hh(first), to: last === null ? null : hh(last + .25), fromH: first, toH: last === null ? null : last + .25, side} }
function setSun(A, h){
  A.hour = h; const s = sunLocal(A.theta, h), day = clamp(s.el / 25, 0, 1), warm = 1 - clamp((s.el - 4) / 30, 0, 1);
  A.sun.position.copy(s.dir).multiplyScalar(18); if (A.sun.position.y < 1) A.sun.position.y = 1;
  A.sun.intensity = s.el > 0 ? 2.4 * (.35 + .65 * day) : 0;
  A.sun.color.setRGB(1, .93 - warm * .25, .83 - warm * .45);
  A.hemi.intensity = (A.inside ? .42 : .3) * (.45 + .55 * day);
  A.areaLights.forEach(l => { l.intensity = 1.7 * (.35 + .65 * day); l.color.setRGB(.9 + warm * .1, .93 - warm * .1, 1 - warm * .3) });
}
function setInterior(A, inside){ // в прогулке: потолок и панорама за окнами
  A.inside = inside; A.ceil.visible = inside; A.pano.visible = inside; A.ground.visible = !inside;
  A.scene.background = inside ? new THREE.Color('#cfe0ee') : A.studio; A.scene.fog = inside ? null : new THREE.Fog(A.studio, 45, 110);
  setSun(A, A.hour); renderer.toneMappingExposure = inside ? 1.0 : .88;
}
function disposeApt(){ const A = state.as; if (!A) return; A.token++; A.scene.traverse(o => { if (o.geometry && !Object.values(GEO).includes(o.geometry) && o.geometry !== SPH) o.geometry.dispose() });
  A.rooms.forEach(r => { r.wallMat.dispose(); r.floorMat.dispose(); r.ceilMat.dispose() }); $('#labels').innerHTML = ''; state.as = null }
