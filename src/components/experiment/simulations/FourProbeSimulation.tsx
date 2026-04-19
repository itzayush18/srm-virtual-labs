import React, { useEffect, useMemo, useState } from 'react';
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
    eg0EV: 0.7437,
    varshniAlpha: 4.774e-4,
    varshniBeta: 235,
    rhoAtRoomOhmCm: 45,
  },
  silicon: {
    name: 'Silicon',
    symbol: 'Si',
    eg0EV: 1.166,
    varshniAlpha: 4.73e-4,
    varshniBeta: 636,
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

function calcEnergyGapAtTemp(material, tempC) {
  const tempK = toKelvin(tempC);
  return material.eg0EV - (material.varshniAlpha * tempK * tempK) / (tempK + material.varshniBeta);
}

function calcResistivityAtTemp(material, tempC) {
  const tRef = toKelvin(ROOM_TEMP_C);
  const tNow = toKelvin(tempC);
  const egRef = calcEnergyGapAtTemp(material, ROOM_TEMP_C);
  const egNow = calcEnergyGapAtTemp(material, tempC);
  const exponent = (egNow / (2 * BOLTZMANN_EV * tNow)) - (egRef / (2 * BOLTZMANN_EV * tRef));
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
  const [materialKey, setMaterialKey] = useState('germanium');
  const [temperatureC, setTemperatureC] = useState(ROOM_TEMP_C);
  const [currentmA, setCurrentmA] = useState(2);
  const [spacingMm, setSpacingMm] = useState(2);
  const [thicknessMm, setThicknessMm] = useState(0.05);
  const [chartData, setChartData] = useState([]);

  const material = MATERIALS[materialKey];
  const correctionFactor = calcCorrectionFactor(thicknessMm, spacingMm);

  const currentPoint = useMemo(() => {
    const tempK = toKelvin(temperatureC);
    const energyGapEV = calcEnergyGapAtTemp(material, temperatureC);
    const rho = calcResistivityAtTemp(material, temperatureC);
    const voltage = calcMeasuredVoltage(rho, currentmA, spacingMm, correctionFactor);

    return {
      tempC: temperatureC,
      tempK,
      energyGapEV,
      voltage,
      rho,
      rho0: calcRho0(voltage, currentmA, spacingMm),
      x: 1000 / tempK,
      y: log10(rho),
    };
  }, [material, temperatureC, currentmA, spacingMm, correctionFactor]);

  useEffect(() => {
    setChartData((prev) => {
      const nextPoint = {
        tempC: currentPoint.tempC,
        tempK: currentPoint.tempK,
        energyGapEV: currentPoint.energyGapEV,
        voltage: currentPoint.voltage,
        rho: currentPoint.rho,
        rho0: currentPoint.rho0,
        x: currentPoint.x,
        y: currentPoint.y,
      };

      const existingIndex = prev.findIndex((point) => point.tempC === currentPoint.tempC);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = nextPoint;
        return next.sort((a, b) => a.x - b.x);
      }

      return [...prev, nextPoint].sort((a, b) => a.x - b.x);
    });
  }, [currentPoint]);

  useEffect(() => {
    setChartData([]);
  }, [materialKey, currentmA, spacingMm, thicknessMm]);

  const regression = useMemo(
    () => linearRegression(chartData.map((point) => ({ x: point.x, y: point.y }))),
    [chartData]
  );

  const fittedEnergyGapEV =
    chartData.length >= 2 ? 2 * BOLTZMANN_EV * Math.LN10 * 1000 * regression.slope : 0;

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
        'Eg(T) (eV)',
        'Fitted Eg from graph (eV)',
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
        point.energyGapEV.toFixed(4),
        fittedEnergyGapEV.toFixed(4),
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
    setChartData([]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 rounded-xl border bg-white p-5 shadow-sm lg:col-span-1">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Four Probe Controls</h3>
          <p className="mt-1 text-sm text-slate-500">
            The outer probes supply current and the inner probes measure voltage. The displayed band gap
            now changes with temperature through a temperature-dependent semiconductor model.
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
            <div>Band-gap model: Eg(T) = Eg(0) - alpha T^2 / (T + beta)</div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Temperature: {temperatureC} C ({currentPoint.tempK.toFixed(2)} K)
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
              <div className="text-sm text-slate-500">Uncorrected Resistivity, rho0</div>
              <div className="mt-1 text-2xl font-bold text-teal-700">
                {currentPoint.rho0.toFixed(2)} ohm-cm
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">Corrected Resistivity, rho</div>
              <div className="mt-1 text-2xl font-bold text-teal-700">
                {currentPoint.rho.toFixed(2)} ohm-cm
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">1000 / T</div>
              <div className="mt-1 text-2xl font-bold text-indigo-700">
                {currentPoint.x.toFixed(4)} K^-1
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">log10 rho</div>
              <div className="mt-1 text-2xl font-bold text-indigo-700">
                {currentPoint.y.toFixed(4)}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-slate-500">Energy Gap at This Temperature</div>
              <div className="mt-1 text-2xl font-bold text-rose-700">
                {currentPoint.energyGapEV.toFixed(3)} eV
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            {chartData.length >= 2
              ? `Fitted energy gap from the current graph: ${fittedEnergyGapEV.toFixed(3)} eV`
              : 'Record at least two temperatures to estimate a fitted energy gap from the graph.'}
          </div>

          <div className="mt-5 rounded-xl border bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-700">Four Probe Relations</h4>
            <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
              <div>rho0 = (V / I) x 2pi s</div>
              <div>rho = rho0 / f(w/s)</div>
              <div>For the graph, y = log10 rho and x = 1000 / T</div>
              <div>Temperature-dependent band gap: Eg(T) = Eg(0) - alpha T^2 / (T + beta)</div>
              <div>Graph-fit gap: Eg = 2k ln(10) x 1000 x slope</div>
              <div>Move the temperature slider to collect graph points experimentally</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">log10 rho versus 1000 / T</h3>
          <div className="mt-4 h-80">
            {chartData.length > 0 ? (
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
                    label={{ value: 'log10 rho', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'log10 rho') return [Number(value).toFixed(4), name];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `1000 / T = ${Number(label).toFixed(4)} K^-1`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="y"
                    name="log10 rho"
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
                    label={{ value: `${temperatureC} C`, position: 'top', fill: '#dc2626' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-slate-500">
                Move the temperature slider to start plotting data points
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            The curve is now allowed to bend slightly because the displayed band gap changes with
            temperature. The fitted graph value is still shown separately as an average estimate from the
            recorded points.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FourProbeResistivitySimulation;
