import React, { useState, useEffect } from 'react';
import {
  MessageSquarePlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ThumbsUp,
  Sparkles,
  Shield,
  Send,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Calendar,
  Lock,
  GitMerge,
  ChevronRight,
  ExternalLink,
  Award,
  X
} from 'lucide-react';
import { ApiService } from '../../services/api.js';
import {
  FeedbackItem,
  FeedbackReply,
  FeatureRequestItem,
  ProductChangelog,
  BetaBadge,
  FeedbackStatus,
  FeedbackPriority
} from '../../types/index.js';

interface FeedbackCenterViewProps {
  onOpenSubmitModal: () => void;
}

export const FeedbackCenterView: React.FC<FeedbackCenterViewProps> = ({ onOpenSubmitModal }) => {
  const [activeTab, setActiveTab] = useState<'my_feedbacks' | 'roadmap' | 'badges' | 'admin'>('my_feedbacks');

  // User Feedbacks
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [feedbackReplies, setFeedbackReplies] = useState<FeedbackReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Roadmap & Feature Requests
  const [featureRequests, setFeatureRequests] = useState<FeatureRequestItem[]>([]);
  const [changelogs, setChangelogs] = useState<ProductChangelog[]>([]);
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [featTitle, setFeatTitle] = useState('');
  const [featDesc, setFeatDesc] = useState('');
  const [featModule, setFeatModule] = useState('Công việc');

  // Badges
  const [badges, setBadges] = useState<BetaBadge[]>([]);

  // Admin Dashboard State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminFeedbacks, setAdminFeedbacks] = useState<FeedbackItem[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminFilterStatus, setAdminFilterStatus] = useState('all');
  const [adminFilterPriority, setAdminFilterPriority] = useState('all');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedAdminFb, setSelectedAdminFb] = useState<FeedbackItem | null>(null);
  const [adminInternalNotes, setAdminInternalNotes] = useState('');
  const [weeklyDigest, setWeeklyDigest] = useState<any>(null);
  const [showDigestModal, setShowDigestModal] = useState(false);

  useEffect(() => {
    loadMyFeedbacks();
    loadRoadmapAndFeatures();
    loadBadges();
  }, []);

  const loadMyFeedbacks = async () => {
    try {
      const data = await ApiService.getUserFeedbacks();
      setMyFeedbacks(data);
      if (data.length > 0 && !selectedFeedback) {
        loadFeedbackDetail(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFeedbackDetail = async (id: string) => {
    try {
      const res = await ApiService.getFeedbackDetail(id);
      setSelectedFeedback(res.feedback);
      setFeedbackReplies(res.replies || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRoadmapAndFeatures = async () => {
    try {
      const [feats, logs] = await Promise.all([
        ApiService.getFeatureRequests(),
        ApiService.getChangelogs()
      ]);
      setFeatureRequests(feats || []);
      setChangelogs(logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBadges = async () => {
    try {
      const res = await ApiService.getUserBadges();
      setBadges(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdminFeedbacks = async () => {
    try {
      const res = await ApiService.getAdminFeedbacks({
        status: adminFilterStatus !== 'all' ? adminFilterStatus : undefined,
        priority: adminFilterPriority !== 'all' ? adminFilterPriority : undefined,
        search: adminSearch.trim() || undefined
      });
      setAdminFeedbacks(res.feedbacks || []);
      setAdminStats(res.stats || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' || isAdminMode) {
      loadAdminFeedbacks();
    }
  }, [activeTab, isAdminMode, adminFilterStatus, adminFilterPriority, adminSearch]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedFeedback) return;

    setSendingReply(true);
    try {
      const reply = await ApiService.replyFeedback(selectedFeedback.id, {
        senderId: 'default_user',
        senderRole: 'user',
        senderName: 'Phạm Tuấn',
        message: replyText.trim()
      });
      setFeedbackReplies(prev => [...prev, reply]);
      setReplyText('');
    } catch (err: any) {
      alert(`Lỗi gửi phản hồi: ${err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleVoteFeature = async (id: string) => {
    try {
      const res = await ApiService.voteFeatureRequest(id);
      if (res.success) {
        setFeatureRequests(prev =>
          prev.map(f => (f.id === id ? { ...f, votesCount: res.votesCount } : f))
        );
        loadBadges();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featTitle.trim() || !featDesc.trim()) return;

    try {
      const newFeat = await ApiService.submitFeatureRequest({
        title: featTitle.trim(),
        description: featDesc.trim(),
        module: featModule,
        submittedBy: 'Phạm Tuấn'
      });
      setFeatureRequests(prev => [newFeat, ...prev]);
      setShowAddFeatureModal(false);
      setFeatTitle('');
      setFeatDesc('');
      loadBadges();
      alert('Đề xuất tính năng của bạn đã được gửi lên cộng đồng thành công!');
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Actions
  const handleAdminUpdateStatus = async (id: string, status: FeedbackStatus) => {
    try {
      await ApiService.updateAdminFeedback(id, { status });
      loadAdminFeedbacks();
      if (selectedAdminFb?.id === id) {
        setSelectedAdminFb(prev => (prev ? { ...prev, status } : null));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminUpdatePriority = async (id: string, priority: FeedbackPriority) => {
    try {
      await ApiService.updateAdminFeedback(id, { priority });
      loadAdminFeedbacks();
      if (selectedAdminFb?.id === id) {
        setSelectedAdminFb(prev => (prev ? { ...prev, priority } : null));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminSaveNotes = async () => {
    if (!selectedAdminFb) return;
    try {
      await ApiService.updateAdminFeedback(selectedAdminFb.id, { internalNotes: adminInternalNotes });
      alert('Đã lưu ghi chú nội bộ Admin!');
      loadAdminFeedbacks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminReplyUser = async (text: string) => {
    if (!selectedAdminFb || !text.trim()) return;
    try {
      await ApiService.replyFeedback(selectedAdminFb.id, {
        senderId: 'admin_omni',
        senderRole: 'admin',
        senderName: 'OmniPlan Core Team',
        message: text.trim()
      });
      alert('Đã gửi phản hồi chính thức cho người dùng!');
      loadFeedbackDetail(selectedAdminFb.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (adminFeedbacks.length === 0) return;
    const headers = ['Mã phản hồi', 'Tiêu đề', 'Người gửi', 'Module', 'Đánh giá', 'Trạng thái', 'Ưu tiên', 'Ngày gửi'];
    const rows = adminFeedbacks.map(f => [
      f.code,
      `"${f.title.replace(/"/g, '""')}"`,
      f.isAnonymous ? 'Ẩn danh' : f.userName,
      f.module,
      f.rating,
      f.status,
      f.priority,
      f.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omniplan_feedbacks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenWeeklyDigest = async () => {
    try {
      const res = await ApiService.getWeeklyFeedbackDigest();
      setWeeklyDigest(res);
      setShowDigestModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Status badges formatter
  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'received':
        return <span style={{ background: '#e1f5fe', color: '#0288d1', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Đã tiếp nhận</span>;
      case 'reviewing':
        return <span style={{ background: '#fff3e0', color: '#ef6c00', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Đang xem xét</span>;
      case 'in_progress':
        return <span style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Đang xử lý</span>;
      case 'resolved':
        return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Đã giải quyết</span>;
      case 'planned':
        return <span style={{ background: '#e0f2f1', color: '#00695c', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Đã lên kế hoạch</span>;
      case 'need_info':
        return <span style={{ background: '#fff8e1', color: '#f57f17', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Cần thêm thông tin</span>;
      case 'declined':
        return <span style={{ background: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Không thực hiện</span>;
    }
  };

  const getPriorityBadge = (p: FeedbackPriority) => {
    switch (p) {
      case 'critical':
        return <span style={{ background: '#b71c1c', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>CRITICAL</span>;
      case 'high':
        return <span style={{ background: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>High</span>;
      case 'medium':
        return <span style={{ background: '#fff3e0', color: '#ef6c00', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>Medium</span>;
      case 'low':
        return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>Low</span>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Otter Mascot */}
      <div style={{
        background: 'linear-gradient(135deg, #103b2d 0%, #1a5c47 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(16, 59, 45, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '40px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'grid',
            placeItems: 'center'
          }}>
            🦦🌱
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Trung tâm Góp ý & Hỗ trợ OmniPlan Beta
              </h2>
              <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                BETA 2.0
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9 }}>
              Lắng nghe và cải tiến sản phẩm mỗi ngày cùng cộng đồng người dùng thân thiết.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={onOpenSubmitModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#fef08a',
              color: '#854d0e',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <MessageSquarePlus size={16} /> Gửi góp ý / Báo lỗi
          </button>

          {/* Toggle Admin mode for testing / management */}
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isAdminMode ? '#dc2626' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
            title="Chuyển chế độ xem Admin"
          >
            {isAdminMode ? '🛡️ Thoát Admin' : '🛡️ Chế độ Admin'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('my_feedbacks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'my_feedbacks' ? '#103b2d' : 'transparent',
            color: activeTab === 'my_feedbacks' ? '#fff' : '#666',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Clock size={15} /> Phản hồi của tôi ({myFeedbacks.length})
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'roadmap' ? '#103b2d' : 'transparent',
            color: activeTab === 'roadmap' ? '#fff' : '#666',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <ThumbsUp size={15} /> Lộ trình & Bình chọn ({featureRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'badges' ? '#103b2d' : 'transparent',
            color: activeTab === 'badges' ? '#fff' : '#666',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Award size={15} /> Huy hiệu Beta Tester
        </button>

        {isAdminMode && (
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'admin' ? '#dc2626' : 'transparent',
              color: activeTab === 'admin' ? '#fff' : '#dc2626',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Shield size={15} /> Admin Dashboard ({adminStats?.total || adminFeedbacks.length})
          </button>
        )}
      </div>

      {/* 1. TAB: MY FEEDBACKS */}
      {activeTab === 'my_feedbacks' && (
        <div style={{ display: 'grid', gridTemplateColumns: myFeedbacks.length > 0 ? 'minmax(320px, 1fr) minmax(360px, 1.4fr)' : '1fr', gap: '20px' }}>
          {/* Feedbacks List */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#103b2d' }}>
              Lịch sử góp ý & Báo lỗi ({myFeedbacks.length})
            </h3>

            {myFeedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                <p style={{ margin: 0, fontSize: '13px' }}>Bạn chưa gửi phản hồi nào.</p>
                <button
                  onClick={onOpenSubmitModal}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#103b2d',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Gửi phản hồi đầu tiên
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myFeedbacks.map(f => {
                  const isSelected = selectedFeedback?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => loadFeedbackDetail(f.id)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: isSelected ? '#103b2d' : '#eee',
                        background: isSelected ? 'rgba(16, 59, 45, 0.04)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#103b2d' }}>
                          {f.code}
                        </span>
                        {getStatusBadge(f.status)}
                      </div>
                      <strong style={{ fontSize: '14px', color: '#222', display: 'block', marginBottom: '4px' }}>
                        {f.title}
                      </strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                        <span>Module: {f.module}</span>
                        <span>{new Date(f.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Feedback Detail & Reply Chat */}
          {selectedFeedback && (
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#103b2d', fontWeight: 700 }}>{selectedFeedback.code}</span>
                  {getStatusBadge(selectedFeedback.status)}
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 6px', color: '#103b2d' }}>
                  {selectedFeedback.title}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#444' }}>
                  {selectedFeedback.content}
                </p>

                {/* Attachments */}
                {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {selectedFeedback.attachments.map((img, i) => (
                      <img key={i} src={img} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Thread with Admin */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                <small style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>
                  Trao đổi & Phản hồi từ Admin ({feedbackReplies.length})
                </small>

                {feedbackReplies.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', margin: '10px 0' }}>
                    Đội ngũ OmniPlan đã tiếp nhận và đang xem xét phản hồi của bạn. Chúng mình sẽ phản hồi sớm tại đây nhé! 🦦🌱
                  </p>
                ) : (
                  feedbackReplies.map(rep => {
                    const isAdmin = rep.senderRole === 'admin';
                    return (
                      <div
                        key={rep.id}
                        style={{
                          background: isAdmin ? '#e8f5e9' : '#f5f5f5',
                          borderRadius: '10px',
                          padding: '12px',
                          border: '1px solid',
                          borderColor: isAdmin ? '#c8e6c9' : '#e0e0e0',
                          maxWidth: '90%',
                          alignSelf: isAdmin ? 'flex-start' : 'flex-end'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', gap: '10px' }}>
                          <strong style={{ color: isAdmin ? '#2e7d32' : '#103b2d' }}>
                            {isAdmin ? '🛡️ ' + rep.senderName : rep.senderName}
                          </strong>
                          <span style={{ color: '#888' }}>
                            {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#222' }}>
                          {rep.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* User Reply Input */}
              <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Bổ sung thêm thông tin hoặc trả lời Admin..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#103b2d',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: ROADMAP & COMMUNITY VOTING */}
      {activeTab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#103b2d' }}>
                Lộ trình Phát triển & Bình chọn Tính năng Cộng đồng
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                Bình chọn cho những tính năng bạn muốn xuất hiện sớm nhất trong OmniPlan
              </p>
            </div>

            <button
              onClick={() => setShowAddFeatureModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#103b2d',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Đề xuất Tính năng Mới
            </button>
          </div>

          {/* 3 Columns Kanban Roadmap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Column 1: Under Review */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef6c00' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Đang xem xét (Under Review)</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {featureRequests.filter(f => f.status === 'under_review').map(feat => (
                  <div key={feat.id} style={{ background: '#fcfcfc', border: '1px solid #eee', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#103b2d' }}>{feat.title}</strong>
                      <button
                        onClick={() => handleVoteFeature(feat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #103b2d',
                          background: 'rgba(16, 59, 45, 0.05)',
                          color: '#103b2d',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <ThumbsUp size={12} /> {feat.votesCount}
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                      {feat.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0288d1' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Đang phát triển (In Progress)</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {featureRequests.filter(f => f.status === 'in_progress').map(feat => (
                  <div key={feat.id} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#0369a1' }}>{feat.title}</strong>
                      <button
                        onClick={() => handleVoteFeature(feat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #0288d1',
                          background: '#fff',
                          color: '#0288d1',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <ThumbsUp size={12} /> {feat.votesCount}
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#444', lineHeight: 1.4 }}>
                      {feat.description}
                    </p>
                    {feat.targetRelease && (
                      <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', color: '#0288d1', fontWeight: 600 }}>
                        Dự kiến: {feat.targetRelease}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2e7d32' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Đã hoàn thành (Completed)</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
                  <strong style={{ fontSize: '14px', color: '#166534' }}>Tích hợp Zalo Bot 2 chiều</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#444', lineHeight: 1.4 }}>
                    Đã hoàn thành liên kết tài khoản qua mã OTP và đồng bộ tức thì số đo nước, cân nặng, chi tiêu.
                  </p>
                  <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', color: '#166534', fontWeight: 700 }}>
                    ✓ Đã ra mắt trong v2.0.0 Beta
                  </span>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
                  <strong style={{ fontSize: '14px', color: '#166534' }}>Hệ thống Đa tính cách AI Persona</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#444', lineHeight: 1.4 }}>
                    Hỗ trợ 11 tính cách khác nhau với thanh trượt cảm xúc tùy biến.
                  </p>
                  <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', color: '#166534', fontWeight: 700 }}>
                    ✓ Đã ra mắt
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Release Changelogs */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#103b2d' }}>
              Lịch sử Cập nhật Phiên bản (Release Changelog)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {changelogs.map(cl => (
                <div key={cl.version} style={{ borderLeft: '3px solid #103b2d', paddingLeft: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '15px', color: '#103b2d' }}>{cl.version}</strong>
                    <span style={{ fontSize: '11px', color: '#666' }}>({cl.releaseDate})</span>
                    <span style={{ fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {cl.tag}
                    </span>
                  </div>
                  <h5 style={{ margin: '4px 0 6px', fontSize: '13px', fontWeight: 600 }}>{cl.title}</h5>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
                    {cl.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: BETA BADGES */}
      {activeTab === 'badges' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#103b2d' }}>
              Chương trình Ghi nhận Đóng góp (Beta Tester Program)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              Huy hiệu vinh danh các thành viên tích cực trải nghiệm và góp ý giúp OmniPlan hoàn thiện
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {badges.map(b => (
              <div
                key={b.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: b.unlocked ? '#103b2d' : '#e5e7eb',
                  background: b.unlocked ? '#fdfbf7' : '#f9fafb',
                  opacity: b.unlocked ? 1 : 0.6,
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>{b.icon}</div>
                <strong style={{ fontSize: '15px', color: b.unlocked ? '#103b2d' : '#888', display: 'block', marginBottom: '6px' }}>
                  {b.name}
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                  {b.description}
                </p>
                {b.unlocked ? (
                  <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    ✓ Đã mở khóa
                  </span>
                ) : (
                  <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', background: '#eee', color: '#888', padding: '2px 8px', borderRadius: '10px' }}>
                    🔒 Chưa mở khóa
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB: ADMIN FEEDBACK DASHBOARD */}
      {activeTab === 'admin' && isAdminMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Admin Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Tổng số phản hồi</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#103b2d', marginTop: '4px' }}>
                {adminStats?.total || 0}
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Điểm hài lòng trung bình (CSAT)</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {adminStats?.avgRating || 5.0} <small style={{ fontSize: '14px', color: '#666' }}>/ 5.0 ⭐</small>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Chờ xử lý / Đang xem xét</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef6c00', marginTop: '4px' }}>
                {(adminStats?.statusCounts?.received || 0) + (adminStats?.statusCounts?.reviewing || 0)}
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Đã giải quyết</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#2e7d32', marginTop: '4px' }}>
                {adminStats?.statusCounts?.resolved || 0}
              </div>
            </div>
          </div>

          {/* Admin Toolbar & AI Digest */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã, tiêu đề, từ khóa..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', width: '220px' }}
              />

              <select
                value={adminFilterStatus}
                onChange={(e) => setAdminFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="received">Đã tiếp nhận</option>
                <option value="reviewing">Đang xem xét</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="planned">Đã lên kế hoạch</option>
              </select>

              <select
                value={adminFilterPriority}
                onChange={(e) => setAdminFilterPriority(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
              >
                <option value="all">Tất cả ưu tiên</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleOpenWeeklyDigest}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} /> Báo cáo AI Tuần
              </button>

              <button
                onClick={handleExportCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#103b2d',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={15} /> Xuất CSV
              </button>
            </div>
          </div>

          {/* Admin Table */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8faf9', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '12px 16px' }}>Mã & Tiêu đề</th>
                  <th style={{ padding: '12px' }}>Người gửi</th>
                  <th style={{ padding: '12px' }}>Module</th>
                  <th style={{ padding: '12px' }}>Đánh giá</th>
                  <th style={{ padding: '12px' }}>Ưu tiên</th>
                  <th style={{ padding: '12px' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {adminFeedbacks.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#103b2d', fontWeight: 700, display: 'block' }}>
                        {f.code}
                      </span>
                      <strong style={{ color: '#222' }}>{f.title}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {f.isAnonymous ? 'Ẩn danh' : f.userName}
                    </td>
                    <td style={{ padding: '12px' }}>{f.module}</td>
                    <td style={{ padding: '12px' }}>{f.rating} ⭐</td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={f.priority}
                        onChange={(e) => handleAdminUpdatePriority(f.id, e.target.value as FeedbackPriority)}
                        style={{ padding: '4px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '11px' }}
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={f.status}
                        onChange={(e) => handleAdminUpdateStatus(f.id, e.target.value as FeedbackStatus)}
                        style={{ padding: '4px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '11px' }}
                      >
                        <option value="received">Đã tiếp nhận</option>
                        <option value="reviewing">Đang xem xét</option>
                        <option value="in_progress">Đang xử lý</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="planned">Đã lên kế hoạch</option>
                        <option value="need_info">Cần thêm thông tin</option>
                        <option value="declined">Không thực hiện</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => {
                          setSelectedAdminFb(f);
                          setAdminInternalNotes(f.internalNotes || '');
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(16, 59, 45, 0.08)',
                          color: '#103b2d',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Admin Selected Feedback Modal / Inspection Drawer */}
          {selectedAdminFb && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 3000,
              padding: '16px'
            }}>
              <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#103b2d' }}>{selectedAdminFb.code}</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700 }}>{selectedAdminFb.title}</h3>
                  </div>
                  <button onClick={() => setSelectedAdminFb(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* AI Analysis Summary Box */}
                {selectedAdminFb.aiAnalysis && (
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6d28d9', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                      <Sparkles size={14} /> AI FEEDBACK INTELLIGENCE
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#333' }}>
                      {selectedAdminFb.aiAnalysis.summary}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                      <span>Sắc thái: <strong>{selectedAdminFb.aiAnalysis.sentiment}</strong></span>
                      <span>Ưu tiên gợi ý: <strong>{selectedAdminFb.aiAnalysis.suggestedPriority}</strong></span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}>Nội dung phản hồi:</label>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.6, background: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                    {selectedAdminFb.content}
                  </p>
                </div>

                {/* Diagnostics */}
                {selectedAdminFb.techInfo && (
                  <div style={{ marginBottom: '16px', background: '#f0f4f2', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', color: '#555' }}>
                    <strong>Thông tin thiết bị:</strong> {selectedAdminFb.techInfo.browser} • {selectedAdminFb.techInfo.os} ({selectedAdminFb.techInfo.deviceType}) • Module: {selectedAdminFb.techInfo.module} • Đường dẫn: {selectedAdminFb.techInfo.currentPath}
                  </div>
                )}

                {/* Internal Notes */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>
                    Ghi chú nội bộ (Chỉ Admin thấy):
                  </label>
                  <textarea
                    rows={3}
                    value={adminInternalNotes}
                    onChange={(e) => setAdminInternalNotes(e.target.value)}
                    placeholder="Nhập ghi chú kỹ thuật, task Jira/GitHub, hướng xử lý..."
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                  />
                  <button
                    onClick={handleAdminSaveNotes}
                    style={{ marginTop: '6px', padding: '6px 12px', borderRadius: '6px', background: '#103b2d', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Lưu ghi chú
                  </button>
                </div>

                {/* Reply to user */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>
                    Gửi phản hồi chính thức cho người dùng:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      id="adminReplyInput"
                      placeholder="Nhập câu trả lời gửi đến người dùng..."
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('adminReplyInput') as HTMLInputElement;
                        if (input && input.value) {
                          handleAdminReplyUser(input.value);
                          input.value = '';
                        }
                      }}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: '#2e7d32', color: '#fff', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Gửi trả lời
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Weekly Digest Modal */}
          {showDigestModal && weeklyDigest && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 3000,
              padding: '16px'
            }}>
              <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#6366f1" />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Báo cáo Tổng hợp Phản hồi Tuần (AI Digest)</h3>
                  </div>
                  <button onClick={() => setShowDigestModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ background: '#f5f3ff', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.6, color: '#333' }}>
                  {weeklyDigest.executiveSummary}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px' }}>Top Module gặp nhiều lỗi / góp ý nhất:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {weeklyDigest.topProblemModules.map((m: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px', fontSize: '12px' }}>
                        <span><strong>{m.module}</strong> ({m.commonIssue})</span>
                        <span style={{ fontWeight: 700, color: '#ef6c00' }}>{m.count} phản hồi</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px' }}>Đề xuất hành động từ AI:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.6, color: '#444' }}>
                    {weeklyDigest.recommendedActions.map((act: string, i: number) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Propose Feature Modal */}
      {showAddFeatureModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000,
          padding: '16px'
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: '#103b2d' }}>
              Đề xuất Tính năng Mới cho OmniPlan
            </h3>
            <form onSubmit={handleCreateFeature} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tiêu đề tính năng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đồng bộ 2 chiều với Google Calendar..."
                  value={featTitle}
                  onChange={(e) => setFeatTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mô tả chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tính năng này giúp giải quyết vấn đề gì của bạn và cộng đồng..."
                  value={featDesc}
                  onChange={(e) => setFeatDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Module liên quan</label>
                <select
                  value={featModule}
                  onChange={(e) => setFeatModule(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                >
                  <option value="Công việc">Công việc (Work)</option>
                  <option value="Học tập">Học tập (Learning)</option>
                  <option value="Sức khỏe">Sức khỏe (Health)</option>
                  <option value="Tài chính">Tài chính (Finance)</option>
                  <option value="Trợ lý AI">Trợ lý OmniAI</option>
                  <option value="Zalo Bot">Zalo Bot</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddFeatureModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#103b2d', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Gửi đề xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
