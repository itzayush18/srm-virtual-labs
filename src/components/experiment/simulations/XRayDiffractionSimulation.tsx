import React, { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import XRayDiffractionScene from './xray/XRayDiffractionScene';

const XRayDiffractionSimulation = () => {
  // State variables for simulation parameters
  const [structureType, setStructureType] = useState<'sc' | 'bcc' | 'fcc' | 'diamond'>('sc');
  const [wavelength, setWavelength] = useState(0.154); // nm (Cu K-alpha)
  const [latticeConstant, setLatticeConstant] = useState(0.3); // nm
  
  // Calculate diffraction pattern data
  const calculateDiffractionData = useCallback(() => {
    const results = [];
    
    // Max Miller indices to consider
    const maxIndex = 3;
    
    for (let h = 0; h <= maxIndex; h++) {
      for (let k = 0; k <= maxIndex; k++) {
        for (let l = 0; l <= maxIndex; l++) {
          // Skip the origin
          if (h === 0 && k === 0 && l === 0) continue;
          
          // Calculate d-spacing and 2-theta
          const dSpacing = latticeConstant / Math.sqrt(h*h + k*k + l*l);
          const sinTheta = wavelength / (2 * dSpacing);
          
          // Skip if beyond physical limits (sin(theta) > 1)
          if (sinTheta > 1) continue;
          
          const twoTheta = 2 * Math.asin(sinTheta) * 180 / Math.PI; // in degrees
          
          // Check structure factor for each type
          let allowed = false;
          let intensity = 1.0;
          
          switch (structureType) {
            case 'sc':
              // All reflections allowed
              allowed = true;
              break;
              
            case 'bcc':
              // h+k+l must be even
              allowed = (h + k + l) % 2 === 0;
              intensity = allowed ? 1.0 : 0.0;
              break;
              
            case 'fcc':
              // h, k, l must be all odd or all even
              allowed = ((h % 2) === (k % 2)) && ((k % 2) === (l % 2));
              intensity = allowed ? 1.0 : 0.0;
              break;
              
            case 'diamond':
              // h, k, l must be all odd or all even AND h+k+l ≠ 4n+2
              allowed = ((h % 2) === (k % 2)) && ((k % 2) === (l % 2));
              if (allowed && (h + k + l) % 4 === 2) {
                allowed = false;
              }
              intensity = allowed ? 1.0 : 0.0;
              break;
          }
          
          if (allowed) {
            // Scale intensity by multiplicity factor
            let multiplicity = 1;
            if (h === k && k === l) {
              multiplicity = 1;
            } else if (h === k || k === l || h === l) {
              multiplicity = 3;
            } else {
              multiplicity = 6;
            }
            
            // Simulate intensity (normally would use atomic form factors)
            // This is a simplified model: I ∝ (multiplicity / sin²(θ))
            intensity *= multiplicity / Math.pow(Math.sin(twoTheta * Math.PI / 360), 2);
            
            // Scale to keep the range reasonable
            intensity = Math.min(100, intensity);
            
            results.push({
              h, k, l,
              dSpacing: parseFloat(dSpacing.toFixed(4)),
              twoTheta: parseFloat(twoTheta.toFixed(2)),
              intensity: parseFloat(intensity.toFixed(1))
            });
          }
        }
      }
    }
    
    // Sort by 2-theta angle (ascending)
    return results.sort((a, b) => a.twoTheta - b.twoTheta);
  }, [structureType, wavelength, latticeConstant]);
  
  const diffractionData = calculateDiffractionData();
  
  // Calculate lattice planes for (h,k,l)
  const calculateLatticeParameter = () => {
    // Pick the first peak for calculation
    if (diffractionData.length === 0) return 0;
    
    const firstPeak = diffractionData[0];
    const { h, k, l, twoTheta } = firstPeak;
    
    // Bragg's law: n*lambda = 2d*sin(theta)
    const theta = twoTheta * Math.PI / 360; // convert to radians
    const d = wavelength / (2 * Math.sin(theta));
    
    // For cubic crystals: a = d * sqrt(h² + k² + l²)
    const a = d * Math.sqrt(h*h + k*k + l*l);
    
    return parseFloat(a.toFixed(4));
  };
  
  const calculatedLatticeParameter = calculateLatticeParameter();
  
  // Export data as CSV
  const exportData = () => {
    const csvContent = [
      ['h', 'k', 'l', 'd-spacing (nm)', '2-theta (degrees)', 'Intensity'],
      ...diffractionData.map(row => [
        row.h, row.k, row.l, row.dSpacing, row.twoTheta, row.intensity
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xray_diffraction_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Reset experiment to default values
  const resetExperiment = () => {
    setStructureType('sc');
    setWavelength(0.154);
    setLatticeConstant(0.3);
  };

  return (
    <div className="simulation-container p-6">
      <h3 className="text-lg font-semibold mb-4 text-lab-blue">
        X-Ray Diffraction and Lattice Parameter Calculation
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4">Control Panel</h4>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Crystal Structure</label>
              <Select 
                value={structureType} 
                onValueChange={(value) => setStructureType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crystal structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sc">Simple Cubic (SC)</SelectItem>
                  <SelectItem value="bcc">Body-Centered Cubic (BCC)</SelectItem>
                  <SelectItem value="fcc">Face-Centered Cubic (FCC)</SelectItem>
                  <SelectItem value="diamond">Diamond Cubic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>X-Ray Wavelength (nm)</span>
                <span>{wavelength.toFixed(3)} nm</span>
              </label>
              <Slider 
                min={0.1} 
                max={0.2} 
                step={0.001} 
                value={[wavelength]}
                onValueChange={(values) => setWavelength(values[0])} 
              />
              <div className="text-xs text-gray-500">
                Cu Kα = 0.154 nm, Mo Kα = 0.071 nm
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                <span>Actual Lattice Constant (nm)</span>
                <span>{latticeConstant.toFixed(3)} nm</span>
              </label>
              <Slider 
                min={0.2} 
                max={0.6} 
                step={0.01} 
                value={[latticeConstant]}
                onValueChange={(values) => setLatticeConstant(values[0])} 
              />
              <div className="text-xs text-gray-500">
                Si = 0.543 nm, Cu = 0.361 nm, Al = 0.405 nm
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <div className="text-xs text-gray-500 mb-1">Calculated Lattice Parameter</div>
              <div className="text-xl font-bold text-blue-600">
                {calculatedLatticeParameter} nm
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Error: {Math.abs(calculatedLatticeParameter - latticeConstant).toFixed(4)} nm 
                ({Math.abs((calculatedLatticeParameter - latticeConstant) / latticeConstant * 100).toFixed(2)}%)
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={exportData} 
                className="w-full"
                variant="outline"
              >
                Export Data
              </Button>
              
              <Button 
                onClick={resetExperiment} 
                className="w-full"
                variant="secondary"
              >
                Reset Experiment
              </Button>
            </div>
          </div>
        </div>
        
        {/* Visualization */}
        <div className="md:col-span-2 space-y-6">
          {/* 3D Visualization */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 h-96">
            <XRayDiffractionScene 
              structureType={structureType}
              wavelength={wavelength}
              latticeConstant={latticeConstant}
            />
          </div>
          
          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-4">Diffraction Data</h4>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">(h k l)</TableHead>
                    <TableHead className="w-32">d-spacing (nm)</TableHead>
                    <TableHead className="w-32">2θ (degrees)</TableHead>
                    <TableHead className="w-32">Intensity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diffractionData.length > 0 ? (
                    diffractionData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>({row.h} {row.k} {row.l})</TableCell>
                        <TableCell>{row.dSpacing}</TableCell>
                        <TableCell>{row.twoTheta}</TableCell>
                        <TableCell>{row.intensity}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No diffraction peaks found for the current parameters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {diffractionData.length > 10 && (
                <div className="text-xs text-gray-500 mt-2 text-right">
                  Showing 10 of {diffractionData.length} peaks. Export data to see all peaks.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XRayDiffractionSimulation;
