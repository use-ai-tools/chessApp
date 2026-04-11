import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ChatBot() {
  const { user, token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am the Chess Arena support assistant. How can I help you today?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Don't render for logged out users to save tokens + logic
  if (!user) return null;

  const sendMessage = async () => {
    if (!inputVal.trim()) return;

    const userMsg = { role: 'user', content: inputVal };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!res.ok) {
        throw new Error('Failed to get a response');
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the server right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-chess-green hover:bg-emerald-500 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl z-50 transition-transform active:scale-95 animate-bounce-in"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl flex flex-col z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="bg-navy-800 p-4 border-b border-navy-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h3 className="font-bold text-white text-sm">Chess Support</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">✖</button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-navy-900/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-chess-green text-white rounded-tr-none'
                    : 'bg-navy-800 text-slate-200 rounded-tl-none border border-navy-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="px-4 py-3 rounded-2xl text-sm bg-navy-800 text-slate-400 rounded-tl-none border border-navy-700 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-navy-800 border-t border-navy-700 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 bg-navy-900 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-chess-green transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputVal.trim()}
              className="w-9 h-9 flex items-center justify-center bg-chess-green text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
