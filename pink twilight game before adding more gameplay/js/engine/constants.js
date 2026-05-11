// engine/constants.js
// ─────────────────────────────────────────────────────────────
// Single source of truth for all tunable values in the game.
// Future levels, skills, and combat systems should read from
// here rather than hardcoding numbers inline.
// ─────────────────────────────────────────────────────────────

export const MAP_SIZE    = 120;
export const FOV         = Math.PI / 2.0;

// ── Progression ──────────────────────────────────────────────
export const GOAL_ESSENCE_L1 = 10;   // orb fill target for level 1

// ── Player physics ───────────────────────────────────────────
export const PLAYER_RADIUS       = 0.05;
export const PLAYER_MOVE_SPEED   = 0.06;
export const PLAYER_ROT_SPEED    = 0.017;
export const PLAYER_JUMP_FORCE   = 0.148;
export const PLAYER_GRAVITY      = 0.005;
export const PLAYER_DEFAULT_Z    = 0.28;// camera angle
export const PLAYER_DEPTH        = 0.55;// distance camera sits behind character feet
export const KYO_WORLD_SIZE        = 0.036;

// ── World generation ─────────────────────────────────────────
export const TREE_COUNT           = 180;
export const TRUNK_COUNT          = 12;
export const GRASS_CLUMP_COUNT    = 100;
export const CLOUD_BUSH_COUNT     = 25;
export const FIREFLY_COUNT        = 50;
export const STARTING_ESSENCE     = 40;

// ── Essence collection ───────────────────────────────────────
export const ESSENCE_COLLECT_RANGE_H = 3.5;   // horizontal
export const ESSENCE_COLLECT_RANGE_V = 1.8;   // vertical
export const ESSENCE_RESPAWN_DELAY   = 5000;  // ms
export const ESSENCE_FLEE_RANGE      = 6;
export const ESSENCE_FLEE_SPEED_BASE = 0.05;

// ── Collision ────────────────────────────────────────────────
export const COLLISION_COOLDOWN = 60;   // frames

// ── API ──────────────────────────────────────────────────────
export const API_KEY = "";   // set your Gemini key here