export class Pointer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [options]
   * @param {boolean} [options.hideCursor=false]
   * @param {boolean} [options.preventContextMenu=false]
   */
  constructor(canvas, options = {}) {
    if (!canvas) {
      throw new Error("Pointer requires a target HTMLCanvasElement.");
    }

    this.canvas = canvas;
    this.hideCursor = Boolean(options.hideCursor);
    this.preventContextMenu = Boolean(options.preventContextMenu);

    // Logical canvas coordinates
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.dx = 0;
    this.dy = 0;

    // Frame-level button states (keyed by MouseEvent.button: 0=left, 1=middle, 2=right)
    this._currentDown = new Set();
    this._previousDown = new Set();
    this._hasMoved = false;

    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onPointerLeave = this._handlePointerLeave.bind(this);
    this._onContextMenu = this._handleContextMenu.bind(this);

    this._attachEvents();
    this._applyOptions();
  }

  _attachEvents() {
    this.canvas.addEventListener("pointermove", this._onPointerMove);
    this.canvas.addEventListener("pointerdown", this._onPointerDown);
    window.addEventListener("pointerup", this._onPointerUp);
    this.canvas.addEventListener("pointerleave", this._onPointerLeave);

    if (this.preventContextMenu) {
      this.canvas.addEventListener("contextmenu", this._onContextMenu);
    }
  }

  _applyOptions() {
    if (this.hideCursor) {
      this.canvas.style.cursor = "none";
    }
  }

  _updatePositionFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.x = Math.floor((event.clientX - rect.left) * scaleX);
    this.y = Math.floor((event.clientY - rect.top) * scaleY);

    if (!this._hasMoved) {
      this.prevX = this.x;
      this.prevY = this.y;
      this._hasMoved = true;
    }
  }

  _handlePointerMove(event) {
    this._updatePositionFromEvent(event);
  }

  _handlePointerDown(event) {
    this._updatePositionFromEvent(event);
    this._currentDown.add(event.button);
  }

  _handlePointerUp(event) {
    this._currentDown.delete(event.button);
  }

  _handlePointerLeave() {
    // Keep last coordinates, but clear held buttons if outside
    this._currentDown.clear();
  }

  _handleContextMenu(event) {
    event.preventDefault();
  }

  /**
   * Advances per-frame input state (deltas and just-pressed / just-released edges).
   * Call once per frame at the start of your game loop.
   */
  update() {
    this.dx = this.x - this.prevX;
    this.dy = this.y - this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;

    this._previousDown = new Set(this._currentDown);
  }

  /**
   * Returns true while the given mouse button is held down.
   * @param {number} [button=0]
   */
  isDown(button = 0) {
    return this._currentDown.has(button);
  }

  /**
   * Returns true only on the frame the button transitioned from up to down.
   * @param {number} [button=0]
   */
  isPressed(button = 0) {
    return this._currentDown.has(button) && !this._previousDown.has(button);
  }

  /**
   * Returns true only on the frame the button transitioned from down to up.
   * @param {number} [button=0]
   */
  isReleased(button = 0) {
    return !this._currentDown.has(button) && this._previousDown.has(button);
  }

  /**
   * Removes event listeners and restores default cursor style if modified.
   */
  destroy() {
    this.canvas.removeEventListener("pointermove", this._onPointerMove);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    window.removeEventListener("pointerup", this._onPointerUp);
    this.canvas.removeEventListener("pointerleave", this._onPointerLeave);
    this.canvas.removeEventListener("contextmenu", this._onContextMenu);

    if (this.hideCursor) {
      this.canvas.style.cursor = "";
    }
  }
}
