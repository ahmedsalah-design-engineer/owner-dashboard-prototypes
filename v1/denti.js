/*
 * Dr. Denti: pixel-art AI practice coach.
 * Source sprite: prototypes/my-denti/index.html (24x24, LV1 colours, logo navy + orange).
 *
 * Usage: <canvas data-denti data-state="idle|happy|thinking|alert|celebrate"
 *                data-px="2" data-crop="head" data-prop="chart|phone|star|calendar"></canvas>
 * data-px must be a whole number so the pixels stay sharp.
 */
(function () {
  const PAL = {
    K: '#002d60', H: '#3b2a20', h: '#5c4232', S: '#edb98f', s: '#cf946a',
    E: '#002d60', w: '#ffffff', G: '#1a65bb', M: '#702d00', P: '#dda37c',
    C: '#ffffff', c: '#d4e5f8', O: '#a65117', B: '#5692d6', x: '#e9f2fc'
  };

  const BASE = [
    "..........KKKK..........",
    ".........KKKOOK.........",
    ".........KKKOOK.........",
    ".....KHHHHKKKKHHHHK.....",
    "....KHHhHHBBBBHHHhHK....",
    "...KBBBBBBBBBBBBBBBBK...",
    "...KHHHHHHHHHHHHHHHHK...",
    "...KHHSSSSSSSSSSSSHHK...",
    "...KHSSSSSSSSSSSSSSHK...",
    "...KSGGGGGSSSSGGGGGSK...",
    "...KSGwESGSGGSGwESGSK...",
    "...KSGEESGSSSSGEESGSK...",
    "...KSGGGGGSSSSGGGGGSK...",
    "...KSSPPSSSSSSSSPPSSK...",
    "...KSSSSSMSSSSMSSSSSK...",
    "....KSSSSSMMMMSSSSSK....",
    ".....KKsSSSSSSSSsKK.....",
    ".......KKKsSSsKKK.......",
    "....KKCCCCKOOKCCCCKK....",
    "...KCCGCCCcOOcCCCCCCK...",
    "..KCCCGCCCcOOcCCKOCCCK..",
    ".KCCCCGCCCcOOcCCKKCCCCK.",
    ".KCCCCOCCCCOOCCCCCCCCCK.",
    ".KKKKKKKKKKKKKKKKKKKKKK."
  ];

  const PROPS = {
    chart: ["KKKKKKKK", "KxxxxxxK", "KxxxxOxK", "KxxxxOxK", "KxxBxOxK", "KxxBxOxK", "KxBBxOxK", "KKKKKKKK"],
    phone: [".KKKKKK.", ".KBBBBK.", ".KBOOBK.", ".KBBBBK.", ".KBBBBK.", ".KBBBBK.", ".KKwwKK.", "..KKKK.."],
    star: ["...OO...", "...OO...", "OOOOOOOO", ".OOOOOO.", "..OOOO..", ".OOOOOO.", ".OO..OO.", "OO....OO"],
    calendar: [".K....K.", "KOOOOOOK", "KOOOOOOK", "KCCCCCCK", "KCBCBCBK", "KCCCCCCK", "KCBCOCBK", "KKKKKKKK"]
  };

  function put(rows, r, c, str) { rows[r] = rows[r].slice(0, c) + str + rows[r].slice(c + str.length); }
  function eyes(rows, top, bottom) { put(rows, 10, 6, top); put(rows, 10, 15, top); put(rows, 11, 6, bottom); put(rows, 11, 15, bottom); }

  function rowsFor(state, f) {
    const r = BASE.slice();
    if (state === 'idle' && f % 30 < 2) eyes(r, 'SSS', 'EEE');
    if (state === 'happy' || state === 'celebrate') { eyes(r, 'SES', 'ESE'); put(r, 14, 9, 'MMMMMM'); put(r, 15, 10, 'MOOM'); }
    if (state === 'thinking') { eyes(r, 'SEE', 'SSS'); put(r, 14, 9, 'SSSSSS'); put(r, 15, 10, 'SMMM'); }
    if (state === 'alert') { eyes(r, 'EwE', 'EEE'); put(r, 14, 9, 'SSMMSS'); put(r, 15, 10, 'SMMS'); put(r, 13, 6, 'SS'); put(r, 13, 16, 'SS'); }
    return r;
  }

  function drawRows(ctx, rows, px, ox, oy) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = PAL[row[x]];
        if (col) { ctx.fillStyle = col; ctx.fillRect((ox + x) * px, (oy + y) * px, px, px); }
      }
    });
  }
  function dot(ctx, px, x, y, col) { ctx.fillStyle = col; ctx.fillRect(x * px, y * px, px, px); }

  // Full body: 26x26 cells (1 cell of headroom for the bounce). Head crop: 26x19.
  function draw(cv, f) {
    const px = +cv.dataset.px || 2, state = cv.dataset.state || 'idle', prop = cv.dataset.prop;
    const head = cv.dataset.crop === 'head', ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    const bounce = (state === 'happy' || state === 'celebrate') && Math.floor(f / 4) % 2 === 0 ? -1 : 0;
    const oy = 1 + bounce;
    let rows = rowsFor(state, f);
    if (head) rows = rows.slice(0, 18);
    drawRows(ctx, rows, px, 1, oy);
    if (prop && !head) drawRows(ctx, PROPS[prop], px, 17, oy + 16);
    if (state === 'thinking') { const n = Math.floor(f / 3) % 4; [[19, 2], [21, 1], [23, 0]].slice(0, n).forEach(p => dot(ctx, px, p[0], p[1] + oy, PAL.B)); }
    if (state === 'alert' && Math.floor(f / 4) % 2 === 0) [[22, 0], [22, 1], [22, 2], [22, 4]].forEach(p => dot(ctx, px, p[0], p[1] + 1, PAL.O));
    if (state === 'celebrate') {
      const spark = (x, y, c) => { [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(d => dot(ctx, px, x + d[0], y + d[1], c)); };
      if (Math.floor(f / 3) % 2) { spark(22, 3, PAL.O); spark(2, 11, PAL.B); } else { spark(3, 3, PAL.O); spark(23, 12, PAL.B); }
    }
  }

  const canvases = [...document.querySelectorAll('canvas[data-denti]')];
  canvases.forEach(cv => {
    const px = +cv.dataset.px || 2, head = cv.dataset.crop === 'head';
    cv.width = 26 * px; cv.height = (head ? 19 : 26) * px;
    cv.setAttribute('role', 'img');
    if (!cv.hasAttribute('aria-label')) cv.setAttribute('aria-label', 'Dr. Denti');
  });

  let f = 3;
  const frame = () => canvases.forEach(cv => draw(cv, f));
  frame();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => { f++; frame(); }, 125);
})();
