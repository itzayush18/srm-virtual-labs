import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

// 3D Diode Component
const DiodeModel = ({
  voltage = 0,
  temperature = 300,
  saturationCurrent = 1e-12,
  idealityFactor = 1.5,
  position = [0, 0, 0],
}: {
  voltage: number;
  temperature: number;
  saturationCurrent: number;
  idealityFactor: number;
  position: [number, number, number];
}) => {
  const diodeRef = useRef<THREE.Group>(null);

  // For animation timing
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Calculate diode current using the Shockley equation
  const calculateCurrent = (voltage: number) => {
    // Constants
    const q = 1.602e-19; // Elementary charge in coulombs
    const k = 1.38e-23; // Boltzmann constant in J/K

    // Thermal voltage
    const vt = (k * temperature) / q;

    // Shockley diode equation: I = Is * (exp(V/nVt) - 1)
    return saturationCurrent * (Math.exp(voltage / (idealityFactor * vt * 1e5)) - 1);
  };

  // Current flowing through the diode
  const current = calculateCurrent(voltage);

  // Normalize current for visualization
  const normalizedCurrent = Math.min(1, Math.abs(current) / 1e-3);

  // Make electrons flow in the diode
  useFrame(({ clock }) => {
    if (diodeRef.current && voltage > 0) {
      // Gentle rotation based on current
      diodeRef.current.rotation.z = Math.sin(clock.getElapsedTime() * normalizedCurrent) * 0.05;
    }
  });

  // Forward voltage drop for silicon diode is around 0.7V
  const isForwardBiased = voltage > 0;
  const junctionTemperature = temperature + (isForwardBiased ? current * voltage * 100 : 0);

  // Color based on junction temperature
  const junctionColor = new THREE.Color();
  junctionColor.setHSL(
    isForwardBiased ? 0.05 : 0.6, // Red if forward biased, blue otherwise
    0.8,
    0.3 + (junctionTemperature - 300) / 300 // Brighter with higher temperature
  );

  return (
    <group ref={diodeRef} position={position}>
      {/* Cathode (negative) */}
      <mesh position={[-1, 0, 0]}>
        <boxGeometry args={[1, 0.8, 0.8]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {/* Anode (positive) */}
      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[1, 0.8, 0.8]} />
        <meshStandardMaterial color="#777" />
      </mesh>

      {/* Junction */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.6]} />
        <meshStandardMaterial
          color={junctionColor}
          emissive={junctionColor}
          emissiveIntensity={isForwardBiased ? normalizedCurrent : 0.1}
        />
      </mesh>

      {/* Diode symbol (triangle) */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0, 0.4, 0.8, 3, 1]} />
        <meshStandardMaterial color="#333" />
        <group rotation={[0, 0, Math.PI / 2]} />
      </mesh>

      {/* Cathode line */}
      <mesh position={[0.4, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Current flow visualization */}
      {isForwardBiased &&
        Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              -2 +
                ((clockRef.current.getElapsedTime() * normalizedCurrent * 2 + i * 0.7) % 4) -
                0.5,
              i % 2 === 0 ? 0.2 : -0.2,
              i % 3 === 0 ? 0.2 : -0.2,
            ]}
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#61dafb" />
          </mesh>
        ))}

      {/* Labels */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.2}
        color="#fff"
        anchorX="center"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {voltage.toFixed(2)}V
      </Text>

      <Text
        position={[0, -1.1, 0]}
        fontSize={0.2}
        color="#fff"
        anchorX="center"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {(current * 1e6).toFixed(2)}μA
      </Text>
    </group>
  );
};

// I-V Curve Visualization
const IVCurve = ({
  temperature = 300,
  saturationCurrent = 1e-12,
  idealityFactor = 1.5,
  selectedVoltage = 0,
  position = [0, 0, 0],
}: {
  temperature: number;
  saturationCurrent: number;
  idealityFactor: number;
  selectedVoltage: number;
  position: [number, number, number];
}) => {
  // Calculate diode current using the Shockley equation
  const calculateCurrent = (voltage: number) => {
    // Constants
    const q = 1.602e-19; // Elementary charge in coulombs
    const k = 1.38e-23; // Boltzmann constant in J/K

    // Thermal voltage
    const vt = (k * temperature) / q;

    // Shockley diode equation: I = Is * (exp(V/nVt) - 1)
    return saturationCurrent * (Math.exp(voltage / (idealityFactor * vt * 1e5)) - 1);
  };

  // Generate points for I-V curve
  const points = [];
  const voltageRange = 1.0; // +/- 1V
  const steps = 50;

  for (let i = 0; i <= steps; i++) {
    const v = -voltageRange + i * ((2 * voltageRange) / steps);
    const current = calculateCurrent(v);
    // Scale the current for visualization
    const logCurrent = (Math.sign(current) * Math.log10(1 + Math.abs(current) * 1e9)) / 9;
    points.push(new THREE.Vector3(v * 2, logCurrent * 2, 0));
  }

  // Create the selected point
  const selectedCurrent = calculateCurrent(selectedVoltage);
  const logSelectedCurrent =
    (Math.sign(selectedCurrent) * Math.log10(1 + Math.abs(selectedCurrent) * 1e9)) / 9;
  const selectedPoint = new THREE.Vector3(selectedVoltage * 2, logSelectedCurrent * 2, 0);

  // Create curve geometry
  const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group position={position}>
      {/* Graph background */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[4.5, 4.5]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Graph grid */}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`vertical-${i}`}>
          <bufferGeometry
            attach="geometry"
            {...new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-2 + i * 0.5, -2, 0.01),
              new THREE.Vector3(-2 + i * 0.5, 2, 0.01),
            ])}
          />
          <lineBasicMaterial color="#4b5563" opacity={0.3} transparent />
        </line>
      ))}

      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`horizontal-${i}`}>
          <bufferGeometry
            attach="geometry"
            {...new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-2, -2 + i * 0.5, 0.01),
              new THREE.Vector3(2, -2 + i * 0.5, 0.01),
            ])}
          />
          <lineBasicMaterial color="#4b5563" opacity={0.3} transparent />
        </line>
      ))}

      {/* Axes */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -2, 0.01),
            new THREE.Vector3(0, 2, 0.01),
          ])}
        />
        <lineBasicMaterial color="#fff" />
      </line>

      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-2, 0, 0.01),
            new THREE.Vector3(2, 0, 0.01),
          ])}
        />
        <lineBasicMaterial color="#fff" />
      </line>

      {/* I-V curve */}
      <line>
        <bufferGeometry attach="geometry" {...curveGeometry} />
        <lineBasicMaterial color="#10b981" />
      </line>

      {/* Selected point */}
      <mesh position={selectedPoint}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Labels */}
      <Text position={[0, 2.3, 0]} fontSize={0.2} color="#fff" anchorX="center">
        Current-Voltage Characteristic
      </Text>

      <Text position={[0, -2.3, 0]} fontSize={0.15} color="#fff" anchorX="center">
        Voltage (V)
      </Text>

      <Text
        position={[-2.3, 0, 0]}
        fontSize={0.15}
        color="#fff"
        rotation={[0, 0, Math.PI / 2]}
        anchorX="center"
      >
        Current (log scale)
      </Text>

      <Text position={[2.3, 0, 0]} fontSize={0.12} color="#cbd5e1" anchorX="right">
        T = {temperature}K
      </Text>

      <Text position={[2.3, -0.3, 0]} fontSize={0.12} color="#cbd5e1" anchorX="right">
        Is = {saturationCurrent.toExponential(2)}A
      </Text>

      <Text position={[2.3, -0.6, 0]} fontSize={0.12} color="#cbd5e1" anchorX="right">
        n = {idealityFactor.toFixed(2)}
      </Text>
    </group>
  );
};

// Main scene component
const DiodeIVScene: React.FC<{
  voltage: number;
  temperature: number;
  saturationCurrent: number;
  idealityFactor: number;
}> = ({ voltage, temperature, saturationCurrent, idealityFactor }) => {
  return (
    <Canvas shadows className="h-80 w-full">
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
      <OrbitControls enablePan enableZoom enableRotate />

      <DiodeModel
        voltage={voltage}
        temperature={temperature}
        saturationCurrent={saturationCurrent}
        idealityFactor={idealityFactor}
        position={[-3, 0, 0]}
      />

      <IVCurve
        temperature={temperature}
        saturationCurrent={saturationCurrent}
        idealityFactor={idealityFactor}
        selectedVoltage={voltage}
        position={[2, 0, 0]}
      />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </Canvas>
  );
};

export default DiodeIVScene;
