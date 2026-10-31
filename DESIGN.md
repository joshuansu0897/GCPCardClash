# Design System: GCP Card Clash

**North star: a tactile 3D tabletop.** The board is a floating island diorama. Glossy cards fan out in a hand dock, and a frosted HUD floats over the scene. Colour always carries meaning: each Google Cloud subsystem has one ink, used the same way on cards, zones, pads and diagram lanes.

The source of truth is `src/styles/tokens-and-shell.css` (UI tokens) and `src/modules/diorama/domain/track-theme.ts` (3D worlds). This file explains them; when they disagree, the code wins.

## Subsystem inks

Each ink has a strong colour for text, borders and pads, and a light tint for backgrounds.

| Token | Ink | Tint | Used for |
|---|---|---|---|
| `--color-ink-compute` | `#1a56db` | `#ebf1fd` | Compute (Cloud Run, GKE, Compute Engine), player ownership, primary actions |
| `--color-ink-data` | `#0e7490` | `#e6f4f7` | Databases, storage, messaging and analytics |
| `--color-ink-edge` | `#b45309` | `#fef3e6` | Ingress, CDN, hybrid networking, provisioning energy |
| `--color-ink-shield` | `#b91c1c` | `#fdecec` | Security shields, anti-pattern mistakes, Rival ownership |
| `--color-ink-ai` | `#15803d` | `#eaf6ee` | Agent Platform, Gemini and ML services |

**Ink fidelity rule:** never use a subsystem ink for decoration. If it is blue, it is compute or the player.

## Neutrals

| Token | Value | Role |
|---|---|---|
| `--color-paper-bg` | `#eef2f8` | Page background |
| `--color-paper-sheet` | `#f8fafc` | Raised surfaces: cards, dialogs |
| `--color-paper-recess` | `#e2e8f2` | Recessed trays and inactive controls |
| `--color-carbon-ink` | `#0f172a` | Primary text and dark rails |
| `--color-flap-cell` | `#1b2538` | Score and turn counter cells |
| `--color-slate-ink` | `#475569` | Secondary text |
| `--color-graphite-rule` / `-strong` | `#cbd5e1` / `#94a3b8` | Hairlines and stronger dividers |

## Typography

| Token | Family | Use |
|---|---|---|
| `--font-sans` | **Plus Jakarta Sans** | Headings, body copy, buttons |
| `--font-mono` | **JetBrains Mono** | Counters, short codes (`RUN`, `GCS`), costs, SLA stamps |

Both load from Google Fonts in `index.html`. The type scale is fixed-step: `--text-xs` 0.75rem, `--text-sm` 0.875rem, `--text-base` 1rem, `--text-md` 1.125rem, `--text-lg` 1.3125rem, `--text-xl` 1.5rem. Numbers that change during play use `tabular-nums` so they do not jitter.

## Shape, space and depth

| Group | Tokens |
|---|---|
| Radius | `--radius-xs` 8px · `--radius-sm` 12px · `--radius-md` 20px · `--radius-pill` 999px |
| Spacing | `--space-1` … `--space-6` = 4, 8, 12, 16, 20, 24px |
| Shadow | `--shadow-double-bezel` for framed panels, `--shadow-btn-primary` for the main call to action |
| Motion | `--ease-snappy` for UI transitions, `--spring-easing` for card lifts and pops |

Depth comes from the 3D scene itself, a soft double-bezel frame on HUD panels, and frosted glass (`backdrop-filter`) only on HUD surfaces that float over the diorama.

## The 3D world

Each track has its own world and boss (`track-theme.ts`):

| Track | World | Boss |
|---|---|---|
| TRK-01 Foundations | Legacy Datacenter at Dusk | The Monolith |
| TRK-02 Global & Hybrid | Orbital Night | Shadow Admin |
| TRK-03 Serverless & Data | Mistwater Delta | The Data Swamp |
| TRK-04 Agent Platform & GenAI | Neon Synapse | The Hallucinator |
| TRK-05 Kubernetes & Platform | Polar Control Plane | The YAML Golem |

- **Models:** Kenney CC0 low-poly kits in `public/models` (credits in `public/models/CREDITS.md`).
- **Camera look:** sky gradient, studio environment light, Bloom, a mild tilt-shift, vignette and ACES tone mapping, all written in code (`scene-look.tsx`). Low-power devices get a `lite` stack without multisampling or tilt-shift.
- **Shaders:** any custom shader must keep its output finite. One NaN pixel is smeared across the whole frame by Bloom (see the WHY comments in `glow-sparkles.tsx` and `shield-dome.tsx`).

## Rules

**Do**
- Use the authored SVG icons in `src/shared/gcp-icons.tsx` for services, shields, energy and stars.
- Open modals with native `<dialog>` and `showModal()` (`use-modal-dialog.ts`).
- Respect `prefers-reduced-motion`: CSS animations have a reduced variant, and the diorama freezes idle motion.
- Pair every mistake with a concrete architectural reason in the log.
- Keep the 2D grid diagram fully playable: it is the fallback when WebGL is missing.

**Don't**
- Use emoji or Unicode symbols as UI icons.
- Add colour that does not map to a subsystem, an owner or a state.
- Lock page scroll with `body { overflow: hidden }` when a dialog opens.
- Hard-code `/models/...` or `/audio/...`. Build asset URLs from `import.meta.env.BASE_URL` (see `docs/DEPLOYMENT.md`).
