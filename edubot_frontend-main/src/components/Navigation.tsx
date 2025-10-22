// src/components/Navigation.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { 
  MessageSquare, 
  BookOpen, 
  GraduationCap, 
  FileSearch, 
  BarChart3, 
  Upload,
  Settings,
  PlayCircle,
  ClipboardList,    // ADDED
  Languages,        // ADDED
  BrainCircuit      // ADDED
} from 'lucide-react';

import { User } from '../services/api';

export type NavigationTab = 
  | 'chat' 
  | 'courses' 
  | 'learning' 
  | 'grading' 
  | 'analysis' 
  | 'analytics' 
  | 'submissions' 
  | 'assessments'   // ADDED
  | 'translation'   // ADDED
  | 'companions'    // ADDED
  | 'settings';

interface NavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  user?: User | null;
  onLogout?: () => void;
}

export function Navigation({ currentTab, onTabChange, user, onLogout }: NavigationProps) {
  const tabs = [
    { 
      id: 'chat' as NavigationTab, 
      label: 'Chat', 
      icon: MessageSquare, 
      description: 'AI tutoring conversations' 
    },
    { 
      id: 'courses' as NavigationTab, 
      label: 'Courses', 
      icon: BookOpen, 
      description: 'Generate course materials' 
    },
    { 
      id: 'learning' as NavigationTab, 
      label: 'Learning', 
      icon: PlayCircle, 
      description: 'Learn generated courses' 
    },
    { 
      id: 'assessments' as NavigationTab,  // ADDED
      label: 'Assessments', 
      icon: ClipboardList, 
      description: 'Create & take AI quizzes' 
    },
    { 
      id: 'translation' as NavigationTab,  // ADDED
      label: 'Translation', 
      icon: Languages, 
      description: 'Multilingual translation' 
    },
    { 
      id: 'companions' as NavigationTab,   // ADDED
      label: 'AI Companions', 
      icon: BrainCircuit, 
      description: 'Voice study buddies' 
    },
    { 
      id: 'grading' as NavigationTab, 
      label: 'Grading', 
      icon: GraduationCap, 
      description: 'Grade assignments and code' 
    },
    { 
      id: 'analysis' as NavigationTab, 
      label: 'Analysis', 
      icon: FileSearch, 
      description: 'AI detection & plagiarism' 
    },
    { 
      id: 'submissions' as NavigationTab, 
      label: 'Submissions', 
      icon: Upload, 
      description: 'Manage submissions' 
    },
    { 
      id: 'analytics' as NavigationTab, 
      label: 'Analytics', 
      icon: BarChart3, 
      description: 'Usage statistics' 
    },
    { 
      id: 'settings' as NavigationTab, 
      label: 'Settings', 
      icon: Settings, 
      description: 'Account preferences' 
    }
  ];

  return (
    <div className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col min-h-0">
      {/* Scrollable area for nav items (use flex-1 so footer stays visible) */}
      <div className="p-4 flex flex-col flex-1 overflow-y-auto h-full">
        {/* Logo & App Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">EduBot</h1>
            <p className="text-xs text-sidebar-foreground/70">AI Academic Tutor</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <Button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 h-auto p-3 transition-colors ${
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className="size-5 shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className="text-xs text-sidebar-foreground/60 truncate">{tab.description}</div>
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Footer: compact user badge + quick actions */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user ? (user.first_name?.charAt(0) || user.email?.charAt(0) || 'U') : 'U'}
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="text-sm font-medium truncate leading-tight">{user ? (user.first_name || user.email?.split('@')[0]) : 'Guest'}</div>
              <div className="text-xs text-sidebar-foreground/60 truncate">{user?.email || ''}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="px-2 py-1 text-xs text-red-500" onClick={() => onLogout && onLogout()}>Logout</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
