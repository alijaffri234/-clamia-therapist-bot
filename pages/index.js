
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi, I’m Clamia. What’s your name?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages })
    });

    const data = await res.json();
    setMessages([...updatedMessages, data.reply]);
  };

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1>🧠 Clamia – AI Therapist</h1>
      <div style={{ marginBottom: 20 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ background: msg.role === 'assistant' ? '#eee' : '#d0ebff', padding: 10, marginTop: 5 }}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type here..."
        style={{ width: '80%', padding: 10 }}
      />
      <button onClick={sendMessage} style={{ padding: 10, marginLeft: 10 }}>Send</button>
    </main>
  );
}
