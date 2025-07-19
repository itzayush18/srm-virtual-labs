import React, { useState, useEffect } from 'react';
import LDRControlPanel from './LDRControlPanel';
import LDRVisualization from './LDRVisualization';
import LDRResultsChart from './LDRResultsChart';

interface DataPoint {
  intensity: number;
  resistance: number;
  current: number;
}

interface MaterialInfo {
  name: string;
  peakSensitivity: number;
  darkResistance: number;
  responseTime: number;
}

const LDRCharacteristicsSimulation = () => {
  // State variables
  const [lightIntensity, setLightIntensity] = useState(500);
  const [voltage, setVoltage] = useState(5);
  const [materialType, setMaterialType] = useState('cadmium_sulfide');
  const [currentReading, setCurrentReading] = useState(0);
  const [resistance, setResistance] = useState(0);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  // Material properties
  const materials: Record<string, MaterialInfo> = React.useMemo(() => ({
    cadmium_sulfide: {
      name: 'Cadmium Sulfide (CdS)',
      peakSensitivity: 520,
      darkResistance: 1000,
      responseTime: 30,
    },
    cadmium_selenide: {
      name: 'Cadmium Selenide (CdSe)',
      peakSensitivity: 730,
      darkResistance: 750,
      responseTime: 15,
    },
    lead_sulfide: {
      name: 'Lead Sulfide (PbS)',
      peakSensitivity: 1500,
      darkResistance: 1200,
      responseTime: 10,
    },
  }), []);

  // Calculate current and resistance based on light intensity, voltage, and material
  useEffect(() => {
    const materialInfo = materials[materialType];

    // Simplified model for LDR resistance based on light intensity
    // R = R_dark * (1 / (1 + k * light_intensity))
    const k = 0.005; // Sensitivity factor
    const calculatedResistance = materialInfo.darkResistance / (1 + k * lightIntensity);

    // Calculate current using Ohm's law: I = V / R
    const calculatedCurrent = (voltage / calculatedResistance) * 1000; // Convert to mA

    setResistance(calculatedResistance);
    setCurrentReading(calculatedCurrent);
  }, [lightIntensity, voltage, materialType, materials]);

  // Add a data point to the chart
  const handleAddDataPoint = () => {
    const newPoint: DataPoint = {
      intensity: lightIntensity,
      resistance: parseFloat(resistance.toFixed(1)),
      current: parseFloat(currentReading.toFixed(2)),
    };

    setDataPoints(prev => {
      // Check if a point with similar intensity already exists
      const existingIndex = prev.findIndex(p => Math.abs(p.intensity - lightIntensity) < 10);

      if (existingIndex >= 0) {
        // Replace existing point
        const newData = [...prev];
        newData[existingIndex] = newPoint;
        return newData;
      } else {
        // Add new point and sort by intensity
        return [...prev, newPoint].sort((a, b) => a.intensity - b.intensity);
      }
    });
  };

  // Reset all experiment values
  const handleResetExperiment = () => {
    setLightIntensity(500);
    setVoltage(5);
    setMaterialType('cadmium_sulfide');
    setDataPoints([]);
  };

  // Export data as CSV
  const handleExportData = () => {
    if (dataPoints.length === 0) return;

    const csvData = [
      ['Light Intensity (lux)', 'Resistance (kΩ)', 'Current (mA)'],
      ...dataPoints.map(point => [point.intensity, point.resistance, point.current]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ldr_data_${materialType}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <LDRControlPanel
        lightIntensity={lightIntensity}
        onLightIntensityChange={setLightIntensity}
        voltage={voltage}
        onVoltageChange={setVoltage}
        materialType={materialType}
        onMaterialTypeChange={setMaterialType}
        currentReading={currentReading}
        resistance={resistance}
        onAddDataPoint={handleAddDataPoint}
        onResetExperiment={handleResetExperiment}
        onExportData={handleExportData}
        dataPointCount={dataPoints.length}
      />

      {/* Visualization and Results */}
      <div className="space-y-6">
        <LDRVisualization lightIntensity={lightIntensity} resistance={resistance} />

        <LDRResultsChart data={dataPoints} materialInfo={materials[materialType]} />
      </div>
    </div>
  );
};

export default LDRCharacteristicsSimulation;
