import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';

interface ReactMarkdownWithCodeCopyProps {
  children: string;
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
        code: ({ node, inline, className, children, ...props }) => {
          const text = String(children).replace(/\n$/, '');
          const language = className ? className.replace('language-', '') : '';
          return inline ? (
            <Box className={className}>{children}</Box>
          ) : (
            <Box
              className={`${language ? 'relative' : 'inline-block'} ${className}`}
            >
              {language && (
                <Typography
                  variant="caption"
                  className="language-btn absolute top-2 left-0 rounded-md z-1"
                >
                  {language}
                </Typography>
              )}
              <Box>{children}</Box>

              {className && (
                <Tooltip title="Copy code to clipboard">
                  <IconButton
                    aria-label="copy"
                    onClick={() => handleCopy(text)}
                    className={`${className} absolute top-1 right-1`}
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
