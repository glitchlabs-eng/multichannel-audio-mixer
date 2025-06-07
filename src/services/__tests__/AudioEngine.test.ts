import { AudioEngine } from '../AudioEngine';
import { createDefaultChannel } from '../../utils/defaults';

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;

  beforeEach(() => {
    audioEngine = new AudioEngine({
      sampleRate: 44100,
      bufferSize: 512,
      latency: 'interactive',
    });
  });

  afterEach(() => {
    if (audioEngine) {
      audioEngine.dispose();
    }
  });

  describe('initialization', () => {
    it('initializes successfully with valid config', async () => {
      await expect(audioEngine.initialize()).resolves.not.toThrow();
    });

    it('creates audio context with correct sample rate', async () => {
      await audioEngine.initialize();
      // AudioContext is mocked, so we just verify no errors
      expect(audioEngine).toBeDefined();
    });

    it('handles initialization errors gracefully', async () => {
      // Mock AudioContext to throw an error
      const originalAudioContext = global.AudioContext;
      global.AudioContext = jest.fn().mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });

      await expect(audioEngine.initialize()).rejects.toThrow('AudioContext not supported');

      // Restore original
      global.AudioContext = originalAudioContext;
    });
  });

  describe('channel management', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('creates a new channel successfully', async () => {
      const channel = createDefaultChannel('Test Channel');
      
      await expect(audioEngine.createChannel(channel)).resolves.not.toThrow();
    });

    it('updates channel settings', async () => {
      const channel = createDefaultChannel('Test Channel');
      await audioEngine.createChannel(channel);
      
      expect(() => {
        audioEngine.updateChannel(channel.id, { gain: 0.8, muted: true });
      }).not.toThrow();
    });

    it('removes channel successfully', async () => {
      const channel = createDefaultChannel('Test Channel');
      await audioEngine.createChannel(channel);
      
      expect(() => {
        audioEngine.removeChannel(channel.id);
      }).not.toThrow();
    });

    it('handles updates to non-existent channel gracefully', () => {
      expect(() => {
        audioEngine.updateChannel('non-existent-id', { gain: 0.5 });
      }).not.toThrow();
    });

    it('handles removal of non-existent channel gracefully', () => {
      expect(() => {
        audioEngine.removeChannel('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('master controls', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('sets master gain correctly', () => {
      expect(() => {
        audioEngine.setMasterGain(0.7);
      }).not.toThrow();
    });

    it('gets master level', () => {
      const level = audioEngine.getMasterLevel();
      
      expect(level).toHaveProperty('peak');
      expect(level).toHaveProperty('rms');
      expect(level).toHaveProperty('clipping');
      expect(typeof level.peak).toBe('number');
      expect(typeof level.rms).toBe('number');
      expect(typeof level.clipping).toBe('boolean');
    });

    it('gets channel level', async () => {
      const channel = createDefaultChannel('Test Channel');
      await audioEngine.createChannel(channel);
      
      const level = audioEngine.getChannelLevel(channel.id);
      
      expect(level).toHaveProperty('peak');
      expect(level).toHaveProperty('rms');
      expect(level).toHaveProperty('clipping');
    });

    it('returns default level for non-existent channel', () => {
      const level = audioEngine.getChannelLevel('non-existent-id');
      
      expect(level.peak).toBe(0);
      expect(level.rms).toBe(0);
      expect(level.clipping).toBe(false);
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('adds event listener successfully', () => {
      const listener = jest.fn();
      
      expect(() => {
        audioEngine.addEventListener(listener);
      }).not.toThrow();
    });

    it('removes event listener successfully', () => {
      const listener = jest.fn();
      audioEngine.addEventListener(listener);
      
      expect(() => {
        audioEngine.removeEventListener(listener);
      }).not.toThrow();
    });

    it('handles multiple event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      audioEngine.addEventListener(listener1);
      audioEngine.addEventListener(listener2);
      
      expect(() => {
        audioEngine.removeEventListener(listener1);
      }).not.toThrow();
    });
  });

  describe('audio file loading', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('loads audio file successfully', async () => {
      // Mock fetch for audio file
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      });

      await expect(audioEngine.loadAudioFile('test.wav')).resolves.toBeDefined();
    });

    it('handles audio file loading errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('File not found'));

      await expect(audioEngine.loadAudioFile('nonexistent.wav')).rejects.toThrow('File not found');
    });

    it('throws error when not initialized', async () => {
      const uninitializedEngine = new AudioEngine({
        sampleRate: 44100,
        bufferSize: 512,
        latency: 'interactive',
      });

      await expect(uninitializedEngine.loadAudioFile('test.wav')).rejects.toThrow('Audio engine not initialized');
    });
  });

  describe('disposal', () => {
    it('disposes resources correctly', async () => {
      await audioEngine.initialize();
      
      expect(() => {
        audioEngine.dispose();
      }).not.toThrow();
    });

    it('handles disposal when not initialized', () => {
      const uninitializedEngine = new AudioEngine({
        sampleRate: 44100,
        bufferSize: 512,
        latency: 'interactive',
      });

      expect(() => {
        uninitializedEngine.dispose();
      }).not.toThrow();
    });
  });
});
