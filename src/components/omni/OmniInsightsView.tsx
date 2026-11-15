import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, AlertTriangle, ArrowRight, Lightbulb, Activity, CheckCircle2 } from 'lucide-react';
import { ApiService } from '../../services/api.js';

interface OmniInsightsViewProps {
  onOpenChatWithPrompt: (prompt: string) => void;
}

export const OmniInsightsView: React.FC<OmniInsightsViewProps> = ({ onOpenChatWithPrompt }) => {
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBriefing();
  }, []);

  const loadBriefing = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getDailyBriefing();
      if (res) setBriefing(res);
    } catch (e) {
      console.error('Error loading briefing:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #103b2d 0%, #1a5c47 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(16, 59, 45, 0.12)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Brain size={24} color="#a7f3d0" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
            OmniInsights – Phân tích Tương quan Đa Lĩnh vực
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '720px', lineHeight: 1.5 }}>
          Bộ não AI phân tích mối liên hệ giữa <strong>Công việc – Sức khỏe – Học tập – Tài chính</strong>. Giúp bạn nhận diện thói quen xấu, cân bằng cuộc sống và dự đoán áp lực trước khi nó xảy ra.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          Đang tổng hợp thông tin chi tiết...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Insights */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#103b2d', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={20} color="#f59e0b" />
              <span>Khuyến nghị Tối ưu Cuộc sống từ OmniAI</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {(briefing?.insights || [
                'Hôm nay bạn có nhiều nhiệm vụ ưu tiên cao, hãy nhớ uống đủ 2 lít nước để duy trì sự tập trung.',
                'Chi tiêu tuần này của bạn đang kiểm soát tốt dưới 70% ngân sách đề ra.',
                'Bạn đã duy trì ôn tập flashcard 3 ngày liên tiếp, duy trì rất tốt!'
              ]).map((text: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#f8faf9',
                    border: '1px solid #e2e8e5',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#333', lineHeight: 1.5 }}>
                    {text}
                  </p>
                  <button
                    onClick={() => onOpenChatWithPrompt(`Hãy phân tích kỹ hơn về khuyến nghị này: "${text}"`)}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#103b2d',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <span>Thảo luận cùng Omi AI</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Schedule Summary */}
          {briefing?.schedule && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#103b2d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#0284c7" />
                <span>Kế hoạch OmniDaily đề xuất hôm nay</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {briefing.schedule.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#fcfdfc',
                      borderRadius: '8px',
                      border: '1px solid #eef2ef'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#0284c7',
                          background: '#e0f2fe',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {item.time || 'Cả ngày'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>
                        {item.task}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: '#666'
                      }}
                    >
                      {item.domain}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
