// GILDED HOUR — configuration: board geometry, palette, speeds and gadgets.
// One job: every tunable number of the game lives here, nowhere else.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 16;
export const HUD_H = 80;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = HUD_H + ROWS * TILE; // 720

// Tile legend used by the heist maps in heists.js
export const TILES = {
  WALL: '#',
  FLOOR: '.',
  CARPET: ':',
  TABLE: 'T', // felt table: cover, blocks movement and vision
  SAFE: 'S', // safe / cabinet: cover
  PLANT: 'P', // potted palm: cover
  CURTAIN: 'H', // curtain alcove: walkable, hides the thief
  LOOT: 'L', // small treasure (chip stack, jewel)
  STAR: '*', // the named loot target of the heist
  EXIT: 'E', // service elevator
  DOOR: 'D', // doorway (walkable floor, drawn as a frame)
  PLAYER: '@',
  GUARD: 'G', // guard spawn (floor underneath)
};

export const BLOCKS_MOVE = new Set(['#', 'T', 'S', 'P']);
export const BLOCKS_SIGHT = new Set(['#', 'T', 'S', 'P']);

// Art-deco midnight casino palette: deep navy, brass gold, felt green, burgundy.
export const PALETTE = {
  wall: '#232b4d',
  wallTop: '#46538a',
  wallTrim: '#c9a227',
  floorA: '#2e3a63',
  floorB: '#293258',
  carpet: '#7a1f2b',
  carpetTrim: '#c9a227',
  felt: '#14532d',
  feltTrim: '#c9a227',
  safe: '#3d4457',
  safeTrim: '#8a93a8',
  plant: '#2e7d32',
  pot: '#b07d2b',
  curtain: '#5b2333',
  hud: '#12172b',
  hudTrim: '#c9a227',
  gold: '#e8c15a',
  goldDim: '#9a7d2e',
  thief: '#a4133c',
  thiefDark: '#6d0a26',
  guard: '#2f4b7c',
  guardTrim: '#e8c15a',
  coneCalm: 'rgba(232, 193, 90, 0.30)',
  coneSuspicious: 'rgba(240, 160, 50, 0.42)',
  coneChase: 'rgba(230, 70, 60, 0.48)',
  coneCamera: 'rgba(255, 80, 60, 0.34)',
  coneCameraAlert: 'rgba(255, 70, 50, 0.45)',
  loot: '#ffd94d',
  star: '#ff5d8f',
  exitOpen: '#39d98a',
  exitLocked: '#c0392b',
  smoke: 'rgba(200, 200, 205, 0.55)',
  text: '#f2e8c9',
  textDim: '#a99f7e',
  alarmGreen: '#39d98a',
  alarmAmber: '#f5a623',
  alarmRed: '#e5484d',
};

// Movement speeds in pixels per second.
export const SPEEDS = {
  sneak: 78,
  walk: 138,
  sprint: 208,
  guardPatrol: 62,
  guardChase: 148,
  guardInvestigate: 96,
};

// Detection: how fast a guard's alertness (0-100) rises when the thief is seen.
export const DETECTION = {
  guardBasePerSec: 62, // at point blank; falls off with distance
  cameraBasePerSec: 78,
  sneakMultiplier: 0.45,
  walkMultiplier: 1.0,
  sprintMultiplier: 1.7,
  decayPerSec: 26, // alertness lost while unseen
  alarmDecayPerSec: 9, // alarm meter lost while nobody sees the thief
  tripAt: 100,
  caughtDistance: 26,
  chaseLoseSightSec: 5, // guard gives up the chase after this long unseen
  alarmCooldownSec: 8, // alarm resets after this long with no sighting
};

// Noise: guards investigate a noise when the thief is inside their hearing radius.
export const NOISE = { sneak: 0, walk: 48, sprint: 128 };

export const GUARD = {
  visionRange: 235,
  visionHalfAngle: 0.62, // radians, ~35 degrees each side
  scanPauseSec: 1.4, // pause at each waypoint, sweeping the cone
  investigateSec: 4.5,
  searchSec: 5,
};

export const CAMERA = {
  visionRange: 265,
  visionHalfAngle: 0.5,
};

// Gadgets: named tools, each with a per-heist allowance and a cost in score.
export const GADGETS = {
  smoke: {
    key: '1',
    name: 'Ghost Smoke',
    blurb: 'a smoke cloud that blinds guards and cameras for 5 s',
    perHeist: 2,
    radius: 105,
    durationSec: 5,
  },
  emp: {
    key: '2',
    name: 'EMP Pulse',
    blurb: 'kills every camera for 6 s',
    perHeist: 1,
    durationSec: 6,
  },
  coin: {
    key: '3',
    name: 'Coin Toss',
    blurb: 'a gold coin that lures guards to where it lands',
    perHeist: 3,
    lureRadius: 175,
  },
};

export const SCORING = {
  loot: 100,
  starLoot: 500,
  ghostBonus: 300, // heist cleared without ever tripping the alarm
  timeBonusPerSecLeft: 4, // against a 150 s par per heist
  parSec: 150,
  gadgetUnusedBonus: 25,
};

export const START_LIVES = 3;
