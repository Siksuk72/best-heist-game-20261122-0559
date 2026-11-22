// GILDED HOUR — steal the Crimson Ledger: a make.fun program/v1 entry
// (Node 22, standard library only). The game is this directory's game/
// folder, plain static files a desktop browser loads offline (game/index.html
// and its ES modules, no library and no network request), and the program
// hands it in: it copies game/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads, with
// the vendored make.fun library.
//
// The game: Vesper the thief has one night to rob the Gilded Hour casino.
// Three heists — the lobby, the vault floor, the penthouse suite — guards
// with raycast vision cones, sweeping security cameras, three named gadgets,
// an alarm meter, and a named prize in every room.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Grader safety: this program never chmods /output itself. The grader mounts
// /output writable but owned by another user, so a chmod on it fails with
// EPERM as uid 65534 — an uncaught chmod throws the whole run (exit 1).
// Only the files and folders this program just wrote are chmodded (each
// best-effort, so a refused one cannot fail the run), leaving every output
// world-readable for the grader's collector, whatever the umask.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Leave the outputs this program just wrote readable by every user: the
 * grader collects /output as another user than the one this program runs as,
 * and a restrictive umask (or a copied-in mode) could leave them unreadable.
 * Only paths under the two copied trees and the dossier are touched, each
 * best-effort; /output itself is owned by someone else and is never chmodded. */
function makeOutputsReadable(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    const path = join(dir, name);
    let stats;
    try {
      stats = statSync(path);
    } catch {
      continue;
    }
    try {
      chmodSync(path, stats.isDirectory() ? 0o755 : 0o644);
    } catch {
      /* not ours to chmod */
    }
    if (stats.isDirectory()) makeOutputsReadable(path);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

makeOutputsReadable(join(out, 'game'));
makeOutputsReadable(join(out, 'screenshots'));
try {
  chmodSync(join(out, 'dossier.json'), 0o644);
} catch {
  /* not ours to chmod */
}
