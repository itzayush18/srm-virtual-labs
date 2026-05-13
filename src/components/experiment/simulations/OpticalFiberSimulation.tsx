import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Activity, Gauge, Power, Waves, Zap } from 'lucide-react';

const WAVELENGTH_NM = 650;
const CORE_REFRACTIVE_INDEX = 1.48;
const CLADDING_REFRACTIVE_INDEX = 1.46;
const LENGTH_DIFFERENCE_M = 4;
const ATTENUATION_BASE_DB_PER_KM = 160;

const OpticalFiberLab = () => {
  const [activeExperiment, setActiveExperiment] = useState('attenuation');
  const [isLaserOn, setIsLaserOn] = useState(false);
  const [laserPower, setLaserPower] = useState(35);
  const [cableLength, setCableLength] = useState(1);
  const [measurements, setMeasurements] = useState({
    low: { cable1m: null, cable5m: null },
    high: { cable1m: null, cable5m: null },
  });
  const [naCableLength, setNaCableLength] = useState(1);
  const [naDistance, setNaDistance] = useState(40);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const powerBand = laserPower <= 50 ? 'low' : 'high';
  const powerBandLabel = powerBand === 'low' ? 'Low' : 'High';

  const getBandInputFactor = (band) => (band === 'low' ? 0.82 : 1.18);

  const getAttenuationCoefficient = (band, length) => {
    const powerTerm = band === 'low' ? 18 : 36;
    const lengthTerm = length === 5 ? 12 : 0;
    return ATTENUATION_BASE_DB_PER_KM + powerTerm + lengthTerm;
  };

  // The source power is unknown, so we simulate only the output measured by the power meter.
  const calculateMeterOutput = (band, length) => {
    const sliderFactor = 0.5 + laserPower / 100;
    const launchPower = 1.25 * getBandInputFactor(band) * sliderFactor;
    const lossDbPerKm = getAttenuationCoefficient(band, length);
    const distanceKm = length / 1000;
    const measuredPower = launchPower * Math.pow(10, (-lossDbPerKm * distanceKm) / 10);
    return measuredPower;
  };

  const currentMeterReading = isLaserOn ? calculateMeterOutput(powerBand, cableLength) : 0;

  const calculateAttenuation = (band) => {
    const pi = measurements[band].cable1m;
    const pf = measurements[band].cable5m;

    if (!pi || !pf || pi <= 0 || pf <= 0) return null;

    const attenuationDbPerMeter = (10 * Math.log10(pi / pf)) / LENGTH_DIFFERENCE_M;
    return attenuationDbPerMeter * 1000;
  };

  const attenuationLow = calculateAttenuation('low');
  const attenuationHigh = calculateAttenuation('high');

  const calculateSpotWidth = (length, distance) => {
    const baseAngleDeg = length === 1 ? 16 : 12.5;
    const effectiveAngleRad = (baseAngleDeg * Math.PI) / 180;
    const width = 2 * distance * Math.tan(effectiveAngleRad);
    return width;
  };

  const naLaserPower = 100;
  const spotWidth = calculateSpotWidth(naCableLength, naDistance);
  const numericalAperture = spotWidth / Math.sqrt(4 * naDistance * naDistance + spotWidth * spotWidth);
  const acceptanceHalfAngleDeg = (Math.asin(Math.min(numericalAperture, 1)) * 180) / Math.PI;
  const acceptanceConeDeg = acceptanceHalfAngleDeg * 2;

  const recordMeasurement = () => {
    if (!isLaserOn) return;

    const cableKey = cableLength === 1 ? 'cable1m' : 'cable5m';

    setMeasurements((prev) => ({
      ...prev,
      [powerBand]: {
        ...prev[powerBand],
        [cableKey]: Number(currentMeterReading.toFixed(4)),
      },
    }));
  };

  const clearMeasurements = () => {
    setMeasurements({
      low: { cable1m: null, cable5m: null },
      high: { cable1m: null, cable5m: null },
    });
  };

  const exportData = () => {
    const rows = [
      ['Fiber Optics Virtual Lab'],
      [''],
      ['Attenuation Experiment'],
      ['Power band', '1 m output (mW)', '5 m output (mW)', 'Attenuation (dB/km)'],
      ['Low', measurements.low.cable1m ?? '-', measurements.low.cable5m ?? '-', attenuationLow !== null ? attenuationLow.toFixed(3) : 'Incomplete'],
      ['High', measurements.high.cable1m ?? '-', measurements.high.cable5m ?? '-', attenuationHigh !== null ? attenuationHigh.toFixed(3) : 'Incomplete'],
      [''],
      ['Formula', '10 log10(Pi / Pf) / L'],
      ['Pi', 'Power output with 1 meter cable'],
      ['Pf', 'Power output with 5 meter cable'],
      ['L', '4 meter'],
      [''],
      ['Numerical Aperture Experiment'],
      ['Cable length (m)', naCableLength],
      ['Screen distance L (mm)', naDistance.toFixed(2)],
      ['Spot width W (mm)', spotWidth.toFixed(2)],
      ['NA', numericalAperture.toFixed(4)],
      ['Acceptance half-angle (deg)', acceptanceHalfAngleDeg.toFixed(2)],
      ['Full cone angle (deg)', acceptanceConeDeg.toFixed(2)],
      ['Formula', 'NA = W / sqrt(4L^2 + W^2)'],
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
      x: 145,
      y: height / 2 + (Math.random() - 0.5) * 20,
      vx: 2.8 + Math.random() * 1.4,
      vy: (Math.random() - 0.5) * 1.2,
      radius: 2 + laserPower / 50,
      alpha: 0.55 + laserPower / 180,
    });

    const createNaParticle = () => ({
      t: 0,
      speed: 0.012 + Math.random() * 0.008,
      offset: (Math.random() - 0.5) * 0.8,
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
        const beamStrength = isLaserOn ? laserPower / 100 : 0;

        ctx.fillStyle = 'rgba(146, 197, 255, 0.18)';
        ctx.fillRect(fiberStartX, centerY - claddingHalfHeight, fiberEndX - fiberStartX, claddingHalfHeight * 2);
        ctx.strokeStyle = 'rgba(191, 219, 254, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeRect(fiberStartX, centerY - claddingHalfHeight, fiberEndX - fiberStartX, claddingHalfHeight * 2);

        ctx.fillStyle = 'rgba(96, 165, 250, 0.34)';
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
          beam.addColorStop(0, `rgba(255, 70, 70, ${0.45 + beamStrength * 0.45})`);
          beam.addColorStop(1, 'rgba(255, 120, 120, 0.15)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(128, centerY - 10 - beamStrength * 12);
          ctx.lineTo(fiberStartX, centerY - 15 - beamStrength * 8);
          ctx.lineTo(fiberStartX, centerY + 15 + beamStrength * 8);
          ctx.lineTo(128, centerY + 10 + beamStrength * 12);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(fiberEndX + 26, centerY - 56, 95, 112);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(fiberEndX + 38, centerY - 38, 70, 34);
        drawText(`${currentMeterReading.toFixed(4)} mW`, fiberEndX + 46, centerY - 16, '#052e16', 'bold 12px Arial');
        ctx.fillStyle = '#111827';
        ctx.fillRect(fiberEndX + 16, centerY - 14, 10, 28);
        drawText('Power Meter', fiberEndX + 30, centerY + 28, '#f8fafc', 'bold 13px Arial');

        if (isLaserOn && Math.random() < 0.82) {
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
          const cableFade = cableLength === 5 ? 0.78 : 0.38;
          const bandFade = powerBand === 'high' ? 0.62 : 0.45;
          const alpha = particle.alpha * Math.max(0.12, 1 - progress * (cableFade + bandFade * 0.22));

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
        drawText(`n1 = ${CORE_REFRACTIVE_INDEX}, n2 = ${CLADDING_REFRACTIVE_INDEX}, n1 > n2`, 22, height - 32);
      } else {
        const fiberTipX = 120;
        const centerY = height / 2;
        const screenX = Math.min(width - 100, fiberTipX + 140 + naDistance * 7);
        const coneHalfHeight = Math.max(20, Math.min(100, spotWidth * 1.7));
        const activeIntensity = isLaserOn ? naLaserPower / 100 : 0.18;
        const thetaRad = Math.asin(Math.min(numericalAperture, 1));

        ctx.fillStyle = 'rgba(146, 197, 255, 0.18)';
        ctx.fillRect(35, centerY - 42, 85, 84);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.36)';
        ctx.fillRect(50, centerY - 22, 70, 44);
        drawText('Fiber', 62, centerY - 54, '#e0f2fe', 'bold 13px Arial');

        ctx.strokeStyle = `rgba(248, 113, 113, ${0.75 * activeIntensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY - coneHalfHeight);
        ctx.moveTo(fiberTipX, centerY);
        ctx.lineTo(screenX, centerY + coneHalfHeight);
        ctx.stroke();

        const coneFill = ctx.createLinearGradient(fiberTipX, centerY, screenX, centerY);
        coneFill.addColorStop(0, `rgba(248, 113, 113, ${0.38 * activeIntensity})`);
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
        drawText('Screen', screenX - 20, centerY - coneHalfHeight - 28, '#f8fafc', 'bold 13px Arial');

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fiberTipX, centerY + coneHalfHeight + 40);
        ctx.lineTo(screenX, centerY + coneHalfHeight + 40);
        ctx.stroke();
        drawText(`L = ${naDistance.toFixed(1)} mm`, (fiberTipX + screenX) / 2 - 26, centerY + coneHalfHeight + 58, '#fde68a');

        ctx.beginPath();
        ctx.moveTo(screenX + 28, centerY - coneHalfHeight);
        ctx.lineTo(screenX + 28, centerY + coneHalfHeight);
        ctx.stroke();
        drawText(`W = ${spotWidth.toFixed(1)} mm`, screenX + 36, centerY + 4, '#fde68a');

        if (isLaserOn && Math.random() < 0.7) {
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
        ctx.arc(fiberTipX, centerY, 50, -thetaRad, thetaRad);
        ctx.stroke();

        drawText('Numerical Aperture Setup', 24, 28, '#f8fafc', 'bold 18px Arial');
        drawText(`Maximum source level`, width - 220, 28);
        drawText(`${naCableLength} m cable`, width - 220, 50);
        drawText(`NA = ${numericalAperture.toFixed(4)}`, width - 220, 72);
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
    laserPower,
    naCableLength,
    naDistance,
    numericalAperture,
    powerBand,
    spotWidth,
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#dbeafe_45%,_#bfdbfe)] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-slate-800">Optical Fiber Virtual Lab</h1>
          <p className="text-slate-600">
            Two experiments: attenuation and numerical aperture with acceptance angle.
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
                    <p className="mt-2 text-xs text-slate-500">
                      Keep the slider in the low region to record low power, and in the high region to record high power.
                    </p>
                  </div>

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
                      <Button
                        onClick={() => setNaCableLength(1)}
                        variant={naCableLength === 1 ? 'default' : 'outline'}
                        className={naCableLength === 1 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        1 meter
                      </Button>
                      <Button
                        onClick={() => setNaCableLength(5)}
                        variant={naCableLength === 5 ? 'default' : 'outline'}
                        className={naCableLength === 5 ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        5 meters
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-700">
                      Screen distance from source: {naDistance.toFixed(1)} mm
                    </div>
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
                      <div className="text-xs uppercase tracking-wide text-slate-500">Spot diameter</div>
                      <div className="mt-1 text-2xl font-bold text-amber-700">{spotWidth.toFixed(2)} mm</div>
                    </div>
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Numerical aperture</div>
                      <div className="mt-1 text-2xl font-bold text-sky-700">{numericalAperture.toFixed(4)}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Acceptance cone angle</div>
                      <div className="mt-1 text-xl font-bold text-emerald-700">{acceptanceConeDeg.toFixed(2)} deg</div>
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
            </div>

            {activeExperiment === 'attenuation' ? (
              <div className="rounded-3xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Attenuation Readings</h2>
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
                        <th className="border px-4 py-3 text-left">Power level</th>
                        <th className="border px-4 py-3 text-left">1 meter output</th>
                        <th className="border px-4 py-3 text-left">5 meter output</th>
                        <th className="border px-4 py-3 text-left">Attenuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-slate-50">
                        <td className="border px-4 py-3 font-semibold">Low</td>
                        <td className="border px-4 py-3">
                          {measurements.low.cable1m !== null ? `${measurements.low.cable1m} mW` : 'Not recorded'}
                        </td>
                        <td className="border px-4 py-3">
                          {measurements.low.cable5m !== null ? `${measurements.low.cable5m} mW` : 'Not recorded'}
                        </td>
                        <td className="border px-4 py-3 font-semibold text-sky-700">
                          {attenuationLow !== null ? `${attenuationLow.toFixed(3)} dB/km` : 'Incomplete'}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="border px-4 py-3 font-semibold">High</td>
                        <td className="border px-4 py-3">
                          {measurements.high.cable1m !== null ? `${measurements.high.cable1m} mW` : 'Not recorded'}
                        </td>
                        <td className="border px-4 py-3">
                          {measurements.high.cable5m !== null ? `${measurements.high.cable5m} mW` : 'Not recorded'}
                        </td>
                        <td className="border px-4 py-3 font-semibold text-violet-700">
                          {attenuationHigh !== null ? `${attenuationHigh.toFixed(3)} dB/km` : 'Incomplete'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold">Formula used</div>
                  <div className="mt-1">Attenuation = 10 log10(Pi / Pf) / L</div>
                  <div className="mt-1">Pi = output power with 1 meter cable</div>
                  <div className="mt-1">Pf = output power with 5 meter cable</div>
                  <div className="mt-1">L = 4 meter</div>
                  <div className="mt-1">Final unit = dB/km</div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-6 shadow-xl">
                <div className="mb-4 text-xl font-bold text-slate-800">Numerical Aperture Results</div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm text-slate-500">Cable</div>
                    <div className="mt-2 text-2xl font-bold text-amber-700">{naCableLength} m</div>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="text-sm text-slate-500">Screen distance</div>
                    <div className="mt-2 text-2xl font-bold text-blue-700">{naDistance.toFixed(1)} mm</div>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <div className="text-sm text-slate-500">NA</div>
                    <div className="mt-2 text-2xl font-bold text-sky-700">{numericalAperture.toFixed(4)}</div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-sm text-slate-500">Acceptance angle</div>
                    <div className="mt-2 text-2xl font-bold text-emerald-700">{acceptanceConeDeg.toFixed(2)} deg</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold">Formula used</div>
                  <div className="mt-1">NA = W / sqrt(4L^2 + W^2)</div>
                  <div className="mt-1">Acceptance half-angle = sin^-1(NA)</div>
                  <div className="mt-1">Full acceptance cone = 2 x acceptance half-angle</div>
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
