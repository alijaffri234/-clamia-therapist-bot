import { useState, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hi, I'm <span style='color: #3366ff; font-weight: bold;'>Clamia</span>. I'm your AI therapist, trained to understand your emotions and provide personalized therapy sessions. <br/><br/>What can I help you with today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      simulateTyping(data.reply.content);  // Call the typing effect function here
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateTyping = (message) => {
    let index = 0;
    const typingInterval = setInterval(() => {
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        lastMessage.content = message.slice(0, index + 1);
        return [...prevMessages];
      });
      index++;
      if (index === message.length) clearInterval(typingInterval);
    }, 30);  // Adjusted speed to 30 for a faster typing effect
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
      
      {/* 👇 Updated to display the header logo */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <img src="/clamia-logo.png" alt="Clamia Logo" style={{ height: 40, marginRight: 10 }} />
      </div>

      <div style={{
        background: 'none',  // Removed background color from the bubbles
        padding: 20,
        marginBottom: 20,
        minHeight: 300,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: 12,
            margin: '10px 0',
            borderRadius: 8,
            maxWidth: '80%',
            display: 'inline-block',
            textAlign: msg.role === 'assistant' ? 'left' : 'right',
            marginLeft: msg.role === 'assistant' ? '10px' : 'auto',
            marginRight: msg.role === 'user' ? '10px' : 'auto',
            backgroundColor: msg.role === 'assistant' ? '#e9ecef' : '#cce5ff', // Adjust color here
          }}>
            {/* Logo added beside the assistant's message */}
            {msg.role === 'assistant' && <img src="/clamia-logo-chat.png" alt="Clamia Logo" style={{ height: 20, marginRight: 10, verticalAlign: 'middle' }} />}
            <span dangerouslySetInnerHTML={{ __html: msg.content }} />
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
