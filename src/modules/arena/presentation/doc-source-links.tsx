/**
 * Links to the official Google Cloud pages a card or blueprint was fact-checked against.
 */

import type { JSX } from 'react';

import type { DocReference } from '../../catalog';

export function DocSourceLinks(props: { readonly references: readonly DocReference[] }): JSX.Element {
  return (
    <ul className="doc-source-list">
      {props.references.map((ref) => (
        <li key={ref.url}>
          <a href={ref.url} target="_blank" rel="noopener noreferrer">
            {ref.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
