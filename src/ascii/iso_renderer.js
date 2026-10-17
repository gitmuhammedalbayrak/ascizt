// High-Resolution (32x32 Sprite Grade) 2.5D Seljuk Room Engine
// Canvas: 156 columns x 56 rows (over 8,700 ASCII cells!)
// Features: Multi-material per-glyph coloring, Y-Depth Painter's Algorithm, 32x32 Character Models

import { CHARACTERS } from "./characters.js";

export class IsoRenderer {
  constructor(width = 156, height = 56) {
    this.width = width;
    this.height = height;
    this.tick = 0;
  }

  renderScene(room, player, animTick) {
    this.tick = animTick;

    const charBuf = Array.from({ length: this.height }, () => Array(this.width).fill(" "));
    const styleBuf = Array.from({ length: this.height }, () => Array(this.width).fill(""));

    const putChar = (r, c, ch, style = "") => {
      if (r < 0 || r >= this.height || c < 0 || c >= this.width) return;
      charBuf[r][c] = ch;
      if (style) styleBuf[r][c] = style;
    };

    const putStr = (r, c, str, style = "") => {
      if (r < 0 || r >= this.height) return;
      for (let i = 0; i < str.length; i++) {
        const col = c + i;
        if (col >= 0 && col < this.width) {
          charBuf[r][col] = str[i];
          if (style) styleBuf[r][col] = style;
        }
      }
    };

    // Draw transparent multi-line sprite with custom per-row/per-char colorizer
    const drawModel = (topR, leftC, lines, colorFn) => {
      for (let r = 0; r < lines.length; r++) {
        const rowStr = lines[r];
        const targetR = topR + r;
        if (targetR < 0 || targetR >= this.height) continue;
        for (let c = 0; c < rowStr.length; c++) {
          const ch = rowStr[c];
          if (ch === " ") continue; // Transparent background
          const targetC = leftC + c;
          if (targetC < 0 || targetC >= this.width) continue;
          const style = colorFn ? colorFn(r, c, ch, rowStr) : "c-player";
          charBuf[targetR][targetC] = ch;
          styleBuf[targetR][targetC] = style;
        }
      }
    };

    // =========================================================================
    // 1. NORTH WALL ARCHITECTURE (Rows 0..17, Width 156)
    // =========================================================================
    putStr(0, 0, "╔" + "═".repeat(this.width - 2) + "╗", "c-stone-cap");

    // Seljuk Geometric Mukarnas Frieze on Row 1
    let frieze = "║ ";
    for (let i = 0; i < 19; i++) frieze += "❖══╦══❖ ";
    frieze = frieze.slice(0, this.width - 1) + "║";
    putStr(1, 0, frieze, "c-stone-wall");

    // Ashlar Stone Masonry Courses (Rows 2..16)
    for (let r = 2; r <= 16; r++) {
      putChar(r, 0, "║", "c-stone-cap");
      putChar(r, this.width - 1, "║", "c-stone-cap");
      for (let c = 1; c < this.width - 1; c++) {
        if (r % 3 === 0) {
          putChar(r, c, "─", "c-stone-fill");
        } else {
          const offset = (Math.floor(r / 3) % 2) * 6;
          if ((c + offset) % 12 === 0) {
            putChar(r, c, "│", "c-stone-fill");
          } else if ((r + c) % 5 === 0) {
            putChar(r, c, "░", "c-stone-fill");
          }
        }
      }
    }

    // Wall Base Wainscoting / Dado Moulding (Row 17)
    putStr(17, 0, "╠" + "═".repeat(this.width - 2) + "╣", "c-stone-cap");

    // =========================================================================
    // 2. PERSPECTIVE SIDE WALLS & FLOOR PAVING (Rows 18..54)
    // =========================================================================
    for (let r = 18; r < this.height - 1; r++) {
      // Left & Right 2.5D Stone Pilasters
      putStr(r, 0, "║██▒│", "c-stone-wall");
      putStr(r, this.width - 5, "│▒██║", "c-stone-wall");

      if (r % 6 === 0) {
        putStr(r, 0, "╠═══╡", "c-stone-cap");
        putStr(r, this.width - 5, "╞═══╣", "c-stone-cap");
      }

      // Perspective Stone Floor Tiling
      for (let c = 5; c < this.width - 5; c++) {
        // Horizontal stone joint lines every 4 rows
        if (r % 4 === 0) {
          putChar(r, c, (c % 14 === 0) ? "┼" : "─", "c-floor-edge");
        } else if (c % 14 === 0) {
          putChar(r, c, "│", "c-floor-edge");
        } else if ((r % 2 === 0) && ((c + r) % 7 === 0)) {
          putChar(r, c, "·", "c-floor");
        }
      }
    }

    // Bottom Threshold Border (Row 55)
    putStr(this.height - 1, 0, "╚" + "═".repeat(this.width - 2) + "╝", "c-stone-cap");

    // =========================================================================
    // 3. GRAND CENTRAL SELJUK PRAYER CARPET / HALI (Rows 21..45, Cols 44..112)
    // =========================================================================
    const cLeft = 44;
    const cRight = 111;
    const cTop = 21;
    const cBot = 45;
    const cWidth = cRight - cLeft + 1;

    // Top & Bottom Silk Fringes (Saçaklar)
    putStr(cTop - 1, cLeft + 2, "╥".repeat(cWidth - 4), "c-gold");
    putStr(cBot + 1, cLeft + 2, "╨".repeat(cWidth - 4), "c-gold");

    // Outer Carpet Frame
    putStr(cTop, cLeft, "╔" + "═".repeat(cWidth - 2) + "╗", "c-carpet-border");
    putStr(cBot, cLeft, "╚" + "═".repeat(cWidth - 2) + "╝", "c-carpet-border");

    for (let r = cTop + 1; r < cBot; r++) {
      putChar(r, cLeft, "║", "c-carpet-border");
      putChar(r, cRight, "║", "c-carpet-border");

      for (let c = cLeft + 1; c < cRight; c++) {
        const dr = r - cTop;
        const dc = c - cLeft;
        const mr = cBot - r;
        const mc = cRight - c;

        // Outer Guard Border
        if (dr === 1 || mr === 1 || dc <= 2 || mc <= 2) {
          const ch = (dr + dc) % 2 === 0 ? "▒" : "░";
          putChar(r, c, ch, "c-carpet-border");
        }
        // Inner Geometric Frame
        else if (dr === 2 || mr === 2 || dc === 3 || mc === 3) {
          putChar(r, c, (dr + dc) % 4 === 0 ? "❖" : "═", "c-gold");
        }
        // Central Crimson Field
        else {
          // Center Medallion geometry
          const centerR = Math.floor((cTop + cBot) / 2);
          const centerC = Math.floor((cLeft + cRight) / 2);
          const distR = Math.abs(r - centerR);
          const distC = Math.abs(c - centerC);

          if (distR * 2 + distC <= 8) {
            putChar(r, c, (distR + distC) % 2 === 0 ? "❂" : "░", "c-gold");
          } else {
            putChar(r, c, (r + c) % 3 === 0 ? "≈" : "░", "c-carpet-inner");
          }
        }
      }
    }

    // =========================================================================
    // 4. WALL SCONCES & MONUMENTAL TAÇ KAPI (North Wall Fixtures)
    // =========================================================================
    const animF = Math.floor(this.tick / 2) % 2;

    // Left & Right Wall Kandils (16x11)
    const torchSprite = CHARACTERS.torch.frames[animF];
    const torchColorFn = (r, c, ch) => {
      if (r <= 4 && ch !== "│" && ch !== "╭" && ch !== "╮" && ch !== "─") {
        return ch === "█" || ch === "✦" ? "c-flame-2" : "c-flame-1";
      }
      if (r === 5 || ch === "╦" || ch === "╩" || ch === "█") return "c-gold";
      return "c-stone-cap";
    };
    drawModel(3, 14, torchSprite, torchColorFn);
    drawModel(3, 126, torchSprite, torchColorFn);
    putStr(15, 16, "[ SOL KANDİL ]", "c-gold");
    putStr(15, 127, "[ SAĞ KANDİL ]", "c-gold");

    // Selçuklu Taç Kapı / Sır Kapısı (50x16 at Center of North Wall)
    const doorSprite = CHARACTERS.door.frames[animF];
    const doorColorFn = (r, c, ch) => {
      if (r === 1 && (ch === "❖" || (c >= 16 && c <= 33))) return "c-gold";
      if (ch === "✦" || ch === "❖" || ch === "◈") return "c-gold";
      if (c >= 3 && c <= 6 && r >= 3 && r <= 14) return "c-door";
      if (c >= 42 && c <= 45 && r >= 3 && r <= 14) return "c-door";
      if (ch === "░" || ch === "▒" || ch === "▓") return "c-door";
      return "c-stone-cap";
    };
    drawModel(1, 53, doorSprite, doorColorFn);

    // =========================================================================
    // 5. Y-DEPTH SORTED 32x32 ROOM ENTITIES (Pîr, Rahle, Sandık, Sâlik)
    // =========================================================================
    const entities = [
      // Pîr-i Şeyh Burhâneddin (Sitting on the upper center of the carpet)
      {
        id: "pir",
        footY: 34,
        render: () => {
          const pirSprite = CHARACTERS.pir.frames[animF];
          // Label above Pîr
          putStr(15, 65, "⟦ PÎR-İ ŞEYH BURHÂNEDDİN ⟧", "c-pir");
          drawModel(16, 62, pirSprite, (r, c, ch) => {
            if (r <= 2) return "c-gold"; // Sikke dome
            if (r >= 3 && r <= 4) return "c-stone-cap"; // Green Destar wrap
            if (ch === "o" || ch === "•" || ch === "❖") return "c-gold"; // 99-bead Tesbih
            if (r >= 6 && r <= 13 && (ch === "●" || ch === "─" || ch === "░" || ch === "▒" || ch === "═")) {
              return "c-player"; // Face & white beard
            }
            return "c-pir"; // Turquoise dervish cloak
          });
        }
      },

      // Ceviz Rahle & Mushaf (Left side of room)
      {
        id: "desk",
        footY: 41,
        render: () => {
          const deskSprite = CHARACTERS.desk.frames[animF];
          putStr(23, 12, "⟦ CEVİZ RAHLE & MUSHAF ⟧", "c-gold");
          drawModel(25, 8, deskSprite, (r, c, ch) => {
            if (ch === "*" || ch === "^" || ch === "✦") return "c-flame-2";
            if (ch === "❂" || ch === "▼") return "c-gold";
            if (ch === "≡" || (r >= 3 && r <= 6 && ch === "░")) return "c-player"; // Parchment
            if (c <= 8 || c >= 23) return "c-gold"; // Brass candlesticks
            return "c-desk"; // Carved walnut wood
          });
        }
      },

      // Kadim Sedir Sandığı (Right side of room)
      {
        id: "chest",
        footY: 40,
        render: () => {
          const chestSprite = CHARACTERS.chest.frames[animF];
          putStr(24, 119, "⟦ KADİM SEDİR SANDIĞI ⟧", "c-gold");
          drawModel(26, 114, chestSprite, (r, c, ch) => {
            if (ch === "✦" || ch === "*" || ch === "❖" || ch === "[" || ch === "]") return "c-gold";
            if (ch === "█") return "c-steel"; // Forged iron bands
            return "c-chest"; // Cedarwood planks
          });
        }
      },

      // Sâlik / Player (Dynamic position)
      {
        id: "player",
        footY: Math.round(player.y),
        render: () => {
          const pr = Math.round(player.y);
          const pc = Math.round(player.x);
          const isArmed = player.equipped.weapon !== "Yalın El";
          const modelSet = isArmed ? CHARACTERS.player.armed : CHARACTERS.player.unarmed;
          const dirFrames = modelSet[player.direction] || modelSet.down;
          const sprite = dirFrames[player.animFrame % 2];

          // Elliptical ground shadow beneath boots
          putStr(pr, pc - 9, "▄▄██████████████████▄▄", "c-shadow");

          // Draw 26x16 high-detail player sprite
          drawModel(pr - 15, pc - 13, sprite, (r, c, ch) => {
            // Staff on right or left side
            if (isArmed && ((player.direction !== "left" && c >= 21) || (player.direction === "left" && c <= 5))) {
              return ch === "◯" || ch === "▓" ? "c-gold" : "c-desk";
            }
            // Sikke (Keçe Külah)
            if (r <= 3) return isArmed ? "c-gold" : "c-chest";
            // Face & Eyes
            if (r >= 4 && r <= 8) return "c-face";
            // Belt (Kuşak) & Emblem
            if (ch === "❖" || ch === "╠" || ch === "╣" || ch === "╪" || ch === "═") return "c-gold";
            // Boots
            if (r === 15) return "c-chest";
            // Hırka Cloak
            return isArmed ? "c-player-armed" : "c-player";
          });
        }
      }
    ];

    // Sort by footY (Painter's Algorithm: back-to-front)
    entities.sort((a, b) => a.footY - b.footY);
    for (const ent of entities) {
      ent.render();
    }

    return this.buffersToHTML(charBuf, styleBuf);
  }

  buffersToHTML(charBuf, styleBuf) {
    let html = "";
    for (let r = 0; r < this.height; r++) {
      let line = "";
      let curClass = "";
      let curText = "";

      for (let c = 0; c < this.width; c++) {
        const ch = charBuf[r][c];
        const cl = styleBuf[r][c];

        if (cl !== curClass) {
          if (curText) {
            line += curClass ? `<span class="${curClass}">${escapeHTML(curText)}</span>` : escapeHTML(curText);
          }
          curClass = cl;
          curText = ch;
        } else {
          curText += ch;
        }
      }
      if (curText) {
        line += curClass ? `<span class="${curClass}">${escapeHTML(curText)}</span>` : escapeHTML(curText);
      }
      html += line + "\n";
    }
    return html;
  }
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
