import React, { useState, useCallback, useRef, useEffect } from 'react';
import ChatFunctionality from './ChatFunctionality';
import ReactMarkdown from 'react-markdown';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function extractKeyPoint(messages) {
  // Simple: pick the longest user message after intro
  const userMessages = messages.filter(m => m.role === 'user' && typeof m.content === 'string');
  if (userMessages.length <= 3) return '';
  const main = userMessages.slice(3).reduce((a, b) => (b.content.length > a.content.length ? b : a), { content: '' });
  return main.content;
}

function getSessionStats(messages, startTime) {
  const userMessages = messages.filter(m => m.role === 'user');
  const totalMessages = messages.length;
  const yourMessages = userMessages.length;
  let minutes = 0;
  if (messages.length > 1) {
    const first = new Date(messages[0].timestamp);
    const last = new Date(messages[messages.length - 1].timestamp);
    minutes = Math.max(1, Math.round((last - first) / 60000));
  }
  return { totalMessages, minutes, yourMessages };
}

// Map mood to a scale and label
function moodToValue(mood) {
  switch (mood) {
    case 'very negative': return 0;
    case 'negative': return 2;
    case 'neutral': return 5;
    case 'positive': return 8;
    case 'very positive': return 10;
    case 'very sad': return 0;
    case 'sad': return 2;
    case 'happy': return 8;
    case 'very happy': return 10;
    default: return mood === 'positive' ? 8 : mood === 'negative' ? 2 : 5;
  }
}
function moodToLabel(mood) {
  switch (mood) {
    case 'very negative': return 'Very Sad';
    case 'negative': return 'Sad';
    case 'neutral': return 'Neutral';
    case 'positive': return 'Happy';
    case 'very positive': return 'Very Happy';
    case 'very sad': return 'Very Sad';
    case 'sad': return 'Sad';
    case 'happy': return 'Happy';
    case 'very happy': return 'Very Happy';
    default: return mood.charAt(0).toUpperCase() + mood.slice(1);
  }
}

// Helper to get mood progression for all user messages
function getMoodProgression(messages) {
  // For demo, use sentiment scores from the backend if available, else fallback to neutral
  // In a real app, you might want to call the backend for all scores or store them in state
  const userMessages = messages.filter(m => m.role === 'user' && typeof m.content === 'string');
  // For now, just alternate between values for demo
  return userMessages.map((m, i) => {
    if (i === 0) return 2; // start
    if (i === userMessages.length - 1) return 8; // end
    return 5; // middle
  });
}

export default function Home() {
  const defaultMessage = {
    role: 'assistant',
    content: "Hi, I'm **Clamia**. I'm your AI therapist, trained to understand your emotions and provide personalized therapy sessions.\n\nWhat can I help you with today?",
    timestamp: new Date().toISOString()
  };
  const [messages, setMessages] = useState([defaultMessage]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [moodSummary, setMoodSummary] = useState(null);
  const [endingSession, setEndingSession] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [clientReportDate, setClientReportDate] = useState(null);
  const chatEndRef = useRef(null);
  const reportRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // Check if intro phase is complete (name, age, country)
  const introComplete = (() => {
    const userMessages = messages.filter(m => m.role === 'user' && typeof m.content === 'string');
    return userMessages.length >= 3;
  })();

  const handleNewMessage = useCallback(async (message) => {
    const newMessage = { ...message, timestamp: new Date().toISOString() };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    if (message.role === 'user') {
      setIsBotTyping(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, newMessage] }),
        });
        const data = await response.json();
        setIsBotTyping(false);
        if (data.reply) {
          setMessages(prevMessages => [...prevMessages, { ...data.reply, timestamp: new Date().toISOString() }]);
        }
      } catch {
        setIsBotTyping(false);
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
  }, [messages, isBotTyping]);

  // Set report date on client to avoid hydration error
  useEffect(() => {
    if (showSummary && !clientReportDate) {
      setClientReportDate(new Date());
    }
  }, [showSummary, clientReportDate]);

  // Theme colors (light mode for this UI)
  const colors = {
    background: '#f5f6fa',
    chatBg: '#fff',
    userBubble: '#19223a',
    botBubble: '#f5f6fa',
    text: '#232323',
    userText: '#fff',
    time: '#888',
    endSession: '#e57373', // soft red
    endSessionHover: '#d32f2f',
    summaryBg: '#fff',
    summaryBorder: '#e3e6ea',
    reportCard: '#fff',
    reportBorder: '#e3e6ea',
    reportStatBg: '#f7f7fa',
    reportStatText: '#232323',
    reportStatLabel: '#888',
    reportSenderUser: '#19223a',
    reportSenderBot: '#388e3c',
    reportButton: '#a3a6f7',
    reportButtonText: '#fff',
  };

  // End session handler
  const handleEndSession = async () => {
    setEndingSession(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await response.json();
      setMoodSummary({ startMood: data.startMood, endMood: data.endMood, keyPoint: extractKeyPoint(messages) });
      setShowSummary(true);
      setSessionEndTime(new Date());
    } catch {
      setMoodSummary({ error: 'Could not analyze mood.' });
      setShowSummary(true);
      setSessionEndTime(new Date());
    }
    setEndingSession(false);
  };

  // Download summary as PDF
  const handleDownloadSummary = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Calculate image dimensions to fit page
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save('session-summary.pdf');
  };

  // Start new session
  const handleStartNewSession = () => {
    setMessages([defaultMessage]);
    setMoodSummary(null);
    setShowSummary(false);
    setSessionEndTime(null);
  };

  // Session stats
  const stats = getSessionStats(messages, messages[0]?.timestamp);

  // Report date/time (use client-side date to avoid hydration error)
  const reportDate = clientReportDate || sessionEndTime || null;
  const reportDateString = reportDate
    ? `${reportDate.toLocaleDateString()} at ${reportDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  // Show welcome screen if not started
  if (showWelcome) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ background: '#ffff', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <img src="/clamia-logo-chat.png" alt="Clamia Logo" style={{ width: 80, height: 80 }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 30, color: '#232323', marginBottom: 8 }}>Welcome to Empatheia</div>
            <div style={{ color: '#888', fontSize: 16, marginBottom: 0 }}>Your AI therapy companion for emotional support and guidance</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '20px', margin: '0 auto 32px auto', maxWidth: 420, textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 18 }}>How Empatheia can help you:</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ background: '#b9a7f7', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, marginRight: 14 }}>1</div>
              <div style={{ color: '#232323', fontSize: 16 }}>Express your thoughts and feelings in a safe space</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ background: '#b9a7f7', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, marginRight: 14 }}>2</div>
              <div style={{ color: '#232323', fontSize: 16 }}>Receive supportive and thoughtful responses</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ background: '#b9a7f7', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, marginRight: 14 }}>3</div>
              <div style={{ color: '#232323', fontSize: 16 }}>Develop coping strategies for difficult situations</div>
            </div>
            <div style={{ color: '#888', fontSize: 14, marginTop: 18 }}>Note: Empatheia is not a substitute for professional mental health treatment.</div>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            style={{
              background: '#b9a7f7',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 48px',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 16,
              boxShadow: '0 2px 8px rgba(185,167,247,0.10)'
            }}
          >
            Start Chatting
          </button>
        </div>
      </div>
    );
  }

  // Render report if session ended
  if (showSummary && moodSummary) {
    // Mood bar values
    const startMoodValue = moodToValue(moodSummary.startMood);
    const endMoodValue = moodToValue(moodSummary.endMood);
    const startMoodLabel = moodToLabel(moodSummary.startMood);
    const endMoodLabel = moodToLabel(moodSummary.endMood);

    // Mood progression for chart
    const userMessages = messages.filter(m => m.role === 'user' && typeof m.content === 'string');
    const moodProgression = [startMoodValue, ...userMessages.slice(1, -1).map(() => 5), endMoodValue];
    const moodLabels = userMessages.map((m, i) => i === 0 ? 'Start' : (i === userMessages.length - 1 ? 'End' : `Msg ${i + 1}`));
    const chartData = {
      labels: moodLabels,
      datasets: [
        {
          label: 'Mood',
          data: moodProgression,
          fill: false,
          borderColor: '#4f8cff',
          backgroundColor: '#4f8cff',
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#4f8cff',
        },
      ],
    };
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const v = context.parsed.y;
              if (v <= 1) return 'Very Sad';
              if (v <= 3) return 'Sad';
              if (v <= 6) return 'Neutral';
              if (v <= 8) return 'Happy';
              return 'Very Happy';
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: {
            stepSize: 2,
            callback: function(value) {
              if (value === 0) return 'Very Sad';
              if (value === 2) return 'Sad';
              if (value === 5) return 'Neutral';
              if (value === 8) return 'Happy';
              if (value === 10) return 'Very Happy';
              return '';
            }
          },
          grid: { color: '#eee' }
        },
        x: {
          grid: { display: false }
        }
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          ref={reportRef}
          style={{
            background: colors.reportCard,
            border: `1px solid ${colors.reportBorder}`,
            borderRadius: 16,
            padding: '36px 32px 32px 32px',
            maxWidth: 800,
            width: '100%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            margin: 24
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 28, textAlign: 'center', marginBottom: 8 }}>Chat Session Report</div>
          <div style={{ textAlign: 'center', color: colors.time, marginBottom: 32 }}>Session completed on {reportDateString}</div>
          {/* Mood Tracking Chart */}
          <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Mood Tracking</div>
          <div style={{ background: '#f7f7fa', borderRadius: 16, padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 500, height: 220 }}>
              <Line data={chartData} options={chartOptions} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 500, marginTop: 16 }}>
              <div style={{ fontWeight: 600 }}>Start Mood: <span style={{ color: '#4f8cff' }}>{startMoodLabel}</span></div>
              <div style={{ fontWeight: 600 }}>End Mood: <span style={{ color: '#4f8cff' }}>{endMoodLabel}</span></div>
            </div>
          </div>
          {/* Stats Section */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 32 }}>
            <div style={{ background: colors.reportStatBg, borderRadius: 12, padding: '18px 32px', minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 28, color: colors.reportStatText }}>{stats.totalMessages}</div>
              <div style={{ color: colors.reportStatLabel, fontSize: 15, marginTop: 4 }}>Total Messages</div>
            </div>
            <div style={{ background: colors.reportStatBg, borderRadius: 12, padding: '18px 32px', minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 28, color: colors.reportStatText }}>{stats.minutes}</div>
              <div style={{ color: colors.reportStatLabel, fontSize: 15, marginTop: 4 }}>Minutes</div>
            </div>
            <div style={{ background: colors.reportStatBg, borderRadius: 12, padding: '18px 32px', minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 28, color: colors.reportStatText }}>{stats.yourMessages}</div>
              <div style={{ color: colors.reportStatLabel, fontSize: 15, marginTop: 4 }}>Your Messages</div>
            </div>
          </div>
          {/* Message History Table */}
          <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Message History</div>
          <div style={{ borderTop: `1px solid ${colors.reportBorder}` }}>
            <div style={{ display: 'flex', fontWeight: 600, color: colors.time, fontSize: 15, padding: '12px 0 8px 0' }}>
              <div style={{ width: 80 }}>Time</div>
              <div style={{ width: 100 }}>Sender</div>
              <div style={{ flex: 1 }}>Message</div>
            </div>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', fontSize: 15, padding: '8px 0', borderTop: idx === 0 ? 'none' : `1px solid ${colors.reportBorder}` }}>
                <div style={{ width: 80, color: colors.time }}>{formatTime(msg.timestamp)}</div>
                <div style={{ width: 100, color: msg.role === 'user' ? colors.reportSenderUser : colors.reportSenderBot, fontWeight: 600 }}>
                  {msg.role === 'user' ? 'You' : 'Clamia'}
                </div>
                <div style={{ flex: 1, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 340 }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, gap: 16 }}>
            <button
              onClick={handleStartNewSession}
              style={{
                background: colors.reportButton,
                color: colors.reportButtonText,
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(163,166,247,0.10)'
              }}
            >
              Start New Session
            </button>
            <button
              onClick={handleDownloadSummary}
              style={{
                background: '#eee',
                color: '#232323',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(163,166,247,0.10)'
              }}
            >
              Download Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render chat UI if session not ended
  return (
    <main style={{ minHeight: '100vh', background: colors.background, fontFamily: 'system-ui, Arial, sans-serif', padding: 0}}>
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
          overflow: 'hidden',
          position: 'relative'
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
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/clamia-logo-chat.png" alt="Clamia Logo" style={{ height: 40, marginRight: 10, borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, }}>Chat with Clamia</div>
              </div>
            </div>
            {/* End Session Button in header */}
            {introComplete && !showSummary && (
              <button
                onClick={handleEndSession}
                disabled={endingSession}
                style={{
                  background: colors.endSession,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 18,
                  padding: '8px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: endingSession ? 'not-allowed' : 'pointer',
                  opacity: endingSession ? 0.7 : 1,
                  marginLeft: 16,
                  boxShadow: '0 2px 8px rgba(229,115,115,0.10)',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = colors.endSessionHover}
                onMouseOut={e => e.currentTarget.style.background = colors.endSession}
              >
                {endingSession ? 'Analyzing...' : 'End Session'}
              </button>
            )}
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
            {/* Typing indicator */}
            {isBotTyping && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%'
              }}>
                <div style={{
                  background: colors.botBubble,
                  color: colors.text,
                  borderRadius: 16,
                  padding: '14px 18px',
                  maxWidth: '75%',
                  fontSize: 14,
                  wordBreak: 'break-word',
                  marginLeft: 0,
                  marginRight: 40,
                  position: 'relative',
                  boxShadow: '0 0px 1px black',
                  fontStyle: 'italic',
                  opacity: 0.7
                }}>
                  Clamia is typing...
                </div>
              </div>
            )}
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