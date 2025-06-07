import React from 'react';
import styled from 'styled-components';
import { MasterSection } from '@/types/audio';
import Fader from './Fader';
import Knob from './Knob';
import AudioMeter from './AudioMeter';
import { linearToDb } from '@/utils/defaults';

const MasterContainer = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #2a2a2a 0%, #1e1e1e 100%);
  border-left: 2px solid #333;
  display: flex;
  flex-direction: column;
  padding: 15px 10px;
  gap: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Button = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? '#4CAF50' : '#444'};
  color: ${props => props.active ? '#fff' : '#ccc'};
  
  &:hover {
    background: ${props => props.active ? '#45a049' : '#555'};
  }
`;

const FaderSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: auto;
`;

const MeterContainer = styled.div`
  width: 16px;
  height: 150px;
  margin-bottom: 10px;
`;

const GainLabel = styled.div`
  font-size: 11px;
  color: #ccc;
  text-align: center;
  font-weight: 500;
`;

interface MasterSectionProps {
  master: MasterSection;
  onMasterUpdate: (updates: Partial<MasterSection>) => void;
}

const MasterSectionComponent: React.FC<MasterSectionProps> = ({
  master,
  onMasterUpdate,
}) => {
  const handleMainGainChange = (value: number) => {
    onMasterUpdate({ mainGain: value });
  };

  const handleHeadphoneGainChange = (value: number) => {
    onMasterUpdate({ headphoneGain: value });
  };

  const handleMuteToggle = () => {
    onMasterUpdate({ muted: !master.muted });
  };

  const mainGainInDb = linearToDb(master.mainGain);
  const headphoneGainInDb = linearToDb(master.headphoneGain);

  return (
    <MasterContainer>
      <SectionTitle>Master</SectionTitle>

      <Knob
        value={master.headphoneGain}
        min={0}
        max={1}
        step={0.01}
        onChange={handleHeadphoneGainChange}
        label="PHONES"
        size="medium"
      />
      
      <GainLabel>
        {headphoneGainInDb > -60 ? `${headphoneGainInDb.toFixed(1)}dB` : '-∞'}
      </GainLabel>

      <Button
        active={master.muted}
        onClick={handleMuteToggle}
        style={{ 
          background: master.muted ? '#f44336' : '#444',
          marginBottom: '10px'
        }}
      >
        MUTE
      </Button>

      <FaderSection>
        <MeterContainer>
          <AudioMeter
            level={master.level}
            orientation="vertical"
            height={150}
            width={16}
          />
        </MeterContainer>

        <Fader
          value={master.mainGain}
          min={0}
          max={1}
          step={0.01}
          orientation="vertical"
          onChange={handleMainGainChange}
          label="MAIN"
        />

        <GainLabel>
          {mainGainInDb > -60 ? `${mainGainInDb.toFixed(1)}dB` : '-∞'}
        </GainLabel>
      </FaderSection>
    </MasterContainer>
  );
};

export default MasterSectionComponent;
