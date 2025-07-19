import React from 'react';
import { CircuitVisualization } from './CircuitVisualization';

interface LDRVisualizationProps {
  lightIntensity: number;
  resistance: number;
}

const LDRVisualization: React.FC<LDRVisualizationProps> = ({ lightIntensity, resistance }) => {
  // Calculate light intensity as a percentage for easier visualization
  const intensityPercentage = (lightIntensity / 1000) * 100;

  return (
    <div className="data-panel">
      <h3 className="text-lg font-semibold mb-4 text-lab-blue">LDR Circuit Visualization</h3>

      <div className="flex flex-col h-80 bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="flex-1 p-4 flex items-center justify-center">
          <CircuitVisualization lightIntensity={intensityPercentage} resistance={resistance} />
        </div>

        <div className="bg-gray-50 p-3 border-t border-gray-200 text-sm">
          <div className="flex justify-between">
            <div>
              Light Intensity: <span className="font-medium">{lightIntensity} lux</span>
            </div>
            <div>
              LDR Resistance: <span className="font-medium">{resistance.toFixed(1)} kΩ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDRVisualization;
