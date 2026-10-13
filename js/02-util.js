/* ---------- утилиты ---------- */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const money = n => fmt(n) + ' ' + CUR;
const mln = n => (n / 1e6).toFixed(1).replace('.', ',') + ' млн ' + CUR;
const sqm = a => String(a).replace('.', ',') + ' м²';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function annuity(loan, rate, years){const r = rate / 12, n = years * 12; return r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n}
const monthlyFor = total => annuity(total * (1 - MORT.down), MORT.rate, MORT.years);

/* Крутящиеся цифры */
class Odo{
  constructor(el){this.el = el; this.sig = null; this.cols = []}
  set(str){
    if (!this.el) return;
    const ch = [...str], sig = ch.map(c => /\d/.test(c) ? '#' : c).join('');
    if (sig !== this.sig){
      this.sig = sig; this.el.innerHTML = ''; this.cols = [];
      ch.forEach((c, i) => {
        if (/\d/.test(c)){
          const d = document.createElement('span'); d.className = 'd';
          const s = document.createElement('span'); s.className = 's';
          s.innerHTML = '0123456789'.split('').map(n => '<i>' + n + '</i>').join('');
          s.style.transitionDelay = (i * 40) + 'ms'; d.appendChild(s); this.el.appendChild(d); this.cols.push(s);
        } else { const sp = document.createElement('span'); sp.className = 'c'; sp.textContent = c; this.el.appendChild(sp); this.cols.push(null) }
      });
      void this.el.offsetWidth;
    }
    requestAnimationFrame(() => ch.forEach((c, i) => { const s = this.cols[i]; if (s) s.style.transform = 'translateY(-' + (+c * 10) + '%)' }));
  }
}
function toast(t){const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2400)}
const isTouch = matchMedia('(pointer:coarse)').matches;
