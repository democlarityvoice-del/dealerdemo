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
