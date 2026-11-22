// GILDED HOUR — vision: raycast line-of-sight and cone tests.
// One job: answer "can this watcher see that point?" against walls and cover.
// Pure geometry, no DOM, so Node smoke tests can import it directly.

import { BLOCKS_SIGHT, CAMERA, GUARD, TILE } from './config.js';

export function tileAt(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map[0].length || ty >= map.length) return '#';
  return map[ty][tx];
}

export function blocksSight(map, tx, ty) {
  return BLOCKS_SIGHT.has(tileAt(map, tx, ty));
}

/** Step along the segment; true when no sight-blocking tile is crossed. */
export function hasLineOfSight(map, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(map, tx, ty)) return false;
  }
  return true;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Distance a ray travels from (x, y) along angle before hitting a wall/cover. */
export function castRay(map, x, y, angle, maxDist) {
  const step = 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    const px = x + cos * d;
    const py = y + sin * d;
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (blocksSight(map, tx, ty)) return d;
  }
  return maxDist;
}

/**
 * Is `target` inside a vision cone from (x, y) facing `facing`?
 * Returns { seen: boolean, distance } — distance matters for detection speed.
 */
export function coneSees(map, x, y, facing, range, halfAngle, tx, ty, smokeClouds) {
  const dx = tx - x;
  const dy = ty - y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, distance: dist };
  if (dist > 4 && Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > halfAngle) {
    return { seen: false, distance: dist };
  }
  if (!hasLineOfSight(map, x, y, tx, ty)) return { seen: false, distance: dist };
  if (smokeClouds) {
    for (const cloud of smokeClouds) {
      if (segmentHitsCircle(x, y, tx, ty, cloud.x, cloud.y, cloud.radius)) {
        return { seen: false, distance: dist };
      }
    }
  }
  return { seen: true, distance: dist };
}

/** Does the segment (x0,y0)-(x1,y1) pass through the circle? */
export function segmentHitsCircle(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((cx - x0) * dx + (cy - y0) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x0 + dx * t;
  const py = y0 + dy * t;
  return Math.hypot(px - cx, py - cy) < r;
}

/** Polygon of a vision cone clipped by walls, for rendering. */
export function conePolygon(map, x, y, facing, range, halfAngle, rays = 26) {
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i += 1) {
    const a = facing - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(map, x, y, a, range);
    points.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return points;
}

/** Guard-specific cone test with the guard's range/angle from config. */
export function guardSeesPlayer(map, guard, player, smokeClouds) {
  return coneSees(map, guard.x, guard.y, guard.facing, GUARD.visionRange,
    GUARD.visionHalfAngle, player.x, player.y, smokeClouds);
}

/** Camera-specific cone test. */
export function cameraSeesPlayer(map, camera, player, smokeClouds) {
  return coneSees(map, camera.x, camera.y, camera.angle, CAMERA.visionRange,
    CAMERA.visionHalfAngle, player.x, player.y, smokeClouds);
}
