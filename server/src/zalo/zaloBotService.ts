import { AIOrchestrator } from '../ai/orchestrator.js';
import { AIPersonalityId } from '../../src/types/index.js';
import { DBService, ZaloConnectionItem } from '../db/dbService.js';

export interface ZaloWebhookEvent {
  app_id?: string;
  sender: {
    id: string; // Zalo User ID
  };
  recipient: {
    id: string; // Bot ID
  };
  event_name: 'user_send_text' | 'user_send_image' | 'user_send_audio' | 'user_send_file';
  message: {
    msg_id: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: {
        url?: string;
        thumbnail?: string;
        name?: string;
      };
    }>;
  };
  timestamp: number;
}

export class ZaloBotService {
  private static instance: ZaloBotService;
  private orchestrator: AIOrchestrator;
  private db: DBService;

  // Storage for temporary linking codes (code -> { userId, expiresAt })
  private pendingLinkCodes: Map<string, { userId: string; expiresAt: number }> = new Map();
  // Processed message IDs (Anti-duplication)
  private processedMsgIds: Set<string> = new Set();

  private constructor() {
    this.orchestrator = AIOrchestrator.getInstance();
    this.db = DBService.getInstance();
  }

  public static getInstance(): ZaloBotService {
    if (!ZaloBotService.instance) {
      ZaloBotService.instance = new ZaloBotService();
    }
    return ZaloBotService.instance;
  }

  // 1. Generate one-time pairing code (App -> User -> Zalo)
  public generateLinkCode(userId: string = 'default_user'): { code: string; expiresInMinutes: number } {
    // 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    this.pendingLinkCodes.set(code, { userId, expiresAt });
    return { code, expiresInMinutes: 15 };
  }

  // 2. Verify and link Zalo User ID with internal User ID
  public linkAccount(zaloUserId: string, code: string, zaloDisplayName?: string): { success: boolean; message: string; userId?: string } {
    const pending = this.pendingLinkCodes.get(code.trim());
    if (!pending) {
      return {
        success: false,
        message: 'Mã liên kết không đúng hoặc đã hết hạn. Bạn hãy tạo mã mới trong App (Cài đặt > Tích hợp Zalo).'
      };
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingLinkCodes.delete(code.trim());
      return { success: false, message: 'Mã liên kết đã hết hạn (chỉ có hiệu lực trong 15 phút). Vui lòng tạo mã mới.' };
    }

    // Success: register link into DB
    const record: ZaloConnectionItem = {
      userId: pending.userId,
      zaloUserId,
      zaloDisplayName: zaloDisplayName || 'Người dùng Zalo',
      linkedAt: new Date().toISOString(),
      active: true,
      personalityId: 'standard',
      syncMode: 'all'
    };

    this.db.saveZaloConnection(record);
    this.pendingLinkCodes.delete(code.trim());

    return {
      success: true,
      message: '🎉 Liên kết tài khoản OmniPlan thành công! Toàn bộ lịch trình, sức khỏe, học tập và tài chính của bạn đã được đồng bộ 2 chiều.',
      userId: pending.userId
    };
  }

  public getConnection(zaloUserId: string): ZaloConnectionItem | undefined {
    return this.db.getZaloConnectionByZaloUserId(zaloUserId);
  }

  public unlinkAccount(zaloUserId: string): boolean {
    return this.db.unlinkZalo(zaloUserId);
  }

  // 3. Handle Webhook Message from Zalo Bot
  public async handleWebhookEvent(event: ZaloWebhookEvent): Promise<{ replyText: string; directResponse: boolean; syncedToApp: boolean }> {
    const msgId = event.message?.msg_id;
    if (msgId && this.processedMsgIds.has(msgId)) {
      return { replyText: '', directResponse: false, syncedToApp: false }; // Anti-duplicate deduplication
    }
    if (msgId) {
      this.processedMsgIds.add(msgId);
      if (this.processedMsgIds.size > 5000) {
        const first = this.processedMsgIds.values().next().value;
        if (first) this.processedMsgIds.delete(first);
      }
    }

    const zaloUserId = event.sender.id;
    const rawText = (event.message.text || '').trim();

    // Check commands first
    if (rawText.startsWith('/')) {
      const parts = rawText.split(' ');
      const command = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      if (command === '/start' || command === '/help') {
        return {
          replyText: `👋 Chào mừng bạn đến với OmniPlan Personal AI Bot!
Tôi là trợ lý cuộc sống toàn diện đồng bộ với App của bạn.

Các lệnh nhanh:
• /link <mã> : Liên kết với tài khoản trên App OmniPlan (6 chữ số)
• /today : Tổng quan ngày hôm nay (Công việc, Sức khỏe, Thu chi)
• /work : Danh sách việc cần làm
• /health : Chỉ số nước, cân nặng, dinh dưỡng
• /finance : Báo cáo chi tiêu
• /study : Lịch học & môn học
• /personality <tên> : Đổi tính cách AI (standard, coach, friendly, funny...)
• /unlink : Hủy liên kết tài khoản

Hoặc bạn có thể nhắn tin bằng ngôn ngữ tự nhiên:
- 'Hôm nay tôi đã tiêu 120k tiền ăn uống'
- 'Nhắc tôi uống nước lúc 3h chiều'
- 'Thêm công việc họp dự án vào 9h sáng mai'
- 'Tôi vừa cân được 65kg'
- Gửi ảnh hóa đơn hoặc ảnh đồ ăn để AI phân tích`,
          directResponse: true,
          syncedToApp: true
        };
      }

      if (command === '/link') {
        if (!arg) {
          return {
            replyText: `Vui lòng nhập mã liên kết gồm 6 chữ số được tạo từ App.\nCú pháp: /link 123456`,
            directResponse: true,
            syncedToApp: false
          };
        }
        const res = this.linkAccount(zaloUserId, arg);
        return { replyText: res.message, directResponse: true, syncedToApp: res.success };
      }

      if (command === '/unlink') {
        this.unlinkAccount(zaloUserId);
        return { replyText: 'Đã hủy liên kết tài khoản OmniPlan khỏi Zalo này.', directResponse: true, syncedToApp: true };
      }

      // Check if user is linked before allowing data commands
      const connection = this.getConnection(zaloUserId);
      if (!connection) {
        return {
          replyText: `⚠️ Bạn chưa liên kết tài khoản OmniPlan.
Hãy mở ứng dụng OmniPlan, vào mục Cài đặt > Tích hợp Zalo để lấy mã 6 chữ số và gửi lại cú pháp:
/link <mã_6_số>`,
          directResponse: true,
          syncedToApp: false
        };
      }

      const userId = connection.userId;

      if (command === '/today') {
        const tasks = this.db.getTasks(userId).filter(t => t.status !== 'done');
        const health = this.db.getHealthRecords(userId);
        const today = new Date().toISOString().split('T')[0];
        const todayWater = health.filter(h => h.kind === 'water' && h.timestamp.startsWith(today)).reduce((sum, h) => sum + (h.data.waterMl || 0), 0);
        const todayWeight = health.filter(h => h.kind === 'weight')[0]?.data.weightKg || 65;
        const txs = this.db.getTransactions(userId).filter(t => t.date === today && t.type === 'expense');
        const todaySpend = txs.reduce((sum, t) => sum + t.amount, 0);

        return {
          replyText: `📅 TỔNG QUAN HÔM NAY CỦA BẠN:
• Sức khỏe: Đã uống ${todayWater} / 2,000ml nước. Cân nặng: ${todayWeight}kg.
• Công việc: Có ${tasks.length} việc cần hoàn thành hôm nay.
• Tài chính: Chi tiêu hôm nay: ${todaySpend.toLocaleString('vi-VN')} đ.
Gửi: 'Thêm việc X' hoặc 'uống 300ml nước' để cập nhật ngay!`,
          directResponse: true,
          syncedToApp: true
        };
      }

      if (command === '/health') {
        const health = this.db.getHealthRecords(userId);
        const today = new Date().toISOString().split('T')[0];
        const todayWater = health.filter(h => h.kind === 'water' && h.timestamp.startsWith(today)).reduce((sum, h) => sum + (h.data.waterMl || 0), 0);
        const todayWeight = health.filter(h => h.kind === 'weight')[0]?.data.weightKg || 65;
        return {
          replyText: `🌿 CHỈ SỐ SỨC KHỎE:
- Lượng nước hôm nay: ${todayWater} / 2,000 ml
- Cân nặng gần nhất: ${todayWeight} kg
Nhắn: 'uống 250ml nước' hoặc 'cân nặng 64.5kg' để ghi nhận!`,
          directResponse: true,
          syncedToApp: true
        };
      }

      if (command === '/work') {
        const tasks = this.db.getTasks(userId).filter(t => t.status !== 'done');
        let text = `💼 CÔNG VIỆC CẦN LÀM (${tasks.length}):\n`;
        tasks.slice(0, 5).forEach((t, i) => {
          text += `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}\n`;
        });
        text += `\nNhắn: 'Thêm việc ...' để tạo thêm công việc mới.`;
        return { replyText: text, directResponse: true, syncedToApp: true };
      }

      if (command === '/finance') {
        const today = new Date().toISOString().split('T')[0];
        const txs = this.db.getTransactions(userId).filter(t => t.date === today);
        const spent = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const wallets = this.db.getWallets(userId);
        const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

        return {
          replyText: `💳 TÀI CHÍNH HÔM NAY:
- Chi hôm nay: ${spent.toLocaleString('vi-VN')} đ
- Thu hôm nay: ${income.toLocaleString('vi-VN')} đ
- Tổng số dư khả dụng các ví: ${totalBalance.toLocaleString('vi-VN')} đ
Gửi ảnh hóa đơn hoặc nhắn: 'tiêu 45k ăn trưa' để ghi sổ!`,
          directResponse: true,
          syncedToApp: true
        };
      }

      if (command === '/study') {
        const flashcards = this.db.getFlashcards(userId);
        return {
          replyText: `📚 HỌC TẬP & KỸ NĂNG:
- Tổng số thẻ Flashcard đã tạo: ${flashcards.length} thẻ
- Kế hoạch ôn tập: Áp dụng phương pháp Active Recall & Spaced Repetition.
Nhắn: 'tạo flashcard từ mới: Pomodoro là phương pháp làm việc 25 phút'`,
          directResponse: true,
          syncedToApp: true
        };
      }

      if (command === '/personality') {
        if (arg) {
          connection.personalityId = arg as AIPersonalityId;
          this.db.saveZaloConnection(connection);
          return {
            replyText: `✅ Đã chuyển đổi tính cách AI sang: ${arg.toUpperCase()}. Cài đặt đã được đồng bộ với App!`,
            directResponse: true,
            syncedToApp: true
          };
        }
        return {
          replyText: 'Cú pháp: /personality <standard | strict_coach | friendly | funny | mentor | executive | teacher | financial_advisor | wellness_companion | creative>',
          directResponse: true,
          syncedToApp: false
        };
      }
    }

    // Natural conversation: pass to AI Orchestrator
    const connection = this.getConnection(zaloUserId);
    const userId = connection ? connection.userId : 'default_user';
    const personalityId = connection ? connection.personalityId : 'standard';

    // Check if attachments exist (images, audio)
    const attachments: any[] = [];
    if (event.message?.attachments && event.message.attachments.length) {
      for (const att of event.message.attachments) {
        attachments.push({
          type: att.type === 'image' ? 'image' : att.type === 'audio' ? 'audio' : 'document',
          url: att.payload?.url,
          name: att.payload?.name || 'file_zalo'
        });
      }
    }

    const orchestratorResult = await this.orchestrator.processRequest({
      userId,
      message: rawText,
      personalityId,
      source: 'zalo',
      attachments
    });

    let reply = orchestratorResult.reply;

    // Auto-execute detected actions if coming from linked Zalo User!
    if (orchestratorResult.actions.length > 0) {
      for (const act of orchestratorResult.actions) {
        const payload = act.payload;
        // Execute into database
        this.executeZaloAction(userId, payload);
        reply += `\n\n✅ [Đã tự động lưu vào App OmniPlan]: ${payload.description}`;
      }
    }

    // Two-way conversation sync: Store in conversation history!
    const defaultConv = this.db.getConversations(userId)[0];
    if (defaultConv) {
      // Add user message
      this.db.addMessage(defaultConv.id, {
        id: `msg_zalo_u_${Date.now()}`,
        role: 'user',
        content: rawText,
        timestamp: new Date().toISOString(),
        source: 'zalo',
        domain: orchestratorResult.domain
      });
      // Add assistant message
      this.db.addMessage(defaultConv.id, {
        id: `msg_zalo_a_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        source: 'zalo',
        domain: orchestratorResult.domain
      });
    }

    return {
      replyText: reply,
      directResponse: true,
      syncedToApp: true
    };
  }

  private executeZaloAction(userId: string, payload: any) {
    try {
      switch (payload.action) {
        case 'log_water':
          this.db.addHealthRecord(userId, 'water', { waterMl: payload.data.amountMl });
          break;
        case 'log_weight':
          this.db.addHealthRecord(userId, 'weight', { weightKg: payload.data.weightKg, bmi: 21.5 });
          break;
        case 'add_transaction':
          this.db.addTransaction(userId, {
            type: payload.data.type || 'expense',
            amount: payload.data.amount,
            category: payload.data.category || 'Khác',
            wallet: payload.data.wallet || 'Tiền mặt',
            date: payload.data.date || new Date().toISOString().split('T')[0],
            note: payload.data.note || 'Từ Zalo'
          });
          break;
        case 'create_task':
          this.db.addTask(userId, {
            title: payload.data.title,
            domain: payload.data.domain || 'work',
            priority: payload.data.priority || 'medium',
            status: 'todo',
            dueDate: payload.data.dueDate || new Date().toISOString().split('T')[0]
          });
          break;
        case 'add_flashcard':
          this.db.addFlashcard(userId, payload.data.front, payload.data.back);
          break;
      }
      this.db.logAction(userId, payload.action, payload.domain, payload.description, payload.data);
    } catch (e) {
      console.error('Failed to auto-execute Zalo action:', e);
    }
  }
}
