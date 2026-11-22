// GILDED HOUR — the world: one heist's live state, rules and scoring.
// One job: own the player, loot, alarm, gadgets, lives and win/lose flow.
// Pure logic (no canvas, no AudioContext) so Node smoke tests can drive it.

import {
  BLOCKS_MOVE, DETECTION, GADGETS, NOISE, SCORING, SPEEDS, START_LIVES, TILE,
} from './config.js';
import { HEISTS, parseHeistMap } from './heists.js';
import { makeGuard, updateGuard, guardCatchesPlayer } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { angleDiff } from './vision.js';

export const GAME_STATES = ['title', 'playing', 'paused', 'caught', 'clear', 'gameover', 'victory'];

export class World {
  constructor() {
    this.heistIndex = 0;
    this.totalScore = 0;
    this.lives = START_LIVES;
    this.alarmEverTripped = false; // across the whole run, for the ghost bonus
    this.heistAlarmTripped = false;
    this.state = 'title';
    this.events = []; // { type, text, time } — the renderer's toast feed
    this.sounds = []; // { name } — main.js turns these into WebAudio
    this.loadHeist(0);
  }

  loadHeist(index) {
    this.heistIndex = index;
    this.heist = HEISTS[index];
    this.map = this.heist.map;
    const parsed = parseHeistMap(this.heist);
    this.loot = parsed.loot.map((l) => ({ ...l, x: (l.tx + 0.5) * TILE, y: (l.ty + 0.5) * TILE }));
    this.star = { ...parsed.star, x: (parsed.star.tx + 0.5) * TILE, y: (parsed.star.ty + 0.5) * TILE };
    this.exit = { ...parsed.exit, x: (parsed.exit.tx + 0.5) * TILE, y: (parsed.exit.ty + 0.5) * TILE };
    this.playerSpawn = { x: (parsed.player.tx + 0.5) * TILE, y: (parsed.player.ty + 0.5) * TILE };
    this.player = {
      x: this.playerSpawn.x,
      y: this.playerSpawn.y,
      facing: -Math.PI / 2,
      stance: 'walk', // sneak | walk | sprint
      stanceMultiplier: 1,
      moving: false,
      speed: 0,
    };
    this.guards = this.heist.guards.map((g, i) => makeGuard(g, i));
    this.cameras = this.heist.cameras.map((c, i) => makeCamera(c, i));
    this.alarm = 0;
    this.alarmTripped = false;
    this.alarmQuietSec = 0;
    this.exitOpen = false;
    this.lootTaken = 0;
    this.timeSec = 0;
    this.gadgets = {
      smoke: GADGETS.smoke.perHeist,
      emp: GADGETS.emp.perHeist,
      coin: GADGETS.coin.perHeist,
    };
    this.smokeClouds = [];
    this.coins = []; // flying / landed coins: { x, y, tx, ty, t, landed }
    this.noiseEvent = null;
    this.caughtFlash = 0;
    this.clearScore = null;
    this.onGuardSpotted = () => {};
    this.onCameraSpotted = () => {};
  }

  // --- Map helpers -------------------------------------------------------
  tileAtPixel(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.map[0].length || ty >= this.map.length) return '#';
    return this.map[ty][tx];
  }

  tileAtPlayer() {
    return this.tileAtPixel(this.player.x, this.player.y);
  }

  isWalkableCircle(x, y, radius = 13) {
    // A circle may stand here when none of the tiles its box touches blocks.
    const x0 = Math.floor((x - radius) / TILE);
    const x1 = Math.floor((x + radius) / TILE);
    const y0 = Math.floor((y - radius) / TILE);
    const y1 = Math.floor((y + radius) / TILE);
    for (let ty = y0; ty <= y1; ty += 1) {
      for (let tx = x0; tx <= x1; tx += 1) {
        if (BLOCKS_MOVE.has(this.tileAtPixel(tx * TILE + TILE / 2, ty * TILE + TILE / 2))) return false;
      }
    }
    return true;
  }

  // --- Events / sounds ----------------------------------------------------
  toast(text, kind = 'info') {
    this.events.push({ type: kind, text, time: this.timeSec });
    if (this.events.length > 5) this.events.shift();
  }

  play(name) {
    this.sounds.push({ name });
  }

  // --- Player -------------------------------------------------------------
  movePlayer(input, dt) {
    const p = this.player;
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    p.moving = mx !== 0 || my !== 0;
    p.stance = input.sneak ? 'sneak' : (input.sprint ? 'sprint' : 'walk');
    p.stanceMultiplier = p.stance === 'sneak'
      ? 0.45 : (p.stance === 'sprint' ? 1.7 : 1.0);
    if (!p.moving) return;
    const len = Math.hypot(mx, my);
    const speed = p.stance === 'sneak' ? SPEEDS.sneak : (p.stance === 'sprint' ? SPEEDS.sprint : SPEEDS.walk);
    p.speed = speed;
    const step = speed * dt;
    const nx = p.x + (mx / len) * step;
    const ny = p.y + (my / len) * step;
    if (this.isWalkableCircle(nx, p.y)) p.x = nx;
    if (this.isWalkableCircle(p.x, ny)) p.y = ny;
    p.facing = Math.atan2(my, mx);
    // Noise: sprinting is loud, walking is a murmur, sneaking is silent.
    const radius = NOISE[p.stance];
    if (radius > 0) {
      this.noiseEvent = { x: p.x, y: p.y, radius, time: this.timeSec };
    }
  }

  // --- Gadgets ------------------------------------------------------------
  useGadget(kind, targetX = null, targetY = null) {
    if (this.state !== 'playing') return false;
    if (this.gadgets[kind] <= 0) {
      this.toast(`No ${GADGETS[kind].name} left`, 'warn');
      return false;
    }
    this.gadgets[kind] -= 1;
    if (kind === 'smoke') {
      this.smokeClouds.push({
        x: this.player.x, y: this.player.y,
        radius: GADGETS.smoke.radius, ttl: GADGETS.smoke.durationSec,
      });
      this.toast(`${GADGETS.smoke.name} — vanish in the smoke`, 'gadget');
      this.play('smoke');
    } else if (kind === 'emp') {
      this.cameras.forEach((c) => { c.offlineSec = GADGETS.emp.durationSec; });
      this.toast(`${GADGETS.emp.name} — every camera is dark`, 'gadget');
      this.play('emp');
    } else if (kind === 'coin') {
      const tx = targetX ?? this.player.x + Math.cos(this.player.facing) * 130;
      const ty = targetY ?? this.player.y + Math.sin(this.player.facing) * 130;
      const clamped = this.clampToFloor(tx, ty);
      this.coins.push({
        x: this.player.x, y: this.player.y,
        tx: clamped.x, ty: clamped.y, t: 0, landed: false,
      });
      this.play('coinThrow');
    }
    return true;
  }

  clampToFloor(x, y) {
    // Pull a target point onto the nearest walkable tile centre.
    let best = { x, y };
    let bestDist = Infinity;
    for (let ty = 0; ty < this.map.length; ty += 1) {
      for (let tx = 0; tx < this.map[0].length; tx += 1) {
        if (BLOCKS_MOVE.has(this.map[ty][tx])) continue;
        const cx = (tx + 0.5) * TILE;
        const cy = (ty + 0.5) * TILE;
        const d = Math.hypot(cx - x, cy - y);
        if (d < bestDist) { bestDist = d; best = { x: cx, y: cy }; }
      }
    }
    return best;
  }

  // --- Main update ---------------------------------------------------------
  update(input, dt) {
    if (this.state !== 'playing') return;
    this.timeSec += dt;
    this.noiseEvent = null;
    this.movePlayer(input, dt);

    // Smoke clouds fade.
    this.smokeClouds.forEach((c) => { c.ttl -= dt; });
    this.smokeClouds = this.smokeClouds.filter((c) => c.ttl > 0);

    // Coins fly, land, and lure nearby guards.
    this.coins.forEach((coin) => {
      if (!coin.landed) {
        coin.t += dt * 2.6;
        if (coin.t >= 1) {
          coin.t = 1;
          coin.landed = true;
          coin.x = coin.tx;
          coin.y = coin.ty;
          this.play('coinLand');
          this.guards.forEach((g) => {
            const d = Math.hypot(g.x - coin.x, g.y - coin.y);
            if (d < GADGETS.coin.lureRadius && (g.state === 'patrol' || g.state === 'scan')) {
              g.state = 'investigate';
              g.stateTime = 0;
              g.targetX = coin.x;
              g.targetY = coin.y;
            }
          });
        } else {
          coin.x = this.player.x + (coin.tx - this.player.x) * coin.t;
          coin.y = this.player.y + (coin.ty - this.player.y) * coin.t;
        }
      }
    });
    this.coins = this.coins.filter((c) => !(c.landed && this.timeSec - (c.landTime ?? this.timeSec) > 6));
    this.coins.forEach((c) => { if (c.landed && c.landTime === undefined) c.landTime = this.timeSec; });

    // Guards and cameras.
    this.guards.forEach((g) => updateGuard(g, this, dt));
    this.cameras.forEach((c) => updateCamera(c, this, dt));

    // Alarm meter: the worst watcher wins; it decays while nobody sees you.
    const worst = Math.max(
      0,
      ...this.guards.map((g) => g.alertness),
      ...this.cameras.map((c) => c.alertness),
    );
    if (worst > this.alarm) this.alarm = worst;
    else this.alarm = Math.max(0, this.alarm - DETECTION.alarmDecayPerSec * dt);

    if (this.alarm >= DETECTION.tripAt && !this.alarmTripped) {
      this.alarmTripped = true;
      this.heistAlarmTripped = true;
      this.alarmEverTripped = true;
      this.alarmQuietSec = 0;
      this.guards.forEach((g) => {
        if (g.state !== 'chase') { g.state = 'chase'; g.stateTime = 0; }
      });
      this.toast('ALARM! Every guard is coming for you', 'alarm');
      this.play('alarm');
    }
    if (this.alarmTripped) {
      const anyoneSees = this.guards.some((g) => g.state === 'chase')
        || this.cameras.some((c) => c.alertness > 60);
      this.alarmQuietSec = anyoneSees ? 0 : this.alarmQuietSec + dt;
      if (this.alarmQuietSec > DETECTION.alarmCooldownSec) {
        this.alarmTripped = false;
        this.alarm = 55;
        this.guards.forEach((g) => {
          if (g.state === 'chase') { g.state = 'search'; g.stateTime = 0; g.scanBase = g.facing; }
        });
        this.toast('The alarm dies down — they are searching, not chasing', 'info');
      }
    }

    // Loot pickup.
    this.loot.forEach((l) => {
      if (!l.taken && Math.hypot(l.x - this.player.x, l.y - this.player.y) < 28) {
        l.taken = true;
        this.lootTaken += 1;
        this.totalScore += SCORING.loot;
        this.play('pickup');
      }
    });
    if (!this.star.taken && Math.hypot(this.star.x - this.player.x, this.star.y - this.player.y) < 30) {
      this.star.taken = true;
      this.totalScore += SCORING.starLoot;
      this.exitOpen = true;
      this.toast(`${this.heist.targetName} is yours — get to the service elevator!`, 'star');
      this.play('star');
    }

    // Caught?
    const catcher = this.guards.find((g) => guardCatchesPlayer(g, this.player));
    if (catcher) {
      this.onCaught(catcher);
      return;
    }

    // Exit: the getaway.
    if (this.exitOpen && Math.hypot(this.exit.x - this.player.x, this.exit.y - this.player.y) < 30) {
      this.onHeistClear();
    }
  }

  onCaught(guard) {
    this.lives -= 1;
    this.play('caught');
    this.caughtFlash = 1;
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.toast('The crew is in cuffs. The Gilded Hour keeps its gold.', 'alarm');
      return;
    }
    this.state = 'caught';
    this.toast(`Spotted by guard ${guard.id + 1} — ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left`, 'alarm');
    // Respawn: thief back at the entrance, guards back on patrol, alarm eased.
    this.player.x = this.playerSpawn.x;
    this.player.y = this.playerSpawn.y;
    this.player.facing = -Math.PI / 2;
    this.alarm = 30;
    this.alarmTripped = false;
    this.guards.forEach((g) => {
      const [sx, sy] = g.waypoints[0];
      g.x = (sx + 0.5) * TILE;
      g.y = (sy + 0.5) * TILE;
      g.state = 'patrol';
      g.stateTime = 0;
      g.alertness = 0;
      g.waypointIndex = 0;
    });
    this.cameras.forEach((c) => { c.alertness = 0; });
  }

  resumeAfterCaught() {
    if (this.state === 'caught') this.state = 'playing';
  }

  onHeistClear() {
    const timeBonus = Math.max(0, Math.round((SCORING.parSec - this.timeSec) * SCORING.timeBonusPerSecLeft));
    const ghost = this.heistAlarmTripped ? 0 : SCORING.ghostBonus;
    const unused = (this.gadgets.smoke + this.gadgets.emp + this.gadgets.coin) * SCORING.gadgetUnusedBonus;
    const heistScore = timeBonus + ghost + unused;
    this.totalScore += heistScore;
    this.clearScore = {
      heist: this.heist.name,
      timeSec: Math.round(this.timeSec),
      lootTaken: this.lootTaken,
      lootTotal: this.loot.length,
      timeBonus,
      ghost,
      unused,
      heistScore,
      totalScore: this.totalScore,
    };
    this.play('clear');
    if (this.heistIndex + 1 >= HEISTS.length) {
      this.state = 'victory';
      this.play('win');
    } else {
      this.state = 'clear';
    }
  }

  nextHeist() {
    if (this.state === 'clear') {
      this.loadHeist(this.heistIndex + 1);
      this.state = 'playing';
    }
  }

  startGame() {
    this.totalScore = 0;
    this.lives = START_LIVES;
    this.alarmEverTripped = false;
    this.loadHeist(0);
    this.state = 'playing';
  }

  restartRun() {
    this.startGame();
  }

  /** Angle helpers the renderer uses. */
  facingOf(entity) {
    return entity.facing;
  }

  angleTo(a, b) {
    return angleDiff(Math.atan2(b.y - a.y, b.x - a.x), a.facing);
  }
}
