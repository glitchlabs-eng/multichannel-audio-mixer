import React, { useState } from 'react';
import styled from 'styled-components';
import { ExportOptions } from '@/services/AudioRecordingEngine';
import { RecordingSession } from '@/services/AudioRecordingEngine';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 24px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ccc;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #fff;
  }
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 11px;
  font-weight: bold;
  color: #ccc;
  text-transform: uppercase;
`;

const Select = styled.select`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 8px;
  font-size: 12px;
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

const Input = styled.input`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 8px;
  font-size: 12px;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  accent-color: #4CAF50;
  margin-right: 8px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0;
`;

const CheckboxLabel = styled.label`
  font-size: 12px;
  color: #ccc;
  cursor: pointer;
`;

const TrackList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 8px;
`;

const TrackItem = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TrackName = styled.span`
  font-size: 12px;
  color: #ccc;
  flex: 1;
  margin-left: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: #4CAF50;
    color: #fff;
    &:hover { background: #45a049; }
  ` : `
    background: #666;
    color: #ccc;
    &:hover { background: #777; }
  `}
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
  margin: 12px 0;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: #4CAF50;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const StatusText = styled.div`
  font-size: 12px;
  color: #ccc;
  text-align: center;
  margin: 8px 0;
`;

interface ExportDialogProps {
  session: RecordingSession;
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions, trackIds?: string[]) => Promise<void>;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  session,
  isOpen,
  onClose,
  onExport,
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'wav',
    quality: 'high',
    sampleRate: session.sampleRate,
    channels: 2,
    normalize: true,
    fadeIn: 0,
    fadeOut: 0,
    trimStart: 0,
    trimEnd: 0,
  });

  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [exportType, setExportType] = useState<'session' | 'tracks'>('session');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

  if (!isOpen) return null;

  const handleTrackToggle = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing export...');

    try {
      const trackIds = exportType === 'tracks' ? Array.from(selectedTracks) : undefined;
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onExport(exportOptions, trackIds);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('Export completed!');
      
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      setIsExporting(false);
      setExportStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const canExport = exportType === 'session' || selectedTracks.size > 0;

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Export Audio</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        <Section>
          <SectionTitle>Export Type</SectionTitle>
          <FormGroup>
            <Select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as 'session' | 'tracks')}
              disabled={isExporting}
            >
              <option value="session">Full Session Mix</option>
              <option value="tracks">Individual Tracks</option>
            </Select>
          </FormGroup>
        </Section>

        {exportType === 'tracks' && (
          <Section>
            <SectionTitle>Select Tracks</SectionTitle>
            <TrackList>
              {session.tracks.map(track => (
                <TrackItem key={track.id}>
                  <Checkbox
                    checked={selectedTracks.has(track.id)}
                    onChange={() => handleTrackToggle(track.id)}
                    disabled={isExporting}
                  />
                  <TrackName>{track.name}</TrackName>
                </TrackItem>
              ))}
            </TrackList>
          </Section>
        )}

        <Section>
          <SectionTitle>Format Settings</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>Format</Label>
              <Select
                value={exportOptions.format}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  format: e.target.value as 'wav' | 'mp3' | 'flac' | 'aac'
                }))}
                disabled={isExporting}
              >
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
                <option value="flac">FLAC</option>
                <option value="aac">AAC</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Quality</Label>
              <Select
                value={exportOptions.quality}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  quality: e.target.value as 'low' | 'medium' | 'high' | 'lossless'
                }))}
                disabled={isExporting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="lossless">Lossless</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Sample Rate</Label>
              <Select
                value={exportOptions.sampleRate}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  sampleRate: parseInt(e.target.value)
                }))}
                disabled={isExporting}
              >
                <option value={44100}>44.1 kHz</option>
                <option value={48000}>48 kHz</option>
                <option value={96000}>96 kHz</option>
                <option value={192000}>192 kHz</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Channels</Label>
              <Select
                value={exportOptions.channels}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  channels: parseInt(e.target.value) as 1 | 2
                }))}
                disabled={isExporting}
              >
                <option value={1}>Mono</option>
                <option value={2}>Stereo</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </Section>

        <Section>
          <SectionTitle>Post-Processing</SectionTitle>
          
          <CheckboxGroup>
            <Checkbox
              checked={exportOptions.normalize || false}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                normalize: e.target.checked
              }))}
              disabled={isExporting}
            />
            <CheckboxLabel>Normalize audio</CheckboxLabel>
          </CheckboxGroup>

          <FormGrid>
            <FormGroup>
              <Label>Fade In (seconds)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={exportOptions.fadeIn || 0}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  fadeIn: parseFloat(e.target.value)
                }))}
                disabled={isExporting}
              />
            </FormGroup>

            <FormGroup>
              <Label>Fade Out (seconds)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={exportOptions.fadeOut || 0}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  fadeOut: parseFloat(e.target.value)
                }))}
                disabled={isExporting}
              />
            </FormGroup>

            <FormGroup>
              <Label>Trim Start (seconds)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={exportOptions.trimStart || 0}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  trimStart: parseFloat(e.target.value)
                }))}
                disabled={isExporting}
              />
            </FormGroup>

            <FormGroup>
              <Label>Trim End (seconds)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={exportOptions.trimEnd || 0}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  trimEnd: parseFloat(e.target.value)
                }))}
                disabled={isExporting}
              />
            </FormGroup>
          </FormGrid>
        </Section>

        {isExporting && (
          <Section>
            <StatusText>{exportStatus}</StatusText>
            <ProgressBar>
              <ProgressFill progress={exportProgress} />
            </ProgressBar>
          </Section>
        )}

        <ButtonGroup>
          <Button onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!canExport || isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </ButtonGroup>
      </Dialog>
    </Overlay>
  );
};

export default ExportDialog;
