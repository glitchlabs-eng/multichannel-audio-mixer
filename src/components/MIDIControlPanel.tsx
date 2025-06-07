import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MIDIDevice, MIDIMapping, MIDIMessage, MIDILearnSession } from '@/services/MIDIEngine';

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

const StatusIndicator = styled.div<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: bold;
  color: ${props => props.connected ? '#4CAF50' : '#f44336'};
`;

const StatusDot = styled.div<{ connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#4CAF50' : '#f44336'};
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: ${props => props.active ? '#333' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#ccc'};
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  
  &:hover {
    background: ${props => props.active ? '#333' : '#222'};
  }
`;

const DeviceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DeviceItem = styled.div<{ connected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.connected ? '#2a4a2a' : '#333'};
  border: 1px solid ${props => props.connected ? '#4CAF50' : '#444'};
  border-radius: 4px;
`;

const DeviceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DeviceName = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #fff;
`;

const DeviceDetails = styled.span`
  font-size: 10px;
  color: #ccc;
`;

const DeviceType = styled.span<{ type: 'input' | 'output' }>`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => props.type === 'input' ? '#2196F3' : '#FF9800'};
  color: #fff;
`;

const MappingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const MappingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
`;

const MappingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const MappingName = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #fff;
`;

const MappingTarget = styled.span`
  font-size: 10px;
  color: #ccc;
`;

const MappingControls = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'learn' }>`
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  font-size: 10px;
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
        `;
      case 'danger':
        return `
          background: #f44336;
          color: #fff;
          &:hover { background: #da190b; }
        `;
      case 'learn':
        return `
          background: #FF9800;
          color: #fff;
          &:hover { background: #e68900; }
          animation: pulse 1s infinite;
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `;
      default:
        return `
          background: #666;
          color: #ccc;
          &:hover { background: #777; }
        `;
    }
  }}
`;

const ToggleSwitch = styled.button<{ enabled: boolean }>`
  width: 32px;
  height: 16px;
  border: none;
  border-radius: 8px;
  background: ${props => props.enabled ? '#4CAF50' : '#666'};
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.enabled ? '16px' : '2px'};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.2s ease;
  }
`;

const LearnIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #FF9800;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: pulse 1s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
`;

const LearnText = styled.span`
  font-size: 12px;
  font-weight: bold;
  color: #fff;
`;

const MIDIActivity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  background: #1a1a1a;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
`;

const MIDIMessageItem = styled.div`
  color: #4CAF50;
  padding: 2px 0;
`;

interface MIDIControlPanelProps {
  devices: MIDIDevice[];
  mappings: MIDIMapping[];
  learnSession: MIDILearnSession | null;
  recentMessages: MIDIMessage[];
  onStartLearn: (targetType: string, targetId: string, parameter: string) => void;
  onStopLearn: () => void;
  onRemoveMapping: (mappingId: string) => void;
  onToggleMapping: (mappingId: string, enabled: boolean) => void;
  onUpdateMapping: (mappingId: string, updates: Partial<MIDIMapping>) => void;
}

const MIDIControlPanel: React.FC<MIDIControlPanelProps> = ({
  devices,
  mappings,
  learnSession,
  recentMessages,
  onStartLearn,
  onStopLearn,
  onRemoveMapping,
  onToggleMapping,
  onUpdateMapping,
}) => {
  const [activeTab, setActiveTab] = useState<'devices' | 'mappings' | 'activity'>('devices');

  const connectedDevices = devices.filter(device => device.state === 'connected');
  const inputDevices = connectedDevices.filter(device => device.type === 'input');
  const outputDevices = connectedDevices.filter(device => device.type === 'output');

  const formatMIDIMessage = (message: MIDIMessage): string => {
    const time = new Date(message.timestamp).toLocaleTimeString();
    switch (message.type) {
      case 'noteOn':
        return `${time} - Note On: ${message.note} Vel: ${message.velocity} Ch: ${message.channel}`;
      case 'noteOff':
        return `${time} - Note Off: ${message.note} Ch: ${message.channel}`;
      case 'controlChange':
        return `${time} - CC: ${message.controller} Val: ${message.value} Ch: ${message.channel}`;
      case 'programChange':
        return `${time} - PC: ${message.program} Ch: ${message.channel}`;
      case 'pitchBend':
        return `${time} - Pitch: ${message.pitch} Ch: ${message.channel}`;
      default:
        return `${time} - ${message.type} Ch: ${message.channel}`;
    }
  };

  const renderDevicesTab = () => (
    <div>
      <DeviceList>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ccc' }}>
          Input Devices ({inputDevices.length})
        </h4>
        {inputDevices.length === 0 ? (
          <div style={{ color: '#666', fontSize: '11px', fontStyle: 'italic' }}>
            No MIDI input devices connected
          </div>
        ) : (
          inputDevices.map(device => (
            <DeviceItem key={device.id} connected={device.state === 'connected'}>
              <DeviceInfo>
                <DeviceName>{device.name}</DeviceName>
                <DeviceDetails>{device.manufacturer}</DeviceDetails>
              </DeviceInfo>
              <DeviceType type={device.type}>{device.type}</DeviceType>
            </DeviceItem>
          ))
        )}
        
        <h4 style={{ margin: '16px 0 8px 0', fontSize: '12px', color: '#ccc' }}>
          Output Devices ({outputDevices.length})
        </h4>
        {outputDevices.length === 0 ? (
          <div style={{ color: '#666', fontSize: '11px', fontStyle: 'italic' }}>
            No MIDI output devices connected
          </div>
        ) : (
          outputDevices.map(device => (
            <DeviceItem key={device.id} connected={device.state === 'connected'}>
              <DeviceInfo>
                <DeviceName>{device.name}</DeviceName>
                <DeviceDetails>{device.manufacturer}</DeviceDetails>
              </DeviceInfo>
              <DeviceType type={device.type}>{device.type}</DeviceType>
            </DeviceItem>
          ))
        )}
      </DeviceList>
    </div>
  );

  const renderMappingsTab = () => (
    <div>
      {learnSession && (
        <LearnIndicator>
          <LearnText>
            Learning MIDI for {learnSession.targetType}:{learnSession.parameter}...
          </LearnText>
          <Button variant="secondary" onClick={onStopLearn}>
            Cancel
          </Button>
        </LearnIndicator>
      )}
      
      <MappingList>
        {mappings.length === 0 ? (
          <div style={{ color: '#666', fontSize: '11px', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
            No MIDI mappings configured.<br />
            Use MIDI Learn to create mappings.
          </div>
        ) : (
          mappings.map(mapping => (
            <MappingItem key={mapping.id}>
              <MappingInfo>
                <MappingName>{mapping.name}</MappingName>
                <MappingTarget>
                  {mapping.targetType}:{mapping.targetId}:{mapping.parameter}
                </MappingTarget>
              </MappingInfo>
              <MappingControls>
                <ToggleSwitch
                  enabled={mapping.enabled}
                  onClick={() => onToggleMapping(mapping.id, !mapping.enabled)}
                />
                <Button
                  variant="danger"
                  onClick={() => onRemoveMapping(mapping.id)}
                >
                  ×
                </Button>
              </MappingControls>
            </MappingItem>
          ))
        )}
      </MappingList>
    </div>
  );

  const renderActivityTab = () => (
    <div>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ccc' }}>
        Recent MIDI Messages
      </h4>
      <MIDIActivity>
        {recentMessages.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No MIDI activity
          </div>
        ) : (
          recentMessages.slice(-20).reverse().map((message, index) => (
            <MIDIMessageItem key={index}>
              {formatMIDIMessage(message)}
            </MIDIMessageItem>
          ))
        )}
      </MIDIActivity>
    </div>
  );

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>MIDI Control</Title>
        <StatusIndicator connected={connectedDevices.length > 0}>
          <StatusDot connected={connectedDevices.length > 0} />
          {connectedDevices.length > 0 ? 'CONNECTED' : 'NO DEVICES'}
        </StatusIndicator>
      </PanelHeader>

      <TabContainer>
        <Tab
          active={activeTab === 'devices'}
          onClick={() => setActiveTab('devices')}
        >
          Devices ({devices.length})
        </Tab>
        <Tab
          active={activeTab === 'mappings'}
          onClick={() => setActiveTab('mappings')}
        >
          Mappings ({mappings.length})
        </Tab>
        <Tab
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </Tab>
      </TabContainer>

      {activeTab === 'devices' && renderDevicesTab()}
      {activeTab === 'mappings' && renderMappingsTab()}
      {activeTab === 'activity' && renderActivityTab()}
    </PanelContainer>
  );
};

export default MIDIControlPanel;
