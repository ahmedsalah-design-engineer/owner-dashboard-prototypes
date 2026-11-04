/*
 * Briefing chart: first-load draw-in + pointer/keyboard scrubbing.
 *
 * The line, area and projection come from the Figma assets in ./assets (unchanged files);
 * they are fetched and placed in one inline SVG so they can be clipped and sampled.
 * Without JS (or if a fetch fails) the static <img> fallbacks in index.html stay.
 *
 * Coordinates: one 648 x 176 viewBox (the Figma plot frame), stretched to the card width.
 * Offsets below are the Figma insets of each layer inside that frame.
 */
(() => {
  const plot = document.querySelector('[data-chart]');
  if (!plot) return;

  const VB_W = 648, VB_H = 176;
  const LAYERS = [
    { file: 'assets/plot-area.svg',       dx: -7.2, kind: 'area' },
    { file: 'assets/plot-line.svg',       dx: -8.2, kind: 'line' },
    { file: 'assets/plot-projection.svg', dx: 0,    kind: 'projection' },
  ];
  // Days: Oct 5 (x = 32, under the "Oct 5" label) to today (x = 616, the Figma "Today dot").
  const FIRST_DAY = new Date(2026, 9, 5);
  const DAYS = 31;
  const X0 = 32, X1 = 616;
  const TODAY_VALUE = 3700;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const el = (sel) => plot.querySelector(sel);
  const marker = el('.today-marker');
  const tooltip = el('.tooltip');
  const tipDate = el('.tooltip-date');
  const tipValue = el('.tooltip-value');
  const live = el('.chart-live');

  // Calm pacing: one slow, even stroke, then each detail settles in turn (ms).
  const TIMING = {
    startDelay: 300,    // let the page settle before anything moves
    draw: 2800,         // line draw + headline count-up
    tooltipDelay: 450,  // after the line lands
    tooltipCount: 1100,
    pulseAfter: 1800,   // first "live" pulse on today's dot
  };
  // Sine in-out: no sudden acceleration in the middle of the stroke.
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const dateLabel = (i) => {
    const d = new Date(FIRST_DAY); d.setDate(d.getDate() + i);
    return i === DAYS - 1 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  async function build() {
    const texts = await Promise.all(LAYERS.map((l) => fetch(l.file).then((r) => {
      if (!r.ok) throw new Error(l.file);
      return r.text();
    })));

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'plot-svg');
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const defs = document.createElementNS(SVG_NS, 'defs');
    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.id = 'plot-reveal';
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', -20); clipRect.setAttribute('y', -20);
    clipRect.setAttribute('height', VB_H + 40); clipRect.setAttribute('width', 0);
    clip.appendChild(clipRect);
    defs.appendChild(clip);
    svg.appendChild(defs);

    const revealed = document.createElementNS(SVG_NS, 'g');
    revealed.setAttribute('clip-path', 'url(#plot-reveal)');
    svg.appendChild(revealed);

    const parts = {};
    texts.forEach((text, i) => {
      const { dx, kind } = LAYERS[i];
      const src = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
      src.querySelectorAll('defs > *').forEach((d) => defs.appendChild(d));
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', `layer-${kind}`);
      g.setAttribute('transform', `translate(${dx} 0)`);
      // The source SVGs set fill="none" on their root; carry it over so stroke-only paths stay unfilled.
      if (src.getAttribute('fill')) g.setAttribute('fill', src.getAttribute('fill'));
      src.querySelectorAll('path').forEach((p) => {
        p.removeAttribute('id');
        if (p.hasAttribute('stroke')) p.setAttribute('vector-effect', 'non-scaling-stroke');
        g.appendChild(p);
      });
      parts[kind] = { g, path: g.querySelector('path'), dx };
      (kind === 'projection' ? svg : revealed).appendChild(g);
    });

    // Sample the line once: x (viewBox units) -> y.
    const linePath = parts.line.path;
    const total = linePath.getTotalLength();
    const samples = [];
    for (let i = 0; i <= 800; i++) {
      const p = linePath.getPointAtLength((total * i) / 800);
      samples.push([p.x + parts.line.dx, p.y]);
    }
    const yAt = (x) => {
      let lo = 0, hi = samples.length - 1;
      if (x <= samples[0][0]) return samples[0][1];
      if (x >= samples[hi][0]) return samples[hi][1];
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; (samples[mid][0] < x ? (lo = mid) : (hi = mid)); }
      const [xa, ya] = samples[lo], [xb, yb] = samples[hi];
      return ya + ((yb - ya) * (x - xa)) / (xb - xa || 1);
    };

    // Daily points read off the drawn curve; today is anchored to $3,700 and the plot floor to $0.
    // Placeholder until the chart is fed real production data.
    const yToday = yAt(X1);
    const days = Array.from({ length: DAYS }, (_, i) => {
      const x = X0 + ((X1 - X0) * i) / (DAYS - 1);
      const y = yAt(x);
      const value = Math.round((TODAY_VALUE * (VB_H - y)) / (VB_H - yToday) / 10) * 10;
      return { i, x, y, value, label: dateLabel(i) };
    });
    days[DAYS - 1].value = TODAY_VALUE;

    plot.querySelectorAll('img.area, img.line, img.projection').forEach((img) => img.remove());
    plot.prepend(svg);
    plot.classList.add('is-live');

    return { svg, clipRect, parts, yAt, days };
  }

  /* ---------- Layout helpers (viewBox units -> px inside the plot) ---------- */
  const sx = () => plot.clientWidth / VB_W;
  const place = (node, xVb, yPx) => { node.style.transform = `translate3d(${xVb * sx()}px, ${yPx}px, 0)`; };

  function placeTooltip(day, atRest) {
    const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    const px = day.x * sx();
    let left, top;
    if (atRest) {            // Figma spot: 16px left of the dot, top 3.2
      left = px - 16 - w; top = 3.2;
    } else {                 // centred above the point, flipped below near the top
      left = Math.min(Math.max(px - w / 2, 8), plot.clientWidth - w - 8);
      top = day.y - h - 14;
      if (top < 4) top = day.y + 16;
    }
    tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  function setTooltip(day, showDate) {
    tipDate.textContent = day.label;
    tipDate.hidden = !showDate;
    tipValue.textContent = money(day.value);
  }

  /* ---------- Headline count-up (runs alongside the line draw) ---------- */
  const briefing = plot.closest('.briefing');
  const countEl = briefing && briefing.querySelector('[data-count]');

  function countHeadline(duration) {
    if (!countEl) return;
    const target = Number(countEl.dataset.count);
    const finalText = money(target);
    // Lock the width to the final value so the +8% badge doesn't slide while digits grow.
    countEl.textContent = finalText;
    countEl.style.width = `${countEl.getBoundingClientRect().width}px`;
    const land = () => { countEl.textContent = finalText; briefing.classList.add('is-counted'); };
    if (!duration) { briefing.classList.add('is-counting'); land(); return; }

    countEl.textContent = money(0);
    briefing.classList.add('is-counting');
    const t0 = performance.now();
    const frame = (now) => {
      const t = Math.min((now - t0) / duration, 1);
      // Step in hundreds so the tail settles calmly instead of flickering units.
      countEl.textContent = money(Math.round((target * easeOutCubic(t)) / 100) * 100);
      if (t < 1) requestAnimationFrame(frame); else land();
    };
    requestAnimationFrame(frame);
  }

  /* ---------- First-load sequence ---------- */
  function intro(chart) {
    const { clipRect, parts, yAt, days } = chart;
    const today = days[DAYS - 1];
    const pen = el('.pen');
    const endX = 619.2 + 40; // past the line end so the area edge clears too

    const finish = () => {
      clipRect.setAttribute('width', endX + 20);
      plot.classList.add('is-drawn');
      pen.classList.remove('is-on');
      setTooltip(today, false);
      placeTooltip(today, true);
    };

    setTooltip(today, false);
    placeTooltip(today, true);
    if (reduceMotion) { finish(); plot.classList.add('is-settled'); countHeadline(0); return Promise.resolve(); }

    const { draw: DRAW, startDelay, tooltipDelay, tooltipCount, pulseAfter } = TIMING;
    return new Promise((resolve) => setTimeout(() => {
      const t0 = performance.now();
      countHeadline(DRAW); // number and line land together
      pen.classList.add('is-on');
      const frame = (now) => {
        const t = Math.min((now - t0) / DRAW, 1);
        const e = easeInOutSine(t);
        const x = -10 + (endX + 10) * e;
        clipRect.setAttribute('width', x + 20);
        const penX = Math.min(x, X1);
        place(pen, penX, yAt(penX));
        if (t < 1) return requestAnimationFrame(frame);

        finish();
        // Today marker lands, then the tooltip counts up to today's value.
        setTimeout(() => {
          const c0 = performance.now();
          const count = (n) => {
            const k = Math.min((n - c0) / tooltipCount, 1);
            tipValue.textContent = money(Math.round((today.value * easeOutCubic(k)) / 10) * 10);
            if (k < 1) requestAnimationFrame(count); else { tipValue.textContent = money(today.value); resolve(); }
          };
          requestAnimationFrame(count);
        }, tooltipDelay);
        setTimeout(() => plot.classList.add('is-settled'), pulseAfter);
      };
      requestAnimationFrame(frame);
    }, startDelay));
  }

  /* ---------- Scrubbing ---------- */
  function interact(chart) {
    const { days } = chart;
    const cursor = el('.cursor');
    const guide = el('.guide');
    let active = null;

    const show = (i) => {
      const day = days[i];
      if (active === i) return;
      active = i;
      plot.classList.add('is-scrubbing');
      place(cursor, day.x, day.y);
      guide.style.transform = `translate3d(${day.x * sx()}px, 0, 0)`;
      setTooltip(day, true);
      placeTooltip(day, false);
      plot.setAttribute('aria-valuenow', i);
      plot.setAttribute('aria-valuetext', `${day.label}: ${money(day.value)}`);
    };
    const reset = () => {
      active = null;
      plot.classList.remove('is-scrubbing');
      const today = days[DAYS - 1];
      setTooltip(today, false);
      placeTooltip(today, true);
      plot.setAttribute('aria-valuenow', DAYS - 1);
      plot.setAttribute('aria-valuetext', `Today: ${money(today.value)}`);
    };
    const nearest = (clientX) => {
      const r = plot.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * VB_W;
      return Math.max(0, Math.min(DAYS - 1, Math.round(((x - X0) / (X1 - X0)) * (DAYS - 1))));
    };

    plot.addEventListener('pointermove', (e) => { if (plot.classList.contains('is-drawn')) show(nearest(e.clientX)); });
    plot.addEventListener('pointerdown', (e) => { if (plot.classList.contains('is-drawn')) show(nearest(e.clientX)); });
    plot.addEventListener('pointerleave', reset);
    plot.addEventListener('pointercancel', reset);

    plot.addEventListener('keydown', (e) => {
      const cur = active ?? DAYS - 1;
      const step = { ArrowLeft: -1, ArrowRight: 1, PageDown: -7, PageUp: 7 }[e.key];
      if (step) show(Math.max(0, Math.min(DAYS - 1, cur + step)));
      else if (e.key === 'Home') show(0);
      else if (e.key === 'End') show(DAYS - 1);
      else if (e.key === 'Escape') reset();
      else return;
      e.preventDefault();
      live.textContent = plot.getAttribute('aria-valuetext');
    });
    plot.addEventListener('blur', reset);

    // Keep overlays aligned when the card is resized.
    new ResizeObserver(() => {
      const i = active;
      plot.classList.add('no-transition');
      if (i === null) reset(); else { active = null; show(i); }
      requestAnimationFrame(() => plot.classList.remove('no-transition'));
    }).observe(plot);

    reset();
  }

  build()
    .then(async (chart) => {
      await document.fonts.ready;
      const run = () => intro(chart);
      // Start when the chart is actually on screen.
      await new Promise((go) => {
        const io = new IntersectionObserver((entries) => {
          if (entries.some((en) => en.isIntersecting)) { io.disconnect(); go(); }
        }, { threshold: 0.4 });
        io.observe(plot);
      });
      interact(chart);
      run();
    })
    .catch(() => { // show the static images as designed; the headline still counts
      plot.classList.add('is-fallback');
      countHeadline(reduceMotion ? 0 : TIMING.draw);
    });
})();
