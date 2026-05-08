import React, { Suspense, useEffect, useMemo, useState } from 'react';
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
import PhotocellScene from './photocell/PhotocellScene';

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

const loadResistanceOptions = [10, 22, 47, 68, 100, 150, 220, 330];

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

const generateVISeries = (distance: number): VIDistanceSeries => {
  const intensity = calculateRelativeIntensity(distance);
  const stoppingVoltage = round(3.4 + 2.2 * (intensity / 100), 2);

  const readings = loadResistanceOptions.map(loadResistance => {
    const voltage = round((loadResistance / 330) * 8, 2);
    const current = calculateVICurrent(voltage, intensity, stoppingVoltage);

    return {
      loadResistance,
      voltage,
      current,
    };
  });

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
    readings,
  };
};

const PhotocellSimulation = () => {
  const [illuminationDistance, setIlluminationDistance] = useState(20);
  const [illuminationVoltage, setIlluminationVoltage] = useState(0);
  const [illuminationCurrent, setIlluminationCurrent] = useState(0);
  const [illuminationIntensity, setIlluminationIntensity] = useState(0);
  const [illuminationTable, setIlluminationTable] = useState<IlluminationPoint[]>([]);

  const [viSeries, setVISeries] = useState<Record<VIDistanceKey, VIDistanceSeries>>({
    minimum: generateVISeries(DISTANCE_OPTIONS.minimum.distance),
    medium: generateVISeries(DISTANCE_OPTIONS.medium.distance),
    maximum: generateVISeries(DISTANCE_OPTIONS.maximum.distance),
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
      minimum: generateVISeries(DISTANCE_OPTIONS.minimum.distance),
      medium: generateVISeries(DISTANCE_OPTIONS.medium.distance),
      maximum: generateVISeries(DISTANCE_OPTIONS.maximum.distance),
    });
  };

  const resetExperiment = () => {
    setIlluminationDistance(20);
    setIlluminationTable([]);
    regenerateVICurves();
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
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Photocell 3D Visualization</h3>

          <div className="h-80 rounded-md border bg-gray-100">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">Loading 3D scene...</div>
              }
            >
              <PhotocellScene
                wavelength={550}
                intensity={illuminationIntensity}
                current={illuminationCurrent}
              />
            </Suspense>
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

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
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
                  dataKey="minimum"
                  name="Minimum Distance"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="medium"
                  name="Medium Distance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="maximum"
                  name="Maximum Distance"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
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
                        {series.readings.map(reading => (
                          <tr key={`${key}-${reading.loadResistance}`} className="border-t">
                            <td className="py-1 pr-2">{reading.loadResistance}</td>
                            <td className="py-1 pr-2">{reading.voltage}</td>
                            <td className="py-1">{reading.current}</td>
                          </tr>
                        ))}
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
