// engine/renderer.js
import { FOV, MAP_SIZE, PLAYER_RADIUS, PLAYER_DEPTH, PLAYER_DEFAULT_Z, KYO_WORLD_SIZE } from './constants.js';
import { player }        from './player.js';
import { worldObjects, fireflies } from './world.js';

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const SHOW_HITBOXES    = false;
const draw_groundnoise = false;

const VIRT_W = 960;
const VIRT_H = 540;

// Kyo foot baseline in local (pre-scale) units.
// Leg bottoms are at local y = +12 after ctx.scale.
const KYO_FOOT_Y = 12;

export { canvas, ctx };

export function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function getViewport() {
  const scaleX = canvas.width  / VIRT_W;
  const scaleY = canvas.height / VIRT_H;
  const scale  = Math.min(scaleX, scaleY);
  const offX   = (canvas.width  - VIRT_W * scale) / 2;
  const offY   = (canvas.height - VIRT_H * scale) / 2;
  return { scale, offX, offY };
}

export function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.substring(1, 3), 16);
  const g1 = parseInt(c1.substring(3, 5), 16);
  const b1 = parseInt(c1.substring(5, 7), 16);
  const r2 = parseInt(c2.substring(1, 3), 16);
  const g2 = parseInt(c2.substring(3, 5), 16);
  const b2 = parseInt(c2.substring(5, 7), 16);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

function applyFog(hex, factor) {
  if (factor <= 0) return hex;
  return lerpColor(hex, '#963C73', factor);
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function drawCloudLayers(w, h, time) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(255, 126, 179, ${0.08 + i * 0.05})`;
    ctx.beginPath();
    const yBase = h / 2 - 70 - i * 40;
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= w + 400; x += 200) {
      const curve = Math.sin(x * 0.001 + time * 0.07) * 25;
      ctx.arc(x, yBase + curve, 150 + i * 30, 0, Math.PI, true);
    }
    ctx.fill();
  }
  ctx.restore();
}

function drawGroundNoise(w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 209, 220, 0.04)';
  ctx.lineWidth   = 1;
  const centerX   = w / 2;
  const horizonY  = h / 2;
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI - player.dir;
    ctx.beginPath();
    ctx.moveTo(centerX, horizonY);
    ctx.lineTo(centerX + Math.cos(ang) * w * 3, horizonY + Math.sin(ang) * h * 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCloudPuff(ox, oy, radius, seed, vw, fog, time) {
  const horizonPink = '#963C73';
  const pink   = lerpColor('#f7a8c1', horizonPink, fog);
  const purple = lerpColor('#a387e0', horizonPink, fog);
  const blue   = lerpColor('#4e7df0', horizonPink, fog);

  const grad = ctx.createLinearGradient(0, 0, vw, 0);
  grad.addColorStop(0,   pink);
  grad.addColorStop(0.5, purple);
  grad.addColorStop(1,   blue);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ox, oy, radius, Math.PI, 0);
  ctx.fill();

  const showhighlights     = true;
  const multiplehighlights = true;

  if (showhighlights) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, radius, Math.PI, 0);
    ctx.clip();

    const slowTime       = time * 1;
    const highlightAlpha = 0.12 * (1 - fog);
    ctx.fillStyle        = `rgba(255, 255, 255, ${highlightAlpha})`;

    if (multiplehighlights) {
      const highlightCount = 3;
      ctx.beginPath();
      for (let i = 0; i < highlightCount; i++) {
        const hSeed   = seed + (i * 13.5);
        const hOffset = (seededRandom(hSeed)     - 0.5) * (radius * 1.2);
        const hSway   = Math.sin(slowTime + seed + i * 0.6) * (radius * 0.3);
        const hRadius =  radius * (0.4 + seededRandom(hSeed + 1) * 0.2);
        ctx.arc(ox + hSway + hOffset, oy, hRadius, Math.PI, 0);
      }
      ctx.fill();
    } else {
      const hOffset       = (seededRandom(seed) - 0.5) * (radius * 0.4);
      const hRadius       =  radius * 0.25;
      const highlightsway = Math.sin(slowTime + seed) * (radius * 0.5);
      ctx.beginPath();
      ctx.arc(ox + highlightsway + hOffset, oy - 2 * hRadius - hOffset, hRadius, Math.PI * 2, 0);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawSVGTree(x, y, h, palette, time, seed, fog) {
  const sway = Math.sin(time + seed) * (h / 40);

  const leafColor  = applyFog(palette.main,  fog);
  const trunkColor = applyFog(palette.trunk, fog);

  ctx.fillStyle = trunkColor;
  ctx.beginPath();
  const bW = Math.min(h / 18, 15);
  ctx.moveTo(x - bW, y);
  ctx.quadraticCurveTo(x, y - h / 2, x - h / 80, y - h * 0.8);
  ctx.lineTo(x + h / 80, y - h * 0.8);
  ctx.quadraticCurveTo(x + bW, y - h / 2, x + bW, y);
  ctx.fill();

  ctx.fillStyle = leafColor;
  const tx = x + sway;
  const ty = y - h * 0.85;

  ctx.beginPath(); ctx.ellipse(tx - h*0.3, ty + h*0.1,  h*0.4, h*0.3,  0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(tx + h*0.3, ty + h*0.1,  h*0.4, h*0.3,  0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(tx,         ty - h*0.15, h*0.5, h*0.4,  0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(tx,         ty - h*0.45, h*0.25, h*0.35, 0, 0, Math.PI*2); ctx.fill();

  for (let i = 0; i < 5; i++) {
    const s             = seed + (i * 13.7);
    const secondarySway = Math.sin(time - 0.5 + s * 0.5) * (h / 50);
    const ox            = (seededRandom(s)      - 0.5) * (h * 1.2);
    const oy            = (seededRandom(s + 50) - 0.5) * (h * 0.8);
    const rC            =  h * (0.08 + seededRandom(s + 100) * 0.12);
    ctx.beginPath();
    ctx.ellipse(tx + ox + secondarySway, ty + oy, rC, rC, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// groundY  — screen pixel for z=0 directly under the character feet.
// projScale — vh / PLAYER_DEPTH (pixels per world unit at this depth).
function drawKyo(w, h, groundY, projScale, inventory, keys) {

  const baseScale    = projScale * KYO_WORLD_SIZE;
  const centerX      = w / 2;
  const time         = Date.now() * 0.004;

  if (player.walkFactor === undefined) player.walkFactor = 0;
  const isMoving   = keys['KeyW'] || keys['KeyS'] || keys['ArrowUp'] || keys['ArrowDown'];
  const targetWalk = isMoving ? 1.0 : 0.0;
  player.walkFactor += (targetWalk - player.walkFactor) * 0.1;

  ctx.save();
  ctx.translate(centerX, groundY);

  let squash = 0, stretch = 0;
  if (player.isJumping) {
    if (player.vV > 0) stretch = player.vV * 1.3;
    else               squash  = Math.abs(player.vV) * 1.5;
  } else if (player.landTimer > 0) {
    const t = player.landTimer / 20;
    //landingbob
    squash  = (t * t) * 0.2 ;
    player.landTimer--;
  }

  const finalAnimX = Math.max(0.2, 1.0 - (stretch * 4.0) + (squash * 0.8));
  const finalAnimY = Math.max(0.4, 1.0 + (stretch * 0.2) - squash);

  ctx.scale((baseScale / 10) * finalAnimX, (baseScale / 10) * finalAnimY);

  // Shift origin up so local y=+KYO_FOOT_Y lands exactly on groundY.
  ctx.translate(0, -KYO_FOOT_Y);

  // Lift character when airborne.
  const jumpLiftWorld  = player.z - PLAYER_DEFAULT_Z;
  const jumpLiftPx     = jumpLiftWorld * projScale;
  const jumpLiftLocal  = jumpLiftPx / (baseScale / 10);
  const jumpOffset     = -jumpLiftLocal*1.1;

  const bobIdle    = Math.sin(time * 0.6) * 1.5;
  const bobWalk    = Math.sin(time * 2.5) * 4;
  const bob        = bobIdle + (bobWalk - bobIdle) * player.walkFactor;

  // Only the idle component lifts the upper body; legs are drawn before
  // this offset so they stay planted. Walking bob and landing squash still
  // move the whole character as before (walkFactor blends idle out anyway).
  const upperBobOnly = bobIdle * (1.0 - player.walkFactor);
  const fullBob      = bob;  // used by cape antiBob so cape tracks correctly

  ctx.translate(0, jumpOffset + bob);

  const doGlow = player.useEffectTimer > 0;
  if (doGlow) {
    ctx.save();
    const blurVal   = (player.useEffectTimer * 1.5) / (baseScale * 0.1);
    ctx.shadowBlur  = Math.max(2, blurVal);
    ctx.shadowColor = '#ff7eb3';
    ctx.globalAlpha = Math.min(1.0, 0.8 + (player.useEffectTimer / 100));
    player.useEffectTimer--;
  }

//cape

  // ── Cape state ───────────────────────────────────────────
  if (player.capeLift        === undefined) player.capeLift        = 0;
  if (player.capeBottomY     === undefined) player.capeBottomY     = 0;
  if (player.capeMidY        === undefined) player.capeMidY        = 0;
  if (player.capeFlareSmooth === undefined) player.capeFlareSmooth = 0;

  const isMidAir  = player.isJumping || player.z > PLAYER_DEFAULT_Z + 0.01;
  const isFalling = player.isJumping && player.vV < 0;

  let targetLift = isMidAir
    ? (player.vV < 0 ? Math.abs(player.vV) * 35 : 8)
    : (player.landTimer > 0 ? 12 : 0);
  const capeEase = targetLift > player.capeLift ? 0.1 : 0.02;
  player.capeLift += (targetLift - player.capeLift) * capeEase;

  const targetFlareX = player.capeLift * 1.2;
  player.capeFlareSmooth += (targetFlareX - player.capeFlareSmooth) * 0.04;
  const capeFlareX = player.capeFlareSmooth;

  const targetBottomY = isFalling ? Math.abs(player.vV) * 80 : 0;
  const targetMidY    = isFalling ? Math.abs(player.vV) * 50 : 0;
  const easeUp        = 0.12;
  const easeDown      = 0.008;
  player.capeBottomY += (targetBottomY - player.capeBottomY) * (targetBottomY > player.capeBottomY ? easeUp : easeDown);
  player.capeMidY    += (targetMidY    - player.capeMidY)    * (targetMidY    > player.capeMidY    ? easeUp * 0.7 : easeDown * 0.6);

  const antiBob    = -fullBob * 0.8;
  const capeFlareY = (player.capeLift * 1.2) + antiBob;

  // ── Wave helpers (time-offset per side for irregular flutter) ─
  const waveIntensity = 1.0 + (player.walkFactor * 0.8);
  const getWaveX = (yOffset, side, t = time) =>
    Math.sin(t * 0.4 - yOffset * 0.05 + (side === 'left' ? 0 : 1.2)) * (8 * (yOffset / 45)) * waveIntensity;
  const getWaveY = (yOffset, t = time) =>
    -Math.abs(Math.sin(t * 0.4 - yOffset * 0.05)) * (5 * (yOffset / 45)) * waveIntensity;

  const t1 = time + 0.0;   // right upper
  const t2 = time + 1.3;   // right lower
  const t3 = time + 2.7;   // left upper
  const t4 = time + 0.8;   // left lower

  // ── Colours ───────────────────────────────────────────────
  const coreColor   = '#0a0712';
  const layerColor  = '#16112a';
  const accentColor = '#241a3d';
  const hairHex     = '#68635f';

  // ── Legs ─────────────────────────────────────────────────
  // Counter the idle bob so legs stay planted; walking and landing
  // squash/stretch still move them naturally via the global translate.
  const legSwingL = Math.sin(time * 1.25) * 3 * player.walkFactor;
  const legSwingR = Math.sin(time * 1.25 + Math.PI) * 3 * player.walkFactor;
  const legBobCancel = -upperBobOnly; // push legs back down by the idle lift

  ctx.fillStyle = coreColor;
  ctx.beginPath(); ctx.moveTo(-5, 12 + legSwingL + legBobCancel); ctx.lineTo(-1, 12 + legSwingL + legBobCancel); ctx.lineTo(-1, -5 + legBobCancel); ctx.lineTo(-8, -5 + legBobCancel); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1,  12 + legSwingR + legBobCancel); ctx.lineTo(5,  12 + legSwingR + legBobCancel); ctx.lineTo(8,  -5 + legBobCancel); ctx.lineTo(1,  -5 + legBobCancel); ctx.fill();

  // ── Robe ─────────────────────────────────────────────────
let robeFlareL = 0, robeFlareR = 0, robeFlareY = 0;
if (player.isJumping) {
  const flare = player.vV > 0 ? -player.vV * 30 : Math.abs(player.vV) * 60;
  robeFlareL = -flare;
  robeFlareR =  flare;
  robeFlareY = player.vV > 0 ? -player.vV * 20 : Math.abs(player.vV) * 10;
} else if (player.landTimer > 0) {
  const flare = (player.landTimer / 20) * 2;
  robeFlareL = -flare;
  robeFlareR =  flare;
  robeFlareY = (player.landTimer / 20) * 5;
}

const w1  = (Math.sin(time * 0.2) * 4) + ((Math.sin(time * 1.2) * 4 - Math.sin(time * 0.2) * 4) * player.walkFactor);
const w2  = (Math.sin(time * 0.6) * 4) + ((Math.sin(time * 1.4) * 4 - Math.sin(time * 0.6) * 4) * player.walkFactor);
const w1c = -w1 / 3;
const w2c = -w2 / 3;

// hem corners
const rLeftHem    = { x: -15 + w1 + robeFlareL,  y: 3 + robeFlareY };
const rRightHem   = { x:  15 + w1 + robeFlareR,  y: 3 + robeFlareY };

// hip control points track the hem X so the approach angle stays shallow
const rLeftHip    = { x: rLeftHem.x  * 0.95,  y: -2 };
const rRightHip   = { x: rRightHem.x * 0.95,  y: -2 };

// waist
const rLeftWaist  = { x: -12 + w1c,  y: -24 + w2c };
const rRightWaist = { x:  12 + w1c,  y: -24 + w2c };

// hem mid + half points
const robeMid       = { x: w1 * 0.5,                               y: 6 + w2 * 0.3 + robeFlareY };
const robeLeftHalf  = { x: (rLeftHem.x  + robeMid.x) / 2,         y: (rLeftHem.y  + robeMid.y) / 2 };
const robeRightHalf = { x: (rRightHem.x + robeMid.x) / 2,         y: (rRightHem.y + robeMid.y) / 2 };

// halfway anchors
const lShoulder_Waist = { x: (-10 + rLeftWaist.x) / 2,         y: (-43 + rLeftWaist.y) / 2 };
const lWaist_Hip      = { x: (rLeftWaist.x + rLeftHip.x) / 2,  y: (rLeftWaist.y + rLeftHip.y) / 2 };
const rWaist_Hip      = { x: (rRightWaist.x + rRightHip.x) / 2, y: (rRightWaist.y + rRightHip.y) / 2 };
const rShoulder_Waist = { x: (10 + rRightWaist.x) / 2,          y: (-43 + rRightWaist.y) / 2 };

const cornerR = 3;

ctx.fillStyle = layerColor;
ctx.beginPath();
ctx.moveTo(-10, -43);

// left S-curve: shoulder → waist → hip → rounded hem corner
ctx.quadraticCurveTo(rLeftWaist.x, rLeftWaist.y, lShoulder_Waist.x, lShoulder_Waist.y);
ctx.quadraticCurveTo(rLeftWaist.x, rLeftWaist.y, lWaist_Hip.x,      lWaist_Hip.y);
ctx.quadraticCurveTo(rLeftHip.x,   rLeftHip.y,   rLeftHem.x,        rLeftHem.y - cornerR);
ctx.quadraticCurveTo(rLeftHem.x,   rLeftHem.y,   robeLeftHalf.x,    robeLeftHalf.y);

// hem mid curve
ctx.quadraticCurveTo(robeMid.x, robeMid.y, robeRightHalf.x, robeRightHalf.y);

// rounded right hem corner → right S-curve: hip → waist → shoulder
ctx.quadraticCurveTo(rRightHem.x,  rRightHem.y,  rRightHem.x,        rRightHem.y - cornerR);
ctx.quadraticCurveTo(rRightHip.x,  rRightHip.y,  rWaist_Hip.x,       rWaist_Hip.y);
ctx.quadraticCurveTo(rRightWaist.x,rRightWaist.y, rShoulder_Waist.x, rShoulder_Waist.y);
ctx.quadraticCurveTo(rRightWaist.x,rRightWaist.y, 10,                -43);

ctx.fill();

  // ── Cape ─────────────────────────────────────────────────
  const midWaveX    = Math.sin(time * 0.31 + 1.7) * 6;
  const midWaveY    = Math.sin(time * 0.47 + 0.9) * 5;
  const midPoint    = { x:  Math.sin(time * 0.53) * 4,                        y: 0 + midWaveY - player.capeMidY };

  // Compute corners at full energy, then clamp X so neither ever crosses
  // midPoint — this prevents the hem from folding through itself.
  const rightCornerRaw = { x:  10 + getWaveX(45,'right',t2) + capeFlareX * 0.5, y: getWaveY(35,t2) - player.capeBottomY };
  const leftCornerRaw  = { x: -10 + getWaveX(45,'left', t4) - capeFlareX * 0.5, y: getWaveY(45,t4) - player.capeBottomY };
  const rightCorner = { x: Math.max(midPoint.x + 2, rightCornerRaw.x), y: rightCornerRaw.y };
  const leftCorner  = { x: Math.min(midPoint.x - 2, leftCornerRaw.x),  y: leftCornerRaw.y };

  const rightMid    = { x: (rightCorner.x + midPoint.x) / 2, y: (rightCorner.y + midPoint.y) / 2 };
  const leftMid     = { x: (leftCorner.x  + midPoint.x) / 2, y: (leftCorner.y  + midPoint.y) / 2 };

  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(-10, -43);
  ctx.quadraticCurveTo(0, -53, 10, -43);
  ctx.bezierCurveTo(
    10 + getWaveX(15,'right',t1), -32 + getWaveY(15,t1) - (player.capeLift * 0.03),
    10 + getWaveX(30,'right',t2) + (capeFlareX * 1), -13 + getWaveY(30,t2) - (player.capeLift * 0.6),
    rightCorner.x, rightCorner.y
  );
  ctx.quadraticCurveTo(midPoint.x, midPoint.y, rightMid.x, rightMid.y);
  ctx.quadraticCurveTo(midPoint.x, midPoint.y, leftMid.x,  leftMid.y);
  ctx.lineTo(leftCorner.x, leftCorner.y);
  ctx.bezierCurveTo(
    -10 + getWaveX(30,'left',t4) - (capeFlareX * 1), -13 + getWaveY(30,t4) - (player.capeLift * 0.6),
    -10 + getWaveX(15,'left',t3), -32 + getWaveY(15,t3) - (player.capeLift * 0.03),
    -10, -43
  );
  ctx.fill();

  ctx.fillStyle = layerColor;
  ctx.beginPath(); ctx.moveTo(-12, -50); ctx.lineTo(0, -35); ctx.lineTo(12, -50); ctx.lineTo(0, -48); ctx.fill();
  ctx.fillStyle = hairHex;
  ctx.beginPath(); ctx.arc(0, -52, 6, 0, Math.PI * 2); ctx.fill();

  const hairPointX = Math.sin(time * 0.6) * 1;
  ctx.beginPath(); ctx.moveTo(0,  -48); ctx.quadraticCurveTo(-3 + hairPointX, -33, 0 + w1 * 2, -18 + hairPointX); ctx.quadraticCurveTo(3 + hairPointX, -33, 0, -48); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, -58); ctx.quadraticCurveTo(-8.5 + hairPointX, -45, -6 + w1 * 0.5, -35); ctx.quadraticCurveTo(-3.5 + hairPointX, -45, -6, -58); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6,  -58); ctx.quadraticCurveTo(8.5 + hairPointX, -48,  6 + w1 * 0.5, -40); ctx.quadraticCurveTo(3.5 + hairPointX, -48,  6, -58); ctx.fill();

  const brimIdle   = Math.sin(time * 0.6) * 1;
  const brimWalk   = Math.sin(time * 3)   * 2;
  const brimPointX = brimIdle + (brimWalk - brimIdle) * player.walkFactor;
  ctx.fillStyle = layerColor;
  ctx.beginPath(); ctx.moveTo(-25, -55 + brimPointX); ctx.bezierCurveTo(-20, -62, 20, -62, 25, -55 + brimPointX); ctx.bezierCurveTo(20, -50, -20, -50, -25, -55 + brimPointX); ctx.fill();

  const hatIdle   = Math.sin(time * 0.6) * 2;
  const hatWalk   = Math.sin(time * 2.5) * 2;
  const hatPointX = hatIdle + (hatWalk - hatIdle) * player.walkFactor;
  ctx.fillStyle = coreColor;
  ctx.beginPath(); ctx.moveTo(-7, -58); ctx.quadraticCurveTo(-5, -75, 15 + hatPointX, -85 + hatPointX); ctx.quadraticCurveTo(5, -75, 7, -58); ctx.quadraticCurveTo(0, -54, -7, -58); ctx.fill();

  if (doGlow) ctx.restore();
  ctx.restore();
}

function drawSpiritOrb(w, h, inventory, keys) {
  const centerX         = w / 2;
  const projectionScale = h / 0.4;

  if (player.orb.smoothedZ    === undefined) player.orb.smoothedZ    = player.z;
  if (player.orb.walkInfluence === undefined) player.orb.walkInfluence = 0;

  let tempo = player.isJumping ? 0.05
    : (player.z < 0.19 && player.orb.smoothedZ > 0.19) ? 0.02 : 0.08;
  player.orb.smoothedZ += (player.z - player.orb.smoothedZ) * tempo;

  let zLag = player.z - player.orb.smoothedZ;
  if (zLag < 0) zLag = 0;
  const maxVisualLag      = 0.0012;
  if (zLag > maxVisualLag) zLag = maxVisualLag;
  const verticalLagPixels = zLag * projectionScale * 0.45;

  const isMoving        = keys['KeyW'] || keys['KeyS'] || keys['ArrowUp'] || keys['ArrowDown'];
  const targetInfluence = isMoving ? 1.0 : 0.0;
  player.orb.walkInfluence += (targetInfluence - player.orb.walkInfluence) * 0.1;

  const time      = Date.now() * 0.002;
  const finalMult = 1.0 + (player.orb.walkInfluence * 1.5);
  const swayX     = Math.cos(time * 0.6) * (0.008 * projectionScale * finalMult);
  const swayY     = Math.sin(time)       * (0.0085 * projectionScale * finalMult);

  ctx.save();
  const screenX = centerX + (0.11 * projectionScale);
  const screenY = h * 0.65;
  ctx.translate(screenX + swayX, screenY + swayY - verticalLagPixels);

  const orbRadius      = 0.015 * projectionScale;
  const grassYellowHex = '#ffb347';
  const spiritHex      = '#ffd1dc';
  const GOAL_ESSENCE   = 10;
  const progress       = Math.min(1.0, inventory.essence / (inventory.goalEssence ?? GOAL_ESSENCE));
  const currentColor   = lerpColor(grassYellowHex, spiritHex, progress);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
  ctx.fill();

  if (player.breakthroughAnim > 0) {
    const glowOpacity    = player.breakthroughAnim;
    const expansionPulse = 1.0 + Math.sin(player.breakthroughAnim * Math.PI) * 0.8;
    ctx.save();
    ctx.shadowBlur  = (25 + 10 * Math.sin(Date.now() * 0.003)) * expansionPulse;
    ctx.shadowColor = spiritHex;
    ctx.globalAlpha = glowOpacity;
    ctx.fillStyle   = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, orbRadius * 1.1 * expansionPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle   = spiritHex;
    ctx.globalAlpha = glowOpacity * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, orbRadius * 2.5 * expansionPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (inventory.essence > 0 && player.breakthroughAnim < 0.95) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
    ctx.clip();
    const fillLevel = 0.1 + progress * 0.9;
    const liquidTop = orbRadius - fillLevel * orbRadius * 2;
    ctx.fillStyle   = currentColor;
    ctx.beginPath();
    ctx.moveTo(-orbRadius - 2, orbRadius + 2);
    for (let lx = -orbRadius - 2; lx <= orbRadius + 2; lx += 1) {
      const wave = Math.sin(player.liquidPhase + lx * 0.1) * 4.0;
      ctx.lineTo(lx, liquidTop + wave);
    }
    ctx.lineTo(orbRadius + 2, orbRadius + 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawDebugHitboxes(projected, w, h) {
  ctx.save();

  const fovFactor = w / (2 * Math.tan(FOV / 2));
  const SEGS = 32;

  function projectRingPoint(pX, pY, lx, ly, worldZ) {
    const ppX = pX + lx;
    if (ppX <= 0.05) return null;
    const ppY    = pY + ly;
    const sScale = h / ppX;
    const sx     = (w / 2) + (ppY / ppX) * fovFactor;
    const sy     = (h / 2) + (player.z - worldZ) * sScale;
    return { x: sx, y: sy };
  }

  function drawRing(pX, pY, r, worldZ, color, lineW) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = lineW;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= SEGS; i++) {
      const ang = (i / SEGS) * Math.PI * 2;
      const pt  = projectRingPoint(pX, pY, Math.cos(ang) * r, Math.sin(ang) * r, worldZ);
      if (!pt) continue;
      if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
      else            ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // World object rings — pX/pY are already camera-relative from projection
  for (const obj of projected) {
    if (!obj.collidable || !obj.hitboxR) continue;

    const r          = obj.hitboxR + (player.radius ?? PLAYER_RADIUS);
    const groundZ    = obj.z || 0;
    const isInfinite = obj.objHeight === Infinity || obj.objHeight === undefined;

    drawRing(
      obj.pX, obj.pY, r, groundZ,
      isInfinite ? 'rgba(0,255,255,0.9)' : 'rgba(0,255,180,0.7)',
      isInfinite ? 2 : 1.5
    );

    if (!isInfinite) {
      drawRing(obj.pX, obj.pY, r, groundZ + obj.objHeight, 'rgba(255,200,0,0.5)', 1);
    }
  }

  // Player ground ring: the character is always at exactly PLAYER_DEPTH in
  // front of the camera (pY=0 = screen centre), worldZ=0 = ground plane.
  drawRing(PLAYER_DEPTH, 0, PLAYER_RADIUS, 0, 'rgba(255,255,255,0.95)', 2);

  const centre = projectRingPoint(PLAYER_DEPTH, 0, 0, 0, 0);
  if (centre) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(centre.x - 6, centre.y); ctx.lineTo(centre.x + 6, centre.y);
    ctx.moveTo(centre.x, centre.y - 6); ctx.lineTo(centre.x, centre.y + 6);
    ctx.stroke();
  }

  ctx.restore();
}

export function draw(inventory, keys) {
  const vw   = VIRT_W;
  const vh   = VIRT_H;
  const time = Date.now() * 0.001;

  const rawW       = canvas.width;
  const rawH       = canvas.height;
  const rawHorizon = rawH / 2;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, rawHorizon);
  skyGrad.addColorStop(0,   '#2e1a47');
  skyGrad.addColorStop(0.7, '#8c3a7d');
  skyGrad.addColorStop(1,   '#ff5a8a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, rawW, rawHorizon);

  const gndGrad = ctx.createLinearGradient(0, rawHorizon, 0, rawH);
  gndGrad.addColorStop(0, '#36407a');
  gndGrad.addColorStop(1, '#110c1f');
  ctx.fillStyle = gndGrad;
  ctx.fillRect(0, rawHorizon, rawW, rawH - rawHorizon);

  const { scale, offX, offY } = getViewport();
  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(scale, scale);

  drawCloudLayers(vw, vh, time);
  if (draw_groundnoise) drawGroundNoise(vw, vh);

  // ── Camera position ───────────────────────────────────────
  // player.x/y is the character's feet (the true game entity).
  // The camera sits PLAYER_DEPTH units behind the feet along player.dir.
  // All world objects are projected relative to the camera, NOT the feet.
  // This means:
  //   • Collision (player.x/y vs obj.x/y) is tested at the feet — correct.
  //   • Rotation pivots at the feet — character stays fixed, world rotates
  //     around the character rather than around a point behind them.
  const camX = player.x - Math.cos(player.dir) * PLAYER_DEPTH;
  const camY = player.y - Math.sin(player.dir) * PLAYER_DEPTH;

  const cosDir = Math.cos(-player.dir);
  const sinDir = Math.sin(-player.dir);

  const allWorldItems = [
    ...worldObjects,
    ...fireflies.map(f => ({
      x:    f.x + Math.sin(time + f.offset) * 2,
      y:    f.y + Math.cos(time + f.offset) * 2,
      z:    f.z + Math.sin(time * 0.5 + f.offset) * 0.5,
      type: 'firefly',
    })),
  ];

  const projected = allWorldItems
    .map(obj => {
      // Offset from camera (not feet) so depth and screen-X are correct.
      let dx = obj.x - camX;
      let dy = obj.y - camY;
      if (dx >  MAP_SIZE / 2) dx -= MAP_SIZE;
      if (dx < -MAP_SIZE / 2) dx += MAP_SIZE;
      if (dy >  MAP_SIZE / 2) dy -= MAP_SIZE;
      if (dy < -MAP_SIZE / 2) dy += MAP_SIZE;
      const pX = dx * cosDir - dy * sinDir;
      const pY = dx * sinDir + dy * cosDir;
      return { ...obj, pX, pY };
    })
    .filter(obj => obj.pX > 0.1 && obj.pX < 120);

  // Insert player sentinel — always at PLAYER_DEPTH from camera,
  // i.e. exactly where the feet are.
  const allItems = [
    ...projected,
    { type: '__player__', pX: PLAYER_DEPTH },
  ];
  allItems.sort((a, b) => b.pX - a.pX);

  // playerGroundY: screen pixel for z=0 at PLAYER_DEPTH from camera.
  // player.z is the camera/feet height; horizonOffset lifts the horizon
  // by that amount so ground objects project below screen centre.
  const playerProjScale = vh / PLAYER_DEPTH;
  const playerGroundY   = (vh / 2) + (player.z * playerProjScale);

  allItems.forEach(obj => {

    if (obj.type === '__player__') {
      drawKyo(vw, vh, playerGroundY, playerProjScale, inventory, keys);
      drawSpiritOrb(vw, vh, inventory, keys);
      return;
    }

    const scale_        = vh / obj.pX;
    const screenX       = (vw / 2) + (obj.pY / obj.pX) * (vw / (2 * Math.tan(FOV / 2)));
    const horizonOffset = player.z * scale_;
    const objBaseY      = (vh / 2) + horizonOffset - ((obj.z || 0) * scale_);
    const spriteHeight  = scale_ * (obj.size || 0);

    const fogFactor = Math.max(0, Math.min(1, (obj.pX - 25) / 10));

    ctx.globalAlpha = 1.0;

    if (obj.type === 'tree') {
      drawSVGTree(screenX, objBaseY, spriteHeight, obj.palette, time, obj.seed, fogFactor);

    } else if (obj.type === 'foreground_trunk') {
      const trunkW              = Math.min(spriteHeight / 6, scale_ * 0.8);
      const trunkPhysicalHeight = 2000;
      const horizonPink         = '#963C73';
      const trunkBaseColor      = '#0a0712';
      const horizonlightPurple  = '#2E183C';
      const horizonmiddlePurple = '#662E67';

      const screenTopInLocal = ctx.getTransform().inverse().transformPoint({ x: 0, y: 0 }).y;

      const finalBase   = lerpColor(trunkBaseColor, horizonPink,         fogFactor);
      const middleColor = lerpColor(trunkBaseColor, horizonmiddlePurple, fogFactor);
      const finalTop    = lerpColor(trunkBaseColor, horizonlightPurple,  fogFactor);

      const grad = ctx.createLinearGradient(0, objBaseY, 0, screenTopInLocal);
      grad.addColorStop(0,   finalBase);
      grad.addColorStop(0.5, middleColor);
      grad.addColorStop(1,   finalTop);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.rect(screenX - trunkW / 2, objBaseY, trunkW, -trunkPhysicalHeight);
      ctx.fill();

    } else if (obj.type === 'grass') {
      ctx.strokeStyle = applyFog(obj.color, fogFactor);
      const grassLW   = Math.max(1.4, 5 / obj.pX);
      ctx.lineWidth   = grassLW;
      ctx.lineCap     = 'round';
      // Lift the whole stroke by half the line width so the round cap's
      // bottom edge sits flush with objBaseY instead of poking below it.
      const grassLift = grassLW / 2;
      ctx.beginPath();
      ctx.moveTo(screenX, objBaseY - grassLift);
      const bend = Math.sin(time + obj.x) * (spriteHeight * 0.4);
      ctx.quadraticCurveTo(screenX + bend, objBaseY - spriteHeight / 2 - grassLift, screenX, objBaseY - spriteHeight - grassLift);
      ctx.stroke();

    } else if (obj.type === 'cloud_puff') {
        drawCloudPuff(screenX, objBaseY, spriteHeight, obj.seed, vw, fogFactor, time);

    } else if (obj.type === 'essence' || obj.type === 'firefly') {
      const glow        = obj.type === 'essence' ? '#ffd1dc' : '#fff9c4';
      const bobbing     = Math.sin(time * 3 + obj.phase) * (spriteHeight * 0.15);
      const baseLift    = spriteHeight * 0.5;
      const floatOffset = obj.type === 'essence' ? (baseLift + bobbing) : 0;
      const y           = Math.min(objBaseY - 2, objBaseY - floatOffset);

      if (scale_ < 0.05) return;

      ctx.save();
      ctx.shadowBlur  = obj.type === 'essence' ? 10 : 6;
      ctx.shadowColor = glow;
      ctx.fillStyle   = '#fff';
      ctx.beginPath();
      ctx.arc(screenX, y, Math.max(1, spriteHeight / 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

  if (SHOW_HITBOXES) {
    drawDebugHitboxes(projected, vw, vh);
  }

  ctx.restore();
}