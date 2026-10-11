// ASCII Character Sprites & Animation Frames
// Top-down character graphics made exclusively of characters / symbols

export const CHARACTERS = {
  // Player: Derviş / Sâlik (Directional & 2-Frame Walk cycle)
  player: {
    symbol: "@",
    frames: {
      // Down (Yüze doğru)
      down: [
        [
          " (o) ",
          "/|#|\\",
          " / \\ "
        ],
        [
          " (o) ",
          " /#|\\",
          "  | \\"
        ]
      ],
      // Up (Arkası dönük)
      up: [
        [
          " ( ) ",
          "/|#|\\",
          " / \\ "
        ],
        [
          " ( ) ",
          " /#|\\",
          " / | "
        ]
      ],
      // Left (Sola doğru)
      left: [
        [
          " <(o)",
          " /#| ",
          " / > "
        ],
        [
          " <(o)",
          " /#| ",
          "  |  "
        ]
      ],
      // Right (Sağa doğru)
      right: [
        [
          "(o)> ",
          " |#\\ ",
          " < \\ "
        ],
        [
          "(o)> ",
          " |#\\ ",
          "  |  "
        ]
      ]
    }
  },

  // Mürşid / Yaşlı Derviş (Halı üstünde oturan, tesbih çeken animasyonlu)
  pir: {
    symbol: "P",
    name: "Pîr-i Şeyh Burhâneddin",
    frames: [
      [
        "  /O\\  ",
        " (•-•) ",
        " /|#|\\~o",
        "  ===  "
      ],
      [
        "  /O\\  ",
        " (•-•) ",
        " /|#|\\o~",
        "  ===  "
      ]
    ]
  },

  // Meşale / Kandil (Titreşen ışık animasyonu)
  torch: {
    symbol: "*",
    frames: [
      [" ( ) ", "  |  "],
      [" (*) ", "  |  "],
      [" (~) ", "  |  "]
    ]
  },

  // Rahle & Kitap
  desk: {
    symbol: "R",
    name: "Ceviz Rahle & Mushaf",
    art: [
      "  _[]_  ",
      "  /XX\\  "
    ]
  },

  // Çeyiz / Hırka Sandığı
  chest: {
    symbol: "S",
    name: "Kilitli Sedir Sandığı",
    art: [
      " +---=-+ ",
      " | [*] | "
    ]
  },

  // Kapı / Çıkış Eşiği
  door: {
    symbol: "K",
    name: "Sır Kapısı (Sekans 2'ye Geçiş)",
    art: [
      " [| |] "
    ]
  }
};
