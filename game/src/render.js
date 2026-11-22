// GILDED HOUR — rendering: the casino floor, cones, thieves, HUD and screens.
// One job: draw the world on the canvas. Reads world state, never changes it.

import { CAMERA, GUARD, HUD_H, PALETTE, TILE, VIEW_W, VIEW_H } from './config.js';
import { conePolygon } from './vision.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function tileCentre(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: HUD_H + (ty + 0.5) * TILE };
}

function worldToScreen(x, y) {
  return { x, y: y + HUD_H };
}

function drawCone(ctx, map, x, y, facing, range, halfAngle, fill) {
  const poly = conePolygon(map, x, y, facing, range, halfAngle);
  const s0 = worldToScreen(poly[0].x, poly[0].y);
  ctx.beginPath();
  ctx.moveTo(s0.x, s0.y);
  for (let i = 1; i < poly.length; i += 1) {
    const s = worldToScreen(poly[i].x, poly[i].y);
    ctx.lineTo(s.x, s.y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function coneFillForGuard(guard, alarmTripped) {
  if (alarmTripped || guard.state === 'chase') return PALETTE.coneChase;
  if (guard.state === 'investigate' || guard.state === 'search' || guard.alertness > 40) {
    return PALETTE.coneSuspicious;
  }
  return PALETTE.coneCalm;
}

export function drawFloor(ctx, world) {
  const { map } = world;
  for (let ty = 0; ty < map.length; ty += 1) {
    for (let tx = 0; tx < map[0].length; tx += 1) {
      const ch = map[ty][tx];
      const x = tx * TILE;
      const y = HUD_H + ty * TILE;
      const checker = (tx + ty) % 2 === 0;
      if (ch === '#') {
        ctx.fillStyle = PALETTE.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = PALETTE.wallTop;
        ctx.fillRect(x, y, TILE, 5);
        ctx.strokeStyle = 'rgba(201,162,39,0.25)';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        continue;
      }
      // Marble floor, alternating shades, with a thin gold grout line.
      ctx.fillStyle = checker ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = 'rgba(201,162,39,0.08)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      if (ch === ':') {
        ctx.fillStyle = PALETTE.carpet;
        ctx.fillRect(x + 3, y, TILE - 6, TILE);
        ctx.fillStyle = PALETTE.carpetTrim;
        ctx.fillRect(x + 3, y, TILE - 6, 2);
        ctx.fillRect(x + 3, y + TILE - 2, TILE - 6, 2);
      }
      if (ch === 'D') {
        // Doorway: gold frame across the opening.
        ctx.fillStyle = PALETTE.goldDim;
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
        ctx.fillStyle = 'rgba(232,193,90,0.25)';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
      }
      if (ch === 'H') {
        // Curtain alcove: deep red drapes the thief can hide behind.
        ctx.fillStyle = PALETTE.curtain;
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = 'rgba(242,232,201,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 4);
        ctx.lineTo(x + 10, y + TILE - 4);
        ctx.moveTo(x + 20, y + 4);
        ctx.lineTo(x + 20, y + TILE - 4);
        ctx.moveTo(x + 30, y + 4);
        ctx.lineTo(x + 30, y + TILE - 4);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
  }
}

function drawFurniture(ctx, world) {
  const { map } = world;
  for (let ty = 0; ty < map.length; ty += 1) {
    for (let tx = 0; tx < map[0].length; tx += 1) {
      const ch = map[ty][tx];
      const x = tx * TILE;
      const y = HUD_H + ty * TILE;
      if (ch === 'T') {
        ctx.fillStyle = PALETTE.felt;
        roundRect(ctx, x + 3, y + 3, TILE - 6, TILE - 6, 10);
        ctx.fill();
        ctx.strokeStyle = PALETTE.feltTrim;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(242,232,201,0.75)';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.gold;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch === 'S') {
        ctx.fillStyle = PALETTE.safe;
        roundRect(ctx, x + 4, y + 4, TILE - 8, TILE - 8, 4);
        ctx.fill();
        ctx.strokeStyle = PALETTE.safeTrim;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = PALETTE.gold;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = PALETTE.gold;
        ctx.fillRect(x + TILE / 2 - 1, y + TILE / 2 - 6, 2, 6);
      } else if (ch === 'P') {
        ctx.fillStyle = PALETTE.pot;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 + 8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.plant;
        for (let i = 0; i < 5; i += 1) {
          const a = (i / 5) * Math.PI * 2 + 0.4;
          ctx.beginPath();
          ctx.ellipse(x + TILE / 2 + Math.cos(a) * 9, y + TILE / 2 - 4 + Math.sin(a) * 8, 8, 5, a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawPatrolPaths(ctx, world) {
  ctx.strokeStyle = 'rgba(242,232,201,0.22)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 7]);
  world.guards.forEach((g) => {
    ctx.beginPath();
    g.waypoints.forEach((wp, i) => {
      const c = tileCentre(wp[0], wp[1]);
      if (i === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.closePath();
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

function drawLoot(ctx, world, time) {
  world.loot.forEach((l) => {
    if (l.taken) return;
    const s = worldToScreen(l.x, l.y);
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + l.tx);
    ctx.fillStyle = `rgba(255, 217, 77, ${0.4 * pulse})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 18 + 3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    // A gold chip stack.
    ctx.fillStyle = '#8a6d1f';
    ctx.fillRect(s.x - 9, s.y - 4, 18, 9);
    ctx.fillStyle = PALETTE.loot;
    ctx.fillRect(s.x - 9, s.y - 6, 18, 5);
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(s.x - 2, s.y - 6, 4, 5);
  });
  // The star loot: a glowing pedestal with the named prize.
  if (!world.star.taken) {
    const s = worldToScreen(world.star.x, world.star.y);
    const pulse = 0.7 + 0.3 * Math.sin(time * 4);
    ctx.fillStyle = `rgba(255, 93, 143, ${0.30 * pulse})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 24 + 4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d4457';
    ctx.fillRect(s.x - 11, s.y + 2, 22, 12);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(s.x - 11, s.y + 2, 22, 12);
    ctx.lineWidth = 1;
    // A cut gem.
    ctx.fillStyle = PALETTE.star;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 12);
    ctx.lineTo(s.x + 9, s.y - 2);
    ctx.lineTo(s.x, s.y + 4);
    ctx.lineTo(s.x - 9, s.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(s.x - 3, s.y - 9);
    ctx.lineTo(s.x + 2, s.y - 4);
    ctx.lineTo(s.x - 2, s.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.heist.targetName.toUpperCase(), s.x, s.y + 30);
  }
}

function drawExit(ctx, world) {
  const s = worldToScreen(world.exit.x, world.exit.y);
  const open = world.exitOpen;
  ctx.fillStyle = open ? PALETTE.exitOpen : PALETTE.exitLocked;
  ctx.globalAlpha = 0.25 + (open ? 0.15 * Math.sin(performance.now() / 300) : 0);
  ctx.beginPath();
  ctx.arc(s.x, s.y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#20263f';
  ctx.fillRect(s.x - 14, s.y - 14, 28, 28);
  ctx.strokeStyle = open ? PALETTE.exitOpen : PALETTE.exitLocked;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(s.x - 14, s.y - 14, 28, 28);
  ctx.lineWidth = 1;
  ctx.strokeStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - 14);
  ctx.lineTo(s.x, s.y + 14);
  ctx.stroke();
  ctx.fillStyle = open ? PALETTE.exitOpen : '#e8e0c0';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', s.x, s.y - 20);
}

function drawSmoke(ctx, world) {
  world.smokeClouds.forEach((c) => {
    const s = worldToScreen(c.x, c.y);
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, c.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,220,225,0.35)';
    ctx.beginPath();
    ctx.arc(s.x - 30, s.y - 15, c.radius * 0.45, 0, Math.PI * 2);
    ctx.arc(s.x + 25, s.y + 18, c.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCoins(ctx, world) {
  world.coins.forEach((coin) => {
    const s = worldToScreen(coin.x, coin.y);
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6d1f';
    ctx.stroke();
    if (coin.landed) {
      ctx.strokeStyle = 'rgba(255,217,77,0.7)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawGuards(ctx, world, time) {
  world.guards.forEach((g) => {
    const s = worldToScreen(g.x, g.y);
    // Vision cone first, so bodies draw over it.
    drawCone(ctx, world.map, g.x, g.y, g.facing, GUARD.visionRange,
      GUARD.visionHalfAngle, coneFillForGuard(g, world.alarmTripped));
    // Body: navy uniform with gold trim, facing wedge.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = PALETTE.guardTrim;
    ctx.beginPath();
    ctx.moveTo(s.x + Math.cos(g.facing) * 13, s.y + Math.sin(g.facing) * 13);
    ctx.lineTo(s.x + Math.cos(g.facing + 2.6) * 8, s.y + Math.sin(g.facing + 2.6) * 8);
    ctx.lineTo(s.x + Math.cos(g.facing - 2.6) * 8, s.y + Math.sin(g.facing - 2.6) * 8);
    ctx.closePath();
    ctx.fill();
    // Alertness arc above the guard.
    if (g.alertness > 2) {
      ctx.strokeStyle = g.alertness > 70 ? PALETTE.alarmRed : PALETTE.alarmAmber;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 18, -Math.PI / 2, -Math.PI / 2 + (g.alertness / 100) * Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    // State mark: ! when chasing, ? when investigating or searching.
    if (g.state === 'chase') {
      ctx.fillStyle = PALETTE.alarmRed;
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', s.x, s.y - 22);
    } else if (g.state === 'investigate' || g.state === 'search') {
      ctx.fillStyle = PALETTE.alarmAmber;
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', s.x, s.y - 22);
    }
    void time;
  });
}

function drawCameras(ctx, world, time) {
  world.cameras.forEach((cam) => {
    const s = worldToScreen(cam.x, cam.y);
    const offline = cam.offlineSec > 0;
    const alert = cam.alertness > 60;
    if (!offline) {
      drawCone(ctx, world.map, cam.x, cam.y, cam.angle, CAMERA.visionRange,
        CAMERA.visionHalfAngle, alert ? PALETTE.coneCameraAlert : PALETTE.coneCamera);
    }
    // Wall mount + lens.
    ctx.fillStyle = '#20263f';
    ctx.fillRect(s.x - 9, s.y - 9, 18, 18);
    ctx.strokeStyle = offline ? '#666' : PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x - 9, s.y - 9, 18, 18);
    ctx.lineWidth = 1;
    ctx.fillStyle = offline ? '#555' : (alert ? PALETTE.alarmRed : '#ff5d5d');
    ctx.beginPath();
    ctx.arc(s.x + Math.cos(cam.angle) * 6, s.y + Math.sin(cam.angle) * 6, 4, 0, Math.PI * 2);
    ctx.fill();
    // Blinking status light.
    if (!offline && Math.sin(time * 5 + cam.id) > 0) {
      ctx.fillStyle = PALETTE.alarmRed;
      ctx.beginPath();
      ctx.arc(s.x - 6, s.y - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (offline) {
      ctx.fillStyle = '#cfd3e0';
      ctx.font = 'bold 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFFLINE', s.x, s.y - 14);
    } else if (cam.alertness > 2) {
      ctx.strokeStyle = PALETTE.alarmRed;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 14, -Math.PI / 2, -Math.PI / 2 + (cam.alertness / 100) * Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  });
}

function drawPlayer(ctx, world, time) {
  const p = world.player;
  const s = worldToScreen(p.x, p.y);
  const hidden = world.tileAtPlayer() === 'H'
    || world.smokeClouds.some((c) => Math.hypot(p.x - c.x, p.y - c.y) < c.radius);
  // Noise ring while moving loud.
  if (p.moving && p.stance === 'sprint') {
    ctx.strokeStyle = 'rgba(242,232,201,0.35)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 34 + 4 * Math.sin(time * 6), 0, Math.PI * 2);
    ctx.stroke();
  } else if (p.moving && p.stance === 'walk') {
    ctx.strokeStyle = 'rgba(242,232,201,0.15)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: burgundy coat, black mask band, gold clasp. A faint gold ring
  // keeps the thief readable at a glance, even shrunk on a contact sheet.
  const r = p.stance === 'sneak' ? 12 : 15;
  ctx.fillStyle = 'rgba(232, 193, 90, 0.30)';
  ctx.beginPath();
  ctx.arc(s.x, s.y, r + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
  // Mask band across the facing direction.
  ctx.strokeStyle = '#12060a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(s.x + Math.cos(p.facing + 1.35) * (r - 2), s.y + Math.sin(p.facing + 1.35) * (r - 2));
  ctx.lineTo(s.x + Math.cos(p.facing - 1.35) * (r - 2), s.y + Math.sin(p.facing - 1.35) * (r - 2));
  ctx.stroke();
  ctx.lineWidth = 1;
  // Facing tick.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(s.x + Math.cos(p.facing) * (r + 2), s.y + Math.sin(p.facing) * (r + 2), 2.5, 0, Math.PI * 2);
  ctx.fill();
  if (hidden) {
    ctx.fillStyle = 'rgba(242,232,201,0.9)';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', s.x, s.y - r - 8);
  }
  // Stance label.
  if (p.moving || p.stance !== 'walk') {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    const label = p.stance === 'sneak' ? 'SNEAKING' : (p.stance === 'sprint' ? 'SPRINTING' : '');
    if (label) ctx.fillText(label, s.x, s.y + r + 13);
  }
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.55, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.9,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(4,6,16,0.32)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
}

export function drawHUD(ctx, world) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = PALETTE.hudTrim;
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'left';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(`GILDED HOUR — Heist ${world.heist.number}/3: ${world.heist.name}`, 14, 26);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`Steal ${world.heist.targetName}, then reach the elevator`, 14, 46);
  // Alarm meter, centre.
  const ax = 470;
  const ay = 16;
  const aw = 260;
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, ay + 11);
  ctx.fillStyle = '#0a0e1e';
  ctx.fillRect(ax + 58, ay, aw, 16);
  const alarmColor = world.alarmTripped ? PALETTE.alarmRed
    : (world.alarm > 55 ? PALETTE.alarmAmber : PALETTE.alarmGreen);
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax + 58, ay, Math.max(0, Math.min(aw, (world.alarm / 100) * aw)), 16);
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(ax + 58.5, ay + 0.5, aw, 16);
  if (world.alarmTripped) {
    ctx.fillStyle = PALETTE.alarmRed;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('!! ALARM !!', ax + 58, ay + 34);
  } else {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '11px Georgia, serif';
    ctx.fillText(`${Math.round(world.alarm)} / 100`, ax + 58, ay + 33);
  }
  // Right block: loot, lives, gadgets, score, timer.
  const rx = 845;
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px Georgia, serif';
  const starMark = world.star.taken ? '★' : '☆';
  ctx.fillText(`◆ ${world.lootTaken}/${world.loot.length}  ${starMark} ${world.star.taken ? 'taken' : world.heist.targetName}`, rx, 24);
  ctx.fillStyle = PALETTE.alarmRed;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('♥'.repeat(Math.max(0, world.lives)) + '♡'.repeat(Math.max(0, 3 - world.lives)), rx, 46);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px Georgia, serif';
  ctx.fillText(`1 Smoke ×${world.gadgets.smoke}   2 EMP ×${world.gadgets.emp}   3 Coin ×${world.gadgets.coin}`, rx, 66);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`Score ${world.totalScore}`, VIEW_W - 14, 24);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px Georgia, serif';
  const mm = Math.floor(world.timeSec / 60);
  const ss = Math.floor(world.timeSec % 60).toString().padStart(2, '0');
  ctx.fillText(`${mm}:${ss}`, VIEW_W - 14, 46);
  ctx.fillText('Shift sprint · C sneak · 1/2/3 gadgets · H help', VIEW_W - 14, 66);
  ctx.textAlign = 'left';
}

function drawToasts(ctx, world) {
  ctx.textAlign = 'left';
  let y = HUD_H + 18;
  world.events.slice(-3).forEach((e) => {
    const color = e.type === 'alarm' ? PALETTE.alarmRed
      : (e.type === 'star' ? PALETTE.star : (e.type === 'gadget' ? PALETTE.gold : PALETTE.text));
    ctx.font = 'bold 14px Georgia, serif';
    const w = ctx.measureText(e.text).width + 18;
    ctx.fillStyle = 'rgba(10,14,30,0.78)';
    roundRect(ctx, 12, y - 15, w, 22, 6);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(e.text, 21, y + 1);
    y += 28;
  });
}

function dimScreen(ctx, alpha = 0.72) {
  ctx.fillStyle = `rgba(6,8,18,${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(ctx, title, lines, footer) {
  const w = 640;
  const h = 150 + lines.length * 26 + (footer ? 40 : 0);
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = '#141a33';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, y + 44);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '15px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, y + 82 + i * 26);
  });
  if (footer) {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '13px Georgia, serif';
    ctx.fillText(footer, VIEW_W / 2, y + h - 22);
  }
}

export function drawGame(ctx, world, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0a0e1e';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (world.state === 'title') {
    drawTitle(ctx, world, time);
    return;
  }
  drawFloor(ctx, world);
  drawPatrolPaths(ctx, world);
  drawLoot(ctx, world, time);
  drawExit(ctx, world);
  drawSmoke(ctx, world);
  drawCoins(ctx, world);
  drawFurniture(ctx, world);
  drawCameras(ctx, world, time);
  drawGuards(ctx, world, time);
  drawPlayer(ctx, world, time);
  drawVignette(ctx);
  drawHUD(ctx, world);
  drawToasts(ctx, world);

  if (world.caughtFlash > 0) {
    ctx.fillStyle = `rgba(220,40,40,${0.25 * world.caughtFlash})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (world.alarmTripped) {
    const pulse = 0.05 + 0.03 * Math.sin(time * 6);
    ctx.strokeStyle = `rgba(229,72,77,${pulse + 0.25})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, HUD_H + 3, VIEW_W - 6, VIEW_H - HUD_H - 6);
    ctx.lineWidth = 1;
  }

  if (world.state === 'paused') {
    dimScreen(ctx, 0.6);
    panel(ctx, 'PAUSED', ['The crew waits in the dark.'], 'Press P to keep moving');
  } else if (world.state === 'caught') {
    dimScreen(ctx, 0.55);
    panel(ctx, 'SPOTTED!', [
      `A guard caught you. ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left.`,
      'Back to the entrance — the plan is not over.',
    ], 'Press Enter to slip back in');
  } else if (world.state === 'clear') {
    const c = world.clearScore;
    dimScreen(ctx, 0.6);
    panel(ctx, `${world.heist.name} — CLEAN GETAWAY`, [
      `Loot: ${c.lootTaken}/${c.lootTotal} treasures · ${world.heist.targetName} stolen`,
      `Time ${Math.floor(c.timeSec / 60)}:${String(c.timeSec % 60).padStart(2, '0')} — time bonus +${c.timeBonus}`,
      c.ghost > 0 ? `Ghost bonus +${c.ghost} — the alarm never sounded` : 'The alarm sounded — no ghost bonus',
      `Gadgets saved +${c.unused} · Heist score +${c.heistScore}`,
      `Total score ${c.totalScore}`,
    ], 'Press Enter for the next heist');
  } else if (world.state === 'gameover') {
    dimScreen(ctx, 0.72);
    panel(ctx, 'BUSTED', [
      'The crew is in cuffs. The Gilded Hour keeps its gold.',
      `Final score ${world.totalScore}`,
    ], 'Press Enter to plan the heist again');
  } else if (world.state === 'victory') {
    dimScreen(ctx, 0.6);
    panel(ctx, 'THE GILDED HOUR IS YOURS', [
      'Three heists. Three prizes. The crew vanishes into the night.',
      `${world.heist.targetName} and every treasure before it — all yours.`,
      `Final score ${world.totalScore}`,
    ], 'Press Enter to run it all again');
  }
}

function drawTitle(ctx, world, time) {
  // A dimmed casino floor behind the title, with one guard cone sweeping.
  drawFloor(ctx, world);
  drawPatrolPaths(ctx, world);
  drawLoot(ctx, world, time);
  drawExit(ctx, world);
  drawCameras(ctx, world, time);
  drawGuards(ctx, world, time);
  drawVignette(ctx);
  dimScreen(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText('GILDED HOUR', VIEW_W / 2, 190);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('steal the Crimson Ledger — 3 heists, 14 guards, 28 treasures, 3 gadgets', VIEW_W / 2, 228);
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = PALETTE.textDim;
  const lines = [
    'Heist 1 · The Gilded Lobby — steal The Sapphire Chip',
    'Heist 2 · The Vault Floor — steal The Crimson Ledger',
    'Heist 3 · The Penthouse Suite — steal The Star of Marlow',
    '',
    'WASD / arrows — move · Shift — sprint (loud) · C — sneak (quiet)',
    '1 Ghost Smoke · 2 EMP Pulse · 3 / click Coin Toss · P pause · M mute',
    'Read the cones before you move. The elevator opens once the star loot is yours.',
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 300 + i * 26);
  });
  if (Math.sin(time * 3) > -0.2) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('— Press Enter to start the first heist —', VIEW_W / 2, 560);
  }
  drawHUD(ctx, world);
}
