import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SpotifySearchPageProps {
  // No specific props for now
}

const SpotifySearchPage: React.FC<SpotifySearchPageProps> = () => {
  const theme = useTheme();

  const mockGenres = [
    { id: 1, name: 'Pop', color: '#8d6e63' }, // Brown
    { id: 2, name: 'Hip Hop', color: '#4a148c' }, // Purple
    { id: 3, name: 'Rock', color: '#b71c1c' }, // Red
    { id: 4, name: 'Jazz', color: '#1b5e20' }, // Green
    { id: 5, name: 'Electronic', color: '#006064' }, // Teal
    { id: 6, name: 'Classical', color: '#311b92' }, // Dark Purple
    { id: 7, name: 'R&B', color: '#f57f17' }, // Amber
    { id: 8, name: 'Country', color: '#bf360c' }, // Deep Orange
    { id: 9, name: 'Indie', color: '#2e7d32' }, // Dark Green
    { id: 10, name: 'Metal', color: '#424242' }, // Grey
    { id: 11, name: 'Blues', color: '#5d4037' }, // Brown
    { id: 12, name: 'Folk', color: '#880e4f' }, // Pink
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Search
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="What do you want to listen to?"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '500px', // Pill shape
            bgcolor: theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent', // Hide border by default
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main, // Show border on hover
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main, // Show border on focus
            },
          },
        }}
        sx={{ mb: 4 }}
      />

      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Browse all
      </Typography>

      <Grid container spacing={2}>
        {mockGenres.map((genre) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            lg={2}
            key={genre.id}
            component="div"
          >
            <Card
              sx={{
                height: 120,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'flex-end',
                p: 2,
                cursor: 'pointer',
                position: 'relative',
                bgcolor: genre.color, // Use dynamic color
                color: 'white', // Text color for contrast
                boxShadow: theme.shadows[3],
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.03)',
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {genre.name}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SpotifySearchPage;
