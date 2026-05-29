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
const ROOM_TEMPERATURE_K = 300;
const FIXED_COIL_TURNS = 800;

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

function fmtSciValue(v) {
  if (!Number.isFinite(v)) return '--';
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = (v / Math.pow(10, e)).toFixed(2);
  return `${m}×10${toSup(e)}`;
}

function fmtVhValue(v) {
  if (!Number.isFinite(v)) return '--';
  return v.toFixed(Math.abs(v) < 10 ? 3 : 1);
}

function fmtBValue(v) {
  if (!Number.isFinite(v)) return '--';
  return v.toFixed(4);
}

function fmtDensityValue(v) {
  const perCm3 = v / 1e6;
  return `${fmtSciValue(perCm3)} / ${fmtSciValue(v)}`;
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

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawArrow(ctx, x1, y1, x2, y2, color, width = 2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 7;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
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

function TogglePill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: '1px solid var(--color-border-secondary)',
        background: 'var(--color-background-secondary)',
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 190,
        justifyContent: 'space-between',
      }}
    >
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span
        style={{
          position: 'relative',
          width: 42,
          height: 24,
          borderRadius: 999,
          background: active ? 'linear-gradient(180deg, #1B8E5B 0%, #16764A 100%)' : '#B8C8D8',
          boxShadow: active ? '0 0 0 3px rgba(27, 142, 91, 0.10)' : 'none',
          display: 'inline-block',
          transition: 'background 160ms ease',
        }}
        aria-hidden="true"
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: active ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            transition: 'left 160ms ease',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 6,
            top: 5,
            fontSize: 8,
            fontWeight: 800,
            color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
          }}
        >
          OFF
        </span>
        <span
          style={{
            position: 'absolute',
            right: 5,
            top: 5,
            fontSize: 8,
            fontWeight: 800,
            color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.8)',
          }}
        >
          ON
        </span>
      </span>
    </button>
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
      The 3D plate shows the carrier flow along the horizontal axis, magnetic field upward from bottom to top, and
      Hall accumulation along the direction perpendicular to both. For n-type the charge buildup is out of the page
      toward the viewer. For p-type the charge buildup is into the page.
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

  const rows = [
    { key: 'bField', label: 'Magnetic field B', formula: 'B = μ0 × N × Icoil / L', value: fmtBValue(data.B), unit: 'T' },
    {
      key: 'hallVoltage',
      label: 'Hall voltage V_H',
      formula: 'V_H = R_H × I × B / t',
      value: fmtVhValue(data.Vh),
      unit: 'mV',
    },
    {
      key: 'hallCoeff',
      label: 'Hall coefficient R_H',
      formula: 'R_H = V_H × t / (I × B)',
      value: fmtSciValue(data.measuredRh),
      unit: 'm³/C',
    },
    {
      key: 'carrierDensity',
      label: 'Carrier density n',
      formula: 'n(T) from material model',
      value: fmtDensityValue(data.carrierDensity),
      unit: 'cm⁻³ / m⁻³',
    },
    {
      key: 'hallMobility',
      label: 'Hall mobility μ_H',
      formula: 'μ_H = |R_H| × σ',
      value: fmtSciValue(data.muH),
      unit: 'm²/V·s',
    },
    {
      key: 'mobility',
      label: 'Carrier mobility μ',
      formula: 'μ(T) from material model',
      value: fmtSciValue(data.mobility),
      unit: 'm²/V·s',
    },
    { key: 'conductivity', label: 'Conductivity σ', formula: 'σ = q × n × μ', value: fmtSciValue(data.sigma), unit: 'S/m' },
  ];

  const reveal = (key) => setAnswerState((prev) => ({ ...prev, [key]: true }));

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
              <th style={thStyle}>Unit</th>
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
                <td style={tdStyle(index === rows.length - 1)}>{row.unit}</td>
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

function HallPlateCanvas({ matType, BOn, currentOn, B, showVh, hallVoltageText }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const width = 980;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    let animationFrame = 0;
    let lastTime = performance.now();
    const particles = [];
    const topFieldMarks = [];
    const lineCount = 12;

    for (let i = 0; i < lineCount; i += 1) {
      topFieldMarks.push({
        x: 180 + i * 56,
        phase: Math.random() * Math.PI * 2,
        speed: 1.1 + Math.random() * 0.8,
      });
    }

    const resetParticle = (particle, offset = 0) => {
      particle.x = 790 + Math.random() * 110 - offset;
      particle.y = 185 + (Math.random() - 0.5) * 16;
      particle.vx = -(72 + Math.random() * 28);
      particle.vy = 0;
    };

    for (let i = 0; i < 24; i += 1) {
      const particle = {};
      resetParticle(particle, i * 20);
      particles.push(particle);
    }

    const drawGlow = (x, y, radius, color, alpha = 1) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (time) => {
      const delta = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#F7FBFF');
      bg.addColorStop(1, '#EAF2F8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#D9E4EE';
      ctx.fillRect(0, 0, width, 22);
      ctx.fillStyle = '#6C849D';
      ctx.font = '600 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('3D Hall plate with field, current, and charge separation directions', 86, 16);

      const isN = matType === 'n';
      const sideAccumTowardViewer = isN;
      const carrierColor = isN ? '32, 111, 212' : '221, 125, 45';
      const oppositeColor = isN ? '221, 125, 45' : '32, 111, 212';
      const accumulationStrength = BOn && currentOn ? Math.min(1, Math.max(0, 0.2 + Math.abs(B) * 120)) : 0;

      const plateX = 150;
      const plateY = 112;
      const plateW = 620;
      const plateH = 108;
      const plateDepth = 30;

      // background ground shadow
      ctx.fillStyle = 'rgba(56, 88, 121, 0.10)';
      ctx.beginPath();
      ctx.ellipse(470, 250, 230, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // field area
      if (BOn) {
        for (const mark of topFieldMarks) {
          mark.phase += delta * mark.speed;
          const x = mark.x + Math.sin(mark.phase + time / 280) * 4;
          const y1 = 70;
          const y2 = 92;

          drawArrow(ctx, x, y2, x, y1, 'rgba(22, 124, 74, 0.92)', 2);

          ctx.fillStyle = 'rgba(22, 124, 74, 0.95)';
          ctx.font = '700 10px Segoe UI, Arial, sans-serif';
          ctx.fillText('B', x - 3, 64);
        }

        ctx.fillStyle = '#16642D';
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillText('Magnetic field direction: bottom -> top', 84, 54);
      } else {
        ctx.fillStyle = '#7B8FA3';
        ctx.font = '600 11px Segoe UI, Arial, sans-serif';
        ctx.fillText('Magnetic field is off', 84, 54);
      }

      // plate
      const topGradient = ctx.createLinearGradient(plateX, plateY, plateX, plateY + plateH);
      topGradient.addColorStop(0, '#FBFEFF');
      topGradient.addColorStop(1, '#DDEBF8');
      ctx.fillStyle = topGradient;
      roundRect(ctx, plateX, plateY, plateW, plateH, 18);
      ctx.fill();
      ctx.strokeStyle = '#86A4C1';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const sideGradient = ctx.createLinearGradient(plateX + plateW, plateY, plateX + plateW + plateDepth, plateY + plateH);
      sideGradient.addColorStop(0, '#BFD0E2');
      sideGradient.addColorStop(1, '#97B0CA');
      ctx.beginPath();
      ctx.moveTo(plateX + plateW, plateY);
      ctx.lineTo(plateX + plateW + plateDepth, plateY - plateDepth * 0.45);
      ctx.lineTo(plateX + plateW + plateDepth, plateY + plateH - plateDepth * 0.45);
      ctx.lineTo(plateX + plateW, plateY + plateH);
      ctx.closePath();
      ctx.fillStyle = sideGradient;
      ctx.fill();
      ctx.strokeStyle = '#86A4C1';
      ctx.stroke();

      const topFaceGradient = ctx.createLinearGradient(plateX, plateY - 8, plateX, plateY + 8);
      topFaceGradient.addColorStop(0, '#FDFEFF');
      topFaceGradient.addColorStop(1, '#E8F1F9');
      ctx.beginPath();
      ctx.moveTo(plateX, plateY);
      ctx.lineTo(plateX + plateDepth, plateY - plateDepth * 0.45);
      ctx.lineTo(plateX + plateW + plateDepth, plateY - plateDepth * 0.45);
      ctx.lineTo(plateX + plateW, plateY);
      ctx.closePath();
      ctx.fillStyle = topFaceGradient;
      ctx.fill();
      ctx.strokeStyle = '#8DA8C4';
      ctx.stroke();

      // title on plate
      ctx.fillStyle = '#314E6A';
      ctx.font = '700 13px Segoe UI, Arial, sans-serif';
      ctx.fillText('Hall plate', plateX + 228, plateY - 12);

      // axes labels
      const axesY = 282;
      ctx.fillStyle = '#5F7890';
      ctx.font = '700 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('x axis: carrier flow', 182, axesY);
      ctx.fillText('y axis: B direction', 392, axesY);
      ctx.fillText('z axis: Hall field / accumulation', 602, axesY);

      // current flow on the plate
      if (currentOn) {
        const currentY = plateY + 58;
        const startX = isN ? plateX + plateW - 40 : plateX + 40;
        const endX = isN ? plateX + 84 : plateX + plateW - 84;
        drawArrow(
          ctx,
          startX,
          currentY,
          endX,
          currentY,
          'rgba(24, 95, 165, 0.92)',
          3
        );
        ctx.fillStyle = '#185FA5';
        ctx.font = '700 12px Segoe UI, Arial, sans-serif';
        ctx.fillText(isN ? 'Electron flow: right -> left' : 'Hole flow: left -> right', plateX + 134, plateY + 24);
        ctx.fillText('Current direction in the plate', plateX + 238, plateY + 76);

        for (let i = 0; i < 4; i += 1) {
          const x = isN
            ? plateX + plateW - 96 - i * 86 - ((time / 18) % 1) * 28
            : plateX + 96 + i * 86 + ((time / 18) % 1) * 28;
          const y = currentY + Math.sin(time / 120 + i) * 2;
          drawGlow(x, y, 14, carrierColor, 0.10);
          ctx.fillStyle = `rgba(${carrierColor}, 0.94)`;
          ctx.beginPath();
          ctx.arc(x, y, 4.1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#8B9DAD';
        ctx.font = '700 12px Segoe UI, Arial, sans-serif';
        ctx.fillText('Current is off', plateX + 240, plateY + 66);
      }

      // Hall accumulation area
      if (BOn && currentOn) {
        const hallEdgeX = isN ? plateX + plateW + 18 : plateX + plateW / 2 + 24;
        const hallEdgeY = plateY + 44;

        // show the Hall direction as out of plane or into plane
        ctx.fillStyle = 'rgba(24, 142, 91, 0.95)';
        ctx.font = '700 12px Segoe UI, Arial, sans-serif';
        ctx.fillText(
          sideAccumTowardViewer ? 'Charge accumulation: toward viewer' : 'Charge accumulation: into the plane',
          plateX + 150,
          plateY + 103
        );

        const labelX = isN ? plateX + plateW + 35 : plateX + plateW + 18;
        const labelY = plateY + 30;

        // z-axis guide
        ctx.save();
        ctx.setLineDash([6, 6]);
        drawArrow(
          ctx,
          plateX + plateW + 2,
          plateY + 56,
          plateX + plateW + 62,
          plateY + 56,
          'rgba(24, 142, 91, 0.75)',
          2
        );
        ctx.restore();
        ctx.fillStyle = '#188E5B';
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillText(sideAccumTowardViewer ? 'out of plane' : 'into plane', labelX, labelY);

        // accumulation dots for positive/negative charges
        for (let i = 0; i < 10; i += 1) {
          const y = plateY + 24 + i * 7;
          const x = plateX + plateW - 22 + Math.sin(time / 180 + i) * 2;
          const strength = 0.22 + accumulationStrength * 0.55;
          drawGlow(x, y, 13, sideAccumTowardViewer ? carrierColor : oppositeColor, 0.06 + strength * 0.22);
          ctx.fillStyle = sideAccumTowardViewer
            ? `rgba(${carrierColor}, ${0.22 + strength})`
            : `rgba(${oppositeColor}, ${0.22 + strength})`;
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Hall electric field arrow: from bottom to top
        drawArrow(ctx, plateX + 40, plateY + 92, plateX + 40, plateY + 24, 'rgba(27, 142, 91, 0.96)', 3);
        ctx.fillStyle = '#16764A';
        ctx.font = '700 12px Segoe UI, Arial, sans-serif';
        ctx.fillText('E_H', plateX + 28, plateY + 18);

        // label field relation
        ctx.fillStyle = '#344E68';
        ctx.font = '600 11px Segoe UI, Arial, sans-serif';
        ctx.fillText('Perpendicular to both current and B', plateX + 216, plateY + 126);

        // z-direction marker: dot means toward viewer, X means into the page
        const markerX = plateX + plateW + 20;
        const markerY = plateY + 58;
        ctx.beginPath();
        ctx.arc(markerX, markerY, 11, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.fill();
        ctx.strokeStyle = sideAccumTowardViewer ? 'rgba(32,111,212,0.95)' : 'rgba(221,125,45,0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (sideAccumTowardViewer) {
          ctx.beginPath();
          ctx.arc(markerX, markerY, 3.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(32,111,212,0.95)';
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(221,125,45,0.95)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(markerX - 4.5, markerY - 4.5);
          ctx.lineTo(markerX + 4.5, markerY + 4.5);
          ctx.moveTo(markerX - 4.5, markerY + 4.5);
          ctx.lineTo(markerX + 4.5, markerY - 4.5);
          ctx.stroke();
        }
      }

      // static guide labels
      ctx.fillStyle = '#3D5874';
      ctx.font = '600 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('x', plateX + 18, plateY + 77);
      ctx.fillText('y', plateX + 20, plateY + 8);
      ctx.fillText('z', plateX + plateW + 44, plateY + 18);

      if (BOn && currentOn && showVh) {
        ctx.fillStyle = '#188E5B';
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillText(hallVoltageText, plateX + 540, plateY + 108);
        const barW = 82 + accumulationStrength * 62;
        const gradient = ctx.createLinearGradient(plateX + 518, plateY + 88, plateX + 518 + barW, plateY + 88);
        gradient.addColorStop(0, 'rgba(29, 168, 104, 0.12)');
        gradient.addColorStop(1, 'rgba(29, 168, 104, 0.90)');
        roundRect(ctx, plateX + 518, plateY + 66, barW, 22, 11);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(29, 168, 104, 0.55)';
        ctx.stroke();
      }

      if (currentOn) {
        ctx.fillStyle = 'rgba(27, 142, 91, 0.90)';
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillText(
          isN ? 'n-type: electron flow right -> left' : 'p-type: hole flow left -> right',
          84,
          332
        );
      }

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [BOn, currentOn, B, hallVoltageText, matType, showVh]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />;
}

const HallCoefficientSimulation = () => {
  const [matKey, setMatKey] = useState('si');
  const [coilI, setCoilI] = useState(5);
  const [I_mA, setI_mA] = useState(10);
  const [thickness, setThickness] = useState(1);
  const [fieldOn, setFieldOn] = useState(true);
  const [currentOn, setCurrentOn] = useState(true);
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
  const showVh = mat.type === 'p' || Boolean(studentValues.hallVoltage && studentValues.hallVoltage.trim());

  useEffect(() => {
    setAnswerState({});
    setStudentValues({});
  }, [matKey]);

  const resetAll = () => {
    setMatKey('si');
    setCoilI(5);
    setI_mA(10);
    setThickness(1);
    setFieldOn(true);
    setCurrentOn(true);
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
            padding: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <TogglePill label="Magnetic Field On/Off" active={fieldOn} onClick={() => setFieldOn((prev) => !prev)} />
            <TogglePill label="Current On/Off" active={currentOn} onClick={() => setCurrentOn((prev) => !prev)} />
          </div>
          <HallPlateCanvas
            matType={mat.type}
            BOn={fieldOn}
            currentOn={currentOn}
            B={B}
            showVh={showVh}
            hallVoltageText={showVh ? `${fmtVhValue(Vh)} mV` : '---'}
          />
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
