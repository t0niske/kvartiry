/* ---------- процедурные текстуры и окружение ---------- */
const TEX = {}, ENV = {};
let MAXANISO = 8;
function cv(w, h = w){const c = document.createElement('canvas'); c.width = w; c.height = h; return c}
function tx(c, m, srgb = true){
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = MAXANISO;
  if (m) t.repeat.set(1 / m, 1 / m); return t;
}
function makeTextures(){
  const R = rng(1234);
  const speck = (g, s, n, cols, a, sz = 2.2) => { for (let i = 0; i < n; i++){ g.fillStyle = cols[(R() * cols.length) | 0] + (R() * a).toFixed(3) + ')'; const r = R() * sz + .4; g.fillRect(R() * s, R() * s, r, r) } };
  const blot = (g, s, n, col, a, r0, r1) => { for (let i = 0; i < n; i++){ const x = R() * s, y = R() * s, r = r0 + R() * (r1 - r0), al = (R() * a).toFixed(3);
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]){ const X = x + dx, Y = y + dy; if (X + r < 0 || X - r > s || Y + r < 0 || Y - r > s) continue;
      const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, col + al + ')'); gr.addColorStop(1, col + '0)'); g.fillStyle = gr; g.fillRect(X - r, Y - r, 2 * r, 2 * r) } } };
  const grain = (g, x, y, w, h, col, n, a) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let k = 0; k < n; k++){ g.strokeStyle = col + (R() * a).toFixed(3) + ')'; g.lineWidth = .5 + R() * 1.8; g.beginPath();
      const yy = y + R() * h, A = (R() - .5) * 6; g.moveTo(x - 2, yy); g.bezierCurveTo(x + w * .33, yy + A, x + w * .66, yy - A, x + w + 2, yy + (R() - .5) * 3); g.stroke() }
    g.restore() };

  // бетон
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#a9a69f'; g.fillRect(0, 0, s, s);
    blot(g, s, 70, 'rgba(70,68,64,', .17, 40, 230); blot(g, s, 50, 'rgba(236,233,226,', .16, 30, 180);
    speck(g, s, 42000, ['rgba(255,255,250,', 'rgba(48,46,43,'], .15);
    for (let i = 0; i < 70; i++){ g.fillStyle = 'rgba(45,43,40,' + (.2 + R() * .35) + ')'; g.beginPath(); g.arc(R() * s, R() * s, 1 + R() * 2.6, 0, 7); g.fill() }
    TEX.concrete = tx(c, 2.4) }
  // декоративная штукатурка
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#efe8dc'; g.fillRect(0, 0, s, s);
    blot(g, s, 90, 'rgba(176,158,130,', .1, 60, 280); blot(g, s, 60, 'rgba(255,255,255,', .25, 40, 200); speck(g, s, 16000, ['rgba(255,255,255,', 'rgba(150,130,100,'], .07);
    TEX.plaster = tx(c, 2.2) }
  // краска
  { const s = 512, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#f5f3ef'; g.fillRect(0, 0, s, s);
    blot(g, s, 30, 'rgba(200,192,180,', .05, 40, 160); speck(g, s, 6000, ['rgba(255,255,255,', 'rgba(170,160,150,'], .05);
    TEX.paint = tx(c, 2) }
  // ламинат (дуб)
  { const s = 1024, c = cv(s), g = c.getContext('2d'); const rows = 8, h = s / rows;
    for (let r = 0; r < rows; r++){ const L1 = s * (.35 + R() * .3), o = R() * s, lens = [L1, s - L1];
      let x = o; lens.forEach(L => { const hue = 30 + R() * 6, sat = 26 + R() * 12, l = 61 + R() * 9;
        for (const dx of [-s, 0]){ const X = x + dx; g.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + l + '%)'; g.fillRect(X, r * h, L, h);
          grain(g, X, r * h, L, h, 'rgba(105,70,38,', 34, .22); g.fillStyle = 'rgba(70,48,25,.5)'; g.fillRect(X, r * h, 2, h) }
        x += L }); g.fillStyle = 'rgba(70,48,25,.45)'; g.fillRect(0, r * h, s, 2) }
    TEX.laminate = tx(c, 1.8) }
  // паркет ёлочкой
  { const s = 1024, c = cv(s), g = c.getContext('2d'); const cw = 128, ph = 64;
    for (let col = 0; col < s / cw; col++){ const dir = col % 2 ? 1 : -1, x0 = col * cw; g.save(); g.beginPath(); g.rect(x0, 0, cw, s); g.clip();
      for (let y = -cw * 2; y < s + cw * 2; y += ph){ const l = 33 + R() * 11;
        g.fillStyle = 'hsl(' + (22 + R() * 8) + ',' + (34 + R() * 12) + '%,' + l + '%)';
        g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + cw, y + dir * cw * .5); g.lineTo(x0 + cw, y + dir * cw * .5 + ph); g.lineTo(x0, y + ph); g.closePath(); g.fill();
        for (let k = 0; k < 9; k++){ g.strokeStyle = 'rgba(40,24,12,' + (R() * .22) + ')'; g.lineWidth = .6 + R(); const oo = R() * ph; g.beginPath(); g.moveTo(x0, y + oo); g.lineTo(x0 + cw, y + oo + dir * cw * .5); g.stroke() }
        g.strokeStyle = 'rgba(25,15,8,.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + cw, y + dir * cw * .5); g.stroke() }
      g.restore(); g.fillStyle = 'rgba(25,15,8,.5)'; g.fillRect(x0, 0, 1.5, s) }
    TEX.herring = tx(c, 1.3) }
  // плитка светлая 60×60
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#c9c5bd'; g.fillRect(0, 0, s, s); const t = s / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++){ g.fillStyle = 'hsl(40,' + (5 + R() * 3) + '%,' + (90 + R() * 2.5) + '%)'; g.fillRect(i * t + 3, j * t + 3, t - 6, t - 6) }
    speck(g, s, 6000, ['rgba(150,140,125,'], .06); TEX.tile = tx(c, 1.2) }
  // плитка тёмная под камень 60×120
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#1e1f21'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2; i++){ g.fillStyle = 'hsl(30,3%,' + (27 + R() * 4) + '%)'; g.fillRect(i * 512 + 2, 2, 508, s - 4) }
    g.save(); for (let k = 0; k < 26; k++){ g.strokeStyle = 'rgba(225,218,205,' + (R() * .2) + ')'; g.lineWidth = R() * 1.8 + .3; g.shadowColor = 'rgba(225,218,205,.25)'; g.shadowBlur = 4;
      g.beginPath(); let x = R() * s, y = R() * s; g.moveTo(x, y); for (let q = 0; q < 6; q++){ x += R() * 160 - 80; y += R() * 160 - 40; g.lineTo(x, y) } g.stroke() } g.restore();
    TEX.tileDark = tx(c, 1.2) }
  // мрамор
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#f1efea'; g.fillRect(0, 0, s, s); blot(g, s, 30, 'rgba(190,185,178,', .12, 60, 260);
    g.save(); for (let k = 0; k < 20; k++){ g.strokeStyle = 'rgba(120,114,108,' + (.08 + R() * .25) + ')'; g.lineWidth = R() * 2 + .4; g.shadowColor = 'rgba(120,114,108,.4)'; g.shadowBlur = 6;
      g.beginPath(); let x = R() * s, y = R() * s; g.moveTo(x, y); for (let q = 0; q < 8; q++){ x += R() * 140 - 50; y += R() * 120 - 60; g.lineTo(x, y) } g.stroke() } g.restore();
    TEX.marble = tx(c, 1.2) }
  // ткань (рогожка)
  { const s = 512, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#ece8e2'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2){ g.fillStyle = 'rgba(0,0,0,' + (.02 + R() * .04) + ')'; g.fillRect(0, y, s, 1) }
    for (let x = 0; x < s; x += 2){ g.fillStyle = 'rgba(255,255,255,' + (.03 + R() * .05) + ')'; g.fillRect(x, 0, 1, s) }
    speck(g, s, 9000, ['rgba(255,255,255,', 'rgba(0,0,0,'], .08, 1.4); TEX.fabric = tx(c, .3) }
  // лён
  { const s = 512, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#f0ebe3'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++){ const y = R() * s; g.fillStyle = 'rgba(120,100,80,' + (R() * .07) + ')'; g.fillRect(R() * s, y, 20 + R() * 120, 1 + R()) }
    for (let i = 0; i < 900; i++){ g.fillStyle = 'rgba(120,100,80,' + (R() * .06) + ')'; g.fillRect(R() * s, R() * s, 1, 20 + R() * 120) }
    TEX.linen = tx(c, .5) }
  // шпон дуба
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#c69f78'; g.fillRect(0, 0, s, s); grain(g, 0, 0, s, s, 'rgba(110,70,38,', 380, .2); blot(g, s, 30, 'rgba(120,80,45,', .1, 60, 220);
    TEX.wood = tx(c, 1) }
  // орех
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#5f402c'; g.fillRect(0, 0, s, s); grain(g, 0, 0, s, s, 'rgba(25,14,8,', 380, .35); blot(g, s, 30, 'rgba(140,95,60,', .14, 60, 220);
    TEX.walnut = tx(c, 1) }
  // ковёр
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#d9d0c2'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(150,132,108,.35)'; g.lineWidth = 3; for (let i = -s; i < 2 * s; i += 96){ g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke(); g.beginPath(); g.moveTo(i + s, 0); g.lineTo(i, s); g.stroke() }
    speck(g, s, 70000, ['rgba(255,255,255,', 'rgba(90,75,60,'], .12, 1.6); TEX.rug = tx(c, 2) }
  // фасадная штукатурка с панельными швами
  { const s = 1024, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s); blot(g, s, 60, 'rgba(160,155,148,', .07, 60, 280);
    speck(g, s, 20000, ['rgba(120,115,110,', 'rgba(255,255,255,'], .08); g.fillStyle = 'rgba(0,0,0,.07)'; for (let i = 0; i < s; i += 256){ g.fillRect(0, i, s, 3); g.fillRect(i, 0, 3, s) }
    TEX.facade = tx(c, 6) }
  // трава, асфальт, плитка мощения, резина
  { const s = 512, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#6e8a4e'; g.fillRect(0, 0, s, s); blot(g, s, 40, 'rgba(60,80,30,', .25, 20, 120); blot(g, s, 30, 'rgba(160,170,90,', .18, 20, 100);
    speck(g, s, 50000, ['rgba(40,60,20,', 'rgba(150,175,90,'], .3, 1.6); TEX.grass = tx(c, 8) }
  { const s = 512, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#505357'; g.fillRect(0, 0, s, s); blot(g, s, 30, 'rgba(30,30,32,', .2, 30, 140);
    speck(g, s, 40000, ['rgba(200,200,200,', 'rgba(20,20,20,'], .25, 1.5); TEX.asphalt = tx(c, 6) }
  { const s = 512, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#a19d96'; g.fillRect(0, 0, s, s); const pw = 128, phh = 64;
    for (let y = 0; y < s; y += phh) for (let x = -(y / phh % 2) * pw / 2; x < s; x += pw){ g.fillStyle = 'hsl(35,' + (4 + R() * 4) + '%,' + (74 + R() * 8) + '%)'; g.fillRect(x + 2, y + 2, pw - 4, phh - 4) }
    speck(g, s, 12000, ['rgba(90,85,80,'], .12); TEX.paving = tx(c, 2) }
  { const s = 256, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s); speck(g, s, 8000, ['rgba(0,0,0,', 'rgba(255,255,255,'], .25, 1.4); TEX.rubber = tx(c, 2) }

  // мягкая тень по краям для пола/потолка (aoMap)
  { const s = 256, c = cv(s), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); const e = s * .14;
    const lg = (x0, y0, x1, y1, x, y, w, h) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h) };
    lg(0, 0, e, 0, 0, 0, e, s); lg(s, 0, s - e, 0, s - e, 0, e, s); lg(0, 0, 0, e, 0, 0, s, e); lg(0, s, 0, s - e, 0, s - e, s, e);
    TEX.ao = new THREE.CanvasTexture(c) }

  // панорама за окном
  { const W = 2048, H = 640, c = cv(W, H), g = c.getContext('2d'); const hz = H * .58;
    let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#6f9fd3'); gr.addColorStop(1, '#e8eff3'); g.fillStyle = gr; g.fillRect(0, 0, W, hz);
    for (let i = 0; i < 30; i++){ const x = R() * W, y = 30 + R() * hz * .6, rw = 70 + R() * 220, a = .2 + R() * .4;
      for (const dx of [-W, 0, W]){ g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.beginPath(); g.ellipse(x + dx, y, rw, rw * .2, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + dx + rw * .3, y - rw * .08, rw * .5, rw * .16, 0, 0, 7); g.fill() } }
    gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#9aa38b'); gr.addColorStop(1, '#6a745e'); g.fillStyle = gr; g.fillRect(0, hz, W, H - hz);
    const bld = (n, h0, h1, l0, win, base) => { for (let i = 0; i < n; i++){ const x = R() * W, w = 18 + R() * 64, h = h0 + R() * (h1 - h0), l = l0 + R() * 8;
      for (const dx of [-W, 0, W]){ g.fillStyle = 'hsl(210,8%,' + l + '%)'; g.fillRect(x + dx, base - h, w, h);
        if (win){ g.fillStyle = 'rgba(60,85,110,.38)'; for (let yy = base - h + 6; yy < base - 6; yy += 9) for (let xx = x + dx + 4; xx < x + dx + w - 4; xx += 7) g.fillRect(xx, yy, 4, 5) } } } };
    bld(80, 18, 80, 76, false, hz + 3); bld(46, 40, 170, 82, true, hz + 24);
    for (let i = 0; i < 320; i++){ const x = R() * W, r = 6 + R() * 15, y = hz + 22 + R() * 18; for (const dx of [-W, 0, W]){ g.fillStyle = 'hsl(' + (80 + R() * 30) + ',24%,' + (27 + R() * 12) + '%)'; g.beginPath(); g.arc(x + dx, y, r, 0, 7); g.fill() } }
    TEX.pano = tx(c, 0); TEX.pano.wrapT = THREE.ClampToEdgeWrapping }

  // картины
  TEX.art = [0, 1, 2].map(k => { const c = cv(400, 500), g = c.getContext('2d');
    if (k === 0){ g.fillStyle = '#e9e1d4'; g.fillRect(0, 0, 400, 500); [['#c0704f', 150, 210, 110], ['#d9a85b', 250, 300, 90], ['#7f9478', 170, 360, 70]].forEach(([col, x, y, r]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() });
      g.strokeStyle = '#2d2a26'; g.lineWidth = 3; g.beginPath(); g.arc(200, 260, 150, PI * 1.1, PI * 1.9); g.stroke() }
    else if (k === 1){ g.fillStyle = '#25282c'; g.fillRect(0, 0, 400, 500); g.strokeStyle = '#c9a46a'; g.lineWidth = 6; g.beginPath(); g.arc(200, 330, 130, PI, 2 * PI); g.stroke(); g.fillStyle = '#c9a46a'; g.fillRect(60, 380, 280, 4); g.beginPath(); g.arc(270, 160, 26, 0, 7); g.fill() }
    else { const bands = ['#efe6d6', '#e2cfb1', '#c9ab84', '#a8b8bc', '#7e98a0']; bands.forEach((b, i) => { g.fillStyle = b; g.beginPath(); g.moveTo(0, i * 100 + 40); for (let x = 0; x <= 400; x += 20) g.lineTo(x, i * 100 + 40 + Math.sin(x * .02 + i) * 22); g.lineTo(400, 500); g.lineTo(0, 500); g.fill() }) }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t });
}

/* фон неба для улицы */
function skyTexture(top, hor){const c = cv(16, 512), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(.75, hor); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t}

function makeEnvs(){
  const pm = new THREE.PMREMGenerator(renderer);
  // интерьерное окружение: комната с яркими окнами
  { const s = new THREE.Scene(); const B = (c) => new THREE.MeshBasicMaterial({color: c, side: THREE.BackSide});
    const box = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 14), B(new THREE.Color(.55, .52, .48))); box.position.y = 3; s.add(box);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({color: new THREE.Color(.33, .26, .2)})); fl.rotation.x = -PI / 2; fl.position.y = .02; s.add(fl);
    const win = (x, y, z, w, h, ry, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(k * .95, k, k * 1.08), side: THREE.DoubleSide})); m.position.set(x, y, z); m.rotation.y = ry; s.add(m) };
    win(-3, 2.6, 6.95, 3.2, 3.2, PI, 7); win(3, 2.6, 6.95, 3.2, 3.2, PI, 7); win(6.95, 2.6, 0, 4, 2.6, -PI / 2, 3.5);
    const ce = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), new THREE.MeshBasicMaterial({color: new THREE.Color(3, 2.8, 2.5)})); ce.rotation.x = PI / 2; ce.position.set(0, 5.95, 0); s.add(ce);
    ENV.room = pm.fromScene(s, .04).texture }
  // уличное окружение: градиентное небо и солнце
  ENV.sky = {};
  COMPLEXES.forEach(c => {
    const s = new THREE.Scene();
    const sg = new THREE.SphereGeometry(50, 48, 24), pos = sg.attributes.position, cols = [];
    const top = new THREE.Color(c.sky[0]).convertSRGBToLinear(), hor = new THREE.Color(c.sky[1]).convertSRGBToLinear(), gnd = new THREE.Color(c.sky[2]).convertSRGBToLinear(), tc = new THREE.Color();
    for (let i = 0; i < pos.count; i++){ const h = pos.getY(i) / 50;
      if (h > 0) tc.copy(hor).lerp(top, Math.pow(h, .55)); else tc.copy(hor).lerp(gnd, Math.pow(Math.min(-h * 3, 1), .5));
      cols.push(tc.r * 1.2, tc.g * 1.2, tc.b * 1.2) }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    s.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide})));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), new THREE.MeshBasicMaterial({color: new THREE.Color(30, 27, 22)})); sun.position.set(26, 32, 22); s.add(sun);
    ENV.sky[c.id] = pm.fromScene(s, .02).texture;
  });
  pm.dispose();
}
