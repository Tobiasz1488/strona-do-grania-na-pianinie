# MERIDIAN — landing page + dashboard

Demo biznesu wartego **$1 000 000** (ARR) — platforma operacyjna dla firm celujących w 7 cyfr.

## Uruchomienie
Otwórz `index.html` w przeglądarce (podwójny klik). Dashboard: `dashboard.html`.
Brak zależności i buildu — czysty HTML/CSS/JS + ręcznie rysowane wykresy SVG.
Fonty ładowane z Google Fonts; offline działają fallbacki systemowe.

## Struktura
```
index.html            landing page (hero z gauge do $1M, ticker, liczby, bento, CTA)
dashboard.html        dashboard (KPI, wykres przychodu 7D/30D/12M, ścieżka do miliona, donut, tabela)
assets/css/base.css   design system: kolory, typografia, przyciski, reveal
assets/css/landing.css    style landing page
assets/css/dashboard.css  layout dashboardu
assets/js/landing.js      liczniki, animacja gauge, scroll-reveal, menu mobilne
assets/js/dashboard.js    dane, wykres SVG z tooltipem, donut, sparkline'y, count-upy
```

## Spójność danych (fikcyjne)
MRR $84,230 → ARR run-rate $1,010,760 (cel $1M przekroczony w run-racie),
84% celu na gauge = $842.3K / $1M, linia celu na wykresie 12M = $83.3K MRR (= $1M ARR).
