import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, useTheme, Alert } from '@mui/material';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error: ', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <DefaultFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

const DefaultFallback: React.FC<DefaultFallbackProps> = ({
  error,
  errorInfo,
}) => {
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
        Oops! Something went wrong.
      </Typography>
      <Typography variant="body1" paragraph>
        We've encountered an error and are working to fix it.
      </Typography>
      {process.env.NODE_ENV === 'development' && error && (
        <Alert severity="error">
          <Typography variant="h6" color="error" gutterBottom>
            Error Details:
          </Typography>
          <Typography variant="body2" color="error">
            {error.message}
          </Typography>
          {errorInfo && (
            <Typography variant="caption" color="textSecondary">
              {errorInfo.componentStack}
            </Typography>
          )}
        </Alert>
      )}
      <Button component={Link} to="/" variant="contained" color="primary">
        Go Home
      </Button>
    </Box>
  );
};

export default ErrorBoundary;
