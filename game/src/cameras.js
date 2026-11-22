// GILDED HOUR — security cameras: wall-mounted, sweeping, and EMP-able.
// One job: sweep one camera's cone and grow its alertness when it sees the thief.

import { CAMERA, DETECTION, TILE } from './config.js';
import { cameraSeesPlayer } from './vision.js';

export function makeCamera(def, index) {
  return {
    id: index,
    x: (def.tx + 0.5) * TILE,
    y: (def.ty + 0.5) * TILE,
    baseAngle: (def.angleDeg * Math.PI) / 180,
    sweep: (def.sweepDeg * Math.PI) / 180,
    speed: def.speed,
    angle: (def.angleDeg * Math.PI) / 180,
    alertness: 0,
    offlineSec: 0,
    time: Math.random() * 10,
  };
}

/** Advance one camera by dt seconds. Returns nothing; mutates the camera. */
export function updateCamera(camera, world, dt) {
  camera.time += dt;
  camera.angle = camera.baseAngle + Math.sin(camera.time * camera.speed) * camera.sweep;
  if (camera.offlineSec > 0) {
    camera.offlineSec = Math.max(0, camera.offlineSec - dt);
    camera.alertness = Math.max(0, camera.alertness - DETECTION.decayPerSec * dt);
    return;
  }
  const { map, player, smokeClouds } = world;
  const inCurtain = world.tileAtPlayer() === 'H';
  const inSmoke = smokeClouds.some((c) => Math.hypot(player.x - c.x, player.y - c.y) < c.radius);
  if (inCurtain || inSmoke) {
    camera.alertness = Math.max(0, camera.alertness - DETECTION.decayPerSec * dt);
    return;
  }
  const seen = cameraSeesPlayer(map, camera, player, smokeClouds);
  if (seen.seen) {
    const closeness = 1 - (seen.distance / 300);
    const rate = DETECTION.cameraBasePerSec * (0.4 + 0.8 * Math.max(0, closeness))
      * player.stanceMultiplier;
    camera.alertness = Math.min(100, camera.alertness + rate * dt);
    if (camera.alertness >= 100 && !world.alarmTripped) {
      world.onCameraSpotted?.(camera);
    }
  } else {
    camera.alertness = Math.max(0, camera.alertness - DETECTION.decayPerSec * dt);
  }
}

export function cameraRange() {
  return CAMERA.visionRange;
}
