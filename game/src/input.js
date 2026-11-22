// Keyboard and mouse input, read once per frame. Movement is a normalized
// vector; actions are edge-triggered (true only on the frame they happen).
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_COIN = 'coin';
export const ACTION_SMOKE = 'smoke';
export const ACTION_EMP = 'emp';
export const ACTION_GRAB = 'grab';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  Space: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
  KeyQ: ACTION_COIN,
  KeyF: ACTION_SMOKE,
  KeyR: ACTION_EMP,
  KeyE: ACTION_GRAB,
};

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false };
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function keyName(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(keyName(e));
    keys.add(keyName(e));
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left - offsetX) / scale;
    mouse.y = (e.clientY - rect.top - offsetY) / scale;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left - offsetX) / scale;
    mouse.y = (e.clientY - rect.top - offsetY) / scale;
    mouse.clicked = true;
  });

  return {
    setViewport(s, ox, oy) {
      scale = s;
      offsetX = ox;
      offsetY = oy;
    },
    /** Movement vector, length 0..1. */
    move() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    get sneak() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    get mouse() {
      return mouse;
    },
    /** True once, on the frame the action key went down. */
    action(name) {
      for (const code of pressed) {
        if (KEY_ACTIONS[code] === name) return true;
      }
      return false;
    },
    get mouseClicked() {
      return mouse.clicked;
    },
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
