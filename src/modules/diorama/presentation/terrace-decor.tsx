/**
 * Low-poly district props (CC0 Kenney models) standing on the zone terraces: containers and
 * solar panels in compute zones, tanks in data zones, antennas and windmills on the edge, rocks
 * in shield zones, crystals in AI zones, and trees on open grass. Placement comes from
 * `computeTerraceDecor`; the model variant follows each prop's seeded rotation, so it is stable.
 */

import { type JSX, Suspense } from 'react';

import type { DecorKind, DecorPlacement } from '../domain/terrace-decor';
import { DECOR_MODELS, KitModel } from './kit-models';

/** Base footprint per prop kind before the prop's own seeded scale. */
const DECOR_WIDTH: Readonly<Record<DecorKind, number>> = {
  tree: 0.62,
  rack: 0.7,
  tank: 0.55,
  antenna: 0.55,
  bollard: 0.6,
  crystal: 0.45,
};

export function TerraceDecor(props: { readonly decor: readonly DecorPlacement[] }): JSX.Element {
  return (
    <Suspense fallback={null}>
      <group>
        {props.decor.map((item) => (
          <group
            key={item.id}
            position={item.position as [number, number, number]}
            rotation={[0, item.rotationY, 0]}
            scale={item.scale}
          >
            <KitModel name={pickVariant(item)} width={DECOR_WIDTH[item.kind]} />
          </group>
        ))}
      </group>
    </Suspense>
  );
}

function pickVariant(item: DecorPlacement): (typeof DECOR_MODELS)[DecorKind][number] {
  const variants = DECOR_MODELS[item.kind];
  const turn = item.rotationY / (Math.PI * 2);
  return variants[Math.floor(turn * variants.length) % variants.length] ?? variants[0] ?? 'nature-tree-default';
}
