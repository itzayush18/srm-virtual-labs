import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';

const LDRCharacteristicsSimulation = () => {
  const [lightIntensity, setLightIntensity] = useState(50); // %
  const [voltage, setVoltage] = useState(5); // V
  const [current, setCurrent] = useState(0); // mA
  const [resistance, setResistance] = useState(0); // kΩ
  interface VICurvePoint {
    voltage: number;
    current: number;
    lightIntensity: number;
  }

  interface ResistancePoint {
    lightIntensity: number;
    resistance: number;
  }

  const [viCurveData, setViCurveData] = useState<VICurvePoint[]>([]);
  const [resistanceData, setResistanceData] = useState<ResistancePoint[]>([]);
  const [isAutoSweeping, setIsAutoSweeping] = useState(false);

  // Calculate current based on voltage and light intensity
  useEffect(() => {
    // LDR characteristic: Resistance decreases with increasing light intensity
    // R = R0 * (E0/E)^γ
    const darkResistance = 100; // kΩ
    const gamma = 0.7;

    // Calculate resistance based on light intensity
    const calculatedResistance = darkResistance * Math.pow(1 / (lightIntensity / 100), gamma);
    setResistance(parseFloat(calculatedResistance.toFixed(2)));

    // Calculate current: I = V / R
    const calculatedCurrent = voltage / calculatedResistance;
    setCurrent(parseFloat(calculatedCurrent.toFixed(3)));
  }, [voltage, lightIntensity]);

  // Add current data point to VI curve
  const addDataPoint = React.useCallback(() => {
    const newPoint = { voltage, current, lightIntensity };

    setViCurveData(prevData => {
      // Check if a similar voltage point already exists for this light intensity
      const existingIndex = prevData.findIndex(
        p => Math.abs(p.voltage - voltage) < 0.1 && Math.abs(p.lightIntensity - lightIntensity) < 1
      );

      if (existingIndex >= 0) {
        // Update existing point
        const newData = [...prevData];
        newData[existingIndex] = newPoint;
        return newData;
      } else {
        // Add new point
        return [...prevData, newPoint];
      }
    });

    // Add to resistance vs light intensity data if not already present
    setResistanceData(prevData => {
      const existingIndex = prevData.findIndex(
        p => Math.abs(p.lightIntensity - lightIntensity) < 1
      );

      if (existingIndex >= 0) {
        // Update existing point
        const newData = [...prevData];
        newData[existingIndex] = { lightIntensity, resistance };
        return newData;
      } else {
        // Add new point and sort by light intensity
        return [...prevData, { lightIntensity, resistance }].sort(
          (a, b) => a.lightIntensity - b.lightIntensity
        );
      }
    });
  }, [voltage, current, lightIntensity, resistance]);

  // Auto sweep through voltage values
  useEffect(() => {
    if (!isAutoSweeping) return;

    let timeoutId: number;
    let currentVoltage = 0;

    const sweep = () => {
      if (currentVoltage > 10) {
        setIsAutoSweeping(false);
        return;
      }

      setVoltage(currentVoltage);
      timeoutId = window.setTimeout(() => {
        addDataPoint();
        currentVoltage += 0.5;
        sweep();
      }, 500);
    };

    sweep();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAutoSweeping, addDataPoint]);

  const resetExperiment = () => {
    setVoltage(5);
    setLightIntensity(50);
    setViCurveData([]);
    setResistanceData([]);
    setIsAutoSweeping(false);
  };

  const exportData = () => {
    const csvData = [
      ['Voltage (V)', 'Current (mA)', 'Resistance (kΩ)', 'Light Intensity (%)'],
      ...viCurveData.map(point => [
        point.voltage,
        point.current,
        point.voltage / point.current,
        point.lightIntensity,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ldr_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter data for current light intensity
  const filteredViData = viCurveData
    .filter(p => Math.abs(p.lightIntensity - lightIntensity) < 1)
    .sort((a, b) => a.voltage - b.voltage);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <div className="control-panel">
        <h3 className="text-lg font-semibold mb-4 text-lab-blue">Control Panel</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Light Intensity (%)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[lightIntensity]}
                onValueChange={values => setLightIntensity(values[0])}
                disabled={isAutoSweeping}
              />
              <span className="min-w-[40px] text-right">{lightIntensity}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Applied Voltage (V)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={0}
                max={10}
                step={0.1}
                value={[voltage]}
                onValueChange={values => setVoltage(values[0])}
                disabled={isAutoSweeping}
              />
              <span className="min-w-[40px] text-right">{voltage}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current (mA)</label>
              <Input value={current.toFixed(3)} readOnly className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resistance (kΩ)</label>
              <Input value={resistance.toFixed(2)} readOnly className="bg-gray-50" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addDataPoint} disabled={isAutoSweeping} className="flex-1">
              Add Data Point
            </Button>
            <Button
              onClick={() => setIsAutoSweeping(!isAutoSweeping)}
              variant={isAutoSweeping ? 'destructive' : 'default'}
              className="flex-1"
            >
              {isAutoSweeping ? 'Stop Sweep' : 'Auto V-I Sweep'}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={resetExperiment} variant="outline" disabled={isAutoSweeping}>
              Reset Experiment
            </Button>
            <Button onClick={exportData} disabled={viCurveData.length === 0 || isAutoSweeping}>
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Visualization and Results */}
      <div className="space-y-6">
        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">LDR Visualization</h3>

          <div className="relative h-40 bg-blue-50 border rounded-md flex items-center justify-center overflow-hidden">
            {/* Light source */}
            <div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-yellow-300"
              style={{
                opacity: lightIntensity / 100,
                boxShadow: `0 0 ${lightIntensity / 2}px ${lightIntensity / 4}px rgba(255, 204, 0, 0.7)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-yellow-600"
                >
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              </div>
            </div>

            {/* LDR component */}
            <div className="relative mt-6 w-24 h-12 bg-gray-200 rounded border-2 border-gray-400 flex items-center justify-center">
              <div className="absolute inset-1 bg-gray-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold">LDR</div>
                </div>
                {/* Zigzag pattern */}
                <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full">
                  <path
                    d="M10,25 L20,10 L30,40 L40,10 L50,40 L60,10 L70,40 L80,10 L90,25"
                    stroke="black"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            {/* Current/Voltage indicators */}
            <div className="absolute bottom-2 left-4 text-xs">
              <div>V = {voltage.toFixed(1)} V</div>
              <div>I = {current.toFixed(3)} mA</div>
            </div>

            {/* Light intensity indicator */}
            <div className="absolute bottom-2 right-4 text-xs">
              <div>Light: {lightIntensity}%</div>
              <div>R = {resistance.toFixed(1)} kΩ</div>
            </div>
          </div>
        </div>

        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">V-I Characteristics</h3>

          <div className="h-64">
            {filteredViData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredViData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="voltage"
                    label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Current (mA)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={value => {
                      // Fix: Ensure value is a number before calling toFixed
                      return typeof value === 'number' ? value.toFixed(3) + ' mA' : value + ' mA';
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name={`Current at ${lightIntensity}% light`}
                    stroke="#00796b"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Add data points to see V-I characteristics
              </div>
            )}
          </div>
        </div>

        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">
            Resistance vs Light Intensity
          </h3>

          <div className="h-64">
            {resistanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resistanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="lightIntensity"
                    label={{ value: 'Light Intensity (%)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Resistance (kΩ)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={value => {
                      // Fix: Ensure value is a number before calling toFixed
                      return typeof value === 'number' ? value.toFixed(2) + ' kΩ' : value + ' kΩ';
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="resistance"
                    name="Resistance"
                    stroke="#ffc107"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Collect data at different light intensities
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDRCharacteristicsSimulation;
