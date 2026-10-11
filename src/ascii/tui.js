// TUI (Terminal User Interface) Box-Drawing & ASCII Frame Helpers
// Pure text-based UI components (Rogue / Dwarf Fortress / BBS Terminal style)

export const TUI = {
  // Box Drawing Glyphs
  single: {
    tl: "┌", tr: "┐", bl: "└", br: "┘",
    h: "─", v: "│",
    vl: "├", vr: "┤", ht: "┬", hb: "┴", x: "┼"
  },
  double: {
    tl: "╔", tr: "╗", bl: "╚", br: "╝",
    h: "═", v: "║",
    vl: "╠", vr: "╣", ht: "╦", hb: "╩", x: "╬"
  },

  // Generate ASCII Box Frame with Title
  makeFrame(title, width, innerLines = [], style = "single") {
    const s = this[style] || this.single;
    const w = Math.max(width, title.length + 6);
    
    // Top border with title: ┌──[ BAŞLIK ]───────┐
    let top = s.tl + s.h + s.h + "[ " + title + " ]";
    top += s.h.repeat(Math.max(0, w - top.length - 1)) + s.tr;

    // Content lines
    const middle = innerLines.map(line => {
      const padLen = Math.max(0, w - 2 - line.length);
      return s.v + " " + line + " ".repeat(padLen > 0 ? padLen - 1 : 0) + s.v;
    });

    // Bottom border: └────────────────────────┘
    const bottom = s.bl + s.h.repeat(w - 2) + s.br;

    return [top, ...middle, bottom].join("\n");
  },

  // Generates 99-bead string with filled/empty circles
  renderBeadString(current, total = 99, displayCount = 22) {
    const filledCount = Math.min(displayCount, Math.round((current / total) * displayCount));
    let beads = "";
    for (let i = 0; i < displayCount; i++) {
      if (i < filledCount) {
        beads += "●";
      } else if (i === filledCount) {
        beads += "◆";
      } else {
        beads += "○";
      }
    }
    return `[${beads}] ${String(current).padStart(2, '0')}/${total}`;
  }
};
