/** Feature flag for Seedance-class multimodal video references (P2). */

/**
 * @returns {boolean}
 */
export function isRunwareMultimodalVideoEnabled() {
  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem('RUNWARE_MULTIMODAL_VIDEO') === '1') return true;
    } catch {
      /* ignore */
    }
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_RUNWARE_MULTIMODAL_VIDEO === '1') {
    return true;
  }
  return false;
}
