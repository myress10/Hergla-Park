import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import CanvasErrorBoundary from '../scene-editor/CanvasErrorBoundary';

/**
 * Procedural 3D Racing Kart model component.
 * Renders a detailed racing kart with custom carrosserie color & race number badge.
 */
function ProceduralKart({ kart, position, isSelected }) {
  const groupRef = useRef(null);
  const bodyColor = kart.couleur || '#E53935';
  const isActif = kart.actif !== false;

  // Gentle float/bounce animation
  useFrame((state) => {
    if (groupRef.current && isActif) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2 + position[0]) * 0.03;
    }
  });

  // Materials
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.2,
        metalness: 0.5,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      }),
    [bodyColor]
  );

  const wheelMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.8 }),
    []
  );

  const rimMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d1d5db', metalness: 0.9, roughness: 0.2 }),
    []
  );

  const chassisMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.5 }),
    []
  );

  const accentMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.3 }),
    []
  );

  return (
    <group ref={groupRef} position={position} opacity={isActif ? 1 : 0.4}>
      {/* Kart Chassis */}
      <mesh position={[0, 0.2, 0]} material={chassisMaterial}>
        <boxGeometry args={[1.2, 0.15, 2.2]} />
      </mesh>

      {/* Front Nose Fairing (Carrosserie Front) */}
      <mesh position={[0, 0.3, 0.9]} material={bodyMaterial}>
        <boxGeometry args={[0.9, 0.25, 0.6]} />
      </mesh>

      {/* Front Bumper */}
      <mesh position={[0, 0.22, 1.25]} material={accentMaterial}>
        <boxGeometry args={[1.3, 0.12, 0.15]} />
      </mesh>

      {/* Side Pods (Carrosserie Sides) */}
      <mesh position={[-0.55, 0.28, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.25, 0.3, 1.4]} />
      </mesh>
      <mesh position={[0.55, 0.28, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.25, 0.3, 1.4]} />
      </mesh>

      {/* Driver Seat */}
      <mesh position={[0, 0.45, -0.2]} rotation={[-0.3, 0, 0]} material={accentMaterial}>
        <boxGeometry args={[0.5, 0.5, 0.1]} />
      </mesh>
      <mesh position={[0, 0.25, -0.3]} material={accentMaterial}>
        <boxGeometry args={[0.5, 0.1, 0.4]} />
      </mesh>

      {/* Steering Wheel Column & Wheel */}
      <mesh position={[0, 0.4, 0.3]} rotation={[0.6, 0, 0]} material={chassisMaterial}>
        <cylinderGeometry args={[0.03, 0.03, 0.4]} />
      </mesh>
      <mesh position={[0, 0.55, 0.2]} rotation={[0.6, 0, 0]} material={accentMaterial}>
        <torusGeometry args={[0.12, 0.02, 8, 16]} />
      </mesh>

      {/* Rear Engine Cover / Box */}
      <mesh position={[0, 0.4, -0.7]} material={chassisMaterial}>
        <boxGeometry args={[0.6, 0.35, 0.5]} />
      </mesh>

      {/* Rear Spoiler / Wing (Carrosserie Rear) */}
      <mesh position={[0, 0.75, -1.0]} material={bodyMaterial}>
        <boxGeometry args={[1.1, 0.08, 0.3]} />
      </mesh>
      <mesh position={[-0.4, 0.55, -0.95]} material={chassisMaterial}>
        <boxGeometry args={[0.05, 0.35, 0.05]} />
      </mesh>
      <mesh position={[0.4, 0.55, -0.95]} material={chassisMaterial}>
        <boxGeometry args={[0.05, 0.35, 0.05]} />
      </mesh>

      {/* 4 Wheels (Front Left, Front Right, Rear Left, Rear Right) */}
      {[
        [-0.65, 0.22, 0.75], // Front Left
        [0.65, 0.22, 0.75], // Front Right
        [-0.7, 0.26, -0.7], // Rear Left (Slightly wider)
        [0.7, 0.26, -0.7], // Rear Right
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          {/* Tire */}
          <mesh material={wheelMaterial}>
            <cylinderGeometry args={[i >= 2 ? 0.26 : 0.22, i >= 2 ? 0.26 : 0.22, 0.22, 24]} />
          </mesh>
          {/* Rim */}
          <mesh material={rimMaterial}>
            <cylinderGeometry args={[0.13, 0.13, 0.23, 16]} />
          </mesh>
        </group>
      ))}

      {/* 3D Floating Race Badge */}
      <Html
        position={[0, 1.1, 0]}
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
      >
        <div className="flex flex-col items-center select-none pointer-events-none">
          <div
            className={`px-3 py-1 rounded-xl shadow-lg border text-xs font-black font-mono tracking-wider transition-all transform flex items-center gap-1.5 ${
              isActif
                ? 'bg-slate-900/90 text-white border-white/20'
                : 'bg-amber-950/90 text-amber-300 border-amber-500/40'
            }`}
            style={{
              borderLeft: `4px solid ${bodyColor}`,
            }}
          >
            <span>N° {kart.numero || '??'}</span>
            {!isActif && (
              <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 rounded uppercase font-sans font-bold">
                Maint.
              </span>
            )}
          </div>
          {/* Badge pointer arrow */}
          <div
            className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent"
            style={{ borderTColor: isActif ? 'rgba(15, 23, 42, 0.9)' : 'rgba(69, 26, 3, 0.9)' }}
          />
        </div>
      </Html>
    </group>
  );
}

/**
 * Starting Grid Track Floor
 */
function TrackFloor() {
  return (
    <group position={[0, -0.01, 0]}>
      {/* Asphalt Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Grid Lines */}
      <Grid
        position={[0, 0.01, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#334155"
        sectionSize={4}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={30}
        infiniteGrid
      />
    </group>
  );
}

/**
 * Live 3D Preview Canvas for Karts
 */
export default function KartPreviewCanvas({ karts }) {
  // Calculate positions for karts on a starting grid layout (2 columns)
  const kartPositions = useMemo(() => {
    return karts.map((_, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? -1.8 : 1.8;
      const z = -row * 3.2 + (karts.length > 4 ? 3 : 1);
      return [x, 0, z];
    });
  }, [karts.length]);

  return (
    <div className="w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner">
      {/* Top Banner Tag */}
      <div className="absolute top-4 start-4 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Aperçu 3D en direct (Unity Sync)</span>
      </div>

      <Canvas
        camera={{ position: [0, 6, 12], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.4} color="#60a5fa" />

        <Environment preset="city" background={false} />

        <TrackFloor />

        <CanvasErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            {karts.map((kart, index) => (
              <ProceduralKart
                key={kart.id || kart.tempId || index}
                kart={kart}
                position={kartPositions[index] || [0, 0, 0]}
              />
            ))}
          </Suspense>
        </CanvasErrorBoundary>

        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          minDistance={3}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
}
