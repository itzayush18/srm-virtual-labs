import React, { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
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

const CURRENT_MA = 2;
const PROBE_SPACING_MM = 2;
const THICKNESS_MM = 0.05;
const CORRECTION_FACTOR = 5.52;
const ROOM_TEMP_C = 25;
const MAX_TEMP_C = 90;
const BOLTZMANN_EV = 8.617333262e-5;

const GERMANIUM = {
  name: 'Germanium',
  symbol: 'Ge',
  energyGapEV: 0.67,
  rhoAtRoomOhmCm: 45,
};

function toKelvin(tempC) {
  return tempC + 273.15;
}

function log10(value) {
  return Math.log(value) / Math.LN10;
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function calcResistivityAtTemp(tempC) {
  const tRef = toKelvin(ROOM_TEMP_C);
  const tNow = toKelvin(tempC);
  const exponent =
    (GERMANIUM.energyGapEV / (2 * BOLTZMANN_EV)) * ((1 / tNow) - (1 / tRef));
  return GERMANIUM.rhoAtRoomOhmCm * Math.exp(exponent);
}

function calcMeasuredVoltage(resistivityOhmCm) {
  const currentA = CURRENT_MA / 1000;
  const spacingCm = PROBE_SPACING_MM / 10;
  return (resistivityOhmCm * currentA * CORRECTION_FACTOR) / (2 * Math.PI * spacingCm);
}

function calcRho0(voltageV) {
  const currentA = CURRENT_MA / 1000;
  const spacingCm = PROBE_SPACING_MM / 10;
  return ((voltageV / currentA) * 2 * Math.PI * spacingCm);
}

function calcCorrectedRho(voltageV) {
  return calcRho0(voltageV) / CORRECTION_FACTOR;
}

function linearRegression(points) {
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0);
  const denominator = n * sumX2 - sumX * sumX;

  if (n < 2 || denominator === 0) {
    return { slope: 0, intercept: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const FourProbeResistivitySimulation = () => {
  const [temperatureC, setTemperatureC] = useState(ROOM_TEMP_C);

  const chartData = useMemo(() => {
    const data = [];
    for (let temp = ROOM_TEMP_C; temp <= MAX_TEMP_C; temp += 5) {
      const temperatureK = toKelvin(temp);
      const rho = calcResistivityAtTemp(temp);
      const voltage = calcMeasuredVoltage(rho);
      data.push({
        tempC: temp,
        tempK: temperatureK,
        voltage,
        rho,
        rho0: calcRho0(voltage),
        x: 1000 / temperatureK,
        y: log10(rho),
      });
    }
    return data;
  }, []);

  const regression = useMemo(
    () => linearRegression(chartData.map((point) => ({ x: point.x, y: point.y }))),
    [chartData]
  );

  const energyGapEV = 2 * BOLTZMANN_EV * Math.LN10 * 1000 * regression.slope;

  const currentPoint = useMemo(() => {
    const rho = calcResistivityAtTemp(temperatureC);
    const voltage = calcMeasuredVoltage(rho);
    const temperatureK = toKelvin(temperatureC);
    return {
      tempC: temperatureC,
      tempK: temperatureK,
      voltage,
      rho,
      rho0: calcRho0(voltage),
      x: 1000 / temperatureK,
      y: log10(rho),
    };
  }, [temperatureC]);

  const exportData = () => {
    const rows = [
      [
        'Temperature (C)',
        'Temperature (K)',
        'Voltage (V)',
        'rho0 (ohm-cm)',
        'Corrected rho (ohm-cm)',
        '1000/T (K^-1)',
        'log10(rho)',
      ],
      ...chartData.map((point) => [
        point.tempC,
        point.tempK.toFixed(2),
        point.voltage.toFixed(6),
        point.rho0.toFixed(4),
        point.rho.toFixed(4),
        point.x.toFixed(4),
        point.y.toFixed(5),
      ]),
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'four_probe_germanium.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetExperiment = () => {
    setTemperatureC(ROOM_TEMP_C);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 rounded-xl border bg-white p-5 shadow-sm lg:col-span-1">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Four Probe Controls</h3>
          <p className="mt-1 text-sm text-slate-500">
            Outer probes supply a fixed current of 2 mA. Inner probes measure the voltage across the
            germanium sample.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="text-sm font-medium text-slate-700">Material</div>
            <div className="mt-1 text-base font-semibold text-slate-900">
              {GERMANIUM.name} ({GERMANIUM.symbol})
            </div>
          </div>

          <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
            <div>Current, I = {CURRENT_MA} mA</div>
            <div>Probe spacing, s = {PROBE_SPACING_MM} mm</div>
            <div>Thickness, w = {THICKNESS_MM} mm</div>
            <div>Correction factor, f(w/s) = {CORRECTION_FACTOR}</div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Temperature: {temperatureC} °C ({currentPoint.tempK.toFixed(2)} K)
            </label>
            <Slider
              min={ROOM_TEMP_C}
              max={MAX_TEMP_C}
              step={1}
              value={[temperatureC]}
              onValueChange={(values) => setTemperatureC(values[0])}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{ROOM_TEMP_C} °C</span>
              <span>{MAX_TEMP_C} °C</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={resetExperiment} variant="outline">
              Reset Temperature
            </Button>
            <Button onClick={exportData}>Export Data</Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Measured Data</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">Measured Voltage</div>
              <div className="mt-1 text-2xl font-bold text-teal-700">
                {currentPoint.voltage.toFixed(4)} V
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">Uncorrected Resistivity, ρ₀</div>
              <div className="mt-1 text-2xl font-bold text-teal-700">
                {currentPoint.rho0.toFixed(2)} Ω·cm
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">Corrected Resistivity, ρ</div>
              <div className="mt-1 text-2xl font-bold text-teal-700">
                {currentPoint.rho.toFixed(2)} Ω·cm
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">1000 / T</div>
              <div className="mt-1 text-2xl font-bold text-indigo-700">
                {currentPoint.x.toFixed(4)} K⁻¹
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">log10 ρ</div>
              <div className="mt-1 text-2xl font-bold text-indigo-700">
                {currentPoint.y.toFixed(4)}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">Energy Gap</div>
              <div className="mt-1 text-2xl font-bold text-rose-700">
                {energyGapEV.toFixed(3)} eV
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-700">Four Probe Relations</h4>
            <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
              <div>ρ₀ = (V / I) × 2πs</div>
              <div>ρ = ρ₀ / f(w/s)</div>
              <div>For the graph, y = log10 ρ and x = 1000 / T</div>
              <div>Energy gap, E₉ = 2k ln(10) × 1000 × slope</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">log10 ρ versus 1000 / T</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 20, left: 10, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => round(value, 3)}
                  label={{ value: '1000 / T (K^-1)', position: 'insideBottom', offset: -6 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => round(value, 3)}
                  label={{ value: 'log10 ρ', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'log10 ρ') return [Number(value).toFixed(4), name];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `1000 / T = ${Number(label).toFixed(4)} K^-1`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="y"
                  name="log10 ρ"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <ReferenceDot
                  x={currentPoint.x}
                  y={currentPoint.y}
                  r={7}
                  fill="#dc2626"
                  stroke="white"
                  strokeWidth={2}
                  label={{ value: `${temperatureC} °C`, position: 'top', fill: '#dc2626' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Move the temperature slider to inspect the voltage and resistivity at each temperature. The red
            point marks the currently selected temperature on the graph.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FourProbeResistivitySimulation;
