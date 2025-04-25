import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I’m Clamia. What’s your name?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (userInput = null) => {
    const messageToSend = userInput || input;
    if (!messageToSend.trim()) return;

    const userMessage = { role: 'user', content: messageToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!userInput) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await res.json();
      const newMessages = [...updatedMessages, data.reply];
      setMessages(newMessages);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      padding: 20,
      maxWidth: 600,
      margin: 'auto',
      fontFamily: 'Arial, sans-serif',
      background: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
    }}>

      {/* Logo Section */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <img src="/clamia-logo.png" alt="Clamia Logo" style={{ height: 40 }} />
      </div>

      {/* Messages Display */}
      <div style={{
        background: '#fff',
        borderRadius: '10px',
        padding: 20,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        marginBottom: 20,
        minHeight: 300,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            background: msg.role === 'assistant' ? '#e9ecef' : '#cce5ff',
            padding: 12,
            margin: '10px 0',
            borderRadius: 8,
            maxWidth: '80%',
            display: 'block',
            textAlign: msg.role === 'assistant' ? 'left' : 'right',
            marginLeft: msg.role === 'assistant' ? '10px' : 'auto',
            marginRight: msg.role === 'user' ? '10px' : 'auto',
          }}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}
        />
        <button onClick={() => sendMessage()} disabled={loading} style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          background: '#007bff',
          color: 'white',
        }}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </main>
  );
}
