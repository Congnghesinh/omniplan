import React from 'react';
import { LayoutDashboard, GraduationCap, Briefcase, HeartPulse, Wallet, Settings, Bot, ChevronRight, MessageSquarePlus } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenChat
}) => {
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'health', label: 'Sức khỏe', icon: HeartPulse },
    { id: 'learning', label: 'Học tập', icon: GraduationCap },
    { id: 'work', label: 'Công việc', icon: Briefcase },
    { id: 'finance', label: 'Tài chính', icon: Wallet },
    { id: 'feedback', label: 'Góp ý & Hỗ trợ', icon: MessageSquarePlus },
    { id: 'settings', label: 'Cài đặt & AI', icon: Settings }
  ];

  return (
    <aside style={{ width: '260px', background: '#ffffff', borderRight: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <img src="/favicon.svg" alt="OmniPlan" style={{ width: '32px', height: '32px' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#103b2d', letterSpacing: '-0.3px' }}>OmniPlan</h2>
          <small style={{ fontSize: '11px', color: '#888', fontWeight: 500 }}>Personal AI Life OS</small>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(16, 59, 45, 0.08)' : 'transparent',
                color: isActive ? '#103b2d' : '#555555',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? '#103b2d' : '#777777'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <ChevronRight size={14} color="#103b2d" />}
            </button>
          );
        })}
      </nav>

      {/* AI Assistant Banner at Bottom of Sidebar */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div
          onClick={onOpenChat}
          style={{
            background: 'linear-gradient(135deg, #103b2d 0%, #1a5c47 100%)',
            borderRadius: '12px',
            padding: '14px',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 59, 45, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Bot size={18} />
            <strong style={{ fontSize: '13px' }}>Trợ lý Omi AI</strong>
          </div>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, lineHeight: 1.4 }}>
            Sẵn sàng hỗ trợ quản lý sức khỏe, học tập, công việc & thu chi.
          </p>
        </div>
      </div>
    </aside>
  );
};
