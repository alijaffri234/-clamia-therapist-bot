// VoiceFunctionality.js - Handles Voice Input
import React, { useState } from 'react';

export default function VoiceFunctionality({ onNewMessage, messages }) {
  const [isRecording, setIsRecording] = useState(false);

  const startVoice = () => {
    setIsRecording(true);
    onNewMessage({ role: 'system', content: 'Voice recording started...' });
    
    // Mock voice recording for now
    setTimeout(() => {
      setIsRecording(false);
      onNewMessage({ 
        role: 'user', 
        content: 'This is a mock voice message. In a real implementation, this would contain the transcribed voice input.' 
      });
    }, 2000);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button 
        onClick={startVoice} 
        style={{ 
          padding: 8,
          backgroundColor: isRecording ? '#ff4444' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        {isRecording ? 'Recording...' : 'Start Voice Input'}
      </button>
    </div>
  );
}
