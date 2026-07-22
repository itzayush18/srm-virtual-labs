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

function fmtSciValue(v) {
  if (!Number.isFinite(v)) return '--';
  if (v === 0) return '0';
  return Number(v).toExponential(2).replace('e+', 'e');
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
      Exercise: compare n-type and p-type results. Note the sign of Hall voltage and identify the majority carrier.
      Then repeat the experiment with a larger thickness and observe that Hall voltage decreases as thickness increases.
    </div>
  );
}

function TableCellValue({ row, isPType, studentValue, onStudentChange, revealed, onReveal }) {
  if (isPType) {
    if (revealed) {
      return (
        <span
          style={{
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace',
          }}
        >
          {row.value}
        </span>
      );
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
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace',
      }}
    />
  );
}

function MeasurementTable({ mat, data, answerState, setAnswerState, studentValues, setStudentValues }) {
  const isPTypeExercise = mat.type === 'p';

  const rows = [
    {
      key: 'bField',
      label: 'Magnetic field B',
      formula: 'B = 4*pi x 10^-7 x N x Icoil / L',
      value: fmtBValue(data.B),
      unit: 'T',
    },
    {
      key: 'hallVoltage',
      label: 'Hall voltage V_H',
      formula: 'V_H = R_H x I x B / t',
      value: fmtVhValue(data.Vh),
      unit: 'mV',
    },
    {
      key: 'hallCoeff',
      label: 'Hall coefficient R_H',
      formula: 'R_H = V_H x t / (I x B)',
      value: fmtSciValue(data.measuredRh),
      unit: 'm^3/C',
    },
    {
      key: 'carrierDensity',
      label: 'Carrier density n',
      formula: 'n(T) from material model',
      value: fmtDensityValue(data.carrierDensity),
      unit: 'cm^-3 / m^-3',
    },
    {
      key: 'mobility',
      label: 'Carrier mobility mu',
      formula: 'mu(T) from material model',
      value: fmtSciValue(data.mobility),
      unit: 'm^2/(V*s)',
    },
    {
      key: 'conductivity',
      label: 'Conductivity sigma',
      formula: 'sigma = q x n x mu',
      value: fmtSciValue(data.sigma),
      unit: 'S/m',
    },
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
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

function HallCanvas2D({ matType, BOn, currentOn, B, showVh, hallVoltageText }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrame = 0;
    let lastTime = performance.now();
    const particles = [];
    const fieldLines = [];
    const lineCount = 10;
    const width = 940;
    const height = 320;
    canvas.width = width;
    canvas.height = height;

    for (let i = 0; i < lineCount; i += 1) {
      fieldLines.push({
        x: 160 + i * 70,
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 0.7,
      });
    }

    const resetParticle = (particle, offset = 0) => {
      particle.x = matType === 'p' ? 88 - offset : 860 + Math.random() * 70 - offset;
      particle.y = 64 + (matType === 'p' ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 18);
      particle.vx = (matType === 'p' ? 1 : -1) * (70 + Math.random() * 36);
      particle.vy = 0;
    };

    for (let i = 0; i < 24; i += 1) {
      const particle = {};
      resetParticle(particle, i * 22);
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

    const drawArrow = (x1, y1, x2, y2, color) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const size = 7;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
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
      ctx.fillRect(0, 0, width, 20);

      ctx.save();
      ctx.translate(120, 98);

      const bodyGradient = ctx.createLinearGradient(0, 0, 0, 122);
      bodyGradient.addColorStop(0, '#F9FCFF');
      bodyGradient.addColorStop(1, '#DDEBF8');
      ctx.fillStyle = bodyGradient;
      roundRect(ctx, 0, 0, 700, 122, 18);
      ctx.fill();
      ctx.strokeStyle = '#8BA7C3';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const conductorGradient = ctx.createLinearGradient(0, 0, 700, 0);
      conductorGradient.addColorStop(0, '#FFFFFF');
      conductorGradient.addColorStop(0.5, '#FBFDFF');
      conductorGradient.addColorStop(1, '#F2F7FC');
      ctx.fillStyle = conductorGradient;
      roundRect(ctx, 88, 44, 524, 38, 18);
      ctx.fill();
      ctx.strokeStyle = '#8BB2D9';
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      roundRect(ctx, 92, 55, 516, 16, 8);
      ctx.fill();

      ctx.fillStyle = '#3C5875';
      ctx.font = '600 13px Segoe UI, Arial, sans-serif';
      ctx.fillText('Thin Hall conductor', 248, 38);

      const isN = matType === 'n';
      const hallSign = isN ? 1 : -1;
      const forceTowardTop = !isN;
      const edgeYTop = 51;
      const edgeYBottom = 77;
      const centerY = 64;
      const trackMinY = 47;
      const trackMaxY = 81;
      const carrierColor = isN ? '32, 111, 212' : '221, 125, 45';
      const oppositeColor = isN ? '221, 125, 45' : '32, 111, 212';
      const chargeEdgeY = forceTowardTop ? edgeYTop : edgeYBottom;
      const accumulationStrength = BOn && currentOn ? Math.min(1, Math.max(0, 0.25 + Math.abs(B) * 120)) : 0;

      if (BOn) {
        const fieldTop = 18;
        const fieldBottom = 102;
        for (const line of fieldLines) {
          line.phase += delta * line.speed;
          const wobble = Math.sin(line.phase + time / 260) * 6;
          const x = line.x + wobble;
          const grad = ctx.createLinearGradient(x, fieldTop, x, fieldBottom);
          grad.addColorStop(0, 'rgba(22, 124, 74, 0.06)');
          grad.addColorStop(0.45, 'rgba(22, 124, 74, 0.88)');
          grad.addColorStop(1, 'rgba(22, 124, 74, 0.06)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, fieldTop);
          ctx.lineTo(x, fieldBottom);
          ctx.stroke();

          ctx.fillStyle = 'rgba(22, 124, 74, 0.85)';
          ctx.beginPath();
          ctx.moveTo(x - 4, fieldTop + 7);
          ctx.lineTo(x + 4, fieldTop + 7);
          ctx.lineTo(x, fieldTop);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x - 4, fieldBottom - 7);
          ctx.lineTo(x + 4, fieldBottom - 7);
          ctx.lineTo(x, fieldBottom);
          ctx.closePath();
          ctx.fill();
        }

        drawArrow(220, 73, 220, 50, 'rgba(22, 124, 74, 0.9)');
        ctx.fillStyle = 'rgba(22, 124, 74, 0.95)';
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillText('B', 230, 58);
      }

      if (currentOn) {
        for (const particle of particles) {
          particle.x += particle.vx * delta;

          if (BOn) {
            particle.vy += hallSign * 95 * delta;
            particle.vy += (chargeEdgeY - particle.y) * 0.095 * delta;
          } else {
            particle.vy += (centerY - particle.y) * 0.12 * delta;
          }

          particle.y += particle.vy * delta;
          particle.vy *= 0.98;

          if (matType === 'p') {
            if (particle.x > 612) resetParticle(particle, 0);
          } else if (particle.x < 88) {
            resetParticle(particle, 0);
          }

          if (currentOn && !BOn) {
            particle.y = centerY;
            particle.vy = 0;
          } else {
            if (matType === 'p' && BOn) {
              particle.y = Math.min(particle.y, centerY + 1);
            }
            if (particle.y < trackMinY) particle.y = trackMinY;
            if (particle.y > trackMaxY) particle.y = trackMaxY;
          }
        }
      }

      if (currentOn) {
        for (let i = 0; i < 5; i += 1) {
          const x = 120 + ((time / 18 + i * 130) % 450);
          const y = 63 + Math.sin(time / 180 + i) * 2;
          drawArrow(x, y, x + 42, y, 'rgba(24, 95, 165, 0.45)');
        }
      }

      for (const particle of particles) {
        const centerBias = BOn && currentOn ? 1 - Math.min(1, Math.abs(particle.y - chargeEdgeY) / 18) : 0;
        drawGlow(particle.x, particle.y, 14, carrierColor, 0.08 + centerBias * 0.14);
        ctx.fillStyle = `rgba(${carrierColor}, ${currentOn ? 0.96 : 0.25})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 4.0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (currentOn && !BOn) {
        ctx.strokeStyle = 'rgba(24, 95, 165, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(92, centerY);
        ctx.lineTo(612, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (BOn && currentOn) {
        const topDensity = forceTowardTop ? accumulationStrength : Math.max(0.18, 0.55 - accumulationStrength * 0.25);
        const bottomDensity = forceTowardTop ? Math.max(0.18, 0.55 - accumulationStrength * 0.25) : accumulationStrength;

        ctx.fillStyle = 'rgba(37,165,104,0.18)';
        roundRect(ctx, 598, 36, 120, 24, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(37,165,104,0.40)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#15935A';
        ctx.font = '700 12px Segoe UI, Arial, sans-serif';
        ctx.fillText('Hall Voltage', 618, 53);

        for (let i = 0; i < 11; i += 1) {
          const x = 92 + i * 48 + Math.sin(time / 220 + i) * 2;
          const y = forceTowardTop ? edgeYTop : edgeYBottom;
          drawGlow(x, y, 15, forceTowardTop ? oppositeColor : carrierColor, 0.11 + accumulationStrength * 0.12);
          ctx.fillStyle = forceTowardTop
            ? `rgba(${oppositeColor}, ${0.28 + topDensity * 0.50})`
            : `rgba(${carrierColor}, ${0.28 + bottomDensity * 0.50})`;
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let i = 0; i < 11; i += 1) {
          const x = 92 + i * 48 + Math.cos(time / 260 + i) * 2;
          const y = forceTowardTop ? edgeYBottom : edgeYTop;
          drawGlow(x, y, 10, forceTowardTop ? carrierColor : oppositeColor, 0.07 + (1 - accumulationStrength) * 0.08);
          ctx.fillStyle = `rgba(${forceTowardTop ? carrierColor : oppositeColor}, ${0.22 + (1 - accumulationStrength) * 0.30})`;
          ctx.beginPath();
          ctx.arc(x, y, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }

        const fx = 332;
        const fy = forceTowardTop ? 52 : 72;
        drawArrow(fx, 63, fx, fy, 'rgba(27, 142, 91, 0.9)');
        ctx.fillStyle = 'rgba(27, 142, 91, 0.9)';
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillText('F_L', fx + 8, forceTowardTop ? 56 : 76);
      } else if (BOn) {
        drawGlow(322, 47, 54, '37, 165, 104', 0.14);
        drawGlow(322, 77, 54, '37, 165, 104', 0.14);
      }

      ctx.strokeStyle = '#C5D6E7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(90, 63);
      ctx.lineTo(82, 63);
      ctx.stroke();

      ctx.fillStyle = '#6C849D';
      ctx.font = '600 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('I', 88, 39);
      ctx.fillText('B', 170, 24);

      if (currentOn && BOn) {
        ctx.fillStyle = 'rgba(24, 142, 91, 0.92)';
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillText(forceTowardTop ? 'Lorentz force upward' : 'Lorentz force downward', 390, 38);
      }

      if (BOn && currentOn && showVh) {
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillStyle = '#188E5B';
        ctx.fillText(hallVoltageText, 620, 72);
      }

      ctx.restore();

      ctx.fillStyle = '#3A536D';
      ctx.font = '600 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('Magnetic field: animated vertical lines while B is on', 84, 24);

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
  const studentHallVoltage = (studentValues.hallVoltage || '').trim();
  const showVh = mat.type === 'p' || Boolean(studentHallVoltage);
  const hallVoltageDisplay = mat.type === 'n' ? studentHallVoltage || '---' : `${fmtVhValue(Vh)} mV`;

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
            Magnetic field: B = 4*pi x 10^-7 x N x Icoil / L
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
          <HallCanvas2D
            matType={mat.type}
            BOn={fieldOn}
            currentOn={currentOn}
            B={B}
            showVh={showVh}
            hallVoltageText={hallVoltageDisplay}
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
