// ui/inventoryUI.js
// ─────────────────────────────────────────────────────────────
// Reads from inventory state and writes to the DOM.
// Never mutates inventory – it is read-only from this file's POV.
//
// Future: skill slot HUD (bottom of screen), HP bar, and
// level indicator should each get their own function here.
// ─────────────────────────────────────────────────────────────

import { inventory } from '../game/inventory.js';

const essenceDisplay = document.getElementById('essence-count');
const itemList       = document.getElementById('item-list');

export function updateInventoryUI() {
  essenceDisplay.innerText = inventory.essence;

  if (inventory.items.length === 0) {
    itemList.innerHTML = '<p class="text-[10px] opacity-40">No artifacts found.</p>';
    return;
  }

  itemList.innerHTML = inventory.items.map((item, index) => `
    <div class="item-slot ${index === inventory.equippedIndex ? 'equipped' : ''}">
      <span>${item}</span>
      <span class="text-[8px] opacity-60">${index === inventory.equippedIndex ? 'ACTIVE' : ''}</span>
    </div>
  `).join('');
}