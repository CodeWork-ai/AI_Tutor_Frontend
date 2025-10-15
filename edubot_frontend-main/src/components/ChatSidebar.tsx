import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquare, Plus, Edit3, Trash2, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { apiService, Chat, User } from '../services/api';
import { toast } from 'sonner';  // FIXED: Removed @2.0.3

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  user: User;
  onLogout: () => void;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat, user, onLogout }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await apiService.getUserChats();
      setChats(response.chats || []); // FIXED: Add fallback
    } catch (error) {
      console.error('Failed to load chats:', error);
      setChats([]); // FIXED: Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await apiService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      toast.success('Chat deleted successfully');
      
      // If the deleted chat was the current one, clear selection
      if (currentChatId === chatId) {
        onNewChat();
      }
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const handleLogout = () => {
    apiService.logout();
    onLogout();
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3">
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start gap-3 bg-transparent border border-sidebar-border hover:bg-sidebar-accent"
          variant="outline"
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-sidebar-accent/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="size-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent ${
                  currentChatId === chat.id ? 'bg-sidebar-accent' : ''
                }`}
                onClick={() => onChatSelect(chat.id)}
              >
                <MessageSquare className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">{chat.title}</span>
                
                {/* Hover actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="size-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors flex-1">
            <div className="size-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">
                {user.first_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="size-8 p-0"
              title="Logout"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
