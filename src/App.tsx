import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AudioEngine } from '@/services/AudioEngine';
import { AudioFileLoader } from '@/services/AudioFileLoader';
import { AudioChannel, MasterSection, ProjectSettings, AudioEngineEvent, AudioDevice } from '@/types/audio';
import MixerChannel from '@/components/MixerChannel';
import MasterSectionComponent from '@/components/MasterSection';
import Toolbar from '@/components/Toolbar';
import { createDefaultChannel, createDefaultMaster, createDefaultProject } from '@/utils/defaults';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #ffffff;
`;

const MixerContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ChannelsContainer = styled.div`
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 20px;
  gap: 4px;
  background: #1e1e1e;
`;

const MasterContainer = styled.div`
  width: 120px;
  background: #252525;
  border-left: 2px solid #333;
`;

const StatusBar = styled.div`
  height: 30px;
  background: #333;
  display: flex;
  align-items: center;
  padding: 0 15px;
  font-size: 12px;
  color: #ccc;
  border-top: 1px solid #444;
`;

const App: React.FC = () => {
  const [audioEngine, setAudioEngine] = useState<AudioEngine | null>(null);
  const [audioFileLoader, setAudioFileLoader] = useState<AudioFileLoader | null>(null);
  const [project, setProject] = useState<ProjectSettings>(createDefaultProject());
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing audio engine...');
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);

  // Initialize audio engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        const engine = new AudioEngine({
          sampleRate: 44100,
          bufferSize: 512,
          latency: 'interactive',
        });

        engine.addEventListener(handleAudioEngineEvent);
        await engine.initialize();

        // Initialize audio file loader
        const audioContext = (engine as any).audioContext;
        if (audioContext) {
          const fileLoader = new AudioFileLoader(audioContext);
          setAudioFileLoader(fileLoader);
        }

        // Get available input devices
        const devices = engine.getAvailableInputDevices();
        setInputDevices(devices);

        setAudioEngine(engine);
        setIsEngineInitialized(true);
        setStatusMessage('Audio engine ready');
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
        setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeEngine();

    return () => {
      if (audioEngine) {
        audioEngine.dispose();
      }
    };
  }, []);

  // Setup menu event listeners
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMenuAction(handleMenuAction);
      
      return () => {
        window.electronAPI.removeMenuListeners();
      };
    }
  }, []);

  const handleAudioEngineEvent = useCallback((event: AudioEngineEvent) => {
    switch (event.type) {
      case 'LEVEL_UPDATE':
        setProject(prev => ({
          ...prev,
          channels: prev.channels.map(ch => 
            ch.id === event.channelId 
              ? { ...ch, level: event.level }
              : ch
          ),
          master: event.channelId === 'master' 
            ? { ...prev.master, level: event.level }
            : prev.master,
        }));
        break;
      case 'CLIPPING_DETECTED':
        setStatusMessage(`Clipping detected on ${event.channelId}`);
        setTimeout(() => setStatusMessage('Audio engine ready'), 3000);
        break;
      case 'ERROR':
        setStatusMessage(`Error: ${event.message}`);
        break;
    }
  }, []);

  const handleMenuAction = useCallback(async (action: string) => {
    switch (action) {
      case 'menu-new-project':
        handleNewProject();
        break;
      case 'menu-save-project':
        await handleSaveProject();
        break;
      case 'menu-open-project':
        await handleOpenProject();
        break;
      case 'menu-import-audio':
        await handleImportAudio();
        break;
      case 'menu-export-mix':
        handleExportMix();
        break;
    }
  }, [project]);

  const handleNewProject = () => {
    setProject(createDefaultProject());
    setStatusMessage('New project created');
  };

  const handleSaveProject = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveProject(project);
      if (result.success) {
        setStatusMessage(`Project saved: ${result.filePath}`);
      } else {
        setStatusMessage('Failed to save project');
      }
    }
  };

  const handleOpenProject = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadProject();
      if (result.success && result.data) {
        setProject(result.data);
        setStatusMessage('Project loaded');
      } else {
        setStatusMessage('Failed to load project');
      }
    }
  };

  const handleImportAudio = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.importAudioFile();
      if (result.success && result.filePaths) {
        // Create new channels for imported files
        const newChannels = result.filePaths.map((filePath, index) => {
          const channel = createDefaultChannel(`Import ${index + 1}`);
          channel.inputSource = {
            type: 'file',
            filePath,
          };
          return channel;
        });

        setProject(prev => ({
          ...prev,
          channels: [...prev.channels, ...newChannels],
        }));

        setStatusMessage(`Imported ${result.filePaths.length} audio file(s)`);
      }
    }
  };

  const handleExportMix = () => {
    setStatusMessage('Export functionality coming soon...');
  };

  const handleAddChannel = () => {
    const newChannel = createDefaultChannel(`Channel ${project.channels.length + 1}`);
    setProject(prev => ({
      ...prev,
      channels: [...prev.channels, newChannel],
    }));

    if (audioEngine) {
      audioEngine.createChannel(newChannel);
    }
  };

  const handleChannelUpdate = (channelId: string, updates: Partial<AudioChannel>) => {
    setProject(prev => ({
      ...prev,
      channels: prev.channels.map(ch => 
        ch.id === channelId ? { ...ch, ...updates } : ch
      ),
    }));

    if (audioEngine) {
      audioEngine.updateChannel(channelId, updates);
    }
  };

  const handleChannelRemove = (channelId: string) => {
    setProject(prev => ({
      ...prev,
      channels: prev.channels.filter(ch => ch.id !== channelId),
    }));

    if (audioEngine) {
      audioEngine.removeChannel(channelId);
    }
  };

  const handleSolo = (channelId: string) => {
    const channel = project.channels.find(ch => ch.id === channelId);
    if (!channel) return;

    const newSoloState = !channel.solo;
    
    setProject(prev => ({
      ...prev,
      channels: prev.channels.map(ch => ({
        ...ch,
        solo: ch.id === channelId ? newSoloState : false,
        muted: newSoloState && ch.id !== channelId ? true : ch.muted,
      })),
    }));
  };

  const handleMasterUpdate = (updates: Partial<MasterSection>) => {
    setProject(prev => ({
      ...prev,
      master: { ...prev.master, ...updates },
    }));

    if (audioEngine && updates.mainGain !== undefined) {
      audioEngine.setMasterGain(updates.mainGain);
    }
  };

  const handleConnectMicrophone = async (channelId: string, deviceId?: string) => {
    if (audioEngine) {
      try {
        await audioEngine.connectMicrophoneInput(channelId, deviceId);
        setStatusMessage(`Microphone connected to ${project.channels.find(ch => ch.id === channelId)?.name}`);
      } catch (error) {
        setStatusMessage(`Failed to connect microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    }
  };

  const handleLoadAudioFile = async (channelId: string, files: FileList) => {
    if (audioEngine && audioFileLoader) {
      try {
        const file = files[0]; // Use first file
        const { buffer, info } = await audioFileLoader.loadFromFile(file);

        await audioEngine.playAudioBuffer(channelId, buffer, false);

        // Update channel with file info
        handleChannelUpdate(channelId, {
          inputSource: {
            type: 'file',
            filePath: info.name,
            buffer,
          },
        });

        setStatusMessage(`Loaded ${info.name} (${audioFileLoader.formatDuration(info.duration)})`);
      } catch (error) {
        setStatusMessage(`Failed to load audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    }
  };

  const handleStopChannel = (channelId: string) => {
    if (audioEngine) {
      audioEngine.stopChannel(channelId);
      setStatusMessage(`Stopped ${project.channels.find(ch => ch.id === channelId)?.name}`);
    }
  };

  return (
    <AppContainer>
      <Toolbar 
        onAddChannel={handleAddChannel}
        isEngineReady={isEngineInitialized}
        projectName={project.name}
      />
      
      <MixerContainer>
        <ChannelsContainer>
          {project.channels.map(channel => (
            <MixerChannel
              key={channel.id}
              channel={channel}
              inputDevices={inputDevices}
              onChannelUpdate={handleChannelUpdate}
              onSolo={handleSolo}
              onMute={(channelId) => handleChannelUpdate(channelId, { muted: !channel.muted })}
              onRemove={handleChannelRemove}
              onConnectMicrophone={handleConnectMicrophone}
              onLoadAudioFile={handleLoadAudioFile}
              onStopChannel={handleStopChannel}
            />
          ))}
        </ChannelsContainer>
        
        <MasterContainer>
          <MasterSectionComponent
            master={project.master}
            onMasterUpdate={handleMasterUpdate}
          />
        </MasterContainer>
      </MixerContainer>
      
      <StatusBar>
        {statusMessage}
      </StatusBar>
    </AppContainer>
  );
};

export default App;
