import React, { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SweepPoint {
  sourceVoltage: number;
  carriers_5cm: number;
  carriers_10cm: number;
  carriers_15cm: number;
  resistance_5cm: number;
  resistance_10cm: number;
  resistance_15cm: number;
}

interface DistanceResistancePoint {
  distance: number;
  resistance: number;
}

const SOURCE_VOLTAGES = [2.5, 5, 7.5, 10, 12.5];
const DISTANCES = [5, 10, 15];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const LDRCharacteristicsSimulation = () => {
  const [sourceVoltage, setSourceVoltage] = useState(7.5); // lamp/source voltage
  const [distance, setDistance] = useState(10); // cm
  const [biasVoltage, setBiasVoltage] = useState(5); // measurement voltage across LDR

  // Dark measurement inputs
  const [darkVoltmeterReading, setDarkVoltmeterReading] = useState(5); // V
  const [darkAmmeterReading, setDarkAmmeterReading] = useState(0.05); // mA

  // Dark resistance from ammeter + voltmeter
  const darkResistance = useMemo(() => {
    if (darkAmmeterReading <= 0) return 100;
    return darkVoltmeterReading / darkAmmeterReading; // V / mA = kOhm
  }, [darkVoltmeterReading, darkAmmeterReading]);

  const computeFlux = (lampVoltage: number, ldrDistance: number) => {
    // Brightness increases with lamp voltage, concentration falls with distance^2
    const voltageFactor = lampVoltage / 12.5;
    const distanceFactor = Math.pow(5 / ldrDistance, 2);
    return voltageFactor * distanceFactor;
  };

  const computeCarriers = (lampVoltage: number, ldrDistance: number) => {
    // Relative carrier generation proportional to photon flux
    const flux = computeFlux(lampVoltage, ldrDistance);
    return 100 * flux; // arbitrary relative carrier units
  };

  const computeResistance = (lampVoltage: number, ldrDistance: number) => {
    const carriers = computeCarriers(lampVoltage, ldrDistance);
    const normalizedCarriers = carriers / 100;
    // More carriers -> lower resistance
    const resistance = darkResistance / (1 + 8 * normalizedCarriers);
    return clamp(resistance, 0.5, darkResistance);
  };

  const currentResistance = useMemo(
    () => computeResistance(sourceVoltage, distance),
    [sourceVoltage, distance, darkResistance]
  );

  const current = useMemo(() => {
    return biasVoltage / currentResistance; // mA because V / kOhm = mA
  }, [biasVoltage, currentResistance]);

  const currentCarriers = useMemo(
    () => computeCarriers(sourceVoltage, distance),
    [sourceVoltage, distance]
  );

  const sweepData: SweepPoint[] = useMemo(() => {
    return SOURCE_VOLTAGES.map(v => ({
      sourceVoltage: v,
      carriers_5cm: parseFloat(computeCarriers(v, 5).toFixed(2)),
      carriers_10cm: parseFloat(computeCarriers(v, 10).toFixed(2)),
      carriers_15cm: parseFloat(computeCarriers(v, 15).toFixed(2)),
      resistance_5cm: parseFloat(computeResistance(v, 5).toFixed(2)),
      resistance_10cm: parseFloat(computeResistance(v, 10).toFixed(2)),
      resistance_15cm: parseFloat(computeResistance(v, 15).toFixed(2)),
    }));
  }, [darkResistance]);

  const distanceResistanceData: DistanceResistancePoint[] = useMemo(() => {
    return DISTANCES.map(d => ({
      distance: d,
      resistance: parseFloat(computeResistance(sourceVoltage, d).toFixed(2)),
    }));
  }, [sourceVoltage, darkResistance]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Control Panel</h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lamp Source Voltage (V)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={2.5}
                  max={12.5}
                  step={2.5}
                  value={[sourceVoltage]}
                  onValueChange={values => setSourceVoltage(values[0])}
                />
                <span className="min-w-[48px] text-right">{sourceVoltage.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Distance from Light Source (cm)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={5}
                  max={15}
                  step={5}
                  value={[distance]}
                  onValueChange={values => setDistance(values[0])}
                />
                <span className="min-w-[48px] text-right">{distance}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bias / Measurement Voltage (V)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={1}
                  max={10}
                  step={0.5}
                  value={[biasVoltage]}
                  onValueChange={values => setBiasVoltage(values[0])}
                />
                <span className="min-w-[48px] text-right">{biasVoltage.toFixed(1)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Carrier Generation</label>
                <Input value={currentCarriers.toFixed(2)} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">LDR Resistance (kΩ)</label>
                <Input value={currentResistance.toFixed(2)} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">LDR Current (mA)</label>
                <Input value={current.toFixed(3)} readOnly className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Relative Light Flux</label>
                <Input
                  value={computeFlux(sourceVoltage, distance).toFixed(3)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Dark Resistance Measurement</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voltmeter Reading (V)</label>
              <Input
                type="number"
                value={darkVoltmeterReading}
                onChange={e => setDarkVoltmeterReading(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ammeter Reading (mA)</label>
              <Input
                type="number"
                value={darkAmmeterReading}
                onChange={e => setDarkAmmeterReading(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dark Resistance (kΩ)</label>
              <Input value={darkResistance.toFixed(2)} readOnly className="bg-gray-50" />
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Dark resistance is calculated from meter readings as Rdark = V / I.
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">LDR Visualization</h3>

          <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-md border bg-blue-50">
            <div
              className="absolute top-4 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-yellow-300"
              style={{
                opacity: clamp(computeFlux(sourceVoltage, distance) * 1.5, 0.2, 1),
                boxShadow: `0 0 ${20 / (distance / 5)}px ${10 / (distance / 5)}px rgba(255, 204, 0, 0.75)`,
              }}
            />
            <div className="relative mt-10 flex h-12 w-24 items-center justify-center rounded border-2 border-gray-400 bg-gray-200">
              <div className="text-xs font-bold">LDR</div>
            </div>

            <div className="absolute bottom-2 left-4 text-xs">
              <div>Source V = {sourceVoltage.toFixed(1)} V</div>
              <div>Distance = {distance} cm</div>
            </div>

            <div className="absolute bottom-2 right-4 text-xs text-right">
              <div>Carriers = {currentCarriers.toFixed(2)}</div>
              <div>R = {currentResistance.toFixed(2)} kΩ</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">
            Carrier Generation vs Source Voltage
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweepData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sourceVoltage" label={{ value: 'Source Voltage (V)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Carrier Generation', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="carriers_5cm" stroke="#f59e0b" name="5 cm" strokeWidth={2} />
                <Line type="monotone" dataKey="carriers_10cm" stroke="#0ea5e9" name="10 cm" strokeWidth={2} />
                <Line type="monotone" dataKey="carriers_15cm" stroke="#10b981" name="15 cm" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Distance vs Resistance</h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={distanceResistanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="distance" label={{ value: 'Distance (cm)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Resistance (kΩ)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={value =>
                    typeof value === 'number' ? `${value.toFixed(2)} kΩ` : value
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="resistance"
                  name="Resistance"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Sweep Table</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="p-2">Source V</th>
                  <th className="p-2">5 cm Carriers</th>
                  <th className="p-2">10 cm Carriers</th>
                  <th className="p-2">15 cm Carriers</th>
                  <th className="p-2">5 cm R (kΩ)</th>
                  <th className="p-2">10 cm R (kΩ)</th>
                  <th className="p-2">15 cm R (kΩ)</th>
                </tr>
              </thead>
              <tbody>
                {sweepData.map(row => (
                  <tr key={row.sourceVoltage} className="border-b">
                    <td className="p-2">{row.sourceVoltage.toFixed(1)}</td>
                    <td className="p-2">{row.carriers_5cm.toFixed(2)}</td>
                    <td className="p-2">{row.carriers_10cm.toFixed(2)}</td>
                    <td className="p-2">{row.carriers_15cm.toFixed(2)}</td>
                    <td className="p-2">{row.resistance_5cm.toFixed(2)}</td>
                    <td className="p-2">{row.resistance_10cm.toFixed(2)}</td>
                    <td className="p-2">{row.resistance_15cm.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDRCharacteristicsSimulation;
