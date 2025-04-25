import { useState, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I’m Clamia. What’s your name?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // track if mic is recording
  const [recordingTime, setRecordingTime] = useState(0); // track recording time
  const [micButtonColor, setMicButtonColor] = useState('#ccc'); // mic button color change

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

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
      speakText(data.reply.content);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => {
      setListening(true);
      setIsRecording(true);
      setMicButtonColor('red'); // change mic button color to red
    };
    recognition.onerror = () => {
      setListening(false);
      setIsRecording(false);
      setMicButtonColor('#ccc'); // reset mic button color to default
    };
    recognition.onend = () => {
      setListening(false);
      setIsRecording(false);
      setMicButtonColor('#ccc'); // reset mic button color to default
    };

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript;
      sendMessage(speech);
    };

    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false); // Stop recording manually
    setMicButtonColor('#ccc'); // Reset mic button color
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = 1;

    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  return (
    <main style={{
      padding: 20,
      maxWidth: 600,
      margin: 'auto',
      fontFamily: 'Arial, sans-serif',
      background: '#f8f9fa',
      minHeight: '100vh'
    }}>

      {/* 👇 Replace this with your logo image */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <img src="/clamia-logo.png" alt="Clamia Logo" style={{ height: 40 }} />
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '10px',
        padding: 20,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        marginBottom: 20,
        minHeight: 300
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
            <span dangerouslySetInnerHTML={{ __html: msg.content }} />
          </div>
        ))}
        {isSpeaking && (
          <div style={{ color: '#666', fontSize: 13, marginTop: 5 }}>
            🔊 Clamia is speaking...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type or use mic..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
        />
        <button onClick={() => sendMessage()} disabled={loading} style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          background: '#007bff',
          color: 'white'
        }}>
          {loading ? '...' : 'Send'}
        </button>
        <button onClick={handleVoiceInput} style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: micButtonColor
        }}>
          🎤
        </button>
        <button onClick={stopRecording} style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: '#ff4747'
        }}>
          Stop
        </button>
      </div>

      {listening && <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>🎙️ Listening…</p>}
      {isRecording && <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>⏱️ Recording... {recordingTime}s</p>}
    </main>
  );
}
