import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  MoreVert,
  ViewList,
  ViewModule,
  ViewComfy,
  Search,
  Edit,
  Delete,
  Download,
  Update,
  LibraryMusic,
} from '@mui/icons-material';

// Types
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string[];
  isFavorite: boolean;
  thumbnail?: string;
  year?: number;
}

interface MenuItem {
  label: string;
  value: string;
  icon: React.ReactElement;
  divider?: boolean;
}

interface SongListProps {
  songs: Song[];
  onPlay: (song: Song) => void;
  onFavorite: (songId: string) => void;
  onAction: (action: string, song: Song) => void;
  menuItems?: MenuItem[];
}

type ViewMode = 'list' | 'grid' | 'thumb';
type SortField = 'title' | 'artist' | 'album' | 'duration' | 'year';

const SongList: React.FC<SongListProps> = ({
  songs,
  onPlay,
  onFavorite,
  onAction,
  menuItems = [
    { label: 'Edit', value: 'edit', icon: <Edit /> },
    { label: 'Delete', value: 'delete', icon: <Delete />, divider: true },
    { label: 'Download Metadata', value: 'download', icon: <Download /> },
    { label: 'Update Metadata', value: 'update', icon: <Update /> },
  ],
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  // Derived data
  const genres = useMemo(() => {
    const allGenres = songs.flatMap((song) => song.genre);
    return ['all', ...Array.from(new Set(allGenres))];
  }, [songs]);

  const filteredAndSortedSongs = useMemo(
    () =>
      songs
        .filter((song) => {
          const matchesSearch =
            song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.album.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesGenre =
            selectedGenre === 'all' || song.genre.includes(selectedGenre);

          return matchesSearch && matchesGenre;
        })
        .sort((a, b) => {
          const modifier = sortOrder === 'asc' ? 1 : -1;

          if (sortField === 'duration') {
            return (a.duration - b.duration) * modifier;
          }

          // Handle optional year field
          if (sortField === 'year') {
            const aYear = a.year ?? 0;
            const bYear = b.year ?? 0;
            return (aYear - bYear) * modifier;
          }

          // For string fields (title, artist, album)
          const aValue = a[sortField] ?? '';
          const bValue = b[sortField] ?? '';

          if (aValue < bValue) return -1 * modifier;
          if (aValue > bValue) return 1 * modifier;
          return 0;
        }),
    [songs, searchQuery, selectedGenre, sortField, sortOrder],
  );

  // Handlers
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, song: Song) => {
    setMenuAnchor(event.currentTarget);
    setSelectedSong(song);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSong(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render components
  const renderListItems = () => (
    <List sx={{ bgcolor: 'background.paper' }}>
      {filteredAndSortedSongs.map((song) => (
        <ListItem
          key={song.id}
          secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={() => onFavorite(song.id)}
                color={song.isFavorite ? 'error' : 'default'}
              >
                {song.isFavorite ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <IconButton onClick={(e) => handleMenuOpen(e, song)}>
                <MoreVert />
              </IconButton>
            </Box>
          }
          disablePadding
        >
          <ListItemButton onClick={() => onPlay(song)} sx={{ py: 1 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PlayArrow />
            </ListItemIcon>
            {song.thumbnail && (
              <CardMedia
                component="img"
                sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                image={song.thumbnail}
                alt={song.title}
              />
            )}
            <ListItemText
              primary={song.title}
              secondary={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {song.artist}
                  </Typography>
                  <span>•</span>
                  <Typography variant="body2" color="text.secondary">
                    {song.album}
                  </Typography>
                  {song.year && (
                    <>
                      <span>•</span>
                      <Typography variant="body2" color="text.secondary">
                        {song.year}
                      </Typography>
                    </>
                  )}
                </Box>
              }
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {song.genre.slice(0, 2).map((genre) => (
                  <Chip
                    key={genre}
                    label={genre}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {song.genre.length > 2 && (
                  <Chip label={`+${song.genre.length - 2}`} size="small" />
                )}
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 50, textAlign: 'right' }}
              >
                {formatDuration(song.duration)}
              </Typography>
            </Box>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  const renderGridItems = () => (
    <Grid container spacing={2}>
      {filteredAndSortedSongs.map((song) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={song.id}>
          <Card
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <CardActionArea onClick={() => onPlay(song)} sx={{ flexGrow: 1 }}>
              <CardMedia
                component="img"
                height="200"
                image={song.thumbnail || '/placeholder-album.jpg'}
                alt={song.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" noWrap>
                  {song.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {song.artist}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {song.album}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {song.year}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDuration(song.duration)}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}
            >
              <IconButton
                onClick={() => onFavorite(song.id)}
                color={song.isFavorite ? 'error' : 'default'}
              >
                {song.isFavorite ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <IconButton onClick={(e) => handleMenuOpen(e, song)}>
                <MoreVert />
              </IconButton>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderThumbItems = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {filteredAndSortedSongs.map((song) => (
        <Box key={song.id} sx={{ width: 160 }}>
          <Card>
            <CardActionArea onClick={() => onPlay(song)}>
              <CardMedia
                component="img"
                height="160"
                image={song.thumbnail || '/placeholder-album.jpg'}
                alt={song.title}
                sx={{ objectFit: 'cover' }}
              />
            </CardActionArea>
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" noWrap title={song.title}>
                {song.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {song.artist}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => onFavorite(song.id)}
                  color={song.isFavorite ? 'error' : 'default'}
                >
                  {song.isFavorite ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  {formatDuration(song.duration)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, song)}
                >
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box>
      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          label="Search songs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 200, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Genre</InputLabel>
          <Select
            value={selectedGenre}
            label="Genre"
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            {genres.map((genre) => (
              <MenuItem key={genre} value={genre}>
                {genre === 'all' ? 'All Genres' : genre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip
            icon={<LibraryMusic />}
            label={`${filteredAndSortedSongs.length} songs`}
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <IconButton
            onClick={() => handleSortChange('title')}
            color={sortField === 'title' ? 'primary' : 'default'}
          >
            <Typography variant="body2">
              Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Typography>
          </IconButton>
          <IconButton
            onClick={() => handleSortChange('artist')}
            color={sortField === 'artist' ? 'primary' : 'default'}
          >
            <Typography variant="body2">
              Artist{' '}
              {sortField === 'artist' && (sortOrder === 'asc' ? '↑' : '↓')}
            </Typography>
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex' }}>
          <IconButton
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ViewList />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <ViewModule />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('thumb')}
            color={viewMode === 'thumb' ? 'primary' : 'default'}
          >
            <ViewComfy />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      {filteredAndSortedSongs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No songs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'list' && renderListItems()}
          {viewMode === 'grid' && renderGridItems()}
          {viewMode === 'thumb' && renderThumbItems()}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        {menuItems.map((item, index) => (
          <Box key={item.value}>
            <MenuItem
              onClick={() => selectedSong && onAction(item.value, selectedSong)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
            {item.divider && <Divider />}
          </Box>
        ))}
      </Menu>
    </Box>
  );
};

export default SongList;
