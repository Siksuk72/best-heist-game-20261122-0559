// GILDED HOUR — screenshot staging: an autopilot that plays the real rules.
// One job: put the live game into a photogenic mid-action state per ?shot=.
// It never edits pixels; it only moves the thief and guards through the
// world's own state, then lets the real update loop run before the shot.

import { TILE } from './config.js';

function tilePx(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

function setGuard(world, index, tx, ty, facingDeg, state, alertness) {
  const g = world.guards[index];
  if (!g) return;
  const p = tilePx(tx, ty);
  g.x = p.x;
  g.y = p.y;
  g.facing = (facingDeg * Math.PI) / 180;
  g.state = state;
  g.stateTime = 0;
  g.alertness = alertness;
  g.scanBase = g.facing;
  if (state === 'investigate' || state === 'chase') {
    g.targetX = world.player.x;
    g.targetY = world.player.y;
    g.lastSeenX = world.player.x;
    g.lastSeenY = world.player.y;
  }
}

function takeLoot(world, count) {
  let taken = 0;
  for (const l of world.loot) {
    if (taken >= count) break;
    l.taken = true;
    taken += 1;
  }
  world.lootTaken = taken;
}

function setCamera(world, index, angleDeg, alertness, offlineSec = 0) {
  const c = world.cameras[index];
  if (!c) return;
  c.baseAngle = (angleDeg * Math.PI) / 180;
  c.angle = c.baseAngle;
  c.alertness = alertness;
  c.offlineSec = offlineSec;
  c.time = 0;
}

/**
 * Stage one named scene. Returns a short description for window.__shotInfo.
 * The caller runs the real update loop for ~40 frames afterwards so cones
 * sweep, cameras pan and smoke drifts before the screenshot is taken.
 */
export function stageShot(world, name) {
  const idle = { up: false, down: false, left: false, right: false, sneak: false, sprint: false };
  if (name === 'cover') {
    // Heist 2, The Vault Floor: the thief at the vault door, the Crimson
    // Ledger glowing inside, a guard closing in, cameras sweeping, alarm half up.
    world.loadHeist(1);
    world.state = 'playing';
    world.totalScore = 1240;
    const p = tilePx(17, 8.5);
    world.player.x = p.x;
    world.player.y = p.y;
    world.player.facing = -Math.PI / 2;
    world.player.stance = 'sneak';
    takeLoot(world, 3);
    setGuard(world, 0, 12, 9, 55, 'investigate', 58);
    setGuard(world, 1, 22, 9, 135, 'patrol', 12);
    setGuard(world, 2, 16, 12, -90, 'patrol', 0);
    setGuard(world, 3, 5, 13, 0, 'patrol', 0);
    setGuard(world, 4, 27, 13, 180, 'patrol', 0);
    setCamera(world, 0, 70, 22);
    setCamera(world, 1, 25, 0);
    setCamera(world, 2, 160, 8);
    world.alarm = 58;
    world.timeSec = 74;
    return { shot: 'cover', info: 'vault door, ledger glowing, guard closing in, alarm 58' };
  }
  if (name === 'sneak') {
    // Heist 1, The Gilded Lobby: the thief crouched behind a felt table,
    // a guard's cone sweeping past, alarm at zero — the quiet read.
    world.loadHeist(0);
    world.state = 'playing';
    world.totalScore = 310;
    const p = tilePx(4, 6);
    world.player.x = p.x;
    world.player.y = p.y;
    world.player.facing = Math.PI / 2;
    world.player.stance = 'sneak';
    takeLoot(world, 1);
    setGuard(world, 0, 10, 2, 90, 'patrol', 0);
    setGuard(world, 1, 14, 9, 180, 'scan', 6);
    setGuard(world, 2, 20, 13, 180, 'patrol', 0);
    setCamera(world, 0, 110, 0);
    setCamera(world, 1, 150, 0);
    world.alarm = 0;
    world.timeSec = 41;
    return { shot: 'sneak', info: 'sneaking behind a table, cone sweeping past, alarm 0' };
  }
  if (name === 'alarm') {
    // Heist 3, The Penthouse Suite: alarm tripped, guards chasing, the thief
    // sprinting for the elevator with the Star of Marlow already stolen.
    world.loadHeist(2);
    world.state = 'playing';
    world.totalScore = 2310;
    const p = tilePx(10, 13);
    world.player.x = p.x;
    world.player.y = p.y;
    world.player.facing = Math.PI;
    world.player.stance = 'sprint';
    takeLoot(world, 9);
    world.star.taken = true;
    world.exitOpen = true;
    world.totalScore += 500;
    setGuard(world, 0, 15, 10, 135, 'chase', 100);
    setGuard(world, 1, 18, 12, 160, 'chase', 100);
    setGuard(world, 2, 8, 10, 45, 'chase', 92);
    setGuard(world, 3, 6, 13, 0, 'investigate', 70);
    setGuard(world, 4, 26, 13, 180, 'patrol', 30);
    setGuard(world, 5, 16, 10, 90, 'chase', 100);
    setCamera(world, 0, 80, 88);
    setCamera(world, 1, 10, 40);
    setCamera(world, 2, 170, 30);
    setCamera(world, 3, 260, 0);
    world.alarm = 100;
    world.alarmTripped = true;
    world.heistAlarmTripped = true;
    world.timeSec = 118;
    return { shot: 'alarm', info: 'alarm tripped, four guards chasing, star stolen, sprint to exit' };
  }
  if (name === 'victory') {
    // The victory screen over the penthouse floor, score tallied.
    world.loadHeist(2);
    world.totalScore = 4860;
    world.clearScore = {
      heist: 'The Penthouse Suite',
      timeSec: 132,
      lootTaken: 12,
      lootTotal: 12,
      timeBonus: 72,
      ghost: 0,
      unused: 50,
      heistScore: 622,
      totalScore: 4860,
    };
    world.star.taken = true;
    world.exitOpen = true;
    takeLoot(world, 12);
    world.state = 'victory';
    return { shot: 'victory', info: 'victory screen, all three heists cleared, score 4860' };
  }
  return { shot: name, info: 'unknown scene — falling back to the title screen' };
}

export function idleInput() {
  return { up: false, down: false, left: false, right: false, sneak: false, sprint: false };
}
