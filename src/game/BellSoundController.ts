/**
 * Japanese Temple Bell (Bonshō - 梵鐘) Sound Controller
 * 
 * Synthesizes rich, resonant, deep Buddhist temple bell strikes using Web Audio API.
 * Accurately models the acoustic signature of a traditional bronze Bonshō:
 * - Atari: Initial wooden log (shumoku) mallet strike transient
 * - Oshie: Rich inharmonic bronze partials & deep fundamental hum note (~108 Hz)
 * - Okuri: Slow acoustic beating (1.2 Hz wari modulation) with long 6-8s meditative sustain
 * - Layered high crystal wind chime (Fūrin) harmonics
 * 
 * Plays seamlessly ON TOP of whatever background soundtrack is active.
 */

class BellSoundController {
  private audioCtx: AudioContext | null = null;

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

  /**
   * Play an authentic, resonant Japanese temple bell strike.
   * Plays cleanly on top of background music with rich harmonics and long sustain.
   */
  public playTempleBell(volume: number = 0.9): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Master gain for this bell strike
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, now);
      masterGain.connect(ctx.destination);

      // --- 1. Mallet Strike Transient (Wooden Shumoku Impact) ---
      const clickBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
      const clickData = clickBuffer.getChannelData(0);
      for (let i = 0; i < clickData.length; i++) {
        clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
      }
      const clickNode = ctx.createBufferSource();
      clickNode.buffer = clickBuffer;
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'lowpass';
      clickFilter.frequency.setValueAtTime(450, now);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.5, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      clickNode.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(masterGain);
      clickNode.start(now);

      // --- 2. Traditional Bonshō Harmonic Partials ---
      // Fundamental hum note: 108 Hz (Sacred Buddhist number 108)
      // Strike note: 216 Hz, Prime: 270 Hz, Fifth: 324 Hz, Octave: 432 Hz, Upper: 648, 864, 1296 Hz
      const bellPartials = [
        { freq: 108.0, gain: 0.65, decay: 7.5, beatFreq: 1.2 }, // Deep fundamental hum with slow acoustic beating
        { freq: 109.3, gain: 0.45, decay: 7.0, beatFreq: 0.0 }, // Beating pair for fundamental
        { freq: 216.0, gain: 0.70, decay: 5.5, beatFreq: 1.5 }, // Strike note (Atari)
        { freq: 270.0, gain: 0.40, decay: 4.5, beatFreq: 1.8 }, // Minor-third overtone
        { freq: 324.0, gain: 0.50, decay: 4.8, beatFreq: 2.0 }, // Fifth overtone
        { freq: 432.0, gain: 0.45, decay: 4.0, beatFreq: 2.2 }, // Octave
        { freq: 648.0, gain: 0.30, decay: 3.2, beatFreq: 0.0 }, // High bell shimmer
        { freq: 864.0, gain: 0.20, decay: 2.5, beatFreq: 0.0 }, // Upper metallic resonance
        { freq: 1296.0, gain: 0.12, decay: 1.6, beatFreq: 0.0 }, // Strike ping
        { freq: 1728.0, gain: 0.08, decay: 1.1, beatFreq: 0.0 }, // Initial sparkle
      ];

      bellPartials.forEach((p) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now);

        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(0.001, now);
        pGain.gain.linearRampToValueAtTime(p.gain, now + 0.015);
        pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        if (p.beatFreq > 0) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(p.beatFreq, now);
          lfoGain.gain.setValueAtTime(p.gain * 0.25, now);
          lfo.connect(lfoGain.gain);
          lfo.start(now);
          lfo.stop(now + p.decay);
        }

        osc.connect(pGain);
        pGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + p.decay);
      });

      // --- 3. Ethereal High Wind Chime / Shrine Bell (Fūrin) Shimmer ---
      const chimeFreqs = [1568, 1760, 2093, 2349, 2793];
      chimeFreqs.forEach((freq, idx) => {
        const chimeOsc = ctx.createOscillator();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const chimeGain = ctx.createGain();
        const startT = now + idx * 0.06;
        chimeGain.gain.setValueAtTime(0.001, startT);
        chimeGain.gain.linearRampToValueAtTime(0.08, startT + 0.01);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, startT + 2.5);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(masterGain);

        chimeOsc.start(startT);
        chimeOsc.stop(startT + 2.5);
      });
    } catch (e) {
      console.warn('Could not play temple bell audio:', e);
    }
  }
}

export const bellSoundController = new BellSoundController();
