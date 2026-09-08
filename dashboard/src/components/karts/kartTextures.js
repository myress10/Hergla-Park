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
      // ── Factory Original Livery: Refined Carbon-Titanium Motorsport Finish ──
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#323740');
      grad.addColorStop(0.5, '#3f4552');
      grad.addColorStop(1, '#2c313a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Fine Carbon Twill Weave Pattern with clear contrast
      const step = 8;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const isDiagonal = ((x / step + y / step) % 4 < 2);
          ctx.fillStyle = isDiagonal ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.18)';
          ctx.fillRect(x, y, step, step);
        }
      }

      // Factory Dual Racing Speed Stripes (Center-aligned)
      const centerX = w / 2;
      // Outer shadow for stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(centerX - 52, 0, 104, h);

      // White outer pin-stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 46, 0, 8, h);
      ctx.fillRect(centerX + 38, 0, 8, h);

      // Bold Racing Red Primary Stripe
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(centerX - 32, 0, 30, h);

      // Silver White Accent Stripe
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(centerX + 4, 0, 30, h);

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
    grad.addColorStop(0, '#525764');
    grad.addColorStop(0.5, '#687082');
    grad.addColorStop(1, '#474c58');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Cylinder Cooling Fins (horizontal machined ridges)
    const finHeight = 12;
    for (let y = 20; y < h - 40; y += finHeight * 2) {
      // Shadow groove between fins
      ctx.fillStyle = '#202227';
      ctx.fillRect(0, y, w, finHeight * 0.85);

      // Polished top metallic fin edge
      ctx.fillStyle = '#a6b0c2';
      ctx.fillRect(0, y + finHeight * 0.85, w, finHeight * 0.4);

      // Specular highlight line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(0, y + finHeight * 0.85, w, 1.5);
    }

    // Cast metal grain & stippling
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
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
      ctx.fillStyle = '#25272e';
      ctx.beginPath();
      ctx.arc(bx, by, boltRadius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#949eb0';
      ctx.beginPath();
      ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bolt highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
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
    // Gunmetal steel
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#26282e');
    grad.addColorStop(0.3, '#383c45');
    grad.addColorStop(0.7, '#31343c');
    grad.addColorStop(1, '#222429');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Micro powder-coat texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Subtle Weld Seam Rings
    for (let y = 64; y < h; y += 128) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
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
    ctx.fillStyle = '#202227';
    ctx.fillRect(0, 0, w, h);

    // Rubber stippling
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Semi-slick racing grooves
    ctx.fillStyle = '#111215';
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
