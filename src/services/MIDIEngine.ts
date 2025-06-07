export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
  connection: 'open' | 'closed' | 'pending';
}

export interface MIDIMessage {
  type: 'noteOn' | 'noteOff' | 'controlChange' | 'programChange' | 'pitchBend' | 'aftertouch' | 'sysex';
  channel: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  program?: number;
  pitch?: number;
  pressure?: number;
  data?: Uint8Array;
  timestamp: number;
}

export interface MIDIMapping {
  id: string;
  name: string;
  deviceId: string;
  controller: number;
  channel: number;
  targetType: 'channel' | 'effect' | 'master' | 'transport' | 'instrument';
  targetId: string;
  parameter: string;
  minValue: number;
  maxValue: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
  enabled: boolean;
}

export interface MIDILearnSession {
  id: string;
  targetType: string;
  targetId: string;
  parameter: string;
  isActive: boolean;
  timeout?: NodeJS.Timeout;
}

export class MIDIEngine {
  private midiAccess: MIDIAccess | null = null;
  private inputDevices: Map<string, MIDIInput> = new Map();
  private outputDevices: Map<string, MIDIOutput> = new Map();
  private mappings: Map<string, MIDIMapping> = new Map();
  private learnSession: MIDILearnSession | null = null;
  private messageListeners: ((message: MIDIMessage) => void)[] = [];
  private deviceListeners: ((devices: MIDIDevice[]) => void)[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API not supported in this browser');
      }

      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      
      // Set up device change listeners
      this.midiAccess.onstatechange = this.handleStateChange.bind(this);
      
      // Initialize existing devices
      this.scanDevices();
      
      this.isInitialized = true;
      console.log('MIDI Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MIDI Engine:', error);
      throw error;
    }
  }

  private scanDevices(): void {
    if (!this.midiAccess) return;

    // Clear existing devices
    this.inputDevices.clear();
    this.outputDevices.clear();

    // Scan input devices
    for (const input of this.midiAccess.inputs.values()) {
      this.inputDevices.set(input.id, input);
      input.onmidimessage = this.handleMIDIMessage.bind(this);
    }

    // Scan output devices
    for (const output of this.midiAccess.outputs.values()) {
      this.outputDevices.set(output.id, output);
    }

    // Notify listeners
    this.notifyDeviceListeners();
  }

  private handleStateChange(event: MIDIConnectionEvent): void {
    if (event.port) {
      console.log(`MIDI device ${event.port.state}: ${event.port.name}`);
    }
    this.scanDevices();
  }

  private handleMIDIMessage(event: MIDIMessageEvent): void {
    if (!event.data) return;
    const message = this.parseMIDIMessage(event.data, event.timeStamp);
    
    // Handle MIDI learn
    if (this.learnSession && this.learnSession.isActive) {
      this.handleMIDILearn(message);
      return;
    }

    // Process mappings
    this.processMappings(message);

    // Notify listeners
    this.notifyMessageListeners(message);
  }

  private parseMIDIMessage(data: Uint8Array, timestamp: number): MIDIMessage {
    const status = data[0];
    const channel = (status & 0x0F) + 1;
    const messageType = status & 0xF0;

    const message: MIDIMessage = {
      type: 'noteOn', // Default, will be overridden
      channel,
      timestamp,
    };

    switch (messageType) {
      case 0x80: // Note Off
        message.type = 'noteOff';
        message.note = data[1];
        message.velocity = data[2];
        break;
      
      case 0x90: // Note On
        message.type = data[2] > 0 ? 'noteOn' : 'noteOff';
        message.note = data[1];
        message.velocity = data[2];
        break;
      
      case 0xB0: // Control Change
        message.type = 'controlChange';
        message.controller = data[1];
        message.value = data[2];
        break;
      
      case 0xC0: // Program Change
        message.type = 'programChange';
        message.program = data[1];
        break;
      
      case 0xE0: // Pitch Bend
        message.type = 'pitchBend';
        message.pitch = (data[2] << 7) | data[1];
        break;
      
      case 0xD0: // Channel Aftertouch
        message.type = 'aftertouch';
        message.pressure = data[1];
        break;
      
      case 0xF0: // System Exclusive
        message.type = 'sysex';
        message.data = data;
        break;
    }

    return message;
  }

  private processMappings(message: MIDIMessage): void {
    if (message.type !== 'controlChange') return;

    for (const mapping of this.mappings.values()) {
      if (!mapping.enabled) continue;
      if (mapping.channel !== message.channel) continue;
      if (mapping.controller !== message.controller) continue;

      const normalizedValue = (message.value || 0) / 127;
      const mappedValue = this.applyMappingCurve(
        normalizedValue,
        mapping.minValue,
        mapping.maxValue,
        mapping.curve
      );

      this.notifyParameterChange(mapping, mappedValue);
    }
  }

  private applyMappingCurve(
    input: number,
    min: number,
    max: number,
    curve: 'linear' | 'exponential' | 'logarithmic'
  ): number {
    let normalized: number;

    switch (curve) {
      case 'exponential':
        normalized = Math.pow(input, 2);
        break;
      case 'logarithmic':
        normalized = Math.sqrt(input);
        break;
      default:
        normalized = input;
    }

    return min + (max - min) * normalized;
  }

  private notifyParameterChange(mapping: MIDIMapping, value: number): void {
    // This will be handled by the parameter change listeners
    const event = new CustomEvent('midiParameterChange', {
      detail: { mapping, value }
    });
    window.dispatchEvent(event);
  }

  // MIDI Learn functionality
  startMIDILearn(targetType: string, targetId: string, parameter: string): string {
    const learnId = `learn_${Date.now()}`;
    
    if (this.learnSession) {
      this.stopMIDILearn();
    }

    this.learnSession = {
      id: learnId,
      targetType,
      targetId,
      parameter,
      isActive: true,
      timeout: setTimeout(() => {
        this.stopMIDILearn();
      }, 30000), // 30 second timeout
    };

    console.log(`MIDI Learn started for ${targetType}:${targetId}:${parameter}`);
    return learnId;
  }

  stopMIDILearn(): void {
    if (this.learnSession) {
      if (this.learnSession.timeout) {
        clearTimeout(this.learnSession.timeout);
      }
      this.learnSession = null;
      console.log('MIDI Learn stopped');
    }
  }

  private handleMIDILearn(message: MIDIMessage): void {
    if (!this.learnSession || message.type !== 'controlChange') return;

    const mapping: MIDIMapping = {
      id: `mapping_${Date.now()}`,
      name: `CC${message.controller} Ch${message.channel}`,
      deviceId: '', // Will be set when we know the device
      controller: message.controller!,
      channel: message.channel,
      targetType: this.learnSession.targetType as 'channel' | 'effect' | 'master' | 'transport' | 'instrument',
      targetId: this.learnSession.targetId,
      parameter: this.learnSession.parameter,
      minValue: 0,
      maxValue: 1,
      curve: 'linear',
      enabled: true,
    };

    this.addMapping(mapping);
    this.stopMIDILearn();

    console.log(`MIDI mapping created: CC${message.controller} → ${mapping.targetType}:${mapping.parameter}`);
  }

  // Mapping management
  addMapping(mapping: MIDIMapping): void {
    this.mappings.set(mapping.id, mapping);
    this.saveMappings();
  }

  removeMapping(mappingId: string): void {
    this.mappings.delete(mappingId);
    this.saveMappings();
  }

  updateMapping(mappingId: string, updates: Partial<MIDIMapping>): void {
    const mapping = this.mappings.get(mappingId);
    if (mapping) {
      Object.assign(mapping, updates);
      this.saveMappings();
    }
  }

  getMappings(): MIDIMapping[] {
    return Array.from(this.mappings.values());
  }

  getMappingsForTarget(targetType: string, targetId: string): MIDIMapping[] {
    return this.getMappings().filter(
      mapping => mapping.targetType === targetType && mapping.targetId === targetId
    );
  }

  private saveMappings(): void {
    try {
      const mappingsData = JSON.stringify(Array.from(this.mappings.values()));
      localStorage.setItem('midi_mappings', mappingsData);
    } catch (error) {
      console.error('Failed to save MIDI mappings:', error);
    }
  }

  private loadMappings(): void {
    try {
      const mappingsData = localStorage.getItem('midi_mappings');
      if (mappingsData) {
        const mappings: MIDIMapping[] = JSON.parse(mappingsData);
        mappings.forEach(mapping => {
          this.mappings.set(mapping.id, mapping);
        });
      }
    } catch (error) {
      console.error('Failed to load MIDI mappings:', error);
    }
  }

  // Device management
  getDevices(): MIDIDevice[] {
    const devices: MIDIDevice[] = [];

    for (const input of this.inputDevices.values()) {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Input',
        manufacturer: input.manufacturer || 'Unknown',
        type: 'input',
        state: input.state,
        connection: input.connection,
      });
    }

    for (const output of this.outputDevices.values()) {
      devices.push({
        id: output.id,
        name: output.name || 'Unknown Output',
        manufacturer: output.manufacturer || 'Unknown',
        type: 'output',
        state: output.state,
        connection: output.connection,
      });
    }

    return devices;
  }

  // Send MIDI messages
  sendMessage(deviceId: string, message: MIDIMessage): void {
    const device = this.outputDevices.get(deviceId);
    if (!device) return;

    const data = this.createMIDIData(message);
    if (data) {
      device.send(data);
    }
  }

  private createMIDIData(message: MIDIMessage): Uint8Array | null {
    const channel = message.channel - 1; // Convert to 0-based

    switch (message.type) {
      case 'noteOn':
        return new Uint8Array([0x90 | channel, message.note!, message.velocity!]);
      
      case 'noteOff':
        return new Uint8Array([0x80 | channel, message.note!, message.velocity!]);
      
      case 'controlChange':
        return new Uint8Array([0xB0 | channel, message.controller!, message.value!]);
      
      case 'programChange':
        return new Uint8Array([0xC0 | channel, message.program!]);
      
      case 'pitchBend':
        const pitch = message.pitch!;
        return new Uint8Array([0xE0 | channel, pitch & 0x7F, (pitch >> 7) & 0x7F]);
      
      default:
        return null;
    }
  }

  // Event listeners
  addMessageListener(listener: (message: MIDIMessage) => void): void {
    this.messageListeners.push(listener);
  }

  removeMessageListener(listener: (message: MIDIMessage) => void): void {
    const index = this.messageListeners.indexOf(listener);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    }
  }

  addDeviceListener(listener: (devices: MIDIDevice[]) => void): void {
    this.deviceListeners.push(listener);
  }

  removeDeviceListener(listener: (devices: MIDIDevice[]) => void): void {
    const index = this.deviceListeners.indexOf(listener);
    if (index > -1) {
      this.deviceListeners.splice(index, 1);
    }
  }

  private notifyMessageListeners(message: MIDIMessage): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in MIDI message listener:', error);
      }
    });
  }

  private notifyDeviceListeners(): void {
    const devices = this.getDevices();
    this.deviceListeners.forEach(listener => {
      try {
        listener(devices);
      } catch (error) {
        console.error('Error in MIDI device listener:', error);
      }
    });
  }

  isSupported(): boolean {
    return !!navigator.requestMIDIAccess;
  }

  getLearnSession(): MIDILearnSession | null {
    return this.learnSession;
  }

  dispose(): void {
    this.stopMIDILearn();
    
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }

    for (const input of this.inputDevices.values()) {
      input.onmidimessage = null;
    }

    this.inputDevices.clear();
    this.outputDevices.clear();
    this.mappings.clear();
    this.messageListeners.length = 0;
    this.deviceListeners.length = 0;
    
    this.isInitialized = false;
  }
}
