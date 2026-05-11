// js/main.js
// ─────────────────────────────────────────────────────────────
// Entry point. Imports are ordered so dependencies resolve
// cleanly (state before systems, systems before UI, UI before loop).
// Nothing game-logic-related should live here.
// ─────────────────────────────────────────────────────────────

// 1. World generation (no external deps)
import { initWorld }        from './engine/world.js';

// 2. Input (depends on player + inventory)
import './systems/controls.js';

// 3. Crafting (wires DOM events on import)
import './game/crafting.js';

// 4. Initial UI render
import { updateInventoryUI } from './ui/InventoryUI.js';

// 5. Game loop (starts the RAF cycle)
import { startGameLoop }    from './systems/gameloop.js';

// ── Bootstrap ────────────────────────────────────────────────
initWorld();
updateInventoryUI();
startGameLoop();