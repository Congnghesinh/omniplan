import { DBService } from '../db/dbService.js';
import { Domain } from '../../src/types/index.js';

export interface CrossDomainInsight {
  id: string;
  title: string;
  summary: string;
  domains: Domain[];
  severity: 'info' | 'warning' | 'alert';
  recommendations: string[];
}

export class CrossDomainService {
  private static instance: CrossDomainService;
  private db: DBService;

  private constructor() {
    this.db = DBService.getInstance();
  }

  public static getInstance(): CrossDomainService {
    if (!CrossDomainService.instance) {
      CrossDomainService.instance = new CrossDomainService();
    }
    return CrossDomainService.instance;
  }

  public analyzeUserSituation(userId: string = 'default_user'): CrossDomainInsight[] {
    const insights: CrossDomainInsight[] = [];
    const today = new Date().toISOString().split('T')[0];

    const tasks = this.db.getTasks(userId);
    const health = this.db.getHealthRecords(userId);
    const transactions = this.db.getTransactions(userId);
    const budgets = this.db.getBudgets(userId);

    // 1. Health vs Work Balance
    // Check if tasks are heavy (many urgent or overdue tasks) and water intake is low
    const todayWater = health
      .filter(h => h.kind === 'water' && h.timestamp.startsWith(today))
      .reduce((sum, h) => sum + (h.data.waterMl || 0), 0);
    const urgentTasks = tasks.filter(t => t.status !== 'done' && (t.priority === 'high' || t.priority === 'urgent'));

    if (urgentTasks.length >= 2 && todayWater < 1000) {
      insights.push({
        id: `cd_${Date.now()}_hw`,
        title: 'Cân bằng Công việc & Nạp năng lượng',
        summary: `Bạn đang có ${urgentTasks.length} nhiệm vụ quan trọng cần xử lý hôm nay nhưng mới uống ${todayWater}ml nước (mục tiêu 2000ml).`,
        domains: ['health', 'work'],
        severity: 'warning',
        recommendations: [
          'Uống ngay 1 cốc nước 300ml trước khi bắt đầu phiên làm việc tiếp theo.',
          'Áp dụng quy tắc Pomodoro: nghỉ 5 phút vận động nhẹ sau mỗi 25 phút tập trung.'
        ]
      });
    }

    // 2. Finance vs Health
    // Check if eating out expense is taking large portion of daily budget
    const foodExpenses = transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase().includes('ăn') && t.date === today)
      .reduce((sum, t) => sum + t.amount, 0);

    const foodBudget = budgets.find(b => b.category.toLowerCase().includes('ăn'));
    if (foodExpenses > 150000) {
      insights.push({
        id: `cd_${Date.now()}_fh`,
        title: 'Tối ưu Chi phí Ăn uống & Dinh dưỡng',
        summary: `Hôm nay bạn đã chi ${foodExpenses.toLocaleString('vi-VN')} đ cho ăn uống bên ngoài.`,
        domains: ['finance', 'health'],
        severity: 'info',
        recommendations: [
          'Chuẩn bị bữa ăn tại nhà (meal prep) vừa giúp tiết kiệm ngân sách vừa kiểm soát calo và lượng muối tốt hơn.',
          'Đặt hạn mức chi tiêu ăn uống ngày mai dưới 100,000 đ để cân bằng ngân sách tuần.'
        ]
      });
    }

    // 3. Learning vs Work Schedule
    const studyTasks = tasks.filter(t => t.domain === 'learning' && t.status !== 'done');
    const flashcardsDue = this.db.getFlashcards(userId).filter(fc => fc.nextReviewDate <= today);

    if (flashcardsDue.length > 0 && urgentTasks.length > 0) {
      insights.push({
        id: `cd_${Date.now()}_lw`,
        title: 'Phân bổ Lịch trình Học tập & Công việc',
        summary: `Bạn có ${flashcardsDue.length} thẻ ghi nhớ cần ôn tập Spaced Repetition hôm nay và ${urgentTasks.length} việc gấp.`,
        domains: ['learning', 'work'],
        severity: 'info',
        recommendations: [
          'Dành 15 phút ôn nhanh flashcards vào khung giờ nghỉ giải lao 16:30 hoặc trước khi đi ngủ.',
          'Xử lý dứt điểm nhiệm vụ công việc ưu tiên trước 17:00 để giữ tâm trí thoải mái buổi tối.'
        ]
      });
    }

    return insights;
  }
}
