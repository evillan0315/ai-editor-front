import React from 'react';
import MuiSnackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { useTheme } from '@mui/material';

interface CustomSnackbarProps {
  open: boolean;
  message: string;
  severity?: AlertProps['severity'];
  onClose: () => void;
  autoHideDuration?: number;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  },
);

const Snackbar: React.FC<CustomSnackbarProps> = ({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 3000,
}) => {
  const theme = useTheme();

  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      // Prevent interaction with elements behind the snackbar if it has an action button or similar
      // onClick={onClose} // uncomment if clicking anywhere on snackbar should close it
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{
          width: '100%',
          // Customize Alert background for dark/light mode consistency if needed
          bgcolor: theme.palette[severity]?.main || theme.palette.grey[800],
          color: theme.palette.getContrastText(
            theme.palette[severity]?.main || theme.palette.grey[800],
          ),
        }}
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
