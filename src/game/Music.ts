/**
 * Music system for Underlord using Web Audio API.
 * Generates dark, dungeon-themed chiptune background music.
 */

type MusicTrack = 'gameplay' | 'menu' | 'victory';

interface Note {
  frequency: number;
  duration: number;
  volume?: number;
}

class MusicSystem {
  private static instance: MusicSystem;
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.12;
  private currentTrack: MusicTrack | null = null;
  private isPlaying: boolean = false;
  private loopTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): MusicSystem {
    if (!MusicSystem.instance) {
      MusicSystem.instance = new MusicSystem();
    }
    return MusicSystem.instance;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (!this.context) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    return this.context;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  private noteToFreq(note: string): number {
    const notes: Record<string, number> = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
      'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
      'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    };
    return notes[note] || 440;
  }

  private playNote(freq: number, startTime: number, duration: number, vol: number = 1): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Sawtooth wave for dark, ominous feel
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(this.volume * vol * 0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.85);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Gameplay track - dark dungeon, evil overlord
  private getGameplayNotes(): Note[] {
    const bpm = 90;
    const beat = 60 / bpm;
    const half = beat * 2;
    const quarter = beat;
    const eighth = beat / 2;
    
    // Ominous dungeon melody (8 bars)
    const melody = [
      // Bar 1-2: Dark descent
      { note: 'E3', dur: quarter },
      { note: 'G3', dur: eighth },
      { note: 'A3', dur: eighth },
      { note: 'E3', dur: half },
      { note: 'D3', dur: quarter },
      { note: 'E3', dur: quarter },
      { note: 'G3', dur: half },
      // Bar 3-4: Minions at work
      { note: 'A3', dur: quarter },
      { note: 'G3', dur: eighth },
      { note: 'E3', dur: eighth },
      { note: 'D3', dur: quarter },
      { note: 'C3', dur: quarter },
      { note: 'E3', dur: half },
      { note: 'G3', dur: half },
      // Bar 5-6: Scheming
      { note: 'B3', dur: quarter },
      { note: 'A3', dur: eighth },
      { note: 'G3', dur: eighth },
      { note: 'E3', dur: quarter },
      { note: 'D3', dur: quarter },
      { note: 'E3', dur: half },
      { note: 'A3', dur: half },
      // Bar 7-8: Evil plans
      { note: 'G3', dur: quarter },
      { note: 'E3', dur: quarter },
      { note: 'D3', dur: eighth },
      { note: 'E3', dur: eighth },
      { note: 'G3', dur: quarter },
      { note: 'E3', dur: half },
      { note: 'E3', dur: half },
    ];
    
    return melody.map(n => ({
      frequency: this.noteToFreq(n.note),
      duration: n.dur,
    }));
  }

  private scheduleTrack(notes: Note[]): number {
    const ctx = this.getContext();
    if (!ctx) return 0;

    let time = ctx.currentTime + 0.1;
    let totalDuration = 0;

    for (const note of notes) {
      this.playNote(note.frequency, time, note.duration, note.volume ?? 1);
      time += note.duration;
      totalDuration += note.duration;
    }

    return totalDuration;
  }

  play(track: MusicTrack = 'gameplay'): void {
    if (!this.enabled) return;
    
    if (this.isPlaying && this.currentTrack !== track) {
      this.stop();
    }
    
    if (this.isPlaying) return;
    
    this.currentTrack = track;
    this.isPlaying = true;
    
    this.loopTrack();
  }

  private loopTrack(): void {
    if (!this.isPlaying || !this.enabled) return;

    let notes: Note[];
    switch (this.currentTrack) {
      case 'gameplay':
        notes = this.getGameplayNotes();
        break;
      default:
        notes = this.getGameplayNotes();
    }

    const duration = this.scheduleTrack(notes);
    
    this.loopTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.loopTrack();
      }
    }, duration * 1000 - 100);
  }

  stop(): void {
    this.isPlaying = false;
    this.currentTrack = null;
    
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  toggle(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  static resetInstance(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MusicSystem.instance = undefined as unknown as MusicSystem;
  }
}

export const Music = MusicSystem.getInstance();
export { MusicSystem };
