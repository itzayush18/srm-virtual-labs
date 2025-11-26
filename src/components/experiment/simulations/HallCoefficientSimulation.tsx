import React, { useState, useEffect } from 'react';
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
} from 'recharts';
import { Progress } from '@/components/ui/progress';

const HallCoefficientSimulation = () => {
  // Simulation state
  const [material, setMaterial] = useState('silicon');
  const [current, setCurrent] = useState(10); // mA
  const [magneticField, setMagneticField] = useState(0.5); // Tesla
  const [hallVoltage, setHallVoltage] = useState(0); // mV
  const [hallCoefficient, setHallCoefficient] = useState(0); // cm³/C
  const [carrierType, setCarrierType] = useState('');
  const [carrierDensity, setCarrierDensity] = useState(0); // carriers/cm³
  const [thicknessValue, setThicknessValue] = useState(1); // mm
  interface ChartDataPoint {
    magneticField: number;
    hallVoltage: number;
  }
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Material properties
  const materials = React.useMemo(() => ({
    silicon: {
      name: 'Silicon',
      rh: -4e-4, // cm³/C for n-type, or appropriate value
      carrierType: 'n-type',
      carrierDensity: 1.5e22, // carriers/m³
    },
    germanium: {
      name: 'Germanium',
      rh: -3e-3, // cm³/C for n-type, or appropriate value
      carrierType: 'n-type',
      carrierDensity: 2.4e21, // carriers/m³
    },
    gallium_arsenide: {
      name: 'Gallium Arsenide',
      rh: +1e-2, // cm³/C for p-type, or appropriate value
      carrierType: 'p-type',
      carrierDensity: 9.0e21, // carriers/m³
    },
  }), []);

  // Update Hall voltage and coefficient when inputs change
  useEffect(() => {
    // Convert current from mA to A
    const currentInA = current / 1000;

    // Convert thickness from mm to m
    const thicknessInM = thicknessValue / 1000;

    // Calculate Hall voltage using the Hall effect formula
    // VH = (RH * I * B) / t
    // where RH is the Hall coefficient, I is the current, B is the magnetic field, and t is the thickness
    const materialInfo = materials[material as keyof typeof materials];
    const rh = materialInfo.rh;
    const calculatedHallVoltage = ((rh * currentInA * magneticField) / thicknessInM) * 1000; // Convert to mV

    setHallVoltage(parseFloat(calculatedHallVoltage.toFixed(3)));
    setHallCoefficient(rh);
    setCarrierType(materialInfo.carrierType);
    setCarrierDensity(materialInfo.carrierDensity);

    // Update chart data
    const newDataPoint = {
      magneticField,
      hallVoltage: calculatedHallVoltage,
    };

    setChartData(prevData => {
      // Check if this magnetic field value already exists in the data
      const existingIndex = prevData.findIndex(d => d.magneticField === magneticField);

      if (existingIndex >= 0) {
        // Update existing point
        const newData = [...prevData];
        newData[existingIndex] = newDataPoint;
        return newData;
      } else {
        // Add new point and sort by magnetic field
        return [...prevData, newDataPoint].sort((a, b) => a.magneticField - b.magneticField);
      }
    });
  }, [material, current, magneticField, thicknessValue, materials]);

  const resetExperiment = () => {
    setMaterial('silicon');
    setCurrent(10);
    setMagneticField(0.5);
    setThicknessValue(1);
    setChartData([]);
  };

  const exportData = () => {
    const csvData = [
      ['Magnetic Field (T)', 'Hall Voltage (mV)'],
      ...chartData.map(point => [point.magneticField, point.hallVoltage]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hall_effect_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Control Panel */}
      <div className="md:col-span-1 control-panel">
        <h3 className="text-lg font-semibold mb-4 text-lab-blue">Control Panel</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Material Selection</label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silicon">Silicon (n-type)</SelectItem>
                <SelectItem value="germanium">Germanium (n-type)</SelectItem>
                <SelectItem value="gallium_arsenide">Gallium Arsenide (p-type)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current (mA)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={1}
                max={50}
                step={1}
                value={[current]}
                onValueChange={values => setCurrent(values[0])}
              />
              <span className="min-w-[40px] text-right">{current}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Magnetic Field (Tesla)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={0}
                max={2}
                step={0.05}
                value={[magneticField]}
                onValueChange={values => setMagneticField(values[0])}
              />
              <span className="min-w-[40px] text-right">{magneticField}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sample Thickness (mm)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={0.1}
                max={5}
                step={0.1}
                value={[thicknessValue]}
                onValueChange={values => setThicknessValue(values[0])}
              />
              <span className="min-w-[40px] text-right">{thicknessValue}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={resetExperiment} variant="outline">
              Reset Experiment
            </Button>
            <Button onClick={exportData}>Export Data</Button>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="md:col-span-2 space-y-6">
        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Measurement Data</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Hall Voltage</div>
              <div className="text-2xl font-bold text-lab-teal">{hallVoltage} mV</div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Hall Coefficient</div>
              <div className="text-2xl font-bold text-lab-teal">{hallCoefficient} m³/C</div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Carrier Type</div>
              <div className="text-2xl font-bold text-lab-teal">{carrierType}</div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Carrier Density</div>
              <div className="text-2xl font-bold text-lab-teal">
                {carrierDensity.toExponential(2)} m⁻³
              </div>
            </div>
          </div>

          <div className="mt-6 border p-4 rounded-md bg-gray-50">
            <h4 className="text-md font-medium mb-2">Hall Effect Visualization</h4>
            <div className="relative h-40 bg-blue-50 border rounded-md flex items-center justify-center">
              {/* Simple visualization of the Hall effect */}
              <div className="relative w-2/3 h-16 bg-gray-300 rounded flex items-center justify-center">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-4 h-4 bg-red-500 rounded-full" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-4 h-4 bg-blue-500 rounded-full" />

                {/* Hall voltage arrows */}
                <div
                  className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col justify-between py-1 text-${hallVoltage < 0 ? 'red' : 'green'}-500`}
                  style={{ opacity: Math.min(1, Math.abs(hallVoltage) / 2) }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>

                <div className="text-xs">
                  {material === 'silicon' ? 'Si' : material === 'germanium' ? 'Ge' : 'GaAs'}
                </div>
              </div>

              {/* Magnetic field indication */}
              <div className="absolute top-2 left-2 flex items-center space-x-1 text-blue-600">
                <span className="text-xs">B = {magneticField} T</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </div>

              {/* Current indication */}
              <div className="absolute bottom-2 right-2 flex items-center space-x-1 text-red-600">
                <span className="text-xs">I = {current} mA</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Results</h3>

          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="magneticField"
                    label={{ value: 'Magnetic Field (T)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Hall Voltage (mV)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={value => {
                      // Fix: Ensure value is a number before calling toFixed
                      return typeof value === 'number' ? value.toFixed(3) + ' mV' : value + ' mV';
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hallVoltage"
                    name="Hall Voltage"
                    stroke="#00796b"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Adjust the magnetic field to collect data points
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Experimental Progress</div>
            <Progress value={Math.min(100, chartData.length * 10)} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallCoefficientSimulation;
