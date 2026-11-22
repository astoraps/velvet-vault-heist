// All drawing: the museum floor, vision cones, cameras, loot, the thief,
// the alarm HUD and the title / caught / getaway screens. One canvas, one
// logical 1280x720 field scaled to the window.
import { FIELD, PALETTE, FONT } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function conePath(ctx, x, y, angle, length, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, length, angle - half, angle + half);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const light = document.createElement('canvas');
  light.width = FIELD.width;
  light.height = FIELD.height;
  const lctx = light.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.floor(FIELD.width * scale * dpr);
    canvas.height = Math.floor(FIELD.height * scale * dpr);
    canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
    canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    return scale;
  }

  function drawFloor(state) {
    const tile = 64;
    for (let y = 0; y < FIELD.height; y += tile) {
      for (let x = 0; x < FIELD.width; x += tile) {
        ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(x, y, tile, tile);
      }
    }
    // Central rug with a gold diamond inlay.
    ctx.fillStyle = PALETTE.rug;
    ctx.fillRect(470, 250, 340, 220);
    ctx.strokeStyle = PALETTE.rugTrim;
    ctx.lineWidth = 3;
    ctx.strokeRect(478, 258, 324, 204);
    ctx.strokeStyle = 'rgba(201,162,39,0.35)';
    ctx.strokeRect(492, 272, 296, 176);
    ctx.strokeStyle = 'rgba(201,162,39,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(640, 300);
    ctx.lineTo(700, 360);
    ctx.lineTo(640, 420);
    ctx.lineTo(580, 360);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(201,162,39,0.5)';
    ctx.font = 'bold 13px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('A U R U M', 640, 364);
    // Wall paintings.
    ctx.fillStyle = '#2a2140';
    ctx.fillRect(180, 84, 70, 46);
    ctx.fillRect(980, 84, 70, 46);
    ctx.fillStyle = '#c9a227';
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(180, 84, 70, 46);
    ctx.strokeRect(980, 84, 70, 46);
    ctx.fillStyle = '#7e6bb0';
    ctx.beginPath();
    ctx.arc(215, 107, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e07840';
    ctx.beginPath();
    ctx.arc(1015, 107, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWalls(state) {
    for (const w of state.walls) {
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(w.x, w.y + 4, w.w, w.h - 4);
    }
    for (const c of state.covers) {
      // Display case: dark plinth, glass top, gold frame.
      ctx.fillStyle = '#10131f';
      ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
      ctx.fillStyle = PALETTE.caseFrame;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(159,216,232,0.28)';
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(c.x + 8, c.y + 6, c.w - 30, 5);
    }
  }

  function drawExit(state) {
    const done = state.lootTaken >= state.lootTotal;
    const pulse = 0.6 + 0.4 * Math.sin(state.totalTime * 3);
    ctx.save();
    ctx.globalAlpha = done ? 0.95 : 0.45;
    ctx.fillStyle = PALETTE.exit;
    ctx.beginPath();
    ctx.arc(state.exit.x, state.exit.y, 26 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0d18';
    ctx.font = 'bold 15px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', state.exit.x, state.exit.y - 1);
    ctx.restore();
    ctx.fillStyle = done ? PALETTE.exit : PALETTE.muted;
    ctx.font = 'bold 12px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(done ? 'GETAWAY OPEN' : 'LOCKED — GRAB ALL LOOT', state.exit.x, state.exit.y - 40);
  }

  function drawLoot(state) {
    for (const l of state.loot) {
      if (l.taken) continue;
      const pulse = 0.7 + 0.3 * Math.sin(state.totalTime * 4 + l.x);
      ctx.save();
      ctx.globalAlpha = pulse;
      const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 42);
      g.addColorStop(0, 'rgba(255,217,74,0.55)');
      g.addColorStop(1, 'rgba(255,217,74,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // A small gold pedestal under each piece, so it reads as on display.
      ctx.fillStyle = '#3a2f14';
      ctx.fillRect(l.x - 17, l.y - 9, 34, 20);
      ctx.strokeStyle = PALETTE.caseFrame;
      ctx.lineWidth = 2;
      ctx.strokeRect(l.x - 17, l.y - 9, 34, 20);
      // Gem: a faceted diamond.
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 13);
      ctx.lineTo(l.x + 11, l.y);
      ctx.lineTo(l.x, l.y + 13);
      ctx.lineTo(l.x - 11, l.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff8d6';
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 13);
      ctx.lineTo(l.x + 5, l.y - 2);
      ctx.lineTo(l.x - 5, l.y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(l.name.toUpperCase(), l.x, l.y + 30);
      ctx.fillStyle = PALETTE.loot;
      ctx.fillText(`$${l.value.toLocaleString()}`, l.x, l.y + 44);
    }
  }

  function drawCones(state) {
    for (const g of state.guards) {
      const color = g.mode === 'hunt' ? PALETTE.coneHunt : g.mode === 'suspect' ? PALETTE.coneSuspect : PALETTE.cone;
      const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, 205);
      grad.addColorStop(0, color + '55');
      grad.addColorStop(1, color + '08');
      ctx.fillStyle = grad;
      conePath(ctx, g.x, g.y, g.angle, 205, 0.56);
      ctx.fill();
    }
    for (const c of state.cameras) {
      if (c.disabled > 0) continue;
      const grad = ctx.createRadialGradient(c.x, c.y, 8, c.x, c.y, 235);
      grad.addColorStop(0, 'rgba(255,90,90,0.34)');
      grad.addColorStop(1, 'rgba(255,90,90,0.03)');
      ctx.fillStyle = grad;
      conePath(ctx, c.x, c.y, c.angle, 235, 0.42);
      ctx.fill();
    }
  }

  function drawGuards(state) {
    for (const g of state.guards) {
      // Shadow.
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y + 12, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Body.
      ctx.fillStyle = '#55648f';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.guard;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Flashlight direction.
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x + Math.cos(g.angle) * 12, g.y + Math.sin(g.angle) * 12);
      ctx.lineTo(g.x + Math.cos(g.angle) * 22, g.y + Math.sin(g.angle) * 22);
      ctx.stroke();
      // Face.
      ctx.fillStyle = '#f2c9a0';
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.angle) * 5, g.y + Math.sin(g.angle) * 5, 5, 0, Math.PI * 2);
      ctx.fill();
      if (g.mode !== 'patrol') {
        ctx.fillStyle = g.mode === 'hunt' ? '#ff2e2e' : '#ff9a2e';
        ctx.font = 'bold 20px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(g.mode === 'hunt' ? '!' : '?', g.x, g.y - 22);
      }
    }
    // Cameras on the wall.
    for (const c of state.cameras) {
      ctx.fillStyle = c.disabled > 0 ? '#3a4258' : '#20263c';
      ctx.fillRect(c.x - 9, c.y - 7, 18, 14);
      ctx.fillStyle = c.disabled > 0 ? '#5a6a8a' : '#ff5a5a';
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12, 4, 0, Math.PI * 2);
      ctx.fill();
      if (c.disabled > 0) {
        ctx.fillStyle = PALETTE.muted;
        ctx.font = 'bold 10px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('OFF', c.x, c.y + 24);
      }
    }
  }

  function drawThief(state) {
    const t = state.thief;
    const bob = t.moving ? Math.sin(t.stepPhase) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + 12, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (t.sneak) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(126,231,199,0.7)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Hooded figure.
    ctx.fillStyle = PALETTE.thiefDark;
    ctx.beginPath();
    ctx.arc(t.x, t.y + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.thief;
    ctx.beginPath();
    ctx.arc(t.x, t.y + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0d18';
    ctx.beginPath();
    ctx.arc(t.x + Math.cos(t.angle) * 4, t.y + Math.sin(t.angle) * 4 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('KESTREL', t.x, t.y - 22 + bob);
  }

  function drawEffects(state) {
    for (const s of state.smokes) {
      ctx.fillStyle = `rgba(180,190,210,${0.35 * (s.timer / 3.5)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const c of state.coins) {
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,217,74,0.5)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 12 + (1.2 - c.timer) * 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawLighting(state) {
    lctx.clearRect(0, 0, FIELD.width, FIELD.height);
    lctx.fillStyle = 'rgba(4,6,16,0.48)';
    lctx.fillRect(0, 0, FIELD.width, FIELD.height);
    lctx.globalCompositeOperation = 'destination-out';
    function hole(x, y, r, strength) {
      const g = lctx.createRadialGradient(x, y, 4, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${strength})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(x, y, r, 0, Math.PI * 2);
      lctx.fill();
    }
    hole(state.thief.x, state.thief.y, 250, 0.95);
    hole(state.exit.x, state.exit.y, 100, 0.7);
    for (const l of state.loot) if (!l.taken) hole(l.x, l.y, 100, 0.6);
    for (const g of state.guards) hole(g.x, g.y, 70, 0.45);
    lctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(light, 0, 0);
  }

  function alarmColor(a) {
    if (a < 40) return PALETTE.alarmLow;
    if (a < 75) return PALETTE.alarmMid;
    return PALETTE.alarmHigh;
  }

  function drawHUD(state, screen) {
    // Top bar.
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, 64);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(0, 64, FIELD.width, 2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.loot;
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText('HIGH STAKES', 18, 22);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '12px ' + FONT;
    ctx.fillText(`Floor ${state.level + 1} of 3 — ${['THE GAMING HALL', 'THE HIGH-ROLLER SUITE', 'THE ROOFTOP GETAWAY'][state.level]}`, 18, 46);

    // Loot tally, centre.
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText(`$${state.score.toLocaleString()}`, 640, 22);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '12px ' + FONT;
    ctx.fillText(`LOOT ${state.lootTaken}/${state.lootTotal}  •  ${Math.floor(state.totalTime / 60)}:${String(Math.floor(state.totalTime % 60)).padStart(2, '0')}`, 640, 46);

    // Alarm meter, right.
    const ax = 1000;
    ctx.textAlign = 'left';
    ctx.fillStyle = state.spotted ? '#ff3b30' : PALETTE.text;
    ctx.font = 'bold 13px ' + FONT;
    ctx.fillText(state.spotted ? '⚠ SPOTTED' : 'ALARM', ax, 20);
    ctx.fillStyle = '#232a42';
    ctx.fillRect(ax, 30, 220, 16);
    ctx.fillStyle = alarmColor(state.alarm);
    ctx.fillRect(ax, 30, 220 * (state.alarm / 100), 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(ax, 30, 220, 16);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillText(`${Math.round(state.alarm)}%`, ax + 228, 38);

    // Bottom bar: tools + objective.
    ctx.fillStyle = 'rgba(20,24,40,0.92)';
    ctx.fillRect(0, FIELD.height - 34, FIELD.width, 34);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px ' + FONT;
    ctx.textAlign = 'left';
    const tools = `Q Coin ×${state.tools.coins}    F Smoke ×${state.tools.smoke}    R EMP ×${state.tools.emp}    Shift Sneak    E Grab    P Pause`;
    ctx.fillText(tools, 16, FIELD.height - 17);
    ctx.textAlign = 'right';
    const objective = state.lootTaken >= state.lootTotal ? 'All loot grabbed — reach the green EXIT!' : `Grab the loot (${state.lootTaken}/${state.lootTotal}), dodge the cones, reach the EXIT.`;
    ctx.fillStyle = PALETTE.loot;
    ctx.fillText(objective, FIELD.width - 16, FIELD.height - 17);

    if (state.messageTimer > 0 && state.message) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10,13,24,0.85)';
      const w = ctx.measureText(state.message).width + 36;
      ctx.fillRect(640 - w / 2, 84, w, 32);
      ctx.fillStyle = PALETTE.loot;
      ctx.font = 'bold 14px ' + FONT;
      ctx.fillText(state.message, 640, 100);
    }
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(8,10,20,0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 54px ' + FONT;
    ctx.fillText(title, 640, 250);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px ' + FONT;
    lines.forEach((line, i) => ctx.fillText(line, 640, 310 + i * 32));
  }

  function draw(state, screen, best) {
    fit();
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawFloor(state);
    drawExit(state);
    drawLoot(state);
    drawCones(state);
    drawGuards(state);
    drawThief(state);
    drawEffects(state);
    drawLighting(state);
    drawHUD(state, screen);

    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(8,10,20,0.60)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.loot;
      ctx.font = 'bold 64px ' + FONT;
      ctx.fillText('HIGH STAKES', 640, 210);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '22px ' + FONT;
      ctx.fillText('The Aurum Casino Heist — one thief, one casino, one night.', 640, 258);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '16px ' + FONT;
      ctx.fillText('Kestrel slips past guards and cameras to lift the Aurum collection.', 640, 292);
      ctx.fillText('Grab every piece of loot, then reach the green EXIT before the alarm hits 100%.', 640, 318);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '15px ' + FONT;
      ctx.fillText('WASD / Arrows — move    Shift — sneak    Q — toss a coin    F — smoke    R — EMP the cameras', 640, 380);
      ctx.fillText('Click — throw a coin where you point    E — grab    P — pause    M — mute', 640, 408);
      ctx.fillStyle = PALETTE.loot;
      ctx.font = 'bold 20px ' + FONT;
      ctx.fillText('Press ENTER or click to begin the heist', 640, 470);
      if (best > 0) {
        ctx.fillStyle = PALETTE.muted;
        ctx.font = '15px ' + FONT;
        ctx.fillText(`Best take so far: $${best.toLocaleString()}`, 640, 505);
      }
    } else if (screen === SCREEN_PAUSED) {
      panel('PAUSED', ['Take a breath, Kestrel. The guards keep patrolling.', 'Press P or ENTER to slip back into the dark.'], PALETTE.text);
    } else if (screen === SCREEN_OVER) {
      panel('CAUGHT!', [
        `Casino security closed in. Take: $${state.score.toLocaleString()}`,
        `Loot grabbed: ${state.lootTaken}/${state.lootTotal} — Floor ${state.level + 1}`,
        'Press ENTER to try the heist again.',
      ], '#ff3b30');
    } else if (screen === SCREEN_WIN) {
      panel('CLEAN GETAWAY!', [
        `The whole Aurum collection is yours: $${state.score.toLocaleString()}`,
        `Finished in ${Math.floor(state.totalTime / 60)}:${String(Math.floor(state.totalTime % 60)).padStart(2, '0')} — best take $${Math.max(best, state.score).toLocaleString()}`,
        'Press ENTER to run it again.',
      ], PALETTE.loot);
    }
  }

  return { draw, fit };
}
