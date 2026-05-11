// systems/physics.js
// ─────────────────────────────────────────────────────────────
// Handles all player movement, jumping, vertical physics,
// collision resolution, and the orb follow-animation.
//
// Future: monster AI movement will get its own file
// (systems/monsterAI.js) that calls getCollisionState()
// independently. Do not mix monster logic into here.
// ─────────────────────────────────────────────────────────────

import {
  MAP_SIZE,
  PLAYER_MOVE_SPEED,
  PLAYER_ROT_SPEED,
  PLAYER_GRAVITY,
  PLAYER_DEFAULT_Z,
  COLLISION_COOLDOWN,
  GOAL_ESSENCE_L1,
} from '../engine/constants.js';
import { player }              from '../engine/player.js';
import { getCollisionState }   from '../engine/collision.js';
import { spawnEssence }        from '../engine/world.js';
import { inventory }           from '../game/inventory.js';
import { updateInventoryUI }   from '../ui/InventoryUI.js';
import { keys }                from './controls.js';

export function updatePhysics() {
  const time = Date.now() * 0.001;

  // systems/physics.js ── Vertical (jump & gravity)

// 1. Check if we are in the air OR if we are currently mid-jump logic
if (player.isJumping || player.z > PLAYER_DEFAULT_Z) {
  player.z  += player.vV;
  player.vV -= PLAYER_GRAVITY;
  
  // 2. LANDING CHECK: Did we hit or pass the floor (0.18)?
  if (player.z <= PLAYER_DEFAULT_Z) {
    
    // Only trigger the "Squash" (landTimer) if we were actually falling
    // This prevents the squash from triggering if you just teleport or start a jump
    if (player.vV < 0) {
      player.landTimer = 20; // This is the magic number for the renderer
    }
    
    // 3. SNAP TO FLOOR
    player.z         = PLAYER_DEFAULT_Z;
    player.vV        = 0;
    player.isJumping = false;
  }
}

  // ── Frame timers ─────────────────────────────────────────
  if (player.useEffectTimer   > 0) player.useEffectTimer--;
  if (player.collisionCooldown > 0) player.collisionCooldown--;

  // ── Breakthrough animation ────────────────────────────────
  const goalEssence = inventory.goalEssence ?? GOAL_ESSENCE_L1;
  if (inventory.essence >= goalEssence && player.breakthroughAnim < 1.0) {
    player.breakthroughAnim = Math.min(1.0, player.breakthroughAnim + 0.02);
  } else if (inventory.essence < goalEssence && player.breakthroughAnim > 0) {
    player.breakthroughAnim = Math.max(0, player.breakthroughAnim - 0.02);
  }

  // ── Horizontal movement ──────────────────────────────────
  let inputX = 0;
  let inputY = 0;

  if (keys['KeyW'] || keys['ArrowUp'])   { inputX += Math.cos(player.dir); inputY += Math.sin(player.dir); }
  if (keys['KeyS'] || keys['ArrowDown']) { inputX -= Math.cos(player.dir); inputY -= Math.sin(player.dir); }
  if (keys['KeyA'] || keys['ArrowLeft']) player.dir -= PLAYER_ROT_SPEED;
  if (keys['KeyD'] || keys['ArrowRight']) player.dir += PLAYER_ROT_SPEED;

  if (inputX !== 0 || inputY !== 0) {
    const length = Math.hypot(inputX, inputY);
    const stepX  = (inputX / length) * PLAYER_MOVE_SPEED;
    const stepY  = (inputY / length) * PLAYER_MOVE_SPEED;

    const nextX = player.x + stepX;
    const nextY = player.y + stepY;

    const colCurrent = getCollisionState(player.x, player.y, player.z);
    const colNext    = getCollisionState(nextX,    nextY,    player.z);

    let canMove = !colNext.blocked;

    if (colNext.blocked) {
      // Penalty: lose one essence on collision (while not full)
      if (
        player.collisionCooldown === 0 &&
        inventory.essence > 0 &&
        inventory.essence < goalEssence
      ) {
        inventory.essence--;
        player.collisionCooldown = COLLISION_COOLDOWN;
        player.useEffectTimer    = 20;
        updateInventoryUI();
        spawnEssence();
      }

      // Allow sliding out of an already-overlapping collision
      if (colCurrent.blocked) {
        if (
          Math.abs(colNext.pX) > Math.abs(colCurrent.pX) ||
          Math.abs(colNext.pY) > Math.abs(colCurrent.pY)
        ) canMove = true;
      }
    }

    if (canMove) {
      player.x = (nextX + MAP_SIZE) % MAP_SIZE;
      player.y = (nextY + MAP_SIZE) % MAP_SIZE;
    } else {
      // Axis-aligned sliding
      if (!getCollisionState(player.x + stepX, player.y, player.z).blocked) {
        player.x = (player.x + stepX + MAP_SIZE) % MAP_SIZE;
      } else if (!getCollisionState(player.x, player.y + stepY, player.z).blocked) {
        player.y = (player.y + stepY + MAP_SIZE) % MAP_SIZE;
      }
    }
  }

  // ── Liquid phase (orb animation) ─────────────────────────
  player.liquidPhase += 0.05;

 // ── Orb follow ───────────────────────────────────────────
  const isMoving = keys['KeyW'] || keys['KeyS'] || keys['ArrowUp'] || keys['ArrowDown'];

  player.orb.targetX = (isMoving ? 40 : 35) + Math.cos(time * 1.2) * 2;
  // We remove targetY and y lerping from here entirely to prevent the "vibration"
  
  player.orb.x += (player.orb.targetX - player.orb.x) * 0.1;
  // player.orb.y calculation removed.
}