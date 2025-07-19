/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const BandGapSimulation = () => {
  // Simulation state
  const [material, setMaterial] = useState('silicon');
  const [temperature, setTemperature] = useState(300); // K
  const [resistance, setResistance] = useState(0); // Ohms
  const [dataPoints, setDataPoints] = useState<
    {
      temperature: number;
      resistance: number;
      invTemperature: number;
      lnResistance: number;
    }[]
  >([]);
  const [bandGap, setBandGap] = useState(0); // eV
  const [fitLinePoints, setFitLinePoints] = useState<{ invTemp: number; lnR: number }[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Material properties
  const materials = React.useMemo(
    () => ({
      silicon: {
        name: 'Silicon',
        bandGap: 1.12, // eV
        r0: 0.01, // Ohm
        temperatureRange: [100, 500],
      },
      germanium: {
        name: 'Germanium',
        bandGap: 0.67, // eV
        r0: 0.005, // Ohm
        temperatureRange: [100, 400],
      },
      gallium_arsenide: {
        name: 'Gallium Arsenide',
        bandGap: 1.42, // eV
        r0: 0.02, // Ohm
        temperatureRange: [100, 600],
      },
    }),
    []
  );

  // Boltzmann constant in eV/K
  const kB = 8.617333262e-5; // eV/K

  // Update resistance when temperature or material changes
  useEffect(() => {
    const materialInfo = materials[material as keyof typeof materials];
    const actualBandGap = materialInfo.bandGap;
    const r0 = materialInfo.r0;

    // Calculate resistance using the equation: R = R0 * exp(Eg/2kT)
    const calculatedResistance = r0 * Math.exp(actualBandGap / (2 * kB * temperature));
    setResistance(parseFloat(calculatedResistance.toFixed(2)));
  }, [material, materials, temperature]);

  // Function to calculate band gap from slope
  const calculateBandGap = (points: any[]) => {
    if (points.length < 2) return 0;

    // Calculate slope using linear regression
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    const n = points.length;

    points.forEach(point => {
      sumX += point.invTemperature;
      sumY += point.lnResistance;
      sumXY += point.invTemperature * point.lnResistance;
      sumXX += point.invTemperature * point.invTemperature;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Band gap = 2 * k * slope
    const calculatedBandGap = 2 * kB * slope;
    return parseFloat(calculatedBandGap.toFixed(3));
  };

  // Generate fit line points
  useEffect(() => {
    if (dataPoints.length >= 2) {
      // Calculate band gap
      const calculatedBandGap = calculateBandGap(dataPoints);
      setBandGap(calculatedBandGap);

      // Generate points for the fit line
      const xValues = dataPoints.map(p => p.invTemperature);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);

      // Linear regression for fit line
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumXX = 0;
      const n = dataPoints.length;

      dataPoints.forEach(point => {
        sumX += point.invTemperature;
        sumY += point.lnResistance;
        sumXY += point.invTemperature * point.lnResistance;
        sumXX += point.invTemperature * point.invTemperature;
      });

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Generate 10 points for the fit line
      const fitLine = [];
      for (let i = 0; i <= 10; i++) {
        const invTemp = minX + (i / 10) * (maxX - minX);
        const lnR = slope * invTemp + intercept;
        fitLine.push({ invTemp, lnR });
      }

      setFitLinePoints(fitLine);
    }
  }, [dataPoints]);

  const recordDataPoint = React.useCallback(() => {
    const invTemperature = 1 / temperature;
    const lnResistance = Math.log(resistance);

    const newDataPoint = {
      temperature,
      resistance,
      invTemperature,
      lnResistance,
    };

    setDataPoints(prevPoints => {
      // Check if this temperature already exists in the data
      const existingIndex = prevPoints.findIndex(p => Math.abs(p.temperature - temperature) < 1);

      if (existingIndex >= 0) {
        // Update existing point
        const newPoints = [...prevPoints];
        newPoints[existingIndex] = newDataPoint;
        return newPoints;
      } else {
        // Add new point and sort by temperature
        return [...prevPoints, newDataPoint].sort((a, b) => a.temperature - b.temperature);
      }
    });
  }, [temperature, resistance]);

  const resetExperiment = () => {
    setMaterial('silicon');
    setTemperature(300);
    setDataPoints([]);
    setBandGap(0);
    setFitLinePoints([]);
    setIsRecording(false);
  };

  const exportData = () => {
    const csvData = [
      ['Temperature (K)', 'Resistance (Ohm)', '1/T (K^-1)', 'ln(R)'],
      ...dataPoints.map(point => [
        point.temperature,
        point.resistance,
        point.invTemperature.toExponential(4),
        point.lnResistance.toFixed(4),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'band_gap_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-record data when in recording mode
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      recordDataPoint();

      // Increment temperature for next recording
      const materialInfo = materials[material as keyof typeof materials];
      const [min, max] = materialInfo.temperatureRange;

      setTemperature(prevTemp => {
        const newTemp = prevTemp + 20;
        if (newTemp > max) {
          setIsRecording(false);
          return prevTemp;
        }
        return newTemp;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, material, temperature, materials, recordDataPoint]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Control Panel */}
      <div className="md:col-span-1 control-panel">
        <h3 className="text-lg font-semibold mb-4 text-lab-blue">Control Panel</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Material Selection</label>
            <Select value={material} onValueChange={setMaterial} disabled={isRecording}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silicon">Silicon</SelectItem>
                <SelectItem value="germanium">Germanium</SelectItem>
                <SelectItem value="gallium_arsenide">Gallium Arsenide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature (K)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={materials[material as keyof typeof materials].temperatureRange[0]}
                max={materials[material as keyof typeof materials].temperatureRange[1]}
                step={5}
                value={[temperature]}
                onValueChange={values => setTemperature(values[0])}
                disabled={isRecording}
              />
              <span className="min-w-[40px] text-right">{temperature}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Measured Resistance (Ω)</label>
            <Input value={resistance.toFixed(2)} readOnly className="bg-gray-50" />
          </div>

          <div className="flex gap-2">
            <Button onClick={recordDataPoint} disabled={isRecording} className="flex-1">
              Record Point
            </Button>
            <Button
              onClick={() => setIsRecording(!isRecording)}
              variant={isRecording ? 'destructive' : 'default'}
              className="flex-1"
            >
              {isRecording ? 'Stop' : 'Auto Record'}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={resetExperiment} variant="outline" disabled={isRecording}>
              Reset Experiment
            </Button>
            <Button onClick={exportData} disabled={dataPoints.length === 0 || isRecording}>
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="md:col-span-2 space-y-6">
        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Measurement Data</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Measured Data Points</div>
              <div className="text-2xl font-bold text-lab-teal">{dataPoints.length}</div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Calculated Band Gap</div>
              <div className="text-2xl font-bold text-lab-teal">
                {bandGap > 0 ? `${bandGap} eV` : 'N/A'}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Reference Band Gap</div>
              <div className="text-2xl font-bold text-lab-amber">
                {materials[material as keyof typeof materials].bandGap} eV
              </div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Error</div>
              <div
                className="text-2xl font-bold"
                style={{
                  color:
                    bandGap > 0
                      ? Math.abs(
                          (bandGap / materials[material as keyof typeof materials].bandGap - 1) *
                            100
                        ) < 10
                        ? '#00796b'
                        : '#e65100'
                      : '#9e9e9e',
                }}
              >
                {bandGap > 0
                  ? `${Math.abs((bandGap / materials[material as keyof typeof materials].bandGap - 1) * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="mt-6 border p-4 rounded-md bg-gray-50">
            <h4 className="text-md font-medium mb-2">Measurement Setup</h4>
            <div className="relative h-40 bg-blue-50 border rounded-md flex items-center justify-center">
              {/* Post office box visualization */}
              <div className="relative w-2/3 h-24 bg-gray-300 rounded flex items-center justify-center overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-red-500/20"
                  style={{
                    opacity:
                      (temperature -
                        materials[material as keyof typeof materials].temperatureRange[0]) /
                      (materials[material as keyof typeof materials].temperatureRange[1] -
                        materials[material as keyof typeof materials].temperatureRange[0]),
                  }}
                />

                <div className="relative z-10 text-center">
                  <div className="text-xs mb-1">Post Office Box</div>
                  <div className="font-bold text-sm">
                    {material === 'silicon' ? 'Si' : material === 'germanium' ? 'Ge' : 'GaAs'}
                  </div>
                  <div className="text-xs mt-1">{temperature} K</div>
                </div>

                {/* Temperature indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-red-500" />
              </div>

              {/* Resistance meter */}
              <div className="absolute top-2 right-2 bg-white rounded border px-2 py-1 text-sm">
                <div className="text-xs text-gray-500">Resistance</div>
                <div className="font-mono">{resistance.toFixed(2)} Ω</div>
              </div>

              {isRecording && (
                <div className="absolute top-2 left-2 flex items-center bg-red-100 rounded px-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />
                  <span className="text-xs text-red-800">Recording</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Results</h3>

          <div className="h-64">
            {dataPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="invTemperature"
                    name="1/T"
                    label={{ value: '1/T (K⁻¹)', position: 'insideBottom', offset: -5 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    type="number"
                    dataKey="lnResistance"
                    name="ln(R)"
                    label={{ value: 'ln(R)', angle: -90, position: 'insideLeft' }}
                  />
                  <ZAxis range={[60, 60]} />
                  <Tooltip
                    formatter={(value: any) => value.toFixed(4)}
                    labelFormatter={(value: any) => `1/T: ${value.toExponential(4)} K⁻¹`}
                  />
                  <Legend />
                  <Scatter name="Measured Data" data={dataPoints} fill="#00796b" />
                  {fitLinePoints.length > 0 && (
                    <Line
                      name="Fit Line"
                      data={fitLinePoints}
                      type="monotone"
                      dataKey="lnR"
                      xAxisId={0}
                      stroke="#ffc107"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Record data points at different temperatures to plot ln(R) vs 1/T
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Experimental Progress</div>
            <Progress value={Math.min(100, dataPoints.length * 10)} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandGapSimulation;
