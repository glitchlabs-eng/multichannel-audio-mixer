import { MIDIMessage } from './MIDIEngine';

export interface VirtualInstrument {
  id: string;
  name: string;
  type: 'synthesizer' | 'sampler' | 'drum_machine';
  enabled: boolean;
  parameters: Record<string, number>;
  presets: InstrumentPreset[];
  currentPreset?: string;
}

export interface InstrumentPreset {
  id: string;
  name: string;
  parameters: Record<string, number>;
}

export interface Voice {
  id: string;
  note: number;
  velocity: number;
  startTime: number;
  oscillator?: OscillatorNode;
  gainNode?: GainNode;
  filterNode?: BiquadFilterNode;
  envelope?: ADSREnvelope;
  isActive: boolean;
}

export interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface SynthParameters {
  oscillatorType: OscillatorType;
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterResonance: number;
  envelope: ADSREnvelope;
  volume: number;
  detune: number;
  portamento: number;
}

export class SynthesizerInstrument implements VirtualInstrument {
  id: string;
  name: string;
  type: 'synthesizer' = 'synthesizer';
  enabled = true;
  parameters: Record<string, number> = {};
  presets: InstrumentPreset[] = [];
  currentPreset?: string;

  private audioContext: AudioContext;
  private outputNode: GainNode;
  private voices: Map<number, Voice> = new Map();
  private synthParams: SynthParameters;
  private maxVoices = 16;

  constructor(audioContext: AudioContext, id: string, name: string) {
    this.audioContext = audioContext;
    this.id = id;
    this.name = name;
    
    this.outputNode = audioContext.createGain();
    this.outputNode.gain.value = 0.3;
    
    this.synthParams = {
      oscillatorType: 'sawtooth',
      filterType: 'lowpass',
      filterFrequency: 2000,
      filterResonance: 1,
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.7,
        release: 0.5,
      },
      volume: 0.3,
      detune: 0,
      portamento: 0,
    };

    this.initializePresets();
    this.updateParameters();
  }

  private initializePresets(): void {
    this.presets = [
      {
        id: 'lead',
        name: 'Lead Synth',
        parameters: {
          oscillatorType: 0, // sawtooth
          filterFrequency: 3000,
          filterResonance: 2,
          attack: 0.01,
          decay: 0.2,
          sustain: 0.8,
          release: 0.3,
          volume: 0.4,
        },
      },
      {
        id: 'pad',
        name: 'Warm Pad',
        parameters: {
          oscillatorType: 1, // triangle
          filterFrequency: 1500,
          filterResonance: 0.5,
          attack: 0.5,
          decay: 0.8,
          sustain: 0.9,
          release: 1.5,
          volume: 0.3,
        },
      },
      {
        id: 'bass',
        name: 'Bass Synth',
        parameters: {
          oscillatorType: 2, // square
          filterFrequency: 800,
          filterResonance: 3,
          attack: 0.001,
          decay: 0.1,
          sustain: 0.6,
          release: 0.2,
          volume: 0.5,
        },
      },
      {
        id: 'pluck',
        name: 'Pluck',
        parameters: {
          oscillatorType: 0, // sawtooth
          filterFrequency: 4000,
          filterResonance: 1,
          attack: 0.001,
          decay: 0.05,
          sustain: 0.1,
          release: 0.1,
          volume: 0.4,
        },
      },
    ];
  }

  private updateParameters(): void {
    this.parameters = {
      oscillatorType: ['sawtooth', 'triangle', 'square', 'sine'].indexOf(this.synthParams.oscillatorType),
      filterFrequency: this.synthParams.filterFrequency,
      filterResonance: this.synthParams.filterResonance,
      attack: this.synthParams.envelope.attack,
      decay: this.synthParams.envelope.decay,
      sustain: this.synthParams.envelope.sustain,
      release: this.synthParams.envelope.release,
      volume: this.synthParams.volume,
      detune: this.synthParams.detune,
      portamento: this.synthParams.portamento,
    };
  }

  processMIDI(message: MIDIMessage): void {
    if (!this.enabled) return;

    switch (message.type) {
      case 'noteOn':
        if (message.note !== undefined && message.velocity !== undefined) {
          this.noteOn(message.note, message.velocity);
        }
        break;
      
      case 'noteOff':
        if (message.note !== undefined) {
          this.noteOff(message.note);
        }
        break;
      
      case 'controlChange':
        this.handleControlChange(message.controller!, message.value!);
        break;
    }
  }

  private noteOn(note: number, velocity: number): void {
    // Stop existing voice for this note
    this.noteOff(note);

    // Check voice limit
    if (this.voices.size >= this.maxVoices) {
      // Remove oldest voice
      const oldestVoice = Array.from(this.voices.values())
        .sort((a, b) => a.startTime - b.startTime)[0];
      this.stopVoice(oldestVoice);
    }

    // Create new voice
    const voice = this.createVoice(note, velocity);
    this.voices.set(note, voice);
  }

  private noteOff(note: number): void {
    const voice = this.voices.get(note);
    if (voice) {
      this.releaseVoice(voice);
    }
  }

  private createVoice(note: number, velocity: number): Voice {
    const frequency = this.noteToFrequency(note);
    const normalizedVelocity = velocity / 127;

    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = this.synthParams.oscillatorType;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = this.synthParams.detune;

    // Create filter
    const filter = this.audioContext.createBiquadFilter();
    filter.type = this.synthParams.filterType;
    filter.frequency.value = this.synthParams.filterFrequency;
    filter.Q.value = this.synthParams.filterResonance;

    // Create gain node for envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    // Connect audio chain
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.outputNode);

    // Create voice object
    const voice: Voice = {
      id: `voice_${note}_${Date.now()}`,
      note,
      velocity,
      startTime: this.audioContext.currentTime,
      oscillator,
      gainNode,
      filterNode: filter,
      envelope: { ...this.synthParams.envelope },
      isActive: true,
    };

    // Start oscillator
    oscillator.start();

    // Apply ADSR envelope
    this.applyAttack(voice, normalizedVelocity);

    return voice;
  }

  private applyAttack(voice: Voice, velocity: number): void {
    if (!voice.gainNode) return;

    const { attack, decay, sustain } = voice.envelope!;
    const currentTime = this.audioContext.currentTime;
    const peakLevel = this.synthParams.volume * velocity;
    const sustainLevel = peakLevel * sustain;

    // Attack phase
    voice.gainNode.gain.setValueAtTime(0, currentTime);
    voice.gainNode.gain.linearRampToValueAtTime(peakLevel, currentTime + attack);

    // Decay phase
    voice.gainNode.gain.linearRampToValueAtTime(sustainLevel, currentTime + attack + decay);
  }

  private releaseVoice(voice: Voice): void {
    if (!voice.gainNode || !voice.isActive) return;

    const currentTime = this.audioContext.currentTime;
    const { release } = voice.envelope!;

    // Release phase
    voice.gainNode.gain.cancelScheduledValues(currentTime);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, currentTime);
    voice.gainNode.gain.linearRampToValueAtTime(0, currentTime + release);

    // Stop and cleanup after release
    setTimeout(() => {
      this.stopVoice(voice);
    }, release * 1000 + 100);

    voice.isActive = false;
  }

  private stopVoice(voice: Voice): void {
    if (voice.oscillator) {
      try {
        voice.oscillator.stop();
        voice.oscillator.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
    }

    if (voice.gainNode) {
      voice.gainNode.disconnect();
    }

    if (voice.filterNode) {
      voice.filterNode.disconnect();
    }

    this.voices.delete(voice.note);
  }

  private handleControlChange(controller: number, value: number): void {
    const normalizedValue = value / 127;

    switch (controller) {
      case 1: // Modulation wheel
        // Apply vibrato to all active voices
        this.voices.forEach(voice => {
          if (voice.oscillator) {
            voice.oscillator.detune.value = this.synthParams.detune + (normalizedValue * 50);
          }
        });
        break;
      
      case 7: // Volume
        this.synthParams.volume = normalizedValue;
        this.outputNode.gain.value = normalizedValue;
        break;
      
      case 74: // Filter cutoff
        this.synthParams.filterFrequency = 200 + (normalizedValue * 8000);
        this.voices.forEach(voice => {
          if (voice.filterNode) {
            voice.filterNode.frequency.value = this.synthParams.filterFrequency;
          }
        });
        break;
      
      case 71: // Filter resonance
        this.synthParams.filterResonance = 0.1 + (normalizedValue * 30);
        this.voices.forEach(voice => {
          if (voice.filterNode) {
            voice.filterNode.Q.value = this.synthParams.filterResonance;
          }
        });
        break;
    }

    this.updateParameters();
  }

  private noteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  updateParameter(parameter: string, value: number): void {
    switch (parameter) {
      case 'oscillatorType':
        const types: OscillatorType[] = ['sawtooth', 'triangle', 'square', 'sine'];
        this.synthParams.oscillatorType = types[Math.floor(value * (types.length - 1))];
        break;
      
      case 'filterFrequency':
        this.synthParams.filterFrequency = 200 + (value * 8000);
        break;
      
      case 'filterResonance':
        this.synthParams.filterResonance = 0.1 + (value * 30);
        break;
      
      case 'attack':
        this.synthParams.envelope.attack = value * 2;
        break;
      
      case 'decay':
        this.synthParams.envelope.decay = value * 2;
        break;
      
      case 'sustain':
        this.synthParams.envelope.sustain = value;
        break;
      
      case 'release':
        this.synthParams.envelope.release = value * 3;
        break;
      
      case 'volume':
        this.synthParams.volume = value;
        this.outputNode.gain.value = value;
        break;
      
      case 'detune':
        this.synthParams.detune = (value - 0.5) * 100;
        break;
    }

    this.updateParameters();
  }

  loadPreset(presetId: string): void {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;

    Object.entries(preset.parameters).forEach(([param, value]) => {
      this.updateParameter(param, value);
    });

    this.currentPreset = presetId;
  }

  getOutputNode(): AudioNode {
    return this.outputNode;
  }

  dispose(): void {
    // Stop all voices
    this.voices.forEach(voice => this.stopVoice(voice));
    this.voices.clear();

    // Disconnect output
    this.outputNode.disconnect();
  }
}

export class VirtualInstrumentEngine {
  private audioContext: AudioContext;
  private instruments: Map<string, VirtualInstrument> = new Map();
  private outputNode: GainNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.outputNode = audioContext.createGain();
    this.outputNode.gain.value = 1.0;
  }

  createInstrument(type: 'synthesizer' | 'sampler' | 'drum_machine', name: string): string {
    const id = `instrument_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let instrument: VirtualInstrument;

    switch (type) {
      case 'synthesizer':
        instrument = new SynthesizerInstrument(this.audioContext, id, name);
        break;
      
      default:
        throw new Error(`Instrument type ${type} not implemented yet`);
    }

    // Connect instrument to output
    (instrument as any).getOutputNode().connect(this.outputNode);

    this.instruments.set(id, instrument);
    return id;
  }

  removeInstrument(instrumentId: string): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      (instrument as any).dispose();
      this.instruments.delete(instrumentId);
    }
  }

  getInstrument(instrumentId: string): VirtualInstrument | undefined {
    return this.instruments.get(instrumentId);
  }

  getInstruments(): VirtualInstrument[] {
    return Array.from(this.instruments.values());
  }

  processMIDI(instrumentId: string, message: MIDIMessage): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      (instrument as any).processMIDI(message);
    }
  }

  updateInstrumentParameter(instrumentId: string, parameter: string, value: number): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      (instrument as any).updateParameter(parameter, value);
    }
  }

  loadInstrumentPreset(instrumentId: string, presetId: string): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      (instrument as any).loadPreset(presetId);
    }
  }

  getOutputNode(): AudioNode {
    return this.outputNode;
  }

  dispose(): void {
    this.instruments.forEach(instrument => {
      (instrument as any).dispose();
    });
    this.instruments.clear();
    this.outputNode.disconnect();
  }
}
