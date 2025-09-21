import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { CssBaseline, ThemeProvider } from '@mui/material'; // Removed createTheme import
import { useStore } from '@nanostores/react';
import { themeStore } from './stores/themeStore';
import { getAppTheme } from './theme'; // Import the new theme function

const rootElement = document.getElementById('root')!;

const Root = () => {
  const { mode } = useStore(themeStore);

  useEffect(() => {
    // Apply 'dark' class to body for Tailwind CSS dark mode
    if (mode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [mode]);

  const theme = React.useMemo(
    () => getAppTheme(mode), // Use the new getAppTheme function
    [mode],
  );

  return (
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* enableColorScheme respects system preference and theme.palette.mode */}
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(rootElement).render(<Root />);
