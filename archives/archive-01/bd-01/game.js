import { pal } from "./palette.js";
import { Pointer } from "./pointer.js";
import { Keyboard } from "./keyboard.js";
import { Graphics } from "./graphics.js";

const canvas = document.getElementById("canvas");
canvas.width = 256;
canvas.height = 256 + 128;

const gfx = new Graphics(canvas, pal);
gfx.scale = 1;
gfx.cls();

const pointer = new Pointer(canvas, {
  preventContextMenu: true,
  hideCursor: true,
});

const keyboard = new Keyboard({
  preventDefault: true,
  preventDefaultKeys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"],
});

let px = 128;
let py = 128;
const speed = 2;

function loop() {
  pointer.update();
  keyboard.update();

  if (keyboard.isDown("ArrowLeft") || keyboard.isDown("KeyA")) px -= speed;
  if (keyboard.isDown("ArrowRight") || keyboard.isDown("KeyD")) px += speed;
  if (keyboard.isDown("ArrowUp") || keyboard.isDown("KeyW")) py -= speed;
  if (keyboard.isDown("ArrowDown") || keyboard.isDown("KeyS")) py += speed;

  if (keyboard.isPressed("Space")) {
    px = pointer.x;
    py = pointer.y;
  }

  gfx.cls(0);

  gfx.dtext(`${pointer.x}:${pointer.y}`, 0, 0, gfx.palette.getHexColor(12));
  gfx.dtext(`${px}:${py}`, 0, 10, gfx.palette.getHexColor(11));

  gfx.pset(pointer.x, pointer.y, 12);
  gfx.drect(pointer.x - 2, pointer.y - 2, 5, 5, 4);
  gfx.fcirc(px, py, 3, 6);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
