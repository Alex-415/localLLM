import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'chat_messages';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { 
      role: "user", 
      content: input,
      timestamp: Date.now()
    };
    
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/api/chat`);
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get response from server');
      }

      const data = await res.json();
      console.log('Response data:', data);

      if (!data.message) {
        throw new Error('Invalid response format from server');
      }

      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: data.message,
        timestamp: Date.now()
      }]);
    } catch (err: any) {
      console.error('Error in sendMessage:', err);
      setError(err.message || "Error contacting the model.");
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: err.message || "Error contacting the model.",
          timestamp: Date.now()
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="header-left">
          <span>KML Production</span>
        </div>
        <div className="header-right">
          <button 
            onClick={clearHistory}
            className="clear-history-button"
            title="Clear chat history"
          >
            Clear History
          </button>
        </div>
      </div>
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.role === "user" ? "user" : "assistant"}`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="chat-bubble assistant">Thinking...</div>}
        {error && <div className="chat-bubble assistant error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-textarea"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button 
          className="chat-send-button" 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
