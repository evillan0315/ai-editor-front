import React from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { ButtonColor, ButtonVariant } from '@mui/material/Button';

export interface GlobalAction {
  label: string;
  action: () => void;
  icon?: React.ElementType;
  color?: ButtonColor;
  variant?: ButtonVariant;
}

interface GlobalActionButtonProps {
  globalActions: GlobalAction[];
}

function GlobalActionButton({ globalActions }: GlobalActionButtonProps) {
  const theme = useTheme();

  const boxSx = {
    display: 'flex',
    gap: 1,
  };

  return (
    <Box sx={boxSx}>
      {globalActions &&
        globalActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            color={action.color || "primary"}
            variant={action.variant || "contained"}
            startIcon={action.icon ? <action.icon /> : null}
          >
            {action.label}
          </Button>
        ))}
    </Box>
  );
}

export default GlobalActionButton;
