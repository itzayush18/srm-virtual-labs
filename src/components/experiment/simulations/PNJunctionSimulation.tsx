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

const PNJunctionSimulation = () => {
  const [voltage, setVoltage] = useState(0);
  const [temperature, setTemperature] = useState(300);
  const [chartData, setChartData] = useState([]);

  // Calculate current based on diode equation
  const calculateCurrent = (v, t) => {
    const kB = 1.380649e-23; // Boltzmann constant
    const q = 1.60217663e-19; // Elementary charge
    const n = 1.5; // Ideality factor
    const Is = 1e-12 * Math.pow(t / 300, 3) * Math.exp((-1.1 * q) / (n * kB * t)); // Saturation current

    // Diode equation: I = Is * (exp(qV/nkT) - 1)
    const vT = (kB * t) / q; // Thermal voltage
    const exponent = v / (n * vT);
    
    // Prevent overflow for large forward voltages
    if (exponent > 50) {
      return Is * Math.exp(50);
    }
    
    return Is * (Math.exp(exponent) - 1);
  };

  // Format current for display
  const formatCurrent = (current) => {
    if (Math.abs(current) < 1e-10) {
      return current.toExponential(2);
    } else if (Math.abs(current) < 1e-3) {
      return current.toExponential(4);
    } else {
      return current.toFixed(6);
    }
  };

  // Add data point to chart
  const addDataPoint = () => {
    const current = calculateCurrent(voltage, temperature);
    const newPoint = { 
      voltage: parseFloat(voltage.toFixed(3)), 
      current: current, // Store as NUMBER, not string
      currentDisplay: formatCurrent(current),
      temperature 
    };

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
    for (let v = -0.6; v <= 0.8; v += 0.05) {
      const current = calculateCurrent(v, temperature);
      newData.push({
        voltage: parseFloat(v.toFixed(2)),
        current: current, // Store as NUMBER
        currentDisplay: formatCurrent(current),
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

  const currentValue = calculateCurrent(voltage, temperature);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">PN Junction Diode Simulator</h1>
        <p className="text-gray-600 mb-6">Interactive semiconductor device characteristics analyzer</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-blue-700 flex items-center gap-2">
              <span>⚡</span> Control Panel
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Applied Voltage (V)</label>
                <div className="flex items-center space-x-3">
                  <Slider
                    min={-0.6}
                    max={0.8}
                    step={0.01}
                    value={[voltage]}
                    onValueChange={values => setVoltage(values[0])}
                    className="flex-1"
                  />
                  <span className="min-w-[60px] text-right font-mono bg-gray-100 px-3 py-1 rounded">
                    {voltage.toFixed(2)} V
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {voltage < 0 ? '← Reverse Bias' : voltage === 0 ? 'Zero Bias' : 'Forward Bias →'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Temperature (K)</label>
                <div className="flex items-center space-x-3">
                  <Slider
                    min={250}
                    max={500}
                    step={5}
                    value={[temperature]}
                    onValueChange={values => setTemperature(values[0])}
                    className="flex-1"
                  />
                  <span className="min-w-[60px] text-right font-mono bg-gray-100 px-3 py-1 rounded">
                    {temperature} K
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(temperature - 273.15).toFixed(1)}°C
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border-2 border-teal-200">
                <div className="text-sm text-gray-600 mb-2">Calculated Current</div>
                <div className="text-3xl font-bold text-teal-700 font-mono">
                  {formatCurrent(currentValue)} A
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Junction operating at {temperature}K
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={addDataPoint} className="w-full bg-blue-600 hover:bg-blue-700">
                  📍 Add Point
                </Button>
                <Button onClick={generateIVCurve} variant="outline" className="w-full">
                  📊 Generate Curve
                </Button>
              </div>

              <Button 
                onClick={exportData} 
                disabled={chartData.length === 0}
                className="w-full"
                variant="secondary"
              >
                💾 Export Data (CSV)
              </Button>
            </div>
          </div>

          {/* Visualization and Results */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
                <span>📈</span> I-V Characteristics
              </h3>

              <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="voltage"
                        label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -10 }}
                        stroke="#666"
                      />
                      <YAxis
                        label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', offset: 10 }}
                        scale="log"
                        domain={['auto', 'auto']}
                        stroke="#666"
                        tickFormatter={(value) => value.toExponential(0)}
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrent(value) + ' A', 'Current']}
                        labelFormatter={label => `Voltage: ${label} V`}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="current"
                        name={`Current @ ${temperature}K`}
                        stroke="#0d9488"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#0d9488' }}
                        activeDot={{ r: 7, fill: '#0f766e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-3">
                    <div className="text-6xl">📉</div>
                    <div className="text-center">
                      <p className="font-medium">No data to display</p>
                      <p className="text-sm">Add data points or generate I-V curve to visualize</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-700">Data Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 mb-1">Data Points</div>
                    <div className="text-2xl font-bold text-gray-800">{chartData.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-600 mb-1">Temperature</div>
                    <div className="text-2xl font-bold text-gray-800">{temperature}K</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PNJunctionSimulation;
