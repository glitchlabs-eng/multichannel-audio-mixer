import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toolbar from '../Toolbar';

describe('Toolbar Component', () => {
  const defaultProps = {
    onAddChannel: jest.fn(),
    isEngineReady: true,
    projectName: 'Test Project',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project name correctly', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders all control buttons', () => {
    render(<Toolbar {...defaultProps} />);
    
    expect(screen.getByText('+ Add Channel')).toBeInTheDocument();
    expect(screen.getByText('Record')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('calls onAddChannel when Add Channel button is clicked', () => {
    render(<Toolbar {...defaultProps} />);
    
    const addChannelButton = screen.getByText('+ Add Channel');
    fireEvent.click(addChannelButton);
    
    expect(defaultProps.onAddChannel).toHaveBeenCalledTimes(1);
  });

  it('disables Add Channel button when engine is not ready', () => {
    render(<Toolbar {...defaultProps} isEngineReady={false} />);
    
    const addChannelButton = screen.getByText('+ Add Channel');
    expect(addChannelButton).toBeDisabled();
  });

  it('shows correct status indicator when engine is ready', () => {
    render(<Toolbar {...defaultProps} isEngineReady={true} />);
    
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows correct status indicator when engine is not ready', () => {
    render(<Toolbar {...defaultProps} isEngineReady={false} />);
    
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  it('applies correct styling to primary button', () => {
    render(<Toolbar {...defaultProps} />);
    
    const addChannelButton = screen.getByText('+ Add Channel');
    expect(addChannelButton).toHaveStyle({
      cursor: 'pointer',
    });
  });

  it('handles missing project name gracefully', () => {
    render(<Toolbar {...defaultProps} projectName="" />);
    
    // Should still render without crashing
    expect(screen.getByText('+ Add Channel')).toBeInTheDocument();
  });
});
