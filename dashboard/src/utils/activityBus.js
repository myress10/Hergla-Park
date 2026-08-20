/**
 * Global Activity Event Bus for Real-time (<= 2 seconds) Notification Sync
 * Dispatches both in-memory CustomEvents and localStorage broadcast triggers across tabs.
 */

export function broadcastActivity(actionName, entityType, details = {}) {
  try {
    const payload = {
      actionName,
      entityType,
      details,
      timestamp: Date.now(),
    };

    // 1. In-tab immediate CustomEvent (0ms)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hergla:activity', { detail: payload }));
      window.dispatchEvent(new CustomEvent('hergla:reload_audit', { detail: payload }));

      // 2. Cross-tab localStorage broadcast (<= 50ms)
      localStorage.setItem('hergla_last_activity_event', JSON.stringify(payload));
    }
  } catch (err) {
    console.warn('[ActivityBus] Failed to broadcast activity event:', err);
  }
}

export function subscribeActivity(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e) => {
    callback(e.detail);
  };

  const handleStorageEvent = (e) => {
    if (e.key === 'hergla_last_activity_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        callback(payload);
      } catch (_) {}
    }
  };

  window.addEventListener('hergla:activity', handleCustomEvent);
  window.addEventListener('hergla:reload_audit', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('hergla:activity', handleCustomEvent);
    window.removeEventListener('hergla:reload_audit', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
