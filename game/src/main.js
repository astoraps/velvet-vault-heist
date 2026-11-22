// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens: title,
// play, paused, caught and getaway.
//
// ?seed=N fixes the patrols and loot. ?shot=start|play|hunt|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CAUGHT, EVENT_LEVEL, EVENT_PICKUP, EVENT_SPOTTED, EVENT_WIN } from './world.js';
import {
  ACTION_COIN, ACTION_CONFIRM, ACTION_EMP, ACTION_GRAB, ACTION_MUTE, ACTION_PAUSE, ACTION_SMOKE, createInput,
} from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best take then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let stepTimer = 0;
  let wasHunting = false;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Grab every piece of loot, then reach the exit.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.stopAlarm();
    audio.caught();
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Caught. Take $${world.state.score}. Best $${best}.`);
  }

  function winGame() {
    screen = SCREEN_WIN;
    audio.stopAlarm();
    audio.win();
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Clean getaway. Take $${world.state.score}. Best $${best}.`);
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const rect = canvas.getBoundingClientRect();
    input.setViewport(rect.width / 1280, 0, 0);

    if (input.action(ACTION_MUTE)) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }

    if (screen === SCREEN_TITLE) {
      if (input.action(ACTION_CONFIRM) || input.mouseClicked) startGame();
    } else if (screen === SCREEN_PLAY) {
      if (input.action(ACTION_PAUSE)) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else {
        const move = input.move();
        const coinTarget = input.mouseClicked
          ? { x: Math.max(0, Math.min(1280, input.mouse.x)), y: Math.max(0, Math.min(720, input.mouse.y)) }
          : null;
        const act = {
          mx: move.x,
          my: move.y,
          sneak: input.sneak,
          coin: coinTarget || (input.action(ACTION_COIN) ? { x: world.state.thief.x + Math.cos(world.state.thief.angle) * 170, y: world.state.thief.y + Math.sin(world.state.thief.angle) * 170 } : null),
          smoke: input.action(ACTION_SMOKE) ? true : null,
          emp: input.action(ACTION_EMP) ? true : null,
          grab: input.action(ACTION_GRAB),
        };
        if (act.coin) audio.coin();
        if (act.smoke) audio.smoke();
        if (act.emp) audio.emp();
        accumulator += elapsed;
        while (accumulator >= STEP) {
          accumulator -= STEP;
          const events = world.step(STEP, act);
          if (events & EVENT_PICKUP) audio.pickup();
          if (events & EVENT_SPOTTED) audio.spotted();
          if (events & EVENT_LEVEL) audio.levelClear();
          if (events & EVENT_CAUGHT) endGame();
          if (events & EVENT_WIN) winGame();
          act.coin = null;
          act.smoke = null;
          act.emp = null;
        }
        if (world.state.hunting && !wasHunting) audio.startAlarm();
        if (!world.state.hunting && wasHunting) audio.stopAlarm();
        wasHunting = world.state.hunting;
        if (world.state.thief.moving) {
          stepTimer -= elapsed;
          if (stepTimer <= 0) {
            audio.step();
            stepTimer = world.state.thief.sneak ? 0.55 : 0.34;
          }
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (input.action(ACTION_PAUSE) || input.action(ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        last = performance.now();
        announce('Playing.');
      }
    } else if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (input.action(ACTION_CONFIRM)) startGame();
    }

    renderer.draw(world.state, screen, best);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
