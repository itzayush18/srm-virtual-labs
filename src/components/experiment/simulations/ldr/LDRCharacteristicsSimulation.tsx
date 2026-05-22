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
const MAX_DISTANCE = 20;

const LIGHT_SOURCES = {
  incandescent: {
    label: 'Incandescent Lamp',
    multiplier: 1,
    accent: '#f59e0b',
    glowOuter: 'rgba(245, 158, 11, 0.45)',
    beamColor: 'rgba(250, 204, 21, 0.32)',
    panel: 'linear-gradient(135deg, #fff7d6, #ffedd5)',
    summary: 'Warm yellow light with moderate intensity and broad illumination.',
  },
  led: {
    label: 'White LED',
    multiplier: 1.18,
    accent: '#2563eb',
    glowOuter: 'rgba(59, 130, 246, 0.42)',
    beamColor: 'rgba(96, 165, 250, 0.32)',
    panel: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    summary: 'Focused cool white light that produces slightly higher useful flux at the LDR.',
  },
  sunlight: {
    label: 'Sunlight',
    multiplier: 1.45,
    accent: '#eab308',
    glowOuter: 'rgba(234, 179, 8, 0.42)',
    beamColor: 'rgba(253, 224, 71, 0.34)',
    panel: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    summary: 'High-intensity natural light that gives the strongest photoresponse in this model.',
  },
  colored: {
    label: 'Colored Light',
    multiplier: 0.82,
    accent: '#a855f7',
    glowOuter: 'rgba(168, 85, 247, 0.42)',
    beamColor: 'rgba(192, 132, 252, 0.30)',
    panel: 'linear-gradient(135deg, #fdf2f8, #ede9fe)',
    summary: 'Filtered colored illumination with lower effective intensity reaching the LDR.',
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d7deea',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
};

const compactCardStyle = {
  ...cardStyle,
  padding: 18,
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

const chartMargins = { top: 18, right: 28, bottom: 40, left: 34 };

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

  const voltageFactor = sourceVoltage / MAX_SOURCE_VOLTAGE;
  const normalizedDistance = (distance - REFERENCE_DISTANCE) / (MAX_DISTANCE - REFERENCE_DISTANCE);
  const closenessFactor = 1 - normalizedDistance;

  const beamOpacity = clamp(0.12 + voltageFactor * 0.52 + closenessFactor * 0.24, 0.12, 0.92);
  const beamBlur = clamp(6 + voltageFactor * 10 - normalizedDistance * 2, 5, 16);
  const sourceGlow = clamp(18 + voltageFactor * 38, 18, 56);
  const sensorGlow = clamp(0.18 + lightFlux * 3.6, 0.18, 1);

  const ldrLeft = clamp(250 + normalizedDistance * 220, 250, 470);
  const sourceCenterX = 102;
  const sensorCenterX = ldrLeft + 45;
  const coneLeft = sourceCenterX + 12;
  const coneWidth = Math.max(70, sensorCenterX - coneLeft + 20);
  const coneTop = 88;
  const coneHeight = clamp(78 + voltageFactor * 22 + closenessFactor * 14, 78, 120);
  const innerConeHeight = clamp(coneHeight * 0.45, 28, 56);

  const renderSourceVisual = () => {
    if (lightSource === 'incandescent') {
      return (
        <div style={{ position: 'relative', width: 86, height: 86 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              boxShadow: `0 0 ${sourceGlow}px ${selectedLightSource.glowOuter}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 10,
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #fff7cc 0%, #fde68a 100%)',
              border: '4px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            💡
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 2,
              transform: 'translateX(-50%)',
              width: 22,
              height: 14,
              borderRadius: '0 0 8px 8px',
              background: '#64748b',
              border: '2px solid #475569',
            }}
          />
        </div>
      );
    }

    if (lightSource === 'sunlight') {
      return (
        <div style={{ position: 'relative', width: 90, height: 90 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              boxShadow: `0 0 ${sourceGlow}px ${selectedLightSource.glowOuter}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 10,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fef9c3 0%, #fde047 60%, #f59e0b 100%)',
              border: '4px solid #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            ☀️
          </div>
        </div>
      );
    }

    if (lightSource === 'led') {
      return (
        <div style={{ position: 'relative', width: 84, height: 84 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              boxShadow: `0 0 ${sourceGlow}px ${selectedLightSource.glowOuter}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              top: 10,
              height: 42,
              borderRadius: '42px 42px 18px 18px',
              background: 'linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)',
              border: '4px solid #60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              fontWeight: 700,
              color: '#1d4ed8',
            }}
          >
            LED
          </div>
          <div
            style={{
              position: 'absolute',
              left: 28,
              bottom: 8,
              width: 6,
              height: 20,
              background: '#94a3b8',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 28,
              bottom: 8,
              width: 6,
              height: 20,
              background: '#94a3b8',
            }}
          />
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', width: 88, height: 88 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)',
            boxShadow: `0 0 ${sourceGlow}px ${selectedLightSource.glowOuter}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            border: '4px solid #a855f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          🌈
        </div>
      </div>
    );
  };

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
            gridTemplateColumns: 'minmax(380px, 0.92fr) minmax(440px, 1.08fr)',
            gap: 24,
            alignItems: 'start',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 20 }}>
            <section style={compactCardStyle}>
              <h2 style={sectionTitleStyle}>Control Panel</h2>
              <p style={{ marginTop: 0, color: '#475569', lineHeight: 1.6 }}>
                {selectedLightSource.summary}
              </p>

              <div style={{ marginBottom: 18 }}>
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

              <div style={{ marginBottom: 18 }}>
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

              <div style={{ marginBottom: 18 }}>
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

              <div style={{ marginBottom: 18 }}>
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
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <label style={labelStyle}>Relative Light Flux</label>
                  <input value={lightFlux.toFixed(3)} readOnly style={readOnlyStyle} />
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

            <section style={compactCardStyle}>
              <h2 style={sectionTitleStyle}>Carrier Generation Formula</h2>
              <div
                style={{
                  background: selectedLightSource.panel,
                  border: `1px solid ${selectedLightSource.accent}33`,
                  borderRadius: 16,
                  padding: 16,
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
                    padding: 14,
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#0f172a',
                    textAlign: 'center',
                  }}
                >
                  Carrier Generation = 100 × (Vs / 12.5) × (2.5 / d)^2 × S
                </div>
                <div style={{ marginTop: 12, color: '#475569', lineHeight: 1.7, fontSize: 14 }}>
                  <div>`Vs` = Source voltage of the light source</div>
                  <div>`d` = Distance between source and LDR in cm</div>
                  <div>`S` = Source multiplier for the selected light source</div>
                  <div>
                    For <strong>{selectedLightSource.label}</strong>, `S ={' '}
                    {selectedLightSource.multiplier}`
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <section style={compactCardStyle}>
              <h2 style={sectionTitleStyle}>LDR Live Visual</h2>
              <div
                style={{
                  position: 'relative',
                  minHeight: 350,
                  borderRadius: 24,
                  overflow: 'hidden',
                  background:
                    'linear-gradient(180deg, rgba(14,165,233,0.12), rgba(226,232,240,0.18) 46%, rgba(15,23,42,0.08) 100%)',
                  border: '1px solid #dbe4f0',
                  padding: '74px 24px 24px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.65), transparent 24%), radial-gradient(circle at 82% 12%, rgba(255,255,255,0.35), transparent 16%)',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: 18,
                    left: 18,
                    width: 180,
                    padding: 12,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid #dbe4f0',
                    boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
                    zIndex: 5,
                  }}
                >
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Input</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Source: {selectedLightSource.label}</div>
                  <div style={{ fontSize: 14 }}>Voltage: {sourceVoltage.toFixed(1)} V</div>
                  <div style={{ fontSize: 14 }}>Distance: {distance.toFixed(1)} cm</div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: 18,
                    right: 18,
                    width: 160,
                    padding: 12,
                    borderRadius: 14,
                    background: 'rgba(15,23,42,0.88)',
                    color: '#f8fafc',
                    boxShadow: '0 10px 22px rgba(15,23,42,0.2)',
                    zIndex: 5,
                  }}
                >
                  <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 4 }}>Output</div>
                  <div style={{ fontSize: 14 }}>Resistance: {resistance.toFixed(2)} kOhm</div>
                  <div style={{ fontSize: 14 }}>Current: {current.toFixed(3)} mA</div>
                </div>

                <div style={{ position: 'relative', height: 220, marginTop: 26, zIndex: 3 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 48,
                      bottom: 34,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    {renderSourceVisual()}
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#334155',
                        background: 'rgba(255,255,255,0.88)',
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid #dbe4f0',
                        textAlign: 'center',
                      }}
                    >
                      {selectedLightSource.label}
                    </div>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: coneLeft,
                      bottom: 78,
                      width: coneWidth,
                      height: coneHeight,
                      background: `linear-gradient(90deg, ${selectedLightSource.beamColor}, rgba(255,255,255,0.02))`,
                      clipPath: 'polygon(0% 46%, 0% 54%, 100% 100%, 100% 0%)',
                      filter: `blur(${beamBlur}px)`,
                      opacity: beamOpacity,
                      transformOrigin: 'left center',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: coneLeft + 8,
                      bottom: 92,
                      width: Math.max(50, coneWidth - 22),
                      height: innerConeHeight,
                      background: `linear-gradient(90deg, ${selectedLightSource.accent}66, rgba(255,255,255,0.01))`,
                      clipPath: 'polygon(0% 46%, 0% 54%, 100% 84%, 100% 16%)',
                      opacity: clamp(beamOpacity * 0.62, 0.14, 0.72),
                      filter: `blur(${Math.max(2, beamBlur * 0.35)}px)`,
                      transformOrigin: 'left center',
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      left: ldrLeft,
                      bottom: 26,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        height: 120,
                        borderRadius: 18,
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(226,232,240,0.96))',
                        border: '2px solid #475569',
                        boxShadow: `0 14px 30px rgba(15,23,42,0.16), inset 0 0 ${14 + sensorGlow * 24}px rgba(255,255,255,0.82)`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 78,
                          borderRadius: 8,
                          background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
                          border: '2px solid #64748b',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 5,
                            borderRadius: 5,
                            background:
                              'repeating-linear-gradient(180deg, #334155 0 6px, #f8fafc 6px 10px)',
                            opacity: clamp(0.5 + sensorGlow * 0.5, 0.5, 1),
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(180deg, rgba(255,255,255,0.02), ${selectedLightSource.accent}66, rgba(255,255,255,0.02))`,
                            opacity: sensorGlow,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#334155',
                        background: 'rgba(255,255,255,0.88)',
                        padding: '6px 14px',
                        borderRadius: 999,
                        border: '1px solid #dbe4f0',
                      }}
                    >
                      LDR
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                alignItems: 'stretch',
              }}
            >
              <section style={compactCardStyle}>
                <h2 style={sectionTitleStyle}>Student Exercises</h2>
                <div
                  style={{
                    background: selectedLightSource.panel,
                    border: `1px solid ${selectedLightSource.accent}33`,
                    borderRadius: 14,
                    padding: 14,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <ol style={{ margin: 0, paddingLeft: 20, color: '#334155', lineHeight: 1.7 }}>
                    <li>
                      Calculate carrier generation for 2.5 V, 5 V, 7.5 V, 10 V, and 12.5 V at
                      distances 5 cm, 10 cm, and 15 cm.
                    </li>
                    <li>
                      Enter the calculated values in the table and observe how the graph is plotted.
                    </li>
                  </ol>
                </div>
              </section>

              <section style={compactCardStyle}>
                <h2 style={sectionTitleStyle}>Dark Resistance Measurement</h2>
                <div style={{ display: 'grid', gap: 12 }}>
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

                <p style={{ marginBottom: 0, marginTop: 12, color: '#64748b', lineHeight: 1.6 }}>
                  Dark resistance formula: Rdark = V / I
                </p>
              </section>
            </div>
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
                      <td
                        key={`${voltage}-${graphDistance}`}
                        style={{ border: '1px solid #d7deea', padding: 10 }}
                      >
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
              The graph will plot after the student enters carrier generation values in the table.
            </p>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <LineChart data={manualCarrierGraphData} margin={chartMargins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis
                    dataKey="sourceVoltage"
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Source Voltage (V)',
                      position: 'bottom',
                      offset: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    width={82}
                    domain={[0, 'auto']}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Carrier Generation',
                      angle: -90,
                      position: 'insideLeft',
                      dx: -18,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 8 }} />
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
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <LineChart data={distanceResistanceData} margin={chartMargins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                  <XAxis
                    dataKey="distance"
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Distance (cm)',
                      position: 'bottom',
                      offset: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    width={86}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    label={{
                      value: 'Resistance (kOhm)',
                      angle: -90,
                      position: 'insideLeft',
                      dx: -20,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === 'number' ? `${value.toFixed(2)} kOhm` : value
                    }
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 8 }} />
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
