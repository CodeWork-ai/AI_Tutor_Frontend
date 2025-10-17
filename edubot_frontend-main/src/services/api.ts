import { API_CONFIG } from '../config/api';

// ========================
// ASSESSMENT INTERFACES
// ========================

export interface AssessmentCreate {
  title?: string;
  subject?: string;
  topic: string;
  type: 'mcq' | 'mixed';
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AssessmentQuestion {
  type: 'mcq' | 'truefalse' | 'fib' | 'short';
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  topic: string;
  type: string;
  difficulty: string;
  questions: AssessmentQuestion[];
  created_at: string;
}

export interface AssessmentEvaluation {
  score: number;
  total: number;
  results: Array<{
    index: number;
    prompt: string;
    user_answer: string;
    correct_answer: string;
    explanation: string;
    is_correct: boolean;
  }>;
  note?: string;
}

// ========================
// QUIZ INTERFACES
// ========================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'mcq' | 'truefalse';
}

export interface QuizGenerationResponse {
  success: boolean;
  questions: QuizQuestion[];
  section_id: string;
  course_id: string;
  total_questions: number;
}

// NEW: Quiz submission interface
export interface QuizSubmissionResponse {
  score: number;
  totalQuestions: number;
  passed: boolean;
  percentage: number;
  results: Array<{
    question_id: string;
    question: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
  }>;
}

// ========================
// TRANSLATION INTERFACES
// ========================

export interface TranslateTextRequest {
  text: string;
  source_lang?: string;
  target_lang?: string;
}

export interface TranslateTextResponse {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  pronunciation?: string;
}

export interface DetectLanguageResponse {
  detected_language: string;
  language_name: string;
  confidence: string;
}

export interface ChatTranslateResponse {
  user_message: string;
  detected_language: string;
  detected_language_name: string;
  ai_response: string;
  conversation_flow: string;
}

export interface SupportedLanguages {
  languages: Record<string, string>;
}

// ========================
// COMPANION INTERFACES
// ========================

export interface CompanionCreate {
  name: string;
  subject: string;
  topic: string;
  voice?: string;
  style?: string;
  duration?: number;
}

export interface Companion {
  id: string;
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
}

export interface SessionStartResponse {
  session_id: string;
  public_key: string;
  assistant_id: string;
  status?: string;
  expires_at?: number;
}

export interface SessionTranscript {
  session_id: string;
  transcript: any[];
  duration: number;
  status: string;
}

export interface VoicesResponse {
  voices: Record<string, Record<string, string>>;
  providers?: string[];
  default_voice?: string;
  default_style?: string;
}

export interface SubjectsResponse {
  subjects: string[];
}

// ========================
// USER INTERFACES
// ========================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  is_verified?: boolean;
  created_at?: string;
  name?: string;
}

export interface UserCreate {
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  confirmpassword: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  resettoken: string;
  newpassword: string;
  confirmpassword: string;
}

// ========================
// CHAT INTERFACES
// ========================

export interface ChatMessage {
  message?: string;
  content?: string;
  level?: string;
  chat_id?: string;
  user_id?: string;
  role?: 'user' | 'assistant';
  timestamp?: string;
  follow_up_suggestions?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  chat_id: string;
  is_edited?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  level: string;
  category?: string;
  is_archived?: boolean;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ChatFile {
  id: string;
  filename: string;
  size: number;
  uploaded_at: string;
}

export interface ChatResponse {
  reply: {
    content: string;
    chat_id: string;
    follow_up_suggestions: string[];
  };
}

export interface ChatHistoryResponse {
  history: Message[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ChatsResponse {
  chats: Chat[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ChatFilesResponse {
  files: ChatFile[];
}

// ========================
// COURSE INTERFACES
// ========================

export interface CourseOutlineResponse {
  course_id: string;
  table_of_contents: string[];
  description?: string;
}

export interface CourseSectionContent {
  title: string;
  content: string;
  examples: string[];
  exercises: string[];
  key_points?: string[];
}

export interface CourseSectionResponse {
  section_content: CourseSectionContent;
}

export interface CourseCompleteResponse {
  message: string;
  course_id: string;
  pdf_url?: string;
  course_content?: {
    title: string;
    sections: CourseSectionContent[];
  };
}

export interface Course {
  id: string;
  title: string;
  topic: string;
  description?: string;
  level?: string;
  category?: string;
  sections_count: number;
  created_at: string;
  is_enrolled: boolean;
  progress: number;
  completed_sections?: number;
  total_sections?: number;
  progress_percentage?: number;
  sections?: CourseSection[];
  updated_at?: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  introduction?: string;
  topics?: string[];
  key_points?: string[];
  sub_topics?: Array<{
    subtitle: string;
    subexplanation: string;
  }>;
  examples?: string[];
  exercises?: string[];
  video_links?: Array<{
    topic: string;
    title: string;
    link: string;
    duration: string;
  }>;
  order_index: number;
  created_at?: string;
  is_completed?: boolean;
  completed_at?: string;
  time_spent?: number;
}

export interface CourseCreate {
  title: string;
  topic: string;
  description?: string;
}

export interface CourseProgress {
  enrolled: boolean;
  progress: number;
  progress_percentage?: number;
  completed_sections: string[] | number;
  total_sections: number;
  last_accessed?: string;
}

export interface CoursesResponse {
  success: boolean;
  courses: Course[];
  total: number;
  page: number;
  per_page: number;
}

export interface CourseResponse {
  success: boolean;
  course: Course;
}

export interface CourseSectionsResponse {
  sections: CourseSection[];
}

export interface SectionDetailResponse {
  section?: CourseSection;
  video_links?: Array<{
    topic: string;
    title: string;
    link: string;
    duration: string;
  }>;
  [key: string]: any;
}

export interface EnrollResponse {
  message: string;
  enrollment_id: string;
}

export interface CompleteResponse {
  message: string;
  course_progress: number;
}

// ========================
// SETTINGS INTERFACES
// ========================

export interface UserSettings {
  education_level: string;
  preferred_language: string;
  theme: string;
  notification_preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
  };
}

export interface SettingsResponse {
  success: boolean;
  settings: UserSettings;
}

// ========================
// GRADING INTERFACES
// ========================

export interface TextGradingRequest {
  question: string;
  answer: string;
  assignment_type?: string;
  total_score?: number;
  rubric?: string;
}

export interface CodeGradingRequest {
  problem_description: string;
  student_code: string;
  rubric?: string;
}

export interface GradingResponse {
  success: boolean;
  grading: {
    score: number;
    feedback: string;
    keypoints?: string[];
    areasforimprovement?: string[];
  };
}

export interface CodeGradingResponse extends GradingResponse {}

// ========================
// SUBMISSION INTERFACES
// ========================

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string;
  submission_type: string;
  grade?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
  graded_at?: string;
  key_points?: string[];
  areas_for_improvement?: string[];
}

export interface SubmissionAnalysisResponse {
  submission_id: string;
  student_id: string;
  message: string;
}

export interface SubmissionsResponse {
  submissions: Submission[];
}

export interface SubmissionDetailResponse {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string;
  submission_type: string;
  grade?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
  graded_at?: string;
  key_points?: string[];
  areas_for_improvement?: string[];
}

// ========================
// ANALYTICS INTERFACES
// ========================

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Summary {
  total_chats: number;
  courses_created: number;
  courses_enrolled: number;
  sections_completed: number;
  total_submissions: number;
  graded_submissions: number;
  pending_submissions: number;
  learning_streak_days: number;
  total_time_spent_minutes: number;
}

export interface PerformanceMetrics {
  average_grade: number;
  completion_rate: number;
  submission_completion_rate: number;
}

export interface CourseCreated {
  id: string;
  title: string;
  description: string;
  created_at: string;
  enrollment_count: number;
}

export interface CourseEnrolled {
  id: string;
  title: string;
  description: string | null;
  enrolled_at: string;
  progress_percentage: number;
  total_sections: number;
  completed_sections: number;
  submissions_count: number;
  average_grade: number | null;
}

export interface ActivityItem {
  activity_type: string;
  description: string;
  timestamp: string;
  related_id: string;
  section_title?: string;
  course_title?: string;
  grade?: string;
}

export interface Achievement {
  name: string;
  description: string;
}

export interface AnalyticsPayload {
  user_profile: UserProfile;
  summary: Summary;
  performance_metrics: PerformanceMetrics;
  courses_created: CourseCreated[];
  courses_enrolled: CourseEnrolled[];
  recent_activities: ActivityItem[];
  achievements: Achievement[];
}

export interface AnalyticsSummaryResponse {
  courses_created: number;
  courses_enrolled: number;
  sections_completed: number;
  total_submissions: number;
  average_grade: number;
}

export interface CourseProgressData {
  course_id: string;
  course_title: string;
  total_sections: number;
  completed_sections: number;
  progress_percentage: number;
}

export interface ProgressResponse {
  progress: CourseProgressData[];
}

// ========================
// ANALYSIS INTERFACES
// ========================

export interface PlagiarismResponse {
  plagiarism_score?: number;
  plagiarismscore?: number;
  flagged_content?: Array<{
    text: string;
    source: string;
    url: string;
    similarity_score?: number;
    similarityscore?: number;
  }>;
  flaggedcontent?: Array<{
    text: string;
    source: string;
    url: string;
    similarity_score?: number;
    similarityscore?: number;
  }>;
}

export interface AIDetectionResponse {
  ai_probability?: number;
  aiprobability?: number;
  analysis?: Array<{
    section: string;
    probability: number;
    reasoning: string;
  }>;
}

export interface HealthCheckResponse {
  status: string;
  service?: string;
  version?: string;
}

// ========================
// API SERVICE CLASS
// ========================

class ApiService {
  private baseUrl: string;
  private currentUser: User | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  private saveUserToStorage(user: User) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser = user;
  }

  private getHeaders(includeContentType = true): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  getUserId(): string {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    return this.currentUser.id;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
  }

  // ========================
  // AUTHENTICATION (5 endpoints)
  // ========================

  async register(userData: UserCreate): Promise<{ message: string; user_id: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const result = await response.json();
    
    const loginResponse = await this.login({
      email: userData.email,
      password: userData.password
    });
    
    return result;
  }

  async login(credentials: UserLogin): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    this.saveUserToStorage(result.user);
    return result;
  }

  async getProfile(): Promise<User> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/auth/profile?user_id=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  }

  async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to request password reset');
    }

    return response.json();
  }

  async resetPassword(resetData: PasswordReset): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset password');
    }

    return response.json();
  }

  // ========================
  // CHAT (7 endpoints)
  // ========================

  async sendMessage(messageData: ChatMessage): Promise<ChatResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const payload = {
      ...messageData,
      user_id: this.currentUser.id
    };

    const response = await fetch(`${this.baseUrl}/api/chat/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
  }

  async getChatHistory(userId: string): Promise<ChatHistoryResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/chat/history/${userId}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get chat history');
    }

    return response.json();
  }

  async getUserChats(): Promise<ChatsResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/chat/chats?user_id=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get chats');
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return { chats: data };
    }
    
    return data;
  }

  async deleteChat(chatId: string): Promise<{ success: boolean; message: string }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/chat/chats/${chatId}?user_id=${this.currentUser.id}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }

    return response.json();
  }

  async uploadFile(file: File, chatId?: string): Promise<{ success: boolean; file_id: string; filename: string }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (chatId) {
      formData.append('chat_id', chatId);
    }

    const response = await fetch(`${this.baseUrl}/api/chat/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  }

  async getChatFiles(chatId: string): Promise<ChatFilesResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/chat/${chatId}/files`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get chat files');
    }

    return response.json();
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${this.baseUrl}/api/chat/files/${fileId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    return response.json();
  }

  // ========================
  // COURSES (14 endpoints - UPDATED with quiz submission)
  // ========================

  async generateCompleteCourse(courseTitle: string, educationLevel = 'Middle/High School'): Promise<Blob> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('coursetitle', courseTitle);
    formData.append('userid', this.currentUser.id);
    formData.append('educationlevel', educationLevel);

    const response = await fetch(`${this.baseUrl}/api/courses/generate-complete`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate course');
    }

    return response.blob();
  }

  async getCourses(page = 1, perPage = 20): Promise<CoursesResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/?userid=${this.currentUser.id}&page=${page}&perpage=${perPage}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get courses');
    }

    return response.json();
  }

  async getCourse(courseId: string): Promise<CourseResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}?userid=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get course');
    }

    return response.json();
  }

  async createCourse(courseData: CourseCreate): Promise<{ id: string; title: string }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/create?userid=${this.currentUser.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create course');
    }

    return response.json();
  }

  async deleteCourse(courseId: string): Promise<{ success: boolean; message: string }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}?userid=${this.currentUser.id}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete course');
    }

    return response.json();
  }

  async enrollInCourse(courseId: string): Promise<EnrollResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/enroll?userid=${this.currentUser.id}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to enroll in course');
    }

    return response.json();
  }

  async getCourseSections(courseId: string): Promise<CourseSectionsResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/sections?userid=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get course sections');
    }

    return response.json();
  }

  async getSectionDetail(courseId: string, sectionId: string): Promise<SectionDetailResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/sections/${sectionId}?userid=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get section detail');
    }

    return response.json();
  }

  async completeSection(courseId: string, sectionId: string, timeSpent = 0): Promise<CompleteResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/sections/${sectionId}/complete?userid=${this.currentUser.id}&timespent=${timeSpent}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to complete section');
    }

    return response.json();
  }

  async getCourseProgress(courseId: string): Promise<{ progress: CourseProgress }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/progress?userid=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get course progress');
    }

    return response.json();
  }

  async updateCourse(courseId: string, courseData: CourseCreate): Promise<{ message: string }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/update?userid=${this.currentUser.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update course');
    }

    return response.json();
  }

  async searchCourses(query: string): Promise<{ courses: Course[] }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/search?query=${encodeURIComponent(query)}&userid=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to search courses');
    }

    return response.json();
  }

  /**
   * Generate quiz for a specific section
   * Returns 5 quiz questions based on section content
   */
  async generateSectionQuiz(courseId: string, sectionId: string): Promise<QuizGenerationResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/sections/${sectionId}/quiz?userid=${this.currentUser.id}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate quiz');
    }

    return response.json();
  }

  /**
   * Submit quiz answers for validation
   * @param courseId - The course ID
   * @param sectionId - The section ID
   * @param answers - Object with question_id as key and selected answer as value
   * @returns Quiz results with score and validation
   */
  async submitSectionQuiz(
    courseId: string,
    sectionId: string,
    answers: { [key: string]: string }
  ): Promise<QuizSubmissionResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/courses/${courseId}/sections/${sectionId}/quiz/submit?userid=${this.currentUser.id}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ answers }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit quiz');
    }

    return response.json();
  }

  // ========================
  // ASSESSMENTS (4 endpoints)
  // ========================

  async createAssessment(data: AssessmentCreate): Promise<Assessment> {
    const response = await fetch(`${this.baseUrl}/api/assessments/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create assessment');
    }

    return response.json();
  }

  async getAssessments(): Promise<Assessment[]> {
    const response = await fetch(`${this.baseUrl}/api/assessments/`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get assessments');
    }

    return response.json();
  }

  async getAssessment(assessmentId: string): Promise<Assessment> {
    const response = await fetch(`${this.baseUrl}/api/assessments/${assessmentId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get assessment');
    }

    return response.json();
  }

  async evaluateAssessment(
    assessmentId: string,
    answers: Record<string, string>
  ): Promise<AssessmentEvaluation> {
    const response = await fetch(`${this.baseUrl}/api/assessments/${assessmentId}/evaluate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to evaluate assessment');
    }

    return response.json();
  }

  // ========================
  // TRANSLATION (6 endpoints)
  // ========================

  async translateText(
    text: string,
    sourceLang = 'auto',
    targetLang = 'en'
  ): Promise<TranslateTextResponse> {
    const response = await fetch(`${this.baseUrl}/api/translate/text`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Translation failed');
    }

    return response.json();
  }

  async detectLanguage(text: string): Promise<DetectLanguageResponse> {
    const response = await fetch(`${this.baseUrl}/api/translate/detect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Language detection failed');
    }

    return response.json();
  }

  async chatWithTranslation(
    message: string,
    userLanguage = 'auto'
  ): Promise<ChatTranslateResponse> {
    const response = await fetch(`${this.baseUrl}/api/translate/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        message,
        user_language: userLanguage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Chat translation failed');
    }

    return response.json();
  }

  async getSupportedLanguages(): Promise<SupportedLanguages> {
    const response = await fetch(`${this.baseUrl}/api/translate/languages`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get supported languages');
    }

    return response.json();
  }

  async checkTranslationStatus(): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/translate/status`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check translation status');
    }

    return response.json();
  }

  async testOpenAIConnection(): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/translate/test`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to test OpenAI connection');
    }

    return response.json();
  }

  // ========================
  // COMPANIONS (11 endpoints)
  // ========================

  async createCompanion(data: CompanionCreate): Promise<Companion> {
    const response = await fetch(`${this.baseUrl}/api/companions/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create companion');
    }

    return response.json();
  }

  async getCompanions(): Promise<Companion[]> {
    const response = await fetch(`${this.baseUrl}/api/companions/`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get companions');
    }

    return response.json();
  }

  async getCompanion(companionId: string): Promise<Companion> {
    const response = await fetch(`${this.baseUrl}/api/companions/${companionId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get companion');
    }

    return response.json();
  }

  async deleteCompanion(companionId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/companions/${companionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete companion');
    }

    return response.json();
  }

  async startVoiceSession(companionId: string): Promise<SessionStartResponse> {
    const response = await fetch(`${this.baseUrl}/api/companions/${companionId}/start-session`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start voice session');
    }

    return response.json();
  }

  async stopVoiceSession(sessionId: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/companions/sessions/${sessionId}/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to stop voice session');
    }

    return response.json();
  }

  async getSessionStatus(sessionId: string): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/companions/sessions/${sessionId}/status`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get session status');
    }

    return response.json();
  }

  async saveSessionTranscript(
    sessionId: string,
    transcript: any[],
    duration: number
  ): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/companions/sessions/${sessionId}/transcript`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ transcript, duration }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save transcript');
    }

    return response.json();
  }

  async getSessionTranscript(sessionId: string): Promise<SessionTranscript> {
    const response = await fetch(`${this.baseUrl}/api/companions/sessions/${sessionId}/transcript`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get session transcript');
    }

    return response.json();
  }

  async getAvailableVoices(): Promise<VoicesResponse> {
    const response = await fetch(`${this.baseUrl}/api/companions/voices`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get available voices');
    }

    return response.json();
  }

  async getAvailableSubjects(): Promise<SubjectsResponse> {
    const response = await fetch(`${this.baseUrl}/api/companions/subjects`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get available subjects');
    }

    return response.json();
  }

  // ========================
  // GRADING (2 endpoints)
  // ========================

  async gradeText(request: TextGradingRequest): Promise<GradingResponse> {
    const response = await fetch(`${this.baseUrl}/api/grading/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to grade text');
    }

    return response.json();
  }

  async gradeCode(request: CodeGradingRequest): Promise<GradingResponse> {
    const response = await fetch(`${this.baseUrl}/api/grading/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to grade code');
    }

    return response.json();
  }

  // ========================
  // ANALYSIS (2 endpoints)
  // ========================

  async checkPlagiarism(text: string): Promise<PlagiarismResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/api/analysis/plagiarism`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        text,
        userid: this.currentUser.id
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check plagiarism');
    }

    return response.json();
  }

  async detectAI(text: string): Promise<AIDetectionResponse> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/api/analysis/ai-detection`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        text,
        userid: this.currentUser.id
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to detect AI content');
    }

    return response.json();
  }

  // ========================
  // SUBMISSIONS (6 endpoints)
  // ========================

  async submitAssignment(
    assignmentId: string,
    userId: string,
    content: string,
    submissionType: string
  ): Promise<Submission> {
    const response = await fetch(`${this.baseUrl}/api/submissions/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        assignment_id: assignmentId,
        user_id: userId,
        content,
        submission_type: submissionType
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit assignment');
    }

    return response.json();
  }

  async getSubmissions(userId?: string, assignmentId?: string, status?: string): Promise<Submission[]> {
    let url = `${this.baseUrl}/api/submissions/`;
    const params = new URLSearchParams();
    
    if (userId) params.append('user_id', userId);
    if (assignmentId) params.append('assignment_id', assignmentId);
    if (status) params.append('status', status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get submissions');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async getSubmission(submissionId: string): Promise<SubmissionDetailResponse> {
    const response = await fetch(`${this.baseUrl}/api/submissions/${submissionId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get submission');
    }

    return response.json();
  }

  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    keyPoints?: string[],
    areasForImprovement?: string[]
  ): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade,
        feedback,
        key_points: keyPoints,
        areas_for_improvement: areasForImprovement
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to grade submission');
    }

    return response.json();
  }

  async deleteSubmission(submissionId: string, userId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/submissions/${submissionId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete submission');
    }

    return response.json();
  }

  async getSubmissionStats(userId: string): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/submissions/stats/${userId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get submission stats');
    }

    return response.json();
  }

  // ========================
  // ANALYTICS (3 endpoints)
  // ========================

  async getUserAnalytics(): Promise<AnalyticsPayload> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${this.baseUrl}/api/analytics/user?user_id=${user.id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    
    return response.json();
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummaryResponse> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${this.baseUrl}/api/analytics/summary?user_id=${user.id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch summary');
    }
    
    return response.json();
  }

  async getCourseProgressAnalytics(): Promise<ProgressResponse> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const response = await fetch(`${this.baseUrl}/api/analytics/progress?user_id=${user.id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch progress');
    }
    
    return response.json();
  }

  // ========================
  // SETTINGS (2 endpoints)
  // ========================

  async getSettings(): Promise<{
    success: boolean;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      is_verified: boolean;
    };
    settings: UserSettings;
  }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/settings/?user_id=${this.currentUser.id}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to get settings');
    }

    return response.json();
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<{
    success: boolean;
    message: string;
    settings: UserSettings;
  }> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/api/settings/?user_id=${this.currentUser.id}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(settings),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update settings');
    }

    return response.json();
  }

  // ========================
  // SYSTEM (3 endpoints)
  // ========================

  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getWelcome(): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/api/welcome`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get welcome message');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
