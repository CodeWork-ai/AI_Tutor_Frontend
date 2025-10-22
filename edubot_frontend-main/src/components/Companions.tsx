// src/components/Companions.tsx - FIXED DUPLICATE MESSAGES

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Mic, 
  Plus, 
  Loader2, 
  Volume2,
  User,
  Trash2,
  Square,
  Sparkles,
  BookOpen,
  Clock,
  MessageSquare,
  BrainCircuit,
  Zap,
  MicOff,
  Bot,
  UserCircle
} from 'lucide-react';
import { apiService, Companion, VoicesResponse } from '../services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Vapi from '@vapi-ai/web';

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Literature',
  'Geography',
  'Economics',
  'Psychology',
  'Art',
  'Music',
  'Foreign Languages',
  'Philosophy',
  'Engineering'
];

const DEFAULT_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export function Companions() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [voices, setVoices] = useState<VoicesResponse | null>(null);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [activeCompanionId, setActiveCompanionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'active' | 'ending'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string; timestamp: number }>>([]);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>(''); // Track last message to prevent duplicates

  const [createForm, setCreateForm] = useState({
    name: '',
    subject: '',
    topic: '',
    voice: 'alloy',
    style: 'friendly',
    duration: 15
  });

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    loadData();
    
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      try {
        const companionsData = await apiService.getCompanions();
        setCompanions(companionsData);
      } catch (error) {
        console.error('Failed to load companions:', error);
      }
      
      try {
        const voicesData = await apiService.getAvailableVoices();
        setVoices(voicesData);
      } catch (error) {
        console.log('Using default voices');
      }
      
      try {
        const subjectsData = await apiService.getAvailableSubjects();
        if (subjectsData.subjects && subjectsData.subjects.length > 0) {
          setSubjects(subjectsData.subjects);
        }
      } catch (error) {
        console.log('Using default subjects');
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load companions data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompanion = async () => {
    if (!createForm.name.trim() || !createForm.subject || !createForm.topic.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      await apiService.createCompanion(createForm);
      toast.success('AI Companion created successfully!');
      await loadData();
      setCreateForm({
        name: '',
        subject: '',
        topic: '',
        voice: 'alloy',
        style: 'friendly',
        duration: 15
      });
    } catch (error) {
      toast.error('Failed to create companion');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  // Helper function to add message without duplicates
  const addToTranscript = (role: string, content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Create unique key from role + content
    const messageKey = `${role}:${trimmedContent}`;
    
    // Check if this exact message was just added
    if (lastMessageRef.current === messageKey) {
      console.log('🚫 Duplicate message blocked:', messageKey);
      return;
    }

    // Update last message reference
    lastMessageRef.current = messageKey;

    setTranscript(prev => {
      // Also check if last message in array is the same
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === role && lastMsg.content === trimmedContent) {
        console.log('🚫 Duplicate in array blocked');
        return prev;
      }

      console.log('✅ Adding message:', role, trimmedContent.substring(0, 50));
      return [...prev, {
        role,
        content: trimmedContent,
        timestamp: Date.now()
      }];
    });
  };

  // Normalize many possible role values from VAPI/backend into 'user'|'assistant'
  const normalizeRole = (rawRole: any) => {
    if (!rawRole) return 'user';
    const r = String(rawRole).toLowerCase();
    // common assistant labels
    if (r === 'assistant' || r === 'bot' || r === 'system' || r === 'ai') return 'assistant';
    // anything else treat as user
    return 'user';
  };

  const handleStartSession = async (companionId: string) => {
    setSessionStatus('connecting');
    setActiveCompanionId(companionId);
    setTranscript([]);
    lastMessageRef.current = ''; // Reset duplicate tracker
    
    try {
      const session = await apiService.startVoiceSession(companionId);
      
      // Type guard to ensure properties exist
      if (!session || typeof session !== 'object') {
        throw new Error('Invalid session response from backend');
      }

      const sessionData = session as { 
        session_id: string; 
        public_key?: string; 
        assistant_id?: string;
        publicKey?: string;
        assistantId?: string;
      };

      // Handle both snake_case and camelCase from backend
      const publicKey = sessionData.public_key || sessionData.publicKey;
      const assistantId = sessionData.assistant_id || sessionData.assistantId;

      if (!publicKey || !assistantId) {
        throw new Error('Missing credentials from backend (public_key or assistant_id)');
      }

      console.log('🔑 Session credentials received');

      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        console.log('✅ Call started');
        setSessionStatus('active');
        setActiveSession(sessionData.session_id);
        toast.success('Voice session started! You can speak now.');
      });

      vapi.on('call-end', () => {
        console.log('❌ Call ended');
        setSessionStatus('idle');
        setActiveSession(null);
        setActiveCompanionId(null);
        setIsUserSpeaking(false);
        lastMessageRef.current = '';
        
        if (transcript.length > 0) {
          saveTranscript(sessionData.session_id);
        }
      });

      vapi.on('speech-start', () => {
        console.log('🎤 User started speaking');
        setIsUserSpeaking(true);
      });

      vapi.on('speech-end', () => {
        console.log('🎤 User stopped speaking');
        setIsUserSpeaking(false);
      });

      vapi.on('message', (message: any) => {
        console.log('💬 Message received:', message.type, message);
        
        // Handle VAPI transcript messages
        if (message.type === 'transcript') {
          // Only process FINAL transcripts to avoid duplicates
          if (message.transcriptType === 'final') {
            const role = message.role === 'assistant' ? 'assistant' : 'user';
            const content = message.transcript || '';
            addToTranscript(role, content);
          }
        }
        // Handle conversation-update messages (alternative format)
        else if (message.type === 'conversation-update') {
          const conversation = message.conversation || [];
          const lastMessage = conversation[conversation.length - 1];

          if (lastMessage && lastMessage.content) {
            const role = normalizeRole(lastMessage.role || lastMessage.speaker || lastMessage.author);
            addToTranscript(role, lastMessage.content);
          }
        }
        // Handle function-call messages (skip these)
        else if (message.type === 'function-call' || message.type === 'function-call-result') {
          console.log('⚙️ Skipping function call message');
        }
      });

      vapi.on('error', (error: any) => {
        console.error('❌ VAPI Error:', error);
        toast.error(`Voice error: ${error.message || 'Unknown error'}`);
        setSessionStatus('idle');
        setActiveSession(null);
        setActiveCompanionId(null);
        setIsUserSpeaking(false);
        lastMessageRef.current = '';
      });

      console.log('🚀 Starting VAPI call with assistant:', assistantId);
      await vapi.start(assistantId);
      
    } catch (error: any) {
      console.error('Failed to start voice session:', error);
      toast.error(error.message || 'Failed to start voice session');
      setSessionStatus('idle');
      setActiveSession(null);
      setActiveCompanionId(null);
    }
  };

  const handleStopSession = async () => {
    if (!vapiRef.current) return;

    setSessionStatus('ending');
    try {
      vapiRef.current.stop();
      
      if (activeSession && transcript.length > 0) {
        await saveTranscript(activeSession);
      }

      if (activeSession) {
        try {
          await apiService.stopVoiceSession(activeSession);
        } catch (error) {
          console.warn('Failed to stop session on backend:', error);
        }
      }

      toast.success('Voice session ended');
      setActiveSession(null);
      setActiveCompanionId(null);
      setIsUserSpeaking(false);
      lastMessageRef.current = '';
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('Failed to stop session cleanly');
    } finally {
      setSessionStatus('idle');
      vapiRef.current = null;
    }
  };

  const saveTranscript = async (sessionId: string) => {
    try {
      await apiService.saveSessionTranscript(
        sessionId,
        transcript,
        Math.floor(Date.now() / 1000)
      );
      console.log('✅ Transcript saved');
    } catch (error) {
      console.error('Failed to save transcript:', error);
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
      toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
    }
  };

  const handleDeleteCompanion = async (companionId: string) => {
    if (!confirm('Are you sure you want to delete this companion?')) return;

    try {
      await apiService.deleteCompanion(companionId);
      toast.success('Companion deleted');
      await loadData();
    } catch (error) {
      toast.error('Failed to delete companion');
      console.error(error);
    }
  };

  const voiceOptions = voices?.voices 
    ? Object.entries(voices.voices).flatMap(([provider, voiceData]) => Object.keys(voiceData))
    : DEFAULT_VOICES;

if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="text-center">
        <Loader2 className="size-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground text-lg">Loading companions...</p>
      </div>
    </div>
  );
}


  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      {/* Header - Fixed */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <BrainCircuit className="size-6 text-green" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                AI Study Companions
              </h1>
              <p className="text-muted-foreground mt-1">
                Create personalized AI tutors with voice interaction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-7xl mx-auto pb-6">
            <div className={`grid gap-6 ${sessionStatus === 'active' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 lg:grid-cols-3'}`}>
              {/* Create Companion Form - Left Sidebar */}
              <div className={sessionStatus === 'active' ? 'lg:col-span-3' : 'lg:col-span-1'}>
                <Card className="border-2 shadow-lg sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="size-5 text-purple-500" />
                      Create Companion
                    </CardTitle>
                    <CardDescription>
                      Build your personalized AI study buddy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Companion Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Math Mentor"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Select
                        value={createForm.subject}
                        onValueChange={(value) => setCreateForm({ ...createForm, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic *</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Algebra, Physics"
                        value={createForm.topic}
                        onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Voice</Label>
                      <Select
                        value={createForm.voice}
                        onValueChange={(value) => setCreateForm({ ...createForm, voice: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceOptions.map((voice) => (
                            <SelectItem key={voice} value={voice}>
                              {voice.charAt(0).toUpperCase() + voice.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Teaching Style</Label>
                      <Select
                        value={createForm.style}
                        onValueChange={(value) => setCreateForm({ ...createForm, style: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly & Encouraging</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual & Relaxed</SelectItem>
                          <SelectItem value="structured">Structured & Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Session Duration (minutes)</Label>
                      <Select
                        value={createForm.duration.toString()}
                        onValueChange={(value) => setCreateForm({ ...createForm, duration: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 15, 20, 30, 45, 60].map((dur) => (
                            <SelectItem key={dur} value={dur.toString()}>
                              {dur} minutes
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <Button
                      onClick={handleCreateCompanion}
                      disabled={isCreating}
                      className="w-full h-11"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4 mr-2" />
                          Create Companion
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Companions List - Middle */}
              <div className={sessionStatus === 'active' ? 'lg:col-span-5' : 'lg:col-span-2'}>
                {companions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    // Center vertically in viewport (accounting for header) so placeholder appears centered
                    className="flex flex-col items-center justify-center text-center"
                    style={{ minHeight: 'calc(100vh - 8rem)' }}
                  >
                    <div className="size-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg">
                      <BrainCircuit className="size-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No Companions Yet</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Create your first AI study companion to get personalized voice tutoring on any subject!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
                      <Badge variant="secondary" className="gap-1">
                        <Mic className="size-3" />
                        Voice Interaction
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="size-3" />
                        Personalized Learning
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="size-3" />
                        24/7 Available
                      </Badge>
                    </div>
                  </motion.div>
                ) : (
                  // Make the companions list scrollable independently so long lists don't affect the page scroll
                  <div className="h-[calc(100vh-8rem)] overflow-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companions.map((companion) => (
                      <motion.div
                        key={companion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-2 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600" />
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                                  <User className="size-6 text-green" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{companion.name}</CardTitle>
                                  <p className="text-sm text-muted-foreground">{companion.subject}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteCompanion(companion.id)}
                                disabled={activeCompanionId === companion.id}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <BookOpen className="size-4 flex-shrink-0" />
                                <span className="truncate">Topic: {companion.topic}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Volume2 className="size-4 flex-shrink-0" />
                                <span>Voice: {companion.voice}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="size-4 flex-shrink-0" />
                                <span>Duration: {companion.duration} min</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MessageSquare className="size-4 flex-shrink-0" />
                                <span>Style: {companion.style}</span>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex gap-2">
                              {activeCompanionId === companion.id && sessionStatus !== 'idle' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleMute}
                                    disabled={sessionStatus !== 'active'}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                  >
                                    {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={handleStopSession}
                                    disabled={sessionStatus === 'ending'}
                                  >
                                    {sessionStatus === 'ending' ? (
                                      <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Ending...
                                      </>
                                    ) : (
                                      <>
                                        <Square className="size-4 mr-2" />
                                        End Session
                                      </>
                                    )}
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                                  onClick={() => handleStartSession(companion.id)}
                                  disabled={sessionStatus !== 'idle'}
                                >
                                  {sessionStatus === 'connecting' && activeCompanionId === companion.id ? (
                                    <>
                                      <Loader2 className="size-4 mr-2 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <Mic className="size-4 mr-2" />
                                      Start Voice Chat
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>

                            {activeCompanionId === companion.id && sessionStatus === 'active' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
                              >
                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                  <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                                  <span className="font-medium">Active</span>
                                  {isUserSpeaking && (
                                    <span className="text-xs">(Speaking...)</span>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Transcript Viewer - RIGHT SIDE */}
              {sessionStatus === 'active' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-4"
                >
                  <Card className="border-2 shadow-lg sticky top-6 h-[calc(100vh-8rem)]">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquare className="size-5 text-purple-500" />
                            Live Conversation
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                              {transcript.length}
                            </Badge>
                            {/* Add End Session control in header so it's always reachable */}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleStopSession}
                              disabled={(sessionStatus as any) === 'idle' || (sessionStatus as any) === 'ending'}
                            >
                              {(sessionStatus as any) === 'ending' ? (
                                <>
                                  <Loader2 className="size-4 mr-2 animate-spin" />
                                  Ending...
                                </>
                              ) : (
                                <>
                                  <Square className="size-4 mr-2" />
                                  End Session
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
                      <ScrollArea className="flex-1 p-4">
                        {transcript.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <Bot className="size-16 text-muted-foreground/30 mb-4" />
                            <p className="text-sm text-muted-foreground">
                              Start speaking to see the conversation...
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <AnimatePresence>
                              {transcript.map((msg, idx) => (
                                <motion.div
                                  key={`${msg.timestamp}-${idx}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                  <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    msg.role === 'user' 
                                      ? 'bg-blue-500' 
                                      : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                  }`}>
                                    {msg.role === 'user' ? (
                                      <UserCircle className="size-5 text-white" />
                                    ) : (
                                      <Bot className="size-5 text-white" />
                                    )}
                                  </div>
                                  <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    <div className={`inline-block px-4 py-2 rounded-2xl max-w-[85%] ${
                                      msg.role === 'user'
                                        ? 'bg-blue-500 text-black'
                                        : 'bg-muted text-foreground'
                                    }`}>
                                      <p className="text-sm blackspace-pre-wrap break-words">
                                        {msg.content}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            <div ref={transcriptEndRef} />
                          </div>
                        )}
                        
                        {/* Typing indicator */}
                        {isUserSpeaking && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3 items-center mt-4"
                          >
                            <div className="size-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <UserCircle className="size-5 text-green" />
                            </div>
                            <div className="bg-muted px-4 py-2 rounded-2xl">
                              <div className="flex gap-1">
                                <div className="size-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="size-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="size-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
