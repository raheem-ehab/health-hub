import React, { useCallback, useEffect, useRef, useState } from 'react';
import './ChatBot.css';
import { getLocalReply } from '@/lib/chatResponder';

type StateName = 'START' | 'WAITING_FOR_EMAIL' | 'WAITING_FOR_FORGOT_EMAIL';

type ChatMessage = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  t: number;
};

const API_URL = 'http://localhost:3000/api/chat';

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function ChatBot(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [state, setState] = useState<StateName>('START');
  const [loading, setLoading] = useState(false);
  const [initialSent, setInitialSent] = useState(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const push = useCallback((sender: ChatMessage['sender'], text: string) => {
    const msg: ChatMessage = { id: genId(), sender, text, t: Date.now() };
    setMessages((s) => [...s, msg]);
    return msg;
  }, []);

  const callApi = useCallback(async (message: string, st: StateName) => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, state: st }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text().catch(() => 'Server error');
        throw new Error(text || `Status ${res.status}`);
      }

      const data = (await res.json()) as { reply: string; nextState: StateName };

      if (!mountedRef.current) return;

      push('bot', data.reply || '');
      setState((data.nextState as StateName) || 'START');
    } catch (err) {
      console.error('ChatBot error', err);
      if (mountedRef.current) push('bot', 'Error: Unable to contact server.');
      setState('START');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    if (open && !initialSent) {
      setInitialSent(true);
      // brief delay to allow UI to open
      setTimeout(() => callApi('', 'START'), 40);
    }
  }, [open, initialSent, callApi]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Try local small-talk responder first for greetings/thanks/how-are-you etc.
    try {
      const local = getLocalReply(text);
      if (local && local.reply && local.type !== 'fallback') {
        push('user', text);
        setInput('');
        // simulate typing delay
        setLoading(true);
        setTimeout(() => {
          push('bot', local.reply as string);
          setLoading(false);
        }, 400 + Math.random() * 600);
        return;
      }
    } catch (err) {
      console.error('Local responder error', err);
      // fall back to normal API call
    }

    push('user', text);
    setInput('');
    await callApi(text, state);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-root">
      {!open && (
        <button className="chatbot-fab" onClick={handleOpen} aria-label="Open Virtual Assistant">
          💬
        </button>
      )}

      {open && (
        <div className="chatbot-card" role="dialog" aria-label="Virtual Assistant">
          <div className="chatbot-header">
            <div className="chatbot-title">Virtual Assistant</div>
            <div className="chatbot-controls">
              <button className="chatbot-min" onClick={handleClose} aria-label="Close">_</button>
            </div>
          </div>

          <div className="chatbot-body" ref={scrollerRef}>
            {messages.length === 0 && <div className="chatbot-empty">No messages yet.</div>}
            {messages.map((m) => (
              <div key={m.id} className={`chatbot-msg ${m.sender === 'bot' ? 'bot' : 'user'}`}>
                {m.text.split('\n').map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            ))}
          </div>

          <div className="chatbot-input-area">
            <input
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={loading ? '...' : 'Write a message...'}
              aria-label="Message"
              disabled={loading}
            />
            <button className="chatbot-send" onClick={handleSend} disabled={!input.trim() || loading}>{loading ? '...' : 'Send'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
