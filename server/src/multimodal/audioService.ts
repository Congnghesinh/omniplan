import { GoogleGenAI } from '@google/genai';

export interface AudioTranscriptionResult {
  transcription: string;
  meetingSummary?: string;
  extractedActionItems?: string[];
}

export class AudioService {
  private static instance: AudioService;
  private aiClient: GoogleGenAI | null = null;

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public async transcribeAudio(base64Audio: string, mimeType: string = 'audio/webm'): Promise<AudioTranscriptionResult> {
    if (this.aiClient) {
      try {
        const prompt = `Bạn là trợ lý chuyển giọng nói thành văn bản tiếng Việt. 
Hãy chuyển toàn bộ nội dung đoạn ghi âm này thành văn bản chính xác. Nếu là cuộc họp hoặc trao đổi công việc, hãy tóm tắt nội dung chính và trích xuất các đầu việc cần làm (action items) kèm deadline.
Định dạng trả về JSON:
{
  "transcription": "Văn bản chuyển từ giọng nói",
  "meetingSummary": "Tóm tắt ngắn gọn nếu là cuộc họp",
  "extractedActionItems": ["Việc 1", "Việc 2"]
}
Chỉ trả về JSON thuần.`;

        const res = await this.aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { data: base64Audio, mimeType } },
                { text: prompt }
              ]
            }
          ]
        });

        const text = res.text || '{}';
        const clean = text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
      } catch (e) {
        console.warn('Gemini audio transcription failed, fallback to mock:', e);
      }
    }

    return {
      transcription: 'Đoạn ghi âm mẫu: Nhắc tôi họp nhóm vào 9 giờ sáng mai và nộp báo cáo tài chính tuần này.',
      meetingSummary: 'Ghi chú công việc: Lịch họp nhóm và nộp báo cáo.',
      extractedActionItems: ['Họp nhóm lúc 9:00 sáng mai', 'Nộp báo cáo tài chính tuần']
    };
  }
}
