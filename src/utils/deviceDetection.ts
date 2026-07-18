/**
 * Check if the browser supports WebGPU.
 */
export async function supportsWebGPU(): Promise<boolean> {
  const nav = navigator as any;
  if (!nav.gpu) {
    return false;
  }
  try {
    const adapter = await nav.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Check if the device supports touch interaction.
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  );
}

/**
 * Heuristic mobile device check.
 */
export function isMobileDevice(): boolean {
  const ua = navigator.userAgent || '';
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (isTouchDevice() && window.innerWidth <= 1024)
  );
}
