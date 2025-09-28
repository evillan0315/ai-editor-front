// src/components/recording/RecordingsTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableSortLabel,
} from '@mui/material';
import { Delete, Edit, PlayArrow, Info } from '@mui/icons-material';
import { RecordingItem } from './Recording';

export interface RecordingsTableProps {
  recordings: RecordingItem[];
  onPlay: (record: RecordingItem) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (recording: RecordingItem) => void; // New
  onSort: (field: 'name' | 'createdAt' | 'type' | 'status') => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function RecordingsTable({
  recordings,
  onPlay,
  onEdit,
  onDelete,
  onView,
  onSort,
  sortBy,
  sortOrder,
}: RecordingsTableProps) {
  const renderHeaderCell = (
    label: string,
    field: 'name' | 'createdAt' | 'type' | 'status',
  ) => (
    <TableCell sortDirection={sortBy === field ? sortOrder : false}>
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? sortOrder : 'asc'}
        onClick={() => onSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {renderHeaderCell('Name', 'name')}
            {renderHeaderCell('Created', 'createdAt')}
            {renderHeaderCell('Type', 'type')}
            {renderHeaderCell('Status', 'status')}
            <TableCell align="right">Size</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recordings.map((rec) => (
            <TableRow key={rec.id} hover>
              <TableCell>{rec.name}</TableCell>
              <TableCell>{new Date(rec.createdAt).toLocaleString()}</TableCell>
              <TableCell>{rec.type}</TableCell>
              <TableCell>{rec.status}</TableCell>
              <TableCell align="right">
                {(rec.sizeBytes / 1024).toFixed(1)} KB
              </TableCell>
              <TableCell align="right">
                <IconButton aria-label="play" onClick={() => onPlay(rec)}>
                  <PlayArrow />
                </IconButton>
                <IconButton aria-label="edit" onClick={() => onEdit(rec.id)}>
                  <Edit />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  onClick={() => onDelete(rec.id)}
                >
                  <Delete />
                </IconButton>
                <IconButton aria-label="view info" onClick={() => onView(rec)}>
                  <Info />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
