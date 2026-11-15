import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, Wallet, BookOpen, Brain, ArrowRight, Loader2 } from 'lucide-react';
import { ApiService } from '../../services/api.js';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    tasks: any[];
    transactions: any[];
    flashcards: any[];
    memories: any[];
  }>({ tasks: [], transactions: [], flashcards: [], memories: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ tasks: [], transactions: [], flashcards: [], memories: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled externally or trigger
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults({ tasks: [], transactions: [], flashcards: [], memories: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await ApiService.globalSearch(val.trim());
      if (res) {
        setResults({
          tasks: res.tasks || [],
          transactions: res.transactions || [],
          flashcards: res.flashcards || [],
          memories: res.memories || []
        });
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalResults =
    results.tasks.length +
    results.transactions.length +
    results.flashcards.length +
    results.memories.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(16, 59, 45, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh'
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #eef2ef',
            gap: '12px'
          }}
        >
          <Search size={20} color="#103b2d" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="OmniSearch: Tìm kiếm công việc, chi tiêu, bài học, trí nhớ AI... (Ctrl + K)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontWeight: 500,
              color: '#103b2d',
              background: 'transparent'
            }}
          />
          {loading && <Loader2 size={18} className="animate-spin" color="#103b2d" />}
          {query && !loading && (
            <button
              onClick={() => handleSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={18} color="#888" />
            </button>
          )}
          <span
            style={{
              fontSize: '11px',
              background: '#f0f4f1',
              color: '#666',
              padding: '3px 7px',
              borderRadius: '6px',
              fontWeight: 600
            }}
          >
            ESC
          </span>
        </div>

        {/* Results Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {!query.trim() ? (
            <div style={{ padding: '28px 0', textAlign: 'center', color: '#777' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#103b2d' }}>
                OmniSearch – Tìm kiếm thông minh hợp nhất
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Gõ từ khóa để tra cứu tức thì trên cả 4 lĩnh vực: Sức khỏe, Học tập, Công việc, Tài chính và Ký ức AI.
              </p>
            </div>
          ) : totalResults === 0 && !loading ? (
            <div style={{ padding: '28px 0', textAlign: 'center', color: '#777' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
                Không tìm thấy kết quả nào khớp với &quot;<strong>{query}</strong>&quot;
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#103b2d',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckSquare size={14} />
                    <span>CÔNG VIỆC ({results.tasks.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {results.tasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigateTab('work');
                          onClose();
                        }}
                        style={{
                          padding: '10px 14px',
                          background: '#f9fbf9',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          border: '1px solid #e5ede7'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>
                          {t.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: t.priority === 'high' ? '#fee2e2' : '#e0f2fe',
                              color: t.priority === 'high' ? '#dc2626' : '#0369a1'
                            }}
                          >
                            {t.priority}
                          </span>
                          <ArrowRight size={14} color="#888" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Transactions */}
              {results.transactions.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#103b2d',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Wallet size={14} />
                    <span>TÀI CHÍNH & CHI TIÊU ({results.transactions.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {results.transactions.map(tx => (
                      <div
                        key={tx.id}
                        onClick={() => {
                          onNavigateTab('finance');
                          onClose();
                        }}
                        style={{
                          padding: '10px 14px',
                          background: '#f9fbf9',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          border: '1px solid #e5ede7'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>
                            {tx.note || tx.category}
                          </div>
                          <small style={{ fontSize: '11px', color: '#888' }}>
                            {tx.category} • {tx.date}
                          </small>
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: tx.type === 'expense' ? '#dc2626' : '#16a34a'
                          }}
                        >
                          {tx.type === 'expense' ? '-' : '+'}
                          {tx.amount.toLocaleString()} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Flashcards */}
              {results.flashcards.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#103b2d',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <BookOpen size={14} />
                    <span>HỌC TẬP & FLASHCARD ({results.flashcards.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {results.flashcards.map(f => (
                      <div
                        key={f.id}
                        onClick={() => {
                          onNavigateTab('learning');
                          onClose();
                        }}
                        style={{
                          padding: '10px 14px',
                          background: '#f9fbf9',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '1px solid #e5ede7'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#222' }}>
                          Mặt trước: {f.front}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                          Mặt sau: {f.back}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. OmniMemory */}
              {results.memories.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#103b2d',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Brain size={14} />
                    <span>BỘ NHỚ AI OMNIMEMORY ({results.memories.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {results.memories.map(m => (
                      <div
                        key={m.id}
                        style={{
                          padding: '10px 14px',
                          background: '#faf5ff',
                          borderRadius: '8px',
                          border: '1px solid #f3e8ff'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#7e22ce' }}>
                          [{m.type}] {m.key}
                        </div>
                        <div style={{ fontSize: '13px', color: '#333', marginTop: '2px' }}>
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
