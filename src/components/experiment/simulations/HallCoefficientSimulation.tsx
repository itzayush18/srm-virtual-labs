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

function HallCanvas2D({ matType, BOn, currentOn, showVh, hallVoltageText }) {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrame = 0;
    let lastTime = performance.now();
    const particles = [];
    const fieldLines = [];
    const lineCount = 8;
    const width = 940;
    const height = 320;
    canvas.width = width;
    canvas.height = height;

    for (let i = 0; i < lineCount; i += 1) {
      fieldLines.push({
        x: 170 + i * 78,
        phase: Math.random() * Math.PI * 2,
        speed: 0.9 + Math.random() * 0.6,
      });
    }

    const resetParticle = (particle) => {
      particle.x = 860 + Math.random() * 70;
      particle.y = 161 + (Math.random() - 0.5) * 18;
      particle.vx = -(62 + Math.random() * 44);
      particle.vy = 0;
    };

    for (let i = 0; i < 22; i += 1) {
      const particle = {};
      resetParticle(particle);
      particle.x -= i * 34;
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
      conductorGradient.addColorStop(1, '#F2F7FC');
      ctx.fillStyle = conductorGradient;
      roundRect(ctx, 88, 48, 524, 30, 15);
      ctx.fill();
      ctx.strokeStyle = '#8BB2D9';
      ctx.stroke();

      ctx.fillStyle = '#3C5875';
      ctx.font = '600 13px Segoe UI, Arial, sans-serif';
      ctx.fillText('Thin Hall conductor', 248, 38);

      if (currentOn) {
        for (const particle of particles) {
          particle.x += particle.vx * delta;

          if (BOn) {
            const isN = matType === 'n';
            const upward = isN ? 1 : -1;
            particle.vy += upward * 54 * delta;
            particle.vy += ((isN ? 58 : 68) - particle.y) * 0.02 * delta;
          } else {
            particle.vy += (63 - particle.y) * 0.10 * delta;
          }

          particle.y += particle.vy * delta;

          if (particle.x < 88) resetParticle(particle);
          if (particle.y < 53) particle.y = 53;
          if (particle.y > 77) particle.y = 77;
        }
      }

      const hallChargeStrength = BOn && currentOn ? Math.min(1, Math.max(0, 0.2 + Math.abs(B) * 160)) : 0;
      const isN = matType === 'n';
      const majorityColor = isN ? '32, 111, 212' : '221, 125, 45';
      const topChargeColor = isN ? '221, 125, 45' : '32, 111, 212';
      const accumulateTop = !isN;

      if (BOn) {
        const fieldTop = 20;
        const fieldBottom = 100;
        for (const line of fieldLines) {
          line.phase += delta * line.speed;
          const wobble = Math.sin(line.phase) * 2;
          const x = line.x + wobble;
          const grad = ctx.createLinearGradient(x, fieldTop, x, fieldBottom);
          grad.addColorStop(0, 'rgba(22, 124, 74, 0.08)');
          grad.addColorStop(0.45, 'rgba(22, 124, 74, 0.78)');
          grad.addColorStop(1, 'rgba(22, 124, 74, 0.08)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.9;
          ctx.beginPath();
          ctx.moveTo(x, fieldTop);
          ctx.lineTo(x, fieldBottom);
          ctx.stroke();

          ctx.fillStyle = 'rgba(22, 124, 74, 0.82)';
          ctx.beginPath();
          ctx.moveTo(x - 4, fieldTop + 6);
          ctx.lineTo(x + 4, fieldTop + 6);
          ctx.lineTo(x, fieldTop);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x - 4, fieldBottom - 6);
          ctx.lineTo(x + 4, fieldBottom - 6);
          ctx.lineTo(x, fieldBottom);
          ctx.closePath();
          ctx.fill();
        }
      }

      for (const particle of particles) {
        const collectBoost = BOn && currentOn ? 1 - Math.min(1, Math.abs(particle.y - (accumulateTop ? 57 : 73)) / 18) : 0;
        drawGlow(particle.x, particle.y, 13, majorityColor, 0.07 + collectBoost * 0.10);
        ctx.fillStyle = `rgba(${majorityColor}, 0.95)`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 4.0, 0, Math.PI * 2);
        ctx.fill();
      }

      const edgeYTop = 55;
      const edgeYBottom = 73;
      const topAccum = BOn && currentOn && accumulateTop ? hallChargeStrength : 0;
      const bottomAccum = BOn && currentOn && !accumulateTop ? hallChargeStrength : 0;
      const oppositeAccum = BOn && currentOn ? Math.max(0.18, 0.62 - hallChargeStrength * 0.28) : 0;

      if (BOn) {
        drawGlow(322, 47, 54, '37, 165, 104', 0.16 + hallChargeStrength * 0.22);
        drawGlow(322, 77, 54, '37, 165, 104', 0.16 + hallChargeStrength * 0.22);
      }

      if (BOn && currentOn) {
        ctx.fillStyle = 'rgba(37,165,104,0.18)';
        roundRect(ctx, 598, 36, 120, 24, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(37,165,104,0.40)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#15935A';
        ctx.font = '700 12px Segoe UI, Arial, sans-serif';
        ctx.fillText('Hall Voltage', 618, 53);

        const topMajority = accumulateTop;
        const topColor = `rgba(${topChargeColor}, ${0.35 + topAccum * 0.55})`;
        const bottomColor = `rgba(${majorityColor}, ${0.35 + bottomAccum * 0.55})`;

        for (let i = 0; i < 11; i += 1) {
          const x = 92 + i * 48 + Math.sin(time / 220 + i) * 2;
          const y = topMajority ? edgeYTop : edgeYBottom;
          drawGlow(x, y, 15, topMajority ? topChargeColor : majorityColor, 0.10 + topAccum * 0.14);
          ctx.fillStyle = topMajority ? topColor : bottomColor;
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let i = 0; i < 11; i += 1) {
          const x = 92 + i * 48 + Math.cos(time / 260 + i) * 2;
          const y = topMajority ? edgeYBottom : edgeYTop;
          drawGlow(x, y, 10, isN ? '221, 125, 45' : '32, 111, 212', 0.06 + oppositeAccum * 0.10);
          ctx.fillStyle = `rgba(${isN ? '221, 125, 45' : '32, 111, 212'}, ${0.25 + oppositeAccum * 0.35})`;
          ctx.beginPath();
          ctx.arc(x, y, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
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

      if (BOn && currentOn && showVh) {
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillStyle = '#188E5B';
        ctx.fillText(hallVoltageText, 620, 72);
        const barW = 68 + hallChargeStrength * 58;
        const gradient = ctx.createLinearGradient(612, 102, 612 + barW, 102);
        gradient.addColorStop(0, 'rgba(29, 168, 104, 0.12)');
        gradient.addColorStop(1, 'rgba(29, 168, 104, 0.88)');
        roundRect(ctx, 612, 82, barW, 22, 11);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(29, 168, 104, 0.55)';
        ctx.stroke();
      }

      ctx.restore();

      ctx.fillStyle = '#3A536D';
      ctx.font = '600 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('Magnetic field: vertical lines pass through the conductor', 84, 24);

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [BOn, currentOn, hallVoltageText]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />;
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
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {row.value}
          <span style={{ marginLeft: 6, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>{row.unit}</span>
        </span>
      );
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600 }}>{row.unit}</span>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <input
        type="text"
        inputMode="decimal"
        value={studentValue}
        onChange={(e) => onStudentChange(e.target.value)}
        placeholder="Enter value"
        style={{
          flex: 1,
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 8,
          padding: '7px 9px',
          fontSize: 11,
          background: 'var(--color-background-primary)',
          color: 'var(--color-text-primary)',
        }}
      />
      <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {row.unit}
      </span>
    </span>
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
      unit: 'T',
    },
    {
      key: 'hallVoltage',
      label: 'Hall voltage V_H',
      formula: 'V_H = R_H × I × B / t',
      value: fmtVh(data.Vh),
      unit: 'mV',
    },
    {
      key: 'hallCoeff',
      label: 'Hall coefficient R_H',
      formula: 'R_H = V_H × t / (I × B)',
      value: fmtSci(data.measuredRh, 'm³/C'),
      unit: 'm³/C',
    },
    {
      key: 'carrierDensity',
      label: 'Carrier density n',
      formula: 'n(T) from material model',
      value: fmtDensityWithAltUnit(data.carrierDensity),
      unit: 'cm⁻³ / m⁻³',
    },
    {
      key: 'hallMobility',
      label: 'Hall mobility μ_H',
      formula: 'μ_H = |R_H| × σ',
      value: fmtSci(data.muH, 'm²/V·s'),
      unit: 'm²/V·s',
    },
    {
      key: 'mobility',
      label: 'Carrier mobility μ',
      formula: 'μ(T) from material model',
      value: fmtSci(data.mobility, 'm²/V·s'),
      unit: 'm²/V·s',
    },
    {
      key: 'conductivity',
      label: 'Conductivity σ',
      formula: 'σ = q × n × μ',
      value: fmtSci(data.sigma, 'S/m'),
      unit: 'S/m',
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
          <HallCanvas2D
            matType={mat.type}
            BOn={fieldOn}
            currentOn={currentOn}
            showVh={showVh}
            hallVoltageText={showVh ? fmtVh(Vh) : '---'}
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
