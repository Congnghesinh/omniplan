import { GoogleGenAI } from '@google/genai';
import { AIPersonalityId, ChatMessage, Domain, ActionCardProps, ActionPayload } from '../../src/types/index.js';
import { PERSONALITY_PRESETS } from './personality.js';
import { OMNIPLAN_TOOLS } from './tools.js';
import { MemoryService } from './memory.js';
import { DBService } from '../db/dbService.js';
import { HEALTH_AGENT_SYSTEM_PROMPT } from './agents/healthAgent.js';
import { LEARNING_AGENT_SYSTEM_PROMPT } from './agents/learningAgent.js';
import { WORK_AGENT_SYSTEM_PROMPT } from './agents/workAgent.js';
import { FINANCE_AGENT_SYSTEM_PROMPT } from './agents/financeAgent.js';

export interface OrchestratorInput {
  userId: string;
  message: string;
  personalityId?: AIPersonalityId;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  source?: 'app' | 'zalo';
  conversationId?: string;
  attachments?: Array<{
    type: 'image' | 'audio' | 'document';
    url?: string;
    mimeType?: string;
    extractedText?: string;
    base64Data?: string;
    name?: string;
  }>;
  currentDate?: string;
  currentTime?: string;
}

export interface OrchestratorOutput {
  reply: string;
  domain: Domain;
  actions: ActionCardProps[];
  newMemoriesDetected?: string[];
}

export class AIOrchestrator {
  private static instance: AIOrchestrator;
  private aiClient: GoogleGenAI | null = null;
  private memoryService: MemoryService;
  private db: DBService;

  private constructor() {
    this.memoryService = MemoryService.getInstance();
    this.db = DBService.getInstance();
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  public static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator();
    }
    return AIOrchestrator.instance;
  }

  // 1. Detect Intent & Primary Domain
  public detectDomain(message: string): Domain {
    const text = message.toLowerCase();
    if (/(uống nước|cân nặng|calo|bữa ăn|ăn sáng|ăn trưa|ăn tối|tập gym|chạy bộ|sức khỏe|ngủ|thuốc|kg|ml)/.test(text)) {
      return 'health';
    }
    if (/(học|bài tập|môn|thi|flashcard|ôn tập|lộ trình|kiểm tra|pomodoro|active recall|tài liệu học)/.test(text)) {
      return 'learning';
    }
    if (/(tiền|chi tiêu|thu nhập|hóa đơn|ví|ngân sách|mua sắm|lương|tiết kiệm|vnd|đ|k)\b/.test(text) && !/(học phí)/.test(text)) {
      return 'finance';
    }
    if (/(việc|nhiệm vụ|task|deadline|dự án|họp|lịch hẹn|công việc|báo cáo)/.test(text)) {
      return 'work';
    }
    return 'personal';
  }

  // 2. Build Unified System Instruction
  private buildSystemInstruction(
    userId: string,
    domain: Domain,
    personalityId: AIPersonalityId = 'standard',
    currentDate: string = new Date().toISOString().split('T')[0],
    currentTime: string = new Date().toTimeString().slice(0, 5)
  ): string {
    const personality = PERSONALITY_PRESETS[personalityId] || PERSONALITY_PRESETS.standard;
    const memoryContext = this.memoryService.formatMemoriesForPrompt(userId, domain);

    let domainPrompt = '';
    switch (domain) {
      case 'health':
        domainPrompt = HEALTH_AGENT_SYSTEM_PROMPT;
        break;
      case 'learning':
        domainPrompt = LEARNING_AGENT_SYSTEM_PROMPT;
        break;
      case 'work':
        domainPrompt = WORK_AGENT_SYSTEM_PROMPT;
        break;
      case 'finance':
        domainPrompt = FINANCE_AGENT_SYSTEM_PROMPT;
        break;
      default:
        domainPrompt = `Bạn là Trợ lý OmniPlan Life OS, hỗ trợ toàn diện cuộc sống hàng ngày (Học tập, Công việc, Sức khỏe, Tài chính).`;
    }

    return `
HỆ THỐNG TRỢ LÝ CÁ NHÂN TOÀN DIỆN OMNIPLAN — PERSONAL AI LIFE OPERATING SYSTEM.
Hôm nay là: ${currentDate}, thời gian hiện tại: ${currentTime}.

[PHONG CÁCH TÍNH CÁCH ĐANG CHỌN]
- Tên: ${personality.name}
- Tone giọng: ${personality.tone}
${personality.systemPromptModifier}

[CHUYÊN GIA ĐIỀU PHỐI (AGENT)]
${domainPrompt}

${memoryContext}

[NGUYÊN TẮC HÀNH ĐỘNG & TOOL CALLING]:
- Khi người dùng đưa ra các câu lệnh hành động (ví dụ: 'Thêm việc X', 'Uống 300ml nước', 'Chi 45k ăn trưa', 'Lên lịch học môn Y', 'Cân nặng 65kg'), bạn PHẢI phân tích và đề xuất hành động tương ứng.
- ĐẶC BIỆT: Định dạng câu trả lời bằng Markdown đẹp mắt, rõ ràng. Nếu có hành động cần lưu vào hệ thống, hãy kèm theo khối JSON [ACTION_DATA]{"action": "...", "domain": "...", "description": "...", "data": {...}}[/ACTION_DATA] ở cuối phản hồi.
- Tuyệt đối không bịa đặt số liệu tài chính hoặc số đo sức khỏe không có trong ngữ cảnh.
`;
  }

  // 3. Process Request with Gemini or Smart Fallback
  public async processRequest(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const domain = this.detectDomain(input.message);
    const personalityId = input.personalityId || 'standard';
    const systemPrompt = this.buildSystemInstruction(
      input.userId,
      domain,
      personalityId,
      input.currentDate,
      input.currentTime
    );

    // Check for explicit commands (Local parsing for ultra-fast, robust response)
    const localActions = this.extractMultiIntentActions(input.message, domain);
    const actions: ActionCardProps[] = [];

    for (const act of localActions) {
      actions.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        payload: act,
        status: 'pending'
      });
    }

    // Call Gemini API if client exists
    if (this.aiClient) {
      try {
        const parts: any[] = [];

        // Attachments (Images, Documents)
        if (input.attachments && input.attachments.length) {
          for (const att of input.attachments) {
            if (att.base64Data && att.mimeType) {
              parts.push({
                inlineData: {
                  data: att.base64Data,
                  mimeType: att.mimeType
                }
              });
            } else if (att.extractedText) {
              parts.push({
                text: `\n[NỘI DUNG TÀI LIỆU ĐÍNH KÈM ${att.name || ''}]:\n${att.extractedText}\n`
              });
            }
          }
        }

        parts.push({ text: input.message });

        const response = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...(input.conversationHistory || []).map(h => ({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content }]
            })),
            { role: 'user', parts }
          ]
        });

        const replyText = response.text || 'Tôi đã xử lý yêu cầu của bạn.';

        // Parse any action block from AI response
        const actionMatch = replyText.match(/\[ACTION_DATA\]([\s\S]*?)\[\/ACTION_DATA\]/);
        let cleanReply = replyText.replace(/\[ACTION_DATA\][\s\S]*?\[\/ACTION_DATA\]/, '').trim();

        if (actionMatch) {
          try {
            const parsed = JSON.parse(actionMatch[1]);
            actions.push({
              id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              payload: parsed,
              status: 'pending'
            });
          } catch (e) {
            // ignore JSON parse error
          }
        }

        // Memory auto-learning (extract preferences or goals)
        this.extractAutoMemories(input.userId, input.message, domain);

        return {
          reply: cleanReply,
          domain,
          actions
        };
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to smart local response:', err.message);
      }
    }

    // Smart Local Fallback Response (Ensures 100% offline & demo reliability)
    const reply = this.generateLocalResponse(input.message, domain, personalityId, localActions[0] || null);
    this.extractAutoMemories(input.userId, input.message, domain);

    return {
      reply,
      domain,
      actions
    };
  }

  // Multi-intent action extractor (e.g. "Chi 45k ăn trưa và uống 350ml nước")
  public extractMultiIntentActions(message: string, domain: Domain): ActionPayload[] {
    const actions: ActionPayload[] = [];
    const text = message.toLowerCase();

    // 1. Water
    const waterMatch = text.match(/(?:uống|nước)\s+(\d+)\s*(?:ml|lít|l)\b/i);
    if (waterMatch) {
      let amount = parseInt(waterMatch[1], 10);
      if (text.includes('lít') || text.includes(' l')) amount = amount * 1000;
      actions.push({
        action: 'log_water',
        domain: 'health',
        description: `Ghi nhận uống ${amount}ml nước`,
        data: { amountMl: amount }
      });
    }

    // 2. Weight
    const weightMatch = text.match(/(?:cân nặng|nặng|kg)\s+(\d+(?:\.\d+)?)\s*(?:kg)?/i);
    if (weightMatch) {
      const kg = parseFloat(weightMatch[1]);
      if (kg >= 30 && kg <= 250) {
        actions.push({
          action: 'log_weight',
          domain: 'health',
          description: `Ghi nhận cân nặng ${kg} kg`,
          data: { weightKg: kg }
        });
      }
    }

    // 3. Finance (Expense/Income)
    // Matches "tiêu 50k ăn trưa", "chi 120000 tiền sách", "thu 5000000 lương"
    const moneyMatch = text.match(/(?:tiêu|chi|hết|mua|thanh toán|thu|nhận|lương)\s+(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|ngàn|tr|triệu|đ|vnd)?\s*(.*?)(?:và|$|,)/i);
    if (moneyMatch) {
      let val = parseFloat(moneyMatch[1].replace(',', '.'));
      const unit = (moneyMatch[0] || '').toLowerCase();
      if (unit.includes('k') || unit.includes('nghìn') || unit.includes('ngàn')) {
        val = val * 1000;
      } else if (unit.includes('tr') || unit.includes('triệu')) {
        val = val * 1000000;
      }

      const isIncome = /(?:thu|nhận|lương)/.test(text);
      const note = moneyMatch[2] ? moneyMatch[2].trim() : 'Giao dịch';
      let category = 'Khác';
      if (/(ăn|uống|cơm|phở|bánh|cà phê|trà)/.test(note)) category = 'Ăn uống';
      else if (/(xăng|grab|xe|đi lại|vé)/.test(note)) category = 'Đi lại';
      else if (/(sách|học|khóa học)/.test(note)) category = 'Học tập';
      else if (/(áo|quần|giày|mua sắm|shopee)/.test(note)) category = 'Mua sắm';
      else if (isIncome) category = 'Thu nhập';

      actions.push({
        action: 'add_transaction',
        domain: 'finance',
        description: isIncome
          ? `Ghi nhận thu nhập: +${val.toLocaleString('vi-VN')} đ (${category})`
          : `Ghi nhận chi tiêu: -${val.toLocaleString('vi-VN')} đ (${category} - ${note})`,
        data: {
          type: isIncome ? 'income' : 'expense',
          amount: val,
          category,
          note,
          wallet: 'Tiền mặt',
          date: new Date().toISOString().split('T')[0]
        }
      });
    }

    // 4. Work Task
    const taskMatch = text.match(/(?:thêm việc|tạo việc|nhiệm vụ|cần làm|nhắc tôi|lịch họp)\s+(.*?)(?:lúc|vào|ngày|hạn|priority|$)/i);
    if (taskMatch && !waterMatch && !moneyMatch && taskMatch[1].trim().length > 2) {
      const title = taskMatch[1].trim();
      const isUrgent = /(gấp|khẩn|quan trọng|urgent|high)/.test(text);
      actions.push({
        action: 'create_task',
        domain: 'work',
        description: `Tạo nhiệm vụ mới: "${title}"`,
        data: {
          title,
          domain: 'work',
          priority: isUrgent ? 'high' : 'medium',
          dueDate: new Date().toISOString().split('T')[0]
        }
      });
    }

    // 5. Flashcard / Learning
    const flashcardMatch = text.match(/(?:tạo flashcard|thêm thẻ|từ mới)\s+(.*?)\s*(?:nghĩa là|là|:)\s*(.*)/i);
    if (flashcardMatch) {
      actions.push({
        action: 'add_flashcard',
        domain: 'learning',
        description: `Tạo Flashcard: "${flashcardMatch[1].trim()}"`,
        data: {
          front: flashcardMatch[1].trim(),
          back: flashcardMatch[2].trim()
        }
      });
    }

    return actions;
  }

  // Automatic memory extraction for user habits and preferences
  private extractAutoMemories(userId: string, message: string, domain: Domain) {
    const text = message.toLowerCase();
    if (text.includes('tôi thích') || text.includes('mình thích')) {
      const match = text.match(/(?:tôi|mình)\s+thích\s+(.*?)(?:\.|$)/);
      if (match && match[1].length < 60) {
        this.memoryService.addMemory(userId, 'preference', `Sở thích (${domain})`, match[1].trim(), domain);
      }
    } else if (text.includes('mục tiêu của tôi') || text.includes('mục tiêu là')) {
      const match = text.match(/mục tiêu\s+(?:của tôi\s+)?(?:là\s+)?(.*?)(?:\.|$)/);
      if (match && match[1].length < 60) {
        this.memoryService.addMemory(userId, 'goal', `Mục tiêu (${domain})`, match[1].trim(), domain);
      }
    }
  }

  // Smart local generator for offline responsiveness
  private generateLocalResponse(
    message: string,
    domain: Domain,
    personalityId: AIPersonalityId,
    action: ActionPayload | null
  ): string {
    const personality = PERSONALITY_PRESETS[personalityId] || PERSONALITY_PRESETS.standard;
    const isStrict = personalityId === 'strict_coach';
    const isFriendly = personalityId === 'friendly';
    const isFunny = personalityId === 'funny';

    if (action) {
      if (isStrict) {
        return `⚡ **ĐÃ TIẾP NHẬN:** ${action.description}.\n\nTôi đã tạo Action Card để lưu ngay vào hệ thống. Hãy xác nhận bên dưới và bắt tay vào hoàn thành các mục tiêu còn lại ngay!`;
      }
      if (isFunny) {
        return `🎉 Tuyệt vời! ${action.description}.\n\nĐã ghi nhận vào sổ bộ nhớ OmniPlan rồi nhé! Bạn xác nhận thẻ bên dưới để chốt đơn luôn nè.`;
      }
      if (isFriendly) {
        return `Chào bạn! Mình đã nắm được thông tin: **${action.description}**.\n\nMình đã chuẩn bị sẵn thẻ thao tác bên dưới để bạn duyệt và lưu vào hệ thống nhé!`;
      }
      return `Tôi đã phân tích yêu cầu của bạn và chuẩn bị hành động: **${action.description}**.\n\nVui lòng nhấn **Xác nhận** trên thẻ hành động bên dưới để lưu vào hệ thống OmniPlan.`;
    }

    // Default conversational response by domain
    switch (domain) {
      case 'health':
        return `🌿 **Quản lý Sức khỏe & Thể trạng:**\n\nTôi có thể giúp bạn theo dõi:\n- Lượng nước uống hàng ngày (Ví dụ: *"uống 300ml nước"*)\n- Cân nặng & chỉ số BMI (Ví dụ: *"cân nặng 65kg"*)\n- Ghi nhận bữa ăn & calo (hoặc gửi ảnh món ăn để AI ước tính)\n\nBạn muốn ghi nhận chỉ số nào lúc này?`;
      case 'learning':
        return `📚 **Trợ lý Học tập & Kỹ năng:**\n\nTôi hỗ trợ bạn tối ưu hóa việc học qua:\n- Tạo Flashcard Spaced Repetition (Ví dụ: *"tạo thẻ từ mới: Pomodoro là kỹ thuật quản lý thời gian"*)\n- Lên lịch ôn tập Active Recall\n- Phân tích tài liệu PDF/Word học tập\n\nBạn đang muốn ôn tập môn học hay nội dung nào?`;
      case 'finance':
        return `💳 **Quản lý Tài chính Cá nhân:**\n\nTôi có thể giúp bạn:\n- Ghi nhận thu chi nhanh (Ví dụ: *"tiêu 45k ăn trưa"*, *"chi 500k tiền điện"*)\n- Quét và trích xuất hóa đơn từ ảnh chụp biên lai\n- Cảnh báo vượt ngân sách & tổng hợp báo cáo\n\nBạn có khoản thu/chi nào cần ghi sổ không?`;
      case 'work':
        return `💼 **Quản lý Công việc & Dự án:**\n\nTôi sẵn sàng hỗ trợ:\n- Tạo và phân loại nhiệm vụ ưu tiên (Ví dụ: *"thêm việc nộp báo cáo quý vào 17h"*)\n- Đề xuất phân bổ thời gian hợp lý\n- Tóm tắt cuộc họp từ file ghi âm\n\nBạn cần sắp xếp công việc gì hôm nay?`;
      default:
        return `Xin chào! Tôi là OmniPlan Life OS — Trợ lý AI toàn diện của bạn.\n\nTôi có thể hỗ trợ bạn trên cả 4 trụ cột cuộc sống:\n1. 🌿 **Sức khỏe**: Nước uống, cân nặng, dinh dưỡng, giấc ngủ\n2. 📚 **Học tập**: Lịch học, flashcards, giải bài tập\n3. 💼 **Công việc**: Nhiệm vụ, deadline, quản lý dự án\n4. 💳 **Tài chính**: Ghi chép chi tiêu, đọc hóa đơn, ngân sách\n\nBạn có thể nhắn tin bằng ngôn ngữ tự nhiên hoặc gửi file/hình ảnh/ghi âm bất kỳ lúc nào!`;
    }
  }
}
