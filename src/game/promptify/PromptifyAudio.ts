/**
 * Promptify Japanese Market & Celebration Audio Synthesizer
 * 
 * Uses Web Audio API to create authentic soundscapes:
 * 1. Traditional Japanese night market ambience (harmonic flute/koto drone, gentle wind chimes, night atmosphere)
 * 2. High fidelity dynamic firework sound effects (launch whistle, deep explosion boom, sparkling crackles, reverberations)
 * 3. Energetic Japanese festival celebration music layer upon successful registration
 */

class PromptifyAudioController {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAmbienceActive: boolean = false;
  private isCelebrationActive: boolean = false;

  // Ambience nodes
  private ambienceGain: GainNode | null = null;
  private ambienceOscillators: OscillatorNode[] = [];
  private ambienceInterval: number | null = null;

  // Celebration music nodes & timers
  private celebrationGain: GainNode | null = null;
  private celebrationInterval: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(muted ? 0 : 0.35, this.audioCtx?.currentTime || 0);
    }
    if (this.celebrationGain) {
      this.celebrationGain.gain.setValueAtTime(muted ? 0 : 0.45, this.audioCtx?.currentTime || 0);
    }
  }

  /**
   * Start Japanese Market Night Ambience
   */
  public startMarketAmbience() {
    if (this.isAmbienceActive) return;
    this.isAmbienceActive = true;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Master ambience gain
      this.ambienceGain = ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.001, now);
      this.ambienceGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.35, now + 2.0);
      this.ambienceGain.connect(ctx.destination);

      // 1. Warm Japanese Pentatonic Drone (Insen / Hirajōshi Scale harmony)
      const droneNotes = [146.83, 220.0, 293.66, 392.0]; // D3, A3, D4, G4
      droneNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Subtle slow chorus detune LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.12 + idx * 0.05, now);
        lfoGain.gain.setValueAtTime(1.5, now);
        lfo.connect(osc.detune);
        lfo.start();

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.04 / (idx + 1), now);

        osc.connect(noteGain);
        noteGain.connect(this.ambienceGain!);
        osc.start();
        this.ambienceOscillators.push(osc);
      });

      // 2. Wind Chime (Fūrin) & Night Cricket Periodic Generator
      this.ambienceInterval = window.setInterval(() => {
        if (!this.isAmbienceActive || this.isMuted) return;
        this.playWindChimeSigh();
      }, 5500);
    } catch (e) {
      console.warn('Promptify ambience initialization notice:', e);
    }
  }

  /**
   * Stop all active Promptify audio
   */
  public stopAll() {
    this.isAmbienceActive = false;
    this.isCelebrationActive = false;

    if (this.ambienceInterval) {
      clearInterval(this.ambienceInterval);
      this.ambienceInterval = null;
    }
    if (this.celebrationInterval) {
      clearInterval(this.celebrationInterval);
      this.celebrationInterval = null;
    }

    if (this.audioCtx && this.ambienceGain) {
      try {
        this.ambienceGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
      } catch {}
    }

    this.ambienceOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.ambienceOscillators = [];
  }

  /**
   * Delicate Japanese Wind Chime shimmer
   */
  private playWindChimeSigh() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const chimes = [1760, 1975.5, 2349.3, 2637, 3135.9]; // Pentatonic bells
      const pick = chimes[Math.floor(Math.random() * chimes.length)];

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pick, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.2);
    } catch {}
  }

  /**
   * Synthesize rising rocket launch whistle
   */
  public playFireworkLaunch(sizeFactor: number = 1.0) {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const whistleOsc = ctx.createOscillator();
      whistleOsc.type = 'triangle';
      whistleOsc.frequency.setValueAtTime(380 + Math.random() * 80, now);
      whistleOsc.frequency.exponentialRampToValueAtTime(1250 + Math.random() * 300, now + 0.65);

      const whistleGain = ctx.createGain();
      whistleGain.gain.setValueAtTime(0.001, now);
      whistleGain.gain.linearRampToValueAtTime(0.07 * sizeFactor, now + 0.1);
      whistleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      whistleOsc.connect(whistleGain);
      whistleGain.connect(ctx.destination);
      whistleOsc.start(now);
      whistleOsc.stop(now + 0.72);
    } catch {}
  }

  /**
   * Synthesize authentic firework apex explosion boom & crackles
   */
  public playFireworkExplosion(sizeFactor: number = 1.0, hasCrackle: boolean = true) {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const explosionTime = ctx.currentTime;

      // Sub bass thump oscillator
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, explosionTime);
      subOsc.frequency.exponentialRampToValueAtTime(32, explosionTime + 0.55);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.4 * sizeFactor, explosionTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, explosionTime + 0.8);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(explosionTime);
      subOsc.stop(explosionTime + 0.85);

      // Noise burst for explosive crack & air rumble
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.9), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, explosionTime);
      filter.frequency.linearRampToValueAtTime(150, explosionTime + 0.8);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35 * sizeFactor, explosionTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, explosionTime + 0.9);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(explosionTime);

      // 3. Crackling Stars Sparkle (Sizzle tail)
      if (hasCrackle) {
        const crackleStart = explosionTime + 0.2;
        const crackleCount = Math.floor(6 + Math.random() * 8);

        for (let k = 0; k < crackleCount; k++) {
          const cTime = crackleStart + k * (0.04 + Math.random() * 0.07);
          const popBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
          const pData = popBuffer.getChannelData(0);
          for (let p = 0; p < popBuffer.length; p++) {
            pData[p] = (Math.random() * 2 - 1) * Math.exp(-p / (ctx.sampleRate * 0.004));
          }
          const pop = ctx.createBufferSource();
          pop.buffer = popBuffer;

          const pFilter = ctx.createBiquadFilter();
          pFilter.type = 'highpass';
          pFilter.frequency.setValueAtTime(2200 + Math.random() * 1500, cTime);

          const pGain = ctx.createGain();
          pGain.gain.setValueAtTime(0.12 * sizeFactor, cTime);

          pop.connect(pFilter);
          pFilter.connect(pGain);
          pGain.connect(ctx.destination);
          pop.start(cTime);
        }
      }
    } catch {}
  }

  /**
   * Start Festival Celebration Music & Atmosphere Layer
   */
  public startCelebrationMusic() {
    if (this.isCelebrationActive) return;
    this.isCelebrationActive = true;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      this.celebrationGain = ctx.createGain();
      this.celebrationGain.gain.setValueAtTime(this.isMuted ? 0 : 0.01, now);
      this.celebrationGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.45, now + 1.5);
      this.celebrationGain.connect(ctx.destination);

      // Celebratory festival rhythm & melody loop
      // High-energy traditional Taiko drums + Shinobue flute melody
      const melodyNotes = [
        587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 880.0, 783.99,
        659.25, 587.33, 783.99, 880.0, 1046.5, 880.0, 659.25, 587.33
      ];
      let step = 0;

      this.celebrationInterval = window.setInterval(() => {
        if (!this.isCelebrationActive || this.isMuted) return;

        const cCtx = this.getAudioContext();
        const t = cCtx.currentTime;

        // 1. Taiko Drum pulse
        if (step % 2 === 0) {
          const taiko = cCtx.createOscillator();
          taiko.type = 'sine';
          taiko.frequency.setValueAtTime(95, t);
          taiko.frequency.exponentialRampToValueAtTime(45, t + 0.2);

          const tGain = cCtx.createGain();
          tGain.gain.setValueAtTime(0.3, t);
          tGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

          taiko.connect(tGain);
          tGain.connect(this.celebrationGain!);
          taiko.start(t);
          taiko.stop(t + 0.3);
        }

        // 2. Festival Shinobue Flute Note
        const noteFreq = melodyNotes[step % melodyNotes.length];
        const flute = cCtx.createOscillator();
        flute.type = 'triangle';
        flute.frequency.setValueAtTime(noteFreq, t);

        const fGain = cCtx.createGain();
        fGain.gain.setValueAtTime(0.01, t);
        fGain.gain.linearRampToValueAtTime(0.12, t + 0.04);
        fGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        flute.connect(fGain);
        fGain.connect(this.celebrationGain!);
        flute.start(t);
        flute.stop(t + 0.35);

      step++;
    }, 190);
  } catch (e) {
    console.warn('Promptify celebration audio error:', e);
  }
}

/**
 * Stop celebratory festival music and smoothly fade back into ambient night market sound
 */
public stopCelebrationMusic() {
  if (!this.isCelebrationActive) return;
  this.isCelebrationActive = false;

  if (this.celebrationInterval) {
    clearInterval(this.celebrationInterval);
    this.celebrationInterval = null;
  }

  if (this.audioCtx && this.celebrationGain) {
    try {
      const now = this.audioCtx.currentTime;
      this.celebrationGain.gain.linearRampToValueAtTime(0.001, now + 1.2);
    } catch {}
  }
}
}

export const promptifyAudio = new PromptifyAudioController();
