/* =========================================================================
   INTERACTIVE SHOWCASE: "SWEETIE-16 ARENA" (PURELY PROCEDURAL + SFX)
   Demonstrates Palette, Procedural Graphics, SFX, Math, Input & GUI.
   ========================================================================= */
(function () {
  "use strict";

  var P = GameEngine.Palette;
  var M = GameEngine.Math;
  var Kb = GameEngine.Input.Keyboard;
  var Ms = GameEngine.Input.Mouse;
  var SFX = GameEngine.SFX;

  var ARENA = {
    x: 8,
    y: 26,
    w: 432,
    h: 326
  };

  function hash2D(x, y, seed) {
    var n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function drawHeroProcedural(buf, cols, rows, isRun) {
    var legOffset = isRun ? 2 : 0;

    buf.rect(3 - legOffset, 10, 3, 2, P.RED);
    buf.rect(7 + legOffset, 10, 3, 2, P.RED);
    buf.px(3 - legOffset, 10, P.PURPLE);
    buf.px(7 + legOffset, 10, P.PURPLE);

    buf.rect(4, 8, 2, 2, P.DARK_BLUE);
    buf.rect(7, 8, 2, 2, P.DARK_BLUE);

    buf.rect(3, 5, 7, 4, P.BLUE);
    buf.px(2, 6, P.YELLOW);
    buf.px(10, 6, P.YELLOW);
    buf.rect(3, 8, 7, 1, P.PURPLE);

    buf.rect(2, 1, 9, 4, P.YELLOW);
    buf.rect(3, 2, 7, 2, P.WHITE);
    buf.px(4, 3, P.CYAN);
    buf.px(8, 3, P.CYAN);

    buf.rect(3, 0, 7, 1, P.PURPLE);
    buf.px(6, 0, P.ORANGE);
  }

  function drawSlimeProcedural(buf, cols, rows) {
    buf.ellipse(6, 5.5, 5.2, 3.4, P.GREEN);
    buf.ellipse(6, 4.5, 3.8, 2.2, P.LIGHT_GREEN);
    buf.rect(2, 7, 8, 1.5, P.DARK_TEAL);

    buf.rect(3.5, 3.5, 1.5, 2, P.BLACK);
    buf.rect(7, 3.5, 1.5, 2, P.BLACK);
    buf.px(3.5, 3.5, P.CYAN);
    buf.px(7, 3.5, P.CYAN);
  }

  function drawBruteProcedural(buf, cols, rows) {
    buf.rect(1, 0, 2, 2, P.RED);
    buf.rect(9, 0, 2, 2, P.RED);
    buf.ellipse(6, 4.5, 5.4, 3.8, P.RED);
    buf.rect(2, 2, 8, 4, P.ORANGE);
    buf.rect(2, 6, 8, 1.5, P.PURPLE);

    buf.rect(3, 2.5, 2, 1.5, P.YELLOW);
    buf.rect(7, 2.5, 2, 1.5, P.YELLOW);
    buf.rect(4.5, 5, 3, 1, P.YELLOW);
  }

  function drawGemProcedural(buf, cols, rows) {
    var cx = 3.5;
    var cy = 3.5;
    var r = 3.2;
    var y, x, dx, dy;
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        dx = Math.abs(x - cx);
        dy = Math.abs(y - cy);
        if (dx + dy <= r) {
          buf.px(x, y, P.CYAN);
        }
      }
    }
    buf.rect(2.5, 2, 2, 1.5, P.WHITE);
    buf.px(2, 4, P.BLUE);
    buf.px(4, 4, P.BLUE);
  }

  var ArenaDemo = (function () {
    var player = null;
    var bullets = [];
    var enemies = [];
    var gems = [];
    var particles = [];
    var floatTexts = [];
    var floorDecals = [];
    var floorSeed = 1;

    var score = 0;
    var wave = 1;
    var spawnTimer = 0;
    var shakeEnabled = true;
    var autoFire = false;
    var showApiOverlay = false;
    var selectedSwatch = P.CYAN;
    var gameOver = false;

    function resetGame() {
      player = {
        x: ARENA.x + ARENA.w * 0.5,
        y: ARENA.y + ARENA.h * 0.5,
        r: 9,
        hp: 100,
        maxHp: 100,
        speed: 125,
        fireCooldown: 0,
        invuln: 0,
        flipX: false,
        animTimer: 0
      };
      bullets = [];
      enemies = [];
      gems = [];
      particles = [];
      floatTexts = [];
      score = 0;
      wave = 1;
      spawnTimer = 0.5;
      gameOver = false;

      generateFloorTiles();
      var i;
      for (i = 0; i < 4; i++) {
        spawnEnemy(false, true);
      }
      for (i = 0; i < 5; i++) {
        spawnGem(
          M.randRange(ARENA.x + 24, ARENA.x + ARENA.w - 24),
          M.randRange(ARENA.y + 24, ARENA.y + ARENA.h - 24)
        );
      }
      GameEngine.GUI.toast("PROCEDURAL ARENA + SFX READY!", P.CYAN, 2.5);
    }

    function generateFloorTiles() {
      floorSeed = M.randInt(1, 9999);
      floorDecals = [];
      var tileSize = 24;
      var tx, ty, hVal, cx, cy, col;
      for (ty = ARENA.y + 4; ty < ARENA.y + ARENA.h - 8; ty += tileSize) {
        for (tx = ARENA.x + 4; tx < ARENA.x + ARENA.w - 8; tx += tileSize) {
          hVal = hash2D(tx, ty, floorSeed);
          if (hVal > 0.55) {
            cx = tx + Math.floor(hash2D(tx + 11, ty + 3, floorSeed) * 14);
            cy = ty + Math.floor(hash2D(tx + 5, ty + 19, floorSeed) * 14);
            col = hVal > 0.82 ? P.DARK_BLUE : P.DARK_GRAY;
            floorDecals.push({
              x: cx,
              y: cy,
              w: hVal > 0.75 ? 4 : 2,
              h: 2,
              col: col
            });
          }
        }
      }
    }

    function spawnBurst(x, y, count, colA, colB, speedMax) {
      var i, ang, spd;
      for (i = 0; i < count; i++) {
        ang = M.randRange(0, M.TAU);
        spd = M.randRange(20, speedMax || 110);
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: M.randRange(0.2, 0.55),
          maxLife: 0.55,
          size: M.randInt(1, 3),
          col: (i % 2 === 0) ? colA : colB
        });
      }
    }

    function addFloatText(x, y, str, col) {
      floatTexts.push({
        x: x,
        y: y,
        text: str,
        col: col,
        life: 0.75
      });
    }

    function spawnGem(x, y) {
      gems.push({
        x: x,
        y: y,
        r: 7,
        bob: M.randRange(0, M.TAU)
      });
    }

    function spawnEnemy(isBrute, silent) {
      var side = M.randInt(0, 3);
      var sx, sy;
      if (side === 0) {
        sx = M.randRange(ARENA.x + 16, ARENA.x + ARENA.w - 16);
        sy = ARENA.y + 16;
      } else if (side === 1) {
        sx = M.randRange(ARENA.x + 16, ARENA.x + ARENA.w - 16);
        sy = ARENA.y + ARENA.h - 16;
      } else if (side === 2) {
        sx = ARENA.x + 16;
        sy = M.randRange(ARENA.y + 16, ARENA.y + ARENA.h - 16);
      } else {
        sx = ARENA.x + ARENA.w - 16;
        sy = M.randRange(ARENA.y + 16, ARENA.y + ARENA.h - 16);
      }

      enemies.push({
        x: sx,
        y: sy,
        r: isBrute ? 11 : 9,
        hp: isBrute ? 4 : 2,
        maxHp: isBrute ? 4 : 2,
        speed: isBrute ? M.randRange(32, 46) : M.randRange(48, 72),
        brute: !!isBrute,
        hitFlash: 0,
        wobble: M.randRange(0, M.TAU)
      });
      spawnBurst(sx, sy, 8, P.PURPLE, P.RED, 70);
      if (!silent) {
        SFX.play("spawn", { pitch: isBrute ? 0.75 : 1.05, jitter: 0.08 });
      }
    }

    function fireBullet() {
      var aimX = M.clamp(Ms.x, ARENA.x, ARENA.x + ARENA.w);
      var aimY = M.clamp(Ms.y, ARENA.y, ARENA.y + ARENA.h);
      var ang = M.angle(player.x, player.y, aimX, aimY);
      var spd = 290;
      bullets.push({
        x: player.x + Math.cos(ang) * 10,
        y: player.y + Math.sin(ang) * 10,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 3,
        life: 1.4
      });
      player.fireCooldown = 0.14;
      SFX.play("laser", { jitter: 0.07 });
      if (shakeEnabled) {
        GameEngine.Graphics.screenShake(1.5, 0.05);
      }
    }

    return {
      enter: function () {
        resetGame();
      },

      update: function (dt, totalTime) {
        if (Kb.pressed("KeyM") || Kb.pressed("m")) {
          var isMuted = SFX.toggleMute();
          GameEngine.GUI.toast(isMuted ? "SFX MUTED" : "SFX UNMUTED", P.YELLOW, 1.5);
        }

        if (Kb.pressed("Tab") || Kb.pressed("KeyH") || Kb.pressed("h")) {
          showApiOverlay = !showApiOverlay;
        }

        if (showApiOverlay) {
          return;
        }

        if (gameOver) {
          if (Kb.pressed("Space") || Kb.pressed("KeyR") || Kb.pressed("r")) {
            resetGame();
          }
          return;
        }

        var ix = 0;
        var iy = 0;
        if (Kb.down("KeyA") || Kb.down("ArrowLeft") || Kb.down("a")) { ix -= 1; }
        if (Kb.down("KeyD") || Kb.down("ArrowRight") || Kb.down("d")) { ix += 1; }
        if (Kb.down("KeyW") || Kb.down("ArrowUp") || Kb.down("w")) { iy -= 1; }
        if (Kb.down("KeyS") || Kb.down("ArrowDown") || Kb.down("s")) { iy += 1; }

        if (ix !== 0 && iy !== 0) {
          var inv = 0.70710678;
          ix *= inv;
          iy *= inv;
        }

        if (ix !== 0 || iy !== 0) {
          player.animTimer += dt * 10;
        } else {
          player.animTimer = 0;
        }

        if (Ms.x < player.x) { player.flipX = true; }
        if (Ms.x > player.x) { player.flipX = false; }

        player.x += ix * player.speed * dt;
        player.y += iy * player.speed * dt;
        player.x = M.clamp(player.x, ARENA.x + 14, ARENA.x + ARENA.w - 14);
        player.y = M.clamp(player.y, ARENA.y + 14, ARENA.y + ARENA.h - 14);

        if (player.invuln > 0) { player.invuln -= dt; }
        if (player.fireCooldown > 0) { player.fireCooldown -= dt; }

        var mouseInArena = M.pointInRect(Ms.x, Ms.y, ARENA.x, ARENA.y, ARENA.w, ARENA.h);
        var wantsShoot = (mouseInArena && Ms.down) || Kb.down("Space") || autoFire;
        if (wantsShoot && player.fireCooldown <= 0) {
          fireBullet();
        }

        wave = 1 + Math.floor(score / 150);
        spawnTimer -= dt;
        if (spawnTimer <= 0 && enemies.length < 14) {
          spawnEnemy(Math.random() < Math.min(0.45, wave * 0.08), true);
          spawnTimer = Math.max(0.75, 2.3 - wave * 0.15);
        }

        var i, j, b, e, g, p, ft;
        for (i = bullets.length - 1; i >= 0; i--) {
          b = bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life -= dt;

          if (!M.pointInRect(b.x, b.y, ARENA.x + 4, ARENA.y + 4, ARENA.w - 8, ARENA.h - 8) || b.life <= 0) {
            spawnBurst(b.x, b.y, 4, P.YELLOW, P.ORANGE, 50);
            bullets.splice(i, 1);
            continue;
          }

          var hit = false;
          for (j = enemies.length - 1; j >= 0; j--) {
            e = enemies[j];
            if (M.circleIntersect(b.x, b.y, b.r, e.x, e.y, e.r)) {
              e.hp -= 1;
              e.hitFlash = 0.1;
              hit = true;
              spawnBurst(b.x, b.y, 6, P.YELLOW, P.WHITE, 80);

              if (e.hp <= 0) {
                var pts = e.brute ? 30 : 15;
                score += pts;
                addFloatText(e.x, e.y - 8, "+" + pts, P.YELLOW);
                spawnBurst(e.x, e.y, 14, e.brute ? P.RED : P.LIGHT_GREEN, P.ORANGE, 120);
                spawnGem(e.x, e.y);
                SFX.play("explosion", { pitch: e.brute ? 0.72 : 1.05, jitter: 0.1 });
                if (shakeEnabled) {
                  GameEngine.Graphics.screenShake(e.brute ? 5 : 3, 0.14);
                }
                enemies.splice(j, 1);
              } else {
                SFX.play("hit", { pitch: e.brute ? 0.85 : 1.1, jitter: 0.1 });
              }
              break;
            }
          }
          if (hit) {
            bullets.splice(i, 1);
          }
        }

        for (i = enemies.length - 1; i >= 0; i--) {
          e = enemies[i];
          e.wobble += dt * 7;
          if (e.hitFlash > 0) { e.hitFlash -= dt; }

          var angToPlayer = M.angle(e.x, e.y, player.x, player.y);
          e.x += Math.cos(angToPlayer) * e.speed * dt;
          e.y += Math.sin(angToPlayer) * e.speed * dt;

          for (j = 0; j < enemies.length; j++) {
            if (i === j) { continue; }
            var other = enemies[j];
            var d = M.dist(e.x, e.y, other.x, other.y);
            var minD = e.r + other.r;
            if (d > 0 && d < minD) {
              var push = (minD - d) * 0.5;
              var sepAng = M.angle(other.x, other.y, e.x, e.y);
              e.x += Math.cos(sepAng) * push;
              e.y += Math.sin(sepAng) * push;
            }
          }

          if (M.circleIntersect(e.x, e.y, e.r, player.x, player.y, player.r)) {
            if (player.invuln <= 0) {
              player.hp = Math.max(0, player.hp - (e.brute ? 20 : 12));
              player.invuln = 0.7;
              addFloatText(player.x, player.y - 12, "-HP", P.RED);
              spawnBurst(player.x, player.y, 12, P.RED, P.ORANGE, 110);
              if (shakeEnabled) {
                GameEngine.Graphics.screenShake(6, 0.22);
              }
              if (player.hp <= 0) {
                gameOver = true;
                SFX.play("gameover");
                GameEngine.GUI.toast("DEFEATED! PRESS [R] OR RETRY", P.RED, 4.0);
              } else {
                SFX.play("hurt", { jitter: 0.08 });
              }
            }
          }
        }

        for (i = gems.length - 1; i >= 0; i--) {
          g = gems[i];
          g.bob += dt * 5;
          var distP = M.dist(g.x, g.y, player.x, player.y);
          if (distP < 48) {
            var pullAng = M.angle(g.x, g.y, player.x, player.y);
            g.x += Math.cos(pullAng) * 140 * dt;
            g.y += Math.sin(pullAng) * 140 * dt;
          }
          if (M.circleIntersect(g.x, g.y, g.r, player.x, player.y, player.r + 3)) {
            score += 10;
            player.hp = Math.min(player.maxHp, player.hp + 4);
            addFloatText(g.x, g.y - 6, "+10 GEM", P.CYAN);
            spawnBurst(g.x, g.y, 8, P.CYAN, P.WHITE, 75);
            SFX.play("pickup", { jitter: 0.06 });
            gems.splice(i, 1);
            if (gems.length < 3) {
              spawnGem(
                M.randRange(ARENA.x + 24, ARENA.x + ARENA.w - 24),
                M.randRange(ARENA.y + 24, ARENA.y + ARENA.h - 24)
              );
            }
          }
        }

        for (i = particles.length - 1; i >= 0; i--) {
          p = particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.life -= dt;
          if (p.life <= 0) {
            particles.splice(i, 1);
          }
        }

        for (i = floatTexts.length - 1; i >= 0; i--) {
          ft = floatTexts[i];
          ft.y -= 22 * dt;
          ft.life -= dt;
          if (ft.life <= 0) {
            floatTexts.splice(i, 1);
          }
        }
      },

      draw: function (gfx, gui) {
        var W = gfx.getWidth();
        var H = gfx.getHeight();

        gfx.clear(P.BLACK);

        gfx.rect(0, 0, W, 20, P.DARK_GRAY);
        gfx.rect(0, 20, W, 1, P.GRAY);
        gfx.text("GAMEENGINE.JS [ES5]", 8, 6, P.YELLOW, 1, "left", P.BLACK);
        gfx.text(SFX.isMuted() ? "SFX:MUTE" : "SFX:ON", 158, 6, SFX.isMuted() ? P.RED : P.CYAN, 1, "left", P.BLACK);
        gfx.text("WAVE " + wave, 315, 6, P.LIGHT_GREEN, 1, "left", P.BLACK);
        gfx.text("SCORE: " + score, 382, 6, P.WHITE, 1, "left", P.BLACK);
        gfx.text("FPS:" + GameEngine.Core.getFPS(), W - 8, 6, P.ORANGE, 1, "right", P.BLACK);

        gfx.rect(ARENA.x, ARENA.y, ARENA.w, ARENA.h, P.DARK_TEAL);
        gfx.rect(ARENA.x + 2, ARENA.y + 2, ARENA.w - 4, ARENA.h - 4, P.BLACK);

        var gx, gy;
        for (gx = ARENA.x + 24; gx < ARENA.x + ARENA.w; gx += 24) {
          gfx.line(gx, ARENA.y + 2, gx, ARENA.y + ARENA.h - 2, P.DARK_GRAY, 1);
        }
        for (gy = ARENA.y + 24; gy < ARENA.y + ARENA.h; gy += 24) {
          gfx.line(ARENA.x + 2, gy, ARENA.x + ARENA.w - 2, gy, P.DARK_GRAY, 1);
        }

        var i, d;
        for (i = 0; i < floorDecals.length; i++) {
          d = floorDecals[i];
          gfx.rect(d.x, d.y, d.w, d.h, d.col);
        }

        gfx.rectOutline(ARENA.x, ARENA.y, ARENA.w, ARENA.h, P.LIGHT_GRAY, 2);

        var g, bobY;
        for (i = 0; i < gems.length; i++) {
          g = gems[i];
          bobY = Math.sin(g.bob) * 2;
          gfx.circle(g.x, g.y + 6, 5, P.DARK_BLUE);
          gfx.proceduralSprite("gem", 8, 8, g.x - 8, g.y - 8 + bobY, 2, false, drawGemProcedural);
        }

        var e, bobScale;
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          bobScale = Math.sin(e.wobble) * 1.5;
          gfx.circle(e.x, e.y + 7, e.r - 1, P.DARK_BLUE);

          if (e.hitFlash > 0) {
            gfx.circle(e.x, e.y, e.r, P.WHITE);
          } else if (e.brute) {
            gfx.proceduralSprite("brute", 12, 8, e.x - 12, e.y - 8 + bobScale, 2, e.x > player.x, drawBruteProcedural);
          } else {
            gfx.proceduralSprite("slime", 12, 9, e.x - 12, e.y - 9 + bobScale, 2, e.x > player.x, drawSlimeProcedural);
          }

          if (e.hp < e.maxHp) {
            gui.progressBar(e.x - 10, e.y - e.r - 7, 20, 4, e.hp / e.maxHp, P.RED, P.BLACK);
          }
        }

        var blinkHide = (player.invuln > 0) && (Math.floor(player.invuln * 20) % 2 === 0);
        if (!blinkHide) {
          var isRun = (Math.floor(player.animTimer) % 2 === 1);
          gfx.circle(player.x, player.y + 9, 8, P.DARK_BLUE);
          gfx.proceduralSprite(
            isRun ? "hero_run" : "hero_idle",
            13,
            12,
            player.x - 13,
            player.y - 12,
            2,
            player.flipX,
            function (buf, cols, rows) {
              drawHeroProcedural(buf, cols, rows, isRun);
            }
          );
        }

        if (M.pointInRect(Ms.x, Ms.y, ARENA.x, ARENA.y, ARENA.w, ARENA.h) && !gameOver) {
          var aimAng = M.angle(player.x, player.y, Ms.x, Ms.y);
          var tipX = player.x + Math.cos(aimAng) * 16;
          var tipY = player.y + Math.sin(aimAng) * 16;
          gfx.line(tipX, tipY, Ms.x, Ms.y, P.DARK_GRAY, 1);
          gfx.circleOutline(Ms.x, Ms.y, 5, P.YELLOW, 1);
          gfx.pixel(Ms.x, Ms.y, P.RED);
        }

        var b;
        for (i = 0; i < bullets.length; i++) {
          b = bullets[i];
          gfx.circle(b.x, b.y, b.r + 1, P.ORANGE);
          gfx.circle(b.x, b.y, b.r - 1, P.WHITE);
        }

        var p, ft;
        for (i = 0; i < particles.length; i++) {
          p = particles[i];
          gfx.rect(p.x, p.y, p.size, p.size, p.col);
        }
        for (i = 0; i < floatTexts.length; i++) {
          ft = floatTexts[i];
          gfx.text(ft.text, ft.x, ft.y, ft.col, 1, "center", P.BLACK);
        }

        gfx.text("[WASD] MOVE  [MOUSE/SPACE] FIRE  [M] MUTE  [H] DOCS", ARENA.x + 6, ARENA.y + ARENA.h - 11, P.LIGHT_GRAY, 1, "left", P.BLACK);

        if (gameOver) {
          var bx = ARENA.x + 76;
          var by = ARENA.y + 110;
          gui.panel(bx, by, 280, 96, "GAME OVER", P.DARK_BLUE, P.RED);
          gui.label("FINAL SCORE: " + score + " (WAVE " + wave + ")", bx + 140, by + 26, P.YELLOW, "center");
          gui.label("PRESS [R] OR CLICK BELOW", bx + 140, by + 42, P.LIGHT_GRAY, "center");
          if (gui.button("btn_retry", bx + 75, by + 60, 130, 22, "PLAY AGAIN", P.GREEN)) {
            resetGame();
          }
        }

        var px = 448;
        var py = 26;
        var pw = 184;
        var ph = 326;
        gui.panel(px, py, pw, ph, "ENGINE GUI & SFX", P.DARK_BLUE, P.GRAY);

        gui.label("PLAYER HULL INTEGRITY:", px + 8, py + 19, P.LIGHT_GRAY);
        var hpRatio = player.hp / player.maxHp;
        var hpColor = hpRatio > 0.5 ? P.GREEN : (hpRatio > 0.25 ? P.ORANGE : P.RED);
        gui.progressBar(px + 8, py + 30, pw - 16, 13, hpRatio, hpColor, P.BLACK, player.hp + " / " + player.maxHp + " HP");

        player.speed = gui.slider("sld_speed", px + 8, py + 50, pw - 16, 60, 240, player.speed, "MOVE SPEED");
        SFX.setVolume(gui.slider("sld_vol", px + 8, py + 72, pw - 16, 0, 100, SFX.getVolume() * 100, "SFX VOLUME") * 0.01);

        shakeEnabled = gui.checkbox("chk_shake", px + 8, py + 96, "SCREEN SHAKE", shakeEnabled);
        autoFire = gui.checkbox("chk_auto", px + 8, py + 111, "AUTO-FIRE TURRET", autoFire);
        SFX.setMuted(gui.checkbox("chk_mute", px + 8, py + 126, "MUTE SFX [M]", SFX.isMuted()));

        if (gui.button("btn_spawn", px + 8, py + 143, 81, 19, "+ SLIME", P.GREEN)) {
          spawnEnemy(false, false);
          gui.toast("SPAWNED SLIME!", P.LIGHT_GREEN, 1.4);
        }
        if (gui.button("btn_brute", px + 95, py + 143, 81, 19, "+ BRUTE", P.RED)) {
          spawnEnemy(true, false);
          gui.toast("SPAWNED BRUTE!", P.ORANGE, 1.4);
        }

        if (gui.button("btn_heal", px + 8, py + 165, 81, 19, "HEAL +25", P.DARK_TEAL)) {
          player.hp = Math.min(player.maxHp, player.hp + 25);
          spawnBurst(player.x, player.y, 10, P.LIGHT_GREEN, P.WHITE, 70);
          SFX.play("heal");
          gui.toast("REPAIRED +25 HP", P.LIGHT_GREEN, 1.4);
        }
        if (gui.button("btn_docs", px + 95, py + 165, 81, 19, "API DOCS", P.PURPLE)) {
          showApiOverlay = true;
        }

        gui.label("SWEETIE-16 SWATCHES:", px + 8, py + 190, P.YELLOW);
        var idx, colX, colY, swW = 20, swH = 14;
        for (idx = 0; idx < 16; idx++) {
          colX = px + 8 + (idx % 8) * (swW + 1);
          colY = py + 200 + Math.floor(idx / 8) * (swH + 2);
          gfx.rect(colX, colY, swW, swH, idx);
          var swatchHover = M.pointInRect(Ms.x, Ms.y, colX, colY, swW, swH);
          if (swatchHover && Ms.pressed) {
            selectedSwatch = idx;
            SFX.tone({ type: "triangle", freq: 330 + idx * 35, duration: 0.06, gain: 0.18 });
            gui.toast("COLOR #" + idx + ": " + P.NAMES[idx], idx === 0 ? P.WHITE : idx, 1.6);
          }
          if (selectedSwatch === idx || swatchHover) {
            gfx.rectOutline(colX, colY, swW, swH, idx === 0 ? P.WHITE : (idx === P.WHITE ? P.BLACK : P.WHITE), 1);
          }
        }

        var selHex = P.COLORS[selectedSwatch].toUpperCase();
        var selName = P.NAMES[selectedSwatch];
        gfx.rect(px + 8, py + 235, pw - 16, 20, P.BLACK);
        gfx.rect(px + 11, py + 238, 14, 14, selectedSwatch);
        gfx.rectOutline(px + 11, py + 238, 14, 14, P.WHITE, 1);
        gui.label("#" + selectedSwatch + " " + selName, px + 30, py + 237, P.WHITE);
        gui.label(selHex, px + 30, py + 245, P.CYAN);

        gfx.rect(px + 8, py + 259, pw - 16, 36, P.BLACK);
        gfx.rectOutline(px + 8, py + 259, pw - 16, 36, P.DARK_GRAY, 1);
        gui.label("MOUSE: " + Math.round(Ms.x) + "," + Math.round(Ms.y), px + 13, py + 263, P.LIGHT_GRAY);
        gui.label("ENTS: " + (enemies.length + bullets.length + gems.length) + "  PRT: " + particles.length, px + 13, py + 273, P.LIGHT_GRAY);
        gui.label("SFX VOL: " + Math.round(SFX.getVolume() * 100) + "%", px + 13, py + 283, P.ORANGE);

        if (gui.button("btn_reset", px + 8, py + 299, pw - 16, 19, "RESET ARENA", P.DARK_GRAY)) {
          resetGame();
        }

        gui._renderToasts(ARENA.x + ARENA.w * 0.5, ARENA.y + 10);

        if (showApiOverlay) {
          gfx.rect(24, 28, W - 48, H - 44, P.BLACK);
          gui.panel(20, 24, W - 40, H - 40, "GAMEENGINE ES5 ARCHITECTURE & API REFERENCE", P.DARK_BLUE, P.CYAN);

          var ly = 44;
          var step = 15;
          gui.label("1. GameEngine.Palette", 32, ly, P.YELLOW);
          gui.label("16 Sweetie-16 colors by index (0..15) or name (e.g. Palette.CYAN)", 180, ly, P.WHITE);
          ly += step;

          gui.label("2. GameEngine.Math", 32, ly, P.YELLOW);
          gui.label("clamp, lerp, dist, distSq, angle, randRange, randInt, intersect", 180, ly, P.WHITE);
          ly += step;

          gui.label("3. GameEngine.Input", 32, ly, P.YELLOW);
          gui.label("Keyboard.down/pressed/released & scaled Mouse.x/y/down/pressed", 180, ly, P.WHITE);
          ly += step;

          gui.label("4. GameEngine.SFX", 32, ly, P.YELLOW);
          gui.label("Procedural WebAudio synth: play, tone, noise, register, setVolume, mute", 180, ly, P.WHITE);
          ly += step;

          gui.label("5. GameEngine.Graphics", 32, ly, P.YELLOW);
          gui.label("rect, circle, line, pixel, proceduralSprite, text, screenShake", 180, ly, P.WHITE);
          ly += step;

          gui.label("6. GameEngine.GUI", 32, ly, P.YELLOW);
          gui.label("Immediate-mode panel, label, button, checkbox, slider, progressBar, toast", 180, ly, P.WHITE);
          ly += step + 8;

          gfx.rect(32, ly, W - 64, 132, P.BLACK);
          gfx.rectOutline(32, ly, W - 64, 132, P.GRAY, 1);
          gui.label("// EXAMPLE ES5 SFX USAGE:", 42, ly + 8, P.LIGHT_GREEN);
          gui.label("GameEngine.SFX.play('laser', { jitter: 0.06 });", 42, ly + 24, P.CYAN);
          gui.label("GameEngine.SFX.tone({ type: 'square', freq: 520, freqEnd: 880, duration: 0.08 });", 42, ly + 39, P.LIGHT_GRAY);
          gui.label("GameEngine.SFX.noise({ filterType: 'lowpass', freq: 900, duration: 0.2 });", 42, ly + 54, P.LIGHT_GRAY);
          gui.label("GameEngine.SFX.register('dash', function(ctx, t, pitch) { /* ... */ });", 42, ly + 69, P.LIGHT_GRAY);

          if (gui.button("btn_close_docs", Math.floor(W * 0.5) - 70, H - 46, 140, 22, "RESUME ARENA [H]", P.GREEN)) {
            showApiOverlay = false;
          }
        }
      }
    };
  })();

  window.addEventListener("load", function () {
    var canvas = document.getElementById("engine-canvas");
    GameEngine.Core.init(canvas, 640, 360);
    GameEngine.Core.setState(ArenaDemo);
    GameEngine.Core.start();
  }, false);
})();
