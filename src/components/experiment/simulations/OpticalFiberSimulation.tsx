import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Power, Zap, Activity } from 'lucide-react';

const OpticalFiberLab = () => {
  const [cableLength, setCableLength] = useState(1); // 1m or 5m
  const [sourceLevel, setSourceLevel] = useState('A'); // A (min) or B (max)
  const [sourcePowerA, setSourcePowerA] = useState(3); // Min source level (mW)
  const [sourcePowerB, setSourcePowerB] = useState(8); // Max source level (mW)
  const [isLaserOn, setIsLaserOn] = useState(false);
  const [measurements, setMeasurements] = useState({
    cable1m: { sourceA: null, sourceB: null },
    cable5m: { sourceA: null, sourceB: null }
  });
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Fixed wavelength for laser diode (650nm - red laser)
  const wavelength = 650;
  
  // Attenuation coefficient (typical for optical fiber)
  const attenuationCoefficient = 0.5; // dB/km

  // Get current input power based on source level
  const getCurrentInputPower = () => {
    return sourceLevel === 'A' ? sourcePowerA : sourcePowerB;
  };

  // Calculate output power: P_out = P_in × 10^(-α × L / 10)
  const calculateOutputPower = (inputPower, length) => {
    const lengthInKm = length / 1000;
    return inputPower * Math.pow(10, (-attenuationCoefficient * lengthInKm) / 10);
  };

  const currentInputPower = getCurrentInputPower();
  const currentOutputPower = calculateOutputPower(currentInputPower, cableLength);

  // Calculate attenuation using the formula: α = 10 × log10(P1/P5) / L
  // where P1 is output power at 1m, P5 is output power at 5m, L is 4m
  const calculateFinalAttenuation = (sourceType) => {
    const power1m = measurements.cable1m[sourceType];
    const power5m = measurements.cable5m[sourceType];
    
    if (power1m && power5m) {
      const attenuation = (10 * Math.log10(power1m / power5m)) / 4;
      return attenuation;
    }
    return null;
  };

  const attenuationA = calculateFinalAttenuation('sourceA');
  const attenuationB = calculateFinalAttenuation('sourceB');

  // Record measurement
  const recordMeasurement = () => {
    if (!isLaserOn) return;

    const outputPower = currentOutputPower;
    const cable = cableLength === 1 ? 'cable1m' : 'cable5m';
    const source = sourceLevel === 'A' ? 'sourceA' : 'sourceB';

    setMeasurements(prev => ({
      ...prev,
      [cable]: {
        ...prev[cable],
        [source]: parseFloat(outputPower.toFixed(4))
      }
    }));
  };

  // Clear all measurements
  const clearMeasurements = () => {
    setMeasurements({
      cable1m: { sourceA: null, sourceB: null },
      cable5m: { sourceA: null, sourceB: null }
    });
  };

  // Export data as CSV
  const exportData = () => {
    const csvData = [
      ['Measurement', 'Cable Length', 'Source Level', 'Input Power (mW)', 'Output Power (mW)'],
      ['1', '1m', 'A (Min)', sourcePowerA.toFixed(2), measurements.cable1m.sourceA || '-'],
      ['2', '1m', 'B (Max)', sourcePowerB.toFixed(2), measurements.cable1m.sourceB || '-'],
      ['3', '5m', 'A (Min)', sourcePowerA.toFixed(2), measurements.cable5m.sourceA || '-'],
      ['4', '5m', 'B (Max)', sourcePowerB.toFixed(2), measurements.cable5m.sourceB || '-'],
      [''],
      ['Attenuation Calculations'],
      ['Source Level A (Min)', attenuationA ? attenuationA.toFixed(4) + ' dB/m' : 'Incomplete'],
      ['Source Level B (Max)', attenuationB ? attenuationB.toFixed(4) + ' dB/m' : 'Incomplete'],
      [''],
      ['Formula: α = 10 × log₁₀(P₁/P₅) / 4'],
      ['Where P₁ = Output at 1m, P₅ = Output at 5m, Length difference = 4m']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fiber_optics_attenuation.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Animation for fiber optics visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let lightParticles = [];

    // Create light particle
    const createParticle = () => {
      return {
        x: 80,
        y: height / 2 + (Math.random() - 0.5) * 15,
        speed: 4 + Math.random() * 1,
        life: 1.0,
        angle: (Math.random() - 0.5) * 0.4,
        size: 3 + Math.random() * 2,
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw fiber cable (transparent with core and cladding)
      const fiberStartX = 120;
      const fiberEndX = width - 100;
      const fiberY = height / 2;
      const coreRadius = 20;
      const claddingRadius = 30;

      // Draw cladding (outer layer)
      ctx.fillStyle = 'rgba(200, 220, 255, 0.25)';
      ctx.beginPath();
      ctx.roundRect(fiberStartX, fiberY - claddingRadius, fiberEndX - fiberStartX, claddingRadius * 2, 10);
      ctx.fill();

      // Draw core (inner layer)
      ctx.fillStyle = 'rgba(180, 200, 255, 0.4)';
      ctx.beginPath();
      ctx.roundRect(fiberStartX, fiberY - coreRadius, fiberEndX - fiberStartX, coreRadius * 2, 8);
      ctx.fill();

      // Draw fiber outline
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fiberStartX, fiberY - claddingRadius, fiberEndX - fiberStartX, claddingRadius * 2, 10);
      ctx.stroke();

      // Draw rectangular laser diode (source)
      const laserWidth = 50;
      const laserHeight = 40;
      const laserX = 30;
      const laserY = fiberY - laserHeight / 2;

      // Laser body
      ctx.fillStyle = isLaserOn ? '#dc2626' : '#4b5563';
      ctx.fillRect(laserX, laserY, laserWidth, laserHeight);
      
      // Laser lens/aperture
      ctx.fillStyle = isLaserOn ? '#fca5a5' : '#6b7280';
      ctx.fillRect(laserX + laserWidth - 10, laserY + 10, 10, 20);

      // Laser beam indicator
      if (isLaserOn) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(laserX + laserWidth - 10, laserY + 15, 5, 10);
      }

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('LASER', laserX + 8, fiberY + 3);

      // Laser beam to fiber (wider beam)
      if (isLaserOn) {
        const gradient = ctx.createLinearGradient(laserX + laserWidth, fiberY, fiberStartX, fiberY);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(laserX + laserWidth, fiberY - 12);
        ctx.lineTo(fiberStartX, fiberY - 15);
        ctx.lineTo(fiberStartX, fiberY + 15);
        ctx.lineTo(laserX + laserWidth, fiberY + 12);
        ctx.closePath();
        ctx.fill();
      }

      // Draw photodetector (receiver)
      const detectorWidth = 50;
      const detectorHeight = 60;
      const detectorX = fiberEndX + 20;
      const detectorY = fiberY - detectorHeight / 2;

      ctx.fillStyle = currentOutputPower > 0.1 ? '#16a34a' : '#4b5563';
      ctx.fillRect(detectorX, detectorY, detectorWidth, detectorHeight);

      // Detector aperture
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(detectorX, detectorY + 15, 10, 30);

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('PD', detectorX + 20, fiberY + 3);

      // Animate light particles with total internal reflection
      if (isLaserOn) {
        // Add new particles
        if (Math.random() > 0.6) {
          lightParticles.push(createParticle());
        }

        // Update and draw particles
        lightParticles = lightParticles.filter(p => {
          p.x += p.speed;
          p.y += Math.sin(p.x / 25) * p.angle * 1.5;

          // Total internal reflection boundaries
          const relativeY = p.y - fiberY;
          if (Math.abs(relativeY) > coreRadius - 2) {
            p.angle = -p.angle;
            p.y = fiberY + Math.sign(relativeY) * (coreRadius - 2);
            
            // Draw reflection point
            ctx.fillStyle = 'rgba(255, 200, 200, 0.4)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Calculate intensity based on distance (attenuation)
          const progress = (p.x - fiberStartX) / (fiberEndX - fiberStartX);
          const intensity = Math.pow(currentOutputPower / currentInputPower, progress);
          p.life = Math.max(0, intensity);

          // Draw particle
          if (p.x < fiberEndX && p.life > 0) {
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, `rgba(255, 50, 50, ${p.life * 0.9})`);
            gradient.addColorStop(1, `rgba(255, 100, 100, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }

          return p.x < fiberEndX + 30 && p.life > 0;
        });
      }

      // Draw labels
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Optical Fiber Core', width / 2 - 50, fiberY - 45);
      
      // Draw cable length indicator
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(fiberStartX, fiberY + claddingRadius + 20);
      ctx.lineTo(fiberEndX, fiberY + claddingRadius + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`Cable: ${cableLength}m`, (fiberStartX + fiberEndX) / 2 - 40, fiberY + claddingRadius + 40);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLaserOn, cableLength, currentInputPower, currentOutputPower]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Optical Fiber Attenuation Virtual Lab
          </h1>
          <p className="text-gray-600">
            Measure power output at 1m and 5m to calculate attenuation coefficient
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Control Panel
            </h2>

            <div className="space-y-6">
              {/* Laser Control */}
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Laser Diode (λ = {wavelength}nm)
                </label>
                <Button
                  onClick={() => setIsLaserOn(!isLaserOn)}
                  className={`w-full ${isLaserOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {isLaserOn ? 'Turn OFF Laser' : 'Turn ON Laser'}
                </Button>
              </div>

              {/* Source Level A (Min) */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source Level A (Min): {sourcePowerA.toFixed(1)} mW
                </label>
                <Slider
                  min={1}
                  max={5}
                  step={0.5}
                  value={[sourcePowerA]}
                  onValueChange={values => setSourcePowerA(values[0])}
                  className="w-full"
                />
              </div>

              {/* Source Level B (Max) */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source Level B (Max): {sourcePowerB.toFixed(1)} mW
                </label>
                <Slider
                  min={6}
                  max={10}
                  step={0.5}
                  value={[sourcePowerB]}
                  onValueChange={values => setSourcePowerB(values[0])}
                  className="w-full"
                />
              </div>

              {/* Source Level Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Source Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setSourceLevel('A')}
                    variant={sourceLevel === 'A' ? 'default' : 'outline'}
                    className={sourceLevel === 'A' ? 'bg-blue-600' : ''}
                  >
                    Level A (Min)
                  </Button>
                  <Button
                    onClick={() => setSourceLevel('B')}
                    variant={sourceLevel === 'B' ? 'default' : 'outline'}
                    className={sourceLevel === 'B' ? 'bg-purple-600' : ''}
                  >
                    Level B (Max)
                  </Button>
                </div>
              </div>

              {/* Cable Length Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cable Length
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setCableLength(1)}
                    variant={cableLength === 1 ? 'default' : 'outline'}
                  >
                    1 meter
                  </Button>
                  <Button
                    onClick={() => setCableLength(5)}
                    variant={cableLength === 5 ? 'default' : 'outline'}
                  >
                    5 meters
                  </Button>
                </div>
              </div>

              {/* Current Measurements */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">Input Power</div>
                  <div className="text-lg font-bold text-blue-700">
                    {currentInputPower.toFixed(2)} mW
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Output Power</div>
                  <div className="text-lg font-bold text-green-700">
                    {currentOutputPower.toFixed(4)} mW
                  </div>
                </div>
              </div>

              {/* Record Button */}
              <Button
                onClick={recordMeasurement}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!isLaserOn}
              >
                <Activity className="w-4 h-4 mr-2" />
                Record Measurement
              </Button>
            </div>
          </div>

          {/* Visualization and Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fiber Visualization */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Total Internal Reflection in Fiber
              </h2>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={300}
                  className="w-full"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Current Source</div>
                  <div className="text-xl font-bold text-blue-700">
                    Level {sourceLevel} ({sourceLevel === 'A' ? 'Min' : 'Max'})
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Cable Length</div>
                  <div className="text-xl font-bold text-indigo-700">
                    {cableLength} meter
                  </div>
                </div>
              </div>
            </div>

            {/* Measurement Results */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Measurement Results</h2>
                <div className="flex gap-2">
                  <Button onClick={exportData} variant="outline" size="sm">
                    Export CSV
                  </Button>
                  <Button onClick={clearMeasurements} variant="outline" size="sm">
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left border">Cable</th>
                      <th className="px-4 py-3 text-left border">Source A (Min)</th>
                      <th className="px-4 py-3 text-left border">Source B (Max)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold border">1 meter</td>
                      <td className="px-4 py-3 border">
                        <span className={measurements.cable1m.sourceA ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                          {measurements.cable1m.sourceA ? `${measurements.cable1m.sourceA} mW` : 'Not recorded'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border">
                        <span className={measurements.cable1m.sourceB ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                          {measurements.cable1m.sourceB ? `${measurements.cable1m.sourceB} mW` : 'Not recorded'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold border">5 meters</td>
                      <td className="px-4 py-3 border">
                        <span className={measurements.cable5m.sourceA ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                          {measurements.cable5m.sourceA ? `${measurements.cable5m.sourceA} mW` : 'Not recorded'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border">
                        <span className={measurements.cable5m.sourceB ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                          {measurements.cable5m.sourceB ? `${measurements.cable5m.sourceB} mW` : 'Not recorded'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Attenuation Calculations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Attenuation Coefficient Calculations</h3>
                
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Source Level A (Min):</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {attenuationA !== null ? `${attenuationA.toFixed(4)} dB/m` : 'Incomplete'}
                    </span>
                  </div>
                  {attenuationA !== null && (
                    <div className="text-xs text-gray-600 mt-2">
                      α = 10 × log₁₀({measurements.cable1m.sourceA}/{measurements.cable5m.sourceA}) / 4
                    </div>
                  )}
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Source Level B (Max):</span>
                    <span className="text-2xl font-bold text-purple-700">
                      {attenuationB !== null ? `${attenuationB.toFixed(4)} dB/m` : 'Incomplete'}
                    </span>
                  </div>
                  {attenuationB !== null && (
                    <div className="text-xs text-gray-600 mt-2">
                      α = 10 × log₁₀({measurements.cable1m.sourceB}/{measurements.cable5m.sourceB}) / 4
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="text-sm text-gray-700">
                    <strong>Formula:</strong> α = 10 × log₁₀(P₁/P₅) / L
                    <br />
                    <strong>Where:</strong>
                    <br />
                    • P₁ = Output power at 1 meter
                    <br />
                    • P₅ = Output power at 5 meters
                    <br />
                    • L = Length difference = 4 meters
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalFiberLab;
