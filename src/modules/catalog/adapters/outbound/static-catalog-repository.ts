/**
 * Driven outbound adapter serving the curated static GCP Card Clash curriculum.
 */

import type { CatalogRepository } from '../../application/ports/catalog-repository';
import type { ArchitectureBlueprint, TrackId, TrackInfo } from '../../domain/blueprint';
import type { CatalogCard } from '../../domain/card';
import { VERTEX_AI_BLUEPRINTS } from './gcp-blueprints-ai';
import { VERTEX_AI_EXPANSION_BLUEPRINTS } from './gcp-blueprints-ai-expansion';
import { ARCHITECT_BLUEPRINTS } from './gcp-blueprints-architect';
import { ARCHITECT_EXPANSION_BLUEPRINTS } from './gcp-blueprints-architect-expansion';
import { SERVERLESS_DATA_BLUEPRINTS } from './gcp-blueprints-data';
import { SERVERLESS_DATA_EXPANSION_BLUEPRINTS } from './gcp-blueprints-data-expansion';
import { FOUNDATIONS_BLUEPRINTS } from './gcp-blueprints-foundations';
import { FOUNDATIONS_EXPANSION_BLUEPRINTS } from './gcp-blueprints-foundations-expansion';
import { PLATFORM_OPS_BLUEPRINTS } from './gcp-blueprints-platform';
import { PLATFORM_OPS_EXPANSION_BLUEPRINTS } from './gcp-blueprints-platform-expansion';
import { AI_AND_SHIELD_CARDS } from './gcp-cards-ai-shields';
import { COMPUTE_AND_EDGE_CARDS } from './gcp-cards-compute-edge';
import { DATA_AND_ANALYTICS_CARDS } from './gcp-cards-data';

const TRACK_CATALOG: readonly TrackInfo[] = [
  {
    id: 'foundations',
    code: 'TRK-01',
    title: 'Cloud Foundations & Zero-Trust',
    certificationFocus: 'Associate Cloud Engineer',
    summary: 'Global ingress, Cloud CDN, serverless Cloud Run storefronts, Cloud SQL HA, and BeyondCorp IAP.',
  },
  {
    id: 'architect',
    code: 'TRK-02',
    title: 'Global & Hybrid Cloud Architect',
    certificationFocus: 'Professional Cloud Architect',
    summary: 'Active-active Cloud Spanner ledgers, Apigee gateways, GKE Autopilot meshes, and 20 Gbps Hybrid Interconnect.',
  },
  {
    id: 'serverless-data',
    code: 'TRK-03',
    title: 'Serverless & Streaming Data',
    certificationFocus: 'Professional Data Engineer',
    summary: 'Pub/Sub shock-absorbing buses, Dataflow Beam windows, Bigtable hot serving, BigQuery, and Workflows sagas.',
  },
  {
    id: 'vertex-ai',
    code: 'TRK-04',
    title: 'Agent Platform & Enterprise GenAI',
    certificationFocus: 'Professional ML / GenAI Engineer',
    summary: 'Grounded Gemini RAG, ScaNN Vector Search, Document AI layout OCR, and VPC-SC governance.',
  },
  {
    id: 'platform-ops',
    code: 'TRK-05',
    title: 'Kubernetes & Platform Reliability',
    certificationFocus: 'Professional Cloud DevOps Engineer',
    summary: 'GKE Autopilot fleets, Cloud Deploy canaries, Artifact Registry supply chains, and SLO burn-rate alerting.',
  },
];

const ALL_CARDS: readonly CatalogCard[] = [
  ...COMPUTE_AND_EDGE_CARDS,
  ...DATA_AND_ANALYTICS_CARDS,
  ...AI_AND_SHIELD_CARDS,
];

const ALL_BLUEPRINTS: readonly ArchitectureBlueprint[] = [
  ...FOUNDATIONS_BLUEPRINTS,
  ...FOUNDATIONS_EXPANSION_BLUEPRINTS,
  ...ARCHITECT_BLUEPRINTS,
  ...ARCHITECT_EXPANSION_BLUEPRINTS,
  ...SERVERLESS_DATA_BLUEPRINTS,
  ...SERVERLESS_DATA_EXPANSION_BLUEPRINTS,
  ...VERTEX_AI_BLUEPRINTS,
  ...VERTEX_AI_EXPANSION_BLUEPRINTS,
  ...PLATFORM_OPS_BLUEPRINTS,
  ...PLATFORM_OPS_EXPANSION_BLUEPRINTS,
];

export class StaticCatalogRepository implements CatalogRepository {
  private readonly cardMap: ReadonlyMap<string, CatalogCard>;
  private readonly blueprintMap: ReadonlyMap<string, ArchitectureBlueprint>;

  constructor() {
    this.cardMap = new Map(ALL_CARDS.map((card) => [card.id, card]));
    this.blueprintMap = new Map(ALL_BLUEPRINTS.map((bp) => [bp.id, bp]));
  }

  listTracks(): readonly TrackInfo[] {
    return TRACK_CATALOG;
  }

  listCards(): readonly CatalogCard[] {
    return ALL_CARDS;
  }

  getCardById(cardId: string): CatalogCard | undefined {
    return this.cardMap.get(cardId);
  }

  listBlueprints(trackId?: TrackId): readonly ArchitectureBlueprint[] {
    if (trackId === undefined) {
      return ALL_BLUEPRINTS;
    }

    return ALL_BLUEPRINTS.filter((bp) => bp.trackId === trackId);
  }

  getBlueprintById(blueprintId: string): ArchitectureBlueprint | undefined {
    return this.blueprintMap.get(blueprintId);
  }
}

export function createStaticCatalogRepository(): CatalogRepository {
  return new StaticCatalogRepository();
}
