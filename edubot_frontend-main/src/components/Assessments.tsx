// src/components/Assessments.tsx
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Progress } from './ui/progress';
import { 
  ClipboardList, 
  Plus, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Trophy,
  BookOpen,
  Target,
  Sparkles,
  Brain,
  CheckCheck
} from 'lucide-react';
import { apiService, Assessment, AssessmentQuestion, AssessmentEvaluation } from '../services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function Assessments() {
  const [activeView, setActiveView] = useState<'create' | 'take' | 'results'>('create');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<AssessmentEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    topic: '',
    subject: '',
    type: 'mcq' as 'mcq' | 'mixed',
    numQuestions: 5,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAssessments();
      setAssessments(data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!createForm.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsCreating(true);
    try {
      const assessment = await apiService.createAssessment(createForm);
      toast.success('Assessment created successfully!');
      await loadAssessments();
      setCurrentAssessment(assessment);
      setActiveView('take');
      setCreateForm({ topic: '', subject: '', type: 'mcq', numQuestions: 5, difficulty: 'medium' });
    } catch (error) {
      toast.error('Failed to create assessment');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment) return;

    if (Object.keys(userAnswers).length < currentAssessment.questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    setIsLoading(true);
    try {
      const evaluation = await apiService.evaluateAssessment(currentAssessment.id, userAnswers);
      setResults(evaluation);
      setActiveView('results');
      toast.success('Assessment submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit assessment');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header - Fixed */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <ClipboardList className="size-6 text-green" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Assessments
                </h1>
                <p className="text-muted-foreground mt-1">
                  Create and take AI-generated quizzes and tests
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeView === 'create' ? 'default' : 'outline'}
                onClick={() => setActiveView('create')}
                className="gap-2"
              >
                <Plus className="size-4" />
                Create
              </Button>
              <Button
                variant={activeView === 'take' ? 'default' : 'outline'}
                onClick={() => setActiveView('take')}
                className="gap-2"
                disabled={assessments.length === 0}
              >
                <BookOpen className="size-4" />
                Take Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-5xl mx-auto">
            {activeView === 'create' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="size-5 text-purple-500" />
                      Create New Assessment
                    </CardTitle>
                    <CardDescription>
                      Generate AI-powered quizzes on any topic
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="topic">Topic *</Label>
                        <Input
                          id="topic"
                          placeholder="e.g., Photosynthesis, World War II"
                          value={createForm.topic}
                          onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject (Optional)</Label>
                        <Input
                          id="subject"
                          placeholder="e.g., Biology, History"
                          value={createForm.subject}
                          onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select
                          value={createForm.type}
                          onValueChange={(value: 'mcq' | 'mixed') =>
                            setCreateForm({ ...createForm, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="mixed">Mixed Format</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Number of Questions</Label>
                        <Select
                          value={createForm.numQuestions.toString()}
                          onValueChange={(value) =>
                            setCreateForm({ ...createForm, numQuestions: parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} Questions
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <Select
                          value={createForm.difficulty}
                          onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                            setCreateForm({ ...createForm, difficulty: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateAssessment}
                      disabled={isCreating}
                      className="w-full h-12 text-lg"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="size-5 mr-2 animate-spin" />
                          Generating Assessment...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-5 mr-2" />
                          Generate Assessment
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Previous Assessments */}
                {assessments.length > 0 && (
                  <Card className="border-2 shadow-lg">
                    <CardHeader>
                      <CardTitle>Previous Assessments</CardTitle>
                      <CardDescription>Click on an assessment to take it again</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {assessments.map((assessment) => (
                          <button
                            key={assessment.id}
                            onClick={() => {
                              setCurrentAssessment(assessment);
                              setUserAnswers({});
                              setActiveView('take');
                            }}
                            className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary hover:bg-accent transition-all text-left"
                          >
                            <div>
                              <p className="font-semibold">{assessment.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {assessment.questions.length} questions • {assessment.difficulty}
                              </p>
                            </div>
                            <Badge variant="outline">{assessment.type.toUpperCase()}</Badge>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {activeView === 'take' && currentAssessment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pb-6"
              >
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{currentAssessment.title}</CardTitle>
                        <CardDescription>
                          {currentAssessment.questions.length} questions • {currentAssessment.difficulty}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-lg px-4 py-1">
                        {Object.keys(userAnswers).length}/{currentAssessment.questions.length}
                      </Badge>
                    </div>
                    <Progress
                      value={(Object.keys(userAnswers).length / currentAssessment.questions.length) * 100}
                      className="mt-4"
                    />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {currentAssessment.questions.map((question, index) => (
                      <Card key={index} className="border-2">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              Q{index + 1}
                            </Badge>
                            <p className="font-medium flex-1">{question.prompt}</p>
                          </div>

                          {/* FIXED: Better RadioGroup implementation */}
                          {question.type === 'mcq' && question.options && (
                            <RadioGroup
                              value={userAnswers[index.toString()]}
                              onValueChange={(value) => {
                                setUserAnswers({ ...userAnswers, [index.toString()]: value });
                              }}
                              className="space-y-3"
                            >
                              {question.options.map((option, optIndex) => {
                                const isSelected = userAnswers[index.toString()] === option;
                                return (
                                  <label
                                    key={optIndex}
                                    htmlFor={`q${index}-opt${optIndex}`}
                                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all group ${
                                      isSelected
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-primary/50 hover:bg-accent'
                                    }`}
                                  >
                                    <RadioGroupItem 
                                      value={option} 
                                      id={`q${index}-opt${optIndex}`}
                                      className="flex-shrink-0"
                                    />
                                    <span className="flex-1 text-sm font-medium select-none">
                                      {option}
                                    </span>
                                    {isSelected && (
                                      <CheckCheck className="size-5 text-primary flex-shrink-0" />
                                    )}
                                  </label>
                                );
                              })}
                            </RadioGroup>
                          )}

                          {question.type !== 'mcq' && (
                            <Input
                              placeholder="Type your answer here..."
                              value={userAnswers[index.toString()] || ''}
                              onChange={(e) =>
                                setUserAnswers({ ...userAnswers, [index.toString()]: e.target.value })
                              }
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      onClick={handleSubmitAssessment}
                      disabled={isLoading || Object.keys(userAnswers).length < currentAssessment.questions.length}
                      className="w-full h-12 text-lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-5 mr-2 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Target className="size-5 mr-2" />
                          Submit Assessment ({Object.keys(userAnswers).length}/{currentAssessment.questions.length})
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeView === 'results' && results && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 pb-6"
              >
                <Card className="border-2 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <CardHeader className="text-center pb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="mx-auto size-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg mb-4"
                    >
                      <Trophy className="size-12 text-green" />
                    </motion.div>
                    <CardTitle className="text-4xl">Assessment Complete!</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Here's how you performed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center p-8 bg-background/50 rounded-xl border-2">
                      <p className="text-sm text-muted-foreground mb-2">Your Score</p>
                      <p className={`text-6xl font-bold ${getScoreColor(results.score, results.total)}`}>
                        {results.score}/{results.total}
                      </p>
                      <p className="text-2xl font-semibold mt-2">
                        {Math.round((results.score / results.total) * 100)}%
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Brain className="size-5" />
                        Detailed Results
                      </h3>
                      {results.results.map((result, index) => (
                        <Card
                          key={index}
                          className={`border-2 ${
                            result.is_correct ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
                          }`}
                        >
                          <CardContent className="pt-6 space-y-3">
                            <div className="flex items-start gap-3">
                              {result.is_correct ? (
                                <CheckCircle className="size-5 text-green-600 mt-1 flex-shrink-0" />
                              ) : (
                                <XCircle className="size-5 text-red-600 mt-1 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{result.prompt}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                  <p>
                                    <span className="text-muted-foreground">Your answer:</span>{' '}
                                    <span className={result.is_correct ? 'text-green-600 font-medium' : 'text-red-600'}>
                                      {result.user_answer}
                                    </span>
                                  </p>
                                  {!result.is_correct && (
                                    <p>
                                      <span className="text-muted-foreground">Correct answer:</span>{' '}
                                      <span className="text-green-600 font-medium">{result.correct_answer}</span>
                                    </p>
                                  )}
                                </div>
                                <div className="mt-3 p-3 bg-background/50 rounded-lg border">
                                  <p className="text-sm">
                                    <span className="font-semibold">Explanation:</span> {result.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setActiveView('create');
                          setResults(null);
                          setCurrentAssessment(null);
                          setUserAnswers({});
                        }}
                      >
                        Create New Assessment
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setUserAnswers({});
                          setActiveView('take');
                          setResults(null);
                        }}
                      >
                        Retake Assessment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
