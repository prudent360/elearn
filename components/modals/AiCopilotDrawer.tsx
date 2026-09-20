'use client';

import { useState } from 'react';
import { Send, Bot } from 'lucide-react';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiCopilotDrawer({ isOpen, onClose }: AiCopilotDrawerProps) {
  const [messages, setMessages] = useState<Array<{ text: string; from: 'user' | 'bot' }>>([
    {
      text: "👋 Hi Alex! I'm your workspace copilot. Ask me to summarize lesson notes, explain complex code concepts, or generate practice quizzes.",
      from: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, from: 'user' }]);
    setIsThinking(true);

    setTimeout(() => {
      let reply = "I'm a simulated copilot in this preview workspace. Ask me to 'summarize this lesson', 'quiz me', or 'explain a concept' and I'll generate answers from your course data!";
      const q = userMsg.toLowerCase();
      if (q.includes('quiz')) {
        reply = "Quick practice quiz on Container Queries:\n1. What problem do container queries solve over viewport media queries?\n2. What CSS property creates a container context?\n3. How do subgrids inherit row sizing?";
      } else if (q.includes('summar')) {
        reply = "Summary of Container Queries & Modern Grid Systems:\nContainer queries allow component styles to adapt based on their parent element's inline size rather than the window width.";
      } else if (q.includes('explain') || q.includes('how')) {
        reply = "Container queries break your UI into self-contained modular components. Specify `container-type: inline-size` on a wrapper element, then write `@container (min-width: 400px)` inside!";
      }

      setMessages(prev => [...prev, { text: reply, from: 'bot' }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="modal-dialog"
        style={{
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          height: '520px',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot style={{ color: 'var(--accent-primary)', width: 22, height: 22 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Workspace AI Copilot</h3>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ marginLeft: 'auto' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={
                m.from === 'user'
                  ? {
                      alignSelf: 'flex-end',
                      maxWidth: '85%',
                      whiteSpace: 'pre-line',
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem'
                    }
                  : {
                      maxWidth: '85%',
                      whiteSpace: 'pre-line',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem'
                    }
              }
            >
              {m.text}
            </div>
          ))}
          {isThinking && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Thinking...</div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            type="text"
            placeholder="Ask anything about your courses..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)'
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSend}>
            <Send style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
