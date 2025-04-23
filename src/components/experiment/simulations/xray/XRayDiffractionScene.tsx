import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import * as THREE from "three";

// Crystal Lattice Component
const CrystalLattice = ({
  structureType = 'sc',
  latticeConstant = 0.5,
  position = [0, 0, 0]
}: {
  structureType: 'sc' | 'bcc' | 'fcc' | 'diamond';
  latticeConstant: number;
  position: [number, number, number];
}) => {
  const latticeRef = useRef<THREE.Group>(null);
  
  // Define atomic coordinates based on structure type
  const atomPositions = useMemo(() => {
    const positions = [];
    const size = 2; // Number of unit cells in each direction
    
    // Add atoms based on the structure type
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          // Base position (corner of unit cell)
          const x = (i - size/2 + 0.5) * latticeConstant;
          const y = (j - size/2 + 0.5) * latticeConstant;
          const z = (k - size/2 + 0.5) * latticeConstant;
          
          // Add corner atom
          positions.push([x, y, z]);
          
          // For body-centered cubic (BCC), add center atom
          if (structureType === 'bcc') {
            positions.push([
              x + latticeConstant / 2,
              y + latticeConstant / 2,
              z + latticeConstant / 2
            ]);
          }
          
          // For face-centered cubic (FCC), add face-centered atoms
          if (structureType === 'fcc' || structureType === 'diamond') {
            positions.push([
              x + latticeConstant / 2,
              y + latticeConstant / 2,
              z
            ]);
            positions.push([
              x + latticeConstant / 2,
              y,
              z + latticeConstant / 2
            ]);
            positions.push([
              x,
              y + latticeConstant / 2,
              z + latticeConstant / 2
            ]);
          }
          
          // For diamond structure, add tetrahedral sites
          if (structureType === 'diamond') {
            positions.push([
              x + latticeConstant / 4,
              y + latticeConstant / 4,
              z + latticeConstant / 4
            ]);
            positions.push([
              x + latticeConstant * 3/4,
              y + latticeConstant * 3/4,
              z + latticeConstant / 4
            ]);
            positions.push([
              x + latticeConstant * 3/4,
              y + latticeConstant / 4,
              z + latticeConstant * 3/4
            ]);
            positions.push([
              x + latticeConstant / 4,
              y + latticeConstant * 3/4,
              z + latticeConstant * 3/4
            ]);
          }
        }
      }
    }
    
    return positions;
  }, [structureType, latticeConstant]);
  
  // Create bonds between atoms
  const bonds = useMemo(() => {
    const bondsList = [];
    const threshold = latticeConstant * 1.1; // Maximum bond length
    
    // Check all atom pairs for possible bonds
    for (let i = 0; i < atomPositions.length; i++) {
      for (let j = i + 1; j < atomPositions.length; j++) {
        const [x1, y1, z1] = atomPositions[i];
        const [x2, y2, z2] = atomPositions[j];
        
        // Calculate distance between atoms
        const distance = Math.sqrt(
          Math.pow(x2 - x1, 2) + 
          Math.pow(y2 - y1, 2) + 
          Math.pow(z2 - z1, 2)
        );
        
        // Add bond if atoms are close enough
        if (distance < threshold) {
          bondsList.push({
            start: [x1, y1, z1],
            end: [x2, y2, z2]
          });
        }
      }
    }
    
    return bondsList;
  }, [atomPositions, latticeConstant]);
  
  // Rotate the crystal lattice slowly
  useFrame(({ clock }) => {
    if (latticeRef.current) {
      latticeRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });
  
  // Atom properties based on structure
  const atomRadius = latticeConstant * 0.2;
  const atomColor = {
    'sc': '#ff4500',
    'bcc': '#4169e1',
    'fcc': '#32cd32',
    'diamond': '#e6e6fa'
  }[structureType];
  
  const bondRadius = latticeConstant * 0.03;
  
  return (
    <group ref={latticeRef} position={position}>
      {/* Atoms */}
      {atomPositions.map(([x, y, z], index) => (
        <mesh key={`atom-${index}`} position={[x, y, z]}>
          <sphereGeometry args={[atomRadius, 16, 16]} />
          <meshPhysicalMaterial 
            color={atomColor}
            metalness={0.3}
            roughness={0.2}
            clearcoat={0.5}
          />
        </mesh>
      ))}
      
      {/* Bonds */}
      {bonds.map(({ start, end }, index) => {
        const [x1, y1, z1] = start;
        const [x2, y2, z2] = end;
        
        // Calculate midpoint and bond length
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const midZ = (z1 + z2) / 2;
        
        const length = Math.sqrt(
          Math.pow(x2 - x1, 2) + 
          Math.pow(y2 - y1, 2) + 
          Math.pow(z2 - z1, 2)
        );
        
        // Calculate rotation to align cylinder with bond
        const direction = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1).normalize();
        const quaternion = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        quaternion.setFromUnitVectors(up, direction);
        
        return (
          <mesh 
            key={`bond-${index}`}
            position={[midX, midY, midZ]}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[bondRadius, bondRadius, length, 8]} />
            <meshStandardMaterial 
              color="#aaaaaa" 
              metalness={0.2}
              roughness={0.8}
            />
          </mesh>
        );
      })}
      
      {/* Structure label */}
      <Text
        position={[0, -latticeConstant * 2, 0]}
        fontSize={latticeConstant * 0.5}
        color="#ffffff"
        anchorX="center"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {structureType.toUpperCase()}
      </Text>
    </group>
  );
};

// X-Ray Diffraction Pattern
const DiffractionPattern = ({
  structureType = 'sc',
  wavelength = 0.154, // nm (Cu K-alpha)
  position = [0, 0, 0]
}: {
  structureType: 'sc' | 'bcc' | 'fcc' | 'diamond';
  wavelength: number;
  position: [number, number, number];
}) => {
  const patternRef = useRef<THREE.Group>(null);
  
  // Calculate allowed reflections based on structure type
  const reflections = useMemo(() => {
    const results = [];
    
    // Max Miller indices to consider
    const maxIndex = 3;
    
    for (let h = 0; h <= maxIndex; h++) {
      for (let k = 0; k <= maxIndex; k++) {
        for (let l = 0; l <= maxIndex; l++) {
          // Skip the origin
          if (h === 0 && k === 0 && l === 0) continue;
          
          // Calculate d-spacing and 2-theta
          const dSpacing = 1 / Math.sqrt(h*h + k*k + l*l);
          const twoTheta = 2 * Math.asin(wavelength / (2 * dSpacing));
          
          // Check structure factor for each type
          let allowed = false;
          let intensity = 1.0;
          
          switch (structureType) {
            case 'sc':
              // All reflections allowed
              allowed = true;
              break;
              
            case 'bcc':
              // h+k+l must be even
              allowed = (h + k + l) % 2 === 0;
              intensity = allowed ? 1.0 : 0.0;
              break;
              
            case 'fcc':
              // h, k, l must be all odd or all even
              allowed = ((h % 2) === (k % 2)) && ((k % 2) === (l % 2));
              intensity = allowed ? 1.0 : 0.0;
              break;
              
            case 'diamond':
              // h, k, l must be all odd or all even AND h+k+l ≠ 4n+2
              allowed = ((h % 2) === (k % 2)) && ((k % 2) === (l % 2));
              if (allowed && (h + k + l) % 4 === 2) {
                allowed = false;
              }
              intensity = allowed ? 1.0 : 0.0;
              break;
          }
          
          if (allowed) {
            // Scale intensity by multiplicity factor
            let multiplicity = 1;
            if (h === k && k === l) {
              multiplicity = 1;
            } else if (h === k || k === l || h === l) {
              multiplicity = 3;
            } else {
              multiplicity = 6;
            }
            
            // Simulate intensity (normally would use atomic form factors)
            // This is a simplified model: I ∝ (multiplicity / sin²(θ))
            intensity *= multiplicity / Math.pow(Math.sin(twoTheta/2), 2);
            
            // Scale to keep the range reasonable
            intensity = Math.min(1, intensity / 10);
            
            results.push({
              h, k, l,
              dSpacing,
              twoTheta,
              intensity
            });
          }
        }
      }
    }
    
    // Sort by 2-theta angle (ascending)
    return results.sort((a, b) => a.twoTheta - b.twoTheta);
  }, [structureType, wavelength]);
  
  // Pattern width
  const patternWidth = 5;
  // Max 2-theta to display (in radians)
  const maxTwoTheta = Math.PI / 2;
  
  return (
    <group ref={patternRef} position={position}>
      {/* Background */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[patternWidth + 1, 4]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      
      {/* X-axis (2-theta) */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-patternWidth/2, -1.5, 0),
            new THREE.Vector3(patternWidth/2, -1.5, 0)
          ])}
        />
        <lineBasicMaterial color="#fff" />
      </line>
      
      {/* Y-axis (intensity) */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-patternWidth/2, -1.5, 0),
            new THREE.Vector3(-patternWidth/2, 1.5, 0)
          ])}
        />
        <lineBasicMaterial color="#fff" />
      </line>
      
      {/* Diffraction peaks */}
      {reflections.map(({ h, k, l, twoTheta, intensity }, index) => {
        // Skip peaks beyond maxTwoTheta
        if (twoTheta > maxTwoTheta) return null;
        
        // Convert to x-position
        const x = -patternWidth/2 + (twoTheta / maxTwoTheta) * patternWidth;
        // Height based on intensity
        const height = intensity * 3;
        
        return (
          <group key={`peak-${index}`}>
            {/* Peak line */}
            <line>
              <bufferGeometry
                attach="geometry"
                {...new THREE.BufferGeometry().setFromPoints([
                  new THREE.Vector3(x, -1.5, 0),
                  new THREE.Vector3(x, -1.5 + height, 0)
                ])}
              />
              <lineBasicMaterial color="#4ade80" linewidth={3} />
            </line>
            
            {/* Miller indices label */}
            <Text
              position={[x, -1.5 + height + 0.2, 0]}
              fontSize={0.15}
              color="#fff"
              anchorX="center"
              anchorY="bottom"
            >
              ({h}{k}{l})
            </Text>
          </group>
        );
      })}
      
      {/* X-axis labels */}
      {Array.from({ length: 5 }).map((_, i) => {
        const twoTheta = (i * maxTwoTheta / 4);
        const x = -patternWidth/2 + (twoTheta / maxTwoTheta) * patternWidth;
        const degrees = (twoTheta * 180 / Math.PI).toFixed(0);
        
        return (
          <Text
            key={`x-label-${i}`}
            position={[x, -1.7, 0]}
            fontSize={0.15}
            color="#cbd5e1"
            anchorX="center"
            anchorY="top"
          >
            {degrees}°
          </Text>
        );
      })}
      
      {/* Title */}
      <Text
        position={[0, 1.7, 0]}
        fontSize={0.2}
        color="#fff"
        anchorX="center"
      >
        X-Ray Diffraction Pattern
      </Text>
      
      {/* X-axis title */}
      <Text
        position={[0, -1.9, 0]}
        fontSize={0.15}
        color="#fff"
        anchorX="center"
      >
        2θ (degrees)
      </Text>
      
      {/* Y-axis title */}
      <Text
        position={[-patternWidth/2 - 0.3, 0, 0]}
        fontSize={0.15}
        color="#fff"
        rotation={[0, 0, Math.PI/2]}
        anchorX="center"
      >
        Intensity
      </Text>
    </group>
  );
};

// X-Ray diffraction setup
const XRaySetup = ({
  wavelength = 0.154, // nm
  position = [0, 0, 0]
}: {
  wavelength: number;
  position: [number, number, number];
}) => {
  // X-ray source position
  const sourcePos = new THREE.Vector3(-2, 0, 0);
  // Sample position
  const samplePos = new THREE.Vector3(0, 0, 0);
  // Detector position
  const detectorPos = new THREE.Vector3(2, 0, 0);
  
  // X-ray beam path
  const beamPath = new THREE.QuadraticBezierCurve3(
    sourcePos,
    samplePos,
    detectorPos
  );
  
  // Create points along the beam path
  const beamPoints = beamPath.getPoints(20);
  
  // Calculate the wavelength color (approximation)
  const wavelengthColor = getWavelengthColor(wavelength);
  
  return (
    <group position={position}>
      {/* X-ray source */}
      <mesh position={sourcePos.toArray()}>
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.6, 16]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      </mesh>
      
      {/* Sample holder */}
      <mesh position={samplePos.toArray()}>
        <boxGeometry args={[0.1, 0.5, 0.5]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      
      {/* Detector */}
      <mesh position={detectorPos.toArray()}>
        <boxGeometry args={[0.1, 0.8, 0.8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      
      {/* X-ray beam */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints(beamPoints)}
        />
        <lineBasicMaterial color={wavelengthColor} linewidth={2} />
      </line>
      
      {/* Labels */}
      <Text
        position={[-2, -0.6, 0]}
        fontSize={0.15}
        color="#fff"
        anchorX="center"
      >
        X-Ray Source
      </Text>
      
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.15}
        color="#fff"
        anchorX="center"
      >
        Sample
      </Text>
      
      <Text
        position={[2, -0.6, 0]}
        fontSize={0.15}
        color="#fff"
        anchorX="center"
      >
        Detector
      </Text>
      
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.15}
        color="#fff"
        anchorX="center"
      >
        λ = {wavelength.toFixed(3)} nm
      </Text>
    </group>
  );
};

// Helper function to convert wavelength to RGB color
function getWavelengthColor(wavelength: number): string {
  // X-ray wavelengths are too short to correspond to visible light
  // This is just a rough approximation for visualization
  const r = Math.min(1, Math.max(0, 1 - Math.abs(wavelength - 0.1) * 10));
  const g = Math.min(1, Math.max(0, 1 - Math.abs(wavelength - 0.15) * 10));
  const b = Math.min(1, Math.max(0, 1 - Math.abs(wavelength - 0.2) * 10));
  
  return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
}

// Main XRayDiffractionScene component
const XRayDiffractionScene: React.FC<{
  structureType: 'sc' | 'bcc' | 'fcc' | 'diamond';
  wavelength: number;
  latticeConstant: number;
}> = ({ structureType, wavelength, latticeConstant }) => {
  return (
    <Canvas shadows className="h-80 w-full">
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={0.8} castShadow />
      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={40} />
      <OrbitControls 
        enablePan
        enableZoom
        enableRotate
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
      
      <CrystalLattice
        structureType={structureType}
        latticeConstant={latticeConstant}
        position={[-4, 0, 0]}
      />
      
      <DiffractionPattern
        structureType={structureType}
        wavelength={wavelength}
        position={[3, 1.5, 0]}
      />
      
      <XRaySetup
        wavelength={wavelength}
        position={[0, -2.5, 0]}
      />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </Canvas>
  );
};

export default XRayDiffractionScene;
