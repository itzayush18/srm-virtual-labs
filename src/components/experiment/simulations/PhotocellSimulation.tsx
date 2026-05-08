import React, { useEffect, useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
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
import { Button } from '@/components/ui/button';

type IlluminationPoint = {
  id: number;
  distance: number;
  intensity: number;
  voltage: number;
  current: number;
};

type VIReading = {
  loadResistance: number;
  voltage: number;
  current: number;
};

type VIDistanceKey = 'minimum' | 'medium' | 'maximum';

type VIDistanceSeries = {
  label: string;
  distance: number;
  intensity: number;
  stoppingVoltage: number;
  readings: VIReading[];
};

const DISTANCE_OPTIONS: Record<VIDistanceKey, { label: string; distance: number }> = {
  minimum: { label: 'Minimum Distance', distance: 10 },
  medium: { label: 'Medium Distance', distance: 25 },
  maximum: { label: 'Maximum Distance', distance: 40 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

const calculateRelativeIntensity = (distance: number) => {
  const referenceDistance = 10;
  const intensityPercent = 100 * Math.pow(referenceDistance / distance, 2);
  return clamp(round(intensityPercent, 1), 6, 100);
};

const calculateIlluminationMeasurement = (distance: number) => {
  const intensity = calculateRelativeIntensity(distance);
  const current = round(12 * (intensity / 100), 2);
  const minimumLoadResistance = 10;
  const voltage = round((current / 1000) * minimumLoadResistance, 3);

  return {
    distance,
    intensity,
    current,
    voltage,
  };
};

const calculateVICurrent = (collectorVoltage: number, intensity: number, stoppingVoltage: number) => {
  const saturationCurrent = 9 * (intensity / 100);
  const sharpness = 4.2;
  const dropFactor = 1 / (1 + Math.exp((collectorVoltage - stoppingVoltage) * sharpness));
  const current = saturationCurrent * (0.985 * dropFactor + 0.015);
  return round(Math.max(current, 0), 2);
};

const createEmptyVISeries = (distance: number): VIDistanceSeries => {
  const intensity = calculateRelativeIntensity(distance);
  const stoppingVoltage = round(3.4 + 2.2 * (intensity / 100), 2);

  return {
    label:
      distance === DISTANCE_OPTIONS.minimum.distance
        ? DISTANCE_OPTIONS.minimum.label
        : distance === DISTANCE_OPTIONS.medium.distance
          ? DISTANCE_OPTIONS.medium.label
          : DISTANCE_OPTIONS.maximum.label,
    distance,
    intensity,
    stoppingVoltage,
    readings: [],
  };
};

const LampPhotocellVisualization = ({
  distance,
  intensity,
  voltage,
  current,
}: {
  distance: number;
  intensity: number;
  voltage: number;
  current: number;
}) => {
  const beamOpacity = clamp(0.22 + intensity / 120, 0.25, 0.95);
  const beamWidth = clamp(10 + intensity / 6, 18, 34);
  const photocellGlow = clamp(0.2 + intensity / 110, 0.25, 0.9);
  const distancePercent = ((distance - 10) / 40) * 100;
  const lampLeft = 12;
  const photocellLeft = 48 + distancePercent * 0.34;
  const gapWidth = Math.max(photocellLeft - lampLeft - 10, 12);

  return (
    <div className="relative h-full overflow-hidden rounded-md bg-[radial-gradient(circle_at_top,_#163257_0%,_#09111f_45%,_#030712_100%)] text-white">
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]" />

      <div className="absolute left-5 top-5 rounded-full border border-cyan-300/30 bg-slate-900/70 px-3 py-2 text-xs shadow-lg backdrop-blur">
        <div className="font-semibold text-cyan-200">Light Meter</div>
        <div>Intensity: {intensity}%</div>
        <div>Voltage: {voltage} V</div>
        <div>Current: {current} uA</div>
      </div>

      <div className="absolute bottom-5 left-6 right-6 h-2 rounded-full bg-slate-700/70">
        <div className="absolute -top-6 left-0 right-0 flex justify-between text-[10px] text-slate-300">
          <span>0 cm</span>
          <span>10 cm</span>
          <span>20 cm</span>
          <span>30 cm</span>
          <span>40 cm</span>
          <span>50 cm</span>
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="absolute -top-1 h-4 w-[2px] bg-slate-300"
            style={{ left: `${index * 20}%` }}
          />
        ))}
      </div>

      <div
        className="absolute bottom-20 h-16 w-16 rounded-full border-4 border-amber-200 bg-[radial-gradient(circle,_#fff4a3_0%,_#ffd34d_45%,_#f59e0b_72%,_#7c2d12_100%)] shadow-[0_0_40px_rgba(251,191,36,0.85)]"
        style={{ left: `${lampLeft}%` }}
      />
      <div
        className="absolute bottom-23 h-12 rounded-r-[40px] rounded-l-[12px] bg-slate-500 shadow-lg"
        style={{ left: `${lampLeft + 8}%`, width: '11%' }}
      />
      <div className="absolute bottom-16 text-xs text-amber-200" style={{ left: `${lampLeft}%` }}>
        Lamp
      </div>

      <div
        className="absolute bottom-[6.15rem] rounded-full blur-2xl"
        style={{
          left: `${lampLeft + 8}%`,
          width: `${gapWidth}%`,
          height: `${beamWidth}px`,
          opacity: beamOpacity,
          background:
            'linear-gradient(90deg, rgba(255,220,120,0.95) 0%, rgba(255,234,161,0.65) 50%, rgba(125,211,252,0.22) 100%)',
        }}
      />

      <div
        className="absolute bottom-20 h-24 w-12 rounded-t-lg rounded-b-sm border border-cyan-200/40 bg-slate-700 shadow-xl"
        style={{ left: `${photocellLeft}%` }}
      >
        <div
          className="absolute inset-x-1 top-1 h-12 rounded-md bg-cyan-300/80"
          style={{ boxShadow: `0 0 24px rgba(103, 232, 249, ${photocellGlow})` }}
        />
        <div className="absolute -bottom-7 left-1/2 h-7 w-[3px] -translate-x-1/2 bg-slate-400" />
      </div>
      <div className="absolute bottom-12 text-xs text-cyan-100" style={{ left: `${photocellLeft - 1}%` }}>
        Photocell
      </div>

      <div
        className="absolute bottom-28 border-t border-dashed border-cyan-200/60"
        style={{ left: `${lampLeft + 14}%`, width: `${gapWidth - 4}%` }}
      />
      <div
        className="absolute bottom-30 rounded bg-slate-900/70 px-2 py-1 text-[11px] text-cyan-100"
        style={{ left: `${lampLeft + gapWidth / 2}%`, transform: 'translateX(-50%)' }}
      >
        Distance: {distance} cm
      </div>

      <div className="absolute right-5 top-5 rounded-xl border border-emerald-300/30 bg-slate-900/70 p-3 shadow-lg backdrop-blur">
        <div className="mb-2 text-xs font-semibold text-emerald-200">Voltmeter / Response Meter</div>
        <div className="h-3 w-36 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#eab308,#f97316)]"
            style={{ width: `${clamp(intensity, 0, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-200">Light response: {intensity}%</div>
      </div>
    </div>
  );
};

const PhotocellSimulation = () => {
  const [illuminationDistance, setIlluminationDistance] = useState(20);
  const [illuminationVoltage, setIlluminationVoltage] = useState(0);
  const [illuminationCurrent, setIlluminationCurrent] = useState(0);
  const [illuminationIntensity, setIlluminationIntensity] = useState(0);
  const [illuminationTable, setIlluminationTable] = useState<IlluminationPoint[]>([]);
  const [selectedDistanceKey, setSelectedDistanceKey] = useState<VIDistanceKey>('minimum');
  const [liveLoadResistance, setLiveLoadResistance] = useState(100);
  const [visualizationMode, setVisualizationMode] = useState<'illumination' | 'vi'>('illumination');

  const [viSeries, setVISeries] = useState<Record<VIDistanceKey, VIDistanceSeries>>({
    minimum: createEmptyVISeries(DISTANCE_OPTIONS.minimum.distance),
    medium: createEmptyVISeries(DISTANCE_OPTIONS.medium.distance),
    maximum: createEmptyVISeries(DISTANCE_OPTIONS.maximum.distance),
  });

  useEffect(() => {
    const measurement = calculateIlluminationMeasurement(illuminationDistance);
    setIlluminationIntensity(measurement.intensity);
    setIlluminationVoltage(measurement.voltage);
    setIlluminationCurrent(measurement.current);
  }, [illuminationDistance]);

  const addIlluminationReading = () => {
    const measurement = calculateIlluminationMeasurement(illuminationDistance);

    setIlluminationTable(prev => {
      const nextPoint: IlluminationPoint = {
        id: Date.now(),
        ...measurement,
      };

      return [...prev, nextPoint].sort((a, b) => a.distance - b.distance);
    });
  };

  const regenerateVICurves = () => {
    setVISeries({
      minimum: createEmptyVISeries(DISTANCE_OPTIONS.minimum.distance),
      medium: createEmptyVISeries(DISTANCE_OPTIONS.medium.distance),
      maximum: createEmptyVISeries(DISTANCE_OPTIONS.maximum.distance),
    });
  };

  const resetExperiment = () => {
    setIlluminationDistance(20);
    setIlluminationTable([]);
    regenerateVICurves();
  };

  const addVIDataPoint = () => {
    setVISeries(prev => {
      const activeSeries = prev[selectedDistanceKey];
      const nextReading: VIReading = {
        loadResistance: liveLoadResistance,
        voltage: liveVoltage,
        current: liveCurrent,
      };

      const existingIndex = activeSeries.readings.findIndex(
        reading => Math.abs(reading.loadResistance - liveLoadResistance) < 1
      );

      const updatedReadings =
        existingIndex >= 0
          ? activeSeries.readings.map((reading, index) =>
              index === existingIndex ? nextReading : reading
            )
          : [...activeSeries.readings, nextReading];

      return {
        ...prev,
        [selectedDistanceKey]: {
          ...activeSeries,
          intensity: activeIntensity,
          stoppingVoltage: activeStoppingVoltage,
          readings: updatedReadings.sort((a, b) => a.voltage - b.voltage),
        },
      };
    });
  };

  const exportData = () => {
    const illuminationRows = [
      ['Illumination Characteristics'],
      ['Distance (cm)', 'Relative Intensity (%)', 'Voltage (V)', 'Current (uA)'],
      ...illuminationTable.map(point => [
        point.distance,
        point.intensity,
        point.voltage,
        point.current,
      ]),
      [],
      ['V-I Characteristics'],
      ['Distance Label', 'Distance (cm)', 'Load Resistance (kOhm)', 'Voltage (V)', 'Current (uA)'],
    ];

    const viRows = (Object.keys(viSeries) as VIDistanceKey[]).flatMap(key =>
      viSeries[key].readings.map(reading => [
        viSeries[key].label,
        viSeries[key].distance,
        reading.loadResistance,
        reading.voltage,
        reading.current,
      ])
    );

    const csvData = [...illuminationRows, ...viRows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'photocell_experiment_data.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const graphData = useMemo(() => {
    const allVoltages = Array.from(
      new Set(
        (Object.keys(viSeries) as VIDistanceKey[]).flatMap(key =>
          viSeries[key].readings.map(reading => reading.voltage)
        )
      )
    ).sort((a, b) => a - b);

    return allVoltages.map(voltage => {
      const point: Record<string, number | string> = { voltage };

      (Object.keys(viSeries) as VIDistanceKey[]).forEach(key => {
        const reading = viSeries[key].readings.find(item => item.voltage === voltage);
        point[key] = reading?.current ?? 0;
      });

      return point;
    });
  }, [viSeries]);

  const activeDistance = DISTANCE_OPTIONS[selectedDistanceKey];
  const activeIntensity = calculateRelativeIntensity(activeDistance.distance);
  const activeStoppingVoltage = round(3.4 + 2.2 * (activeIntensity / 100), 2);
  const liveVoltage = round((liveLoadResistance / 330) * 8, 2);
  const liveCurrent = calculateVICurrent(liveVoltage, activeIntensity, activeStoppingVoltage);
  const visualDistance =
    visualizationMode === 'vi' ? activeDistance.distance : illuminationDistance;
  const visualIntensity =
    visualizationMode === 'vi' ? activeIntensity : illuminationIntensity;
  const visualVoltage = visualizationMode === 'vi' ? liveVoltage : illuminationVoltage;
  const visualCurrent = visualizationMode === 'vi' ? liveCurrent : illuminationCurrent;

  const liveGraphData = useMemo(() => {
    const series = viSeries[selectedDistanceKey];
    const currentPoint = {
      voltage: liveVoltage,
      current: liveCurrent,
    };

    const hasSameVoltage = series.readings.some(
      point => Math.abs(point.loadResistance - liveLoadResistance) < 1
    );
    const merged = hasSameVoltage ? series.readings : [...series.readings, currentPoint];
    return merged.sort((a, b) => a.voltage - b.voltage);
  }, [liveCurrent, liveVoltage, selectedDistanceKey, viSeries]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <div className="control-panel">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Illumination Characteristics</h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lamp to Photocell Distance (cm)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={10}
                  max={50}
                  step={1}
                  value={[illuminationDistance]}
                  onValueChange={values => setIlluminationDistance(values[0])}
                />
                <span className="min-w-[54px] text-right text-sm">{illuminationDistance}</span>
              </div>
              <p className="text-xs text-gray-500">
                Load resistance is kept minimum for this observation.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-md bg-gray-50 p-3 text-center">
              <div>
                <div className="text-xs text-gray-500">Relative Intensity</div>
                <div className="text-lg font-semibold text-lab-blue">{illuminationIntensity}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Measured Voltage</div>
                <div className="text-lg font-semibold text-lab-teal">{illuminationVoltage} V</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Measured Current</div>
                <div className="text-lg font-semibold text-lab-teal">{illuminationCurrent} uA</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addIlluminationReading} className="flex-1">
                Add Illumination Reading
              </Button>
              <Button onClick={resetExperiment} variant="outline" className="flex-1">
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="data-panel">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">
            Illumination Characteristics Table
          </h3>

          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-3 py-2">Distance (cm)</th>
                  <th className="px-3 py-2">Relative Intensity (%)</th>
                  <th className="px-3 py-2">Voltage (V)</th>
                  <th className="px-3 py-2">Current (uA)</th>
                </tr>
              </thead>
              <tbody>
                {illuminationTable.length > 0 ? (
                  illuminationTable.map(row => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2">{row.distance}</td>
                      <td className="px-3 py-2">{row.intensity}</td>
                      <td className="px-3 py-2">{row.voltage}</td>
                      <td className="px-3 py-2">{row.current}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                      Add readings at different distances to populate the illumination table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="data-panel">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-lab-blue">Photocell 3D Visualization</h3>
              <p className="text-sm text-gray-500">
                Switch between illumination distance and V-I selected distance for the live view.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={visualizationMode === 'illumination' ? 'default' : 'outline'}
                onClick={() => setVisualizationMode('illumination')}
              >
                Illumination View
              </Button>
              <Button
                type="button"
                variant={visualizationMode === 'vi' ? 'default' : 'outline'}
                onClick={() => setVisualizationMode('vi')}
              >
                V-I View
              </Button>
            </div>
          </div>

          <div className="h-80 rounded-md border bg-gray-100">
            <LampPhotocellVisualization
              distance={visualDistance}
              intensity={visualIntensity}
              voltage={visualVoltage}
              current={visualCurrent}
            />
          </div>
        </div>

        <div className="data-panel">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-lab-blue">V-I Characteristics</h3>
              <p className="text-sm text-gray-500">
                Source distance is fixed at minimum, medium, and maximum to vary light intensity.
              </p>
            </div>
            <Button onClick={regenerateVICurves} variant="outline">
              Regenerate Readings
            </Button>
          </div>

          <div className="mb-5 grid gap-4 rounded-md bg-gray-50 p-4 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium">Distance Level for Live I-V Graph</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DISTANCE_OPTIONS) as VIDistanceKey[]).map(key => (
                  <Button
                    key={key}
                    type="button"
                    variant={selectedDistanceKey === key ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedDistanceKey(key);
                      setVisualizationMode('vi');
                    }}
                  >
                    {DISTANCE_OPTIONS[key].label}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Fixed distance: {activeDistance.distance} cm | Relative intensity: {activeIntensity}%
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Load Resistance (kOhm)</label>
              <div className="flex items-center gap-3">
                <Slider
                  min={10}
                  max={330}
                  step={1}
                  value={[liveLoadResistance]}
                  onValueChange={values => setLiveLoadResistance(values[0])}
                />
                <span className="min-w-[62px] text-right text-sm">{liveLoadResistance}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-white p-2">Voltage: {liveVoltage} V</div>
                <div className="rounded-md bg-white p-2">Current: {liveCurrent} uA</div>
              </div>
              <Button onClick={addVIDataPoint}>Add V-I Data Point</Button>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveGraphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="voltage"
                  label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Current (uA)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={value =>
                    typeof value === 'number' ? `${value.toFixed(2)} uA` : `${value} uA`
                  }
                  labelFormatter={label => `Voltage: ${label} V`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="current"
                  name={`${activeDistance.label} Live Curve`}
                  stroke={
                    selectedDistanceKey === 'minimum'
                      ? '#0f766e'
                      : selectedDistanceKey === 'medium'
                        ? '#2563eb'
                        : '#dc2626'
                  }
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 rounded-md border-l-4 border-lab-blue bg-blue-50 p-3 text-sm text-gray-700">
            The live I-V graph follows the current load slider, and `Add V-I Data Point` stores the
            measured voltage and current into the selected distance table.
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {(Object.keys(viSeries) as VIDistanceKey[]).map(key => {
              const series = viSeries[key];

              return (
                <div key={key} className="rounded-md border bg-gray-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-lab-blue">{series.label}</h4>
                  <div className="mb-2 text-xs text-gray-500">
                    Distance: {series.distance} cm | Relative Intensity: {series.intensity}% |
                    Knee Voltage: {series.stoppingVoltage} V
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left">
                          <th className="py-1 pr-2">Load (kOhm)</th>
                          <th className="py-1 pr-2">V</th>
                          <th className="py-1">I (uA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {series.readings.length > 0 ? (
                          series.readings.map(reading => (
                            <tr key={`${key}-${reading.loadResistance}`} className="border-t">
                              <td className="py-1 pr-2">{reading.loadResistance}</td>
                              <td className="py-1 pr-2">{reading.voltage}</td>
                              <td className="py-1">{reading.current}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-3 text-center text-gray-500">
                              Add V-I data points for this distance.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Button onClick={exportData}>Export All Data</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotocellSimulation;
