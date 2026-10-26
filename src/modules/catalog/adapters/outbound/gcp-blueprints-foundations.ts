/**
 * Reference Architecture Blueprints for Track 1 (Cloud Foundations & Zero-Trust).
 */

import type { ArchitectureBlueprint } from '../../domain/blueprint';

export const FOUNDATIONS_BLUEPRINTS: readonly ArchitectureBlueprint[] = [
  {
    id: 'arc-101-regional-web',
    code: 'ARC-101',
    trackId: 'foundations',
    title: 'Resilient Serverless Web Storefront',
    difficulty: 'Associate',
    workloadBrief:
      'Launch a bursty consumer web storefront serving global HTTPS traffic, cached product media, stateless container APIs, and regional ACID order persistence.',
    targetSla: '99.95% Regional Availability',
    costFocus: 'Scale compute to zero off-peak; offload static reads to edge PoPs.',
    zones: [
      { id: 'edge', label: 'Public Edge & Ingress', ink: 'edge', column: 1 },
      { id: 'compute', label: 'Serverless App Tier', ink: 'compute', column: 2 },
      { id: 'data', label: 'Persistence Perimeter', ink: 'data', column: 3 },
    ],
    slots: [
      {
        id: 'ingress-lb',
        zoneId: 'edge',
        row: 1,
        title: 'Anycast HTTPS Ingress',
        requirementClue: 'Terminate TLS globally on a single Anycast IP and route URL paths to serverless backends.',
        acceptedServiceIds: ['global-ext-alb'],
        recommendedShield: 'cloud-armor-waf',
        antiPatternHints: {
          'cloud-nat': 'Cloud NAT handles outbound egress from private subnets; it cannot accept inbound HTTPS user traffic.',
          'cloud-interconnect': 'Dedicated Interconnect links private on-prem data centers, not public internet shoppers.',
        },
        defaultAntiPatternReason: 'Public HTTPS path routing and TLS termination require Global External Application Load Balancing.',
        architecturalRationale: 'Global External Application LB terminates TLS at Google edge PoPs and routes to serverless NEGs.',
      },
      {
        id: 'edge-cache',
        zoneId: 'edge',
        row: 2,
        title: 'Edge Asset Cache',
        requirementClue: 'Cache product images and JS bundles at Google edge PoPs to slash origin latency and egress cost.',
        acceptedServiceIds: ['cloud-cdn'],
        recommendedShield: 'cloud-armor-waf',
        antiPatternHints: {
          'memorystore-redis': 'Memorystore is an internal VPC Redis cache, not a global HTTP edge PoP cache.',
          'cloud-storage': 'Cloud Storage is the origin bucket; Cloud CDN caches those objects at edge PoPs.',
        },
        defaultAntiPatternReason: 'Global HTTP asset caching at the load balancer edge requires Cloud CDN.',
        architecturalRationale: 'Cloud CDN serves cache hits directly from Google edge locations integrated with the ALB.',
      },
      {
        id: 'web-runtime',
        zoneId: 'compute',
        row: 1,
        title: 'Stateless Container API',
        requirementClue: 'Run containerized checkout/API handlers that scale automatically from zero to peak flash-sale concurrency.',
        acceptedServiceIds: ['cloud-run'],
        recommendedShield: 'iam-least-privilege',
        antiPatternHints: {
          'compute-engine-mig': 'VM MIGs incur idle instance cost and OS patching overhead for stateless HTTP containers.',
          'gke-autopilot': 'GKE adds Kubernetes cluster orchestration complexity unnecessary for a single stateless storefront API.',
        },
        defaultAntiPatternReason: 'Stateless scale-to-zero HTTP containers fit Cloud Run with minimal operational overhead.',
        architecturalRationale: 'Cloud Run bills per request/CPU-second and scales containers rapidly via Serverless NEGs.',
      },
      {
        id: 'orders-db',
        zoneId: 'data',
        row: 1,
        title: 'Regional ACID Orders DB',
        requirementClue: 'Persist relational checkout orders (< 10 TB) with automatic cross-zone synchronous standby failover.',
        acceptedServiceIds: ['cloud-sql-ha', 'alloydb-postgres'],
        recommendedShield: 'kms-secret-manager',
        antiPatternHints: {
          'bigquery-dw': 'BigQuery is an analytical OLAP warehouse, not a low-latency transactional checkout database.',
          'cloud-storage': 'Object storage cannot execute row-level ACID relational order transactions.',
        },
        defaultAntiPatternReason: 'Regional relational checkout transactions require Cloud SQL Regional HA (or AlloyDB).',
        architecturalRationale: 'Cloud SQL Regional HA replicates synchronously to a standby zone for automatic failover.',
      },
      {
        id: 'media-origin',
        zoneId: 'data',
        row: 2,
        title: 'Product Media Origin',
        requirementClue: 'Store millions of immutable product images and static bundles backing the CDN origin.',
        acceptedServiceIds: ['cloud-storage'],
        recommendedShield: 'kms-secret-manager',
        antiPatternHints: {
          'firestore-db': 'Firestore stores structured JSON documents (<= 1 MiB), not large binary media catalogs.',
          'cloud-bigtable': 'Bigtable serves wide-column telemetry, not HTTP static media objects.',
        },
        defaultAntiPatternReason: 'Immutable binary media and CDN backend buckets belong in Cloud Storage.',
        architecturalRationale: 'Cloud Storage provides 11 nines durability and native backend-bucket integration with Cloud CDN.',
      },
    ],
    edges: [
      { id: 'e1', fromSlotId: 'ingress-lb', toSlotId: 'edge-cache', protocolLabel: 'GET /static/*' },
      { id: 'e2', fromSlotId: 'ingress-lb', toSlotId: 'web-runtime', protocolLabel: 'HTTPS /api/*' },
      { id: 'e3', fromSlotId: 'edge-cache', toSlotId: 'media-origin', protocolLabel: 'Origin Fetch' },
      { id: 'e4', fromSlotId: 'web-runtime', toSlotId: 'orders-db', protocolLabel: 'Private IP SQL' },
    ],
    distractorServiceIds: ['compute-engine-mig', 'cloud-nat', 'bigquery-dw', 'memorystore-redis'],
    solutionSummary:
      'Global External ALB + Cloud CDN absorb public traffic at Google edge PoPs, routing dynamic requests to Cloud Run and persisting relational orders in Cloud SQL HA while serving media from Cloud Storage.',
  },
  {
    id: 'arc-102-zero-trust-portal',
    code: 'ARC-102',
    trackId: 'foundations',
    title: 'Zero-Trust Workforce Operations Portal',
    difficulty: 'Associate',
    workloadBrief:
      'Expose an internal employee operations app without corporate VPNs, backed by sub-millisecond session lookups and live document sync.',
    targetSla: '99.95% Identity-Gated Access',
    costFocus: 'Eliminate bastion VMs and VPN concentrators via BeyondCorp Zero-Trust.',
    zones: [
      { id: 'edge', label: 'BeyondCorp Edge', ink: 'edge', column: 1 },
      { id: 'compute', label: 'Internal App & Cache', ink: 'compute', column: 2 },
      { id: 'data', label: 'Document State', ink: 'data', column: 3 },
    ],
    slots: [
      {
        id: 'zt-frontdoor',
        zoneId: 'edge',
        row: 1,
        title: 'Identity-Verified HTTPS Entry',
        requirementClue: 'Terminate employee HTTPS requests globally so Identity-Aware Proxy can enforce Google Workspace identity.',
        acceptedServiceIds: ['global-ext-alb'],
        recommendedShield: 'identity-aware-proxy',
        antiPatternHints: {
          'cloud-cdn': 'Employee portals serve authenticated per-user dynamic state rather than public edge caches.',
          'apigee-api': 'Apigee targets external partner API monetization rather than Workforce IAP web portals.',
        },
        defaultAntiPatternReason: 'IAP-protected web portals sit behind an External Application Load Balancer.',
        architecturalRationale: 'Global External ALB integrates natively with Identity-Aware Proxy for BeyondCorp verification.',
      },
      {
        id: 'portal-app',
        zoneId: 'compute',
        row: 1,
        title: 'Containerized Workforce App',
        requirementClue: 'Host the stateless internal React/Node portal container with zero VM maintenance.',
        acceptedServiceIds: ['cloud-run'],
        recommendedShield: 'iam-least-privilege',
        antiPatternHints: {
          'cloud-run-functions': 'Multi-route full-stack web portals fit Cloud Run services better than single-trigger functions.',
        },
        defaultAntiPatternReason: 'Stateless internal web portals run cleanly on Cloud Run with Ingress restricted to the ALB.',
        architecturalRationale: 'Cloud Run with `internal-and-cloud-load-balancing` ingress ensures requests cannot bypass IAP.',
      },
      {
        id: 'session-cache',
        zoneId: 'compute',
        row: 2,
        title: 'Sub-Millisecond Session Store',
        requirementClue: 'Cache ephemeral RBAC tokens and hot dashboard lookups in memory (< 1 ms latency).',
        acceptedServiceIds: ['memorystore-redis'],
        recommendedShield: 'iam-least-privilege',
        antiPatternHints: {
          'cloud-storage': 'Object storage has tens-of-milliseconds latency and is unsuitable for ephemeral sub-ms session keys.',
          'bigquery-dw': 'BigQuery query startup takes hundreds of milliseconds—never use it as a session cache.',
        },
        defaultAntiPatternReason: 'Sub-millisecond VPC key-value session caching requires Memorystore for Redis.',
        architecturalRationale: 'Memorystore Standard Tier provides cross-zone HA Redis accessible via Direct VPC Egress.',
      },
      {
        id: 'ticket-docs',
        zoneId: 'data',
        row: 1,
        title: 'Live Collaborative Ticket DB',
        requirementClue: 'Store hierarchical ops tickets with real-time browser listener updates and ACID document writes.',
        acceptedServiceIds: ['firestore-db'],
        recommendedShield: 'kms-secret-manager',
        antiPatternHints: {
          'cloud-bigtable': 'Bigtable lacks real-time client SDK listeners and document-level secondary indexes.',
        },
        defaultAntiPatternReason: 'Hierarchical documents with live UI sync map directly to Firestore.',
        architecturalRationale: 'Firestore provides ACID document transactions and real-time snapshot listeners with scale-to-zero pricing.',
      },
    ],
    edges: [
      { id: 'e1', fromSlotId: 'zt-frontdoor', toSlotId: 'portal-app', protocolLabel: 'IAP Signed JWT' },
      { id: 'e2', fromSlotId: 'portal-app', toSlotId: 'session-cache', protocolLabel: 'VPC Redis TLS' },
      { id: 'e3', fromSlotId: 'portal-app', toSlotId: 'ticket-docs', protocolLabel: 'gRPC Document Sync' },
    ],
    distractorServiceIds: ['cloud-cdn', 'apigee-api', 'cloud-bigtable', 'bigquery-dw'],
    solutionSummary:
      'Global ALB guarded by Identity-Aware Proxy authenticates workforce users before reaching Cloud Run, backed by Memorystore for sub-ms sessions and Firestore for collaborative ticket state.',
  },
];
