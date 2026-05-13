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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

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
  const sign = material.type === 'n' ? -1 : 1;
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

function seededRnd(seed) {
  const x = Math.sin(seed * 17.23 + 3.1) * 43758.5453123;
  return x - Math.floor(x);
}

function SliderRow({ label, id, min, max, step, value, onChange, display }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr) 72px',
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

function HallPlate3D({ mat, B, Vh, thickness, I_mA, coilI, coilN }) {
  const isN = mat.type === 'n';
  const carrierColor = isN ? '#1E63A7' : '#D86A2F';
  const carrierSign = isN ? 'e-' : 'h+';
  const strongField = Math.abs(B) > 0.002;

  const depth = 18 + ((thickness - 0.1) / 4.9) * 42;
  const frontX = 160;
  const frontY = 112;
  const width = 156;
  const height = 90;
  const dx = depth;
  const dy = -depth * 0.55;

  const topFace = `${frontX},${frontY} ${frontX + width},${frontY} ${frontX + width + dx},${frontY + dy} ${frontX + dx},${frontY + dy}`;
  const sideFace = `${frontX + width},${frontY} ${frontX + width + dx},${frontY + dy} ${frontX + width + dx},${frontY + height + dy} ${frontX + width},${frontY + height}`;

  const currentArrowCount = clamp(Math.round(2 + I_mA / 7), 2, 8);
  const fieldArrowCount = clamp(Math.round(3 + (coilI * coilN) / 2400), 3, 8);
  const flowingCarrierCount = clamp(Math.round(8 + I_mA / 2.5), 8, 28);
  const buildupCount = clamp(Math.round(4 + Math.abs(Vh) * 1.5), 4, 18);
  const topChargeDominant = Vh > 0;

  const flowingCarriers = Array.from({ length: flowingCarrierCount }, (_, i) => ({
    x: frontX + 14 + seededRnd(i + 1) * (width - 28),
    y: frontY + 16 + seededRnd(i + 11) * (height - 32),
    dur: (1.6 + seededRnd(i + 31) * 1.3).toFixed(2),
    delay: (-seededRnd(i + 47) * 2.4).toFixed(2),
  }));

  const buildupCharges = Array.from({ length: buildupCount }, (_, i) => ({
    x: frontX + 18 + seededRnd(i + 71) * (width - 32),
    yTop: frontY + 6 + seededRnd(i + 83) * 12,
    yBottom: frontY + height - 6 - seededRnd(i + 97) * 12,
  }));

  return (
    <svg width="100%" viewBox="0 0 520 330" style={{ display: 'block', background: 'transparent' }}>
      <defs>
        <linearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F9FBFF" />
          <stop offset="100%" stopColor="#EEF5FB" />
        </linearGradient>
        <linearGradient id="supplyBodyWarm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBFCFE" />
          <stop offset="100%" stopColor="#E8EEF4" />
        </linearGradient>
        <linearGradient id="supplyBodyCool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDFEFF" />
          <stop offset="100%" stopColor="#E5EEF8" />
        </linearGradient>
        <linearGradient id="meterScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#13241B" />
          <stop offset="100%" stopColor="#1C3327" />
        </linearGradient>
        <linearGradient id="frontFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E7F1FB" />
          <stop offset="100%" stopColor="#D7E7F7" />
        </linearGradient>
        <linearGradient id="topFaceFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F8FC" />
          <stop offset="100%" stopColor="#DCEAF8" />
        </linearGradient>
        <linearGradient id="sideFaceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFE0F0" />
          <stop offset="100%" stopColor="#BDD2E6" />
        </linearGradient>
        <marker id="arrowCurrent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#D86A2F" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arrowField" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#156F59" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="shadow" x="-20%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6B8099" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x="12" y="12" width="496" height="306" rx="18" fill="url(#bgGlow)" />

      <g filter="url(#shadow)">
        <rect x="22" y="36" width="92" height="62" rx="10" fill="url(#supplyBodyWarm)" stroke="#B85030" strokeWidth="1.1" />
        <rect x="30" y="46" width="44" height="18" rx="4" fill="#1F2933" />
        <text x="52" y="58" fontSize="9" fontWeight="700" textAnchor="middle" fill="#FF7D55">
          {coilI.toFixed(1)} A
        </text>
        <circle cx="88" cy="54" r="7" fill="#D86A2F" opacity="0.9" />
        <circle cx="88" cy="54" r="2.4" fill="#fff" />
        <circle cx="48" cy="83" r="4" fill="#C33A2A" />
        <circle cx="68" cy="83" r="4" fill="#4F5660" />
      </g>
      <text x="68" y="111" fontSize="10" fontWeight="700" textAnchor="middle" fill="#B85030">
        DC supply for electromagnet
      </text>

      <g filter="url(#shadow)">
        <rect x="24" y="182" width="90" height="60" rx="10" fill="url(#supplyBodyCool)" stroke="#1E63A7" strokeWidth="1.1" />
        <rect x="32" y="192" width="40" height="16" rx="4" fill="#182534" />
        <text x="52" y="203" fontSize="8.5" fontWeight="700" textAnchor="middle" fill="#85E1FF">
          {I_mA} mA
        </text>
        <circle cx="87" cy="199" r="8" fill="#1E63A7" opacity="0.95" />
        <circle cx="87" cy="199" r="2.4" fill="#fff" />
        <circle cx="48" cy="226" r="4" fill="#C33A2A" />
        <circle cx="68" cy="226" r="4" fill="#4F5660" />
      </g>
      <text x="69" y="255" fontSize="10" fontWeight="700" textAnchor="middle" fill="#1E63A7">
        DC supply for sample
      </text>

      <line x1="114" y1="66" x2="138" y2="66" stroke="#B85030" strokeWidth="1.4" />
      <line x1="114" y1="208" x2={frontX - 18} y2="208" stroke="#D86A2F" strokeWidth="1.8" markerEnd="url(#arrowCurrent)" />

      <g filter="url(#shadow)">
        <rect x="130" y="42" width="216" height="24" rx="8" fill="#D8EBDD" stroke="#156F59" strokeWidth="1.2" />
        <rect x="130" y="234" width="216" height="24" rx="8" fill="#D8EBDD" stroke="#156F59" strokeWidth="1.2" />
        <text x="146" y="58" fontSize="10" fontWeight="700" fill="#156F59">
          N pole
        </text>
        <text x="146" y="250" fontSize="10" fontWeight="700" fill="#156F59">
          S pole
        </text>
      </g>

      <g filter="url(#shadow)">
        <rect x="348" y="72" width="54" height="150" rx="14" fill="#D67A43" stroke="#9A4F24" strokeWidth="1.5" />
        {Array.from({ length: 8 }, (_, i) => {
          const y = 84 + i * 16;
          return <ellipse key={`coil-${i}`} cx="375" cy={y} rx="21" ry="6.5" fill="none" stroke="#8B3F1D" strokeWidth="2.4" />;
        })}
      </g>
      <text x="375" y="241" fontSize="10" fontWeight="700" textAnchor="middle" fill="#9A4F24">
        Electromagnet coil
      </text>

      {Array.from({ length: fieldArrowCount }, (_, i) => {
        const x = 175 + i * (128 / Math.max(fieldArrowCount - 1, 1));
        const sweep = 18 + i * 2;
        return (
          <g key={`field-${i}`} opacity={0.45 + i / (fieldArrowCount * 1.6)}>
            <path
              d={`M ${x} 66 C ${x - sweep} 94, ${x - sweep} 138, ${x} 166 C ${x + sweep} 194, ${x + sweep} 216, ${x} 234`}
              fill="none"
              stroke="#156F59"
              strokeWidth="1.8"
              markerEnd="url(#arrowField)"
            />
          </g>
        );
      })}
      <text x="364" y="60" fontSize="10" fill="#156F59">
        Magnetic field rays (N to S)
      </text>

      <polygon points={topFace} fill="url(#topFaceFill)" stroke="#6E94BA" strokeWidth="1" />
      <polygon points={sideFace} fill="url(#sideFaceFill)" stroke="#6E94BA" strokeWidth="1" />
      <rect x={frontX} y={frontY} width={width} height={height} rx="10" fill="url(#frontFace)" stroke="#185FA5" strokeWidth="1.8" />

      <line x1={frontX} y1={frontY} x2={frontX + dx} y2={frontY + dy} stroke="#6E94BA" strokeWidth="1" />
      <line x1={frontX + width} y1={frontY} x2={frontX + width + dx} y2={frontY + dy} stroke="#6E94BA" strokeWidth="1" />
      <line x1={frontX + width} y1={frontY + height} x2={frontX + width + dx} y2={frontY + height + dy} stroke="#6E94BA" strokeWidth="1" />

      <text x={frontX + 10} y={frontY - 16} fontSize="11" fontWeight="700" fill="#345A7C">
        {mat.name} plate ({mat.type}-type)
      </text>
      <text x={frontX + width + dx - 2} y={frontY + height + dy + 20} fontSize="10" textAnchor="end" fill="#5C6F80">
        Thickness = {thickness.toFixed(1)} mm
      </text>
      <text x={frontX + 10} y={frontY + height + 18} fontSize="10" fill="#5C6F80">
        Current enters from left and flows through the plate
      </text>

      {Array.from({ length: currentArrowCount }, (_, i) => {
        const y = frontY + 14 + i * ((height - 28) / Math.max(currentArrowCount - 1, 1));
        return (
          <line
            key={`current-${i}`}
            x1={frontX + 10}
            y1={y}
            x2={frontX + width - 12}
            y2={y}
            stroke="#D86A2F"
            strokeWidth="1.3"
            opacity="0.55"
            markerEnd="url(#arrowCurrent)"
          />
        );
      })}

      {flowingCarriers.map((p, i) => (
        <g key={`carrier-${i}`} filter="url(#softGlow)">
          <circle cx={p.x} cy={p.y} r="3.4" fill={carrierColor}>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="-24 0"
              to="24 0"
              dur={`${p.dur}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
          <text x={p.x} y={p.y + 0.5} fontSize="5.8" textAnchor="middle" dominantBaseline="middle" fill="#fff">
            {isN ? '-' : '+'}
            <animateTransform
              attributeName="transform"
              type="translate"
              from="-24 0"
              to="24 0"
              dur={`${p.dur}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          </text>
        </g>
      ))}

      {strongField &&
        buildupCharges.map((p, i) => (
          <g key={`buildup-${i}`}>
            <circle cx={p.x} cy={topChargeDominant ? p.yTop : p.yBottom} r="4.2" fill={carrierColor} opacity="0.95" />
            <text
              x={p.x}
              y={(topChargeDominant ? p.yTop : p.yBottom) + 0.5}
              fontSize="7"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
            >
              {isN ? '-' : '+'}
            </text>
            <text
              x={p.x}
              y={topChargeDominant ? p.yBottom : p.yTop}
              fontSize="8"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isN ? '#D86A2F' : '#1E63A7'}
              opacity="0.72"
            >
              {isN ? '+' : '-'}
            </text>
          </g>
        ))}

      {strongField &&
        Array.from({ length: 4 }, (_, i) => {
          const x = frontX + 28 + i * 34;
          return (
            <line
              key={`lorentz-${i}`}
              x1={x}
              y1={frontY + height / 2}
              x2={x + 8}
              y2={topChargeDominant ? frontY + 18 : frontY + height - 18}
              stroke={carrierColor}
              strokeWidth="1.2"
              opacity="0.45"
              markerEnd="url(#arrowCurrent)"
            />
          );
        })}

      <line x1={frontX + width + dx + 2} y1={frontY + 12} x2="417" y2="98" stroke="#0E7A61" strokeWidth="1" strokeDasharray="4 3" />
      <line x1={frontX + width + dx + 2} y1={frontY + height - 12} x2="417" y2="174" stroke="#0E7A61" strokeWidth="1" strokeDasharray="4 3" />

      <g filter="url(#shadow)">
        <rect x="416" y="104" width="82" height="70" rx="10" fill="#ECF5F0" stroke="#0E7A61" strokeWidth="1.2" />
        <rect x="426" y="116" width="62" height="22" rx="5" fill="url(#meterScreen)" />
        <text x="457" y="131" fontSize="11" fontWeight="700" textAnchor="middle" fill="#9BFFCC">
          {fmtVh(Vh)}
        </text>
        <text x="457" y="152" fontSize="10" fontWeight="700" textAnchor="middle" fill="#0E7A61">
          Hall voltmeter
        </text>
      </g>

      <text x="414" y="44" fontSize="10" fill="#156F59">
        B = {B.toFixed(4)} T
      </text>
      <text x="414" y="60" fontSize="10" fill="#B85030">
        Coil: {coilI.toFixed(1)} A, {coilN} turns
      </text>
      <text x="414" y="198" fontSize="10" fill="#D86A2F">
        Sample current = {I_mA} mA
      </text>
      <text x="414" y="214" fontSize="10" fill={carrierColor}>
        Mobile carriers: {carrierSign}
      </text>
      <text x="360" y="266" fontSize="10" fill={carrierColor}>
        {strongField
          ? `${isN ? 'Electrons' : 'Holes'} collect at the ${topChargeDominant ? 'top' : 'bottom'} edge`
          : 'Increase magnetic field to see charge separation clearly'}
      </text>
      <text x="360" y="282" fontSize="10" fill="#5C6F80">
        Opposite edge develops equal and opposite Hall polarity
      </text>
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
      const H = 190;
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

      const pad = { l: 56, r: 18, t: 12, b: 34 };
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

      ctx.strokeStyle = '#185FA5';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      data.forEach((p, i) => {
        if (i === 0) ctx.moveTo(toX(p.x), toY(p.y));
        else ctx.lineTo(toX(p.x), toY(p.y));
      });
      ctx.stroke();

      data.forEach((p) => {
        ctx.beginPath();
        ctx.arc(toX(p.x), toY(p.y), 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#185FA5';
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

        <SourceCard
          color="#D05538"
          title="DC Source 1 - Electromagnet coil"
          subtitle="This source changes the magnetic field B through the semiconductor plate."
        >
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

        <SourceCard
          color="#185FA5"
          title="DC Source 2 - Semiconductor bias"
          subtitle="This source sets the sample current and changes the density of visible carrier flow."
        >
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
            <MetricCard label="Hall voltage" value={fmtVh(Vh)} sub="Live voltmeter reading across the transverse faces" />
            <MetricCard
              label="Carrier type"
              value={mat.type === 'n' ? 'n-type' : 'p-type'}
              sub={`${mat.name} at ${temperatureK} K`}
            />
            <MetricCard
              label="Hall coeff. RH"
              value={fmtSci(measuredRh, 'm³/C')}
              sub="Calculated from VH x t / (I x B)"
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
          <HallPlate3D
            mat={mat}
            B={B}
            Vh={Vh}
            thickness={thickness}
            I_mA={I_mA}
            coilI={coilI}
            coilN={coilN}
          />
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
