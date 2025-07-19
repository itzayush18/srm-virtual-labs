import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced Photocell 3D Model with interactive elements
const PhotocellModel: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const [hovered, setHovered] = useState(false);
  const cellRef = useRef<THREE.Mesh>(null);

  // Create subtle animation
  useFrame(state => {
    if (cellRef.current) {
      cellRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[2, 0.2, 1]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Photocell surface */}
      <mesh
        ref={cellRef}
        position={[0, 0.1, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <circleGeometry args={[0.8, 32]} />
        <MeshDistortMaterial
          color={hovered ? '#4a6ee0' : '#3030ff'}
          metalness={0.8}
          roughness={0.1}
          distort={hovered ? 0.3 : 0.1}
          speed={3}
        />
      </mesh>

      {/* Terminals with glowing effect */}
      <mesh position={[-0.8, -0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial
          color="#e8e8e8"
          metalness={0.9}
          roughness={0.1}
          emissive="#555"
          emissiveIntensity={hovered ? 0.5 : 0.1}
        />
      </mesh>

      <mesh position={[0.8, -0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial
          color="#e8e8e8"
          metalness={0.9}
          roughness={0.1}
          emissive="#555"
          emissiveIntensity={hovered ? 0.5 : 0.1}
        />
      </mesh>

      {/* Add subtle glow ring around photocell when active */}
      {hovered && (
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.9, 32]} />
          <meshBasicMaterial color="#4a6ee0" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
};

export default PhotocellModel;
