import React, { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import DiodeIVScene from './diode/DiodeIVScene';

const DiodeIVSimulation = () => {
  // State variables for diode parameters
  const [diodeType, setDiodeType] = useState('silicon');
  const [voltage, setVoltage] = useState(0.5); // V
  const [temperature, setTemperature] = useState(300); // K
  const [idealityFactor, setIdealityFactor] = useState(1.5);
  type ChartDataPoint = {
    voltage: number;
    current: number;
    currentLog: number;
    resistance: number | null;
  };

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Base saturation current for different diode types
  const baseSaturationCurrents = React.useMemo(() => ({
    silicon: 1e-12, // A
    germanium: 1e-6, // A
    schottky: 1e-8, // A
    led: 1e-10, // A
  }), []);

  // Get saturation current based on diode type and temperature
  const getSaturationCurrent = useCallback(() => {
    const baseCurrent = baseSaturationCurrents[diodeType as keyof typeof baseSaturationCurrents];
    const baseTemp = 300; // K

    // Is increases with temperature
    // Is = Is0 * (T/T0)³ * exp[-(Eg/k) * (1/T - 1/T0)]
    // Using a simplified model: Is ≈ Is0 * (T/T0)³
    return baseCurrent * Math.pow(temperature / baseTemp, 3);
  }, [diodeType, temperature, baseSaturationCurrents]);

  // Calculate diode current using the Shockley equation
  const calculateCurrent = useCallback(
    (v: number) => {
      // Constants
      const q = 1.602e-19; // Elementary charge in coulombs
      const k = 1.38e-23; // Boltzmann constant in J/K

      // Thermal voltage
      const vt = (k * temperature) / q;

      // Saturation current
      const is = getSaturationCurrent();

      // Shockley diode equation: I = Is * (exp(V/nVt) - 1)
      return is * (Math.exp(v / (idealityFactor * vt * 1e5)) - 1);
    },
    [temperature, idealityFactor, getSaturationCurrent]
  );

  // Generate I-V curve data
  const generateIVCurve = () => {
    const data = [];
    // Generate points from -0.5V to 1V
    for (let v = -0.5; v <= 1.0; v += 0.025) {
      const current = calculateCurrent(v);
      data.push({
        voltage: parseFloat(v.toFixed(3)),
        current: parseFloat(current.toExponential(6)),
        currentLog: parseFloat(Math.abs(current).toExponential(6)),
        resistance: v !== 0 ? parseFloat((v / current).toExponential(6)) : null,
      });
    }

    setChartData(data);
  };

  // Calculate current at the selected voltage
  const current = calculateCurrent(voltage);

  // Calculate resistance at the selected voltage
  const resistance = voltage !== 0 ? voltage / current : Infinity;

  // Export data as CSV
  const exportData = () => {
    if (chartData.length === 0) {
      generateIVCurve();
      setTimeout(exportData, 100);
      return;
    }

    const csvContent = [
      ['Voltage (V)', 'Current (A)', 'Resistance (Ω)'],
      ...chartData.map(point => [
        point.voltage,
        point.current,
        point.resistance !== null ? point.resistance : 'Infinity',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diode_iv_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset experiment to default values
  const resetExperiment = () => {
    setDiodeType('silicon');
    setVoltage(0.5);
    setTemperature(300);
    setIdealityFactor(1.5);
    setChartData([]);
  };

  return (
    <div className="simulation-container p-6">
      <h3 className="text-lg font-semibold mb-4 text-lab-blue">
        Diode I-V Characteristics Simulation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4">Control Panel</h4>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Diode Type</label>
              <Select value={diodeType} onValueChange={setDiodeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select diode type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="silicon">Silicon Diode</SelectItem>
                  <SelectItem value="germanium">Germanium Diode</SelectItem>
                  <SelectItem value="schottky">Schottky Diode</SelectItem>
                  <SelectItem value="led">Light Emitting Diode</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Applied Voltage (V)</span>
                <span>{voltage.toFixed(2)} V</span>
              </label>
              <Slider
                min={-0.5}
                max={1}
                step={0.01}
                value={[voltage]}
                onValueChange={values => setVoltage(values[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Temperature (K)</span>
                <span>{temperature.toFixed(0)} K</span>
              </label>
              <Slider
                min={250}
                max={400}
                step={5}
                value={[temperature]}
                onValueChange={values => setTemperature(values[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Ideality Factor</span>
                <span>{idealityFactor.toFixed(1)}</span>
              </label>
              <Slider
                min={1}
                max={2}
                step={0.1}
                value={[idealityFactor]}
                onValueChange={values => setIdealityFactor(values[0])}
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
            <DiodeIVScene
              voltage={voltage}
              temperature={temperature}
              saturationCurrent={getSaturationCurrent()}
              idealityFactor={idealityFactor}
            />
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-4">Results</h4>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Voltage</div>
                <div className="text-xl font-bold text-blue-600">{voltage.toFixed(3)} V</div>
              </div>

              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Current</div>
                <div className="text-xl font-bold text-green-600">{current.toExponential(3)} A</div>
              </div>

              <div className="bg-purple-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Resistance</div>
                <div className="text-xl font-bold text-purple-600">
                  {resistance === Infinity ? '∞' : resistance.toExponential(2)} Ω
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
                      type="number"
                      scale="log"
                      domain={['auto', 'auto']}
                      label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Current') {
                          return `${value}A`;
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="currentLog"
                      name="Current"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
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

export default DiodeIVSimulation;
