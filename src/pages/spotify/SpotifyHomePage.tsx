import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  $spotifyStore,
  playTrack,
  fetchMediaForPurpose,
  isPlayingAtom,
  currentTrackAtom,
} from '@/stores/spotifyStore';
import { MediaFileResponseDto, FileType } from '@/types';
import { mapMediaFileToTrack } from '@/utils/mediaUtils';
import { authStore } from '@/stores/authStore';
import SongList from '@/components/ui/SongList';
import VideoList from '@/components/ui/VideoList';
import { showGlobalSnackbar } from '@/stores/aiEditorStore';


interface SpotifyHomePageProps {
  // No specific props for now, just static content
}

const SpotifyHomePage: React.FC<SpotifyHomePageProps> = () => {
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore); // Get login status
  const { allAvailableMediaFiles, isFetchingMedia, fetchMediaError } = useStore($spotifyStore);

  // Directly get isPlaying and currentTrack from their respective atoms
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);
  const [favoriteSongs, setFavoriteSongs] = useState<string[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<string[]>([]);
  const [hasFetchedMedia, setHasFetchedMedia] = useState(false);

  useEffect(() => {
    // Fetch media files when the component mounts if not already fetched
    // Use 'general' purpose to populate allAvailableMediaFiles, with reset: true
    if (!hasFetchedMedia && !isFetchingMedia) {
      fetchMediaForPurpose({ page: 1, pageSize: 200, fileType: 'AUDIO' }, 'general', false);
      setHasFetchedMedia(true);
    }
  }, [hasFetchedMedia, isFetchingMedia]);

  // Filter for audio files
  const playableAudioTracks: MediaFileResponseDto[] = allAvailableMediaFiles.filter(media => media.fileType === FileType.AUDIO);
  // Filter for video files
  const playableVideoTracks: MediaFileResponseDto[] = allAvailableMediaFiles.filter(media => media.fileType === FileType.VIDEO);

  const handlePlayAudio = useCallback((song: any) => {
    console.log(song, 'song')
    playTrack(song, playableAudioTracks.map(mapMediaFileToTrack));
  }, [playableAudioTracks]);

  const handlePlayVideo = useCallback((video: any) => {
    playTrack(video, playableVideoTracks.map(mapMediaFileToTrack));
  }, [playableVideoTracks]);

  const toggleFavoriteSong = useCallback((songId: string) => {
    setFavoriteSongs(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  }, []);

  const toggleFavoriteVideo = useCallback((videoId: string) => {
    setFavoriteVideos(prev =>
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  }, []);

  const handleSongAction = (action: string, song: any) => {
    showGlobalSnackbar(`Action: ${action} on song ${song.title}`, 'info');
    // Implement other actions like edit, delete, download, etc.
  };

  const handleVideoAction = (action: string, video: any) => {
    showGlobalSnackbar(`Action: ${action} on video ${video.title}`, 'info');
    // Implement other actions like trailer, watchlist, download, etc.
  };


  const audioList = useMemo(() => {
    return playableAudioTracks.map((mediaFile) => {
      const track = mapMediaFileToTrack(mediaFile);
      return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        genre: ['Opm', 'Classic'],
        isFavorite: favoriteSongs.includes(track.id),
        thumbnail: track.coverArt,
        year: 2023,
      };
    });
  }, [playableAudioTracks, favoriteSongs]);

  const videoList = useMemo(() => {
    return playableVideoTracks.map((mediaFile) => {
      const track = mapMediaFileToTrack(mediaFile);
      return {
        id: track.id,
        title: track.title,
        description: 'description',
        duration: 200,
        thumbnail: track.coverArt,
        genre: ['Action', 'Adventure'],
        isFavorite: favoriteVideos.includes(track.id),
        year: 2013,
        rating: 4.2,
      };
    });
  }, [playableVideoTracks, favoriteVideos]);

  if (isFetchingMedia) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress size={40} />
        <Typography
          variant="h6"
          sx={{ ml: 2, color: theme.palette.text.secondary }}
        >
          Loading media files...
        </Typography>
      </Box>
    );
  }

  const noPlayableMedia = playableAudioTracks.length === 0 && playableVideoTracks.length === 0;

  if (fetchMediaError) {
    return (
      <Alert severity="error">Error loading media: {fetchMediaError}</Alert>
    );
  }

  if (noPlayableMedia) {
    return (
      <Alert severity="info">
        No playable audio or video files found. Upload some via the AI Editor or
        backend.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Good evening
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
        All Available Audio Tracks
      </Typography>
      <SongList
        songs={audioList}
        onPlay={handlePlayAudio}
        onFavorite={toggleFavoriteSong}
        onAction={handleSongAction}
      />

      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4, mb: 2 }}>
        All Available Video Tracks
      </Typography>
      <VideoList
        videos={videoList}
        onPlay={handlePlayVideo}
        onFavorite={toggleFavoriteVideo}
        onAction={handleVideoAction}
      />
    </Box>
  );
};

export default SpotifyHomePage;
