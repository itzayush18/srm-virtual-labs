import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Material database ────────────────────────────────────────────────────────
const MATERIALS = {
  si: {
    name: 'Silicon',
    label: 'Silicon (n-type)',
    type: 'n',
    rh: +0.0038,      // m³/C  (Hall coefficient)
    sigma: 4.4e-4,    // S/m   (electrical conductivity)
    n: 1.5e14,        // m⁻³   (intrinsic carrier density)
  },
  ge: {
    name: 'Germanium',
    label: 'Germanium (n-type)',
    type: 'n',
    rh: +0.0093,
    sigma: 2.17,
    n: 2.4e13,
  },
  gaas: {
    name: 'GaAs',
    label: 'GaAs (p-type)',
    type: 'p',
    rh: -0.0056,
    sigma: 1e-6,
    n: 9.0e13,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSup(n) {
  return String(n)
    .split('')
    .map(
      (c) =>
        ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }[c] || c)
    )
    .join('');
}

function fmtSci(v, unit = '') {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = (v / Math.pow(10, e)).toFixed(2);
  return `${m}×10${toSup(e)}${unit ? ' ' + unit : ''}`;
}

function fmtVh(v) {
  return Math.abs(v) < 10 ? v.toFixed(3) + ' mV' : v.toFixed(1) + ' mV';
}

// Solenoid B field: B = μ₀ × N × I / L  (L = 10 cm assumed)
const MU0 = 4 * Math.PI * 1e-7;
const SOLENOID_L = 0.1; // metres

function calcB(coilI, coilN) {
  return (MU0 * coilN * coilI) / SOLENOID_L;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Labeled slider row */
function SliderRow({ label, id, min, max, step, value, onChange, display }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 11, color: 'var(--color-text-secondary)', minWidth: 84 }}
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--color-text-info)', height: 3 }}
      />
      <span style={{ fontSize: 11, fontWeight: 500, minWidth: 52, textAlign: 'right' }}>
        {display}
      </span>
    </div>
  );
}

/** Metric card */
function MetricCard({ label, value, sub, span }) {
  return (
    <div
      style={{
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 8,
        padding: '8px 10px',
        gridColumn: span ? 'span 2' : undefined,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

/** DC Source card */
function SourceCard({ color, title, subtitle, children }) {
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: `0.5px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span
          style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Hall Effect SVG Visualization ───────────────────────────────────────────
function HallViz({ mat, B, I_mA, Vh }) {
  const isN = mat.type === 'n';
  const hasField = B > 0.001;
  const I = I_mA / 1e3;

  // Accumulated carrier side:
  // For n-type: electrons deflect in one direction, accumulate on one edge
  // For p-type: holes deflect opposite. Sign of Vh tells us which side.
  const accumTop = (isN && Vh > 0) || (!isN && Vh < 0);

  // Seeded pseudo-random for stable layout
  function seededRnd(seed) {
    let x = Math.sin(seed + 1) * 43758.5453123;
    return x - Math.floor(x);
  }

  const nEdge = 10, nBulk = 8;
  const edgeCarriers = Array.from({ length: nEdge }, (_, i) => {
    const px = 182 + seededRnd(i * 7) * 130;
    const py = accumTop ? 78 + seededRnd(i * 3) * 13 : 126 + seededRnd(i * 5) * 13;
    return { px, py };
  });
  const bulkCarriers = Array.from({ length: nBulk }, (_, i) => ({
    px: 185 + seededRnd(i * 11) * 125,
    py: 96 + seededRnd(i * 13) * 22,
  }));

  const carrierColor = isN ? '#185fa5' : '#D85A30';
  const carrierSign = isN ? '−' : '+';
  const deficitSign = isN ? '+' : '−';
  const deficitColor = isN ? '#D85A30' : '#185fa5';

  const oppEdgeY = accumTop ? 131 : 73;

  return (
    <svg width="100%" viewBox="0 0 430 218" style={{ display: 'block' }}>
      <defs>
        <marker id="arrI" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#D05538" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arrB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#185fa5" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arrV" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arrC" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke={carrierColor} strokeWidth="1.5" strokeLinecap="round" />
        </marker>
      </defs>

      {/* ── DC Source 1 — Electromagnet ── */}
      <rect x="6" y="38" width="60" height="40" rx="5" fill="none" stroke="#D05538" strokeWidth="1" />
      <text fontSize="8" fontWeight="500" fill="#D05538" x="36" y="54" textAnchor="middle">DC Src 1</text>
      <text fontSize="7" fill="#D05538" x="36" y="66" textAnchor="middle">Electromagnet</text>
      <line x1="66" y1="57" x2="124" y2="57" stroke="#D05538" strokeWidth="1" strokeDasharray="3 2" />

      {/* ── DC Source 2 — Semiconductor ── */}
      <rect x="6" y="90" width="60" height="40" rx="5" fill="none" stroke="#185fa5" strokeWidth="1" />
      <text fontSize="8" fontWeight="500" fill="#185fa5" x="36" y="106" textAnchor="middle">DC Src 2</text>
      <text fontSize="7" fill="#185fa5" x="36" y="118" textAnchor="middle">Sample bias</text>
      <line x1="66" y1="107" x2="118" y2="107" stroke="#D05538" strokeWidth="1.5" markerEnd="url(#arrI)" />

      {/* ── Electromagnet coil (top) ── */}
      <rect x="124" y="38" width="162" height="18" rx="4" fill="none" stroke="#185fa5" strokeWidth="1" strokeDasharray="4 2" />
      <text fontSize="7" fill="#185fa5" x="205" y="50" textAnchor="middle">N pole</text>

      {/* ── B field arrows (into sample) ── */}
      {hasField &&
        [0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={148 + i * 32}
            y1={56}
            x2={148 + i * 32}
            y2={72}
            stroke="#185fa5"
            strokeWidth={1}
            opacity={0.55}
            markerEnd="url(#arrB)"
          />
        ))}
      {!hasField && (
        <text fontSize="7" fill="#185fa5" opacity={0.4} x="205" y="66" textAnchor="middle">
          B = 0 (no deflection)
        </text>
      )}

      {/* ── Semiconductor sample ── */}
      <rect x="118" y="74" width="162" height="66" rx="7"
        fill="#E6F1FB"
        stroke="#185fa5"
        strokeWidth={1.4}
      />
      <text fontSize="9" fontWeight="500" fill="#185fa5" x="199" y="89" textAnchor="middle">
        {mat.name} ({mat.type}-type)
      </text>

      {/* Bulk carriers (always shown, reduced when field present) */}
      {bulkCarriers.map((c, i) => (
        <g key={i}>
          <circle cx={c.px} cy={c.py} r={3.2}
            fill={carrierColor}
            opacity={hasField ? 0.3 : 0.7}
          />
          <text fontSize="7" textAnchor="middle" dominantBaseline="central"
            fill="white" opacity={hasField ? 0.5 : 1}
            x={c.px} y={c.py}>
            {carrierSign}
          </text>
        </g>
      ))}

      {/* Edge-accumulated carriers (shown when field is on) */}
      {hasField &&
        edgeCarriers.map((c, i) => (
          <g key={i}>
            <circle cx={c.px} cy={c.py} r={3.5} fill={carrierColor} opacity={0.9} />
            <text fontSize="8" textAnchor="middle" dominantBaseline="central" fill="white" x={c.px} y={c.py}>
              {carrierSign}
            </text>
          </g>
        ))}

      {/* Deficit symbols on opposite edge */}
      {hasField &&
        [0, 1, 2, 3].map((i) => (
          <text
            key={i}
            fontSize="9"
            textAnchor="middle"
            dominantBaseline="central"
            fill={deficitColor}
            opacity={0.6}
            x={152 + i * 36}
            y={oppEdgeY}
          >
            {deficitSign}
          </text>
        ))}

      {/* Lorentz force arrows on carriers (edge side) */}
      {hasField &&
        [0, 1, 2].map((i) => {
          const px = 160 + i * 40;
          const dy = accumTop ? -1 : 1;
          const y1 = accumTop ? 100 : 100;
          const y2 = accumTop ? 82 : 130;
          return (
            <line
              key={i}
              x1={px} y1={y1} x2={px} y2={y2}
              stroke={carrierColor}
              strokeWidth={1.2}
              opacity={0.45}
              markerEnd="url(#arrC)"
            />
          );
        })}

      {/* ── Current flow ── */}
      <line x1={118} y1={107} x2={74} y2={107} stroke="#D05538" strokeWidth={1} opacity={0.3} />
      <line x1={280} y1={107} x2={330} y2={107} stroke="#D05538" strokeWidth={1.5} markerEnd="url(#arrI)" />
      <text fontSize="7" fill="#D05538" x={305} y={102} textAnchor="middle">I={I_mA}mA</text>

      {/* ── Electromagnet coil (bottom) ── */}
      <rect x="124" y="140" width="162" height="18" rx="4" fill="none" stroke="#185fa5" strokeWidth={1} strokeDasharray="4 2" />
      <text fontSize="7" fill="#185fa5" x="205" y="152" textAnchor="middle">S pole</text>

      {/* ── Hall voltage probes ── */}
      <line x1={205} y1={74} x2={205} y2={55} stroke="#0F6E56" strokeWidth={1} strokeDasharray="3 2" />
      <line x1={205} y1={140} x2={205} y2={158} stroke="#0F6E56" strokeWidth={1} strokeDasharray="3 2" />
      <circle cx={205} cy={55} r={3} fill="#0F6E56" />
      <circle cx={205} cy={158} r={3} fill="#0F6E56" />

      {/* VH wire to right side */}
      <line x1={205} y1={55} x2={370} y2={55} stroke="#0F6E56" strokeWidth={0.8} strokeDasharray="3 2" />
      <line x1={205} y1={158} x2={370} y2={158} stroke="#0F6E56" strokeWidth={0.8} strokeDasharray="3 2" />

      {/* Voltmeter box */}
      <rect x="340" y="90" width="80" height="32" rx="5" fill="none" stroke="#0F6E56" strokeWidth={1} />
      <text fontSize="8" fontWeight="500" fill="#0F6E56" x="380" y="104" textAnchor="middle">Voltmeter</text>
      <text fontSize="9" fontWeight="500" fill="#0F6E56" x="380" y="117" textAnchor="middle">
        {fmtVh(Vh)}
      </text>
      <line x1={370} y1={90} x2={370} y2={55} stroke="#0F6E56" strokeWidth={0.8} strokeDasharray="3 2" />
      <line x1={370} y1={122} x2={370} y2={158} stroke="#0F6E56" strokeWidth={0.8} strokeDasharray="3 2" />

      {/* ── Gauss meter ── */}
      <rect x="340" y="34" width="80" height="30" rx="5" fill="none" stroke="#185fa5" strokeWidth={1} />
      <text fontSize="8" fontWeight="500" fill="#185fa5" x="380" y="47" textAnchor="middle">Gauss meter</text>
      <text fontSize="9" fontWeight="500" fill="#185fa5" x="380" y="59" textAnchor="middle">
        {B.toFixed(4)} T
      </text>

      {/* ── Labels: accumulation ── */}
      {hasField && (
        <>
          <text fontSize="7" fill={carrierColor} x="282" y={accumTop ? 80 : 138} textAnchor="start">
            ← {carrierSign} accumulate (Lorentz force)
          </text>
          <text fontSize="7" fill={deficitColor} x="282" y={accumTop ? 136 : 80} textAnchor="start">
            ← {deficitSign} deficit
          </text>
        </>
      )}

      {/* B field label */}
      <text fontSize="7" fill="#185fa5" x="126" y="35" textAnchor="start">
        B = {B.toFixed(4)} T ↓ (into sample)
      </text>
    </svg>
  );
}

// ─── Chart (canvas) ───────────────────────────────────────────────────────────
function HallChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = 140;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textC = dark ? '#c2c0b6' : '#3d3d3a';
    const gridC = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

    ctx.clearRect(0, 0, W, H);

    if (data.length < 2) {
      ctx.fillStyle = textC;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Vary coil current or turns to collect data points', W / 2, H / 2);
      return;
    }

    const pad = { l: 50, r: 16, t: 10, b: 26 };
    const xs = data.map((p) => p.x);
    const ys = data.map((p) => p.y);
    const xmin = Math.min(...xs), xmax = Math.max(...xs) || 0.01;
    const ymin = Math.min(...ys, 0), ymax = Math.max(...ys, 0);
    const xr = xmax - xmin || 0.01;
    const yr = ymax - ymin || 1;
    const toX = (x) => pad.l + ((x - xmin) / xr) * (W - pad.l - pad.r);
    const toY = (y) => pad.t + ((ymax - y) / yr) * (H - pad.t - pad.b);

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = ymin + (yr * i) / 4;
      const cy = toY(y);
      ctx.strokeStyle = gridC;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, cy);
      ctx.lineTo(W - pad.r, cy);
      ctx.stroke();
      ctx.fillStyle = textC;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(y.toFixed(2), pad.l - 4, cy + 3);
    }

    // Axis labels
    ctx.fillStyle = textC;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('B (T)', toX((xmin + xmax) / 2), H - 4);
    ctx.save();
    ctx.translate(11, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('VH (mV)', 0, 0);
    ctx.restore();

    // Line
    ctx.strokeStyle = '#185fa5';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((p, i) => {
      i === 0 ? ctx.moveTo(toX(p.x), toY(p.y)) : ctx.lineTo(toX(p.x), toY(p.y));
    });
    ctx.stroke();

    // Dots
    data.forEach((p) => {
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#185fa5';
      ctx.fill();
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%' }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const HallCoefficientSimulation = () => {
  const [matKey, setMatKey] = useState('si');
  const [coilI, setCoilI] = useState(5);       // A
  const [coilN, setCoilN] = useState(800);     // turns
  const [I_mA, setI_mA] = useState(10);        // mA
  const [thickness, setThickness] = useState(1); // mm
  const [chartPts, setChartPts] = useState([]);

  const mat = MATERIALS[matKey];
  const B = calcB(coilI, coilN);
  const I = I_mA / 1e3;
  const t = thickness / 1e3;

  // VH = (RH × I × B) / t  [V] → convert to mV
  const Vh = (mat.rh * I * B) / t * 1e3;

  // Hall mobility: μH = |RH| × σ  [m²/V·s]
  const muH = Math.abs(mat.rh) * mat.sigma;

  // Collect chart points keyed by B
  useEffect(() => {
    const Bkey = parseFloat(B.toFixed(5));
    setChartPts((prev) => {
      const idx = prev.findIndex((p) => Math.abs(p.x - Bkey) < 0.00005);
      const pt = { x: Bkey, y: parseFloat(Vh.toFixed(4)) };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = pt;
        return next;
      }
      return [...prev, pt].sort((a, b) => a.x - b.x);
    });
  }, [B, Vh]);

  const resetAll = () => {
    setMatKey('si');
    setCoilI(5);
    setCoilN(800);
    setI_mA(10);
    setThickness(1);
    setChartPts([]);
  };

  const exportCSV = () => {
    const rows = [['B (T)', 'VH (mV)'], ...chartPts.map((p) => [p.x, p.y.toFixed(4)])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hall_effect.csv';
    a.click();
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '264px 1fr',
        gap: 0,
        minHeight: 620,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{
          background: 'var(--color-background-secondary)',
          borderRight: '0.5px solid var(--color-border-tertiary)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Material */}
        <div>
          <div style={sectionLabel}>Material</div>
          <select
            value={matKey}
            onChange={(e) => setMatKey(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 6,
              padding: '5px 8px',
              fontSize: 12,
              color: 'var(--color-text-primary)',
            }}
          >
            {Object.entries(MATERIALS).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* DC Source 1 — Electromagnet */}
        <SourceCard color="#D05538" title="DC Source 1 — Electromagnet coil">
          <SliderRow
            label="Coil current"
            id="coilI"
            min={0} max={10} step={0.5}
            value={coilI}
            onChange={setCoilI}
            display={coilI.toFixed(1) + ' A'}
          />
          <SliderRow
            label="Coil turns"
            id="coilN"
            min={100} max={2000} step={100}
            value={coilN}
            onChange={setCoilN}
            display={coilN}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              background: 'var(--color-background-tertiary)',
              borderRadius: 6,
              padding: '5px 8px',
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Gauss meter (B)</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-info)' }}>
              {B.toFixed(4)} T
            </span>
          </div>
        </SourceCard>

        {/* DC Source 2 — Sample bias */}
        <SourceCard color="#185fa5" title="DC Source 2 — Semiconductor bias">
          <SliderRow
            label="Sample current"
            id="sampleI"
            min={1} max={50} step={1}
            value={I_mA}
            onChange={setI_mA}
            display={I_mA + ' mA'}
          />
          <SliderRow
            label="Thickness"
            id="thick"
            min={0.1} max={5} step={0.1}
            value={thickness}
            onChange={setThickness}
            display={parseFloat(thickness).toFixed(1) + ' mm'}
          />
        </SourceCard>

        {/* Computed metrics */}
        <div>
          <div style={sectionLabel}>Measurements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <MetricCard label="Hall voltage" value={fmtVh(Vh)} />
            <MetricCard label="Carrier type" value={mat.type === 'n' ? 'n-type' : 'p-type'} />
            <MetricCard
              label="Hall coeff. RH"
              value={fmtSci(mat.rh, 'm³/C')}
            />
            <MetricCard
              label="Carrier density"
              value={fmtSci(mat.n, 'm⁻³')}
            />
            <MetricCard
              label="Hall mobility μH"
              value={fmtSci(muH, 'm²/V·s')}
              sub={`μH = |RH| × σ  (σ = ${mat.sigma.toExponential(2)} S/m)`}
              span
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={resetAll}
            style={{
              flex: 1,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            Reset
          </button>
          <button
            onClick={exportCSV}
            style={{
              flex: 1,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Hall effect visualization */}
        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <HallViz mat={mat} B={B} I_mA={I_mA} Vh={Vh} />
        </div>

        {/* Chart */}
        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 10,
            padding: 12,
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              VH vs magnetic field B
            </span>
            <button
              onClick={() => setChartPts([])}
              style={{
                background: 'none',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 5,
                padding: '3px 8px',
                fontSize: 10,
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              Clear
            </button>
          </div>
          <HallChart data={chartPts} />
          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
            Formula: V<sub>H</sub> = R<sub>H</sub> · I · B / t &nbsp;|&nbsp;
            μ<sub>H</sub> = |R<sub>H</sub>| · σ &nbsp;|&nbsp;
            B = μ₀ · N · I<sub>coil</sub> / L (solenoid, L = 10 cm)
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallCoefficientSimulation;
