/* eslint-disable @typescript-eslint/no-explicit-any */
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
// Custom PN Junction 2D Visualization using Canvas
const PNJunctionScene = ({ voltage, temperature }: { voltage: number; temperature: number }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationRef = React.useRef<number | null>(null);
  const carriersRef = React.useRef<any[]>([]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize charge carriers if empty
    if (carriersRef.current.length === 0) {
      // Holes in P-region (left side)
      for (let i = 0; i < 20; i++) {
        carriersRef.current.push({
          type: 'hole',
          x: 50 + Math.random() * 150,
          y: 50 + Math.random() * (canvas.height - 100),
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
      // Electrons in N-region (right side)
      for (let i = 0; i < 20; i++) {
        carriersRef.current.push({
          type: 'electron',
          x: canvas.width - 200 + Math.random() * 150,
          y: 50 + Math.random() * (canvas.height - 100),
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate depletion width based on voltage
      const baseDepletionWidth = 60;
      const depletionWidth = voltage >= 0 
        ? Math.max(10, baseDepletionWidth - voltage * 50) // Shrinks in forward bias
        : baseDepletionWidth + Math.abs(voltage) * 40; // Expands in reverse bias

      const centerX = canvas.width / 2;
      const pRegionEnd = centerX - depletionWidth / 2;
      const nRegionStart = centerX + depletionWidth / 2;

      // Draw P-type region (blue)
      ctx.fillStyle = 'rgba(74, 144, 226, 0.7)';
      ctx.fillRect(0, 0, pRegionEnd, canvas.height);

      // Draw N-type region (red)
      ctx.fillStyle = 'rgba(226, 74, 74, 0.7)';
      ctx.fillRect(nRegionStart, 0, canvas.width - nRegionStart, canvas.height);

      // Draw depletion region (gray gradient)
      const gradient = ctx.createLinearGradient(pRegionEnd, 0, nRegionStart, 0);
      gradient.addColorStop(0, 'rgba(74, 144, 226, 0.3)');
      gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.5)');
      gradient.addColorStop(1, 'rgba(226, 74, 74, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(pRegionEnd, 0, depletionWidth, canvas.height);

      // Draw electric field arrows in depletion region
      ctx.strokeStyle = voltage > 0 ? '#00aa00' : voltage < 0 ? '#aa0000' : '#888888';
      ctx.lineWidth = 2;
      const arrowDirection = voltage > 0 ? 1 : -1;
      const arrowLength = Math.min(Math.abs(voltage) * 30 + 20, 50);

      for (let y = 80; y < canvas.height - 20; y += 60) {
        const startX = centerX - arrowLength / 2 * arrowDirection;
        const endX = centerX + arrowLength / 2 * arrowDirection;
        
        // Arrow line
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(endX, y);
        ctx.lineTo(endX - 8 * arrowDirection, y - 5);
        ctx.lineTo(endX - 8 * arrowDirection, y + 5);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }

      // Update and draw charge carriers
      carriersRef.current.forEach(carrier => {
        // Apply voltage-based movement
        if (voltage > 0) { // Forward bias
          if (carrier.type === 'hole') {
            carrier.vx += voltage * 0.03; // Holes move right
          } else {
            carrier.vx -= voltage * 0.03; // Electrons move left
          }
        } else if (voltage < 0) { // Reverse bias
          if (carrier.type === 'hole') {
            carrier.vx -= Math.abs(voltage) * 0.02; // Holes move left
          } else {
            carrier.vx += Math.abs(voltage) * 0.02; // Electrons move right
          }
        }

        // Damping
        carrier.vx *= 0.98;
        carrier.vy *= 0.98;

        // Update position
        carrier.x += carrier.vx;
        carrier.y += carrier.vy;

        // Boundary conditions - wrap around and reset
        if (carrier.type === 'hole') {
          if (carrier.x > canvas.width) {
            carrier.x = 50 + Math.random() * 100;
            carrier.vx = (Math.random() - 0.5) * 0.5;
          }
          if (carrier.x < 0) {
            carrier.x = 50 + Math.random() * 150;
            carrier.vx = (Math.random() - 0.5) * 0.5;
          }
        } else {
          if (carrier.x < 0) {
            carrier.x = canvas.width - 150 + Math.random() * 100;
            carrier.vx = (Math.random() - 0.5) * 0.5;
          }
          if (carrier.x > canvas.width) {
            carrier.x = canvas.width - 200 + Math.random() * 150;
            carrier.vx = (Math.random() - 0.5) * 0.5;
          }
        }

        // Vertical boundaries
        if (carrier.y < 30) {
          carrier.y = 30;
          carrier.vy *= -1;
        }
        if (carrier.y > canvas.height - 30) {
          carrier.y = canvas.height - 30;
          carrier.vy *= -1;
        }

        // Draw carrier
        ctx.beginPath();
        ctx.arc(carrier.x, carrier.y, 5, 0, Math.PI * 2);
        if (carrier.type === 'hole') {
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Draw + sign
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(carrier.x - 3, carrier.y);
          ctx.lineTo(carrier.x + 3, carrier.y);
          ctx.moveTo(carrier.x, carrier.y - 3);
          ctx.lineTo(carrier.x, carrier.y + 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#333333';
          ctx.fill();
          // Draw - sign
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(carrier.x - 3, carrier.y);
          ctx.lineTo(carrier.x + 3, carrier.y);
          ctx.stroke();
        }
      });

      // Draw labels
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#1e40af';
      ctx.fillText('P-type', 20, 30);
      ctx.fillStyle = '#991b1b';
      ctx.fillText('N-type', canvas.width - 70, 30);
      
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('Depletion Region', centerX - 60, canvas.height - 10);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [voltage, temperature]);

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-3 py-2 rounded shadow text-sm">
        <div className="font-semibold">
          {voltage < -0.05 ? '⚡ Reverse Bias' : voltage > 0.05 ? '⚡ Forward Bias' : '⚬ No Bias'}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          V = {voltage.toFixed(2)} V | T = {temperature} K
        </div>
      </div>
    </div>
  );
};

const PNJunctionSimulation = () => {
  const [voltage, setVoltage] = useState(0);
  const [temperature, setTemperature] = useState(300);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate current based on diode equation
  const calculateCurrent = (v: number, t: number) => {
    const kB = 1.380649e-23; // Boltzmann constant
    const q = 1.60217663e-19; // Elementary charge
    const n = 1.5; // Ideality factor
    const Is = 1e-12 * Math.pow(t / 300, 3) * Math.exp((-1.1 * q) / (n * kB * t)); // Saturation current

    // Diode equation: I = Is * (exp(qV/nkT) - 1)
    const vT = (kB * t) / q; // Thermal voltage
    return Is * (Math.exp(v / (n * vT)) - 1);
  };

  // Add data point to chart
  const addDataPoint = () => {
    const current = calculateCurrent(voltage, temperature);
    // Use absolute value for log scale, store sign separately
    const absCurrent = Math.abs(current);
    const newPoint = { 
      voltage, 
      current: absCurrent > 0 ? absCurrent : 1e-20, // Ensure positive for log scale
      currentDisplay: current.toExponential(4), // For display only
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
    for (let v = -0.6; v <= 0.8; v += 0.1) {
      const current = calculateCurrent(v, temperature);
      const absCurrent = Math.abs(current);
      newData.push({
        voltage: parseFloat(v.toFixed(1)),
        current: absCurrent > 0 ? absCurrent : 1e-20, // Ensure positive for log scale
        currentDisplay: current.toExponential(4), // For display only
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <div className="control-panel">
        <h3 className="text-lg font-semibold mb-4 text-lab-blue">PN Junction Control Panel</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Applied Voltage (V)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={-0.6}
                max={0.8}
                step={0.01}
                value={[voltage]}
                onValueChange={values => setVoltage(values[0])}
              />
              <span className="min-w-[50px] text-right">{voltage.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature (K)</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={250}
                max={500}
                step={5}
                value={[temperature]}
                onValueChange={values => setTemperature(values[0])}
              />
              <span className="min-w-[50px] text-right">{temperature}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-3 rounded-md">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Calculated Current</div>
              <div className="text-2xl font-bold text-lab-teal">
                {calculateCurrent(voltage, temperature).toExponential(4)} A
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addDataPoint} className="flex-1">
              Add Data Point
            </Button>
            <Button onClick={generateIVCurve} variant="outline" className="flex-1">
              Generate I-V Curve
            </Button>
          </div>

          <Button onClick={exportData} disabled={chartData.length === 0}>
            Export Data
          </Button>
        </div>
      </div>

      {/* Visualization and Results */}
      <div className="space-y-6">
        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">PN Junction Visualization</h3>

          <div className="h-80 bg-gray-100 border rounded-md">
            <PNJunctionScene voltage={voltage} temperature={temperature} />
          </div>
        </div>

        <div className="data-panel">
          <h3 className="text-lg font-semibold mb-4 text-lab-blue">I-V Characteristics</h3>

          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="voltage"
                    label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
                    scale="log"
                    domain={[1e-15, 'auto']}
                    allowDataOverflow={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [typeof value === 'number' ? value.toExponential(4) + ' A' : value + ' A', 'Current']}
                    labelFormatter={label => `Voltage: ${label} V`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name={`Current at ${temperature}K`}
                    stroke="#00796b"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Add data points or generate I-V curve to see characteristics
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PNJunctionSimulation;
