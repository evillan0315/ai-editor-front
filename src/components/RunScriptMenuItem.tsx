import React from 'react';
import {
  MenuItem,
  Tooltip,
  CircularProgress,
  useTheme,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { defaultScriptIcon, scriptIcons } from '@/constants/scriptIcons';
import { ScriptStatus } from '@/types';

interface RunScriptMenuItemProps {
  name: string;
  command: string; // The raw script content from package.json, used for the tooltip
  onClick: (scriptName: string, rawScriptContent: string) => void;
  status: ScriptStatus;
  disabled: boolean;
}

const RunScriptMenuItem: React.FC<RunScriptMenuItemProps> = ({
  name,
  command: rawScriptContent,
  onClick,
  status,
  disabled,
}) => {
  const theme = useTheme();
  const IconComponent = scriptIcons[name] || defaultScriptIcon;

  const isLoading = status === ScriptStatus.RUNNING;

  let textColor = theme.palette.text.primary;
  let iconColor = theme.palette.action.active;
  if (status === ScriptStatus.ERROR) {
    textColor = theme.palette.error.main;
    iconColor = theme.palette.error.main;
  } else if (status === ScriptStatus.SUCCESS) {
    textColor = theme.palette.success.main;
    iconColor = theme.palette.success.main;
  }

  return (
    <Tooltip title={`Script: ${rawScriptContent}`} placement="right">
      <MenuItem
        onClick={() => onClick(name, rawScriptContent)}
        disabled={disabled || isLoading}
        sx={{
          minWidth: 150,
          py: 0.5,
          fontSize: '0.875rem',
          color: textColor,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          },
        }}
      >
        <ListItemIcon sx={{ color: iconColor }}>
          {isLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <IconComponent fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={name}
          primaryTypographyProps={{ style: { color: textColor } }}
        />
      </MenuItem>
    </Tooltip>
  );
};

export default RunScriptMenuItem;
