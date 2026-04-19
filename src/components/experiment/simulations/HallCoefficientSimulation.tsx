<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hall Effect Simulator</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f2f5f9;color:#1a1a2e;min-height:100vh}
h1{text-align:center;padding:14px 0 4px;font-size:19px;font-weight:700;color:#0d3b6e}
.subtitle{text-align:center;font-size:11px;color:#888;margin-bottom:12px}
.wrap{display:grid;grid-template-columns:285px 1fr;gap:13px;max-width:1080px;margin:0 auto;padding:0 13px 24px}
.panel{display:flex;flex-direction:column;gap:9px}
.card{background:#fff;border:1px solid #dde3ed;border-radius:10px;padding:11px 13px}
.card-title{font-size:10px;font-weight:700;color:#999;letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px}
.src-header{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#333;margin-bottom:7px}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
select{width:100%;border:1px solid #d0d7e3;border-radius:6px;padding:5px 8px;font-size:11px;background:#fff;color:#1a1a2e;cursor:pointer}
.srow{display:flex;align-items:center;gap:6px;margin-top:6px}
.srow label{font-size:10px;color:#555;min-width:92px;line-height:1.3}
.srow input[type=range]{flex:1;accent-color:#1565c0;cursor:pointer}
.sval{font-size:11px;font-weight:700;min-width:58px;text-align:right;color:#1565c0}
.temp-sval{color:#c04828}
.gauss-row{display:flex;justify-content:space-between;align-items:center;margin-top:7px;background:#eef4ff;border-radius:6px;padding:5px 9px;border:1px solid #c5d8f8}
.gauss-row span:first-child{font-size:10px;color:#555}
.gauss-row span:last-child{font-size:12px;font-weight:700;color:#1565c0}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.mc{background:#f8fafc;border:1px solid #dde3ed;border-radius:7px;padding:7px 9px}
.mc.span2{grid-column:span 2}
.mc-lbl{font-size:9px;color:#888;margin-bottom:2px}
.mc-val{font-size:12px;font-weight:700;color:#1a1a2e;word-break:break-all}
.mc-sub{font-size:8px;color:#bbb;margin-top:2px}
.badge{display:inline-block;font-size:8px;padding:1px 4px;border-radius:3px;margin-left:3px;font-weight:700}
.badge-var{background:#e0f5ec;color:#0a6640}
.formula-box{background:#f8fafc;border:1px solid #dde3ed;border-radius:7px;padding:7px 10px;font-size:10px;color:#555;line-height:1.9;margin-top:6px}
button{width:100%;padding:6px;border:1px solid #c0cde0;border-radius:7px;background:#fff;font-size:11px;font-weight:700;color:#1565c0;cursor:pointer;transition:background .15s}
button:hover{background:#eef4ff}
.main{display:flex;flex-direction:column;gap:11px}
.vis-card{background:#fff;border:1px solid #dde3ed;border-radius:10px;overflow:hidden}
.vis-card svg{display:block;width:100%}
.explain-card{background:#fff;border:1px solid #dde3ed;border-radius:10px;padding:11px 13px}
#explain{font-size:11px;color:#444;line-height:1.8}
.temp-bar{height:6px;border-radius:3px;margin-top:4px;background:linear-gradient(to right,#1565c0,#43a047,#e53935)}
</style>
</head>
<body>
<h1>Hall Effect Simulator</h1>
<p class="subtitle">Temperature-dependent R<sub>H</sub>, μ<sub>H</sub>, and V<sub>H</sub> · Two DC sources · Lorentz force geometry</p>

<div class="wrap">
  <!-- LEFT PANEL -->
  <div class="panel">

    <div class="card">
      <div class="card-title">Material</div>
      <select id="mat" onchange="update()">
        <option value="si">Silicon — n-type</option>
        <option value="ge">Germanium — n-type</option>
        <option value="gaas">GaAs — p-type</option>
      </select>
    </div>

    <!-- Temperature control — makes RH, muH, VH all variable -->
    <div class="card">
      <div class="src-header">
        <span class="dot" style="background:#e53935"></span>
        Temperature Control
      </div>
      <div class="srow">
        <label>Temperature (K)</label>
        <input type="range" id="temp" min="200" max="600" step="5" value="300" oninput="update()">
        <span class="sval temp-sval" id="tempv">300 K</span>
      </div>
      <div class="temp-bar"></div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#aaa;margin-top:2px">
        <span>200 K (cold)</span><span>400 K (warm)</span><span>600 K (hot)</span>
      </div>
      <div style="font-size:9px;color:#888;margin-top:6px;line-height:1.6;background:#fff8f0;border-radius:5px;padding:5px 7px;border:1px solid #f5d0b0">
        Temperature changes n(T) → R<sub>H</sub> changes.<br>
        Temperature changes σ(T) → μ<sub>H</sub> changes.<br>
        All three outputs become variable.
      </div>
    </div>

    <div class="card">
      <div class="src-header">
        <span class="dot" style="background:#c04828"></span>
        DC Source 1 — Electromagnet coil
      </div>
      <div class="srow">
        <label>Coil current (A)</label>
        <input type="range" id="coilI" min="0" max="10" step="0.1" value="5" oninput="update()">
        <span class="sval" id="coilIv">5.0 A</span>
      </div>
      <div class="srow">
        <label>Coil turns N</label>
        <input type="range" id="coilN" min="100" max="2000" step="50" value="800" oninput="update()">
        <span class="sval" id="coilNv">800</span>
      </div>
      <div class="gauss-row">
        <span>Gauss meter — B field</span>
        <span id="bdisp">—</span>
      </div>
    </div>

    <div class="card">
      <div class="src-header">
        <span class="dot" style="background:#1565c0"></span>
        DC Source 2 — Semiconductor bias
      </div>
      <div class="srow">
        <label>Sample current (mA)</label>
        <input type="range" id="curr" min="1" max="100" step="1" value="20" oninput="update()">
        <span class="sval" id="currv">20 mA</span>
      </div>
      <div class="srow">
        <label>Thickness t (mm)</label>
        <input type="range" id="thick" min="0.1" max="5" step="0.1" value="1" oninput="update()">
        <span class="sval" id="thickv">1.0 mm</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">All Three Outputs — Variable</div>
      <div class="metrics">
        <div class="mc">
          <div class="mc-lbl">Hall voltage V<sub>H</sub> <span class="badge badge-var">variable</span></div>
          <div class="mc-val" id="mvh" style="color:#0a6640">—</div>
          <div class="mc-sub">changes with I, B, t, T</div>
        </div>
        <div class="mc">
          <div class="mc-lbl">Hall coeff. R<sub>H</sub> <span class="badge badge-var">variable</span></div>
          <div class="mc-val" id="mrh" style="color:#1565c0">—</div>
          <div class="mc-sub">changes with T via n(T)</div>
        </div>
        <div class="mc">
          <div class="mc-lbl">Mobility μ<sub>H</sub> <span class="badge badge-var">variable</span></div>
          <div class="mc-val" id="mmu" style="color:#6a1b9a">—</div>
          <div class="mc-sub">changes with T via σ(T)</div>
        </div>
        <div class="mc">
          <div class="mc-lbl">Carrier density n(T)</div>
          <div class="mc-val" id="mn">—</div>
          <div class="mc-sub">m⁻³ at current T</div>
        </div>
        <div class="mc span2">
          <div class="mc-lbl">Conductivity σ(T)</div>
          <div class="mc-val" id="msig">—</div>
          <div class="mc-sub">S/m at current T</div>
        </div>
      </div>
      <div class="formula-box">
        n(T) = n₀·exp[−E<sub>g</sub>/(2kT)] &nbsp;→ R<sub>H</sub>(T) = 1/(n·q)<br>
        σ(T) = σ₀·(T₀/T)<sup>3/2</sup> &nbsp;→ μ<sub>H</sub>(T) = |R<sub>H</sub>|·σ<br>
        V<sub>H</sub> = R<sub>H</sub>·I·B / t &nbsp;(all four inputs variable)
      </div>
    </div>

    <button onclick="resetAll()">↺ Reset to defaults</button>
  </div>

  <!-- RIGHT MAIN -->
  <div class="main">
    <div class="vis-card">
      <!--
        SVG viewBox 640 x 315
        Safe zones (no overlap plan):
          y=0..10   → B-field label
          y=12..34  → N pole rect
          y=34..55  → defLabel (between N pole bottom and sample top)
          y=55..235 → sample front face  (fy=55, fh=180)
          y=235..247 → accLabel (between sample bottom and S pole top)
          y=247..269 → S pole rect
          y=269..295 → X axis label
          x=0..38   → Y axis label (rotated)
          x=38..138 → V_H probes + voltmeter circle (cx=60)
          x=140..380 → sample front face (fx=140, fw=240)
          x=380..428 → sample 3D right face (dx=48)
          x=438..548 → DC source boxes (w=108)
          x=548..640 → empty margin
      -->
      <svg id="hallsvg" viewBox="0 0 640 315" xmlns="http://www.w3.org/2000/svg"></svg>
    </div>
    <div class="explain-card">
      <div class="card-title">Physics — Why Temperature Changes R<sub>H</sub> and μ<sub>H</sub></div>
      <div id="explain"></div>
    </div>
  </div>
</div>

<script>
const qe = 1.602e-19;
const k  = 1.381e-23;

// Material parameters at reference T0 = 300 K
const mats = {
  si:   { name:'Silicon',   type:'n', sign:+1,
          n0:1.5e14,  Eg:1.12*qe,  T0:300, sigma0:4.4e-4  },
  ge:   { name:'Germanium', type:'n', sign:+1,
          n0:2.4e13,  Eg:0.67*qe,  T0:300, sigma0:2.17    },
  gaas: { name:'GaAs',      type:'p', sign:-1,
          n0:9.0e13,  Eg:1.42*qe,  T0:300, sigma0:1e-6    },
};

// n(T) — intrinsic carrier concentration via Boltzmann activation
// n(T) = n0 * (T/T0)^(3/2) * exp[ Eg/(2k) * (1/T0 - 1/T) ]
function nT(m, T) {
  const factor = Math.pow(T / m.T0, 1.5) *
                 Math.exp((m.Eg / (2 * k)) * (1 / m.T0 - 1 / T));
  return m.n0 * factor;
}

// σ(T) — conductivity falls with T due to phonon scattering: σ ∝ (T0/T)^(3/2)
function sigmaT(m, T) {
  return m.sigma0 * Math.pow(m.T0 / T, 1.5);
}

function sci(v) {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  const man = (v / Math.pow(10, e)).toFixed(2);
  return man + '\u00D710' + toSup(e);
}
function toSup(n) {
  return String(n).split('').map(c =>
    ({'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'}[c] || c)
  ).join('');
}

// Deterministic pseudo-random for stable dot positions
function seededPos(seed, min, range) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return min + (s % 1000) / 1000 * range;
}

function update() {
  const mid   = document.getElementById('mat').value;
  const m     = mats[mid];
  const T     = +document.getElementById('temp').value;
  const Icoil = +document.getElementById('coilI').value;
  const Ncoil = +document.getElementById('coilN').value;
  const Isamp = +document.getElementById('curr').value / 1e3;
  const t     = +document.getElementById('thick').value / 1e3;

  document.getElementById('tempv').textContent  = T + ' K';
  document.getElementById('coilIv').textContent = Icoil.toFixed(1) + ' A';
  document.getElementById('coilNv').textContent = Ncoil;
  document.getElementById('currv').textContent  = (Isamp * 1e3).toFixed(0) + ' mA';
  document.getElementById('thickv').textContent = (t * 1e3).toFixed(1) + ' mm';

  // B from electromagnet
  const mu0 = 4 * Math.PI * 1e-7, L = 0.1;
  const B = mu0 * Ncoil * Icoil / L;
  document.getElementById('bdisp').textContent = B.toFixed(4) + ' T';

  // Temperature-dependent quantities
  const n   = nT(m, T);
  const sig = sigmaT(m, T);
  const RH  = m.sign / (n * qe);          // variable with T
  const Vh  = (RH * Isamp * B / t) * 1e3; // mV — variable with T, I, B, t
  const muH = Math.abs(RH) * sig;          // variable with T

  // Update metrics
  document.getElementById('mvh').textContent  = (Math.abs(Vh) < 10 ? Vh.toFixed(3) : Vh.toFixed(2)) + ' mV';
  document.getElementById('mrh').innerHTML    = sci(RH)  + ' m³/C';
  document.getElementById('mmu').innerHTML    = sci(muH) + ' m²/V·s';
  document.getElementById('mn').innerHTML     = sci(n)   + ' m⁻³';
  document.getElementById('msig').innerHTML   = sci(sig) + ' S/m';

  drawSVG(m, B, Isamp, t, Vh, RH, muH, n, T);

  // Explanation
  const isN     = m.type === 'n';
  const dRH     = T > m.T0 ? 'decreases' : 'increases';
  const dMu     = T > m.T0 ? 'decreases' : 'increases';
  document.getElementById('explain').innerHTML =
    `<b>Why R<sub>H</sub> varies with T:</b> ` +
    `n(T) = n₀·(T/T₀)^(3/2)·exp[E<sub>g</sub>/(2k)·(1/T₀−1/T)]. ` +
    `At T=${T} K, n = ${sci(n)} m⁻³ (${T>m.T0?'higher than':'lower than'} 300 K reference). ` +
    `Since R<sub>H</sub> = 1/(n·q), it <b>${dRH}</b> as T rises. ` +
    `<br><b>Why μ<sub>H</sub> varies with T:</b> ` +
    `Phonon scattering increases with T, reducing conductivity: σ(T) = σ₀·(T₀/T)^(3/2). ` +
    `Since μ<sub>H</sub> = |R<sub>H</sub>|·σ, it <b>${dMu}</b> with temperature. ` +
    `<br><b>Geometry:</b> I flows in +X (left→right), B in +Z (out of screen ⊙). ` +
    `Lorentz force F=q(v×B) pushes ${isN?'electrons':'holes'} in −Y → ` +
    `${isN?'e⁻':'h⁺'} accumulate on the <b>bottom face</b> (perpendicular to both I and B), ` +
    `creating V<sub>H</sub> = ${(Math.abs(Vh)<10?Vh.toFixed(3):Vh.toFixed(2))} mV.`;
}

function drawSVG(m, B, I, t, Vh, RH, muH, n, T) {
  const svg  = document.getElementById('hallsvg');
  const isN  = m.type === 'n';
  const hasB = B > 0.001;

  // Layout constants
  const fx = 140, fy = 55, fw = 240, fh = 180;
  const dx = 48,  dy = -32;

  const accCol = isN ? '#1565c0' : '#c04828';
  const defCol = isN ? '#c04828' : '#1565c0';
  const accSgn = isN ? '−' : '+';
  const defSgn = isN ? '+' : '−';

  // Temperature → colour tint on front face (cool=blue, warm=orange, hot=red)
  const tFrac  = Math.max(0, Math.min(1, (T - 200) / 400)); // 0=200K, 1=600K
  const r = Math.round(200 + tFrac * 55);
  const g = Math.round(230 - tFrac * 100);
  const b_ch = Math.round(255 - tFrac * 150);
  const faceColor = `rgb(${r},${g},${b_ch})`;

  // B dots (deterministic)
  const nBdots = hasB ? Math.min(18, Math.max(4, Math.round(B * 35))) : 0;
  let bdots = '';
  for (let i = 0; i < nBdots; i++) {
    const bx = seededPos(i * 7 + 1, fx + 16, fw - 32);
    const by = seededPos(i * 7 + 3, fy + 26, fh - 52);
    bdots +=
      `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="5" fill="none" stroke="#1565c0" stroke-width="0.8" opacity="0.3"/>` +
      `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="1.5" fill="#1565c0" opacity="0.3"/>`;
  }

  // Bulk carriers (middle zone only, away from accumulation strips)
  let bulk = '';
  for (let i = 0; i < 7; i++) {
    const bx = seededPos(i * 13 + 5, fx + 18, fw - 36);
    const by = seededPos(i * 13 + 9, fy + 30, fh - 60);
    bulk +=
      `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="5" fill="${accCol}" opacity="0.2"/>` +
      `<text font-size="9" text-anchor="middle" dominant-baseline="central" fill="${accCol}" opacity="0.4" x="${bx.toFixed(1)}" y="${by.toFixed(1)}">${accSgn}</text>`;
  }

  // Accumulated carriers — bottom strip (fy+fh-14), deficit — top strip (fy+14)
  let accCarriers = '', defCarriers = '';
  if (hasB) {
    const nAcc = Math.min(9, Math.max(4, Math.round(5 + B * 12)));
    for (let i = 0; i < nAcc; i++) {
      const px = fx + 14 + (i / (nAcc - 1)) * (fw - 28);
      accCarriers +=
        `<circle cx="${px.toFixed(1)}" cy="${fy + fh - 13}" r="6" fill="${accCol}"/>` +
        `<text font-size="10" text-anchor="middle" dominant-baseline="central" fill="white" font-weight="bold" x="${px.toFixed(1)}" y="${fy + fh - 13}">${accSgn}</text>`;
      defCarriers +=
        `<circle cx="${px.toFixed(1)}" cy="${fy + 13}" r="6" fill="none" stroke="${defCol}" stroke-width="1.5" stroke-dasharray="2.5 1.5"/>` +
        `<text font-size="10" text-anchor="middle" dominant-baseline="central" fill="${defCol}" font-weight="bold" x="${px.toFixed(1)}" y="${fy + 13}">${defSgn}</text>`;
    }
  }

  // Hall E-field arrows (vertical inside sample, clear of carrier strips)
  let eArrows = '';
  if (hasB) {
    const eXs = [fx + 52, fx + 120, fx + 188];
    for (const ax of eXs) {
      const y1 = isN ? (fy + 27) : (fy + fh - 27);
      const y2 = isN ? (fy + fh - 27) : (fy + 27);
      eArrows += `<line x1="${ax}" y1="${y1}" x2="${ax}" y2="${y2}" stroke="#2e7d32" stroke-width="1.2" marker-end="url(#arrE)" opacity="0.6"/>`;
    }
    // E_H label at right edge, vertical centre of sample
    eArrows +=
      `<text font-size="10" font-weight="700" fill="#2e7d32" x="${fx + fw - 8}" y="${fy + fh / 2}" text-anchor="end" dominant-baseline="central">E&#x1D34;</text>`;
  }

  // Lorentz force arrow (vertical dashed, centre of sample, mid-zone)
  let lorentz = '';
  if (hasB) {
    const lx  = fx + fw / 2;
    const ly1 = fy + fh / 2 - 14;
    const ly2 = fy + fh - 30;
    lorentz =
      `<line x1="${lx}" y1="${ly1}" x2="${lx}" y2="${ly2}" stroke="#7c3aed" stroke-width="1.8" stroke-dasharray="5 3" marker-end="url(#arrF)"/>` +
      `<text font-size="9" font-weight="700" fill="#7c3aed" x="${lx + 5}" y="${ly1 + (ly2 - ly1) / 2}" dominant-baseline="central" text-anchor="start">F = qv×B</text>`;
  }

  // Labels between poles and sample (no overlap)
  // defLabel: y = fy-11 = 44 (between N-pole bottom 34 and sample top 55)
  // accLabel: y = fy+fh+12 = 247 (between sample bottom 235 and S-pole top 247)
  const defLabel = hasB
    ? `<text font-size="10" font-weight="700" fill="${defCol}" x="${fx + fw / 2}" y="${fy - 11}" text-anchor="middle">${isN ? 'h⁺ deficit' : 'e⁻ deficit'} — ${defSgn} face (+Y)</text>`
    : '';
  const accLabel = hasB
    ? `<text font-size="10" font-weight="700" fill="${accCol}" x="${fx + fw / 2}" y="${fy + fh + 12}" text-anchor="middle">${isN ? 'e⁻ accumulate' : 'h⁺ accumulate'} — ${accSgn} face (−Y)</text>`
    : '';

  // VH probes (left side), voltmeter circle at cx=60
  const vy_top = fy + 14, vy_bot = fy + fh - 14, vmid = (vy_top + vy_bot) / 2;
  const vhProbes =
    `<line x1="${fx - 3}" y1="${vy_top}" x2="${fx - 20}" y2="${vy_top}" stroke="#2e7d32" stroke-width="1" stroke-dasharray="3 2"/>` +
    `<line x1="${fx - 3}" y1="${vy_bot}" x2="${fx - 20}" y2="${vy_bot}" stroke="#2e7d32" stroke-width="1" stroke-dasharray="3 2"/>` +
    `<line x1="${fx - 20}" y1="${vy_top}" x2="${fx - 20}" y2="${vy_bot}" stroke="#2e7d32" stroke-width="1"/>` +
    `<circle cx="60" cy="${vmid}" r="16" fill="#fff" stroke="#2e7d32" stroke-width="1.3"/>` +
    `<text font-size="10" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#2e7d32" x="60" y="${vmid}">V</text>` +
    `<text font-size="9" font-weight="700" fill="#2e7d32" x="60" y="${vmid + 24}" text-anchor="middle">${Vh >= 0 ? '+' : ''}${(Math.abs(Vh) < 10 ? Vh.toFixed(2) : Vh.toFixed(1))} mV</text>` +
    `<line x1="76" y1="${vy_top}" x2="${fx - 20}" y2="${vy_top}" stroke="#2e7d32" stroke-width="1"/>` +
    `<line x1="76" y1="${vy_bot}" x2="${fx - 20}" y2="${vy_bot}" stroke="#2e7d32" stroke-width="1"/>`;

  // DC source boxes (right of 3-D sample)
  const dcX = fx + fw + dx + 10; // = 438
  const dcY1 = fy + dy + 5;      // top box y
  const dcY2 = dcY1 + 46;        // bottom box y

  // Temperature indicator on sample — show T value as coloured tag inside top-right of front face
  const tTag =
    `<rect x="${fx + fw - 68}" y="${fy + 6}" width="62" height="18" rx="4" fill="${T < 350 ? '#e3f2fd' : T < 450 ? '#fff3e0' : '#ffebee'}" stroke="${T < 350 ? '#1565c0' : T < 450 ? '#ef6c00' : '#c62828'}" stroke-width="0.8"/>` +
    `<text font-size="9" font-weight="700" fill="${T < 350 ? '#1565c0' : T < 450 ? '#ef6c00' : '#c62828'}" x="${fx + fw - 37}" y="${fy + 17}" text-anchor="middle">T = ${T} K</text>`;

  // B-field label (top, y=9)
  const bLabel = hasB
    ? `<text font-size="9" font-weight="700" fill="#1565c0" x="${fx + fw / 2}" y="9" text-anchor="middle">B = ${B.toFixed(3)} T  (⊙ out of screen, +Z)</text>`
    : `<text font-size="9" fill="#aaa" x="${fx + fw / 2}" y="9" text-anchor="middle">B = 0  — increase coil current to apply field</text>`;

  // Current label and arrows
  const Istr = (I * 1e3).toFixed(0);
  const iy   = fy + fh / 2 + 4;
  const currLeft =
    `<text font-size="9" font-weight="700" fill="#c04828" x="90" y="${iy - 10}" text-anchor="middle">I = ${Istr} mA</text>` +
    `<line x1="38" y1="${iy}" x2="${fx - 3}" y2="${iy}" stroke="#c04828" stroke-width="1.8" marker-end="url(#arrI)"/>`;
  const currRight =
    `<line x1="${fx + fw + 2}" y1="${iy}" x2="${fx + fw + 28}" y2="${iy}" stroke="#c04828" stroke-width="1.8" marker-end="url(#arrI)"/>`;

  // Axis labels
  const axisX = `<text font-size="9" fill="#999" x="${fx + fw / 2}" y="300" text-anchor="middle">→ X: current direction (I)</text>`;
  const axisY = `<text font-size="9" fill="#999" x="12" y="${fy + fh / 2}" text-anchor="middle" transform="rotate(-90 12 ${fy + fh / 2})">↑ Y: Hall direction</text>`;

  svg.innerHTML = `
<defs>
  <marker id="arrI" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
    <path d="M2 1L8 5L2 9" fill="none" stroke="#c04828" stroke-width="1.5" stroke-linecap="round"/>
  </marker>
  <marker id="arrE" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
    <path d="M2 1L8 5L2 9" fill="none" stroke="#2e7d32" stroke-width="1.5" stroke-linecap="round"/>
  </marker>
  <marker id="arrF" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
    <path d="M2 1L8 5L2 9" fill="none" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round"/>
  </marker>
</defs>

${bLabel}

<!-- N pole -->
<rect x="${fx}" y="12" width="${fw}" height="22" rx="4" fill="#e8f0fe" stroke="#1565c0" stroke-width="0.8"/>
<text font-size="9" font-weight="700" fill="#1565c0" x="${fx + fw / 2}" y="27" text-anchor="middle">N pole — magnetic field source</text>

<!-- Deficit label (between N pole bottom y=34 and sample top y=55) -->
${defLabel}

<!-- 3-D right face -->
<polygon points="${fx+fw},${fy} ${fx+fw+dx},${fy+dy} ${fx+fw+dx},${fy+fh+dy} ${fx+fw},${fy+fh}"
  fill="#c8ddf0" stroke="#1565c0" stroke-width="0.8"/>
<!-- 3-D top face -->
<polygon points="${fx},${fy} ${fx+dx},${fy+dy} ${fx+fw+dx},${fy+dy} ${fx+fw},${fy}"
  fill="#dce9f5" stroke="#1565c0" stroke-width="0.8"/>
<!-- Front face (temperature-tinted) -->
<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${faceColor}" stroke="#1565c0" stroke-width="1.4" opacity="0.85"/>

<!-- Temperature tag -->
${tTag}

<!-- B dots -->
${bdots}

<!-- Bulk carriers -->
${bulk}

<!-- Accumulated charges (bottom, −Y face) -->
${accCarriers}

<!-- Deficit (top, +Y face) -->
${defCarriers}

<!-- Hall E-field arrows -->
${eArrows}

<!-- Lorentz force arrow -->
${lorentz}

<!-- Accumulate label (between sample bottom y=235 and S-pole top y=247) -->
${accLabel}

<!-- S pole -->
<rect x="${fx}" y="${fy+fh+22}" width="${fw}" height="22" rx="4" fill="#fce8e6" stroke="#c62828" stroke-width="0.8"/>
<text font-size="9" font-weight="700" fill="#c62828" x="${fx+fw/2}" y="${fy+fh+37}" text-anchor="middle">S pole</text>

<!-- V_H probes -->
${vhProbes}

<!-- Current arrows -->
${currLeft}
${currRight}

<!-- DC Source 1 box -->
<rect x="${dcX}" y="${dcY1}" width="108" height="34" rx="5" fill="#fff8f5" stroke="#c04828" stroke-width="1"/>
<text font-size="9" font-weight="700" fill="#c04828" x="${dcX+54}" y="${dcY1+13}" text-anchor="middle">DC Source 1</text>
<text font-size="8" fill="#c04828" x="${dcX+54}" y="${dcY1+27}" text-anchor="middle">Electromagnet</text>

<!-- DC Source 2 box -->
<rect x="${dcX}" y="${dcY2}" width="108" height="34" rx="5" fill="#f0f5ff" stroke="#1565c0" stroke-width="1"/>
<text font-size="9" font-weight="700" fill="#1565c0" x="${dcX+54}" y="${dcY2+13}" text-anchor="middle">DC Source 2</text>
<text font-size="8" fill="#1565c0" x="${dcX+54}" y="${dcY2+27}" text-anchor="middle">Sample bias</text>

<!-- Axis labels -->
${axisX}
${axisY}
`;
}

function resetAll() {
  document.getElementById('mat').value   = 'si';
  document.getElementById('temp').value  = 300;
  document.getElementById('coilI').value = 5;
  document.getElementById('coilN').value = 800;
  document.getElementById('curr').value  = 20;
  document.getElementById('thick').value = 1;
  update();
}

window.addEventListener('load', update);
</script>
</body>
</html>
