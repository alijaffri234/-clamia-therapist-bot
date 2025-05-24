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
import TypingImpulse from '../components/TypingImpulse';

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
    default:
      if (!mood || typeof mood !== 'string') return 'Unknown';
      return mood.charAt(0).toUpperCase() + mood.slice(1);
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

function formatMessageContent(content) {
  if (typeof content !== 'string') {
    return '';
  }
  // Add spacing after headings
  content = content.replace(/(#+ .+)/g, '\n$1\n');
  
  // Add spacing around lists
  content = content.replace(/(\n[-*]\s.+)/g, '\n$1');
  
  // Add spacing around paragraphs
  content = content.replace(/\n\n/g, '\n\n');
  
  // Add spacing after blockquotes
  content = content.replace(/(> .+)/g, '$1\n');
  
  return content;
}

function OnboardingForm({ onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    country: '',
    therapyType: '',
    religion: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [animating, setAnimating] = useState(false);

  const genderOptions = [
    { value: '', label: 'Select your gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-Binary' },
    { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
  ];
  const therapyOptions = [
    { value: '', label: 'Select therapy type' },
    { value: 'anxiety', label: 'Anxiety' },
    { value: 'depression', label: 'Depression' },
    { value: 'relationship', label: 'Relationship' },
    { value: 'stress', label: 'Stress' },
    { value: 'grief', label: 'Grief' },
    { value: 'self_esteem', label: 'Self-Esteem' },
    { value: 'family_therapy', label: 'Family Therapy' },
    { value: 'career_counseling', label: 'Career Counseling' },
    { value: 'other', label: 'Other' },
  ];
  const religionOptions = [
    { value: '', label: 'Select your religion' },
    { value: 'christianity', label: 'Christianity' },
    { value: 'islam', label: 'Islam' },
    { value: 'hinduism', label: 'Hinduism' },
    { value: 'buddhism', label: 'Buddhism' },
    { value: 'judaism', label: 'Judaism' },
    { value: 'none', label: 'None' },
    { value: 'other', label: 'Other' },
  ];

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.age.trim() || isNaN(form.age) || +form.age < 1) errs.age = 'Valid age required';
    if (!form.gender) errs.gender = 'Gender is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const validateStep2 = () => {
    const errs = {};
    if (!form.country.trim()) errs.country = 'Country is required';
    if (!form.therapyType) errs.therapyType = 'Type of therapy is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setAnimating(true);
      setTimeout(() => {
        setStep(2);
        setAnimating(false);
      }, 250);
    }
  };
  const handleBack = (e) => {
    e.preventDefault();
    setAnimating(true);
    setTimeout(() => {
      setStep(1);
      setAnimating(false);
    }, 250);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep2()) onComplete(form);
  };

  // Add a reusable icon style
  const iconStyle = { display: 'flex', alignItems: 'center', color: '#7E3AED', minWidth: 20 };

  return (
    <div style={{ minHeight: '100vh', background: '#f6faff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'system-ui, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 896, textAlign: 'center', fontFamily: 'system-ui, Arial, sans-serif' }}>
        <img src="/clamia-logo-chat.png" alt="Clamia Logo" style={{ width: 48, height: 48, borderRadius: '16px', marginBottom: 18, marginTop: 8 }} />
        <div style={{ fontWeight: 600, fontSize: 34, color: '#232323', marginBottom: 8 }}>Begin Your Healing Journey</div>
       <div style={{ color: '#6b7a90', fontSize: 18, marginBottom: 50 }}>Take the first step toward better mental well-being with personalized AI therapy.</div>
        <div className="clamia-onboarding-cards" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 50, flexWrap: 'wrap' }}>
          <div className="onboarding-card" style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: '1 1 0px', textAlign: 'left', border: '1px solid #e3e6ea', fontFamily: 'system-ui, Arial, sans-serif' }}>
            <div className="card-title" style={{ fontWeight: 600, color: '#232323', marginBottom: 18 }}><span style={{ color: '#7E3AED', marginRight: 6 }}>🛡️</span>Confidential Sessions</div>
            <div style={{ color: '#6b7a90', fontSize: 15 }}>Your conversations are private and secure. Share openly without judgment.</div>
          </div>
          <div className="card personalized-guidance" style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flex: '1 1 0px', textAlign: 'left', border: '1px solid #e3e6ea', fontFamily: 'system-ui, Arial, sans-serif' }}>
            <div className="card-title" style={{ fontWeight: 600, color: '#232323', marginBottom: 18 }}><span style={{ color: '#7E3AED', marginRight: 6 }}>✔️</span>Personalized Guidance</div>
            <div style={{ color: '#6b7a90', fontSize: 15 }}>Receive tailored advice based on your specific needs and situation.</div>
          </div>
        </div> 
        <style jsx>{`
          @media (max-width: 600px) {
            .clamia-onboarding-cards {
              flex-direction: column !important;
              gap: 16px !important;
              margin-bottom: 32px !important;
            }
          }
        `}</style>
        <form style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '32px 24px', margin: '0 auto', maxWidth: 556, textAlign: 'left', borderTop: '4px solid #7E3AED', position: 'relative', minHeight: 340, transition: 'all 0.3s', opacity: animating ? 0.5 : 1, fontFamily: 'system-ui, Arial, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step === 1 ? '#7E3AED' : '#e3e6ea', color: step === 1 ? '#fff' : '#232323', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, transition: 'background 0.3s' }}>1</div>
              <div style={{ width: 32, height: 2, background: '#e3e6ea' }} />
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step === 2 ? '#7E3AED' : '#e3e6ea', color: step === 2 ? '#fff' : '#232323', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, transition: 'background 0.3s' }}>2</div>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, textAlign: 'center' }}>Tell Us About Yourself</div>
          <div style={{ color: '#6b7a90', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>Help us personalize your therapy experience.</div>
          {step === 1 && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={iconStyle}>
                    {/* User SVG icon */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
                    </svg>
                  </span> Name
                </label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter your name" style={{ width: '95%', padding: 12, borderRadius: 8, border: '1px solid #e3e6ea', marginTop: 6, fontSize: 15, background: '#fff', fontFamily: 'system-ui, Arial, sans-serif' }} />
                {errors.name && <div style={{ color: '#e57373', fontSize: 13, marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={iconStyle}>
                    {/* Calendar SVG icon */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="3" />
                      <path d="M16 3v4M8 3v4M3 9h18" />
                    </svg>
                  </span> Age
                </label>
                <input name="age" type="number" min="1" value={form.age} onChange={handleChange} placeholder="Enter your age" style={{ width: '95%', padding: 12, borderRadius: 8, border: '1px solid #e3e6ea', marginTop: 6, fontSize: 15, background: '#fff', fontFamily: 'system-ui, Arial, sans-serif' }} />
                {errors.age && <div style={{ color: '#e57373', fontSize: 13, marginTop: 4 }}>{errors.age}</div>}
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={iconStyle}>
                    {/* Gender SVG icon (user circle) */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
                    </svg>
                  </span> Gender
                </label>
                <select name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e3e6ea', marginTop: 6, fontSize: 15, background: '#fff', fontFamily: 'system-ui, Arial, sans-serif' }}>
                  {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {errors.gender && <div style={{ color: '#e57373', fontSize: 13, marginTop: 4 }}>{errors.gender}</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={handleNext} style={{ background: '#7E3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', width: '100%', maxWidth: 300, fontWeight: 700, fontSize: 17, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(126,58,237,0.08)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  Continue <span style={{ marginLeft: 0, transform: 'rotate(45deg)', display: 'inline-flex', alignItems: 'center' , marginTop: 1 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginTop: 3 }}>
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </span>
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={iconStyle}>
                    {/* Globe SVG icon */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <ellipse cx="12" cy="12" rx="10" ry="4" />
                    </svg>
                  </span> Country
                </label>
                <input name="country" value={form.country} onChange={handleChange} placeholder="Enter your country" style={{ width: '95%', padding: 12, borderRadius: 8, border: '1px solid #e3e6ea', marginTop: 6, fontSize: 15, background: '#fff', fontFamily: 'system-ui, Arial, sans-serif' }} />
                {errors.country && <div style={{ color: '#e57373', fontSize: 13, marginTop: 4 }}>{errors.country}</div>}
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={iconStyle}>
                    {/* Chat bubble SVG icon */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="12" rx="4" />
                      <path d="M8 19l2-2h4l2 2" />
                    </svg>
                  </span> Type of Therapy
                </label>
                <select name="therapyType" value={form.therapyType} onChange={handleChange} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e3e6ea', marginTop: 6, fontSize: 15, background: '#fff', fontFamily: 'system-ui, Arial, sans-serif' }}>
                  {therapyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {errors.therapyType && <div style={{ color: '#e57373', fontSize: 13, marginTop: 4 }}>{errors.therapyType}</div>}
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={iconStyle}>
                    {/* Lotus SVG icon for religion */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M12 2c1.5 2.5 4 7 4 10a4 4 0 1 1-8 0c0-3 2.5-7.5 4-10z" />
                      <path d="M12 22c-4-2-7-6-7-10 0-2.5 2-5 7-5s7 2.5 7 5c0 4-3 8-7 10z" />
                    </svg>
                  </span> Religion (Optional)
                </label>
                <select name="religion" value={form.religion} onChange={handleChange} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e3e6ea', marginTop: 6, fontSize: 15, background: '#fff', fontFamily: 'system-ui, Arial, sans-serif' }}>
                  {religionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={iconStyle}>
                    {/* Note SVG icon for description */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M8 8h8M8 12h8M8 16h4" />
                    </svg>
                  </span> Brief Description of Your Situation (Optional)
                </label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Please briefly describe what brings you here today..." style={{ width: '95%', resize: 'none',padding: 12, borderRadius: 8, border: '1px solid #e3e6ea', marginTop: 6, minHeight: 70, fontSize: 15, background: '#fff', fontFamily: 'system-ui, Arial, sans-serif' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexFlow: 'wrap', marginTop: 8 }}>
                <button onClick={handleBack} style={{ background: '#e3e6ea', color: '#232323', border: 'none', borderRadius: 8, padding: '14px 0', width: '100%', fontWeight: 700, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'system-ui, Arial, sans-serif' }}>Back</button>
                <button onClick={handleSubmit} style={{ background: '#7E3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', width: '100%', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px rgba(126,58,237,0.08)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'system-ui, Arial, sans-serif' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', rowGap: 8 }}>
                    Start Chatting
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', transform: 'rotate(45deg)', marginLeft: 8, marginTop: 3 }}>
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </span>
                </button>
              </div>
            </>
          )}
        </form>
        <div style={{ color: '#a3b3c7', fontSize: 13, marginTop: 18, marginBottom: 0, textAlign: 'center', padding: '0 18px', fontFamily: 'system-ui, Arial, sans-serif' }}>
          Your information is confidential and will only be used to personalize your therapy experience.
        </div>
        <div style={{ color: '#bfc9d6', fontSize: 13, marginTop: 32, marginBottom: 0, textAlign: 'center', padding: '0 18px', fontFamily: 'system-ui, Arial, sans-serif' }}>
          © 2025 Clamia AI Therapist. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // All hooks must be declared at the top, before any conditional return
  const [userInfo, setUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [moodSummary, setMoodSummary] = useState(null);
  const [endingSession, setEndingSession] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [clientReportDate, setClientReportDate] = useState(null);
  const chatEndRef = useRef(null);
  const reportRef = useRef(null);

  // Set personalized, situation-specific welcome message after onboarding
  useEffect(() => {
    if (userInfo && messages.length === 0) {
      const initialMsg = getInitialSupportMessage(userInfo);
      setMessages([{
        role: 'assistant',
        content: initialMsg,
        timestamp: new Date().toISOString()
      }]);
      // Optionally, send this message to the backend for context (not shown to user)
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'assistant', content: initialMsg + ', but I want to get rid of this.', timestamp: new Date().toISOString() }],
          problemType: userInfo?.therapyType,
          userInfo
        })
      });
    }
  }, [userInfo, messages.length]);

  // Scroll chat to bottom on new message or typing
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

  const handleNewMessage = useCallback(async (message) => {
    const messageToSend = {
      ...message,
      timestamp: new Date().toISOString()
    };
    setMessages(prevMessages => [...prevMessages, messageToSend]);

    if (message.role === 'user') {
      setIsBotTyping(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, messageToSend],
            problemType: userInfo?.therapyType,
            userInfo
          }),
        });
        const data = await response.json();
        setIsBotTyping(false);

        if (data.reply) {
          setMessages(prevMessages => [...prevMessages, {
            ...data.reply,
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (error) {
        setIsBotTyping(false);
        setMessages(prevMessages => [...prevMessages, {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [messages, userInfo]);

  // All hooks are above this line. Only use conditional logic for rendering below.
  if (!userInfo) {
    return <OnboardingForm onComplete={setUserInfo} />;
  }

  const defaultMessage = {
    role: 'assistant',
    content: getWelcomeMessage(userInfo),
    timestamp: new Date().toISOString()
  };

  // Check if intro phase is complete (name, age, country)
  const introComplete = (() => {
    const userMessages = messages.filter(m => m.role === 'user' && typeof m.content === 'string');
    return userMessages.length >= 3;
  })();

  // Theme colors (light mode for this UI)
  const colors = {
    background: '#f5f6fa',
    chatBg: 'transparent',
    userBubble: '#7E3AED',
    botBubble: '#f5f6fa',
    text: '#232323',
    userText: '#fff',
    time: '#888',
    endSession: '#7E3AED',
    endSessionHover: '#5e2bbd',
    summaryBg: '#fff',
    summaryBorder: '#e3e6ea',
    reportCard: '#fff',
    reportBorder: '#e3e6ea',
    reportStatBg: '#f7f7fa',
    reportStatText: '#232323',
    reportStatLabel: '#888',
    reportSenderUser: '#7E3AED',
    reportSenderBot: '#388e3c',
    reportButton: '#7E3AED',
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
            padding: '24px 16px 24px 16px',
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
          <div style={{ background: '#f7f7fa', borderRadius: 16, padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 500, height: 220 }}>
              <Line data={chartData} options={chartOptions} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 500, marginTop: 16 }}>
              <div style={{ fontWeight: 600 }}>Start Mood: <span style={{ color: '#4f8cff' }}>{startMoodLabel}</span></div>
              <div style={{ fontWeight: 600 }}>End Mood: <span style={{ color: '#4f8cff' }}>{endMoodLabel}</span></div>
            </div>
          </div>
          {/* Stats Section */}
          <div style={{ display: 'flex', flexFlow: 'wrap',justifyContent: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ background: colors.reportStatBg, borderRadius: 12, padding: '16px 32px', minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 28, color: colors.reportStatText }}>{stats.totalMessages}</div>
              <div style={{ color: colors.reportStatLabel, fontSize: 15, marginTop: 4 }}>Total Messages</div>
            </div>
            <div style={{ background: colors.reportStatBg, borderRadius: 12, padding: '16px 32px', minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 28, color: colors.reportStatText }}>{stats.minutes}</div>
              <div style={{ color: colors.reportStatLabel, fontSize: 15, marginTop: 4 }}>Minutes</div>
            </div>
            <div style={{ background: colors.reportStatBg, borderRadius: 12, padding: '16px 32px', minWidth: 120, textAlign: 'center' }}>
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
          <div style={{ display: 'flex', flexFlow: 'wrap', justifyContent: 'center', marginTop: 32, gap: 16 }}>
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
                    boxShadow: msg.role === 'user' ? '0 1px 4px rgba(25,34,58,0.10)' : '0 0px 1px black',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.image ? (
                    <img src={msg.image} alt="Uploaded" style={{ maxWidth: '100%', borderRadius: 12 }} />
                  ) : (
                    <ReactMarkdown>
                      {msg.role === 'assistant' ? formatMessageContent(msg.content) : msg.content}
                    </ReactMarkdown>
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
                  minHeight: 32
                }}>
                  <TypingImpulse />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {/* Input bar */}
          <div style={{ marginLeft: '18px', marginRight: '18px', marginBottom: '18px', background: 'white', borderRadius: 24 }}>
            <ChatFunctionality onNewMessage={handleNewMessage} messages={messages} theme={'light'} />
          </div>
        </div>
      </div>
    </main>
  );
}

function getWelcomeMessage(userInfo) {
  return `Hi ${userInfo.name}, I'm here to support you. I understand you are seeking help with ${userInfo.therapyType.replace(/_/g, ' ')}. How can I support you today?`;
}

function getInitialSupportMessage(userInfo) {
  const { name, therapyType } = userInfo;
  const type = therapyType ? therapyType.toLowerCase() : '';
  switch (type) {
    case 'depression':
      return `Hi ${name}, I'm here to support you. I understand you're seeking help with depression. Remember, you're not alone and it's okay to feel this way. Would you like to share what's been weighing on your mind lately?`;
    case 'anxiety':
      return `Hi ${name}, I'm here for you. I see you're seeking help with anxiety. Let's take a deep breath together. Would you like to talk about what's making you feel anxious right now?`;
    case 'stress':
      return `Hi ${name}, I'm here to help you manage stress. Life can be overwhelming, but together we can find ways to cope. What's been causing you stress lately?`;
    case 'grief':
      return `Hi ${name}, I'm here to support you through your grief. It's okay to feel a range of emotions. Would you like to talk about your experience?`;
    case 'self_esteem':
      return `Hi ${name}, I'm here to help you build your self-esteem. Let's explore your strengths together. What would you like to talk about today?`;
    case 'family_therapy':
      return `Hi ${name}, I'm here to support you with family therapy. Family relationships can be complex. Would you like to share what's on your mind?`;
    case 'career_counseling':
      return `Hi ${name}, I'm here to help you with career counseling. Let's talk about your goals and any challenges you're facing at work or in your career path.`;
    case 'relationship':
      return `Hi ${name}, I'm here to support you with relationship concerns. Relationships can be challenging, but you're not alone. Would you like to talk about what's been happening?`;
    default:
      return `Hi ${name}, I'm here to support you. How can I help you today?`;
  }
}