import { AIMemoryItem, Domain, MemoryType } from '../../src/types/index.js';

export class MemoryService {
  private static instance: MemoryService;
  // In-memory cache for speed, persistent via Firestore
  private userMemories: Map<string, AIMemoryItem[]> = new Map();

  private constructor() {}

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  public getMemoriesForUser(userId: string): AIMemoryItem[] {
    return this.userMemories.get(userId) || [];
  }

  public getActiveMemoriesByDomain(userId: string, domain?: Domain): AIMemoryItem[] {
    const list = this.getMemoriesForUser(userId).filter(m => m.active);
    if (!domain) return list;
    return list.filter(m => m.domain === domain || m.domain === 'personal');
  }

  public addMemory(
    userId: string,
    type: MemoryType,
    key: string,
    value: string,
    domain: Domain = 'personal',
    confidence: number = 0.9
  ): AIMemoryItem {
    const list = this.getMemoriesForUser(userId);
    const existingIndex = list.findIndex(m => m.key.toLowerCase() === key.toLowerCase());

    const item: AIMemoryItem = {
      id: existingIndex >= 0 ? list[existingIndex].id : `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type,
      key,
      value,
      confidence,
      domain,
      active: true,
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.push(item);
    }

    this.userMemories.set(userId, list);
    return item;
  }

  public toggleMemory(userId: string, memoryId: string, active: boolean): boolean {
    const list = this.getMemoriesForUser(userId);
    const item = list.find(m => m.id === memoryId);
    if (!item) return false;
    item.active = active;
    item.updatedAt = new Date().toISOString();
    return true;
  }

  public deleteMemory(userId: string, memoryId: string): boolean {
    const list = this.getMemoriesForUser(userId);
    const nextList = list.filter(m => m.id !== memoryId);
    this.userMemories.set(userId, nextList);
    return true;
  }

  public formatMemoriesForPrompt(userId: string, targetDomain?: Domain): string {
    const memories = this.getActiveMemoriesByDomain(userId, targetDomain);
    if (!memories.length) return '';

    return `\n[THÔNG TIN TRÍ NHỚ ĐÃ LƯU CỦA NGƯỜI DÙNG]\n` +
      memories.map(m => `- [${m.type.toUpperCase()} / ${m.domain.toUpperCase()}] ${m.key}: ${m.value}`).join('\n') +
      `\n[LƯU Ý]: Ưu tiên sử dụng các thông tin thực tế này để cá nhân hóa phản hồi, không bịa đặt thêm dữ liệu.`;
  }
}
