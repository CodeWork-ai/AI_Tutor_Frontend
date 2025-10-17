// src/components/Translation.tsx
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Languages, 
  ArrowRightLeft, 
  Loader2, 
  Copy,
  Check,
  Sparkles,
  Globe,
  MessageSquare,
  Send
} from 'lucide-react';
import { apiService, TranslateTextResponse, SupportedLanguages } from '../services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function Translation() {
  const [activeTab, setActiveTab] = useState<'translate' | 'chat'>('translate');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [languages, setLanguages] = useState<SupportedLanguages | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; language?: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const data = await apiService.getSupportedLanguages();
      setLanguages(data);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error('Please enter text to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await apiService.translateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result.translated_text);
      toast.success('Translation complete!');
    } catch (error) {
      toast.error('Translation failed');
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleChatTranslate = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    setIsChatting(true);
    try {
      const result = await apiService.chatWithTranslation(userMessage);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.ai_response,
          language: result.detected_language_name
        }
      ]);
    } catch (error) {
      toast.error('Chat translation failed');
      console.error(error);
    } finally {
      setIsChatting(false);
    }
  };

  const languageOptions = languages?.languages || {};

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
      {/* Header - Fixed */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Languages className="size-6 text-green" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Translation
              </h1>
              <p className="text-muted-foreground mt-1">
                Translate text and chat in multiple languages
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-6xl mx-auto pb-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="translate" className="gap-2">
                  <Globe className="size-4" />
                  Text Translation
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="size-4" />
                  Multilingual Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="translate" className="space-y-6 mt-0">
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="size-5 text-blue-500" />
                      Instant Translation
                    </CardTitle>
                    <CardDescription>
                      Translate text between {Object.keys(languageOptions).length}+ languages
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Language Selector */}
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                      <Select value={sourceLang} onValueChange={setSourceLang}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Source Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          {Object.entries(languageOptions).map(([code, name]) => (
                            <SelectItem key={code} value={code}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSwapLanguages}
                        disabled={sourceLang === 'auto'}
                        className="rounded-full hover:bg-primary/10"
                        title="Swap languages"
                      >
                        <ArrowRightLeft className="size-5" />
                      </Button>

                      <Select value={targetLang} onValueChange={setTargetLang}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Target Language" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(languageOptions).map(([code, name]) => (
                            <SelectItem key={code} value={code}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Translation Areas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sourceText" className="text-base font-semibold">Source Text</Label>
                        <Textarea
                          id="sourceText"
                          placeholder="Enter text to translate..."
                          value={sourceText}
                          onChange={(e) => setSourceText(e.target.value)}
                          className="min-h-[300px] resize-none font-medium"
                        />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{sourceText.length} characters</span>
                          {sourceText && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSourceText('')}
                              className="h-auto p-0 text-xs hover:text-destructive"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="translatedText" className="text-base font-semibold">Translation</Label>
                        <div className="relative">
                          <Textarea
                            id="translatedText"
                            placeholder="Translation will appear here..."
                            value={translatedText}
                            readOnly
                            className="min-h-[300px] resize-none bg-muted/50 font-medium"
                          />
                          {translatedText && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 hover:bg-background/80"
                              onClick={handleCopy}
                              title="Copy translation"
                            >
                              {isCopied ? (
                                <Check className="size-4 text-green-600" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        {translatedText && (
                          <div className="flex items-center justify-end text-sm text-muted-foreground">
                            <span>{translatedText.length} characters</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleTranslate}
                      disabled={isTranslating || !sourceText.trim()}
                      className="w-full h-12 text-lg"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="size-5 mr-2 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Languages className="size-5 mr-2" />
                          Translate
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-6 mt-0">
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="size-5 text-blue-500" />
                      Multilingual Chat
                    </CardTitle>
                    <CardDescription>
                      Chat in any language, AI responds in the same language
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Chat Messages Area */}
                    <div className="border-2 rounded-lg bg-muted/20 overflow-hidden">
                      <ScrollArea className="h-[450px] p-4">
                        {chatMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <Globe className="size-16 mb-4 opacity-20" />
                            <p className="font-semibold text-lg">Start chatting in any language!</p>
                            <p className="text-sm mt-2">AI will automatically detect and respond</p>
                            <div className="flex gap-2 mt-4">
                              <Badge variant="secondary">🇬🇧 English</Badge>
                              <Badge variant="secondary">🇪🇸 Spanish</Badge>
                              <Badge variant="secondary">🇫🇷 French</Badge>
                              <Badge variant="secondary">🇩🇪 German</Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {chatMessages.map((msg, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] p-4 rounded-lg shadow-sm ${
                                    msg.role === 'user'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-background border-2'
                                  }`}
                                >
                                  {msg.language && (
                                    <Badge variant="secondary" className="mb-2 text-xs">
                                      {msg.language}
                                    </Badge>
                                  )}
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </motion.div>
                            ))}
                            {isChatting && (
                              <div className="flex justify-start">
                                <div className="bg-background border-2 p-4 rounded-lg">
                                  <Loader2 className="size-5 animate-spin text-primary" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message in any language..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatTranslate();
                          }
                        }}
                        className="min-h-[80px] resize-none"
                      />
                      <Button
                        onClick={handleChatTranslate}
                        disabled={isChatting || !chatInput.trim()}
                        className="px-6 h-[80px]"
                        size="lg"
                      >
                        <Send className="size-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Press Enter to send • Shift+Enter for new line
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
