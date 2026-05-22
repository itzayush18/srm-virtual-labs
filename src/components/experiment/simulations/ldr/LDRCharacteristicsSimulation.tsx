import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SOURCE_VOLTAGES = [2.5, 5, 7.5, 10, 12.5];
const DISTANCES = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20];
const GRAPH_DISTANCES = [5, 10, 15];

const MAX_SOURCE_VOLTAGE = 12.5;
const REFERENCE_DISTANCE = 2.5;

const LIGHT_SOURCES = {
  incandescent: {
    label: 'Incandescent Lamp',
    multiplier: 1,
    accent: '#f59e0b',
    glowCore: '#fde68a',
    glowOuter: 'rgba(245, 158, 11, 0.45)',
    beamColor: 'rgba(250, 204, 21, 0.28)',
    panel: 'linear-gradient(135deg, #fff7d6, #ffedd5)',
    summary: 'Warm yellow light with moderate intensity and broad illumination.',
    symbol: '💡',
    sourceLabel: 'Bulb',
  },
  led: {
    label: 'White LED',
    multiplier: 1.18,
    accent: '#2563eb',
    glowCore: '#dbeafe',
    glowOuter: 'rgba(59, 130, 246, 0.42)',
    beamColor: 'rgba(96, 165, 250, 0.28)',
    panel: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    summary: 'Focused cool white light that produces slightly higher useful flux at the LDR.',
    symbol: '🔵',
    sourceLabel: 'LED',
  },
  sunlight: {
    label: 'Sunlight',
    multiplier: 1.45,
    accent: '#eab308',
    glowCore: '#fef08a',
    glowOuter: 'rgba(234, 179, 8, 0.42)',
    beamColor: 'rgba(253, 224, 71, 0.30)',
    panel: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    summary: 'High-intensity natural light that gives the strongest photoresponse in this model.',
    symbol: '☀️',
    sourceLabel: 'Sun',
  },
  colored: {
    label: 'Colored Light',
    multiplier: 0.82,
    accent: '#a855f7',
    glowCore: '#f5d0fe',
    glowOuter: 'rgba(168, 85, 247, 0.42)',
    beamColor: 'rgba(192, 132, 252, 0.28)',
    panel: 'linear-gradient(135deg, #fdf2f8, #ede9fe)',
    summary: 'Filtered colored illumination with lower effective intensity reaching the LDR.',
    symbol: '🌈',
    sourceLabel: 'RGB',
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d7deea',
  borderRadius: 18,
  padding: 22,
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 8,
  color: '#0f172a',
  fontSize: 22,
};

const labelStyle = {
  display: 'block',
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 8,
  color: '#24324a',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  fontSize: 14,
  boxSizing: 'border-box',
};

const readOnlyStyle = {
  ...inputStyle,
  background: '#f8fafc',
};

const chartMargins = { top: 12, right: 18, bottom: 28, left: 28 };

const createInitialCarrierInputs = () => {
  const initial = {};
  SOURCE_VOLTAGES.forEach((voltage) => {
    initial[voltage] = { 5: '', 10: '', 15: '' };
  });
  return initial;
};

export default function App() {
  const [sourceVoltage, setSourceVoltage] = useState(7.5);
  const [distance, setDistance] = useState(10);
  const [biasVoltage, setBiasVoltage] = useState(5);
  const [lightSource, setLightSource] = useState('incandescent');

  const [darkVoltmeterReading, setDarkVoltmeterReading] = useState(5);
  const [darkAmmeterReading, setDarkAmmeterReading] = useState(0.05);

  const [carrierInputs, setCarrierInputs] = useState(createInitialCarrierInputs);

  const selectedLightSource = LIGHT_SOURCES[lightSource];

  const darkResistance = useMemo(() => {
    if (darkAmmeterReading <= 0) {
      return 100;
    }
    return darkVoltmeterReading / darkAmmeterReading;
  }, [darkVoltmeterReading, darkAmmeterReading]);

  const computeLightFlux = (lampVoltage, ldrDistance, source = lightSource) => {
    const voltageFactor = lampVoltage / MAX_SOURCE_VOLTAGE;
    const distanceFactor = Math.pow(REFERENCE_DISTANCE / ldrDistance, 2);
    return voltageFactor * distanceFactor * LIGHT_SOURCES[source].multiplier;
  };

  const computeCarrierGeneration = (lampVoltage, ldrDistance, source = lightSource) => {
    const flux = computeLightFlux(lampVoltage, ldrDistance, source);
    return flux * 100;
  };

  const computeResistance = (lampVoltage, ldrDistance, source = lightSource) => {
    const carriers = computeCarrierGeneration(lampVoltage, ldrDistance, source);
    const normalizedCarriers = carriers / 100;
    const illuminatedResistance = darkResistance / (1 + 8 * normalizedCarriers);
    return clamp(illuminatedResistance, 0.5, darkResistance);
  };

  const lightFlux = useMemo(
    () => computeLightFlux(sourceVoltage, distance, lightSource),
    [sourceVoltage, distance, lightSource]
  );

  const carrierGeneration = useMemo(
    () => computeCarrierGeneration(sourceVoltage, distance, lightSource),
    [sourceVoltage, distance, lightSource]
  );

  const resistance = useMemo(
    () => computeResistance(sourceVoltage, distance, lightSource),
    [sourceVoltage, distance, lightSource, darkResistance]
  );

  const current = useMemo(() => {
    if (resistance <= 0) {
      return 0;
    }
    return biasVoltage / resistance;
  }, [biasVoltage, resistance]);

  const distanceResistanceData = useMemo(
    () =>
      DISTANCES.map((d) => ({
        distance: d,
        resistance: Number(computeResistance(sourceVoltage, d, lightSource).toFixed(2)),
      })),
    [sourceVoltage, darkResistance, lightSource]
  );

  const manualCarrierGraphData = useMemo(
    () =>
      SOURCE_VOLTAGES.map((voltage) => {
        const row = carrierInputs[voltage] || {};
        return {
          sourceVoltage: voltage,
          carriers5: row[5] === '' ? null : Number(row[5]),
          carriers10: row[10] === '' ? null : Number(row[10]),
          carriers15: row[15] === '' ? null : Number(row[15]),
        };
      }),
    [carrierInputs]
  );

  const handleCarrierInputChange = (voltage, distanceValue, value) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setCarrierInputs((prev) => ({
      ...prev,
      [voltage]: {
        ...prev[voltage],
        [distanceValue]: value,
      },
    }));
  };

  const voltageVisualFactor = sourceVoltage / MAX_SOURCE_VOLTAGE;
  const distanceVisualFactor = 1 - (distance - REFERENCE_DISTANCE) / (20 - REFERENCE_DISTANCE);
  const sourceVisualFactor = selectedLightSource.multiplier / 1.45;
  const visualStrength = clamp(
    voltageVisualFactor * 0.55 + distanceVisualFactor * 0.30 + sourceVisualFactor * 0.25,
    0.18,
    1.15
  );

  const glowScale = 70 + voltageVisualFactor * 110 + distanceVisualFactor * 40;
  const beamOpacity = clamp(0.12 + visualStrength * 0.68, 0.12, 0.92);
  const beamWidth = clamp(340 - distance * 9 + voltageVisualFactor * 55, 120, 340);
  const beamHeight = clamp(200 + voltageVisualFactor * 40 - distance * 2, 150, 260);
  const sourceScale = clamp(0.9 + voltageVisualFactor * 0.45, 0.9, 1.35);
  const sensorGlow = clamp(0.16 + lightFlux * 1.6, 0.16, 1);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(255,255,255,0.95), rgba(226,232,240,0.92) 45%, rgba(191,219,254,0.88) 100%)',
        padding: 24,
        fontFamily: '"Segoe UI", "Trebuchet MS", sans-serif',
        color: '#1e293b',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 34, color: '#0f172a' }}>
          LDR Characteristics Simulation
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, color: '#334155', lineHeight: 1.7 }}>
          Select a light source, tune the source voltage and distance, and watch how the LDR
          conductivity changes in real time. Students can calculate carrier generation from the
          formula and enter values in the table to plot the graph for 5 cm, 10 cm, and 15 cm.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))',
            gap: 24,
            alignItems: 'start',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Control Panel</h2>
              <p style={{ marginTop: 0, color: '#475569', lineHeight: 1.6 }}>
                {selectedLightSource.summary}
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Light Source Type</label>
                <select
                  value={lightSource}
                  onChange={(e) => setLightSource(e.target.value)}
                  style={inputStyle}
                >
                  {Object.entries(LIGHT_SOURCES).map(([key, source]) => (
                    <option key={key} value={key}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Light Source Voltage: {sourceVoltage.toFixed(1)} V</label>
                <input
                  type="range"
                  min={2.5}
                  max={12.5}
                  step={2.5}
                  value={sourceVoltage}
                  onChange={(e) => setSourceVoltage(Number(e.target.value))}
                  style={{ width: '100%', accentColor: selectedLightSource.accent }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Distance from Source: {distance.toFixed(1)} cm</label>
                <input
                  type="range"
                  min={2.5}
                  max={20}
                  step={2.5}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  style={{ width: '100%', accentColor: selectedLightSource.accent }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Bias Voltage for Measurement: {biasVoltage.toFixed(1)} V</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={biasVoltage}
                  onChange={(e) => setBiasVoltage(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0f766e' }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle}>Relative Light Flux</label>
                  <input value={lightFlux.toFixed(3)} readOnly style={readOnlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Carrier Generation</label>
                  <input value={carrierGeneration.toFixed(2)} readOnly style={readOnlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Resistance (kOhm)</label>
                  <input value={resistance.toFixed(2)} readOnly style={readOnlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Measured Current (mA)</label>
                  <input value={current.toFixed(3)} readOnly style={readOnlyStyle} />
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Carrier Generation Formula</h2>
              <div
                style={{
                  background: selectedLightSource.panel,
                  border: `1px solid ${selectedLightSource.accent}33`,
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <p style={{ marginTop: 0, marginBottom: 12, color: '#334155', lineHeight: 1.7 }}>
                  Students should calculate carrier generation using:
                </p>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #d7deea',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0f172a',
                    textAlign: 'center',
                  }}
                >
                  Carrier Generation = 100 × (Vs / 12.5) × (2.5 / d)^2 × S
                </div>
                <div style={{ marginTop: 14, color: '#475569', lineHeight: 1.7, fontSize: 14 }}>
                  <div>`Vs` = Source voltage of the light source</div>
                  <div>`d` = Distance between source and LDR in cm</div>
                  <div>`S` = Source multiplier for the selected light source</div>
                  <div>
                    Current multiplier for <strong>{selectedLightSource.label}</strong>:
                    {' '}
                    <strong>{selectedLightSource.multiplier}</strong>
                  </div>
                  <div>
                    Reference distance used in the model:
                    {' '}
                    <strong>2.5 cm</strong>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: 24 }}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>LDR Live Visual</h2>
              <div
                style={{
                  position: 'relative',
                  minHeight: 470,
                  borderRadius: 24,
                  overflow: 'hidden',
                  background:
                    'linear-gradient(180deg, rgba(14,165,233,0.14), rgba(226,232,240,0.22) 48%, rgba(15,23,42,0.08) 100%)',
                  border: '1px solid #dbe4f0',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 20% 18%, rgba(255,255,255,0.65), transparent 26%), radial-gradient(circle at 80% 12%, rgba(255,255,255,0.35), transparent 18%)',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: 34,
                    left: '50%',
                    transform: `translateX(-50%) scale(${sourceScale})`,
                    zIndex: 3,
                  }}
                >
                  {lightSource === 'incandescent' && (
                    <div style={{ position: 'relative', width: 118, height: 118 }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background: `radial-gradient(circle, ${selectedLightSource.glowCore} 0%, ${selectedLightSource.glowCore} 30%, rgba(255,255,255,0.45) 52%, rgba(255,255,255,0.06) 100%)`,
                          boxShadow: `0 0 ${glowScale}px ${selectedLightSource.glowOuter}`,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 20,
                          borderRadius: '50%',
                          background: 'linear-gradient(180deg, #fff7cc 0%, #fde68a 100%)',
                          border: '4px solid #f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 34,
                        }}
                      >
                        💡
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          bottom: -8,
                          transform: 'translateX(-50%)',
                          width: 34,
                          height: 24,
                          borderRadius: '0 0 10px 10px',
                          background: '#64748b',
                          border: '2px solid #475569',
                        }}
                      />
                    </div>
                  )}

                  {lightSource === 'sunlight' && (
                    <div style={{ position: 'relative', width: 132, height: 132 }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          boxShadow: `0 0 ${glowScale + 15}px ${selectedLightSource.glowOuter}`,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 18,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, #fef9c3 0%, #fde047 60%, #f59e0b 100%)',
                          border: '4px solid #eab308',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 34,
                        }}
                      >
                        ☀️
                      </div>
                    </div>
                  )}

                  {lightSource === 'led' && (
                    <div style={{ position: 'relative', width: 116, height: 116 }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          boxShadow: `0 0 ${glowScale}px ${selectedLightSource.glowOuter}`,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 18,
                          right: 18,
                          top: 12,
                          height: 62,
                          borderRadius: '60px 60px 22px 22px',
                          background: 'linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)',
                          border: '4px solid #60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 28,
                        }}
                      >
                        LED
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          left: 42,
                          bottom: 14,
                          width: 8,
                          height: 28,
                          background: '#94a3b8',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 42,
                          bottom: 14,
                          width: 8,
                          height: 28,
                          background: '#94a3b8',
                        }}
                      />
                    </div>
                  )}

                  {lightSource === 'colored' && (
                    <div style={{ position: 'relative', width: 126, height: 126 }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background:
                            'conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)',
                          boxShadow: `0 0 ${glowScale}px ${selectedLightSource.glowOuter}`,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 18,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.88)',
                          border: '4px solid #a855f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 28,
                        }}
                      >
                        🌈
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: 150,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: beamWidth,
                    height: beamHeight,
                    background: `linear-gradient(180deg, ${selectedLightSource.beamColor}, rgba(255,255,255,0.02))`,
                    clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)',
                    filter: `blur(${2 + voltageVisualFactor * 2}px)`,
                    opacity: beamOpacity,
                    zIndex: 1,
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: 56,
                    left: 28,
                    width: 190,
                    padding: 14,
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.88)',
                    border: '1px solid #dbe4f0',
                    boxShadow: '0 10px 20px rgba(15,23,42,0.08)',
                    zIndex: 4,
                  }}
                >
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Input Condition</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Source: {selectedLightSource.label}</div>
                  <div style={{ fontSize: 14 }}>Voltage: {sourceVoltage.toFixed(1)} V</div>
                  <div style={{ fontSize: 14 }}>Distance: {distance.toFixed(1)} cm</div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: 58,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 280,
                    height: 126,
                    borderRadius: 18,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(226,232,240,0.96))',
                    border: '2px solid #475569',
                    boxShadow: `0 18px 36px rgba(15,23,42,0.16), inset 0 0 ${18 + sensorGlow * 28}px rgba(255,255,255,0.85)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    zIndex: 3,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#334155', letterSpacing: 1.2 }}>
                    BOX TYPE LDR SENSOR
                  </div>

                  <div
                    style={{
                      width: 178,
                      height: 44,
                      borderRadius: 8,
                      background:
                        'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
                      border: '2px solid #64748b',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 6,
                        borderRadius: 6,
                        background:
                          'repeating-linear-gradient(90deg, #334155 0 10px, #f8fafc 10px 14px)',
                        opacity: clamp(0.55 + sensorGlow * 0.45, 0.55, 1),
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(90deg, rgba(255,255,255,0.04), ${selectedLightSource.accent}55, rgba(255,255,255,0.04))`,
                        opacity: sensorGlow,
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 13, color: '#475569' }}>
                    Conductivity increases as photon flux rises
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    right: 24,
                    bottom: 74,
                    width: 210,
                    padding: 16,
                    borderRadius: 18,
                    background: 'rgba(15,23,42,0.86)',
                    color: '#f8fafc',
                    boxShadow: '0 10px 22px rgba(15,23,42,0.2)',
                    zIndex: 4,
                  }}
                >
                  <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>Output</div>
                  <div style={{ fontSize: 14 }}>Flux: {lightFlux.toFixed(3)}</div>
                  <div style={{ fontSize: 14 }}>Carriers: {carrierGeneration.toFixed(2)}</div>
                  <div style={{ fontSize: 14 }}>Resistance: {resistance.toFixed(2)} kOhm</div>
                  <div style={{ fontSize: 14 }}>Current: {current.toFixed(3)} mA</div>
                  <div style={{ fontSize: 14, marginTop: 6 }}>Bias: {biasVoltage.toFixed(1)} V</div>
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Student Exercises</h2>
              <div
                style={{
                  background: selectedLightSource.panel,
                  border: `1px solid ${selectedLightSource.accent}33`,
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <ol style={{ margin: 0, paddingLeft: 20, color: '#334155', lineHeight: 1.8 }}>
                  <li>
                    Calculate carrier generation for source voltages 2.5 V, 5 V, 7.5 V, 10 V, and
                    12.5 V at distances 5 cm, 10 cm, and 15 cm using the given formula.
                  </li>
                  <li>
                    Enter your calculated values in the observation table below and verify how the
                    graph changes for each distance.
                  </li>
                </ol>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Dark Resistance Measurement</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle}>Voltmeter Reading (V)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={darkVoltmeterReading}
                    onChange={(e) => setDarkVoltmeterReading(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ammeter Reading (mA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={darkAmmeterReading}
                    onChange={(e) => setDarkAmmeterReading(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Dark Resistance (kOhm)</label>
                  <input value={darkResistance.toFixed(2)} readOnly style={readOnlyStyle} />
                </div>
              </div>

              <p style={{ marginBottom: 0, marginTop: 14, color: '#64748b' }}>
                Dark resistance formula: Rdark = V / I
              </p>
            </section>
          </div>
        </div>

        <section style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={sectionTitleStyle}>Carrier Generation Observation Table</h2>
          <p style={{ marginTop: 0, color: '#475569', lineHeight: 1.6 }}>
            Students should calculate the values manually from the formula and enter them below.
            The graph will be plotted automatically after entry.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
                minWidth: 760,
              }}
            >
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ border: '1px solid #d7deea', padding: 10, textAlign: 'left' }}>
                    Source Voltage (V)
                  </th>
                  <th style={{ border: '1px solid #d7deea', padding: 10, textAlign: 'left' }}>
                    Carrier Generation at 5 cm
                  </th>
                  <th style={{ border: '1px solid #d7deea', padding: 10, textAlign: 'left' }}>
                    Carrier Generation at 10 cm
                  </th>
                  <th style={{ border: '1px solid #d7deea', padding: 10, textAlign: 'left' }}>
                    Carrier Generation at 15 cm
                  </th>
                </tr>
              </thead>
              <tbody>
                {SOURCE_VOLTAGES.map((voltage) => (
                  <tr key={voltage}>
                    <td style={{ border: '1px solid #d7deea', padding: 10, fontWeight: 700 }}>
                      {voltage.toFixed(1)}
                    </td>
                    {GRAPH_DISTANCES.map((graphDistance) => (
                      <td key={`${voltage}-${graphDistance}`} style={{ border: '1px solid #d7deea', padding: 10 }}>
                        <input
                          type="text"
                          value={carrierInputs[voltage][graphDistance]}
                          onChange={(e) =>
                            handleCarrierInputChange(voltage, graphDistance, e.target.value)
                          }
                          placeholder="Enter value"
                          style={inputStyle}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 24,
          }}
        >
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Carrier Generation vs Source Voltage</h2>
            <p style={{ marginTop: 0, color: '#475569', lineHeight: 1.6 }}>
              The graph space is kept ready. It will plot only after the student enters carrier
              generation values in the table.
            </p>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <LineChart data={manualCarrierGraphData} margin={chartMargins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis
                    dataKey="sourceVoltage"
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Source Voltage (V)',
                      position: 'insideBottom',
                      offset: -10,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    width={78}
                    domain={[0, 'auto']}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Carrier Generation',
                      angle: -90,
                      position: 'insideLeft',
                      dx: -10,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="carriers5"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    name="5 cm"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="carriers10"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    name="10 cm"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="carriers15"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    name="15 cm"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Distance vs Resistance</h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <LineChart data={distanceResistanceData} margin={chartMargins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis
                    dataKey="distance"
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Distance (cm)',
                      position: 'insideBottom',
                      offset: -10,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    width={78}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Resistance (kOhm)',
                      angle: -90,
                      position: 'insideLeft',
                      dx: -10,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === 'number' ? `${value.toFixed(2)} kOhm` : value
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="resistance"
                    stroke={selectedLightSource.accent}
                    strokeWidth={3}
                    name="Resistance"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
