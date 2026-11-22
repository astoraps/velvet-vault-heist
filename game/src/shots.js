// The screenshot scenes behind ?shot=start|play|hunt|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (try eight directions, keep clear of cones and walls,
// head for the nearest loot, then the exit), so the frame is what a real game
// looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 16;
const END_LIMIT_SECONDS = 1500;
const SAMPLE = 1 / 30;
const DIRS = [
  [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** The autopilot's next move: the direction that gets closer to the target
 *  while staying out of vision cones and walls. While hunted it flees the
 *  nearest guard instead of chasing loot. */
function autopilot(world, reckless) {
  const state = world.state;
  const target = state.lootTaken >= state.lootTotal
    ? state.exit
    : world.nearestLoot() || state.exit;
  const dangerHere = world.dangerAt(state.thief.x, state.thief.y);
  let nearestGuardHere = Infinity;
  for (const g of state.guards) {
    nearestGuardHere = Math.min(nearestGuardHere, Math.hypot(g.x - state.thief.x, g.y - state.thief.y));
  }
  // Seen or about to be: drop the loot run and sprint out of the cone to
  // break line of sight. Sneaking while a guard watches you is fatal.
  const fleeing = state.hunting || state.spotted || dangerHere > 0.35;
  let best = DIRS[0];
  let bestScore = -Infinity;
  for (const [dx, dy] of DIRS) {
    const len = Math.hypot(dx, dy) || 1;
    const px = state.thief.x + (dx / len) * 46;
    const py = state.thief.y + (dy / len) * 46;
    if (world.blocked(px, py, 13)) continue;
    const dist = Math.hypot(target.x - px, target.y - py);
    const danger = world.dangerAt(px, py);
    let guardNear = 0;
    let nearest = Infinity;
    for (const g of state.guards) {
      const gd = Math.hypot(g.x - px, g.y - py);
      nearest = Math.min(nearest, gd);
      if (gd < 120) guardNear = Math.max(guardNear, (120 - gd) * 3);
    }
    let score;
    if (fleeing) {
      score = nearest * 3 - danger * 250 - guardNear * 0.5;
    } else {
      score = -dist - danger * 420 - guardNear;
    }
    if (score > bestScore) {
      bestScore = score;
      best = [dx, dy];
    }
  }
  const len = Math.hypot(best[0], best[1]) || 1;
  return {
    mx: best[0] / len,
    my: best[1] / len,
    // Sneak past a cone, but run when a guard is already on your tail.
    sneak: !fleeing && dangerHere > 0.15 && nearestGuardHere > 130,
    coin: null,
    smoke: null,
    emp: null,
  };
}

function runFor(world, seconds, reckless) {
  const steps = Math.floor(seconds / STEP);
  let lastSmokeAt = -10;
  let lastCoinAt = -10;
  for (let i = 0; i < steps; i += 1) {
    if (world.state.over || world.state.won) break;
    const input = autopilot(world, reckless);
    const state = world.state;
    // A guard closing in: drop smoke to break its line of sight, or toss
    // a coin past it so it investigates away from the thief.
    let nearestGuard = null;
    let nearestDist = Infinity;
    for (const g of state.guards) {
      const d = Math.hypot(g.x - state.thief.x, g.y - state.thief.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestGuard = g;
      }
    }
    if (!reckless && nearestGuard && nearestDist < 85 && state.tools.smoke > 0 && state.totalTime - lastSmokeAt > 4) {
      input.smoke = true;
      lastSmokeAt = state.totalTime;
    } else if (!reckless && nearestGuard && nearestDist < 130 && state.alarm > 35 && state.tools.coins > 0 && state.totalTime - lastCoinAt > 6) {
      const dx = nearestGuard.x - state.thief.x;
      const dy = nearestGuard.y - state.thief.y;
      const len = Math.hypot(dx, dy) || 1;
      input.coin = {
        x: Math.max(30, Math.min(1250, nearestGuard.x + (dx / len) * 140)),
        y: Math.max(100, Math.min(690, nearestGuard.y + (dy / len) * 140)),
      };
      lastCoinAt = state.totalTime;
    }
    world.step(STEP, input);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    runFor(world, PLAY_SECONDS, false);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'play2') {
    // A second room: the High-Roller Suite, denser patrols and cameras.
    world.loadLevel(1);
    runFor(world, PLAY_SECONDS, false);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'hunt') {
    runFor(world, 14, true);
    // Force the alarm high so the frame shows the hunt in full swing,
    // then step only a heartbeat so the thief is still on the run.
    world.state.alarm = 87;
    world.state.hunting = true;
    for (const g of world.state.guards) g.mode = 'hunt';
    for (let i = 0; i < 30; i += 1) {
      if (world.state.over) break;
      let close = false;
      for (const g of world.state.guards) {
        if (Math.hypot(g.x - world.state.thief.x, g.y - world.state.thief.y) < 46) close = true;
      }
      if (close) break;
      world.step(STEP, autopilot(world, true));
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    runFor(world, END_LIMIT_SECONDS, false);
    if (world.state.won) return { screen: SCREEN_WIN, best: world.state.score };
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  // The title frame: the thief waits at the door while the guards patrol.
  // No autopilot — the room should read as a fresh heist about to begin.
  for (let i = 0; i < START_SECONDS / STEP; i += 1) {
    world.step(STEP, { mx: 0, my: 0, sneak: false, coin: null, smoke: null, emp: null });
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
