
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LDRControlPanelProps {
  lightIntensity: number;
  onLightIntensityChange: (value: number) => void;
  voltage: number;
  onVoltageChange: (value: number) => void;
  materialType: string;
  onMaterialTypeChange: (value: string) => void;
  currentReading: number;
  resistance: number;
  onAddDataPoint: () => void;
  onResetExperiment: () => void;
  onExportData: () => void;
  dataPointCount: number;
}

const LDRControlPanel: React.FC<LDRControlPanelProps> = ({
  lightIntensity,
  onLightIntensityChange,
  voltage,
  onVoltageChange,
  materialType,
  onMaterialTypeChange,
  currentReading,
  resistance,
  onAddDataPoint,
  onResetExperiment,
  onExportData,
  dataPointCount
}) => {
  return (
    <div className="control-panel">
      <h3 className="text-lg font-semibold mb-4 text-lab-blue">Control Panel</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Material Selection</label>
          <Select value={materialType} onValueChange={onMaterialTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select LDR material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cadmium_sulfide">Cadmium Sulfide (CdS)</SelectItem>
              <SelectItem value="cadmium_selenide">Cadmium Selenide (CdSe)</SelectItem>
              <SelectItem value="lead_sulfide">Lead Sulfide (PbS)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Light Intensity (lux)</label>
          <div className="flex items-center space-x-2">
            <Slider 
              min={0} 
              max={1000} 
              step={10} 
              value={[lightIntensity]}
              onValueChange={(values) => onLightIntensityChange(values[0])} 
            />
            <span className="min-w-[50px] text-right">{lightIntensity}</span>
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
              onValueChange={(values) => onVoltageChange(values[0])} 
            />
            <span className="min-w-[40px] text-right">{voltage.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Current Reading</div>
            <div className="text-xl font-bold text-lab-teal">{currentReading.toFixed(2)} mA</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Resistance</div>
            <div className="text-xl font-bold text-lab-blue">{resistance.toFixed(1)} kΩ</div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button onClick={onAddDataPoint}>Add Data Point</Button>
          <Button onClick={onResetExperiment} variant="outline">Reset Experiment</Button>
          <Button onClick={onExportData} disabled={dataPointCount === 0}>Export Data</Button>
        </div>
      </div>
    </div>
  );
};

export default LDRControlPanel;
