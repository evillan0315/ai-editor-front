// FilePath: src/components/AIPromptGenerator.tsx
// Title: Chat-style AI Prompt Generator Component
// Reason: Presents prompts and AI responses in a conversation layout similar to a ChatGPT chat.

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';

import { generateText } from '@/api/ai';
import { GenerateTextDto } from '@/types/ai';

interface Message {
  role: 'user' | 'system';
  text: string;
}

const AIPromptManager: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const data: GenerateTextDto = { prompt: input.trim() };
      const response = await generateText(data);

      const systemMsg: Message = {
        role: 'system',
        text: `AI Response:\n\n${response}`,
      };
      setMessages((prev) => [...prev, systemMsg]);
    } catch (error: any) {
      console.error('Error generating text:', error);
      const errorMsg: Message = {
        role: 'system',
        text: `Error: ${error.message || 'Failed to generate text.'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setInput('');
  };

  // keep view pinned to the newest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
        maxWidth: 700,
        margin: '0 auto',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: 'background.default',
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                maxWidth: '70%',
                bgcolor:
                  msg.role === 'user' ? 'primary.main' : 'background.paper',
                color:
                  msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                whiteSpace: 'pre-wrap',
              }}
            >
              <Typography variant="body2">{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
        <div ref={scrollRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          p: 2,
          display: 'flex',
          gap: 1,
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type your instruction…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default AIPromptManager;
