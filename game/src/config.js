// Every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  speed: 205,
  sneakSpeed: 105,
  // Loot sits in the middle of a display case the thief cannot step onto,
  // so the grab reach must cover standing at the case's edge and leaning in.
  grabRadius: 72,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 148,
  coneLength: 205,
  coneHalfAngle: 0.56, // ~32 degrees each side
  suspectTime: 2.2,
};

export const CAMERA = {
  coneLength: 235,
  coneHalfAngle: 0.42,
  sweepSpeed: 0.55, // radians per second
  sweepArc: 1.15,
};

export const ALARM = {
  guardRate: 22, // per second while fully seen by a guard
  cameraRate: 18, // per second while seen by a camera
  sneakFactor: 0.45,
  decayRate: 10, // per second while unseen
  toolNoise: 4, // alarm added each time a tool is used
  huntAt: 100, // alarm level that triggers the hunt
};

export const TOOLS = {
  coins: 3,
  smoke: 2,
  emp: 2,
  smokeDuration: 3.5,
  empDuration: 6,
  coinRadius: 150, // guards within this hear the coin
};

export const LEVELS = [
  { name: 'FLOOR 1 — THE GAMING HALL', guards: 3, cameras: 2 },
  { name: 'FLOOR 2 — THE HIGH-ROLLER SUITE', guards: 4, cameras: 3 },
  { name: 'FLOOR 3 — THE ROOFTOP GETAWAY', guards: 5, cameras: 3 },
];

export const PALETTE = {
  backdrop: '#0a0d18',
  floorA: '#1d2439',
  floorB: '#242c47',
  rug: '#5a2436',
  rugTrim: '#c9a227',
  wall: '#2c3350',
  wallTop: '#3a4370',
  caseGlass: '#9fd8e8',
  caseFrame: '#8a6d2f',
  loot: '#ffd94a',
  lootGlow: '#ffedb0',
  thief: '#7ee7c7',
  thiefDark: '#2e8f74',
  guard: '#e8b13c',
  guardSuit: '#3d4a6b',
  cone: '#ffd94a',
  coneCamera: '#ff5a5a',
  coneSuspect: '#ff9a2e',
  coneHunt: '#ff2e2e',
  exit: '#59e391',
  text: '#f2ead8',
  muted: '#9aa3c0',
  panel: '#141828',
  alarmLow: '#59e391',
  alarmMid: '#ffb02e',
  alarmHigh: '#ff3b30',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best take is kept between visits (this browser only). */
export const BEST_KEY = 'high-stakes.best';
