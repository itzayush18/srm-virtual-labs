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

const ROOM_TEMP_C = 25;
const MAX_TEMP_C = 90;
const BOLTZMANN_EV = 8.617333262e-5;
const REFERENCE_SPACING_MM = 2;
const REFERENCE_THICKNESS_MM = 0.05;
const REFERENCE_CORRECTION_FACTOR = 5.52;

const MATERIALS = {
  germanium: {
    name: 'Germanium',
    symbol: 'Ge',
    energyGapEV: 0.67,
    rhoAtRoomOhmCm: 45,
  },
  silicon: {
    name: 'Silicon',
    symbol: 'Si',
    energyGapEV: 1.12,
    rhoAtRoomOhmCm: 2300,
  },
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

function calcCorrectionFactor(thicknessMm, spacingMm) {
  const ratio = thicknessMm / spacingMm;
  const referenceRatio = REFERENCE_THICKNESS_MM / REFERENCE_SPACING_MM;
  const factor = 1 + (REFERENCE_CORRECTION_FACTOR - 1) * (referenceRatio / Math.max(ratio, 1e-6));
  return Math.max(1, factor);
}

function calcResistivityAtTemp(material, tempC) {
  const tRef = toKelvin(ROOM_TEMP_C);
  const tNow = toKelvin(tempC);
  const exponent =
    (material.energyGapEV / (2 * BOLTZMANN_EV)) * ((1 / tNow) - (1 / tRef));
  return material.rhoAtRoomOhmCm * Math.exp(exponent);
}

function calcMeasuredVoltage(resistivityOhmCm, currentmA, spacingMm, correctionFactor) {
  const currentA = currentmA / 1000;
  const spacingCm = spacingMm / 10;
  return (resistivityOhmCm * currentA * correctionFactor) / (2 * Math.PI * spacingCm);
}

function calcRho0(voltageV, currentmA, spacingMm) {
  const currentA = currentmA / 1000;
  const spacingCm = spacingMm / 10;
  return (voltageV / currentA) * 2 * Math.PI * spacingCm;
}

function calcCorrectedRho(voltageV, currentmA, spacingMm, correctionFactor) {
  return calcRho0(voltageV, currentmA, spacingMm) / correctionFactor;
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

function buildChartData(material, currentmA, spacingMm, thicknessMm) {
  const correctionFactor = calcCorrectionFactor(thicknessMm, spacingMm);
  const data = [];

  for (let temp = ROOM_TEMP_C; temp <= MAX_TEMP_C; temp += 5) {
    const tempK = toKelvin(temp);
    const rho = calcResistivityAtTemp(material, temp);
    const voltage = calcMeasuredVoltage(rho, currentmA, spacingMm, correctionFactor);
    data.push({
      tempC: temp,
      tempK,
      voltage,
      rho,
      rho0: calcRho0(voltage, currentmA, spacingMm),
      x: 1000 / tempK,
      y: log10(rho),
    });
  }

  return data;
}

const FourProbeResistivitySimulation = () => {
  const [materialKey, setMaterialKey] = useState('germanium');
  const [temperatureC, setTemperatureC] = useState(ROOM_TEMP_C);
  const [currentmA, setCurrentmA] = useState(2);
  const [spacingMm, setSpacingMm] = useState(2);
  const [thicknessMm, setThicknessMm] = useState(0.05);

  const material = MATERIALS[materialKey];
  const correctionFactor = calcCorrectionFactor(thicknessMm, spacingMm);

  const chartData = useMemo(
    () => buildChartData(material, currentmA, spacingMm, thicknessMm),
    [material, currentmA, spacingMm, thicknessMm]
  );

  const regression = useMemo(
    () => linearRegression(chartData.map((point) => ({ x: point.x, y: point.y }))),
    [chartData]
  );

  const energyGapEV = 2 * BOLTZMANN_EV * Math.LN10 * 1000 * regression.slope;

  const currentPoint = useMemo(() => {
    const rho = calcResistivityAtTemp(material, temperatureC);
    const voltage = calcMeasuredVoltage(rho, currentmA, spacingMm, correctionFactor);
    const tempK = toKelvin(temperatureC);
    return {
      tempC: temperatureC,
      tempK,
      voltage,
      rho,
      rho0: calcRho0(voltage, currentmA, spacingMm),
      x: 1000 / tempK,
      y: log10(rho),
    };
  }, [material, temperatureC, currentmA, spacingMm, correctionFactor]);

  const exportData = () => {
    const rows = [
      [
        'Material',
        'Current (mA)',
        'Probe spacing (mm)',
        'Thickness (mm)',
        'Correction factor',
        'Temperature (C)',
        'Temperature (K)',
        'Voltage (V)',
        'rho0 (ohm-cm)',
        'Corrected rho (ohm-cm)',
        '1000/T (K^-1)',
        'log10(rho)',
        'Energy gap (eV)',
      ],
      ...chartData.map((point) => [
        material.name,
        currentmA.toFixed(2),
        spacingMm.toFixed(2),
        thicknessMm.toFixed(3),
        correctionFactor.toFixed(3),
        point.tempC,
        point.tempK.toFixed(2),
        point.voltage.toFixed(6),
        point.rho0.toFixed(4),
        point.rho.toFixed(4),
        point.x.toFixed(4),
        point.y.toFixed(5),
        energyGapEV.toFixed(3),
      ]),
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `four_probe_${material.symbol.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetExperiment = () => {
    setMaterialKey('germanium');
    setTemperatureC(ROOM_TEMP_C);
    setCurrentmA(2);
    setSpacingMm(2);
    setThicknessMm(0.05);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 rounded-xl border bg-white p-5 shadow-sm lg:col-span-1">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Four Probe Controls</h3>
          <p className="mt-1 text-sm text-slate-500">
            The outer probes supply current and the two inner probes measure voltage. You can change the
            current level, sample thickness, and semiconductor to study how the measured voltage responds.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Semiconductor</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(MATERIALS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMaterialKey(key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    materialKey === key
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
            <div>Selected sample: {material.name}</div>
            <div>Reference gap used in model: {material.energyGapEV.toFixed(2)} eV</div>
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
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Current Intensity (I): {currentmA.toFixed(1)} mA
            </label>
            <Slider
              min={0.5}
              max={5}
              step={0.1}
              value={[currentmA]}
              onValueChange={(values) => setCurrentmA(values[0])}
            />
            <p className="text-xs leading-5 text-slate-500">
              Resistivity should remain essentially independent of current in the ideal ohmic region, while
              the measured voltage changes in direct proportion to current.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Probe Spacing (s): {spacingMm.toFixed(2)} mm
            </label>
            <Slider
              min={1}
              max={4}
              step={0.1}
              value={[spacingMm]}
              onValueChange={(values) => setSpacingMm(values[0])}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Sample Thickness (w): {thicknessMm.toFixed(3)} mm
            </label>
            <Slider
              min={0.02}
              max={0.5}
              step={0.01}
              value={[thicknessMm]}
              onValueChange={(values) => setThicknessMm(values[0])}
            />
            <p className="text-xs leading-5 text-slate-500">
              The thickness changes the thickness-to-spacing ratio w/s, so the correction factor f(w/s) is
              updated automatically in this simulation.
            </p>
          </div>

          <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
            <div>Correction factor, f(w/s) = {correctionFactor.toFixed(3)}</div>
            <div>w / s = {(thicknessMm / spacingMm).toFixed(4)}</div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={resetExperiment} variant="outline">
              Reset Experiment
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
              <div>Energy gap, Eg = 2k ln(10) × 1000 × slope</div>
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
            The graph is regenerated for the selected semiconductor and geometry. Changing current alters
            the measured voltage, while changing thickness updates the correction factor and corrected
            resistivity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FourProbeResistivitySimulation;
