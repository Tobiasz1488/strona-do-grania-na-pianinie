/* ============================================================
   MERIDIAN · landing — liczniki, gauge, reveal, menu
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el, to, opts = {}) {
    if (!el) return;
    const { dur = 1800, dec = 0, prefix = '', suffix = '' } = opts;
    const out = (v) => prefix + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (reduced) { el.textContent = out(to); return; }
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = out(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* gauge w hero — cel $1 000 000 */
  function initGauge() {
    const arc = $('#gaugeArc');
    if (!arc) return;
    const CIRC = 2 * Math.PI * 140; // r=140 → ~879.65
    const target = CIRC * (1 - .84); // 84% celu
    arc.style.strokeDasharray = String(CIRC);
    if (reduced) {
      arc.style.transition = 'none';
      arc.style.strokeDashoffset = String(target);
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        arc.style.transition = 'stroke-dashoffset 2s cubic-bezier(.3,.7,.2,1) .25s';
        arc.style.strokeDashoffset = String(target);
      }));
    }
    countUp($('#gaugeNumber'), 1000000, { prefix: '$', dur: 2200 });
    countUp($('#gaugePct'), 84, { suffix: '%', dur: 2000 });
  }

  /* reveal przy scrollu + liczniki w sekcji "Liczby" */
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach((el) => {
          if (el.dataset.done) return;
          el.dataset.done = '1';
          countUp(el, parseFloat(el.dataset.count), {
            dec: +(el.dataset.dec || 0),
            prefix: el.dataset.prefix || '',
            suffix: el.dataset.suffix || ''
          });
        });
        io.unobserve(en.target);
      });
    }, { threshold: .2 });
    $$('[data-reveal]').forEach((el) => io.observe(el));
  }

  /* menu mobilne */
  function initNav() {
    const burger = $('#burger');
    if (!burger) return;
    burger.addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $$('.nav__links a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('nav-open')));
  }

  initGauge();
  initReveal();
  initNav();
})();
