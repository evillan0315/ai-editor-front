/**
 * @file Main component for the chat application, handling global state and layout.
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, CircularProgress } from '@mui/material';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { checkAuthStatus } from '@/api/auth';

import { Message } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

// Bot User ID (remains constant)
const BOT_USER_ID = 'user-bot';

/**
 * Main component for the chat application, handling global state and layout.
 * Ensures user authentication status is loaded and reflects the current user.
 */
const ChatApp: React.FC = () => {
  const $auth = useStore(authStore);
  const theme = useTheme();

  // On component mount, ensure authentication status is checked.
  // This will update the authStore's isLoggedIn, user, loading, and error states.
  useEffect(() => {
    // Only initiate checkAuthStatus if no user is loaded AND an auth check is not already in progress.
    // This prevents redundant API calls if a parent component already triggered it or if user is genuinely logged out.
    if (!$auth.user && !$auth.loading) {
      console.log('ChatApp: Initiating auth status check as user is not loaded.');
      checkAuthStatus();
    }
  }, [$auth.user, $auth.loading]); // Depend on user and loading state to re-evaluate

  const currentUserActualId = $auth.user?.id || 'guest-user';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      userId: BOT_USER_ID,
      text: 'Hello! I am your friendly AI chat assistant. What can I help you with today?',
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = (text: string, userId: string = currentUserActualId) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      userId,
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Show loading indicator while authentication status is being determined
  if ($auth.loading) {
    return (
      <Box className="flex items-center justify-center h-full">
        <CircularProgress />
        <Typography variant="h6" ml={2}>Loading user data...</Typography>
      </Box>
    );
  }

  // If not logged in after the check, display an appropriate message.
  // Depending on requirements, this might redirect to a login page instead.
  if (!$auth.isLoggedIn && !$auth.loading && !$auth.user) {
    return (
      <Box className="flex flex-col items-center justify-center h-full p-4">
        <Typography variant="h6" color="textSecondary">
          Please log in to use the chat application.
        </Typography>
        {/* You might add a login button or link here */}
      </Box>
    );
  }

  // Display authentication error if one exists
  if ($auth.error) {
    return (
      <Box className="flex items-center justify-center h-full p-4">
        <Typography variant="h6" color="error">Authentication Error: {$auth.error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      className="max-w-3xl mx-auto h-[90vh] flex flex-col p-4"
      sx={{
        fontFamily: 'Inter, sans-serif',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Paper elevation={3} className="flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
        <Box
          className="p-4 shadow-lg"
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          }}
        >
          <Typography variant="h5" component="h1" className="font-bold">
            Gemini AI Chat
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            Current User: {$auth.user?.name || 'Guest User'} {(!$auth.user?.id && '(Guest Mode)') || ''}
          </Typography>
        </Box>

        {/* Message List Area */}
        <MessageList messages={messages} currentUserId={currentUserActualId} />

        {/* Message Input Area */}
        <MessageInput onSendMessage={handleSendMessage} />
      </Paper>
    </Box>
  );
};

export default ChatApp;
