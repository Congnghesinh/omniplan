import { AIPersonalityId, ChatMessage, ActionPayload, TaskItem, HealthRecord } from '../types/index.js';

const API_BASE = '/api';

export const ApiService = {
  // 1. Health
  async getHealthStatus() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // 2. User Profile
  async getUserProfile(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/user/profile?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async updateUserProfile(userId: string, updates: any) {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates })
    });
    return res.json();
  },

  // 3. Conversations
  async getConversations(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/conversations?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async createConversation(userId: string = 'default_user', title: string = 'Cuộc trò chuyện mới', personalityId: AIPersonalityId = 'standard') {
    const res = await fetch(`${API_BASE}/assistant/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, personalityId })
    });
    return res.json();
  },

  async updateConversation(convId: string, updates: any) {
    const res = await fetch(`${API_BASE}/assistant/conversations/${convId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteConversation(convId: string) {
    const res = await fetch(`${API_BASE}/assistant/conversations/${convId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getMessages(convId: string) {
    const res = await fetch(`${API_BASE}/assistant/conversations/${convId}/messages`);
    return res.json();
  },

  // 4. Chat
  async sendChatMessage(payload: {
    userId?: string;
    conversationId?: string;
    message: string;
    personalityId?: AIPersonalityId;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    attachments?: Array<any>;
  }) {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi gửi tin nhắn đến AI.');
    }
    return res.json();
  },

  // 5. Actions Execution & Undo
  async executeAction(actionId: string, payload: ActionPayload, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/actions/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, payload, userId })
    });
    return res.json();
  },

  async undoAction(actionId: string, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/actions/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, userId })
    });
    return res.json();
  },

  async getActionLogs(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/actions/logs?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  // 6. Personalities
  async getPersonalities() {
    const res = await fetch(`${API_BASE}/assistant/personalities`);
    return res.json();
  },

  async saveCustomPersonality(personality: any) {
    const res = await fetch(`${API_BASE}/assistant/personalities/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personality)
    });
    return res.json();
  },

  // 7. Memory Management
  async getMemories(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/memories?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async addMemory(memory: { userId?: string; type: string; key: string; value: string; domain?: string }) {
    const res = await fetch(`${API_BASE}/assistant/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory)
    });
    return res.json();
  },

  async toggleMemory(memoryId: string, active: boolean, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/memories/${memoryId}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, userId })
    });
    return res.json();
  },

  async deleteMemory(memoryId: string, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/memories/${memoryId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // 8. Multimodal Services
  async scanReceipt(base64Data: string, mimeType: string = 'image/jpeg') {
    const res = await fetch(`${API_BASE}/multimodal/vision/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType })
    });
    return res.json();
  },

  async scanFood(base64Data: string, mimeType: string = 'image/jpeg') {
    const res = await fetch(`${API_BASE}/multimodal/vision/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType })
    });
    return res.json();
  },

  async transcribeAudio(base64Audio: string, mimeType: string = 'audio/webm') {
    const res = await fetch(`${API_BASE}/multimodal/audio/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Audio, mimeType })
    });
    return res.json();
  },

  async analyzeDocument(fileName: string, contentText: string) {
    const res = await fetch(`${API_BASE}/multimodal/docs/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, contentText })
    });
    return res.json();
  },

  // 9. Zalo Bot Services
  async generateZaloLinkCode(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/zalo/link-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async getZaloStatus(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/zalo/status?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async unlinkZalo(zaloUserId: string) {
    const res = await fetch(`${API_BASE}/zalo/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zaloUserId })
    });
    return res.json();
  },

  async simulateZaloMessage(text: string, zaloUserId?: string) {
    const res = await fetch(`${API_BASE}/zalo/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, zaloUserId })
    });
    return res.json();
  },

  // 10. Proactive & Cross-Domain
  async getDailyBriefing(name: string = 'bạn') {
    const res = await fetch(`${API_BASE}/proactive/briefing?name=${encodeURIComponent(name)}`);
    return res.json();
  },

  async getNightReview(name: string = 'bạn') {
    const res = await fetch(`${API_BASE}/proactive/review?name=${encodeURIComponent(name)}`);
    return res.json();
  },

  async getCrossDomainInsights(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/assistant/cross-domain?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  // 11. Domain Data
  async getHealthRecords(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/health/records?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async logHealth(kind: string, data: any, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/health/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, kind, data })
    });
    return res.json();
  },

  async getTasks(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/work/tasks?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async createTask(task: { title: string; domain?: string; priority?: string; dueDate?: string }, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/work/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...task })
    });
    return res.json();
  },

  async updateTask(taskId: string, updates: Partial<TaskItem>, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/work/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates })
    });
    return res.json();
  },

  async deleteTask(taskId: string, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/work/tasks/${taskId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getTransactions(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/finance/transactions?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async addTransaction(tx: any, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/finance/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...tx })
    });
    return res.json();
  },

  async getBudgets(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/finance/budgets?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async getWallets(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/finance/wallets?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async getFlashcards(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/learning/flashcards?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async addFlashcard(front: string, back: string, subjectId: string = 'general', userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/learning/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, front, back, subjectId })
    });
    return res.json();
  },

  // 12. OmniSearch & OmniGoals
  async globalSearch(query: string, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async getGoals(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/goals?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  // 13. Feedback & Support Center
  async submitFeedback(payload: any) {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi gửi phản hồi.');
    }
    return res.json();
  },

  async getUserFeedbacks(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/feedback/my?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async getFeedbackDetail(feedbackId: string) {
    const res = await fetch(`${API_BASE}/feedback/${feedbackId}`);
    return res.json();
  },

  async replyFeedback(feedbackId: string, replyData: { senderId?: string; senderRole?: 'admin' | 'user'; senderName?: string; message: string }) {
    const res = await fetch(`${API_BASE}/feedback/${feedbackId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(replyData)
    });
    return res.json();
  },

  async getAdminFeedbacks(filters?: { status?: string; category?: string; priority?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE}/admin/feedbacks?${params.toString()}`);
    return res.json();
  },

  async updateAdminFeedback(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/admin/feedbacks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async mergeFeedbacks(targetId: string, sourceId: string) {
    const res = await fetch(`${API_BASE}/admin/feedbacks/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, sourceId })
    });
    return res.json();
  },

  async getWeeklyFeedbackDigest() {
    const res = await fetch(`${API_BASE}/admin/feedback-intelligence/weekly`);
    return res.json();
  },

  async getSimilarFeedbacks(feedbackId: string) {
    const res = await fetch(`${API_BASE}/admin/feedbacks/${feedbackId}/similar`);
    return res.json();
  },

  async getFeatureRequests() {
    const res = await fetch(`${API_BASE}/community/features`);
    return res.json();
  },

  async submitFeatureRequest(payload: { title: string; description: string; category?: string; module?: string; submittedBy?: string }) {
    const res = await fetch(`${API_BASE}/community/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async voteFeatureRequest(featureId: string, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/community/features/${featureId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async getChangelogs() {
    const res = await fetch(`${API_BASE}/community/changelogs`);
    return res.json();
  },

  async getUserBadges(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/user/badges?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async getNotifications(userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async markNotificationRead(notifId: string, userId: string = 'default_user') {
    const res = await fetch(`${API_BASE}/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  }
};
