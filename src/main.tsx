import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { themeStore } from './stores/themeStore';

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
    () =>
      createTheme({
        palette: {
          mode: mode,
          primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2', // Example: light blue for dark mode, default blue for light
          },
          secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e', // Example: light pink for dark, default pink for light
          },
          error: {
            main: mode === 'dark' ? '#ef9a9a' : '#d32f2f', // Example: light red for dark, default red for light
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#ffffff',
            paper: mode === 'dark' ? '#1d1d1d' : '#f4f4f4',
          },
        },
        typography: {
          fontFamily: ['Inter', 'sans-serif'].join(','),
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                // Ensure AppBar background respects theme.palette.primary.main for consistency
                // Tailwind's bg-gray-100 will override this if applied directly on Toolbar
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none', // Disable default MUI paper gradient
              },
            },
          },
          MuiAccordionSummary: {
            styleOverrides: {
              content: {
                '&.Mui-expanded': {
                  margin: '12px 0',
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />{' '}
          {/* enableColorScheme respects system preference and theme.palette.mode */}
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(rootElement).render(<Root />);
