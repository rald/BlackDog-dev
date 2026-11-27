export class Keyboard {
  /**
   * @param {Object} [options]
   * @param {EventTarget} [options.target=window] - Event target to attach listeners to.
   * @param {boolean} [options.preventDefault=false] - Prevent default browser actions for tracked/all keys.
   * @param {Set<string>|Array<string>} [options.preventDefaultKeys] - Specific KeyboardEvent.code values to prevent default on (when preventDefault is true, prevents all).
   */
  constructor(options = {}) {
    this.target = options.target ?? window;
    this.preventDefault = Boolean(options.preventDefault);
    this.preventDefaultKeys = options.preventDefaultKeys
      ? new Set(options.preventDefaultKeys)
      : null;

    // Frame-level key states keyed by KeyboardEvent.code (e.g. "ArrowUp", "KeyW", "Space")
    this._currentDown = new Set();
    this._previousDown = new Set();

    // Optional typed character buffer for text entry (cleared on update or read/flush)
    this._typedChars = [];

    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._onBlur = this._handleBlur.bind(this);

    this._attachEvents();
  }

  _attachEvents() {
    this.target.addEventListener("keydown", this._onKeyDown);
    this.target.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("blur", this._onBlur);
  }

  _shouldPreventDefault(event) {
    if (!this.preventDefault) return false;
    if (!this.preventDefaultKeys) return true;
    return this.preventDefaultKeys.has(event.code);
  }

  _handleKeyDown(event) {
    if (this._shouldPreventDefault(event)) {
      event.preventDefault();
    }

    // Track single printable characters when not holding Ctrl/Meta/Alt shortcuts
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      this._typedChars.push(event.key);
    }

    this._currentDown.add(event.code);
  }

  _handleKeyUp(event) {
    this._currentDown.delete(event.code);
  }

  _handleBlur() {
    // Prevent stuck keys if the browser window/tab loses focus
    this._currentDown.clear();
  }

  /**
   * Advances per-frame input state for edge detection (isPressed / isReleased).
   * Call once per frame at the start of your game loop.
   */
  update() {
    this._previousDown = new Set(this._currentDown);
    this._typedChars.length = 0;
  }

  /**
   * Returns true while the given key code is held down.
   * @param {string} code - KeyboardEvent.code (e.g. "ArrowLeft", "KeyA", "Space").
   */
  isDown(code) {
    return this._currentDown.has(code);
  }

  /**
   * Returns true only on the frame the key transitioned from up to down.
   * @param {string} code
   */
  isPressed(code) {
    return this._currentDown.has(code) && !this._previousDown.has(code);
  }

  /**
   * Returns true only on the frame the key transitioned from down to up.
   * @param {string} code
   */
  isReleased(code) {
    return !this._currentDown.has(code) && this._previousDown.has(code);
  }

  /**
   * Returns a string of printable characters typed during the current frame.
   * @returns {string}
   */
  getTypedText() {
    return this._typedChars.join("");
  }

  /**
   * Clears all currently held keys.
   */
  clear() {
    this._currentDown.clear();
    this._previousDown.clear();
    this._typedChars.length = 0;
  }

  /**
   * Removes all event listeners and resets state.
   */
  destroy() {
    this.target.removeEventListener("keydown", this._onKeyDown);
    this.target.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("blur", this._onBlur);
    this.clear();
  }
}
