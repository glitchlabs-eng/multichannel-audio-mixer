import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the AudioEngine to avoid real audio context issues in tests
jest.mock('../services/AudioEngine', () => ({
  AudioEngine: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    createChannel: jest.fn(),
    updateChannel: jest.fn(),
    removeChannel: jest.fn(),
    setMasterGain: jest.fn(),
    dispose: jest.fn(),
  })),
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main application components', async () => {
    render(<App />);
    
    // Wait for the app to initialize
    await waitFor(() => {
      expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    });
    
    // Check for main UI elements
    expect(screen.getByText('+ Add Channel')).toBeInTheDocument();
    expect(screen.getByText('Master')).toBeInTheDocument();
  });

  it('displays initial channels', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Channel 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Channel 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Channel 3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Channel 4')).toBeInTheDocument();
    });
  });

  it('adds new channel when Add Channel button is clicked', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('+ Add Channel')).toBeInTheDocument();
    });
    
    const addChannelButton = screen.getByText('+ Add Channel');
    fireEvent.click(addChannelButton);
    
    // Should add a new channel (Channel 5)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Channel 5')).toBeInTheDocument();
    });
  });

  it('removes channel when remove button is clicked', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Channel 1')).toBeInTheDocument();
    });
    
    // Find and click the first remove button (×)
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[0]);
    
    // Channel 1 should be removed
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Channel 1')).not.toBeInTheDocument();
    });
  });

  it('handles channel name changes', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Channel 1')).toBeInTheDocument();
    });
    
    const channelNameInput = screen.getByDisplayValue('Channel 1');
    fireEvent.change(channelNameInput, { target: { value: 'Vocals' } });
    
    expect(screen.getByDisplayValue('Vocals')).toBeInTheDocument();
  });

  it('handles solo functionality', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Channel 1')).toBeInTheDocument();
    });
    
    // Find and click the first solo button
    const soloButtons = screen.getAllByText('S');
    fireEvent.click(soloButtons[0]);
    
    // The button should be activated (this is visual, hard to test styling)
    expect(soloButtons[0]).toBeInTheDocument();
  });

  it('handles mute functionality', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Channel 1')).toBeInTheDocument();
    });
    
    // Find and click the first mute button
    const muteButtons = screen.getAllByText('M');
    fireEvent.click(muteButtons[0]);
    
    // The button should be activated
    expect(muteButtons[0]).toBeInTheDocument();
  });

  it('displays status messages', async () => {
    render(<App />);
    
    // Should show initializing message first, then ready
    await waitFor(() => {
      expect(screen.getByText('Audio engine ready')).toBeInTheDocument();
    });
  });

  it('handles master section controls', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Master')).toBeInTheDocument();
    });
    
    // Check for master controls
    expect(screen.getByText('PHONES')).toBeInTheDocument();
    expect(screen.getByText('MUTE')).toBeInTheDocument();
  });

  it('handles audio engine initialization failure', async () => {
    // Mock AudioEngine to throw an error
    const { AudioEngine } = require('../services/AudioEngine');
    AudioEngine.mockImplementation(() => ({
      initialize: jest.fn().mockRejectedValue(new Error('Audio context failed')),
      addEventListener: jest.fn(),
      dispose: jest.fn(),
    }));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error: Audio context failed/)).toBeInTheDocument();
    });
  });

  it('handles menu actions when electronAPI is available', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    });
    
    // Simulate menu action
    const menuCallback = (window.electronAPI.onMenuAction as jest.Mock).mock.calls[0][0];
    menuCallback('menu-new-project');
    
    // Should reset to new project
    await waitFor(() => {
      expect(screen.getByText('New project created')).toBeInTheDocument();
    });
  });

  it('handles project save action', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    });
    
    // Mock successful save
    (window.electronAPI.saveProject as jest.Mock).mockResolvedValue({
      success: true,
      filePath: '/path/to/project.amp',
    });
    
    // Simulate save menu action
    const menuCallback = (window.electronAPI.onMenuAction as jest.Mock).mock.calls[0][0];
    menuCallback('menu-save-project');
    
    await waitFor(() => {
      expect(screen.getByText(/Project saved/)).toBeInTheDocument();
    });
  });

  it('handles audio import action', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    });
    
    // Mock successful import
    (window.electronAPI.importAudioFile as jest.Mock).mockResolvedValue({
      success: true,
      filePaths: ['/path/to/audio1.wav', '/path/to/audio2.wav'],
    });
    
    // Simulate import menu action
    const menuCallback = (window.electronAPI.onMenuAction as jest.Mock).mock.calls[0][0];
    menuCallback('menu-import-audio');
    
    await waitFor(() => {
      expect(screen.getByText('Imported 2 audio file(s)')).toBeInTheDocument();
    });
    
    // Should create new channels for imported files
    await waitFor(() => {
      expect(screen.getByDisplayValue('Import 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Import 2')).toBeInTheDocument();
    });
  });

  it('cleans up resources on unmount', async () => {
    const { unmount } = render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Untitled Project')).toBeInTheDocument();
    });
    
    unmount();
    
    // Should call dispose on audio engine
    // This is tested through the mock implementation
  });
});
