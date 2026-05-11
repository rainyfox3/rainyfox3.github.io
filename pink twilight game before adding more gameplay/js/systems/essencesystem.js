// systems/essenceSystem.js
// ─────────────────────────────────────────────────────────────
// Handles:
//   • Fleeing-essence AI (moves away from the player)
//   • Proximity detection for collection prompt
//   • Collecting essence on [R]
//
// Future: red essence stones (dropped by monsters in level 3+)
// will be a separate type handled in a parallel block here.
// ─────────────────────────────────────────────────────────────

import {
  MAP_SIZE,
  ESSENCE_COLLECT_RANGE_H,
  ESSENCE_COLLECT_RANGE_V,
  ESSENCE_RESPAWN_DELAY,
  ESSENCE_FLEE_RANGE,
  ESSENCE_FLEE_SPEED_BASE,
} from '../engine/constants.js';
import { player }           from '../engine/player.js';
import { worldObjects, spawnEssence } from '../engine/world.js';
import { inventory }        from '../game/inventory.js';
import { updateInventoryUI } from '../ui/InventoryUI.js';
import { keys }             from './controls.js';

const collectPrompt = document.getElementById('collect-prompt');

export function updateEssenceSystem() {
  // ── Fleeing AI ───────────────────────────────────────────
  for (const obj of worldObjects) {
    if (obj.type !== 'essence' || !obj.fleeing) continue;

    // 1. Initialize hidden velocity properties if they don't exist yet
    if (obj.vx === undefined) obj.vx = 0;
    if (obj.vy === undefined) obj.vy = 0;

    let dx = obj.x - player.x;
    let dy = obj.y - player.y;
    // World wrap adjustment
    if (dx >  MAP_SIZE / 2) dx -= MAP_SIZE;
    if (dx < -MAP_SIZE / 2) dx += MAP_SIZE;
    if (dy >  MAP_SIZE / 2) dy -= MAP_SIZE;
    if (dy < -MAP_SIZE / 2) dy += MAP_SIZE;

    const dist = Math.hypot(dx, dy);

    if (dist < ESSENCE_FLEE_RANGE && dist > 0) {
      // 2. CALCULATE PUSH
      // Closer = stronger push. We calculate a 'target' velocity.
      const pushPower = (ESSENCE_FLEE_RANGE - dist) / ESSENCE_FLEE_RANGE;
      const targetSpeed = ESSENCE_FLEE_SPEED_BASE * (1 + pushPower * 2);
      
      const targetVX = (dx / dist) * targetSpeed;
      const targetVY = (dy / dist) * targetSpeed;

      // 3. SMOOTH ACCELERATION
      // Instead of jumping to speed, we 'lerp' the velocity for a weightier feel.
      obj.vx += (targetVX - obj.vx) * 0.12; 
      obj.vy += (targetVY - obj.vy) * 0.12;
      
      // Scared height: they float up a bit higher when fleeing
      obj.z = Math.min(1.2, (obj.z || 0) + 0.02);
      obj.fleeTimer = 60; // Keep the 'state' active
    } else {
      // 4. MOMENTUM & FRICTION
      // When out of range (or you stop), they coast. 
      // 0.95 means they lose 5% of their speed every frame.
      obj.vx *= 0.95;
      obj.vy *= 0.95;

      // 5. SETTLE DOWN
      // Gradually sink back to their default floating height (0.18)
      if (obj.z > 0.18) obj.z -= 0.005;
      obj.fleeTimer = Math.max(0, obj.fleeTimer - 1);
    }

    // 6. APPLY MOVEMENT
    // This happens EVERY frame, even when fading out.
    obj.x = (obj.x + obj.vx + MAP_SIZE) % MAP_SIZE;
    obj.y = (obj.y + obj.vy + MAP_SIZE) % MAP_SIZE;
  }

  // ── Proximity check ──────────────────────────────────────
  let nearbyEssenceIndex = null;
  // Check if the orb has room before looking for nearby essence
  const isOrbFull = inventory.essence >= (inventory.goalEssence || 10);

if (!isOrbFull) {
    for (let i = worldObjects.length - 1; i >= 0; i--) {
      const obj = worldObjects[i];
      if (obj.type !== 'essence') continue;

      let dx = Math.abs(player.x - obj.x);
      let dy = Math.abs(player.y - obj.y);
      if (dx > MAP_SIZE / 2) dx = MAP_SIZE - dx;
      if (dy > MAP_SIZE / 2) dy = MAP_SIZE - dy;

      const distH = Math.hypot(dx, dy);
      const distV = Math.abs(player.z - (obj.z || 0));

      if (distH < ESSENCE_COLLECT_RANGE_H && distV < ESSENCE_COLLECT_RANGE_V) {
        nearbyEssenceIndex = i;
        break;
      }
    }
  }

  // ── Collection prompt & input ────────────────────────────
  if (nearbyEssenceIndex !== null) {
    collectPrompt.style.display = 'block';

    if (keys['KeyR'] && inventory.essence < (inventory.goalEssence || 10)) {
      inventory.essence++;
      updateInventoryUI();
      worldObjects.splice(nearbyEssenceIndex, 1);
      setTimeout(spawnEssence, ESSENCE_RESPAWN_DELAY);
      keys['KeyR'] = false;   // consume the keypress
    }
  } else {
    collectPrompt.style.display = 'none';
  }
}