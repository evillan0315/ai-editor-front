import React from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { ButtonProps } from '@mui/material/Button';

export interface GlobalAction {
  label: string;
  action: () => void;
  icon?: React.ElementType;
  color?: ButtonProps['color'];
  variant?: ButtonProps['variant'];
  disabled?: boolean; // Added disabled property
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
            color={action.color || 'primary'}
            variant={action.variant || 'contained'}
            startIcon={action.icon ? <action.icon /> : null}
            disabled={action.disabled} // Pass disabled prop to the Button
          >
            {action.label}
          </Button>
        ))}
    </Box>
  );
}

export default GlobalActionButton;
