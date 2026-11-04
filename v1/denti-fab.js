/*
 * Floating Dr. Denti (bottom right). Static demo:
 *  - Arrives after the hero sequence, then says hello once per browser session.
 *  - Click him (or the greeting) to open his panel; Esc or × closes it.
 *  - His expression follows what he's doing: happy when greeting, thinking while
 *    "reading" the practice, idle (blinking) otherwise. Rendering lives in denti.js.
 */
(() => {
  const root = document.querySelector('[data-denti-fab]');
  if (!root) return;
  const launcher = root.querySelector('[data-denti-launcher]');
  const sprite = launcher.querySelector('canvas');
  const panel = root.querySelector('[data-denti-panel]');
  const panelFace = panel.querySelector('canvas');
  const hello = root.querySelector('[data-denti-hello]');
  const input = root.querySelector('#denti-input');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = document.documentElement.classList.contains('intro-seen');
  const later = (ms, fn) => setTimeout(fn, reduce ? 0 : ms);
  let helloTimer;

  const mood = (state) => { sprite.dataset.state = state; };

  function showHello() {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('denti-hello') === '1'; } catch (e) {}
    if (dismissed || !panel.hidden) return;
    hello.hidden = false;
    requestAnimationFrame(() => hello.classList.add('is-open'));
    mood('happy');
    helloTimer = setTimeout(hideHello, 12000);
  }
  function hideHello(remember = true) {
    clearTimeout(helloTimer);
    if (hello.hidden) return;
    hello.classList.remove('is-open');
    later(300, () => { hello.hidden = true; });
    mood('idle');
    if (remember) { try { sessionStorage.setItem('denti-hello', '1'); } catch (e) {} }
  }

  function open() {
    hideHello();
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    launcher.setAttribute('aria-expanded', 'true');
    root.classList.add('is-active');
    panelFace.dataset.state = 'thinking';
    later(900, () => { panelFace.dataset.state = 'happy'; });
    later(1900, () => { panelFace.dataset.state = 'idle'; });
    later(50, () => panel.querySelector('[data-denti-close]').focus());
  }
  function close() {
    panel.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-active');
    later(300, () => { panel.hidden = true; });
    launcher.focus();
  }

  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  hello.querySelector('p').addEventListener('click', open);
  root.querySelector('[data-denti-dismiss]').addEventListener('click', () => hideHello());
  root.querySelector('[data-denti-close]').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  root.querySelectorAll('.denti-chip').forEach((chip) => chip.addEventListener('click', () => {
    input.value = chip.textContent; input.focus();
  }));
  launcher.addEventListener('pointerenter', () => { if (panel.hidden && hello.hidden) mood('happy'); });
  launcher.addEventListener('pointerleave', () => { if (panel.hidden && hello.hidden) mood('idle'); });

  // Arrive after the chart and quick wins have had the stage.
  later(seen ? 300 : 2400, () => {
    root.classList.add('is-in');
    later(1200, showHello);
  });
})();
