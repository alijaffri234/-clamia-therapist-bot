import React, { useState, useCallback, useRef, useEffect } from 'react';
import ChatFunctionality from './ChatFunctionality';
import ReactMarkdown from 'react-markdown';

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Home() {
  const defaultMessage = {
    role: 'assistant',
    content: "Hi, I'm **Clamia**. I'm your AI therapist, trained to understand your emotions and provide personalized therapy sessions.\n\nWhat can I help you with today?",
    timestamp: new Date().toISOString()
  };
  const [messages, setMessages] = useState([defaultMessage]);
  const chatEndRef = useRef(null);

  const handleNewMessage = useCallback(async (message) => {
    const newMessage = { ...message, timestamp: new Date().toISOString() };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    if (message.role === 'user') {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, newMessage] }),
        });
        const data = await response.json();
        if (data.reply) {
          setMessages(prevMessages => [...prevMessages, { ...data.reply, timestamp: new Date().toISOString() }]);
        }
      } catch {
        setMessages(prevMessages => [...prevMessages, {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Theme colors (light mode for this UI)
  const colors = {
    background: '#f5f6fa',
    chatBg: '#fff',
    userBubble: '#19223a',
    botBubble: '#f5f6fa',
    text: '#232323',
    userText: '#fff',
    time: '#888'
  };

  return (
    <main style={{ minHeight: '100vh', background: colors.background, fontFamily: 'system-ui, Arial, sans-serif', padding: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: colors.background
      }}>
        <div style={{
          background: colors.chatBg,
          borderRadius: 18,
          boxShadow: '0 12px 24px rgba(0,0,0,0.10)',
          maxWidth: 470,
          width: '100%',
          maxHeight: 580,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: '#19223a',
            color: '#fff',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}>
            <img src="/clamia-logo-chat.png" alt="Clamia Logo" style={{ height: 40, marginRight: 10, borderRadius: '50%' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Chat with Clamia</div>
            </div>
          </div>
          {/* Chat area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 18px 12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: colors.background,
            scrollbarWidth: 'inherit'
          }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    background: msg.role === 'user' ? colors.userBubble : colors.botBubble,
                    color: msg.role === 'user' ? colors.userText : colors.text,
                    borderRadius: 16,
                    padding: '14px 18px',
                    maxWidth: '75%',
                    fontSize: 14,
                    wordBreak: 'break-word',
                    marginLeft: msg.role === 'user' ? 40 : 0,
                    marginRight: msg.role === 'user' ? 0 : 40,
                    position: 'relative',
                    boxShadow: msg.role === 'user' ? '0 1px 4px rgba(25,34,58,0.10)' : '0 0px 1px black'
                  }}
                >
                  {msg.image ? (
                    <img src={msg.image} alt="Uploaded" style={{ maxWidth: '100%', borderRadius: 12 }} />
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
                <div style={{
                  fontSize: 12,
                  color: colors.time,
                  marginTop: 6,
                  marginBottom: 8,
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  maxWidth: '75%',
                  marginLeft: msg.role === 'user' ? 40 : 0,
                  marginRight: msg.role === 'user' ? 0 : 40
                }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {/* Input bar */}
          <div style={{ padding: '18px', background: colors.chatBg, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderTop: '1px solid #e3e6ea' }}>
            <ChatFunctionality onNewMessage={handleNewMessage} messages={messages} theme={'light'} />
          </div>
        </div>
      </div>
    </main>
  );
}