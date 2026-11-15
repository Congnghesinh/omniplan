import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  Square,
  Paperclip,
  Image as ImageIcon,
  Camera,
  Bot,
  Copy,
  RotateCcw,
  Check,
  Volume2,
  Sparkles,
  ChevronDown,
  X,
  FileText,
  Smartphone,
  Plus,
  Trash2,
  Pin
} from 'lucide-react';
import { AIPersonalityId, ChatMessage, ActionCardProps } from '../../types/index.js';
import { ApiService } from '../../services/api.js';

interface AIChatViewProps {
  currentPersonalityId: AIPersonalityId;
  onChangePersonality: (id: AIPersonalityId) => void;
  personalities: any[];
  onActionExecuted?: () => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AIChatView: React.FC<AIChatViewProps> = ({
  currentPersonalityId,
  onChangePersonality,
  personalities,
  onActionExecuted,
  initialPrompt,
  onClearInitialPrompt
}) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await ApiService.getConversations();
      setConversations(convs);
      if (convs.length > 0) {
        const targetId = activeConvId || convs[0].id;
        setActiveConvId(targetId);
        loadMessages(targetId);
      } else {
        // Create initial conversation
        const newConv = await ApiService.createConversation('default_user', 'Cuộc trò chuyện chính', currentPersonalityId);
        setConversations([newConv]);
        setActiveConvId(newConv.id);
        loadMessages(newConv.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await ApiService.getMessages(convId);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle external initial prompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputText(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleNewConversation = async () => {
    const session = await ApiService.createConversation('default_user', 'Cuộc trò chuyện mới', currentPersonalityId);
    setConversations(prev => [session, ...prev]);
    setActiveConvId(session.id);
    setMessages([]);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      alert('Cần giữ lại ít nhất 1 cuộc trò chuyện.');
      return;
    }
    await ApiService.deleteConversation(convId);
    const remaining = conversations.filter(c => c.id !== convId);
    setConversations(remaining);
    if (activeConvId === convId) {
      setActiveConvId(remaining[0].id);
      loadMessages(remaining[0].id);
    }
  };

  // 1. Microphone Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          // Transcribe via API
          try {
            const result = await ApiService.transcribeAudio(base64Data, 'audio/webm');
            if (result && result.transcription) {
              setInputText(prev => prev ? `${prev} ${result.transcription}` : result.transcription);
            }
          } catch (err) {
            console.error('Audio transcription error:', err);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Không thể truy cập microphone. Vui lòng cấp quyền trong trình duyệt.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 2. Attachments Handling (Images & Documents)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const isImg = file.type.startsWith('image/');
      setAttachments(prev => [
        ...prev,
        {
          name: file.name,
          type: isImg ? 'image' : 'document',
          mimeType: file.type,
          base64Data: base64,
          previewUrl: isImg ? (reader.result as string) : undefined
        }
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 3. Text-to-Speech (TTS)
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 4. Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    const currentText = inputText.trim();
    const currentAttachments = [...attachments];

    setInputText('');
    setAttachments([]);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: currentText || (currentAttachments.length ? `[Gửi ${currentAttachments.length} tệp đính kèm]` : ''),
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      source: 'app',
      attachments: currentAttachments
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const response = await ApiService.sendChatMessage({
        conversationId: activeConvId,
        message: currentText,
        personalityId: currentPersonalityId,
        conversationHistory: history,
        attachments: currentAttachments
      });

      // Reload messages to get updated state from server
      await loadMessages(activeConvId);
      loadConversations();
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${err.message || 'Lỗi kết nối tới trợ lý AI.'}`,
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          source: 'app'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Action Execution
  const handleExecuteAction = async (actionId: string, payload: any) => {
    try {
      const res = await ApiService.executeAction(actionId, payload);
      if (res.success) {
        alert(`✅ ${res.message}`);
        if (onActionExecuted) onActionExecuted();
        // Update local message action status
        setMessages(prev =>
          prev.map(m => {
            if (m.actions) {
              const updated = m.actions.map(a => (a.id === actionId ? { ...a, status: 'executed' as const } : a));
              return { ...m, actions: updated };
            }
            return m;
          })
        );
      }
    } catch (e: any) {
      alert(`Lỗi thực hiện hành động: ${e.message}`);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentPersonality = personalities.find(p => p.id === currentPersonalityId) || personalities[0];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)', background: '#f8faf9' }}>
      {/* 1. Left Sidebar: Sessions */}
      <div style={{
        width: '280px',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <button
            onClick={handleNewConversation}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #103b2d',
              background: 'rgba(16, 59, 45, 0.04)',
              color: '#103b2d',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Cuộc trò chuyện mới
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <small style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase', paddingLeft: '8px' }}>
            Lịch sử hội thoại
          </small>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {conversations.map(conv => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(16, 59, 45, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                >
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#103b2d' : '#444',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {conv.title || 'Cuộc trò chuyện'}
                  </span>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '2px' }}
                    title="Xóa"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Chat Bar: Personality Switcher */}
        <div style={{
          padding: '12px 20px',
          background: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '24px' }}>{currentPersonality?.avatar || '🤖'}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '15px', color: '#103b2d' }}>{currentPersonality?.name}</strong>
                <span style={{ fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  Active
                </span>
              </div>
              <small style={{ fontSize: '11px', color: '#666' }}>{currentPersonality?.tone}</small>
            </div>
          </div>

          {/* Personality Quick Dropdown */}
          <select
            value={currentPersonalityId}
            onChange={(e) => onChangePersonality(e.target.value as AIPersonalityId)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '12px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#103b2d',
              cursor: 'pointer'
            }}
          >
            {personalities.map(p => (
              <option key={p.id} value={p.id}>
                {p.avatar} {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            const isZalo = msg.source === 'zalo';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Message Header Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11px', color: '#888' }}>
                  {isZalo ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#0068ff', fontWeight: 600 }}>
                      <Smartphone size={12} /> Zalo Bot
                    </span>
                  ) : (
                    <span>{isUser ? 'Bạn' : currentPersonality?.name || 'Trợ lý AI'}</span>
                  )}
                  <span>•</span>
                  <span>{new Date(msg.createdAt || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    background: isUser ? '#103b2d' : '#ffffff',
                    color: isUser ? '#ffffff' : '#222222',
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: isUser ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {/* Attachments preview */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {msg.attachments.map((att: any, idx: number) => (
                        <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                          {att.previewUrl || att.url ? (
                            <img src={att.previewUrl || att.url} alt="attachment" style={{ maxWidth: '180px', maxHeight: '120px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ padding: '6px 10px', background: '#eee', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={14} /> {att.name || 'Tài liệu'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.content}

                  {/* Interactive Action Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {msg.actions.map((act: ActionCardProps) => (
                        <div
                          key={act.id}
                          style={{
                            background: '#f8faf9',
                            border: '1px solid rgba(16, 59, 45, 0.2)',
                            borderRadius: '10px',
                            padding: '12px',
                            color: '#103b2d'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <Sparkles size={14} color="#103b2d" />
                            <strong style={{ fontSize: '13px' }}>Đề xuất thao tác ({act.payload.domain.toUpperCase()})</strong>
                          </div>
                          <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#444' }}>
                            {act.payload.description}
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {act.status === 'executed' ? (
                              <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> Đã thực hiện
                              </span>
                            ) : (
                              <button
                                onClick={() => handleExecuteAction(act.id, act.payload)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  background: '#103b2d',
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                Xác nhận lưu
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bubble Footer Action Buttons */}
                {!isUser && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                      title="Sao chép"
                    >
                      {copiedId === msg.id ? <Check size={13} color="#2e7d32" /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={() => speakText(msg.content)}
                      style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                      title="Đọc to (Voice TTS)"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
              <div style={{ fontSize: '18px' }}>{currentPersonality?.avatar || '🤖'}</div>
              <span>Trợ lý đang suy luận và phân tích dữ liệu...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Previews in Composer */}
        {attachments.length > 0 && (
          <div style={{ padding: '8px 20px', background: '#f0f4f2', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {attachments.map((att, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                {att.previewUrl ? <img src={att.previewUrl} alt="" style={{ width: '20px', height: '20px', objectFit: 'cover' }} /> : <FileText size={14} />}
                <span>{att.name}</span>
                <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Composer Bar */}
        <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Attachment Buttons */}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '8px' }}
              title="Đính kèm tệp / ảnh"
            >
              <Paperclip size={18} />
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '8px' }}
              title="Chụp ảnh từ camera"
            >
              <Camera size={18} />
            </button>

            {/* Microphone button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                background: isRecording ? '#ffebee' : 'none',
                border: 'none',
                color: isRecording ? '#c62828' : '#666',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%'
              }}
              title={isRecording ? 'Dừng ghi âm' : 'Ghi âm giọng nói (Speech-to-Text)'}
            >
              {isRecording ? <Square size={18} /> : <Mic size={18} />}
            </button>

            {/* Input Textarea */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? 'Đang ghi âm...' : 'Nhập tin nhắn hoặc yêu cầu (ví dụ: "Chi 45k ăn trưa và uống 350ml nước")...'}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '24px',
                border: '1px solid #ddd',
                fontSize: '14px',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: (!inputText.trim() && attachments.length === 0) || isLoading ? '#ccc' : '#103b2d',
                color: '#fff',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                cursor: (!inputText.trim() && attachments.length === 0) || isLoading ? 'default' : 'pointer'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
