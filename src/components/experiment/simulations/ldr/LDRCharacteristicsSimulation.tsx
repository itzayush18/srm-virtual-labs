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
  flux5: number;
  flux10: number;
  flux15: number;
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

const SOURCE_VOLTAGES = [2.5, 5, 7.5, 10, 12.5];
const DISTANCES = [5, 10, 15];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d7deea',
  borderRadius: 8,
  padding: 20,
  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06)',
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
  borderRadius: 6,
  fontSize: 14,
  boxSizing: 'border-box',
};

const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#f8fafc',
};

const App = () => {
  const [sourceVoltage, setSourceVoltage] = useState(7.5);
  const [distance, setDistance] = useState(10);
  const [biasVoltage, setBiasVoltage] = useState(5);

  const [darkVoltmeterReading, setDarkVoltmeterReading] = useState(5);
  const [darkAmmeterReading, setDarkAmmeterReading] = useState(0.05);

  const darkResistance = useMemo(() => {
    if (darkAmmeterReading <= 0) {
      return 100;
    }
    return darkVoltmeterReading / darkAmmeterReading;
  }, [darkVoltmeterReading, darkAmmeterReading]);

  const computeLightFlux = (lampVoltage: number, ldrDistance: number) => {
    const voltageFactor = lampVoltage / 12.5;
    const distanceFactor = Math.pow(5 / ldrDistance, 2);
    return voltageFactor * distanceFactor;
  };

  const computeCarrierGeneration = (lampVoltage: number, ldrDistance: number) => {
    const flux = computeLightFlux(lampVoltage, ldrDistance);
    return flux * 100;
  };

  const computeResistance = (lampVoltage: number, ldrDistance: number) => {
    const carriers = computeCarrierGeneration(lampVoltage, ldrDistance);
    const normalizedCarriers = carriers / 100;
    const illuminatedResistance = darkResistance / (1 + 8 * normalizedCarriers);
    return clamp(illuminatedResistance, 0.5, darkResistance);
  };

  const lightFlux = useMemo(
    () => computeLightFlux(sourceVoltage, distance),
    [sourceVoltage, distance]
  );

  const carrierGeneration = useMemo(
    () => computeCarrierGeneration(sourceVoltage, distance),
    [sourceVoltage, distance]
  );

  const resistance = useMemo(
    () => computeResistance(sourceVoltage, distance),
    [sourceVoltage, distance, darkResistance]
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
        flux5: Number(computeLightFlux(voltage, 5).toFixed(3)),
        flux10: Number(computeLightFlux(voltage, 10).toFixed(3)),
        flux15: Number(computeLightFlux(voltage, 15).toFixed(3)),
        carriers5: Number(computeCarrierGeneration(voltage, 5).toFixed(2)),
        carriers10: Number(computeCarrierGeneration(voltage, 10).toFixed(2)),
        carriers15: Number(computeCarrierGeneration(voltage, 15).toFixed(2)),
        resistance5: Number(computeResistance(voltage, 5).toFixed(2)),
        resistance10: Number(computeResistance(voltage, 10).toFixed(2)),
        resistance15: Number(computeResistance(voltage, 15).toFixed(2)),
      })),
    [darkResistance]
  );

  const distanceResistanceData: DistanceResistancePoint[] = useMemo(
    () =>
      DISTANCES.map((d) => ({
        distance: d,
        resistance: Number(computeResistance(sourceVoltage, d).toFixed(2)),
      })),
    [sourceVoltage, darkResistance]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#eef4fb',
        padding: 24,
        fontFamily: 'Arial, sans-serif',
        color: '#1e293b',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 30 }}>
          LDR Characteristics Simulation
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, color: '#475569', lineHeight: 1.6 }}>
          The lamp voltage controls light intensity. The distance controls photon flux at the LDR.
          The bias voltage does not generate carriers; it only measures the conductivity already
          created by incident light.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 24 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Control Panel</h2>

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
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>LDR Visualization</h2>

              <div
                style={{
                  position: 'relative',
                  height: 240,
                  border: '1px solid #dbe4f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: '#facc15',
                    opacity: clamp(lightFlux * 1.5, 0.25, 1),
                    boxShadow: `0 0 ${28 / (distance / 5)}px ${14 / (distance / 5)}px rgba(250, 204, 21, 0.85)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  Lamp
                </div>

                <div
                  style={{
                    marginTop: 48,
                    width: 120,
                    height: 56,
                    border: '2px solid #64748b',
                    background: '#e5e7eb',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  LDR
                </div>

                <div style={{ position: 'absolute', left: 16, bottom: 16, fontSize: 13 }}>
                  <div>Source Voltage = {sourceVoltage.toFixed(1)} V</div>
                  <div>Distance = {distance} cm</div>
                  <div>Flux = {lightFlux.toFixed(3)}</div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                    fontSize: 13,
                    textAlign: 'right',
                  }}
                >
                  <div>Carriers = {carrierGeneration.toFixed(2)}</div>
                  <div>Resistance = {resistance.toFixed(2)} kOhm</div>
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: 24 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Carrier Generation vs Source Voltage</h2>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={sweepData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sourceVoltage" label={{ value: 'Source Voltage (V)', position: 'insideBottom', offset: -4 }} />
                    <YAxis label={{ value: 'Carrier Generation', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="carriers5" stroke="#f59e0b" strokeWidth={2} name="5 cm" />
                    <Line type="monotone" dataKey="carriers10" stroke="#2563eb" strokeWidth={2} name="10 cm" />
                    <Line type="monotone" dataKey="carriers15" stroke="#10b981" strokeWidth={2} name="15 cm" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Distance vs Resistance</h2>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={distanceResistanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="distance" label={{ value: 'Distance (cm)', position: 'insideBottom', offset: -4 }} />
                    <YAxis label={{ value: 'Resistance (kOhm)', angle: -90, position: 'insideLeft' }} />
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
                      strokeWidth={2}
                      name="Resistance"
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: '#1d4ed8' }}>Sweep Table</h2>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 14,
                    minWidth: 900,
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
                        <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.flux5.toFixed(3)}</td>
                        <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.flux10.toFixed(3)}</td>
                        <td style={{ border: '1px solid #d7deea', padding: 10 }}>{row.flux15.toFixed(3)}</td>
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
      </div>
    </div>
  );
};

export default App;
