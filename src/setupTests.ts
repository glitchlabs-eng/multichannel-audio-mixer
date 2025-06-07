import '@testing-library/jest-dom';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createStereoPanner() {
    return {
      pan: { value: 0, setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteTimeDomainData: jest.fn(),
      getByteFrequencyData: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 350, setValueAtTime: jest.fn() },
      gain: { value: 0, setValueAtTime: jest.fn() },
      Q: { value: 1, setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createMediaStreamSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  decodeAudioData() {
    return Promise.resolve({
      length: 44100,
      sampleRate: 44100,
      numberOfChannels: 2,
    });
  }

  close() {
    return Promise.resolve();
  }
}

// Mock AudioContext globally
global.AudioContext = MockAudioContext as any;
global.webkitAudioContext = MockAudioContext as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [],
    }),
    enumerateDevices: jest.fn().mockResolvedValue([
      {
        deviceId: 'default',
        kind: 'audioinput',
        label: 'Default Microphone',
        groupId: 'default',
      },
      {
        deviceId: 'speaker',
        kind: 'audiooutput',
        label: 'Default Speaker',
        groupId: 'default',
      },
    ]),
  },
});

// Mock Electron API
global.window.electronAPI = {
  saveProject: jest.fn().mockResolvedValue({ success: true }),
  loadProject: jest.fn().mockResolvedValue({ success: true, data: {} }),
  importAudioFile: jest.fn().mockResolvedValue({ success: true, filePaths: [] }),
  getAudioDevices: jest.fn().mockResolvedValue({ inputDevices: [], outputDevices: [] }),
  onMenuAction: jest.fn(),
  removeMenuListeners: jest.fn(),
};

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};
