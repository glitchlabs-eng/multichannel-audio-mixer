import { AudioChannel, MasterSection, ProjectSettings } from '@/types/audio';

export const createDefaultChannel = (name: string): AudioChannel => ({
  id: `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name,
  type: 'input',
  gain: 0.75,
  muted: false,
  solo: false,
  pan: 0,
  eq: {
    enabled: true,
    highGain: 0,
    midGain: 0,
    lowGain: 0,
    highFreq: 8000,
    midFreq: 1000,
    lowFreq: 200,
  },
  effects: {
    effects: [],
    wetDryMix: 0,
  },
  level: {
    peak: 0,
    rms: 0,
    clipping: false,
  },
});

export const createDefaultMaster = (): MasterSection => ({
  mainGain: 0.8,
  headphoneGain: 0.7,
  muted: false,
  level: {
    peak: 0,
    rms: 0,
    clipping: false,
  },
  limiter: {
    enabled: true,
    threshold: -3,
    ratio: 4,
  },
});

export const createDefaultProject = (): ProjectSettings => ({
  name: 'Untitled Project',
  sampleRate: 44100,
  bufferSize: 512,
  channels: [
    createDefaultChannel('Channel 1'),
    createDefaultChannel('Channel 2'),
    createDefaultChannel('Channel 3'),
    createDefaultChannel('Channel 4'),
  ],
  master: createDefaultMaster(),
  createdAt: new Date(),
  modifiedAt: new Date(),
});

export const dbToLinear = (db: number): number => {
  return Math.pow(10, db / 20);
};

export const linearToDb = (linear: number): number => {
  return 20 * Math.log10(Math.max(linear, 0.000001));
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
