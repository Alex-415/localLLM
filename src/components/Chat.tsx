// src/components/Chat.tsx
import { useAuth } from '../contexts/AuthContext';
import { useState, useCallback } from 'react';
import './Chat.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatResponse = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    setError(null);
    setIsLoading(true);
    
    const userMessage: Message = { role: 'user', content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
  
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/chat`;
      console.log('Sending request to:', apiUrl);
      console.log('Request payload:', { messages: newMessages });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include',
        body: JSON.stringify({ messages: newMessages }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: apiUrl
        });
        
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check the server configuration.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else {
          throw new Error(errorData?.error || `Server error (${response.status}): ${response.statusText}`);
        }
      }
  
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.response) {
        throw new Error('Invalid response format from server');
      }

      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, user]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <span>KML Production</span>
        </div>
        <div className="user-info">
          <span>{user?.email}</span>
        </div>
      </div>
      
      <div className="chat-main">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="input-area">
          <input
            type="text"
            className="message-input"
            placeholder="Type your message..."
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const input = e.currentTarget;
                if (input.value.trim()) {
                  fetchChatResponse(input.value);
                  input.value = '';
                }
              }
            }}
          />
          <button
            className="send-button"
            onClick={(e) => {
              e.preventDefault();
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                fetchChatResponse(input.value);
                input.value = '';
              }
            }}
            disabled={isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;