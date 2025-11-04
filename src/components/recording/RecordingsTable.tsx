import React, { useState } from 'react';
import {
  IconButton,
  Box,
  SxProps,
  Theme,
  Tooltip,
  Button,
  DialogContentText,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import GifIcon from '@mui/icons-material/Gif';
import StopCircle from '@mui/icons-material/StopCircle';
import ShareIcon from '@mui/icons-material/Share'; // New import
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'; // New import
import MoreVertIcon from '@mui/icons-material/MoreVert';

import VideocamIcon from '@mui/icons-material/Videocam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ImageIcon from '@mui/icons-material/Image';

import { RecordingItem, SortField, SortOrder, RecordingType } from './types/recording';
// Removed useStore imports as sortBy/sortOrder are now props

import { TableList, ITableColumn, Order } from '@/components/ui/views/table/TableList'; // Import TableList and Order type
import { showDialog, hideDialog } from '@/stores/dialogStore';
import { DropdownActionMenu } from '@/components/ui/dropdown';
import { GlobalAction } from '@/types/app';

interface RecordingsTableProps {
  recordings: RecordingItem[];
  total: number; // New prop for pagination
  page: number; // New prop for pagination
  rowsPerPage: number; // New prop for pagination
  onPageChange: (newPage: number) => void; // New prop for pagination
  onRowsPerPageChange: (rowsPerPage: number) => void; // New prop for pagination
  onPlay: (recording: RecordingItem) => void;
  onDelete: (id: string) => void;
  onView: (recording: RecordingItem) => void;
  onConvertToGif: (recording: RecordingItem) => void;
  onStopRecording: (id: string, type: RecordingType) => void;
  onShare: (recording: RecordingItem) => void; // New prop
  onUploadToGoogleDrive: (recording: RecordingItem) => void; // New prop
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField, order: SortOrder) => void; // Callback to notify parent of sort change
}

// Styles for the stop recording icon, matching color of RecordingControls stop button
const errorIconColorSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.error.main,
});

const stopRecordingIconSx: SxProps<Theme> = (theme) => ({
  ...errorIconColorSx(theme),
  fontSize: '1.5rem', // Slightly larger for emphasis, fits table cell
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  padding: 0,
  cursor: 'pointer',
});

const RecordingsTable: React.FC<RecordingsTableProps> = ({
  recordings,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onPlay,
  onDelete,
  onView,
  onConvertToGif,
  onStopRecording,
  onShare,
  onUploadToGoogleDrive,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const theme = useTheme();
  // Removed useStore calls for sortBy and sortOrder, now from props

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // This function now directly maps to the onSort prop provided by the parent
  const handleTableListSort = (columnId: string, direction: Order) => {
    onSort(columnId as SortField, direction as SortOrder);
  };

  const handleDeleteClick = (id: string, name: string) => {
    showDialog({
      title: (
        <Box
          sx={{
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            p: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
            Confirm Deletion
          </Typography>
        </Box>
      ),
      content: (
        <DialogContentText id="alert-dialog-description" sx={{ p: 2 }}>
          Are you sure you want to delete the recording \"{name}\" This action cannot be undone."
        </DialogContentText>
      ),
      actions: (
        <>
          <Button onClick={hideDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDelete(id);
              hideDialog();
            }}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </>
      ),
      maxWidth: 'xs',
      fullWidth: true,
      showCloseButton: true,
    });
  };

  const columns: ITableColumn<RecordingItem>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (recording) => recording.name,
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      render: (recording) => {
        if (recording.status === 'recording') {
          return (
            <Box className="flex items-center justify-start gap-1">
              <Tooltip title={`Stop ${recording.type === 'screenRecord' ? 'Screen' : 'Camera'} Recording`}>
                <IconButton
                  aria-label={`stop ${recording.type} recording`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click from firing
                    onStopRecording(recording.id, recording.type);
                  }}
                  sx={stopRecordingIconSx(theme)}
                >
                  <StopCircle fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        }

        let icon = null;
        let tooltipText = '';
        switch (recording.type) {
          case 'screenRecord':
            icon = <VideocamIcon fontSize="small" />;
            tooltipText = 'Screen Recording';
            break;
          case 'cameraRecord':
            icon = <CameraAltIcon fontSize="small" />;
            tooltipText = 'Camera Recording';
            break;
          case 'screenShot':
            icon = <ImageIcon fontSize="small" />;
            tooltipText = 'Screenshot';
            break;
          default:
            icon = null;
            tooltipText = '';
        }

        return (
          <Box className="flex items-center gap-1">
            {icon && <Tooltip title={tooltipText}>{icon}</Tooltip>}
          </Box>
        );
      },
    },
    {
      id: 'sizeBytes',
      label: 'Size',
      sortable: true,
      render: (recording) => formatBytes(recording.sizeBytes),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      render: (recording) => new Date(recording.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      render: (recording) => {
        const dropdownActions: GlobalAction[] = [
          {
            id: `share-${recording.id}`,
            label: 'Share Recording',
            icon: <ShareIcon />,
            action: () => onShare(recording),
            color: 'secondary',
            tooltip: 'Share Recording',
          },
          {
            id: `upload-${recording.id}`,
            label: 'Upload to Google Drive',
            icon: <DriveFileMoveIcon />,
            action: () => onUploadToGoogleDrive(recording),
            color: 'success',
            tooltip: 'Upload to Google Drive',
          },
          {
            id: `details-${recording.id}`,
            label: 'Edit Details',
            icon: <EditIcon />,
            action: () => onView(recording),
            color: 'info',
            tooltip: 'Edit Details',
          },
          {
            id: `delete-${recording.id}`,
            label: 'Delete',
            icon: <DeleteIcon />,
            action: () => handleDeleteClick(recording.id, recording.name),
            color: 'error',
            tooltip: 'Delete Recording',
          },
        ];

        if (recording.type === 'screenRecord' && !recording.data?.animatedGif && recording.status !== 'recording') {
          dropdownActions.unshift({
            id: `convertToGif-${recording.id}`,
            label: 'Convert to GIF',
            icon: <GifIcon />,
            action: () => onConvertToGif(recording),
            color: 'primary',
            tooltip: 'Convert to GIF',
          });
        }

        if (((recording.type === 'screenRecord' || recording.type === 'cameraRecord') && recording.status !== 'recording') || recording.type === 'screenShot' || recording.data?.animatedGif) {
          dropdownActions.unshift({
            id: `play-${recording.id}`,
            label: 'Play/View',
            icon: (recording.data?.animatedGif || recording.type === 'screenShot') ? <ImageIcon /> : <PlayArrowIcon />,
            action: () => onPlay(recording),
            color: 'primary',
            tooltip: (recording.data?.animatedGif || recording.type === 'screenShot') ? 'View Media' : 'Play Recording',
          });
        }

        return (
          <Box className="flex justify-end space-x-2">
            <DropdownActionMenu
              actions={dropdownActions}
              iconButtonProps={{ size: 'small', color: 'inherit' }}
              menuTrigger={<IconButton size="small" color="inherit" title="More Actions"><MoreVertIcon /></IconButton>}
              id={`recording-actions-${recording.id}`}
            />
          </Box>
        );
      },
    },
  ];

  return (
    <TableList
      columns={columns}
      data={recordings}
      orderBy={sortBy} 
      order={sortOrder}
      onSortChange={handleTableListSort}
      rowCount={total}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={(event, newPage) => onPageChange(newPage)} // Pass newPage directly
      onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))} // Pass parsed value
      // Custom styling for the TableList container to match original Paper styling
      tableContainerSx={(theme) => ({
        borderRadius: '8px',
        boxShadow: theme.shadows[3],
        backgroundColor: theme.palette.background.paper,
      })}
    />
  );
};

export { RecordingsTable };
