import React, { useEffect, useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

type ThermistorKey = 'ntc_10k' | 'ntc_5k' | 'ntc_precision';

type ObservationPoint = {
  step: number;
  temperatureC: number;
  temperatureK: number;
  invTemperature: number;
  p: number;
  q: number;
  r: number;
  s: number;
  logResistance2303: number;
};

type FitPoint = {
  invTemperature: number;
  logResistance2303: number;
};

type RegressionResult = {
  slope: number;
  intercept: number;
  rSquared: number;
  energyGap: number;
};

const kB = 8.617333262e-5;
const temperatureStep = 10;

const thermistors: Record<
  ThermistorKey,
  {
    name: string;
    actualEg: number;
    referenceResistance: number;
    referenceTemperatureK: number;
    temperatureRangeC: [number, number];
  }
> = {
  ntc_10k: {
    name: 'NTC Thermistor 10k',
    actualEg: 0.682,
    referenceResistance: 10000,
    referenceTemperatureK: 298,
    temperatureRangeC: [35, 95],
  },
  ntc_5k: {
    name: 'NTC Thermistor 5k',
    actualEg: 0.611,
    referenceResistance: 5000,
    referenceTemperatureK: 298,
    temperatureRangeC: [35, 95],
  },
  ntc_precision: {
    name: 'NTC Precision Bead',
    actualEg: 0.735,
    referenceResistance: 12000,
    referenceTemperatureK: 298,
    temperatureRangeC: [35, 95],
  },
};

const toKelvin = (temperatureC: number) => temperatureC + 273;

const round = (value: number, digits = 3) => Number(value.toFixed(digits));

const log2303 = (value: number) => 2.303 * Math.log10(value);

const calculateThermistorResistance = (
  temperatureK: number,
  actualEg: number,
  referenceResistance: number,
  referenceTemperatureK: number
) => {
  const exponent = actualEg / (2 * kB) * (1 / temperatureK - 1 / referenceTemperatureK);
  return referenceResistance * Math.exp(exponent);
};

const calculateRegression = (points: ObservationPoint[]): RegressionResult | null => {
  if (points.length < 2) return null;

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  points.forEach(point => {
    sumX += point.invTemperature;
    sumY += point.logResistance2303;
    sumXY += point.invTemperature * point.logResistance2303;
    sumXX += point.invTemperature * point.invTemperature;
    sumYY += point.logResistance2303 * point.logResistance2303;
  });

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const correlationDenominator = Math.sqrt(
    (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
  );
  const correlation =
    correlationDenominator === 0 ? 0 : (n * sumXY - sumX * sumY) / correlationDenominator;

  return {
    slope,
    intercept,
    rSquared: correlation * correlation,
    energyGap: 2 * kB * slope,
  };
};

const buildFitLine = (points: ObservationPoint[], regression: RegressionResult | null): FitPoint[] => {
  if (!regression || points.length < 2) return [];

  const xValues = points.map(point => point.invTemperature);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  return Array.from({ length: 11 }, (_, index) => {
    const invTemperature = minX + ((maxX - minX) * index) / 10;
    return {
      invTemperature,
      logResistance2303: regression.slope * invTemperature + regression.intercept,
    };
  });
};

const BandGapSimulation = () => {
  const [thermistor, setThermistor] = useState<ThermistorKey>('ntc_10k');
  const [temperatureC, setTemperatureC] = useState(95);
  const [p, setP] = useState(1000);
  const [q, setQ] = useState(1000);
  const [isRecording, setIsRecording] = useState(false);
  const [observations, setObservations] = useState<ObservationPoint[]>([]);

  const selectedThermistor = thermistors[thermistor];
  const [minTempC, maxTempC] = selectedThermistor.temperatureRangeC;
  const temperatureK = toKelvin(temperatureC);

  const actualResistance = useMemo(() => {
    return calculateThermistorResistance(
      temperatureK,
      selectedThermistor.actualEg,
      selectedThermistor.referenceResistance,
      selectedThermistor.referenceTemperatureK
    );
  }, [selectedThermistor, temperatureK]);

  const bridgeBalanceR = useMemo(() => {
    return actualResistance * (p / q);
  }, [actualResistance, p, q]);

  const calculatedUnknownResistance = useMemo(() => {
    return bridgeBalanceR * (q / p);
  }, [bridgeBalanceR, p, q]);

  const regression = useMemo(() => calculateRegression(observations), [observations]);
  const fitLinePoints = useMemo(() => buildFitLine(observations, regression), [observations, regression]);

  const totalSteps = Math.floor((maxTempC - minTempC) / temperatureStep) + 1;
  const progress = (observations.length / totalSteps) * 100;

  const recordObservation = () => {
    const point: ObservationPoint = {
      step: observations.length + 1,
      temperatureC,
      temperatureK,
      invTemperature: 1 / temperatureK,
      p,
      q,
      r: round(bridgeBalanceR, 2),
      s: round(calculatedUnknownResistance, 2),
      logResistance2303: round(log2303(calculatedUnknownResistance), 4),
    };

    setObservations(previous => {
      const filtered = previous.filter(item => item.temperatureC !== temperatureC);
      return [...filtered, point].sort((a, b) => b.temperatureC - a.temperatureC);
    });
  };

  const startAutomaticSweep = () => {
    setObservations([]);
    setTemperatureC(maxTempC);
    setIsRecording(true);
  };

  const resetExperiment = () => {
    setThermistor('ntc_10k');
    setTemperatureC(95);
    setP(1000);
    setQ(1000);
    setObservations([]);
    setIsRecording(false);
  };

  const exportData = () => {
    const rows = [
      ['Step', 'Temp (C)', 'Temp (K)', 'P (Ohm)', 'Q (Ohm)', 'R balance (Ohm)', 'S thermistor (Ohm)', '1/T (K^-1)', '2.303 log R'],
      ...observations.map(point => [
        point.step,
        point.temperatureC,
        point.temperatureK,
        point.p,
        point.q,
        point.r.toFixed(2),
        point.s.toFixed(2),
        point.invTemperature.toExponential(6),
        point.logResistance2303.toFixed(4),
      ]),
    ];

    const csvData = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'thermistor-band-gap-data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!isRecording) return;

    const interval = window.setInterval(() => {
      const nextTemperatureK = toKelvin(temperatureC);
      const nextActualResistance = calculateThermistorResistance(
        nextTemperatureK,
        selectedThermistor.actualEg,
        selectedThermistor.referenceResistance,
        selectedThermistor.referenceTemperatureK
      );
      const nextBalanceR = nextActualResistance * (p / q);
      const nextUnknownResistance = nextBalanceR * (q / p);

      const point: ObservationPoint = {
        step: observations.length + 1,
        temperatureC,
        temperatureK: nextTemperatureK,
        invTemperature: 1 / nextTemperatureK,
        p,
        q,
        r: round(nextBalanceR, 2),
        s: round(nextUnknownResistance, 2),
        logResistance2303: round(log2303(nextUnknownResistance), 4),
      };

      setObservations(previous => {
        const filtered = previous.filter(item => item.temperatureC !== temperatureC);
        return [...filtered, point].sort((a, b) => b.temperatureC - a.temperatureC);
      });

      setTemperatureC(previousTemperature => {
        const nextTemperature = previousTemperature - temperatureStep;
        if (nextTemperature < minTempC) {
          window.clearInterval(interval);
          setIsRecording(false);
          return previousTemperature;
        }
        return nextTemperature;
      });
    }, 900);

    return () => window.clearInterval(interval);
  }, [isRecording, minTempC, observations.length, p, q, selectedThermistor, temperatureC]);

  useEffect(() => {
    setTemperatureC(thermistors[thermistor].temperatureRangeC[1]);
    setObservations([]);
    setIsRecording(false);
  }, [thermistor]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="space-y-6 rounded-lg border bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Wheatstone Bridge Controls</h3>
          <p className="text-sm text-slate-500">
            Temperature sweep runs from high to low in {temperatureStep} deg intervals.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Thermistor</label>
          <Select value={thermistor} onValueChange={value => setThermistor(value as ThermistorKey)} disabled={isRecording}>
            <SelectTrigger>
              <SelectValue placeholder="Select thermistor" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(thermistors).map(([key, item]) => (
                <SelectItem key={key} value={key}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Temperature ({String.fromCharCode(176)}C)</label>
          <div className="flex items-center gap-3">
            <Slider
              min={minTempC}
              max={maxTempC}
              step={temperatureStep}
              value={[temperatureC]}
              onValueChange={value => setTemperatureC(value[0])}
              disabled={isRecording}
            />
            <span className="min-w-[52px] text-right text-sm font-medium">{temperatureC}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">P Ratio Arm ({String.fromCharCode(937)})</label>
            <Input
              type="number"
              value={p}
              min={100}
              step={100}
              onChange={event => setP(Math.max(100, Number(event.target.value) || 100))}
              disabled={isRecording}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Q Ratio Arm ({String.fromCharCode(937)})</label>
            <Input
              type="number"
              value={q}
              min={100}
              step={100}
              onChange={event => setQ(Math.max(100, Number(event.target.value) || 100))}
              disabled={isRecording}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-md bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Balanced galvanometer</span>
            <span className="font-semibold text-emerald-700">Zero deflection</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-500">Standard resistor R</div>
              <div className="font-mono font-semibold">{bridgeBalanceR.toFixed(2)} Ohm</div>
            </div>
            <div>
              <div className="text-slate-500">Unknown thermistor S</div>
              <div className="font-mono font-semibold">{calculatedUnknownResistance.toFixed(2)} Ohm</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">Balance relation used: S = (Q / P) x R</div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button onClick={recordObservation} disabled={isRecording}>
            Record Current Reading
          </Button>
          <Button onClick={startAutomaticSweep} disabled={isRecording}>
            Run High to Low Sweep
          </Button>
          <Button onClick={() => setIsRecording(false)} variant="outline" disabled={!isRecording}>
            Stop Sweep
          </Button>
          <Button onClick={resetExperiment} variant="outline" disabled={isRecording}>
            Reset Experiment
          </Button>
          <Button onClick={exportData} disabled={observations.length === 0 || isRecording}>
            Export Data
          </Button>
        </div>
      </div>

      <div className="space-y-6 md:col-span-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-md border p-3">
              <div className="text-sm text-slate-500">Observations</div>
              <div className="text-2xl font-bold text-slate-900">{observations.length}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm text-slate-500">Slope</div>
              <div className="text-2xl font-bold text-teal-700">
                {regression ? regression.slope.toFixed(2) : 'N/A'}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm text-slate-500">Energy Gap Eg</div>
              <div className="text-2xl font-bold text-teal-700">
                {regression ? `${regression.energyGap.toFixed(3)} eV` : 'N/A'}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm text-slate-500">Reference Eg</div>
              <div className="text-2xl font-bold text-amber-700">
                {selectedThermistor.actualEg.toFixed(3)} eV
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-medium text-slate-700">Experimental Progress</div>
            <Progress value={progress} className="h-2" />
            <div className="mt-2 text-xs text-slate-500">
              Sweep points expected: {totalSteps} from {maxTempC} degC down to {minTempC} degC
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">2.303 log R vs 1/T</h3>
            <p className="text-sm text-slate-500">
              Energy gap is computed from the slope using Eg = 2k x slope.
            </p>
          </div>

          <div className="h-72">
            {observations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="invTemperature"
                    name="1/T"
                    label={{ value: '1/T (K^-1)', position: 'insideBottom', offset: -5 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    type="number"
                    dataKey="logResistance2303"
                    name="2.303 log R"
                    label={{ value: '2.303 log R', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toFixed(4)}
                    labelFormatter={(value: number) => `1/T = ${value.toExponential(6)} K^-1`}
                  />
                  <Legend />
                  <Scatter name="Observed Points" data={observations} fill="#0f766e" />
                  {fitLinePoints.length > 0 && (
                    <Line
                      name="Best Fit"
                      data={fitLinePoints}
                      dataKey="logResistance2303"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Start the sweep to generate Wheatstone bridge observations.
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <div className="text-sm text-slate-500">Regression equation</div>
              <div className="font-mono text-sm text-slate-900">
                y = {regression ? regression.slope.toFixed(2) : '0.00'}x +{' '}
                {regression ? regression.intercept.toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm text-slate-500">R squared</div>
              <div className="font-mono text-sm text-slate-900">
                {regression ? regression.rSquared.toFixed(5) : 'N/A'}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm text-slate-500">Current formula</div>
              <div className="font-mono text-sm text-slate-900">Eg = 2k x slope</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Observation Table</h3>
          <div className="max-h-72 overflow-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="text-left text-slate-700">
                  <th className="px-3 py-2">T (degC)</th>
                  <th className="px-3 py-2">T (K)</th>
                  <th className="px-3 py-2">P</th>
                  <th className="px-3 py-2">Q</th>
                  <th className="px-3 py-2">R</th>
                  <th className="px-3 py-2">S</th>
                  <th className="px-3 py-2">1/T</th>
                  <th className="px-3 py-2">2.303 log R</th>
                </tr>
              </thead>
              <tbody>
                {observations.length === 0 ? (
                  <tr>
                    <td className="px-3 py-5 text-center text-slate-500" colSpan={8}>
                      No observations recorded yet.
                    </td>
                  </tr>
                ) : (
                  observations.map(point => (
                    <tr key={point.temperatureC} className="border-t">
                      <td className="px-3 py-2">{point.temperatureC}</td>
                      <td className="px-3 py-2">{point.temperatureK}</td>
                      <td className="px-3 py-2">{point.p}</td>
                      <td className="px-3 py-2">{point.q}</td>
                      <td className="px-3 py-2">{point.r.toFixed(2)}</td>
                      <td className="px-3 py-2">{point.s.toFixed(2)}</td>
                      <td className="px-3 py-2">{point.invTemperature.toExponential(5)}</td>
                      <td className="px-3 py-2">{point.logResistance2303.toFixed(4)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandGapSimulation;
