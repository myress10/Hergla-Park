import { useEffect, useState } from 'react';

export function useKeyboardControls() {
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    reset: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid intercepting if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'KeyZ' || code === 'ArrowUp') {
        setControls((prev) => ({ ...prev, forward: true }));
      }
      if (code === 'KeyS' || code === 'ArrowDown') {
        setControls((prev) => ({ ...prev, backward: true }));
      }
      if (code === 'KeyA' || code === 'KeyQ' || code === 'ArrowLeft') {
        setControls((prev) => ({ ...prev, left: true }));
      }
      if (code === 'KeyD' || code === 'ArrowRight') {
        setControls((prev) => ({ ...prev, right: true }));
      }
      if (code === 'Space') {
        setControls((prev) => ({ ...prev, brake: true }));
      }
      if (code === 'KeyR') {
        setControls((prev) => ({ ...prev, reset: true }));
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'KeyZ' || code === 'ArrowUp') {
        setControls((prev) => ({ ...prev, forward: false }));
      }
      if (code === 'KeyS' || code === 'ArrowDown') {
        setControls((prev) => ({ ...prev, backward: false }));
      }
      if (code === 'KeyA' || code === 'KeyQ' || code === 'ArrowLeft') {
        setControls((prev) => ({ ...prev, left: false }));
      }
      if (code === 'KeyD' || code === 'ArrowRight') {
        setControls((prev) => ({ ...prev, right: false }));
      }
      if (code === 'Space') {
        setControls((prev) => ({ ...prev, brake: false }));
      }
      if (code === 'KeyR') {
        setControls((prev) => ({ ...prev, reset: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return controls;
}
