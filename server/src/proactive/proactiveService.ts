import { ProactiveReport } from '../../src/types/index.js';

export class ProactiveService {
  private static instance: ProactiveService;

  private constructor() {}

  public static getInstance(): ProactiveService {
    if (!ProactiveService.instance) {
      ProactiveService.instance = new ProactiveService();
    }
    return ProactiveService.instance;
  }

  // 1. Daily Briefing (Sáng sớm: Tổng hợp lịch trình & Mục tiêu ngày)
  public generateDailyBriefing(userName: string = 'bạn'): ProactiveReport {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `briefing_${today}`,
      userId: 'current_user',
      type: 'daily_briefing',
      date: today,
      content: `🌅 **CHÀO BUỔI SÁNG, ${userName.toUpperCase()}! BẢN TIN KHỞI ĐẦU NGÀY MỚI:**\n\n` +
        `• **Mục tiêu ưu tiên hôm nay:** Tập trung xử lý 2 công việc quan trọng trước 12h.\n` +
        `• **Sức khỏe:** Đặt mục tiêu uống đủ 2L nước, duy trì vận động ít nhất 20 phút.\n` +
        `• **Tài chính:** Ngân sách chi tiêu sinh hoạt hôm nay khuyến nghị dưới 200,000 đ.\n` +
        `• **Học tập:** Lên lịch ôn tập 1 phiên Pomodoro (25 phút) vào buổi tối.`,
      highlights: {
        healthSummary: 'Uống 1 cốc nước ấm ngay sau khi thức dậy để kích hoạt tuần hoàn.',
        learningProgress: '1 phiên Pomodoro ôn tập từ vựng/bài tập.',
        workPriorities: ['Hoàn thành báo cáo tiến độ', 'Kiểm tra email công việc'],
        financialNotice: 'Duy trì chi tiêu trong hạn mức ngân sách ngày.'
      }
    };
  }

  // 2. Night Review (Cuối ngày: Đánh giá & tổng kết hoạt động)
  public generateNightReview(userName: string = 'bạn'): ProactiveReport {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `review_${today}`,
      userId: 'current_user',
      type: 'night_review',
      date: today,
      content: `🌙 **TỔNG KẾT NGÀY HÔM NAY CỦA ${userName.toUpperCase()}:**\n\n` +
        `• **Nhiệm vụ:** Bạn đã hoàn thành xuất sắc các mục tiêu quan trọng đã đề ra.\n` +
        `• **Lượng nước:** Ghi nhận 1,800 / 2,000 ml nước (Đạt 90% mục tiêu).\n` +
        `• **Chi tiêu:** Tổng chi hôm nay là 125,000 đ (An toàn trong ngân sách).\n` +
        `• **Khuyến nghị:** Hãy thư giãn, hạn chế ánh sáng xanh từ màn hình để có giấc ngủ sâu nhé!`,
      highlights: {
        healthSummary: 'Đạt 90% mục tiêu nước uống. Giấc ngủ khuyến nghị trước 23:00.',
        learningProgress: 'Đã hoàn thành phiên ôn tập theo kế hoạch.',
        workPriorities: ['Chuẩn bị danh sách việc ngày mai'],
        financialNotice: 'Chi tiêu hôm nay kiểm soát rất tốt.'
      }
    };
  }
}
