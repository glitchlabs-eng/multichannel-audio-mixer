import { ProjectSettings, AudioChannel } from '@/types/audio';
import { RecordingSession, RecordingConfig } from './AudioRecordingEngine';

export interface ProjectSession {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
  version: string;
  settings: ProjectSettings;
  recordings: RecordingSession[];
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  author?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  tags: string[];
  notes?: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  channels: Partial<AudioChannel>[];
  defaultSettings: Partial<ProjectSettings>;
  category: 'recording' | 'mixing' | 'mastering' | 'live' | 'custom';
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxBackups: number;
  location: 'local' | 'cloud';
}

export class SessionManager {
  private sessions: Map<string, ProjectSession> = new Map();
  private currentSession: ProjectSession | null = null;
  private autoSaveConfig: AutoSaveConfig = {
    enabled: true,
    intervalMinutes: 5,
    maxBackups: 10,
    location: 'local',
  };
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSessions();
    this.setupAutoSave();
  }

  createSession(name: string, template?: SessionTemplate): ProjectSession {
    const session: ProjectSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: template?.description || '',
      createdAt: Date.now(),
      lastModified: Date.now(),
      version: '1.0.0',
      settings: this.createDefaultSettings(template),
      recordings: [],
      metadata: {
        tags: [],
        bpm: 120,
        timeSignature: '4/4',
        key: 'C',
      },
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;
    this.saveSession(session);
    
    return session;
  }

  loadSession(sessionId: string): ProjectSession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.currentSession = session;
      return session;
    }
    return null;
  }

  saveSession(session?: ProjectSession): void {
    const sessionToSave = session || this.currentSession;
    if (!sessionToSave) return;

    sessionToSave.lastModified = Date.now();
    this.sessions.set(sessionToSave.id, sessionToSave);
    
    // Save to localStorage
    try {
      const sessionData = JSON.stringify(sessionToSave);
      localStorage.setItem(`session_${sessionToSave.id}`, sessionData);
      
      // Update session list
      const sessionList = Array.from(this.sessions.keys());
      localStorage.setItem('session_list', JSON.stringify(sessionList));
      
      console.log(`Session saved: ${sessionToSave.name}`);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    
    // Remove from localStorage
    try {
      localStorage.removeItem(`session_${sessionId}`);
      
      // Update session list
      const sessionList = Array.from(this.sessions.keys());
      localStorage.setItem('session_list', JSON.stringify(sessionList));
      
      // If this was the current session, clear it
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  duplicateSession(sessionId: string, newName: string): ProjectSession | null {
    const originalSession = this.sessions.get(sessionId);
    if (!originalSession) return null;

    const duplicatedSession: ProjectSession = {
      ...originalSession,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      createdAt: Date.now(),
      lastModified: Date.now(),
      recordings: [], // Don't duplicate recordings
    };

    this.sessions.set(duplicatedSession.id, duplicatedSession);
    this.saveSession(duplicatedSession);
    
    return duplicatedSession;
  }

  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    return JSON.stringify(session, null, 2);
  }

  importSession(sessionData: string): ProjectSession {
    try {
      const session: ProjectSession = JSON.parse(sessionData);
      
      // Generate new ID to avoid conflicts
      session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      session.lastModified = Date.now();
      
      this.sessions.set(session.id, session);
      this.saveSession(session);
      
      return session;
    } catch (error) {
      throw new Error('Invalid session data');
    }
  }

  getCurrentSession(): ProjectSession | null {
    return this.currentSession;
  }

  getAllSessions(): ProjectSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastModified - a.lastModified);
  }

  searchSessions(query: string): ProjectSession[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllSessions().filter(session => 
      session.name.toLowerCase().includes(lowercaseQuery) ||
      session.description?.toLowerCase().includes(lowercaseQuery) ||
      session.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getSessionsByCategory(category: string): ProjectSession[] {
    return this.getAllSessions().filter(session => 
      session.metadata.tags.includes(category)
    );
  }

  updateSessionMetadata(sessionId: string, metadata: Partial<ProjectMetadata>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.metadata = { ...session.metadata, ...metadata };
      this.saveSession(session);
    }
  }

  addRecordingToSession(sessionId: string, recording: RecordingSession): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.recordings.push(recording);
      this.saveSession(session);
    }
  }

  removeRecordingFromSession(sessionId: string, recordingId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.recordings = session.recordings.filter(r => r.id !== recordingId);
      this.saveSession(session);
    }
  }

  getSessionTemplates(): SessionTemplate[] {
    return [
      {
        id: 'basic_recording',
        name: 'Basic Recording',
        description: 'Simple setup for recording vocals or instruments',
        channels: [
          { name: 'Vocal', gain: 0.75 },
          { name: 'Instrument', gain: 0.75 },
        ],
        defaultSettings: {
          name: 'New Recording Session',
          sampleRate: 44100,
          bufferSize: 512,
        },
        category: 'recording',
      },
      {
        id: 'band_recording',
        name: 'Band Recording',
        description: 'Multi-track setup for recording a full band',
        channels: [
          { name: 'Kick', gain: 0.8 },
          { name: 'Snare', gain: 0.75 },
          { name: 'Hi-Hat', gain: 0.6 },
          { name: 'Bass', gain: 0.8 },
          { name: 'Guitar L', gain: 0.7 },
          { name: 'Guitar R', gain: 0.7 },
          { name: 'Vocal', gain: 0.75 },
          { name: 'Backing Vocal', gain: 0.6 },
        ],
        defaultSettings: {
          name: 'Band Recording Session',
          sampleRate: 48000,
          bufferSize: 256,
        },
        category: 'recording',
      },
      {
        id: 'mixing_session',
        name: 'Mixing Session',
        description: 'Optimized for mixing pre-recorded tracks',
        channels: [
          { name: 'Drums', gain: 0.8 },
          { name: 'Bass', gain: 0.8 },
          { name: 'Guitars', gain: 0.7 },
          { name: 'Keys', gain: 0.6 },
          { name: 'Lead Vocal', gain: 0.75 },
          { name: 'Backing Vocals', gain: 0.6 },
        ],
        defaultSettings: {
          name: 'Mixing Session',
          sampleRate: 48000,
          bufferSize: 1024,
        },
        category: 'mixing',
      },
      {
        id: 'mastering_session',
        name: 'Mastering Session',
        description: 'Stereo mastering setup',
        channels: [
          { name: 'Stereo Mix', gain: 0.8 },
        ],
        defaultSettings: {
          name: 'Mastering Session',
          sampleRate: 96000,
          bufferSize: 2048,
        },
        category: 'mastering',
      },
      {
        id: 'live_performance',
        name: 'Live Performance',
        description: 'Low-latency setup for live performance',
        channels: [
          { name: 'Vocal 1', gain: 0.75 },
          { name: 'Vocal 2', gain: 0.75 },
          { name: 'Guitar', gain: 0.7 },
          { name: 'Bass', gain: 0.8 },
          { name: 'Keys', gain: 0.6 },
          { name: 'Backing Track', gain: 0.5 },
        ],
        defaultSettings: {
          name: 'Live Performance',
          sampleRate: 44100,
          bufferSize: 128,
        },
        category: 'live',
      },
    ];
  }

  private loadSessions(): void {
    try {
      const sessionListData = localStorage.getItem('session_list');
      if (sessionListData) {
        const sessionIds: string[] = JSON.parse(sessionListData);
        
        sessionIds.forEach(sessionId => {
          const sessionData = localStorage.getItem(`session_${sessionId}`);
          if (sessionData) {
            const session: ProjectSession = JSON.parse(sessionData);
            this.sessions.set(session.id, session);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  private createDefaultSettings(template?: SessionTemplate): ProjectSettings {
    const defaultSettings: ProjectSettings = {
      name: 'Untitled Project',
      sampleRate: 44100,
      bufferSize: 512,
      channels: [],
        createdAt: new Date(),
        modifiedAt: new Date(),
      master: {
        mainGain: 0.8,
        headphoneGain: 0.7,
        muted: false,
        level: { peak: 0, rms: 0, clipping: false },
        limiter: {
          enabled: false,
          threshold: -1,
          ratio: 4,
        },
      },
    };

    if (template) {
      return {
        ...defaultSettings,
        ...template.defaultSettings,
        channels: template.channels.map((channelTemplate, index) => ({
          id: `channel_${index + 1}`,
          name: channelTemplate.name || `Channel ${index + 1}`,
          type: 'input' as const,
          gain: channelTemplate.gain || 0.75,
          pan: 0,
          muted: false,
          solo: false,
          level: { peak: 0, rms: 0, clipping: false },
          eq: {
            enabled: false,
            highGain: 0,
            midGain: 0,
            lowGain: 0,
            highFreq: 8000,
            midFreq: 1000,
            lowFreq: 200,
          },
          effects: { effects: [], wetDryMix: 0.5 },
          inputSource: undefined,
        })),
      };
    }

    return defaultSettings;
  }

  private setupAutoSave(): void {
    if (this.autoSaveConfig.enabled) {
      this.autoSaveTimer = setInterval(() => {
        if (this.currentSession) {
          this.saveSession();
          console.log('Auto-saved session');
        }
      }, this.autoSaveConfig.intervalMinutes * 60 * 1000);
    }
  }

  setAutoSaveConfig(config: Partial<AutoSaveConfig>): void {
    this.autoSaveConfig = { ...this.autoSaveConfig, ...config };
    
    // Restart auto-save timer
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    this.setupAutoSave();
  }

  getAutoSaveConfig(): AutoSaveConfig {
    return { ...this.autoSaveConfig };
  }

  dispose(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    // Save current session before disposing
    if (this.currentSession) {
      this.saveSession();
    }
  }
}
