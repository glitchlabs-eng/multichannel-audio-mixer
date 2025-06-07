import { AudioDevice } from '@/types/audio';

export class AudioDeviceManager {
  private devices: AudioDevice[] = [];
  private eventListeners: ((devices: AudioDevice[]) => void)[] = [];

  constructor() {
    this.setupDeviceChangeListener();
  }

  async getAvailableDevices(): Promise<AudioDevice[]> {
    try {
      // Request permission first
      await this.requestPermissions();
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices
        .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
        .map(device => this.mapToAudioDevice(device));
      
      this.notifyListeners();
      return this.devices;
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      throw new Error(`Audio device enumeration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      // Request microphone permission to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.warn('Microphone permission denied, device labels may not be available');
      // Don't throw - we can still enumerate devices without labels
    }
  }

  async getInputStream(deviceId?: string): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 2,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Failed to get audio input stream:', error);
      throw new Error(`Audio input failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getInputDevices(): AudioDevice[] {
    return this.devices.filter(device => device.type === 'input');
  }

  getOutputDevices(): AudioDevice[] {
    return this.devices.filter(device => device.type === 'output');
  }

  getDeviceById(deviceId: string): AudioDevice | undefined {
    return this.devices.find(device => device.id === deviceId);
  }

  addEventListener(listener: (devices: AudioDevice[]) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (devices: AudioDevice[]) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private mapToAudioDevice(device: MediaDeviceInfo): AudioDevice {
    return {
      id: device.deviceId,
      name: device.label || `${device.kind === 'audioinput' ? 'Microphone' : 'Speaker'} (${device.deviceId.slice(0, 8)})`,
      type: device.kind === 'audioinput' ? 'input' : 'output',
      channelCount: 2, // Default to stereo
      sampleRate: 44100, // Default sample rate
    };
  }

  private setupDeviceChangeListener(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        this.getAvailableDevices().catch(console.error);
      });
    }
  }

  private notifyListeners(): void {
    this.eventListeners.forEach(listener => listener(this.devices));
  }

  dispose(): void {
    this.eventListeners = [];
  }
}

// Singleton instance
export const audioDeviceManager = new AudioDeviceManager();
