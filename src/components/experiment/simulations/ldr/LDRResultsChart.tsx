import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DataPoint {
  intensity: number;
  resistance: number;
  current: number;
}

interface LDRResultsChartProps {
  data: DataPoint[];
  materialInfo: {
    name: string;
    peakSensitivity: number;
    darkResistance: number;
    responseTime: number;
  };
}

const LDRResultsChart: React.FC<LDRResultsChartProps> = ({ data, materialInfo }) => {
  return (
    <div className="data-panel">
      <h3 className="text-lg font-semibold mb-4 text-lab-blue">Results</h3>

      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="intensity"
                label={{ value: 'Light Intensity (lux)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                yAxisId="left"
                label={{ value: 'Resistance (kΩ)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Current (mA)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                formatter={value => {
                  return typeof value === 'number' ? value.toFixed(2) : value;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="resistance"
                name="Resistance"
                stroke="#1a237e"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="current"
                name="Current"
                stroke="#00796b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Add data points using different light intensities to see results
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium mb-2">Material Properties: {materialInfo.name}</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Peak Sensitivity: {materialInfo.peakSensitivity} nm</div>
          <div>Dark Resistance: {materialInfo.darkResistance} kΩ</div>
          <div>Response Time: {materialInfo.responseTime} ms</div>
        </div>
      </div>
    </div>
  );
};

export default LDRResultsChart;
