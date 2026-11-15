import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { AIOrchestrator } from './ai/orchestrator.js';
import { PERSONALITY_PRESETS } from './ai/personality.js';
import { MemoryService } from './ai/memory.js';
import { VisionService } from './multimodal/visionService.js';
import { AudioService } from './multimodal/audioService.js';
import { DocumentService } from './multimodal/docService.js';
import { ZaloBotService } from './zalo/zaloBotService.js';
import { ProactiveService } from './proactive/proactiveService.js';
import { CrossDomainService } from './ai/crossDomainService.js';
import { DBService } from './db/dbService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// Singletons
const db = DBService.getInstance();
const orchestrator = AIOrchestrator.getInstance();
const memoryService = MemoryService.getInstance();
const visionService = VisionService.getInstance();
const audioService = AudioService.getInstance();
const docService = DocumentService.getInstance();
const zaloBot = ZaloBotService.getInstance();
const proactiveService = ProactiveService.getInstance();
const crossDomainService = CrossDomainService.getInstance();

// ==========================================
// 1. HEALTH CHECK & SYSTEM STATUS
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'OmniPlan Life OS Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. USER PROFILE & PREFERENCES
// ==========================================
app.get('/api/user/profile', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const profile = db.getUserProfile(userId);
  res.json(profile);
});

app.put('/api/user/profile', (req: Request, res: Response) => {
  const userId = (req.body.userId as string) || 'default_user';
  const updated = db.updateUserProfile(userId, req.body);
  res.json(updated);
});

// ==========================================
// 3. CONVERSATIONS & CHAT SESSIONS
// ==========================================
app.get('/api/assistant/conversations', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const convs = db.getConversations(userId);
  res.json(convs);
});

app.post('/api/assistant/conversations', (req: Request, res: Response) => {
  const { userId = 'default_user', title = 'Cuộc trò chuyện mới', personalityId = 'standard' } = req.body;
  const session = db.createConversation(userId, title, personalityId);
  res.json(session);
});

app.put('/api/assistant/conversations/:id', (req: Request, res: Response) => {
  const updated = db.updateConversation(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện' });
  res.json(updated);
});

app.delete('/api/assistant/conversations/:id', (req: Request, res: Response) => {
  const ok = db.deleteConversation(req.params.id);
  res.json({ success: ok });
});

app.get('/api/assistant/conversations/:id/messages', (req: Request, res: Response) => {
  const messages = db.getMessages(req.params.id);
  res.json(messages);
});

// ==========================================
// 4. AI ASSISTANT CHAT
// ==========================================
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const {
      userId = 'default_user',
      conversationId,
      message,
      personalityId = 'standard',
      conversationHistory,
      attachments
    } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Tin nhắn không được để trống.' });
    }

    // Process with orchestrator
    const result = await orchestrator.processRequest({
      userId,
      message: message || '',
      personalityId,
      conversationHistory,
      attachments,
      source: 'app',
      conversationId,
      currentDate: new Date().toISOString().split('T')[0],
      currentTime: new Date().toTimeString().slice(0, 5)
    });

    // Save message to conversation if conversationId is provided
    if (conversationId) {
      // User message
      db.addMessage(conversationId, {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: message || '[Tệp đính kèm]',
        timestamp: new Date().toISOString(),
        source: 'app',
        domain: result.domain,
        attachments: attachments || []
      });

      // Assistant message
      db.addMessage(conversationId, {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString(),
        source: 'app',
        domain: result.domain,
        actions: result.actions
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/assistant/chat:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý yêu cầu AI.' });
  }
});

// ==========================================
// 5. ACTION EXECUTION & UNDO
// ==========================================
app.post('/api/assistant/actions/execute', (req: Request, res: Response) => {
  try {
    const { actionId, payload, userId = 'default_user' } = req.body;
    if (!payload || !payload.action) {
      return res.status(400).json({ error: 'Thiếu dữ liệu hành động.' });
    }

    // Execute into respective database table
    switch (payload.action) {
      case 'log_water':
        db.addHealthRecord(userId, 'water', { waterMl: payload.data.amountMl });
        break;
      case 'log_weight':
        db.addHealthRecord(userId, 'weight', { weightKg: payload.data.weightKg, bmi: 21.5 });
        break;
      case 'log_meal':
        db.addHealthRecord(userId, 'meal', {
          foodName: payload.data.foodName,
          calories: payload.data.calories,
          mealType: payload.data.mealType || 'lunch'
        });
        break;
      case 'add_transaction':
        db.addTransaction(userId, {
          type: payload.data.type || 'expense',
          amount: payload.data.amount,
          category: payload.data.category || 'Khác',
          wallet: payload.data.wallet || 'Tiền mặt',
          date: payload.data.date || new Date().toISOString().split('T')[0],
          note: payload.data.note || 'Tạo bởi AI'
        });
        break;
      case 'set_budget':
        db.setBudget(userId, payload.data.category, payload.data.limitAmount, payload.data.period || 'monthly');
        break;
      case 'create_task':
        db.addTask(userId, {
          title: payload.data.title,
          domain: payload.data.domain || 'work',
          priority: payload.data.priority || 'medium',
          status: 'todo',
          dueDate: payload.data.dueDate || new Date().toISOString().split('T')[0]
        });
        break;
      case 'complete_task':
        if (payload.data.taskId) {
          db.updateTask(userId, payload.data.taskId, { status: 'done' });
        }
        break;
      case 'add_flashcard':
        db.addFlashcard(userId, payload.data.front, payload.data.back);
        break;
    }

    const log = db.logAction(userId, payload.action, payload.domain, payload.description, payload.data);

    res.json({
      success: true,
      actionId,
      status: 'executed',
      message: `Đã thực hiện thành công: ${payload.description}`,
      logItem: log,
      executedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assistant/actions/undo', (req: Request, res: Response) => {
  const { actionId, userId = 'default_user' } = req.body;
  const result = db.undoAction(actionId, userId);
  res.json(result);
});

app.get('/api/assistant/actions/logs', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const logs = db.getActionLogs(userId);
  res.json(logs);
});

// ==========================================
// 6. PERSONALITIES
// ==========================================
app.get('/api/assistant/personalities', (req: Request, res: Response) => {
  res.json({
    presets: db.getPersonalities()
  });
});

app.post('/api/assistant/personalities/custom', (req: Request, res: Response) => {
  const custom = req.body;
  if (!custom || !custom.id) {
    return res.status(400).json({ error: 'Dữ liệu tính cách không hợp lệ' });
  }
  const saved = db.savePersonality(custom);
  res.json(saved);
});

// ==========================================
// 7. MEMORY MANAGEMENT
// ==========================================
app.get('/api/assistant/memories', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const memories = db.getMemories(userId);
  res.json({ memories });
});

app.post('/api/assistant/memories', (req: Request, res: Response) => {
  const { userId = 'default_user', type, key, value, domain } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Key và Value của trí nhớ là bắt buộc.' });
  }
  const item = db.addMemory(userId, {
    userId,
    type: type || 'preference',
    key,
    value,
    domain: domain || 'personal',
    confidence: 0.95,
    active: true
  });
  res.json({ success: true, memory: item });
});

app.put('/api/assistant/memories/:id/toggle', (req: Request, res: Response) => {
  const userId = (req.body.userId as string) || 'default_user';
  const { active } = req.body;
  const ok = db.toggleMemory(userId, req.params.id, active);
  res.json({ success: ok });
});

app.delete('/api/assistant/memories/:id', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const memoryId = req.params.id;
  db.deleteMemory(userId, memoryId);
  res.json({ success: true });
});

// ==========================================
// 8. MULTIMODAL PROCESSING (VISION, AUDIO, DOCS)
// ==========================================
app.post('/api/multimodal/vision/receipt', async (req: Request, res: Response) => {
  try {
    const { base64Data, mimeType = 'image/jpeg' } = req.body;
    if (!base64Data) return res.status(400).json({ error: 'Cần cung cấp dữ liệu hình ảnh.' });
    const result = await visionService.analyzeReceipt(base64Data, mimeType);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/multimodal/vision/food', async (req: Request, res: Response) => {
  try {
    const { base64Data, mimeType = 'image/jpeg' } = req.body;
    if (!base64Data) return res.status(400).json({ error: 'Cần cung cấp dữ liệu hình ảnh.' });
    const result = await visionService.analyzeFood(base64Data, mimeType);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/multimodal/audio/transcribe', async (req: Request, res: Response) => {
  try {
    const { base64Audio, mimeType = 'audio/webm' } = req.body;
    if (!base64Audio) return res.status(400).json({ error: 'Cần cung cấp dữ liệu âm thanh.' });
    const result = await audioService.transcribeAudio(base64Audio, mimeType);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/multimodal/docs/analyze', async (req: Request, res: Response) => {
  try {
    const { fileName, contentText } = req.body;
    if (!contentText) return res.status(400).json({ error: 'Tài liệu không có nội dung văn bản.' });
    const result = await docService.analyzeDocument(fileName || 'tailieu.txt', contentText);
    res.json({ summary: result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// 9. ZALO BOT INTEGRATION (LINKING & WEBHOOK)
// ==========================================
app.post('/api/zalo/link-code', (req: Request, res: Response) => {
  const { userId = 'default_user' } = req.body;
  const result = zaloBot.generateLinkCode(userId);
  res.json(result);
});

app.get('/api/zalo/status', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const conn = db.getZaloConnectionByUserId(userId);
  res.json({
    linked: !!conn,
    connection: conn || null
  });
});

app.post('/api/zalo/unlink', (req: Request, res: Response) => {
  const { zaloUserId } = req.body;
  if (!zaloUserId) return res.status(400).json({ error: 'Thiếu zaloUserId' });
  const ok = zaloBot.unlinkAccount(zaloUserId);
  res.json({ success: ok });
});

// Zalo Official Webhook challenge verification (GET)
app.get('/api/zalo/webhook', (req: Request, res: Response) => {
  const challenge = req.query.challenge;
  if (challenge) {
    return res.send(challenge);
  }
  res.send('Zalo Bot Webhook is Active');
});

// Zalo Official Webhook receiver (POST)
app.post('/api/zalo/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log('Received Zalo Bot Webhook Event:', JSON.stringify(event));
    const result = await zaloBot.handleWebhookEvent(event);
    res.json({
      status: 'success',
      ...result
    });
  } catch (e: any) {
    console.error('Zalo Webhook Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Simulation endpoint for live testing in UI without external webhook setup
app.post('/api/zalo/simulate', async (req: Request, res: Response) => {
  try {
    const { zaloUserId = 'zalo_test_user_01', text, messageType = 'user_send_text' } = req.body;
    const fakeEvent: any = {
      sender: { id: zaloUserId },
      recipient: { id: 'omniplan_bot' },
      event_name: messageType,
      message: {
        msg_id: `sim_${Date.now()}`,
        text
      },
      timestamp: Date.now()
    };
    const result = await zaloBot.handleWebhookEvent(fakeEvent);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// 10. PROACTIVE AI & CROSS-DOMAIN INTELLIGENCE
// ==========================================
app.get('/api/proactive/briefing', (req: Request, res: Response) => {
  const name = (req.query.name as string) || 'bạn';
  const briefing = proactiveService.generateDailyBriefing(name);
  res.json(briefing);
});

app.get('/api/proactive/review', (req: Request, res: Response) => {
  const name = (req.query.name as string) || 'bạn';
  const review = proactiveService.generateNightReview(name);
  res.json(review);
});

app.get('/api/assistant/cross-domain', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const insights = crossDomainService.analyzeUserSituation(userId);
  res.json({ insights });
});

// ==========================================
// 11. FOUR LIFE OS DOMAINS CRUD
// ==========================================
// Health
app.get('/api/health/records', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  res.json(db.getHealthRecords(userId));
});

app.post('/api/health/records', (req: Request, res: Response) => {
  const { userId = 'default_user', kind, data } = req.body;
  const record = db.addHealthRecord(userId, kind, data);
  res.json(record);
});

// Work
app.get('/api/work/tasks', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  res.json(db.getTasks(userId));
});

app.post('/api/work/tasks', (req: Request, res: Response) => {
  const { userId = 'default_user', title, domain = 'work', priority = 'medium', dueDate } = req.body;
  const task = db.addTask(userId, {
    title,
    domain,
    priority,
    status: 'todo',
    dueDate: dueDate || new Date().toISOString().split('T')[0]
  });
  res.json(task);
});

app.put('/api/work/tasks/:id', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const updated = db.updateTask(userId, req.params.id, req.body);
  res.json(updated);
});

app.delete('/api/work/tasks/:id', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const ok = db.deleteTask(userId, req.params.id);
  res.json({ success: ok });
});

// Finance
app.get('/api/finance/transactions', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  res.json(db.getTransactions(userId));
});

app.post('/api/finance/transactions', (req: Request, res: Response) => {
  const { userId = 'default_user', type, amount, category, wallet, date, note } = req.body;
  const tx = db.addTransaction(userId, {
    type,
    amount,
    category,
    wallet: wallet || 'Tiền mặt',
    date: date || new Date().toISOString().split('T')[0],
    note
  });
  res.json(tx);
});

app.get('/api/finance/budgets', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  res.json(db.getBudgets(userId));
});

app.get('/api/finance/wallets', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  res.json(db.getWallets(userId));
});

// Learning
app.get('/api/learning/flashcards', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  res.json(db.getFlashcards(userId));
});

app.post('/api/learning/flashcards', (req: Request, res: Response) => {
  const { userId = 'default_user', front, back, subjectId = 'general' } = req.body;
  const card = db.addFlashcard(userId, front, back, subjectId);
  res.json(card);
});

// ==========================================
// 12. OMNISEARCH & OMNIGOALS
// ==========================================
app.get('/api/search', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const q = ((req.query.q as string) || '').toLowerCase().trim();

  if (!q) {
    return res.json({ tasks: [], transactions: [], flashcards: [], memories: [] });
  }

  const tasks = db.getTasks(userId).filter(t => t.title.toLowerCase().includes(q));
  const transactions = db.getTransactions(userId).filter(t =>
    (t.note || '').toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
  );
  const flashcards = db.getFlashcards(userId).filter(f =>
    f.front.toLowerCase().includes(q) || f.back.toLowerCase().includes(q)
  );
  const memories = db.getMemories(userId).filter(m =>
    m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
  );

  res.json({ tasks, transactions, flashcards, memories });
});

app.get('/api/goals', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const profile = db.getUserProfile(userId);
  const memories = db.getMemories(userId).filter(m => m.type === 'goal');
  const budgets = db.getBudgets(userId);

  res.json({
    healthGoals: {
      waterGoalMl: profile.waterGoalMl,
      calorieGoal: profile.calorieGoal
    },
    financialGoals: budgets.map(b => ({
      category: b.category,
      targetLimit: b.limitAmount,
      spent: b.spentAmount
    })),
    customGoals: memories
  });
});

app.listen(PORT, () => {
  console.log(`🚀 OmniPlan Life OS Backend is running on http://localhost:${PORT}`);
});
