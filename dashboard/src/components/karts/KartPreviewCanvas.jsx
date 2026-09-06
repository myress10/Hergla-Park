import React, { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import CanvasErrorBoundary from '../scene-editor/CanvasErrorBoundary';
import { generatePlateTexture } from './plateTexture';

/**
 * Procedural Kart with Blender-compliant piece naming:
 * piece_carrosserie, piece_aileron, piece_capot, piece_pontons, piece_plaque, piece_sieges, piece_chassis
 */
function ProceduralCustomizableKart({
  couleurs = {},
  numeroPlaque = '07',
  onPiecesDiscovered,
}) {
  const groupRef = useRef(null);
  const plateTexture = useMemo(() => generatePlateTexture(numeroPlaque), [numeroPlaque]);

  // Discover customizable pieces once
  useEffect(() => {
    if (onPiecesDiscovered) {
      onPiecesDiscovered([
        'piece_carrosserie',
        'piece_aileron',
        'piece_capot',
        'piece_pontons',
      ]);
    }
  }, [onPiecesDiscovered]);

  // Dynamic cloned materials per piece
  const materials = useMemo(() => {
    const defaultColor = '#E53935';
    return {
      carrosserie: new THREE.MeshStandardMaterial({
        color: couleurs.piece_carrosserie || defaultColor,
        roughness: 0.2,
        metalness: 0.4,
      }),
      aileron: new THREE.MeshStandardMaterial({
        color: couleurs.piece_aileron || '#1A1A1A',
        roughness: 0.2,
        metalness: 0.5,
      }),
      capot: new THREE.MeshStandardMaterial({
        color: couleurs.piece_capot || couleurs.piece_carrosserie || defaultColor,
        roughness: 0.2,
        metalness: 0.4,
      }),
      pontons: new THREE.MeshStandardMaterial({
        color: couleurs.piece_pontons || couleurs.piece_carrosserie || defaultColor,
        roughness: 0.2,
        metalness: 0.4,
      }),
      plaque: new THREE.MeshBasicMaterial({
        map: plateTexture,
        roughness: 0.1,
      }),
      chassis: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.6 }),
      accent: new THREE.MeshStandardMaterial({ color: '#1A1A1A', roughness: 0.4 }),
      wheel: new THREE.MeshStandardMaterial({ color: '#18181B', roughness: 0.85 }),
      rim: new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.8, roughness: 0.2 }),
    };
  }, [couleurs, plateTexture]);

  // Smooth floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Chassis */}
      <mesh name="piece_chassis" position={[0, 0.2, 0]} material={materials.chassis}>
        <boxGeometry args={[1.2, 0.15, 2.2]} />
      </mesh>

      {/* Front Nose Fairing (Capot) */}
      <mesh name="piece_capot" position={[0, 0.3, 0.9]} material={materials.capot}>
        <boxGeometry args={[0.9, 0.25, 0.6]} />
      </mesh>

      {/* Front Bumper */}
      <mesh position={[0, 0.22, 1.25]} material={materials.accent}>
        <boxGeometry args={[1.3, 0.12, 0.15]} />
      </mesh>

      {/* Front Number Plate (piece_plaque) */}
      <mesh
        name="piece_plaque"
        position={[0, 0.45, 1.15]}
        rotation={[-0.2, 0, 0]}
        material={materials.plaque}
      >
        <planeGeometry args={[0.5, 0.25]} />
      </mesh>

      {/* Side Pods (Pontons) */}
      <mesh name="piece_pontons" position={[-0.55, 0.28, 0]} material={materials.pontons}>
        <boxGeometry args={[0.25, 0.3, 1.4]} />
      </mesh>
      <mesh name="piece_pontons" position={[0.55, 0.28, 0]} material={materials.pontons}>
        <boxGeometry args={[0.25, 0.3, 1.4]} />
      </mesh>

      {/* Driver Seat & Cockpit (Carrosserie) */}
      <mesh name="piece_carrosserie" position={[0, 0.32, -0.1]} material={materials.carrosserie}>
        <boxGeometry args={[0.8, 0.2, 0.9]} />
      </mesh>

      <mesh position={[0, 0.48, -0.2]} rotation={[-0.3, 0, 0]} material={materials.accent}>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
      </mesh>

      {/* Steering Wheel */}
      <mesh position={[0, 0.4, 0.3]} rotation={[0.6, 0, 0]} material={materials.chassis}>
        <cylinderGeometry args={[0.03, 0.03, 0.4]} />
      </mesh>
      <mesh position={[0, 0.55, 0.2]} rotation={[0.6, 0, 0]} material={materials.accent}>
        <torusGeometry args={[0.12, 0.02, 8, 16]} />
      </mesh>

      {/* Rear Spoiler (Aileron) */}
      <mesh name="piece_aileron" position={[0, 0.75, -1.0]} material={materials.aileron}>
        <boxGeometry args={[1.1, 0.08, 0.3]} />
      </mesh>
      <mesh position={[-0.4, 0.55, -0.95]} material={materials.chassis}>
        <boxGeometry args={[0.05, 0.35, 0.05]} />
      </mesh>
      <mesh position={[0.4, 0.55, -0.95]} material={materials.chassis}>
        <boxGeometry args={[0.05, 0.35, 0.05]} />
      </mesh>

      {/* Rear Plate */}
      <mesh
        name="piece_plaque"
        position={[0, 0.4, -1.11]}
        rotation={[0, Math.PI, 0]}
        material={materials.plaque}
      >
        <planeGeometry args={[0.4, 0.2]} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.65, 0.22, 0.75],
        [0.65, 0.22, 0.75],
        [-0.7, 0.26, -0.7],
        [0.7, 0.26, -0.7],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={materials.wheel}>
            <cylinderGeometry args={[i >= 2 ? 0.26 : 0.22, i >= 2 ? 0.26 : 0.22, 0.22, 24]} />
          </mesh>
          <mesh material={materials.rim}>
            <cylinderGeometry args={[0.13, 0.13, 0.23, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function KartPreviewCanvas({
  couleurs = {},
  numeroPlaque = '07',
  onPiecesDiscovered,
}) {
  return (
    <div className="w-full h-[400px] lg:h-[480px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner">
      {/* Top Banner Tag */}
      <div className="absolute top-4 start-4 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Aperçu 3D interactif (R3F + Textures dynamiques)</span>
      </div>

      <Canvas
        camera={{ position: [2.8, 2.2, 3.5], fov: 42 }}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 10, 6]} intensity={1.4} castShadow />
        <directionalLight position={[-6, 6, -6]} intensity={0.5} color="#93c5fd" />

        <Environment preset="city" background={false} />

        {/* Floor Grid */}
        <Grid
          position={[0, -0.01, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#334155"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#475569"
          fadeDistance={15}
          infiniteGrid
        />

        <CanvasErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <ProceduralCustomizableKart
              couleurs={couleurs}
              numeroPlaque={numeroPlaque}
              onPiecesDiscovered={onPiecesDiscovered}
            />
          </Suspense>
        </CanvasErrorBoundary>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
}
