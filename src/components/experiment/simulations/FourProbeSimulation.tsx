
import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FourProbeSimulation = () => {
  const [material, setMaterial] = useState('silicon');
  const [current, setCurrent] = useState(1); // mA
  const [probeSpacing, setProbeSpacing] = useState(2); // mm
  const [thickness, setThickness] = useState(0.5); // mm
  const [resistivity, setResistivity] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Materials and their properties
  const materials = {
    silicon: { resistivity: 1000 }, // Ω·cm
    germanium: { resistivity: 60 }, // Ω·cm
    gallium_arsenide: { resistivity: 1e8 } // Ω·cm
  };

  // Calculate voltage and resistivity when parameters change
  React.useEffect(() => {
    const materialInfo = materials[material as keyof typeof materials];
    const baseResistivity = materialInfo.resistivity;
    
    // Add some variability based on thickness and probe spacing
    const factor = 1 + (thickness * 0.1) * (Math.random() * 0.2 - 0.1);
    const actualResistivity = baseResistivity * factor;
    
    // Calculate voltage using four-probe method formula
    const currentInA = current / 1000;
    const spacingInCm = probeSpacing / 10;
    const calculatedVoltage = (currentInA * actualResistivity) / (2 * Math.PI * spacingInCm);
    
    setVoltage(parseFloat(calculatedVoltage.toFixed(3)));
    setResistivity(parseFloat(actualResistivity.toFixed(2)));
    
    // Update chart data
    if (current > 0) {
      setChartData(prev => {
        const existingIndex = prev.findIndex(d => Math.abs(d.current - current) < 0.01);
        const newPoint = { current, voltage: calculatedVoltage };
        
        if (existingIndex >= 0) {
          const newData = [...prev];
          newData[existingIndex] = newPoint;
          return newData.sort((a, b) => a.current - b.current);
        } else {
          return [...prev, newPoint].sort((a, b) => a.current - b.current);
        }
      });
    }
  }, [material, current, probeSpacing, thickness]);

  const resetExperiment = () => {
    setMaterial('silicon');
    setCurrent(1);
    setProbeSpacing(2);
    setThickness(0.5);
    setChartData([]);
  };

  const exportData = () => {
    const csvData = [
      ['Current (mA)', 'Voltage (V)', 'Resistivity (Ω·cm)'],
      ...chartData.map(point => [point.current, point.voltage, resistivity])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'four_probe_data.csv';
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
                <SelectItem value="silicon">Silicon</SelectItem>
                <SelectItem value="germanium">Germanium</SelectItem>
                <SelectItem value="gallium_arsenide">Gallium Arsenide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Current (mA)</label>
            <div className="flex items-center space-x-2">
              <Slider 
                min={0.1} 
                max={10} 
                step={0.1} 
                value={[current]}
                onValueChange={(values) => setCurrent(values[0])} 
              />
              <span className="min-w-[40px] text-right">{current}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Probe Spacing (mm)</label>
            <div className="flex items-center space-x-2">
              <Slider 
                min={0.5} 
                max={10} 
                step={0.5} 
                value={[probeSpacing]}
                onValueChange={(values) => setProbeSpacing(values[0])} 
              />
              <span className="min-w-[40px] text-right">{probeSpacing}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Sample Thickness (mm)</label>
            <div className="flex items-center space-x-2">
              <Slider 
                min={0.1} 
                max={5} 
                step={0.1} 
                value={[thickness]}
                onValueChange={(values) => setThickness(values[0])} 
              />
              <span className="min-w-[40px] text-right">{thickness}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={resetExperiment} variant="outline">Reset Experiment</Button>
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
              <div className="text-sm text-gray-500 mb-1">Measured Voltage</div>
              <div className="text-2xl font-bold text-lab-teal">{voltage} V</div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Calculated Resistivity</div>
              <div className="text-2xl font-bold text-lab-teal">{resistivity} Ω·cm</div>
            </div>
          </div>
          
          <div className="mt-6 border p-4 rounded-md bg-gray-50">
            <h4 className="text-md font-medium mb-2">Four-Probe Setup Visualization</h4>
            <div className="relative h-40 bg-blue-50 border rounded-md flex items-center justify-center">
              {/* Four-probe method visualization */}
              <div className="relative w-3/4 h-12 bg-gray-300 rounded">
                {/* The four probes */}
                <div className="absolute top-0 left-1/5 transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
                  <div className="w-1 h-8 bg-gray-600"></div>
                  <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                </div>
                <div className="absolute top-0 left-2/5 transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
                  <div className="w-1 h-8 bg-gray-600"></div>
                  <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                </div>
                <div className="absolute top-0 left-3/5 transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
                  <div className="w-1 h-8 bg-gray-600"></div>
                  <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                </div>
                <div className="absolute top-0 left-4/5 transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
                  <div className="w-1 h-8 bg-gray-600"></div>
                  <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                </div>
                
                {/* Sample label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs">
                    {material === 'silicon' ? 'Si' : material === 'germanium' ? 'Ge' : 'GaAs'}
                  </div>
                </div>
                
                {/* Current flow indication */}
                <div className="absolute -bottom-8 w-full flex justify-between px-4">
                  <div className="text-xs text-red-600">I = {current} mA</div>
                  <div className="text-xs text-green-600">V = {voltage.toFixed(3)} V</div>
                </div>
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
                    dataKey="current" 
                    label={{ value: 'Current (mA)', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value) => {
                      // Fix: Ensure value is a number before calling toFixed
                      return typeof value === 'number' ? value.toFixed(5) + ' V' : value + ' V';
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="voltage" 
                    name="Measured Voltage" 
                    stroke="#00796b" 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Adjust the current to collect data points
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

export default FourProbeSimulation;
