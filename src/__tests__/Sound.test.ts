/**
 * @jest-environment jsdom
 */
import { Sound } from '../game/Sound';

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  type: 'sine',
  frequency: {
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const mockGain = {
  connect: jest.fn(),
  gain: {
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const mockFilter = {
  connect: jest.fn(),
  type: 'highpass',
  frequency: {
    value: 0,
  },
};

const mockBufferSource = {
  connect: jest.fn(),
  start: jest.fn(),
  buffer: null,
};

const mockBuffer = {
  getChannelData: jest.fn(() => new Float32Array(4410)),
};

const mockAudioContext = {
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGain, gain: { ...mockGain.gain } })),
  createBiquadFilter: jest.fn(() => ({ ...mockFilter })),
  createBufferSource: jest.fn(() => ({ ...mockBufferSource })),
  createBuffer: jest.fn(() => mockBuffer),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: jest.fn(),
  sampleRate: 44100,
};

describe('Sound', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Sound.resetContext();
    Sound.setEnabled(true);
    Sound.setVolume(0.3);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as unknown as Record<string, unknown>).AudioContext = jest.fn(() => mockAudioContext);
  });

  describe('initialization', () => {
    it('should be a singleton', () => {
      expect(Sound).toBe(Sound);
    });

    it('should start enabled', () => {
      expect(Sound.isEnabled()).toBe(true);
    });

    it('should have default volume', () => {
      expect(Sound.getVolume()).toBe(0.3);
    });
  });

  describe('enable/disable', () => {
    it('should toggle enabled state', () => {
      Sound.setEnabled(false);
      expect(Sound.isEnabled()).toBe(false);
      Sound.setEnabled(true);
      expect(Sound.isEnabled()).toBe(true);
    });

    it('should not play sounds when disabled', () => {
      Sound.setEnabled(false);
      Sound.play('dig');
      expect(mockAudioContext.createBuffer).not.toHaveBeenCalled();
    });
  });

  describe('volume', () => {
    it('should set volume', () => {
      Sound.setVolume(0.5);
      expect(Sound.getVolume()).toBe(0.5);
    });

    it('should clamp volume to 0-1', () => {
      Sound.setVolume(-0.5);
      expect(Sound.getVolume()).toBe(0);
      Sound.setVolume(1.5);
      expect(Sound.getVolume()).toBe(1);
    });
  });

  describe('sound playback', () => {
    it('should play dig sound', () => {
      Sound.play('dig');
      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('should play claim sound', () => {
      Sound.play('claim');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('should play build sound', () => {
      Sound.play('build');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('should play spawn sound', () => {
      Sound.play('spawn');
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('should play combat sound', () => {
      Sound.play('combat');
      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });

    it('should play heroEnter sound', () => {
      Sound.play('heroEnter');
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('should play heroDefeat sound', () => {
      Sound.play('heroDefeat');
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    });

    it('should play impWork sound', () => {
      Sound.play('impWork');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('should play goldCollect sound', () => {
      Sound.play('goldCollect');
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('should play gameOver sound', () => {
      Sound.play('gameOver');
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    });
  });

  describe('context handling', () => {
    it('should resume suspended context', () => {
      mockAudioContext.state = 'suspended';
      Sound.play('dig');
      expect(mockAudioContext.resume).toHaveBeenCalled();
      mockAudioContext.state = 'running';
    });

    it('should handle missing AudioContext gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as Record<string, unknown>).AudioContext = undefined;
      Sound.resetContext();
      expect(() => Sound.play('dig')).not.toThrow();
    });
  });
});
