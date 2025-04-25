import { useState, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I’m Clamia. What’s your name?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMessages })
    });

    const data = await res.json();
    setMessages([...updatedMessages, data.reply]);

    // 🔊 Clamia speaks the reply aloud
    speakText(data.reply.content);

    setLoading(false);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript;
      setInput(speech);
    };

    recognition.start();
  };

  // 🔊 Voice Output Function
  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
  };

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1>🧠 Clamia – AI Therapist</h1>
      <div style={{ marginBottom: 20, minHeight: 200 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            background: msg.role === 'assistant' ? '#f1f1f1' : '#d0ebff',
            padding: 10, margin: '8px 0', borderRadius: 6
          }}>
            {msg.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type or use mic..."
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: '10px 15px' }}>
          {loading ? '...' : 'Send'}
        </button>
        <button onClick={handleVoiceInput} style={{ padding: '10px 15px' }}>
          🎤
        </button>
      </div>
      {listening && <p style={{ fontSize: 12, marginTop: 8 }}>Listening…</p>}
    </main>
  );
}
