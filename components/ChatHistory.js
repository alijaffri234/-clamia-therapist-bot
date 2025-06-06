import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

function ChatHistory() {
  const { data: session, status } = useSession();
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/chat/history');
          const data = await response.json();

          if (response.ok) {
            setChatSessions(data);
          } else {
            setError(data.message || 'Failed to fetch chat history');
          }
        } catch (err) {
          console.error('Error fetching chat history:', err);
          setError('An error occurred while fetching chat history.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setLoading(false);
        setError('Please log in to view chat history.');
      } else if (status === 'loading') {
          // Still loading session, keep loading state true
      }
    };

    fetchChatHistory();
  }, [status]); // Rerun effect when authentication status changes

  if (loading) {
    return <div>Loading chat history...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (chatSessions.length === 0) {
    return <div>No chat sessions found.</div>;
  }

  return (
    <div>
      <h2>Chat History</h2>
      {chatSessions.map((session) => (
        <div key={session.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <h3>Session: {session.title || session.id}</h3>
          <div>
            {session.messages.map((message) => (
              <p key={message.id}><strong>{message.role}:</strong> {message.content}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatHistory; 