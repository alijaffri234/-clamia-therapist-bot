// FileAttachmentFunctionality.js - Handles File Upload and OCR
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function FileAttachmentFunctionality({ onNewMessage, messages }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    onNewMessage({ role: 'system', content: 'Processing file...' });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const { data: { text } } = await Tesseract.recognize(reader.result, 'eng');
          onNewMessage({ 
            role: 'user', 
            content: `File content: ${text}` 
          });
        } catch (error) {
          console.error('OCR Error:', error);
          onNewMessage({ 
            role: 'system', 
            content: 'Error processing file. Please try again.' 
          });
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File reading error:', error);
      onNewMessage({ 
        role: 'system', 
        content: 'Error reading file. Please try again.' 
      });
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <input 
        type="file" 
        onChange={handleFileUpload}
        disabled={isProcessing}
        style={{ 
          padding: 8,
          border: '1px solid #ccc',
          borderRadius: 4,
          width: '80%'
        }}
      />
      {isProcessing && <span style={{ marginLeft: 10 }}>Processing...</span>}
    </div>
  );
}
