# GILDED HOUR — steal the Crimson Ledger

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-gold)](https://make.fun/c/best-heist-game-20261122-0559)
[![Node 22](https://img.shields.io/badge/node-22-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**GILDED HOUR — steal the Crimson Ledger: 3 heists, 14 guards, 28 treasures, 3 gadgets.**

Vesper the thief has one night to rob the Gilded Hour casino: the Sapphire Chip
from the lobby, the Crimson Ledger from the vault floor, and the Star of Marlow
from the penthouse suite. Every room is crossed under sweeping guard cones and
wall cameras, with an alarm meter that decides whether the night ends in a
getaway or in cuffs.

## How to play

Serve the game and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

- **WASD / arrows** — move. **Shift** — sprint (fast, loud). **C** — sneak (slow, silent).
- **1 Ghost Smoke** — a cloud that blinds guards and cameras for 5 s (2 per heist).
- **2 EMP Pulse** — kills every camera for 6 s (1 per heist).
- **3 or click Coin Toss** — throw a gold coin; nearby guards go look at it (3 per heist).
- **P** pause · **M** mute · **H** help.

Steal the named prize in each heist, then reach the green EXIT. Felt tables,
safes and palms block sight; curtain alcoves hide you completely. Get caught
three times and the run is over. A heist cleared without tripping the alarm
earns the ghost bonus.

## What is in the box

- `game/` — the whole game as static files: `index.html` plus one clear job per
  module under `game/src/` (config, heists, vision, guards, cameras, world,
  render, audio, input, shots, main). No network requests, no downloaded
  assets; every sound is synthesized with WebAudio.
- `screenshots/` — four real renders of the game's own code in a browser.
- `main.ts` — the make.fun program: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — the kit's copy, unchanged.

## Entry

Built for the make.fun bounty
[best-heist-game-20261122-0559](https://make.fun/c/best-heist-game-20261122-0559)
("Make the best heist game", $50, top 10 share the prize).
