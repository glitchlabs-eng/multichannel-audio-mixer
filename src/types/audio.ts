// Audio Engine Types
export interface AudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  channelCount: number;
  sampleRate: number;
}

export interface AudioChannel {
  id: string;
  name: string;
  type: 'input' | 'aux' | 'master';
  gain: number;
  muted: boolean;
  solo: boolean;
  pan: number;
  eq: EQSettings;
  effects: EffectChain;
  inputSource?: AudioSource;
  level: AudioLevel;
}

export interface AudioSource {
  type: 'microphone' | 'file' | 'line-in';
  deviceId?: string;
  filePath?: string;
  buffer?: AudioBuffer;
}

export interface EQSettings {
  enabled: boolean;
  highGain: number;
  midGain: number;
  lowGain: number;
  highFreq: number;
  midFreq: number;
  lowFreq: number;
}

export interface Effect {
  id: string;
  type: 'reverb' | 'delay' | 'compressor' | 'distortion' | 'chorus';
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface EffectChain {
  effects: Effect[];
  wetDryMix: number;
}

export interface AudioLevel {
  peak: number;
  rms: number;
  clipping: boolean;
}

export interface MasterSection {
  mainGain: number;
  headphoneGain: number;
  muted: boolean;
  level: AudioLevel;
  limiter: {
    enabled: boolean;
    threshold: number;
    ratio: number;
  };
}

export interface ProjectSettings {
  name: string;
  sampleRate: number;
  bufferSize: number;
  channels: AudioChannel[];
  master: MasterSection;
  createdAt: Date;
  modifiedAt: Date;
}

// UI Component Types
export interface ChannelStripProps {
  channel: AudioChannel;
  onChannelUpdate: (channelId: string, updates: Partial<AudioChannel>) => void;
  onSolo: (channelId: string) => void;
  onMute: (channelId: string) => void;
}

export interface FaderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  orientation: 'vertical' | 'horizontal';
  onChange: (value: number) => void;
  label?: string;
}

export interface KnobProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  size?: 'small' | 'medium' | 'large';
}

export interface MeterProps {
  level: AudioLevel;
  orientation: 'vertical' | 'horizontal';
  height?: number;
  width?: number;
}

// Audio Engine Events
export type AudioEngineEvent = 
  | { type: 'LEVEL_UPDATE'; channelId: string; level: AudioLevel }
  | { type: 'CLIPPING_DETECTED'; channelId: string }
  | { type: 'DEVICE_CONNECTED'; device: AudioDevice }
  | { type: 'DEVICE_DISCONNECTED'; deviceId: string }
  | { type: 'ERROR'; message: string; code?: string };

export interface AudioEngineConfig {
  sampleRate: number;
  bufferSize: number;
  inputDeviceId?: string;
  outputDeviceId?: string;
  latency: 'interactive' | 'balanced' | 'playback';
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AudioContextState = 'suspended' | 'running' | 'closed';

export interface AudioAnalyzer {
  getFrequencyData(): Uint8Array;
  getTimeDomainData(): Uint8Array;
  getLevel(): AudioLevel;
}
