import { pal } from "./palette.js";
import { Pointer } from "./pointer.js";
import { Keyboard } from "./keyboard.js";
import { Graphics } from "./graphics.js";

export class Game {
  constructor(canvasId = "canvas") {
    this.canvas = document.getElementById(canvasId);
    this.gfx = new Graphics(this.canvas, pal);
    this.pointer = new Pointer(this.canvas, {
      preventContextMenu: true,
      hideCursor: true,
    });
    this.keyboard = new Keyboard({
      preventDefault: true,
      preventDefaultKeys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"],
    });

    this.px = 128;
    this.py = 128;
    this.speed = 120; // pixels per second

    this.paused = false;
    this.lastTime = performance.now();
    this._rafId = null;

    this._onFrame = this.draw.bind(this);
  }

  setup() {
    this.canvas.width = 320;
    this.canvas.height = 200;

    this.gfx.scale = 2;
    this.gfx.cls(0);

    this.px = 128;
    this.py = 128;
    this.paused = false;
    this.lastTime = performance.now();
  }

  draw(now = performance.now()) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.pointer.update();
    this.keyboard.update();

    if (!this.paused) {
      if (this.keyboard.isDown("ArrowLeft") || this.keyboard.isDown("KeyA")) {
        this.px -= this.speed * dt;
      }
      if (this.keyboard.isDown("ArrowRight") || this.keyboard.isDown("KeyD")) {
        this.px += this.speed * dt;
      }
      if (this.keyboard.isDown("ArrowUp") || this.keyboard.isDown("KeyW")) {
        this.py -= this.speed * dt;
      }
      if (this.keyboard.isDown("ArrowDown") || this.keyboard.isDown("KeyS")) {
        this.py += this.speed * dt;
      }

      if (this.keyboard.isPressed("Space")) {
        this.px = this.pointer.x;
        this.py = this.pointer.y;
      }
    }

    this.gfx.cls(0);

    this.gfx.dtext(`${this.pointer.x}:${this.pointer.y}`, 0, 0, this.gfx.palette.getHexColor(12));
    this.gfx.dtext(`${Math.floor(this.px)}:${Math.floor(this.py)}`, 0, 10, this.gfx.palette.getHexColor(11));
    if (this.paused) {
      this.gfx.dtext("PAUSED", 0, 20, this.gfx.palette.getHexColor(12));
    }

    this.gfx.pset(this.pointer.x, this.pointer.y, 12);
    this.gfx.drect(this.pointer.x - 2, this.pointer.y - 2, 5, 5, 4);
    this.gfx.fcirc(this.px, this.py, 3, 6);

    this._rafId = requestAnimationFrame(this._onFrame);
  }

  pause(state = true) {
    this.paused = Boolean(state);
    this.lastTime = performance.now();
  }

  resume() {
    this.pause(false);
  }

  togglePause() {
    this.pause(!this.paused);
  }

  start() {
    this.setup();
    this._rafId = requestAnimationFrame(this._onFrame);
  }

  stop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}

const game = new Game();
game.start();
