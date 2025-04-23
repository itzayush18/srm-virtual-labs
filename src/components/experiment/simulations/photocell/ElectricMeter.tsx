
import React from "react";

const ElectricMeter: React.FC<{
  value: number;
  maxValue: number;
  position: [number, number, number];
}> = ({ value, maxValue, position }) => {
  const rotationAngle = (value / maxValue) * Math.PI * 0.8 - Math.PI * 0.4;
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.5, 0.8, 0.3]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[0, 0, 0.15]}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <group position={[0, 0, 0.2]}>
        <mesh rotation={[0, 0, rotationAngle]}>
          <boxGeometry args={[0.5, 0.02, 0.02]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
    </group>
  );
};

export default ElectricMeter;
