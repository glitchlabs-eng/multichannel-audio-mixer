import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AudioDevice } from '@/types/audio';

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #2a2a2a;
  border-radius: 6px;
  border: 1px solid #444;
`;

const SelectorLabel = styled.label`
  font-size: 11px;
  color: #ccc;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Select = styled.select`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 6px 8px;
  font-size: 12px;
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

const InputTypeButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const TypeButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => props.active ? '#4CAF50' : '#444'};
  color: ${props => props.active ? '#fff' : '#ccc'};
  
  &:hover {
    background: ${props => props.active ? '#45a049' : '#555'};
  }
`;

const StatusIndicator = styled.div<{ status: 'idle' | 'connecting' | 'connected' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 8px;
  
  background: ${props => {
    switch (props.status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FFA500';
      case 'error': return '#f44336';
      default: return '#666';
    }
  }};
  
  ${props => props.status === 'connecting' && `
    animation: pulse 1s infinite;
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `}
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatusText = styled.span`
  font-size: 10px;
  color: #999;
`;

export type InputType = 'microphone' | 'file' | 'none';

interface AudioInputSelectorProps {
  inputDevices: AudioDevice[];
  selectedDeviceId?: string;
  inputType: InputType;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  onInputTypeChange: (type: InputType) => void;
  onDeviceChange: (deviceId: string) => void;
  onFileSelect: (files: FileList) => void;
}

const AudioInputSelector: React.FC<AudioInputSelectorProps> = ({
  inputDevices,
  selectedDeviceId,
  inputType,
  connectionStatus,
  onInputTypeChange,
  onDeviceChange,
  onFileSelect,
}) => {
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  const handleFileButtonClick = () => {
    fileInputRef?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <SelectorContainer>
      <SelectorLabel>Input Source</SelectorLabel>
      
      <InputTypeButtons>
        <TypeButton
          active={inputType === 'microphone'}
          onClick={() => onInputTypeChange('microphone')}
        >
          MIC
        </TypeButton>
        <TypeButton
          active={inputType === 'file'}
          onClick={() => onInputTypeChange('file')}
        >
          FILE
        </TypeButton>
        <TypeButton
          active={inputType === 'none'}
          onClick={() => onInputTypeChange('none')}
        >
          OFF
        </TypeButton>
      </InputTypeButtons>

      {inputType === 'microphone' && (
        <>
          <SelectorLabel>Microphone</SelectorLabel>
          <Select
            value={selectedDeviceId || ''}
            onChange={(e) => onDeviceChange(e.target.value)}
            disabled={inputDevices.length === 0}
          >
            <option value="">Select microphone...</option>
            {inputDevices.map(device => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </Select>
        </>
      )}

      {inputType === 'file' && (
        <>
          <TypeButton
            active={false}
            onClick={handleFileButtonClick}
            style={{ marginTop: '4px' }}
          >
            Choose Audio File
          </TypeButton>
          <input
            ref={setFileInputRef}
            type="file"
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </>
      )}

      <StatusRow>
        <StatusText>{getStatusText()}</StatusText>
        <StatusIndicator status={connectionStatus} />
      </StatusRow>
    </SelectorContainer>
  );
};

export default AudioInputSelector;
