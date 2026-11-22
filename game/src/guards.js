// GILDED HOUR — guard AI: patrol, scan, investigate, chase, search, return.
// One job: move one guard and grow/shrink its alertness. No rendering here.

import { DETECTION, GUARD, SPEEDS, TILE } from './config.js';
import { angleDiff, guardSeesPlayer } from './vision.js';

export function makeGuard(def, index) {
  const [sx, sy] = def.waypoints[0];
  return {
    id: index,
    x: (sx + 0.5) * TILE,
    y: (sy + 0.5) * TILE,
    facing: 0,
    waypoints: def.waypoints,
    waypointIndex: 0,
    pauseSec: def.pause ?? GUARD.scanPauseSec,
    state: 'patrol', // patrol | scan | investigate | chase | search | return
    stateTime: 0,
    alertness: 0,
    targetX: null,
    targetY: null,
    lastSeenX: null,
    lastSeenY: null,
    unseenSec: 0,
    scanDir: 1,
    scanBase: 0,
    stuckSec: 0,
  };
}

function moveToward(guard, tx, ty, speed, dt, world) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  // Axis-separated collision so guards slide along walls instead of sticking.
  if (world.isWalkableCircle(nx, guard.y)) guard.x = nx;
  if (world.isWalkableCircle(guard.x, ny)) guard.y = ny;
  guard.facing = Math.atan2(dy, dx);
  return dist <= step + 0.5;
}

/** Advance one guard by dt seconds. `world` carries map, player, noise, alarm. */
export function updateGuard(guard, world, dt) {
  const { map, player, smokeClouds } = world;
  guard.stateTime += dt;

  // --- Seeing the thief -------------------------------------------------
  const inCurtain = world.tileAtPlayer() === 'H';
  const inSmoke = smokeClouds.some((c) => Math.hypot(player.x - c.x, player.y - c.y) < c.radius);
  const hidden = inCurtain || inSmoke;
  const seen = !hidden && guardSeesPlayer(map, guard, player, smokeClouds);
  if (seen.seen) {
    const closeness = 1 - (seen.distance / 260);
    const rate = DETECTION.guardBasePerSec * (0.35 + 0.85 * Math.max(0, closeness))
      * player.stanceMultiplier;
    guard.alertness = Math.min(100, guard.alertness + rate * dt);
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.unseenSec = 0;
    if (guard.alertness >= 100 && guard.state !== 'chase') {
      guard.state = 'chase';
      guard.stateTime = 0;
      world.onGuardSpotted?.(guard);
    } else if (guard.alertness >= 45 && guard.state === 'patrol') {
      guard.state = 'investigate';
      guard.stateTime = 0;
      guard.targetX = player.x;
      guard.targetY = player.y;
    }
  } else {
    guard.unseenSec += dt;
    guard.alertness = Math.max(0, guard.alertness - DETECTION.decayPerSec * dt);
  }

  // --- Hearing noise ----------------------------------------------------
  if (world.noiseEvent && (guard.state === 'patrol' || guard.state === 'scan')) {
    const d = Math.hypot(world.noiseEvent.x - guard.x, world.noiseEvent.y - guard.y);
    if (d < world.noiseEvent.radius * 1.6) {
      guard.state = 'investigate';
      guard.stateTime = 0;
      guard.targetX = world.noiseEvent.x;
      guard.targetY = world.noiseEvent.y;
    }
  }

  // --- State machine ----------------------------------------------------
  switch (guard.state) {
    case 'patrol': {
      const wp = guard.waypoints[guard.waypointIndex];
      const wx = (wp[0] + 0.5) * TILE;
      const wy = (wp[1] + 0.5) * TILE;
      if (moveToward(guard, wx, wy, SPEEDS.guardPatrol, dt, world)) {
        guard.state = 'scan';
        guard.stateTime = 0;
        guard.scanBase = guard.facing;
        guard.scanDir = 1;
      }
      break;
    }
    case 'scan': {
      // Sweep the cone left and right while standing at the waypoint.
      guard.facing = guard.scanBase + Math.sin(guard.stateTime * 1.6) * 1.1;
      if (guard.stateTime >= guard.pauseSec) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.state = 'patrol';
        guard.stateTime = 0;
      }
      break;
    }
    case 'investigate': {
      if (moveToward(guard, guard.targetX, guard.targetY, SPEEDS.guardInvestigate, dt, world)) {
        guard.state = 'search';
        guard.stateTime = 0;
        guard.scanBase = guard.facing;
      } else if (guard.stateTime > 10) {
        guard.state = 'return';
        guard.stateTime = 0;
      }
      break;
    }
    case 'chase': {
      const tx = guard.lastSeenX ?? player.x;
      const ty = guard.lastSeenY ?? player.y;
      moveToward(guard, tx, ty, SPEEDS.guardChase, dt, world);
      if (!seen.seen && guard.unseenSec > DETECTION.chaseLoseSightSec) {
        guard.state = 'search';
        guard.stateTime = 0;
        guard.scanBase = guard.facing;
      }
      break;
    }
    case 'search': {
      guard.facing = guard.scanBase + Math.sin(guard.stateTime * 1.8) * 1.4;
      if (guard.stateTime >= GUARD.searchSec) {
        guard.state = 'return';
        guard.stateTime = 0;
      }
      break;
    }
    case 'return': {
      const wp = guard.waypoints[guard.waypointIndex];
      const wx = (wp[0] + 0.5) * TILE;
      const wy = (wp[1] + 0.5) * TILE;
      if (moveToward(guard, wx, wy, SPEEDS.guardPatrol, dt, world)) {
        guard.state = 'patrol';
        guard.stateTime = 0;
      }
      break;
    }
    default:
      break;
  }
}

/** A guard catches the thief when close and sure of them. */
export function guardCatchesPlayer(guard, player) {
  return Math.hypot(guard.x - player.x, guard.y - player.y) < DETECTION.caughtDistance
    && (guard.state === 'chase' || guard.alertness > 85);
}
