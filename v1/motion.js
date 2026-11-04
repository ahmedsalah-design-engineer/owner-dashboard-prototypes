/*
 * Shared motion for the rest of the dashboard.
 *  - [data-reveal]: fades and rises in when scrolled into view (stagger with --i).
 *    Content above the fold waits for the hero sequence so attention flows top-down.
 *  - [data-countup]: numbers count from zero when their block reveals.
 *  - [data-highlight-group] + [data-key]: hovering or focusing an item spotlights it
 *    (and anything sharing its key, e.g. a stacked-bar segment and its legend entry).
 *  - Fill slot: a single soft shimmer once the schedule is on screen.
 */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const pageStart = performance.now();
  const HERO_HOLD = 1300;    // ms: let the chart, quick wins and goals lead
  const STAGGER = 120;

  /* ---------- Count-up ---------- */
  function countUp(el, duration = 1400) {
    const finalText = el.textContent.trim();
    const m = finalText.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
    if (!m || reduce) return;
    const [, prefix, numText, suffix] = m;
    const target = parseFloat(numText.replace(/,/g, ''));
    const decimals = (numText.split('.')[1] || '').length;
    const fmt = (v) => prefix + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    // Lock the width to the final value so neighbours never shift.
    el.style.display = 'inline-block';
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;
    const t0 = performance.now();
    const frame = (now) => {
      const t = Math.min((now - t0) / duration, 1);
      const v = target * easeOutExpo(t);
      el.textContent = t < 1 ? fmt(decimals ? v : Math.round(v)) : finalText;
      if (t < 1) requestAnimationFrame(frame);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(frame);
  }

  /* ---------- Reveal on scroll ---------- */
  function reveal(el) {
    const i = Number(getComputedStyle(el).getPropertyValue('--i')) || 0;
    const sinceStart = performance.now() - pageStart;
    const hold = Math.max(0, HERO_HOLD - sinceStart);
    const delay = reduce ? 0 : hold + i * STAGGER;
    setTimeout(() => {
      el.classList.add('is-revealed');
      el.querySelectorAll('[data-countup]').forEach((n) => setTimeout(() => countUp(n), 250));
      if (el.matches('[data-countup]')) countUp(el);
      el.querySelectorAll('.fill-slot').forEach((b) => setTimeout(() => b.classList.add('is-shimmer'), 1400));
      // Once settled, hand transitions back to the element's own hover styles.
      setTimeout(() => el.classList.add('is-settled'), reduce ? 0 : 1800);
    }, delay);
  }

  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) targets.forEach((t) => t.classList.add('is-revealed', 'is-settled'));
  else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        reveal(e.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((t) => io.observe(t));
  }
  // Count-ups that live outside a reveal block (none today, but keep it safe).
  document.querySelectorAll('[data-countup]').forEach((n) => {
    if (!n.closest('[data-reveal]')) countUp(n);
  });

  /* ---------- Spotlight ---------- */
  document.querySelectorAll('[data-highlight-group]').forEach((group) => {
    const keyed = [...group.querySelectorAll('[data-key]')].filter((k) => k.closest('[data-highlight-group]') === group);
    const set = (key) => {
      if (key) group.setAttribute('data-active', key); else group.removeAttribute('data-active');
      keyed.forEach((k) => k.classList.toggle('is-active', k.dataset.key === key));
    };
    keyed.forEach((k) => {
      k.addEventListener('pointerenter', () => set(k.dataset.key));
      k.addEventListener('focus', () => set(k.dataset.key));
      k.addEventListener('blur', () => set(null));
    });
    group.addEventListener('pointerleave', () => set(null));
  });
})();
