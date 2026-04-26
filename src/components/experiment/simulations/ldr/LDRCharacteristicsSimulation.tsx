import React, { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SweepPoint {
  sourceVoltage: number;
  flux: number;
  carrierGeneration: number;
  resistance: number;
  current: number;
}

interface DistanceResistancePoint {
  distance: number;
  resistance: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const SOURCE_VOLTAGE_POINTS = [0, 2.5, 5, 7.5, 10, 12.5];
const DISTANCE_POINTS = [5, 10, 15];

const LDRCharacteristicsSimulation = () => {
  const [lampOn, setLampOn] = useState(true);
  const [sourceVoltage, setSourceVoltage] = useState(7.5);
  const [distance, setDistance] = useState(10);
  const [biasVoltage, setBiasVoltage] = useState(5);
  const [darkVoltmeterReading, setDarkVoltmeterReading] = useState(5);
  const [darkAmmeterReading, setDarkAmmeterReading] = useState(0.05);

  const darkResistance = useMemo(() => {
    if (darkAmmeterReading <= 0) return 100;
    return darkVoltmeterReading / darkAmmeterReading;
  }, [darkVoltmeterReading, darkAmmeterReading]);

  const computeLightFlux = (lampVoltage: number, ldrDistance: number) => {
    if (!lampOn || lampVoltage <= 0) return 0;
    const normalizedVoltage = lampVoltage / 12.5;
    const inverseSquareDistance = Math.pow(5 / ldrDistance, 2);
    return normalizedVoltage * inverseSquareDistance;
  };

  const computeCarrierGeneration = (lampVoltage: number, ldrDistance: number) =>
    computeLightFlux(lampVoltage, ldrDistance) * 100;

  const computeResistance = (lampVoltage: number, ldrDistance: number) => {
    if (!lampOn) return darkResistance;
    const normalizedCarriers = computeCarrierGeneration(lampVoltage, ldrDistance) / 100;
    const illuminatedResistance = darkResistance / (1 + 8 * normalizedCarriers);
    return clamp(illuminatedResistance, 0.5, darkResistance);
  };

  const computeCurrent = (lampVoltage: number, ldrDistance: number) => {
    const ldrResistance = computeResistance(lampVoltage, ldrDistance);
    return ldrResistance > 0 ? biasVoltage / ldrResistance : 0;
  };

  const lightFlux = useMemo(
    () => computeLightFlux(sourceVoltage, distance),
    [sourceVoltage, distance, lampOn]
  );

  const carrierGeneration = useMemo(
    () => computeCarrierGeneration(sourceVoltage, distance),
    [sourceVoltage, distance, lampOn]
  );

  const resistance = useMemo(
    () => computeResistance(sourceVoltage, distance),
    [sourceVoltage, distance, darkResistance, lampOn]
  );

  const current = useMemo(() => computeCurrent(sourceVoltage, distance), [
    sourceVoltage,
    distance,
    biasVoltage,
    darkResistance,
    lampOn,
  ]);

  const sweepData: SweepPoint[] = useMemo(() => {
    return SOURCE_VOLTAGE_POINTS.map((value) => ({
      sourceVoltage: value,
      flux: Number(computeLightFlux(value, distance).toFixed(3)),
      carrierGeneration: Number(computeCarrierGeneration(value, distance).toFixed(2)),
      resistance: Number(computeResistance(value, distance).toFixed(2)),
      current: Number(computeCurrent(value, distance).toFixed(3)),
    }));
  }, [distance, biasVoltage, darkResistance, lampOn]);

  const distanceResistanceData: DistanceResistancePoint[] = useMemo(() => {
    return DISTANCE_POINTS.map((pointDistance) => ({
      distance: pointDistance,
      resistance: Number(computeResistance(sourceVoltage, pointDistance).toFixed(2)),
    }));
  }, [sourceVoltage, darkResistance, lampOn]);

  const photonOpacity = clamp(lightFlux * 2.2, 0.12, 1);
  const lampGlow = lampOn ? 28 + lightFlux * 60 : 0;
  const semiconductorGlow = lampOn ? clamp(lightFlux * 1.5, 0.1, 0.85) : 0.05;
  const photonScale = lampOn ? clamp(0.85 + lightFlux, 0.85, 1.6) : 0.8;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Control Panel</h3>

          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-md border bg-slate-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium">Lamp Switch</div>
                <div className="text-xs text-slate-500">Turn the light source on or off</div>
              </div>
              <button
                type="button"
                onClick={() => setLampOn((prev) => !prev)}
                className={`relative inline-flex h-8 w-20 items-center rounded-full px-1 transition ${
                  lampOn ? 'bg-amber-400' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-10 rounded-full bg-white text-center text-xs leading-6 shadow transition ${
                    lampOn ? 'translate-x-9 text-amber-600' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {lampOn ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Light Source Voltage (V)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={0}
                  max={12.5}
                  step={2.5}
                  value={[sourceVoltage]}
                  onValueChange={(values) => setSourceVoltage(values[0])}
                />
                <span className="min-w-[50px] text-right">{sourceVoltage.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Distance from Source (cm)</label>
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
                <Input value={lightFlux.toFixed(3)} readOnly className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Carrier Generation</label>
                <Input value={carrierGeneration.toFixed(2)} readOnly className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resistance (kOhm)</label>
                <Input value={resistance.toFixed(2)} readOnly className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Measured Current (mA)</label>
                <Input value={current.toFixed(3)} readOnly className="bg-gray-50" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Dark Resistance Measurement</h3>

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
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">LDR Live Visualization</h3>

          <div className="relative h-64 overflow-hidden rounded-md border bg-gradient-to-b from-sky-100 via-slate-50 to-slate-100">
            <div className="absolute left-4 top-4 rounded-md bg-white/80 px-3 py-2 text-xs shadow-sm">
              <div>Lamp: {lampOn ? 'ON' : 'OFF'}</div>
              <div>Source Voltage: {sourceVoltage.toFixed(1)} V</div>
              <div>Distance: {distance} cm</div>
            </div>

            <div
              className={`absolute left-10 top-10 h-16 w-16 rounded-full border-4 ${
                lampOn ? 'border-yellow-300 bg-yellow-300' : 'border-slate-400 bg-slate-300'
              }`}
              style={{
                boxShadow: lampOn
                  ? `0 0 ${lampGlow}px ${lampGlow / 2}px rgba(250, 204, 21, 0.75)`
                  : 'none',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                Lamp
              </div>
            </div>

            <div className="absolute left-[106px] top-[72px] h-1 w-[46%] rounded-full bg-slate-300" />

            {lampOn && (
              <>
                <div
                  className="absolute left-[28%] top-[30%] h-0.5 origin-left bg-cyan-300"
                  style={{
                    width: '35%',
                    transform: 'rotate(18deg)',
                    opacity: photonOpacity,
                  }}
                />
                <div
                  className="absolute left-[29%] top-[39%] h-0.5 origin-left bg-cyan-300"
                  style={{
                    width: '34%',
                    transform: 'rotate(10deg)',
                    opacity: photonOpacity,
                  }}
                />
                <div
                  className="absolute left-[30%] top-[48%] h-0.5 origin-left bg-cyan-300"
                  style={{
                    width: '32%',
                    transform: 'rotate(2deg)',
                    opacity: photonOpacity,
                  }}
                />
                <div
                  className="absolute left-[31%] top-[57%] h-0.5 origin-left bg-cyan-300"
                  style={{
                    width: '30%',
                    transform: 'rotate(-8deg)',
                    opacity: photonOpacity,
                  }}
                />

                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="absolute h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] animate-pulse"
                    style={{
                      left: `${33 + index * 8}%`,
                      top: `${28 + index * 8}%`,
                      opacity: photonOpacity,
                      transform: `scale(${photonScale})`,
                      animationDelay: `${index * 0.18}s`,
                    }}
                  />
                ))}
              </>
            )}

            <div
              className="absolute right-10 top-24 flex h-20 w-28 items-center justify-center rounded-md border-2 border-slate-500 text-sm font-bold text-slate-700"
              style={{
                background: lampOn
                  ? `linear-gradient(180deg, rgba(251,191,36,${semiconductorGlow}) 0%, rgba(226,232,240,0.95) 100%)`
                  : 'linear-gradient(180deg, rgba(226,232,240,0.95) 0%, rgba(203,213,225,1) 100%)',
                boxShadow: lampOn
                  ? `0 0 ${12 + lightFlux * 20}px rgba(56, 189, 248, 0.35)`
                  : 'none',
              }}
            >
              LDR
            </div>

            {lampOn && (
              <>
                <div className="absolute right-[88px] top-[116px] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <div className="absolute right-[66px] top-[132px] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <div className="absolute right-[98px] top-[146px] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </>
            )}

            <div className="absolute right-6 bottom-4 rounded-md bg-white/85 px-3 py-2 text-right text-xs shadow-sm">
              <div>Flux: {lightFlux.toFixed(3)}</div>
              <div>Carriers: {carrierGeneration.toFixed(2)}</div>
              <div>Resistance: {resistance.toFixed(2)} kOhm</div>
              <div>Current: {current.toFixed(3)} mA</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">
            Carrier Generation vs Source Voltage
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweepData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="sourceVoltage"
                  label={{ value: 'Source Voltage (V)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Carrier Generation', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? value.toFixed(2) : value
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="carrierGeneration"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={`Distance ${distance} cm`}
                />
                <ReferenceDot
                  x={sourceVoltage}
                  y={Number(carrierGeneration.toFixed(2))}
                  r={7}
                  fill="#2563eb"
                  stroke="#1d4ed8"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Distance vs Resistance</h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={distanceResistanceData}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
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
                  name={`Source ${sourceVoltage.toFixed(1)} V`}
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Sweep Table</h3>

          <p className="mb-3 text-sm text-slate-600">
            The table updates live using the current distance, bias voltage, lamp state, and dark
            resistance inputs.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Source Voltage (V)</th>
                  <th className="border p-2">Flux at {distance} cm</th>
                  <th className="border p-2">Carrier Generation</th>
                  <th className="border p-2">Resistance (kOhm)</th>
                  <th className="border p-2">Current (mA)</th>
                </tr>
              </thead>
              <tbody>
                {sweepData.map((row) => (
                  <tr
                    key={row.sourceVoltage}
                    className={
                      row.sourceVoltage === sourceVoltage ? 'bg-amber-50 font-medium' : ''
                    }
                  >
                    <td className="border p-2">{row.sourceVoltage.toFixed(1)}</td>
                    <td className="border p-2">{row.flux.toFixed(3)}</td>
                    <td className="border p-2">{row.carrierGeneration.toFixed(2)}</td>
                    <td className="border p-2">{row.resistance.toFixed(2)}</td>
                    <td className="border p-2">{row.current.toFixed(3)}</td>
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
