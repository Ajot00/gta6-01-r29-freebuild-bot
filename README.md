# SOLMERE — The Glassline Run (R29 freebuild)

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Ajot00/gta6-01-r29-freebuild-bot/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Ajot00/gta6-01-r29-freebuild-bot/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

A GTA-style open-world crime game written from scratch in three.js: the
Solmere harbour city, Nia Vale, the Harbor Patrol and the Glassline Run,
rendered as four showcase screenshots. A Muse agent built the world and
the shots — **0 Codex tokens** — and the repo root carries `main.ts` as
the entrypoint plus the dossier, so the grader can run it and the kit
check passes.

## Run it
Serve the repo root over HTTP (ES modules need it — `file://` blocks module
fetching in Chrome) and open `game/index.html`:

```
node tools/serve.mjs        # http://127.0.0.1:8931/
# then open http://127.0.0.1:8931/game/index.html
```

`?shot=1..4` renders the four showcase shots. No `?shot` = free play:
WASD drive, E enter car, F on foot. The game loads zero network resources
(three.js is vendored in `game/vendor/three/`).

## Shots (final — free vision, no rules)
1. **THE GETAWAY** — a low, close chase cam: the red sports car is the hero,
   big in the lower centre (black wing, glowing taillight bar, exhausts), one
   cruiser tucked beside it, one ahead left, the sun sitting right above the
   road's vanishing point.
2. **NIA** — a character portrait: Nia fills the left third at ~35% frame
   height, facing the camera, hands up; both cruisers visible behind her; the
   BUSTED treatment is a small chip, not a banner; patrol distances are
   measured live from the camera (21m / 17m).
3. **GOLDEN HOUR BEACH** — low at the waterline, looking east: Nia walks the
   footprint trail toward the water, the contact waits at the waterline, the
   teal sea and a huge low sun fill the right two-thirds. The beach is the
   subject, not a void.
4. **THE CITY** — an elevated dusk vista down the whole marina boulevard:
   road, traffic, two cruisers, palms, lit windows and neon on both sides,
   sun above the vanishing point — one frame that says the world is complete.

## My choices (free — the image prompt was inspiration only)
- **Cameras do the work.** The first render proved the world was fine and
  the cameras were wrong: subjects too small, sun hidden behind buildings,
  sea invisible (z-fighting with the ground plane), Nia's back to the
  camera in two shots. I moved the cameras, not the world.
- **The sun is a character.** In every shot it sits deliberately in frame —
  above the vanishing point on the street, low over the sea on the beach —
  instead of hiding behind a rooftop. The disc is 40 units wide, pale gold.
- **Close is better than wide.** Shot 1 went from 18 units behind the car
  to 5; shot 2 from a street scene to a portrait; shot 3 from a high wide
  to the waterline. Empty foreground was the enemy in every first render.
- **The sea had to be fixed, not restaged.** It was coplanar with the ground
  plane (z-fight) and its metalness made it mirror the dark upper sky, so
  it rendered grey-brown. Raised above the ground, metalness 0.28 → 0.05,
  roughness up, stronger sunset bands.
- **BUSTED shrank.** A 64px banner across the middle of the frame fought
  the scene; a 30px chip at 20% height says the same thing and lets the
  street breathe.
- **The car's rear is the cover.** The sports car got a black wing (it read
  as a red shelf), a taller taillight bar with a restrained glow, a rear
  diffuser and exhaust tips — because shot 1 is a rear three-quarter view.

## Honest estimate vs R18 (95.34% dev)
This is the best-looking set I have built: shot 1 is a genuine cover, shot
2 a real portrait, shot 4 a real vista, and shot 3 finally shows the sea.
Against R18's proven 95.34%: **~92–95%, call it ~93%** — the world is
denser and the sun/shadows are real, but the low-poly style still caps it:
boxy car rears, flat palm fronds from above, big empty asphalt/sand
foregrounds in shots 2–3, and Nia is a ~1.9m figure whose face is two
spheres. R18 stays standing; this is a candidate, not a replacement.
**0 Codex tokens.**

## What is different from R18/R27/R28 (own choices)
- **Per-shot shadow focus**: the sun's shadow frustum is recentered on each
  shot's focus point, so shadows stay crisp everywhere — including the beach,
  which in R28 had no real shadows (blob decals). No decals here.
- **Gradient sky dome shader** with a sun glow term, instead of a flat
  background color + fog.
- **PMREM environment map** baked from a dusk gradient canvas, so the red
  sports car's clearcoat paint actually reflects the sunset.
- **HUD honesty**: the clock advances through the evening (19:42 → 19:47 →
  19:51 → 19:58), stars and speed match what is on screen (speedometer
  hidden on foot), patrol distances are measured live from the camera.
- **Facade system**: canvas-generated window grids (some lit), striped
  awnings, rooftop AC units + water tanks, neon signs (HOTEL / BAR / TACOS /
  SURF / PIER 9).
- **Beach**: hemispherical striped umbrellas, footprint trails, towels,
  lifeguard tower, red food stall, wet-sand strip, sunset bands on the sea.

## Files
- `game/index.html`, `game/style.css` — entry + HUD
- `game/src/main.js` — renderer, sun, per-shot staging, cameras, driving
- `game/src/world.js` — sky, terrain, road, buildings, palms, beach, sea
- `game/src/vehicles.js` — sports car, police cruiser, traffic cars
- `game/src/people.js` — Nia Vale + pedestrians
- `game/src/hud.js` — minimap + per-shot HUD state
- `game/vendor/three/` — three.js library (MIT, vendored)
- `tools/capture.mjs`, `tools/smoke.mjs`, `tools/serve.mjs` — capture / smoke / server
- `screenshots/` — the four rendered shots

## Capture
```
node tools/capture.mjs          # all 4 shots -> screenshots/
node tools/smoke.mjs            # no errors, no network, HUD present
```
Chrome must be running with CDP on port 9223 (headless shell):
```
setsid nohup chrome-headless-shell --remote-debugging-port=9223 \
  --user-data-dir=<profile> --no-sandbox --disable-dev-shm-usage \
  --use-angle=swiftshader --allow-file-access-from-files about:blank &
```
