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
        border: `1px solid ${active ? '#1B8E5B' : 'var(--color-border-secondary)'}`,
        background: active ? 'rgba(27, 142, 91, 0.12)' : 'var(--color-background-secondary)',
        color: active ? '#166B45' : 'var(--color-text-secondary)',
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </button>
  );
}

function HallCanvas2D({ BOn, currentOn, showVh, hallVoltageText }) {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrame = 0;
    let lastTime = performance.now();
    const particles = [];
    const fieldDots = [];
    const dotCount = 48;
    const width = 940;
    const height = 320;
    canvas.width = width;
    canvas.height = height;

    for (let i = 0; i < dotCount; i += 1) {
      fieldDots.push({
        x: 120 + Math.random() * 700,
        y: 34 + Math.random() * 236,
        r: 1.1 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.7 + Math.random() * 1.4,
      });
    }

    const resetParticle = (particle) => {
      particle.x = 820 + Math.random() * 90;
      particle.y = 160 + (Math.random() - 0.5) * 22;
      particle.vx = -(55 + Math.random() * 40);
      particle.vy = 0;
      particle.spin = Math.random() * Math.PI * 2;
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
      bg.addColorStop(0, '#F9FCFF');
      bg.addColorStop(1, '#EEF4FA');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#D9E7F5';
      ctx.fillRect(0, 0, width, 18);

      ctx.save();
      ctx.translate(0, 0);
      for (const d of fieldDots) {
        if (BOn) {
          d.phase += delta * d.speed;
          const pulse = 0.5 + 0.5 * Math.sin(d.phase);
          const x = d.x + Math.sin(d.phase * 0.8) * 5;
          const y = d.y + Math.cos(d.phase * 0.6) * 4;
          drawGlow(x, y, d.r * 7.2, '21, 111, 89', 0.12 + pulse * 0.17);
          ctx.fillStyle = `rgba(33,111,89,${0.35 + pulse * 0.38})`;
          ctx.beginPath();
          ctx.arc(x, y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.translate(120, 92);
      const bodyGradient = ctx.createLinearGradient(0, 0, 0, 126);
      bodyGradient.addColorStop(0, '#F8FBFF');
      bodyGradient.addColorStop(1, '#DDEAF7');
      ctx.fillStyle = bodyGradient;
      roundRect(ctx, 0, 0, 700, 126, 18);
      ctx.fill();
      ctx.strokeStyle = '#8BA7C3';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const conductorGradient = ctx.createLinearGradient(0, 0, 700, 0);
      conductorGradient.addColorStop(0, '#FFFFFF');
      conductorGradient.addColorStop(1, '#EAF3FB');
      ctx.fillStyle = conductorGradient;
      roundRect(ctx, 78, 49, 544, 28, 14);
      ctx.fill();
      ctx.strokeStyle = '#8BB2D9';
      ctx.stroke();

      ctx.fillStyle = '#3C5875';
      ctx.font = '600 13px Segoe UI, Arial, sans-serif';
      ctx.fillText('Thin Hall conductor', 250, 38);

      ctx.fillStyle = 'rgba(28, 121, 180, 0.12)';
      roundRect(ctx, 82, 53, 536, 20, 10);
      ctx.fill();

      if (currentOn) {
        for (const particle of particles) {
          particle.x += particle.vx * delta;

          if (BOn) {
            const centerY = 63;
            const verticalTarget = 16;
            particle.vy += (verticalTarget - (particle.y - centerY)) * 0.7 * delta;
            particle.vy += 55 * delta;
          } else {
            particle.vy += (63 - particle.y) * 0.1 * delta;
          }

          particle.y += particle.vy * delta;
          particle.spin += delta * 7;

          if (particle.x < 84) resetParticle(particle);
          if (particle.y < 56) particle.y = 56;
          if (particle.y > 98) particle.y = 98;
        }
      }

      const hallChargeStrength = BOn && currentOn ? Math.min(1, Math.max(0, 0.12 + Math.abs(B) * 200)) : 0;
      const hallGlowX = 640;
      const hallGlowY = 110;

      if (BOn && currentOn) {
        drawGlow(hallGlowX, hallGlowY, 64, '24, 158, 105', 0.35);
        ctx.strokeStyle = 'rgba(24, 160, 102, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(602, 63);
        ctx.quadraticCurveTo(670, 63, 690, 63);
        ctx.stroke();
      }

      for (const particle of particles) {
        const localY = particle.y;
        const distBottom = Math.max(0, localY - 79);
        const collectBoost = BOn && currentOn ? Math.min(1, distBottom / 22) : 0;
        const particleColor = '32, 111, 212';
        drawGlow(particle.x, particle.y, 14, particleColor, 0.08 + collectBoost * 0.12);
        ctx.fillStyle = `rgba(${particleColor}, 0.95)`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 4.1, 0, Math.PI * 2);
        ctx.fill();
      }

      if (BOn && currentOn) {
        ctx.fillStyle = 'rgba(37, 165, 104, 0.12)';
        roundRect(ctx, 612, 52, 72, 22, 10);
        ctx.fill();
        ctx.fillStyle = 'rgba(37, 165, 104, 0.55)';
        ctx.beginPath();
        ctx.moveTo(612, 63);
        ctx.lineTo(620, 54);
        ctx.lineTo(620, 72);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(678, 63);
        ctx.lineTo(670, 54);
        ctx.lineTo(670, 72);
        ctx.closePath();
        ctx.fill();
      }

      const bottomCount = BOn && currentOn ? 10 : 0;
      for (let i = 0; i < bottomCount; i += 1) {
        const x = 160 + i * 46 + Math.sin(time / 340 + i) * 4;
        const y = 88 + Math.sin(time / 260 + i * 0.8) * 2;
        drawGlow(x, y, 18, '35, 165, 104', 0.12);
        ctx.fillStyle = 'rgba(37, 165, 104, 0.88)';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#C5D6E7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(90, 63);
      ctx.lineTo(82, 63);
      ctx.stroke();

      ctx.fillStyle = '#6C849D';
      ctx.font = '600 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('Current direction', 88, 36);
      ctx.fillText('B-field dots', 112, 20);

      if (BOn && currentOn) {
        ctx.font = '700 12px Segoe UI, Arial, sans-serif';
        ctx.fillStyle = '#1B8E5B';
        ctx.shadowColor = 'rgba(27, 142, 91, 0.4)';
        ctx.shadowBlur = 12;
        ctx.fillText('Hall Voltage', hallGlowX - 26, hallGlowY + 4);
        ctx.shadowBlur = 0;
        ctx.font = '700 11px Segoe UI, Arial, sans-serif';
        ctx.fillStyle = '#188E5B';
        ctx.fillText(hallVoltageText, 613, 85);
        const barW = 56 + hallChargeStrength * 58;
        const gradient = ctx.createLinearGradient(612, 104, 612 + barW, 104);
        gradient.addColorStop(0, 'rgba(29, 168, 104, 0.15)');
        gradient.addColorStop(1, 'rgba(29, 168, 104, 0.85)');
        roundRect(ctx, 612, 92, barW, 20, 10);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(29, 168, 104, 0.55)';
        ctx.stroke();
      }

      ctx.restore();

      ctx.fillStyle = '#3A536D';
      ctx.font = '600 11px Segoe UI, Arial, sans-serif';
      ctx.fillText('Magnetic field: glowing dots show B passing through the conductor', 84, 24);

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
