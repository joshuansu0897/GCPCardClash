---
name: GCP Card Clash
description: Systems-engineering flight-plan and architectural block-diagram strategy workbench for Google Cloud Platform.
colors:
  compute-cobalt: "#1a56db"
  data-teal: "#0e7490"
  edge-ochre: "#b45309"
  shield-vermilion: "#b91c1c"
  vertex-emerald: "#15803d"
  paper-bg: "#f5f2ea"
  paper-sheet: "#fcfbf7"
  paper-recess: "#ece7da"
  carbon-ink: "#16191d"
  flap-cell: "#232830"
  slate-ink: "#464d57"
  graphite-rule: "#c9c3b5"
  graphite-strong: "#8f8878"
typography:
  display:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  subhead:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
    fontFeature: "tnum"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
components:
  button-primary:
    backgroundColor: "{colors.compute-cobalt}"
    textColor: "{colors.paper-sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "4px 10px"
  button-secondary:
    backgroundColor: "{colors.paper-bg}"
    textColor: "{colors.carbon-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
  button-rail:
    backgroundColor: "{colors.flap-cell}"
    textColor: "{colors.paper-bg}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "5px 10px"
  card-deck:
    backgroundColor: "{colors.paper-sheet}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.sm}"
    padding: "8px"
---

# Design System: GCP Card Clash

## Overview

**Creative North Star: "Systems Flight-Plan & Block-Diagram Playboard"**

GCP Card Clash treats cloud topology design as tactile precision drafting rather than neon-cyberpunk card-battler spectacle or sterile SaaS dashboard boilerplate. Drawing from 1970s–80s systems-engineering block diagrams, avionics flight-plan logs, and concourse telemetry boards, the interface sets crisp carbon-ink structural rails against warm alabaster drafting stock so learners read complex multi-tier Google Cloud architectures without visual fatigue.

Every visual element serves pedagogical clarity. Five disciplined subsystem inks encode Google Cloud architectural planes—Compute, Data & Storage, Edge & Networking, Security & Governance, and Vertex AI—while tabular fixed-cell counters, a physical 6-cell Deploy Energy capacitor gauge, and orthogonal protocol-labeled bus lines make architectural state legible at a glance.

**Key Characteristics:**
- Warm alabaster drafting stock paired with high-contrast carbon-ink telemetry rails and 1px graphite rules.
- Five functional subsystem inks encoding cloud architectural responsibility rather than decorative gradients.
- Strict fixed-rem typographic hierarchy (`IBM Plex Sans` + `IBM Plex Mono`) with `tabular-nums` telemetry alignment.
- Flat tonal surface layering with zero drop-shadow haze, zero glassmorphism, and zero side-stripe border clichés.

## Colors

The palette pairs warm drafting-table paper neutrals with carbon instrument rails and five saturated technical inks mapped 1:1 to Google Cloud architectural subsystems.

### Primary
- **Compute Cobalt** (`#1a56db`): Primary interactive deployment action, player ownership outlines, active topological flow-synergy buses, and Compute service crests (Cloud Run, GKE Autopilot, Compute Engine MIG).

### Secondary
- **Data & Storage Teal** (`#0e7490`): Persistence and analytics subsystem ink for Cloud Spanner, AlloyDB, Cloud SQL HA, BigQuery, Cloud Bigtable, Pub/Sub, Dataflow, and Cloud Storage.
- **Edge & Networking Ochre** (`#b45309`): Public ingress, hybrid fiber, and IaC provisioning energy accents (Global External ALB, Cloud CDN, Apigee, Dedicated Interconnect, Terraform).

### Tertiary
- **Security Vermilion** (`#b91c1c`): Defense-in-depth Shield cards (Cloud Armor, VPC-SC, Cloud IAM, KMS, IAP), unshielded vulnerability alerts, anti-pattern diagnostics, and AI Rival ownership markers.
- **Vertex AI Emerald** (`#15803d`): Generative AI and machine-learning plane indicators (Vertex AI Gemini, Vector Search, Document AI) plus verified security-hardening stamps.

### Neutral
- **Alabaster Drafting Stock** (`#f5f2ea`): Root canvas and recessed blueprint dot-grid field.
- **Elevated Spec Sheet** (`#fcfbf7`): Active blueprint sheet, specification dossier, and tactile hand cards.
- **Recessed Card Tray** (`#ece7da`): Bottom hand dock, subtle specification tags, and inactive controls.
- **Carbon Instrument Ink** (`#16191d`): Top flight-plan header bar, perimeter zone headers, dialog bars, and primary typography.
- **Split-Flap Cell Charcoal** (`#232830`): Fixed-width score/turn digit cells and header control housings.
- **Muted Slate Ink** (`#464d57`): Secondary requirement clues, card summaries, and diagnostic detail copy.
- **Graphite Hairline Rule** (`#c9c3b5`) & **Heavy Spec Rule** (`#8f8878`): Crisp 1px structural dividers and open-slot dashed cutouts.

### Named Rules
**The Subsystem Ink Fidelity Rule.** Never assign Compute Cobalt, Data Teal, Edge Ochre, Security Vermilion, or Vertex AI Emerald arbitrarily; each hue strictly denotes its Google Cloud architectural plane or match actor state.

**The Alabaster-Over-White Rule.** Never substitute `#ffffff` pure white for workspace backgrounds; warm alabaster (`#f5f2ea`) and elevated sheet (`#fcfbf7`) preserve long-session reading comfort.

## Typography

**Display Font:** IBM Plex Sans (with `-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif` fallback)
**Body Font:** IBM Plex Sans (with system sans-serif fallback)
**Label/Mono Font:** IBM Plex Mono (with `ui-monospace, SFMono-Regular, Consolas, monospace` fallback)

**Character:** Technical manual clarity paired with crisp stamped monospace codes, giving service cards and architecture slots the authority of an engineering specification sheet.

### Hierarchy
- **Display** (700, `1.5rem`, line-height `1.25`): Post-match architectural debrief headlines.
- **Headline** (700, `1.3125rem`, line-height `1.3`, tracking `-0.015em`): Active reference blueprint title (`ARC-101 · Resilient Serverless Web Storefront`).
- **Title** (700, `1.125rem`, line-height `1.35`, tracking `-0.01em`): Top brand wordmark and modal `<dialog>` titles.
- **Body** (400, `0.875rem`, line-height `1.45`, max `88ch`): Workload briefs, slot clues, and certification trade-off notes.
- **Label** (600, `0.75rem`, line-height `1.2`, tracking `0.04em`, `tabular-nums`): Split-flap counters, protocol badges, SLA stamps, and energy costs.

### Named Rules
**The Fixed-Step Operate Scale Rule.** Use discrete fixed `rem` steps (`0.75rem` to `1.5rem`) without fluid `clamp()` scaling so dense workbench controls remain crisp and predictable across viewports.

**The Inline Code-Title Rule.** Place blueprint and track identifiers inline inside headings (`ARC-201 · Multi-Region Active-Active Payment Core`) rather than stacking tiny uppercase eyebrow kickers above headings.

## Layout

The workbench uses a three-band full-viewport shell (`grid-template-rows: auto 1fr auto`):
1. **Top Flight-Plan Rail**: Brand wordmark + rank stamp on the left, fixed-cell split-flap scoreboard and 6-bar Energy Capacitor in the center, and Battle/Study mode switch + Curriculum/Reset/Manual controls on the right.
2. **Center Drafting Stage** (`grid-template-columns: minmax(0, 1fr) 340px`, `16px` gap): Left column houses the Alabaster Architecture Drafting Sheet with a 3-column Perimeter Zone grid (`repeat(3, minmax(0, 1fr))`, `20px` gap) overlaid on an SVG orthogonal protocol-arrow canvas; right column (`340px`) houses the live Specification Dossier and Architecture Telemetry Log. Below `1080px`, the inspector stacks cleanly beneath the blueprint; below `900px`, perimeter zones stack vertically into a single readable column.
3. **Bottom Hand Dock** (`grid-template-columns: minmax(0, 1fr) 156px`, `12px` gap): Horizontally scrollable 6-card strip paired with the Cycle Quota counter and primary `End Turn` trigger.

## Elevation & Depth

GCP Card Clash uses **flat tonal drafting-paper layering with zero drop shadows**. Depth is communicated strictly through paper luminance steps (`#ece7da` recessed tray -> `#f5f2ea` dot-grid board -> `#fcfbf7` elevated specification cards -> `#16191d` structural instrument headers) and 1px border state transitions (`1px dashed #8f8878` open slot cutout -> `1px solid #1a56db` deployed node).

### Named Rules
**The Zero-Haze Drafting Rule.** Surfaces never combine 1px borders with soft ambient `box-shadow` ("ghost cards"), hard brutalist `4px 4px 0` offset shadows, or `backdrop-filter` glass blur.

## Shapes

Corners stay tight and technical: `2px` (`xs`) on split-flap digit cells, service code stamps, and action buttons; `4px` (`sm`) on tactile deck cards, slot cutouts, and header controls; `6px` (`md`) on outer drafting sheets and native `<dialog>` frames. Subsystem identity on cards and slots is marked by an internal `2px` horizontal ink bar at the top of the card interior rather than thick colored side-stripe borders.

## Components

### Buttons
- **Shape:** Crisp technical corners (`2px` radius on inline actions, `4px` on rail controls).
- **Primary:** Compute Cobalt (`#1a56db`) fill with Elevated Sheet (`#fcfbf7`) label (`4px 10px` padding; `10px 12px` on `End Turn`), darkening to `#1646b8` on hover.
- **Hover / Focus:** `2px solid #1a56db` `:focus-visible` outline at `2px` offset; disabled buttons hold `0.48` opacity with `not-allowed` cursor.
- **Secondary & Rail:** Alabaster (`#f5f2ea`) with `1px solid #8f8878` for secondary actions; Split-Flap Charcoal (`#232830`) with `1px solid #3c4452` for carbon-rail header triggers.

### Chips
- **Style:** Monospace `IBM Plex Mono` (`0.75rem`, `600` weight), `1px solid` tinted border over a light subsystem ink tint (`#ebf1fd` Compute, `#e6f4f7` Data, `#fef3e6` Edge, `#fdecec` Shield, `#eaf6ee` AI) with `1px 5px` padding and `2px` radius.
- **State:** Static subsystem identification on service cards (`RUN`, `SPN`, `GEM`) and active filter selection on Certification Track tabs.

### Cards / Containers
- **Corner Style:** `4px` radius on deck cards and topology slot cutouts; `6px` on primary sheet containers.
- **Background:** Elevated Spec Sheet (`#fcfbf7`).
- **Shadow Strategy:** Flat tonal contrast (no shadows); selected hand cards lift `translateY(-4px)` with a `1px solid #1a56db` perimeter rule (suppressed automatically under `prefers-reduced-motion: reduce`).
- **Border:** `1px dashed #8f8878` on open architecture slots; `1px solid #c9c3b5` on resting deck cards.
- **Internal Padding:** `8px` on hand cards, `8px 12px` on slot cutouts, `12px 16px` on drafting sheets.

### Navigation
- **Flight-Plan Header:** Single compact carbon-ink bar (`#16191d`) housing the segmented `Battle` / `Study` toggle (active pill `#fcfbf7` text `#16191d`), Blueprints curriculum trigger with cumulative star tally, Reset trigger, and Manual `<dialog>` trigger.

### Energy Capacitor & Split-Flap Readout
- **Split-Flap Readout:** Groups 2 or 4 fixed-width (`21px x 27px`) charcoal cells (`#232830`) displaying zero-padded monospace digits (`YOU`, `RIVAL`, `TURN`) in `tabular-nums`.
- **Energy Capacitor Gauge:** Houses 6 physical vertical bars (`9px x 16px`) inside a charcoal frame, illuminating active Deploy Energy cells in warm amber (`#f59e0b` fill, `#fbbf24` border).

## Do's and Don'ts

### Do:
- **Do** use authored uniform-stroke (`1.75px`) inline SVG icons (`TechnicalIcon`) for all GCP subsystems, shields, bolts, and mastery stars.
- **Do** open modal overlays (`ScenarioCatalogDialog`, `MatchDebriefDialog`, `RulesReferenceDialog`) exclusively with native `<dialog>` and `showModal()` paired with `overscroll-behavior: contain`.
- **Do** nest `@media (prefers-reduced-motion: reduce)` directly inside animated card, slot, and top-layer `<dialog>` rules.
- **Do** pair every anti-pattern card placement with a concrete Google Cloud architectural explanation in the Telemetry Log.

### Don't:
- **Don't** place small uppercase eyebrow/kicker labels above `<h1>`, `<h2>`, or `<h3>` headings.
- **Don't** use Unicode symbols or emoji (`⚡`, `🛡`, `★`, `→`) as UI icons.
- **Don't** apply thick colored `border-left` or `border-top` side stripes (`> 1px`), gradient text, glassmorphic `backdrop-filter`, or soft drop shadows.
- **Don't** lock page scroll with `body { overflow: hidden }` when opening native `<dialog>` modals.
