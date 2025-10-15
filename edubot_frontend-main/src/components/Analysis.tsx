import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  Search, 
  Bot, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  Shield,
  Eye,
  FileText,
  ExternalLink
} from 'lucide-react';
import { apiService, PlagiarismResponse, AIDetectionResponse } from '../services/api';
import { toast } from 'sonner';

export function Analysis() {
  const [activeTab, setActiveTab] = useState<'plagiarism' | 'ai-detection'>('plagiarism');
  const [isLoading, setIsLoading] = useState(false);
  
  // Plagiarism check state
  const [plagiarismText, setPlagiarismText] = useState('');
  const [plagiarismResult, setPlagiarismResult] = useState<any | null>(null); // Changed to any to handle both naming conventions
  
  // AI detection state
  const [aiText, setAiText] = useState('');
  const [aiResult, setAiResult] = useState<any | null>(null); // Changed to any to handle both naming conventions

  const handleCheckPlagiarism = async () => {
    if (!plagiarismText.trim()) {
      toast.error('Please enter text to check for plagiarism');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Checking plagiarism for text:', plagiarismText.substring(0, 100) + '...');
      const response = await apiService.checkPlagiarism(plagiarismText);
      console.log('Plagiarism response:', response);
      setPlagiarismResult(response);
      toast.success('Plagiarism check completed!');
    } catch (error) {
      console.error('Plagiarism check error:', error);
      toast.error('Failed to check plagiarism');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectAI = async () => {
    if (!aiText.trim()) {
      toast.error('Please enter text to analyze for AI generation');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Detecting AI for text:', aiText.substring(0, 100) + '...');
      const response = await apiService.detectAI(aiText);
      console.log('AI detection response:', response);
      setAiResult(response);
      toast.success('AI detection analysis completed!');
    } catch (error) {
      console.error('AI detection error:', error);
      toast.error('Failed to analyze text for AI content');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlagiarismSeverity = (score: number) => {
    if (score >= 80) return { level: 'High Risk', color: 'text-red-600', variant: 'destructive' as const };
    if (score >= 50) return { level: 'Medium Risk', color: 'text-orange-600', variant: 'secondary' as const };
    if (score >= 25) return { level: 'Low Risk', color: 'text-yellow-600', variant: 'outline' as const };
    return { level: 'Original', color: 'text-green-600', variant: 'default' as const };
  };

  const getAIProbability = (probability: number) => {
    if (probability >= 80) return { level: 'Very Likely AI', color: 'text-red-600', variant: 'destructive' as const };
    if (probability >= 60) return { level: 'Likely AI', color: 'text-orange-600', variant: 'secondary' as const };
    if (probability >= 40) return { level: 'Possibly AI', color: 'text-yellow-600', variant: 'outline' as const };
    return { level: 'Likely Human', color: 'text-green-600', variant: 'default' as const };
  };

  // FIXED: Helper function to extract plagiarism score (handles both naming conventions)
  const getPlagiarismScore = (result: any): number => {
    if (result.plagiarism_score !== undefined) return result.plagiarism_score;
    if (result.plagiarismscore !== undefined) return result.plagiarismscore;
    return 0;
  };

  // FIXED: Helper function to extract flagged content (handles both naming conventions)
  const getFlaggedContent = (result: any): any[] => {
    if (result.flagged_content) return result.flagged_content;
    if (result.flaggedcontent) return result.flaggedcontent;
    return [];
  };

  // FIXED: Helper function to extract AI probability (handles both naming conventions)
  const getAIProbabilityScore = (result: any): number => {
    if (result.ai_probability !== undefined) return result.ai_probability;
    if (result.aiprobability !== undefined) return result.aiprobability;
    return 0;
  };

  // FIXED: Helper function to extract AI analysis (handles both naming conventions)
  const getAIAnalysis = (result: any): any[] => {
    if (result.analysis) return result.analysis;
    return [];
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          <h1 className="text-3xl font-bold">Content Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Detect plagiarism and AI-generated content with advanced analysis tools
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-6xl">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'plagiarism' | 'ai-detection')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="plagiarism" className="flex items-center gap-2">
                  <Search className="size-4" />
                  Plagiarism Detection
                </TabsTrigger>
                <TabsTrigger value="ai-detection" className="flex items-center gap-2">
                  <Bot className="size-4" />
                  AI Content Detection
                </TabsTrigger>
              </TabsList>

              <TabsContent value="plagiarism" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        Plagiarism Checker
                      </CardTitle>
                      <CardDescription>
                        Check your text against online sources and databases for potential plagiarism
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="plagiarismText">Text to Analyze</Label>
                        <Textarea
                          id="plagiarismText"
                          placeholder="Paste the text you want to check for plagiarism..."
                          className="min-h-[300px]"
                          value={plagiarismText}
                          onChange={(e) => setPlagiarismText(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="size-4" />
                        <span>{plagiarismText.length} characters</span>
                      </div>
                      
                      <Button 
                        onClick={handleCheckPlagiarism} 
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Checking for Plagiarism...
                          </>
                        ) : (
                          <>
                            <Search className="size-4 mr-2" />
                            Check Plagiarism
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {plagiarismResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="size-5 text-green-500" />
                          Plagiarism Analysis Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {(() => {
                          // FIXED: Use helper functions to extract data
                          const plagiarismScore = getPlagiarismScore(plagiarismResult);
                          const flaggedContent = getFlaggedContent(plagiarismResult);

                          return (
                            <>
                              <div className="text-center">
                                <div className={`text-6xl font-bold ${getPlagiarismSeverity(plagiarismScore).color}`}>
                                  {Math.round(plagiarismScore)}%
                                </div>
                                <Badge variant={getPlagiarismSeverity(plagiarismScore).variant} className="mt-2">
                                  {getPlagiarismSeverity(plagiarismScore).level}
                                </Badge>
                                <Progress value={plagiarismScore} className="mt-4" />
                              </div>
                              
                              {flaggedContent.length > 0 && (
                                <>
                                  <Alert>
                                    <AlertTriangle className="size-4" />
                                    <AlertTitle>Potential Issues Found</AlertTitle>
                                    <AlertDescription>
                                      We found {flaggedContent.length} section{flaggedContent.length !== 1 ? 's' : ''} that may require attention.
                                    </AlertDescription>
                                  </Alert>
                                  
                                  <Separator />
                                  
                                  <div>
                                    <h4 className="font-semibold mb-3">Flagged Content</h4>
                                    <div className="space-y-4">
                                      {flaggedContent.map((item: any, index: number) => {
                                        // FIXED: Handle both naming conventions for item properties
                                        const itemText = item.text || '';
                                        const itemSource = item.source || 'Unknown Source';
                                        const itemUrl = item.url || '#';
                                        const itemSimilarity = item.similarity_score || item.similarityscore || 0;

                                        return (
                                          <Card key={index} className="p-4 border-l-4 border-l-orange-500">
                                            <div className="flex items-start justify-between mb-2">
                                              <Badge variant="outline" className="text-xs">
                                                {itemSimilarity}% Match
                                              </Badge>
                                              {itemUrl !== '#' && (
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm" 
                                                  className="text-xs h-auto p-1 hover:text-blue-600"
                                                  onClick={() => window.open(itemUrl, '_blank')}
                                                >
                                                  <ExternalLink className="size-3 mr-1" />
                                                  View Source
                                                </Button>
                                              )}
                                            </div>
                                            <p className="text-sm mb-2 p-2 bg-muted/50 rounded italic">
                                              "{itemText}"
                                            </p>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              <span className="font-semibold">Source:</span> {itemSource}
                                            </p>
                                            {itemUrl !== '#' && (
                                              <a 
                                                href={itemUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1 break-all"
                                              >
                                                <ExternalLink className="size-3 flex-shrink-0" />
                                                <span className="truncate">{itemUrl}</span>
                                              </a>
                                            )}
                                          </Card>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {flaggedContent.length === 0 && (
                                <Alert>
                                  <CheckCircle className="size-4" />
                                  <AlertTitle>Content Looks Original</AlertTitle>
                                  <AlertDescription>
                                    No significant plagiarism detected. The content appears to be original.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ai-detection" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="size-5" />
                        AI Content Detector
                      </CardTitle>
                      <CardDescription>
                        Analyze text to determine if it was generated by AI tools like ChatGPT, GPT-4, or others
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="aiText">Text to Analyze</Label>
                        <Textarea
                          id="aiText"
                          placeholder="Paste the text you want to analyze for AI generation..."
                          className="min-h-[300px]"
                          value={aiText}
                          onChange={(e) => setAiText(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="size-4" />
                        <span>{aiText.length} characters</span>
                      </div>
                      
                      <Button 
                        onClick={handleDetectAI} 
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Analyzing Content...
                          </>
                        ) : (
                          <>
                            <Bot className="size-4 mr-2" />
                            Detect AI Content
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {aiResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="size-5 text-green-500" />
                          AI Detection Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {(() => {
                          // FIXED: Use helper functions to extract data
                          const aiProbability = getAIProbabilityScore(aiResult);
                          const analysis = getAIAnalysis(aiResult);

                          return (
                            <>
                              <div className="text-center">
                                <div className={`text-6xl font-bold ${getAIProbability(aiProbability).color}`}>
                                  {Math.round(aiProbability)}%
                                </div>
                                <Badge variant={getAIProbability(aiProbability).variant} className="mt-2">
                                  {getAIProbability(aiProbability).level}
                                </Badge>
                                <Progress value={aiProbability} className="mt-4" />
                              </div>
                              
                              <Separator />
                              
                              {analysis.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3">Detailed Analysis</h4>
                                  <div className="space-y-4">
                                    {analysis.map((section: any, index: number) => (
                                      <Card key={index} className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="font-medium">{section.section}</h5>
                                          <Badge 
                                            variant={section.probability >= 70 ? 'destructive' : 
                                                    section.probability >= 50 ? 'secondary' : 'outline'}
                                            className="text-xs"
                                          >
                                            {section.probability}% AI
                                          </Badge>
                                        </div>
                                        <Progress value={section.probability} className="mb-2 h-2" />
                                        <p className="text-sm text-muted-foreground">
                                          {section.reasoning}
                                        </p>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <Alert>
                                <Bot className="size-4" />
                                <AlertTitle>Analysis Summary</AlertTitle>
                                <AlertDescription>
                                  {aiProbability >= 80 
                                    ? "This content is very likely to be AI-generated. Multiple indicators suggest artificial intelligence was used."
                                    : aiProbability >= 60
                                    ? "This content likely contains AI-generated portions. Some sections show typical AI writing patterns."
                                    : aiProbability >= 40
                                    ? "This content might be partially AI-generated, but shows mixed patterns of human and AI writing."
                                    : "This content appears to be human-written with natural language patterns and stylistic variations."
                                  }
                                </AlertDescription>
                              </Alert>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
