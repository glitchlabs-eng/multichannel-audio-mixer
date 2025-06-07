import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FaderProps } from '@/types/audio';
import { clamp, mapRange } from '@/utils/defaults';

const FaderContainer = styled.div<{ orientation: 'vertical' | 'horizontal' }>`
  position: relative;
  ${props => props.orientation === 'vertical' ? `
    width: 30px;
    height: 200px;
  ` : `
    width: 200px;
    height: 30px;
  `}
  cursor: pointer;
  user-select: none;
`;

const FaderTrack = styled.div<{ orientation: 'vertical' | 'horizontal' }>`
  position: absolute;
  background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  border: 1px solid #555;
  border-radius: 3px;
  
  ${props => props.orientation === 'vertical' ? `
    width: 6px;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
  ` : `
    width: 100%;
    height: 6px;
    top: 50%;
    transform: translateY(-50%);
  `}
`;

const FaderHandle = styled.div<{ 
  orientation: 'vertical' | 'horizontal';
  position: number;
  isDragging: boolean;
}>`
  position: absolute;
  background: linear-gradient(135deg, #666 0%, #888 50%, #666 100%);
  border: 2px solid #999;
  border-radius: 4px;
  cursor: grab;
  transition: ${props => props.isDragging ? 'none' : 'all 0.1s ease'};
  
  &:hover {
    background: linear-gradient(135deg, #777 0%, #999 50%, #777 100%);
    border-color: #aaa;
  }
  
  &:active {
    cursor: grabbing;
  }
  
  ${props => props.orientation === 'vertical' ? `
    width: 24px;
    height: 16px;
    left: 50%;
    transform: translateX(-50%);
    top: ${100 - props.position}%;
  ` : `
    width: 16px;
    height: 24px;
    top: 50%;
    transform: translateY(-50%);
    left: ${props.position}%;
  `}
`;

const Fader: React.FC<FaderProps> = ({
  value,
  min,
  max,
  step,
  orientation,
  onChange,
  label,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const position = mapRange(value, min, max, 0, 100);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newPosition: number;

      if (orientation === 'vertical') {
        newPosition = ((rect.bottom - e.clientY) / rect.height) * 100;
      } else {
        newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      }

      newPosition = clamp(newPosition, 0, 100);
      const newValue = mapRange(newPosition, 0, 100, min, max);
      
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = clamp(steppedValue, min, max);
      
      onChange(clampedValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [orientation, min, max, step, onChange]);

  return (
    <FaderContainer 
      ref={containerRef}
      orientation={orientation}
    >
      <FaderTrack orientation={orientation} />
      <FaderHandle
        orientation={orientation}
        position={position}
        isDragging={isDragging}
        onMouseDown={handleMouseDown}
      />
    </FaderContainer>
  );
};

export default Fader;
