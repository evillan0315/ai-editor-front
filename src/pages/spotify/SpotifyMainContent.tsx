import React from 'react';
import { Box, useTheme, Typography } from '@mui/material';
import SpotifyHomePage from './SpotifyHomePage';
import SpotifySearchPage from './SpotifySearchPage';
import SpotifyLibraryPage from './SpotifyLibraryPage';

interface SpotifyMainContentProps {
  currentView: 'home' | 'search' | 'library';
}

const SpotifyMainContent: React.FC<SpotifyMainContentProps> = ({
  currentView,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        gridArea: 'main',
        bgcolor: theme.palette.background.default,
        overflowY: 'auto', // Allow main content to scroll
        p: 3,
      }}
    >
      {currentView === 'home' && <SpotifyHomePage />}
      {currentView === 'search' && <SpotifySearchPage />}
      {currentView === 'library' && <SpotifyLibraryPage />}
    </Box>
  );
};

export default SpotifyMainContent;
