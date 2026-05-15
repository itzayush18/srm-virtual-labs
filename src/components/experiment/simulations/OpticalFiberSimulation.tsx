import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Activity,
  Gauge,
  Power,
  Waves,
  Zap,
  Cable,
  CircleDot,
  BarChart3,
} from 'lucide-react';

const WAVELENGTH_NM = 650;
const FIBER_LENGTH_OPTIONS = [1, 5, 10, 20, 50, 100];
const MAX_NA_READINGS = 5;
const REFERENCE_LENGTH_M = 1;

const FIBER_TYPES = {
  singleMode: {
    label: 'Single-mode Fiber',
    shortLabel: 'SMF',
    defaultCoreIndex: 1.46,
    defaultCladdingIndex: 1.455,
    intrinsicLossDbPerKm: 2.6,
    connectorLossDb: 0.12,
    bendSensitivity: 0.55,
    launchEfficiency: 0.88,
    beamSpreadFactor: 0.72,
    color: 'from-cyan-500 to-sky-600',
  },
  multimodeStep: {
    label: 'Multimode Step-index Fiber',
    shortLabel: 'MM Step-index',
    defaultCoreIndex: 1.48,
    defaultCladdingIndex: 1.46,
    intrinsicLossDbPerKm: 6.8,
    connectorLossDb: 0.2,
    bendSensitivity: 0.95,
    launchEfficiency: 1.02,
    beamSpreadFactor: 1.12,
    color: 'from-amber-500 to-orange-600',
  },
};

const createLengthValueMap = (initialValue = null) =>
  FIBER_LENGTH_OPTIONS.reduce((acc, length) => {
    acc[String(length)] = initialValue;
    return acc;
  }, {});

const createMeasurements = () =>
  Object.keys(FIBER_TYPES).reduce((acc, fiberType) => {
    acc[fiberType] = {
      low: createLengthValueMap(),
      high: createLengthValueMap(),
    };
    return acc;
  }, {});

const createNaReadings = () =>
  Object.keys(FIBER_TYPES).reduce((acc, fiberType) => {
    acc[fiberType] = FIBER_LENGTH_OPTIONS.reduce((lengthAcc, length) => {
      lengthAcc[String(length)] = [];
      return lengthAcc;
    }, {});
    return acc;
  }, {});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatReading = (value, digits = 4, suffix = '') =>
  value !== null && value !== undefined ? `${value.toFixed(digits)}${suffix}` : '-';

const OpticalFiberLab = () => {
  const [activeExperiment, setActiveExperiment] = useState('attenuation');
  const [isLaserOn, setIsLaserOn] = useState(false);
  const [laserPower, setLaserPower] = useState(35);
  const [fiberType, setFiberType] = useState('multimodeStep');
  const [coreIndex, setCoreIndex] = useState(FIBER_TYPES.multimodeStep.defaultCoreIndex);
  const [claddingIndex, setCladdingIndex] = useState(FIBER_TYPES.multimodeStep.defaultCladdingIndex);
  const [connectorPairs, setConnectorPairs] = useState(2);
  const [bendCount, setBendCount] = useState(1);
  const [cableLength, setCableLength] = useState(1);
  const [measurements, setMeasurements] = useState(createMeasurements());
  const [naCableLength, setNaCableLength] = useState(1);
  const [naDistance, setNaDistance] = useState(40);
  const [naReadings, setNaReadings] = useState(createNaReadings());
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const fiberConfig = FIBER_TYPES[fiberType];
  const powerBand = laserPower <= 50 ? 'low' : 'high';
  const powerBandLabel = powerBand === 'low' ? 'Low' : 'High';

  const maxAllowedCladding = Number((coreIndex - 0.001).toFixed(3));
  const safeCladdingIndex = clamp(claddingIndex, 1.44, maxAllowedCladding);

  const theoreticalNa = Math.sqrt(
    Math.max(coreIndex * coreIndex - safeCladdingIndex * safeCladdingIndex, 0)
  );
  const acceptanceHalfAngleDeg = (Math.asin(Math.min(theoreticalNa, 0.9999)) * 180) / Math.PI;
  const acceptanceConeAngleDeg = acceptanceHalfAngleDeg * 2;

  const applyFiberPreset = (nextFiberType) => {
    const preset = FIBER_TYPES[nextFiberType];
    setFiberType(nextFiberType);
    setCoreIndex(preset.defaultCoreIndex);
    setCladdingIndex(preset.defaultCladdingIndex);
  };

  const getLaunchPowerMw = (band, selectedFiberType) => {
    const config = FIBER_TYPES[selectedFiberType];
    const normalizedSlider = 0.45 + laserPower / 100;
    const bandFactor = band === 'low' ? 0.82 : 1.18;
    return 1.2 * normalizedSlider * bandFactor * config.launchEfficiency;
  };

  const getConnectorLossDb = (selectedFiberType) =>
    FIBER_TYPES[selectedFiberType].connectorLossDb * connectorPairs;

  const getBendLossDb = (length, selectedFiberType) => {
    const config = FIBER_TYPES[selectedFiberType];
    const lengthFactor = 0.18 + length / 120;
    return bendCount * config.bendSensitivity * lengthFactor;
  };

  const getTotalLossDb = (band, length, selectedFiberType) => {
    const config = FIBER_TYPES[selectedFiberType];
    const intrinsicLoss = config.intrinsicLossDbPerKm * (length / 1000);
    const connectorLoss = getConnectorLossDb(selectedFiberType);
    const bendLoss = getBendLossDb(length, selectedFiberType);
    const powerPenalty = band === 'high' ? 0.12 + length / 900 : 0.04 + length / 1500;
    return intrinsicLoss + connectorLoss + bendLoss + powerPenalty;
  };

  const calculateMeterOutput = (band, length, selectedFiberType) => {
    const inputPowerMw = getLaunchPowerMw(band, selectedFiberType);
    const totalLossDb = getTotalLossDb(band, length, selectedFiberType);
    return inputPowerMw * Math.pow(10, -totalLossDb / 10);
  };

  const currentMeterReading = isLaserOn ? calculateMeterOutput(powerBand, cableLength, fiberType) : 0;

  const getRecordedMeasurement = (selectedFiberType, band, length) =>
    measurements[selectedFiberType][band][String(length)];

  const calculateAttenuation = (selectedFiberType, band, length) => {
    if (length === REFERENCE_LENGTH_M) return null;

    const pi = getRecordedMeasurement(selectedFiberType, band, REFERENCE_LENGTH_M);
    const pf = getRecordedMeasurement(selectedFiberType, band, length);

    if (!pi || !pf || pi <= 0 || pf <= 0) return null;

    const deltaLength = length - REFERENCE_LENGTH_M;
    return ((10 * Math.log10(pi / pf)) / deltaLength) * 1000;
  };

  const calculateSpotWidth = (distance, selectedFiberType) => {
    const config = FIBER_TYPES[selectedFiberType];
    const halfAngleRad = Math.asin(Math.min(theoreticalNa, 0.9999));
    return 2 * distance * Math.tan(halfAngleRad) * config.beamSpreadFactor;
  };

  const calculateNaReading = (distance, selectedFiberType, selectedCableLength) => {
    const width = calculateSpotWidth(distance, selectedFiberType);
    return {
      distance: Number(distance.toFixed(1)),
      width: Number(width.toFixed(2)),
      na: Number(theoreticalNa.toFixed(4)),
      acceptanceAngle: Number(acceptanceConeAngleDeg.toFixed(2)),
      cableLength: selectedCableLength,
      n1: Number(coreIndex.toFixed(3)),
      n2: Number(safeCladdingIndex.toFixed(3)),
      fiberType: FIBER_TYPES[selectedFiberType].label,
    };
  };

  const currentNaReading = calculateNaReading(naDistance, fiberType, naCableLength);
  const currentNaReadingsList = naReadings[fiberType][String(naCableLength)];

  const getAverage = (items, key) => {
    if (!items.length) return null;
    return items.reduce((sum, item) => sum + item[key], 0) / items.length;
  };

  const currentAverageNa = getAverage(currentNaReadingsList, 'na');
  const currentAverageAngle = getAverage(currentNaReadingsList, 'acceptanceAngle');

  const recordMeasurement = () => {
    if (!isLaserOn) return;

    setMeasurements((prev) => ({
      ...prev,
      [fiberType]: {
        ...prev[fiberType],
        [powerBand]: {
          ...prev[fiberType][powerBand],
          [String(cableLength)]: Number(currentMeterReading.toFixed(4)),
        },
      },
    }));
  };

  const recordNaReading = () => {
    if (!isLaserOn) return;

    setNaReadings((prev) => {
      const nextReadings = [...prev[fiberType][String(naCableLength)]];
      const reading = {
        index: nextReadings.length + 1,
        ...currentNaReading,
      };

      if (nextReadings.length < MAX_NA_READINGS) {
        nextReadings.push(reading);
      } else {
        nextReadings[nextReadings.length - 1] = reading;
      }

      return {
        ...prev,
        [fiberType]: {
          ...prev[fiberType],
          [String(naCableLength)]: nextReadings,
        },
      };
    });
  };

  const clearAttenuationMeasurements = () => {
    setMeasurements(createMeasurements());
  };

  const clearNaMeasurements = () => {
    setNaReadings(createNaReadings());
  };

  const exportData = () => {
    const rows = [
      ['Fiber Optics Virtual Lab - Advanced Version'],
      [''],
      ['Attenuation Experiment'],
      ['Fiber type', 'Power band', 'Cable length (m)', 'Output power (mW)', 'Attenuation from 1 m (dB/km)'],
    ];

    Object.keys(FIBER_TYPES).forEach((typeKey) => {
      ['low', 'high'].forEach((band) => {
        FIBER_LENGTH_OPTIONS.forEach((length) => {
          const output = measurements[typeKey][band][String(length)];
          const attenuation = calculateAttenuation(typeKey, band, length);
          rows.push([
            FIBER_TYPES[typeKey].label,
            band === 'low' ? 'Low' : 'High',
            length,
            output !== null ? output.toFixed(4) : '-',
            attenuation !== null ? attenuation.toFixed(3) : length === 1 ? 'Reference' : 'Incomplete',
          ]);
        });
      });
    });

    rows.push(['']);
    rows.push(['Numerical Aperture Experiment']);
    rows.push([
      'Fiber type',
      'Cable length (m)',
      'Reading',
      'Distance L (mm)',
      'Beam diameter W (mm)',
      'NA',
      'Acceptance angle (deg)',
      'n1',
      'n2',
    ]);

    Object.keys(FIBER_TYPES).forEach((typeKey) => {
      FIBER_LENGTH_OPTIONS.forEach((length) => {
        const readings = naReadings[typeKey][String(length)];
        readings.forEach((reading) => {
          rows.push([
            FIBER_TYPES[typeKey].label,
            length,
            reading.index,
            reading.distance.toFixed(1),
            reading.width.toFixed(2),
            reading.na.toFixed(4),
            reading.acceptanceAngle.toFixed(2),
            reading.n1.toFixed(3),
            reading.n2.toFixed(3),
          ]);
        });
      });
    });

    rows.push(['']);
    rows.push(['Formulas']);
    rows.push(['NA', 'sqrt(n1^2 - n2^2)']);
    rows.push(['Acceptance angle', '2 x sin^-1(NA)']);
    rows.push(['Graph 1', 'Plot output power vs cable length']);
    rows.push(['Graph 2', 'Plot attenuation vs cable length']);
    rows.push(['Graph 3', 'Compare NA across fiber types']);

    const csvData = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fiber_optics_virtual_lab_advanced.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setCladdingIndex((prev) => clamp(prev, 1.44, Number((coreIndex - 0.001).toFixed(3))));
  }, [coreIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let particles = [];

    const drawText = (text, x, y, color = '#e5e7eb', font = '13px Arial') => {
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.fillText(text, x, y);
    };

    const createAttenuationParticle = () => ({
      x: 150,
      y: height / 2 + (Math.random() - 0.5) * 20,
      vx: 2.3 + Math.random() * 1.2,
      vy: (Math.random() - 0.5) * 1.1,
      radius: 2 + laserPower / 55,
      alpha: 0.5 + laserPower / 200,
    });

    const createNaParticle = () => ({
      t: 0,
      speed: 0.012 + Math.random() * 0.009,
      offset: (Math.random() - 0.5) * 0.8,
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#07111d');
      background.addColorStop(0.55, '#10253f');
      background.addColorStop(1, '#183861');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      const gridColor = 'rgba(148, 163, 184, 0.08)';
      for (let x = 0; x < width; x += 40) {
        ctx.strokeStyle = gridColor;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += 40) {
        ctx.strokeStyle = gridColor;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (activeExperiment === 'attenuation') {
        const fiberStartX = 170;
        const fiberEndX = width - 170;
        const centerY = height / 2;
        const claddingHalfHeight = 42;
        const coreHalfHeight = 18;
        const beamStrength = isLaserOn ? laserPower / 100 : 0;

        const fiberGradient = ctx.createLinearGradient(fiberStartX, 0, fiberEndX, 0);
        fiberGradient.addColorStop(0, 'rgba(148, 197, 255, 0.24)');
        fiberGradient.addColorStop(0.5, 'rgba(191, 219, 254, 0.16)');
        fiberGradient.addColorStop(1, 'rgba(148, 197, 255, 0.24)');

        ctx.fillStyle = fiberGradient;
        ctx.fillRect(
          fiberStartX,
          centerY - claddingHalfHeight,
          fiberEndX - fiberStartX,
          claddingHalfHeight * 2
        );
        ctx.strokeStyle = 'rgba(191, 219, 254, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          fiberStartX,
          centerY - claddingHalfHeight,
          fiberEndX - fiberStartX,
          claddingHalfHeight * 2
        );

        ctx.fillStyle = 'rgba(56, 189, 248, 0.30)';
        ctx.fillRect(
          fiberStartX,
          centerY - coreHalfHeight,
          fiberEndX - fiberStartX,
          coreHalfHeight * 2
        );

        ctx.fillStyle = isLaserOn ? '#ef4444' : '#475569';
        ctx.fillRect(45, centerY - 34, 84, 68);
        ctx.fillStyle = isLaserOn ? '#fecaca' : '#94a3b8';
        ctx.fillRect(120, centerY - 15, 12, 30);
        drawText('LASER', 62, centerY + 4, '#ffffff', 'bold 14px Arial');

        if (isLaserOn) {
          const beam = ctx.createLinearGradient(128, centerY, fiberStartX, centerY);
          beam.addColorStop(0, `rgba(255, 72, 72, ${0.48 + beamStrength * 0.35})`);
          beam.addColorStop(1, 'rgba(255, 120, 120, 0.10)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(128, centerY - 10 - beamStrength * 10);
          ctx.lineTo(fiberStartX, centerY - 13 - beamStrength * 7);
          ctx.lineTo(fiberStartX, centerY + 13 + beamStrength * 7);
          ctx.lineTo(128, centerY + 10 + beamStrength * 10);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#111827';
        ctx.fillRect(fiberEndX + 24, centerY - 58, 102, 116);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(fiberEndX + 38, centerY - 36, 72, 32);
        drawText(`${currentMeterReading.toFixed(4)} mW`, fiberEndX + 44, centerY - 15, '#052e16', 'bold 12px Arial');
        drawText('Power Meter', fiberEndX + 34, centerY + 28, '#e2e8f0', 'bold 13px Arial');

        if (isLaserOn && Math.random() < 0.8) {
          particles.push(createAttenuationParticle());
        }

        particles = particles.filter((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.y < centerY - coreHalfHeight + 2 || particle.y > centerY + coreHalfHeight - 2) {
            particle.vy *= -1;
          }

          const progress = (particle.x - fiberStartX) / (fiberEndX - fiberStartX);
          const alphaDecay = 0.22 + cableLength / 145;
          const alpha = particle.alpha * Math.max(0.06, 1 - progress * alphaDecay);

          if (particle.x > fiberStartX && particle.x < fiberEndX && alpha > 0.03) {
            const glow = ctx.createRadialGradient(
              particle.x,
              particle.y,
              0,
              particle.x,
              particle.y,
              particle.radius * 3.4
            );
            glow.addColorStop(0, `rgba(255, 104, 104, ${alpha})`);
            glow.addColorStop(1, 'rgba(255, 104, 104, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
          }

          return particle.x < fiberEndX + 20;
        });

        drawText('Attenuation Setup', 24, 28, '#f8fafc', 'bold 18px Arial');
        drawText(`${fiberConfig.label} | ${cableLength} m cable`, 24, 50, '#cbd5e1', '13px Arial');
        drawText(
          `Intrinsic + connector + bend loss model | n1 = ${coreIndex.toFixed(3)}, n2 = ${safeCladdingIndex.toFixed(3)}`,
          24,
          height - 28,
          '#cbd5e1',
          '12px Arial'
        );
      } else {
        const fiberTipX = 125;
        const centerY = height / 2;
        const screenX = Math.min(width - 90, fiberTipX + 125 + naDistance * 5.4);
        const coneHalfHeight = Math.max(20, Math.min(108, currentNaReading.width * 1.2));
        const activeIntensity = isLaserOn ? 1 : 0.18;
        const halfAngleRad = (acceptanceHalfAngleDeg * Math.PI) / 180;

        ctx.fillStyle = 'rgba(146, 197, 255, 0.16)';
        ctx.fillRect(40, centerY - 42, 86, 84);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.fillRect(55, centerY - 21, 71, 42);
        drawText('Fiber', 68, centerY - 54, '#e0f2fe', 'bold 13px Arial');

        ctx.strokeStyle = `rgba(248, 113, 113, ${0.75 * activeIntensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY - coneHalfHeight);
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY + coneHalfHeight);
        ctx.stroke();

        const coneFill = ctx.createLinearGradient(fiberTipX, centerY, screenX, centerY);
        coneFill.addColorStop(0, `rgba(248, 113, 113, ${0.34 * activeIntensity})`);
        coneFill.addColorStop(1, 'rgba(248, 113, 113, 0.07)');
        ctx.fillStyle = coneFill;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY - coneHalfHeight);
        ctx.lineTo(screenX, centerY + coneHalfHeight);
        ctx.closePath();
        ctx.fill();

        const beamSpotGradient = ctx.createRadialGradient(screenX, centerY, 8, screenX, centerY, coneHalfHeight);
        beamSpotGradient.addColorStop(0, 'rgba(255, 228, 228, 0.9)');
        beamSpotGradient.addColorStop(1, 'rgba(248, 113, 113, 0.14)');
        ctx.fillStyle = beamSpotGradient;
        ctx.beginPath();
        ctx.ellipse(screenX, centerY, 18, coneHalfHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX, centerY - coneHalfHeight - 22);
        ctx.lineTo(screenX, centerY + coneHalfHeight + 22);
        ctx.stroke();
        drawText('Screen', screenX - 22, centerY - coneHalfHeight - 30, '#f8fafc', 'bold 13px Arial');

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY + coneHalfHeight + 44);
        ctx.lineTo(screenX, centerY + coneHalfHeight + 44);
        ctx.stroke();
        drawText(`L = ${naDistance.toFixed(1)} mm`, (fiberTipX + screenX) / 2 - 28, centerY + coneHalfHeight + 62, '#fde68a');

        ctx.beginPath();
        ctx.moveTo(screenX + 28, centerY - coneHalfHeight);
        ctx.lineTo(screenX + 28, centerY + coneHalfHeight);
        ctx.stroke();
        drawText(`W = ${currentNaReading.width.toFixed(2)} mm`, screenX + 36, centerY + 4, '#fde68a');

        if (isLaserOn && Math.random() < 0.72) {
          particles.push(createNaParticle());
        }

        particles = particles.filter((particle) => {
          particle.t += particle.speed;
          const x = fiberTipX + (screenX - fiberTipX) * particle.t;
          const spread = coneHalfHeight * particle.offset * particle.t;
          const y = centerY + spread * 2;

          if (particle.t < 1) {
            const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
            glow.addColorStop(0, `rgba(255, 120, 120, ${0.72 * activeIntensity})`);
            glow.addColorStop(1, 'rgba(255, 120, 120, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, 2.4, 0, Math.PI * 2);
            ctx.fill();
          }

          return particle.t < 1;
        });

        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fiberTipX, centerY, 52, -halfAngleRad, halfAngleRad);
        ctx.stroke();

        drawText('Numerical Aperture Setup', 24, 28, '#f8fafc', 'bold 18px Arial');
        drawText(`${fiberConfig.label} | ${naCableLength} m cable`, width - 300, 28);
        drawText(`NA = ${currentNaReading.na.toFixed(4)}`, width - 300, 50);
        drawText(`Acceptance angle = ${currentNaReading.acceptanceAngle.toFixed(2)} deg`, width - 300, 72);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    activeExperiment,
    acceptanceHalfAngleDeg,
    cableLength,
    coreIndex,
    currentMeterReading,
    currentNaReading.acceptanceAngle,
    currentNaReading.na,
    currentNaReading.width,
    fiberConfig.label,
    isLaserOn,
    laserPower,
    naCableLength,
    naDistance,
    powerBand,
    safeCladdingIndex,
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff,_#dbeafe_38%,_#bfdbfe_72%,_#c7d2fe)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                <CircleDot className="h-3.5 w-3.5" />
                Fiber Optics Virtual Lab
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Optical Fiber Simulation
              </h1>
              <p className="mt-2 max-w-3xl text-slate-600">
                A polished virtual lab for attenuation and numerical aperture experiments with
                longer cable lengths, fiber-type comparison, and student graph exercises.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/90 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Wavelength
                </div>
                <div className="mt-1 text-lg font-bold text-sky-700">{WAVELENGTH_NM} nm</div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Active Fiber
                </div>
                <div className="mt-1 text-sm font-bold text-emerald-700">{fiberConfig.shortLabel}</div>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/90 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current NA
                </div>
                <div className="mt-1 text-lg font-bold text-violet-700">{theoreticalNa.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-lg backdrop-blur md:grid-cols-2">
          <Button
            onClick={() => setActiveExperiment('attenuation')}
            className={`h-14 text-base ${
              activeExperiment === 'attenuation'
                ? 'bg-sky-600 hover:bg-sky-700'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Gauge className="mr-2 h-5 w-5" />
            Experiment 1: Attenuation
          </Button>
          <Button
            onClick={() => setActiveExperiment('na')}
            className={`h-14 text-base ${
              activeExperiment === 'na'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Waves className="mr-2 h-5 w-5" />
            Experiment 2: Numerical Aperture
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur lg:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
              <Zap className="h-5 w-5 text-amber-500" />
              Control Panel
            </h2>

            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  Laser Source (lambda = {WAVELENGTH_NM} nm)
                </div>
                <Button
                  onClick={() => setIsLaserOn((prev) => !prev)}
                  className={`w-full ${isLaserOn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-700 hover:bg-slate-800'}`}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {isLaserOn ? 'Turn OFF Laser' : 'Turn ON Laser'}
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Cable className="h-4 w-4" />
                  Choose Fiber Type
                </div>
                <div className="grid gap-2">
                  {Object.entries(FIBER_TYPES).map(([key, value]) => (
                    <Button
                      key={key}
                      onClick={() => applyFiberPreset(key)}
                      variant={fiberType === key ? 'default' : 'outline'}
                      className={fiberType === key ? 'bg-cyan-700 hover:bg-cyan-800' : ''}
                    >
                      {value.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">Refractive Indices</div>

                <div className="mb-4">
                  <div className="mb-2 text-sm text-slate-700">
                    Core refractive index n1: {coreIndex.toFixed(3)}
                  </div>
                  <Slider
                    min={1.45}
                    max={1.6}
                    step={0.001}
                    value={[coreIndex]}
                    onValueChange={(value) => setCoreIndex(Number(value[0].toFixed(3)))}
                  />
                </div>

                <div>
                  <div className="mb-2 text-sm text-slate-700">
                    Cladding refractive index n2: {safeCladdingIndex.toFixed(3)}
                  </div>
                  <Slider
                    min={1.44}
                    max={Math.max(1.441, maxAllowedCladding)}
                    step={0.001}
                    value={[safeCladdingIndex]}
                    onValueChange={(value) => setCladdingIndex(Number(value[0].toFixed(3)))}
                  />
                </div>

                <div className="mt-4 rounded-2xl bg-white/85 p-3 text-sm text-slate-700">
                  <div>NA = sqrt(n1^2 - n2^2)</div>
                  <div className="mt-1 font-semibold text-sky-700">NA = {theoreticalNa.toFixed(4)}</div>
                  <div className="mt-1 font-semibold text-emerald-700">
                    Acceptance angle = {acceptanceConeAngleDeg.toFixed(2)} deg
                  </div>
                </div>
              </div>

              {activeExperiment === 'attenuation' ? (
                <>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-700">
                      Laser power: {laserPower}% ({powerBandLabel})
                    </div>
                    <Slider
                      min={10}
                      max={100}
                      step={1}
                      value={[laserPower]}
                      onValueChange={(value) => setLaserPower(value[0])}
                    />
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-700">Loss Parameters</div>

                    <div className="mb-4">
                      <div className="mb-2 text-sm text-slate-700">
                        Connector pairs: {connectorPairs}
                      </div>
                      <Slider
                        min={0}
                        max={6}
                        step={1}
                        value={[connectorPairs]}
                        onValueChange={(value) => setConnectorPairs(value[0])}
                      />
                    </div>

                    <div>
                      <div className="mb-2 text-sm text-slate-700">Number of bends: {bendCount}</div>
                      <Slider
                        min={0}
                        max={6}
                        step={1}
                        value={[bendCount]}
                        onValueChange={(value) => setBendCount(value[0])}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Choose fiber cable length</div>
                    <div className="grid grid-cols-2 gap-2">
                      {FIBER_LENGTH_OPTIONS.map((length) => (
                        <Button
                          key={length}
                          onClick={() => setCableLength(length)}
                          variant={cableLength === length ? 'default' : 'outline'}
                          className={cableLength === length ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                          {length} m
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={recordMeasurement}
                    disabled={!isLaserOn}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Record {powerBandLabel} Power Reading
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Choose fiber cable length</div>
                    <div className="grid grid-cols-2 gap-2">
                      {FIBER_LENGTH_OPTIONS.map((length) => (
                        <Button
                          key={length}
                          onClick={() => setNaCableLength(length)}
                          variant={naCableLength === length ? 'default' : 'outline'}
                          className={naCableLength === length ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                          {length} m
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-700">
                      Screen distance from source: {naDistance.toFixed(1)} mm
                    </div>
                    <Slider
                      min={10}
                      max={120}
                      step={0.5}
                      value={[naDistance]}
                      onValueChange={(value) => setNaDistance(value[0])}
                    />
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Current beam diameter W</div>
                      <div className="mt-1 text-2xl font-bold text-amber-700">{currentNaReading.width.toFixed(2)} mm</div>
                    </div>
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Current NA</div>
                      <div className="mt-1 text-2xl font-bold text-sky-700">{currentNaReading.na.toFixed(4)}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Current acceptance angle</div>
                      <div className="mt-1 text-xl font-bold text-emerald-700">
                        {currentNaReading.acceptanceAngle.toFixed(2)} deg
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={recordNaReading}
                    disabled={!isLaserOn}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Record Reading {Math.min(currentNaReadingsList.length + 1, MAX_NA_READINGS)} / {MAX_NA_READINGS}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur">
              <h2 className="mb-4 text-xl font-bold text-slate-800">
                {activeExperiment === 'attenuation'
                  ? '2D Fiber Attenuation Visualization'
                  : '2D Numerical Aperture Visualization'}
              </h2>
              <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-inner">
                <canvas ref={canvasRef} width={920} height={320} className="w-full" />
              </div>
            </div>

            {activeExperiment === 'attenuation' ? (
              <>
                <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold text-slate-800">
                      Attenuation Readings ({fiberConfig.label})
                    </h2>
                    <div className="flex gap-2">
                      <Button onClick={exportData} variant="outline" size="sm">
                        Export CSV
                      </Button>
                      <Button onClick={clearAttenuationMeasurements} variant="outline" size="sm">
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full border-collapse overflow-hidden rounded-2xl text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-4 py-3 text-left">Cable length</th>
                          <th className="border px-4 py-3 text-left">Low output</th>
                          <th className="border px-4 py-3 text-left">Low attenuation</th>
                          <th className="border px-4 py-3 text-left">High output</th>
                          <th className="border px-4 py-3 text-left">High attenuation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FIBER_LENGTH_OPTIONS.map((length) => {
                          const lowOutput = measurements[fiberType].low[String(length)];
                          const highOutput = measurements[fiberType].high[String(length)];
                          const lowAttenuation = calculateAttenuation(fiberType, 'low', length);
                          const highAttenuation = calculateAttenuation(fiberType, 'high', length);

                          return (
                            <tr key={length} className="hover:bg-slate-50">
                              <td className="border px-4 py-3 font-semibold">{length} m</td>
                              <td className="border px-4 py-3">{lowOutput !== null ? `${lowOutput.toFixed(4)} mW` : 'Not recorded'}</td>
                              <td className="border px-4 py-3 text-sky-700">
                                {length === 1
                                  ? 'Reference'
                                  : lowAttenuation !== null
                                    ? `${lowAttenuation.toFixed(3)} dB/km`
                                    : 'Incomplete'}
                              </td>
                              <td className="border px-4 py-3">{highOutput !== null ? `${highOutput.toFixed(4)} mW` : 'Not recorded'}</td>
                              <td className="border px-4 py-3 text-violet-700">
                                {length === 1
                                  ? 'Reference'
                                  : highAttenuation !== null
                                    ? `${highAttenuation.toFixed(3)} dB/km`
                                    : 'Incomplete'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Intrinsic loss
                      </div>
                      <div className="mt-1 text-lg font-bold text-sky-700">
                        {fiberConfig.intrinsicLossDbPerKm.toFixed(1)} dB/km
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Connector loss
                      </div>
                      <div className="mt-1 text-lg font-bold text-amber-700">
                        {getConnectorLossDb(fiberType).toFixed(2)} dB
                      </div>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Bend loss at {cableLength} m
                      </div>
                      <div className="mt-1 text-lg font-bold text-rose-700">
                        {getBendLossDb(cableLength, fiberType).toFixed(2)} dB
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Student Graph Exercise
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="font-semibold">Graph 1</div>
                      <div className="mt-1">Plot output power (mW) on Y-axis and cable length (m) on X-axis.</div>
                      <div className="mt-1">Use separate curves for low power and high power.</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="font-semibold">Graph 2</div>
                      <div className="mt-1">Plot attenuation (dB/km) on Y-axis and cable length (m) on X-axis.</div>
                      <div className="mt-1">Take 1 meter cable as the reference reading.</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold text-slate-800">
                      Numerical Aperture Readings ({fiberConfig.label}, {naCableLength} m)
                    </h2>
                    <div className="flex gap-2">
                      <Button onClick={exportData} variant="outline" size="sm">
                        Export CSV
                      </Button>
                      <Button onClick={clearNaMeasurements} variant="outline" size="sm">
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-3 py-3 text-left">No.</th>
                          <th className="border px-3 py-3 text-left">Fiber type</th>
                          <th className="border px-3 py-3 text-left">Cable length</th>
                          <th className="border px-3 py-3 text-left">L (mm)</th>
                          <th className="border px-3 py-3 text-left">W (mm)</th>
                          <th className="border px-3 py-3 text-left">NA</th>
                          <th className="border px-3 py-3 text-left">Angle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: MAX_NA_READINGS }).map((_, index) => {
                          const reading = currentNaReadingsList[index];
                          return (
                            <tr key={`${fiberType}-${naCableLength}-${index}`} className="hover:bg-slate-50">
                              <td className="border px-3 py-2">{index + 1}</td>
                              <td className="border px-3 py-2">{reading ? reading.fiberType : '-'}</td>
                              <td className="border px-3 py-2">{reading ? `${reading.cableLength} m` : '-'}</td>
                              <td className="border px-3 py-2">{reading ? reading.distance.toFixed(1) : '-'}</td>
                              <td className="border px-3 py-2">{reading ? reading.width.toFixed(2) : '-'}</td>
                              <td className="border px-3 py-2">{reading ? reading.na.toFixed(4) : '-'}</td>
                              <td className="border px-3 py-2">
                                {reading ? `${reading.acceptanceAngle.toFixed(2)} deg` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-sky-50 font-semibold">
                          <td className="border px-3 py-2" colSpan="5">Average</td>
                          <td className="border px-3 py-2">{formatReading(currentAverageNa, 4)}</td>
                          <td className="border px-3 py-2">{formatReading(currentAverageAngle, 2, ' deg')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border px-3 py-3 text-left">Fiber type</th>
                          {FIBER_LENGTH_OPTIONS.map((length) => (
                            <th key={length} className="border px-3 py-3 text-left">{length} m</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(FIBER_TYPES).map(([typeKey, typeValue]) => (
                          <tr key={typeKey} className="hover:bg-slate-50">
                            <td className="border px-3 py-2 font-semibold">{typeValue.label}</td>
                            {FIBER_LENGTH_OPTIONS.map((length) => {
                              const avg = getAverage(naReadings[typeKey][String(length)], 'na');
                              return (
                                <td key={length} className="border px-3 py-2">
                                  {avg !== null ? avg.toFixed(4) : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Student Graph Exercise
                  </h2>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="font-semibold">NA Comparison Across Fiber Types</div>
                    <div className="mt-1">Plot numerical aperture on Y-axis and fiber type on X-axis.</div>
                    <div className="mt-1">Students may also compare acceptance angle for single-mode and multimode step-index fiber.</div>
                    <div className="mt-1">Formula used: NA = sqrt(n1^2 - n2^2)</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalFiberLab;
