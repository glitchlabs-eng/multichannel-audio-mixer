import React, { useState } from 'react';
import styled from 'styled-components';
import { ProjectSession, SessionTemplate } from '@/services/SessionManager';

const BrowserContainer = styled.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  max-height: 600px;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SearchBar = styled.input`
  background: #1a1a1a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  padding: 8px 12px;
  font-size: 12px;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: ${props => props.active ? '#333' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#ccc'};
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  
  &:hover {
    background: ${props => props.active ? '#333' : '#222'};
  }
`;

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SessionItem = styled.div`
  background: #333;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a3a3a;
    border-color: #555;
  }
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const SessionName = styled.h4`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
`;

const SessionDate = styled.span`
  font-size: 10px;
  color: #666;
`;

const SessionDescription = styled.p`
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #ccc;
  line-height: 1.4;
`;

const SessionMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: #666;
`;

const SessionActions = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #4CAF50;
          color: #fff;
          &:hover { background: #45a049; }
        `;
      case 'danger':
        return `
          background: #f44336;
          color: #fff;
          &:hover { background: #da190b; }
        `;
      default:
        return `
          background: #666;
          color: #ccc;
          &:hover { background: #777; }
        `;
    }
  }}
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const TemplateCard = styled.div`
  background: #333;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a3a3a;
    border-color: #4CAF50;
  }
`;

const TemplateTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
`;

const TemplateDescription = styled.p`
  margin: 0 0 8px 0;
  font-size: 10px;
  color: #ccc;
  line-height: 1.4;
`;

const TemplateCategory = styled.span`
  display: inline-block;
  background: #4CAF50;
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const EmptyStateTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #888;
`;

const EmptyStateText = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
`;

interface SessionBrowserProps {
  sessions: ProjectSession[];
  templates: SessionTemplate[];
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (sessionId: string, newName: string) => void;
  onCreateFromTemplate: (template: SessionTemplate) => void;
  onExportSession: (sessionId: string) => void;
  onImportSession: (sessionData: string) => void;
}

const SessionBrowser: React.FC<SessionBrowserProps> = ({
  sessions,
  templates,
  onLoadSession,
  onDeleteSession,
  onDuplicateSession,
  onCreateFromTemplate,
  onExportSession,
  onImportSession,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'templates'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDuplicate = (session: ProjectSession) => {
    const newName = prompt('Enter name for duplicated session:', `${session.name} (Copy)`);
    if (newName) {
      onDuplicateSession(session.id, newName);
    }
  };

  const handleDelete = (session: ProjectSession) => {
    if (confirm(`Are you sure you want to delete "${session.name}"?`)) {
      onDeleteSession(session.id);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
            onImportSession(content);
          } catch (error) {
            alert('Failed to import session: Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <BrowserContainer>
      <Header>
        <Title>Project Browser</Title>
        <SearchBar
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Header>

      <TabContainer>
        <Tab
          active={activeTab === 'sessions'}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions ({sessions.length})
        </Tab>
        <Tab
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
        >
          Templates ({templates.length})
        </Tab>
      </TabContainer>

      {activeTab === 'sessions' && (
        <>
          <ActionButton onClick={handleImport} style={{ marginBottom: '16px' }}>
            Import Session
          </ActionButton>
          
          <SessionList>
            {filteredSessions.length === 0 ? (
              <EmptyState>
                <EmptyStateTitle>No sessions found</EmptyStateTitle>
                <EmptyStateText>
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first session using a template'}
                </EmptyStateText>
              </EmptyState>
            ) : (
              filteredSessions.map(session => (
                <SessionItem key={session.id}>
                  <SessionHeader>
                    <SessionName>{session.name}</SessionName>
                    <SessionDate>{formatDate(session.lastModified)}</SessionDate>
                  </SessionHeader>
                  
                  {session.description && (
                    <SessionDescription>{session.description}</SessionDescription>
                  )}
                  
                  <SessionMeta>
                    <span>{session.settings.channels.length} channels</span>
                    <span>{session.recordings.length} recordings</span>
                    <span>v{session.version}</span>
                  </SessionMeta>
                  
                  <SessionActions>
                    <ActionButton
                      variant="primary"
                      onClick={() => onLoadSession(session.id)}
                    >
                      Load
                    </ActionButton>
                    <ActionButton onClick={() => handleDuplicate(session)}>
                      Duplicate
                    </ActionButton>
                    <ActionButton onClick={() => onExportSession(session.id)}>
                      Export
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => handleDelete(session)}
                    >
                      Delete
                    </ActionButton>
                  </SessionActions>
                </SessionItem>
              ))
            )}
          </SessionList>
        </>
      )}

      {activeTab === 'templates' && (
        <TemplateGrid>
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              onClick={() => onCreateFromTemplate(template)}
            >
              <TemplateTitle>{template.name}</TemplateTitle>
              <TemplateDescription>{template.description}</TemplateDescription>
              <TemplateCategory>{template.category}</TemplateCategory>
            </TemplateCard>
          ))}
        </TemplateGrid>
      )}
    </BrowserContainer>
  );
};

export default SessionBrowser;
