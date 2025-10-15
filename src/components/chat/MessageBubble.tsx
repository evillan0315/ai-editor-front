/**
 * @file Renders a single chat message bubble, styling it based on the sender.
 */

import React from 'react';
import { Box, Typography, Paper, Avatar, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import { MessageBubbleProps } from './types';

// Bot User ID (remains constant for bot messages)
const BOT_USER_ID = 'user-bot';

/**
 * Renders a single chat message bubble, styling it based on the sender.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId }) => {
  const isCurrentUser = message.userId === currentUserId;
  const isBot = message.userId === BOT_USER_ID;
  const theme = useTheme();

  // Determine colors and alignment
  const bubbleClass = isCurrentUser
    ? 'bg-blue-500 text-white self-end rounded-br-none'
    : isBot
    ? 'bg-gray-200 text-gray-800 self-start rounded-tl-none'
    : 'bg-green-100 text-gray-800 self-start rounded-tl-none';

  const alignmentClass = isCurrentUser ? 'justify-end' : 'justify-start';

  const avatar = isCurrentUser ? (
    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32, ml: 1 }}>
      <AccountCircleIcon fontSize="small" />
    </Avatar>
  ) : (
    <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32, mr: 1 }}>
      {isBot ? <SmartToyIcon fontSize="small" /> : <AccountCircleIcon fontSize="small" />}
    </Avatar>
  );

  return (
    <Box className={`flex w-full my-2 ${alignmentClass}`}>
      {!isCurrentUser && avatar}
      <Paper
        elevation={1}
        className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-md ${bubbleClass}`}"
      >
        <Typography variant="body1" className="whitespace-pre-wrap">
          {message.text}
        </Typography>
        <Typography variant="caption" className="opacity-70 mt-1 block text-right">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Paper>
      {isCurrentUser && avatar}
    </Box>
  );
};

export default MessageBubble;
