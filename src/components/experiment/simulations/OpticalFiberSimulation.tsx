import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
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
} from 'recharts';
import OpticalFiberScene from './opticalfiber/OpticalFiberScene';

interface ChartDataPoint {
  wavelength: number;
  inputPower: number;
  outputPower: number;
  attenuation: number;
  length: number;
}

const OpticalFiberSimulation = () => {
  const [wavelength, setWavelength] = useState(650);
  const [fiberLength, setFiberLength] = useState(1);
  const [inputPower, setInputPower] = useState(5);
  const [attenuation, setAttenuation] = useState(0.3);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Calculate output power based on fiber length and attenuation coefficient
  const calculateOutputPower = (length: number, inputPower: number, attenuation: number) => {
    // P_out = P_in * 10^(-α * L / 10), where α is in dB/km and L is in km
    return inputPower * Math.pow(10, (-attenuation * length) / 10);
  };

  // Calculate wavelength-dependent attenuation (simplified model)
  const calculateAttenuationCoefficient = (wavelength: number) => {
    // Simplified model: minimum attenuation around 1550 nm
    const rayleighScattering = 0.12 * Math.pow(1550 / wavelength, 4);
    const infraredAbsorption = 0.1 * Math.exp((-(1620 - wavelength) * (1620 - wavelength)) / 10000);
    const ohAbsorption = 0.2 * Math.exp((-(wavelength - 1380) * (wavelength - 1380)) / 5000);

    return rayleighScattering + infraredAbsorption + ohAbsorption;
  };

  // Add data point to chart
  const addDataPoint = () => {
    const outputPower = calculateOutputPower(fiberLength, inputPower, attenuation);
    const newPoint = {
      wavelength,
      inputPower,
      outputPower: parseFloat(outputPower.toFixed(3)),
      attenuation: parseFloat(attenuation.toFixed(2)),
      length: fiberLength,
    };

    setChartData(prevData => {
      const existingIndex = prevData.findIndex(
        p => Math.abs(p.wavelength - wavelength) < 5 && Math.abs(p.length - fiberLength) < 0.1
      );

      if (existingIndex >= 0) {
        const newData = [...prevData];
        newData[existingIndex] = newPoint;
        return newData;
      } else {
        return [...prevData, newPoint].sort((a, b) => a.wavelength - b.wavelength);
      }
    });
  };

  // Generate attenuation curve as function of wavelength
  const generateAttenuationCurve = () => {
    const newData = [];
    for (let wl = 800; wl <= 1600; wl += 50) {
      const att = calculateAttenuationCoefficient(wl);
      const outputPower = calculateOutputPower(fiberLength, inputPower, att);

      newData.push({
        wavelength: wl,
        attenuation: parseFloat(att.toFixed(2)),
        outputPower: parseFloat(outputPower.toFixed(3)),
        inputPower,
        length: fiberLength,
      });
    }
    setChartData(newData);
  };

  // Export data as CSV
  const exportData = () => {
    const csvData = [
      [
        'Wavelength (nm)',
        'Input Power (mW)',
        'Output Power (mW)',
        'Attenuation (dB/km)',
        'Fiber Length (km)',
      ],
      ...chartData.map(point => [
        point.wavelength,
        point.inputPower,
        point.outputPower,
        point.attenuation,
        point.length,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optical_fiber_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate current output power
  const outputPower = calculateOutputPower(fiberLength, inputPower, attenuation);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <div className="control-panel">
        <h3 className="text-lg font-semibold mb-4 text-lab-blue">Optical Fiber Control Panel</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Wavelength (nm)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={400}
                max={1600}
                step={10}
                value={[wavelength]}
                onValueChange={values => setWavelength(values[0])}
              />
              <span className="min-w-[50px] text-right">{wavelength}</span>
            </div>
            <div
              className="h-2 w-full rounded-full"
              style={{
                background: `linear-gradient(to right, violet, blue, cyan, green, yellow, orange, red, rgba(0,0,0,0.2), rgba(0,0,0,0.2))`,
              }}
            ></div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fiber Length (km)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={0.1}
                max={10}
                step={0.1}
                value={[fiberLength]}
                onValueChange={values => setFiberLength(values[0])}
              />
              <span className="min-w-[50px] text-right">{fiberLength.toFixed(1)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Input Power (mW)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={1}
                max={20}
                step={0.5}
                value={[inputPower]}
                onValueChange={values => setInputPower(values[0])}
              />
              <span className="min-w-[50px] text-right">{inputPower.toFixed(1)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Attenuation Coefficient (dB/km)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={0.1}
                max={2}
                step={0.05}
                value={[attenuation]}
                onValueChange={values => setAttenuation(values[0])}
              />
              <span className="min-w-[50px] text-right">{attenuation.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-3 rounded-md">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Output Power</div>
              <div className="text-2xl font-bold text-lab-teal">{outputPower.toFixed(3)} mW</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addDataPoint} className="flex-1">
              Add Data Point
            </Button>
            <Button onClick={generateAttenuationCurve} variant="outline" className="flex-1">
              Generate Curve
            </Button>
          </div>

          <Button onClick={exportData} disabled={chartData.length === 0}>
            Export Data
          </Button>
        </div>
      </div>

      {/* Visualization and Results */}
      <div className="space-y-6">
        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Optical Fiber Visualization</h3>

          <div className="h-80 bg-gray-100 border rounded-md overflow-hidden">
            <OpticalFiberScene wavelength={wavelength} attenuation={attenuation} />
          </div>
        </div>

        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Attenuation vs Wavelength</h3>

          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="wavelength"
                    label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{ value: 'Output Power (mW)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Attenuation (dB/km)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="outputPower"
                    name="Output Power"
                    stroke="#00796b"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="attenuation"
                    name="Attenuation"
                    stroke="#ef6c00"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Add data points or generate curve to see characteristics
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalFiberSimulation;
