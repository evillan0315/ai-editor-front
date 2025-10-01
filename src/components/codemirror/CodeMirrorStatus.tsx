import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';

interface CodeMirrorStatusProps {
  languageName: string;
  line: number;
  column: number;
  lintStatus: string;
}

const CodeMirrorStatus: React.FC<CodeMirrorStatusProps> = ({
  languageName,
  line,
  column,
  lintStatus,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);

  const sxStatusText = {
    color: muiTheme.palette.text.secondary,
    fontSize: '0.75rem',
    mx: 1,
    display: 'flex',
    alignItems: 'center',
    '&:not(:last-of-type)': {
      borderRight: `1px solid ${muiTheme.palette.divider}`,
      pr: 1,
    },
  };

  return (
    <Box
      className="flex items-center justify-end px-2 py-1 h-8"
      sx={{
        backgroundColor: muiTheme.palette.background.default,
        borderTop: `1px solid ${muiTheme.palette.divider}`,
      }}
    >
      <Typography sx={sxStatusText}>
        Language: {languageName}
      </Typography>
      <Typography sx={sxStatusText}>
        Ln {line}, Col {column}
      </Typography>
      <Typography sx={sxStatusText}>
        {lintStatus}
      </Typography>
    </Box>
  );
};

export default CodeMirrorStatus;
