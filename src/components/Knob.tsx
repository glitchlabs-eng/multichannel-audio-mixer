import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { KnobProps } from '@/types/audio';
import { clamp, mapRange } from '@/utils/defaults';

const KnobContainer = styled.div<{ size: 'small' | 'medium' | 'large' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  
  ${props => {
    switch (props.size) {
      case 'small': return 'width: 40px;';
      case 'large': return 'width: 60px;';
      default: return 'width: 50px;';
    }
  }}
`;

const KnobElement = styled.div<{ 
  size: 'small' | 'medium' | 'large';
  rotation: number;
  isDragging: boolean;
}>`
  position: relative;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #666, #333, #111);
  border: 2px solid #555;
  cursor: pointer;
  user-select: none;
  transition: ${props => props.isDragging ? 'none' : 'all 0.1s ease'};
  transform: rotate(${props => props.rotation}deg);
  
  &:hover {
    border-color: #777;
    background: radial-gradient(circle at 30% 30%, #777, #444, #222);
  }
  
  ${props => {
    switch (props.size) {
      case 'small': return 'width: 32px; height: 32px;';
      case 'large': return 'width: 48px; height: 48px;';
      default: return 'width: 40px; height: 40px;';
    }
  }}
  
  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 8px;
    background: #fff;
    border-radius: 1px;
  }
`;

const KnobLabel = styled.div`
  font-size: 10px;
  color: #ccc;
  font-weight: 500;
  text-align: center;
`;

const KnobValue = styled.div`
  font-size: 9px;
  color: #999;
  text-align: center;
  min-height: 12px;
`;

const Knob: React.FC<KnobProps> = ({
  value,
  min,
  max,
  step,
  onChange,
  label,
  size = 'medium',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const rotation = mapRange(value, min, max, -135, 135);

  const formatValue = (val: number): string => {
    if (Math.abs(val) < 0.01) return '0';
    if (Math.abs(val) >= 10) return val.toFixed(0);
    return val.toFixed(1);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY - e.clientY;
      const sensitivity = 0.5;
      const range = max - min;
      const delta = (deltaY * sensitivity * range) / 100;
      
      const newValue = startValue + delta;
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
  }, [value, min, max, step, startY, startValue, onChange]);

  return (
    <KnobContainer size={size}>
      <KnobLabel>{label}</KnobLabel>
      <KnobElement
        size={size}
        rotation={rotation}
        isDragging={isDragging}
        onMouseDown={handleMouseDown}
      />
      <KnobValue>{formatValue(value)}</KnobValue>
    </KnobContainer>
  );
};

export default Knob;
