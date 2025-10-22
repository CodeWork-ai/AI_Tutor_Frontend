export interface VoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  user_id?: string;
  final: boolean;
}

export interface VoiceSession {
  session_id: string;
  assistant_id: string;
  companion: {
    name: string;
    subject: string;
    [key: string]: any;
  };
  websocket_url: string | null;
  public_key: string | null;
  chat_id?: string;
  status: 'active' | 'finished' | 'ready';
  duration: number;
  transcript: VoiceMessage[];
}

export interface VoiceSessionStartResponse {
  session_id: string;
  assistant_id: string;
  companion: {
    name: string;
    subject: string;
    [key: string]: any;
  };
  websocket_url: string | null;
  public_key: string | null;
  chat_id?: string;
}

export interface VoiceSessionSaveResponse {
  status: string;
  session_id: string;
  messages_added: number;
}

export interface VoiceSessionStopResponse {
  status: string;
  session_id: string;
  message: string;
}

export interface VoiceTranscriptRequest {
  transcript: VoiceMessage[];
  duration: number;
  replace: boolean;
}

export interface VoiceTranscriptResponse {
  session_id: string;
  transcript: VoiceMessage[];
  duration: number;
  status: 'active' | 'finished' | 'ready';
}