import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Wavelength to RGB color conversion
const wavelengthToColor = (wavelength: number) => {
  let r = 0,
    g = 0,
    b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = (-1 * (wavelength - 440)) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = (-1 * (wavelength - 510)) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = (-1 * (wavelength - 645)) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }
  return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
};

const LightSource: React.FC<{
  wavelength: number;
  intensity: number;
  position: [number, number, number];
}> = ({ wavelength, intensity, position }) => {
  const color = wavelengthToColor(wavelength);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={(intensity / 100) * 2}
        />
      </mesh>
      <group rotation={[0, 0, Math.PI / 2]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0, 0, 0]} rotation={[0, 0, (Math.PI * 2 * i) / 8]}>
            <cylinderGeometry args={[0.03, 0.03, 3 * (intensity / 100), 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.3 * (intensity / 100)} />
          </mesh>
        ))}
      </group>
      <pointLight color={color} intensity={intensity / 20} distance={10} />
    </group>
  );
};

export default LightSource;
