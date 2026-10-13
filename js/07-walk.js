/* ---------- прогулка от первого лица ---------- */
const WALK = {yaw: 0, pitch: 0, pos: new THREE.Vector3(), keys: {}, joy: {x: 0, y: 0}, bob: 0, look: null, auto: null};
const RADIUS = .24;

function walkBoxes(){ const A = state.as, out = A.cols.slice(); A.rooms.forEach(r => r.items.forEach(it => { if (it.box && it.o.visible) out.push(it.box) })); return out }
function resolve(p, boxes){
  const A = state.as;
  for (let pass = 0; pass < 2; pass++) for (const b of boxes){
    const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= RADIUS * RADIUS) continue;
    if (d2 > 1e-9){ const d = Math.sqrt(d2); p.x = cx + dx / d * RADIUS; p.z = cz + dz / d * RADIUS }
    else { const l = p.x - b.x0, r = b.x1 - p.x, t = p.z - b.z0, bt = b.z1 - p.z, m = Math.min(l, r, t, bt);
      if (m === l) p.x = b.x0 - RADIUS; else if (m === r) p.x = b.x1 + RADIUS; else if (m === t) p.z = b.z0 - RADIUS; else p.z = b.z1 + RADIUS }
  }
  p.x = clamp(p.x, -A.W / 2 + .3, A.W / 2 - .3); p.z = clamp(p.z, -A.D / 2 + .3, A.D / 2 - .3);
}
function segmentClear(a, b, boxes){
  const n = Math.ceil(a.distanceTo(b) / .1);
  for (let i = 1; i <= n; i++){ const x = a.x + (b.x - a.x) * i / n, z = a.z + (b.z - a.z) * i / n;
    for (const bx of boxes) if (x > bx.x0 - .15 && x < bx.x1 + .15 && z > bx.z0 - .15 && z < bx.z1 + .15) return false }
  return true;
}
function walkUpdate(dt){
  const k = state.touring ? {} : WALK.keys; let fx = 0, fz = 0;
  if (k.KeyW || k.ArrowUp) fz += 1; if (k.KeyS || k.ArrowDown) fz -= 1; if (k.KeyA || k.ArrowLeft) fx -= 1; if (k.KeyD || k.ArrowRight) fx += 1;
  fx += WALK.joy.x; fz -= WALK.joy.y;
  const len = Math.hypot(fx, fz);
  if (len > .05 && !WALK.auto){
    const sp = ((k.ShiftLeft || k.ShiftRight) ? 3 : 1.5) * dt / Math.max(1, len), s = Math.sin(WALK.yaw), c = Math.cos(WALK.yaw);
    const boxes = walkBoxes();
    WALK.pos.x += (-s * fz + c * fx) * sp; resolve(WALK.pos, boxes);
    WALK.pos.z += (-c * fz - s * fx) * sp; resolve(WALK.pos, boxes);
    WALK.bob += dt * 8.5;
  }
  camera.position.set(WALK.pos.x, EYE + Math.sin(WALK.bob) * .022, WALK.pos.z);
  camera.rotation.set(WALK.pitch, WALK.yaw, 0, 'YXZ');
  drawMini();
}
function walkTo(point){
  const A = state.as, target = new THREE.Vector3(point.x, 0, point.z); resolve(target, walkBoxes());
  const from = WALK.pos.clone(), dist = from.distanceTo(target); if (dist < .2) return;
  if (WALK.auto) WALK.auto.kill();
  if (segmentClear(from, target, walkBoxes())){
    WALK.auto = gsap.to(WALK.pos, {x: target.x, z: target.z, duration: Math.max(.5, dist / 1.6), ease: 'power1.inOut', onUpdate(){ WALK.bob += .12 }, onComplete(){ WALK.auto = null }});
  } else {
    WALK.auto = gsap.timeline({onComplete(){ WALK.auto = null }}).to('#fade', {opacity: 1, duration: .22}).call(() => WALK.pos.copy(target)).to('#fade', {opacity: 0, duration: .3});
  }
}
function drawMini(){
  const A = state.as, cvs = $('#mini'); if (!A || !cvs.offsetWidth) return;
  const w = cvs.offsetWidth, dpr = Math.min(devicePixelRatio, 2), pad = 12, k = (w - pad * 2) / A.W, h = A.D * k + pad * 2;
  if (cvs.width !== Math.round(w * dpr)){ cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr); cvs.style.height = h + 'px' }
  const g = cvs.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const X = x => pad + (x + A.W / 2) * k, Z = z => pad + (z + A.D / 2) * k;
  A.rooms.forEach(r => { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(pad + r.x * k, pad + r.z * k, r.w * k, r.d * k) });
  g.fillStyle = 'rgba(236,214,170,.85)'; A.cols.forEach(b => g.fillRect(X(b.x0), Z(b.z0), Math.max(1, (b.x1 - b.x0) * k), Math.max(1, (b.z1 - b.z0) * k)));
  const px = X(WALK.pos.x), pz = Z(WALK.pos.z), dir = -WALK.yaw - PI / 2;
  g.fillStyle = 'rgba(201,164,106,.28)'; g.beginPath(); g.moveTo(px, pz); g.arc(px, pz, 26, dir - .55, dir + .55); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(px, pz, 4, 0, 7); g.fill();
}
function initWalkInput(){
  addEventListener('keydown', e => { if (state.view === 'walk' && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){ WALK.keys[e.code] = true; if (e.code.startsWith('Arrow')) e.preventDefault() } });
  addEventListener('keyup', e => { WALK.keys[e.code] = false });
  addEventListener('blur', () => { WALK.keys = {} });
  const cvs = renderer.domElement; let drag = null, lastTap = 0;
  cvs.addEventListener('pointerdown', e => { if (state.view !== 'walk' || state.busy || state.touring) return; drag = {x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0}; cvs.setPointerCapture(e.pointerId) });
  cvs.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    const s = e.pointerType === 'touch' ? .005 : .0035; WALK.yaw -= dx * s; WALK.pitch = clamp(WALK.pitch - dy * s, -1.2, 1.2) });
  cvs.addEventListener('pointerup', e => { if (!drag) return; const was = drag; drag = null; if (was.moved > 6) return;
    const now = performance.now(); if (now - lastTap < 350){ const mouse = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(mouse, camera); const hit = ray.intersectObjects(state.as.floors, false)[0]; if (hit) walkTo(hit.point) } lastTap = now });
  // джойстик
  const joy = $('#joy'), knob = $('#knob'); let jid = null;
  const jmove = e => { const r = joy.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = r.width / 2 - 10, d = Math.min(m, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    const x = Math.cos(a) * d, y = Math.sin(a) * d; knob.style.transform = 'translate(' + x + 'px,' + y + 'px)'; WALK.joy.x = x / m; WALK.joy.y = y / m };
  joy.addEventListener('pointerdown', e => { jid = e.pointerId; joy.setPointerCapture(jid); jmove(e) });
  joy.addEventListener('pointermove', e => { if (e.pointerId === jid) jmove(e) });
  const jend = e => { if (e.pointerId !== jid) return; jid = null; knob.style.transform = ''; WALK.joy.x = WALK.joy.y = 0 };
  joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
}
