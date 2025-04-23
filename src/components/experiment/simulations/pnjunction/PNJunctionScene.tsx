
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";

// Electron particle effect
const Electrons = ({ count = 50, bias = 0 }) => {
  const particles = useRef<THREE.Points>(null);
  const positions = useRef<Float32Array>(new Float32Array(count * 3));
  const velocities = useRef<number[]>(Array(count).fill(0).map(() => Math.random() * 0.01 + 0.002));
  
  useFrame(() => {
    if (!particles.current) return;
    
    const positionArray = positions.current;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Update electron position
      positionArray[i3 + 1] -= velocities.current[i];
      
      // Reset electrons that move out of bounds
      if (positionArray[i3 + 1] < -1.5) {
        positionArray[i3] = (Math.random() - 0.5) * 1.8;
        positionArray[i3 + 1] = 1.5;
        positionArray[i3 + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    
    particles.current.geometry.attributes.position.needsUpdate = true;
  });
  
  React.useEffect(() => {
    const positionArray = positions.current;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positionArray[i3] = (Math.random() - 0.5) * 1.8 + bias;
      positionArray[i3 + 1] = Math.random() * 3 - 1.5;
      positionArray[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }
  }, [count, bias]);
  
  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#4fc3f7" />
    </points>
  );
};

// Holes particle effect
const Holes = ({ count = 30, bias = 0 }) => {
  const particles = useRef<THREE.Points>(null);
  const positions = useRef<Float32Array>(new Float32Array(count * 3));
  const velocities = useRef<number[]>(Array(count).fill(0).map(() => Math.random() * 0.008 + 0.001));
  
  useFrame(() => {
    if (!particles.current) return;
    
    const positionArray = positions.current;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Update hole position
      positionArray[i3 + 1] += velocities.current[i];
      
      // Reset holes that move out of bounds
      if (positionArray[i3 + 1] > 1.5) {
        positionArray[i3] = (Math.random() - 0.5) * 1.8;
        positionArray[i3 + 1] = -1.5;
        positionArray[i3 + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    
    particles.current.geometry.attributes.position.needsUpdate = true;
  });
  
  React.useEffect(() => {
    const positionArray = positions.current;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positionArray[i3] = (Math.random() - 0.5) * 1.8 + bias;
      positionArray[i3 + 1] = Math.random() * 3 - 1.5;
      positionArray[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }
  }, [count, bias]);
  
  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#ff9800" />
    </points>
  );
};

const PNJunctionModel = ({ 
  voltage = 0, 
  temperature = 300, 
  position = [0, 0, 0] 
}: {
  voltage: number;
  temperature: number;
  position: [number, number, number];
}) => {
  // Calculate depletion region width based on voltage and temperature
  const depletionWidth = Math.max(0.1, 0.5 - voltage * 0.2);
  const electronCount = Math.floor(30 + temperature / 10);
  const holeCount = Math.floor(20 + temperature / 15);
  
  return (
    <group position={position}>
      {/* P-type region */}
      <mesh position={[-1 - depletionWidth/2, 0, 0]}>
        <boxGeometry args={[2 - depletionWidth, 3, 0.5]} />
        <meshStandardMaterial color="#ef5350" transparent opacity={0.8} />
      </mesh>
      
      {/* N-type region */}
      <mesh position={[1 + depletionWidth/2, 0, 0]}>
        <boxGeometry args={[2 - depletionWidth, 3, 0.5]} />
        <meshStandardMaterial color="#42a5f5" transparent opacity={0.8} />
      </mesh>
      
      {/* Depletion region */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[depletionWidth, 3, 0.5]} />
        <meshStandardMaterial color="#f5f5f5" transparent opacity={0.5} />
      </mesh>
      
      {/* Electrons and holes */}
      <Electrons count={electronCount} bias={1} />
      <Holes count={holeCount} bias={-1} />
      
      {/* Labels */}
      <Text position={[-1.2, 1.7, 0.3]} fontSize={0.2} color="#000">
        P-type
      </Text>
      
      <Text position={[1.2, 1.7, 0.3]} fontSize={0.2} color="#000">
        N-type
      </Text>
      
      <Text position={[0, -1.7, 0.3]} fontSize={0.15} color="#444">
        Depletion Region: {depletionWidth.toFixed(2)} μm
      </Text>
    </group>
  );
};

const PNJunctionScene: React.FC<{
  voltage: number;
  temperature: number;
}> = ({ voltage, temperature }) => {
  return (
    <Canvas shadows>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
      <OrbitControls enablePan enableZoom enableRotate />
      
      <PNJunctionModel voltage={voltage} temperature={temperature} position={[0, 0, 0]} />
      
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </Canvas>
  );
};

export default PNJunctionScene;
