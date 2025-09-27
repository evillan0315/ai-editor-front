import React from 'react';
import { Box, Button, useTheme } from '@mui/material';

interface GlobalAction {
  label: string;
  action: () => void;
  icon?: React.ElementType;
}

interface GlobalActionButtonProps {
  globalActions: GlobalAction[];
}

function GlobalActionButton({ globalActions }: GlobalActionButtonProps) {
  const theme = useTheme();

  const boxSx = {
    backgroundColor: theme.palette.background.paper,
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
            color="primary"
            variant="contained"
            startIcon={action.icon ? <action.icon /> : null}
          >
            {action.label}
          </Button>
        ))}
    </Box>
  );
}

export default GlobalActionButton;
