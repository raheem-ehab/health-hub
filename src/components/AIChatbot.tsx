import React, { useCallback, useEffect, useRef, useState } from 'react';
import './AIChatbot.css';
import { getLocalReply } from '@/lib/chatResponder';

type Message = { id: string; sender: 'user' | 'bot'; text: string };

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  const push = useCallback((sender: Message['sender'], text: string) => {
    const m: Message = { id: genId(), sender, text };
    setMessages((s) => [...s, m]);
  }, []);

  const send = useCallback(() => {
    const msg = input.trim();
    if (!msg || loading) return;

    try {
      const local = getLocalReply(msg);
      if (local && local.reply) {
        push('user', msg);
        setInput('');
        setLoading(true);

        // fake typing delay
        setTimeout(() => {
          push('bot', local.reply as string);
          setLoading(false);
        }, 500 + Math.random() * 500);
      }
    } catch (err) {
      console.error('Local responder error', err);
      push('bot', 'ممكن توضّح أكتر؟ / I didn\'t get that');
      setLoading(false);
    }
  }, [input, loading, push]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="aichat-root">
      {!open && (
        <button className="aichat-fab" onClick={() => setOpen(true)} aria-label="Open AI Chat">
          🤖
        </button>
      )}

      {open && (
        <div className="aichat-card">
          <div className="aichat-header">
            <div className="aichat-title">AI Assistant</div>
            <button className="aichat-close" onClick={() => setOpen(false)} aria-label="Close">_</button>
          </div>

          <div className="aichat-body" ref={scrollerRef}>
            {messages.length === 0 && <div className="aichat-empty">Ask anything (Offline demo)</div>}
            {messages.map((m) => (
              <div key={m.id} className={`aichat-msg ${m.sender === 'bot' ? 'bot' : 'user'}`}>
                {m.text.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
              </div>
            ))}
          </div>

          <div className="aichat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={loading ? '...' : 'Type your message...'}
              aria-label="Message"
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()}>{loading ? '...' : 'Send'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
