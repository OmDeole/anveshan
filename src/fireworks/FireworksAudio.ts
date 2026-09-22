/**
 * Dedicated Web Audio API synthesizer for the Standalone Pure Three.js Fireworks Show
 * Generates procedural rocket launch whistles, deep sub-bass explosion booms, sizzling crackles,
 * and secondary mini-bursts. Zero external audio files required.
 */
export class FireworksAudio {
  private audioCtx: AudioContext | null = null;
  public isMuted: boolean = false;

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
  }

  /**
   * Procedural rocket launch whistle with ascending pitch
   */
  public playLaunch(sizeFactor: number = 1.0) {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 300, now + 0.65);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06 * Math.min(sizeFactor, 1.4), now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.72);
    } catch {}
  }

  /**
   * Procedural explosion detonation (sub-bass boom, air shockwave rumble, and crackling sparkles)
   */
  public playExplosion(sizeFactor: number = 1.0, isSpecial: boolean = false) {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // 1. Sub-bass sine boom impact
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(120, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime((isSpecial ? 0.5 : 0.38) * sizeFactor, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + (isSpecial ? 1.0 : 0.75));

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + (isSpecial ? 1.05 : 0.8));

      // 2. Air shockwave noise burst
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.8), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.16));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.linearRampToValueAtTime(140, now + 0.75);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime((isSpecial ? 0.42 : 0.3) * sizeFactor, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);

      // 3. Crackling sparkle tails
      const crackleCount = Math.floor((isSpecial ? 12 : 7) + Math.random() * 6);
      for (let k = 0; k < crackleCount; k++) {
        const cTime = now + 0.18 + k * (0.04 + Math.random() * 0.06);
        const popBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.025), ctx.sampleRate);
        const pData = popBuffer.getChannelData(0);
        for (let p = 0; p < popBuffer.length; p++) {
          pData[p] = (Math.random() * 2 - 1) * Math.exp(-p / (ctx.sampleRate * 0.003));
        }
        const pop = ctx.createBufferSource();
        pop.buffer = popBuffer;

        const pFilter = ctx.createBiquadFilter();
        pFilter.type = 'highpass';
        pFilter.frequency.setValueAtTime(2400 + Math.random() * 1600, cTime);

        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(0.12 * sizeFactor, cTime);

        pop.connect(pFilter);
        pFilter.connect(pGain);
        pGain.connect(ctx.destination);
        pop.start(cTime);
      }
    } catch {}
  }

  /**
   * Procedural secondary mini-explosion (higher-pitched pop with snappy crackle)
   */
  public playSecondaryExplosion(sizeFactor: number = 0.8) {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18 * sizeFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      // Quick snappy pop
      const popBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
      const pData = popBuffer.getChannelData(0);
      for (let p = 0; p < popBuffer.length; p++) {
        pData[p] = (Math.random() * 2 - 1) * Math.exp(-p / (ctx.sampleRate * 0.006));
      }
      const pop = ctx.createBufferSource();
      pop.buffer = popBuffer;
      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.15 * sizeFactor, now);
      pop.connect(popGain);
      popGain.connect(ctx.destination);
      pop.start(now);
    } catch {}
  }

  /**
   * Procedural grand finale audio burst (layered deep roll)
   */
  public playFinale() {
    this.playExplosion(1.5, true);
    setTimeout(() => this.playExplosion(1.3, false), 150);
    setTimeout(() => this.playExplosion(1.4, true), 320);
  }

  public dispose() {
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}
