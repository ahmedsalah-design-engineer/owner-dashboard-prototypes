/*
 * Today's quick wins: staggered entrance + mark-done flow.
 * Tap/click the icon tile to complete an item: tick draws, title strikes through,
 * the row folds away, the progress segment fills and the count steps down.
 * When all are done, an "all caught up" state replaces the list.
 */
(() => {
  const card = document.querySelector('[data-quick-wins]');
  if (!card) return;

  const items = [...card.querySelectorAll('.qw-item')];
  const total = items.length;
  const count = card.querySelector('[data-qw-count]');
  const status = card.querySelector('[data-qw-status]');
  const segments = [...card.querySelectorAll('.qw-progress span')];
  const list = card.querySelector('.qw-list');
  const empty = card.querySelector('[data-qw-empty]');
  const live = card.querySelector('[data-qw-live]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  let done = 0;

  const render = () => {
    const left = total - done;
    count.textContent = left === 0 ? '✓' : String(left);
    count.classList.toggle('is-clear', left === 0);
    count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump');
    status.textContent = left === 0 ? 'All done for today' : `${left} left today`;
    segments.forEach((s, i) => s.classList.toggle('is-filled', i < done));
  };

  async function complete(item) {
    if (item.classList.contains('is-done')) return;
    const title = item.querySelector('.text p').textContent;
    item.classList.add('is-done');          // tick + strike-through
    done += 1;
    render();
    live.textContent = `${title} marked done. ${total - done} left.`;
    await wait(750);                        // let the tick read before it leaves
    item.classList.add('is-collapsing');    // fold the row away
    await wait(650);
    item.hidden = true;
    if (done === total) {
      list.hidden = true;
      empty.hidden = false;
      empty.querySelector('[data-qw-reset]').focus({ preventScroll: true });
    } else {
      const next = items.find((i) => !i.hidden && !i.classList.contains('is-done'));
      next && next.querySelector('.qw-check').focus({ preventScroll: true });
    }
  }

  items.forEach((item) => {
    item.querySelector('.qw-check').addEventListener('click', () => complete(item));
    // The row's action (Follow up / Confirm / Reply) completes it the same way.
    item.querySelector('.qw-row > .btn').addEventListener('click', () => complete(item));
  });

  card.querySelector('[data-qw-reset]').addEventListener('click', () => {
    done = 0;
    empty.hidden = true;
    list.hidden = false;
    card.classList.remove('is-in', 'is-interactive');
    items.forEach((i) => { i.hidden = false; i.classList.remove('is-done', 'is-collapsing'); });
    render();
    count.classList.remove('is-bump');
    live.textContent = `${total} quick wins.`;
    requestAnimationFrame(() => requestAnimationFrame(enter));
  });

  // Entrance: rows rise in one after another, just after the chart starts drawing.
  function enter() {
    card.classList.add('is-in');
    // After the stagger, drop the per-row delays so later changes respond at once.
    setTimeout(() => card.classList.add('is-interactive'), reduceMotion ? 0 : 140 * total + 900);
  }
  render();
  count.classList.remove('is-bump');
  if (reduceMotion || document.documentElement.classList.contains('intro-seen')) enter(); else setTimeout(enter, 600);
})();
