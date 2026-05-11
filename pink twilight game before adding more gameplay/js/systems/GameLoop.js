// systems/gameLoop.js
// ─────────────────────────────────────────────────────────────
// Owns the requestAnimationFrame loop.
// Calls each system in the correct order every frame.
//
// To add a new system (monsters, skills, combat):
//   1. Import your update function here
//   2. Call it inside gameLoop() in the right order
//
// Render always happens last, after all state is updated.
// ─────────────────────────────────────────────────────────────

import { draw }               from '../engine/renderer.js';
import { updatePhysics }      from './physics.js';
import { updateEssenceSystem } from './Essencesystem.js';
import { inventory }          from '../game/inventory.js';
import { keys }               from './controls.js';

// Future system imports go here, e.g.:
// import { updateMonsters }  from './monsterAI.js';
// import { updateSkills }    from './skills.js';
// import { updateCombat }    from './combat.js';

function gameLoop() {
  // ── Update phase (order matters) ─────────────────────────
  updatePhysics();
  updateEssenceSystem();

  // Future: updateMonsters();
  // Future: updateSkills();
  // Future: updateCombat();

  // ── Render phase ─────────────────────────────────────────
  draw(inventory, keys);

  requestAnimationFrame(gameLoop);
}

export function startGameLoop() {
  requestAnimationFrame(gameLoop);
}