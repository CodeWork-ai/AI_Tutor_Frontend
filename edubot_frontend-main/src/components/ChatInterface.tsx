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


// Extended ChatMessage type
interface ExtendedChatMessage extends ChatMessageType {
  id?: string;
  isTyping?: boolean;
  isNew?: boolean;
}


interface ChatInterfaceProps {}


export function ChatInterface({}: ChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ExtendedChatMessage[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; id: string }>>([]);
  const [educationLevel, setEducationLevel] = useState('school');
  
  // ⭐ CRITICAL: Track completed typing per chat - persists across renders and chat switches
  const completedTypingRef = useRef<Record<string, Set<string>>>({}); // chatId -> Set of completed message IDs
  
  // Store suggestions in ref to persist across re-renders
  const suggestionsMapRef = useRef<Map<string, string[]>>(new Map());
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);


  useEffect(() => {
    loadChats();
  }, []);


  useEffect(() => {
    if (currentChatId) {
      const cached = messagesByChat[currentChatId];
      if (cached) {
        console.log('📋 Loading cached messages for chat:', currentChatId);
        setMessages(cached);
      } else {
        console.log('🔄 Loading chat history from server for:', currentChatId);
        loadChatHistory();
      }
    } else {
      // New chat view
      const cachedNew = messagesByChat['__new__'] || [];
      setMessages(cachedNew);
      setUploadedFiles([]);
      suggestionsMapRef.current.clear();
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
        
        const formattedMessages: ExtendedChatMessage[] = chatMessages.map((msg: any) => {
          const messageId = msg.id || `msg-${msg.timestamp}`;
          
          return {
            ...msg,
            id: messageId,
            role: msg.role as 'user' | 'assistant',
            content: msg.content || msg.message || '',
            message: msg.message || msg.content || '',
            timestamp: msg.timestamp,
            chat_id: msg.chat_id,
            follow_up_suggestions: msg.follow_up_suggestions || undefined,
            isTyping: false, // ⭐ Historical messages NEVER type
            isNew: false // ⭐ Not new messages
          };
        });
        
        // ⭐ CRITICAL: Mark ALL loaded messages as completed typing
        if (!completedTypingRef.current[currentChatId]) {
          completedTypingRef.current[currentChatId] = new Set();
        }
        
        formattedMessages.forEach(msg => {
          if (msg.id) {
            completedTypingRef.current[currentChatId!].add(msg.id);
            console.log(`✅ Marked message ${msg.id} as completed (loaded from history)`);
          }
        });
        
        console.log(`📚 Loaded ${formattedMessages.length} messages, all marked as completed`);
        
        setMessages(formattedMessages);
        setMessagesByChat(prev => ({ ...prev, [currentChatId]: formattedMessages }));
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
        if (scrollContainer && autoScrollEnabled) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
          });
        }
      }
    }, 10);
  };


  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const viewport = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;


    const onScroll = () => {
      const tolerance = 120;
      const atBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= tolerance;
      setAutoScrollEnabled(atBottom);
    };


    viewport.addEventListener('scroll', onScroll, { passive: true });
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
    
    setMessages(prev => {
      const next = [...prev, userMessage];
      const chatKey = currentChatId || '__new__';
      setMessagesByChat(m => ({ ...m, [chatKey]: next }));
      return next;
    });
    setInputValue('');
    setIsLoading(true);


    setTimeout(() => scrollToBottom(), 100);


    try {
      const chatMessage = {
        message: message,
        chat_id: currentChatId,
        user_id: user.id
      };


      const response = await apiService.sendMessage(chatMessage);
      
      // ⭐ Handle new chat creation
      const newChatId = response.reply.chat_id;
      if (!currentChatId && newChatId) {
        console.log('🆕 New chat created:', newChatId);
        setCurrentChatId(newChatId);
        loadChats();
      }


      const messageId = `msg-${Date.now()}-${Math.random()}`;
      const chatKey = currentChatId || newChatId || '__new__';
      const suggestions = response.reply.follow_up_suggestions || [];
      
      // Store suggestions in ref
      suggestionsMapRef.current.set(messageId, suggestions);
      
      console.log('💾 Stored suggestions:', { messageId, suggestions, count: suggestions.length });


      const assistantMessage: ExtendedChatMessage = {
        id: messageId,
        role: 'assistant',
        content: response.reply.content,
        message: response.reply.content,
        timestamp: new Date().toISOString(),
        chat_id: chatKey,
        user_id: user.id,
        follow_up_suggestions: suggestions,
        isTyping: true, // ⭐ Start with typing enabled
        isNew: true // ⭐ Mark as new for typing detection
      };


      console.log('💬 Assistant message created:', {
        id: assistantMessage.id,
        chatId: chatKey,
        isTyping: true,
        isNew: true
      });


      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        setMessagesByChat(m => ({ ...m, [chatKey]: newMessages }));
        return newMessages;
      });


    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      
      const fallbackMessage: ExtendedChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, but I'm unable to connect to the backend server.",
        timestamp: new Date().toISOString(),
        chat_id: currentChatId || 'fallback',
        message: "I'm sorry, but I'm unable to connect to the backend server.",
        isTyping: false,
        isNew: false
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleTypingProgress = () => {
    if (autoScrollEnabled) scrollToBottom();
  };


  const handleTypingComplete = (messageId: string, chatId: string) => {
    console.log('✅ Typing completed for message:', { messageId, chatId });
    
    // ⭐ CRITICAL: Mark message as completed in ref (persists across renders)
    if (!completedTypingRef.current[chatId]) {
      completedTypingRef.current[chatId] = new Set();
    }
    completedTypingRef.current[chatId].add(messageId);
    
    console.log(`✅ Added ${messageId} to completed set for chat ${chatId}`);
    console.log(`📊 Total completed messages in this chat: ${completedTypingRef.current[chatId].size}`);


    // Update message state to remove typing flags
    const updateMessage = (msg: ExtendedChatMessage) => 
      msg.id === messageId ? { ...msg, isTyping: false, isNew: false } : msg;
    
    setMessages(prev => prev.map(updateMessage));
    
    // Update cached messages
    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(updateMessage)
    }));


    if (autoScrollEnabled) scrollToBottom();
    toast.success('Response ready', { duration: 1500 });
  };


  const handleNewChat = () => {
    console.log('🆕 Creating new chat');
    setCurrentChatId(undefined);
    setMessages([]);
    setUploadedFiles([]);
    suggestionsMapRef.current.clear();
    setMessagesByChat(prev => ({ ...prev, ['__new__']: [] }));
  };


  const handleChatSelect = (chatId: string) => {
    console.log('🔄 Switching to chat:', chatId);
    console.log(`📊 Completed messages in target chat: ${completedTypingRef.current[chatId]?.size || 0}`);
    setCurrentChatId(chatId);
  };


  const handleDeleteChat = async (chatId: string) => {
    try {
      await apiService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Clean up refs for deleted chat
      delete completedTypingRef.current[chatId];
      delete messagesByChat[chatId];
      
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
    "What is artificial intelligence?",
    "How does machine learning work?",
    "Explain blockchain technology",
    "Tell me about cloud computing"
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
                  I'm your AI assistant, ready to help with any questions you have.
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
                const messageId = message.id || `msg-${index}`;
                const chatKey = currentChatId || '__new__';
                
                // ⭐ CRITICAL: Check if this message has completed typing
                const hasCompletedTyping = completedTypingRef.current[chatKey]?.has(messageId) || false;
                
                // ⭐ Only show typing if: assistant message, marked as new, and NOT completed
                const shouldShowTyping = message.role === 'assistant' && 
                                        message.isNew === true && 
                                        message.isTyping === true &&
                                        !hasCompletedTyping;
                
                // Get suggestions from ref
                const suggestionsFromRef = suggestionsMapRef.current.get(messageId);
                const messageSuggestions = message.role === 'assistant' 
                  ? (suggestionsFromRef || message.follow_up_suggestions || [])
                  : [];
                
                console.log(`📝 Rendering message ${index}:`, {
                  id: messageId,
                  role: message.role,
                  isNew: message.isNew,
                  isTyping: message.isTyping,
                  hasCompletedTyping,
                  shouldShowTyping,
                  contentPreview: message.content?.substring(0, 50)
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
                    isTyping={shouldShowTyping}
                    onTypingProgress={handleTypingProgress}
                    onTypingComplete={() => handleTypingComplete(messageId, chatKey)}
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
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Uploaded files:</p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <Badge key={file.id} variant="secondary" className="gap-1.5 py-1">
                      <Paperclip className="size-3" />
                      {file.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
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
              <div className="mb-3 p-4 border border-border rounded-xl bg-muted/30">
                <FileUpload
                  chatId={currentChatId}
                  onFileUploaded={handleFileUploaded}
                  onCancel={() => setShowFileUpload(false)}
                />
              </div>
            )}


            <div className="relative">
              <div className="flex items-end gap-2 p-3 border border-border rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <Button 
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 hover:bg-muted"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  title="Upload file"
                >
                  <Paperclip className="size-5 text-muted-foreground" />
                </Button>
                
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message EduBot..."
                  disabled={isLoading}
                  className="flex-1 border-0 bg-transparent resize-none min-h-[24px] max-h-[200px] focus-visible:ring-0 focus-visible:ring-offset-0 py-2"
                  rows={1}
                />
                
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="rounded-xl size-9 p-0 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
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
