/* =========================================================================
   INTERACTIVE SHOWCASE: "SWEETIE-16 ARENA"
   Demonstrates Palette, Graphics Sprites/Text, Math, Keyboard, Mouse & GUI.
   ========================================================================= */
(function () {
  "use strict";

  var P = GameEngine.Palette;
  var M = GameEngine.Math;
  var Kb = GameEngine.Input.Keyboard;
  var Ms = GameEngine.Input.Mouse;

  var SPRITE_HERO_IDLE = [
    "...aaaa...",
    "..abbbba..",
    "..acccca..",
    ".acfcfcfa.",
    ".acccccca.",
    "..a4444a..",
    ".a999999a.",
    "a9a9999a9a",
    "a4a9999a4a",
    "..a8888a..",
    "..a8..8a..",
    ".a22..22a."
  ];

  var SPRITE_HERO_RUN = [
    "...aaaa...",
    "..abbbba..",
    "..acccca..",
    ".acfcfcfa.",
    ".acccccca.",
    "..a4444a..",
    ".a999999a.",
    "a9a9999a9a",
    "a4a9999a4a",
    "..a8888a..",
    ".a8a..a8a.",
    "a22....22a"
  ];

  var SPRITE_SLIME = [
    "....6666....",
    "..66555566..",
    ".6555555556.",
    "655c055c0556",
    "655005500556",
    "655555555556",
    "665555555566",
    "766666666667",
    ".7777777777."
  ];

  var SPRITE_BRUTE = [
    "..11222211..",
    ".1223333221.",
    "123342243321",
    "123322223321",
    "122224422221",
    "122333333221",
    "112222222211",
    ".1111111111."
  ];

  var SPRITE_GEM = [
    "...bb...",
    "..baab..",
    ".bacacb.",
    "baccacab",
    ".bacacb.",
    "..baab..",
    "...bb..."
  ];

  var ARENA = {
    x: 8,
    y: 26,
    w: 432,
    h: 326
  };

  var ArenaDemo = (function () {
    var player = null;
    var bullets = [];
    var enemies = [];
    var gems = [];
    var particles = [];
    var floatTexts = [];
    var floorDecals = [];

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
        spawnEnemy(false);
      }
      for (i = 0; i < 5; i++) {
        spawnGem(
          M.randRange(ARENA.x + 24, ARENA.x + ARENA.w - 24),
          M.randRange(ARENA.y + 24, ARENA.y + ARENA.h - 24)
        );
      }
      GameEngine.GUI.toast("ARENA READY! WASD + MOUSE TO PLAY", P.CYAN, 2.5);
    }

    function generateFloorTiles() {
      floorDecals = [];
      var i;
      for (i = 0; i < 36; i++) {
        floorDecals.push({
          x: M.randInt(ARENA.x + 12, ARENA.x + ARENA.w - 16),
          y: M.randInt(ARENA.y + 12, ARENA.y + ARENA.h - 16),
          w: M.randInt(2, 6),
          h: M.randInt(2, 4),
          col: (i % 3 === 0) ? P.DARK_BLUE : P.BLACK
        });
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

    function spawnEnemy(isBrute) {
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
      if (shakeEnabled) {
        GameEngine.Graphics.screenShake(1.5, 0.05);
      }
    }

    return {
      enter: function () {
        resetGame();
      },

      update: function (dt, totalTime) {
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
          spawnEnemy(Math.random() < Math.min(0.45, wave * 0.08));
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
                if (shakeEnabled) {
                  GameEngine.Graphics.screenShake(e.brute ? 5 : 3, 0.14);
                }
                enemies.splice(j, 1);
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
                GameEngine.GUI.toast("DEFEATED! PRESS [R] OR RETRY", P.RED, 4.0);
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
        gfx.text("SWEETIE-16 PALETTE", 158, 6, P.CYAN, 1, "left", P.BLACK);
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
          gfx.sprite(SPRITE_GEM, g.x - 8, g.y - 7 + bobY, 2, false, "gem");
        }

        var e, spr, sprKey, bobScale;
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          bobScale = Math.sin(e.wobble) * 1.5;
          gfx.circle(e.x, e.y + 7, e.r - 1, P.DARK_BLUE);

          if (e.hitFlash > 0) {
            gfx.circle(e.x, e.y, e.r, P.WHITE);
          } else {
            spr = e.brute ? SPRITE_BRUTE : SPRITE_SLIME;
            sprKey = e.brute ? "brute" : "slime";
            var sw = spr[0].length * 2;
            var sh = spr.length * 2;
            gfx.sprite(spr, e.x - sw * 0.5, e.y - sh * 0.5 + bobScale, 2, e.x > player.x, sprKey);
          }

          if (e.hp < e.maxHp) {
            gui.progressBar(e.x - 10, e.y - e.r - 7, 20, 4, e.hp / e.maxHp, P.RED, P.BLACK);
          }
        }

        var blinkHide = (player.invuln > 0) && (Math.floor(player.invuln * 20) % 2 === 0);
        if (!blinkHide) {
          gfx.circle(player.x, player.y + 9, 8, P.DARK_BLUE);
          var heroFrame = (Math.floor(player.animTimer) % 2 === 1) ? SPRITE_HERO_RUN : SPRITE_HERO_IDLE;
          var heroKey = (Math.floor(player.animTimer) % 2 === 1) ? "hero_run" : "hero_idle";
          gfx.sprite(heroFrame, player.x - 10, player.y - 12, 2, player.flipX, heroKey);
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

        gfx.text("[WASD/ARROWS] MOVE   [MOUSE/SPACE] FIRE   [H] ENGINE DOCS", ARENA.x + 6, ARENA.y + ARENA.h - 11, P.LIGHT_GRAY, 1, "left", P.BLACK);

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
        gui.panel(px, py, pw, ph, "ENGINE GUI & PALETTE", P.DARK_BLUE, P.GRAY);

        gui.label("PLAYER HULL INTEGRITY:", px + 8, py + 19, P.LIGHT_GRAY);
        var hpRatio = player.hp / player.maxHp;
        var hpColor = hpRatio > 0.5 ? P.GREEN : (hpRatio > 0.25 ? P.ORANGE : P.RED);
        gui.progressBar(px + 8, py + 30, pw - 16, 13, hpRatio, hpColor, P.BLACK, player.hp + " / " + player.maxHp + " HP");

        player.speed = gui.slider("sld_speed", px + 8, py + 50, pw - 16, 60, 240, player.speed, "MOVE SPEED");

        shakeEnabled = gui.checkbox("chk_shake", px + 8, py + 74, "SCREEN SHAKE", shakeEnabled);
        autoFire = gui.checkbox("chk_auto", px + 8, py + 90, "AUTO-FIRE TURRET", autoFire);

        if (gui.button("btn_spawn", px + 8, py + 108, 81, 20, "+ SLIME", P.GREEN)) {
          spawnEnemy(false);
          gui.toast("SPAWNED SLIME!", P.LIGHT_GREEN, 1.4);
        }
        if (gui.button("btn_brute", px + 95, py + 108, 81, 20, "+ BRUTE", P.RED)) {
          spawnEnemy(true);
          gui.toast("SPAWNED BRUTE!", P.ORANGE, 1.4);
        }

        if (gui.button("btn_heal", px + 8, py + 133, 81, 20, "HEAL +25", P.DARK_TEAL)) {
          player.hp = Math.min(player.maxHp, player.hp + 25);
          spawnBurst(player.x, player.y, 10, P.LIGHT_GREEN, P.WHITE, 70);
          gui.toast("REPAIRED +25 HP", P.LIGHT_GREEN, 1.4);
        }
        if (gui.button("btn_docs", px + 95, py + 133, 81, 20, "API DOCS", P.PURPLE)) {
          showApiOverlay = true;
        }

        gui.label("SWEETIE-16 SWATCHES:", px + 8, py + 161, P.YELLOW);
        var idx, colX, colY, swW = 20, swH = 16;
        for (idx = 0; idx < 16; idx++) {
          colX = px + 8 + (idx % 8) * (swW + 1);
          colY = py + 173 + Math.floor(idx / 8) * (swH + 2);
          gfx.rect(colX, colY, swW, swH, idx);
          var swatchHover = M.pointInRect(Ms.x, Ms.y, colX, colY, swW, swH);
          if (swatchHover && Ms.pressed) {
            selectedSwatch = idx;
            gui.toast("COLOR #" + idx + ": " + P.NAMES[idx], idx === 0 ? P.WHITE : idx, 1.6);
          }
          if (selectedSwatch === idx || swatchHover) {
            gfx.rectOutline(colX, colY, swW, swH, idx === P.WHITE ? P.BLACK : P.WHITE, 1);
          }
        }

        var selHex = P.COLORS[selectedSwatch].toUpperCase();
        var selName = P.NAMES[selectedSwatch];
        gfx.rect(px + 8, py + 212, pw - 16, 22, P.BLACK);
        gfx.rect(px + 11, py + 215, 16, 16, selectedSwatch);
        gfx.rectOutline(px + 11, py + 215, 16, 16, P.WHITE, 1);
        gui.label("#" + selectedSwatch + " " + selName, px + 32, py + 215, P.WHITE);
        gui.label(selHex, px + 32, py + 224, P.CYAN);

        gfx.rect(px + 8, py + 240, pw - 16, 52, P.BLACK);
        gfx.rectOutline(px + 8, py + 240, pw - 16, 52, P.DARK_GRAY, 1);
        gui.label("INPUT TELEMETRY:", px + 13, py + 245, P.ORANGE);
        gui.label("MOUSE: " + Math.round(Ms.x) + "," + Math.round(Ms.y), px + 13, py + 256, P.LIGHT_GRAY);
        gui.label("ENTITIES: " + (enemies.length + bullets.length + gems.length), px + 13, py + 267, P.LIGHT_GRAY);
        gui.label("PARTICLES: " + particles.length, px + 13, py + 278, P.LIGHT_GRAY);

        if (gui.button("btn_reset", px + 8, py + 298, pw - 16, 20, "RESET ARENA", P.DARK_GRAY)) {
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

          gui.label("4. GameEngine.Graphics", 32, ly, P.YELLOW);
          gui.label("clear, rect, rectOutline, circle, line, pixel, sprite, text, screenShake", 180, ly, P.WHITE);
          ly += step;

          gui.label("5. GameEngine.GUI", 32, ly, P.YELLOW);
          gui.label("Immediate-mode panel, label, button, checkbox, slider, progressBar, toast", 180, ly, P.WHITE);
          ly += step;

          gui.label("6. GameEngine.Core", 32, ly, P.YELLOW);
          gui.label("requestAnimationFrame loop, delta-time clamping, FPS, nearest-neighbor", 180, ly, P.WHITE);
          ly += step + 8;

          gfx.rect(32, ly, W - 64, 132, P.BLACK);
          gfx.rectOutline(32, ly, W - 64, 132, P.GRAY, 1);
          gui.label("// EXAMPLE ES5 STATE USAGE:", 42, ly + 8, P.LIGHT_GREEN);
          gui.label("var MyGame = {", 42, ly + 22, P.CYAN);
          gui.label("  update: function(dt) {", 42, ly + 35, P.WHITE);
          gui.label("    if (GameEngine.Input.Keyboard.down('KeyD')) { player.x += 120 * dt; }", 42, ly + 48, P.LIGHT_GRAY);
          gui.label("  },", 42, ly + 61, P.WHITE);
          gui.label("  draw: function(gfx, gui) {", 42, ly + 74, P.WHITE);
          gui.label("    gfx.clear(GameEngine.Palette.BLACK);", 42, ly + 87, P.LIGHT_GRAY);
          gui.label("    if (gui.button('id', 10, 10, 80, 20, 'CLICK ME')) { /* ... */ }", 42, ly + 100, P.LIGHT_GRAY);
          gui.label("  }", 42, ly + 113, P.WHITE);
          gui.label("};", 42, ly + 122, P.CYAN);

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
