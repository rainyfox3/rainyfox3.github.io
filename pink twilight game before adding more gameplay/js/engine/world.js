// engine/world.js
// ─────────────────────────────────────────────────────────────
// Owns the mutable world-object and firefly arrays.
// initWorld()    – (re)builds the entire world from scratch.
// spawnEssence() – adds one new essence orb at a random position.
//
// Cloud bushes are now spawned as clusters of independent
// cloud_puff objects. Each puff has its own world-space
// position and is rendered/collided independently.
// ─────────────────────────────────────────────────────────────

import {
  MAP_SIZE,
  TREE_COUNT,
  TRUNK_COUNT,
  GRASS_CLUMP_COUNT,
  CLOUD_BUSH_COUNT,
  FIREFLY_COUNT,
  STARTING_ESSENCE,
} from './constants.js';

export const worldObjects = [];
export const fireflies    = [];

// ── Palette library ──────────────────────────────────────────
const TREE_PALETTES = [
  { main: '#f7a8c1', trunk: '#0a0712', pattern: 'dots'   },
  { main: '#ffc1d3', trunk: '#0a0712', pattern: 'leaves' },
  { main: '#e288a8', trunk: '#0a0712', pattern: 'plain'  },
];

function wrapPos(v) { return (v + MAP_SIZE * 10) % MAP_SIZE; }

// ─────────────────────────────────────────────────────────────
export function initWorld() {
  worldObjects.length = 0;
  fireflies.length    = 0;

  // ── Large foreground trunks ───────────────────────────────
  for (let i = 0; i < TRUNK_COUNT; i++) {
    worldObjects.push({
      x: Math.random() * MAP_SIZE,
      y: Math.random() * MAP_SIZE,
      type:      'foreground_trunk',
      size:      30 + Math.random() * 20,
      collidable: true,
      hitboxR:   0.45,      // cylinder radius (world units)
      objHeight: Infinity,  // can never be jumped over
    });
  }

  // ── Regular trees ─────────────────────────────────────────
  for (let i = 0; i < TREE_COUNT; i++) {
    worldObjects.push({
      x:       Math.random() * MAP_SIZE,
      y:       Math.random() * MAP_SIZE,
      type:    'tree',
      palette: TREE_PALETTES[Math.floor(Math.random() * TREE_PALETTES.length)],
      size:    6 + Math.random() * 4,
      seed:    Math.random() * 1000,
      collidable: true,
      hitboxR:   0.05,      // matches the pixel-locked trunk visual width
      objHeight: Infinity,  // can never be jumped over
    });
  }

  // ── Grass clumps ─────────────────────────────────────────
  for (let clump = 0; clump < GRASS_CLUMP_COUNT; clump++) {
    const clumpX    = Math.random() * MAP_SIZE;
    const clumpY    = Math.random() * MAP_SIZE;
    const clumpSize = 8 + Math.floor(Math.random() * 12);
    for (let i = 0; i < clumpSize; i++) {
      worldObjects.push({
        x:    wrapPos(clumpX + (Math.random() - 0.5) * 6),
        y:    wrapPos(clumpY + (Math.random() - 0.5) * 6),
        type: 'grass',
        color: Math.random() > 0.3 ? '#ffb347' : '#ff7eb3',
        size: 0.3 + Math.random() * 1.5,
        collidable: false,
      });
    }
  }

  // ── Cloud bushes (cluster of independent puffs) ───────────
  for (let i = 0; i < CLOUD_BUSH_COUNT; i++) {
    spawnCloudBush(
      Math.random() * MAP_SIZE,
      Math.random() * MAP_SIZE,
    );
  }

  // ── Fireflies ─────────────────────────────────────────────
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    fireflies.push({
      x:      Math.random() * MAP_SIZE,
      y:      Math.random() * MAP_SIZE,
      z:      1 + Math.random() * 4,
      offset: Math.random() * 100,
      color:  '#fff9c4',
    });
  }

  // ── Initial essence scatter ───────────────────────────────
  for (let i = 0; i < STARTING_ESSENCE; i++) {
    spawnEssence();
  }
}

// ─────────────────────────────────────────────────────────────
// Spawns a cluster of cloud_puff objects at a given centre.
// Each puff is a fully independent world object with its own
// position and cylindrical hitbox.
// ─────────────────────────────────────────────────────────────
export function spawnCloudBush(cx, cy) {
  const puffCount = 3 + Math.floor(Math.random() * 4);   // 3-6 puffs
  const spread    = 1.0 + Math.random() * 1.2;           // cluster radius

  for (let i = 0; i < puffCount; i++) {
    const angle  = (i / puffCount) * Math.PI * 2 + Math.random() * 0.8;
    const dist   = Math.random() * spread;
    const px     = wrapPos(cx + Math.cos(angle) * dist);
    const py     = wrapPos(cy + Math.sin(angle) * dist);
    const radius = 0.55 + Math.random() * 0.6;  // 0.55 – 1.15 world units

    worldObjects.push({
      x:    px,
      y:    py,
      z:    0,
      type: 'cloud_puff',
      // size == world-unit radius, used by both renderer and collision
      size:       radius * 0.9, // visual radius is slightly smaller than hitbox against clipping
      seed:       Math.random() * 100,
      collidable: true,
      hitboxR:    radius,    // cylinder radius
      objHeight:  radius,    // cylinder height == puff radius
    });
  }
}

// ─────────────────────────────────────────────────────────────
export function spawnEssence() {
  const isFleeing = Math.random() > 0.8;
  const isHigh    = Math.random() > 0.6;

  worldObjects.push({
    id:         Math.random(),
    x:          Math.random() * MAP_SIZE,
    y:          Math.random() * MAP_SIZE,
    z: isHigh ? (2.6 + Math.random() * 1.2)   // 2.6 – 3.8  (above jump peak ~2.47, unreachable)
              : (0.5 + Math.random() * 0.4),  // 0.5 – 0.9  (low, easy)
    type:       'essence',
    size:       0.25,          // was 0.35
    phase:      Math.random() * 10,
    collidable: false,
    fleeing:    isFleeing,
    fleeTimer:  0,
  });
}