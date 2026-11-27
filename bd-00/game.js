import { GameEngine } from "./GameEngine.js";

class DemoGame extends GameEngine {
  setup() {
    super.setup();
    this.px = 128;
    this.py = 128;
    this.speed = 120;
    this.spacePressCount = 0;
    this.clickPressCount = 0;
  }

  update(dt) {
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
    if (this.keyboard.isDown("Space")) {
      this.px = this.pointer.x;
      this.py = this.pointer.y;
    }

    if (this.keyboard.isPressed("Space")) {
      this.spacePressCount += 1;
      console.log("Space isPressed! Count:", this.spacePressCount);
    }

    if (this.pointer.isPressed(0)) {
      this.clickPressCount += 1;
      console.log("Pointer 0 isPressed at:", this.pointer.x, this.pointer.y, "Count:", this.clickPressCount);
    }
  }

  draw() {
    this.gfx.cls(0);

    this.gfx.dtext(`SPACE PRESSED: ${this.spacePressCount}`, 8, 8, 12);
    this.gfx.dtext(`CLICK PRESSED: ${this.clickPressCount}`, 8, 18, 11);

    this.gfx.pset(this.pointer.x, this.pointer.y, 12);
    this.gfx.drect(this.pointer.x - 2, this.pointer.y - 2, 5, 5, 4);
    this.gfx.fcirc(this.px, this.py, 3, 6);
  }
}

const game = new DemoGame({ width: 320, height: 200, scale: 2 });
game.start();