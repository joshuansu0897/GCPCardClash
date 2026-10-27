# Asset credits

All 3D models in `public/models` and all sounds in `public/audio` are by **Kenney** (https://kenney.nl),
released under **Creative Commons Zero (CC0 1.0)**: free for personal, educational and commercial use,
no attribution required. We credit Kenney anyway.

## Models (optimized: meshopt geometry, WebP textures at most 512 px)

| File | Kit | Source model |
| :--- | :--- | :--- |
| `industrial-building-a.glb` | City Kit (Industrial) 2.0 | `building-a` |
| `industrial-building-e.glb` | City Kit (Industrial) 2.0 | `building-e` |
| `industrial-building-k.glb` | City Kit (Industrial) 2.0 | `building-k` |
| `industrial-tank-large.glb` | City Kit (Industrial) 2.0 | `detail-tank-large` |
| `industrial-tank.glb` | City Kit (Industrial) 2.0 | `detail-tank` |
| `industrial-container-a.glb` | City Kit (Industrial) 2.0 | `shipping-container-a` |
| `industrial-windmill.glb` | City Kit (Industrial) 2.0 | `windmill` |
| `industrial-solar-panel.glb` | City Kit (Industrial) 2.0 | `solar-panel-landscape` |
| `commercial-building-c.glb` | City Kit (Commercial) 2.1 | `building-c` |
| `commercial-skyscraper-c.glb` | City Kit (Commercial) 2.1 | `building-skyscraper-c` |
| `space-satellite-dish.glb` | Space Kit | `satelliteDish_large` |
| `space-desk-computer.glb` | Space Kit | `desk_computer` |
| `space-wireless.glb` | Space Kit | `machine_wireless` |
| `td-tower-crystals.glb` | Tower Defense Kit | `tower-round-crystals` |
| `td-tower-square.glb` | Tower Defense Kit | `tower-square-build-f` |
| `td-crystal.glb` | Tower Defense Kit | `detail-crystal` |
| `td-rocks.glb` | Tower Defense Kit | `detail-rocks` |
| `nature-tree-default.glb` | Nature Kit | `tree_default` |
| `nature-tree-oak.glb` | Nature Kit | `tree_oak` |
| `nature-pine.glb` | Nature Kit | `tree_pineRoundA` |
| `nature-bush.glb` | Nature Kit | `plant_bushLarge` |
| `nature-flowers.glb` | Nature Kit | `flower_yellowA` |
| `mini-character-female-b.glb` | Mini Characters | `character-female-b` (animated) |
| `mini-character-male-a.glb` | Mini Characters | `character-male-a` (animated) |

Re-create a model with the glTF-Transform CLI (v4), for example:

```sh
npx @gltf-transform/cli optimize "building-a.glb" industrial-building-a.glb \
  --compress meshopt --texture-compress webp --texture-size 512 --simplify false
```

## Sounds (`public/audio`, OGG Vorbis, unmodified)

| File | Kit | Source sound |
| :--- | :--- | :--- |
| `card-select.ogg` | Interface Sounds | `select_002` |
| `card-toss.ogg` | Interface Sounds | `drop_002` |
| `card-land.ogg` | Impact Sounds | `impactPlank_medium_000` |
| `build-pop.ogg` | Interface Sounds | `confirmation_002` |
| `capture.ogg` | Sci-Fi Sounds | `laserLarge_001` |
| `shield.ogg` | Sci-Fi Sounds | `forceField_001` |
| `energy.ogg` | Interface Sounds | `pluck_001` |
| `incident.ogg` | Sci-Fi Sounds | `lowFrequency_explosion_000` |
| `mistake.ogg` | Interface Sounds | `error_004` |
| `end-turn.ogg` | Interface Sounds | `switch_002` |
| `victory.ogg` | Music Jingles | `Pizzicato jingles/jingles_PIZZI01` |
| `defeat.ogg` | Music Jingles | `Pizzicato jingles/jingles_PIZZI07` |
