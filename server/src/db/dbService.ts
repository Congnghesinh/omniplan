import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  UserProfile,
  AIPersonality,
  AIPersonalityId,
  AIMemoryItem,
  Domain,
  ActionType,
  ActionPayload,
  ActionCardProps,
  TaskItem,
  HealthRecord,
  Flashcard,
  StudyPlanItem,
  CourseSubject,
  ChatMessage,
  FeedbackItem,
  FeedbackReply,
  FeatureRequestItem,
  ProductChangelog,
  BetaBadge,
  AppNotification,
  FeedbackStatus,
  FeedbackPriority
} from '../../src/types/index.js';
import { PERSONALITY_PRESETS } from '../ai/personality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'omniplan_db.json');

export interface TransactionItem {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  wallet: string;
  date: string;
  note?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  period: 'weekly' | 'monthly';
}

export interface WalletItem {
  id: string;
  name: string;
  balance: number;
  type: 'cash' | 'bank' | 'e_wallet';
}

export interface ActionLogItem {
  id: string;
  userId: string;
  action: ActionType;
  domain: Domain;
  description: string;
  data: any;
  status: 'pending' | 'executed' | 'cancelled' | 'undone';
  createdAt: string;
  executedAt?: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  title: string;
  personalityId: AIPersonalityId;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  domain?: Domain;
}

export interface ZaloConnectionItem {
  userId: string;
  zaloUserId: string;
  zaloDisplayName: string;
  linkedAt: string;
  active: boolean;
  personalityId: AIPersonalityId;
  syncMode: 'all' | 'actions_only' | 'context_only';
}

export interface AppDatabaseSchema {
  users: Record<string, UserProfile>;
  personalities: Record<string, AIPersonality>;
  conversations: Record<string, ConversationSession>;
  messages: Record<string, ChatMessage[]>; // convId -> messages
  memories: Record<string, AIMemoryItem[]>; // userId -> memories
  actionLogs: ActionLogItem[];
  zaloConnections: Record<string, ZaloConnectionItem>; // zaloUserId -> connection
  healthRecords: Record<string, HealthRecord[]>; // userId -> health records
  tasks: Record<string, TaskItem[]>; // userId -> tasks
  transactions: Record<string, TransactionItem[]>; // userId -> transactions
  budgets: Record<string, BudgetItem[]>; // userId -> budgets
  wallets: Record<string, WalletItem[]>; // userId -> wallets
  flashcards: Record<string, Flashcard[]>; // userId -> flashcards
  studyPlans: Record<string, StudyPlanItem[]>; // userId -> study plans
  feedbacks: Record<string, FeedbackItem>; // id -> feedback
  feedbackReplies: Record<string, FeedbackReply[]>; // feedbackId -> replies
  featureRequests: FeatureRequestItem[];
  changelogs: ProductChangelog[];
  userBadges: Record<string, BetaBadge[]>; // userId -> badges
  notifications: Record<string, AppNotification[]>; // userId -> notifications
}

export class DBService {
  private static instance: DBService;
  private db: AppDatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  public static getInstance(): DBService {
    if (!DBService.instance) {
      DBService.instance = new DBService();
    }
    return DBService.instance;
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private getDefaultDatabase(): AppDatabaseSchema {
    const today = new Date().toISOString().split('T')[0];
    return {
      users: {
        default_user: {
          id: 'default_user',
          email: 'user@omniplan.ai',
          displayName: 'Phạm Tuấn',
          timezone: 'Asia/Ho_Chi_Minh',
          dateFormat: 'DD/MM/YYYY',
          currency: 'VND',
          calorieGoal: 2000,
          waterGoalMl: 2000,
          theme: 'light',
          zaloLinked: false
        }
      },
      personalities: { ...PERSONALITY_PRESETS },
      conversations: {
        conv_default: {
          id: 'conv_default',
          userId: 'default_user',
          title: 'Cuộc trò chuyện chính',
          personalityId: 'standard',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pinned: true
        }
      },
      messages: {
        conv_default: [
          {
            id: 'msg_init',
            role: 'assistant',
            content: 'Xin chào! Tôi là OmniPlan — Trợ lý AI Cuộc sống Toàn diện của bạn.\n\nTôi có thể hỗ trợ bạn theo dõi **Sức khỏe**, lập kế hoạch **Học tập**, sắp xếp **Công việc** và quản lý **Tài chính**, đồng thời đồng bộ tức thì với tài khoản **Zalo Bot**.\n\nHôm nay bạn muốn tôi giúp gì?',
            timestamp: new Date().toISOString(),
            source: 'app',
            domain: 'personal'
          }
        ]
      },
      memories: {
        default_user: [
          {
            id: 'mem_1',
            userId: 'default_user',
            type: 'goal',
            domain: 'health',
            key: 'Mục tiêu uống nước',
            value: '2000ml mỗi ngày',
            confidence: 1.0,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'mem_2',
            userId: 'default_user',
            type: 'preference',
            domain: 'work',
            key: 'Thời gian làm việc tập trung',
            value: 'Thích làm việc sâu buổi sáng từ 8h30 - 11h30',
            confidence: 0.95,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'mem_3',
            userId: 'default_user',
            type: 'goal',
            domain: 'finance',
            key: 'Hạn mức ăn uống',
            value: 'Tối đa 150,000 đ/ngày',
            confidence: 0.9,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      actionLogs: [],
      zaloConnections: {},
      healthRecords: {
        default_user: [
          {
            id: 'hr_1',
            userId: 'default_user',
            kind: 'water',
            timestamp: `${today}T08:30:00Z`,
            data: { waterMl: 350 }
          },
          {
            id: 'hr_2',
            userId: 'default_user',
            kind: 'water',
            timestamp: `${today}T10:15:00Z`,
            data: { waterMl: 400 }
          },
          {
            id: 'hr_3',
            userId: 'default_user',
            kind: 'weight',
            timestamp: `${today}T07:00:00Z`,
            data: { weightKg: 65, bmi: 21.5 }
          }
        ]
      },
      tasks: {
        default_user: [
          {
            id: 'task_1',
            userId: 'default_user',
            title: 'Hoàn thành báo cáo tuần dự án OmniPlan',
            domain: 'work',
            priority: 'high',
            status: 'todo',
            dueDate: today,
            dueTime: '17:00',
            estimateMinutes: 60,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'task_2',
            userId: 'default_user',
            title: 'Ôn tập 20 thẻ Flashcard từ vựng & thuật ngữ',
            domain: 'learning',
            priority: 'medium',
            status: 'todo',
            dueDate: today,
            dueTime: '20:30',
            estimateMinutes: 25,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      transactions: {
        default_user: [
          {
            id: 'tx_1',
            userId: 'default_user',
            type: 'expense',
            amount: 45000,
            category: 'Ăn uống',
            wallet: 'Tiền mặt',
            date: today,
            note: 'Ăn sáng phở bò',
            createdAt: `${today}T07:45:00Z`
          },
          {
            id: 'tx_2',
            userId: 'default_user',
            type: 'expense',
            amount: 40000,
            category: 'Đi lại',
            wallet: 'Ví điện tử',
            date: today,
            note: 'Cà phê & gửi xe',
            createdAt: `${today}T09:30:00Z`
          }
        ]
      },
      budgets: {
        default_user: [
          {
            id: 'bg_1',
            userId: 'default_user',
            category: 'Ăn uống',
            limitAmount: 3500000,
            spentAmount: 85000,
            period: 'monthly'
          },
          {
            id: 'bg_2',
            userId: 'default_user',
            category: 'Mua sắm',
            limitAmount: 1500000,
            spentAmount: 0,
            period: 'monthly'
          }
        ]
      },
      wallets: {
        default_user: [
          { id: 'w_1', name: 'Tiền mặt', balance: 1455000, type: 'cash' },
          { id: 'w_2', name: 'Ngân hàng', balance: 18500000, type: 'bank' },
          { id: 'w_3', name: 'Ví điện tử', balance: 460000, type: 'e_wallet' }
        ]
      },
      flashcards: {
        default_user: [
          {
            id: 'fc_1',
            userId: 'default_user',
            subjectId: 'sub_1',
            front: 'Phương pháp Active Recall là gì?',
            back: 'Là phương pháp chủ động gợi nhớ thông tin từ não bộ thay vì đọc lại tài liệu một cách thụ động.',
            box: 2,
            nextReviewDate: today
          },
          {
            id: 'fc_2',
            userId: 'default_user',
            subjectId: 'sub_1',
            front: 'Quy tắc Spaced Repetition (Lặp lại ngắt quãng)?',
            back: 'Ôn tập lại thông tin tại các khoảng thời gian tăng dần ngay trước thời điểm chuẩn bị quên.',
            box: 1,
            nextReviewDate: today
          }
        ]
      },
      studyPlans: {
        default_user: [
          {
            id: 'sp_1',
            userId: 'default_user',
            title: 'Luyện tập Active Recall thuật ngữ AI & Prompting',
            date: today,
            durationMinutes: 25,
            completed: false,
            technique: 'pomodoro'
          }
        ]
      },
      feedbacks: {
        fb_demo_1: {
          id: 'fb_demo_1',
          code: 'FB-2026-1042',
          userId: 'default_user',
          userName: 'Phạm Tuấn',
          userEmail: 'user@omniplan.ai',
          isAnonymous: false,
          allowContact: true,
          rating: 5,
          title: 'Đồng bộ Zalo Bot rất mượt mà và tiện lợi!',
          content: 'Mình vừa trải nghiệm nhắn tin thêm chi tiêu và nhắc uống nước qua Zalo Bot, dữ liệu lập tức xuất hiện trên Web App. Giao diện rái cá mầm xanh nhìn rất dễ thương và gần gũi.',
          category: 'zalo_sync',
          module: 'Zalo Bot',
          status: 'resolved',
          priority: 'medium',
          techInfo: {
            appVersion: '2.0.0-beta',
            browser: 'Chrome 131',
            os: 'Windows 11',
            deviceType: 'Desktop',
            timestamp: `${today}T08:00:00Z`,
            module: 'Zalo Bot',
            currentPath: '/settings'
          },
          aiAnalysis: {
            summary: 'Khen ngợi trải nghiệm đồng bộ 2 chiều Zalo Bot và giao diện linh vật mầm xanh.',
            sentiment: 'positive',
            suggestedCategory: 'Đồng bộ Zalo',
            suggestedPriority: 'low',
            keyThemes: ['Zalo Bot', 'Đồng bộ', 'Giao diện']
          },
          createdAt: `${today}T08:05:00Z`,
          updatedAt: `${today}T09:00:00Z`
        },
        fb_demo_2: {
          id: 'fb_demo_2',
          code: 'FB-2026-2189',
          userId: 'default_user',
          userName: 'Phạm Tuấn',
          isAnonymous: false,
          allowContact: true,
          rating: 4,
          title: 'Đề xuất thêm đồng bộ 2 chiều với Google Calendar',
          content: 'Hiện tại mình quản lý deadline rất tốt nhưng muốn các sự kiện và bài kiểm tra trên OmniPlan tự động đồng bộ sang Google Calendar trên điện thoại.',
          category: 'google_calendar',
          module: 'Công việc',
          status: 'planned',
          priority: 'high',
          techInfo: {
            appVersion: '2.0.0-beta',
            browser: 'Chrome 131',
            os: 'Windows 11',
            deviceType: 'Desktop',
            timestamp: `${today}T09:30:00Z`,
            module: 'Công việc',
            currentPath: '/work'
          },
          aiAnalysis: {
            summary: 'Yêu cầu tính năng đồng bộ 2 chiều lịch hẹn công việc và học tập sang Google Calendar.',
            sentiment: 'positive',
            suggestedCategory: 'Đề xuất tính năng',
            suggestedPriority: 'high',
            keyThemes: ['Google Calendar', 'Đồng bộ', 'Deadline']
          },
          createdAt: `${today}T09:35:00Z`,
          updatedAt: `${today}T10:00:00Z`
        }
      },
      feedbackReplies: {
        fb_demo_1: [
          {
            id: 'rep_1',
            feedbackId: 'fb_demo_1',
            senderId: 'admin_omni',
            senderRole: 'admin',
            senderName: 'OmniPlan Core Team',
            message: 'Cảm ơn bạn Tuấn rất nhiều! Đội ngũ OmniPlan sẽ tiếp tục cải tiến tốc độ phản hồi và hỗ trợ thêm nhận diện giọng nói qua Zalo trong bản cập nhật tới nhé 🦦🌱.',
            createdAt: `${today}T09:00:00Z`
          }
        ],
        fb_demo_2: [
          {
            id: 'rep_2',
            feedbackId: 'fb_demo_2',
            senderId: 'admin_omni',
            senderRole: 'admin',
            senderName: 'OmniPlan Product Team',
            message: 'Chào bạn, đề xuất này đã được đưa vào Roadmap phiên bản tiếp theo (In Progress). Cảm ơn bạn đã đóng góp ý tưởng xuất sắc!',
            createdAt: `${today}T10:00:00Z`
          }
        ]
      },
      featureRequests: [
        {
          id: 'feat_1',
          title: 'Đồng bộ 2 chiều với Google Calendar & Outlook',
          description: 'Tự động đẩy lịch trình học tập, deadline công việc sang Google Calendar và kéo sự kiện về OmniDaily.',
          category: 'google_calendar',
          module: 'Công việc',
          submittedBy: 'Phạm Tuấn',
          votesCount: 38,
          votedUserIds: ['default_user', 'user_2', 'user_3'],
          status: 'in_progress',
          createdAt: `${today}T08:00:00Z`,
          targetRelease: 'v2.1.0'
        },
        {
          id: 'feat_2',
          title: 'Quét hóa đơn siêu thị dài nhiều mục (Multi-item Receipt)',
          description: 'Hỗ trợ nhận diện hóa đơn siêu thị dài, tự động bóc tách từng mặt hàng và gán danh mục riêng lẻ.',
          category: 'performance',
          module: 'Tài chính',
          submittedBy: 'Mai Linh',
          votesCount: 24,
          votedUserIds: ['user_4', 'user_5'],
          status: 'planned',
          createdAt: `${today}T07:30:00Z`,
          targetRelease: 'v2.2.0'
        },
        {
          id: 'feat_3',
          title: 'Gợi ý bài tập cá nhân hóa bằng mô hình Leitner nâng cao',
          description: 'Tự động tính toán xác suất quên của não bộ theo đường cong Ebbinghaus để nhắc ôn tập đúng thời điểm.',
          category: 'ai_assistant',
          module: 'Học tập',
          submittedBy: 'Minh Hoàng',
          votesCount: 19,
          votedUserIds: ['default_user'],
          status: 'under_review',
          createdAt: `${today}T06:00:00Z`
        }
      ],
      changelogs: [
        {
          version: 'v2.0.0 Beta',
          releaseDate: today,
          title: 'Ra mắt OmniPlan Beta & Trợ lý Đa phương thức Zalo Bot',
          tag: 'Major',
          highlights: [
            'Tích hợp OmniAI và đồng bộ 2 chiều với Zalo Bot Platform chính thức.',
            'Ra mắt Trung tâm Góp ý & Báo lỗi (Feedback & Support Center) với linh vật rái cá mầm xanh.',
            'Bổ sung tính năng bình chọn Roadmap cộng đồng và chương trình huy hiệu Beta Tester.',
            'Quản lý 4 trụ cột cuộc sống: Sức khỏe, Học tập, Công việc, Tài chính cá nhân.'
          ]
        },
        {
          version: 'v1.9.0',
          releaseDate: '2026-11-01',
          title: 'Nâng cấp Giao diện & Đa tính cách AI Persona',
          tag: 'Improvement',
          highlights: [
            'Hỗ trợ 11 tính cách AI phong phú với thanh trượt cảm xúc.',
            'Tích hợp nhận diện món ăn tính calo và đọc hóa đơn biên lai.',
            'Bổ sung bộ nhớ dài hạn OmniMemory phân tầng.'
          ]
        }
      ],
      userBadges: {
        default_user: [
          {
            id: 'b_1',
            key: 'early_supporter',
            name: 'Early Supporter',
            description: 'Người dùng đồng hành cùng OmniPlan từ những ngày đầu thử nghiệm.',
            icon: '🌟',
            unlocked: true,
            unlockedAt: `${today}T07:00:00Z`
          },
          {
            id: 'b_2',
            key: 'beta_tester',
            name: 'Beta Tester',
            description: 'Thành viên chính thức của chương trình trải nghiệm OmniPlan Beta.',
            icon: '🧪',
            unlocked: true,
            unlockedAt: `${today}T07:00:00Z`
          },
          {
            id: 'b_3',
            key: 'idea_contributor',
            name: 'Idea Contributor',
            description: 'Đã đóng góp ý tưởng giá trị được đưa vào kế hoạch phát triển (Roadmap).',
            icon: '💡',
            unlocked: true,
            unlockedAt: `${today}T10:00:00Z`
          },
          {
            id: 'b_4',
            key: 'bug_hunter',
            name: 'Bug Hunter',
            description: 'Góp phần phát hiện và báo cáo lỗi kỹ thuật giúp hoàn thiện sản phẩm.',
            icon: '🐛',
            unlocked: false
          },
          {
            id: 'b_5',
            key: 'community_builder',
            name: 'Community Builder',
            description: 'Tích cực tham gia bình chọn và xây dựng cộng đồng OmniPlan.',
            icon: '🤝',
            unlocked: true,
            unlockedAt: `${today}T08:30:00Z`
          }
        ]
      },
      notifications: {
        default_user: [
          {
            id: 'notif_1',
            userId: 'default_user',
            title: 'Admin đã trả lời góp ý của bạn',
            message: 'Đội ngũ OmniPlan đã phản hồi góp ý "Đồng bộ Zalo Bot rất mượt mà". Hãy nhấn để xem chi tiết!',
            type: 'feedback_reply',
            read: false,
            referenceId: 'fb_demo_1',
            createdAt: `${today}T09:00:00Z`
          },
          {
            id: 'notif_2',
            userId: 'default_user',
            title: '🎉 Mở khóa huy hiệu Idea Contributor',
            message: 'Chúc mừng bạn! Ý tưởng "Đồng bộ 2 chiều với Google Calendar" của bạn đã được đưa vào Roadmap.',
            type: 'badge',
            read: false,
            createdAt: `${today}T10:00:00Z`
          }
        ]
      }
    };
  }

  private loadDatabase(): AppDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...this.getDefaultDatabase(), ...parsed };
      }
    } catch (e) {
      console.warn('Could not read db file, using default schema:', e);
    }
    const def = this.getDefaultDatabase();
    this.saveDatabaseSync(def);
    return def;
  }

  public scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDatabase();
    }, 500);
  }

  private saveDatabase() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database to file:', e);
    }
  }

  private saveDatabaseSync(data: AppDatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database sync:', e);
    }
  }

  // ==========================================
  // GETTERS & DATA ACCESS METHODS
  // ==========================================
  public getUserProfile(userId: string = 'default_user'): UserProfile {
    return this.db.users[userId] || this.db.users['default_user'];
  }

  public updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const current = this.getUserProfile(userId);
    const updated = { ...current, ...updates };
    this.db.users[userId] = updated;
    this.scheduleSave();
    return updated;
  }

  public getPersonalities(): AIPersonality[] {
    return Object.values(this.db.personalities);
  }

  public getPersonality(id: string): AIPersonality | undefined {
    return this.db.personalities[id];
  }

  public savePersonality(personality: AIPersonality): AIPersonality {
    this.db.personalities[personality.id] = personality;
    this.scheduleSave();
    return personality;
  }

  // Conversations & Messages
  public getConversations(userId: string = 'default_user'): ConversationSession[] {
    return Object.values(this.db.conversations)
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getConversation(convId: string): ConversationSession | undefined {
    return this.db.conversations[convId];
  }

  public createConversation(userId: string = 'default_user', title: string = 'Cuộc trò chuyện mới', personalityId: AIPersonalityId = 'standard'): ConversationSession {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const session: ConversationSession = {
      id,
      userId,
      title,
      personalityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false
    };
    this.db.conversations[id] = session;
    this.db.messages[id] = [];
    this.scheduleSave();
    return session;
  }

  public updateConversation(convId: string, updates: Partial<ConversationSession>): ConversationSession | null {
    if (!this.db.conversations[convId]) return null;
    this.db.conversations[convId] = {
      ...this.db.conversations[convId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.scheduleSave();
    return this.db.conversations[convId];
  }

  public deleteConversation(convId: string): boolean {
    if (!this.db.conversations[convId]) return false;
    delete this.db.conversations[convId];
    delete this.db.messages[convId];
    this.scheduleSave();
    return true;
  }

  public getMessages(convId: string): ChatMessage[] {
    return this.db.messages[convId] || [];
  }

  public addMessage(convId: string, message: ChatMessage): ChatMessage {
    if (!this.db.messages[convId]) {
      this.db.messages[convId] = [];
    }
    this.db.messages[convId].push(message);
    if (this.db.conversations[convId]) {
      this.db.conversations[convId].updatedAt = new Date().toISOString();
      if (this.db.messages[convId].length === 2 && message.role === 'user') {
        // Auto title
        this.db.conversations[convId].title = message.content.slice(0, 30) + '...';
      }
    }
    this.scheduleSave();
    return message;
  }

  // Memories
  public getMemories(userId: string = 'default_user'): AIMemoryItem[] {
    return this.db.memories[userId] || [];
  }

  public addMemory(userId: string, memory: Omit<AIMemoryItem, 'id' | 'createdAt' | 'updatedAt'>): AIMemoryItem {
    if (!this.db.memories[userId]) {
      this.db.memories[userId] = [];
    }
    const list = this.db.memories[userId];
    const existingIndex = list.findIndex(m => m.key.toLowerCase() === memory.key.toLowerCase());

    const item: AIMemoryItem = {
      ...memory,
      id: existingIndex >= 0 ? list[existingIndex].id : `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.push(item);
    }
    this.scheduleSave();
    return item;
  }

  public deleteMemory(userId: string, memoryId: string): boolean {
    if (!this.db.memories[userId]) return false;
    this.db.memories[userId] = this.db.memories[userId].filter(m => m.id !== memoryId);
    this.scheduleSave();
    return true;
  }

  public toggleMemory(userId: string, memoryId: string, active: boolean): boolean {
    if (!this.db.memories[userId]) return false;
    const item = this.db.memories[userId].find(m => m.id === memoryId);
    if (item) {
      item.active = active;
      item.updatedAt = new Date().toISOString();
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // Tasks
  public getTasks(userId: string = 'default_user'): TaskItem[] {
    return this.db.tasks[userId] || [];
  }

  public addTask(userId: string, task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>): TaskItem {
    if (!this.db.tasks[userId]) {
      this.db.tasks[userId] = [];
    }
    const item: TaskItem = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.tasks[userId].unshift(item);
    this.scheduleSave();
    return item;
  }

  public updateTask(userId: string, taskId: string, updates: Partial<TaskItem>): TaskItem | null {
    if (!this.db.tasks[userId]) return null;
    const task = this.db.tasks[userId].find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates, { updatedAt: new Date().toISOString() });
      this.scheduleSave();
      return task;
    }
    return null;
  }

  public deleteTask(userId: string, taskId: string): boolean {
    if (!this.db.tasks[userId]) return false;
    this.db.tasks[userId] = this.db.tasks[userId].filter(t => t.id !== taskId);
    this.scheduleSave();
    return true;
  }

  // Health
  public getHealthRecords(userId: string = 'default_user'): HealthRecord[] {
    return this.db.healthRecords[userId] || [];
  }

  public addHealthRecord(userId: string, kind: HealthRecord['kind'], data: HealthRecord['data']): HealthRecord {
    if (!this.db.healthRecords[userId]) {
      this.db.healthRecords[userId] = [];
    }
    const item: HealthRecord = {
      id: `hr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      kind,
      timestamp: new Date().toISOString(),
      data
    };
    this.db.healthRecords[userId].unshift(item);
    this.scheduleSave();
    return item;
  }

  // Finance
  public getTransactions(userId: string = 'default_user'): TransactionItem[] {
    return this.db.transactions[userId] || [];
  }

  public addTransaction(userId: string, tx: Omit<TransactionItem, 'id' | 'createdAt'>): TransactionItem {
    if (!this.db.transactions[userId]) {
      this.db.transactions[userId] = [];
    }
    const item: TransactionItem = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.db.transactions[userId].unshift(item);

    // Update wallet balance
    if (this.db.wallets[userId]) {
      const wallet = this.db.wallets[userId].find(w => w.name.toLowerCase() === (tx.wallet || '').toLowerCase());
      if (wallet) {
        if (tx.type === 'expense') {
          wallet.balance -= tx.amount;
        } else {
          wallet.balance += tx.amount;
        }
      }
    }

    // Update category budget spent
    if (this.db.budgets[userId] && tx.type === 'expense') {
      const budget = this.db.budgets[userId].find(b => b.category.toLowerCase() === tx.category.toLowerCase());
      if (budget) {
        budget.spentAmount += tx.amount;
      }
    }

    this.scheduleSave();
    return item;
  }

  public getBudgets(userId: string = 'default_user'): BudgetItem[] {
    return this.db.budgets[userId] || [];
  }

  public setBudget(userId: string, category: string, limitAmount: number, period: 'weekly' | 'monthly' = 'monthly'): BudgetItem {
    if (!this.db.budgets[userId]) {
      this.db.budgets[userId] = [];
    }
    const list = this.db.budgets[userId];
    const existing = list.find(b => b.category.toLowerCase() === category.toLowerCase());
    if (existing) {
      existing.limitAmount = limitAmount;
      existing.period = period;
      this.scheduleSave();
      return existing;
    }
    const item: BudgetItem = {
      id: `bg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      category,
      limitAmount,
      spentAmount: 0,
      period
    };
    list.push(item);
    this.scheduleSave();
    return item;
  }

  public getWallets(userId: string = 'default_user'): WalletItem[] {
    return this.db.wallets[userId] || [];
  }

  // Learning
  public getFlashcards(userId: string = 'default_user'): Flashcard[] {
    return this.db.flashcards[userId] || [];
  }

  public addFlashcard(userId: string, front: string, back: string, subjectId: string = 'general'): Flashcard {
    if (!this.db.flashcards[userId]) {
      this.db.flashcards[userId] = [];
    }
    const today = new Date().toISOString().split('T')[0];
    const item: Flashcard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      subjectId,
      front,
      back,
      box: 1,
      nextReviewDate: today
    };
    this.db.flashcards[userId].push(item);
    this.scheduleSave();
    return item;
  }

  // Zalo Connections
  public getZaloConnectionByUserId(userId: string): ZaloConnectionItem | undefined {
    return Object.values(this.db.zaloConnections).find(c => c.userId === userId && c.active);
  }

  public getZaloConnectionByZaloUserId(zaloUserId: string): ZaloConnectionItem | undefined {
    return this.db.zaloConnections[zaloUserId];
  }

  public saveZaloConnection(connection: ZaloConnectionItem) {
    this.db.zaloConnections[connection.zaloUserId] = connection;
    // Also update user profile flag
    this.updateUserProfile(connection.userId, {
      zaloLinked: true,
      zaloUserId: connection.zaloUserId,
      zaloDisplayName: connection.zaloDisplayName
    });
    this.scheduleSave();
  }

  public unlinkZalo(zaloUserId: string): boolean {
    const conn = this.db.zaloConnections[zaloUserId];
    if (conn) {
      conn.active = false;
      this.updateUserProfile(conn.userId, {
        zaloLinked: false,
        zaloUserId: undefined
      });
      delete this.db.zaloConnections[zaloUserId];
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // Action Logs & Undo
  public logAction(userId: string, action: ActionType, domain: Domain, description: string, data: any): ActionLogItem {
    const item: ActionLogItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      action,
      domain,
      description,
      data,
      status: 'executed',
      createdAt: new Date().toISOString(),
      executedAt: new Date().toISOString()
    };
    this.db.actionLogs.unshift(item);
    this.scheduleSave();
    return item;
  }

  public getActionLogs(userId: string = 'default_user', limit: number = 30): ActionLogItem[] {
    return this.db.actionLogs.filter(a => a.userId === userId).slice(0, limit);
  }

  public undoAction(actionId: string, userId: string = 'default_user'): { success: boolean; message: string } {
    const action = this.db.actionLogs.find(a => a.id === actionId && a.userId === userId);
    if (!action) {
      return { success: false, message: 'Không tìm thấy hành động để hoàn tác.' };
    }
    if (action.status === 'undone') {
      return { success: false, message: 'Hành động này đã được hoàn tác trước đó.' };
    }

    // Perform reverse logic based on action type
    switch (action.action) {
      case 'create_task':
        if (action.data?.taskId) {
          this.deleteTask(userId, action.data.taskId);
        }
        break;
      case 'add_transaction':
        if (action.data?.id) {
          this.db.transactions[userId] = (this.db.transactions[userId] || []).filter(t => t.id !== action.data.id);
        }
        break;
      case 'log_water':
        // Pop last water entry
        this.db.healthRecords[userId] = (this.db.healthRecords[userId] || []).filter(
          h => !(h.kind === 'water' && h.data.waterMl === action.data.amountMl)
        );
        break;
    }

    action.status = 'undone';
    this.scheduleSave();
    return { success: true, message: `Đã hoàn tác: ${action.description}` };
  }

  // ==========================================
  // FEEDBACK & SUPPORT CENTER METHODS
  // ==========================================
  public submitFeedback(feedback: Omit<FeedbackItem, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'status'>): FeedbackItem {
    if (!this.db.feedbacks) {
      this.db.feedbacks = {};
    }
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const code = `FB-2026-${randNum}`;
    const id = `fb_${Date.now()}_${randNum}`;

    const item: FeedbackItem = {
      ...feedback,
      id,
      code,
      status: 'received',
      priority: feedback.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.feedbacks[id] = item;

    // Check if user should unlock Bug Hunter or Idea Contributor badge
    if (item.category === 'bug_report') {
      this.unlockBadge(item.userId, 'bug_hunter');
    }

    // Notify Admin via system notification
    this.addNotification('admin_omni', {
      userId: 'admin_omni',
      title: `Phản hồi mới: [${item.code}] ${item.title}`,
      message: `Người dùng ${item.isAnonymous ? 'Ẩn danh' : item.userName} vừa gửi góp ý cho module ${item.module}. Đánh giá: ${item.rating}/5 sao.`,
      type: 'feedback_status',
      referenceId: id
    });

    this.scheduleSave();
    return item;
  }

  public getUserFeedbacks(userId: string = 'default_user'): FeedbackItem[] {
    if (!this.db.feedbacks) return [];
    return Object.values(this.db.feedbacks)
      .filter(f => f.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllFeedbacks(filters?: { status?: string; category?: string; priority?: string; search?: string }): FeedbackItem[] {
    if (!this.db.feedbacks) return [];
    let list = Object.values(this.db.feedbacks);

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        list = list.filter(f => f.status === filters.status);
      }
      if (filters.category && filters.category !== 'all') {
        list = list.filter(f => f.category === filters.category);
      }
      if (filters.priority && filters.priority !== 'all') {
        list = list.filter(f => f.priority === filters.priority);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(f =>
          f.title.toLowerCase().includes(q) ||
          f.content.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.module.toLowerCase().includes(q)
        );
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getFeedbackById(id: string): FeedbackItem | undefined {
    return this.db.feedbacks?.[id];
  }

  public updateFeedback(id: string, updates: Partial<FeedbackItem>): FeedbackItem | null {
    if (!this.db.feedbacks?.[id]) return null;
    const current = this.db.feedbacks[id];
    const prevStatus = current.status;

    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.db.feedbacks[id] = updated;

    // If status changed, notify user
    if (updates.status && updates.status !== prevStatus && !updated.isAnonymous) {
      this.addNotification(updated.userId, {
        userId: updated.userId,
        title: `Cập nhật trạng thái phản hồi [${updated.code}]`,
        message: `Phản hồi "${updated.title}" của bạn đã chuyển sang trạng thái: ${this.formatStatusLabel(updates.status)}.`,
        type: 'feedback_status',
        referenceId: id
      });
    }

    this.scheduleSave();
    return updated;
  }

  public mergeFeedbacks(targetId: string, sourceId: string): boolean {
    if (!this.db.feedbacks?.[targetId] || !this.db.feedbacks?.[sourceId]) return false;
    const source = this.db.feedbacks[sourceId];
    source.status = 'declined';
    source.internalNotes = `[Đã gộp vào phản hồi ${this.db.feedbacks[targetId].code}] ${source.internalNotes || ''}`;
    source.mergedIntoId = targetId;
    source.updatedAt = new Date().toISOString();

    // Copy replies from source to target
    const sourceReplies = this.db.feedbackReplies?.[sourceId] || [];
    if (!this.db.feedbackReplies[targetId]) {
      this.db.feedbackReplies[targetId] = [];
    }
    sourceReplies.forEach(r => {
      this.db.feedbackReplies[targetId].push({
        ...r,
        feedbackId: targetId,
        message: `[Từ phản hồi gộp ${source.code}]: ${r.message}`
      });
    });

    this.scheduleSave();
    return true;
  }

  public getFeedbackReplies(feedbackId: string): FeedbackReply[] {
    return this.db.feedbackReplies?.[feedbackId] || [];
  }

  public addFeedbackReply(reply: Omit<FeedbackReply, 'id' | 'createdAt'>): FeedbackReply {
    if (!this.db.feedbackReplies) {
      this.db.feedbackReplies = {};
    }
    if (!this.db.feedbackReplies[reply.feedbackId]) {
      this.db.feedbackReplies[reply.feedbackId] = [];
    }

    const item: FeedbackReply = {
      ...reply,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.db.feedbackReplies[reply.feedbackId].push(item);

    // If reply is from admin, notify user
    const fb = this.getFeedbackById(reply.feedbackId);
    if (fb && reply.senderRole === 'admin' && !fb.isAnonymous) {
      this.addNotification(fb.userId, {
        userId: fb.userId,
        title: `Phản hồi mới từ Admin cho [${fb.code}]`,
        message: `${reply.senderName}: "${item.message.slice(0, 100)}..."`,
        type: 'feedback_reply',
        referenceId: fb.id
      });
    }

    this.scheduleSave();
    return item;
  }

  // Feature Requests & Voting
  public getFeatureRequests(): FeatureRequestItem[] {
    return this.db.featureRequests || [];
  }

  public addFeatureRequest(item: Omit<FeatureRequestItem, 'id' | 'createdAt' | 'votesCount' | 'votedUserIds' | 'status'>): FeatureRequestItem {
    if (!this.db.featureRequests) {
      this.db.featureRequests = [];
    }
    const feat: FeatureRequestItem = {
      ...item,
      id: `feat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      votesCount: 1,
      votedUserIds: ['default_user'],
      status: 'under_review',
      createdAt: new Date().toISOString()
    };
    this.db.featureRequests.unshift(feat);

    // Unlock Idea Contributor badge
    this.unlockBadge('default_user', 'idea_contributor');

    this.scheduleSave();
    return feat;
  }

  public voteFeatureRequest(featureId: string, userId: string = 'default_user'): { success: boolean; votesCount: number; hasVoted: boolean } {
    if (!this.db.featureRequests) return { success: false, votesCount: 0, hasVoted: false };
    const feat = this.db.featureRequests.find(f => f.id === featureId);
    if (!feat) return { success: false, votesCount: 0, hasVoted: false };

    if (!feat.votedUserIds) feat.votedUserIds = [];

    const hasVoted = feat.votedUserIds.includes(userId);
    if (hasVoted) {
      // Unvote
      feat.votedUserIds = feat.votedUserIds.filter(uid => uid !== userId);
      feat.votesCount = Math.max(0, feat.votesCount - 1);
    } else {
      // Vote
      feat.votedUserIds.push(userId);
      feat.votesCount += 1;
      this.unlockBadge(userId, 'community_builder');
    }

    this.scheduleSave();
    return { success: true, votesCount: feat.votesCount, hasVoted: !hasVoted };
  }

  // Changelogs
  public getChangelogs(): ProductChangelog[] {
    return this.db.changelogs || [];
  }

  // User Badges
  public getUserBadges(userId: string = 'default_user'): BetaBadge[] {
    return this.db.userBadges?.[userId] || this.db.userBadges?.['default_user'] || [];
  }

  public unlockBadge(userId: string, badgeKey: string): boolean {
    if (!this.db.userBadges) this.db.userBadges = {};
    if (!this.db.userBadges[userId]) {
      this.db.userBadges[userId] = this.db.userBadges['default_user'] || [];
    }
    const badge = this.db.userBadges[userId].find(b => b.key === badgeKey);
    if (badge && !badge.unlocked) {
      badge.unlocked = true;
      badge.unlockedAt = new Date().toISOString();
      this.addNotification(userId, {
        userId,
        title: `🎉 Mở khóa huy hiệu: ${badge.name}`,
        message: `Bạn đã mở khóa huy hiệu "${badge.name}" (${badge.icon})! ${badge.description}`,
        type: 'badge'
      });
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // Notifications
  public getNotifications(userId: string = 'default_user'): AppNotification[] {
    return (this.db.notifications?.[userId] || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addNotification(userId: string, notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    if (!this.db.notifications) this.db.notifications = {};
    if (!this.db.notifications[userId]) this.db.notifications[userId] = [];

    const item: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.db.notifications[userId].unshift(item);
    this.scheduleSave();
    return item;
  }

  public markNotificationRead(notifId: string, userId: string = 'default_user'): boolean {
    if (!this.db.notifications?.[userId]) return false;
    const notif = this.db.notifications[userId].find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      this.scheduleSave();
      return true;
    }
    return false;
  }

  private formatStatusLabel(status: FeedbackStatus): string {
    switch (status) {
      case 'received': return 'Đã tiếp nhận';
      case 'reviewing': return 'Đang xem xét';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'planned': return 'Đã đưa vào kế hoạch phát triển';
      case 'need_info': return 'Cần thêm thông tin';
      case 'declined': return 'Không thực hiện';
      default: return status;
    }
  }
}
