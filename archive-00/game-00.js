import { getHexColor } from "./palette.js";
import { font } from "./font.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const CHAR_W = 8;
const CHAR_H = 8;

/**
 * Draws a single 8x8 bitmap character at pixel coordinates (x, y) in color c.
 * @param {string|number} char - Character (uses charCodeAt(0)) or glyph index (0..255).
 * @param {number} x - Left pixel coordinate.
 * @param {number} y - Top pixel coordinate.
 * @param {string} c - Fill color.
 */
function dchar(char, x, y, c) {
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
function dtext(text, x, y, c) {
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

let currentScale = 1;

/**
 * Sets the display scale of the logical 128x128 canvas while keeping
 * pixel coordinates and crisp pixel rendering intact.
 * @param {number} scale - Positive display multiplier (e.g., 2, 3, 4).
 */
function setScale(scale) {
  if (typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0) {
    throw new RangeError("Scale must be a positive finite number");
  }

  currentScale = scale;
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
}

function cls(c = 0) {
  ctx.fillStyle = getHexColor(c);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function pset(x,y,c) {
  const px = Math.floor(x);
  const py = Math.floor(y);
  ctx.fillStyle=getHexColor(c);
  ctx.fillRect(px,py,1,1);
}

function pget(x, y) {
  const px = Math.floor(x);
  const py = Math.floor(y);
  const data = ctx.getImageData(px, py, 1, 1).data;
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
}

function dline(x0, y0, x1, y1, c) {
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

function drect(x, y, w, h, c) {
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

function frect(x, y, w, h, c) {
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

function dcirc(cx, cy, r, c) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  r = Math.round(r);
  if (r < 0) return;

  let x = 0;
  let y = r;
  let d = 3 - 2 * r;

  function plot8(px, py) {
    pset(cx + px, cy + py, c);
    pset(cx - px, cy + py, c);
    pset(cx + px, cy - py, c);
    pset(cx - px, cy - py, c);
    pset(cx + py, cy + px, c);
    pset(cx - py, cy + px, c);
    pset(cx + py, cy - px, c);
    pset(cx - py, cy - px, c);
  }

  while (y >= x) {
    plot8(x, y);
    x++;
    if (d > 0) {
      y--;
      d = d + 4 * (x - y) + 10;
    } else {
      d = d + 4 * x + 6;
    }
  }
}

function fcirc(cx, cy, r, c) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  r = Math.round(r);
  if (r < 0) return;

  let x = 0;
  let y = r;
  let d = 3 - 2 * r;

  function hspan(xStart, xEnd, py) {
    for (let ix = xStart; ix <= xEnd; ix++) {
      pset(ix, py, c);
    }
  }

  function fillOctants(px, py) {
    hspan(cx - px, cx + px, cy + py);
    hspan(cx - px, cx + px, cy - py);
    hspan(cx - py, cx + py, cy + px);
    hspan(cx - py, cx + py, cy - px);
  }

  while (y >= x) {
    fillOctants(x, y);
    x++;
    if (d > 0) {
      y--;
      d = d + 4 * (x - y) + 10;
    } else {
      d = d + 4 * x + 6;
    }
  }
}

canvas.width = 128;
canvas.height = 128;

setScale(4);

cls();
dtext("Hello World", 0, 0, getHexColor(12));
dline(0,0,127,127,12);
frect(0,0,16,16,10);
drect(0,0,16,16,9);

for(let i=64;i>=0;i-=8) {
  fcirc(64,64,i,10);
  dcirc(64,64,i,9);
}
