import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Chat.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const Chat: React.FC = () => {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Get the base URL from environment or use window.location
      const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const apiUrl = `${baseUrl}/api/chat`;

      console.log('=== API Request Configuration ===');
      console.log('Environment:', {
        mode: import.meta.env.MODE,
        viteApiUrl: import.meta.env.VITE_API_URL,
        windowOrigin: window.location.origin,
        windowHref: window.location.href,
        windowProtocol: window.location.protocol,
        windowHost: window.location.host,
        windowHostname: window.location.hostname,
        windowPort: window.location.port
      });
      console.log('Request Details:', {
        baseUrl,
        apiUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        body: {
          messages: [...messages, userMessage]
        }
      });
      console.log('=============================');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      console.log('=== API Response Details ===');
      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        type: response.type,
        redirected: response.redirected,
        ok: response.ok
      });
      console.log('==========================');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('=== API Error Details ===');
        console.error({
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: apiUrl,
          headers: Object.fromEntries(response.headers.entries()),
          requestUrl: window.location.href,
          requestOrigin: window.location.origin
        });
        console.error('========================');
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data || !data.response) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from API');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-left">
          <span>KML Production</span>
        </div>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={() => signOut()} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      <main className="chat-main">
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="message-input"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            className="send-button"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
};

export default Chat; 