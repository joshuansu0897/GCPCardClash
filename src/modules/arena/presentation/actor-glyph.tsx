/**
 * Line-art glyphs for fixed diagram actors (users, browsers, devices, on-prem sites, partners,
 * pre-provisioned services), drawn in the same stroke style as the shared technical icons.
 */

import type { JSX } from 'react';

import type { ContextNodeKind } from '../../catalog';

const GLYPHS: Readonly<Record<ContextNodeKind, JSX.Element>> = {
  users: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-3.6 3.4-5.6 6.5-5.6s5.7 2 6.5 5.6" />
      <circle cx="5" cy="10" r="2.2" />
      <circle cx="19" cy="10" r="2.2" />
    </>
  ),
  browser: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4M3 7.5h18" />
    </>
  ),
  devices: (
    <>
      <rect x="4" y="9" width="7" height="10" rx="1" />
      <rect x="13" y="12" width="7" height="7" rx="1" />
      <path d="M7.5 9V5M7.5 5l-2-1.5M7.5 5l2-1.5" />
    </>
  ),
  'on-prem': (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M8 7h8M8 11h8M8 15h8" />
    </>
  ),
  partner: (
    <>
      <path d="M4 21V9l8-5 8 5v12z" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  service: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
};

export function ActorGlyph(props: { readonly kind: ContextNodeKind }): JSX.Element {
  return (
    <svg className="diagram-actor-glyph" viewBox="0 0 24 24" aria-hidden="true">
      {GLYPHS[props.kind]}
    </svg>
  );
}
