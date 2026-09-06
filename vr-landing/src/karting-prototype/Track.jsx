import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';

/**
 * Procedural Racing Circuit for Hergla Park
 * Features asphalt track, red/white racing kerbs, start/finish line, and safety barrier colliders.
 */
export default function Track() {
  // Checkered start/finish texture
  const finishTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const size = 32;
    for (let x = 0; x < canvas.width; x += size) {
      for (let y = 0; y < canvas.height; y += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#FFFFFF' : '#111827';
        ctx.fillRect(x, y, size, size);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Ground Physics Collider */}
      <RigidBody type="fixed" friction={1.2} restitution={0.1}>
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[200, 0.1, 200]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* 2. Main Track Surface (Procedural Oval/Grand-Prix Loop) */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[14, 28, 64]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Start / Finish Checkered Line */}
      <mesh receiveShadow position={[21, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 2]} />
        <meshBasicMaterial map={finishTexture} />
      </mesh>

      {/* 3. Outer Red/White Kerbs */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[27.8, 28.5, 64]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
      </mesh>

      {/* 4. Inner Red/White Kerbs */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.5, 14.2, 64]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
      </mesh>

      {/* 5. Outer Barrier Colliders (Ring of boxes to keep the kart on track) */}
      <RigidBody type="fixed" friction={0.5} restitution={0.3}>
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i / 36) * Math.PI * 2;
          const radius = 29.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          return (
            <mesh
              key={`outer-${i}`}
              position={[x, 0.4, z]}
              rotation={[0, -angle, 0]}
              castShadow
            >
              <boxGeometry args={[0.5, 0.8, 5.5]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#dc2626' : '#f8fafc'}
                roughness={0.4}
              />
            </mesh>
          );
        })}

        {/* Inner Barrier Colliders */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const radius = 12.8;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          return (
            <mesh
              key={`inner-${i}`}
              position={[x, 0.4, z]}
              rotation={[0, -angle, 0]}
              castShadow
            >
              <boxGeometry args={[0.5, 0.8, 3.6]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#f8fafc' : '#dc2626'}
                roughness={0.4}
              />
            </mesh>
          );
        })}
      </RigidBody>

      {/* Infield Decorative Podium / Flag */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[4, 5, 1, 32]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 5, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
