import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Tag, AlertCircle } from 'lucide-react';
import { TaskItem } from '../../types/index.js';

interface WorkViewProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, priority: 'low' | 'medium' | 'high') => void;
}

export const WorkView: React.FC<WorkViewProps> = ({
  tasks,
  onToggleTask,
  onAddTask
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), priority);
    setNewTitle('');
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'high':
      case 'urgent':
        return <span style={{ background: '#ffebee', color: '#c62828', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Ưu tiên cao</span>;
      case 'medium':
        return <span style={{ background: '#fff3e0', color: '#ef6c00', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Bình thường</span>;
      default:
        return <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Thấp</span>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#103b2d', margin: 0 }}>Quản lý Công việc & Dự án</h2>

      {/* Add Task Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nhập tên nhiệm vụ cần làm..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
        >
          <option value="high">Ưu tiên cao</option>
          <option value="medium">Bình thường</option>
          <option value="low">Thấp</option>
        </select>
        <button
          type="submit"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#103b2d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={16} /> Thêm việc
        </button>
      </form>

      {/* Task List */}
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Danh sách nhiệm vụ ({tasks.length})</h3>

        {tasks.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '30px 0' }}>Chưa có nhiệm vụ nào. Hãy thêm một công việc mới hoặc bảo Trợ lý Omi tạo giúp bạn!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => onToggleTask(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: t.status === 'done' ? '#fbfbfb' : '#ffffff',
                  border: '1px solid #eee',
                  cursor: 'pointer'
                }}
              >
                {t.status === 'done' ? (
                  <CheckCircle2 size={20} color="#2e7d32" />
                ) : (
                  <Circle size={20} color="#999" />
                )}
                <span style={{ flex: 1, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? '#888' : '#333', fontSize: '14px', fontWeight: 500 }}>
                  {t.title}
                </span>
                {getPriorityBadge(t.priority)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
