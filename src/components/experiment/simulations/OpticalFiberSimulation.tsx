import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Power, Zap, Activity } from 'lucide-react';

const OpticalFiberLab = () => {
  const [cableLength, setCableLength] = useState(1); // 1m or 5m
  const [inputPower, setInputPower] = useState(5); // mW
  const [isLaserOn, setIsLaserOn] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Fixed wavelength for laser diode (650nm - red laser)
  const wavelength = 650;
  
  // Calculate attenuation coefficient based on cable quality (typical for plastic/glass fiber)
  const attenuationCoefficient = cableLength === 1 ? 0.5 : 0.5; // dB/km

  // Calculate output power: P_out = P_in × 10^(-α × L / 10)
  const calculateOutputPower = () => {
    const lengthInKm = cableLength / 1000;
    const outputPower = inputPower * Math.pow(10, (-attenuationCoefficient * lengthInKm) / 10);
    return outputPower;
  };

  // Calculate attenuation in dB: Attenuation = 10 × log10(P_in / P_out)
  const calculateAttenuation = () => {
    const outputPower = calculateOutputPower();
    const attenuation = 10 * Math.log10(inputPower / outputPower);
    return attenuation;
  };

  const outputPower = calculateOutputPower();
  const attenuation = calculateAttenuation();

  // Add measurement to table
  const takeMeasurement = () => {
    const newMeasurement = {
      id: Date.now(),
      cableLength,
      inputPower: inputPower.toFixed(2),
      outputPower: outputPower.toFixed(4),
      attenuation: attenuation.toFixed(4),
    };
    setMeasurements(prev => [...prev, newMeasurement]);
  };

  // Clear all measurements
  const clearMeasurements = () => {
    setMeasurements([]);
  };

  // Export data as CSV
  const exportData = () => {
    if (measurements.length === 0) return;

    const csvData = [
      ['Cable Length (m)', 'Input Power (mW)', 'Output Power (mW)', 'Attenuation (dB)'],
      ...measurements.map(m => [m.cableLength, m.inputPower, m.outputPower, m.attenuation])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fiber_optics_measurements.csv';
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
    let animationTime = 0;

    // Create light particles
    const createParticle = () => {
      return {
        x: 80,
        y: height / 2 + (Math.random() - 0.5) * 20,
        speed: 3 + Math.random() * 2,
        life: 1.0,
        angle: (Math.random() - 0.5) * 0.3,
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw fiber cable (transparent with core and cladding)
      const fiberStartX = 100;
      const fiberEndX = width - 100;
      const fiberY = height / 2;
      const coreRadius = 25;
      const claddingRadius = 35;

      // Draw cladding (outer layer)
      ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(fiberStartX, fiberY - claddingRadius, fiberEndX - fiberStartX, claddingRadius * 2, 10);
      ctx.fill();

      // Draw core (inner layer)
      ctx.fillStyle = 'rgba(180, 200, 255, 0.5)';
      ctx.beginPath();
      ctx.roundRect(fiberStartX, fiberY - coreRadius, fiberEndX - fiberStartX, coreRadius * 2, 8);
      ctx.fill();

      // Draw fiber outline
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fiberStartX, fiberY - claddingRadius, fiberEndX - fiberStartX, claddingRadius * 2, 10);
      ctx.stroke();

      // Draw laser diode (source)
      ctx.fillStyle = isLaserOn ? '#ef4444' : '#6b7280';
      ctx.beginPath();
      ctx.arc(50, fiberY, 20, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = isLaserOn ? '#fca5a5' : '#9ca3af';
      ctx.beginPath();
      ctx.arc(50, fiberY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Laser beam to fiber
      if (isLaserOn) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(70, fiberY);
        ctx.lineTo(fiberStartX, fiberY);
        ctx.stroke();
      }

      // Draw photodetector (receiver)
      ctx.fillStyle = outputPower > 0.1 ? '#22c55e' : '#6b7280';
      ctx.fillRect(fiberEndX + 20, fiberY - 25, 40, 50);
      ctx.fillStyle = '#000';
      ctx.font = '12px monospace';
      ctx.fillText('PD', fiberEndX + 30, fiberY + 5);

      // Animate light particles with total internal reflection
      if (isLaserOn) {
        // Add new particles
        if (Math.random() > 0.7) {
          lightParticles.push(createParticle());
        }

        // Update and draw particles
        lightParticles = lightParticles.filter(p => {
          p.x += p.speed;
          p.y += Math.sin(p.x / 30) * p.angle * 2;

          // Total internal reflection boundaries
          const relativeY = p.y - fiberY;
          if (Math.abs(relativeY) > coreRadius - 3) {
            p.angle = -p.angle; // Reflect
            p.y = fiberY + Math.sign(relativeY) * (coreRadius - 3);
          }

          // Calculate intensity based on distance (attenuation)
          const progress = (p.x - fiberStartX) / (fiberEndX - fiberStartX);
          const intensity = Math.pow(outputPower / inputPower, progress);
          p.life = Math.max(0, intensity);

          // Draw particle with trail
          if (p.x < fiberEndX && p.life > 0) {
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
            gradient.addColorStop(0, `rgba(255, 50, 50, ${p.life * 0.8})`);
            gradient.addColorStop(1, `rgba(255, 100, 100, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Draw reflection lines
            ctx.strokeStyle = `rgba(255, 150, 150, ${p.life * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x - 10, p.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }

          return p.x < fiberEndX + 50 && p.life > 0;
        });
      }

      // Draw labels
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Laser Diode', 20, fiberY - 40);
      ctx.fillText('Optical Fiber', width / 2 - 40, fiberY - 50);
      ctx.fillText('Photodetector', fiberEndX + 10, fiberY - 40);

      // Draw cable length indicator
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(fiberStartX, fiberY + claddingRadius + 15);
      ctx.lineTo(fiberEndX, fiberY + claddingRadius + 15);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${cableLength}m`, (fiberStartX + fiberEndX) / 2 - 15, fiberY + claddingRadius + 35);

      animationTime++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLaserOn, cableLength, inputPower, outputPower]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Optical Fiber Attenuation Virtual Lab
          </h1>
          <p className="text-gray-600">
            Visualize light propagation and measure power attenuation in optical fibers
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

              {/* Cable Length Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cable Length
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setCableLength(1)}
                    variant={cableLength === 1 ? 'default' : 'outline'}
                    className="w-full"
                  >
                    1 meter
                  </Button>
                  <Button
                    onClick={() => setCableLength(5)}
                    variant={cableLength === 5 ? 'default' : 'outline'}
                    className="w-full"
                  >
                    5 meters
                  </Button>
                </div>
              </div>

              {/* Input Power Control */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Input Power: {inputPower.toFixed(1)} mW
                </label>
                <Slider
                  min={1}
                  max={10}
                  step={0.5}
                  value={[inputPower]}
                  onValueChange={values => setInputPower(values[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Min (1 mW)</span>
                  <span>Max (10 mW)</span>
                </div>
              </div>

              {/* Measurements Display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">Input Power</div>
                  <div className="text-lg font-bold text-blue-700">
                    {inputPower.toFixed(2)} mW
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Output Power</div>
                  <div className="text-lg font-bold text-green-700">
                    {outputPower.toFixed(4)} mW
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Attenuation</div>
                <div className="text-2xl font-bold text-orange-700">
                  {attenuation.toFixed(4)} dB
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Formula: 10 × log₁₀(Pᵢₙ / Pₒᵤₜ)
                </div>
              </div>

              {/* Measurement Button */}
              <Button
                onClick={takeMeasurement}
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
                Total Internal Reflection Visualization
              </h2>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={300}
                  className="w-full"
                />
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Watch:</strong> Light particles travel through the fiber core, reflecting off the boundary 
                  between core and cladding (total internal reflection). Notice how intensity decreases along the fiber 
                  due to attenuation.
                </p>
              </div>
            </div>

            {/* Measurement Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recorded Measurements</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={exportData}
                    disabled={measurements.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    Export CSV
                  </Button>
                  <Button
                    onClick={clearMeasurements}
                    disabled={measurements.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Cable Length (m)</th>
                      <th className="px-4 py-2 text-left">Input Power (mW)</th>
                      <th className="px-4 py-2 text-left">Output Power (mW)</th>
                      <th className="px-4 py-2 text-left">Attenuation (dB)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No measurements recorded yet. Turn on the laser and click "Record Measurement"
                        </td>
                      </tr>
                    ) : (
                      measurements.map(m => (
                        <tr key={m.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{m.cableLength}</td>
                          <td className="px-4 py-2">{m.inputPower}</td>
                          <td className="px-4 py-2">{m.outputPower}</td>
                          <td className="px-4 py-2 font-semibold text-orange-600">{m.attenuation}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Theory Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Understanding the Experiment</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Total Internal Reflection:</strong> Light travels through the fiber core by continuously 
                  reflecting off the boundary with the cladding. This occurs because the core has a higher refractive 
                  index than the cladding.
                </p>
                <p>
                  <strong>Attenuation:</strong> As light travels through the fiber, some energy is lost due to 
                  absorption, scattering, and other factors. This power loss is measured in decibels (dB).
                </p>
                <p>
                  <strong>Formula:</strong> Attenuation (dB) = 10 × log₁₀(Pᵢₙ / Pₒᵤₜ)
                  <br />
                  where Pᵢₙ is input power and Pₒᵤₜ is output power
                </p>
                <p>
                  <strong>Expected Result:</strong> Longer cables show higher attenuation. Try measuring both 1m and 5m 
                  cables at different power levels to see the relationship!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalFiberLab;
