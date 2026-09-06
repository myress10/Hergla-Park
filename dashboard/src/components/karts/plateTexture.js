import * as THREE from 'three';

/**
 * Generates an optimized CanvasTexture with the kart's racing plate number.
 * Conforms to prompt specification: 256x128 canvas, black bold text on white background.
 */
export function generatePlateTexture(numero = '00') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Plate background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#111827';
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Plate Number
  ctx.fillStyle = '#111827';
  ctx.font = '900 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(numero || '??').trim(), canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
