export interface VoiceSessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  user_id?: string;
  final?: boolean;
}

export interface VoiceSession {
  session_id: string;
  companion_id: string;
  status: 'active' | 'ended';
  transcript: VoiceSessionMessage[];
  duration: number;
  last_updated: string;
}

export interface VoiceSessionResponse {
  session_id: string;
  assistant_id: string;
  public_key: string;
  chat_id?: string;
}