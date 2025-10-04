'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';

// --- TypeScript Type Definitions ---
interface PositionState {
  lat: number;
  lng: number;
}
interface GlobeComponentProps {
  position: PositionState;
  setPosition: React.Dispatch<React.SetStateAction<PositionState>>;
}

// This component is the 3D Globe itself
const Globe = ({ position, setPosition }: { position: PositionState, setPosition: GlobeComponentProps['setPosition'] }) => {
  // Load the high-quality textures
  const [colorMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
    '/textures/earth_daymap.jpg',
    '/textures/earth_specular_map.jpg',
    '/textures/earth_clouds.jpg',
  ]);

  const globeRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  // This hook makes the globe and clouds rotate automatically
  useFrame(({ clock }) => {
    if (globeRef.current) globeRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    if (cloudsRef.current) cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.07;
  });

  // Helper function to convert Lat/Lng to 3D coordinates for the marker
  const latLngToVector3 = (lat: number, lng: number, radius: number = 2): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Handles clicking on the globe to set a new position
  const handleGlobeClick = (event: any) => {
    event.stopPropagation();
    if (event.point) {
      const radius = 2;
      const { x, y, z } = event.point;
      const lat = 90 - (Math.acos(y / radius)) * (180 / Math.PI);
      const lng = ((270 + (Math.atan2(x, z)) * (180 / Math.PI)) % 360) - 180;
      setPosition({ lat, lng: -lng });
    }
  };

  return (
    <>
      <mesh ref={cloudsRef} onClick={handleGlobeClick}>
        <sphereGeometry args={[2.02, 32, 32]} />
        <meshPhongMaterial
          map={cloudsMap}
          opacity={0.4}
          depthWrite={true}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={globeRef} onClick={handleGlobeClick}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshPhongMaterial specularMap={specularMap} />
        <meshStandardMaterial map={colorMap} metalness={0.4} roughness={0.7} />
      </mesh>
      <mesh position={latLngToVector3(position.lat, position.lng)}>
         <sphereGeometry args={[0.03, 16, 16]} />
         <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
      </mesh>
    </>
  );
};

// The main export component that sets up the 3D scene
export default function GlobeComponent({ position, setPosition }: GlobeComponentProps) {
  return (
    <Canvas>
      <ambientLight intensity={1} />
      <pointLight color="#f6f3ea" position={[2, 0, 5]} intensity={1.2} />
      <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade={true} />
      <Globe position={position} setPosition={setPosition} />
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.6}
        panSpeed={0.5}
        rotateSpeed={0.4}
        minDistance={2.5}
        maxDistance={10}
      />
    </Canvas>
  );
}