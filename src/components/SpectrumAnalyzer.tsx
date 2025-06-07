import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const AnalyzerContainer = styled.div<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
`;

const AnalyzerCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const FrequencyLabels = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  font-size: 10px;
  color: #666;
  pointer-events: none;
`;

const AmplitudeLabels = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 20px;
  width: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  padding: 5px 2px;
  font-size: 10px;
  color: #666;
  pointer-events: none;
`;

const ControlsContainer = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
`;

const ControlButton = styled.button<{ active?: boolean }>`
  padding: 2px 6px;
  border: none;
  border-radius: 3px;
  font-size: 9px;
  font-weight: bold;
  cursor: pointer;
  background: ${props => props.active ? '#4CAF50' : '#333'};
  color: ${props => props.active ? '#fff' : '#ccc'};
  
  &:hover {
    background: ${props => props.active ? '#45a049' : '#444'};
  }
`;

export interface SpectrumData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
}

interface SpectrumAnalyzerProps {
  width?: number;
  height?: number;
  data?: SpectrumData;
  showGrid?: boolean;
  showLabels?: boolean;
  minDb?: number;
  maxDb?: number;
  minFreq?: number;
  maxFreq?: number;
  smoothing?: number;
  colorScheme?: 'green' | 'blue' | 'rainbow';
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  width = 400,
  height = 200,
  data,
  showGrid = true,
  showLabels = true,
  minDb = -60,
  maxDb = 0,
  minFreq = 20,
  maxFreq = 20000,
  smoothing = 0.8,
  colorScheme = 'green',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPaused, setIsPaused] = useState(false);
  const [showPeakHold, setShowPeakHold] = useState(true);
  const peakData = useRef<Float32Array>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      if (!isPaused && data) {
        drawSpectrum(ctx, width, height, data);
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, data, isPaused, showPeakHold, minDb, maxDb, minFreq, maxFreq, colorScheme]);

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    spectrumData: SpectrumData
  ) => {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (showGrid) {
      drawGrid(ctx, canvasWidth, canvasHeight);
    }

    const { frequencies, magnitudes } = spectrumData;
    if (!frequencies || !magnitudes) return;

    // Initialize peak data if needed
    if (!peakData.current || peakData.current.length !== magnitudes.length) {
      peakData.current = new Float32Array(magnitudes.length);
      peakData.current.fill(minDb);
    }

    // Update peak data
    if (showPeakHold) {
      for (let i = 0; i < magnitudes.length; i++) {
        if (magnitudes[i] > peakData.current[i]) {
          peakData.current[i] = magnitudes[i];
        } else {
          peakData.current[i] *= 0.995; // Slow decay
        }
      }
    }

    // Draw spectrum
    ctx.beginPath();
    let firstPoint = true;

    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      if (freq < minFreq || freq > maxFreq) continue;

      const x = frequencyToX(freq, canvasWidth, minFreq, maxFreq);
      const y = magnitudeToY(magnitudes[i], canvasHeight, minDb, maxDb);

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Style the spectrum line
    ctx.strokeStyle = getSpectrumColor(colorScheme);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill under the curve
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.lineTo(0, canvasHeight);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, getSpectrumColor(colorScheme, 0.3));
    gradient.addColorStop(1, getSpectrumColor(colorScheme, 0.05));
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw peak hold
    if (showPeakHold && peakData.current) {
      ctx.strokeStyle = getSpectrumColor(colorScheme, 0.7);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();

      firstPoint = true;
      for (let i = 0; i < frequencies.length; i++) {
        const freq = frequencies[i];
        if (freq < minFreq || freq > maxFreq) continue;

        const x = frequencyToX(freq, canvasWidth, minFreq, maxFreq);
        const y = magnitudeToY(peakData.current[i], canvasHeight, minDb, maxDb);

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;

    // Frequency grid lines (logarithmic)
    const freqLines = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqLines.forEach(freq => {
      if (freq >= minFreq && freq <= maxFreq) {
        const x = frequencyToX(freq, canvasWidth, minFreq, maxFreq);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
    });

    // Amplitude grid lines
    const ampLines = [-50, -40, -30, -20, -10];
    ampLines.forEach(db => {
      if (db >= minDb && db <= maxDb) {
        const y = magnitudeToY(db, canvasHeight, minDb, maxDb);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
    });
  };

  const frequencyToX = (freq: number, canvasWidth: number, minF: number, maxF: number): number => {
    const logMin = Math.log10(minF);
    const logMax = Math.log10(maxF);
    const logFreq = Math.log10(freq);
    return ((logFreq - logMin) / (logMax - logMin)) * canvasWidth;
  };

  const magnitudeToY = (magnitude: number, canvasHeight: number, minDb: number, maxDb: number): number => {
    const normalized = (magnitude - minDb) / (maxDb - minDb);
    return canvasHeight - (normalized * canvasHeight);
  };

  const getSpectrumColor = (scheme: string, alpha: number = 1): string => {
    switch (scheme) {
      case 'blue':
        return `rgba(64, 156, 255, ${alpha})`;
      case 'rainbow':
        return `rgba(255, 100, 100, ${alpha})`;
      default:
        return `rgba(76, 175, 80, ${alpha})`;
    }
  };

  const getFrequencyLabels = () => {
    return ['20Hz', '100Hz', '1kHz', '10kHz', '20kHz'];
  };

  const getAmplitudeLabels = () => {
    return ['0dB', '-10', '-20', '-30', '-40', '-50', '-60'];
  };

  return (
    <AnalyzerContainer width={width} height={height}>
      <AnalyzerCanvas ref={canvasRef} />
      
      <ControlsContainer>
        <ControlButton
          active={!isPaused}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? 'PLAY' : 'PAUSE'}
        </ControlButton>
        <ControlButton
          active={showPeakHold}
          onClick={() => setShowPeakHold(!showPeakHold)}
        >
          PEAK
        </ControlButton>
      </ControlsContainer>

      {showLabels && (
        <>
          <FrequencyLabels>
            {getFrequencyLabels().map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </FrequencyLabels>
          
          <AmplitudeLabels>
            {getAmplitudeLabels().map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </AmplitudeLabels>
        </>
      )}
    </AnalyzerContainer>
  );
};

export default SpectrumAnalyzer;
