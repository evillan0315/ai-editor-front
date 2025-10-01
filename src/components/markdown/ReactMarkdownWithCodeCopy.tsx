import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Components } from 'react-markdown'; // Import Components type

interface ReactMarkdownWithCodeCopyProps {
  children: string;
}

// Define the props type for the custom code renderer
interface CodeRendererProps {
  node?: any; // The AST node
  inline?: boolean; // True if inline code, false if code block
  className?: string; // Class name from syntax highlighting
  children?: React.ReactNode; // The code content
  [key: string]: any; // Allow other props
}

const ReactMarkdownWithCodeCopy: React.FC<ReactMarkdownWithCodeCopyProps> = ({
  children,
}) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
      components={{
        code: ({ node, inline, className, children, ...props }: CodeRendererProps) => {
          const text = String(children).replace(/\n$/, '');
          const language = className ? className.replace('language-', '') : '';
          return inline ? (
            <Box component="code">{children}</Box>
          ) : (
            <Box
              className={language ? 'relative' : 'inline-block'}
              sx={{ position: 'relative' }}
            >
              {language && (
                <Typography
                  variant="caption"
                  className="language-btn"
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: 0,
                    px: 1,
                    borderRadius: '4px',
                    zIndex: 1,
                    bgcolor: 'rgba(0,0,0,0.5)',
                  }}
                >
                  {language}
                </Typography>
              )}
              <Box component="code">{children}</Box>

              {className && (
                <Tooltip title="Copy code to clipboard">
                  <IconButton
                    aria-label="copy"
                    onClick={() => handleCopy(text)}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    <FileCopyIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default ReactMarkdownWithCodeCopy;
