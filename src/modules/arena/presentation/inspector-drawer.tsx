/**
 * Slide-out drawer on the right edge of the immersive HUD holding the spec inspector and the
 * match log. A tab toggles it; Escape or the close button hides it again.
 */

import { type JSX, type ReactNode, useEffect } from 'react';

import { TechnicalIcon } from '../../../shared/gcp-icons';

const DRAWER_ID = 'inspector-drawer';

export interface InspectorDrawerProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: ReactNode;
}

export function InspectorDrawer(props: InspectorDrawerProps): JSX.Element {
  const { isOpen, onOpenChange } = props;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onOpenChange]);

  return (
    <>
      <button
        type="button"
        className={`drawer-tab ${isOpen ? 'is-open' : ''}`}
        aria-expanded={isOpen}
        aria-controls={DRAWER_ID}
        onClick={() => onOpenChange(!isOpen)}
      >
        <TechnicalIcon name="book" size={16} />
        <span>Specs &amp; Log</span>
      </button>

      <div id={DRAWER_ID} className={`inspector-drawer ${isOpen ? 'is-open' : ''}`} inert={!isOpen}>
        <button
          type="button"
          className="drawer-close"
          aria-label="Close specs and log"
          onClick={() => onOpenChange(false)}
        >
          <TechnicalIcon name="close" size={16} />
        </button>
        {props.children}
      </div>
    </>
  );
}
