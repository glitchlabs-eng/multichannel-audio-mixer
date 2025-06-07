import React, { useState } from 'react';
import styled from 'styled-components';
import { AudioChannel } from '@/types/audio';
import Fader from './Fader';
import Knob from './Knob';
import AudioMeter from './AudioMeter';
import { linearToDb } from '@/utils/defaults';

const ChannelContainer = styled.div`
  width: 80px;
  height: 100%;
  background: linear-gradient(180deg, #2a2a2a 0%, #1e1e1e 100%);
  border: 1px solid #333;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  gap: 8px;
  position: relative;
`;

const ChannelName = styled.input`
  background: transparent;
  border: none;
  color: #fff;
  font-size: 11px;
  text-align: center;
  width: 100%;
  padding: 2px;
  border-radius: 3px;
  
  &:focus {
    outline: none;
    background: #333;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const Button = styled.button<{ active?: boolean; variant?: 'solo' | 'mute' | 'remove' }>`
  flex: 1;
  padding: 4px;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    if (props.variant === 'solo') {
      return `
        background: ${props.active ? '#FFA500' : '#444'};
        color: ${props.active ? '#000' : '#ccc'};
        &:hover { background: ${props.active ? '#FF8C00' : '#555'}; }
      `;
    } else if (props.variant === 'mute') {
      return `
        background: ${props.active ? '#f44336' : '#444'};
        color: ${props.active ? '#fff' : '#ccc'};
        &:hover { background: ${props.active ? '#d32f2f' : '#555'}; }
      `;
    } else if (props.variant === 'remove') {
      return `
        background: #666;
        color: #ccc;
        &:hover { background: #f44336; color: #fff; }
      `;
    }
    return `
      background: #444;
      color: #ccc;
      &:hover { background: #555; }
    `;
  }}
`;

const FaderSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: auto;
`;

const MeterContainer = styled.div`
  width: 8px;
  height: 120px;
  margin-bottom: 8px;
`;

const GainLabel = styled.div`
  font-size: 10px;
  color: #ccc;
  text-align: center;
`;

interface MixerChannelProps {
  channel: AudioChannel;
  onChannelUpdate: (channelId: string, updates: Partial<AudioChannel>) => void;
  onSolo: (channelId: string) => void;
  onMute: (channelId: string) => void;
  onRemove: (channelId: string) => void;
}

const MixerChannel: React.FC<MixerChannelProps> = ({
  channel,
  onChannelUpdate,
  onSolo,
  onMute,
  onRemove,
}) => {
  const [showEQ, setShowEQ] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChannelUpdate(channel.id, { name: e.target.value });
  };

  const handleGainChange = (value: number) => {
    onChannelUpdate(channel.id, { gain: value });
  };

  const handlePanChange = (value: number) => {
    onChannelUpdate(channel.id, { pan: value });
  };

  const gainInDb = linearToDb(channel.gain);

  return (
    <ChannelContainer>
      <ChannelName
        value={channel.name}
        onChange={handleNameChange}
        placeholder="Channel"
      />

      <Knob
        value={channel.pan}
        min={-1}
        max={1}
        step={0.1}
        onChange={handlePanChange}
        label="PAN"
        size="medium"
      />

      <ButtonRow>
        <Button
          variant="solo"
          active={channel.solo}
          onClick={() => onSolo(channel.id)}
        >
          S
        </Button>
        <Button
          variant="mute"
          active={channel.muted}
          onClick={() => onMute(channel.id)}
        >
          M
        </Button>
      </ButtonRow>

      <FaderSection>
        <MeterContainer>
          <AudioMeter
            level={channel.level}
            orientation="vertical"
            height={120}
            width={8}
          />
        </MeterContainer>

        <Fader
          value={channel.gain}
          min={0}
          max={1}
          step={0.01}
          orientation="vertical"
          onChange={handleGainChange}
        />

        <GainLabel>
          {gainInDb > -60 ? `${gainInDb.toFixed(1)}dB` : '-∞'}
        </GainLabel>
      </FaderSection>

      <Button
        variant="remove"
        onClick={() => onRemove(channel.id)}
        style={{ marginTop: '8px' }}
      >
        ×
      </Button>
    </ChannelContainer>
  );
};

export default MixerChannel;
