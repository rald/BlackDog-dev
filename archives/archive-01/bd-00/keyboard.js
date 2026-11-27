/**
 * Creates a frame-buffered keyboard state tracker.
 * Tracks held keys (`down`), single-frame presses (`pressed`), and
 * single-frame releases (`released`) keyed by `e.code` (e.g., "Space", "ArrowUp", "KeyW").
 *
 * @param {object} [options]
 * @param {boolean} [options.preventDefaultKeys=true] - Prevent default browser actions for Arrow/Space/Tab keys.
 */
export function createKeyboard(options = {}) {
  const { preventDefaultKeys = true } = options;

  const downKeys = new Set();
  const pressedKeys = new Set();
  const releasedKeys = new Set();

  const pendingPressed = new Set();
  const pendingReleased = new Set();

  const blockedCodes = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Space",
  ]);

  function onKeyDown(e) {
    if (preventDefaultKeys && blockedCodes.has(e.code)) {
      e.preventDefault();
    }

    if (!downKeys.has(e.code)) {
      downKeys.add(e.code);
      pendingPressed.add(e.code);
    }
  }

  function onKeyUp(e) {
    if (preventDefaultKeys && blockedCodes.has(e.code)) {
      e.preventDefault();
    }

    downKeys.delete(e.code);
    pendingReleased.add(e.code);
  }

  function onBlur() {
    downKeys.clear();
    pendingPressed.clear();
    pendingReleased.clear();
    pressedKeys.clear();
    releasedKeys.clear();
  }

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp, { passive: false });
  window.addEventListener("blur", onBlur);

  return {
    /** True while the key (`e.code`) is held down. */
    isDown(code) {
      return downKeys.has(code);
    },

    /** True only on the frame the key (`e.code`) transitioned from up to down. */
    wasPressed(code) {
      return pressedKeys.has(code);
    },

    /** True only on the frame the key (`e.code`) transitioned from down to up. */
    wasReleased(code) {
      return releasedKeys.has(code);
    },

    /** Call once per frame before reading `wasPressed` / `wasReleased`. */
    update() {
      pressedKeys.clear();
      for (const code of pendingPressed) {
        pressedKeys.add(code);
      }
      pendingPressed.clear();

      releasedKeys.clear();
      for (const code of pendingReleased) {
        releasedKeys.add(code);
      }
      pendingReleased.clear();
    },

    /** Removes global listeners on cleanup. */
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    },
  };
}
