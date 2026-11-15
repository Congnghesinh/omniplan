import React from 'react';
import { HeartPulse, GraduationCap, Briefcase, Wallet, Sparkles, CheckCircle2, Clock, Plus, Flame, Droplet } from 'lucide-react';
import { ProactiveReport } from '../../types/index.js';

interface OverviewDashboardProps {
  dailyBriefing?: ProactiveReport | null;
  waterIntakeMl: number;
  totalCalories: number;
  todayExpense: number;
  tasksCount: number;
  onOpenChatWithPrompt: (prompt: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  dailyBriefing,
  waterIntakeMl,
  totalCalories,
  todayExpense,
  tasksCount,
  onOpenChatWithPrompt,
  onNavigateTab
}) => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Proactive AI Daily Briefing Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 59, 45, 0.05) 0%, rgba(26, 92, 71, 0.08) 100%)',
        border: '1px solid rgba(16, 59, 45, 0.15)',
        borderRadius: '16px',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Sparkles size={18} color="#103b2d" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#103b2d' }}>
            Bản tin Thông minh Hôm nay (AI Proactive Briefing)
          </h3>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '14px', lineHeight: 1.6, color: '#333333' }}>
          {dailyBriefing?.content || 'Chào bạn! Hôm nay bạn có 2 nhiệm vụ công việc ưu tiên, mục tiêu uống 2L nước và 1 buổi ôn tập Flashcard vào buổi tối.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenChatWithPrompt('Lên lịch trình làm việc tối ưu cho hôm nay')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid rgba(16, 59, 45, 0.2)',
              color: '#103b2d',
              cursor: 'pointer'
            }}
          >
            📋 Nhờ Omi sắp xếp lịch làm
          </button>
          <button
            onClick={() => onOpenChatWithPrompt('Gợi ý thực đơn dinh dưỡng và lượng calo hợp lý hôm nay')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid rgba(16, 59, 45, 0.2)',
              color: '#103b2d',
              cursor: 'pointer'
            }}
          >
            🥗 Gợi ý dinh dưỡng & calo
          </button>
        </div>
      </div>

      {/* 2. 4 Life OS Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {/* Sức khỏe */}
        <div
          onClick={() => onNavigateTab('health')}
          style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>Sức khỏe & Sinh hoạt</span>
            <div style={{ background: '#e8f5e9', padding: '6px', borderRadius: '8px' }}>
              <HeartPulse size={18} color="#2e7d32" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
            <div>
              <small style={{ color: '#888', fontSize: '11px' }}>Nước uống</small>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0288d1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Droplet size={15} /> {waterIntakeMl} <small style={{ fontSize: '12px', color: '#888' }}>/ 2000 ml</small>
              </div>
            </div>
            <div>
              <small style={{ color: '#888', fontSize: '11px' }}>Calo tiêu thụ</small>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#e65100', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={15} /> {totalCalories} <small style={{ fontSize: '12px', color: '#888' }}>kcal</small>
              </div>
            </div>
          </div>
          <div style={{ background: '#f5f5f5', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ background: '#0288d1', width: `${Math.min(100, (waterIntakeMl / 2000) * 100)}%`, height: '100%' }} />
          </div>
        </div>

        {/* Học tập */}
        <div
          onClick={() => onNavigateTab('learning')}
          style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>Học tập & Kỹ năng</span>
            <div style={{ background: '#ede7f6', padding: '6px', borderRadius: '8px' }}>
              <GraduationCap size={18} color="#673ab7" />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#103b2d', marginBottom: '4px' }}>
            15 Flashcards
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            Cần ôn tập hôm nay (Chu kỳ giãn cách Leitner).
          </p>
        </div>

        {/* Công việc */}
        <div
          onClick={() => onNavigateTab('work')}
          style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>Công việc & Dự án</span>
            <div style={{ background: '#e3f2fd', padding: '6px', borderRadius: '8px' }}>
              <Briefcase size={18} color="#1565c0" />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#103b2d', marginBottom: '4px' }}>
            {tasksCount} nhiệm vụ
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            Đang trong tiến trình thực hiện hôm nay.
          </p>
        </div>

        {/* Tài chính */}
        <div
          onClick={() => onNavigateTab('finance')}
          style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>Tài chính cá nhân</span>
            <div style={{ background: '#fff8e1', padding: '6px', borderRadius: '8px' }}>
              <Wallet size={18} color="#f57f17" />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#d32f2f', marginBottom: '4px' }}>
            - {todayExpense.toLocaleString('vi-VN')} đ
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            Tổng chi tiêu ghi nhận hôm nay.
          </p>
        </div>
      </div>
    </div>
  );
};
