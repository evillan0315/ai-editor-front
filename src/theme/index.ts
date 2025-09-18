import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

export const getAppTheme = (mode: PaletteMode) => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
        light: mode === 'dark' ? '#e3f2fd' : '#42a5f5',
        dark: mode === 'dark' ? '#42a5f5' : '#1565c0',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        light: mode === 'dark' ? '#ffc1e3' : '#ff4081',
        dark: mode === 'dark' ? '#c75a85' : '#c51162',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      error: {
        main: mode === 'dark' ? '#ef9a9a' : '#d32f2f',
        light: mode === 'dark' ? '#ffcdd2' : '#e57373',
        dark: mode === 'dark' ? '#c62828' : '#c62828',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      warning: {
        main: mode === 'dark' ? '#ffb74d' : '#ff9800',
        light: mode === 'dark' ? '#ffecb3' : '#ffb74d',
        dark: mode === 'dark' ? '#c67b00' : '#f57c00',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      info: {
        main: mode === 'dark' ? '#64b5f6' : '#2196f3',
        light: mode === 'dark' ? '#bbdefb' : '#64b5f6',
        dark: mode === 'dark' ? '#0d47a1' : '#1976d2',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      success: {
        main: mode === 'dark' ? '#81c784' : '#4caf50',
        light: mode === 'dark' ? '#c8e6c9' : '#81c784',
        dark: mode === 'dark' ? '#2e7d32' : '#388e3c',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#ffffff',
        paper: mode === 'dark' ? '#1d1d1d' : '#f4f4f4',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212121',
        secondary: mode === 'dark' ? '#bdbdbd' : '#757575',
        disabled: mode === 'dark' ? '#8d8d8d' : '#aaaaaa',
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
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#212121',
            boxShadow:
              mode === 'dark' ? 'none' : 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            // No specific background here, let AppBar handle it.
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#ffffff',
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#292929' : '#f9f9f9',
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`,
            '&.Mui-expanded': {
              margin: '16px 0',
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#efefef',
            minHeight: 48,
            '&.Mui-expanded': {
              minHeight: 48,
            },
          },
          content: {
            margin: '12px 0',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            backgroundColor: mode === 'dark' ? '#90caf9' : '#1976d2',
            color: mode === 'dark' ? '#000000' : '#ffffff',
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#64b5f6' : '#1565c0',
            },
          },
          outlinedPrimary: {
            borderColor: mode === 'dark' ? '#90caf9' : '#1976d2',
            color: mode === 'dark' ? '#90caf9' : '#1976d2',
            '&:hover': {
              borderColor: mode === 'dark' ? '#64b5f6' : '#1565c0',
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(144, 202, 249, 0.08)'
                  : 'rgba(25, 118, 210, 0.04)',
            },
          },
          textPrimary: {
            color: mode === 'dark' ? '#90caf9' : '#1976d2',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(144, 202, 249, 0.04)'
                  : 'rgba(25, 118, 210, 0.04)',
            },
          },
          containedSecondary: {
            backgroundColor: mode === 'dark' ? '#f48fb1' : '#dc004e',
            color: mode === 'dark' ? '#000000' : '#ffffff',
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#f06292' : '#b71c1c',
            },
          },
          outlinedSecondary: {
            borderColor: mode === 'dark' ? '#f48fb1' : '#dc004e',
            color: mode === 'dark' ? '#f48fb1' : '#dc004e',
            '&:hover': {
              borderColor: mode === 'dark' ? '#f06292' : '#b71c1c',
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(244, 143, 177, 0.08)'
                  : 'rgba(220, 0, 78, 0.04)',
            },
          },
          textSecondary: {
            color: mode === 'dark' ? '#f48fb1' : '#dc004e',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(244, 143, 177, 0.04)'
                  : 'rgba(220, 0, 78, 0.04)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              color: mode === 'dark' ? '#ffffff' : '#212121',
            },
            '& .MuiInputLabel-root': {
              color: mode === 'dark' ? '#bdbdbd' : '#757575',
              '&.Mui-focused': {
                color: mode === 'dark' ? '#90caf9' : '#1976d2',
              },
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor:
                  mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.23)'
                    : 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: mode === 'dark' ? '#90caf9' : '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'dark' ? '#90caf9' : '#1976d2',
              },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#212121',
            // FIX: Changed themeOptions.palette?.mode to 'mode'
            boxShadow:
              mode === 'dark'
                ? '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)'
                : 'none',
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#1d1d1d' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#212121',
            // FIX: Changed themeOptions.palette?.mode to 'mode'
            boxShadow:
              mode === 'dark'
                ? '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)'
                : 'none',
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#ffffff' : '#212121',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor:
              mode === 'dark'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            fontSize: '0.75rem',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 4,
          },
          filled: {
            backgroundColor:
              mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)',
            color: mode === 'dark' ? '#ffffff' : '#212121',
          },
          outlined: {
            borderColor:
              mode === 'dark'
                ? 'rgba(255, 255, 255, 0.23)'
                : 'rgba(0, 0, 0, 0.23)',
            color: mode === 'dark' ? '#ffffff' : '#212121',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: {
            color: mode === 'dark' ? '#ffffff' : '#212121',
          },
          select: {
            '&:focus': {
              backgroundColor: 'transparent',
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            color:
              mode === 'dark'
                ? 'rgba(255, 255, 255, 0.4)'
                : 'rgba(0, 0, 0, 0.54)',
          },
          colorPrimary: {
            '&.Mui-checked': {
              color: mode === 'dark' ? '#90caf9' : '#1976d2',
            },
            '&.Mui-checked + .MuiSwitch-track': {
              backgroundColor: mode === 'dark' ? '#90caf9' : '#1976d2',
            },
          },
          track: {
            backgroundColor:
              mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.26)',
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            // Custom positioning if needed, otherwise default to bottom-left/center
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: mode === 'dark' ? '#292929' : '#e0e0e0',
            color: mode === 'dark' ? '#ffffff' : '#212121',
          },
          filledError: {
            backgroundColor: mode === 'dark' ? '#ef9a9a' : '#d32f2f',
          },
          filledInfo: {
            backgroundColor: mode === 'dark' ? '#64b5f6' : '#2196f3',
          },
          filledSuccess: {
            backgroundColor: mode === 'dark' ? '#81c784' : '#4caf50',
          },
          filledWarning: { backgroundColor: 'transparent' },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: mode === 'dark' ? '#90caf9' : '#1976d2',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#bdbdbd' : '#757575',
            '&.Mui-selected': {
              color: mode === 'dark' ? '#ffffff' : '#212121',
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#90caf9' : '#1976d2',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#bdbdbd' : '#757575',
            '&:hover': {
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#90caf9' : '#1976d2',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: 8,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#292929' : '#f5f5f5',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor:
              mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
            color: mode === 'dark' ? '#ffffff' : '#212121',
          },
          head: {
            fontWeight: 'bold',
            color: mode === 'dark' ? '#ffffff' : '#212121',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
