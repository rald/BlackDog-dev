import { getHexColor } from "./palette.js";

/**
 * Creates a logical-pixel pointer/mouse/touch input tracker for a canvas.
 * Converts client coordinates into logical canvas pixel space while accounting
 * for CSS scaling via getBoundingClientRect().
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} [options]
 * @param {boolean} [options.clamp=true] - Clamp logical coordinates to [0, width) and [0, height).
 * @param {boolean} [options.preventContextMenu=false] - Prevent default right-click menu on canvas.
 */
export function createPointer(canvas, options = {}) {
  const { clamp = true, preventContextMenu = false } = options;

  const state = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    dx: 0,
    dy: 0,
    inside: false,
    down: false,
    pressed: false,
    released: false,
    buttons: new Set(),
    pressedButtons: new Set(),
    releasedButtons: new Set(),
    wheelX: 0,
    wheelY: 0,
  };

  let pendingWheelX = 0;
  let pendingWheelY = 0;
  let pendingPressed = false;
  let pendingReleased = false;
  const pendingPressedButtons = new Set();
  const pendingReleasedButtons = new Set();

  function toLogicalCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    let lx = Math.floor((clientX - rect.left) * scaleX);
    let ly = Math.floor((clientY - rect.top) * scaleY);

    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;

    if (clamp) {
      lx = Math.max(0, Math.min(canvas.width - 1, lx));
      ly = Math.max(0, Math.min(canvas.height - 1, ly));
    }

    return { lx, ly, inside };
  }

  function updatePosition(clientX, clientY) {
    const { lx, ly, inside } = toLogicalCoords(clientX, clientY);
    state.x = lx;
    state.y = ly;
    state.inside = inside;
  }

  function onPointerMove(e) {
    updatePosition(e.clientX, e.clientY);
  }

  function onPointerDown(e) {
    updatePosition(e.clientX, e.clientY);
    state.down = true;
    pendingPressed = true;
    state.buttons.add(e.button);
    pendingPressedButtons.add(e.button);
    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture isn't supported or already active
      }
    }
  }

  function onPointerUp(e) {
    updatePosition(e.clientX, e.clientY);
    state.down = false;
    pendingReleased = true;
    state.buttons.delete(e.button);
    pendingReleasedButtons.add(e.button);
  }

  function onPointerLeave(e) {
    updatePosition(e.clientX, e.clientY);
    state.inside = false;
  }

  function onWheel(e) {
    e.preventDefault();
    pendingWheelX += e.deltaX;
    pendingWheelY += e.deltaY;
  }

  function onContextMenu(e) {
    if (preventContextMenu) {
      e.preventDefault();
    }
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);

  const pointer = {
    get x() {
      return state.x;
    },
    get y() {
      return state.y;
    },
    get dx() {
      return state.dx;
    },
    get dy() {
      return state.dy;
    },
    get inside() {
      return state.inside;
    },
    get down() {
      return state.down;
    },
    get pressed() {
      return state.pressed;
    },
    get released() {
      return state.released;
    },
    get wheelX() {
      return state.wheelX;
    },
    get wheelY() {
      return state.wheelY;
    },

    /**
     * Checks if a specific mouse/pointer button (0 = left, 1 = middle, 2 = right)
     * is currently held down.
     */
    isDown(button = 0) {
      return state.buttons.has(button);
    },

    /**
     * True only on the frame the given button was pressed.
     */
    wasPressed(button = 0) {
      return state.pressedButtons.has(button);
    },

    /**
     * True only on the frame the given button was released.
     */
    wasReleased(button = 0) {
      return state.releasedButtons.has(button);
    },

    /**
     * Checks if pointer logical coordinates are inside a rectangle [rx, ry, rw, rh].
     */
    inRect(rx, ry, rw, rh) {
      return (
        state.inside &&
        state.x >= rx &&
        state.x < rx + rw &&
        state.y >= ry &&
        state.y < ry + rh
      );
    },

    /**
     * Call once per game/animation frame to update per-frame deltas and
     * single-frame press/release/wheel states.
     */
    update() {
      state.dx = state.x - state.prevX;
      state.dy = state.y - state.prevY;
      state.prevX = state.x;
      state.prevY = state.y;

      state.pressed = pendingPressed;
      state.released = pendingReleased;
      pendingPressed = false;
      pendingReleased = false;

      state.pressedButtons.clear();
      for (const b of pendingPressedButtons) {
        state.pressedButtons.add(b);
      }
      pendingPressedButtons.clear();

      state.releasedButtons.clear();
      for (const b of pendingReleasedButtons) {
        state.releasedButtons.add(b);
      }
      pendingReleasedButtons.clear();

      state.wheelX = pendingWheelX;
      state.wheelY = pendingWheelY;
      pendingWheelX = 0;
      pendingWheelY = 0;
    },

    /**
     * Draws a crisp 1x1 pixel crosshair/cursor at the pointer position using
     * palette indices from palette.js.
     */
    drawCursor(ctx, fillIndex = 12, outlineIndex = 0) {
      if (!state.inside) return;

      const px = Math.floor(state.x);
      const py = Math.floor(state.y);
      const outline = getHexColor(outlineIndex);
      const fill = getHexColor(fillIndex);

      // Outline
      ctx.fillStyle = outline;
      ctx.fillRect(px - 1, py, 3, 1);
      ctx.fillRect(px, py - 1, 1, 3);

      // Center & short ticks
      ctx.fillStyle = fill;
      ctx.fillRect(px, py, 1, 1);
      ctx.fillRect(px - 2, py, 1, 1);
      ctx.fillRect(px + 2, py, 1, 1);
      ctx.fillRect(px, py - 2, 1, 1);
      ctx.fillRect(px, py + 2, 1, 1);
    },

    /**
     * Removes event listeners when cleaning up.
     */
    destroy() {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    },
  };

  return pointer;
}
