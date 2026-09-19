/**
 * Audio manager for Samurai Mountain Adventure / Anveshan 3.0
 * Supports playing user custom background soundtrack (MP3 / Audio)
 * and ambient sound, with auto-fallback and easy file upload/drop.
 */

class SoundController {
  private audio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private currentTrackUrl: string = '/assets/soundtrack.mp3';
  private listeners: Array<() => void> = [];

  constructor() {
    this.initAudio(this.currentTrackUrl);
  }

  private initAudio(url: string) {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }

    const audio = new Audio();
    audio.src = url;
    audio.loop = true;
    audio.volume = 0.55;
    audio.preload = 'auto';

    audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notify();
    });
    audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });
    audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.notify();
    });
    audio.addEventListener('error', () => {
      // If default asset file isn't found yet, handle gracefully
      this.isPlaying = false;
      this.notify();
    });

    this.audio = audio;
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public setCustomAudioUrl(url: string) {
    this.currentTrackUrl = url;
    this.initAudio(url);
    if (!this.isMuted) {
      this.play();
    }
  }

  public async play(): Promise<boolean> {
    if (!this.audio) return false;
    try {
      this.audio.muted = this.isMuted;
      await this.audio.play();
      this.isPlaying = true;
      this.notify();
      return true;
    } catch {
      // Browser autoplay policy might block before user gesture
      this.isPlaying = false;
      this.notify();
      return false;
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.notify();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.muted = this.isMuted;
      if (!this.isMuted && !this.isPlaying) {
        this.audio.play().catch(() => {});
      }
    }
    this.notify();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }
}

export const soundController = new SoundController();
