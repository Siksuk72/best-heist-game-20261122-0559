// GILDED HOUR — bootstrap: canvas, game loop, keys, and screenshot staging.
// One job: glue input, world, audio and rendering together, nothing more.

import { HUD_H, VIEW_H, VIEW_W } from './config.js';
import { World } from './world.js';
import { drawGame } from './render.js';
import { createInput, consumePresses } from './input.js';
import { initAudio, playSound, toggleMute } from './audio.js';
import { stageShot, idleInput } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const world = new World();
const input = createInput(canvas);
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

let time = 0;
let last = performance.now();
let helpOpen = false;

function drainSounds() {
  while (world.sounds.length > 0) {
    playSound(world.sounds.shift().name);
  }
}

function handlePresses(presses) {
  if (presses.has('Enter')) {
    initAudio();
    if (world.state === 'title') world.startGame();
    else if (world.state === 'caught') world.resumeAfterCaught();
    else if (world.state === 'clear') world.nextHeist();
    else if (world.state === 'gameover' || world.state === 'victory') world.restartRun();
    playSound('click');
  }
  if (presses.has('KeyP')) {
    if (world.state === 'playing') world.state = 'paused';
    else if (world.state === 'paused') world.state = 'playing';
  }
  if (presses.has('KeyM')) {
    const muted = toggleMute();
    world.toast(muted ? 'Sound muted' : 'Sound on');
  }
  if (presses.has('Digit1')) world.useGadget('smoke');
  if (presses.has('Digit2')) world.useGadget('emp');
  if (presses.has('Digit3')) {
    world.useGadget('coin', input.mouseX, input.mouseY - HUD_H);
  }
  if (presses.has('KeyH')) {
    helpOpen = !helpOpen;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  world.caughtFlash = Math.max(0, world.caughtFlash - dt * 1.5);

  const presses = consumePresses(input);
  handlePresses(presses);

  if (input.clicked) {
    input.clicked = false;
    initAudio();
    if (world.state === 'playing' && input.clickY > HUD_H) {
      world.useGadget('coin', input.clickX, input.clickY - HUD_H);
    }
  }

  world.update(input, dt);
  drainSounds();
  drawGame(ctx, world, time);
  if (helpOpen && world.state === 'playing') {
    drawHelp();
  }
  requestAnimationFrame(frame);
}

function drawHelp() {
  ctx.fillStyle = 'rgba(6,8,18,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#141a33';
  ctx.fillRect(VIEW_W / 2 - 320, 130, 640, 330);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(VIEW_W / 2 - 320, 130, 640, 330);
  ctx.lineWidth = 1;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('HOW TO STEAL', VIEW_W / 2, 175);
  ctx.fillStyle = '#f2e8c9';
  ctx.font = '15px Georgia, serif';
  const lines = [
    'WASD / arrows — move. Shift — sprint (fast, loud). C — sneak (slow, silent).',
    'Guards see you inside their gold cones; cameras sweep red ones.',
    'Sneak to be spotted slowly, sprint to be spotted fast.',
    '1 Ghost Smoke — hide in the cloud. 2 EMP Pulse — kill the cameras.',
    '3 or click — toss a coin; nearby guards go look at it.',
    'Steal the named prize, then reach the green EXIT. Get caught 3 times and it is over.',
    'Felt tables, safes and palms block sight. Curtains hide you completely.',
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 215 + i * 28);
  });
  ctx.fillStyle = '#a99f7e';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Press H to close', VIEW_W / 2, 435);
}

// Screenshot staging: ?shot=cover|sneak|alarm|victory plays the real rules
// into a mid-action frame, then signals the capture driver.
if (shotName) {
  const info = stageShot(world, shotName);
  window.__shotInfo = info;
  // Let the live loop run a few dozen frames so cones sweep and cameras pan.
  let stagedFrames = 0;
  const stageTick = () => {
    world.update(idleInput(), 1 / 60);
    drainSounds();
    drawGame(ctx, world, time + stagedFrames / 60);
    stagedFrames += 1;
    if (stagedFrames < 45) {
      requestAnimationFrame(stageTick);
    } else {
      window.__shotReady = true;
    }
  };
  requestAnimationFrame(stageTick);
} else {
  requestAnimationFrame(frame);
}
