import React, { useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type CarrierType = 'hole' | 'electron';

type Carrier = {
  type: CarrierType;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type DataPoint = {
  voltage: number;
  current: number;
  temperature: number;
};

type ReverseBiasPoint = {
  plotVoltage: number;
  plotCurrent: number;
  actualVoltage: number;
  actualCurrent: number;
  temperature: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const snapTemperature = (value: number) => {
  const snapped = 300 + Math.round((value - 300) / 25) * 25;
  return clamp(snapped, 300, 400);
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const formatCurrent = (value: number) => `${value.toExponential(4)} A`;

const buildCarrier = (
  type: CarrierType,
  width: number,
  height: number,
  thermalScale: number,
): Carrier => {
  const leftBandEnd = width * 0.42;
  const rightBandStart = width * 0.58;
  const speed = 0.35 * thermalScale;

  return {
    type,
    x:
      type === 'hole'
        ? randomBetween(35, leftBandEnd)
        : randomBetween(rightBandStart, width - 35),
    y: randomBetween(35, height - 35),
    vx: randomBetween(-speed, speed),
    vy: randomBetween(-speed, speed),
  };
};

const toReverseBiasPlotPoint = (point: DataPoint): ReverseBiasPoint => ({
  plotVoltage: Math.abs(point.voltage),
  plotCurrent: Math.abs(point.current),
  actualVoltage: point.voltage,
  actualCurrent: point.current,
  temperature: point.temperature,
});

const PNJunctionScene = ({ voltage, temperature }: { voltage: number; temperature: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const carriersRef = useRef<Carrier[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const thermalScale = 1 + (temperature - 300) / 100;
    const carriersPerSide = 18 + Math.round((temperature - 300) / 25) * 3;
    const targetCount = carriersPerSide * 2;
    const holeCount = carriersRef.current.filter(carrier => carrier.type === 'hole').length;

    while (carriersRef.current.length < targetCount) {
      const type: CarrierType = carriersRef.current.length - holeCount < carriersPerSide ? 'hole' : 'electron';
      carriersRef.current.push(buildCarrier(type, canvas.width, canvas.height, thermalScale));
    }

    if (carriersRef.current.length > targetCount) {
      carriersRef.current = carriersRef.current.slice(0, targetCount);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const baseDepletionWidth = 70;
      const depletionWidth =
        voltage >= 0
          ? Math.max(14, baseDepletionWidth - voltage * 55)
          : baseDepletionWidth + Math.abs(voltage) * 45;

      const centerX = canvas.width / 2;
      const pRegionEnd = centerX - depletionWidth / 2;
      const nRegionStart = centerX + depletionWidth / 2;

      ctx.fillStyle = 'rgba(74, 144, 226, 0.72)';
      ctx.fillRect(0, 0, pRegionEnd, canvas.height);

      ctx.fillStyle = 'rgba(226, 74, 74, 0.72)';
      ctx.fillRect(nRegionStart, 0, canvas.width - nRegionStart, canvas.height);

      const gradient = ctx.createLinearGradient(pRegionEnd, 0, nRegionStart, 0);
      gradient.addColorStop(0, 'rgba(74, 144, 226, 0.25)');
      gradient.addColorStop(0.5, 'rgba(210, 210, 210, 0.6)');
      gradient.addColorStop(1, 'rgba(226, 74, 74, 0.25)');
      ctx.fillStyle = gradient;
      ctx.fillRect(pRegionEnd, 0, depletionWidth, canvas.height);

      ctx.strokeStyle = voltage > 0 ? '#15803d' : voltage < 0 ? '#b91c1c' : '#6b7280';
      ctx.lineWidth = 2;
      const arrowDirection = voltage > 0 ? 1 : -1;
      const arrowLength = Math.min(Math.abs(voltage) * 34 + 18, 52);

      for (let y = 70; y < canvas.height - 20; y += 54) {
        const startX = centerX - (arrowLength / 2) * arrowDirection;
        const endX = centerX + (arrowLength / 2) * arrowDirection;

        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(endX, y);
        ctx.lineTo(endX - 8 * arrowDirection, y - 5);
        ctx.lineTo(endX - 8 * arrowDirection, y + 5);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }

      carriersRef.current.forEach(carrier => {
        const thermalBoost = 0.004 * (temperature - 300);
        carrier.vx += randomBetween(-0.02, 0.02) * thermalScale;
        carrier.vy += randomBetween(-0.02, 0.02) * thermalScale;

        if (voltage > 0) {
          if (carrier.type === 'hole') {
            carrier.vx += voltage * 0.028 + thermalBoost * 0.2;
          } else {
            carrier.vx -= voltage * 0.028 + thermalBoost * 0.2;
          }
        } else if (voltage < 0) {
          if (carrier.type === 'hole') {
            carrier.vx -= Math.abs(voltage) * 0.022 + thermalBoost * 0.15;
          } else {
            carrier.vx += Math.abs(voltage) * 0.022 + thermalBoost * 0.15;
          }
        }

        carrier.vx *= 0.982;
        carrier.vy *= 0.982;

        carrier.x += carrier.vx;
        carrier.y += carrier.vy;

        if (carrier.type === 'hole') {
          if (carrier.x > canvas.width) {
            Object.assign(carrier, buildCarrier('hole', canvas.width, canvas.height, thermalScale));
          }
          if (carrier.x < 0) {
            carrier.x = randomBetween(35, canvas.width * 0.42);
            carrier.vx = randomBetween(-0.4, 0.4) * thermalScale;
          }
        } else if (carrier.x < 0 || carrier.x > canvas.width) {
          Object.assign(carrier, buildCarrier('electron', canvas.width, canvas.height, thermalScale));
        }

        if (carrier.y < 28) {
          carrier.y = 28;
          carrier.vy *= -1;
        }
        if (carrier.y > canvas.height - 28) {
          carrier.y = canvas.height - 28;
          carrier.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(carrier.x, carrier.y, 5, 0, Math.PI * 2);
        if (carrier.type === 'hole') {
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(carrier.x - 3, carrier.y);
          ctx.lineTo(carrier.x + 3, carrier.y);
          ctx.moveTo(carrier.x, carrier.y - 3);
          ctx.lineTo(carrier.x, carrier.y + 3);
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#1f2937';
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(carrier.x - 3, carrier.y);
          ctx.lineTo(carrier.x + 3, carrier.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText('P-type', 18, 28);
      ctx.fillStyle = '#991b1b';
      ctx.fillText('N-type', canvas.width - 75, 28);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('Depletion Region', centerX - 58, canvas.height - 10);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [temperature, voltage]);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" style={{ width: '100%', height: '100%' }} />
      <div className="absolute left-2 top-2 rounded bg-white/90 px-3 py-2 text-sm shadow">
        <div className="font-semibold">
          {voltage < -0.05 ? 'Reverse Bias' : voltage > 0.05 ? 'Forward Bias' : 'No Bias'}
        </div>
        <div className="mt-1 text-xs text-gray-600">
          V = {voltage.toFixed(2)} V | T = {temperature} K
        </div>
        <div className="mt-1 text-xs text-gray-600">
          Carrier density increases with temperature
        </div>
      </div>
    </div>
  );
};

const PNJunctionSimulation = () => {
  const [voltage, setVoltage] = useState(0);
  const [temperature, setTemperature] = useState(300);
  const [forwardData, setForwardData] = useState<DataPoint[]>([]);
  const [reverseData, setReverseData] = useState<DataPoint[]>([]);

  const calculateCurrent = (v: number, t: number) => {
    const kB = 1.380649e-23;
    const q = 1.60217663e-19;
    const n = 1.5;
    const bandgapEnergy = 1.1;
    const thermalVoltage = (kB * t) / q;
    const saturationCurrent =
      1e-12 * Math.pow(t / 300, 3) * Math.exp((-bandgapEnergy * q) / (n * kB * t));

    if (v >= 0) {
      return saturationCurrent * (Math.exp(v / (n * thermalVoltage)) - 1);
    }

    return -saturationCurrent * (1 - Math.exp(v / (n * thermalVoltage)));
  };

  const resetPlots = () => {
    setForwardData([]);
    setReverseData([]);
  };

  useEffect(() => {
    resetPlots();
  }, [temperature]);

  const currentValue = calculateCurrent(voltage, temperature);

  const addDataPoint = () => {
    const newPoint: DataPoint = {
      voltage: Number(voltage.toFixed(2)),
      current: currentValue,
      temperature,
    };

    if (voltage >= 0) {
      setForwardData(prevData => {
        const filtered = prevData.filter(
          point =>
            !(
              Math.abs(point.voltage - newPoint.voltage) < 0.01 &&
              point.temperature === newPoint.temperature
            ),
        );
        return [...filtered, newPoint].sort((a, b) => a.voltage - b.voltage);
      });
      return;
    }

    setReverseData(prevData => {
      const filtered = prevData.filter(
        point =>
          !(
            Math.abs(point.voltage - newPoint.voltage) < 0.01 &&
            point.temperature === newPoint.temperature
          ),
      );
      return [...filtered, newPoint].sort((a, b) => a.voltage - b.voltage);
    });
  };

  const generateCurves = () => {
    const nextForward: DataPoint[] = [];
    const nextReverse: DataPoint[] = [];

    for (let v = 0; v <= 0.8; v += 0.1) {
      const roundedVoltage = Number(v.toFixed(2));
      nextForward.push({
        voltage: roundedVoltage,
        current: calculateCurrent(roundedVoltage, temperature),
        temperature,
      });
    }

    for (let v = -0.6; v <= 0; v += 0.1) {
      const roundedVoltage = Number(v.toFixed(2));
      nextReverse.push({
        voltage: roundedVoltage,
        current: calculateCurrent(roundedVoltage, temperature),
        temperature,
      });
    }

    setForwardData(nextForward);
    setReverseData(nextReverse);
  };

  const comparisonTable = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map(value => ({
    voltage: value,
    current350: calculateCurrent(value, 350),
    current400: calculateCurrent(value, 400),
  }));

  const reverseBiasChartData = reverseData.map(toReverseBiasPlotPoint).sort(
    (a, b) => a.plotVoltage - b.plotVoltage,
  );

  const reverseVoltageTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="control-panel rounded-lg border bg-white p-4 shadow-sm">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Applied Voltage (V)</label>
              <div className="flex items-center space-x-2">
                <Slider
                  min={-0.6}
                  max={0.8}
                  step={0.01}
                  value={[voltage]}
                  onValueChange={values => setVoltage(values[0] ?? 0)}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={-0.6}
                  max={0.8}
                  step={0.01}
                  value={voltage.toFixed(2)}
                  onChange={event => {
                    const nextValue = parseFloat(event.target.value);
                    if (!Number.isNaN(nextValue)) {
                      setVoltage(clamp(nextValue, -0.6, 0.8));
                    }
                  }}
                  className="w-24 rounded border px-2 py-1 text-right text-sm"
                />
              </div>
              <div className="text-xs text-gray-500">
                Reverse bias is shown on the left graph and forward bias is shown on the right
                graph.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature (K)</label>
              <div className="flex items-center space-x-2">
                <Slider
                  min={300}
                  max={400}
                  step={25}
                  value={[temperature]}
                  onValueChange={values => setTemperature(values[0] ?? 300)}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={300}
                  max={400}
                  step={25}
                  value={temperature}
                  onChange={event => {
                    const nextValue = parseInt(event.target.value, 10);
                    if (!Number.isNaN(nextValue)) {
                      setTemperature(snapTemperature(nextValue));
                    }
                  }}
                  className="w-24 rounded border px-2 py-1 text-right text-sm"
                />
              </div>
              <div className="text-xs text-gray-500">
                Allowed values: 300 K, 325 K, 350 K, 375 K, 400 K. Changing temperature resets
                the existing plots.
              </div>
            </div>

            <div className="rounded-md bg-gray-50 p-3">
              <div className="text-center">
                <div className="mb-1 text-sm text-gray-500">Calculated Current for Selected Voltage</div>
                <div className="text-2xl font-bold text-lab-teal">{formatCurrent(currentValue)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button onClick={addDataPoint} className="w-full">
                Add Current
              </Button>
              <Button onClick={generateCurves} variant="outline" className="w-full">
                Plot Graph
              </Button>
              <Button onClick={resetPlots} variant="outline" className="w-full">
                Reset Graph
              </Button>
            </div>
          </div>
        </div>

        <div className="data-panel rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">PN Junction Visualization</h3>
          <div className="h-80 rounded-md border bg-gray-100">
            <PNJunctionScene voltage={voltage} temperature={temperature} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="data-panel rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Reverse Bias I-V Graph</h3>
          <div className="h-72">
            {reverseBiasChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reverseBiasChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="plotVoltage"
                    domain={[0, 0.6]}
                    ticks={reverseVoltageTicks}
                    tickFormatter={value => (value === 0 ? '0' : `-${Number(value).toFixed(1)}`)}
                    label={{ value: 'Reverse Voltage (V)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="plotCurrent"
                    domain={[0, 'auto']}
                    tickFormatter={value => (value === 0 ? '0' : `-${Number(value).toExponential(1)}`)}
                    label={{ value: 'Reverse Current (A)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(_, __, item) => [formatCurrent(item.payload.actualCurrent), 'Current']}
                    labelFormatter={label => `Voltage: ${label === 0 ? '0.00' : `-${Number(label).toFixed(2)}`} V`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="plotCurrent"
                    name={`Reverse Bias at ${temperature} K`}
                    stroke="#b91c1c"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Plot reverse-bias points to see the graph from 0 toward negative voltage.
              </div>
            )}
          </div>
        </div>

        <div className="data-panel rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Forward Bias I-V Graph</h3>
          <div className="h-72">
            {forwardData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forwardData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="voltage"
                    domain={[0, 0.8]}
                    label={{ value: 'Forward Voltage (V)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 'auto']}
                    label={{ value: 'Forward Current (A)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrent(value), 'Current']}
                    labelFormatter={label => `Voltage: ${Number(label).toFixed(2)} V`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name={`Forward Bias at ${temperature} K`}
                    stroke="#00796b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Plot forward-bias points to see the first-quadrant graph.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">
            Forward Bias Reference Table at 350 K and 400 K
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border px-3 py-2">Voltage (V)</th>
                  <th className="border px-3 py-2">Current at 350 K (A)</th>
                  <th className="border px-3 py-2">Current at 400 K (A)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map(row => (
                  <tr key={row.voltage}>
                    <td className="border px-3 py-2">{row.voltage.toFixed(1)}</td>
                    <td className="border px-3 py-2">{row.current350.toExponential(4)}</td>
                    <td className="border px-3 py-2">{row.current400.toExponential(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-amber-50 p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold text-amber-900">Student Exercise</h3>
          <p className="text-sm leading-6 text-amber-950">
            Using the forward-bias table and the simulation, plot the forward-bias I-V graph at
            different temperatures from 300 K to 400 K. Compare each curve with the room
            temperature result at 300 K, and discuss how the PN junction performance changes as the
            temperature increases.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PNJunctionSimulation;
