/**
 * Measures how much of the screen the immersive HUD covers (header on top, Rival rail on the
 * left, hand along the bottom) so the 3D board can frame its island in the space left free.
 * Also exposes the measurements as CSS variables for anything floating over the board.
 */

import { type CSSProperties, type RefObject, useLayoutEffect, useRef, useState } from 'react';

import type { ViewInsets } from './board-view-switch';

/** Breathing room kept between the HUD and the island. */
const HUD_GAP_PX = 12;
const RIGHT_EDGE_PX = 24;

export interface HudInsets {
  readonly insets: ViewInsets;
  readonly style: CSSProperties;
  readonly topRef: RefObject<HTMLDivElement | null>;
  readonly railRef: RefObject<HTMLDivElement | null>;
  readonly bottomRef: RefObject<HTMLDivElement | null>;
}

interface HudLayout {
  readonly insets: ViewInsets;
  /** Bottom edge of the scoreboard; the left rail and the drawer start below it. */
  readonly headerBottom: number;
}

const EMPTY_LAYOUT: HudLayout = { insets: { top: 0, right: 0, bottom: 0, left: 0 }, headerBottom: 0 };

export function useHudInsets(): HudInsets {
  const topRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<HudLayout>(EMPTY_LAYOUT);

  const measure = (): void => {
    const next = measureHud(topRef.current, railRef.current, bottomRef.current);
    setLayout((current) => (sameLayout(current, next) ? current : next));
  };

  // WHY: the rail is placed below the measured header, so measure again once it has moved
  useLayoutEffect(measure, [layout.headerBottom]);

  useLayoutEffect(() => {

    // Re-measure whenever a HUD panel or the window changes size
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    for (const element of [topRef.current, railRef.current, bottomRef.current]) {
      if (element !== null) {
        observer?.observe(element);
      }
    }
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, []);

  const { insets } = layout;
  const style = {
    '--hud-header': `${layout.headerBottom}px`,
    '--hud-top': `${insets.top}px`,
    '--hud-left': `${insets.left}px`,
    '--hud-bottom': `${insets.bottom}px`,
  } as CSSProperties;
  return { insets, style, topRef, railRef, bottomRef };
}

function measureHud(top: HTMLElement | null, rail: HTMLElement | null, bottom: HTMLElement | null): HudLayout {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const headerBottom = top !== null ? top.getBoundingClientRect().bottom : 0;
  let topEdge = headerBottom;
  let leftEdge = 0;

  // WHY: on narrow screens the rail stacks under the header, so it eats height, not width
  const railBox = rail?.getBoundingClientRect();
  if (railBox !== undefined && railBox.height > 0) {
    if (railBox.width > viewportW / 2) {
      topEdge = Math.max(topEdge, railBox.bottom);
    } else {
      leftEdge = railBox.right;
    }
  }

  const bottomEdge = bottom !== null ? viewportH - bottom.getBoundingClientRect().top : 0;
  const insets = {
    top: Math.round(topEdge + HUD_GAP_PX),
    right: RIGHT_EDGE_PX,
    bottom: Math.round(Math.max(0, bottomEdge) + HUD_GAP_PX),
    left: Math.round(leftEdge + HUD_GAP_PX),
  };
  return { insets, headerBottom: Math.round(headerBottom) };
}

function sameLayout(a: HudLayout, b: HudLayout): boolean {
  const [x, y] = [a.insets, b.insets];
  return a.headerBottom === b.headerBottom && x.top === y.top && x.right === y.right && x.bottom === y.bottom && x.left === y.left;
}
