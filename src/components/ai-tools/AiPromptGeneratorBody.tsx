import React from 'react';
import { Box } from '@mui/material';
import { useStore } from '@nanostores/react';
import { aiChatStore } from '@/stores/aiChatStore';
import 'github-markdown-css/github-markdown.css';
import 'github-markdown-css/github-markdown-dark.css';
import ReactMarkdownWithCodeCopy from '@/components/markdown/ReactMarkdownWithCodeCopy';

interface AiPromptGeneratorBodyProps {
  // Define any props here
}

const AiPromptGeneratorBody: React.FC<AiPromptGeneratorBodyProps> = () => {
  const $aiChat = useStore(aiChatStore);
  return (
    <Box className="p-4 flex flex-col">
      {/* Display messages from aiChatStore */}
      {/*error && <Box color="error.main">Error: {error}</Box>*/}
      {/* messages.length > 0 && */}
      <Box mt={2}>
        {$aiChat.messages.map((message, index) => (
          <Box key={index} mt={1}>
            <strong>{message.role === 'user' ? 'You:' : 'AI:'}</strong>
            {message.role === 'model' && (
              <ReactMarkdownWithCodeCopy>
                {message.text}
              </ReactMarkdownWithCodeCopy>
            )}
            {message.role === 'user' && (
              <Box ml={1}>{message.text}</Box>
            )}
            
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AiPromptGeneratorBody;
