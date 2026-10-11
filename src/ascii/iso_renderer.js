// 2.5D Frontal-Perspective Room Depth Engine for Sufi RPG (99 Tesbih)
// Straight, detailed Seljuk architecture (Not crooked/diagonal)
// Stable, dignified ASCII models with calm, non-jittery atmospheric animations

export class IsoRenderer {
  constructor(width = 62, height = 24) {
    this.width = width;
    this.height = height;
    this.tick = 0;
  }

  // Render the entire 2.5D Architectural Room
  renderScene(room, player, animTick) {
    this.tick = animTick;

    // Base character buffer (24 rows x 62 columns)
    const charBuf = Array.from({ length: this.height }, () => Array(this.width).fill(" "));
    const styleBuf = Array.from({ length: this.height }, () => Array(this.width).fill(""));

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

    // 1. OUTER STONE WALLS & VAULTED CEILING ARCH (Düz ve Sağlam Mimari)
    putStr(0,  0, "╔════════════════════════════════════════════════════════════╗", "c-stone-cap");
    putStr(1,  0, "║ [KANDİL]           ╔════════[ SIR KAPISI ]════════╗ [KANDİL] ║", "c-stone-wall");
    putStr(2,  0, "║   ( )              ║         .---======---.       ║   ( )   ║", "c-stone-wall");
    putStr(3,  0, "║   |=|              ║        /   /  /\\  \\   \\      ║   |=|   ║", "c-stone-wall");
    putStr(4,  0, "║                    ║       |   |  /  \\  |   |     ║         ║", "c-stone-wall");
    putStr(5,  0, "║                    ║       |   | | :: | |   |     ║         ║", "c-stone-wall");
    putStr(6,  0, "║                    ║       |===|_|____|_|===|     ║         ║", "c-stone-wall");
    putStr(7,  0, "╠════════════════════╩══════════════════════════════╩═════════╣", "c-stone-cap");

    // Side walls and floor background
    for (let r = 8; r < 23; r++) {
      charBuf[r][0] = "║";
      charBuf[r][1] = "░";
      charBuf[r][this.width - 2] = "░";
      charBuf[r][this.width - 1] = "║";
      styleBuf[r][0] = "c-stone-wall";
      styleBuf[r][1] = "c-stone-fill";
      styleBuf[r][this.width - 2] = "c-stone-fill";
      styleBuf[r][this.width - 1] = "c-stone-wall";

      // Subtle, calm floor paving pattern
      for (let c = 2; c < this.width - 2; c++) {
        if ((r + c) % 4 === 0 && (r % 2 === 0)) {
          charBuf[r][c] = "·";
          styleBuf[r][c] = "c-floor";
        }
      }
    }
    putStr(23, 0, "╚════════════════════════════════════════════════════════════╝", "c-stone-cap");

    // 2. ANIMATED TORCHES (Sakin ve Göz Yormayan Titreşim: 2 sakin evre)
    const flameState = Math.floor(this.tick / 2) % 2;
    const flameChar = flameState === 0 ? "(*)" : "(^)";
    putStr(2, 4, flameChar, "c-flame-1");
    putStr(2, 55, flameChar, "c-flame-1");
    // Warm steady wall glow
    putStr(3, 4, "|=|", "c-stone-cap");
    putStr(3, 55, "|=|", "c-stone-cap");

    // 3. SELÇUKLU SIR KAPISI (Kuzey Kemeri İçi Nur / Sır Parıltısı)
    const portalGleam = Math.floor(this.tick / 3) % 2 === 0 ? "::" : "✦✦";
    putStr(5, 27, portalGleam, "c-door");

    // 4. SELÇUKLU MERKEZ SECCADESİ / HALISI (Ortada Düzgün Yerleşim)
    // Rows 9 to 18, Cols 17 to 44
    putStr(9,  17, "┌──────────────────────────┐", "c-carpet-border");
    for (let r = 10; r <= 17; r++) {
      putStr(r, 17, "│", "c-carpet-border");
      putStr(r, 44, "│", "c-carpet-border");
      for (let c = 18; c <= 43; c++) {
        const isBorder = (c === 18 || c === 43 || r === 10 || r === 17);
        if (isBorder) {
          charBuf[r][c] = "░";
          styleBuf[r][c] = "c-carpet-border";
        } else {
          charBuf[r][c] = (r + c) % 2 === 0 ? "≈" : "═";
          styleBuf[r][c] = "c-carpet-inner";
        }
      }
    }
    putStr(18, 17, "└──────────────────────────┘", "c-carpet-border");

    // 5. CEVİZ RAHLE VE MUSHAF (Sol Tarafta Sağlam Yerleşim)
    // Rows 11 to 16, Cols 4 to 12
    putStr(10, 5, " [RAHLE] ", "c-gold");
    putStr(11, 6, " _/\\_ ", "c-desk");
    putStr(12, 5, " /    \\ ", "c-desk");
    putStr(13, 5, "/======\\", "c-desk");
    putStr(14, 6, " | || | ", "c-desk");
    putStr(15, 5, "/======\\", "c-desk");

    // 6. KADİM SEDİR SANDIĞI (Sağ Tarafta Sağlam Yerleşim)
    // Rows 11 to 15, Cols 47 to 58
    const lockGleam = Math.floor(this.tick / 4) % 2 === 0 ? "*" : "✦";
    putStr(10, 48, " [SANDIK] ", "c-gold");
    putStr(11, 48, ".--------.", "c-chest");
    putStr(12, 47, "/ [====] /|", "c-chest");
    putStr(13, 46, "+--------+ |", "c-chest");
    putStr(14, 46, `| | [${lockGleam}] ||/`, "c-chest");
    putStr(15, 46, "+--------+", "c-chest");

    // 7. PÎR-İ ŞEYH BURHÂNEDDİN (Halı Üzerinde Vakur ve Sakin Oturan Mürşid)
    // Rows 11 to 16, Cols 27 to 34
    const pirBead = Math.floor(this.tick / 2) % 2 === 0 ? "o~" : "~o";
    putStr(11, 28, " ,-----. ", "c-pir");
    putStr(12, 27, "/ (O)   \\", "c-pir");
    putStr(13, 27, "|  (•_•)  |", "c-pir");
    putStr(14, 27, `| /#|#|#\\ |${pirBead}`, "c-pir");
    putStr(15, 27, " \\=======/", "c-pir");
    // Sheikh's calm cushion shadow
    putStr(16, 26, "░░░░░░░░░░░", "c-carpet-inner");

    // 8. SÂLİK / OYUNCU (Zeminde Serbestçe Yürüyen Karakter)
    const pr = Math.round(player.y);
    const pc = Math.round(player.x);
    const stepF = player.animFrame % 2;

    let pSprite = [];
    if (player.direction === "up") {
      pSprite = [
        "  ( )  ",
        " /|#|\\ ",
        stepF === 0 ? "  / \\  " : "  | \\  "
      ];
    } else if (player.direction === "left") {
      pSprite = [
        " <(o)  ",
        "  /#|  ",
        stepF === 0 ? "  / >  " : "   |   "
      ];
    } else if (player.direction === "right") {
      pSprite = [
        "  (o)> ",
        "  |#\\  ",
        stepF === 0 ? "  < \\  " : "   |   "
      ];
    } else { // down (default)
      pSprite = [
        "  (o)  ",
        " /|#|\\ ",
        stepF === 0 ? "  / \\  " : "  / |  "
      ];
    }

    // Shadow under feet
    putStr(pr + 1, pc - 2, "(···)", "c-shadow");

    // Draw player sprite
    for (let i = 0; i < pSprite.length; i++) {
      putStr(pr - 2 + i, pc - 3, pSprite[i], "c-player");
    }

    // Convert buffers into styled HTML
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
