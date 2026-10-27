import { describe, expect, it } from 'vitest';

import { createStaticCatalogRepository, type DocReference } from '../../../src/modules/catalog';

const OFFICIAL_HOSTS = new Set(['docs.cloud.google.com', 'cloud.google.com']);

function expectOfficial(references: readonly DocReference[], owner: string): void {
  expect(references.length, `${owner} has no official source`).toBeGreaterThan(0);
  expect(new Set(references.map((ref) => ref.url)).size, `${owner} repeats a source`).toBe(references.length);

  for (const ref of references) {
    const url = new URL(ref.url);
    expect(url.protocol, ref.url).toBe('https:');
    expect(OFFICIAL_HOSTS.has(url.hostname), `${owner} cites unofficial ${ref.url}`).toBe(true);
    expect(ref.title.trim(), ref.url).not.toBe('');
  }
}

describe('Curriculum grounding in official Google Cloud documentation', () => {
  const repository = createStaticCatalogRepository();

  it('backs every card with at least one official Google Cloud page', () => {
    for (const card of repository.listCards()) {
      expectOfficial(card.references, card.id);
    }
  });

  it('backs every blueprint with at least one official Google Cloud page', () => {
    for (const blueprint of repository.listBlueprints()) {
      expectOfficial(blueprint.references, blueprint.code);
    }
  });
});
