import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import LightSource from './LightSource';
import PhotocellModel from './PhotocellModel';
import ElectricMeter from './ElectricMeter';

// 3D Scene composition for the simulation
const PhotocellScene: React.FC<{
  wavelength: number;
  intensity: number;
  current: number;
}> = ({ wavelength, intensity, current }) => {
  return (
    <Canvas shadows>
      <ambientLight intensity={0.4} />
      <PerspectiveCamera makeDefault position={[0, 2, 7]} fov={45} />
      <OrbitControls enablePan enableZoom enableRotate />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <LightSource wavelength={wavelength} intensity={intensity} position={[-2.5, 0.5, 0]} />
      <PhotocellModel position={[0, 0, 0]} />
      <ElectricMeter value={current} maxValue={10} position={[2.5, 0, 0]} />
      <mesh position={[-0.8, -0.5, 0]}>
        <tubeGeometry
          args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(-0.8, -0.5, 0),
              new THREE.Vector3(-2, -1, 0),
              new THREE.Vector3(2, -1, 0),
              new THREE.Vector3(0.8, -0.5, 0),
            ]),
            16,
            0.03,
            8,
            false,
          ]}
        />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </Canvas>
  );
};
export default PhotocellScene;
