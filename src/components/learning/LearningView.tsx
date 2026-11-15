import React, { useState, useEffect } from 'react';
import { GraduationCap, Play, Pause, RotateCcw, Sparkles, BookOpen } from 'lucide-react';

export const LearningView: React.FC = () => {
  // Pomodoro Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      alert('🎉 Chúc mừng bạn đã hoàn thành phiên Pomodoro 25 phút!');
      setTimeLeft(25 * 60);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sample Flashcards
  const [flashcards] = useState([
    { id: '1', question: 'Phương pháp Active Recall là gì?', answer: 'Là phương pháp chủ động gợi nhớ thông tin từ não bộ thay vì đọc lại tài liệu một cách thụ động.' },
    { id: '2', question: 'Quy tắc Spaced Repetition (Lặp lại ngắt quãng)?', answer: 'Ôn tập lại thông tin tại các khoảng thời gian tăng dần ngay trước thời điểm chuẩn bị quên.' }
  ]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#103b2d', margin: 0 }}>Quản lý Học tập & Kỹ năng</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* 1. Đồng hồ Pomodoro Focus */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Phiên Tập Trung Pomodoro</h3>
          <div style={{ fontSize: '48px', fontWeight: 800, color: '#673ab7', margin: '20px 0', fontFamily: 'monospace' }}>
            {formatTimer(timeLeft)}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#673ab7',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Tạm dừng' : 'Bắt đầu 25m'}
            </button>
            <button
              onClick={() => { setIsRunning(false); setTimeLeft(25 * 60); }}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* 2. Thẻ ghi nhớ Flashcards (Active Recall) */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Flashcard Ôn Tập</h3>
            <span style={{ fontSize: '12px', color: '#888' }}>Thẻ {currentCardIndex + 1} / {flashcards.length}</span>
          </div>

          <div
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              minHeight: '140px',
              background: '#f9f9fb',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              border: '1px dashed #673ab7',
              margin: '14px 0'
            }}
          >
            <div>
              <small style={{ color: '#888', display: 'block', marginBottom: '8px' }}>
                {showAnswer ? 'Đáp án (Nhấn để ẩn):' : 'Câu hỏi (Nhấn để lật đáp án):'}
              </small>
              <strong style={{ fontSize: '15px', color: '#333' }}>
                {showAnswer ? flashcards[currentCardIndex].answer : flashcards[currentCardIndex].question}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => {
                setShowAnswer(false);
                setCurrentCardIndex((currentCardIndex + 1) % flashcards.length);
              }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #673ab7', background: '#ede7f6', color: '#673ab7', fontWeight: 600, cursor: 'pointer' }}
            >
              Thẻ tiếp theo ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
