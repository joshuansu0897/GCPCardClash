/**
 * Authored technical SVG iconography in uniform 1.75px stroke weight.
 * Zero emoji or Unicode symbol substitutes (`impeccable` craft floor).
 */

import type { JSX } from 'react';

export type TechnicalIconName =
  | 'compute'
  | 'data'
  | 'edge'
  | 'shield'
  | 'ai'
  | 'energy'
  | 'star-filled'
  | 'star-outline'
  | 'blueprint'
  | 'book'
  | 'bolt'
  | 'alert'
  | 'check'
  | 'arrow-right'
  | 'refresh'
  | 'crown'
  | 'lock'
  | 'cards'
  | 'discard'
  | 'close'
  | 'sound-on'
  | 'sound-off';

export interface TechnicalIconProps {
  readonly name: TechnicalIconName;
  readonly size?: number;
  readonly className?: string;
}

export function TechnicalIcon(props: TechnicalIconProps): JSX.Element {
  const { name, size = 18, className } = props;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {renderIconPaths(name)}
    </svg>
  );
}

function renderIconPaths(name: TechnicalIconName): JSX.Element {
  switch (name) {
    case 'compute':
      return <ComputePaths />;
    case 'data':
      return <DataPaths />;
    case 'edge':
      return <EdgePaths />;
    case 'shield':
      return <ShieldPaths />;
    case 'ai':
      return <AiPaths />;
    case 'energy':
    case 'bolt':
      return <path d="M11 2L4.5 11h5l-1 7 6.5-9h-5l1-7z" />;
    case 'star-filled':
      return (
        <path
          fill="currentColor"
          d="M10 2.3l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.28l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L10 2.3z"
        />
      );
    case 'star-outline':
      return (
        <path d="M10 2.3l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.28l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L10 2.3z" />
      );
    default:
      return renderUtilityPaths(name);
  }
}

/** Utility glyphs drawn purely from stroked paths. */
const UTILITY_STROKES: Partial<Record<TechnicalIconName, readonly string[]>> = {
  book: [
    'M3 4.5h5.5a2 2 0 0 1 2 2v10a1.5 1.5 0 0 0-1.5-1.5H3v-10.5z',
    'M17 4.5h-5.5a2 2 0 0 0-2 2v10a1.5 1.5 0 0 1 1.5-1.5H17v-10.5z',
  ],
  alert: ['M10 3L2.2 16.5h15.6L10 3z', 'M10 8.2v3.8M10 14.4h.01'],
  check: ['M4 10.5l4 4 8-8.5'],
  'arrow-right': ['M4 10h12M11.5 5.5L16 10l-4.5 4.5'],
  refresh: ['M16.5 5.5v4h-4', 'M16 9.5a6.5 6.5 0 1 0 1.2 4.5'],
  crown: ['M3 7l3.5 3L10 4.5 13.5 10 17 7l-1.5 8h-11L3 7z', 'M4.5 17.5h11'],
  'sound-on': ['M3 8h3l4-3.5v11L6 12H3V8z', 'M13 7.5a3.5 3.5 0 0 1 0 5M15.5 5a7 7 0 0 1 0 10'],
  'sound-off': ['M3 8h3l4-3.5v11L6 12H3V8z', 'M13.5 7.5l4 5M17.5 7.5l-4 5'],
  discard: [
    'M3.5 5.5h13M8 5.5V4h4v1.5',
    'M5 5.5l.9 11a1.5 1.5 0 0 0 1.5 1.4h5.2a1.5 1.5 0 0 0 1.5-1.4l.9-11M8.3 8.5v6M11.7 8.5v6',
  ],
};

function renderUtilityPaths(name: TechnicalIconName): JSX.Element {
  const strokes = UTILITY_STROKES[name];
  if (strokes !== undefined) {
    return (
      <>
        {strokes.map((d) => (
          <path key={d} d={d} />
        ))}
      </>
    );
  }

  switch (name) {
    case 'blueprint':
      return (
        <>
          <rect x="2.5" y="3.5" width="15" height="13" rx="1.5" />
          <path d="M7.5 3.5v13M2.5 9.5h15" />
        </>
      );
    case 'lock':
      return (
        <>
          <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
          <path d="M7 9V6.5a3 3 0 0 1 6 0V9M10 12.3v1.6" />
        </>
      );
    case 'cards':
      return (
        <>
          <rect x="7" y="3" width="9" height="12.5" rx="1.5" />
          <path d="M5 5.5l-1.3.4a1.5 1.5 0 0 0-1 1.8l2.6 9.4a1.5 1.5 0 0 0 1.8 1l5.2-1.4" />
        </>
      );
    default:
      return <path d="M5 5l10 10M15 5L5 15" />;
  }
}

function ComputePaths(): JSX.Element {
  return (
    <>
      <rect x="5.5" y="5.5" width="9" height="9" rx="1" />
      <path d="M8 2.5v3M12 2.5v3M8 14.5v3M12 14.5v3M2.5 8h3M2.5 12h3M14.5 8h3M14.5 12h3" />
    </>
  );
}

function DataPaths(): JSX.Element {
  return (
    <>
      <ellipse cx="10" cy="5" rx="6" ry="2.5" />
      <path d="M4 5v5c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V5" />
      <path d="M4 10v5c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5v-5" />
    </>
  );
}

function EdgePaths(): JSX.Element {
  return (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M3 10h14M10 3c2.2 2.1 2.2 11.9 0 14M10 3c-2.2 2.1-2.2 11.9 0 14" />
    </>
  );
}

function ShieldPaths(): JSX.Element {
  return (
    <>
      <path d="M10 2.5l6.5 2.6v4.6c0 4.2-2.7 6.9-6.5 8.3-3.8-1.4-6.5-4.1-6.5-8.3V5.1L10 2.5z" />
      <path d="M7.5 10.2l1.8 1.8 3.4-3.6" />
    </>
  );
}

function AiPaths(): JSX.Element {
  return (
    <>
      <circle cx="5" cy="6" r="1.8" />
      <circle cx="5" cy="14" r="1.8" />
      <circle cx="15" cy="10" r="2" />
      <path d="M6.8 6.7l6.3 2.5M6.8 13.3l6.3-2.5M5 7.8v4.4" />
    </>
  );
}
