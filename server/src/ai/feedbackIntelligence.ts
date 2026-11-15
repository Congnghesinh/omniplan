import { GoogleGenAI } from '@google/genai';
import { FeedbackItem, FeedbackPriority } from '../../src/types/index.js';

export interface FeedbackAIAnalysis {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestedCategory: string;
  suggestedPriority: FeedbackPriority;
  keyThemes: string[];
}

export interface WeeklyFeedbackDigest {
  totalFeedbacks: number;
  averageSatisfaction: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topProblemModules: Array<{ module: string; count: number; commonIssue: string }>;
  topRequestedFeatures: Array<{ title: string; votes: number }>;
  executiveSummary: string;
  recommendedActions: string[];
}

export class FeedbackIntelligenceService {
  private static instance: FeedbackIntelligenceService;
  private aiClient: GoogleGenAI | null = null;

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  public static getInstance(): FeedbackIntelligenceService {
    if (!FeedbackIntelligenceService.instance) {
      FeedbackIntelligenceService.instance = new FeedbackIntelligenceService();
    }
    return FeedbackIntelligenceService.instance;
  }

  // 1. Phân tích nội dung phản hồi đơn lẻ (Auto triage & sentiment)
  public async analyzeFeedback(title: string, content: string, module: string): Promise<FeedbackAIAnalysis> {
    if (this.aiClient) {
      try {
        const prompt = `Bạn là trợ lý AI phân tích phản hồi người dùng cho ứng dụng OmniPlan Beta.
Tiêu đề: "${title}"
Nội dung: "${content}"
Module: "${module}"

Hãy phân tích và trả về đúng định dạng JSON sau:
{
  "summary": "Tóm tắt ngắn gọn 1-2 câu",
  "sentiment": "positive" | "neutral" | "negative",
  "suggestedCategory": "Báo lỗi" | "Đề xuất tính năng" | "Góp ý giao diện" | "Đồng bộ Zalo" | "Hiệu suất" | "Khác",
  "suggestedPriority": "critical" | "high" | "medium" | "low",
  "keyThemes": ["từ_khóa_1", "từ_khóa_2"]
}
Chỉ trả về JSON thuần, không kèm markdown backticks.`;

        const res = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = (res.text || '').replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || content.slice(0, 120),
          sentiment: parsed.sentiment || 'neutral',
          suggestedCategory: parsed.suggestedCategory || 'Khác',
          suggestedPriority: parsed.suggestedPriority || 'medium',
          keyThemes: parsed.keyThemes || [module]
        };
      } catch (e) {
        console.warn('Gemini feedback intelligence failed, using smart rule-based fallback:', e);
      }
    }

    // Smart Deterministic Fallback
    const text = (title + ' ' + content).toLowerCase();
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (/(tuyệt vời|rất thích|hài lòng|cảm ơn|hay|tốt|nhanh)/.test(text)) {
      sentiment = 'positive';
    } else if (/(lỗi|hỏng|crash|không chạy|chậm|treo|mất dữ liệu|sai)/.test(text)) {
      sentiment = 'negative';
    }

    let suggestedPriority: FeedbackPriority = 'medium';
    if (/(crash|mất dữ liệu|không đăng nhập|bảo mật|lộ thông tin|nghiêm trọng)/.test(text)) {
      suggestedPriority = 'critical';
    } else if (/(lỗi|không đồng bộ|không nhận|chậm|treo)/.test(text)) {
      suggestedPriority = 'high';
    } else if (/(giao diện|màu sắc|đề xuất|thêm nút|thêm tính năng)/.test(text)) {
      suggestedPriority = 'low';
    }

    return {
      summary: content.length > 90 ? content.slice(0, 90) + '...' : content,
      sentiment,
      suggestedCategory: text.includes('lỗi') ? 'Báo lỗi' : text.includes('tính năng') ? 'Đề xuất tính năng' : 'Góp ý chung',
      suggestedPriority,
      keyThemes: [module, sentiment]
    };
  }

  // 2. Tìm kiếm phản hồi tương tự (Duplicate/Similarity Clustering)
  public findSimilarFeedbacks(target: FeedbackItem, all: FeedbackItem[]): Array<{ feedback: FeedbackItem; similarity: number }> {
    const targetWords = (target.title + ' ' + target.content).toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const results: Array<{ feedback: FeedbackItem; similarity: number }> = [];

    for (const item of all) {
      if (item.id === target.id) continue;
      if (item.module !== target.module && item.category !== target.category) continue;

      const words = (item.title + ' ' + item.content).toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let matchCount = 0;
      for (const tw of targetWords) {
        if (words.includes(tw)) matchCount++;
      }

      const score = Math.round((matchCount / Math.max(targetWords.length, words.length)) * 100);
      if (score >= 30) {
        results.push({ feedback: item, similarity: score });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  // 3. Tạo báo cáo phản hồi hàng tuần (Weekly Feedback Digest)
  public generateWeeklyDigest(feedbacks: FeedbackItem[], featureRequests: any[]): WeeklyFeedbackDigest {
    const totalFeedbacks = feedbacks.length;
    const avgRating = totalFeedbacks > 0
      ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1))
      : 5.0;

    let pos = 0, neu = 0, neg = 0;
    const moduleCounts: Record<string, { count: number; issues: string[] }> = {};

    for (const f of feedbacks) {
      const s = f.aiAnalysis?.sentiment || (f.rating >= 4 ? 'positive' : f.rating <= 2 ? 'negative' : 'neutral');
      if (s === 'positive') pos++;
      else if (s === 'negative') neg++;
      else neu++;

      const m = f.module || 'Hệ thống';
      if (!moduleCounts[m]) moduleCounts[m] = { count: 0, issues: [] };
      moduleCounts[m].count++;
      if (f.title) moduleCounts[m].issues.push(f.title);
    }

    const topModules = Object.entries(moduleCounts)
      .map(([module, data]) => ({
        module,
        count: data.count,
        commonIssue: data.issues.slice(0, 2).join('; ') || 'Các phản hồi chung'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topFeatures = [...featureRequests]
      .sort((a, b) => b.votesCount - a.votesCount)
      .slice(0, 3)
      .map(f => ({ title: f.title, votes: f.votesCount }));

    return {
      totalFeedbacks,
      averageSatisfaction: avgRating,
      sentimentBreakdown: { positive: pos, neutral: neu, negative: neg },
      topProblemModules: topModules,
      topRequestedFeatures: topFeatures,
      executiveSummary: `Trong đợt Beta này, OmniPlan ghi nhận ${totalFeedbacks} lượt phản hồi với điểm hài lòng trung bình ${avgRating}/5 sao. ` +
        `Người dùng đánh giá cao tính tiện dụng của đồng bộ Zalo Bot và trợ lý AI, đồng thời mong muốn bổ sung đồng bộ Google Calendar 2 chiều và mở rộng nhận diện biên lai.`,
      recommendedActions: [
        'Ưu tiên hoàn thiện tính năng Đồng bộ 2 chiều Google Calendar & Outlook.',
        'Tối ưu tốc độ xử lý OCR hóa đơn trong module Tài chính.',
        'Đưa huy hiệu Beta Tester cho các thành viên tích cực đóng góp.'
      ]
    };
  }
}

