import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Activity, Gauge, Power, Waves, Zap } from 'lucide-react';

const FIBER_LOSS_DB_PER_KM = 180;
const LENGTH_DIFFERENCE_M = 4;
const WAVELENGTH_NM = 650;
const CORE_REFRACTIVE_INDEX = 1.48;
const CLADDING_REFRACTIVE_INDEX = 1.46;

const OpticalFiberLab = () => {
  const [activeExperiment, setActiveExperiment] = useState('attenuation');
  const [cableLength, setCableLength] = useState(1);
  const [sourceLevel, setSourceLevel] = useState('min');
  const [minLaserSetting, setMinLaserSetting] = useState(30);
  const [maxLaserSetting, setMaxLaserSetting] = useState(80);
  const [isLaserOn, setIsLaserOn] = useState(false);
  const [measurements, setMeasurements] = useState({
    cable1m: { min: null, max: null },
    cable5m: { min: null, max: null },
  });
  const [naDistance, setNaDistance] = useState(40);
  const [naWidth, setNaWidth] = useState(26);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const getLaserSetting = (level) => (level === 'min' ? minLaserSetting : maxLaserSetting);

  // The source power is intentionally unknown. We simulate only the measured
  // power meter reading at the fiber output, which is what students use.
  const getOneMeterReferencePower = (level) => {
    const setting = getLaserSetting(level);
    return level === 'min'
      ? 0.6 + setting * 0.028
      : 1.8 + setting * 0.045;
  };

  const calculateMeasuredOutputPower = (level, length) => {
    const oneMeterPower = getOneMeterReferencePower(level);
    const extraDistanceKm = Math.max(length - 1, 0) / 1000;
    const attenuationFactor = Math.pow(10, (-FIBER_LOSS_DB_PER_KM * extraDistanceKm) / 10);
    return oneMeterPower * attenuationFactor;
  };

  const currentMeterReading = isLaserOn
    ? calculateMeasuredOutputPower(sourceLevel, cableLength)
    : 0;

  const calculateAttenuation = (level) => {
    const p1 = measurements.cable1m[level];
    const p5 = measurements.cable5m[level];

    if (!p1 || !p5 || p1 <= 0 || p5 <= 0) return null;

    const attenuationDbPerMeter = (10 * Math.log10(p1 / p5)) / LENGTH_DIFFERENCE_M;
    return attenuationDbPerMeter * 1000;
  };

  const attenuationMin = calculateAttenuation('min');
  const attenuationMax = calculateAttenuation('max');

  const numericalAperture = naWidth / Math.sqrt(4 * naDistance * naDistance + naWidth * naWidth);
  const acceptanceHalfAngleDeg = (Math.asin(Math.min(numericalAperture, 1)) * 180) / Math.PI;
  const acceptanceConeDeg = acceptanceHalfAngleDeg * 2;

  const recordMeasurement = () => {
    if (!isLaserOn) return;

    const cableKey = cableLength === 1 ? 'cable1m' : 'cable5m';

    setMeasurements((prev) => ({
      ...prev,
      [cableKey]: {
        ...prev[cableKey],
        [sourceLevel]: Number(currentMeterReading.toFixed(4)),
      },
    }));
  };

  const clearMeasurements = () => {
    setMeasurements({
      cable1m: { min: null, max: null },
      cable5m: { min: null, max: null },
    });
  };

  const exportData = () => {
    const rows = [
      ['Fiber Optics Virtual Lab'],
      [''],
      ['Attenuation Experiment'],
      ['Measurement', 'Cable Length', 'Laser Setting', 'Measured Output Power (mW)'],
      ['1', '1 m', 'Minimum', measurements.cable1m.min ?? '-'],
      ['2', '5 m', 'Minimum', measurements.cable5m.min ?? '-'],
      ['3', '1 m', 'Maximum', measurements.cable1m.max ?? '-'],
      ['4', '5 m', 'Maximum', measurements.cable5m.max ?? '-'],
      [''],
      ['Formula', '10 log10(Pi / Pf) / L'],
      ['Pi', 'Power meter reading with 1 m cable'],
      ['Pf', 'Power meter reading with 5 m cable'],
      ['L', '4 m'],
      ['Attenuation at Minimum Laser', attenuationMin !== null ? `${attenuationMin.toFixed(3)} dB/km` : 'Incomplete'],
      ['Attenuation at Maximum Laser', attenuationMax !== null ? `${attenuationMax.toFixed(3)} dB/km` : 'Incomplete'],
      [''],
      ['Numerical Aperture Experiment'],
      ['W (mm)', naWidth.toFixed(2)],
      ['L (mm)', naDistance.toFixed(2)],
      ['NA', numericalAperture.toFixed(4)],
      ['Acceptance Half Angle (deg)', acceptanceHalfAngleDeg.toFixed(2)],
      ['Full Acceptance Cone (deg)', acceptanceConeDeg.toFixed(2)],
      ['Formula', 'NA = W / sqrt(4L^2 + W^2)'],
      ['Acceptance Angle', 'theta = sin^-1(NA), cone = 2 theta'],
    ];

    const csvData = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fiber_optics_virtual_lab.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

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
      vx: 3 + Math.random() * 1.4,
      vy: (Math.random() - 0.5) * 1.4,
      radius: sourceLevel === 'max' ? 3.2 : 2.2,
      alpha: sourceLevel === 'max' ? 0.95 : 0.7,
    });

    const createNaParticle = () => ({
      t: 0,
      speed: 0.015 + Math.random() * 0.01,
      offset: (Math.random() - 0.5) * 0.7,
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#08111f');
      background.addColorStop(1, '#10294a');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      if (activeExperiment === 'attenuation') {
        const fiberStartX = 170;
        const fiberEndX = width - 170;
        const centerY = height / 2;
        const claddingHalfHeight = 40;
        const coreHalfHeight = 20;
        const intensity = getLaserSetting(sourceLevel) / 100;
        const detectorReading = currentMeterReading;

        ctx.fillStyle = 'rgba(146, 197, 255, 0.18)';
        ctx.fillRect(fiberStartX, centerY - claddingHalfHeight, fiberEndX - fiberStartX, claddingHalfHeight * 2);
        ctx.strokeStyle = 'rgba(191, 219, 254, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeRect(fiberStartX, centerY - claddingHalfHeight, fiberEndX - fiberStartX, claddingHalfHeight * 2);

        ctx.fillStyle = 'rgba(96, 165, 250, 0.32)';
        ctx.fillRect(fiberStartX, centerY - coreHalfHeight, fiberEndX - fiberStartX, coreHalfHeight * 2);
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
        ctx.strokeRect(fiberStartX, centerY - coreHalfHeight, fiberEndX - fiberStartX, coreHalfHeight * 2);

        ctx.fillStyle = isLaserOn ? '#ef4444' : '#4b5563';
        ctx.fillRect(45, centerY - 34, 82, 68);
        ctx.fillStyle = isLaserOn ? '#fecaca' : '#9ca3af';
        ctx.fillRect(118, centerY - 16, 12, 32);
        drawText('LASER', 62, centerY + 4, '#ffffff', 'bold 14px Arial');

        if (isLaserOn) {
          const beam = ctx.createLinearGradient(128, centerY, fiberStartX, centerY);
          beam.addColorStop(0, `rgba(255, 70, 70, ${0.7 * intensity})`);
          beam.addColorStop(1, 'rgba(255, 120, 120, 0.15)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(128, centerY - 12 - intensity * 10);
          ctx.lineTo(fiberStartX, centerY - 16 - intensity * 6);
          ctx.lineTo(fiberStartX, centerY + 16 + intensity * 6);
          ctx.lineTo(128, centerY + 12 + intensity * 10);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(fiberEndX + 26, centerY - 56, 95, 112);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(fiberEndX + 38, centerY - 38, 70, 34);
        drawText(`${detectorReading.toFixed(4)} mW`, fiberEndX + 46, centerY - 16, '#052e16', 'bold 12px Arial');
        ctx.fillStyle = '#111827';
        ctx.fillRect(fiberEndX + 16, centerY - 14, 10, 28);
        drawText('Power Meter', fiberEndX + 32, centerY + 28, '#f8fafc', 'bold 13px Arial');

        if (isLaserOn && Math.random() < 0.78) {
          particles.push(createAttenuationParticle());
        }

        particles = particles.filter((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.y < centerY - coreHalfHeight + 2 || particle.y > centerY + coreHalfHeight - 2) {
            particle.vy *= -1;
            particle.y = Math.max(centerY - coreHalfHeight + 3, Math.min(centerY + coreHalfHeight - 3, particle.y));
          }

          const progress = (particle.x - fiberStartX) / (fiberEndX - fiberStartX);
          const attenuationProgress = Math.max(0.18, 1 - progress * (cableLength === 5 ? 0.55 : 0.18));
          const alpha = particle.alpha * attenuationProgress * intensity;

          if (particle.x > fiberStartX && particle.x < fiberEndX && alpha > 0.04) {
            const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 3);
            glow.addColorStop(0, `rgba(255, 90, 90, ${alpha})`);
            glow.addColorStop(1, 'rgba(255, 90, 90, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
          }

          return particle.x < fiberEndX + 20;
        });

        drawText('Attenuation Setup', 24, 28, '#f8fafc', 'bold 18px Arial');
        drawText(`Core index n1 = ${CORE_REFRACTIVE_INDEX}`, 22, height - 54);
        drawText(`Cladding index n2 = ${CLADDING_REFRACTIVE_INDEX}   (n1 > n2 for total internal reflection)`, 22, height - 32);
        drawText(`Laser setting: ${sourceLevel === 'min' ? 'Minimum' : 'Maximum'}`, width - 250, 28);
        drawText(`Cable selected: ${cableLength} m`, width - 250, 50);
      } else {
        const fiberTipX = 130;
        const centerY = height / 2;
        const screenX = width - 130;
        const coneHalfHeight = Math.min(95, (naWidth / 40) * 60);
        const activeIntensity = isLaserOn ? getLaserSetting(sourceLevel) / 100 : 0.18;
        const thetaRad = Math.asin(Math.min(numericalAperture, 1));

        ctx.fillStyle = 'rgba(146, 197, 255, 0.18)';
        ctx.fillRect(40, centerY - 42, 90, 84);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.36)';
        ctx.fillRect(55, centerY - 22, 75, 44);
        drawText('Fiber Core', 48, centerY - 54, '#e0f2fe', 'bold 13px Arial');
        drawText(`n1 = ${CORE_REFRACTIVE_INDEX}`, 46, centerY + 68);
        drawText(`n2 = ${CLADDING_REFRACTIVE_INDEX}`, 46, centerY + 88);

        ctx.strokeStyle = `rgba(248, 113, 113, ${0.75 * activeIntensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY - coneHalfHeight);
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY + coneHalfHeight);
        ctx.stroke();

        const coneFill = ctx.createLinearGradient(fiberTipX, centerY, screenX, centerY);
        coneFill.addColorStop(0, `rgba(248, 113, 113, ${0.4 * activeIntensity})`);
        coneFill.addColorStop(1, 'rgba(248, 113, 113, 0.08)');
        ctx.fillStyle = coneFill;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY - coneHalfHeight);
        ctx.lineTo(screenX, centerY + coneHalfHeight);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX, centerY - coneHalfHeight - 20);
        ctx.lineTo(screenX, centerY + coneHalfHeight + 20);
        ctx.stroke();
        drawText('Screen', screenX - 24, centerY - coneHalfHeight - 28, '#f8fafc', 'bold 13px Arial');

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY + coneHalfHeight + 38);
        ctx.lineTo(screenX, centerY + coneHalfHeight + 38);
        ctx.stroke();
        drawText(`L = ${naDistance.toFixed(1)} mm`, (fiberTipX + screenX) / 2 - 26, centerY + coneHalfHeight + 58, '#fde68a');

        ctx.beginPath();
        ctx.moveTo(screenX + 28, centerY - coneHalfHeight);
        ctx.lineTo(screenX + 28, centerY + coneHalfHeight);
        ctx.stroke();
        drawText(`W = ${naWidth.toFixed(1)} mm`, screenX + 36, centerY + 4, '#fde68a');

        if (isLaserOn && Math.random() < 0.68) {
          particles.push(createNaParticle());
        }

        particles = particles.filter((particle) => {
          particle.t += particle.speed;
          const x = fiberTipX + (screenX - fiberTipX) * particle.t;
          const spread = coneHalfHeight * particle.t * particle.offset;
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
        ctx.arc(fiberTipX, centerY, 50, -thetaRad, thetaRad);
        ctx.stroke();

        drawText('Numerical Aperture Setup', 24, 28, '#f8fafc', 'bold 18px Arial');
        drawText(`NA = ${numericalAperture.toFixed(4)}`, width - 220, 28);
        drawText(`Acceptance half-angle = ${acceptanceHalfAngleDeg.toFixed(2)} deg`, width - 220, 50);
        drawText(`Full cone = 2 theta = ${acceptanceConeDeg.toFixed(2)} deg`, width - 220, 72);
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
    cableLength,
    currentMeterReading,
    isLaserOn,
    maxLaserSetting,
    minLaserSetting,
    naDistance,
    naWidth,
    numericalAperture,
    sourceLevel,
    acceptanceHalfAngleDeg,
    acceptanceConeDeg,
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#dbeafe_45%,_#bfdbfe)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-slate-800">Optical Fiber Virtual Lab</h1>
          <p className="text-slate-600">
            Two experiments: attenuation using 1 m and 5 m cable readings, and numerical aperture with acceptance angle.
          </p>
        </div>

        <div className="mb-6 grid gap-4 rounded-3xl border border-sky-200 bg-white/80 p-4 shadow-lg backdrop-blur md:grid-cols-2">
          <Button
            onClick={() => setActiveExperiment('attenuation')}
            className={`h-14 text-base ${activeExperiment === 'attenuation' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            <Gauge className="mr-2 h-5 w-5" />
            Experiment 1: Attenuation
          </Button>
          <Button
            onClick={() => setActiveExperiment('na')}
            className={`h-14 text-base ${activeExperiment === 'na' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            <Waves className="mr-2 h-5 w-5" />
            Experiment 2: Numerical Aperture
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-xl lg:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
              <Zap className="h-5 w-5 text-amber-500" />
              Control Panel
            </h2>

            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-700">Laser Diode (lambda = {WAVELENGTH_NM} nm)</div>
                <Button
                  onClick={() => setIsLaserOn((prev) => !prev)}
                  className={`w-full ${isLaserOn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-700 hover:bg-slate-800'}`}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {isLaserOn ? 'Turn OFF Laser' : 'Turn ON Laser'}
                </Button>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  Minimum laser setting: {minLaserSetting}%
                </div>
                <Slider
                  min={10}
                  max={50}
                  step={1}
                  value={[minLaserSetting]}
                  onValueChange={(value) => setMinLaserSetting(value[0])}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Lower laser intensity for minimum-output attenuation measurement.
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  Maximum laser setting: {maxLaserSetting}%
                </div>
                <Slider
                  min={60}
                  max={100}
                  step={1}
                  value={[maxLaserSetting]}
                  onValueChange={(value) => setMaxLaserSetting(value[0])}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Higher laser intensity for maximum-output attenuation measurement.
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">Select laser level</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setSourceLevel('min')}
                    variant={sourceLevel === 'min' ? 'default' : 'outline'}
                    className={sourceLevel === 'min' ? 'bg-sky-600 hover:bg-sky-700' : ''}
                  >
                    Minimum
                  </Button>
                  <Button
                    onClick={() => setSourceLevel('max')}
                    variant={sourceLevel === 'max' ? 'default' : 'outline'}
                    className={sourceLevel === 'max' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  >
                    Maximum
                  </Button>
                </div>
              </div>

              {activeExperiment === 'attenuation' ? (
                <>
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Choose fiber cable length</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setCableLength(1)}
                        variant={cableLength === 1 ? 'default' : 'outline'}
                        className={cableLength === 1 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        1 meter
                      </Button>
                      <Button
                        onClick={() => setCableLength(5)}
                        variant={cableLength === 5 ? 'default' : 'outline'}
                        className={cableLength === 5 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        5 meters
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Power meter output</div>
                      <div className="mt-1 text-2xl font-bold text-emerald-700">
                        {currentMeterReading.toFixed(4)} mW
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Source input power is unknown; attenuation uses measured output only.
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={recordMeasurement}
                    disabled={!isLaserOn}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Record Power Meter Reading
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-700">Spot width on screen, W: {naWidth.toFixed(1)} mm</div>
                    <Slider
                      min={8}
                      max={60}
                      step={0.5}
                      value={[naWidth]}
                      onValueChange={(value) => setNaWidth(value[0])}
                    />
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-700">Distance from fiber tip to screen, L: {naDistance.toFixed(1)} mm</div>
                    <Slider
                      min={10}
                      max={80}
                      step={0.5}
                      value={[naDistance]}
                      onValueChange={(value) => setNaDistance(value[0])}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Numerical aperture</div>
                      <div className="mt-1 text-2xl font-bold text-amber-700">{numericalAperture.toFixed(4)}</div>
                    </div>
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Acceptance angle</div>
                      <div className="mt-1 text-xl font-bold text-sky-700">
                        {acceptanceHalfAngleDeg.toFixed(2)} deg
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Full acceptance cone = 2 x angle = {acceptanceConeDeg.toFixed(2)} deg
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold text-slate-800">
                {activeExperiment === 'attenuation'
                  ? '2D Fiber Attenuation Visualization'
                  : '2D Numerical Aperture Visualization'}
              </h2>
              <div className="overflow-hidden rounded-2xl bg-slate-950">
                <canvas ref={canvasRef} width={920} height={320} className="w-full" />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <div className="text-sm text-slate-500">Laser level</div>
                  <div className="text-xl font-bold text-slate-800">
                    {sourceLevel === 'min' ? 'Minimum' : 'Maximum'}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <div className="text-sm text-slate-500">Core / Cladding</div>
                  <div className="text-xl font-bold text-slate-800">
                    {CORE_REFRACTIVE_INDEX} / {CLADDING_REFRACTIVE_INDEX}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <div className="text-sm text-slate-500">
                    {activeExperiment === 'attenuation' ? 'Selected cable' : 'Full cone angle'}
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {activeExperiment === 'attenuation' ? `${cableLength} m` : `${acceptanceConeDeg.toFixed(2)} deg`}
                  </div>
                </div>
              </div>
            </div>

            {activeExperiment === 'attenuation' ? (
              <div className="rounded-3xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Attenuation Measurement Table</h2>
                  <div className="flex gap-2">
                    <Button onClick={exportData} variant="outline" size="sm">
                      Export CSV
                    </Button>
                    <Button onClick={clearMeasurements} variant="outline" size="sm">
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="mb-6 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border px-4 py-3 text-left">Cable length</th>
                        <th className="border px-4 py-3 text-left">Minimum laser output</th>
                        <th className="border px-4 py-3 text-left">Maximum laser output</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-slate-50">
                        <td className="border px-4 py-3 font-semibold">1 meter</td>
                        <td className="border px-4 py-3">
                          {measurements.cable1m.min !== null ? `${measurements.cable1m.min} mW` : 'Not recorded'}
                        </td>
                        <td className="border px-4 py-3">
                          {measurements.cable1m.max !== null ? `${measurements.cable1m.max} mW` : 'Not recorded'}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="border px-4 py-3 font-semibold">5 meters</td>
                        <td className="border px-4 py-3">
                          {measurements.cable5m.min !== null ? `${measurements.cable5m.min} mW` : 'Not recorded'}
                        </td>
                        <td className="border px-4 py-3">
                          {measurements.cable5m.max !== null ? `${measurements.cable5m.max} mW` : 'Not recorded'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-700">Attenuation at minimum laser setting</span>
                      <span className="text-2xl font-bold text-sky-700">
                        {attenuationMin !== null ? `${attenuationMin.toFixed(3)} dB/km` : 'Incomplete'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      10 log10(Pi / Pf) / L, using Pi = 1 m output, Pf = 5 m output, L = 4 m
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-700">Attenuation at maximum laser setting</span>
                      <span className="text-2xl font-bold text-violet-700">
                        {attenuationMax !== null ? `${attenuationMax.toFixed(3)} dB/km` : 'Incomplete'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Result is converted from dB/m to dB/km for the final answer.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="font-semibold">Attenuation formula</div>
                    <div className="mt-1">alpha = 10 log10(Pi / Pf) / L</div>
                    <div className="mt-1">Pi = power meter output with 1 meter cable</div>
                    <div className="mt-1">Pf = power meter output with 5 meter cable</div>
                    <div className="mt-1">L = 5 m - 1 m = 4 m</div>
                    <div className="mt-1">Displayed unit = dB/km</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-6 shadow-xl">
                <div className="mb-4 text-xl font-bold text-slate-800">Numerical Aperture Results</div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm text-slate-500">Formula</div>
                    <div className="mt-2 text-sm font-semibold text-slate-800">NA = W / sqrt(4L^2 + W^2)</div>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <div className="text-sm text-slate-500">Acceptance half-angle</div>
                    <div className="mt-2 text-2xl font-bold text-sky-700">{acceptanceHalfAngleDeg.toFixed(2)} deg</div>
                    <div className="mt-1 text-xs text-slate-500">theta = sin^-1(NA)</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-sm text-slate-500">Full cone angle</div>
                    <div className="mt-2 text-2xl font-bold text-emerald-700">{acceptanceConeDeg.toFixed(2)} deg</div>
                    <div className="mt-1 text-xs text-slate-500">2 x theta because light enters as a cone</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold">Meaning of terms</div>
                  <div className="mt-1">W = spot width measured on the screen</div>
                  <div className="mt-1">L = distance from fiber end to screen</div>
                  <div className="mt-1">NA describes how much light the fiber can accept.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalFiberLab;
