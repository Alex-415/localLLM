// src/components/Chat.tsx
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchChatResponse = async (message: string) => {
    if (!message.trim()) return;
  
    const userMessage: Message = { role: 'user', content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
  
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });
  
      if (!response.ok) {
        console.error('API Response:', response); // log the response
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const responseBody = await response.json();
      console.log('Chat response:', responseBody);
      // any handling of response
    } catch (error) {
      console.error('Chat error:', error); // witness catch errors and analyze
      throw new Error(`API error: ${error}`);
    }
  };

  return (
    <div className="chat-container">
      {/* Add your chat UI here */}
    </div>
  );
};

export default Chat;