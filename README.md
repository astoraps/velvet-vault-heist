# velvet-vault-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/astoraps/velvet-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/astoraps/velvet-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

High Stakes — The Aurum Casino Heist. One thief, one casino, one night. Kestrel slips past patrolling guards and sweeping security cameras to lift the Aurum collection — the Golden Chip, the Diamond Bracelet, the Emerald Necklace and the Aurum Crown — then reaches the green EXIT before the alarm hits 100%.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Or open `game/index.html` directly.

- **WASD / Arrow keys** — move
- **Shift** — sneak (slower, harder to spot)
- **Q** — toss a coin to distract a guard (or click where to throw it)
- **F** — smoke pellet, blocks vision for a few seconds
- **R** — EMP, switches the cameras off for 6 seconds
- **E** — grab loot up close (walking over a case pockets it too)
- **P** — pause, **M** — mute, **Enter** — start / retry

Every tool makes a little noise: using one adds 4% to the alarm. Guards patrol, get suspicious when they glimpse you, and hunt you down once the alarm trips. Cameras sweep their red cones across the halls. Three casino floors, each bigger and better guarded than the last.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `game/index.html` — the game page.
- `game/src/config.js` — tuning numbers and palette.
- `game/src/random.js` — seeded random.
- `game/src/world.js` — rooms, guards, cameras, loot, alarm, tools.
- `game/src/render.js` — all drawing, HUD and screens.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — synthesized WebAudio sounds, no files.
- `game/src/shots.js` — the screenshot autopilot.
- `game/src/main.js` — boot and the game loop.

MIT licensed. Original art, sounds, music and names — no copy of any commercial game.

---

<sub>Entered on [make.fun](https://make.fun/?ref=p7sabhtf&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
