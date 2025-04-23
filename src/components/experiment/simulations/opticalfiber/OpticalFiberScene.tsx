
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";

// Light ray components
const LightRay = ({ 
  startPoint = [0, 0, 0], 
  endPoint = [1, 0, 0], 
  color = "#ffffff", 
  thickness = 0.01,
  speed = 1
}: {
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  color: string;
  thickness?: number;
  speed?: number;
}) => {
  const ref = useRef<THREE.Mesh>(null);
  
  // Calculate direction and length
  const direction = useMemo(() => {
    const start = new THREE.Vector3(...startPoint);
    const end = new THREE.Vector3(...endPoint);
    return end.sub(start);
  }, [startPoint, endPoint]);
  
  const length = direction.length();
  
  // Normalize direction for quaternion
  const normalizedDirection = useMemo(() => {
    return direction.clone().normalize();
  }, [direction]);
  
  // Calculate rotation to align with direction
  const quaternion = useMemo(() => {
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(1, 0, 0);
    quaternion.setFromUnitVectors(up, normalizedDirection);
    return quaternion;
  }, [normalizedDirection]);
  
  // Animate light ray
  useFrame(({ clock }) => {
    if (ref.current) {
      // Pulse effect on material
      const material = ref.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 + Math.sin(clock.getElapsedTime() * speed * 5) * 0.3;
    }
  });
  
  return (
    <mesh
      ref={ref}
      position={startPoint}
      quaternion={quaternion}
    >
      <cylinderGeometry args={[thickness, thickness, length, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
};

// Optical fiber component
const OpticalFiber = ({ 
  length = 5,
  radius = 0.2,
  wavelength = 650,
  attenuation = 0.3
}: {
  length: number;
  radius: number;
  wavelength: number;
  attenuation: number;
}) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const claddingRef = useRef<THREE.Mesh>(null);
  
  // Convert wavelength to RGB color
  const wavelengthToColor = (wavelength: number) => {
    let r = 0, g = 0, b = 0;
    if (wavelength >= 380 && wavelength < 440) {
      r = -1 * (wavelength - 440) / (440 - 380);
      g = 0;
      b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
      r = 0;
      g = (wavelength - 440) / (490 - 440);
      b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
      r = 0;
      g = 1;
      b = -1 * (wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
      r = (wavelength - 510) / (580 - 510);
      g = 1;
      b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
      r = 1;
      g = -1 * (wavelength - 645) / (645 - 580);
      b = 0;
    } else if (wavelength >= 645 && wavelength <= 780) {
      r = 1;
      g = 0;
      b = 0;
    }
    return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
  };
  
  const rayColor = wavelengthToColor(wavelength);
  
  // Generate light rays based on wavelength and attenuation
  const lightRays = useMemo(() => {
    const rays = [];
    const rayCount = 5;
    const angleStep = (2 * Math.PI) / rayCount;
    
    for (let i = 0; i < rayCount; i++) {
      const angle = i * angleStep;
      const offsetY = radius * 0.5 * Math.sin(angle);
      const offsetZ = radius * 0.5 * Math.cos(angle);
      
      // Create segments to show attenuation
      const segments = 8;
      const segmentLength = length / segments;
      
      for (let j = 0; j < segments; j++) {
        const startX = j * segmentLength - length / 2;
        const endX = (j + 1) * segmentLength - length / 2;
        
        // Calculate attenuation for this segment
        const attenuationFactor = Math.pow((segments - j) / segments, attenuation * 2);
        
        rays.push(
          <LightRay 
            key={`ray-${i}-${j}`}
            startPoint={[startX, offsetY, offsetZ]} 
            endPoint={[endX, offsetY, offsetZ]}
            color={rayColor}
            thickness={0.02 * attenuationFactor}
            speed={0.5 + i * 0.1}
          />
        );
      }
    }
    
    return rays;
  }, [radius, length, rayColor, attenuation]);
  
  return (
    <group>
      {/* Optical fiber core */}
      <mesh ref={coreRef} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 32]} />
        <meshPhysicalMaterial 
          color="#e0f7fa" 
          transparent 
          opacity={0.6}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.95}
          ior={1.45}
        />
      </mesh>
      
      {/* Fiber cladding */}
      <mesh ref={claddingRef} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius * 1.2, radius * 1.2, length, 32, 1, true]} />
        <meshStandardMaterial 
          color="#b2dfdb" 
          transparent 
          opacity={0.4}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Light rays inside the fiber */}
      {lightRays}
      
      {/* End caps */}
      <mesh position={[length/2, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#80cbc4" />
      </mesh>
      
      <mesh position={[-length/2, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#80cbc4" />
      </mesh>
      
      {/* Information text */}
      <Text
        position={[0, radius * 2, 0]}
        fontSize={0.15}
        color="#000"
        anchorX="center"
      >
        n₁ = 1.45 (Core)
      </Text>
      
      <Text
        position={[0, radius * 2.5, 0]}
        fontSize={0.15}
        color="#000"
        anchorX="center"
      >
        n₂ = 1.40 (Cladding)
      </Text>
    </group>
  );
};

// Main scene component
const OpticalFiberScene: React.FC<{
  wavelength: number;
  attenuation: number;
}> = ({ wavelength, attenuation }) => {
  return (
    <Canvas shadows>
      <color attach="background" args={["#f8f9fa"]} />
      <ambientLight intensity={0.6} />
      <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
      <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={40} />
      <OrbitControls enablePan enableZoom enableRotate />
      
      <OpticalFiber 
        length={5} 
        radius={0.2} 
        wavelength={wavelength}
        attenuation={attenuation}
      />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#e9ecef" />
      </mesh>
    </Canvas>
  );
};

export default OpticalFiberScene;
