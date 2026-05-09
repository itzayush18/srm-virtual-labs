import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

interface CurvePoint {
  load: number;
  voltage: number;
  current: number;
  power: number;
  tangentCurrent: number | null;
}

interface LampOption {
  label: string;
  value: 75 | 100;
}

const LAMP_OPTIONS: LampOption[] = [
  { label: '75 W Lamp', value: 75 },
  { label: '100 W Lamp', value: 100 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatNumber = (value: number, digits = 2) => value.toFixed(digits);

const LoadKnob = ({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) => {
  const angle = -135 + ((value - min) / (max - min)) * 270;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full bg-slate-200 shadow-inner" />
        <div className="absolute inset-2 rounded-full border border-slate-300 bg-gradient-to-br from-white to-slate-300" />
        <div
          className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-full rounded-full bg-slate-800"
          style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)`, transformOrigin: 'bottom' }}
        />
        <div className="absolute inset-[38%] rounded-full bg-slate-700 shadow-md" />
      </div>
      <input
        aria-label="Load resistance knob"
        className="w-full accent-slate-700"
        max={max}
        min={min}
        step={0.5}
        type="range"
        value={value}
        onChange={event => onChange(Number(event.target.value))}
      />
      <div className="text-sm font-medium text-slate-700">{formatNumber(value, 1)} ohm</div>
    </div>
  );
};

const SolarCellVisual = ({
  distanceCm,
  lampPower,
  widthCm,
  heightCm,
  load,
}: {
  distanceCm: number;
  lampPower: number;
  widthCm: number;
  heightCm: number;
  load: number;
}) => {
  const x = 140 + ((distanceCm - 10) / 15) * 210;

  return (
    <div className="h-full w-full bg-gradient-to-br from-amber-50 via-white to-sky-100">
      <svg className="h-full w-full" viewBox="0 0 560 280">
        <defs>
          <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="panelFill" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        <rect fill="#dbeafe" height="160" width="560" y="120" />
        <rect fill="#64748b" height="90" rx="4" width="12" x="72" y="40" />
        <circle cx="78" cy="60" fill="#f59e0b" r="16" />
        <circle cx="78" cy="60" fill="url(#lampGlow)" r="90" />
        <text className="fill-slate-700 text-[12px]" x="32" y="28">
          Fixed lamp ({lampPower} W)
        </text>

        <line stroke="#cbd5e1" strokeDasharray="6 6" strokeWidth="2" x1="92" x2={x + 10} y1="60" y2="128" />
        <text className="fill-slate-700 text-[12px]" x={(92 + x + 10) / 2 - 28} y="82">
          {distanceCm} cm
        </text>

        <g transform={`translate(${x}, 128)`}>
          <rect fill="url(#panelFill)" height="94" rx="6" stroke="#0f172a" strokeWidth="2" width="72" x="0" y="0" />
          <g opacity="0.35" stroke="#93c5fd" strokeWidth="1">
            <line x1="12" x2="12" y1="8" y2="86" />
            <line x1="24" x2="24" y1="8" y2="86" />
            <line x1="36" x2="36" y1="8" y2="86" />
            <line x1="48" x2="48" y1="8" y2="86" />
            <line x1="60" x2="60" y1="8" y2="86" />
            <line x1="6" x2="66" y1="22" y2="22" />
            <line x1="6" x2="66" y1="44" y2="44" />
            <line x1="6" x2="66" y1="66" y2="66" />
          </g>
          <text className="fill-white text-[11px]" x="6" y="114">
            Cell {widthCm} x {heightCm} cm
          </text>
        </g>

        <g transform="translate(430, 98)">
          <rect fill="#e2e8f0" height="76" rx="8" stroke="#94a3b8" width="84" x="0" y="0" />
          <path
            d="M18 24 C 28 12, 42 12, 50 24 S 70 36, 18 52"
            fill="none"
            stroke="#475569"
            strokeWidth="3"
          />
          <text className="fill-slate-700 text-[11px]" x="12" y="68">
            Load {formatNumber(load, 1)} ohm
          </text>
        </g>
      </svg>
    </div>
  );
};

const SolarCellSimulation = () => {
  const [lampPower, setLampPower] = useState<75 | 100>(100);
  const [distanceCm, setDistanceCm] = useState(15);
  const [temperature, setTemperature] = useState(25);
  const [widthCm, setWidthCm] = useState(6);
  const [heightCm, setHeightCm] = useState(8);
  const [selectedLoad, setSelectedLoad] = useState(15);
  const [curveData, setCurveData] = useState<CurvePoint[]>([]);

  const areaCm2 = widthCm * heightCm;
  const areaM2 = areaCm2 / 10000;
  const distanceM = distanceCm / 100;
  const irradiance = lampPower / (4 * Math.PI * distanceM * distanceM);
  const incidentPower = irradiance * areaM2;

  const temperatureFactor = clamp(1 - (temperature - 25) * 0.004, 0.75, 1.05);
  const geometryFactor = clamp(areaCm2 / 48, 0.6, 1.8);

  const shortCircuitCurrent = useMemo(() => {
    const baseCurrent = 2.6;
    return baseCurrent * (irradiance / 350) * geometryFactor * temperatureFactor;
  }, [geometryFactor, irradiance, temperatureFactor]);

  const openCircuitVoltage = useMemo(() => {
    const baseVoltage = 21;
    const irradianceTerm = Math.log1p(irradiance / 180) / Math.log1p(1000 / 180);
    return clamp(baseVoltage * (0.78 + 0.28 * irradianceTerm) * (1 - (temperature - 25) * 0.0022), 8, 24);
  }, [irradiance, temperature]);

  const solveOperatingPoint = useCallback(
    (load: number) => {
      if (load <= 0.05) {
        return { voltage: 0, current: shortCircuitCurrent };
      }

      let low = 0;
      let high = openCircuitVoltage;
      const shape = 1.35;

      for (let step = 0; step < 50; step += 1) {
        const mid = (low + high) / 2;
        const cellCurrent = shortCircuitCurrent * Math.max(0, 1 - (mid / openCircuitVoltage) ** shape);
        const loadCurrent = mid / load;

        if (cellCurrent > loadCurrent) {
          low = mid;
        } else {
          high = mid;
        }
      }

      const voltage = (low + high) / 2;
      const current = voltage / load;

      return { voltage, current };
    },
    [openCircuitVoltage, shortCircuitCurrent],
  );

  const generateCurves = useCallback(() => {
    const nextData: CurvePoint[] = [];
    const maxLoad = 60;
    const steps = 30;

    let bestIndex = 0;
    let bestPower = -1;

    for (let index = 0; index <= steps; index += 1) {
      const load = index === 0 ? 0.1 : (maxLoad / steps) * index;
      const { voltage, current } = solveOperatingPoint(load);
      const power = voltage * current;

      nextData.push({
        load: Number(load.toFixed(2)),
        voltage: Number(voltage.toFixed(3)),
        current: Number(current.toFixed(3)),
        power: Number(power.toFixed(3)),
        tangentCurrent: null,
      });

      if (power > bestPower) {
        bestPower = power;
        bestIndex = nextData.length - 1;
      }
    }

    const mpp = nextData[bestIndex];
    const previous = nextData[Math.max(0, bestIndex - 1)];
    const next = nextData[Math.min(nextData.length - 1, bestIndex + 1)];
    const slope =
      next.voltage === previous.voltage
        ? 0
        : (next.current - previous.current) / (next.voltage - previous.voltage);

    const tangentSpan = openCircuitVoltage * 0.22;

    nextData.forEach(point => {
      const xDistance = point.voltage - mpp.voltage;
      if (Math.abs(xDistance) <= tangentSpan) {
        point.tangentCurrent = Number((mpp.current + slope * xDistance).toFixed(3));
      }
    });

    setCurveData(nextData);
  }, [openCircuitVoltage, solveOperatingPoint]);

  useEffect(() => {
    generateCurves();
  }, [generateCurves]);

  const selectedPoint = useMemo(() => {
    if (curveData.length === 0) {
      return null;
    }

    return curveData.reduce((closest, point) =>
      Math.abs(point.load - selectedLoad) < Math.abs(closest.load - selectedLoad) ? point : closest,
    );
  }, [curveData, selectedLoad]);

  const mppPoint = useMemo(() => {
    if (curveData.length === 0) {
      return null;
    }

    return curveData.reduce((best, point) => (point.power > best.power ? point : best), curveData[0]);
  }, [curveData]);

  const efficiency = useMemo(() => {
    if (!mppPoint || incidentPower <= 0) {
      return 0;
    }

    return (mppPoint.power / incidentPower) * 100;
  }, [incidentPower, mppPoint]);

  const exportData = useCallback(() => {
    if (curveData.length === 0) {
      return;
    }

    const rows = [
      [
        'Load (ohm)',
        'Voltage (V)',
        'Current (A)',
        'Power (W)',
        'Distance (cm)',
        'Lamp Power (W)',
        'Area (cm^2)',
        'Efficiency (%)',
      ],
      ...curveData.map(point => [
        point.load,
        point.voltage,
        point.current,
        point.power,
        distanceCm,
        lampPower,
        areaCm2,
        Number(efficiency.toFixed(2)),
      ]),
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'solar-cell-characteristics.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [areaCm2, curveData, distanceCm, efficiency, lampPower]);

  const resetExperiment = useCallback(() => {
    setLampPower(100);
    setDistanceCm(15);
    setTemperature(25);
    setWidthCm(6);
    setHeightCm(8);
    setSelectedLoad(15);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Solar Cell Efficiency Experiment</h3>
        <p className="mt-1 text-sm text-slate-600">
          Efficiency is calculated as Pmax / (A x Io) x 100, where Io = Lamp Power / (4 x pi x D^2).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Lamp Power</label>
            <div className="grid grid-cols-2 gap-2">
              {LAMP_OPTIONS.map(option => (
                <Button
                  key={option.value}
                  className="w-full"
                  variant={lampPower === option.value ? 'default' : 'outline'}
                  onClick={() => setLampPower(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex justify-between text-sm font-medium text-slate-800">
              <span>Distance Between Lamp and Cell</span>
              <span>{distanceCm} cm</span>
            </label>
            <Slider
              max={25}
              min={10}
              step={1}
              value={[distanceCm]}
              onValueChange={value => setDistanceCm(value[0])}
            />
            <p className="text-xs text-slate-500">Use 10-15 cm for minimum distance and 20-25 cm for maximum distance.</p>
          </div>

          <div className="space-y-2">
            <label className="flex justify-between text-sm font-medium text-slate-800">
              <span>Temperature</span>
              <span>{temperature} deg C</span>
            </label>
            <Slider
              max={60}
              min={15}
              step={1}
              value={[temperature]}
              onValueChange={value => setTemperature(value[0])}
            />
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-800">Solar Cell Area</div>

            <div className="space-y-2">
              <label className="flex justify-between text-sm text-slate-700">
                <span>Width</span>
                <span>{widthCm} cm</span>
              </label>
              <Slider max={10} min={4} step={1} value={[widthCm]} onValueChange={value => setWidthCm(value[0])} />
            </div>

            <div className="space-y-2">
              <label className="flex justify-between text-sm text-slate-700">
                <span>Height</span>
                <span>{heightCm} cm</span>
              </label>
              <Slider max={12} min={4} step={1} value={[heightCm]} onValueChange={value => setHeightCm(value[0])} />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Area = {areaCm2} cm^2 ({formatNumber(areaM2, 4)} m^2)
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-medium text-slate-800">Load Adjustment Knob</div>
            <LoadKnob max={60} min={0.5} value={selectedLoad} onChange={setSelectedLoad} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="w-full" onClick={generateCurves}>
              Refresh Curves
            </Button>
            <Button className="w-full" variant="outline" onClick={exportData}>
              Export CSV
            </Button>
          </div>

          <Button className="w-full" variant="secondary" onClick={resetExperiment}>
            Reset Experiment
          </Button>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SolarCellVisual
              distanceCm={distanceCm}
              heightCm={heightCm}
              lampPower={lampPower}
              load={selectedLoad}
              widthCm={widthCm}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Open-Circuit Voltage</div>
              <div className="mt-1 text-2xl font-semibold text-sky-700">{formatNumber(openCircuitVoltage)} V</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Short-Circuit Current</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-700">{formatNumber(shortCircuitCurrent, 3)} A</div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Incident Power</div>
              <div className="mt-1 text-2xl font-semibold text-amber-700">{formatNumber(incidentPower, 3)} W</div>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Efficiency At Pmax</div>
              <div className="mt-1 text-2xl font-semibold text-violet-700">{formatNumber(efficiency)} %</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Selected Load</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(selectedPoint?.load ?? selectedLoad, 1)} ohm</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Voltage At Load</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(selectedPoint?.voltage ?? 0)} V</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Current At Load</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(selectedPoint?.current ?? 0, 3)} A</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Pmax</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(mppPoint?.power ?? 0, 3)} W</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-4 text-base font-semibold text-slate-900">I-V Curve with P-V Overlay and Tangent at Pmax</h4>
            <div className="h-[340px]">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={curveData}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="voltage"
                    label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -4 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    yAxisId="current"
                    label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                    stroke="#64748b"
                  />
                  <YAxis
                    orientation="right"
                    stroke="#64748b"
                    yAxisId="power"
                    label={{ value: 'Power (W)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip formatter={(value: number) => formatNumber(Number(value), 3)} />
                  <Legend />
                  <Line dataKey="current" dot={false} name="Current" stroke="#0284c7" strokeWidth={3} type="monotone" yAxisId="current" />
                  <Line dataKey="power" dot={false} name="Power" stroke="#7c3aed" strokeWidth={3} type="monotone" yAxisId="power" />
                  <Line
                    connectNulls
                    dataKey="tangentCurrent"
                    dot={false}
                    name="Tangent at Pmax"
                    stroke="#ef4444"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    type="linear"
                    yAxisId="current"
                  />
                  {mppPoint ? (
                    <ReferenceDot
                      fill="#111827"
                      label={{ value: 'Pmax', position: 'top' }}
                      r={5}
                      x={mppPoint.voltage}
                      y={mppPoint.current}
                      yAxisId="current"
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-4 text-base font-semibold text-slate-900">V-R and I-R Characteristics</h4>
            <div className="h-[320px]">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={curveData}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="load"
                    label={{ value: 'Load Resistance (ohm)', position: 'insideBottom', offset: -4 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    yAxisId="voltage"
                    label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }}
                    stroke="#64748b"
                  />
                  <YAxis
                    orientation="right"
                    stroke="#64748b"
                    yAxisId="current"
                    label={{ value: 'Current (A)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip formatter={(value: number) => formatNumber(Number(value), 3)} />
                  <Legend />
                  <Line dataKey="voltage" dot={false} name="Voltage vs Load" stroke="#f59e0b" strokeWidth={3} type="monotone" yAxisId="voltage" />
                  <Line dataKey="current" dot={false} name="Current vs Load" stroke="#10b981" strokeWidth={3} type="monotone" yAxisId="current" />
                  {selectedPoint ? (
                    <ReferenceDot fill="#111827" r={5} x={selectedPoint.load} y={selectedPoint.voltage} yAxisId="voltage" />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarCellSimulation;
