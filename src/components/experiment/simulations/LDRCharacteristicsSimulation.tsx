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
const DISTANCES = [5, 10, 15];

const LIGHT_SOURCES = {
  lamp: {
    label: 'Incandescent Lamp',
    multiplier: 1,
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.55)',
    beam: 'rgba(253, 224, 71, 0.24)',
    description: 'Warm light with moderate photoresponse.',
  },
  led: {
    label: 'White LED',
    multiplier: 1.18,
    color: '#e0f2fe',
    glow: 'rgba(125, 211, 252, 0.55)',
    beam: 'rgba(186, 230, 253, 0.24)',
    description: 'Efficient source with strong illumination for the same voltage.',
  },
  sunlight: {
    label: 'Sunlight',
    multiplier: 1.35,
    color: '#fde68a',
    glow: 'rgba(250, 204, 21, 0.6)',
    beam: 'rgba(254, 240, 138, 0.28)',
    description: 'Highest effective intensity and strongest carrier generation.',
  },
  red: {
    label: 'Red Light',
    multiplier: 0.88,
    color: '#f87171',
    glow: 'rgba(248, 113, 113, 0.5)',
    beam: 'rgba(252, 165, 165, 0.22)',
    description: 'Lower response due to spectral dependence.',
  },
  blue: {
    label: 'Blue Light',
    multiplier: 1.08,
    color: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.5)',
    beam: 'rgba(147, 197, 253, 0.22)',
    description: 'Higher response than red light for the same source voltage.',
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.92)',
  border: '1px solid #d6e0ee',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(8px)',
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

const metricCardStyle = {
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
  border: '1px solid #dbe6f4',
  borderRadius: 14,
  padding: 14,
};

const exerciseCardStyle = {
  background: 'linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)',
  border: '1px solid #d4e4f8',
  borderRadius: 14,
  padding: 16,
};

export default function App() {
  const [sourceVoltage, setSourceVoltage] = useState(7.5);
  const [distance, setDistance] = useState(10);
  const [biasVoltage, setBiasVoltage] = useState(5);
  const [lightSource, setLightSource] = useState('lamp');

  const [darkVoltmeterReading, setDarkVoltmeterReading] = useState(5);
  const [darkAmmeterReading, setDarkAmmeterReading] = useState(0.05);

  const darkResistance = useMemo(() => {
    if (darkAmmeterReading <= 0) {
      return 100;
    }
    return darkVoltmeterReading / darkAmmeterReading;
  }, [darkVoltmeterReading, darkAmmeterReading]);

  const selectedLight = LIGHT_SOURCES[lightSource];

  const computeLightFlux = (lampVoltage, ldrDistance, sourceType) => {
    const voltageFactor = lampVoltage / 12.5;
    const distanceFactor = Math.pow(5 / ldrDistance, 2);
    const sourceFactor = LIGHT_SOURCES[sourceType].multiplier;
    return voltageFactor * distanceFactor * sourceFactor;
  };

  const computeCarrierGeneration = (lampVoltage, ldrDistance, sourceType) => {
    const flux = computeLightFlux(lampVoltage, ldrDistance, sourceType);
    return flux * 100;
  };

  const computeResistance = (lampVoltage, ldrDistance, sourceType) => {
    const carriers = computeCarrierGeneration(lampVoltage, ldrDistance, sourceType);
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

  const sweepData = useMemo(
    () =>
      SOURCE_VOLTAGES.map((voltage) => ({
        sourceVoltage: voltage,
        flux5: Number(computeLightFlux(voltage, 5, lightSource).toFixed(3)),
        flux10: Number(computeLightFlux(voltage, 10, lightSource).toFixed(3)),
        flux15: Number(computeLightFlux(voltage, 15, lightSource).toFixed(3)),
        carriers5: Number(computeCarrierGeneration(voltage, 5, lightSource).toFixed(2)),
        carriers10: Number(computeCarrierGeneration(voltage, 10, lightSource).toFixed(2)),
        carriers15: Number(computeCarrierGeneration(voltage, 15, lightSource).toFixed(2)),
        resistance5: Number(computeResistance(voltage, 5, lightSource).toFixed(2)),
        resistance10: Number(computeResistance(voltage, 10, lightSource).toFixed(2)),
        resistance15: Number(computeResistance(voltage, 15, lightSource).toFixed(2)),
      })),
    [darkResistance, lightSource]
  );

  const distanceResistanceData = useMemo(
    () =>
      DISTANCES.map((d) => ({
        distance: d,
        resistance: Number(computeResistance(sourceVoltage, d, lightSource).toFixed(2)),
      })),
    [sourceVoltage, darkResistance, lightSource]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 30%, #eef4fb 58%, #e2ecf8 100%)',
        padding: 24,
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        color: '#1e293b',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 32, color: '#0f172a' }}>
          LDR Characteristics Simulation
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, color: '#475569', lineHeight: 1.7 }}>
          Study how source voltage, light-source type, and distance affect photon flux, carrier
          generation, resistance, and measured current of an LDR.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(420px, 1.05fr) minmax(460px, 1fr)',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Control Panel</h2>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Select Light Source</label>
                <select
                  value={lightSource}
                  onChange={(e) => setLightSource(e.target.value)}
                  style={inputStyle}
                >
                  {Object.entries(LIGHT_SOURCES).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
                  {selectedLight.description}
                </p>
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
                <label style={labelStyle}>
                  Bias Voltage for Measurement: {biasVoltage.toFixed(1)} V
                </label>
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
                  gap: 14,
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
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Dark Resistance Measurement</h2>

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
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Student Exercises</h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                <div style={exerciseCardStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: 10, color: '#0f172a', fontSize: 18 }}>
                    Exercise 1: Compare Light Sources
                  </h3>
                  <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, fontSize: 14 }}>
                    Keep the source voltage fixed at <strong>7.5 V</strong> and distance at{' '}
                    <strong>10 cm</strong>. Compare LED, sunlight, red light, and blue light.
                    Record carrier generation and resistance, then identify which source produces
                    the lowest LDR resistance.
                  </p>
                </div>

                <div style={exerciseCardStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: 10, color: '#0f172a', fontSize: 18 }}>
                    Exercise 2: Same Source, Different Distance
                  </h3>
                  <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, fontSize: 14 }}>
                    Select <strong>{selectedLight.label}</strong>. Vary the distance from{' '}
                    <strong>5 cm to 15 cm</strong> at each source voltage. Plot the resistance trend
                    and explain how light intensity and carrier generation change with distance.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: 24 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>LDR Live Visual</h2>

              <div
                style={{
                  position: 'relative',
                  height: 520,
                  border: '1px solid #dbe4f0',
                  borderRadius: 20,
                  overflow: 'hidden',
                  background:
                    'linear-gradient(180deg, #dbeafe 0%, #e0f2fe 34%, #f8fafc 34%, #f1f5f9 100%)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 30%)',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: selectedLight.color,
                    boxShadow: `0 0 ${60 + lightFlux * 22}px ${20 + lightFlux * 18}px ${selectedLight.glow}`,
                    border: '6px solid rgba(255,255,255,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: 0.4,
                    zIndex: 2,
                  }}
                >
                  {lightSource === 'sunlight' ? 'SUN' : 'LAMP'}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: 126,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${110 + clamp(lightFlux * 180, 30, 180)}px`,
                    height: `${140 + distance * 7}px`,
                    clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
                    background: `linear-gradient(180deg, ${selectedLight.beam} 0%, rgba(255,255,255,0.02) 100%)`,
                    filter: 'blur(2px)',
                    opacity: clamp(0.35 + lightFlux * 0.4, 0.35, 0.95),
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 105,
                    transform: 'translateX(-50%)',
                    width: 210,
                    height: 90,
                    borderRadius: 18,
                    background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
                    border: '3px solid #475569',
                    boxShadow: `0 0 ${18 + carrierGeneration / 8}px rgba(59, 130, 246, 0.32)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      height: 28,
                      borderRadius: 14,
                      background:
                        'repeating-linear-gradient(90deg, #334155 0px, #334155 12px, #f8fafc 12px, #f8fafc 16px)',
                      boxShadow: 'inset 0 0 0 2px #64748b',
                    }}
                  />
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 52,
                    transform: 'translateX(-50%)',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: 22,
                    letterSpacing: 1,
                    zIndex: 2,
                  }}
                >
                  LDR SENSOR
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: 20,
                    width: 250,
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid #dbe4f0',
                    borderRadius: 14,
                    padding: 14,
                    zIndex: 3,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#1e3a8a' }}>
                    Active Configuration
                  </div>
                  <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
                    <div>Source: {selectedLight.label}</div>
                    <div>Source Voltage: {sourceVoltage.toFixed(1)} V</div>
                    <div>Distance: {distance} cm</div>
                    <div>Bias Voltage: {biasVoltage.toFixed(1)} V</div>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: 20,
                    width: 250,
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid #dbe4f0',
                    borderRadius: 14,
                    padding: 14,
                    zIndex: 3,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#1e3a8a' }}>
                    Sensor Response
                  </div>
                  <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
                    <div>Relative Flux: {lightFlux.toFixed(3)}</div>
                    <div>Carriers: {carrierGeneration.toFixed(2)}</div>
                    <div>Resistance: {resistance.toFixed(2)} kOhm</div>
                    <div>Measured Current: {current.toFixed(3)} mA</div>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: 24,
                    right: 24,
                    bottom: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 12,
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      color: '#f8fafc',
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}
                  >
                    Illumination increases with source voltage
                  </div>
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      color: '#f8fafc',
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}
                  >
                    Carrier generation rises with photon flux
                  </div>
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      color: '#f8fafc',
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}
                  >
                    LDR resistance decreases as light increases
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 24,
            marginTop: 24,
          }}
        >
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>
              Carrier Generation vs Source Voltage
            </h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <LineChart
                  data={sweepData}
                  margin={{ top: 20, right: 24, left: 26, bottom: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="sourceVoltage"
                    tick={{ fontSize: 13 }}
                    label={{
                      value: 'Source Voltage (V)',
                      position: 'insideBottom',
                      offset: -8,
                    }}
                  />
                  <YAxis
                    width={72}
                    tick={{ fontSize: 13 }}
                    label={{
                      value: 'Carrier Generation',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="carriers5"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    name="5 cm"
                  />
                  <Line
                    type="monotone"
                    dataKey="carriers10"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="10 cm"
                  />
                  <Line
                    type="monotone"
                    dataKey="carriers15"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="15 cm"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Distance vs Resistance</h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <LineChart
                  data={distanceResistanceData}
                  margin={{ top: 20, right: 24, left: 26, bottom: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="distance"
                    tick={{ fontSize: 13 }}
                    label={{
                      value: 'Distance (cm)',
                      position: 'insideBottom',
                      offset: -8,
                    }}
                  />
                  <YAxis
                    width={72}
                    tick={{ fontSize: 13 }}
                    label={{
                      value: 'Resistance (kOhm)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' },
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
                    stroke="#7c3aed"
                    strokeWidth={3}
                    name="Resistance"
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Sweep Table</h2>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
                minWidth: 920,
                background: '#ffffff',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {[
                    'Source V',
                    'Flux at 5 cm',
                    'Flux at 10 cm',
                    'Flux at 15 cm',
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
                        color: '#0f172a',
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
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.sourceVoltage.toFixed(1)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.flux5.toFixed(3)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.flux10.toFixed(3)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.flux15.toFixed(3)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.carriers5.toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.carriers10.toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.carriers15.toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.resistance5.toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.resistance10.toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #d7deea', padding: 10 }}>
                      {row.resistance15.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
