// systems/controls.js
// ─────────────────────────────────────────────────────────────
// Owns the raw keyboard input map.
// All other systems read from `keys` – they never add listeners
// themselves. This keeps input handling in one place.
//
// Future: mouse/touch input (for skill targeting, clicking
// monsters) should be added here as separate exported objects.
// ─────────────────────────────────────────────────────────────

import { player }    from '../engine/player.js';
import { inventory } from '../game/inventory.js';
import { updateInventoryUI } from '../ui/InventoryUI.js';
import { PLAYER_JUMP_FORCE } from '../engine/constants.js';

/** Live keyboard state. true = currently held down. */
export const keys = {};

/** * Persistent lock for the spacebar. 
 * Lives outside the listeners so it remembers its state between frames.
 */
let spaceLocked = false; 

// ── Keyboard listeners ───────────────────────────────────────
window.addEventListener('keydown', e => {
  const craftInput = document.getElementById('craft-input');
  const isTyping   = document.activeElement === craftInput;

  // If the user is typing in a text box, don't move the character or open menus
  if (isTyping) return;

  // 1. Jump Logic (Single-press trigger)
  if (e.code === 'Space') {
    // Prevent the browser from scrolling down when pressing Space
    e.preventDefault(); 

    // ONLY trigger the jump if the key isn't locked and Kyo is on the ground
    if (!spaceLocked && !player.isJumping) {
      player.vV = PLAYER_JUMP_FORCE;
      player.isJumping = true;
      player.landTimer = 0;   // Kill the squash animation immediately
      spaceLocked = true;     // LOCK: Prevents auto-repeat from spamming jumps
    }
  }

  // 2. UI Panel Toggles
  if (e.code === 'KeyI') {
    document.getElementById('inventory-ui').classList.toggle('hidden-ui');
  }
  if (e.code === 'KeyC') {
    document.getElementById('crafting-panel').classList.toggle('hidden-ui');
  }

  // 3. Item Interaction
  if (e.code === 'KeyU' && inventory.items.length > 0) {
    inventory.equippedIndex = (inventory.equippedIndex + 1) % inventory.items.length;
    player.useEffectTimer = 40; // Triggers a visual glow effect in renderer
    updateInventoryUI();
  }

  // 4. Update the global key map for continuous movement (W, A, S, D, Arrows)
  keys[e.code] = true;

  // Prevent page scroll for arrow keys
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }

  // ── Future skill keybinds ──────────────────────────────────
  // Keybinds for skills (1, 2, 3, 4, H, Y) will be wired here
  // via imported handler functions from systems/skills.js.
  // Example: if (e.code === 'Digit1') castSkill(1);
  // ───────────────────────────────────────────────────────────
});

window.addEventListener('keyup', e => {
  // UNLOCK the spacebar when the physical key is released
  if (e.code === 'Space') {
    spaceLocked = false;
  }

  // Remove key from the global map
  keys[e.code] = false;
});