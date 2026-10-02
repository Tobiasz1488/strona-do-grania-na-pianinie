/* ============================================================
   MERIDIAN · dashboard — dane, wykresy SVG, animacje
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- dane (fikcyjne, wewnętrznie spójne) ---------- */
  const SERIES = {
    '7D': {
      title: 'Dzienny przychód', sub: '$K / dzień · ostatnie 7 dni', goal: null,
      labels: ['Pt', 'So', 'Nd', 'Pn', 'Wt', 'Śr', 'Cz'],
      values: [2.6, 2.9, 2.4, 3.1, 2.8, 3.4, 3.2]
    },
    '30D': {
      title: 'Przychód · 30 dni', sub: '$K / dzień · ostatnie 30 dni', goal: null,
      labels: Array.from({ length: 30 }, (_, i) => String(i + 1)),
      values: [2.4,2.6,2.5,2.7,2.6,2.8,2.7,2.9,2.8,3.0,2.8,2.9,3.1,2.9,3.0,3.2,3.0,3.1,3.3,3.1,3.2,3.4,3.2,3.3,3.5,3.3,3.4,3.6,3.4,3.5]
    },
    '12M': {
      title: 'MRR miesięczny', sub: '$K / mies. · przerywana linia = cel $1M ARR', goal: 83.3,
      labels: ['Paź','Lis','Gru','Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz'],
      values: [38,41,45,47,52,56,61,66,70,74,79,84]
    }
  };

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });

  /* ---------- count-up ---------- */
  function countUp(el, to, opts = {}) {
    if (!el) return;
    const { dur = 1500, dec = 0, prefix = '', suffix = '' } = opts;
    const out = (v) => prefix + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (reduced) { el.textContent = out(to); return; }
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = out(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- główny wykres liniowy ---------- */
  const svgBox = $('#chartSvg');
  const tip = $('#chartTip');
  let currentKey = '12M';

  function smoothPath(pts) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      d += ` C${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1} ${x1},${y1}`;
    }
    return d;
  }

  function renderChart(key) {
    currentKey = key;
    const s = SERIES[key];
    $('#chartTitle').textContent = s.title;
    $('#chartUnit').textContent = s.sub;

    const W = Math.max(420, svgBox.clientWidth || 860);
    const H = 300, L = 50, R = 16, T = 18, B = 32;
    const n = s.values.length;
    const hi = Math.max(...s.values, s.goal || 0) * 1.07;
    const lo = Math.min(...s.values) * (key === '12M' ? 0.86 : 0.78);
    const x = (i) => L + (i * (W - L - R)) / (n - 1);
    const y = (v) => T + ((hi - v) * (H - T - B)) / (hi - lo);

    let grid = '';
    for (let g = 0; g <= 3; g++) {
      const v = lo + ((hi - lo) * g) / 3, gy = y(v);
      grid += `<line x1="${L}" y1="${gy.toFixed(1)}" x2="${W - R}" y2="${gy.toFixed(1)}" class="cg-grid"/>` +
              `<text x="${L - 9}" y="${(gy + 4).toFixed(1)}" text-anchor="end" class="cg-tick">${fmt(v)}</text>`;
    }
    const step = Math.ceil(n / 10);
    let xl = '';
    s.labels.forEach((lb, i) => {
      if (i % step === 0 || i === n - 1) xl += `<text x="${x(i).toFixed(1)}" y="${H - 9}" text-anchor="middle" class="cg-tick">${lb}</text>`;
    });

    const pts = s.values.map((v, i) => [x(i), y(v)]);
    const line = smoothPath(pts);
    const area = `${line} L${(W - R).toFixed(1)},${H - B} L${L},${H - B} Z`;

    let goal = '';
    if (s.goal) {
      const gy = y(s.goal);
      goal = `<line x1="${L}" y1="${gy.toFixed(1)}" x2="${W - R}" y2="${gy.toFixed(1)}" class="cg-goal"/>` +
             `<text x="${W - R}" y="${(gy - 8).toFixed(1)}" text-anchor="end" class="cg-goallabel">CEL · $1M ARR</text>`;
    }

    svgBox.innerHTML = `
      <svg id="mainSvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${s.title}: wykres liniowy">
        ${grid}${xl}${goal}
        <path class="cg-area" d="${area}"/>
        <path class="cg-line" d="${line}"/>
        <circle id="chartDot" r="4.5" class="cg-dot" style="opacity:0"/>
      </svg>`;

    const svg = $('#mainSvg');
    const dot = $('#chartDot');
    svg.addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * W;
      const idx = Math.max(0, Math.min(n - 1, Math.round((vx - L) / ((W - L - R) / (n - 1)))));
      dot.setAttribute('cx', x(idx).toFixed(1));
      dot.setAttribute('cy', y(s.values[idx]).toFixed(1));
      dot.style.opacity = '1';
      tip.innerHTML = `<b>${s.labels[idx]}</b> · $${fmt(s.values[idx])}K`;
      tip.style.left = (x(idx) / W * 100).toFixed(2) + '%';
      tip.style.top = (y(s.values[idx]) / H * 100).toFixed(2) + '%';
      tip.classList.add('on');
    });
    svg.addEventListener('mouseleave', () => { dot.style.opacity = '0'; tip.classList.remove('on'); });

    const lp = $('.cg-line', svgBox);
    if (!reduced && lp.getTotalLength) {
      const len = lp.getTotalLength();
      lp.style.strokeDasharray = String(len);
      lp.style.strokeDashoffset = String(len);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        lp.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.3,.7,.2,1)';
        lp.style.strokeDashoffset = '0';
      }));
    }
  }

  $$('.periods button').forEach((b) => b.addEventListener('click', () => {
    $$('.periods button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    renderChart(b.dataset.period);
  }));

  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => renderChart(currentKey), 180); });

  /* ---------- donut: przychód wg kanału ---------- */
  function renderDonut() {
    const segs = [
      { v: 46, c: '#0C2B1F' },
      { v: 31, c: '#D8A32B' },
      { v: 23, c: '#9A917C' }
    ];
    const svg = $('#donutSvg');
    let cum = 0;
    svg.innerHTML = `<g transform="rotate(-90 60 60)">` + segs.map((sg) => {
      const off = -cum; cum += sg.v;
      return `<circle class="dn-seg" cx="60" cy="60" r="48" pathLength="100" stroke="${sg.c}" data-v="${sg.v}" stroke-dasharray="0 100" stroke-dashoffset="${off}"/>`;
    }).join('') + `</g>
      <text x="60" y="56" text-anchor="middle" class="dn-center">MRR</text>
      <text x="60" y="74" text-anchor="middle" class="dn-value">$84.2K</text>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.dn-seg', svg).forEach((c, i) => {
        const v = +c.dataset.v;
        if (reduced) { c.setAttribute('stroke-dasharray', `${v} ${100 - v}`); return; }
        c.style.transition = `stroke-dasharray 1s cubic-bezier(.3,.7,.2,1) ${i * .18}s`;
        c.setAttribute('stroke-dasharray', `${v} ${100 - v}`);
      });
    }));
  }

  /* ---------- sparkline'y ---------- */
  const SPARKS = {
    mrr:     [70, 72, 74, 76, 75, 79, 81, 84],
    arr:     [456, 540, 648, 720, 792, 852, 936, 1011],
    clients: [268, 275, 281, 288, 294, 301, 306, 312],
    churn:   [3.1, 2.9, 2.8, 2.6, 2.4, 2.2, 2.0, 1.9],
    c1: [8.2, 8.4, 8.6, 8.9, 9.1, 9.3, 9.5, 9.8],
    c2: [7.0, 7.05, 7.1, 7.15, 7.2, 7.2, 7.22, 7.25],
    c3: [3.6, 3.55, 3.5, 3.48, 3.45, 3.42, 3.4, 3.4],
    c4: [2.4, 2.5, 2.6, 2.7, 2.75, 2.8, 2.85, 2.9],
    c5: [0.5, 0.6, 0.7, 0.75, 0.8, 0.82, 0.85, 0.89]
  };

  function sparkline(el) {
    const values = SPARKS[el.dataset.spark];
    if (!values) return;
    const good = el.dataset.good !== 'false';
    const w = 120, h = 34;
    const min = Math.min(...values), max = Math.max(...values);
    const col = good ? '#1E6B45' : '#B3401F';
    const pts = values.map((v, i) => [
      (i / (values.length - 1)) * (w - 8) + 4,
      h - 5 - ((v - min) / (max - min || 1)) * (h - 10)
    ]);
    const last = pts[pts.length - 1];
    el.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="2"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="${col}"/></svg>`;
  }

  /* ---------- start ---------- */
  countUp($('#kpiMrr'), 84230, { prefix: '$' });
  countUp($('#kpiArr'), 1010760, { prefix: '$', dur: 1900 });
  countUp($('#kpiClients'), 312);
  countUp($('#kpiChurn'), 1.9, { dec: 1, suffix: '%' });

  $$('.spark, .t-spark').forEach(sparkline);

  countUp($('#goalPct'), 84.2, { dec: 1, suffix: '%', dur: 1700 });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('#goalFill').style.width = '84%';
    $('#sideFill').style.width = '84%';
  }));

  renderDonut();
  renderChart('12M');

  /* nawigacja sidebar (demo) */
  $$('.side__nav a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    $$('.side__nav a').forEach((x) => x.classList.remove('active'));
    a.classList.add('active');
  }));

})();

