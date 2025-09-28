import React from 'react';
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
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import GifIcon from '@mui/icons-material/Gif';

import { RecordingItem } from './Recording'; // Re-exporting RecordingItem as RecordingItem

interface RecordingsTableProps {
  recordings: RecordingItem[];
  onPlay: (recording: RecordingItem) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (recording: RecordingItem) => void;
  onSort: (field: keyof RecordingItem) => void;
  sortBy: keyof RecordingItem;
  sortOrder: 'asc' | 'desc';
  onConvertToGif: (recording: RecordingItem) => void; // New prop
}

const RecordingsTable: React.FC<RecordingsTableProps> = ({
  recordings,
  onPlay,
  onEdit,
  onDelete,
  onView,
  onSort,
  sortBy,
  sortOrder,
  onConvertToGif,
}) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <TableContainer component={Paper} className="rounded-lg shadow-lg">
      <Table className="min-w-full">
        <TableHead className="bg-gray-800">
          <TableRow>
            <TableCell className="cursor-pointer text-gray-300 font-semibold p-4"
              onClick={() => onSort('name')}>
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell className="cursor-pointer text-gray-300 font-semibold p-4"
              onClick={() => onSort('type')}>
              Type {sortBy === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell className="cursor-pointer text-gray-300 font-semibold p-4"
              onClick={() => onSort('status')}>
              Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell className="cursor-pointer text-gray-300 font-semibold p-4"
              onClick={() => onSort('sizeBytes')}>
              Size {sortBy === 'sizeBytes' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell className="cursor-pointer text-gray-300 font-semibold p-4"
              onClick={() => onSort('createdAt')}>
              Created At {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
            </TableCell>
            <TableCell className="text-gray-300 font-semibold p-4 text-right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody className="bg-gray-900">
          {recordings.map((recording) => (
            <TableRow key={recording.id} className="hover:bg-gray-800">
              <TableCell className="text-white p-4">{recording.name}</TableCell>
              <TableCell className="text-white p-4">{recording.type}</TableCell>
              <TableCell className="text-white p-4">{recording.status}</TableCell>
              <TableCell className="text-white p-4">
                {formatBytes(recording.sizeBytes)}
              </TableCell>
              <TableCell className="text-white p-4">
                {new Date(recording.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-right p-4">
                <Box className="flex justify-end space-x-2">
                  {recording.type === 'screenRecord' && !recording.data?.animatedGif && (
                    <IconButton
                      onClick={() => onConvertToGif(recording)}
                      color="primary"
                      title="Convert to GIF"
                    >
                      <GifIcon />
                    </IconButton>
                  )}
                  {(recording.type === 'screenRecord' || recording.type === 'cameraRecord') && (
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
                      <PlayArrowIcon /> {/* Re-using PlayArrow for consistency, but means 'view' */}
                    </IconButton>
                  )}
                  {recording.data?.animatedGif && (
                    <IconButton
                      onClick={() => onPlay({ ...recording, path: recording.data.animatedGif!, type: 'animatedGif' })} // Pass a modified recording item for GIF playback
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
                    onClick={() => onEdit(recording.id)}
                    color="secondary"
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(recording.id)}
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
    </TableContainer>
  );
};

export { RecordingsTable };
