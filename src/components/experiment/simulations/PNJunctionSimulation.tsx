import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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
  spawnSide: 'p' | 'n';
  driftDirection: -1 | 1;
};

type DataPoint = {
  voltage: number;
  current: number;
  temperature: number;
  sourceVoltage: number;
};

type SceneGeometry = {
  width: number;
  height: number;
  centerX: number;
  pRegionEnd: number;
  nRegionStart: number;
  depletionWidth: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const snapTemperature = (value: number) => {
  const snapped = 300 + Math.round((value - 300) / 25) * 25;
  return clamp(snapped, 300, 400);
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const formatForwardCurrentMilliAmps = (valueA: number) => `${(valueA * 1e3).toFixed(3)} mA`;
const formatReverseCurrentMicroAmps = (valueA: number) => `${(valueA * 1e6).toFixed(3)} uA`;
const formatCurrentForSelectedVoltage = (valueA: number) =>
  Math.abs(valueA) >= 1e-3
    ? `${(valueA * 1e3).toFixed(3)} mA`
    : `${(valueA * 1e6).toFixed(3)} uA`;

const FORWARD_SERIES_RESISTANCE = 1000;
const FORWARD_IDEALITY = 1.5;
const FORWARD_SATURATION_CURRENT = 1e-12;
const BASE_THERMAL_VOLTAGE = 0.0258;

const createSceneGeometry = (width: number, height: number, voltage: number): SceneGeometry => {
  const baseDepletionWidth = 78;
  const depletionWidth =
    voltage >= 0
      ? Math.max(20, baseDepletionWidth - voltage * 62)
      : Math.min(width * 0.48, baseDepletionWidth + Math.abs(voltage) * 54);

  const centerX = width / 2;
  const pRegionEnd = centerX - depletionWidth / 2;
  const nRegionStart = centerX + depletionWidth / 2;

  return {
    width,
    height,
    centerX,
    pRegionEnd,
    nRegionStart,
    depletionWidth,
  };
};

const getCarrierSide = (x: number, centerX: number) => (x < centerX ? 'p' : 'n') as const;

const isMajorityCarrier = (carrier: Carrier, geometry: SceneGeometry) => {
  const side = getCarrierSide(carrier.x, geometry.centerX);
  return side === 'p' ? carrier.type === 'hole' : carrier.type === 'electron';
};

const isMinorityCarrier = (carrier: Carrier, geometry: SceneGeometry) => {
  return !isMajorityCarrier(carrier, geometry);
};

const getReverseMinorityDirection = (carrier: Carrier, centerX: number) => {
  const side = getCarrierSide(carrier.x, centerX);
  return side === 'p' ? 1 : -1;
};

const buildCarrier = (
  type: CarrierType,
  width: number,
  height: number,
  thermalScale: number,
  spawnSide?: 'p' | 'n',
): Carrier => {
  const preferredPBandEnd = width * 0.43;
  const preferredNBandStart = width * 0.57;
  const speed = 0.32 * thermalScale;
  const resolvedSide: 'p' | 'n' =
    spawnSide ?? (type === 'hole' ? (Math.random() < 0.8 ? 'p' : 'n') : Math.random() < 0.8 ? 'n' : 'p');

  const x = resolvedSide === 'p'
    ? randomBetween(28, preferredPBandEnd)
    : randomBetween(preferredNBandStart, width - 28);

  return {
    type,
    x,
    y: randomBetween(28, height - 28),
    vx: randomBetween(-speed, speed),
    vy: randomBetween(-speed, speed),
    spawnSide: resolvedSide,
    driftDirection: resolvedSide === 'p' ? 1 : -1,
  };
};

const respawnCarrier = (
  carrier: Carrier,
  width: number,
  height: number,
  thermalScale: number,
) => {
  const next = buildCarrier(carrier.type, width, height, thermalScale, carrier.spawnSide);
  carrier.x = next.x;
  carrier.y = next.y;
  carrier.vx = next.vx;
  carrier.vy = next.vy;
  carrier.spawnSide = next.spawnSide;
  carrier.driftDirection = next.driftDirection;
};

const PNJunctionScene = ({ voltage, temperature }: { voltage: number; temperature: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const carriersRef = useRef<Carrier[]>([]);
  const canvasSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const nextWidth = canvas.offsetWidth;
      const nextHeight = canvas.offsetHeight;
      const scale = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(nextWidth * scale));
      canvas.height = Math.max(1, Math.floor(nextHeight * scale));
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      canvasSizeRef.current = { width: nextWidth, height: nextHeight };
    };

    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    const thermalScale = 1 + (temperature - 300) / 100;
    const majorityPerSide = 16 + Math.round((temperature - 300) / 25) * 2;
    const minorityPerSide = 7 + Math.round((temperature - 300) / 25);
    const targetCount = majorityPerSide * 2 + minorityPerSide * 2;

    while (carriersRef.current.length < targetCount) {
      const index = carriersRef.current.length;
      const type: CarrierType =
        index < majorityPerSide
          ? 'hole'
          : index < majorityPerSide * 2
            ? 'electron'
            : index < majorityPerSide * 2 + minorityPerSide
              ? 'electron'
              : 'hole';
      carriersRef.current.push(buildCarrier(type, width, height, thermalScale));
    }

    if (carriersRef.current.length > targetCount) {
      carriersRef.current = carriersRef.current.slice(0, targetCount);
    }

    const animate = () => {
      const nextWidth = canvas.offsetWidth;
      const nextHeight = canvas.offsetHeight;
      if (
        nextWidth !== canvasSizeRef.current.width ||
        nextHeight !== canvasSizeRef.current.height
      ) {
        resizeCanvas();
      }

      const geometry = createSceneGeometry(canvas.offsetWidth, canvas.offsetHeight, voltage);
      const mobileFieldStrength = voltage >= 0 ? 1 - Math.min(voltage, 1.5) * 0.35 : 1 + Math.abs(voltage) * 1.1;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      ctx.fillStyle = 'rgba(74, 144, 226, 0.28)';
      ctx.fillRect(0, 0, geometry.pRegionEnd, canvas.offsetHeight);

      ctx.fillStyle = 'rgba(226, 74, 74, 0.28)';
      ctx.fillRect(geometry.nRegionStart, 0, canvas.offsetWidth - geometry.nRegionStart, canvas.offsetHeight);

      const depletionGradient = ctx.createLinearGradient(geometry.pRegionEnd, 0, geometry.nRegionStart, 0);
      depletionGradient.addColorStop(0, 'rgba(74, 144, 226, 0.18)');
      depletionGradient.addColorStop(0.5, 'rgba(235, 235, 235, 0.92)');
      depletionGradient.addColorStop(1, 'rgba(226, 74, 74, 0.18)');
      ctx.fillStyle = depletionGradient;
      ctx.fillRect(geometry.pRegionEnd, 0, geometry.depletionWidth, canvas.offsetHeight);

      ctx.strokeStyle = voltage > 0 ? '#0f766e' : voltage < 0 ? '#b91c1c' : '#6b7280';
      ctx.lineWidth = 2;
      const arrowDirection = voltage > 0 ? 1 : -1;
      const arrowLength = Math.min(Math.abs(voltage) * 36 + 18, 56);

      for (let y = 62; y < canvas.offsetHeight - 18; y += 54) {
        const startX = geometry.centerX - (arrowLength / 2) * arrowDirection;
        const endX = geometry.centerX + (arrowLength / 2) * arrowDirection;

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

      const ionSpacingX = 18;
      const ionSpacingY = 16;
      const ionRadius = 5;
      for (let x = geometry.pRegionEnd + 10; x < geometry.nRegionStart - 8; x += ionSpacingX) {
        for (let y = 28; y < canvas.offsetHeight - 20; y += ionSpacingY) {
          const onPSide = x < geometry.centerX;
          ctx.beginPath();
          ctx.arc(x, y, ionRadius, 0, Math.PI * 2);
          ctx.fillStyle = onPSide ? 'rgba(29, 78, 216, 0.12)' : 'rgba(185, 28, 28, 0.12)';
          ctx.fill();
          ctx.strokeStyle = onPSide ? 'rgba(37, 99, 235, 0.32)' : 'rgba(220, 38, 38, 0.32)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = onPSide ? '#1d4ed8' : '#b91c1c';
          ctx.fillText(onPSide ? '-' : '+', x, y + 0.3);
        }
      }

      carriersRef.current.forEach(carrier => {
        const side = getCarrierSide(carrier.x, geometry.centerX);
        const majority = isMajorityCarrier(carrier, geometry);
        const minority = !majority;
        const towardJunction = side === 'p' ? 1 : -1;
        const awayFromJunction = -towardJunction;
        const junctionProximity =
          1 - clamp(Math.abs(carrier.x - geometry.centerX) / (geometry.depletionWidth * 0.72), 0, 1);
        const thermalWiggle = randomBetween(-0.018, 0.018) * thermalScale;
        const biasPolarity = voltage >= 0 ? 1 : -1;
        const fieldDirection = carrier.driftDirection * biasPolarity;
        const crossingBoost = (0.09 + Math.abs(voltage) * 0.18) * (0.7 + junctionProximity * 0.9);
        const minorityBoost = minority ? (0.04 + Math.abs(voltage) * 0.05) * (0.5 + junctionProximity) : 0;
        const repulsionBoost =
          voltage < 0 && majority ? (0.08 + Math.abs(voltage) * 0.14) * (0.5 + junctionProximity) : 0;

        carrier.vx += fieldDirection * crossingBoost * mobileFieldStrength;
        carrier.vx += carrier.driftDirection * minorityBoost;
        carrier.vx += awayFromJunction * repulsionBoost;
        carrier.vx += thermalWiggle;
        carrier.vy += randomBetween(-0.02, 0.02) * thermalScale;

        if (voltage > 0 && majority && junctionProximity > 0.15) {
          carrier.vx += carrier.driftDirection * (0.12 + voltage * 0.22) * junctionProximity;
        }
        if (voltage > 0 && minority) {
          carrier.vx += carrier.driftDirection * (0.06 + voltage * 0.08) * junctionProximity;
        }
        if (voltage < 0 && minority) {
          const reverseSweepDirection = getReverseMinorityDirection(carrier, geometry.centerX);
          const crossingStrength = (0.18 + Math.abs(voltage) * 0.32) * (0.55 + junctionProximity);
          carrier.vx += reverseSweepDirection * crossingStrength;
          carrier.vx += reverseSweepDirection * (0.08 + Math.abs(voltage) * 0.1) * junctionProximity;
          if (junctionProximity > 0.08) {
            carrier.vx += reverseSweepDirection * 0.12 * (1 + Math.abs(voltage));
          }
        }

        carrier.vx *= 0.985;
        carrier.vy *= 0.985;

        carrier.x += carrier.vx;
        carrier.y += carrier.vy;

        if (carrier.y < 24) {
          carrier.y = 24;
          carrier.vy *= -1;
        }
        if (carrier.y > canvas.offsetHeight - 24) {
          carrier.y = canvas.offsetHeight - 24;
          carrier.vy *= -1;
        }

        const leftExit = carrier.x < -20;
        const rightExit = carrier.x > canvas.offsetWidth + 20;

        if (leftExit || rightExit) {
          respawnCarrier(carrier, canvas.offsetWidth, canvas.offsetHeight, thermalScale);
          if (voltage < 0 && minority) {
            const oppositeSide: 'p' | 'n' = carrier.spawnSide === 'p' ? 'n' : 'p';
            const next = buildCarrier(carrier.type, canvas.offsetWidth, canvas.offsetHeight, thermalScale, oppositeSide);
            carrier.x = next.x;
            carrier.y = next.y;
            carrier.vx = next.vx;
            carrier.vy = next.vy;
            carrier.spawnSide = next.spawnSide;
            carrier.driftDirection = next.driftDirection;
          }
        }

        const renderMinority = isMinorityCarrier(carrier, geometry);
        const isElectron = carrier.type === 'electron';
        const radius = renderMinority ? 3.7 : 5.2;

        ctx.beginPath();
        ctx.arc(carrier.x, carrier.y, radius, 0, Math.PI * 2);

        if (isElectron) {
          ctx.fillStyle = renderMinority ? 'rgba(17, 24, 39, 0.58)' : '#1f2937';
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(carrier.x - radius * 0.6, carrier.y);
          ctx.lineTo(carrier.x + radius * 0.6, carrier.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = renderMinority ? 1.4 : 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = renderMinority ? 'rgba(255, 255, 255, 0.72)' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = 'rgba(31, 41, 55, 0.88)';
          ctx.lineWidth = renderMinority ? 0.9 : 1.1;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(carrier.x - radius * 0.6, carrier.y);
          ctx.lineTo(carrier.x + radius * 0.6, carrier.y);
          ctx.moveTo(carrier.x, carrier.y - radius * 0.6);
          ctx.lineTo(carrier.x, carrier.y + radius * 0.6);
          ctx.strokeStyle = 'rgba(31, 41, 55, 0.94)';
          ctx.lineWidth = renderMinority ? 1.5 : 2;
          ctx.stroke();
        }

        if (renderMinority) {
          ctx.beginPath();
          ctx.arc(carrier.x, carrier.y, radius + 2.4, 0, Math.PI * 2);
          ctx.strokeStyle = isElectron ? 'rgba(59, 130, 246, 0.3)' : 'rgba(249, 115, 22, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText('P-type', 18, 28);
      ctx.fillStyle = '#991b1b';
      ctx.fillText('N-type', canvas.offsetWidth - 75, 28);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('Depletion region with fixed ions', geometry.centerX - 78, canvas.offsetHeight - 10);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
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
          Minority carriers appear on both sides and are dimmer
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

  const solveForwardBiasPoint = (sourceVoltage: number, t: number) => {
    const thermalVoltage = BASE_THERMAL_VOLTAGE * (t / 300);
    let diodeVoltage = Math.min(sourceVoltage, 0.8);

    for (let iteration = 0; iteration < 50; iteration += 1) {
      const exponentialTerm = Math.exp(diodeVoltage / (FORWARD_IDEALITY * thermalVoltage));
      const diodeCurrent = FORWARD_SATURATION_CURRENT * (exponentialTerm - 1);
      const equationValue = diodeVoltage + diodeCurrent * FORWARD_SERIES_RESISTANCE - sourceVoltage;
      const derivative =
        1 +
        FORWARD_SERIES_RESISTANCE *
          (FORWARD_SATURATION_CURRENT / (FORWARD_IDEALITY * thermalVoltage)) *
          exponentialTerm;
      const nextVoltage = diodeVoltage - equationValue / derivative;

      if (Math.abs(nextVoltage - diodeVoltage) < 1e-9) {
        diodeVoltage = nextVoltage;
        break;
      }

      diodeVoltage = clamp(nextVoltage, 0, sourceVoltage);
    }

    const diodeCurrent =
      FORWARD_SATURATION_CURRENT * (Math.exp(diodeVoltage / (FORWARD_IDEALITY * thermalVoltage)) - 1);

    return {
      diodeVoltage,
      diodeCurrent,
    };
  };

  const calculateCurrent = (v: number, t: number) => {
    if (v >= 0) {
      return solveForwardBiasPoint(v, t).diodeCurrent;
    }

    const reverseVoltage = Math.abs(v);
    const temperatureRatio = t / 300;

    const leakageMagnitude =
      4e-8 *
      Math.pow(temperatureRatio, 3.4) *
      Math.exp((t - 300) / 42) *
      (1 + 1.8 * Math.pow(reverseVoltage / 0.6, 1.2));

    const curvatureFactor =
      1 +
      (0.55 + 0.003 * (t - 300)) *
        Math.pow(reverseVoltage / 0.6, 1.4) *
        (1 + 0.5 * (temperatureRatio - 1));

    const preBreakdownCurrent = -leakageMagnitude * curvatureFactor;

    const breakdownVoltage = clamp(0.42 - 0.0007 * (t - 300), 0.3, 0.44);

    if (reverseVoltage <= breakdownVoltage) {
      return preBreakdownCurrent;
    }

    const breakdownDistance = reverseVoltage - breakdownVoltage;
    const breakdownExcess =
      2.8e-7 *
      Math.exp(breakdownDistance * (9.5 + 0.02 * (t - 300))) *
      (1 + 0.8 * (temperatureRatio - 1));

    return preBreakdownCurrent - breakdownExcess;
  };

  const plottedOnceRef = useRef(false);

  const resetPlots = () => {
    setForwardData([]);
    setReverseData([]);
    plottedOnceRef.current = false;
  };

  useEffect(() => {
    if (plottedOnceRef.current) {
      generateCurves();
    }
    // Intentionally replot existing data when temperature changes so the curve updates live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temperature]);

  const currentValue = calculateCurrent(voltage, temperature);
  const forwardOperatingPoint = voltage >= 0 ? solveForwardBiasPoint(voltage, temperature) : null;

  const addDataPoint = () => {
    if (voltage >= 0) {
      if (!forwardOperatingPoint) return;

      const newPoint: DataPoint = {
        sourceVoltage: Number(voltage.toFixed(2)),
        voltage: Number(forwardOperatingPoint.diodeVoltage.toFixed(4)),
        current: forwardOperatingPoint.diodeCurrent,
        temperature,
      };

      setForwardData(prevData => {
        const filtered = prevData.filter(
          point =>
            !(
              Math.abs(point.sourceVoltage - newPoint.sourceVoltage) < 0.01 &&
              point.temperature === newPoint.temperature
            ),
        );
        return [...filtered, newPoint].sort((a, b) => a.voltage - b.voltage);
      });
      return;
    }

    const newPoint: DataPoint = {
      sourceVoltage: Number(voltage.toFixed(2)),
      voltage: Number(voltage.toFixed(2)),
      current: currentValue,
      temperature,
    };

    setReverseData(prevData => {
      const filtered = prevData.filter(
        point =>
          !(
            Math.abs(point.sourceVoltage - newPoint.sourceVoltage) < 0.01 &&
            point.temperature === newPoint.temperature
          ),
      );
      return [...filtered, newPoint].sort((a, b) => a.voltage - b.voltage);
    });
  };

  const generateCurves = useCallback(() => {
    const nextForward: DataPoint[] = [];
    const nextReverse: DataPoint[] = [];

    for (let sourceVoltage = 0; sourceVoltage <= 1.5; sourceVoltage += 0.05) {
      const roundedSourceVoltage = Number(sourceVoltage.toFixed(2));
      const operatingPoint = solveForwardBiasPoint(roundedSourceVoltage, temperature);
      nextForward.push({
        sourceVoltage: roundedSourceVoltage,
        voltage: Number(operatingPoint.diodeVoltage.toFixed(4)),
        current: operatingPoint.diodeCurrent,
        temperature,
      });
    }

    for (let v = -0.6; v <= 0; v += 0.1) {
      const roundedVoltage = Number(v.toFixed(2));
      nextReverse.push({
        sourceVoltage: roundedVoltage,
        voltage: roundedVoltage,
        current: calculateCurrent(roundedVoltage, temperature),
        temperature,
      });
    }

    setForwardData(nextForward);
    setReverseData(nextReverse);
    plottedOnceRef.current = true;
  }, [temperature]);

  const liveTableData = [...reverseData, ...forwardData].sort((a, b) => a.voltage - b.voltage);

  const forwardBiasChartData = forwardData
    .map(point => ({
      diodeVoltage: point.voltage,
      currentMilliAmps: point.current * 1e3,
      sourceVoltage: point.sourceVoltage,
      temperature: point.temperature,
    }))
    .sort((a, b) => a.diodeVoltage - b.diodeVoltage);

  const forwardYMaxMilliAmps =
    forwardBiasChartData.length > 0
      ? Math.max(...forwardBiasChartData.map(point => point.currentMilliAmps), 0.001)
      : 0.001;

  const reverseBiasChartData = reverseData
    .map(point => ({
      reverseVoltage: Math.abs(point.voltage),
      reverseCurrentMicroamps: point.current * 1e6,
      actualVoltage: point.voltage,
      actualCurrent: point.current,
      temperature: point.temperature,
    }))
    .sort((a, b) => a.reverseVoltage - b.reverseVoltage);

  const reverseYMinMicroAmps =
    reverseBiasChartData.length > 0
      ? Math.min(...reverseBiasChartData.map(point => point.reverseCurrentMicroamps), 0)
      : -1;

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
                  max={1.5}
                  step={0.01}
                  value={[voltage]}
                  onValueChange={values => setVoltage(values[0] ?? 0)}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={-0.6}
                  max={1.5}
                  step={0.01}
                  value={voltage.toFixed(2)}
                  onChange={event => {
                    const nextValue = parseFloat(event.target.value);
                    if (!Number.isNaN(nextValue)) {
                      setVoltage(clamp(nextValue, -0.6, 1.5));
                    }
                  }}
                  className="w-24 rounded border px-2 py-1 text-right text-sm"
                />
              </div>
              <div className="text-xs text-gray-500">
                Reverse bias is shown on the left graph and forward bias is shown on the right
                graph. Forward bias uses a 1 kOhm series resistor and Newton-Raphson solving.
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
                <div className="text-2xl font-bold text-lab-teal">
                  {formatCurrentForSelectedVoltage(currentValue)}
                </div>
                {forwardOperatingPoint ? (
                  <div className="mt-1 text-xs text-gray-500">
                    Forward diode voltage: {forwardOperatingPoint.diodeVoltage.toFixed(4)} V
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-gray-500">
                    Reverse current is displayed in uA
                  </div>
                )}
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
                <LineChart
                  data={reverseBiasChartData}
                  margin={{ top: 28, right: 20, bottom: 40, left: 42 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <ReferenceLine
                    x={0.4}
                    stroke="#b91c1c"
                    strokeDasharray="6 4"
                    label={{ value: 'Breakdown ~ -0.4 V', position: 'top', fill: '#b91c1c', fontSize: 12 }}
                  />
                  <XAxis
                    type="number"
                    dataKey="reverseVoltage"
                    domain={[0, 0.6]}
                    ticks={[0, 0.2, 0.4, 0.6]}
                    tickFormatter={value => (value === 0 ? '0' : `-${Number(value).toFixed(1)}`)}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                    height={48}
                    label={{ value: 'Reverse Voltage (V)', position: 'insideBottom', offset: -12 }}
                  />
                  <YAxis
                    type="number"
                    domain={[reverseYMinMicroAmps, 0]}
                    width={94}
                    tickMargin={10}
                    tickFormatter={value => `${Number(value).toFixed(2)} uA`}
                    label={{ value: 'Reverse Current (uA)', angle: -90, position: 'insideLeft', offset: -10 }}
                  />
                  <Tooltip
                    formatter={(_, __, item) => [
                      formatReverseCurrentMicroAmps(item.payload.actualCurrent),
                      'Current',
                    ]}
                    labelFormatter={label =>
                      `Reverse Voltage: ${label === 0 ? '0.00' : `-${Number(label).toFixed(2)}`} V`
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="reverseCurrentMicroamps"
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
            {forwardBiasChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forwardBiasChartData} margin={{ top: 16, right: 12, bottom: 28, left: 34 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <ReferenceLine
                    x={0.7}
                    stroke="#00796b"
                    strokeDasharray="6 4"
                    label={{ value: 'Cut-in ~ 0.7 V', position: 'top', fill: '#00796b', fontSize: 12 }}
                  />
                  <XAxis
                    type="number"
                    dataKey="diodeVoltage"
                    domain={[0, 1]}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                    label={{ value: 'Diode Voltage (V)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, forwardYMaxMilliAmps]}
                    width={94}
                    tickMargin={10}
                    tickFormatter={value => `${Number(value).toFixed(3)} mA`}
                    label={{ value: 'Forward Current (mA)', angle: -90, position: 'insideLeft', offset: -10 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatForwardCurrentMilliAmps(value / 1e3), 'Current']}
                    labelFormatter={label => `Diode Voltage: ${Number(label).toFixed(4)} V`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="currentMilliAmps"
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
          <h3 className="mb-4 text-lg font-semibold text-lab-blue">Live Observation Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border px-3 py-2">Bias Type</th>
                  <th className="border px-3 py-2">Temperature (K)</th>
                  <th className="border px-3 py-2">Input Voltage (V)</th>
                  <th className="border px-3 py-2">Plotted Voltage (V)</th>
                  <th className="border px-3 py-2">Current</th>
                </tr>
              </thead>
              <tbody>
                {liveTableData.length > 0 ? (
                  liveTableData.map((row, index) => (
                    <tr key={`${row.temperature}-${row.voltage}-${index}`}>
                      <td className="border px-3 py-2">{row.voltage < 0 ? 'Reverse' : 'Forward'}</td>
                      <td className="border px-3 py-2">{row.temperature}</td>
                      <td className="border px-3 py-2">{row.sourceVoltage.toFixed(2)}</td>
                      <td className="border px-3 py-2">{row.voltage.toFixed(2)}</td>
                      <td className="border px-3 py-2">
                        {row.voltage < 0
                          ? formatReverseCurrentMicroAmps(row.current)
                          : formatForwardCurrentMilliAmps(row.current)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border px-3 py-3 text-gray-500" colSpan={5}>
                      Add a point or plot a graph to fill this live table.
                    </td>
                  </tr>
                )}
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
