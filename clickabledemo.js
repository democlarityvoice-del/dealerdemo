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
  var queueLbl  = 'Call Queue 300';

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

  // ---- New: Simulated Transcript Injection ----

// ---- New: Simulated Transcript Injection ----

var fakeInbound = [
  { start: 0.00,  end: 6.00,   text: "Thanks for calling Sterling Sales Honda, Jeep, and GMC. This is Abbey — how can I help you today?" },
  { start: 6.10,  end: 11.00,  text: "Hi Abbey, I saw a 2024 Honda CR-V on your website and had a couple of questions." },
  { start: 11.10, end: 16.00,  text: "Of course! Before we dive in, can I grab your name and callback number just in case we get disconnected?" },
  { start: 16.10, end: 21.00,  text: "Sure — it's Amanda Price, and my number is 586-555-0147." },
  { start: 21.10, end: 26.00,  text: "Thanks, Amanda. Which trim or color were you looking at?" },
  { start: 26.10, end: 31.00,  text: "It was the EX-L in silver. It had leather and the upgraded audio, I think?" },
  { start: 31.10, end: 36.00,  text: "Yes, that would be the EX-L with the premium package. Let me check our stock real quick." },
  { start: 36.10, end: 42.00,  text: "Okay, thanks." },
  { start: 42.10, end: 47.00,  text: "We’ve got one in silver on the lot and another arriving Monday in black." },
  { start: 47.10, end: 53.00,  text: "Good to know. I actually got prequalified online last night — does that help speed things up?" },
  { start: 53.10, end: 58.00,  text: "It does — that puts you ahead for paperwork. Planning to finance through us?" },
  { start: 58.10, end: 64.00,  text: "Yes — no trade-in, just buying outright or through your team." },
  { start: 64.10, end: 69.00,  text: "Perfect. Did you want to come in today or tomorrow?" },
  { start: 69.10, end: 74.00,  text: "Tomorrow’s better. I’m near Lakeside Mall — are you close by?" },
  { start: 74.10, end: 79.00,  text: "Very — we’re five minutes east off Mound Road." },
  { start: 79.10, end: 84.00,  text: "Awesome. Do you have anything open mid-morning?" },
  { start: 84.10, end: 89.00,  text: "We’ve got a 10:45 with Howie. He’ll have the EX-L and your prequal info ready." },
  { start: 89.10, end: 94.00,  text: "Perfect. Should I bring anything else with me?" },
  { start: 94.10, end: 99.00,  text: "Just your ID and insurance. You’ll also get a confirmation text and email." },
  { start: 99.10, end: 105.00, text: "Sounds good. I’ll watch for those. Thanks again for all the help, Amy." },
  { start: 105.10,end: 112.00, text: "You got it, Amanda. We’ll see you tomorrow at 10:45. Have a great day!" }
];

var fakeInboundSummary =
  "Amanda Price called Sterling Sales after viewing a 2024 Honda CR-V EX-L online. She asked about availability, confirmed interest in the silver model with leather and premium audio, and mentioned she had already completed prequalification online. Amy confirmed the vehicle was in stock, collected Amanda’s contact info, and scheduled a 10:45 a.m. appointment with Howie. Amanda was advised to bring ID and insurance, and will receive a confirmation by text and email.";


var fakeOutbound = [
  { start: 0.00,  end: 6.00,   text: "Hi Amanda, this is Howie from Sterling Sales Honda, Jeep, and GMC — calling with some great news." },
  { start: 6.10,  end: 11.00,  text: "Hi Howie! I’ve been hoping to hear from you." },
  { start: 11.10, end: 17.00,  text: "Just spoke with our finance department — your application was approved for the 2024 CR-V EX-L." },
  { start: 17.10, end: 23.00,  text: "That’s amazing, thank you! What’s the next step?" },
  { start: 23.10, end: 29.00,  text: "Next step is scheduling a time for you to come in, finalize the paperwork, and handle the down payment." },
  { start: 29.10, end: 35.00,  text: "Sounds good. I should be free tomorrow after 11 a.m." },
  { start: 35.10, end: 41.00,  text: "We have a 12:30 slot open. That gives us time to walk through everything and answer questions." },
  { start: 41.10, end: 47.00,  text: "Perfect — let’s do 12:30. Do I need to bring anything?" },
  { start: 47.10, end: 52.00,  text: "Just your ID, proof of insurance, and the down payment method we discussed." },
  { start: 52.10, end: 58.00,  text: "I’ll bring my debit card and a printed insurance copy, just in case." },
  { start: 58.10, end: 64.00,  text: "That works perfectly. We’re at Mound and 17 Mile — same location as your test drive." },
  { start: 64.10, end: 70.00,  text: "Yep, I remember. Should I ask for you at the front?" },
  { start: 70.10, end: 76.00,  text: "Yep — just let the front desk know you're here to meet Howie. I’ll come grab you." },
  { start: 76.10, end: 82.00,  text: "Awesome. Will I get a text or anything confirming the time?" },
  { start: 82.10, end: 88.00,  text: "Yes — you’ll get a confirmation text and email in just a few minutes." },
  { start: 88.10, end: 94.00,  text: "Got it. And we’re going to go over warranty stuff too, right?" },
  { start: 94.10, end: 99.00,  text: "Absolutely. We’ll review that and the service add-ons before you sign." },
  { start: 99.10, end: 105.00, text: "Cool. I think I’m all set then — looking forward to it." },
  { start: 105.10,end: 111.00, text: "Same here. Congrats again, Amanda — we’ll see you tomorrow at 12:30." },
  { start: 111.10,end: 118.00, text: "Thanks again, Howie. I’ll be there!" }
];


var fakeOutboundSummary =
  "Howie from Sterling Sales called Amanda Price to confirm that her financing for the 2024 Honda CR-V EX-L had been approved. " +
  "They scheduled a 12:30 p.m. appointment the next day to finalize paperwork and make the down payment. " +
  "Amanda was instructed to bring her ID, proof of insurance, and debit card. Howie confirmed the dealership location and that she’d receive a text and email confirmation. " +
  "They also agreed to review warranty options during the appointment.";

 
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





// ==============================
// Clarity Voice Grid Stats Inject (CALL CENTER MANAGER) — inject INTO inner iframe
// ==============================

// -------- GRID: Init Guard -------- //
if (!window.__cvGridStatsInit) {
  window.__cvGridStatsInit = true;

  
// -------- GRID: Constants -------- //
const GRID_STATS_REGEX    = /\/portal\/agents\/manager(?:[\/?#]|$)/;
const GRID_BODY_SELECTOR  = '#dash-stats-body';
const GRID_TABLE_SELECTOR = '.dash-stats-grid-table';
const CARD_ID             = 'cv-grid-stats-card';
const CARD_STYLE_ID       = 'cv-grid-stats-style'; // <-- FIXED name


  // -------- GRID: Helpers (scheduler / hide / observe) -------- //
  function scheduleInject(fn) {
    let fired = false;
    if ('requestAnimationFrame' in window) {
      requestAnimationFrame(() => requestAnimationFrame(() => { fired = true; fn(); }));
    }
    setTimeout(() => { if (!fired) fn(); }, 64);
  }

  // Hide ONLY the tables; keep native header visible
  function hideGridOriginals(doc) {
    const nodes = doc.querySelectorAll(`${GRID_TABLE_SELECTOR}`);
    nodes.forEach(n => {
      if (n && !n.hasAttribute('data-cv-hidden')) {
        n.setAttribute('data-cv-hidden','1');
        n.style.display = 'none';
      }
    });
  }

  function unhideGridOriginals(doc) {
    const nodes = doc.querySelectorAll('[data-cv-hidden="1"]');
    nodes.forEach(n => { n.style.display = ''; n.removeAttribute('data-cv-hidden'); });
  }

  function attachGridDocObserver(doc) {
    if (doc.__cvGridStatsMO) return;
    const mo = new MutationObserver(() => {
      if (!GRID_STATS_REGEX.test(location.href)) return;

      // Re-hide any tables the SPA may have re-added
      hideGridOriginals(doc);

      // If our card vanished but grid exists, re-inject
      const card = doc.getElementById(CARD_ID);
      const gridPresent =
        doc.querySelector(`${GRID_BODY_SELECTOR} ${GRID_TABLE_SELECTOR}`) ||
        doc.querySelector(GRID_TABLE_SELECTOR);
      if (!card && gridPresent) scheduleInject(injectGridStatsCard);
    });
    mo.observe(doc.documentElement || doc, { childList: true, subtree: true });
    doc.__cvGridStatsMO = mo;
  }

  function detachGridDocObserver(doc) {
    if (doc.__cvGridStatsMO) {
      try { doc.__cvGridStatsMO.disconnect(); } catch {}
      delete doc.__cvGridStatsMO;
    }
  }

  // -------- GRID: Document utilities -------- //
  function getSameOriginDocs() {
    const docs = [document];
    const iframes = document.querySelectorAll('iframe');
    for (const ifr of iframes) {
      try {
        const idoc = ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document);
        if (idoc) docs.push(idoc); // will throw if cross-origin; try/catch guards
      } catch {}
    }
    return docs;
  }

  function findGridInnerDoc() {
    for (const doc of getSameOriginDocs()) {
      const bodyContainer = doc.querySelector(GRID_BODY_SELECTOR);
      const table = bodyContainer
        ? bodyContainer.querySelector(GRID_TABLE_SELECTOR)
        : doc.querySelector(GRID_TABLE_SELECTOR);
      if (bodyContainer || table) return { doc, table, bodyContainer };
    }
    return null;
  }

  // -------- GRID: Card HTML (no duplicate header, labels above values) -------- //
  function buildGridStatsCardHTML() {
  return `
    <div id="${CARD_ID}" class="cv-metrics" style="box-sizing:border-box;margin:0;padding:0;">
      <style>
        .cv-metrics{width:100%;max-width:100%;margin:0;padding:0;}
        .cv-row{display:flex;gap:12px;margin:0 0 12px 0;}
        .cv-col{flex:1 1 0;min-width:0;}
        .cv-label{display:flex;align-items:center;gap:6px;justify-content:center;
                  font-weight:700;font-size:13px;color:#000;line-height:1;margin:0 0 6px;}
        .cv-info{display:inline-block;width:14px;height:14px;border-radius:50%;
                 border:1px solid rgba(0,0,0,.35);font-size:10px;line-height:14px;
                 text-align:center;opacity:.6;}
        .cv-tile{border-radius:8px;padding:12px 0 10px;text-align:center;
                 box-shadow:0 2px 5px rgba(0,0,0,.1);background:#7fff7f;}
        .cv-tile.yellow{background:#ffeb3b;}
        .cv-value{font-size:28px;line-height:1;font-weight:700;color:#000;}
        .cv-col:hover .cv-info{opacity:1;}
      </style>

      <div class="cv-row">
        <div class="cv-col">
          <div class="cv-label">CW <span class="cv-info" title="Calls Waiting">i</span></div>
          <div class="cv-tile"><div class="cv-value">2</div></div>
        </div>
        <div class="cv-col">
          <div class="cv-label">AWT <span class="cv-info" title="Average Wait Time">i</span></div>
          <div class="cv-tile"><div class="cv-value">2:42</div></div>
        </div>
      </div>

      <div class="cv-row" style="margin-bottom:0;">
        <div class="cv-col">
          <div class="cv-label">AHT <span class="cv-info" title="Average Handle Time">i</span></div>
          <div class="cv-tile yellow"><div class="cv-value">3:14</div></div>
        </div>
        <div class="cv-col">
          <div class="cv-label">CA <span class="cv-info" title="Calls Answered">i</span></div>
          <div class="cv-tile"><div class="cv-value">27</div></div>
        </div>
      </div>
    </div>`;
}

  // -------- GRID: Inject / remove -------- //
  function injectGridStatsCard() {
    const found = findGridInnerDoc();
    if (!found) return;

    const { doc, table, bodyContainer } = found;
    if (doc.getElementById(CARD_ID)) return;

    if (!doc.getElementById(CARD_STYLE_ID)) {
      const styleEl = doc.createElement('style');
      styleEl.id = CARD_STYLE_ID;
      styleEl.textContent = `/* reserved for future styles */`;
      if (doc.head) doc.head.appendChild(styleEl);
    }

    const wrap = doc.createElement('div');
    wrap.innerHTML = buildGridStatsCardHTML();
    const card = wrap.firstElementChild;

    // Insert inside the body container, at the top; fallbacks maintain alignment
    if (bodyContainer) {
      bodyContainer.insertBefore(card, bodyContainer.firstChild);
    } else if (table && table.parentNode) {
      table.parentNode.insertBefore(card, table);
    } else {
      doc.body.appendChild(card);
    }

    hideGridOriginals(doc);
    attachGridDocObserver(doc);
  }

  function removeGridStatsCard() {
    for (const doc of getSameOriginDocs()) {
      const card = doc.getElementById(CARD_ID);
      if (card) card.remove();
      unhideGridOriginals(doc);
      detachGridDocObserver(doc);
    }
  }

  // -------- GRID: Wait / route / watch -------- //
  function waitForGridStatsAndInject(tries = 0) {
    const found = findGridInnerDoc();
    if (found && (found.bodyContainer || tries >= 3)) {
      scheduleInject(injectGridStatsCard);
      return;
    }
    if (tries >= 12) return;
    setTimeout(() => waitForGridStatsAndInject(tries + 1), 300);
  }

  function onGridStatsPageEnter() { waitForGridStatsAndInject(); }

  function handleGridStatsRouteChange(prevHref, nextHref) {
    const wasOn = GRID_STATS_REGEX.test(prevHref);
    const isOn  = GRID_STATS_REGEX.test(nextHref);
    if (!wasOn && isOn) onGridStatsPageEnter();
    if ( wasOn && !isOn) removeGridStatsCard();
  }

  (function watchGridStatsURLChanges() {
    let last = location.href;
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    history.pushState = function () {
      const prev = last;
      const ret  = origPush.apply(this, arguments);
      const now  = location.href; last = now;
      handleGridStatsRouteChange(prev, now);
      return ret;
    };
    history.replaceState = function () {
      const prev = last;
      const ret  = origReplace.apply(this, arguments);
      const now  = location.href; last = now;
      handleGridStatsRouteChange(prev, now);
      return ret;
    };

    new MutationObserver(() => {
      if (location.href !== last) {
        const prev = last, now = location.href; last = now;
        handleGridStatsRouteChange(prev, now);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('popstate', () => {
      const prev = last, now = location.href;
      if (now !== prev) { last = now; handleGridStatsRouteChange(prev, now); }
    });

    if (GRID_STATS_REGEX.test(location.href)) onGridStatsPageEnter();
  })();
}   // closes __cvGridStatsInit




// ==============================
// Clarity Voice Queues Tiles (CALL CENTER MANAGER)
// ==============================
if (!window.__cvQueuesTilesInit) {
  window.__cvQueuesTilesInit = true;

  // ---- DECLARE CALL CENTER QUEUE TILE CONSTANTS ----
  const QUEUES_REGEX   = /\/portal\/agents\/manager(?:[\/?#]|$)/;
  const BODY_SEL       = '#home-queues-body';
  const CONTAINER_SEL  = '.table-container';
  const TABLE_SEL      = '#manager_queues';
  const PANEL_ID       = 'cvq-panel';
  const PANEL_STYLE_ID = 'cvq-panel-style';

  // ---- DECLARE CALL CENTER ICON URL CONSTANTS (HOSTED SVGs) ----
  const ICON_USER    = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/user-solid-full.svg';
  const ICON_EDIT    = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/pen-to-square-regular-full.svg';
  const ICON_SPEAKER = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/speakericon.svg';
  const ICON_PHONE   = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/phone-solid-full.svg';
  const ICON_ARROW   = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/arrow-up-solid-full.svg';

  // ---- DECLARE CALL CENTER REAL ROUTES dealerdemo) ----
  const IDLE_LINKS = {
    main:     '/portal/callqueues/editagents/300@dealerdemo/Ring+All',
    sales:    '/portal/callqueues/editagents/301@dealerdemo/Ring+All',
    existing: '/portal/callqueues/editagents/302@dealerdemo/Ring+All',
    billing:  '/portal/callqueues/editagents/303@dealerdemo/Ring+All'
  };
  const QUEUE_EDIT_LINKS = {
    main:     '/portal/callqueues/edit/300@dealerdemo',
    sales:    '/portal/callqueues/edit/301@dealerdemo',
    existing: '/portal/callqueues/edit/302@dealerdemo',
    billing:  '/portal/callqueues/edit/303@dealerdemo'
  };

  // ---- DECLARE CALL CENTER QUEUE DATA (demo counts) ----
  const QUEUE_DATA = [
    { key:'main',     title:'Operator Queue (300)',      active:0, waiting:0, timer:false, idle:7 },
    { key:'sales',    title:'Service Queue (301)',         active:3, waiting:2, timer:true,  idle:6 },
    { key:'existing', title:'Sales Queue (302)', active:1, waiting:3, timer:true,  idle:4 },
    { key:'billing',  title:'Finance Queue (303)',           active:0, waiting:0, timer:false, idle:1 }
  ];

  // ---- UTIL: CALL CENTER scheduleInject (safe RAF/timeout) ----
  function scheduleInject(fn) {
    let fired = false;
    if ('requestAnimationFrame' in window) {
      requestAnimationFrame(() => requestAnimationFrame(() => { fired = true; fn(); }));
    }
    setTimeout(() => { if (!fired) fn(); }, 64);
  }

  // ---- UTIL: CALL CENTER getSameOriginDocs (document + inner iframes) ----
  function getSameOriginDocs(){
    const docs = [document];
    const ifrs = document.querySelectorAll('iframe');
    for (let i=0;i<ifrs.length;i++){
      try {
        const idoc = ifrs[i].contentDocument || (ifrs[i].contentWindow && ifrs[i].contentWindow.document);
        if (idoc) docs.push(idoc);
      } catch {}
    }
    return docs;
  }

  // ---- UTIL: CALL CENTER findQueuesDoc (locate body/container/table) ----
  function findQueuesDoc(){
    const docs = getSameOriginDocs();
    for (let i=0;i<docs.length;i++){
      const doc = docs[i];
      const body = doc.querySelector(BODY_SEL);
      if (!body) continue;
      const container = body.querySelector(CONTAINER_SEL);
      const table = body.querySelector(TABLE_SEL);
      return { doc, body, container, table };
    }
    return null;
  }

  // ---- UTIL: CALL CENTER mmss (format seconds) ----
  function mmss(sec){
    sec |= 0;
    const m = String((sec/60|0)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return m + ':' + s;
  }

  // ---- UTIL: CALL CENTER matches / closest (compat) ----
  function matches(el, sel){
    if (!el || el.nodeType !== 1) return false;
    const p = Element.prototype;
    const fn = p.matches || p.msMatchesSelector || p.webkitMatchesSelector;
    return fn ? fn.call(el, sel) : false;
  }
  function closest(el, sel){
    while (el && el.nodeType === 1) {
      if (matches(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  // ---- UTIL: CALL CENTER find loadModal on window/parent/top ----
  function getLoadModal(doc){
    const w = (doc && doc.defaultView) || window;
    return (typeof w.loadModal === 'function' && w.loadModal) ||
           (w.parent && typeof w.parent.loadModal === 'function' && w.parent.loadModal) ||
           (w.top && typeof w.top.loadModal === 'function' && w.top.loadModal) ||
           null;
  }

  // ---- CACHES FOR CALL CENTER MODAL ROWS (stable while open) ----
  const REAL_DIDS      = ['(248) 436-3443','(248) 436-3449','(313) 995-9080'];
  const SAFE_FAKE_AC   = ['900','700','999','888','511','600','311','322','456'];
  const AGENT_EXT_POOL = [201,203,204,207,211,215,218,219,222,227,231,235];
  const CVQ_CACHE      = { active:{}, waiting:{} };

  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function safeCallerID(){ return '(' + rand(SAFE_FAKE_AC) + ') 555-01' + String(Math.floor(Math.random()*100)).padStart(2,'0'); }
  function pickAgentExt(i){ return AGENT_EXT_POOL[i % AGENT_EXT_POOL.length]; }
  function pickRealDID(i){ return REAL_DIDS[i % REAL_DIDS.length]; }

  // ---- ACTION: Build CALL CENTER "Active Calls" rows for modal ----
  function makeActiveRows(qkey, count){
    if (!CVQ_CACHE.active[qkey]) {
      const now = Date.now();
      CVQ_CACHE.active[qkey] = Array.from({length:count}, (_,i) => ({
        from: safeCallerID(),
        dialed: pickRealDID(i),
        status: 'Talking',
        agent: String(pickAgentExt(i)),
        start: now - Math.floor(Math.random()*90)*1000
      }));
    } else {
      const cur = CVQ_CACHE.active[qkey];
      while (cur.length < count) {
        cur.push({
          from: safeCallerID(),
          dialed: pickRealDID(cur.length),
          status: 'Talking',
          agent: String(pickAgentExt(cur.length)),
          start: Date.now()
        });
      }
      CVQ_CACHE.active[qkey] = cur.slice(0, count);
    }
    return CVQ_CACHE.active[qkey];
  }

  // ---- ACTION: Build CALL CENTER "Callers Waiting" rows for modal ----
  function makeWaitingRows(qkey, count){
    if (!CVQ_CACHE.waiting[qkey]) {
      const now = Date.now();
      CVQ_CACHE.waiting[qkey] = Array.from({length:count}, () => ({
        caller: safeCallerID(),
        name: 'WIRELESS CALLER',
        status: 'Waiting',
        priority: false,
        start: now - Math.floor(Math.random()*20)*1000
      }));
    } else {
      const cur = CVQ_CACHE.waiting[qkey];
      while (cur.length < count) {
        cur.push({
          caller: safeCallerID(),
          name: 'WIRELESS CALLER',
          status: 'Waiting',
          priority: false,
          start: Date.now()
        });
      }
      CVQ_CACHE.waiting[qkey] = cur.slice(0, count);
    }
    return CVQ_CACHE.waiting[qkey];
  }



// ---- ACTION: Ensure CALL CENTER Styles + Modal Host (create/update once) ----
function ensureStyles(doc){
  // move modal slightly right (affects BOTH Active Calls & Callers Waiting)
  var SHIFT_PX = 80;

  var css =
`/* container spacing to match native */
#${PANEL_ID}.table-container{margin-top:6px;}
#${PANEL_ID} table{width:100%;}
#${PANEL_ID} thead th{white-space:nowrap;}
#${PANEL_ID} td,#${PANEL_ID} th{vertical-align:middle;}

/* clickable counts (blue, boldish) */
#${PANEL_ID} .cvq-link{color:#0b84ff; font-weight:700; text-decoration:none; cursor:pointer;}
#${PANEL_ID} .cvq-link:hover{text-decoration:underline;}

/* actions column: round icon buttons */
#${PANEL_ID} .cvq-actions{ text-align:right; white-space:nowrap; width:86px; }
.cvq-icon{
  display:inline-flex; align-items:center; justify-content:center;
  width:24px; height:24px; border-radius:50%;
  background:#ffffff; border:1px solid #e1e1e1;
  margin-left:6px; opacity:.45; transition:opacity .15s, transform .04s;
  cursor:pointer; padding:0; line-height:0;
}
tr:hover .cvq-icon{ opacity:.85; }
.cvq-icon:hover{ opacity:1; }
.cvq-icon:focus{ outline:2px solid #0b84ff33; outline-offset:2px; }
.cvq-icon img{ width:14px; height:14px; display:block; pointer-events:none; }

/* --- CVQ MODAL: CALL CENTER default hidden; open with .is-open --- */
.cvq-modal-backdrop{
  position:fixed; inset:0; background:rgba(0,0,0,.35);
  z-index:9998; display:none;
}
.cvq-modal{
  position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
  background:#fff; border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,.25);
  width:min(980px,96vw); height:88vh; max-height:88vh;
  z-index:9999; overflow:hidden; display:none; flex-direction:column;
}

.cvq-modal.is-open{ display:flex; }
.cvq-modal-backdrop.is-open{ display:block; }

/* header/body/footer */
.cvq-modal header{ padding:14px 16px; border-bottom:1px solid #eee; font-size:18px; font-weight:600; }
.cvq-modal .cvq-modal-body{ overflow:auto; flex:1 1 auto; min-height:0; max-height:none; }
.cvq-modal footer{ padding:12px 16px; border-top:1px solid #eee; display:flex; justify-content:flex-end; gap:10px; }

.cvq-btn{ padding:6px 12px; border-radius:4px; border:1px solid #cfcfcf; background:#f7f7f7; cursor:pointer; }
.cvq-btn.primary{ background:#0b84ff; border-color:#0b84ff; color:#fff; }

.cvq-modal table{ width:100%; }
.cvq-modal thead th{ white-space:nowrap; }
.cvq-badge{ display:inline-block; padding:2px 6px; border-radius:4px; background:#2a77a8; color:#fff; font-size:12px; }

/* kebab menu inside modal */
.cvq-kebab{ position:relative; }
.cvq-menu{ position:absolute; right:0; top:100%; margin-top:6px; background:#fff; border:1px solid #ddd; border-radius:6px;
  box-shadow:0 8px 24px rgba(0,0,0,.16); min-width:160px; display:none; z-index:10; }
.cvq-menu a{ display:block; padding:8px 12px; color:#222; text-decoration:none; }
.cvq-menu a:hover{ background:#f5f5f5; }

@media (max-width:1200px){
  /* recenters on smaller screens so it doesn't clip */
  .cvq-modal{ left:50% !important; }
}
/* match first column padding for header + cells */
.cvq-modal table th:first-child,
.cvq-modal table td:first-child{ padding-left:22px; }

/* CALL CENTER Agent / Duration / Actions (works for both modals) */
.cvq-modal table thead th:nth-child(4),
.cvq-modal table thead th:nth-child(5),
.cvq-modal table thead th:nth-child(6),
.cvq-modal table tbody td:nth-child(4),
.cvq-modal table tbody td:nth-child(5),
.cvq-modal table tbody td:nth-child(6){ text-align:center; }

@media (max-width:900px){ #${PANEL_ID} .hide-sm{display:none;} }`;

  // always create OR update (so later CSS edits take effect)
  var s = doc.getElementById(PANEL_STYLE_ID);
  if (!s) {
    s = doc.createElement('style');
    s.id = PANEL_STYLE_ID;
    (doc.head || doc.documentElement).appendChild(s);
  }
  s.textContent = css;

  // modal host (once)
  if (!doc.getElementById('cvq-modal-host')) {
    var host = doc.createElement('div');
    host.id = 'cvq-modal-host';
    host.innerHTML =
      '<div class="cvq-modal-backdrop" id="cvq-backdrop"></div>'+
      '<div class="cvq-modal" id="cvq-modal" role="dialog" aria-modal="true">'+
        '<header id="cvq-modal-title">Modal</header>'+
        '<div class="cvq-modal-body"><div id="cvq-modal-content"></div></div>'+
        '<footer><button class="cvq-btn" id="cvq-close">Close</button></footer>'+
      '</div>';
    (doc.body || doc.documentElement).appendChild(host);

    host.addEventListener('click', function(e){
      if (e.target && (e.target.id === 'cvq-backdrop' || e.target.id === 'cvq-close')) closeModal(doc);
    });
  }
}


  // ---- ACTION: CALL CENTER Open / Close Modal (single, canonical) ----
  function openModal(doc, title, tableHTML){
    const bd = doc.getElementById('cvq-backdrop');
    const md = doc.getElementById('cvq-modal');
    doc.getElementById('cvq-modal-title').textContent = title;
    doc.getElementById('cvq-modal-content').innerHTML = tableHTML;
    if (bd) bd.classList.add('is-open');
    if (md) md.classList.add('is-open');
    if (doc.__cvqModalTimer) clearInterval(doc.__cvqModalTimer);
    doc.__cvqModalTimer = setInterval(()=>{
      const nodes = doc.querySelectorAll('[data-cvq-start]');
      for (let i=0;i<nodes.length;i++){
        const t0 = +nodes[i].getAttribute('data-cvq-start');
        nodes[i].textContent = mmss(((Date.now()-t0)/1000)|0);
      }
    },1000);
  }
  function closeModal(doc){
    const bd = doc.getElementById('cvq-backdrop');
    const md = doc.getElementById('cvq-modal');
    if (bd) bd.classList.remove('is-open');
    if (md) md.classList.remove('is-open');
    if (doc.__cvqModalTimer){ clearInterval(doc.__cvqModalTimer); doc.__cvqModalTimer=null; }
  }

  // ---- ACTION: Build CALL CENTER Panel HTML (renders all queue rows) ----
  function buildPanelHTML(){
    const rows = QUEUE_DATA.map((d)=>{
      const waitCell = d.timer
        ? `<span class="cvq-wait" id="cvq-wait-${d.key}" data-tick="1" data-sec="0">00:00</span>`
        : `<span class="cvq-wait">-</span>`;
      const idleCount = d.waiting > 0 ? 0 : (d.idle || 0);

      // platform modal inline fallbacks for Edit Agents / Edit Queue
      const agentsHref = (IDLE_LINKS[d.key] || '#');
      const queueHref  = (QUEUE_EDIT_LINKS[d.key] || '#');
      const agentsOnClick = "try{var lm=(window.loadModal||parent.loadModal||top.loadModal);if(typeof lm==='function'){lm('#write-agents', this.href);return false;}}catch(e){}";
      const queueOnClick  = "try{var lm=(window.loadModal||parent.loadModal||top.loadModal);if(typeof lm==='function'){lm('#write-queue', this.href);return false;}}catch(e){}";

      return `
      <tr data-qkey="${d.key}">
        <td class="text-center"><input type="checkbox" tabindex="-1" /></td>
        <td class="cvq-queue">${d.title}</td>

        <!-- ---- ACTION: CALL CENTER Active Calls count — opens modal ---- -->
        <td class="text-center">
          <a class="cvq-link" data-act="active">${d.active}</a>
        </td>

        <!-- ---- ACTION: CALL CENTER Callers Waiting count — opens modal ---- -->
        <td class="text-center">
          <a class="cvq-link" data-act="waiting">${d.waiting}</a>
        </td>

        <td class="text-center">${waitCell}</td>

        <!-- ---- ACTION: CALL CENTER Agents Idle — routes to real “Edit Agents” ---- -->
        <td class="text-center">
          <a class="cvq-link cvq-idle"
             href="${agentsHref}"
             data-target="#write-agents" data-toggle="modal" data-backdrop="static"
             onclick="${agentsOnClick}">${idleCount}</a>
        </td>

        <!-- ---- ACTIONS CELL: CALL CENTER Edit Agents / Edit Queue buttons ---- -->
        <td class="cvq-actions">
          <a class="cvq-icon" title="Edit Agents" aria-label="Edit Agents"
             href="${agentsHref}"
             data-target="#write-agents" data-toggle="modal" data-backdrop="static"
             onclick="${agentsOnClick}">
            <img src="${ICON_USER}" alt="">
          </a>
          <a class="cvq-icon" title="Edit Queue" aria-label="Edit Queue"
             href="${queueHref}"
             data-target="#write-queue" data-toggle="modal" data-backdrop="static"
             onclick="${queueOnClick}">
            <img src="${ICON_EDIT}" alt="">
          </a>
        </td>
      </tr>`;
    }).join('');

    return `
      <div id="${PANEL_ID}" class="table-container scrollable-small">
        <table class="table table-condensed table-hover">
          <thead>
            <tr>
              <th class="text-center" style="width:28px;"><span class="hide-sm">&nbsp;</span></th>
              <th>Call Queue</th>
              <th class="text-center">Active Calls</th>
              <th class="text-center">Callers Waiting</th>
              <th class="text-center">Wait</th>
              <th class="text-center">Agents Idle</th>
              <th class="text-center hide-sm" style="width:86px;"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
/* === CV Queues: CALL CENTER Make "Edit Agents" / "Edit Queue" icons a bit larger === */
(function () {
  var s = document.createElement('style');
  s.textContent = `
    /* widen the actions column (overrides inline width on the TH too) */
    #cvq-panel .cvq-actions { width: 100px; }
    #cvq-panel th.hide-sm    { width: 100px !important; }

    /* bump the circular button + glyph sizes (was 24/14) */
    #cvq-panel .cvq-icon     { width: 28px; height: 28px; }
    #cvq-panel .cvq-icon img { width: 16px; height: 16px; }
  `;
  (document.head || document.documentElement).appendChild(s);
})();

  // ---- ACTION: CALL CENTER Build "Active Calls" Modal Table ----
  function buildActiveTable(rows){
    const body = rows.map((r)=>`
      <tr>
        <td>${r.from}</td>
        <td>${r.dialed}</td>
        <td>${r.status}</td>
        <td>${r.agent}</td>
        <td class="text-center"><span data-cvq-start="${r.start}">${mmss(((Date.now()-r.start)/1000)|0)}</span></td>
        <td class="text-center">
          <button class="cvq-icon" title="Listen in" aria-label="Listen in">
            <img src="${ICON_SPEAKER}" alt="">
          </button>
        </td>
      </tr>`).join('');

    return `
      <table class="table table-condensed table-hover">
        <thead><tr><th>From</th><th>Dialed</th><th>Status</th><th>Agent</th><th>Duration</th><th class="text-center"></th></tr></thead>
        <tbody>${body || `<tr><td colspan="6" class="text-center">No active calls</td></tr>`}</tbody>
      </table>`;
  }

  // ---- ACTION: CALL CENTER Build "Callers Waiting" Modal Table ----
  function buildWaitingTable(rows){
    const body = rows.map((r,i)=>`
      <tr data-row="${i}">
        <td>${r.caller}</td>
        <td>${r.name}</td>
        <td>${r.status}${r.priority ? ` <span class="cvq-badge">Priority</span>`:''}</td>
        <td class="text-center"><span data-cvq-start="${r.start}">${mmss(((Date.now()-r.start)/1000)|0)}</span></td>
        <td class="text-center">
          <span class="cvq-icon" title="Prioritize" data-cvq="prio" aria-label="Prioritize"><img src="${ICON_ARROW}" alt=""></span>
          <span class="cvq-icon cvq-kebab" title="Actions" data-cvq="menu" aria-haspopup="menu" aria-expanded="false">
            <img src="${ICON_PHONE}" alt="">
            <div class="cvq-menu" role="menu">
              <a href="#" data-cvq="pickup"   role="menuitem">Pick up call</a>
              <a href="#" data-cvq="transfer" role="menuitem">Transfer call</a>
            </div>
          </span>
        </td>
      </tr>`).join('');

    return `
      <table class="table table-condensed table-hover">
        <thead><tr><th>Caller ID</th><th>Name</th><th>Status</th><th>Duration</th><th class="text-center"></th></tr></thead>
        <tbody>${body || `<tr><td colspan="5" class="text-center">No waiting callers</td></tr>`}</tbody>
      </table>`;
  }

  // ---- ACTION: CALL CENTER Wire Clicks (counts → modals; agents/queue → route) ----
  function addQueuesClickHandlers(doc){
    if (doc.__cvqClicksWired) return;
    doc.__cvqClicksWired = true;

    // ---- ACTION: CALL CENTER Active/Waiting Counts — open modals (capture to beat host) ----
    doc.addEventListener('click', (e)=>{
      const link = closest(e.target, '#'+PANEL_ID+' .cvq-link');
      if (!link) return;
      const act = link.getAttribute('data-act');
      if (!act) return;

      e.preventDefault();
      const tr = closest(link, 'tr'); if (!tr) return;
      const qkey = tr.getAttribute('data-qkey');
      let q = null; for (let i=0;i<QUEUE_DATA.length;i++){ if (QUEUE_DATA[i].key===qkey){ q=QUEUE_DATA[i]; break; } }
      if (!q) return;

      const titleBase = q.title.replace(/\s+\(\d+\)$/, '');
      if (act === 'active') {
        openModal(doc, 'Active Calls in ' + titleBase, buildActiveTable(makeActiveRows(qkey, q.active)));
      } else if (act === 'waiting') {
        openModal(doc, 'Callers in ' + titleBase, buildWaitingTable(makeWaitingRows(qkey, q.waiting)));
      }
    }, true);

    // ---- ACTION: CALL CENTER Agents Idle / Edit Agents / Edit Queue — platform modal or navigate ----
    doc.addEventListener('click', (e)=>{
      const nav = closest(e.target, '#'+PANEL_ID+' .cvq-idle, #'+PANEL_ID+' .cvq-actions a');
      if (!nav) return;
      const href = nav.getAttribute('href') || '#';
      const isAgents = matches(nav, '#'+PANEL_ID+' .cvq-idle') || (nav.getAttribute('aria-label') === 'Edit Agents');
      const targetSel = isAgents ? '#write-agents' : '#write-queue';

      const lm = getLoadModal(doc);
      if (lm) { e.preventDefault(); lm(targetSel, href); }
    }, true);

    // ---- ACTION: CALL CENTER Waiting-table Interactions (inside modal) ----
    doc.addEventListener('click', (e)=>{
      const modal = closest(e.target, '#cvq-modal');
      if (!modal) return;

      // prioritize toggle
      const pr = closest(e.target, '[data-cvq="prio"]');
      if (pr){
        const row = closest(pr, 'tr'); if (!row) return;
        const cell = row.cells[2];
        const txt = (cell.textContent || '').replace(/\s+/g,' ').trim();
        if (/Priority/.test(txt)) cell.innerHTML = txt.replace(/Priority/,'').replace(/\s+/g,' ').trim();
        else cell.innerHTML = txt + ' <span class="cvq-badge">Priority</span>';
        return;
      }

      // kebab open/close
      const kb = closest(e.target, '[data-cvq="menu"]');
      if (kb){
        const menu = kb.querySelector('.cvq-menu');
        const menus = modal.querySelectorAll('.cvq-menu');
        for (let i=0;i<menus.length;i++){ if (menus[i] !== menu) menus[i].style.display='none'; }
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
        e.stopPropagation();
        return;
      }

      if (matches(e.target, '.cvq-menu a')){
        e.preventDefault();
        const m = closest(e.target, '.cvq-menu'); if (m) m.style.display='none';
      }
    });

    // ---- ACTION: CALL CENTER Click-away inside modal closes kebabs ----
    doc.addEventListener('click', (e)=>{
      const modal = closest(e.target, '#cvq-modal');
      if (!modal) return;
      if (closest(e.target, '.cvq-kebab')) return;
      const menus = modal.querySelectorAll('.cvq-menu');
      for (let i=0;i<menus.length;i++) menus[i].style.display='none';
    });
  }

  // ---- ACTION: CALL CENTER Inject Queues Tiles (create panel + timers + handlers) ----
  function injectQueuesTiles(){
    const found = findQueuesDoc(); if (!found) return;
    const doc = found.doc, body = found.body, container = found.container;

    // styles/host once per doc
    ensureStyles(doc);

    // already injected? bail early (DON'T touch modal state here)
    if (doc.getElementById(PANEL_ID)) return;

    // build + insert panel
    const wrap = doc.createElement('div'); wrap.innerHTML = buildPanelHTML();
    const panel = wrap.firstElementChild;

    if (container && container.parentNode) {
      if (!container.hasAttribute('data-cv-hidden')) {
        container.setAttribute('data-cv-hidden','1'); container.style.display = 'none';
      }
      container.parentNode.insertBefore(panel, container);
    } else if (body) {
      body.insertBefore(panel, body.firstChild);
    } else {
      (doc.body || doc.documentElement).appendChild(panel);
    }

    // wait-column timers
    if (!doc.__cvqTimer){
      doc.__cvqTimer = setInterval(()=>{
        const nodes = doc.querySelectorAll('#'+PANEL_ID+' [data-tick="1"]');
        for (let i=0;i<nodes.length;i++){
          const n = (parseInt(nodes[i].getAttribute('data-sec'),10) || 0) + 1;
          nodes[i].setAttribute('data-sec', String(n));
          nodes[i].textContent = mmss(n);
        }
      }, 1000);
    }

    addQueuesClickHandlers(doc);
    attachObserver(doc);
  }

  // ---- ACTION: CALL CENTER Remove Queues Tiles (cleanup + unhide originals) ----
  function removeQueuesTiles(){
    const docs = getSameOriginDocs();
    for (let i=0;i<docs.length;i++){
      const doc = docs[i];
      const p = doc.getElementById(PANEL_ID); if (p) p.remove();
      const hidden = doc.querySelectorAll(BODY_SEL+' '+CONTAINER_SEL+'[data-cv-hidden="1"]');
      for (let j=0;j<hidden.length;j++){ hidden[j].style.display=''; hidden[j].removeAttribute('data-cv-hidden'); }
      if (doc.__cvqTimer){ clearInterval(doc.__cvqTimer); doc.__cvqTimer=null; }
      closeModal(doc);
      detachObserver(doc);
    }
  }

  // ---- WATCHER: CALL CENTER Observe SPA Rerenders (re-inject if needed) ----
  function attachObserver(doc){
    if (doc.__cvqMO) return;
    const mo = new MutationObserver(()=>{
      if (!QUEUES_REGEX.test(location.href)) return;

      // If our modal is OPEN, do nothing (prevents flicker close)
      const md = doc.getElementById('cvq-modal');
      if (md && md.classList.contains('is-open')) return;

      const body = doc.querySelector(BODY_SEL); if (!body) return;
      const container = body.querySelector(CONTAINER_SEL);
      const panel = doc.getElementById(PANEL_ID);

      if (container && container.style.display !== 'none') scheduleInject(injectQueuesTiles);
      else if (!panel && (body || container))            scheduleInject(injectQueuesTiles);
    });
    mo.observe(doc.documentElement || doc, { childList:true, subtree:true });
    doc.__cvqMO = mo;
  }
  function detachObserver(doc){ if(doc.__cvqMO){ try{doc.__cvqMO.disconnect();}catch{} delete doc.__cvqMO; } }

  // ---- WATCHER: CALL CENTER Route Changes (enter/leave manager page) ----
  function waitAndInject(tries){
    tries = tries || 0;
    const found = findQueuesDoc();
    if (found && (found.body || tries>=3)) { scheduleInject(injectQueuesTiles); return; }
    if (tries>=12) return;
    setTimeout(()=>waitAndInject(tries+1),300);
  }
  function onEnter(){ waitAndInject(0); }
 
  function route(prev, next){
  const was = AGENTS_REGEX.test(prev), is = AGENTS_REGEX.test(next);
  if (!was && is) { 
    waitAndInject(0);
    startGlobalLunchTicker();   // <-- ensure ticking even if panel pre-existed
  }
  if (was && !is) remove();
}


  // ---- WATCHER: CALL CENTER URL (push/replace/popstate + SPA) ----
  (function watchURL(){
    let last = location.href;
    const push = history.pushState, rep = history.replaceState;
    history.pushState    = function(){ const prev=last; const ret=push.apply(this,arguments); const now=location.href; last=now; handleRoute(prev,now); return ret; };
    history.replaceState = function(){ const prev=last; const ret=rep.apply(this,arguments);  const now=location.href; last=now; handleRoute(prev,now); return ret; };
    new MutationObserver(()=>{ if(location.href!==last){ const prev=last, now=location.href; last=now; handleRoute(prev,now); } })
      .observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('popstate',()=>{ const prev=last, now=location.href; if(now!==prev){ last=now; handleRoute(prev,now); } });
    if (QUEUES_REGEX.test(location.href)) onEnter();
  })();
}


// ==============================
// ==============================
// Clarity Voice AGENTS PANEL — ES5-safe, leaving lunch timer in for now to fix later 
// ==============================
if (!window.__cvAgentsPanelInit) {
  window.__cvAgentsPanelInit = true;

  var AGENTS_REGEX       = /\/portal\/agents\/manager(?:[\/?#]|$)/;
  var NATIVE_TABLE_SEL   = '#agents-table';
  var CONTAINER_SEL      = '.table-container';
  var PANEL_ID           = 'cv-agents-panel';
  var PANEL_STYLE_ID     = 'cv-agents-style';

  // Icons
  var ICON_USER   = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/user-solid-full.svg';
  var ICON_PHONE  = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/office-phone-svgrepo-com.svg';
  var ICON_STATS  = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/signal-solid-full.svg';
  var ICON_QUEUES = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/ellipsis-solid-full.svg';
  var ICON_LISTEN = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/speakericon.svg';

  // Agents (Bob on lunch; Mike/Brittany/Mark show phone icon)
  var AGENTS = [
    { name:'Abbey Palmer',      ext:200, online:true,  icon:'phone' },
    { name:'Emma Johnson',      ext:201, online:true,  icon:'user'  },
    { name:'Liam Turner',          ext:202, online:false, icon:'user'  },
    { name:'Mike Jones',      ext:210, online:false, icon:'user'  },

    { name:'Chad Sanders', ext:211, online:true,  icon:'phone' },
    { name:'Isabella Martinez',      ext:212, online:true,  icon:'user'  },
    { name:'Bob Smith',      ext:220, online:true,  icon:'phone' },
    { name:'Ethan Moore',        ext:221, online:true,  icon:'user'  }
  ];

  // Helpers
  function pad2(n){ return ('0'+n).slice(-2); }
  function mmss(s){ return pad2((s/60|0)) + ':' + pad2(s%60); }

  function getDocs(){
    var docs = [document];
    var ifrs = document.getElementsByTagName('iframe');
    for (var i=0;i<ifrs.length;i++){
      try {
        var idoc = ifrs[i].contentDocument || (ifrs[i].contentWindow && ifrs[i].contentWindow.document);
        if (idoc) docs.push(idoc);
      } catch(e){}
    }
    return docs;
  }

  function closest(el, sel){
    while (el && el.nodeType === 1){
      if (el.matches ? el.matches(sel) : (el.msMatchesSelector && el.msMatchesSelector(sel)) || (el.webkitMatchesSelector && el.webkitMatchesSelector(sel))) return el;
      el = el.parentNode;
    }
    return null;
  }

  function findBits(){
    var docs = getDocs();
    for (var i=0;i<docs.length;i++){
      var doc = docs[i];
      var table = doc.querySelector(NATIVE_TABLE_SEL);
      if (table){
        var container = (table.closest && table.closest(CONTAINER_SEL)) || table.parentElement || doc.body;
        return { doc: doc, table: table, container: container };
      }
    }
    return null;
  }

  function ensureStyles(doc){
  if (doc.getElementById(PANEL_STYLE_ID)) return;
  var s = doc.createElement('style');
  s.id = PANEL_STYLE_ID;
  var css = [
    '#',PANEL_ID,'{margin-top:6px;background:#fff;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.1);overflow:hidden}',
    '#',PANEL_ID,' .cv-row{display:block;padding:8px 12px;border-bottom:1px solid #eee}',
    '#',PANEL_ID,' .cv-row:last-child{border-bottom:none}',

    '#',PANEL_ID,' .cv-top{display:flex;align-items:center;justify-content:space-between;gap:10px}',
    '#',PANEL_ID,' .cv-left{display:flex;align-items:center;gap:10px;min-width:0}',

    '#',PANEL_ID,' .cv-name{font:400 13px/1.35 "Helvetica Neue", Arial, Helvetica, sans-serif;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',

    // --- ICON TWEAKS: bigger + darker green ---
    '#',PANEL_ID,' .cv-glyph{width:20px;height:20px;display:inline-block;border-radius:3px;background:#167a32}',
    '#',PANEL_ID,' .cv-glyph[data-icon="user"]{-webkit-mask:url(',ICON_USER,') center/contain no-repeat;mask:url(',ICON_USER,') center/contain no-repeat;}',
    '#',PANEL_ID,' .cv-glyph[data-icon="phone"]{-webkit-mask:url(',ICON_PHONE,') center/contain no-repeat;mask:url(',ICON_PHONE,') center/contain no-repeat;}',

    '#',PANEL_ID,' .cv-tools{display:flex;align-items:center;gap:10px;opacity:0;visibility:hidden;transition:opacity .15s}',
    '#',PANEL_ID,' .cv-row:hover .cv-tools{opacity:1;visibility:visible}',
    // tools a bit larger/heavier too
    '#',PANEL_ID,' .cv-tool{width:20px;height:20px;opacity:.75;cursor:pointer}',
    '#',PANEL_ID,' .cv-tool:hover{opacity:1}',
    '#',PANEL_ID,' .cv-tool img{width:20px;height:20px;display:block}',

    // align subline under the larger glyph (20px glyph + 10px gap = 30px)
    '#',PANEL_ID,' .cv-sub{display:flex;justify-content:space-between;align-items:center;margin-top:4px;padding-left:30px}',
    '#',PANEL_ID,' .cv-sub-label{font:600 12px/1 Arial;color:#9aa0a6}',
    '#',PANEL_ID,' .cv-sub-time{font:600 12px/1 Arial;color:#9aa0a6}',

    '#',PANEL_ID,' .is-offline .cv-glyph{background:#9ca3af}',
    '#',PANEL_ID,' .is-offline .cv-name{color:#9aa0a6}',
    '#',PANEL_ID,' .is-offline .cv-sub-label,#',PANEL_ID,' .is-offline .cv-sub-time{color:#b3b8bf}'
  ].join('');
  s.textContent = css;
  (doc.head || doc.documentElement).appendChild(s);
}

// AGENTS PANEL build panel
  function buildPanel(doc){
    var panel = doc.createElement('div');
    panel.id = PANEL_ID;

    var frag = doc.createDocumentFragment();

    for (var i=0;i<AGENTS.length;i++){
      var a = AGENTS[i];
      var row = doc.createElement('div');
      var offline = a.lunch ? true : !a.online;
      row.className = 'cv-row' + (offline ? ' is-offline' : '');

      var top = doc.createElement('div');
      top.className = 'cv-top';

      var left = doc.createElement('div');
      left.className = 'cv-left';

      var glyph = doc.createElement('span');
      glyph.className = 'cv-glyph';
      glyph.setAttribute('data-icon', a.icon === 'phone' ? 'phone' : 'user');

      var name = doc.createElement('div');
      name.className = 'cv-name';
      name.textContent = 'Ext ' + a.ext + ' (' + a.name + ')';

      left.appendChild(glyph);
      left.appendChild(name);

      var sip = 'sip:' + a.ext + '@dealerdemo';
      var safeName = encodeURIComponent(a.name).replace(/%20/g,'+');
      var queuesHref = '/portal/agents/agentrouting/' + encodeURIComponent(sip) + '/' + safeName;
      // Use the platform modal when available; otherwise let the <a> navigate.
      var queuesOnClick =
      "try{var lm=(window.loadModal||parent.loadModal||top.loadModal);"
    + "if(typeof lm==='function'){lm('#queuesPerAgentModal', this.href);return false;}}catch(e){}";

      var tools = doc.createElement('div');
      tools.className = 'cv-tools';
      tools.innerHTML =
        '<span class="cv-tool cv-tool-stats" data-tool="stats" title="Stats" aria-label="Stats">'
        +   '<img alt="" width="20" height="20" style="width:20px;height:20px;display:block" src="'+ICON_STATS+'">'
        + '</span>'
        + '<a class="cv-tool" data-tool="queues" title="Queues" aria-label="Queues"'
        +    ' href="'+queuesHref+'" onclick="'+queuesOnClick+'">'
              +   '<img alt="" width="20" height="20" style="width:20px;height:20px;display:block" src="'+ICON_QUEUES+'">'
        + '</a>'
        + '<span class="cv-tool" data-tool="listen" title="Listen in" aria-label="Listen in">'
        +   '<img alt="" width="20" height="20" style="width:20px;height:20px;display:block" src="'+ICON_LISTEN+'">'
        + '</span>';


      top.appendChild(left);
      top.appendChild(tools);
      row.appendChild(top);

      if (a.lunch){
        var sub = doc.createElement('div');
        sub.className = 'cv-sub';
        sub.innerHTML =
          '<span class="cv-sub-label">Lunch</span>' +
          '<span class="cv-sub-time" data-cv-lunch-start="'+ Date.now() +'">00:00</span>';
        row.appendChild(sub);
      }

      frag.appendChild(row);
    }

    panel.appendChild(frag);
    return panel;
  }

  // AGENTS PANEL QUEUES  Reliable per-document ticker (no optional chaining, no duplicate intervals)
  function startLunchTicker(doc){
    if (!doc) return;
    if (doc.__cvAgentsLunchTicker) { try { clearInterval(doc.__cvAgentsLunchTicker); } catch(e){} }
    function tick(){
      var list = doc.querySelectorAll('#'+PANEL_ID+' .cv-sub-time');
      for (var i=0;i<list.length;i++){
        var el = list[i];
        var st = parseInt(el.getAttribute('data-cv-lunch-start'), 10);
        if (!isFinite(st)) {
          st = Date.now();
          el.setAttribute('data-cv-lunch-start', String(st));
        }
        var secs = ((Date.now() - st)/1000) | 0;
        var txt = mmss(secs);
        if (el.textContent !== txt) el.textContent = txt;
      }
    }
    tick();
    doc.__cvAgentsLunchTicker = setInterval(tick, 1000);
  }

  function stopLunchTicker(doc){
    if (doc && doc.__cvAgentsLunchTicker){
      try { clearInterval(doc.__cvAgentsLunchTicker); } catch(e){}
      doc.__cvAgentsLunchTicker = null;
    }
  }

  function inject(){
    var bits = findBits(); if (!bits) return;
    var doc = bits.doc, table = bits.table, container = bits.container;
    if (doc.getElementById(PANEL_ID)) { startLunchTicker(doc); return; }

    ensureStyles(doc);

    if (table && table.style){
      table.setAttribute('data-cv-hidden','1');
      table.style.display = 'none';
    }

    var panel = buildPanel(doc);
    if (container && container.insertBefore){
      container.insertBefore(panel, table || null);
    } else {
      (doc.body || doc.documentElement).appendChild(panel);
    }

    startLunchTicker(doc);
  }

  function remove(){
    var docs = getDocs();
    for (var i=0;i<docs.length;i++){
      var doc = docs[i];
      var p = doc.getElementById(PANEL_ID);
      if (p) p.remove();
      var t = doc.querySelector(NATIVE_TABLE_SEL+'[data-cv-hidden="1"]');
      if (t){ t.style.display=''; t.removeAttribute('data-cv-hidden'); }
      stopLunchTicker(doc);
    }
  }

  function waitAndInject(tries){
    tries = tries || 0;
    if (!AGENTS_REGEX.test(location.href)) return;
    var bits = findBits();
    if (bits){ inject(); return; }
    if (tries >= 25) return;
    setTimeout(function(){ waitAndInject(tries+1); }, 250);
  }

  (function watch(){
    var last = location.href;
    var push = history.pushState, rep = history.replaceState;

    function route(prev, next){
      var was = AGENTS_REGEX.test(prev), is = AGENTS_REGEX.test(next);
      if (!was && is) waitAndInject(0);
      if ( was && !is) remove();
    }

    history.pushState = function(){
      var prev=last; var r=push.apply(this,arguments); var now=location.href; last=now; route(prev,now); return r;
    };
    history.replaceState = function(){
      var prev=last; var r=rep.apply(this,arguments); var now=location.href; last=now; route(prev,now); return r;
    };
    new MutationObserver(function(){ if(location.href!==last){ var prev=last, now=location.href; last=now; route(prev,now);} })
      .observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('popstate',function(){ var prev=last, now=location.href; if(now!==prev){ last=now; route(prev,now);} });

    if (AGENTS_REGEX.test(location.href)) waitAndInject(0);
  })();
}

/* ===== AGENTS PANEL STATS Modal — APPEND-ONLY (axes, ticks, donut) ===== */
(function(){
  if (window.__cvAgentsStatsAppend_v3) return;
  window.__cvAgentsStatsAppend_v3 = true;

  var STYLE_ID = 'cvhf-stats-style';
  var ROOT_ID  = 'cvhf-stats-root';

  // ---------- styles + host ----------
  function ensureModal(doc){
    doc = doc || document;
    if (!doc.getElementById(STYLE_ID)){
      var s = doc.createElement('style'); s.id = STYLE_ID;
      s.textContent = [
        '#',ROOT_ID,'{position:fixed;inset:0;z-index:2147483646;display:none}',
        '#',ROOT_ID,'.is-open{display:block}',
        '#',ROOT_ID,' .cvhf-scrim{position:fixed;inset:0;background:rgba(0,0,0,.35)}',
        '#',ROOT_ID,' .cvhf-dialog{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
          'background:#fff;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.18);',
          'min-width:360px;max-width:1024px;max-height:80vh;display:flex;flex-direction:column;overflow:auto}',
        '#',ROOT_ID,' .cvhf-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #eee}',
        '#',ROOT_ID,' .cvhf-ttl{font:600 14px/1.2 "Helvetica Neue", Arial, Helvetica, sans-serif;color:#222}',
        '#',ROOT_ID,' .cvhf-x{width:28px;height:28px;border-radius:6px;border:1px solid #e6e6e6;background:#fafafa;cursor:pointer}',
        '#',ROOT_ID,' .cvhf-x:hover{background:#f1f3f5}',
        '#',ROOT_ID,' .cvhf-bd{padding:16px;background:#fff}',
        '#',ROOT_ID,' .cvhf-ft{padding:12px 16px;border-top:1px solid #eee;display:flex;justify-content:flex-end}',
        '#',ROOT_ID,' .cvhf-btn{padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#fff;font:600 13px/1 Arial;cursor:pointer}',
        '#',ROOT_ID,' .cvhf-btn.primary{background:#167a32;border-color:#167a32;color:#fff}',

        /* layout and “Google-ish” card look */
        '#',ROOT_ID,' .cvhf-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;min-width:980px}',
        '#',ROOT_ID,' .cvhf-head{grid-column:1 / span 2;border-bottom:1px solid #eee;margin-bottom:6px;padding-bottom:6px}',
        '#',ROOT_ID,' .cvhf-title{font:700 18px/1.2 "Helvetica Neue", Arial;color:#222;margin:0}',
        '#',ROOT_ID,' .cvhf-list{list-style:none;margin:0;padding:0 0 0 8px;font:600 13px/1.6 Arial;color:#222}',
        '#',ROOT_ID,' .cvhf-list li{display:flex;gap:12px;align-items:baseline}',
        '#',ROOT_ID,' .cvhf-num{width:44px;text-align:right;color:#333}',
        '#',ROOT_ID,' .cvhf-card{border:1px solid #eee;border-radius:8px;padding:12px;background:#fff}',
        '#',ROOT_ID,' .cvhf-card h5{margin:0 0 8px;font:600 12px/1.2 Arial;color:#555}',
        '#',ROOT_ID,' .cvhf-card svg{display:block;margin:0 8px 2px}',

        /* axis + grid styling */
        '#',ROOT_ID,' .cvhf-grid{stroke:#e3e3e3;stroke-width:1;shape-rendering:crispEdges}',
        '#',ROOT_ID,' .cvhf-baseline{stroke:#bdbdbd;stroke-width:1;shape-rendering:crispEdges}',
        '#',ROOT_ID,' .cvhf-axis-label{font:11px Arial;fill:#666;text-anchor:end}',

        /* bars */
        '#',ROOT_ID,' .cvhf-bar{fill:#e57027}',

        /* donut pie with centered % */
        '#',ROOT_ID,' .cvhf-pie{position:relative;width:var(--size);height:var(--size);margin:8px auto;border-radius:50%;',
          'background:conic-gradient(#2f66d0 var(--deg), #d33 0)}',
        '#',ROOT_ID,' .cvhf-pie::after{content:"";position:absolute;inset:35px;background:#fff;border-radius:50%}',
        '#',ROOT_ID,' .cvhf-pie::before{content:attr(data-pct) "%";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);',
          'font:600 12px/1 Arial;color:#444}'
      ].join('');
      (document.head||document.documentElement).appendChild(s);
    }
    if (!doc.getElementById(ROOT_ID)){
      var root = doc.createElement('div'); root.id = ROOT_ID;
      root.innerHTML = '<div class="cvhf-scrim"></div><div class="cvhf-dialog" role="dialog" aria-modal="true">'+
        '<div class="cvhf-hd"><div class="cvhf-ttl"></div><button class="cvhf-x" aria-label="Close">×</button></div>'+
        '<div class="cvhf-bd"></div>'+
        '<div class="cvhf-ft"><button class="cvhf-btn primary" data-btn="close">Close</button></div>'+
      '</div>';
      (document.body||document.documentElement).appendChild(root);
      var close = function(){ root.classList.remove('is-open'); };
      root.querySelector('.cvhf-scrim').addEventListener('click', close);
      root.querySelector('.cvhf-x').addEventListener('click', close);
      root.querySelector('[data-btn="close"]').addEventListener('click', close);
    }
    return { root: doc.getElementById(ROOT_ID) };
  }

  function openModal(title, bodyHTML){
    var parts = ensureModal();  // ✅ call the function that returns .root
    var root = parts.root;
    root.querySelector('.cvhf-ttl').textContent = title || '';
    root.querySelector('.cvhf-bd').innerHTML = bodyHTML || '';
    root.classList.add('is-open');
  }


  // ---------- render helpers (axes + ticks like your screenshot) ----------
  function barSVG(values, axisMax, w, h, gap){
    var left = 28, right = 6, top = 6, bottom = 18;
    var cw = w - left - right, ch = h - top - bottom;
    var n = values.length, bw = Math.max(2, Math.floor((cw - (n+1)*gap)/n));
    var maxVal = axisMax || Math.max.apply(null, values) || 1;

    // choose 5 ticks (0..max) for the Google-ish look
    var ticks = 5;
    var step  = Math.ceil(maxVal / ticks);
    var ymax  = step * ticks;
    var scale = ch / ymax;

    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'];

    // grid & labels
    for (var i=0;i<=ticks;i++){
      var v = i*step;
      var y = top + ch - (v*scale);
      var cls = (i===0) ? 'cvhf-baseline' : 'cvhf-grid';
      parts.push('<line class="'+cls+'" x1="'+left+'" y1="'+y+'" x2="'+(left+cw)+'" y2="'+y+'"></line>');
      parts.push('<text class="cvhf-axis-label" x="'+(left-6)+'" y="'+(y+4)+'">'+v+'</text>');
    }

    // bars
    var x = left + gap;
    for (var j=0;j<n;j++){
      var v = values[j], bh = Math.round(v*scale), yb = top + ch - bh;
      parts.push('<rect class="cvhf-bar" x="'+x+'" y="'+yb+'" width="'+bw+'" height="'+bh+'"></rect>');
      x += bw + gap;
    }

    parts.push('</svg>');
    return parts.join('');
  }

  function pieHTML(pct,size){
    pct = Math.max(0, Math.min(100, pct));
    var deg = (pct/100)*360;
    return '<div class="cvhf-pie" data-pct="'+pct.toFixed(1)+'" style="--size:'+size+'px; --deg:'+deg+'deg;"></div>';
  }

  // ---------- canned data (A/B). Both keep 5 outbound calls + 22 talk time ----------
  var STATS = {
    A: {
      metrics:{callCenterCallsToday:10,callCenterTalkTime:13,callCenterAvgTalk:'1:23',inboundCallsToday:10,inboundTalkTime:14,inboundAvgTalk:'1:23',outboundCallsToday:5,outboundTalkTime:22,outboundAvgTalk:'4:24',avgACW:'0.0'},
      perHour:[4,4,5,0,0,0,0,1,1,4,0,0,0,0,0,0,0,0,0,1,2,3,0,4],
      perDay:[27,38,30,24,27,29,28,47,29,42],
      piePct:100
    },
    B: {
      metrics:{callCenterCallsToday:14,callCenterTalkTime:24,callCenterAvgTalk:'1:46',inboundCallsToday:16,inboundTalkTime:29,inboundAvgTalk:'1:45',outboundCallsToday:5,outboundTalkTime:22,outboundAvgTalk:'4:24',avgACW:'0.0'},
      perHour:[1,4,5,3,2,2,0,0,0,0,0,0,0,0,0,0,1,4,4,5,0,4,4,5],
      perDay:[36,65,39,44,46,27,30,48,50,43],
      piePct:88.9
    }
  };

  function buildBody(agentName, ext, data){
    var m  = data.metrics;
    var b1 = barSVG(data.perHour, 5, 460, 160, 6);  // 0..5 axis
    var b2 = barSVG(data.perDay,  40, 460, 180, 8); // 0..40 axis like your ref
    var pie= pieHTML(data.piePct, 220);
    return [
      '<div class="cvhf-wrap">',
        '<div class="cvhf-head"><h3 class="cvhf-title">Statistics for ',agentName,' (',ext,')</h3></div>',
        '<div><ul class="cvhf-list">',
          '<li><span class="cvhf-num">',m.callCenterCallsToday,'</span> <span>Call Center Calls Today</span></li>',
          '<li><span class="cvhf-num">',m.callCenterTalkTime,'</span> <span>Call Center Talk Time</span></li>',
          '<li><span class="cvhf-num">',m.callCenterAvgTalk,'</span> <span>Call Center Average Talk</span></li>',
          '<li><span class="cvhf-num">',m.inboundCallsToday,'</span> <span>Inbound Calls Today</span></li>',
          '<li><span class="cvhf-num">',m.inboundTalkTime,'</span> <span>Inbound Talk Time</span></li>',
          '<li><span class="cvhf-num">',m.inboundAvgTalk,'</span> <span>Inbound Average Talk</span></li>',
          '<li><span class="cvhf-num">',m.outboundCallsToday,'</span> <span>Outbound Calls Today</span></li>',
          '<li><span class="cvhf-num">',m.outboundTalkTime,'</span> <span>Outbound Talk Time</span></li>',
          '<li><span class="cvhf-num">',m.outboundAvgTalk,'</span> <span>Outbound Average Talk</span></li>',
          '<li><span class="cvhf-num">',m.avgACW,'</span> <span>Avg ACW</span></li>',
        '</ul></div>',
        '<div class="cvhf-card"><h5>My Calls Per Hour (last 24 hours)</h5>', b1, '</div>',
        '<div class="cvhf-card"><h5>My Calls Per Day (last 10 days)</h5>',  b2, '</div>',
        '<div class="cvhf-card"><h5>Calls by Origination Source (last 24 hours)</h5>', pie, '</div>',
      '</div>'
    ].join('');
  }

  // ---------- click wiring (Agents panel ONLY) ----------
  document.addEventListener('click', function(e){
    var root = document.getElementById('cv-agents-panel'); if (!root) return;
    var btn = e.target && e.target.closest &&
      e.target.closest('.cv-tool[title="Stats"], .cv-tool-stats, [data-tool="stats"]');
    if (!btn || !root.contains(btn)) return;


    var row = btn.closest('.cv-row'); if (!row) return;
    var label = (row.querySelector('.cv-name') && row.querySelector('.cv-name').textContent) || '';
    var extMatch  = label.match(/Ext\.?\s*(\d{2,6})/i);
    var nameMatch = label.match(/\(([^)]+)\)/);
    var ext       = (extMatch && extMatch[1]) || '200';
    var agentName = (nameMatch && nameMatch[1]) || 'Agent';

    var variant = (parseInt(ext,10) % 2 === 0) ? 'B' : 'A';
    var data    = STATS[variant] || STATS.A;

    openModal('', buildBody(agentName, ext, data));
  }, true);
})();

/* STATS PIE microfix — solid pie (no donut) */
(function(){
  var s = document.createElement('style');
  s.textContent =
    '#cvhf-stats-root .cvhf-pie::after{display:none !important;}' +  /* remove hole */
    '#cvhf-stats-root .cvhf-pie::before{color:#fff !important;}';    /* white % like ref */
  (document.head || document.documentElement).appendChild(s);
})();

/* === CV Agents: Queues icon — single, final block === */
(function(){
  var PANEL_ID = 'cv-agents-panel';
  var DOMAIN   = 'dealerdemo';

  function runIn(doc){
    if (!doc || doc.__cvAgentsQueuesBound) return;
    var panel = doc.getElementById(PANEL_ID);
    if (!panel) return;                 // panel not mounted yet in this doc
    doc.__cvAgentsQueuesBound = true;

    // 1) Tag the Queues button (prefer existing; else middle tool)
    panel.querySelectorAll('.cv-row').forEach(function(row){
      var btn = row.querySelector('.cv-tools [data-tool="queues"]')
             || row.querySelector('.cv-tools .cv-tool[title*="Queues"]');
      if (!btn) {
        var tools = row.querySelectorAll('.cv-tools .cv-tool');
        if (tools && tools[1]) btn = tools[1]; // middle icon
      }
      if (btn) {
        btn.setAttribute('data-tool','queues');
        if (!btn.getAttribute('title'))    btn.setAttribute('title','Queues');
        if (!btn.getAttribute('role'))     btn.setAttribute('role','button');
        if (!btn.getAttribute('tabindex')) btn.setAttribute('tabindex','0');
      }
    });

    function parseRow(row){
      var label = ((row.querySelector('.cv-name')||{}).textContent||'').trim();
      var m = label.match(/Ext\s*(\d{2,6})\s*\((.+?)\)/i);
      var ext  = (row.dataset && row.dataset.ext) || (m ? m[1] : '');
      var name = (m ? m[2] : 'Agent').trim();
      return { ext: ext, name: name };
    }

    function openQueues(row){
      var p = parseRow(row);
      if (!p.ext) { console.warn('[cv] queues: no extension'); return; }
      var sip = 'sip:'+p.ext+'@'+DOMAIN;

      // A) Native API (preferred when present)
      try {
        var NS = doc.defaultView && doc.defaultView.NSAgentsCallQueues;
        if (NS && typeof NS.getQueuesPerAgent === 'function') {
          NS.getQueuesPerAgent(sip, p.name);
          return;
        }
      } catch(_) {}

      // B) Platform modal loader (loadModal)
      try {
        var w  = doc.defaultView || window;
        var lm = w.loadModal || (w.parent && w.parent.loadModal) || (w.top && w.top.loadModal);
        if (typeof lm === 'function') {
          var href = '/portal/agents/agentrouting/'
                   + encodeURIComponent(sip) + '/'
                   + encodeURIComponent(p.name).replace(/%20/g,'+');
          lm('#queuesPerAgentModal', href);
          return;
        }
      } catch(_) {}

      // C) Hard navigate as a last resort
      var url = '/portal/agents/agentrouting/'
              + encodeURIComponent(sip) + '/'
              + encodeURIComponent(p.name).replace(/%20/g,'+');
      location.href = url;
    }

    // 2) Delegated handlers (click + keyboard) scoped to our panel
    doc.addEventListener('click', function(e){
      var btn = e.target && e.target.closest && e.target.closest('#'+PANEL_ID+' .cv-tools [data-tool="queues"]');
      if (!btn) return;
      e.preventDefault();
      var row = btn.closest('.cv-row'); if (!row) return;
      openQueues(row);
    }, true);

    doc.addEventListener('keydown', function(e){
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var btn = e.target && e.target.closest && e.target.closest('#'+PANEL_ID+' .cv-tools [data-tool="queues"]');
      if (!btn) return;
      e.preventDefault();
      var row = btn.closest('.cv-row'); if (!row) return;
      openQueues(row);
    }, true);
  }

  // run now in current doc
  runIn(document);

  // and any same-origin iframes that already exist
  document.querySelectorAll('iframe').forEach(function(ifr){
    try {
      var d = ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document);
      runIn(d);
    } catch(_) {}
  });

  // re-run as the SPA mounts/replaces nodes
  new MutationObserver(function(){
    runIn(document);
    document.querySelectorAll('iframe').forEach(function(ifr){
      try {
        var d = ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document);
        runIn(d);
      } catch(_) {}
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();


;try{(function(){
  var PANEL_ID = 'cv-agents-panel';
  if (document.__cvQueuesBoundV3) return;
  document.__cvQueuesBoundV3 = true;

  function getLoadModal(win){
    try {
      var w = win || window;
      return w.loadModal || (w.parent && w.parent.loadModal) || (w.top && w.top.loadModal) || null;
    } catch(e){ return null; }
  }

  function parseRow(row){
    var label = ((row && row.querySelector('.cv-name'))||{}).textContent || '';
    var m = label.match(/Ext\s*(\d{2,6})\s*\((.+?)\)/i) || [];
    var ext  = (row && row.dataset && row.dataset.ext) || m[1];
    var name = (m[2]||'').trim() || 'Agent';
    return { ext: ext, name: name };
  }

  function openQueues(row){
    var p = parseRow(row);
    if (!p.ext) { console.warn('[cv queues] no extension parsed'); return; }
    var sip = 'sip:'+p.ext+'@dealerdemo';

    // Try the native call first (if it exists)
    try {
      if (window.NSAgentsCallQueues && typeof window.NSAgentsCallQueues.getQueuesPerAgent === 'function') {
        window.NSAgentsCallQueues.getQueuesPerAgent(sip, p.name);
        return;
      }
    } catch(e){ /* ignore and fall back */ }

    // Fallback: portal modal or hard navigate
    var href = '/portal/agents/agentrouting/'
             + encodeURIComponent(sip) + '/'
             + encodeURIComponent(p.name).replace(/%20/g,'+');

    var lm = getLoadModal();
    if (typeof lm === 'function') lm('#queuesPerAgentModal', href);
    else location.href = href;
  }

  // Delegate clicks to our Queues icon
  document.addEventListener('click', function(e){
    var qbtn = e.target && e.target.closest && e.target.closest('#'+PANEL_ID+' .cv-tools [data-tool="queues"]');
    if (!qbtn) return;
    e.preventDefault();
    var row = qbtn.closest('.cv-row'); if (!row) return;
    openQueues(row);
  }, true);
})();}catch(e){console.error('[cv queues] init failed:', e);}

/* === CV Queues Fake Modal — vertical-square, real queues, no horiz scroll (drop-in) === */
(function () {
  if (window.__cvQueuesFake_v5) return;
  window.__cvQueuesFake_v5 = true;

  var ROOT_ID  = 'cvqf-root';
  var STYLE_ID = 'cvqf-style';
  var PANEL_ID = 'cv-agents-panel';
  var DOMAIN   = 'dealerdemo';

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return (root||document).querySelectorAll(sel); }
  function closest(el, sel){ while (el && el.nodeType===1){ if (el.matches(sel)) return el; el = el.parentNode; } return null; }
  function stopAll(e){ if(!e) return; e.preventDefault(); e.stopPropagation(); }

  function ensureHost(){
    if (!document.getElementById(STYLE_ID)){
      var s = document.createElement('style'); s.id = STYLE_ID;
      s.textContent = [
        '#',ROOT_ID,'{position:fixed;inset:0;z-index:2147483646;display:none}',
        '#',ROOT_ID,'.is-open{display:block}',
        '#',ROOT_ID,' .cvqf-scrim{position:fixed;inset:0;background:rgba(0,0,0,.35)}',
        '#',ROOT_ID,' .cvqf-dialog{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);',
          'background:#fff;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.18);',
          'width:clamp(520px,44vw,640px);',
          'height:clamp(520px,74vh,760px);',
          'max-width:calc(100vw - 40px);',
          'max-height:calc(100vh - 40px);',
          'display:flex;flex-direction:column;overflow:hidden}',
        '#',ROOT_ID,' header{padding:14px 16px;border-bottom:1px solid #eee;',
          'font:600 16px/1.2 "Helvetica Neue", Arial, Helvetica, sans-serif;color:#222}',
        '#',ROOT_ID,' .cvqf-bd{flex:1 1 auto;max-height:none;padding:0 14px 12px;overflow:auto}',
        '#',ROOT_ID,' .cvqf-ft{padding:12px 16px;border-top:1px solid #eee;display:flex;gap:10px;justify-content:flex-end;position:relative;overflow:visible}',
        '#',ROOT_ID,' #cvqf-setstatus-menu{position:absolute;right:0;bottom:calc(100% + 6px);z-index:3}',

        /* table: fixed layout and balanced columns */
        '#',ROOT_ID,' table{width:100%;border-collapse:collapse;table-layout:fixed}',
        '#',ROOT_ID,' thead th{font:600 13px/1.2 "Helvetica Neue", Arial;color:#222;text-align:left;',
          'padding:9px 8px;white-space:nowrap;border-bottom:1px solid #eee}',
        '#',ROOT_ID,' tbody td{font:400 13px/1.35 "Helvetica Neue", Arial;color:#333;',
          'padding:9px 8px;border-bottom:1px solid #f0f0f0;white-space:normal;word-break:break-word}',
        '#',ROOT_ID,' tbody tr:hover{background:#fafafa}',
        '#',ROOT_ID,' td.num{text-align:center}',
        '#',ROOT_ID,' thead th:nth-child(1), #',ROOT_ID,' tbody td:nth-child(1){width:72px}',
        '#',ROOT_ID,' thead th:nth-child(3), #',ROOT_ID,' tbody td:nth-child(3){width:148px}',
        '#',ROOT_ID,' thead th:nth-child(4), #',ROOT_ID,' tbody td:nth-child(4){width:64px;text-align:center}',
        '#',ROOT_ID,' thead th:nth-child(5), #',ROOT_ID,' tbody td:nth-child(5){width:85px;text-align:center}',
        '#',ROOT_ID,' thead th:nth-child(2), #',ROOT_ID,' tbody td:nth-child(2){white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',

        /* inputs & buttons */
        '#',ROOT_ID,' select{height:28px;font:600 13px/1 Arial}',
        '#',ROOT_ID,' input[type="number"], #',ROOT_ID,' select{max-width:96px}',
        '#',ROOT_ID,' .btn{padding:7px 12px;border-radius:8px;border:1px solid #d9d9d9;background:#fff;cursor:pointer;font:600 13px/1 Arial}',
        '#',ROOT_ID,' .btn.primary{background:#0b84ff;border-color:#0b84ff;color:#fff}',
        '#',ROOT_ID,' .btn:focus{outline:2px solid #0b84ff33;outline-offset:2px}',

        /* status pill + small menu */
        '#',ROOT_ID,' .pill{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:5px;',
          'font:700 12px/1 Arial;color:#fff;border:none;cursor:pointer}',
        '#',ROOT_ID,' .pill.off{background:#c4453c}',
        '#',ROOT_ID,' .pill.on{background:#2e7d32}',
        '#',ROOT_ID,' .caret{display:inline-block;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #fff}',
        '#',ROOT_ID,' .menu{position:absolute;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.16);padding:4px 0;display:none;min-width:140px;z-index:2}',
        '#',ROOT_ID,' .menu a{display:block;padding:8px 10px;font:600 13px/1 Arial;color:#222;text-decoration:none}',
        '#',ROOT_ID,' .menu a:hover{background:#f5f5f5}',

        /* absolutely no horizontal scrollbars */
        '#',ROOT_ID,' .cvqf-dialog, #',ROOT_ID,' .cvqf-bd, #',ROOT_ID,' #cvqf-body{overflow-x:hidden}'
      ].join('');
      (document.head||document.documentElement).appendChild(s);
    }

    if (!document.getElementById(ROOT_ID)){
      var root = document.createElement('div'); root.id = ROOT_ID;
      root.innerHTML =
        '<div class="cvqf-scrim" data-act="close"></div>'
      + '<div class="cvqf-dialog" role="dialog" aria-modal="true">'
      +   '<header id="cvqf-title"></header>'
      +   '<div class="cvqf-bd"><div id="cvqf-body"></div></div>'
      +   '<div class="cvqf-ft">'
      +     '<div style="margin-right:auto"></div>'
      +     '<div style="position:relative">'
      +       '<button class="btn" id="cvqf-setstatus">Set Status ▾</button>'
      +       '<div class="menu" id="cvqf-setstatus-menu">'
      +         '<a href="#" data-status="on">Online</a>'
      +         '<a href="#" data-status="off">Offline</a>'
      +       '</div>'
      +     '</div>'
      +     '<button class="btn" id="cvqf-close">Close</button>'
      +     '<button class="btn primary" id="cvqf-save">Save</button>'
      +   '</div>'
      + '</div>';
      (document.body||document.documentElement).appendChild(root);

      root.addEventListener('click', function(ev){
        var t = ev.target;
        if (t.getAttribute && t.getAttribute('data-act')==='close') { $('#'+ROOT_ID).classList.remove('is-open'); }
        if (t.id==='cvqf-close' || t.id==='cvqf-save') { stopAll(ev); $('#'+ROOT_ID).classList.remove('is-open'); }
        if (t.id==='cvqf-setstatus'){ stopAll(ev); var m=$('#cvqf-setstatus-menu'); m.style.display=(m.style.display==='block'?'none':'block'); }
        if (closest(t, '#cvqf-setstatus-menu a')){
          stopAll(ev);
          var a = closest(t, 'a');
          setAllRowsStatus(a.getAttribute('data-status')==='on');
          $('#cvqf-setstatus-menu').style.display='none';
        }
      });

      document.addEventListener('click', function(ev){
        if (!(closest(ev.target, '#cvqf-setstatus') || closest(ev.target, '#cvqf-setstatus-menu'))){
          var fm = $('#cvqf-setstatus-menu'); if (fm) fm.style.display='none';
        }
        var menus = $all('#'+ROOT_ID+' .menu');
        for (var i=0;i<menus.length;i++){
          if (!(closest(ev.target, '#'+ROOT_ID+' .menu') || closest(ev.target, '#'+ROOT_ID+' button.pill'))){
            menus[i].style.display='none';
          }
        }
      });
    }
  }

  function getState(ext, queue){
  try { return (window.CVQF_STATE && window.CVQF_STATE[ext] && window.CVQF_STATE[ext][queue]) || undefined; }
  catch(_) { return undefined; }
}

  function buildRows(agent){
    var rows = [
      {num:'300', title:'Operator Queue (300)'},
      {num:'301', title:'Service Queue (301)'},
      {num:'302', title:'Sales Queue (302)'}
    ];
    if (String(agent.ext)==='202') rows.push({num:'303', title:'Finance Queue (303)'});

    var defaultOnline = !(window.CURRENT && window.CURRENT.default === 'off');


    var out = [];
    for (var i=0;i<rows.length;i++){
      var r = rows[i];
      var saved  = getState(window.CURRENT && window.CURRENT.ext, r.num);
      var online = (typeof saved !== 'undefined') ? (saved === 'on') : defaultOnline;
      var cls    = online ? 'on' : 'off';
      var label  = online ? 'Online' : 'Offline';

      out.push(
        '<tr>'
          + '<td>'+r.num+'</td>'
          + '<td>'+r.title.replace(/\s+\(\d+\)$/,"")+'</td>'
          + '<td>'
            + '<div style="position:relative;display:inline-block">'
              + '<button class="pill '+cls+'" data-p="pill"><span>'+label+'</span> <i class="caret"></i></button>'
              + '<div class="menu" data-p="menu">'
                + '<a href="#" data-status="on">Online</a>'
                + '<a href="#" data-status="off">Offline</a>'
              + '</div>'
            + '</div>'
          + '</td>'
          + '<td class="num">0</td>'
          + '<td><select data-p="priority">'
            + (function(){ var o=''; for (var j=0;j<=19;j++){ o+='<option value="'+j+'">'+j+'</option>'; } return o; })()
          + '</select></td>'
        + '</tr>'
      );
    }
    return out.join('');
  }

  function buildTable(agent){
    return ''
      + '<table class="table table-condensed table-hover">'
      +   '<thead><tr><th>Queue</th><th>Description</th><th>Status</th><th>Wrap Up Time</th><th>Priority</th></tr></thead>'
      +   '<tbody id="cvqf-tbody">'+ buildRows(agent) +'</tbody>'
      + '</table>';
  }

  function setOnePill(pill, online){
    if (!pill) return;
    pill.classList.remove(online ? 'off' : 'on');
    pill.classList.add(online ? 'on' : 'off');
    var span = pill.querySelector('span');
    if (span) span.textContent = online ? 'Online' : 'Offline';
  }
  function setAllRowsStatus(online){
    var pills = $all('#'+ROOT_ID+' #cvqf-tbody button.pill');
    for (var i=0;i<pills.length;i++) setOnePill(pills[i], online);
  }
  function wireRowMenus(root){
    var tbody = $('#cvqf-tbody', root);
    if (!tbody) return;
    tbody.addEventListener('click', function(ev){
      var pill = closest(ev.target, 'button.pill');
      if (pill){
        stopAll(ev);
        var wrap = pill.parentNode;
        var menu = wrap.querySelector('.menu');
        menu.style.display = (menu.style.display==='block' ? 'none' : 'block');
        return;
      }
      var a = closest(ev.target, '.menu a');
      if (a){
        stopAll(ev);
        var makeOn = a.getAttribute('data-status')==='on';
        var wrap2 = closest(a, 'div');
        var p = wrap2.querySelector('button.pill');
        setOnePill(p, makeOn);
        try{
          var qRow = closest(a, 'tr');
          var qNum = qRow && qRow.cells && qRow.cells[0] ? qRow.cells[0].textContent.trim() : null;
          if (qNum){
              if (!window.CVQF_STATE) window.CVQF_STATE = Object.create(null);
              if (!window.CURRENT) window.CURRENT = { ext:'', default:'on' };
              if (!window.CVQF_STATE[window.CURRENT.ext]) window.CVQF_STATE[window.CURRENT.ext] = Object.create(null);
              window.CVQF_STATE[window.CURRENT.ext][qNum] = makeOn ? 'on' : 'off';
          }
          } catch(_){}

        closest(a, '.menu').style.display='none';
      }
    });
  }

  function parseAgentFromRow(row){
    var label = ((row && row.querySelector('.cv-name'))||{}).textContent || '';
    var m = label.match(/Ext\s*(\d{2,6})\s*\((.+?)\)/i) || [];
    var ext  = (row && row.dataset && row.dataset.ext) || m[1] || '';
    var name = (m[2]||'').trim() || 'Agent';
    return { ext: ext, name: name };
  }
  
// CAPTURE: make row Status dropdown selections stick (runs before click-away)
if (!document.__cvqfRowStatusCapture) {
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('#cvqf-root .menu a');
    if (!a) return;

    // ignore footer "Set Status" menu
    if (a.closest && a.closest('#cvqf-setstatus-menu')) return;

    ev.preventDefault();
    ev.stopPropagation();

    var makeOn = a.getAttribute('data-status') === 'on';
    var menu   = a.closest('.menu');
    var pill   = menu && menu.parentNode ? menu.parentNode.querySelector('button.pill') : null;

    if (pill) {
      pill.classList.remove(makeOn ? 'off' : 'on');
      pill.classList.add(makeOn ? 'on' : 'off');
      var span = pill.querySelector('span');
      if (span) span.textContent = makeOn ? 'Online' : 'Offline';
    }
    if (menu) menu.style.display = 'none';
  }, true); // capture phase
  document.__cvqfRowStatusCapture = true;
}


  function openModal(title, html){
    ensureHost();
    $('#cvqf-title').textContent = title || '';
    $('#cvqf-body').innerHTML = html || '';
    $('#'+ROOT_ID).classList.add('is-open');
    wireRowMenus($('#'+ROOT_ID));
  }

  document.addEventListener('click', function(ev){
    var btn = closest(ev.target, '#'+PANEL_ID+' .cv-tools [data-tool="queues"]');
    if (!btn) return;
    stopAll(ev);
    var row = closest(btn, '.cv-row'); if (!row) return;
    var agent = parseAgentFromRow(row);
    
// mirror panel Online/Offline at open-time + reset per-open state
  if (typeof window.CVQF_STATE === 'undefined') window.CVQF_STATE = Object.create(null);
  if (!window.CURRENT) window.CURRENT = { ext:'', default:'on' };

  var panelOffline = !!row.classList.contains('is-offline');
  window.CURRENT.ext     = String(agent.ext || '');
  window.CURRENT.default = panelOffline ? 'off' : 'on';
  window.CVQF_STATE[window.CURRENT.ext] = Object.create(null); // clear per-open choices

    var title = 'Queues for '+agent.name+' (sip:'+agent.ext+'@'+DOMAIN+')';
    openModal(title, buildTable(agent));
  }, true);

  document.addEventListener('keydown', function(ev){
    if (ev.key!=='Enter' && ev.key!==' ') return;
    var btn = closest(ev.target, '#'+PANEL_ID+' .cv-tools [data-tool="queues"]');
    if (!btn) return;
    stopAll(ev);
    btn.click();
  }, true);
})();


// ==============================
// ==============================
// CV Active Calls Graph — fake 8am→4pm with timed peaks + HTML tooltips
// Hides the native chart inside .graphs-panel-home.rounded and draws our own.
// ==============================
(function () {
  if (window.__cvActiveGraph_v4) return;
  window.__cvActiveGraph_v4 = true;

  var MANAGER_REGEX = /\/portal\/agents\/manager(?:[\/?#]|$)/;
  var PANEL_SEL     = '.graphs-panel-home.rounded';
  var CHART_ID      = 'cv-fake-active-graph';
  var STYLE_ID      = 'cv-fake-active-graph-style';

  // ---- styles (hide native, give our host full width) ----
  function ensureStyles(doc){
    var s = doc.getElementById(STYLE_ID);
    if (!s){
      s = doc.createElement('style'); s.id = STYLE_ID;
      s.textContent =
        '#'+CHART_ID+'{display:block;width:100%;min-height:360px;}' +
        '.graphs-panel-home.rounded > *:not(#'+CHART_ID+'){display:none !important;}';
      (doc.head||doc.documentElement).appendChild(s);
    }
  }

  // ---- document helpers ----
  function getDocs(){
    var docs=[document];
    var ifrs=document.querySelectorAll('iframe');
    for (var i=0;i<ifrs.length;i++){
      try{
        var d=ifrs[i].contentDocument||(ifrs[i].contentWindow&&ifrs[i].contentWindow.document);
        if (d) docs.push(d);
      }catch(_){}
    }
    return docs;
  }
  function findPanelDoc(){
    var docs=getDocs();
    for (var i=0;i<docs.length;i++){
      var p=docs[i].querySelector(PANEL_SEL);
      if (p) return {doc:docs[i], panel:p};
    }
    return null;
  }

  // ---- wait for Google Charts already on page (no extra <script> tags) ----
  function whenGVizReady(cb){
    function ready(){
      try { return window.google && google.visualization && google.visualization.DataTable; }
      catch(_) { return false; }
    }
    function onready(){ try { cb(); } catch(_){} }
    if (ready()) return onready();
    if (window.google && google.charts && google.charts.load){
      try { google.charts.load('current', {packages:['corechart']}); } catch(_){}
      try { google.charts.setOnLoadCallback(onready); } catch(_){}
    }
    var tries=0; (function wait(){
      if (ready()) return onready();
      if (tries++ > 120) return;   // ~6s cap
      setTimeout(wait,50);
    })();
  }

  // ---- build 8:00 → 16:00 line with narrow spikes + HTML tooltip saying "All Queues: 5" ----
  function buildData(){
    var now  = new Date();
    var y=now.getFullYear(), m=now.getMonth(), d=now.getDate();
    var start=new Date(y,m,d,8,0,0,0);
    var end  =new Date(y,m,d,16,0,0,0);

    var PEAKS = [
      ['09:45',1],
      ['10:15',1],
      ['11:55',1],
      ['13:10',1],
      ['14:20',1],
      ['15:00',2],
      ['15:41',5],
      ['15:44',6],
      ['15:51',5],
      ['15:56',4],
      ['15:58',3],
      ['16:00',2]
    ];

    function parseHM(hm){
      var hh=+hm.slice(0,2), mm=+hm.slice(3,5);
      return new Date(y,m,d,hh,mm,0,0);
    }
    function fmt(dt){ return dt.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}); }
    function tip(dt){
      return '<div style="padding:6px 8px;white-space:nowrap;"><b>Today, '+fmt(dt)+'</b><br>All Queues: 5</div>';
    }

    var rows = [];
    // baseline zeros on the hour
    for (var t=new Date(start); t<=end; t=new Date(t.getTime()+60*60*1000)){
      rows.push([new Date(t), 0, null]);
    }
    // spikes as three points each (pre/mid/post) for narrow peaks
    for (var i=0;i<PEAKS.length;i++){
      var mid=parseHM(PEAKS[i][0]), val=PEAKS[i][1];
      var pre = new Date(mid.getTime()-3*60*1000);
      var post= new Date(mid.getTime()+3*60*1000);
      rows.push([pre, 0,   null]);
      rows.push([mid, val, tip(mid)]);
      rows.push([post,0,   null]);
    }
    rows.sort(function(a,b){ return a[0]-b[0]; });

    var dt = new google.visualization.DataTable();
    dt.addColumn('datetime','Time');
    dt.addColumn('number','Active Calls');
    dt.addColumn({type:'string', role:'tooltip', p:{html:true}});
    dt.addRows(rows);
    return {dt:dt, start:start, end:end};
  }

  // ---- render into the panel ----
  function drawInto(doc, panel){
    ensureStyles(doc);
    var host = doc.getElementById(CHART_ID);
    if (!host){
      host = doc.createElement('div');
      host.id = CHART_ID;
      panel.appendChild(host);
    }

    whenGVizReady(function(){
      var built = buildData();
      var chart = new google.visualization.LineChart(host);

      function redraw(){
        var box   = panel.getBoundingClientRect();
        var width = Math.max(900, Math.floor(box.width || panel.clientWidth || 900));
        var height= Math.max(360, Math.min(580, Math.floor(width * 0.50)));
        host.style.height = height + 'px';

        var opts = {
          legend: 'none',
          lineWidth: 2,
          focusTarget: 'datum',
          tooltip: { isHtml: true, trigger: 'focus' },

          // keep left ticks visible; hide bottom times + vertical gridlines
          chartArea: { left: 60, right: 20, top: 20, bottom: 16 },
          hAxis: {
            viewWindow: { min: built.start, max: built.end },
            textPosition: 'none',
            ticks: [],
            gridlines: { color: 'transparent' },
            minorGridlines: { color: 'transparent', count: 0 },
            baselineColor: 'transparent'
          },
          vAxis: {
            viewWindow: { min: 0, max: 6 },
            ticks: [0, 2, 4, 6],
            gridlines: { color: '#e9e9e9' },
            baselineColor: '#bdbdbd'
          }
        };

        chart.draw(built.dt, opts);
      }

      // initial + double-RAF to catch late layout; keep responsive
      redraw();
      requestAnimationFrame(function(){ requestAnimationFrame(redraw); });

      var win = doc.defaultView || window;
      win.addEventListener('resize', redraw);
      if ('ResizeObserver' in win) new ResizeObserver(redraw).observe(panel);
    });
  }

  // ---- inject when the manager page is active ----
  function inject(){
    var found = findPanelDoc(); if (!found) return;
    drawInto(found.doc, found.panel);
  }

  (function watch(){
    function route(prev,next){
      var was=MANAGER_REGEX.test(prev), is=MANAGER_REGEX.test(next);
      if (!was && is) inject();
    }
    var last=location.href;
    var push=history.pushState, rep=history.replaceState;
    history.pushState=function(){ var p=last; var r=push.apply(this,arguments); var n=location.href; last=n; route(p,n); return r; };
    history.replaceState=function(){ var p=last; var r=rep.apply(this,arguments);  var n=location.href; last=n; route(p,n); return r; };
    new MutationObserver(function(){ if(location.href!==last){ var p=last, n=location.href; last=n; route(p,n);} })
      .observe(document.documentElement,{childList:true,subtree:true});

    if (MANAGER_REGEX.test(location.href)) inject();
  })();
})();  /* ==== Ends The Call Center Home Page ===== */



/* ==== CV Queue Stats: robust auto-discovery injector (patched for Operator Queue modal) ===== */
(() => {
  if (window.__cvqs_auto_installed__) return;
  window.__cvqs_auto_installed__ = true;

  const LINK_CLASS = 'cvqs-poc-link';
  const STATS_TABLE_ID = '#modal_stats_table';
  const MAX_SCAN_TRIES = 20;

  const queueRepDownload = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/download-solid-full.svg';
  const queueRepListen = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/speakericon.svg';
  const queueRepCradle = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/transcript.svg';
  const queueRepNotes = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/newspaper-regular-full.svg';
  const magnifyIcon = 'https://raw.githubusercontent.com/democlarityvoice-del/clickabledemo/refs/heads/main/magnifying-glass-solid-full.svg';

  const CVQ_DATA = {
    "Operator Queue":     { VOL: 5, CO: 5, ATT: "2:26", AH: "0:10", AC: null, AWT: "1:45" },
    "Service Queue":        { VOL: 21, CO: 10, ATT: "3:14", AH: "0:00", AC: null, AWT: "2:12" },
    "Sales Queue":{ VOL: 5, CO: 5, ATT: "1:38", AH: "0:05", AC: null, AWT: "1:01" },
    "Finance Queue":          { VOL: 3, CO: 3, ATT: "2:00", AH: "0:00", AC: null, AWT: "1:33" },
  };

  const QUEUE_NAMES = Object.keys(CVQ_DATA);

  const QUEUE_NUMBERS = {
  "Operator Queue": "300",
  "Service Queue": "301",
  "Sales Queue": "302",
  "Finance Queue": "303"
 };

  // maps must exist before you assign into them
// create (or reuse) the globals safely, then alias for local use
window.CVQS_QUEUE_ROWS_BY_NUM  = window.CVQS_QUEUE_ROWS_BY_NUM  || {};
window.CVQS_QUEUE_ROWS_BY_NAME = window.CVQS_QUEUE_ROWS_BY_NAME || {};
const CVQS_QUEUE_ROWS_BY_NUM  = window.CVQS_QUEUE_ROWS_BY_NUM;
const CVQS_QUEUE_ROWS_BY_NAME = window.CVQS_QUEUE_ROWS_BY_NAME;

const keyNorm = s => (s || '').replace(/\s+/g,' ').trim().toLowerCase();


  const HEADER_TO_STAT = {
    'Call Volume': 'VOL',
    'Calls Offered': 'CO',
    'Calls Handled': 'CO',
    'Avg. Talk Time': 'ATT',
    'Average Talk Time': 'ATT',
    'Avg. Hold Time': 'AH',
    'Abandoned Calls': 'AC',
    'Avg. Wait Time': 'AWT',
    'Average Wait Time': 'AWT'
  };

  const STAT_DESCRIPTIONS = {
    VOL: 'Number of calls originating through a Call Queue.\nIncludes answered calls, abandoned calls, forwards, and voicemail.',
    CO: 'Number of calls answered by agent originating through a Call Queue.',
    AH: 'Average time a caller spends on hold with an agent.\nExcludes waiting time in the Call Queue.',
    AC: 'Number of calls that abandoned the queue before being offered to an agent.',
    AWT: 'Average number of seconds a caller spent in the selected queue before being dispatched to an agent. If none selected, total for all queues will be displayed.'
  };



// --- Sales Queue (by number: 302) ---
CVQS_QUEUE_ROWS_BY_NUM["302"] = [
  `<tr><td>Today, 1:46 pm</td><td>Tucker Jones</td><td>(989) 555-0128</td><td>248-436-3443</td><td>6:17</td><td>201</td><td>201</td><td>Cathy Thomas</td><td>1:28</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:41 pm</td><td>Liam Nguyen</td><td>(810) 555-0100</td><td>248-436-3449</td><td>5:29</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>8:06</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:37 pm</td><td>Maya Brooks</td><td>(517) 555-0126</td><td>248-436-3449</td><td>1:01</td><td>205</td><td>205</td><td>Alex Roberts</td><td>2:05</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:35 pm</td><td>Jack Burton</td><td>(517) 555-0148</td><td>(313) 995-9080</td><td>0:42</td><td>202</td><td>202</td><td>Jake Lee</td><td>7:22</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:35 pm</td><td>Sarah Patel</td><td>(248) 555-0196</td><td>248-436-3443</td><td>1:57</td><td>200</td><td>200</td><td>Mike Johnson</td><td>3:24</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`
];
CVQS_QUEUE_ROWS_BY_NAME[("Sales Queue")] = CVQS_QUEUE_ROWS_BY_NUM["302"];

// --- Finance Queue (by number: 303; change if needed) ---
CVQS_QUEUE_ROWS_BY_NUM["303"] = [
  `<tr><td>Today, 1:30 pm</td><td>Chloe Bennet</td><td>(313) 555-0120</td><td>248-436-3443</td><td>5:21</td><td>200</td><td>200</td><td>Mike Johnson</td><td>6:11</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 11:41 am</td><td>Elizabeth Li</td><td>(313) 555-8471</td><td>(313) 995-9080</td><td>1:23</td><td>201</td><td>201</td><td>Cathy Thomas</td><td>2:17</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 09:56 am</td><td>Rory Davis</td><td>(313) 555-0179</td><td>(313) 995-9080</td><td>1:01</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>8:17</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`
];
CVQS_QUEUE_ROWS_BY_NAME[("Finance Queue")] = CVQS_QUEUE_ROWS_BY_NUM["303"];

// --- Service Queue (assumed number: 301; change if needed) ---
CVQS_QUEUE_ROWS_BY_NUM["301"] = [
  `<tr><td>Today, 11:22 am</td><td>JR Knight</td><td>248-555-0144</td><td>248-436-3443</td><td>3:49</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>8:35</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 11:18 am</td><td>Sarah Patel</td><td>(248) 555-0196</td><td>(313) 995-9080</td><td>2:22</td><td>205</td><td>205</td><td>Alex Roberts</td><td>17:29</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 10:58 am</td><td>Lola Turner</td><td>517-555-0170</td><td>248-436-3449</td><td>4:47</td><td>202</td><td>202</td><td>Jake Lee</td><td>1:24</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 10:27 am</td><td>Ruby Foster</td><td>(248) 555-0102</td><td>248-436-3449</td><td>4:21</td><td>200</td><td>200</td><td>Mike Johnson</td><td>4:16</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 10:23 am</td><td>Monica Alvarez</td><td>(989) 555-0113</td><td>248-436-3443</td><td>2:49</td><td>200</td><td>200</td><td>Mike Johnson</td><td>1:52</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 09:56 am</td><td>Rory Davis</td><td>313-555-0179</td><td>(313) 995-9080</td><td>1:01</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>8:17</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 09:29 am</td><td>Tanya Roberts</td><td>313-555-3443</td><td>248-436-3443</td><td>3:47</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>0:57</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 08:42 am</td><td>Alexander Chen</td><td>(517) 555-0122</td><td>(313) 995-9080</td><td>4:24</td><td>205</td><td>205</td><td>Alex Roberts</td><td>7:42</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 08:16 am</td><td>Leif Hendricksen</td><td>517-555-0162</td><td>(313) 995-9080</td><td>8:17</td><td>200</td><td>200</td><td>Mike Johnson</td><td>2:27</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 08:08 am</td><td>Coco LaBelle</td><td>(989) 555-0672</td><td>248-436-3443</td><td>0:22</td><td>201</td><td>201</td><td>Cathy Thomas</td><td>5:55</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,

  `<tr><td>Today, 1:26 pm</td><td>Carlos Riviera</td><td>(517) 555-0177</td><td>248-436-3449</td><td>3:52</td><td>202</td><td>202</td><td>Jake Lee</td><td>1:53</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:24 pm</td><td>Martin Smith</td><td>800-909-5384</td><td>(313) 995-9080</td><td>4:11</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>4:22</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:21 pm</td><td>John Travers</td><td>810-555-0192</td><td>(313) 995-9080</td><td>2:27</td><td>203</td><td>203</td><td>Bob Andersen</td><td>9:41</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 12:06 pm</td><td>Thomas Lee</td><td>517-555-0157</td><td>248-436-3443</td><td>1:21</td><td>204</td><td>204</td><td>Brittany Lawrence</td><td>3:53</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 11:58 am</td><td>Freddie Travis</td><td>800-649-2907</td><td>(313) 995-9080</td><td>3:48</td><td>203</td><td>203</td><td>Bob Andersen</td><td>21:16</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 11:58 am</td><td>Mark Sanchez</td><td>989-555-0213</td><td>(313) 995-9080</td><td>4:29</td><td>202</td><td>202</td><td>Jake Lee</td><td>2:47</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,

  // the 5 adjusted ones (with corrected extensions)
  `<tr><td>Today, 2:28 pm</td><td>Noah James</td><td>(248) 555-0123</td><td>248-436-3442</td><td>1:13</td><td>214</td><td>210</td><td>Jessica Brown</td><td>4:02</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 2:19 pm</td><td>Camila Ortiz</td><td>(734) 555-0148</td><td>248-436-3445</td><td>0:57</td><td>209</td><td>209</td><td>Michael Williams</td><td>2:51</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 2:05 pm</td><td>Owen Patel</td><td>(586) 555-0162</td><td>(313) 995-9080</td><td>2:41</td><td>213</td><td>212</td><td>Sara Davis</td><td>6:33</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:59 pm</td><td>Harper Green</td><td>(947) 555-0179</td><td>248-436-3447</td><td>1:08</td><td>205</td><td>205</td><td>Alex Roberts</td><td>3:11</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:43 pm</td><td>Michael Chen</td><td>(313) 555-0195</td><td>248-436-3450</td><td>3:26</td><td>210</td><td>210</td><td>Jessica Brown</td><td>5:04</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`
];
CVQS_QUEUE_ROWS_BY_NAME[keyNorm("Service Queue")] = CVQS_QUEUE_ROWS_BY_NUM["301"];

  

// Your current default five rows for everyone else
const CVQS_DEFAULT_ROWS = [
  `<tr><td>Today, 2:13 pm</td><td>Ruby Foster</td><td>(248) 555-0102</td><td>248-436-3443</td><td>1:22</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>14:28</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 2:06 pm</td><td>Leo Knight</td><td>(313) 555-0106</td><td>248-436-3449</td><td>2:49</td><td>206</td><td>206</td><td>Mark Sanchez</td><td>0:59</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:58 pm</td><td>Ava Chen</td><td>(313) 555-0151</td><td>248-436-3443</td><td>1:01</td><td>205</td><td>205</td><td>Alex Roberts</td><td>5:22</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:54 pm</td><td>Zoe Miller</td><td>(248) 555-0165</td><td>(313) 995-9080</td><td>3:47</td><td>207</td><td>207</td><td>John Smith</td><td>3:16</td><td>Orig: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`,
  `<tr><td>Today, 1:50 pm</td><td>Raj Patel</td><td>(810) 555-0187</td><td>(313) 995-9080</td><td>4:24</td><td>210</td><td>210</td><td>Jessica Brown</td><td>5:51</td><td>Term: Bye</td><td>Connect</td><td class="cvqs-action-cell"></td></tr>`
];


  
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  const LOG = (...a) => console.debug('[CV-QS]', ...a);


function getRowsForQueue(queueNameOnly, queueNumber) {
  const numKey = queueNumber == null ? '' : String(queueNumber).trim();
  if (numKey && CVQS_QUEUE_ROWS_BY_NUM[numKey]) {
    return CVQS_QUEUE_ROWS_BY_NUM[numKey].join('');
  }
  // Prefer O(1) lookup if you store normalized keys:
  const nameKey = keyNorm(queueNameOnly);
  if (CVQS_QUEUE_ROWS_BY_NAME[nameKey]) {
    return CVQS_QUEUE_ROWS_BY_NAME[nameKey].join('');
  }
  // Fallback: scan if your BY_NAME keys aren’t normalized
  const hit = Object.keys(CVQS_QUEUE_ROWS_BY_NAME).find(k => keyNorm(k) === nameKey);
  return hit ? CVQS_QUEUE_ROWS_BY_NAME[hit].join('') : CVQS_DEFAULT_ROWS.join('');
}

  

  function collectDocs(root, out = []) {
    out.push(root);
    root.querySelectorAll('iframe').forEach(f => {
      try { if (f.contentDocument) collectDocs(f.contentDocument, out); } catch (_) {}
    });
    return out;
  }

  function candidateTables(doc) {
    const direct = Array.from(doc.querySelectorAll(STATS_TABLE_ID));
    if (direct.length) return direct;
    return Array.from(doc.querySelectorAll('table')).filter(t => {
      const ths = Array.from(t.querySelectorAll('thead th'));
      const labels = ths.map(th => norm(th.textContent));
      return labels.some(l => /call volume|calls handled|calls offered|wait time|talk time|abandon/i.test(l));
    });
  }

  function mapHeaders(table) {
    const ths = Array.from(table.querySelectorAll('thead th'));
    const colMap = {};
    ths.forEach((th, i) => {
      const label = norm(th.textContent);
      const code = HEADER_TO_STAT[label];
      if (code) colMap[code] = i;
    });
    let nameIdx = ths.findIndex(th => /^name$/i.test(norm(th.textContent)));
    if (nameIdx < 0) {
      const rows = Array.from(table.tBodies[0]?.rows || []).slice(0, 12);
      const counts = ths.map((_, idx) => {
        let hits = 0;
        rows.forEach(r => {
          const txt = norm(r.cells[idx]?.textContent);
          if (QUEUE_NAMES.includes(txt)) hits++;
        });
        return hits;
      });
      nameIdx = counts.indexOf(Math.max(...counts));
      if (nameIdx < 0) nameIdx = 1;
    }
    return { colMap, nameIdx };
  }

  function getStatTitle(code) {
    const titles = {
      VOL: 'Call Volume',
      CO: 'Calls Handled',
      ATT: 'Average Talk Time',
      AH: 'Average Hold Time',
      AC: 'Abandoned Calls',
      AWT: 'Average Wait Time'
    };
    return titles[code] || code;
  }

  function timeToSeconds(t) {
    const parts = t.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }


  function setSort(td, code, v) {
    const n = Number(v);
    if (!Number.isNaN(n)) { td.setAttribute('data-order', String(n)); return; }
    if (code === 'ATT' || code === 'AH' || code === 'AWT') {
      const s = timeToSeconds(v);
      if (s != null) td.setAttribute('data-order', String(s));
    }
  }

  function linkify(td, queue, code, v) {
  if (v == null) return;
  if (td.querySelector(`a.${LINK_CLASS}`)) return;

  const a = td.ownerDocument.createElement('a');
  a.href = '#';
  a.className = LINK_CLASS;
  a.textContent = String(v);
  a.style.fontWeight = 'bold';
  a.style.textDecoration = 'underline';
  a.style.cursor = 'pointer';

a.addEventListener('click', e => {
  e.preventDefault();

  const row = td.closest('tr');

  // Normalize helper already in your codebase
  const getTxt = el => (el ? norm(el.textContent) : '');

  // 1) Try to read from the clicked row's cells
  const cells = Array.from(row?.cells || []);
  const cellTexts = cells.map(c => getTxt(c));

  // Heuristics: number is a cell of only digits (3+), name matches known queues
  const numIdx  = cellTexts.findIndex(t => /^\d{3,}$/.test(t));
  const nameIdx = cellTexts.findIndex(t => QUEUE_NAMES.includes(t));

  let queueNumber   = numIdx  >= 0 ? cellTexts[numIdx]  : '';
  let queueNameOnly = nameIdx >= 0 ? cellTexts[nameIdx] : (queue || '').trim();

  // 2) If number still missing, try to parse "Name (123)" if that’s what `queue` is
  if (!queueNumber && /\(\d+\)/.test(queue || '')) {
    const m = (queue || '').match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m) {
      queueNameOnly = m[1].trim();
      queueNumber   = m[2];
    }
  }

  // 3) If number still missing, fall back to the map
  if (!queueNumber && queueNameOnly) {
    queueNumber = (QUEUE_NUMBERS && QUEUE_NUMBERS[queueNameOnly]) || '';
  }

  // Debug so you can see exactly what's happening
  console.log('[CVQS click]',
    { rowTexts: cellTexts, numIdx, nameIdx, queue, queueNameOnly, queueNumber, code });

  openQueueModal(queueNameOnly, queueNumber, code);
});
;


  td.replaceChildren(a);
  setSort(td, code, v);
}

// ==== REPLACE BOTH FUNCTIONS WITH THIS VERSION ====

function injectIcons(tr) {
  // Use the pre-allocated action cell; fallback to create if missing
  let td = tr.querySelector('td.cvqs-action-cell');
  if (!td) {
    td = document.createElement('td');
    td.className = 'cvqs-action-cell';
    tr.appendChild(td);
  }

  td.innerHTML = `
  <span role="button" tabindex="0" class="cvqs-icon-btn" aria-label="Download" title="Download" data-icon="download">
    <img src="${queueRepDownload}" alt="">
  </span>
  <span role="button" tabindex="0" class="cvqs-icon-btn" aria-label="Listen" title="Listen" data-icon="listen">
    <img src="${queueRepListen}" alt="">
  </span>
  <span role="button" tabindex="0" class="cvqs-icon-btn" aria-label="Cradle to Grave" title="Cradle to Grave" data-icon="cradle">
    <img src="${queueRepCradle}" alt="">
  </span>
  <span role="button" tabindex="0" class="cvqs-icon-btn" aria-label="Edit Notes" title="Edit Notes" data-icon="notes">
    <img src="${queueRepNotes}" alt="">
  </span>
`;

}


function openQueueModal(queueNameOnly, queueNumber, code) {
  const modal = document.createElement('div');  
  modal.id = 'cvqs-inline-modal';
  modal.style = `
    position: absolute;
    top: 0; left: 0; right: 0;
    background: white;
    padding: 20px 20px 40px 20px;
    z-index: 10;
    border: none; box-shadow: none; border-radius: 0;
    height: auto; max-height: none; min-height: 500px;
    font-family: sans-serif;
  `;
  // INSERT THESE TWO LINES
modal.style.maxHeight = 'calc(100vh - 32px)';
modal.style.overflow  = 'auto';
// ==== queueNotesPopover (anchored dropdown, unique IDs) ====
const QN_REASONS = {
  'Inbound Sales' : ['Sales Queue question', 'Follow up', 'Referral'],
  'Outbound Sales': ['Cold Call', 'Follow-up']
};

function openQueueNotesPopover(anchorEl, initial) {
  // remove any existing popover
  document.getElementById('queue-notes-popover')?.remove();

  // build container
  const pop = document.createElement('div');
  pop.id = 'queue-notes-popover';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Queue Notes');
  Object.assign(pop.style, {
    position: 'fixed',            // anchor to viewport
    top: '0px',
    left: '0px',
    width: '340px',
    maxWidth: '92vw',
    background: '#fff',
    border: '1px solid #cfd3d7',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,.18)',
    zIndex: '2147483647',         // above everything
    padding: '12px',
    visibility: 'hidden'          // position first, then show
  });

  // content (unique element IDs)
  pop.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <strong style="font-size:14px">Notes</strong>
      <button id="qn2-close" aria-label="Close" style="background:none;border:0;font-size:18px;cursor:pointer;line-height:1">&times;</button>
    </div>
    <div style="display:grid;grid-template-columns:100px 1fr;gap:10px 12px;align-items:center">
      <label for="qn2-disposition" style="justify-self:end;font-weight:600">Disposition</label>
      <select id="qn2-disposition" style="padding:6px;border:1px solid #cfd3d7;border-radius:4px;">
        <option value="">Select a Disposition</option>
        <option>Inbound Sales</option>
        <option>Outbound Sales</option>
      </select>


      <label for="qn2-reason" style="justify-self:end;font-weight:600">Reason</label>
      <select id="qn2-reason" style="padding:6px;border:1px solid #cfd3d7;border-radius:4px;">
        <option value="">Select a Disposition First</option>
      </select>

      <label for="qn2-text" style="justify-self:end;font-weight:600">Notes</label>
      <textarea id="qn2-text" rows="4" style="width:100%;padding:6px;border:1px solid #cfd3d7;border-radius:4px;resize:vertical"></textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button id="qn2-cancel" class="cv-btn">Cancel</button>
      <button id="qn2-save" style="min-width:90px;padding:6px 12px;border:0;border-radius:4px;background:#006dcc;color:#fff;font-weight:700;cursor:pointer">Save</button>
    </div>
  `;

  // add to DOM to measure
  document.body.appendChild(pop);

  // init values
  const dispSel = pop.querySelector('#qn2-disposition');
  const reasonSel = pop.querySelector('#qn2-reason');
  const txt = pop.querySelector('#qn2-text');

  function populateReasons(disp) {
    reasonSel.innerHTML = '';
    const opts = QN_REASONS[disp] || [];
    if (!opts.length) {
      reasonSel.innerHTML = '<option value="">Select a Disposition First</option>';
      return;
    }
    opts.forEach((label, i) => {
      const o = document.createElement('option');
      o.value = label;
      o.textContent = label;
      if (i === 0) o.selected = true;
      reasonSel.appendChild(o);
    });
  }

  const dispInit = (initial && initial.disposition) || 'Inbound Sales';
  dispSel.value = dispInit;
  populateReasons(dispInit);
  txt.value = (initial && initial.notes) || '';
  dispSel.onchange = () => populateReasons(dispSel.value);

 
  // position near the icon but keep it inside the queue modal bounds
const iconRect = anchorEl.getBoundingClientRect();
const modalEl  = document.getElementById('cvqs-inline-modal');
const box = modalEl
  ? modalEl.getBoundingClientRect()
  : { left: 8, top: 8, right: window.innerWidth - 8, bottom: window.innerHeight - 8 };

const gap = 8;

// measure after it's in the DOM
const rect = pop.getBoundingClientRect();
const pw = rect.width;
const ph = rect.height;

// Horizontal: prefer right of the icon; if no room, tuck to the LEFT of the icon
let left = (iconRect.right + gap + pw <= box.right)
  ? iconRect.right + gap
  : iconRect.right - pw;

// Vertical: prefer below; if no room, flip above
let top = (iconRect.bottom + gap + ph <= box.bottom)
  ? iconRect.bottom + gap
  : iconRect.top - ph - gap;

// Clamp to the modal’s box so it never bleeds out
left = Math.min(Math.max(left, box.left + gap), box.right - pw - gap);
top  = Math.min(Math.max(top,  box.top  + gap), box.bottom - ph - gap);

pop.style.left = `${left}px`;
pop.style.top  = `${top}px`;
pop.style.visibility = 'visible';


  // close helpers
  const close = () => {
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    pop.remove();
  };
  const onDocClick = (e) => {
    if (pop.contains(e.target) || anchorEl.contains(e.target)) return;
    close();
  };
  const onKeyDown = (e) => { if (e.key === 'Escape') close(); };

  document.addEventListener('click', onDocClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  // buttons
  pop.querySelector('#qn2-close').addEventListener('click', close);
  pop.querySelector('#qn2-cancel').addEventListener('click', close);
  pop.querySelector('#qn2-save').addEventListener('click', () => {
    const payload = {
      disposition: dispSel.value || '',
      reason:      reasonSel.value || '',
      notes:       txt.value || ''
    };
    console.log('[queueNotesPopover] Saved', payload);
    close();
  });
}
// ==== /queueNotesPopover ====

// ===== /continue modal =====
const rowsForQueue = getRowsForQueue(queueNameOnly, queueNumber);

  modal.innerHTML = `
    <style>      

      .cvqs-call-table {
        width: 100%;
        border-collapse: collapse;
        font-family: sans-serif;
        font-size: 13px;
        border: 1px solid #ccc;
        table-layout: auto; /* was: fixed */
      }

      /* Header cells */
      .cvqs-call-table thead th {
        background: white;
        color: #004a9b;
        text-align: left;
        padding: 6px 8px;
        border-left: 1px solid #ccc;
        border-right: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
      }

      /* Body cells */
      .cvqs-call-table tbody td {
        padding: 6px 8px;
        border-right: 1px solid #eee;
        border-left: 1px solid #eee;
        border-bottom: 1px solid #eee;
      }

      /* Action cell (real cell, not :last-child) */
      .cvqs-call-table td.cvqs-action-cell {
        white-space: nowrap;
        text-align: center;
        padding: 6px 8px;
        position: relative;
        background: inherit; /* let row hover/zebra show through */
      }

      /* Ensure the action cell also shows row hover */
      .cvqs-call-table tbody tr:hover td.cvqs-action-cell {
        background-color: #f3f3f3;
      }
      

      /* Image baseline alignment */
      .cvqs-call-table img {
        vertical-align: middle;
      }

      /* Icon buttons (Clarity-style hover-fade) */
      .cvqs-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #ffffff;
        margin: 3px;
        border: 1px solid #dcdcdc;
        overflow: hidden;
        cursor: pointer;
      }

      .cvqs-icon-btn:focus {
        outline: none;
      }

      .cvqs-icon-btn img {
        width: 14px;
        height: 14px;
        pointer-events: none;
        opacity: 0.35;
        transition: opacity 0.2s ease-in-out;
      }

      /* On hover: icon brightens, not the button */
      .cvqs-icon-btn:hover img,
      tr:hover .cvqs-icon-btn img {
        opacity: 1;
      }
    </style>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
      <button id="cvqs-back-btn" style="font-weight:bold;">Back</button>
    </div>
    <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; color: #000;">
      ${queueNameOnly} Queue (${queueNumber}) ${getStatTitle(code)}
    </h2>
    <div style="margin:10px 0;">
      <input placeholder="Search calls" style="padding:6px 8px;width:200px"> 
      <img src="${magnifyIcon}" style="width:16px;vertical-align:middle;margin-left:5px" alt="">
    </div>
    <table class="cvqs-call-table">
      <thead>
        <tr>
          <th>Call Time</th><th>Caller Name</th><th>Caller Number</th><th>DNIS</th>
          <th>Time in Queue</th><th>Agent Extension</th><th>Agent Phone</th>
          <th>Agent Name</th><th>Agent Time</th><th>Agent Release Reason</th>
          <th>Queue Release Reason</th><th></th> <!-- keep this blank TH -->
        </tr>
      </thead>
      <tbody>
        ${rowsForQueue}
      </tbody>
    </table>
  `;

  // add to DOM
  const container = document.querySelector('#modal-body-reports');
  if (container) {
    container.style.position = 'relative';
    container.appendChild(modal);
  } else {
    document.body.appendChild(modal);
  }

  insertDateRange(modal);

  // helper
function insertDateRange(modalEl) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const formatDate = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const rangeText = `${formatDate(yesterday)} 12:00 am to ${formatDate(now)} 11:59 pm`;

  const rangeDiv = document.createElement('div');
  rangeDiv.textContent = rangeText;
  rangeDiv.style.margin = '8px 0 10px 0';
  rangeDiv.style.fontSize = '13px';
  rangeDiv.style.color = '#555';

  // Scope to this modal (no global query)
  const title = modalEl.querySelector('h2');
  if (title) title.insertAdjacentElement('afterend', rangeDiv);
}

  const backBtn = modal.querySelector('#cvqs-back-btn');
  backBtn.addEventListener('click', () => {
    console.log('[CVQS] Back button clicked - closing modal');
    modal.remove(); // Cleanly removes entire modal
  });

  // inject icons into each row
  modal.querySelectorAll('tbody tr').forEach(injectIcons);

  

  //  Event delegation so Notes (and others) always work after HTML swaps
  modal.addEventListener('click', (e) => {
    const btn = e.target.closest('.cvqs-icon-btn[data-icon]');
    if (!btn || !modal.contains(btn)) return;

    const kind = btn.dataset.icon;
    if (kind === 'notes') {
      // uses your existing function defined above in this scope
      openQueueNotesPopover(btn);
      return;
    }
    if (kind === 'download') {
      // no-op or your download action
      return;
    }
    if (kind === 'listen') {
      // no-op or your listen action
      return;
    }
    if (kind === 'cradle') {
      // no-op or your cradle-to-grave action
      return;
    }
  });

  // (Optional) keyboard: make Space/Enter activate the buttons
  modal.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.cvqs-icon-btn[data-icon]')) {
      e.preventDefault();
      e.target.click();
    }
  });
}



  function injectTable(doc, table) {
    const { colMap, nameIdx } = mapHeaders(table);
    const statCodes = Object.keys(colMap);
    if (!statCodes.length) return 0;
    let wrote = 0;
    Array.from(table.tBodies[0]?.rows || []).forEach(tr => {
      const name = norm(tr.cells[nameIdx]?.textContent);
      const data = CVQ_DATA[name];
      if (!data) return;
      statCodes.forEach(code => {
        const td = tr.cells[colMap[code]];
        if (!td) return;
        const val = data[code];
        if (val == null) return;
        linkify(td, name, code, val);
        wrote++;
      });
    });
    return wrote;
  }

  function attach(doc, table) {
    const apply = () => {
      const n = injectTable(doc, table);
      if (n) LOG('wrote', n, 'cell(s) in', doc.defaultView?.location?.href || '(doc)');
    };
    let last = -1, calmMs = 600, lastChange = Date.now(), tries = 0;
    const t = doc.defaultView.setInterval(() => {
      tries++;
      const rows = table.tBodies[0]?.rows.length || 0;
      if (rows !== last) { last = rows; lastChange = Date.now(); }
      if (Date.now() - lastChange > calmMs || tries > 40) {
        doc.defaultView.clearInterval(t);
        apply();
      }
    }, 150);

    try {
      const $ = doc.defaultView.jQuery;
      if ($ && $.fn && $.fn.DataTable) {
        $(table).on('draw.dt', apply);
      }
    } catch (_) {}

    const tb = table.tBodies[0];
    if (tb) new doc.defaultView.MutationObserver(apply)
      .observe(tb, { childList: true, subtree: true });

    doc.defaultView.cvqsForce = apply;
  }

  function boot() {
    const docs = collectDocs(document);
    LOG('scanning', docs.length, 'document(s)…');
    let attached = 0;
    docs.forEach(doc => {
      const tables = candidateTables(doc);
      if (!tables.length) return;
      tables.forEach(tbl => { attach(doc, tbl); attached++; });
    });
    if (!attached) LOG('no candidate tables found (yet)');
  }

  boot();
  let tries = 0;
  const again = setInterval(() => {
    tries++;
    boot();
    if (tries >= MAX_SCAN_TRIES) clearInterval(again);
  }, 350);
})();







