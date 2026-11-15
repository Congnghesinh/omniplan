import { ActionType, ActionPayload, Domain } from '../../src/types/index.js';

export interface ToolDefinition {
  name: ActionType;
  domain: Domain;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export const OMNIPLAN_TOOLS: ToolDefinition[] = [
  // 1. Task & Work
  {
    name: 'create_task',
    domain: 'work',
    description: 'Tạo một nhiệm vụ hoặc công việc mới trong hệ thống',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Tiêu đề công việc' },
        domain: { type: 'string', enum: ['work', 'study', 'health', 'personal'], description: 'Lĩnh vực công việc' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Mức độ ưu tiên' },
        dueDate: { type: 'string', description: 'Hạn chót ngày định dạng YYYY-MM-DD' },
        dueTime: { type: 'string', description: 'Giờ hạn chót định dạng HH:mm' },
        estimateMinutes: { type: 'number', description: 'Thời gian ước tính hoàn thành (phút)' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_task',
    domain: 'work',
    description: 'Cập nhật trạng thái hoặc thông tin của một nhiệm vụ hiện có',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID của nhiệm vụ cần sửa' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done'], description: 'Trạng thái mới' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Ưu tiên mới' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'complete_task',
    domain: 'work',
    description: 'Đánh dấu hoàn thành một nhiệm vụ',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID của nhiệm vụ hoặc tên nhiệm vụ cần hoàn thành' }
      },
      required: ['taskId']
    }
  },

  // 2. Health
  {
    name: 'log_water',
    domain: 'health',
    description: 'Ghi nhận lượng nước uống của người dùng (ml)',
    parameters: {
      type: 'object',
      properties: {
        amountMl: { type: 'number', description: 'Số lượng nước đã uống tính bằng ml (ví dụ 250, 500)' },
        time: { type: 'string', description: 'Thời điểm uống' }
      },
      required: ['amountMl']
    }
  },
  {
    name: 'log_weight',
    domain: 'health',
    description: 'Ghi nhận cân nặng của người dùng (kg)',
    parameters: {
      type: 'object',
      properties: {
        weightKg: { type: 'number', description: 'Cân nặng đo được tính bằng kg (ví dụ: 65.5)' }
      },
      required: ['weightKg']
    }
  },
  {
    name: 'log_meal',
    domain: 'health',
    description: 'Ghi nhận bữa ăn và lượng calo dinh dưỡng tiêu thụ',
    parameters: {
      type: 'object',
      properties: {
        mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'], description: 'Bữa ăn nào' },
        foodName: { type: 'string', description: 'Tên món ăn hoặc thực phẩm' },
        calories: { type: 'number', description: 'Lượng calo ước tính (kcal)' },
        proteinG: { type: 'number', description: 'Protein (gam)' },
        carbsG: { type: 'number', description: 'Carb (gam)' },
        fatG: { type: 'number', description: 'Chất béo (gam)' }
      },
      required: ['foodName', 'calories']
    }
  },
  {
    name: 'create_workout_plan',
    domain: 'health',
    description: 'Ghi nhận hoặc lên lịch buổi tập thể dục',
    parameters: {
      type: 'object',
      properties: {
        workoutType: { type: 'string', description: 'Loại bài tập (chạy bộ, gym, bơi lội, yoga)' },
        durationMinutes: { type: 'number', description: 'Thời gian tập (phút)' },
        caloriesBurned: { type: 'number', description: 'Ước tính calo tiêu hao' }
      },
      required: ['workoutType', 'durationMinutes']
    }
  },

  // 3. Finance
  {
    name: 'add_transaction',
    domain: 'finance',
    description: 'Thêm giao dịch thu chi tài chính (tiền vào hoặc tiền ra)',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: 'Loại giao dịch: chi tiêu (expense) hoặc thu nhập (income)' },
        amount: { type: 'number', description: 'Số tiền bằng VNĐ (hoặc đơn vị tiền tệ người dùng)' },
        category: { type: 'string', description: 'Danh mục (Ăn uống, Đi lại, Học tập, Mua sắm, Lương, Khác)' },
        walletId: { type: 'string', description: 'Tên hoặc ID ví tiền (Tiền mặt, Ngân hàng, Ví MoMo)' },
        note: { type: 'string', description: 'Ghi chú giao dịch' },
        date: { type: 'string', description: 'Ngày giao dịch YYYY-MM-DD' }
      },
      required: ['type', 'amount', 'category']
    }
  },
  {
    name: 'set_budget',
    domain: 'finance',
    description: 'Thiết lập hạn mức ngân sách cho một danh mục chi tiêu',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Danh mục chi tiêu' },
        limitAmount: { type: 'number', description: 'Hạn mức chi tiêu tối đa' },
        period: { type: 'string', enum: ['weekly', 'monthly'], description: 'Kỳ hạn ngân sách' }
      },
      required: ['category', 'limitAmount']
    }
  },

  // 4. Learning
  {
    name: 'create_study_plan',
    domain: 'learning',
    description: 'Lên kế hoạch hoặc lịch học tập cho một môn học hay kỹ năng',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Nội dung cần học' },
        subjectName: { type: 'string', description: 'Tên môn học' },
        durationMinutes: { type: 'number', description: 'Thời lượng học (phút)' },
        technique: { type: 'string', enum: ['pomodoro', 'active_recall', 'spaced_repetition', 'normal'], description: 'Phương pháp học' },
        date: { type: 'string', description: 'Ngày học YYYY-MM-DD' }
      },
      required: ['title', 'durationMinutes']
    }
  },
  {
    name: 'add_flashcard',
    domain: 'learning',
    description: 'Tạo thẻ ghi nhớ Flashcard phục vụ ôn tập theo chu kỳ giãn cách',
    parameters: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Môn học' },
        front: { type: 'string', description: 'Mặt trước (câu hỏi hoặc thuật ngữ)' },
        back: { type: 'string', description: 'Mặt sau (đáp án hoặc giải thích)' }
      },
      required: ['front', 'back']
    }
  },

  // 5. Smart Reminder
  {
    name: 'create_reminder',
    domain: 'personal',
    description: 'Đặt lịch nhắc nhở thông minh cho người dùng',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Nội dung nhắc nhở' },
        time: { type: 'string', description: 'Thời điểm nhắc nhở (YYYY-MM-DD HH:mm)' },
        channel: { type: 'string', enum: ['app', 'zalo', 'both'], description: 'Kênh gửi thông báo' }
      },
      required: ['message', 'time']
    }
  }
];
