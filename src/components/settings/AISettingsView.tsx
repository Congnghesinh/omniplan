import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Brain,
  Smartphone,
  Bot,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { AIPersonalityId, AIPersonality, AIMemoryItem } from '../../types/index.js';
import { ApiService } from '../../services/api.js';

interface AISettingsViewProps {
  currentPersonalityId: AIPersonalityId;
  onChangePersonality: (id: AIPersonalityId) => void;
  personalities: AIPersonality[];
  zaloLinked: boolean;
  onZaloLinkStatusChange: () => void;
}

export const AISettingsView: React.FC<AISettingsViewProps> = ({
  currentPersonalityId,
  onChangePersonality,
  personalities,
  zaloLinked,
  onZaloLinkStatusChange
}) => {
  const [activeTab, setActiveTab] = useState<'personality' | 'memory' | 'zalo' | 'proactive'>('personality');

  // Memories state
  const [memories, setMemories] = useState<AIMemoryItem[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('preference');
  const [newDomain, setNewDomain] = useState('personal');

  // Zalo state
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeCountdown, setCodeCountdown] = useState<number>(0);
  const [zaloStatus, setZaloStatus] = useState<any>(null);
  const [simText, setSimText] = useState('');
  const [simReply, setSimReply] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Personality sliders state
  const currentP = personalities.find(p => p.id === currentPersonalityId) || personalities[0];
  const [sliders, setSliders] = useState(currentP?.sliders || {
    friendliness: 5,
    humor: 5,
    strictness: 5,
    proactivity: 7,
    verbosity: 5
  });

  useEffect(() => {
    loadMemories();
    loadZaloStatus();
  }, []);

  useEffect(() => {
    if (currentP?.sliders) {
      setSliders(currentP.sliders);
    }
  }, [currentPersonalityId]);

  // Countdown timer for Zalo OTP code
  useEffect(() => {
    let timer: any = null;
    if (codeCountdown > 0) {
      timer = setInterval(() => setCodeCountdown(c => c - 1), 1000);
    } else if (codeCountdown === 0) {
      setLinkCode(null);
    }
    return () => clearInterval(timer);
  }, [codeCountdown]);

  const loadMemories = async () => {
    try {
      const res = await ApiService.getMemories();
      setMemories(res.memories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadZaloStatus = async () => {
    try {
      const res = await ApiService.getZaloStatus();
      setZaloStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateLinkCode = async () => {
    try {
      const res = await ApiService.generateZaloLinkCode();
      if (res && res.code) {
        setLinkCode(res.code);
        setCodeCountdown(res.expiresInMinutes * 60);
      }
    } catch (e) {
      alert('Không thể tạo mã liên kết.');
    }
  };

  const handleUnlinkZalo = async () => {
    if (!zaloStatus?.connection?.zaloUserId) return;
    if (!confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản Zalo này?')) return;
    await ApiService.unlinkZalo(zaloStatus.connection.zaloUserId);
    loadZaloStatus();
    onZaloLinkStatusChange();
  };

  const handleSimulateZalo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;

    setSimLoading(true);
    setSimReply(null);
    try {
      const res = await ApiService.simulateZaloMessage(simText.trim(), zaloStatus?.connection?.zaloUserId || 'zalo_test_user');
      setSimReply(res.replyText);
      setSimText('');
      loadMemories();
      onZaloLinkStatusChange();
    } catch (err: any) {
      setSimReply(`Lỗi: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    await ApiService.addMemory({
      key: newKey.trim(),
      value: newValue.trim(),
      type: newType,
      domain: newDomain
    });

    setNewKey('');
    setNewValue('');
    loadMemories();
  };

  const handleToggleMemory = async (id: string, active: boolean) => {
    await ApiService.toggleMemory(id, active);
    loadMemories();
  };

  const handleDeleteMemory = async (id: string) => {
    await ApiService.deleteMemory(id);
    loadMemories();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#103b2d', margin: 0 }}>Cài đặt AI & Tích hợp</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Quản lý tính cách, bộ nhớ dài hạn, kênh đồng bộ Zalo Bot và tự động hóa</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('personality')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'personality' ? '#103b2d' : 'transparent',
            color: activeTab === 'personality' ? '#fff' : '#666',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Bot size={15} /> Tính cách AI
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'memory' ? '#103b2d' : 'transparent',
            color: activeTab === 'memory' ? '#fff' : '#666',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Brain size={15} /> Bộ nhớ Thông minh
        </button>

        <button
          onClick={() => setActiveTab('zalo')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'zalo' ? '#0068ff' : 'transparent',
            color: activeTab === 'zalo' ? '#fff' : '#666',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Smartphone size={15} /> Tích hợp Zalo Bot
        </button>

        <button
          onClick={() => setActiveTab('proactive')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'proactive' ? '#103b2d' : 'transparent',
            color: activeTab === 'proactive' ? '#fff' : '#666',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Sparkles size={15} /> AI Chủ động & Lịch trình
        </button>
      </div>

      {/* 1. Personality Tab */}
      {activeTab === 'personality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Preset Grid */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700 }}>Chọn Phong cách Tính cách Mặc định</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {personalities.map(p => {
                const isSelected = p.id === currentPersonalityId;
                return (
                  <div
                    key={p.id}
                    onClick={() => onChangePersonality(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? '#103b2d' : '#eee',
                      background: isSelected ? 'rgba(16, 59, 45, 0.04)' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '28px' }}>{p.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', color: '#103b2d' }}>{p.name}</strong>
                        {isSelected && <Check size={16} color="#103b2d" />}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                        {p.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sliders Tuning */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700 }}>Tinh chỉnh Chi tiết Tính cách: {currentP.name}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#666' }}>Điều chỉnh sắc thái phản hồi để phù hợp nhất với mong muốn của bạn</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Thân thiện & Ấm áp</span>
                  <span style={{ color: '#103b2d' }}>{sliders.friendliness}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sliders.friendliness}
                  onChange={(e) => setSliders({ ...sliders, friendliness: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#103b2d' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Hài hước & Dí dỏm</span>
                  <span style={{ color: '#103b2d' }}>{sliders.humor}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sliders.humor}
                  onChange={(e) => setSliders({ ...sliders, humor: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#103b2d' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kỷ luật & Thúc đẩy (Strictness)</span>
                  <span style={{ color: '#103b2d' }}>{sliders.strictness}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sliders.strictness}
                  onChange={(e) => setSliders({ ...sliders, strictness: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#103b2d' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mức độ Chủ động (Proactivity)</span>
                  <span style={{ color: '#103b2d' }}>{sliders.proactivity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sliders.proactivity}
                  onChange={(e) => setSliders({ ...sliders, proactivity: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#103b2d' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Memory Tab */}
      {activeTab === 'memory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Add New Memory Form */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700 }}>Thêm Thông tin Bộ nhớ Thủ công</h3>
            <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                >
                  <option value="preference">Sở thích & Thói quen (Preference)</option>
                  <option value="goal">Mục tiêu (Goal)</option>
                  <option value="long_term">Thông tin dài hạn (Long-term)</option>
                  <option value="semantic">Kiến thức chuyên môn (Semantic)</option>
                  <option value="episodic">Sự kiện đã qua (Episodic)</option>
                </select>

                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                >
                  <option value="personal">Toàn diện / Cá nhân</option>
                  <option value="health">Sức khỏe</option>
                  <option value="learning">Học tập</option>
                  <option value="work">Công việc</option>
                  <option value="finance">Tài chính</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Khóa / Tiêu đề (VD: Thói quen ăn sáng)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Nội dung cụ thể (VD: Thích ăn phở ít muối, không hành trần)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#103b2d',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Lưu vào bộ nhớ AI
              </button>
            </form>
          </div>

          {/* Memory List */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700 }}>Danh sách Bộ nhớ Đã Ghi nhận ({memories.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {memories.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: m.active ? '#f8faf9' : '#f0f0f0',
                    border: '1px solid rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#103b2d' }}>{m.key}</strong>
                      <span style={{ fontSize: '10px', background: '#e1f5fe', color: '#0288d1', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {m.domain}
                      </span>
                      <span style={{ fontSize: '10px', background: '#ede7f6', color: '#512da8', padding: '2px 6px', borderRadius: '4px' }}>
                        {m.type}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#444' }}>{m.value}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={m.active}
                        onChange={(e) => handleToggleMemory(m.id, e.target.checked)}
                        style={{ accentColor: '#103b2d' }}
                      />
                      <span>Kích hoạt</span>
                    </label>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', padding: '4px' }}
                      title="Xóa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Zalo Bot Integration Tab */}
      {activeTab === 'zalo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Link Status Card */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0068ff' }}>
                  Liên kết Tài khoản với Zalo Bot Platform
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                  Đồng bộ hai chiều dữ liệu lịch trình, sức khỏe, học tập và tài chính qua tài khoản Zalo chính thức
                </p>
              </div>

              {zaloStatus?.linked ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} /> Đã liên kết Zalo ID: {zaloStatus?.connection?.zaloUserId}
                  </span>
                  <button
                    onClick={handleUnlinkZalo}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #c62828', background: '#ffebee', color: '#c62828', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Hủy liên kết
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateLinkCode}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0068ff',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tạo mã liên kết một lần (OTP)
                </button>
              )}
            </div>

            {/* OTP Code Display */}
            {linkCode && (
              <div style={{ marginTop: '20px', background: '#f0f7ff', border: '1px dashed #0068ff', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#0068ff', fontWeight: 600 }}>MÃ LIÊN KẾT CỦA BẠN:</span>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0068ff', letterSpacing: '4px', margin: '8px 0' }}>
                  {linkCode}
                </div>
                <p style={{ fontSize: '13px', color: '#444', margin: '4px 0' }}>
                  Hãy mở Zalo, tìm bot OmniPlan và gửi cú pháp: <strong>/link {linkCode}</strong>
                </p>
                <small style={{ color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
                  <Clock size={12} /> Mã có hiệu lực trong {Math.floor(codeCountdown / 60)} phút {codeCountdown % 60} giây
                </small>
              </div>
            )}
          </div>

          {/* Webhook Configuration Information */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700 }}>Cấu hình Webhook Zalo Bot Platform</h3>
            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, margin: '0 0 12px' }}>
              Điền URL Webhook này vào Zalo Developers Portal (https://developers.zalo.me) để nhận tin nhắn real-time:
            </p>
            <div style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#103b2d', wordBreak: 'break-all' }}>
              https://your-domain.com/api/zalo/webhook
            </div>
          </div>

          {/* Live In-App Zalo Bot Simulator */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#0068ff' }}>
              Trình giả lập Kiểm thử Zalo Bot (Live Simulator)
            </h3>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 14px' }}>
              Kiểm tra phản hồi hai chiều từ Zalo Bot ngay trên màn hình này mà không cần chờ cấu hình Zalo Cloud:
            </p>

            <form onSubmit={handleSimulateZalo} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nhập câu lệnh giả lập (ví dụ: '/today', '/link 123456', 'tiêu 45k ăn trưa')..."
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
              />
              <button
                type="submit"
                disabled={simLoading || !simText.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: '#0068ff',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Send size={15} /> {simLoading ? 'Đang gửi...' : 'Gửi giả lập'}
              </button>
            </form>

            {simReply && (
              <div style={{ marginTop: '16px', background: '#f0f7ff', border: '1px solid rgba(0, 104, 255, 0.2)', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#0068ff', fontWeight: 700, textTransform: 'uppercase' }}>Phản hồi từ Zalo Bot:</span>
                <pre style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.6, color: '#222' }}>
                  {simReply}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Proactive AI Tab */}
      {activeTab === 'proactive' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700 }}>Thiết lập AI Chủ động & Nhắc nhở</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>Bản tin Sáng sớm (Daily Briefing)</strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>Tổng hợp nhiệm vụ quan trọng, mục tiêu nước uống và chi tiêu ngày</p>
              </div>
              <input type="time" defaultValue="07:30" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>Tổng kết Cuối ngày (Night Review)</strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>Đánh giá % hoàn thành mục tiêu, kiểm tra chi tiêu và khuyến nghị giấc ngủ</p>
              </div>
              <input type="time" defaultValue="21:30" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>Kênh nhận thông báo mặc định</strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>Lựa chọn nơi nhận thông báo chủ động</p>
              </div>
              <select defaultValue="both" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}>
                <option value="app">Chỉ trong Ứng dụng</option>
                <option value="zalo">Chỉ qua Zalo Bot</option>
                <option value="both">Cả hai kênh (App & Zalo)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

