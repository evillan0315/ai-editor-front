import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
  Rating,
  Grow,
  Slide,
  useTheme,
  useMediaQuery,
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
  Close,
  Theaters,
  Info,
  Download,
} from '@mui/icons-material';

// Types
import { Video, MediaFileResponseDto } from '@/types/refactored/media';

interface MenuItem {
  label: string;
  value: string;
  icon: React.ReactElement;
  divider?: boolean;
}

interface VideoListProps {
  videos: MediaFileResponseDto[];
  onPlay: (video: MediaFileResponseDto) => void;
  onFavorite: (videoId: string) => void;
  onAction: (action: string, video: MediaFileResponseDto) => void;
  menuItems?: MenuItem[];
}

type ViewMode = 'list' | 'grid' | 'thumb';
type SortField = 'title' | 'year' | 'rating' | 'duration';

const VideoList: React.FC<VideoListProps> = ({
  videos,
  onPlay,
  onFavorite,
  onAction,
  menuItems = [
    { label: 'Play Trailer', value: 'trailer', icon: <Theaters /> },
    {
      label: 'Add to Watchlist',
      value: 'watchlist',
      icon: <FavoriteBorder />,
      divider: true,
    },
    { label: 'Download', value: 'download', icon: <Download /> },
    { label: 'Info', value: 'info', icon: <Info /> },
  ],
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<MediaFileResponseDto | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Derived data
  const genres = useMemo(() => {
    const allGenres = videos.flatMap((video) => video.video?.cast ?? []);
    return ['all', ...Array.from(new Set(allGenres))];
  }, [videos]);

  const filteredAndSortedVideos = useMemo(
    () =>
      videos
        .filter((video) => {
          const matchesSearch =
            video.video?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.video?.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (video.video?.cast &&
              video.video?.cast.some((actor) =>
                actor.toLowerCase().includes(searchQuery.toLowerCase()),
              ));

          const matchesGenre =
            selectedGenre === 'all' || video.video?.cast?.includes(selectedGenre) || false;

          return matchesSearch && matchesGenre;
        })
        .sort((a, b) => {
          const modifier = sortOrder === 'asc' ? 1 : -1;

          if (sortField === 'title') {
            const aValue = a.video ? a.video.title : '';
            const bValue = b.video ? b.video.title : '';

            if (aValue < bValue) return -1 * modifier;
            if (aValue > bValue) return 1 * modifier;
            return 0;
          } else if (sortField === 'year') {
            const aYear = a.video ? (a.video.year || 0) : 0;
            const bYear = b.video ? (b.video.year || 0) : 0;
            return (aYear - bYear) * modifier;
          } else if (sortField === 'rating') {
            const aRating = a.video ? (a.video.rating || 0) : 0;
            const bRating = b.video ? (b.video.rating || 0) : 0;
            return (aRating - bRating) * modifier;
          } else {
            const aDuration = a.video ? (a.video.duration || 0) : 0;
            const bDuration = b.video ? (b.video.duration || 0) : 0;
            return (aDuration - bDuration) * modifier;
          }
        }),
    [videos, searchQuery, selectedGenre, sortField, sortOrder],
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

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    video: MediaFileResponseDto,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedVideo(video);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedVideo(null);
  };

  const handleVideoHover = (videoId: string | null) => {
    setHoveredVideo(videoId);
  };

  const openDetailDialog = (video: MediaFileResponseDto) => {
    setSelectedVideo(video);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedVideo(null);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Render components
  const renderListItems = () => (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
      {filteredAndSortedVideos.map((video) => (
        <Card
          key={video.id}
          sx={{
            mb: 1,
            bgcolor:
              hoveredVideo === video.id ? 'action.hover' : 'background.paper',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={() => handleVideoHover(video.id)}
          onMouseLeave={() => handleVideoHover(null)}
        >
          <Box sx={{ display: 'flex' }}>
            <CardMedia
              component="img"
              sx={{ width: 160, height: 90, objectFit: 'cover' }}
              image={video.url || ''}
              alt={video.video?.title}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minWidth: 0,
              }}
            >
              <CardContent sx={{ flexGrow: 1, py: 1 }}>
                <Typography variant="h6" noWrap>
                  {video.video?.title}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {video.video?.year}
                  </Typography>
                  <span>•</span>
                  <Typography variant="body2" color="text.secondary">
                    {formatDuration(video.video?.duration || 0)}
                  </Typography>
                  <span>•</span>
                  <Rating
                    size="small"
                    value={(video.video?.rating || 0) / 2}
                    precision={0.5}
                    readOnly
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {video.video?.description}
                </Typography>
              </CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <IconButton
                  onClick={() => onFavorite(video.id)}
                  color={video.video?.rating ? 'error' : 'default'}
                  size="small"
                >
                  {video.video?.rating ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
                <IconButton onClick={() => onPlay(video)} size="small">
                  <PlayArrow />
                </IconButton>
                <IconButton
                  onClick={(e) => handleMenuOpen(e, video)}
                  size="small"
                >
                  <MoreVert />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Card>
      ))}
    </Box>
  );

  const renderGridItems = () => (
    <Grid container spacing={2}>
      {filteredAndSortedVideos.map((video) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              transform: hoveredVideo === video.id ? 'scale(1.05)' : 'scale(1)',
              zIndex: hoveredVideo === video.id ? 1 : 0,
              boxShadow: hoveredVideo === video.id ? 6 : 1,
            }}
            onMouseEnter={() => handleVideoHover(video.id)}
            onMouseLeave={() => handleVideoHover(null)}
          >
            <Box sx={{ position: 'relative' }}>
              <CardActionArea onClick={() => openDetailDialog(video)}>
                <CardMedia
                  component="img"
                  height="200"
                  image={video.url || ''}
                  alt={video.video?.title}
                  sx={{ objectFit: 'cover' }}
                />
                <Slide
                  direction="up"
                  in={hoveredVideo === video.id}
                  timeout={300}
                >
                  <Fab
                    color="primary"
                    aria-label="play"
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(video);
                    }}
                  >
                    <PlayArrow />
                  </Fab>
                </Slide>
              </CardActionArea>
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
              <Typography gutterBottom variant="h6" noWrap>
                {video.video?.title}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {video.video?.year}
                </Typography>
                <Chip label={formatDuration(video.video?.duration || 0)} size="small" />
              </Box>
              <Rating
                value={(video.video?.rating || 0) / 2}
                precision={0.5}
                size="small"
                readOnly
              />
            </CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}
            >
              <IconButton
                onClick={() => onFavorite(video.id)}
                color={video.video?.rating ? 'error' : 'default'}
                size="small"
              >
                {video.video?.rating ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <IconButton
                onClick={(e) => handleMenuOpen(e, video)}
                size="small"
              >
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
      {filteredAndSortedVideos.map((video) => (
        <Box
          key={video.id}
          sx={{
            width: 240,
            transition: 'transform 0.3s',
            transform: hoveredVideo === video.id ? 'scale(1.05)' : 'scale(1)',
            zIndex: hoveredVideo === video.id ? 1 : 0,
          }}
          onMouseEnter={() => handleVideoHover(video.id)}
          onMouseLeave={() => handleVideoHover(null)}
        >
          <Card sx={{ position: 'relative' }}>
            <CardActionArea onClick={() => openDetailDialog(video)}>
              <CardMedia
                component="img"
                height="320"
                image={video.url || ''}
                alt={video.video?.title}
                sx={{ objectFit: 'cover' }}
              />
              <Grow in={hoveredVideo === video.id} timeout={300}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    p: 1.5,
                    color: 'white',
                  }}
                >
                  <Typography variant="h6" noWrap>
                    {video.video?.title}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="body2">{video.video?.year}</Typography>
                    <span>•</span>
                    <Typography variant="body2">
                      {formatDuration(video.video?.duration || 0)}
                    </Typography>
                  </Box>
                  <Rating
                    value={(video.video?.rating || 0) / 2}
                    precision={0.5}
                    size="small"
                    readOnly
                  />
                </Box>
              </Grow>
            </CardActionArea>
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 0.5,
              }}
            >
              <IconButton
                onClick={() => onFavorite(video.id)}
                color={video.video?.rating ? 'error' : 'default'}
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                {video.video?.rating ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <IconButton
                onClick={(e) => handleMenuOpen(e, video)}
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                <MoreVert />
              </IconButton>
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
          label="Search videos"
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
            label={`${filteredAndSortedVideos.length} videos`}
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
            onClick={() => handleSortChange('year')}
            color={sortField === 'year' ? 'primary' : 'default'}
          >
            <Typography variant="body2">
              Year {sortField === 'year' && (sortOrder === 'asc' ? '↑' : '↓')}
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
      {filteredAndSortedVideos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No videos found
          </Typography>
          <Typography variant="body1" color="text.secondary">
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
          <MenuItem
            key={item.value}
            onClick={() => selectedVideo && onAction(item.value, selectedVideo)}
            divider={item.divider}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Video Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={closeDetailDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {selectedVideo && (
            <>
              <CardMedia
                component="img"
                image={selectedVideo.url || ''}
                alt={selectedVideo.video?.title}
                sx={{ width: '100%', height: { xs: 200, sm: 400 } }}
              />
              <IconButton
                onClick={closeDetailDialog}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <Close />
              </IconButton>
              <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                  {selectedVideo.video?.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Typography variant="body1">{selectedVideo.video?.year}</Typography>
                  <Typography variant="body1">
                    {formatDuration(selectedVideo.video?.duration || 0)}
                  </Typography>
                  <Rating
                    value={(selectedVideo.video?.rating || 0) / 2}
                    precision={0.5}
                    readOnly
                  />
                </Box>
                <Typography variant="body1" paragraph>
                  {selectedVideo.video?.description}
                </Typography>
                {selectedVideo.video?.director && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Director:</strong> {selectedVideo.video?.director}
                  </Typography>
                )}
                {selectedVideo.video?.cast && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Cast:</strong> {selectedVideo.video?.cast.join(', ')}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  {selectedVideo.video?.cast?.map((genre) => (
                    <Chip key={genre} label={genre} variant="outlined" />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Fab
                    variant="extended"
                    color="primary"
                    onClick={() => onPlay(selectedVideo)}
                    sx={{ minWidth: 120 }}
                  >
                    <PlayArrow sx={{ mr: 1 }} />
                    Play
                  </Fab>
                  <IconButton
                    onClick={() => onFavorite(selectedVideo.id)}
                    color={selectedVideo.video?.rating ? 'error' : 'default'}
                    size="large"
                  >
                    {selectedVideo.video?.rating ? (
                      <Favorite />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VideoList;
