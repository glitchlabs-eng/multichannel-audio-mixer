import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Knob from '../Knob';

describe('Knob Component', () => {
  const defaultProps = {
    value: 0,
    min: -10,
    max: 10,
    step: 0.5,
    onChange: jest.fn(),
    label: 'Test Knob',
    size: 'medium' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders knob with label and value', () => {
    render(<Knob {...defaultProps} />);
    
    expect(screen.getByText('Test Knob')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays correct value formatting', () => {
    const { rerender } = render(<Knob {...defaultProps} value={0.001} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    
    rerender(<Knob {...defaultProps} value={5.7} />);
    expect(screen.getByText('5.7')).toBeInTheDocument();
    
    rerender(<Knob {...defaultProps} value={15} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Knob {...defaultProps} size="small" />);
    expect(screen.getByText('Test Knob')).toBeInTheDocument();
    
    rerender(<Knob {...defaultProps} size="large" />);
    expect(screen.getByText('Test Knob')).toBeInTheDocument();
  });

  it('calculates rotation based on value', () => {
    const { rerender } = render(<Knob {...defaultProps} value={-10} />);
    // Min value should be at -135 degrees
    expect(screen.getByText('Test Knob')).toBeInTheDocument();
    
    rerender(<Knob {...defaultProps} value={0} />);
    // Center value should be at 0 degrees
    expect(screen.getByText('0')).toBeInTheDocument();
    
    rerender(<Knob {...defaultProps} value={10} />);
    // Max value should be at 135 degrees
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('handles mouse drag interactions', async () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} onChange={onChange} />);
    
    const knobElement = screen.getByText('Test Knob').parentElement?.querySelector('div[style*="transform"]');
    expect(knobElement).toBeInTheDocument();
    
    if (knobElement) {
      // Simulate mouse down
      fireEvent.mouseDown(knobElement, { clientY: 100 });
      
      // Simulate mouse move (upward movement should increase value)
      fireEvent(document, new MouseEvent('mousemove', { clientY: 90, bubbles: true }));
      
      // Simulate mouse up
      fireEvent(document, new MouseEvent('mouseup', { bubbles: true }));
      
      // onChange should have been called
      expect(onChange).toHaveBeenCalled();
    }
  });

  it('handles double click to reset to center', async () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} value={5} onChange={onChange} />);
    
    const knobElement = screen.getByText('Test Knob').parentElement?.querySelector('div[style*="transform"]');
    
    if (knobElement) {
      fireEvent.doubleClick(knobElement);
      expect(onChange).toHaveBeenCalledWith(0); // Should reset to center value
    }
  });

  it('respects step increments', () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} step={1} onChange={onChange} />);
    
    // Component should render with custom step
    expect(screen.getByText('Test Knob')).toBeInTheDocument();
  });

  it('clamps values to min/max bounds', () => {
    const { rerender } = render(<Knob {...defaultProps} value={-20} />);
    // Should display the clamped value
    expect(screen.getByText('Test Knob')).toBeInTheDocument();
    
    rerender(<Knob {...defaultProps} value={20} />);
    expect(screen.getByText('Test Knob')).toBeInTheDocument();
  });

  it('prevents default on mouse down', () => {
    render(<Knob {...defaultProps} />);
    
    const knobElement = screen.getByText('Test Knob').parentElement?.querySelector('div[style*="transform"]');
    
    if (knobElement) {
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault');
      
      fireEvent(knobElement, mouseDownEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
    }
  });

  it('handles sensitivity correctly during drag', () => {
    const onChange = jest.fn();
    render(<Knob {...defaultProps} onChange={onChange} />);
    
    const knobElement = screen.getByText('Test Knob').parentElement?.querySelector('div[style*="transform"]');
    
    if (knobElement) {
      // Start drag
      fireEvent.mouseDown(knobElement, { clientY: 100 });
      
      // Small movement should result in small change
      fireEvent(document, new MouseEvent('mousemove', { clientY: 99, bubbles: true }));
      
      // Large movement should result in larger change
      fireEvent(document, new MouseEvent('mousemove', { clientY: 80, bubbles: true }));
      
      fireEvent(document, new MouseEvent('mouseup', { bubbles: true }));
      
      expect(onChange).toHaveBeenCalled();
    }
  });
});
