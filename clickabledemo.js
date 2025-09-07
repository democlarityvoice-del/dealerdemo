  // ==============================
// Clarity Voice Demo Calls Inject (HOME) Includes Rotating Calls, Injected Stats, and Graph
// ==============================
if (!window.__cvDemoInit) {
  window.__cvDemoInit = true;

  // -------- DECLARE HOME CONSTANTS -------- //
  const HOME_REGEX     = /\/portal\/home(?:[\/?#]|$)/;
  const HOME_SELECTOR  = '#nav-home a, #nav-home';
  const SLOT_SELECTOR  = '#omp-active-body';
  const IFRAME_ID      = 'cv-demo-calls-iframe';
  const HOME_ICON_SPEAKER = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/speakericon.svg';

  // -------- BUILD HOME SOURCE -------- //
function buildSrcdoc() {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  /* ----- match portal table typography & weights ----- */
  :root{
    --font-stack: "Helvetica Neue", Helvetica, Arial, sans-serif;
    --text-color:#333;
    --muted:#666;
    --border:#ddd;
  }

  *{ box-sizing:border-box; }
  html, body{
    width:100%;
    margin:0;
    overflow-x:hidden;
    font: 13px/1.428 var(--font-stack);   /* size + line-height + stack */
    color: var(--text-color);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .call-container{
    background:#fff;
    padding:0 16px 18px;
    border-radius:6px;
    box-shadow:0 1px 3px rgba(0,0,0,.08);
    width:100%;
    max-width:100%;
  }

  table{ width:100%; border-collapse:collapse; background:#fff; table-layout:auto; }
  thead th{
    padding:8px 12px;
    font-weight:600;                 /* header is semi-bold like portal */
    font-size:13px;
    text-align:left;
    border-bottom:1px solid var(--border);
    white-space:nowrap;
  }
  td{
    padding:8px 12px;
    font-weight:400;                 /* body rows are normal weight */
    font-size:13px;
    border-bottom:1px solid #eee;
    white-space:nowrap;
    text-align:left;
  }

  tr:hover{ background:#f7f7f7; }


/* “listen in” button */
.listen-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: #f0f0f0;
  border-radius: 50%;
  border: 1px solid #cfcfcf;
  cursor: pointer;
}

.listen-btn:focus {
  outline: none;
}

.listen-btn img {
  width: 18px;
  height: 18px;
  display: block;
  opacity: 0.35; /* default faint */
  transition: opacity 0.2s ease-in-out;
}

/* NEW hover effect for either row OR button */
.listen-btn:hover img,
tr:hover .listen-btn img {
  opacity: 1;
}


/* --- STATS BLOCK --- */
  .stats-section {
    margin: 20px 16px 0;
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
  }
  .stats-title {
    font-size: 13px;
    font-weight: 600;
    margin: 12px 0 4px;
    color: var(--muted);
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 6px 16px;
    font-size: 13px;
    margin-top: 8px;
  }
  .stats-grid div {
    color: var(--text-color);
  }
  
</style>


</style>
</head><body>
  <div class="call-container">
    <table>
      <thead>
        <tr>
          <th>From</th><th>CNAM</th><th>Dialed</th><th>To</th><th>Duration</th><th></th>
        </tr>
      </thead>
      <tbody id="callsTableBody"></tbody>
    </table>
  </div>


<script>
(function () {
  // Pools
  const names = ["Carlos Rivera","Emily Tran","Mike Johnson","Ava Chen","Sarah Patel","Liam Nguyen","Monica Alvarez","Raj Patel","Chloe Bennett","Grace Smith","Jason Tran","Zoe Miller","Ruby Foster","Leo Knight"];
  const extensions = [201,203,204,207,211,215,218,219,222,227,231,235];
  const areaCodes = ["989","517","248","810","313"]; // real ACs; 555-01xx keeps full number fictional
  const CALL_QUEUE = "CallQueue", VMAIL = "VMail", SPEAK = "SpeakAccount";

  // Outbound agent display names
  const firstNames = ["Nick","Sarah","Mike","Lisa","Tom","Jenny","Alex","Maria","John","Kate","David","Emma","Chris","Anna","Steve","Beth","Paul","Amy","Mark","Jess"];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const OUTBOUND_RATE = 0.30; // ~30% outbound, 70% inbound

  // State
  const calls = [];
  const pad2 = n => String(n).padStart(2,"0");

  // Helpers
  function randomName() {
    let name, guard = 0;
    do { name = names[Math.floor(Math.random()*names.length)]; guard++; }
    while (calls.some(c => c.cnam === name) && guard < 50);
    return name;
  }
  function randomAgentName() {
    const fn = firstNames[Math.floor(Math.random()*firstNames.length)];
    const init = alphabet[Math.floor(Math.random()*alphabet.length)];
    return fn + " " + init + ".";
  }
  function randomPhone() {
    // e.g. 313-555-01xx (NANPA-safe)
    let num;
    do {
      const ac = areaCodes[Math.floor(Math.random()*areaCodes.length)];
      const last2 = pad2(Math.floor(Math.random()*100));
      num = ac + "-555-01" + last2;
    } while (calls.some(c => c.from === num) || /666/.test(num));
    return num;
  }
  function randomDialed() {
    // 800-xxx-xxxx, avoid 666
    let num;
    do {
      num = "800-" + (100+Math.floor(Math.random()*900)) + "-" + (1000+Math.floor(Math.random()*9000));
    } while (/666/.test(num));
    return num;
  }
  function randomExtension() {
    let ext, guard = 0;
    do { ext = extensions[Math.floor(Math.random()*extensions.length)]; guard++; }
    while (calls.some(c => c.ext === ext) && guard < 50);
    return ext;
  }

  // New call (inbound or outbound)
  function generateCall() {
    const outbound = Math.random() < OUTBOUND_RATE;
    const ext = randomExtension();
    const start = Date.now();

    if (outbound) {
      // Agent dialing a customer
      const dial = randomPhone(); // external number
      return {
        from: "Ext. " + ext,
        cnam: randomAgentName(),   // agent display
        dialed: dial,
        to: dial,                  // outbound: To = dialed
        ext,
        outbound: true,
        start,
        t: () => {
          const elapsed = Math.min(Date.now()-start, (4*60+32)*1000);
          const s = Math.floor(elapsed/1000);
          return String(Math.floor(s/60)) + ":" + pad2(s%60);
        }
      };
    }

    // Inbound customer call
    const from = randomPhone();
    const cnam = randomName();
    const dialed = randomDialed();
    const to = Math.random() < 0.05
      ? (Math.random() < 0.03 ? SPEAK : VMAIL)
      : CALL_QUEUE;

    return {
      from, cnam, dialed, to, ext,
      outbound: false,
      start,
      t: () => {
        const elapsed = Math.min(Date.now()-start, (4*60+32)*1000);
        const s = Math.floor(elapsed/1000);
        return String(Math.floor(s/60)) + ":" + pad2(s%60);
      }
    };
  }

  // Lifecycle
  function updateCalls() {
    // Occasionally remove one
    if (calls.length > 5 || Math.random() < 0.3) {
      if (calls.length) calls.splice(Math.floor(Math.random()*calls.length), 1);
    }
    // Keep up to 5
    if (calls.length < 5) calls.push(generateCall());

    // State transitions for inbound only
    const now = Date.now();
    calls.forEach(c => {
      if (!c.outbound && c.to === CALL_QUEUE && now - c.start > 5000) {
        c.to = "Ext. " + c.ext;  // no agent name here
      }
      if (!c.outbound && c.to === SPEAK && now - c.start > 2000) {
        c.to = VMAIL;
      }
    });
  }

  function render() {
  const tb = document.getElementById("callsTableBody");
  if (!tb) return;
  tb.innerHTML = "";
  calls.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = \`
      <td>\${c.from}</td>
      <td>\${c.cnam}</td>
      <td>\${c.dialed}</td>
      <td>\${c.to}</td>
      <td>\${c.t()}</td>
      <td>
        <button class="listen-btn" aria-pressed="false" title="Listen in">
          <img src="${HOME_ICON_SPEAKER}" alt="">
        </button>
      </td>\`;
    tb.appendChild(tr);
  });
}

  // Seed + loop
  (function seed(){ calls.push(generateCall()); render(); })();
  setInterval(() => { updateCalls(); render(); }, 1500);

  // Single-active toggle for "Listen in"
  document.addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target : null;
    const btn = el && el.closest(".listen-btn");
    if (!btn) return;
    document.querySelectorAll('.listen-btn[aria-pressed="true"]').forEach(b => {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed","false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-pressed","true");
  });
})();
<\/script>
</body></html>`;
}


// ===== DEMO BANNER (header) =====
(() => {
  const BANNER_ID = 'cv-demo-banner-top';
  const STYLE_ID  = 'cv-demo-banner-style-top';

  // find the document that actually owns the real header
  function findHeaderDoc(win) {
    try {
      const d = win.document;
      if (d.querySelector('#header') && d.querySelector('#header-logo') && d.querySelector('#header-user')) return d;
    } catch (_) {}
    for (let i = 0; i < win.frames.length; i++) {
      const found = findHeaderDoc(win.frames[i]);
      if (found) return found;
    }
    return null;
  }

  function mountDemoBannerInHeader() {
    const doc = findHeaderDoc(window.top) || findHeaderDoc(window);
    if (!doc) return;

    // already mounted? bail
    if (doc.getElementById(BANNER_ID)) return;

    const header = doc.querySelector('#header');
    const logo   = doc.querySelector('#header-logo');
    const right  = doc.querySelector('#header-user');
    if (!header || !logo || !right) return;

    // styles (once)
    if (!doc.getElementById(STYLE_ID)) {
      const st = doc.createElement('style');
      st.id = STYLE_ID;
      st.textContent = `
        #${BANNER_ID}{
          position:absolute; display:flex; align-items:center; gap:8px; white-space:nowrap; z-index:1000;
          background:#fff; color:#333; border:1px solid #d7dbe2; border-radius:8px; padding:4px 8px;
          box-shadow:0 1px 2px rgba(0,0,0,.05); font:12px/1.2 "Helvetica Neue", Helvetica, Arial, sans-serif;
          transform-origin:center center;
        }
        #${BANNER_ID} .cv-title{ font-weight:700; color:#2b6cb0 }
        #${BANNER_ID} button{
          font-size:12px; line-height:1; padding:4px 8px; border:1px solid #c8ccd4; border-radius:6px;
          background:linear-gradient(#fff,#f4f4f4); cursor:pointer
        }
        #${BANNER_ID} button:hover{ background:#f8f8f8 }
      `;
      doc.head.appendChild(st);
    }

    // header must be positioned
    if (doc.defaultView.getComputedStyle(header).position === 'static') header.style.position = 'relative';

    // build banner
    const banner = doc.createElement('div');
    banner.id = BANNER_ID;
    banner.innerHTML = `
      <span class="cv-title">Demo Mode:</span>
      <span>Some updates may not reflect outside of Live Mode.</span>
      <button type="button" id="cv-demo-refresh-top">Refresh Demo</button>
    `;
    header.appendChild(banner);

    // button action: hard refresh with cache bust
    banner.querySelector('#cv-demo-refresh-top').onclick = () => {
      const url = new doc.defaultView.URL(doc.defaultView.location.href);
      url.searchParams.set('demo-refresh', Date.now().toString());
      doc.defaultView.location.replace(url.toString());
    };

    // placement: center between logo & right cluster; autoscale to fit
    function place() {
      const hRect = header.getBoundingClientRect();
      const lRect = logo.getBoundingClientRect();
      const rRect = right.getBoundingClientRect();

      const pad = 8;
      const gapLeft  = lRect.right + pad;
      const gapRight = rRect.left  - pad;
      const gapWidth = Math.max(0, gapRight - gapLeft);

      const midX = (gapLeft + gapRight) / 2 - hRect.left;
      const midY = (rRect.top + rRect.bottom) / 2 - hRect.top;

      banner.style.left = `${midX}px`;
      banner.style.top  = `${midY}px`;
      banner.style.transform = 'translate(-50%,-50%) scale(1)';

      requestAnimationFrame(() => {
        const need = banner.offsetWidth;
        const have = gapWidth - 2;
        const scale = have > 0 ? Math.min(1, Math.max(0.6, have / need)) : 0.6; // min 60%
        banner.style.transform = `translate(-50%,-50%) scale(${scale})`;
      });
    }

    place();
    doc.defaultView.addEventListener('resize', place);
    // keep a handle for teardown
    doc.defaultView.__cvDemoPlace = place;
  }

  function unmountDemoBannerInHeader() {
    const doc = findHeaderDoc(window.top) || findHeaderDoc(window);
    if (!doc) return;
    doc.getElementById(BANNER_ID)?.remove();
    // leave the style in place if you plan to mount across pages; remove if you prefer:
    // doc.getElementById(STYLE_ID)?.remove();
    if (doc.defaultView.__cvDemoPlace) {
      doc.defaultView.removeEventListener('resize', doc.defaultView.__cvDemoPlace);
      delete doc.defaultView.__cvDemoPlace;
    }
  }

  // expose for your page scripts
  window.mountDemoBannerInHeader   = mountDemoBannerInHeader;
  window.unmountDemoBannerInHeader = unmountDemoBannerInHeader;
})();



  // -------- REMOVE HOME -------- //
  function removeHome() {
  const ifr = document.getElementById(IFRAME_ID);
  if (ifr && ifr.parentNode) ifr.parentNode.removeChild(ifr);

  const slot = document.querySelector(SLOT_SELECTOR);
  if (slot) {
    const hidden = slot.querySelector('[data-cv-demo-hidden="1"]');
    if (hidden && hidden.nodeType === Node.ELEMENT_NODE) {
      hidden.style.display = '';                // <-- FIXED
      hidden.removeAttribute('data-cv-demo-hidden');
    }
  }
}


  // -------- INJECT HOME -------- //
  function injectHome() {
  if (document.getElementById(IFRAME_ID)) return;
  const slot = document.querySelector(SLOT_SELECTOR);
  if (!slot) return;

  function findAnchor(el){
    const preferred = el.querySelector('.table-container.scrollable-small');
    if (preferred) return preferred;
    if (el.firstElementChild) return el.firstElementChild;
    let n = el.firstChild; while (n && n.nodeType !== Node.ELEMENT_NODE) n = n.nextSibling;
    return n || null;
  }

  const anchor = findAnchor(slot);

  if (anchor && anchor.nodeType === Node.ELEMENT_NODE) {
    anchor.style.display = 'none';                 // <-- FIXED
    anchor.setAttribute('data-cv-demo-hidden','1');
  }

  const iframe = document.createElement('iframe');
  iframe.id = IFRAME_ID;
  iframe.style.cssText = 'border:none;width:100%;display:block;margin-top:0;height:360px;'; // <-- FIXED
  iframe.setAttribute('scrolling','yes');
  iframe.srcdoc = buildSrcdoc();

  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(iframe, anchor);
  else slot.appendChild(iframe);
}

  // // ===== HELPERS for Chart =====
function fmtMMMDDYYYY(d){
  const mo = d.toLocaleString('en-US', { month: 'long' });
  return `${mo} ${String(d.getDate()).padStart(2,'0')}, ${d.getFullYear()}`;
}
function addDays(d, n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }

// Generate ~60 points across 10 days, calmer profile all for Chart (0..18)
function generateFakeCallGraphData(count = 60, yMax = 18){
  const pts = [];
  let y = Math.random()*4; // start gentle
  for (let i = 0; i < count; i++) {
    y += (Math.random() - 0.5) * 2;
    if (Math.random() < 0.07) y += 6 + Math.random() * 6;
    if (Math.random() < 0.05) y -= 4;
    y = Math.max(0, Math.min(yMax, y));
    pts.push({ x: i, y: Math.round(y) });
  }
  return pts;
}

// Build SVG: responsive (width:100% / height:auto), grids, right-side Y labels
function buildCallGraphSVG(dataPoints){
  const width = 650, height = 350;
  const pad = { top: 30, right: 12, bottom: 36, left: 30 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const yMax = 18;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = addDays(today, -10);
  const daySpan = 10;

  const xStep = innerW / (dataPoints.length - 1);
  const yPx = v => pad.top + (1 - v / yMax) * innerH;
  const xPx = i => pad.left + i * xStep;

  const pathD = dataPoints.map((pt, i) => `${i ? 'L' : 'M'}${xPx(i)},${yPx(pt.y)}`).join(' ');

  const grid = [];
  for (let y = 0; y <= yMax; y += 2) {
    const yy = yPx(y);
    grid.push(`<line x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}" stroke="#e3e6ea" stroke-width="1"/>`);
  }

  const vStep = Math.max(1, Math.round(dataPoints.length / 12));
  for (let i = 0; i < dataPoints.length; i += vStep) {
    const xx = xPx(i);
    grid.push(`<line x1="${xx}" y1="${pad.top}" x2="${xx}" y2="${height - pad.bottom}" stroke="#f1f3f5" stroke-width="1"/>`);
  }

  const yLabels = [];
  for (let y = 0; y <= yMax; y += 2) {
    const yy = yPx(y);
    yLabels.push(`<text x="${width - pad.right - 6}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#666">${y}</text>`);
  }

  const xLabels = [];
  const steps = 6;
  const fmtShort = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const xx = pad.left + frac * innerW;
    const labelDate = addDays(start, Math.round(frac * daySpan));
    xLabels.push(`<text x="${xx}" y="${height - 10}" font-size="11" fill="#777" text-anchor="middle">${fmtShort(labelDate)}</text>`);
  }

  const peakIdx = [];
  for (let i = 1; i < dataPoints.length - 1; i++) {
    const a = dataPoints[i - 1].y, b = dataPoints[i].y, c = dataPoints[i + 1].y;
    if (b >= a && b >= c && (b > a || b > c)) peakIdx.push(i);
  }

  const peaks = peakIdx.map(i => {
    const x = xPx(i), y = yPx(dataPoints[i].y);
    const frac = i / (dataPoints.length - 1);
    const dayOffset = Math.round(frac * daySpan);
    const d = addDays(start, dayOffset);
    const count = dataPoints[i].y;
    const label = `${fmtShort(d)} - ${count} call${count === 1 ? '' : 's'}`;

    return `
      <g class="peak" transform="translate(${x},${y})">
        <rect x="-8" y="-8" width="16" height="16" fill="transparent"></rect>
        <circle r="0" fill="#3366cc"></circle>
        <g class="tip" transform="translate(8,-10)" opacity="0">
          <rect x="0" y="-16" rx="3" ry="3" width="${8 + label.length * 6}" height="18" fill="white" stroke="#bbb"></rect>
          <text x="6" y="-3" font-size="11" fill="#333">${label}</text>
        </g>
      </g>`;
  }).join('');

  const css = `
    .peak:hover circle { r:5; }
    .peak:hover .tip { opacity:1; }
  `;

  return `
  <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; background:white; display:block;">
    <style>${css}</style>
    <g>${grid.join('')}</g>
    <g>${yLabels.join('')}</g>
    <path d="${pathD}" fill="none" stroke="#3366cc" stroke-width="2"/>
    <g>${peaks}</g>
    <g>${xLabels.join('')}</g>
  </svg>`;
}

// Wait for the native chart to load (SPA-safe + layout check) and then lock/replace
function waitForChartThenReplace(timeoutMs = 45000) {
  const SEL = '#omp-callgraphs-body #chart_div, #omp-callgraphs-body .chart-container #chart_div';
  const t0 = Date.now();
  let done = false, raf = 0, mo = null;

  const ready = h => h && h.offsetWidth > 0 && h.offsetHeight > 0;

  function tryRun() {
    if (done) return;
    const host = document.querySelector(SEL);
    if (ready(host)) {
      done = true;
      if (raf) cancelAnimationFrame(raf);
      if (mo) mo.disconnect();
      replaceHomeCallGraph(host);
      return;
    }
    if (Date.now() - t0 > timeoutMs) {
      if (raf) cancelAnimationFrame(raf);
      if (mo) mo.disconnect();
      console.warn('[CV-DEMO] timeout waiting for chart slot');
    }
  }

  // watch for late SPA insertions
  mo = new MutationObserver(tryRun);
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // catch 0→>0 layout transition
  (function loop(){ tryRun(); if (!done) raf = requestAnimationFrame(loop); })();

  // in case we’re already ready
  tryRun();
}


  // Demo Banner - Only on Home for now:
if (/\/portal\/home\b/.test(location.pathname)) {
  mountDemoBannerInHeader();
}

// Replace and LOCK the chart slot so native redraws can’t overwrite it
function replaceHomeCallGraph(host) {
  if (!host) return;

  // style neutralization (slot only)
  host.style.height = 'auto';
  host.style.minHeight = '0';

  // mark the card we’re controlling
  const card = host.closest('.chart-container') || host;
  card.classList.add('cv-demo-graph');

  // lock attribute: only our root is allowed inside the slot
  host.setAttribute('data-cv-locked', '1');

  // attribute-scoped CSS for this specific slot/card
  let st = document.getElementById('cv-demo-graph-style');
  if (!st) {
    st = document.createElement('style');
    st.id = 'cv-demo-graph-style';
    st.textContent = `
      .cv-demo-graph::before, .cv-demo-graph::after { display:none !important; content:none !important; }
      /* our SVG sizing */
      .cv-demo-graph #chart_div .cv-graph-root svg { display:block; width:100%; height:auto; }
      /* HARD LOCK: anything the native script adds is hidden immediately */
      #omp-callgraphs-body #chart_div[data-cv-locked="1"] > :not(.cv-graph-root) { display:none !important; }
    `;
    document.head.appendChild(st);
  }

  // build our graph inside a dedicated root
  const root = document.createElement('div');
  root.className = 'cv-graph-root';
  root.innerHTML = buildCallGraphSVG(generateFakeCallGraphData());

  // atomic swap
  host.replaceChildren(root);

  // guard AFTER swap: purge any non-root children the native code tries to add
  setTimeout(() => {
    if (host._cvGuard) host._cvGuard.disconnect();
    const guard = new MutationObserver(muts => {
      for (const m of muts) {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1 && !n.classList.contains('cv-graph-root')) n.remove();
        });
      }
      // if our root got removed, restore it
      if (!host.querySelector('.cv-graph-root')) {
        const r = document.createElement('div');
        r.className = 'cv-graph-root';
        r.innerHTML = buildCallGraphSVG(generateFakeCallGraphData());
        host.replaceChildren(r);
      }
    });
    guard.observe(host, { childList: true });
    host._cvGuard = guard;
  }, 0);
}


// Safe DOM-ready boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForChartThenReplace);
} else {
  waitForChartThenReplace();
}

  
  // -------- WAIT HOME AND INJECT -------- //
  function waitForSlotAndInject(tries = 0) {
    const slot = document.querySelector(SLOT_SELECTOR);
    if (slot && slot.isConnected) {
      requestAnimationFrame(() => requestAnimationFrame(() => injectHome()));
      return;
    }
    if (tries >= 12) return;
    setTimeout(() => waitForSlotAndInject(tries + 1), 250);
  }

  
 // -------- HOME STATS INJECTION NUMBERS ONLY - Leave Native Containers-------- //
  function cvReplaceStats() {
    const replacements = {
      // Today
      'current-active-calls': '5',
      'calls-today': '37',
      'total-minutes-today': '263',
      'avg-talkd-time': '7',
      'sms_inbound_today': '1',
      'sms_outbound_today': '2',
      'video-meetings-today': '0',

      // This Month
     'total-min-current': '752',
     'peak-active-current': '25',
     'sms_inbound_current': '122',
     'sms_outbound_current': '282',
     'video_meetings_current': '15',

     // Previous Month
     'total-min-last': '62034',
     'peak-active-last': '29',
     'sms_inbound_last': '958',
     'sms_outbound_last': '892',
     'video_meetings_last': '23'
   };

  for (const [id, value] of Object.entries(replacements)) {
    const el = document.querySelector(`#${id} .helpsy`);
    if (el) {
      el.textContent = value;
    } else {
      console.warn('Missing stat element:', id);
    }
  }
}

  

  // -------- HOME ROUTING -------- //
function onHomeEnter() {
  setTimeout(() => {
    waitForSlotAndInject();
    setTimeout(cvReplaceStats, 1000); // give stats table time to load
  }, 600);
}


  function handleHomeRouteChange(prevHref, nextHref) {
    const wasHome = HOME_REGEX.test(prevHref);
    const isHome  = HOME_REGEX.test(nextHref);
    if (!wasHome && isHome) onHomeEnter();
    if ( wasHome && !isHome) removeHome();
  }

 (function watchHomeURLChanges() {
  let last = location.href;
  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function () {
    const prev = last;
    const ret  = origPush.apply(this, arguments);
    const now  = location.href;
    last = now;
    handleHomeRouteChange(prev, now);
    return ret;
  };

  history.replaceState = function () {
    const prev = last;
    const ret  = origReplace.apply(this, arguments);
    const now  = location.href;
    last = now;
    handleHomeRouteChange(prev, now);
    return ret;
  };

  // Catch SPA mutations that don't use push/replace
  const mo = new MutationObserver(() => {
    if (location.href !== last) {
      const prev = last;
      const now  = location.href;
      last = now;
      handleHomeRouteChange(prev, now);
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Catch back/forward
  window.addEventListener('popstate', () => {
    const prev = last;
    const now  = location.href;
    if (now !== prev) {
      last = now;
      handleHomeRouteChange(prev, now);
    }
  });

  // Home nav click hook
  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (el && el.closest(HOME_SELECTOR)) setTimeout(onHomeEnter, 0);
  });

  // Initial landing
  if (HOME_REGEX.test(location.href)) onHomeEnter();
})();
} // closes __cvDemoInit


 // ==============================
// CALL HISTORY
// ==============================

if (!window.__cvCallHistoryInit) {
  window.__cvCallHistoryInit = true;

  // -------- DECLARE CALL HISTORY CONSTANTS -------- //
  const CALLHISTORY_REGEX       = /\/portal\/callhistory(?:[\/?#]|$)/;
  const CALLHISTORY_SELECTOR    = '#nav-callhistory a, #nav-call-history';
  const CALLHISTORY_SLOT        = 'div.callhistory-panel-main';
  const CALLHISTORY_IFRAME_ID   = 'cv-callhistory-iframe';

  const HISTORY_ICON_LISTEN             = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/speakericon.svg';
  const HISTORY_ICON_DOWNLOAD           = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/download-solid-full.svg';
  const HISTORY_ICON_CRADLE             = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/file-arrow-down-solid-full.svg';
  const HISTORY_ICON_NOTES              = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/newspaper-regular-full.svg';
  const HISTORY_ICON_TRANSCRIPT         = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/transcript.svg';

 // -------- BUILD CALL HISTORY SRCDOC (DROP-IN) --------
function buildCallHistorySrcdoc() {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{
    --font-stack: "Helvetica Neue", Helvetica, Arial, sans-serif;
    --text-color:#333;
    --muted:#666;
    --border:#ddd;
  }
  *{ box-sizing:border-box; }
  html, body{
    width:100%;
    margin:0;
    overflow-x:auto; /* allow a horizontal scrollbar if needed */
    font: 13px/1.428 var(--font-stack);
    color: var(--text-color);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .call-container{
    background:#fff;
    padding:0 16px 18px;
    border-radius:6px;
    box-shadow:0 1px 3px rgba(0,0,0,.08);
    width:100%;
    max-width:100%;
  }
  table{ width:100%; border-collapse:collapse; background:#fff; table-layout:auto; }
  thead th{
    padding:8px 12px;
    font-weight:600;
    font-size:13px;
    text-align:left;
    border-bottom:1px solid var(--border);
    white-space:nowrap;
  }
  td{
    padding:8px 12px;
    font-weight:400;
    font-size:13px;
    border-bottom:1px solid #eee;
    white-space:nowrap;
    text-align:left;
  }
  tr:hover{ background:#f7f7f7; }

  /* QoS tag */
  .qos-tag{
    display:inline-block;
    padding:0 6px;
    line-height:18px;
    min-width:28px;
    text-align:center;
    font-weight:600;
    font-size:12px;
    border-radius:3px;
    background:#2e7d32;
    color:#fff;
  }

  /* Keep phone links blue (not purple) */
  .call-container a,
  .call-container a:visited,
  .call-container a:active { color:#1a73e8; text-decoration:none; }
  .call-container a:hover { text-decoration:underline; }

  /* --- Icon sizing + visibility (circles by default) --- */
  .icon-cell{ display:flex; gap:6px; }
  .icon-btn{
    width:26px; height:26px; border-radius:50%;
    background:#f5f5f5; border:1px solid #cfcfcf;
    display:inline-flex; align-items:center; justify-content:center;
    padding:0; cursor:pointer;
  }
  .icon-btn img{ width:16px; height:16px; opacity:.35; transition:opacity .12s; }
  .icon-btn:hover img, tr:hover .icon-btn img{ opacity:1; }
  .icon-btn:hover, tr:hover .icon-btn{ background:#e9e9e9; border-color:#bdbdbd; }

  /* Listen = plain (no circle) */
  .icon-btn--plain{ background:transparent; border:0; width:24px; height:24px; }
  .icon-btn--plain:hover, tr:hover .icon-btn--plain{ background:transparent; border:0; }
  .icon-btn--plain img{ opacity:.55; }
  .icon-btn--plain:hover img, tr:hover .icon-btn--plain img{ opacity:1; }

  /* Dropped audio row (visual only) */
  .cv-audio-row td{ background:#f3f6f8; padding:10px 12px; border-top:0; }
  .cv-audio-player{ display:flex; align-items:center; gap:12px; }
  .cv-audio-play{ width:24px; height:24px; background:transparent; border:0; cursor:pointer; }
  .cv-audio-play:before{ content:''; display:block; width:0; height:0;
    border-left:10px solid #333; border-top:6px solid transparent; border-bottom:6px solid transparent; }
  .cv-audio-time{ font-weight:600; color:#333; }
  .cv-audio-bar{ flex:1; height:6px; background:#e0e0e0; border-radius:3px; position:relative; }
  .cv-audio-bar-fill{ position:absolute; left:0; top:0; bottom:0; width:0%; background:#9e9e9e; border-radius:3px; }
  .cv-audio-right{ display:flex; align-items:center; gap:12px; }
  .cv-audio-icon{ width:20px; height:20px; opacity:.6; }

  /* Modal overlay */
  #cv-cradle-modal { position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; }
  .cv-modal-backdrop { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.5); }
  .cv-modal { position:relative; background:#fff; width:600px; max-width:90%; margin:40px auto; border-radius:6px; box-shadow:0 2px 10px rgba(0,0,0,.3); padding:0; }
  .cv-modal-header, .cv-modal-footer { padding:10px 16px; border-bottom:1px solid #ddd; }
  .cv-modal-header { display:flex; justify-content:space-between; align-items:center; }
  .cv-modal-body { padding:16px; max-height:400px; overflow-y:auto; }
  .cv-modal-footer { border-top:1px solid #ddd; border-bottom:0; text-align:right; }
  .cv-modal-close { background:none; border:none; font-size:18px; cursor:pointer; }
  .cv-ctg-list { list-style:none; padding:0; margin:0; font-size:13px; }
  .cv-ctg-list li { margin:6px 0; }

  /* Modal sizing to match other modals */
.cv-modal { width: 720px; max-width: 92%; }
.cv-modal-body { min-height: 380px; max-height: 65vh; overflow-y: auto; }

/* CTG timeline layout */
.cvctg-steps { padding: 8px 6px 2px; }
.cvctg-step {
  display: grid;
  grid-template-columns: 140px 40px 1fr;
  align-items: start;
  gap: 10px;
  margin: 10px 0;
}
.cvctg-time { font-weight: 600; color: #333; }
.cvctg-time .cvctg-delta { color:#9aa0a6; font-weight: 500; font-size: 11px; margin-top: 2px; }

.cvctg-marker { display: flex; flex-direction: column; align-items: center; }
.cvctg-icon {
  width: 32px;
  height: 32px;
  padding: 6px;
}
.cvctg-icon img {
  width: 20px;
  height: 20px;
}



.cvctg-vert {
  display: none !important;
}

.cvctg-text { color: #444; }

/* --- Modal header/title --- */
.cv-modal-header {
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.cv-modal-header > span {
  font-size: 18px;      /* bigger */
  font-weight: 700;     /* bold  */
  color: #1f2937;
}

/* --- Modal body height to match other modals --- */
.cv-modal-body {
  min-height: 380px;    /* keeps a healthy vertical size */
  max-height: 65vh;
  overflow-y: auto;
}

/* --- Footer + Close button like screenshot --- */
.cv-modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}
.cv-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 6px 12px;
  border: 1px solid #cfd3d7;
  border-radius: 4px;
  background: #fff;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
}
.cv-btn:hover { background: #f9fafb; }



/* --- CTG timeline layout (icons in the rail, dashed connector) --- */
.cvctg-steps { padding: 8px 6px 2px; }

.cvctg-step {
  display: grid;
  grid-template-columns: 120px 40px 1fr; /* time | rail | text */
  align-items: start;
  gap: 12px;
  margin: 12px 0;
}

.cvctg-time {
  text-align: right;
  font-weight: 700;
  color: #111827;
}
.cvctg-time .cvctg-delta {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #9aa0a6;
  font-weight: 500;
}


.cvctg-icon {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #d1d5db;
  box-shadow: 0 1px 0 rgba(0,0,0,.04);
  display: inline-flex; align-items: center; justify-content: center;
}
.cvctg-icon img { width: 18px; height: 18px; display:block; }



/* dashed vertical path between steps */
.cvctg-vert {
  flex: 1 1 auto;
  width: 0;
  border-left: 2px dashed #d8dbe0;
  margin-top: 6px;
}
.cvctg-step:last-child .cvctg-vert { display: none; }

.cvctg-text { color: #374151; }



#cv-notes-modal { position: fixed; inset: 0; z-index: 10002; } /* above CTG's 9999 */
#cv-notes-modal .cv-modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.5); }


</style>
</head><body>
  <div class="call-container">
    <table>
      <thead>
        <tr>
          <th>From Name</th><th>From</th><th>QOS</th>
          <th>Dialed</th><th>To Name</th><th>To</th><th>QOS</th>
          <th>Date</th><th>Duration</th><th>Disposition</th><th>Release Reason</th><th></th>
        </tr>
      </thead>
      <tbody id="cvCallHistoryTableBody"></tbody>
    </table>
  </div>

<script>
(function () {
  // Icons (Listen is plain, others circles)
  const ICONS = [
    { key: 'download',   src: '${HISTORY_ICON_DOWNLOAD}',   title: 'Download',   circle: true  },
    { key: 'listen',     src: '${HISTORY_ICON_LISTEN}',     title: 'Listen',     circle: true  },
    { key: 'cradle',     src: '${HISTORY_ICON_CRADLE}',     title: 'Cradle',     circle: true  },
    { key: 'notes',      src: '${HISTORY_ICON_NOTES}',      title: 'Notes',      circle: true  },
    { key: 'transcript', src: '${HISTORY_ICON_TRANSCRIPT}', title: 'Transcript', circle: true  }
  ];

  /* Helpers */
  function isExternalNumber(v){
    v = String(v || '');
    var digits = '';
    for (var i = 0; i < v.length; i++){
      var c = v.charCodeAt(i);
      if (c >= 48 && c <= 57) digits += v[i];
    }
    return digits.length >= 10;
  }
  function wrapPhone(v){
    return isExternalNumber(v) ? '<a href="#" title="Click to Call">' + v + '</a>' : v;
  }
  const DATE_GAPS_MIN = [0,3,2,2,2,2,2,2,2,2,2,2,2,3,2,2,2,2,2,3,2,2,2,3,2];
  function fmtToday(ts){
    var d = new Date(ts), h = d.getHours(), m = String(d.getMinutes()).padStart(2,'0');
    var ap = h >= 12 ? 'pm' : 'am';
    h = (h % 12) || 12;
    return 'Today, ' + h + ':' + m + ' ' + ap;
  }

// Keep "To" exactly as the data says.
// (No inference from From/Dialed.)
function normalizeTo(row) {
  return row.to || '';
}



// --- helpers for classifying and labeling ---
function extractExt(text){
  var m = /Ext\.?\s*(\d{3})/i.exec(String(text || ''));
  if (m) return m[1];
  var digits = String(text || '').replace(/\D/g,'');
  return digits.length === 3 ? digits : '';
}


// ---- STATIC SNAPSHOT (25 rows) — DealerDemo mapped ----
const rows = [
  { cnam:"Ruby Foster",  from:"(248) 555-0102", q1:"4.5", dialed:"248-436-3443",
    toName:"", to:"Ext. 202", q2:"4.5", date:"Today, 10:02 pm", duration:"0:56",
    disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Ethan Moore",  from:"221", q1:"4.4", dialed:"(517) 555-0162",
    toName:"", to:"(517) 555-0162", q2:"4.3", date:"Today, 9:59 pm",
    duration:"1:53", disposition:"", release:"Term: Bye", ctgType:"outbound" },

  { cnam:"Leo Knight",   from:"(313) 555-0106", q1:"4.3", dialed:"313-995-9080",
    toName:"", to:"Ext. 202", q2:"4.4", date:"Today, 9:57 pm",
    duration:"1:53", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Ava Chen",     from:"(313) 555-0151", q1:"4.4", dialed:"248-436-3449",
    toName:"", to:"Ext. 201", q2:"4.3", date:"Today, 9:55 pm",
    duration:"0:56", disposition:"", release:"Term: Bye", ctgType:"inbound" },

  { cnam:"Isabella Martinez", from:"212", q1:"4.5", dialed:"(248) 555-0110",
    toName:"", to:"(248) 555-0110", q2:"4.4", date:"Today, 9:53 pm",
    duration:"2:36", disposition:"", release:"Orig: Bye", ctgType:"outbound" },

  { cnam:"Zoe Miller",   from:"(248) 555-0165", q1:"4.2", dialed:"248-436-3443",
    toName:"", to:"Ext. 201", q2:"4.3", date:"Today, 9:51 pm",
    duration:"9:58", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Raj Patel",    from:"(810) 555-0187", q1:"4.3", dialed:"313-995-9080",
    toName:"", to:"Ext. 200", q2:"4.2", date:"Today, 9:49 pm",
    duration:"4:49", disposition:"", release:"Term: Bye", ctgType:"inbound" },

  { cnam:"Zoe Miller",   from:"(810) 555-0184", q1:"4.4", dialed:"248-436-3449",
    toName:"", to:"Ext. 200", q2:"4.4", date:"Today, 9:47 pm",
    duration:"13:01", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Tucker Jones", from:"(989) 555-0128", q1:"4.5", dialed:"248-436-3443",
    toName:"", to:"Ext. 201", q2:"4.4", date:"Today, 9:45 pm",
    duration:"32:06", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Liam Nguyen",  from:"(810) 555-0100", q1:"4.2", dialed:"313-995-9080",
    toName:"", to:"Ext. 202", q2:"4.3", date:"Today, 9:43 pm",
    duration:"1:28", disposition:"", release:"Term: Bye", ctgType:"inbound" },

  { cnam:"Ava Chen",     from:"(313) 555-0108", q1:"4.3", dialed:"248-436-3449",
    toName:"", to:"Ext. 202", q2:"4.5", date:"Today, 9:41 pm",
    duration:"15:51", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Maya Brooks",  from:"(517) 555-0126", q1:"4.4", dialed:"248-436-3443",
    toName:"", to:"Ext. 200", q2:"4.2", date:"Today, 9:39 pm",
    duration:"14:27", disposition:"", release:"Term: Bye", ctgType:"inbound" },

  { cnam:"Jack Burton",  from:"(517) 555-0148", q1:"4.3", dialed:"313-995-9080",
    toName:"", to:"Ext. 202", q2:"4.3", date:"Today, 9:37 pm",
    duration:"14:28", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Zoe Miller",   from:"(248) 555-0168", q1:"4.4", dialed:"248-436-3449",
    toName:"", to:"Ext. 201", q2:"4.4", date:"Today, 9:34 pm",
    duration:"20:45", disposition:"", release:"Term: Bye", ctgType:"inbound" },

  { cnam:"Sarah Patel",  from:"(248) 555-0196", q1:"4.2", dialed:"248-436-3443",
    toName:"", to:"Ext. 202", q2:"4.5", date:"Today, 9:32 pm",
    duration:"12:05", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Liam Turner",  from:"202", q1:"4.5", dialed:"(248) 555-0191",
    toName:"", to:"(248) 555-0191", q2:"4.4", date:"Today, 9:30 pm",
    duration:"27:22", disposition:"", release:"Orig: Bye", ctgType:"outbound" },

  { cnam:"Chloe Bennett",from:"(313) 555-0120", q1:"4.3", dialed:"313-995-9080",
    toName:"", to:"Ext. 201", q2:"4.2", date:"Today, 9:28 pm",
    duration:"22:17", disposition:"", release:"Term: Bye", ctgType:"inbound" },

  { cnam:"Abbey Palmer", from:"200", q1:"4.4", dialed:"(810) 555-0112",
    toName:"", to:"(810) 555-0112", q2:"4.3", date:"Today, 9:26 pm",
    duration:"17:20", disposition:"", release:"Orig: Bye", ctgType:"outbound" },

  { cnam:"Carlos Rivera",from:"(517) 555-0177", q1:"4.5", dialed:"248-436-3449",
    toName:"", to:"Ext. 201", q2:"4.4", date:"Today, 9:24 pm",
    duration:"7:41", disposition:"", release:"Term: Bye", ctgType:"inbound" },

  { cnam:"Monica Alvarez",from:"(989) 555-0113", q1:"4.2", dialed:"248-436-3443",
    toName:"", to:"Ext. 202", q2:"4.2", date:"Today, 9:21 pm",
    duration:"2:36", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Mike Jones",   from:"210", q1:"4.4", dialed:"(313) 555-0179",
    toName:"", to:"(313) 555-0179", q2:"4.3", date:"Today, 9:19 pm",
    duration:"5:12", disposition:"", release:"Term: Bye", ctgType:"outbound" },

  { cnam:"Ruby Foster",  from:"(810) 555-0175", q1:"4.3", dialed:"313-995-9080",
    toName:"", to:"Ext. 202", q2:"4.5", date:"Today, 9:17 pm",
    duration:"10:44", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Bob Smith",    from:"220", q1:"4.5", dialed:"(989) 555-0140",
    toName:"", to:"(989) 555-0140", q2:"4.4", date:"Today, 9:15 pm",
    duration:"6:05", disposition:"", release:"Term: Bye", ctgType:"outbound" },

  { cnam:"Zoe Miller",   from:"(248) 555-0144", q1:"4.2", dialed:"248-436-3449",
    toName:"", to:"CallQueue", q2:"4.3", date:"Today, 9:12 pm",
    duration:"0:39", disposition:"", release:"Orig: Bye", ctgType:"inbound" },

  { cnam:"Emma Johnson", from:"201", q1:"4.4", dialed:"(517) 555-0170",
    toName:"", to:"(517) 555-0170", q2:"4.5", date:"Today, 9:10 pm",
    duration:"11:33", disposition:"", release:"Orig: Bye", ctgType:"outbound" }
];





  /* Render (dynamic Date only) */
  function renderRowsDynamicDate(){
    var tbody  = document.getElementById('cvCallHistoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    var cursor = Date.now();

    rows.forEach(function(row, idx){
      var tr = document.createElement('tr');
      var dateStr = fmtToday(cursor);

var iconsHTML = ICONS.map(function(icon){
  var cls = icon.circle ? 'icon-btn' : 'icon-btn icon-btn--plain';
  // For cradle buttons, add data-ctg from the row
  var extra = (icon.key === "cradle") ? ' data-ctg="'+row.ctgType+'"' : '';
  return '<button class="'+cls+'" data-action="'+icon.key+'"'+extra+' title="'+icon.title+'"><img src="'+icon.src+'" alt=""/></button>';
}).join('');


      tr.innerHTML =
          '<td>' + row.cnam + '</td>'
       + '<td>' + wrapPhone(row.from) + '</td>'
       + '<td><span class="qos-tag">' + row.q1 + '</span></td>'
       + '<td>' + wrapPhone(row.dialed) + '</td>'
       + '<td>' + (row.toName || '') + '</td>'
       + '<td>' + (row.to || '') + '</td>'        // ← was wrapPhone(normalizeTo(row))
       + '<td><span class="qos-tag">' + row.q2 + '</span></td>'
       + '<td>' + dateStr + '</td>'
       + '<td>' + row.duration + '</td>'
       + '<td>' + (row.disposition || '') + '</td>'
       + '<td>' + row.release + '</td>'
       + '<td class="icon-cell">' + iconsHTML + '</td>';


      tbody.appendChild(tr);
      cursor -= ((DATE_GAPS_MIN[idx] || 2) * 60 * 1000);
    });

    // fit iframe height
    requestAnimationFrame(function(){
      try {
        var h = document.documentElement.scrollHeight;
        if (window.frameElement) window.frameElement.style.height = (h + 2) + 'px';
      } catch(e){}
    });
  }

  // draw once
  renderRowsDynamicDate();

  /* Listen dropdown (single handler) */
  document.addEventListener('click', function(e){
    var btn = e.target instanceof Element ? e.target.closest('button[data-action="listen"]') : null;
    if (!btn) return;
    e.preventDefault();

    var tr = btn.closest('tr');
    var next = tr && tr.nextElementSibling;

    // collapse if open
    if (next && next.classList && next.classList.contains('cv-audio-row')) {
      next.remove();
      btn.setAttribute('aria-expanded','false');
      return;
    }
    Array.prototype.forEach.call(document.querySelectorAll('.cv-audio-row'), function(r){ r.remove(); });

    var audioTr = document.createElement('tr');
    audioTr.className = 'cv-audio-row';

    var colCount = tr.children.length;
    var listenIconSrc = (ICONS.find(function(i){return i.key==='listen';}) || {}).src || '';

    audioTr.innerHTML =
      '<td colspan="'+colCount+'">' +
        '<div class="cv-audio-player">' +
          '<button class="cv-audio-play" aria-label="Play"></button>' +
          '<span class="cv-audio-time">0:00 / 0:00</span>' +
          '<div class="cv-audio-bar"><div class="cv-audio-bar-fill" style="width:0%"></div></div>' +
          '<div class="cv-audio-right">' +
            '<img class="cv-audio-icon" src="'+listenIconSrc+'" alt="Listen">' +
          '</div>' +
        '</div>' +
      '</td>';

    tr.parentNode.insertBefore(audioTr, tr.nextSibling);
    btn.setAttribute('aria-expanded','true');
  });

/* CTG wiring (self-contained; no external refs) */
(function wireCradleSelfContained(){
  if (document._cvCradleSelfBound) return;
  document._cvCradleSelfBound = true;

  // ----- Modal helpers (self-contained) -----
  function ensureModal() {
    var modal = document.getElementById('cv-cradle-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'cv-cradle-modal';
    modal.innerHTML =
      '<div class="cv-modal-backdrop"></div>' +
      '<div class="cv-modal">' +
        '<div class="cv-modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #ddd;">' +
          '<span style="font-weight:700;font-size:16px">Cradle To Grave</span>' +
          '<button class="cv-modal-close" aria-label="Close" style="background:none;border:0;font-size:18px;cursor:pointer">&times;</button>' +
        '</div>' +
        '<div class="cv-modal-body" id="cv-ctg-body" style="padding:16px;max-height:65vh;overflow:auto"></div>' +
        '<div class="cv-modal-footer" style="padding:10px 16px;border-top:1px solid #ddd;text-align:right">' +
          '<button class="cv-modal-close" style="padding:6px 12px;border:1px solid #ccc;border-radius:6px;background:#f8f9fa;cursor:pointer">Close</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    var closes = modal.querySelectorAll('.cv-modal-close, .cv-modal-backdrop');
    for (var i = 0; i < closes.length; i++) closes[i].addEventListener('click', function(){ modal.remove(); });
    return modal;
  }
  function openCTG(html) {
    var modal = ensureModal();
    var body = document.getElementById('cv-ctg-body');
    if (body) body.innerHTML = html || '<div>Empty</div>';
  }

  // ----- Local time utils -----
  function parseStart(dateText){
    var d = new Date();
    var m = /Today,\s*(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(String(dateText||''));
    if (m){
      var h = +m[1], min = +m[2], ap = m[3].toLowerCase();
      if (ap === 'pm' && h !== 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
      d.setHours(h, min, 0, 0);
    }
    return d;
  }
  function addMs(d, ms){ return new Date(d.getTime() + ms); }
  function fmtClock(d){
    var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = (h % 12) || 12;
    function pad(n){ return String(n).padStart(2,'0'); }
    return h + ':' + pad(m) + ':' + pad(s) + ' ' + ap;
  }
  function parseDurSecs(txt){
    var m = /^(\d+):(\d{2})$/.exec(String(txt||'').trim());
    return m ? (+m[1]*60 + +m[2]) : NaN;
  }

  // ----- Icons (URLs) -----
  var ICON_RING   = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/phone%20dialing.svg';
  var ICON_ANSWER = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/phone-solid-full.svg';
  var ICON_HANG   = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/phone_disconnect_fill_icon.svg';
  var ICON_DIAL   = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/dialpad%20icon.svg';
  var ICON_ELLIPS = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/ellipsis-solid-full.svg';
  var ICON_AGENTRING = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/phoneringing.svg';

// 1x1 transparent for “plain circle” steps
var ICON_DOT = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

// Agent directory (ext → name) — DealerDemo
var AGENTS = [
  {ext:'200', name:'Abbey Palmer'},
  {ext:'201', name:'Emma Johnson'},
  {ext:'202', name:'Liam Turner'},
  {ext:'210', name:'Mike Jones'},
  {ext:'211', name:'Chad Sanders'},
  {ext:'212', name:'Isabella Martinez'},
  {ext:'220', name:'Bob Smith'},
  {ext:'221', name:'Ethan Moore'},
  {ext:'222', name:'Amelia Lee'},
  {ext:'230', name:'Sophia Anderson'},
  {ext:'231', name:'Evelyn Lewis'},
  {ext:'240', name:'Dave Walker'}
];


// More forgiving ext extractor: "Ext. 206", "(266p)", "266p", "x206"
function extractAnyExt(text){
  const s = String(text || '');
  const m =
    /Ext\.?\s*(\d{2,4})/i.exec(s) ||
    /\((\d{2,4})[a-z]*\)/i.exec(s) ||
    /(?:^|\D)(\d{3,4})[a-z]?(\b|$)/i.exec(s);
  return m ? m[1] : '';
}

function findAgentLabel(ext){
  ext = String(ext||'').replace(/\D/g,'');
  var a = AGENTS.find(function(x){ return x.ext === ext; });
  return a ? (a.name + ' (' + a.ext + ')') : ('Ext. ' + (ext || ''));
}
function extractExtSimple(text){
  var m = /Ext\.?\s*(\d{2,4})/i.exec(String(text||''));
  return m ? m[1] : '';
}

  // ----- Common timeline block (local CSS hooks) -----
  function timeBlock(d, deltaText, iconSrc, text){
    return ''
      + '<div class="cvctg-step" style="display:grid;grid-template-columns:140px 40px 1fr;gap:10px;align-items:start;margin:10px 0">'
      +   '<div class="cvctg-time" style="font-weight:600;color:#333">' + fmtClock(d)
      +     (deltaText ? '<div class="cvctg-delta" style="color:#9aa0a6;font-size:11px;margin-top:2px">'+deltaText+'</div>' : '')
      +   '</div>'
      +   '<div class="cvctg-marker" style="display:flex;flex-direction:column;align-items:center">'
      +     '<span class="cvctg-icon" style="width:28px;height:28px;border-radius:50%;border:1px solid #ddd;background:#f5f5f5;display:inline-flex;align-items:center;justify-content:center;padding:5px">'
      +       '<img src="'+iconSrc+'" alt="" style="width:16px;height:16px" />'
      +     '</span>'
      +     '<span class="cvctg-vert" style="width:2px;flex:1 1 auto;background:#e0e0e0;margin:6px 0 0;border-radius:1px"></span>'
      +   '</div>'
      +   '<div class="cvctg-text" style="color:#444">' + text + '</div>'
      + '</div>';
  }

 

  // ---- Inbound builder (uses shared helpers above; no template literals) ----
function buildInboundHTML(from, dateText, toText, durText, releaseText, agentExt){
  var start = parseStart(dateText);

  // Labels you asked for
  var timeframe = 'Daytime';
  var aaLabel   = 'Auto Attendant Daytime 700';
  var queueLbl  = 'Call Queue 301';

  // Who answered (use the “To” ext if present)
  var answeredExt   = String(agentExt || extractAnyExt(toText) || extractAnyExt(from) || '');
  var answeredLabel = answeredExt ? findAgentLabel(answeredExt) : 'Agent';

  // Duration math
  var secs   = parseDurSecs(durText);
  function deltaLabel(ms){
    if (isNaN(ms)) return '+0s';
    var s = Math.round(ms/1000);
    return (s>=60) ? ('+' + Math.floor(s/60) + 'm ' + (s%60) + 's') : ('+' + s + 's');
  }

  // Rough timeline (readable spacing; tweak if you want):
  var t0 = start;                    // inbound call lands
  var t1 = addMs(start, 2);          // timeframe check #1
  var t2 = addMs(start, 135);        // AA connected
  var t3 = addMs(start, 158);        // menu selection
  var t4 = addMs(start, 14*1000);    // timeframe check #2
  var t5 = addMs(t4, 1000);          // queue connect
  // Agents begin ringing ~300ms apart
  var ringStart = addMs(t5, 286);
  var ringStep  = 286;               // ms between “is ringing” lines
  // Answer about 8s after queue connect (demo feel)
  var tAnswer = addMs(t5, 8000);
  // Hang at answer + actual duration (fallback 2m)
  var tHang   = isNaN(secs) ? addMs(tAnswer, 2*60*1000) : addMs(tAnswer, secs*1000);

  // Who hung up (uses Release Reason column “Orig/Term”)
  var hungBy =
    /Orig/i.test(String(releaseText||'')) ? (String(from||'').trim() || 'Caller')
      : (answeredLabel || ('Ext. ' + answeredExt));

  // Build HTML
  var html = '';
  html += '<div class="cvctg-steps" style="padding:8px 6px 2px">';

  // 1) Phone icon — no “to Ext.”, no “is ringing” suffix
  html += timeBlock(t0, '', ICON_RING,
          'Inbound call from ' + (from||'') + ' (STIR: Verified)');

  // 2) Plain circle — timeframe
  html += timeBlock(t1, '+2ms', ICON_DOT,
          'The currently active time frame is ' + timeframe);

  // 3) Dialpad — AA
  html += timeBlock(t2, '+135ms', ICON_DIAL,
          'Connected to ' + aaLabel);

  // 4) Plain circle — Selected 1
  html += timeBlock(t3, '+23ms', ICON_DOT,
          'Selected 1');

  // 5) Plain circle — timeframe again
  html += timeBlock(t4, '+14s', ICON_DOT,
          'The currently active time frame is ' + timeframe);

  // 6) Ellipsis — queue
  html += timeBlock(t5, '+1s', ICON_ELLIPS,
          'Connected to ' + queueLbl);

  // 7) Each agent ringing (phone icon)
  for (var i=0; i<AGENTS.length; i++){
    var a   = AGENTS[i];
    var ti  = addMs(ringStart, i*ringStep);
    var dlt = (i===0) ? '+286ms' : ('+' + (i*ringStep) + 'ms');
    html += timeBlock(ti, dlt, ICON_AGENTRING, findAgentLabel(a.ext) + ' is ringing'); // <-- swapped icon
  }


  // 8) Answered by {name (ext)}
  html += timeBlock(tAnswer, '+8s', ICON_ANSWER, 'Call answered by ' + answeredLabel);

  // 9+10) Hangup — show duration as delta; say who hung up
  html += timeBlock(
           tHang,
           isNaN(secs) ? '+2m' : ('+' + Math.floor(secs/60) + 'm ' + (secs%60) + 's'),
           ICON_HANG,
           hungBy + ' hung up'
         );

  html += '</div>';
  return html;
}



// ----- Outbound builder (shows agent name + ext on first line) -----
function buildOutboundHTML(from, dateText, dialed, durText, agentExt){
  var start = parseStart(dateText);
  var t0 = start;
  var t1 = addMs(start, 303);
  var t2 = addMs(start, 6000);

  var secs   = parseDurSecs(durText);
  var tailMs = isNaN(secs) ? (1*60 + 59)*1000 : Math.max(0, (secs - 6)*1000);
  var t3 = addMs(t2, tailMs);

  // NEW: who is placing the outbound call (name + ext if possible)
  var ext = String(agentExt || extractAnyExt(from) || '').replace(/\D/g,'');
  var callerLabel = ext ? findAgentLabel(ext) : (String(from || '').trim() || 'Agent'); 
  // findAgentLabel(ext) -> "Name (ext)" or "Ext. ###" fallback

  var answeredWho = dialed ? ('Call answered by ' + dialed) : 'Call answered';
  var hangLabel   = ext ? ('Ext. ' + ext) : (String(from||'').trim() || 'Caller');
  var hangWho     = hangLabel + ' hung up';

  return ''
    + '<div class="cvctg-steps" style="padding:8px 6px 2px">'
    // 1) First line: "Call from {Name (Ext)} to {Dialed}"
    +   timeBlock(t0, '',        ICON_RING,   'Call from ' + callerLabel + ' to ' + (dialed || ''))
    // 2) Second line (unchanged): "{Dialed} is ringing"
    +   timeBlock(t1, '+303ms',  ICON_RING,   (dialed ? (dialed + ' is ringing') : 'Ringing'))
    // 3) Answered by {dialed}
    +   timeBlock(t2, '+6s',     ICON_ANSWER, answeredWho)
    // 4) Hangup with duration
    +   timeBlock(
          t3,
          (isNaN(secs) ? '+1m 59s' : (secs >= 6 ? ('+' + Math.floor((secs-6)/60) + 'm ' + ((secs-6)%60) + 's') : '+0s')),
          ICON_HANG,
          hangWho
        )
    + '</div>';
}




// ----- One, safe, capturing listener; blocks other handlers -----
document.addEventListener('click', function (e) {
  const btn = e.target instanceof Element
    ? e.target.closest('button[data-action="cradle"]')
    : null;
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  try {
    const tr  = btn.closest('tr');
    const tds = tr ? tr.querySelectorAll('td') : [];

    const fromText = (tds[1]?.textContent || '').trim();
    const dial     = (tds[3]?.textContent || '').trim();
    const toText   = (tds[5]?.textContent || '').trim();
    const date     = (tds[7]?.textContent || '').trim();
    const dur      = (tds[8]?.textContent || '').trim();
    const release  = (tds[10]?.textContent || '').trim();   // <-- add this

    const type = btn.dataset.ctg;

    const agentExt = extractAnyExt(tds[5]?.textContent) || extractAnyExt(tds[1]?.textContent);

    const html = (type === 'inbound')
      ? buildInboundHTML(fromText, date, toText, dur, release, agentExt)   // <-- pass agentExt
      : buildOutboundHTML(fromText, date, dial, dur, agentExt);

    setTimeout(function(){ openCTG(html); }, 0);
    return;
  } catch(err){
    console.error('[CTG] render error:', err);
  }
}, true);



})(); /* end self-contained CTG block */

/* ===== NOTES MODAL (self-contained) ===== */
(function () {
  if (document._cvNotesBound) return;
  document._cvNotesBound = true;

// Disposition -> Reason options (exact strings requested)
var NOTES_REASONS = {
  'Inbound Sales': [
    'Existing customer question',
    'Follow up',
    'Referral',
    'Parts',
    'Service',
    'Finance'
  ],
  'Outbound Sales': [
    'Cold Call',
    'Follow-up',
    'Marketing',
    'Online Callback'
  ]
};


  // Ensure a modal exists (uses the same .cv-modal styles you already have)
  function ensureNotesModal () {
    var modal = document.getElementById('cv-notes-modal');
    if (modal) return modal;
   


    modal = document.createElement('div');
    modal.id = 'cv-notes-modal';
    modal.style.display = 'none';
    modal.innerHTML =
      '<div class="cv-modal-backdrop"></div>' +
      '<div class="cv-modal">' +
        '<div class="cv-modal-header" style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-weight:700;font-size:16px">Notes</span>' +
          '<button class="cv-notes-close" aria-label="Close" style="background:none;border:0;font-size:18px;cursor:pointer">&times;</button>' +
        '</div>' +
        '<div class="cv-modal-body" style="padding:16px">' +
          '<div style="display:grid;grid-template-columns:140px 1fr;gap:10px 16px;align-items:center">' +
            '<label for="cv-notes-disposition" style="justify-self:end;font-weight:600">Disposition</label>' +
            '<select id="cv-notes-disposition" style="padding:6px;border:1px solid #cfd3d7;border-radius:4px;">' +
              '<option value="">Select a Disposition</option>' +
              '<option>Inbound Sales</option>' +
              '<option>Outbound Sales</option>' +
            '</select>' +
            '<label for="cv-notes-reason" style="justify-self:end;font-weight:600">Reason</label>' +
            '<select id="cv-notes-reason" style="padding:6px;border:1px solid #cfd3d7;border-radius:4px;">' +
              '<option value="">Select a Disposition First</option>' +
            '</select>' +
            '<label for="cv-notes-text" style="justify-self:end;font-weight:600">Notes</label>' +
            '<textarea id="cv-notes-text" rows="5" style="width:100%;padding:8px;border:1px solid #cfd3d7;border-radius:4px;resize:vertical"></textarea>' +
          '</div>' +
        '</div>' +
        '<div class="cv-modal-footer" style="display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #e5e7eb">' +
          '<button class="cv-notes-cancel cv-btn">Cancel</button>' +
          '<button class="cv-notes-save" style="min-width:90px;padding:6px 12px;border:0;border-radius:4px;background:#006dcc;color:#fff;font-weight:700;cursor:pointer">Save</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    // Close handlers
    function close(){ modal.remove(); } // remove so we start clean next time
    modal.querySelector('.cv-notes-close').addEventListener('click', close);
    modal.querySelector('.cv-modal-backdrop').addEventListener('click', close);
    modal.querySelector('.cv-notes-cancel').addEventListener('click', close);

    // Save handler (stub)
    modal.querySelector('.cv-notes-save').addEventListener('click', function(){
      var disp   = document.getElementById('cv-notes-disposition').value || '';
      var reason = document.getElementById('cv-notes-reason').value || '';
      var notes  = document.getElementById('cv-notes-text').value || '';
      console.log('[NOTES] Saved →', { disposition: disp, reason, notes });
      close();
    });

    return modal;
  }

  // Populate reasons based on disposition
  function populateReasonOptions(disp){
    var sel = document.getElementById('cv-notes-reason');
    sel.innerHTML = '';
    var opts = NOTES_REASONS[disp] || [];
    if (!opts.length){
      sel.innerHTML = '<option value="">Select a Disposition First</option>';
      return;
    }
    opts.forEach(function(label, i){
      var o = document.createElement('option');
      o.value = label;
      o.textContent = label;
      if (i === 0) o.selected = true;
      sel.appendChild(o);
    });
  }

  // Open & initialize the Notes modal
  function openNotesModal(initial){
    var modal = ensureNotesModal();

    var dispSel = document.getElementById('cv-notes-disposition');
    var txt     = document.getElementById('cv-notes-text');

    modal.style.display = 'block';

    var dispInit = initial && initial.disposition ? initial.disposition : '';
    dispSel.value = dispInit;
    populateReasonOptions(dispInit);
    txt.value = initial && initial.notes ? initial.notes : '';

    dispSel.onchange = function(){ populateReasonOptions(dispSel.value); };
  }

  // Click handler for Notes buttons
  document.addEventListener('click', function(e){
    var btn = e.target instanceof Element ? e.target.closest('button[data-action="notes"]') : null;
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Infer inbound vs outbound from the row
    var tr    = btn.closest('tr');
    var tds   = tr ? tr.querySelectorAll('td') : [];
    var toTxt = (tds[5]?.textContent || '').trim();
    var isInbound = /^Ext\.?\s*\d+/i.test(toTxt);

    openNotesModal({
      disposition: isInbound ? 'Inbound Sales' : 'Outbound Sales'
    });
  }, true);
})();
/* ===== /NOTES MODAL ===== */

/* ===== /AI MODAL ===== */
(function () {
  // Ensure we only bind once
  if (document._cvAiBound) return;
  document._cvAiBound = true;

function cvAiPopulateModal(row, idx) {
  if (!row || typeof idx !== 'number') return;



// --- Build AIDate from the rendered table cell (col 8) ---
let AIDate = '—';
try {
  const tbody =
    document.getElementById('cvCallHistoryTableBody') ||
    [...document.querySelectorAll('tbody')].sort((a,b) => b.children.length - a.children.length)[0];

  const trEl   = tbody?.children?.[idx];
  const dateTd = trEl?.children?.[7];
  const txt    = dateTd?.textContent?.trim();

  if (txt) AIDate = txt;
} catch(e) {
  console.error('[AI Modal] Failed to extract AIDate:', e);
}



  // --- Other fields (always safe) ---
  const cells = row?.children || [];
  const AIFrom = cells[1]?.innerText.trim() || '—';      // assuming From is 2nd column
  const AITo = cells[5]?.innerText.trim() || '—';        // assuming To is 6th column
  const AIDuration = cells[7]?.innerText.trim() || '—';  // assuming Duration is 8th column
  const AIDirection = cells[6]?.innerText.trim() || '—';      // assuming Date is 7th column

const summaryBox = document.getElementById('cv-ai-summary');
if (summaryBox) {
  summaryBox.textContent =
    AIDirection === 'inbound'
      ? 'This was an inbound call where the customer reached out to speak with a representative. Key points from the call have been summarized below.'
      : AIDirection === 'outbound'
        ? 'This was an outbound follow-up initiated by the agent. Review the summarized discussion and call flow below.'
        : 'No direction detected. Summary unavailable.';
}




  // --- Update CHIPS ---
  const chipWrap = document.getElementById('cv-ai-chips');
  if (chipWrap) {
    const chips = chipWrap.querySelectorAll('span');
    chips[0].textContent = 'From: ' + AIFrom;
    chips[1].textContent = 'To: ' + AITo;
    chips[2].textContent = '⏱ ' + AIDuration;
    chips[3].textContent = '📅 ' + AIDate;
  }
  
// ---- New: Simulated Transcript Injection ----

  var fakeInbound = [
  { start: 0.00,  end: 6.00,   text: "Thanks for calling Mr. Service. How can I help today?" },
  { start: 6.10,  end: 12.00,  text: "Hi, this is Dan calling back. I'm looking for an appointment this Saturday." },
  { start: 12.10, end: 18.00,  text: "We can check that. What address should we use?" },
  { start: 18.10, end: 24.00,  text: "456 East Elm, on the corner of Madison and Elm." },
  { start: 24.10, end: 31.00,  text: "Got it—456 East Elm at Madison. One moment while I check availability." },
  { start: 31.10, end: 38.00,  text: "Sure, thanks." },
  { start: 38.10, end: 45.00,  text: "Saturday has an 8–10 a.m. window and a 1–3 p.m. window. Which do you prefer?" },
  { start: 45.10, end: 51.00,  text: "The afternoon, 1–3 p.m., please." },
  { start: 51.10, end: 58.00,  text: "Reserved. Did you already send pictures of the area we’ll be working on?" },
  { start: 58.10, end: 64.00,  text: "Yes, I emailed them earlier today." },
  { start: 64.10, end: 72.00,  text: "I see them here—thanks. The photos look clear and helpful." },
  { start: 72.10, end: 80.00,  text: "Great, just wanted to be sure you had them." },
  { start: 80.10, end: 88.00,  text: "Based on the pictures, our standard service should cover everything." },
  { start: 88.10, end: 95.00,  text: "Okay, sounds good." },
  { start: 95.10, end: 103.00, text: "You’ll receive a confirmation by text and email for Saturday, 1–3 p.m." },
  { start: 103.10,end: 110.00, text: "I’ll watch for those." },
  { start: 110.10,end: 116.00, text: "Any entry notes, pets, or parking details we should add?" },
  { start: 116.10,end: 120.00, text: "No special notes. Street parking is fine. Thanks for your help." }
];

var fakeInboundSummary =
  "Dan from 456 East Elm inquired about availability for service this Saturday. " +
  "They confirmed their location at the corner of Madison and Elm and asked whether Mr. Service had received their pictures. " +
  "Mr. Service confirmed receipt and reviewed them during the call. " +
  "Mr. Service confirmed no special notes and that street parking is fine. The next step is the tech appointment for Saturday.";

var fakeOutbound = [
  { start: 0.00,  end: 6.00,   text: "Hi Jane. This is Mr. Service, calling to confirm tomorrow’s appointment." },
  { start: 6.10,  end: 10.00,  text: "Great, thanks for calling." },
  { start: 10.10, end: 16.00,  text: "We have you at 123 Main Street, just off Elm. Is that correct?" },
  { start: 16.10, end: 21.00,  text: "Yes, that’s right." },
  { start: 21.10, end: 28.00,  text: "Your window is 10:00 a.m. to 12:00 p.m. Does that still work?" },
  { start: 28.10, end: 33.00,  text: "Yep, that window works." },
  { start: 33.10, end: 40.00,  text: "Perfect. Anyone 18 or older will need to be present during the visit." },
  { start: 40.10, end: 45.00,  text: "I’ll be here." },
  { start: 45.10, end: 52.00,  text: "Great. Do you have pets we should plan for?" },
  { start: 52.10, end: 57.00,  text: "One dog. I’ll put him in the backyard." },
  { start: 57.10, end: 64.00,  text: "Thanks. Parking on the street near the front entrance is fine." },
  { start: 64.10, end: 69.00,  text: "Street parking is available." },
  { start: 69.10, end: 76.00,  text: "Any gate codes or access notes we should add?" },
  { start: 76.10, end: 81.00,  text: "No codes—front door is fine." },
  { start: 81.10, end: 90.00,  text: "You’ll get a text when the tech is on the way, including an ETA link." },
  { start: 90.10, end: 96.00,  text: "Sounds good." },
  { start: 96.10, end: 104.00, text: "Do you have any questions or special requests before tomorrow?" },
  { start: 104.10,end: 109.00, text: "No, I think we’re all set." },
  { start: 109.10,end: 116.00, text: "Perfect. If plans change, reply to the reminder or call before 8 a.m." },
  { start: 116.10,end: 120.00, text: "Will do—thanks. See you tomorrow." }
];

var fakeOutboundSummary =
  "Mr. Service placed a follow-up call to confirm the customer appointment for Jane is scheduled for tomorrow at 8 a.m. " +
  "The address was confirmed as 123 Main Street, just off Elm. One dog will be put into the backyard. Street parking is available, and no codes are needed. " +
  "Jane verified the time and confirmed they had everything needed for the appointment. " +
  "Mr. Service confirmed tech link reminder text and how to contact the location if plans should change.";

 
  function parseDuration(str) {
    const [min, sec] = str.split(':').map(Number);
    return min * 60 + sec;
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  const maxSecs = parseDuration(row.duration || "2:00");
  const segList = document.getElementById('cv-ai-seglist');
  const durationDisplay = document.getElementById('cv-ai-fakeduration');

  

  if (segList && durationDisplay) {
    segList.innerHTML = '';

    const script = row.direction === 'inbound' ? fakeInbound : fakeOutbound;
    const summaryEl = document.getElementById('cv-ai-summary');
    if (summaryEl) {
      summaryEl.textContent = row.direction === 'inbound' ? fakeInboundSummary : fakeOutboundSummary;
    }


script.forEach(function (seg) {
  var el = document.createElement('div');
  el.className = 'cv-ai-segment';
  el.dataset.start = seg.start;

  // === Container styling ===
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.padding = '14px 16px';
  el.style.marginBottom = '10px';
  el.style.borderRadius = '10px';
  el.style.border = '1px solid #e5e7eb';
  el.style.cursor = 'pointer';
  el.style.background = '#fff';
  el.style.transition = 'all 0.2s ease';

  // === Timestamp row ===
  var ts = document.createElement('div');
  ts.style.fontSize = '13px';
  ts.style.fontWeight = '600';
  ts.style.color = '#1e3a8a'; // dark blue
  ts.style.marginBottom = '6px';

  // you already store start/end in seg
  var endTime = seg.end || seg.start + 3; // fallback if no end
  ts.textContent = seg.start.toFixed(1) + 's – ' + endTime.toFixed(1) + 's';

  // === Transcript text ===
  var txt = document.createElement('div');
  txt.style.fontSize = '15px';
  txt.style.lineHeight = '1.5';
  txt.style.color = '#111827';
  txt.textContent = seg.text;

  // assemble
  el.appendChild(ts);
  el.appendChild(txt);

  // === Hover + Active logic ===
  el.addEventListener('mouseenter', function () {
    if (!el.classList.contains('active')) {
      el.style.border = '1px solid #93c5fd';
    }
  });
  el.addEventListener('mouseleave', function () {
    if (!el.classList.contains('active')) {
      el.style.border = '1px solid #e5e7eb';
    }
  });

  el.addEventListener('click', function () {
    // reset all
    var all = segList.querySelectorAll('.cv-ai-segment');
    for (var i = 0; i < all.length; i++) {
      all[i].classList.remove('active');
      all[i].style.background = '#fff';
      all[i].style.border = '1px solid #e5e7eb';
    }

    // activate current
    el.classList.add('active');
    el.style.background = '#dbeafe';
    el.style.border = '1px solid #2563eb';

    // update time
    var t = Math.min(seg.start, maxSecs);
    durationDisplay.textContent = formatTime(t) + ' / ' + formatTime(maxSecs);
  });

  segList.appendChild(el);
});



    // Set initial time display
    durationDisplay.textContent = '0:00 / ' + formatTime(maxSecs);
  }


}


  // Create AI modal dynamically
function cvAiEnsureModal() {
  let modal = document.getElementById('cv-ai-modal');
  if (modal) return modal;

  // Backdrop
  modal = document.createElement('div');
  modal.id = 'cv-ai-modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.zIndex = '10050';
  modal.style.background = 'rgba(0,0,0,.5)';

  // Card
  const inner = document.createElement('div');
  inner.style.background = '#fff';
  inner.style.width = '95%';
  inner.style.height = '90%';
  inner.style.maxWidth = '1400px';
  inner.style.margin = '2% auto';
  inner.style.padding = '20px';
  inner.style.borderRadius = '10px';
  inner.style.boxShadow = '0 16px 60px rgba(0,0,0,.35)';
  inner.style.position = 'relative';
  inner.style.display = 'flex';
  inner.style.flexDirection = 'column';
  modal.appendChild(inner);

  // Header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.padding = '12px 20px';             // updated
  header.style.borderBottom = '1px solid #e5e7eb';
  header.style.background = '#111827';            // ✅ NEW
  header.style.color = '#fff';                    // ✅ NEW
  inner.appendChild(header);

  const leftHead = document.createElement('div');
  leftHead.style.display = 'flex';
  leftHead.style.alignItems = 'center';
  leftHead.style.gap = '12px';
  header.appendChild(leftHead);

  const logo = document.createElement('img');
  logo.alt = '';
  logo.src = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/clarity-badge-mini.svg';
  logo.style.height = '26px';
  leftHead.appendChild(logo);

  const title = document.createElement('h2');
  title.textContent = 'AI Transcript and Summary';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.fontWeight = '800';
  leftHead.appendChild(title);

  const rightHead = document.createElement('div');
  rightHead.style.display = 'flex';
  rightHead.style.alignItems = 'center';
  rightHead.style.gap = '8px';
  header.appendChild(rightHead);

  const btnTxt = document.createElement('button');
  btnTxt.id = 'cv-ai-btn-txt';
  btnTxt.textContent = 'Download Transcript';
  btnTxt.style.padding = '6px 12px';
  btnTxt.style.border = '1px solid #e2e8f0';
  btnTxt.style.borderRadius = '6px';
  btnTxt.style.background = '#2563eb';  
  btnTxt.style.color = '#fff';
  btnTxt.style.border = 'none';

  btnTxt.style.cursor = 'pointer';
  rightHead.appendChild(btnTxt);

  const btnRec = document.createElement('button');
  btnRec.id = 'cv-ai-btn-rec';
  btnRec.textContent = 'Download Recording';
  btnRec.style.padding = '6px 12px';
  btnRec.style.border = 'none';
  btnRec.style.borderRadius = '6px';
  btnRec.style.background = '#2563eb';
  btnRec.style.color = '#fff';
  btnRec.style.cursor = 'pointer';
  rightHead.appendChild(btnRec);

  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';
  closeBtn.style.marginLeft = '8px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = '0';
  closeBtn.style.fontSize = '22px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = 'white';
  rightHead.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.id = 'cv-ai-body';
  body.style.flex = '1 1 auto';
  body.style.overflow = 'auto';
  body.style.paddingTop = '16px';
  inner.appendChild(body);

  // Content grid
  const content = document.createElement('div');
  content.id = 'cv-ai-content';
  content.style.display = 'grid';
  content.style.gridTemplateColumns = '420px 1fr';
  content.style.gap = '18px';
  body.appendChild(content);

  // Helper: chip
  function makeChip(label, index) {
  const span = document.createElement('span');
  span.textContent = label;
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.style.gap = '6px';
  span.style.borderRadius = '12px';
  span.style.padding = '4px 8px';
  span.style.fontSize = '12px';
  span.style.fontWeight = '700';

  // Indexed color mappings for From, To, Duration, Date
  const styles = [
    { bg: '#eef2ff', text: '#3730a3' }, // From: Indigo
    { bg: '#f0fdfa', text: '#0f766e' }, // To: Teal
    { bg: '#fffbeb', text: '#b45309' }, // Duration: Amber
    { bg: '#f5f3ff', text: '#6b21a8' }, // Date: Purple
  ];

  const { bg, text } = styles[index] || { bg: '#eaf2ff', text: '#1a73e8' };
  span.style.background = bg;
  span.style.color = text;

  return span;
}


  // LEFT CARD
  const leftCard = document.createElement('div');
  leftCard.style.border = '1px solid #e5e7eb';
  leftCard.style.borderRadius = '12px';
  leftCard.style.padding = '14px';
  leftCard.style.display = 'flex';
  leftCard.style.flexDirection = 'column';
  leftCard.style.gap = '10px';
  content.appendChild(leftCard);

  const hDetails = document.createElement('div');
  hDetails.textContent = 'Call Details';
  hDetails.style.fontWeight = '800';
  hDetails.style.fontSize = '18px';
  leftCard.appendChild(hDetails);

  const chips = document.createElement('div');
  chips.id = 'cv-ai-chips';
  chips.style.display = 'flex';
  chips.style.flexWrap = 'wrap';
  chips.style.gap = '8px';
  chips.appendChild(makeChip('From: —', 0));
  chips.appendChild(makeChip('To: —', 1));
  chips.appendChild(makeChip('⏱ —:—', 2));
  chips.appendChild(makeChip('📅 —', 3));

  leftCard.appendChild(chips);

  const hSummary = document.createElement('div');
  hSummary.textContent = 'Summary';
  hSummary.style.fontWeight = '800';
  hSummary.style.fontSize = '18px';
  leftCard.appendChild(hSummary);

  const summary = document.createElement('div');
  summary.id = 'cv-ai-summary';
  summary.textContent = 'This is a placeholder summary. Populate programmatically after opening.';
  summary.style.lineHeight = '1.5';
  summary.style.color = '#243447';
  leftCard.appendChild(summary);

  // RIGHT CARD
  const rightCard = document.createElement('div');
  rightCard.style.border = '1px solid #e5e7eb';
  rightCard.style.borderRadius = '12px';
  rightCard.style.padding = '14px';
  rightCard.style.display = 'flex';
  rightCard.style.flexDirection = 'column';
  rightCard.style.gap = '12px';
  content.appendChild(rightCard);

  // Controls
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.alignItems = 'center';
  controls.style.gap = '10px';
  controls.style.background = '#f9fafb';              // ✅ subtle background
  controls.style.border = '1px solid #e5e7eb';         // ✅ light border
  controls.style.borderRadius = '8px';                 // ✅ rounded corners
  controls.style.padding = '8px 12px';                 // ✅ spacing inside
  rightCard.appendChild(controls);
  ;

// Play button with icon
  const play = document.createElement('button');
  play.id = 'cv-ai-play';
  play.style.display = 'inline-flex';
  play.style.alignItems = 'center';
  play.style.gap = '8px';
  play.style.padding = '6px 12px';
  play.style.border = '1px solid #cfd3d7';
  play.style.borderRadius = '6px';
  play.style.background = '#f8fafc';
  play.style.cursor = 'pointer';

// Add play icon (SVG)
  const playIcon = document.createElement('img');
  playIcon.src = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/play-solid-full.svg';
  playIcon.alt = 'Play';
  playIcon.style.width = '16px';
  playIcon.style.height = '16px';
  play.appendChild(playIcon);

// Add placeholder duration text next to icon
  const durationPlaceholder = document.createElement('span');
  durationPlaceholder.id = 'cv-ai-fakeduration';
  durationPlaceholder.textContent = '0:56'; // Placeholder to be dynamically set later
  durationPlaceholder.style.fontWeight = '600';
  durationPlaceholder.style.fontSize = '13px';
  durationPlaceholder.style.color = '#111';
  play.appendChild(durationPlaceholder);

  controls.appendChild(play);


  const listenAiIcon = document.createElement('img');
  listenAiIcon.src = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/speakericon.svg';
  listenAiIcon.alt = 'Listen';
  listenAiIcon.title = 'Listen In';
  listenAiIcon.style.width = '18px';
  listenAiIcon.style.height = '18px';
  listenAiIcon.style.opacity = '0.6';
  listenAiIcon.style.marginLeft = '8px';
  listenAiIcon.style.cursor = 'pointer';
  listenAiIcon.style.transition = 'opacity 0.2s ease';

  listenAiIcon.addEventListener('mouseenter', () => {
    listenAiIcon.style.opacity = '1';
  });
  listenAiIcon.addEventListener('mouseleave', () => {
    listenAiIcon.style.opacity = '0.6';
  });

  controls.appendChild(listenAiIcon);


  const fakeLine = document.createElement('div');
  fakeLine.style.flex = '1';
  fakeLine.style.height = '4px';
  fakeLine.style.background = '#111'; // dark line
  fakeLine.style.borderRadius = '2px';
  controls.appendChild(fakeLine);


  // Segments
  const segWrap = document.createElement('div');
  segWrap.id = 'cv-ai-seglist';
  segWrap.style.overflow = 'auto';
  segWrap.style.border = '1px solid #e5e7eb';
  segWrap.style.borderRadius = '10px';
  segWrap.style.padding = '10px';
  segWrap.style.minHeight = '200px';
  segWrap.style.maxHeight = 'calc(90vh - 260px)';
  rightCard.appendChild(segWrap);

  // Close behaviors (keep your mechanics intact)
  function closeModal(){ modal.style.display = 'none'; }
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  document.body.appendChild(modal);
  return modal;
}


document.addEventListener('click', function (e) {
  const btn = e.target.closest('button[data-action="transcript"]');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  // Delay modal opening by 1 second
  setTimeout(() => {
    const modal = cvAiEnsureModal();
    modal.style.display = 'block';

    const tr = btn.closest('tr');
    const idx = Array.from(tr?.parentElement?.children || []).indexOf(tr);

    // Existing call to populate modal
    cvAiPopulateModal(tr, idx);
  }, 1000); // <-- 1 second delay
});  

})();



})();
<\/script>
</body></html>`;
}




  // -------- REMOVE CALL HISTORY -------- //
  function removeCallHistory() {
    const ifr = document.getElementById(CALLHISTORY_IFRAME_ID);
    if (ifr && ifr.parentNode) ifr.parentNode.removeChild(ifr);

    const slot = document.querySelector(CALLHISTORY_SLOT);
    if (slot) {
      const hidden = slot.querySelector('[data-cv-demo-hidden="1"]');
      if (hidden && hidden.nodeType === Node.ELEMENT_NODE) {
        hidden.style.display = '';
        hidden.removeAttribute('data-cv-demo-hidden');
      }
    }
  }

  // -------- INJECT CALL HISTORY -------- //
  function injectCallHistory() {
    if (document.getElementById(CALLHISTORY_IFRAME_ID)) return;
    const slot = document.querySelector(CALLHISTORY_SLOT);
    if (!slot) return;

    function findAnchor(el) {
      const preferred = el.querySelector('.table-container.scrollable-small');
      if (preferred) return preferred;
      if (el.firstElementChild) return el.firstElementChild;
      let n = el.firstChild;
      while (n && n.nodeType !== Node.ELEMENT_NODE) n = n.nextSibling;
      return n || null;
    }

    const anchor = findAnchor(slot);

    if (anchor && anchor.nodeType === Node.ELEMENT_NODE) {
      anchor.style.display = 'none';
      anchor.setAttribute('data-cv-demo-hidden', '1');
    }

    const iframe = document.createElement('iframe');
    iframe.id = CALLHISTORY_IFRAME_ID;
    iframe.style.cssText = 'border:none;width:100%;display:block;margin-top:0;height:360px;';
    iframe.setAttribute('scrolling', 'no');
    iframe.srcdoc = buildCallHistorySrcdoc();

    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(iframe, anchor);
    else slot.appendChild(iframe);
  }

  // -------- WAIT CALL HISTORY AND INJECT -------- //
  function waitForCallHistorySlotAndInject(tries = 0) {
    const slot = document.querySelector(CALLHISTORY_SLOT);
    if (slot && slot.isConnected) {
      requestAnimationFrame(() => requestAnimationFrame(() => injectCallHistory()));
      return;
    }
    if (tries >= 12) return;
    setTimeout(() => waitForCallHistorySlotAndInject(tries + 1), 250);
  }

  // -------- CALL HISTORY ROUTING -------- //
  function onCallHistoryEnter() {
    setTimeout(() => waitForCallHistorySlotAndInject(), 600);
  }

  function handleCallHistoryRouteChange(prevHref, nextHref) {
    const wasCallHistory = CALLHISTORY_REGEX.test(prevHref);
    const isCallHistory  = CALLHISTORY_REGEX.test(nextHref);
    if (!wasCallHistory && isCallHistory) onCallHistoryEnter();
    if ( wasCallHistory && !isCallHistory) removeCallHistory();
  }

  (function watchCallHistoryURLChanges() {
    let last = location.href;
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    history.pushState = function () {
      const prev = last;
      const ret  = origPush.apply(this, arguments);
      const now  = location.href;
      last = now;
      handleCallHistoryRouteChange(prev, now);
      return ret;
    };

    history.replaceState = function () {
      const prev = last;
      const ret  = origReplace.apply(this, arguments);
      const now  = location.href;
      last = now;
      handleCallHistoryRouteChange(prev, now);
      return ret;
    };

    // SPA fallback
    const mo = new MutationObserver(() => {
      if (location.href !== last) {
        const prev = last;
        const now  = location.href;
        last = now;
        handleCallHistoryRouteChange(prev, now);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // Back/forward support
    window.addEventListener('popstate', () => {
      const prev = last;
      const now  = location.href;
      if (now !== prev) {
        last = now;
        handleCallHistoryRouteChange(prev, now);
      }
    });

    // Nav click support
    document.addEventListener('click', (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (el && el.closest(CALLHISTORY_SELECTOR)) setTimeout(onCallHistoryEnter, 0);
    });

    // Initial check
    if (CALLHISTORY_REGEX.test(location.href)) onCallHistoryEnter();
  })();

} // -------- ✅ Closes window.__cvCallHistoryInit -------- //
