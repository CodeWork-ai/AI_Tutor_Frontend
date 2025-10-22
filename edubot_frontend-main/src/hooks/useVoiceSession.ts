import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceSession, VoiceSessionMessage, VoiceSessionResponse } from '../types/voiceSession';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import Vapi from '@vapi-ai/web';

interface UseVoiceSessionProps {
  onSessionEnd?: (sessionId: string, chatId?: string) => void;
}

export function useVoiceSession({ onSessionEnd }: UseVoiceSessionProps = {}) {
  const [activeSession, setActiveSession] = useState<VoiceSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'active' | 'ending'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<VoiceSessionMessage[]>([]);
  
  const vapiRef = useRef<Vapi | null>(null);
  const lastMessageRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);

  const addToTranscript = useCallback((role: 'user' | 'assistant', content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const messageKey = `${role}:${trimmedContent}`;
    if (lastMessageRef.current === messageKey) {
      return;
    }

    lastMessageRef.current = messageKey;
    const timestamp = new Date().toISOString();

    setTranscript(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === role && lastMsg.content === trimmedContent) {
        return prev;
      }

      return [...prev, {
        role,
        content: trimmedContent,
        timestamp,
        final: true
      }];
    });
  }, []);

  const saveTranscript = useCallback(async (sessionId: string) => {
    if (!transcript.length) return;

    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      await apiService.saveSessionTranscript(sessionId, transcript, duration);
      console.log('✅ Transcript saved');
    } catch (error) {
      console.error('Failed to save transcript:', error);
      toast.error('Failed to save session transcript');
    }
  }, [transcript]);

  const startSession = useCallback(async (companionId: string, resumeSessionId?: string) => {
    setSessionStatus('connecting');
    startTimeRef.current = Date.now();
    lastMessageRef.current = '';

    try {
      // If resuming, get existing transcript first
      if (resumeSessionId) {
        try {
          const existingSession = await apiService.getSessionTranscript(resumeSessionId);
          if (existingSession?.transcript) {
            setTranscript(existingSession.transcript);
            startTimeRef.current = new Date(existingSession.transcript[0]?.timestamp || Date.now()).getTime();
          }
        } catch (error) {
          console.error('Failed to load previous session:', error);
          setTranscript([]);
        }
      } else {
        setTranscript([]);
      }

      const response = await apiService.startVoiceSession(companionId, resumeSessionId);
      const vapi = new Vapi(response.public_key);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setSessionStatus('active');
        setActiveSession({
          session_id: response.session_id,
          companion_id: companionId,
          status: 'active',
          transcript: [],
          duration: 0,
          last_updated: new Date().toISOString()
        });
        toast.success('Voice session started');
      });

      vapi.on('call-end', () => {
        if (activeSession?.session_id) {
          saveTranscript(activeSession.session_id);
        }
        setSessionStatus('idle');
        setActiveSession(null);
        setIsUserSpeaking(false);
        lastMessageRef.current = '';
        
        if (onSessionEnd && activeSession) {
          onSessionEnd(activeSession.session_id, response.chat_id);
        }
      });

      vapi.on('speech-start', () => {
        setIsUserSpeaking(true);
      });

      vapi.on('speech-end', () => {
        setIsUserSpeaking(false);
      });

      vapi.on('message', (message: any) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          const role = message.role === 'assistant' ? 'assistant' : 'user';
          const content = message.transcript || '';
          addToTranscript(role, content);
        }
        else if (message.type === 'conversation-update') {
          const conversation = message.conversation || [];
          const lastMessage = conversation[conversation.length - 1];

          if (lastMessage && lastMessage.content) {
            const role = lastMessage.role === 'assistant' ? 'assistant' : 'user';
            addToTranscript(role, lastMessage.content);
          }
        }
      });

      await vapi.start(response.assistant_id);

    } catch (error) {
      console.error('Failed to start session:', error);
      setSessionStatus('idle');
      setActiveSession(null);
      toast.error('Failed to start voice session');
    }
  }, [addToTranscript, onSessionEnd, saveTranscript]);

  const stopSession = useCallback(async () => {
    if (!activeSession?.session_id) return;

    setSessionStatus('ending');
    try {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }

      await saveTranscript(activeSession.session_id);
      await apiService.stopVoiceSession(activeSession.session_id);
      toast.success('Session ended and saved');
      
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('Failed to stop session cleanly');
    } finally {
      setSessionStatus('idle');
      setActiveSession(null);
      setIsUserSpeaking(false);
      lastMessageRef.current = '';
      vapiRef.current = null;
    }
  }, [activeSession, saveTranscript]);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
      toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
    }
  }, [isMuted]);

  // Auto-save transcript periodically
  useEffect(() => {
    if (!activeSession?.session_id || sessionStatus !== 'active') return;

    const saveInterval = setInterval(() => {
      saveTranscript(activeSession.session_id);
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [activeSession?.session_id, sessionStatus, saveTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  return {
    activeSession,
    sessionStatus,
    isMuted,
    isUserSpeaking,
    transcript,
    startSession,
    stopSession,
    toggleMute
  };
}