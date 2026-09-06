import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function FollowCamera({ targetRef }) {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3(21, 6, 10));
  const currentLookAt = useRef(new THREE.Vector3(21, 0, 0));

  useFrame((state, delta) => {
    if (!targetRef.current) return;

    // Get kart position and rotation from Rapier RigidBody or mesh
    const translation = targetRef.current.translation();
    const rotation = targetRef.current.rotation();

    if (!translation) return;

    const kartPos = new THREE.Vector3(translation.x, translation.y, translation.z);
    const kartQuat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

    // Camera offset behind and above kart in kart's local space
    const offset = new THREE.Vector3(0, 2.2, -4.8);
    offset.applyQuaternion(kartQuat);

    // Target camera position
    const desiredCameraPos = kartPos.clone().add(offset);
    desiredCameraPos.y = Math.max(desiredCameraPos.y, 1.2); // Don't clip under ground

    // Smooth lerp for camera movement
    const smoothFactor = Math.min(delta * 6.5, 1);
    currentPosition.current.lerp(desiredCameraPos, smoothFactor);
    camera.position.copy(currentPosition.current);

    // Smooth lookAt target slightly ahead of the kart
    const lookTarget = kartPos.clone().add(new THREE.Vector3(0, 0.6, 1.5).applyQuaternion(kartQuat));
    currentLookAt.current.lerp(lookTarget, smoothFactor * 1.5);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
