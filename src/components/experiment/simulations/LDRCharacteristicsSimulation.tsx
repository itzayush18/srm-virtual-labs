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

type SweepPoint = {
  sourceVoltage: number;
  carriers5: number;
  carriers10: number;
  carriers15: number;
  resistance5: number;
  resistance10: number;
  resistance15: number;
};

type DistanceResistancePoint = {
  distance: number;
  resistance: number;
};

type LightSourceKey = 'led' | 'sunlight' | 'colored';

type LightSourceConfig = {
  label: string;
  multiplier: number;
  beam: string;
  bulb: string;
  halo: string;
  sceneTop: string;
  sceneBottom: string;
  note: string;
  exerciseTitle: string;
};

const SOURCE_VOLTAGES = [2.5, 5, 7.5, 10, 12.5];
const DISTANCES = [5, 10, 15];

const LIGHT_SOURCES: Record<LightSourceKey, LightSourceConfig> = {
  led: {
    label: 'LED',
    multiplier: 1,
    beam: 'rgba(59, 130, 246, 0.28)',
    bulb: 'linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%)',
    halo: 'rgba(96, 165, 250, 0.55)',
    sceneTop: '#eff6ff',
    sceneBottom: '#dbeafe',
    note: 'LED gives a focused, stable beam and is useful for repeatable measurements.',
    exerciseTitle: 'LED calibration',
  },
  sunlight: {
    label: 'Sunlight',
    multiplier: 1.45,
    beam: 'rgba(251, 191, 36, 0.24)',
    bulb: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
    halo: 'rgba(245, 158, 11, 0.58)',
    sceneTop: '#fff7ed',
    sceneBottom: '#ffedd5',
    note: 'Sunlight produces the strongest photoresponse and lowers resistance the most.',
    exerciseTitle: 'Sunlight sensitivity',
  },
  colored: {
    label: 'Colored Light',
    multiplier: 0.82,
    beam: 'rgba(236, 72, 153, 0.24)',
    bulb: 'linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%)',
    halo: 'rgba(236, 72, 153, 0.58)',
    sceneTop: '#fdf2f8',
    sceneBottom: '#fce7f3',
    note: 'Colored light produces a weaker response, which helps students compare source quality.',
    exerciseTitle: 'Color response comparison',
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d7deea',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  color: '#1d4ed8',
  fontSize: 22,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
  color: '#24324a',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  fontSize: 14,
  boxSizing: 'border-box',
};

const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#f8fafc',
};

const metricCardStyle: React.CSSProperties = {
  border: '1px solid #d7deea',
  borderRadius: 12,
  padding: 14,
  background: '#f8fbff',
};

const chartMargin = { top: 12, right: 18, bottom: 28, left: 28 };

const App = () => {
  const [sourceVoltage, setSourceVoltage] = useState(7.5);
  const [distance, setDistance] = useState(10);
  const [biasVoltage, setBiasVoltage] = useState(5);
  const [lightSource, setLightSource] = useState<LightSourceKey>('led');
  const [darkVoltmeterReading, setDarkVoltmeterReading] = useState(5);
  const [darkAmmeterReading, setDarkAmmeterReading] = useState(0.05);

  const sourceConfig = LIGHT_SOURCES[lightSource];

  const darkResistance = useMemo(() => {
    if (darkAmmeterReading <= 0) {
      return 100;
    }
    return darkVoltmeterReading / darkAmmeterReading;
  }, [darkVoltmeterReading, darkAmmeterReading]);

  const computeLightFlux = (
    lampVoltage: number,
    ldrDistance: number,
    selectedLightSource: LightSourceKey
  ) => {
    const voltageFactor = lampVoltage / 12.5;
    const distanceFactor = Math.pow(5 / ldrDistance, 2);
    const sourceFactor = LIGHT_SOURCES[selectedLightSource].multiplier;
    return voltageFactor * distanceFactor * sourceFactor;
  };

  const computeCarrierGeneration = (
    lampVoltage: number,
    ldrDistance: number,
    selectedLightSource: LightSourceKey
  ) => computeLightFlux(lampVoltage, ldrDistance, selectedLightSource) * 100;

  const computeResistance = (
    lampVoltage: number,
    ldrDistance: number,
    selectedLightSource: LightSourceKey
  ) => {
    const carriers = computeCarrierGeneration(lampVoltage, ldrDistance, selectedLightSource);
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

  const sweepData: SweepPoint[] = useMemo(
    () =>
      SOURCE_VOLTAGES.map((voltage) => ({
        sourceVoltage: voltage,
        carriers5: Number(computeCarrierGeneration(voltage, 5, lightSource).toFixed(2)),
        carriers10: Number(computeCarrierGeneration(voltage, 10, lightSource).toFixed(2)),
        carriers15: Number(computeCarrierGeneration(voltage, 15, lightSource).toFixed(2)),
        resistance5: Number(computeResistance(voltage, 5, lightSource).toFixed(2)),
        resistance10: Number(computeResistance(voltage, 10, lightSource).toFixed(2)),
        resistance15: Number(computeResistance(voltage, 15, lightSource).toFixed(2)),
      })),
    [darkResistance, lightSource]
  );

  const distanceResistanceData: DistanceResistancePoint[] = useMemo(
    () =>
      DISTANCES.map((d) => ({
        distance: d,
        resistance: Number(computeResistance(sourceVoltage, d, lightSource).toFixed(2)),
      })),
    [sourceVoltage, darkResistance, lightSource]
  );

  const exercises = useMemo(
    () => [
      {
        title: `${sourceConfig.exerciseTitle} exercise 1`,
        description: `Keep the light source as ${sourceConfig.label}. Record resistance at 5 cm, 10 cm, and 15 cm for source voltages 5 V, 7.5 V, and 10 V. Identify at which voltage the resistance changes most sharply with distance.`,
      },
      {
        title: `${sourceConfig.exerciseTitle} exercise 2`,
        description: `Fix the distance at ${distance} cm and vary the source voltage from 2.5 V to 12.5 V. Compare carrier generation and measured current for ${sourceConfig.label}, then explain how the source type changes photoresponse.`,
      },
    ],
    [distance, sourceConfig]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(191, 219, 254, 0.55), transparent 30%), linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)',
        padding: 24,
        fontFamily: '"Segoe UI", Arial, sans-serif',
        color: '#1e293b',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32 }}>LDR Characteristics Simulation</h1>
        <p style={{ marginTop: 0, marginBottom: 24, color: '#475569', lineHeight: 1.6, maxWidth: 980 }}>
          Explore how source voltage, distance, and light-source type affect photon flux, carrier
          generation, resistance, and measured current in an LDR-based virtual experiment.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(520px, 1.05fr) minmax(420px, 0.95fr)',
            gap: 24,
            alignItems: 'start',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Control Panel</h2>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Light Source Type</label>
                <select
                  value={lightSource}
                  onChange={(e) => setLightSource(e.target.value as LightSourceKey)}
                  style={inputStyle}
                >
                  <option value="led">LED</option>
                  <option value="sunlight">Sunlight</option>
                  <option value="colored">Colored Light</option>
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
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Distance from Source: {distance} cm</label>
                <input
                  type="range"
                  min={5}
                  max={15}
                  step={5}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  style={{ width: '100%' }}
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
                  style={{ width: '100%' }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                }}
              >
                <div style={metricCardStyle}>
                  <label style={labelStyle}>Relative Light Flux</label>
                  <input value={lightFlux.toFixed(3)} readOnly style={readOnlyStyle} />
                </div>
                <div style={metricCardStyle}>
                  <label style={labelStyle}>Carrier Generation</label>
                  <input value={carrierGeneration.toFixed(2)} readOnly style={readOnlyStyle} />
                </div>
                <div style={metricCardStyle}>
                  <label style={labelStyle}>Resistance (kOhm)</label>
                  <input value={resistance.toFixed(2)} readOnly style={readOnlyStyle} />
                </div>
                <div style={metricCardStyle}>
                  <label style={labelStyle}>Measured Current (mA)</label>
                  <input value={current.toFixed(3)} readOnly style={readOnlyStyle} />
                </div>
              </div>

              <p
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  padding: 12,
                  borderRadius: 12,
                  background: '#eff6ff',
                  color: '#1e3a8a',
                  lineHeight: 1.6,
                }}
              >
                {sourceConfig.note}
              </p>
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

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Student Exercises</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {exercises.map((exercise) => (
                  <div
                    key={exercise.title}
                    style={{
                      border: '1px solid #d7deea',
                      borderRadius: 14,
                      padding: 16,
                      background: '#f8fafc',
                    }}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 17, color: '#0f172a' }}>
                      {exercise.title}
                    </h3>
                    <p style={{ margin: 0, lineHeight: 1.6, color: '#475569' }}>{exercise.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>LDR Live Visual</h2>

            <div
              style={{
                position: 'relative',
                minHeight: 640,
                border: '1px solid #dbe4f0',
                borderRadius: 20,
                overflow: 'hidden',
                background: `linear-gradient(180deg, ${sourceConfig.sceneTop} 0%, ${sourceConfig.sceneBottom} 100%)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at top left, rgba(255,255,255,0.9), transparent 35%), radial-gradient(circle at bottom right, rgba(255,255,255,0.65), transparent 30%)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: 26,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  background: sourceConfig.bulb,
                  boxShadow: `0 0 60px 12px ${sourceConfig.halo}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: 0.4,
                }}
              >
                {sourceConfig.label}
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: 120,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: clamp(280 - distance * 6, 170, 260),
                  height: 280,
                  clipPath: 'polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)',
                  background: `linear-gradient(180deg, ${sourceConfig.beam} 0%, rgba(255,255,255,0.02) 100%)`,
                  filter: 'blur(1px)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: 146 + distance * 15,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 200,
                  height: 98,
                  borderRadius: 20,
                  background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)',
                  border: '2px solid #64748b',
                  boxShadow: `0 0 ${12 + lightFlux * 20}px rgba(16, 185, 129, 0.35)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 6,
                  zIndex: 2,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>LDR Sensor</div>
                <div style={{ fontSize: 13, color: '#334155' }}>Photoresistive element</div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: 132,
                  left: '50%',
                  width: 0,
                  height: 260 + distance * 15,
                  borderLeft: '2px dashed rgba(71, 85, 105, 0.55)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 20,
                  top: 24,
                  width: 170,
                  padding: 14,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.82)',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                }}
              >
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>Optical State</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Flux: {lightFlux.toFixed(3)}</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Distance: {distance} cm</div>
                <div style={{ fontWeight: 700 }}>Source V: {sourceVoltage.toFixed(1)} V</div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  right: 20,
                  bottom: 22,
                  width: 210,
                  padding: 16,
                  borderRadius: 16,
                  background: 'rgba(15, 23, 42, 0.82)',
                  color: '#f8fafc',
                  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.2)',
                }}
              >
                <div style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Live Response
                </div>
                <div style={{ marginBottom: 6 }}>Carriers: {carrierGeneration.toFixed(2)}</div>
                <div style={{ marginBottom: 6 }}>Resistance: {resistance.toFixed(2)} kOhm</div>
                <div>Current: {current.toFixed(3)} mA</div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 86,
                  background:
                    'linear-gradient(180deg, rgba(148,163,184,0) 0%, rgba(148,163,184,0.18) 40%, rgba(100,116,139,0.24) 100%)',
                }}
              />
            </div>
          </section>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Carrier Generation vs Source Voltage</h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <LineChart data={sweepData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="sourceVoltage"
                    label={{ value: 'Source Voltage (V)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    width={78}
                    label={{
                      value: 'Carrier Generation',
                      angle: -90,
                      position: 'insideLeft',
                      dx: -10,
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="carriers5" stroke="#f59e0b" strokeWidth={2.5} name="5 cm" />
                  <Line type="monotone" dataKey="carriers10" stroke="#2563eb" strokeWidth={2.5} name="10 cm" />
                  <Line type="monotone" dataKey="carriers15" stroke="#10b981" strokeWidth={2.5} name="15 cm" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Distance vs Resistance</h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <LineChart data={distanceResistanceData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="distance"
                    label={{ value: 'Distance (cm)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    width={78}
                    label={{
                      value: 'Resistance (kOhm)',
                      angle: -90,
                      position: 'insideLeft',
                      dx: -10,
                    }}
                  />
                  <Tooltip
                    formatter={(value: number | string) =>
                      typeof value === 'number' ? `${value.toFixed(2)} kOhm` : value
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="resistance"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    name="Resistance"
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Sweep Table</h2>
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
                  {[
                    'Source V',
                    'Carriers at 5 cm',
                    'Carriers at 10 cm',
                    'Carriers at 15 cm',
                    'R at 5 cm',
                    'R at 10 cm',
                    'R at 15 cm',
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        border: '1px solid #d7deea',
                        padding: 10,
                        textAlign: 'left',
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sweepData.map((row) => (
                  <tr key={row.sourceVoltage}>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.sourceVoltage.toFixed(1)}</td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.carriers5.toFixed(2)}</td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.carriers10.toFixed(2)}</td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.carriers15.toFixed(2)}</td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.resistance5.toFixed(2)}</td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.resistance10.toFixed(2)}</td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.resistance15.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
