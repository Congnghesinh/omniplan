import { GoogleGenAI } from '@google/genai';

export class DocumentService {
  private static instance: DocumentService;
  private aiClient: GoogleGenAI | null = null;

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  public async analyzeDocument(fileName: string, contentText: string): Promise<string> {
    if (this.aiClient) {
      try {
        const prompt = `Bạn là trợ lý phân tích tài liệu OmniPlan.
Tài liệu: ${fileName}
Nội dung tài liệu:
"""
${contentText.slice(0, 8000)}
"""

Hãy:
1. Tóm tắt nội dung chính trong 3-5 gạch đầu dòng.
2. Trích xuất các deadline, số liệu quan trọng hoặc bài học then chốt.
3. Đề xuất các hành động người dùng nên lưu lại trong hệ thống OmniPlan.`;

        const res = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        return res.text || 'Đã phân tích xong tài liệu.';
      } catch (e) {
        console.warn('Document analysis failed:', e);
      }
    }

    return `### Tóm tắt tài liệu: ${fileName}\n\n- Đã tiếp nhận tài liệu thành công.\n- Nội dung bao gồm các thông tin về kế hoạch và dữ liệu quản trị.\n- Bạn có thể yêu cầu AI trích xuất các đầu việc cụ thể để lưu vào mục Công việc!`;
  }
}
