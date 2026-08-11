/**
 * High-quality dynamic image assets & fallback handlers for Hergla Park Dashboard
 */

// Category and space-specific high-resolution image mappings
const ESPACE_IMAGES = {
  karting: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=85',
  piste: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&q=85',
  circuit: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&q=85',
  arcade: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&q=85',
  vr: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=1600&q=85',
  virtual: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=1600&q=85',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85',
  restauration: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85',
  paintball: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1600&q=85',
  'zone enfants': 'https://images.unsplash.com/photo-1525103504173-8dc1582c7430?w=1600&q=85',
  kidzone: 'https://images.unsplash.com/photo-1525103504173-8dc1582c7430?w=1600&q=85',
  playground: 'https://images.unsplash.com/photo-1525103504173-8dc1582c7430?w=1600&q=85',
  café: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=85',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=85',
  aquatique: 'https://images.unsplash.com/photo-1582650625119-3a31f8418b0d?w=1600&q=85',
  jardin: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1600&q=85',
  default: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&q=85',
};

// Specific Kart model images (Motorsport / Racing Kart photos)
const KART_IMAGES = {
  rt10: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
  '2drive': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  lr5: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80',
  sport: 'https://images.unsplash.com/photo-1547744152-14d9b5177958?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
};

// Default fallback SVG data URI for smooth graceful degradation
export const DEFAULT_FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%231e293b"/><path d="M260 180 L340 180 L300 240 Z" fill="%233b82f6"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="20">Hergla Park Asset</text></svg>';

/**
 * Resolves a dynamic image URL for an Espace based on its custom URL, name, or category.
 */
export function getEspaceImage(espace) {
  if (!espace) return ESPACE_IMAGES.default;
  if (espace.imageUrl && typeof espace.imageUrl === 'string' && espace.imageUrl.startsWith('http')) {
    return espace.imageUrl;
  }
  const nameKey = (espace.nom || '').toLowerCase();
  const categoryKey = (espace.categorie || '').toLowerCase();

  for (const [key, url] of Object.entries(ESPACE_IMAGES)) {
    if (nameKey.includes(key) || categoryKey.includes(key)) {
      return url;
    }
  }
  return ESPACE_IMAGES.default;
}

/**
 * Resolves a dynamic image URL for a Kart based on its model name or number.
 */
export function getKartImage(kart) {
  if (!kart) return KART_IMAGES.default;
  if (kart.imageUrl && typeof kart.imageUrl === 'string' && kart.imageUrl.startsWith('http')) {
    return kart.imageUrl;
  }
  const str = `${kart.nom || ''} ${kart.numero || ''}`.toLowerCase();
  if (str.includes('rt10') || str.includes('rt-10') || str.includes('sodi')) return KART_IMAGES.rt10;
  if (str.includes('2drive') || str.includes('bi-place') || str.includes('twins')) return KART_IMAGES['2drive'];
  if (str.includes('lr5') || str.includes('kid') || str.includes('enfant')) return KART_IMAGES.lr5;
  if (str.includes('sport') || str.includes('390')) return KART_IMAGES.sport;

  return KART_IMAGES.default;
}

/**
 * Resolves a dynamic avatar URL for a user/driver.
 */
export function getUserAvatar(user) {
  if (!user) return null;
  if (user.avatarUrl) return user.avatarUrl;
  const seed = encodeURIComponent(user.nom || user.email || 'Driver');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

/**
 * Image error handler callback to attach to <img> onError attributes.
 */
export function handleImageError(e, fallbackUrl = DEFAULT_FALLBACK_IMAGE) {
  if (e.target && e.target.src !== fallbackUrl) {
    e.target.onerror = null; // prevent infinite retry loop
    e.target.src = fallbackUrl;
  }
}
