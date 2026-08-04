import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Toast System ────────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type} ${t.out ? 'out' : ''}`}>
          <span style={{ fontSize: 20 }}>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{t.title}</div>
            {t.message && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{t.message}</div>}
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Ripple Button ────────────────────────────────────────────────────────────
function RippleButton({ onClick, className, children, disabled, style }) {
  const btnRef = useRef(null);
  const handleClick = (e) => {
    if (disabled) return;
    const btn = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    onClick && onClick(e);
  };
  return (
    <button ref={btnRef} className={`ripple-container ${className || ''}`} onClick={handleClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (typeof value !== 'number') return;
    const step = Math.ceil(value / 20);
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, value);
      setDisplayed(cur);
      if (cur >= value) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="stat-card animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(148,163,184,0.7)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'white', lineHeight: 1 }}>
            {typeof value === 'number' ? displayed : value}
          </div>
          {sub && <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, background: `rgba(${color}, 0.15)`, borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────
function HistoryItem({ item, onLoad }) {
  const sentimentColor = { Positive: '#22c55e', Neutral: '#10b981', Negative: '#ef4444' };
  const sentimentEmoji = { Positive: '😃', Neutral: '😐', Negative: '😞' };
  return (
    <div className="history-item" onClick={() => onLoad(item)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{item.hcp_name || 'Unknown HCP'}</span>
        <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{item.interaction_date || 'No date'}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, background: 'rgba(16, 185, 129,0.2)', color: '#6ee7b7', borderRadius: 20, padding: '2px 8px' }}>{item.interaction_type}</span>
        {item.sentiment && (
          <span style={{ fontSize: 11, background: `rgba(${sentimentColor[item.sentiment]?.replace('#','') || '16, 185, 129'}, 0.15)`, color: sentimentColor[item.sentiment] || '#6ee7b7', borderRadius: 20, padding: '2px 8px' }}>
            {sentimentEmoji[item.sentiment]} {item.sentiment}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const EMPTY_FORM = {
    hcp_name: '', interaction_type: 'Meeting', interaction_date: '', interaction_time: '',
    attendees: '', topics_discussed: '', materials_shared: '', samples_distributed: '',
    sentiment: '', outcomes: '', follow_up_actions: ''
  };

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [prevFormData, setPrevFormData] = useState(EMPTY_FORM);
  const [updatedFields, setUpdatedFields] = useState({});
  const [messages, setMessages] = useState([{
    role: 'system', type: 'info',
    content: 'Hello! 👋 Describe your HCP interaction in natural language and I\'ll fill out the form for you. Try: "Met Dr. Aisha Khan today, discussed Product X efficacy, positive sentiment, gave 3 samples."'
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [totalLogged, setTotalLogged] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Count filled form fields for progress
  const filledFields = Object.values(formData).filter(v => v && v !== 'Meeting').length;
  const totalFields = Object.keys(formData).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  // Toast helpers
  const addToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message, out: false }]);
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t)), 3500);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3900);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Highlight updated fields from AI
  useEffect(() => {
    const updated = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== prevFormData[key] && formData[key]) updated[key] = true;
    });
    if (Object.keys(updated).length > 0) {
      setUpdatedFields(updated);
      setTimeout(() => setUpdatedFields({}), 1500);
    }
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSentimentChange = (val) => {
    setFormData(prev => ({ ...prev, sentiment: val }));
    addToast('info', `Sentiment set to ${val}`, '');
  };

  const handleSaveInteraction = async () => {
    if (!formData.hcp_name) {
      addToast('error', 'HCP Name required', 'Please fill in at least the HCP Name to save.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Save failed');
      const saved = await response.json();
      setHistory(prev => [{ ...formData, id: saved.id }, ...prev]);
      setTotalLogged(n => n + 1);
      addToast('success', 'Interaction Saved!', `Saved interaction with ${formData.hcp_name}`);
      setPrevFormData(formData);
      setFormData(EMPTY_FORM);
    } catch {
      // Fallback: save locally
      const localEntry = { ...formData, id: Date.now() };
      setHistory(prev => [localEntry, ...prev]);
      setTotalLogged(n => n + 1);
      addToast('success', 'Interaction Saved Locally', `Saved interaction with ${formData.hcp_name}`);
      setPrevFormData(formData);
      setFormData(EMPTY_FORM);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearForm = () => {
    setPrevFormData(formData);
    setFormData(EMPTY_FORM);
    addToast('info', 'Form Cleared', 'Ready for a new interaction log.');
  };

  const handleLoadHistory = (item) => {
    setPrevFormData(formData);
    setFormData({ ...EMPTY_FORM, ...item });
    setShowHistory(false);
    addToast('info', 'Interaction Loaded', `Loaded interaction with ${item.hcp_name}`);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');
    setIsLoading(true);
    const typingId = Date.now();
    setMessages(prev => [...prev, { role: 'system', type: 'typing', content: '', id: typingId }]);

    try {
      const response = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context: formData }),
      });
      if (!response.ok) throw new Error('Backend error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        const displayContent = (fullText.trim().startsWith('{') || fullText.trim().startsWith('```')) ? 'Processing...' : fullText;
        setMessages(prev => prev.map(m => m.id === typingId ? { ...m, content: displayContent } : m));
      }

      let data;
      try {
        let cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
        const lastIntentIdx = cleaned.lastIndexOf('"intent"');
        if (lastIntentIdx > 0) {
          const startIdx = cleaned.lastIndexOf('{', lastIntentIdx);
          if (startIdx !== -1) cleaned = cleaned.substring(startIdx);
        }
        data = JSON.parse(cleaned);
      } catch {
        setMessages(prev => prev.map(m => m.id === typingId ? { ...m, type: 'info' } : m));
        setIsLoading(false);
        return;
      }

      if (data.intent === 'reply') {
        setMessages(prev => prev.map(m => m.id === typingId ? { role: 'system', type: 'info', content: data.reply } : m));
        setIsLoading(false);
        return;
      }

      const now = new Date();
      setMessages(prev => prev.map(m => m.id === typingId ? {
        role: 'system', type: 'success',
        content: '✨ **Interaction parsed!** Form fields highlighted in blue have been auto-filled. Review and save when ready.'
      } : m));

      setPrevFormData(formData);
      setFormData(prev => ({
        ...prev, ...data,
        interaction_type: data.interaction_type || prev.interaction_type,
        sentiment: data.sentiment || prev.sentiment,
        interaction_date: data.interaction_date || now.toISOString().split('T')[0],
        interaction_time: data.interaction_time || now.toTimeString().split(' ')[0].substring(0, 5),
      }));
      addToast('success', 'Form Auto-Filled!', 'AI extracted and populated the form fields.');
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      setTimeout(() => {
        let extractedName = 'Dr. Smith';
        const nameMatch = userMsg.match(/Dr\.?\s+([A-Za-z]+)/i);
        if (nameMatch) extractedName = nameMatch[0];
        let extractedSentiment = 'Neutral';
        if (/positive/i.test(userMsg)) extractedSentiment = 'Positive';
        else if (/negative/i.test(userMsg)) extractedSentiment = 'Negative';
        let extractedSamples = '';
        const samplesMatch = userMsg.match(/(\d+)\s+samples?/i);
        if (samplesMatch) extractedSamples = `${samplesMatch[1]} samples`;
        
        let extractedTopic = '';
        const topicMatch = userMsg.match(/(?:topic|about)(?:\s+discussion)?(?:\s+is|\s+was)?\s+([a-zA-Z\s]+?)(?:\s+so|\s+and|\s+but|\.|$)/i);
        if (topicMatch) extractedTopic = topicMatch[1].trim();
        else extractedTopic = userMsg.length < 50 ? userMsg : '';

        const now = new Date();
        setPrevFormData(formData);
        setFormData(prev => ({
          ...prev, hcp_name: extractedName, topics_discussed: extractedTopic || prev.topics_discussed,
          materials_shared: /brochure/i.test(userMsg) ? 'Brochures' : prev.materials_shared,
          samples_distributed: extractedSamples || prev.samples_distributed,
          sentiment: extractedSentiment,
          interaction_date: now.toISOString().split('T')[0],
          interaction_time: now.toTimeString().split(' ')[0].substring(0, 5)
        }));
        setMessages(prev => [...prev, {
          role: 'system', type: 'success',
          content: '✨ **Interaction parsed!** Form fields have been auto-filled from your message. Review and save when ready.'
        }]);
        addToast('success', 'Form Auto-Filled!', 'AI extracted and populated the form fields.');
        setIsLoading(false);
      }, 1000);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const sentimentEmoji = { positive: '😃', neutral: '😐', negative: '😞' };
  const sl = formData.sentiment?.toLowerCase();

  const fieldClass = (name) => `crm-input ${formData[name] ? 'has-value' : ''} ${updatedFields[name] ? 'field-updated' : ''}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Animated Background */}
      <div className="app-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Toast System */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* ─── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="navbar" style={{ position: 'sticky', top: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '-0.3px' }}>AI CRM Healthcare</div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', marginTop: -2 }}>Pharma Sales Intelligence</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'history', label: `History (${history.length})`, icon: '📋' },
          ].map(tab => (
            <button key={tab.id} className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'history') setShowHistory(true); else setShowHistory(false); }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Admin</div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>Sales Rep</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129,0.4)' }}>A</div>
        </div>
      </nav>

      {/* ─── Hero Header Section ──────────────────────────────────────────────── */}
      <HeaderSection totalLogged={totalLogged} />

      {/* ─── Stats Bar ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <StatCard icon="📋" label="Total Logged" value={totalLogged} color="16, 185, 129" sub="this session" />
        <StatCard icon="🧑‍⚕️" label="HCP Name" value={formData.hcp_name || '—'} color="16, 185, 129" sub="current form" />
        <StatCard icon="📈" label="Form Filled" value={`${progress}%`} color="16,185,129" sub={`${filledFields}/${totalFields} fields`} />
        <StatCard icon="💬" label="AI Messages" value={messages.filter(m => m.role === 'user').length} color="52, 211, 153" sub="sent this session" />
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, padding: '16px 24px 24px', maxWidth: 1400, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: showHistory ? '1fr 340px 380px' : '1fr 380px', gap: 16, minHeight: 0 }}>

        {/* ═══ LEFT: Form Panel ════════════════════════════════════════════════ */}
        <div className="glass-panel animate-slide-left" style={{ borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Form Header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg, #6ee7b7, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Log HCP Interaction</h2>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginTop: 2 }}>Fill manually or let AI do it for you</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" style={{ padding: '8px 14px' }} onClick={handleClearForm}>
                  <span>🗑️</span> Clear
                </button>
                <RippleButton className="btn-primary" style={{ padding: '10px 20px' }} onClick={handleSaveInteraction} disabled={isSaving}>
                  {isSaving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Saving...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>💾</span> Save Interaction</div>
                  )}
                </RippleButton>
              </div>
            </div>
            {/* Progress Bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', fontWeight: 600 }}>FORM COMPLETENESS</span>
                <span style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 700 }}>{progress}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div className="form-progress-bar" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #10b981, #34d399, #34d399)' }} />
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={e => e.preventDefault()}>

              {/* Section: Interaction Details */}
              <div className="animate-slide-up stagger-1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129,0.8)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(148,163,184,0.8)' }}>Interaction Details</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="crm-label">HCP Name</label>
                    <input type="text" name="hcp_name" value={formData.hcp_name} onChange={handleInputChange} placeholder="Dr. John Smith..." className={fieldClass('hcp_name')} />
                  </div>
                  <div>
                    <label className="crm-label">Interaction Type</label>
                    <select name="interaction_type" value={formData.interaction_type} onChange={handleInputChange} className={fieldClass('interaction_type')}>
                      <option value="Meeting">🤝 Meeting</option>
                      <option value="Call">📞 Call</option>
                      <option value="Email">📧 Email</option>
                      <option value="Conference">🏛️ Conference</option>
                    </select>
                  </div>
                  <div>
                    <label className="crm-label">Date</label>
                    <input type="date" name="interaction_date" value={formData.interaction_date} onChange={handleInputChange} className={fieldClass('interaction_date')} />
                  </div>
                  <div>
                    <label className="crm-label">Time</label>
                    <input type="time" name="interaction_time" value={formData.interaction_time} onChange={handleInputChange} className={fieldClass('interaction_time')} />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label className="crm-label">Attendees</label>
                  <input type="text" name="attendees" value={formData.attendees} onChange={handleInputChange} placeholder="Names of all people present..." className={fieldClass('attendees')} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label className="crm-label">Topics Discussed</label>
                  <textarea rows={3} name="topics_discussed" value={formData.topics_discussed} onChange={handleInputChange} placeholder="Key discussion points, products, efficacy data..." className={fieldClass('topics_discussed')} style={{ resize: 'vertical' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <button type="button" className="btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}>
                      🎙️ Summarize from Voice Note
                    </button>
                    <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{formData.topics_discussed.length} chars</span>
                  </div>
                </div>
              </div>

              {/* Section: Materials & Samples */}
              <div className="animate-slide-up stagger-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153,0.8)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(148,163,184,0.8)' }}>Materials & Samples</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="crm-label">Materials Shared</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="text" name="materials_shared" value={formData.materials_shared} onChange={handleInputChange} placeholder="Brochures, studies..." className={fieldClass('materials_shared')} />
                    </div>
                    {formData.materials_shared && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {formData.materials_shared.split(',').map((m, i) => m.trim() && (
                          <span key={i} className="tag-chip">{m.trim()} <span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => {
                            const items = formData.materials_shared.split(',').filter((_, idx) => idx !== i).join(', ');
                            setFormData(prev => ({ ...prev, materials_shared: items }));
                          }}>×</span></span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="crm-label">Samples Distributed</label>
                    <input type="text" name="samples_distributed" value={formData.samples_distributed} onChange={handleInputChange} placeholder="e.g. 3 units of Drug X..." className={fieldClass('samples_distributed')} />
                  </div>
                </div>
              </div>

              {/* Section: Sentiment */}
              <div className="animate-slide-up stagger-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52, 211, 153,0.8)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(148,163,184,0.8)' }}>HCP Sentiment</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {['Positive', 'Neutral', 'Negative'].map(s => (
                    <div key={s} className={`sentiment-card ${sl === s.toLowerCase() ? `active-${s.toLowerCase()}` : ''}`} onClick={() => handleSentimentChange(s)}>
                      <span style={{ fontSize: 28 }}>{sentimentEmoji[s.toLowerCase()]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: sl === s.toLowerCase() ? 'white' : 'rgba(148,163,184,0.8)' }}>{s}</span>
                      {sl === s.toLowerCase() && <div style={{ width: 6, height: 6, borderRadius: '50%', background: s === 'Positive' ? '#22c55e' : s === 'Neutral' ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${s === 'Positive' ? '#22c55e' : s === 'Neutral' ? '#10b981' : '#ef4444'}` }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Outcomes & Follow-up */}
              <div className="animate-slide-up stagger-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.8)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(148,163,184,0.8)' }}>Outcomes & Follow-up</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="crm-label">Outcomes</label>
                    <textarea rows={2} name="outcomes" value={formData.outcomes} onChange={handleInputChange} placeholder="Key agreements reached, decisions made..." className={fieldClass('outcomes')} style={{ resize: 'vertical' }} />
                  </div>
                  <div>
                    <label className="crm-label">Follow-up Actions</label>
                    <textarea rows={2} name="follow_up_actions" value={formData.follow_up_actions} onChange={handleInputChange} placeholder="Next steps, scheduled meetings..." className={fieldClass('follow_up_actions')} style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* ═══ MIDDLE: History Panel (conditional) ═══════════════════════════ */}
        {showHistory && (
          <div className="glass-panel animate-slide-left" style={{ borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: 'white' }}>📋 Interaction History</h3>
                <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => setShowHistory(false)}>✕ Close</button>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>{history.length} saved interactions</div>
            </div>
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(148,163,184,0.5)', marginTop: 60, fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  No interactions saved yet.<br />Save one to see it here!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {history.map((item, i) => (
                    <HistoryItem key={item.id || i} item={item} onLoad={handleLoadHistory} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ RIGHT: AI Chat Panel ══════════════════════════════════════════ */}
        <div className="glass-panel animate-slide-right" style={{ borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Chat Header */}
          <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: '0 4px 15px rgba(16, 185, 129,0.4)', animation: isLoading ? 'pulse-glow 1.5s ease infinite' : 'none' }}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>AI Assistant</div>
                <div style={{ fontSize: 11, color: isLoading ? '#6ee7b7' : 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLoading ? '#22c55e' : 'rgba(148,163,184,0.4)', animation: isLoading ? 'pulse 1s ease infinite' : 'none' }} />
                  {isLoading ? 'Thinking...' : 'LangGraph Agent · Groq LLaMA'}
                </div>
              </div>
              <button className="btn-ghost" style={{ marginLeft: 'auto', padding: '6px 10px', fontSize: 11 }} onClick={() => {
                setMessages([{ role: 'system', type: 'info', content: 'Chat cleared. How can I help you log your next interaction?' }]);
                addToast('info', 'Chat Cleared', '');
              }}>🗑️</button>
            </div>
          </div>

          {/* Messages */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`animate-slide-up`}
                style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', animationDelay: `${idx * 0.04}s` }}>
                <div className={msg.role === 'user' ? 'bubble-user' : msg.type === 'success' ? 'bubble-success' : 'bubble-ai'}
                  style={{ padding: '12px 16px', fontSize: 13, lineHeight: 1.6 }}>
                  {msg.type === 'typing' ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 0' }}>
                      <div className="typing-dot-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      <div className="typing-dot-2" style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                      <div className="typing-dot-3" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length < 2 && (
            <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Met Dr. Khan, positive sentiment',
                'Gave 5 samples of Drug X',
                'Scheduled follow-up for next week',
              ].map(prompt => (
                <button key={prompt} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}
                  onClick={() => { setInputValue(prompt); inputRef.current?.focus(); }}>
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'rgba(255,255,255,0.06)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', padding: '10px 12px', transition: 'border-color 0.2s', boxShadow: 'none' }}
              onFocus={() => {}} onBlur={() => {}}>
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your interaction..."
                disabled={isLoading}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                  color: '#f1f5f9', fontSize: 13, fontFamily: 'Inter, sans-serif', lineHeight: 1.5, minHeight: 40, maxHeight: 120, paddingTop: 4
                }}
                className="custom-scrollbar"
              />
              <RippleButton
                className="btn-primary"
                style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}>
                {isLoading
                  ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                }
              </RippleButton>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(148,163,184,0.4)', marginTop: 8 }}>Press Enter to send · Shift+Enter for new line</div>
          </div>
        </div>

      </div>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}

// ─── Hero Header Section ─────────────────────────────────────────────────────
function HeaderSection({ totalLogged }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (n) => String(n).padStart(2, '0');
  const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`;
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{
      position: 'relative', zIndex: 10,
      maxWidth: 1400, margin: '0 auto', width: '100%',
      padding: '28px 24px 0'
    }}>
      <div style={{
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(16, 185, 129,0.12) 0%, rgba(52, 211, 153,0.08) 50%, rgba(52, 211, 153,0.06) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
        padding: '28px 36px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative glow blobs */}
        <div style={{
          position: 'absolute', top: -40, left: -40, width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129,0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -30, right: 80, width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Left – Titles & Pills */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Animated badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(16, 185, 129,0.2)', border: '1px solid rgba(16, 185, 129,0.4)',
            borderRadius: 20, padding: '4px 14px', marginBottom: 14
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: '#6ee7b7',
              boxShadow: '0 0 8px #6ee7b7', animation: 'pulse 1.5s ease infinite'
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6ee7b7', letterSpacing: '0.5px' }}>LIVE · AI-Powered CRM Platform</span>
          </div>

          <h1 style={{
            margin: '0 0 8px',
            fontSize: 32, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #ffffff 0%, #6ee7b7 50%, #f0abfc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Healthcare Professional<br />Interaction Hub
          </h1>
          <p style={{
            margin: '0 0 20px', fontSize: 14, color: 'rgba(148,163,184,0.85)',
            maxWidth: 480, lineHeight: 1.6
          }}>
            Streamline pharma sales workflows with AI-driven interaction logging,
            sentiment analysis, and intelligent follow-up recommendations.
          </p>

          {/* Quick-action pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: '🤖', label: 'AI Auto-Fill', color: '#10b981' },
              { icon: '📊', label: 'Live Analytics', color: '#34d399' },
              { icon: '🔔', label: 'Smart Follow-ups', color: '#34d399' },
              { icon: '🔒', label: 'HIPAA Compliant', color: '#22c55e' },
            ].map(pill => (
              <div key={pill.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: `rgba(${pill.color === '#10b981' ? '16, 185, 129' : pill.color === '#34d399' ? '52, 211, 153' : pill.color === '#34d399' ? '52, 211, 153' : '34,197,94'}, 0.12)`,
                border: `1px solid ${pill.color}40`,
                borderRadius: 20, padding: '5px 14px',
                fontSize: 12, fontWeight: 600, color: pill.color,
                transition: 'all 0.2s ease', cursor: 'default'
              }}>
                <span>{pill.icon}</span> {pill.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right – Live Clock & Session Info */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16
        }}>
          {/* Live Clock */}
          <div style={{
            background: 'rgba(0,0,0,0.25)', borderRadius: 20, padding: '20px 28px',
            border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 38, fontWeight: 800,
              letterSpacing: '4px', color: 'white',
              background: 'linear-gradient(135deg, #6ee7b7, #f0abfc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>{timeStr}</div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 4, fontWeight: 500 }}>{dateStr}</div>
          </div>

          {/* Session Stats */}
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Interactions', value: totalLogged, icon: '📋' },
              { label: 'AI Agent', value: 'Active', icon: '🟢' },
              { label: 'Backend', value: 'Online', icon: '⚡' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      position: 'relative', zIndex: 10,
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(16px)',
      marginTop: 24
    }}>
      {/* Main Footer Grid */}
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: '40px 32px 28px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
        gap: 40
      }}>
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #34d399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
            }}>🏥</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>AI CRM Healthcare</div>
              <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>Pharma Sales Intelligence</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, margin: '0 0 18px', maxWidth: 280 }}>
            An intelligent, AI-powered CRM system for pharmaceutical sales reps.
            Log, manage, and analyze HCP interactions with natural language.
          </p>
          {/* Social / links */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: '📖', label: 'Docs' },
              { icon: '💡', label: 'API' },
              { icon: '🐙', label: 'GitHub' },
            ].map(s => (
              <button key={s.label} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'rgba(148,163,184,0.8)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(148,163,184,0.5)', marginBottom: 16 }}>Quick Links</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📊', label: 'Dashboard' },
              { icon: '📋', label: 'History' },
              { icon: '📁', label: 'Reports' },
              { icon: '⚙️', label: 'Settings' },
              { icon: '❓', label: 'Help Center' },
            ].map(link => (
              <div key={link.label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'rgba(148,163,184,0.7)', cursor: 'pointer',
                transition: 'color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#6ee7b7'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.7)'}
              >
                <span>{link.icon}</span> {link.label}
              </div>
            ))}
          </div>
        </div>

        {/* AI Tools */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(148,163,184,0.5)', marginBottom: 16 }}>AI Tools</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🔍', label: 'Log Interaction' },
              { icon: '✏️', label: 'Edit Interaction' },
              { icon: '📜', label: 'Search History' },
              { icon: '💡', label: 'Follow-up AI' },
              { icon: '📅', label: 'Schedule Meeting' },
            ].map(tool => (
              <div key={tool.label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'rgba(148,163,184,0.7)', cursor: 'pointer',
                transition: 'color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#f0abfc'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.7)'}
              >
                <span>{tool.icon}</span> {tool.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(148,163,184,0.5)', marginBottom: 16 }}>Tech Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'React 19', color: '#61DAFB', bg: 'rgba(97,218,251,0.12)' },
              { label: 'FastAPI', color: '#009688', bg: 'rgba(0,150,136,0.12)' },
              { label: 'LangGraph', color: '#6ee7b7', bg: 'rgba(165,180,252,0.12)' },
              { label: 'Groq LLaMA', color: '#f0abfc', bg: 'rgba(240,171,252,0.12)' },
              { label: 'PostgreSQL', color: '#336791', bg: 'rgba(51,103,145,0.15)' },
              { label: 'TailwindCSS', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
            ].map(tech => (
              <span key={tech.label} style={{
                background: tech.bg, border: `1px solid ${tech.color}40`,
                color: tech.color, borderRadius: 20, padding: '3px 10px',
                fontSize: 11, fontWeight: 600
              }}>{tech.label}</span>
            ))}
          </div>
          {/* Status indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Backend API', status: 'Operational', ok: true },
              { label: 'AI Agent (LangGraph)', status: 'Operational', ok: true },
              { label: 'Database', status: 'Operational', ok: true },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.ok ? '#22c55e' : '#ef4444', animation: 'pulse 1.5s ease infinite' }} />
                  <span style={{ fontSize: 11, color: s.ok ? '#6ee7b7' : '#fca5a5', fontWeight: 600 }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 32px',
        maxWidth: 1400, margin: '0 auto', width: '100%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>
          © {year} <span style={{ color: '#6ee7b7', fontWeight: 600 }}>AI CRM Healthcare</span>. Built for educational & assessment purposes.
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy Policy', 'Terms of Service', 'HIPAA Notice'].map(link => (
            <span key={link} style={{
              fontSize: 11, color: 'rgba(148,163,184,0.4)', cursor: 'pointer',
              transition: 'color 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#6ee7b7'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.4)'}
            >{link}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>
          <span>Powered by</span>
          <span style={{ color: '#f0abfc', fontWeight: 700 }}>Groq LLaMA 3.1</span>
          <span>·</span>
          <span style={{ color: '#6ee7b7', fontWeight: 700 }}>LangGraph</span>
        </div>
      </div>
    </footer>
  );
}