export type Domain = 'health' | 'learning' | 'work' | 'finance' | 'personal';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  calorieGoal: number;
  waterGoalMl: number;
  theme: 'light' | 'dark' | 'system';
  zaloLinked: boolean;
  zaloUserId?: string;
  zaloDisplayName?: string;
}

// ========================
// 1. HEALTH MANAGEMENT
// ========================
export interface HealthRecord {
  id: string;
  userId: string;
  kind: 'weight' | 'water' | 'meal' | 'workout' | 'sleep' | 'mood' | 'medication';
  timestamp: string;
  data: {
    // Weight
    weightKg?: number;
    bmi?: number;
    // Water
    waterMl?: number;
    // Meal
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    foodName?: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    imageUrl?: string;
    // Workout
    workoutType?: string;
    durationMinutes?: number;
    caloriesBurned?: number;
    intensity?: 'low' | 'medium' | 'high';
    // Sleep
    sleepHours?: number;
    sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
    // Mood
    mood?: 'great' | 'good' | 'neutral' | 'stressed' | 'tired';
    note?: string;
    // Medication
    medicationName?: string;
    dosage?: string;
    time?: string;
    taken?: boolean;
  };
}

// ========================
// 2. LEARNING MANAGEMENT
// ========================
export interface CourseSubject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  color?: string;
  progressPercentage: number;
  targetScore?: number;
  examDate?: string;
}

export interface Flashcard {
  id: string;
  userId: string;
  subjectId: string;
  front: string;
  back: string;
  box: number; // Leitner spaced repetition (1-5)
  nextReviewDate: string;
  lastReviewDate?: string;
}

export interface StudyPlanItem {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  date: string;
  durationMinutes: number;
  completed: boolean;
  technique: 'pomodoro' | 'active_recall' | 'spaced_repetition' | 'normal';
}

// ========================
// 3. WORK MANAGEMENT
// ========================
export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  domain: Domain;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  dueTime?: string;
  estimateMinutes?: number;
  actualMinutes?: number;
  projectId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  progress: number;
  deadline?: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
}

// ========================
// 4. FINANCIAL MANAGEMENT
// ========================
export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'bank' | 'e_wallet' | 'savings';
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note?: string;
  receiptImageUrl?: string;
  receiptExtractedData?: {
    merchant?: string;
    date?: string;
    totalAmount?: number;
    items?: Array<{ name: string; price: number }>;
  };
}

export interface BudgetGoal {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  period: 'monthly' | 'weekly';
  alertThresholdPercent: number; // e.g. 80%
}

// ========================
// 5. AI PERSONALITY ENGINE
// ========================
export type AIPersonalityId =
  | 'standard'
  | 'friendly'
  | 'funny'
  | 'strict_coach'
  | 'mentor'
  | 'executive'
  | 'teacher'
  | 'financial_advisor'
  | 'wellness_companion'
  | 'creative'
  | 'custom';

export interface AIPersonality {
  id: AIPersonalityId;
  name: string;
  avatar: string;
  tone: string;
  description: string;
  systemPromptModifier: string;
  sliders?: {
    friendliness: number; // 1-10
    humor: number;       // 1-10
    strictness: number;  // 1-10
    proactivity: number; // 1-10
    verbosity: number;   // 1-10
  };
}

// ========================
// 6. AI MEMORY SYSTEM
// ========================
export type MemoryType =
  | 'short_term'
  | 'long_term'
  | 'semantic'
  | 'episodic'
  | 'preference'
  | 'goal';

export interface AIMemoryItem {
  id: string;
  userId: string;
  type: MemoryType;
  key: string;
  value: string;
  confidence: number;
  domain: Domain;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================
// 7. AI ACTION ENGINE (TOOL CALLING)
// ========================
export type ActionType =
  | 'create_task'
  | 'update_task'
  | 'complete_task'
  | 'log_water'
  | 'log_weight'
  | 'log_meal'
  | 'create_workout_plan'
  | 'add_transaction'
  | 'set_budget'
  | 'create_study_plan'
  | 'add_flashcard'
  | 'create_reminder';

export interface ActionPayload {
  action: ActionType;
  domain: Domain;
  description: string;
  data: Record<string, any>;
  requiresConfirmation?: boolean;
}

export interface ActionCardProps {
  id: string;
  payload: ActionPayload;
  status: 'pending' | 'confirmed' | 'cancelled' | 'executed' | 'undone';
  executedAt?: string;
}

// ========================
// 8. CHAT & MULTIMODAL
// ========================
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  timestamp?: string;
  domain?: Domain;
  source: 'app' | 'zalo';
  status?: 'sending' | 'sent' | 'error';
  // Multimodal attachments
  attachments?: Array<{
    type: 'image' | 'audio' | 'document';
    url?: string;
    name?: string;
    size?: number;
    mimeType?: string;
    extractedText?: string;
  }>;
  // Action cards proposed by AI
  actions?: ActionCardProps[];
  // Referenced memory
  referencedMemories?: string[];
}

// ========================
// 9. ZALO BOT INTEGRATION
// ========================
export interface ZaloConnectionState {
  isLinked: boolean;
  zaloUserId?: string;
  zaloUserName?: string;
  linkCode?: string;
  codeExpiresAt?: string;
  syncConversations: boolean;
  sendDailyBriefing: boolean;
  sendNightReview: boolean;
  sendAlerts: boolean;
  lastSyncAt?: string;
}

export interface ProactiveReport {
  id: string;
  userId: string;
  type: 'daily_briefing' | 'night_review' | 'weekly_summary';
  date: string;
  content: string;
  highlights: {
    healthSummary: string;
    learningProgress: string;
    workPriorities: string[];
    financialNotice: string;
  };
}

// ========================
// 10. FEEDBACK & SUPPORT CENTER
// ========================
export type FeedbackCategory =
  | 'bug_report'           // Báo lỗi
  | 'feature_request'      // Đề xuất tính năng
  | 'ui_feedback'          // Góp ý giao diện
  | 'ai_assistant'         // Góp ý trợ lý AI
  | 'google_calendar'      // Đồng bộ Google Calendar
  | 'email_integration'    // Tích hợp Gmail và Outlook
  | 'zalo_sync'            // Đồng bộ Zalo
  | 'performance'          // Hiệu suất ứng dụng
  | 'security_privacy'     // Bảo mật và quyền riêng tư
  | 'other';               // Ý kiến khác

export type FeedbackStatus =
  | 'received'             // Đã tiếp nhận
  | 'reviewing'            // Đang xem xét
  | 'in_progress'          // Đang xử lý
  | 'resolved'             // Đã giải quyết
  | 'planned'              // Đã đưa vào kế hoạch phát triển
  | 'need_info'            // Cần thêm thông tin
  | 'declined';            // Không thực hiện

export type FeedbackPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TechDiagnosticInfo {
  appVersion: string;
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  timestamp: string;
  module: string;
  currentPath: string;
  errorCode?: string;
}

export interface FeedbackItem {
  id: string;
  code: string; // e.g. FB-2026-8812
  userId: string;
  userName: string;
  userEmail?: string;
  isAnonymous: boolean;
  allowContact: boolean;
  rating: number; // 1 to 5
  title: string;
  content: string;
  category: FeedbackCategory;
  module: string;
  attachments?: string[]; // base64 images or URLs
  techInfo?: TechDiagnosticInfo;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  internalNotes?: string;
  mergedIntoId?: string;
  aiAnalysis?: {
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    suggestedCategory: string;
    suggestedPriority: FeedbackPriority;
    keyThemes: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  senderId: string;
  senderRole: 'admin' | 'user';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface FeatureRequestItem {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  module: string;
  submittedBy: string;
  votesCount: number;
  votedUserIds: string[];
  status: 'under_review' | 'planned' | 'in_progress' | 'completed';
  createdAt: string;
  targetRelease?: string;
}

export interface ProductChangelog {
  version: string;
  releaseDate: string;
  title: string;
  tag: 'Major' | 'Improvement' | 'Fix';
  highlights: string[];
}

export interface BetaBadge {
  id: string;
  key: 'early_supporter' | 'beta_tester' | 'bug_hunter' | 'idea_contributor' | 'community_builder';
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'feedback_reply' | 'feedback_status' | 'system' | 'badge';
  read: boolean;
  referenceId?: string;
  createdAt: string;
}

