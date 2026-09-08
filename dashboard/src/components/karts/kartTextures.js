import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator for 125cc Competition Racing Kart
 * Generates lightweight, high-fidelity CanvasTextures with realistic micro-details:
 * - Carbon-fiber 2x2 twill weave & aerodynamic panel seams for bodywork
 * - Cylinder cooling fins & brushed alloy grain for engine
 * - Powder-coated steel texture for chassis
 * - Radial tire tread & rubber grain for wheels
 * - Perforated composite leather for racing seat
 */

const textureCache = new Map();

// Helper to create or retrieve cached CanvasTexture
function getOrCreateTexture(cacheKey, drawFn, width = 512, height = 512) {
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  drawFn(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Bodywork Texture:
 * - isOriginal = true: Authentic factory racing livery (dark carbon-graphite composite with
 *   dual racing speed stripes and aerodynamic seam lines).
 * - isOriginal = false: Carbon fiber twill weave with panel seams, allowing the custom color
 *   to tint it dynamically while preserving rich surface texture.
 */
export function getBodyTexture(isOriginal = true, customColor = null) {
  const cacheKey = isOriginal ? 'body_original' : `body_custom_${customColor || 'default'}`;

  return getOrCreateTexture(cacheKey, (ctx, w, h) => {
    if (isOriginal) {
      // ── Factory Original Livery: Dark Carbon-Titanium Motorsport Finish ──
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#22252a');
      grad.addColorStop(0.5, '#2c3038');
      grad.addColorStop(1, '#1e2126');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Fine Carbon Twill Weave Pattern
      const step = 8;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const isDiagonal = ((x / step + y / step) % 4 < 2);
          ctx.fillStyle = isDiagonal ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.12)';
          ctx.fillRect(x, y, step, step);
        }
      }

      // Factory Dual Racing Speed Stripes (Center-aligned)
      const centerX = w / 2;
      // Outer shadow for stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(centerX - 46, 0, 92, h);

      // White outer pin-stripes
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(centerX - 40, 0, 6, h);
      ctx.fillRect(centerX + 34, 0, 6, h);

      // Bold Racing Red Primary Stripe
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(centerX - 28, 0, 24, h);

      // Subtle Graphite Accent Stripe
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(centerX + 4, 0, 24, h);

      // Aerodynamic Panel Seam Lines & Rivets
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, 0);
      ctx.lineTo(w * 0.15, h);
      ctx.moveTo(w * 0.85, 0);
      ctx.lineTo(w * 0.85, h);
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(w, h * 0.4);
      ctx.stroke();

      // Highlight bevels on seams
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.15 + 2, 0);
      ctx.lineTo(w * 0.15 + 2, h);
      ctx.moveTo(w * 0.85 + 2, 0);
      ctx.lineTo(w * 0.85 + 2, h);
      ctx.stroke();
    } else {
      // ── Customized Color Base: Fine Carbon Weave Texture ──
      ctx.fillStyle = customColor || '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Micro carbon fiber twill texture overlay
      const step = 6;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const isDiagonal = ((x / step + y / step) % 4 < 2);
          ctx.fillStyle = isDiagonal ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.14)';
          ctx.fillRect(x, y, step, step);
        }
      }

      // Subtle aerodynamic contour bevel lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, 0);
      ctx.lineTo(w * 0.2, h);
      ctx.moveTo(w * 0.8, 0);
      ctx.lineTo(w * 0.8, h);
      ctx.stroke();
    }
  }, 1024, 1024);
}

/**
 * Engine Mechanical Texture:
 * Horizontal cylinder cooling fins, cast aluminum grain, and machined bolt details.
 */
export function getEngineTexture() {
  return getOrCreateTexture('engine_texture', (ctx, w, h) => {
    // Cast aluminum base gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#3f434c');
    grad.addColorStop(0.5, '#525763');
    grad.addColorStop(1, '#33373f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Cylinder Cooling Fins (horizontal machined ridges)
    const finHeight = 12;
    for (let y = 20; y < h - 40; y += finHeight * 2) {
      // Deep shadow groove between fins
      ctx.fillStyle = '#18191c';
      ctx.fillRect(0, y, w, finHeight * 0.85);

      // Polished top metallic fin edge
      ctx.fillStyle = '#8e96a5';
      ctx.fillRect(0, y + finHeight * 0.85, w, finHeight * 0.4);

      // Specular highlight line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(0, y + finHeight * 0.85, w, 1.5);
    }

    // Cast metal grain & stippling
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Mechanical Bolt Heads
    const boltRadius = 8;
    const boltPositions = [
      [w * 0.15, h * 0.1], [w * 0.85, h * 0.1],
      [w * 0.15, h * 0.9], [w * 0.85, h * 0.9],
      [w * 0.5, h * 0.08], [w * 0.5, h * 0.92],
    ];

    boltPositions.forEach(([bx, by]) => {
      // Hexagon / circle bolt
      ctx.fillStyle = '#1e2025';
      ctx.beginPath();
      ctx.arc(bx, by, boltRadius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7a818e';
      ctx.beginPath();
      ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bolt highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(bx - 2, by - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, 1024, 1024);
}

/**
 * Chassis Steel Texture:
 * Dark satin powder-coated tubular steel with weld beads.
 */
export function getChassisTexture() {
  return getOrCreateTexture('chassis_texture', (ctx, w, h) => {
    // Dark gunmetal steel
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#1c1d20');
    grad.addColorStop(0.3, '#2a2c32');
    grad.addColorStop(0.7, '#24262b');
    grad.addColorStop(1, '#18191b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Micro powder-coat texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.1)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Subtle Weld Seam Rings
    for (let y = 64; y < h; y += 128) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + 3);
      ctx.lineTo(w, y + 3);
      ctx.stroke();
    }
  }, 512, 512);
}

/**
 * Wheel / Tire Texture:
 * Deep tire rubber with slick tread grain and rim accent.
 */
export function getWheelTexture() {
  return getOrCreateTexture('wheel_texture', (ctx, w, h) => {
    // Deep vulcanized rubber
    ctx.fillStyle = '#16171a';
    ctx.fillRect(0, 0, w, h);

    // Rubber stippling
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Semi-slick racing grooves
    ctx.fillStyle = '#0b0b0d';
    const grooveW = 8;
    for (let x = 60; x < w - 60; x += 90) {
      ctx.fillRect(x, 0, grooveW, h);
    }
  }, 512, 512);
}

/**
 * Seat Texture:
 * Perforated motorsport bucket seat with contour stitching.
 */
export function getSeatTexture(isOriginal = true, seatColor = null) {
  const cacheKey = isOriginal ? 'seat_original' : `seat_custom_${seatColor || 'default'}`;

  return getOrCreateTexture(cacheKey, (ctx, w, h) => {
    // Base seat color
    ctx.fillStyle = isOriginal ? '#191b20' : (seatColor || '#1e293b');
    ctx.fillRect(0, 0, w, h);

    // Perforation mesh pattern (breathable racing bucket)
    const spacing = 12;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    for (let y = 16; y < h - 16; y += spacing) {
      for (let x = 16; x < w - 16; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Double contour stitch lines
    ctx.strokeStyle = isOriginal ? '#dc2626' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(w * 0.18, 0);
    ctx.lineTo(w * 0.18, h);
    ctx.moveTo(w * 0.82, 0);
    ctx.lineTo(w * 0.82, h);
    ctx.stroke();

    ctx.setLineDash([]);
  }, 512, 512);
}
