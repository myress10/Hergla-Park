import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import CanvasErrorBoundary from '../scene-editor/CanvasErrorBoundary';
import { generatePlateTexture } from './plateTexture';

// ─── Piece name mappings for Car model ───────────────────────────────────────
function getPieceKey(meshName, mat) {
  const m = (meshName || '').toLowerCase();
  const matName = (mat ? (Array.isArray(mat) ? mat[0]?.name : mat.name) : '').toLowerCase();

  // 1. Seat
  if (m === 'seat' || matName.includes('chair')) return 'piece_sieges';

  // 2. Front Nassau / Nose Cone panel
  if (m === 'body_rear_bumper') return 'piece_capot';

  // 3. Main Bodywork & Side Pods (Body_Rear_Bumper001 is the main wrap-around shell)
  if (
    m === 'body_rear_bumper001' ||
    m === 'body_rear_bumper002' ||
    m.includes('frame_left_front') ||
    m.includes('frame_left_side')
  ) {
    return 'piece_carrosserie';
  }

  // 4. Engine & side engine covers
  if (m.includes('engine') || m.includes('side_panel')) {
    return 'piece_pontons';
  }

  // 5. Aero bars & front upper supports
  if (m.includes('front_upper') || m.includes('front_support') || m === 'rear_axle001') {
    return 'piece_aileron';
  }

  // 6. Mechanical running gear: axles, brakes, steering, pedals
  if (m.includes('axle') || m.includes('brake') || m.includes('steering') || m.includes('pedal')) {
    return 'piece_jantes';
  }

  // General fallbacks
  if (matName.includes('body')) return 'piece_carrosserie';
  if (matName.includes('chassis')) return 'piece_jantes';
  return 'piece_carrosserie';
}

// ─── Real Car GLB loader (clean, zero texture 404s, fast) ─────────────────────
function RealCarModel({ couleurs = {}, numeroPlaque = '07', onPiecesDiscovered }) {
  const groupRef = useRef(null);

  // Generate responsive plate texture whenever plate number or plate color changes
  const plateTexture = useMemo(
    () => generatePlateTexture(numeroPlaque, couleurs.piece_plaque),
    [numeroPlaque, couleurs.piece_plaque]
  );

  // Load self-contained GLB model (zero missing texture errors)
  const gltf = useGLTF('/Car.glb');
  const rawScene = gltf?.scene;

  // Deep-clone and compute normalized scale & center ONCE when model loads
  const scene = useMemo(() => {
    if (!rawScene) return null;
    const clone = rawScene.clone(true);

    // Reset initial transform
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.updateMatrixWorld(true);

    // Compute bounding box on unscaled model
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Target ~2.8 meters total length/width
    const targetScale = maxDim > 0.001 ? 2.8 / maxDim : 1;
    clone.scale.setScalar(targetScale);
    clone.updateMatrixWorld(true);

    // Re-measure after scaling to place bottom on Y=0 and center on X/Z
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    clone.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);
    clone.updateMatrixWorld(true);

    // Initialize materials once
    clone.traverse((child) => {
      if (!child.isMesh) return;
      const pieceKey = getPieceKey(child.name, child.material);

      const isBody = pieceKey === 'piece_carrosserie' || pieceKey === 'piece_capot' || pieceKey === 'piece_pontons' || pieceKey === 'piece_aileron';
      const isSeat = pieceKey === 'piece_sieges';

      // Default base color
      const initialColor = (couleurs && couleurs[pieceKey])
        ? new THREE.Color(couleurs[pieceKey])
        : (isSeat ? new THREE.Color('#E53935') : (isBody ? new THREE.Color('#1E293B') : new THREE.Color('#334155')));

      const std = new THREE.MeshStandardMaterial({
        color: initialColor,
        roughness: isSeat ? 0.90 : (isBody ? 0.35 : 0.45),
        metalness: isSeat ? 0.0 : (isBody ? 0.12 : 0.40),
        side: THREE.DoubleSide,
      });

      child.material = std;
      child.userData.pieceKey = pieceKey;
      child.castShadow = true;
      child.receiveShadow = true;
    });

    return clone;
  }, [rawScene]);

  // Discover pieces once per scene load
  const discoveredReportedRef = useRef(false);
  useEffect(() => {
    if (!scene || !onPiecesDiscovered || discoveredReportedRef.current) return;
    discoveredReportedRef.current = true;
    onPiecesDiscovered([
      'piece_carrosserie',
      'piece_capot',
      'piece_sieges',
      'piece_pontons',
      'piece_aileron',
      'piece_jantes',
      'piece_plaque',
    ]);
  }, [scene, onPiecesDiscovered]);

  // Dynamically update colors without touching position/scale
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const pieceKey = child.userData.pieceKey;

      if (pieceKey && couleurs[pieceKey]) {
        child.material.color.set(couleurs[pieceKey]);
      }
    });
  }, [scene, couleurs]);

  // Smooth floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.8) * 0.025;
    }
  });

  if (!scene) return null;
  return (
    <group ref={groupRef}>
      <primitive object={scene} />

      {/* ── Front Racing Number Plate (fitted onto Nassau nose fairing) ── */}
      <group position={[0, 0.485, 0.92]} rotation={[-0.50, 0, 0]}>
        <mesh position={[0, 0, -0.003]} castShadow>
          <boxGeometry args={[0.30, 0.18, 0.006]} />
          <meshStandardMaterial
            color={couleurs.piece_plaque || '#0F172A'}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[0, 0, 0.003]}>
          <planeGeometry args={[0.29, 0.17]} />
          <meshBasicMaterial map={plateTexture} toneMapped={false} />
        </mesh>
      </group>

      {/* ── Rear Bumper Racing Plate ── */}
      <group position={[0, 0.35, -1.35]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0, -0.003]} castShadow>
          <boxGeometry args={[0.26, 0.15, 0.006]} />
          <meshStandardMaterial
            color={couleurs.piece_plaque || '#0F172A'}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[0, 0, 0.003]}>
          <planeGeometry args={[0.25, 0.14]} />
          <meshBasicMaterial map={plateTexture} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Procedural fallback (shown while FBX loads or on error) ─────────────────
function ProceduralFallbackKart({ couleurs = {}, numeroPlaque = '07' }) {
  const groupRef = useRef(null);
  const plateTexture = useMemo(() => generatePlateTexture(numeroPlaque), [numeroPlaque]);

  const mats = useMemo(() => ({
    body:    new THREE.MeshStandardMaterial({ color: couleurs.piece_carrosserie || '#E53935', roughness: 0.2, metalness: 0.35 }),
    wing:    new THREE.MeshStandardMaterial({ color: couleurs.piece_aileron    || '#1A1A1A', roughness: 0.2, metalness: 0.5 }),
    chassis: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.6 }),
    wheel:   new THREE.MeshStandardMaterial({ color: '#18181B', roughness: 0.85 }),
    rim:     new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.8, roughness: 0.2 }),
    plate:   new THREE.MeshBasicMaterial({ map: plateTexture }),
  }), [couleurs, plateTexture]);

  useFrame((s) => {
    if (groupRef.current) groupRef.current.position.y = Math.sin(s.clock.getElapsedTime() * 2) * 0.02;
  });

  const wheelPos = [[-0.65, 0.22, 0.75], [0.65, 0.22, 0.75], [-0.7, 0.26, -0.7], [0.7, 0.26, -0.7]];

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.18, 0]} material={mats.chassis}><boxGeometry args={[1.2, 0.15, 2.2]} /></mesh>
      <mesh position={[0, 0.3, -0.1]} material={mats.body}><boxGeometry args={[0.82, 0.22, 0.95]} /></mesh>
      <mesh position={[0, 0.3, 0.9]} material={mats.body}><boxGeometry args={[0.9, 0.2, 0.55]} /></mesh>
      <mesh position={[-0.54, 0.27, 0]} material={mats.body}><boxGeometry args={[0.24, 0.28, 1.4]} /></mesh>
      <mesh position={[0.54, 0.27, 0]} material={mats.body}><boxGeometry args={[0.24, 0.28, 1.4]} /></mesh>
      <mesh position={[0, 0.72, -1.0]} material={mats.wing}><boxGeometry args={[1.1, 0.07, 0.3]} /></mesh>
      <mesh position={[-0.38, 0.52, -0.95]} material={mats.chassis}><boxGeometry args={[0.05, 0.38, 0.05]} /></mesh>
      <mesh position={[0.38, 0.52, -0.95]} material={mats.chassis}><boxGeometry args={[0.05, 0.38, 0.05]} /></mesh>
      <mesh name="piece_plaque" position={[0, 0.44, 1.14]} rotation={[-0.2, 0, 0]} material={mats.plate}><planeGeometry args={[0.5, 0.25]} /></mesh>
      {wheelPos.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={mats.wheel}><cylinderGeometry args={[i >= 2 ? 0.26 : 0.22, i >= 2 ? 0.26 : 0.22, 0.22, 24]} /></mesh>
          <mesh material={mats.rim}><cylinderGeometry args={[0.13, 0.13, 0.23, 16]} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Wrapper: FBX inside Suspense + ErrorBoundary ────────────────────────────
function CarModelLoader({ couleurs, numeroPlaque, onPiecesDiscovered }) {
  return (
    <CanvasErrorBoundary
      fallback={<ProceduralFallbackKart couleurs={couleurs} numeroPlaque={numeroPlaque} />}
    >
      <Suspense fallback={<ProceduralFallbackKart couleurs={couleurs} numeroPlaque={numeroPlaque} />}>
        <RealCarModel
          couleurs={couleurs}
          numeroPlaque={numeroPlaque}
          onPiecesDiscovered={onPiecesDiscovered}
        />
      </Suspense>
    </CanvasErrorBoundary>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
export default function KartPreviewCanvas({ couleurs = {}, numeroPlaque = '07', onPiecesDiscovered }) {
  return (
    <div className="w-full h-[400px] lg:h-[480px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner">
      <div className="absolute top-4 start-4 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Aperçu 3D — Modèle Kart Réel</span>
      </div>

      <Canvas
        camera={{ position: [3.5, 2.5, 4.5], fov: 40 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        onCreated={({ gl }) => { gl.setClearColor('#0f172a'); }}
      >
        {/* Balanced studio lighting for vibrant, rich colors */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 8, 5]} intensity={1.1} castShadow />
        <directionalLight position={[-5, 4, -4]} intensity={0.35} color="#93c5fd" />
        <hemisphereLight skyColor="#60a5fa" groundColor="#0f172a" intensity={0.25} />

        <Environment preset="city" background={false} environmentIntensity={0.35} />

        <Grid
          position={[0, 0, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.4}
          cellColor="#334155"
          sectionSize={2}
          sectionThickness={0.8}
          sectionColor="#475569"
          fadeDistance={14}
          infiniteGrid
        />

        <CarModelLoader
          couleurs={couleurs}
          numeroPlaque={numeroPlaque}
          onPiecesDiscovered={onPiecesDiscovered}
        />

        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={1.5}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 0.4, 0]}
          autoRotate
          autoRotateSpeed={1.5}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/Car.glb');

