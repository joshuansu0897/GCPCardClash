/**
 * Shared animation helpers for the diorama scene: easing curves, wall-clock time,
 * reduced-motion detection, and a spring-like pop-in hook for freshly mounted meshes.
 */

import { useFrame } from '@react-three/fiber';
import { type RefObject, useEffect, useRef, useState } from 'react';
import type { Object3D } from 'three';

export const OWNER_HEX = {
  player: '#2563EB',
  rival: '#DC2626',
} as const;

export function nowSec(): number {
  return performance.now() / 1000;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function easeOutBack(t: number): number {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent): void => setReduced(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** Scales `ref` from 0 with an overshooting spring once `delaySec` has elapsed since mount. */
export function usePopIn(
  ref: RefObject<Object3D | null>,
  delaySec: number,
  durationSec: number,
  reducedMotion: boolean,
): void {
  const mountedAt = useRef<number>(nowSec());
  const settled = useRef<boolean>(false);

  useFrame(() => {
    const target = ref.current;
    if (target === null || settled.current) {
      return;
    }
    if (reducedMotion) {
      target.scale.setScalar(1);
      settled.current = true;
      return;
    }
    const t = clamp01((nowSec() - mountedAt.current - delaySec) / durationSec);
    target.scale.setScalar(Math.max(0.0001, easeOutBack(t)));
    target.visible = nowSec() - mountedAt.current >= delaySec;
    if (t >= 1) {
      settled.current = true;
    }
  });
}
