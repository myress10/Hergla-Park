import { Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, useGLTF } from '@react-three/drei';
import SceneObjectMesh from './SceneObjectMesh';
import CanvasErrorBoundary from './CanvasErrorBoundary';

/**
 * Renders a GLB model as the base scene environment.
 */
const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${base}${url}`;
};

/**
 * Renders a GLB model as the base scene environment.
 */
function BaseScene({ url }) {
  const { scene } = useGLTF(getFullUrl(url));
  return scene ? <primitive object={scene} /> : null;
}

/**
 * Invisible ground plane to receive drag-and-drop raycasting.
 */
function DropPlane({ onDrop }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerUp={(e) => {
        e.stopPropagation();
        if (onDrop) onDrop(e.point);
      }}
      visible={false}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial />
    </mesh>
  );
}

/**
 * Main 3D canvas component.
 *
 * @param {object[]}   placements    - array of placed objects
 * @param {string|null} selectedId   - id of currently selected placement
 * @param {string|null} baseSceneUrl - URL to base GLB scene
 * @param {function}   onSelect      - called with placement id when object is clicked
 * @param {function}   onTransform   - called with (id, { position, rotation, scale }) when object is moved
 * @param {function}   onDropPoint   - called with THREE.Vector3 drop position when user drops on canvas
 * @param {object}     pendingDrop   - object3D being dragged (set externally while dragging)
 */
export default function SceneCanvas({
  placements,
  selectedId,
  baseSceneUrl,
  onSelect,
  onTransform,
  onDropPoint,
  pendingDrop,
}) {
  const canvasRef = useRef(null);

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    // The actual 3D position is picked by the DropPlane onPointerUp
    // This handler is just to allow the drop event on the canvas element
  }, []);

  const handleCanvasDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full"
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
      id="scene-canvas-container"
    >
      <Canvas
        camera={{ position: [0, 8, 16], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.3} />

        {/* Environment */}
        <Environment preset="city" background={false} />

        {/* Base scene model */}
        {baseSceneUrl && (
          <CanvasErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <BaseScene url={baseSceneUrl} />
            </Suspense>
          </CanvasErrorBoundary>
        )}

        {/* Ground grid */}
        <Grid
          position={[0, -0.01, 0]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#cbd5e1"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#94a3b8"
          fadeDistance={40}
          infiniteGrid
        />

        {/* Drop plane for drag-and-drop positioning */}
        <DropPlane onDrop={onDropPoint} />

        {/* Placed objects */}
        <Suspense fallback={null}>
          {placements.map((placement) => (
            <SceneObjectMesh
              key={placement.instanceId}
              placement={placement}
              isSelected={placement.instanceId === selectedId}
              onSelect={onSelect}
              onTransform={onTransform}
            />
          ))}
        </Suspense>

        <OrbitControls makeDefault minDistance={2} maxDistance={80} />
      </Canvas>
    </div>
  );
}
