/* ---------- 3D-модель жилого комплекса ---------- */
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const PH = 4.8, FH = 3.0;
const ST_COL = {free: new THREE.Color('#58c493'), booked: new THREE.Color('#e3a53c'), sold: new THREE.Color('#2b3036'), dim: new THREE.Color('#9aa3ad')};
const UNIT_W = {0: 3.6, 1: 4.8, 2: 6.4, 3: 8.2};

/* ---- фасадные текстуры ---- */
const FTEX = {};
function brickTex(hex){
  if (FTEX['b' + hex]) return FTEX['b' + hex];
  const W = 512, H = 480, c = cv(W, H), g = c.getContext('2d'), R = rng(parseInt(hex.slice(1), 16)), base = new THREE.Color(hex), col = new THREE.Color();
  g.fillStyle = '#' + base.clone().lerp(new THREE.Color('#c9c2b6'), .55).getHexString(); g.fillRect(0, 0, W, H);
  const rows = 13, bh = H / rows, bw = W / 4;
  for (let r = 0; r < rows; r++){ const off = r % 2 ? bw / 2 : 0;
    for (let k = -1; k <= 4; k++){ col.copy(base).offsetHSL((R() - .5) * .025, (R() - .5) * .12, (R() - .5) * .13); if (R() < .08) col.offsetHSL(0, 0, -.08);
      g.fillStyle = '#' + col.getHexString(); g.fillRect(k * bw + off + 2.5, r * bh + 2.5, bw - 5, bh - 5) } }
  for (let i = 0; i < 9000; i++){ g.fillStyle = (Math.random() < .5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (Math.random() * .07).toFixed(3) + ')'; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5) }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = MAXANISO; t.repeat.set(1 / 1.04, 1 / .975);
  return FTEX['b' + hex] = t;
}
function stoneTex(){
  if (FTEX.stone) return FTEX.stone;
  const s = 512, c = cv(s), g = c.getContext('2d'), R = rng(5); g.fillStyle = '#8e8a83'; g.fillRect(0, 0, s, s);
  const pw = s / 2, ph = s / 4;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++){ const l = 86 + R() * 6; g.fillStyle = 'hsl(38,' + (14 + R() * 8) + '%,' + l + '%)'; g.fillRect(i * pw + 2, j * ph + 2, pw - 4, ph - 4);
    for (let k = 0; k < 14; k++){ g.fillStyle = 'rgba(150,130,100,' + (R() * .12) + ')'; g.fillRect(i * pw + 2, j * ph + 2 + R() * (ph - 6), pw - 4, 1 + R() * 2) } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = MAXANISO; t.repeat.set(1 / 2.4, 1 / 2.4);
  return FTEX.stone = t;
}
function panelTex(lit){ // соседние панельные дома: окна 3 × 2.8 м, 8×8 модулей
  const k = lit ? 'pl' : 'p'; if (FTEX[k]) return FTEX[k];
  const s = 1024, m = s / 8, c = cv(s), g = c.getContext('2d'), R = rng(lit ? 9 : 8);
  g.fillStyle = lit ? '#000' : '#e4e1db'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++){ const x = i * m + m * .3, y = j * m + m * .28, w = m * .42, h = m * .5;
    if (lit){ if (R() < .45){ g.fillStyle = 'hsl(' + (32 + R() * 12) + ',80%,' + (55 + R() * 20) + '%)'; g.fillRect(x, y, w, h) } }
    else { g.fillStyle = '#f7f6f3'; g.fillRect(x - 3, y - 3, w + 6, h + 6); g.fillStyle = 'hsl(205,' + (10 + R() * 8) + '%,' + (30 + R() * 14) + '%)'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + w / 2 - 1, y, 2, h) } }
  if (!lit){ g.fillStyle = 'rgba(0,0,0,.05)'; for (let j = 0; j < 8; j++) g.fillRect(0, j * m, s, 2) }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.repeat.set(1 / 24, 1 / 22.4);
  return FTEX[k] = t;
}
function railTex(){
  if (FTEX.rail) return FTEX.rail;
  const c = cv(512, 64), g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#fff';
  for (let x = 2; x < 512; x += 10) g.fillRect(x, 0, 3, 64); g.fillRect(0, 0, 512, 5); g.fillRect(0, 59, 512, 5);
  const t = new THREE.CanvasTexture(c); return FTEX.rail = t;
}

/* ---- инстансы ---- */
function Inst(geo = UNIT){
  const map = new Map(), m4 = new THREE.Matrix4();
  return {
    box(mat, base, x, y, z, sx, sy, sz, color){ let a = map.get(mat); if (!a) map.set(mat, a = []); m4.makeScale(sx, sy, sz).setPosition(x, y, z); a.push([base ? base.clone().multiply(m4) : m4.clone(), color]) },
    mtx(mat, m, color){ let a = map.get(mat); if (!a) map.set(mat, a = []); a.push([m.clone(), color]) },
    build(parent, cast = true){ for (const [mat, a] of map){ const im = new THREE.InstancedMesh(geo, mat, a.length);
      a.forEach(([m, c], i) => { im.setMatrixAt(i, m); if (c) im.setColorAt(i, c) });
      im.castShadow = cast && !mat.transparent && !mat.userData.noCast; im.receiveShadow = true; parent.add(im) } }
  };
}
function groundPlane(w, d, m, x, y, z){ const p = plane(w, d, m); p.rotation.x = -PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p }
function footprint(x, z, r, w, d){ const out = []; for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) out.push([x + lx * Math.cos(r) + lz * Math.sin(r), z - lx * Math.sin(r) + lz * Math.cos(r)]); return out }

function buildComplex(c){
  const R = rng(c.seed);
  const scene = new THREE.Scene();
  const skyDay = skyTexture(c.sky[0], c.sky[1]), skyNight = skyTexture('#060a14', '#1c2638');
  scene.background = skyDay; scene.fog = new THREE.Fog(new THREE.Color(c.sky[1]), 280, 760);
  scene.environment = ENV.sky[c.id];
  const hemi = new THREE.HemisphereLight(0xeaf2ff, 0x7b7466, .5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.3); scene.add(sun, sun.target);
  const std = (col, rough = .8, metal = 0, ex = {}) => new THREE.MeshStandardMaterial(Object.assign({color: col, roughness: rough, metalness: metal}, ex));
  const M = {
    shop: std('#2a3038', .05, .9), roof: std('#5f6165', .95), roofBox: std('#c9c7c2', .85), slab: std('#3a3b3e', .7),
    rail: std('#1c1d1f', .5, .6, {alphaMap: railTex(), alphaTest: .5, side: THREE.DoubleSide}),
    wood: std('#a26c42', .65, 0, {map: TEX.wood}), glowNum: new THREE.MeshBasicMaterial({color: new THREE.Color(2.2, 2.1, 1.9)}),
    asphalt: std('#ffffff', .95, 0, {map: TEX.asphalt}), paving: std('#a8a196', .9, 0, {map: TEX.paving}), pavers: std('#c8a99a', .9, 0, {map: TEX.paving}),
    grass: std('#ffffff', 1, 0, {map: TEX.grass}), lawn: std('#d8f0c8', 1, 0, {map: TEX.grass}),
    curb: std('#cfcac2', .85), concrete: std('#bdb8b0', .9, 0, {map: TEX.concrete}), mark: std('#f2f2ee', .7), gravel: std('#a9a59d', 1, 0, {map: TEX.concrete}),
    trunk: std('#5a4636', .95), crown: std('#ffffff', .85), car: std('#ffffff', .22, .6), carGlass: std('#15191e', .05, .8), tire: std('#151515', .9),
    pole: std('#2f3134', .5, .6), lamp: new THREE.MeshBasicMaterial({color: new THREE.Color(1.3, 1.25, 1.1)}),
    ctx: std('#ffffff', .9, 0, {map: panelTex(false), emissiveMap: panelTex(true), emissive: new THREE.Color('#ffc77a'), emissiveIntensity: 0}),
    water: std('#4f7c99', .05, .7), steel: std('#d9dde0', .18, .95, {flatShading: true}), sand: std('#e2d3ae', 1), track: std('#b4513f', .95), field: std('#5c9a4c', .95),
    churchWall: std('#f1ece2', .8), gold: std('#d8b25a', .25, 1), dome: std('#3f7a5a', .35, .5), rubber: c.playColors.map(h => std(h, .95, 0, {map: TEX.rubber})),
    led: new THREE.MeshBasicMaterial({color: new THREE.Color(2.4, 2.3, 2.1)}),
    apt: std('#ffffff', .06, .9, {envMapIntensity: 1.3}),
    aptGlow: new THREE.MeshBasicMaterial({color: '#ffffff', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})
  };
  M.rail.userData.noCast = false;
  const wallMats = {};
  const wallMat = (kind, col) => { const k = kind + col; if (wallMats[k]) return wallMats[k];
    return wallMats[k] = kind === 'brick' ? std('#ffffff', .92, 0, {map: brickTex(col)}) : kind === 'stone' ? std(col, .75, 0, {map: stoneTex()}) : std(col, .9, 0, {map: TEX.facade}) };
  const colMats = {}; const cm = (col, rough = .6, metal = .2) => colMats[col + rough] || (colMats[col + rough] = std(col, rough, metal));

  const box = Inst(), led = Inst(), crowns = Inst(new THREE.IcosahedronGeometry(1, 1)), trunks = Inst(new THREE.CylinderGeometry(.5, .5, 1, 7)), cyl = Inst(new THREE.CylinderGeometry(.5, .5, 1, 16)),
        sph = Inst(SPH), icos = Inst(new THREE.IcosahedronGeometry(1, 0)), carBody = Inst(rbGeo(4.4, .75, 1.8, .22)), carCab = Inst(rbGeo(2.3, .6, 1.6, .22));
  const nightGroup = new THREE.Group(); nightGroup.visible = false; scene.add(nightGroup);
  const apts = [], aptInst = [];
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  let num = 1, maxH = 0;

  /* ===== корпуса ===== */
  const corps = [];
  c.buildings.forEach((B, bi) => {
    const st = STYLES[B.s], W = B.w, D = B.d, F = B.f, H = PH + (F - 1) * FH, r = B.r || 0; maxH = Math.max(maxH, H);
    const base = new THREE.Matrix4().makeRotationY(r).setPosition(B.x, 0, B.z);
    const bx = (mat, x, y, z, sx, sy, sz, col) => box.box(mat, base, x, y, z, sx, sy, sz, col);
    const fcol = B.c || st.color, frame = cm(st.frame, .5, .4), band = st.band ? cm(st.band, .7, .1) : frame, glassCol = new THREE.Color(st.glass);
    // объём
    const addBody = (y0, y1, kind, col) => { const m = BM(W, y1 - y0, D, wallMat(kind, col), 0, (y0 + y1) / 2, 0); m.applyMatrix4(base); scene.add(m) };
    if (st.lower){ const yl = PH + (st.lower.floors - 1) * FH; addBody(PH, yl, st.lower.wall, st.lower.color); addBody(yl, H, st.wall, fcol) } else addBody(PH, H, st.wall, fcol);
    // цоколь: облицовка, витрины, порталы входов
    const pod = BM(W, PH, D, wallMat(st.podiumWall, st.podium), 0, PH / 2, 0); pod.applyMatrix4(base); scene.add(pod);
    bx(M.slab, 0, PH, 0, W + .3, .25, D + .3);
    // кровля
    bx(M.roof, 0, H + .05, 0, W - .5, .1, D - .5);
    const capM = cm(st.cap, .6, .3);
    bx(capM, 0, H + .6, D / 2 - .2, W, 1.2, .4); bx(capM, 0, H + .6, -D / 2 + .2, W, 1.2, .4); bx(capM, W / 2 - .2, H + .6, 0, .4, 1.2, D); bx(capM, -W / 2 + .2, H + .6, 0, .4, 1.2, D);
    const mrW = Math.min(9, W * .35); bx(M.roofBox, (R() - .5) * W * .3, H + 2, (R() - .5) * 3, mrW, 4, 6);
    bx(M.roofBox, W * .3, H + 1, -D * .2, 2.5, 2, 2.5); bx(M.roofBox, -W * .32, H + .9, D * .15, 3, 1.8, 2);
    // фасады
    const faces = [{th: 0, len: W, half: D / 2, main: true}, {th: PI, len: W, half: D / 2, main: true}, {th: PI / 2, len: D, half: W / 2}, {th: -PI / 2, len: D, half: W / 2}];
    let colBase = 0; const corp = {n: bi + 1, floors: F, cols: 0, style: B.s};
    corps.push(corp);
    faces.forEach((fc, fi) => {
      const fm = base.clone().multiply(new THREE.Matrix4().makeRotationY(fc.th)).multiply(new THREE.Matrix4().makeTranslation(0, 0, fc.half));
      const fb = (mat, x, y, z, sx, sy, sz, col) => box.box(mat, fm, x, y, z, sx, sy, sz, col);
      const L = fc.len - 1.6;
      // планировка квартир на фасаде
      const pat = []; let used = 0;
      while (true){ const roll = R(), rooms = fc.len < 20 ? (roll < .35 ? 0 : roll < .75 ? 1 : 2) : (roll < .15 ? 0 : roll < .45 ? 1 : roll < .8 ? 2 : 3);
        if (used + UNIT_W[rooms] > L + 1.5) break; pat.push(rooms); used += UNIT_W[rooms]; }
      if (!pat.length) pat.push(1), used = UNIT_W[1];
      const k = L / used; let xs = -L / 2; const units = pat.map(rooms => { const w = UNIT_W[rooms] * k, u = {rooms, a0: xs, w}; xs += w; return u });
      const cb = colBase; colBase += units.length; corp.cols = colBase;
      const side = ['фасад', 'двор', 'торец', 'торец'][fi];
      // цоколь: витрины / входы
      for (let x = -fc.len / 2 + 1.2; x < fc.len / 2 - 1.2; x += 3.2){
        const isEntry = fc.main && fi === 0 && Math.abs(x) < 2.5;
        if (isEntry){ // портал входа, отделанный деревом
          fb(M.wood, x, 3.9, 1.1, 3.6, .35, 2.4); fb(M.wood, x - 1.7, 1.95, 2.1, .25, 3.9, .25); fb(M.wood, x + 1.7, 1.95, 1.2, .25, 3.9, 2.2);
          fb(M.shop, x, 1.4, .05, 2.4, 2.7, .08); fb(frame, x, 1.4, .1, .06, 2.7, .06); fb(M.glowNum, x - 2.4, 2.8, .08, .5, .7, .04);
          continue }
        fb(M.shop, x, 2.1, .04, 2.6, 3.4, .06); fb(frame, x, 2.1, .09, .06, 3.4, .05); fb(frame, x, 3.85, .09, 2.7, .1, .06);
        if (fi === 1 && R() < .35) fb(cm(['#26272a', '#c9a46a', '#f1efe9'][(R() * 3) | 0], .5, .3), x, 4.3, .12, 2.2, .45, .1);
      }
      // этажи
      for (let f = 2; f <= F; f++){
        const y0 = PH + (f - 2) * FH;
        if (band !== frame || st.glaze === 'ribbon') fb(band, 0, y0 + .05, .06, fc.len + .02, st.glaze === 'ribbon' ? .34 : .14, .12);
        units.forEach((u, ui) => {
          const cx = u.a0 + u.w / 2, w = u.w;
          const area = +(TPL_AREA[u.rooms] * (.95 + R() * .1)).toFixed(1);
          const price = Math.round(area * c.ppm * (1 + (f - 2) / F * .14 + (u.rooms === 0 ? .08 : 0)) / 10000) * 10000;
          const rr = R(), status = rr < .52 ? 'sold' : rr < .6 ? 'booked' : 'free';
          const apt = {i: apts.length, num: num++, c, section: bi + 1, corp: bi + 1, col: cb + ui, side, floor: f, rooms: u.rooms, area, price, status, sx: area / TPL_AREA[u.rooms], inst: [], glass: glassCol};
          const win = (x, y, sx, sy, z = .06) => { tmp.makeScale(sx, sy, .05).setPosition(x, y, z); apt.inst.push(aptInst.length); aptInst.push(fm.clone().multiply(tmp)) };
          const frame4 = (x, y, sx, sy, m = frame, d = .06, z = .1) => { fb(m, x, y + sy / 2, z, sx + .1, .06, d); fb(m, x, y - sy / 2, z, sx + .1, .06, d); fb(m, x - sx / 2, y, z, .06, sy, d); fb(m, x + sx / 2, y, z, .06, sy, d) };
          if (st.glaze === 'ribbon'){
            const bal = st.balcony && (f + ui) % st.balcony === 0 && w > 4;
            const bw2 = Math.max(2.2, w * .64); fb(frame, cx, y0 + FH / 2 + .1, .03, bw2, FH - .3, .06);
            const pw = bw2 - .4, ph = FH - .85, py = y0 + .4 + ph / 2;
            win(cx, py, pw, ph, .08);
            const n = Math.max(2, Math.round(pw / .8)); for (let m = 1; m < n; m++) fb(frame, cx - pw / 2 + pw * m / n, py, .12, .045, ph, .05);
            fb(frame, cx, y0 + 1.25, .12, pw, .045, .05);
            if (bal){ const bl = bw2 + .5; fb(M.slab, cx, y0 + .12, .7, bl, .2, 1.4); fb(M.rail, cx, y0 + .72, 1.38, bl, 1.0, .03); fb(frame, cx, y0 + 1.24, 1.38, bl, .05, .07);
              fb(M.rail, cx - bl / 2, y0 + .72, .7, .03, 1.0, 1.4); fb(M.rail, cx + bl / 2, y0 + .72, .7, .03, 1.0, 1.4) }
          } else if (st.glaze === 'tall'){
            const n = Math.max(1, Math.round(w / 1.7));
            for (let m = 0; m < n; m++){ const x = u.a0 + w * (m + .5) / n; fb(frame, x, y0 + FH / 2, .02, 1.35, FH, .04); win(x, y0 + .3 + (FH - .75) / 2, 1.0, FH - .75); fb(frame, x, y0 + 1.1, .1, 1.0, .05, .05) }
            if (ui % 3 === 1 && f % 2 === 0){ fb(M.slab, cx, y0 + .1, .55, Math.min(w - .4, 3.2), .18, 1.1); fb(M.rail, cx, y0 + .68, 1.08, Math.min(w - .4, 3.2), .95, .03) }
          } else if (st.glaze === 'punched'){
            const ww = Math.min(1.9, w * .42), x1 = u.a0 + w * .3;
            if (ui % 2) fb(frame, x1, y0 + FH / 2, .02, ww + .6, FH, .03);
            win(x1, y0 + .9 + .8, ww, 1.6); frame4(x1, y0 + 1.7, ww, 1.6); fb(cm('#f4f3ef', .5, 0), x1, y0 + .86, .14, ww + .2, .05, .22);
            if (w > 3.8){ const x2 = u.a0 + w * .76; win(x2, y0 + .9 + .75, 1.2, 1.5); frame4(x2, y0 + 1.65, 1.2, 1.5); fb(cm('#f4f3ef', .5, 0), x2, y0 + .86, .14, 1.4, .05, .22) }
            if (st.accent && ui === 0 && f % 4 === 0) fb(cm(st.accent, .6, .1), x1, y0 + FH / 2, .03, ww + .6, FH, .05);
          } else if (st.glaze === 'grid'){
            const n = Math.max(1, Math.round(w / 2.1));
            for (let m = 0; m < n; m++){ const x = u.a0 + w * (m + .5) / n; win(x, y0 + .8 + (FH - 1.15) / 2, 1.5, FH - 1.15); fb(frame, x, y0 + .45, .03, 1.5, .7, .04); fb(frame, x, y0 + .8 + (FH - 1.15) / 2, .1, .05, FH - 1.15, .05); frame4(x, y0 + .8 + (FH - 1.15) / 2, 1.5, FH - 1.15, frame, .05, .09) }
          } else if (st.glaze === 'french'){
            const n = Math.max(1, Math.round(w / 1.7));
            for (let m = 0; m < n; m++){ const x = u.a0 + w * (m + .5) / n; win(x, y0 + .15 + 1.15, .95, 2.3); frame4(x, y0 + 1.3, .95, 2.3); fb(M.rail, x, y0 + .62, .28, 1.15, .9, .02); fb(frame, x, y0 + 1.08, .28, 1.2, .04, .05) }
          }
          // подсветка и полёт камеры
          tmp.makeScale(w - .2, FH - .2, .3).setPosition(cx, y0 + FH / 2, .15); apt.m = fm.clone().multiply(tmp);
          apt.pos = new THREE.Vector3(cx, y0 + FH / 2, .1).applyMatrix4(fm);
          apt.n = new THREE.Vector3(0, 0, 1).transformDirection(fm);
          apts.push(apt);
        });
        // пилоны между квартирами
        if (st.glaze === 'punched' || st.glaze === 'grid') units.slice(1).forEach(u => fb(st.glaze === 'grid' ? frame : band, u.a0, y0 + FH / 2, .05, .25, FH, .1));
      }
      // LED-контуры (ночь), как на рендере проекта
      if (st.led){
        led.box(M.led, fm, -fc.len / 2 + .05, (PH + H) / 2, .2, .06, H - PH, .06); led.box(M.led, fm, fc.len / 2 - .05, (PH + H) / 2, .2, .06, H - PH, .06);
        led.box(M.led, fm, 0, H + 1.2, .25, fc.len, .06, .06);
        units.forEach((u, ui) => { if (ui === 0) return; const fa = 2 + ((R() * (F - 6)) | 0), fbb = Math.min(F, fa + 3 + ((R() * 8) | 0)), ya = PH + (fa - 2) * FH, yb = PH + (fbb - 1) * FH;
          led.box(M.led, fm, u.a0, (ya + yb) / 2, .2, .06, yb - ya, .06);
          const nx = units[ui + 1] ? units[ui + 1].a0 : fc.len / 2 - .05; led.box(M.led, fm, (u.a0 + nx) / 2, yb, .2, nx - u.a0, .06, .06); led.box(M.led, fm, (u.a0 + nx) / 2, ya, .2, nx - u.a0, .06, .06) });
      }
    });
  });

  // остекление квартир (кликабельное) + ночное свечение окон
  const aptMesh = new THREE.InstancedMesh(UNIT, M.apt, aptInst.length), glow = new THREE.InstancedMesh(UNIT, M.aptGlow, aptInst.length);
  const instApt = new Int32Array(aptInst.length);
  apts.forEach(a => a.inst.forEach(ii => { instApt[ii] = a.i }));
  const dark = new THREE.Color('#141a24'), glowBase = [];
  aptInst.forEach((m, i) => { aptMesh.setMatrixAt(i, m); glow.setMatrixAt(i, m); aptMesh.setColorAt(i, apts[instApt[i]].glass);
    const gc = R() < .5 ? new THREE.Color().setHSL(.09 + R() * .03, .75, .55 + R() * .2) : dark; glowBase.push(gc); glow.setColorAt(i, gc) });
  aptMesh.castShadow = false; aptMesh.receiveShadow = true; scene.add(aptMesh); glow.visible = false; scene.add(glow);

  /* ===== участок ===== */
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  const grow = pts => pts.forEach(([px, pz]) => { x0 = Math.min(x0, px); x1 = Math.max(x1, px); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz) });
  c.buildings.forEach(B => grow(footprint(B.x, B.z, B.r || 0, B.w, B.d)));
  const ex = c.extras || {};
  if (ex.school) grow(footprint(ex.school.x, ex.school.z, 0, 44, 18)); if (ex.stadium) grow(footprint(ex.stadium.x, ex.stadium.z, 0, 52, 30)); if (ex.kindergarten) grow(footprint(ex.kindergarten.x, ex.kindergarten.z, 0, 32, 16));
  const pad = 9, rw = 12, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, bw = x1 - x0, bd = z1 - z0;
  scene.add(groundPlane(1600, 1600, M.grass, cx, 0, cz));
  scene.add(groundPlane(bw + 2 * pad, bd + 2 * pad, M.paving, cx, .03, cz));
  const RX0 = x0 - pad - rw / 2, RX1 = x1 + pad + rw / 2, RZ0 = z0 - pad - rw / 2, RZ1 = z1 + pad + rw / 2;
  scene.add(groundPlane(RX1 - RX0 + rw, rw, M.asphalt, cx, .05, RZ0), groundPlane(RX1 - RX0 + rw, rw, M.asphalt, cx, .05, RZ1),
            groundPlane(rw, RZ1 - RZ0 - rw, M.asphalt, RX0, .05, cz), groundPlane(rw, RZ1 - RZ0 - rw, M.asphalt, RX1, .05, cz));
  for (let x = RX0; x < RX1; x += 6){ box.box(M.mark, null, x, .07, RZ0, 3, .02, .15); box.box(M.mark, null, x, .07, RZ1, 3, .02, .15) }
  for (let z = RZ0 + 6; z < RZ1 - 4; z += 6){ box.box(M.mark, null, RX0, .07, z, .15, .02, 3); box.box(M.mark, null, RX1, .07, z, .15, .02, 3) }
  [[cx, z0 - pad, bw + 2 * pad, .3], [cx, z1 + pad, bw + 2 * pad, .3]].forEach(([x, z, w, d]) => box.box(M.curb, null, x, .1, z, w, .2, d));
  [[x0 - pad, cz], [x1 + pad, cz]].forEach(([x, z]) => box.box(M.curb, null, x, .1, z, .3, .2, bd + 2 * pad));
  for (let k = 0; k < 7; k++){ box.box(M.mark, null, cx - 3 + k, .07, RZ1, .5, .02, rw - 2); box.box(M.mark, null, RX0, .07, cz - 3 + k, rw - 2, .02, .5) }
  // машины
  const carCols = ['#e9e9e7', '#1d1f22', '#8d9196', '#3b4f66', '#7a2a2a', '#c8c2b6', '#2f4a3e', '#b9bcc0'].map(h => new THREE.Color(h));
  const park = (x, z, ry) => { const col = carCols[(R() * carCols.length) | 0]; q.setFromAxisAngle(Y, ry);
    carBody.mtx(M.car, tmp.compose(new THREE.Vector3(x, .62, z), q, sc.set(1, 1, 1)), col);
    carCab.mtx(M.carGlass, tmp.compose(new THREE.Vector3(x - Math.cos(ry) * .2, 1.18, z + Math.sin(ry) * .2), q, sc.set(1, 1, 1)));
    for (const [wx, wz] of [[1.4, .85], [-1.4, .85], [1.4, -.85], [-1.4, -.85]]){ const px = x + wx * Math.cos(ry) + wz * Math.sin(ry), pz = z - wx * Math.sin(ry) + wz * Math.cos(ry);
      cyl.mtx(M.tire, tmp.compose(new THREE.Vector3(px, .34, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, ry, 0, 'YXZ')), sc.set(.68, .24, .68))) } };
  for (let x = RX0 + 8; x < RX1 - 8; x += 5.6){ if (R() < .6) park(x, RZ0 + rw / 2 - 1.3, 0); if (R() < .6) park(x, RZ1 - rw / 2 + 1.3, PI) }
  for (let z = RZ0 + 10; z < RZ1 - 10; z += 5.6){ if (R() < .5) park(RX1 - rw / 2 + 1.3, z, PI / 2); if (R() < .3) park(RX0 + rw / 2 - 1.3, z, -PI / 2) }
  // фонари
  const lampAt = (x, z, h = 7) => { cyl.mtx(M.pole, tmp.compose(new THREE.Vector3(x, h / 2, z), q.identity(), sc.set(.16, h, .16))); box.box(M.pole, null, x, h, z, .9, .12, .3); box.box(M.lamp, null, x, h - .08, z, .7, .04, .22) };
  for (let x = RX0; x <= RX1; x += 24){ lampAt(x, z0 - pad - .8); lampAt(x, z1 + pad + .8) }
  for (let z = RZ0 + 12; z <= RZ1 - 12; z += 24){ lampAt(x0 - pad - .8, z); lampAt(x1 + pad + .8, z) }
  // деревья
  const tree = (x, z, s = 1, conifer = false) => { const h = (3 + R() * 2) * s; trunks.mtx(M.trunk, tmp.compose(new THREE.Vector3(x, h / 2, z), q.identity(), sc.set(.26 * s, h, .26 * s)));
    const r = (1.5 + R() * 1.1) * s, col = new THREE.Color().setHSL(.22 + R() * .08, .3 + R() * .18, .24 + R() * .1);
    if (conifer){ crowns.mtx(M.crown, tmp.compose(new THREE.Vector3(x, h + r * .9, z), q.identity(), sc.set(r * .55, r * 1.6, r * .55)), col.offsetHSL(.05, 0, -.06)); return }
    crowns.mtx(M.crown, tmp.compose(new THREE.Vector3(x, h + r * .55, z), q.setFromAxisAngle(Y, R() * 6), sc.set(r, r * (1 + R() * .3), r)), col);
    if (R() < .6) crowns.mtx(M.crown, tmp.compose(new THREE.Vector3(x + (R() - .5) * r, h + r * 1.1, z + (R() - .5) * r), q, sc.set(r * .7, r * .7, r * .7)), col.clone().offsetHSL(0, 0, .05)) };
  for (let x = RX0; x <= RX1; x += 9){ tree(x + 3, RZ0 - rw / 2 - 3); tree(x, RZ1 + rw / 2 + 3) }
  for (let z = RZ0; z <= RZ1; z += 9){ tree(RX0 - rw / 2 - 3, z); tree(RX1 + rw / 2 + 3, z + 4) }
  for (let x = x0 - pad + 3; x < x1 + pad - 3; x += 11){ tree(x, z0 - pad + 2, .8); tree(x + 4, z1 + pad - 2, .8) }

  /* ===== дворы ===== */
  (c.yards || []).forEach((Yd, yi) => {
    const yx0 = Yd.x - Yd.w / 2, yz0 = Yd.z - Yd.d / 2;
    scene.add(groundPlane(Yd.w, Yd.d, M.pavers, Yd.x, .06, Yd.z));
    const cols = Math.max(2, Math.round(Yd.w / 16)), rows = Math.max(1, Math.round(Yd.d / 15)), cw = Yd.w / cols, ch = Yd.d / rows;
    const types = []; for (let i = 0; i < cols * rows; i++) types.push(['lawn', 'play', 'lawn', 'pergola', 'play2', 'lawn', 'sport'][(i + yi * 2) % 7]);
    types.forEach((t, i) => {
      const ci = i % cols, ri = (i / cols) | 0, ccx = yx0 + cw * (ci + .5), ccz = yz0 + ch * (ri + .5), w = cw - 3, d = ch - 3;
      if (t === 'lawn'){ // приподнятые бетонные клумбы с газоном
        const ph2 = .45; box.box(M.concrete, null, ccx, ph2 / 2 + .06, ccz, w, ph2, d); scene.add(groundPlane(w - .3, d - .3, M.lawn, ccx, ph2 + .07, ccz));
        const n = Math.max(2, Math.round(w * d / 45)); for (let k = 0; k < n; k++) tree(ccx + (R() - .5) * (w - 3), ccz + (R() - .5) * (d - 3), .8 + R() * .3, R() < .3);
        for (let k = 0; k < w * 1.2; k++){ const br = .3 + R() * .3; sph.mtx(M.crown, tmp.compose(new THREE.Vector3(ccx + (R() - .5) * (w - 1), ph2 + .1 + br * .4, ccz + (R() < .5 ? -1 : 1) * (d / 2 - .7)), q.identity(), sc.set(br, br * .7, br)), new THREE.Color().setHSL(.26 + R() * .06, .35, .28 + R() * .1)) }
        for (let k = 0; k < 3; k++){ box.box(M.wood, null, ccx - w / 3 + k * w / 3, .5, ccz + d / 2 + .6, 1.6, .08, .5); box.box(M.concrete, null, ccx - w / 3 + k * w / 3, .25, ccz + d / 2 + .6, 1.4, .45, .35) }
      } else if (t === 'play' || t === 'play2'){ // цветное резиновое покрытие и комплексы
        const m1 = M.rubber[(i + yi) % M.rubber.length], m2 = M.rubber[(i + yi + 1) % M.rubber.length];
        const p1 = BM(w, .06, d, m1, ccx, .09, ccz); p1.castShadow = false; scene.add(p1);
        const disc = CY(Math.min(w, d) * .28, Math.min(w, d) * .28, .07, m2, ccx + w * .2, .1, ccz - d * .1, 40); disc.castShadow = false; scene.add(disc);
        if (t === 'play'){ // деревянная башня с трубой-горкой
          const tx = ccx - w * .22, tz = ccz;
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box.box(M.wood, null, tx + a * 1.2, 2.1, tz + b * 1.2, .14, 4.2, .14));
          box.box(M.wood, null, tx, 1.6, tz, 2.6, .12, 2.6); box.box(M.wood, null, tx, 3.2, tz, 2.6, .12, 2.6);
          for (let k = -1.1; k <= 1.1; k += .22){ box.box(M.wood, null, tx + k, 2.4, tz - 1.25, .08, 1.4, .05); box.box(M.wood, null, tx + k, 3.9, tz + 1.25, .08, 1.3, .05) }
          box.box(cm(c.playColors[1], .6, .1), null, tx, 4.4, tz, 2.8, .1, 2.8);
          const tube = CY(.45, .45, 4.4, M.steel, tx + 2.5, 1.9, tz, 20); tube.rotation.z = 1.05; scene.add(tube);
        } else { // многогранники-скалодромы
          for (let k = 0; k < 5; k++){ const rr2 = 1 + R() * .5; icos.mtx(M.steel, tmp.compose(new THREE.Vector3(ccx - w * .25 + k * 1.6, rr2 * .85, ccz + (R() - .5) * 2), q.setFromEuler(new THREE.Euler(R(), R(), R())), sc.set(rr2, rr2, rr2)), new THREE.Color(R() < .5 ? '#ffffff' : c.playColors[k % 4])) }
          box.box(M.pole, null, ccx + w * .25, 1.2, ccz + d * .2, 3.4, .12, .12); [-1.6, 1.6].forEach(o => box.box(M.pole, null, ccx + w * .25 + o, .6, ccz + d * .2, .1, 1.2, .1));
        }
      } else if (t === 'pergola'){ // круглая пергола, гравий, скульптура
        scene.add(groundPlane(w, d, M.gravel, ccx, .08, ccz));
        const rad = Math.min(w, d) * .35, ring = new THREE.Mesh(new THREE.TorusGeometry(rad, .22, 8, 48), M.wood); ring.rotation.x = PI / 2; ring.position.set(ccx, 3.1, ccz); ring.castShadow = true; scene.add(ring);
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(rad - .9, .12, 8, 48), M.pole); ring2.rotation.x = PI / 2; ring2.position.set(ccx, 3.0, ccz); scene.add(ring2);
        for (let k = 0; k < 10; k++){ const a = k / 10 * PI * 2; cyl.mtx(M.pole, tmp.compose(new THREE.Vector3(ccx + Math.cos(a) * rad, 1.5, ccz + Math.sin(a) * rad), q.identity(), sc.set(.14, 3, .14))) }
        for (let k = 0; k < 3; k++) icos.mtx(M.steel, tmp.compose(new THREE.Vector3(ccx + (k - 1) * .9, 1, ccz), q.setFromEuler(new THREE.Euler(0, k, .3)), sc.set(.35, 1, .35)), new THREE.Color('#ffffff'));
        const seat = CY(rad - .6, rad - .6, .45, M.wood, ccx, .3, ccz, 40); seat.scale.set(1, 1, 1); scene.add(seat);
      } else { // спортплощадка
        const p = BM(w, .06, d, M.rubber[2], ccx, .09, ccz); p.castShadow = false; scene.add(p);
        box.box(M.mark, null, ccx, .13, ccz, w - 1, .01, .08); box.box(M.mark, null, ccx, .13, ccz - d / 2 + .6, w - 1, .01, .08); box.box(M.mark, null, ccx, .13, ccz + d / 2 - .6, w - 1, .01, .08);
        [-1, 1].forEach(s => { box.box(M.pole, null, ccx + s * (w / 2 - .8), 1.5, ccz, .1, 3, .1); box.box(M.mark, null, ccx + s * (w / 2 - .9), 3, ccz, .05, 1.1, 1.8) });
      }
    });
    // фонари двора
    for (let x = yx0 + 4; x < yx0 + Yd.w; x += 12) for (const zz of [yz0 + 1, yz0 + Yd.d - 1]){ cyl.mtx(M.pole, tmp.compose(new THREE.Vector3(x, 1.9, zz), q.identity(), sc.set(.1, 3.8, .1))); sph.mtx(M.lamp, tmp.compose(new THREE.Vector3(x, 3.9, zz), q.identity(), sc.set(.2, .2, .2))) }
  });

  /* ===== инфраструктура ===== */
  const tags = [];
  if (c.yards && c.yards[0]) tags.push({name: 'Закрытый двор', sub: 'без машин', pos: new THREE.Vector3(c.yards[0].x, 4, c.yards[0].z)});
  if (ex.school) tags.push({name: 'Школа', sub: 'на 1 550 мест', pos: new THREE.Vector3(ex.school.x, 16, ex.school.z)});
  if (ex.kindergarten) tags.push({name: 'Детский сад', sub: 'в квартале', pos: new THREE.Vector3(ex.kindergarten.x, 10, ex.kindergarten.z)});
  if (ex.stadium) tags.push({name: 'Стадион', sub: 'при школе', pos: new THREE.Vector3(ex.stadium.x, 4, ex.stadium.z)});
  if (ex.church) tags.push({name: 'Храм', sub: '', pos: new THREE.Vector3(ex.church.x, 21, ex.church.z)});
  if (ex.school){ const s = ex.school; const b = BM(44, 13, 18, M.ctx, s.x, 6.5, s.z); scene.add(b); box.box(cm('#e6a23c', .6, .1), null, s.x, 13.2, s.z, 44.4, .5, 18.4) }
  if (ex.kindergarten){ const s = ex.kindergarten; scene.add(BM(32, 7, 16, M.ctx, s.x, 3.5, s.z)); box.box(cm('#7bb661', .6, .1), null, s.x, 7.2, s.z, 32.4, .4, 16.4) }
  if (ex.stadium){ const s = ex.stadium; const tr = BM(52, .05, 30, M.track, s.x, .08, s.z); tr.castShadow = false; scene.add(tr); const fl = BM(40, .06, 18, M.field, s.x, .1, s.z); fl.castShadow = false; scene.add(fl);
    box.box(M.mark, null, s.x, .14, s.z, .12, .01, 18); for (const sx of [-1, 1]) box.box(M.mark, null, s.x + sx * 19.5, 1.2, s.z, .12, 2.4, 7.3) }
  if (ex.church){ const s = ex.church; scene.add(BM(10, 8, 14, M.churchWall, s.x, 4, s.z)); scene.add(BM(5, 6, 5, M.churchWall, s.x, 11, s.z));
    scene.add(SP(2.6, M.dome, s.x, 14.4, s.z, 1, 1.25, 1)); scene.add(CY(.06, .06, 2.6, M.gold, s.x, 18.5, s.z, 6)); box.box(M.gold, null, s.x, 19, s.z, 1.1, .1, .1);
    for (const [ox, oz] of [[-3, 4.5], [3, 4.5]]){ scene.add(SP(1.1, M.dome, s.x + ox, 9.6, s.z + oz, 1, 1.3, 1)); scene.add(BM(2, 1.5, 2, M.churchWall, s.x + ox, 8.4, s.z + oz)) } }
  if (ex.rail){ const z = ex.rail.z; scene.add(groundPlane(1600, 8, M.gravel, cx, .04, z)); for (const o of [-1.5, 1.5]){ box.box(M.steel, null, cx, .2, z + o - .7, 1600, .15, .08); box.box(M.steel, null, cx, .2, z + o + .7, 1600, .15, .08) }
    for (let k = 0; k < 9; k++) carBody.mtx(cm('#c8352d', .4, .4), tmp.compose(new THREE.Vector3(cx - 80 + k * 21, 2.2, z - 1.5), q.identity(), sc.set(4.6, 4.2, 1.8))) }
  if (ex.water){ const wz = RZ1 + rw / 2 + 12; scene.add(groundPlane(1600, 400, M.water, cx, .02, wz + 200)); box.box(M.paving, null, cx, .1, wz - 3, 1600, .2, 6); box.box(M.curb, null, cx, .5, wz - .1, 1600, .8, .3) }
  if (ex.arch){ const a = new THREE.Mesh(new THREE.TorusGeometry(9, .35, 10, 60, PI), M.wood); a.position.set(ex.arch.x + c.yards[0].x * 0, 0, ex.arch.z); a.castShadow = true; scene.add(a) }

  // окружающая застройка (панельные дома с окнами)
  const Rin = Math.max(bw, bd) / 2 + 55;
  for (let i = 0; i < 70; i++){ const a = R() * PI * 2, rr = Rin + R() * 240, x = cx + Math.cos(a) * rr * 1.1, z = cz + Math.sin(a) * rr;
    if (ex.water && z > RZ1) continue; if (ex.rail && Math.abs(z - ex.rail.z) < 14) continue;
    const h = R() < .25 ? 30 + R() * 30 : 9 + R() * 20, w = 14 + R() * 26, d = 12 + R() * 4;
    const m = BM(w, h, d, M.ctx, x, h / 2, z); m.rotation.y = (R() < .5 ? 0 : PI / 2) + (R() - .5) * .2; scene.add(m);
    if (R() < .7) tree(x + (R() - .5) * 34, z + (R() - .5) * 34, 1.1) }

  [box, crowns, trunks, cyl, sph, icos, carBody, carCab].forEach(b => b.build(scene));
  led.build(nightGroup, false);
  // солнце и тени
  const span = Math.max(bw, bd) / 2 + 40;
  sun.position.set(cx + span * .7, span * 1.4 + maxH, cz + span * .9); sun.target.position.set(cx, 0, cz);
  sun.castShadow = true; sun.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {left: -span, right: span, top: span, bottom: -span, near: 1, far: span * 4 + maxH * 2}); sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .04;

  const hl = new THREE.Mesh(UNIT, new THREE.MeshBasicMaterial({color: new THREE.Color(1.4, 1.1, .6), transparent: true, opacity: .55, depthWrite: false}));
  hl.visible = false; scene.add(hl);
  if (ex.water) tags.push({name: 'Набережная', sub: 'река рядом', pos: new THREE.Vector3(cx, 3, RZ1 + rw / 2 + 10)});
  return {c, scene, apts, corps, tags, aptMesh, glow, glowBase, instApt, hl, maxH, center: new THREE.Vector3(cx, 0, cz), size: Math.max(bw, bd),
    night: false, sun, hemi, skyDay, skyNight, M, nightGroup, fogDay: new THREE.Color(c.sky[1])};
}

function setNight(cs, on){
  cs.night = on; const s = cs.scene;
  s.background = on ? cs.skyNight : cs.skyDay; s.fog.color.set(on ? '#121a28' : cs.fogDay);
  s.environment = on ? null : ENV.sky[cs.c.id];
  cs.sun.intensity = on ? .25 : 2.3; cs.sun.color.set(on ? '#9fb4e0' : '#fff0d8'); cs.hemi.intensity = on ? .18 : .5; cs.hemi.color.set(on ? '#7d8fb8' : '#eaf2ff');
  cs.nightGroup.visible = on; cs.glow.visible = on; cs.M.ctx.emissiveIntensity = on ? 1.2 : 0;
  cs.M.lamp.color.setRGB(on ? 3 : 1.3, on ? 2.6 : 1.25, on ? 1.8 : 1.1);
  renderer.toneMappingExposure = on ? 1.1 : 1;
}
