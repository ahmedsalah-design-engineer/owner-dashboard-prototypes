/*
 * Goal tiles: bars grow from zero one after another and the % pills count up with them.
 * Starts once the strip is on screen, a beat after the chart and quick wins begin.
 */
(() => {
  const strip = document.querySelector('[data-goals]');
  if (!strip) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pills = [...strip.querySelectorAll('.goal-pill[data-pct]')].filter((p) => p.textContent.trim().endsWith('%'));
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  if (reduceMotion) { strip.classList.add('is-in'); return; }
  pills.forEach((p) => { p.textContent = '0%'; });

  function start() {
    strip.classList.add('is-in');
    pills.forEach((pill) => {
      const target = Number(pill.dataset.pct);
      const delay = Number(getComputedStyle(pill.closest('.goal')).getPropertyValue('--i') || 0) * 140;
      setTimeout(() => {
        const t0 = performance.now();
        const frame = (now) => {
          const t = Math.min((now - t0) / 1600, 1);   // same length and curve as the bar
          pill.textContent = `${Math.round(target * easeOutExpo(t))}%`;
          if (t < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }, delay);
    });
  }

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    setTimeout(start, 900);
  }, { threshold: 0.3 });
  io.observe(strip);
})();
