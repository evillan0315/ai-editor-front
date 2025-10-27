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
import CallEndIcon from '@mui/icons-material/CallEnd'; // Import CallEndIcon
import { fetchDefaultConnection } from './stores/connectionStore';
import { chatStore, IChatMessage, setChatError, setChatLoading, clearChat } from './stores/chatStore';
import { useOpenViduSession } from './hooks/useOpenViduSession';
import { OpenViduVideoGrid } from './openvidu/OpenViduVideoGrid'; // NEW
import { OpenViduControls } from './openvidu/OpenViduControls'; // NEW

interface ChatRoomProps {
  roomId?: string;
}

// --- Styles --- //
const chatContainerSx = {
  height: '100%',
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
  const { messages, loading, error } = useStore(chatStore);

  const {
    // sessionNameInput, // Removed as it's managed internally or by initial prop
    // handleSessionNameChange, // Removed as it's managed internally or by initial prop
    joinSession,
    leaveSession,
    initLocalMediaPreview,
    destroyLocalMediaPreview,
    toggleCamera,
    toggleMic,
    isCameraActive,
    isMicActive,
    isLoading: isOVSessionLoading, // Rename to avoid conflict with chat loading
    error: ovSessionError, // Rename to avoid conflict with chat error
    publisher,
    subscribers,
    currentSessionId,
    openViduInstance,
    connectionRole,
    currentUserDisplayName,
    sendChatMessage,
  } = useOpenViduSession(roomId, 'PUBLISHER'); // Always publisher for this component

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Effect to auto-join session when component mounts/roomId changes, if OpenVidu instance is ready
  useEffect(() => {
    // Ensure OpenVidu instance is ready and we're not already connected to this room
    if (roomId && openViduInstance && currentSessionId !== roomId) {
      fetchDefaultConnection();
      console.log(`Attempting to auto-join OpenVidu session: ${roomId}`);
      joinSession(roomId);
    }
  }, [roomId, openViduInstance, currentSessionId, joinSession, fetchDefaultConnection]); // Added joinSession to dependencies

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (error) {
      console.error('Chat Store Error:', error);
    }
    if (ovSessionError) {
      console.error('OpenVidu Session Error:', ovSessionError);
    }
  }, [error, ovSessionError]);

  const handleSendMessage = useCallback(async () => {
    if (messageInput.trim() === '') return;

    setChatLoading(true);
    setChatError(null);
    try {
      await sendChatMessage(messageInput);
      setMessageInput('');
    } catch (e: any) {
      setChatError(`Failed to send message: ${e.message || e}`);
    } finally {
      setChatLoading(false);
    }
  }, [messageInput, sendChatMessage]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line in text area
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const allErrors = error || ovSessionError;
  // `isSending` is not exposed by `useOpenViduSession` anymore, remove it from `overallLoading`
  const overallLoading = loading || isOVSessionLoading;

  return (
    <Paper sx={chatContainerSx} className="w-full flex-1 max-w-full md:max-w-7xl">
      <Box className="flex flex-col md:flex-row flex-1 "> {/* Main flex container for video & chat */}
        {/* Left Section: Video Display & Controls */}
        <Box className="flex flex-col flex-1 md:flex-[2] p-4 bg-background-default overflow-y-auto ">
          <Typography variant="h6" component="div" className="font-bold text-center mb-4" color="text.primary">
            Live Streams
          </Typography>
          {allErrors && (
            <Alert severity="error" className="mb-4">
              {allErrors}
            </Alert>
          )}
          {isOVSessionLoading && !currentSessionId && (
            <Box className="flex justify-center items-center h-40">
              <CircularProgress />
              <Typography className="ml-2">Connecting to session...</Typography>
            </Box>
          )}
          {currentSessionId ? (
            <>
              <OpenViduVideoGrid publisher={publisher} subscribers={subscribers} />
              <OpenViduControls
                isCameraActive={isCameraActive}
                toggleCamera={toggleCamera}
                isMicActive={isMicActive}
                toggleMic={toggleMic}
                publisher={publisher}
              />
              <Box className="flex justify-center mt-4">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={leaveSession}
                  disabled={isOVSessionLoading || !currentSessionId}
                  startIcon={<CallEndIcon />}
                >
                  Leave Session
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary" className="text-center mt-4">
              No active session. Waiting to connect...
            </Typography>
          )}
        </Box>

        {/* Right Section: Chat Messages */}
        <Box className="flex flex-col flex-1 md:flex-1 border-t md:border-t-0 md:border-l border-divider">
          <Box className="p-4 border-b border-divider">
            <Typography variant="h6" component="div" className="font-bold text-center" color="text.primary">
              Room Chat
            </Typography>
          </Box>

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
              disabled={overallLoading}
              className="flex-grow"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              disabled={messageInput.trim() === '' || overallLoading}
              startIcon={overallLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
