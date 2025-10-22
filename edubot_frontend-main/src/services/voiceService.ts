import { apiService } from './api';
import { API_ROUTES } from '../config/api';
import {
  VoiceSession,
  VoiceSessionStartResponse,
  VoiceSessionStopResponse,
  VoiceSessionSaveResponse,
  VoiceTranscriptRequest,
  VoiceTranscriptResponse,
  VoiceMessage
} from '../types/voice';

class VoiceService {
  private autoSaveInterval: number = 10000; // 10 seconds
  private messageBuffer: VoiceMessage[] = [];
  private activeSession: string | null = null;
  private saveTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {}

  async startSession(companionId: string, resumeSessionId?: string, createChat?: boolean): Promise<VoiceSessionStartResponse> {
    const response = await fetch(
      API_ROUTES.companions.startSession(companionId, resumeSessionId, createChat),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': apiService.getUserId()
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start voice session');
    }

    const data = await response.json();
    this.activeSession = data.session_id;
    this.startAutoSave();
    return data;
  }

  async stopSession(sessionId: string): Promise<VoiceSessionStopResponse> {
    this.stopAutoSave();
    // Try to save any remaining messages before stopping
    if (this.messageBuffer.length > 0) {
      await this.saveTranscript(sessionId, this.messageBuffer, 0, false);
      this.messageBuffer = [];
    }

    const response = await fetch(
      API_ROUTES.companions.stopSession(sessionId),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': apiService.getUserId()
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to stop voice session');
    }

    this.activeSession = null;
    return response.json();
  }

  async saveTranscript(
    sessionId: string, 
    transcript: VoiceMessage[],
    duration: number,
    replace: boolean = false
  ): Promise<VoiceSessionSaveResponse> {
    const response = await fetch(
      API_ROUTES.companions.saveTranscript(sessionId),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': apiService.getUserId()
        },
        body: JSON.stringify({ transcript, duration, replace })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save transcript');
    }

    return response.json();
  }

  async getTranscript(sessionId: string): Promise<VoiceTranscriptResponse> {
    const response = await fetch(
      API_ROUTES.companions.getTranscript(sessionId),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': apiService.getUserId()
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get transcript');
    }

    return response.json();
  }

  async resumeSession(sessionId: string): Promise<VoiceSession> {
    const response = await fetch(
      API_ROUTES.companions.resumeSession(sessionId),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': apiService.getUserId()
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to resume session');
    }

    const data = await response.json();
    this.activeSession = sessionId;
    this.startAutoSave();
    return data;
  }

  async listSessions(companionId: string): Promise<VoiceSession[]> {
    const response = await fetch(
      API_ROUTES.companions.listSessions(companionId),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': apiService.getUserId()
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list sessions');
    }

    return response.json();
  }

  // Buffer management
  addMessageToBuffer(message: VoiceMessage) {
    this.messageBuffer.push(message);
  }

  clearBuffer() {
    this.messageBuffer = [];
  }

  private startAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    this.saveTimer = setInterval(async () => {
      if (this.messageBuffer.length > 0 && this.activeSession) {
        try {
          await this.saveTranscript(this.activeSession, this.messageBuffer, 0, false);
          this.messageBuffer = []; // Clear after successful save
        } catch (error) {
          console.error('Auto-save failed:', error);
          // Keep messages in buffer to retry on next interval
        }
      }
    }, this.autoSaveInterval);
  }

  private stopAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  // Getters and setters for configuration
  setAutoSaveInterval(interval: number) {
    this.autoSaveInterval = interval;
    if (this.activeSession) {
      this.startAutoSave(); // Restart timer with new interval
    }
  }

  getActiveSessionId(): string | null {
    return this.activeSession;
  }
}

export const voiceService = new VoiceService();