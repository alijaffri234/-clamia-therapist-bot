import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle redirection based on authentication status
  useEffect(() => {
    if (status === 'loading') {
      // Still loading session, do nothing yet
      return;
    }

    if (status === 'unauthenticated') {
      // If not authenticated, redirect to the auth page
      router.push('/');
    }
    // If authenticated, no redirection needed here, stay on chat page
  }, [status, router]);

  // Show loading state while checking session
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // If authenticated, render the chat page content
  if (status === 'authenticated') {
    return (
      <div>
        <h1>Chat Page</h1>
        <p>Welcome, {session.user.name}!</p>
        {/* Your chatbot UI and logic will go here */}
        {/* You can use the ChatHistory component here if you like */}
      </div>
    );
  }

  // If unauthenticated, the useEffect hook will handle the redirection
  return null; // Or a simple loading/redirecting message
}

export default ChatPage; 