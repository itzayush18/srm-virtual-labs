import React, { useState, useCallback } from 'react';
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
import SolarCellScene from './solarcell/SolarCellScene';

interface ChartDataPoint {
  voltage: number;
  current: number;
  power: number;
}

const SolarCellSimulation = () => {
  // State variables for simulation parameters
  const [efficiency, setEfficiency] = useState(0.15); // 15%
  const [lightIntensity, setLightIntensity] = useState(0.8); // 80%
  const [temperature, setTemperature] = useState(25); // 25°C
  const [resistance, setResistance] = useState(10); // 10 ohms
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Calculate power, voltage and current based on parameters
  const calculatePowerOutput = useCallback(() => {
    const maxPower = 120; // Watts at ideal conditions
    const powerOutput =
      maxPower * efficiency * lightIntensity * (1 - Math.max(0, (temperature - 25) * 0.005));

    // Calculate voltage and current
    const voltage = Math.sqrt(powerOutput * resistance);
    const current = voltage / resistance;

    return { power: powerOutput, voltage, current };
  }, [efficiency, lightIntensity, temperature, resistance]);

  const { power, voltage, current } = calculatePowerOutput();

  // Generate I-V curve data
  const generateIVCurve = useCallback(() => {
    const { power } = calculatePowerOutput();
    const data = [];
    const maxVoltage = Math.sqrt(power * resistance) * 1.5;

    for (let v = 0; v <= maxVoltage; v += maxVoltage / 20) {
      const i = v <= voltage ? current : current * (1 - ((v - voltage) / voltage) * 0.5);

      // Only add valid points
      if (i >= 0) {
        data.push({
          voltage: parseFloat(v.toFixed(2)),
          current: parseFloat(i.toFixed(3)),
          power: parseFloat((v * i).toFixed(2)),
        });
      }
    }

    setChartData(data);
  }, [calculatePowerOutput, voltage, current, resistance]);

  // Export data as CSV
  const exportData = () => {
    if (chartData.length === 0) {
      generateIVCurve();
      setTimeout(exportData, 100);
      return;
    }

    const csvContent = [
      ['Voltage (V)', 'Current (A)', 'Power (W)'],
      ...chartData.map(point => [point.voltage, point.current, point.power]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solar_cell_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset experiment to default values
  const resetExperiment = () => {
    setEfficiency(0.15);
    setLightIntensity(0.8);
    setTemperature(25);
    setResistance(10);
    setChartData([]);
  };

  return (
    <div className="simulation-container p-6">
      <h3 className="text-lg font-semibold mb-4 text-lab-blue">
        Solar Cell Characteristics Simulation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4">Control Panel</h4>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Solar Cell Efficiency (%)</span>
                <span>{(efficiency * 100).toFixed(1)}%</span>
              </label>
              <Slider
                min={0.05}
                max={0.3}
                step={0.01}
                value={[efficiency]}
                onValueChange={values => setEfficiency(values[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Light Intensity</span>
                <span>{(lightIntensity * 100).toFixed(0)}%</span>
              </label>
              <Slider
                min={0.1}
                max={1}
                step={0.05}
                value={[lightIntensity]}
                onValueChange={values => setLightIntensity(values[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Temperature (°C)</span>
                <span>{temperature.toFixed(1)}°C</span>
              </label>
              <Slider
                min={15}
                max={60}
                step={1}
                value={[temperature]}
                onValueChange={values => setTemperature(values[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Load Resistance (Ω)</span>
                <span>{resistance.toFixed(1)}Ω</span>
              </label>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[resistance]}
                onValueChange={values => setResistance(values[0])}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button onClick={generateIVCurve} className="w-full" variant="default">
                Generate I-V Curve
              </Button>

              <Button onClick={exportData} className="w-full" variant="outline">
                Export Data
              </Button>
            </div>

            <Button onClick={resetExperiment} className="w-full" variant="secondary">
              Reset Experiment
            </Button>
          </div>
        </div>

        {/* Visualization */}
        <div className="md:col-span-2 space-y-6">
          {/* 3D Visualization */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 h-96">
            <SolarCellScene
              efficiency={efficiency}
              lightIntensity={lightIntensity}
              temperature={temperature}
              resistance={resistance}
            />
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-4">Results</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Voltage</div>
                <div className="text-xl font-bold text-blue-600">{voltage.toFixed(2)} V</div>
              </div>

              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Current</div>
                <div className="text-xl font-bold text-green-600">{current.toFixed(3)} A</div>
              </div>

              <div className="bg-purple-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Power Output</div>
                <div className="text-xl font-bold text-purple-600">{power.toFixed(2)} W</div>
              </div>

              <div className="bg-amber-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Efficiency</div>
                <div className="text-xl font-bold text-amber-600">
                  {(efficiency * 100).toFixed(1)}%
                </div>
              </div>
            </div>

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
                      yAxisId="left"
                      label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Power (W)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip formatter={value => parseFloat(value.toString()).toFixed(3)} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="current"
                      name="Current"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 1 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="power"
                      name="Power"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Click "Generate I-V Curve" to view chart data
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarCellSimulation;
