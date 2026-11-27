/* =========================================================================
   PURE ES5 PROCEDURAL IN-CANVAS 2D GAME ENGINE (SWEETIE-16 EDITION)
   Strict ES5: var, function, IIFEs, zero ES6+ features, zero dependencies.
   ========================================================================= */

var GameEngine = (function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1. GameEngine.Palette — Exact 16-color Sweetie-16 Palette by GrafxKid
     ----------------------------------------------------------------------- */
  var Palette = (function () {
    var colors = [
      "#1a1c2c", // 0: BLACK
      "#5d275d", // 1: PURPLE
      "#b13e53", // 2: RED
      "#ef7d57", // 3: ORANGE
      "#ffcd75", // 4: YELLOW
      "#a7f070", // 5: LIGHT_GREEN
      "#38b764", // 6: GREEN
      "#257179", // 7: DARK_TEAL
      "#29366f", // 8: DARK_BLUE
      "#3b5dc9", // 9: BLUE
      "#41a6f6", // 10: LIGHT_BLUE
      "#73eff7", // 11: CYAN
      "#f4f4f4", // 12: WHITE
      "#94b0c2", // 13: LIGHT_GRAY
      "#566c86", // 14: GRAY
      "#333c57"  // 15: DARK_GRAY
    ];

    var names = [
      "BLACK", "PURPLE", "RED", "ORANGE",
      "YELLOW", "LIGHT_GREEN", "GREEN", "DARK_TEAL",
      "DARK_BLUE", "BLUE", "LIGHT_BLUE", "CYAN",
      "WHITE", "LIGHT_GRAY", "GRAY", "DARK_GRAY"
    ];

    var api = {
      COLORS: colors,
      NAMES: names,
      COUNT: 16,
      BLACK: 0,
      PURPLE: 1,
      RED: 2,
      ORANGE: 3,
      YELLOW: 4,
      LIGHT_GREEN: 5,
      GREEN: 6,
      DARK_TEAL: 7,
      DARK_BLUE: 8,
      BLUE: 9,
      LIGHT_BLUE: 10,
      CYAN: 11,
      WHITE: 12,
      LIGHT_GRAY: 13,
      GRAY: 14,
      DARK_GRAY: 15,
      get: function (idxOrHex) {
        if (typeof idxOrHex === "string") {
          return idxOrHex;
        }
        var i = (idxOrHex | 0);
        if (i < 0) { i = 0; }
        if (i > 15) { i = 15; }
        return colors[i];
      }
    };

    return api;
  })();

  /* -----------------------------------------------------------------------
     2. GameEngine.Math — Procedural 2D Math & Collision Utilities
     ----------------------------------------------------------------------- */
  var EngineMath = (function () {
    return {
      PI: Math.PI,
      TAU: Math.PI * 2,

      clamp: function (val, min, max) {
        if (val < min) { return min; }
        if (val > max) { return max; }
        return val;
      },

      lerp: function (a, b, t) {
        return a + (b - a) * t;
      },

      distSq: function (x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return dx * dx + dy * dy;
      },

      dist: function (x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
      },

      angle: function (x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
      },

      randRange: function (min, max) {
        return min + Math.random() * (max - min);
      },

      randInt: function (min, max) {
        return Math.floor(min + Math.random() * (max - min + 1));
      },

      rectIntersect: function (ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw &&
               ax + aw > bx &&
               ay < by + bh &&
               ay + ah > by;
      },

      circleIntersect: function (ax, ay, ar, bx, by, br) {
        var rSum = ar + br;
        var dx = bx - ax;
        var dy = by - ay;
        return (dx * dx + dy * dy) <= (rSum * rSum);
      },

      pointInRect: function (px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
      }
    };
  })();

  /* -----------------------------------------------------------------------
     3. GameEngine.Input — Keyboard & Logical-Coordinate Mouse Handling
     ----------------------------------------------------------------------- */
  var Input = (function () {
    var keysDown = {};
    var keysPressed = {};
    var keysReleased = {};

    var preventKeys = {
      "ArrowUp": true,
      "ArrowDown": true,
      "ArrowLeft": true,
      "ArrowRight": true,
      "Space": true,
      " ": true
    };

    function normalizeKey(e) {
      if (e.code) { return e.code; }
      return e.key || String(e.keyCode);
    }

    function normalizeAlias(e) {
      return e.key ? e.key.toLowerCase() : "";
    }

    var Keyboard = {
      _init: function () {
        window.addEventListener("keydown", function (e) {
          var code = normalizeKey(e);
          var alias = normalizeAlias(e);
          if (preventKeys[code] || preventKeys[e.key]) {
            e.preventDefault();
          }
          if (!keysDown[code]) {
            keysPressed[code] = true;
          }
          keysDown[code] = true;

          if (alias) {
            if (!keysDown[alias]) {
              keysPressed[alias] = true;
            }
            keysDown[alias] = true;
          }
        }, false);

        window.addEventListener("keyup", function (e) {
          var code = normalizeKey(e);
          var alias = normalizeAlias(e);
          keysDown[code] = false;
          keysReleased[code] = true;
          if (alias) {
            keysDown[alias] = false;
            keysReleased[alias] = true;
          }
        }, false);

        window.addEventListener("blur", function () {
          keysDown = {};
          keysPressed = {};
          keysReleased = {};
        }, false);
      },

      down: function (key) {
        return !!keysDown[key];
      },

      pressed: function (key) {
        return !!keysPressed[key];
      },

      released: function (key) {
        return !!keysReleased[key];
      },

      _endFrame: function () {
        keysPressed = {};
        keysReleased = {};
      }
    };

    var Mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      down: false,
      pressed: false,
      released: false,
      rightDown: false,
      rightPressed: false,
      wheel: 0,
      _canvas: null,
      _logicalW: 640,
      _logicalH: 360,

      _updatePos: function (clientX, clientY) {
        if (!this._canvas) { return; }
        var rect = this._canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) { return; }
        var scaleX = this._logicalW / rect.width;
        var scaleY = this._logicalH / rect.height;
        var nx = (clientX - rect.left) * scaleX;
        var ny = (clientY - rect.top) * scaleY;
        nx = EngineMath.clamp(nx, 0, this._logicalW);
        ny = EngineMath.clamp(ny, 0, this._logicalH);
        this.dx += (nx - this.x);
        this.dy += (ny - this.y);
        this.x = nx;
        this.y = ny;
      },

      _init: function (canvas, logicalW, logicalH) {
        var self = this;
        this._canvas = canvas;
        this._logicalW = logicalW;
        this._logicalH = logicalH;
        this.x = logicalW * 0.5;
        this.y = logicalH * 0.5;

        window.addEventListener("mousemove", function (e) {
          self._updatePos(e.clientX, e.clientY);
        }, false);

        canvas.addEventListener("mousedown", function (e) {
          self._updatePos(e.clientX, e.clientY);
          if (e.button === 0) {
            if (!self.down) { self.pressed = true; }
            self.down = true;
          } else if (e.button === 2) {
            if (!self.rightDown) { self.rightPressed = true; }
            self.rightDown = true;
          }
        }, false);

        window.addEventListener("mouseup", function (e) {
          self._updatePos(e.clientX, e.clientY);
          if (e.button === 0) {
            if (self.down) { self.released = true; }
            self.down = false;
          } else if (e.button === 2) {
            self.rightDown = false;
          }
        }, false);

        canvas.addEventListener("contextmenu", function (e) {
          e.preventDefault();
        }, false);

        canvas.addEventListener("wheel", function (e) {
          e.preventDefault();
          self.wheel += (e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0));
        }, { passive: false });

        canvas.addEventListener("touchstart", function (e) {
          e.preventDefault();
          if (e.touches && e.touches.length > 0) {
            self._updatePos(e.touches[0].clientX, e.touches[0].clientY);
            if (!self.down) { self.pressed = true; }
            self.down = true;
          }
        }, { passive: false });

        canvas.addEventListener("touchmove", function (e) {
          e.preventDefault();
          if (e.touches && e.touches.length > 0) {
            self._updatePos(e.touches[0].clientX, e.touches[0].clientY);
          }
        }, { passive: false });

        canvas.addEventListener("touchend", function (e) {
          e.preventDefault();
          if (self.down) { self.released = true; }
          self.down = false;
        }, { passive: false });
      },

      _endFrame: function () {
        this.dx = 0;
        this.dy = 0;
        this.pressed = false;
        this.released = false;
        this.rightPressed = false;
        this.wheel = 0;
      }
    };

    return {
      Keyboard: Keyboard,
      Mouse: Mouse
    };
  })();

  /* -----------------------------------------------------------------------
     4. GameEngine.Graphics — Crisp Pixel Primitives, Procedural Art & Font
     ----------------------------------------------------------------------- */
  var Graphics = (function () {
    var ctx = null;
    var width = 640;
    var height = 360;
    var shakeMag = 0;
    var shakeTime = 0;
    var shakeMaxTime = 0;
    var shakeX = 0;
    var shakeY = 0;
    var spriteCache = {};

    var FONT_5X7 = {
      "A": ["01110","10001","10001","11111","10001","10001","10001"],
      "B": ["11110","10001","10001","11110","10001","10001","11110"],
      "C": ["01110","10001","10000","10000","10000","10001","01110"],
      "D": ["11100","10010","10001","10001","10001","10010","11100"],
      "E": ["11111","10000","10000","11110","10000","10000","11111"],
      "F": ["11111","10000","10000","11110","10000","10000","10000"],
      "G": ["01110","10001","10000","10111","10001","10001","01111"],
      "H": ["10001","10001","10001","11111","10001","10001","10001"],
      "I": ["11111","00100","00100","00100","00100","00100","11111"],
      "J": ["00111","00010","00010","00010","10010","10010","01100"],
      "K": ["10001","10010","10100","11000","10100","10010","10001"],
      "L": ["10000","10000","10000","10000","10000","10000","11111"],
      "M": ["10001","11011","10101","10101","10001","10001","10001"],
      "N": ["10001","11001","10101","10011","10001","10001","10001"],
      "O": ["01110","10001","10001","10001","10001","10001","01110"],
      "P": ["11110","10001","10001","11110","10000","10000","10000"],
      "Q": ["01110","10001","10001","10001","10101","10010","01101"],
      "R": ["11110","10001","10001","11110","10100","10010","10001"],
      "S": ["01111","10000","10000","01110","00001","00001","11110"],
      "T": ["11111","00100","00100","00100","00100","00100","00100"],
      "U": ["10001","10001","10001","10001","10001","10001","01110"],
      "V": ["10001","10001","10001","10001","10001","01010","00100"],
      "W": ["10001","10001","10001","10101","10101","11011","10001"],
      "X": ["10001","10001","01010","00100","01010","10001","10001"],
      "Y": ["10001","10001","01010","00100","00100","00100","00100"],
      "Z": ["11111","00001","00010","00100","01000","10000","11111"],
      "0": ["01110","10011","10101","10101","11001","10001","01110"],
      "1": ["00100","01100","00100","00100","00100","00100","01110"],
      "2": ["01110","10001","00001","00110","01000","10000","11111"],
      "3": ["11110","00001","00001","01110","00001","00001","11110"],
      "4": ["00010","00110","01010","10010","11111","00010","00010"],
      "5": ["11111","10000","11110","00001","00001","10001","01110"],
      "6": ["01110","10000","10000","11110","10001","10001","01110"],
      "7": ["11111","00001","00010","00100","01000","01000","01000"],
      "8": ["01110","10001","10001","01110","10001","10001","01110"],
      "9": ["01110","10001","10001","01111","00001","00001","01110"],
      " ": ["00000","00000","00000","00000","00000","00000","00000"],
      ":": ["00000","00100","00100","00000","00100","00100","00000"],
      ".": ["00000","00000","00000","00000","00000","01100","01100"],
      ",": ["00000","00000","00000","00000","00000","00100","01000"],
      "-": ["00000","00000","00000","11111","00000","00000","00000"],
      "+": ["00000","00100","00100","11111","00100","00100","00000"],
      "/": ["00001","00010","00010","00100","01000","01000","10000"],
      "!": ["00100","00100","00100","00100","00100","00000","00100"],
      "?": ["01110","10001","00010","00100","00100","00000","00100"],
      "(": ["00010","00100","01000","01000","01000","00100","00010"],
      ")": ["01000","00100","00010","00010","00010","00100","01000"],
      "[": ["01110","01000","01000","01000","01000","01000","01110"],
      "]": ["01110","00010","00010","00010","00010","00010","01110"],
      "<": ["00010","00100","01000","10000","01000","00100","00010"],
      ">": ["01000","00100","00010","00001","00010","00100","01000"],
      "=": ["00000","00000","11111","00000","11111","00000","00000"],
      "%": ["11001","11010","00100","00100","01011","10011","00000"],
      "#": ["01010","11111","01010","01010","11111","01010","00000"],
      "_": ["00000","00000","00000","00000","00000","00000","11111"],
      "*": ["00000","00100","10101","01110","10101","00100","00000"]
    };

    function bakeProceduralSprite(cacheId, cols, rows, scale, flipX, drawFn) {
      if (spriteCache[cacheId]) {
        return spriteCache[cacheId];
      }
      var off = document.createElement("canvas");
      off.width = cols * scale;
      off.height = rows * scale;
      var octx = off.getContext("2d");
      octx.imageSmoothingEnabled = false;

      var buf = {
        px: function (x, y, colIdx) {
          var ix = Math.round(x);
          var iy = Math.round(y);
          if (ix < 0 || iy < 0 || ix >= cols || iy >= rows) { return; }
          var drawX = flipX ? (cols - 1 - ix) : ix;
          octx.fillStyle = Palette.get(colIdx);
          octx.fillRect(drawX * scale, iy * scale, scale, scale);
        },
        rect: function (x, y, w, h, colIdx) {
          var rx, ry, rw, rh;
          if (flipX) {
            rx = cols - Math.round(x + w);
            ry = Math.round(y);
            rw = Math.round(w);
            rh = Math.round(h);
          } else {
            rx = Math.round(x);
            ry = Math.round(y);
            rw = Math.round(w);
            rh = Math.round(h);
          }
          octx.fillStyle = Palette.get(colIdx);
          octx.fillRect(rx * scale, ry * scale, rw * scale, rh * scale);
        },
        ellipse: function (cx, cy, rx, ry, colIdx) {
          var y, x, dx, dy;
          for (y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
            for (x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
              dx = (x - cx) / rx;
              dy = (y - cy) / ry;
              if (dx * dx + dy * dy <= 1.0) {
                buf.px(x, y, colIdx);
              }
            }
          }
        }
      };

      drawFn(buf, cols, rows);
      spriteCache[cacheId] = off;
      return off;
    }

    return {
      _init: function (context2d, w, h) {
        ctx = context2d;
        width = w;
        height = h;
        ctx.imageSmoothingEnabled = false;
      },

      getWidth: function () { return width; },
      getHeight: function () { return height; },
      getContext: function () { return ctx; },

      screenShake: function (magnitude, duration) {
        if (magnitude >= shakeMag || shakeTime <= 0) {
          shakeMag = magnitude;
          shakeTime = duration;
          shakeMaxTime = duration > 0 ? duration : 0.001;
        }
      },

      _updateShake: function (dt) {
        if (shakeTime > 0) {
          shakeTime -= dt;
          if (shakeTime <= 0) {
            shakeTime = 0;
            shakeMag = 0;
            shakeX = 0;
            shakeY = 0;
          } else {
            var ratio = shakeTime / shakeMaxTime;
            var cur = shakeMag * ratio;
            shakeX = Math.round(EngineMath.randRange(-cur, cur));
            shakeY = Math.round(EngineMath.randRange(-cur, cur));
          }
        } else {
          shakeX = 0;
          shakeY = 0;
        }
      },

      _beginFrame: function () {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(shakeX, shakeY);
      },

      _endFrame: function () {
        ctx.restore();
      },

      clear: function (colorIdx) {
        ctx.fillStyle = Palette.get(colorIdx !== undefined ? colorIdx : 0);
        ctx.fillRect(-16, -16, width + 32, height + 32);
      },

      pixel: function (x, y, colorIdx) {
        ctx.fillStyle = Palette.get(colorIdx);
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      },

      rect: function (x, y, w, h, colorIdx) {
        ctx.fillStyle = Palette.get(colorIdx);
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      },

      rectOutline: function (x, y, w, h, colorIdx, lineWidth) {
        var lw = lineWidth || 1;
        var rx = Math.round(x);
        var ry = Math.round(y);
        var rw = Math.round(w);
        var rh = Math.round(h);
        ctx.fillStyle = Palette.get(colorIdx);
        ctx.fillRect(rx, ry, rw, lw);
        ctx.fillRect(rx, ry + rh - lw, rw, lw);
        ctx.fillRect(rx, ry, lw, rh);
        ctx.fillRect(rx + rw - lw, ry, lw, rh);
      },

      circle: function (cx, cy, r, colorIdx) {
        ctx.fillStyle = Palette.get(colorIdx);
        ctx.beginPath();
        ctx.arc(Math.round(cx), Math.round(cy), Math.max(0.5, r), 0, EngineMath.TAU);
        ctx.fill();
      },

      circleOutline: function (cx, cy, r, colorIdx, lineWidth) {
        ctx.strokeStyle = Palette.get(colorIdx);
        ctx.lineWidth = lineWidth || 1;
        ctx.beginPath();
        ctx.arc(Math.round(cx), Math.round(cy), Math.max(0.5, r), 0, EngineMath.TAU);
        ctx.stroke();
      },

      line: function (x1, y1, x2, y2, colorIdx, lineWidth) {
        ctx.strokeStyle = Palette.get(colorIdx);
        ctx.lineWidth = lineWidth || 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
        ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
        ctx.stroke();
      },

      proceduralSprite: function (key, cols, rows, x, y, scale, flipX, drawFn) {
        var s = scale || 1;
        var cacheId = key + "_" + cols + "x" + rows + "_" + s + "_" + (flipX ? "1" : "0");
        var baked = bakeProceduralSprite(cacheId, cols, rows, s, !!flipX, drawFn);
        ctx.drawImage(baked, Math.round(x), Math.round(y));
      },

      measureText: function (str, scale) {
        var s = scale || 1;
        var textStr = String(str);
        if (textStr.length === 0) { return 0; }
        return textStr.length * (6 * s) - s;
      },

      text: function (str, x, y, colorIdx, scale, align, shadowColorIdx) {
        var s = scale || 1;
        var textStr = String(str).toUpperCase();
        var totalW = this.measureText(textStr, s);
        var drawX = Math.round(x);
        var drawY = Math.round(y);

        if (align === "center") {
          drawX = Math.round(x - totalW * 0.5);
        } else if (align === "right") {
          drawX = Math.round(x - totalW);
        }

        if (shadowColorIdx !== undefined && shadowColorIdx !== null) {
          this._drawGlyphRun(textStr, drawX + s, drawY + s, shadowColorIdx, s);
        }
        this._drawGlyphRun(textStr, drawX, drawY, colorIdx, s);
      },

      _drawGlyphRun: function (textStr, startX, startY, colorIdx, s) {
        ctx.fillStyle = Palette.get(colorIdx);
        var cursorX = startX;
        var i, ch, glyph, r, c, rowStr;
        for (i = 0; i < textStr.length; i++) {
          ch = textStr.charAt(i);
          glyph = FONT_5X7[ch] || FONT_5X7["?"];
          for (r = 0; r < 7; r++) {
            rowStr = glyph[r];
            for (c = 0; c < 5; c++) {
              if (rowStr.charAt(c) === "1") {
                ctx.fillRect(cursorX + c * s, startY + r * s, s, s);
              }
            }
          }
          cursorX += 6 * s;
        }
      }
    };
  })();

  /* -----------------------------------------------------------------------
     5. GameEngine.GUI — Immediate-Mode Pixel GUI Widgets (Sweetie-16)
     ----------------------------------------------------------------------- */
  var GUI = (function () {
    var activeSliderId = null;
    var toasts = [];

    return {
      _update: function (dt) {
        if (!Input.Mouse.down) {
          activeSliderId = null;
        }
        var i;
        for (i = toasts.length - 1; i >= 0; i--) {
          toasts[i].time -= dt;
          if (toasts[i].time <= 0) {
            toasts.splice(i, 1);
          }
        }
      },

      panel: function (x, y, w, h, title, bgIdx, borderIdx) {
        var bg = bgIdx !== undefined ? bgIdx : Palette.DARK_BLUE;
        var border = borderIdx !== undefined ? borderIdx : Palette.GRAY;

        Graphics.rect(x + 2, y + 2, w, h, Palette.BLACK);
        Graphics.rect(x, y, w, h, bg);
        Graphics.rect(x + 1, y + 1, w - 2, 1, Palette.LIGHT_BLUE);
        Graphics.rect(x + 1, y + 1, 1, h - 2, Palette.GRAY);
        Graphics.rectOutline(x, y, w, h, border, 1);

        if (title) {
          Graphics.rect(x + 1, y + 1, w - 2, 12, Palette.DARK_GRAY);
          Graphics.rect(x + 1, y + 13, w - 2, 1, border);
          Graphics.text(title, x + 5, y + 4, Palette.YELLOW, 1, "left", Palette.BLACK);
        }
      },

      label: function (text, x, y, colorIdx, align, scale) {
        Graphics.text(
          text,
          x,
          y,
          colorIdx !== undefined ? colorIdx : Palette.WHITE,
          scale || 1,
          align || "left",
          Palette.BLACK
        );
      },

      button: function (id, x, y, w, h, text, accentIdx) {
        var mx = Input.Mouse.x;
        var my = Input.Mouse.y;
        var hovered = EngineMath.pointInRect(mx, my, x, y, w, h);
        var pressed = hovered && Input.Mouse.down;
        var clicked = hovered && Input.Mouse.released;

        var baseCol = accentIdx !== undefined ? accentIdx : Palette.BLUE;
        var fillCol = baseCol;
        var topBevel = Palette.CYAN;
        var botBevel = Palette.DARK_BLUE;
        var offsetY = 0;

        if (pressed) {
          fillCol = Palette.DARK_BLUE;
          topBevel = Palette.BLACK;
          botBevel = Palette.BLUE;
          offsetY = 1;
        } else if (hovered) {
          fillCol = Palette.LIGHT_BLUE;
          topBevel = Palette.WHITE;
          botBevel = baseCol;
        }

        Graphics.rect(x + 1, y + 2, w, h, Palette.BLACK);
        Graphics.rect(x, y + offsetY, w, h, fillCol);
        Graphics.rect(x + 1, y + offsetY + 1, w - 2, 1, topBevel);
        Graphics.rect(x + 1, y + offsetY + h - 2, w - 2, 1, botBevel);
        Graphics.rectOutline(x, y + offsetY, w, h, hovered ? Palette.WHITE : Palette.LIGHT_GRAY, 1);

        var textY = y + offsetY + Math.floor((h - 7) * 0.5);
        Graphics.text(
          text,
          x + Math.floor(w * 0.5),
          textY,
          pressed ? Palette.YELLOW : Palette.WHITE,
          1,
          "center",
          Palette.BLACK
        );

        return clicked;
      },

      checkbox: function (id, x, y, labelText, checked) {
        var boxSize = 11;
        var totalW = boxSize + 5 + Graphics.measureText(labelText, 1);
        var hovered = EngineMath.pointInRect(Input.Mouse.x, Input.Mouse.y, x, y, totalW, boxSize);
        var nextVal = checked;

        if (hovered && Input.Mouse.pressed) {
          nextVal = !checked;
        }

        Graphics.rect(x, y, boxSize, boxSize, Palette.BLACK);
        Graphics.rectOutline(x, y, boxSize, boxSize, hovered ? Palette.YELLOW : Palette.LIGHT_GRAY, 1);

        if (nextVal) {
          Graphics.rect(x + 2, y + 2, boxSize - 4, boxSize - 4, Palette.LIGHT_GREEN);
          Graphics.rect(x + 3, y + 3, boxSize - 6, boxSize - 6, Palette.WHITE);
        }

        Graphics.text(
          labelText,
          x + boxSize + 5,
          y + 2,
          hovered ? Palette.YELLOW : Palette.WHITE,
          1,
          "left",
          Palette.BLACK
        );

        return nextVal;
      },

      slider: function (id, x, y, w, minVal, maxVal, currentVal, labelText) {
        var trackY = labelText ? y + 10 : y;
        var trackH = 8;
        var hitY = trackY - 3;
        var hitH = trackH + 6;
        var hovered = EngineMath.pointInRect(Input.Mouse.x, Input.Mouse.y, x - 2, hitY, w + 4, hitH);

        if (hovered && Input.Mouse.pressed) {
          activeSliderId = id;
        }

        var val = EngineMath.clamp(currentVal, minVal, maxVal);
        if (activeSliderId === id && Input.Mouse.down) {
          var t = EngineMath.clamp((Input.Mouse.x - x) / w, 0, 1);
          val = EngineMath.lerp(minVal, maxVal, t);
        }

        if (labelText) {
          Graphics.text(labelText, x, y, Palette.LIGHT_GRAY, 1, "left", Palette.BLACK);
          Graphics.text(String(Math.round(val)), x + w, y, Palette.CYAN, 1, "right", Palette.BLACK);
        }

        var norm = (val - minVal) / (maxVal - minVal || 1);
        var fillW = Math.round(w * norm);
        var knobX = x + fillW - 3;

        Graphics.rect(x, trackY, w, trackH, Palette.BLACK);
        Graphics.rect(x + 1, trackY + 1, Math.max(0, fillW - 1), trackH - 2, Palette.GREEN);
        Graphics.rectOutline(x, trackY, w, trackH, (hovered || activeSliderId === id) ? Palette.WHITE : Palette.GRAY, 1);

        Graphics.rect(knobX, trackY - 2, 6, trackH + 4, (activeSliderId === id) ? Palette.YELLOW : Palette.WHITE);
        Graphics.rectOutline(knobX, trackY - 2, 6, trackH + 4, Palette.BLACK, 1);

        return val;
      },

      progressBar: function (x, y, w, h, ratio, fillIdx, bgIdx, labelText) {
        var r = EngineMath.clamp(ratio, 0, 1);
        var fill = fillIdx !== undefined ? fillIdx : Palette.GREEN;
        var bg = bgIdx !== undefined ? bgIdx : Palette.BLACK;

        Graphics.rect(x, y, w, h, bg);
        var innerW = Math.round((w - 2) * r);
        if (innerW > 0) {
          Graphics.rect(x + 1, y + 1, innerW, h - 2, fill);
          if (h >= 5) {
            Graphics.rect(x + 1, y + 1, innerW, 1, Palette.WHITE);
          }
        }
        Graphics.rectOutline(x, y, w, h, Palette.LIGHT_GRAY, 1);

        if (labelText) {
          Graphics.text(
            labelText,
            x + Math.floor(w * 0.5),
            y + Math.floor((h - 7) * 0.5),
            Palette.WHITE,
            1,
            "center",
            Palette.BLACK
          );
        }
      },

      toast: function (message, colorIdx, duration) {
        toasts.push({
          text: message,
          color: colorIdx !== undefined ? colorIdx : Palette.YELLOW,
          time: duration || 2.2,
          maxTime: duration || 2.2
        });
        if (toasts.length > 4) {
          toasts.shift();
        }
      },

      _renderToasts: function (centerX, startY) {
        var i, t, w, bx, by;
        for (i = 0; i < toasts.length; i++) {
          t = toasts[i];
          w = Graphics.measureText(t.text, 1) + 14;
          bx = Math.round(centerX - w * 0.5);
          by = Math.round(startY + i * 16);
          Graphics.rect(bx + 1, by + 1, w, 13, Palette.BLACK);
          Graphics.rect(bx, by, w, 13, Palette.DARK_GRAY);
          Graphics.rectOutline(bx, by, w, 13, t.color, 1);
          Graphics.text(t.text, centerX, by + 3, t.color, 1, "center", Palette.BLACK);
        }
      }
    };
  })();

  /* -----------------------------------------------------------------------
     6. GameEngine.Core — Main Loop, State Lifecycle, Responsive Scaling
     ----------------------------------------------------------------------- */
  var Core = (function () {
    var canvas = null;
    var ctx = null;
    var logicalW = 640;
    var logicalH = 360;
    var running = false;
    var lastTime = 0;
    var fps = 60;
    var frameCount = 0;
    var fpsTimer = 0;
    var totalTime = 0;
    var activeState = null;

    function fitCanvasToViewport() {
      if (!canvas) { return; }
      var pad = 16;
      var availW = Math.max(320, window.innerWidth - pad);
      var availH = Math.max(180, window.innerHeight - pad);
      var aspect = logicalW / logicalH;
      var targetW = availW;
      var targetH = Math.floor(targetW / aspect);

      if (targetH > availH) {
        targetH = availH;
        targetW = Math.floor(targetH * aspect);
      }

      canvas.style.width = targetW + "px";
      canvas.style.height = targetH + "px";
    }

    function tick(now) {
      if (!running) { return; }
      window.requestAnimationFrame(tick);

      var rawDt = (now - lastTime) * 0.001;
      lastTime = now;
      var dt = EngineMath.clamp(rawDt, 0.0001, 0.05);
      totalTime += dt;

      frameCount++;
      fpsTimer += rawDt;
      if (fpsTimer >= 0.5) {
        fps = Math.round(frameCount / fpsTimer);
        frameCount = 0;
        fpsTimer = 0;
      }

      Graphics._updateShake(dt);
      GUI._update(dt);

      if (activeState && activeState.update) {
        activeState.update(dt, totalTime);
      }

      Graphics._beginFrame();
      if (activeState && activeState.draw) {
        activeState.draw(Graphics, GUI);
      }
      Graphics._endFrame();

      Input.Keyboard._endFrame();
      Input.Mouse._endFrame();
    }

    return {
      init: function (canvasElement, width, height) {
        canvas = canvasElement;
        logicalW = width || 640;
        logicalH = height || 360;
        canvas.width = logicalW;
        canvas.height = logicalH;

        ctx = canvas.getContext("2d");
        Graphics._init(ctx, logicalW, logicalH);
        Input.Keyboard._init();
        Input.Mouse._init(canvas, logicalW, logicalH);

        fitCanvasToViewport();
        window.addEventListener("resize", fitCanvasToViewport, false);
      },

      setState: function (stateObj) {
        activeState = stateObj;
        if (activeState && activeState.enter) {
          activeState.enter();
        }
      },

      start: function () {
        if (running) { return; }
        running = true;
        lastTime = performance.now ? performance.now() : Date.now();
        window.requestAnimationFrame(tick);
      },

      getFPS: function () {
        return fps;
      },

      getTime: function () {
        return totalTime;
      }
    };
  })();

  return {
    Palette: Palette,
    Math: EngineMath,
    Input: Input,
    Graphics: Graphics,
    GUI: GUI,
    Core: Core
  };
})();
