// Safe environment variable access that works in all environments
const getApiUrl = (): string => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Next.js environment variables
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Vite environment variables
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
      // @ts-ignore
      return import.meta.env.VITE_API_URL;
    }
    
    // Create React App environment variables
    if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
  }
  
  // Default fallback for local development
  return 'http://localhost:8000';
};


export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  
  ENDPOINTS: {
    // ========================
    // AUTHENTICATION (5 endpoints)
    // ========================
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    REQUEST_PASSWORD_RESET: '/api/auth/request-password-reset',
    RESET_PASSWORD: '/api/auth/reset-password',
    
    // ========================
    // CHAT (7 endpoints)
    // ========================
    CHAT: '/api/chat',
    CHAT_HISTORY: '/api/chat/history',
    CHATS: '/api/chat/chats',
    DELETE_CHAT: '/api/chat/chats',
    UPLOAD_FILE: '/api/chat/upload',
    CHAT_FILES: '/api/chat',
    DELETE_FILE: '/api/chat/files',
    
    // ========================
    // COURSES (14 endpoints) - UPDATED
    // ========================
    GENERATE_COMPLETE_COURSE: '/api/courses/generate-complete',
    COURSES: '/api/courses',
    COURSE_DETAIL: '/api/courses',
    COURSE_DELETE: '/api/courses',
    COURSE_ENROLL: '/api/courses',
    COURSE_PROGRESS: '/api/courses',
    COURSE_SECTIONS: '/api/courses',
    SECTION_DETAIL: '/api/courses',
    COMPLETE_SECTION: '/api/courses',
    CREATE_COURSE: '/api/courses/create',
    UPDATE_COURSE: '/api/courses',
    SEARCH_COURSES: '/api/courses/search',
    GENERATE_SECTION_QUIZ: '/api/courses',  // NEW
    SUBMIT_SECTION_QUIZ: '/api/courses',     // NEW
    
    // ========================
    // ASSESSMENTS (4 endpoints)
    // ========================
    ASSESSMENTS: '/api/assessments',
    ASSESSMENT_CREATE: '/api/assessments',
    ASSESSMENT_DETAIL: '/api/assessments',
    ASSESSMENT_EVALUATE: '/api/assessments',
    
    // ========================
    // TRANSLATION (6 endpoints)
    // ========================
    TRANSLATE_TEXT: '/api/translate/text',
    DETECT_LANGUAGE: '/api/translate/detect',
    TRANSLATE_CHAT: '/api/translate/chat',
    SUPPORTED_LANGUAGES: '/api/translate/languages',
    TRANSLATION_STATUS: '/api/translate/status',
    TRANSLATION_TEST: '/api/translate/test',
    
    // ========================
    // COMPANIONS (11 endpoints)
    // ========================
    COMPANIONS: '/api/companions',
    COMPANION_CREATE: '/api/companions',
    COMPANION_DETAIL: '/api/companions',
    COMPANION_DELETE: '/api/companions',
    START_SESSION: '/api/companions',
    STOP_SESSION: '/api/companions/sessions',
    SESSION_STATUS: '/api/companions/sessions',
    SAVE_TRANSCRIPT: '/api/companions/sessions',
    GET_TRANSCRIPT: '/api/companions/sessions',
    AVAILABLE_VOICES: '/api/companions/voices',
    AVAILABLE_SUBJECTS: '/api/companions/subjects',
    
    // ========================
    // GRADING (2 endpoints)
    // ========================
    GRADE_TEXT: '/api/grading/text',
    GRADE_CODE: '/api/grading/code',
    
    // ========================
    // ANALYSIS (2 endpoints)
    // ========================
    CHECK_PLAGIARISM: '/api/analysis/plagiarism',
    DETECT_AI: '/api/analysis/ai-detection',
    
    // ========================
    // SUBMISSIONS (6 endpoints)
    // ========================
    SUBMIT_ASSIGNMENT: '/api/submissions/submit',
    SUBMISSIONS: '/api/submissions',
    SUBMISSION_DETAIL: '/api/submissions',
    DELETE_SUBMISSION: '/api/submissions',
    GRADE_SUBMISSION: '/api/submissions',
    SUBMISSION_STATS: '/api/submissions/stats',
    
    // ========================
    // FILES (3 endpoints)
    // ========================
    UPLOAD_FILE_TO_CHAT: '/api/files/upload',
    GET_CHAT_FILES: '/api/files/chat',
    DELETE_CHAT_FILE: '/api/files',
    
    // ========================
    // SETTINGS (2 endpoints)
    // ========================
    SETTINGS: '/api/settings',
    UPDATE_SETTINGS: '/api/settings',
    
    // ========================
    // ANALYTICS (2 endpoints)
    // ========================
    ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
    USER_ANALYTICS: '/api/analytics/user',
    
    // ========================
    // SYSTEM (3 endpoints)
    // ========================
    HEALTH: '/api/health',
    WELCOME: '/api/welcome',
    ROOT: '/',
  }
};


// Helper function to build full URL
export const buildUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }
  
  return url;
};


// API endpoint builder helpers
export const API_ROUTES = {
  // Auth
  auth: {
    login: () => API_CONFIG.ENDPOINTS.LOGIN,
    register: () => API_CONFIG.ENDPOINTS.REGISTER,
    profile: (userId: string) => `${API_CONFIG.ENDPOINTS.PROFILE}?user_id=${userId}`,
    requestPasswordReset: () => API_CONFIG.ENDPOINTS.REQUEST_PASSWORD_RESET,
    resetPassword: () => API_CONFIG.ENDPOINTS.RESET_PASSWORD,
  },
  
  
  // Chat
  chat: {
    send: () => API_CONFIG.ENDPOINTS.CHAT,
    history: (userId: string) => `${API_CONFIG.ENDPOINTS.CHAT_HISTORY}/${userId}`,
    list: () => API_CONFIG.ENDPOINTS.CHATS,
    delete: (chatId: string) => `${API_CONFIG.ENDPOINTS.DELETE_CHAT}/${chatId}`,
    upload: () => API_CONFIG.ENDPOINTS.UPLOAD_FILE,
    files: (chatId: string) => `${API_CONFIG.ENDPOINTS.CHAT_FILES}/${chatId}/files`,
    deleteFile: (fileId: string) => `${API_CONFIG.ENDPOINTS.DELETE_FILE}/${fileId}`,
  },
  
  // Courses
  courses: {
    generateComplete: () => API_CONFIG.ENDPOINTS.GENERATE_COMPLETE_COURSE,
    list: (userId: string, page = 1, perPage = 20) => 
      `${API_CONFIG.ENDPOINTS.COURSES}?userid=${userId}&page=${page}&perpage=${perPage}`,
    detail: (courseId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.COURSE_DETAIL}/${courseId}?userid=${userId}`,
    delete: (courseId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.COURSE_DELETE}/${courseId}?userid=${userId}`,
    enroll: (courseId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.COURSE_ENROLL}/${courseId}/enroll?userid=${userId}`,
    progress: (courseId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.COURSE_PROGRESS}/${courseId}/progress?userid=${userId}`,
    sections: (courseId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.COURSE_SECTIONS}/${courseId}/sections?userid=${userId}`,
    sectionDetail: (courseId: string, sectionId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.SECTION_DETAIL}/${courseId}/sections/${sectionId}?userid=${userId}`,
    completeSection: (courseId: string, sectionId: string, userId: string, timeSpent = 0) => 
      `${API_CONFIG.ENDPOINTS.COMPLETE_SECTION}/${courseId}/sections/${sectionId}/complete?userid=${userId}&timespent=${timeSpent}`,
    create: (userId: string) => `${API_CONFIG.ENDPOINTS.CREATE_COURSE}?userid=${userId}`,
    update: (courseId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.UPDATE_COURSE}/${courseId}/update?userid=${userId}`,
    search: (query: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.SEARCH_COURSES}?query=${encodeURIComponent(query)}&userid=${userId}`,
    
    // ========================
    // NEW: Quiz endpoints
    // ========================
    generateQuiz: (courseId: string, sectionId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.GENERATE_SECTION_QUIZ}/${courseId}/sections/${sectionId}/quiz?userid=${userId}`,
    submitQuiz: (courseId: string, sectionId: string, userId: string) => 
      `${API_CONFIG.ENDPOINTS.SUBMIT_SECTION_QUIZ}/${courseId}/sections/${sectionId}/quiz/submit?userid=${userId}`,
  },
  
  // Assessments
  assessments: {
    list: () => API_CONFIG.ENDPOINTS.ASSESSMENTS,
    create: () => API_CONFIG.ENDPOINTS.ASSESSMENT_CREATE,
    detail: (assessmentId: string) => `${API_CONFIG.ENDPOINTS.ASSESSMENT_DETAIL}/${assessmentId}`,
    evaluate: (assessmentId: string) => `${API_CONFIG.ENDPOINTS.ASSESSMENT_EVALUATE}/${assessmentId}/evaluate`,
  },
  
  // Translation
  translation: {
    translateText: () => API_CONFIG.ENDPOINTS.TRANSLATE_TEXT,
    detectLanguage: () => API_CONFIG.ENDPOINTS.DETECT_LANGUAGE,
    chat: () => API_CONFIG.ENDPOINTS.TRANSLATE_CHAT,
    languages: () => API_CONFIG.ENDPOINTS.SUPPORTED_LANGUAGES,
    status: () => API_CONFIG.ENDPOINTS.TRANSLATION_STATUS,
    test: () => API_CONFIG.ENDPOINTS.TRANSLATION_TEST,
  },
  
  // Companions
  companions: {
    list: () => API_CONFIG.ENDPOINTS.COMPANIONS,
    create: () => API_CONFIG.ENDPOINTS.COMPANION_CREATE,
    detail: (companionId: string) => `${API_CONFIG.ENDPOINTS.COMPANION_DETAIL}/${companionId}`,
    delete: (companionId: string) => `${API_CONFIG.ENDPOINTS.COMPANION_DELETE}/${companionId}`,
    startSession: (companionId: string) => `${API_CONFIG.ENDPOINTS.START_SESSION}/${companionId}/start-session`,
    stopSession: (sessionId: string) => `${API_CONFIG.ENDPOINTS.STOP_SESSION}/${sessionId}/stop`,
    sessionStatus: (sessionId: string) => `${API_CONFIG.ENDPOINTS.SESSION_STATUS}/${sessionId}/status`,
    saveTranscript: (sessionId: string) => `${API_CONFIG.ENDPOINTS.SAVE_TRANSCRIPT}/${sessionId}/transcript`,
    getTranscript: (sessionId: string) => `${API_CONFIG.ENDPOINTS.GET_TRANSCRIPT}/${sessionId}/transcript`,
    voices: () => API_CONFIG.ENDPOINTS.AVAILABLE_VOICES,
    subjects: () => API_CONFIG.ENDPOINTS.AVAILABLE_SUBJECTS,
  },
  
  // Grading
  grading: {
    text: () => API_CONFIG.ENDPOINTS.GRADE_TEXT,
    code: () => API_CONFIG.ENDPOINTS.GRADE_CODE,
  },
  
  // Analysis
  analysis: {
    plagiarism: () => API_CONFIG.ENDPOINTS.CHECK_PLAGIARISM,
    aiDetection: () => API_CONFIG.ENDPOINTS.DETECT_AI,
  },
  
  // Submissions
  submissions: {
    submit: () => API_CONFIG.ENDPOINTS.SUBMIT_ASSIGNMENT,
    list: (userId?: string) => userId 
      ? `${API_CONFIG.ENDPOINTS.SUBMISSIONS}?user_id=${userId}` 
      : API_CONFIG.ENDPOINTS.SUBMISSIONS,
    detail: (submissionId: string) => `${API_CONFIG.ENDPOINTS.SUBMISSION_DETAIL}/${submissionId}`,
    delete: (submissionId: string) => `${API_CONFIG.ENDPOINTS.DELETE_SUBMISSION}/${submissionId}`,
    grade: (submissionId: string) => `${API_CONFIG.ENDPOINTS.GRADE_SUBMISSION}/${submissionId}/grade`,
    stats: (userId: string) => `${API_CONFIG.ENDPOINTS.SUBMISSION_STATS}/${userId}`,
  },
  
  // Files
  files: {
    upload: () => API_CONFIG.ENDPOINTS.UPLOAD_FILE_TO_CHAT,
    chatFiles: (chatId: string) => `${API_CONFIG.ENDPOINTS.GET_CHAT_FILES}/${chatId}`,
    delete: (fileId: string) => `${API_CONFIG.ENDPOINTS.DELETE_CHAT_FILE}/${fileId}`,
  },
  
  // Settings
  settings: {
    get: (userId: string) => `${API_CONFIG.ENDPOINTS.SETTINGS}?user_id=${userId}`,
    update: (userId: string) => `${API_CONFIG.ENDPOINTS.UPDATE_SETTINGS}?user_id=${userId}`,
  },
  
  // Analytics
  analytics: {
    dashboard: (userId?: string) => userId 
      ? `${API_CONFIG.ENDPOINTS.ANALYTICS_DASHBOARD}?user_id=${userId}` 
      : API_CONFIG.ENDPOINTS.ANALYTICS_DASHBOARD,
    user: (userId: string) => `${API_CONFIG.ENDPOINTS.USER_ANALYTICS}/${userId}`,
  },
  
  // System
  system: {
    health: () => API_CONFIG.ENDPOINTS.HEALTH,
    welcome: () => API_CONFIG.ENDPOINTS.WELCOME,
    root: () => API_CONFIG.ENDPOINTS.ROOT,
  },
};


// Export type for route helpers
export type ApiRoutes = typeof API_ROUTES;
