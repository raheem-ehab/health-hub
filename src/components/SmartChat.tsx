import React, { useCallback, useEffect, useRef, useState } from 'react';
import './SmartChat.css';

type Msg = { id: string; sender: 'user' | 'bot'; text: string };
const API = '/api/chat';
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export default function SmartChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOptions, setMenuOptions] = useState<Array<{key:string; label:string}>>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    try {
      let sid = localStorage.getItem('smartchatSessionId');
      if (!sid) {
        sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
        localStorage.setItem('smartchatSessionId', sid);
      }
      sessionIdRef.current = sid;
    } catch (e) {
      // Ignore localStorage errors; fallback to empty session id
      sessionIdRef.current = '';
    }
  }, []);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    // Show an initial helpful bot message when opened first time
    if (open && messages.length === 0) {
      addBotMessage('Hi — I am a demo Smart Assistant. Ask anything (admin contact, password reset, general info).');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addBotMessage = useCallback((text: string) => {
    const m: Msg = { id: genId(), sender: 'bot', text };
    setMessages(s => [...s, m]);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    const m: Msg = { id: genId(), sender: 'user', text };
    setMessages(s => [...s, m]);
  }, []);

  const send = useCallback(async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    addUserMessage(txt);
    setInput('');
    setLoading(true);
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (sessionIdRef.current) headers['x-session-id'] = sessionIdRef.current;
      const res = await fetch(API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: txt }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => 'Server error');
        throw new Error(t || `Status ${res.status}`);
      }
      const data = await res.json();
      const reply = data?.reply || 'No reply from assistant';
      addBotMessage(reply);
      // Parse menu options robustly (strip emoji or other glyphs, extract leading number and label)
      const parsed: Array<{key:string;label:string}> = [];
      const lines = reply.split('\n').map(l => l.trim()).filter(Boolean);
      for (const ln of lines) {
        // Try to extract a leading number (1-9) and the label that follows — avoid Unicode property escapes for compatibility
        const m = ln.match(/^\s*[^0-9A-Za-z\u0600-\u06FF]*?([1-9])(?:[)\.\-\s])?\s*(.+)$/u);
        if (m) {
          const key = m[1];
          // strip leading non-alphanumeric/Arabic symbols that may be emoji or glyphs
          const label = m[2].trim().replace(/^[^0-9A-Za-z\u0600-\u06FF]+/u, ''); // remove leading symbol glyphs
          parsed.push({ key, label });
        }
      }
      setMenuOptions(parsed);
    } catch (err: any) {
      console.error('SmartChat error', err);
      const serverMsg = err && err.message ? String(err.message) : null;
      if (serverMsg) {
        addBotMessage(`Error: ${serverMsg}`);
      } else {
        addBotMessage('Error: Unable to reach AI service. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, addUserMessage, addBotMessage]);

  // Send an instant option (menu button click)
  const sendOption = useCallback(async (optionKey: string) => {
    if (loading) return;
    const selection = optionKey.trim();
    // add user selection message
    addUserMessage(selection);
    setMenuOptions([]);
    setLoading(true);
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (sessionIdRef.current) headers['x-session-id'] = sessionIdRef.current;
      const res = await fetch(API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: selection }),
      });
      const data = await res.json();
      const reply = data?.reply || 'No reply from assistant';
      addBotMessage(reply);
      // parse menu again if returned (robust extraction)
      const parsed: Array<{key:string;label:string}> = [];
      const lines = reply.split('\n').map(l => l.trim()).filter(Boolean);
      for (const ln of lines) {
        const m = ln.match(/^\s*[^0-9A-Za-z\u0600-\u06FF]*?([1-9])(?:[)\.\-\s])?\s*(.+)$/u);
        if (m) {
          const key = m[1];
          const label = m[2].trim().replace(/^[^0-9A-Za-z\u0600-\u06FF]+/u, '');
          parsed.push({ key, label });
        }
      }
      setMenuOptions(parsed);
    } catch (err: any) {
      console.error('SmartChat error', err);
      addBotMessage('Error: Unable to reach AI service. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [addUserMessage, addBotMessage, loading]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="smartchat-root">
      {!open && (
        <button className="smartchat-fab" aria-label="Open Smart Assistant" onClick={() => setOpen(true)}>💬</button>
      )}

      {open && (
        <div className="smartchat-card" role="dialog" aria-label="Smart Assistant">
          <div className="smartchat-header">
            <div className="smartchat-title">Smart Assistant</div>
            <div className="smartchat-actions">
              <button className="smartchat-min" onClick={() => setOpen(false)}>_</button>
            </div>
          </div>

          <div className="smartchat-body" ref={scrollerRef}>
            {messages.map(m => (
              <div key={m.id} className={`smartchat-msg ${m.sender === 'user' ? 'user' : 'bot'}`}>
                {m.text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
              </div>
            ))}
          </div>

          {menuOptions.length > 0 && (
            <div className="smartchat-menu">
              {menuOptions.map(opt => (
                <button key={opt.key} className="smartchat-menu-btn" onClick={() => sendOption(opt.key)} aria-label={`${opt.key}. ${opt.label}`}>
                  <span className="smartchat-menu-num">{opt.key}</span>
                  <span className="smartchat-menu-label">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="smartchat-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={loading ? '...' : 'Type a message...'}
              aria-label="Message"
            />
            <button onClick={send} disabled={!input.trim() || loading}>{loading ? '...' : 'Send'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
