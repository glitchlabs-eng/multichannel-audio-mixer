import React, { useState } from 'react';
import styled from 'styled-components';
import { AudioChannel, AudioDevice, Effect, SpectrumData } from '@/types/audio';
import { EQBand } from '@/services/AdvancedEQProcessor';
import MixerChannel from './MixerChannel';
import EffectsPanel from './EffectsPanel';
import AdvancedEQ from './AdvancedEQ';
import SpectrumAnalyzer from './SpectrumAnalyzer';

const ChannelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ExpandedSection = styled.div<{ expanded: boolean }>`
  width: ${props => props.expanded ? '400px' : '80px'};
  transition: width 0.3s ease;
  overflow: hidden;
`;

const ExpandButton = styled.button<{ expanded: boolean }>`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: #444;
  color: #ccc;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #555;
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 8px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 6px 8px;
  border: none;
  background: ${props => props.active ? '#333' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#ccc'};
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  
  &:hover {
    background: ${props => props.active ? '#333' : '#222'};
  }
`;

const ContentArea = styled.div`
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
`;

interface EnhancedMixerChannelProps {
  channel: AudioChannel;
  inputDevices: AudioDevice[];
  effects: Effect[];
  eqBands: EQBand[];
  spectrumData?: SpectrumData;
  onChannelUpdate: (channelId: string, updates: Partial<AudioChannel>) => void;
  onSolo: (channelId: string) => void;
  onMute: (channelId: string) => void;
  onRemove: (channelId: string) => void;
  onConnectMicrophone: (channelId: string, deviceId?: string) => void;
  onLoadAudioFile: (channelId: string, files: FileList) => void;
  onStopChannel: (channelId: string) => void;
  onEffectToggle: (channelId: string, effectId: string) => void;
  onEffectParameterChange: (channelId: string, effectId: string, parameter: string, value: number) => void;
  onEffectAdd: (channelId: string, effectType: string) => void;
  onEffectRemove: (channelId: string, effectId: string) => void;
  onEQToggle: (channelId: string) => void;
  onEQBandUpdate: (channelId: string, bandId: string, updates: Partial<EQBand>) => void;
  onEQBandAdd: (channelId: string) => void;
  onEQBandRemove: (channelId: string, bandId: string) => void;
  onEQPresetLoad: (channelId: string, preset: string) => void;
}

const EnhancedMixerChannel: React.FC<EnhancedMixerChannelProps> = ({
  channel,
  inputDevices,
  effects,
  eqBands,
  spectrumData,
  onChannelUpdate,
  onSolo,
  onMute,
  onRemove,
  onConnectMicrophone,
  onLoadAudioFile,
  onStopChannel,
  onEffectToggle,
  onEffectParameterChange,
  onEffectAdd,
  onEffectRemove,
  onEQToggle,
  onEQBandUpdate,
  onEQBandAdd,
  onEQBandRemove,
  onEQPresetLoad,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'eq' | 'effects' | 'spectrum'>('eq');

  const handleEffectPresetChange = (effectId: string, preset: string) => {
    // Load preset parameters for the effect
    const presetParameters = getEffectPresetParameters(effects.find(e => e.id === effectId)?.type || '', preset);
    
    Object.entries(presetParameters).forEach(([parameter, value]) => {
      onEffectParameterChange(channel.id, effectId, parameter, value);
    });
  };

  const getEffectPresetParameters = (effectType: string, preset: string): Record<string, number> => {
    const presets: Record<string, Record<string, Record<string, number>>> = {
      reverb: {
        hall: { roomSize: 0.8, damping: 0.3, wetLevel: 0.4, dryLevel: 0.6 },
        room: { roomSize: 0.4, damping: 0.6, wetLevel: 0.3, dryLevel: 0.7 },
        plate: { roomSize: 0.6, damping: 0.8, wetLevel: 0.5, dryLevel: 0.5 },
        spring: { roomSize: 0.3, damping: 0.4, wetLevel: 0.6, dryLevel: 0.4 },
      },
      delay: {
        eighth: { delayTime: 0.125, feedback: 0.3, wetLevel: 0.3, filterFreq: 3000 },
        quarter: { delayTime: 0.25, feedback: 0.4, wetLevel: 0.3, filterFreq: 2500 },
        dotted: { delayTime: 0.375, feedback: 0.3, wetLevel: 0.25, filterFreq: 2000 },
        'ping pong': { delayTime: 0.25, feedback: 0.5, wetLevel: 0.4, filterFreq: 4000 },
      },
      compressor: {
        vocal: { threshold: -18, ratio: 3, attack: 0.003, release: 0.1 },
        drum: { threshold: -12, ratio: 6, attack: 0.001, release: 0.05 },
        bass: { threshold: -15, ratio: 4, attack: 0.01, release: 0.2 },
        master: { threshold: -6, ratio: 2, attack: 0.005, release: 0.3 },
      },
      distortion: {
        overdrive: { drive: 30, tone: 3000, level: 0.7 },
        fuzz: { drive: 80, tone: 1500, level: 0.6 },
        crunch: { drive: 50, tone: 2500, level: 0.8 },
        heavy: { drive: 90, tone: 2000, level: 0.5 },
      },
    };

    return presets[effectType]?.[preset] || {};
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'eq':
        return (
          <AdvancedEQ
            bands={eqBands}
            enabled={channel.eq.enabled}
            onToggle={() => onEQToggle(channel.id)}
            onBandUpdate={(bandId, updates) => onEQBandUpdate(channel.id, bandId, updates)}
            onAddBand={() => onEQBandAdd(channel.id)}
            onRemoveBand={(bandId) => onEQBandRemove(channel.id, bandId)}
            onPresetLoad={(preset) => onEQPresetLoad(channel.id, preset)}
            frequencyResponse={spectrumData ? {
              frequencies: spectrumData.frequencies,
              magnitudes: spectrumData.magnitudes
            } : undefined}
          />
        );
      
      case 'effects':
        return (
          <div>
            {effects.map(effect => (
              <EffectsPanel
                key={effect.id}
                effect={effect}
                onToggle={() => onEffectToggle(channel.id, effect.id)}
                onParameterChange={(effectId, parameter, value) => 
                  onEffectParameterChange(channel.id, effectId, parameter, value)
                }
                onPresetChange={handleEffectPresetChange}
              />
            ))}
            
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => onEffectAdd(channel.id, 'compressor')}>+ Compressor</button>
              <button onClick={() => onEffectAdd(channel.id, 'reverb')}>+ Reverb</button>
              <button onClick={() => onEffectAdd(channel.id, 'delay')}>+ Delay</button>
              <button onClick={() => onEffectAdd(channel.id, 'distortion')}>+ Distortion</button>
            </div>
          </div>
        );
      
      case 'spectrum':
        return (
          <SpectrumAnalyzer
            width={380}
            height={200}
            data={spectrumData}
            showGrid={true}
            showLabels={true}
            colorScheme="green"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <ChannelWrapper>
      <ExpandedSection expanded={expanded}>
        <div style={{ position: 'relative' }}>
          <MixerChannel
            channel={channel}
            inputDevices={inputDevices}
            onChannelUpdate={onChannelUpdate}
            onSolo={onSolo}
            onMute={onMute}
            onRemove={onRemove}
            onConnectMicrophone={onConnectMicrophone}
            onLoadAudioFile={onLoadAudioFile}
            onStopChannel={onStopChannel}
          />
          
          <ExpandButton
            expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </ExpandButton>
        </div>

        {expanded && (
          <div style={{ marginTop: '8px', background: '#1a1a1a', borderRadius: '8px', padding: '12px' }}>
            <TabContainer>
              <Tab
                active={activeTab === 'eq'}
                onClick={() => setActiveTab('eq')}
              >
                EQ
              </Tab>
              <Tab
                active={activeTab === 'effects'}
                onClick={() => setActiveTab('effects')}
              >
                FX
              </Tab>
              <Tab
                active={activeTab === 'spectrum'}
                onClick={() => setActiveTab('spectrum')}
              >
                SPECTRUM
              </Tab>
            </TabContainer>

            <ContentArea>
              {renderTabContent()}
            </ContentArea>
          </div>
        )}
      </ExpandedSection>
    </ChannelWrapper>
  );
};

export default EnhancedMixerChannel;
