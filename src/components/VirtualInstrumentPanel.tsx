import React, { useState } from 'react';
import styled from 'styled-components';
import { VirtualInstrument, InstrumentPreset } from '@/services/VirtualInstrumentEngine';
import Knob from './Knob';

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

const InstrumentControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
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
      default:
        return `
          background: #666;
          color: #ccc;
          &:hover { background: #777; }
        `;
    }
  }}
`;

const InstrumentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InstrumentItem = styled.div`
  background: #333;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
`;

const InstrumentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const InstrumentName = styled.h4`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
`;

const InstrumentType = styled.span`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
  background: #4CAF50;
  color: #fff;
`;

const InstrumentActions = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
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

const PresetSelector = styled.select`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 4px 6px;
  font-size: 10px;
  cursor: pointer;
  margin-left: 8px;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
  
  option {
    background: #1a1a1a;
    color: #fff;
  }
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  margin-top: 12px;
`;

const ParameterGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const ParameterLabel = styled.span`
  font-size: 9px;
  font-weight: bold;
  color: #ccc;
  text-transform: uppercase;
  text-align: center;
`;

const CreateInstrumentSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: #222;
  border-radius: 6px;
  margin-bottom: 16px;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const EmptyStateTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #888;
`;

const EmptyStateText = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
`;

const VirtualKeyboard = styled.div`
  display: flex;
  height: 60px;
  margin-top: 12px;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
`;

const Key = styled.button<{ isBlack?: boolean; isPressed?: boolean }>`
  flex: ${props => props.isBlack ? '0.6' : '1'};
  height: ${props => props.isBlack ? '36px' : '60px'};
  border: 1px solid #333;
  background: ${props => {
    if (props.isPressed) return props.isBlack ? '#666' : '#ddd';
    return props.isBlack ? '#222' : '#fff';
  }};
  color: ${props => props.isBlack ? '#fff' : '#000'};
  cursor: pointer;
  transition: background 0.1s ease;
  z-index: ${props => props.isBlack ? 2 : 1};
  margin-left: ${props => props.isBlack ? '-0.3em' : '0'};
  margin-right: ${props => props.isBlack ? '-0.3em' : '0'};
  
  &:hover {
    background: ${props => props.isBlack ? '#444' : '#f0f0f0'};
  }
  
  &:active {
    background: ${props => props.isBlack ? '#666' : '#ddd'};
  }
`;

interface VirtualInstrumentPanelProps {
  instruments: VirtualInstrument[];
  onCreateInstrument: (type: 'synthesizer' | 'sampler' | 'drum_machine', name: string) => void;
  onRemoveInstrument: (instrumentId: string) => void;
  onToggleInstrument: (instrumentId: string, enabled: boolean) => void;
  onUpdateParameter: (instrumentId: string, parameter: string, value: number) => void;
  onLoadPreset: (instrumentId: string, presetId: string) => void;
  onPlayNote: (instrumentId: string, note: number, velocity: number) => void;
  onStopNote: (instrumentId: string, note: number) => void;
}

const VirtualInstrumentPanel: React.FC<VirtualInstrumentPanelProps> = ({
  instruments,
  onCreateInstrument,
  onRemoveInstrument,
  onToggleInstrument,
  onUpdateParameter,
  onLoadPreset,
  onPlayNote,
  onStopNote,
}) => {
  const [newInstrumentType, setNewInstrumentType] = useState<'synthesizer' | 'sampler' | 'drum_machine'>('synthesizer');
  const [newInstrumentName, setNewInstrumentName] = useState('');
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());

  const handleCreateInstrument = () => {
    if (newInstrumentName.trim()) {
      onCreateInstrument(newInstrumentType, newInstrumentName.trim());
      setNewInstrumentName('');
    }
  };

  const handleKeyDown = (instrumentId: string, note: number) => {
    if (!pressedKeys.has(note)) {
      setPressedKeys(prev => new Set(prev).add(note));
      onPlayNote(instrumentId, note, 100);
    }
  };

  const handleKeyUp = (instrumentId: string, note: number) => {
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
    onStopNote(instrumentId, note);
  };

  const renderVirtualKeyboard = (instrumentId: string) => {
    const whiteKeys = [60, 62, 64, 65, 67, 69, 71, 72]; // C4 to C5
    const blackKeys = [61, 63, 66, 68, 70]; // C#4, D#4, F#4, G#4, A#4

    return (
      <VirtualKeyboard>
        {whiteKeys.map(note => (
          <Key
            key={note}
            isPressed={pressedKeys.has(note)}
            onMouseDown={() => handleKeyDown(instrumentId, note)}
            onMouseUp={() => handleKeyUp(instrumentId, note)}
            onMouseLeave={() => handleKeyUp(instrumentId, note)}
          />
        ))}
        {blackKeys.map(note => (
          <Key
            key={note}
            isBlack
            isPressed={pressedKeys.has(note)}
            onMouseDown={() => handleKeyDown(instrumentId, note)}
            onMouseUp={() => handleKeyUp(instrumentId, note)}
            onMouseLeave={() => handleKeyUp(instrumentId, note)}
            style={{
              position: 'absolute',
              marginLeft: `${(note - 60) * 2.8 + 1.4}em`,
            }}
          />
        ))}
      </VirtualKeyboard>
    );
  };

  const renderSynthParameters = (instrument: VirtualInstrument) => (
    <ParameterGrid>
      <ParameterGroup>
        <Knob
          value={instrument.parameters.oscillatorType || 0}
          min={0}
          max={3}
          step={1}
          onChange={(value) => onUpdateParameter(instrument.id, 'oscillatorType', value)}
          label="OSC"
          size="small"
        />
        <ParameterLabel>Oscillator</ParameterLabel>
      </ParameterGroup>

      <ParameterGroup>
        <Knob
          value={(instrument.parameters.filterFrequency || 2000) / 8000}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onUpdateParameter(instrument.id, 'filterFrequency', value)}
          label="FREQ"
          size="small"
        />
        <ParameterLabel>Filter Freq</ParameterLabel>
      </ParameterGroup>

      <ParameterGroup>
        <Knob
          value={(instrument.parameters.filterResonance || 1) / 30}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onUpdateParameter(instrument.id, 'filterResonance', value)}
          label="RES"
          size="small"
        />
        <ParameterLabel>Resonance</ParameterLabel>
      </ParameterGroup>

      <ParameterGroup>
        <Knob
          value={(instrument.parameters.attack || 0.01) / 2}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onUpdateParameter(instrument.id, 'attack', value)}
          label="ATK"
          size="small"
        />
        <ParameterLabel>Attack</ParameterLabel>
      </ParameterGroup>

      <ParameterGroup>
        <Knob
          value={(instrument.parameters.decay || 0.3) / 2}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onUpdateParameter(instrument.id, 'decay', value)}
          label="DEC"
          size="small"
        />
        <ParameterLabel>Decay</ParameterLabel>
      </ParameterGroup>

      <ParameterGroup>
        <Knob
          value={instrument.parameters.sustain || 0.7}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onUpdateParameter(instrument.id, 'sustain', value)}
          label="SUS"
          size="small"
        />
        <ParameterLabel>Sustain</ParameterLabel>
      </ParameterGroup>

      <ParameterGroup>
        <Knob
          value={(instrument.parameters.release || 0.5) / 3}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onUpdateParameter(instrument.id, 'release', value)}
          label="REL"
          size="small"
        />
        <ParameterLabel>Release</ParameterLabel>
      </ParameterGroup>

      <ParameterGroup>
        <Knob
          value={instrument.parameters.volume || 0.3}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onUpdateParameter(instrument.id, 'volume', value)}
          label="VOL"
          size="small"
        />
        <ParameterLabel>Volume</ParameterLabel>
      </ParameterGroup>
    </ParameterGrid>
  );

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>Virtual Instruments</Title>
      </PanelHeader>

      <CreateInstrumentSection>
        <Select
          value={newInstrumentType}
          onChange={(e) => setNewInstrumentType(e.target.value as any)}
        >
          <option value="synthesizer">Synthesizer</option>
          <option value="sampler">Sampler</option>
          <option value="drum_machine">Drum Machine</option>
        </Select>
        
        <Input
          type="text"
          placeholder="Instrument name"
          value={newInstrumentName}
          onChange={(e) => setNewInstrumentName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateInstrument()}
        />
        
        <Button variant="primary" onClick={handleCreateInstrument}>
          Create
        </Button>
      </CreateInstrumentSection>

      <InstrumentList>
        {instruments.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>No Virtual Instruments</EmptyStateTitle>
            <EmptyStateText>
              Create a virtual instrument to start making music with MIDI
            </EmptyStateText>
          </EmptyState>
        ) : (
          instruments.map(instrument => (
            <InstrumentItem key={instrument.id}>
              <InstrumentHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <InstrumentName>{instrument.name}</InstrumentName>
                  <InstrumentType>{instrument.type}</InstrumentType>
                  <PresetSelector
                    value={instrument.currentPreset || ''}
                    onChange={(e) => onLoadPreset(instrument.id, e.target.value)}
                  >
                    <option value="">Select Preset</option>
                    {instrument.presets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </PresetSelector>
                </div>
                
                <InstrumentActions>
                  <ToggleSwitch
                    enabled={instrument.enabled}
                    onClick={() => onToggleInstrument(instrument.id, !instrument.enabled)}
                  />
                  <Button
                    variant="danger"
                    onClick={() => onRemoveInstrument(instrument.id)}
                  >
                    Remove
                  </Button>
                </InstrumentActions>
              </InstrumentHeader>

              {instrument.enabled && (
                <>
                  {instrument.type === 'synthesizer' && renderSynthParameters(instrument)}
                  {renderVirtualKeyboard(instrument.id)}
                </>
              )}
            </InstrumentItem>
          ))
        )}
      </InstrumentList>
    </PanelContainer>
  );
};

export default VirtualInstrumentPanel;
