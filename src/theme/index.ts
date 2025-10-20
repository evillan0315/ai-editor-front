import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Define the custom grayscale palette based on user request
const customBlackPalette = {
  50: '#f6f6f6',
  100: '#e7e7e7',
  200: '#d1d1d1',
  300: '#b0b0b0',
  400: '#888888',
  500: '#6d6d6d',
  600: '#5d5d5d',
  700: '#4f4f4f',
  800: '#454545',
  900: '#1d1d1d',
  950: '#121212', // This is a custom addition beyond standard MUI grey 900
};

// Define the new custom outer-space palette
const outerSpacePalette = {
  50: '#f4f7f7',
  100: '#e4e9e9',
  200: '#cbd5d6',
  300: '#a7b7b9',
  400: '#7b9295',
  500: '#60777a',
  600: '#526468',
  700: '#475457',
  800: '#3f484b',
  900: '#2e3436',
  950: '#22282a',
};

// Define the new custom denim palette
const denimPalette = {
  50: '#f4f6fb',
  100: '#e7edf7',
  200: '#cad9ed',
  300: '#9bb9de',
  400: '#6595cb',
  500: '#4277b5',
  600: '#3465a4',
  700: '#284b7c',
  800: '#254167',
  900: '#233857',
  950: '#17243a',
};

export const getAppTheme = (mode: PaletteMode) => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      // Apply custom black palette to MUI grey shades
      grey: customBlackPalette,
      // Add the new outerSpace palette
      outerSpace: outerSpacePalette,
      // Add the new denim palette
      denim: denimPalette,
      primary: {
        main: mode === 'dark' ? denimPalette[950] : denimPalette[50],
        light: mode === 'dark' ? '#e3f2fd' : '#42a5f5',
        dark: mode === 'dark' ? '#42a5f5' : '#1565c0',
        contrastText: mode === 'dark' ? denimPalette[50] : denimPalette[950],
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        light: mode === 'dark' ? '#ffc1e3' : '#ff4081',
        dark: mode === 'dark' ? '#c75a85' : '#c51162',
        contrastText: mode === 'dark' ? customBlackPalette[950] : customBlackPalette[50],
      },
      error: {
        main: mode === 'dark' ? '#ef9a9a' : '#d32f2f',
        light: mode === 'dark' ? '#ffcdd2' : '#e57373',
        dark: mode === 'dark' ? '#c62828' : '#c62828',
        contrastText: mode === 'dark' ? customBlackPalette[950] : customBlackPalette[50],
      },
      warning: {
        main: mode === 'dark' ? '#ffb74d' : '#ff9800',
        light: mode === 'dark' ? '#ffecb3' : '#ffb74d',
        dark: mode === 'dark' ? '#c67b00' : '#f57c00',
        contrastText: mode === 'dark' ? customBlackPalette[950] : customBlackPalette[50],
      },
      info: {
        main: mode === 'dark' ? '#64b5f6' : '#2196f3',
        light: mode === 'dark' ? '#bbdefb' : '#64b5f6',
        dark: mode === 'dark' ? '#0d47a1' : '#1976d2',
        contrastText: mode === 'dark' ? customBlackPalette[950] : customBlackPalette[50],
      },
      success: {
        main: mode === 'dark' ? '#81c784' : '#4caf50',
        light: mode === 'dark' ? '#c8e6c9' : '#81c784',
        dark: mode === 'dark' ? '#2e7d32' : '#388e3c',
        contrastText: mode === 'dark' ? customBlackPalette[950] : customBlackPalette[50],
      },
      background: {
        default: mode === 'dark' ? customBlackPalette[950] : customBlackPalette[50],
        paper: mode === 'dark' ? customBlackPalette[900] : customBlackPalette[100],
      },
      text: {
        primary: mode === 'dark' ? customBlackPalette[50] : customBlackPalette[950],
        secondary: mode === 'dark' ? customBlackPalette[300] : customBlackPalette[600],
        disabled: customBlackPalette[400],
      },
      divider:
        mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
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
          '.markdown-body': {
            backgroundColor: mode === 'dark' ? customBlackPalette[900] : customBlackPalette[100],
          },
          '.markdown-body hr': {
            borderColor:  mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          },
          '.markdown-body pre > div': {
            backgroundColor: mode === 'dark' ? customBlackPalette[950] : customBlackPalette[50],
            padding: '1rem'
          },
          '.markdown-body pre .language-btn': {
            backgroundColor: mode === 'dark' ? '#90caf9' : '#1976d2',
            padding: '.5rem'
          },
          '.cm-editor .cm-gutters': {
            backgroundColor: mode === 'dark' ? customBlackPalette[900] : customBlackPalette[100],
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? customBlackPalette[300] : customBlackPalette[600],
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(0, 0, 0, 0.04)',
            },
          },
          colorPrimary: {
            color: mode === 'dark' ? '#90caf9' : '#1976d2',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(144, 202, 249, 0.08)'
                  : 'rgba(25, 118, 210, 0.08)',
            },
          },
          colorSecondary: {
            color: mode === 'dark' ? '#f48fb1' : '#dc004e',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(244, 143, 177, 0.08)'
                  : 'rgba(220, 0, 78, 0.08)',
            },
          },
          colorError: {
            color: mode === 'dark' ? '#ef9a9a' : '#d32f2f',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(239, 154, 154, 0.08)'
                  : 'rgba(211, 47, 47, 0.08)',
            },
          },
          colorWarning: {
            color: mode === 'dark' ? '#ffb74d' : '#ff9800',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(255, 183, 77, 0.08)'
                  : 'rgba(255, 152, 0, 0.08)',
            },
          },
          colorInfo: {
            color: mode === 'dark' ? '#64b5f6' : '#2196f3',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(100, 181, 246, 0.08)'
                  : 'rgba(33, 150, 243, 0.08)',
            },
          },
          colorSuccess: {
            color: mode === 'dark' ? '#81c784' : '#4caf50',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(129, 199, 132, 0.08)'
                  : 'rgba(76, 175, 80, 0.08)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            //border: `1px solid ${theme.palette.divider}`,
            //backgroundColor: theme.palette.background.paper,
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            //backgroundColor: theme.palette.background.default,
            borderRadius: 6,
          }),
        },
      },
    },
  };

  return createTheme(themeOptions);
};
