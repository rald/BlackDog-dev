import { getHexColor } from "./palette.js";
import { createPointer } from "./pointer.js";
import {
  initGraphics,
  setScale,
  cls,
  pset,
  dline,
  drect,
  frect,
  dcirc,
  fcirc,
  dtext,
} from "./graphics.js";

const canvas = document.getElementById("canvas");
initGraphics(canvas);

canvas.width = 256;
canvas.height = 256 + 128;
setScale(2);
cls();

const pointer = createPointer(canvas, {
  hideCursor: true,
  preventContextMenu: true,
});

function loop() {
  pointer.update();

  cls(0);

  for (let i = 63; i > 0; i -= 7) {
    fcirc(63, 63, i, 10);
    dcirc(63, 63, i, 9);
  }

  dtext("Hello World", 0, 0, getHexColor(12));
  frect(0, 0, 16, 16, 10);
  drect(0, 0, 16, 16, 9);
  dline(0, 0, 127, 127, 12);

  pset(pointer.x, pointer.y, 12);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
