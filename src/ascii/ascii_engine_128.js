// ============================================================================
// 128x128-BIT PROCEDURAL ASCII TEXTURE, SHADER & 2.5D VOLUMETRIC MODEL ENGINE
// (ULTRA-OPTIMIZED 60 FPS EDITION: Pre-Baked Static Light & Dirty-Rect Cache)
// ============================================================================

export const MAT = {
  NONE: 0,
  STONE: 1,
  MORTAR: 2,
  CARPET_RED: 3,
  CARPET_GOLD: 4,
  CARPET_TEAL: 5,
  WOOD: 6,
  DARK_WOOD: 7,
  IRON: 8,
  GOLD: 9,
  TURQUOISE: 10,
  PARCHMENT: 11,
  SKIN: 12,
  HAIR_WHITE: 13,
  HAIR_DARK: 14,
  CLOTH_GRAY: 15,
  CLOTH_EMERALD: 16,
  CLOTH_TEAL: 17,
  CLOTH_CRIMSON: 18,
  FIRE: 19,
  PORTAL: 20
};

const RAMPS = {
  [MAT.STONE]:         " .,:;-=+*#%@M",
  [MAT.MORTAR]:        " ...:::---===",
  [MAT.CARPET_RED]:    " .,:;+xX#%@W",
  [MAT.CARPET_GOLD]:   " .:+*xX$&#@",
  [MAT.CARPET_TEAL]:   " .,:;=+*#%@",
  [MAT.WOOD]:          " .-~=+*#%@W",
  [MAT.DARK_WOOD]:     " ._-=+#%@",
  [MAT.IRON]:          " .:-=+H#NM@",
  [MAT.GOLD]:          " .:+*sS$&#@",
  [MAT.TURQUOISE]:     " .,:;+oO#%@",
  [MAT.PARCHMENT]:     " .,:;~=+*#@",
  [MAT.SKIN]:          " .,:;-=+*#%@",
  [MAT.HAIR_WHITE]:    " .,:;|/\\vVwW#@",
  [MAT.HAIR_DARK]:     " .,:;|/\\vVmM#@",
  [MAT.CLOTH_GRAY]:    " .,:;-=+*#%@",
  [MAT.CLOTH_EMERALD]: " .,:;i1tfLCG08@",
  [MAT.CLOTH_TEAL]:    " .,:;+itfLC08@",
  [MAT.CLOTH_CRIMSON]: " .,:;-=+*#%@",
  [MAT.FIRE]:          " .'^~*sS$#@",
  [MAT.PORTAL]:        " .·:*oO0@#@"
};

const BASE_COLORS = {
  [MAT.STONE]:         [52, 118, 72],
  [MAT.MORTAR]:        [22, 52, 32],
  [MAT.CARPET_RED]:    [185, 48, 38],
  [MAT.CARPET_GOLD]:   [235, 185, 55],
  [MAT.CARPET_TEAL]:   [45, 165, 150],
  [MAT.WOOD]:          [195, 120, 42],
  [MAT.DARK_WOOD]:     [135, 75, 25],
  [MAT.IRON]:          [150, 165, 175],
  [MAT.GOLD]:          [255, 215, 75],
  [MAT.TURQUOISE]:     [64, 215, 195],
  [MAT.PARCHMENT]:     [245, 235, 200],
  [MAT.SKIN]:          [245, 205, 165],
  [MAT.HAIR_WHITE]:    [225, 240, 235],
  [MAT.HAIR_DARK]:     [95, 75, 60],
  [MAT.CLOTH_GRAY]:    [155, 175, 160],
  [MAT.CLOTH_EMERALD]: [55, 215, 115],
  [MAT.CLOTH_TEAL]:    [65, 195, 180],
  [MAT.CLOTH_CRIMSON]: [210, 65, 55],
  [MAT.FIRE]:          [255, 145, 35],
  [MAT.PORTAL]:        [85, 235, 215]
};

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function hash2D(x, y) {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export class AsciiEngine128 {
  constructor(cols = 216, rows = 108) {
    this.cols = cols;
    this.rows = rows;
    this.cellW = 6;
    this.cellH = 10;
    this.tick = 0;

    const size = cols * rows;
    // Working buffers
    this.matBuf = new Uint8Array(size);
    this.lumBuf = new Float32Array(size);
    this.nxBuf = new Float32Array(size);
    this.nyBuf = new Float32Array(size);
    this.nzBuf = new Float32Array(size);
    this.zBuf = new Float32Array(size);
    this.charOverride = new Array(size).fill(null);

    // Pre-baked static room caches (2 ambient animation frames: 0 and 1)
    this.staticCaches = [null, null];
    this.portraitCache = new Map();
  }

  clear() {
    this.matBuf.fill(MAT.NONE);
    this.lumBuf.fill(0);
    this.nxBuf.fill(0);
    this.nyBuf.fill(0);
    this.nzBuf.fill(1);
    this.zBuf.fill(0);
    this.charOverride.fill(null);
  }

  setPixel(c, r, mat, lum, nx = 0, ny = 0, nz = 1, z = 0, charOvr = null) {
    c = Math.round(c);
    r = Math.round(r);
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
    const idx = r * this.cols + c;
    this.matBuf[idx] = mat;
    this.lumBuf[idx] = clamp(lum, 0.05, 1.0);
    this.nxBuf[idx] = nx;
    this.nyBuf[idx] = ny;
    this.nzBuf[idx] = nz;
    this.zBuf[idx] = z;
    this.charOverride[idx] = charOvr;
  }

  drawEllipsoid(cx, cy, rx, ry, mat, baseLum = 0.75, zHeight = 10, charFn = null) {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const d2 = dx * dx + dy * dy;
        if (d2 <= 1.0) {
          const dz = Math.sqrt(1.0 - d2);
          const ch = charFn ? charFn(dx, dy, dz, x, y) : null;
          let edgeChar = ch;
          if (!edgeChar && d2 > 0.82) {
            const angle = Math.atan2(dy, dx);
            const a = ((angle + Math.PI) / Math.PI) * 4;
            if (a < 0.5 || a > 3.5) edgeChar = "|";
            else if (a >= 0.5 && a < 1.5) edgeChar = "/";
            else if (a >= 1.5 && a < 2.5) edgeChar = "-";
            else edgeChar = "\\";
          }
          this.setPixel(x, y, mat, baseLum * (0.45 + 0.55 * dz), dx, dy, dz, zHeight + dz * 4, edgeChar);
        }
      }
    }
  }

  // ==========================================================================
  // PRE-BAKE STATIC ROOM GEOMETRY, LIGHTING & OFFSCREEN CANVAS (Runs Once!)
  // ==========================================================================
  ensureStaticCache(animFrame) {
    const f = animFrame % 2;
    if (this.staticCaches[f]) return this.staticCaches[f];

    this.tick = f;
    this.clear();

    // Build all static room geometry and fixtures
    this.buildArchitecture();
    this.buildSeljukCarpet(48, 42, 168, 94);
    this.buildWallKandil(30, 16);
    this.buildWallKandil(186, 16);
    this.buildSeljukTacKapi(108, 2);
    this.buildPirModel(108, 60);
    this.buildRahleModel(30, 72);
    this.buildChestModel(184, 72);

    const size = this.cols * this.rows;
    const matCopy = new Uint8Array(this.matBuf);
    const lumCopy = new Float32Array(this.lumBuf);
    const nxCopy = new Float32Array(this.nxBuf);
    const nyCopy = new Float32Array(this.nyBuf);
    const nzCopy = new Float32Array(this.nzBuf);
    const zCopy = new Float32Array(this.zBuf);
    const charCopy = this.charOverride.slice();

    // Pre-compute static lighting from the 6 room lights
    const staticLr = new Float32Array(size);
    const staticLg = new Float32Array(size);
    const staticLb = new Float32Array(size);

    const flicker = f === 0 ? 0.04 : -0.04;
    const staticLights = [
      { x: 30,  y: 13, z: 22, r: 1.0,  g: 0.72, b: 0.35, rad: 78, intensity: 1.15 + flicker },
      { x: 186, y: 13, z: 22, r: 1.0,  g: 0.72, b: 0.35, rad: 78, intensity: 1.15 - flicker },
      { x: 108, y: 20, z: 18, r: 0.45, g: 0.95, b: 0.85, rad: 65, intensity: 0.95 },
      { x: 108, y: 46, z: 18, r: 0.55, g: 0.95, b: 0.75, rad: 58, intensity: 0.85 },
      { x: 30,  y: 58, z: 16, r: 1.0,  g: 0.82, b: 0.40, rad: 56, intensity: 0.95 },
      { x: 184, y: 60, z: 16, r: 0.95, g: 0.78, b: 0.45, rad: 48, intensity: 0.75 }
    ];

    // Render static room onto an offscreen canvas
    const offCanvas = document.createElement("canvas");
    offCanvas.width = this.cols * this.cellW;
    offCanvas.height = this.rows * this.cellH;
    const ctx = offCanvas.getContext("2d");

    ctx.fillStyle = "#020603";
    ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
    ctx.font = "bold 9.5px 'Fira Code', 'Consolas', 'Courier New', monospace";
    ctx.textBaseline = "top";

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        const mat = matCopy[idx];
        if (mat === MAT.NONE) continue;

        const baseLum = lumCopy[idx];
        const nx = nxCopy[idx];
        const ny = nyCopy[idx];
        const nz = nzCopy[idx];
        const pz = zCopy[idx];

        let lr = 0.18, lg = 0.22, lb = 0.19;
        for (let i = 0; i < staticLights.length; i++) {
          const L = staticLights[i];
          const dx = L.x - c;
          const dy = (L.y - r) * 1.65;
          const dz = L.z - pz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < L.rad) {
            const atten = Math.pow(1.0 - dist / L.rad, 1.6) * L.intensity;
            const invD = 1.0 / (dist + 0.001);
            const dot = Math.max(0.15, (dx * invD) * nx + (dy * invD) * ny + (dz * invD) * nz);
            const contrib = atten * dot;
            lr += L.r * contrib;
            lg += L.g * contrib;
            lb += L.b * contrib;
          }
        }

        staticLr[idx] = lr;
        staticLg[idx] = lg;
        staticLb[idx] = lb;

        this.drawCell(ctx, c, r, mat, baseLum, lr, lg, lb, charCopy[idx]);
      }
    }

    const cacheObj = {
      mat: matCopy,
      lum: lumCopy,
      nx: nxCopy,
      ny: nyCopy,
      nz: nzCopy,
      z: zCopy,
      char: charCopy,
      lr: staticLr,
      lg: staticLg,
      lb: staticLb,
      canvas: offCanvas
    };

    this.staticCaches[f] = cacheObj;
    return cacheObj;
  }

  drawCell(ctx, c, r, mat, baseLum, lr, lg, lb, charOvr) {
    const totalLight = clamp((lr + lg + lb) * 0.38, 0.12, 1.35);
    const finalLum = clamp(baseLum * totalLight, 0.05, 0.999);

    let ch = charOvr;
    if (!ch) {
      const ramp = RAMPS[mat] || RAMPS[MAT.STONE];
      const rIdx = Math.floor(finalLum * ramp.length);
      ch = ramp[clamp(rIdx, 0, ramp.length - 1)];
    }

    const baseRGB = BASE_COLORS[mat] || [80, 200, 120];
    const factor = 0.55 + baseLum * 0.65;
    const fgR = clamp((baseRGB[0] * lr * factor) | 0, 18, 255);
    const fgG = clamp((baseRGB[1] * lg * factor) | 0, 24, 255);
    const fgB = clamp((baseRGB[2] * lb * factor) | 0, 18, 255);

    const px = c * this.cellW;
    const py = r * this.cellH;

    ctx.fillStyle = `rgb(${fgR >> 2},${fgG >> 2},${fgB >> 2})`;
    ctx.fillRect(px, py, this.cellW, this.cellH);

    if (ch !== " ") {
      ctx.fillStyle = `rgb(${fgR},${fgG},${fgB})`;
      ctx.fillText(ch, px, py);
    }
  }

  // ==========================================================================
  // FAST DIRTY-RECT ROOM RENDER (< 2.5ms per frame!)
  // ==========================================================================
  renderRoomToCanvas(canvas, player, animTick) {
    if (!canvas) return;
    const f = animTick % 2;
    this.tick = f;

    const cache = this.ensureStaticCache(f);
    const targetW = this.cols * this.cellW;
    const targetH = this.rows * this.cellH;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext("2d");

    // 1. Blit pre-rendered static room in 0.1ms!
    ctx.drawImage(cache.canvas, 0, 0);

    // 2. Define dirty region around player's lantern light radius
    const isArmed = player.equipped.weapon !== "Yalın El";
    const lightRad = isArmed ? 42 : 30;
    const px = Math.round(player.x);
    const py = Math.round(player.y);

    const c0 = Math.max(0, px - lightRad);
    const c1 = Math.min(this.cols - 1, px + lightRad);
    const r0 = Math.max(0, py - 34);
    const r1 = Math.min(this.rows - 1, py + 12);

    // 3. Copy only the dirty rectangle from static cache into working buffers
    for (let r = r0; r <= r1; r++) {
      const rowOff = r * this.cols;
      for (let c = c0; c <= c1; c++) {
        const idx = rowOff + c;
        this.matBuf[idx] = cache.mat[idx];
        this.lumBuf[idx] = cache.lum[idx];
        this.nxBuf[idx] = cache.nx[idx];
        this.nyBuf[idx] = cache.ny[idx];
        this.nzBuf[idx] = cache.nz[idx];
        this.zBuf[idx] = cache.z[idx];
        this.charOverride[idx] = cache.char[idx];
      }
    }

    // 4. Stamp Sâlik (Player) model + Y-depth foreground occlusion if walking behind objects
    this.buildSalikModel(px, py, player);
    if (py < 60 && Math.abs(px - 108) < 38) {
      this.buildPirModel(108, 60);
    }
    if (py < 72 && px < 68) {
      this.buildRahleModel(30, 72);
    }
    if (py < 72 && px > 144) {
      this.buildChestModel(184, 72);
    }

    // 5. Re-draw ONLY the dirty rectangle with the Player's dynamic lantern light
    ctx.font = "bold 9.5px 'Fira Code', 'Consolas', 'Courier New', monospace";
    ctx.textBaseline = "top";

    const pLightX = px;
    const pLightY = py - 14;
    const pLightZ = 18;
    const pIntensity = isArmed ? 0.95 : 0.65;

    for (let r = r0; r <= r1; r++) {
      const rowOff = r * this.cols;
      for (let c = c0; c <= c1; c++) {
        const idx = rowOff + c;
        const mat = this.matBuf[idx];
        if (mat === MAT.NONE) continue;

        const baseLum = this.lumBuf[idx];
        let lr = cache.lr[idx];
        let lg = cache.lg[idx];
        let lb = cache.lb[idx];

        const dx = pLightX - c;
        const dy = (pLightY - r) * 1.65;
        const dz = pLightZ - this.zBuf[idx];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < lightRad) {
          const atten = (1.0 - dist / lightRad) * pIntensity;
          const invD = 1.0 / (dist + 0.001);
          const dot = Math.max(0.2, (dx * invD) * this.nxBuf[idx] + (dy * invD) * this.nyBuf[idx] + (dz * invD) * this.nzBuf[idx]);
          const contrib = atten * dot;
          lr += 0.75 * contrib;
          lg += 0.95 * contrib;
          lb += 0.82 * contrib;
        }

        this.drawCell(ctx, c, r, mat, baseLum, lr, lg, lb, this.charOverride[idx]);
      }
    }
  }

  // ==========================================================================
  // 1. ARCHITECTURE: VAULTED SELJUK STONE WALLS & PERSPECTIVE FLOOR
  // ==========================================================================
  buildArchitecture() {
    const W = this.cols;
    const H = this.rows;
    const wallH = 36;

    for (let r = 0; r < wallH; r++) {
      for (let c = 0; c < W; c++) {
        if (r === 0 || r === 35) {
          this.setPixel(c, r, MAT.STONE, 0.85, 0, -0.5, 0.8, 12, "═");
          continue;
        }
        if (r >= 1 && r <= 3) {
          const pat = (c + r * 2) % 8;
          const ch = r === 2 ? (c % 8 === 0 ? "❖" : (c % 4 === 0 ? "╦" : "═")) : (pat < 4 ? "▓" : "▒");
          this.setPixel(c, r, MAT.STONE, 0.72, 0, -0.3, 0.9, 12, ch);
          continue;
        }

        const course = Math.floor((r - 4) / 5);
        const rowInCourse = (r - 4) % 5;
        const stagger = (course % 2) * 8;
        const colInBlock = (c + stagger) % 16;

        if (rowInCourse === 0) {
          this.setPixel(c, r, MAT.MORTAR, 0.25, 0, -0.7, 0.7, 10, "─");
        } else if (colInBlock === 0) {
          this.setPixel(c, r, MAT.MORTAR, 0.25, -0.7, 0, 0.7, 10, "│");
        } else {
          const blockNoise = hash2D(Math.floor((c + stagger) / 16), course) * 0.18;
          const nx = colInBlock === 1 ? -0.4 : colInBlock === 15 ? 0.4 : 0;
          const ny = rowInCourse === 1 ? -0.4 : rowInCourse === 4 ? 0.4 : 0;
          this.setPixel(c, r, MAT.STONE, 0.42 + blockNoise, nx, ny, 0.9, 11);
        }
      }
    }

    for (let r = wallH; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (c < 8 || c >= W - 8) {
          const isCapital = r % 12 === 0;
          const isInnerEdge = c === 7 || c === W - 8;
          const ch = isInnerEdge ? "║" : isCapital ? "═" : null;
          const nx = c < 8 ? 0.6 : -0.6;
          this.setPixel(c, r, MAT.STONE, isCapital ? 0.75 : 0.48, nx, 0, 0.8, 8, ch);
          continue;
        }

        if (r === H - 1) {
          this.setPixel(c, r, MAT.STONE, 0.8, 0, 0.5, 0.8, 6, "═");
          continue;
        }

        const slabR = (r - wallH) % 7;
        const perspFactor = 1.0 + (r - wallH) * 0.008;
        const relX = (c - 108) / perspFactor;
        const slabC = ((Math.round(relX) % 18) + 18) % 18;

        if (slabR === 0 && slabC === 0) {
          this.setPixel(c, r, MAT.MORTAR, 0.22, 0, 0, 1, 0, "┼");
        } else if (slabR === 0) {
          this.setPixel(c, r, MAT.MORTAR, 0.22, 0, -0.3, 0.95, 0, "─");
        } else if (slabC === 0) {
          this.setPixel(c, r, MAT.MORTAR, 0.22, -0.3, 0, 0.95, 0, "│");
        } else {
          const tileSeed = hash2D(Math.floor(relX / 18), Math.floor((r - wallH) / 7));
          const tex = hash2D(c, r) * 0.08;
          this.setPixel(c, r, MAT.STONE, 0.22 + tileSeed * 0.08 + tex, 0, 0, 1, 0);
        }
      }
    }
  }

  // ==========================================================================
  // 2. GRAND SELJUK MEDALLION CARPET
  // ==========================================================================
  buildSeljukCarpet(x0, y0, x1, y1) {
    const cx = (x0 + x1) * 0.5;
    const cy = (y0 + y1) * 0.5;
    const rx = (x1 - x0) * 0.5;
    const ry = (y1 - y0) * 0.5;

    for (let x = x0 + 3; x <= x1 - 3; x++) {
      this.setPixel(x, y0 - 1, MAT.CARPET_GOLD, 0.75, 0, 0, 1, 0.5, x % 2 === 0 ? "╥" : "│");
      this.setPixel(x, y1 + 1, MAT.CARPET_GOLD, 0.75, 0, 0, 1, 0.5, x % 2 === 0 ? "╨" : "│");
    }

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = Math.min(x - x0, x1 - x);
        const dy = Math.min(y - y0, y1 - y);

        if (dx === 0 || dy === 0) {
          const ch = (dx === 0 && dy === 0) ? "╬" : (dy === 0 ? "═" : "║");
          this.setPixel(x, y, MAT.CARPET_GOLD, 0.85, 0, 0, 1, 0.5, ch);
        } else if (dx <= 2 || dy === 1) {
          const ch = (x + y) % 2 === 0 ? "░" : "▒";
          this.setPixel(x, y, MAT.CARPET_TEAL, 0.65, 0, 0, 1, 0.5, ch);
        } else if (dx <= 7 || dy <= 4) {
          const pat = ((x - x0) % 6 === 3 && (y - y0) % 3 === 1);
          if (pat) {
            this.setPixel(x, y, MAT.CARPET_GOLD, 0.9, 0, 0, 1, 0.5, "❖");
          } else {
            const weave = ((x + y) % 3 === 0) ? "▓" : "▒";
            this.setPixel(x, y, MAT.CARPET_RED, 0.52, 0, 0, 1, 0.5, weave);
          }
        } else if (dx === 8 || dy === 5) {
          this.setPixel(x, y, MAT.CARPET_GOLD, 0.8, 0, 0, 1, 0.5, (x + y) % 2 === 0 ? "═" : "◈");
        } else {
          const ndx = (x - cx) / (rx * 0.55);
          const ndy = (y - cy) / (ry * 0.55);
          const dist = Math.sqrt(ndx * ndx + ndy * ndy);
          const angle = Math.atan2(ndy, ndx);
          const starRadius = 0.72 + 0.14 * Math.cos(angle * 8);

          const cornerDist = Math.min(
            Math.hypot((x - x0 - 8) * 0.6, y - y0 - 5),
            Math.hypot((x1 - 8 - x) * 0.6, y - y0 - 5),
            Math.hypot((x - x0 - 8) * 0.6, y1 - 5 - y),
            Math.hypot((x1 - 8 - x) * 0.6, y1 - 5 - y)
          );

          if (dist < 0.22) {
            this.setPixel(x, y, MAT.CARPET_GOLD, 0.92, 0, 0, 1, 0.5, dist < 0.08 ? "❂" : "✦");
          } else if (dist < starRadius * 0.55) {
            const ch = (x + y) % 2 === 0 ? "❖" : "▒";
            this.setPixel(x, y, MAT.CARPET_TEAL, 0.75, 0, 0, 1, 0.5, ch);
          } else if (dist < starRadius) {
            const isRim = Math.abs(dist - starRadius) < 0.12;
            this.setPixel(x, y, isRim ? MAT.CARPET_GOLD : MAT.CARPET_RED, isRim ? 0.88 : 0.6, 0, 0, 1, 0.5, isRim ? "◈" : "▓");
          } else if (cornerDist < 10) {
            const isEdge = Math.abs(cornerDist - 10) < 1.2;
            this.setPixel(x, y, isEdge ? MAT.CARPET_GOLD : MAT.CARPET_TEAL, 0.7, 0, 0, 1, 0.5, isEdge ? "❖" : "░");
          } else {
            const arabesque = Math.sin((x - cx) * 0.45) * Math.cos((y - cy) * 0.65);
            const ch = arabesque > 0.65 ? "✧" : ((x + y) % 2 === 0 ? "░" : "▒");
            const mat = arabesque > 0.65 ? MAT.CARPET_GOLD : MAT.CARPET_RED;
            this.setPixel(x, y, mat, arabesque > 0.65 ? 0.75 : 0.44, 0, 0, 1, 0.5, ch);
          }
        }
      }
    }
  }

  // ==========================================================================
  // 3. WALL KANDİL & ARCHED NICHE
  // ==========================================================================
  buildWallKandil(cx, cy) {
    for (let dy = -11; dy <= 12; dy++) {
      for (let dx = -11; dx <= 11; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const archW = dy < -2 ? Math.max(0, 11 - Math.pow((-2 - dy) * 1.15, 1.4)) : 11;
        if (Math.abs(dx) <= archW) {
          const isFrame = Math.abs(Math.abs(dx) - archW) < 1.3 || dy === 12;
          if (isFrame) {
            this.setPixel(x, y, MAT.STONE, 0.8, dx * 0.08, 0, 0.9, 12, dy === 12 ? "═" : "║");
          } else {
            this.setPixel(x, y, MAT.MORTAR, 0.18, 0, 0, 1, 9, "·");
          }
        }
      }
    }

    for (let dy = -9; dy <= -2; dy++) {
      this.setPixel(cx - 3, cy + dy, MAT.GOLD, 0.75, 0, 0, 1, 13, ":");
      this.setPixel(cx + 3, cy + dy, MAT.GOLD, 0.75, 0, 0, 1, 13, ":");
    }

    const sway = this.tick === 0 ? 0.35 : -0.35;
    for (let dy = -7; dy <= -1; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const t = (dy + 7) / 6.0;
        const maxR = Math.sin(t * Math.PI) * 3.8 + 0.5;
        const dist = Math.abs(dx - sway * (1 - t));
        if (dist <= maxR) {
          const heat = clamp(1.0 - (dist / maxR) * 0.6 - (1 - t) * 0.2, 0.2, 1.0);
          const ch = heat > 0.8 ? "@" : heat > 0.6 ? "#" : heat > 0.4 ? "*" : "^";
          this.setPixel(cx + dx, cy + dy, MAT.FIRE, heat, 0, 0, 1, 15, ch);
        }
      }
    }

    for (let dy = 0; dy <= 6; dy++) {
      const bowlW = dy === 0 ? 5 : dy === 1 ? 6 : dy === 2 ? 5 : dy === 3 ? 3 : dy === 4 ? 1 : 2;
      for (let dx = -bowlW; dx <= bowlW; dx++) {
        const nx = dx / (bowlW + 0.5);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const ch = dy === 0 ? "═" : Math.abs(dx) === bowlW ? (dx < 0 ? "(" : ")") : null;
        this.setPixel(cx + dx, cy + dy, MAT.GOLD, 0.5 + 0.5 * nz, nx, 0.2, nz, 14, ch);
      }
    }
  }

  // ==========================================================================
  // 4. SELÇUKLU TAÇ KAPI / SIR KAPISI
  // ==========================================================================
  buildSeljukTacKapi(cx, topY) {
    const halfW = 34;
    const height = 33;

    for (let dy = 0; dy <= height; dy++) {
      const y = topY + dy;
      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        const adx = Math.abs(dx);

        if (dy === 0 || dy === height || adx === halfW || adx === halfW - 1) {
          const ch = (dy === 0 || dy === height) ? "═" : "║";
          this.setPixel(x, y, MAT.GOLD, 0.85, 0, 0, 1, 14, ch);
          continue;
        }

        if (dy <= 4 || adx >= 30) {
          const isStar = (dx + dy) % 4 === 0 && (dx - dy) % 4 === 0;
          this.setPixel(x, y, isStar ? MAT.GOLD : MAT.TURQUOISE, isStar ? 0.95 : 0.65, 0, 0, 1, 13, isStar ? "❖" : "▒");
          continue;
        }

        if (adx >= 24 && adx <= 29) {
          const colCenter = dx < 0 ? -26.5 : 26.5;
          const cnx = (dx - colCenter) / 3.0;
          const cnz = Math.sqrt(Math.max(0.1, 1 - cnx * cnx));
          if (dy <= 7 || dy >= 30) {
            this.setPixel(x, y, MAT.GOLD, 0.75 * cnz + 0.2, cnx, 0, cnz, 15, dy === 7 || dy === 30 ? "═" : "▓");
          } else {
            const spiral = Math.sin((dy * 0.7) + (dx * 0.9));
            const ch = spiral > 0.5 ? "/" : spiral < -0.5 ? "\\" : "█";
            this.setPixel(x, y, MAT.TURQUOISE, (0.45 + 0.55 * cnz) * (0.85 + 0.15 * spiral), cnx, 0, cnz, 15, ch);
          }
          continue;
        }

        const archCenterY = 17;
        let inArch = false;
        let archDist = 0;

        if (dy >= archCenterY) {
          inArch = adx <= 21;
          archDist = 21 - adx;
        } else {
          const archShift = dx < 0 ? 7 : -7;
          const rArch = Math.hypot(dx - archShift, (dy - archCenterY) * 1.45);
          inArch = rArch <= 28;
          archDist = 28 - rArch;
        }

        if (!inArch) {
          const muq = Math.sin(dx * 0.8) * Math.cos(dy * 0.9);
          this.setPixel(x, y, muq > 0.3 ? MAT.GOLD : MAT.STONE, 0.55 + muq * 0.25, 0, -0.3, 0.9, 13, muq > 0.4 ? "❖" : "░");
        } else if (archDist < 3.2) {
          const angle = Math.atan2(dy - archCenterY, dx);
          const voussoir = Math.floor(((angle + Math.PI) / Math.PI) * 18) % 2 === 0;
          this.setPixel(x, y, voussoir ? MAT.GOLD : MAT.TURQUOISE, 0.85, 0, 0, 1, 14, voussoir ? "█" : "▓");
        } else {
          const isCenterSeam = adx === 0;
          const isIronBand = (dy === 14 || dy === 22 || dy === 30);

          const pDist = Math.hypot(dx * 0.75, dy - 18);
          if (pDist < 7.5) {
            const swirl = Math.atan2(dy - 18, dx) + pDist * 0.6 - this.tick * 0.9;
            const wave = Math.sin(swirl * 3) * 0.5 + 0.5;
            const mat = pDist < 2.5 ? MAT.GOLD : MAT.PORTAL;
            const ch = pDist < 1.8 ? "❂" : wave > 0.7 ? "✦" : wave > 0.4 ? "o" : "·";
            this.setPixel(x, y, mat, 0.65 + wave * 0.35, 0, 0, 1, 13, ch);
          } else if (isCenterSeam) {
            this.setPixel(x, y, MAT.IRON, 0.7, 0, 0, 1, 12, "║");
          } else if (isIronBand) {
            const isStud = adx % 4 === 2;
            this.setPixel(x, y, isStud ? MAT.GOLD : MAT.IRON, isStud ? 0.9 : 0.65, 0, 0, 1, 12, isStud ? "•" : "═");
          } else {
            const plank = adx % 5 === 0 ? "│" : null;
            this.setPixel(x, y, MAT.DARK_WOOD, 0.42 + (adx % 5) * 0.04, 0, 0, 1, 11, plank);
          }
        }
      }
    }
  }

  // ==========================================================================
  // 5. PÎR-İ ŞEYH BURHÂNEDDİN
  // ==========================================================================
  buildPirModel(cx, footY) {
    for (let dy = -4; dy <= 3; dy++) {
      for (let dx = -22; dx <= 22; dx++) {
        const d2 = (dx / 22) ** 2 + (dy / 3.8) ** 2;
        if (d2 <= 1.0) {
          this.setPixel(cx + dx, footY + dy, MAT.CLOTH_CRIMSON, 0.55 * (1 - d2 * 0.5), dx / 22, dy / 4, 0.8, 2);
        }
      }
    }

    for (let dy = -11; dy <= 0; dy++) {
      const w = 19 - Math.abs(dy + 4) * 0.7;
      for (let dx = -w; dx <= w; dx++) {
        const nx = dx / w;
        const ny = (dy + 5) / 6;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx * 0.7 - ny * ny * 0.3));
        const fold = Math.sin(dx * 0.6 + dy * 0.3) * 0.12;
        this.setPixel(cx + dx, footY + dy, MAT.CLOTH_TEAL, 0.52 + 0.38 * nz + fold, nx, ny, nz, 8);
      }
    }

    for (let dy = -21; dy <= -9; dy++) {
      const t = (dy + 21) / 12.0;
      const w = 11 + t * 7.5;
      for (let dx = -w; dx <= w; dx++) {
        const adx = Math.abs(dx);
        const nx = dx / w;
        const nz = Math.sqrt(Math.max(0.15, 1 - nx * nx));

        const isCloakEdge = Math.abs(adx - (4 + t * 2)) < 1.1;
        if (isCloakEdge) {
          this.setPixel(cx + dx, footY + dy, MAT.GOLD, 0.85, nx, 0, nz, 11, "║");
        } else if (adx < 4 + t * 2) {
          this.setPixel(cx + dx, footY + dy, MAT.CLOTH_EMERALD, 0.45 + 0.3 * nz, nx, 0, nz, 10);
        } else {
          const pleat = Math.sin(dx * 0.85) * 0.12;
          const ch = pleat > 0.08 ? (dx < 0 ? "/" : "\\") : null;
          this.setPixel(cx + dx, footY + dy, MAT.CLOTH_TEAL, 0.55 + 0.4 * nz + pleat, nx, 0, nz, 11, ch);
        }
      }
    }

    const headY = footY - 24;
    this.drawEllipsoid(cx, headY, 6.5, 4.5, MAT.SKIN, 0.82, 13);

    for (let side of [-1, 1]) {
      const ex = cx + side * 2.8;
      this.setPixel(ex - 1, headY - 1, MAT.HAIR_WHITE, 0.95, 0, -0.3, 0.9, 15, "─");
      this.setPixel(ex,     headY - 1, MAT.HAIR_WHITE, 0.95, 0, -0.3, 0.9, 15, "═");
      this.setPixel(ex + 1, headY - 1, MAT.HAIR_WHITE, 0.95, 0, -0.3, 0.9, 15, "─");
      this.setPixel(ex,     headY,     MAT.GOLD,       0.98, 0, 0, 1, 15, "●");
    }
    this.setPixel(cx, headY,     MAT.SKIN, 0.92, 0, 0, 1, 15, "│");
    this.setPixel(cx, headY + 1, MAT.SKIN, 0.88, 0, 0.2, 0.95, 15, "╰");

    for (let bdy = 1; bdy <= 11; bdy++) {
      const bw = 6.2 * (1.0 - (bdy / 13.5) ** 1.3);
      for (let bdx = -bw; bdx <= bw; bdx++) {
        if (bdy === 1 && Math.abs(bdx) < 1.5) continue;
        const nx = bdx / (bw + 0.5);
        const nz = Math.sqrt(Math.max(0.2, 1 - nx * nx));
        const strand = ((Math.round(bdx) + bdy) % 2 === 0) ? "│" : (bdx < 0 ? "\\" : "/");
        this.setPixel(cx + bdx, headY + bdy, MAT.HAIR_WHITE, 0.65 + 0.35 * nz, nx, 0.2, nz, 14, bdy === 11 ? "v" : strand);
      }
    }

    for (let dy = -9; dy <= -5; dy++) {
      const sw = 5.5 - Math.abs(dy + 5) * 0.55;
      for (let dx = -sw; dx <= sw; dx++) {
        const nx = dx / (sw + 0.5);
        const nz = Math.sqrt(Math.max(0.15, 1 - nx * nx));
        this.setPixel(cx + dx, headY + dy, MAT.GOLD, 0.55 + 0.4 * nz, nx, -0.2, nz, 14);
      }
    }
    for (let dy = -5; dy <= -2; dy++) {
      const tw = 7.5 - Math.abs(dy + 3.5) * 0.6;
      for (let dx = -tw; dx <= tw; dx++) {
        const nx = dx / (tw + 0.5);
        const nz = Math.sqrt(Math.max(0.2, 1 - nx * nx));
        const fold = Math.sin(dx * 0.7 + dy * 1.2) > 0 ? "═" : "▒";
        this.setPixel(cx + dx, headY + dy, MAT.CLOTH_EMERALD, 0.6 + 0.4 * nz, nx, 0, nz, 15, fold);
      }
    }

    const handX = cx + 11;
    const handY = footY - 8;
    this.drawEllipsoid(handX, handY, 2.0, 1.3, MAT.SKIN, 0.85, 13);
    this.drawEllipsoid(cx - 10, footY - 8, 2.0, 1.3, MAT.SKIN, 0.85, 13);

    for (let i = 0; i < 8; i++) {
      const bx = handX + 1 + Math.sin(i * 0.5 + this.tick * 0.3) * 1.2;
      const by = handY + i * 0.9;
      const isImame = (i === 0 || (i + this.tick) % 3 === 0);
      this.setPixel(bx, by, MAT.GOLD, 0.98, 0, 0, 1, 15, isImame ? "✦" : "o");
    }
  }

  // ==========================================================================
  // 6. CEVİZ RAHLE & MUSHAF-I ŞERİF
  // ==========================================================================
  buildRahleModel(cx, footY) {
    for (let dy = -12; dy <= 0; dy++) {
      const t = (dy + 12) / 12.0;
      const spread = Math.abs(t - 0.45) * 18 + 2;
      for (let dx = -spread - 3; dx <= spread + 3; dx++) {
        const adx = Math.abs(dx);
        if (Math.abs(adx - spread) <= 2.2) {
          const ch = (t < 0.45) ? (dx < 0 ? "\\" : "/") : (dx < 0 ? "/" : "\\");
          this.setPixel(cx + dx, footY + dy, MAT.WOOD, 0.65, dx / 15, 0, 0.8, 8, ch);
        } else if (adx < spread && dy >= -7 && dy <= -3) {
          this.setPixel(cx + dx, footY + dy, MAT.DARK_WOOD, 0.48, 0, 0, 0.9, 7, (dx + dy) % 2 === 0 ? "░" : "▒");
        }
      }
    }

    for (let dy = -19; dy <= -10; dy++) {
      for (let dx = -12; dx <= 12; dx++) {
        const pageCurve = Math.sin((Math.abs(dx) / 12) * Math.PI) * 1.2;
        const py = Math.round(footY + dy - pageCurve);
        const adx = Math.abs(dx);

        if (adx === 0) {
          this.setPixel(cx, py, MAT.CLOTH_CRIMSON, 0.85, 0, 0, 1, 11, "║");
        } else if (adx === 12 || dy === -19 || dy === -10) {
          this.setPixel(cx + dx, py, MAT.GOLD, 0.88, 0, 0, 1, 11, "═");
        } else if (Math.hypot(adx - 6, dy + 15) <= 2.2) {
          this.setPixel(cx + dx, py, MAT.GOLD, 0.95, 0, 0, 1, 11, "❂");
        } else if (dy % 2 === 0 && adx >= 2 && adx <= 10) {
          this.setPixel(cx + dx, py, MAT.DARK_WOOD, 0.55, 0, 0, 1, 11, "≡");
        } else {
          const nx = (dx < 0 ? -1 : 1) * Math.cos((adx / 12) * Math.PI) * 0.3;
          this.setPixel(cx + dx, py, MAT.PARCHMENT, 0.85, nx, -0.2, 0.9, 10);
        }
      }
    }

    for (let dy = -9; dy <= -5; dy++) {
      this.setPixel(cx, footY + dy, MAT.GOLD, 0.9, 0, 0, 1, 11, dy === -5 ? "▼" : "│");
    }

    for (let side of [-1, 1]) {
      const sx = cx + side * 17;
      for (let dy = -14; dy <= 0; dy++) {
        const w = dy === 0 ? 3 : dy === -1 ? 2 : dy === -12 ? 2 : 1;
        for (let dx = -w; dx <= w; dx++) {
          const mat = (dy >= -14 && dy <= -12) ? MAT.PARCHMENT : MAT.GOLD;
          this.setPixel(sx + dx, footY + dy, mat, 0.8, dx * 0.3, 0, 0.9, 10);
        }
      }
      const fChar = (this.tick % 2 === 0) ? "✦" : "*";
      this.setPixel(sx, footY - 15, MAT.FIRE, 1.0, 0, 0, 1, 12, "@");
      this.setPixel(sx, footY - 16, MAT.FIRE, 0.9, 0, 0, 1, 12, fChar);
    }
  }

  // ==========================================================================
  // 7. KADİM SEDİR SANDIĞI
  // ==========================================================================
  buildChestModel(cx, footY) {
    const halfW = 19;
    for (let dy = -18; dy <= 0; dy++) {
      const isLid = dy < -11;
      const lidT = isLid ? (-11 - dy) / 7.0 : 0;
      const curW = Math.round(halfW - lidT * 3.5);

      if (dy >= -1) {
        for (let dx = -halfW; dx <= halfW; dx++) {
          if (Math.abs(dx) >= halfW - 4 && Math.abs(dx) <= halfW - 1) {
            this.setPixel(cx + dx, footY + dy, MAT.IRON, 0.7, 0, 0, 1, 8, "█");
          }
        }
        continue;
      }

      for (let dx = -curW; dx <= curW; dx++) {
        const adx = Math.abs(dx);
        const nx = dx / (curW + 1);
        const ny = isLid ? -0.5 - lidT * 0.4 : 0.1;
        const nz = Math.sqrt(Math.max(0.15, 1 - nx * nx * 0.5 - ny * ny * 0.5));

        if (adx <= 4 && dy >= -13 && dy <= -8) {
          const isKeyhole = adx <= 1 && (dy === -11 || dy === -10);
          const ch = isKeyhole ? (this.tick % 2 === 0 ? "✦" : "❖") : (adx === 4 || dy === -13 || dy === -8 ? "╬" : "▓");
          this.setPixel(cx + dx, footY + dy, MAT.GOLD, isKeyhole ? 1.0 : 0.85, 0, 0, 1, 11, ch);
        } else if ((adx >= 11 && adx <= 13) || adx === curW || dy === -18 || dy === -11 || dy === -2) {
          const isRivet = (dy % 3 === 0 && adx === 12);
          this.setPixel(cx + dx, footY + dy, isRivet ? MAT.GOLD : MAT.IRON, (isRivet ? 0.95 : 0.7) * nz + 0.15, nx, ny, nz, 10, isRivet ? "•" : null);
        } else {
          const plankSeam = (dy % 3 === 0);
          const grain = Math.sin(dx * 0.3 + dy * 1.7) * 0.08;
          this.setPixel(cx + dx, footY + dy, plankSeam ? MAT.DARK_WOOD : MAT.WOOD, (plankSeam ? 0.38 : 0.65) * nz + grain, nx, ny, nz, 9, plankSeam ? "─" : null);
        }
      }
    }
  }

  // ==========================================================================
  // 8. SÂLİK / PLAYER
  // ==========================================================================
  buildSalikModel(cx, footY, player) {
    const isArmed = player.equipped.weapon !== "Yalın El";
    const dir = player.direction || "down";
    const walkPhase = (player.animFrame % 2) * Math.PI;
    const stride = Math.sin(walkPhase) * 2.0;

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -12; dx <= 12; dx++) {
        if ((dx / 12) ** 2 + (dy / 2.2) ** 2 <= 1.0) {
          this.setPixel(cx + dx, footY + dy, MAT.MORTAR, 0.12, 0, 0, 1, 1);
        }
      }
    }

    const leftBootY = footY + (player.animFrame % 2 === 0 ? 0 : -1);
    const rightBootY = footY + (player.animFrame % 2 === 0 ? -1 : 0);
    this.drawEllipsoid(cx - 4.5, leftBootY - 1, 3.2, 1.6, MAT.DARK_WOOD, 0.65, 5);
    this.drawEllipsoid(cx + 4.5, rightBootY - 1, 3.2, 1.6, MAT.DARK_WOOD, 0.65, 5);

    const robeMat = isArmed ? MAT.CLOTH_EMERALD : MAT.CLOTH_GRAY;
    for (let dy = -18; dy <= -3; dy++) {
      const t = (dy + 18) / 15.0;
      const w = t < 0.35 ? (8.5 + t * 8) : (7.0 + t * 5.5);

      for (let dx = -w; dx <= w; dx++) {
        const adx = Math.abs(dx);
        const nx = dx / (w + 0.5);
        const nz = Math.sqrt(Math.max(0.15, 1 - nx * nx));

        if (dy === -11 || dy === -10) {
          if (adx <= w * 0.78) {
            const isBuckle = adx <= 1.5;
            this.setPixel(cx + dx, footY + dy, MAT.GOLD, isBuckle ? 0.98 : 0.78, nx, 0, nz, 11, isBuckle ? "❖" : "═");
            continue;
          }
        }

        if (dir === "up" && isArmed && Math.hypot(dx * 0.8, dy + 14) <= 2.6) {
          this.setPixel(cx + dx, footY + dy, MAT.GOLD, 0.92, nx, 0, nz, 11, "❂");
          continue;
        }
        if (dir === "down" && adx < 1.2 && dy < -11) {
          this.setPixel(cx + dx, footY + dy, MAT.GOLD, 0.82, 0, 0, 1, 11, "║");
          continue;
        }

        const foldWave = Math.sin(dx * 0.85 + stride * 0.4);
        const foldLum = foldWave * 0.14;
        const foldCh = foldWave > 0.65 ? (dx < 0 ? "/" : "\\") : null;
        this.setPixel(cx + dx, footY + dy, robeMat, (0.48 + 0.44 * nz) + foldLum, nx, 0.1, nz, 10, foldCh);
      }
    }

    const headY = footY - 22;
    const faceShiftX = dir === "left" ? -1.5 : dir === "right" ? 1.5 : 0;

    if (dir === "up") {
      this.drawEllipsoid(cx, headY, 5.5, 4.0, robeMat, 0.65, 12);
    } else {
      this.drawEllipsoid(cx, headY, 5.5, 4.0, MAT.SKIN, 0.82, 12);

      for (let bdy = 1; bdy <= 4; bdy++) {
        const bw = 5.0 * (1 - bdy * 0.18);
        for (let bdx = -bw; bdx <= bw; bdx++) {
          const nx = bdx / (bw + 0.5);
          this.setPixel(cx + bdx + faceShiftX * 0.4, headY + bdy, MAT.HAIR_DARK, 0.45 + 0.3 * (1 - Math.abs(nx)), nx, 0.3, 0.8, 13);
        }
      }

      if (dir === "down") {
        this.setPixel(cx - 2, headY - 1, MAT.HAIR_DARK, 0.8, 0, 0, 1, 14, "─");
        this.setPixel(cx + 2, headY - 1, MAT.HAIR_DARK, 0.8, 0, 0, 1, 14, "─");
        this.setPixel(cx - 2, headY,     MAT.GOLD,      0.98, 0, 0, 1, 14, "●");
        this.setPixel(cx + 2, headY,     MAT.GOLD,      0.98, 0, 0, 1, 14, "●");
        this.setPixel(cx,     headY,     MAT.SKIN,      0.92, 0, 0, 1, 14, "│");
      } else {
        const eyeX = cx + (dir === "left" ? -2.5 : 2.5);
        this.setPixel(eyeX, headY - 1, MAT.HAIR_DARK, 0.8, 0, 0, 1, 14, "─");
        this.setPixel(eyeX, headY,     MAT.GOLD,      0.98, 0, 0, 1, 14, "●");
      }
    }

    for (let dy = -8; dy <= -2; dy++) {
      const sw = 5.6 - Math.abs(dy + 2) * 0.42;
      for (let dx = -sw; dx <= sw; dx++) {
        const nx = dx / (sw + 0.5);
        const nz = Math.sqrt(Math.max(0.15, 1 - nx * nx));
        const isDestar = dy >= -3;
        const mat = isDestar ? (isArmed ? MAT.CLOTH_EMERALD : MAT.CLOTH_GRAY) : MAT.WOOD;
        const ch = isDestar ? "═" : null;
        this.setPixel(cx + dx, headY + dy, mat, 0.55 + 0.4 * nz, nx, -0.2, nz, 14, ch);
      }
    }

    if (isArmed) {
      const staffX = dir === "left" ? cx - 12 : cx + 12;
      for (let sy = headY - 6; sy <= footY; sy++) {
        this.setPixel(staffX,     sy, MAT.WOOD, 0.78, -0.3, 0, 0.9, 14, "║");
        this.setPixel(staffX + 1, sy, MAT.DARK_WOOD, 0.52, 0.5, 0, 0.8, 14, "│");
      }
      this.drawEllipsoid(staffX + 0.5, headY - 8, 2.2, 1.8, MAT.GOLD, 0.98, 15, (dx, dy, dz) => dz > 0.7 ? "✦" : null);
      this.drawEllipsoid(staffX, footY - 12, 1.8, 1.2, MAT.SKIN, 0.85, 15);
    }
  }

  // ==========================================================================
  // CACHED PORTRAIT RENDERER (0.1ms blit after first draw!)
  // ==========================================================================
  renderPortraitToCanvas(canvas, portraitKey, animTick) {
    if (!canvas) return;
    const pCols = 94;
    const pRows = 32;
    const cellW = 6;
    const cellH = 10;
    const targetW = pCols * cellW;
    const targetH = pRows * cellH;

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const f = animTick % 2;
    const cacheKey = `${portraitKey}_${f}`;
    if (this.portraitCache.has(cacheKey)) {
      canvas.getContext("2d").drawImage(this.portraitCache.get(cacheKey), 0, 0);
      return;
    }

    const offCanvas = document.createElement("canvas");
    offCanvas.width = targetW;
    offCanvas.height = targetH;
    const ctx = offCanvas.getContext("2d");

    ctx.fillStyle = "#030904";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.font = "bold 9.5px 'Fira Code', 'Consolas', 'Courier New', monospace";
    ctx.textBaseline = "top";

    const PROFILES = {
      nefs: {
        title: "NEFS-İ EMMÂRE",
        subtitle: "Mertebe: 1. Daire (Zulmet & Gazap)",
        quote: "'Ben ateşim ve açlığım! Bu beden benim mülkümdür!'",
        element: "Unsur: Nâr (Kızıl Alev) | Tetikleyici: Hırs & Öfke",
        color: [255, 85, 65],
        accent: [255, 185, 50]
      },
      akil: {
        title: "AKIL-I ME'ÂŞ",
        subtitle: "Mertebe: İstidlâl, Hendese & Nizam",
        quote: "'Ölç, tart ve kıyas et. Pusulasız menzile varılmaz.'",
        element: "Unsur: Hava (Berrak Zihin) | Tetikleyici: Mantık & İlim",
        color: [75, 175, 255],
        accent: [180, 230, 255]
      },
      kalp: {
        title: "KALP-İ SELÎM",
        subtitle: "Mertebe: Letâif-i Kalp & Merhamet",
        quote: "'Suskunlukta dinle; hakikat kırık kalpte tecelli eder.'",
        element: "Unsur: Âb-ı Hayat (Zümrüt) | Tetikleyici: Aşk & Şefkat",
        color: [65, 235, 125],
        accent: [210, 255, 210]
      },
      ruh: {
        title: "RUH-I LATÎF",
        subtitle: "Mertebe: Âlem-i Emr & Vahdet Sırrı",
        quote: "'Bu balçık kafeste misafirsin. Asıl vatanını hatırla.'",
        element: "Unsur: Nûr-ı İlâhî (Altın) | Tetikleyici: Keşf & Sezgi",
        color: [255, 215, 75],
        accent: [255, 250, 200]
      },
      dervis: {
        title: "PÎR-İ ŞEYH BURHÂNEDDİN",
        subtitle: "Makam: İbtida Halvetgâhı Postnişini",
        quote: "'Hoş geldin sâlik. 99 basamaklı sır bu eşikte başlar.'",
        element: "Durum: Zikir & Murakabe | Tarikat: Sefîne-i Nûr",
        color: [72, 215, 195],
        accent: [245, 215, 95]
      },
      salik: {
        title: "SÂLİK (SEN / YOLCU)",
        subtitle: "Mertebe: Mübtedî (Sekans 1 / 99)",
        quote: "'Taş zeminde uyandım. İçimde dört ses, önümde 99 kapı.'",
        element: "Zihin: Arayış & Hayret | Menzil: İbtida Halvetgâhı",
        color: [220, 245, 230],
        accent: [85, 225, 135]
      },
      system: {
        title: "KİTÂB-I KADER (LEVH-İ SIR)",
        subtitle: "Kayıt: Amel Defteri & Kadim Tekke Mührü",
        quote: "'Her niyet ve her adım, 99 taneli tesbihin ipine dizilir.'",
        element: "Durum: Kayıt & Hüküm | Çapraz: 1. Bölüm (1-33)",
        color: [215, 195, 140],
        accent: [255, 215, 80]
      }
    };

    const prof = PROFILES[portraitKey] || PROFILES.salik;
    const ramp = " .,:;-=+*#%@W";

    const cx = 19.5;
    const cy = 16.5;
    for (let r = 1; r < pRows - 1; r++) {
      for (let c = 1; c <= 38; c++) {
        if (r === 1 || r === pRows - 2 || c === 1 || c === 38) {
          ctx.fillStyle = `rgb(${prof.color[0] >> 1},${prof.color[1] >> 1},${prof.color[2] >> 1})`;
          ctx.fillText(r === 1 || r === pRows - 2 ? "═" : "║", c * cellW, r * cellH);
          continue;
        }

        const dx = (c - cx) / 14.0;
        const dy = (r - cy) / 11.5;
        const dist = Math.hypot(dx, dy);

        let lum = 0;
        let ch = null;
        let rgb = prof.color;

        const headDx = (c - cx) / 7.5;
        const headDy = (r - (cy - 1.5)) / 6.2;
        const headD2 = headDx * headDx + headDy * headDy;

        const shDx = (c - cx) / 14.5;
        const shDy = (r - (cy + 10.5)) / 6.5;
        const shD2 = shDx * shDx + shDy * shDy;

        const crownDx = (c - cx) / 6.8;
        const crownDy = (r - (cy - 8.5)) / 4.2;
        const crownD2 = crownDx * crownDx + crownDy * crownDy;

        if (portraitKey === "nefs" && r < cy - 3 && Math.abs(Math.abs(c - cx) - (cy - r) * 0.75) < 2.0 && r > 3) {
          lum = 0.85;
          ch = (r + f) % 2 === 0 ? "^" : "#";
          rgb = prof.accent;
        } else if (headD2 <= 1.0) {
          const nz = Math.sqrt(1.0 - headD2);
          lum = 0.35 + 0.65 * nz;
          if (Math.abs(r - (cy - 2)) <= 0.6 && (Math.abs(c - (cx - 3)) <= 1.1 || Math.abs(c - (cx + 3)) <= 1.1)) {
            lum = 0.99;
            ch = "●";
            rgb = prof.accent;
          } else if (Math.abs(c - cx) < 0.8 && r >= cy - 2 && r <= cy + 1) {
            lum = 0.9;
            ch = "│";
          } else if (r > cy + 1) {
            ch = (c + r) % 2 === 0 ? "░" : "▒";
          }
        } else if (crownD2 <= 1.0 && r < cy - 3) {
          const nz = Math.sqrt(1.0 - crownD2);
          lum = 0.45 + 0.55 * nz;
          rgb = r >= cy - 5 ? prof.accent : prof.color;
          if (r >= cy - 5) ch = "═";
        } else if (shD2 <= 1.0 && r > cy + 4) {
          const nz = Math.sqrt(1.0 - shD2);
          lum = 0.3 + 0.6 * nz;
          ch = Math.sin(c * 0.8) > 0.4 ? "/" : null;
        } else if (dist < 1.15) {
          const ring = Math.sin(dist * 16 - f * 0.8);
          if (ring > 0.65) {
            lum = 0.45;
            ch = (c + r) % 3 === 0 ? "✧" : "·";
            rgb = prof.accent;
          }
        }

        if (lum > 0.05) {
          if (!ch) {
            const rIdx = clamp(Math.floor(lum * ramp.length), 0, ramp.length - 1);
            ch = ramp[rIdx];
          }
          const fgR = Math.round(rgb[0] * lum);
          const fgG = Math.round(rgb[1] * lum);
          const fgB = Math.round(rgb[2] * lum);
          ctx.fillStyle = `rgb(${fgR >> 2},${fgG >> 2},${fgB >> 2})`;
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          ctx.fillStyle = `rgb(${fgR},${fgG},${fgB})`;
          ctx.fillText(ch, c * cellW, r * cellH);
        }
      }
    }

    const drawTextLine = (col, row, str, rgb) => {
      ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      for (let i = 0; i < str.length && col + i < pCols - 1; i++) {
        ctx.fillText(str[i], (col + i) * cellW, row * cellH);
      }
    };

    drawTextLine(41, 3,  "╔══════════════════════════════════════════════════╗", prof.color);
    drawTextLine(41, 5,  `║  ❖ ${prof.title.padEnd(44, " ")} ║`, prof.accent);
    drawTextLine(41, 7,  "╠══════════════════════════════════════════════════╣", prof.color);
    drawTextLine(41, 10, `║  ${prof.subtitle.padEnd(47, " ")} ║`, [190, 230, 200]);
    drawTextLine(41, 13, "╟──────────────────────────────────────────────────╢", prof.color);
    drawTextLine(41, 16, `║  ${prof.quote.slice(0, 47).padEnd(47, " ")} ║`, prof.accent);
    if (prof.quote.length > 47) {
      drawTextLine(41, 18, `║  ${prof.quote.slice(47, 94).padEnd(47, " ")} ║`, prof.accent);
    }
    drawTextLine(41, 22, "╟──────────────────────────────────────────────────╢", prof.color);
    drawTextLine(41, 25, `║  ${prof.element.slice(0, 47).padEnd(47, " ")} ║`, [160, 210, 175]);
    drawTextLine(41, 28, "╚══════════════════════════════════════════════════╝", prof.color);

    this.portraitCache.set(cacheKey, offCanvas);
    canvas.getContext("2d").drawImage(offCanvas, 0, 0);
  }
}
