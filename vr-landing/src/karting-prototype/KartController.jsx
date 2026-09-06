import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

/**
 * Arcade Physics Kart Controller using Rapier RigidBody.
 * Features low center of mass, responsive arcade torque/forces, and drift-dampening.
 */
export default function KartController({
  kart,
  controls,
  rigidBodyRef,
  onSpeedUpdate,
  resetTrigger,
}) {
  const currentSpeed = useRef(0);
  const currentSteer = useRef(0);
  const yawAngle = useRef(Math.PI / 2); // Facing forward along track

  const mainColor = kart?.couleurs?.piece_carrosserie || kart?.couleur || '#E53935';
  const aileronColor = kart?.couleurs?.piece_aileron || '#1A1A1A';
  const plateNumber = kart?.numeroPlaque || kart?.numero || '07';

  // Responsive arcade tuning parameters
  const MAX_FORWARD_SPEED = 24; // ~85 km/h feel
  const MAX_REVERSE_SPEED = -8;
  const ACCELERATION = 28;
  const BRAKING = 35;
  const DRAG = 5.0;
  const STEER_SPEED = 3.2;

  // Materials
  const materials = useMemo(() => {
    return {
      body: new THREE.MeshStandardMaterial({
        color: mainColor,
        roughness: 0.2,
        metalness: 0.4,
      }),
      aileron: new THREE.MeshStandardMaterial({
        color: aileronColor,
        roughness: 0.2,
        metalness: 0.5,
      }),
      chassis: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.6 }),
      accent: new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.3 }),
      wheel: new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 }),
      rim: new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8, roughness: 0.2 }),
    };
  }, [mainColor, aileronColor]);

  // Handle Reset to Track
  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: 21, y: 0.5, z: -3 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      yawAngle.current = Math.PI / 2;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
      rigidBodyRef.current.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
      currentSpeed.current = 0;
    }
  }, [resetTrigger, rigidBodyRef]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;
    const linvel = rb.linvel();
    const rot = rb.rotation();

    // 1. Acceleration / Braking Input
    if (controls.forward) {
      currentSpeed.current = Math.min(
        currentSpeed.current + ACCELERATION * delta,
        MAX_FORWARD_SPEED
      );
    } else if (controls.backward) {
      currentSpeed.current = Math.max(
        currentSpeed.current - BRAKING * delta,
        MAX_REVERSE_SPEED
      );
    } else {
      // Natural rolling resistance
      if (currentSpeed.current > 0) {
        currentSpeed.current = Math.max(0, currentSpeed.current - DRAG * delta);
      } else if (currentSpeed.current < 0) {
        currentSpeed.current = Math.min(0, currentSpeed.current + DRAG * delta);
      }
    }

    if (controls.brake) {
      currentSpeed.current *= Math.max(0, 1 - 12 * delta);
    }

    // 2. Steering Input
    const steerDir = (controls.left ? 1 : 0) - (controls.right ? 1 : 0);
    const speedFactor = Math.min(Math.abs(currentSpeed.current) / 6, 1);
    const reverseFactor = currentSpeed.current < 0 ? -1 : 1;

    currentSteer.current = THREE.MathUtils.lerp(
      currentSteer.current,
      steerDir * STEER_SPEED,
      delta * 10
    );

    yawAngle.current += currentSteer.current * speedFactor * reverseFactor * delta;

    // Apply rotation around Y
    const kartQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      yawAngle.current
    );
    rb.setRotation({ x: kartQuat.x, y: kartQuat.y, z: kartQuat.z, w: kartQuat.w }, true);

    // Apply linear velocity in heading direction
    const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(kartQuat);
    const targetVx = forwardVec.x * currentSpeed.current;
    const targetVz = forwardVec.z * currentSpeed.current;

    rb.setLinvel({ x: targetVx, y: linvel.y, z: targetVz }, true);

    // Speedometer notification (km/h estimate)
    if (onSpeedUpdate) {
      const horizontalSpeed = Math.sqrt(linvel.x * linvel.x + linvel.z * linvel.z);
      onSpeedUpdate(horizontalSpeed * 3.6);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      type="dynamic"
      mass={350}
      linearDamping={0.5}
      angularDamping={4.0}
      position={[21, 0.5, -3]}
    >
      {/* Kart Physics Collider with Lowered Center of Mass */}
      <CuboidCollider args={[0.7, 0.25, 1.1]} position={[0, 0.15, 0]} friction={1.2} />

      {/* 3D Visual Mesh Model */}
      <group position={[0, -0.1, 0]}>
        {/* Chassis */}
        <mesh position={[0, 0.18, 0]} material={materials.chassis} castShadow>
          <boxGeometry args={[1.1, 0.14, 2.1]} />
        </mesh>

        {/* Front Nose Fairing (Carrosserie) */}
        <mesh position={[0, 0.28, 0.85]} material={materials.body} castShadow>
          <boxGeometry args={[0.85, 0.24, 0.6]} />
        </mesh>

        {/* Front Bumper */}
        <mesh position={[0, 0.2, 1.2]} material={materials.accent} castShadow>
          <boxGeometry args={[1.25, 0.1, 0.15]} />
        </mesh>

        {/* Side Pods */}
        <mesh position={[-0.52, 0.26, 0]} material={materials.body} castShadow>
          <boxGeometry args={[0.22, 0.28, 1.3]} />
        </mesh>
        <mesh position={[0.52, 0.26, 0]} material={materials.body} castShadow>
          <boxGeometry args={[0.22, 0.28, 1.3]} />
        </mesh>

        {/* Seat */}
        <mesh position={[0, 0.45, -0.2]} rotation={[-0.3, 0, 0]} material={materials.accent}>
          <boxGeometry args={[0.45, 0.45, 0.1]} />
        </mesh>

        {/* Steering Wheel */}
        <mesh position={[0, 0.42, 0.25]} rotation={[0.6, 0, 0]} material={materials.accent}>
          <torusGeometry args={[0.11, 0.02, 8, 16]} />
        </mesh>

        {/* Rear Spoiler */}
        <mesh position={[0, 0.72, -0.95]} material={materials.aileron} castShadow>
          <boxGeometry args={[1.05, 0.08, 0.28]} />
        </mesh>

        {/* 4 Racing Wheels */}
        {[
          [-0.62, 0.22, 0.7],
          [0.62, 0.22, 0.7],
          [-0.66, 0.25, -0.65],
          [0.66, 0.25, -0.65],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
            <mesh material={materials.wheel} castShadow>
              <cylinderGeometry args={[i >= 2 ? 0.25 : 0.22, i >= 2 ? 0.25 : 0.22, 0.2, 20]} />
            </mesh>
            <mesh material={materials.rim}>
              <cylinderGeometry args={[0.12, 0.12, 0.21, 16]} />
            </mesh>
          </group>
        ))}

        {/* 3D Floating Plate Badge */}
        <Html position={[0, 0.95, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
          <div className="select-none pointer-events-none px-2.5 py-0.5 rounded-lg font-mono font-black text-xs text-white bg-slate-950/90 border border-white/20 shadow-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mainColor }} />
            <span>N° {plateNumber}</span>
          </div>
        </Html>
      </group>
    </RigidBody>
  );
}
