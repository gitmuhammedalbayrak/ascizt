// 99 TESBİH: SEFÎNE-İ NÛR - Master Terminal RPG Engine
// 128x128-Bit Procedural ASCII Texture, Lighting & Volumetric Model Engine + Disco Elysium + WASM

import { ROOMS } from "./src/ascii/rooms.js";
import { LOGOS } from "./src/ascii/logos.js";
import { TUI } from "./src/ascii/tui.js";
import { AsciiEngine128 } from "./src/ascii/ascii_engine_128.js";
import { audio } from "./src/audio.js";

// Global Game State
const GAME = {
  wasm: null,
  asciiEngine: new AsciiEngine128(216, 108),
  screen: "SPLASH", // SPLASH, LOGO, MENU, GAMEPLAY
  currentSequence: 1,
  currentRoomId: 1,
  roomData: null,
  activePortrait: "salik",
  player: {
    // 216x108 High-Density Room Coordinates
    x: 108,
    y: 94,
    direction: "up", // up, down, left, right
    animFrame: 0,
    equipped: {
      robe: "Eski Pejmürde Hırka",
      weapon: "Yalın El",
      item: "Kuru Ekmek Lokması"
    }
  },
  dialogue: {
    active: false,
    currentKey: null,
    history: []
  },
  animTick: 0,
  animInterval: null,
  isMuted: false
};

// Disco Elysium Dialogue Trees
const DIALOGUE_TREES = {
  // İlk Uyanış / Halvetgâh
  intro_awakening: {
    portrait: "salik",
    speaker: "SÂLİK (SEN)",
    speakerClass: "voice-salik",
    text: "Gözlerimi açıyorum... Taş halvetgâhın dondurucu serinliği şakaklarıma vuruyor. Mihrabiye nişlerindeki kandiller kesme taş duvarları aydınlatıyor. Neredeyim ben?",
    choices: [
      {
        text: "[Nefs-i Emmare] Boğazın kupkuru, karnın aç. Kalk ve seni buraya kimin kilitlediğini bul!",
        portrait: "nefs",
        speaker: "Nefs",
        speakerClass: "voice-nefs",
        statBonus: { stat: 0, val: 1 },
        next: "intro_nefs_path"
      },
      {
        text: "[Akıl-ı Me'âş] Odaya bak: Ortada Selçuklu şemse halısında oturan Pîr, sağda demir kuşaklı sedir sandığı, solda şamdanlı rahle.",
        portrait: "akil",
        speaker: "Akıl",
        speakerClass: "voice-akil",
        statBonus: { stat: 1, val: 1 },
        next: "intro_akil_path"
      },
      {
        text: "[Kalp-i Selîm] Korkma. Havada öd ağacı ve amber kokusu var. Pîr'in tesbih tıkırtısı odayı nurla dolduruyor.",
        portrait: "kalp",
        speaker: "Kalp",
        speakerClass: "voice-kalp",
        statBonus: { stat: 2, val: 1 },
        next: "intro_kalp_path"
      }
    ]
  },

  intro_nefs_path: {
    portrait: "nefs",
    speaker: "NEFS-İ EMMARE",
    speakerClass: "voice-nefs",
    text: "Öfken senin kalkanındır sâlik! Eğer zayıf görünürsen bu 99 makam seni çiğner geçer. Güç ve silah bulmalısın!",
    choices: [
      {
        text: "Ayağa kalk ve odayı gözden geçir.",
        portrait: "salik",
        next: "intro_conclude"
      }
    ]
  },

  intro_akil_path: {
    portrait: "akil",
    speaker: "AKIL-I ME'ÂŞ",
    speakerClass: "voice-akil",
    text: "Kuzeydeki burmalı sütunlu Selçuklu Taç Kapısı'nın altında Sır Kapısı var. Sandıktaki emanetleri kuşanmadan kapı açılmaz.",
    choices: [
      {
        text: "Nizamı koruyarak etrafa bak.",
        portrait: "salik",
        next: "intro_conclude"
      }
    ]
  },

  intro_kalp_path: {
    portrait: "kalp",
    speaker: "KALP-İ SELÎM",
    speakerClass: "voice-kalp",
    text: "Nefesin sakinleşiyor. Kandillerin sıcak ışığı ve halıdaki Selçuklu madalyonu kalbine sükûnet veriyor...",
    choices: [
      {
        text: "Sükûnetle doğrul.",
        portrait: "salik",
        next: "intro_conclude"
      }
    ]
  },

  intro_conclude: {
    portrait: "ruh",
    speaker: "RUH-I LATÎF",
    speakerClass: "voice-ruh",
    text: "99 Taneli Tesbih'in ilk makamındasın (Sekans 1/99). İlk 33 bölümde benliğini, sıfatlarını ve temel libasını kazanacaksın. Şimdi odada serbestçe yürü.",
    choices: [
      {
        text: "[Odaya Dön] Adım atmaya başla.",
        portrait: "system",
        action: () => closeDialogue()
      }
    ]
  },

  // Pîr ile Konuşma
  pir_conversation: {
    portrait: "dervis",
    speaker: "PÎR-İ ŞEYH BURHÂNEDDİN",
    speakerClass: "voice-dervis",
    text: "Esselâmü aleyküm sâlik... Demek uyandın. Bu tekke, gafletten uyananların ilk durağıdır. 99 basamaklı bir sır merdiveninin başındasın.",
    choices: [
      {
        text: "'Ben kimim efendim? Buraya nasıl geldim?'",
        portrait: "salik",
        next: "pir_who_am_i"
      },
      {
        text: "[Akıl] 'Bu 99 makam nedir? Nereye varmayı amaçlıyoruz?'",
        portrait: "akil",
        statBonus: { stat: 1, val: 1 },
        next: "pir_99_explanation"
      },
      {
        text: "'Yola çıkmak için neye ihtiyacım var?'",
        portrait: "salik",
        next: "pir_preparation"
      }
    ]
  },

  pir_who_am_i: {
    portrait: "dervis",
    speaker: "PÎR-İ ŞEYH BURHÂNEDDİN",
    speakerClass: "voice-dervis",
    text: "Kim olduğunu henüz sen bile bilmiyorsun evlat. İlk 33 sekans boyunca nefsinin perdelerini aralayacak, hırkanı ve asânı kuşanacaksın. İsimler sonra gelir.",
    choices: [
      {
        text: "'Yol için ne tavsiye edersiniz?'",
        next: "pir_preparation"
      }
    ]
  },

  pir_99_explanation: {
    portrait: "dervis",
    speaker: "PÎR-İ ŞEYH BURHÂNEDDİN",
    speakerClass: "voice-dervis",
    text: "İlk 33: Suret ve Sıfat (Temel donanım, nefsi tanıma, hırka ve asâ).\nİkinci 33: Gayb ve Kudret (Doğaüstü keşifler, marifet defterleri, sırlar).\nÜçüncü 33: Cem ve Birlik (Cemiyet, binit/at, tebliğ ve hakikat). Üç kapıda üç büyük sinematik seni bekler.",
    choices: [
      {
        text: "Başımı eğip hürmetle dinliyorum.",
        statBonus: { stat: 2, val: 1 },
        next: "pir_preparation"
      }
    ]
  },

  pir_preparation: {
    portrait: "dervis",
    speaker: "PÎR-İ ŞEYH BURHÂNEDDİN",
    speakerClass: "voice-dervis",
    text: "Sağdaki Kadim Sedir Sandığı'nda sana ayrılmış derviş hırkası ve yol asâsı var. Onları kuşanmadan bu Taç Kapı'dan geçemezsin. Git ve teçhiz ol.",
    choices: [
      {
        text: "'Hürmetle efendim, emredersiniz.' [Ayrıl]",
        action: () => closeDialogue()
      }
    ]
  },

  // Sandık Etkileşimi
  chest_interaction: {
    portrait: "system",
    speaker: "KADİM SEDİR SANDIĞI (KİTÂB-I EŞYA)",
    speakerClass: "voice-system",
    text: "Dövme demir kuşaklı sedir sandığın bombe kapağını aralıyorsun. Pirinç kilit parıldıyor. İçinde zümrüt işlemeli bir derviş hırkası ve alemli gürgen yol asâsı duruyor.",
    choices: [
      {
        text: "[KUŞAN] Derviş Hırkası'nı giy ve Yol Asâsı'nı eline al.",
        portrait: "salik",
        action: () => {
          GAME.player.equipped.robe = "Yün Derviş Hırkası";
          GAME.player.equipped.weapon = "Gürgen Yol Asâsı";
          if (GAME.wasm) {
            GAME.wasm.updateStat(1, 1);
            GAME.wasm.updateStat(2, 1);
            updateStatsUI();
          }
          updateRoomHeaderUI();
          renderRoom();
          audio.playItemPickup();
        },
        next: "chest_equipped"
      },
      {
        text: "Sandığı kapat ve sonra bak.",
        action: () => closeDialogue()
      }
    ]
  },

  chest_equipped: {
    portrait: "salik",
    speaker: "SÂLİK",
    speakerClass: "voice-salik",
    text: "Zümrüt derviş hırkası omuzlarına oturuyor. Alemli gürgen asâyı eline aldığında etrafına yayılan nur yarıçapı da genişledi!\n\nKAZANIM: [Yün Derviş Hırkası] kuşanıldı (+1 Kalp).\nKAZANIM: [Gürgen Yol Asâsı] teçhiz edildi (+1 Akıl).",
    choices: [
      {
        text: "Geri dön.",
        action: () => closeDialogue()
      }
    ]
  },

  // Rahle Etkileşimi
  desk_interaction: {
    portrait: "kalp",
    speaker: "KALP-İ SELÎM",
    speakerClass: "voice-kalp",
    text: "İki yanındaki pirinç şamdanların aydınlattığı ceviz rahlede açık duran sahifede altın tezhiplerle yazılmış şu satırlar parıldıyor:\n'Men arefe nefsehû fekad arefe rabbehû' (Nefsini bilen, Rabbini bilir).",
    choices: [
      {
        text: "[Tefekkür Et] Bir an durup bu manayı içine sindir.",
        statBonus: { stat: 3, val: 1 },
        action: () => {
          if (GAME.wasm) {
            GAME.wasm.updateStat(3, 1);
            updateStatsUI();
          }
          audio.playItemPickup();
        },
        next: "desk_tefekkur"
      },
      {
        text: "Kitabı hürmetle selamla ve çekil.",
        action: () => closeDialogue()
      }
    ]
  },

  desk_tefekkur: {
    portrait: "ruh",
    speaker: "RUH-I LATÎF",
    speakerClass: "voice-ruh",
    text: "Zihnin berraklaşıyor. Şamdanların sıcak ışığı sahifedeki altın şemse motiflerini aydınlatıyor... (+1 Ruh Statı Kazanıldı).",
    choices: [
      {
        text: "Rahleden ayrıl.",
        action: () => closeDialogue()
      }
    ]
  },

  // Kapı Etkileşimi (Sekans 2'ye Geçiş)
  door_interaction: {
    portrait: "system",
    speaker: "SIR KAPISI (SELÇUKLU TAÇ KAPI)",
    speakerClass: "voice-system",
    text: "Burmalı turkuaz Selçuklu sütunlarının arasındaki anıtsal Taç Kapı. Ortasında parıldayan bir sır mandalası dönüyor. Burası Makam 2'ye açılan eşiktir.",
    choices: [
      {
        text: "Tokmağı çevir ve Sekans 2'ye adım at.",
        action: () => {
          if (GAME.player.equipped.weapon === "Yalın El") {
            triggerDialogue("door_locked_hint");
          } else {
            advanceSequence();
          }
        }
      },
      {
        text: "Henüz hazır değilim, geri çekil.",
        action: () => closeDialogue()
      }
    ]
  },

  door_locked_hint: {
    portrait: "dervis",
    speaker: "PÎR-İ ŞEYH BURHÂNEDDİN",
    speakerClass: "voice-dervis",
    text: "Dur sâlik! Sağdaki Kadim Sandık'tan hırkanı ve asânı almadan bu eşiği geçemezsin. Yol çıplak yürünmez.",
    choices: [
      {
        text: "Sandığa yönel.",
        action: () => closeDialogue()
      }
    ]
  }
};

// INITIALIZE ENGINE & WASM
async function initEngine() {
  try {
    const wasmResponse = await fetch("./build/release.wasm");
    const wasmBuffer = await wasmResponse.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        abort: () => console.warn("WASM Abort")
      }
    });
    GAME.wasm = wasmModule.instance.exports;
  } catch (err) {
    console.warn("WASM load fallback:", err);
  }

  setupEventListeners();
  renderSplashScreen();
}

function setupEventListeners() {
  document.getElementById("btn-toggle-music").onclick = () => toggleAudio();
  document.getElementById("btn-menu").onclick = () => {
    audio.playSelect();
    renderMainMenu();
  };

  window.addEventListener("keydown", handleKeyDown);
}

function toggleAudio() {
  const isMuted = audio.toggleMute();
  GAME.isMuted = isMuted;
  document.getElementById("btn-toggle-music").innerText = isMuted ? "MÜZİK: SESSIZ [M]" : "MÜZİK: 8-BIT [M]";
}

function handleKeyDown(e) {
  if (e.key === "m" || e.key === "M") {
    toggleAudio();
    return;
  }

  if (e.key === "Escape") {
    audio.playSelect();
    renderMainMenu();
    return;
  }

  if (GAME.screen === "SPLASH") {
    audio.playSelect();
    renderLogoScreen();
    return;
  }

  if (GAME.screen === "LOGO") {
    audio.playSelect();
    renderMainMenu();
    return;
  }

  if (GAME.screen === "MENU") {
    if (e.key === "1") startNewGame();
    if (e.key === "2") startNewGame();
    if (e.key === "3") showLoreHelp();
    if (e.key === "4") toggleAudio();
    return;
  }

  if (GAME.screen === "GAMEPLAY") {
    if (GAME.dialogue.active) {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        selectDialogueChoiceByIndex(num - 1);
      }
      return;
    }

    // 216x108 High-Resolution Room Movement
    let dx = 0;
    let dy = 0;

    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      dy = -3;
      GAME.player.direction = "up";
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      dy = 3;
      GAME.player.direction = "down";
    } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      dx = -5;
      GAME.player.direction = "left";
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      dx = 5;
      GAME.player.direction = "right";
    } else if (e.key === " " || e.key === "Enter" || e.key === "e" || e.key === "E") {
      checkAdjacentInteractions();
      return;
    }

    if (dx !== 0 || dy !== 0) {
      movePlayer(dx, dy);
    }
  }
}

// 216x108 Movement & Volumetric Object Collisions
function movePlayer(dx, dy) {
  const newX = GAME.player.x + dx;
  const newY = GAME.player.y + dy;

  // Room walkable boundaries (216x108 canvas)
  if (newX < 18 || newX > 198 || newY < 38 || newY > 104) {
    audio.playTone(75, 'square', 0.04, 0.03);
    if (newY < 38 && newX >= 74 && newX <= 142) {
      checkAdjacentInteractions();
    }
    return;
  }

  // Solid Object Collisions (Pîr, Rahle, Sandık)
  // 1. Pîr on central carpet (x: 108, footY: 60 -> box cols 84..132, rows 48..64)
  if (newX >= 84 && newX <= 132 && newY >= 48 && newY <= 64) {
    audio.playTone(85, 'square', 0.03, 0.03);
    checkAdjacentInteractions();
    return;
  }

  // 2. Ceviz Rahle on left (x: 30, footY: 72 -> box cols 10..52, rows 58..76)
  if (newX >= 10 && newX <= 52 && newY >= 58 && newY <= 76) {
    audio.playTone(85, 'square', 0.03, 0.03);
    checkAdjacentInteractions();
    return;
  }

  // 3. Kadim Sandık on right (x: 184, footY: 72 -> box cols 160..204, rows 58..76)
  if (newX >= 160 && newX <= 204 && newY >= 58 && newY <= 76) {
    audio.playTone(85, 'square', 0.03, 0.03);
    checkAdjacentInteractions();
    return;
  }

  GAME.player.x = newX;
  GAME.player.y = newY;
  GAME.player.animFrame = (GAME.player.animFrame + 1) % 2;

  audio.playStep();
  updateRoomHeaderUI();
  renderRoom();
  checkNearTriggerHint();
}

function checkAdjacentInteractions() {
  const px = GAME.player.x;
  const py = GAME.player.y;

  // Near Pîr (cols 74..142, rows 42..74)
  if (px >= 74 && px <= 142 && py >= 42 && py <= 74) {
    audio.playSelect();
    triggerDialogue("pir_conversation");
    return;
  }

  // Near Sandık (cols 148..206, rows 50..86)
  if (px >= 148 && px <= 206 && py >= 50 && py <= 86) {
    audio.playSelect();
    triggerDialogue("chest_interaction");
    return;
  }

  // Near Rahle (cols 8..64, rows 50..86)
  if (px >= 8 && px <= 64 && py >= 50 && py <= 86) {
    audio.playSelect();
    triggerDialogue("desk_interaction");
    return;
  }

  // Near Sır Kapısı / Taç Kapı (cols 74..142, rows <= 45)
  if (px >= 74 && px <= 142 && py <= 45) {
    audio.playSelect();
    triggerDialogue("door_interaction");
    return;
  }
}

function checkNearTriggerHint() {
  const px = GAME.player.x;
  const py = GAME.player.y;

  let nearObj = null;
  if (px >= 74 && px <= 142 && py >= 42 && py <= 74) {
    nearObj = "Pîr-i Şeyh Burhâneddin";
  } else if (px >= 148 && px <= 206 && py >= 50 && py <= 86) {
    nearObj = "Kadim Sedir Sandığı";
  } else if (px >= 8 && px <= 64 && py >= 50 && py <= 86) {
    nearObj = "Ceviz Rahle & Mushaf";
  } else if (px >= 74 && px <= 142 && py <= 45) {
    nearObj = "Sır Kapısı (Taç Kapı)";
  }

  const hintEl = document.getElementById("interaction-hint");
  if (nearObj) {
    hintEl.innerHTML = `> Etkileşim: <span style="color: var(--term-gold); font-weight: bold;">[SPACE / E] ile '${nearObj}' nesnesini incele.</span>`;
  } else {
    hintEl.innerText = "> Etkileşim: Pîr'e, Sandığa, Rahleye veya Taç Kapı'ya yaklaşın.";
  }
}

// SCREEN 1: SPLASH SCREEN
function renderSplashScreen() {
  GAME.screen = "SPLASH";
  const overlay = document.getElementById("fullscreen-overlay");
  const gameplay = document.getElementById("gameplay-view");
  overlay.style.display = "flex";
  gameplay.style.display = "none";

  const boxLines = [
    LOGOS.splash,
    "",
    "┌────────────────────────────────────────────────────────────────────────┐",
    "│   99 TESBİH: SEFÎNE-İ NÛR - 128x128-BİT ASCII TEXTURE & SHADER ENGINE  │",
    "│   23.328 Hücreli Volümetrik ASCII Sahne, Dinamik Işık, Disco Elysium   │",
    "└────────────────────────────────────────────────────────────────────────┘",
    "",
    "           >> [ ENTER / HERHANGİ BİR TUŞA BASARAK BAŞLA ] <<"
  ];

  overlay.innerHTML = boxLines.join("\n");
  overlay.onclick = () => {
    audio.playSelect();
    renderLogoScreen();
  };
}

// SCREEN 2: LOGO SCREEN
function renderLogoScreen() {
  GAME.screen = "LOGO";
  const overlay = document.getElementById("fullscreen-overlay");

  const logoLines = [
    LOGOS.mainTitle,
    "",
    "┌────────────────────────────────────────────────────────────────────────┐",
    "│ 'Her kim nefsini bilirse, şüphesiz Rabbini de bilir.'                 │",
    "│  128x128-Bit Prosedürel ASCII Doku, Normal Haritalama ve İç Monologlar │",
    "└────────────────────────────────────────────────────────────────────────┘",
    "",
    "             >> [ ENTER / TIKLAYARAK ANA MENÜYE GEÇ ] <<"
  ];

  overlay.innerHTML = logoLines.join("\n");
  overlay.onclick = () => {
    audio.playSelect();
    renderMainMenu();
  };
}

// SCREEN 3: MAIN MENU
function renderMainMenu() {
  GAME.screen = "MENU";
  const overlay = document.getElementById("fullscreen-overlay");
  const gameplay = document.getElementById("gameplay-view");
  overlay.style.display = "flex";
  gameplay.style.display = "none";

  overlay.innerHTML = `
<div style="color: var(--term-green); font-size: 13px; line-height: 1.25;">
${LOGOS.mainTitle}

┌──[ TERMİNAL ANA MENÜ ]─────────────────────────────────────────────────┐
│                                                                        │
│   <span class="ascii-menu-item" id="btn-start">[ 1 ] ► YOLA ÇIK (YENİ OYUN BAŞLAT)                           </span>   │
│   <span class="ascii-menu-item" id="btn-cont">[ 2 ]   HALVETE DÖN (KAYITTAN DEVAM ET)                     </span>   │
│   <span class="ascii-menu-item" id="btn-lore">[ 3 ]   99 MAKAM VE STAT REHBERİ (LORE)                     </span>   │
│   <span class="ascii-menu-item" id="btn-sound">[ 4 ]   8-BİT MÜZİK [AÇIK / KAPALI]                         </span>   │
│                                                                        │
├──[ SİSTEM & MOTOR MALUMATI ]──────────────────────────────────────────┤
│ Grafik : 128x128-Bit Volümetrik ASCII Shader (216x108 = 23.328 Hücre)  │
│ Işık   : Çoklu Nokta Işıklandırma, Normal Haritası & Sıfır Kayma       │
└────────────────────────────────────────────────────────────────────────┘
</div>
  `;

  document.getElementById("btn-start").onclick = () => startNewGame();
  document.getElementById("btn-cont").onclick = () => startNewGame();
  document.getElementById("btn-lore").onclick = () => showLoreHelp();
  document.getElementById("btn-sound").onclick = () => toggleAudio();
}

function showLoreHelp() {
  audio.playSelect();
  alert(
    "99 TESBİH: SEFÎNE-İ NÛR - 128x128-BİT ASCII ENGINE\n\n" +
    "• 1-33. Bölümler (1. Çapraz): Suret ve Sıfat (Temel kıyafetler, hırka, asâ, fiziksel ve nefsani terbiyeler).\n" +
    "• 34-66. Bölümler (2. Çapraz): Gayb ve Kudret (Manevi haritalar, defterler, metafizik güçler).\n" +
    "• 67-99. Bölümler (3. Çapraz): Cem ve Cemiyet (Binit, at, toplumsal ilişkiler, nihai vuslat).\n\n" +
    "Her yüzey (Taş, Halı, Ahşap, Demir, Kumaş, Sakal, Alev) 3D yüzey normalleri ve malzeme bazlı ASCII karakter rampalarıyla gerçek zamanlı işlenir."
  );
}

// START GAME
function startNewGame() {
  audio.playSelect();
  if (!GAME.isMuted) audio.startMysticBGM();

  GAME.screen = "GAMEPLAY";
  const overlay = document.getElementById("fullscreen-overlay");
  const gameplay = document.getElementById("gameplay-view");
  overlay.style.display = "none";
  gameplay.style.display = "flex";

  GAME.roomData = ROOMS[1];
  updateRoomHeaderUI();
  updateStatsUI();
  renderRoom();
  renderPortrait();

  // İlk Uyanış Diyaloğu
  setTimeout(() => {
    triggerDialogue("intro_awakening");
  }, 150);

  // Calm, atmospheric 650ms Animation Loop
  if (!GAME.animInterval) {
    GAME.animInterval = setInterval(gameLoop, 650);
  }
}

// RENDER ROOM & PORTRAIT VIA 128x128 ASCII TEXTURE ENGINE
function renderRoom() {
  const roomCanvas = document.getElementById("room-canvas");
  GAME.asciiEngine.renderRoomToCanvas(roomCanvas, GAME.player, GAME.animTick);
}

function renderPortrait() {
  const portraitCanvas = document.getElementById("portrait-canvas");
  GAME.asciiEngine.renderPortraitToCanvas(portraitCanvas, GAME.activePortrait, GAME.animTick);
}

function updateRoomHeaderUI() {
  const name = GAME.roomData ? GAME.roomData.name : "İbtida Halvetgâhı";
  const coords = `(${GAME.player.x}, ${GAME.player.y})`;
  const weapon = GAME.player.equipped.weapon;
  document.getElementById("room-frame-top").innerText = 
    `┌──[ ${name} (128-BİT ASCII) ]──┬──[ KONUM: ${coords} ]──[ TEÇHİZAT: ${weapon} ]──┐`;
}

function gameLoop() {
  GAME.animTick++;
  if (GAME.screen === "GAMEPLAY") {
    renderRoom();
    renderPortrait();
  }
}

// DISCO ELYSIUM STYLE DIALOGUE
function triggerDialogue(dialogueKey) {
  const node = DIALOGUE_TREES[dialogueKey];
  if (!node) return;

  GAME.dialogue.active = true;
  GAME.dialogue.currentKey = dialogueKey;

  // Render 128x128 Portrait Canvas
  GAME.activePortrait = node.portrait || "system";
  renderPortrait();

  // History log
  const historyBox = document.getElementById("dialogue-history");
  const msgDiv = document.createElement("div");
  msgDiv.className = `dialogue-node ${node.speakerClass || "voice-system"}`;
  msgDiv.innerHTML = `
    <span class="node-speaker">> ${node.speaker || "SES"}:</span>
    <div>${node.text.replace(/\n/g, "<br>")}</div>
  `;
  historyBox.appendChild(msgDiv);
  historyBox.scrollTop = historyBox.scrollHeight;

  audio.playBlip();

  // Choices
  const choicesContainer = document.getElementById("choices-container");
  choicesContainer.innerHTML = "";

  if (node.choices && node.choices.length > 0) {
    node.choices.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.className = "ascii-choice";
      btn.innerHTML = `[ ${index + 1} ] ► ${choice.text}`;
      btn.onclick = () => selectDialogueChoice(choice);
      choicesContainer.appendChild(btn);
    });
  } else {
    const btn = document.createElement("button");
    btn.className = "ascii-choice";
    btn.innerHTML = `[ 1 ] ► Devam et...`;
    btn.onclick = () => closeDialogue();
    choicesContainer.appendChild(btn);
  }
}

function selectDialogueChoiceByIndex(index) {
  const node = DIALOGUE_TREES[GAME.dialogue.currentKey];
  if (!node || !node.choices || !node.choices[index]) return;
  selectDialogueChoice(node.choices[index]);
}

function selectDialogueChoice(choice) {
  audio.playSelect();

  if (choice.statBonus && GAME.wasm) {
    GAME.wasm.updateStat(choice.statBonus.stat, choice.statBonus.val);
    updateStatsUI();
  }

  if (choice.action) {
    choice.action();
  }

  if (choice.next) {
    triggerDialogue(choice.next);
  }
}

function closeDialogue() {
  GAME.dialogue.active = false;
  GAME.dialogue.currentKey = null;

  const choicesContainer = document.getElementById("choices-container");
  choicesContainer.innerHTML = `
    <div style="font-size: 11px; color: var(--term-green-dim); padding: 4px;">
      > [Halvettesin. [W,A,S,D] ile odada yürü, [SPACE] ile incele.]
    </div>
  `;
  GAME.activePortrait = "salik";
  renderPortrait();
}

function advanceSequence() {
  audio.playItemPickup();
  GAME.currentSequence++;
  if (GAME.wasm) {
    GAME.wasm.setSequence(GAME.currentSequence);
  }

  alert(
    "TEBRİKLER! 1. Sekansı (İbtida Halvetgâhı) tamamladın.\n\n" +
    "Tesbih tanesi çekildi: 2 / 99 Tane (Makam 2: Zikir Meydanı açılıyor...)"
  );

  updateStatsUI();
  closeDialogue();
}

function updateStatsUI() {
  let nefs = 1, akil = 1, kalp = 1, ruh = 1, hp = 100;
  if (GAME.wasm) {
    nefs = GAME.wasm.getNefs();
    akil = GAME.wasm.getAkil();
    kalp = GAME.wasm.getKalp();
    ruh = GAME.wasm.getRuh();
    hp = GAME.wasm.getHp();
  }

  document.getElementById("stat-nefs").innerText = nefs;
  document.getElementById("stat-akil").innerText = akil;
  document.getElementById("stat-kalp").innerText = kalp;
  document.getElementById("stat-ruh").innerText = ruh;
  document.getElementById("stat-hp").innerText = `${hp}/100`;

  const beadStr = TUI.renderBeadString(GAME.currentSequence, 99, 20);
  document.getElementById("bead-indicator").innerText = beadStr;
}

window.addEventListener("DOMContentLoaded", () => {
  initEngine();
});
