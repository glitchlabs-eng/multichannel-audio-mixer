export interface AudioFileInfo {
  name: string;
  path: string;
  duration: number;
  sampleRate: number;
  channels: number;
  size: number;
  format: string;
}

export class AudioFileLoader {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async loadFromFile(file: File): Promise<{ buffer: AudioBuffer; info: AudioFileInfo }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const info: AudioFileInfo = {
        name: file.name,
        path: file.name, // For File objects, we use the name as path
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        size: file.size,
        format: this.getFileFormat(file.name),
      };

      return { buffer: audioBuffer, info };
    } catch (error) {
      throw new Error(`Failed to load audio file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadFromPath(filePath: string): Promise<{ buffer: AudioBuffer; info: AudioFileInfo }> {
    try {
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const info: AudioFileInfo = {
        name: this.getFileName(filePath),
        path: filePath,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        size: arrayBuffer.byteLength,
        format: this.getFileFormat(filePath),
      };

      return { buffer: audioBuffer, info };
    } catch (error) {
      throw new Error(`Failed to load audio file from "${filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadMultipleFiles(files: FileList | File[]): Promise<Array<{ buffer: AudioBuffer; info: AudioFileInfo }>> {
    const results: Array<{ buffer: AudioBuffer; info: AudioFileInfo }> = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const result = await this.loadFromFile(file);
        results.push(result);
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`Failed to load any audio files:\n${errors.join('\n')}`);
    }

    if (errors.length > 0) {
      console.warn(`Some files failed to load:\n${errors.join('\n')}`);
    }

    return results;
  }

  validateAudioFile(file: File): { valid: boolean; error?: string } {
    const supportedFormats = ['wav', 'mp3', 'flac', 'aac', 'ogg', 'm4a', 'webm'];
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (100MB)`,
      };
    }

    // Check file format
    const format = this.getFileFormat(file.name).toLowerCase();
    if (!supportedFormats.includes(format)) {
      return {
        valid: false,
        error: `Unsupported file format: ${format}. Supported formats: ${supportedFormats.join(', ')}`,
      };
    }

    // Check MIME type if available
    if (file.type && !file.type.startsWith('audio/')) {
      return {
        valid: false,
        error: `Invalid MIME type: ${file.type}. Expected audio file.`,
      };
    }

    return { valid: true };
  }

  getSupportedFormats(): string[] {
    return ['wav', 'mp3', 'flac', 'aac', 'ogg', 'm4a', 'webm'];
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  private getFileFormat(fileName: string): string {
    const extension = fileName.split('.').pop();
    return extension ? extension.toLowerCase() : 'unknown';
  }

  // Create a visual waveform representation (simplified)
  generateWaveformData(audioBuffer: AudioBuffer, width: number = 800): number[] {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const samplesPerPixel = Math.floor(channelData.length / width);
    const waveformData: number[] = [];

    for (let i = 0; i < width; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);
      
      let max = 0;
      for (let j = start; j < end; j++) {
        max = Math.max(max, Math.abs(channelData[j]));
      }
      
      waveformData.push(max);
    }

    return waveformData;
  }

  // Analyze audio content
  analyzeAudioBuffer(audioBuffer: AudioBuffer): {
    peakLevel: number;
    rmsLevel: number;
    dynamicRange: number;
    silentSamples: number;
  } {
    const channelData = audioBuffer.getChannelData(0);
    let peak = 0;
    let sum = 0;
    let silentSamples = 0;
    const silenceThreshold = 0.001;

    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      peak = Math.max(peak, sample);
      sum += sample * sample;
      
      if (sample < silenceThreshold) {
        silentSamples++;
      }
    }

    const rms = Math.sqrt(sum / channelData.length);
    const dynamicRange = peak > 0 ? 20 * Math.log10(peak / (rms || 0.001)) : 0;

    return {
      peakLevel: peak,
      rmsLevel: rms,
      dynamicRange,
      silentSamples,
    };
  }
}
