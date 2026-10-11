// 8-bit Chiptune & Sound Engine using Web Audio API
// Produces retro ASCII-era square/triangle wave mystical music & SFX

class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.musicInterval = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a single 8-bit tone
  playTone(freq, type = 'square', duration = 0.15, vol = 0.08) {
    if (this.isMuted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // SFX: Dialogue character blip
  playBlip() {
    this.playTone(440 + Math.random() * 60, 'square', 0.04, 0.03);
  }

  // SFX: Footstep in ASCII room
  playStep() {
    this.playTone(120, 'triangle', 0.06, 0.04);
  }

  // SFX: UI Select
  playSelect() {
    this.playTone(587.33, 'square', 0.08, 0.06);
    setTimeout(() => this.playTone(880, 'square', 0.12, 0.06), 60);
  }

  // SFX: Item pickup / Revelation
  playItemPickup() {
    [330, 392, 493.88, 659.25].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.07), idx * 80);
    });
  }

  // Mystical 8-bit background chiptune melody (Hicaz/Neva inspired arpeggiated loop)
  startMysticBGM() {
    if (this.isPlaying || this.isMuted) return;
    this.init();
    this.isPlaying = true;

    // Notes: D4, Eb4, F#4, G4, A4, Bb4, C5, D5 (Hicaz scale frequencies)
    const melody = [
      293.66, 311.13, 369.99, 392.00,
      440.00, 392.00, 369.99, 311.13,
      293.66, 369.99, 440.00, 466.16,
      440.00, 369.99, 311.13, 293.66
    ];

    const bass = [146.83, 146.83, 185.00, 196.00, 220.00, 196.00, 185.00, 146.83];

    let step = 0;
    this.musicInterval = setInterval(() => {
      if (!this.isPlaying || this.isMuted) return;
      const note = melody[step % melody.length];
      const bassNote = bass[Math.floor(step / 2) % bass.length];

      // Lead voice (Square)
      this.playTone(note, 'square', 0.18, 0.04);

      // Bass voice (Triangle drone)
      if (step % 2 === 0) {
        this.playTone(bassNote, 'triangle', 0.35, 0.06);
      }

      step++;
    }, 240);
  }

  stopBGM() {
    this.isPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startMysticBGM();
    }
    return this.isMuted;
  }
}

export const audio = new RetroAudioEngine();
