# GCP Card Clash — Claude Handoff Context & Roadmap

This document contains the complete context, architecture, current implementation state, and actionable step-by-step roadmap for continuing development in **Claude** (via Claude Code CLI, web Claude, or Claude Desktop).

---

## 1. Project Overview & Origin

- **Project Name**: GCP Card Clash
- **Location**: `C:\Users\USER\Documents\Projects\GCPCardClash`
- **Concept**: Modeled after AWS's official educational game **"AWS Card Clash — an Architecture Design Game"** (`cardclash.skillbuilder.aws`), but built for **Google Cloud Platform (GCP)** to teach real-world GCP architecture, service capabilities, SLA trade-offs, and security best practices in an interactive, gamified workbench.
- **Current Core Gameplay Loop**:
  - **Turn Energy System**: Players start with energy, play Infrastructure-as-Code / Provisioning tools (`gcloud CLI`, `Terraform`, `Cloud Build`) to grant `+1E` or `+2E`, and spend energy to deploy services.
  - **Service Deployment**: Deploy valid GCP services (`1E–3E`) to specific architecture perimeter slots (e.g., Ingress, App Tier, Persistence, Analytics, AI). Valid placements score base points + topological flow synergy bonuses (`+25` / `+40`).
  - **Defense-in-Depth Security Shields**: Deploy Security controls (`Cloud Armor WAF`, `VPC Service Controls`, `Cloud IAM Least Privilege`, `Cloud KMS CMEK`, `Identity-Aware Proxy`) to harden nodes (`+60` optimal match bonus, `+35` baseline).
  - **Hostile Node Capture**: An AI Rival Architect deploys and can capture unshielded player slots (and vice-versa).
  - **Dual Modes**: **Solo Battle** vs. AI Rival (turn-based, scores, mistakes, 1–3 star ratings) AND **Guided Study Mode** (pressure-free exploration revealing reference solutions, exam tips, and architectural trade-offs on every slot).

---

## 2. Technical Stack

- **Runtime & Language**: Node.js, TypeScript 5.8+, React 19 (`react: ^19.0.0`, `react-dom: ^19.0.0`).
- **Build Tool**: Vite 6.2+.
- **Testing**: Vitest 3.0+ with JSDOM and `@testing-library/react`.
- **3D Engine (Installed)**:
  - `three: ^0.186.1`
  - `@react-three/fiber: ^9.8.2`
  - `@react-three/drei: ^10.7.9`
  - `@react-three/test-renderer: ^9.1.1`
  - `@types/three: ^0.186.0`
- **No external server required**: 100% client-side SPA with `localStorage` campaign progression, deployable directly to Firebase Hosting or Cloud Storage static hosting.

---

## 3. Architecture & Code Constitution

The repository strictly adheres to **Tier 3 Hexagonal / Clean Architecture** with inward-only dependencies (`Adapters -> Application -> Domain`):

```
src/
├── App.tsx                     # Composition root wiring static adapters & UI
├── main.tsx                    # Entrypoint
├── shared/
│   └── gcp-icons.tsx           # Uniform 1.75px stroke technical SVG icons (zero emoji)
├── styles/
│   ├── tokens-and-shell.css    # CSS custom properties, split-flap counters, typography
│   └── board-and-dialogs.css   # Board framing, card styles, native <dialog> rules
└── modules/
    ├── catalog/                # Bounded Context: GCP Cards & Architecture Blueprints
    │   ├── domain/             # card.ts, blueprint.ts (zero outside dependencies)
    │   ├── application/        # ports/catalog-repository.ts, usecases/list-blueprints.ts
    │   ├── adapters/outbound/  # static-catalog-repository.ts, gcp-cards-*.ts, gcp-blueprints-*.ts
    │   └── index.ts            # Public boundary facade
    ├── battle/                 # Bounded Context: Pure Deterministic Card Clash Engine
    │   ├── domain/             # match-types.ts, deck-rules.ts, placement-rules.ts,
    │   │                       # scoring.ts, shield-rules.ts, ai-rival.ts
    │   ├── application/        # usecases/play-match.ts
    │   └── index.ts            # Public boundary facade
    ├── progression/            # Bounded Context: Campaign Mastery & Storage
    │   ├── domain/             # progress.ts (stars, score, ranks)
    │   ├── application/        # ports/progress-repository.ts, usecases/record-match-result.ts
    │   ├── adapters/outbound/  # in-memory-progress-repository.ts, browser-progress-repository.ts
    │   └── index.ts            # Public boundary facade
    └── arena/                  # Bounded Context: 2D Playboard UI (Preserved as fallback)
        ├── presentation/       # flight-header, blueprint-canvas, topology-edges-svg,
        │                       # spec-inspector-panel, hand-dock, scenario-dialog, etc.
        └── index.ts            # Public boundary facade
```

### Architectural Memory (ADRs)
- `docs/adr/0001-adopt-hexagonal-and-adr-memory.md`: Initial architecture adoption.
- `docs/adr/0002-pure-domain-card-clash-engine-and-browser-progress-port.md`: Pure domain rules engine.
- `docs/adr/0003-adopt-react-three-fiber-diorama-renderer-and-campaign-context.md`: R3F 3D renderer and campaign world map context.
- `docs/architecture/CONTEXT_MAP.md`: Context map tracking public facades and ports.

---

## 4. Current Status & Verification State

- **Unit & Integration Tests**: `npm test` -> **5 test files, 18/18 tests passing**.
- **TypeScript & Build**: `npm run build` -> Clean compile, outputting to `dist/`.
- **Git Status**: Working tree has uncommitted improvements (3D card tilt & foil mechanics in 2D, test additions). Clean and compiling.
- **Dependencies**: Three.js, R3F, and Drei are already installed in `node_modules`.

---

## 5. Next Objective: The 3D "Cloud Diorama" Video Game Upgrade

The user selected the following direction for upgrading GCP Card Clash into a true interactive video game:

### 1. Visual World: "Cloud Diorama"
- **Aesthetic**: Bright, glossy, toy-like 3D diorama.
- **Board**: A floating isometric island in the cloud sky. Each architectural slot is a physical data-center pad.
- **Cards**: Chunky rounded physical cards with thickness, bevels, and foil sheen in Google Cloud subsystem colors (Compute Cobalt `#1A56DB`, Data Teal `#0E7490`, Edge Ochre `#B45309`, Shield Vermilion `#B91C1C`, Vertex AI Emerald `#15803D`).
- **Interactive Deploys**: Deploying a card physically flies it to the pad, popping a stylized 3D miniature building (server racks, database vaults, satellite dish, AI crystalline core) onto the pad.
- **Traffic VFX**: Animated packet pulses stream along 3D glowing roads between connected nodes when flow synergies are active.
- **Security Shields**: Deploying a shield generates a glowing translucent protective dome over the node pad.

### 2. Content Expansion Scope (Medium Tier: ~60 Cards, 16 Blueprints, 6 Tracks)
- **Currently exists**: 32 cards, 8 blueprints across 4 tracks (`foundations`, `architect`, `serverless-data`, `vertex-ai`).
- **To add**:
  - **+28 Cards**: Expand to 60 cards total (adding Anthos/GDC, Cloud Armor Adaptive Protection, Chronicle SIEM, Cloud Spanner Graph, Vertex AI Feature Store, MedLM, GKE Enterprise, AlloyDB Omni, etc.).
  - **+2 New Tracks**:
    1. `platform-k8s`: Modern App Delivery & Kubernetes Platform (GKE Enterprise, Cloud Deploy, Anthos, Config Sync, Binary Authorization).
    2. `governance-security`: Cloud Security, Sovereignty & Compliance (Security Command Center Premium, Chronicle SIEM, Cloud DLP/Sensitive Data Protection, Assured Workloads).
  - **+8 New Blueprints**: 2 new blueprints per each of the 6 tracks = 16 reference blueprints total.

### 3. Game Features
- **Animated 3D Card Loop**: Draw animation, card hover lift, drag/fly to slot, impact shake, takeover capture animation, shield lock-in.
- **Particles & Combat VFX**: Deploy impact rings, packet streams along bus paths, glowing shield domes, rival attack beams.
- **Campaign World Map**: Overworld map with 6 regional nodes, progressive unlocks based on star count, and boss battle scenarios with an aggressive AI Rival profile.
- **Sound & Controls**: Web Audio sound effects (synthesized or clean audio clips) with volume/mute toggle.
- **Fallback / Dual Mode**: The existing 2D `Arena` is kept as a lightweight / non-WebGL fallback, while the 3D `Diorama` becomes the primary experience.

---

## 6. Slices Implementation Roadmap

### Slice 1: Content Expansion (Catalog Context)
- Extend `src/modules/catalog/domain/card.ts` and `blueprint.ts` with new track IDs (`platform-k8s`, `governance-security`) and capabilities.
- Create `gcp-cards-platform-k8s.ts` and `gcp-cards-security-governance.ts` in `src/modules/catalog/adapters/outbound/`.
- Add 8 new blueprints (bringing total to 16) in `gcp-blueprints-platform.ts` and `gcp-blueprints-governance.ts`.
- Update `static-catalog-repository.ts` and unit tests in `tests/modules/catalog/catalog.test.ts`.

### Slice 2: Boss Rival Logic (Battle Context)
- In `src/modules/battle/domain/ai-rival.ts`, add a `RivalProfile` option (`standard` vs `boss`).
- Boss profile: starts with higher energy, targets player nodes aggressively from Turn 2, and employs strategic counter-shielding.
- Add unit tests in `tests/modules/battle/battle.test.ts`.

### Slice 3: Campaign Context (`src/modules/campaign/`)
- Create new Bounded Context `src/modules/campaign/`:
  - `domain/world-map.ts`: 6 region nodes, path connections, boss levels.
  - `domain/unlock-rules.ts`: Star thresholds for unlocking regions.
  - `index.ts`: Public facade.
- Update `docs/architecture/CONTEXT_MAP.md` and ADR-0003.

### Slice 4: 3D Board & Diorama Domain (`src/modules/diorama/domain/`)
- Pure math & state diffing:
  - `domain/board-layout.ts`: Converts 2D slot grid coordinates `(column, row)` into 3D world coordinates `(x, y, z)` on the floating island.
  - `domain/board-events.ts`: Pure diff function comparing `previousState` and `nextState` to generate animation cues (`card-deployed`, `slot-captured`, `shield-locked`, `energy-gained`).

### Slice 5: R3F 3D Canvas & Diorama Scene (`src/modules/diorama/adapters/`)
- Components under `src/modules/diorama/presentation/`:
  - `DioramaCanvas.tsx`: R3F Canvas setup, isometric camera rig (`OrthographicCamera` or tilted `PerspectiveCamera`), directional sunshine lighting, soft ambient light.
  - `FloatingIsland.tsx`: Low-poly floating landmass with rounded terraces representing Perimeter Zones.
  - `SlotPad.tsx`: 3D data-center pad with glowing LED edges, hover highlight, and drop target.
  - `BuildingMiniature.tsx`: Stylized 3D geometry representing deployed services (containers, database vaults, edge towers, AI brain crystals).
  - `RoadFlowPipes.tsx`: Glowing 3D tubular buses with flowing dash materials or instanced particle packets.
  - `ShieldDome.tsx`: Translucent Fresnel hex dome over shielded nodes.
  - `Card3D.tsx`: Interactive 3D cards in hand with cursor tilt, thickness, and deploy toss animation.

### Slice 6: Game Shell & HUD Integration
- Combine the 3D Scene with the 2D HUD (fixed split-flap counters, energy capacitor, telemetry logs).
- Add Campaign World Map modal/screen.
- Add toggle for "3D Diorama" vs "Classic 2D Drafting Sheet".

---

## 7. Useful Terminal Commands

```bash
# Start local Vite development server
npm run dev

# Run full Vitest test suite
npm test

# Production build and typecheck
npm run build
npm run typecheck
```
