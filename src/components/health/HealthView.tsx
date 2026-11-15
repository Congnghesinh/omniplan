import React, { useState } from 'react';
import { Droplet, Flame, HeartPulse, Plus, Activity, Moon } from 'lucide-react';

interface HealthViewProps {
  waterMl: number;
  onAddWater: (ml: number) => void;
  weightKg: number;
  onUpdateWeight: (kg: number) => void;
}

export const HealthView: React.FC<HealthViewProps> = ({
  waterMl,
  onAddWater,
  weightKg,
  onUpdateWeight
}) => {
  const [newWeight, setNewWeight] = useState(weightKg.toString());

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#103b2d', margin: 0 }}>Quản lý Sức khỏe & Thể trạng</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* 1. Nước uống (Hydration Tracker) */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Droplet size={20} color="#0288d1" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Theo dõi Lượng nước</h3>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0288d1' }}>{waterMl} <span style={{ fontSize: '16px', color: '#888' }}>/ 2000 ml</span></div>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>Mục tiêu khuyến nghị: 2,000 ml mỗi ngày</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => onAddWater(250)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #0288d1', background: '#e1f5fe', color: '#0288d1', fontWeight: 600, cursor: 'pointer' }}
            >
              +250 ml (1 cốc)
            </button>
            <button
              onClick={() => onAddWater(500)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #0288d1', background: '#0288d1', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              +500 ml (1 chai)
            </button>
          </div>
        </div>

        {/* 2. Cân nặng & Chỉ số BMI */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Activity size={20} color="#2e7d32" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Chỉ số Cân nặng (kg)</h3>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#2e7d32' }}>{weightKg} <span style={{ fontSize: '16px', color: '#888' }}>kg</span></div>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>BMI ước tính: 21.5 (Thể trạng bình thường)</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Nhập cân nặng mới"
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <button
              onClick={() => onUpdateWeight(parseFloat(newWeight) || weightKg)}
              style={{ padding: '8px 16px', borderRadius: '8px', background: '#2e7d32', color: '#ffffff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
