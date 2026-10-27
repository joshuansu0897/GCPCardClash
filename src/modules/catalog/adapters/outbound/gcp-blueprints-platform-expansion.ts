/**
 * Track 5 (Kubernetes & Platform Reliability) expansion: the Specialist blueprint.
 */

import type { ArchitectureBlueprint } from '../../domain/blueprint';

export const PLATFORM_OPS_EXPANSION_BLUEPRINTS: readonly ArchitectureBlueprint[] = [
  {
    id: 'arc-503-supply-chain-fleet',
    code: 'ARC-503',
    trackId: 'platform-ops',
    title: 'Secure Supply Chain & Multi-Region GKE Fleet',
    difficulty: 'Specialist',
    workloadBrief:
      'Run a regulated platform on GKE in two regions: only signed, scanned images may deploy, users are served from the nearest healthy cluster, and both clusters share one consistent database.',
    targetSla: '99.99% Multi-Region · Only Attested Images Run',
    costFocus: 'Block bad images before they ship instead of cleaning up after an incident.',
    zones: [
      { id: 'supply', label: 'Software Supply Chain', ink: 'compute' },
      { id: 'edge', label: 'Multi-Cluster Gateway', ink: 'edge' },
      { id: 'clusters', label: 'Regional GKE Fleet', ink: 'compute' },
      { id: 'ops', label: 'Fleet Observability', ink: 'data' },
      { id: 'state', label: 'Global State', ink: 'data' },
    ],
    contextNodes: [
      { id: 'developers', kind: 'users', label: 'Developers', cell: { col: 1, row: 1 }, insideCloud: false },
      { id: 'customers', kind: 'users', label: 'Customers', cell: { col: 1, row: 2 }, insideCloud: false },
      { id: 'on-call', kind: 'users', label: 'On-Call SRE', cell: { col: 5, row: 1 }, insideCloud: false },
    ],
    slots: [
      {
        id: 'ci-pipeline',
        zoneId: 'supply',
        cell: { col: 2, row: 1 },
        title: 'Hermetic Build & Attest',
        requirementClue: 'Build every image from source in isolated workers and sign an attestation of how it was built.',
        acceptedServiceIds: ['cloud-deploy'],
        recommendedShield: 'kms-secret-manager',
        antiPatternHints: {
          'compute-engine-mig': 'Builds on long-lived VMs can be tampered with between runs.',
        },
        defaultAntiPatternReason: 'Managed, attested builds and releases are Cloud Build with Cloud Deploy.',
        architecturalRationale: 'Cloud Build generates signed SLSA build provenance that Binary Authorization can verify.',
      },
      {
        id: 'image-registry',
        zoneId: 'supply',
        cell: { col: 3, row: 1 },
        title: 'Scanned Image Registry',
        requirementClue: 'Store signed images, scan them for vulnerabilities, and expose the results to deploy policy.',
        acceptedServiceIds: ['artifact-registry'],
        recommendedShield: 'vpc-service-controls',
        antiPatternHints: {
          'cloud-storage': 'A bucket stores files but cannot scan images or be pulled by Kubernetes.',
        },
        defaultAntiPatternReason: 'Signed, scanned container images live in Artifact Registry.',
        architecturalRationale: 'Binary Authorization checks the registry\'s attestations before any pod starts.',
      },
      {
        id: 'fleet-gateway',
        zoneId: 'edge',
        cell: { col: 2, row: 2 },
        title: 'Multi-Cluster Gateway',
        requirementClue: 'Send each customer to the nearest healthy cluster and drain a region that fails.',
        acceptedServiceIds: ['global-ext-alb'],
        recommendedShield: 'cloud-armor-waf',
        antiPatternHints: {
          'cloud-interconnect': 'Interconnect links private datacenters; customers arrive over the internet.',
        },
        defaultAntiPatternReason: 'Cross-region routing to GKE fleets is a global load balancer (multi-cluster Gateway).',
        architecturalRationale: 'A multi-cluster Gateway programs one global load balancer across both clusters.',
      },
      {
        id: 'cluster-east',
        zoneId: 'clusters',
        cell: { col: 3, row: 2 },
        title: 'Primary Region Cluster',
        requirementClue: 'Run the platform services in the primary region and admit only attested images.',
        acceptedServiceIds: ['gke-autopilot'],
        recommendedShield: 'iam-least-privilege',
        antiPatternHints: {
          'cloud-run': 'The platform relies on Kubernetes operators and custom resources.',
        },
        defaultAntiPatternReason: 'A Kubernetes fleet with admission policy runs on GKE.',
        architecturalRationale: 'Autopilot with Binary Authorization enforcement rejects unsigned images at admission.',
      },
      {
        id: 'cluster-west',
        zoneId: 'clusters',
        cell: { col: 3, row: 3 },
        title: 'Secondary Region Cluster',
        requirementClue: 'Serve the same services from a second region, ready to take all traffic on failover.',
        acceptedServiceIds: ['gke-autopilot'],
        recommendedShield: 'iam-least-privilege',
        antiPatternHints: {
          'compute-engine-mig': 'A VM group in the second region cannot run the same Kubernetes manifests.',
        },
        defaultAntiPatternReason: 'A matching Kubernetes cluster in a second region is another GKE cluster.',
        architecturalRationale: 'Fleet-wide config sync keeps both clusters identical, so failover changes nothing but routing.',
      },
      {
        id: 'fleet-ops',
        zoneId: 'ops',
        cell: { col: 4, row: 1 },
        title: 'Fleet Golden Signals',
        requirementClue: 'Watch latency, errors and saturation across both clusters and page on SLO burn.',
        acceptedServiceIds: ['cloud-monitoring'],
        recommendedShield: 'iam-least-privilege',
        antiPatternHints: {
          'bigquery-dw': 'A warehouse analyses yesterday; the fleet needs live alerting.',
        },
        defaultAntiPatternReason: 'Fleet-wide SLOs and alerting are Cloud Monitoring.',
        architecturalRationale: 'Managed Prometheus collects metrics from both clusters into one place for SLO alerts.',
      },
      {
        id: 'global-db',
        zoneId: 'state',
        cell: { col: 4, row: 2 },
        title: 'Multi-Region Transaction DB',
        requirementClue: 'Let both clusters write the same records with strong consistency and no failover step.',
        acceptedServiceIds: ['cloud-spanner'],
        recommendedShield: 'kms-secret-manager',
        antiPatternHints: {
          'cloud-sql-ha': 'A regional database makes the second cluster write across regions and fail over by hand.',
          'firestore-db': 'Firestore suits app documents, not the platform\'s relational transactions.',
        },
        defaultAntiPatternReason: 'Strongly consistent multi-region writes are Cloud Spanner.',
        architecturalRationale: 'A multi-region Spanner configuration keeps writing in both regions with a 99.999% SLA.',
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'developers', toNodeId: 'ci-pipeline', protocolLabel: 'git push' },
      { id: 'e2', fromNodeId: 'ci-pipeline', toNodeId: 'image-registry', protocolLabel: 'Signed image', returnLabel: 'Scan verdict' },
      { id: 'e3', fromNodeId: 'image-registry', toNodeId: 'cluster-east', protocolLabel: 'Attested pull' },
      { id: 'e4', fromNodeId: 'customers', toNodeId: 'fleet-gateway', protocolLabel: 'HTTPS', returnLabel: 'Responses' },
      { id: 'e5', fromNodeId: 'fleet-gateway', toNodeId: 'cluster-east', protocolLabel: 'Nearest region', returnLabel: 'JSON' },
      { id: 'e6', fromNodeId: 'fleet-gateway', toNodeId: 'cluster-west', protocolLabel: 'Failover' },
      { id: 'e7', fromNodeId: 'cluster-east', toNodeId: 'global-db', protocolLabel: 'Txn', returnLabel: 'Commit' },
      { id: 'e8', fromNodeId: 'cluster-west', toNodeId: 'global-db', protocolLabel: 'Txn' },
      { id: 'e9', fromNodeId: 'cluster-east', toNodeId: 'fleet-ops', protocolLabel: 'Golden signals' },
      { id: 'e10', fromNodeId: 'fleet-ops', toNodeId: 'on-call', protocolLabel: 'Page', returnLabel: 'Ack' },
    ],
    references: [
      { title: 'Generate and validate build provenance', url: 'https://docs.cloud.google.com/build/docs/securing-builds/generate-validate-build-provenance' },
      { title: 'Binary Authorization overview', url: 'https://docs.cloud.google.com/binary-authorization/docs/overview' },
      { title: 'About multi-cluster Gateways', url: 'https://docs.cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-gateways' },
      { title: 'Spanner regional, dual-region and multi-region configurations', url: 'https://docs.cloud.google.com/spanner/docs/instance-configurations' },
    ],
    distractorServiceIds: ['cloud-run', 'cloud-sql-ha', 'compute-engine-mig', 'firestore-db'],
    solutionSummary:
      'Cloud Build signs each image\'s build provenance, Artifact Registry scans it, and Binary Authorization admits only attested images to GKE Autopilot clusters in two regions. A multi-cluster Gateway routes customers to the nearest healthy cluster, Spanner keeps one consistent database across both, and Cloud Monitoring watches the golden signals.',
  },
];
