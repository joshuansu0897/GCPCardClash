# ADR-0009: CC0 model kits, a code-only scene look, and a shared sound board

* **Status**: Accepted
* **Date**: 2026-10-27
* **Bounded Contexts**: diorama,arena,shared
* **Supersedes**: None

## Context

A comparison with commercial architecture card games showed that the gap was art, not the engine. The repository had no art or audio assets at all: every building, actor and prop on the 3D island was built from code primitives (boxes, cones, cylinders), and the game was silent. We evaluated moving to Unity or Godot and chose to stay on React Three Fiber and fix the art pipeline first.

## Considered Options

1. **CC0 model kits plus a code-only scene look (chosen)**: Kenney's low-poly kits (CC0) for buildings, actors and props, optimized glTF in `public/models`, with lighting, sky and post-processing written in code.
   * Pros: real models today at about 430 KB in total, a consistent stylized look, no licence risk, and no new runtime CDN dependency.
   * Cons: a generic kit look until we commission bespoke models. Models no longer take the subsystem colour.
2. **Bespoke Blender models**: Cons: slow to start and needs an artist.
3. **Improve the procedural primitives only**: Cons: the smallest visual gain.

## Decision

* **Models**:
  * `diorama/presentation/kit-models.tsx` maps building archetypes, context-actor kinds and decor kinds to named Kenney models.
  * `KitModel` clones a model (with its skeleton when it is animated), fits it to a target footprint resting on y = 0, enables shadows, and loops an optional clip. The mini characters play `idle`.
  * Models are optimized with glTF-Transform (meshopt geometry, WebP textures of at most 512 px). They load through `useGLTF` with Draco off, so no decoder is fetched from a CDN.
  * `public/models/CREDITS.md` lists every source file.
* **Scene look** (`scene-look.tsx`):
  * A gradient sky texture as the scene background, needed because post-processing drops canvas alpha.
  * A light-card `Environment`.
  * `@react-three/postprocessing` with Bloom, a horizontal-band TiltShift2, a Vignette and ACES tone mapping.
  * Low-power devices (4 or fewer cores, or a viewport under 720 px wide) get the `lite` stack, without multisampling or blur.
  * There is no screen-space ambient occlusion: N8AO blanked the canvas under software WebGL.
* **Camera**: the camera lowers from about 59° to about 49° so the buildings show their fronts.
* **Sound**:
  * `src/shared/audio/sound-board.ts` is a small Web Audio player. Browser access is injected through `SoundBoardDeps`. Each file is decoded once, the mute choice is persisted, and the player stays silent without Web Audio.
  * `diorama` times board-event cues to the VFX timeline (`board-sounds.ts`: toss, land, building pop, capture, shield, incident, energy, mistake, win and loss jingles).
  * `arena` plays card-select and end-turn sounds, and the header has a mute toggle.

## Consequences

* **Hexagonal Ring Placement**:
  * All of this is presentation code: `diorama/presentation` and `arena/presentation`.
  * The sound player is shared kernel code (like `gcp-icons`) with no domain imports.
  * Domain layouts (`board-layout`, `terrace-decor`) are unchanged; only their rendering changed.
* **Positive**:
  * The island reads as a small cloud city, the game has audio feedback, and the first visit shows a loading bar while the models stream in.
* **Trade-offs**:
  * The 2D sheet plays only UI sounds, because board-event cues live in the 3D renderer.
  * Sounds are OGG, which some older Safari versions cannot decode, so those players get silence.
  * Ambient occlusion is still to be revisited on real GPUs.

## Compliance

* `tests/shared/audio/sound-board.test.ts` covers decode-once playback, mute persistence and the silent fallback.
* `tests/modules/diorama/kit-models-and-sounds.test.ts` checks that every mapped model and sound file exists and is credited, and checks the cue timing.
* Verified with `evaluate_code.py`, `adr_manager.py audit` and a browser playthrough of ARC-101.
