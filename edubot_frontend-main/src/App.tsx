// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Navigation, NavigationTab } from './components/Navigation';
import { ChatInterface } from './components/ChatInterface';
import { CourseGeneration } from './components/CourseGeneration';
import { Learning } from './components/Learning';
import { Grading } from './components/Grading';
import { Analysis } from './components/Analysis';
import { Analytics } from './components/Analytics';
import { Submissions } from './components/Submissions';
import { Assessments } from './components/Assessments';  // ADDED
import { Translation } from './components/Translation';  // ADDED
import { Companions } from './components/Companions';    // ADDED
import { Settings } from './components/Settings';
import { AuthForm } from './components/AuthForm';
import Forgot from './components/Forgot';
import Reset from './components/Reset';
import { apiService, User } from './services/api';
import { ThemeProvider } from './contexts/ThemeContext';

// Main App Component - Protected Routes
function MainApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('chat');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isConnected = await apiService.testConnection();
        if (!isConnected) {
          console.warn('Backend connection failed - using fallback mode');
        }

        const user = apiService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    apiService.logout();
  };

  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'chat':
        return <ChatInterface />;
      case 'courses':
        return <CourseGeneration />;
      case 'learning':
        return <Learning />;
      case 'grading':
        return <Grading />;
      case 'analysis':
        return <Analysis />;
      case 'analytics':
        return <Analytics />;
      case 'submissions':
        return <Submissions />;
      case 'assessments':  // ADDED
        return <Assessments />;
      case 'translation':  // ADDED
        return <Translation />;
      case 'companions':   // ADDED
        return <Companions />;
      case 'settings':
        return <Settings />;
      default:
        return <ChatInterface />;
    }
  };

  // Helper function to get user initials safely
  const getUserInitials = (user: User | null): string => {
    if (!user) return '??';
    
    const firstName = user.first_name || user.email?.charAt(0) || '?';
    const lastName = user.last_name || '';
    
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    
    return `${firstInitial}${lastInitial || ''}`;
  };

  // Helper function to get user display name safely
  const getUserDisplayName = (user: User | null): string => {
    if (!user) return 'Guest';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">E</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden mt-10">
      <Navigation currentTab={currentTab} onTabChange={handleTabChange} user={currentUser} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
      {/* User UI moved into Navigation footer to avoid overlap */}
    </div>
  );
}

// Root App Component with Routes
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes - MUST come BEFORE the catch-all route */}
          <Route path="/forgot-password" element={<Forgot onBackToLogin={() => window.location.href = '/'} />} />
          <Route path="/reset-password" element={<Reset />} />
          
          {/* Default route - Main App */}
          <Route path="/" element={<MainApp />} />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
