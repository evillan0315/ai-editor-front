import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  SxProps,
  Theme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import GifIcon from '@mui/icons-material/Gif';

import VideocamIcon from '@mui/icons-material/Videocam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ImageIcon from '@mui/icons-material/Image';

import { RecordingItem, SortField, SortOrder } from './types/recording';
import { useStore } from '@nanostores/react';
import {
  recordingsListStore,
  recordingsSortByStore,
  recordingsSortOrderStore,
  setRecordingsSortBy,
  setRecordingsSortOrder,
  setRecordingsPage,
} from './stores/recordingStore';

interface RecordingsTableProps {
  onPlay: (recording: RecordingItem) => void;
  onDelete: (id: string) => void;
  onView: (recording: RecordingItem) => void;
  onConvertToGif: (recording: RecordingItem) => void;
}

const tableContainerSx: SxProps<Theme> = (theme) => ({
  borderRadius: '8px',
  boxShadow: theme.shadows[3],
  backgroundColor: theme.palette.background.paper,
});

const tableHeadSx: SxProps<Theme> = (theme) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.primary.light,
});

const tableHeaderCellSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  padding: theme.spacing(2),
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const tableBodyRowSx: SxProps<Theme> = (theme) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
});

const tableBodyCellSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const dialogTitleSx: SxProps<Theme> = (theme) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
});

const getRecordingTypeIcon = (type: string) => {
  switch (type) {
    case 'screenRecord':
      return <VideocamIcon fontSize="small" />;
    case 'cameraRecord':
      return <CameraAltIcon fontSize="small" />;
    case 'screenShot':
      return <ImageIcon fontSize="small" />;
    default:
      return null;
  }
};

const RecordingsTable: React.FC<RecordingsTableProps> = ({
  onPlay,
  onDelete,
  onView,
  onConvertToGif,
}) => {
  const theme = useTheme();
  const recordings = useStore(recordingsListStore);
  const sortBy = useStore(recordingsSortByStore);
  const sortOrder = useStore(recordingsSortOrderStore);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<string | null>(null);
  const [recordingNameToDelete, setRecordingNameToDelete] = useState<string | null>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setRecordingsSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setRecordingsSortBy(field);
      setRecordingsSortOrder('desc');
    }
    setRecordingsPage(0);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setRecordingToDelete(id);
    setRecordingNameToDelete(name);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (recordingToDelete) {
      onDelete(recordingToDelete);
    }
    setOpenConfirmDialog(false);
    setRecordingToDelete(null);
    setRecordingNameToDelete(null);
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setRecordingToDelete(null);
    setRecordingNameToDelete(null);
  };

  return (
    <TableContainer component={Paper} sx={tableContainerSx(theme)}>
      <Table className="min-w-full">
        <TableHead sx={tableHeadSx(theme)}>
          <TableRow>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => handleSort('name')}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => handleSort('type')}
            >
              Type {sortBy === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => handleSort('sizeBytes')}
            >
              Size {sortBy === 'sizeBytes' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell
              sx={tableHeaderCellSx(theme)}
              onClick={() => handleSort('createdAt')}
            >
              Created At{' '}
              {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell sx={{ ...tableHeaderCellSx(theme), textAlign: 'right' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ backgroundColor: theme.palette.background.default }}>
          {recordings.map((recording) => (
            <TableRow key={recording.id} sx={tableBodyRowSx(theme)}>
              <TableCell sx={tableBodyCellSx(theme)}>
                {recording.name}
              </TableCell>
              <TableCell sx={tableBodyCellSx(theme)}>
                <Tooltip title={recording.type}>
                  <Box className="flex items-center gap-1">
                    {getRecordingTypeIcon(recording.type)}
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell sx={tableBodyCellSx(theme)}>
                {formatBytes(recording.sizeBytes)}
              </TableCell>
              <TableCell sx={tableBodyCellSx(theme)}>
                {new Date(recording.createdAt).toLocaleString()}
              </TableCell>
              <TableCell sx={{ ...tableBodyCellSx(theme), textAlign: 'right' }}>
                <Box className="flex justify-end space-x-2">
                  {recording.type === 'screenRecord' &&
                    !recording.data?.animatedGif && (
                      <IconButton
                        onClick={() => onConvertToGif(recording)}
                        color="primary"
                        title="Convert to GIF"
                      >
                        <GifIcon />
                      </IconButton>
                    )}
                  {(recording.type === 'screenRecord' ||
                    recording.type === 'cameraRecord') && (
                    <IconButton
                      onClick={() => onPlay(recording)}
                      color="primary"
                      title="Play Recording"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  {recording.type === 'screenShot' && (
                    <IconButton
                      onClick={() => onPlay(recording)}
                      color="primary"
                      title="View Screenshot"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  {recording.data?.animatedGif && (
                    <IconButton
                      onClick={() => onPlay(recording)}
                      color="primary"
                      title="View Animated GIF"
                    >
                      <GifIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => onView(recording)}
                    color="info"
                    title="View Details"
                  >
                    <InfoIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(recording.id, recording.name)}
                    color="error"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={dialogTitleSx(theme)}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the recording "{recordingNameToDelete}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
};

export { RecordingsTable };
