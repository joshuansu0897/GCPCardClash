/**
 * Reference Architecture Blueprints for Track 4 (Vertex AI & Enterprise GenAI).
 */

import type { ArchitectureBlueprint } from '../../domain/blueprint';

export const VERTEX_AI_BLUEPRINTS: readonly ArchitectureBlueprint[] = [
  {
    id: 'arc-401-enterprise-rag',
    code: 'ARC-401',
    trackId: 'vertex-ai',
    title: 'Grounded Enterprise RAG Knowledge Assistant',
    difficulty: 'Specialist',
    workloadBrief:
      'Build an internal legal/engineering GenAI assistant grounded strictly in private company manuals with zero data exfiltration, sub-20ms semantic recall, and citation evaluation logging.',
    targetSla: '99.9% Grounded GenAI Perimeter',
    costFocus: 'Retrieve top-k chunks via ANN index before invoking Gemini tokens.',
    zones: [
      { id: 'app', label: 'Zero-Trust App Layer', ink: 'compute', column: 1 },
      { id: 'ai', label: 'Vertex AI Reasoning & Recall', ink: 'ai', column: 2 },
      { id: 'corpus', label: 'Corpus & Eval Perimeter', ink: 'data', column: 3 },
    ],
    slots: [
      {
        id: 'rag-gateway',
        zoneId: 'app',
        row: 1,
        title: 'Streaming Chat Orchestrator',
        requirementClue: 'Serve Server-Sent Events (SSE) chat responses to authenticated employees with scale-to-zero containers.',
        acceptedServiceIds: ['cloud-run'],
        recommendedShield: 'identity-aware-proxy',
        antiPatternHints: {
          'compute-engine-mig': 'Always-on VM groups waste budget when internal chat traffic drops overnight.',
        },
        defaultAntiPatternReason: 'Streaming SSE GenAI orchestrators fit serverless Cloud Run gated by IAP.',
        architecturalRationale: 'Cloud Run supports long-lived HTTP/2 and SSE token streaming with IAP workforce identity headers.',
      },
      {
        id: 'llm-endpoint',
        zoneId: 'ai',
        row: 1,
        title: 'Grounded Foundation Model',
        requirementClue: 'Synthesize cited answers from retrieved context chunks under enterprise IAM and zero-training guarantees.',
        acceptedServiceIds: ['vertex-gemini'],
        recommendedShield: 'vpc-service-controls',
        antiPatternHints: {
          'document-ai': 'Document AI extracts fields/layout from files; conversational RAG synthesis requires Vertex AI Gemini.',
        },
        defaultAntiPatternReason: 'Enterprise multimodal grounded answer synthesis requires a Vertex AI Gemini Endpoint.',
        architecturalRationale: 'Vertex AI Gemini keeps prompts inside your VPC Service Controls perimeter and never trains on customer data.',
      },
      {
        id: 'ann-index',
        zoneId: 'ai',
        row: 2,
        title: 'Semantic Embedding Index',
        requirementClue: 'Query 50 million dense + sparse document embeddings in < 10 ms with ACL metadata filtering.',
        acceptedServiceIds: ['vertex-vector-search'],
        recommendedShield: 'vpc-service-controls',
        antiPatternHints: {
          'cloud-storage': 'Scanning raw files in Cloud Storage on every prompt cannot perform sub-10ms vector ANN retrieval.',
          'pubsub-bus': 'Pub/Sub is a message bus, not a nearest-neighbor vector index.',
        },
        defaultAntiPatternReason: 'Ten-millisecond semantic ANN retrieval across tens of millions of chunks requires Vertex AI Vector Search.',
        architecturalRationale: 'Vertex AI Vector Search (ScaNN) combines semantic similarity with department ACL token restricts.',
      },
      {
        id: 'source-corpus',
        zoneId: 'corpus',
        row: 1,
        title: 'Versioned Source Manual Bucket',
        requirementClue: 'Store authoritative PDF/Markdown manuals with CMEK encryption and citation deep-links.',
        acceptedServiceIds: ['cloud-storage'],
        recommendedShield: 'kms-secret-manager',
        antiPatternHints: {
          'memorystore-redis': 'Volatile Redis caches are never the authoritative document source of truth.',
        },
        defaultAntiPatternReason: 'Authoritative versioned enterprise document corpora belong in Cloud Storage.',
        architecturalRationale: 'Cloud Storage Versioning tracks manual revisions and triggers re-embedding pipelines on object updates.',
      },
      {
        id: 'eval-telemetry',
        zoneId: 'corpus',
        row: 2,
        title: 'Faithfulness & Cost Eval Table',
        requirementClue: 'Log prompt/response citations, latency, token spend, and groundedness scores for SQL quality audits.',
        acceptedServiceIds: ['bigquery-dw'],
        recommendedShield: 'vpc-service-controls',
        antiPatternHints: {
          'cloud-nat': 'Cloud NAT is a network egress component, not an evaluation warehouse.',
        },
        defaultAntiPatternReason: 'Large-scale GenAI telemetry, token cost dashboards, and evaluation datasets belong in BigQuery.',
        architecturalRationale: 'Vertex AI request-response logging streams directly into BigQuery for continuous RAG faithfulness monitoring.',
      },
    ],
    edges: [
      { id: 'e1', fromSlotId: 'rag-gateway', toSlotId: 'ann-index', protocolLabel: 'Embed + Top-K ANN' },
      { id: 'e2', fromSlotId: 'rag-gateway', toSlotId: 'llm-endpoint', protocolLabel: 'Grounded Prompt' },
      { id: 'e3', fromSlotId: 'source-corpus', toSlotId: 'ann-index', protocolLabel: 'Chunk Embeddings' },
      { id: 'e4', fromSlotId: 'llm-endpoint', toSlotId: 'eval-telemetry', protocolLabel: 'Eval & Token Logs' },
    ],
    distractorServiceIds: ['document-ai', 'compute-engine-mig', 'pubsub-bus', 'memorystore-redis'],
    solutionSummary:
      'IAP-gated Cloud Run retrieves ACL-filtered chunks from Vertex AI Vector Search (indexed from CMEK Cloud Storage) and synthesizes cited answers via Vertex AI Gemini inside a VPC-SC perimeter, logging evaluations to BigQuery.',
  },
  {
    id: 'arc-402-doc-intake',
    code: 'ARC-402',
    trackId: 'vertex-ai',
    title: 'Intelligent Claims & Invoice AI Pipeline',
    difficulty: 'Specialist',
    workloadBrief:
      'Automate multi-page scanned medical/insurance claim PDFs: trigger on upload, parse complex tables/checkboxes, adjudicate policy rules with Gemini, and land structured rows for finance.',
    targetSla: '99.9% Auditable Async Intake',
    costFocus: 'Use specialized OCR parser first; invoke LLM only on extracted structured JSON.',
    zones: [
      { id: 'intake', label: 'Event Intake & Control', ink: 'compute', column: 1 },
      { id: 'ai', label: 'Document & GenAI Plane', ink: 'ai', column: 2 },
      { id: 'finance', label: 'Adjudicated Warehouse', ink: 'data', column: 3 },
    ],
    slots: [
      {
        id: 'claim-dropzone',
        zoneId: 'intake',
        row: 1,
        title: 'Encrypted PDF Upload Bucket',
        requirementClue: 'Accept signed-URL multi-page PDF/TIFF claim uploads encrypted with customer-managed keys.',
        acceptedServiceIds: ['cloud-storage'],
        recommendedShield: 'kms-secret-manager',
        antiPatternHints: {
          'firestore-db': 'Multi-megabyte scanned PDF/TIFF packets exceed Firestore 1 MiB document limits.',
        },
        defaultAntiPatternReason: 'Multi-page PDF uploads via Signed URLs belong in Cloud Storage.',
        architecturalRationale: 'Cloud Storage Signed URLs let clients upload large scans directly without proxying bytes through compute.',
      },
      {
        id: 'intake-workflow',
        zoneId: 'intake',
        row: 2,
        title: 'Event-Driven AI Step Controller',
        requirementClue: 'Trigger automatically on `object.v1.finalized` to sequence OCR, LLM adjudication, and human review.',
        acceptedServiceIds: ['workflows-eventarc'],
        recommendedShield: 'iam-least-privilege',
        antiPatternHints: {
          'cloud-cdn': 'Cloud CDN caches public web assets; it cannot orchestrate multi-step AI API calls.',
          'dataflow-beam': 'Stepwise API orchestration with human-review callbacks fits Eventarc + Workflows cleaner than Beam.',
        },
        defaultAntiPatternReason: 'Cloud Storage CloudEvents triggering stateful multi-API steps map to Workflows + Eventarc.',
        architecturalRationale: 'Eventarc routes GCS finalization events to Workflows, handling retries and human-in-the-loop pauses.',
      },
      {
        id: 'ocr-parser',
        zoneId: 'ai',
        row: 1,
        title: 'Layout & Form OCR Processor',
        requirementClue: 'Extract bounding boxes, checkboxes, line-item tables, and confidence scores from skewed PDF scans.',
        acceptedServiceIds: ['document-ai'],
        recommendedShield: 'vpc-service-controls',
        antiPatternHints: {
          'vertex-vector-search': 'Vector Search indexes embeddings; it does not perform OCR or form table extraction.',
        },
        defaultAntiPatternReason: 'Bounding-box OCR, checkbox detection, and form table parsing require Document AI.',
        architecturalRationale: 'Document AI Form/Invoice Processors return structured entities with per-field confidence scores.',
      },
      {
        id: 'policy-llm',
        zoneId: 'ai',
        row: 2,
        title: 'Policy Reasoning & Summary Model',
        requirementClue: 'Evaluate extracted claim JSON against policy clauses and output a schema-constrained decision rationale.',
        acceptedServiceIds: ['vertex-gemini'],
        recommendedShield: 'vpc-service-controls',
        antiPatternHints: {
          'cloud-bigtable': 'Bigtable is a NoSQL store, not a reasoning foundation model.',
        },
        defaultAntiPatternReason: 'Complex policy reasoning with controlled JSON schema output requires Vertex AI Gemini.',
        architecturalRationale: 'Vertex AI Gemini Controlled Generation guarantees valid JSON adjudication outputs for downstream SQL.',
      },
      {
        id: 'claims-dw',
        zoneId: 'finance',
        row: 1,
        title: 'Actuarial & Finance Warehouse',
        requirementClue: 'Consolidate adjudicated claim rows, confidence metrics, and fraud cohort SQL queries.',
        acceptedServiceIds: ['bigquery-dw'],
        recommendedShield: 'vpc-service-controls',
        antiPatternHints: {
          'memorystore-redis': 'Actuarial finance reporting requires durable SQL analytics in BigQuery, not volatile RAM.',
        },
        defaultAntiPatternReason: 'Structured actuarial and finance analytics belong in BigQuery.',
        architecturalRationale: 'BigQuery stores structured claim JSON/columns with column-level policy tags for PII/PHI governance.',
      },
    ],
    edges: [
      { id: 'e1', fromSlotId: 'claim-dropzone', toSlotId: 'intake-workflow', protocolLabel: 'Eventarc Finalized' },
      { id: 'e2', fromSlotId: 'intake-workflow', toSlotId: 'ocr-parser', protocolLabel: 'BatchProcess RPC' },
      { id: 'e3', fromSlotId: 'ocr-parser', toSlotId: 'policy-llm', protocolLabel: 'Structured Layout JSON' },
      { id: 'e4', fromSlotId: 'policy-llm', toSlotId: 'claims-dw', protocolLabel: 'Schema-Validated Row' },
    ],
    distractorServiceIds: ['firestore-db', 'vertex-vector-search', 'dataflow-beam', 'memorystore-redis'],
    solutionSummary:
      'Signed uploads to CMEK Cloud Storage fire Eventarc into Cloud Workflows, chaining Document AI layout OCR with Vertex AI Gemini policy reasoning before landing governed records in BigQuery.',
  },
];
