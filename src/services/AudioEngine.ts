import {
  AudioChannel,
  AudioEngineConfig,
  AudioEngineEvent,
  AudioLevel,
  MasterSection,
  AudioAnalyzer
} from '@/types/audio';
import { audioDeviceManager } from './AudioDeviceManager';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private channels: Map<string, ChannelProcessor> = new Map();
  private eventListeners: ((event: AudioEngineEvent) => void)[] = [];
  private isInitialized = false;
  private animationFrameId: number | null = null;

  constructor(private config: AudioEngineConfig) {}

  async initialize(): Promise<void> {
    try {
      // Initialize audio device manager
      await audioDeviceManager.getAvailableDevices();

      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latency,
      });

      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);

      // Create analyzer for master output
      this.analyzerNode = this.audioContext.createAnalyser();
      this.analyzerNode.fftSize = 2048;
      this.masterGainNode.connect(this.analyzerNode);

      this.isInitialized = true;
      this.startLevelMonitoring();

      console.log('Audio Engine initialized successfully');
    } catch (error) {
      this.emitEvent({ type: 'ERROR', message: `Failed to initialize audio engine: ${error instanceof Error ? error.message : 'Unknown error'}` });
      throw error;
    }
  }

  async createChannel(channel: AudioChannel): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) {
      throw new Error('Audio engine not initialized');
    }

    const processor = new ChannelProcessor(this.audioContext, channel);
    await processor.initialize();
    processor.connect(this.masterGainNode);
    
    this.channels.set(channel.id, processor);
  }

  updateChannel(channelId: string, updates: Partial<AudioChannel>): void {
    const processor = this.channels.get(channelId);
    if (processor) {
      processor.updateSettings(updates);
    }
  }

  removeChannel(channelId: string): void {
    const processor = this.channels.get(channelId);
    if (processor) {
      processor.disconnect();
      this.channels.delete(channelId);
    }
  }

  setMasterGain(gain: number): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.setValueAtTime(gain, this.audioContext!.currentTime);
    }
  }

  getMasterLevel(): AudioLevel {
    if (!this.analyzerNode) {
      return { peak: 0, rms: 0, clipping: false };
    }

    const dataArray = new Uint8Array(this.analyzerNode.frequencyBinCount);
    this.analyzerNode.getByteTimeDomainData(dataArray);

    let peak = 0;
    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const sample = (dataArray[i] - 128) / 128;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
      sum += sample * sample;
    }

    const rms = Math.sqrt(sum / dataArray.length);
    const clipping = peak >= 0.99;

    return { peak, rms, clipping };
  }

  getChannelLevel(channelId: string): AudioLevel {
    const processor = this.channels.get(channelId);
    return processor ? processor.getLevel() : { peak: 0, rms: 0, clipping: false };
  }

  async loadAudioFile(filePath: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      this.emitEvent({ type: 'ERROR', message: `Failed to load audio file: ${error instanceof Error ? error.message : 'Unknown error'}` });
      throw error;
    }
  }

  async connectMicrophoneInput(channelId: string, deviceId?: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    try {
      const stream = await audioDeviceManager.getInputStream(deviceId);
      const processor = this.channels.get(channelId);

      if (processor) {
        processor.connectInputStream(stream);
        this.emitEvent({
          type: 'DEVICE_CONNECTED',
          device: audioDeviceManager.getDeviceById(deviceId || 'default') || {
            id: 'default',
            name: 'Default Microphone',
            type: 'input',
            channelCount: 2,
            sampleRate: 44100,
          }
        });
      }
    } catch (error) {
      this.emitEvent({ type: 'ERROR', message: `Failed to connect microphone: ${error instanceof Error ? error.message : 'Unknown error'}` });
      throw error;
    }
  }

  async playAudioBuffer(channelId: string, buffer: AudioBuffer, loop: boolean = false): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio engine not initialized');
    }

    const processor = this.channels.get(channelId);
    if (processor) {
      processor.playAudioBuffer(buffer, loop);
    }
  }

  stopChannel(channelId: string): void {
    const processor = this.channels.get(channelId);
    if (processor) {
      processor.stop();
    }
  }

  getAvailableInputDevices() {
    return audioDeviceManager.getInputDevices();
  }

  getAvailableOutputDevices() {
    return audioDeviceManager.getOutputDevices();
  }

  addEventListener(listener: (event: AudioEngineEvent) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: AudioEngineEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private emitEvent(event: AudioEngineEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  private startLevelMonitoring(): void {
    const updateLevels = () => {
      // Update master level
      const masterLevel = this.getMasterLevel();
      this.emitEvent({ type: 'LEVEL_UPDATE', channelId: 'master', level: masterLevel });

      if (masterLevel.clipping) {
        this.emitEvent({ type: 'CLIPPING_DETECTED', channelId: 'master' });
      }

      // Update channel levels
      this.channels.forEach((processor, channelId) => {
        const level = processor.getLevel();
        this.emitEvent({ type: 'LEVEL_UPDATE', channelId, level });

        if (level.clipping) {
          this.emitEvent({ type: 'CLIPPING_DETECTED', channelId });
        }
      });

      this.animationFrameId = requestAnimationFrame(updateLevels);
    };

    updateLevels();
  }

  dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.channels.forEach(processor => processor.disconnect());
    this.channels.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isInitialized = false;
  }
}

class ChannelProcessor {
  private gainNode: GainNode;
  private panNode: StereoPannerNode;
  private eqNodes: { high: BiquadFilterNode; mid: BiquadFilterNode; low: BiquadFilterNode };
  private analyzerNode: AnalyserNode;
  private sourceNode: AudioBufferSourceNode | MediaStreamAudioSourceNode | null = null;
  private inputStream: MediaStream | null = null;
  private isPlaying: boolean = false;

  constructor(
    private audioContext: AudioContext,
    private channel: AudioChannel
  ) {
    this.gainNode = audioContext.createGain();
    this.panNode = audioContext.createStereoPanner();
    this.analyzerNode = audioContext.createAnalyser();
    
    // Create EQ nodes
    this.eqNodes = {
      high: audioContext.createBiquadFilter(),
      mid: audioContext.createBiquadFilter(),
      low: audioContext.createBiquadFilter(),
    };

    this.setupEQ();
    this.connectNodes();
  }

  async initialize(): Promise<void> {
    this.updateSettings(this.channel);
  }

  private setupEQ(): void {
    this.eqNodes.high.type = 'highshelf';
    this.eqNodes.high.frequency.value = this.channel.eq.highFreq;
    
    this.eqNodes.mid.type = 'peaking';
    this.eqNodes.mid.frequency.value = this.channel.eq.midFreq;
    this.eqNodes.mid.Q.value = 1;
    
    this.eqNodes.low.type = 'lowshelf';
    this.eqNodes.low.frequency.value = this.channel.eq.lowFreq;
  }

  private connectNodes(): void {
    // Connect EQ chain
    this.eqNodes.high.connect(this.eqNodes.mid);
    this.eqNodes.mid.connect(this.eqNodes.low);
    this.eqNodes.low.connect(this.panNode);
    
    // Connect to gain and analyzer
    this.panNode.connect(this.gainNode);
    this.gainNode.connect(this.analyzerNode);
  }

  updateSettings(updates: Partial<AudioChannel>): void {
    if (updates.gain !== undefined) {
      this.gainNode.gain.setValueAtTime(updates.gain, this.audioContext.currentTime);
    }

    if (updates.pan !== undefined) {
      this.panNode.pan.setValueAtTime(updates.pan, this.audioContext.currentTime);
    }

    if (updates.muted !== undefined) {
      this.gainNode.gain.setValueAtTime(
        updates.muted ? 0 : this.channel.gain,
        this.audioContext.currentTime
      );
    }

    if (updates.eq) {
      this.updateEQ(updates.eq);
    }

    // Update channel reference
    Object.assign(this.channel, updates);
  }

  private updateEQ(eq: Partial<typeof this.channel.eq>): void {
    if (eq.highGain !== undefined) {
      this.eqNodes.high.gain.setValueAtTime(eq.highGain, this.audioContext.currentTime);
    }
    if (eq.midGain !== undefined) {
      this.eqNodes.mid.gain.setValueAtTime(eq.midGain, this.audioContext.currentTime);
    }
    if (eq.lowGain !== undefined) {
      this.eqNodes.low.gain.setValueAtTime(eq.lowGain, this.audioContext.currentTime);
    }
  }

  connect(destination: AudioNode): void {
    this.analyzerNode.connect(destination);
  }

  connectInputStream(stream: MediaStream): void {
    // Disconnect existing source
    this.disconnect();

    // Create media stream source
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.inputStream = stream;

    // Connect to audio chain
    this.sourceNode.connect(this.eqNodes.high);
    this.isPlaying = true;
  }

  playAudioBuffer(buffer: AudioBuffer, loop: boolean = false): void {
    // Disconnect existing source
    this.disconnect();

    // Create buffer source
    const bufferSource = this.audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.loop = loop;

    // Connect to audio chain
    bufferSource.connect(this.eqNodes.high);
    this.sourceNode = bufferSource;

    // Start playback
    bufferSource.start();
    this.isPlaying = true;

    // Handle end of playback
    bufferSource.onended = () => {
      this.isPlaying = false;
    };
  }

  stop(): void {
    if (this.sourceNode) {
      if (this.sourceNode instanceof AudioBufferSourceNode) {
        try {
          this.sourceNode.stop();
        } catch (error) {
          // Source might already be stopped
        }
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.inputStream) {
      this.inputStream.getTracks().forEach(track => track.stop());
      this.inputStream = null;
    }

    this.isPlaying = false;
  }

  disconnect(): void {
    this.stop();
    this.analyzerNode.disconnect();
  }

  isChannelPlaying(): boolean {
    return this.isPlaying;
  }

  getLevel(): AudioLevel {
    const dataArray = new Uint8Array(this.analyzerNode.frequencyBinCount);
    this.analyzerNode.getByteTimeDomainData(dataArray);

    let peak = 0;
    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const sample = (dataArray[i] - 128) / 128;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
      sum += sample * sample;
    }

    const rms = Math.sqrt(sum / dataArray.length);
    const clipping = peak >= 0.99;

    return { peak, rms, clipping };
  }
}
