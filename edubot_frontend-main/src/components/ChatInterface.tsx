import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Sparkles, Paperclip, ArrowUp, X, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { FileUpload } from './FileUpload';
import { apiService, ChatMessage as ChatMessageType, Chat } from '../services/api';
import { toast } from 'sonner';

// Extended ChatMessage type with optional id property
interface ExtendedChatMessage extends ChatMessageType {
  id?: string;
}

interface ChatInterfaceProps {}

export function ChatInterface({}: ChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  // Persist messages per chat so background typing can continue
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ExtendedChatMessage[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; id: string }>>([]);
  const [educationLevel, setEducationLevel] = useState('school');
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  // per-chat typing index (so other chats can be typing in background)
  const [typingIndexByChat, setTypingIndexByChat] = useState<Record<string, number | null>>({});
  const typingTimersRef = useRef<Record<string, number | null>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  // FIXED: Store suggestions in ref to persist across re-renders
  const suggestionsMapRef = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      // If we have cached messages for this chat, use them immediately
      const cached = messagesByChat[currentChatId];
      if (cached) {
        setMessages(cached);
        setTypingMessageIndex(typingIndexByChat[currentChatId] ?? null);
      } else {
        loadChatHistory();
      }
    } else {
      // New chat view: show any unsent temp messages cached under '__new__'
      const cachedNew = messagesByChat['__new__'] || [];
      setMessages(cachedNew);
      setUploadedFiles([]);
      setTypingMessageIndex(null);
      suggestionsMapRef.current.clear(); // Clear suggestions when starting new chat
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  const loadChats = async () => {
    try {
      const response = await apiService.getUserChats();
      const chatsArray = Array.isArray(response) ? response : (response.chats || []);
      setChats(chatsArray);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setChats([]);
    }
  };

  const loadChatHistory = async () => {
    if (!currentChatId) return;
    
    try {
      const user = apiService.getCurrentUser();
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const response = await apiService.getChatHistory(user.id);
      
      if (response.history) {
        const chatMessages = response.history.filter(
          (msg: any) => msg.chat_id === currentChatId
        );
        
        const formattedMessages: ExtendedChatMessage[] = chatMessages.map((msg: any) => ({
          ...msg,
          role: msg.role as 'user' | 'assistant',
          content: msg.content || msg.message || '',
          message: msg.message || msg.content || '',
          timestamp: msg.timestamp,
          chat_id: msg.chat_id,
          follow_up_suggestions: undefined
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    }
  };

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          // Only auto-scroll when user hasn't scrolled up (autoScrollEnabled)
          if (autoScrollEnabled) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: smooth ? 'smooth' : 'auto'
            });
          }
        }
      }
    }, 10);
  };

  // Watch user scroll to enable/disable auto-scrolling when they manually scroll up
  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const viewport = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;

    const onScroll = () => {
      const tolerance = 120; // px from bottom to still consider "at bottom"
      const atBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= tolerance;
      setAutoScrollEnabled(atBottom);
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    // initialize
    onScroll();

    return () => viewport.removeEventListener('scroll', onScroll);
  }, [scrollAreaRef.current]);

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || inputValue.trim();
    if (!message || isLoading) return;

    const user = apiService.getCurrentUser();
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    const userMessage: ExtendedChatMessage = { 
      role: 'user', 
      content: message,
      timestamp: new Date().toISOString(),
      chat_id: currentChatId || 'temp',
      message: message,
      user_id: user.id
    };
    
    // add to active messages and persist per-chat
    setMessages(prev => {
      const next = [...prev, userMessage];
      if (currentChatId) {
        setMessagesByChat(m => ({ ...m, [currentChatId]: next }));
      } else {
        setMessagesByChat(m => ({ ...m, ['__new__']: next }));
      }
      return next;
    });
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => scrollToBottom(), 100);

    try {
      const chatMessage = {
        message: message,
        level: educationLevel,
        chat_id: currentChatId,
        user_id: user.id
      };

      const response = await apiService.sendMessage(chatMessage);
      
      if (!currentChatId && response.reply.chat_id) {
        setCurrentChatId(response.reply.chat_id);
        loadChats();
      }

  const messageId = `msg-${Date.now()}`;
      const suggestions = response.reply.follow_up_suggestions || [];
      
      // FIXED: Store suggestions in ref BEFORE adding to state
      suggestionsMapRef.current.set(messageId, suggestions);
      
      console.log('💾 Stored suggestions in ref:', {
        messageId,
        suggestions,
        suggestionsCount: suggestions.length
      });

      const assistantMessage: ExtendedChatMessage = {
        id: messageId,
        role: 'assistant',
        content: response.reply.content,
        message: response.reply.content,
        timestamp: new Date().toISOString(),
        chat_id: currentChatId || response.reply.chat_id,
        user_id: user.id,
        follow_up_suggestions: suggestions
      };

      console.log('💬 Assistant message created:', {
        id: assistantMessage.id,
        hasSuggestions: !!assistantMessage.follow_up_suggestions,
        suggestionsCount: assistantMessage.follow_up_suggestions?.length
      });

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        // persist per-chat
        const chatKey = currentChatId || response.reply.chat_id || '__new__';
        setMessagesByChat(m => ({ ...m, [chatKey]: newMessages }));
        // set per-chat typing index
        setTypingIndexByChat(t => ({ ...t, [chatKey]: newMessages.length - 1 }));
        // if this chat is active, show typing indicator
        if (chatKey === currentChatId) {
          setTypingMessageIndex(newMessages.length - 1);
        } else {
          // Start a background timer to simulate typing completion for non-active chat
          const timerId = window.setTimeout(() => {
            // clear per-chat typing index
            setTypingIndexByChat(prev => ({ ...prev, [chatKey]: null }));
            // show notification for background chat completion
            toast.success('Response ready in background');
            delete typingTimersRef.current[chatKey];
          }, 2500 + Math.min(5000, (assistantMessage.content || '').length * 10));
          typingTimersRef.current[chatKey] = timerId;
        }
        return newMessages;
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      
      const fallbackMessage: ExtendedChatMessage = {
        role: 'assistant',
        content: "I'm sorry, but I'm unable to connect to the backend server.",
        timestamp: new Date().toISOString(),
        chat_id: currentChatId || 'fallback',
        message: "I'm sorry, but I'm unable to connect to the backend server."
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setTypingMessageIndex(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypingProgress = () => {
    // Only auto-scroll if user hasn't scrolled up
    if (autoScrollEnabled) scrollToBottom();
  };

  const handleTypingComplete = () => {
    // Clear typing for active chat
    setTypingMessageIndex(null);

    // Clear per-chat typing index and notify for the chat that finished
    const chatKey = currentChatId || '__new__';
    setTypingIndexByChat(prev => {
      const next = { ...prev, [chatKey]: null };
      return next;
    });

    // Scroll only if user is at bottom or for the active chat
    if (autoScrollEnabled) scrollToBottom();

    // Show a short toast indicating completion
    toast.success('Response ready');
  };

  const handleNewChat = () => {
    // Clear active chat and reset new-chat cache so the view is empty
    setCurrentChatId(undefined);
    setMessages([]);
    setUploadedFiles([]);
    setTypingMessageIndex(null);
    suggestionsMapRef.current.clear();
    // Clear any cached draft messages for the '__new__' key
    setMessagesByChat(prev => ({ ...prev, ['__new__']: [] }));
    setTypingIndexByChat(prev => ({ ...prev, ['__new__']: null }));
  };

  const handleChatSelect = (chatId: string) => {
    // clear the active typing indicator immediately to avoid index mismatches
    setTypingMessageIndex(null);
    // clear any background typing timer for the previous chat
    try {
      const prev = currentChatId;
      if (prev && typingTimersRef.current[prev]) {
        window.clearTimeout(typingTimersRef.current[prev] as number);
        delete typingTimersRef.current[prev];
      }
    } catch (e) {}

    setCurrentChatId(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await apiService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        handleNewChat();
      }
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUploaded = (filename: string, fileId: string, newChatId?: string) => {
    setUploadedFiles(prev => [...prev, { name: filename, id: fileId }]);
    setShowFileUpload(false);
    
    if (newChatId && !currentChatId) {
      console.log('📎 Setting chat ID from file upload:', newChatId);
      setCurrentChatId(newChatId);
      loadChats();
    }
    
    toast.success(`File "${filename}" is ready for discussion!`);
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const examplePrompts = [
    "Explain quantum physics in simple terms",
    "Help me write an essay about climate change",
    "What are the main causes of World War I?",
    "Solve this calculus problem step by step"
  ];

  const educationLevels = [
    { value: 'elementary', label: 'Elementary' },
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'professional', label: 'Professional' }
  ];

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden">
      {/* Chat Sidebar */}
      <div className="w-72 border-r border-border bg-sidebar/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sidebar-foreground">Conversations</h2>
            <Button onClick={handleNewChat} size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              New Chat
            </Button>
          </div>
          
          <div className="space-y-2">
            <Select value={educationLevel} onValueChange={setEducationLevel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {!chats || chats.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="size-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start a new chat to begin learning</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`relative flex items-center px-2 py-3 cursor-pointer group rounded-lg ${
                      currentChatId === chat.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                    }`}
                    onClick={() => handleChatSelect(chat.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <MessageSquare className="size-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{chat.title}</div>
                        {chat.level && (
                          <div className="text-xs text-muted-foreground truncate">
                            {educationLevels.find(l => l.value === chat.level)?.label || chat.level}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute right-2 flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-2xl px-4">
                <div className="size-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="size-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-4">How can I help you today?</h1>
                <p className="text-muted-foreground mb-8">
                  I'm your AI academic tutor, ready to help with any subject at your {educationLevels.find(l => l.value === educationLevel)?.label.toLowerCase()} level.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-4 text-left border border-border rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm">{prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => {
                const isCurrentlyTyping = typingMessageIndex === index;
                
                // FIXED: Get suggestions from ref first, fallback to message
                const messageId = message.id || `msg-${index}`;
                const suggestionsFromRef = suggestionsMapRef.current.get(messageId);
                const messageSuggestions = message.role === 'assistant' 
                  ? (suggestionsFromRef || message.follow_up_suggestions || [])
                  : [];
                
                console.log(`📝 Message ${index}:`, {
                  id: messageId,
                  role: message.role,
                  isTyping: isCurrentlyTyping,
                  suggestionsFromRef,
                  suggestionsFromMessage: message.follow_up_suggestions,
                  finalSuggestions: messageSuggestions,
                  suggestionsCount: messageSuggestions.length
                });
                
                return (
                  <ChatMessage 
                    key={messageId}
                    message={{
                      role: message.role || 'assistant',
                      content: message.message || message.content || ''
                    }}
                    suggestions={messageSuggestions}
                    onSuggestionClick={handleSendMessage}
                    isTyping={isCurrentlyTyping}
                    onTypingProgress={handleTypingProgress}
                    onTypingComplete={handleTypingComplete}
                  />
                );
              })}
              
              {isLoading && (
                <div className="w-full bg-muted/30 border-b border-border/50">
                  <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex gap-4">
                      <div className="size-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                        <Loader2 className="size-4 text-white animate-spin" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-background shrink-0">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {uploadedFiles && uploadedFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Uploaded files:</p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <Badge key={file.id} variant="secondary" className="gap-1">
                      {file.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeUploadedFile(file.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {showFileUpload && (
              <div className="mb-4">
                <FileUpload
                  chatId={currentChatId}
                  onFileUploaded={handleFileUploaded}
                  onCancel={() => setShowFileUpload(false)}
                />
              </div>
            )}

            <div className="relative">
              <div className="flex items-end gap-3 p-3 border border-border rounded-2xl bg-background shadow-sm">
                <button 
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                >
                  <Paperclip className="size-5 text-muted-foreground" />
                </button>
                
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message EduBot..."
                  disabled={isLoading}
                  className="flex-1 border-0 bg-transparent resize-none min-h-[24px] max-h-[200px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={1}
                />
                
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="rounded-lg size-8 p-0 shrink-0"
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                EduBot can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
