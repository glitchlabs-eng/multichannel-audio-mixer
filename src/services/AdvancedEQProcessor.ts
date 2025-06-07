export interface EQBand {
  id: string;
  type: 'highpass' | 'lowpass' | 'bandpass' | 'lowshelf' | 'highshelf' | 'peaking' | 'notch';
  frequency: number;
  gain: number;
  q: number;
  enabled: boolean;
}

export interface EQAnalysisData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
  phases: Float32Array;
}

export class AdvancedEQProcessor {
  private audioContext: AudioContext;
  private bands: Map<string, BiquadFilterNode> = new Map();
  private analyzerNode: AnalyserNode;
  private inputGain: GainNode;
  private outputGain: GainNode;
  private bypassGain: GainNode;
  private isBypassed = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    // Create nodes
    this.inputGain = audioContext.createGain();
    this.outputGain = audioContext.createGain();
    this.bypassGain = audioContext.createGain();
    this.analyzerNode = audioContext.createAnalyser();
    
    // Configure analyzer
    this.analyzerNode.fftSize = 2048;
    this.analyzerNode.smoothingTimeConstant = 0.8;
    
    this.setupRouting();
  }

  addBand(band: EQBand): void {
    const filterNode = this.audioContext.createBiquadFilter();
    this.updateBandParameters(filterNode, band);
    
    // Insert the new band in the chain
    this.rebuildFilterChain();
    this.bands.set(band.id, filterNode);
  }

  updateBand(bandId: string, updates: Partial<EQBand>): void {
    const filterNode = this.bands.get(bandId);
    if (!filterNode) return;

    const currentTime = this.audioContext.currentTime;
    
    if (updates.frequency !== undefined) {
      filterNode.frequency.setValueAtTime(updates.frequency, currentTime);
    }
    
    if (updates.gain !== undefined) {
      filterNode.gain.setValueAtTime(updates.gain, currentTime);
    }
    
    if (updates.q !== undefined) {
      filterNode.Q.setValueAtTime(updates.q, currentTime);
    }
    
    if (updates.type !== undefined) {
      filterNode.type = updates.type;
    }
  }

  removeBand(bandId: string): void {
    const filterNode = this.bands.get(bandId);
    if (filterNode) {
      filterNode.disconnect();
      this.bands.delete(bandId);
      this.rebuildFilterChain();
    }
  }

  setBypassed(bypassed: boolean): void {
    this.isBypassed = bypassed;
    const currentTime = this.audioContext.currentTime;
    
    if (bypassed) {
      this.outputGain.gain.setValueAtTime(0, currentTime);
      this.bypassGain.gain.setValueAtTime(1, currentTime);
    } else {
      this.outputGain.gain.setValueAtTime(1, currentTime);
      this.bypassGain.gain.setValueAtTime(0, currentTime);
    }
  }

  getFrequencyResponse(frequencies: Float32Array): EQAnalysisData {
    const magnitudes = new Float32Array(frequencies.length);
    const phases = new Float32Array(frequencies.length);
    
    // Calculate combined frequency response of all bands
    for (let i = 0; i < frequencies.length; i++) {
      let magnitude = 1;
      let phase = 0;
      
      this.bands.forEach(filterNode => {
        const freq = frequencies[i];
        const response = this.calculateFilterResponse(filterNode, freq);
        magnitude *= response.magnitude;
        phase += response.phase;
      });
      
      magnitudes[i] = 20 * Math.log10(magnitude); // Convert to dB
      phases[i] = phase;
    }
    
    return { frequencies, magnitudes, phases };
  }

  getSpectrumData(): { frequencies: Float32Array; magnitudes: Float32Array } {
    const bufferLength = this.analyzerNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyzerNode.getFloatFrequencyData(dataArray);
    
    // Generate frequency array
    const frequencies = new Float32Array(bufferLength);
    const nyquist = this.audioContext.sampleRate / 2;
    
    for (let i = 0; i < bufferLength; i++) {
      frequencies[i] = (i / bufferLength) * nyquist;
    }
    
    return { frequencies, magnitudes: dataArray };
  }

  createPreset(name: string): EQBand[] {
    const presets: Record<string, EQBand[]> = {
      'vocal': [
        {
          id: 'vocal-hp',
          type: 'highpass',
          frequency: 80,
          gain: 0,
          q: 0.7,
          enabled: true,
        },
        {
          id: 'vocal-presence',
          type: 'peaking',
          frequency: 2500,
          gain: 3,
          q: 1.5,
          enabled: true,
        },
        {
          id: 'vocal-air',
          type: 'highshelf',
          frequency: 10000,
          gain: 2,
          q: 0.7,
          enabled: true,
        },
      ],
      'bass': [
        {
          id: 'bass-sub',
          type: 'lowshelf',
          frequency: 60,
          gain: 2,
          q: 0.7,
          enabled: true,
        },
        {
          id: 'bass-punch',
          type: 'peaking',
          frequency: 100,
          gain: 3,
          q: 1.2,
          enabled: true,
        },
        {
          id: 'bass-hp',
          type: 'highpass',
          frequency: 40,
          gain: 0,
          q: 0.7,
          enabled: true,
        },
      ],
      'drums': [
        {
          id: 'drums-kick',
          type: 'peaking',
          frequency: 60,
          gain: 3,
          q: 1.0,
          enabled: true,
        },
        {
          id: 'drums-snare',
          type: 'peaking',
          frequency: 200,
          gain: 2,
          q: 1.5,
          enabled: true,
        },
        {
          id: 'drums-presence',
          type: 'peaking',
          frequency: 5000,
          gain: 2,
          q: 1.2,
          enabled: true,
        },
        {
          id: 'drums-air',
          type: 'highshelf',
          frequency: 12000,
          gain: 3,
          q: 0.7,
          enabled: true,
        },
      ],
    };
    
    return presets[name] || [];
  }

  process(input: AudioNode): AudioNode {
    input.connect(this.inputGain);
    return this.outputGain;
  }

  private setupRouting(): void {
    // Bypass path
    this.inputGain.connect(this.bypassGain);
    this.bypassGain.connect(this.outputGain);
    
    // Set initial bypass state
    this.bypassGain.gain.value = 0;
    
    // Connect analyzer to output for spectrum analysis
    this.outputGain.connect(this.analyzerNode);
  }

  private rebuildFilterChain(): void {
    // Disconnect all existing connections
    this.bands.forEach(filterNode => filterNode.disconnect());
    
    // Sort bands by frequency for optimal processing order
    const sortedBands = Array.from(this.bands.entries()).sort((a, b) => {
      return a[1].frequency.value - b[1].frequency.value;
    });
    
    if (sortedBands.length === 0) {
      this.inputGain.connect(this.outputGain);
      return;
    }
    
    // Disconnect direct input to output
    try {
      this.inputGain.disconnect(this.outputGain);
    } catch (e) {
      // Already disconnected
    }
    
    // Connect input to first filter
    this.inputGain.connect(sortedBands[0][1]);
    
    // Chain filters together
    for (let i = 0; i < sortedBands.length - 1; i++) {
      sortedBands[i][1].connect(sortedBands[i + 1][1]);
    }
    
    // Connect last filter to output
    sortedBands[sortedBands.length - 1][1].connect(this.outputGain);
  }

  private updateBandParameters(filterNode: BiquadFilterNode, band: EQBand): void {
    const currentTime = this.audioContext.currentTime;
    
    filterNode.type = band.type;
    filterNode.frequency.setValueAtTime(band.frequency, currentTime);
    filterNode.gain.setValueAtTime(band.gain, currentTime);
    filterNode.Q.setValueAtTime(band.q, currentTime);
  }

  private calculateFilterResponse(filterNode: BiquadFilterNode, frequency: number): { magnitude: number; phase: number } {
    // Simplified frequency response calculation
    // In a real implementation, you'd use the actual filter coefficients
    const freq = filterNode.frequency.value;
    const gain = filterNode.gain.value;
    const q = filterNode.Q.value;
    
    const omega = (2 * Math.PI * frequency) / this.audioContext.sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * q);
    
    // This is a simplified calculation - actual implementation would be more complex
    let magnitude = 1;
    let phase = 0;
    
    switch (filterNode.type) {
      case 'peaking':
        const A = Math.pow(10, gain / 40);
        if (Math.abs(frequency - freq) < freq * 0.1) {
          magnitude = A;
        }
        break;
      case 'highshelf':
      case 'lowshelf':
        magnitude = Math.pow(10, gain / 20);
        break;
    }
    
    return { magnitude, phase };
  }

  dispose(): void {
    this.bands.forEach(filterNode => filterNode.disconnect());
    this.bands.clear();
    this.inputGain.disconnect();
    this.outputGain.disconnect();
    this.bypassGain.disconnect();
    this.analyzerNode.disconnect();
  }
}
