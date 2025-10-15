import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

export function CourseGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    courseTitle: '',
    educationLevel: 'Middle/High School'
  });
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const educationLevels = [
    { value: 'Elementary School', label: 'Elementary School' },
    { value: 'Middle/High School', label: 'Middle/High School' },
    { value: 'College/University', label: 'College/University' },
    { value: 'Graduate Studies', label: 'Graduate Studies' },
    { value: 'Professional Development', label: 'Professional Development' }
  ];

  const handleGenerateComplete = async () => {
    if (!completeForm.courseTitle.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    setIsLoading(true);
    try {
      const pdfBlob = await apiService.generateCompleteCourse(
        completeForm.courseTitle,
        completeForm.educationLevel
      );
      setPdfBlob(pdfBlob);
      
      // Create a download URL for the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${completeForm.courseTitle.replace(/\\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Course generated successfully! The PDF has been downloaded.');
    } catch (error) {
      toast.error('Failed to generate course. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          <h1 className="text-3xl font-bold">Course Generation</h1>
          <p className="text-muted-foreground mt-2">
            Generate a complete course curriculum with AI assistance
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Generate Course</CardTitle>
              <CardDescription>
                Enter a course title and select education level to generate a comprehensive course PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title</Label>
                  <Input
                    id="courseTitle"
                    placeholder="e.g., Introduction to Machine Learning"
                    value={completeForm.courseTitle}
                    onChange={(e) => setCompleteForm(prev => ({ ...prev, courseTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="educationLevel">Education Level</Label>
                  <Select 
                    value={completeForm.educationLevel} 
                    onValueChange={(value: string) => setCompleteForm(prev => ({ ...prev, educationLevel: value }))}
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
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateComplete} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" />
                    Generate Course PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {pdfBlob && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-green-500" />
                  Course Generated Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your course has been generated and downloaded. Click below to download it again if needed.
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => {
                      const url = URL.createObjectURL(pdfBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${completeForm.courseTitle.replace(/\\s+/g, '_')}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="size-4 mr-2" />
                    Download PDF Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}