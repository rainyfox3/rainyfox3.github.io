// game/inventory.js
// ─────────────────────────────────────────────────────────────
// The single shared inventory state object.
// Imported by the UI, crafting, physics, and essence systems.
//
// Future fields to add here as the game grows:
//   • redEssence      – red stones collected (level 3+)
//   • skills          – array of unlocked skill objects
//   • skillCooldowns  – map of skill id → frames remaining
//   • goalEssence     – overridden by the level system per level
// ─────────────────────────────────────────────────────────────

export const inventory = {
  essence:       0,
  items:         [],          // crafted artifact names (strings)
  equippedIndex: -1, 

  // ── Future fields (not yet active) ───────────────────────
  // goalEssence is read by physics.js and renderer.js.
  // The level system will set this when transitioning levels.
  goalEssence: 10,
};