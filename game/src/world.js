// The world: rooms, walls, guards, cameras, loot, the alarm meter and the
// thief's tools. Pure simulation — no drawing, no DOM — so it can be stepped
// by the game loop and by the screenshot autopilot alike.
import { ALARM, CAMERA, FIELD, GUARD, THIEF, TOOLS } from './config.js';

export const EVENT_PICKUP = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_LEVEL = 4;
export const EVENT_WIN = 8;
export const EVENT_SPOTTED = 16;
export const EVENT_TOOL = 32;

const LOOT_DEFS = [
  { name: 'Golden Chip', value: 2400 },
  { name: 'Diamond Bracelet', value: 3100 },
  { name: 'Emerald Necklace', value: 4200 },
  { name: 'The Aurum Crown', value: 5500 },
];

function rect(x, y, w, h) {
  return { x, y, w, h };
}

function pointInRect(px, py, r, pad = 0) {
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
}

// Each level is one museum floor: outer walls, interior walls, display
// cases and planters as cover, loot, guard patrol loops and cameras.
function buildLevel(index) {
  const top = 76;
  const walls = [
    rect(0, top, FIELD.width, 14),
    rect(0, top, 14, FIELD.height - top),
    rect(FIELD.width - 14, top, 14, FIELD.height - top),
    rect(0, FIELD.height - 14, FIELD.width, 14),
  ];
  const covers = [];
  const loot = [];
  const guards = [];
  const cameras = [];
  const start = { x: 86, y: 648 };
  const exit = { x: 1196, y: 648 };

  if (index === 0) {
    // Two gaps in each interior wall: several routes through every room.
    walls.push(rect(430, top, 16, 250));
    walls.push(rect(430, 420, 16, 120));
    walls.push(rect(430, 590, 16, 116));
    walls.push(rect(830, top, 16, 180));
    walls.push(rect(830, 330, 16, 180));
    walls.push(rect(830, 560, 16, 146));
    covers.push(
      rect(180, 190, 96, 56), rect(180, 470, 96, 56),
      rect(560, 150, 110, 60), rect(560, 500, 110, 60),
      rect(950, 470, 110, 60), rect(1020, 150, 96, 56),
    );
    loot.push(
      { x: 615, y: 222, ...LOOT_DEFS[0] },
      { x: 1068, y: 218, ...LOOT_DEFS[1] },
      { x: 228, y: 538, ...LOOT_DEFS[2] },
    );
    guards.push(
      { waypoints: [[140, 130], [140, 620], [320, 620], [320, 130]], speed: GUARD.patrolSpeed },
      { waypoints: [[700, 620], [700, 130], [760, 130], [760, 620]], speed: GUARD.patrolSpeed + 8 },
      { waypoints: [[1150, 620], [900, 620], [900, 130], [1150, 130]], speed: GUARD.patrolSpeed + 4 },
    );
    cameras.push(
      { x: 446, y: 96, base: 0.5, phase: 0 },
      { x: 846, y: 690, base: Math.PI + 0.4, phase: 2.1 },
    );
  } else if (index === 1) {
    walls.push(rect(340, top, 16, 200));
    walls.push(rect(340, 340, 16, 180));
    walls.push(rect(340, 570, 16, 136));
    walls.push(rect(700, top, 16, 300));
    walls.push(rect(700, 450, 16, 120));
    walls.push(rect(700, 620, 16, 86));
    walls.push(rect(1000, top, 16, 200));
    walls.push(rect(1000, 340, 16, 180));
    walls.push(rect(1000, 570, 16, 136));
    covers.push(
      rect(150, 300, 96, 56), rect(480, 150, 110, 60),
      rect(480, 540, 110, 60), rect(830, 300, 96, 56),
      rect(1100, 150, 96, 56), rect(1100, 540, 96, 56),
    );
    loot.push(
      { x: 198, y: 368, ...LOOT_DEFS[0] },
      { x: 535, y: 222, ...LOOT_DEFS[1] },
      { x: 878, y: 368, ...LOOT_DEFS[2] },
      { x: 1148, y: 608, ...LOOT_DEFS[3] },
    );
    guards.push(
      { waypoints: [[270, 130], [270, 620], [90, 620], [90, 130]], speed: GUARD.patrolSpeed + 6 },
      { waypoints: [[460, 620], [460, 130], [640, 130], [640, 620]], speed: GUARD.patrolSpeed + 12 },
      { waypoints: [[790, 130], [790, 620], [760, 620], [760, 130]], speed: GUARD.patrolSpeed + 8 },
      { waypoints: [[1230, 620], [1060, 620], [1060, 130], [1230, 130]], speed: GUARD.patrolSpeed + 14 },
    );
    cameras.push(
      { x: 356, y: 96, base: 0.9, phase: 0 },
      { x: 716, y: 690, base: Math.PI - 0.6, phase: 1.4 },
      { x: 1016, y: 96, base: 0.3, phase: 2.8 },
    );
  } else {
    walls.push(rect(280, top, 16, 240));
    walls.push(rect(280, 380, 16, 140));
    walls.push(rect(280, 570, 16, 136));
    walls.push(rect(620, top, 16, 180));
    walls.push(rect(620, 320, 16, 180));
    walls.push(rect(620, 550, 16, 156));
    walls.push(rect(960, top, 16, 240));
    walls.push(rect(960, 380, 16, 140));
    walls.push(rect(960, 570, 16, 136));
    covers.push(
      rect(120, 200, 96, 56), rect(120, 520, 96, 56),
      rect(430, 300, 110, 60), rect(760, 150, 96, 56),
      rect(760, 540, 96, 56), rect(1100, 300, 110, 60),
    );
    loot.push(
      { x: 168, y: 268, ...LOOT_DEFS[0] },
      { x: 485, y: 372, ...LOOT_DEFS[1] },
      { x: 808, y: 218, ...LOOT_DEFS[2] },
      { x: 1155, y: 372, ...LOOT_DEFS[3] },
    );
    guards.push(
      { waypoints: [[240, 130], [240, 620], [80, 620], [80, 130]], speed: GUARD.patrolSpeed + 12 },
      { waypoints: [[580, 620], [580, 288], [700, 288], [700, 620]], speed: GUARD.patrolSpeed + 18 },
      { waypoints: [[680, 130], [680, 620], [900, 620], [900, 130]], speed: GUARD.patrolSpeed + 14 },
      { waypoints: [[1240, 620], [1010, 620], [1010, 130], [1240, 130]], speed: GUARD.patrolSpeed + 20 },
      { waypoints: [[660, 380], [900, 380], [900, 500], [660, 500]], speed: GUARD.patrolSpeed + 10 },
    );
    cameras.push(
      { x: 296, y: 96, base: 0.7, phase: 0 },
      { x: 636, y: 690, base: Math.PI - 0.4, phase: 1.9 },
      { x: 976, y: 96, base: 1.0, phase: 3.3 },
    );
  }

  return { walls, covers, loot, guards, cameras, start, exit };
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createWorld(random) {
  const state = {
    level: 0,
    score: 0,
    lootTaken: 0,
    lootTotal: 0,
    alarm: 0,
    time: 0,
    totalTime: 0,
    over: false,
    won: false,
    levelDone: false,
    spotted: false,
    hunting: false,
    thief: { x: 0, y: 0, angle: 0, moving: false, sneak: false, stepPhase: 0 },
    guards: [],
    cameras: [],
    loot: [],
    walls: [],
    covers: [],
    exit: { x: 0, y: 0 },
    smokes: [],
    coins: [],
    empTimer: 0,
    tools: { ...TOOLS },
    message: '',
    messageTimer: 0,
  };

  function loadLevel(index) {
    const def = buildLevel(index);
    state.level = index;
    state.walls = def.walls;
    state.covers = def.covers;
    state.exit = def.exit;
    state.loot = def.loot.map((l) => ({ ...l, taken: false }));
    state.lootTotal = state.loot.length;
    state.lootTaken = 0;
    state.alarm = 0;
    state.time = 0;
    state.levelDone = false;
    state.hunting = false;
    state.smokes = [];
    state.coins = [];
    state.empTimer = 0;
    // Fresh tools at each gallery: a new room, a new kit.
    state.tools = { coins: TOOLS.coins, smoke: TOOLS.smoke, emp: TOOLS.emp };
    state.thief.x = def.start.x;
    state.thief.y = def.start.y;
    state.thief.angle = 0;
    state.guards = def.guards.map((g) => ({
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      waypoints: g.waypoints,
      wp: 1,
      angle: 0,
      speed: g.speed,
      mode: 'patrol',
      lookX: 0,
      lookY: 0,
      lookTimer: 0,
      seenTimer: 0,
      stuckTimer: 0,
      lastDist: Infinity,
    }));
    state.cameras = def.cameras.map((c) => ({
      x: c.x, y: c.y, base: c.base, phase: c.phase, angle: c.base, disabled: 0,
    }));
  }

  function reset() {
    state.score = 0;
    state.totalTime = 0;
    state.over = false;
    state.won = false;
    state.tools = { coins: TOOLS.coins, smoke: TOOLS.smoke, emp: TOOLS.emp };
    loadLevel(0);
  }

  function blocked(x, y, radius) {
    for (const w of state.walls) {
      if (pointInRect(x, y, { x: w.x - radius, y: w.y - radius, w: w.w + radius * 2, h: w.h + radius * 2 })) return true;
    }
    for (const c of state.covers) {
      if (pointInRect(x, y, { x: c.x - radius, y: c.y - radius, w: c.w + radius * 2, h: c.h + radius * 2 })) return true;
    }
    return false;
  }

  // Line of sight between two points: blocked by walls, covers or smoke.
  function losClear(ax, ay, bx, by) {
    const steps = 14;
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      for (const w of state.walls) if (pointInRect(x, y, w)) return false;
      for (const c of state.covers) if (pointInRect(x, y, c)) return false;
      for (const s of state.smokes) {
        if (Math.hypot(x - s.x, y - s.y) < s.r) return false;
      }
    }
    return true;
  }

  // How strongly an observer at (ox,oy) facing `angle` sees the thief:
  // 0 = not seen, up to 1 = dead centre, close.
  function seenBy(ox, oy, angle, length, halfAngle) {
    const dx = state.thief.x - ox;
    const dy = state.thief.y - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > length) return 0;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return 0;
    if (!losClear(ox, oy, state.thief.x, state.thief.y)) return 0;
    const centre = 1 - Math.abs(angleDiff(Math.atan2(dy, dx), angle)) / halfAngle;
    const near = 1 - dist / length;
    return Math.min(1, 0.35 + 0.65 * centre * (0.5 + near));
  }

  function moveCircle(ent, dx, dy, radius) {
    const nx = ent.x + dx;
    if (!blocked(nx, ent.y, radius)) ent.x = nx;
    const ny = ent.y + dy;
    if (!blocked(ent.x, ny, radius)) ent.y = ny;
  }

  function step(dt, input) {
    if (state.over || state.won) return 0;
    let events = 0;
    state.time += dt;
    state.totalTime += dt;
    if (state.messageTimer > 0) state.messageTimer -= dt;

    // --- tools ---
    if (input.coin && state.tools.coins > 0) {
      state.tools.coins -= 1;
      state.alarm = Math.min(100, state.alarm + ALARM.toolNoise);
      const p = input.coin;
      state.coins.push({ x: p.x, y: p.y, timer: 1.2 });
      for (const g of state.guards) {
        if (Math.hypot(g.x - p.x, g.y - p.y) < TOOLS.coinRadius) {
          g.mode = 'suspect';
          g.lookX = p.x;
          g.lookY = p.y;
          g.lookTimer = GUARD.suspectTime;
        }
      }
      events |= EVENT_TOOL;
    }
    if (input.smoke && state.tools.smoke > 0) {
      state.tools.smoke -= 1;
      state.alarm = Math.min(100, state.alarm + ALARM.toolNoise);
      state.smokes.push({ x: state.thief.x, y: state.thief.y, r: 85, timer: TOOLS.smokeDuration });
      events |= EVENT_TOOL;
    }
    if (input.emp && state.tools.emp > 0) {
      state.tools.emp -= 1;
      state.alarm = Math.min(100, state.alarm + ALARM.toolNoise);
      state.empTimer = TOOLS.empDuration;
      for (const c of state.cameras) c.disabled = TOOLS.empDuration;
      events |= EVENT_TOOL;
    }

    // --- thief movement ---
    const speed = input.sneak ? THIEF.sneakSpeed : THIEF.speed;
    const mx = input.mx || 0;
    const my = input.my || 0;
    if (mx !== 0 || my !== 0) {
      state.thief.angle = Math.atan2(my, mx);
      state.thief.moving = true;
      state.thief.stepPhase += dt * (input.sneak ? 6 : 11);
    } else {
      state.thief.moving = false;
    }
    state.thief.sneak = !!input.sneak;
    moveCircle(state.thief, mx * speed * dt, my * speed * dt, THIEF.radius);

    // --- loot: walk over a display case to pocket it ---
    for (const l of state.loot) {
      if (!l.taken && Math.hypot(state.thief.x - l.x, state.thief.y - l.y) < THIEF.grabRadius) {
        l.taken = true;
        state.lootTaken += 1;
        state.score += l.value;
        state.message = `${l.name} pocketed — $${l.value.toLocaleString()}`;
        state.messageTimer = 2.2;
        events |= EVENT_PICKUP;
      }
    }

    // --- cameras sweep ---
    for (const c of state.cameras) {
      if (c.disabled > 0) c.disabled -= dt;
      c.angle = c.base + Math.sin(state.time * CAMERA.sweepSpeed + c.phase) * CAMERA.sweepArc;
    }
    if (state.empTimer > 0) state.empTimer -= dt;

    // --- detection ---
    let seen = 0;
    const sneakFactor = state.thief.sneak ? ALARM.sneakFactor : 1;
    for (const g of state.guards) {
      const s = seenBy(g.x, g.y, g.angle, GUARD.coneLength, GUARD.coneHalfAngle);
      if (s > 0) {
        seen = Math.max(seen, s);
        g.mode = 'suspect';
        g.seenTimer = 2.0;
        g.lookX = state.thief.x;
        g.lookY = state.thief.y;
        g.lookTimer = GUARD.suspectTime;
        if (s > 0.55) events |= EVENT_SPOTTED;
      } else if (g.mode === 'suspect') {
        // Out of sight: the guard gives up after a couple of seconds and
        // goes back to patrol instead of tracking the thief forever.
        g.seenTimer -= dt;
        if (g.seenTimer <= 0) g.mode = 'patrol';
      }
    }
    for (const c of state.cameras) {
      if (c.disabled > 0) continue;
      const s = seenBy(c.x, c.y, c.angle, CAMERA.coneLength, CAMERA.coneHalfAngle);
      if (s > 0) {
        seen = Math.max(seen, s * 0.85);
        if (s > 0.55) events |= EVENT_SPOTTED;
      }
    }
    if (seen > 0) {
      const rate = (ALARM.guardRate * seen + ALARM.cameraRate * 0.25 * seen) * sneakFactor;
      state.alarm = Math.min(100, state.alarm + rate * dt);
      state.spotted = true;
    } else {
      state.alarm = Math.max(0, state.alarm - ALARM.decayRate * dt);
      state.spotted = false;
    }
    if (state.alarm >= ALARM.huntAt && !state.hunting) {
      state.hunting = true;
      state.message = 'ALARM TRIPPED — guards are hunting you!';
      state.messageTimer = 2.5;
      for (const g of state.guards) g.mode = 'hunt';
    }
    if (state.alarm < 55) state.hunting = false;

    // --- guards ---
    for (const g of state.guards) {
      if (g.mode === 'hunt') {
        const a = angleTo(g.x, g.y, state.thief.x, state.thief.y);
        g.angle = a;
        moveCircle(g, Math.cos(a) * GUARD.chaseSpeed * dt, Math.sin(a) * GUARD.chaseSpeed * dt, GUARD.radius);
        if (Math.hypot(g.x - state.thief.x, g.y - state.thief.y) < GUARD.radius + THIEF.radius + 2) {
          state.over = true;
          events |= EVENT_CAUGHT;
        }
      } else if (g.mode === 'suspect') {
        const a = angleTo(g.x, g.y, g.lookX, g.lookY);
        g.angle = a;
        const d = Math.hypot(g.lookX - g.x, g.lookY - g.y);
        if (d > 18) {
          moveCircle(g, Math.cos(a) * GUARD.patrolSpeed * 1.25 * dt, Math.sin(a) * GUARD.patrolSpeed * 1.25 * dt, GUARD.radius);
        } else {
          g.lookTimer -= dt;
          g.angle += Math.sin(state.time * 2.4) * 0.02;
          if (g.lookTimer <= 0) g.mode = 'patrol';
        }
      } else {
        const target = g.waypoints[g.wp];
        const a = angleTo(g.x, g.y, target[0], target[1]);
        g.angle = a;
        const before = Math.hypot(target[0] - g.x, target[1] - g.y);
        moveCircle(g, Math.cos(a) * g.speed * dt, Math.sin(a) * g.speed * dt, GUARD.radius);
        const after = Math.hypot(target[0] - g.x, target[1] - g.y);
        if (after < 10) {
          g.wp = (g.wp + 1) % g.waypoints.length;
          g.stuckTimer = 0;
          g.lastDist = Infinity;
        } else if (after >= g.lastDist - 0.5) {
          // Wedged against a wall or case: give up on this waypoint.
          g.stuckTimer += dt;
          if (g.stuckTimer > 1.0) {
            g.wp = (g.wp + 1) % g.waypoints.length;
            g.stuckTimer = 0;
            g.lastDist = Infinity;
          }
        } else {
          g.stuckTimer = 0;
        }
        g.lastDist = after;
      }
    }

    // --- smoke / coins fade ---
    state.smokes = state.smokes.filter((s) => (s.timer -= dt) > 0);
    state.coins = state.coins.filter((c) => (c.timer -= dt) > 0);

    // --- exit: all loot, then reach the green door ---
    if (state.lootTaken >= state.lootTotal) {
      if (Math.hypot(state.thief.x - state.exit.x, state.thief.y - state.exit.y) < 44) {
        if (state.level >= 2) {
          state.won = true;
          events |= EVENT_WIN;
        } else {
          const bonus = Math.max(0, 1500 - Math.floor(state.time) * 10);
          state.score += bonus;
          state.message = `Floor cleared — getaway bonus $${bonus.toLocaleString()}`;
          state.messageTimer = 2.5;
          loadLevel(state.level + 1);
          events |= EVENT_LEVEL;
        }
      }
    }

    return events;
  }

  // Helpers the screenshot autopilot uses to read the room.
  function dangerAt(x, y) {
    let danger = 0;
    const saved = { x: state.thief.x, y: state.thief.y };
    state.thief.x = x;
    state.thief.y = y;
    for (const g of state.guards) {
      danger = Math.max(danger, seenBy(g.x, g.y, g.angle, GUARD.coneLength, GUARD.coneHalfAngle));
    }
    for (const c of state.cameras) {
      if (c.disabled > 0) continue;
      danger = Math.max(danger, seenBy(c.x, c.y, c.angle, CAMERA.coneLength, CAMERA.coneHalfAngle) * 0.85);
    }
    state.thief.x = saved.x;
    state.thief.y = saved.y;
    return danger;
  }

  function nearestLoot() {
    let best = null;
    let bestD = Infinity;
    for (const l of state.loot) {
      if (l.taken) continue;
      const d = Math.hypot(l.x - state.thief.x, l.y - state.thief.y);
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    }
    return best;
  }

  reset();
  return { state, reset, step, blocked, dangerAt, nearestLoot, loadLevel, losClear };
}
