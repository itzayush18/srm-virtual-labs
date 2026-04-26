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

const SOURCE_VOLTAGES = [2.5, 5, 7.5, 10, 12.5];
const DISTANCES = [5, 10, 15];

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const LDRCharacteristicsSimulation = () => {
  const [sourceVoltage, setSourceVoltage] = useState(7.5);
  const [distance, setDistance] = useState(10);
  const [biasVoltage, setBiasVoltage] = useState(5);

  const [darkVoltmeterReading, setDarkVoltmeterReading] = useState(5);
  const [darkAmmeterReading, setDarkAmmeterReading] = useState(0.05);

  const darkResistance = useMemo(() => {
    if (darkAmmeterReading <= 0) return 100;
    return darkVoltmeterReading / darkAmmeterReading; // kOhm because V / mA = kOhm
  }, [darkVoltmeterReading, darkAmmeterReading]);

  const computeFlux = (lampVoltage: number, ldrDistance: number) => {
    const voltageFactor = lampVoltage / 12.5;
    const distanceFactor = Math.pow(5 / ldrDistance, 2);
    return voltageFactor * distanceFactor;
  };

  const computeCarrierGeneration = (lampVoltage: number, ldrDistance: number) => {
    const flux = computeFlux(lampVoltage, ldrDistance);
    return flux * 100;
  };

  const computeResistance = (lampVoltage: number, ldrDistance: number) => {
    const carriers = computeCarrierGeneration(lampVoltage, ldrDistance);
    const normalizedCarriers = carriers / 100;
    const resistance = darkResistance / (1 + 8 * normalizedCarriers);
    return clamp(resistance, 0.5, darkResistance);
  };

  const ldrResistance = useMemo(() => {
    return computeResistance(sourceVoltage, distance);
  }, [sourceVoltage, distance, darkResistance]);

  const ldrCurrent = useMemo(() => {
    return biasVoltage / ldrResistance; // mA because V / kOhm = mA
  }, [biasVoltage, ldrResistance]);

  const carrierGeneration = useMemo(() => {
    return computeCarrierGeneration(sourceVoltage, distance);
  }, [sourceVoltage, distance]);

  const relativeFlux = useMemo(() => {
    return computeFlux(sourceVoltage, distance);
  }, [sourceVoltage, distance]);

  const carrierSweepData: SweepPoint[] = useMemo(() => {
    return SOURCE_VOLTAGES.map((v) => ({
      sourceVoltage: v,
      carriers5: Number(computeCarrierGeneration(v, 5).toFixed(2)),
      carriers10: Number(computeCarrierGeneration(v, 10).toFixed(2)),
      carriers15: Number(computeCarrierGeneration(v, 15).toFixed(2)),
      resistance5: Number(computeResistance(v, 5).toFixed(2)),
      resistance10: Number(computeResistance(v, 10).toFixed(2)),
      resistance15: Number(computeResistance(v, 15).toFixed(2)),
    }));
  }, [darkResistance]);

  const distanceResistanceData: DistanceResistancePoint[] = useMemo(() => {
    return DISTANCES.map((d) => ({
      distance: d,
      resistance: Number(computeResistance(sourceVoltage, d).toFixed(2)),
    }));
  }, [sourceVoltage, darkResistance]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h2 className="mb-4 text-xl font-semibold">LDR Simulation Control Panel</h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Light Source Voltage (V)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={2.5}
                  max={12.5}
                  step={2.5}
                  value={[sourceVoltage]}
                  onValueChange={(values) => setSourceVoltage(values[0])}
                />
                <span className="min-w-[50px] text-right">{sourceVoltage.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Distance Between Source and LDR (cm)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={5}
                  max={15}
                  step={5}
                  value={[distance]}
                  onValueChange={(values) => setDistance(values[0])}
                />
                <span className="min-w-[50px] text-right">{distance}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bias Voltage for Measurement (V)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={1}
                  max={10}
                  step={0.5}
                  value={[biasVoltage]}
                  onValueChange={(values) => setBiasVoltage(values[0])}
                />
                <span className="min-w-[50px] text-right">{biasVoltage.toFixed(1)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Relative Light Flux</label>
                <Input value={relativeFlux.toFixed(3)} readOnly className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Carrier Generation</label>
                <Input value={carrierGeneration.toFixed(2)} readOnly className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">LDR Resistance (kOhm)</label>
                <Input value={ldrResistance.toFixed(2)} readOnly className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">LDR Current (mA)</label>
                <Input value={ldrCurrent.toFixed(3)} readOnly className="bg-gray-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="mb-4 text-xl font-semibold">Dark Resistance Calculation</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voltmeter Reading (V)</label>
              <Input
                type="number"
                value={darkVoltmeterReading}
                onChange={(e) => setDarkVoltmeterReading(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ammeter Reading (mA)</label>
              <Input
                type="number"
                value={darkAmmeterReading}
                onChange={(e) => setDarkAmmeterReading(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dark Resistance (kOhm)</label>
              <Input value={darkResistance.toFixed(2)} readOnly className="bg-gray-50" />
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Dark resistance is calculated using: Rdark = V / I
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="mb-4 text-xl font-semibold">Physical Interpretation</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              When the light source is closer to the semiconductor surface, photon flux is more
              concentrated, so more electron-hole carriers are generated.
            </p>
            <p>
              When the distance increases, the light spreads out, photon flux decreases, carrier
              generation reduces, and the resistance of the LDR increases.
            </p>
            <p>
              The bias voltage does not create carriers significantly. It only helps measure the
              conductivity established by incident light.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h2 className="mb-4 text-xl font-semibold">
            Carrier Generation vs Light Source Voltage
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={carrierSweepData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="sourceVoltage"
                  label={{ value: 'Source Voltage (V)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Carrier Generation', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="carriers5" stroke="#f59e0b" name="5 cm" strokeWidth={2} />
                <Line type="monotone" dataKey="carriers10" stroke="#2563eb" name="10 cm" strokeWidth={2} />
                <Line type="monotone" dataKey="carriers15" stroke="#10b981" name="15 cm" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="mb-4 text-xl font-semibold">Distance vs Resistance</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={distanceResistanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="distance"
                  label={{ value: 'Distance (cm)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Resistance (kOhm)', angle: -90, position: 'insideLeft' }}
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
                  name="Resistance"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="mb-4 text-xl font-semibold">Sweep Values Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Source V</th>
                  <th className="border p-2">Carriers at 5 cm</th>
                  <th className="border p-2">Carriers at 10 cm</th>
                  <th className="border p-2">Carriers at 15 cm</th>
                  <th className="border p-2">R at 5 cm</th>
                  <th className="border p-2">R at 10 cm</th>
                  <th className="border p-2">R at 15 cm</th>
                </tr>
              </thead>
              <tbody>
                {carrierSweepData.map((row) => (
                  <tr key={row.sourceVoltage}>
                    <td className="border p-2">{row.sourceVoltage.toFixed(1)}</td>
                    <td className="border p-2">{row.carriers5.toFixed(2)}</td>
                    <td className="border p-2">{row.carriers10.toFixed(2)}</td>
                    <td className="border p-2">{row.carriers15.toFixed(2)}</td>
                    <td className="border p-2">{row.resistance5.toFixed(2)}</td>
                    <td className="border p-2">{row.resistance10.toFixed(2)}</td>
                    <td className="border p-2">{row.resistance15.toFixed(2)}</td>
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
