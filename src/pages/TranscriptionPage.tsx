import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import TranscribeIcon from '@mui/icons-material/Transcribe';
import { useStore } from '@nanostores/react';
import { $mediaStore, fetchingMediaFiles } from '@/stores/mediaStore';
import { getFileStreamUrl } from '@/api/media';

import { TranscriptionPlayer } from '@/components/TranscriptionPlayer/TranscriptionPlayer'; // Correct import path
import { FileType } from '@/types'; // Import MediaFileResponseDto and FileType

interface TranscriptionPageProps {}

const TranscriptionPage: React.FC<TranscriptionPageProps> = () => {
  const theme = useTheme();
  const { allAvailableMediaFiles, isFetchingMedia, fetchMediaError } =
    useStore($mediaStore);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all media files when the component mounts if not already fetched
    if (
      allAvailableMediaFiles.length === 0 &&
      !isFetchingMedia &&
      !fetchMediaError
    ) {
      fetchMediaForPurpose(
        { page: 1, pageSize: 200, fileType: FileType.AUDIO },
        'general',
        true,
      );
    }
  }, [allAvailableMediaFiles.length, isFetchingMedia, fetchMediaError]);

  const audioFiles = useMemo(
    () =>
      allAvailableMediaFiles.filter((file) => file.fileType === FileType.AUDIO),
    [allAvailableMediaFiles],
  );

  const handleFileChange = (event: SelectChangeEvent<string>) => {
    setSelectedFileId(event.target.value);
  };

  const selectedAudioFile = useMemo(
    () => audioFiles.find((file) => file.id === selectedFileId),
    [audioFiles, selectedFileId],
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <TranscribeIcon
          sx={{ fontSize: 60, color: theme.palette.secondary.main }}
        />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Audio Transcription
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Upload or select an audio file to generate a text transcription.
        </Typography>

        <Box sx={{ width: '100%', maxWidth: 600, mt: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              id="audio-file-select-label"
              sx={{ color: theme.palette.text.secondary }}
            >
              Select Audio File
            </InputLabel>
            <Select
              labelId="audio-file-select-label"
              id="audio-file-select"
              value={selectedFileId || ''}
              label="Select Audio File"
              onChange={handleFileChange}
              disabled={isFetchingMedia}
              sx={{ color: theme.palette.text.primary }}
              inputProps={{ sx: { color: theme.palette.text.primary } }}
            >
              {isFetchingMedia ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 2 }} /> Loading files...
                </MenuItem>
              ) : audioFiles.length === 0 ? (
                <MenuItem disabled>
                  No audio files found. Please scan media.
                </MenuItem>
              ) : (
                audioFiles.map((file) => (
                  <MenuItem key={file.id} value={file.id}>
                    {file.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {fetchMediaError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading media files: {fetchMediaError}
            </Alert>
          )}

          {selectedAudioFile ? (
            <TranscriptionPlayer
              fileId={selectedAudioFile.id}
              audioUrl={getFileStreamUrl(selectedAudioFile.path)}
              title={`Transcribing: ${selectedAudioFile.name}`}
            />
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Please select an audio file from the dropdown above to begin
              transcription.
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TranscriptionPage;
