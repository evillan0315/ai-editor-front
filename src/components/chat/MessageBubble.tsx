/**
 * @file Renders a single chat message bubble, styling it based on the sender.
 */

import React from 'react';
import { Box, Typography, Paper, Avatar, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReactMarkdownWithCodeCopy from '@/components/markdown/ReactMarkdownWithCodeCopy';
import { MessageBubbleProps, Sender } from './types'; // Import Sender enum

// Bot User ID (remains constant for bot messages)
const BOT_USER_ID = 'user-bot';

/**
 * Renders a single chat message bubble, styling it based on the sender.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId }) => {

  const isCurrentUser = message.sender === Sender.USER && message.createdById === currentUserId;
  const theme = useTheme();

  // Determine if the message is from the bot using the sender property from the Message interface
  const isBot = message.sender === Sender.BOT;

  // Determine colors and alignment using theme palette
  const bubbleSx = {
    backgroundColor: isCurrentUser
      ? theme.palette.primary.main
      : isBot
        ? theme.palette.background.main // A subtle background for bot messages
        : theme.palette.success.main, // Example for other users, could be another theme color
    color: isCurrentUser ? theme.palette.primary.contrastText : isBot ? theme.palette.primary.light : theme.palette.primary.contrastText,
    borderRadius: '12px',
    ...(isCurrentUser && { borderBottomRightRadius: '2px' }), // Adjust corner for current user
    ...(!isCurrentUser && { borderBottomLeftRadius: '2px' }), // Adjust corner for bot/other user
  };

  const alignmentClass = isCurrentUser ? 'justify-end' : 'justify-start';

  const avatar = isCurrentUser ? (
    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32, ml: 1 }}>
      <AccountCircleIcon fontSize="small" />
    </Avatar>
  ) : (
    <Avatar sx={{ bgcolor: isBot ? theme.palette.background.main : theme.palette.success.main, width: 32, height: 32, mr: 1 }}>
      {isBot ? <SmartToyIcon fontSize="small" /> : <AccountCircleIcon fontSize="small" />}
    </Avatar>
  );

  return (
    <Box className={`flex w-full my-2 ${alignmentClass}`}>
      {!isCurrentUser && avatar}
      <Paper
        elevation={1}
        className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-md`}
        sx={bubbleSx}
      >
        <Typography className="whitespace-pre-wrap">
          {isBot ? (
            <ReactMarkdownWithCodeCopy>
            {message.content}
            </ReactMarkdownWithCodeCopy>
          ) : message.content }
           {/* Changed from message.text to message.content */}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block', textAlign: 'right' }}>
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Paper>
      {isCurrentUser && avatar}
    </Box>
  );
};

export default MessageBubble;
