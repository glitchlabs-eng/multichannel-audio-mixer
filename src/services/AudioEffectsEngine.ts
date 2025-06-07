import { Effect } from '@/types/audio';

export interface EffectProcessor {
  id: string;
  type: string;
  enabled: boolean;
  process(input: AudioNode): AudioNode;
  updateParameters(parameters: Record<string, number>): void;
  dispose(): void;
}

export class ReverbProcessor implements EffectProcessor {
  id: string;
  type = 'reverb';
  enabled = true;
  
  private audioContext: AudioContext;
  private convolver: ConvolverNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private inputGain: GainNode;
  private outputGain: GainNode;
  private parameters: Record<string, number>;

  constructor(audioContext: AudioContext, id: string) {
    this.audioContext = audioContext;
    this.id = id;
    
    // Create nodes
    this.convolver = audioContext.createConvolver();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    
    // Default parameters
    this.parameters = {
      roomSize: 0.5,
      wetLevel: 0.3,
      dryLevel: 0.7,
      damping: 0.5,
    };
    
    this.setupRouting();
    this.generateImpulseResponse();
    this.updateParameters(this.parameters);
  }

  process(input: AudioNode): AudioNode {
    input.connect(this.inputGain);
    return this.outputGain;
  }

  updateParameters(parameters: Record<string, number>): void {
    this.parameters = { ...this.parameters, ...parameters };
    
    if (parameters.wetLevel !== undefined) {
      this.wetGain.gain.setValueAtTime(parameters.wetLevel, this.audioContext.currentTime);
    }
    
    if (parameters.dryLevel !== undefined) {
      this.dryGain.gain.setValueAtTime(parameters.dryLevel, this.audioContext.currentTime);
    }
    
    if (parameters.roomSize !== undefined || parameters.damping !== undefined) {
      this.generateImpulseResponse();
    }
  }

  private setupRouting(): void {
    // Dry signal path
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.outputGain);
    
    // Wet signal path
    this.inputGain.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);
  }

  private generateImpulseResponse(): void {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * this.parameters.roomSize * 4; // Up to 4 seconds
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - (i / length), this.parameters.damping * 10);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    this.convolver.buffer = impulse;
  }

  dispose(): void {
    this.convolver.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.inputGain.disconnect();
    this.outputGain.disconnect();
  }
}

export class DelayProcessor implements EffectProcessor {
  id: string;
  type = 'delay';
  enabled = true;
  
  private audioContext: AudioContext;
  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private inputGain: GainNode;
  private outputGain: GainNode;
  private filterNode: BiquadFilterNode;

  constructor(audioContext: AudioContext, id: string) {
    this.audioContext = audioContext;
    this.id = id;
    
    // Create nodes
    this.delayNode = audioContext.createDelay(2.0); // Max 2 seconds delay
    this.feedbackGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.filterNode = audioContext.createBiquadFilter();
    
    this.setupRouting();
    this.updateParameters({
      delayTime: 0.25,
      feedback: 0.3,
      wetLevel: 0.3,
      dryLevel: 0.7,
      filterFreq: 2000,
    });
  }

  process(input: AudioNode): AudioNode {
    input.connect(this.inputGain);
    return this.outputGain;
  }

  updateParameters(parameters: Record<string, number>): void {
    const currentTime = this.audioContext.currentTime;
    
    if (parameters.delayTime !== undefined) {
      this.delayNode.delayTime.setValueAtTime(parameters.delayTime, currentTime);
    }
    
    if (parameters.feedback !== undefined) {
      this.feedbackGain.gain.setValueAtTime(parameters.feedback, currentTime);
    }
    
    if (parameters.wetLevel !== undefined) {
      this.wetGain.gain.setValueAtTime(parameters.wetLevel, currentTime);
    }
    
    if (parameters.dryLevel !== undefined) {
      this.dryGain.gain.setValueAtTime(parameters.dryLevel, currentTime);
    }
    
    if (parameters.filterFreq !== undefined) {
      this.filterNode.frequency.setValueAtTime(parameters.filterFreq, currentTime);
    }
  }

  private setupRouting(): void {
    // Dry signal
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.outputGain);
    
    // Wet signal with feedback
    this.inputGain.connect(this.delayNode);
    this.delayNode.connect(this.filterNode);
    this.filterNode.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);
    
    // Feedback loop
    this.filterNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
  }

  dispose(): void {
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.inputGain.disconnect();
    this.outputGain.disconnect();
    this.filterNode.disconnect();
  }
}

export class CompressorProcessor implements EffectProcessor {
  id: string;
  type = 'compressor';
  enabled = true;
  
  private audioContext: AudioContext;
  private compressor: DynamicsCompressorNode;
  private inputGain: GainNode;
  private outputGain: GainNode;

  constructor(audioContext: AudioContext, id: string) {
    this.audioContext = audioContext;
    this.id = id;
    
    this.compressor = audioContext.createDynamicsCompressor();
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    
    this.setupRouting();
    this.updateParameters({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 30,
    });
  }

  process(input: AudioNode): AudioNode {
    input.connect(this.inputGain);
    return this.outputGain;
  }

  updateParameters(parameters: Record<string, number>): void {
    const currentTime = this.audioContext.currentTime;
    
    if (parameters.threshold !== undefined) {
      this.compressor.threshold.setValueAtTime(parameters.threshold, currentTime);
    }
    
    if (parameters.ratio !== undefined) {
      this.compressor.ratio.setValueAtTime(parameters.ratio, currentTime);
    }
    
    if (parameters.attack !== undefined) {
      this.compressor.attack.setValueAtTime(parameters.attack, currentTime);
    }
    
    if (parameters.release !== undefined) {
      this.compressor.release.setValueAtTime(parameters.release, currentTime);
    }
    
    if (parameters.knee !== undefined) {
      this.compressor.knee.setValueAtTime(parameters.knee, currentTime);
    }
  }

  private setupRouting(): void {
    this.inputGain.connect(this.compressor);
    this.compressor.connect(this.outputGain);
  }

  dispose(): void {
    this.compressor.disconnect();
    this.inputGain.disconnect();
    this.outputGain.disconnect();
  }
}

export class DistortionProcessor implements EffectProcessor {
  id: string;
  type = 'distortion';
  enabled = true;
  
  private audioContext: AudioContext;
  private waveshaper: WaveShaperNode;
  private inputGain: GainNode;
  private outputGain: GainNode;
  private filterNode: BiquadFilterNode;

  constructor(audioContext: AudioContext, id: string) {
    this.audioContext = audioContext;
    this.id = id;
    
    this.waveshaper = audioContext.createWaveShaper();
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.filterNode = audioContext.createBiquadFilter();
    
    this.setupRouting();
    this.updateParameters({
      drive: 50,
      tone: 2000,
      level: 0.5,
    });
  }

  process(input: AudioNode): AudioNode {
    input.connect(this.inputGain);
    return this.outputGain;
  }

  updateParameters(parameters: Record<string, number>): void {
    if (parameters.drive !== undefined) {
      this.generateDistortionCurve(parameters.drive);
    }
    
    if (parameters.tone !== undefined) {
      this.filterNode.frequency.setValueAtTime(parameters.tone, this.audioContext.currentTime);
    }
    
    if (parameters.level !== undefined) {
      this.outputGain.gain.setValueAtTime(parameters.level, this.audioContext.currentTime);
    }
  }

  private setupRouting(): void {
    this.inputGain.connect(this.waveshaper);
    this.waveshaper.connect(this.filterNode);
    this.filterNode.connect(this.outputGain);
  }

  private generateDistortionCurve(amount: number): void {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    this.waveshaper.curve = curve;
    this.waveshaper.oversample = '4x';
  }

  dispose(): void {
    this.waveshaper.disconnect();
    this.inputGain.disconnect();
    this.outputGain.disconnect();
    this.filterNode.disconnect();
  }
}

export class AudioEffectsEngine {
  private audioContext: AudioContext;
  private effectProcessors: Map<string, EffectProcessor> = new Map();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  createEffect(type: string, id: string): EffectProcessor {
    let processor: EffectProcessor;
    
    switch (type) {
      case 'reverb':
        processor = new ReverbProcessor(this.audioContext, id);
        break;
      case 'delay':
        processor = new DelayProcessor(this.audioContext, id);
        break;
      case 'compressor':
        processor = new CompressorProcessor(this.audioContext, id);
        break;
      case 'distortion':
        processor = new DistortionProcessor(this.audioContext, id);
        break;
      default:
        throw new Error(`Unknown effect type: ${type}`);
    }
    
    this.effectProcessors.set(id, processor);
    return processor;
  }

  getEffect(id: string): EffectProcessor | undefined {
    return this.effectProcessors.get(id);
  }

  removeEffect(id: string): void {
    const processor = this.effectProcessors.get(id);
    if (processor) {
      processor.dispose();
      this.effectProcessors.delete(id);
    }
  }

  dispose(): void {
    this.effectProcessors.forEach(processor => processor.dispose());
    this.effectProcessors.clear();
  }
}
