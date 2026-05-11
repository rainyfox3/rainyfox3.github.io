// engine/player.js
import { PLAYER_DEFAULT_Z, PLAYER_RADIUS } from './constants.js';

export const player = {
  x: 60,
  y: 60,
  dir: -Math.PI / 2,

  z: PLAYER_DEFAULT_Z,
  vV: 0,
  isJumping: false,

  radius: PLAYER_RADIUS,

  // timers
  useEffectTimer:   0,
  collisionCooldown: 0,
  landTimer:        0,

  // animation state
  liquidPhase:      0,
  breakthroughAnim: 0,
  walkFactor:       0, // Added to store the smooth walking transition

  // The floating spirit orb
  orb: {
    x:       35,
    y:      -60,
    smoothedZ: 0.18,
    targetX: 35,
    targetY: -60,
    velocity: 0,
    bobPhase: 0,
    // Persistent animation states to prevent vibration
    curSwayMult: 1.0,
    curTimeScale: 1.0,
    walkInfluence: 0,
  },

  // ── Placeholders for future systems ──────────────────────
  hp:    null,
  maxHp: null,
};