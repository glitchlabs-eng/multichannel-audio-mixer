import React, { useState } from 'react';
import styled from 'styled-components';
import { Effect } from '@/types/audio';
import Knob from './Knob';

const PanelContainer = styled.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const EffectTitle = styled.h4`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => props.active ? '#4CAF50' : '#666'};
  color: ${props => props.active ? '#fff' : '#ccc'};
  
  &:hover {
    background: ${props => props.active ? '#45a049' : '#777'};
  }
`;

const ControlsGrid = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns}, 1fr);
  gap: 8px;
  align-items: start;
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

interface EffectsPanelProps {
  effect: Effect;
  onToggle: (effectId: string) => void;
  onParameterChange: (effectId: string, parameter: string, value: number) => void;
  onPresetChange?: (effectId: string, preset: string) => void;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  effect,
  onToggle,
  onParameterChange,
  onPresetChange,
}) => {
  const [selectedPreset, setSelectedPreset] = useState('custom');

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (onPresetChange) {
      onPresetChange(effect.id, preset);
    }
  };

  const renderReverbControls = () => (
    <ControlsGrid columns={4}>
      <Knob
        value={effect.parameters.roomSize || 0.5}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'roomSize', value)}
        label="ROOM"
        size="small"
      />
      <Knob
        value={effect.parameters.damping || 0.5}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'damping', value)}
        label="DAMP"
        size="small"
      />
      <Knob
        value={effect.parameters.wetLevel || 0.3}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'wetLevel', value)}
        label="WET"
        size="small"
      />
      <Knob
        value={effect.parameters.dryLevel || 0.7}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'dryLevel', value)}
        label="DRY"
        size="small"
      />
    </ControlsGrid>
  );

  const renderDelayControls = () => (
    <ControlsGrid columns={4}>
      <Knob
        value={effect.parameters.delayTime || 0.25}
        min={0.01}
        max={2}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'delayTime', value)}
        label="TIME"
        size="small"
      />
      <Knob
        value={effect.parameters.feedback || 0.3}
        min={0}
        max={0.95}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'feedback', value)}
        label="FDBK"
        size="small"
      />
      <Knob
        value={effect.parameters.filterFreq || 2000}
        min={200}
        max={8000}
        step={50}
        onChange={(value) => onParameterChange(effect.id, 'filterFreq', value)}
        label="TONE"
        size="small"
      />
      <Knob
        value={effect.parameters.wetLevel || 0.3}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'wetLevel', value)}
        label="MIX"
        size="small"
      />
    </ControlsGrid>
  );

  const renderCompressorControls = () => (
    <ControlsGrid columns={4}>
      <Knob
        value={effect.parameters.threshold || -24}
        min={-60}
        max={0}
        step={1}
        onChange={(value) => onParameterChange(effect.id, 'threshold', value)}
        label="THRESH"
        size="small"
      />
      <Knob
        value={effect.parameters.ratio || 4}
        min={1}
        max={20}
        step={0.5}
        onChange={(value) => onParameterChange(effect.id, 'ratio', value)}
        label="RATIO"
        size="small"
      />
      <Knob
        value={effect.parameters.attack || 0.003}
        min={0.001}
        max={1}
        step={0.001}
        onChange={(value) => onParameterChange(effect.id, 'attack', value)}
        label="ATTACK"
        size="small"
      />
      <Knob
        value={effect.parameters.release || 0.25}
        min={0.01}
        max={3}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'release', value)}
        label="RELEASE"
        size="small"
      />
    </ControlsGrid>
  );

  const renderDistortionControls = () => (
    <ControlsGrid columns={3}>
      <Knob
        value={effect.parameters.drive || 50}
        min={0}
        max={100}
        step={1}
        onChange={(value) => onParameterChange(effect.id, 'drive', value)}
        label="DRIVE"
        size="small"
      />
      <Knob
        value={effect.parameters.tone || 2000}
        min={200}
        max={8000}
        step={50}
        onChange={(value) => onParameterChange(effect.id, 'tone', value)}
        label="TONE"
        size="small"
      />
      <Knob
        value={effect.parameters.level || 0.5}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'level', value)}
        label="LEVEL"
        size="small"
      />
    </ControlsGrid>
  );

  const renderChorusControls = () => (
    <ControlsGrid columns={4}>
      <Knob
        value={effect.parameters.rate || 0.5}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(value) => onParameterChange(effect.id, 'rate', value)}
        label="RATE"
        size="small"
      />
      <Knob
        value={effect.parameters.depth || 0.3}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'depth', value)}
        label="DEPTH"
        size="small"
      />
      <Knob
        value={effect.parameters.delay || 0.02}
        min={0.005}
        max={0.05}
        step={0.001}
        onChange={(value) => onParameterChange(effect.id, 'delay', value)}
        label="DELAY"
        size="small"
      />
      <Knob
        value={effect.parameters.mix || 0.5}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParameterChange(effect.id, 'mix', value)}
        label="MIX"
        size="small"
      />
    </ControlsGrid>
  );

  const renderControls = () => {
    switch (effect.type) {
      case 'reverb':
        return renderReverbControls();
      case 'delay':
        return renderDelayControls();
      case 'compressor':
        return renderCompressorControls();
      case 'distortion':
        return renderDistortionControls();
      case 'chorus':
        return renderChorusControls();
      default:
        return <div>Unknown effect type</div>;
    }
  };

  const getPresets = () => {
    const presets: Record<string, string[]> = {
      reverb: ['Hall', 'Room', 'Plate', 'Spring', 'Custom'],
      delay: ['Eighth', 'Quarter', 'Dotted', 'Ping Pong', 'Custom'],
      compressor: ['Vocal', 'Drum', 'Bass', 'Master', 'Custom'],
      distortion: ['Overdrive', 'Fuzz', 'Crunch', 'Heavy', 'Custom'],
      chorus: ['Subtle', 'Lush', 'Vintage', 'Wide', 'Custom'],
    };
    
    return presets[effect.type] || ['Custom'];
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EffectTitle>{effect.type.toUpperCase()}</EffectTitle>
          <PresetSelector
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            {getPresets().map(preset => (
              <option key={preset} value={preset.toLowerCase()}>
                {preset}
              </option>
            ))}
          </PresetSelector>
        </div>
        <ToggleButton
          active={effect.enabled}
          onClick={() => onToggle(effect.id)}
        >
          {effect.enabled ? 'ON' : 'OFF'}
        </ToggleButton>
      </PanelHeader>
      
      {effect.enabled && renderControls()}
    </PanelContainer>
  );
};

export default EffectsPanel;
