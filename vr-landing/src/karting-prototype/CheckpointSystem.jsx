import React, { useRef, useState } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

/**
 * CheckpointSystem for circuit racing.
 * Uses sensor colliders positioned around the track loop to ensure honest lap timing.
 */
export default function CheckpointSystem({ onLapCompleted, onLapTimeUpdate }) {
  const currentLapStart = useRef(null);
  const nextCheckpoint = useRef(0);
  const totalCheckpoints = 4;

  const handleSensorIntersection = (checkpointIndex) => {
    const now = performance.now();

    // Checkpoint 0 is Start / Finish Line
    if (checkpointIndex === 0) {
      if (currentLapStart.current === null) {
        // Race Started!
        currentLapStart.current = now;
        nextCheckpoint.current = 1;
      } else if (nextCheckpoint.current >= totalCheckpoints - 1) {
        // Lap Completed!
        const lapDuration = now - currentLapStart.current;
        currentLapStart.current = now;
        nextCheckpoint.current = 1;
        if (onLapCompleted) {
          onLapCompleted(lapDuration);
        }
      }
    } else {
      // Intermediary Checkpoints (1, 2, 3)
      if (checkpointIndex === nextCheckpoint.current) {
        nextCheckpoint.current = checkpointIndex + 1;
      }
    }
  };

  return (
    <group position={[0, 0, 0]}>
      {/* CP 0: Start / Finish Line (x = 21, z = 0) */}
      <RigidBody type="fixed" sensor onIntersectionEnter={() => handleSensorIntersection(0)}>
        <CuboidCollider args={[7, 3, 1]} position={[21, 1.5, 0]} />
      </RigidBody>

      {/* CP 1: Quarter Lap (x = 0, z = 21) */}
      <RigidBody type="fixed" sensor onIntersectionEnter={() => handleSensorIntersection(1)}>
        <CuboidCollider args={[1, 3, 7]} position={[0, 1.5, 21]} />
      </RigidBody>

      {/* CP 2: Halfway Lap (x = -21, z = 0) */}
      <RigidBody type="fixed" sensor onIntersectionEnter={() => handleSensorIntersection(2)}>
        <CuboidCollider args={[7, 3, 1]} position={[-21, 1.5, 0]} />
      </RigidBody>

      {/* CP 3: Final Turn (x = 0, z = -21) */}
      <RigidBody type="fixed" sensor onIntersectionEnter={() => handleSensorIntersection(3)}>
        <CuboidCollider args={[1, 3, 7]} position={[0, 1.5, -21]} />
      </RigidBody>
    </group>
  );
}
