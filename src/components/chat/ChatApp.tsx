import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, List, ListItem, Typography, Paper, Avatar, useTheme } from '@mui/material';
import { Send, User } from 'lucide-react'; // Using lucide-react for icons

// -----------------------------------------------------------------------------
// 1. Types and Interfaces
// -----------------------------------------------------------------------------

interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

interface MessageInputProps {
  onSendMessage: (text: string, userId?: string) => void;
}

// Mock User ID for demonstration (Replace with actual authenticated user ID)
const MOCK_CURRENT_USER_ID = 'user-a';
const MOCK_BOT_USER_ID = 'user-bot';

// -----------------------------------------------------------------------------
// 2. MessageBubble Component
// -----------------------------------------------------------------------------

/**
 * Renders a single chat message bubble, styling it based on the sender.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId }) => {
  const isCurrentUser = message.userId === currentUserId;
  const isBot = message.userId === MOCK_BOT_USER_ID;
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
      <User size={16} />
    </Avatar>
  ) : (
    <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32, mr: 1 }}>
      {isBot ? 'B' : 'O'}
    </Avatar>
  );

  return (
    <Box className={`flex w-full my-2 ${alignmentClass}`}>
      {!isCurrentUser && avatar}
      <Paper
        elevation={1}
        className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-md ${bubbleClass}`}
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

// -----------------------------------------------------------------------------
// 3. MessageList Component
// -----------------------------------------------------------------------------

/**
 * Renders the full list of messages and handles auto-scrolling.
 */
const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box className="flex-grow overflow-y-auto p-4 bg-gray-50 rounded-t-lg">
      <List className="flex flex-col">
        {messages.map((message) => (
          <ListItem key={message.id} className="p-0">
            <MessageBubble message={message} currentUserId={currentUserId} />
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>
      {messages.length === 0 && (
        <Box className="flex items-center justify-center h-full text-gray-500">
          <Typography variant="subtitle1">Start the conversation...</Typography>
        </Box>
      )}
    </Box>
  );
};

// -----------------------------------------------------------------------------
// 4. MessageInput Component
// -----------------------------------------------------------------------------

/**
 * Provides the text input and send button functionality.
 */
const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Placeholder for the actual API key. The Canvas environment will inject this if needed.
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string; // Access API key from environment variables

  // Helper function to simulate LLM response generation with exponential backoff
  const generateBotResponse = async (userText: string) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const systemPrompt = "You are a friendly and helpful chat bot assistant. Respond concisely to the user's message.";

    const payload = {
      contents: [{ parts: [{ text: userText }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    let attempt = 0;
    const maxRetries = 5;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          const botText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          return botText || "Sorry, I couldn't generate a response.";
        }

        if (response.status === 429 && attempt < maxRetries - 1) {
          // Retry on rate limit (429)
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // Handle other non-retryable errors
        console.error("API Error:", response.statusText);
        return "An API error occurred.";

      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Retry on network errors
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        console.error("Fetch failed after retries:", error);
        return "Network error or fetch failure.";
      }
    }
    return "Failed to get a response after multiple retries.";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    // 1. Send User Message
    onSendMessage(trimmedText);
    setInputText('');
    setIsLoading(true);

    // 2. Simulate Bot Response
    const botResponseText = await generateBotResponse(trimmedText);

    // 3. Send Bot Message (Delayed to simulate processing)
    if (botResponseText) {
      setTimeout(() => {
        onSendMessage(botResponseText, MOCK_BOT_USER_ID);
        setIsLoading(false);
      }, 500); // 500ms delay to visually separate user and bot messages
    } else {
        setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSend}
      className="flex p-4 border-t border-gray-200 bg-white rounded-b-lg shadow-inner"
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isLoading}
        size="small"
        className="mr-2"
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
            }
        }}
        sx={{
            '& .MuiOutlinedInput-root': {
                borderRadius: '9999px',
            },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!inputText.trim() || isLoading}
        endIcon={<Send size={20} />}
        className="rounded-full px-6 py-2 transition-all duration-300 transform hover:scale-[1.03]"
        sx={{ minWidth: '40px' }}
      >
        {isLoading ? '...' : 'Send'}
      </Button>
    </Box>
  );
};

// -----------------------------------------------------------------------------
// 5. ChatApp Component (Main)
// -----------------------------------------------------------------------------

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
