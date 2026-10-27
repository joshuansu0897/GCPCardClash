/**
 * Pure domain card definitions for GCP Card Clash.
 * Zero framework, DOM, or infrastructure dependencies.
 */

export type CardKind = 'energy' | 'service' | 'shield';

export type SubsystemInk = 'compute' | 'data' | 'edge' | 'shield' | 'ai';

export type GcpCategory =
  | 'Provisioning'
  | 'Compute'
  | 'Networking & Edge'
  | 'Databases & Storage'
  | 'Messaging & Analytics'
  | 'Agent Platform'
  | 'Security & Governance';

export type ShieldCapability =
  | 'iam-least-privilege'
  | 'cloud-armor-waf'
  | 'vpc-service-controls'
  | 'kms-secret-manager'
  | 'identity-aware-proxy';

/** A page of official Google Cloud documentation that backs a card's or blueprint's claims. */
export interface DocReference {
  readonly title: string;
  readonly url: string;
}

export interface BaseCard {
  readonly id: string;
  readonly title: string;
  readonly shortCode: string;
  readonly category: GcpCategory;
  readonly ink: SubsystemInk;
  readonly summary: string;
  readonly whenToUse: string;
  readonly avoidWhen: string;
  readonly examTip: string;
  readonly references: readonly DocReference[];
}

export interface EnergyCard extends BaseCard {
  readonly kind: 'energy';
  readonly energyCost: 0;
  readonly energyGrant: 1 | 2;
  readonly bonusPoints: number;
}

export interface ServiceCard extends BaseCard {
  readonly kind: 'service';
  readonly energyCost: 1 | 2 | 3;
  readonly basePoints: number;
  readonly slaTier: string;
}

export interface ShieldCard extends BaseCard {
  readonly kind: 'shield';
  readonly energyCost: 1;
  readonly shieldPoints: number;
  readonly capability: ShieldCapability;
}

export type CatalogCard = EnergyCard | ServiceCard | ShieldCard;
