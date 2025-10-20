import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Define a comprehensive grayscale palette inspired by VS Code dark and light themes.
// This ensures a consistent set of neutral tones for backgrounds, text, and borders.
const vsCodeGrayscale = {
  // Dark mode shades (D_ prefix)
  D_950: '#121212', // Deepest background, for maximum contrast (e.g., active elements)
  D_900: '#1E1E1E', // Editor background, default app background
  D_800: '#252526', // Sidebar, panel, paper background
  D_700: '#333333', // Activity bar, some toolbar backgrounds
  D_600: '#3C3C3C', // Slightly lighter borders, disabled elements
  D_500: '#444444', // Main borders, dividers
  D_400: '#606060', // Disabled text
  D_300: '#808080', // Secondary text
  D_200: '#A7A7A7', // Muted elements, very light secondary text
  D_100: '#D4D4D4', // Primary text
  D_50: '#FFFFFF', // Pure white, for highest contrast elements

  // Light mode shades (L_ prefix)
  L_50: '#FFFFFF', // Pure white, for light mode default background
  L_100: '#F3F3F3', // Light mode paper background
  L_200: '#E0E0E0', // Light mode borders/dividers
  L_300: '#CCCCCC', // Muted light mode elements
  L_400: '#A0A0A0', // Disabled text light
  L_500: '#808080', // Secondary text light
  L_600: '#606060', // Darker secondary text
  L_700: '#404040', // Dark text for light mode
  L_800: '#333333', // Primary text light
  L_900: '#222222', // Very dark for light mode (e.g., strong borders)
  L_950: '#000000', // Black, for highest contrast text
};

// Maps the custom VS Code grayscale to MUI's `palette.grey`
const getMuiGreyPalette = (mode: PaletteMode) => ({
  50: mode === 'dark' ? vsCodeGrayscale.D_100 : vsCodeGrayscale.L_50,
  100: mode === 'dark' ? vsCodeGrayscale.D_100 : vsCodeGrayscale.L_100,
  200: mode === 'dark' ? vsCodeGrayscale.D_200 : vsCodeGrayscale.L_200,
  300: mode === 'dark' ? vsCodeGrayscale.D_300 : vsCodeGrayscale.L_300,
  400: mode === 'dark' ? vsCodeGrayscale.D_400 : vsCodeGrayscale.L_400,
  500: mode === 'dark' ? vsCodeGrayscale.D_500 : vsCodeGrayscale.L_500,
  600: mode === 'dark' ? vsCodeGrayscale.D_600 : vsCodeGrayscale.L_600,
  700: mode === 'dark' ? vsCodeGrayscale.D_700 : vsCodeGrayscale.L_700,
  800: mode === 'dark' ? vsCodeGrayscale.D_800 : vsCodeGrayscale.L_800,
  900: mode === 'dark' ? vsCodeGrayscale.D_900 : vsCodeGrayscale.L_900,
  950: mode === 'dark' ? vsCodeGrayscale.D_950 : vsCodeGrayscale.L_950,
});

export const getAppTheme = (mode: PaletteMode) => {
  const muiGrey = getMuiGreyPalette(mode);

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      grey: muiGrey, // Apply the VS Code inspired grayscale palette
      primary: {
        // VS Code's accent blue
        main: '#007ACC',
        light: mode === 'dark' ? '#ADD6FF' : '#B3D9FF',
        dark: mode === 'dark' ? '#005F99' : '#005F99',
        contrastText: mode === 'dark' ? muiGrey[950] : muiGrey[50],
      },
      secondary: {
        // A subtle neutral or muted blue for secondary actions
        main: mode === 'dark' ? muiGrey[300] : muiGrey[600],
        light: mode === 'dark' ? muiGrey[200] : muiGrey[400],
        dark: mode === 'dark' ? muiGrey[500] : muiGrey[800],
        contrastText: mode === 'dark' ? muiGrey[950] : muiGrey[50],
      },
      error: {
        // VS Code-like red
        main: mode === 'dark' ? '#F44747' : '#D32F2F',
        light: mode === 'dark' ? '#FE7676' : '#E57373',
        dark: mode === 'dark' ? '#C23737' : '#C62828',
        contrastText: mode === 'dark' ? muiGrey[950] : muiGrey[50],
      },
      warning: {
        // VS Code-like yellow-orange
        main: mode === 'dark' ? '#DDA020' : '#ED6C02',
        light: mode === 'dark' ? '#FFD700' : '#FF9800',
        dark: mode === 'dark' ? '#B58B1B' : '#E65100',
        contrastText: mode === 'dark' ? muiGrey[950] : muiGrey[50],
      },
      info: {
        // A standard vibrant blue for info messages
        main: mode === 'dark' ? '#318CE7' : '#0288D1',
        light: mode === 'dark' ? '#6BA8ED' : '#2196F3',
        dark: mode === 'dark' ? '#246BB3' : '#01579B',
        contrastText: mode === 'dark' ? muiGrey[950] : muiGrey[50],
      },
      success: {
        // VS Code-like green
        main: mode === 'dark' ? '#37944F' : '#2E7D32',
        light: mode === 'dark' ? '#5CB86D' : '#4CAF50',
        dark: mode === 'dark' ? '#2B703C' : '#1B5E20',
        contrastText: mode === 'dark' ? muiGrey[950] : muiGrey[50],
      },
      background: {
        // Default background maps to editor background
        default: mode === 'dark' ? muiGrey[900] : muiGrey[50],
        // Paper background maps to sidebar/panel background
        paper: mode === 'dark' ? muiGrey[800] : muiGrey[100],
      },
      text: {
        primary: mode === 'dark' ? muiGrey[100] : muiGrey[800],
        secondary: mode === 'dark' ? muiGrey[300] : muiGrey[600],
        disabled: muiGrey[400],
      },
      divider:
        mode === 'dark' ? muiGrey[500] : muiGrey[200],
    },
    typography: {
      fontFamily: ['Inter', 'sans-serif'].join(','),
      h1: { fontSize: '3.5rem' },
      h2: { fontSize: '3rem' },
      h3: { fontSize: '2.5rem' },
      h4: { fontSize: '2rem' },
      h5: { fontSize: '1.5rem' },
      h6: { fontSize: '1.25rem' },
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.875rem' },
      button: { textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Adjust markdown body background and border colors for theme consistency
          '.markdown-body': {
            backgroundColor: mode === 'dark' ? muiGrey[800] : muiGrey[100],
          },
          '.markdown-body hr': {
            borderColor:  mode === 'dark' ? muiGrey[500] : muiGrey[200],
          },
          '.markdown-body pre > div': {
            backgroundColor: mode === 'dark' ? muiGrey[900] : muiGrey[50],
            padding: '1.2rem',
            marginBottom: '1rem',
            marginTop: '1rem'
          },
          '.markdown-body pre .language-btn': {
            backgroundColor: mode === 'dark' ? muiGrey[600] : muiGrey[700],
            color: mode === 'dark' ? muiGrey[100] : muiGrey[50],
            marginTop: '1rem',
            padding: '.2rem'
          },
          // Adjust CodeMirror gutter background for theme consistency
          '.cm-editor .cm-gutters': {
            backgroundColor: mode === 'dark' ? muiGrey[900] : muiGrey[100],
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? muiGrey[200] : muiGrey[700],
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)',
            },
          },
          // Ensure icon button colors use the new palette
          colorPrimary: {
            color: '#007ACC',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(0, 122, 204, 0.08)'
                  : 'rgba(0, 122, 204, 0.08)',
            },
          },
          colorSecondary: {
            color: mode === 'dark' ? muiGrey[300] : muiGrey[600],
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(128, 128, 128, 0.08)' // Using muiGrey[300] equivalent with alpha
                  : 'rgba(96, 96, 96, 0.08)', // Using muiGrey[600] equivalent with alpha
            },
          },
          colorError: {
            color: mode === 'dark' ? '#F44747' : '#D32F2F',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(244, 71, 71, 0.08)'
                  : 'rgba(211, 47, 47, 0.08)',
            },
          },
          colorWarning: {
            color: mode === 'dark' ? '#DDA020' : '#ED6C02',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(221, 160, 32, 0.08)'
                  : 'rgba(237, 108, 2, 0.08)',
            },
          },
          colorInfo: {
            color: mode === 'dark' ? '#318CE7' : '#0288D1',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(49, 140, 231, 0.08)'
                  : 'rgba(2, 136, 209, 0.08)',
            },
          },
          colorSuccess: {
            color: mode === 'dark' ? '#37944F' : '#2E7D32',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(55, 148, 79, 0.08)'
                  : 'rgba(46, 125, 50, 0.08)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            // Uncommented and updated for theme consistency
            //border: `1px solid ${muiGrey[500]}`,
            //backgroundColor: theme.palette.background.paper,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderRadius: 6,
          }),
        },
      },
    },
  };

  return createTheme(themeOptions);
};
