/* ---------- материалы и мебель ---------- */
const FM = {};
function initMaterials(){
  const S = o => new THREE.MeshStandardMaterial(o);
  Object.assign(FM, {
    sofa: S({color:'#8d918a', map:TEX.fabric, roughness:.95}),
    boucle: S({color:'#ece6dc', map:TEX.fabric, roughness:1}),
    velvet: S({color:'#9a5a3f', map:TEX.fabric, roughness:.75}),
    pillowA: S({color:'#d7c3a3', map:TEX.linen, roughness:.95}),
    pillowB: S({color:'#5f6f62', map:TEX.fabric, roughness:.95}),
    linenW: S({color:'#f4f1ec', map:TEX.linen, roughness:.95}),
    linen2: S({color:'#c4ad8c', map:TEX.linen, roughness:.95}),
    kidLinen: S({color:'#b9cfd6', map:TEX.linen, roughness:.95}),
    headboard: S({color:'#b8a284', map:TEX.fabric, roughness:.95}),
    curtain: S({color:'#efe8dc', map:TEX.linen, roughness:1, side:THREE.DoubleSide}),
    oak: S({color:'#ffffff', map:TEX.wood, roughness:.55}),
    walnut: S({color:'#ffffff', map:TEX.walnut, roughness:.45}),
    white: S({color:'#f3f1ec', roughness:.4}),
    cab: S({color:'#ebe8e2', roughness:.55}),
    kitchen: S({color:'#4b514d', roughness:.55}),
    graphite: S({color:'#2b2c30', roughness:.5}),
    black: S({color:'#141416', roughness:.35, metalness:.4}),
    brass: S({color:'#c8a46a', roughness:.28, metalness:1}),
    brassD: S({color:'#c8a46a', roughness:.3, metalness:1, side:THREE.DoubleSide}),
    chrome: S({color:'#e8e8e8', roughness:.1, metalness:1}),
    steel: S({color:'#b9bcc0', roughness:.28, metalness:.9}),
    marble: S({color:'#ffffff', map:TEX.marble, roughness:.15}),
    ceramic: S({color:'#fbfbf9', roughness:.07}),
    mirror: S({color:'#ffffff', roughness:.02, metalness:1}),
    glass: S({color:'#dcedf5', roughness:.02, metalness:.1, transparent:true, opacity:.16, depthWrite:false}),
    water: S({color:'#cfe5ee', roughness:.04, metalness:.2}),
    screen: S({color:'#08080a', roughness:.1, metalness:.5}),
    leaf: S({color:'#466f3c', roughness:.65, side:THREE.DoubleSide}),
    leaf2: S({color:'#6a9550', roughness:.65}),
    pot: S({color:'#d8cfc1', roughness:.9}),
    terracotta: S({color:'#b56a4b', roughness:.9}),
    soil: S({color:'#3b2e24', roughness:1}),
    rug: S({color:'#ffffff', map:TEX.rug, roughness:1}),
    shade: S({color:'#f4ede2', map:TEX.linen, roughness:1, emissive:new THREE.Color('#ffcf8a'), emissiveIntensity:.55}),
    globe: S({color:'#ffffff', roughness:.3, emissive:new THREE.Color('#fff0d8'), emissiveIntensity:1.3}),
    glow: new THREE.MeshBasicMaterial({color:new THREE.Color(3, 2.55, 1.9)}),
    glowCool: new THREE.MeshBasicMaterial({color:new THREE.Color(2.4, 2.4, 2.3)}),
    pvc: S({color:'#f4f4f2', roughness:.35}),
    sill: S({color:'#f6f5f2', roughness:.3}),
    base: S({color:'#f4f3ef', roughness:.5}),
    radiator: S({color:'#f2f2f0', roughness:.3, metalness:.15}),
    doorWhite: S({color:'#f1efea', roughness:.4}),
    doorOak: S({color:'#e6d6c0', map:TEX.wood, roughness:.5}),
    entry: S({color:'#3a3b3e', roughness:.45, metalness:.55}),
    slab: S({color:'#c9c4bb', map:TEX.concrete, roughness:.95}),
    books: ['#8a5a44','#3f5566','#c9b48a','#6b6f58','#d8d2c5','#2f3a40'].map(c => S({color:c, roughness:.8})),
    toys: ['#e07a5f','#f2cc8f','#81b29a','#3d405b'].map(c => S({color:c, roughness:.6})),
    art: TEX.art.map(t => S({map:t, roughness:.9}))
  });
}

/* --- геометрические помощники --- */
const GEO = {};
const SPH = new THREE.SphereGeometry(1, 24, 16);
function rbGeo(w, h, d, r){
  r = Math.max(.004, Math.min(r, w / 2 - .002, h / 2 - .002, d / 2 - .002));
  const k = [w, h, d, r].map(v => v.toFixed(3)).join('_'); if (GEO[k]) return GEO[k];
  const s = new THREE.Shape(), x = -(w / 2 - r), y = -(h / 2 - r), W = w - 2 * r, H = h - 2 * r;
  s.moveTo(x, y); s.lineTo(x + W, y); s.lineTo(x + W, y + H); s.lineTo(x, y + H); s.lineTo(x, y);
  const g = new THREE.ExtrudeGeometry(s, {depth: Math.max(d - 2 * r, .001), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 1});
  g.translate(0, 0, -(d - 2 * r) / 2); return GEO[k] = g;
}
function BM(w, h, d, m, x = 0, y = 0, z = 0, o = {}){
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  for (let i = 0; i < 24; i++){ const f = i >> 2; let su, sv; if (f < 2){ su = d; sv = h } else if (f < 4){ su = w; sv = d } else { su = w; sv = h } uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv) }
  const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.castShadow = o.cast !== false && !m.transparent; me.receiveShadow = true; return me;
}
function RB(w, h, d, r, m, x = 0, y = 0, z = 0){const me = new THREE.Mesh(rbGeo(w, h, d, r), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me}
function CY(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 28){const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me}
function SP(r, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1){const me = new THREE.Mesh(SPH, m); me.scale.set(r * sx, r * sy, r * sz); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me}
function G(...a){const g = new THREE.Group(); a.flat(4).forEach(o => o && g.add(o)); return g}
function at(o, x, y, z, ry = 0, rx = 0, rz = 0){o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o}
function put(o, x, z, ry = 0, y = 0){o.position.set(x, y, z); o.rotation.y = ry; return o}
const legs4 = (w, d, h, m, r = .02, inset = .06) => [-1, 1].map(a => [-1, 1].map(b => CY(r, r * .8, h, m, a * (w / 2 - inset), h / 2, b * (d / 2 - inset), 10)));

/* --- мебель: всё строится «лицом» к +z, начало координат на полу --- */
const F = {
  sofa(L, mat = FM.sofa){ const n = L > 2 ? 3 : 2, cw = (L - .36) / n; return G(
    legs4(L - .1, .8, .1, FM.black, .02),
    RB(L, .24, .94, .05, mat, 0, .22, 0), RB(L, .5, .2, .06, mat, 0, .5, -.37),
    RB(.2, .58, .94, .07, mat, -L / 2 + .1, .39, 0), RB(.2, .58, .94, .07, mat, L / 2 - .1, .39, 0),
    Array.from({length: n}, (_, i) => RB(cw - .02, .16, .74, .07, mat, -L / 2 + .18 + cw * (i + .5), .42, .07)),
    Array.from({length: n}, (_, i) => at(RB(cw - .03, .44, .2, .09, mat), -L / 2 + .18 + cw * (i + .5), .7, -.24, 0, -.14)),
    at(RB(.46, .44, .13, .06, FM.pillowA), -L / 2 + .5, .72, -.1, .25, -.1, .12),
    at(RB(.42, .4, .12, .06, FM.pillowB), L / 2 - .52, .7, -.1, -.2, -.1, -.1)) },
  armchair(){ return G(legs4(.75, .7, .12, FM.oak, .02), RB(.82, .22, .8, .05, FM.velvet, 0, .23, 0), at(RB(.8, .52, .18, .08, FM.velvet), 0, .55, -.32, 0, -.12),
    RB(.14, .44, .78, .06, FM.velvet, -.34, .4, 0), RB(.14, .44, .78, .06, FM.velvet, .34, .4, 0), RB(.52, .13, .6, .06, FM.velvet, 0, .4, .06)) },
  coffee(){ return G(CY(.46, .46, .04, FM.walnut, 0, .4, 0, 48), CY(.035, .035, .38, FM.black, 0, .19, 0), CY(.24, .24, .015, FM.black, 0, .008, 0),
    RB(.26, .04, .2, .01, FM.books[1], .14, .44, .05), RB(.22, .03, .16, .01, FM.books[2], .15, .475, .06), CY(.05, .04, .16, FM.ceramic, -.16, .5, -.06), SP(.07, FM.leaf2, -.16, .62, -.06)) },
  sideTable(){ return G(CY(.22, .22, .03, FM.marble, 0, .55, 0, 36), CY(.02, .02, .54, FM.brass, 0, .27, 0), CY(.15, .15, .015, FM.brass, 0, .008, 0)) },
  tvWall(L){ return G(RB(L, .34, .4, .015, FM.walnut, 0, .45, 0), BM(1.64, .95, .035, FM.screen, 0, 1.36, -.17), BM(.9, .06, .09, FM.black, 0, .655, -.06),
    CY(.07, .05, .26, FM.ceramic, L / 2 - .25, .75, 0), SP(.1, FM.leaf2, L / 2 - .25, .95, 0, 1, 1.2, 1), RB(.3, .05, .22, .01, FM.books[0], -L / 2 + .3, .645, 0)) },
  chair(mat = FM.boucle){ return G(legs4(.42, .42, .45, FM.oak, .016, .04), RB(.46, .07, .46, .03, mat, 0, .48, 0), at(RB(.44, .36, .06, .03, mat), 0, .76, -.2, 0, .12)) },
  table(w, d, top = FM.oak){ return G(RB(w, .04, d, .015, top, 0, .75, 0), BM(.05, .72, d - .2, FM.black, -(w / 2 - .2), .36, 0), BM(.05, .72, d - .2, FM.black, w / 2 - .2, .36, 0), BM(w - .4, .05, .05, FM.black, 0, .1, 0)) },
  dining(w, d, n){ const g = G(F.table(w, d)), xs = n === 4 ? [-w / 4, w / 4] : [0];
    xs.forEach(x => { g.add(put(F.chair(), x, -d / 2 - .2, 0)); g.add(put(F.chair(), x, d / 2 + .2, PI)) });
    g.add(CY(.07, .05, .18, FM.ceramic, -.1, .86, 0)); g.add(SP(.09, FM.leaf, -.1, 1.0, 0, 1, 1.3, 1)); g.add(CY(.16, .16, .02, FM.ceramic, .2, .78, .05)); return g },
  bed(w, linen = FM.linenW){ return G(legs4(w, 2.0, .08, FM.oak, .025),
    RB(w + .12, .28, 2.12, .04, FM.headboard, 0, .22, 0), at(RB(w + .3, 1.05, .12, .05, FM.headboard), 0, .6, -1.04),
    RB(w - .02, .24, 2.0, .07, linen, 0, .46, .02), RB(w + .08, .09, 1.42, .045, linen, 0, .6, .32),
    RB(w + .12, .05, .55, .025, FM.linen2, 0, .655, .62),
    w > 1.2 ? [at(RB(.62, .18, .42, .08, linen), -w / 4, .67, -.72, 0, -.35), at(RB(.62, .18, .42, .08, linen), w / 4, .67, -.72, 0, -.35), at(RB(.45, .36, .12, .06, FM.pillowA), -w / 5, .74, -.55, .1, -.2), at(RB(.45, .36, .12, .06, FM.pillowB), w / 5, .74, -.55, -.1, -.2)]
            : at(RB(.62, .18, .42, .08, linen), 0, .67, -.72, 0, -.35)) },
  nightstand(){ return G(RB(.48, .38, .4, .02, FM.walnut, 0, .44, 0), BM(.03, .25, .03, FM.brass, -.2, .125, -.15), BM(.03, .25, .03, FM.brass, .2, .125, -.15), BM(.03, .25, .03, FM.brass, -.2, .125, .15), BM(.03, .25, .03, FM.brass, .2, .125, .15),
    CY(.07, .09, .18, FM.ceramic, -.06, .72, -.04), CY(.12, .16, .2, FM.shade, -.06, .91, -.04), RB(.2, .04, .14, .01, FM.books[3], .12, .65, .05)) },
  wardrobe(L, h = 2.45){ const g = G(BM(L, h, .6, FM.cab, 0, h / 2, 0)); const n = Math.max(2, Math.round(L / .55));
    for (let i = 1; i < n; i++) g.add(BM(.006, h - .06, .012, FM.graphite, -L / 2 + L * i / n, h / 2, .302, {cast: false}));
    for (let i = 0; i < n; i++) g.add(BM(.018, .5, .025, FM.brass, -L / 2 + L * (i + .5) / n + (i % 2 ? -.12 : .12), 1.1, .315)); return g },
  kitchen(L){ const g = G(
    BM(L, .1, .55, FM.graphite, 0, .05, -.02), BM(L, .76, .58, FM.kitchen, 0, .48, 0), BM(L + .02, .04, .62, FM.marble, 0, .88, .01),
    BM(L, .62, .02, FM.marble, 0, 1.21, -.3), BM(L, .72, .35, FM.kitchen, 0, 1.88, -.13), BM(L - .1, .012, .03, FM.glowCool, 0, 1.515, .02, {cast: false}),
    BM(.6, .008, .52, FM.black, L * .2, .904, .01), BM(.5, .01, .42, FM.steel, -L * .18, .903, .02),
    CY(.012, .012, .34, FM.chrome, -L * .18, 1.07, -.2, 12), at(CY(.01, .01, .2, FM.chrome, 0, 0, 0, 10), -L * .18, 1.24, -.11, 0, PI / 2),
    BM(.58, .5, .01, FM.screen, L * .2, .5, .295), BM(.66, 2.25, .62, FM.kitchen, -(L / 2 + .33), 1.125, 0));
    const n = Math.max(2, Math.round(L / .6)); for (let i = 1; i < n; i++){ g.add(BM(.005, .74, .01, FM.black, -L / 2 + L * i / n, .48, .292, {cast: false})); g.add(BM(.005, .7, .01, FM.black, -L / 2 + L * i / n, 1.88, .047, {cast: false})) }
    for (let i = 0; i < n; i++) g.add(BM(.3, .015, .02, FM.brass, -L / 2 + L * (i + .5) / n, .82, .3));
    g.add(BM(.005, 2.2, .01, FM.black, -L / 2, 1.125, .312, {cast: false})); g.add(BM(.02, .6, .025, FM.brass, -L / 2 - .08, 1.2, .32));
    return g },
  bathtub(){ return G(RB(1.7, .56, .76, .08, FM.ceramic, 0, .28, 0), BM(1.48, .01, .54, FM.water, 0, .565, 0, {cast: false}), CY(.015, .015, .2, FM.chrome, -.7, .66, -.3, 10), BM(.12, .02, .03, FM.chrome, -.7, .76, -.26)) },
  toiletDev(){ return G(CY(.15, .19, .38, FM.ceramic, 0, .19, .04), RB(.38, .08, .5, .04, FM.ceramic, 0, .42, .08), RB(.4, .4, .18, .04, FM.ceramic, 0, .62, -.22)) },
  toiletTurn(){ return G(RB(.37, .32, .54, .12, FM.ceramic, 0, .43, .07), BM(.62, 1.1, .16, FM.graphite, 0, .55, -.28), BM(.24, .16, .01, FM.chrome, 0, 1.0, -.199)) },
  sinkDev(){ return G(CY(.09, .12, .68, FM.ceramic, 0, .34, 0), RB(.56, .14, .44, .05, FM.ceramic, 0, .76, 0), CY(.012, .012, .16, FM.chrome, 0, .9, -.15, 10), BM(.5, .7, .02, FM.mirror, 0, 1.45, -.21)) },
  vanity(){ return G(RB(.9, .42, .48, .02, FM.walnut, 0, .62, 0), BM(.92, .03, .5, FM.marble, 0, .85, 0), CY(.2, .16, .13, FM.ceramic, 0, .93, .02, 32), CY(.01, .01, .3, FM.chrome, 0, 1.02, -.17, 10),
    at(CY(.008, .008, .12, FM.chrome, 0, 0, 0, 8), 0, 1.16, -.12, 0, PI / 2), RB(.86, .82, .03, .02, FM.mirror, 0, 1.5, -.22), BM(.88, .84, .005, FM.glow, 0, 1.5, -.238, {cast: false})) },
  towel(){ return G(BM(.03, .7, .03, FM.chrome, -.25, 1.1, 0), BM(.03, .7, .03, FM.chrome, .25, 1.1, 0), BM(.5, .02, .02, FM.chrome, 0, .9, 0), BM(.5, .02, .02, FM.chrome, 0, 1.3, 0), RB(.44, .5, .04, .02, FM.linenW, 0, 1.12, .03)) },
  washer(){ const d1 = at(CY(.2, .2, .03, FM.chrome), 0, .48, .3, 0, PI / 2), d2 = at(CY(.2, .2, .03, FM.chrome), 0, 1.33, .3, 0, PI / 2);
    return G(RB(.6, .85, .6, .03, FM.white, 0, .425, 0), RB(.6, .85, .6, .03, FM.white, 0, 1.28, 0), d1, d2, at(CY(.15, .15, .035, FM.screen), 0, .48, .3, 0, PI / 2), at(CY(.15, .15, .035, FM.screen), 0, 1.33, .3, 0, PI / 2)) },
  shelves(L){ const g = G(BM(.03, 2.2, .4, FM.walnut, -L / 2, 1.1, 0), BM(.03, 2.2, .4, FM.walnut, L / 2, 1.1, 0)); const R = rng(Math.round(L * 1000));
    for (let i = 0; i < 6; i++){ const y = .08 + i * .42; g.add(BM(L, .025, .4, FM.oak, 0, y, 0));
      if (i < 5){ let x = -L / 2 + .06; while (x < L / 2 - .25){ const w = .02 + R() * .03, h = .22 + R() * .1; if (R() > .82){ x += .12; continue }
        const k = (R() * 6) | 0; g.add(BM(w, h, .22 + R() * .06, FM.books[k], x + w / 2, y + .0125 + h / 2, .02)); x += w + .004 }
        if (R() > .5) g.add(CY(.06, .045, .16, FM.ceramic, L / 2 - .15, y + .09, 0)) } }
    return g },
  plantBig(){ const g = G(CY(.24, .19, .48, FM.pot, 0, .24, 0), CY(.22, .22, .02, FM.soil, 0, .47, 0)); const R = rng(77);
    for (let i = 0; i < 11; i++){ const a = i * 2.4, h = .75 + R() * .7, rr = .1 + R() * .25; const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      g.add(at(CY(.008, .01, h - .45, FM.leaf2, 0, 0, 0, 6), x * .5, .47 + (h - .45) / 2, z * .5, 0, z * .5, -x * .5));
      const lf = SP(.26, FM.leaf, x, h, z, 1, .07, .6); lf.rotation.set(R() * .8 - .4, -a, .5 - R()); g.add(lf) } return g },
  plantTall(){ return G(CY(.2, .16, .45, FM.terracotta, 0, .225, 0), CY(.025, .03, 1.2, FM.walnut, 0, .9, 0), SP(.32, FM.leaf, 0, 1.55, 0, 1, 1.25, 1), SP(.24, FM.leaf2, .14, 1.3, .08), SP(.22, FM.leaf, -.13, 1.75, -.05), SP(.2, FM.leaf2, -.1, 1.25, .12)) },
  rug(w, d){ const m = RB(w, .016, d, .008, FM.rug, 0, .008, 0); m.castShadow = false; return G(m) },
  pendant(){ const dome = new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 16, 0, PI * 2, 0, PI / 2), FM.brassD); dome.position.y = 1.98; dome.castShadow = true;
    return G(CY(.004, .004, .6, FM.black, 0, 2.45, 0, 6), dome, SP(.07, FM.glow, 0, 1.96, 0)) },
  globes(){ return G([[-.35, 2.1], [0, 1.98], [.35, 2.16]].map(([x, y]) => [CY(.003, .003, 2.75 - y, FM.black, x, (2.75 + y) / 2, 0, 6), SP(.13, FM.globe, x, y, 0)])) },
  floorLamp(){ return G(CY(.16, .18, .03, FM.black, 0, .015, 0), CY(.012, .012, 1.45, FM.brass, 0, .74, 0), CY(.17, .23, .3, FM.shade, 0, 1.55, 0)) },
  art(w, h, i){ return G(BM(w + .05, h + .05, .03, FM.black, 0, 0, 0), BM(w, h, .036, FM.art[i % 3], 0, 0, .002)) },
  curtain(h, w){ const g = new THREE.PlaneGeometry(w, h, 28, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) / w * 28) * .045);
    g.computeVertexNormals(); const m = new THREE.Mesh(g, FM.curtain); m.castShadow = true; m.receiveShadow = true; return m },
  radiator(L){ const g = G(BM(L, .52, .06, FM.radiator, 0, .44, 0)); for (let x = -L / 2 + .05; x < L / 2; x += .1) g.add(BM(.012, .5, .065, FM.base, x, .44, .002, {cast: false})); g.add(BM(.02, .18, .02, FM.chrome, -L / 2 + .02, .12, -.01)); return g },
  doorLeaf(m){ return G(BM(.8, 2.04, .04, m, 0, 1.02, 0), BM(.12, .018, .03, FM.chrome, .3, 1.0, .04), BM(.12, .018, .03, FM.chrome, .3, 1.0, -.04)) },
  entryDoor(){ return G(BM(1.0, 2.08, .07, FM.entry, 0, 1.04, 0), BM(.03, .32, .05, FM.chrome, .38, 1.05, .05), BM(.03, .32, .05, FM.chrome, .38, 1.05, -.05)) },
  bareBulb(){ return G(CY(.004, .004, .5, FM.black, 0, 2.5, 0, 6), SP(.035, FM.glow, 0, 2.23, 0)) },
  ceilDev(){ return G(CY(.18, .2, .05, FM.globe, 0, 2.72, 0, 32)) },
  spots(w, d){ const g = new THREE.Group(), nx = Math.max(1, Math.round(w / 1.5)), nz = Math.max(1, Math.round(d / 1.5));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++){ const s = CY(.045, .045, .012, FM.glow, -w / 2 + w * (i + .5) / nx, 2.744, -d / 2 + d * (j + .5) / nz, 16); s.castShadow = false; g.add(s) } return g },
  hall(){ return G(RB(1.0, .06, .32, .02, FM.walnut, 0, .9, 0), at(CY(.38, .38, .02, FM.mirror, 0, 0, 0, 48), 0, 1.55, -.15, 0, PI / 2), at(CY(.39, .39, .015, FM.brass, 0, 0, 0, 48), 0, 1.55, -.158, 0, PI / 2),
    CY(.05, .04, .14, FM.ceramic, .35, 1.0, 0), RB(1.0, .08, .36, .02, FM.oak, 0, .44, .12), BM(.04, .4, .3, FM.black, -.44, .2, .12), BM(.04, .4, .3, FM.black, .44, .2, .12)) },
  desk(){ return G(F.table(1.2, .6, FM.oak), put(F.chair(FM.pillowB), 0, -.6, 0), BM(.34, .012, .24, FM.steel, -.1, .776, .02), at(BM(.34, .23, .008, FM.screen), -.1, .89, .14, 0, -.25), CY(.06, .08, .03, FM.black, .4, .785, .1), at(CY(.012, .012, .4, FM.black), .4, .98, .1, 0, .2), CY(.06, .09, .1, FM.white, .44, 1.16, .05)) },
  toys(){ return G(RB(.4, .3, .3, .03, FM.toys[0], 0, .15, 0), RB(.3, .3, .3, .03, FM.toys[1], .45, .15, 0), SP(.12, FM.toys[2], .2, .42, 0), RB(.5, .4, .03, .015, FM.toys[3], -.35, .2, -.1)) }
};
