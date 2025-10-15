import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import {
  BookOpen,
  PlayCircle,
  CheckCircle,
  Clock,
  Users,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Target,
  ChevronRight,
  Trash2,
  Lock,
  Award,
  XCircle,
} from "lucide-react";
import { apiService, Course, CourseSection } from "../services/api";
import { toast } from "sonner";

type ViewMode = "courses" | "course-details" | "section-learning" | "quiz";

interface SectionDetailResponse {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  video_links?: any[];
  videolinks?: any[];
  key_points?: any[];
  keypoints?: any[];
  sub_topics?: any[];
  subtopics?: any[];
  introduction?: string;
  content?: string;
  examples?: string[];
  exercises?: string[];
  is_completed?: boolean;
  completed_at?: string;
}

interface ApiSectionDetail extends CourseSection {
  video_links?: any[];
  videolinks?: any[];
  key_points?: any[];
  keypoints?: any[];
  sub_topics?: any[];
  subtopics?: any[];
}

type LearningState = {
  selectedCourse: Course | null;
  selectedSection:
    | (CourseSection & {
        video_links?: Array<{
          link: string;
          title: string;
          topic: string;
          duration: string;
        }>;
        introduction?: string;
        key_points?: string[];
        sub_topics?: Array<{ subtitle: string; subexplanation: string }>;
        content?: string;
        examples?: string[];
        exercises?: string[];
      })
    | null;
  currentSectionIndex: number;
};

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: "mcq" | "truefalse";
}

interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswers: { [key: string]: string };
  showResult: boolean;
  score: number;
  totalQuestions: number;
}

export function Learning() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedCourseDetails, setSelectedCourseDetails] =
    useState<Course | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [learning, setLearning] = useState<LearningState>({
    selectedCourse: null,
    selectedSection: null,
    currentSectionIndex: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [completingSection, setCompletingSection] = useState<string | null>(
    null
  );
  const [deleteDialogCourse, setDeleteDialogCourse] = useState<Course | null>(
    null
  );
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswers: {},
    showResult: false,
    score: 0,
    totalQuestions: 5,
  });
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const isUpdatingRef = useRef(false);
  const localCompletedSectionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCourses();
      const filteredCourses = response.courses.filter(
        (course) => course.title !== "General Submissions"
      );
      setCourses(filteredCourses);
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseDetails = async (courseId: string) => {
    try {
      const [courseResponse, sectionsResponse, progressResponse] =
        await Promise.all([
          apiService.getCourse(courseId),
          apiService.getCourseSections(courseId),
          apiService.getCourseProgress(courseId).catch(() => null),
        ]);

      console.log("📊 Progress response:", progressResponse);

      const isCurrentUserEnrolled =
        progressResponse?.progress?.enrolled || false;

      const courseWithCorrectEnrollment = {
        ...courseResponse.course,
        is_enrolled: isCurrentUserEnrolled,
      };

      if (progressResponse?.progress?.completed_sections) {
        const completedSections = progressResponse.progress.completed_sections;
        if (Array.isArray(completedSections)) {
          localCompletedSectionsRef.current = new Set(completedSections);
        }
      }

      setSelectedCourseDetails(courseWithCorrectEnrollment);
      setSections(sectionsResponse.sections);
      setProgress(progressResponse ? progressResponse.progress : null);
    } catch (error) {
      console.error("Failed to load course details:", error);
      toast.error("Failed to load course details");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await apiService.deleteCourse(courseId);
      toast.success("Course deleted successfully");
      setDeleteDialogCourse(null);
      await loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course");
    }
  };

  const generateQuiz = async (
    courseId: string,
    sectionId: string
  ): Promise<QuizQuestion[]> => {
    try {
      setIsLoadingQuiz(true);
      // Call API to generate quiz based on section content
      const response = await apiService.generateSectionQuiz(courseId, sectionId);
      return response.questions || [];
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
      return [];
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!learning.selectedCourse || !learning.selectedSection) return;

    try {
      setIsLoadingQuiz(true);
      const questions = await generateQuiz(
        learning.selectedCourse.id,
        learning.selectedSection.id
      );

      if (questions.length === 0) {
        toast.error("Failed to generate quiz questions");
        return;
      }

      setQuizState({
        questions,
        currentQuestionIndex: 0,
        selectedAnswers: {},
        showResult: false,
        score: 0,
        totalQuestions: 5,
      });

      setViewMode("quiz");
    } catch (error) {
      console.error("Failed to start quiz:", error);
      toast.error("Failed to start quiz");
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleQuizAnswerSelect = (questionId: string, answer: string) => {
    setQuizState((prev) => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [questionId]: answer,
      },
    }));
  };

  const handleQuizNext = () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  };

  const handleQuizPrevious = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const handleQuizSubmit = async () => {
    let score = 0;
    quizState.questions.forEach((question) => {
      if (quizState.selectedAnswers[question.id] === question.correctAnswer) {
        score++;
      }
    });

    setQuizState((prev) => ({
      ...prev,
      score,
      showResult: true,
    }));
  };

  const handleQuizResultAction = async () => {
    const passed = quizState.score >= 3;

    if (passed) {
      // Mark section as complete and move to next
      await handleCompleteSection(
        learning.selectedCourse!.id,
        learning.selectedSection!.id
      );
      
      // Wait for completion to process
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Move to next section automatically
      if (learning.currentSectionIndex < sections.length - 1) {
        const nextIndex = learning.currentSectionIndex + 1;
        const nextSection = sections[nextIndex];
        await handleSectionSelect(nextSection, nextIndex);
      } else {
        // If last section, go back to course details
        setViewMode("course-details");
      }
    } else {
      // Failed - go to previous section
      if (learning.currentSectionIndex > 0) {
        const prevIndex = learning.currentSectionIndex - 1;
        const prevSection = sections[prevIndex];
        await handleSectionSelect(prevSection, prevIndex);
        toast.error("Please review the previous section and try again.");
      } else {
        // If first section, just go back to section view
        setViewMode("section-learning");
        toast.error("Please review the section content and try again.");
      }
    }
  };

  const handleCompleteSection = async (courseId: string, sectionId: string) => {
    if (isUpdatingRef.current) {
      console.log("⚠️ Update already in progress, skipping...");
      return;
    }

    isUpdatingRef.current = true;
    setCompletingSection(sectionId);

    try {
      localCompletedSectionsRef.current.add(sectionId);
      console.log(
        "✅ Added to local completed:",
        Array.from(localCompletedSectionsRef.current)
      );

      await apiService.completeSection(courseId, sectionId);
      console.log("✅ Section marked complete on backend");

      toast.success("Section completed! 🎉");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      let courseResponse: any;
      let sectionsResponse: any;
      let progressResponse: any;

      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        const responses = await Promise.all([
          apiService.getCourse(courseId),
          apiService.getCourseSections(courseId),
          apiService.getCourseProgress(courseId),
        ]);

        courseResponse = responses[0];
        sectionsResponse = responses[1];
        progressResponse = responses[2];

        const backendCompletedRaw =
          progressResponse?.progress?.completed_sections || [];
        const backendCompletedArray = Array.isArray(backendCompletedRaw)
          ? backendCompletedRaw
          : [];
        const backendCompleted = new Set(backendCompletedArray);
        const backendHasSection = backendCompleted.has(sectionId);

        console.log(
          `🔄 Attempt ${attempts + 1}: Backend has ${
            backendCompleted.size
          } sections, includes current: ${backendHasSection}`
        );

        if (backendHasSection) {
          console.log("✅ Backend confirmed completion!");
          break;
        }

        attempts++;
        if (attempts < maxAttempts) {
          console.log("⏳ Waiting for backend to update...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const isCurrentUserEnrolled =
        progressResponse?.progress?.enrolled || false;
      const courseWithCorrectEnrollment = {
        ...courseResponse.course,
        is_enrolled: isCurrentUserEnrolled,
      };

      const backendCompletedSectionsRaw =
        progressResponse?.progress?.completed_sections || [];
      const backendCompletedSections = Array.isArray(backendCompletedSectionsRaw)
        ? backendCompletedSectionsRaw
        : [];
      const mergedCompleted = Array.from(
        new Set([
          ...backendCompletedSections,
          ...Array.from(localCompletedSectionsRef.current),
        ])
      );

      console.log("🔀 Merged completed sections:", {
        backend: backendCompletedSections.length,
        local: localCompletedSectionsRef.current.size,
        merged: mergedCompleted.length,
        sections: mergedCompleted,
      });

      localCompletedSectionsRef.current = new Set(mergedCompleted);

      const totalSections =
        progressResponse?.progress?.total_sections ||
        sectionsResponse.sections.length;
      const backendProgress = progressResponse?.progress?.progress ?? 0;

      const calculatedProgress =
        totalSections > 0 ? (mergedCompleted.length / totalSections) * 100 : 0;
      const finalProgress = Math.max(backendProgress, calculatedProgress);

      const updatedProgress = {
        ...progressResponse?.progress,
        progress: finalProgress,
        completed_sections: mergedCompleted,
        total_sections: totalSections,
      };

      console.log("📊 Final calculated progress:", {
        backendProgress,
        completedCount: mergedCompleted.length,
        totalSections,
        calculatedProgress,
        finalProgress,
      });

      setSelectedCourseDetails(courseWithCorrectEnrollment);
      setSections(sectionsResponse.sections);
      setProgress(updatedProgress);

      const sectionDetail = (await apiService.getSectionDetail(
        courseId,
        sectionId
      )) as any;
      const formattedSection = {
        ...sectionDetail,
        video_links: sectionDetail.videolinks || sectionDetail.video_links,
        key_points: sectionDetail.keypoints || sectionDetail.key_points,
        sub_topics: sectionDetail.subtopics || sectionDetail.sub_topics,
        is_completed: true,
      };

      setLearning((prev) => ({
        ...prev,
        selectedSection: formattedSection as any,
      }));

      await loadCourses();
    } catch (error) {
      console.error("Failed to complete section:", error);
      toast.error("Failed to save progress. Please try again.");
      localCompletedSectionsRef.current.delete(sectionId);
    } finally {
      setCompletingSection(null);
      isUpdatingRef.current = false;
    }
  };

  const handleCourseSelect = async (course: Course) => {
    setLearning((prev) => ({ ...prev, selectedCourse: course }));
    setViewMode("course-details");
    await loadCourseDetails(course.id);
  };

  const handleSectionSelect = async (
    section: CourseSection,
    index: number
  ) => {
    if (isUpdatingRef.current) {
      console.log("⚠️ Update in progress, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    try {
      if (learning.selectedCourse) {
        const progressResponse = await apiService
          .getCourseProgress(learning.selectedCourse.id)
          .catch(() => null);

        if (progressResponse) {
          const backendCompletedSectionsRaw =
            progressResponse?.progress?.completed_sections || [];
          const backendCompletedSections = Array.isArray(
            backendCompletedSectionsRaw
          )
            ? backendCompletedSectionsRaw
            : [];

          const mergedCompleted = Array.from(
            new Set([
              ...backendCompletedSections,
              ...Array.from(localCompletedSectionsRef.current),
            ])
          );

          const totalSections =
            progressResponse?.progress?.total_sections || sections.length;
          const backendProgress = progressResponse?.progress?.progress ?? 0;
          const calculatedProgress =
            totalSections > 0
              ? (mergedCompleted.length / totalSections) * 100
              : 0;
          const finalProgress = Math.max(backendProgress, calculatedProgress);

          const updatedProgress = {
            ...progressResponse?.progress,
            progress: finalProgress,
            completed_sections: mergedCompleted,
            total_sections: totalSections,
          };

          console.log("🔄 Progress refreshed on section select:", {
            backend: backendCompletedSections.length,
            local: localCompletedSectionsRef.current.size,
            merged: mergedCompleted.length,
            progress: finalProgress,
          });

          setProgress(updatedProgress);
        }

        const sectionDetail = (await apiService.getSectionDetail(
          learning.selectedCourse.id,
          section.id
        )) as any;
        const formattedSection = {
          ...sectionDetail,
          video_links: sectionDetail.videolinks || sectionDetail.video_links,
          key_points: sectionDetail.keypoints || sectionDetail.key_points,
          sub_topics: sectionDetail.subtopics || sectionDetail.sub_topics,
        };
        setLearning((prev) => ({
          ...prev,
          selectedSection: formattedSection as any,
          currentSectionIndex: index,
        }));
        setViewMode("section-learning");
        setActiveVideo(null);
      }
    } catch (error) {
      console.error("Failed to load section details:", error);
      toast.error("Failed to load section details");
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      setIsEnrolling(true);
      await apiService.enrollInCourse(courseId);
      toast.success("Successfully enrolled in course!");

      await loadCourseDetails(courseId);
      await loadCourses();
    } catch (error: any) {
      console.error("Failed to enroll in course:", error);
      const errorMessage = error.message || error.error || "";
      if (errorMessage.includes("Already enrolled")) {
        toast.info("You are already enrolled in this course");
        await loadCourseDetails(courseId);
        await loadCourses();
      } else {
        toast.error("Failed to enroll in course");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleNextSection = async () => {
    const completedSectionsListRaw = progress?.completed_sections ?? [];
    const completedSectionsList = Array.isArray(completedSectionsListRaw)
      ? completedSectionsListRaw
      : [];
    const currentSection = learning.selectedSection;
    const isCurrentCompleted =
      currentSection?.is_completed ||
      completedSectionsList.includes(currentSection?.id) ||
      localCompletedSectionsRef.current.has(currentSection?.id || "");

    console.log("🔍 Next section check:", {
      currentSectionId: currentSection?.id,
      isCompleted: isCurrentCompleted,
      completedList: completedSectionsList,
      localCompleted: Array.from(localCompletedSectionsRef.current),
    });

    if (!isCurrentCompleted) {
      toast.error(
        "Please mark the current section as complete before moving on.",
        { duration: 3000 }
      );
      return;
    }

    if (learning.currentSectionIndex < sections.length - 1) {
      const nextIndex = learning.currentSectionIndex + 1;
      const nextSection = sections[nextIndex];

      if (isUpdatingRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await handleSectionSelect(nextSection, nextIndex);
    }
  };

  const handlePreviousSection = async () => {
    if (learning.currentSectionIndex > 0) {
      const prevIndex = learning.currentSectionIndex - 1;
      const prevSection = sections[prevIndex];

      if (isUpdatingRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await handleSectionSelect(prevSection, prevIndex);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLevelColor = (level?: string) => {
    if (!level) return "bg-gray-100 text-gray-800 border-gray-200";
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "advanced":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="text-white size-8" />
          </div>
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  // Quiz View
  if (viewMode === "quiz") {
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const isLastQuestion =
      quizState.currentQuestionIndex === quizState.questions.length - 1;
    const hasAnsweredCurrent = !!quizState.selectedAnswers[currentQuestion?.id];
    const allQuestionsAnswered =
      Object.keys(quizState.selectedAnswers).length === quizState.questions.length;

    if (isLoadingQuiz) {
      return (
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="size-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Award className="text-white size-8" />
            </div>
            <p className="text-muted-foreground">Generating quiz...</p>
          </div>
        </div>
      );
    }

    if (quizState.showResult) {
      const passed = quizState.score >= 3;
      return (
        <div className="h-full flex flex-col bg-background items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8 text-center">
              <div
                className={`size-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  passed
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {passed ? (
                  <Trophy className="size-12" />
                ) : (
                  <XCircle className="size-12" />
                )}
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {passed ? "Congratulations! 🎉" : "Keep Learning! 📚"}
              </h2>
              <p className="text-xl text-muted-foreground mb-6">
                You scored {quizState.score} out of {quizState.totalQuestions}
              </p>
              <Progress
                value={(quizState.score / quizState.totalQuestions) * 100}
                className="h-4 mb-8"
              />
              <div className="space-y-4">
                {passed ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800">
                      Great job! You've passed the quiz and completed this
                      section. Moving to the next section...
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800">
                      You need at least 3 correct answers to pass. Reviewing
                      previous section...
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleQuizResultAction}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {passed ? "Continue to Next Section" : "Review Previous Section"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b border-border p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Section Quiz
                </h1>
                <p className="text-muted-foreground">
                  Complete this quiz to finish the section
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {quizState.currentQuestionIndex + 1} / {quizState.questions.length}
              </Badge>
            </div>
            <Progress
              value={
                ((quizState.currentQuestionIndex + 1) /
                  quizState.questions.length) *
                100
              }
              className="h-2"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="max-w-3xl mx-auto p-6">
            {currentQuestion && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {currentQuestion.question}
                  </CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {currentQuestion.type === "mcq"
                      ? "Multiple Choice"
                      : "True/False"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        quizState.selectedAnswers[currentQuestion.id] === option
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() =>
                        handleQuizAnswerSelect(currentQuestion.id, option)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-5 rounded-full border-2 flex items-center justify-center ${
                            quizState.selectedAnswers[currentQuestion.id] ===
                            option
                              ? "border-primary bg-primary"
                              : "border-border"
                          }`}
                        >
                          {quizState.selectedAnswers[currentQuestion.id] ===
                            option && (
                            <div className="size-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-foreground">{option}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4 bg-background">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleQuizPrevious}
              disabled={quizState.currentQuestionIndex === 0}
            >
              <ArrowLeft className="size-4 mr-2" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              {Object.keys(quizState.selectedAnswers).length} /{" "}
              {quizState.questions.length} answered
            </div>
            {!isLastQuestion ? (
              <Button
                onClick={handleQuizNext}
                disabled={!hasAnsweredCurrent}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                Next
                <ArrowRight className="size-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleQuizSubmit}
                disabled={!allQuestionsAnswered}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                Submit Quiz
                <Award className="size-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Courses List View
  if (viewMode === "courses") {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b border-border p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <PlayCircle className="text-white size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Learning Platform
                </h1>
                <p className="text-muted-foreground">
                  Learn with AI-generated courses
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4" />
                <span>{courses.length} courses available</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span>
                  {courses.filter((c) => c.is_enrolled).length} enrolled
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="size-4" />
                <span>
                  {courses.reduce(
                    (sum, c) => sum + (c.completed_sections || 0),
                    0
                  )}{" "}
                  sections completed
                </span>
              </div>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const progressPercentage = course.progress_percentage ?? 0;
                const completedSections = course.completed_sections ?? 0;
                const totalSections =
                  course.total_sections ?? course.sections_count ?? 0;
                return (
                  <Card
                    key={course.id}
                    className="group transition-all hover:shadow-lg border-border hover:border-primary/20"
                  >
                    <CardHeader
                      className="pb-3 cursor-pointer"
                      onClick={() => handleCourseSelect(course)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          className={`text-xs px-2 py-1 ${getLevelColor(
                            course.level || "beginner"
                          )}`}
                        >
                          {course.level || "Beginner"}
                        </Badge>
                        {course.is_enrolled && (
                          <Badge variant="outline" className="text-xs">
                            Enrolled
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight">
                        {course.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogCourse(course);
                          }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete Course
                        </Button>
                        {course.is_enrolled && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Progress
                              </span>
                              <span className="font-medium">
                                {Math.round(progressPercentage)}%
                              </span>
                            </div>
                            <Progress
                              value={progressPercentage}
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              {completedSections} of {totalSections} sections
                              completed
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="size-3" />
                            <span>{totalSections} sections</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>
                              {course.updated_at
                                ? formatDate(course.updated_at)
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {courses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="size-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No courses available
                </h3>
                <p className="text-muted-foreground">
                  Generate some courses first to start learning!
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        {deleteDialogCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDeleteDialogCourse(null)}
            />
            <div className="relative bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6 z-10">
              <h2 className="text-lg font-semibold mb-2">Are you sure?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                This action cannot be undone. This will permanently delete the
                course "{deleteDialogCourse.title}" and all of its data.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogCourse(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deleteDialogCourse)
                      handleDeleteCourse(deleteDialogCourse.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Course Details View
  if (viewMode === "course-details" && selectedCourseDetails) {
    const isEnrolled = selectedCourseDetails.is_enrolled;
    const courseProgress = progress?.progress ?? 0;
    const completedSectionsListRaw = progress?.completed_sections ?? [];
    const completedSectionsList = Array.isArray(completedSectionsListRaw)
      ? completedSectionsListRaw
      : [];
    const completedCount = completedSectionsList.length;
    const totalSections = progress?.total_sections ?? sections.length;

    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b border-border p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode("courses");
                  setSelectedCourseDetails(null);
                  setProgress(null);
                }}
                className="shrink-0"
              >
                <ArrowLeft className="size-4 mr-2" />
                Back to Courses
              </Button>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className={`${getLevelColor(
                      selectedCourseDetails.level
                    )}`}
                  >
                    {selectedCourseDetails.level}
                  </Badge>
                  {isEnrolled && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle className="size-3 mr-1" />
                      Enrolled
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  {selectedCourseDetails.title}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {selectedCourseDetails.description}
                </p>
                {isEnrolled && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Course Progress
                      </span>
                      <span className="font-medium">
                        {Math.round(courseProgress)}%
                      </span>
                    </div>
                    <Progress value={courseProgress} className="h-3" />
                    <div className="text-sm text-muted-foreground">
                      {completedCount} of {totalSections} sections completed
                    </div>
                  </div>
                )}
              </div>
              {!isEnrolled && (
                <Button
                  onClick={() => handleEnrollCourse(selectedCourseDetails.id)}
                  disabled={isEnrolling}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Now"}
                </Button>
              )}
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Course Content</h2>
            <div className="space-y-3">
              {sections.map((section, index) => {
                const isCompleted =
                  completedSectionsList.includes(section.id) ||
                  localCompletedSectionsRef.current.has(section.id);
                const isPreviousCompleted =
                  index === 0 ||
                  completedSectionsList.includes(sections[index - 1]?.id) ||
                  localCompletedSectionsRef.current.has(
                    sections[index - 1]?.id
                  );
                const isAccessible = isEnrolled && isPreviousCompleted;
                return (
                  <Card
                    key={section.id}
                    className={`transition-all ${
                      isAccessible
                        ? "cursor-pointer hover:shadow-md hover:border-primary/20"
                        : "opacity-60"
                    } ${
                      isCompleted ? "bg-green-50 border-green-200" : ""
                    }`}
                    onClick={() =>
                      isAccessible && handleSectionSelect(section, index)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : isAccessible
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="size-4" />
                            ) : !isAccessible ? (
                              <Lock className="size-4" />
                            ) : (
                              <span className="text-sm font-medium">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground">
                              {section.title}
                            </h3>
                            {isCompleted && section.completed_at && (
                              <p className="text-xs text-green-600 mt-1">
                                Completed on {formatDate(section.completed_at)}
                              </p>
                            )}
                            {!isEnrolled && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Enroll to unlock
                              </p>
                            )}
                            {isEnrolled && !isAccessible && index > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Complete previous section to unlock
                              </p>
                            )}
                          </div>
                        </div>
                        {isAccessible && (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {sections.length === 0 && (
              <div className="text-center py-12">
                <Target className="size-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No sections available
                </h3>
                <p className="text-muted-foreground">
                  Course content is being prepared...
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Section Learning View
  if (
    viewMode === "section-learning" &&
    learning.selectedSection &&
    learning.selectedCourse
  ) {
    const completedSectionsListRaw = progress?.completed_sections ?? [];
    const completedSectionsList = Array.isArray(completedSectionsListRaw)
      ? completedSectionsListRaw
      : [];
    const isCompleted =
      learning.selectedSection.is_completed ||
      completedSectionsList.includes(learning.selectedSection.id) ||
      localCompletedSectionsRef.current.has(learning.selectedSection.id);
    const hasNext = learning.currentSectionIndex < sections.length - 1;
    const hasPrevious = learning.currentSectionIndex > 0;
    const courseProgress = progress?.progress ?? 0;

    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b border-border p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("course-details")}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Back to Course
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="font-semibold text-foreground">
                    {learning.selectedSection.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Section {learning.currentSectionIndex + 1} of{" "}
                    {sections.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {progress && (
                  <div className="text-sm text-muted-foreground mr-4">
                    Progress: {Math.round(courseProgress)}%
                  </div>
                )}
                {!isCompleted && (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={isLoadingQuiz || isUpdatingRef.current}
                    variant="outline"
                    size="sm"
                  >
                    {isLoadingQuiz ? "Loading Quiz..." : "Mark Complete"}
                  </Button>
                )}
                {isCompleted && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <CheckCircle className="size-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto p-6 space-y-10">
              {learning.selectedSection.video_links &&
                learning.selectedSection.video_links.length > 0 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Video Lessons
                    </h2>
                    <div className="space-y-6">
                      {learning.selectedSection.video_links.map(
                        (video, index) => {
                          let videoId = null;
                          if (video.link.includes("youtube.com/embed/")) {
                            videoId = video.link
                              .split("youtube.com/embed/")[1]
                              .split("?")[0];
                          } else if (
                            video.link.includes("youtube.com/watch?v=")
                          ) {
                            videoId = video.link.split("v=")[1]?.split("&")[0];
                          } else if (video.link.includes("youtu.be/")) {
                            videoId = video.link
                              .split("youtu.be/")[1]
                              .split("?")[0];
                          }
                          if (!videoId) return null;
                          const videoSrc = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&color=white&origin=${
                            window.location.origin
                          }${activeVideo === videoId ? "&autoplay=1" : ""}`;
                          return (
                            <Card key={`video-${index}`}>
                              <CardHeader>
                                <CardTitle>{video.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div
                                  className="rounded-lg overflow-hidden bg-black/90 relative group transition-all"
                                  onClick={() =>
                                    setActiveVideo(
                                      activeVideo === videoId ? null : videoId
                                    )
                                  }
                                >
                                  <div className="w-full h-[500px] min-h-[500px]">
                                    <iframe
                                      src={videoSrc}
                                      title={video.title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="w-full h-full"
                                      style={{
                                        pointerEvents:
                                          activeVideo === videoId
                                            ? "auto"
                                            : "none",
                                      }}
                                    />
                                  </div>
                                  {activeVideo !== videoId && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 group-hover:from-black/70 group-hover:to-black/30 transition-all flex items-center justify-center cursor-pointer">
                                      <PlayCircle className="size-16 text-white/90 group-hover:scale-110 group-hover:text-white transition-all" />
                                    </div>
                                  )}
                                </div>
                                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-4" />
                                    <span>{video.duration}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {learning.selectedSection.introduction && (
                  <>
                    <h2>Introduction</h2>
                    <p>{learning.selectedSection.introduction}</p>
                  </>
                )}
                {learning.selectedSection.key_points &&
                  learning.selectedSection.key_points.length > 0 && (
                    <>
                      <h2>Key Points</h2>
                      <ul>
                        {learning.selectedSection.key_points.map(
                          (point, index) => (
                            <li key={index}>{point}</li>
                          )
                        )}
                      </ul>
                    </>
                  )}
                {learning.selectedSection.content && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: learning.selectedSection.content
                        .replace(/\n/g, "<br />")
                        .replace(
                          /``````([\s\S]*?)``````/g,
                          '<pre class="not-prose bg-muted p-4 rounded-lg overflow-x-auto">ode classss="text-sm">$1</code></pre>'
                        )
                        .replace(
                          /`([^`]+)`/g,
                          'ode class="bg-muted px-1 py-0.5 rounded text-smsm">$1</code>'
                        ),
                    }}
                  />
                )}
              </div>
              {learning.selectedSection.sub_topics &&
                learning.selectedSection.sub_topics.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Topics
                    </h2>
                    {learning.selectedSection.sub_topics.map((topic, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">
                            {topic.subtitle}
                          </h3>
                          <p className="text-muted-foreground">
                            {topic.subexplanation}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              {learning.selectedSection.examples &&
                learning.selectedSection.examples.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Examples
                    </h2>
                    {learning.selectedSection.examples.map((example, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="p-4">
                          <pre className="text-sm text-foreground overflow-x-auto whitespace-pre-wrap">
                            <code>{example}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              {learning.selectedSection.exercises &&
                learning.selectedSection.exercises.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold tracking-tight mb-4">
                      Practice Exercises
                    </h2>
                    {learning.selectedSection.exercises.map(
                      (exercise, index) => (
                        <Card
                          key={index}
                          className="border-l-4 border-l-primary"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="size-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <p className="text-foreground">{exercise}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
            </div>
          </ScrollArea>
        </div>
        <div className="border-t border-border p-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousSection}
              disabled={!hasPrevious || isUpdatingRef.current}
            >
              <ArrowLeft className="size-4 mr-2" />
              Previous Section
            </Button>
            <div className="text-sm text-muted-foreground">
              {learning.currentSectionIndex + 1} / {sections.length}
            </div>
            <Button
              onClick={handleNextSection}
              disabled={!hasNext || isUpdatingRef.current}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              Next Section
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
