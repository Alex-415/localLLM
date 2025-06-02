import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'chat_messages';
const API_BASE_URL = import.meta.env.PROD ? 'https://localllm.onrender.com' : '';

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

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response";

      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: reply,
        timestamp: Date.now()
      }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "Error contacting the model.",
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <button 
          onClick={clearHistory}
          className="clear-history-button"
          title="Clear chat history"
        >
          Clear History
        </button>
        <span>KML Production</span>
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
        {loading && <div className="chat-bubble assistant">...</div>}
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
        <button className="chat-send-button" onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
