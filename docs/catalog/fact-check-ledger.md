# Curriculum Fact-Check Ledger

Claims in `src/modules/catalog/adapters/outbound` checked against official Google Cloud pages (see [ADR-0010](../adr/0010-ground-curriculum-content-in-official-google-cloud-documentation.md)). Each card and blueprint lists its sources in its `references` field.

**Checked**: 2026-10-27

## Corrections

| Entry | Claim before | Verdict | Now | Source |
| --- | --- | --- | --- | --- |
| `vertex-gemini` | 99.9% SLA | Corrected | 99.5% online inference SLA | https://cloud.google.com/vertex-ai/generative-ai/sla |
| `vertex-gemini` | Vertex AI Gemini Endpoint | Renamed | Gemini on Agent Platform (Gemini Enterprise Agent Platform, formerly Vertex AI) | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models |
| `vertex-vector-search` | Vertex AI Vector Search | Renamed | Agent Platform Vector Search | https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/vector-search/overview |
| `vertex-pipelines` | Vertex AI Pipelines | Renamed | Agent Platform Pipelines | https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/pipelines/introduction |
| TRK-04 and `GcpCategory` | Vertex AI | Renamed | Agent Platform | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models |
| `vertex-vector-search` | Sub-10 ms, billions of embeddings | Removed | ScaNN ANN index over massive datasets | https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/vector-search/overview |
| `vertex-ai-search` | Vertex AI Search (Agent Builder) | Corrected | Agent Search (formerly Vertex AI Search) | https://docs.cloud.google.com/generative-ai-app-builder/docs |
| `gke-autopilot` | 99.95% control plane + pods | Corrected | 99.95% control plane, 99.9% pods | https://cloud.google.com/kubernetes-engine/sla |
| `workflows-eventarc` | 99.95% | Corrected | 99.9% | https://cloud.google.com/workflows/sla |
| `cloud-interconnect` | 10 or 100 Gbps circuits | Corrected | 10, 100 or 400 Gbps | https://docs.cloud.google.com/network-connectivity/docs/interconnect/concepts/dedicated-overview |
| `alloydb-postgres` | 4x faster than standard PostgreSQL | Corrected | More than 4x faster for transactional workloads than self-managed PostgreSQL | https://cloud.google.com/alloydb |
| `cloud-bigtable` | Avoid for datasets under 1 TB | Removed | Avoid for multi-row transactions and joins | https://docs.cloud.google.com/bigtable/docs/overview |
| `cloud-bigtable` | 99.999% multi-cluster | Clarified | 99.999% with multi-cluster routing across 3+ regions | https://cloud.google.com/bigtable/sla |
| `datastream-cdc` | Sources: MySQL, PostgreSQL, Oracle | Corrected | Adds SQL Server, MongoDB and Spanner | https://docs.cloud.google.com/datastream/docs/sources |
| `cloud-deploy` | Builds container images | Corrected | Delivery only; builds come from Cloud Build | https://docs.cloud.google.com/deploy/docs/overview |
| `dataproc-spark` | Dataproc Serverless | Corrected | Managed Service for Apache Spark (Dataproc) | https://docs.cloud.google.com/managed-spark/docs/serverless-overview |
| ARC-202 | Cloud SQL caps SLA at 99.95% | Removed | Enterprise Plus HA is 99.99%; hint now cites the columnar engine | https://cloud.google.com/sql/sla |
| ARC-304 | Function "too short" for the work | Corrected | One function request runs at most 60 minutes | https://docs.cloud.google.com/run/docs/configuring/request-timeout |
| ARC-403 | Gemini answers only from given passages | Softened | Gemini is prompted to answer only from them | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/overview |
| ARC-501 | GKE sends workload metrics automatically | Corrected | System metrics and logs are automatic | https://docs.cloud.google.com/kubernetes-engine/docs/how-to/configure-metrics |
| ARC-503 | Cloud Build signs provenance with a Cloud KMS key | Corrected | Cloud Build generates signed SLSA provenance (Google-managed key) | https://docs.cloud.google.com/build/docs/securing-builds/generate-validate-build-provenance |

## Verified as written

Spanner and Firestore multi-region 99.999%; BigQuery 99.99%; AlloyDB HA 99.99%; Apigee 99.99% (2+ regions); Memorystore Standard 99.9%; Compute Engine multi-zone 99.99%; Cloud Load Balancing 99.99%; Cloud Run, Cloud Run functions and Pub/Sub 99.95%; Cloud Storage multi/dual-region 99.95%; Cloud SQL Enterprise HA 99.95%; Dataflow 99.9%; Interconnect 99.99% (production topology); turbo replication 15-minute RPO; IAP TCP range `35.235.240.0/20`; Cloud SQL storage up to 64 TB; Firestore 1 MiB documents; Spanner UUIDv4 and bit-reversed sequences; Cloud Tasks explicit invocation up to 500 QPS per queue; Cloud Run jobs up to 168 h; free BigQuery batch loads; HA VPN 1–3 Gbps per tunnel; Bigtable single-row atomic writes.

## Watch list

* Cloud Deployment Manager reached end of support on 2026-03-31; no card teaches it.
* Renamed cards keep a "formerly Vertex AI …" note in their summary or exam tip, because exam guides may still use the old names. Internal ids (`vertex-*`, track `vertex-ai`) are unchanged so saved progress still loads.
