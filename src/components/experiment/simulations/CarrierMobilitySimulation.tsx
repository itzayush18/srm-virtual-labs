import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
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

// Material properties
const materialProperties = {
  silicon: {
    name: 'Silicon (Si)',
    bandgap: 1.12,
    effectiveMass: 1.08,
    baseCarrierMobility: 1450,
  },
  germanium: {
    name: 'Germanium (Ge)',
    bandgap: 0.67,
    effectiveMass: 0.55,
    baseCarrierMobility: 3900,
  },
  gallium_arsenide: {
    name: 'Gallium Arsenide (GaAs)',
    bandgap: 1.43,
    effectiveMass: 0.067,
    baseCarrierMobility: 8500,
  },
};

// Scattering mechanisms
const scatteringMechanisms = [
  {
    id: 'phonon',
    name: 'Phonon Scattering',
    description: 'Scattering by lattice vibrations',
    temperatureDependence: -1.5,
  },
  {
    id: 'impurity',
    name: 'Impurity Scattering',
    description: 'Scattering by dopant ions',
    temperatureDependence: 1.5,
  },
  {
    id: 'carrier',
    name: 'Carrier-Carrier Scattering',
    description: 'Interactions between carriers',
    temperatureDependence: 0,
  },
];

const CarrierMobilitySimulation = () => {
  // State for simulation parameters
  const [materialType, setMaterialType] = useState('silicon');
  const [temperature, setTemperature] = useState(300); // K
  const [dopingConcentration, setDopingConcentration] = useState(1e16); // cm^-3
  const [activeScatteringMechanisms, setActiveScatteringMechanisms] = useState({
    phonon: true,
    impurity: true,
    carrier: false,
  });
  interface ChartDataPoint {
    temperature: number;
    mobility: number;
  }
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Calculate carrier mobility based on physical models
  const calculateCarrierMobility = React.useCallback(
    (temp: number, doping: number, material: string) => {
      const materialInfo = materialProperties[material as keyof typeof materialProperties];
      let mobility = materialInfo.baseCarrierMobility;

      // Temperature dependence (phonon scattering)
      if (activeScatteringMechanisms.phonon) {
        mobility *= Math.pow(temp / 300, scatteringMechanisms[0].temperatureDependence);
      }

      // Impurity scattering (Brooks-Herring model simplified)
      if (activeScatteringMechanisms.impurity) {
        const impurityFactor = 1 / (1 + Math.pow(doping / 1e16, 0.5));
        mobility *= impurityFactor;
      }

      // Carrier-carrier scattering (simple model)
      if (activeScatteringMechanisms.carrier && doping > 1e18) {
        mobility *= 0.8; // Reduce mobility by 20% for high doping concentrations
      }

      return Math.max(mobility, 10); // Ensure mobility doesn't go too low
    },
    [activeScatteringMechanisms]
  );

  // Run a full temperature sweep simulation
  const runSimulation = () => {
    setSimulationRunning(true);
    const newData = [];

    // Generate data points for different temperatures
    for (let temp = 100; temp <= 500; temp += 20) {
      const mobility = calculateCarrierMobility(temp, dopingConcentration, materialType);
      newData.push({
        temperature: temp,
        mobility: Math.round(mobility),
      });
    }

    setChartData(newData);
    setSimulationRunning(false);
  };

  // Update mobility calculation when parameters change
  useEffect(() => {
    const mobility = calculateCarrierMobility(temperature, dopingConcentration, materialType);
    // Could update real-time values here
  }, [temperature, dopingConcentration, materialType, activeScatteringMechanisms, calculateCarrierMobility]);

  // Toggle scattering mechanism
  const toggleScatteringMechanism = (mechanismId: string) => {
    setActiveScatteringMechanisms(prev => ({
      ...prev,
      [mechanismId]: !prev[mechanismId as keyof typeof prev],
    }));
  };

  // Format doping concentration for display
  const formatDopingConcentration = (value: number) => {
    if (value >= 1e18) return `${(value / 1e18).toFixed(2)}×10¹⁸`;
    if (value >= 1e15) return `${(value / 1e15).toFixed(2)}×10¹⁵`;
    return `${(value / 1e14).toFixed(2)}×10¹⁴`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-lab-blue">Carrier Mobility Controls</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Semiconductor Material</label>
            <Select value={materialType} onValueChange={setMaterialType}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="silicon">Silicon (Si)</SelectItem>
                <SelectItem value="germanium">Germanium (Ge)</SelectItem>
                <SelectItem value="gallium_arsenide">Gallium Arsenide (GaAs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature (K): {temperature}</label>
            <div className="flex items-center space-x-2">
              <Slider
                min={100}
                max={500}
                step={5}
                value={[temperature]}
                onValueChange={values => setTemperature(values[0])}
              />
              <span className="min-w-[40px] text-right">{temperature}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Doping Concentration (cm⁻³): {formatDopingConcentration(dopingConcentration)}
            </label>
            <div className="flex items-center space-x-2">
              <Slider
                min={1e14}
                max={1e19}
                step={1e14}
                value={[dopingConcentration]}
                onValueChange={values => setDopingConcentration(values[0])}
              />
              <span className="min-w-[80px] text-right">
                {formatDopingConcentration(dopingConcentration)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Active Scattering Mechanisms</label>
            <div className="space-y-1">
              {scatteringMechanisms.map(mechanism => (
                <div key={mechanism.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={mechanism.id}
                    checked={
                      activeScatteringMechanisms[
                        mechanism.id as keyof typeof activeScatteringMechanisms
                      ]
                    }
                    onChange={() => toggleScatteringMechanism(mechanism.id)}
                    className="mr-2"
                  />
                  <label htmlFor={mechanism.id} className="text-sm">
                    {mechanism.name}
                    <span className="text-xs text-gray-500 ml-1">
                      (T<sup>{mechanism.temperatureDependence}</sup>)
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={runSimulation} disabled={simulationRunning}>
            {simulationRunning ? 'Simulating...' : 'Run Temperature Sweep'}
          </Button>
        </div>

        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">Material Properties:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Bandgap:</div>
            <div>
              {materialProperties[materialType as keyof typeof materialProperties].bandgap} eV
            </div>

            <div>Effective Mass:</div>
            <div>
              {materialProperties[materialType as keyof typeof materialProperties].effectiveMass} m₀
            </div>

            <div>Max Mobility:</div>
            <div>
              {
                materialProperties[materialType as keyof typeof materialProperties]
                  .baseCarrierMobility
              }{' '}
              cm²/Vs
            </div>
          </div>
        </Card>
      </div>

      {/* Visualization Panel */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-lab-blue">Carrier Mobility Results</h3>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="mb-4">
            <h4 className="text-md font-medium">Current Mobility:</h4>
            <div className="text-3xl font-bold text-lab-teal">
              {Math.round(calculateCarrierMobility(temperature, dopingConcentration, materialType))}{' '}
              cm²/Vs
            </div>
          </div>

          <div className="text-sm space-y-1">
            <div>
              Material: {materialProperties[materialType as keyof typeof materialProperties].name}
            </div>
            <div>Temperature: {temperature} K</div>
            <div>Doping: {formatDopingConcentration(dopingConcentration)} cm⁻³</div>
          </div>
        </div>

        <div className="h-64 border border-gray-200 rounded-md p-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="temperature"
                  label={{ value: 'Temperature (K)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis label={{ value: 'Mobility (cm²/Vs)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={value => [`${value} cm²/Vs`, 'Mobility']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="mobility"
                  name="Carrier Mobility"
                  stroke="#1a237e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Run temperature sweep simulation to see mobility vs. temperature curve
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-md text-sm">
          <h4 className="font-medium mb-1">Key Physics Concepts:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Higher temperatures increase phonon scattering, reducing mobility</li>
            <li>Higher doping concentrations increase impurity scattering</li>
            <li>Different materials have different intrinsic carrier mobilities</li>
            <li>Combined scattering effects follow Matthiessen's rule (1/μ = 1/μ₁ + 1/μ₂ + ...)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CarrierMobilitySimulation;
