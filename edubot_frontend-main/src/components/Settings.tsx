import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Shield,
  Loader2,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { apiService, UserSettings } from '../services/api';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';


interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_verified: boolean;
}


export function Settings() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'privacy'>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    education_level: 'school',
    preferred_language: 'en',
    theme: 'system',
    notification_preferences: {
      email_notifications: false,
      push_notifications: false
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    loadSettings();
  }, []);


  const loadSettings = async () => {
    try {
      const response = await apiService.getSettings();
      console.log('Settings response:', response);
      
      if (response.user) {
        setUserProfile(response.user);
      }
      if (response.settings) {
        setSettings(response.settings);
        // Sync theme with context
        if (response.settings.theme) {
          setTheme(response.settings.theme as 'light' | 'dark' | 'system');
        }
      }
    } catch (error) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSaveSettings = async (updatedSettings: Partial<UserSettings>) => {
    setIsSaving(true);
    try {
      // Update theme in context immediately
      if (updatedSettings.theme) {
        setTheme(updatedSettings.theme as 'light' | 'dark' | 'system');
      }
      
      const response = await apiService.updateSettings(updatedSettings);
      if (response.settings) {
        setSettings(response.settings);
      }
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };


  const educationLevels = [
    { value: 'elementary', label: 'Elementary School' },
    { value: 'school', label: 'Middle/High School' },
    { value: 'college', label: 'College/University' },
    { value: 'graduate', label: 'Graduate Studies' },
    { value: 'professional', label: 'Professional Development' }
  ];


  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'it', label: 'Italian' }
  ];


  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your EduBot experience and preferences
          </p>
        </div>
      </div>


      {/* Content Area with Flex */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
              {/* Tab List */}
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-2 flex-shrink-0">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="size-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <SettingsIcon className="size-4" />
                  Preferences
                </TabsTrigger>
              </TabsList>


              {/* Scrollable Tab Content */}
              <div className="flex-1 overflow-y-auto mt-6">
                <TabsContent value="profile" className="space-y-6 mt-0 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information and account details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            placeholder="Your first name"
                            value={userProfile?.first_name || ''}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Your last name"
                            value={userProfile?.last_name || ''}
                            disabled
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your.email@example.com"
                          value={userProfile?.email || ''}
                          disabled
                        />
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Profile information is managed through your account settings
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>


                <TabsContent value="preferences" className="space-y-6 mt-0 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle>Learning Preferences</CardTitle>
                      <CardDescription>
                        Customize your learning experience and default settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="educationLevel">Default Education Level</Label>
                        <Select 
                          value={settings.education_level} 
                          onValueChange={(value) => 
                            handleSaveSettings({ education_level: value })
                          }
                        >
                          <SelectTrigger>
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
                        <p className="text-xs text-muted-foreground">
                          This will be used as the default level for AI responses
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="language">Preferred Language</Label>
                        <Select 
                          value={settings.preferred_language} 
                          onValueChange={(value) => 
                            handleSaveSettings({ preferred_language: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>


                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="size-5" />
                        Appearance
                      </CardTitle>
                      <CardDescription>
                        Choose your preferred theme and display options
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {themes.map((themeOption) => {
                            const Icon = themeOption.icon;
                            return (
                              <Button
                                key={themeOption.value}
                                variant={currentTheme === themeOption.value ? 'default' : 'outline'}
                                className="flex flex-col gap-2 h-auto p-4"
                                onClick={() => handleSaveSettings({ theme: themeOption.value as any })}
                              >
                                <Icon className="size-5" />
                                <span className="text-sm">{themeOption.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>


      {/* Save Status */}
      {isSaving && (
        <div className="fixed bottom-4 right-4">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-4 py-2 shadow-lg">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
}
