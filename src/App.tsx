import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AudioEngine } from '@/services/AudioEngine';
import { AudioFileLoader } from '@/services/AudioFileLoader';
import { SessionManager, ProjectSession, SessionTemplate } from '@/services/SessionManager';
import { RecordingSession, RecordingConfig, ExportOptions } from '@/services/AudioRecordingEngine';
import { MIDIDevice, MIDIMapping, MIDIMessage, MIDILearnSession } from '@/services/MIDIEngine';
import { VirtualInstrument } from '@/services/VirtualInstrumentEngine';
import { AudioChannel, MasterSection, ProjectSettings, AudioEngineEvent, AudioDevice } from '@/types/audio';
import MixerChannel from '@/components/MixerChannel';
import MasterSectionComponent from '@/components/MasterSection';
import Toolbar from '@/components/Toolbar';
import RecordingPanel from '@/components/RecordingPanel';
import SessionBrowser from '@/components/SessionBrowser';
import ExportDialog from '@/components/ExportDialog';
import MIDIControlPanel from '@/components/MIDIControlPanel';
import VirtualInstrumentPanel from '@/components/VirtualInstrumentPanel';
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

const SidePanel = styled.div`
  width: 300px;
  min-width: 300px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  overflow-y: auto;
  padding: 8px;
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
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const [project, setProject] = useState<ProjectSettings>(createDefaultProject());
  const [currentSession, setCurrentSession] = useState<ProjectSession | null>(null);
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing audio engine...');
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);

  // Recording state
  const [recordingSession, setRecordingSession] = useState<RecordingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // MIDI state
  const [midiDevices, setMidiDevices] = useState<MIDIDevice[]>([]);
  const [midiMappings, setMidiMappings] = useState<MIDIMapping[]>([]);
  const [midiLearnSession, setMidiLearnSession] = useState<MIDILearnSession | null>(null);
  const [recentMidiMessages, setRecentMidiMessages] = useState<MIDIMessage[]>([]);

  // Virtual Instrument state
  const [virtualInstruments, setVirtualInstruments] = useState<VirtualInstrument[]>([]);

  // UI state
  const [showSessionBrowser, setShowSessionBrowser] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSession, setExportSession] = useState<RecordingSession | null>(null);

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

        // Initialize session manager
        const manager = new SessionManager();
        setSessionManager(manager);

        // Get available input devices
        const devices = engine.getAvailableInputDevices();
        setInputDevices(devices);

        // Initialize MIDI state
        const midiDevs = engine.getMIDIDevices();
        setMidiDevices(midiDevs);

        const mappings = engine.getMIDIMappings();
        setMidiMappings(mappings);

        // Initialize virtual instruments state
        const instruments = engine.getVirtualInstruments();
        setVirtualInstruments(instruments);

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
      if (sessionManager) {
        sessionManager.dispose();
      }
    };
  }, []);

  // Update recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && audioEngine) {
      interval = setInterval(() => {
        const status = audioEngine.getRecordingStatus();
        setRecordingDuration(status.duration);
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, audioEngine]);

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

  // Recording handlers
  const handleStartRecording = (sessionName: string, config: RecordingConfig, channelIds: string[]) => {
    if (!audioEngine) return;

    try {
      const session = audioEngine.createRecordingSession(sessionName, config);
      if (session) {
        audioEngine.startRecording(session.id, channelIds);
        setRecordingSession(session);
        setIsRecording(true);
        setStatusMessage(`Recording started: ${sessionName}`);
      }
    } catch (error) {
      setStatusMessage(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStopRecording = () => {
    if (!audioEngine) return;

    try {
      const session = audioEngine.stopRecording();
      if (session && sessionManager && currentSession) {
        sessionManager.addRecordingToSession(currentSession.id, session);
        setStatusMessage(`Recording stopped. Duration: ${session.duration.toFixed(2)}s`);
      }
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      setStatusMessage(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePauseRecording = () => {
    if (audioEngine) {
      audioEngine.pauseRecording();
      setStatusMessage('Recording paused');
    }
  };

  const handleResumeRecording = () => {
    if (audioEngine) {
      audioEngine.resumeRecording();
      setStatusMessage('Recording resumed');
    }
  };

  const handleExportSession = async (sessionId: string, options: ExportOptions) => {
    if (!audioEngine) return;

    try {
      setStatusMessage('Exporting session...');
      const blob = await audioEngine.exportRecordingSession(sessionId, options);

      // Download the exported file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${sessionId}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('Session exported successfully');
    } catch (error) {
      setStatusMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Session management handlers
  const handleLoadSession = (sessionId: string) => {
    if (!sessionManager) return;

    const session = sessionManager.loadSession(sessionId);
    if (session) {
      setCurrentSession(session);
      setProject(session.settings);
      setStatusMessage(`Loaded session: ${session.name}`);
      setShowSessionBrowser(false);
    }
  };

  const handleCreateFromTemplate = (template: SessionTemplate) => {
    if (!sessionManager) return;

    const session = sessionManager.createSession(template.name, template);
    setCurrentSession(session);
    setProject(session.settings);
    setStatusMessage(`Created session from template: ${template.name}`);
    setShowSessionBrowser(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!sessionManager) return;

    if (sessionManager.deleteSession(sessionId)) {
      setStatusMessage('Session deleted');
    }
  };

  const handleDuplicateSession = (sessionId: string, newName: string) => {
    if (!sessionManager) return;

    const duplicated = sessionManager.duplicateSession(sessionId, newName);
    if (duplicated) {
      setStatusMessage(`Session duplicated: ${newName}`);
    }
  };

  const handleExportSessionData = (sessionId: string) => {
    if (!sessionManager) return;

    try {
      const sessionData = sessionManager.exportSession(sessionId);
      const blob = new Blob([sessionData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('Session data exported');
    } catch (error) {
      setStatusMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportSession = (sessionData: string) => {
    if (!sessionManager) return;

    try {
      const session = sessionManager.importSession(sessionData);
      setStatusMessage(`Session imported: ${session.name}`);
    } catch (error) {
      setStatusMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // MIDI handlers
  const handleStartMIDILearn = (targetType: string, targetId: string, parameter: string) => {
    if (!audioEngine) return;

    const learnId = audioEngine.startMIDILearn(targetType, targetId, parameter);
    if (learnId) {
      const session = audioEngine.getMIDILearnSession();
      setMidiLearnSession(session);
      setStatusMessage(`MIDI Learn started for ${targetType}:${parameter}`);
    }
  };

  const handleStopMIDILearn = () => {
    if (!audioEngine) return;

    audioEngine.stopMIDILearn();
    setMidiLearnSession(null);
    setStatusMessage('MIDI Learn stopped');
  };

  const handleRemoveMIDIMapping = (mappingId: string) => {
    if (!audioEngine) return;

    audioEngine.removeMIDIMapping(mappingId);
    const updatedMappings = audioEngine.getMIDIMappings();
    setMidiMappings(updatedMappings);
    setStatusMessage('MIDI mapping removed');
  };

  const handleToggleMIDIMapping = (mappingId: string, enabled: boolean) => {
    if (!audioEngine) return;

    audioEngine.updateMIDIMapping(mappingId, { enabled });
    const updatedMappings = audioEngine.getMIDIMappings();
    setMidiMappings(updatedMappings);
  };

  const handleUpdateMIDIMapping = (mappingId: string, updates: Partial<MIDIMapping>) => {
    if (!audioEngine) return;

    audioEngine.updateMIDIMapping(mappingId, updates);
    const updatedMappings = audioEngine.getMIDIMappings();
    setMidiMappings(updatedMappings);
  };

  // Virtual Instrument handlers
  const handleCreateVirtualInstrument = (type: 'synthesizer' | 'sampler' | 'drum_machine', name: string) => {
    if (!audioEngine) return;

    const instrumentId = audioEngine.createVirtualInstrument(type, name);
    if (instrumentId) {
      const updatedInstruments = audioEngine.getVirtualInstruments();
      setVirtualInstruments(updatedInstruments);
      setStatusMessage(`Created ${type}: ${name}`);
    }
  };

  const handleRemoveVirtualInstrument = (instrumentId: string) => {
    if (!audioEngine) return;

    audioEngine.removeVirtualInstrument(instrumentId);
    const updatedInstruments = audioEngine.getVirtualInstruments();
    setVirtualInstruments(updatedInstruments);
    setStatusMessage('Virtual instrument removed');
  };

  const handleToggleVirtualInstrument = (instrumentId: string, enabled: boolean) => {
    if (!audioEngine) return;

    // Update the instrument's enabled state
    const updatedInstruments = virtualInstruments.map(inst =>
      inst.id === instrumentId ? { ...inst, enabled } : inst
    );
    setVirtualInstruments(updatedInstruments);
  };

  const handleUpdateVirtualInstrumentParameter = (instrumentId: string, parameter: string, value: number) => {
    if (!audioEngine) return;

    audioEngine.updateVirtualInstrumentParameter(instrumentId, parameter, value);
    const updatedInstruments = audioEngine.getVirtualInstruments();
    setVirtualInstruments(updatedInstruments);
  };

  const handleLoadVirtualInstrumentPreset = (instrumentId: string, presetId: string) => {
    if (!audioEngine) return;

    audioEngine.loadVirtualInstrumentPreset(instrumentId, presetId);
    const updatedInstruments = audioEngine.getVirtualInstruments();
    setVirtualInstruments(updatedInstruments);
    setStatusMessage('Preset loaded');
  };

  const handlePlayVirtualInstrumentNote = (instrumentId: string, note: number, velocity: number) => {
    if (!audioEngine) return;

    audioEngine.playVirtualInstrumentNote(instrumentId, note, velocity);
  };

  const handleStopVirtualInstrumentNote = (instrumentId: string, note: number) => {
    if (!audioEngine) return;

    audioEngine.stopVirtualInstrumentNote(instrumentId, note);
  };

  return (
    <AppContainer>
      <Toolbar
        onAddChannel={handleAddChannel}
        isEngineReady={isEngineInitialized}
        projectName={currentSession?.name || project.name}
        onShowSessionBrowser={() => setShowSessionBrowser(true)}
      />

      {showSessionBrowser && sessionManager && (
        <SessionBrowser
          sessions={sessionManager.getAllSessions()}
          templates={sessionManager.getSessionTemplates()}
          onLoadSession={handleLoadSession}
          onDeleteSession={handleDeleteSession}
          onDuplicateSession={handleDuplicateSession}
          onCreateFromTemplate={handleCreateFromTemplate}
          onExportSession={handleExportSessionData}
          onImportSession={handleImportSession}
        />
      )}

      <MixerContainer>
        <SidePanel>
          <RecordingPanel
            channels={project.channels}
            currentSession={recordingSession}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
            onExportSession={(sessionId, options) => {
              const session = audioEngine?.getRecordingSessions().find(s => s.id === sessionId);
              if (session) {
                setExportSession(session);
                setShowExportDialog(true);
              }
            }}
          />

          <MIDIControlPanel
            devices={midiDevices}
            mappings={midiMappings}
            learnSession={midiLearnSession}
            recentMessages={recentMidiMessages}
            onStartLearn={handleStartMIDILearn}
            onStopLearn={handleStopMIDILearn}
            onRemoveMapping={handleRemoveMIDIMapping}
            onToggleMapping={handleToggleMIDIMapping}
            onUpdateMapping={handleUpdateMIDIMapping}
          />

          <VirtualInstrumentPanel
            instruments={virtualInstruments}
            onCreateInstrument={handleCreateVirtualInstrument}
            onRemoveInstrument={handleRemoveVirtualInstrument}
            onToggleInstrument={handleToggleVirtualInstrument}
            onUpdateParameter={handleUpdateVirtualInstrumentParameter}
            onLoadPreset={handleLoadVirtualInstrumentPreset}
            onPlayNote={handlePlayVirtualInstrumentNote}
            onStopNote={handleStopVirtualInstrumentNote}
          />
        </SidePanel>

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
              onStartMIDILearn={handleStartMIDILearn}
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

      {showExportDialog && exportSession && (
        <ExportDialog
          session={exportSession}
          isOpen={showExportDialog}
          onClose={() => {
            setShowExportDialog(false);
            setExportSession(null);
          }}
          onExport={async (options, trackIds) => {
            if (trackIds && trackIds.length > 0) {
              // Export individual tracks
              for (const trackId of trackIds) {
                await audioEngine?.exportRecordingTrack(exportSession.id, trackId, options);
              }
            } else {
              // Export full session
              await handleExportSession(exportSession.id, options);
            }
          }}
        />
      )}

      <StatusBar>
        {statusMessage}
      </StatusBar>
    </AppContainer>
  );
};

export default App;
