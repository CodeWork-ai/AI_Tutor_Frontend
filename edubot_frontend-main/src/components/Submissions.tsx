import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, FileText, Code, BookOpen, Loader2, CheckCircle, Clock, AlertCircle, Eye, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { apiService, Submission } from '../services/api';
import { toast } from 'sonner';
import { Modal } from 'antd';


// Define proper TypeScript interfaces for API responses
interface GradingDetail {
  session_id: string;
  score: number;
  feedback: string;
  key_points: string[];
  areas_for_improvement: string[];
  max_score: number;
}

// ADD THIS: Define the grading response type with optional nested properties
interface GradingResponse {
  score?: number;
  feedback?: string;
  key_points?: string[];
  areas_for_improvement?: string[];
  grading?: {
    score?: number;
    feedback?: string;
    keypoints?: string[];
    key_points?: string[];
    areasforimprovement?: string[];
    areas_for_improvement?: string[];
  };
}


interface SubmissionDetail extends Submission {
  grading_detail?: GradingDetail;
  key_points?: string[];
  areas_for_improvement?: string[];
}


export function Submissions() {
  const [activeTab, setActiveTab] = useState<'list' | 'submit'>('list');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    type: 'assignment' as 'assignment' | 'code' | 'essay',
    file: null as File | null
  });


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<{
    id: string;
    title: string;
    score?: number;
    maxScore?: number;
    feedback?: string;
    keyPoints?: string[];
    areasForImprovement?: string[];
    isLoading: boolean;
  } | null>(null);


  useEffect(() => {
    loadSubmissions();
  }, []);


  const loadSubmissions = async () => {
    try {
      const user = apiService.getCurrentUser();
      if (!user) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }


      const response = await apiService.getSubmissions(user.id);
      console.log('Loaded submissions:', response);
      setSubmissions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSubmitForm(prev => ({ ...prev, file }));
    }
  };


  const handleSubmit = async () => {
    if (!submitForm.title.trim() || !submitForm.file) {
      toast.error('Please provide a title and select a file');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const user = apiService.getCurrentUser();
      if (!user) {
        toast.error('You must be logged in to submit');
        setIsSubmitting(false);
        return;
      }


      console.log('Submitting file:', submitForm.file.name);


      // FIXED: Use submit-file endpoint instead of submit
      const formData = new FormData();
      formData.append('assignment_id', submitForm.title);
      formData.append('user_id', user.id);
      formData.append('submission_type', submitForm.type);
      formData.append('file', submitForm.file);


      const baseUrl = apiService['baseUrl'];
      
      // FIXED: Changed endpoint from /submit to /submit-file
      const response = await fetch(`${baseUrl}/api/submissions/submit-file`, {
        method: 'POST',
        body: formData,
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Submission failed' }));
        throw new Error(errorData.detail || 'Submission failed');
      }


      const submitResponse = await response.json();
      console.log('Submission created:', submitResponse);
      
      if (!submitResponse || !submitResponse.id) {
        throw new Error('Submission failed - no submission ID returned');
      }
      
      toast.success('Assignment submitted successfully! Grading in progress...');
      
      // Get the extracted content from backend
      let extractedContent = submitResponse.content || '';
      
      console.log('📄 Content length:', extractedContent.length);
      console.log('📄 Content preview:', extractedContent.substring(0, 300));
      
      if (!extractedContent || extractedContent.trim().length < 10) {
        toast.warning('File content extraction incomplete. Using minimal grading.');
        extractedContent = `Assignment: ${submitForm.title}\nFile: ${submitForm.file.name}\n\nNote: Content could not be extracted from the file. This may be a scanned PDF or an unsupported format.`;
      } else {
        console.log('✅ Content extracted successfully:', extractedContent.substring(0, 200) + '...');
      }
      
      // Grade the submission
      const getDetailedRubric = (type: string) => {
        const fileName = submitForm.file?.name || '';
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        
        switch(type) {
          case 'code':
            return `
Evaluate the submitted code based on the following criteria:
1. Correctness (30%): Does the code solve the problem correctly?
2. Code Quality (25%): Is the code well-structured, readable, and maintainable?
3. Efficiency (20%): Does the code use appropriate algorithms and data structures?
4. Best Practices (15%): Does it follow language-specific conventions and standards?
5. Documentation (10%): Are there appropriate comments and documentation?


Provide specific, actionable feedback for each criterion.
File type: ${fileExtension}
`.trim();
          case 'essay':
            return `
Evaluate the submitted essay based on the following criteria:
1. Thesis & Argument (30%): Clear thesis statement and strong argumentation
2. Content & Analysis (25%): Depth of research and critical analysis
3. Organization & Structure (20%): Logical flow and paragraph structure
4. Writing Quality (15%): Grammar, clarity, and academic tone
5. Citations & Sources (10%): Proper citation and use of credible sources


Provide specific, constructive feedback for each criterion.
Document type: ${fileExtension}
`.trim();
          default:
            return `
Evaluate the submitted assignment based on the following criteria:
1. Understanding (30%): Demonstrates comprehension of the topic
2. Completeness (25%): Addresses all required components
3. Quality (20%): Depth and accuracy of content
4. Organization (15%): Clear structure and presentation
5. Effort & Originality (10%): Shows original thinking and effort


Provide specific, helpful feedback for each criterion.
File type: ${fileExtension}
`.trim();
        }
      };
      
      try {
        let gradingResponse: GradingResponse;
        
        console.log('🎓 Starting grading process...');
        
        if (submitForm.type === 'code') {
          gradingResponse = await apiService.gradeCode({
            problem_description: `Assignment: ${submitForm.title}\nFile: ${submitForm.file?.name || 'Unknown'}`,
            student_code: extractedContent,
            rubric: getDetailedRubric('code')
          });
        } else {
          gradingResponse = await apiService.gradeText({
            question: `Assignment: ${submitForm.title}\nType: ${submitForm.type}\nFile: ${submitForm.file?.name || 'Unknown'}`,
            answer: extractedContent,
            assignment_type: submitForm.type === 'essay' ? 'Essay' : 'Assignment',
            total_score: 100,
            rubric: getDetailedRubric(submitForm.type)
          });
        }
        
        console.log('🎓 Grading response:', gradingResponse);
        
        // Extract grade
        let extractedGrade = 0;
        if (gradingResponse?.grading?.score !== undefined) {
          extractedGrade = gradingResponse.grading.score;
        } else if (gradingResponse?.score !== undefined) {
          extractedGrade = gradingResponse.score;
        }
        
        console.log('🎓 Extracted grade:', extractedGrade);
        
        // Update submission with grade
        if (submitResponse.id && gradingResponse) {
          const feedbackText = gradingResponse.grading?.feedback || gradingResponse.feedback || 'Graded successfully';
          const keyPoints = gradingResponse.grading?.keypoints || gradingResponse.grading?.key_points || gradingResponse.key_points || [];
          const areasForImprovement = gradingResponse.grading?.areasforimprovement || gradingResponse.grading?.areas_for_improvement || gradingResponse.areas_for_improvement || [];
          
          console.log('📝 Updating submission with grade data:', {
            grade: extractedGrade,
            feedbackLength: feedbackText.length,
            keyPointsCount: keyPoints.length,
            areasCount: areasForImprovement.length
          });
          
          await apiService.gradeSubmission(
            submitResponse.id,
            extractedGrade,
            feedbackText,
            keyPoints,
            areasForImprovement
          );
          
          toast.success(`Assignment graded! Score: ${extractedGrade}/100`, {
            duration: 5000
          });
        }
      } catch (gradingError) {
        console.error('❌ Grading failed:', gradingError);
        toast.warning('Assignment submitted but grading failed. You can check it later.');
        
        // Update with error status
        try {
          await apiService.gradeSubmission(
            submitResponse.id,
            0,
            'Automatic grading failed. Please contact your instructor for manual grading.'
          );
        } catch (updateError) {
          console.error('Failed to update submission status:', updateError);
        }
      }
      
      // Reset form
      setSubmitForm({ title: '', type: 'assignment', file: null });
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Reload submissions
      await loadSubmissions();
      setActiveTab('list');
      
    } catch (error: any) {
      console.error('❌ Submission error:', error);
      toast.error(error.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return 'default';
      case 'reviewed': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded': return CheckCircle;
      case 'reviewed': return Eye;
      case 'pending': return Clock;
      default: return AlertCircle;
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return Code;
      case 'essay': return BookOpen;
      case 'assignment': return FileText;
      default: return FileText;
    }
  };


  const handleView = async (submissionId: string) => {
    setCurrentSubmission(null);
    setIsModalOpen(true);
    
    setCurrentSubmission({
      id: submissionId,
      title: 'Loading...',
      isLoading: true
    });


    try {
      const detail: SubmissionDetail = await apiService.getSubmission(submissionId);
      console.log('Submission detail:', detail);
  
      let score: number | undefined;
      let maxScore: number | undefined;
      let feedback: string | undefined;
      let keyPoints: string[] | undefined;
      let areasForImprovement: string[] | undefined;


      if (detail.grading_detail) {
        score = detail.grading_detail.score;
        maxScore = detail.grading_detail.max_score;
        feedback = detail.grading_detail.feedback;
        keyPoints = detail.grading_detail.key_points;
        areasForImprovement = detail.grading_detail.areas_for_improvement;
      } else {
        score = detail.grade ? (typeof detail.grade === 'string' ? parseFloat(detail.grade) : detail.grade) : undefined;
        feedback = detail.feedback;
        maxScore = 100;
        keyPoints = detail.key_points;
        areasForImprovement = detail.areas_for_improvement;
      }


      setCurrentSubmission({
        id: detail.id,
        title: detail.assignment_id || 'Submission',
        score: score,
        maxScore: maxScore,
        feedback: feedback || 'No feedback available',
        keyPoints: keyPoints,
        areasForImprovement: areasForImprovement,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load submission details:', error);
      toast.error('Failed to load submission details');
      setIsModalOpen(false);
      setCurrentSubmission(null);
    }
  };


  const handleCancel = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setCurrentSubmission(null);
    }, 200);
  };


  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };


  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };


  const getScoreBadgeVariant = (score: number, maxScore: number = 100): "default" | "secondary" | "destructive" | "outline" => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    if (percentage >= 60) return 'outline';
    return 'destructive';
  };


  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-6">
            <h1 className="text-3xl font-bold">Submissions</h1>
            <p className="text-muted-foreground mt-2">Submit assignments and get instant AI grading feedback</p>
          </div>
        </div>
    
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-6xl mx-auto">
              <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'list' | 'submit')}>
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="grid w-fit grid-cols-2">
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <FileText className="size-4" />My Submissions
                    </TabsTrigger>
                    <TabsTrigger value="submit" className="flex items-center gap-2">
                      <Plus className="size-4" />Submit New
                    </TabsTrigger>
                  </TabsList>
                  {activeTab === 'list' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="size-4" />
                      <span>{submissions?.length || 0} submission{submissions?.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
          
                <TabsContent value="list" className="mt-0">
                  {!submissions || submissions.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <Upload className="size-16 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold mb-2">No Submissions Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                          You haven't submitted any assignments yet. Click "Submit New" to upload your first assignment and get instant AI grading.
                        </p>
                        <Button onClick={() => setActiveTab('submit')}>
                          <Plus className="size-4 mr-2" />Submit Assignment
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {submissions.map((submission) => {
                        const StatusIcon = getStatusIcon(submission.status);
                        const TypeIcon = getTypeIcon(submission.submission_type || 'assignment');
                        return (
                          <Card key={submission.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <TypeIcon className="size-5 text-muted-foreground flex-shrink-0" />
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {submission.submission_type || 'assignment'}
                                  </Badge>
                                </div>
                                <Badge variant={getStatusColor(submission.status)} className="text-xs flex-shrink-0">
                                  <StatusIcon className="size-3 mr-1" />
                                  {submission.status}
                                </Badge>
                              </div>
                              <CardTitle className="text-base line-clamp-2">
                                {submission.assignment_id || 'Untitled'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="size-4 flex-shrink-0" />
                                <span className="truncate">{formatDate(submission.submitted_at)}</span>
                              </div>
                              {submission.grade !== undefined && submission.grade !== null && (
                                (() => {
                                  const numericGrade = typeof submission.grade === 'string' ? parseFloat(submission.grade) : submission.grade;
                                  if (isNaN(numericGrade)) return null;
                                  
                                  return (
                                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                      <span className="text-sm font-medium">Grade:</span>
                                      <Badge variant={numericGrade >= 90 ? 'default' : numericGrade >= 80 ? 'secondary' : 'outline'}>
                                        {numericGrade}%
                                      </Badge>
                                    </div>
                                  );
                                })()
                              )}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleView(submission.id)}
                                >
                                  <Eye className="size-3 mr-1" />View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
          
                <TabsContent value="submit" className="mt-0">
                  <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="size-5" />Submit New Assignment
                      </CardTitle>
                      <CardDescription>Upload your assignment file and get instant AI grading feedback</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Assignment Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Python Programming Exercise 1"
                          value={submitForm.title}
                          onChange={(e) => setSubmitForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                
                      <div className="space-y-2">
                        <Label htmlFor="type">Assignment Type</Label>
                        <Select
                          value={submitForm.type}
                          onValueChange={(value: 'assignment' | 'code' | 'essay') =>
                            setSubmitForm(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assignment">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4" />Assignment
                              </div>
                            </SelectItem>
                            <SelectItem value="code">
                              <div className="flex items-center gap-2">
                                <Code className="size-4" />Code Project
                              </div>
                            </SelectItem>
                            <SelectItem value="essay">
                              <div className="flex items-center gap-2">
                                <BookOpen className="size-4" />Essay/Report
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Upload File</Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                             onClick={() => document.getElementById('file-upload')?.click()}>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.py,.js,.java,.cpp,.c,.cs,.zip"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT, Code files (max 10MB)</p>
                        </div>
                        {submitForm.file && (
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                            <FileText className="size-4 flex-shrink-0" />
                            <span className="flex-1 truncate">{submitForm.file.name}</span>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {(submitForm.file.size / 1024 / 1024).toFixed(1)} MB
                            </Badge>
                          </div>
                        )}
                      </div>
                
                      <Separator />
                
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !submitForm.title.trim() || !submitForm.file}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Submitting & Grading...
                          </>
                        ) : (
                          <>
                            <Upload className="size-4 mr-2" />
                            Submit & Grade Assignment
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      </div>


      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircle className="size-5 text-green-500" />
            <span>Submission Details & AI Feedback</span>
          </div>
        }
        open={isModalOpen}
        onOk={handleCancel}
        onCancel={handleCancel}
        width={800}
        closable
        destroyOnClose={true}
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>
        ]}
        styles={{
          body: {
            maxHeight: '70vh',
            overflow: 'auto'
          }
        }}
      >
        {currentSubmission?.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Loading submission details...</span>
          </div>
        ) : currentSubmission ? (
          <div className="space-y-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Submission</h5>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {currentSubmission.title}
              </p>
            </div>


            {currentSubmission.score !== undefined && currentSubmission.score !== null && (
              <div className={`p-4 rounded-lg border ${
                (currentSubmission.score / (currentSubmission.maxScore || 100)) * 100 >= 70
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <h5 className={`font-semibold mb-2 ${
                  (currentSubmission.score / (currentSubmission.maxScore || 100)) * 100 >= 70
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  Final Grade
                </h5>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-bold ${getScoreColor(currentSubmission.score, currentSubmission.maxScore)}`}>
                    {currentSubmission.score}/{currentSubmission.maxScore || 100}
                  </p>
                  <Badge variant={getScoreBadgeVariant(currentSubmission.score, currentSubmission.maxScore)} className="text-lg px-3 py-1">
                    {Math.round((currentSubmission.score / (currentSubmission.maxScore || 100)) * 100)}%
                  </Badge>
                </div>
              </div>
            )}
        
            <div>
              <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                <BookOpen className="size-5" />
                AI Feedback
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg border">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {currentSubmission.feedback}
                </p>
              </div>
            </div>


            {currentSubmission.keyPoints && currentSubmission.keyPoints.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                  <CheckCircle className="size-5 text-green-500" />
                  Key Points
                </h4>
                <div className="space-y-2">
                  {currentSubmission.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {currentSubmission.areasForImprovement && currentSubmission.areasForImprovement.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                  <AlertTriangle className="size-5 text-orange-500" />
                  Areas for Improvement
                </h4>
                <div className="space-y-2">
                  {currentSubmission.areasForImprovement.map((area, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <AlertTriangle className="size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {currentSubmission.feedback && currentSubmission.feedback !== 'No feedback available' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const fullFeedback = `
Score: ${currentSubmission.score}/${currentSubmission.maxScore || 100}


Feedback:
${currentSubmission.feedback}


${currentSubmission.keyPoints && currentSubmission.keyPoints.length > 0 ? `Key Points:\n${currentSubmission.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` : ''}
${currentSubmission.areasForImprovement && currentSubmission.areasForImprovement.length > 0 ? `Areas for Improvement:\n${currentSubmission.areasForImprovement.map((a, i) => `${i + 1}. ${a}`).join('\n')}` : ''}
                    `.trim();
                    navigator.clipboard.writeText(fullFeedback);
                    toast.success('Full feedback copied to clipboard!');
                  }}
                >
                  📋 Copy Full Feedback
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
