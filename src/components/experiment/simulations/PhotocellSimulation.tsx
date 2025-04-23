import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, PerspectiveCamera } from '@react-three/drei';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as THREE from 'three';
import PhotocellScene from "./photocell/PhotocellScene";

const PhotocellSimulation = () => {
  const [wavelength, setWavelength] = useState(550); // nm
  const [intensity, setIntensity] = useState(50); // %
  const [material, setMaterial] = useState('silicon');
  const [current, setCurrent] = useState(0); // μA
  const [voltage, setVoltage] = useState(5); // V
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Materials and their properties (spectral response characteristics)
  const materials = {
    silicon: { 
      name: 'Silicon',
      peakWavelength: 800, // nm
      bandgap: 1.1, // eV
      responsivity: 0.5, // A/W
      cutoffWavelength: 1100 // nm
    },
    germanium: { 
      name: 'Germanium',
      peakWavelength: 1500, // nm
      bandgap: 0.67, // eV
      responsivity: 0.7, // A/W
      cutoffWavelength: 1800 // nm
    },
    gallium_arsenide: { 
      name: 'Gallium Arsenide',
      peakWavelength: 850, // nm
      bandgap: 1.42, // eV
      responsivity: 0.6, // A/W
      cutoffWavelength: 870 // nm
    }
  };
  
  // Calculate photocurrent based on wavelength, intensity and material
  React.useEffect(() => {
    const materialInfo = materials[material as keyof typeof materials];
    
    // Calculate spectral response based on distance from peak wavelength
    let response = 0;
    
    // Check if wavelength is below cutoff
    if (wavelength <= materialInfo.cutoffWavelength) {
      // Calculate normalized response curve (approximated Gaussian)
      const distFromPeak = Math.abs(wavelength - materialInfo.peakWavelength);
      const halfWidth = (materialInfo.cutoffWavelength - materialInfo.peakWavelength) / 2;
      response = Math.exp(-(distFromPeak * distFromPeak) / (2 * halfWidth * halfWidth));
      
      // Apply quantum efficiency drop-off at shorter wavelengths
      if (wavelength < materialInfo.peakWavelength) {
        response *= 0.5 + 0.5 * (wavelength / materialInfo.peakWavelength);
      }
    }
    
    // Calculate current based on light intensity, spectral response, and applied voltage
    const calculatedCurrent = materialInfo.responsivity * (intensity / 100) * response * voltage;
    const finalCurrent = calculatedCurrent * 100; // Scale for display purposes
    
    setCurrent(parseFloat(finalCurrent.toFixed(2)));
  }, [wavelength, intensity, material, voltage]);
  
  const addDataPoint = () => {
    const newPoint = { wavelength, intensity, current };
    
    setChartData(prevData => {
      // Check if a similar wavelength point already exists for this intensity
      const existingIndex = prevData.findIndex(p => 
        Math.abs(p.wavelength - wavelength) < 5 && 
        Math.abs(p.intensity - intensity) < 1
      );
      
      if (existingIndex >= 0) {
        // Update existing point
        const newData = [...prevData];
        newData[existingIndex] = newPoint;
        return newData;
      } else {
        // Add new point and sort
        return [...prevData, newPoint].sort((a, b) => a.wavelength - b.wavelength);
      }
    });
  };
  
  const resetExperiment = () => {
    setWavelength(550);
    setIntensity(50);
    setMaterial('silicon');
    setVoltage(5);
    setChartData([]);
  };
  
  const exportData = () => {
    const csvData = [
      ['Wavelength (nm)', 'Intensity (%)', 'Current (μA)'],
      ...chartData.map(point => [point.wavelength, point.intensity, point.current])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photocell_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Filter data for current intensity
  const filteredSpectralData = chartData.filter(p => 
    Math.abs(p.intensity - intensity) < 1
  ).sort((a, b) => a.wavelength - b.wavelength);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <div className="control-panel">
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
            <label className="text-sm font-medium">Light Wavelength (nm)</label>
            <div className="flex items-center space-x-2">
              <Slider 
                min={380} 
                max={1000} 
                step={10} 
                value={[wavelength]}
                onValueChange={(values) => setWavelength(values[0])} 
              />
              <span className="min-w-[50px] text-right">{wavelength}</span>
            </div>
            <div className="h-4 w-full rounded-full" style={{ background: `linear-gradient(to right, violet, blue, cyan, green, yellow, orange, red)` }}></div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Light Intensity (%)</label>
            <div className="flex items-center space-x-2">
              <Slider 
                min={0} 
                max={100} 
                step={1} 
                value={[intensity]}
                onValueChange={(values) => setIntensity(values[0])} 
              />
              <span className="min-w-[40px] text-right">{intensity}</span>
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
                onValueChange={(values) => setVoltage(values[0])} 
              />
              <span className="min-w-[40px] text-right">{voltage}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-3 rounded-md">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Measured Photocurrent</div>
              <div className="text-2xl font-bold text-lab-teal">{current} μA</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={addDataPoint} className="flex-1">
              Add Data Point
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={resetExperiment} variant="outline">Reset Experiment</Button>
            <Button onClick={exportData} disabled={chartData.length === 0}>Export Data</Button>
          </div>
        </div>
      </div>
      
      {/* Visualization and Results */}
      <div className="space-y-6">
        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Photocell 3D Visualization</h3>
          
          <div className="h-80 bg-gray-100 border rounded-md">
            <Suspense fallback={<div className="flex h-full items-center justify-center">Loading 3D scene...</div>}>
              <PhotocellScene 
                wavelength={wavelength} 
                intensity={intensity}
                current={current}
              />
            </Suspense>
          </div>
        </div>
        
        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">Spectral Response</h3>
          
          <div className="h-64">
            {filteredSpectralData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredSpectralData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="wavelength" 
                    label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Current (μA)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value) => {
                      return typeof value === 'number' ? value.toFixed(2) + ' μA' : value + ' μA';
                    }}
                    labelFormatter={(label) => `Wavelength: ${label} nm`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    name={`Current at ${intensity}% intensity`} 
                    stroke="#00796b" 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Add data points at different wavelengths to see spectral response
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium mb-2">Material Properties</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Peak Sensitivity: {materials[material as keyof typeof materials].peakWavelength} nm</div>
              <div>Bandgap: {materials[material as keyof typeof materials].bandgap} eV</div>
              <div>Responsivity: {materials[material as keyof typeof materials].responsivity} A/W</div>
              <div>Cutoff Wavelength: {materials[material as keyof typeof materials].cutoffWavelength} nm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotocellSimulation;
