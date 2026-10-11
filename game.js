// 99 TESBİH: SEFÎNE-İ NÛR - Master Terminal RPG Engine
// Straight 2.5D Seljuk Depth Architecture + Disco Elysium Dialogue + WebAssembly

import { PORTRAITS } from "./src/ascii/portraits.js";
import { CHARACTERS } from "./src/ascii/characters.js";
import { ROOMS } from "./src/ascii/rooms.js";
import { LOGOS } from "./src/ascii/logos.js";
import { TUI } from "./src/ascii/tui.js";
import { IsoRenderer } from "./src/ascii/iso_renderer.js";
import { audio } from "./src/audio.js";

// Global Game State
const GAME = {
  wasm: null,
  isoRenderer: new IsoRenderer(62, 24),
  screen: "SPLASH", // SPLASH, LOGO, MENU, GAMEPLAY
  currentSequence: 1,
  currentRoomId: 1,
  roomData: null,
  player: {
    // 2.5D Straight Room Coordinates (Cols: 0..61, Rows: 0..23)
    x: 30,
    y: 20,
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
    text: "Gözlerimi açıyorum... Taş halvetgâhın dondurucu serinliği şakaklarıma vuruyor. Odanın derinliklerinde bir kandil tütüyor. Neredeyim ben?",
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
        text: "[Akıl-ı Me'âş] Odaya bak: Ortada seccadede oturan pîr [P], sağda demir sandık [S], solda ceviz rahle [R]. Nizam kusursuz.",
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
    text: "Kuzey kemerinin altında Sır Kapısı var. Sandıktaki emanetleri kuşanmadan kapı açılmaz. Adımlarını tartarak at.",
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
    text: "Nefesin sakinleşiyor. Ocağın alevi ve seccadedeki motifler kalbine sükûnet veriyor...",
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
    text: "Sağdaki sandıkta [S] sana ayrılmış derviş hırkası ve yol asâsı var. Onları kuşanmadan bu kapıdan [K] geçemezsin. Git ve teçhiz ol.",
    choices: [
      {
        text: "'Hürmetle efendim, emredersiniz.' [Ayrıl]",
        action: () => closeDialogue()
      }
    ]
  },

  // Sandık Etkileşimi (Eşya ve Kıyafet Kazanımı)
  chest_interaction: {
    portrait: "system",
    speaker: "SANDIK (KİTÂB-I EŞYA)",
    speakerClass: "voice-system",
    text: "Demir perçinli sedir sandığın kapağını aralıyorsun. Pirinç kilit parıldıyor. İçinde katlanmış yün bir hırka ve gürgen yol asâsı duruyor.",
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
    text: "Hırkanın ağır dokusu omuzlarına oturuyor. Asâyı yere vurduğunda çıkan tok ses sana güven veriyor.\n\nKAZANIM: [Yün Derviş Hırkası] kuşanıldı (+1 Kalp).\nKAZANIM: [Gürgen Yol Asâsı] teçhiz edildi (+1 Akıl).",
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
    text: "Ceviz rahlede açık duran sahifede altın yaldızla yazılmış şu satırlar ışık saçıyor:\n'Men arefe nefsehû fekad arefe rabbehû' (Nefsini bilen, Rabbini bilir).",
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
    text: "Zihnin berraklaşıyor. Odanın içindeki kandil dumanları sanki birer harfe dönüşüyor... (+1 Ruh Statı Kazanıldı).",
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
    speaker: "SIR KAPISI",
    speakerClass: "voice-system",
    text: "Selçuklu kemerinin altındaki pirinç kakmalı kapı. Ortasında parıldayan bir sır girdabı dönüyor. Burası Makam 2'ye açılan eşiktir.",
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
    text: "Dur sâlik! Sandıktan [S] hırkanı ve asânı almadan eşiği geçemezsin. Yol çıplak yürünmez.",
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
  const camBtn = document.getElementById("btn-toggle-camera");
  if (camBtn) camBtn.style.display = "none"; // Clean single straight view
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

    // Straight 2.5D Movement (Direct and Natural)
    let dx = 0;
    let dy = 0;

    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      dy = -1;
      GAME.player.direction = "up";
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      dy = 1;
      GAME.player.direction = "down";
    } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      dx = -2;
      GAME.player.direction = "left";
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      dx = 2;
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

// Straight Movement & Solid Collisions
function movePlayer(dx, dy) {
  const newX = GAME.player.x + dx;
  const newY = GAME.player.y + dy;

  // Outer bounds
  if (newX < 5 || newX > 56 || newY < 8 || newY > 21) {
    audio.playTone(75, 'square', 0.04, 0.03);
    return;
  }

  // Solid Object Collisions (Pîr, Sandık, Rahle)
  // Pîr on carpet: cols 25..35, rows 11..15
  if (newX >= 25 && newX <= 35 && newY >= 11 && newY <= 15) {
    audio.playTone(85, 'square', 0.03, 0.03);
    checkAdjacentInteractions();
    return;
  }

  // Rahle on left: cols 4..13, rows 10..15
  if (newX >= 4 && newX <= 13 && newY >= 10 && newY <= 15) {
    audio.playTone(85, 'square', 0.03, 0.03);
    checkAdjacentInteractions();
    return;
  }

  // Sandık on right: cols 45..58, rows 10..15
  if (newX >= 45 && newX <= 58 && newY >= 10 && newY <= 15) {
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

  // Near Pîr (cols 22..38, rows 10..17)
  if (px >= 22 && px <= 38 && py >= 10 && py <= 17) {
    audio.playSelect();
    triggerDialogue("pir_conversation");
    return;
  }

  // Near Sandık (cols 42..58, rows 9..17)
  if (px >= 42 && px <= 58 && py >= 9 && py <= 17) {
    audio.playSelect();
    triggerDialogue("chest_interaction");
    return;
  }

  // Near Rahle (cols 4..16, rows 9..17)
  if (px >= 4 && px <= 16 && py >= 9 && py <= 17) {
    audio.playSelect();
    triggerDialogue("desk_interaction");
    return;
  }

  // Near Sır Kapısı (cols 24..37, rows 8..9)
  if (px >= 24 && px <= 37 && py <= 9) {
    audio.playSelect();
    triggerDialogue("door_interaction");
    return;
  }
}

function checkNearTriggerHint() {
  const px = GAME.player.x;
  const py = GAME.player.y;

  let nearObj = null;
  if (px >= 22 && px <= 38 && py >= 10 && py <= 17) {
    nearObj = "Pîr-i Şeyh Burhâneddin";
  } else if (px >= 42 && px <= 58 && py >= 9 && py <= 17) {
    nearObj = "Kadim Sandık";
  } else if (px >= 4 && px <= 16 && py >= 9 && py <= 17) {
    nearObj = "Ceviz Rahle";
  } else if (px >= 24 && px <= 37 && py <= 9) {
    nearObj = "Sır Kapısı";
  }

  const hintEl = document.getElementById("interaction-hint");
  if (nearObj) {
    hintEl.innerHTML = `> Etkileşim: <span style="color: var(--term-gold); font-weight: bold;">[SPACE / E] ile '${nearObj}' nesnesini incele.</span>`;
  } else {
    hintEl.innerText = "> Etkileşim: Pîr'e, Sandığa veya Rahleye yaklaşın.";
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
    "│   99 TESBİH: SEFÎNE-İ NÛR - 2.5D SELÇUKLU DERİNLİK MİMARİSİ             │",
    "│   Düz Perspektif, Detaylı Mekanlar, Disco Elysium Diyalog Paneli       │",
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
    "│  Selçuklu kemerleri, seccade nakışları ve sükûnet dolu iç monologlar.   │",
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
│ Mimari: 2.5D Düz Perspektif Selçuklu Derinlik Motoru (Stabil & Net)   │
│ Mantık: WebAssembly (AssemblyScript) + Disco Elysium Diyalog Paneli    │
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
    "99 TESBİH: SEFÎNE-İ NÛR - MAKAM DÜZENİ\n\n" +
    "• 1-33. Bölümler (1. Çapraz): Suret ve Sıfat (Temel kıyafetler, hırka, asâ, fiziksel ve nefsani terbiyeler).\n" +
    "• 34-66. Bölümler (2. Çapraz): Gayb ve Kudret (Manevi haritalar, defterler, metafizik güçler).\n" +
    "• 67-99. Bölümler (3. Çapraz): Cem ve Cemiyet (Binit, at, toplumsal ilişkiler, nihai vuslat).\n\n" +
    "Oda düz ve derinlikli Selçuklu mimarisindedir. Yön tuşlarıyla odada serbestçe yürüyebilirsiniz."
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

  // İlk Uyanış Diyaloğu
  setTimeout(() => {
    triggerDialogue("intro_awakening");
  }, 250);

  // Calm, atmospheric 750ms Animation Loop (No jitter, gentle breathing)
  if (!GAME.animInterval) {
    GAME.animInterval = setInterval(gameLoop, 750);
  }
}

// RENDER ROOM
function renderRoom() {
  const html = GAME.isoRenderer.renderScene(GAME.roomData, GAME.player, GAME.animTick);
  document.getElementById("room-viewport").innerHTML = html;
}

function updateRoomHeaderUI() {
  const name = GAME.roomData ? GAME.roomData.name : "İbtida Halvetgâhı";
  const coords = `(${GAME.player.x}, ${GAME.player.y})`;
  const weapon = GAME.player.equipped.weapon;
  document.getElementById("room-frame-top").innerText = 
    `┌──[ ${name} (2.5D DERİNLİK) ]──┬──[ KONUM: ${coords} ]──[ TEÇHİZAT: ${weapon} ]──┐`;
}

function gameLoop() {
  GAME.animTick++;
  if (GAME.screen === "GAMEPLAY") {
    renderRoom();
  }
}

// DISCO ELYSIUM STYLE DIALOGUE
function triggerDialogue(dialogueKey) {
  const node = DIALOGUE_TREES[dialogueKey];
  if (!node) return;

  GAME.dialogue.active = true;
  GAME.dialogue.currentKey = dialogueKey;

  // Portrait Box
  const portraitKey = node.portrait || "system";
  const portraitBox = document.getElementById("portrait-box");
  portraitBox.innerText = PORTRAITS[portraitKey] || PORTRAITS.system;

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
  document.getElementById("portrait-box").innerText = PORTRAITS.salik;
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
