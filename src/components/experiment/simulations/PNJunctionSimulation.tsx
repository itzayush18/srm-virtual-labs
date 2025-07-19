/* eslint-disable @typescript-eslint/no-explicit-any */
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
import PNJunctionScene from './pnjunction/PNJunctionScene';

const PNJunctionSimulation = () => {
  const [voltage, setVoltage] = useState(0);
  const [temperature, setTemperature] = useState(300);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate current based on diode equation
  const calculateCurrent = (v: number, t: number) => {
    const kB = 1.380649e-23; // Boltzmann constant
    const q = 1.60217663e-19; // Elementary charge
    const n = 1.5; // Ideality factor
    const Is = 1e-12 * Math.pow(t / 300, 3) * Math.exp((-1.1 * q) / (n * kB * t)); // Saturation current

    // Diode equation: I = Is * (exp(qV/nkT) - 1)
    const vT = (kB * t) / q; // Thermal voltage
    return Is * (Math.exp(v / (n * vT)) - 1);
  };

  // Add data point to chart
  const addDataPoint = () => {
    const current = calculateCurrent(voltage, temperature);
    const newPoint = { voltage, current: current.toExponential(4), temperature };

    setChartData(prevData => {
      const existingIndex = prevData.findIndex(
        p => Math.abs(p.voltage - voltage) < 0.05 && Math.abs(p.temperature - temperature) < 5
      );

      if (existingIndex >= 0) {
        const newData = [...prevData];
        newData[existingIndex] = newPoint;
        return newData;
      } else {
        return [...prevData, newPoint].sort((a, b) => a.voltage - b.voltage);
      }
    });
  };

  // Generate I-V curve
  const generateIVCurve = () => {
    const newData = [];
    for (let v = -0.6; v <= 0.8; v += 0.1) {
      newData.push({
        voltage: parseFloat(v.toFixed(1)),
        current: calculateCurrent(v, temperature).toExponential(4),
        temperature,
      });
    }
    setChartData(newData);
  };

  // Export data as CSV
  const exportData = () => {
    const csvData = [
      ['Voltage (V)', 'Current (A)', 'Temperature (K)'],
      ...chartData.map(point => [point.voltage, point.current, point.temperature]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pn_junction_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <div className="control-panel">
        <h3 className="text-lg font-semibold mb-4 text-lab-blue">PN Junction Control Panel</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Applied Voltage (V)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={-0.6}
                max={0.8}
                step={0.01}
                value={[voltage]}
                onValueChange={values => setVoltage(values[0])}
              />
              <span className="min-w-[50px] text-right">{voltage.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature (K)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={250}
                max={500}
                step={5}
                value={[temperature]}
                onValueChange={values => setTemperature(values[0])}
              />
              <span className="min-w-[50px] text-right">{temperature}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-3 rounded-md">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Calculated Current</div>
              <div className="text-2xl font-bold text-lab-teal">
                {calculateCurrent(voltage, temperature).toExponential(4)} A
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addDataPoint} className="flex-1">
              Add Data Point
            </Button>
            <Button onClick={generateIVCurve} variant="outline" className="flex-1">
              Generate I-V Curve
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
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">PN Junction Visualization</h3>

          <div className="h-80 bg-gray-100 border rounded-md">
            <PNJunctionScene voltage={voltage} temperature={temperature} />
          </div>
        </div>

        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">I-V Characteristics</h3>

          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="voltage"
                    label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                    scale="log"
                  />
                  <Tooltip
                    formatter={value => [`${value} A`, 'Current']}
                    labelFormatter={label => `Voltage: ${label} V`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name={`Current at ${temperature}K`}
                    stroke="#00796b"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Add data points or generate I-V curve to see characteristics
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PNJunctionSimulation;
