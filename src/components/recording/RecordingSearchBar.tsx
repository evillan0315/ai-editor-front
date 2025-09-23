// Source: src/components/recording/RecordingSearchBar.tsx
import React from 'react';
import { Box, TextField, Button, MenuItem } from '@mui/material';

export interface RecordingSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
  typeOptions?: string[];
}

export const RecordingSearchBar: React.FC<RecordingSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  typeFilter,
  onTypeFilterChange,
  typeOptions = [],
}) => {
  return (
    <Box className="flex gap-2 items-center flex-wrap">
      <TextField
        label="Search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ minWidth: 200 }}
      />
      {typeOptions.length > 0 && onTypeFilterChange && (
        <TextField
          label="Type"
          select
          value={typeFilter || ''}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          size="small"
        >
          <MenuItem value="">All</MenuItem>
          {typeOptions.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Button variant="outlined" onClick={onSearch}>
        Apply
      </Button>
    </Box>
  );
};
