import React, { useRef } from 'react';
import { Physics } from '@react-three/rapier';
import { Environment, Stars } from '@react-three/drei';
import Track from './Track';
import KartController from './KartController';
import FollowCamera from './FollowCamera';
import CheckpointSystem from './CheckpointSystem';

export default function PhysicsWorld({
  selectedKart,
  controls,
  onSpeedUpdate,
  onLapCompleted,
  resetTrigger,
}) {
  const rigidBodyRef = useRef(null);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-20, 20, -20]} intensity={0.4} color="#60a5fa" />

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="night" background={false} />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Race Track with Colliders */}
        <Track />

        {/* Checkpoint Detection System */}
        <CheckpointSystem onLapCompleted={onLapCompleted} />

        {/* Dynamic Player Kart */}
        <KartController
          kart={selectedKart}
          controls={controls}
          rigidBodyRef={rigidBodyRef}
          onSpeedUpdate={onSpeedUpdate}
          resetTrigger={resetTrigger}
        />
      </Physics>

      {/* Smooth Following Camera */}
      <FollowCamera targetRef={rigidBodyRef} />
    </>
  );
}
