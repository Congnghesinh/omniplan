import React from 'react';
import { Bot, Bell, Sparkles, MessageCircle, Moon, Sun, Smartphone, MessageSquarePlus } from 'lucide-react';

interface HeaderProps {
  currentTabLabel: string;
  onOpenChat: () => void;
  onOpenZaloModal: () => void;
  onOpenFeedbackModal: () => void;
  zaloLinked: boolean;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabLabel,
  onOpenChat,
  onOpenZaloModal,
  onOpenFeedbackModal,
  zaloLinked,
  unreadCount = 0
}) => {
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="omni-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: 'var(--bg-surface, #ffffff)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="omni-topbar-left" style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', color: '#666', textTransform: 'capitalize' }}>{currentDate}</span>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#103b2d' }}>{currentTabLabel}</h1>
      </div>

      <div className="omni-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Global Feedback & Bug Report Button */}
        <button
          type="button"
          onClick={onOpenFeedbackModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid #103b2d',
            background: '#fdfbf7',
            color: '#103b2d',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title="Góp ý & báo lỗi cho OmniPlan Beta"
        >
          <span style={{ fontSize: '15px' }}>🦦</span>
          <span>Góp ý & Báo lỗi</span>
        </button>

        {/* Zalo Sync Status Pill */}
        <button
          type="button"
          onClick={onOpenZaloModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid #0068ff',
            background: zaloLinked ? 'rgba(0, 104, 255, 0.08)' : '#ffffff',
            color: '#0068ff'
          }}
          title="Trạng thái đồng bộ Zalo Bot"
        >
          <Smartphone size={14} />
          {zaloLinked ? 'Đã liên kết Zalo' : 'Kết nối Zalo Bot'}
        </button>

        {/* AI Assistant Trigger Button */}
        <button
          type="button"
          onClick={onOpenChat}
          className="omni-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #103b2d 0%, #1a5c47 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 59, 45, 0.15)'
          }}
        >
          <Bot size={18} />
          <span>Trợ lý Omi AI</span>
        </button>
      </div>
    </header>
  );
};
