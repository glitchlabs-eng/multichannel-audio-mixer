export interface RecordingSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration: number;
  sampleRate: number;
  channels: number;
  tracks: RecordingTrack[];
  status: 'recording' | 'stopped' | 'paused';
}

export interface RecordingTrack {
  id: string;
  channelId: string;
  name: string;
  audioData: Float32Array[];
  startTime: number;
  endTime?: number;
  muted: boolean;
  solo: boolean;
  gain: number;
}

export interface RecordingConfig {
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  channels: 1 | 2;
  format: 'wav' | 'mp3' | 'flac' | 'aac';
  quality: 'low' | 'medium' | 'high' | 'lossless';
}

export interface ExportOptions {
  format: 'wav' | 'mp3' | 'flac' | 'aac';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  bitRate?: number; // For MP3/AAC
  sampleRate?: number;
  channels?: 1 | 2;
  normalize?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  trimStart?: number;
  trimEnd?: number;
}

export class AudioRecordingEngine {
  private audioContext: AudioContext;
  private sessions: Map<string, RecordingSession> = new Map();
  private activeSession: RecordingSession | null = null;
  private recordingNodes: Map<string, ScriptProcessorNode> = new Map();
  private isRecording = false;
  private recordingStartTime = 0;
  private recordingData: Map<string, Float32Array[]> = new Map();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  createSession(name: string, config: RecordingConfig): RecordingSession {
    const session: RecordingSession = {
      id: `session_${Date.now()}`,
      name,
      startTime: Date.now(),
      duration: 0,
      sampleRate: config.sampleRate,
      channels: config.channels,
      tracks: [],
      status: 'stopped',
    };

    this.sessions.set(session.id, session);
    return session;
  }

  startRecording(sessionId: string, channelIds: string[]): void {
    const session = this.sessions.get(sessionId);
    if (!session || this.isRecording) return;

    this.activeSession = session;
    this.isRecording = true;
    this.recordingStartTime = this.audioContext.currentTime;
    session.status = 'recording';
    session.startTime = Date.now();

    // Initialize recording data for each channel
    channelIds.forEach(channelId => {
      this.recordingData.set(channelId, []);
      this.setupChannelRecording(channelId);
    });

    console.log(`Recording started for session: ${session.name}`);
  }

  stopRecording(): RecordingSession | null {
    if (!this.isRecording || !this.activeSession) return null;

    this.isRecording = false;
    const session = this.activeSession;
    session.status = 'stopped';
    session.endTime = Date.now();
    session.duration = (session.endTime - session.startTime) / 1000;

    // Process recorded data into tracks
    this.recordingData.forEach((audioData, channelId) => {
      if (audioData.length > 0) {
        const track: RecordingTrack = {
          id: `track_${channelId}_${Date.now()}`,
          channelId,
          name: `Track ${channelId}`,
          audioData,
          startTime: session.startTime,
          endTime: session.endTime,
          muted: false,
          solo: false,
          gain: 1.0,
        };
        session.tracks.push(track);
      }
    });

    // Cleanup recording nodes
    this.recordingNodes.forEach(node => {
      node.disconnect();
    });
    this.recordingNodes.clear();
    this.recordingData.clear();

    console.log(`Recording stopped. Duration: ${session.duration.toFixed(2)}s`);
    this.activeSession = null;
    return session;
  }

  pauseRecording(): void {
    if (this.isRecording && this.activeSession) {
      this.activeSession.status = 'paused';
      // Note: For simplicity, we'll implement pause as stop for now
      // A full implementation would maintain recording state
    }
  }

  resumeRecording(): void {
    if (this.activeSession && this.activeSession.status === 'paused') {
      this.activeSession.status = 'recording';
    }
  }

  private setupChannelRecording(channelId: string): void {
    // Create a script processor node for recording
    const bufferSize = 4096;
    const recordingNode = this.audioContext.createScriptProcessor(bufferSize, 2, 2);
    
    recordingNode.onaudioprocess = (event) => {
      if (!this.isRecording) return;

      const inputBuffer = event.inputBuffer;
      const channelData = this.recordingData.get(channelId);
      
      if (channelData) {
        // Record both channels (stereo)
        for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
          const input = inputBuffer.getChannelData(channel);
          const recordingArray = new Float32Array(input.length);
          recordingArray.set(input);
          channelData.push(recordingArray);
        }
      }
    };

    this.recordingNodes.set(channelId, recordingNode);
  }

  connectChannelForRecording(channelId: string, sourceNode: AudioNode): void {
    const recordingNode = this.recordingNodes.get(channelId);
    if (recordingNode) {
      sourceNode.connect(recordingNode);
      recordingNode.connect(this.audioContext.destination);
    }
  }

  getSessions(): RecordingSession[] {
    return Array.from(this.sessions.values());
  }

  getSession(sessionId: string): RecordingSession | undefined {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  async exportSession(sessionId: string, options: ExportOptions): Promise<Blob> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Mix down all tracks
    const mixedAudio = this.mixTracks(session.tracks, options);
    
    // Apply post-processing
    const processedAudio = this.applyPostProcessing(mixedAudio, options);
    
    // Export to specified format
    return this.encodeAudio(processedAudio, session.sampleRate, options);
  }

  async exportTrack(sessionId: string, trackId: string, options: ExportOptions): Promise<Blob> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const track = session.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    // Convert track data to audio buffer
    const audioData = this.combineTrackData(track.audioData);
    
    // Apply post-processing
    const processedAudio = this.applyPostProcessing(audioData, options);
    
    // Export to specified format
    return this.encodeAudio(processedAudio, session.sampleRate, options);
  }

  private mixTracks(tracks: RecordingTrack[], options: ExportOptions): Float32Array {
    if (tracks.length === 0) {
      return new Float32Array(0);
    }

    // Find the longest track to determine output length
    let maxLength = 0;
    tracks.forEach(track => {
      if (!track.muted) {
        const trackLength = track.audioData.reduce((sum, chunk) => sum + chunk.length, 0);
        maxLength = Math.max(maxLength, trackLength);
      }
    });

    const mixedAudio = new Float32Array(maxLength);
    
    // Mix all non-muted tracks
    tracks.forEach(track => {
      if (track.muted) return;

      let offset = 0;
      track.audioData.forEach(chunk => {
        for (let i = 0; i < chunk.length && offset + i < maxLength; i++) {
          mixedAudio[offset + i] += chunk[i] * track.gain;
        }
        offset += chunk.length;
      });
    });

    return mixedAudio;
  }

  private combineTrackData(audioData: Float32Array[]): Float32Array {
    const totalLength = audioData.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    
    let offset = 0;
    audioData.forEach(chunk => {
      combined.set(chunk, offset);
      offset += chunk.length;
    });
    
    return combined;
  }

  private applyPostProcessing(audioData: Float32Array, options: ExportOptions): Float32Array {
    let processed = new Float32Array(audioData);

    // Apply trimming
    if (options.trimStart || options.trimEnd) {
      const startSample = Math.floor((options.trimStart || 0) * (options.sampleRate || this.audioContext.sampleRate));
      const endSample = options.trimEnd 
        ? Math.floor(options.trimEnd * (options.sampleRate || this.audioContext.sampleRate))
        : processed.length;
      
      processed = processed.slice(startSample, endSample);
    }

    // Apply fade in
    if (options.fadeIn && options.fadeIn > 0) {
      const fadeSamples = Math.floor(options.fadeIn * (options.sampleRate || this.audioContext.sampleRate));
      for (let i = 0; i < Math.min(fadeSamples, processed.length); i++) {
        processed[i] *= i / fadeSamples;
      }
    }

    // Apply fade out
    if (options.fadeOut && options.fadeOut > 0) {
      const fadeSamples = Math.floor(options.fadeOut * (options.sampleRate || this.audioContext.sampleRate));
      const startFade = Math.max(0, processed.length - fadeSamples);
      for (let i = startFade; i < processed.length; i++) {
        processed[i] *= (processed.length - i) / fadeSamples;
      }
    }

    // Apply normalization
    if (options.normalize) {
      const peak = Math.max(...processed.map(Math.abs));
      if (peak > 0) {
        const normalizeGain = 0.95 / peak; // Leave some headroom
        for (let i = 0; i < processed.length; i++) {
          processed[i] *= normalizeGain;
        }
      }
    }

    return processed;
  }

  private async encodeAudio(audioData: Float32Array, sampleRate: number, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'wav':
        return this.encodeWAV(audioData, sampleRate, options);
      case 'mp3':
        return this.encodeMP3(audioData, sampleRate, options);
      case 'flac':
        return this.encodeFLAC(audioData, sampleRate, options);
      case 'aac':
        return this.encodeAAC(audioData, sampleRate, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private encodeWAV(audioData: Float32Array, sampleRate: number, options: ExportOptions): Blob {
    const channels = options.channels || 2;
    const bitDepth = 16; // For simplicity, always use 16-bit for WAV
    const bytesPerSample = bitDepth / 8;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;
    const fileSize = 36 + dataSize;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private async encodeMP3(audioData: Float32Array, sampleRate: number, options: ExportOptions): Promise<Blob> {
    // For now, return WAV format as MP3 encoding requires additional libraries
    // In a full implementation, you would use libraries like lamejs
    console.warn('MP3 encoding not implemented, falling back to WAV');
    return this.encodeWAV(audioData, sampleRate, options);
  }

  private async encodeFLAC(audioData: Float32Array, sampleRate: number, options: ExportOptions): Promise<Blob> {
    // For now, return WAV format as FLAC encoding requires additional libraries
    console.warn('FLAC encoding not implemented, falling back to WAV');
    return this.encodeWAV(audioData, sampleRate, options);
  }

  private async encodeAAC(audioData: Float32Array, sampleRate: number, options: ExportOptions): Promise<Blob> {
    // For now, return WAV format as AAC encoding requires additional libraries
    console.warn('AAC encoding not implemented, falling back to WAV');
    return this.encodeWAV(audioData, sampleRate, options);
  }

  getRecordingStatus(): { isRecording: boolean; session: RecordingSession | null; duration: number } {
    return {
      isRecording: this.isRecording,
      session: this.activeSession,
      duration: this.activeSession ? (Date.now() - this.activeSession.startTime) / 1000 : 0,
    };
  }

  dispose(): void {
    this.stopRecording();
    this.sessions.clear();
    this.recordingNodes.clear();
    this.recordingData.clear();
  }
}
