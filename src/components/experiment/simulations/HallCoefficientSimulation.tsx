import React, { useEffect, useState } from 'react';

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
const ROOM_TEMPERATURE_K = 300;
const FIXED_COIL_TURNS = 800;

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

function fmtB(v) {
  if (!Number.isFinite(v)) return '--';
  return `${v.toFixed(4)} T`;
}

function fmtDensityWithAltUnit(v) {
  const perCm3 = v / 1e6;
  return `${fmtSci(perCm3, 'cm⁻³')} (${fmtSci(v, 'm⁻³')})`;
}

function calcB(coilI, coilN) {
  return (MU0 * coilN * coilI) / SOLENOID_L;
}

function calcHallCoefficient(material, carrierDensity) {
  const sign = material.type === 'n' ? -1 : 1;
  return sign / (E_CHARGE * carrierDensity);
}

function calcConductivity(carrierDensity, mobility) {
  return E_CHARGE * carrierDensity * mobility;
}

function calcMaterialState(material, temperatureK) {
  const tempRatio = temperatureK / 300;
  const carrierDensity = material.baseCarrierDensity * Math.pow(tempRatio, material.densityTempExponent);
  const mobility = material.baseMobility * Math.pow(tempRatio, material.mobilityTempExponent);

  return {
    carrierDensity,
    mobility,
    rh: calcHallCoefficient(material, carrierDensity),
    sigma: calcConductivity(carrierDensity, mobility),
  };
}

function SourceCard({ color, title, subtitle, children }) {
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: `1px solid ${color}66`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 6px 18px rgba(13, 27, 42, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 0 4px ${color}22`,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}>{title}</span>
      </div>
      {subtitle ? (
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8, lineHeight: 1.45 }}>
          {subtitle}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function SliderRow({ label, id, min, max, step, value, onChange, display }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr) 74px',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
      }}
    >
      <label htmlFor={id} style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.2 }}>
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
        style={{ width: '100%', accentColor: 'var(--color-text-info)', height: 4 }}
      />
      <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{display}</span>
    </div>
  );
}

function HallPlate3D({ mat, B, Vh, thickness, I_mA, coilI }) {
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
  const flowingCarrierCount = clamp(Math.round(8 + I_mA / 2.5), 8, 28);
  const buildupCount = clamp(Math.round(4 + Math.abs(Vh) * 1.5), 4, 18);
  const topChargeDominant = Vh > 0;

  const seededRnd = (seed) => {
    const x = Math.sin(seed * 17.23 + 3.1) * 43758.5453123;
    return x - Math.floor(x);
  };

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

      {Array.from({ length: 6 }, (_, i) => {
        const x = 175 + i * 25;
        const sweep = 18 + i * 2;
        return (
          <g key={`field-${i}`} opacity={0.45 + i / 10}>
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
        Magnetic field rays
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
          </g>
        ))}

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
        B = {fmtB(B)}
      </text>
      <text x="414" y="60" fontSize="10" fill="#B85030">
        Coil current = {coilI.toFixed(1)} A, turns = {FIXED_COIL_TURNS}
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

function ExerciseNote() {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #FCFEFF 0%, #F2F7FD 100%)',
        border: '1px solid var(--color-border-tertiary)',
        borderRadius: 12,
        padding: 14,
        fontSize: 12,
        lineHeight: 1.7,
        color: 'var(--color-text-secondary)',
      }}
    >
      Exercise: compare n-type and p-type results. Note the sign of Hall voltage and identify the majority carrier.
      Then repeat the experiment with a larger thickness and observe that Hall voltage decreases as thickness increases.
    </div>
  );
}

function TableCellValue({ row, isPType, studentValue, onStudentChange, revealed, onReveal }) {
  if (isPType) {
    if (revealed) {
      return <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.value}</span>;
    }

    return (
      <button
        type="button"
        onClick={onReveal}
        style={{
          border: '1px solid #185FA566',
          background: '#185FA50F',
          color: '#185FA5',
          borderRadius: 8,
          padding: '5px 9px',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Click for answer
      </button>
    );
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={studentValue}
      onChange={(e) => onStudentChange(e.target.value)}
      placeholder="Enter value"
      style={{
        width: '100%',
        border: '1px solid var(--color-border-secondary)',
        borderRadius: 8,
        padding: '7px 9px',
        fontSize: 11,
        background: 'var(--color-background-primary)',
        color: 'var(--color-text-primary)',
      }}
    />
  );
}

function MeasurementTable({ mat, data, answerState, setAnswerState, studentValues, setStudentValues }) {
  const isPTypeExercise = mat.type === 'p';

  const reveal = (key) => {
    setAnswerState((prev) => ({ ...prev, [key]: true }));
  };

  const rows = [
    {
      key: 'bField',
      label: 'Magnetic field B',
      formula: 'B = μ0 × N × Icoil / L',
      value: fmtB(data.B),
    },
    {
      key: 'hallVoltage',
      label: 'Hall voltage V_H',
      formula: 'V_H = R_H × I × B / t',
      value: fmtVh(data.Vh),
    },
    {
      key: 'hallCoeff',
      label: 'Hall coefficient R_H',
      formula: 'R_H = V_H × t / (I × B)',
      value: fmtSci(data.measuredRh, 'm³/C'),
    },
    {
      key: 'carrierDensity',
      label: 'Carrier density n',
      formula: 'n(T) from material model',
      value: fmtDensityWithAltUnit(data.carrierDensity),
    },
    {
      key: 'hallMobility',
      label: 'Hall mobility μ_H',
      formula: 'μ_H = |R_H| × σ',
      value: fmtSci(data.muH, 'm²/V·s'),
    },
    {
      key: 'mobility',
      label: 'Carrier mobility μ',
      formula: 'μ(T) from material model',
      value: fmtSci(data.mobility, 'm²/V·s'),
    },
    {
      key: 'conductivity',
      label: 'Conductivity σ',
      formula: 'σ = q × n × μ',
      value: fmtSci(data.sigma, 'S/m'),
    },
  ];

  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-tertiary)',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-secondary)' }}>Measurement Table</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
            n-type uses blank entry boxes. p-type uses click-to-reveal answers.
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: 720,
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Formula</th>
              <th style={thStyle}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key}>
                <td style={tdStyle(index === rows.length - 1)}>{row.label}</td>
                <td style={tdStyle(index === rows.length - 1)}>{row.formula}</td>
                <td style={tdStyle(index === rows.length - 1)}>
                  <TableCellValue
                    row={row}
                    isPType={isPTypeExercise}
                    studentValue={studentValues[row.key] || ''}
                    onStudentChange={(value) => setStudentValues((prev) => ({ ...prev, [row.key]: value }))}
                    revealed={answerState[row.key]}
                    onReveal={() => reveal(row.key)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  borderTop: '1px solid var(--color-border-tertiary)',
  borderBottom: '1px solid var(--color-border-tertiary)',
  background: 'var(--color-background-secondary)',
  color: 'var(--color-text-secondary)',
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

function tdStyle(isLast) {
  return {
    padding: '10px 12px',
    borderBottom: isLast ? '1px solid var(--color-border-tertiary)' : '1px solid rgba(0,0,0,0.06)',
    background: 'var(--color-background-primary)',
    verticalAlign: 'middle',
  };
}

const HallCoefficientSimulation = () => {
  const [matKey, setMatKey] = useState('si');
  const [coilI, setCoilI] = useState(5);
  const [I_mA, setI_mA] = useState(10);
  const [thickness, setThickness] = useState(1);
  const [answerState, setAnswerState] = useState({});
  const [studentValues, setStudentValues] = useState({});
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
  const materialState = calcMaterialState(mat, ROOM_TEMPERATURE_K);
  const B = calcB(coilI, FIXED_COIL_TURNS);
  const I = I_mA / 1e3;
  const t = thickness / 1e3;
  const Vh = ((materialState.rh * I * B) / t) * 1e3;
  const measuredRh = Math.abs(B) > 1e-9 && Math.abs(I) > 1e-12 ? ((Vh / 1e3) * t) / (I * B) : 0;
  const muH = Math.abs(materialState.rh) * materialState.sigma;

  useEffect(() => {
    setAnswerState({});
    setStudentValues({});
  }, [matKey]);

  const resetAll = () => {
    setMatKey('si');
    setCoilI(5);
    setI_mA(10);
    setThickness(1);
    setAnswerState({});
    setStudentValues({});
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 8,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isCompact ? '1fr' : 'minmax(320px, 360px) minmax(0, 1fr)',
        gap: 16,
        minHeight: 620,
        fontFamily: 'var(--font-sans)',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-tertiary)',
          borderRadius: 14,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 0,
          boxShadow: '0 10px 28px rgba(13, 27, 42, 0.06)',
        }}
      >
        <div>
          <div style={sectionLabel}>Material Selection</div>
          <div
            style={{
              border: '2px solid #185FA544',
              borderRadius: 12,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F8FD 100%)',
              padding: 10,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
              Choose a semiconductor and compare how the Hall sign changes.
            </div>
            <select
              value={matKey}
              onChange={(e) => setMatKey(e.target.value)}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid #185FA566',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                outline: 'none',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              {Object.entries(MATERIALS).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.5, color: 'var(--color-text-tertiary)' }}>
            Room temperature is fixed at {ROOM_TEMPERATURE_K} K for this exercise.
          </div>
        </div>

        <SourceCard
          color="#D05538"
          title="DC Source 1 - Electromagnet coil"
          subtitle="Use the coil current to generate the magnetic field. Coil turns are fixed for the exercise."
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
              background: 'var(--color-background-tertiary)',
              borderRadius: 10,
              padding: '8px 10px',
              border: '1px solid var(--color-border-tertiary)',
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Fixed coil turns</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-info)' }}>{FIXED_COIL_TURNS}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            Magnetic field: B = μ0 × N × Icoil / L
          </div>
        </SourceCard>

        <SourceCard
          color="#185FA5"
          title="DC Source 2 - Semiconductor bias"
          subtitle="Sample current and thickness control the Hall voltage response."
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
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            Hall voltage is inversely proportional to thickness, so increasing thickness reduces V_H.
          </div>
        </SourceCard>

        <button
          onClick={resetAll}
          style={{
            width: '100%',
            background: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
          }}
        >
          Reset Experiment
        </button>
      </div>

      <div style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-tertiary)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <HallPlate3D mat={mat} B={B} Vh={Vh} thickness={thickness} I_mA={I_mA} coilI={coilI} />
        </div>

        <ExerciseNote />

        <MeasurementTable
          mat={mat}
          data={{
            B,
            Vh,
            measuredRh,
            carrierDensity: materialState.carrierDensity,
            muH,
            mobility: materialState.mobility,
            sigma: materialState.sigma,
          }}
          answerState={answerState}
          setAnswerState={setAnswerState}
          studentValues={studentValues}
          setStudentValues={setStudentValues}
        />
      </div>
    </div>
  );
};

export default HallCoefficientSimulation;
