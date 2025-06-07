import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RecordingSession, RecordingConfig, ExportOptions } from '@/services/AudioRecordingEngine';
import { AudioChannel } from '@/types/audio';

const PanelContainer = styled.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusIndicator = styled.div<{ status: 'recording' | 'stopped' | 'paused' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: bold;
  color: ${props => {
    switch (props.status) {
      case 'recording': return '#ff4444';
      case 'paused': return '#ffaa00';
      default: return '#666';
    }
  }};
`;

const StatusDot = styled.div<{ status: 'recording' | 'stopped' | 'paused' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'recording': return '#ff4444';
      case 'paused': return '#ffaa00';
      default: return '#666';
    }
  }};
  animation: ${props => props.status === 'recording' ? 'pulse 1s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #4CAF50;
          color: #fff;
          &:hover { background: #45a049; }
          &:disabled { background: #666; cursor: not-allowed; }
        `;
      case 'danger':
        return `
          background: #f44336;
          color: #fff;
          &:hover { background: #da190b; }
          &:disabled { background: #666; cursor: not-allowed; }
        `;
      default:
        return `
          background: #666;
          color: #ccc;
          &:hover { background: #777; }
          &:disabled { background: #444; cursor: not-allowed; }
        `;
    }
  }}
`;

const TimeDisplay = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background: #000;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;
  min-width: 100px;
`;

const ConfigSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin: 12px 0;
`;

const ConfigGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 10px;
  font-weight: bold;
  color: #ccc;
  text-transform: uppercase;
`;

const Select = styled.select`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 6px 8px;
  font-size: 11px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
  
  option {
    background: #1a1a1a;
    color: #fff;
  }
`;

const Input = styled.input`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 6px 8px;
  font-size: 11px;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const ChannelSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
`;

const ChannelItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #333;
  border-radius: 4px;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  accent-color: #4CAF50;
`;

const ChannelName = styled.span`
  font-size: 12px;
  color: #ccc;
  flex: 1;
`;

interface RecordingPanelProps {
  channels: AudioChannel[];
  currentSession: RecordingSession | null;
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: (sessionName: string, config: RecordingConfig, channelIds: string[]) => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onExportSession: (sessionId: string, options: ExportOptions) => void;
}

const RecordingPanel: React.FC<RecordingPanelProps> = ({
  channels,
  currentSession,
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onExportSession,
}) => {
  const [sessionName, setSessionName] = useState('New Recording');
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [recordingConfig, setRecordingConfig] = useState<RecordingConfig>({
    sampleRate: 44100,
    bitDepth: 24,
    channels: 2,
    format: 'wav',
    quality: 'high',
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'wav',
    quality: 'high',
    normalize: true,
  });

  useEffect(() => {
    // Auto-select all channels by default
    if (channels.length > 0 && selectedChannels.size === 0) {
      setSelectedChannels(new Set(channels.map(ch => ch.id)));
    }
  }, [channels]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleChannelToggle = (channelId: string) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannels(newSelected);
  };

  const handleStartRecording = () => {
    if (selectedChannels.size === 0) {
      alert('Please select at least one channel to record');
      return;
    }
    onStartRecording(sessionName, recordingConfig, Array.from(selectedChannels));
  };

  const getRecordingStatus = (): 'recording' | 'stopped' | 'paused' => {
    if (!currentSession) return 'stopped';
    return currentSession.status;
  };

  const canStartRecording = !isRecording && selectedChannels.size > 0;
  const canStopRecording = isRecording;
  const canPauseRecording = isRecording && currentSession?.status === 'recording';
  const canResumeRecording = currentSession?.status === 'paused';

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>Recording</Title>
        <StatusIndicator status={getRecordingStatus()}>
          <StatusDot status={getRecordingStatus()} />
          {getRecordingStatus().toUpperCase()}
        </StatusIndicator>
      </PanelHeader>

      <ControlsSection>
        <ButtonGroup>
          <Button
            variant="primary"
            disabled={!canStartRecording}
            onClick={handleStartRecording}
          >
            ● REC
          </Button>
          
          <Button
            variant="danger"
            disabled={!canStopRecording}
            onClick={onStopRecording}
          >
            ■ STOP
          </Button>
          
          {canPauseRecording && (
            <Button onClick={onPauseRecording}>
              ⏸ PAUSE
            </Button>
          )}
          
          {canResumeRecording && (
            <Button onClick={onResumeRecording}>
              ▶ RESUME
            </Button>
          )}
          
          <TimeDisplay>
            {formatTime(recordingDuration)}
          </TimeDisplay>
        </ButtonGroup>

        <ConfigGroup>
          <Label>Session Name</Label>
          <Input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={isRecording}
          />
        </ConfigGroup>

        <ConfigSection>
          <ConfigGroup>
            <Label>Sample Rate</Label>
            <Select
              value={recordingConfig.sampleRate}
              onChange={(e) => setRecordingConfig(prev => ({
                ...prev,
                sampleRate: parseInt(e.target.value)
              }))}
              disabled={isRecording}
            >
              <option value={44100}>44.1 kHz</option>
              <option value={48000}>48 kHz</option>
              <option value={96000}>96 kHz</option>
              <option value={192000}>192 kHz</option>
            </Select>
          </ConfigGroup>

          <ConfigGroup>
            <Label>Bit Depth</Label>
            <Select
              value={recordingConfig.bitDepth}
              onChange={(e) => setRecordingConfig(prev => ({
                ...prev,
                bitDepth: parseInt(e.target.value) as 16 | 24 | 32
              }))}
              disabled={isRecording}
            >
              <option value={16}>16-bit</option>
              <option value={24}>24-bit</option>
              <option value={32}>32-bit</option>
            </Select>
          </ConfigGroup>

          <ConfigGroup>
            <Label>Format</Label>
            <Select
              value={recordingConfig.format}
              onChange={(e) => setRecordingConfig(prev => ({
                ...prev,
                format: e.target.value as 'wav' | 'mp3' | 'flac' | 'aac'
              }))}
              disabled={isRecording}
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
              <option value="flac">FLAC</option>
              <option value="aac">AAC</option>
            </Select>
          </ConfigGroup>

          <ConfigGroup>
            <Label>Quality</Label>
            <Select
              value={recordingConfig.quality}
              onChange={(e) => setRecordingConfig(prev => ({
                ...prev,
                quality: e.target.value as 'low' | 'medium' | 'high' | 'lossless'
              }))}
              disabled={isRecording}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="lossless">Lossless</option>
            </Select>
          </ConfigGroup>
        </ConfigSection>

        <ChannelSelector>
          <Label>Record Channels</Label>
          {channels.map(channel => (
            <ChannelItem key={channel.id}>
              <Checkbox
                checked={selectedChannels.has(channel.id)}
                onChange={() => handleChannelToggle(channel.id)}
                disabled={isRecording}
              />
              <ChannelName>{channel.name}</ChannelName>
            </ChannelItem>
          ))}
        </ChannelSelector>

        {currentSession && (
          <ButtonGroup>
            <Button
              onClick={() => onExportSession(currentSession.id, exportOptions)}
            >
              Export Session
            </Button>
          </ButtonGroup>
        )}
      </ControlsSection>
    </PanelContainer>
  );
};

export default RecordingPanel;
