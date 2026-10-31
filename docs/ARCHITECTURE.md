# Architecture

GCP Card Clash is a **client-only single-page app**: React 19, TypeScript and Vite, with a lazily loaded React Three Fiber board. There is no backend. The curriculum ships in the bundle, and campaign progress lives in the browser's `localStorage`.

The code is organised as five **bounded contexts** under `src/modules/`, each with a public `index.ts` facade. The authoritative registry is [`architecture/CONTEXT_MAP.md`](architecture/CONTEXT_MAP.md), and the decisions behind it are the [ADRs](adr/README.md).

## Context map

Arrows mean "imports the public facade of". Dependencies only point inward, and `arena` never imports `diorama`: the composition root injects the 3D board into it.

```mermaid
flowchart TB
  subgraph root["Composition root"]
    main["main.tsx"] --> app["App.tsx"]
  end

  subgraph ui["UI contexts"]
    arena["arena<br/>2D playboard, HUD, dialogs"]
    diorama["diorama<br/>3D Cloud Diorama board"]
  end

  subgraph core["Core contexts"]
    battle["battle<br/>pure turn engine"]
    progression["progression<br/>stars, ranks, bosses"]
    catalog["catalog<br/>cards and blueprints"]
  end

  shared["shared<br/>icons, sound board"]
  storage[("localStorage")]

  app --> arena
  app --> catalog
  app --> progression
  app -. "lazy loadDioramaBoard()" .-> diorama
  arena --> battle
  arena --> catalog
  arena --> progression
  arena --> shared
  diorama --> battle
  diorama --> catalog
  diorama --> shared
  battle --> catalog
  progression -- "BrowserProgressRepository" --> storage
```

| Context | Owns | Layers |
|---|---|---|
| `catalog` | 41 cards, 19 blueprints across 5 tracks, the grid diagram model and lane router, official doc references | `domain` → `application/ports` → `adapters/outbound` |
| `battle` | The deterministic match engine: decks, energy, placement, shields, captures, incidents, Rival AI, scoring | `domain` → `application/usecases` |
| `progression` | Best stars and score per blueprint, boss defeats, Architect Rank | `domain` → `application/ports` → `adapters/outbound` |
| `arena` | The React UI: header, diagram, hand dock, inspector, dialogs, immersive HUD, end-turn playback | `presentation` |
| `diorama` | The 3D board: island layout, camera fit, state-to-event diffing, models, VFX, post-processing | `domain` (pure) + `presentation` (R3F) |

## Hexagonal rings

`catalog` and `progression` are full ports-and-adapters contexts. The domain has zero framework imports, the application layer talks to the outside only through a port, and adapters implement that port.

```mermaid
flowchart LR
  subgraph progression
    direction LR
    pd["domain/progress.ts<br/>CampaignProgress, deriveArchitectRank"]
    pu["application/usecases<br/>recordScenarioOutcome"]
    pp["application/ports<br/>ProgressRepository"]
    pa1["adapters/outbound<br/>BrowserProgressRepository"]
    pa2["adapters/outbound<br/>InMemoryProgressRepository"]
    pu --> pd
    pu --> pp
    pa1 -. implements .-> pp
    pa2 -. implements .-> pp
  end

  subgraph catalog
    direction LR
    cd["domain<br/>card.ts, blueprint.ts"]
    cp["application/ports<br/>CatalogRepository"]
    ca["adapters/outbound<br/>StaticCatalogRepository + gcp-*.ts data"]
    cp --> cd
    ca -. implements .-> cp
  end
```

The in-memory adapter is what the tests use, so no test touches real browser storage.

## Boot sequence

The Three.js chunk is about 1.25 MB minified, so it is only fetched when the browser can draw it.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant M as main.tsx
  participant A as App.tsx
  participant W as ArenaWorkbench
  participant D as diorama chunk

  B->>M: load index.html and the main bundle
  M->>A: render App in StrictMode
  A->>A: create StaticCatalogRepository and BrowserProgressRepository
  A->>A: detectWebGLSupport()
  A->>W: inject repositories and boardRenderer3d
  alt WebGL available (default view is 3D)
    W->>D: lazy import of loadDioramaBoard()
    D-->>W: DioramaBoard component
  else no WebGL
    W->>W: 2D grid diagram only
  end
```

## One player action

Every move goes through the pure engine and comes back as a new immutable `MatchState`. The 3D board never reads the engine's rules: it diffs the previous and next state into **board events** and animates those.

```mermaid
sequenceDiagram
  autonumber
  actor P as Player
  participant UI as arena (useArenaController)
  participant E as battle.performMatchAction
  participant D as diorama (diffBoardEvents)
  participant S as sound board

  P->>UI: select a card, then a pad or slot
  UI->>E: performMatchAction(state, blueprint, cardsById, action)
  E-->>UI: next MatchState (or the same state plus an explanatory log entry)
  UI->>D: matchState prop changes
  D->>D: diffBoardEvents(previous, next)
  D->>D: card-deployed, shield-locked, slot-captured ... VFX
  D->>S: play the matching cue
```

## End of turn

`resolveEndTurnSequence` returns **every intermediate state**: one per Rival action, then the start of the next turn. The UI commits them one at a time, 750 ms apart, so the Rival's turn plays out like a real opponent.

```mermaid
sequenceDiagram
  autonumber
  participant UI as arena
  participant E as battle engine
  participant R as Rival AI (planRivalTurn)

  UI->>E: resolveEndTurnSequence(state)
  E->>R: beginRivalTurn: +1 Energy, draw up to 6
  loop until no useful move or the tier's limits are hit
    R->>R: choose energy, deploy, capture, shield or discard
    R->>E: performCardAction(..., 'rival', action)
  end
  E->>E: startNextTurn: player +1 Energy, draw up to 6
  E->>E: drawIncidentForTurn, then strikeIncident if one is due
  E-->>UI: [rival step 1, rival step 2, ..., settled state]
  loop each step
    UI->>UI: commit the state after 750 ms
  end
  opt status is completed
    UI->>UI: recordScenarioOutcome and open the debrief
  end
```

## Source layout

```text
src/
├── main.tsx, App.tsx          # entry point and composition root
├── modules/
│   ├── catalog/               # domain · application/ports · adapters/outbound
│   ├── battle/                # domain · application/usecases
│   ├── progression/           # domain · application/ports · adapters/outbound
│   ├── arena/                 # presentation (React UI)
│   └── diorama/               # domain (pure) · presentation (R3F)
├── shared/                    # gcp-icons.tsx, audio/sound-board.ts
└── styles/                    # global CSS by surface
tests/modules/<context>/       # mirrors src/modules 1:1
public/audio, public/models    # CC0 sounds and Kenney glTF models
```

## Rules that keep it maintainable

- Import other contexts only through their `index.ts`, never a private file.
- Keep `domain/` free of React, Three.js and browser APIs, so it is tested without mocks.
- Record boundary changes as an ADR in [`adr/`](adr/README.md) and update the context map in the same change.
- Every card and blueprint cites official Google Cloud docs. `tests/modules/catalog/references.test.ts` enforces this (ADR-0010).
