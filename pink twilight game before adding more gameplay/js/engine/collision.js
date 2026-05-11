// engine/collision.js
// ─────────────────────────────────────────────────────────────
// Cylinder-based collision for every collidable world object.
//
// All objects now use:
//   obj.hitboxR    – cylinder radius in world units
//   obj.objHeight  – cylinder height (Infinity for trees/trunks)
//
// cloud_puff: radius == puff world-radius, height == same.
// tree / foreground_trunk: Infinity height (never jumpable).
// ─────────────────────────────────────────────────────────────

import { MAP_SIZE } from './constants.js';
import { worldObjects } from './world.js';
import { player } from './player.js';

export function getCollisionState(tx, ty, tz) {
  const wx = (tx + MAP_SIZE) % MAP_SIZE;
  const wy = (ty + MAP_SIZE) % MAP_SIZE;

  for (const obj of worldObjects) {
    if (!obj.collidable) continue;

    // ── Height check – player's feet must be below top of cylinder ──
    // tz is player.z (feet height). If cylinder is Infinity, always in range.
    const cylinderTop = obj.objHeight === Infinity ? Infinity : (obj.z || 0) + obj.objHeight;
    if (tz >= cylinderTop) continue;

    // ── Horizontal distance (wrapping) ───────────────────────
    let dx = wx - obj.x;
    let dy = wy - obj.y;
    if (dx >  MAP_SIZE / 2) dx -= MAP_SIZE;
    if (dx < -MAP_SIZE / 2) dx += MAP_SIZE;
    if (dy >  MAP_SIZE / 2) dy -= MAP_SIZE;
    if (dy < -MAP_SIZE / 2) dy += MAP_SIZE;

    const distSq = dx * dx + dy * dy;
    const combined = (obj.hitboxR || 0.1) + player.radius;

    if (distSq <= combined * combined) {
      // pX / pY in player-local space for sliding resolution
      const pX =  dx * Math.cos(-player.dir) - dy * Math.sin(-player.dir);
      const pY =  dx * Math.sin(-player.dir) + dy * Math.cos(-player.dir);
      return { blocked: true, obj, pX, pY };
    }
  }

  return { blocked: false };
}