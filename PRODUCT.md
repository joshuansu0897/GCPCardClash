# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + TypeScript + Vite (client-only single-page web application with local browser storage for campaign progress; static-deployable to GitHub Pages or any static host; see `docs/DEPLOYMENT.md`).

## Users

Cloud engineers, software architects, developers, and certification candidates (Cloud Digital Leader, Associate Cloud Engineer, Professional Cloud Architect, Professional Data Engineer, and Machine Learning / Generative AI practitioners) who want to master real-world Google Cloud Platform (GCP) solution design through active problem-solving rather than passive reading or rote multiple-choice memorization.

## Product Purpose

GCP Card Clash turns Google Cloud reference architectures into a turn-based tactical card and topology strategy game paired with an interactive Study/Inspect mode. Success means learners can look at a real business and technical workload (latency, consistency, global scale, security perimeter, event-driven ingestion, or grounded enterprise RAG), select the architecturally sound GCP services, connect them in the right tier, harden them with appropriate GCP security controls, and articulate why alternative services do not fit.

## Positioning

Unlike static architecture diagrams or flashcard quizzes, every match is an active architectural blueprint duel: provisioning tools supply deploy energy, GCP service cards fill concrete topology slots with upstream/downstream synergy, misplacements explain the exact architectural failure mode, and unshielded services can be compromised or captured by the AI rival unless hardened with matching GCP security controls (Cloud IAM, VPC Service Controls, Cloud Armor, IAP, Cloud KMS, Secret Manager).

## Operating Context

Used in desktop and tablet/mobile web browsers during study sessions, architecture prep, or quick tactical matches. Learners alternate between:
1. Selecting one of 19 blueprint scenarios across five GCP tracks, each with an Associate → Professional → Specialist ladder:
   - TRK-01 Cloud Foundations & Zero-Trust
   - TRK-02 Global & Hybrid Cloud Architect
   - TRK-03 Serverless & Streaming Data
   - TRK-04 Agent Platform & Enterprise GenAI
   - TRK-05 Kubernetes & Platform Reliability
2. Playing turn-based matches against the track's boss (drawing Provisioning/Energy, GCP Service, and Security cards; cycling unsuitable cards via Discard; placing services into topology slots; hardening deployed nodes; scoring up to 3 stars).
3. Using Guided Study / Inspect Mode to explore the completed GCP reference architecture, service trade-offs ("Why this service vs. alternatives"), data/control flow links, and Google Cloud Well-Architected Framework pillars.

## Capabilities and Constraints

- 100% client-side execution in v1 with deterministic game engine rules and local persistence (`localStorage`) for unlocked blueprints, best scores, and 1–3 star mastery ratings.
- All GCP service descriptions, architectural slot constraints, security pairings, and anti-pattern explanations must reflect accurate, current Google Cloud Platform architecture best practices (e.g., Cloud Run vs. GKE vs. Compute Engine MIGs; Cloud SQL vs. AlloyDB vs. Cloud Spanner; Firestore vs. Bigtable vs. BigQuery; Pub/Sub + Dataflow + Eventarc + Workflows; Gemini on Agent Platform + Vector Search + grounding). Every card and blueprint cites the official Google Cloud docs it was checked against (ADR-0010).
- Zero cloud credentials or backend servers required to run, play, or test locally.
- Codebase follows Hexagonal / Clean Architecture (`domain/` -> `application/` -> `adapters/`) with strict TypeScript types and automated verification gates.

## Brand Commitments

- Working title: **GCP Card Clash** (educational Google Cloud architecture strategy game inspired by gameplay mechanics of architecture card battlers, built independently with original code, authored vector iconography, and accurate GCP domain content).

## Evidence on Hand

- Authored Google Cloud reference architecture blueprints, service catalog metadata, architectural trade-off rationales, and deterministic battle/scoring rules created within this repository. No external commercial endorsements, user counts, or official Google certification affiliation claims may be fabricated.

## Product Principles

1. **Architectural Truth First**: Gameplay rewards real Google Cloud design principles—never bend cloud architecture accuracy for a gimmick.
2. **Mistakes Teach Immediately**: Placing the wrong service into a slot explains the concrete bottleneck, consistency gap, or security flaw instead of showing a generic error.
3. **Security Is Structural, Not Optional**: Leaving compute, APIs, or data stores unshielded makes them tactically vulnerable on the board, reinforcing Defense-in-Depth and Least Privilege.
4. **Zero-Friction Flow**: Learners can jump into a blueprint match or inspect any card's GCP trade-offs in one click without modal clutter or heavy onboarding walls.
