// WebAssembly Engine for Sufi RPG (AssemblyScript)

export class GameState {
  nefs: i32;
  akil: i32;
  kalp: i32;
  ruh: i32;

  // Player position in room
  playerX: i32;
  playerY: i32;
  direction: i32; // 0: Down, 1: Up, 2: Left, 3: Right

  // Story progression
  chapter: i32;   // 1..3
  sequence: i32;  // 1..33 (Total 99 sections)
  inDialogue: bool;

  // Maneviyat / HP
  hp: i32;
  maxHp: i32;
  zikirEnergy: i32;

  constructor() {
    this.nefs = 1;
    this.akil = 1;
    this.kalp = 1;
    this.ruh = 1;

    this.playerX = 14;
    this.playerY = 9;
    this.direction = 0;

    this.chapter = 1;
    this.sequence = 1;
    this.inDialogue = false;

    this.hp = 100;
    this.maxHp = 100;
    this.zikirEnergy = 33;
  }

  updateStat(stat: i32, amount: i32): void {
    if (stat == 0) this.nefs += amount;
    else if (stat == 1) this.akil += amount;
    else if (stat == 2) this.kalp += amount;
    else if (stat == 3) this.ruh += amount;
  }
}

const state = new GameState();

export function getNefs(): i32 { return state.nefs; }
export function getAkil(): i32 { return state.akil; }
export function getKalp(): i32 { return state.kalp; }
export function getRuh(): i32 { return state.ruh; }
export function getPlayerX(): i32 { return state.playerX; }
export function getPlayerY(): i32 { return state.playerY; }
export function getPlayerDir(): i32 { return state.direction; }
export function getChapter(): i32 { return state.chapter; }
export function getSequence(): i32 { return state.sequence; }
export function getHp(): i32 { return state.hp; }
export function getZikirEnergy(): i32 { return state.zikirEnergy; }

export function updateStat(statIndex: i32, amount: i32): void {
  state.updateStat(statIndex, amount);
}

export function setPlayerPos(x: i32, y: i32): void {
  state.playerX = x;
  state.playerY = y;
}

export function tryMove(dx: i32, dy: i32, minX: i32, maxX: i32, minY: i32, maxY: i32): bool {
  if (dx > 0) state.direction = 3;
  else if (dx < 0) state.direction = 2;
  else if (dy > 0) state.direction = 0;
  else if (dy < 0) state.direction = 1;

  let newX = state.playerX + dx;
  let newY = state.playerY + dy;

  if (newX >= minX && newX <= maxX && newY >= minY && newY <= maxY) {
    state.playerX = newX;
    state.playerY = newY;
    return true;
  }
  return false;
}

export function setSequence(seq: i32): void {
  state.sequence = seq;
  if (seq > 66) state.chapter = 3;
  else if (seq > 33) state.chapter = 2;
  else state.chapter = 1;
}
