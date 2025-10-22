import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from './ui/use-toast';
import {
  VoiceSession,
  VoiceMessage,
} from '../types/voice';
import { voiceService } from '../services/voiceService';
import { useIsMobile } from './ui/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Companion } from '../services/api';

interface VoiceSessionManagerProps {
  companion: Companion;
  onSessionFinished?: (chatId?: string) => void;
}

export function VoiceSessionManager({ companion, onSessionFinished }: VoiceSessionManagerProps) {
  const [activeSession, setActiveSession] = useState<VoiceSession | null>(null);
  const [transcript, setTranscript] = useState<VoiceMessage[]>([]);
  const [pastSessions, setPastSessions] = useState<VoiceSession[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Load past sessions
  useEffect(() => {
    const loadPastSessions = async () => {
      try {
        const sessions = await voiceService.listSessions(companion.id);
        setPastSessions(sessions);
      } catch (error) {
        console.error('Failed to load past sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load past sessions",
          variant: "destructive"
        });
      }
    };

    loadPastSessions();
  }, [companion.id, toast]);

  // Auto-scroll handling
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && !userScrolled) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (userScrolled) {
      setHasNewMessages(true);
    }
  }, [userScrolled]);

  useEffect(() => {
    scrollToBottom();
  }, [transcript, scrollToBottom]);

  // Handle scroll events
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    
    setUserScrolled(!isAtBottom);
    if (isAtBottom) {
      setHasNewMessages(false);
    }
  };

  // Start new session
  const handleStartSession = async () => {
    try {
      setIsProcessing(true);
      const response = await voiceService.startSession(companion.id);
      setActiveSession({
        ...response,
        status: 'active',
        duration: 0,
        transcript: []
      });
      setTranscript([]);
      setIsRecording(true);
      toast({
        title: "Session Started",
        description: "Voice session has been started successfully"
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      toast({
        title: "Error",
        description: "Failed to start voice session",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop session
  const handleStopSession = async () => {
    if (!activeSession?.session_id) return;

    try {
      setIsProcessing(true);
      await voiceService.stopSession(activeSession.session_id);
      setIsRecording(false);
      toast({
        title: "Session Finished",
        description: "Voice session has been saved successfully",
        action: activeSession.chat_id ? {
          label: "Open Chat",
          onClick: () => onSessionFinished?.(activeSession.chat_id)
        } : undefined
      });
      // Refresh past sessions
      const sessions = await voiceService.listSessions(companion.id);
      setPastSessions(sessions);
      setActiveSession(null);
    } catch (error) {
      console.error('Failed to stop session:', error);
      toast({
        title: "Error",
        description: "Failed to stop voice session",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Resume session
  const handleResumeSession = async (sessionId: string, createChat: boolean = false) => {
    try {
      setIsProcessing(true);
      const response = await voiceService.startSession(companion.id, sessionId, createChat);
      const transcript = await voiceService.getTranscript(sessionId);
      setActiveSession({
        ...response,
        ...transcript
      });
      setTranscript(transcript.transcript);
      setIsRecording(true);
      toast({
        title: "Session Resumed",
        description: "Voice session has been resumed successfully"
      });
    } catch (error) {
      console.error('Failed to resume session:', error);
      toast({
        title: "Error",
        description: "Failed to resume session",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle new message
  const handleNewMessage = useCallback((message: VoiceMessage) => {
    setTranscript(prev => [...prev, message]);
    voiceService.addMessageToBuffer(message);
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="w-full flex justify-center">
          <TabsTrigger value="current" className="flex-1">Current Session</TabsTrigger>
          <TabsTrigger value="past" className="flex-1">Past Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="flex flex-col h-full">
          <div className="flex-grow relative">
            <ScrollArea className="h-[calc(100vh-200px)]" onScroll={handleScroll}>
              {transcript.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 mb-2 rounded-lg ${
                    message.role === 'user' ? 'bg-secondary ml-8' : 'bg-muted mr-8'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
            {hasNewMessages && (
              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-4 right-4 z-10"
                onClick={() => {
                  setUserScrolled(false);
                  scrollToBottom();
                }}
              >
                New messages ↓
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center p-4 border-t">
            {!activeSession ? (
              <Button 
                onClick={handleStartSession} 
                disabled={isProcessing}
                className="w-full"
              >
                Start Voice Session
              </Button>
            ) : (
              <Button 
                onClick={handleStopSession}
                disabled={isProcessing}
                variant="destructive"
                className="w-full"
              >
                Stop Session
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {pastSessions.map((session) => (
              <Card key={session.session_id} className="p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">
                      Session {session.session_id}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Duration: {Math.floor(session.duration / 60)}m {session.duration % 60}s
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResumeSession(session.session_id)}
                      disabled={isProcessing || !!activeSession}
                    >
                      Resume
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResumeSession(session.session_id, true)}
                      disabled={isProcessing || !!activeSession}
                    >
                      Import to Chat
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-32">
                  {session.transcript.slice(-3).map((message, index) => (
                    <div
                      key={index}
                      className="text-sm text-muted-foreground mb-1"
                    >
                      <strong>{message.role}:</strong> {message.content}
                    </div>
                  ))}
                </ScrollArea>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}