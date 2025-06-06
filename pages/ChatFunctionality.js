// ChatFunctionality.js - Handles Text Chat
import React, { useState, useRef, useEffect } from 'react';

export default function ChatFunctionality({ onNewMessage, messages, theme = 'dark' }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);

  const isDark = theme === 'dark';
  const colors = {
    barBg: isDark ? '#242526' : '#fff',
    inputBg: 'transparent',
    inputText: isDark ? '#f5f6fa' : '#232323',
    icon: isDark ? '#a3a6f7' : '#3366ff',
    iconInactive: '#b0b3b8',
    border: isDark ? '#232323' : '#e3e6ea'
  };

  // Function to adjust textarea height
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of 120px
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Adjust height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setInput('');
    await onNewMessage({ role: 'user', content: input });
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      // Show the image in the chat
      onNewMessage({ role: 'user', image: reader.result });
      // Extract text in the background
      try {
        const Tesseract = (await import('tesseract.js')).default;
        const { data: { text } } = await Tesseract.recognize(reader.result, 'eng');
        console.log('Extracted OCR text:', text);
        await fetch('/api/ocr', { method: 'POST', body: JSON.stringify({ text }) });
        // Only send the extracted text as the last user message to the assistant
        if (text && text.trim()) {
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [
                  ...messages,
                  { role: 'user', content: text }
                ]
              }),
            });
            const data = await response.json();
            if (data.reply) {
              onNewMessage({ ...data.reply, timestamp: new Date().toISOString() });
            } else {
              console.error('No reply from assistant:', data.error || data);
            }
          } catch (err) {
            console.error('Error calling /api/chat:', err);
          }
        }
      } catch (error) {
        // Optionally handle OCR errors silently
        console.error('OCR error:', error);
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // Simple voice input implementation
  const startVoiceInput = () => {
    if (loading || isRecording) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsRecording(true);
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      if (transcript && transcript.trim()) {
        onNewMessage({ role: 'user', content: transcript });
      }
    };
    recognition.onerror = (event) => {
      setIsRecording(false);
      alert('Voice input error: ' + event.error);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 'auto',
        background: 'transparent',
        borderRadius: 24,
        boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.03)',
        padding: 8,
        border: `1px solid ${colors.border}`
      }}
    >
      {/* Text Input Field */}
      <div style={{ position: 'relative', width: '100%' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your message..."
          style={{
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            background: colors.inputBg,
            color: colors.inputText,
            borderRadius: 12,
            marginBottom: 8,
            boxSizing: 'border-box',
            minHeight: 40,
            maxHeight: 120,
            resize: 'none',
            fontFamily: 'system-ui, Arial, sans-serif',
            lineHeight: '1.5',
            overflowY: 'auto',
            transition: 'height 0.1s ease-out'
          }}
          disabled={loading}
          rows={1}
        />
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        {/* File Upload (Plus Icon) */}
        <label htmlFor="file-upload" style={{ cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', marginLeft: 10 }}>
          <img src="https://cdn.prod.website-files.com/672b6f241bec4fbad6b3dabb/68179183d51c9aa75a2f6ab1_plus-icon.svg" alt="Upload" style={{ height: 36, opacity: loading ? 0.5 : 1, filter: isDark ? undefined : 'invert(0.2)' }} />
        </label>
        <input id="file-upload" type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={loading} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginRight: 10 }}>
          {/* Voice Icon */}
          <img
            src="https://cdn.prod.website-files.com/672b6f241bec4fbad6b3dabb/681a739ad7b18bb458e64ff9_voice.svg"
            alt="Voice"
            title={isRecording ? 'Recording...' : 'Start voice input'}
            onClick={startVoiceInput}
            style={{
              height: 36,
              width: 36,
              cursor: loading || isRecording ? 'not-allowed' : 'pointer',
              opacity: loading || isRecording ? 0.5 : 1,
              filter: isDark ? undefined : 'invert(0.2)',
              background: isRecording ? '#ffe082' : 'transparent',
              borderRadius: isRecording ? 18 : 0,
              transition: 'background 0.2s'
            }}
          />

          {/* Send Icon */}
          <img
            src="https://cdn.prod.website-files.com/672b6f241bec4fbad6b3dabb/68179292b2a38845769b2d50_send.svg"
            alt="Send"
            title="Send Message"
            onClick={sendMessage}
            style={{
              height: 36,
              width: 36,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              filter: isDark ? undefined : 'invert(0.2)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
