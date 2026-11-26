export const defaultPalettePixels = new Uint8Array([
  26, 28, 44,     // 0: Black / Dark Navy (#1a1c2c)
  93, 39, 93,     // 1: Purple (#5d275d)
  177, 62, 83,    // 2: Red (#b13e53)
  239, 125, 87,   // 3: Orange (#ef7d57)
  255, 205, 117,  // 4: Yellow (#ffcd75)
  167, 240, 112,  // 5: Light Green (#a7f070)
  56, 183, 100,   // 6: Green (#38b764)
  37, 113, 121,   // 7: Dark Green / Teal (#257179)
  41, 54, 111,    // 8: Dark Blue (#29366f)
  59, 93, 201,    // 9: Blue (#3b5dc9)
  65, 166, 246,   // 10: Light Blue (#41a6f6)
  115, 239, 247,  // 11: Cyan (#73eff7)
  244, 244, 244,  // 12: White (#f4f4f4)
  148, 176, 194,  // 13: Light Grey (#94b0c2)
  86, 108, 134,   // 14: Grey (#566c86)
  51, 60, 87,     // 15: Dark Grey (#333c57)
]);

export class Palette {
  #data;

  /**
   * @param {Uint8Array} [data=defaultPalettePixels] - Flat RGB byte array (3 bytes per color).
   */
  constructor(data = defaultPalettePixels) {
    this.setData(data);
  }

  get data() {
    return this.#data;
  }

  get count() {
    return Math.floor(this.#data.length / 3);
  }

  /**
   * Replaces the underlying flat RGB byte array.
   * @param {Uint8Array} data
   */
  setData(data) {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("Palette data must be a Uint8Array");
    }
    this.#data = data;
    return this;
  }

  /**
   * Retrieves an RGB color object by zero-based color index.
   * @param {number} index
   * @returns {{ r: number, g: number, b: number }}
   */
  getColor(index) {
    const maxIndex = this.count - 1;
    if (!Number.isInteger(index) || index < 0 || index > maxIndex) {
      throw new RangeError(`Palette index ${index} out of bounds (0..${maxIndex})`);
    }

    const offset = index * 3;
    return {
      r: this.#data[offset],
      g: this.#data[offset + 1],
      b: this.#data[offset + 2],
    };
  }

  /**
   * Retrieves a `#rrggbb` hex color string by zero-based color index.
   * @param {number} index
   * @returns {string}
   */
  getHexColor(index) {
    const { r, g, b } = this.getColor(index);
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

export const pal = new Palette();
