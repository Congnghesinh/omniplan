import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Camera, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ApiService } from '../../services/api.js';

interface FinanceViewProps {
  transactions: any[];
  budgets: any[];
  wallets: any[];
  onAddTransaction: (tx: any) => void;
  onOpenChatWithPrompt: (prompt: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  budgets,
  wallets,
  onAddTransaction,
  onOpenChatWithPrompt
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ăn uống');
  const [walletName, setWalletName] = useState('Tiền mặt');
  const [note, setNote] = useState('');
  const [scanning, setScanning] = useState(false);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    onAddTransaction({
      type: txType,
      amount: val,
      category,
      wallet: walletName,
      note: note.trim() || category,
      date: new Date().toISOString().split('T')[0]
    });

    setAmount('');
    setNote('');
    setShowAddModal(false);
  };

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = (evt.target?.result as string).split(',')[1];
        const res = await ApiService.scanReceipt(base64, file.type || 'image/jpeg');
        if (res && res.totalAmount) {
          onAddTransaction({
            type: 'expense',
            amount: res.totalAmount,
            category: res.category || 'Mua sắm',
            wallet: 'Tiền mặt',
            note: res.merchantName ? `Hóa đơn ${res.merchantName}` : 'Hóa đơn quét AI',
            date: res.transactionDate || new Date().toISOString().split('T')[0]
          });
          alert(`🎉 Đã quét thành công hóa đơn: ${res.merchantName || ''} - ${res.totalAmount.toLocaleString('vi-VN')} đ`);
        }
        setScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Không thể quét hóa đơn. Vui lòng thử lại.');
      setScanning(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#103b2d', margin: 0 }}>Quản lý Tài chính Cá nhân</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>Theo dõi dòng tiền, ví điện tử, ngân sách và hóa đơn tự động</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '8px',
            background: 'rgba(16, 59, 45, 0.08)',
            color: '#103b2d',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid rgba(16, 59, 45, 0.2)'
          }}>
            <Camera size={16} />
            {scanning ? 'Đang đọc hóa đơn...' : 'Quét Hóa đơn AI'}
            <input type="file" accept="image/*" onChange={handleReceiptScan} style={{ display: 'none' }} disabled={scanning} />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: '#103b2d',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Thêm Giao dịch
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>Tổng số dư các ví</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#103b2d', marginTop: '6px' }}>
            {totalBalance.toLocaleString('vi-VN')} <small style={{ fontSize: '13px' }}>đ</small>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c62828' }}>
            <ArrowDownLeft size={16} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Tổng chi tiêu</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#c62828', marginTop: '6px' }}>
            -{totalExpense.toLocaleString('vi-VN')} <small style={{ fontSize: '13px' }}>đ</small>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2e7d32' }}>
            <ArrowUpRight size={16} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Tổng thu nhập</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#2e7d32', marginTop: '6px' }}>
            +{totalIncome.toLocaleString('vi-VN')} <small style={{ fontSize: '13px' }}>đ</small>
          </div>
        </div>
      </div>

      {/* Wallets & Budgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Wallets */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700 }}>Ví tiền & Tài khoản</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wallets.map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8faf9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wallet size={18} color="#103b2d" />
                  <strong style={{ fontSize: '13px' }}>{w.name}</strong>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#103b2d' }}>
                  {w.balance.toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Budgets */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700 }}>Hạn mức Ngân sách Tháng</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {budgets.map(b => {
              const percent = Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100));
              const isOver = b.spentAmount > b.limitAmount;
              return (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <strong>{b.category}</strong>
                    <span style={{ color: isOver ? '#c62828' : '#666' }}>
                      {b.spentAmount.toLocaleString('vi-VN')} / {b.limitAmount.toLocaleString('vi-VN')} đ ({percent}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: isOver ? '#c62828' : percent > 80 ? '#ef6c00' : '#103b2d', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700 }}>Lịch sử Giao dịch Gần đây</h3>
        {transactions.length === 0 ? (
          <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>Chưa có giao dịch nào được ghi nhận.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transactions.map(tx => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>{tx.note || tx.category}</strong>
                    <span style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', color: '#666' }}>{tx.category}</span>
                  </div>
                  <small style={{ color: '#888', fontSize: '11px' }}>{tx.date} • {tx.wallet}</small>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: tx.type === 'expense' ? '#c62828' : '#2e7d32' }}>
                  {tx.type === 'expense' ? '-' : '+'}{tx.amount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: '#103b2d' }}>Thêm Giao dịch Mới</h3>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: txType === 'expense' ? '#c62828' : '#ddd',
                    background: txType === 'expense' ? '#ffebee' : '#fff',
                    color: txType === 'expense' ? '#c62828' : '#666',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Chi tiêu
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: txType === 'income' ? '#2e7d32' : '#ddd',
                    background: txType === 'income' ? '#e8f5e9' : '#fff',
                    color: txType === 'income' ? '#2e7d32' : '#666',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Thu nhập
                </button>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số tiền (VNĐ)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Danh mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                >
                  <option value="Ăn uống">Ăn uống</option>
                  <option value="Đi lại">Đi lại</option>
                  <option value="Mua sắm">Mua sắm</option>
                  <option value="Học tập">Học tập</option>
                  <option value="Hóa đơn & Tiện ích">Hóa đơn & Tiện ích</option>
                  <option value="Lương">Lương</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơm trưa với đồng nghiệp"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#103b2d', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
