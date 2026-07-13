import { useRef, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Renders a single placed 3D object from its GLB URL.
 * If selected, wraps it in TransformControls for move/rotate/scale.
 *
 * @param {object}   placement   - { instanceId, object3dId, object3dUrl, position, rotation, scale }
 * @param {boolean}  isSelected  - whether this object is currently selected
 * @param {function} onSelect    - called with instanceId when clicked
 * @param {function} onTransform - called with (instanceId, { position, rotation, scale }) after transform
 */
export default function SceneObjectMesh({ placement, isSelected, onSelect, onTransform }) {
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${url}`;
  };

  const resolvedUrl = getFullUrl(placement.object3dUrl);
  const { scene } = useGLTF(resolvedUrl || '');
  const meshRef = useRef(null);
  const transformRef = useRef(null);

  const clonedScene = scene ? scene.clone(true) : null;

  const handleTransformChange = useCallback(() => {
    if (!meshRef.current) return;
    const obj = meshRef.current;
    onTransform(placement.instanceId, {
      position: obj.position.toArray(),
      rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
      scale: obj.scale.toArray(),
    });
  }, [placement.instanceId, onTransform]);

  const pos = placement.position || [0, 0, 0];
  const rot = placement.rotation || [0, 0, 0];
  const scl = placement.scale || [1, 1, 1];

  return (
    <>
      {isSelected && meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode="translate"
          onObjectChange={handleTransformChange}
        />
      )}
      <group
        ref={meshRef}
        position={new THREE.Vector3(...pos)}
        rotation={new THREE.Euler(...rot)}
        scale={new THREE.Vector3(...scl)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(placement.instanceId);
        }}
      >
        <primitive object={clonedScene} />

        {/* Selection highlight box */}
        {isSelected && (
          <mesh>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshBasicMaterial color="#6366f1" wireframe opacity={0.4} transparent />
          </mesh>
        )}
      </group>
    </>
  );
}
