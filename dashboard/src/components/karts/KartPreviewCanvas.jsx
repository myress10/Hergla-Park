import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import CanvasErrorBoundary from '../scene-editor/CanvasErrorBoundary';
import { generatePlateTexture } from './plateTexture';

// ─── Piece name mappings — material name & mesh name ────────────────────────
function getPieceKey(meshName, mat) {
  const m = (meshName || '').toLowerCase();
  const matName = (mat ? (Array.isArray(mat) ? mat[0]?.name : mat.name) : '').toLowerCase();

  // Wheels detection (Frame_Left_Front001 = rear wheels, Frame_Left_Front002 = front wheels)
  if (m.includes('frame_left_front001') || m.includes('frame_left_front002') || m.includes('wheel') || m.includes('tire')) {
    return 'piece_jantes';
  }

  // Engine mechanical parts (engine_bake) -> mechanical alloy
  if (matName.includes('engine') || m.includes('engine')) {
    return 'piece_moteur';
  }

  // Seat
  if (matName.includes('chair') || m === 'seat') {
    return 'piece_sieges';
  }

  // Body panels / Nassau cone / nose
  if (m === 'body_rear_bumper') return 'piece_capot';
  if (matName.includes('body') || m.includes('body')) return 'piece_carrosserie';

  // Front spoiler / upper aerodynamic frames
  if (m.includes('front_upper') || m.includes('front_support')) return 'piece_aileron';

  // Chassis steel frame / axles / steering / pedals
  return 'piece_chassis';
}

const DEFAULT_KART_COLORS = {
  piece_carrosserie: '#E53935',
  piece_capot: '#E53935',
  piece_pontons: '#E53935',
  piece_aileron: '#1A1A1A',
  piece_sieges: '#1E293B',
  piece_jantes: '#111111',
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

  // Defensive: ensure any embedded Blender lights or cameras are purged from cache
  useEffect(() => {
    if (!rawScene) return;
    const toRemove = [];
    rawScene.traverse((child) => {
      if (child.isLight || child.isCamera) toRemove.push(child);
    });
    toRemove.forEach((child) => {
      if (child.parent) child.parent.remove(child);
      if (child.dispose) child.dispose();
    });
  }, [rawScene]);

  // Deep-clone and compute normalized scale & center ONCE when model loads
  const scene = useMemo(() => {
    if (!rawScene) return null;
    const clone = rawScene.clone(true);

    // CRITICAL: Strip any embedded lights (e.g. Blender default 1000W PointLight) & cameras
    const toRemove = [];
    clone.traverse((child) => {
      if (child.isLight || child.isCamera) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((child) => {
      if (child.parent) child.parent.remove(child);
      if (child.dispose) child.dispose();
    });

    // Reset initial transform
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.updateMatrixWorld(true);

    // Compute bounding box on pure mesh geometry
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

    // Initialize clean materials tailored per part type
    clone.traverse((child) => {
      if (!child.material) return; // skip non-renderable
      const pieceKey = getPieceKey(child.name, child.material);

      const isWheel = pieceKey === 'piece_jantes';
      const isEngine = pieceKey === 'piece_moteur';
      const isChassis = pieceKey === 'piece_chassis';
      const isSeat = pieceKey === 'piece_sieges';
      const isBody = !isWheel && !isEngine && !isChassis && !isSeat;

      let matColor = '#111111';
      let roughness = 0.65;
      let metalness = 0.1;
      let canCustomize = false;

      if (isWheel) {
        // Wheels are always pure matte black rubber
        matColor = '#111111';
        roughness = 0.95;
        metalness = 0.0;
        canCustomize = false;
      } else if (isEngine) {
        // Engine block: dark mechanical alloy
        matColor = '#2b2d32';
        roughness = 0.45;
        metalness = 0.6;
        canCustomize = false;
      } else if (isChassis) {
        // Tubular chassis frame: dark satin steel
        matColor = '#18181b';
        roughness = 0.65;
        metalness = 0.35;
        canCustomize = false;
      } else if (isSeat) {
        // Racing bucket seat
        matColor = effectiveCouleurs.piece_sieges || '#18181b';
        roughness = 0.90;
        metalness = 0.05;
        canCustomize = true;
      } else {
        // Body panels / nose cone / spoiler: vivid automotive finish
        matColor = effectiveCouleurs[pieceKey] || '#E53935';
        roughness = 0.55;
        metalness = 0.1;
        canCustomize = true;
      }

      const std = new THREE.MeshStandardMaterial({
        color: new THREE.Color(matColor),
        roughness,
        metalness,
        side: THREE.DoubleSide,
      });

      child.material = std;
      child.material.needsUpdate = true;
      if (child.isMesh) {
        child.userData.pieceKey = pieceKey;
        child.userData.canCustomize = canCustomize;
        child.castShadow = false;
        child.receiveShadow = false;
      }
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

  // Dynamically update colors when user picks a color
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (!child.userData.canCustomize) return;
      const pieceKey = child.userData.pieceKey;
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
          toneMappingExposure: 0.95,
        }}
        onCreated={({ gl }) => { gl.setClearColor('#18181b'); }}
      >
        {/* Soft diffused daylight — completely even, zero harsh hotspots */}
        <ambientLight intensity={0.70} />
        <directionalLight position={[5, 10, 4]} intensity={0.45} />
        <directionalLight position={[-5, 4, -4]} intensity={0.25} />

        <Grid
          position={[0, 0, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.4}
          cellColor="#27272a"
          sectionSize={2}
          sectionThickness={0.8}
          sectionColor="#3f3f46"
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
          autoRotate={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 0.4, 0]}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/Car.glb');

