'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

type Message = {
  role: 'user' | 'ai';
  content: string;
  time: string;
};

export default function Page() {
  const [activeTab, setActiveTab] = useState('chat');
  const [theme, setTheme] = useState('dark');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Chào buổi sáng! 🌅 Hôm nay mình sẽ giúp bạn tạo content gì?\n\nMình đã được nâng cấp lên mô hình Gemini 3.1 Pro mạnh mẽ nhất để hỗ trợ bạn viết script và lên chiến lược.',
      time: '08:14 AM'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    showToast(newTheme === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      role: 'user',
      content: inputValue.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const chatContents = messages.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      chatContents.push({ role: 'user', parts: [{ text: newUserMsg.content }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: chatContents,
        config: {
          systemInstruction: `Bạn là AI Creator chuyên tạo video storytelling dài 2–8 phút cho TikTok, đối tượng: Sinh viên + Gen Z + Dân văn phòng Việt Nam.
Mục tiêu: Biến cảm xúc user → content video truyền cảm hứng. Kể chuyện tổng hợp (ai cũng thấy mình trong đó). Giọng văn chữa lành, chân thật, không sáo rỗng. Có tip thực tế về học tập / dinh dưỡng / kỷ luật.
Không nói triết lý sáo rỗng. Không khoe thành công. Không tiêu cực cực đoan. Phải mang cảm giác: "Mình cũng từng như vậy…"`,
        }
      });

      if (!response.text) throw new Error('No response text');
      
      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.text as string,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Xin lỗi, có lỗi xảy ra khi kết nối với Gemini. Vui lòng thử lại sau.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const insertPrompt = (text: string) => {
    const prompts: Record<string, string> = {
      '✍️ Viết script': 'Viết full script cho video ',
      '🎯 Tối ưu hook': 'Tối ưu hook cho video của tôi: ',
      '📊 Phân tích trend': 'Phân tích trend TikTok hiện tại về ',
      '🎨 Caption ideas': 'Gợi ý 5 caption hấp dẫn cho video ',
      '🔄 Remix video': 'Remix idea từ video này thành format mới: ',
    };
    setInputValue(prompts[text] || '');
    inputRef.current?.focus();
  };

  return (
    <div id="app">
      {/* SIDEBAR */}
      <nav id="sidebar">
        <div className="sidebar-logo">✦</div>
        <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')} title="">
          💬<span className="nav-tooltip">Chat</span>
        </button>
        <button className={`nav-item ${activeTab === 'script' ? 'active' : ''}`} onClick={() => setActiveTab('script')} title="">
          📝<span className="nav-tooltip">Script Editor</span>
        </button>
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} title="">
          🎬<span className="nav-tooltip">Video Planning</span>
        </button>
        <button className="nav-item" onClick={toggleTheme} title="">
          🌙<span className="nav-tooltip">Toggle Theme</span>
        </button>
        <div className="sidebar-spacer"></div>
        <div className="offline-dot" style={{ background: 'var(--accent-warm)', boxShadow: '0 0 8px rgba(232,180,138,0.6)' }}></div>
        <div className="offline-label" style={{ fontSize: '9px', color: 'var(--text-muted)', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Online</div>
      </nav>

      {/* LEFT PANEL */}
      <aside id="left-panel">
        <div className="panel-header">
          <div className="panel-title">Workspace</div>
          <div className="panel-subtitle">Mood & Memory</div>
        </div>
        <div className="mood-section">
          <div className="mood-label">Current Mood</div>
          <div className="mood-display">
            <div className="mood-emoji" id="mood-emoji">😌</div>
            <div>
              <div className="mood-name" id="mood-name">Calm</div>
              <div className="mood-desc" id="mood-desc">Reflective & focused</div>
            </div>
          </div>
          <div className="emotion-slider-wrap">
            <div className="emotion-track">
              <input type="range" id="emotion-slider" min="0" max="100" defaultValue="40" />
            </div>
            <div className="emotion-labels">
              <span>😔 Low</span>
              <span>😌 Calm</span>
              <span>😄 Hyped</span>
              <span>🔥 Fire</span>
            </div>
          </div>
        </div>
        <div className="memory-section">
          <div className="memory-cal-header">
            <div className="cal-month">March 2026</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="cal-nav">‹</button>
              <button className="cal-nav">›</button>
            </div>
          </div>
          <div className="cal-grid" id="cal-grid">
            {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="cal-day-label">{d}</div>)}
            {[...Array(3)].map((_, i) => <div key={`empty-${i}`} className="cal-day empty"></div>)}
            {[...Array(31)].map((_, i) => {
              const d = i + 1;
              const isToday = d === 15;
              const hasMem = [5, 9, 12, 15].includes(d);
              return (
                <div key={d} className={`cal-day ${isToday ? 'today' : ''} ${hasMem && !isToday ? 'has-memory' : ''}`}>
                  {d}
                </div>
              );
            })}
          </div>
          <div style={{ height: '12px' }}></div>
          <div className="memory-list">
            <div className="memory-item" onClick={() => { setActiveTab('chat'); setInputValue('Nhắc lại về: Discussed storytelling hooks for lifestyle content'); }}>
              <div className="memory-date">Mar 12 — Tuesday</div>
              <div className="memory-text">Discussed storytelling hooks for lifestyle content</div>
              <span className="memory-tag">📹 Video Ideas</span>
            </div>
            <div className="memory-item" onClick={() => { setActiveTab('chat'); setInputValue('Nhắc lại về: Script for morning routine video approved'); }}>
              <div className="memory-date">Mar 9 — Saturday</div>
              <div className="memory-text">Script for morning routine video approved</div>
              <span className="memory-tag">✅ Completed</span>
            </div>
            <div className="memory-item" onClick={() => { setActiveTab('chat'); setInputValue('Nhắc lại về: Brand collab brief — TechFlow earbuds'); }}>
              <div className="memory-date">Mar 5 — Tuesday</div>
              <div className="memory-text">Brand collab brief — TechFlow earbuds</div>
              <span className="memory-tag">🤝 Brand Deal</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main id="main">
        <div id="screen-tabs">
          <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>💬 Chat</button>
          <button className={`tab-btn ${activeTab === 'script' ? 'active' : ''}`} onClick={() => setActiveTab('script')}>📝 Script</button>
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>🎬 Dashboard</button>
          <div className="tab-spacer"></div>
          <div className="model-badge">
            <div className="model-dot" style={{ background: 'var(--accent-warm)', boxShadow: '0 0 6px rgba(232,180,138,0.7)' }}></div>
            <span>Gemini 3.1 Pro · Online</span>
          </div>
        </div>

        {/* CHAT SCREEN */}
        <section id="chat-screen" className={`screen ${activeTab === 'chat' ? 'active' : ''}`}>
          <div id="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`msg-row ${msg.role === 'user' ? 'user' : ''}`}>
                <div className={`msg-avatar ${msg.role === 'ai' ? 'ai-av' : 'user-av'}`}>
                  {msg.role === 'ai' ? '✦' : '🎬'}
                </div>
                <div className="msg-content">
                  <div className={`bubble ${msg.role === 'ai' ? 'ai' : 'user'}`}>
                    {msg.content}
                  </div>
                  <div className="bubble-time">{msg.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="msg-row" id="typing-indicator">
                <div className="msg-avatar ai-av">✦</div>
                <div className="msg-content">
                  <div className="bubble ai typing-bubble">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="story-arc">
            <div className="arc-label">
              <span>Story Arc Progress</span>
              <span>Hook → Build → CTA</span>
            </div>
            <div className="arc-stages">
              <div className="arc-stage filled" title="Hook"></div>
              <div className="arc-stage filled" title="Problem"></div>
              <div className="arc-stage current" title="Build"></div>
              <div className="arc-stage" title="Climax"></div>
              <div className="arc-stage" title="CTA"></div>
            </div>
            <div className="arc-stage-labels">
              <div className="arc-stage-label">Hook</div>
              <div className="arc-stage-label">Problem</div>
              <div className="arc-stage-label">Build</div>
              <div className="arc-stage-label">Climax</div>
              <div className="arc-stage-label">CTA</div>
            </div>
          </div>

          <div id="input-area">
            <div className="quick-prompts">
              {['✍️ Viết script', '🎯 Tối ưu hook', '📊 Phân tích trend', '🎨 Caption ideas', '🔄 Remix video'].map(p => (
                <button key={p} className="qp-chip" onClick={() => insertPrompt(p)}>{p}</button>
              ))}
            </div>
            <div className="input-wrap">
              <textarea 
                id="chat-input" 
                ref={inputRef}
                rows={1} 
                placeholder="Nhắn tin với MUSE..." 
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
              />
              <div className="input-actions">
                <button className="input-btn" title="Voice">🎙️</button>
                <button className="input-btn" title="Attach">📎</button>
                <button className="send-btn" onClick={handleSendMessage} title="Send">↑</button>
              </div>
            </div>
          </div>
        </section>

        {/* SCRIPT SCREEN */}
        <section id="script-screen" className={`screen ${activeTab === 'script' ? 'active' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px 0', flexShrink: 0 }}>
            <input className="script-title-input" placeholder="Untitled Script..." defaultValue="5AM Club — 30 Day Challenge" />
            <div className="script-meta">
              <span className="script-tag">🎬 TikTok</span>
              <span className="script-tag">⏱ 60s</span>
              <span className="script-tag">😌 Calm</span>
            </div>
            <button className="btn-primary" onClick={() => showToast('Script saved!')}>💾 Save</button>
          </div>

          <div className="script-body" style={{ padding: '16px 24px', flex: 1, minHeight: 0 }}>
            <div className="script-panel">
              <div className="script-panel-header">
                <span className="script-panel-title">Script Editor</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-icon" onClick={() => showToast('✨ AI is improving your script...')}>✨ AI Improve</button>
                  <button className="btn-icon" onClick={() => showToast('📊 Words counted')}>📊 Words</button>
                </div>
              </div>
              <textarea id="script-editor" placeholder="Start typing your script..." defaultValue={`[HOOK - 0:00-0:03]\nTôi thức dậy lúc 5 giờ sáng trong 30 ngày liên tiếp...\n\n[PROBLEM - 0:03-0:08]\nNăng suất tăng 3x, nhưng có một điều tôi không ngờ tới.\n\n[BUILD - 0:08-0:45]\nNgày 1-7: Cực kỳ khó. Não tôi như đang bị tra tấn.\nNgày 8-15: Bắt đầu quen. Buổi sáng trở thành thời gian thiêng liêng.\nNgày 16-30: Flow state tự nhiên. Sáng tác ra ideas tốt nhất.\n\nSecret: Không phải việc dậy sớm giúp tôi productive.\nMà là ritual 2 tiếng đầu ngày — hoàn toàn không có điện thoại.\n\n[CTA - 0:45-0:60]\nBạn có dám thử 7 ngày không? Comment "5AM" để tôi guide bạn 👇`} />
              <div className="script-actions">
                <button className="btn-primary" onClick={() => showToast('🎬 Generating TikTok preview...')}>🎬 Generate Preview</button>
                <button className="btn-ghost" onClick={() => showToast('Copied to clipboard!')}>📋 Copy</button>
              </div>
            </div>

            <div className="script-panel">
              <div className="script-panel-header">
                <span className="script-panel-title">TikTok Preview</span>
                <button className="btn-icon">📱 9:16</button>
              </div>
              <div className="preview-panel">
                <div className="preview-tiktok">
                  <div className="preview-tiktok-bg"></div>
                  <div className="preview-text">
                    🌅 Tôi thức dậy lúc 5 giờ sáng trong 30 ngày liên tiếp...
                  </div>
                  <div className="preview-caption">
                    📌 5AM Club Challenge · #productivity #morning
                  </div>
                  <div className="preview-ui">
                    <div className="preview-ui-icon">❤️</div>
                    <div className="preview-ui-icon">💬</div>
                    <div className="preview-ui-icon">➡️</div>
                    <div className="preview-ui-icon">⋯</div>
                  </div>
                </div>
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hashtag Suggestions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {['#5amclub', '#productivity', '#morningroutine', '#selfdevelopment', '#vietnam'].map(tag => (
                      <span key={tag} className="script-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estimated Performance</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ background: 'var(--bg-glass)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-warm)' }}>87%</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Hook Score</div>
                    </div>
                    <div style={{ background: 'var(--bg-glass)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--pastel-sage)' }}>60s</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Duration</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD SCREEN */}
        <section id="dashboard-screen" className={`screen ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ overflowY: 'auto' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="dashboard-hero">
              <div>
                <div className="dashboard-greeting">Good morning, Creator ✦</div>
                <div className="dashboard-sub">You have 3 videos planned this week · 1 ready to publish</div>
              </div>
              <button className="gen-videos-btn" onClick={() => setShowGenModal(true)}>
                <span className="gen-icon">✨</span>
                Generate 3 Videos
              </button>
            </div>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon">🎬</div>
                <div className="stat-value">12</div>
                <div className="stat-label">Videos this month</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-value">7</div>
                <div className="stat-label">Scripts drafted</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💡</div>
                <div className="stat-value">34</div>
                <div className="stat-label">Ideas generated</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-value">18d</div>
                <div className="stat-label">Streak</div>
              </div>
            </div>

            <div>
              <div className="section-title">This Week's Pipeline</div>
              <div className="video-cards">
                <div className="video-card" onClick={() => setActiveTab('script')}>
                  <div className="video-thumb video-thumb-1">
                    🌅
                    <span className="video-status status-ready">● Ready</span>
                  </div>
                  <div className="video-info">
                    <div className="video-title">5AM Club — 30 Day Challenge</div>
                    <div className="video-meta">60s · Productivity · Mar 16</div>
                  </div>
                </div>
                <div className="video-card">
                  <div className="video-thumb video-thumb-2">
                    📵
                    <span className="video-status status-draft">◉ Draft</span>
                  </div>
                  <div className="video-info">
                    <div className="video-title">Phone-Free Morning Experiment</div>
                    <div className="video-meta">45s · Lifestyle · Mar 18</div>
                  </div>
                </div>
                <div className="video-card">
                  <div className="video-thumb video-thumb-3">
                    🖥️
                    <span className="video-status status-idea">○ Idea</span>
                  </div>
                  <div className="video-info">
                    <div className="video-title">Deep Work Setup Tour 2026</div>
                    <div className="video-meta">90s · Setup · Mar 20</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="section-title">Posting Schedule</div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>15</div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--accent-warm)', background: 'var(--accent-glow)', position: 'relative' }}>
                    16
                    <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-warm)' }}></div>
                  </div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>17</div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--pastel-sage)', position: 'relative' }}>
                    18
                    <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--pastel-sage)' }}></div>
                  </div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>19</div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--pastel-lavender)', position: 'relative' }}>
                    20
                    <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--pastel-lavender)' }}></div>
                  </div>
                  <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>21</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL */}
      <div className={`gen-result ${showGenModal ? 'show' : ''}`} id="gen-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowGenModal(false); }}>
        <div className="gen-result-box">
          <div className="gen-result-title">✨ 3 Video Ideas Generated</div>
          <div className="gen-result-sub">Based on your mood (Calm) and trending topics this week</div>
          <div className="gen-ideas">
            <div className="gen-idea">
              <div className="gen-idea-num">VIDEO 01 · TRENDING 🔥</div>
              <div className="gen-idea-title">"I deleted TikTok for 30 days" — Honest Review</div>
              <div className="gen-idea-desc">Counter-intuitive hook · High retention format · 60-90s</div>
            </div>
            <div className="gen-idea">
              <div className="gen-idea-num">VIDEO 02 · YOUR STYLE ✦</div>
              <div className="gen-idea-title">Morning Routine that changed my content strategy</div>
              <div className="gen-idea-desc">Calm cinematic vlog · Storytelling arc · 45-60s</div>
            </div>
            <div className="gen-idea">
              <div className="gen-idea-num">VIDEO 03 · HIGH ENGAGEMENT 📈</div>
              <div className="gen-idea-title">Tools I use to script 10 TikToks in 1 hour</div>
              <div className="gen-idea-desc">Value-first tutorial · List format · 60s</div>
            </div>
          </div>
          <div className="gen-result-actions">
            <button className="btn-ghost" onClick={() => setShowGenModal(false)}>Later</button>
            <button className="btn-primary" onClick={() => { setShowGenModal(false); showToast('✅ 3 ideas added to your pipeline!'); }}>✓ Add to Pipeline</button>
          </div>
        </div>
      </div>

      {/* TOAST */}
      <div className={`toast ${toastMsg ? 'show' : ''}`} id="toast">{toastMsg}</div>
    </div>
  );
}
