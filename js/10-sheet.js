/* ---------- выдвижные панели на телефоне: свайп и тап ---------- */
const isPhone = () => innerWidth <= 760;
function setSheet(el, open){ el.classList.toggle('min', !open); const b = el.querySelector('.sheet-t'); if (b) b.setAttribute('aria-label', open ? 'Свернуть панель' : 'Развернуть панель'); if (!open) el.scrollTop = 0 }
function initSheets(){
  $$('.sheet').forEach(el => {
    let st = null;
    const head = () => { const h = el.querySelector('.ap-head, .cp-head'); return (h ? h.getBoundingClientRect().bottom : el.getBoundingClientRect().top + 70) + 6 };
    el.querySelector('.sheet-t').addEventListener('click', e => { e.stopPropagation(); if (el._drag){ el._drag = false; return } setSheet(el, el.classList.contains('min')) });
    el.addEventListener('pointerdown', e => {
      if (!isPhone() || e.button > 0) return;
      const min = el.classList.contains('min');
      if (!min && (e.clientY > head() || el.scrollTop > 0)) return; // в раскрытой панели тянем только за шапку
      if (e.target.closest('button:not(.sheet-t), input, select, a')) return;
      st = {y: e.clientY, t: performance.now(), h: el.getBoundingClientRect().height, id: e.pointerId, moved: false, min};
      try { el.setPointerCapture(e.pointerId) } catch (er){}
    });
    el.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return; const dy = e.clientY - st.y;
      if (!st.moved){ if (Math.abs(dy) < 6) return; st.moved = true; el._drag = true; el.style.transition = 'none' }
      el.style.maxHeight = clamp(st.h - dy, 96, innerHeight * .86) + 'px';
    });
    const end = e => {
      if (!st || e.pointerId !== st.id) return; const s = st; st = null; if (!s.moved) return;
      const dy = e.clientY - s.y, v = dy / Math.max(1, performance.now() - s.t);
      el.style.transition = ''; el.style.maxHeight = '';
      setSheet(el, e.type === 'pointercancel' ? !s.min : (dy < -40 || v < -.4) ? true : (dy > 40 || v > .4) ? false : !s.min);
      setTimeout(() => { el._drag = false }, 0);
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('click', e => { if (isPhone() && el.classList.contains('min') && !el._drag && !e.target.closest('button, input, select, a')) setSheet(el, true) });
  });
  addEventListener('resize', () => { if (!isPhone()) $$('.sheet').forEach(el => el.classList.remove('min')) });
}
