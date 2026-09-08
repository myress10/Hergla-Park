import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF } from '@react-three/drei';
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

  // 6. Wheels / Tires / Rims — any variant of naming
  if (
    m.includes('wheel') || m.includes('tire') || m.includes('tyre') ||
    m.includes('rim') || m.includes('hub') || m.includes('rubber') ||
    m.includes('tread') || m.includes('axle') || m.includes('brake') ||
    m.includes('steering') || m.includes('pedal') ||
    matName.includes('wheel') || matName.includes('tire') || matName.includes('rubber')
  ) {
    return 'piece_jantes';
  }

  // General fallbacks
  if (matName.includes('body')) return 'piece_carrosserie';
  if (matName.includes('chassis')) return 'piece_jantes';
  // Unknown parts default to dark (jantes) so they never look like red body parts
  return 'piece_jantes';
}

const DEFAULT_KART_COLORS = {
  piece_carrosserie: '#E53935',
  piece_capot: '#E53935',
  piece_pontons: '#E53935',
  piece_aileron: '#1A1A1A',
  piece_sieges: '#1E293B',
  piece_jantes: '#475569',
  piece_plaque: '#0F172A',
};

// ─── Real Car GLB loader (clean, zero texture 404s, fast) ─────────────────────
function RealCarModel({ couleurs = {}, numeroPlaque = '07', onPiecesDiscovered }) {
  const groupRef = useRef(null);

  const effectiveCouleurs = useMemo(() => ({
    ...DEFAULT_KART_COLORS,
    ...couleurs,
  }), [couleurs]);

  // Generate responsive plate texture whenever plate number or plate color changes
  const plateTexture = useMemo(
    () => generatePlateTexture(numeroPlaque, effectiveCouleurs.piece_plaque),
    [numeroPlaque, effectiveCouleurs.piece_plaque]
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
      // Debug: log mesh + material names to identify actual wheel mesh names
      const matN = Array.isArray(child.material) ? child.material.map(m => m.name).join(',') : child.material?.name;
      console.log('[KartGLB] mesh:', child.name, '| mat:', matN);
      const pieceKey = getPieceKey(child.name, child.material);

      const isBody = pieceKey === 'piece_carrosserie' || pieceKey === 'piece_capot' || pieceKey === 'piece_pontons' || pieceKey === 'piece_aileron';
      const isSeat = pieceKey === 'piece_sieges';

      // Wheels are always black regardless of user color selection
      const isWheel = pieceKey === 'piece_jantes';
      const finalColor = isWheel ? '#111111' : (effectiveCouleurs[pieceKey] || (isSeat ? '#1E293B' : (isBody ? '#E53935' : '#334155')));

      const std = new THREE.MeshStandardMaterial({
        color: new THREE.Color(finalColor),
        roughness: isWheel ? 0.90 : (isSeat ? 0.92 : (isBody ? 0.45 : 0.55)),
        metalness: isWheel ? 0.0 : (isSeat ? 0.0 : (isBody ? 0.05 : 0.20)),
        side: THREE.DoubleSide,
      });

      child.material = std;
      child.userData.pieceKey = pieceKey;
      child.userData.isWheel = isWheel;
      child.castShadow = true;
      child.receiveShadow = true;
    });

    return clone;
  }, [rawScene, effectiveCouleurs]);

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

      // Skip wheels — they are always black, never user-colored
      if (child.userData.isWheel) return;
      if (pieceKey && effectiveCouleurs[pieceKey]) {
        child.material.color.set(effectiveCouleurs[pieceKey]);
      }
    });
  }, [scene, effectiveCouleurs]);

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

// ─── Wrapper: GLB inside Suspense + ErrorBoundary ───────────────────────────
function CarModelLoader({ couleurs, numeroPlaque, onPiecesDiscovered }) {
  return (
    <CanvasErrorBoundary fallback={null}>
      <Suspense fallback={null}>
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
        shadows={false}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={({ gl }) => { gl.setClearColor('#d6d2cc'); }}
      >
        {/* Pure flat daylight — ambientLight only, zero directionality, no hotspot anywhere */}
        <ambientLight intensity={1.8} />

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

