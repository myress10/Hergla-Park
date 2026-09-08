import * as THREE from 'three';

/**
 * Generates an optimized CanvasTexture with the kart's racing plate number.
 * High-resolution 512x256 texture with race styling.
 */
export function generatePlateTexture(numero = '07', plateColor = '#1E293B') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Outer bezel / plate background
  ctx.fillStyle = plateColor || '#1E293B';
  if (ctx.roundRect) {
    ctx.roundRect(0, 0, canvas.width, canvas.height, 28);
  } else {
    ctx.rect(0, 0, canvas.width, canvas.height);
  }
  ctx.fill();

  // White inner badge
  ctx.fillStyle = '#FFFFFF';
  if (ctx.roundRect) {
    ctx.roundRect(16, 16, canvas.width - 32, canvas.height - 32, 20);
  } else {
    ctx.rect(16, 16, canvas.width - 32, canvas.height - 32);
  }
  ctx.fill();

  // Inner racing border
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0F172A';
  if (ctx.roundRect) {
    ctx.roundRect(24, 24, canvas.width - 48, canvas.height - 48, 14);
  } else {
    ctx.rect(24, 24, canvas.width - 48, canvas.height - 48);
  }
  ctx.stroke();

  // Header banner: "HERGLA PARK"
  ctx.fillStyle = '#E53935';
  ctx.font = '900 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('HERGLA PARK', canvas.width / 2, 36);

  // Big Bold Racing Number
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 120px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(numero || '07').trim(), canvas.width / 2, canvas.height / 2 + 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
