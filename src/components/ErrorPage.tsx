import { useRouteError } from 'react-router-dom';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Oops! Page Not Found
      </Typography>
      <Typography variant="body1" paragraph>
        The requested page could not be found.
      </Typography>
      {process.env.NODE_ENV === 'development' && (
        <>
          <Typography variant="h6" color="error" gutterBottom>
            Error Details:
          </Typography>
          <Typography variant="body2" color="error">
            {error.statusText || error.message}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {error.status}
          </Typography>
        </>
      )}
      <Button component={Link} to="/" variant="contained" color="primary">
        Go Home
      </Button>
    </Box>
  );
}