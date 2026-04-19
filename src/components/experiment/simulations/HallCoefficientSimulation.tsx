import React, { useEffect, useRef, useState } from 'react';

const MATERIALS = {
  si: {
    name: 'Silicon',
    label: 'Silicon (n-type)',
    type: 'n',
    baseCarrierDensity: 1.64e21,
    baseMobility: 0.135,
    densityTempExponent: 1.55,
    mobilityTempExponent: -2.2,
  },
  ge: {
    name: 'Germanium',
    label: 'Germanium (n-type)',
    type: 'n',
    baseCarrierDensity: 6.72e20,
    baseMobility: 0.39,
    densityTempExponent: 1.75,
    mobilityTempExponent: -1.8,
  },
  gaas: {
    name: 'GaAs',
    label: 'GaAs (p-type)',
    type: 'p',
    baseCarrierDensity: 1.12e21,
    baseMobility: 0.04,
    densityTempExponent: 1.4,
    mobilityTempExponent: -1.35,
  },
};

const MU0 = 4 * Math.PI * 1e-7;
const SOLENOID_L = 0.1;
const E_CHARGE = 1.602176634e-19;

function toSup(n) {
  return String(n)
    .split('')
    .map(
      (c) =>
        ({
          '0': '⁰',
          '1': '¹',
          '2': '²',
          '3': '³',
          '4': '⁴',
          '5': '⁵',
          '6': '⁶',
          '7': '⁷',
          '8': '⁸',
          '9': '⁹',
          '-': '⁻',
        }[c] || c)
    )
    .join('');
}

function fmtSci(v, unit = '') {
  if (!Number.isFinite(v)) return '--';
  if (v === 0) return `0${unit ? ` ${unit}` : ''}`;
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = (v / Math.pow(10, e)).toFixed(2);
  return `${m}×10${toSup(e)}${unit ? ` ${unit}` : ''}`;
}

function fmtVh(v) {
  if (!Number.isFinite(v)) return '--';
  return `${v.toFixed(Math.abs(v) < 10 ? 3 : 1)} mV`;
}

function calcB(coilI, coilN) {
  return (MU0 * coilN * coilI) / SOLENOID_L;
}

function calcHallCoefficient(material) {
  const sign = material.type === 'n' ? 1 : -1;
  return sign / (E_CHARGE * material.carrierDensity);
}

function calcConductivity(material) {
  return E_CHARGE * material.carrierDensity * material.mobility;
}

function calcMaterialState(material, temperatureK) {
  const tempRatio = temperatureK / 300;
  const carrierDensity = material.baseCarrierDensity * Math.pow(tempRatio, material.densityTempExponent);
  const mobility = material.baseMobility * Math.pow(tempRatio, material.mobilityTempExponent);
  return {
    carrierDensity,
    mobility,
    rh: calcHallCoefficient({ ...material, carrierDensity }),
    sigma: calcConductivity({ ...material, carrierDensity, mobility }),
  };
}

function fmtDensityWithAltUnit(v) {
  const perCm3 = v / 1e6;
  return `${fmtSci(perCm3, 'cm⁻³')} (${fmtSci(v, 'm⁻³')})`;
}

function SliderRow({ label, id, min, max, step, value, onChange, display }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '92px minmax(0, 1fr) 68px',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
      }}
    >
      <label
        htmlFor={id}
        style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.25 }}
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
        style={{ width: '100%', accentColor: 'var(--color-text-info)', height: 3 }}
      />
      <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
        {display}
      </span>
    </div>
  );
}

function MetricCard({ label, value, sub, span }) {
  return (
    <div
      style={{
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 8,
        padding: '10px 11px',
        gridColumn: span ? 'span 2' : undefined,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{value}</div>
      {sub ? (
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4, lineHeight: 1.35 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

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
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
      </div>
      {subtitle ? (
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{subtitle}</div>
      ) : null}
      {children}
    </div>
  );
}

function HallViz({ mat, B, Vh }) {
  const isN = mat.type === 'n';
  const hasField = B > 0.001;
  const accumTop = (isN && Vh > 0) || (!isN && Vh < 0);

  function seededRnd(seed) {
    const x = Math.sin(seed + 1) * 43758.5453123;
    return x - Math.floor(x);
  }

  const edgeCarriers = Array.from({ length: 10 }, (_, i) => {
    const px = 182 + seededRnd(i * 7) * 130;
    const py = accumTop ? 86 + seededRnd(i * 3) * 10 : 122 + seededRnd(i * 5) * 10;
    return { px, py };
  });

  const bulkCarriers = Array.from({ length: 8 }, (_, i) => ({
    px: 185 + seededRnd(i * 11) * 125,
    py: 97 + seededRnd(i * 13) * 20,
  }));

  const carrierColor = isN ? '#185fa5' : '#D85A30';
  const carrierSign = isN ? '−' : '+';
  const deficitSign = isN ? '+' : '−';
  const deficitColor = isN ? '#D85A30' : '#185fa5';
  const oppEdgeY = accumTop ? 129 : 85;

  return (
    <svg width="100%" viewBox="0 0 430 218" style={{ display: 'block' }}>
      <defs>
        <marker id="arrI" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#D05538" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arrB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#185fa5" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arrC" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke={carrierColor} strokeWidth="1.5" strokeLinecap="round" />
        </marker>
      </defs>

      <rect x="6" y="38" width="60" height="40" rx="5" fill="none" stroke="#D05538" strokeWidth="1" />
      <text fontSize="8" fontWeight="600" fill="#D05538" x="36" y="54" textAnchor="middle">
        DC Src 1
      </text>
      <text fontSize="7" fill="#D05538" x="36" y="66" textAnchor="middle">
        Electromagnet
      </text>
      <line x1="66" y1="57" x2="124" y2="57" stroke="#D05538" strokeWidth="1" strokeDasharray="3 2" />

      <rect x="6" y="90" width="60" height="40" rx="5" fill="none" stroke="#185fa5" strokeWidth="1" />
      <text fontSize="8" fontWeight="600" fill="#185fa5" x="36" y="106" textAnchor="middle">
        DC Src 2
      </text>
      <text fontSize="7" fill="#185fa5" x="36" y="118" textAnchor="middle">
        Sample bias
      </text>
      <line x1="66" y1="107" x2="118" y2="107" stroke="#D05538" strokeWidth="1.5" markerEnd="url(#arrI)" />

      <rect x="124" y="38" width="162" height="18" rx="4" fill="none" stroke="#185fa5" strokeWidth="1" strokeDasharray="4 2" />
      <text fontSize="7" fill="#185fa5" x="205" y="50" textAnchor="middle">
        N pole
      </text>

      {hasField
        ? [0, 1, 2, 3, 4].map((i) => (
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
          ))
        : (
          <text fontSize="7" fill="#185fa5" opacity={0.4} x="205" y="66" textAnchor="middle">
            No magnetic deflection
          </text>
        )}

      <text fontSize="9" fontWeight="600" fill="#185fa5" x="199" y="69" textAnchor="middle">
        {mat.name} sample ({mat.type}-type)
      </text>

      <rect x="118" y="74" width="162" height="66" rx="7" fill="#E6F1FB" stroke="#185fa5" strokeWidth={1.4} />

      {bulkCarriers.map((c, i) => (
        <g key={i}>
          <circle cx={c.px} cy={c.py} r={3.2} fill={carrierColor} opacity={hasField ? 0.3 : 0.7} />
          <text
            fontSize="7"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            opacity={hasField ? 0.55 : 1}
            x={c.px}
            y={c.py}
          >
            {carrierSign}
          </text>
        </g>
      ))}

      {hasField
        ? edgeCarriers.map((c, i) => (
            <g key={i}>
              <circle cx={c.px} cy={c.py} r={3.5} fill={carrierColor} opacity={0.9} />
              <text fontSize="8" textAnchor="middle" dominantBaseline="central" fill="white" x={c.px} y={c.py}>
                {carrierSign}
              </text>
            </g>
          ))
        : null}

      {hasField
        ? [0, 1, 2, 3].map((i) => (
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
          ))
        : null}

      {hasField
        ? [0, 1, 2].map((i) => {
            const px = 160 + i * 40;
            return (
              <line
                key={i}
                x1={px}
                y1={100}
                x2={px}
                y2={accumTop ? 84 : 128}
                stroke={carrierColor}
                strokeWidth={1.2}
                opacity={0.45}
                markerEnd="url(#arrC)"
              />
            );
          })
        : null}

      <line x1={118} y1="107" x2="74" y2="107" stroke="#D05538" strokeWidth="1" opacity="0.3" />
      <line x1="280" y1="107" x2="330" y2="107" stroke="#D05538" strokeWidth="1.5" markerEnd="url(#arrI)" />

      <rect x="124" y="140" width="162" height="18" rx="4" fill="none" stroke="#185fa5" strokeWidth="1" strokeDasharray="4 2" />
      <text fontSize="7" fill="#185fa5" x="205" y="152" textAnchor="middle">
        S pole
      </text>

      <line x1="205" y1="74" x2="205" y2="55" stroke="#0F6E56" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="205" y1="140" x2="205" y2="158" stroke="#0F6E56" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="205" cy="55" r="3" fill="#0F6E56" />
      <circle cx="205" cy="158" r="3" fill="#0F6E56" />

      <line x1="205" y1="55" x2="370" y2="55" stroke="#0F6E56" strokeWidth="0.8" strokeDasharray="3 2" />
      <line x1="205" y1="158" x2="370" y2="158" stroke="#0F6E56" strokeWidth="0.8" strokeDasharray="3 2" />

      <rect x="340" y="90" width="80" height="32" rx="5" fill="none" stroke="#0F6E56" strokeWidth="1" />
      <text fontSize="8" fontWeight="600" fill="#0F6E56" x="380" y="104" textAnchor="middle">
        Voltmeter
      </text>
      <text fontSize="9" fontWeight="600" fill="#0F6E56" x="380" y="117" textAnchor="middle">
        {fmtVh(Vh)}
      </text>
      <line x1="370" y1="90" x2="370" y2="55" stroke="#0F6E56" strokeWidth="0.8" strokeDasharray="3 2" />
      <line x1="370" y1="122" x2="370" y2="158" stroke="#0F6E56" strokeWidth="0.8" strokeDasharray="3 2" />

      {hasField ? (
        <>
          <text fontSize="7" fill={carrierColor} x="286" y={accumTop ? 82 : 136} textAnchor="start">
            Accumulated {carrierSign} charge
          </text>
          <text fontSize="7" fill={deficitColor} x="286" y={accumTop ? 134 : 84} textAnchor="start">
            Opposite edge: {deficitSign} deficit
          </text>
        </>
      ) : null}
    </svg>
  );
}

function HallChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.offsetWidth || 320;
      const H = 180;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.height = `${H}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const textC = dark ? '#d6d2c8' : '#3d3d3a';
      const gridC = dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';

      ctx.clearRect(0, 0, W, H);

      if (data.length < 2) {
        ctx.fillStyle = textC;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vary coil current or turns to collect data points', W / 2, H / 2);
        return;
      }

      const pad = { l: 56, r: 16, t: 12, b: 34 };
      const xs = data.map((p) => p.x);
      const ys = data.map((p) => p.y);
      const xmin = Math.min(...xs);
      const xmax = Math.max(...xs) || 0.01;
      const ymin = Math.min(...ys, 0);
      const ymax = Math.max(...ys, 0);
      const xr = xmax - xmin || 0.01;
      const yr = ymax - ymin || 1;
      const toX = (x) => pad.l + ((x - xmin) / xr) * (W - pad.l - pad.r);
      const toY = (y) => pad.t + ((ymax - y) / yr) * (H - pad.t - pad.b);

      for (let i = 0; i <= 4; i += 1) {
        const y = ymin + (yr * i) / 4;
        const cy = toY(y);
        ctx.strokeStyle = gridC;
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(pad.l, cy);
        ctx.lineTo(W - pad.r, cy);
        ctx.stroke();

        ctx.fillStyle = textC;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(y.toFixed(2), pad.l - 6, cy + 3);
      }

      ctx.fillStyle = textC;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Magnetic field B (T)', toX((xmin + xmax) / 2), H - 8);
      ctx.save();
      ctx.translate(15, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Hall voltage VH (mV)', 0, 0);
      ctx.restore();

      ctx.strokeStyle = '#185fa5';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      data.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(toX(p.x), toY(p.y));
        } else {
          ctx.lineTo(toX(p.x), toY(p.y));
        }
      });
      ctx.stroke();

      data.forEach((p) => {
        ctx.beginPath();
        ctx.arc(toX(p.x), toY(p.y), 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#185fa5';
        ctx.fill();
      });
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [data]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />;
}

const HallCoefficientSimulation = () => {
  const [matKey, setMatKey] = useState('si');
  const [coilI, setCoilI] = useState(5);
  const [coilN, setCoilN] = useState(800);
  const [I_mA, setI_mA] = useState(10);
  const [thickness, setThickness] = useState(1);
  const [temperatureK, setTemperatureK] = useState(300);
  const [chartPts, setChartPts] = useState([]);
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 980 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setIsCompact(window.innerWidth < 980);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const mat = MATERIALS[matKey];
  const materialState = calcMaterialState(mat, temperatureK);
  const rh = materialState.rh;
  const sigma = materialState.sigma;
  const B = calcB(coilI, coilN);
  const I = I_mA / 1e3;
  const t = thickness / 1e3;
  const Vh = ((rh * I * B) / t) * 1e3;
  const measuredRh = Math.abs(B) > 1e-9 && Math.abs(I) > 1e-12 ? ((Vh / 1e3) * t) / (I * B) : 0;
  const carrierDensity = materialState.carrierDensity;
  const muH = Math.abs(rh) * sigma;
  const mobility = materialState.mobility;

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
    setTemperatureK(300);
    setChartPts([]);
  };

  const exportCSV = () => {
    const rows = [['B (T)', 'VH (mV)'], ...chartPts.map((p) => [p.x, p.y.toFixed(4)])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hall_effect.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isCompact ? '1fr' : 'minmax(300px, 340px) minmax(0, 1fr)',
        gap: 16,
        minHeight: 620,
        fontFamily: 'var(--font-sans)',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 0,
        }}
      >
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
              padding: '6px 8px',
              fontSize: 12,
              color: 'var(--color-text-primary)',
            }}
          >
            {Object.entries(MATERIALS).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <SourceCard color="#D05538" title="DC Source 1 - Electromagnet coil">
          <SliderRow
            label="Coil current"
            id="coilI"
            min={0}
            max={10}
            step={0.5}
            value={coilI}
            onChange={setCoilI}
            display={`${coilI.toFixed(1)} A`}
          />
          <SliderRow
            label="Coil turns"
            id="coilN"
            min={100}
            max={2000}
            step={100}
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
              padding: '6px 8px',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Magnetic field B</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-info)', whiteSpace: 'nowrap' }}>
              {B.toFixed(4)} T
            </span>
          </div>
        </SourceCard>

        <SourceCard color="#185fa5" title="DC Source 2 - Semiconductor bias">
          <SliderRow
            label="Sample current"
            id="sampleI"
            min={1}
            max={50}
            step={1}
            value={I_mA}
            onChange={setI_mA}
            display={`${I_mA} mA`}
          />
          <SliderRow
            label="Thickness"
            id="thick"
            min={0.1}
            max={5}
            step={0.1}
            value={thickness}
            onChange={setThickness}
            display={`${thickness.toFixed(1)} mm`}
          />
          <SliderRow
            label="Temperature"
            id="tempK"
            min={250}
            max={500}
            step={5}
            value={temperatureK}
            onChange={setTemperatureK}
            display={`${temperatureK} K`}
          />
        </SourceCard>

        <div>
          <div style={sectionLabel}>Measurements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <MetricCard label="Hall voltage" value={fmtVh(Vh)} sub="Live voltmeter reading" />
            <MetricCard
              label="Carrier type"
              value={mat.type === 'n' ? 'n-type' : 'p-type'}
              sub={`${mat.name} at ${temperatureK} K`}
            />
            <MetricCard
              label="Hall coeff. RH"
              value={fmtSci(measuredRh, 'm³/C')}
              sub="Derived from VH x t / (I x B); varies with temperature through carrier density"
            />
            <MetricCard
              label="Carrier density"
              value={fmtDensityWithAltUnit(carrierDensity)}
              sub="Temperature-dependent effective carrier density"
            />
            <MetricCard
              label="Hall mobility μH"
              value={fmtSci(muH, 'm²/V·s')}
              sub={`μH = |RH| x σ   (σ = ${sigma.toExponential(2)} S/m)`}
              span
            />
            <MetricCard
              label="Carrier mobility"
              value={fmtSci(mobility, 'm²/V·s')}
              sub="Mobility decreases as temperature rises in this model"
            />
            <MetricCard
              label="Conductivity"
              value={fmtSci(sigma, 'S/m')}
              sub="Calculated from q x n x μ"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={resetAll}
            style={{
              flex: 1,
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 6,
              padding: '7px 10px',
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
              padding: '7px 10px',
              fontSize: 11,
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <HallViz mat={mat} B={B} Vh={Vh} />
        </div>

        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              VH vs magnetic field B
            </span>
            <button
              onClick={() => setChartPts([])}
              style={{
                background: 'none',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 5,
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              Clear
            </button>
          </div>
          <HallChart data={chartPts} />
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              marginTop: 10,
              whiteSpace: 'normal',
            }}
          >
            Formula: V<sub>H</sub> = R<sub>H</sub> x I x B / t | μ<sub>H</sub> = |R<sub>H</sub>| x σ | B = μ₀ x N x I
            <sub>coil</sub> / L | n(T) and μ(T) are temperature-dependent in this simulation model.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallCoefficientSimulation;
