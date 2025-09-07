import { map } from 'nanostores';

interface SpotifyState {
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    album: string;
    coverArt: string;
    duration: number; // in seconds
  } | null;
  isPlaying: boolean;
  progress: number; // Current playback position in seconds
  volume: number; // 0-100
  shuffle: boolean;
  repeat: 'off' | 'track' | 'context';
  playlist: any[]; // Placeholder for current playlist/queue
  loading: boolean;
  error: string | null;
}

export const spotifyStore = map<SpotifyState>({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  volume: 75,
  shuffle: false,
  repeat: 'off',
  playlist: [],
  loading: false,
  error: null,
});

// Example actions (would be expanded later)
export const setCurrentTrack = (track: SpotifyState['currentTrack']) => {
  spotifyStore.setKey('currentTrack', track);
  spotifyStore.setKey('isPlaying', true); // Assume playing when new track is set
  spotifyStore.setKey('progress', 0);
};

export const togglePlayPause = () => {
  spotifyStore.setKey('isPlaying', !spotifyStore.get().isPlaying);
};

export const setPlaybackProgress = (progress: number) => {
  spotifyStore.setKey('progress', progress);
};

export const setVolume = (volume: number) => {
  spotifyStore.setKey('volume', volume);
};

export const toggleShuffle = () => {
  spotifyStore.setKey('shuffle', !spotifyStore.get().shuffle);
};

export const toggleRepeat = () => {
  const currentRepeat = spotifyStore.get().repeat;
  let newRepeat: 'off' | 'track' | 'context' = 'off';
  if (currentRepeat === 'off') {
    newRepeat = 'context';
  } else if (currentRepeat === 'context') {
    newRepeat = 'track';
  }
  spotifyStore.setKey('repeat', newRepeat);
};

export const setLoading = (loading: boolean) => {
  spotifyStore.setKey('loading', loading);
};

export const setError = (error: string | null) => {
  spotifyStore.setKey('error', error);
};
