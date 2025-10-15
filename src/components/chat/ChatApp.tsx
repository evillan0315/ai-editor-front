/**
 * @file Main component for the chat application, handling global state and layout.
 */

import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

import { Message } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

// Mock User ID for demonstration (Replace with actual authenticated user ID)
const MOCK_CURRENT_USER_ID = 'user-a';
const MOCK_BOT_USER_ID = 'user-bot';

/**
 * Main component for the chat application, handling global state and layout.
 */
const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      userId: MOCK_BOT_USER_ID,
      text: 'Hello! I am your friendly AI chat assistant. What can I help you with today?',
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = (text: string, userId: string = MOCK_CURRENT_USER_ID) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      userId,
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <Box
      className="max-w-3xl mx-auto h-[90vh] flex flex-col p-4 bg-gray-100"
      sx={{
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Paper elevation={3} className="flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
        <Box className="p-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg">
          <Typography variant="h5" component="h1" className="font-bold">
            Gemini AI Chat
          </Typography>
          <Typography variant="subtitle2" className="opacity-80">
            Current User: {MOCK_CURRENT_USER_ID} (Mock ID)
          </Typography>
        </Box>

        {/* Message List Area */}
        <MessageList messages={messages} currentUserId={MOCK_CURRENT_USER_ID} />

        {/* Message Input Area */}
        <MessageInput onSendMessage={handleSendMessage} />
      </Paper>
    </Box>
  );
};

export default ChatApp;
