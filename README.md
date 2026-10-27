# GCP Card Clash

Interactive turn-based **Google Cloud Platform (GCP)** architecture strategy card game and reference topology study workbench inspired by *AWS Card Clash*.

## Features

- **4 Certification & Solution Tracks (8 Reference Blueprints)**:
  - **TRK-01 Cloud Foundations & Zero-Trust** (`ARC-101` Serverless Storefront, `ARC-102` Workforce IAP Portal)
  - **TRK-02 Global & Hybrid Cloud Architect** (`ARC-201` Active-Active Cloud Spanner Payment Core, `ARC-202` 20 Gbps Hybrid Interconnect ERP)
  - **TRK-03 Serverless & Streaming Data** (`ARC-301` Pub/Sub + Dataflow + Bigtable/BigQuery IoT Lakehouse, `ARC-302` Workflows + Eventarc Order Saga)
  - **TRK-04 Vertex AI & Enterprise GenAI** (`ARC-401` Grounded Gemini + Vector Search RAG, `ARC-402` Document AI + Gemini Claims Pipeline)
- **32 Curated GCP Cards Across 3 Families**:
  - **Provisioning Energy**: Cloud Console, `gcloud` CLI, Terraform on GCP, Cloud Build + Infrastructure Manager
  - **GCP Services**: Compute Engine MIG, GKE Autopilot, Cloud Run, Cloud Run Functions, Global External ALB, Cloud CDN, Apigee, Cloud NAT, Dedicated Interconnect, Cloud Storage, Cloud SQL HA, AlloyDB, Cloud Spanner, Firestore, Cloud Bigtable, Memorystore, Pub/Sub, Dataflow, BigQuery, Workflows + Eventarc, Vertex AI Gemini, Vertex AI Vector Search, Document AI
  - **Security & Governance Shields**: Cloud IAM Least-Privilege SA, Cloud Armor WAF, VPC Service Controls, Cloud KMS CMEK + Secret Manager, Identity-Aware Proxy (IAP)
- **Dual Modes**:
  - **Solo Battle vs. AI Rival Architect**: Fund Deploy Energy, earn `+40` Flow Synergy points across connected nodes, harden slots against Rival takeover (`Cost + 1E`), and learn from `-1E` anti-pattern diagnostics to earn 1–3 Mastery Stars.
  - **Guided Study Mode**: Reveals reference GCP services, recommended perimeter shields, SLA targets, and certification exam trade-offs without opponent pressure.

## Architecture

Organized into strict Hexagonal Bounded Contexts (`src/modules/{catalog,battle,progression,arena}`), documented in [`docs/architecture/CONTEXT_MAP.md`](docs/architecture/CONTEXT_MAP.md) and [`docs/adr/`](docs/adr/README.md).

## Commands

```bash
npm install
npm run dev        # Start local Vite dev server
npm test           # Run Vitest unit & integration test suite
npm run typecheck  # Strict TypeScript verification
npm run build      # Production static bundle (Firebase Hosting / Cloud Storage ready)
```


# Local AGY
```
agy --conversation=a589d8a0-12ef-4759-a30b-c1a4eec0f011
```