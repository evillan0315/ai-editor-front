import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import { chatStore, IChatMessage, setChatError, setChatLoading, clearChat } from './stores/chatStore';
import { useOpenViduSession } from './hooks/useOpenViduSession';

interface ChatRoomProps {
  roomId?: string;
}

// --- Styles --- //
const chatContainerSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: 'calc(100vh - 120px)', // Adjust based on overall page layout
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  backgroundColor: 'background.paper',
  boxShadow: 3,
};

const messageListSx = {
  flexGrow: 1,
  overflowY: 'auto',
  padding: '8px',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
};

const messageInputContainerSx = {
  padding: '16px',
  borderTop: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'background.default',
};

const messageBubbleSx = (isLocal: boolean) => ({
  display: 'flex',
  justifyContent: isLocal ? 'flex-end' : 'flex-start',
  marginBottom: '8px',
  '& .MuiListItemText-root': {
    maxWidth: '75%', // Limit bubble width
  },
  '& .MuiListItemText-primary': {
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  '& .MuiListItemText-secondary': {
    whiteSpace: 'pre-wrap', // Preserve line breaks
    wordBreak: 'break-word', // Break long words
    borderRadius: '16px',
    padding: '8px 12px',
    backgroundColor: isLocal ? 'primary.light' : 'grey.300',
    color: isLocal ? 'primary.contrastText' : 'text.primary',
  },
});

const avatarSx = {
  bgcolor: 'primary.main',
  width: 32,
  height: 32,
  margin: '0 8px',
};

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  console.log(roomId, 'roomId')
  const { messages, loading, error } = useStore(chatStore);
  const { sendChatMessage, isLoading: isSending, error: sendError, currentUserDisplayName } = useOpenViduSession(roomId, 'PUBLISHER');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (error) {
      console.error('Chat Store Error:', error);
    }
    if (sendError) {
      console.error('Chat Send Error:', sendError);
    }
  }, [error, sendError]);

  const handleSendMessage = useCallback(async () => {
    if (messageInput.trim() === '') return;

    setChatLoading(true);
    setChatError(null);
    try {
      const mySenderName = currentUserDisplayName?.USERNAME || 'You';
      // Add the message to the local store immediately for optimistic UI update
      const optimisticMessage: IChatMessage = {
        sender: mySenderName,
        message: messageInput,
        timestamp: Date.now(),
        isLocal: true,
      };
      // We don't add to chatStore.messages directly here because useOpenViduSession's signal handler will add it
      // after it's sent and echoed back (or just sent if not echoed back).
      // For now, let's just send and rely on the hook's signal listener to update.

      await sendChatMessage(messageInput);
      setMessageInput('');
    } catch (e: any) {
      setChatError(`Failed to send message: ${e.message || e}`);
    } finally {
      setChatLoading(false);
    }
  }, [messageInput, sendChatMessage, currentUserDisplayName]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line in text area
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const allErrors = error || sendError;

  return (
    <Paper sx={chatContainerSx} className="w-full flex-1 max-w-lg">
      <Box className="p-4 border-b border-divider">
        <Typography variant="h6" component="div" className="font-bold text-center" color="text.primary">
          Room Chat
        </Typography>
      </Box>

      {allErrors && (
        <Alert severity="error" className="m-2">
          {allErrors}
        </Alert>
      )}

      <List sx={messageListSx}>
        {messages.map((msg, index) => (
          <ListItem key={index} sx={messageBubbleSx(msg.isLocal)} className="flex-col items-stretch">
            <Box className={`flex items-center ${msg.isLocal ? 'justify-end' : 'justify-start'} w-full`}>
              {!msg.isLocal && (
                <Avatar sx={avatarSx}>
                  {msg.sender ? msg.sender[0].toUpperCase() : '?'}
                </Avatar>
              )}
              <ListItemText
                primary={msg.sender}
                secondary={msg.message}
                secondaryTypographyProps={{
                  component: 'div',
                  className: `text-sm ${msg.isLocal ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg p-2 max-w-xs`
                }}
                primaryTypographyProps={{
                  className: `text-xs font-semibold mb-1 ${msg.isLocal ? 'text-right pr-2' : 'text-left pl-2'}`
                }}
                className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}
              />
              {msg.isLocal && (
                <Avatar sx={avatarSx}>
                  {msg.sender ? msg.sender[0].toUpperCase() : '?'}
                </Avatar>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" className={`text-xs mt-1 ${msg.isLocal ? 'self-end pr-14' : 'self-start pl-14'}`}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Typography>
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>

      <Box sx={messageInputContainerSx} className="flex items-center gap-2">
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder="Type a message..." value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || isSending}
          className="flex-grow"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={messageInput.trim() === '' || loading || isSending}
          startIcon={loading || isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};
