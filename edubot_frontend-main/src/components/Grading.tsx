import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import {
  FileText,
  Code,
  Loader2,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  Star
} from 'lucide-react';
import { apiService, GradingResponse, CodeGradingResponse, TextGradingRequest, CodeGradingRequest } from '../services/api';
import { toast } from 'sonner';


export function Grading() {
  const [activeTab, setActiveTab] = useState<'assignment' | 'code'>('assignment');
  const [isLoading, setIsLoading] = useState(false);


  // Text grading state
  const [textForm, setTextForm] = useState({
    question: '',
    answer: '',
    assignment_type: 'Essay',
    total_score: 10,
    rubric: ''
  });
  const [textResult, setTextResult] = useState<GradingResponse | null>(null);


  // Code grading state
  const [codeForm, setCodeForm] = useState({
    problem_description: '',
    student_code: '',
    rubric: ''
  });
  const [codeResult, setCodeResult] = useState<any | null>(null);


  const handleGradeText = async () => {
    if (!textForm.question.trim() || !textForm.answer.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }


    setIsLoading(true);
    try {
      const request: TextGradingRequest = {
        question: textForm.question,
        answer: textForm.answer,
        assignment_type: textForm.assignment_type,
        total_score: textForm.total_score,
        rubric: textForm.rubric || undefined
      };
      const response = await apiService.gradeText(request);
      console.log('Text Grading Response:', response);
      setTextResult(response);
      toast.success('Text graded successfully!');
    } catch (error) {
      toast.error('Failed to grade text');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleGradeCode = async () => {
    if (!codeForm.problem_description.trim() || !codeForm.student_code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }


    setIsLoading(true);
    try {
      const request: CodeGradingRequest = {
        problem_description: codeForm.problem_description,
        student_code: codeForm.student_code,
        rubric: codeForm.rubric || undefined
      };
      const response = await apiService.gradeCode(request);
      console.log('Code Grading Response:', response);
      setCodeResult(response);
      toast.success('Code graded successfully!');
    } catch (error) {
      toast.error('Failed to grade code');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };


  const getGradeBadgeVariant = (grade: number): "default" | "secondary" | "destructive" | "outline" => {
    if (grade >= 90) return 'default';
    if (grade >= 70) return 'secondary';
    if (grade >= 60) return 'outline';
    return 'destructive';
  };


  const getGradeLabel = (grade: number) => {
    if (grade >= 90) return 'Excellent';
    if (grade >= 80) return 'Good';
    if (grade >= 70) return 'Satisfactory';
    if (grade >= 60) return 'Needs Improvement';
    return 'Unsatisfactory';
  };


  // FIXED: Extract grade from nested response structure
  const extractGradeFromResponse = (result: any): number => {
    console.log('=== EXTRACTING GRADE FROM RESPONSE ===');
    console.log('Full Response:', result);


    // CRITICAL FIX: Check for nested "grading" object first (your backend structure)
    if (result.grading) {
      console.log('Found grading object:', result.grading);
      
      // Priority 1: Check grading.score
      if (result.grading.score !== undefined && result.grading.score !== null) {
        const score = typeof result.grading.score === 'number' ? result.grading.score : parseFloat(String(result.grading.score));
        console.log('✓ Found grading.score:', score);
        return score;
      }


      // Priority 2: Check grading.grade
      if (result.grading.grade !== undefined && result.grading.grade !== null) {
        const grade = typeof result.grading.grade === 'number' ? result.grading.grade : parseFloat(String(result.grading.grade));
        console.log('✓ Found grading.grade:', grade);
        return grade;
      }


      // Priority 3: Extract from grading.feedback
      if (result.grading.feedback) {
        const extracted = extractFromFeedback(result.grading.feedback);
        if (extracted > 0) {
          console.log('✓ Extracted from grading.feedback:', extracted);
          return extracted;
        }
      }
    }


    // Priority 4: Check root-level score
    if (result.score !== undefined && result.score !== null) {
      const score = typeof result.score === 'number' ? result.score : parseFloat(String(result.score));
      console.log('✓ Found root score:', score);
      return score;
    }


    // Priority 5: Check root-level grade
    if (result.grade !== undefined && result.grade !== null) {
      const grade = typeof result.grade === 'number' ? result.grade : parseFloat(String(result.grade));
      console.log('✓ Found root grade:', grade);
      return grade;
    }


    // Priority 6: Extract from root-level feedback
    if (result.feedback) {
      const extracted = extractFromFeedback(result.feedback);
      if (extracted > 0) {
        console.log('✓ Extracted from root feedback:', extracted);
        return extracted;
      }
    }


    console.log('✗ NO GRADE FOUND - Returning 0');
    return 0;
  };


  // Helper function to extract score from feedback text
  const extractFromFeedback = (feedback: string): number => {
    // Remove code blocks to avoid matching numbers from examples
    const cleanFeedback = feedback.replace(/``````/g, '');


    // Pattern 1: "X out of 100"
    let match = cleanFeedback.match(/(\d+)\s+out\s+of\s+100/i);
    if (match) return parseFloat(match[1]);


    // Pattern 2: "Overall Score: 85"
    match = cleanFeedback.match(/Overall\s+Score\s*:?\s*(\d+)/i);
    if (match) return parseFloat(match[1]);


    // Pattern 3: "Total Score: 85"
    match = cleanFeedback.match(/Total\s+Score\s*:?\s*(\d+)/i);
    if (match) return parseFloat(match[1]);


    // Pattern 4: "85/100"
    match = cleanFeedback.match(/(\d+)\s*\/\s*100/);
    if (match) return parseFloat(match[1]);


    // Pattern 5: "Score: 85"
    match = cleanFeedback.match(/Score\s*:?\s*(\d+)/i);
    if (match) {
      const score = parseFloat(match[1]);
      if (score <= 100) return score;
    }


    // Pattern 6: "85%"
    match = cleanFeedback.match(/(\d+)\s*%/);
    if (match) return parseFloat(match[1]);


    return 0;
  };


  // FIXED: Extract feedback from nested structure
  const extractFeedback = (result: any): string => {
    if (result.grading?.feedback) return result.grading.feedback;
    if (result.feedback) return result.feedback;
    return 'No feedback available';
  };


  // FIXED: Extract key points from nested structure
  const extractKeyPoints = (result: any): string[] => {
    if (result.grading?.keypoints) return result.grading.keypoints;
    if (result.grading?.key_points) return result.grading.key_points;
    if (result.keypoints) return result.keypoints;
    if (result.key_points) return result.key_points;
    return [];
  };


  // FIXED: Extract areas for improvement from nested structure
  const extractAreasForImprovement = (result: any): string[] => {
    if (result.grading?.areasforimprovement) return result.grading.areasforimprovement;
    if (result.grading?.areas_for_improvement) return result.grading.areas_for_improvement;
    if (result.areasforimprovement) return result.areasforimprovement;
    if (result.areas_for_improvement) return result.areas_for_improvement;
    return [];
  };

  // FIXED: Extract breakdown from nested structure with proper type checking
  const extractBreakdown = (result: any): Array<{ criteria: string; score: number; feedback: string }> => {
    if (result.grading?.breakdown && Array.isArray(result.grading.breakdown)) return result.grading.breakdown;
    if (result.breakdown && Array.isArray(result.breakdown)) return result.breakdown;
    return [];
  };


  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">AI Grading System</h1>
              <p className="text-muted-foreground">Grade assignments and code submissions with AI</p>
            </div>
          </div>
        </div>
      </div>


      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'assignment' | 'code')}>
              <TabsList className="mb-6">
                <TabsTrigger value="assignment" className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Text Assignment
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="size-4" />
                  Code Assignment
                </TabsTrigger>
              </TabsList>


              {/* Text Assignment Tab */}
              <TabsContent value="assignment" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Assignment Details
                      </CardTitle>
                      <CardDescription>
                        Enter the assignment question and student response
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="question">Assignment Question</Label>
                        <Textarea
                          id="question"
                          placeholder="Enter the assignment question or prompt..."
                          className="min-h-[120px]"
                          value={textForm.question}
                          onChange={(e) => setTextForm(prev => ({ ...prev, question: e.target.value }))}
                        />
                      </div>
                     
                      <div className="space-y-2">
                        <Label htmlFor="answer">Student Response</Label>
                        <Textarea
                          id="answer"
                          placeholder="Paste the student's answer here..."
                          className="min-h-[200px]"
                          value={textForm.answer}
                          onChange={(e) => setTextForm(prev => ({ ...prev, answer: e.target.value }))}
                        />
                      </div>
                     
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Assignment Type</Label>
                          <Select
                            value={textForm.assignment_type}
                            onValueChange={(value) => setTextForm(prev => ({ ...prev, assignment_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Essay">Essay</SelectItem>
                              <SelectItem value="Short Answer">Short Answer</SelectItem>
                              <SelectItem value="Research Paper">Research Paper</SelectItem>
                              <SelectItem value="Creative Writing">Creative Writing</SelectItem>
                              <SelectItem value="Analysis">Analysis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                       
                        <div className="space-y-2">
                          <Label htmlFor="totalScore">Total Points</Label>
                          <Input
                            id="totalScore"
                            type="number"
                            min="1"
                            max="100"
                            value={textForm.total_score}
                            onChange={(e) => setTextForm(prev => ({ ...prev, total_score: parseInt(e.target.value) || 10 }))}
                          />
                        </div>
                      </div>
                     
                      <div className="space-y-2">
                        <Label htmlFor="rubric">Grading Rubric (Optional)</Label>
                        <Textarea
                          id="rubric"
                          placeholder="Specify grading criteria and expectations..."
                          className="min-h-[100px]"
                          value={textForm.rubric}
                          onChange={(e) => setTextForm(prev => ({ ...prev, rubric: e.target.value }))}
                        />
                      </div>
                     
                      <Button
                        onClick={handleGradeText}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Grading Assignment...
                          </>
                        ) : (
                          <>
                            <FileText className="size-4 mr-2" />
                            Grade Assignment
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>


                  {textResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="size-5 text-green-500" />
                          Grading Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {(() => {
                          const displayGrade = extractGradeFromResponse(textResult);
                          const percentage = (displayGrade / textForm.total_score) * 100;
                          const feedback = extractFeedback(textResult);
                          const keyPoints = extractKeyPoints(textResult);
                          const areasForImprovement = extractAreasForImprovement(textResult);
                          const breakdown = extractBreakdown(textResult);


                          return (
                            <>
                              <div className="text-center">
                                <div className={`text-6xl font-bold ${getGradeColor(percentage)}`}>
                                  {Math.round(displayGrade)}
                                </div>
                                <div className="text-muted-foreground text-sm mt-1">
                                  out of {textForm.total_score} points
                                </div>
                                <Badge variant={getGradeBadgeVariant(percentage)} className="mt-2">
                                  {getGradeLabel(percentage)}
                                </Badge>
                              </div>
                             
                              <Separator />
                             
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Star className="size-4" />
                                  Feedback
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {feedback}
                                </p>
                              </div>


                              {/* Display key points */}
                              {keyPoints.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle className="size-4 text-green-500" />
                                    Key Strengths
                                  </h4>
                                  <ul className="space-y-1">
                                    {keyPoints.map((point: string, index: number) => (
                                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <CheckCircle className="size-3 text-green-500 mt-1 flex-shrink-0" />
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}


                              {/* Display areas for improvement */}
                              {areasForImprovement.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <AlertTriangle className="size-4 text-orange-500" />
                                    Areas for Improvement
                                  </h4>
                                  <ul className="space-y-1">
                                    {areasForImprovement.map((area: string, index: number) => (
                                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <AlertTriangle className="size-3 text-orange-500 mt-1 flex-shrink-0" />
                                        <span>{area}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                             
                              {breakdown.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3">Detailed Breakdown</h4>
                                  <div className="space-y-3">
                                    {breakdown.map((item: any, index: number) => (
                                      <div key={index} className="border border-border rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-medium text-sm">{item.criteria}</span>
                                          <Badge variant="outline">{item.score}/10</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.feedback}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>


              {/* Code Assignment Tab */}
              <TabsContent value="code" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="size-5" />
                        Code Submission
                      </CardTitle>
                      <CardDescription>
                        Enter the problem description and student code
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="problem">Problem Description</Label>
                        <Textarea
                          id="problem"
                          placeholder="Describe the problem and requirements..."
                          className="min-h-[120px]"
                          value={codeForm.problem_description}
                          onChange={(e) => setCodeForm(prev => ({ ...prev, problem_description: e.target.value }))}
                        />
                      </div>
                     
                      <div className="space-y-2">
                        <Label htmlFor="code">Student Code</Label>
                        <Textarea
                          id="code"
                          placeholder="Paste the student's code here..."
                          className="min-h-[250px] font-mono text-sm"
                          value={codeForm.student_code}
                          onChange={(e) => setCodeForm(prev => ({ ...prev, student_code: e.target.value }))}
                        />
                      </div>
                     
                      <div className="space-y-2">
                        <Label htmlFor="codeRubric">Grading Rubric (Optional)</Label>
                        <Textarea
                          id="codeRubric"
                          placeholder="Specify grading criteria and requirements..."
                          className="min-h-[80px]"
                          value={codeForm.rubric}
                          onChange={(e) => setCodeForm(prev => ({ ...prev, rubric: e.target.value }))}
                        />
                      </div>
                     
                      <Button
                        onClick={handleGradeCode}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Testing Code...
                          </>
                        ) : (
                          <>
                            <Code className="size-4 mr-2" />
                            Test & Grade Code
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>


                  {codeResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="size-5 text-green-500" />
                          Code Analysis Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {(() => {
                          const displayGrade = extractGradeFromResponse(codeResult);
                          const percentage = displayGrade;
                          const feedback = extractFeedback(codeResult);
                          const keyPoints = extractKeyPoints(codeResult);
                          const areasForImprovement = extractAreasForImprovement(codeResult);


                          return (
                            <>
                              <div className="text-center">
                                <div className={`text-6xl font-bold ${getGradeColor(percentage)}`}>
                                  {Math.round(displayGrade)}
                                </div>
                                <div className="text-muted-foreground text-sm mt-1">
                                  out of 100 points
                                </div>
                                <Badge variant={getGradeBadgeVariant(percentage)} className="mt-2">
                                  {getGradeLabel(percentage)}
                                </Badge>
                              </div>
                             
                              <Separator />
                             
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Star className="size-4" />
                                  Code Feedback
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {feedback}
                                </p>
                              </div>


                              {/* Display key points */}
                              {keyPoints.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle className="size-4 text-green-500" />
                                    Key Strengths
                                  </h4>
                                  <ul className="space-y-1">
                                    {keyPoints.map((point: string, index: number) => (
                                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <CheckCircle className="size-3 text-green-500 mt-1 flex-shrink-0" />
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}


                              {/* Display areas for improvement */}
                              {areasForImprovement.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <AlertTriangle className="size-4 text-orange-500" />
                                    Areas for Improvement
                                  </h4>
                                  <ul className="space-y-1">
                                    {areasForImprovement.map((area: string, index: number) => (
                                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <AlertTriangle className="size-3 text-orange-500 mt-1 flex-shrink-0" />
                                        <span>{area}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                             
                              {codeResult.test_results && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle className="size-4" />
                                    Test Results
                                  </h4>
                                  <div className="flex items-center gap-4 mb-3">
                                    <Badge variant={codeResult.test_results.passed === codeResult.test_results.total ? 'default' : 'destructive'}>
                                      {codeResult.test_results.passed}/{codeResult.test_results.total} Tests Passed
                                    </Badge>
                                    <Progress
                                      value={(codeResult.test_results.passed / codeResult.test_results.total) * 100}
                                      className="flex-1 h-2"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    {codeResult.test_results.details.map((detail: string, index: number) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        {detail.includes('✓') ? (
                                          <CheckCircle className="size-3 text-green-500" />
                                        ) : (
                                          <AlertTriangle className="size-3 text-red-500" />
                                        )}
                                        <span className="text-muted-foreground">{detail}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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
