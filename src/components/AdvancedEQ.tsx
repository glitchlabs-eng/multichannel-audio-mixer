import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { EQBand } from '@/services/AdvancedEQProcessor';
import Knob from './Knob';

const EQContainer = styled.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
`;

const EQHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const EQTitle = styled.h4`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EQControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Button = styled.button<{ active?: boolean; variant?: 'primary' | 'secondary' }>`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: ${props.active ? '#4CAF50' : '#666'};
        color: ${props.active ? '#fff' : '#ccc'};
        &:hover { background: ${props.active ? '#45a049' : '#777'}; }
      `;
    }
    return `
      background: #444;
      color: #ccc;
      &:hover { background: #555; }
    `;
  }}
`;

const EQGraph = styled.div`
  width: 100%;
  height: 120px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  margin: 12px 0;
  position: relative;
  overflow: hidden;
`;

const EQCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
`;

const BandsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 12px;
`;

const BandContainer = styled.div<{ active: boolean }>`
  background: ${props => props.active ? '#333' : '#222'};
  border: 1px solid ${props => props.active ? '#4CAF50' : '#444'};
  border-radius: 6px;
  padding: 8px;
  transition: all 0.2s ease;
`;

const BandHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const BandTitle = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #ccc;
  text-transform: uppercase;
`;

const BandToggle = styled.button<{ active: boolean }>`
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: ${props => props.active ? '#4CAF50' : '#666'};
  
  &:hover {
    background: ${props => props.active ? '#45a049' : '#777'};
  }
`;

const BandControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TypeSelector = styled.select`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 3px;
  color: #fff;
  padding: 2px 4px;
  font-size: 9px;
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

interface AdvancedEQProps {
  bands: EQBand[];
  enabled: boolean;
  onToggle: () => void;
  onBandUpdate: (bandId: string, updates: Partial<EQBand>) => void;
  onAddBand: () => void;
  onRemoveBand: (bandId: string) => void;
  onPresetLoad: (preset: string) => void;
  frequencyResponse?: { frequencies: Float32Array; magnitudes: Float32Array };
}

const AdvancedEQ: React.FC<AdvancedEQProps> = ({
  bands,
  enabled,
  onToggle,
  onBandUpdate,
  onAddBand,
  onRemoveBand,
  onPresetLoad,
  frequencyResponse,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('custom');

  useEffect(() => {
    drawEQCurve();
  }, [bands, frequencyResponse]);

  const drawEQCurve = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw frequency response
    if (frequencyResponse) {
      drawFrequencyResponse(ctx, width, height, frequencyResponse);
    }

    // Draw band markers
    drawBandMarkers(ctx, width, height);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;

    // Frequency lines (logarithmic)
    const freqLines = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqLines.forEach(freq => {
      const x = frequencyToX(freq, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Gain lines
    const gainLines = [-12, -6, 0, 6, 12];
    gainLines.forEach(gain => {
      const y = gainToY(gain, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    // Center line (0dB)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    const centerY = gainToY(0, height);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  };

  const drawFrequencyResponse = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: { frequencies: Float32Array; magnitudes: Float32Array }
  ) => {
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    for (let i = 0; i < response.frequencies.length; i++) {
      const freq = response.frequencies[i];
      const mag = response.magnitudes[i];
      
      if (freq < 20 || freq > 20000) continue;

      const x = frequencyToX(freq, width);
      const y = gainToY(mag, height);

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  const drawBandMarkers = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    bands.forEach(band => {
      if (!band.enabled) return;

      const x = frequencyToX(band.frequency, width);
      const y = gainToY(band.gain, height);

      // Draw frequency line
      ctx.strokeStyle = selectedBand === band.id ? '#FFA500' : '#666';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw gain point
      ctx.fillStyle = selectedBand === band.id ? '#FFA500' : '#4CAF50';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw frequency label
      ctx.fillStyle = '#ccc';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(formatFrequency(band.frequency), x, height - 5);
    });
  };

  const frequencyToX = (freq: number, width: number): number => {
    const logMin = Math.log10(20);
    const logMax = Math.log10(20000);
    const logFreq = Math.log10(freq);
    return ((logFreq - logMin) / (logMax - logMin)) * width;
  };

  const gainToY = (gain: number, height: number): number => {
    const minGain = -15;
    const maxGain = 15;
    const normalized = (gain - minGain) / (maxGain - minGain);
    return height - (normalized * height);
  };

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1)}k`;
    }
    return `${freq}`;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to frequency and gain
    const freq = xToFrequency(x, rect.width);
    const gain = yToGain(y, rect.height);

    // Find closest band or create new one
    const closestBand = bands.find(band => Math.abs(frequencyToX(band.frequency, rect.width) - x) < 20);
    
    if (closestBand) {
      setSelectedBand(closestBand.id);
      onBandUpdate(closestBand.id, { gain });
    }
  };

  const xToFrequency = (x: number, width: number): number => {
    const logMin = Math.log10(20);
    const logMax = Math.log10(20000);
    const logFreq = logMin + (x / width) * (logMax - logMin);
    return Math.pow(10, logFreq);
  };

  const yToGain = (y: number, height: number): number => {
    const minGain = -15;
    const maxGain = 15;
    const normalized = 1 - (y / height);
    return minGain + normalized * (maxGain - minGain);
  };

  const getPresets = () => ['Vocal', 'Bass', 'Drums', 'Acoustic', 'Bright', 'Warm', 'Custom'];

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      onPresetLoad(preset.toLowerCase());
    }
  };

  return (
    <EQContainer>
      <EQHeader>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EQTitle>EQUALIZER</EQTitle>
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
        <EQControls>
          <Button variant="secondary" onClick={onAddBand}>
            + BAND
          </Button>
          <Button variant="primary" active={enabled} onClick={onToggle}>
            {enabled ? 'ON' : 'OFF'}
          </Button>
        </EQControls>
      </EQHeader>

      {enabled && (
        <>
          <EQGraph>
            <EQCanvas ref={canvasRef} onClick={handleCanvasClick} />
          </EQGraph>

          <BandsContainer>
            {bands.map(band => (
              <BandContainer
                key={band.id}
                active={selectedBand === band.id}
                onClick={() => setSelectedBand(band.id)}
              >
                <BandHeader>
                  <BandTitle>{formatFrequency(band.frequency)}</BandTitle>
                  <BandToggle
                    active={band.enabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBandUpdate(band.id, { enabled: !band.enabled });
                    }}
                  />
                </BandHeader>

                <BandControls>
                  <TypeSelector
                    value={band.type}
                    onChange={(e) => onBandUpdate(band.id, { type: e.target.value as any })}
                  >
                    <option value="peaking">Peak</option>
                    <option value="highshelf">Hi Shelf</option>
                    <option value="lowshelf">Lo Shelf</option>
                    <option value="highpass">Hi Pass</option>
                    <option value="lowpass">Lo Pass</option>
                  </TypeSelector>

                  <Knob
                    value={band.frequency}
                    min={20}
                    max={20000}
                    step={1}
                    onChange={(value) => onBandUpdate(band.id, { frequency: value })}
                    label="FREQ"
                    size="small"
                  />

                  <Knob
                    value={band.gain}
                    min={-15}
                    max={15}
                    step={0.1}
                    onChange={(value) => onBandUpdate(band.id, { gain: value })}
                    label="GAIN"
                    size="small"
                  />

                  <Knob
                    value={band.q}
                    min={0.1}
                    max={10}
                    step={0.1}
                    onChange={(value) => onBandUpdate(band.id, { q: value })}
                    label="Q"
                    size="small"
                  />
                </BandControls>
              </BandContainer>
            ))}
          </BandsContainer>
        </>
      )}
    </EQContainer>
  );
};

export default AdvancedEQ;
