import {
  createDefaultChannel,
  createDefaultMaster,
  createDefaultProject,
  dbToLinear,
  linearToDb,
  clamp,
  mapRange,
} from '../defaults';

describe('Default Creation Functions', () => {
  describe('createDefaultChannel', () => {
    it('creates a channel with correct default values', () => {
      const channel = createDefaultChannel('Test Channel');
      
      expect(channel.name).toBe('Test Channel');
      expect(channel.type).toBe('input');
      expect(channel.gain).toBe(0.75);
      expect(channel.muted).toBe(false);
      expect(channel.solo).toBe(false);
      expect(channel.pan).toBe(0);
      expect(channel.id).toMatch(/^channel-\d+-[a-z0-9]+$/);
    });

    it('creates channels with unique IDs', () => {
      const channel1 = createDefaultChannel('Channel 1');
      const channel2 = createDefaultChannel('Channel 2');
      
      expect(channel1.id).not.toBe(channel2.id);
    });

    it('creates channel with correct EQ settings', () => {
      const channel = createDefaultChannel('Test Channel');
      
      expect(channel.eq.enabled).toBe(true);
      expect(channel.eq.highGain).toBe(0);
      expect(channel.eq.midGain).toBe(0);
      expect(channel.eq.lowGain).toBe(0);
      expect(channel.eq.highFreq).toBe(8000);
      expect(channel.eq.midFreq).toBe(1000);
      expect(channel.eq.lowFreq).toBe(200);
    });

    it('creates channel with correct level initialization', () => {
      const channel = createDefaultChannel('Test Channel');
      
      expect(channel.level.peak).toBe(0);
      expect(channel.level.rms).toBe(0);
      expect(channel.level.clipping).toBe(false);
    });
  });

  describe('createDefaultMaster', () => {
    it('creates master section with correct defaults', () => {
      const master = createDefaultMaster();
      
      expect(master.mainGain).toBe(0.8);
      expect(master.headphoneGain).toBe(0.7);
      expect(master.muted).toBe(false);
      expect(master.limiter.enabled).toBe(true);
      expect(master.limiter.threshold).toBe(-3);
      expect(master.limiter.ratio).toBe(4);
    });

    it('creates master with correct level initialization', () => {
      const master = createDefaultMaster();
      
      expect(master.level.peak).toBe(0);
      expect(master.level.rms).toBe(0);
      expect(master.level.clipping).toBe(false);
    });
  });

  describe('createDefaultProject', () => {
    it('creates project with correct defaults', () => {
      const project = createDefaultProject();
      
      expect(project.name).toBe('Untitled Project');
      expect(project.sampleRate).toBe(44100);
      expect(project.bufferSize).toBe(512);
      expect(project.channels).toHaveLength(4);
      expect(project.master).toBeDefined();
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.modifiedAt).toBeInstanceOf(Date);
    });

    it('creates project with default channels', () => {
      const project = createDefaultProject();
      
      expect(project.channels[0].name).toBe('Channel 1');
      expect(project.channels[1].name).toBe('Channel 2');
      expect(project.channels[2].name).toBe('Channel 3');
      expect(project.channels[3].name).toBe('Channel 4');
    });
  });
});

describe('Audio Utility Functions', () => {
  describe('dbToLinear', () => {
    it('converts decibels to linear correctly', () => {
      expect(dbToLinear(0)).toBeCloseTo(1, 5);
      expect(dbToLinear(-6)).toBeCloseTo(0.5012, 3);
      expect(dbToLinear(-20)).toBeCloseTo(0.1, 3);
      expect(dbToLinear(6)).toBeCloseTo(1.9953, 3);
    });

    it('handles extreme values', () => {
      expect(dbToLinear(-60)).toBeCloseTo(0.001, 3);
      expect(dbToLinear(20)).toBeCloseTo(10, 3);
    });
  });

  describe('linearToDb', () => {
    it('converts linear to decibels correctly', () => {
      expect(linearToDb(1)).toBeCloseTo(0, 5);
      expect(linearToDb(0.5)).toBeCloseTo(-6.02, 1);
      expect(linearToDb(0.1)).toBeCloseTo(-20, 1);
      expect(linearToDb(2)).toBeCloseTo(6.02, 1);
    });

    it('handles zero and very small values', () => {
      expect(linearToDb(0)).toBeCloseTo(-120, 1); // Should clamp to minimum
      expect(linearToDb(0.000001)).toBeCloseTo(-120, 1);
    });

    it('is inverse of dbToLinear', () => {
      const testValues = [-20, -10, -6, 0, 6, 10, 20];
      
      testValues.forEach(db => {
        const linear = dbToLinear(db);
        const backToDb = linearToDb(linear);
        expect(backToDb).toBeCloseTo(db, 3);
      });
    });
  });

  describe('clamp', () => {
    it('clamps values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('handles edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('works with negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('works with decimal values', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(1.5, 0, 1)).toBe(1);
      expect(clamp(-0.5, 0, 1)).toBe(0);
    });
  });

  describe('mapRange', () => {
    it('maps values between ranges correctly', () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
      expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
    });

    it('handles negative ranges', () => {
      expect(mapRange(0, -10, 10, 0, 100)).toBe(50);
      expect(mapRange(-10, -10, 10, 0, 100)).toBe(0);
      expect(mapRange(10, -10, 10, 0, 100)).toBe(100);
    });

    it('handles inverted ranges', () => {
      expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
      expect(mapRange(0, 0, 10, 100, 0)).toBe(100);
      expect(mapRange(10, 0, 10, 100, 0)).toBe(0);
    });

    it('handles decimal values', () => {
      expect(mapRange(0.5, 0, 1, 0, 100)).toBe(50);
      expect(mapRange(0.25, 0, 1, 0, 100)).toBe(25);
      expect(mapRange(0.75, 0, 1, 0, 100)).toBe(75);
    });

    it('handles values outside input range', () => {
      expect(mapRange(15, 0, 10, 0, 100)).toBe(150);
      expect(mapRange(-5, 0, 10, 0, 100)).toBe(-50);
    });
  });
});
