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
  ChatMessage
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
}
