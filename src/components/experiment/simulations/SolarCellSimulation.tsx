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
  currentMilliAmp: number;
  power: number;
}

interface LampOption {
  label: string;
  value: 75 | 100;
}

const LOAD_OPTIONS = [10, 22, 47, 56, 68, 82, 100, 160, 180] as const;
const BASE_CURRENT_MA = [36, 36, 35.8, 35.5, 35.1, 34, 23, 6, 1.2] as const;
const BASE_VOLTAGE_V = [0.91, 1.36, 2.01, 2.27, 2.58, 2.83, 2.95, 3.0, 3.02] as const;
const EFFECTIVE_LAMP_RADIUS_CM = 6;

const LAMP_OPTIONS: LampOption[] = [
  { label: '75 W Lamp', value: 75 },
  { label: '100 W Lamp', value: 100 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatNumber = (value: number, digits = 2) => value.toFixed(digits);

const LoadKnob = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) => {
  const selectedIndex = LOAD_OPTIONS.findIndex(option => option === value);
  const angle = -135 + (selectedIndex / (LOAD_OPTIONS.length - 1)) * 270;

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
        max={LOAD_OPTIONS.length - 1}
        min={0}
        step={1}
        type="range"
        value={Math.max(selectedIndex, 0)}
        onChange={event => onChange(LOAD_OPTIONS[Number(event.target.value)])}
      />
      <div className="text-sm font-medium text-slate-700">{formatNumber(value, 0)} ohm</div>
      <div className="text-center text-xs text-slate-500">
        {LOAD_OPTIONS.join(', ')} ohm
      </div>
    </div>
  );
};

const SolarCellVisual = ({
  distanceCm,
  lampPower,
  widthCm,
  heightCm,
}: {
  distanceCm: number;
  lampPower: number;
  widthCm: number;
  heightCm: number;
}) => {
  const x = 150 + ((distanceCm - 10) / 15) * 195;
  const panelWidth = 44 + widthCm * 6;
  const panelHeight = 38 + heightCm * 6;
  const panelY = 165 - panelHeight / 2;

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
        <rect fill="#64748b" height="92" rx="4" width="12" x="72" y="38" />
        <circle cx="78" cy="60" fill="#f59e0b" r="16" />
        <circle cx="78" cy="60" fill="url(#lampGlow)" r="92" />
        <text className="fill-slate-700 text-[12px]" x="30" y="28">
          Fixed lamp ({lampPower} W)
        </text>

        <line stroke="#cbd5e1" strokeDasharray="6 6" strokeWidth="2" x1="92" x2={x + panelWidth / 2} y1="60" y2={panelY + panelHeight / 2} />
        <text className="fill-slate-700 text-[12px]" x={(92 + x + panelWidth / 2) / 2 - 24} y="82">
          {distanceCm} cm
        </text>

        <g transform={`translate(${x}, ${panelY})`}>
          <rect
            fill="url(#panelFill)"
            height={panelHeight}
            rx="6"
            stroke="#0f172a"
            strokeWidth="2"
            width={panelWidth}
            x="0"
            y="0"
          />
          <g opacity="0.35" stroke="#93c5fd" strokeWidth="1">
            <line x1={panelWidth * 0.17} x2={panelWidth * 0.17} y1="8" y2={panelHeight - 8} />
            <line x1={panelWidth * 0.33} x2={panelWidth * 0.33} y1="8" y2={panelHeight - 8} />
            <line x1={panelWidth * 0.5} x2={panelWidth * 0.5} y1="8" y2={panelHeight - 8} />
            <line x1={panelWidth * 0.67} x2={panelWidth * 0.67} y1="8" y2={panelHeight - 8} />
            <line x1={panelWidth * 0.83} x2={panelWidth * 0.83} y1="8" y2={panelHeight - 8} />
            <line x1="6" x2={panelWidth - 6} y1={panelHeight * 0.25} y2={panelHeight * 0.25} />
            <line x1="6" x2={panelWidth - 6} y1={panelHeight * 0.5} y2={panelHeight * 0.5} />
            <line x1="6" x2={panelWidth - 6} y1={panelHeight * 0.75} y2={panelHeight * 0.75} />
          </g>
          <text className="fill-white text-[11px]" x="6" y={panelHeight + 18}>
            Cell {widthCm} x {heightCm} cm
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
  const [selectedLoad, setSelectedLoad] = useState<number>(47);
  const [curveData, setCurveData] = useState<CurvePoint[]>([]);

  const areaCm2 = widthCm * heightCm;
  const areaM2 = areaCm2 / 10000;
  const distanceM = distanceCm / 100;
  const correctionDistanceM = EFFECTIVE_LAMP_RADIUS_CM / 100;
  const irradiance = lampPower / (4 * Math.PI * distanceM * distanceM);
  const correctedIrradiance =
    lampPower / (4 * Math.PI * (distanceM * distanceM + correctionDistanceM * correctionDistanceM));
  const incidentPower = irradiance * areaM2;
  const correctedIncidentPower = correctedIrradiance * areaM2;

  const lampScale = lampPower / 100;
  const areaScale = areaCm2 / 48;
  const distanceRatio = 10 / distanceCm;
  const distanceCurrentScale = distanceRatio ** 0.66;
  const distanceVoltageScale = 0.82 + 0.18 * distanceRatio ** 1.85;
  const currentTemperatureFactor = clamp(1 - (temperature - 25) * 0.0035, 0.82, 1.04);
  const voltageTemperatureFactor = clamp(1 - (temperature - 25) * 0.0018, 0.9, 1.03);

  const estimatedShortCircuitCurrent = useMemo(() => {
    const baseShortCircuitCurrentMilliAmp = 38;
    return (
      (baseShortCircuitCurrentMilliAmp * lampScale * areaScale * distanceCurrentScale * currentTemperatureFactor) /
      1000
    );
  }, [areaScale, currentTemperatureFactor, distanceCurrentScale, lampScale]);

  const estimatedOpenCircuitVoltage = useMemo(() => {
    const baseOpenCircuitVoltage = 3.35;
    return (
      baseOpenCircuitVoltage *
      Math.sqrt(lampScale) *
      areaScale ** 0.08 *
      distanceVoltageScale *
      voltageTemperatureFactor
    );
  }, [areaScale, distanceVoltageScale, lampScale, voltageTemperatureFactor]);

  const solveOperatingPoint = useCallback(
    (load: number) => {
      const loadIndex = LOAD_OPTIONS.findIndex(option => option === load);
      const normalizedIndex = Math.max(loadIndex, 0) / (LOAD_OPTIONS.length - 1);
      const kneeWeight = clamp((normalizedIndex - 0.62) / 0.38, 0, 1);
      const baseCurrentMilliAmp = BASE_CURRENT_MA[Math.max(loadIndex, 0)];
      const baseVoltage = BASE_VOLTAGE_V[Math.max(loadIndex, 0)];
      const distanceKneeFactor = 1 - (1 - distanceRatio ** 0.9) * kneeWeight * 0.88;
      const nearDistanceBoost = 1 + (distanceRatio - 1) * kneeWeight * 0.12;

      const currentMilliAmp =
        baseCurrentMilliAmp *
        lampScale *
        areaScale *
        distanceCurrentScale *
        currentTemperatureFactor *
        distanceKneeFactor *
        nearDistanceBoost;
      const voltage =
        baseVoltage *
        Math.sqrt(lampScale) *
        areaScale ** 0.08 *
        distanceVoltageScale *
        voltageTemperatureFactor;
      const current = currentMilliAmp / 1000;

      return {
        voltage,
        current,
        currentMilliAmp,
      };
    },
    [
      areaScale,
      currentTemperatureFactor,
      distanceCurrentScale,
      distanceRatio,
      distanceVoltageScale,
      lampScale,
      voltageTemperatureFactor,
    ],
  );

  const generateCurves = useCallback(() => {
    const nextData: CurvePoint[] = [];
    for (const load of LOAD_OPTIONS) {
      const { voltage, current, currentMilliAmp } = solveOperatingPoint(load);
      const power = voltage * current;

      nextData.push({
        load,
        voltage: Number(voltage.toFixed(3)),
        current: Number(current.toFixed(3)),
        currentMilliAmp: Number(currentMilliAmp.toFixed(1)),
        power: Number(power.toFixed(3)),
      });
    }

    setCurveData(nextData);
  }, [solveOperatingPoint]);

  useEffect(() => {
    generateCurves();
  }, [generateCurves]);

  const selectedPoint = useMemo(() => {
    if (curveData.length === 0) {
      return null;
    }

    return curveData.find(point => point.load === selectedLoad) ?? curveData[0];
  }, [curveData, selectedLoad]);

  const maxPowerPoint = useMemo(() => {
    if (curveData.length === 0) {
      return null;
    }

    return curveData.reduce((best, point) => (point.power > best.power ? point : best), curveData[0]);
  }, [curveData]);

  const maxPower = maxPowerPoint?.power ?? 0;

  const efficiency = useMemo(() => {
    if (incidentPower <= 0) {
      return 0;
    }

    return (maxPower / incidentPower) * 100;
  }, [incidentPower, maxPower]);

  const displayEfficiency = clamp(efficiency, 0, 100);
  const correctedEfficiency = useMemo(() => {
    if (correctedIncidentPower <= 0) {
      return 0;
    }

    return (maxPower / correctedIncidentPower) * 100;
  }, [correctedIncidentPower, maxPower]);
  const displayCorrectedEfficiency = clamp(correctedEfficiency, 0, 100);

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
        'Open Circuit Voltage (V)',
        'Short Circuit Current (A)',
        'Efficiency Point Source (%)',
        'Efficiency Corrected Source (%)',
      ],
      ...curveData.map(point => [
        point.load,
        point.voltage,
        point.current,
        point.power,
        distanceCm,
        lampPower,
        areaCm2,
        Number(estimatedOpenCircuitVoltage.toFixed(3)),
        Number(estimatedShortCircuitCurrent.toFixed(3)),
        Number(displayEfficiency.toFixed(2)),
        Number(displayCorrectedEfficiency.toFixed(2)),
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
  }, [areaCm2, curveData, distanceCm, displayCorrectedEfficiency, displayEfficiency, estimatedOpenCircuitVoltage, estimatedShortCircuitCurrent, lampPower]);

  const resetExperiment = useCallback(() => {
    setLampPower(100);
    setDistanceCm(15);
    setTemperature(25);
    setWidthCm(6);
    setHeightCm(8);
    setSelectedLoad(47);
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
            <LoadKnob value={selectedLoad} onChange={setSelectedLoad} />
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
              widthCm={widthCm}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Voltmeter Reading</div>
              <div className="mt-1 text-2xl font-semibold text-sky-700">{formatNumber(selectedPoint?.voltage ?? 0)} V</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Ammeter Reading</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-700">{formatNumber(selectedPoint?.currentMilliAmp ?? 0, 1)} mA</div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Estimated Voc</div>
              <div className="mt-1 text-2xl font-semibold text-amber-700">{formatNumber(estimatedOpenCircuitVoltage)} V</div>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Estimated Isc</div>
              <div className="mt-1 text-2xl font-semibold text-violet-700">{formatNumber(estimatedShortCircuitCurrent * 1000, 1)} mA</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Selected Load</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(selectedPoint?.load ?? selectedLoad, 0)} ohm</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Voltage At Load</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(selectedPoint?.voltage ?? 0)} V</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Current At Load</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(selectedPoint?.currentMilliAmp ?? 0, 1)} mA</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">Efficiency At Pmax</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(displayEfficiency)} %</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-amber-50 p-4 shadow-sm">
            <div className="text-sm text-slate-600">Selected Reading</div>
            <div className="mt-1 text-base font-semibold text-slate-900">
              Load {formatNumber(selectedPoint?.load ?? selectedLoad, 0)} ohm, Voltage {formatNumber(selectedPoint?.voltage ?? 0)} V, Current {formatNumber(selectedPoint?.currentMilliAmp ?? 0, 1)} mA
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-slate-500">Incident Power (Point Source)</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(incidentPower, 3)} W</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Pmax From V-I Points</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(maxPower, 3)} W</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Corrected Incident Power</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(correctedIncidentPower, 3)} W</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-sky-50 p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-slate-600">Point-Source Efficiency</div>
                <div className="mt-1 text-2xl font-semibold text-sky-900">{formatNumber(displayEfficiency)} %</div>
                <div className="mt-1 text-xs text-slate-600">
                  Uses Io = P / (4 x pi x D^2)
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Corrected Lamp-Source Efficiency</div>
                <div className="mt-1 text-2xl font-semibold text-sky-900">{formatNumber(displayCorrectedEfficiency)} %</div>
                <div className="mt-1 text-xs text-slate-600">
                  Uses Io = P / (4 x pi x (D^2 + D0^2)), where D0 = {EFFECTIVE_LAMP_RADIUS_CM} cm
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-4 text-base font-semibold text-slate-900">I-V Characteristics</h4>
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
                    label={{ value: 'Current (mA)', angle: -90, position: 'insideLeft' }}
                    stroke="#64748b"
                  />
                  <Tooltip formatter={(value: number) => formatNumber(Number(value), 3)} />
                  <Legend />
                  <Line
                    dataKey="currentMilliAmp"
                    dot={{ r: 4, fill: '#0284c7', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    name="V-I Points"
                    stroke="#0284c7"
                    strokeWidth={3}
                    type="monotone"
                  />
                  {selectedPoint ? (
                    <ReferenceDot
                      fill="#f97316"
                      ifOverflow="visible"
                      label={{ value: 'Selected', position: 'top', fill: '#c2410c' }}
                      r={6}
                      x={selectedPoint.voltage}
                      y={selectedPoint.currentMilliAmp}
                    />
                  ) : null}
                  {maxPowerPoint ? (
                    <ReferenceDot
                      fill="#dc2626"
                      ifOverflow="visible"
                      label={{ value: 'Pmax', position: 'top', fill: '#991b1b' }}
                      r={6}
                      x={maxPowerPoint.voltage}
                      y={maxPowerPoint.currentMilliAmp}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-4 text-base font-semibold text-slate-900">V-R Characteristics</h4>
            <div className="h-[320px]">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={curveData}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="voltage"
                    label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -4 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    label={{ value: 'Resistance (ohm)', angle: -90, position: 'insideLeft' }}
                    stroke="#64748b"
                  />
                  <Tooltip formatter={(value: number) => formatNumber(Number(value), 3)} />
                  <Legend />
                  <Line
                    dataKey="load"
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    name="V-R Points"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    type="monotone"
                  />
                  {selectedPoint ? (
                    <ReferenceDot
                      fill="#0f172a"
                      ifOverflow="visible"
                      label={{ value: 'Selected', position: 'top', fill: '#0f172a' }}
                      r={6}
                      x={selectedPoint.voltage}
                      y={selectedPoint.load}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-4 text-base font-semibold text-slate-900">Load, Voltage and Current Table</h4>
            <div className="max-h-[320px] overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-medium">Load (ohm)</th>
                    <th className="px-4 py-3 font-medium">Voltage (V)</th>
                    <th className="px-4 py-3 font-medium">Current (mA)</th>
                    <th className="px-4 py-3 font-medium">Power (W)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {curveData.map(point => {
                    const isSelected = selectedPoint?.load === point.load;

                    return (
                      <tr key={point.load} className={isSelected ? 'bg-amber-50' : 'bg-white'}>
                        <td className="px-4 py-2 text-slate-800">{formatNumber(point.load, 2)}</td>
                        <td className="px-4 py-2 text-slate-800">{formatNumber(point.voltage, 3)}</td>
                        <td className="px-4 py-2 text-slate-800">{formatNumber(point.currentMilliAmp, 1)}</td>
                        <td className="px-4 py-2 text-slate-800">{formatNumber(point.power, 3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarCellSimulation;
