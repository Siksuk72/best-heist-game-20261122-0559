// GILDED HOUR — input: keyboard state plus mouse position and clicks.
// One job: tell the world which keys are held and where the mouse is.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    sprint: false,
    mouseX: 0,
    mouseY: 0,
    clicked: false, // consumed by main.js once per frame
    clickX: 0,
    clickY: 0,
  };

  function refresh() {
    input.up = keys.has('KeyW') || keys.has('ArrowUp');
    input.down = keys.has('KeyS') || keys.has('ArrowDown');
    input.left = keys.has('KeyA') || keys.has('ArrowLeft');
    input.right = keys.has('KeyD') || keys.has('ArrowRight');
    input.sneak = keys.has('KeyC') || keys.has('ControlLeft') || keys.has('ControlRight');
    input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) keys.add(e.code);
    refresh();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    refresh();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    refresh();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    input.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    input.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    input.clicked = true;
    input.clickX = input.mouseX;
    input.clickY = input.mouseY;
  });

  // One-shot key presses (Enter, P, H, M, 1/2/3): main.js polls these.
  input.pressed = new Set();
  window.addEventListener('keydown', (e) => {
    if (!e.repeat) input.pressed.add(e.code);
  });

  return input;
}

/** Drain the one-shot presses since the last frame. */
export function consumePresses(input) {
  const out = new Set(input.pressed);
  input.pressed.clear();
  return out;
}
