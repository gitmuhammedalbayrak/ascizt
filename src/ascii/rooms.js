// Room-Based Top-Down ASCII Maps
// Pure char-based grid layout

export const ROOMS = {
  // 1. Bölüm / 1. Sekans: İbtida Halvetgâhı
  1: {
    name: "Makam 1: İbtida Halvetgâhı (Dergâh Odası)",
    description: "Karanlık, serin ve kandil isinin koktuğu taş bir halvet odası.",
    width: 32,
    height: 16,
    playerStart: { x: 15, y: 11 },
    map: [
      "################################",
      "#*           [ K ]            *#",
      "#           .=====.            #",
      "#           .=====.            #",
      "#    [R]    .=====.    [S]     #",
      "#   Rahle     (P)     Sandık   #",
      "#            Pîr               #",
      "#                              #",
      "#                              #",
      "#      . . . . . . . . .       #",
      "#      . . . . . . . . .       #",
      "#      . . . . @ . . . .       #",
      "#      . . . . . . . . .       #",
      "#                              #",
      "#*                            *#",
      "################################"
    ],
    // Triggers when player is adjacent or interacts (Space / Enter / Click)
    interactables: {
      "P": {
        name: "Pîr-i Şeyh Burhâneddin",
        targetDialogue: "pir_conversation",
        portrait: "dervis"
      },
      "S": {
        name: "Kadim Sandık",
        targetDialogue: "chest_interaction",
        portrait: "akil"
      },
      "R": {
        name: "Ceviz Rahle",
        targetDialogue: "desk_interaction",
        portrait: "kalp"
      },
      "K": {
        name: "Sır Kapısı",
        targetDialogue: "door_interaction",
        portrait: "system"
      }
    }
  }
};
