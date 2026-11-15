import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  Sparkles,
  Info
} from 'lucide-react';
import { ApiService } from '../../services/api.js';
import { FeedbackCategory } from '../../types/index.js';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule?: string;
  onFeedbackSubmitted?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentModule = 'Tổng quan',
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('bug_report');
  const [selectedModule, setSelectedModule] = useState(currentModule);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowContact, setAllowContact] = useState(true);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Auto technical diagnostic info
  const [techInfo, setTechInfo] = useState({
    appVersion: '2.0.0-beta',
    browser: 'Trình duyệt Web',
    os: 'Hệ điều hành',
    deviceType: 'Desktop' as 'Desktop' | 'Mobile' | 'Tablet',
    timestamp: new Date().toISOString(),
    module: selectedModule,
    currentPath: window.location.pathname
  });

  useEffect(() => {
    // Detect browser & OS gently
    const ua = navigator.userAgent;
    let b = 'Chrome / Edge';
    if (ua.includes('Firefox')) b = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) b = 'Safari';

    let osName = 'Windows';
    if (ua.includes('Mac')) osName = 'macOS';
    else if (ua.includes('Linux')) osName = 'Linux';
    else if (ua.includes('Android')) osName = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';

    const isMobile = /Mobi|Android/i.test(ua);
    setTechInfo({
      appVersion: '2.0.0-beta',
      browser: b,
      os: osName,
      deviceType: isMobile ? 'Mobile' : 'Desktop',
      timestamp: new Date().toISOString(),
      module: selectedModule,
      currentPath: window.location.pathname
    });
  }, [selectedModule]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh chụp màn hình dưới 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setAttachments(prev => [...prev, evt.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung góp ý.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.submitFeedback({
        userId: 'default_user',
        userName: isAnonymous ? 'Ẩn danh' : 'Phạm Tuấn',
        userEmail: isAnonymous ? undefined : 'user@omniplan.ai',
        isAnonymous,
        allowContact,
        rating,
        title: title.trim(),
        content: content.trim(),
        category,
        module: selectedModule,
        attachments,
        techInfo
      });

      if (res.success) {
        setSubmittedCode(res.code);
        if (onFeedbackSubmitted) onFeedbackSubmitted();
      }
    } catch (err: any) {
      alert(`Không thể gửi phản hồi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedCode(null);
    setTitle('');
    setContent('');
    setAttachments([]);
    setRating(5);
    onClose();
  };

  const ratingEmojis = ['😠 Thất vọng', '🙁 Chưa hài lòng', '😐 Bình thường', '🙂 Hài lòng', '🤩 Rất tuyệt vời'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(16, 59, 45, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        background: '#fdfbf7',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(16, 59, 45, 0.25)',
        border: '1px solid rgba(16, 59, 45, 0.12)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Otter Mascot */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #103b2d 0%, #1a5c47 100%)',
          color: '#ffffff',
          borderRadius: '19px 19px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontSize: '32px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'grid',
              placeItems: 'center'
            }}>
              🦦🌱
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                Góp ý & Báo lỗi OmniPlan Beta
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.85 }}>
                Đồng hành xây dựng hệ điều hành cá nhân thông minh hơn
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {submittedCode ? (
            /* Success confirmation screen */
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '12px'
              }}>
                🦦✨
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#103b2d', margin: '0 0 8px' }}>
                Gửi phản hồi thành công!
              </h4>
              <div style={{
                display: 'inline-block',
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                Mã phản hồi: {submittedCode}
              </div>
              <p style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#444444',
                maxWidth: '420px',
                margin: '0 auto 24px',
                fontStyle: 'italic',
                background: '#fff9e6',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #ffe082'
              }}>
                “Cảm ơn bạn đã đồng hành cùng OmniPlan! Mỗi góp ý của bạn đều giúp chúng mình tốt hơn mỗi ngày.”
              </p>
              <button
                onClick={handleResetAndClose}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: '#103b2d',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Đã hiểu & Đóng
              </button>
            </div>
          ) : (
            /* Feedback Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Rating 1 - 5 stars */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#103b2d', display: 'block', marginBottom: '8px' }}>
                  Mức độ hài lòng của bạn về OmniPlan Beta:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          transform: rating >= star ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s'
                        }}
                      >
                        <Star
                          size={24}
                          color={rating >= star ? '#f59e0b' : '#d1d5db'}
                          fill={rating >= star ? '#f59e0b' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}>
                    {ratingEmojis[rating - 1]}
                  </span>
                </div>
              </div>

              {/* Category & Module */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '4px' }}>
                    Phân loại phản hồi
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d5dfdb', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="bug_report">🐛 Báo lỗi (Bug Report)</option>
                    <option value="feature_request">💡 Đề xuất tính năng</option>
                    <option value="ui_feedback">🎨 Góp ý giao diện (UI/UX)</option>
                    <option value="ai_assistant">🤖 Góp ý trợ lý AI</option>
                    <option value="google_calendar">📅 Đồng bộ Google Calendar</option>
                    <option value="email_integration">✉️ Tích hợp Gmail / Outlook</option>
                    <option value="zalo_sync">💬 Đồng bộ Zalo Bot</option>
                    <option value="performance">⚡ Hiệu suất ứng dụng</option>
                    <option value="security_privacy">🔒 Bảo mật & Riêng tư</option>
                    <option value="other">💬 Ý kiến khác</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '4px' }}>
                    Module liên quan
                  </label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d5dfdb', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Tổng quan">Tổng quan (Overview)</option>
                    <option value="Sức khỏe">Sức khỏe (Health)</option>
                    <option value="Học tập">Học tập (Learning)</option>
                    <option value="Công việc">Công việc (Work)</option>
                    <option value="Tài chính">Tài chính (Finance)</option>
                    <option value="Trợ lý AI">Trợ lý OmniAI</option>
                    <option value="Zalo Bot">Tích hợp Zalo Bot</option>
                    <option value="Cài đặt">Cài đặt & Cá nhân hóa</option>
                    <option value="Khác">Toàn bộ ứng dụng</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '4px' }}>
                  Tiêu đề phản hồi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tóm tắt ngắn gọn vấn đề hoặc ý tưởng của bạn..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d5dfdb', fontSize: '13px', background: '#fff' }}
                />
              </div>

              {/* Detailed Content */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '4px' }}>
                  Nội dung chi tiết *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể các bước dẫn đến lỗi, hoặc chi tiết tính năng bạn mong muốn OmniPlan có..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d5dfdb', fontSize: '13px', lineHeight: 1.5, background: '#fff', resize: 'vertical' }}
                />
              </div>

              {/* Screenshot Attachment */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '4px' }}>
                  Đính kèm ảnh chụp màn hình (tùy chọn)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px dashed #103b2d',
                    background: 'rgba(16, 59, 45, 0.04)',
                    color: '#103b2d',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    <Camera size={15} />
                    <span>Chọn ảnh minh họa</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>

                  {attachments.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ccc' }}>
                      <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f4f1ea', padding: '12px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ accentColor: '#103b2d', width: '16px', height: '16px' }}
                  />
                  <span>Góp ý ẩn danh (không hiển thị tên hoặc email của bạn)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={allowContact}
                    onChange={(e) => setAllowContact(e.target.checked)}
                    style={{ accentColor: '#103b2d', width: '16px', height: '16px' }}
                  />
                  <span>Cho phép Admin liên hệ lại khi vấn đề được giải quyết hoặc cần thêm thông tin</span>
                </label>
              </div>

              {/* Technical Diagnostics Info Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: '#666',
                background: '#ffffff',
                border: '1px solid #e2ddd5',
                padding: '10px 12px',
                borderRadius: '8px'
              }}>
                <ShieldCheck size={16} color="#103b2d" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  <strong>Thông tin kỹ thuật tự động đính kèm:</strong> {techInfo.appVersion} • {techInfo.browser} ({techInfo.os}) • Module: {techInfo.module}. Hệ thống cam kết tuyệt đối không thu thập mật khẩu, dữ liệu sức khỏe hay tài chính riêng tư.
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    color: '#666',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#103b2d',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: submitting ? 'default' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  <Send size={14} />
                  {submitting ? 'Đang gửi...' : 'Gửi góp ý'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

