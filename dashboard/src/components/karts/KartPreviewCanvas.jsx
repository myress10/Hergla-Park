import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import CanvasErrorBoundary from '../scene-editor/CanvasErrorBoundary';
import { generatePlateTexture } from './plateTexture';
import {
  getBodyTexture,
  getEngineTexture,
  getChassisTexture,
  getWheelTexture,
  getSeatTexture,
} from './kartTextures';

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

const DEFAULT_CUSTOM_COLORS = {
  piece_carrosserie: '#E53935',
  piece_capot: '#E53935',
  piece_pontons: '#E53935',
  piece_aileron: '#1A1A1A',
  piece_sieges: '#1E293B',
  piece_jantes: '#111111',
  piece_plaque: '#0F172A',
};

// ─── Real Car Model with Factory Textures & Dynamic Color Overrides ──────────
function RealCarModel({
  couleurs = {},
  numeroPlaque = '07',
  onPiecesDiscovered,
  isEditing = false,
}) {
  const groupRef = useRef(null);

  // Check if kart is in its authentic original format (before editing or without custom colors)
  const hasCustomColors = useMemo(() => {
    if (!couleurs || typeof couleurs !== 'object') return false;
    return Object.keys(couleurs).some((k) => !!couleurs[k]);
  }, [couleurs]);

  // isOriginalMode: kart is in original format if not in edit mode and no custom colors
  const isOriginalMode = !isEditing && !hasCustomColors;

  const effectiveCouleurs = useMemo(() => ({
    ...DEFAULT_CUSTOM_COLORS,
    ...couleurs,
  }), [couleurs]);

  // Generate responsive plate texture
  const plateTexture = useMemo(
    () => generatePlateTexture(numeroPlaque, isOriginalMode ? '#0F172A' : (effectiveCouleurs.piece_plaque || '#0F172A')),
    [numeroPlaque, effectiveCouleurs.piece_plaque, isOriginalMode]
  );

  // Load self-contained GLB model
  const gltf = useGLTF('/Car.glb');
  const rawScene = gltf?.scene;

  // Defensive: ensure any embedded lights or cameras are purged from cache
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

    // CRITICAL: Strip any embedded lights (e.g. Blender default PointLights) & cameras
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

    // Initialize materials with rich PBR textures
    clone.traverse((child) => {
      if (!child.material) return;
      const pieceKey = getPieceKey(child.name, child.material);

      const isWheel = pieceKey === 'piece_jantes';
      const isEngine = pieceKey === 'piece_moteur';
      const isChassis = pieceKey === 'piece_chassis';
      const isSeat = pieceKey === 'piece_sieges';

      let mat;
      let canCustomize = false;

      if (isWheel) {
        // High-grip racing tire rubber with tread pattern
        mat = new THREE.MeshStandardMaterial({
          map: getWheelTexture(),
          color: new THREE.Color('#ffffff'),
          roughness: 0.85,
          metalness: 0.10,
          side: THREE.DoubleSide,
        });
        canCustomize = true;
      } else if (isEngine) {
        // Machined cylinder cooling fins & cast aluminum
        mat = new THREE.MeshStandardMaterial({
          map: getEngineTexture(),
          color: new THREE.Color('#ffffff'),
          roughness: 0.35,
          metalness: 0.65,
          side: THREE.DoubleSide,
        });
        canCustomize = false;
      } else if (isChassis) {
        // Powder-coated satin steel tubes with weld seams
        mat = new THREE.MeshStandardMaterial({
          map: getChassisTexture(),
          color: new THREE.Color('#ffffff'),
          roughness: 0.50,
          metalness: 0.45,
          side: THREE.DoubleSide,
        });
        canCustomize = false;
      } else if (isSeat) {
        // Perforated motorsport bucket seat
        const seatTex = isOriginalMode
          ? getSeatTexture(true)
          : getSeatTexture(false, effectiveCouleurs.piece_sieges);
        mat = new THREE.MeshStandardMaterial({
          map: seatTex,
          color: new THREE.Color('#ffffff'),
          roughness: 0.75,
          metalness: 0.10,
          side: THREE.DoubleSide,
        });
        canCustomize = true;
      } else {
        // Body panels / Nassau cone / spoiler
        const bodyTex = isOriginalMode
          ? getBodyTexture(true)
          : getBodyTexture(false, effectiveCouleurs[pieceKey] || '#E53935');
        mat = new THREE.MeshStandardMaterial({
          map: bodyTex,
          color: new THREE.Color('#ffffff'),
          roughness: 0.45,
          metalness: 0.18,
          side: THREE.DoubleSide,
        });
        canCustomize = true;
      }

      child.material = mat;
      child.material.needsUpdate = true;
      if (child.isMesh) {
        child.userData.pieceKey = pieceKey;
        child.userData.canCustomize = canCustomize;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    return clone;
  }, [rawScene, isOriginalMode]);

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

  // Dynamically update materials and textures when user customizes colors
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const pieceKey = child.userData.pieceKey;
      if (!pieceKey) return;

      if (isOriginalMode) {
        // Revert to authentic original format & factory textures
        if (pieceKey === 'piece_sieges') {
          child.material.map = getSeatTexture(true);
          child.material.color.set('#ffffff');
          child.material.roughness = 0.75;
          child.material.metalness = 0.10;
        } else if (pieceKey === 'piece_jantes') {
          child.material.map = getWheelTexture();
          child.material.color.set('#ffffff');
          child.material.roughness = 0.85;
          child.material.metalness = 0.10;
        } else if (pieceKey === 'piece_moteur') {
          child.material.map = getEngineTexture();
          child.material.color.set('#ffffff');
          child.material.roughness = 0.35;
          child.material.metalness = 0.65;
        } else if (pieceKey === 'piece_chassis') {
          child.material.map = getChassisTexture();
          child.material.color.set('#ffffff');
          child.material.roughness = 0.50;
          child.material.metalness = 0.45;
        } else {
          // Bodywork original factory livery
          child.material.map = getBodyTexture(true);
          child.material.color.set('#ffffff');
          child.material.roughness = 0.45;
          child.material.metalness = 0.18;
        }
        child.material.needsUpdate = true;
      } else {
        // Editing / Custom colors mode: apply chosen colors while preserving surface texture
        if (child.userData.canCustomize) {
          const customColor = effectiveCouleurs[pieceKey];
          if (customColor) {
            if (pieceKey === 'piece_sieges') {
              child.material.map = getSeatTexture(false, customColor);
              child.material.color.set('#ffffff');
              child.material.roughness = 0.75;
            } else if (pieceKey === 'piece_jantes') {
              child.material.map = getWheelTexture();
              child.material.color.set(customColor);
            } else {
              // Bodywork parts (carrosserie, capot, pontons, aileron)
              child.material.map = getBodyTexture(false, customColor);
              child.material.color.set('#ffffff');
              child.material.roughness = 0.42;
              child.material.metalness = 0.18;
            }
            child.material.needsUpdate = true;
          }
        }
      }
    });
  }, [scene, effectiveCouleurs, isOriginalMode]);

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
            color={effectiveCouleurs.piece_plaque || '#0F172A'}
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
            color={effectiveCouleurs.piece_plaque || '#0F172A'}
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
function CarModelLoader({ couleurs, numeroPlaque, onPiecesDiscovered, isEditing }) {
  return (
    <CanvasErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <RealCarModel
          couleurs={couleurs}
          numeroPlaque={numeroPlaque}
          onPiecesDiscovered={onPiecesDiscovered}
          isEditing={isEditing}
        />
      </Suspense>
    </CanvasErrorBoundary>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
export default function KartPreviewCanvas({
  couleurs = {},
  numeroPlaque = '07',
  onPiecesDiscovered,
  isEditing = false,
}) {
  const hasCustomColors = Boolean(
    couleurs && typeof couleurs === 'object' && Object.values(couleurs).some((v) => !!v)
  );
  const isOriginal = !isEditing && !hasCustomColors;

  return (
    <div className="w-full h-[400px] lg:h-[480px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner">
      {/* Dynamic Status Badge */}
      <div className="absolute top-4 start-4 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-2 pointer-events-none">
        <span className={`w-2 h-2 rounded-full ${isOriginal ? 'bg-sky-400' : 'bg-emerald-400'} animate-pulse`} />
        <span>
          {isOriginal
            ? 'Aperçu 3D — Modèle d’Origine (Textures d’Usine)'
            : 'Aperçu 3D — Personnalisation Live'}
        </span>
      </div>

      <Canvas
        camera={{ position: [3.5, 2.5, 4.5], fov: 40 }}
        shadows={false}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onCreated={({ gl }) => { gl.setClearColor('#18181b'); }}
      >
        {/* Soft studio lighting — reveals textures & contours clearly with zero blowout */}
        <ambientLight intensity={0.85} />
        <hemisphereLight skyColor="#f8fafc" groundColor="#334155" intensity={0.40} />
        <directionalLight position={[5, 8, 4]} intensity={0.60} />
        <directionalLight position={[-5, 4, -4]} intensity={0.35} />
        <directionalLight position={[0, 1.5, 4]} intensity={0.25} />

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
          isEditing={isEditing}
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
