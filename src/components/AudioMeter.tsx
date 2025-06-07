import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MeterProps } from '@/types/audio';

const MeterContainer = styled.div<{ 
  orientation: 'vertical' | 'horizontal';
  width?: number;
  height?: number;
}>`
  position: relative;
  background: #111;
  border: 1px solid #333;
  border-radius: 2px;
  overflow: hidden;
  
  ${props => props.orientation === 'vertical' ? `
    width: ${props.width || 12}px;
    height: ${props.height || 100}px;
  ` : `
    width: ${props.width || 100}px;
    height: ${props.height || 12}px;
  `}
`;

const MeterCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const ClippingIndicator = styled.div<{ active: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: ${props => props.active ? '#ff0000' : 'transparent'};
  transition: background 0.1s ease;
`;

const AudioMeter: React.FC<MeterProps> = ({
  level,
  orientation = 'vertical',
  height = 100,
  width = 12,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);

    const { peak, rms } = level;
    
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (orientation === 'vertical') {
      drawVerticalMeter(ctx, rect.width, rect.height, peak, rms);
    } else {
      drawHorizontalMeter(ctx, rect.width, rect.height, peak, rms);
    }
  }, [level, orientation]);

  const drawVerticalMeter = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    peak: number,
    rms: number
  ) => {
    const segments = 20;
    const segmentHeight = height / segments;

    for (let i = 0; i < segments; i++) {
      const y = height - (i + 1) * segmentHeight;
      const intensity = i / segments;
      
      let color: string;
      if (intensity > 0.9) {
        color = '#ff0000';
      } else if (intensity > 0.7) {
        color = '#ff8800';
      } else if (intensity > 0.5) {
        color = '#ffff00';
      } else {
        color = '#00ff00';
      }

      if (peak >= intensity) {
        ctx.fillStyle = color;
        ctx.fillRect(0, y + 1, width, segmentHeight - 1);
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, y + 1, width, segmentHeight - 1);
      }
    }
  };

  const drawHorizontalMeter = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    peak: number,
    rms: number
  ) => {
    const segments = 20;
    const segmentWidth = width / segments;

    for (let i = 0; i < segments; i++) {
      const x = i * segmentWidth;
      const intensity = i / segments;
      
      let color: string;
      if (intensity > 0.9) {
        color = '#ff0000';
      } else if (intensity > 0.7) {
        color = '#ff8800';
      } else if (intensity > 0.5) {
        color = '#ffff00';
      } else {
        color = '#00ff00';
      }

      if (peak >= intensity) {
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, 0, segmentWidth - 1, height);
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 1, 0, segmentWidth - 1, height);
      }
    }
  };

  return (
    <MeterContainer 
      orientation={orientation}
      width={width}
      height={height}
    >
      <ClippingIndicator active={level.clipping} />
      <MeterCanvas ref={canvasRef} />
    </MeterContainer>
  );
};

export default AudioMeter;
