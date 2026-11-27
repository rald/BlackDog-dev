import { getHexColor } from "./palette.js";
import { font } from "./font.js";

const CHAR_W = 8;
const CHAR_H = 8;

let canvas = null;
let ctx = null;
let currentScale = 1;

/**
 * Initializes the graphics module with a target canvas element.
 * @param {HTMLCanvasElement} targetCanvas
 */
export function initGraphics(targetCanvas) {
  canvas = targetCanvas;
  ctx = canvas.getContext("2d");
}

/**
 * Draws a single 8x8 bitmap character at pixel coordinates (x, y) in color c.
 * @param {string|number} char - Character (uses charCodeAt(0)) or glyph index (0..255).
 * @param {number} x - Left pixel coordinate.
 * @param {number} y - Top pixel coordinate.
 * @param {string} c - Fill color.
 */
export function dchar(char, x, y, c) {
  const code = typeof char === "number" ? char : char.charCodeAt(0);
  const glyphIndex = ((code % 256) + 256) % 256;
  const baseOffset = glyphIndex * CHAR_H;
  const px = Math.floor(x);
  const py = Math.floor(y);

  ctx.fillStyle = c;

  for (let row = 0; row < CHAR_H; row++) {
    const bits = font[baseOffset + row];
    if (bits === 0) continue;

    for (let col = 0; col < CHAR_W; col++) {
      // MSB-first: leftmost pixel is bit 7 (0x80), rightmost is bit 0 (0x01)
      if ((bits & (0x80 >>> col)) !== 0) {
        ctx.fillRect(px + col, py + row, 1, 1);
      }
    }
  }
}

/**
 * Draws a string starting at pixel coordinates (x, y) in color c.
 * Supports '\n' for line breaks (advances y by 8px and resets x).
 * @param {string} text - Text to render.
 * @param {number} x - Starting left pixel coordinate.
 * @param {number} y - Starting top pixel coordinate.
 * @param {string} c - Fill color.
 */
export function dtext(text, x, y, c) {
  const str = String(text);
  let cursorX = x;
  let cursorY = y;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "\n") {
      cursorX = x;
      cursorY += CHAR_H;
      continue;
    }

    dchar(ch, cursorX, cursorY, c);
    cursorX += CHAR_W;
  }
}

/**
 * Sets the display scale of the logical canvas while keeping
 * pixel coordinates and crisp pixel rendering intact.
 * @param {number} scale - Positive display multiplier (e.g., 2, 3, 4).
 */
export function setScale(scale) {
  if (typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0) {
    throw new RangeError("Scale must be a positive finite number");
  }

  currentScale = scale;
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
}

export function getScale() {
  return currentScale;
}

export function cls(c = 0) {
  ctx.fillStyle = getHexColor(c);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function pset(x, y, c) {
  const px = Math.floor(x);
  const py = Math.floor(y);
  ctx.fillStyle = getHexColor(c);
  ctx.fillRect(px, py, 1, 1);
}

export function pget(x, y) {
  const px = Math.floor(x);
  const py = Math.floor(y);
  const data = ctx.getImageData(px, py, 1, 1).data;
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
}

export function dline(x0, y0, x1, y1, c) {
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
    pset(x0, y0, c);
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

export function drect(x, y, w, h, c) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  if (w <= 0 || h <= 0) return;

  const x2 = x + w - 1;
  const y2 = y + h - 1;

  for (let ix = x; ix <= x2; ix++) {
    pset(ix, y, c);
    pset(ix, y2, c);
  }
  for (let iy = y + 1; iy < y2; iy++) {
    pset(x, iy, c);
    pset(x2, iy, c);
  }
}

export function frect(x, y, w, h, c) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  if (w <= 0 || h <= 0) return;

  for (let iy = y; iy < y + h; iy++) {
    for (let ix = x; ix < x + w; ix++) {
      pset(ix, iy, c);
    }
  }
}

export function dcirc(cx, cy, r, c) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  r = Math.round(r);
  if (r < 0) return;

  if (r === 0) {
    pset(cx, cy, c);
    return;
  }

  let x = 0;
  let y = r;
  let err = 1 - r;

  function plot8(px, py) {
    pset(cx + px, cy + py, c);
    pset(cx - px, cy + py, c);
    pset(cx + px, cy - py, c);
    pset(cx - px, cy - py, c);
    if (px !== py) {
      pset(cx + py, cy + px, c);
      pset(cx - py, cy + px, c);
      pset(cx + py, cy - px, c);
      pset(cx - py, cy - px, c);
    }
  }

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

export function fcirc(cx, cy, r, c) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  r = Math.round(r);
  if (r < 0) return;

  if (r === 0) {
    pset(cx, cy, c);
    return;
  }

  ctx.fillStyle = getHexColor(c);

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

    ctx.fillRect(left, cy + dy, width, 1);
    if (dy !== 0) {
      ctx.fillRect(left, cy - dy, width, 1);
    }
  }
}
