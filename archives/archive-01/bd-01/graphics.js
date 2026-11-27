import { pal, Palette } from "./palette.js";
import { fontPixels, fontWidth, fontHeight } from "./font.js";

export class Graphics {
  #canvas = null;
  #ctx = null;
  #scale = 1;
  #palette = pal;

  /**
   * @param {HTMLCanvasElement} [canvas] - Optional canvas to attach immediately.
   * @param {Palette} [palette=pal] - Palette instance used to resolve color indices.
   */
  constructor(canvas = null, palette = pal) {
    this.palette = palette;
    if (canvas) {
      this.init(canvas);
    }
  }

  /**
   * Initializes the graphics instance with a target canvas element.
   * @param {HTMLCanvasElement} targetCanvas
   */
  init(targetCanvas) {
    this.#canvas = targetCanvas;
    this.#ctx = targetCanvas.getContext("2d");
    return this;
  }

  get canvas() {
    return this.#canvas;
  }

  get ctx() {
    return this.#ctx;
  }

  get scale() {
    return this.#scale;
  }

  set scale(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new RangeError("Scale must be a positive finite number");
    }

    this.#scale = value;
    if (this.#canvas && this.#ctx) {
      this.#canvas.style.width = `${this.#canvas.width * value}px`;
      this.#canvas.style.height = `${this.#canvas.height * value}px`;
      this.#canvas.style.imageRendering = "pixelated";
      this.#ctx.imageSmoothingEnabled = false;
    }
  }

  get palette() {
    return this.#palette;
  }

  set palette(value) {
    if (!(value instanceof Palette)) {
      throw new TypeError("Palette must be an instance of Palette");
    }
    this.#palette = value;
  }

  /**
   * Draws a single 8x8 bitmap character at pixel coordinates (x, y) in color c.
   * @param {string|number} char - Character (uses charCodeAt(0)) or glyph index (0..255).
   * @param {number} x - Left pixel coordinate.
   * @param {number} y - Top pixel coordinate.
   * @param {string} c - Fill color.
   */
  dchar(char, x, y, c) {
    const code = typeof char === "number" ? char : char.charCodeAt(0);
    const glyphIndex = ((code % 256) + 256) % 256;
    const baseOffset = glyphIndex * fontHeight;
    const px = Math.floor(x);
    const py = Math.floor(y);

    this.#ctx.fillStyle = c;

    for (let row = 0; row < fontHeight; row++) {
      const bits = fontPixels[baseOffset + row];
      if (bits === 0) continue;

      for (let col = 0; col < fontWidth; col++) {
        // MSB-first: leftmost pixel is bit 7 (0x80), rightmost is bit 0 (0x01)
        if ((bits & (0x80 >>> col)) !== 0) {
          this.#ctx.fillRect(px + col, py + row, 1, 1);
        }
      }
    }
  }

  /**
   * Draws a string starting at pixel coordinates (x, y) in color c.
   * Supports '\n' for line breaks (advances y by fontHeight px and resets x).
   * @param {string} text - Text to render.
   * @param {number} x - Starting left pixel coordinate.
   * @param {number} y - Starting top pixel coordinate.
   * @param {string} c - Fill color.
   */
  dtext(text, x, y, c) {
    const str = String(text);
    let cursorX = x;
    let cursorY = y;

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === "\n") {
        cursorX = x;
        cursorY += fontHeight;
        continue;
      }

      this.dchar(ch, cursorX, cursorY, c);
      cursorX += fontWidth;
    }
  }

  cls(c = 0) {
    this.#ctx.fillStyle = this.#palette.getHexColor(c);
    this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  pset(x, y, c) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    this.#ctx.fillStyle = this.#palette.getHexColor(c);
    this.#ctx.fillRect(px, py, 1, 1);
  }

  pget(x, y) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    const data = this.#ctx.getImageData(px, py, 1, 1).data;
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
  }

  dline(x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.pset(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  drect(x, y, w, h, c) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    if (w <= 0 || h <= 0) return;

    const x2 = x + w - 1;
    const y2 = y + h - 1;

    for (let ix = x; ix <= x2; ix++) {
      this.pset(ix, y, c);
      this.pset(ix, y2, c);
    }
    for (let iy = y + 1; iy < y2; iy++) {
      this.pset(x, iy, c);
      this.pset(x2, iy, c);
    }
  }

  frect(x, y, w, h, c) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    if (w <= 0 || h <= 0) return;

    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        this.pset(ix, iy, c);
      }
    }
  }

  dcirc(cx, cy, r, c) {
    cx = Math.round(cx);
    cy = Math.round(cy);
    r = Math.round(r);
    if (r < 0) return;

    if (r === 0) {
      this.pset(cx, cy, c);
      return;
    }

    let x = 0;
    let y = r;
    let err = 1 - r;

    const plot8 = (px, py) => {
      this.pset(cx + px, cy + py, c);
      this.pset(cx - px, cy + py, c);
      this.pset(cx + px, cy - py, c);
      this.pset(cx - px, cy - py, c);
      if (px !== py) {
        this.pset(cx + py, cy + px, c);
        this.pset(cx - py, cy + px, c);
        this.pset(cx + py, cy - px, c);
        this.pset(cx - py, cy - px, c);
      }
    };

    while (x <= y) {
      plot8(x, y);
      x++;
      if (err < 0) {
        err += 2 * x + 1;
      } else {
        y--;
        err += 2 * (x - y) + 1;
      }
    }
  }

  fcirc(cx, cy, r, c) {
    cx = Math.round(cx);
    cy = Math.round(cy);
    r = Math.round(r);
    if (r < 0) return;

    if (r === 0) {
      this.pset(cx, cy, c);
      return;
    }

    this.#ctx.fillStyle = this.#palette.getHexColor(c);

    let x = 0;
    let y = r;
    let err = 1 - r;

    const maxSpanX = new Int32Array(r + 1);

    while (x <= y) {
      if (y > maxSpanX[x]) maxSpanX[x] = y;
      if (x > maxSpanX[y]) maxSpanX[y] = x;

      x++;
      if (err < 0) {
        err += 2 * x + 1;
      } else {
        y--;
        err += 2 * (x - y) + 1;
      }
    }

    for (let dy = 0; dy <= r; dy++) {
      const span = maxSpanX[dy];
      const left = cx - span;
      const width = span * 2 + 1;

      this.#ctx.fillRect(left, cy + dy, width, 1);
      if (dy !== 0) {
        this.#ctx.fillRect(left, cy - dy, width, 1);
      }
    }
  }
}
