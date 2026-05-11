// game/crafting.js
// ─────────────────────────────────────────────────────────────
// Handles the free-form crafting panel: sends the player's
// input to the Gemini API, deducts essence, adds the item to
// inventory, and spawns a world object as a visual reward.
// ─────────────────────────────────────────────────────────────

import { API_KEY }            from '../engine/constants.js';
import { player }             from '../engine/player.js';
import { worldObjects, spawnCloudBush } from '../engine/world.js';
import { MAP_SIZE }           from '../engine/constants.js';
import { inventory }          from './inventory.js';
import { updateInventoryUI }  from '../ui/InventoryUI.js';

const craftInput  = document.getElementById('craft-input');
const craftButton = document.getElementById('craft-button');
const craftLog    = document.getElementById('craft-log');

// ── Spawn a world decoration when crafting succeeds ─────────
function spawnCraftedDecoration() {
  if (Math.random() > 0.5) {
    // Spawn a cloud bush cluster near the player
    const cx = (player.x + Math.cos(player.dir) * 4 + MAP_SIZE) % MAP_SIZE;
    const cy = (player.y + Math.sin(player.dir) * 4 + MAP_SIZE) % MAP_SIZE;
    spawnCloudBush(cx, cy);
  } else {
    // Spawn a tree
    worldObjects.push({
      x: (player.x + Math.cos(player.dir) * 4 + MAP_SIZE) % MAP_SIZE,
      y: (player.y + Math.sin(player.dir) * 4 + MAP_SIZE) % MAP_SIZE,
      type:    'tree',
      palette: { main: '#ffd1dc', trunk: '#0a0712', pattern: 'plain' },
      size:    8,
      seed:    Math.random() * 1000,
      collidable: true,
      hitboxR:   0.22,
      objHeight: Infinity,
    });
  }
}

// ── Main craft function ──────────────────────────────────────
export async function craftItem() {
  const prompt = craftInput.value.trim();
  if (!prompt) return;

  craftButton.disabled = true;

  const logEntry = document.createElement('div');
  logEntry.innerText = `Chanting for ${prompt}...`;
  craftLog.prepend(logEntry);

  try {
    const systemPrompt =
      `You are the alchemy heart of a twilight forest. Return JSON: { "success": boolean, "cost": number, "message": string }. Cost 1-4.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const result = await response.json();
    const data   = JSON.parse(result.candidates[0].content.parts[0].text);

    if (data.success && inventory.essence >= data.cost) {
      inventory.essence -= data.cost;
      inventory.items.push(prompt);
      if (inventory.equippedIndex === -1) inventory.equippedIndex = 0;

      spawnCraftedDecoration();
      updateInventoryUI();
      logEntry.innerText = `✨ ${data.message}`;
    } else {
      logEntry.innerText = `❌ ${data.message || 'Insufficient essence.'}`;
    }
  } catch {
    logEntry.innerText = 'The wind carries no answer.';
  } finally {
    craftButton.disabled = false;
    craftInput.value     = '';
  }
}

// ── Wire up DOM events ───────────────────────────────────────
craftButton.addEventListener('click', craftItem);
craftInput.addEventListener('keypress', e => { if (e.key === 'Enter') craftItem(); });