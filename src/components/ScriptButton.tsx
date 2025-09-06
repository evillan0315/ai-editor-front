import React from 'react';
import { Button, Tooltip, CircularProgress, useTheme } from '@mui/material';
import { defaultScriptIcon, scriptIcons } from '@/constants/scriptIcons';
import { ScriptStatus } from '@/types';

interface ScriptButtonProps {
  name: string;
  command: string; // This is the raw script content from package.json, used for the tooltip
  onClick: (scriptName: string, rawScriptContent: string) => void; // Updated onClick signature
  status: ScriptStatus;
  disabled: boolean;
}

const ScriptButton: React.FC<ScriptButtonProps> = ({
  name,
  command: rawScriptContent, // Renamed for clarity, holds the raw script content
  onClick,
  status,
  disabled,
}) => {
  const theme = useTheme();
  const IconComponent = scriptIcons[name] || defaultScriptIcon;

  const isLoading = status === ScriptStatus.RUNNING;

  return (
    <Tooltip title={`Script: ${rawScriptContent}`} placement="bottom">
      <span>
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => onClick(name, rawScriptContent)} // Pass script name and raw content to handler
          disabled={disabled || isLoading}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
            // Tailwind styles for compact button
            minWidth: 'auto',
            px: 1,
            py: 0.5,
            fontSize: '0.75rem', // Smaller text for compact look
            whiteSpace: 'nowrap',
          }}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <IconComponent fontSize="small" />
            )
          }
        >
          {name}
        </Button>
      </span>
    </Tooltip>
  );
};

export default ScriptButton;
