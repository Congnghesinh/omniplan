import React, { useState, useEffect } from 'react';
import { Target, Heart, Wallet, CheckSquare, GraduationCap, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { ApiService } from '../../services/api.js';

interface OmniGoalsViewProps {
  onOpenChatWithPrompt: (prompt: string) => void;
}

export const OmniGoalsView: React.FC<OmniGoalsViewProps> = ({ onOpenChatWithPrompt }) => {
  const [goalsData, setGoalsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getGoals();
      if (res) setGoalsData(res);
    } catch (e) {
      console.error('Error loading goals:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #103b2d 0%, #1a5c47 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(16, 59, 45, 0.12)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Target size={24} color="#fcd34d" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
              OmniGoals – Quản lý Mục tiêu Toàn diện
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '600px' }}>
            Theo dõi và đồng bộ tiến độ các mục tiêu dài hạn trên cả 4 lĩnh vực: Sức khỏe, Tài chính, Công việc và Học tập dưới sự hỗ trợ của OmniAI.
          </p>
        </div>

        <button
          onClick={() => onOpenChatWithPrompt('Hãy giúp tôi lập một mục tiêu phát triển bản thân 3 tháng tới.')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#ffffff',
            color: '#103b2d',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Sparkles size={16} color="#103b2d" />
          <span>Lập mục tiêu cùng AI</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          Đang tải dữ liệu mục tiêu...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* 1. Health Goals */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Heart size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#103b2d' }}>
                  Mục tiêu Sức khỏe
                </h3>
                <small style={{ color: '#888', fontSize: '11px' }}>Duy trì thể trạng tối ưu</small>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#555' }}>Nước uống mỗi ngày</span>
                  <strong style={{ color: '#0284c7' }}>{goalsData?.healthGoals?.waterGoalMl || 2000} ml</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e0f2fe', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '70%', height: '100%', background: '#0284c7', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#555' }}>Mục tiêu Năng lượng</span>
                  <strong style={{ color: '#f59e0b' }}>{goalsData?.healthGoals?.calorieGoal || 2000} kcal</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#fef3c7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Financial Goals */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Wallet size={20} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#103b2d' }}>
                  Hạn mức & Tiết kiệm
                </h3>
                <small style={{ color: '#888', fontSize: '11px' }}>Kỷ luật tài chính thông minh</small>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(goalsData?.financialGoals || []).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '16px 0' }}>
                  Chưa có hạn mức nào được đặt.
                </div>
              ) : (
                goalsData.financialGoals.map((b: any, i: number) => {
                  const percent = Math.min(100, Math.round((b.spent / (b.targetLimit || 1)) * 100));
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>{b.category}</span>
                        <span style={{ color: percent > 90 ? '#dc2626' : '#666' }}>
                          {b.spent.toLocaleString()} / {b.targetLimit.toLocaleString()} đ ({percent}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: percent > 90 ? '#dc2626' : '#16a34a',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Custom AI Memory Goals */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#faf5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <TrendingUp size={20} color="#9333ea" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#103b2d' }}>
                  Mục tiêu Cá nhân ghi nhớ bởi AI
                </h3>
                <small style={{ color: '#888', fontSize: '11px' }}>Khai phá tiềm năng cùng OmniMemory</small>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(goalsData?.customGoals || []).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '16px 0' }}>
                  Nói với Omi AI (ví dụ: &quot;Tôi muốn đạt IELTS 7.5 trong 6 tháng tới&quot;) để AI tự động ghi nhớ và nhắc nhở!
                </div>
              ) : (
                goalsData.customGoals.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      background: '#fcfaff',
                      borderRadius: '8px',
                      border: '1px solid #f3e8ff'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#9333ea' }}>
                      {m.key}
                    </div>
                    <div style={{ fontSize: '13px', color: '#333', marginTop: '2px' }}>
                      {m.value}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
