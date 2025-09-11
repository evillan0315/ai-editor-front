import React, { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import SpotifySidebar from './SpotifySidebar';
import SpotifyMainContent from './SpotifyMainContent';
import SpotifyPlayerBar from './SpotifyPlayerBar';

type SpotifyView = 'home' | 'search' | 'library' | 'settings'; // New: Added 'settings' view

const SpotifyAppPage: React.FC = () => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<SpotifyView>('home'); // State to manage the main content view

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateAreas: `'sidebar main'
                            'player player'`, // Named grid areas
        gridTemplateColumns: '250px 1fr', // Fixed sidebar width, main content fills rest
        gridTemplateRows: '1fr auto', // Main content fills space, player bar is auto height
        flexGrow: 1, // Fill available vertical space within the parent (Layout's <main>)
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        overflow: 'hidden', // Prevent scrollbars on the main container
      }}
    >
      <SpotifySidebar currentView={currentView} onSelectView={setCurrentView} />
      <SpotifyMainContent currentView={currentView} />
      <SpotifyPlayerBar />
    </Box>
  );
};

export default SpotifyAppPage;
