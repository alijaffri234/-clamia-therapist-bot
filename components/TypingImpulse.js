import React from 'react';

export default function TypingImpulse() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 32,
      padding: '0 12px'
    }}>
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
      <style jsx>{`
        .dot {
          height: 10px;
          width: 10px;
          margin: 0 3px;
          background-color: #7E3AED;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.4s infinite both;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); }
          40% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
} 