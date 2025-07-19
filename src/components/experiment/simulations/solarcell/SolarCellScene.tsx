import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

// Solar Panel Component
const SolarPanel = ({
  efficiency = 0.15,
  lightIntensity = 0.8,
  temperature = 25,
  position = [0, 0, 0],
}: {
  efficiency: number;
  lightIntensity: number;
  temperature: number;
  position: [number, number, number];
}) => {
  const panelRef = useRef<THREE.Group>(null);
  const cellsRef = useRef<THREE.InstancedMesh>(null);

  // Cell count for the panel
  const cellColumns = 4;
  const cellRows = 3;

  // Adjust cell color based on efficiency and temperature
  const cellColor = new THREE.Color();
  cellColor.setHSL(
    0.6, // blue-ish
    0.8,
    0.2 + efficiency * 0.6 - Math.max(0, (temperature - 25) * 0.005)
  );

  // Create instance transforms for all cells
  useFrame(({ clock }) => {
    if (cellsRef.current) {
      const time = clock.getElapsedTime();
      const matrix = new THREE.Matrix4();

      for (let i = 0; i < cellColumns * cellRows; i++) {
        const row = Math.floor(i / cellColumns);
        const col = i % cellColumns;

        // Position each cell
        matrix.setPosition(
          (col - (cellColumns - 1) / 2) * 1.05,
          0.02,
          (row - (cellRows - 1) / 2) * 1.05
        );

        // Apply a subtle animation based on light intensity
        const scale = 0.98 + Math.sin(time * 2 + i) * 0.02 * lightIntensity;
        matrix.scale(new THREE.Vector3(scale, 1, scale));

        cellsRef.current.setMatrixAt(i, matrix);
      }

      cellsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Gently rotate the panel
    if (panelRef.current) {
      panelRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  // Calculate power output based on parameters
  const maxPower = 120; // Watts at ideal conditions
  const powerOutput =
    maxPower * efficiency * lightIntensity * (1 - Math.max(0, (temperature - 25) * 0.005));

  return (
    <group ref={panelRef} position={position}>
      {/* Panel base */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[5, 0.2, 4]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Solar cells */}
      <instancedMesh
        ref={cellsRef}
        args={[undefined, undefined, cellColumns * cellRows]}
        receiveShadow
      >
        <boxGeometry args={[1, 0.05, 1]} />
        <meshStandardMaterial
          color={cellColor}
          metalness={0.8}
          roughness={0.3}
          emissive={cellColor}
          emissiveIntensity={lightIntensity * 0.2}
        />
      </instancedMesh>

      {/* Front glass */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[4.8, 0.05, 3.8]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0.05} thickness={0.1} />
      </mesh>

      {/* Power output label */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.3}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {powerOutput.toFixed(1)}W
      </Text>

      {/* Parameter indicators */}
      <Text
        position={[-2, 0.5, -2]}
        fontSize={0.2}
        color="#fff"
        anchorX="left"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        Eff: {(efficiency * 100).toFixed(1)}%
      </Text>

      <Text
        position={[-2, 0.5, -1.6]}
        fontSize={0.2}
        color="#fff"
        anchorX="left"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        Temp: {temperature.toFixed(1)}°C
      </Text>
    </group>
  );
};

// Sunlight effect
const Sunlight = ({
  intensity = 1,
  position = [10, 10, 5],
}: {
  intensity: number;
  position: [number, number, number];
}) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = 1 + intensity;
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={position}
        intensity={intensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Visualize sun position */}
      <mesh position={position}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>

      {/* Sun rays */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={position} rotation={[0, 0, Math.PI * 2 * (i / 8)]}>
          <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
          <meshBasicMaterial color="#FDB813" />
        </mesh>
      ))}
    </>
  );
};

// Load Graph
const LoadGraph = ({
  power = 50,
  resistance = 10,
  position = [0, 0, 0],
}: {
  power: number;
  resistance: number;
  position: [number, number, number];
}) => {
  // Calculate voltage and current
  const voltage = Math.sqrt(power * resistance);
  const current = voltage / resistance;

  // Generate points for I-V curve
  const points = [];
  const maxVoltage = voltage * 1.5;

  for (let v = 0; v <= maxVoltage; v += maxVoltage / 20) {
    const i =
      v <= voltage
        ? Math.sqrt(power / resistance)
        : Math.sqrt(power / resistance) * (1 - (v - voltage) / voltage);
    points.push(new THREE.Vector3((v / maxVoltage) * 3 - 1.5, (i / current) * 0.8, 0));
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group position={position}>
      {/* Graph background */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.2, 2]} />
        <meshBasicMaterial color="#334155" />
      </mesh>

      {/* Axes */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1.5, -1, 0),
            new THREE.Vector3(-1.5, 1, 0),
          ])}
        />
        <lineBasicMaterial color="#fff" />
      </line>

      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1.5, -1, 0),
            new THREE.Vector3(1.5, -1, 0),
          ])}
        />
        <lineBasicMaterial color="#fff" />
      </line>

      {/* I-V curve */}
      <line>
        <bufferGeometry attach="geometry" {...lineGeometry} />
        <lineBasicMaterial color="#4ade80" linewidth={2} />
      </line>

      {/* Max power point */}
      <mesh
        position={[(voltage / maxVoltage) * 3 - 1.5, (current / current) * 0.8 - 1 + 0.8, 0.01]}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#f87171" />
      </mesh>

      {/* Labels */}
      <Text position={[0, 1.1, 0]} fontSize={0.15} color="#fff" anchorX="center">
        I-V Characteristic
      </Text>

      <Text position={[0, -1.2, 0]} fontSize={0.12} color="#fff" anchorX="center">
        Voltage (V)
      </Text>

      <Text
        position={[-1.7, 0, 0]}
        fontSize={0.12}
        color="#fff"
        rotation={[0, 0, Math.PI / 2]}
        anchorX="center"
      >
        Current (A)
      </Text>

      <Text
        position={[(voltage / maxVoltage) * 3 - 1.5, (current / current) * 0.8 - 1 + 0.6, 0.01]}
        fontSize={0.1}
        color="#f87171"
        anchorX="center"
      >
        MPP
      </Text>
    </group>
  );
};

// Main scene component
const SolarCellScene: React.FC<{
  efficiency: number;
  lightIntensity: number;
  temperature: number;
  resistance: number;
}> = ({ efficiency, lightIntensity, temperature, resistance }) => {
  // Calculate power output
  const maxPower = 120; // Watts at ideal conditions
  const powerOutput =
    maxPower * efficiency * lightIntensity * (1 - Math.max(0, (temperature - 25) * 0.005));

  return (
    <Canvas shadows className="h-80 w-full">
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 6, 10]} fov={40} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />

      <SolarPanel
        efficiency={efficiency}
        lightIntensity={lightIntensity}
        temperature={temperature}
        position={[-3, 0, 0]}
      />

      <LoadGraph power={powerOutput} resistance={resistance} position={[3, 2, 0]} />

      <Sunlight intensity={lightIntensity} position={[8, 8, -5]} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </Canvas>
  );
};

export default SolarCellScene;
