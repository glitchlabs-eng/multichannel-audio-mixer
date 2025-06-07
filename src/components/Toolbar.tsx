import React from 'react';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  height: 60px;
  background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 15px;
`;

const ProjectTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #ffffff;
  flex: 1;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
      transform: translateY(-1px);
    }
  ` : `
    background: #444;
    color: #ccc;
    border: 1px solid #555;
    
    &:hover {
      background: #555;
      color: #fff;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const StatusIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isReady',
})<{ isReady: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.isReady ? '#4CAF50' : '#f44336'};
  box-shadow: 0 0 8px ${props => props.isReady ? '#4CAF50' : '#f44336'};
  animation: ${props => props.isReady ? 'none' : 'pulse 1.5s infinite'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const StatusText = styled.span`
  font-size: 12px;
  color: #ccc;
  margin-left: 8px;
`;

interface ToolbarProps {
  onAddChannel: () => void;
  isEngineReady: boolean;
  projectName: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddChannel,
  isEngineReady,
  projectName,
}) => {
  return (
    <ToolbarContainer>
      <ProjectTitle>{projectName}</ProjectTitle>
      
      <Button 
        variant="primary" 
        onClick={onAddChannel}
        disabled={!isEngineReady}
      >
        + Add Channel
      </Button>
      
      <Button variant="secondary">
        Record
      </Button>
      
      <Button variant="secondary">
        Play
      </Button>
      
      <Button variant="secondary">
        Stop
      </Button>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <StatusIndicator isReady={isEngineReady} />
        <StatusText>
          {isEngineReady ? 'Ready' : 'Initializing...'}
        </StatusText>
      </div>
    </ToolbarContainer>
  );
};

export default Toolbar;
