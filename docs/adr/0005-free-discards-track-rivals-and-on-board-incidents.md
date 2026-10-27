# ADR-0005: Free Discards, Track Rivals and Worlds, and On-Board Incidents

* **Status**: Accepted
* **Date**: 2026-10-26
* **Bounded Contexts**: battle,arena,diorama
* **Supersedes**: None
* **Amends**: ADR-0004 (replaces only its "2 cycles per turn" rule; the rest stays in force)

## Context

Playtesting raised three problems:

* **Discarding felt cramped.** A "cycle" discarded a card and drew a replacement immediately, and it was capped at 2 per turn. Players wanted to clear out as many dead cards as they liked and get new ones at the start of their next turn.
* **Incidents were only a modal notification.** Nothing happened on the board itself.
* **Tracks had no identity.** Only bosses differed by track. In everyday battles every track looked the same and was played against a generic "Rival Architect".

## Decision

* **Free, unlimited discards.** `discard-card` moves a card from hand to the discard pile at no cost and draws nothing. `discardsRemaining`, `rivalDiscardsRemaining` and `DISCARDS_PER_TURN` are removed.
* **Start-of-turn draw.** Each architect draws back up to `HAND_LIMIT` at the start of their own turn: the player in `startNextTurn`, the Rival in `beginRivalTurn`. The end-of-turn refills are gone. When the deck runs dry, the discard pile is reshuffled with a seed derived from the match seed, so replays stay deterministic.
* **Rival discards.** The Rival AI discards dead cards: up to 1 per turn for standard rivals, and any number for bosses. This is a tactics difference only.
* **Track rivals.** `rival-roster.ts` (renamed from `boss-roster.ts`) defines one everyday Rival and one boss per track:
  * Foundations: Rack Gremlin / The Monolith.
  * Global & Hybrid: Latency Wraith / Shadow Admin.
  * Serverless & Data: Backlog Hydra / The Data Swamp.
  * Vertex AI: Drift Sprite / The Hallucinator.

  `resolveRivalForTrack(trackId, profile)` returns the persona for a match.
* **Track worlds.** `diorama/domain/track-theme.ts` gives each track its own sky, light, island materials, ambient particles and enemy form (rack, wraith, hydra, oracle). The enemy hovers behind the island, has a DOM nameplate, and lunges whenever the Rival lands a card. A boss is the crowned, larger elder of its track's family.
* **Incidents manifest on the board.** Every `IncidentCard` carries a `manifestation` (`meteor-shower`, `flyover`, `sky-fall`, `lightning`, `packet-stream`) with a palette and a target: the whole island, the zone an outage picked, or one subsystem ink. The rules never read it.
  * `diffBoardEvents` emits `incident-struck` with the pads the incident knocked out or stripped.
  * The diorama plays the matching spectacle in 3D.
  * The 2D sheet plays a CSS equivalent (`incident-fx-2d.tsx`).
  * The announcement becomes a non-modal toast that appears after the effect has started.
* **Fresh matches.** The composition root injects `nextMatchSeed`, so every match gets a new shuffle and incident sequence. The workbench defaults to a fixed seed, which keeps tests deterministic.

## Considered Options

* **Discarding**:
  * Keep the capped cycle (discard and draw at once, 2 per turn). Rejected: this is what playtesters found cramped.
  * Unlimited discards with an immediate redraw. Rejected: a player could dig through the deck in one turn for free.
  * **Unlimited free discards, refilled at the start of the next turn (chosen)**: discarding is unlimited, but it costs tempo.
* **Incidents**:
  * Keep the modal announcement only. Rejected: nothing happened on the board.
  * **Declarative `manifestation` data rendered by each board view (chosen)**: the rules stay unaware of visuals, and both the 3D and 2D boards can play the same incident.
* **Track identity**:
  * Reskin only the bosses. Rejected: everyday battles would still look identical.
  * **One everyday rival, one boss and one world per track (chosen).**

## Consequences

* **Hexagonal Ring Placement**:
  * The discard and draw rules live in `battle/domain/`.
  * Rival personas are domain data in `battle/domain/rival-roster.ts`.
  * Incident manifestations are declarative data on the incident cards.
  * Visual themes and spectacles stay in `diorama/`, and the 2D effects in `arena/presentation/`.
* **Positive**: Discarding is a real decision with a cost in tempo instead of a capped quota. Each track feels like its own world, and incidents are visible events that show which zone or nodes they hit.
* **Trade-offs**:
  * A player who discards heavily plays the Rival's turn with a short hand; this is intended.
  * The incident spectacles add about 10 kB gzip to the lazy diorama chunk.
  * Random seeds in the app mean a given match can only be reproduced from its seed, not from the blueprint alone.

## Compliance

* `tests/modules/battle/discard-and-track-rivals.test.ts` covers:
  * unlimited free discards with no immediate draw;
  * the start-of-turn refill and the deterministic reshuffle;
  * the Rival's identical upkeep;
  * a distinct rival and boss for every track;
  * a manifestation on every incident.
* `tests/modules/diorama/diorama.test.ts` covers `incident-struck` events and a distinct world for each track.
* `tests/modules/arena/match-hud.test.tsx` covers the track enemy in the tray, discarding and drawing through the UI, and the incident toast.
