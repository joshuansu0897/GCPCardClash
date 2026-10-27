/**
 * Lightweight WebGL capability probe. Kept free of Three.js imports so the composition root
 * can decide between the 3D diorama and the 2D drafting sheet without loading the 3D bundle.
 */

export function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null;
  } catch {
    return false;
  }
}
