// GILDED HOUR — the three heists: maps, patrols, cameras and named loot.
// One job: data for every room. No logic lives here; world.js parses it.
//
// Map legend (see config.js TILES): # wall, . marble, : carpet runner,
// T felt table, S safe, P palm, H curtain alcove, L small loot, * star loot,
// E service elevator, D doorway, @ thief spawn, G guard spawn.
// Every map is 32 wide x 16 tall; totals: 14 guards, 28 small treasures.

import { GADGETS } from './config.js';

export const HEISTS = [
  {
    id: 'lobby',
    number: 1,
    name: 'The Gilded Lobby',
    targetName: 'The Sapphire Chip',
    targetBlurb: 'a sapphire the size of a fist, set in the display case',
    map: [
      '################################',
      '#......P........TT........P..L.#',
      '#..L...........................#',
      '#......####....######....####..#',
      '#......#..#....#....#....#..#..#',
      '#..T...#..#....#.*..#....#..#..#',
      '#......#..#....#....#....#..#..#',
      '#......####....##D###....####..#',
      '#...................L..........#',
      '#.P............TT..............#',
      '#...........................L..#',
      '#..TT......P...L....P......TT..#',
      '#..............................#',
      '#....L.........::::............#',
      '#..E..........::::.......@.....#',
      '################################',
    ],
    guards: [
      { waypoints: [[4, 2], [28, 2]], pause: 1.4 },
      { waypoints: [[8, 10], [24, 10], [24, 12], [8, 12]], pause: 1.2 },
      { waypoints: [[4, 13], [27, 13]], pause: 1.0 },
    ],
    cameras: [
      { tx: 16, ty: 0, angleDeg: 90, sweepDeg: 42, speed: 0.55 },
      { tx: 31, ty: 8, angleDeg: 180, sweepDeg: 38, speed: 0.7 },
    ],
  },
  {
    id: 'vault',
    number: 2,
    name: 'The Vault Floor',
    targetName: 'The Crimson Ledger',
    targetBlurb: 'the casino\u2019s black book, locked in the vault',
    map: [
      '################################',
      '#..P......TT........TT......P..#',
      '#..L........................L..#',
      '#....####....########....####..#',
      '#....#..#....#..S...#....#..#..#',
      '#..T.#..#....#..*...#....#..#..#',
      '#....#..#....#......#....#..#..#',
      '#....####....####D###....####..#',
      '#...........L..................#',
      '#..L.........TT......TT.....L..#',
      '#.......L......................#',
      '#..TT....P......L...P.....TT...#',
      '#.........................L....#',
      '#....L..........::::........L..#',
      '#..E...........::::......@.....#',
      '################################',
    ],
    guards: [
      { waypoints: [[4, 2], [28, 2]], pause: 1.2 },
      { waypoints: [[6, 10], [26, 10]], pause: 1.0 },
      { waypoints: [[10, 12], [22, 12], [22, 10], [10, 10]], pause: 1.2 },
      { waypoints: [[2, 11], [2, 14], [14, 14]], pause: 1.4 },
      { waypoints: [[30, 11], [30, 14], [18, 14]], pause: 1.4 },
    ],
    cameras: [
      { tx: 16, ty: 0, angleDeg: 90, sweepDeg: 45, speed: 0.6 },
      { tx: 0, ty: 8, angleDeg: 0, sweepDeg: 40, speed: 0.75 },
      { tx: 31, ty: 13, angleDeg: 180, sweepDeg: 35, speed: 0.65 },
    ],
  },
  {
    id: 'penthouse',
    number: 3,
    name: 'The Penthouse Suite',
    targetName: 'The Star of Marlow',
    targetBlurb: 'a flawless diamond on the penthouse bar',
    map: [
      '################################',
      '#..P....TT..........TT....P..L.#',
      '#..L...........................#',
      '#...........########...........#',
      '#...........#......#.....L.....#',
      '#..T........#..*...#...........#',
      '#...........#......#.....L.....#',
      '#...........###D####...........#',
      '#...................L..........#',
      '#.L....H.........H..........L..#',
      '#.......L......................#',
      '#..TT....P......L...P.....TT...#',
      '#.........................L....#',
      '#....L..........::::........L..#',
      '#..E...........::::......@.....#',
      '################################',
    ],
    guards: [
      { waypoints: [[4, 2], [28, 2]], pause: 1.0 },
      { waypoints: [[6, 9], [24, 9], [24, 12], [6, 12]], pause: 1.0 },
      { waypoints: [[12, 10], [20, 10]], pause: 1.2 },
      { waypoints: [[2, 11], [2, 14], [15, 14]], pause: 1.2 },
      { waypoints: [[30, 11], [30, 14], [17, 14]], pause: 1.2 },
      { waypoints: [[16, 9], [16, 13]], pause: 1.6 },
    ],
    cameras: [
      { tx: 16, ty: 0, angleDeg: 90, sweepDeg: 48, speed: 0.55 },
      { tx: 0, ty: 8, angleDeg: 0, sweepDeg: 42, speed: 0.7 },
      { tx: 31, ty: 8, angleDeg: 180, sweepDeg: 42, speed: 0.7 },
      { tx: 16, ty: 15, angleDeg: 270, sweepDeg: 40, speed: 0.6 },
    ],
  },
];

/** Parse a heist map into positions. Pure data work, no DOM. */
export function parseHeistMap(heist) {
  const loot = [];
  let star = null;
  let exit = null;
  let player = null;
  const guardSpawns = [];
  heist.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      if (ch === 'L') loot.push({ tx: x, ty: y, taken: false });
      else if (ch === '*') star = { tx: x, ty: y, taken: false };
      else if (ch === 'E') exit = { tx: x, ty: y };
      else if (ch === '@') player = { tx: x, ty: y };
      else if (ch === 'G') guardSpawns.push({ tx: x, ty: y });
    }
  });
  return { loot, star, exit, player, guardSpawns };
}

/** Validate every heist map: shape, borders, walkable patrols, required pieces. */
export function validateHeists() {
  const errors = [];
  const walkable = (heist, tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= 32 || ty >= 16) return false;
    const ch = heist.map[ty][tx];
    return !['#', 'T', 'S', 'P'].includes(ch);
  };
  HEISTS.forEach((heist) => {
    if (heist.map.length !== 16) errors.push(`${heist.id}: ${heist.map.length} rows, want 16`);
    heist.map.forEach((row, y) => {
      if (row.length !== 32) errors.push(`${heist.id} row ${y}: ${row.length} chars, want 32`);
      if (!/^[#.:\-TSPL\*ED@GH]+$/.test(row)) errors.push(`${heist.id} row ${y}: bad character`);
    });
    for (let x = 0; x < 32; x += 1) {
      if (heist.map[0][x] !== '#' || heist.map[15][x] !== '#') errors.push(`${heist.id}: top/bottom border open at x=${x}`);
    }
    for (let y = 0; y < 16; y += 1) {
      if (heist.map[y][0] !== '#' || heist.map[y][31] !== '#') errors.push(`${heist.id}: side border open at y=${y}`);
    }
    const parsed = parseHeistMap(heist);
    if (!parsed.star) errors.push(`${heist.id}: no star loot`);
    if (!parsed.exit) errors.push(`${heist.id}: no exit`);
    if (!parsed.player) errors.push(`${heist.id}: no player spawn`);
    if (parsed.loot.length < 4) errors.push(`${heist.id}: only ${parsed.loot.length} small loot`);
    if (parsed.player && !walkable(heist, parsed.player.tx, parsed.player.ty)) errors.push(`${heist.id}: player spawn blocked`);
    if (parsed.exit && !walkable(heist, parsed.exit.tx, parsed.exit.ty)) errors.push(`${heist.id}: exit blocked`);
    if (parsed.star && !walkable(heist, parsed.star.tx, parsed.star.ty)) errors.push(`${heist.id}: star loot blocked`);
    parsed.loot.forEach((l) => {
      if (!walkable(heist, l.tx, l.ty)) errors.push(`${heist.id}: loot at ${l.tx},${l.ty} blocked`);
    });
    heist.guards.forEach((guard, gi) => {
      const pts = guard.waypoints;
      for (let i = 0; i < pts.length; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if (!walkable(heist, a[0], a[1])) errors.push(`${heist.id} guard ${gi}: waypoint ${a} blocked`);
        let [cx, cy] = a;
        let guard2 = 0;
        while ((cx !== b[0] || cy !== b[1]) && guard2 < 200) {
          if (cx !== b[0]) cx += Math.sign(b[0] - cx);
          else if (cy !== b[1]) cy += Math.sign(b[1] - cy);
          if (!walkable(heist, cx, cy)) {
            errors.push(`${heist.id} guard ${gi}: leg ${a} -> ${b} blocked at ${cx},${cy}`);
            break;
          }
          guard2 += 1;
        }
      }
    });
    heist.cameras.forEach((cam, ci) => {
      if (heist.map[cam.ty][cam.tx] !== '#') errors.push(`${heist.id} camera ${ci}: not mounted on a wall`);
    });
  });
  return errors;
}

export function heistTotals() {
  const guards = HEISTS.reduce((n, h) => n + h.guards.length, 0);
  const loot = HEISTS.reduce((n, h) => n + parseHeistMap(h).loot.length, 0);
  return { heists: HEISTS.length, guards, loot, gadgets: Object.keys(GADGETS).length };
}
